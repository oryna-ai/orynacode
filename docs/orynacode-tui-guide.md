# OrynaCode TUI 使用指南

> **OrynaCode** 是基于 [OpenCode](https://github.com/anomalyco/opencode)（MIT 协议）构建的 AI 编程助手，专为 Oryna AI 平台定制。

## 目录

| 章节 | 内容 | 链接 |
|------|------|------|
| 1 | 快速开始 & 核心概念 | [阅读 →](guides/01-quickstart.md) |
| 2 | 快捷键速查 & 完整参考 | [阅读 →](guides/02-shortcuts.md) |
| 3 | 模型与 Provider 详细指南 | [阅读 →](guides/03-models-providers.md) |
| 4 | 会话功能详细指南 | [阅读 →](guides/04-sessions.md) |
| 5 | Agent 模式详解 | [阅读 →](guides/05-agents.md) |
| 6 | 工具系统详解 | [阅读 →](guides/06-tools.md) |
| 7 | OrynaGate 远程协作 (collab_reply) | [阅读 →](guides/07-orynagate-collab.md) |
| 8 | 配置参考 & 常见问题 | [阅读 →](guides/08-config.md) |
| 9 | Oryna AI API 参考 | [阅读 →](guides/09-oryna-api.md) |
| 10 | 命令大全 | [阅读 →](guides/10-commands.md) |
| 11 | MCP 服务器管理 | [阅读 →](guides/11-mcp.md) |
| 12 | Skills 技能系统 | [阅读 →](guides/12-skills.md) |

## 快速安装

```bash
curl -fsSL https://oryna.ai/orynacode/install | bash
```

## 快速参考

| 功能 | 快捷键 |
|------|--------|
| 模型列表 | `<leader>m` |
| 切换 Agent | `Tab` / `Shift+Tab` |
| 新建 Session | `<leader>n` |
| 中断执行 | `Escape` |
| 命令面板 | `Ctrl+P` |
| MCP 管理 | `/mcps` |

> `<leader>` 默认为 `Ctrl+X`，可在 `tui.json` 中自定义。

## 截图

截图文件对应每个章节，放在 `docs/images/` 目录。完整清单见 [images/SCREENSHOTS.md](images/SCREENSHOTS.md)。
