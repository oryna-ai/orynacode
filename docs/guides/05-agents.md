# Agent 模式详解

## . Agent 模式详解

### 7.1 Build 模式（默认）

Build 是 OrynaCode 的默认模式。在这个模式下，AI 可以：

- 读取和分析代码文件
- 创建和修改文件
- 运行 shell 命令
- 搜索代码和文件
- 浏览网页
- 创建和管理子代理

**使用场景**：直接修复 bug、实现新功能、重构代码等需要实际操作的场景。

### 7.2 Plan 模式

Plan 模式是只读模式。AI **不能**修改任何文件，只能：

- 读取和分析代码
- 搜索代码和文件
- 将计划写入 `.orynacode/plans/` 目录

**使用场景**：先分析问题、制定详细计划，再切换到 Build 模式执行。

**切换到 Plan**：
- 输入 `/plan` 或 `<leader>a` 选择 "plan"
- 或直接按 `tab` 切换到 plan

**退出 Plan**：
- AI 完成任务后会调用 `plan_exit` 自动切回 Build 模式
- 或手动 `tab` 切换或用 `<leader>a` 选择 "build"

![Plan 模式](images/plan-mode.png)

### 7.3 切换 Agent

- `/agents` 或 `<leader>a` — 打开 Agent 列表对话框
- `tab` / `shift+tab` — 在所有 Agent 之间快速切换（build ↔ plan ↔ 自定义 Agent）

![Agent 列表](images/agent-list.png)

底部状态栏会显示当前使用的 Agent 名称和颜色标识。

### 7.4 自定义 Agent

你可以在 `.orynacode/agent/` 目录下创建 Markdown 文件来定义自定义 Agent，然后在 `orynacode.json` 中配置。

**示例**：创建 `.orynacode/agent/code-reviewer.md`：

```markdown
你是一个代码审查专家。你的任务是：
1. 阅读代码变更
2. 检查潜在 bug
3. 审查代码风格和最佳实践
4. 给出改进建议
```

在 `orynacode.json` 中配置：

```json
{
  "agent": {
    "code-reviewer": {
      "description": "专业的代码审查 Agent",
      "mode": "primary",
      "permission": {
        "read": "allow",
        "grep": "allow",
        "glob": "allow",
        "edit": "deny",
        "bash": "deny"
      }
    }
  }
}
```

---

