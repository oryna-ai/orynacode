# 会话功能详细指南

## . 会话功能详细指南

### 6.1 会话管理

**新建 Session**：
- 在 Home 页面输入问题并回车
- 或按 `<leader>n`

**切换 Session**：
- `<leader>l` 打开 Session 列表
- `<leader>1` ~ `<leader>9` 快速切换到前 9 个 Session

![Session 列表](images/session-list.png)

**重命名**：`ctrl+r` 或输入 `/rename`，输入新名称

**删除**：`ctrl+d` 或输入 `/delete`

**导出**：`<leader>x` 或输入 `/export`，可以将对话内容导出到编辑器（如 VS Code、Vim）中以 Markdown 格式查看

**分享**：`/share` 生成一个分享链接，对方可以通过链接查看会话

**撤销/重做**：
- `<leader>u` — 撤销上一轮对话（用户消息 + AI 回复）
- `<leader>r` — 重做已撤销的对话
- 撤销后消息区域会显示撤销提示

![撤销消息](images/session-revert.png)

### 6.2 消息交互

**用户消息**：
- 点击用户消息可以打开详情对话框，查看消息元数据或 Fork 出一个新 Session

**AI 回复**：
- 显示使用的模型名称、Agent 名称、耗时
- 推理/思考内容可折叠（点击或用 `/thinking` 切换）
- 错误信息以红色左边框显示

![AI 回复消息](images/assistant-message.png)

**工具调用**：
- 每个工具调用以图标+名称的形式展示
- 工具调用完成后显示为折叠状态，点击可展开查看完整输出
- 不同类型的工具有不同的展示风格（详见第 8 章）

### 6.3 权限请求

当 AI 尝试执行需要权限的操作时（如执行命令、修改文件），会弹出权限请求对话框。

![权限请求对话框](images/permission-dialog.png)

权限对话框支持：

- **Allow** — 允许本次操作
- **Deny** — 拒绝本次操作
- **Allow All** — 信任并允许后续同类操作
- **全屏查看**（`ctrl+f`）— 展开查看完整的命令或文件内容

你可以在 `orynacode.json` 中预设权限规则，避免每次都手动确认。例如：

```json
{
  "permission": {
    "*": "allow",
    "edit": "ask"
  }
}
```

### 6.4 Agent 提问

有时 AI 在分析过程中需要向你确认信息，会通过 Question 工具向你提问。

![Question 对话框](images/question-dialog.png)

支持三种回答方式：
- **选项选择**（单选/多选）— 用键盘 `↑` `↓` 选择，`Enter` 确认
- **自定义输入** — 输入自定义答案
- **多问题切换** — `Tab` 在多个问题之间切换

### 6.5 会话压缩

当 Session 过长（消息数量多、上下文超出模型限制）时，可以手动压缩：

- `<leader>c` 或输入 `/compact`
- AI 会自动生成一段会话摘要，用摘要替换历史消息，释放上下文空间

### 6.6 子代理

当任务比较复杂时，AI 会创建子代理（Subagent）来处理子任务。子代理是独立的 Session。

**子代理导航**：

```
父 Session
  ├── 子代理 1  ←→
  ├── 子代理 2  ←→
  └── 子代理 3
```

- `→` 进入下一个子代理
- `←` 进入上一个子代理
- `↑` 返回父 Session
- `<leader>down` 跳到第一个子代理

**后台运行**：按 `ctrl+b` 可以将正在前台运行的子代理移到后台，继续在当前 Session 工作。

![子代理 Footer](images/subagent-footer.png)

子代理 Footer 显示：
- 子代理名称（Task 描述）
- 位置（如 "2/3" 表示第 2 个，共 3 个）
- Token 用量和费用

### 6.7 时间线

`<leader>g` 或 `/timeline` 打开时间线浏览器，可以快速跳转到 Session 中的特定消息。

![时间线浏览器](images/timeline.png)

---

