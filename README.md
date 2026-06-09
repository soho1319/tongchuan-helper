# 发售同传小助手页面工具

这是一个纯静态页面工具，可直接部署到 Cloudflare Pages、腾讯云 COS 静态网站、腾讯云轻量服务器/Nginx。

> [!info] 相关版本
> 本目录是**生产部署版**(简洁、单页、支持 DeepSeek/MiniMax/OpenAI 多 provider)。vault 里另有 [[../同传小助手/README]] —— 那是**增强版**(6 个 Tab / 35 条预制模板 / localStorage 持久化 / 移动端优化),适合个人深度使用与离线演练。两个版本互不依赖,按需选用。
> - **临时快速生成** → 用本目录(生产版)
> - **完整工作流(变量/checklist/复盘)** → 用 增强版

## 本地打开

直接双击 `index.html`，或用任意静态服务器打开。

## 功能

- 新手同传流程 checklist
- 输入直播逐字稿/现场信息，自动判断节点
- 生成多条社群同传文案、直播间评论区话术
- 给出截图/素材建议
- 给出多群一转九协作提醒
- 当前版本包含：AI 生成 + 本地规则兜底。AI Key 存在 EdgeOne Pages 环境变量中，不放在前端。

## 部署到 Cloudflare Pages

1. 新建 GitHub 仓库，把本文件夹内容上传到仓库根目录。
2. Cloudflare Dashboard → Workers & Pages → Create application → Pages。
3. 连接 GitHub 仓库。
4. Build command 留空。
5. Output directory 填 `/`。
6. Deploy。

如果整个 Obsidian 仓库一起上传，则 Output directory 可填：`发售岗位/同传小助手页面`。

## 部署到腾讯云 COS 静态网站

1. 腾讯云 COS 创建存储桶。
2. 上传本文件夹内的 `index.html`、`styles.css`、`app.js`。
3. 开启「静态网站」功能。
4. 默认首页设置为 `index.html`。
5. 绑定自定义域名和 CDN（可选）。

## 部署到腾讯云轻量服务器/Nginx

把本文件夹上传到服务器，例如：

```bash
/var/www/tongchuan-helper
```

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/tongchuan-helper;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

然后执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 后续升级建议

如果想要更强的 AI 改写能力，不建议把大模型 API Key 放在浏览器前端。建议新增 Cloudflare Worker / 腾讯云函数作为后端代理，把 API Key 放在服务端环境变量里。

## AI 版本部署说明：EdgeOne Pages Functions

本项目已新增函数：

```text
edge-functions/api/generate.js
```

部署到 EdgeOne Pages 后，会自动生成接口：

```text
/api/generate
```

EdgeOne Pages Functions 官方要求函数放在 `./edge-functions/api` 目录下，并通过 `onRequestPost(context)` 这类 Handler 处理请求。

### 必配环境变量

在 EdgeOne Pages 项目设置里添加环境变量：

```text
OPENAI_API_KEY=你的模型服务 API Key
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

如果你用的是其它 OpenAI-compatible 服务，也可以改为对应地址，例如：

```text
OPENAI_BASE_URL=https://你的服务商域名/v1
OPENAI_MODEL=你的模型名
```

也兼容以下变量名：

```text
AI_API_KEY
AI_MODEL
AI_BASE_URL
```

### 前端使用

页面里点击：

```text
AI 生成 N 份
```

会把以下信息发到 `/api/generate`：

- 当前节点
- 讲师/IP
- 直播入口
- 产品/福利/名额
- 生成份数 N
- 文案风格
- 直播逐字稿/现场信息

函数返回：

- N 条社群同传文案
- 3-6 条直播间评论区话术
- 截图/素材建议
- 多群协作提醒

### 安全提醒

不要把 API Key 写入 `app.js` 或 `index.html`。只放在 EdgeOne Pages 的服务端环境变量中。

## 使用 DeepSeek 或 MiniMax

后端函数已支持 DeepSeek、MiniMax、OpenAI-compatible 自定义服务。

### 方案 1：DeepSeek（推荐性价比）

EdgeOne Pages 环境变量：

```text
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

也可以换成 DeepSeek 控制台当前可用的其它模型名。

### 方案 2：MiniMax

EdgeOne Pages 环境变量：

```text
AI_PROVIDER=minimax
MINIMAX_API_KEY=你的 MiniMax API Key
MINIMAX_MODEL=MiniMax-M1
MINIMAX_BASE_URL=https://api.minimax.io/v1
```

如果 MiniMax 控制台给你的模型名不同，把 `MINIMAX_MODEL` 替换成控制台显示的可用模型即可。

### 方案 3：任意 OpenAI-compatible 服务

```text
AI_PROVIDER=custom
AI_API_KEY=你的 API Key
AI_MODEL=你的模型名
AI_BASE_URL=https://你的服务商域名/v1
```

### 优先级

函数读取 Key 的优先级：

```text
DEEPSEEK_API_KEY > MINIMAX_API_KEY > OPENAI_API_KEY > AI_API_KEY
```

只部署一个服务商时，建议只填该服务商的一组变量，避免混淆。
