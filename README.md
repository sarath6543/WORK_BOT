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
- `document-collection-form/`: standalone static document collection form project.

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

Email subjects are status-specific:

```text
[CI SUCCESS] repository - branch
[CI FAILED] repository - branch
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

## Local Change Request Intake

If mail intake is not working, use the local change request endpoint:

```powershell
node .\scripts\change-request-server.js
```

Then send this from Postman:

```text
POST http://127.0.0.1:8787/change-request
Content-Type: application/json
```

Example body:

```json
{
  "title": "Update README workflow summary",
  "requester": "Sarath",
  "priority": "High",
  "description": "Add a short section explaining how a developer submits a change request and how Codex handles it.",
  "requirements": [
    "Document the local POST endpoint",
    "Explain that Codex reads the latest change request file",
    "Keep the language simple"
  ],
  "acceptance_criteria": [
    "README contains the new section",
    "GitHub Actions succeeds",
    "n8n sends the final email notification"
  ],
  "files": [
    "README.md"
  ]
}
```

The server saves a markdown file in `change-requests/`. Then ask Codex:

```text
Read the latest change request in change-requests and implement it. Run checks, commit, and push.
```

## How Codex Handles a Change Request

1. A developer sends a change request to `POST http://127.0.0.1:8787/change-request`.
2. The local server saves the request as a markdown file in `change-requests/`.
3. Codex reads the latest change request file and updates the requested files.
4. Codex runs available checks, commits the change, and pushes to GitHub.
5. GitHub Actions runs CI and calls n8n.
6. n8n sends the final success or failure email notification.

## Document Collection Form Project

The `document-collection-form/` folder contains a standalone browser form for document request intake. It validates requester and client details, requires at least one requested document, saves drafts in browser local storage, and generates a JSON payload.

Run project checks from the subfolder:

```powershell
cd document-collection-form
npm test
npm run lint
npm run build
```

GitHub Actions detects this subproject and runs the same checks on push or pull request. For future updates, create a change request that lists files under `document-collection-form/`, then ask Codex to implement the change, run checks, commit, and push.

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
