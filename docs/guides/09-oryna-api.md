# Oryna AI 后端对接（API 参考）

Oryna AI 是 OrynaCode 的云端模型提供方。本文档面向需要了解 OrynaCode 与 Oryna 后端交互细节的用户和开发者。

## 目录

1. [Oryna AI 概述](#1-oryna-ai-概述)
2. [模型发现 API](#2-模型发现-api)
3. [OAuth 登录 API](#3-oauth-登录-api)
4. [JWT 刷新 API](#4-jwt-刷新-api)
5. [Token 生命周期](#5-token-生命周期)
6. [环境变量](#6-环境变量)

---

## 1. Oryna AI 概述

OrynaCode 通过三个 API 与 Oryna AI 后端交互，分别负责：

```
模型发现   →  GET  /api.json     → 获取可用模型列表和定价信息
OAuth 登录 →  GET  /login         → 浏览器登录，获取 JWT Token
JWT 刷新   →  POST /auth/refresh  → Token 过期前自动续期
```

**三者关系**：

- 用户首次使用 Oryna AI → OAuth 登录获取 JWT → 系统保存 Token
- OrynaCode 启动 / 切换模型 → 调用模型发现接口 → 展示可用模型列表
- 每次 LLM 请求 → 用 JWT 作为 API Key
- JWT 即将过期 → 自动调用刷新接口 → 新 Token 无缝替换旧 Token
- 刷新失败 → 401 → TUI 提示 "Session expired" → 用户 `Ctrl+R` 重新登录

---

## 2. 模型发现 API

OrynaCode 在启动时、切换 Provider 时、或模型列表缓存过期时调用此接口，获取 Oryna AI 当前可用的模型列表和定价信息。

### 请求

```
GET https://oryna.ai/api.json
```

无需认证，公开访问。

### 响应示例

```json
{
  "oryna": {
    "id": "oryna",
    "name": "Oryna AI",
    "env": ["ORYNA_API_KEY"],
    "npm": "@ai-sdk/openai-compatible",
    "api": "https://api.oryna.ai/v1",
    "models": {
      "gpt-4o": {
        "id": "gpt-4o",
        "name": "GPT-4o",
        "family": "gpt",
        "release_date": "2024-05-13",
        "attachment": true,
        "reasoning": false,
        "temperature": true,
        "tool_call": true,
        "limit": { "context": 128000, "output": 16384 },
        "modalities": {
          "input": ["text", "image"],
          "output": ["text"]
        },
        "cost": {
          "input": 2.50,
          "output": 10.00
        }
      }
    }
  }
}
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `oryna` | object | ✅ | Provider 定义对象，key 固定为 `"oryna"` |
| `oryna.id` | string | ✅ | Provider ID，固定 `"oryna"` |
| `oryna.name` | string | ✅ | 显示名称，如 `"Oryna AI"` |
| `oryna.env` | string[] | ✅ | 环境变量名，固定 `["ORYNA_API_KEY"]` |
| `oryna.npm` | string | ✅ | SDK 包名，固定 `"@ai-sdk/openai-compatible"` |
| `oryna.api` | string | ✅ | API 地址，所有 LLM 请求发往此地址 |
| `oryna.models` | object | ✅ | 模型列表，key 为模型 ID |
| `model.id` | string | ✅ | 模型 ID，在 OrynaCode 中用来切换模型 |
| `model.name` | string | ✅ | 显示名称，在 TUI 模型列表中展示 |
| `model.family` | string | ❌ | 模型家族，如 `"gpt"`, `"claude"`, `"gemini"` |
| `model.release_date` | string | ✅ | 发布日期，格式 `"YYYY-MM-DD"` |
| `model.attachment` | boolean | ✅ | 是否支持文件附件（图片、PDF 等） |
| `model.reasoning` | boolean | ✅ | 是否支持推理/深度思考模式 |
| `model.temperature` | boolean | ✅ | 是否支持温度参数调节 |
| `model.tool_call` | boolean | ✅ | 是否支持工具调用（Tool Use） |
| `model.limit.context` | number | ✅ | 上下文窗口大小（tokens） |
| `model.limit.output` | number | ✅ | 单次最大输出（tokens） |
| `model.modalities.input` | string[] | ❌ | 支持的输入类型：`text`, `image`, `audio`, `video`, `pdf` |
| `model.modalities.output` | string[] | ❌ | 支持的输出类型 |
| `model.cost.input` | number | ❌ | 输入价格（$/1M tokens） |
| `model.cost.output` | number | ❌ | 输出价格（$/1M tokens） |
| `model.cost.cache_read` | number | ❌ | 缓存读取价格（$/1M tokens） |
| `model.cost.cache_write` | number | ❌ | 缓存写入价格（$/1M tokens） |
| `model.cost.tiers` | array | ❌ | 阶梯定价 |
| `model.cost.context_over_200k` | object | ❌ | 超过 200K 上下文的额外定价 |
| `model.experimental` | object | ❌ | 实验性配置 |

### 缓存策略

OrynaCode 客户端会缓存模型列表响应 **5 分钟**。如果你在 Oryna 后端新增或修改了模型，最多等待 5 分钟后客户端会拉取到最新的模型列表。

### OrynaGate 兼容

OrynaGate（局域网部署版）也使用相同的 `/api.json` 格式提供模型列表。部署 OrynaGate 后，OrynaCode 会自动扫描并获取其模型列表。字段结构完全相同，只是 `api` 字段指向局域网的 OrynaGate 地址。

---

## 3. OAuth 登录 API

Oryna AI 使用 OAuth（浏览器跳转登录）进行用户认证。流程如下：

### 登录时序

```
用户                    OrynaCode                      Oryna 后端 (oryna.ai)
 │                         │                               │
 │  选择 Oryna AI          │                               │
 ├────────────────────────►│                               │
 │                         │  启动本地 HTTP 服务器          │
 │                         │  (127.0.0.1:随机端口)          │
 │                         │                               │
 │         ◄───────────────┤  打开浏览器                   │
 │                         ├──────────────────────────────►│ GET /login?redirect_uri=...&state=...
 │                         │                               │
 │  在浏览器完成登录        │                               │
 ├─────────────────────────┼──────────────────────────────►│
 │                         │                               │
 │                         │          ◄────────────────────│ 302 → /callback?token={jwt}&state={same}
 │                         │                               │
 │                         │  校验 state，保存 JWT          │
 │        ◄────────────────┤                               │
 │  登录完成，可继续使用     │                               │
```

### 请求

```
GET https://oryna.ai/login?redirect_uri={url}&state={random}
```

### 查询参数

| 参数 | 必需 | 说明 |
|------|------|------|
| `redirect_uri` | ✅ | 登录成功后的回调地址，格式 `http://127.0.0.1:{port}/callback` |
| `state` | ✅ | 随机十六进制字符串，用于防止 CSRF 攻击 |

### 流程详解

**步骤 1 — 启动本地服务器**：

OrynaCode 在本地启动一个临时 HTTP 服务器，监听 `127.0.0.1` 的随机端口（仅在本地可访问，不对外暴露）。

**步骤 2 — 生成随机 state**：

生成一个随机十六进制字符串（格式：`oc_` 前缀 + 随机 hex 字符），作为 CSRF 防护 token。

**步骤 3 — 打开浏览器**：

OrynaCode 自动打开系统默认浏览器，跳转到 Oryna 登录页面：

```
https://oryna.ai/login?redirect_uri=http://127.0.0.1:54321/callback&state=oc_a1b2c3d4e5f6
```

**步骤 4 — 用户登录**：

用户在浏览器中完成 Oryna 账号登录和授权。

**步骤 5 — 302 重定向回调**：

登录成功后，Oryna 后端执行 `HTTP 302` 重定向到 OrynaCode 的本地回调地址：

```
HTTP 302 → http://127.0.0.1:54321/callback?token=eyJhbGciOi...&state=oc_a1b2c3d4e5f6
```

**步骤 6 — 校验和保存**：

OrynaCode 的本地服务器接收回调请求后：
1. 校验 `state` 参数是否与步骤 2 中生成的值**完全一致**（防止 CSRF）
2. 提取 `token` 参数（JWT）
3. 将 JWT 保存为 API Key（存入 `~/.local/share/opencode/auth.json`）
4. 关闭本地 HTTP 服务器
5. TUI 自动跳转到模型选择界面

### 重登录触发条件

JWT 有过期时间（`exp` 字段）。以下情况会触发重登录：

1. JWT 已过期
2. 自动刷新失败（详见第 4 节）
3. OrynaCode 发起 LLM 请求收到 `401 Unauthorized`
4. TUI 底部显示 `⚠ Session expired — ● Login with Oryna AI (Browser)`
5. 用户按 `Ctrl+R` 或点击提示 → 自动执行以上 6 个步骤

![Oryna 401 重登录提示](images/session-expired.png)

### 安全要求

| 要求 | 说明 |
|------|------|
| **State 校验** | Oryna 后端必须原样返回 `state` 参数。OrynaCode 校验不匹配则拒绝绑定 Token |
| **https** | 公网必须使用 HTTPS。本地回调可用 HTTP（仅 127.0.0.1） |
| **JWT 存储** | Token 存储在 `~/.local/share/opencode/auth.json`，权限为当前用户只读 |
| **Token 格式** | JWT 必须包含 `exp` 字段（过期时间戳），OrynaCode 据此判断是否需要刷新 |

### 示例

```
# 发起请求
GET https://oryna.ai/login?redirect_uri=http://127.0.0.1:54321/callback&state=oc_a1b2c3d4

# 用户登录成功后 Oryna 的响应
HTTP 302
Location: http://127.0.0.1:54321/callback?token=eyJhbGciOiJIUzI1NiIs...&state=oc_a1b2c3d4

# OrynaCode 收到回调
→ 校验 state "oc_a1b2c3d4" 匹配 ✓
→ 提取 JWT "eyJhbGci..."
→ 存入 auth.json: { "oryna": { "type": "api", "key": "eyJhbGci..." } }
→ 完成登录
```

---

## 4. JWT 刷新 API

Oryna AI 的 JWT Token 有有效期（通过 `exp` 字段指定）。OrynaCode 会在 Token 过期前自动调用此接口换取新 Token。刷新失败则清空过期 Token，触发重登录流程。

### 请求

```
POST https://oryna.ai/auth/refresh
Authorization: Bearer {old_jwt}
Content-Type: application/json
```

### 请求头

| 头 | 值 | 说明 |
|-----|------|------|
| `Authorization` | `Bearer {即将过期的 JWT}` | 用当前 Token 换取新 Token |
| `Content-Type` | `application/json` | 请求体格式 |

### 成功响应

```json
// 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

返回的 `token` 是一个全新的 JWT，包含新的 `exp` 字段。OrynaCode 会：
1. 将新 JWT 保存到 `auth.json`，替换旧 Token
2. 用新 Token 继续发出 LLM 请求
3. 过程对用户完全透明

### 错误响应

```json
// 401 — JWT 已过期或无效
{ "error": "invalid_token" }

// 500 — 服务器内部错误
{ "error": "server_error" }
```

### 刷新策略

| 场景 | 行为 |
|------|------|
| Token 未过期 | 直接使用，不发起刷新 |
| Token 已过期 | 自动发起刷新请求 |
| 刷新成功 | 保存新 Token，继续 LLM 请求 |
| 刷新失败（401） | 清空过期 Token → 下次 LLM 请求 401 → TUI 弹重登录 |
| 刷新失败（500 等） | 保留旧 Token 并重试（指数退避），最多 3 次 |
| 多个并发 LLM 请求 | 共享同一个刷新 Promise（去重），只请求一次 |

### 并发安全

当多个 LLM 请求同时发现 Token 过期时，OrynaCode 使用**共享 Promise** 机制——只发起一次刷新请求，所有并发请求等待同一个结果。这避免了同一时刻对 Oryna 后端发起多次刷新请求。

---

## 5. Token 生命周期

以下是 JWT Token 从获取到失效的完整生命周期：

```
用户首次使用 Oryna AI
    │
    ▼
OAuth 浏览器登录          → 获取 JWT（含 exp 过期时间，通常 24h）
    │
    ▼
存入 auth.json           → 位置：~/.local/share/opencode/auth.json
    │                        格式：{ "oryna": { "type": "api", "key": "{jwt}" } }
    ▼
LLM 请求                  → auth.loader 读取 JWT，检查 exp
    │
    ├── Token 有效 ──────► 直接作为 API Key 发送请求
    │
    └── Token 过期
         │
         ▼
    POST /auth/refresh
         │
         ├── 200 OK ─────► 新 JWT 保存 → 继续请求（用户无感知）
         │
         └── 401 等错误
              │
              ▼
         清空过期 JWT（从 auth.json 删除）
              │
              ▼
         下次 LLM 请求返回 401 Unauthorized
              │
              ▼
         TUI 显示 "⚠ Session expired — ● Login with Oryna AI"
              │
              ▼
         用户按 Ctrl+R 或点击提示
              │
              ▼
         重新 OAuth 登录 ──► 获取新 JWT → 继续
```

### 手动登录

除了自动流程外，用户也可以随时手动重新登录：

1. 输入 `/connect`
2. 选择 "Oryna AI"
3. 选择 "Login with Oryna AI (Browser)"
4. 浏览器登录完成
5. Token 更新，所有使用 Oryna AI 的 Session 立即可用

---

## 6. 环境变量

OrynaCode 支持以下与 Oryna AI 相关的环境变量：

| 变量 | 说明 | 来源 |
|------|------|------|
| `ORYNA_API_KEY` | Oryna AI 的 JWT Token | CLI 启动参数或 shell 环境。优先级高于 `auth.json` 存储的 Token |
| `ORYNA_GATE_URL` | OrynaGate 服务地址 | OrynaGate 连接设置时自动写入。例如 `http://192.168.1.100:9527` |
| `ORYNA_GATE_WORKSPACE` | OrynaGate 工作区目录 | OrynaCode 启动/切模型时自动设置，用于生成 OrynaGate 认证 Key |

**优先级**：环境变量 > auth.json 存储。如果设置了 `ORYNA_API_KEY` 环境变量，OrynaCode 将优先使用它，而不读取 `auth.json` 中的 Token。

---

> **相关文档**：
> - [OrynaGate 远程协作](07-orynagate-collab.md)
> - [模型与 Provider 指南](03-models-providers.md)
> - 更多帮助请访问 [oryna.ai](https://oryna.ai)
