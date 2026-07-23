# Document Collection Form

This is a React, TypeScript, and Tailwind CSS project for collecting document request details.

## Files

- `index.html`: Vite HTML shell.
- `src/App.tsx`: form UI, validation, draft saving, reset, and JSON output behavior.
- `src/main.tsx`: React entry point.
- `src/styles.css`: Tailwind CSS entry point and component classes.
- `test/app.test.js`: lightweight Node tests for the expected form contract.
- `tailwind.config.js`: Tailwind content configuration.
- `vite.config.ts`: Vite React configuration.

## Use Locally

Install dependencies and start the Vite dev server:

```powershell
npm install
npm run dev
```

Then open the local URL printed by Vite, usually `http://localhost:5173/`.

## Checks

```powershell
npm test
npm run lint
npm run build
```

Run the commands from this folder.

## Codex Change Workflow

1. Put change requests in the repository `change-requests/` flow or ask Codex directly.
2. Reference files under `document-collection-form/` when requesting form changes.
3. Ask Codex to implement the change, run checks, commit, and push when ready.
4. GitHub Actions will run this project checks after the repository is pushed.
