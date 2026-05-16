<div align="center">

<img src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNW1lOWFucnlscXdkaDhreGE4ejZ5eGg3ZHJlcGpseWN5aGwyaTc1ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/JXibbAa7ysN9K/giphy.gif" alt="Coolify Deploy Action" width="480" height="270" style="border-radius: 10px;" />

<p>
  <img src="https://img.shields.io/badge/GitHub_Action-2088FF?style=flat-square&logo=githubactions&logoColor=white" alt="github-action">
  <img src="https://img.shields.io/badge/Coolify-18181B?style=flat-square&logo=coolify&logoColor=white" alt="coolify">
  <img src="https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="cloudflare">
  <img src="https://img.shields.io/badge/Node.js_20-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="nodejs">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="javascript">
</p>

<p>
  <a href="../../issues">
    <img src="https://img.shields.io/badge/Report_Bug-DC143C?style=for-the-badge&logo=github&logoColor=white" alt="bug">
  </a>
  <a href="../../issues">
    <img src="https://img.shields.io/badge/Request_Feature-4285F4?style=for-the-badge&logo=github&logoColor=white" alt="feature">
  </a>
</p>

</div>

<hr />

# 🚀 Coolify Deploy Action

> **Reusable JavaScript GitHub Action for deploying to Coolify with optional Cloudflare Bot Fight Mode bypass, post-action cleanup, GitHub Deployments, and automatic app URL resolution.**

`ilhmlnaa/coolify-deploy` turns repeated Coolify deployment workflow patterns into a single reusable action. It can temporarily disable Cloudflare Bot Fight Mode before triggering Coolify deploy webhooks, then automatically restore it in a `post:` step that runs even when the job fails or is cancelled.

---

## 📑 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Inputs](#-inputs)
- [Outputs](#-outputs)
- [Usage Examples](#-usage-examples)
- [Auto App URL](#-auto-app-url)
- [Cloudflare Bot Fight Mode Bypass](#-cloudflare-bot-fight-mode-bypass)
- [GitHub Deployments](#-github-deployments)
- [Permissions Required](#-permissions-required)
- [Development](#-development)
- [License](#-license)

---

## ✨ Features

- **🚀 Coolify Webhook Deploys**
  - Trigger one or many Coolify deploy webhooks from a single workflow step.
  - Supports comma-separated and newline-separated webhook URL input.
- **🛡️ Cloudflare Bot Fight Mode Bypass**
  - Optionally disables Bot Fight Mode before deploy.
  - Uses a JavaScript action `post:` step to restore Bot Fight Mode after the job.
- **🧹 Reliable Cleanup**
  - Cleanup uses `post-if: always()` so restoration runs on success, failure, or cancellation.
- **📦 GitHub Deployment API**
  - Optionally creates GitHub Deployment records and deployment statuses.
- **🔎 Auto App URL Resolution**
  - Resolves `environment_url` from Coolify application `fqdn` via deployment UUID.
- **🧩 Reusable Workflow Primitive**
  - Designed to replace repeated deploy snippets across projects like `zenime-next`, `askpdf-ai`, and `crawlix-next`.

---

## ⚡ Quick Start

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: ilhmlnaa/coolify-deploy@v1
        with:
          coolify_webhook_url: ${{ secrets.COOLIFY_WEBHOOK_URL }}
          coolify_token: ${{ secrets.COOLIFY_TOKEN }}
```

---

## ⚙️ Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `coolify_webhook_url` | ✅ | — | Coolify webhook URL(s). Supports comma-separated or newline-separated values for multi-service deploys. |
| `coolify_token` | ✅ | — | Coolify API Bearer token used for deploy webhook calls and optional app URL resolution. |
| `cloudflare_api_token` | ❌ | `''` | Cloudflare API token. When provided with `cloudflare_zone_id`, enables Bot Fight Mode bypass in `auto` mode. |
| `cloudflare_zone_id` | ❌ | `''` | Cloudflare Zone ID. Required when `cloudflare_api_token` is set. |
| `bypass_cloudflare_bot` | ❌ | `auto` | `true`, `false`, or `auto`. `auto` enables bypass only when Cloudflare credentials are provided. |
| `propagation_delay` | ❌ | `15` | Seconds to wait after disabling Bot Fight Mode before triggering Coolify deploys. |
| `create_github_deployment` | ❌ | `false` | Set to `true` to create GitHub Deployment records. |
| `deployment_environment` | ❌ | `production` | Environment name for GitHub Deployment API. |
| `app_url` | ❌ | `''` | Deployment environment URL. Use `auto` to resolve from Coolify API `fqdn`, pass an explicit URL, or leave empty. |
| `github_token` | ❌ | `${{ github.token }}` | GitHub token for Deployment API. Usually the default is enough. |

---

## 📤 Outputs

| Output | Description |
| --- | --- |
| `deployment_status` | `success` or `failure`, based on Coolify webhook results. |
| `deployed_services` | Number of services successfully deployed. |
| `bot_mode_restored` | `true`, `false`, `skipped`, or `pending`. The final value is emitted by the post step when available. |
| `github_deployment_id` | GitHub Deployment ID if deployment creation is enabled. |
| `resolved_app_url` | Resolved app URL when `app_url: auto` succeeds, or explicit `app_url` value. |

---

## 🧪 Usage Examples

### Basic Deploy

```yaml
- uses: ilhmlnaa/coolify-deploy@v1
  with:
    coolify_webhook_url: ${{ secrets.COOLIFY_WEBHOOK_URL }}
    coolify_token: ${{ secrets.COOLIFY_TOKEN }}
```

### With Cloudflare Bypass

```yaml
- uses: ilhmlnaa/coolify-deploy@v1
  with:
    coolify_webhook_url: ${{ secrets.COOLIFY_WEBHOOK_URL }}
    coolify_token: ${{ secrets.COOLIFY_TOKEN }}
    cloudflare_api_token: ${{ secrets.CF_API_TOKEN }}
    cloudflare_zone_id: ${{ secrets.CF_ZONE_ID }}
```

### Multi-Service Deploy

```yaml
- uses: ilhmlnaa/coolify-deploy@v1
  with:
    coolify_webhook_url: |
      ${{ secrets.API_WEBHOOK }},
      ${{ secrets.WORKER_WEBHOOK }},
      ${{ secrets.WEB_WEBHOOK }}
    coolify_token: ${{ secrets.COOLIFY_TOKEN }}
```

### Full Featured Deploy

```yaml
permissions:
  contents: read
  deployments: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: ilhmlnaa/coolify-deploy@v1
        with:
          coolify_webhook_url: |
            ${{ secrets.API_WEBHOOK }},
            ${{ secrets.WORKER_WEBHOOK }},
            ${{ secrets.WEB_WEBHOOK }}
          coolify_token: ${{ secrets.COOLIFY_TOKEN }}
          cloudflare_api_token: ${{ secrets.CF_API_TOKEN }}
          cloudflare_zone_id: ${{ secrets.CF_ZONE_ID }}
          create_github_deployment: 'true'
          deployment_environment: 'production'
          app_url: 'auto'
```

More complete workflow examples are available in [`examples/`](examples/).

---

## 🔎 Auto App URL

When `app_url` is set to `auto`, the action extracts the Coolify instance base URL and app UUID from the first webhook URL:

```text
https://coolify.example.com/api/v1/deploy?uuid=abc123
```

It then calls:

```text
GET https://coolify.example.com/api/v1/applications/abc123
```

If Coolify returns:

```json
{ "fqdn": "https://myapp.com,https://www.myapp.com" }
```

The action uses the first URL:

```text
https://myapp.com
```

> **Note:** Auto app URL resolution requires a Coolify token with permission to read applications. If the lookup fails, deployment still continues and the GitHub Deployment status is created without `environment_url`.

---

## 🛡️ Cloudflare Bot Fight Mode Bypass

Some Coolify deploy webhooks can be blocked when Cloudflare Bot Fight Mode is enabled in front of the Coolify instance. This action can temporarily disable Bot Fight Mode before deployment and restore it afterwards.

The lifecycle is:

1. Read current Cloudflare Bot Fight Mode state.
2. Disable Bot Fight Mode.
3. Save the original state via `core.saveState()`.
4. Wait for `propagation_delay` seconds.
5. Trigger Coolify deploy webhook(s).
6. Run `post:` cleanup with `post-if: always()`.
7. Re-enable Bot Fight Mode only if it was originally enabled.

This means the action does not blindly enable Bot Fight Mode. It restores the original state.

---

## 📦 GitHub Deployments

Set `create_github_deployment` to `true` to create a GitHub Deployment record and status.

```yaml
permissions:
  contents: read
  deployments: write

steps:
  - uses: ilhmlnaa/coolify-deploy@v1
    with:
      coolify_webhook_url: ${{ secrets.COOLIFY_WEBHOOK_URL }}
      coolify_token: ${{ secrets.COOLIFY_TOKEN }}
      create_github_deployment: 'true'
      deployment_environment: 'production'
      app_url: 'auto'
```

Deployment status is set to:

- `success` when all Coolify webhook calls return `2xx`
- `failure` when one or more webhook calls fail

---

## 🔐 Permissions Required

### GitHub Workflow Permissions

For normal deploy-only usage:

```yaml
permissions:
  contents: read
```

For GitHub Deployment API usage:

```yaml
permissions:
  contents: read
  deployments: write
```

### Coolify Token

The Coolify token should be able to:

- Trigger deploy webhooks.
- Read application details if `app_url: auto` is used.

### Cloudflare Token

For Bot Fight Mode bypass, the Cloudflare token needs permission to read and edit zone bot management settings for the target zone.

Recommended scope:

- Zone: Read
- Bot Management: Edit, if available for your account/plan

Cloudflare API permission names can vary by account features and plan. Use the minimum permissions that allow access to:

```text
GET /client/v4/zones/{zone_id}/bot_management
PUT /client/v4/zones/{zone_id}/bot_management
```

---

## 🛠 Development

### Install Dependencies

```bash
npm install
```

### Build Bundled Action Files

```bash
npm run build
```

This creates:

```text
dist/main/index.js
dist/post/index.js
```

`dist/` must be committed because JavaScript GitHub Actions run from the bundled files.

### Lint

```bash
npm run lint
```

### Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 📁 Project Structure

```text
coolify-deploy/
├── action.yml
├── package.json
├── src/
│   ├── main.js
│   ├── post.js
│   ├── cloudflare.js
│   ├── coolify.js
│   ├── deployment.js
│   └── utils.js
├── dist/
│   ├── main/index.js
│   └── post/index.js
├── .github/workflows/test.yml
├── examples/
│   ├── basic.yml
│   ├── with-cloudflare.yml
│   ├── multi-service.yml
│   └── full-featured.yml
├── README.md
├── LICENSE
└── .gitignore
```

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
