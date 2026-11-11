// Generated from src; rebuild with npm run build.
// @ts-nocheck
import {
  HorizontalRule,
  canonicalKeyId,
  componentKeyAvailable,
  componentKeybindings,
  keysOverlap,
  sanitizeTerminalText,
  usesDisambiguatedKeyProtocol
} from "./chunk-WIBL2C3K.ts";

// node_modules/@narumitw/pi-tui-kit/dist/components/index.js
import { stripVTControlCharacters as stripVTControlCharacters5 } from "node:util";
import { fuzzyFilter as fuzzyFilter3, Input as Input5, Key as Key6, matchesKey as matchesKey6, truncateToWidth as truncateToWidth8, visibleWidth as visibleWidth8, wrapTextWithAnsi as wrapTextWithAnsi7 } from "@earendil-works/pi-tui";

// node_modules/@narumitw/pi-tui-kit/dist/components/browse.js
import { stripVTControlCharacters as stripVTControlCharacters4 } from "node:util";
import { fuzzyFilter, Input as Input2, Key as Key3, matchesKey as matchesKey3, truncateToWidth as truncateToWidth5, visibleWidth as visibleWidth5, wrapTextWithAnsi as wrapTextWithAnsi3 } from "@earendil-works/pi-tui";

// node_modules/@narumitw/pi-tui-kit/dist/text.js
function safeMenuText(value) {
  return replaceTerminalControls(value).replace(/\s+/gu, " ").trim();
}
function replaceTerminalControls(value) {
  return Array.from(String(value), (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint >= 127 && codePoint <= 159 ? " " : character;
  }).join("");
}

// node_modules/@narumitw/pi-tui-kit/dist/interaction-hints.js
function formatInteractionHints(keybindings, hints, options = {}) {
  const separator = safeMenuText(options.separator ?? "\u2022") || "\u2022";
  return hints.map((hint) => formatHint(keybindings, hint)).filter(Boolean).join(` ${separator} `);
}
function formatHint(keybindings, hint) {
  const excluded = new Set((hint.excludeKeys ?? []).map(normalizeKey).filter(Boolean));
  const keys = [...(hint.bindings ?? []).flatMap((binding) => keybindings.getKeys(binding)), ...hint.keys ?? []].map(normalizeKey).filter((key) => key && !excluded.has(key));
  const uniqueKeys = [...new Set(keys)];
  const label = safeMenuText(hint.label);
  return uniqueKeys.length > 0 && label ? `${uniqueKeys.join("/")} ${label}` : "";
}
function normalizeKey(value) {
  const key = safeMenuText(value).toLowerCase();
  if (key === "up")
    return "\u2191";
  if (key === "down")
    return "\u2193";
  if (key === "return")
    return "enter";
  if (key === "escape")
    return "esc";
  return key;
}

// node_modules/@narumitw/pi-tui-kit/dist/components/document-copy.js
import { isKeyRelease, matchesKey } from "@earendil-works/pi-tui";

// node_modules/@narumitw/pi-tui-kit/dist/components/rendering.js
import { stripVTControlCharacters as stripVTControlCharacters2 } from "node:util";
import { SelectList, stripTerminalSequences, truncateToWidth as truncateToWidth2, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";

// node_modules/@narumitw/pi-tui-kit/dist/bounded-frame.js
import { stripVTControlCharacters } from "node:util";
import { truncateToWidth } from "@earendil-works/pi-tui";
function renderBoundedFrame(options) {
  return renderBoundedFrameLayout(options).lines;
}
function renderBoundedFrameLayout(options) {
  const width = dimension(options.width);
  const maxRows = dimension(options.maxRows);
  if (maxRows === 0)
    return { lines: [], contentRows: [] };
  const { rule, title, content, hints = [], context = [], compactHint = "" } = options;
  const full = [
    { line: rule },
    ...title.map((line) => ({ line })),
    ...context.map((line) => ({ line })),
    ...content.length ? [{ line: "" }, ...content.map((line, contentIndex) => ({ line, contentIndex }))] : [],
    ...hints.map((line) => ({ line })),
    { line: rule }
  ];
  if (full.length <= maxRows)
    return finalizeLayout(full, width);
  const framed = maxRows >= 5;
  const available = maxRows - (framed ? 2 : 0);
  const rows = content.map((line, index) => ({ line, index })).filter(({ line }) => stripVTControlCharacters(line).trim().length > 0);
  const priorities = [...new Set(options.priorityRows ?? [])].map((index) => rows.findIndex((row) => row.index === index)).filter((index) => index >= 0);
  const focused = rows.findIndex((row) => row.index === options.focusedRow);
  const body = rows.length ? compactContent(title, context, rows, options.compactHints ?? hints, compactHint, available, priorities, focused) : compactStatic(title, context, compactHint, available);
  return finalizeLayout(framed ? [{ line: rule }, ...body, { line: rule }] : body, width);
}
function finalizeLayout(rows, width) {
  return {
    lines: rows.map(({ line }) => truncateToWidth(line, width, "")),
    contentRows: rows.flatMap(({ contentIndex }, frameIndex) => contentIndex === void 0 ? [] : [{ contentIndex, frameIndex }])
  };
}
function dimension(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
function compactContent(title, context, content, hints, compactHint, available, priorities, focused) {
  const hintBudget = compactHint && available > 1 ? 1 : 0;
  const minimumContent = Math.min(available - hintBudget, Math.max(1, priorities.length));
  let remaining = Math.max(0, available - hintBudget - minimumContent);
  const titleBudget = title.length > 0 && remaining > 0 ? 1 : 0;
  remaining -= titleBudget;
  const extraHints = Math.max(0, hints.length - hintBudget);
  const fullHints = hintBudget > 0 && hints.length > 0 && extraHints <= remaining;
  if (fullHints)
    remaining -= extraHints;
  const contentBudget = Math.min(content.length, minimumContent + remaining);
  remaining -= contentBudget - minimumContent;
  const contextBudget = Math.min(context.length, remaining);
  const indexes = new Set(priorities.slice(0, contentBudget));
  const fillOrder = content.map((_, index) => index).sort((left, right) => focused < 0 ? left - right : Math.abs(left - focused) - Math.abs(right - focused) || left - right);
  for (const index of fillOrder) {
    if (indexes.size >= contentBudget)
      break;
    indexes.add(index);
  }
  return [
    ...title.slice(0, titleBudget).map((line) => ({ line })),
    ...context.slice(0, contextBudget).map((line) => ({ line })),
    ...[...indexes].sort((left, right) => left - right).map((index) => ({
      line: content[index]?.line ?? "",
      contentIndex: content[index]?.index
    })),
    ...hintBudget ? (fullHints ? hints : [compactHint]).map((line) => ({ line })) : []
  ];
}
function compactStatic(title, context, compactHint, available) {
  if (available === 1)
    return [{ line: context[0] || compactHint || title[0] || "" }];
  const hintBudget = compactHint ? 1 : 0;
  const minimumContext = context.length > 0 ? 1 : 0;
  let remaining = Math.max(0, available - hintBudget - minimumContext);
  const titleBudget = title.length > 0 && remaining > 0 ? 1 : 0;
  remaining -= titleBudget;
  return [
    ...title.slice(0, titleBudget).map((line) => ({ line })),
    ...context.slice(0, Math.min(context.length, minimumContext + remaining)).map((line) => ({ line })),
    ...hintBudget ? [{ line: compactHint }] : []
  ];
}

// node_modules/@narumitw/pi-tui-kit/dist/components/rendering.js
function createMenuSelectList(items, viewportSize, theme, currentItemId) {
  const displayItems = items.map((item) => ({ ...item, label: item.label || "(unnamed)" }));
  const widestPrimary = Math.max(1, ...displayItems.map((item) => visibleWidth(item.label))) + 2;
  return new SelectList(displayItems, Math.min(items.length, viewportSize), {
    selectedPrefix: (text) => theme.fg("accent", text),
    selectedText: (text) => theme.fg("accent", text),
    description: (text) => theme.fg("muted", text),
    scrollInfo: (text) => theme.fg("dim", text),
    noMatch: (text) => theme.fg("warning", text)
  }, {
    minPrimaryColumnWidth: Math.min(32, widestPrimary),
    maxPrimaryColumnWidth: widestPrimary,
    truncatePrimary: ({ text, maxWidth, item }) => {
      const cells = Math.max(0, maxWidth);
      const marker = item.value === currentItemId ? " \u2713 current" : "";
      if (marker && cells > visibleWidth(marker) + 1) {
        return `${truncateToWidth2(text.slice(0, -marker.length), cells - visibleWidth(marker), "\u2026")}${marker}`;
      }
      return truncateToWidth2(text, cells, cells > 1 ? "\u2026" : "");
    }
  });
}
function selectedLabelFallback(label, row) {
  return label && !stripTerminalSequences(row ?? "").includes(label) ? [label] : [];
}
function actionMenuItemPresentation(item) {
  const label = safeMenuText(item.label);
  const description = item.description ? safeMenuText(item.description) : void 0;
  return { label: item.disabled ? `[-] ${label}` : label, description };
}
function actionMenuUnavailableDescription(item) {
  if (!item.disabled)
    return void 0;
  const reason = safeMenuText(item.disabledReason ?? "");
  return reason ? `Unavailable: ${reason}` : void 0;
}
function actionMenuDialogLabel(item) {
  const label = safeMenuText(item.label);
  const reason = safeMenuText(item.disabledReason ?? "");
  if (!item.disabled || !reason)
    return label;
  return `[-] ${label} (unavailable: ${reason})`;
}
function renderFrame(title, lines, content, destination, width, options, layout = {}) {
  return renderFrameLayout(title, lines, content, destination, width, options, layout).lines;
}
function renderFrameLayout(title, lines, content, destination, width, options, layout = {}) {
  const safeWidth = Math.max(1, width);
  const rule = renderHorizontalRule(safeWidth, options.theme);
  const confirmAction = layout.confirmAction ?? "select";
  const navigation = layout.navigation ?? true;
  const titleRows = wrapTextWithAnsi(options.theme.fg("accent", options.theme.bold(safeMenuText(title))), safeWidth);
  const contextRows = lines.flatMap((line) => wrapTextWithAnsi(options.theme.fg("muted", safeMenuText(line)), safeWidth));
  const hintText = layout.hint ?? options.interactionHint ?? menuHint(options.keybindings, destination, confirmAction, navigation);
  const hintRows = wrapTextWithAnsi(options.theme.fg("dim", hintText), safeWidth);
  const compactFullHintRows = wrapTextWithAnsi(options.theme.fg("dim", layout.compactOverflowText ? `${hintText} \u2022 ${safeMenuText(layout.compactOverflowText).trim()}` : hintText), safeWidth);
  const compactHintRow = options.theme.fg("dim", compactMenuHint(hintText, options.keybindings, destination, confirmAction, navigation, layout.compactOverflowText, safeWidth));
  const compactContent2 = content.map((line, index) => ({ line, index })).filter(({ line }) => stripVTControlCharacters2(line).trim().length > 0);
  const compactRows = compactContent2.map(({ line }) => line);
  const priorities = priorityRowIndexes(compactRows, layout.pinnedContentRows ?? 0, layout.priorityTailRows ?? 0);
  return renderBoundedFrameLayout({
    width: safeWidth,
    maxRows: componentRows(options.tui.terminal.rows),
    rule,
    title: titleRows,
    context: contextRows,
    content,
    hints: hintRows,
    compactHints: compactFullHintRows,
    compactHint: compactHintRow,
    priorityRows: [...priorities].map((index) => compactContent2[index]?.index ?? -1),
    focusedRow: compactContent2[selectedRowIndex(compactRows)]?.index
  });
}
function priorityRowIndexes(rows, pinnedRows, priorityTailRows, budget = Number.POSITIVE_INFINITY) {
  const indexes = /* @__PURE__ */ new Set();
  const pinned = Math.max(0, Math.min(rows.length, Math.floor(pinnedRows)));
  const selectedIndex = selectedRowIndex(rows);
  if (selectedIndex >= 0 && indexes.size < budget)
    indexes.add(selectedIndex);
  if (selectedIndex >= 0) {
    for (let index = 0; index < pinned && indexes.size < budget; index += 1)
      indexes.add(index);
  }
  const tailStart = Math.max(pinned, rows.length - Math.max(0, Math.floor(priorityTailRows)));
  for (let index = tailStart; index < rows.length && indexes.size < budget; index += 1) {
    indexes.add(index);
  }
  for (let index = 0; index < pinned && indexes.size < budget; index += 1)
    indexes.add(index);
  return indexes;
}
function selectedRowIndex(rows) {
  return rows.findIndex((line) => /^[→›](?:\s|$)/u.test(stripVTControlCharacters2(line)));
}
function componentRows(rows) {
  const terminalRows = Number.isFinite(rows) ? Math.floor(rows) : 24;
  return Math.max(1, terminalRows - 3);
}
function renderHorizontalRule(width, theme) {
  return new HorizontalRule({
    ruleStyle: (text) => theme.fg("border", text)
  }).render(Math.max(1, width))[0] ?? "";
}
function menuHint(keybindings, destination, confirmAction, navigation = true) {
  return formatInteractionHints(keybindings, [
    ...navigation ? [{ bindings: ["tui.select.up", "tui.select.down"], label: "navigate" }] : [],
    ...confirmAction ? [{ bindings: ["tui.select.confirm"], label: confirmAction }] : [],
    {
      bindings: ["tui.select.cancel"],
      excludeKeys: ["ctrl+c"],
      label: destination
    },
    ...destination === "back" ? [{ keys: ["ctrl+c"], label: "close" }] : []
  ]);
}
function compactMenuHint(hintText, keybindings, destination, confirmAction, navigation, compactOverflowText, width) {
  const cancel = formatInteractionHints(keybindings, [
    {
      bindings: ["tui.select.cancel"],
      excludeKeys: ["ctrl+c"],
      label: destination
    }
  ]);
  const hardCancel = destination === "back" || !cancel ? formatInteractionHints(keybindings, [{ keys: ["ctrl+c"], label: "close" }]) : "";
  const confirm = confirmAction ? formatInteractionHints(keybindings, [{ bindings: ["tui.select.confirm"], label: confirmAction }]) : "";
  const navigate = navigation ? formatInteractionHints(keybindings, [{ bindings: ["tui.select.up", "tui.select.down"], label: "navigate" }]) : "";
  const supplied = hintSegments(hintText);
  const groups = {
    cancel: hintSegmentKeys(cancel),
    confirm: hintSegmentKeys(confirm),
    hardCancel: hintSegmentKeys(hardCancel),
    navigate: hintSegmentKeys(navigate)
  };
  const classified = supplied.map((segment2) => ({ segment: segment2, keys: hintSegmentKeys(segment2) }));
  const matching = (keys) => classified.filter((candidate) => intersects(candidate.keys, keys)).map(({ segment: segment2 }) => segment2);
  const cancelSegments = matching(groups.cancel);
  const confirmSegments = matching(groups.confirm);
  const hardCancelSegments = matching(groups.hardCancel);
  const navigationSegments = matching(groups.navigate);
  const claimed = /* @__PURE__ */ new Set([...cancelSegments, ...confirmSegments, ...hardCancelSegments, ...navigationSegments]);
  const remaining = classified.filter(({ segment: segment2 }) => !claimed.has(segment2));
  const keyedCustom = remaining.filter(({ keys }) => keys.size > 0).map(({ segment: segment2 }) => segment2);
  const reminders = remaining.filter(({ keys }) => keys.size === 0).map(({ segment: segment2 }) => segment2);
  return fitCompactHintSegments([
    ...cancelSegments.length > 0 ? cancelSegments : [cancel],
    ...compactOverflowText ? [safeMenuText(compactOverflowText).trim()] : [],
    ...confirmSegments,
    ...hardCancelSegments,
    ...navigationSegments,
    ...keyedCustom,
    ...reminders
  ], width);
}
function hintSegments(hintText) {
  return safeMenuText(hintText).split(/\s+[•·]\s+/u).map((segment2) => segment2.trim()).filter(Boolean);
}
function hintSegmentKeys(segment2) {
  const token = safeMenuText(segment2).trim().split(/\s+/u, 1)[0]?.toLowerCase() ?? "";
  const parts = token.split("/");
  return parts.length > 0 && parts.every(isHintKey) ? new Set(parts) : /* @__PURE__ */ new Set();
}
function isHintKey(value) {
  return value.length === 1 || value.includes("+") || ["esc", "escape", "enter", "return", "space", "\u2191", "\u2193", "up", "down", "pageup", "pagedown", "home", "end"].includes(value);
}
function intersects(left, right) {
  for (const value of left) {
    if (right.has(value))
      return true;
  }
  return false;
}
function fitCompactHintSegments(segments, width) {
  const safeWidth = Math.max(1, width);
  let result = "";
  for (const segment2 of segments.map(safeMenuText).filter(Boolean)) {
    const candidate = result ? `${result} \u2022 ${segment2}` : segment2;
    if (visibleWidth(candidate) > safeWidth)
      continue;
    result = candidate;
  }
  return result;
}
function restoreSearchInput(input, query) {
  handleSearchInput(input, `\x1B[200~${replaceTerminalControls(query)}\x1B[201~`);
}
function handleSearchInput(input, data) {
  input.handleInput(data);
  const value = replaceTerminalControls(input.getValue());
  if (value !== input.getValue())
    input.setValue(value);
}

// node_modules/@narumitw/pi-tui-kit/dist/components/document-copy.js
var STANDARD_BINDINGS = [
  "tui.select.cancel",
  "tui.select.up",
  "tui.select.down",
  "tui.select.pageUp",
  "tui.select.pageDown"
];
function createDocumentCopy(options) {
  let disposed = false;
  let running = false;
  let pending;
  let controller;
  let snapshot;
  let feedback = "";
  let pasting = false;
  const current = () => !disposed && !options.signal?.aborted && (options.isCurrent?.() ?? true);
  const sameDocument = () => {
    const document = options.document();
    return snapshot !== void 0 && document?.owner === snapshot.owner && document.action === snapshot.action && document.action.label === snapshot.label && document.action.onCopy === snapshot.onCopy && document.content === snapshot.content && document.itemId === snapshot.itemId;
  };
  const cancel = () => {
    controller?.abort();
    snapshot = void 0;
    feedback = "";
  };
  const sync = () => {
    if (!current() || snapshot && !sameDocument())
      cancel();
  };
  const keys = () => {
    const claimed = [
      "ctrl+c",
      "home",
      "end",
      ...options.searchEnabled ? ["space"] : [],
      ...[...STANDARD_BINDINGS, ...options.includeConfirm ? ["tui.select.confirm"] : []].flatMap((binding) => options.keybindings.getKeys(binding).flatMap((key) => canonicalKeyId(key) ?? []))
    ];
    const enhanced = usesDisambiguatedKeyProtocol(options.tui);
    return options.keybindings.getKeys("app.message.copy").flatMap((key) => {
      const canonical = canonicalKeyId(key);
      return canonical && !claimed.some((other) => keysOverlap(canonical, other, enhanced)) ? [canonical] : [];
    });
  };
  const abort = () => cancel();
  options.signal?.addEventListener("abort", abort, { once: true });
  return {
    hint(searchActive) {
      sync();
      const document = current() ? options.document() : void 0;
      if (!document)
        return "";
      const label = safeMenuText(document.action.label);
      const available = searchActive ? [] : keys();
      const actionHint = label && available.length > 0 ? `${available.join("/")} ${label}` : "";
      return [feedback, actionHint].filter(Boolean).join(" \xB7 ");
    },
    handleInput(data) {
      sync();
      const wasPasting = pasting;
      if (data.includes("\x1B[200~"))
        pasting = true;
      const paste = wasPasting || pasting;
      if (data.includes("\x1B[201~"))
        pasting = false;
      if (paste || isKeyRelease(data) || !current())
        return;
      const document = options.document();
      if (!document || !safeMenuText(document.action.label))
        return;
      if (!keys().some((key) => matchesKey(data, key)) || running)
        return;
      snapshot = { ...document, label: document.action.label, onCopy: document.action.onCopy };
      const accepted = snapshot;
      controller = new AbortController();
      const signal = controller.signal;
      running = true;
      feedback = "Copying\u2026";
      options.tui.requestRender();
      pending = (async () => {
        let failed = false;
        try {
          await accepted.onCopy.call(accepted.action, {
            content: accepted.content,
            ...accepted.itemId === void 0 ? {} : { itemId: accepted.itemId },
            signal
          });
        } catch {
          failed = true;
        }
        sync();
        running = false;
        if (signal.aborted || !current() || !sameDocument())
          return;
        feedback = failed ? "Copy failed; try again" : "Copied";
        options.tui.requestRender();
      })();
    },
    cancel,
    async waitForPending() {
      await pending;
    },
    dispose() {
      if (disposed)
        return;
      disposed = true;
      cancel();
      options.signal?.removeEventListener("abort", abort);
    }
  };
}

// node_modules/@narumitw/pi-tui-kit/dist/components/document-formatting.js
import * as PiTui2 from "@earendil-works/pi-tui";

// node_modules/@narumitw/pi-tui-kit/node_modules/diff/libesm/diff/base.js
var Diff = class {
  diff(oldStr, newStr, options = {}) {
    let callback;
    if (typeof options === "function") {
      callback = options;
      options = {};
    } else if ("callback" in options) {
      callback = options.callback;
    }
    const oldString = this.castInput(oldStr, options);
    const newString = this.castInput(newStr, options);
    const oldTokens = this.removeEmpty(this.tokenize(oldString, options));
    const newTokens = this.removeEmpty(this.tokenize(newString, options));
    return this.diffWithOptionsObj(oldTokens, newTokens, options, callback);
  }
  diffWithOptionsObj(oldTokens, newTokens, options, callback) {
    var _a;
    const done = (value) => {
      value = this.postProcess(value, options);
      if (callback) {
        setTimeout(function() {
          callback(value);
        }, 0);
        return void 0;
      } else {
        return value;
      }
    };
    const newLen = newTokens.length, oldLen = oldTokens.length;
    let editLength = 1;
    let maxEditLength = newLen + oldLen;
    if (options.maxEditLength != null) {
      maxEditLength = Math.min(maxEditLength, options.maxEditLength);
    }
    const maxExecutionTime = (_a = options.timeout) !== null && _a !== void 0 ? _a : Infinity;
    const abortAfterTimestamp = Date.now() + maxExecutionTime;
    const bestPath = [{ oldPos: -1, lastComponent: void 0 }];
    let newPos = this.extractCommon(bestPath[0], newTokens, oldTokens, 0, options);
    if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
      return done(this.buildValues(bestPath[0].lastComponent, newTokens, oldTokens));
    }
    let minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
    const execEditLength = () => {
      for (let diagonalPath = Math.max(minDiagonalToConsider, -editLength); diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
        let basePath;
        const removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
        if (removePath) {
          bestPath[diagonalPath - 1] = void 0;
        }
        let canAdd = false;
        if (addPath) {
          const addPathNewPos = addPath.oldPos - diagonalPath;
          canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
        }
        const canRemove = removePath && removePath.oldPos + 1 < oldLen;
        if (!canAdd && !canRemove) {
          bestPath[diagonalPath] = void 0;
          continue;
        }
        if (!canRemove || canAdd && removePath.oldPos < addPath.oldPos) {
          basePath = this.addToPath(addPath, true, false, 0, options);
        } else {
          basePath = this.addToPath(removePath, false, true, 1, options);
        }
        newPos = this.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);
        if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          return done(this.buildValues(basePath.lastComponent, newTokens, oldTokens)) || true;
        } else {
          bestPath[diagonalPath] = basePath;
          if (basePath.oldPos + 1 >= oldLen) {
            maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
          }
          if (newPos + 1 >= newLen) {
            minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
          }
        }
      }
      editLength++;
    };
    if (callback) {
      (function exec() {
        setTimeout(function() {
          if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
            return callback(void 0);
          }
          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
        const ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  }
  addToPath(path, added, removed, oldPosInc, options) {
    const last = path.lastComponent;
    if (last && !options.oneChangePerToken && last.added === added && last.removed === removed) {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: { count: last.count + 1, added, removed, previousComponent: last.previousComponent }
      };
    } else {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: { count: 1, added, removed, previousComponent: last }
      };
    }
  }
  extractCommon(basePath, newTokens, oldTokens, diagonalPath, options) {
    const newLen = newTokens.length, oldLen = oldTokens.length;
    let oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldTokens[oldPos + 1], newTokens[newPos + 1], options)) {
      newPos++;
      oldPos++;
      commonCount++;
      if (options.oneChangePerToken) {
        basePath.lastComponent = { count: 1, previousComponent: basePath.lastComponent, added: false, removed: false };
      }
    }
    if (commonCount && !options.oneChangePerToken) {
      basePath.lastComponent = { count: commonCount, previousComponent: basePath.lastComponent, added: false, removed: false };
    }
    basePath.oldPos = oldPos;
    return newPos;
  }
  equals(left, right, options) {
    if (options.comparator) {
      return options.comparator(left, right);
    } else {
      return left === right || !!options.ignoreCase && left.toLowerCase() === right.toLowerCase();
    }
  }
  removeEmpty(array) {
    const ret = [];
    for (let i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  castInput(value, options) {
    return value;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tokenize(value, options) {
    return Array.from(value);
  }
  join(chars) {
    return chars.join("");
  }
  postProcess(changeObjects, options) {
    return changeObjects;
  }
  get useLongestToken() {
    return false;
  }
  buildValues(lastComponent, newTokens, oldTokens) {
    const components = [];
    let nextComponent;
    while (lastComponent) {
      components.push(lastComponent);
      nextComponent = lastComponent.previousComponent;
      delete lastComponent.previousComponent;
      lastComponent = nextComponent;
    }
    components.reverse();
    const componentLen = components.length;
    let componentPos = 0, newPos = 0, oldPos = 0;
    for (; componentPos < componentLen; componentPos++) {
      const component = components[componentPos];
      if (!component.removed) {
        if (!component.added && this.useLongestToken) {
          let value = newTokens.slice(newPos, newPos + component.count);
          value = value.map(function(value2, i) {
            const oldValue = oldTokens[oldPos + i];
            return oldValue.length > value2.length ? oldValue : value2;
          });
          component.value = this.join(value);
        } else {
          component.value = this.join(newTokens.slice(newPos, newPos + component.count));
        }
        newPos += component.count;
        if (!component.added) {
          oldPos += component.count;
        }
      } else {
        component.value = this.join(oldTokens.slice(oldPos, oldPos + component.count));
        oldPos += component.count;
      }
    }
    return components;
  }
};

// node_modules/@narumitw/pi-tui-kit/node_modules/diff/libesm/util/string.js
function longestCommonPrefix(str1, str2) {
  let i;
  for (i = 0; i < str1.length && i < str2.length; i++) {
    if (str1[i] != str2[i]) {
      return str1.slice(0, i);
    }
  }
  return str1.slice(0, i);
}
function longestCommonSuffix(str1, str2) {
  let i;
  if (!str1 || !str2 || str1[str1.length - 1] != str2[str2.length - 1]) {
    return "";
  }
  for (i = 0; i < str1.length && i < str2.length; i++) {
    if (str1[str1.length - (i + 1)] != str2[str2.length - (i + 1)]) {
      return str1.slice(-i);
    }
  }
  return str1.slice(-i);
}
function replacePrefix(string, oldPrefix, newPrefix) {
  if (string.slice(0, oldPrefix.length) != oldPrefix) {
    throw Error(`string ${JSON.stringify(string)} doesn't start with prefix ${JSON.stringify(oldPrefix)}; this is a bug`);
  }
  return newPrefix + string.slice(oldPrefix.length);
}
function replaceSuffix(string, oldSuffix, newSuffix) {
  if (!oldSuffix) {
    return string + newSuffix;
  }
  if (string.slice(-oldSuffix.length) != oldSuffix) {
    throw Error(`string ${JSON.stringify(string)} doesn't end with suffix ${JSON.stringify(oldSuffix)}; this is a bug`);
  }
  return string.slice(0, -oldSuffix.length) + newSuffix;
}
function removePrefix(string, oldPrefix) {
  return replacePrefix(string, oldPrefix, "");
}
function removeSuffix(string, oldSuffix) {
  return replaceSuffix(string, oldSuffix, "");
}
function maximumOverlap(string1, string2) {
  return string2.slice(0, overlapCount(string1, string2));
}
function overlapCount(a, b) {
  let startA = 0;
  if (a.length > b.length) {
    startA = a.length - b.length;
  }
  let endB = b.length;
  if (a.length < b.length) {
    endB = a.length;
  }
  const map = Array(endB);
  let k = 0;
  map[0] = 0;
  for (let j = 1; j < endB; j++) {
    if (b[j] == b[k]) {
      map[j] = map[k];
    } else {
      map[j] = k;
    }
    while (k > 0 && b[j] != b[k]) {
      k = map[k];
    }
    if (b[j] == b[k]) {
      k++;
    }
  }
  k = 0;
  for (let i = startA; i < a.length; i++) {
    while (k > 0 && a[i] != b[k]) {
      k = map[k];
    }
    if (a[i] == b[k]) {
      k++;
    }
  }
  return k;
}
function segment(string, segmenter) {
  const parts = [];
  for (const segmentObj of Array.from(segmenter.segment(string))) {
    const segment2 = segmentObj.segment;
    if (parts.length && /\s/.test(parts[parts.length - 1]) && /\s/.test(segment2)) {
      parts[parts.length - 1] += segment2;
    } else {
      parts.push(segment2);
    }
  }
  return parts;
}
function trailingWs(string, segmenter) {
  if (segmenter) {
    return leadingAndTrailingWs(string, segmenter)[1];
  }
  let i;
  for (i = string.length - 1; i >= 0; i--) {
    if (!string[i].match(/\s/)) {
      break;
    }
  }
  return string.substring(i + 1);
}
function leadingWs(string, segmenter) {
  if (segmenter) {
    return leadingAndTrailingWs(string, segmenter)[0];
  }
  const match = string.match(/^\s*/);
  return match ? match[0] : "";
}
function leadingAndTrailingWs(string, segmenter) {
  if (!segmenter) {
    return [leadingWs(string), trailingWs(string)];
  }
  if (segmenter.resolvedOptions().granularity != "word") {
    throw new Error('The segmenter passed must have a granularity of "word"');
  }
  const segments = segment(string, segmenter);
  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];
  const head = /\s/.test(firstSeg) ? firstSeg : "";
  const tail = /\s/.test(lastSeg) ? lastSeg : "";
  return [head, tail];
}

// node_modules/@narumitw/pi-tui-kit/node_modules/diff/libesm/diff/word.js
var extendedWordChars = "a-zA-Z0-9_\\u{AD}\\u{C0}-\\u{D6}\\u{D8}-\\u{F6}\\u{F8}-\\u{2C6}\\u{2C8}-\\u{2D7}\\u{2DE}-\\u{2FF}\\u{1E00}-\\u{1EFF}";
var tokenizeIncludingWhitespace = new RegExp(`[${extendedWordChars}]+|\\s+|[^${extendedWordChars}]`, "ug");
var WordDiff = class extends Diff {
  equals(left, right, options) {
    if (options.ignoreCase) {
      left = left.toLowerCase();
      right = right.toLowerCase();
    }
    return left.trim() === right.trim();
  }
  tokenize(value, options = {}) {
    let parts;
    if (options.intlSegmenter) {
      const segmenter = options.intlSegmenter;
      if (segmenter.resolvedOptions().granularity != "word") {
        throw new Error('The segmenter passed must have a granularity of "word"');
      }
      parts = segment(value, segmenter);
    } else {
      parts = value.match(tokenizeIncludingWhitespace) || [];
    }
    const tokens = [];
    let prevPart = null;
    parts.forEach((part) => {
      if (/\s/.test(part)) {
        if (prevPart == null) {
          tokens.push(part);
        } else {
          tokens.push(tokens.pop() + part);
        }
      } else if (prevPart != null && /\s/.test(prevPart)) {
        if (tokens[tokens.length - 1] == prevPart) {
          tokens.push(tokens.pop() + part);
        } else {
          tokens.push(prevPart + part);
        }
      } else {
        tokens.push(part);
      }
      prevPart = part;
    });
    return tokens;
  }
  join(tokens) {
    return tokens.map((token, i) => {
      if (i == 0) {
        return token;
      } else {
        return token.replace(/^\s+/, "");
      }
    }).join("");
  }
  postProcess(changes, options) {
    if (!changes || options.oneChangePerToken) {
      return changes;
    }
    let lastKeep = null;
    let insertion = null;
    let deletion = null;
    changes.forEach((change) => {
      if (change.added) {
        insertion = change;
      } else if (change.removed) {
        deletion = change;
      } else {
        if (insertion || deletion) {
          dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, change, options.intlSegmenter);
        }
        lastKeep = change;
        insertion = null;
        deletion = null;
      }
    });
    if (insertion || deletion) {
      dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, null, options.intlSegmenter);
    }
    return changes;
  }
};
var wordDiff = new WordDiff();
function dedupeWhitespaceInChangeObjects(startKeep, deletion, insertion, endKeep, segmenter) {
  if (deletion && insertion) {
    const [oldWsPrefix, oldWsSuffix] = leadingAndTrailingWs(deletion.value, segmenter);
    const [newWsPrefix, newWsSuffix] = leadingAndTrailingWs(insertion.value, segmenter);
    if (startKeep) {
      const commonWsPrefix = longestCommonPrefix(oldWsPrefix, newWsPrefix);
      startKeep.value = replaceSuffix(startKeep.value, newWsPrefix, commonWsPrefix);
      deletion.value = removePrefix(deletion.value, commonWsPrefix);
      insertion.value = removePrefix(insertion.value, commonWsPrefix);
    }
    if (endKeep) {
      const commonWsSuffix = longestCommonSuffix(oldWsSuffix, newWsSuffix);
      endKeep.value = replacePrefix(endKeep.value, newWsSuffix, commonWsSuffix);
      deletion.value = removeSuffix(deletion.value, commonWsSuffix);
      insertion.value = removeSuffix(insertion.value, commonWsSuffix);
    }
  } else if (insertion) {
    if (startKeep) {
      const ws = leadingWs(insertion.value, segmenter);
      insertion.value = insertion.value.substring(ws.length);
    }
    if (endKeep) {
      const ws = leadingWs(endKeep.value, segmenter);
      endKeep.value = endKeep.value.substring(ws.length);
    }
  } else if (startKeep && endKeep) {
    const newWsFull = leadingWs(endKeep.value, segmenter), [delWsStart, delWsEnd] = leadingAndTrailingWs(deletion.value, segmenter);
    const newWsStart = longestCommonPrefix(newWsFull, delWsStart);
    deletion.value = removePrefix(deletion.value, newWsStart);
    const newWsEnd = longestCommonSuffix(removePrefix(newWsFull, newWsStart), delWsEnd);
    deletion.value = removeSuffix(deletion.value, newWsEnd);
    endKeep.value = replacePrefix(endKeep.value, newWsFull, newWsEnd);
    startKeep.value = replaceSuffix(startKeep.value, newWsFull, newWsFull.slice(0, newWsFull.length - newWsEnd.length));
  } else if (endKeep) {
    const endKeepWsPrefix = leadingWs(endKeep.value, segmenter);
    const deletionWsSuffix = trailingWs(deletion.value, segmenter);
    const overlap = maximumOverlap(deletionWsSuffix, endKeepWsPrefix);
    deletion.value = removeSuffix(deletion.value, overlap);
  } else if (startKeep) {
    const startKeepWsSuffix = trailingWs(startKeep.value, segmenter);
    const deletionWsPrefix = leadingWs(deletion.value, segmenter);
    const overlap = maximumOverlap(startKeepWsSuffix, deletionWsPrefix);
    deletion.value = removePrefix(deletion.value, overlap);
  }
}
var WordsWithSpaceDiff = class extends Diff {
  tokenize(value) {
    const regex = new RegExp(`(\\r?\\n)|[${extendedWordChars}]+|[^\\S\\n\\r]+|[^${extendedWordChars}]`, "ug");
    return value.match(regex) || [];
  }
};
var wordsWithSpaceDiff = new WordsWithSpaceDiff();
function diffWordsWithSpace(oldStr, newStr, options) {
  return wordsWithSpaceDiff.diff(oldStr, newStr, options);
}

// node_modules/@narumitw/pi-tui-kit/dist/terminal-document.js
import { visibleWidth as visibleWidth2 } from "@earendil-works/pi-tui";
var ESC = 27;
var BEL = 7;
var CSI = 155;
var ST = 156;
var OSC = 157;
var DCS = 144;
var SOS = 152;
var PM = 158;
var APC = 159;
var TAB_SIZE = 4;
var graphemeSegmenter = new Intl.Segmenter(void 0, { granularity: "grapheme" });
function sanitizeTerminalDocument(value) {
  const normalized = value.replace(/\r\n?/gu, "\n");
  let output = "";
  for (let index = 0; index < normalized.length; ) {
    const codePoint = normalized.codePointAt(index) ?? 0;
    const length = codePoint > 65535 ? 2 : 1;
    if (codePoint === ESC) {
      index = skipEscSequence(normalized, index);
      continue;
    }
    if (codePoint === CSI) {
      index = skipCsi(normalized, index + length);
      continue;
    }
    if (codePoint === OSC || codePoint === DCS || codePoint === SOS || codePoint === PM || codePoint === APC) {
      index = skipStringSequence(normalized, index + length, codePoint === OSC);
      continue;
    }
    if (isBidiControl(codePoint)) {
      index += length;
      continue;
    }
    if (codePoint === 10 || codePoint === 9) {
      output += String.fromCodePoint(codePoint);
    } else if (isControl(codePoint)) {
      output += " ";
    } else {
      output += String.fromCodePoint(codePoint);
    }
    index += length;
  }
  return output;
}
function hardWrapTerminalDocument(value, width) {
  if (!Number.isFinite(width) || width <= 0)
    return [""];
  const safeWidth = Math.max(1, Math.floor(width));
  return sanitizeTerminalDocument(value).split("\n").flatMap((line) => hardWrapLine(expandTabs(line), safeWidth));
}
function expandTabs(line) {
  let column = 0;
  let result = "";
  for (const { segment: segment2 } of graphemeSegmenter.segment(line)) {
    if (segment2 === "	") {
      const count = TAB_SIZE - column % TAB_SIZE;
      result += " ".repeat(count);
      column += count;
      continue;
    }
    result += segment2;
    column += visibleWidth2(segment2);
  }
  return result;
}
function hardWrapLine(line, width) {
  if (line.length === 0)
    return [""];
  const lines = [];
  let current = "";
  let currentWidth = 0;
  const flush = () => {
    lines.push(current);
    current = "";
    currentWidth = 0;
  };
  for (const { segment: segment2 } of graphemeSegmenter.segment(line)) {
    const segmentWidth = visibleWidth2(segment2);
    if (segmentWidth > width) {
      if (current.length > 0)
        flush();
      lines.push("?".repeat(width));
      continue;
    }
    if (currentWidth + segmentWidth > width && current.length > 0)
      flush();
    current += segment2;
    currentWidth += segmentWidth;
  }
  if (current.length > 0 || lines.length === 0)
    lines.push(current);
  return lines;
}
function skipEscSequence(value, start) {
  return skipSequence(value, "escape", start, false);
}
function skipGenericEscSequence(value, start) {
  let index = start + 1;
  while (index < value.length) {
    const code = value.charCodeAt(index);
    if (code < 32 || code > 47)
      break;
    index += 1;
  }
  const final = value.charCodeAt(index);
  return final >= 48 && final <= 126 ? index + 1 : start + 1;
}
function skipCsi(value, start) {
  return skipSequence(value, "csi", start, false);
}
function skipStringSequence(value, start, bellTerminates) {
  return skipSequence(value, "string", start, bellTerminates);
}
function skipSequence(value, initialKind, start, initialBellTerminates) {
  let kind = initialKind;
  let index = start;
  let bellTerminates = initialBellTerminates;
  while (index < value.length) {
    if (kind === "escape") {
      const introducer = value.charCodeAt(index + 1);
      if (introducer === 91) {
        kind = "csi";
        index += 2;
        continue;
      }
      if (introducer === 93) {
        kind = "string";
        bellTerminates = true;
        index += 2;
        continue;
      }
      if (introducer === 80 || introducer === 88 || introducer === 94 || introducer === 95) {
        kind = "string";
        bellTerminates = false;
        index += 2;
        continue;
      }
      return skipGenericEscSequence(value, index);
    }
    const code = value.charCodeAt(index);
    if (kind === "string") {
      if (bellTerminates && code === BEL)
        return index + 1;
      if (code === ST)
        return index + 1;
      if (code === ESC && value.charCodeAt(index + 1) === 92)
        return index + 2;
    }
    const interrupted = introducedSequenceState(value, index);
    if (interrupted) {
      kind = interrupted.kind;
      index = interrupted.index;
      bellTerminates = interrupted.bellTerminates;
      continue;
    }
    if (kind === "csi" && code >= 64 && code <= 126)
      return index + 1;
    index += 1;
  }
  return value.length;
}
function introducedSequenceState(value, start) {
  const introducer = value.charCodeAt(start);
  if (introducer === ESC) {
    return { kind: "escape", index: start, bellTerminates: false };
  }
  if (introducer === CSI) {
    return { kind: "csi", index: start + 1, bellTerminates: false };
  }
  if (introducer === OSC || introducer === DCS || introducer === SOS || introducer === PM || introducer === APC) {
    return { kind: "string", index: start + 1, bellTerminates: introducer === OSC };
  }
  return void 0;
}
function isControl(codePoint) {
  return codePoint <= 31 || codePoint >= 127 && codePoint <= 159;
}
function isBidiControl(codePoint) {
  return codePoint === 1564 || codePoint === 8206 || codePoint === 8207 || codePoint >= 8234 && codePoint <= 8238 || codePoint >= 8294 && codePoint <= 8297;
}

// node_modules/@narumitw/pi-tui-kit/dist/components/document-sanitization.js
function sanitizeDocumentText(value) {
  return sanitizeTerminalDocument(String(value));
}

// node_modules/@narumitw/pi-tui-kit/dist/components/mermaid.js
import * as PiTui from "@earendil-works/pi-tui";
var renderMermaid;
var loadPromise;
var loadFailed = false;
function supportsRichMarkdown() {
  return typeof PiTui.renderLatex === "function" && typeof PiTui.Marked === "function";
}
function prepareMermaidRenderer() {
  if (!supportsRichMarkdown() || renderMermaid || loadFailed)
    return void 0;
  loadPromise ??= import("./dist-PGYO5DKT.ts").then((module) => {
    renderMermaid = module.render;
  }).catch(() => {
    loadFailed = true;
  });
  return loadPromise;
}
function prepareMermaidMarkdownRenderer(markdown) {
  if (!supportsRichMarkdown())
    return void 0;
  return markdownNeedsMermaid(sanitizeDocumentText(markdown)) ? prepareMermaidRenderer() : void 0;
}
function createMermaidMarkdownTransformer(theme) {
  const transform = mermaidMarkdownTransform(theme);
  if (!transform)
    return void 0;
  return (markdown, context) => {
    if (context.isStreaming || context.messageType === "assistant-thinking")
      return markdown;
    return transform(sanitizeDocumentText(markdown), context.availableWidth);
  };
}
function prepareMenuScreenRendering(screen) {
  if (screen.kind === "review") {
    return documentNeedsMermaid(screen.content, screen.format) ? prepareMermaidRenderer() : void 0;
  }
  if (screen.kind === "browse") {
    return screen.items.some((item) => documentNeedsMermaid(item.detailDocument?.content, item.detailDocument?.format)) ? prepareMermaidRenderer() : void 0;
  }
  return void 0;
}
function mermaidMarkdownTransform(theme) {
  if (!renderMermaid || !supportsRichMarkdown())
    return void 0;
  const markdownParser = new PiTui.Marked();
  return (markdown, availableWidth) => markdownParser.lexer(markdown).map((token) => renderToken(token, availableWidth, theme)).join("");
}
function documentNeedsMermaid(content, format) {
  if (format?.kind !== "markdown" || format.renderMermaid === false || content === void 0 || !supportsRichMarkdown()) {
    return false;
  }
  return markdownNeedsMermaid(sanitizeDocumentText(content));
}
function markdownNeedsMermaid(markdown) {
  if (!/(?:^|\n)[\t ]{0,3}(?:`{3,}|~{3,})[\t ]*mermaid(?:[\t \n]|$)/iu.test(markdown)) {
    return false;
  }
  return new PiTui.Marked().lexer(markdown).some(isMermaid);
}
function renderToken(token, availableWidth, theme) {
  if (!isMermaid(token) || !renderMermaid)
    return token.raw;
  let art;
  try {
    art = renderMermaid(token.text);
  } catch {
    return token.raw;
  }
  if (!art || art.width > Math.max(1, availableWidth))
    return token.raw;
  if (art.warnings.length > 0)
    return warningFallback(token.raw, art.warnings, theme);
  return `${themedLines(art, theme).map(codeSpan).join("  \n")}
`;
}
function isMermaid(token) {
  return token.type === "code" && token.lang?.trim().split(/\s+/u, 1)[0]?.toLowerCase() === "mermaid";
}
function warningFallback(raw, warnings, theme) {
  const suffix = warnings.length > 1 ? ` (+${warnings.length - 1} more)` : "";
  const warning = sanitizeTerminalText(`Mermaid diagram not rendered: ${warnings[0] ?? "incomplete source"}${suffix}`);
  return `${raw}
${codeSpan(theme.fg("warning", warning))}  
`;
}
function themedLines(art, theme) {
  return art.styled.map((row) => row.map((span) => styleSpan(span, theme)).join(""));
}
function styleSpan(span, theme) {
  switch (span.cls) {
    case "border":
      return theme.fg("borderMuted", span.text);
    case "text":
      return theme.fg("text", span.text);
    case "edge":
      return theme.fg("accent", span.text);
    case "edgeLabel":
      return theme.fg("muted", span.text);
    case "title":
      return theme.fg("accent", theme.bold(span.text));
    case "none":
      return span.text;
  }
}
function codeSpan(line) {
  const content = line || "\xA0";
  const longestBacktickRun = Math.max(0, ...Array.from(content.matchAll(/`+/gu), (match) => match[0].length));
  const fence = "`".repeat(longestBacktickRun + 1);
  const padding = content.startsWith("`") || content.endsWith("`") ? " " : "";
  return `${fence}${padding}${content}${padding}${fence}`;
}

// node_modules/@narumitw/pi-tui-kit/dist/components/syntax-highlighting.js
import { createRequire } from "node:module";
var require2 = createRequire(import.meta.url);
var highlighter;
var LANGUAGE_BY_EXTENSION = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  go: "go",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  fish: "fish",
  ps1: "powershell",
  sql: "sql",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  xml: "xml",
  md: "markdown",
  markdown: "markdown",
  dockerfile: "dockerfile",
  makefile: "makefile",
  cmake: "cmake",
  lua: "lua",
  perl: "perl",
  r: "r",
  scala: "scala",
  clj: "clojure",
  ex: "elixir",
  exs: "elixir",
  erl: "erlang",
  hs: "haskell",
  ml: "ocaml",
  vim: "vim",
  graphql: "graphql",
  proto: "protobuf",
  tf: "hcl",
  hcl: "hcl"
};
var SCOPE_COLORS = {
  keyword: "syntaxKeyword",
  built_in: "syntaxType",
  literal: "syntaxNumber",
  number: "syntaxNumber",
  regexp: "syntaxString",
  string: "syntaxString",
  comment: "syntaxComment",
  doctag: "syntaxComment",
  meta: "muted",
  function: "syntaxFunction",
  title: "syntaxFunction",
  class: "syntaxType",
  type: "syntaxType",
  tag: "syntaxPunctuation",
  name: "syntaxKeyword",
  attr: "syntaxVariable",
  variable: "syntaxVariable",
  params: "syntaxVariable",
  operator: "syntaxOperator",
  punctuation: "syntaxPunctuation",
  addition: "toolDiffAdded",
  deletion: "toolDiffRemoved"
};
function getLanguageFromPath(filePath) {
  const extension = filePath.split(".").pop()?.toLowerCase();
  return extension ? LANGUAGE_BY_EXTENSION[extension] : void 0;
}
function highlightCode(code, language, theme) {
  if (!language)
    return plainCode(code, theme);
  const hljs = loadHighlighter();
  if (!hljs.getLanguage(language))
    return plainCode(code, theme);
  try {
    const html = hljs.highlight(code, { language, ignoreIllegals: true }).value;
    return theme.fg("mdCodeBlock", renderHighlightedHtml(html, syntaxFormatters(theme)));
  } catch {
    return theme.fg("mdCodeBlock", code);
  }
}
function loadHighlighter() {
  if (highlighter)
    return highlighter;
  const loaded = require2("highlight.js");
  const candidate = highlightApi(loaded) ?? highlightApi(moduleDefault(loaded));
  if (!candidate)
    throw new TypeError("highlight.js did not expose its expected API");
  highlighter = candidate;
  return candidate;
}
function highlightApi(value) {
  if (!value || typeof value !== "object")
    return void 0;
  const candidate = value;
  return typeof candidate.getLanguage === "function" && typeof candidate.highlight === "function" ? candidate : void 0;
}
function moduleDefault(value) {
  return value && typeof value === "object" && "default" in value ? value.default : void 0;
}
function plainCode(code, theme) {
  return theme.fg("mdCodeBlock", theme.fg("mdCodeBlock", code));
}
function syntaxFormatters(theme) {
  const formatters = {};
  for (const [scope, color] of Object.entries(SCOPE_COLORS)) {
    formatters[scope] = (text) => theme.fg(color, text);
  }
  formatters.emphasis = (text) => theme.italic?.(text) ?? text;
  formatters.strong = (text) => theme.bold(text);
  formatters.link = (text) => theme.underline?.(text) ?? text;
  return formatters;
}
function renderHighlightedHtml(html, formatters) {
  let output = "";
  let textBuffer = "";
  const scopes = [];
  const flush = () => {
    if (!textBuffer)
      return;
    output += activeFormatter(scopes, formatters)?.(textBuffer) ?? textBuffer;
    textBuffer = "";
  };
  for (let index = 0; index < html.length; ) {
    if (html.startsWith("<span", index)) {
      const tagEnd = html.indexOf(">", index + 5);
      if (tagEnd >= 0) {
        flush();
        scopes.push(scopeFromTag(html.slice(index, tagEnd + 1)));
        index = tagEnd + 1;
        continue;
      }
    }
    if (html.startsWith("</span>", index)) {
      flush();
      scopes.pop();
      index += "</span>".length;
      continue;
    }
    if (html[index] === "&") {
      const entityEnd = html.indexOf(";", index + 1);
      if (entityEnd >= 0) {
        const decoded = decodeEntity(html.slice(index + 1, entityEnd));
        if (decoded !== void 0) {
          textBuffer += decoded;
          index = entityEnd + 1;
          continue;
        }
      }
    }
    textBuffer += html[index];
    index += 1;
  }
  flush();
  return output;
}
function scopeFromTag(tag) {
  const classValue = /\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/u.exec(tag)?.slice(1).find(Boolean);
  return classValue?.split(/\s+/u).find((className) => className.startsWith("hljs-"))?.slice("hljs-".length);
}
function activeFormatter(scopes, formatters) {
  for (let index = scopes.length - 1; index >= 0; index -= 1) {
    const scope = scopes[index];
    if (!scope)
      continue;
    const exact = formatters[scope];
    if (exact)
      return exact;
    const prefix = scope.split(/[.-]/u)[0];
    if (prefix && formatters[prefix])
      return formatters[prefix];
  }
  return void 0;
}
function decodeEntity(entity) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"'
  };
  if (named[entity] !== void 0)
    return named[entity];
  const radix = entity.startsWith("#x") || entity.startsWith("#X") ? 16 : 10;
  const digits = entity.startsWith("#x") || entity.startsWith("#X") ? entity.slice(2) : entity.slice(1);
  if (!entity.startsWith("#") || !digits)
    return void 0;
  const codePoint = Number.parseInt(digits, radix);
  if (!Number.isSafeInteger(codePoint) || codePoint < 0 || codePoint > 1114111)
    return void 0;
  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return void 0;
  }
}

// node_modules/@narumitw/pi-tui-kit/dist/components/document-formatting.js
var RPC_DOCUMENT_LINE_WIDTH = 120;
var RPC_DOCUMENT_PAGE_SIZE = 8;
var MAX_MARKDOWN_REFERENCE_CELLS = 1e5;
var MAX_INTRALINE_PAIR_CODE_UNITS = 4096;
var MAX_INTRALINE_DOCUMENT_CODE_UNITS = 2e4;
function createDocumentLineCache(theme, includeSearchMetadata = false) {
  let cached;
  const presentation = (content, format, width) => {
    const identity = documentFormatIdentity(format);
    if (cached?.content === content && cached.formatKind === identity.kind && cached.language === identity.language && cached.filePath === identity.filePath && cached.renderLatex === identity.renderLatex && cached.renderMermaid === identity.renderMermaid && cached.richMarkdown === identity.richMarkdown && cached.width === width) {
      return cached.presentation;
    }
    const next = formatDocumentPresentation(content, format, width, theme, includeSearchMetadata);
    cached = {
      content,
      formatKind: identity.kind,
      language: identity.language,
      filePath: identity.filePath,
      renderLatex: identity.renderLatex,
      renderMermaid: identity.renderMermaid,
      richMarkdown: identity.richMarkdown,
      width,
      presentation: next
    };
    return next;
  };
  return {
    presentation,
    lines(content, format, width) {
      return presentation(content, format, width).lines;
    },
    invalidate() {
      cached = void 0;
    }
  };
}
function formatDocumentPresentation(content, format, width, theme, includeSearchMetadata = true) {
  const resolvedFormat = format ?? { kind: "text" };
  if (resolvedFormat.kind === "markdown") {
    const prepared = prepareMarkdownDocument(content, resolvedFormat, width, theme);
    const lines2 = renderMarkdownDocument(prepared, resolvedFormat, width, theme);
    const searchLines = markdownSearchLines(lines2);
    if (!includeSearchMetadata) {
      return {
        lines: lines2,
        searchLines,
        softWrapAfter: lines2.map(() => false),
        ignoreLeadingWhitespace: lines2.map(() => false),
        searchSources: []
      };
    }
    const referenceWidth = markdownReferenceWidth(prepared, width);
    const referenceLines = renderMarkdownDocument(prepared, resolvedFormat, referenceWidth, theme);
    const referenceSearchLines = markdownSearchLines(referenceLines);
    const boundaryLines = renderMarkdownDocument(prepared, resolvedFormat, referenceWidth + 1, theme);
    const boundarySearchLines = markdownSearchLines(boundaryLines);
    const referenceSoftWrapAfter = markdownSoftWrapAfter(referenceSearchLines, markdownReferenceText(boundarySearchLines, []), 1);
    const softWrapAfter = markdownSoftWrapAfter(searchLines, markdownReferenceText(referenceSearchLines, referenceSoftWrapAfter));
    return {
      lines: lines2,
      searchLines,
      softWrapAfter,
      ignoreLeadingWhitespace: searchLines.map((_, index) => softWrapAfter[index - 1] ?? false),
      searchSources: markdownTableSearchSources(lines2, referenceLines, boundaryLines)
    };
  }
  if (resolvedFormat.kind === "diff") {
    const diff = formatDiffDocument(content, width, theme);
    return {
      lines: diff.lines,
      searchLines: diff.lines,
      softWrapAfter: diff.softWrapAfter,
      ignoreLeadingWhitespace: diff.lines.map(() => false),
      searchSources: []
    };
  }
  const segments = documentSegments(content, width);
  const lines = resolvedFormat.kind === "code" ? segments.map(({ text }) => {
    const language = resolvedFormat.language ?? (resolvedFormat.filePath ? getLanguageFromPath(resolvedFormat.filePath) : void 0);
    return highlightCode(text, language, theme);
  }) : segments.map(({ text }) => theme.fg("text", text));
  return {
    lines,
    searchLines: lines,
    softWrapAfter: segments.map(({ softWrapAfter }) => softWrapAfter),
    ignoreLeadingWhitespace: lines.map(() => false),
    searchSources: []
  };
}
function formatDiffDocument(content, width, theme) {
  const sourceLines = sanitizeDocumentText(content).split("\n");
  const fileHeaderLines = findDiffFileHeaderLines(sourceLines);
  const lines = [];
  const softWrapAfter = [];
  let remainingIntralineCodeUnits = MAX_INTRALINE_DOCUMENT_CODE_UNITS;
  const append = (rendered) => {
    lines.push(...rendered);
    softWrapAfter.push(...rendered.map((_, index) => index < rendered.length - 1));
  };
  for (let index = 0; index < sourceLines.length; ) {
    const source = sourceLines[index] ?? "";
    const parsed = fileHeaderLines.has(index) ? void 0 : parseChangedDiffLine(source);
    if (parsed?.marker === "-") {
      const removed = [];
      while (index < sourceLines.length) {
        const candidate = fileHeaderLines.has(index) ? void 0 : parseChangedDiffLine(sourceLines[index] ?? "");
        if (candidate?.marker !== "-")
          break;
        removed.push(candidate);
        index += 1;
      }
      const added = [];
      while (index < sourceLines.length) {
        const candidate = fileHeaderLines.has(index) ? void 0 : parseChangedDiffLine(sourceLines[index] ?? "");
        if (candidate?.marker !== "+")
          break;
        added.push(candidate);
        index += 1;
      }
      const pairCodeUnits = (removed[0]?.content.length ?? 0) + (added[0]?.content.length ?? 0);
      if (removed.length === 1 && added.length === 1 && pairCodeUnits <= MAX_INTRALINE_PAIR_CODE_UNITS && pairCodeUnits <= remainingIntralineCodeUnits) {
        const removedLine = removed[0];
        const addedLine = added[0];
        if (removedLine && addedLine) {
          remainingIntralineCodeUnits -= pairCodeUnits;
          const expandedRemoved = expandChangedDiffLine(removedLine);
          const expandedAdded = expandChangedDiffLine(addedLine);
          const paired = pairedDiffParts(expandedRemoved.content, expandedAdded.content);
          append(renderStyledDiffLine(expandedRemoved.prefix, paired.removed, width, "toolDiffRemoved", theme));
          append(renderStyledDiffLine(expandedAdded.prefix, paired.added, width, "toolDiffAdded", theme));
        }
      } else {
        for (const line of removed)
          append(renderPlainDiffLine(line, width, "toolDiffRemoved", theme));
        for (const line of added)
          append(renderPlainDiffLine(line, width, "toolDiffAdded", theme));
      }
      continue;
    }
    if (parsed?.marker === "+") {
      append(renderPlainDiffLine(parsed, width, "toolDiffAdded", theme));
      index += 1;
      continue;
    }
    const role = source.startsWith("@@") ? "accent" : "toolDiffContext";
    append(renderStyledDiffLine("", [{ text: expandDiffTabs(source), changed: false }], width, role, theme));
    index += 1;
  }
  return { lines, softWrapAfter };
}
function findDiffFileHeaderLines(lines) {
  const headers = /* @__PURE__ */ new Set();
  let hunk;
  let filePreamble = false;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (line.startsWith("diff --git ")) {
      hunk = void 0;
      filePreamble = true;
      continue;
    }
    const nextHunk = parseDiffHunkHeader(line);
    if (nextHunk) {
      hunk = nextHunk;
      filePreamble = false;
      continue;
    }
    if (hunk) {
      if (line.startsWith(" ")) {
        hunk.old -= 1;
        hunk.added -= 1;
      } else if (line.startsWith("-"))
        hunk.old -= 1;
      else if (line.startsWith("+"))
        hunk.added -= 1;
      else if (!line.startsWith("\\"))
        hunk = void 0;
      if (hunk && hunk.old <= 0 && hunk.added <= 0)
        hunk = void 0;
      continue;
    }
    if (line.startsWith("---") && lines[index + 1]?.startsWith("+++") && (filePreamble || lines[index + 2]?.startsWith("@@"))) {
      headers.add(index);
      headers.add(index + 1);
      index += 1;
      filePreamble = false;
    }
  }
  return headers;
}
function parseDiffHunkHeader(line) {
  const match = /^@@ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/u.exec(line);
  if (!match)
    return void 0;
  return {
    old: Number(match[1] ?? 1),
    added: Number(match[2] ?? 1)
  };
}
function parseChangedDiffLine(line) {
  const marker = line[0];
  if (marker !== "+" && marker !== "-")
    return void 0;
  const indented = /^([+-])(\s+)(.*)$/u.exec(line);
  if (indented) {
    return {
      marker,
      prefix: `${marker}${indented[2] ?? ""}`,
      content: indented[3] ?? ""
    };
  }
  return { marker, prefix: marker, content: line.slice(1) };
}
function renderPlainDiffLine(line, width, role, theme) {
  const expanded = expandChangedDiffLine(line);
  return renderStyledDiffLine(expanded.prefix, [{ text: expanded.content, changed: false }], width, role, theme);
}
function expandChangedDiffLine(line) {
  const prefix = expandDiffTabs(line.prefix);
  return {
    prefix,
    content: expandDiffTabs(line.content, PiTui2.visibleWidth(prefix))
  };
}
function pairedDiffParts(oldContent, newContent) {
  const removed = [];
  const added = [];
  for (const part of diffWordsWithSpace(oldContent, newContent)) {
    if (part.removed) {
      appendChangedDiffPart(removed, part.value, hasOnlyLeadingWhitespace(removed));
    } else if (part.added) {
      appendChangedDiffPart(added, part.value, hasOnlyLeadingWhitespace(added));
    } else {
      appendStyledDiffPart(removed, part.value, false);
      appendStyledDiffPart(added, part.value, false);
    }
  }
  return { removed, added };
}
function hasOnlyLeadingWhitespace(parts) {
  return parts.every((part) => !/\S/u.test(part.text));
}
function appendChangedDiffPart(target, value, stripLeadingWhitespace) {
  if (!stripLeadingWhitespace) {
    appendStyledDiffPart(target, value, true);
    return;
  }
  const leadingWhitespace = /^\s*/u.exec(value)?.[0] ?? "";
  appendStyledDiffPart(target, leadingWhitespace, false);
  appendStyledDiffPart(target, value.slice(leadingWhitespace.length), true);
}
function appendStyledDiffPart(target, text, changed) {
  if (!text)
    return;
  const previous = target.at(-1);
  if (previous?.changed === changed)
    previous.text += text;
  else
    target.push({ text, changed });
}
function renderStyledDiffLine(prefix, content, width, role, theme) {
  const safeWidth = Math.max(1, Math.floor(width));
  const rows = [];
  let row = [];
  let rowWidth = 0;
  const flush = () => {
    rows.push(row);
    row = [];
    rowWidth = 0;
  };
  for (const part of [{ text: prefix, changed: false }, ...content]) {
    for (const { segment: segment2 } of diffGraphemeSegmenter.segment(part.text)) {
      const segmentWidth = PiTui2.visibleWidth(segment2);
      if (segmentWidth > safeWidth) {
        if (row.length > 0)
          flush();
        rows.push([{ text: "?".repeat(safeWidth), changed: part.changed }]);
        continue;
      }
      if (rowWidth + segmentWidth > safeWidth && row.length > 0)
        flush();
      appendStyledDiffPart(row, segment2, part.changed);
      rowWidth += segmentWidth;
    }
  }
  if (row.length > 0 || rows.length === 0)
    flush();
  return rows.map((parts) => theme.fg(role, parts.map((part) => part.changed && theme.inverse ? theme.inverse(part.text) : part.text).join("")));
}
function expandDiffTabs(line, initialColumn = 0) {
  let column = Math.max(0, initialColumn);
  let output = "";
  for (const { segment: segment2 } of diffGraphemeSegmenter.segment(line)) {
    if (segment2 === "	") {
      const count = 4 - column % 4;
      output += " ".repeat(count);
      column += count;
    } else {
      output += segment2;
      column += PiTui2.visibleWidth(segment2);
    }
  }
  return output;
}
var diffGraphemeSegmenter = new Intl.Segmenter(void 0, { granularity: "grapheme" });
function markdownSearchLines(lines) {
  const plainLines = lines.map((line) => PiTui2.stripTerminalSequences(line).trimEnd());
  const tableRowStarts = markdownTableRowStarts(plainLines);
  return plainLines.map((line, index) => {
    const tableStart = tableRowStarts[index];
    if (tableStart !== void 0) {
      const prefix = PiTui2.sliceByColumn(line, 0, tableStart, true);
      const frame = markdownTableFrame(line, tableStart);
      return `${normalizeMarkdownContainerPrefix(prefix)}${frame.replace(/^│ /u, "  ").replace(/ │$/u, "")}`;
    }
    return normalizeMarkdownContainerPrefix(line);
  });
}
function normalizeMarkdownContainerPrefix(line) {
  return line.replace(/^(\s*(?:(?:[-+*]|\d+[.)])\s+)*)((?:│ )+)/u, (_match, prefix, quoteBorders) => prefix + " ".repeat(PiTui2.visibleWidth(quoteBorders)));
}
function markdownTableRowStarts(lines) {
  const starts = lines.map(() => void 0);
  for (const [index, line] of lines.entries()) {
    const tableStart = markdownTableTopStart(line);
    if (tableStart === void 0)
      continue;
    const rows = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const frame = markdownTableFrame(lines[cursor] ?? "", tableStart);
      if (/^│ .* │$/u.test(frame)) {
        rows.push(cursor);
        continue;
      }
      if (/^├.*┤$/u.test(frame))
        continue;
      if (/^└.*┘$/u.test(frame)) {
        for (const row of rows)
          starts[row] = tableStart;
      }
      break;
    }
  }
  return starts;
}
function markdownTableTopStart(line) {
  for (let index = line.indexOf("\u250C"); index >= 0; index = line.indexOf("\u250C", index + 1)) {
    const start = PiTui2.visibleWidth(line.slice(0, index));
    if (/^┌.*┐$/u.test(markdownTableFrame(line, start)))
      return start;
  }
  return void 0;
}
function markdownTableFrame(line, start) {
  return PiTui2.sliceByColumn(line, start, Math.max(0, PiTui2.visibleWidth(line) - start), true);
}
function markdownTableSearchSources(lines, referenceLines, boundaryLines) {
  const sources = markdownTableCellSources(lines);
  const referenceSources = markdownTableCellSources(referenceLines);
  const boundarySources = markdownTableCellSources(boundaryLines);
  return sources.flatMap((source, index) => {
    if (source.length < 2)
      return [];
    const markedReference = markTableCellSeparators(referenceSources[index] ?? [], boundarySources[index] ?? [], false, 1);
    return [markTableCellSeparators(source, markedReference, true)];
  });
}
function markdownTableCellSources(lines) {
  const plainLines = lines.map((line) => PiTui2.stripTerminalSequences(line).trimEnd());
  const tableRowStarts = markdownTableRowStarts(plainLines);
  const sources = [];
  for (let index = 0; index < plainLines.length; ) {
    const tableStart = tableRowStarts[index];
    if (tableStart === void 0) {
      index += 1;
      continue;
    }
    const boundaries = markdownTableBoundaries(plainLines, index, tableStart);
    const rows = [];
    while (index < plainLines.length && tableRowStarts[index] === tableStart) {
      rows.push(markdownTableCells(plainLines[index] ?? "", index, boundaries));
      index += 1;
    }
    const columnCount = Math.max(0, ...rows.map((row) => row.length));
    for (let column = 0; column < columnCount; column += 1) {
      sources.push(rows.flatMap((row) => {
        const segment2 = row[column];
        return segment2 ? [segment2] : [];
      }));
    }
  }
  return sources;
}
function markTableCellSeparators(source, referenceSource, referenceHasMetadata, rightLimit = 16) {
  const reference = referenceSource.map((segment2, index) => {
    const separator = index === 0 || referenceHasMetadata && !segment2.separatorBefore ? "" : "\n";
    return `${separator}${segment2.text}`;
  }).join("");
  let referenceOffset = 0;
  return source.map((segment2, index) => {
    if (index === 0)
      return segment2;
    const previous = source[index - 1];
    const left = Array.from(previous?.text ?? "").slice(-16).join("");
    const right = Array.from(segment2.text).slice(0, rightLimit).join("");
    const leftIndex = reference.indexOf(left, referenceOffset);
    if (leftIndex >= 0)
      referenceOffset = leftIndex + left.length;
    return {
      ...segment2,
      separatorBefore: leftIndex < 0 || !reference.startsWith(right, referenceOffset)
    };
  });
}
function markdownTableBoundaries(lines, rowIndex, tableStart) {
  let borderIndex = rowIndex - 1;
  while (borderIndex >= 0 && /^│ .* │$/u.test(markdownTableFrame(lines[borderIndex] ?? "", tableStart))) {
    borderIndex -= 1;
  }
  const border = lines[borderIndex] ?? "";
  const boundaries = [];
  let column = 0;
  for (const character of border) {
    if (/^[┌├└┬┼┴┐┤┘]$/u.test(character))
      boundaries.push(column);
    column += PiTui2.visibleWidth(character);
  }
  return boundaries;
}
function markdownTableCells(line, row, boundaries) {
  const cells = [];
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = (boundaries[index] ?? 0) + 1;
    const end = boundaries[index + 1] ?? start;
    const raw = PiTui2.sliceByColumn(line, start, Math.max(0, end - start), true);
    const leading = /^\s*/u.exec(raw)?.[0] ?? "";
    const text = raw.trim();
    if (text) {
      cells.push({
        row,
        column: start + PiTui2.visibleWidth(leading),
        text
      });
    } else
      cells.push(void 0);
  }
  return cells;
}
function markdownReferenceWidth(content, width) {
  const sourceLines = content.split("\n");
  const widestSourceLine = sourceLines.reduce((widest, line) => Math.max(widest, PiTui2.visibleWidth(line)), 0);
  const budgetedWidth = Math.max(1, Math.floor(MAX_MARKDOWN_REFERENCE_CELLS / Math.max(1, sourceLines.length)));
  return Math.max(1, width, Math.min(widestSourceLine + 32, budgetedWidth));
}
function markdownSoftWrapAfter(lines, reference, rightLimit = 16) {
  let referenceOffset = 0;
  return lines.map((line, index) => {
    const next = lines[index + 1];
    if (next === void 0)
      return false;
    const left = Array.from(line.trim()).slice(-16).join("");
    const right = Array.from(next.trim()).slice(0, rightLimit).join("");
    if (!left || !right)
      return false;
    const leftIndex = reference.indexOf(left, referenceOffset);
    if (leftIndex < 0)
      return false;
    referenceOffset = leftIndex + left.length;
    return reference.startsWith(right, referenceOffset);
  });
}
function markdownReferenceText(lines, softWrapAfter) {
  return lines.map((line, index) => `${line.trim()}${softWrapAfter[index] ? "" : "\n"}`).join("");
}
function plainDocumentLines(content, width) {
  return documentSegments(content, width).map(({ text }) => text);
}
function prepareMarkdownDocument(content, format, width, theme) {
  const safe = sanitizeDocumentText(content);
  const transform = format.renderMermaid === false ? void 0 : mermaidMarkdownTransform(theme);
  return transform?.(safe, Math.max(1, width)) ?? safe;
}
function renderMarkdownDocument(content, format, width, theme) {
  const component = new PiTui2.Markdown(content, 0, 0, markdownTheme(theme), { color: (text) => theme.fg("text", text) }, { renderLatex: format.renderLatex ?? true });
  return component.render(Math.max(1, width));
}
function markdownTheme(theme) {
  return {
    heading: (text) => theme.fg("mdHeading", text),
    link: (text) => theme.fg("mdLink", text),
    linkUrl: (text) => theme.fg("mdLinkUrl", text),
    code: (text) => theme.fg("mdCode", text),
    codeBlock: (text) => theme.fg("mdCodeBlock", text),
    codeBlockBorder: (text) => theme.fg("mdCodeBlockBorder", text),
    quote: (text) => theme.fg("mdQuote", text),
    quoteBorder: (text) => theme.fg("mdQuoteBorder", text),
    hr: (text) => theme.fg("mdHr", text),
    listBullet: (text) => theme.fg("mdListBullet", text),
    bold: (text) => theme.bold(text),
    italic: (text) => theme.italic?.(text) ?? text,
    underline: (text) => theme.underline?.(text) ?? text,
    strikethrough: (text) => theme.strikethrough?.(text) ?? text,
    highlightCode: (code, language) => code.split("\n").map((line) => highlightCode(line, language, theme))
  };
}
function documentDialogPages(content, width, pageSize) {
  const lines = plainDocumentLines(content, width);
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const pages = [];
  for (let index = 0; index < lines.length; index += safePageSize) {
    pages.push(lines.slice(index, index + safePageSize));
  }
  return pages.length > 0 ? pages : [[""]];
}
function documentFormatIdentity(format) {
  const shared = {
    renderLatex: void 0,
    renderMermaid: void 0,
    richMarkdown: supportsRichMarkdown()
  };
  if (format?.kind === "code") {
    return { ...shared, kind: format.kind, language: format.language, filePath: format.filePath };
  }
  if (format?.kind === "diff") {
    return { ...shared, kind: format.kind, language: void 0, filePath: format.filePath };
  }
  if (format?.kind === "markdown") {
    return {
      ...shared,
      kind: format.kind,
      language: void 0,
      filePath: void 0,
      renderLatex: format.renderLatex ?? true,
      renderMermaid: format.renderMermaid ?? true
    };
  }
  return { ...shared, kind: "text", language: void 0, filePath: void 0 };
}
function documentSegments(content, width) {
  return sanitizeDocumentText(content).split("\n").flatMap((source) => {
    const wrapped = hardWrapTerminalDocument(source, width);
    return wrapped.map((text, index) => ({
      source,
      text,
      softWrapAfter: index < wrapped.length - 1
    }));
  });
}

// node_modules/@narumitw/pi-tui-kit/dist/components/document-search.js
import { decodeKittyPrintable, Input, Key, sliceByColumn as sliceByColumn2, stripTerminalSequences as stripTerminalSequences3, truncateToWidth as truncateToWidth3, visibleWidth as visibleWidth4 } from "@earendil-works/pi-tui";
var graphemeSegmenter2 = new Intl.Segmenter(void 0, { granularity: "grapheme" });
var PASTE_START = "\x1B[200~";
var PASTE_END = "\x1B[201~";
var MAX_HIGHLIGHTED_MATCHES = 1e3;
var MAX_SEARCH_QUERY_LENGTH = 4096;
var MAX_PASTE_BUFFER_LENGTH = MAX_SEARCH_QUERY_LENGTH * 16;
var DOCUMENT_SEARCH_CONFLICT_BINDINGS = [
  "tui.select.up",
  "tui.select.down",
  "tui.select.pageUp",
  "tui.select.pageDown",
  "tui.select.cancel",
  "tui.altScreen.search"
];
var DOCUMENT_SEARCH_ACTIVE_ACTION_BINDINGS = [
  "tui.select.up",
  "tui.select.down",
  "tui.select.pageUp",
  "tui.select.pageDown",
  "tui.altScreen.searchNext",
  "tui.altScreen.searchPrevious",
  "tui.altScreen.searchClose"
];
var DOCUMENT_SEARCH_ACTIVATE_KEY = Key.space;
function documentSearchActivationAvailable(keybindings, includeConfirm) {
  return ![...DOCUMENT_SEARCH_CONFLICT_BINDINGS, ...includeConfirm ? ["tui.select.confirm"] : []].some((binding) => keybindings.matches(" ", binding));
}
function documentSearchActionMatches(keybindings, data) {
  return DOCUMENT_SEARCH_ACTIVE_ACTION_BINDINGS.some((binding) => keybindings.matches(data, binding));
}
var INVALID_CELL = 4294967295;
var CorpusCellBuilder = class {
  rows;
  starts;
  ends;
  length = 0;
  constructor(initialCapacity = 1024) {
    const capacity = Math.max(1, initialCapacity);
    this.rows = new Uint32Array(capacity);
    this.starts = new Uint32Array(capacity);
    this.ends = new Uint32Array(capacity);
  }
  push(row, start, end) {
    this.ensureCapacity();
    this.rows[this.length] = row;
    this.starts[this.length] = start;
    this.ends[this.length] = end;
    this.length += 1;
  }
  finish() {
    if (this.length === this.rows.length) {
      return { rows: this.rows, starts: this.starts, ends: this.ends };
    }
    return {
      rows: this.rows.slice(0, this.length),
      starts: this.starts.slice(0, this.length),
      ends: this.ends.slice(0, this.length)
    };
  }
  ensureCapacity() {
    if (this.length < this.rows.length)
      return;
    const capacity = this.rows.length * 2;
    const rows = new Uint32Array(capacity);
    const starts = new Uint32Array(capacity);
    const ends = new Uint32Array(capacity);
    rows.set(this.rows);
    starts.set(this.starts);
    ends.set(this.ends);
    this.rows = rows;
    this.starts = starts;
    this.ends = ends;
  }
};
var MatchOffsetBuilder = class {
  offsets;
  length = 0;
  constructor(initialCapacity = 1024) {
    this.offsets = new Uint32Array(Math.max(2, initialCapacity));
  }
  push(start, end) {
    if (this.length + 2 > this.offsets.length) {
      const offsets = new Uint32Array(this.offsets.length * 2);
      offsets.set(this.offsets);
      this.offsets = offsets;
    }
    this.offsets[this.length] = start;
    this.offsets[this.length + 1] = end;
    this.length += 2;
  }
  finish() {
    return this.length === this.offsets.length ? this.offsets : this.offsets.slice(0, this.length);
  }
};
function emptyCorpusCells() {
  return {
    rows: new Uint32Array(),
    starts: new Uint32Array(),
    ends: new Uint32Array()
  };
}
var DocumentSearchController = class {
  inputComponent = new Input();
  active = false;
  parentFocused = false;
  lines = [];
  softWrapAfter = [];
  ignoreLeadingWhitespace = [];
  searchSources = [];
  corpus = "";
  cells = emptyCorpusCells();
  corpusReady = false;
  compactMatchOffsets;
  compactMatchGroups = [];
  compactMatchGroupIndexes = new Uint32Array();
  compactMatchIndexes = new Uint32Array();
  currentIndex = 0;
  pasting = false;
  pasteBuffer = "";
  pasteStartBuffer = "";
  anchorRow = 0;
  get input() {
    return this.inputComponent;
  }
  get focused() {
    return this.parentFocused;
  }
  set focused(value) {
    this.parentFocused = value;
    this.syncFocus();
  }
  get count() {
    if (this.compactMatchGroups.length === 1) {
      return (this.compactMatchGroups[0]?.offsets.length ?? 0) / 2;
    }
    return this.compactMatchGroupIndexes.length;
  }
  get current() {
    return this.count === 0 ? 0 : this.currentIndex + 1;
  }
  get currentRow() {
    return this.currentMatch()?.ranges[0]?.row;
  }
  activate(lines, softWrapAfter = [], ignoreLeadingWhitespace = [], searchSources = [], anchorRow = 0) {
    this.active = true;
    this.anchorRow = Math.max(0, anchorRow);
    this.updateLines(lines, softWrapAfter, ignoreLeadingWhitespace, searchSources);
    this.ensureCorpus();
    this.syncFocus();
  }
  close() {
    this.active = false;
    this.input.focused = false;
    this.inputComponent = new Input();
    this.releaseCorpus();
    this.currentIndex = 0;
    this.anchorRow = 0;
    this.pasting = false;
    this.pasteBuffer = "";
    this.pasteStartBuffer = "";
    this.syncFocus();
  }
  updateLines(lines, softWrapAfter = [], ignoreLeadingWhitespace = [], searchSources = []) {
    if (sameLines(this.lines, lines) && sameValues(this.softWrapAfter, softWrapAfter) && sameValues(this.ignoreLeadingWhitespace, ignoreLeadingWhitespace) && sameSearchSources(this.searchSources, searchSources)) {
      return false;
    }
    this.lines = [...lines];
    this.softWrapAfter = [...softWrapAfter];
    this.ignoreLeadingWhitespace = [...ignoreLeadingWhitespace];
    this.searchSources = searchSources.map((source) => source.map((segment2) => ({ ...segment2 })));
    this.anchorRow = this.currentRow ?? this.anchorRow;
    this.releaseCorpus();
    if (this.active)
      this.ensureCorpus();
    return true;
  }
  routeInput(data, handleOutsidePaste, shouldDispatchPrefix = () => false) {
    let changed = false;
    const input = this.pasteStartBuffer + data;
    this.pasteStartBuffer = "";
    let offset = 0;
    while (offset < input.length) {
      if (this.pasting) {
        const markerPrefix = this.pasteBuffer.slice(-(PASTE_END.length - 1));
        const combined = markerPrefix + input.slice(offset);
        const end2 = combined.indexOf(PASTE_END);
        const consumed = end2 < 0 ? input.length - offset : Math.max(0, end2 + PASTE_END.length - markerPrefix.length);
        const nextOffset2 = offset + consumed;
        changed = this.handleInput(input.slice(offset, nextOffset2)) || changed;
        offset = nextOffset2;
        continue;
      }
      const start = input.indexOf(PASTE_START, offset);
      if (start < 0) {
        const remainder = input.slice(offset);
        const prefixLength = trailingMarkerPrefixLength(remainder, PASTE_START);
        const outsidePaste = remainder.slice(0, remainder.length - prefixLength);
        if (outsidePaste && !handleOutsidePaste(outsidePaste)) {
          return { changed, stopped: true };
        }
        const prefix = remainder.slice(remainder.length - prefixLength);
        if (prefix && shouldDispatchPrefix(prefix)) {
          return { changed, stopped: !handleOutsidePaste(prefix) };
        }
        this.pasteStartBuffer = prefix;
        return { changed, stopped: false };
      }
      if (start > offset && !handleOutsidePaste(input.slice(offset, start))) {
        return { changed, stopped: true };
      }
      if (!this.active)
        return { changed, stopped: true };
      const end = input.indexOf(PASTE_END, start + PASTE_START.length);
      const nextOffset = end < 0 ? input.length : end + PASTE_END.length;
      changed = this.handleInput(input.slice(start, nextOffset)) || changed;
      offset = nextOffset;
    }
    return { changed, stopped: false };
  }
  handleInput(data) {
    const previous = this.input.getValue();
    const pasted = sanitizePastedSearchData(data, this.pasting, this.pasteBuffer);
    this.pasting = pasted.pasting;
    this.pasteBuffer = pasted.buffer;
    handleSearchInput(this.input, pasted.data);
    const bounded = truncateSearchQuery(this.input.getValue(), previous);
    if (bounded !== this.input.getValue())
      this.input.setValue(bounded);
    if (this.input.getValue() === previous)
      return false;
    this.rebuildMatches();
    return true;
  }
  next() {
    if (this.count > 0)
      this.currentIndex = (this.currentIndex + 1) % this.count;
    this.anchorRow = this.currentRow ?? this.anchorRow;
    return this.currentRow;
  }
  previous() {
    if (this.count > 0) {
      this.currentIndex = (this.currentIndex - 1 + this.count) % this.count;
    }
    this.anchorRow = this.currentRow ?? this.anchorRow;
    return this.currentRow;
  }
  render(width) {
    const prefix = "Find: ";
    const status = this.input.getValue() ? ` ${this.current}/${this.count}` : "";
    const inputWidth = Math.max(1, width - visibleWidth4(prefix) - visibleWidth4(status));
    const inputLine = this.input.render(inputWidth)[0] ?? "";
    return truncateToWidth3(`${prefix}${inputLine}${status}`, Math.max(1, width), "");
  }
  highlight(lines, theme) {
    if (!this.active || this.count === 0)
      return [...lines];
    const rangesByRow = /* @__PURE__ */ new Map();
    for (const [matchIndex, match] of this.highlightMatches()) {
      for (const range of match.ranges) {
        const ranges = rangesByRow.get(range.row) ?? [];
        ranges.push({ ...range, current: matchIndex === this.currentIndex });
        rangesByRow.set(range.row, ranges);
      }
    }
    return lines.map((line, row) => styleLine(line, rangesByRow.get(row) ?? [], theme));
  }
  invalidate() {
    this.input.invalidate();
    this.lines = [];
    this.softWrapAfter = [];
    this.ignoreLeadingWhitespace = [];
    this.searchSources = [];
    this.releaseCorpus();
    this.currentIndex = 0;
  }
  dispose() {
    this.close();
    this.parentFocused = false;
    this.syncFocus();
  }
  syncFocus() {
    this.input.focused = this.parentFocused && this.active;
  }
  ensureCorpus() {
    if (this.corpusReady)
      return;
    const corpus = buildCorpus(this.lines, this.softWrapAfter, this.ignoreLeadingWhitespace);
    this.corpus = corpus.text;
    this.cells = corpus.cells;
    this.corpusReady = true;
    this.rebuildMatches();
  }
  releaseCorpus() {
    this.corpus = "";
    this.cells = emptyCorpusCells();
    this.corpusReady = false;
    this.compactMatchOffsets = void 0;
    this.compactMatchGroups = [];
    this.compactMatchGroupIndexes = new Uint32Array();
    this.compactMatchIndexes = new Uint32Array();
  }
  rebuildMatches() {
    if (!this.corpusReady) {
      this.ensureCorpus();
      return;
    }
    this.anchorRow = this.currentRow ?? this.anchorRow;
    const query = normalizeQuery(this.input.getValue());
    this.compactMatchOffsets = void 0;
    this.compactMatchGroups = [];
    this.compactMatchGroupIndexes = new Uint32Array();
    this.compactMatchIndexes = new Uint32Array();
    if (query) {
      const sourceGroups = [];
      const matchingSources = [];
      for (const source of this.searchSources) {
        const sourceCorpus = buildSearchSourceCorpus(source);
        const offsets = findMatchOffsets(sourceCorpus.text, query);
        if (offsets.length > 0) {
          sourceGroups.push({ cells: sourceCorpus.cells, offsets });
          matchingSources.push(source);
        }
      }
      this.compactMatchOffsets = filterMatchOffsets(findMatchOffsets(this.corpus, query), this.corpus, this.cells, buildSearchSourceRanges(matchingSources));
      if (this.compactMatchOffsets.length > 0) {
        this.compactMatchGroups.push({ cells: this.cells, offsets: this.compactMatchOffsets });
      }
      this.compactMatchGroups.push(...sourceGroups);
      const order = mergeCompactMatchGroups(this.compactMatchGroups);
      this.compactMatchGroupIndexes = order.groupIndexes;
      this.compactMatchIndexes = order.matchIndexes;
    }
    this.currentIndex = this.matchIndexAtOrAfter(this.anchorRow);
    this.anchorRow = this.currentRow ?? this.anchorRow;
  }
  matchIndexAtOrAfter(row) {
    let low = 0;
    let high = this.count;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      const middleRow = this.matchAt(middle)?.ranges[0]?.row ?? Number.POSITIVE_INFINITY;
      if (middleRow < row)
        low = middle + 1;
      else
        high = middle;
    }
    return low < this.count ? low : 0;
  }
  currentMatch() {
    return this.matchAt(this.currentIndex);
  }
  matchAt(index) {
    if (index < 0 || index >= this.count)
      return void 0;
    const groupIndex = this.compactMatchGroups.length === 1 ? 0 : this.compactMatchGroupIndexes[index] ?? 0;
    const matchIndex = this.compactMatchGroups.length === 1 ? index : this.compactMatchIndexes[index] ?? 0;
    const group = this.compactMatchGroups[groupIndex];
    if (!group)
      return void 0;
    return materializeMatch(group.cells, group.offsets[matchIndex * 2] ?? 0, group.offsets[matchIndex * 2 + 1] ?? 0);
  }
  highlightMatches() {
    if (this.count > MAX_HIGHLIGHTED_MATCHES) {
      const current = this.currentMatch();
      return current ? [[this.currentIndex, current]] : [];
    }
    const matches = [];
    for (let index = 0; index < this.count; index += 1) {
      const match = this.matchAt(index);
      if (match)
        matches.push([index, match]);
    }
    return matches;
  }
};
function buildCorpus(lines, softWrapAfter, ignoreLeadingWhitespace) {
  let text = "";
  const estimatedCells = lines.reduce((total, line) => total + line.length, 0) + Math.max(0, lines.length - 1);
  const cells = new CorpusCellBuilder(estimatedCells);
  let pendingRow = INVALID_CELL;
  let pendingStart = 0;
  let pendingEnd = 0;
  const setPendingWhitespace = (row, start, end) => {
    if (pendingRow !== INVALID_CELL)
      return;
    pendingRow = row;
    pendingStart = start;
    pendingEnd = end;
  };
  const appendWhitespace = () => {
    if (pendingRow === INVALID_CELL || text.endsWith(" ") || text.length === 0)
      return;
    text += " ";
    cells.push(pendingRow, pendingStart, pendingEnd);
  };
  const clearPendingWhitespace = () => {
    pendingRow = INVALID_CELL;
  };
  for (const [row, line] of lines.entries()) {
    let column = 0;
    let hasContent = false;
    const appendSegment = (segment2, width) => {
      const start = column;
      const end = column + width;
      if (/^\s+$/u.test(segment2)) {
        if (hasContent || !ignoreLeadingWhitespace[row])
          setPendingWhitespace(row, start, end);
      } else {
        appendWhitespace();
        clearPendingWhitespace();
        hasContent = true;
        text += segment2;
        for (let index = 0; index < segment2.length; index += 1)
          cells.push(row, start, end);
      }
      column = end;
    };
    const plain = stripTerminalSequences3(line);
    if (/^[\x20-\x7e]*$/u.test(plain)) {
      let index = 0;
      while (index < plain.length) {
        if (plain[index] === " ") {
          if (hasContent || !ignoreLeadingWhitespace[row]) {
            setPendingWhitespace(row, column, column + 1);
          }
          while (plain[index] === " ") {
            index += 1;
            column += 1;
          }
          continue;
        }
        const start = index;
        while (index < plain.length && plain[index] !== " ")
          index += 1;
        appendWhitespace();
        clearPendingWhitespace();
        hasContent = true;
        const run = plain.slice(start, index);
        text += run;
        for (let offset = 0; offset < run.length; offset += 1) {
          cells.push(row, column + offset, column + offset + 1);
        }
        column += run.length;
      }
    } else {
      for (const { segment: segment2 } of graphemeSegmenter2.segment(plain)) {
        appendSegment(segment2, visibleWidth4(segment2));
      }
    }
    if (!softWrapAfter[row])
      setPendingWhitespace(row, column, column);
  }
  return { text, cells: cells.finish() };
}
function buildSearchSourceCorpus(source) {
  let text = "";
  const estimatedCells = source.reduce((total, segment2) => total + segment2.text.length, 0) + Math.max(0, source.length - 1);
  const cells = new CorpusCellBuilder(estimatedCells);
  let pendingRow = INVALID_CELL;
  let pendingStart = 0;
  let pendingEnd = 0;
  const setPendingWhitespace = (row, start, end) => {
    if (pendingRow !== INVALID_CELL)
      return;
    pendingRow = row;
    pendingStart = start;
    pendingEnd = end;
  };
  const appendWhitespace = () => {
    if (pendingRow === INVALID_CELL || text.endsWith(" ") || text.length === 0)
      return;
    text += " ";
    cells.push(pendingRow, pendingStart, pendingEnd);
  };
  for (const segment2 of source) {
    let column = segment2.column;
    if (segment2.separatorBefore)
      setPendingWhitespace(segment2.row, column, column);
    for (const { segment: grapheme } of graphemeSegmenter2.segment(segment2.text)) {
      const width = visibleWidth4(grapheme);
      const start = column;
      const end = column + width;
      if (/^\s+$/u.test(grapheme))
        setPendingWhitespace(segment2.row, start, end);
      else {
        appendWhitespace();
        pendingRow = INVALID_CELL;
        text += grapheme;
        for (let index = 0; index < grapheme.length; index += 1) {
          cells.push(segment2.row, start, end);
        }
      }
      column = end;
    }
  }
  return { text, cells: cells.finish() };
}
function sanitizePastedSearchData(data, initiallyPasting, initialBuffer) {
  let result = "";
  let offset = 0;
  let pasting = initiallyPasting;
  let buffer = initialBuffer;
  while (offset < data.length) {
    if (pasting) {
      const combined = buffer + data.slice(offset);
      const end = combined.indexOf(PASTE_END);
      if (end < 0) {
        return { data: result, pasting, buffer: appendPasteBuffer(buffer, data.slice(offset)) };
      }
      result += sanitizeSearchQuery(combined.slice(0, end)) + PASTE_END;
      const consumed = Math.max(0, end + PASTE_END.length - buffer.length);
      buffer = "";
      offset += consumed;
      pasting = false;
      continue;
    }
    const start = data.indexOf(PASTE_START, offset);
    if (start < 0) {
      return {
        data: result + sanitizeUnbracketedSearchData(data.slice(offset)),
        pasting,
        buffer
      };
    }
    result += sanitizeUnbracketedSearchData(data.slice(offset, start)) + PASTE_START;
    offset = start + PASTE_START.length;
    pasting = true;
  }
  return { data: result, pasting, buffer };
}
function appendPasteBuffer(buffer, value) {
  const combined = buffer + value;
  if (combined.length <= MAX_PASTE_BUFFER_LENGTH)
    return combined;
  const tailLength = PASTE_END.length - 1;
  return combined.slice(0, MAX_PASTE_BUFFER_LENGTH - tailLength) + combined.slice(-tailLength);
}
function trailingMarkerPrefixLength(value, marker) {
  for (let length = Math.min(value.length, marker.length - 1); length > 0; length -= 1) {
    if (marker.startsWith(value.slice(-length)))
      return length;
  }
  return 0;
}
function sanitizeUnbracketedSearchData(value) {
  const kittyPrintable = decodeKittyPrintable(value);
  if (kittyPrintable !== void 0)
    return sanitizeTerminalDocument(kittyPrintable);
  const hasTerminalControl = Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint >= 127 && codePoint <= 159;
  });
  return hasTerminalControl ? value : sanitizeTerminalDocument(value);
}
function truncateSearchQuery(value, preservedPrefix) {
  if (value.length <= MAX_SEARCH_QUERY_LENGTH)
    return value;
  let end = 0;
  for (const { index, segment: segment2 } of graphemeSegmenter2.segment(value)) {
    const next = index + segment2.length;
    if (next > MAX_SEARCH_QUERY_LENGTH)
      break;
    end = next;
  }
  const truncated = value.slice(0, end);
  if (preservedPrefix !== void 0 && preservedPrefix.length <= MAX_SEARCH_QUERY_LENGTH && value.startsWith(preservedPrefix) && truncated.length < preservedPrefix.length) {
    return preservedPrefix;
  }
  return truncated;
}
function sanitizeSearchQuery(value) {
  return truncateSearchQuery(sanitizeTerminalDocument(value).replace(/\s+/gu, " "));
}
function normalizeQuery(value) {
  return sanitizeSearchQuery(value).trim();
}
function findMatchOffsets(corpus, query) {
  if (query.length > corpus.length)
    return new Uint32Array();
  const offsets = new MatchOffsetBuilder();
  if (/^[\x20-\x7e]+$/u.test(query) && /^[\x20-\x7e]*$/u.test(corpus)) {
    const haystack = corpus.toLowerCase();
    const needle = query.toLowerCase();
    let offset = 0;
    while (offset <= haystack.length - needle.length) {
      const match = haystack.indexOf(needle, offset);
      if (match < 0)
        break;
      offsets.push(match, match + needle.length);
      offset = match + needle.length;
    }
    return offsets.finish();
  }
  const expression = new RegExp(escapeRegExp(query), "giu");
  for (const match of corpus.matchAll(expression)) {
    offsets.push(match.index, match.index + match[0].length);
  }
  return offsets.finish();
}
function buildSearchSourceRanges(sources) {
  const byRow = /* @__PURE__ */ new Map();
  const bySource = sources.map(() => /* @__PURE__ */ new Map());
  for (const [sourceIndex, source] of sources.entries()) {
    for (const segment2 of source) {
      const range = {
        start: segment2.column,
        end: segment2.column + visibleWidth4(segment2.text)
      };
      const rowRanges = byRow.get(segment2.row) ?? [];
      rowRanges.push({ ...range, sourceIndex });
      byRow.set(segment2.row, rowRanges);
      const sourceRowRanges = bySource[sourceIndex]?.get(segment2.row) ?? [];
      sourceRowRanges.push(range);
      bySource[sourceIndex]?.set(segment2.row, sourceRowRanges);
    }
  }
  return { byRow, bySource };
}
function filterMatchOffsets(offsets, corpus, cells, sourceRanges) {
  if (sourceRanges.bySource.length === 0)
    return offsets;
  const retained = new MatchOffsetBuilder();
  for (let index = 0; index < offsets.length; index += 2) {
    const start = offsets[index] ?? 0;
    const end = offsets[index + 1] ?? start;
    const row = cells.rows[start] ?? INVALID_CELL;
    const cellStart = cells.starts[start] ?? 0;
    const cellEnd = cells.ends[start] ?? 0;
    const contained = sourceRanges.byRow.get(row)?.some((range) => cellStart >= range.start && cellEnd <= range.end && matchContainedInSource(corpus, cells, start, end, sourceRanges.bySource[range.sourceIndex]));
    if (!contained)
      retained.push(start, end);
  }
  return retained.finish();
}
function matchContainedInSource(corpus, cells, start, end, sourceRanges) {
  if (!sourceRanges)
    return false;
  let hasVisibleCell = false;
  for (let index = start; index < end; index += 1) {
    const row = cells.rows[index] ?? INVALID_CELL;
    const cellStart = cells.starts[index] ?? 0;
    const cellEnd = cells.ends[index] ?? 0;
    if (row === INVALID_CELL || cellEnd <= cellStart)
      continue;
    hasVisibleCell = true;
    const contained = sourceRanges.get(row)?.some((range) => cellStart >= range.start && cellEnd <= range.end);
    if (!contained && corpus[index] !== " ")
      return false;
  }
  return hasVisibleCell;
}
function mergeCompactMatchGroups(groups) {
  if (groups.length < 2) {
    return { groupIndexes: new Uint32Array(), matchIndexes: new Uint32Array() };
  }
  const total = groups.reduce((count, group) => count + group.offsets.length / 2, 0);
  const groupIndexes = new Uint32Array(total);
  const matchIndexes = new Uint32Array(total);
  const positions = new Uint32Array(groups.length);
  const heap = groups.map((_, groupIndex) => groupIndex);
  const precedes = (leftGroup, rightGroup) => {
    const comparison = compareCompactMatchStarts(groups[leftGroup], positions[leftGroup] ?? 0, groups[rightGroup], positions[rightGroup] ?? 0);
    return comparison < 0 || comparison === 0 && leftGroup < rightGroup;
  };
  const siftDown = (start) => {
    let parent = start;
    while (true) {
      const left = parent * 2 + 1;
      if (left >= heap.length)
        return;
      const right = left + 1;
      const child = right < heap.length && precedes(heap[right] ?? 0, heap[left] ?? 0) ? right : left;
      if (precedes(heap[parent] ?? 0, heap[child] ?? 0))
        return;
      [heap[parent], heap[child]] = [heap[child] ?? 0, heap[parent] ?? 0];
      parent = child;
    }
  };
  for (let index = Math.floor(heap.length / 2) - 1; index >= 0; index -= 1)
    siftDown(index);
  for (let target = 0; target < total; target += 1) {
    const groupIndex = heap[0] ?? 0;
    const matchIndex = positions[groupIndex] ?? 0;
    groupIndexes[target] = groupIndex;
    matchIndexes[target] = matchIndex;
    positions[groupIndex] = matchIndex + 1;
    if (positions[groupIndex] >= (groups[groupIndex]?.offsets.length ?? 0) / 2) {
      heap[0] = heap.at(-1) ?? 0;
      heap.pop();
    }
    if (heap.length > 0)
      siftDown(0);
  }
  return { groupIndexes, matchIndexes };
}
function compareCompactMatchStarts(left, leftIndex, right, rightIndex) {
  const leftOffset = left?.offsets[leftIndex * 2] ?? 0;
  const rightOffset = right?.offsets[rightIndex * 2] ?? 0;
  return (left?.cells.rows[leftOffset] ?? 0) - (right?.cells.rows[rightOffset] ?? 0) || (left?.cells.starts[leftOffset] ?? 0) - (right?.cells.starts[rightOffset] ?? 0);
}
function materializeMatch(cells, start, end) {
  const byRow = /* @__PURE__ */ new Map();
  for (let index = start; index < end; index += 1) {
    const row = cells.rows[index] ?? INVALID_CELL;
    const cellStart = cells.starts[index] ?? 0;
    const cellEnd = cells.ends[index] ?? 0;
    if (row === INVALID_CELL || cellEnd <= cellStart)
      continue;
    const range = byRow.get(row);
    if (range) {
      range.start = Math.min(range.start, cellStart);
      range.end = Math.max(range.end, cellEnd);
    } else
      byRow.set(row, { row, start: cellStart, end: cellEnd });
  }
  return { ranges: [...byRow.values()] };
}
function styleLine(line, ranges, theme) {
  if (ranges.length === 0)
    return line;
  let result = "";
  let column = 0;
  for (const range of [...ranges].sort((left, right) => left.start - right.start)) {
    if (range.start < column)
      continue;
    result += sliceByColumn2(line, column, range.start - column, true);
    let target = sliceByColumn2(line, range.start, range.end - range.start, true);
    target = theme.fg("searchMatchText", target);
    target = theme.bg?.("searchMatchBg", target) ?? target;
    if (range.current)
      target = theme.bold(theme.inverse?.(target) ?? target);
    else
      target = theme.underline?.(target) ?? target;
    result += target;
    column = range.end;
  }
  result += sliceByColumn2(line, column, Math.max(0, visibleWidth4(line) - column), true);
  return result;
}
function sameLines(left, right) {
  return left.length === right.length && left.every((line, index) => line === right[index]);
}
function sameValues(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
function sameSearchSources(left, right) {
  return left.length === right.length && left.every((source, sourceIndex) => source.length === right[sourceIndex]?.length && source.every((segment2, segmentIndex) => {
    const other = right[sourceIndex]?.[segmentIndex];
    return other !== void 0 && segment2.row === other.row && segment2.column === other.column && segment2.text === other.text && segment2.separatorBefore === other.separatorBefore;
  }));
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

// node_modules/@narumitw/pi-tui-kit/dist/components/review.js
import { stripVTControlCharacters as stripVTControlCharacters3 } from "node:util";
import { Key as Key2, matchesKey as matchesKey2, truncateToWidth as truncateToWidth4, wrapTextWithAnsi as wrapTextWithAnsi2 } from "@earendil-works/pi-tui";
var DEFAULT_REVIEW_VIEWPORT_SIZE = 14;
var MIN_FRAMED_ROWS = 5;
function createReviewComponent(options) {
  options = { ...options, keybindings: componentKeybindings(options.tui, options.keybindings) };
  let scrollOffset = 0;
  let lastMaximumScroll = 0;
  let lastViewportSize = reviewViewportSize(options.screen);
  let lastTerminalRows = options.tui.terminal.rows;
  let lastSearchActive = false;
  let disposed = false;
  let focused = false;
  let lastLines = [];
  let lastSoftWrapAfter = [];
  let lastIgnoreLeadingWhitespace = [];
  let lastSearchSources = [];
  let mouseLayout;
  const documentLineCache = createDocumentLineCache(options.theme, Boolean(options.screen.enableSearch));
  const search = options.screen.enableSearch ? new DocumentSearchController() : void 0;
  const searchActivationAvailable = Boolean(search && componentKeyAvailable(options.tui, DOCUMENT_SEARCH_ACTIVATE_KEY) && documentSearchActivationAvailable(options.keybindings, Boolean(options.screen.confirm)));
  const copy = createDocumentCopy({
    ...options,
    includeConfirm: Boolean(options.screen.confirm),
    searchEnabled: searchActivationAvailable,
    document: () => options.screen.copy ? { owner: options.screen, action: options.screen.copy, content: options.screen.content } : void 0
  });
  const finish = (event) => {
    copy.cancel();
    options.onEvent(event);
  };
  const moveTo = (offset) => {
    scrollOffset = Math.max(0, Math.min(offset, lastMaximumScroll));
    options.tui.requestRender();
  };
  const moveToMatch = (row) => {
    if (row === void 0)
      return;
    if (row < scrollOffset)
      moveTo(row);
    else if (row >= scrollOffset + lastViewportSize)
      moveTo(row - lastViewportSize + 1);
  };
  const component = {
    render(width) {
      if (!Number.isFinite(width) || width <= 0) {
        mouseLayout = void 0;
        return [];
      }
      const safeWidth = Math.max(1, Math.floor(width));
      const presentation = documentLineCache.presentation(options.screen.content, options.screen.format, safeWidth);
      const allLines = presentation.lines.some((line) => stripVTControlCharacters3(line).trim().length > 0) ? presentation.lines : [];
      lastLines = allLines.length > 0 ? presentation.searchLines : [];
      lastSoftWrapAfter = allLines.length > 0 ? presentation.softWrapAfter : [];
      lastIgnoreLeadingWhitespace = allLines.length > 0 ? presentation.ignoreLeadingWhitespace : [];
      lastSearchSources = allLines.length > 0 ? presentation.searchSources : [];
      const searchRebuilt = search?.updateLines(lastLines, lastSoftWrapAfter, lastIgnoreLeadingWhitespace, lastSearchSources);
      const searchActive = search?.active ?? false;
      const terminalRows = options.tui.terminal.rows;
      const layoutChanged = Boolean(searchRebuilt) || terminalRows !== lastTerminalRows || searchActive !== lastSearchActive;
      const frameOptions = {
        screen: options.screen,
        allLines: search?.highlight(allLines, options.theme) ?? allLines,
        searchLine: searchActive ? search?.render(safeWidth) : void 0,
        searchEnabled: searchActivationAvailable,
        searchActive,
        copyHint: copy.hint(searchActive),
        width: safeWidth,
        terminalRows,
        maximumViewportSize: options.screen.viewportSize === "adaptive" ? void 0 : Math.min(reviewViewportSize(options.screen), allLines.length),
        scrollOffset,
        theme: options.theme,
        keybindings: options.keybindings
      };
      let frame = renderAdaptiveReviewFrame(frameOptions);
      if ((layoutChanged || frame.viewportSize !== lastViewportSize) && searchActive && search?.currentRow !== void 0) {
        const correctedOffset = keepRowVisible(frame.scrollOffset, search.currentRow, Math.max(1, frame.viewportSize));
        if (correctedOffset !== frame.scrollOffset) {
          frame = renderAdaptiveReviewFrame({ ...frameOptions, scrollOffset: correctedOffset });
        }
      }
      lastTerminalRows = terminalRows;
      lastSearchActive = searchActive;
      scrollOffset = frame.scrollOffset;
      lastMaximumScroll = frame.maximumScroll;
      lastViewportSize = frame.viewportSize;
      mouseLayout = {
        width: safeWidth,
        searchFrameRow: frame.searchFrameRow,
        documentStartRow: frame.documentStartRow,
        documentEndRow: frame.documentEndRow
      };
      return frame.lines;
    },
    invalidate() {
      mouseLayout = void 0;
      documentLineCache.invalidate();
      search?.invalidate();
    },
    handleInput(data) {
      if (disposed)
        return;
      if (search?.active) {
        const routed = search.routeInput(data, (outsidePaste) => {
          if (matchesKey2(outsidePaste, Key2.ctrl("c"))) {
            finish({ kind: "close" });
            return false;
          }
          if (options.keybindings.matches(outsidePaste, "tui.altScreen.searchClose")) {
            search.close();
            options.tui.requestRender();
            return false;
          }
          if (options.keybindings.matches(outsidePaste, "tui.altScreen.searchNext")) {
            moveToMatch(search.next());
            options.tui.requestRender();
          } else if (options.keybindings.matches(outsidePaste, "tui.altScreen.searchPrevious")) {
            moveToMatch(search.previous());
            options.tui.requestRender();
          } else if (options.keybindings.matches(outsidePaste, "tui.select.up")) {
            moveTo(scrollOffset - 1);
          } else if (options.keybindings.matches(outsidePaste, "tui.select.down")) {
            moveTo(scrollOffset + 1);
          } else if (options.keybindings.matches(outsidePaste, "tui.select.pageUp")) {
            moveTo(scrollOffset - lastViewportSize);
          } else if (options.keybindings.matches(outsidePaste, "tui.select.pageDown")) {
            moveTo(scrollOffset + lastViewportSize);
          } else {
            if (search.handleInput(outsidePaste))
              moveToMatch(search.currentRow);
            options.tui.requestRender();
          }
          return true;
        }, (outsidePaste) => matchesKey2(outsidePaste, Key2.ctrl("c")) || documentSearchActionMatches(options.keybindings, outsidePaste));
        if (routed.changed && !routed.stopped) {
          moveToMatch(search.currentRow);
          options.tui.requestRender();
        }
        return;
      }
      if (matchesKey2(data, Key2.ctrl("c")))
        finish({ kind: "close" });
      else if (options.keybindings.matches(data, "tui.select.cancel")) {
        finish({ kind: options.screen.hint ?? "back" });
      } else if (options.keybindings.matches(data, "tui.select.up")) {
        moveTo(scrollOffset - 1);
      } else if (options.keybindings.matches(data, "tui.select.down")) {
        moveTo(scrollOffset + 1);
      } else if (options.keybindings.matches(data, "tui.select.pageUp")) {
        moveTo(scrollOffset - lastViewportSize);
      } else if (options.keybindings.matches(data, "tui.select.pageDown")) {
        moveTo(scrollOffset + lastViewportSize);
      } else if (matchesKey2(data, Key2.home))
        moveTo(0);
      else if (matchesKey2(data, Key2.end))
        moveTo(lastMaximumScroll);
      else if (options.screen.confirm && options.keybindings.matches(data, "tui.select.confirm")) {
        finish({ kind: "activate", itemId: options.screen.confirm.id });
      } else if (search && searchActivationAvailable && matchesKey2(data, DOCUMENT_SEARCH_ACTIVATE_KEY)) {
        search.activate(lastLines, lastSoftWrapAfter, lastIgnoreLeadingWhitespace, lastSearchSources, scrollOffset);
        options.tui.requestRender();
      } else
        copy.handleInput(data);
    },
    handleMouse(event) {
      if (disposed || !mouseLayout || event.width !== mouseLayout.width)
        return void 0;
      if (search?.active && event.y === mouseLayout.searchFrameRow) {
        const inputWidth = Math.max(1, mouseLayout.width - 6);
        if (event.x < 6 || event.x >= 6 + inputWidth)
          return void 0;
        return search.input.handleMouse({ ...event, x: event.x - 6, y: 0, width: inputWidth, height: 1 });
      }
      return routeDocumentWheel(event);
    },
    waitForPending: () => copy.waitForPending(),
    dispose() {
      if (disposed)
        return;
      disposed = true;
      copy.dispose();
      mouseLayout = void 0;
      search?.dispose();
      options.onDispose?.();
    }
  };
  if (search) {
    Object.defineProperty(component, "focused", {
      get: () => focused,
      set: (value) => {
        focused = value;
        search.focused = value;
      },
      enumerable: true
    });
  }
  function routeDocumentWheel(event) {
    if (!mouseLayout || event.type !== "wheel" || !event.wheelDelta || event.y < mouseLayout.documentStartRow || event.y >= mouseLayout.documentEndRow) {
      return void 0;
    }
    const previous = scrollOffset;
    moveTo(scrollOffset + (event.wheelDelta < 0 ? -1 : 1));
    return { handled: true, render: previous !== scrollOffset };
  }
  return component;
}
function renderAdaptiveReviewFrame(options) {
  const totalRows = componentRows(options.terminalRows);
  const framed = totalRows >= MIN_FRAMED_ROWS;
  const availableRows = framed ? totalRows - 2 : totalRows;
  const searchRows = options.searchLine === void 0 ? 0 : 1;
  const documentRows = Math.max(0, availableRows - searchRows);
  const destination = options.screen.hint ?? "back";
  const confirmAction = options.screen.confirm ? safeMenuText(options.screen.confirm.label) : "";
  const fullHeader = [
    ...wrapTextWithAnsi2(options.theme.fg("accent", options.theme.bold(safeMenuText(options.screen.title))), options.width),
    ...(options.screen.lines ?? []).flatMap((line) => wrapTextWithAnsi2(options.theme.fg("muted", safeMenuText(line)), options.width))
  ].map((line) => truncateToWidth4(line, options.width, ""));
  const hintText = reviewHint(options.keybindings, destination, confirmAction, options.searchEnabled, options.searchActive, options.copyHint);
  const fullHint = wrapTextWithAnsi2(options.theme.fg("dim", hintText), options.width).map((line) => truncateToWidth4(line, options.width, ""));
  const criticalHint = options.theme.fg("dim", compactReviewHint(options.keybindings, destination, confirmAction, options.width, options.searchEnabled, options.searchActive, options.copyHint));
  let chrome = options.allLines.length === 0 ? allocateEmptyReviewChrome(documentRows, fullHeader, fullHint, criticalHint) : allocateAdaptiveReviewChrome(documentRows, fullHeader, fullHint, criticalHint, false, options.maximumViewportSize);
  if (documentRows >= 4 && options.allLines.length > chrome.viewportSize) {
    chrome = allocateAdaptiveReviewChrome(documentRows, fullHeader, fullHint, criticalHint, true, options.maximumViewportSize);
  }
  const maximumScroll = Math.max(0, options.allLines.length - chrome.viewportSize);
  const scrollOffset = Math.max(0, Math.min(options.scrollOffset, maximumScroll));
  const visible = options.allLines.slice(scrollOffset, scrollOffset + chrome.viewportSize);
  const first = options.allLines.length === 0 ? 0 : scrollOffset + 1;
  const last = Math.min(options.allLines.length, scrollOffset + chrome.viewportSize);
  const position = chrome.showPosition ? [options.theme.fg("dim", `${first}-${last}/${options.allLines.length}`)] : [];
  const contentLines = [
    ...chrome.header,
    ...options.searchLine === void 0 ? [] : [options.searchLine],
    ...chrome.separator ? [""] : [],
    ...visible,
    ...position,
    ...chrome.hint
  ].map((line) => truncateToWidth4(line, options.width, ""));
  const lines = framed ? [
    renderHorizontalRule(options.width, options.theme),
    ...contentLines,
    renderHorizontalRule(options.width, options.theme)
  ] : contentLines;
  const frameOffset = framed ? 1 : 0;
  const searchFrameRow = options.searchLine === void 0 ? void 0 : frameOffset + chrome.header.length;
  const documentStartRow = frameOffset + chrome.header.length + searchRows + Number(chrome.separator);
  return {
    lines,
    scrollOffset,
    maximumScroll,
    viewportSize: chrome.viewportSize,
    searchFrameRow,
    documentStartRow,
    documentEndRow: documentStartRow + visible.length
  };
}
function allocateEmptyReviewChrome(availableRows, fullHeader, fullHint, criticalHint) {
  if (availableRows <= 0) {
    return { header: [], separator: false, hint: [], showPosition: false, viewportSize: 0 };
  }
  const hint = fullHint.length > 0 && fullHint.length < availableRows ? [...fullHint] : [criticalHint];
  const header = fullHeader.slice(0, Math.max(0, availableRows - hint.length));
  return { header, separator: false, hint, showPosition: false, viewportSize: 0 };
}
function allocateAdaptiveReviewChrome(availableRows, fullHeader, fullHint, criticalHint, showPosition, maximumViewportSize) {
  if (availableRows <= 0) {
    return { header: [], separator: false, hint: [], showPosition: false, viewportSize: 0 };
  }
  if (availableRows === 1) {
    return { header: [], separator: false, hint: [], showPosition: false, viewportSize: 1 };
  }
  const compactHeader = [fullHeader[0] ?? ""];
  if (availableRows === 2) {
    return {
      header: [],
      separator: false,
      hint: [criticalHint],
      showPosition: false,
      viewportSize: 1
    };
  }
  if (availableRows === 3) {
    return {
      header: compactHeader,
      separator: false,
      hint: [criticalHint],
      showPosition: false,
      viewportSize: 1
    };
  }
  let remainingRows = availableRows - 3 - Number(showPosition);
  const reservedViewportRows = Math.min(remainingRows, Math.max(0, (maximumViewportSize ?? 1) - 1));
  remainingRows -= reservedViewportRows;
  const extraHeaderCount = Math.min(remainingRows, Math.max(0, fullHeader.length - 1));
  const header = [...compactHeader, ...fullHeader.slice(1, 1 + extraHeaderCount)];
  remainingRows -= extraHeaderCount;
  let hint = [criticalHint];
  const fullHintExtraRows = Math.max(0, fullHint.length - 1);
  if (remainingRows > 0 && fullHint.length > 0 && fullHintExtraRows <= remainingRows) {
    hint = [...fullHint];
    remainingRows -= fullHintExtraRows;
  }
  const separator = remainingRows > 0;
  if (separator)
    remainingRows -= 1;
  return {
    header,
    separator,
    hint,
    showPosition,
    viewportSize: Math.min(1 + reservedViewportRows + remainingRows, maximumViewportSize === void 0 ? Number.POSITIVE_INFINITY : maximumViewportSize)
  };
}
function reviewHint(keybindings, destination, confirmAction, searchEnabled, searchActive, copyHint) {
  if (searchActive) {
    const next = reviewBindingText(keybindings, "tui.altScreen.searchNext");
    const previous = reviewBindingText(keybindings, "tui.altScreen.searchPrevious");
    const close = reviewBindingText(keybindings, "tui.altScreen.searchClose");
    return [
      ...next ? [`${next} next`] : [],
      ...previous ? [`${previous} previous`] : [],
      ...close ? [`${close} close search`] : [],
      "ctrl+c close"
    ].join(" \xB7 ");
  }
  const base = menuHint(keybindings, destination, confirmAction);
  const search = searchEnabled ? DOCUMENT_SEARCH_ACTIVATE_KEY : "";
  return [base, ...search ? [`${search} search`] : [], copyHint].filter(Boolean).join(" \xB7 ");
}
function compactReviewHint(keybindings, destination, confirmAction, width, searchEnabled, searchActive, copyHint) {
  if (searchActive) {
    const close = reviewBindingText(keybindings, "tui.altScreen.searchClose");
    const next = reviewBindingText(keybindings, "tui.altScreen.searchNext");
    return fitCompactHintSegments([...close ? [`${close} close search`] : [], ...next ? [`${next} next`] : [], "ctrl+c close"], width);
  }
  const confirm = reviewBindingText(keybindings, "tui.select.confirm");
  const cancel = reviewBindingText(keybindings, "tui.select.cancel", "ctrl+c");
  const up = reviewBindingText(keybindings, "tui.select.up");
  const down = reviewBindingText(keybindings, "tui.select.down");
  const search = searchEnabled ? DOCUMENT_SEARCH_ACTIVATE_KEY : "";
  return fitCompactHintSegments([
    ...cancel ? [`${cancel} ${destination}`] : [],
    ...destination === "back" || !cancel ? ["ctrl+c close"] : [],
    ...confirm && confirmAction ? [`${confirm} ${confirmAction}`] : [],
    ...up || down ? [`${[up, down].filter(Boolean).join("/")} navigate`] : [],
    ...search ? [`${search} search`] : [],
    ...copyHint ? [copyHint] : []
  ], width);
}
function keepRowVisible(offset, row, viewportRows) {
  if (row < offset)
    return row;
  if (row >= offset + viewportRows)
    return row - viewportRows + 1;
  return offset;
}
function reviewBindingText(keybindings, binding, excluded) {
  return keybindings.getKeys(binding).filter((key) => key !== excluded).map((key) => {
    if (key === "up")
      return "\u2191";
    if (key === "down")
      return "\u2193";
    if (key === "escape")
      return "esc";
    return safeMenuText(key);
  }).filter(Boolean).join("/");
}
function reviewDialogPages(screen) {
  return documentDialogPages(screen.content, RPC_DOCUMENT_LINE_WIDTH, reviewDialogPageSize(screen));
}
function reviewViewportSize(screen) {
  return typeof screen.viewportSize === "number" ? screen.viewportSize : DEFAULT_REVIEW_VIEWPORT_SIZE;
}
function reviewDialogPageSize(screen) {
  return typeof screen.viewportSize === "number" ? Math.min(screen.viewportSize, RPC_DOCUMENT_PAGE_SIZE) : RPC_DOCUMENT_PAGE_SIZE;
}

// node_modules/@narumitw/pi-tui-kit/dist/components/browse.js
var MAX_CONTEXT_ROWS = 2;
var MIN_FRAMED_ROWS2 = 5;
function createBrowseComponent(options) {
  const searchInput = new Input2();
  const detailSearch = options.screen.enableDetailSearch ? new DocumentSearchController() : void 0;
  const detailSearchActivationAvailable = Boolean(detailSearch && componentKeyAvailable(options.tui, DOCUMENT_SEARCH_ACTIVATE_KEY, true) && documentSearchActivationAvailable(options.keybindings, false));
  const allItems = options.screen.items.map((item) => ({
    item,
    label: safeBrowseText(item.label),
    statusText: safeBrowseText(item.statusText ?? ""),
    description: safeBrowseText(item.description ?? ""),
    searchText: safeBrowseText(item.searchText ?? "")
  }));
  let filteredItems = [...allItems];
  let selectedIndex = Math.max(0, filteredItems.findIndex(({ item }) => item.id === options.selectedItemId));
  let restoreItemId;
  let listViewportRows = 1;
  let searchInputVisible = true;
  let detailScrollOffset = 0;
  let detailViewportRows = 1;
  let detailMaximumScroll = 0;
  let lastDetailLines = [];
  let lastDetailSoftWrapAfter = [];
  let lastDetailIgnoreLeadingWhitespace = [];
  let lastDetailSearchSources = [];
  let view = "list";
  let focused = false;
  let disposed = false;
  let mousePressedIndex;
  let mouseLayout;
  const detailLineCache = createDocumentLineCache(options.theme, Boolean(options.screen.enableDetailSearch));
  const selected = () => filteredItems[selectedIndex];
  const copy = createDocumentCopy({
    ...options,
    includeConfirm: false,
    searchEnabled: detailSearchActivationAvailable,
    document: () => {
      const item = selected()?.item;
      const document = view === "detail" ? item?.detailDocument : void 0;
      return document?.copy ? { owner: document, action: document.copy, content: document.content, itemId: item?.id } : void 0;
    }
  });
  const finish = (event) => {
    copy.cancel();
    options.onEvent(event);
  };
  const syncFocus = () => {
    searchInput.focused = focused && view === "list" && searchInputVisible;
    if (detailSearch)
      detailSearch.focused = focused && view === "detail";
  };
  const moveToDetailMatch = (row) => {
    if (row === void 0)
      return;
    if (row < detailScrollOffset)
      detailScrollOffset = row;
    else if (row >= detailScrollOffset + detailViewportRows) {
      detailScrollOffset = row - detailViewportRows + 1;
    }
  };
  const setSelectedIndex = (index, wrap, rememberUserSelection) => {
    if (filteredItems.length === 0) {
      selectedIndex = 0;
      return;
    }
    selectedIndex = wrap ? (index + filteredItems.length) % filteredItems.length : Math.max(0, Math.min(index, filteredItems.length - 1));
    if (rememberUserSelection)
      restoreItemId = void 0;
    const itemId = selected()?.item.id;
    if (itemId)
      options.onSelectionChange?.(itemId);
  };
  const move = (delta) => setSelectedIndex(selectedIndex + delta, true, true);
  const page = (delta) => setSelectedIndex(selectedIndex + delta * Math.max(1, listViewportRows), false, true);
  const applyFilter = () => {
    mousePressedIndex = void 0;
    const previouslySelectedId = selected()?.item.id;
    filteredItems = fuzzyFilter(allItems, searchInput.getValue(), (candidate) => [candidate.label, candidate.statusText, candidate.description, candidate.searchText].filter(Boolean).join(" "));
    if (filteredItems.length === 0) {
      if (previouslySelectedId)
        restoreItemId ??= previouslySelectedId;
      selectedIndex = 0;
      return;
    }
    const previousIndex = filteredItems.findIndex((candidate) => candidate.item.id === previouslySelectedId);
    if (previousIndex < 0 && previouslySelectedId)
      restoreItemId ??= previouslySelectedId;
    const restoreIndex = filteredItems.findIndex((candidate) => candidate.item.id === restoreItemId);
    const nextIndex = restoreIndex >= 0 ? restoreIndex : Math.max(previousIndex, 0);
    if (restoreIndex >= 0)
      restoreItemId = void 0;
    setSelectedIndex(nextIndex, false, false);
  };
  const openDetail = () => {
    if (!selected())
      return;
    copy.cancel();
    view = "detail";
    detailScrollOffset = 0;
    lastDetailLines = [];
    lastDetailSoftWrapAfter = [];
    lastDetailIgnoreLeadingWhitespace = [];
    lastDetailSearchSources = [];
    detailSearch?.close();
    mousePressedIndex = void 0;
    syncFocus();
  };
  const component = {
    get focused() {
      return focused;
    },
    set focused(value) {
      focused = value;
      syncFocus();
    },
    render(width) {
      const safeWidth = Math.max(1, width);
      const availableRows = componentRows(options.tui.terminal.rows);
      const contentRows = framedContentRows(availableRows);
      if (view === "detail") {
        const selectedItem = selected()?.item;
        const presentation = selectedItem?.detailDocument ? detailLineCache.presentation(selectedItem.detailDocument.content, selectedItem.detailDocument.format, safeWidth) : legacyDetailPresentation(selectedItem, safeWidth);
        const content = presentation.lines;
        lastDetailLines = presentation.searchLines;
        lastDetailSoftWrapAfter = presentation.softWrapAfter;
        lastDetailIgnoreLeadingWhitespace = presentation.ignoreLeadingWhitespace;
        lastDetailSearchSources = presentation.searchSources;
        const searchRebuilt = detailSearch?.updateLines(lastDetailLines, lastDetailSoftWrapAfter, lastDetailIgnoreLeadingWhitespace, lastDetailSearchSources);
        const displayedContent = detailSearch?.highlight(content, options.theme) ?? content;
        const layout2 = detailLayout(contentRows, content.length, detailSearch?.active ?? false);
        const viewportChanged = layout2.contentRows !== detailViewportRows;
        detailViewportRows = layout2.contentRows;
        detailMaximumScroll = Math.max(0, content.length - layout2.contentRows);
        if ((searchRebuilt || viewportChanged) && detailSearch?.active && detailSearch.currentRow !== void 0) {
          detailScrollOffset = keepRowVisible2(detailScrollOffset, detailSearch.currentRow, Math.max(1, detailViewportRows));
        }
        detailScrollOffset = clamp(detailScrollOffset, 0, detailMaximumScroll);
        const lines2 = [
          ...layout2.titleRows ? [options.theme.fg("accent", options.theme.bold(selected()?.label || "Details"))] : [],
          ...layout2.searchRows && detailSearch ? [detailSearch.render(safeWidth)] : [],
          ...displayedContent.slice(detailScrollOffset, detailScrollOffset + layout2.contentRows),
          ...layout2.positionRows ? [options.theme.fg("dim", positionText(detailScrollOffset, layout2.contentRows, content.length))] : [],
          ...layout2.hintRows ? [
            options.theme.fg("dim", [
              detailHint(options.keybindings, detailSearchActivationAvailable, detailSearch?.active ?? false),
              copy.hint(detailSearch?.active ?? false)
            ].filter(Boolean).join(" \xB7 "))
          ] : []
        ];
        const frameOffset2 = availableRows >= MIN_FRAMED_ROWS2 ? 1 : 0;
        const documentStartRow = frameOffset2 + layout2.titleRows + layout2.searchRows;
        mouseLayout = {
          view,
          width: safeWidth,
          inputFrameRow: layout2.searchRows ? frameOffset2 + layout2.titleRows : void 0,
          documentStartRow,
          documentEndRow: documentStartRow + layout2.contentRows
        };
        return boundedFrame(lines2, safeWidth, availableRows, options.theme);
      }
      const context = (options.screen.lines ?? []).flatMap((line) => wrapTextWithAnsi3(options.theme.fg("muted", safeBrowseText(line)), safeWidth));
      const layout = listLayout(contentRows, context.length, filteredItems.length, options.screen.viewportSize);
      listViewportRows = layout.itemRows;
      searchInputVisible = layout.searchRows > 0;
      syncFocus();
      const viewportStart = listWindowStart(selectedIndex, filteredItems.length, layout.itemRows);
      const rows = listRows(filteredItems, selectedIndex, viewportStart, layout.itemRows, safeWidth, options);
      const description = selected()?.description;
      const lines = [
        ...layout.titleRows ? [options.theme.fg("accent", options.theme.bold(safeBrowseText(options.screen.title)))] : [],
        ...context.slice(0, layout.contextRows),
        ...layout.searchRows ? renderSearchInput(searchInput, safeWidth) : [],
        ...rows,
        ...layout.positionRows ? [options.theme.fg("dim", positionText(viewportStart, layout.itemRows, filteredItems.length))] : [],
        ...layout.descriptionRows && description ? [options.theme.fg("muted", description)] : [],
        ...layout.hintRows ? [options.theme.fg("dim", browseHint(options.keybindings, options.screen.hint ?? "back"))] : []
      ];
      const frameOffset = availableRows >= MIN_FRAMED_ROWS2 ? 1 : 0;
      const itemStartRow = frameOffset + layout.titleRows + layout.contextRows + layout.searchRows;
      mouseLayout = {
        view,
        width: safeWidth,
        inputFrameRow: layout.searchRows ? frameOffset + layout.titleRows + layout.contextRows : void 0,
        itemByFrameRow: new Map(Array.from({ length: Math.min(layout.itemRows, filteredItems.length) }, (_, offset) => [
          itemStartRow + offset,
          viewportStart + offset
        ]))
      };
      return boundedFrame(lines, safeWidth, availableRows, options.theme);
    },
    invalidate() {
      mouseLayout = void 0;
      detailLineCache.invalidate();
      searchInput.invalidate();
      detailSearch?.invalidate();
    },
    handleInput(data) {
      if (disposed)
        return;
      mousePressedIndex = void 0;
      if (view === "detail" && detailSearch?.active) {
        const routed = detailSearch.routeInput(data, (outsidePaste) => {
          if (matchesKey3(outsidePaste, Key3.ctrl("c"))) {
            finish({ kind: "close" });
            return false;
          }
          if (options.keybindings.matches(outsidePaste, "tui.altScreen.searchClose")) {
            detailSearch.close();
            return false;
          }
          if (options.keybindings.matches(outsidePaste, "tui.altScreen.searchNext")) {
            moveToDetailMatch(detailSearch.next());
          } else if (options.keybindings.matches(outsidePaste, "tui.altScreen.searchPrevious")) {
            moveToDetailMatch(detailSearch.previous());
          } else if (options.keybindings.matches(outsidePaste, "tui.select.up")) {
            detailScrollOffset = clamp(detailScrollOffset - 1, 0, detailMaximumScroll);
          } else if (options.keybindings.matches(outsidePaste, "tui.select.down")) {
            detailScrollOffset = clamp(detailScrollOffset + 1, 0, detailMaximumScroll);
          } else if (options.keybindings.matches(outsidePaste, "tui.select.pageUp")) {
            detailScrollOffset = clamp(detailScrollOffset - detailViewportRows, 0, detailMaximumScroll);
          } else if (options.keybindings.matches(outsidePaste, "tui.select.pageDown")) {
            detailScrollOffset = clamp(detailScrollOffset + detailViewportRows, 0, detailMaximumScroll);
          } else if (detailSearch.handleInput(outsidePaste)) {
            moveToDetailMatch(detailSearch.currentRow);
          }
          return true;
        }, (outsidePaste) => matchesKey3(outsidePaste, Key3.ctrl("c")) || documentSearchActionMatches(options.keybindings, outsidePaste));
        if (routed.changed && !routed.stopped)
          moveToDetailMatch(detailSearch.currentRow);
        options.tui.requestRender();
        return;
      }
      if (matchesKey3(data, Key3.ctrl("c"))) {
        finish({ kind: "close" });
      } else if (options.keybindings.matches(data, "tui.select.cancel")) {
        if (view === "detail") {
          copy.cancel();
          view = "list";
          detailScrollOffset = 0;
          lastDetailLines = [];
          lastDetailSoftWrapAfter = [];
          lastDetailIgnoreLeadingWhitespace = [];
          lastDetailSearchSources = [];
          detailSearch?.close();
          syncFocus();
        } else
          finish({ kind: options.screen.hint ?? "back" });
      } else if (view === "detail") {
        if (options.keybindings.matches(data, "tui.select.up")) {
          detailScrollOffset = clamp(detailScrollOffset - 1, 0, detailMaximumScroll);
        } else if (options.keybindings.matches(data, "tui.select.down")) {
          detailScrollOffset = clamp(detailScrollOffset + 1, 0, detailMaximumScroll);
        } else if (options.keybindings.matches(data, "tui.select.pageUp")) {
          detailScrollOffset = clamp(detailScrollOffset - detailViewportRows, 0, detailMaximumScroll);
        } else if (options.keybindings.matches(data, "tui.select.pageDown")) {
          detailScrollOffset = clamp(detailScrollOffset + detailViewportRows, 0, detailMaximumScroll);
        } else if (matchesKey3(data, Key3.home))
          detailScrollOffset = 0;
        else if (matchesKey3(data, Key3.end))
          detailScrollOffset = detailMaximumScroll;
        else if (detailSearch && detailSearchActivationAvailable && matchesKey3(data, DOCUMENT_SEARCH_ACTIVATE_KEY)) {
          detailSearch.activate(lastDetailLines, lastDetailSoftWrapAfter, lastDetailIgnoreLeadingWhitespace, lastDetailSearchSources, detailScrollOffset);
        } else
          copy.handleInput(data);
      } else if (options.keybindings.matches(data, "tui.select.up"))
        move(-1);
      else if (options.keybindings.matches(data, "tui.select.down"))
        move(1);
      else if (options.keybindings.matches(data, "tui.select.pageUp"))
        page(-1);
      else if (options.keybindings.matches(data, "tui.select.pageDown"))
        page(1);
      else if (matchesKey3(data, Key3.home))
        setSelectedIndex(0, false, true);
      else if (matchesKey3(data, Key3.end)) {
        setSelectedIndex(filteredItems.length - 1, false, true);
      } else if (options.keybindings.matches(data, "tui.select.confirm")) {
        openDetail();
      } else {
        handleSearchInput(searchInput, data);
        applyFilter();
      }
      options.tui.requestRender();
    },
    handleMouse(event) {
      if (disposed || !mouseLayout || event.width !== mouseLayout.width)
        return void 0;
      if (mouseLayout.view === "detail")
        return handleDetailMouse(event);
      return handleListMouse(event);
    },
    waitForPending: () => copy.waitForPending(),
    dispose() {
      if (disposed)
        return;
      disposed = true;
      copy.dispose();
      mousePressedIndex = void 0;
      mouseLayout = void 0;
      searchInput.focused = false;
      detailSearch?.dispose();
      options.onDispose?.();
    }
  };
  function handleListMouse(event) {
    if (mouseLayout?.view !== "list")
      return void 0;
    if (event.y === mouseLayout.inputFrameRow) {
      const inputWidth = Math.max(1, mouseLayout.width - 8);
      if (event.x < 8 || event.x >= 8 + inputWidth)
        return void 0;
      return searchInput.handleMouse({ ...event, x: event.x - 8, y: 0, width: inputWidth, height: 1 });
    }
    const mappedIndex = mouseLayout.itemByFrameRow?.get(event.y);
    if (mappedIndex === void 0)
      return void 0;
    const itemIndex = event.type === "click" ? mousePressedIndex ?? mappedIndex : mappedIndex;
    if (itemIndex < 0 || itemIndex >= filteredItems.length)
      return void 0;
    if (event.type === "wheel" && event.wheelDelta) {
      const next = Math.max(0, Math.min(filteredItems.length - 1, selectedIndex + (event.wheelDelta < 0 ? -1 : 1)));
      const changed = next !== selectedIndex;
      if (changed)
        setSelectedIndex(next, false, true);
      return { handled: true, render: changed };
    }
    if (event.type === "move")
      return { handled: true };
    if (event.button !== "left")
      return void 0;
    if (event.type === "press") {
      mousePressedIndex = itemIndex;
      const changed = itemIndex !== selectedIndex;
      if (changed)
        setSelectedIndex(itemIndex, false, true);
      return { handled: true, focus: true, render: changed };
    }
    if (event.type === "click") {
      mousePressedIndex = void 0;
      if (itemIndex !== selectedIndex)
        setSelectedIndex(itemIndex, false, true);
      openDetail();
      options.tui.requestRender();
      return { handled: true, render: true };
    }
    return void 0;
  }
  function handleDetailMouse(event) {
    if (mouseLayout?.view !== "detail")
      return void 0;
    if (detailSearch?.active && event.y === mouseLayout.inputFrameRow) {
      const inputWidth = Math.max(1, mouseLayout.width - 6);
      if (event.x < 6 || event.x >= 6 + inputWidth)
        return void 0;
      return detailSearch.input.handleMouse({ ...event, x: event.x - 6, y: 0, width: inputWidth, height: 1 });
    }
    if (event.type !== "wheel" || !event.wheelDelta || mouseLayout.documentStartRow === void 0 || mouseLayout.documentEndRow === void 0 || event.y < mouseLayout.documentStartRow || event.y >= mouseLayout.documentEndRow) {
      return void 0;
    }
    const previous = detailScrollOffset;
    detailScrollOffset = clamp(detailScrollOffset + (event.wheelDelta < 0 ? -1 : 1), 0, detailMaximumScroll);
    const changed = previous !== detailScrollOffset;
    if (changed)
      options.tui.requestRender();
    return { handled: true, render: changed };
  }
  return component;
}
function listRows(items, selectedIndex, viewportStart, viewportRows, width, options) {
  if (options.screen.items.length === 0) {
    return [options.theme.fg("dim", "  No items available")];
  }
  if (items.length === 0)
    return [options.theme.fg("dim", "  No matching items; edit search")];
  return items.slice(viewportStart, viewportStart + viewportRows).map((candidate, offset) => {
    const index = viewportStart + offset;
    const prefix = index === selectedIndex ? "\u203A " : "  ";
    const contentWidth = Math.max(0, width - visibleWidth5(prefix));
    const reservedLabelWidth = Math.min(visibleWidth5(candidate.label), Math.ceil(contentWidth / 2));
    const statusWidth = Math.max(0, contentWidth - reservedLabelWidth - 4);
    const suffix = candidate.statusText && statusWidth > 0 ? `  [${truncateToWidth5(candidate.statusText, statusWidth, "\u2026")}]` : "";
    const labelWidth = Math.max(0, contentWidth - visibleWidth5(suffix));
    const label = truncateToWidth5(candidate.label, labelWidth, "\u2026");
    const line = truncateToWidth5(`${prefix}${label}${suffix}`, width, "");
    return index === selectedIndex ? options.theme.fg("accent", line) : line;
  });
}
function legacyDetailPresentation(item, width) {
  const sourceLines = item ? browseDetailSource(item) : ["No matching item."];
  const lines = [];
  const softWrapAfter = [];
  for (const source of sourceLines) {
    const wrapped = source ? wrapTextWithAnsi3(source, width) : [""];
    let sourceOffset = 0;
    for (const [index, line] of wrapped.entries()) {
      lines.push(line);
      const plain = stripVTControlCharacters4(line).trimEnd();
      const found = source.indexOf(plain, sourceOffset);
      if (found >= 0)
        sourceOffset = found + plain.length;
      softWrapAfter.push(index < wrapped.length - 1 && sourceOffset < source.length && !/\s/u.test(source[sourceOffset] ?? ""));
    }
  }
  return {
    lines,
    searchLines: lines,
    softWrapAfter,
    ignoreLeadingWhitespace: lines.map(() => false),
    searchSources: []
  };
}
function browseDialogLabel(item) {
  const label = safeBrowseText(item.label);
  const status = safeBrowseText(item.statusText ?? "");
  return status ? `${label} [${status}]` : label;
}
function browseDialogPages(item) {
  if (item.detailDocument) {
    return documentDialogPages(item.detailDocument.content, RPC_DOCUMENT_LINE_WIDTH, RPC_DOCUMENT_PAGE_SIZE);
  }
  return reviewDialogPages({
    kind: "review",
    title: safeBrowseText(item.label),
    content: browseDetailSource(item).join("\n"),
    viewportSize: "adaptive"
  });
}
function browseDetailSource(item) {
  const lines = [
    ...item.statusText ? [`Status: ${safeBrowseText(item.statusText)}`] : [],
    ...item.description ? [safeBrowseText(item.description)] : [],
    ...(item.details ?? []).map(safeBrowseText)
  ];
  return lines.length > 0 ? lines : ["No details available."];
}
function renderSearchInput(input, width) {
  const prefix = "Search: ";
  const inputWidth = Math.max(1, width - visibleWidth5(prefix));
  return input.render(inputWidth).map((line) => truncateToWidth5(`${prefix}${line}`, width, ""));
}
function listLayout(availableRows, contextLength, itemCount, requestedViewport) {
  if (availableRows === 1) {
    return {
      titleRows: 0,
      contextRows: 0,
      searchRows: 0,
      itemRows: 1,
      positionRows: 0,
      descriptionRows: 0,
      hintRows: 0
    };
  }
  const titleRows = availableRows >= 4 ? 1 : 0;
  const searchRows = availableRows >= 3 ? 1 : 0;
  const hintRows = availableRows >= 3 ? 1 : 0;
  const descriptionRows = availableRows >= 7 ? 1 : 0;
  const baseRows = titleRows + searchRows + hintRows + descriptionRows;
  const contextRows = availableRows >= 8 ? Math.min(contextLength, MAX_CONTEXT_ROWS, Math.max(0, availableRows - baseRows - 1)) : 0;
  const itemBudget = Math.max(1, availableRows - baseRows - contextRows);
  let itemRows = typeof requestedViewport === "number" ? Math.min(itemBudget, requestedViewport) : itemBudget;
  let positionRows = 0;
  if (itemCount > itemRows) {
    if (itemBudget > itemRows)
      positionRows = 1;
    else if (itemRows >= 2) {
      positionRows = 1;
      itemRows -= 1;
    }
  }
  return {
    titleRows,
    contextRows,
    searchRows,
    itemRows,
    positionRows,
    descriptionRows,
    hintRows
  };
}
function detailLayout(availableRows, contentLength, searchActive) {
  if (availableRows === 1) {
    return {
      titleRows: 0,
      searchRows: searchActive ? 1 : 0,
      contentRows: searchActive ? 0 : 1,
      positionRows: 0,
      hintRows: 0
    };
  }
  const searchRows = searchActive ? 1 : 0;
  const titleRows = availableRows >= 4 + searchRows ? 1 : 0;
  const hintRows = availableRows >= 3 + searchRows ? 1 : 0;
  let contentRows = Math.max(1, availableRows - titleRows - hintRows - searchRows);
  const positionRows = contentLength > contentRows && contentRows >= 2 ? 1 : 0;
  contentRows -= positionRows;
  return { titleRows, searchRows, contentRows, positionRows, hintRows };
}
function listWindowStart(selectedIndex, itemCount, viewportSize) {
  if (itemCount <= viewportSize)
    return 0;
  return Math.max(0, Math.min(selectedIndex - Math.floor(viewportSize / 2), itemCount - viewportSize));
}
function positionText(offset, viewportSize, itemCount) {
  if (itemCount === 0)
    return "0/0";
  return `${offset + 1}-${Math.min(itemCount, offset + viewportSize)}/${itemCount}`;
}
function framedContentRows(rows) {
  return rows >= MIN_FRAMED_ROWS2 ? rows - 2 : rows;
}
function boundedFrame(lines, width, rows, theme) {
  if (rows < MIN_FRAMED_ROWS2)
    return boundedLines(lines, width, rows);
  const rule = renderHorizontalRule(width, theme);
  return [rule, ...boundedLines(lines, width, rows - 2), rule];
}
function boundedLines(lines, width, rows) {
  return lines.slice(0, rows).map((line) => truncateToWidth5(line, width, ""));
}
function browseHint(keybindings, destination) {
  const controls = formatInteractionHints(keybindings, [
    { bindings: ["tui.select.up", "tui.select.down"], label: "navigate" },
    { bindings: ["tui.select.confirm"], label: "details" },
    {
      bindings: ["tui.select.cancel"],
      excludeKeys: ["ctrl+c"],
      label: destination
    },
    ...destination === "back" ? [{ keys: ["ctrl+c"], label: "close" }] : []
  ], { separator: "\xB7" });
  return ["type to search", controls].filter(Boolean).join(" \xB7 ");
}
function detailHint(keybindings, searchEnabled, searchActive) {
  return formatInteractionHints(keybindings, searchActive ? [
    { bindings: ["tui.altScreen.searchNext"], label: "next" },
    { bindings: ["tui.altScreen.searchPrevious"], label: "previous" },
    { bindings: ["tui.altScreen.searchClose"], label: "close search" },
    { keys: ["ctrl+c"], label: "close" }
  ] : [
    { bindings: ["tui.select.up", "tui.select.down"], label: "scroll" },
    { bindings: ["tui.select.pageUp", "tui.select.pageDown"], label: "page" },
    ...searchEnabled ? [{ keys: [DOCUMENT_SEARCH_ACTIVATE_KEY], label: "search" }] : [],
    {
      bindings: ["tui.select.cancel"],
      excludeKeys: ["ctrl+c"],
      label: "back"
    },
    { keys: ["ctrl+c"], label: "close" }
  ], { separator: "\xB7" });
}
function safeBrowseText(value) {
  return safeMenuText(stripVTControlCharacters4(String(value)));
}
function keepRowVisible2(offset, row, viewportRows) {
  if (row < offset)
    return row;
  if (row >= offset + viewportRows)
    return row - viewportRows + 1;
  return offset;
}
function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(value, maximum));
}

// node_modules/@narumitw/pi-tui-kit/dist/components/input.js
import { Input as Input3, Key as Key4, matchesKey as matchesKey4, visibleWidth as visibleWidth6, wrapTextWithAnsi as wrapTextWithAnsi4 } from "@earendil-works/pi-tui";
function createInputComponent(options) {
  const input = new Input3();
  if (options.screen.initialValue !== void 0)
    initializeInputValue(input, options.screen.initialValue);
  let pending = Promise.resolve();
  let submitting = false;
  let closing = false;
  let disposed = false;
  let mouseLayout;
  const closeAfterPending = (kind) => {
    if (closing || disposed)
      return;
    closing = true;
    void pending.then(() => {
      if (!disposed)
        options.onEvent({ kind });
    });
  };
  const submit = () => {
    if (submitting || closing || disposed)
      return;
    submitting = true;
    const value = input.getValue();
    const operation = Promise.resolve().then(async () => {
      let response = false;
      try {
        response = await options.onInputSubmit?.({ value }) ?? false;
      } catch (error) {
        options.onError?.(error);
      }
      if (disposed)
        return;
      submitting = false;
      const accepted = typeof response === "boolean" ? response : response.accepted;
      if (accepted && typeof response !== "boolean") {
        closing = true;
        options.onTransition?.(response.transition);
      }
      options.tui.requestRender();
    }).catch(() => {
      if (!disposed) {
        submitting = false;
        options.tui.requestRender();
      }
    });
    pending = operation;
  };
  const component = {
    get focused() {
      return input.focused;
    },
    set focused(value) {
      input.focused = value;
    },
    render(width) {
      const safeWidth = Math.max(1, width);
      const content = [
        ...input.render(safeWidth),
        ...input.getValue().length === 0 && options.screen.placeholder ? wrapTextWithAnsi4(options.theme.fg("dim", safeMenuText(options.screen.placeholder)), safeWidth) : [],
        ...submitting ? [options.theme.fg("dim", "Saving\u2026")] : []
      ];
      const frame = renderFrameLayout(options.screen.title, options.screen.lines ?? [], content, options.screen.hint ?? "back", safeWidth, options, {
        confirmAction: "submit",
        pinnedContentRows: 1,
        priorityTailRows: submitting ? 1 : 0
      });
      mouseLayout = {
        width: safeWidth,
        inputFrameRow: frame.contentRows.find(({ contentIndex }) => contentIndex === 0)?.frameIndex
      };
      return frame.lines;
    },
    invalidate() {
      mouseLayout = void 0;
      input.invalidate();
    },
    handleInput(data) {
      if (disposed || closing)
        return;
      if (matchesKey4(data, Key4.ctrl("c")))
        closeAfterPending("close");
      else if (options.keybindings.matches(data, "tui.select.cancel")) {
        closeAfterPending(options.screen.hint ?? "back");
      } else if (options.keybindings.matches(data, "tui.input.submit"))
        submit();
      else if (!submitting)
        handleSearchInput(input, data);
      options.tui.requestRender();
    },
    handleMouse(event) {
      if (disposed || closing || submitting || !mouseLayout || event.width !== mouseLayout.width || event.y !== mouseLayout.inputFrameRow) {
        return void 0;
      }
      return input.handleMouse({ ...event, y: 0, width: mouseLayout.width, height: 1 });
    },
    waitForPending: () => pending,
    dispose() {
      if (disposed)
        return;
      disposed = true;
      mouseLayout = void 0;
      options.onDispose?.();
    }
  };
  return component;
}
function initializeInputValue(input, value) {
  const initializer = new Input3();
  handleSearchInput(initializer, `\x1B[200~${sanitizeInputInitialValue(value)}\x1B[201~`);
  const initialized = initializer.getValue();
  input.setValue(initialized);
  const x = visibleWidth6(initialized) + 2;
  input.handleMouse({
    type: "press",
    button: "left",
    x,
    y: 0,
    screenX: x,
    screenY: 0,
    width: x + 1,
    height: 1,
    shift: false,
    alt: false,
    ctrl: false
  });
}
function sanitizeInputInitialValue(value) {
  return Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint === 27)
      return " ";
    if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159)
      return character;
    return sanitizeTerminalText(character);
  }).join("");
}

// node_modules/@narumitw/pi-tui-kit/dist/components/multi-select.js
import { fuzzyFilter as fuzzyFilter2, Input as Input4, Key as Key5, matchesKey as matchesKey5, truncateToWidth as truncateToWidth6, wrapTextWithAnsi as wrapTextWithAnsi5 } from "@earendil-works/pi-tui";
function createMultiSelectComponent(options) {
  const searchInput = new Input4();
  const toggleRows = options.screen.items.map((item) => ({ kind: "toggle", item }));
  const actionRows = (options.screen.actions ?? []).map((item) => ({
    kind: "action",
    item
  }));
  const searchableRows = toggleRows.map((row) => ({
    row,
    text: [safeMenuText(row.item.label), safeMenuText(row.item.searchText ?? "")].filter(Boolean).join(" ")
  }));
  let rows = [...toggleRows, ...actionRows];
  const selected = new Map(options.screen.items.map((item) => [item.id, item.selected]));
  const committedSelected = new Map(selected);
  const revisions = /* @__PURE__ */ new Map();
  let selectedIndex = Math.max(0, rows.findIndex(({ item }) => item.id === options.selectedItemId));
  let restoreItemId;
  let pending = Promise.resolve();
  let closing = false;
  let disposed = false;
  let mousePressedIndex;
  let mouseLayout;
  const selectedRow = () => rows[selectedIndex];
  const closeAfterPending = (kind) => {
    if (closing || disposed)
      return;
    closing = true;
    void pending.then(() => {
      if (!disposed)
        options.onEvent({ kind });
    });
  };
  const setSelectedIndex = (index, rememberUserSelection) => {
    if (rows.length === 0) {
      selectedIndex = 0;
      return;
    }
    selectedIndex = Math.max(0, Math.min(index, rows.length - 1));
    const row = selectedRow();
    if (!row)
      return;
    if (rememberUserSelection)
      restoreItemId = void 0;
    options.onSelectionChange?.(row.item.id);
  };
  const selectIndex = (index) => setSelectedIndex(index, true);
  const move = (delta) => {
    if (rows.length === 0)
      return;
    selectIndex((selectedIndex + delta + rows.length) % rows.length);
  };
  const applyFilter = () => {
    if (!options.screen.enableSearch)
      return;
    mousePressedIndex = void 0;
    const previouslySelectedId = selectedRow()?.item.id;
    const filteredRows = fuzzyFilter2(searchableRows, searchInput.getValue(), (candidate) => candidate.text).map((candidate) => candidate.row);
    rows = [...filteredRows, ...actionRows];
    if (rows.length === 0) {
      if (previouslySelectedId)
        restoreItemId ??= previouslySelectedId;
      selectedIndex = 0;
      return;
    }
    const previousIndex = rows.findIndex((row) => row.item.id === previouslySelectedId);
    if (previousIndex < 0 && previouslySelectedId)
      restoreItemId ??= previouslySelectedId;
    const restoreIndex = rows.findIndex((row) => row.item.id === restoreItemId);
    const nextIndex = restoreIndex >= 0 ? restoreIndex : Math.max(previousIndex, 0);
    if (restoreIndex >= 0)
      restoreItemId = void 0;
    setSelectedIndex(nextIndex, false);
  };
  const activate = () => {
    const row = selectedRow();
    if (!row || row.item.disabled)
      return;
    restoreItemId = void 0;
    if (row.kind === "action") {
      if (closing || disposed)
        return;
      closing = true;
      void pending.then(() => {
        if (!disposed)
          options.onEvent({ kind: "activate", itemId: row.item.id });
      });
      return;
    }
    const item = row.item;
    const previousSelected = selected.get(item.id) ?? false;
    const nextSelected = !previousSelected;
    selected.set(item.id, nextSelected);
    const revision = (revisions.get(item.id) ?? 0) + 1;
    revisions.set(item.id, revision);
    const operation = pending.then(async () => {
      if (disposed)
        return;
      let response = false;
      try {
        response = await options.onMultiSelectChange?.({
          itemId: item.id,
          selected: nextSelected,
          previousSelected
        }) ?? false;
      } catch (error) {
        options.onError?.(error);
      }
      if (disposed)
        return;
      const accepted = typeof response === "boolean" ? response : response.accepted;
      if (accepted)
        committedSelected.set(item.id, nextSelected);
      else if (revisions.get(item.id) === revision) {
        selected.set(item.id, committedSelected.get(item.id) ?? false);
      }
      options.tui.requestRender();
      if (accepted && typeof response !== "boolean") {
        closing = true;
        void pending.then(() => {
          if (!disposed)
            options.onTransition?.(response.transition);
        });
      }
    });
    pending = operation.catch(() => void 0);
  };
  const component = {
    render(width) {
      const safeWidth = Math.max(1, width);
      const requestedViewport = options.screen.viewportSize ?? 13;
      const viewportSize = Math.min(requestedViewport, rows.length);
      const viewportStart = Math.max(0, Math.min(selectedIndex - Math.floor(viewportSize / 2), rows.length - viewportSize));
      const visibleRows = rows.slice(viewportStart, viewportStart + viewportSize);
      const rowContent = visibleRows.map((row2, offset) => {
        const index = viewportStart + offset;
        const isSelected = index === selectedIndex;
        const prefix = isSelected ? "\u203A " : "  ";
        const label = row2.kind === "action" ? `${prefix}${actionMenuItemPresentation(row2.item).label}` : `${prefix}${row2.item.disabled ? "[-]" : selected.get(row2.item.id) ? "[x]" : "[ ]"} ${safeMenuText(row2.item.label)}${row2.item.disabled ? " (unavailable)" : ""}`;
        const boundedLabel = row2.kind === "action" ? truncateToWidth6(label, safeWidth, safeWidth > 1 ? "\u2026" : "") : label;
        if (isSelected)
          return options.theme.fg("accent", boundedLabel);
        return row2.item.disabled ? options.theme.fg("dim", boundedLabel) : boundedLabel;
      });
      if (viewportSize < rows.length) {
        rowContent.push(options.theme.fg("dim", `  (${selectedIndex + 1}/${rows.length})`));
      }
      const row = selectedRow();
      const descriptions = row ? row.kind === "action" ? [actionMenuUnavailableDescription(row.item), actionMenuItemPresentation(row.item).description].filter((value) => Boolean(value)) : [
        row.item.description,
        row.item.disabled ? row.item.disabledReason ? `Unavailable: ${row.item.disabledReason}` : "Unavailable" : void 0
      ].filter((value) => Boolean(value)) : [];
      const descriptionRows = descriptions.flatMap((description) => wrapTextWithAnsi5(options.theme.fg("dim", `  ${safeMenuText(description)}`), safeWidth));
      if (descriptionRows.length > 0)
        rowContent.push("", ...descriptionRows);
      const hasMatchingItems = rows.some((candidate) => candidate.kind === "toggle");
      const searchEmptyStateRows = options.screen.enableSearch && (options.screen.items.length === 0 || !hasMatchingItems) ? 1 : 0;
      const content = options.screen.enableSearch ? [
        ...searchInput.render(safeWidth),
        "",
        ...options.screen.items.length === 0 ? [options.theme.fg("dim", "  No items available")] : !hasMatchingItems ? [options.theme.fg("dim", "  No matching items")] : [],
        ...rowContent,
        ...hasMatchingItems ? [options.theme.fg("dim", "Type to search")] : []
      ] : rowContent;
      const frame = renderFrameLayout(options.screen.title, options.screen.lines ?? [], content, options.screen.hint ?? "back", width, options, {
        compactOverflowText: rows.length > 1 ? `  (${selectedIndex + 1}/${rows.length})` : void 0,
        confirmAction: row?.kind === "action" ? "select" : "toggle",
        pinnedContentRows: options.screen.enableSearch ? hasMatchingItems ? 1 : 2 : 0,
        priorityTailRows: descriptionRows.length + (options.screen.enableSearch && hasMatchingItems ? 1 : 0)
      });
      const rowContentStart = options.screen.enableSearch ? 2 + searchEmptyStateRows : 0;
      mouseLayout = {
        width: safeWidth,
        inputFrameRow: options.screen.enableSearch ? frame.contentRows.find(({ contentIndex }) => contentIndex === 0)?.frameIndex : void 0,
        itemByFrameRow: new Map(visibleRows.flatMap((_, offset) => {
          const frameRow = frame.contentRows.find(({ contentIndex }) => contentIndex === rowContentStart + offset)?.frameIndex;
          return frameRow === void 0 ? [] : [[frameRow, viewportStart + offset]];
        }))
      };
      return frame.lines;
    },
    invalidate() {
      mouseLayout = void 0;
      if (options.screen.enableSearch)
        searchInput.invalidate();
    },
    handleInput(data) {
      if (disposed || closing)
        return;
      mousePressedIndex = void 0;
      if (matchesKey5(data, Key5.ctrl("c")))
        closeAfterPending("close");
      else if (options.keybindings.matches(data, "tui.select.cancel")) {
        closeAfterPending(options.screen.hint ?? "back");
      } else if (options.keybindings.matches(data, "tui.select.up"))
        move(-1);
      else if (options.keybindings.matches(data, "tui.select.down"))
        move(1);
      else if (options.keybindings.matches(data, "tui.select.pageUp")) {
        selectIndex(selectedIndex - (options.screen.viewportSize ?? 13));
      } else if (options.keybindings.matches(data, "tui.select.pageDown")) {
        selectIndex(selectedIndex + (options.screen.viewportSize ?? 13));
      } else if (options.keybindings.matches(data, "tui.select.confirm") || data === " ") {
        activate();
      } else if (options.screen.enableSearch) {
        handleSearchInput(searchInput, data);
        applyFilter();
      }
      options.tui.requestRender();
    },
    handleMouse(event) {
      if (disposed || closing || !mouseLayout || event.width !== mouseLayout.width)
        return void 0;
      if (options.screen.enableSearch && event.y === mouseLayout.inputFrameRow) {
        return searchInput.handleMouse({ ...event, y: 0, width: mouseLayout.width, height: 1 });
      }
      return routeRowsMouse(event);
    },
    waitForPending: () => pending,
    dispose() {
      if (disposed)
        return;
      disposed = true;
      mousePressedIndex = void 0;
      mouseLayout = void 0;
      options.onDispose?.();
    }
  };
  if (options.screen.enableSearch) {
    Object.defineProperty(component, "focused", {
      get: () => searchInput.focused,
      set: (value) => {
        searchInput.focused = value;
      }
    });
  }
  function routeRowsMouse(event) {
    if (!mouseLayout || rows.length === 0)
      return void 0;
    const mappedIndex = mouseLayout.itemByFrameRow.get(event.y);
    if (mappedIndex === void 0)
      return void 0;
    const itemIndex = event.type === "click" ? mousePressedIndex ?? mappedIndex : mappedIndex;
    if (itemIndex < 0 || itemIndex >= rows.length)
      return void 0;
    if (event.type === "wheel" && event.wheelDelta) {
      const next = Math.max(0, Math.min(rows.length - 1, selectedIndex + (event.wheelDelta < 0 ? -1 : 1)));
      const changed = next !== selectedIndex;
      if (changed)
        selectIndex(next);
      return { handled: true, render: changed };
    }
    if (event.type === "move")
      return { handled: true };
    if (event.button !== "left")
      return void 0;
    if (event.type === "press") {
      mousePressedIndex = itemIndex;
      const changed = itemIndex !== selectedIndex;
      if (changed)
        selectIndex(itemIndex);
      return { handled: true, focus: true, render: changed };
    }
    if (event.type === "click") {
      mousePressedIndex = void 0;
      if (itemIndex !== selectedIndex)
        selectIndex(itemIndex);
      activate();
      return { handled: true };
    }
    return void 0;
  }
  return component;
}

// node_modules/@narumitw/pi-tui-kit/dist/components/settings-rows.js
import { truncateToWidth as truncateToWidth7, visibleWidth as visibleWidth7, wrapTextWithAnsi as wrapTextWithAnsi6 } from "@earendil-works/pi-tui";
function renderSettingsRows(filteredItems, allItems, selectedIndex, displayed, width, options) {
  if (allItems.length === 0 || filteredItems.length === 0) {
    return {
      lines: [
        options.theme.fg("dim", allItems.length === 0 ? "  No settings available" : "  No matching settings; edit search")
      ],
      priorityTailRows: 1,
      viewportStart: 0,
      visibleCount: 0
    };
  }
  const maxVisible = Math.min(filteredItems.length, 10);
  const startIndex = Math.max(0, Math.min(selectedIndex - Math.floor(maxVisible / 2), filteredItems.length - maxVisible));
  const endIndex = Math.min(startIndex + maxVisible, filteredItems.length);
  const valueFor = (item) => {
    const value = safeMenuText(displayed.get(item.id) ?? item.currentValue);
    return item.disabled ? `(unavailable) ${value}` : value;
  };
  const widestLabel = Math.max(...allItems.map(({ label }) => visibleWidth7(label)));
  const widestValue = Math.max(...allItems.map(({ item }) => visibleWidth7(valueFor(item))));
  const available = Math.max(0, width - 4);
  const reservedValue = Math.min(widestValue, Math.ceil(available / 2));
  const labelWidth = width < 6 ? Math.max(0, width - 2) : Math.min(widestLabel, available - reservedValue);
  const valueWidth = width < 6 ? 0 : available - labelWidth;
  const gap = width < 6 ? "" : "  ";
  const ellipsize = (text, cells) => truncateToWidth7(text, cells, cells > 1 ? "\u2026" : "");
  const lines = [];
  for (let index = startIndex; index < endIndex; index += 1) {
    const candidate = filteredItems[index];
    if (!candidate)
      continue;
    const { item, label } = candidate;
    const selected2 = index === selectedIndex;
    const prefix = selected2 ? options.theme.fg("accent", "\u2192 ") : "  ";
    const boundedLabel = ellipsize(label, labelWidth);
    const labelPadded = boundedLabel + " ".repeat(Math.max(0, labelWidth - visibleWidth7(boundedLabel)));
    let labelText = labelPadded;
    let valueText = ellipsize(valueFor(item), valueWidth);
    if (selected2) {
      labelText = options.theme.fg("accent", labelText);
      valueText = options.theme.fg("accent", valueText);
    } else if (item.disabled) {
      labelText = options.theme.fg("dim", labelText);
      valueText = options.theme.fg("dim", valueText);
    } else {
      valueText = options.theme.fg("muted", valueText);
    }
    lines.push(truncateToWidth7(`${prefix}${labelText}${gap}${valueText}`, width, ""));
  }
  if (startIndex > 0 || endIndex < filteredItems.length) {
    lines.push(options.theme.fg("dim", `  (${selectedIndex + 1}/${filteredItems.length})`));
  }
  let priorityTailRows = 0;
  const selected = filteredItems[selectedIndex];
  if (selected) {
    const value = valueFor(selected.item);
    const details = [
      ...visibleWidth7(selected.label) > labelWidth ? [selected.label] : [],
      ...visibleWidth7(value) > valueWidth ? [`Value: ${value}`] : [],
      ...selected.item.description ? [safeMenuText(selected.item.description)] : []
    ];
    if (details.length > 0)
      lines.push("");
    for (const detail of details) {
      for (const line of wrapTextWithAnsi6(detail, Math.max(1, width - 4))) {
        lines.push(options.theme.fg("muted", `  ${line}`));
        priorityTailRows += 1;
      }
    }
  }
  return { lines, priorityTailRows, viewportStart: startIndex, visibleCount: endIndex - startIndex };
}

// node_modules/@narumitw/pi-tui-kit/dist/components/index.js
var BRACKETED_PASTE_START = "\x1B[200~";
var BRACKETED_PASTE_END = "\x1B[201~";
function createMenuScreenComponent(options) {
  const capturesViewportInput = options.screen.kind === "actions" || options.screen.kind === "choice" || options.screen.kind === "settings" || options.screen.kind === "multiSelect" || options.screen.kind === "browse";
  options = { ...options, keybindings: componentKeybindings(options.tui, options.keybindings, capturesViewportInput) };
  let component;
  switch (options.screen.kind) {
    case "actions":
      component = createActionsComponent(options);
      break;
    case "detail":
      component = createDetailComponent(options);
      break;
    case "browse":
      component = createBrowseComponent(options);
      break;
    case "choice":
      component = createChoiceComponent(options);
      break;
    case "settings":
      component = createSettingsComponent(options);
      break;
    case "input":
      component = createInputComponent(options);
      break;
    case "review":
      component = createReviewComponent(options);
      break;
    case "multiSelect":
      component = createMultiSelectComponent(options);
      break;
  }
  if (capturesViewportInput)
    component.capturesViewportInput = true;
  const render = component.render.bind(component);
  component.render = (width) => Number.isFinite(width) && width > 0 ? render(Math.floor(width)) : [];
  Object.defineProperty(component, "__piTuiKitScreen", { value: true });
  return component;
}
function createActionsComponent(options) {
  const items = options.screen.items.map((item) => ({
    value: item.id,
    ...actionMenuItemPresentation(item)
  }));
  const list = createMenuSelectList(items, 10, options.theme);
  setInitialSelection(list, items, options.selectedItemId);
  return commonListComponent(options, list, items, options.screen.lines ?? [], options.screen.hint ?? "back", (itemId) => {
    const source = options.screen.items.find((candidate) => candidate.id === itemId);
    if (!source?.disabled)
      options.onEvent({ kind: "activate", itemId });
  }, (itemId) => {
    const source = options.screen.items.find((candidate) => candidate.id === itemId);
    if (!source)
      return [];
    const unavailable = actionMenuUnavailableDescription(source);
    return unavailable ? [unavailable] : [];
  });
}
function createDetailComponent(options) {
  let disposed = false;
  return {
    render(width) {
      return renderFrame(options.screen.title, options.screen.lines, [], options.screen.hint ?? "back", width, options, { confirmAction: "", navigation: false });
    },
    invalidate() {
    },
    handleInput(data) {
      if (disposed)
        return;
      if (matchesKey6(data, Key6.ctrl("c")))
        options.onEvent({ kind: "close" });
      else if (options.keybindings.matches(data, "tui.select.cancel")) {
        options.onEvent({ kind: options.screen.hint ?? "back" });
      }
    },
    async waitForPending() {
    },
    dispose() {
      if (disposed)
        return;
      disposed = true;
      options.onDispose?.();
    }
  };
}
function createChoiceComponent(options) {
  const searchInput = new Input5();
  const restoredSearchQuery = options.searchQuery ?? "";
  if (restoredSearchQuery)
    restoreSearchInput(searchInput, restoredSearchQuery);
  const allItems = options.screen.items.map((item) => {
    const current = item.id === options.screen.currentItemId ? " \u2713 current" : "";
    const unavailable = item.disabled ? `unavailable${item.disabledReason ? `: ${safeMenuText(item.disabledReason)}` : ""}` : void 0;
    const label = safeMenuText(item.label);
    const description = item.description ? safeMenuText(item.description) : "";
    return {
      item,
      selectItem: {
        value: item.id,
        label: `${item.disabled ? "[-] " : ""}${label}${current}`,
        description: [unavailable, description].filter((value) => Boolean(value)).join(" \xB7 ") || void 0
      },
      searchText: [
        safeChoiceText(item.label),
        safeChoiceText(item.description ?? ""),
        safeChoiceText(item.searchText ?? "")
      ].filter(Boolean).join(" ")
    };
  });
  let filteredItems = options.screen.enableSearch ? fuzzyFilter3(allItems, searchInput.getValue(), (candidate) => candidate.searchText) : [...allItems];
  let selectedIndex = Math.max(0, filteredItems.findIndex(({ item }) => item.id === options.selectedItemId));
  let restoreItemId;
  let disposed = false;
  let searchPasteActive = false;
  let searchPasteEndPrefix = "";
  let mousePressedIndex;
  let mouseLayout;
  let list = createList();
  function pageSize() {
    return Math.min(filteredItems.length, options.screen.viewportSize ?? 10);
  }
  function createList() {
    const items = filteredItems.map(({ selectItem }) => selectItem);
    const next = createMenuSelectList(items, options.screen.viewportSize ?? 10, options.theme, options.screen.currentItemId);
    setInitialSelection(next, items, filteredItems[selectedIndex]?.item.id);
    return next;
  }
  const selected = () => filteredItems[selectedIndex]?.item;
  const setSelectedIndex = (index, wrap, rememberUserSelection) => {
    if (filteredItems.length === 0) {
      selectedIndex = 0;
      return;
    }
    selectedIndex = wrap ? (index + filteredItems.length) % filteredItems.length : Math.max(0, Math.min(index, filteredItems.length - 1));
    if (rememberUserSelection)
      restoreItemId = void 0;
    list.setSelectedIndex(selectedIndex);
    const item = selected();
    if (item)
      options.onSelectionChange?.(item.id);
  };
  const move = (delta) => setSelectedIndex(selectedIndex + delta, true, true);
  const applyFilter = () => {
    if (!options.screen.enableSearch)
      return;
    mousePressedIndex = void 0;
    const previouslySelectedId = selected()?.id;
    filteredItems = fuzzyFilter3(allItems, searchInput.getValue(), (candidate) => candidate.searchText);
    if (filteredItems.length === 0) {
      if (previouslySelectedId)
        restoreItemId ??= previouslySelectedId;
      selectedIndex = 0;
      list = createList();
      return;
    }
    const previousIndex = filteredItems.findIndex(({ item: item2 }) => item2.id === previouslySelectedId);
    if (previousIndex < 0 && previouslySelectedId)
      restoreItemId ??= previouslySelectedId;
    const restoreIndex = filteredItems.findIndex(({ item: item2 }) => item2.id === restoreItemId);
    selectedIndex = restoreIndex >= 0 ? restoreIndex : Math.max(previousIndex, 0);
    if (restoreIndex >= 0)
      restoreItemId = void 0;
    list = createList();
    const item = selected();
    if (item)
      options.onSelectionChange?.(item.id);
  };
  const activate = () => {
    const item = selected();
    if (!item || item.disabled)
      return false;
    options.onEvent({ kind: "activate", itemId: item.id });
    return true;
  };
  const applySearchInput = (data) => {
    handleSearchInput(searchInput, data);
    options.onSearchQueryChange?.(searchInput.getValue());
    applyFilter();
  };
  const dispatchNonPasteInput = (data) => {
    if (matchesKey6(data, Key6.ctrl("c"))) {
      options.onEvent({ kind: "close" });
      return true;
    }
    if (options.keybindings.matches(data, "tui.select.cancel")) {
      options.onEvent({ kind: options.screen.hint ?? "back" });
      return true;
    }
    if (options.keybindings.matches(data, "tui.select.up"))
      move(-1);
    else if (options.keybindings.matches(data, "tui.select.down"))
      move(1);
    else if (options.keybindings.matches(data, "tui.select.pageUp")) {
      setSelectedIndex(selectedIndex - Math.max(1, pageSize()), false, true);
    } else if (options.keybindings.matches(data, "tui.select.pageDown")) {
      setSelectedIndex(selectedIndex + Math.max(1, pageSize()), false, true);
    } else if (matchesKey6(data, Key6.home))
      setSelectedIndex(0, false, true);
    else if (matchesKey6(data, Key6.end)) {
      setSelectedIndex(filteredItems.length - 1, false, true);
    } else if (options.keybindings.matches(data, "tui.select.confirm") || !options.screen.enableSearch && data === " ") {
      return activate();
    } else if (options.screen.enableSearch)
      applySearchInput(data);
    return false;
  };
  const dispatchInput = (data) => {
    let remaining = data;
    while (remaining) {
      if (!options.screen.enableSearch) {
        dispatchNonPasteInput(remaining);
        return;
      }
      if (searchPasteActive) {
        const prefix = searchPasteEndPrefix;
        const combined = prefix + remaining;
        const end = combined.indexOf(BRACKETED_PASTE_END);
        const consumed = end < 0 ? remaining.length : Math.max(0, end + BRACKETED_PASTE_END.length - prefix.length);
        const pasteChunk = remaining.slice(0, consumed);
        if (pasteChunk)
          applySearchInput(pasteChunk);
        if (end < 0) {
          const prefixLength = trailingMarkerPrefixLength2(combined, BRACKETED_PASTE_END);
          searchPasteEndPrefix = prefixLength > 0 ? combined.slice(-prefixLength) : "";
          return;
        }
        searchPasteActive = false;
        searchPasteEndPrefix = "";
        remaining = remaining.slice(consumed);
        continue;
      }
      const start = remaining.indexOf(BRACKETED_PASTE_START);
      if (start < 0) {
        dispatchNonPasteInput(remaining);
        return;
      }
      if (start > 0 && dispatchNonPasteInput(remaining.slice(0, start)))
        return;
      searchPasteActive = true;
      searchPasteEndPrefix = "";
      remaining = remaining.slice(start);
    }
  };
  const component = {
    render(width) {
      const safeWidth = Math.max(1, width);
      const selectedItem = selected();
      const listRows2 = list.render(safeWidth);
      const description = selectedItem?.description ? safeMenuText(selectedItem.description) : "";
      const selectedListRow = listRows2[selectedIndex - listWindowStart2(selectedIndex, filteredItems.length, pageSize())];
      const details = [
        ...selectedLabelFallback(filteredItems[selectedIndex]?.selectItem.label, selectedListRow),
        ...selectedItem?.disabled && selectedItem.disabledReason ? [`Unavailable: ${safeMenuText(selectedItem.disabledReason)}`] : [],
        ...description && !listRows2.some((line) => stripVTControlCharacters5(line).includes(description)) ? [description] : [],
        ...(selectedItem?.details ?? []).map(safeMenuText)
      ];
      const detailRows = details.flatMap((line) => wrapTextWithAnsi7(options.theme.fg("muted", line), safeWidth));
      const choices = allItems.length === 0 ? [options.theme.fg("dim", "  No choices available")] : filteredItems.length === 0 ? [options.theme.fg("dim", "  No matching choices; edit search")] : [...listRows2, ...detailRows.length > 0 ? ["", ...detailRows] : []];
      const totalChoices = `${allItems.length} ${allItems.length === 1 ? "choice" : "choices"}`;
      const resultCount = filteredItems.length === allItems.length ? totalChoices : `${filteredItems.length} of ${totalChoices}`;
      const search = options.screen.enableSearch ? [...renderChoiceSearchInput(searchInput, safeWidth), options.theme.fg("dim", resultCount), ...choices] : choices;
      const frame = renderFrameLayout(options.screen.title, options.screen.lines ?? [], search, options.screen.hint ?? "back", safeWidth, options, {
        compactOverflowText: filteredItems.length > 1 ? `  (${selectedIndex + 1}/${filteredItems.length})` : void 0,
        confirmAction: "select",
        pinnedContentRows: options.screen.enableSearch ? 1 : 0,
        priorityTailRows: filteredItems.length === 0 ? 1 : detailRows.length
      });
      const listContentStart = options.screen.enableSearch ? 2 : 0;
      const visibleCount = Math.min(filteredItems.length, options.screen.viewportSize ?? 10);
      const viewportStart = listWindowStart2(selectedIndex, filteredItems.length, visibleCount);
      mouseLayout = {
        width: safeWidth,
        inputFrameRow: options.screen.enableSearch ? frameRowForContent(frame, 0) : void 0,
        itemByFrameRow: itemRowsForFrame(frame, listContentStart, viewportStart, visibleCount)
      };
      return frame.lines;
    },
    invalidate() {
      mouseLayout = void 0;
      list.invalidate();
      if (options.screen.enableSearch)
        searchInput.invalidate();
    },
    handleInput(data) {
      if (disposed)
        return;
      mousePressedIndex = void 0;
      dispatchInput(data);
      options.tui.requestRender();
    },
    handleMouse(event) {
      if (disposed)
        return void 0;
      const inputResult = routeInputMouse(searchInput, event, mouseLayout, options.screen.enableSearch ? 8 : 0);
      if (inputResult)
        return inputResult;
      return routeListMouse(event, mouseLayout, {
        selectedIndex,
        itemCount: filteredItems.length,
        onSelect: (index) => setSelectedIndex(index, false, true),
        onActivate: activate,
        getPressedIndex: () => mousePressedIndex,
        setPressedIndex: (index) => {
          mousePressedIndex = index;
        }
      });
    },
    async waitForPending() {
    },
    dispose() {
      if (disposed)
        return;
      disposed = true;
      searchPasteActive = false;
      searchPasteEndPrefix = "";
      mousePressedIndex = void 0;
      mouseLayout = void 0;
      options.onDispose?.();
    }
  };
  if (options.screen.enableSearch) {
    Object.defineProperty(component, "focused", {
      get: () => searchInput.focused,
      set: (value) => {
        searchInput.focused = value;
      }
    });
  }
  return component;
}
function trailingMarkerPrefixLength2(value, marker) {
  for (let length = Math.min(value.length, marker.length - 1); length > 0; length -= 1) {
    if (marker.startsWith(value.slice(-length)))
      return length;
  }
  return 0;
}
function safeChoiceText(value) {
  return safeMenuText(stripVTControlCharacters5(String(value)));
}
function renderChoiceSearchInput(input, width) {
  const prefix = "Search: ";
  const inputWidth = Math.max(1, width - visibleWidth8(prefix));
  return input.render(inputWidth).map((line) => truncateToWidth8(`${prefix}${line}`, width, ""));
}
function createSettingsComponent(options) {
  const searchInput = new Input5();
  const searchableItems = options.screen.items.map((item) => ({
    item,
    label: safeMenuText(item.label)
  }));
  if (options.searchQuery)
    restoreSearchInput(searchInput, options.searchQuery);
  let filteredItems = fuzzyFilter3(searchableItems, searchInput.getValue(), (candidate) => candidate.label);
  const committed = new Map(options.screen.items.map((item) => [item.id, item.currentValue]));
  const displayed = new Map(committed);
  const revisions = /* @__PURE__ */ new Map();
  let selectedIndex = Math.max(0, filteredItems.findIndex(({ item }) => item.id === options.selectedItemId));
  let pending = Promise.resolve();
  let disposed = false;
  let closing = false;
  let mousePressedIndex;
  let mouseLayout;
  const selectedItem = () => filteredItems[selectedIndex]?.item;
  const closeAfterPending = (kind) => {
    if (closing || disposed)
      return;
    closing = true;
    void pending.then(() => {
      if (!disposed)
        options.onEvent({ kind });
    });
  };
  const select = (index) => {
    if (filteredItems.length === 0)
      return;
    selectedIndex = (index + filteredItems.length) % filteredItems.length;
    const item = selectedItem();
    if (item)
      options.onSelectionChange?.(item.id);
  };
  const applyFilter = () => {
    mousePressedIndex = void 0;
    filteredItems = fuzzyFilter3(searchableItems, searchInput.getValue(), (candidate) => candidate.label);
    options.onSearchQueryChange?.(searchInput.getValue());
    selectedIndex = 0;
    const item = selectedItem();
    if (item)
      options.onSelectionChange?.(item.id);
  };
  const activate = () => {
    const item = selectedItem();
    if (!item || item.disabled || closing || disposed)
      return;
    const values = item.values ?? [item.currentValue];
    if (values.length === 0)
      return;
    const currentValue = displayed.get(item.id) ?? item.currentValue;
    const currentIndex = values.indexOf(currentValue);
    const value = values[(currentIndex + 1) % values.length] ?? currentValue;
    displayed.set(item.id, value);
    const revision = (revisions.get(item.id) ?? 0) + 1;
    revisions.set(item.id, revision);
    const operation = pending.then(async () => {
      if (disposed)
        return;
      const previousValue = committed.get(item.id) ?? item.currentValue;
      let response = false;
      try {
        response = await options.onSettingChange?.({
          itemId: item.id,
          value,
          previousValue
        }) ?? false;
      } catch (error) {
        options.onError?.(error);
      }
      if (disposed)
        return;
      const accepted = typeof response === "boolean" ? response : response.accepted;
      if (accepted)
        committed.set(item.id, value);
      else if (revisions.get(item.id) === revision)
        displayed.set(item.id, previousValue);
      options.tui.requestRender();
      if (accepted && typeof response !== "boolean") {
        closing = true;
        void pending.then(() => {
          if (!disposed)
            options.onTransition?.(response.transition);
        });
      }
    });
    pending = operation.catch(() => void 0);
  };
  const component = {
    get focused() {
      return searchInput.focused;
    },
    set focused(value) {
      searchInput.focused = value;
    },
    render(width) {
      const safeWidth = Math.max(1, width);
      const settingsRows = renderSettingsRows(filteredItems, searchableItems, selectedIndex, displayed, safeWidth, options);
      const content = [...searchInput.render(safeWidth), "", ...settingsRows.lines, ""];
      const frame = renderFrameLayout(options.screen.title, options.screen.lines ?? [], content, "back", safeWidth, options, {
        compactOverflowText: filteredItems.length > 1 ? `  (${selectedIndex + 1}/${filteredItems.length})` : void 0,
        confirmAction: "change",
        hint: settingsHint(options.keybindings, componentKeyAvailable(options.tui, "space", true)),
        pinnedContentRows: 1,
        priorityTailRows: settingsRows.priorityTailRows
      });
      mouseLayout = {
        width: safeWidth,
        inputFrameRow: frameRowForContent(frame, 0),
        itemByFrameRow: itemRowsForFrame(frame, 2, settingsRows.viewportStart, settingsRows.visibleCount)
      };
      return frame.lines;
    },
    invalidate() {
      mouseLayout = void 0;
      searchInput.invalidate();
    },
    handleInput(data) {
      if (disposed || closing)
        return;
      mousePressedIndex = void 0;
      if (matchesKey6(data, Key6.ctrl("c")))
        closeAfterPending("close");
      else if (options.keybindings.matches(data, "tui.select.cancel")) {
        closeAfterPending("back");
      } else if (options.keybindings.matches(data, "tui.select.up")) {
        select(selectedIndex - 1);
      } else if (options.keybindings.matches(data, "tui.select.down")) {
        select(selectedIndex + 1);
      } else if (options.keybindings.matches(data, "tui.select.pageUp"))
        select(0);
      else if (options.keybindings.matches(data, "tui.select.pageDown")) {
        select(filteredItems.length - 1);
      } else if (options.keybindings.matches(data, "tui.select.confirm") || data === " ") {
        activate();
      } else {
        handleSearchInput(searchInput, data);
        applyFilter();
      }
      options.tui.requestRender();
    },
    handleMouse(event) {
      if (disposed || closing)
        return void 0;
      const inputResult = routeInputMouse(searchInput, event, mouseLayout, 0);
      if (inputResult)
        return inputResult;
      return routeListMouse(event, mouseLayout, {
        selectedIndex,
        itemCount: filteredItems.length,
        onSelect: select,
        onActivate: activate,
        getPressedIndex: () => mousePressedIndex,
        setPressedIndex: (index) => {
          mousePressedIndex = index;
        }
      });
    },
    waitForPending: () => pending,
    dispose() {
      if (disposed)
        return;
      disposed = true;
      mousePressedIndex = void 0;
      mouseLayout = void 0;
      options.onDispose?.();
    }
  };
  return component;
}
function settingsHint(keybindings, spaceAvailable) {
  const confirmKeys = uniqueHintKeys([
    ...keybindings.getKeys("tui.select.confirm"),
    ...spaceAvailable ? ["space"] : []
  ]);
  const cancelKeys = uniqueHintKeys(keybindings.getKeys("tui.select.cancel").filter((key) => key !== "ctrl+c"));
  return [
    "Type to search",
    ...confirmKeys ? [`${confirmKeys} to change`] : [],
    ...cancelKeys ? [`${cancelKeys} to go back`] : [],
    "Ctrl+C to close"
  ].join(" \xB7 ");
}
function uniqueHintKeys(keys) {
  return [...new Set(keys.map(displayHintKey).filter(Boolean))].join("/");
}
function displayHintKey(key) {
  if (key === "enter")
    return "Enter";
  if (key === "space")
    return "Space";
  if (key === "escape")
    return "Esc";
  if (key === "ctrl+c")
    return "Ctrl+C";
  if (key === "up")
    return "\u2191";
  if (key === "down")
    return "\u2193";
  return safeMenuText(key);
}
function frameRowForContent(frame, contentIndex) {
  return frame.contentRows.find((row) => row.contentIndex === contentIndex)?.frameIndex;
}
function itemRowsForFrame(frame, contentStart, viewportStart, visibleCount) {
  return new Map(Array.from({ length: visibleCount }, (_, offset) => {
    const frameRow = frameRowForContent(frame, contentStart + offset);
    return frameRow === void 0 ? void 0 : [frameRow, viewportStart + offset];
  }).filter((entry) => entry !== void 0));
}
function listWindowStart2(selectedIndex, itemCount, viewportSize) {
  if (itemCount <= viewportSize)
    return 0;
  return Math.max(0, Math.min(selectedIndex - Math.floor(viewportSize / 2), itemCount - viewportSize));
}
function routeInputMouse(input, event, layout, xOffset) {
  if (!layout || event.width !== layout.width || event.y !== layout.inputFrameRow)
    return void 0;
  const inputWidth = Math.max(1, layout.width - xOffset);
  if (event.x < xOffset || event.x >= xOffset + inputWidth)
    return void 0;
  return input.handleMouse({ ...event, x: event.x - xOffset, y: 0, width: inputWidth, height: 1 });
}
function routeListMouse(event, layout, actions) {
  if (!layout || event.width !== layout.width || actions.itemCount === 0)
    return void 0;
  const mappedIndex = layout.itemByFrameRow.get(event.y);
  if (mappedIndex === void 0)
    return void 0;
  const itemIndex = event.type === "click" ? actions.getPressedIndex() ?? mappedIndex : mappedIndex;
  if (itemIndex < 0 || itemIndex >= actions.itemCount)
    return void 0;
  if (event.type === "wheel" && event.wheelDelta) {
    const next = Math.max(0, Math.min(actions.itemCount - 1, actions.selectedIndex + (event.wheelDelta < 0 ? -1 : 1)));
    const changed = next !== actions.selectedIndex;
    if (changed)
      actions.onSelect(next);
    return { handled: true, render: changed };
  }
  if (event.type === "move")
    return { handled: true };
  if (event.button !== "left")
    return void 0;
  if (event.type === "press") {
    actions.setPressedIndex(itemIndex);
    const changed = itemIndex !== actions.selectedIndex;
    if (changed)
      actions.onSelect(itemIndex);
    return { handled: true, focus: true, render: changed };
  }
  if (event.type === "click") {
    actions.setPressedIndex(void 0);
    if (itemIndex !== actions.selectedIndex)
      actions.onSelect(itemIndex);
    actions.onActivate();
    return { handled: true };
  }
  return void 0;
}
function commonListComponent(options, list, items, lines, destination, onActivate, selectedDetails) {
  const initialIndex = Math.max(0, items.findIndex((item) => item.value === options.selectedItemId));
  let selectedIndex = initialIndex;
  let disposed = false;
  let mousePressedIndex;
  let mouseLayout;
  const select = (index, wrap) => {
    if (items.length === 0)
      return;
    selectedIndex = wrap ? (index + items.length) % items.length : Math.max(0, Math.min(index, items.length - 1));
    list.setSelectedIndex(selectedIndex);
    const itemId = items[selectedIndex]?.value;
    if (itemId)
      options.onSelectionChange?.(itemId);
  };
  return {
    render(width) {
      const safeWidth = Math.max(1, width);
      const selectedId = items[selectedIndex]?.value;
      const listRows2 = list.render(safeWidth);
      const selectedItem = items[selectedIndex];
      const description = selectedItem?.description;
      const selectedListRow = listRows2[selectedIndex - listWindowStart2(selectedIndex, items.length, Math.min(items.length, 10))];
      const details = [
        ...selectedLabelFallback(selectedItem?.label, selectedListRow),
        ...selectedId ? selectedDetails?.(selectedId) ?? [] : [],
        ...description && !listRows2.some((line) => stripVTControlCharacters5(line).includes(description)) ? [description] : []
      ];
      const detailRows = details.flatMap((detail) => wrapTextWithAnsi7(options.theme.fg("muted", safeMenuText(detail)), safeWidth));
      const content = [...listRows2, ...detailRows.length > 0 ? ["", ...detailRows] : []];
      const frame = renderFrameLayout(options.screen.title, lines, content, destination, width, options, {
        compactOverflowText: items.length > 1 ? `  (${selectedIndex + 1}/${items.length})` : void 0,
        priorityTailRows: detailRows.length
      });
      const visibleCount = Math.min(items.length, 10);
      mouseLayout = {
        width: safeWidth,
        itemByFrameRow: itemRowsForFrame(frame, 0, listWindowStart2(selectedIndex, items.length, visibleCount), visibleCount)
      };
      return frame.lines;
    },
    invalidate() {
      mouseLayout = void 0;
      list.invalidate();
    },
    handleInput(data) {
      if (disposed)
        return;
      mousePressedIndex = void 0;
      if (matchesKey6(data, Key6.ctrl("c"))) {
        options.onEvent({ kind: "close" });
        return;
      }
      if (options.keybindings.matches(data, "tui.select.cancel")) {
        options.onEvent({ kind: destination });
        return;
      }
      if (options.keybindings.matches(data, "tui.select.up"))
        select(selectedIndex - 1, true);
      else if (options.keybindings.matches(data, "tui.select.down")) {
        select(selectedIndex + 1, true);
      } else if (options.keybindings.matches(data, "tui.select.pageUp")) {
        select(selectedIndex - Math.max(1, Math.min(items.length, 10)), false);
      } else if (options.keybindings.matches(data, "tui.select.pageDown")) {
        select(selectedIndex + Math.max(1, Math.min(items.length, 10)), false);
      } else if (matchesKey6(data, Key6.home))
        select(0, false);
      else if (matchesKey6(data, Key6.end))
        select(items.length - 1, false);
      else if (options.keybindings.matches(data, "tui.select.confirm")) {
        const itemId = items[selectedIndex]?.value;
        if (itemId)
          onActivate(itemId);
      }
      options.tui.requestRender();
    },
    handleMouse(event) {
      if (disposed)
        return void 0;
      return routeListMouse(event, mouseLayout, {
        selectedIndex,
        itemCount: items.length,
        onSelect: (index) => select(index, false),
        onActivate: () => {
          const itemId = items[selectedIndex]?.value;
          if (itemId)
            onActivate(itemId);
        },
        getPressedIndex: () => mousePressedIndex,
        setPressedIndex: (index) => {
          mousePressedIndex = index;
        }
      });
    },
    async waitForPending() {
    },
    dispose() {
      if (disposed)
        return;
      disposed = true;
      mousePressedIndex = void 0;
      mouseLayout = void 0;
      options.onDispose?.();
    }
  };
}
function setInitialSelection(list, items, selectedId) {
  if (!selectedId)
    return;
  const index = items.findIndex((item) => item.value === selectedId);
  if (index >= 0)
    list.setSelectedIndex(index);
}
function settingForAction(screen, itemId) {
  return screen.items.find((item) => item.id === itemId);
}

export {
  renderBoundedFrame,
  renderBoundedFrameLayout,
  safeMenuText,
  formatInteractionHints,
  actionMenuDialogLabel,
  componentRows,
  sanitizeTerminalDocument,
  hardWrapTerminalDocument,
  prepareMermaidMarkdownRenderer,
  createMermaidMarkdownTransformer,
  prepareMenuScreenRendering,
  createReviewComponent,
  reviewDialogPages,
  browseDialogLabel,
  browseDialogPages,
  createMultiSelectComponent,
  createMenuScreenComponent,
  settingForAction
};
