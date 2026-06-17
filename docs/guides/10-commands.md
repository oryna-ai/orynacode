# 命令大全

OrynaCode 的所有斜杠命令（`/` 开头），按分类组织。输入 `/` 即可在提示框中搜索。

## 目录

1. [会话管理](#1-会话管理)
2. [模型与 Agent](#2-模型与-agent)
3. [显示切换](#3-显示切换)
4. [输入工具](#4-输入工具)
5. [系统](#5-系统)
6. [命令面板](#6-命令面板)

---

## 1. 会话管理

| 命令 | 别名 | 快捷键 | 说明 |
|------|------|--------|------|
| `/sessions` | `/resume`, `/continue` | `<leader>l` | 打开 Session 列表，选择并切换到已有 Session |
| `/new` | `/clear` | `<leader>n` | 新建 Session |
| `/rename` | — | `ctrl+r` | 重命名当前 Session |
| `/delete` | — | `ctrl+d` | 删除当前 Session |
| `/share` | — | — | 生成当前 Session 的分享链接 |
| `/unshare` | — | — | 取消分享 |
| `/fork` | — | — | 从选中的消息 Fork 出一个新 Session |
| `/compact` | `/summarize` | `<leader>c` | 压缩超长 Session，用摘要替换历史消息 |
| `/undo` | — | `<leader>u` | 撤销上一轮对话 |
| `/redo` | — | `<leader>r` | 重做已撤销的对话 |
| `/export` | — | `<leader>x` | 导出 Session 到编辑器或文件 |
| `/copy` | — | — | 复制 Session 完整文本到剪贴板 |
| `/move` | — | — | 将 Session 移动到其他工作区 |

---

## 2. 模型与 Agent

| 命令 | 别名 | 快捷键 | 说明 |
|------|------|--------|------|
| `/models` | `/mo` | `<leader>m` | 打开模型选择对话框（收藏 + 最近 + 全部） |
| `/agents` | — | `<leader>a` | 打开 Agent 列表（build / plan / 自定义） |
| `/variants` | — | `ctrl+t` | 切换当前模型的变体 |
| `/connect` | — | — | 打开 Provider 连接对话框 |
| `/mcps` | — | — | 打开 MCP 服务器管理对话框（启用/禁用） |
| `/org` | `/orgs`, `/switch-org` | — | 切换组织结构（企业版功能） |

---

## 3. 显示切换

| 命令 | 别名 | 快捷键 | 说明 |
|------|------|--------|------|
| `/thinking` | `/toggle-thinking` | — | 显示/隐藏 AI 推理过程（思考块） |
| `/timestamps` | `/toggle-timestamps` | — | 显示/隐藏每条消息的时间戳 |
| `/diff` | — | — | 打开 Diff 查看器，查看代码变更 |
| `/sidebar` | — | `<leader>b` | 切换侧边栏（工作区信息、MCP 状态） |
| `/scrollbar` | — | — | 切换 Session 滚动条 |

---

## 4. 输入工具

| 命令 | 别名 | 快捷键 | 说明 |
|------|------|--------|------|
| `/editor` | — | `<leader>e` | 打开外部编辑器输入长文本 |
| `/skills` | — | — | 加载 Skill 指令集 |
| `/warp` | — | — | 切换工作区目录 |

---

## 5. 系统

| 命令 | 别名 | 快捷键 | 说明 |
|------|------|--------|------|
| `/themes` | — | `<leader>t` | 打开主题选择列表 |
| `/status` | — | `<leader>s` | 查看系统状态（版本、MCP、Provider 连接） |
| `/help` | — | — | 打开帮助文档 |
| `/exit` | `/quit`, `/q` | `ctrl+d` | 退出 OrynaCode |

---

## 6. 命令面板

按 `Ctrl+P` 打开命令面板，搜索和执行所有命令。面板会按以下方式组织：

- **Suggested**（搜索内容为空时）：推荐最常用的命令（切换 Session、切换模型、连接 Provider）
- **分类搜索**：输入关键词即可按分类过滤
- **快捷键提示**：每个命令右侧显示绑定的快捷键

命令面板中的命令类型包括：

| 类型 | 说明 |
|------|------|
| 斜杠命令 | 本文档中列出的所有 `/` 命令 |
| 快捷键命令 | 有快捷键绑定但无斜杠名的命令（如 `app.toggle.animations`） |
| 工具切换 | 输入框中的工具切换（如 `/editor`） |

### 自动补全中的命令

在输入框中输入 `/` 会触发自动补全，列出所有可用命令。同时 `@` 符号会触发 MCP 资源和参考文件的自动补全。

---

> **提示**：所有命令都可以在 `tui.json` 的 `keybinds` 中自定义快捷键。例如：
> ```json
> { "keybinds": { "session_new": "ctrl+n", "model_list": "ctrl+m" } }
> ```
