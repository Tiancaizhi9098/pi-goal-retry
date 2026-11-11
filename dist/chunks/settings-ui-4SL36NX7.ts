// Generated from src; rebuild with npm run build.
// @ts-nocheck
import {
  DEFAULT_GOAL_SETTINGS,
  GOAL_SETTINGS_FILE,
  notifyTerminal,
  safeTerminalText,
  saveGoalSettings
} from "./chunk-75P3LG2T.ts";

// src/settings-ui.ts
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
async function showGoalSettings(runtime, ctx, options = {}) {
  const settingsPath = options.settingsPath ?? join(getAgentDir(), GOAL_SETTINGS_FILE);
  if (ctx.mode !== "tui") {
    notifyTerminal(ctx.ui, `Edit pi-goal settings manually: ${safeTerminalText(settingsPath)}`, "info");
    return;
  }
  const generation = runtime.menuGeneration;
  const isMenuCurrent = () => generation === runtime.menuGeneration && !runtime.menuController.signal.aborted;
  const { defineMenu, runMenu } = await import("./dist-LJA2HMVR.ts");
  if (!isMenuCurrent()) return;
  const invalid = runtime.settingsLoadIssue?.kind === "invalid";
  const previewGoalIds = /* @__PURE__ */ new Map();
  const menu = defineMenu({
    start: invalid ? "invalid" : options.initialScreen ?? "settings",
    screens: {
      settings: () => ({
        kind: "settings",
        title: "Pi Goal Retry Settings",
        lines: [`User settings \xB7 ${safeTerminalText(settingsPath)}`],
        items: [
          {
            id: "providerRetry",
            label: "Retry provider errors",
            description: "Recover automatically after stream drops and unclassified provider errors. Pause cancels scheduled recovery.",
            currentValue: runtime.settings.providerRetry.enabled ? "On" : "Off",
            values: ["Off", "On"],
            action: "set-provider-retry"
          },
          {
            id: "providerRetryLimit",
            label: "Provider retry limit",
            description: "Maximum retries per consecutive failure streak; native Pi retries count toward the same limit.",
            currentValue: String(runtime.settings.providerRetry.maxRetries),
            action: "set-provider-retry-limit"
          },
          {
            id: "automaticTurns",
            label: "Automatic-work limit",
            description: "Pause automatic Goal work after a visible number of model responses.",
            currentValue: formatAutomaticSettingValue(runtime.settings.continuationLimits.automaticTurns),
            action: "open-automatic"
          },
          {
            id: "noProgressTurns",
            label: "No-progress guard",
            description: "Pause after repeated or empty tool-free automatic runs.",
            currentValue: formatNoProgressSettingValue(runtime.settings.continuationLimits.noProgressTurns),
            action: "open-no-progress"
          },
          {
            id: "retryUsageLimits",
            label: "Retry usage limits",
            description: "Automatically retry usage limits. Repeated provider requests can incur charges. Billing or credit failures can wait indefinitely. Use a 15-minute fallback without a usable reset time.",
            currentValue: runtime.settings.retryUsageLimits ? "On" : "Off",
            values: ["Off", "On"],
            action: "set-retry-usage-limits"
          },
          {
            id: "rpcEnabled",
            label: "Managed run RPC",
            description: "Allow trusted installed extensions to start and cancel Goal runs; this is not an extension sandbox.",
            currentValue: runtime.settings.rpc.enabled ? "On" : "Off",
            values: ["Off", "On"],
            action: "set-rpc"
          }
        ]
      }),
      automatic: () => limitChoiceScreen(runtime, "automaticTurns", "choose-automatic"),
      "no-progress": () => limitChoiceScreen(runtime, "noProgressTurns", "choose-no-progress"),
      invalid: () => ({
        kind: "detail",
        title: "Pi Goal Settings \xB7 Read only",
        lines: [
          `Invalid settings file. Pi-goal is using built-in defaults. Fix ${safeTerminalText(settingsPath)} and run /reload. The file will not be overwritten.`,
          `Automatic-work limit: ${formatAutomaticWork(runtime.settings.continuationLimits.automaticTurns)}`,
          `No-progress guard: ${formatNoProgressProtection(runtime.settings.continuationLimits.noProgressTurns)}`,
          `Retry usage limits: ${runtime.settings.retryUsageLimits ? "On" : "Off"}`,
          `Managed run RPC: ${runtime.settings.rpc.enabled ? "On" : "Off"}`
        ],
        hint: "back"
      })
    },
    actions: {
      "set-provider-retry": async ({ value }) => {
        const next = structuredClone(runtime.settings);
        next.providerRetry.enabled = value === "On";
        try {
          applyGoalSettings(runtime, next, ctx, {
            save: (settings) => (options.save ?? saveGoalSettings)(settings, settingsPath)
          });
          runtime.providerErrorRecovery.stopIfDisallowed(ctx);
          return { kind: "stay" };
        } catch (error) {
          notifySettingsFailure(ctx, settingsPath, error);
          return { kind: "rejected" };
        }
      },
      "set-provider-retry-limit": async () => {
        const raw = await ctx.ui.input("Provider retry limit (0\u20131000)", String(runtime.settings.providerRetry.maxRetries));
        if (!isMenuCurrent() || raw === void 0) return { kind: "stay" };
        if (!/^\d+$/u.test(raw.trim()) || !Number.isSafeInteger(Number(raw)) || Number(raw) > 1e3) {
          notifyTerminal(ctx.ui, "Enter a whole number from 0 through 1000.", "warning");
          return { kind: "rejected" };
        }
        const next = structuredClone(runtime.settings);
        next.providerRetry.maxRetries = Number(raw);
        try {
          applyGoalSettings(runtime, next, ctx, {
            save: (settings) => (options.save ?? saveGoalSettings)(settings, settingsPath)
          });
          runtime.providerErrorRecovery.stopIfDisallowed(ctx);
          return { kind: "stay" };
        } catch (error) {
          notifySettingsFailure(ctx, settingsPath, error);
          return { kind: "rejected" };
        }
      },
      "open-automatic": async () => {
        previewGoalIds.set("automaticTurns", runtime.activeGoal?.id ?? null);
        return { kind: "to", screen: "automatic" };
      },
      "open-no-progress": async () => {
        previewGoalIds.set("noProgressTurns", runtime.activeGoal?.id ?? null);
        return { kind: "to", screen: "no-progress" };
      },
      "choose-automatic": async ({ itemId }) => applyLimitChoice(
        runtime,
        ctx,
        options,
        settingsPath,
        "automaticTurns",
        itemId,
        previewGoalIds.get("automaticTurns") ?? null,
        isMenuCurrent
      ),
      "choose-no-progress": async ({ itemId }) => applyLimitChoice(
        runtime,
        ctx,
        options,
        settingsPath,
        "noProgressTurns",
        itemId,
        previewGoalIds.get("noProgressTurns") ?? null,
        isMenuCurrent
      ),
      "set-retry-usage-limits": async ({ value }) => {
        const enabled = value === "On";
        if (enabled === runtime.settings.retryUsageLimits) return { kind: "stay" };
        try {
          const next = {
            ...structuredClone(runtime.settings),
            retryUsageLimits: enabled
          };
          applyGoalSettings(runtime, next, ctx, {
            save: (settings) => (options.save ?? saveGoalSettings)(settings, settingsPath)
          });
          notifyTerminal(ctx.ui, `Retry usage limits: ${enabled ? "On" : "Off"}.`, "info");
          return { kind: "stay" };
        } catch (error) {
          notifySettingsFailure(ctx, settingsPath, error);
          return { kind: "rejected" };
        }
      },
      "set-rpc": async ({ value }) => {
        const enabled = value === "On";
        if (enabled === runtime.settings.rpc.enabled) return { kind: "stay" };
        try {
          const next = {
            ...structuredClone(runtime.settings),
            rpc: { enabled }
          };
          applyGoalSettings(runtime, next, ctx, {
            save: (settings) => (options.save ?? saveGoalSettings)(settings, settingsPath)
          });
          notifyTerminal(ctx.ui, `Managed run RPC: ${enabled ? "On" : "Off"}.`, "info");
          return { kind: "stay" };
        } catch (error) {
          notifySettingsFailure(ctx, settingsPath, error);
          return { kind: "rejected" };
        }
      }
    }
  });
  await runMenu(ctx, menu, {
    getState: () => void 0,
    signal: runtime.menuController.signal,
    isCurrent: isMenuCurrent
  });
}
function limitChoiceScreen(runtime, field, action) {
  const value = runtime.settings.continuationLimits[field];
  const goal = runtime.activeGoal;
  return {
    kind: "actions",
    title: field === "automaticTurns" ? "Automatic-work limit" : "No-progress guard",
    lines: [
      field === "automaticTurns" ? `Current: ${formatAutomaticWork(value)}` : `Current: ${formatNoProgressProtection(value)}`,
      ...field === "automaticTurns" ? [
        `Set a whole-number response limit for each automatic-work epoch. Default: ${DEFAULT_GOAL_SETTINGS.continuationLimits.automaticTurns}.`
      ] : [],
      ...goal ? [
        field === "automaticTurns" ? `Active goal: ${goal.automaticModelTurns} automatic responses used` : `Active goal: ${goal.toolFreeRepeatCount} repeated or empty runs detected`
      ] : []
    ],
    items: limitChoices(field, value, goal?.automaticModelTurns).map((item) => ({
      id: item.value,
      label: item.label,
      description: item.description,
      action
    })),
    hint: "back"
  };
}
function limitChoices(field, value, automaticTurnsUsed) {
  if (field === "automaticTurns") {
    const unlimitedDescription = value === null ? "No response-count cap. Completion, manual pause, blockers, provider limits, and other configured guards still apply." : automaticTurnsUsed === void 0 ? `Remove the current ${value}-response cap. Goal work will have no response-count cap; other configured stop conditions remain.` : `Remove the current ${value}-response cap. The active goal has used ${automaticTurnsUsed} responses; other configured stop conditions remain.`;
    return [
      {
        value: "custom",
        label: "Set response limit\u2026",
        description: `Choose a whole-number response limit for each automatic-work epoch. Default: ${DEFAULT_GOAL_SETTINGS.continuationLimits.automaticTurns}.`
      },
      { value: "unlimited", label: "Unlimited\u2026", description: unlimitedDescription }
    ];
  }
  const defaultLimit = DEFAULT_GOAL_SETTINGS.continuationLimits.noProgressTurns;
  return [
    {
      value: "default",
      label: `After ${defaultLimit} repeated runs (default)`,
      description: "Pause after the default number of repeated or empty tool-free runs."
    },
    {
      value: "custom",
      label: "Set threshold\u2026",
      description: "Choose a whole number of repeated or empty runs before pausing."
    },
    {
      value: "off",
      label: "Off",
      description: "Do not pause based on repeated or empty tool-free runs."
    }
  ];
}
async function applyLimitChoice(runtime, ctx, options, settingsPath, field, itemId, activeGoalId, isCurrent) {
  if (!isCurrent() || !isLimitSelection(itemId)) return { kind: "rejected" };
  if ((runtime.activeGoal?.id ?? null) !== activeGoalId) {
    notifyTerminal(
      ctx.ui,
      "The active goal changed while the safety setting was open. No settings were changed.",
      "warning"
    );
    return { kind: "rejected" };
  }
  const previous = runtime.settings.continuationLimits[field];
  const limit = await resolveLimitSelection(field, itemId, previous, ctx, isCurrent);
  if (!isCurrent()) return { kind: "rejected" };
  if (limit === void 0 || limit === previous) return { kind: "back" };
  if ((runtime.activeGoal?.id ?? null) !== activeGoalId) {
    notifyTerminal(
      ctx.ui,
      "The active goal changed while editing the safety setting. No settings were changed.",
      "warning"
    );
    return { kind: "rejected" };
  }
  const confirmation = await confirmLowerActiveLimit(runtime, ctx, field, limit);
  if (!isCurrent() || !confirmation.apply) return { kind: "rejected" };
  if (confirmation.goalId !== void 0 && runtime.activeGoal?.id !== confirmation.goalId) {
    notifyTerminal(ctx.ui, "The active goal changed while confirming the limit. No settings were changed.", "warning");
    return { kind: "rejected" };
  }
  try {
    applyGoalSettings(runtime, withLimit(runtime.settings, field, limit), ctx, {
      save: (settings) => (options.save ?? saveGoalSettings)(settings, settingsPath)
    });
    notifyTerminal(ctx.ui, formatLimitSuccess(field, limit), "info");
    return { kind: "back" };
  } catch (error) {
    notifySettingsFailure(ctx, settingsPath, error);
    return { kind: "rejected" };
  }
}
function applyGoalSettings(runtime, next, ctx, options = {}) {
  runtime.withSettingsPublication(() => applyGoalSettingsTransaction(runtime, next, ctx, options));
}
function applyGoalSettingsTransaction(runtime, next, ctx, options) {
  const snapshot = runtime.snapshotSettingsApplicationState();
  let fileSaved = false;
  let applyingRuntime = false;
  try {
    runtime.settings = structuredClone(next);
    options.save?.(next);
    fileSaved = options.save !== void 0;
    applyingRuntime = true;
    const activeGoalId = runtime.activeGoal?.id;
    const abortOwnedRun = activeGoalId !== void 0 && runtime.agentRunGoalId === activeGoalId;
    const pausedByAutomaticLimit = runtime.enforceAutomaticTurnLimit(ctx, abortOwnedRun);
    if (!pausedByAutomaticLimit) runtime.enforceNoProgressLimit(ctx, abortOwnedRun);
    runtime.usageLimitRecovery.stopIfDisabled(ctx);
    runtime.providerErrorRecovery.stopIfDisallowed(ctx);
    if (runtime.activeGoal) {
      runtime.updateStatus(ctx, runtime.activeGoal);
    }
  } catch (error) {
    const rollbackErrors = [];
    try {
      if (applyingRuntime) runtime.restoreSettingsApplicationState(snapshot);
      else runtime.settings = structuredClone(snapshot.settings);
    } catch (rollbackError) {
      rollbackErrors.push(rollbackError);
    }
    if (fileSaved) {
      try {
        options.save?.(snapshot.settings);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (applyingRuntime) {
      try {
        restorePersistedRuntime(runtime, ctx);
      } catch (rollbackError) {
        rollbackErrors.push(rollbackError);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError(
        [error, ...rollbackErrors],
        `pi-goal settings application failed and rollback was incomplete: ${formatError(error)}`
      );
    }
    throw error;
  }
}
function parseGoalLimit(value) {
  const normalized = value.trim();
  if (!/^\d+$/u.test(normalized)) return void 0;
  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : void 0;
}
async function resolveLimitSelection(field, selection, previous, ctx, isCurrent) {
  if (selection === "off") return null;
  if (selection === "unlimited") {
    if (previous === null) return null;
    const confirmed = await ctx.ui.confirm(
      "Allow Unlimited automatic work?",
      "Tool loops can continue without a response-count limit and may consume substantial tokens and provider cost. Completion, manual pause, blockers, provider limits, and the no-progress guard still apply."
    );
    return isCurrent() && confirmed ? null : void 0;
  }
  if (selection === "default") {
    return DEFAULT_GOAL_SETTINGS.continuationLimits[field];
  }
  while (true) {
    const raw = field === "automaticTurns" ? await ctx.ui.editor(
      `Automatic-work response limit (whole number greater than 0) \xB7 Default: ${DEFAULT_GOAL_SETTINGS.continuationLimits.automaticTurns}`,
      String(previous ?? DEFAULT_GOAL_SETTINGS.continuationLimits.automaticTurns)
    ) : await ctx.ui.input(
      "Repeated-run threshold (whole number greater than 0)",
      previous === null ? "Positive whole number" : String(previous)
    );
    if (!isCurrent() || raw === void 0) return void 0;
    const parsed = parseGoalLimit(raw);
    if (parsed !== void 0) return parsed;
    notifyTerminal(
      ctx.ui,
      `Enter a whole number greater than 0. Choose ${field === "automaticTurns" ? "Unlimited" : "Off"} from the previous screen if you do not want a limit.`,
      "warning"
    );
  }
}
function restorePersistedRuntime(runtime, ctx) {
  if (runtime.activeGoal) {
    runtime.persistGoal(runtime.activeGoal);
    runtime.updateStatus(ctx, runtime.activeGoal);
    runtime.restoreGoalWaitTimer(ctx);
  }
}
async function confirmLowerActiveLimit(runtime, ctx, field, limit) {
  const goal = runtime.activeGoal;
  if (goal?.status !== "active" || limit === null) return { apply: true };
  const used = field === "automaticTurns" ? goal.automaticModelTurns : goal.toolFreeRepeatCount;
  if (used < limit) return { apply: true };
  return {
    apply: await ctx.ui.confirm(
      "Apply limit and pause now?",
      `The active goal has already used ${used}. Setting this limit to ${limit} will pause it immediately without deleting progress.`
    ),
    goalId: goal.id
  };
}
function withLimit(settings, field, value) {
  return {
    ...structuredClone(settings),
    continuationLimits: { ...settings.continuationLimits, [field]: value }
  };
}
function formatAutomaticSettingValue(value) {
  return value === null ? "Unlimited" : `${value} responses`;
}
function formatNoProgressSettingValue(value) {
  if (value === null) return "Off";
  return `${value} ${value === 1 ? "run" : "runs"}`;
}
function formatAutomaticWork(value) {
  return value === null ? "Unlimited" : `Up to ${value} responses`;
}
function formatNoProgressProtection(value) {
  if (value === null) return "Off";
  return `After ${value} repeated ${value === 1 ? "run" : "runs"}`;
}
function formatLimitSuccess(field, value) {
  return field === "automaticTurns" ? `Automatic-work limit: ${formatAutomaticWork(value)}.` : `No-progress guard: ${formatNoProgressProtection(value)}.`;
}
function isLimitSelection(value) {
  return value === "unlimited" || value === "default" || value === "custom" || value === "off";
}
function notifySettingsFailure(ctx, settingsPath, error) {
  const path = safeTerminalText(settingsPath);
  const detail = safeTerminalText(formatError(error));
  notifyTerminal(
    ctx.ui,
    error instanceof AggregateError ? `Could not apply Goal settings, and rollback was incomplete. Check ${path}, run /reload, and verify the effective settings before retrying: ${detail}` : `Could not save Goal settings; the previous value remains. Check ${path} and retry: ${detail}`,
    "error"
  );
}
function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
export {
  applyGoalSettings,
  parseGoalLimit,
  showGoalSettings
};
