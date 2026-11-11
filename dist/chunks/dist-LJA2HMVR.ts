// Generated from src; rebuild with npm run build.
// @ts-nocheck
import {
  actionMenuDialogLabel,
  browseDialogLabel,
  browseDialogPages,
  componentRows,
  createMenuScreenComponent,
  createMermaidMarkdownTransformer,
  createMultiSelectComponent,
  createReviewComponent,
  formatInteractionHints,
  hardWrapTerminalDocument,
  prepareMenuScreenRendering,
  prepareMermaidMarkdownRenderer,
  renderBoundedFrame,
  renderBoundedFrameLayout,
  reviewDialogPages,
  safeMenuText,
  sanitizeTerminalDocument
} from "./chunk-6ZRISOUB.ts";
import {
  HorizontalRule,
  canonicalKeyId,
  canonicalizeConfiguredKey,
  componentKeyAvailable,
  componentKeybindings,
  keysOverlap,
  sanitizeTerminalText,
  usesDisambiguatedKeyProtocol
} from "./chunk-WIBL2C3K.ts";

// node_modules/@narumitw/pi-tui-kit/dist/interaction-error.js
function callErrorReporter(ctx, options, error) {
  if (!options.onError)
    return false;
  try {
    return { completion: options.onError(ctx, error) };
  } catch {
    return false;
  }
}
function notifyInteractionError(ctx, error, prefix, sanitize) {
  const message = error instanceof Error ? error.message : String(error);
  try {
    ctx.ui.notify(`${prefix}${sanitize(message)}`, "error");
  } catch {
  }
}

// node_modules/@narumitw/pi-tui-kit/dist/custom-interaction.js
async function runCustomInteraction(ctx, options) {
  if (!isCurrent(options) || options.signal?.aborted)
    return { kind: "stale" };
  if (ctx.mode !== "tui" || !ctx.hasUI) {
    try {
      await options.onUnsupportedMode?.(ctx, ctx.mode);
    } catch (error) {
      return reportInteractionError(ctx, options, error);
    }
    if (!isCurrent(options) || options.signal?.aborted)
      return { kind: "stale" };
    return { kind: "unsupported", mode: ctx.mode };
  }
  const controller = new AbortController();
  const signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal;
  let component;
  let creation;
  let wrappedComponent;
  let removeAbortListener = () => {
  };
  let externallyDisposed = false;
  let completionRequested = false;
  let customResult;
  let uiError;
  let disposalError;
  let cleanupError;
  let resolveDisposal;
  const disposal = new Promise((resolve) => {
    resolveDisposal = resolve;
  });
  try {
    const interaction = uiFor(ctx).custom(async (tui, theme, keybindings, done) => {
      let finished = false;
      const finish = (result) => {
        if (finished)
          return;
        finished = true;
        done(result);
      };
      const finishStale = () => {
        controller.abort(new DOMException("Custom interaction owner disposed", "AbortError"));
        finish({ kind: "stale" });
      };
      options.signal?.addEventListener("abort", finishStale, { once: true });
      removeAbortListener = () => options.signal?.removeEventListener("abort", finishStale);
      if (options.signal?.aborted || !isCurrent(options)) {
        finishStale();
        return { render: () => [], invalidate() {
        } };
      }
      creation = Promise.resolve(options.create({
        ctx,
        tui,
        theme,
        keybindings,
        signal,
        complete: (value) => {
          if (externallyDisposed)
            return;
          if (signal.aborted || !isCurrent(options)) {
            finishStale();
            return;
          }
          completionRequested = true;
          finish({ kind: "completed", value });
          controller.abort(new DOMException("Custom interaction completed", "AbortError"));
        }
      }));
      component = await creation;
      if (signal.aborted || !isCurrent(options))
        finishStale();
      wrappedComponent = wrapComponent(component, () => {
        if (!completionRequested)
          externallyDisposed = true;
        controller.abort(new DOMException("Custom interaction disposed", "AbortError"));
        removeAbortListener();
        if (!completionRequested)
          resolveDisposal({ kind: "stale" });
      }, (error) => {
        disposalError ??= error;
      });
      return wrappedComponent;
    }, options.blocked ? { blocked: options.blocked } : void 0);
    customResult = await Promise.race([interaction, disposal]);
  } catch (error) {
    uiError = error;
    controller.abort(new DOMException("Custom interaction failed", "AbortError"));
  } finally {
    removeAbortListener();
  }
  if (customResult === void 0 && uiError === void 0) {
    externallyDisposed = true;
    controller.abort(new DOMException("Custom interaction closed", "AbortError"));
  }
  const isCompletionAbort = (error) => customResult?.kind === "completed" && completionRequested && signal.aborted && (error === signal.reason || error instanceof Error && error.name === "AbortError" && error.cause === signal.reason);
  try {
    if (creation)
      component = await creation;
  } catch (error) {
    if (!isCompletionAbort(error))
      uiError ??= error;
  }
  try {
    wrappedComponent?.dispose?.();
  } catch (error) {
    if (!isCompletionAbort(error))
      cleanupError ??= error;
  }
  if (disposalError !== void 0 && !isCompletionAbort(disposalError))
    cleanupError ??= disposalError;
  try {
    await component?.waitForPending?.();
  } catch (error) {
    if (!isCompletionAbort(error))
      cleanupError ??= error;
  }
  controller.abort(new DOMException("Custom interaction settled", "AbortError"));
  if (customResult?.kind === "stale" || options.signal?.aborted || !isCurrent(options)) {
    return { kind: "stale" };
  }
  if (uiError !== void 0)
    return reportInteractionError(ctx, options, uiError);
  if (externallyDisposed)
    return { kind: "stale" };
  if (cleanupError !== void 0)
    return reportInteractionError(ctx, options, cleanupError);
  if (customResult?.kind === "completed")
    return customResult;
  return { kind: "stale" };
}
function wrapComponent(component, onDispose, onDisposalError) {
  let disposed = false;
  const wrapped = {
    render: (width) => component.render(width),
    invalidate: () => component.invalidate(),
    ...component.handleInput ? { handleInput: (data) => component.handleInput?.(data) } : {},
    ...component.handleMouse ? {
      handleMouse: (event) => component.handleMouse?.(event)
    } : {},
    ...component.waitForPending ? { waitForPending: () => component.waitForPending?.() ?? Promise.resolve() } : {},
    dispose() {
      if (disposed)
        return;
      disposed = true;
      onDispose();
      try {
        component.dispose?.();
      } catch (error) {
        onDisposalError(error);
      }
    }
  };
  Object.defineProperty(wrapped, "wantsKeyRelease", {
    get: () => component.wantsKeyRelease
  });
  Object.defineProperty(wrapped, "capturesViewportInput", {
    get: () => component.capturesViewportInput
  });
  if ("focused" in component) {
    Object.defineProperty(wrapped, "focused", {
      get: () => component.focused,
      set: (value) => {
        component.focused = value;
      }
    });
  }
  return wrapped;
}
async function reportInteractionError(ctx, options, error) {
  if (!isCurrent(options) || options.signal?.aborted)
    return { kind: "stale" };
  const reporting = callErrorReporter(ctx, options, error);
  let reported = false;
  if (reporting) {
    try {
      await reporting.completion;
      reported = true;
    } catch {
    }
  }
  if (!isCurrent(options) || options.signal?.aborted)
    return { kind: "stale" };
  if (!reported && ctx.hasUI) {
    notifyInteractionError(ctx, error, "Custom interaction failed: ", safeMenuText);
  }
  if (!isCurrent(options) || options.signal?.aborted)
    return { kind: "stale" };
  return { kind: "error", error };
}
function isCurrent(options) {
  return options.isCurrent?.() ?? true;
}
function uiFor(ctx) {
  return ctx.ui;
}

// node_modules/@narumitw/pi-tui-kit/dist/confirmation.js
async function runConfirmation(ctx, options) {
  if (!isCurrent2(options) || options.signal?.aborted)
    return { kind: "stale" };
  const prompt = normalizePrompt(options);
  if (ctx.mode === "tui" && ctx.hasUI)
    return runTuiConfirmation(ctx, options, prompt);
  if (ctx.mode === "rpc" && ctx.hasUI)
    return runRpcConfirmation(ctx, options, prompt);
  try {
    await options.onUnsupportedMode?.(ctx, ctx.mode);
  } catch (error) {
    return confirmationError(ctx, options, error);
  }
  if (!isCurrent2(options) || options.signal?.aborted)
    return { kind: "stale" };
  return { kind: "unsupported", mode: ctx.mode };
}
async function runTuiConfirmation(ctx, options, prompt) {
  const result = await runCustomInteraction(ctx, {
    signal: options.signal,
    isCurrent: options.isCurrent,
    onError: (currentCtx, error) => reportConfirmationError(currentCtx, options, error),
    create: async ({ tui, theme, keybindings, complete, signal }) => {
      const { createMenuScreenComponent: createMenuScreenComponent2 } = await import("./components-MKSD7HN3.ts");
      signal.throwIfAborted();
      if (!isCurrent2(options))
        throw new DOMException("Confirmation owner became stale", "AbortError");
      return createMenuScreenComponent2({
        screen: {
          kind: "actions",
          title: prompt.title,
          lines: prompt.lines,
          items: [
            { id: "confirm", label: prompt.confirmLabel, action: "confirm" },
            { id: "back", label: prompt.cancelLabel, action: "back" }
          ],
          hint: "back"
        },
        selectedItemId: "confirm",
        tui,
        theme,
        keybindings,
        onEvent: (event) => {
          if (event.kind === "activate") {
            complete(event.itemId === "confirm" ? "confirmed" : "back");
            return;
          }
          complete(event.kind);
        }
      });
    }
  });
  if (result.kind === "completed") {
    return result.value === "confirmed" ? { kind: "confirmed" } : { kind: "closed", reason: result.value };
  }
  return result;
}
async function runRpcConfirmation(ctx, options, prompt) {
  let selection;
  try {
    selection = await uiFor2(ctx).select([prompt.title, ...prompt.lines].join("\n"), [prompt.confirmLabel, prompt.cancelLabel], { signal: options.signal });
  } catch (error) {
    return confirmationError(ctx, options, error);
  }
  if (!isCurrent2(options) || options.signal?.aborted)
    return { kind: "stale" };
  if (selection === prompt.confirmLabel)
    return { kind: "confirmed" };
  if (selection === void 0 || selection === prompt.cancelLabel) {
    return { kind: "closed", reason: "back" };
  }
  return confirmationError(ctx, options, new Error("Confirmation dialog returned an option that was not offered"));
}
function normalizePrompt(options) {
  const title = safeMenuText(options.title) || "Confirm";
  const lines = options.message.split(/\r?\n/u).map(safeMenuText);
  const confirmLabel = safeMenuText(options.confirmLabel ?? "Confirm") || "Confirm";
  let cancelLabel = safeMenuText(options.cancelLabel ?? "Cancel") || "Cancel";
  if (cancelLabel === confirmLabel)
    cancelLabel = `${cancelLabel} [2]`;
  return { title, lines, confirmLabel, cancelLabel };
}
async function confirmationError(ctx, options, error) {
  if (!isCurrent2(options) || options.signal?.aborted)
    return { kind: "stale" };
  await reportConfirmationError(ctx, options, error);
  if (!isCurrent2(options) || options.signal?.aborted)
    return { kind: "stale" };
  return { kind: "error", error };
}
async function reportConfirmationError(ctx, options, error) {
  const reporting = callErrorReporter(ctx, options, error);
  let reported = false;
  if (reporting) {
    try {
      await reporting.completion;
      reported = true;
    } catch {
    }
  }
  if (reported || !ctx.hasUI || !isCurrent2(options) || options.signal?.aborted)
    return;
  notifyInteractionError(ctx, error, "Confirmation failed: ", safeMenuText);
}
function isCurrent2(options) {
  return options.isCurrent?.() ?? true;
}
function uiFor2(ctx) {
  return ctx.ui;
}

// node_modules/@narumitw/pi-tui-kit/dist/types.js
var MAX_REVIEW_VIEWPORT_SIZE = 50;

// node_modules/@narumitw/pi-tui-kit/dist/document-review.js
async function runDocumentReview(ctx, options) {
  if (!isCurrent3(options) || options.signal?.aborted)
    return { kind: "stale" };
  const validationError = validateOptions(options);
  if (validationError)
    return documentReviewError(ctx, options, validationError);
  const screen = reviewScreen(options);
  if (ctx.mode === "tui" && ctx.hasUI)
    return runTuiDocumentReview(ctx, options, screen);
  if (ctx.mode === "rpc" && ctx.hasUI)
    return runRpcDocumentReview(ctx, options, screen);
  try {
    await options.onUnsupportedMode?.(ctx, ctx.mode);
  } catch (error) {
    return documentReviewError(ctx, options, error);
  }
  if (!isCurrent3(options) || options.signal?.aborted)
    return { kind: "stale" };
  return { kind: "unsupported", mode: ctx.mode };
}
async function runTuiDocumentReview(ctx, options, screen) {
  try {
    const preparation = prepareMenuScreenRendering(screen);
    if (preparation)
      await preparation;
  } catch (error) {
    return documentReviewError(ctx, options, error);
  }
  if (!isCurrent3(options) || options.signal?.aborted)
    return { kind: "stale" };
  const result = await runCustomInteraction(ctx, {
    signal: options.signal,
    isCurrent: options.isCurrent,
    onError: (currentCtx, error) => reportDocumentReviewError(currentCtx, options, error),
    create: ({ tui, theme, keybindings, complete, signal }) => createReviewComponent({
      screen,
      tui,
      theme,
      keybindings,
      signal,
      isCurrent: options.isCurrent,
      onEvent: (event) => {
        if (event.kind === "activate")
          complete({ kind: "confirmed" });
        else
          complete({ kind: "cancelled", reason: event.kind });
      }
    })
  });
  return result.kind === "completed" ? result.value : result;
}
async function runRpcDocumentReview(ctx, options, screen) {
  const pages = reviewDialogPages(screen);
  let pageIndex = 0;
  for (; ; ) {
    const choices = uniqueChoices([
      ...pageIndex > 0 ? [{ kind: "previous", label: "Previous" }] : [],
      ...pageIndex < pages.length - 1 ? [{ kind: "next", label: "Next" }] : [],
      ...screen.confirm ? [{ kind: "confirm", label: safeMenuText(screen.confirm.label) }] : [],
      { kind: "cancel", label: screen.hint === "close" ? "Close" : "Back" }
    ]);
    const title = [
      safeMenuText(screen.title),
      ...(screen.lines ?? []).map(safeMenuText),
      pages[pageIndex]?.join("\n") ?? "",
      ...pages.length > 1 ? [`Page ${pageIndex + 1}/${pages.length}`] : []
    ].filter(Boolean).join("\n");
    let selectedLabel;
    try {
      selectedLabel = await uiFor3(ctx).select(title, choices.map((choice) => choice.label), { signal: options.signal });
    } catch (error) {
      return documentReviewError(ctx, options, error);
    }
    if (!isCurrent3(options) || options.signal?.aborted)
      return { kind: "stale" };
    if (selectedLabel === void 0)
      return { kind: "cancelled", reason: screen.hint ?? "back" };
    const selected = choices.find((choice) => choice.label === selectedLabel);
    if (!selected) {
      return documentReviewError(ctx, options, new Error("Document review dialog returned an option that was not offered"));
    }
    if (selected.kind === "cancel")
      return { kind: "cancelled", reason: screen.hint ?? "back" };
    if (selected.kind === "confirm")
      return { kind: "confirmed" };
    if (selected.kind === "previous")
      pageIndex = Math.max(0, pageIndex - 1);
    else
      pageIndex = Math.min(pages.length - 1, pageIndex + 1);
  }
}
function reviewScreen(options) {
  return {
    kind: "review",
    title: options.title,
    lines: options.lines,
    content: options.content,
    format: options.format,
    viewportSize: options.viewportSize,
    enableSearch: options.enableSearch,
    copy: options.copy,
    hint: options.hint,
    ...options.confirmation ? { confirm: { id: "confirm", label: options.confirmation.label, action: "confirm" } } : {}
  };
}
function uniqueChoices(choices) {
  const used = /* @__PURE__ */ new Set();
  return choices.map((choice) => ({ ...choice, label: uniqueLabel(choice.label, used) }));
}
function uniqueLabel(label, used) {
  const base = label || "Choice";
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let suffix = 2;
  while (used.has(`${base} [${suffix}]`))
    suffix += 1;
  const unique = `${base} [${suffix}]`;
  used.add(unique);
  return unique;
}
function validateOptions(options) {
  if (!safeMenuText(options.title))
    return new Error("Document review title must be displayable");
  if (options.viewportSize !== void 0 && options.viewportSize !== "adaptive" && (!Number.isInteger(options.viewportSize) || options.viewportSize <= 0 || options.viewportSize > MAX_REVIEW_VIEWPORT_SIZE)) {
    return new Error(`Document review viewportSize must be "adaptive" or a positive integer no greater than ${MAX_REVIEW_VIEWPORT_SIZE}`);
  }
  if (options.confirmation && !safeMenuText(options.confirmation.label)) {
    return new Error("Document review confirmation label must be displayable");
  }
  return void 0;
}
async function documentReviewError(ctx, options, error) {
  if (!isCurrent3(options) || options.signal?.aborted)
    return { kind: "stale" };
  await reportDocumentReviewError(ctx, options, error);
  if (!isCurrent3(options) || options.signal?.aborted)
    return { kind: "stale" };
  return { kind: "error", error };
}
async function reportDocumentReviewError(ctx, options, error) {
  const reporting = callErrorReporter(ctx, options, error);
  let reported = false;
  if (reporting) {
    try {
      await reporting.completion;
      reported = true;
    } catch {
    }
  }
  if (reported || !ctx.hasUI || !isCurrent3(options) || options.signal?.aborted)
    return;
  notifyInteractionError(ctx, error, "Document review failed: ", safeMenuText);
}
function isCurrent3(options) {
  return options.isCurrent?.() ?? true;
}
function uiFor3(ctx) {
  return ctx.ui;
}

// node_modules/@narumitw/pi-tui-kit/dist/editor-status-collection.js
function requireSize(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a nonnegative safe integer`);
  }
}
function createEditorStatusCollection(options) {
  const { maxItems, maxContentSize, measure } = options;
  requireSize(maxItems, "maxItems");
  requireSize(maxContentSize, "maxContentSize");
  let entries = /* @__PURE__ */ new Map();
  let disposed = false;
  let replacing = false;
  function current(id, token) {
    const entry = entries.get(id);
    return !disposed && !replacing && entry?.token === token && !entry.removed ? entry : void 0;
  }
  return {
    replace(items) {
      if (disposed)
        throw new Error("Editor status collection is disposed");
      if (replacing)
        throw new Error("Editor status collection replacement is already active");
      replacing = true;
      try {
        if (!Array.isArray(items))
          throw new RangeError("Editor status items must be an array");
        const length = items.length;
        requireSize(length, "Item count");
        if (length > maxItems)
          throw new RangeError("Editor status collection exceeds maxItems");
        const inputs = [];
        const ids = /* @__PURE__ */ new Set();
        for (let index = 0; index < length; index++) {
          const item = items[index];
          if (!item)
            throw new RangeError("Editor status items must not be empty");
          const { id, revision, value } = item;
          if (typeof id !== "string" || id.length === 0 || ids.has(id)) {
            throw new RangeError("Editor status item IDs must be nonempty, unique strings");
          }
          if (typeof revision !== "string")
            throw new RangeError("Editor status revision must be a string");
          ids.add(id);
          inputs.push({ id, revision, value });
        }
        const next = /* @__PURE__ */ new Map();
        let total = 0;
        for (const item of inputs) {
          const size = measure(item.value);
          if (disposed)
            throw new Error("Editor status collection is disposed");
          requireSize(size, "Measured content size");
          total += size;
          if (size > maxContentSize || !Number.isSafeInteger(total)) {
            throw new RangeError("Editor status content exceeds its per-item limit or safe total size");
          }
          const previous = entries.get(item.id);
          next.set(item.id, {
            id: item.id,
            value: item.value,
            revision: item.revision,
            token: previous && previous.revision === item.revision ? previous.token : {},
            mode: previous?.mode ?? "expanded",
            // A removed ID stays hidden until it is absent from an authoritative snapshot.
            removed: previous?.removed ?? false
          });
        }
        if (disposed)
          throw new Error("Editor status collection is disposed");
        entries = next;
      } finally {
        replacing = false;
      }
    },
    snapshot() {
      return Object.freeze([...entries.values()].filter((entry) => !entry.removed).map(({ id, value, mode }) => Object.freeze({ id, value, mode })));
    },
    item(id) {
      const entry = entries.get(id);
      if (disposed || !entry || entry.removed)
        return void 0;
      const token = entry.token;
      function setMode(mode) {
        const latest = current(id, token);
        if (!latest || latest.mode === mode)
          return false;
        latest.mode = mode;
        return true;
      }
      return {
        compact: () => setMode("compact"),
        expand: () => setMode("expanded"),
        remove() {
          const latest = current(id, token);
          if (!latest)
            return false;
          latest.removed = true;
          return true;
        }
      };
    },
    dispose() {
      disposed = true;
      entries.clear();
    }
  };
}

// node_modules/@narumitw/pi-tui-kit/dist/editor-status-publisher.js
function createEditorStatusPublisher(options) {
  const { key, isCurrent: isCurrent8, render } = options;
  if (!isCurrent8())
    return { publish() {
    }, dispose() {
    } };
  const { mode, hasUI } = options.context;
  if (!hasUI || mode !== "tui" && mode !== "rpc")
    return { publish() {
    }, dispose() {
    } };
  const ui = options.context.ui;
  let disposed = false;
  let latest;
  let mount;
  let rpcVisible = false;
  let needsClear = false;
  let writeVersion = 0;
  const current = () => !disposed && isCurrent8();
  const clear = () => {
    mount = void 0;
    rpcVisible = false;
    if (!needsClear)
      return;
    if (!isCurrent8()) {
      needsClear = false;
      return;
    }
    const version = writeVersion;
    ui.setWidget(key, void 0);
    if (writeVersion === version)
      needsClear = false;
  };
  const fail = (error) => {
    try {
      clear();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], "Editor status publication and cleanup failed");
    }
    throw error;
  };
  return {
    publish(snapshot) {
      if (!current())
        return;
      const unchanged = Object.is(latest, snapshot);
      latest = snapshot;
      if (snapshot === void 0) {
        clear();
        return;
      }
      if (mode === "rpc") {
        if (unchanged && rpcVisible)
          return;
        try {
          const lines = [...render(snapshot, ui.theme, 80, 36)];
          if (!current())
            return;
          rpcVisible = true;
          needsClear = true;
          writeVersion++;
          ui.setWidget(key, lines, { placement: "aboveEditor" });
        } catch (error) {
          fail(error);
        }
        return;
      }
      if (mount) {
        if (!unchanged) {
          mount.component?.invalidate();
          mount.tui?.requestRender();
        }
        return;
      }
      const token = {};
      mount = token;
      needsClear = true;
      const attempt = ++writeVersion;
      try {
        ui.setWidget(key, (tui) => {
          token.tui = tui;
          const component = {
            render(width) {
              if (!current() || mount !== token || latest === void 0)
                return [];
              return [...render(latest, ui.theme, width, tui.terminal.rows)];
            },
            invalidate() {
            },
            dispose() {
              if (mount === token) {
                mount = void 0;
                needsClear = false;
              }
            }
          };
          token.component = component;
          return component;
        }, { placement: "aboveEditor" });
      } catch (error) {
        if (writeVersion === attempt)
          fail(error);
        throw error;
      }
    },
    dispose() {
      if (disposed && !needsClear)
        return;
      disposed = true;
      latest = void 0;
      clear();
    }
  };
}

// node_modules/@narumitw/pi-tui-kit/dist/editor-status-view.js
function createEditorStatusView(options) {
  let mode = "default";
  let pinned = false;
  let trigger = "manual";
  let contentRevision;
  let userOrdinal = 0;
  let cycleOrdinal = 0;
  let cycle;
  let armedUser = 0;
  let armedCycle = 0;
  let disposed = false;
  function arm() {
    armedUser = userOrdinal;
    armedCycle = cycleOrdinal;
  }
  const blocked = () => disposed || pinned || mode === "hidden";
  function compact() {
    if (blocked())
      return;
    const expectedTrigger = trigger;
    const expectedRevision = contentRevision;
    if (!options.canCompact() || blocked() || trigger !== expectedTrigger || contentRevision !== expectedRevision)
      return;
    mode = "compact";
    trigger = "manual";
    options.onChange();
  }
  return {
    get mode() {
      return mode;
    },
    get pinned() {
      return pinned;
    },
    get trigger() {
      return trigger;
    },
    setMode(next) {
      if (disposed || mode === next && trigger === "manual")
        return;
      mode = next;
      trigger = "manual";
      options.onChange();
    },
    setPinned(next) {
      if (disposed || pinned === next)
        return;
      pinned = next;
      options.onChange();
    },
    setTrigger(next) {
      if (disposed || trigger === next)
        return;
      trigger = next;
      arm();
      options.onChange();
    },
    revision(value) {
      if (disposed || contentRevision === value)
        return;
      contentRevision = value;
      arm();
    },
    agentStarted() {
      if (disposed || cycle)
        return;
      cycle = { ordinal: ++cycleOrdinal, userOrdinal: 0 };
    },
    userMessage() {
      if (disposed)
        return;
      userOrdinal++;
      if (cycle)
        cycle.userOrdinal = userOrdinal;
      if (trigger === "user-message" && userOrdinal > armedUser)
        compact();
    },
    settled(eligible) {
      if (disposed || !cycle)
        return;
      const completed = cycle;
      cycle = void 0;
      if (eligible && trigger === "settled-cycle" && completed.ordinal > armedCycle && completed.userOrdinal > armedUser) {
        compact();
      }
    },
    reset() {
      if (disposed)
        return;
      const changed = mode !== "default" || pinned || trigger !== "manual";
      mode = "default";
      pinned = false;
      trigger = "manual";
      contentRevision = void 0;
      userOrdinal = 0;
      cycleOrdinal = 0;
      cycle = void 0;
      arm();
      if (changed)
        options.onChange();
    },
    dispose() {
      disposed = true;
      cycle = void 0;
    }
  };
}

// node_modules/@narumitw/pi-tui-kit/dist/editor-status-widget.js
import { truncateToWidth } from "@earendil-works/pi-tui";
var EditorStatusWidget = class {
  options;
  rule;
  constructor(options) {
    this.options = options;
    this.rule = new HorizontalRule({
      ruleStyle: (text) => this.options.theme.fg("borderMuted", text)
    });
  }
  invalidate() {
    this.rule.invalidate();
  }
  render(width) {
    const renderWidth = normalizeWidth(width);
    const body = this.options.renderBody(renderWidth);
    return [...this.rule.render(renderWidth), ...body.map((line) => truncateToWidth(line, renderWidth, ""))];
  }
};
function normalizeWidth(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

// node_modules/@narumitw/pi-tui-kit/dist/fullscreen-handoff.js
function aggregate(errors, label) {
  const first = errors[0];
  const detail = first instanceof Error ? first.message : typeof first === "string" ? first : "Unknown error";
  return new AggregateError(errors, `${label}: ${detail}`);
}
function createFullscreenHandoff(parent, options = {}) {
  let child;
  let overlay;
  let entry;
  let entering;
  let restoration;
  let restoring = false;
  let drainedEntry = false;
  let parentStopped = false;
  const current = () => !restoring && (options.isCurrent?.() ?? true);
  const restore = () => {
    restoring = true;
    restoration ??= Promise.resolve().then(async () => {
      const errors = [];
      const attempt = (action) => {
        try {
          action();
        } catch (error) {
          errors.push(error);
        }
      };
      try {
        await entry;
      } catch {
      }
      if (parentStopped) {
        try {
          await parent.terminal.drainInput?.();
        } catch (error) {
          errors.push(error);
        }
      }
      if (drainedEntry && !parentStopped) {
        parentStopped = true;
        attempt(() => parent.stop({ preserveScreen: true }));
      }
      if (child)
        attempt(() => child?.stop({ preserveScreen: true }));
      if (parentStopped) {
        attempt(() => overlay?.setHidden(true));
        attempt(() => {
          if (options.canRestoreParent?.() ?? true) {
            attempt(() => parent.start());
            attempt(() => parent.renderNow(false));
          }
        });
      }
      if (errors.length === 1)
        throw errors[0];
      if (errors.length > 1)
        throw aggregate(errors, "Fullscreen terminal restoration failed");
    });
    return restoration;
  };
  return {
    enter(createChild) {
      if (restoring)
        return restore().then(() => void 0);
      if (entering)
        return entering;
      entry = Promise.resolve().then(async () => {
        if (!current())
          return void 0;
        drainedEntry = parent.terminal.drainInput !== void 0;
        await parent.terminal.drainInput?.();
        if (!current())
          return void 0;
        parentStopped = true;
        parent.stop({ preserveScreen: true });
        if (!current())
          return void 0;
        child = createChild();
        if (!current())
          return void 0;
        child.start();
        if (!current())
          return void 0;
        return child;
      });
      entering = (async () => {
        try {
          const value = await entry;
          if (value && current())
            return value;
        } catch (error) {
          try {
            await restore();
          } catch (cleanupError) {
            throw aggregate([error, cleanupError], "Fullscreen entry and restoration failed");
          }
          throw error;
        }
        await restore();
        return void 0;
      })();
      return entering;
    },
    restore,
    setOverlayHandle(handle) {
      overlay = handle;
      if (restoring)
        handle.setHidden(true);
    }
  };
}

// node_modules/@narumitw/pi-tui-kit/dist/live-choice.js
import { Key, matchesKey } from "@earendil-works/pi-tui";
async function runLiveChoice(ctx, options) {
  if (!isCurrent4(options) || options.signal?.aborted)
    return { kind: "stale" };
  const validationError = validateOptions2(options);
  if (validationError)
    return liveChoiceError(ctx, options, validationError);
  if (ctx.mode === "tui" && ctx.hasUI)
    return runTuiLiveChoice(ctx, options);
  if (ctx.mode === "rpc" && ctx.hasUI)
    return runRpcLiveChoice(ctx, options);
  try {
    await options.onUnsupportedMode?.(ctx, ctx.mode);
  } catch (error) {
    return liveChoiceError(ctx, options, error);
  }
  if (!isCurrent4(options) || options.signal?.aborted)
    return { kind: "stale" };
  return { kind: "unsupported", mode: ctx.mode };
}
async function runTuiLiveChoice(ctx, options) {
  const selectedItemId = initialItemId(options);
  const result = await runCustomInteraction(ctx, {
    signal: options.signal,
    isCurrent: options.isCurrent,
    onError: (currentCtx, error) => reportLiveChoiceError(currentCtx, options, error),
    create: async ({ tui, theme, keybindings, signal, complete }) => {
      const { createMenuScreenComponent: createMenuScreenComponent2 } = await import("./components-MKSD7HN3.ts");
      signal.throwIfAborted();
      if (!isCurrent4(options))
        throw new DOMException("Live choice owner became stale", "AbortError");
      let focusedItemId = selectedItemId;
      const shortcuts = options.enableSearch ? [] : availableShortcuts(options.shortcuts, keybindings).map((shortcut) => ({
        ...shortcut,
        keys: shortcut.keys.filter((key) => componentKeyAvailable(tui, key, true))
      })).filter((shortcut) => shortcut.keys.length > 0);
      const previews = createPreviewQueue(ctx, options, signal, () => complete({ kind: "previewFailed" }));
      const component = createMenuScreenComponent2({
        screen: {
          kind: "choice",
          title: options.title,
          lines: options.lines,
          items: tuiItems(options),
          action: "select",
          currentItemId: options.currentItemId,
          viewportSize: options.viewportSize,
          enableSearch: options.enableSearch,
          hint: options.hint ?? "back"
        },
        selectedItemId,
        tui,
        theme,
        keybindings,
        interactionHint: liveChoiceHint(componentKeybindings(tui, keybindings, true), options, shortcuts),
        onSelectionChange: (itemId) => {
          focusedItemId = itemId;
          const item = findItem(options.items, focusedItemId);
          if (item)
            previews.enqueue(item);
        },
        onEvent: (event) => {
          if (event.kind === "activate") {
            const item = findItem(options.items, event.itemId);
            if (itemConfirmationDisabled(item))
              return;
            complete({ kind: "selected", itemId: event.itemId });
            return;
          }
          complete({ kind: "closed", reason: event.kind });
        }
      });
      const initialItem = findItem(options.items, focusedItemId);
      if (initialItem)
        previews.enqueue(initialItem);
      const focusable = component;
      return {
        get capturesViewportInput() {
          return component.capturesViewportInput;
        },
        get focused() {
          return focusable.focused ?? false;
        },
        set focused(value) {
          if ("focused" in focusable)
            focusable.focused = value;
        },
        render: (width) => component.render(width),
        invalidate: () => component.invalidate(),
        handleInput(data) {
          if (!isCurrent4(options)) {
            complete({ kind: "previewFailed" });
            return;
          }
          const item = findItem(options.items, focusedItemId);
          const shortcut = item && !item.disabled && !isStandardChoiceInput(data, keybindings) ? findShortcut(shortcuts, data) : void 0;
          if (item && shortcut) {
            complete({ kind: "shortcut", shortcutId: shortcut.id, itemId: item.id });
            return;
          }
          component.handleInput(data);
        },
        handleMouse(event) {
          return component.handleMouse?.(event);
        },
        async waitForPending() {
          await component.waitForPending();
          await previews.waitForPending();
        },
        dispose() {
          previews.dispose();
          component.dispose?.();
        }
      };
    }
  });
  if (result.kind === "completed" && result.value.kind !== "previewFailed")
    return result.value;
  if (result.kind === "completed") {
    return liveChoiceError(ctx, options, new Error("Live choice preview failed"));
  }
  return result;
}
async function runRpcLiveChoice(ctx, options) {
  const rows = rpcRows(options);
  while (true) {
    let selection;
    try {
      selection = await uiFor4(ctx).select([options.title, ...options.lines ?? []].map(safeMenuText).filter(Boolean).join("\n"), rows.map((row2) => row2.label), { signal: options.signal });
    } catch (error) {
      return liveChoiceError(ctx, options, error);
    }
    if (!isCurrent4(options) || options.signal?.aborted)
      return { kind: "stale" };
    if (selection === void 0)
      return { kind: "closed", reason: options.hint ?? "back" };
    const row = rows.find((candidate) => candidate.label === selection);
    if (!row) {
      return liveChoiceError(ctx, options, new Error("Live choice dialog returned an option that was not offered"));
    }
    if (row.kind === "exit")
      return { kind: "closed", reason: options.hint ?? "back" };
    if (!row.item.disabled && !itemConfirmationDisabled(row.item)) {
      return { kind: "selected", itemId: row.item.id };
    }
  }
}
function createPreviewQueue(ctx, options, signal, fail) {
  let queued;
  let running = false;
  let disposed = false;
  let failure;
  let pending = Promise.resolve();
  const start = () => {
    if (running || disposed || signal.aborted || !options.onSelectionChange)
      return;
    if (!isCurrent4(options)) {
      queued = void 0;
      fail();
      return;
    }
    running = true;
    pending = (async () => {
      try {
        while (queued && !disposed && !signal.aborted) {
          if (!isCurrent4(options)) {
            queued = void 0;
            fail();
            return;
          }
          const item = queued;
          queued = void 0;
          const result = options.onSelectionChange?.({ ctx, item, signal });
          if (isPromiseLike(result))
            await result;
          if (!isCurrent4(options)) {
            queued = void 0;
            fail();
            return;
          }
        }
      } catch (error) {
        if (signal.aborted || disposed)
          return;
        failure = error;
        queued = void 0;
        fail();
      } finally {
        running = false;
        if (queued)
          start();
      }
    })();
  };
  return {
    enqueue(item) {
      if (disposed || signal.aborted || !options.onSelectionChange)
        return;
      if (!isCurrent4(options)) {
        fail();
        return;
      }
      queued = item;
      start();
    },
    async waitForPending() {
      while (running)
        await pending;
      if (failure !== void 0)
        throw failure;
    },
    dispose() {
      disposed = true;
      queued = void 0;
    }
  };
}
function isPromiseLike(value) {
  return typeof value === "object" && value !== null && "then" in value && typeof value.then === "function";
}
function liveChoiceHint(keybindings, options, shortcuts) {
  return formatInteractionHints(keybindings, [
    {
      bindings: ["tui.select.up", "tui.select.down"],
      label: options.navigationLabel ?? "preview"
    },
    { bindings: ["tui.select.confirm"], label: options.confirmLabel ?? "select" },
    ...shortcuts.map((shortcut) => ({
      keys: shortcut.keys,
      label: shortcut.label
    })),
    {
      bindings: ["tui.select.cancel"],
      excludeKeys: ["ctrl+c"],
      label: options.hint ?? "back"
    },
    { keys: ["ctrl+c"], label: "close" },
    { bindings: ["tui.select.pageUp", "tui.select.pageDown"], label: "page" }
  ]);
}
function isStandardChoiceInput(data, keybindings) {
  return matchesKey(data, Key.ctrl("c")) || matchesKey(data, Key.home) || matchesKey(data, Key.end) || data === " " || [
    "tui.select.cancel",
    "tui.select.up",
    "tui.select.down",
    "tui.select.pageUp",
    "tui.select.pageDown",
    "tui.select.confirm"
  ].some((binding) => keybindings.matches(data, binding));
}
var STANDARD_CHOICE_BINDINGS = [
  "tui.select.cancel",
  "tui.select.up",
  "tui.select.down",
  "tui.select.pageUp",
  "tui.select.pageDown",
  "tui.select.confirm"
];
function availableShortcuts(shortcuts, keybindings) {
  const unavailableKeys = new Set([
    "ctrl+c",
    "home",
    "end",
    "space",
    ...STANDARD_CHOICE_BINDINGS.flatMap((binding) => keybindings.getKeys(binding))
  ].map(canonicalKeyId2));
  const available = [];
  for (const shortcut of shortcuts ?? []) {
    const keys = shortcut.keys.filter((key) => {
      const canonical = canonicalKeyId2(key);
      if (unavailableKeys.has(canonical))
        return false;
      unavailableKeys.add(canonical);
      return true;
    });
    if (keys.length > 0)
      available.push({ ...shortcut, keys });
  }
  return available;
}
function canonicalKeyId2(key) {
  const parts = key.toLowerCase().split("+");
  const base = parts.at(-1) ?? "";
  const canonicalBase = base === "esc" ? "escape" : base === "return" ? "enter" : base;
  const modifiers = ["ctrl", "shift", "alt", "super"].filter((modifier) => parts.includes(modifier));
  return [...modifiers, canonicalBase].join("+");
}
function findShortcut(shortcuts, data) {
  return shortcuts.find((shortcut) => shortcut.keys.some((key) => matchesKey(data, key)));
}
function initialItemId(options) {
  for (const id of [options.initialItemId, options.currentItemId]) {
    if (id !== void 0 && findItem(options.items, id))
      return id;
  }
  return options.items[0]?.id;
}
function findItem(items, itemId) {
  return items.find((item) => item.id === itemId);
}
function tuiItems(options) {
  return options.items.map((item) => {
    const explanation = confirmationDisabledText(item, options.confirmLabel);
    return explanation ? { ...item, details: [explanation, ...item.details ?? []] } : item;
  });
}
function itemConfirmationDisabled(item) {
  return item?.disabled !== true && item?.confirmationDisabled === true;
}
function confirmationDisabledText(item, confirmLabel) {
  if (!itemConfirmationDisabled(item))
    return void 0;
  const action = safeMenuText(confirmLabel ?? "select").trim() || "select";
  const reason = safeMenuText(item.confirmationDisabledReason ?? "").trim();
  return `Cannot ${action}${reason ? `: ${reason}` : ""}`;
}
function lowercaseInitial(value) {
  return value ? `${value[0]?.toLowerCase() ?? ""}${value.slice(1)}` : void 0;
}
function rpcRows(options) {
  const used = /* @__PURE__ */ new Set();
  const rows = options.items.map((item) => {
    const states = [
      item.id === options.currentItemId ? "current" : void 0,
      item.disabled ? `unavailable${item.disabledReason ? `: ${safeMenuText(item.disabledReason)}` : ""}` : void 0,
      lowercaseInitial(confirmationDisabledText(item, options.confirmLabel)),
      item.description ? safeMenuText(item.description) : void 0
    ].filter((value) => Boolean(value));
    const label = `${item.disabled ? "[-] " : ""}${safeMenuText(item.label)}${states.length > 0 ? ` \u2014 ${states.join(" \xB7 ")}` : ""}`;
    return { kind: "item", label: uniqueLabel2(label, used), item };
  });
  rows.push({
    kind: "exit",
    label: uniqueLabel2(options.hint === "close" ? "Close" : "\u2190 Back", used)
  });
  return rows;
}
function uniqueLabel2(label, used) {
  const base = label || "Choice";
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let suffix = 2;
  while (used.has(`${base} [${suffix}]`))
    suffix += 1;
  const unique = `${base} [${suffix}]`;
  used.add(unique);
  return unique;
}
function validateOptions2(options) {
  if (options.viewportSize !== void 0 && (!Number.isInteger(options.viewportSize) || options.viewportSize <= 0)) {
    return new Error("Live choice viewportSize must be a positive integer");
  }
  const itemIds = /* @__PURE__ */ new Set();
  for (const item of options.items) {
    if (!item.id.trim())
      return new Error("Live choice item ids must not be blank");
    if (itemIds.has(item.id))
      return new Error(`Duplicate live choice item id: ${item.id}`);
    itemIds.add(item.id);
  }
  const shortcutIds = /* @__PURE__ */ new Set();
  for (const shortcut of options.shortcuts ?? []) {
    if (!shortcut.id.trim())
      return new Error("Live choice shortcut ids must not be blank");
    if (shortcutIds.has(shortcut.id)) {
      return new Error(`Duplicate live choice shortcut id: ${shortcut.id}`);
    }
    if (shortcut.keys.length === 0) {
      return new Error(`Live choice shortcut ${shortcut.id} must declare at least one key`);
    }
    shortcutIds.add(shortcut.id);
  }
  return void 0;
}
async function liveChoiceError(ctx, options, error) {
  if (!isCurrent4(options) || options.signal?.aborted)
    return { kind: "stale" };
  await reportLiveChoiceError(ctx, options, error);
  if (!isCurrent4(options) || options.signal?.aborted)
    return { kind: "stale" };
  return { kind: "error", error };
}
async function reportLiveChoiceError(ctx, options, error) {
  const reporting = callErrorReporter(ctx, options, error);
  let reported = false;
  if (reporting) {
    try {
      await reporting.completion;
      reported = true;
    } catch {
    }
  }
  if (reported || !ctx.hasUI || !isCurrent4(options) || options.signal?.aborted)
    return;
  notifyInteractionError(ctx, error, "Live choice failed: ", safeMenuText);
}
function isCurrent4(options) {
  return options.isCurrent?.() ?? true;
}
function uiFor4(ctx) {
  return ctx.ui;
}

// node_modules/@narumitw/pi-tui-kit/dist/model.js
function defineMenu(definition) {
  if (!hasOwn(definition.screens, definition.start)) {
    throw new Error(`Menu starts at unknown screen: ${definition.start}`);
  }
  return definition;
}
function resolveMenuScreen(definition, screenId, state) {
  const factory = definition.screens[screenId];
  if (!factory)
    throw new Error(`Menu requested unknown screen: ${screenId}`);
  const screen = factory({ state });
  validateScreen(definition, screen);
  return screen;
}
function validateScreen(definition, screen) {
  if (!screen.title.trim())
    throw new Error("Menu screen title must not be empty");
  const ids = /* @__PURE__ */ new Set();
  const actionItems = screen.kind === "multiSelect" ? screen.actions ?? [] : [];
  for (const item of [..."items" in screen ? screen.items : [], ...actionItems]) {
    if (!item.id.trim())
      throw new Error("Menu item id must not be empty");
    if (ids.has(item.id))
      throw new Error(`Menu item id must be unique: ${item.id}`);
    ids.add(item.id);
  }
  if (screen.kind === "actions") {
    for (const item of screen.items)
      validateActionItem(definition, item);
    return;
  }
  if (screen.kind === "browse") {
    if (screen.viewportSize !== void 0 && screen.viewportSize !== "adaptive" && (!Number.isInteger(screen.viewportSize) || screen.viewportSize <= 0)) {
      throw new Error('Menu browse viewport size must be "adaptive" or a positive integer');
    }
    return;
  }
  if (screen.kind === "choice") {
    assertAction(definition, `choice screen ${screen.title}`, screen.action);
    if (screen.viewportSize !== void 0 && (!Number.isInteger(screen.viewportSize) || screen.viewportSize <= 0)) {
      throw new Error("Menu choice viewport size must be a positive integer");
    }
    return;
  }
  if (screen.kind === "settings") {
    for (const item of screen.items) {
      assertAction(definition, item.id, item.action);
      if (item.values && item.values.length === 0) {
        throw new Error(`Menu setting ${item.id} must define at least one value`);
      }
      if (item.values && !item.values.includes(item.currentValue)) {
        throw new Error(`Menu setting ${item.id} values must include its current value`);
      }
    }
    return;
  }
  if (screen.kind === "input") {
    assertAction(definition, `input screen ${screen.title}`, screen.action);
    return;
  }
  if (screen.kind === "review") {
    if (screen.viewportSize !== void 0 && screen.viewportSize !== "adaptive" && (!Number.isInteger(screen.viewportSize) || screen.viewportSize <= 0 || screen.viewportSize > MAX_REVIEW_VIEWPORT_SIZE)) {
      throw new Error(`Menu review viewport size must be "adaptive" or a positive integer no greater than ${MAX_REVIEW_VIEWPORT_SIZE}`);
    }
    if (screen.confirm) {
      if (!screen.confirm.id.trim()) {
        throw new Error("Menu review confirmation id must not be empty");
      }
      if (!screen.confirm.label.trim()) {
        throw new Error("Menu review confirmation label must not be empty");
      }
      assertAction(definition, `review screen ${screen.title}`, screen.confirm.action);
    }
    return;
  }
  if (screen.kind === "multiSelect") {
    assertAction(definition, screen.title, screen.action);
    if (screen.viewportSize !== void 0 && (!Number.isInteger(screen.viewportSize) || screen.viewportSize <= 0)) {
      throw new Error("Menu multi-select viewport size must be a positive integer");
    }
    for (const item of screen.actions ?? [])
      validateActionItem(definition, item);
  }
}
function validateActionItem(definition, item) {
  const targetCount = Number("to" in item) + Number("action" in item) + Number("close" in item);
  if (targetCount !== 1) {
    throw new Error(`Menu action item must have exactly one target: ${item.id}`);
  }
  if ("to" in item && item.to !== void 0 && !hasOwn(definition.screens, item.to)) {
    throw new Error(`Menu item ${item.id} references unknown screen: ${item.to}`);
  }
  if ("action" in item && item.action !== void 0 && !hasOwn(definition.actions, item.action)) {
    throw new Error(`Menu item ${item.id} references unknown action: ${item.action}`);
  }
}
function assertAction(definition, owner, action) {
  if (!hasOwn(definition.actions, action)) {
    throw new Error(`Menu item ${owner} references unknown action: ${action}`);
  }
}
function hasOwn(value, key) {
  return Object.hasOwn(value, key);
}

// node_modules/@narumitw/pi-tui-kit/dist/multi-select.js
async function runMultiSelect(ctx, options) {
  if (!isCurrent5(options) || options.signal?.aborted)
    return { kind: "stale" };
  const validationError = validateOptions3(options);
  if (validationError)
    return multiSelectError(ctx, options, validationError);
  const selected = new Set(options.items.filter((item) => item.selected).map((item) => item.id));
  if (ctx.mode === "tui" && ctx.hasUI)
    return runTuiMultiSelect(ctx, options, selected);
  if (ctx.mode === "rpc" && ctx.hasUI)
    return runRpcMultiSelect(ctx, options, selected);
  try {
    await options.onUnsupportedMode?.(ctx, ctx.mode);
  } catch (error) {
    return multiSelectError(ctx, options, error);
  }
  if (!isCurrent5(options) || options.signal?.aborted)
    return { kind: "stale" };
  return { kind: "unsupported", mode: ctx.mode };
}
async function runTuiMultiSelect(ctx, options, selected) {
  const doneId = internalDoneId(options.items);
  const screen = {
    kind: "multiSelect",
    title: options.title,
    lines: options.lines,
    items: options.items.map((item) => ({ ...item, selected: selected.has(item.id) })),
    action: "toggle",
    enableSearch: options.enableSearch,
    viewportSize: options.viewportSize,
    hint: options.hint,
    actions: [{ id: doneId, label: options.completionLabel ?? "Done", action: "complete" }]
  };
  const result = await runCustomInteraction(ctx, {
    signal: options.signal,
    isCurrent: options.isCurrent,
    onError: (currentCtx, error) => reportMultiSelectError(currentCtx, options, error),
    create: ({ tui, theme, keybindings, complete, signal }) => createMultiSelectComponent({
      screen,
      selectedItemId: options.initialItemId,
      tui,
      theme,
      keybindings,
      onEvent: (event) => {
        if (event.kind === "activate" && event.itemId === doneId)
          complete({ kind: "completed" });
        else if (event.kind !== "activate")
          complete({ kind: "cancelled", reason: event.kind });
      },
      async onMultiSelectChange(change) {
        if (signal.aborted || !isCurrent5(options))
          return false;
        if (change.selected)
          selected.add(change.itemId);
        else
          selected.delete(change.itemId);
        return true;
      }
    })
  });
  if (result.kind !== "completed")
    return result;
  if (result.value.kind === "cancelled")
    return result.value;
  return completedResult(options.items, selected);
}
async function runRpcMultiSelect(ctx, options, selected) {
  for (; ; ) {
    const rows = rpcRows2(options, selected);
    let selectedLabel;
    try {
      selectedLabel = await uiFor5(ctx).select([options.title, ...options.lines ?? []].map(safeMenuText).filter(Boolean).join("\n"), rows.map((row2) => row2.label), { signal: options.signal });
    } catch (error) {
      return multiSelectError(ctx, options, error);
    }
    if (!isCurrent5(options) || options.signal?.aborted)
      return { kind: "stale" };
    if (selectedLabel === void 0)
      return { kind: "cancelled", reason: options.hint ?? "back" };
    const row = rows.find((candidate) => candidate.label === selectedLabel);
    if (!row)
      return multiSelectError(ctx, options, new Error("Multi-select dialog returned an option that was not offered"));
    if (row.kind === "complete")
      return completedResult(options.items, selected);
    if (row.item.disabled)
      continue;
    if (selected.has(row.item.id))
      selected.delete(row.item.id);
    else
      selected.add(row.item.id);
  }
}
function completedResult(items, selected) {
  return { kind: "completed", selectedItemIds: items.filter((item) => selected.has(item.id)).map((item) => item.id) };
}
function rpcRows2(options, selected) {
  const used = /* @__PURE__ */ new Set();
  const rows = options.items.map((item) => {
    const state = item.disabled ? "[-]" : selected.has(item.id) ? "[x]" : "[ ]";
    const details = [
      item.disabled ? `unavailable${item.disabledReason ? `: ${safeMenuText(item.disabledReason)}` : ""}` : void 0,
      item.description ? safeMenuText(item.description) : void 0
    ].filter((value) => Boolean(value));
    const label = `${state} ${safeMenuText(item.label)}${details.length > 0 ? ` \u2014 ${details.join(" \xB7 ")}` : ""}`;
    return { kind: "item", label: uniqueLabel3(label, used), item };
  });
  rows.push({
    kind: "complete",
    label: uniqueLabel3(safeMenuText(options.completionLabel ?? "Done") || "Done", used)
  });
  return rows;
}
function uniqueLabel3(label, used) {
  const base = label || "Choice";
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let suffix = 2;
  while (used.has(`${base} [${suffix}]`))
    suffix += 1;
  const unique = `${base} [${suffix}]`;
  used.add(unique);
  return unique;
}
function internalDoneId(items) {
  const ids = new Set(items.map((item) => item.id));
  let id = "__pi_tui_kit_done__";
  while (ids.has(id))
    id = `_${id}`;
  return id;
}
function validateOptions3(options) {
  if (!safeMenuText(options.title))
    return new Error("Multi-select title must be displayable");
  if (options.viewportSize !== void 0 && (!Number.isInteger(options.viewportSize) || options.viewportSize <= 0)) {
    return new Error("Multi-select viewportSize must be a positive integer");
  }
  if (options.completionLabel !== void 0 && !safeMenuText(options.completionLabel).trim()) {
    return new Error("Multi-select completionLabel must be displayable");
  }
  const ids = /* @__PURE__ */ new Set();
  for (const item of options.items) {
    if (!item.id.trim())
      return new Error("Multi-select item ids must not be blank");
    if (ids.has(item.id))
      return new Error(`Duplicate multi-select item id: ${item.id}`);
    ids.add(item.id);
    if (!safeMenuText(item.label))
      return new Error(`Multi-select item ${item.id} requires a displayable label`);
  }
  return void 0;
}
async function multiSelectError(ctx, options, error) {
  if (!isCurrent5(options) || options.signal?.aborted)
    return { kind: "stale" };
  await reportMultiSelectError(ctx, options, error);
  if (!isCurrent5(options) || options.signal?.aborted)
    return { kind: "stale" };
  return { kind: "error", error };
}
async function reportMultiSelectError(ctx, options, error) {
  const reporting = callErrorReporter(ctx, options, error);
  let reported = false;
  if (reporting) {
    try {
      await reporting.completion;
      reported = true;
    } catch {
    }
  }
  if (reported || !ctx.hasUI || !isCurrent5(options) || options.signal?.aborted)
    return;
  notifyInteractionError(ctx, error, "Multi-select failed: ", safeMenuText);
}
function isCurrent5(options) {
  return options.isCurrent?.() ?? true;
}
function uiFor5(ctx) {
  return ctx.ui;
}

// node_modules/@narumitw/pi-tui-kit/dist/navigator.js
function createMenuNavigator(start) {
  const stack = [start];
  const selections = /* @__PURE__ */ new Map();
  let closed = false;
  let closeReason;
  return {
    get current() {
      const current = stack.at(-1);
      if (current === void 0)
        throw new Error("Menu is closed");
      return current;
    },
    get closed() {
      return closed;
    },
    get closeReason() {
      return closeReason;
    },
    apply(transition) {
      if (closed)
        return "closed";
      switch (transition.kind) {
        case "stay":
          break;
        case "to":
          stack.push(transition.screen);
          break;
        case "back":
          if (stack.length > 1)
            stack.pop();
          else {
            closed = true;
            closeReason = "back";
          }
          break;
        case "close":
          closed = true;
          closeReason = "close";
          break;
      }
      return closed ? "closed" : "active";
    },
    rememberSelection(screen, itemId) {
      selections.set(screen, itemId);
    },
    selectionFor(screen, availableItemIds) {
      if (availableItemIds.length === 0)
        return void 0;
      const remembered = selections.get(screen);
      if (remembered && availableItemIds.includes(remembered))
        return remembered;
      const fallback = availableItemIds[0];
      if (fallback !== void 0)
        selections.set(screen, fallback);
      return fallback;
    }
  };
}

// node_modules/@narumitw/pi-tui-kit/dist/components/pi-selectors.js
import { fuzzyFilter, Input, Key as Key2, matchesKey as matchesKey2, parseKey, truncateToWidth as truncateToWidth2, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
var BRACKETED_PASTE_START = "\x1B[200~";
var BRACKETED_PASTE_END = "\x1B[201~";
var INPUT_PREFIX_TIMEOUT_MS = 10;
function createPiSelector(options) {
  options = { ...options, keybindings: componentKeybindings(options.tui, options.keybindings, true) };
  const input = new Input();
  if (options.initialSearchInput)
    input.setValue(safe(options.initialSearchInput));
  let filtered = filterRows(options.rows, input.getValue(), options.prioritizeDefaultPrefix ?? false);
  let selectedIndex = options.filterSelection === "bestMatch" && input.getValue() ? 0 : initialIndex(filtered, options.initialValue, options.valueEquals);
  let disposed = false;
  let pasteStartBuffer = "";
  let pasteBuffer;
  let pasteStartTimer;
  let mousePressedIndex;
  const saveBinding = resolveSelectorBinding(options.keybindings, options.saveBinding, options.legacySaveBinding);
  let mouseLayout;
  const select = (index, wrap) => {
    if (filtered.length === 0)
      return;
    selectedIndex = wrap ? (index + filtered.length) % filtered.length : Math.max(0, Math.min(index, filtered.length - 1));
    options.tui.requestRender();
  };
  const refilter = () => {
    mousePressedIndex = void 0;
    const previous = filtered[selectedIndex]?.value;
    filtered = filterRows(options.rows, input.getValue(), options.prioritizeDefaultPrefix ?? false);
    if (options.filterSelection === "preserveValue" && previous !== void 0) {
      const preserved = filtered.findIndex((row) => options.valueEquals(row.value, previous));
      selectedIndex = Math.max(0, preserved);
    } else {
      selectedIndex = filtered.length === 0 ? 0 : Math.min(selectedIndex, filtered.length - 1);
      if (input.getValue())
        selectedIndex = 0;
    }
    options.tui.requestRender();
  };
  const completeSelected = (kind) => {
    const selected = filtered[selectedIndex];
    if (!selected || disposed)
      return;
    options.onComplete({ kind, value: selected.value });
  };
  input.onSubmit = () => completeSelected("selected");
  const handleSearchInput = (data) => {
    input.handleInput(parseKey(data) === void 0 ? safe(data) : data);
    if (!disposed)
      refilter();
  };
  const matchesAction = (data, binding) => matchesSelectorBinding(options.keybindings, data, binding, usesDisambiguatedKeyProtocol(options.tui));
  const saveDefault = (data) => {
    if (!matchesAction(data, saveBinding))
      return false;
    completeSelected("saveDefault");
    return true;
  };
  const handleNonPasteInput = (data) => {
    if (matchesKey2(data, Key2.ctrl("c"))) {
      options.onComplete({ kind: "closed", reason: "close" });
      return;
    }
    if (saveDefault(data))
      return;
    if (matchesAction(data, "tui.select.confirm")) {
      completeSelected("selected");
      return;
    }
    if (matchesAction(data, "tui.select.cancel")) {
      options.onComplete({ kind: "closed", reason: "back" });
      return;
    }
    if (options.cycleBinding && matchesAction(data, options.cycleBinding)) {
      select(selectedIndex + 1, true);
      return;
    }
    if (matchesAction(data, "tui.select.up"))
      select(selectedIndex - 1, true);
    else if (matchesAction(data, "tui.select.down")) {
      select(selectedIndex + 1, true);
    } else if (matchesAction(data, "tui.select.pageUp")) {
      select(selectedIndex - normalizeViewportSize(options.viewportSize), false);
    } else if (matchesAction(data, "tui.select.pageDown")) {
      select(selectedIndex + normalizeViewportSize(options.viewportSize), false);
    } else
      handleSearchInput(data);
  };
  function routeInput(data) {
    clearPasteStartTimer();
    if (pasteBuffer !== void 0) {
      pasteBuffer += data;
      flushPasteBuffer();
      return;
    }
    const combined = pasteStartBuffer + data;
    pasteStartBuffer = "";
    const pasteStart = combined.indexOf(BRACKETED_PASTE_START);
    if (pasteStart >= 0) {
      if (pasteStart > 0)
        handleNonPasteInput(combined.slice(0, pasteStart));
      if (disposed)
        return;
      pasteBuffer = combined.slice(pasteStart + BRACKETED_PASTE_START.length);
      flushPasteBuffer();
      return;
    }
    const prefixLength = trailingMarkerPrefixLength(combined, BRACKETED_PASTE_START);
    const outsidePaste = combined.slice(0, combined.length - prefixLength);
    if (outsidePaste)
      handleNonPasteInput(outsidePaste);
    if (disposed)
      return;
    const prefix = combined.slice(combined.length - prefixLength);
    if (prefix) {
      pasteStartBuffer = prefix;
      pasteStartTimer = setTimeout(() => {
        pasteStartTimer = void 0;
        const pending = pasteStartBuffer;
        pasteStartBuffer = "";
        if (!disposed && pending)
          handleNonPasteInput(pending);
      }, INPUT_PREFIX_TIMEOUT_MS);
      pasteStartTimer.unref?.();
    }
  }
  function clearPasteStartTimer() {
    if (!pasteStartTimer)
      return;
    clearTimeout(pasteStartTimer);
    pasteStartTimer = void 0;
  }
  function flushPasteBuffer() {
    if (pasteBuffer === void 0)
      return;
    const pasteEnd = pasteBuffer.indexOf(BRACKETED_PASTE_END);
    if (pasteEnd < 0)
      return;
    const pasted = pasteBuffer.slice(0, pasteEnd);
    const remaining = pasteBuffer.slice(pasteEnd + BRACKETED_PASTE_END.length);
    pasteBuffer = void 0;
    input.handleInput(`${BRACKETED_PASTE_START}${normalizePastedInput(pasted)}${BRACKETED_PASTE_END}`);
    refilter();
    if (remaining && !disposed)
      routeInput(remaining);
  }
  function handleMouse(event) {
    if (disposed || !mouseLayout || event.width !== mouseLayout.width)
      return void 0;
    if (event.y === mouseLayout.inputFrameRow) {
      return input.handleMouse({
        ...event,
        x: event.x - 2,
        y: 0,
        width: Math.max(1, event.width - 2),
        height: 1
      });
    }
    const itemIndex = mouseLayout.itemByFrameRow.get(event.y);
    if (itemIndex === void 0)
      return void 0;
    if (event.type === "wheel" && event.wheelDelta) {
      const next = Math.max(0, Math.min(filtered.length - 1, selectedIndex + (event.wheelDelta < 0 ? -1 : 1)));
      const changed = next !== selectedIndex;
      if (changed)
        select(next, false);
      return { handled: true, render: changed };
    }
    if (event.type !== "move" && event.button !== "left")
      return void 0;
    if (event.type === "move")
      return { handled: true };
    if (event.type === "press") {
      mousePressedIndex = itemIndex;
      const changed = itemIndex !== selectedIndex;
      if (changed)
        select(itemIndex, false);
      return { handled: true, focus: true, render: changed };
    }
    if (event.type === "click") {
      const clickedIndex = mousePressedIndex ?? itemIndex;
      mousePressedIndex = void 0;
      selectedIndex = clickedIndex;
      completeSelected("selected");
      return { handled: true };
    }
    return void 0;
  }
  return {
    capturesViewportInput: true,
    get focused() {
      return input.focused;
    },
    set focused(value) {
      input.focused = value;
    },
    render(width) {
      if (!Number.isFinite(width) || width <= 0)
        return [];
      const safeWidth = Math.max(1, Math.floor(width));
      const viewportSize = normalizeViewportSize(options.viewportSize);
      const start = Math.max(0, Math.min(selectedIndex - Math.floor(viewportSize / 2), filtered.length - viewportSize));
      const visible = filtered.slice(start, start + viewportSize);
      const searchRows = renderSearchInput(input, safeWidth);
      const requestedDescriptionColumnWidth = options.inlineDescriptions ? inlineDescriptionColumnWidth(visible) : void 0;
      const descriptionColumnWidth = requestedDescriptionColumnWidth !== void 0 && canRenderInlineDescriptions(safeWidth, requestedDescriptionColumnWidth) ? requestedDescriptionColumnWidth : void 0;
      const content = [
        ...searchRows,
        "",
        ...visible.map((row, index) => renderRow(row, start + index, selectedIndex, options.theme, safeWidth, descriptionColumnWidth))
      ];
      const selected = filtered[selectedIndex];
      if (start > 0 || start + visible.length < filtered.length) {
        content.push(options.theme.fg("muted", `  (${selectedIndex + 1}/${filtered.length})`));
      }
      const detailStart = content.length;
      if (filtered.length === 0) {
        content.push(options.theme.fg("muted", "  No matching options; edit search"));
      } else if (descriptionColumnWidth === void 0 && selected?.description) {
        content.push(...wrapTextWithAnsi(safe(selected.description), Math.max(1, safeWidth - 2)).map((line) => options.theme.fg("muted", `  ${line}`)));
      }
      const keyPlan = selectorKeyPlan(options.keybindings, saveBinding, options.cycleBinding, usesDisambiguatedKeyProtocol(options.tui));
      const hint = selectorHint(keyPlan);
      const cycleHint = selectorCycleHint(keyPlan);
      const listSelectedIndex = selectedIndex - start;
      const selectedContentIndex = filtered.length === 0 ? detailStart : searchRows.length + 1 + listSelectedIndex;
      const rule = new HorizontalRule({
        ruleStyle: (text) => options.theme.fg("border", text)
      }).render(safeWidth)[0] ?? "";
      const layout = renderBoundedFrameLayout({
        width: safeWidth,
        maxRows: componentRows(options.tui.terminal.rows),
        rule,
        title: options.title ? [safe(options.title)] : [],
        context: [...cycleHint ? [cycleHint] : [], ...(options.context ?? []).map((line) => safe(line))],
        content,
        hints: hint ? [options.theme.fg("dim", `  ${hint}`)] : [],
        compactHint: hint ? options.theme.fg("dim", hint) : "",
        priorityRows: [selectedContentIndex, 0, ...content.slice(detailStart).map((_, index) => detailStart + index)],
        focusedRow: selectedContentIndex
      });
      const frameRowByContent = new Map(layout.contentRows.map(({ contentIndex, frameIndex }) => [contentIndex, frameIndex]));
      mouseLayout = {
        width: safeWidth,
        inputFrameRow: frameRowByContent.get(0),
        itemByFrameRow: new Map(visible.flatMap((_, index) => {
          const frameRow = frameRowByContent.get(searchRows.length + 1 + index);
          return frameRow === void 0 ? [] : [[frameRow, start + index]];
        }))
      };
      return layout.lines;
    },
    invalidate() {
      mouseLayout = void 0;
      input.invalidate();
    },
    handleInput(data) {
      if (!disposed)
        routeInput(data);
    },
    handleMouse,
    dispose() {
      disposed = true;
      clearPasteStartTimer();
      pasteStartBuffer = "";
      pasteBuffer = void 0;
      mousePressedIndex = void 0;
      mouseLayout = void 0;
    }
  };
}
function filterRows(rows, query, prioritizeDefaultPrefix) {
  const safeQuery = safe(query).trim();
  if (!safeQuery)
    return [...rows];
  const filtered = fuzzyFilter([...rows], safeQuery, (row) => [row.searchText, row.primary, row.secondary, row.description].filter((value) => Boolean(value)).map(safe).join(" "));
  if (!prioritizeDefaultPrefix || !"default".startsWith(safeQuery.toLowerCase())) {
    return filtered;
  }
  const defaults = rows.filter((row) => row.default);
  return [...defaults, ...filtered.filter((row) => !row.default)];
}
function initialIndex(rows, initialValue, equals) {
  if (initialValue !== void 0) {
    const explicit = rows.findIndex((row) => equals(row.value, initialValue));
    if (explicit >= 0)
      return explicit;
  }
  const current = rows.findIndex((row) => row.current);
  return Math.max(0, current);
}
function renderRow(row, index, selectedIndex, theme, width, descriptionColumnWidth) {
  const selected = index === selectedIndex;
  const cursor = selected ? theme.fg("accent", "\u2192 ") : "  ";
  const current = row.current ? theme.fg("accent", "\u2713 ") : "  ";
  const primary = selected ? theme.fg("accent", safe(row.primary)) : safe(row.primary);
  const secondary = row.secondary ? ` ${theme.fg("muted", safe(row.secondary))}` : "";
  const defaultBadge = row.default ? theme.fg("muted", " \xB7 default") : "";
  const prefix = `${cursor}${current}`;
  const primaryText = `${primary}${secondary}${defaultBadge}`;
  if (descriptionColumnWidth !== void 0 && row.description && width > 40) {
    const effectiveColumnWidth = Math.max(1, Math.min(descriptionColumnWidth, width - visibleWidth(prefix) - 4));
    const truncatedPrimary = truncateToWidth2(primaryText, Math.max(1, effectiveColumnWidth - 2), "");
    const spacing = " ".repeat(Math.max(1, effectiveColumnWidth - visibleWidth(truncatedPrimary)));
    const remainingWidth = width - visibleWidth(prefix) - visibleWidth(truncatedPrimary) - spacing.length - 2;
    if (remainingWidth > 10) {
      const description = truncateToWidth2(safe(row.description), remainingWidth, "");
      return `${prefix}${truncatedPrimary}${theme.fg("muted", `${spacing}${description}`)}`;
    }
  }
  return `${prefix}${primaryText}`;
}
function inlineDescriptionColumnWidth(rows) {
  const widest = rows.reduce((width, row) => {
    const primary = `${safe(row.primary)}${row.secondary ? ` ${safe(row.secondary)}` : ""}${row.default ? " \xB7 default" : ""}`;
    return Math.max(width, visibleWidth(primary) + 2);
  }, 0);
  return Math.max(12, Math.min(widest, 32));
}
function canRenderInlineDescriptions(width, columnWidth) {
  const prefixWidth = 4;
  if (width <= 40)
    return false;
  const effectiveColumnWidth = Math.max(1, Math.min(columnWidth, width - prefixWidth - 4));
  return width - prefixWidth - effectiveColumnWidth - 2 > 10;
}
function renderSearchInput(input, width) {
  const prefix = "  ";
  const inputWidth = Math.max(1, width - visibleWidth(prefix));
  return input.render(inputWidth).map((line) => truncateToWidth2(`${prefix}${line}`, width, ""));
}
function selectorKeyPlan(keybindings, saveBinding, cycleBinding, disambiguatedKeyProtocol) {
  const claimed = ["ctrl+c"];
  const claim = (binding) => {
    const available = [];
    if (!binding)
      return available;
    for (const key of getBindingKeys(keybindings, binding)) {
      const canonical = canonicalKeyId(key);
      if (!canonical || claimed.some((other) => keysOverlap(canonical, other, disambiguatedKeyProtocol)))
        continue;
      claimed.push(canonical);
      available.push(canonical);
    }
    return available;
  };
  return {
    save: claim(saveBinding),
    confirm: claim("tui.select.confirm"),
    cancel: claim("tui.select.cancel"),
    cycle: claim(cycleBinding)
  };
}
function selectorHint(plan) {
  return formatInteractionHints({ getKeys: () => [] }, [
    { keys: plan.confirm, label: "select" },
    { keys: plan.save, label: "set as default" },
    { keys: plan.cancel, label: "cancel" }
  ]);
}
function selectorCycleHint(plan) {
  return formatInteractionHints({ getKeys: () => [] }, [{ keys: plan.cycle, label: "cycle choice" }]);
}
function matchesSelectorBinding(keybindings, data, binding, disambiguatedKeyProtocol) {
  if (!disambiguatedKeyProtocol)
    return matchesBinding(keybindings, data, binding);
  const inputKey = canonicalKeyId(parseKey(data) ?? "");
  return inputKey !== void 0 && getBindingKeys(keybindings, binding).some((key) => canonicalKeyId(key) === inputKey);
}
function resolveSelectorBinding(keybindings, binding, fallback) {
  if (!fallback || bindingDefinitionExists(keybindings, binding))
    return binding;
  return fallback;
}
function bindingDefinitionExists(keybindings, binding) {
  const compatible = keybindings;
  if (compatible.getDefinition)
    return compatible.getDefinition(binding) !== void 0;
  return compatible.getKeys(binding).length > 0;
}
function matchesBinding(keybindings, data, binding) {
  return keybindings.matches(data, binding);
}
function getBindingKeys(keybindings, binding) {
  return keybindings.getKeys(binding);
}
function normalizeViewportSize(value) {
  return Number.isInteger(value) && (value ?? 0) > 0 ? value : 10;
}
function safe(value) {
  return sanitizeTerminalText(value);
}
function normalizePastedInput(value) {
  return safe(value.replace(/\r\n/gu, "").replace(/\r/gu, "").replace(/\n/gu, "").replace(/\t/gu, "    "));
}
function trailingMarkerPrefixLength(value, marker) {
  for (let length = Math.min(value.length, marker.length - 1); length > 0; length -= 1) {
    if (value.endsWith(marker.slice(0, length)))
      return length;
  }
  return 0;
}

// node_modules/@narumitw/pi-tui-kit/dist/pi-selectors.js
var LEVEL_DESCRIPTIONS = {
  off: "No reasoning",
  minimal: "Very brief reasoning (~1k tokens)",
  low: "Light reasoning (~2k tokens)",
  medium: "Moderate reasoning (~8k tokens)",
  high: "Deep reasoning (~16k tokens)",
  xhigh: "Extra-high reasoning (~32k tokens)",
  max: "Maximum reasoning"
};
async function runModelSelector(ctx, options) {
  const models = sortModels(options.models, options.currentModel, options.defaultModel);
  const rows = models.map((model) => ({
    value: model,
    primary: model.id,
    secondary: `[${model.provider}]`,
    description: model.name ? `Model Name: ${model.name}` : void 0,
    searchText: modelSelectorSearchText(model, sameModel(model, options.defaultModel)),
    current: sameModel(model, options.currentModel),
    default: sameModel(model, options.defaultModel)
  }));
  const result = await runCustomInteraction(ctx, {
    signal: options.signal,
    isCurrent: options.isCurrent,
    onError: options.onError,
    onUnsupportedMode: options.onUnsupportedMode,
    create: ({ tui, theme, keybindings, complete }) => {
      validateViewportSize(options.viewportSize);
      validateModelRows(models);
      return createPiSelector({
        rows,
        context: options.lines,
        initialValue: models.find((model) => sameModel(model, options.currentModel)),
        initialSearchInput: options.initialSearchInput,
        viewportSize: options.viewportSize,
        saveBinding: "app.models.save",
        filterSelection: "bestMatch",
        prioritizeDefaultPrefix: true,
        valueEquals: sameModel,
        onComplete: complete,
        tui,
        theme,
        keybindings
      });
    }
  });
  if (result.kind !== "completed")
    return result;
  if (result.value.kind === "selected")
    return { kind: "selected", model: result.value.value };
  if (result.value.kind === "saveDefault") {
    return { kind: "saveDefault", model: result.value.value };
  }
  return result.value;
}
async function runThinkingSelector(ctx, options) {
  const rows = options.availableLevels.map((level) => ({
    value: level,
    primary: level,
    description: LEVEL_DESCRIPTIONS[level],
    current: level === options.currentLevel,
    default: level === options.defaultLevel,
    searchText: level === options.defaultLevel ? "default" : void 0
  }));
  const result = await runCustomInteraction(ctx, {
    signal: options.signal,
    isCurrent: options.isCurrent,
    onError: options.onError,
    onUnsupportedMode: options.onUnsupportedMode,
    create: ({ tui, theme, keybindings, complete }) => {
      validateViewportSize(options.viewportSize);
      validateThinkingLevels(options.availableLevels, options.currentLevel);
      return createPiSelector({
        title: "Thinking Level",
        rows,
        initialValue: options.currentLevel,
        initialSearchInput: options.initialSearchInput,
        viewportSize: options.viewportSize ?? options.availableLevels.length,
        saveBinding: "app.thinking.save",
        legacySaveBinding: "app.models.save",
        cycleBinding: "app.thinking.cycle",
        filterSelection: "preserveValue",
        inlineDescriptions: true,
        valueEquals: (left, right) => left === right,
        onComplete: complete,
        tui,
        theme,
        keybindings
      });
    }
  });
  if (result.kind !== "completed")
    return result;
  if (result.value.kind === "selected")
    return { kind: "selected", level: result.value.value };
  if (result.value.kind === "saveDefault") {
    return { kind: "saveDefault", level: result.value.value };
  }
  return result.value;
}
function modelSelectorSearchText(model, isDefault) {
  return [
    model.provider,
    `${model.provider}/${model.id}`,
    model.provider,
    model.id,
    model.name,
    model.searchText,
    isDefault ? "default" : void 0
  ].filter((value) => Boolean(value)).join(" ");
}
function sortModels(models, current, defaultModel) {
  return models.map((model, index) => ({ model, index })).sort((left, right) => {
    const currentOrder = Number(sameModel(right.model, current)) - Number(sameModel(left.model, current));
    if (currentOrder !== 0)
      return currentOrder;
    const defaultOrder = Number(sameModel(right.model, defaultModel)) - Number(sameModel(left.model, defaultModel));
    return defaultOrder || sanitizeSortText(left.model.provider).localeCompare(sanitizeSortText(right.model.provider)) || left.index - right.index;
  }).map(({ model }) => model);
}
function sameModel(left, right) {
  return left.provider === right?.provider && left.id === right.id;
}
function sanitizeSortText(value) {
  return sanitizeTerminalText(value);
}
function validateViewportSize(viewportSize) {
  if (viewportSize !== void 0 && (!Number.isInteger(viewportSize) || !Number.isFinite(viewportSize) || viewportSize <= 0)) {
    throw new Error("Selector viewport size must be a positive integer");
  }
}
function validateModelRows(models) {
  if (models.length === 0)
    throw new Error("Model selector requires at least one model");
  const identities = /* @__PURE__ */ new Set();
  for (const model of models) {
    const identity = `${model.provider}\0${model.id}`;
    if (identities.has(identity)) {
      const reference = `${sanitizeTerminalText(model.provider)}/${sanitizeTerminalText(model.id)}`;
      throw new Error(`Model selector contains duplicate model ${reference}`);
    }
    identities.add(identity);
  }
}
function validateThinkingLevels(levels, current) {
  if (levels.length === 0)
    throw new Error("Thinking selector requires at least one level");
  if (new Set(levels).size !== levels.length) {
    throw new Error("Thinking selector contains duplicate levels");
  }
  if (!levels.includes(current)) {
    throw new Error(`Current thinking level ${sanitizeTerminalText(current)} is not available`);
  }
}

// node_modules/@narumitw/pi-tui-kit/dist/questionnaire.js
var DEFAULT_LABELS = {
  reviewTab: "Review",
  reviewTitle: "Review answers",
  otherOption: "Other (free-form)",
  customAnswer: "Custom answer",
  optionalNote: "Optional note",
  answer: "Answer",
  note: "Note"
};
async function runQuestionnaire(ctx, options) {
  if (!isCurrent6(options) || options.signal?.aborted)
    return { kind: "stale" };
  const validationError = validateOptions4(options);
  if (validationError)
    return questionnaireError(ctx, options, validationError);
  const resolved = resolveOptions(options);
  if (ctx.mode === "tui" && ctx.hasUI)
    return runTuiQuestionnaire(ctx, options, resolved);
  if (ctx.mode === "rpc" && ctx.hasUI)
    return runRpcQuestionnaire(ctx, options, resolved);
  try {
    await options.onUnsupportedMode?.(ctx, ctx.mode);
  } catch (error) {
    return questionnaireError(ctx, options, error);
  }
  if (!isCurrent6(options) || options.signal?.aborted)
    return { kind: "stale" };
  return { kind: "unsupported", mode: ctx.mode };
}
async function runTuiQuestionnaire(ctx, options, resolved) {
  let QuestionnaireComponent;
  try {
    ({ QuestionnaireComponent } = await import("./questionnaire-2E2TWXIN.ts"));
  } catch (error) {
    return questionnaireError(ctx, options, error);
  }
  if (!isCurrent6(options) || options.signal?.aborted)
    return { kind: "stale" };
  const result = await runCustomInteraction(ctx, {
    blocked: options.blocked,
    signal: options.signal,
    isCurrent: options.isCurrent,
    onError: (currentCtx, error) => reportQuestionnaireError(currentCtx, options, error),
    create: ({ tui, theme, keybindings, complete }) => new QuestionnaireComponent({
      ...resolved,
      tui,
      theme,
      keybindings,
      editorFactory: uiFor6(ctx).getEditorComponent?.(),
      isCurrent: () => isCurrent6(options),
      onDone: complete
    })
  });
  return result.kind === "completed" ? result.value : result;
}
async function runRpcQuestionnaire(ctx, options, resolved) {
  const answers = [];
  for (const question of resolved.questions) {
    const rows = question.options.map((option2, index) => ({
      kind: "option",
      index,
      label: formatRpcOption(option2, index)
    }));
    if (resolved.allowCustomAnswer) {
      rows.push({
        kind: "custom",
        index: question.options.length,
        label: `${question.options.length + 1}. ${sanitizeTerminalText(resolved.labels.otherOption)}`
      });
    }
    let selection;
    try {
      selection = await uiFor6(ctx).select(`${sanitizeTerminalText(question.header)}: ${sanitizeTerminalText(question.prompt)}`, rows.map((row2) => row2.label), { signal: options.signal });
    } catch (error) {
      return questionnaireError(ctx, options, error);
    }
    if (!isCurrent6(options) || options.signal?.aborted)
      return { kind: "stale" };
    if (selection === void 0)
      return { kind: "closed", reason: "back" };
    const row = rows.find((candidate) => candidate.label === selection);
    if (!row) {
      return questionnaireError(ctx, options, new Error("Questionnaire dialog returned an option that was not offered"));
    }
    if (row.kind === "custom") {
      const custom = await askRpcCustomAnswer(ctx, options, resolved, question);
      if (custom.kind !== "answered")
        return custom.result;
      answers.push({ questionId: question.id, answer: custom.answer, wasCustom: true });
      continue;
    }
    const option = question.options[row.index];
    if (!option) {
      return questionnaireError(ctx, options, new Error("Questionnaire option disappeared"));
    }
    answers.push({
      questionId: question.id,
      answer: option.label,
      wasCustom: false,
      optionIndex: row.index + 1
    });
  }
  return { kind: "submitted", answers };
}
async function askRpcCustomAnswer(ctx, options, resolved, question) {
  let draft = "";
  for (; ; ) {
    let answer;
    try {
      answer = await uiFor6(ctx).editor(sanitizeTerminalText(question.prompt), draft);
    } catch (error) {
      return { kind: "finished", result: await questionnaireError(ctx, options, error) };
    }
    if (!isCurrent6(options) || options.signal?.aborted) {
      return { kind: "finished", result: { kind: "stale" } };
    }
    if (answer === void 0) {
      return { kind: "finished", result: { kind: "closed", reason: "back" } };
    }
    if (resolved.maxTextLength !== void 0 && answer.length > resolved.maxTextLength) {
      try {
        uiFor6(ctx).notify(`Custom answer must be ${formatLimit(resolved.maxTextLength)} characters or fewer.`, "warning");
      } catch (error) {
        return { kind: "finished", result: await questionnaireError(ctx, options, error) };
      }
      draft = answer;
      continue;
    }
    return { kind: "answered", answer };
  }
}
function resolveOptions(options) {
  return {
    questions: options.questions,
    allowCustomAnswer: options.allowCustomAnswer ?? true,
    allowNotes: options.allowNotes ?? false,
    maxTextLength: options.maxTextLength,
    labels: { ...DEFAULT_LABELS, ...options.labels }
  };
}
function validateOptions4(options) {
  if (options.questions.length === 0)
    return new Error("Questionnaire requires at least one question");
  if (options.maxTextLength !== void 0 && (!Number.isInteger(options.maxTextLength) || options.maxTextLength <= 0)) {
    return new Error("Questionnaire maxTextLength must be a positive integer");
  }
  const ids = /* @__PURE__ */ new Set();
  for (const question of options.questions) {
    if (!question.id.trim())
      return new Error("Questionnaire question ids must not be blank");
    if (ids.has(question.id))
      return new Error(`Duplicate questionnaire question id: ${question.id}`);
    ids.add(question.id);
    if (!sanitizeTerminalText(question.header).trim()) {
      return new Error(`Questionnaire question ${question.id} requires a displayable header`);
    }
    if (!sanitizeTerminalText(question.prompt).trim()) {
      return new Error(`Questionnaire question ${question.id} requires a displayable prompt`);
    }
    if (question.options.length === 0) {
      return new Error(`Questionnaire question ${question.id} requires at least one option`);
    }
    for (const option of question.options) {
      if (!sanitizeTerminalText(option.label).trim()) {
        return new Error(`Questionnaire question ${question.id} has a blank option label`);
      }
    }
  }
  for (const [name, label] of Object.entries(options.labels ?? {})) {
    if (!sanitizeTerminalText(label).trim()) {
      return new Error(`Questionnaire label ${name} must be displayable`);
    }
  }
  return void 0;
}
function formatRpcOption(option, index) {
  const label = sanitizeTerminalText(option.label);
  const description = option.description ? ` \u2014 ${sanitizeTerminalText(option.description)}` : "";
  return `${index + 1}. ${label}${description}`;
}
async function questionnaireError(ctx, options, error) {
  if (!isCurrent6(options) || options.signal?.aborted)
    return { kind: "stale" };
  await reportQuestionnaireError(ctx, options, error);
  if (!isCurrent6(options) || options.signal?.aborted)
    return { kind: "stale" };
  return { kind: "error", error };
}
async function reportQuestionnaireError(ctx, options, error) {
  const reporting = callErrorReporter(ctx, options, error);
  let reported = false;
  if (reporting) {
    try {
      await reporting.completion;
      reported = true;
    } catch {
    }
  }
  if (reported || !ctx.hasUI || !isCurrent6(options) || options.signal?.aborted)
    return;
  notifyInteractionError(ctx, error, "Questionnaire failed: ", sanitizeTerminalText);
}
function isCurrent6(options) {
  return options.isCurrent?.() ?? true;
}
function formatLimit(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
}
function uiFor6(ctx) {
  return ctx.ui;
}

// node_modules/@narumitw/pi-tui-kit/dist/components/task-loader.js
import { Container, Key as Key3, Loader, matchesKey as matchesKey3, Spacer, Text, truncateToWidth as truncateToWidth3 } from "@earendil-works/pi-tui";
var TaskLoader = class extends Container {
  keybindings;
  loader;
  cancellable;
  disposed = false;
  onAbort;
  constructor(tui, theme, keybindings, message, options = {}) {
    super();
    this.keybindings = keybindings;
    this.cancellable = options.cancellable ?? true;
    const cancelHint = this.cancellable ? cancelKeyText(componentKeybindings(tui, keybindings)) : void 0;
    const borderColor = (text) => theme.fg("border", text);
    this.addChild(new HorizontalRule({ ruleStyle: borderColor }));
    this.loader = new Loader(tui, (text) => theme.fg("accent", text), (text) => theme.fg("muted", text), message);
    this.addChild(this.loader);
    if (cancelHint !== void 0) {
      this.addChild(new Spacer(1));
      this.addChild(new CallbackText(() => theme.fg("dim", cancelHint) + theme.fg("muted", " cancel")));
    }
    this.addChild(new Spacer(1));
    this.addChild(new HorizontalRule({ ruleStyle: borderColor }));
  }
  render(width) {
    if (!Number.isFinite(width))
      return [];
    const safeWidth = Math.floor(width);
    if (safeWidth <= 0)
      return [];
    return super.render(safeWidth).map((line) => truncateToWidth3(line, safeWidth, ""));
  }
  handleInput(data) {
    if (this.disposed || !this.cancellable)
      return;
    const matches = this.keybindings.matches;
    const cancelled = matchesKey3(data, Key3.ctrl("c")) || (typeof matches === "function" ? matches.call(this.keybindings, data, "tui.select.cancel") : matchesKey3(data, Key3.escape));
    if (cancelled)
      this.onAbort?.();
  }
  dispose() {
    if (this.disposed)
      return;
    this.disposed = true;
    this.loader.stop();
  }
};
var CallbackText = class extends Text {
  content;
  constructor(content) {
    super(content(), 1, 0);
    this.content = content;
  }
  invalidate() {
    this.setText(this.content());
  }
};
function cancelKeyText(keybindings) {
  const getKeys = keybindings.getKeys;
  const configuredKeys = typeof getKeys === "function" ? getKeys.call(keybindings, "tui.select.cancel") : ["escape"];
  const keys = [.../* @__PURE__ */ new Set([...configuredKeys, "ctrl+c"])];
  return keys.map(displayKey).join("/");
}
function displayKey(key) {
  return key.split("+").map((part) => process.platform === "darwin" && part.toLowerCase() === "alt" ? "option" : part).join("+");
}

// node_modules/@narumitw/pi-tui-kit/dist/task.js
async function runTask(ctx, options) {
  if (!isCurrent7(options) || options.signal?.aborted)
    return { kind: "stale" };
  if (ctx.mode !== "tui" || !ctx.hasUI) {
    const controller = new AbortController();
    const signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal;
    return executeTask(ctx, options, signal, {
      userCancelled: false,
      externallyDisposed: false
    });
  }
  return runTuiTask(ctx, options);
}
async function runTuiTask(ctx, options) {
  const controller = new AbortController();
  const signal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal;
  const ownership = { userCancelled: false, externallyDisposed: false };
  let taskPromise;
  let taskSettled = false;
  let componentDisposed = false;
  let customResult;
  let customError;
  try {
    customResult = await uiFor7(ctx).custom((tui, theme, keybindings, done) => {
      const loader = new TaskLoader(tui, theme, keybindings, safeMenuText(options.label), {
        cancellable: options.cancellable ?? true
      });
      let loaderDisposed = false;
      const disposeLoader = () => {
        if (loaderDisposed)
          return;
        loaderDisposed = true;
        loader.dispose();
      };
      loader.onAbort = () => {
        if (taskSettled || ownership.userCancelled)
          return;
        ownership.userCancelled = true;
        controller.abort(new DOMException("Task cancelled", "AbortError"));
      };
      taskPromise = executeTask(ctx, options, signal, ownership);
      void taskPromise.then((result) => {
        taskSettled = true;
        disposeLoader();
        if (!componentDisposed)
          done(result);
      });
      return {
        render: (width) => loader.render(width),
        invalidate: () => loader.invalidate(),
        handleInput: (data) => loader.handleInput(data),
        dispose() {
          if (componentDisposed)
            return;
          componentDisposed = true;
          if (!taskSettled && !ownership.userCancelled && !options.signal?.aborted) {
            ownership.externallyDisposed = true;
          }
          controller.abort(new DOMException("Task UI disposed", "AbortError"));
          disposeLoader();
        }
      };
    });
  } catch (error) {
    customError = error;
    controller.abort(new DOMException("Task UI failed", "AbortError"));
  }
  if (customError === void 0 && customResult === void 0 && !ownership.userCancelled && !options.signal?.aborted) {
    ownership.externallyDisposed = true;
    controller.abort(new DOMException("Task UI closed", "AbortError"));
  }
  const taskResult = taskPromise ? await taskPromise : void 0;
  if (ownership.externallyDisposed || !isCurrent7(options) || options.signal?.aborted) {
    return { kind: "stale" };
  }
  if (customError !== void 0) {
    await reportTaskError(ctx, options, customError);
    if (!isCurrent7(options) || options.signal?.aborted)
      return { kind: "stale" };
    return { kind: "error", error: customError };
  }
  return customResult ?? taskResult ?? { kind: "stale" };
}
async function executeTask(ctx, options, signal, ownership) {
  if (!isCurrent7(options) || options.signal?.aborted || ownership.externallyDisposed) {
    return { kind: "stale" };
  }
  if (ownership.userCancelled || signal.aborted)
    return abortResult(options, ownership);
  try {
    const value = await options.task({ ctx, signal });
    if (!isCurrent7(options) || options.signal?.aborted || ownership.externallyDisposed) {
      return { kind: "stale" };
    }
    if (ownership.userCancelled || signal.aborted)
      return abortResult(options, ownership);
    return { kind: "completed", value };
  } catch (error) {
    if (!isCurrent7(options) || options.signal?.aborted || ownership.externallyDisposed) {
      return { kind: "stale" };
    }
    if (ownership.userCancelled || signal.aborted)
      return abortResult(options, ownership);
    await reportTaskError(ctx, options, error, signal);
    if (!isCurrent7(options) || options.signal?.aborted || ownership.externallyDisposed) {
      return { kind: "stale" };
    }
    if (ownership.userCancelled || signal.aborted)
      return abortResult(options, ownership);
    return { kind: "error", error };
  }
}
function abortResult(options, ownership) {
  return ownership.userCancelled && !options.signal?.aborted ? { kind: "cancelled" } : { kind: "stale" };
}
async function reportTaskError(ctx, options, error, signal = options.signal) {
  const reporting = callErrorReporter(ctx, options, error);
  if (reporting) {
    try {
      await reporting.completion;
      return;
    } catch {
    }
  }
  if (!ctx.hasUI || !isCurrent7(options) || options.signal?.aborted || signal?.aborted)
    return;
  notifyInteractionError(ctx, error, "Task failed: ", safeMenuText);
}
function isCurrent7(options) {
  return options.isCurrent?.() ?? true;
}
function uiFor7(ctx) {
  return ctx.ui;
}

// node_modules/@narumitw/pi-tui-kit/dist/interaction.js
async function invokeMenuInteraction(options) {
  const { ctx, definition, screen, state, menuSignal, runtime, interaction } = options;
  const signal = options.interactionSignal ? AbortSignal.any([menuSignal, options.interactionSignal]) : menuSignal;
  switch (interaction.kind) {
    case "activate": {
      if (screen.kind === "actions") {
        const item = screen.items.find((candidate) => candidate.id === interaction.itemId);
        if (!item || item.disabled)
          return rejected();
        return activateActionItem(ctx, definition, item, state, signal, runtime);
      }
      if (screen.kind === "choice") {
        const item = screen.items.find((candidate) => candidate.id === interaction.itemId);
        if (!item || item.disabled)
          return rejected();
        return withSelection(await invokeAction(ctx, definition.actions[screen.action], state, signal, item.id, runtime), item.id);
      }
      if (screen.kind === "review") {
        if (!screen.confirm || screen.confirm.id !== interaction.itemId)
          return rejected();
        return invokeAction(ctx, definition.actions[screen.confirm.action], state, signal, screen.confirm.id, runtime);
      }
      if (screen.kind === "multiSelect") {
        const item = screen.actions?.find((candidate) => candidate.id === interaction.itemId);
        if (!item || item.disabled)
          return rejected();
        return activateActionItem(ctx, definition, item, state, signal, runtime);
      }
      return rejected();
    }
    case "setting": {
      if (screen.kind !== "settings")
        return rejected();
      const item = screen.items.find((candidate) => candidate.id === interaction.itemId);
      if (!item || item.disabled)
        return rejected();
      return withSelection(await invokeAction(ctx, definition.actions[item.action], state, signal, item.id, runtime, {
        value: interaction.value
      }), item.id);
    }
    case "multiSelect": {
      if (screen.kind !== "multiSelect")
        return rejected();
      const item = screen.items.find((candidate) => candidate.id === interaction.itemId);
      if (!item || item.disabled)
        return rejected();
      return withSelection(await invokeAction(ctx, definition.actions[screen.action], state, signal, item.id, runtime, {
        selected: interaction.selected
      }), item.id);
    }
    case "input":
      if (screen.kind !== "input")
        return rejected();
      return invokeAction(ctx, definition.actions[screen.action], state, signal, "input", runtime, {
        value: interaction.value
      });
  }
}
async function activateActionItem(ctx, definition, item, state, signal, runtime) {
  if ("to" in item && item.to !== void 0) {
    return accepted({ kind: "to", screen: item.to }, item.id);
  }
  if ("close" in item)
    return accepted({ kind: "close" }, item.id);
  if (!("action" in item) || item.action === void 0)
    return rejected();
  const handler = definition.actions[item.action];
  const invocation = "busyLabel" in item && item.busyLabel && ctx.mode === "tui" && ctx.hasUI ? await invokeBusyAction(ctx, handler, state, item.id, item.busyLabel, signal, runtime) : await invokeAction(ctx, handler, state, signal, item.id, runtime);
  return withSelection(invocation, item.id);
}
async function invokeBusyAction(ctx, handler, state, itemId, label, signal, runtime) {
  const result = await runTask(ctx, {
    label,
    signal,
    isCurrent: runtime.isCurrent,
    onError: () => void 0,
    task: ({ signal: taskSignal }) => invokeAction(ctx, handler, state, taskSignal, itemId, runtime, {}, false)
  });
  switch (result.kind) {
    case "completed":
      return result.value;
    case "cancelled":
      return rejected();
    case "stale":
      return { ...rejected(), stale: true };
    case "error":
      throw result.error;
  }
}
async function invokeAction(ctx, handler, state, signal, itemId, runtime, input = {}, abortIsStale = true) {
  if (!isMenuCurrent(runtime))
    return { ...rejected(), stale: true };
  if (signal.aborted) {
    return abortIsStale ? { ...rejected(), stale: true } : rejected();
  }
  let result;
  try {
    result = await handler({ ctx, state, signal, itemId, ...input });
  } catch (error) {
    if (!isMenuCurrent(runtime))
      return { ...rejected(), stale: true };
    if (signal.aborted) {
      return abortIsStale ? { ...rejected(), stale: true } : rejected();
    }
    await reportMenuError(ctx, runtime, error);
    if (!isMenuCurrent(runtime))
      return { ...rejected(), stale: true };
    if (signal.aborted) {
      return abortIsStale ? { ...rejected(), stale: true } : rejected();
    }
    return rejected();
  }
  if (!isMenuCurrent(runtime))
    return { ...rejected(), stale: true };
  if (signal.aborted) {
    return abortIsStale ? { ...rejected(), stale: true } : rejected();
  }
  if (result?.kind === "rejected") {
    if (result.error !== void 0)
      await reportMenuError(ctx, runtime, result.error);
    if (!isMenuCurrent(runtime))
      return { ...rejected(), stale: true };
    if (signal.aborted) {
      return abortIsStale ? { ...rejected(), stale: true } : rejected();
    }
    return rejected();
  }
  return accepted(result ?? { kind: "stay" });
}
async function reportMenuError(ctx, runtime, error) {
  if (runtime.onError) {
    try {
      await runtime.onError(ctx, error);
      return;
    } catch {
    }
  }
  if (ctx.hasUI) {
    const message = error instanceof Error ? error.message : String(error);
    try {
      uiFor8(ctx).notify(`Menu action failed: ${safeMenuText(message)}`, "error");
    } catch {
    }
  }
}
function isMenuCurrent(runtime) {
  return runtime.isCurrent?.() ?? true;
}
function accepted(transition, selectionItemId) {
  return { accepted: true, stale: false, transition, selectionItemId };
}
function rejected() {
  return { accepted: false, stale: false, transition: { kind: "stay" } };
}
function withSelection(invocation, selectionItemId) {
  return { ...invocation, selectionItemId };
}
function uiFor8(ctx) {
  return ctx.ui;
}

// node_modules/@narumitw/pi-tui-kit/dist/runtime.js
async function runMenu(ctx, definition, options) {
  if (ctx.mode === "tui" && ctx.hasUI)
    return runTuiMenu(ctx, definition, options);
  if (ctx.mode === "rpc" && ctx.hasUI)
    return runDialogMenu(ctx, definition, options);
  await options.onUnsupportedMode?.(ctx, ctx.mode);
  return { kind: "unsupported", mode: ctx.mode };
}
async function runTuiMenu(ctx, definition, options) {
  const menuController = new AbortController();
  const menuSignal = options.signal ? AbortSignal.any([menuController.signal, options.signal]) : menuController.signal;
  const navigator = createMenuNavigator(definition.start);
  const searchQueries = /* @__PURE__ */ new Map();
  try {
    while (!navigator.closed) {
      const loaded = await loadState(ctx, options, menuSignal);
      if (loaded.kind !== "loaded")
        return loaded.result;
      const state = loaded.state;
      const screenId = navigator.current;
      const screen = resolveMenuScreen(definition, screenId, state);
      const renderingPreparation = prepareMenuScreenRendering(screen);
      if (renderingPreparation) {
        await renderingPreparation;
        if (!isMenuCurrent(options) || menuSignal.aborted)
          return { kind: "stale" };
      }
      let staleAction = false;
      const interact = async (interaction, interactionSignal) => {
        const invocation = await invokeMenuInteraction({
          ctx,
          definition,
          screen,
          state,
          menuSignal,
          interactionSignal,
          runtime: options,
          interaction
        });
        if (invocation.selectionItemId) {
          navigator.rememberSelection(navigator.current, invocation.selectionItemId);
        }
        if (invocation.stale)
          staleAction = true;
        return invocation;
      };
      const event = await showTuiScreen(ctx, screen, navigator.selectionFor(screenId, selectableItemIds(screen)), searchQueries.get(screenId), menuSignal, () => isMenuCurrent(options), {
        onSelectionChange: (itemId) => navigator.rememberSelection(screenId, itemId),
        onSearchQueryChange: (query) => searchQueries.set(screenId, query),
        onSettingChange: (change, signal) => interact({ kind: "setting", itemId: change.itemId, value: change.value }, signal),
        onMultiSelectChange: (change, signal) => interact({
          kind: "multiSelect",
          itemId: change.itemId,
          selected: change.selected
        }, signal),
        onInputSubmit: async (change, signal) => {
          const invocation = await interact({ kind: "input", value: change.value }, signal);
          return invocation.stale ? componentCloseInvocation() : invocation;
        }
      });
      if (staleAction || !isMenuCurrent(options) || menuSignal.aborted) {
        return { kind: "stale" };
      }
      if (!event) {
        navigator.apply({ kind: "close" });
        continue;
      }
      if (event.kind === "back" || event.kind === "close") {
        searchQueries.delete(screenId);
        navigator.apply({ kind: event.kind });
        continue;
      }
      if (event.kind === "transition") {
        if (event.transition.kind !== "stay")
          searchQueries.delete(screenId);
        navigator.apply(event.transition);
        continue;
      }
      const outcome = await interact({ kind: "activate", itemId: event.itemId });
      if (outcome.stale)
        return { kind: "stale" };
      if (outcome.transition.kind !== "stay")
        searchQueries.delete(screenId);
      navigator.apply(outcome.transition);
    }
    return closedMenuResult(navigator.closeReason);
  } catch (error) {
    if (!isMenuCurrent(options) || menuSignal.aborted)
      return { kind: "stale" };
    await reportMenuError(ctx, options, error);
    if (!isMenuCurrent(options) || menuSignal.aborted)
      return { kind: "stale" };
    return { kind: "error", error };
  } finally {
    menuController.abort(new DOMException("Menu closed", "AbortError"));
  }
}
function selectableItemIds(screen) {
  if (!("items" in screen))
    return [];
  if (screen.kind === "multiSelect") {
    return [...screen.items, ...screen.actions ?? []].map((item) => item.id);
  }
  const itemIds = screen.items.map((item) => item.id);
  if (screen.kind !== "choice")
    return itemIds;
  const preferred = [screen.initialItemId, screen.currentItemId].find((itemId) => itemId !== void 0 && itemIds.includes(itemId));
  return preferred ? [preferred, ...itemIds.filter((itemId) => itemId !== preferred)] : itemIds;
}
async function showTuiScreen(ctx, screen, selectedItemId, searchQuery, menuSignal, isCurrent8, callbacks) {
  let component;
  let removeAbortListener = () => {
  };
  try {
    return await uiFor9(ctx).custom((tui, theme, keybindings, done) => {
      const screenController = new AbortController();
      let finished = false;
      const finish = (event) => {
        if (finished)
          return;
        finished = true;
        screenController.abort(new DOMException("Menu screen completed", "AbortError"));
        done(event);
      };
      const abortScreen = () => {
        screenController.abort(new DOMException("Menu owner disposed", "AbortError"));
        finish({ kind: "close" });
      };
      menuSignal.addEventListener("abort", abortScreen, { once: true });
      removeAbortListener = () => menuSignal.removeEventListener("abort", abortScreen);
      if (menuSignal.aborted)
        abortScreen();
      component = createMenuScreenComponent({
        screen,
        selectedItemId,
        searchQuery,
        tui,
        theme,
        keybindings,
        signal: screenController.signal,
        isCurrent: isCurrent8,
        onEvent: finish,
        onSelectionChange: callbacks.onSelectionChange,
        onSearchQueryChange: callbacks.onSearchQueryChange,
        onSettingChange: (change) => callbacks.onSettingChange(change, screenController.signal),
        onMultiSelectChange: (change) => callbacks.onMultiSelectChange(change, screenController.signal),
        onInputSubmit: (change) => callbacks.onInputSubmit(change, screenController.signal),
        onTransition: (transition) => finish({ kind: "transition", transition }),
        onDispose: () => {
          removeAbortListener();
          screenController.abort(new DOMException("Menu screen disposed", "AbortError"));
        }
      });
      return component;
    });
  } finally {
    removeAbortListener();
    try {
      component?.dispose?.();
    } finally {
      await component?.waitForPending();
    }
  }
}
async function runDialogMenu(ctx, definition, options) {
  const controller = new AbortController();
  const menuSignal = options.signal ? AbortSignal.any([controller.signal, options.signal]) : controller.signal;
  const navigator = createMenuNavigator(definition.start);
  try {
    while (!navigator.closed) {
      const loaded = await loadState(ctx, options, menuSignal);
      if (loaded.kind !== "loaded")
        return loaded.result;
      const state = loaded.state;
      const screen = resolveMenuScreen(definition, navigator.current, state);
      const interact = (interaction) => invokeMenuInteraction({
        ctx,
        definition,
        screen,
        state,
        menuSignal,
        runtime: options,
        interaction
      });
      if (screen.kind === "input") {
        const value = await uiFor9(ctx).input(dialogTitle(screen), safeMenuText(screen.placeholder ?? ""), {
          signal: menuSignal
        });
        if (!isMenuCurrent(options) || menuSignal.aborted)
          return { kind: "stale" };
        if (value === void 0) {
          navigator.apply({ kind: screen.hint ?? "back" });
          continue;
        }
        const outcome2 = await interact({ kind: "input", value });
        if (outcome2.stale)
          return { kind: "stale" };
        navigator.apply(outcome2.transition);
        continue;
      }
      if (screen.kind === "review") {
        const pages = reviewDialogPages(screen);
        let pageIndex = 0;
        let finished = false;
        while (!finished) {
          const choices = uniqueReviewChoices([
            ...pageIndex > 0 ? [{ kind: "previous", label: "Previous" }] : [],
            ...pageIndex < pages.length - 1 ? [{ kind: "next", label: "Next" }] : [],
            ...screen.confirm ? [{ kind: "confirm", label: safeMenuText(screen.confirm.label) }] : [],
            { kind: "exit", label: dialogExitChoice(screen) }
          ]);
          const pageTitle = [
            dialogTitle(screen),
            pages[pageIndex]?.join("\n") ?? "",
            ...pages.length > 1 ? [`Page ${pageIndex + 1}/${pages.length}`] : []
          ].filter(Boolean).join("\n");
          const choice2 = await uiFor9(ctx).select(pageTitle, choices.map((row) => row.label), { signal: menuSignal });
          if (!isMenuCurrent(options) || menuSignal.aborted)
            return { kind: "stale" };
          const selected = choices.find((row) => row.label === choice2);
          if (!selected || selected.kind === "exit") {
            navigator.apply({ kind: screen.hint ?? "back" });
            finished = true;
          } else if (selected.kind === "previous")
            pageIndex = Math.max(0, pageIndex - 1);
          else if (selected.kind === "next") {
            pageIndex = Math.min(pages.length - 1, pageIndex + 1);
          } else if (screen.confirm) {
            const outcome2 = await interact({ kind: "activate", itemId: screen.confirm.id });
            if (outcome2.stale)
              return { kind: "stale" };
            if (outcome2.accepted) {
              navigator.apply(outcome2.transition);
              finished = true;
            }
          }
        }
        continue;
      }
      if (screen.kind === "browse") {
        let browsing = true;
        while (browsing) {
          const choices = uniqueBrowseChoices([
            ...screen.items.map((item) => ({
              kind: "item",
              item,
              label: browseDialogLabel(item)
            })),
            { kind: "exit", label: dialogExitChoice(screen) }
          ]);
          const choice2 = await uiFor9(ctx).select(dialogTitle(screen), choices.map((row) => row.label), { signal: menuSignal });
          if (!isMenuCurrent(options) || menuSignal.aborted)
            return { kind: "stale" };
          const selected = choices.find((row) => row.label === choice2);
          if (!selected || selected.kind === "exit") {
            navigator.apply({ kind: screen.hint ?? "back" });
            browsing = false;
            continue;
          }
          const pages = browseDialogPages(selected.item);
          let pageIndex = 0;
          let viewingDetail = true;
          while (viewingDetail) {
            const pageChoices = uniqueReviewChoices([
              ...pageIndex > 0 ? [{ kind: "previous", label: "Previous" }] : [],
              ...pageIndex < pages.length - 1 ? [{ kind: "next", label: "Next" }] : [],
              { kind: "exit", label: "Back" }
            ]);
            const pageTitle = [
              browseDialogLabel(selected.item),
              pages[pageIndex]?.join("\n") ?? "",
              ...pages.length > 1 ? [`Page ${pageIndex + 1}/${pages.length}`] : []
            ].filter(Boolean).join("\n");
            const pageChoice = await uiFor9(ctx).select(pageTitle, pageChoices.map((row) => row.label), { signal: menuSignal });
            if (!isMenuCurrent(options) || menuSignal.aborted)
              return { kind: "stale" };
            const selectedPage = pageChoices.find((row) => row.label === pageChoice);
            if (!selectedPage || selectedPage.kind === "exit")
              viewingDetail = false;
            else if (selectedPage.kind === "previous") {
              pageIndex = Math.max(0, pageIndex - 1);
            } else if (selectedPage.kind === "next") {
              pageIndex = Math.min(pages.length - 1, pageIndex + 1);
            }
          }
        }
        continue;
      }
      const rows = dialogRows(screen);
      const choice = await uiFor9(ctx).select(dialogTitle(screen), rows.map((row) => row.label), { signal: menuSignal });
      if (!isMenuCurrent(options) || menuSignal.aborted)
        return { kind: "stale" };
      if (!choice) {
        navigator.apply({ kind: "back" });
        continue;
      }
      const selectedRow = rows.find((row) => row.label === choice);
      if (!selectedRow)
        continue;
      if (selectedRow.kind === "exit") {
        const destination = "hint" in screen ? screen.hint ?? "back" : "back";
        navigator.apply({ kind: destination });
        continue;
      }
      const outcome = await interact(selectedRow.interaction);
      if (outcome.stale)
        return { kind: "stale" };
      navigator.apply(outcome.transition);
    }
    return closedMenuResult(navigator.closeReason);
  } catch (error) {
    if (!isMenuCurrent(options) || menuSignal.aborted)
      return { kind: "stale" };
    await reportMenuError(ctx, options, error);
    if (!isMenuCurrent(options) || menuSignal.aborted)
      return { kind: "stale" };
    return { kind: "error", error };
  } finally {
    controller.abort(new DOMException("Menu closed", "AbortError"));
  }
}
function dialogTitle(screen) {
  return [safeMenuText(screen.title), ...("lines" in screen && screen.lines || []).map(safeMenuText)].filter(Boolean).join("\n");
}
function dialogRows(screen) {
  let rows;
  if (screen.kind === "detail") {
    rows = [{ kind: "exit", label: dialogExitChoice(screen) }];
  } else if (screen.kind === "actions") {
    rows = screen.items.map((item) => ({
      kind: "interaction",
      interaction: { kind: "activate", itemId: item.id },
      label: actionMenuDialogLabel(item)
    }));
  } else if (screen.kind === "settings") {
    rows = [
      ...screen.items.map((item) => {
        const values = item.values ?? [item.currentValue];
        const currentIndex = Math.max(0, values.indexOf(item.currentValue));
        return {
          kind: "interaction",
          interaction: {
            kind: "setting",
            itemId: item.id,
            value: values[(currentIndex + 1) % values.length] ?? item.currentValue
          },
          label: `${safeMenuText(item.label)} (${safeMenuText(item.currentValue)})`
        };
      }),
      { kind: "exit", label: dialogExitChoice(screen) }
    ];
  } else if (screen.kind === "input" || screen.kind === "review") {
    rows = [];
  } else if (screen.kind === "browse") {
    rows = [{ kind: "exit", label: dialogExitChoice(screen) }];
  } else if (screen.kind === "choice") {
    rows = [
      ...screen.items.map((item) => {
        const label = safeMenuText(item.label);
        const current = item.id === screen.currentItemId ? " (current)" : "";
        const unavailable = item.disabled ? `[-] ${label} (unavailable${item.disabledReason ? `: ${safeMenuText(item.disabledReason)}` : ""})` : `${label}${current}`;
        return {
          kind: "interaction",
          interaction: { kind: "activate", itemId: item.id },
          label: unavailable
        };
      }),
      { kind: "exit", label: dialogExitChoice(screen) }
    ];
  } else {
    rows = [
      ...screen.items.map((item) => ({
        kind: "interaction",
        interaction: {
          kind: "multiSelect",
          itemId: item.id,
          selected: !item.selected
        },
        label: item.disabled ? `[-] ${safeMenuText(item.label)} (unavailable${item.disabledReason ? `: ${safeMenuText(item.disabledReason)}` : ""})` : `${item.selected ? "[x]" : "[ ]"} ${safeMenuText(item.label)}`
      })),
      ...(screen.actions ?? []).map((item) => ({
        kind: "interaction",
        interaction: { kind: "activate", itemId: item.id },
        label: actionMenuDialogLabel(item)
      })),
      { kind: "exit", label: dialogExitChoice(screen) }
    ];
  }
  return uniqueDialogRows(rows);
}
function uniqueReviewChoices(rows) {
  const used = /* @__PURE__ */ new Set();
  return rows.map((row) => ({ ...row, label: uniqueDialogLabel(row.label, used) }));
}
function uniqueBrowseChoices(rows) {
  const used = /* @__PURE__ */ new Set();
  return rows.map((row) => ({ ...row, label: uniqueDialogLabel(row.label, used) }));
}
function uniqueDialogRows(rows) {
  const used = /* @__PURE__ */ new Set();
  return rows.map((row) => ({ ...row, label: uniqueDialogLabel(row.label, used) }));
}
function uniqueDialogLabel(base, used) {
  let label = base;
  let suffix = 2;
  while (used.has(label)) {
    label = `${base} [${suffix}]`;
    suffix += 1;
  }
  used.add(label);
  return label;
}
function dialogExitChoice(screen) {
  if (screen.kind === "multiSelect" && screen.doneLabel)
    return safeMenuText(screen.doneLabel);
  return "hint" in screen && screen.hint === "close" ? "Done" : "Back";
}
async function loadState(ctx, options, signal) {
  if (signal.aborted || !isMenuCurrent(options)) {
    return { kind: "result", result: { kind: "stale" } };
  }
  try {
    const state = await options.getState({ ctx, signal });
    if (signal.aborted || !isMenuCurrent(options)) {
      return { kind: "result", result: { kind: "stale" } };
    }
    return { kind: "loaded", state };
  } catch (error) {
    if (signal.aborted || !isMenuCurrent(options)) {
      return { kind: "result", result: { kind: "stale" } };
    }
    await reportMenuError(ctx, options, error);
    if (signal.aborted || !isMenuCurrent(options)) {
      return { kind: "result", result: { kind: "stale" } };
    }
    return { kind: "result", result: { kind: "error", error } };
  }
}
function componentCloseInvocation() {
  return { accepted: true, stale: false, transition: { kind: "close" } };
}
function closedMenuResult(reason) {
  if (reason === void 0)
    throw new Error("Menu navigator closed without a termination reason");
  return { kind: "closed", reason };
}
function uiFor9(ctx) {
  return ctx.ui;
}

// node_modules/@narumitw/pi-tui-kit/dist/secret-input.js
import { CURSOR_MARKER, decodeKittyPrintable, Key as Key4, matchesKey as matchesKey4, renderFakeCursor, Text as Text2, truncateToWidth as truncateToWidth4 } from "@earendil-works/pi-tui";
async function runSecretInput(ctx, options) {
  const result = await runCustomInteraction(ctx, {
    signal: options.signal,
    isCurrent: options.isCurrent,
    onError: options.onError,
    onUnsupportedMode: options.onUnsupportedMode,
    create: ({ tui, theme, keybindings, complete }) => {
      const title = sanitizeTerminalText(options.title);
      const ui = ctx.ui;
      const heading = new Text2("", 0, 0);
      const hint = new Text2("", 0, 0);
      const input = new MaskedInput(keybindings);
      let inputRow = -1;
      let renderedWidth = 0;
      const hintKeys = componentKeybindings(tui, keybindings);
      const interactionHint = formatInteractionHints(hintKeys, [
        {
          keys: hintKeys.getKeys("tui.input.submit").filter((key) => !hasControlCharacter(key)),
          label: "continue"
        },
        {
          keys: [...hintKeys.getKeys("tui.select.cancel").filter((key) => !hasControlCharacter(key)), "ctrl+c"],
          label: "cancel"
        }
      ]);
      const applyTheme = () => {
        heading.setText(theme.fg("accent", theme.bold(title)));
        hint.setText(theme.fg("dim", `${interactionHint} \u2022 Input is hidden`));
      };
      const cancel = (reason) => complete({ kind: "closed", reason });
      const retainOwnership = () => {
        if (options.isCurrent?.() ?? true)
          return true;
        complete({ kind: "closed", reason: "back" });
        return false;
      };
      const dispatchInput = (initialData) => {
        if (!retainOwnership())
          return;
        let data = initialData;
        while (data) {
          if (input.isPasting || data.includes("\x1B[200~")) {
            data = input.handleInput(data);
            continue;
          }
          if (matchesKey4(data, Key4.ctrl("c")))
            cancel("close");
          else if (keybindings.matches(data, "tui.select.cancel"))
            cancel("back");
          else if (keybindings.matches(data, "tui.input.submit")) {
            const value = input.getValue();
            if (options.required !== false && value.length === 0) {
              ui.notify(`${title} is required. Enter a value, or cancel.`, "warning");
            } else if (hasControlCharacter(value)) {
              ui.notify(`${title} contains control characters. Remove them or re-enter the value, then continue.`, "warning");
            } else
              complete({ kind: "submitted", value });
          } else
            input.handleInput(data);
          data = void 0;
        }
        tui.requestRender();
      };
      applyTheme();
      return {
        get focused() {
          return input.focused;
        },
        set focused(value) {
          input.focused = value;
        },
        render(width) {
          const safeWidth = Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;
          if (safeWidth === 0) {
            inputRow = -1;
            renderedWidth = 0;
            return [];
          }
          const headingLines = heading.render(safeWidth);
          inputRow = headingLines.length;
          renderedWidth = safeWidth;
          return [...headingLines, ...input.render(safeWidth), ...hint.render(safeWidth)].map((line) => truncateToWidth4(line, safeWidth));
        },
        invalidate() {
          inputRow = -1;
          renderedWidth = 0;
          applyTheme();
          heading.invalidate();
          input.invalidate();
          hint.invalidate();
        },
        handleInput: dispatchInput,
        handleMouse(event) {
          if (!retainOwnership())
            return { handled: true };
          if (event.width !== renderedWidth || event.y !== inputRow)
            return void 0;
          return input.handleMouse({ ...event, y: 0, width: renderedWidth, height: 1 });
        },
        dispose() {
          inputRow = -1;
          renderedWidth = 0;
          input.clear();
        }
      };
    }
  });
  return result.kind === "completed" ? result.value : result;
}
var MaskedInput = class {
  keybindings;
  focused = false;
  value = [];
  cursor = 0;
  paste = "";
  pasting = false;
  renderedStart = 0;
  renderedCount = 0;
  lastAction = null;
  killRing = [];
  undoStack = [];
  constructor(keybindings) {
    this.keybindings = keybindings;
  }
  get isPasting() {
    return this.pasting;
  }
  getValue() {
    return this.value.join("");
  }
  handleInput(data) {
    if (data.includes("\x1B[200~")) {
      this.pasting = true;
      this.paste = "";
      data = data.replace("\x1B[200~", "");
    }
    if (this.pasting) {
      this.paste += data;
      const end = this.paste.indexOf("\x1B[201~");
      if (end < 0)
        return;
      const pasted = this.paste.slice(0, end).replace(/[\r\n]/gu, "").replace(/\t/gu, "    ");
      this.lastAction = null;
      this.pushUndo();
      this.insert(pasted);
      const remaining = this.paste.slice(end + 6);
      this.paste = "";
      this.pasting = false;
      return remaining || void 0;
    }
    if (this.keybindings.matches(data, "tui.editor.undo")) {
      this.undo();
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.deleteCharBackward")) {
      this.lastAction = null;
      if (this.cursor > 0) {
        this.pushUndo();
        this.value.splice(--this.cursor, 1);
      }
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.deleteCharForward")) {
      this.lastAction = null;
      if (this.cursor < this.value.length) {
        this.pushUndo();
        this.value.splice(this.cursor, 1);
      }
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.deleteWordBackward")) {
      this.deleteWordBackward();
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.deleteWordForward")) {
      this.deleteWordForward();
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.deleteToLineStart")) {
      this.deleteToLineStart();
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.deleteToLineEnd")) {
      this.deleteToLineEnd();
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.yank")) {
      this.yank();
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.yankPop")) {
      this.yankPop();
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.cursorLeft")) {
      this.lastAction = null;
      this.cursor = Math.max(0, this.cursor - 1);
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.cursorRight")) {
      this.lastAction = null;
      this.cursor = Math.min(this.value.length, this.cursor + 1);
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.cursorLineStart")) {
      this.lastAction = null;
      this.cursor = 0;
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.cursorLineEnd")) {
      this.lastAction = null;
      this.cursor = this.value.length;
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.cursorWordLeft")) {
      this.moveWordBackward();
      return;
    }
    if (this.keybindings.matches(data, "tui.editor.cursorWordRight")) {
      this.moveWordForward();
      return;
    }
    const printable = decodeKittyPrintable(data) ?? data;
    if (!hasControlCharacter(printable) && printable.length > 0) {
      if (isSecretWhitespace(printable) || this.lastAction !== "type-word")
        this.pushUndo();
      this.lastAction = "type-word";
      this.insert(printable);
    }
  }
  handleMouse(event) {
    if (event.type !== "press" || event.button !== "left")
      return void 0;
    const target = this.renderedStart + Math.max(0, Math.min(this.renderedCount, event.x - 2));
    this.cursor = Math.max(0, Math.min(this.value.length, target));
    this.lastAction = null;
    return { handled: true, focus: true };
  }
  render(width) {
    const prompt = "> ";
    const available = width - prompt.length;
    if (available <= 0) {
      this.renderedStart = 0;
      this.renderedCount = 0;
      return [truncateToWidth4(prompt, Math.max(0, width))];
    }
    const contentWidth = Math.max(0, available - 1);
    let start = 0;
    if (this.value.length > contentWidth) {
      start = Math.max(0, Math.min(this.cursor - Math.floor(contentWidth / 2), this.value.length - contentWidth));
    }
    const end = Math.min(this.value.length, start + contentWidth);
    const visibleCursor = Math.max(0, Math.min(this.cursor - start, end - start));
    const masks = Array.from({ length: end - start }, () => "\u2022");
    const before = masks.slice(0, visibleCursor).join("");
    const atCursor = visibleCursor < masks.length ? "\u2022" : " ";
    const after = masks.slice(visibleCursor + (visibleCursor < masks.length ? 1 : 0)).join("");
    const marker = this.focused ? CURSOR_MARKER : "";
    this.renderedStart = start;
    this.renderedCount = end - start;
    return [truncateToWidth4(`${prompt}${before}${marker}${renderFakeCursor(atCursor)}${after}`, width, "")];
  }
  invalidate() {
  }
  clear() {
    this.value.fill("");
    for (const snapshot of this.undoStack)
      snapshot.value.fill("");
    this.killRing.fill("");
    this.value = [];
    this.killRing = [];
    this.undoStack = [];
    this.paste = "";
    this.cursor = 0;
    this.pasting = false;
    this.renderedStart = 0;
    this.renderedCount = 0;
    this.lastAction = null;
  }
  insert(value) {
    const graphemes = secretGraphemes(value);
    this.value.splice(this.cursor, 0, ...graphemes);
    this.cursor += graphemes.length;
  }
  deleteWordBackward() {
    if (this.cursor === 0)
      return;
    const wasKill = this.lastAction === "kill";
    this.pushUndo();
    const end = this.cursor;
    this.moveWordBackward();
    const deleted = this.value.slice(this.cursor, end).join("");
    this.value.splice(this.cursor, end - this.cursor);
    this.pushKill(deleted, true, wasKill);
    this.lastAction = "kill";
  }
  deleteWordForward() {
    if (this.cursor >= this.value.length)
      return;
    const wasKill = this.lastAction === "kill";
    this.pushUndo();
    const start = this.cursor;
    this.moveWordForward();
    const deleted = this.value.slice(start, this.cursor).join("");
    this.value.splice(start, this.cursor - start);
    this.cursor = start;
    this.pushKill(deleted, false, wasKill);
    this.lastAction = "kill";
  }
  deleteToLineStart() {
    if (this.cursor === 0)
      return;
    const wasKill = this.lastAction === "kill";
    this.pushUndo();
    const deleted = this.value.slice(0, this.cursor).join("");
    this.value.splice(0, this.cursor);
    this.cursor = 0;
    this.pushKill(deleted, true, wasKill);
    this.lastAction = "kill";
  }
  deleteToLineEnd() {
    if (this.cursor >= this.value.length)
      return;
    const wasKill = this.lastAction === "kill";
    this.pushUndo();
    const deleted = this.value.slice(this.cursor).join("");
    this.value.splice(this.cursor);
    this.pushKill(deleted, false, wasKill);
    this.lastAction = "kill";
  }
  yank() {
    const text = this.killRing.at(-1);
    if (!text)
      return;
    this.pushUndo();
    this.insert(text);
    this.lastAction = "yank";
  }
  yankPop() {
    if (this.lastAction !== "yank" || this.killRing.length <= 1)
      return;
    this.pushUndo();
    const previousLength = secretGraphemes(this.killRing.at(-1) ?? "").length;
    const start = Math.max(0, this.cursor - previousLength);
    this.value.splice(start, this.cursor - start);
    this.cursor = start;
    const latest = this.killRing.pop();
    if (latest !== void 0)
      this.killRing.unshift(latest);
    this.insert(this.killRing.at(-1) ?? "");
    this.lastAction = "yank";
  }
  pushKill(text, prepend, accumulate) {
    if (!text)
      return;
    const latest = this.killRing.length - 1;
    if (accumulate && latest >= 0) {
      const previous = this.killRing[latest] ?? "";
      this.killRing[latest] = prepend ? text + previous : previous + text;
    } else
      this.killRing.push(text);
  }
  moveWordBackward() {
    if (this.cursor === 0)
      return;
    this.lastAction = null;
    const target = findSecretWordBackward(this.getValue(), this.cursorCodeUnits());
    this.cursor = graphemeIndexAtCodeUnit(this.value, target);
  }
  moveWordForward() {
    if (this.cursor >= this.value.length)
      return;
    this.lastAction = null;
    const target = findSecretWordForward(this.getValue(), this.cursorCodeUnits());
    this.cursor = graphemeIndexAtCodeUnit(this.value, target);
  }
  pushUndo() {
    this.undoStack.push({ value: [...this.value], cursor: this.cursor });
  }
  undo() {
    const snapshot = this.undoStack.pop();
    if (!snapshot)
      return;
    this.value.fill("");
    this.value = snapshot.value;
    this.cursor = snapshot.cursor;
    this.lastAction = null;
  }
  cursorCodeUnits() {
    return this.value.slice(0, this.cursor).join("").length;
  }
};
var secretGraphemeSegmenter = new Intl.Segmenter(void 0, { granularity: "grapheme" });
var secretGraphemes = (value) => [...secretGraphemeSegmenter.segment(value)].map(({ segment }) => segment);
var secretWordSegmenter = new Intl.Segmenter(void 0, { granularity: "word" });
var SECRET_WORD_PUNCTUATION = new Set("(){}[]<>.,;:'\"!?+-=*/\\|&%^$#@~`");
function findSecretWordBackward(value, cursor) {
  if (cursor <= 0)
    return 0;
  const segments = [...secretWordSegmenter.segment(value.slice(0, cursor))];
  let target = cursor;
  while (segments.length > 0 && isSecretWhitespace(segments.at(-1)?.segment ?? "")) {
    target -= segments.pop()?.segment.length ?? 0;
  }
  const last = segments.at(-1);
  if (!last)
    return target;
  if (last.isWordLike) {
    const punctuationEnd = lastSecretPunctuationEnd(last.segment);
    target -= punctuationEnd === void 0 ? last.segment.length : last.segment.length - punctuationEnd;
    return target;
  }
  while (segments.length > 0) {
    const segment = segments.at(-1);
    if (!segment || segment.isWordLike || isSecretWhitespace(segment.segment))
      break;
    target -= segments.pop()?.segment.length ?? 0;
  }
  return target;
}
function findSecretWordForward(value, cursor) {
  if (cursor >= value.length)
    return value.length;
  const segments = [...secretWordSegmenter.segment(value.slice(cursor))];
  let target = cursor;
  while (segments.length > 0 && isSecretWhitespace(segments[0]?.segment ?? "")) {
    target += segments.shift()?.segment.length ?? 0;
  }
  const first = segments[0];
  if (!first)
    return target;
  if (first.isWordLike) {
    target += firstSecretPunctuationIndex(first.segment) ?? first.segment.length;
    return target;
  }
  while (segments.length > 0) {
    const segment = segments[0];
    if (!segment || segment.isWordLike || isSecretWhitespace(segment.segment))
      break;
    target += segments.shift()?.segment.length ?? 0;
  }
  return target;
}
function graphemeIndexAtCodeUnit(graphemes, target) {
  let codeUnits = 0;
  for (const [index, grapheme] of graphemes.entries()) {
    if (codeUnits >= target)
      return index;
    codeUnits += grapheme.length;
  }
  return graphemes.length;
}
function isSecretWhitespace(value) {
  return /\s/u.test(value);
}
function firstSecretPunctuationIndex(value) {
  for (let index = 0; index < value.length; index += 1) {
    if (SECRET_WORD_PUNCTUATION.has(value[index] ?? ""))
      return index;
  }
  return void 0;
}
function lastSecretPunctuationEnd(value) {
  for (let index = value.length - 1; index >= 0; index -= 1) {
    if (SECRET_WORD_PUNCTUATION.has(value[index] ?? ""))
      return index + 1;
  }
  return void 0;
}
function hasControlCharacter(value) {
  return [...value].some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return code < 32 || code >= 127 && code <= 159;
  });
}

// node_modules/@narumitw/pi-tui-kit/dist/index.js
var PI_EXTENSION_MENU_API_VERSION = 23;
export {
  EditorStatusWidget,
  HorizontalRule,
  PI_EXTENSION_MENU_API_VERSION,
  canonicalizeConfiguredKey,
  createEditorStatusCollection,
  createEditorStatusPublisher,
  createEditorStatusView,
  createFullscreenHandoff,
  createMenuNavigator,
  createMermaidMarkdownTransformer,
  defineMenu,
  formatInteractionHints,
  hardWrapTerminalDocument,
  prepareMermaidMarkdownRenderer,
  renderBoundedFrame,
  renderBoundedFrameLayout,
  resolveMenuScreen,
  runConfirmation,
  runCustomInteraction,
  runDocumentReview,
  runLiveChoice,
  runMenu,
  runModelSelector,
  runMultiSelect,
  runQuestionnaire,
  runSecretInput,
  runTask,
  runThinkingSelector,
  sanitizeTerminalDocument,
  sanitizeTerminalText
};
