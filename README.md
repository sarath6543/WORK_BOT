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

## Email Notification

The n8n workflow includes a **Send Email Notification** node addressed to:

```text
sarathkumar654@gmail.com
```

To actually send mail, open the node in n8n and create/select SMTP credentials. For Gmail, use Gmail SMTP with an app password or configure a Gmail/OAuth credential according to your n8n setup.

For the Outlook SMTP account, create an n8n **SMTP** credential with:

```text
Host: smtp-mail.outlook.com
Port: 587
User: beopredict@beo.in
Security: STARTTLS / TLS
```

Enter the SMTP password only inside n8n credentials. Do not commit it to Git.

## Local n8n Tunnel

GitHub Actions cannot call `localhost` on your computer. If n8n is running only on this machine, start a temporary public tunnel:

```powershell
.\scripts\start-n8n-tunnel.ps1
```

The script prints a value like:

```text
GitHub secret N8N_WEBHOOK_URL value: https://example.loca.lt/webhook/github-ci
```

Add that value to GitHub as the `N8N_WEBHOOK_URL` repository secret. Keep the tunnel running while GitHub Actions needs to notify local n8n.

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
