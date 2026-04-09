import "./style.css";
import {
  createDefaultBlueprintInput,
  generateSkillFiles,
  SkillBlueprintInput,
  SkillGenerationResult,
} from "./skill-generator";

// get the current theme from the URL
const searchParams = new URLSearchParams(window.location.search);
document.body.dataset.theme = searchParams.get("theme") ?? "light";

// Listen plugin.ts messages
window.addEventListener("message", (event) => {
  if (event.data.source === "penpot" && typeof event.data.theme === "string") {
    document.body.dataset.theme = event.data.theme;
  }
});

type InputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type Unit = "px" | "rem";

interface FormElements {
  brandScope: InputElement;
  designSystemName: InputElement;
  mission: InputElement;
  productBrand: InputElement;
  audience: InputElement;
  productSurface: InputElement;
  visualStyle: InputElement;
  typographyScale: InputElement;
  frameworkNotes: InputElement;
  doRules: InputElement;
  dontRules: InputElement;
  qaChecks: InputElement;
  includeReference: HTMLInputElement;
  includeExamples: HTMLInputElement;
  includeScript: HTMLInputElement;
}

interface ColorToken {
  name: string;
  purpose: string;
  value: string;
}

interface DimensionToken {
  name: string;
  value: number;
  unit: Unit;
  purpose: string;
}

interface ShadowToken {
  name: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  purpose: string;
}

interface MotionToken {
  name: string;
  duration: number;
  easing: string;
  purpose: string;
}

const DEFAULT_COLOR_TOKENS: ColorToken[] = [
  { name: "bg.default", purpose: "App canvas background", value: "#FCF7ED" },
  { name: "bg.surface", purpose: "Cards and elevated surfaces", value: "#FFFDF8" },
  { name: "fg.default", purpose: "Primary text", value: "#1E1A14" },
  { name: "fg.muted", purpose: "Secondary text", value: "#5C5446" },
  { name: "border.default", purpose: "Dividers and input strokes", value: "#D8CDBA" },
  { name: "accent.primary", purpose: "Primary action", value: "#0C7A6D" },
  { name: "accent.primaryHover", purpose: "Primary action hover", value: "#0A665A" },
  { name: "danger", purpose: "Error and destructive actions", value: "#B42318" },
];

const DEFAULT_SPACING_TOKENS: DimensionToken[] = [
  { name: "space-1", value: 4, unit: "px", purpose: "Tight inline gaps" },
  { name: "space-2", value: 8, unit: "px", purpose: "Default small spacing" },
  { name: "space-3", value: 12, unit: "px", purpose: "Compact block spacing" },
  { name: "space-4", value: 16, unit: "px", purpose: "Default section spacing" },
  { name: "space-6", value: 24, unit: "px", purpose: "Large section spacing" },
  { name: "space-8", value: 32, unit: "px", purpose: "Hero and panel spacing" },
];

const DEFAULT_RADIUS_TOKENS: DimensionToken[] = [
  { name: "radius-sm", value: 4, unit: "px", purpose: "Inputs and compact controls" },
  { name: "radius-md", value: 8, unit: "px", purpose: "Buttons and cards" },
  { name: "radius-lg", value: 12, unit: "px", purpose: "Large surfaces and dialogs" },
];

const DEFAULT_SHADOW_TOKENS: ShadowToken[] = [
  { name: "shadow-sm", x: 0, y: 1, blur: 2, spread: 0, color: "#000000", opacity: 8, purpose: "Subtle depth" },
  {
    name: "shadow-md",
    x: 0,
    y: 8,
    blur: 20,
    spread: 0,
    color: "#000000",
    opacity: 10,
    purpose: "Elevated containers",
  },
];

const DEFAULT_MOTION_TOKENS: MotionToken[] = [
  { name: "motion-fast", duration: 120, easing: "ease-out", purpose: "Hover and focus transitions" },
  { name: "motion-base", duration: 200, easing: "ease", purpose: "Panel and layout transitions" },
];

const form = document.querySelector<HTMLFormElement>("#skill-form");
const preview = document.querySelector<HTMLTextAreaElement>("#skill-preview");
const statusMessage = document.querySelector<HTMLDivElement>("#status-message");
const fileDownloads = document.querySelector<HTMLDivElement>("#file-downloads");
const generateButton = document.querySelector<HTMLButtonElement>("#generate-button");
const defaultsButton = document.querySelector<HTMLButtonElement>("#defaults-button");
const copyButton = document.querySelector<HTMLButtonElement>("#copy-button");
const downloadSkillButton = document.querySelector<HTMLButtonElement>("#download-skill-button");
const downloadAllButton = document.querySelector<HTMLButtonElement>("#download-all-button");
const colorTokens = document.querySelector<HTMLDivElement>("#color-tokens");
const spacingTokens = document.querySelector<HTMLDivElement>("#spacing-tokens");
const radiusTokens = document.querySelector<HTMLDivElement>("#radius-tokens");
const shadowTokens = document.querySelector<HTMLDivElement>("#shadow-tokens");
const motionTokens = document.querySelector<HTMLDivElement>("#motion-tokens");
const addColorToken = document.querySelector<HTMLButtonElement>("#add-color-token");
const addSpacingToken = document.querySelector<HTMLButtonElement>("#add-spacing-token");
const addRadiusToken = document.querySelector<HTMLButtonElement>("#add-radius-token");
const addShadowToken = document.querySelector<HTMLButtonElement>("#add-shadow-token");
const addMotionToken = document.querySelector<HTMLButtonElement>("#add-motion-token");

function mustHaveElement<T>(element: T | null, message: string): T {
  if (element === null) {
    throw new Error(message);
  }
  return element;
}

function queryInput(selector: string): InputElement {
  return mustHaveElement(
    document.querySelector<InputElement>(selector),
    `Missing required element: ${selector}`,
  );
}

const safeForm = mustHaveElement(form, "Missing #skill-form");
const safePreview = mustHaveElement(preview, "Missing #skill-preview");
const safeStatus = mustHaveElement(statusMessage, "Missing #status-message");
const safeFileDownloads = mustHaveElement(fileDownloads, "Missing #file-downloads");
const safeGenerateButton = mustHaveElement(generateButton, "Missing #generate-button");
const safeDefaultsButton = mustHaveElement(defaultsButton, "Missing #defaults-button");
const safeCopyButton = mustHaveElement(copyButton, "Missing #copy-button");
const safeDownloadSkillButton = mustHaveElement(downloadSkillButton, "Missing #download-skill-button");
const safeDownloadAllButton = mustHaveElement(downloadAllButton, "Missing #download-all-button");
const safeColorTokens = mustHaveElement(colorTokens, "Missing #color-tokens");
const safeSpacingTokens = mustHaveElement(spacingTokens, "Missing #spacing-tokens");
const safeRadiusTokens = mustHaveElement(radiusTokens, "Missing #radius-tokens");
const safeShadowTokens = mustHaveElement(shadowTokens, "Missing #shadow-tokens");
const safeMotionTokens = mustHaveElement(motionTokens, "Missing #motion-tokens");
const safeAddColorToken = mustHaveElement(addColorToken, "Missing #add-color-token");
const safeAddSpacingToken = mustHaveElement(addSpacingToken, "Missing #add-spacing-token");
const safeAddRadiusToken = mustHaveElement(addRadiusToken, "Missing #add-radius-token");
const safeAddShadowToken = mustHaveElement(addShadowToken, "Missing #add-shadow-token");
const safeAddMotionToken = mustHaveElement(addMotionToken, "Missing #add-motion-token");

const formElements: FormElements = {
  brandScope: queryInput("#brand-scope"),
  designSystemName: queryInput("#design-system-name"),
  mission: queryInput("#mission"),
  productBrand: queryInput("#product-brand"),
  audience: queryInput("#audience"),
  productSurface: queryInput("#product-surface"),
  visualStyle: queryInput("#visual-style"),
  typographyScale: queryInput("#typography-scale"),
  frameworkNotes: queryInput("#framework-notes"),
  doRules: queryInput("#do-rules"),
  dontRules: queryInput("#dont-rules"),
  qaChecks: queryInput("#qa-checks"),
  includeReference: mustHaveElement(
    document.querySelector<HTMLInputElement>("#include-reference"),
    "Missing #include-reference",
  ),
  includeExamples: mustHaveElement(
    document.querySelector<HTMLInputElement>("#include-examples"),
    "Missing #include-examples",
  ),
  includeScript: mustHaveElement(
    document.querySelector<HTMLInputElement>("#include-script"),
    "Missing #include-script",
  ),
};

let latestResult: SkillGenerationResult | null = null;

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toNumber(value: string, fallback: number): number {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHexColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const [, a, b, c] = trimmed;
    return `#${a}${a}${b}${b}${c}${c}`.toUpperCase();
  }
  return fallback.toUpperCase();
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  return String(Number(value.toFixed(2)));
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHexColor(hex, "#000000");
  const value = normalized.slice(1);
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function makeField(labelText: string, input: HTMLInputElement | HTMLSelectElement, sizeClass: string): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = `token-field ${sizeClass}`;

  const span = document.createElement("span");
  span.textContent = labelText;

  label.append(span, input);
  return label;
}

function createTextInput(value = "", placeholder = ""): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.placeholder = placeholder;
  return input;
}

function createNumberInput(value: number, min: number, step: number): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "number";
  input.value = String(value);
  input.min = String(min);
  input.step = String(step);
  return input;
}

function createUnitSelect(unit: Unit): HTMLSelectElement {
  const select = document.createElement("select");
  for (const value of ["px", "rem"] as const) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    if (unit === value) {
      option.selected = true;
    }
    select.appendChild(option);
  }
  return select;
}

function createRemoveButton(row: HTMLDivElement): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "remove-token";
  button.textContent = "Remove";
  button.addEventListener("click", () => {
    row.remove();
  });
  return button;
}

function createColorTokenRow(token?: Partial<ColorToken>): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "token-row color-row";

  const nameInput = createTextInput(token?.name ?? "", "accent.primary");
  nameInput.dataset.field = "name";

  const purposeInput = createTextInput(token?.purpose ?? "", "What this color is for");
  purposeInput.dataset.field = "purpose";

  const swatchInput = document.createElement("input");
  swatchInput.type = "color";
  swatchInput.value = normalizeHexColor(token?.value ?? "#000000", "#000000");
  swatchInput.dataset.field = "value";

  const hexInput = createTextInput(swatchInput.value.toUpperCase(), "#RRGGBB");
  hexInput.dataset.field = "hex";
  hexInput.maxLength = 7;

  swatchInput.addEventListener("input", () => {
    hexInput.value = swatchInput.value.toUpperCase();
  });

  hexInput.addEventListener("blur", () => {
    const normalized = normalizeHexColor(hexInput.value, swatchInput.value);
    swatchInput.value = normalized;
    hexInput.value = normalized;
  });

  row.append(
    makeField("Token", nameInput, "field-medium"),
    makeField("Purpose", purposeInput, "field-large"),
    makeField("Color", swatchInput, "field-color"),
    makeField("Hex", hexInput, "field-small"),
    createRemoveButton(row),
  );

  return row;
}

function createDimensionTokenRow(
  token: Partial<DimensionToken> | undefined,
  placeholders: { tokenName: string; purpose: string },
  rowClass: string,
): HTMLDivElement {
  const row = document.createElement("div");
  row.className = `token-row ${rowClass}`;

  const nameInput = createTextInput(token?.name ?? "", placeholders.tokenName);
  nameInput.dataset.field = "name";

  const valueInput = createNumberInput(token?.value ?? 0, 0, 0.25);
  valueInput.dataset.field = "value";

  const unitSelect = createUnitSelect(token?.unit ?? "px");
  unitSelect.dataset.field = "unit";

  const purposeInput = createTextInput(token?.purpose ?? "", placeholders.purpose);
  purposeInput.dataset.field = "purpose";

  row.append(
    makeField("Token", nameInput, "field-medium"),
    makeField("Value", valueInput, "field-small"),
    makeField("Unit", unitSelect, "field-tiny"),
    makeField("Purpose", purposeInput, "field-large"),
    createRemoveButton(row),
  );

  return row;
}

function createSpacingTokenRow(token?: Partial<DimensionToken>): HTMLDivElement {
  return createDimensionTokenRow(
    token,
    { tokenName: "space-4", purpose: "Where this spacing is used" },
    "spacing-row",
  );
}

function createRadiusTokenRow(token?: Partial<DimensionToken>): HTMLDivElement {
  return createDimensionTokenRow(
    token,
    { tokenName: "radius-md", purpose: "Controls or surfaces using this radius" },
    "radius-row",
  );
}

function createShadowTokenRow(token?: Partial<ShadowToken>): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "token-row shadow-row";

  const nameInput = createTextInput(token?.name ?? "", "shadow-md");
  nameInput.dataset.field = "name";

  const xInput = createNumberInput(token?.x ?? 0, -200, 1);
  xInput.dataset.field = "x";
  const yInput = createNumberInput(token?.y ?? 0, -200, 1);
  yInput.dataset.field = "y";
  const blurInput = createNumberInput(token?.blur ?? 0, 0, 1);
  blurInput.dataset.field = "blur";
  const spreadInput = createNumberInput(token?.spread ?? 0, -200, 1);
  spreadInput.dataset.field = "spread";

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = normalizeHexColor(token?.color ?? "#000000", "#000000");
  colorInput.dataset.field = "color";

  const hexInput = createTextInput(colorInput.value.toUpperCase(), "#RRGGBB");
  hexInput.dataset.field = "hex";
  hexInput.maxLength = 7;

  colorInput.addEventListener("input", () => {
    hexInput.value = colorInput.value.toUpperCase();
  });

  hexInput.addEventListener("blur", () => {
    const normalized = normalizeHexColor(hexInput.value, colorInput.value);
    colorInput.value = normalized;
    hexInput.value = normalized;
  });

  const opacityInput = createNumberInput(token?.opacity ?? 10, 0, 1);
  opacityInput.max = "100";
  opacityInput.dataset.field = "opacity";

  const purposeInput = createTextInput(token?.purpose ?? "", "Use case");
  purposeInput.dataset.field = "purpose";

  row.append(
    makeField("Token", nameInput, "field-medium"),
    makeField("X", xInput, "field-mini"),
    makeField("Y", yInput, "field-mini"),
    makeField("Blur", blurInput, "field-mini"),
    makeField("Spread", spreadInput, "field-mini"),
    makeField("Color", colorInput, "field-color"),
    makeField("Hex", hexInput, "field-small"),
    makeField("Opacity %", opacityInput, "field-small"),
    makeField("Purpose", purposeInput, "field-large"),
    createRemoveButton(row),
  );

  return row;
}

function createMotionTokenRow(token?: Partial<MotionToken>): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "token-row motion-row";

  const nameInput = createTextInput(token?.name ?? "", "motion-base");
  nameInput.dataset.field = "name";

  const durationInput = createNumberInput(token?.duration ?? 200, 0, 10);
  durationInput.dataset.field = "duration";

  const easingInput = createTextInput(token?.easing ?? "ease", "ease-out");
  easingInput.dataset.field = "easing";

  const purposeInput = createTextInput(token?.purpose ?? "", "Transition use case");
  purposeInput.dataset.field = "purpose";

  row.append(
    makeField("Token", nameInput, "field-medium"),
    makeField("Duration (ms)", durationInput, "field-small"),
    makeField("Easing", easingInput, "field-medium"),
    makeField("Purpose", purposeInput, "field-large"),
    createRemoveButton(row),
  );

  return row;
}

function setRows<T>(container: HTMLDivElement, rows: T[], createRow: (row: Partial<T>) => HTMLDivElement): void {
  container.innerHTML = "";
  for (const row of rows) {
    container.appendChild(createRow(row));
  }
}

function resetTokenEditors(): void {
  setRows(safeColorTokens, DEFAULT_COLOR_TOKENS, createColorTokenRow);
  setRows(safeSpacingTokens, DEFAULT_SPACING_TOKENS, createSpacingTokenRow);
  setRows(safeRadiusTokens, DEFAULT_RADIUS_TOKENS, createRadiusTokenRow);
  setRows(safeShadowTokens, DEFAULT_SHADOW_TOKENS, createShadowTokenRow);
  setRows(safeMotionTokens, DEFAULT_MOTION_TOKENS, createMotionTokenRow);
}

function queryValue(row: HTMLDivElement, selector: string): string {
  const element = row.querySelector<HTMLInputElement | HTMLSelectElement>(selector);
  return element?.value.trim() ?? "";
}

function collectColorTokens(): ColorToken[] {
  return Array.from(safeColorTokens.querySelectorAll<HTMLDivElement>(".token-row.color-row"))
    .map((row) => {
      const name = queryValue(row, "[data-field='name']");
      const purpose = queryValue(row, "[data-field='purpose']");
      const value = normalizeHexColor(queryValue(row, "[data-field='value']"), "#000000");
      return { name, purpose, value };
    })
    .filter((token) => token.name && token.value);
}

function collectDimensionTokens(container: HTMLDivElement, rowClass: string): DimensionToken[] {
  return Array.from(container.querySelectorAll<HTMLDivElement>(`.token-row.${rowClass}`))
    .map((row) => {
      const name = queryValue(row, "[data-field='name']");
      const value = toNumber(queryValue(row, "[data-field='value']"), 0);
      const unit: Unit = queryValue(row, "[data-field='unit']") === "rem" ? "rem" : "px";
      const purpose = queryValue(row, "[data-field='purpose']");
      return { name, value, unit, purpose };
    })
    .filter((token) => token.name);
}

function collectShadowTokens(): ShadowToken[] {
  return Array.from(safeShadowTokens.querySelectorAll<HTMLDivElement>(".token-row.shadow-row"))
    .map((row) => {
      const name = queryValue(row, "[data-field='name']");
      const x = toNumber(queryValue(row, "[data-field='x']"), 0);
      const y = toNumber(queryValue(row, "[data-field='y']"), 0);
      const blur = toNumber(queryValue(row, "[data-field='blur']"), 0);
      const spread = toNumber(queryValue(row, "[data-field='spread']"), 0);
      const color = normalizeHexColor(queryValue(row, "[data-field='color']"), "#000000");
      const opacity = clamp(toNumber(queryValue(row, "[data-field='opacity']"), 100), 0, 100);
      const purpose = queryValue(row, "[data-field='purpose']");
      return { name, x, y, blur, spread, color, opacity, purpose };
    })
    .filter((token) => token.name);
}

function collectMotionTokens(): MotionToken[] {
  return Array.from(safeMotionTokens.querySelectorAll<HTMLDivElement>(".token-row.motion-row"))
    .map((row) => {
      const name = queryValue(row, "[data-field='name']");
      const duration = clamp(toNumber(queryValue(row, "[data-field='duration']"), 0), 0, 10000);
      const easing = queryValue(row, "[data-field='easing']") || "ease";
      const purpose = queryValue(row, "[data-field='purpose']");
      return { name, duration, easing, purpose };
    })
    .filter((token) => token.name);
}

function withPurpose(base: string, purpose: string): string {
  return purpose ? `${base} (${purpose})` : base;
}

function formatColorPalette(tokens: ColorToken[]): string {
  return tokens.map((token) => withPurpose(`${token.name}=${token.value}`, token.purpose)).join(", ");
}

function formatDimensionTokens(tokens: DimensionToken[]): string {
  return tokens
    .map((token) => withPurpose(`${token.name}=${formatNumber(token.value)}${token.unit}`, token.purpose))
    .join(", ");
}

function formatShadowTokens(tokens: ShadowToken[]): string[] {
  return tokens.map((token) => {
    const [r, g, b] = hexToRgb(token.color);
    const alpha = Number((token.opacity / 100).toFixed(2));
    const shadowValue = `${formatNumber(token.x)}px ${formatNumber(token.y)}px ${formatNumber(token.blur)}px ${formatNumber(
      token.spread,
    )}px rgba(${r}, ${g}, ${b}, ${alpha})`;
    return withPurpose(`${token.name}=${shadowValue}`, token.purpose);
  });
}

function formatMotionTokens(tokens: MotionToken[]): string[] {
  return tokens.map((token) =>
    withPurpose(`${token.name}=${formatNumber(token.duration)}ms ${token.easing.trim() || "ease"}`, token.purpose),
  );
}

function formatRadiusShadowMotion(
  radius: DimensionToken[],
  shadows: ShadowToken[],
  motion: MotionToken[],
): string {
  const radiusStrings = radius.map((token) =>
    withPurpose(`${token.name}=${formatNumber(token.value)}${token.unit}`, token.purpose),
  );
  return [...radiusStrings, ...formatShadowTokens(shadows), ...formatMotionTokens(motion)].join(", ");
}

function setFormValues(input: SkillBlueprintInput): void {
  formElements.brandScope.value = input.brandScope;
  formElements.designSystemName.value = input.designSystemName;
  formElements.mission.value = input.mission;
  formElements.productBrand.value = input.productBrand;
  formElements.audience.value = input.audience;
  formElements.productSurface.value = input.productSurface;
  formElements.visualStyle.value = input.visualStyle;
  formElements.typographyScale.value = input.typographyScale;
  formElements.frameworkNotes.value = input.frameworkNotes;
  formElements.doRules.value = input.doRules.join("\n");
  formElements.dontRules.value = input.dontRules.join("\n");
  formElements.qaChecks.value = input.qaChecks.join("\n");
  formElements.includeReference.checked = input.includeReference;
  formElements.includeExamples.checked = input.includeExamples;
  formElements.includeScript.checked = input.includeScript;

  resetTokenEditors();
}

function collectInput(): SkillBlueprintInput {
  const colorPalette = formatColorPalette(collectColorTokens());
  const spacingScale = formatDimensionTokens(collectDimensionTokens(safeSpacingTokens, "spacing-row"));
  const radiusShadowMotion = formatRadiusShadowMotion(
    collectDimensionTokens(safeRadiusTokens, "radius-row"),
    collectShadowTokens(),
    collectMotionTokens(),
  );

  return {
    brandScope: formElements.brandScope.value,
    designSystemName: formElements.designSystemName.value,
    mission: formElements.mission.value,
    productBrand: formElements.productBrand.value,
    audience: formElements.audience.value,
    productSurface: formElements.productSurface.value,
    visualStyle: formElements.visualStyle.value,
    typographyScale: formElements.typographyScale.value,
    colorPalette,
    spacingScale,
    radiusShadowMotion,
    frameworkNotes: formElements.frameworkNotes.value,
    doRules: parseLines(formElements.doRules.value),
    dontRules: parseLines(formElements.dontRules.value),
    qaChecks: parseLines(formElements.qaChecks.value),
    includeReference: formElements.includeReference.checked,
    includeExamples: formElements.includeExamples.checked,
    includeScript: formElements.includeScript.checked,
  };
}

function showStatus(kind: "error" | "warning" | "success", lines: string[]): void {
  safeStatus.dataset.kind = kind;
  safeStatus.textContent = lines.join(" ");
}

function sanitizeFileName(name: string): string {
  return name.replace(/\//g, "__");
}

function downloadFile(name: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = sanitizeFileName(name);
  link.click();
  URL.revokeObjectURL(objectUrl);
}

function fallbackCopyText(text: string): boolean {
  const temp = document.createElement("textarea");
  temp.value = text;
  temp.setAttribute("readonly", "true");
  temp.style.position = "fixed";
  temp.style.opacity = "0";
  temp.style.pointerEvents = "none";
  temp.style.left = "-9999px";
  temp.style.top = "0";
  document.body.appendChild(temp);

  temp.focus();
  temp.select();
  temp.setSelectionRange(0, temp.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(temp);
  return copied;
}

async function copyText(text: string): Promise<"clipboard" | "fallback" | "failed"> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return "clipboard";
    } catch {
      // Fall through to legacy copy path for iframe-restricted environments.
    }
  }

  return fallbackCopyText(text) ? "fallback" : "failed";
}

function renderFileDownloads(result: SkillGenerationResult): void {
  safeFileDownloads.innerHTML = "";
  for (const file of result.files) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary";
    button.textContent = `Download ${file.name}`;
    button.addEventListener("click", () => {
      downloadFile(file.name, file.content);
    });
    safeFileDownloads.appendChild(button);
  }
}

function renderResult(result: SkillGenerationResult): void {
  latestResult = result;

  if (result.errors.length > 0) {
    safePreview.value = "";
    safeCopyButton.disabled = true;
    safeDownloadSkillButton.disabled = true;
    safeDownloadAllButton.disabled = true;
    safeFileDownloads.innerHTML = "";
    showStatus("error", result.errors);
    return;
  }

  const skillFile = result.files.find((file) => file.name.toLowerCase() === "skill.md");
  safePreview.value = skillFile?.content ?? "";
  safeCopyButton.disabled = !skillFile;
  safeDownloadSkillButton.disabled = !skillFile;
  safeDownloadAllButton.disabled = result.files.length === 0;
  renderFileDownloads(result);

  if (result.warnings.length > 0) {
    showStatus("warning", result.warnings);
    return;
  }

  showStatus("success", [
    `Generated ${result.files.length} file(s).`,
    "Source links: https://www.typeui.sh and https://www.typeui.sh/design-skills",
  ]);
}

function regenerate(): void {
  const input = collectInput();
  const result = generateSkillFiles(input);
  renderResult(result);
}

safeAddColorToken.addEventListener("click", () => {
  safeColorTokens.appendChild(createColorTokenRow());
});

safeAddSpacingToken.addEventListener("click", () => {
  safeSpacingTokens.appendChild(createSpacingTokenRow());
});

safeAddRadiusToken.addEventListener("click", () => {
  safeRadiusTokens.appendChild(createRadiusTokenRow());
});

safeAddShadowToken.addEventListener("click", () => {
  safeShadowTokens.appendChild(createShadowTokenRow());
});

safeAddMotionToken.addEventListener("click", () => {
  safeMotionTokens.appendChild(createMotionTokenRow());
});

safeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  regenerate();
});

safeGenerateButton.addEventListener("click", () => {
  regenerate();
});

safeDefaultsButton.addEventListener("click", () => {
  setFormValues(createDefaultBlueprintInput());
  regenerate();
});

safeCopyButton.addEventListener("click", async () => {
  const skillFile = latestResult?.files.find((file) => file.name.toLowerCase() === "skill.md");
  if (!skillFile) {
    return;
  }

  const copyMode = await copyText(skillFile.content);
  if (copyMode === "clipboard") {
    showStatus("success", ["Copied skill.md to clipboard."]);
    return;
  }

  if (copyMode === "fallback") {
    showStatus("success", ["Copied skill.md using compatibility mode."]);
    return;
  }

  showStatus("error", ["Clipboard copy failed. Use the preview panel to copy manually."]);
});

safeDownloadSkillButton.addEventListener("click", () => {
  const skillFile = latestResult?.files.find((file) => file.name.toLowerCase() === "skill.md");
  if (!skillFile) {
    return;
  }
  downloadFile(skillFile.name, skillFile.content);
});

safeDownloadAllButton.addEventListener("click", () => {
  const files = latestResult?.files ?? [];
  for (const file of files) {
    downloadFile(file.name, file.content);
  }
});

setFormValues(createDefaultBlueprintInput());
regenerate();
