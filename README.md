# Design skill files for Penpot

Use this open-source plugin for Penpot to generate design skill files for AI providers such as Claude, Codex, Gemini or Cursor and create a blueprint of your design system with style specifications including colors, typography, spacings, shadows, branded content, and more.

## What it generates

It generates a generic `skill.md` file that can be used by all major AI providers based on the [TypeUI](https://wwww.typeui.sh) manifest.

## Features

- Structured form for brand, mission, foundations, accessibility, and QA constraints
- Human-friendly token editors with add/remove rows for colors, spacing, radius, shadow, and motion
- Enforced rule language (`must` for non-negotiables, `should` for recommendations)
- Required interaction states included: `default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `error`
- Quality checks for required sections and links
- Preview, copy, and download actions inside the plugin UI

## Local development

If you want to run this locally you need to first install the dependencies:

```bash
npm install
```

And then create a local build:

```
npm run build
```

And finally run the local server:

```
npm run dev
```

Finally, use the following URL to install the plugin inside Penpot:

```text
http://localhost:4400/manifest.json
```

## License

This project is open-source under the MIT license and it was built by the authors of [TypeUI](https://wwww.typeui.sh).