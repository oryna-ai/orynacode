# 配置参考与常见问题

## 目录

1. [配置参考](#1-配置参考)
2. [常见问题](#2-常见问题)
3. [HTTP 错误码参考](#3-http-错误码参考)

## 1. 配置参考

### 1.1 orynacode.json

`orynacode.json` 是 OrynaCode 的项目配置文件，放在项目根目录或 `.orynacode/` 目录下。

**文件位置**（按优先级从低到高）：

1. `~/.opencode/config.json(c)` — 全局配置
2. 项目中的 `orynacode.json(c)` — 项目配置
3. `.orynacode/orynacode.json(c)` — 隐藏目录配置
4. 环境变量 `OPENCODE_CONFIG_CONTENT` — 环境变量注入

**主要配置项**：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  // 默认模型：provider/modelID 格式
  "model": "oryna/oryna-large",
  // 默认 Agent
  "default_agent": "build",
  // 工具权限预设
  "permission": {
    // "*": "allow" — 允许所有工具
    // "bash": "ask" — 执行命令时询问
    // "edit": "deny" — 禁止编辑文件
    "read": "allow",
    "edit": "ask",
    "bash": "ask",
    "grep": "allow",
    "glob": "allow"
  },
  // Provider 配置
  "provider": {
    "openai": {
      "options": {
        "apiKey": "sk-xxx"
      }
    }
  },
  // 插件列表
  "plugin": ["@orynacode-ai/plugin-xxx"],
  // 附加系统指令
  "instructions": "",
  // 自定义 Shell
  "shell": "zsh",
  // 压缩设置
  "compaction": {
    "auto": true
  },
  // 分享设置
  "share": "auto",
  // 实验性功能
  "experimental": {
    "disable_paste_summary": false,
    "openTelemetry": false
  }
}
```

### 1.2 tui.json

`tui.json` 是 TUI（终端界面）的配置文件，放在 `.orynacode/tui.json`。

```jsonc
{
  // 主题名称
  "theme": "oryna",
  // 自定义快捷键（覆盖默认）
  "keybinds": {
    "model_list": "ctrl+m",
    "session_new": "ctrl+n"
  },
  // 启用/禁用鼠标
  "mouse": true,
  // Leader 键超时（毫秒）
  "leader_timeout": 2000,
  // 提示音和通知
  "attention": {
    "enabled": true,
    "notifications": true,
    "sound": true,
    "volume": 0.4
  },
  // 输入框设置
  "prompt": {
    "max_height": 10,
    "max_width": 75  // 设为 "auto" 则自动适应终端宽度
  },
  // 滚动速度
  "scroll_speed": 5,
  // Diff 展示风格："auto" 或 "stacked"
  "diff_style": "auto",
  // 插件配置
  "plugin": ["path/to/plugin"],
  "plugin_enabled": {
    "some-plugin": true
  }
}
```

### 1.3 .orynacode/ 目录结构

```
项目根目录/
├── orynacode.json          # 项目配置
└── .orynacode/
    ├── agent/               # 自定义 Agent 定义（.md 文件）
    ├── mode/                # 自定义 Mode 定义（.md 文件）
    ├── skill/               # Skills 定义
    ├── tool/                # 自定义工具（.js/.ts 文件）
    ├── plans/               # Plan 模式的输出文件
    ├── orynacode.json(c)    # 项目配置（隐藏目录版）
    └── tui.json(c)          # TUI 配置
```

---


## 2. 常见问题

### 2.1 Oryna AI Token 过期

**现象**：发送消息后收到 `Unauthorized` 错误。

**解决**：
1. Session 底部会自动显示 `⚠ Session expired — ● Login with Oryna AI (Browser)`
2. 按 `Ctrl+R` 或点击该提示
3. 浏览器自动打开 Oryna 登录页面
4. 完成登录后自动返回，可以继续对话

![Session 过期重登录](images/session-expired.png)

> 如果提示没有出现，手动输入 `/connect` 选择 Oryna AI 重新登录。

### 2.2 模型不响应

**现象**：选择模型后发消息，但一直没有回复。

**可能原因**：
- Provider 未连接 — 检查是否已完成认证
- API Key 无效或过期 — 重新连接 Provider
- 网络问题 — 检查网络连接
- 模型被禁用 — 在模型列表中检查是否有禁用标识

### 2.3 子代理卡住

**现象**：子代理一直显示 loading 或不前进。

**解决**：
- 按 `ctrl+b` 将子代理移到后台继续运行
- 按 `escape` 中断子代理
- 返回父 Session（`↑`）继续其他工作

### 2.4 会话太长

**现象**：AI 回复变慢或提示上下文超出限制。

**解决**：按 `<leader>c` 压缩 Session。AI 会自动生成摘要替换历史消息，释放上下文空间。

### 2.5 工具被频繁拒绝

**现象**：每次 AI 调用工具都需要手动确认。

**解决**：在 `orynacode.json` 预设权限规则。例如允许所有工具：

```json
{
  "permission": {
    "*": "allow"
  }
}
```

或者只允许特定工具：

```json
{
  "permission": {
    "read": "allow",
    "grep": "allow",
    "glob": "allow",
    "bash": "ask",
    "edit": "ask"
  }
}
```

### 2.6 如何安装和更新

**安装**：

```bash
curl -fsSL https://oryna.ai/orynacode/install | bash
```

**更新**：

```bash
npm i -g orynacode-ai@latest
```

或通过 Homebrew（macOS）：

```bash
brew upgrade orynacode
```

**版本查看**：侧边栏（`<leader>b`）显示当前版本号。

---

## 3. HTTP 错误码参考

当 LLM 请求返回错误时，OrynaCode 根据 HTTP 状态码和响应内容分类处理。

### 错误码速查表

| HTTP | Error Description | Typical Scenario | Classification | Shown to User | Auto Compact | Retry |
|------|------------------|-----------------|---------------|--------------|-------------|-------|
| 400 | Bad Request | Token/context overflow (body contains overflow keywords) | context_overflow | ✅ (v1.16.14+) | ✅ | ❌ |
| 400 | Bad Request | Invalid parameter or other bad request | api_error | ✅ | ❌ | ❌ |
| 401 | Unauthorized | Auth expired or missing API key | ProviderAuthError / api_error | ✅ needs_auth | ❌ | ❌ |
| 402 | Payment Required | Quota exhausted or billing required | api_error | ✅ | ❌ | ❌ |
| 403 | Forbidden | Access denied by provider | api_error | ✅ | ❌ | ❌ |
| 413 | Payload Too Large | Request body exceeds server byte limit | api_error | ✅ | ❌ | ❌ |
| 422 | Unprocessable Content | Token overflow (body contains overflow keywords) | context_overflow | ✅ (v1.16.14+) | ✅ | ❌ |
| 422 | Unprocessable Content | Validation failure (other causes) | api_error | ✅ | ❌ | ❌ |
| 429 | Too Many Requests | Rate limit exceeded | api_error | ✅ | ❌ | ✅ |
| 500 | Internal Server Error | Provider server error | api_error (retryable) | ✅ | ❌ | ✅ |
| 503 | Service Unavailable | Provider overloaded or unavailable | api_error (retryable) | ✅ | ❌ | ✅ |

### 分类说明

| 分类 | 系统行为 |
|------|---------|
| `api_error` | 显示错误消息，记录到 assistant message。用户可见。 |
| `context_overflow` | 检测到上下文溢出时，自动触发会话压缩。v1.16.14 起同时显示错误给用户。 |
| `ProviderAuthError` | 401 认证失败时，Session 底部显示 "Session expired — Login with Oryna AI"，`Ctrl+R` 可重新登录。 |
| `api_error (retryable)` | 自动重试（指数退避），重试耗尽后显示最终错误。 |

### 错误显示位置

Session 消息区域以红色左边框展示错误信息：

![错误显示](images/placeholder.png)

---

> **提示**：更多帮助请访问 [oryna.ai](https://oryna.ai) 或运行 `orynacode --help`。
