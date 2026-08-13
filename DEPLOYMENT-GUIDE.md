# 辣椒养护协同与比拼平台 — 部署与更新使用文档

> **线上地址**: https://lajiao-care-platform.version-keyk.workers.dev
> **技术栈**: React + Vite + TailwindCSS（前端）| Hono + Cloudflare Workers + R2（后端）
> **最后更新**: 2026-08-13

---

## 一、项目结构总览

```
lajiao/
├── src/                        # 前端源码
│   ├── App.tsx                 # 主应用组件（页面逻辑、Tab 切换）
│   ├── main.tsx                # 入口文件
│   ├── types.ts                # TypeScript 类型定义
│   ├── index.css               # 全局样式
│   ├── components/             # 所有 UI 组件
│   │   ├── PlantGrid.tsx       # 辣椒卡片网格
│   │   ├── PlantDetailModal.tsx # 辣椒详情弹窗
│   │   ├── CareLogModal.tsx    # 养护打卡弹窗
│   │   ├── Leaderboard.tsx     # 排行榜
│   │   ├── AdminConsole.tsx    # 管理后台
│   │   ├── AdminModal.tsx      # 管理操作弹窗
│   │   ├── TimelineFeed.tsx    # 动态时间线
│   │   ├── MyProfileTab.tsx    # 个人中心
│   │   ├── AIAssistantModal.tsx # AI 助手
│   │   └── ...
│   └── lib/
│       ├── api.ts              # 前端 API 客户端（请求后端接口）
│       └── imageCompressor.ts  # 图片压缩工具
│
├── worker.ts                   # Cloudflare Worker 后端（Hono 框架）
│                               # — 包含所有 API 端点
│                               # — 数据存储在 R2 存储桶 lajiao-db 中
│
├── wrangler.toml               # Cloudflare Workers 部署配置
│                               # — R2 绑定：DB → lajiao-db
│                               # — 静态资源绑定：ASSETS → ./dist
│
├── package.json                # 项目依赖与脚本
├── vite.config.ts              # Vite 构建配置
├── index.html                  # HTML 入口
└── dist/                       # 构建产物（npm run build 后生成）
    ├── index.html
    └── assets/                 # JS、CSS 等静态资源
```

---

## 二、环境准备（一次性配置）

### 2.1 安装 Node.js

如果还没有 Node.js，从 https://nodejs.org 下载 LTS 版本安装（推荐 22.x 以上）。

验证安装：
```bash
node --version   # 应显示 v22.x.x
npm --version    # 应显示 10.x.x
```

### 2.2 Cloudflare 凭证

本项目已配置好以下凭证（部署时使用环境变量传入）：

| 项目 | 值 |
|------|-----|
| 账户 ID | 在 `.cloudflare.env` 文件中 | 
| API 令牌 | 在 `.cloudflare.env` 文件中 |
| R2 存储桶 | `lajiao-db` |
| Worker 名称 | `lajiao-care-platform` |

> **安全提示**: API 令牌是敏感信息，不要提交到公开代码仓库。如果令牌泄露，请到 Cloudflare Dashboard → My Profile → API Tokens 中重新生成。

---

## 三、更新流程（核心操作）

每次修改代码后，按以下三步操作即可更新线上应用：

### 第 1 步：修改代码

在前端 (`src/`) 或后端 (`worker.ts`) 中修改代码。

### 第 2 步：构建前端

```bash
cd /Users/kejing/WorkBuddy/2026-08-13-10-16-56/lajiao
npm run build
```

这会执行 Vite 构建，将 `src/` 中的 React 代码编译为静态文件，输出到 `dist/` 目录。

构建成功后你会看到类似输出：
```
✓ built in 3.21s
dist/index.html
dist/assets/index-xxxxx.js
dist/assets/index-xxxxx.css
```

### 第 3 步：部署到 Cloudflare

```bash
export CLOUDFLARE_API_TOKEN="你的令牌"
export CLOUDFLARE_ACCOUNT_ID="你的账户ID"
npx wrangler deploy
```

部署成功后会显示：
```
Uploaded lajiao-care-platform (X.X sec)
Deployed lajiao-care-platform triggers
  https://lajiao-care-platform.version-keyk.workers.dev
```

### 一键部署命令（合并第 2 + 3 步）

```bash
cd /Users/kejing/WorkBuddy/2026-08-13-10-16-56/lajiao && \
npm run build && \
CLOUDFLARE_API_TOKEN="你的令牌" \
CLOUDFLARE_ACCOUNT_ID="你的账户ID" \
npx wrangler deploy
```

---

## 四、常见更新场景

### 场景 A：修改前端页面（UI / 交互）

**适用情况**: 修改辣椒卡片样式、调整布局、修改文案、新增页面功能等。

**修改文件**: `src/` 目录下的 `.tsx` / `.css` 文件

**操作**:
```bash
# 1. 编辑 src/ 下的文件
# 2. 构建并部署
cd /Users/kejing/WorkBuddy/2026-08-13-10-16-56/lajiao
npm run build
CLOUDFLARE_API_TOKEN="你的令牌" \
CLOUDFLARE_ACCOUNT_ID="你的账户ID" \
npx wrangler deploy
```

> 前端修改不影响后端数据，已保存在 R2 中的辣椒数据、日志、用户数据不会丢失。

---

### 场景 B：修改后端 API（接口逻辑）

**适用情况**: 新增 API 端点、修改数据结构、修改业务逻辑等。

**修改文件**: `worker.ts`

**操作**:
```bash
# 1. 编辑 worker.ts
# 2. 如果同时需要更新前端，先构建前端：
npm run build
# 3. 部署
CLOUDFLARE_API_TOKEN="你的令牌" \
CLOUDFLARE_ACCOUNT_ID="你的账户ID" \
npx wrangler deploy
```

> **注意**: 如果修改了 `worker.ts` 中的数据结构（如 Plant、CareLog 接口字段），需要确保与 R2 中已存储的数据兼容。建议新增字段时给默认值，不要删除已有字段。

---

### 场景 C：安装新的 npm 依赖

```bash
cd /Users/kejing/WorkBuddy/2026-08-13-10-16-56/lajiao
npm install <包名>          # 前端/通用依赖
# 或
npm install <包名> --save-dev  # 开发依赖

# 然后正常构建并部署
npm run build
CLOUDFLARE_API_TOKEN="你的令牌" \
CLOUDFLARE_ACCOUNT_ID="你的账户ID" \
npx wrangler deploy
```

---

### 场景 D：只改了 worker.ts，不需要重新构建前端

```bash
cd /Users/kejing/WorkBuddy/2026-08-13-10-16-56/lajiao
CLOUDFLARE_API_TOKEN="你的令牌" \
CLOUDFLARE_ACCOUNT_ID="你的账户ID" \
npx wrangler deploy
```

> 即使只改后端，`wrangler deploy` 也会同时上传 `dist/` 中的静态资源。如果 `dist/` 已存在且前端未修改，不会产生额外影响。

---

## 五、API 端点参考

后端 `worker.ts` 提供以下 API 端点，前缀均为 `/api`：

### 辣椒（植物）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/plants` | 获取所有辣椒列表 |
| GET | `/api/plants/:id` | 获取单个辣椒详情 |
| POST | `/api/plants` | 新增辣椒（管理员） |
| PUT | `/api/plants/:id` | 更新辣椒信息 |
| DELETE | `/api/plants/:id` | 删除辣椒（软删除） |
| POST | `/api/plants/:id/claim` | 领养辣椒 |
| POST | `/api/plants/:id/unclaim` | 取消领养 |

### 养护日志
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/logs` | 获取所有养护日志 |
| GET | `/api/logs/:plantId` | 获取某株辣椒的日志 |
| POST | `/api/logs` | 创建养护日志（浇水/施肥等） |
| DELETE | `/api/logs/:id` | 删除日志 |

### 用户
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 获取所有用户 |
| POST | `/api/users` | 创建/登录用户 |
| PUT | `/api/users/:id` | 更新用户信息 |
| DELETE | `/api/users/:id` | 删除用户 |

### 统计与评论
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/stats` | 获取全局统计数据 |
| GET | `/api/comments` | 获取评论列表 |
| POST | `/api/comments` | 发表评论 |
| DELETE | `/api/comments/:id` | 删除评论 |

### 图片上传
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传图片到 R2 |

---

## 六、数据管理

### 6.1 数据存储位置

所有数据以 JSON 格式存储在 R2 存储桶 `lajiao-db` 中的以下文件：

| R2 文件路径 | 内容 |
|-------------|------|
| `plants.json` | 所有辣椒数据 |
| `logs.json` | 所有养护日志 |
| `users.json` | 所有用户数据 |
| `comments.json` | 所有评论 |
| `images/` | 用户上传的图片 |

### 6.2 查看 R2 数据

通过 Cloudflare Dashboard：
1. 登录 https://dash.cloudflare.com
2. 选择账户 → R2 Object Storage
3. 点击存储桶 `lajiao-db`
4. 即可浏览、下载、删除文件

通过命令行：
```bash
# 列出 R2 中的文件
CLOUDFLARE_API_TOKEN="你的令牌" \
CLOUDFLARE_ACCOUNT_ID="你的账户ID" \
npx wrangler r2 object list lajiao-db

# 下载某个数据文件（如 plants.json）
npx wrangler r2 object get lajiao-db/plants.json --remote
```

### 6.3 备份数据

```bash
# 备份所有 JSON 数据文件
for f in plants.json logs.json users.json comments.json; do
  npx wrangler r2 object get "lajiao-db/$f" --remote --file "backup-$f"
done
```

### 6.4 重置数据

如果需要重置数据（清空所有记录），可以通过 Cloudflare Dashboard 删除 `lajiao-db` 存储桶中的 JSON 文件，下次访问 API 时会自动初始化为空数据。

> **警告**: 重置数据不可恢复，请先备份！

---

## 七、本地开发调试

### 7.1 本地启动前端开发服务器

```bash
cd /Users/kejing/WorkBuddy/2026-08-13-10-16-56/lajiao
npm run dev
```

这会启动 Vite 开发服务器（默认 http://localhost:5173），支持热更新。

> 注意：本地开发模式下，前端会尝试请求 `localhost:5173/api/*`，但后端 API 只在 Cloudflare Workers 上运行。如果需要本地测试 API，请使用下面的 Worker 本地模拟。

### 7.2 本地模拟 Worker（带 R2）

```bash
cd /Users/kejing/WorkBuddy/2026-08-13-10-16-56/lajiao
npm run build  # 先构建前端到 dist/
npx wrangler dev
```

`wrangler dev` 会在本地启动 Worker（默认 http://localhost:8787），同时模拟 R2 存储（数据保存在本地 `.wrangler/` 目录中），可以完整测试前后端交互。

---

## 八、故障排查

### 问题 1：部署后页面没变化

**原因**: 浏览器缓存了旧的静态资源。

**解决**:
- 强制刷新：`Cmd + Shift + R`（Mac）或 `Ctrl + Shift + R`（Windows）
- 或打开浏览器无痕模式访问

### 问题 2：API 报错 500

**排查步骤**:
1. 登录 Cloudflare Dashboard → Workers & Pages → `lajiao-care-platform`
2. 点击「Logs」标签查看实时日志
3. 或使用 `wrangler tail` 查看实时日志：
   ```bash
   CLOUDFLARE_API_TOKEN="你的令牌" \
   CLOUDFLARE_ACCOUNT_ID="你的账户ID" \
   npx wrangler tail
   ```

### 问题 3：本地无法访问 workers.dev

**原因**: 国内网络环境可能无法直连 workers.dev 域名。

**解决**:
- 使用手机流量访问
- 或在 Cloudflare Dashboard 中绑定自定义域名（需要你有已注册的域名）

### 问题 4：构建失败

```bash
# 清理重新安装依赖
rm -rf node_modules dist
npm install
npm run build
```

---

## 九、快速参考卡片

```
┌──────────────────────────────────────────────────┐
│           更新应用三步走                          │
│                                                  │
│  1. 改代码 (src/ 或 worker.ts)                   │
│  2. npm run build                                │
│  3. npx wrangler deploy (带环境变量)              │
│                                                  │
│  线上地址: lajiao-care-platform                  │
│           .version-keyk.workers.dev              │
├──────────────────────────────────────────────────┤
│  一键部署命令:                                    │
│                                                  │
│  cd /Users/kejing/WorkBuddy/2026-08-13-10-16-56 │
│     /lajiao && npm run build &&                  │
│  CLOUDFLARE_API_TOKEN="你的令牌"                 │
│  CLOUDFLARE_ACCOUNT_ID="427e..."                 │
│  npx wrangler deploy                             │
└──────────────────────────────────────────────────┘
```

---

## 十、安全注意事项

1. **API 令牌安全**: 不要将 API 令牌提交到 Git 仓库或分享给他人
2. **R2 数据安全**: 定期备份 `plants.json`、`logs.json`、`users.json`、`comments.json`
3. **管理员权限**: 当前管理后台没有鉴权，任何人都能操作。如果部署到公网使用，建议在 `worker.ts` 中添加简单的密码验证或接入 Cloudflare Access
4. **删除旧 Worker**: 旧的 `222.version-keyk.workers.dev` 部署可以在 Cloudflare Dashboard → Workers & Pages 中删除
