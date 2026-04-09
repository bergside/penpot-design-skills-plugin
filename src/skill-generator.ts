export interface SkillBlueprintInput {
  brandScope: string;
  designSystemName: string;
  mission: string;
  productBrand: string;
  audience: string;
  productSurface: string;
  visualStyle: string;
  typographyScale: string;
  colorPalette: string;
  spacingScale: string;
  radiusShadowMotion: string;
  frameworkNotes: string;
  doRules: string[];
  dontRules: string[];
  qaChecks: string[];
  includeReference: boolean;
  includeExamples: boolean;
  includeScript: boolean;
}

export interface GeneratedSkillFile {
  name: string;
  content: string;
}

export interface SkillGenerationResult {
  files: GeneratedSkillFile[];
  errors: string[];
  warnings: string[];
}

const SKILL_DESCRIPTION =
  "Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.";

const REQUIRED_OUTPUT_STRUCTURE = [
  "Context and goals",
  "Design tokens and foundations",
  "Component-level rules (anatomy, variants, states, responsive behavior)",
  "Accessibility requirements and testable acceptance criteria",
  "Content and tone standards with examples",
  "Anti-patterns and prohibited implementations",
  "QA checklist",
];

const REQUIRED_COMPONENT_STATES = [
  "default",
  "hover",
  "focus-visible",
  "active",
  "disabled",
  "loading",
  "error",
];

const REQUIRED_SECTIONS = [
  "## Mission",
  "## Brand",
  "## Style Foundations",
  "## Accessibility",
  "## Rules: Do",
  "## Rules: Don't",
  "## Required Output Structure",
  "## Component Rule Expectations",
  "## Quality Gates",
];

const DEFAULT_DO_RULES = [
  "Use semantic tokens, not raw hex values in component guidance.",
  "Define all required states: default, hover, focus-visible, active, disabled, loading, error.",
  "Specify responsive behavior and edge-case handling.",
];

const DEFAULT_DONT_RULES = [
  "Allow low-contrast text or hidden focus indicators.",
  "Introduce one-off spacing or typography exceptions.",
  "Use ambiguous labels or non-descriptive actions.",
];

const DEFAULT_QA_CHECKS = [
  "Frontmatter exists with valid name and description.",
  "Guidance is under 500 lines for skill.md when possible.",
  "Accessibility and interaction states are explicitly documented.",
  "Rules are concrete, testable, and non-ambiguous.",
  "Output can be reused in other repositories with only variable replacement.",
];

export function createDefaultBlueprintInput(): SkillBlueprintInput {
  return {
    brandScope: "acme-platform",
    designSystemName: "Acme Design System",
    mission:
      "Deliver consistent, accessible, implementation-ready UI guidance that scales across product surfaces.",
    productBrand: "Acme",
    audience: "Designers and frontend engineers shipping product UI",
    productSurface: "web app, dashboard",
    visualStyle: "structured, editorial, warm-neutral, high-legibility",
    typographyScale: "text-xs, text-sm, text-md, text-lg, text-xl, text-2xl",
    colorPalette:
      "bg.default=#FCF7ED, bg.surface=#FFFDF8, fg.default=#1E1A14, fg.muted=#5C5446, border.default=#D8CDBA, accent.primary=#0C7A6D, accent.primaryHover=#0A665A, danger=#B42318",
    spacingScale: "space-1=4px, space-2=8px, space-3=12px, space-4=16px, space-6=24px, space-8=32px",
    radiusShadowMotion:
      "radius-sm=4px, radius-md=8px, radius-lg=12px, shadow-sm=0 1px 2px #00000014, shadow-md=0 8px 20px #0000001A, motion-fast=120ms, motion-base=200ms",
    frameworkNotes:
      "Map tokens to CSS variables and component props in your framework layer before writing component docs.",
    doRules: DEFAULT_DO_RULES,
    dontRules: DEFAULT_DONT_RULES,
    qaChecks: DEFAULT_QA_CHECKS,
    includeReference: true,
    includeExamples: true,
    includeScript: true,
  };
}

function slugifyBrandScope(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

function normalizeLines(value: string[]): string[] {
  return value.map((line) => line.trim()).filter(Boolean);
}

function mergeUnique(base: string[], extra: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const line of [...base, ...extra]) {
    const normalized = line.trim();
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(normalized);
    }
  }

  return merged;
}

function startsWithMust(sentence: string): boolean {
  const lower = sentence.toLowerCase();
  return (
    lower.startsWith("must ") ||
    lower.startsWith("must not ") ||
    lower.startsWith("should ") ||
    lower.startsWith("should not ")
  );
}

function toMustRule(sentence: string): string {
  const trimmed = sentence.trim().replace(/^[-*]\s*/, "");
  if (!trimmed) {
    return "";
  }
  return startsWithMust(trimmed) ? trimmed : `must ${lowercaseInitial(trimmed)}`;
}

function toMustNotRule(sentence: string): string {
  const trimmed = sentence.trim().replace(/^[-*]\s*/, "");
  if (!trimmed) {
    return "";
  }
  if (trimmed.toLowerCase().startsWith("must not ")) {
    return trimmed;
  }
  if (trimmed.toLowerCase().startsWith("do not ")) {
    return `must not ${trimmed.slice(7)}`;
  }
  return `must not ${lowercaseInitial(trimmed)}`;
}

function lowercaseInitial(sentence: string): string {
  if (!sentence) {
    return sentence;
  }
  return sentence.charAt(0).toLowerCase() + sentence.slice(1);
}

function toBullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join("\n");
}

function requiresFrameworkNotes(input: SkillBlueprintInput): string {
  return input.frameworkNotes.trim()
    ? `## Framework-Specific Implementation Notes\n${input.frameworkNotes.trim()}\n\n`
    : "";
}

function buildSkillFile(input: SkillBlueprintInput, slug: string): string {
  const doRules = normalizeLines(mergeUnique(DEFAULT_DO_RULES, input.doRules)).map(toMustRule);
  const dontRules = normalizeLines(mergeUnique(DEFAULT_DONT_RULES, input.dontRules)).map(toMustNotRule);
  const qaChecks = normalizeLines(mergeUnique(DEFAULT_QA_CHECKS, input.qaChecks)).map(toMustRule);

  const now = new Date().toISOString().slice(0, 10);

  return `---
name: design-system-${slug}
description: ${SKILL_DESCRIPTION}
---

<!-- OPTIONAL MANAGED BLOCK MARKERS -->
<!-- TYPEUI_SH_MANAGED_START -->

# ${input.designSystemName.trim()}

## Mission
${input.mission.trim()}

## Brand
- Product/brand: ${input.productBrand.trim()}
- Audience: ${input.audience.trim()}
- Product surface: ${input.productSurface.trim()}

## Style Foundations
- Visual style: ${input.visualStyle.trim()}
- Typography scale: ${input.typographyScale.trim()}
- Color palette: ${input.colorPalette.trim()}
- Spacing scale: ${input.spacingScale.trim()}
- Radius/shadow/motion tokens: ${input.radiusShadowMotion.trim()}

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required
- Focus-visible rules required
- Contrast constraints required

## Writing Tone
concise, confident, implementation-focused

## Rules: Do
${toBullets(doRules)}

## Rules: Don't
${toBullets(dontRules)}

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy, variants, and interactions.
4. Add accessibility acceptance criteria.
5. Add anti-patterns and migration notes.
6. End with QA checklist.

## Required Output Structure
${toBullets(REQUIRED_OUTPUT_STRUCTURE.map((item) => `must include ${lowercaseInitial(item)}.`))}

## Component Rule Expectations
- must include keyboard, pointer, and touch behavior.
- must include spacing and typography token requirements.
- must include long-content, overflow, and empty-state handling.

${requiresFrameworkNotes(input)}## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- System consistency should be preferred over local visual exceptions.

## QA Checklist
${toBullets(qaChecks)}

## Canonical Links
- TypeUI homepage: https://www.typeui.sh
- More design skills: https://www.typeui.sh/design-skills
- Last generated: ${now}

<!-- TYPEUI_SH_MANAGED_END -->
`;
}

function buildReferenceFile(input: SkillBlueprintInput): string {
  const states = REQUIRED_COMPONENT_STATES.map((state) => `- ${state}`).join("\n");
  return `# Reference: ${input.designSystemName.trim()}

Use this reference when extending component guidance beyond the managed block in \`skill.md\`.

## Component Spec Template
- Component name
- Purpose and scope
- Anatomy map
- Variants
- Required interaction states:
${states}
- Keyboard behavior
- Touch behavior
- Empty-state and overflow handling
- Accessibility acceptance checks

## Token Mapping Checklist
- Typography token mappings
- Semantic color token mappings
- Spacing and layout token mappings
- Radius, shadow, and motion token mappings

## Documentation Links
- https://www.typeui.sh
- https://www.typeui.sh/design-skills
`;
}

function buildExamplesFile(input: SkillBlueprintInput): string {
  return `# Examples: ${input.designSystemName.trim()}

## Positive Example
- Button label is action-specific ("Save profile")
- Focus-visible ring is clearly visible
- States include default, hover, focus-visible, active, disabled, loading, error
- Tokens use semantic names instead of raw values

## Negative Example
- Label is vague ("Submit")
- Focus indicator is removed
- Hover and loading states are missing
- Hard-coded spacing and color values bypass semantic tokens

## More Examples
- Browse additional design-system skills: https://www.typeui.sh/design-skills
`;
}

function buildValidationScript(): string {
  return `#!/usr/bin/env bash
set -euo pipefail

TARGET_FILE="\${1:-skill.md}"
MISSING=0

if [[ ! -f "$TARGET_FILE" ]]; then
  echo "Missing file: $TARGET_FILE"
  exit 1
fi

require_line() {
  local PATTERN="$1"
  if ! grep -q "$PATTERN" "$TARGET_FILE"; then
    echo "Missing required pattern: $PATTERN"
    MISSING=1
  fi
}

require_line "^---$"
require_line "^name: design-system-"
require_line "^description: "
require_line "^## Mission$"
require_line "^## Style Foundations$"
require_line "^## Accessibility$"
require_line "^## Rules: Do$"
require_line "^## Rules: Don't$"
require_line "WCAG 2.2 AA"
require_line "focus-visible"
require_line "must "

LINE_COUNT="$(wc -l < "$TARGET_FILE" | tr -d ' ')"
if [[ "$LINE_COUNT" -gt 500 ]]; then
  echo "Warning: skill.md has $LINE_COUNT lines (target is under 500 when possible)."
fi

if [[ "$MISSING" -eq 1 ]]; then
  echo "Validation failed."
  exit 1
fi

echo "Validation passed."
`;
}

export function generateSkillFiles(input: SkillBlueprintInput): SkillGenerationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const files: GeneratedSkillFile[] = [];

  const slug = slugifyBrandScope(input.brandScope);

  if (!slug) {
    errors.push("Brand or scope slug is required.");
  }
  if (!input.designSystemName.trim()) {
    errors.push("Design system name is required.");
  }
  if (!input.mission.trim()) {
    errors.push("Mission is required.");
  }
  if (!input.productBrand.trim()) {
    errors.push("Product/brand is required.");
  }
  if (!input.audience.trim()) {
    errors.push("Audience is required.");
  }
  if (!input.productSurface.trim()) {
    errors.push("Product surface is required.");
  }

  if (errors.length > 0) {
    return { files, errors, warnings };
  }

  const skillContent = buildSkillFile(input, slug);
  const lineCount = skillContent.split("\n").length;
  if (lineCount > 500) {
    warnings.push(`skill.md is ${lineCount} lines. Target is under 500 lines when possible.`);
  }

  for (const section of REQUIRED_SECTIONS) {
    if (!skillContent.includes(section)) {
      errors.push(`Generated skill.md is missing section: ${section}`);
    }
  }

  for (const state of REQUIRED_COMPONENT_STATES) {
    if (!skillContent.toLowerCase().includes(state)) {
      errors.push(`Generated skill.md is missing required state: ${state}`);
    }
  }

  if (!skillContent.includes("https://www.typeui.sh")) {
    errors.push("Generated skill.md is missing TypeUI homepage link.");
  }
  if (!skillContent.includes("https://www.typeui.sh/design-skills")) {
    errors.push("Generated skill.md is missing TypeUI design skills link.");
  }

  if (errors.length > 0) {
    return { files, errors, warnings };
  }

  files.push({
    name: "skill.md",
    content: skillContent,
  });

  if (input.includeReference) {
    files.push({
      name: "reference.md",
      content: buildReferenceFile(input),
    });
  }

  if (input.includeExamples) {
    files.push({
      name: "examples.md",
      content: buildExamplesFile(input),
    });
  }

  if (input.includeScript) {
    files.push({
      name: "scripts/validate-skill.sh",
      content: buildValidationScript(),
    });
  }

  return { files, errors, warnings };
}
