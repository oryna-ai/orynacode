# 模型与 Provider 详细指南

## 5. 模型与 Provider 详细指南

### 5.1 连接 Provider 的完整流程

在任何界面输入 `/connect`，会打开 Provider 连接对话框。

![Provider 连接对话框（完整列表）](images/provider-connect-full.png)

选择你要的 Provider 后，系统会根据 Provider 支持的认证方式来引导你：

**OAuth 认证（如 Oryna AI）**：

1. 自动打开浏览器，跳转到登录页面
2. 在浏览器中完成登录授权
3. 授权成功后浏览器自动关闭，OrynaCode 显示 "Waiting for authorization..."
4. 完成后自动跳转到模型选择界面

![OAuth 等待授权](images/oauth-waiting.png)

**API Key 认证（如 OpenAI、Anthropic）**：

1. 输入你的 API Key
2. 确认保存
3. 完成后跳转到模型选择界面

![API Key 输入](images/apikey-input.png)

**自定义 Provider**：

1. 选择 "Other"
2. 输入 Provider ID（如 `my-custom-llm`）
3. 输入 API Key 或端点 URL
4. 在 `orynacode.json` 中进一步配置模型

### 5.2 切换模型

输入 `/models` 或按 `<leader>m`，打开模型选择对话框。

![模型选择对话框](images/model-select.png)

对话框包含三个区域：

- **Favorites**（收藏）— 你最常用的模型，标记/取消用 `ctrl+f`
- **Recent**（最近）— 最近使用过的 10 个模型
- **All Models**（全部）— 按 Provider 分组显示所有可用模型

支持模糊搜索：直接输入关键词即可过滤。选择一个模型后，如果该模型有变体（如不同推理深度），会自动弹出变体选择。

**快速切换**：
- `F2` — 切换到下一个最近使用的模型
- `Shift+F2` — 切换到上一个最近使用的模型
- `ctrl+t` — 切换当前模型的变体

### 5.3 Oryna AI 云端模型

Oryna AI 是 OrynaCode 的首选 Provider，提供最佳性能的云端 LLM。

**首次连接**：

选择 Oryna AI 后，系统会自动打开浏览器进行 OAuth 登录。登录成功后 Token 自动保存。

**Token 过期重登录**：

当 Oryna AI 的认证 Token 过期时，会出现以下情况：
1. 发送消息后收到 `Unauthorized` 错误
2. Session 底部自动显示 `⚠ Session expired — ● Login with Oryna AI (Browser)`
3. 按 `Ctrl+R` 或点击该提示，浏览器会自动打开，完成登录后即可继续

![Session 过期重登录](images/session-expired.png)

登录成功后，之前的对话可以无缝继续，不需要重新创建 Session。

### 5.4 模型变体

同一模型可能有不同变体（例如不同的推理能力、上下文长度等）。选择一个模型后，如果它有变体，会自动弹出变体选择对话框。

按 `ctrl+t` 可以在变体之间切换。

![模型变体选择](images/model-variant.png)

---

