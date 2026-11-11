// Generated from src; rebuild with npm run build.
// @ts-nocheck
import {
  HorizontalRule,
  componentKeyAvailable,
  componentKeybindings
} from "./chunk-WIBL2C3K.ts";

// node_modules/@narumitw/pi-tui-kit/dist/components/questionnaire.js
import { stripVTControlCharacters } from "node:util";
import { isKeyRelease, isKeyRepeat, Key as Key2, matchesKey as matchesKey2, parseKey, sliceByColumn, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

// node_modules/@narumitw/pi-tui-kit/dist/components/questionnaire-editor.js
import { Editor, isFocusable, Key, matchesKey } from "@earendil-works/pi-tui";
var BRACKETED_PASTE_START = "\x1B[200~";
var BRACKETED_PASTE_END = "\x1B[201~";
var RawPreservingEditor = class {
  editor;
  rawByMarker = /* @__PURE__ */ new Map();
  markerCodePoint = 57344;
  pasteBuffer;
  inputDraft;
  preserveDraft;
  constructor(tui, theme, keybindings, factory) {
    this.preserveDraft = !factory;
    this.editor = factory ? factory(tui, theme, keybindings) : new Editor(tui, theme, { paddingX: 0 });
  }
  get wantsKeyRelease() {
    return this.editor.wantsKeyRelease;
  }
  get isPasting() {
    return this.pasteBuffer !== void 0;
  }
  get focused() {
    return isFocusable(this.editor) && this.editor.focused;
  }
  set focused(value) {
    if (isFocusable(this.editor))
      this.editor.focused = value;
  }
  dispose() {
    this.focused = false;
    this.editor.onChange = void 0;
    this.editor.onSubmit = void 0;
    this.pasteBuffer = void 0;
    this.rawByMarker.clear();
    this.editor.dispose?.();
  }
  set onChange(handler) {
    this.editor.onChange = handler ? () => handler(this.getExpandedText()) : void 0;
  }
  set onSubmit(handler) {
    this.editor.onSubmit = handler ? (value) => {
      handler(this.decode(this.inputDraft !== void 0 && value === this.inputDraft.trim() ? this.inputDraft : value));
    } : void 0;
  }
  handleInput(data) {
    if (this.pasteBuffer !== void 0) {
      this.pasteBuffer += data;
      this.flushPasteBuffer();
      return;
    }
    if (matchesKey(data, Key.backspace)) {
      this.forwardInput(data);
      return;
    }
    const pasteStart = data.indexOf(BRACKETED_PASTE_START);
    if (pasteStart >= 0) {
      if (pasteStart > 0)
        this.forwardInput(data.slice(0, pasteStart));
      this.pasteBuffer = data.slice(pasteStart + BRACKETED_PASTE_START.length);
      this.flushPasteBuffer();
      return;
    }
    if ([...data].some((character) => isUnsafeDirectEditorCharacter(character) || this.rawByMarker.has(character))) {
      this.forwardInput(this.encode(data));
      return;
    }
    this.forwardInput(data);
  }
  forwardInput(data) {
    this.inputDraft = this.preserveDraft ? this.editor.getExpandedText?.() ?? this.editor.getText() : void 0;
    try {
      this.editor.handleInput(data);
    } finally {
      this.inputDraft = void 0;
    }
  }
  handleMouse(event) {
    return this.editor.handleMouse?.(event);
  }
  render(width) {
    return this.editor.render(width).map((line) => [...line].map((character) => this.rawByMarker.has(character) ? " " : character).join(""));
  }
  invalidate() {
    this.editor.invalidate();
  }
  setText(value) {
    this.rawByMarker.clear();
    this.markerCodePoint = 57344;
    this.pasteBuffer = void 0;
    this.editor.setText(this.encode(value));
  }
  getExpandedText() {
    return this.decode(this.editor.getExpandedText?.() ?? this.editor.getText());
  }
  flushPasteBuffer() {
    if (this.pasteBuffer === void 0)
      return;
    const pasteEnd = this.pasteBuffer.indexOf(BRACKETED_PASTE_END);
    if (pasteEnd < 0)
      return;
    const raw = this.pasteBuffer.slice(0, pasteEnd);
    const remaining = this.pasteBuffer.slice(pasteEnd + BRACKETED_PASTE_END.length);
    this.pasteBuffer = void 0;
    this.forwardInput(`${BRACKETED_PASTE_START}${this.encode(raw)}${BRACKETED_PASTE_END}`);
    if (remaining)
      this.handleInput(remaining);
  }
  encode(value) {
    const forbidden = /* @__PURE__ */ new Set([
      ...value,
      ...this.editor.getExpandedText?.() ?? this.editor.getText(),
      ...this.rawByMarker.keys()
    ]);
    return [...value].map((character) => {
      if (!isUnsafeEditorCharacter(character) && !this.rawByMarker.has(character)) {
        return character;
      }
      const marker = this.nextMarker(forbidden);
      this.rawByMarker.set(marker, character);
      forbidden.add(marker);
      return marker;
    }).join("");
  }
  decode(value) {
    return [...value].map((character) => this.rawByMarker.get(character) ?? character).join("");
  }
  nextMarker(forbidden) {
    for (; ; ) {
      if (this.markerCodePoint === 63744)
        this.markerCodePoint = 983040;
      if (this.markerCodePoint === 1048574)
        this.markerCodePoint = 1048576;
      if (this.markerCodePoint > 1114109) {
        throw new Error("Questionnaire editor exhausted its safe input markers");
      }
      const marker = String.fromCodePoint(this.markerCodePoint++);
      if (!forbidden.has(marker))
        return marker;
    }
  }
};
function isUnsafeDirectEditorCharacter(character) {
  const codePoint = character.codePointAt(0) ?? 0;
  return codePoint >= 127 && codePoint <= 159 || codePoint === 8232 || codePoint === 8233 || isBidiControl(codePoint);
}
function isUnsafeEditorCharacter(character) {
  const codePoint = character.codePointAt(0) ?? 0;
  return character !== "\n" && (codePoint <= 31 || codePoint >= 127 && codePoint <= 159 || codePoint === 8232 || codePoint === 8233 || isBidiControl(codePoint));
}
function isBidiControl(codePoint) {
  return codePoint === 1564 || codePoint === 8206 || codePoint === 8207 || codePoint >= 8234 && codePoint <= 8238 || codePoint >= 8294 && codePoint <= 8297;
}

// node_modules/@narumitw/pi-tui-kit/dist/components/questionnaire.js
var BRACKETED_PASTE_START2 = "\x1B[200~";
var QuestionnaireComponent = class {
  options;
  border;
  editor;
  createEditor;
  editorGeneration = 0;
  retiredEditors = /* @__PURE__ */ new Set();
  answers;
  selectedOptions;
  page = 0;
  editorKind;
  editorOwnedKeys = /* @__PURE__ */ new Map();
  message;
  finished = false;
  disposed = false;
  _focused = false;
  localOptionRows = /* @__PURE__ */ new Map();
  optionByFrameRow = /* @__PURE__ */ new Map();
  localEditorRegion;
  editorRegion;
  mousePressedOption;
  renderedWidth = 0;
  constructor(options) {
    this.options = options;
    this.border = new HorizontalRule({
      ruleStyle: (text) => options.theme.fg("border", text)
    });
    this.answers = options.questions.map(() => void 0);
    this.selectedOptions = options.questions.map(() => 0);
    const editorTheme = {
      borderColor: (text) => options.theme.fg("accent", text),
      selectList: {
        selectedPrefix: (text) => options.theme.fg("accent", text),
        selectedText: (text) => options.theme.fg("accent", text),
        description: (text) => options.theme.fg("muted", text),
        scrollInfo: (text) => options.theme.fg("dim", text),
        noMatch: (text) => options.theme.fg("warning", text)
      }
    };
    this.createEditor = () => new RawPreservingEditor(options.tui, editorTheme, options.keybindings, options.editorFactory);
    this.editor = this.createEditor();
  }
  get wantsKeyRelease() {
    return this.editor.wantsKeyRelease || this.editorOwnedKeys.size > 0 || void 0;
  }
  get focused() {
    return this._focused;
  }
  set focused(value) {
    this._focused = value;
    this.editor.focused = value && this.editorKind !== void 0;
  }
  render(width) {
    const safeWidth = Math.max(1, width);
    this.renderedWidth = safeWidth;
    const padding = safeWidth > 1 ? " " : "";
    const contentWidth = Math.max(1, safeWidth - visibleWidth(padding));
    const border = this.border.render(safeWidth)[0] ?? "";
    this.localOptionRows = /* @__PURE__ */ new Map();
    this.localEditorRegion = void 0;
    const lines = [border, "", ...this.renderHeader(contentWidth), ""];
    const bodyStart = lines.length;
    if (this.isReviewPage())
      lines.push(...this.renderReview(contentWidth));
    else
      lines.push(...this.renderQuestion(contentWidth));
    this.optionByFrameRow = new Map([...this.localOptionRows].map(([row, option]) => [bodyStart + row, option]));
    const localEditorRegion = this.renderedLocalEditorRegion();
    this.editorRegion = localEditorRegion ? {
      start: bodyStart + localEditorRegion.start,
      end: bodyStart + localEditorRegion.end,
      width: localEditorRegion.width,
      xOffset: visibleWidth(padding)
    } : void 0;
    if (this.message) {
      lines.push(...hardWrap(this.options.theme.fg("warning", this.message), contentWidth));
    }
    lines.push("", ...wrapHintGroups(this.renderHintGroups(), contentWidth), "", border);
    return lines.map((line) => {
      if (!line || line === border)
        return line;
      return `${padding}${truncateToWidth(line, contentWidth)}`;
    });
  }
  handleInput(data) {
    if (this.finished)
      return;
    this.mousePressedOption = void 0;
    if (!this.options.isCurrent()) {
      this.finish({ kind: "closed", reason: "back" });
      return;
    }
    if (this.editorKind && (this.editor.isPasting || data.includes(BRACKETED_PASTE_START2))) {
      this.editor.handleInput(data);
      this.options.tui.requestRender();
      return;
    }
    const key = editorKeyIdentity(data);
    const release = key !== void 0 && isKeyRelease(data);
    if (release || key !== void 0 && isKeyRepeat(data) && (this.editorOwnedKeys.has(key) || this.editorKind && this.editor.wantsKeyRelease)) {
      const owner = key === void 0 ? void 0 : this.editorOwnedKeys.get(key);
      if (owner && key !== void 0) {
        if (release)
          this.editorOwnedKeys.delete(key);
        owner.handleInput(data);
        this.releaseRetiredEditors();
        this.options.tui.requestRender();
      }
      return;
    }
    if (matchesKey2(data, Key2.ctrl("c"))) {
      this.finish({ kind: "closed", reason: "close" });
      return;
    }
    if (!(this.editorKind && this.options.editorFactory) && this.options.keybindings.matches(data, "tui.select.cancel")) {
      this.finish({ kind: "closed", reason: "back" });
      return;
    }
    if (this.editorKind)
      this.handleEditorInput(data);
    else
      this.handlePageInput(data);
    this.options.tui.requestRender();
  }
  handleMouse(event) {
    if (this.finished || event.width !== this.renderedWidth)
      return void 0;
    if (!this.options.isCurrent()) {
      this.finish({ kind: "closed", reason: "back" });
      return { handled: true };
    }
    const editorRegion = this.editorRegion;
    if (this.editorKind && editorRegion && event.y >= editorRegion.start && event.y < editorRegion.end) {
      const result = this.editor.handleMouse({
        ...event,
        x: event.x - editorRegion.xOffset,
        y: event.y - editorRegion.start,
        width: editorRegion.width,
        height: editorRegion.end - editorRegion.start
      });
      return result ? { ...result, focus: true } : void 0;
    }
    if (this.editorKind)
      return void 0;
    const mappedOption = this.optionByFrameRow.get(event.y);
    if (mappedOption === void 0)
      return void 0;
    const option = event.type === "click" ? this.mousePressedOption ?? mappedOption : mappedOption;
    const question = this.options.questions[this.page];
    const optionCount = (question?.options.length ?? 0) + Number(this.options.allowCustomAnswer);
    if (option < 0 || option >= optionCount)
      return void 0;
    if (event.type === "move")
      return { handled: true };
    if (event.button !== "left")
      return void 0;
    if (event.type === "press") {
      this.mousePressedOption = option;
      const changed = this.selectedOptions[this.page] !== option;
      this.selectedOptions[this.page] = option;
      if (changed)
        this.options.tui.requestRender();
      return { handled: true, focus: true, render: changed };
    }
    if (event.type === "click") {
      this.mousePressedOption = void 0;
      this.selectedOptions[this.page] = option;
      this.submitPage();
      this.options.tui.requestRender();
      return { handled: true, render: true };
    }
    return void 0;
  }
  invalidate() {
    this.clearMouseLayout();
    this.border.invalidate();
    this.editor.invalidate();
  }
  dispose() {
    if (this.disposed)
      return;
    this.disposed = true;
    this.finished = true;
    this.clearMouseLayout();
    this.editorOwnedKeys.clear();
    this.editor.dispose();
    for (const editor of this.retiredEditors)
      editor.dispose();
    this.retiredEditors.clear();
  }
  handleEditorInput(data) {
    if (this.options.editorFactory) {
      const key = editorKeyIdentity(data);
      if (this.editor.wantsKeyRelease && key !== void 0)
        this.editorOwnedKeys.set(key, this.editor);
      this.editor.handleInput(data);
      return;
    }
    const keybindings = this.options.keybindings;
    if (keybindings.matches(data, "tui.input.newLine")) {
      this.editor.handleInput(data);
    } else if (keybindings.matches(data, "tui.input.submit")) {
      this.submitEditor(this.editor.getExpandedText());
    } else {
      this.editor.handleInput(data);
    }
  }
  handlePageInput(data) {
    const keybindings = this.options.keybindings;
    if (keybindings.matches(data, "tui.select.up")) {
      if (!this.isReviewPage())
        this.moveSelection(-1);
      return;
    }
    if (keybindings.matches(data, "tui.select.down")) {
      if (!this.isReviewPage())
        this.moveSelection(1);
      return;
    }
    if (keybindings.matches(data, "tui.select.confirm")) {
      this.submitPage();
      return;
    }
    if (keybindings.matches(data, "tui.input.tab")) {
      this.movePage(1);
      return;
    }
    if (data === "k") {
      if (!this.isReviewPage())
        this.moveSelection(-1);
      return;
    }
    if (data === "j") {
      if (!this.isReviewPage())
        this.moveSelection(1);
      return;
    }
    if (matchesKey2(data, Key2.right)) {
      this.movePage(1);
      return;
    }
    if (matchesKey2(data, Key2.shift("tab")) || matchesKey2(data, Key2.left)) {
      this.movePage(-1);
      return;
    }
    if (this.options.allowNotes && noteShortcutAvailable(keybindings) && data.toLowerCase() === "n") {
      if (this.isReviewPage())
        this.message = "Return to a question to add or edit its note.";
      else
        this.editNote();
    }
  }
  renderHintGroups() {
    const { theme, tui } = this.options;
    const keybindings = componentKeybindings(tui, this.options.keybindings);
    const cancel = cancelHint(theme, keybindings);
    if (this.editorKind) {
      if (this.options.editorFactory) {
        return [theme.fg("muted", "Use editor keybindings"), rawKeyHint(theme, "Ctrl+C", "cancel")];
      }
      return [
        keybindingHint(theme, keybindings, "tui.input.submit", this.editorKind === "answer" && !this.hasReviewPage() ? "submit" : "save"),
        keybindingHint(theme, keybindings, "tui.input.newLine", "newline"),
        cancel
      ];
    }
    const questions = this.hasReviewPage() ? rawKeyHint(theme, questionNavigationKeys(keybindings, (key) => componentKeyAvailable(tui, key)), "questions") : "";
    if (this.isReviewPage()) {
      return [keybindingHint(theme, keybindings, "tui.select.confirm", "submit"), cancel, questions];
    }
    return [
      rawKeyHint(theme, selectionNavigationKeys(keybindings), "navigate"),
      keybindingHint(theme, keybindings, "tui.select.confirm", this.hasReviewPage() ? "select" : "submit"),
      cancel,
      questions,
      ...this.options.allowNotes && noteShortcutAvailable(keybindings) && componentKeyAvailable(tui, "n") ? [rawKeyHint(theme, "n", "note")] : []
    ];
  }
  movePage(delta) {
    const pageCount = this.options.questions.length + Number(this.hasReviewPage());
    this.page = (this.page + delta + pageCount) % pageCount;
    const answer = this.answers[this.page];
    const question = this.options.questions[this.page];
    if (answer?.wasCustom && question) {
      this.selectedOptions[this.page] = question.options.length;
    } else if (answer?.optionIndex !== void 0) {
      this.selectedOptions[this.page] = answer.optionIndex - 1;
    }
    this.message = void 0;
  }
  renderHeader(width) {
    if (!this.hasReviewPage()) {
      const question = this.options.questions[0];
      if (!question)
        return [];
      const header = sanitizeQuestionnaireText(question.header) || "Question 1";
      return [this.options.theme.fg("muted", truncateToWidth(header, width, "\u2026"))];
    }
    return this.renderTabs(width);
  }
  renderTabs(width) {
    const reviewTab = sanitizeQuestionnaireText(this.options.labels.reviewTab) || "Review";
    const tabs = [
      ...this.options.questions.map((question, index) => {
        const label = sanitizeQuestionnaireText(question.header) || `Question ${index + 1}`;
        const answered = this.answers[index] ? "\u2713 " : "";
        return this.page === index ? `[${answered}${label}]` : `${answered}${label}`;
      }),
      ...this.hasReviewPage() ? [this.isReviewPage() ? `[${reviewTab}]` : reviewTab] : []
    ];
    const lines = [];
    let line = "";
    for (const tab of tabs) {
      const boundedTab = truncateToWidth(tab, width, "\u2026");
      const candidate = line ? `${line}  ${boundedTab}` : boundedTab;
      if (line && visibleWidth(candidate) > width) {
        lines.push(this.options.theme.fg("accent", line));
        line = boundedTab;
      } else {
        line = candidate;
      }
    }
    if (line)
      lines.push(this.options.theme.fg("accent", line));
    return lines;
  }
  renderQuestion(width) {
    const question = this.options.questions[this.page];
    if (!question)
      return [];
    const lines = hardWrap(this.options.theme.fg("accent", this.options.theme.bold(sanitizeQuestionnaireText(question.prompt))), width);
    lines.push("");
    question.options.forEach((option, index) => {
      const selected = this.selectedOptions[this.page] === index;
      const cursor = selected ? "\u2192" : " ";
      const label = `${cursor} ${index + 1}. ${sanitizeQuestionnaireText(option.label)}`;
      const chosen = this.answers[this.page]?.optionIndex === index + 1;
      const description = option.description ? ` \u2014 ${sanitizeQuestionnaireText(option.description)}` : "";
      const line = selected ? this.options.theme.fg("accent", `${label}${chosen ? " \u2713" : ""}${description}`) : `${this.options.theme.fg("text", label)}${chosen ? this.options.theme.fg("success", " \u2713") : ""}${description ? this.options.theme.fg("muted", description) : ""}`;
      const rendered = hardWrapWithIndent(line, width, visibleWidth(`${cursor} ${index + 1}. `));
      const start = lines.length;
      lines.push(...rendered);
      for (let row = start; row < start + rendered.length; row += 1)
        this.localOptionRows.set(row, index);
    });
    if (this.options.allowCustomAnswer) {
      const custom = this.renderCustomOption(question);
      const start = lines.length;
      lines.push(...custom);
      for (let row = start; row < start + custom.length; row += 1) {
        this.localOptionRows.set(row, question.options.length);
      }
    }
    const answer = this.answers[this.page];
    if (answer?.wasCustom) {
      lines.push(...labeledRaw(this.options.labels.answer, answer.answer, width, this.options.theme));
    }
    if (answer?.note) {
      lines.push(...labeledRaw(this.options.labels.note, answer.note, width, this.options.theme));
    }
    if (this.editorKind) {
      lines.push("", this.options.theme.fg("accent", sanitizeQuestionnaireText(this.editorKind === "answer" ? this.options.labels.customAnswer : this.options.labels.optionalNote)));
      const editorLines = this.editor.render(width);
      const start = lines.length;
      lines.push(...editorLines);
      this.localEditorRegion = { start, end: start + editorLines.length, width };
    }
    return lines;
  }
  renderCustomOption(question) {
    const customIndex = question.options.length;
    const selected = this.selectedOptions[this.page] === customIndex;
    const cursor = selected ? "\u2192" : " ";
    const label = `${cursor} ${customIndex + 1}. ${sanitizeQuestionnaireText(this.options.labels.otherOption)}`;
    const chosen = this.answers[this.page]?.wasCustom === true;
    return [
      selected ? this.options.theme.fg("accent", `${label}${chosen ? " \u2713" : ""}`) : `${this.options.theme.fg("text", label)}${chosen ? this.options.theme.fg("success", " \u2713") : ""}`
    ];
  }
  renderReview(width) {
    const reviewTitle = sanitizeQuestionnaireText(this.options.labels.reviewTitle) || "Review answers";
    const lines = [this.options.theme.fg("accent", this.options.theme.bold(reviewTitle)), ""];
    const noteLabel = sanitizeQuestionnaireText(this.options.labels.note) || "Note";
    this.options.questions.forEach((question, index) => {
      const answer = this.answers[index];
      const header = sanitizeQuestionnaireText(question.header) || `Question ${index + 1}`;
      const label = `${index + 1}. ${header}`;
      const summary = ` \u2014 ${inlineSummary(answer?.answer ?? "Unanswered")}${answer?.note ? ` \xB7 ${noteLabel}: ${inlineSummary(answer.note)}` : ""}`;
      const line = `${this.options.theme.fg("text", label)}${this.options.theme.fg("muted", summary)}`;
      lines.push(...hardWrapWithIndent(line, width, visibleWidth(`${index + 1}. `)));
    });
    return lines;
  }
  moveSelection(delta) {
    const question = this.options.questions[this.page];
    const optionCount = (question?.options.length ?? 0) + Number(this.options.allowCustomAnswer);
    if (optionCount === 0)
      return;
    this.selectedOptions[this.page] = ((this.selectedOptions[this.page] ?? 0) + delta + optionCount) % optionCount;
  }
  submitPage() {
    if (this.isReviewPage()) {
      if (this.answers.some((answer) => !answer)) {
        this.message = "Answer every question before submitting.";
        return;
      }
      this.finish({
        kind: "submitted",
        answers: this.answers.filter((answer) => answer !== void 0)
      });
      return;
    }
    const question = this.options.questions[this.page];
    if (!question)
      return;
    const selected = this.selectedOptions[this.page] ?? 0;
    if (this.options.allowCustomAnswer && selected === question.options.length) {
      this.beginEditor("answer", this.answers[this.page]?.wasCustom ? this.answers[this.page]?.answer : "");
      return;
    }
    const option = question.options[selected];
    if (!option)
      return;
    const previous = this.answers[this.page];
    this.answers[this.page] = answerFor(question.id, option.label, {
      wasCustom: false,
      optionIndex: selected + 1,
      note: previous?.optionIndex === selected + 1 ? previous.note : void 0
    });
    this.advance();
  }
  editNote() {
    const index = this.page;
    let answer = this.answers[index];
    const question = this.options.questions[index];
    const selected = this.selectedOptions[index] ?? 0;
    if (question && this.options.allowCustomAnswer && selected === question.options.length && !answer?.wasCustom) {
      this.beginEditor("answer", "");
      return;
    }
    if (question && selected < question.options.length && answer?.optionIndex !== selected + 1) {
      const option = question.options[selected];
      if (option) {
        answer = answerFor(question.id, option.label, {
          wasCustom: false,
          optionIndex: selected + 1
        });
        this.answers[index] = answer;
      }
    }
    if (!answer) {
      this.message = "Select an answer before adding a note.";
      return;
    }
    this.beginEditor("note", answer.note ?? "");
  }
  releaseRetiredEditors() {
    const owners = new Set(this.editorOwnedKeys.values());
    for (const editor of this.retiredEditors) {
      if (owners.has(editor))
        continue;
      this.retiredEditors.delete(editor);
      editor.dispose();
    }
  }
  beginEditor(kind, value) {
    if (this.options.editorFactory && this.editorGeneration > 0) {
      const next = this.createEditor();
      this.retiredEditors.add(this.editor);
      this.editor = next;
      this.releaseRetiredEditors();
    }
    const generation = ++this.editorGeneration;
    this.editor.onChange = () => {
      if (!this.finished && generation === this.editorGeneration && this.editorKind)
        this.message = void 0;
    };
    this.editor.onSubmit = (text) => {
      if (generation === this.editorGeneration)
        this.submitEditor(text);
    };
    this.editorKind = kind;
    this.editor.setText(value ?? "");
    this.editor.focused = this._focused;
    this.message = void 0;
  }
  submitEditor(value) {
    if (this.finished || !this.editorKind)
      return;
    if (!this.options.isCurrent()) {
      this.finish({ kind: "closed", reason: "back" });
      return;
    }
    if (this.options.maxTextLength !== void 0 && value.length > this.options.maxTextLength) {
      this.editor.setText(value);
      this.message = `${this.editorKind === "answer" ? "Answer" : "Note"} must be ${formatLimit(this.options.maxTextLength)} characters or fewer.`;
      this.options.tui.requestRender();
      return;
    }
    const index = this.page;
    if (this.editorKind === "answer") {
      if (!value.trim()) {
        this.editor.setText(value);
        this.message = "Custom answer cannot be empty.";
        this.options.tui.requestRender();
        return;
      }
      const question = this.options.questions[index];
      if (!question)
        return;
      const previous = this.answers[index];
      this.answers[index] = answerFor(question.id, value, {
        wasCustom: true,
        note: previous?.wasCustom ? previous.note : void 0
      });
      this.editor.setText("");
      this.editorKind = void 0;
      this.editor.focused = false;
      this.advance();
      if (!this.finished)
        this.options.tui.requestRender();
      return;
    }
    const answer = this.answers[index];
    if (answer)
      answer.note = value.trim() ? value : void 0;
    this.editor.setText("");
    this.editorKind = void 0;
    this.editor.focused = false;
    this.message = value.trim() ? "Note saved." : "Note cleared.";
    this.options.tui.requestRender();
  }
  advance() {
    if (!this.hasReviewPage()) {
      const answers = this.answers.filter((answer) => answer !== void 0);
      this.finish({ kind: "submitted", answers });
      return;
    }
    this.page = Math.min(this.page + 1, this.options.questions.length);
    this.message = void 0;
  }
  hasReviewPage() {
    return this.options.questions.length > 1;
  }
  isReviewPage() {
    return this.hasReviewPage() && this.page === this.options.questions.length;
  }
  finish(value) {
    if (this.finished)
      return;
    this.finished = true;
    this.clearMouseLayout();
    this.editor.focused = false;
    this.options.onDone(value);
  }
  renderedLocalEditorRegion() {
    return this.localEditorRegion;
  }
  clearMouseLayout() {
    this.renderedWidth = 0;
    this.mousePressedOption = void 0;
    this.localOptionRows.clear();
    this.optionByFrameRow.clear();
    this.localEditorRegion = void 0;
    this.editorRegion = void 0;
  }
};
function editorKeyIdentity(data) {
  const withoutModifiers = data.replace(/;\d+(?::[123])?([u~ABCDHF])$/u, ";1$1");
  const named = parseKey(data) ?? parseKey(withoutModifiers);
  if (named !== void 0)
    return named.replace(/^(?:(?:shift|ctrl|alt|super)\+)+/u, "");
  const csi = withoutModifiers.startsWith("\x1B[") ? withoutModifiers.slice(2).match(/^(\d+)(?::\d*)?(?::(\d+))?(?:;\d+)?(?::[123])?([u~ABCDHF])$/u) : void 0;
  return csi ? `${csi[3]}:${csi[2] ?? csi[1]}` : void 0;
}
function sanitizeQuestionnaireText(value) {
  return [...stripVTControlCharacters(value)].map((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint >= 127 && codePoint <= 159 || codePoint === 8232 || codePoint === 8233 || isBidiControl(codePoint) ? " " : character;
  }).join("");
}
function answerFor(questionId, answer, options) {
  return {
    questionId,
    answer,
    wasCustom: options.wasCustom,
    ...options.optionIndex === void 0 ? {} : { optionIndex: options.optionIndex },
    ...options.note === void 0 ? {} : { note: options.note }
  };
}
function keybindingHint(theme, keybindings, keybinding, description) {
  return rawKeyHint(theme, formatHintKeys(keybindings.getKeys(keybinding)), description);
}
function rawKeyHint(theme, keys, description) {
  if (!keys)
    return "";
  return `${theme.fg("dim", keys)}${theme.fg("muted", ` ${description}`)}`;
}
function cancelHint(theme, keybindings) {
  return rawKeyHint(theme, formatHintKeys([...keybindings.getKeys("tui.select.cancel"), "ctrl+c"]), "cancel");
}
function selectionNavigationKeys(keybindings) {
  const up = keybindings.getKeys("tui.select.up");
  const down = keybindings.getKeys("tui.select.down");
  if (up.includes("up") && down.includes("down")) {
    return formatHintKeys(["\u2191\u2193", ...up.filter((key) => key !== "up"), ...down.filter((key) => key !== "down")]);
  }
  return formatHintKeys([...up, ...down]);
}
function questionNavigationKeys(keybindings, available) {
  const conflictingKeys = new Set(["tui.select.cancel", "tui.select.up", "tui.select.down", "tui.select.confirm"].flatMap((binding) => keybindings.getKeys(binding)));
  const keys = keybindings.getKeys("tui.input.tab").filter((key) => !conflictingKeys.has(key));
  const left = !conflictingKeys.has("left") && available("left");
  const right = !conflictingKeys.has("right") && available("right");
  if (!conflictingKeys.has("shift+tab") && available("shift+tab"))
    keys.push("shift+tab");
  if (left && right)
    keys.push("\u2190\u2192");
  else if (left)
    keys.push("\u2190");
  else if (right)
    keys.push("\u2192");
  return formatHintKeys(keys);
}
function noteShortcutAvailable(keybindings) {
  return !["tui.select.cancel", "tui.select.up", "tui.select.down", "tui.select.confirm", "tui.input.tab"].some((binding) => keybindings.getKeys(binding).includes("n"));
}
function formatHintKeys(keys) {
  return [...new Set(keys)].map(formatHintKey).join("/");
}
function formatHintKey(key) {
  return key.split("+").map((part) => process.platform === "darwin" && part.toLowerCase() === "alt" ? "option" : part).join("+");
}
function inlineSummary(value) {
  return value.split("\n").map(sanitizeQuestionnaireText).join(" \u21B5 ");
}
function labeledRaw(label, value, width, theme) {
  const safeLabel = sanitizeQuestionnaireText(label);
  const prefix = `${safeLabel}: `;
  const safe = sanitizeQuestionnaireText(value);
  const lines = hardWrap(safe, Math.max(1, width - visibleWidth(prefix)));
  return lines.map((line, index) => index === 0 ? `${theme.fg("muted", prefix)}${line}` : `${" ".repeat(visibleWidth(prefix))}${line}`);
}
function wrapHintGroups(groups, width) {
  const safeWidth = Math.max(1, width);
  const lines = [];
  let line = "";
  for (const group of groups) {
    if (!group)
      continue;
    const candidate = line ? `${line}  ${group}` : group;
    if (line && visibleWidth(candidate) > safeWidth) {
      lines.push(line);
      line = "";
    }
    if (visibleWidth(group) <= safeWidth) {
      line = line ? `${line}  ${group}` : group;
      continue;
    }
    const wrapped = hardWrap(group, safeWidth);
    lines.push(...wrapped.slice(0, -1));
    line = wrapped.at(-1) ?? "";
  }
  if (line)
    lines.push(line);
  return lines.length > 0 ? lines : [""];
}
function hardWrapWithIndent(value, width, indent) {
  const safeWidth = Math.max(1, width);
  const safeIndent = Math.min(Math.max(0, indent), Math.max(0, safeWidth - 1));
  const continuationWidth = Math.max(1, safeWidth - safeIndent);
  const columns = visibleWidth(value);
  if (columns <= safeWidth)
    return [value];
  const output = [sliceByColumn(value, 0, safeWidth)];
  for (let column = safeWidth; column < columns; column += continuationWidth) {
    output.push(`${" ".repeat(safeIndent)}${sliceByColumn(value, column, continuationWidth)}`);
  }
  return output;
}
function hardWrap(value, width) {
  const safeWidth = Math.max(1, width);
  if (!value)
    return [""];
  const output = [];
  for (const sourceLine of value.split("\n")) {
    const columns = visibleWidth(sourceLine);
    if (columns === 0)
      output.push("");
    else {
      for (let column = 0; column < columns; column += safeWidth) {
        output.push(sliceByColumn(sourceLine, column, safeWidth));
      }
    }
  }
  return output;
}
function formatLimit(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
}
export {
  QuestionnaireComponent
};
