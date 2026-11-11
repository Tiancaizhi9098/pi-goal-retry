// Generated from src; rebuild with npm run build.
// @ts-nocheck

// node_modules/@narumitw/pi-tui-kit/dist/terminal-text.js
var ESC = 27;
var BEL = 7;
var CSI = 155;
var ST = 156;
var OSC = 157;
var DCS = 144;
var SOS = 152;
var PM = 158;
var APC = 159;
function sanitizeTerminalText(value) {
  let output = "";
  for (let index = 0; index < value.length; ) {
    const codePoint = value.codePointAt(index) ?? 0;
    const length = codePoint > 65535 ? 2 : 1;
    if (codePoint === ESC) {
      index = skipEscSequence(value, index);
      continue;
    }
    if (codePoint === CSI) {
      index = skipCsi(value, index + length);
      continue;
    }
    if (codePoint === OSC || codePoint === DCS || codePoint === SOS || codePoint === PM || codePoint === APC) {
      index = skipStringSequence(value, index + length, codePoint === OSC);
      continue;
    }
    if (isLineSeparator(codePoint)) {
      output += " ";
      index += length;
      continue;
    }
    if (isControl(codePoint) || isBidiControl(codePoint)) {
      index += length;
      continue;
    }
    output += String.fromCodePoint(codePoint);
    index += length;
  }
  return output;
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
function isLineSeparator(codePoint) {
  return codePoint === 9 || codePoint === 10 || codePoint === 13 || codePoint === 133 || codePoint === 8232 || codePoint === 8233;
}
function isControl(codePoint) {
  return codePoint <= 31 || codePoint >= 127 && codePoint <= 159;
}
function isBidiControl(codePoint) {
  return codePoint === 1564 || codePoint === 8206 || codePoint === 8207 || codePoint >= 8234 && codePoint <= 8238 || codePoint >= 8294 && codePoint <= 8297;
}

// node_modules/@narumitw/pi-tui-kit/dist/horizontal-rule.js
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
var HorizontalRule = class {
  options;
  constructor(options = {}) {
    this.options = options;
  }
  invalidate() {
  }
  render(width) {
    const renderWidth = normalizeSize(width);
    if (renderWidth === 0)
      return [""];
    const requestedPadding = normalizeSize(this.options.paddingX ?? 0);
    const padding = Math.min(requestedPadding, Math.floor((renderWidth - 1) / 2));
    const innerWidth = renderWidth - padding * 2;
    const label = sanitizeTerminalText(this.options.label ?? "").trim();
    const inner = label ? this.renderLabeledRule(label, innerWidth) : this.rule(innerWidth);
    return [fitToWidth(`${" ".repeat(padding)}${inner}${" ".repeat(padding)}`, renderWidth)];
  }
  renderLabeledRule(label, width) {
    if (width <= 2)
      return this.label(truncateToWidth(label, width, ""));
    const fittedLabel = truncateToWidth(label, width - 2, width > 3 ? "\u2026" : "");
    const labelWidth = visibleWidth(fittedLabel);
    const ruleWidth = Math.max(0, width - labelWidth - 2);
    const [leftWidth, rightWidth] = distributeRule(ruleWidth, this.options.labelAlignment ?? "center");
    return `${this.rule(leftWidth)} ${this.label(fittedLabel)} ${this.rule(rightWidth)}`;
  }
  rule(width) {
    return (this.options.ruleStyle ?? identity)("\u2500".repeat(width));
  }
  label(text) {
    return (this.options.labelStyle ?? identity)(text);
  }
};
function distributeRule(width, alignment) {
  if (alignment === "left")
    return [Math.min(1, width), Math.max(0, width - 1)];
  if (alignment === "right")
    return [Math.max(0, width - 1), Math.min(1, width)];
  const left = Math.floor(width / 2);
  return [left, width - left];
}
function fitToWidth(value, width) {
  const fitted = truncateToWidth(value, width, "");
  return fitted + " ".repeat(Math.max(0, width - visibleWidth(fitted)));
}
function normalizeSize(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
function identity(text) {
  return text;
}

// node_modules/@narumitw/pi-tui-kit/dist/key-matching.js
function canonicalizeConfiguredKey(value) {
  if (typeof value !== "string")
    return void 0;
  let key = value.toLowerCase();
  const seen = /* @__PURE__ */ new Set();
  while (true) {
    const modifier = MODIFIERS.find((name) => key.startsWith(`${name}+`));
    if (!modifier)
      break;
    if (seen.has(modifier))
      return void 0;
    seen.add(modifier);
    key = key.slice(modifier.length + 1);
  }
  if (!key || key.includes("+") && key !== "+")
    return void 0;
  const base = key === "esc" ? "escape" : key === "return" ? "enter" : key;
  const modifiers = MODIFIERS.filter((modifier) => seen.has(modifier));
  if (!isExecutableKey(base, modifiers))
    return void 0;
  const nativeBase = base === "pageup" ? "pageUp" : base === "pagedown" ? "pageDown" : base;
  return [...modifiers, nativeBase].join("+");
}
function isExecutableKey(base, modifiers) {
  if (!KEY_BASES.has(base))
    return false;
  if (base === "escape" || /^f(?:[1-9]|1[0-2])$/u.test(base))
    return modifiers.length === 0;
  if (base === "clear") {
    return modifiers.length === 0 || modifiers.length === 1 && (modifiers[0] === "shift" || modifiers[0] === "ctrl");
  }
  return true;
}
var MODIFIERS = ["shift", "ctrl", "alt", "super"];
var KEY_BASES = /* @__PURE__ */ new Set([
  ..."abcdefghijklmnopqrstuvwxyz0123456789`-=[]\\;',./!@#$%^&*()_+|~{}:<>?",
  "escape",
  "enter",
  "tab",
  "space",
  "backspace",
  "delete",
  "insert",
  "clear",
  "home",
  "end",
  "pageup",
  "pagedown",
  "up",
  "down",
  "left",
  "right",
  ...Array.from({ length: 12 }, (_, index) => `f${index + 1}`)
]);

// node_modules/@narumitw/pi-tui-kit/dist/components/host-input.js
import { getKeybindings } from "@earendil-works/pi-tui";

// node_modules/@narumitw/pi-tui-kit/dist/components/key-matching.js
import { isKittyProtocolActive, matchesKey } from "@earendil-works/pi-tui";
function canonicalKeyId(value) {
  return canonicalizeConfiguredKey(value)?.toLowerCase();
}
function usesDisambiguatedKeyProtocol(tui) {
  const terminal = tui.terminal;
  return isKittyProtocolActive() || terminal.kittyProtocolActive === true || terminal.modifyOtherKeysActive === true;
}
function keysOverlap(first, second, disambiguatedKeyProtocol) {
  if (first === second)
    return true;
  const candidates = [...protocolInputs(first, second), ...protocolInputs(second, first)];
  if (candidates.some((input) => matchesKey(input, first) && matchesKey(input, second)))
    return true;
  return !disambiguatedKeyProtocol && inputsForKey(first).some((input) => matchesKey(input, second));
}
function keyIdentity(key) {
  const parts = key === "+" ? [] : key.endsWith("++") ? key.slice(0, -2).split("+") : key.split("+");
  const base = key.endsWith("+") ? "+" : parts.pop() ?? "";
  const modifier = parts.reduce((mask, part) => mask | (KEY_MODIFIER_MASKS[part] ?? 0), 0);
  return { codepoint: KEY_CODEPOINTS[base] ?? (base.length === 1 ? base.charCodeAt(0) : void 0), modifier };
}
function protocolInputs(key, other) {
  const { codepoint, modifier } = keyIdentity(key);
  const alternate = keyIdentity(other).codepoint;
  if (codepoint === void 0 || alternate === void 0)
    return [];
  return [
    // Alternate key fields describe printable keys, not functional keys.
    // Inventing them for Ctrl+Up would incorrectly reserve every Ctrl binding.
    ...codepoint >= 33 && codepoint <= 126 && alternate >= 33 && alternate <= 126 ? [`\x1B[${codepoint}:${alternate};${modifier + 1}u`, `\x1B[${codepoint}::${alternate};${modifier + 1}u`] : [],
    `\x1B[27;${modifier + 1};${codepoint}~`
  ];
}
function inputsForKey(key) {
  const cacheKey = `${isKittyProtocolActive()}:${isLocalWindowsTerminalSession() ? "windows" : "other"}:${key}`;
  const cached = LEGACY_KEY_INPUT_CACHE.get(cacheKey);
  if (cached)
    return cached;
  const { codepoint, modifier } = keyIdentity(key);
  const candidates = codepoint === void 0 ? LEGACY_KEY_INPUTS : [...LEGACY_KEY_INPUTS, `\x1B[${codepoint};${modifier + 1}u`];
  const inputs = candidates.filter((input) => matchesKey(input, key));
  LEGACY_KEY_INPUT_CACHE.set(cacheKey, inputs);
  return inputs;
}
function isLocalWindowsTerminalSession() {
  return Boolean(process.env.WT_SESSION) && !process.env.SSH_CONNECTION && !process.env.SSH_CLIENT && !process.env.SSH_TTY;
}
var KEY_MODIFIER_MASKS = { shift: 1, alt: 2, ctrl: 4, super: 8 };
var KEY_CODEPOINTS = {
  escape: 27,
  tab: 9,
  enter: 13,
  space: 32,
  backspace: 127,
  insert: 57425,
  delete: 57426,
  home: 57423,
  end: 57424,
  pageup: 57421,
  pagedown: 57422,
  left: 57417,
  right: 57418,
  up: 57419,
  down: 57420
};
var LEGACY_FUNCTION_INPUT_SUFFIXES = [
  "OP",
  "OQ",
  "OR",
  "OS",
  "[15~",
  "[17~",
  "[18~",
  "[19~",
  "[20~",
  "[21~",
  "[23~",
  "[24~"
];
var LEGACY_KEY_INPUT_CACHE = /* @__PURE__ */ new Map();
var LEGACY_KEY_INPUTS = [
  ...Array.from({ length: 128 }, (_, code) => String.fromCharCode(code)),
  ...Array.from({ length: 128 }, (_, code) => `\x1B${String.fromCharCode(code)}`),
  "\x1B[Z",
  "\x1BOM",
  "\x1B[E",
  "\x1B[e",
  "\x1BOe",
  ...LEGACY_FUNCTION_INPUT_SUFFIXES.map((suffix) => `\x1B${suffix}`)
];

// node_modules/@narumitw/pi-tui-kit/dist/components/host-input.js
var HOST_VIEWPORT_ACTIONS = [
  "tui.altScreen.pageUp",
  "tui.altScreen.pageDown",
  "tui.altScreen.halfPageUp",
  "tui.altScreen.halfPageDown",
  "tui.altScreen.lineUp",
  "tui.altScreen.lineDown",
  "tui.altScreen.previousPrompt",
  "tui.altScreen.nextPrompt",
  "tui.altScreen.top",
  "tui.altScreen.bottom"
];
function componentKeyAvailable(tui, key, capturesViewportInput = false) {
  const native = tui;
  const canonical = canonicalKeyId(key);
  if (!canonical)
    return false;
  const host = getKeybindings();
  const reserved = native.mode === "fullscreen" ? [
    ...host.getKeys("tui.altScreen.search"),
    ...capturesViewportInput ? [] : HOST_VIEWPORT_ACTIONS.flatMap((action) => host.getKeys(action))
  ] : [];
  if (native.onDebug)
    reserved.push("shift+ctrl+d");
  return !reserved.some((candidate) => {
    const other = canonicalKeyId(candidate);
    return other !== void 0 && keysOverlap(canonical, other, usesDisambiguatedKeyProtocol(tui));
  });
}
function componentKeybindings(tui, keybindings, capturesViewportInput = false) {
  return new Proxy(keybindings, {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      if (property === "getKeys" && typeof value === "function") {
        return (binding) => value.call(target, binding).filter((key) => componentKeyAvailable(tui, key, capturesViewportInput));
      }
      return typeof value === "function" ? value.bind(target) : value;
    }
  });
}

export {
  sanitizeTerminalText,
  HorizontalRule,
  canonicalizeConfiguredKey,
  canonicalKeyId,
  usesDisambiguatedKeyProtocol,
  keysOverlap,
  componentKeyAvailable,
  componentKeybindings
};
