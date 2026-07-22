# Developer Workflow Starter

This workspace starts a developer workflow using VS Code, Codex, GitHub Actions, and n8n.

## Flow

```text
Developer
  -> VS Code
  -> Codex Agent
  -> GitHub Repository
  -> GitHub Actions
  -> n8n Workflow
  -> Slack / Jira / GitHub Issue / Email / Release Notes
```

## Files

- `AGENTS.md`: durable instructions for Codex in this repository.
- `.github/workflows/ci.yml`: GitHub Actions workflow for build, test, security audit, and n8n notification.
- `workflows/n8n-github-ci-notification.json`: starter n8n workflow import file.

## First Setup

1. Open this folder in VS Code.
2. Use Codex from the IDE to create or edit application code.
3. Push this repository to GitHub.
4. In n8n, import `workflows/n8n-github-ci-notification.json`.
5. Activate the n8n workflow and copy the production webhook URL.
6. In GitHub, add a repository secret:

```text
N8N_WEBHOOK_URL=https://your-n8n-domain/webhook/github-ci
```

7. Push code or open a pull request. GitHub Actions will run and notify n8n.

## Example Codex Prompt

```text
Implement the requested feature in this repository.

Requirements:
- Keep the change scoped.
- Follow AGENTS.md.
- Add or update tests where needed.
- Run available checks.

Done when:
- Tests/build pass where available.
- Summarize changed files and verification.
```

