import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { setImmediate as yieldImmediate } from "node:timers/promises";
import { hostRoot, modules, root, jiti, truncation } from "./helpers.mjs";

const sdk = await import(pathToFileURL(resolve(hostRoot,"dist/index.js")));
const {AuthStorage} = await import(pathToFileURL(resolve(hostRoot,"dist/core/auth-storage.js")));
const ai = await import(pathToFileURL(resolve(modules,"@earendil-works/pi-ai/dist/compat.js")));
const goalFactory = await jiti.import(resolve(root,"dist/index.ts"), {default:true});

async function flushUntil(predicate) {
  for(let i=0;i<500;i++) {
    if(predicate()) return;
    await yieldImmediate();
  }
  assert.ok(predicate(),"Pi did not reach the expected settled state");
}

test("real Pi AgentSession automatically retries the exact Antigravity error and obeys pause", async t => {
  const scratch = resolve(process.env.PI_GOAL_TEST_WORKDIR || tmpdir());
  await mkdir(scratch,{recursive:true});
  const temp = await mkdtemp(resolve(scratch,"pi-goal-retry-sdk-"));
  const settingsPath = resolve(temp,"pi-goal.json");
  await writeFile(settingsPath,JSON.stringify({providerRetry:{maxRetries:10}}));
  const settingsManager = sdk.SettingsManager.inMemory({retry:{enabled:false},compaction:{enabled:false}});
  const modelRuntime = await sdk.ModelRuntime.create({credentials:AuthStorage.inMemory(),modelsPath:null,refreshOnCreate:false,modelsStorePath:resolve(temp,"models-cache.json")});
  modelRuntime.registerProvider("local-retry-test",{
    api:"openai-completions",baseUrl:"http://127.0.0.1:1/unused",apiKey:"local-test-only",
    models:[{id:"mock",name:"Mock",reasoning:false,input:["text"],cost:{input:0,output:0,cacheRead:0,cacheWrite:0},contextWindow:100000,maxTokens:1000}],
  });
  const loader = new sdk.DefaultResourceLoader({
    cwd:temp,agentDir:temp,settingsManager,noExtensions:true,noSkills:true,noThemes:true,noContextFiles:true,noPromptTemplates:true,
    extensionFactories:[pi=>goalFactory(pi,{settingsPath})],
  });
  await loader.reload();
  const sessionManager=sdk.SessionManager.inMemory(temp);
  const {session,extensionsResult}=await sdk.createAgentSession({cwd:temp,agentDir:temp,settingsManager,modelRuntime,
    model:modelRuntime.getModel("local-retry-test","mock"),sessionManager,resourceLoader:loader,noTools:"builtin"});
  t.after(async()=>{
    await session.abort();
    session.dispose();
    assert.ok(temp.startsWith(scratch+sep));
    await rm(temp,{recursive:true,force:true});
  });
  assert.deepEqual(extensionsResult.errors,[]);
  let calls=0;
  let currentError=truncation;
  session.agent.streamFunction=()=>{
    calls++;
    const stream=ai.createAssistantMessageEventStream();
    queueMicrotask(()=>{
      const message={role:"assistant",api:"openai-completions",provider:"local-retry-test",model:"mock",content:[],
        stopReason:"error",errorMessage:currentError,timestamp:Date.now(),
        usage:{input:1,output:0,cacheRead:0,cacheWrite:0,totalTokens:1,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}}};
      stream.push({type:"error",reason:"error",error:message});
      stream.end();
    });
    return stream;
  };
  const currentGoal=()=>sessionManager.getBranch().filter(entry=>entry.type==="custom"&&entry.customType==="goal-state").at(-1)?.data?.goal;
  t.mock.timers.enable({apis:["Date","setTimeout"],now:1_000_000});
  await session.prompt("/goal Finish the isolated retry integration test");
  await flushUntil(()=>!!currentGoal()?.waiting?.providerError);
  assert.equal(calls,1);
  assert.equal(currentGoal().providerRetryFailures,1);
  t.mock.timers.tick(10_000);
  await flushUntil(()=>calls===2&&currentGoal()?.waiting?.providerError?.attempt===2);
  assert.equal(calls,2);
  assert.equal(currentGoal().waiting.resumeAt,Date.now()+20_000);
  await session.prompt("/goal pause");
  t.mock.timers.tick(500_000);
  await yieldImmediate();
  assert.equal(currentGoal().status,"paused");
  assert.equal(calls,2);

  // Exercise the host's real native retry loop as well as the fork's timer.
  settingsManager.setRetryEnabled(true);
  currentError="503 Service Unavailable";
  await session.prompt("/goal clear");
  await session.prompt("/goal Verify the shared retry cap with native Pi retries enabled");
  await flushUntil(()=>calls>2);
  for(let tick=0;tick<80&&currentGoal()?.status==="active";tick++) {
    t.mock.timers.tick(120_000);
    await yieldImmediate();
  }
  await flushUntil(()=>currentGoal()?.status==="paused");
  assert.equal(calls,13,"initial request plus exactly ten retries; native retries must not multiply the allowance");
  assert.equal(currentGoal().providerRetryFailures,11);
});
