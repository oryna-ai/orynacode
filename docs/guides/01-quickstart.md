# OrynaCode TUI 使用指南

## 目录

## 目录

1. [快速开始](#1-快速开始)
2. [核心概念速览](#2-核心概念速览)

## 1. 快速开始

### 1.1 启动 OrynaCode

在终端中进入你的项目目录，运行：

```bash
orynacode
```

也可以直接带 prompt 启动，进入后自动填入：

```bash
orynacode --prompt "帮我修复那个登录 bug"
```

![Home 页面全景](images/home-page.png)

### 1.2 首次运行

首次启动时，如果还没有连接任何 AI 提供商，系统会自动弹出 Provider 连接对话框。选择你想用的 AI 模型来源并完成连接。

![Provider 连接对话框](images/provider-connect-auto.png)

### 1.3 连接 Provider

OrynaCode 支持多种 AI 提供商，最常用的是：

| Provider | 认证方式 | 说明 |
|----------|---------|------|
| **Oryna AI** | OAuth（浏览器登录） | Oryna 云端模型，Token 过期后会自动提示重登录 |
| **OpenAI** | API Key | 需要 ChatGPT Plus/Pro 或独立 API Key |
| **Anthropic** | API Key | Claude 系列模型 |
| **OrynaGate** | 局域网扫描 | 自部署的局域网 LLM 网关，支持团队协作（详见第 9 章） |
| **自定义** | API Key | 任何兼容 OpenAI API 格式的第三方服务 |

在任意界面输入 `/connect` 或从命令面板选择 "Connect provider" 即可打开连接对话框。

![Provider 选择列表](images/provider-list.png)

### 1.4 Home 页面

Home 页面是 OrynaCode 的入口界面，包含以下区域：

- **顶部 LOGO** — OrynaCode 品牌标识
- **中间 Prompt 输入框** — 输入你要做的事情，直接回车发送。
  支持直接输入 shell 命令（如 `ls -la`、`git status`）。
  占位提示会轮播显示建议，例如：
  - "Fix a TODO in the codebase"
  - "What is the tech stack of this project?"
  - "Fix broken tests"
- **右侧 OrynaGate 状态** — 如果连接了 OrynaGate，会显示协作连接状态（`● Collab · URL`）
- **底部提示** — 显示快捷键提示和使用建议

![Home 页面各区域](images/home-page-annotated.png)

### 1.5 发出第一条消息

在 Home 页面输入你的任务，按 `Enter` 发送。OrynaCode 会创建一个新的 Session，AI 会开始分析代码库并执行任务。

> **提示**：OrynaCode 默认使用 **build** Agent，它可以执行所有工具（读写文件、运行命令、搜索代码等）。如果想先规划再执行，可以先切换到 **plan** 模式（`/plan` 或 `<leader>a`）。

![第一条消息的 Session 界面](images/first-session.png)

---

## 2. 核心概念速览

在深入使用之前，先了解 OrynaCode 的几个核心概念。

### 2.1 Session（会话）

Session 是你与 AI 的一次完整对话。每个 Session 包含用户消息、AI 回复、工具执行记录等。你可以在多个 Session 之间切换，每个 Session 独立维护上下文。

**常用操作**：新建（`<leader>n`）、切换（`<leader>l`）、重命名（`ctrl+r`）、删除（`ctrl+d`）。

### 2.2 Model（模型）

Model 决定了使用哪个 AI 大语言模型。你可以随时在对话中切换模型而不影响会话历史。

**常用操作**：列出模型（`<leader>m` 或 `/models`）、快速切换最近模型（`F2` / `Shift+F2`）、收藏/取消收藏（`ctrl+f`）。

### 2.3 Provider（提供商）

Provider 是模型的来源。比如 Oryna AI、OpenAI、Anthropic 等都是 Provider。每个 Provider 下面有各自的模型列表。

### 2.4 Agent（代理模式）

Agent 决定了 AI 的行为模式：

| Agent | 说明 |
|-------|------|
| **build**（默认） | 可以执行所有工具——读写文件、运行命令、搜索代码、网络查询等。适合直接干活。 |
| **plan** | 只读模式。不能修改文件，只能在 `.orynacode/plans/` 目录输出计划。适合先分析问题再规划方案。 |

**常用操作**：切换 Agent（`tab` / `shift+tab` 或 `<leader>a`）、从 plan 模式切回 build 时 AI 自动调用 `plan_exit`。

### 2.5 Subagent（子代理）

当任务复杂时，AI 会自动创建子代理来并行处理子任务。每个子代理是独立的 Session，有自己的上下文和工具权限。

**常用操作**：查看子代理（`<leader>down`）、前后切换（`←` `→`）、返回父代理（`↑`）、后台运行（`ctrl+b`）。

### 2.6 Tool（工具）

OrynaCode 提供丰富的工具供 AI 调用，包括：

- **文件操作**：读、写、编辑、补丁
- **搜索**：按文件名（Glob）、按内容（Grep）
- **终端**：执行 Shell 命令
- **网络**：WebFetch（抓取网页）、WebSearch（搜索）
- **任务管理**：Task（子代理）、TodoWrite（任务列表）
- **协作**：collab_reply（OrynaGate 协作回复）

### 2.7 Permission（权限）

每次 AI 调用工具时，可以根据预设策略自动允许、拒绝或询问用户。你可以在 `orynacode.json` 中预设权限规则，避免每次都手动确认。

---

