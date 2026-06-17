# MCP 服务器管理

MCP（Model Context Protocol）是一种开放协议，允许 AI 模型通过标准化的接口访问外部工具和数据源。OrynaCode 内置了 MCP 客户端，支持添加、管理和使用 MCP 服务器。

## 目录

1. [MCP 是什么](#1-mcp-是什么)
2. [添加 MCP 服务器](#2-添加-mcp-服务器)
3. [管理 MCP 服务器](#3-管理-mcp-服务器)
4. [MCP OAuth 认证](#4-mcp-oauth-认证)
5. [MCP 状态查看](#5-mcp-状态查看)
6. [MCP 工具与资源](#6-mcp-工具与资源)
7. [CLI 命令参考](#7-cli-命令参考)

---

## 1. MCP 是什么

MCP 是 Anthropic 提出的开放协议，让 AI 助手能够：

- 通过标准化接口调用外部 API
- 访问文件系统、数据库、SaaS 服务等
- 使用自定义工具扩展 AI 的能力

OrynaCode 的 MCP 客户端支持两种传输方式：

| 传输方式 | 说明 | 典型场景 |
|----------|------|----------|
| **Stdio** | 本地子进程通信 | 本地 MCP 服务器（如文件系统服务器） |
| **HTTP/SSE** | HTTP + Server-Sent Events | 远程 MCP 服务器（支持 OAuth 认证） |

连接后，MCP 服务器的工具会自动注入到 AI 的可用工具列表中，AI 可以像调用内置工具一样调用 MCP 工具。

---

## 2. 添加 MCP 服务器

### 2.1 TUI 方式

在 TUI 中输入 `/mcps` 或从 `/status` 进入 MCP 管理。

按 `space` 键切换 MCP 服务器的启用/禁用状态。TUI 中的 MCP 列表显示每个服务器的：

- 名称
- 连接状态（✓ 已连接 / ⊙ 连接中 / ✗ 失败 / ⊘ 禁用）
- 认证状态（OAuth 服务器）

### 2.2 CLI 方式（推荐用于批量配置）

```bash
# 添加本地 stdio 服务器
orynacode mcp add my-filesystem --url npx --env KEY1=value1

# 添加远程 HTTP 服务器
orynacode mcp add my-api --url https://example.com/mcp

# 带自定义请求头
orynacode mcp add my-api --url https://example.com/mcp --header "Authorization: Bearer token123"
```

### 2.3 配置文件方式

在 `orynacode.json` 中配置 MCP 服务器（适合团队共享配置）：

```jsonc
{
  "mcp": {
    "my-filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"],
      "env": {
        "CUSTOM_VAR": "value"
      }
    },
    "my-remote-api": {
      "type": "http",
      "url": "https://my-api.example.com/mcp"
    }
  }
}
```

---

## 3. 管理 MCP 服务器

### 3.1 启用/禁用

在 TUI 中用 `space` 键切换，或在 CLI 中：

```bash
# 连接
orynacode mcp connect my-filesystem

# 断开
orynacode mcp disconnect my-filesystem
```

### 3.2 查看列表

```bash
orynacode mcp list
```

输出示例：

```
  my-filesystem  ✓ connected (3 tools)
  my-api         ✗ failed - Connection refused
  my-database    ⊘ disabled
```

### 3.3 查看详情

```bash
orynacode mcp debug my-api
```

输出 OAuth 连接诊断信息（HTTP/SSE 连通性测试、状态码、响应头等）。

---

## 4. MCP OAuth 认证

部分 MCP 服务器需要 OAuth 认证。OrynaCode 支持完整的 OAuth 流程。

### 4.1 认证流程

```
orynacode mcp auth my-oauth-server
```

1. 列出所有带 OAuth 能力的服务器
2. 选择目标服务器
3. 如果已认证过，提示是否重新认证
4. 自动打开浏览器进行 OAuth 授权
5. 授权完成后自动回调并保存凭证

### 4.2 查看 OAuth 状态

```bash
orynacode mcp auth list
```

状态标识：

| 图标 | 含义 |
|------|------|
| `✓` | 已认证，凭证有效 |
| `⚠` | 认证已过期，需要重新认证 |
| `✗` | 未认证 |

### 4.3 清除 OAuth 凭证

```bash
orynacode mcp logout my-oauth-server
```

---

## 5. MCP 状态查看

### 5.1 TUI 底部状态栏

Session 页面底部 footer 显示 MCP 连接计数：

- `⊙ N MCP`（█ 绿色）— N 个全部健康连接
- `⊙ N MCP`（█ 红色）— N 个中有失败的

![MCP 状态](images/placeholder.png)

### 5.2 侧边栏

按 `<leader>b` 打开侧边栏，MCP 部分显示每个服务器的详细信息：

- 服务器名称
- 状态文字（connected / failed / disabled / needs auth）
- 彩色状态点
- 超过 2 个服务器时自动折叠

### 5.3 状态对话框

输入 `/status`（快捷键 `<leader>s`）打开系统状态对话框，包含：

- MCP 服务器列表及状态
- 需要认证的服务器显示帮助提示
  - `needs_auth` → `"Needs authentication (run: orynacode mcp auth {name})"`
  - `needs_client_registration` → 需要先获取 Client ID

### 5.4 环境变量方式

对于简单的 stdio MCP 服务器，也可以直接在 `orynacode.json` 中配置环境变量来传递认证信息，无需 OAuth。

---

## 6. MCP 工具与资源

### 6.1 自动注入

MCP 服务器连接成功后，其提供的工具会自动加入 AI 的工具库。AI 可见的 MCP 工具与内置工具（bash、read、grep 等）并列使用。

### 6.2 权限控制

MCP 工具的权限可以在 `orynacode.json` 中单独配置：

```jsonc
{
  "permission": {
    "mcp:my-filesystem:read_file": "allow",
    "mcp:my-api:create_item": "ask"
  }
}
```

权限格式为 `mcp:{服务器名}:{工具名}`。

### 6.3 MCP 资源

部分 MCP 服务器提供"资源"（Resources）——可被 AI 引用的上下文数据。在 OrynaCode 中，这些资源显示在 `@` 自动补全中，与项目参考文件并列。

输入 `@` 即可查看可用的 MCP 资源。

---

## 7. CLI 命令参考

| 命令 | 说明 |
|------|------|
| `orynacode mcp add <name>` | 添加 MCP 服务器（交互式） |
| `orynacode mcp add <name> --url <url>` | 添加远程 HTTP MCP 服务器 |
| `orynacode mcp add <name> --url npx --env KEY=val` | 添加本地 stdio MCP 服务器 |
| `orynacode mcp list` | 查看所有 MCP 服务器及状态 |
| `orynacode mcp auth <name>` | OAuth 认证（交互式） |
| `orynacode mcp auth list` | 查看 OAuth 认证状态 |
| `orynacode mcp logout <name>` | 清除 OAuth 认证凭证 |
| `orynacode mcp debug <name>` | OAuth 连接诊断 |
| `orynacode mcp connect <name>` | 连接 MCP 服务器 |
| `orynacode mcp disconnect <name>` | 断开 MCP 服务器 |

---

> **提示**：MCP 协议仍在发展中，更多 MCP 服务器可在 [mcp.so](https://mcp.so) 或 [github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) 找到。
