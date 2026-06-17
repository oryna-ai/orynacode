# OrynaGate 远程协作

OrynaGate 是 OrynaCode 的远程协作方案。通过局域网部署 OrynaGate 网关，团队成员可以相互发送协作请求，由 AI 代理自动执行任务并回复。

## 目录

1. [OrynaGate 是什么](#1-orynagate-是什么)
2. [连接 OrynaGate](#2-连接-orynagate)
3. [协作工作流](#3-协作工作流)
4. [collab_reply 协作回复工具](#4-collab_reply-协作回复工具)
5. [协作消息格式](#5-协作消息格式)
6. [模式切换](#6-模式切换)

---

## 1. OrynaGate 是什么

OrynaGate 是一个局域网 LLM 网关服务（默认端口 9527）。部署后，局域网内的 OrynaCode 用户可以：

- 共享同一个 AI 模型后端
- 发送协作消息给其他用户的 OrynaCode，由 AI 代理执行
- 实时查看协作状态

**架构示意**：

```
用户 A (Web)              用户 B (OrynaCode)
    │                           │
    │  发送协作请求              │
    ├─────────► OrynaGate ◄──────┤ 连接 & 认证
    │              │             │
    │              │  转发请求    │
    │              ├──────────►  │
    │              │           AI 执行任务
    │              │   ◄─────────┤
    │              │  collab_reply
    │   ◄──────────┤             │
    │   返回结果    │             │
```

---

## 2. 连接 OrynaGate

输入 `/connect`，在 Provider 列表中选择 **OrynaGate**。

### 2.1 自动扫描

系统会自动扫描局域网（15 秒），显示发现的 OrynaGate 服务器列表。

![OrynaGate 扫描](images/orynagate-scan.png)

- `↑` `↓` — 选择服务器
- `Enter` — 确认连接
- `Escape` — 返回

### 2.2 手动输入

如果没有扫描到服务器，选择 "Enter IP manually"，手动输入 OrynaGate 地址。

格式：`http://192.168.1.100:9527`（IP + 端口）

![OrynaGate 手动输入](images/orynagate-manual.png)

### 2.3 认证 Key

连接成功后，OrynaCode 自动生成认证 Key，格式为 `sk-local-{用户名}-{工作区名}`。例如：

```
sk-local-lishan-orynaclaw
```

这个 Key 用于 OrynaGate 识别你的身份和工作区，自动管理，不需要手动操作。

### 2.4 连接成功

连接后，系统会将 OrynaGate 作为 Provider 添加，并自动获取可用的模型列表。OrynaGate 下的模型会出现在 `/models` 列表中。

---

## 3. 协作工作流

### 3.1 协作状态显示

连接成功后，在以下位置可以看到 OrynaGate 状态：

- **Home 页面**：右侧显示协作状态指示器
  - `● Collab · URL` — 已连接，就绪
  - `○ idle · URL` — 空闲（模型未选 OrynaGate）
  - `◇ processing...` — 正在处理协作请求

![OrynaGate 协作状态](images/collab-status-home.png)

- **Session 页面**：底部状态栏显示连接状态

### 3.2 接收协作消息

当其他用户通过 OrynaGate 向你发送协作请求时：

1. OrynaCode 收到协作消息（包含任务描述和发送方标识）
2. 自动创建一个 Session，AI 收到包含 `from` 标识的 system prompt
3. AI 按照当前 Agent 模式（build / plan）执行任务
4. 任务完成后，AI **必须**调用 `collab_reply` 工具将结果发回给请求方

### 3.3 发送协作消息（Web 端）

通过 OrynaGate 的 Web 管理界面可以向连接的 OrynaCode 实例发送协作请求。指定目标用户和任务内容，OrynaGate 会将消息转发给对应的 OrynaCode。

---

## 4. collab_reply 协作回复工具

`collab_reply` 是 OrynaGate 协作的**核心工具**——LLM 完成任务后，通过这个工具将结果发送回请求方。

### 4.1 为什么需要这个工具

在协作模式下，LLM 的回复**不是**显示在当前对话中，而是需要发送回远程请求方。`collab_reply` 就是用来做这件事的。它确保：

- 结果准确地到达正确的接收方（通过 `to` 参数匹配）
- 回复格式化地展示在 OrynaGate 的 Web 界面上
- 协作流程完整闭环

### 4.2 工具参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | string | 是 | 回复内容。保持简洁，清晰传达结果。 |
| `to` | string | 否 | 接收方标识。必须匹配系统 prompt 中的 `from` 值。 |

### 4.3 使用示例

当 LLM 完成协作任务后，会看到类似这样的消息：

![协作回复完成](images/collab-reply.png)

在对话中显示为 `↩ Replied to collaboration message`。

### 4.4 完整协作流程

```
1. 用户 A 在 OrynaGate Web 上发起请求
   └─ "帮我分析 orynacode 项目的架构" 发给用户 B (sk-local-lishan-orynaclaw)

2. OrynaGate 转发给用户 B 的 OrynaCode
   └─ System: "你正在回应协作消息。完成后 MUST 使用 collab_reply 工具，to='sk-local-...'"

3. OrynaCode 的 AI 收到消息，开始执行
   └─ 读取代码、分析架构、整理结果

4. AI 调用 collab_reply 工具
   └─ collab_reply(content="OrynaCode 采用...", to="sk-local-...")

5. reply-service 收到回复内容
   └─ 通过 WebSocket 发送给 OrynaGate 服务端

6. OrynaGate 将结果返回给用户 A
   └─ Web 界面显示分析结果
```

### 4.5 注意事项

- **必须使用**：在协作场景下，LLM 的系统 prompt 会明确要求使用 `collab_reply`，不要直接输出文本
- **`to` 参数**：确保回复发给正确的请求方。系统 prompt 中的 `from` 值就是 `to` 参数应该填的值
- **内容格式**：回复内容应该结构化、清晰，可以是文本、代码、文件路径等

---

## 5. 协作消息格式

### 5.1 系统 Prompt

当收到协作消息时，OrynaCode 会注入以下 System prompt：

```
*** You are responding to a collaboration message. After completing the task,
you MUST use the 'collab_reply' tool to send results back with to="{from}".
Never output a plain text response. ***
```

### 5.2 用户消息格式

协作消息以特定前缀标记：

```
/build 帮我分析这个代码结构
```

或

```
/plan 先规划一下如何优化性能
```

前缀控制 Agent 模式和消息内容。

---

## 6. 模式切换

在协作消息中，可以使用以下前缀指定执行模式：

| 前缀 | Agent 模式 | 说明 |
|------|-----------|------|
| `/build` | Build 模式 | AI 可以执行所有工具，直接修改代码 |
| `/plan` | Plan 模式 | 只读模式，AI 输出计划到 `.orynacode/plans/` |
| 无前缀 | Build 模式（默认） | 与 `/build` 相同 |

**使用示例**：

```
/plan 分析代码库的架构，制定重构方案
/build 实现用户认证模块
帮我修一下这个 bug（默认 build 模式）
```

OrynaCode 会自动识别前缀，切换到对应 Agent 模式后再执行任务。

---

> **提示**：OrynaGate 的完整部署文档请参考 [oryna.ai](https://oryna.ai)。
