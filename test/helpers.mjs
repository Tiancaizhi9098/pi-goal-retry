import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const agentDir = process.env.PI_CODING_AGENT_DIR || resolve(process.env.USERPROFILE || process.env.HOME, ".pi/agent");
let resolvedHostRoot;
try { resolvedHostRoot = resolve(dirname(fileURLToPath(import.meta.resolve("@earendil-works/pi-coding-agent"))), ".."); }
catch {
  const version = readFileSync(resolve(agentDir, "install/current-version"), "utf8").trim();
  resolvedHostRoot = resolve(agentDir, "install/releases", version, "node_modules/@earendil-works/pi-coding-agent");
}
export const hostRoot = resolvedHostRoot;
export const modules = resolve(hostRoot, "../..");
const hostRequire = createRequire(resolve(hostRoot, "package.json"));
const { createJiti } = hostRequire("jiti");
export const jiti = createJiti(import.meta.url, {
  moduleCache: true,
  alias: {
    "@earendil-works/pi-ai": resolve(hostRoot, "dist/core/extensions/pi-ai-extension-view.js"),
    "@earendil-works/pi-coding-agent": resolve(hostRoot, "dist/index.js"),
    "@earendil-works/pi-tui": resolve(modules, "@earendil-works/pi-tui/dist/index.js"),
    "@narumitw/pi-tui-kit": fileURLToPath(import.meta.resolve("@narumitw/pi-tui-kit")),
    typebox: hostRequire.resolve("typebox"),
  },
});
export const runtimeModule = await jiti.import(resolve(root, "src/runtime.ts"));
export const { GoalRuntime, createGoal } = runtimeModule;
export const { registerGoalLifecycle } = await jiti.import(resolve(root, "src/lifecycle.ts"));
export const { DEFAULT_GOAL_SETTINGS, normalizeGoalSettings } = await jiti.import(resolve(root, "src/settings.ts"));
export const { providerErrorDisposition, providerRetryDelay } = await jiti.import(resolve(root, "src/provider-error-recovery.ts"));
export const { GoalCommandController } = await jiti.import(resolve(root, "src/commands.ts"));
export const { normalizeLoadedGoal } = await jiti.import(resolve(root, "src/persistence.ts"));
const { createEventBus } = await import(pathToFileURL(resolve(hostRoot, "dist/core/event-bus.js")));

export function harness(t, restoredEntries = []) {
  const entries = structuredClone(restoredEntries);
  const handlers = new Map();
  const sent = [];
  const notifications = [];
  let aborted = 0;
  const sessionManager = {
    getSessionId: () => "retry-test-session",
    getBranch: () => entries,
    getEntries: () => entries,
  };
  const pi = {
    events: createEventBus(),
    on(name, handler) { handlers.set(name, handler); },
    appendEntry(customType, data) { entries.push({ type: "custom", customType, data }); },
    getActiveTools: () => ["goal_complete", "goal_blocked", "goal_wait"],
    sendUserMessage(prompt) { sent.push(prompt); },
    sendMessage(message) { entries.push({ type: "message", message: { role: "custom", ...message } }); },
  };
  const ctx = {
    cwd: root,
    mode: "rpc",
    sessionManager,
    model: { provider: "magpie", id: "test-antigravity", api: "openai-completions" },
    ui: { notify: (message, level) => notifications.push({message, level}), setStatus() {} },
    isIdle: () => true,
    hasPendingMessages: () => false,
    abort: () => { aborted++; },
  };
  const runtime = new GoalRuntime(pi);
  runtime.settings = structuredClone(DEFAULT_GOAL_SETTINGS);
  runtime.bindWorkflowSession(sessionManager);
  runtime.acquireWorkflow();
  runtime.activeGoal = createGoal("Finish and verify the local test task", undefined, 0);
  registerGoalLifecycle(pi, runtime, { bindSession() {}, unbindSession() {} }, { settingsPath: resolve(root, "test/missing-settings.json") });
  t?.after(() => {
    runtime.clearGoalWaitTimer();
    runtime.clearContinuationTracking();
    runtime.clearCompletionStatusTimer();
    runtime.releaseWorkflow();
  });
  async function emit(name, event = {}) { return handlers.get(name)?.(event, ctx); }
  async function response(errorMessage, options = {}) {
    const message = {
      role: "assistant", api: ctx.model.api, provider: ctx.model.provider, model: ctx.model.id,
      content: options.content ?? [], stopReason: errorMessage === undefined ? "stop" : "error",
      errorMessage, timestamp: Date.now(),
      usage: { input: 1, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 1, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
    };
    entries.push({ type: "message", message });
    runtime.beginAgentRun(runtime.activeGoal.id, "automatic");
    await emit("turn_end", { message });
    await emit("agent_end", { messages: [message] });
    if (options.settled !== false) await emit("agent_settled", { aborted: false });
    return message;
  }
  return {runtime, pi, ctx, entries, sent, notifications, handlers, emit, response, get aborted() { return aborted; }};
}

export const truncation = "Antigravity: the reply ended before it was complete";
