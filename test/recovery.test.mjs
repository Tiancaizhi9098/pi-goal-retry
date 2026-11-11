import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { harness, truncation, DEFAULT_GOAL_SETTINGS, normalizeGoalSettings, providerErrorDisposition,
  providerRetryDelay, GoalCommandController, normalizeLoadedGoal, createGoal, root, hostRoot } from "./helpers.mjs";

function clock(t) { t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 1_000_000 }); }

test("old settings acquire the requested 10-retry defaults; invalid retry settings are rejected", () => {
  assert.equal(normalizeGoalSettings({}).providerRetry.maxRetries, 10);
  for (const providerRetry of [{maxRetries:-1}, {maxRetries:1.5}, {maxRetries:1001}, {baseDelayMs:1}, {maxDelayMs:1}, {enabled:"true"}, {enabled:null}, {maxRetries:null}]) {
    assert.equal(normalizeGoalSettings({providerRetry}), undefined);
  }
});

test("Antigravity truncation and unknown errors recover; permanent and quota failures remain distinct", () => {
  const error = (errorMessage, content = []) => ({role:"assistant", stopReason:"error", errorMessage, content});
  assert.equal(providerErrorDisposition(error(truncation)), "retry");
  assert.equal(providerErrorDisposition(error("Unexpected relay disconnect")), "retry");
  assert.equal(providerErrorDisposition(error("")), "retry");
  assert.equal(providerErrorDisposition(error("401 Unauthorized")), "permanent");
  assert.equal(providerErrorDisposition(error("insufficient_quota")), "usage");
  assert.equal(providerErrorDisposition(error(truncation, [{type:"text",text:"This request was blocked by Gemini's filters."}])), "permanent");
});

test("backoff grows from 10 seconds to a 120-second cap", () => {
  assert.deepEqual([1,2,3,4,5,10].map(n => providerRetryDelay(DEFAULT_GOAL_SETTINGS.providerRetry,n)), [10_000,20_000,40_000,80_000,120_000,120_000]);
});

test("an unclassified failure schedules one retry and dispatches only when the deadline arrives", async t => {
  clock(t);
  const h = harness(t);
  await h.response(truncation);
  assert.equal(h.runtime.activeGoal.status, "active");
  assert.equal(h.runtime.activeGoal.providerRetryFailures, 1);
  assert.equal(h.runtime.activeGoal.waiting.resumeAt, Date.now()+10_000);
  assert.equal(h.sent.length, 0);
  t.mock.timers.tick(9_999);
  assert.equal(h.sent.length, 0);
  t.mock.timers.tick(1);
  assert.equal(h.sent.length, 1);
  await h.emit("agent_settled");
  await h.emit("agent_settled");
  assert.equal(h.sent.length, 1);
});

test("ten consecutive retries are allowed; the eleventh failed response pauses and cancels native work", async t => {
  clock(t);
  const h = harness(t);
  for (let failures=1; failures<=10; failures++) {
    await h.response(truncation);
    assert.equal(h.runtime.activeGoal.waiting.providerError.attempt, failures);
    t.mock.timers.tick(providerRetryDelay(h.runtime.settings.providerRetry, failures));
    assert.equal(h.sent.length, failures);
    h.runtime.continuationDelivery = undefined;
  }
  await h.response(truncation);
  assert.equal(h.runtime.activeGoal.status, "paused");
  assert.equal(h.runtime.activeGoal.providerRetryFailures, 11);
  assert.ok(h.aborted > 0);
  t.mock.timers.tick(500_000);
  assert.equal(h.sent.length, 10);
});

test("native retries use the same failure counter before fallback recovery", async t => {
  clock(t);
  const h = harness(t);
  for(let i=0;i<4;i++) await h.response("503 Service Unavailable", {settled:false});
  await h.emit("agent_settled");
  assert.equal(h.runtime.activeGoal.providerRetryFailures, 4);
  assert.equal(h.runtime.activeGoal.waiting.providerError.attempt, 4);
  assert.equal(h.runtime.activeGoal.waiting.resumeAt, Date.now()+80_000);
});

test("a successful response resets consecutive failures", async t => {
  clock(t);
  const h=harness(t);
  await h.response(truncation);
  h.runtime.clearGoalWait(h.ctx,h.runtime.activeGoal.id);
  await h.response(undefined);
  assert.equal(h.runtime.activeGoal.providerRetryFailures,0);
  h.runtime.cancelContinuationWork();
  await h.response(truncation);
  assert.equal(h.runtime.activeGoal.waiting.providerError.attempt,1);
});

test("manual pause cancels the pending retry", async t => {
  clock(t);
  const h=harness(t);
  await h.response(truncation);
  new GoalCommandController(h.runtime).pauseGoal(h.ctx);
  t.mock.timers.tick(500_000);
  assert.equal(h.runtime.activeGoal.status,"paused");
  assert.equal(h.sent.length,0);
});

test("reload restores the original deadline and failure counter instead of extending the wait", async t => {
  clock(t);
  const h=harness(t);
  await h.response(truncation);
  const deadline=h.runtime.activeGoal.waiting.resumeAt;
  await h.emit("session_shutdown");
  t.mock.timers.tick(4_000);
  await h.emit("session_start");
  assert.equal(h.runtime.activeGoal.providerRetryFailures,1);
  assert.equal(h.runtime.activeGoal.waiting.resumeAt,deadline);
  t.mock.timers.tick(6_000);
  assert.equal(h.sent.length,1);
});

test("reload during native backoff schedules recovery with the saved failure count", async t => {
  clock(t);
  const h=harness(t);
  await h.response("503 Service Unavailable",{settled:false});
  assert.equal(h.runtime.activeGoal.waiting,undefined);
  await h.emit("session_shutdown");
  await h.emit("session_start");
  assert.equal(h.runtime.activeGoal.providerRetryFailures,1);
  assert.equal(h.runtime.activeGoal.waiting.providerError.attempt,1);
  t.mock.timers.tick(10_000);
  assert.equal(h.sent.length,1);
});

test("busy or queued work delays a due retry until the next settled idle boundary", async t => {
  clock(t);
  const h=harness(t);
  await h.response(truncation);
  h.ctx.hasPendingMessages=()=>true;
  t.mock.timers.tick(10_000);
  assert.equal(h.sent.length,0);
  h.ctx.hasPendingMessages=()=>false;
  await h.emit("agent_settled");
  assert.equal(h.sent.length,1);
});

test("switching models pauses recovery and cancels the old timer", async t => {
  clock(t);
  const h=harness(t);
  await h.response(truncation);
  h.ctx.model={...h.ctx.model,id:"another-model"};
  await h.emit("model_select");
  t.mock.timers.tick(10_000);
  assert.equal(h.runtime.activeGoal.status,"paused");
  assert.equal(h.sent.length,0);
});

test("a token budget remains authoritative over retry recovery", async t => {
  clock(t);
  const h=harness(t);
  h.runtime.activeGoal.tokenBudget=1;
  await h.response(truncation);
  assert.equal(h.runtime.activeGoal.status,"budget_limited");
  t.mock.timers.tick(500_000);
  assert.equal(h.sent.length,0);
});

test("explicit Gemini filter responses pause instead of being treated as a transport failure", async t => {
  clock(t);
  const h=harness(t);
  await h.response(truncation,{content:[{type:"text",text:"This request was blocked by Gemini's filters."}]});
  assert.equal(h.runtime.activeGoal.status,"paused");
  t.mock.timers.tick(500_000);
  assert.equal(h.sent.length,0);
});

test("retry disabled retains upstream waiting behavior", async t => {
  clock(t);
  const h=harness(t);
  h.runtime.settings.providerRetry.enabled=false;
  await h.response(truncation);
  assert.equal(h.runtime.activeGoal.status,"active");
  assert.equal(h.runtime.activeGoal.waiting.resumeAt,undefined);
});

test("zero retry allowance stops after the initial failed response", async t => {
  clock(t);
  const h=harness(t);
  h.runtime.settings.providerRetry.maxRetries=0;
  await h.response(truncation);
  assert.equal(h.runtime.activeGoal.status,"paused");
  assert.equal(h.sent.length,0);
});

test("manual /goal resume grants a new provider retry allowance", async t => {
  clock(t);
  const h=harness(t);
  await h.response(truncation);
  h.runtime.activeGoal.providerRetryFailures=8;
  await new GoalCommandController(h.runtime).resumeGoal(h.ctx);
  assert.equal(h.runtime.activeGoal.providerRetryFailures,0);
  assert.equal(h.sent.length,1);
  t.mock.timers.tick(500_000);
  assert.equal(h.sent.length,1);
});

test("clear and replacement prevent stale retry delivery", async t => {
  clock(t);
  const h=harness(t);
  await h.response(truncation);
  new GoalCommandController(h.runtime).clearGoal(h.ctx);
  h.runtime.acquireWorkflow();
  h.runtime.activeGoal=createGoal("A different objective",undefined,0);
  t.mock.timers.tick(500_000);
  assert.equal(h.sent.length,0);
});

test("lowering a retry limit cancels an already scheduled attempt beyond that limit", async t => {
  clock(t);
  const h=harness(t);
  await h.response(truncation);
  h.runtime.settings.providerRetry.maxRetries=0;
  h.runtime.restoreGoalWaitTimer(h.ctx);
  t.mock.timers.tick(500_000);
  assert.equal(h.runtime.activeGoal.status,"paused");
  assert.equal(h.sent.length,0);
});

test("loaded state keeps retry metadata; invalid metadata cannot create a timer", () => {
  const goal=createGoal("Persist the test",undefined,0);
  goal.providerRetryFailures=7;
  goal.waiting={reason:"Retry",resumeAt:Date.now()+10_000,providerError:{provider:"p",model:"m",api:"a",attempt:7}};
  assert.equal(normalizeLoadedGoal(goal).waiting.providerError.attempt,7);
  goal.waiting.providerError.attempt=-1;
  assert.equal(normalizeLoadedGoal(goal).waiting,undefined);
});

test("the built fork loads through the real Pi extension loader with one /goal command", async () => {
  const {loadExtensions}=await import(pathToFileURL(resolve(hostRoot,"dist/core/extensions/loader.js")));
  const result=await loadExtensions([resolve(root,"dist/index.ts")],root);
  assert.deepEqual(result.errors,[]);
  assert.equal(result.extensions.length,1);
  assert.ok(result.extensions[0].commands.has("goal"));
  assert.equal(result.extensions[0].tools.size,3);
});
