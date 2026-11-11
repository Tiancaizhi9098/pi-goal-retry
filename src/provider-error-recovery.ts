import type { AssistantMessageLike } from "./errors.js";
import { isGoalContextOverflow, isUsageLimitedGoalInterruption, notifyTerminal, truncateNotification } from "./errors.js";
import type { GoalRuntime, StatusContext } from "./runtime.js";
import type { ProviderRetrySettings } from "./settings.js";
import { usageLimitScope } from "./usage-limit-recovery.js";

export type ProviderErrorDisposition = "retry" | "permanent" | "context" | "usage";

/** Error messages are data; never alter the objective or ask a model to bypass a refusal. */
export function providerErrorDisposition(message: AssistantMessageLike): ProviderErrorDisposition {
  if (isGoalContextOverflow(message)) return "context";
  if (isUsageLimitedGoalInterruption(message)) return "usage";
  const error = message.errorMessage ?? "";
  const visible = (message.content ?? []).filter((part) => part.type === "text")
    .map((part) => part.type === "text" ? part.text : "").join("\n");
  const permanentError = /\b(?:401|403)\b|invalid[_ -]?api[_ -]?key|authentication (?:failed|required)|unauthorized|permission denied|invalid[_ -]?request|invalid argument|unsupported (?:model|parameter)|model (?:not found|does not exist)|\bcontent_filter\b|\b(?:SAFETY|PROHIBITED_CONTENT|BLOCKLIST)\b/i;
  const explicitFilter = /this request was blocked by Gemini['’]s filters|blocked (?:by|due to) (?:the )?(?:safety|content) (?:filter|policy)|request (?:was )?rejected.{0,30}(?:safety|content policy)/i;
  return permanentError.test(error) || explicitFilter.test(`${error}\n${visible}`) ? "permanent" : "retry";
}

export function providerRetryDelay(settings: ProviderRetrySettings, attempt: number): number {
  return Math.min(settings.maxDelayMs, settings.baseDelayMs * 2 ** Math.min(30, Math.max(0, attempt - 1)));
}

/** Uses Goal's existing persisted wait and single-flight dispatcher, never a parallel model loop. */
export class ProviderErrorRecovery {
  constructor(private readonly runtime: GoalRuntime) {}

  recordResponse(ctx: StatusContext, message: unknown) {
    const runtime = this.runtime;
    const goal = runtime.activeGoal;
    if (!goal || !runtime.ownsWorkflow(goal) || runtime.agentRunGoalId !== goal.id ||
        typeof message !== "object" || !message || !("role" in message) || message.role !== "assistant") return;
    const assistant = message as AssistantMessageLike;
    if (assistant.stopReason === "aborted") return;
    if (assistant.stopReason !== "error") {
      if (goal.providerRetryFailures) {
        goal.providerRetryFailures = 0;
        runtime.persistGoal(goal);
      }
      return;
    }
    const disposition = providerErrorDisposition(assistant);
    if (disposition === "context" || disposition === "usage") return;
    goal.providerRetryFailures = Math.min(Number.MAX_SAFE_INTEGER, (goal.providerRetryFailures ?? 0) + 1);
    runtime.recordGoalUsage(goal, ctx);
    runtime.persistGoal(goal);
    if (runtime.activeGoal !== goal || !runtime.ownsWorkflow(goal) || !runtime.settings.providerRetry.enabled) return;
    if (disposition === "permanent") {
      this.pause(ctx, `Provider request was rejected or is invalid; automatic retry was stopped. ${truncateNotification(assistant.errorMessage ?? "Permanent provider error")}`, true);
      return;
    }
    // All native attempts count toward this cap. Abort before Pi can schedule another retry.
    if (goal.providerRetryFailures > runtime.settings.providerRetry.maxRetries) {
      this.pause(ctx, `Provider retry limit reached (${runtime.settings.providerRetry.maxRetries} retries). Last error: ${truncateNotification(assistant.errorMessage ?? "Unknown provider error")}`, true);
    }
  }

  enter(ctx: StatusContext, errorMessage: string | undefined, disposition: ProviderErrorDisposition = "retry") {
    const runtime = this.runtime;
    const goal = runtime.activeGoal;
    const settings = runtime.settings.providerRetry;
    if (!goal || !runtime.ownsWorkflow(goal) || !settings.enabled) return false;
    if (disposition !== "retry") {
      this.pause(ctx, `Provider error requires attention; automatic retry was stopped: ${truncateNotification(errorMessage ?? disposition)}`);
      return true;
    }
    const attempt = Math.max(1, goal.providerRetryFailures ?? 1);
    if (attempt > settings.maxRetries) {
      this.pause(ctx, `Provider retry limit reached (${settings.maxRetries} retries). Run /goal resume to start a new retry allowance.`);
      return true;
    }
    const delay = providerRetryDelay(settings, attempt);
    const waiting = {
      reason: `Provider retry ${attempt}/${settings.maxRetries} in ${Math.ceil(delay / 1_000)}s: ${truncateNotification(errorMessage ?? "Unknown provider error")}`,
      resumeAt: Date.now() + delay,
      providerError: { ...usageLimitScope(ctx), attempt },
    };
    const entered = runtime.enterGoalWait(ctx, goal.id, waiting);
    if (entered?.waiting === waiting && runtime.ownsWorkflow(entered)) {
      notifyTerminal(ctx.ui, `Goal automatic retry ${attempt}/${settings.maxRetries} scheduled in ${Math.ceil(delay / 1_000)} seconds. /goal pause cancels it.`, "warning");
    }
    return true;
  }

  stopIfDisallowed(ctx: StatusContext) {
    const runtime = this.runtime;
    const goal = runtime.activeGoal;
    const scope = goal?.waiting?.providerError;
    if (!goal || !scope || !runtime.ownsWorkflow(goal)) return false;
    const settings = runtime.settings.providerRetry;
    const current = usageLimitScope(ctx);
    const changed = scope.provider !== current.provider || scope.model !== current.model || scope.api !== current.api;
    if (settings.enabled && scope.attempt <= settings.maxRetries && !changed) return false;
    this.pause(ctx, changed ? "Model changed during automatic provider retry. Run /goal resume to continue with the selected model." : "Automatic provider retry was disabled or its limit was lowered. Run /goal resume after reviewing settings.");
    return true;
  }

  private pause(ctx: StatusContext, reason: string, abortTurn = false) {
    const goal = this.runtime.activeGoal;
    if (!goal || !this.runtime.ownsWorkflow(goal)) return;
    const stopped = this.runtime.stopActiveGoal(ctx, {
      kind: abortTurn ? "agent_interruption" : "recovery_ended",
      expectedGoalId: goal.id,
      status: "paused",
      reason,
    });
    if (stopped) notifyTerminal(ctx.ui, `Goal paused. ${reason}`, "warning");
  }
}
