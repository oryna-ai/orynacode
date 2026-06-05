# Oryna Backend API

## 1. 模型列表

```
GET https://oryna.ai/api.json
```

### 响应格式

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
| `oryna` | object | ✅ | provider 定义对象，key 固定为 `"oryna"` |
| `oryna.id` | string | ✅ | provider ID，固定 `"oryna"` |
| `oryna.name` | string | ✅ | 显示名称，如 `"Oryna AI"` |
| `oryna.env` | string[] | ✅ | 环境变量名，固定 `["ORYNA_API_KEY"]` |
| `oryna.npm` | string | ✅ | SDK 包名，固定 `"@ai-sdk/openai-compatible"` |
| `oryna.api` | string | ✅ | API 地址 |
| `oryna.models` | object | ✅ | 模型列表，key 为模型 ID |
| `model.id` | string | ✅ | 模型 ID |
| `model.name` | string | ✅ | 显示名称 |
| `model.family` | string | ❌ | 模型家族，如 `"gpt"`, `"claude"`, `"gemini"` |
| `model.release_date` | string | ✅ | 发布日期 `"YYYY-MM-DD"` |
| `model.attachment` | boolean | ✅ | 是否支持附件 |
| `model.reasoning` | boolean | ✅ | 是否支持推理模式 |
| `model.temperature` | boolean | ✅ | 是否支持温度参数 |
| `model.tool_call` | boolean | ✅ | 是否支持工具调用 |
| `model.limit.context` | number | ✅ | 上下文窗口（tokens） |
| `model.limit.output` | number | ✅ | 最大输出（tokens） |
| `model.modalities.input` | string[] | ❌ | 支持的输入类型：`text`, `image`, `audio`, `video`, `pdf` |
| `model.modalities.output` | string[] | ❌ | 支持的输出类型 |
| `model.cost.input` | number | ❌ | 输入价格 ($/1M tokens) |
| `model.cost.output` | number | ❌ | 输出价格 ($/1M tokens) |
| `model.cost.cache_read` | number | ❌ | 缓存读取价格 |
| `model.cost.cache_write` | number | ❌ | 缓存写入价格 |
| `model.cost.tiers` | array | ❌ | 阶梯定价 |
| `model.cost.context_over_200k` | object | ❌ | 超 200k 上下文定价 |
| `model.experimental` | object | ❌ | 实验性配置 |

### 缓存

orynacode 客户端会缓存此响应 5 分钟。模型变更后最多等 5 分钟生效。

---

## 2. 登录（浏览器跳转）

```
GET https://oryna.ai/login?redirect_uri=<url>&state=<random>
```

### 查询参数

| 参数 | 说明 |
|------|------|
| `redirect_uri` | 登录成功后的回调地址，格式 `http://127.0.0.1:{port}/callback` |
| `state` | 随机字符串（hex），用于 CSRF 防护 |

### 流程

1. orynacode 启动本地 HTTP 服务器 (127.0.0.1:随机端口)
2. 生成随机 state 字符串
3. 自动打开浏览器访问 `/login?redirect_uri=...&state=...`
4. 用户在你的登录页面完成认证
5. 登录成功后，**302 重定向** 到：

```
HTTP 302 → {redirect_uri}?token={jwt}&state={same_state}
```

### 示例

```
请求:  https://oryna.ai/login?redirect_uri=http://127.0.0.1:54321/callback&state=a1b2c3d4
响应:  302 → http://127.0.0.1:54321/callback?token=eyJhbG...&state=a1b2c3d4
```

### 安全要求

- 必须校验 `state` 参数匹配（原样返回）
- `token` 是 JWT，客户端存为 API Key
- JWT 需包含 `exp` 字段（过期时间），用于自动刷新

---

## 3. JWT 刷新

```
POST https://oryna.ai/auth/refresh
Authorization: Bearer {old_jwt}
Content-Type: application/json
```

### 请求头

| 头 | 值 |
|-----|------|
| `Authorization` | `Bearer {即将过期的 JWT}` |

### 响应

```json
{
  "token": "{new_jwt}"
}
```

### 说明

- 客户端在 JWT 即将过期时自动调用此接口
- 用旧 JWT 换取新 JWT
- 新 JWT 需重新包含 `exp` 字段

### 错误响应

```json
// 401 - JWT 无效或已过期
{ "error": "invalid_token" }

// 500 - 服务器错误
{ "error": "server_error" }
```
