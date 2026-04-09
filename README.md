# TypeUI Design Skill Generator for Penpot

A Penpot plugin that generates implementation-ready AI design-system guidance files from a canonical blueprint.

Built by [TypeUI](https://www.typeui.sh).
Browse more design skills at [https://www.typeui.sh/design-skills](https://www.typeui.sh/design-skills).

## What it generates

- `skill.md` (required, managed block structure aligned to the Design System Skill Blueprint)
- `reference.md` (optional)
- `examples.md` (optional)
- `scripts/validate-skill.sh` (optional)

## Features

- Structured form for brand, mission, foundations, accessibility, and QA constraints
- Human-friendly token editors with add/remove rows for colors, spacing, radius, shadow, and motion
- Enforced rule language (`must` for non-negotiables, `should` for recommendations)
- Required interaction states included: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `error`
- Quality checks for required sections and links
- Preview, copy, and download actions inside the plugin UI

## Development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run in watch mode

```bash
npm run dev
```

Load the plugin in Penpot using:

```text
http://localhost:4400/manifest.json
```

### Build

```bash
npm run build
```

## Penpot Manifest

The plugin manifest is in `public/manifest.json` and is configured as:

- Name: `TypeUI Design Skill Generator`
- Description: TypeUI-branded generator for design-system skill files
- Code entry: `plugin.js`
- Permissions: `content:read`, `allow:downloads`

## Notes

- Penpot officially documents `name`, `description`, `code`, `icon`, and `permissions` in plugin manifests.
- TypeUI authorship is reflected in the UI, package metadata, and this documentation.
