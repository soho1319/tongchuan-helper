# Cloudflare Pages 部署说明

本目录已适配 Cloudflare Pages：

```text
index.html
styles.css
app.js
functions/api/generate.js
wrangler.toml
```

Cloudflare Pages Functions 必须放在项目根目录的 `functions/` 文件夹下。
Direct Upload 不能部署 Functions；如果要用 AI 接口 `/api/generate`，请用 Wrangler CLI 或 GitHub 连接部署。

## Wrangler 部署

在本目录执行：

```bash
npx wrangler pages deploy . --project-name tongchuan-helper
```

如果尚未登录：

```bash
npx wrangler login
```

## 环境变量

部署完成后，在 Cloudflare Dashboard → Workers & Pages → tongchuan-helper → Settings → Environment variables 添加：

DeepSeek：

```text
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

MiniMax：

```text
AI_PROVIDER=minimax
MINIMAX_API_KEY=你的 MiniMax API Key
MINIMAX_MODEL=MiniMax-M1
MINIMAX_BASE_URL=https://api.minimax.io/v1
```

添加变量后需要重新部署一次，或在 Cloudflare 控制台重新触发部署。
