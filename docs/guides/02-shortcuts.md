# OrynaCode TUI 快捷键参考

## 3. 快捷键速查表


| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Enter` | 发送消息 | 在输入框按 Enter 发送 |
| `Shift+Enter` | 换行 | 在输入框中插入新行 |
| `Escape` | 中断 | 中断当前 AI 执行 |
| `<leader>m` | 模型列表 | 打开模型选择对话框 |
| `F2` / `Shift+F2` | 切换模型 | 前后循环最近的模型 |
| `Tab` / `Shift+Tab` | 切换 Agent | 在 build/plan 之间切换 |
| `<leader>n` | 新建 Session | 创建新的对话 |
| `<leader>l` | Session 列表 | 打开 Session 切换列表 |
| `<leader>1-9` | 快速切换 | 切换到第 N 个 Session |
| `ctrl+r` | 重命名 | 重命名当前 Session |
| `ctrl+d` | 删除 | 删除当前 Session |
| `<leader>c` | 压缩 | 压缩过长的 Session |
| `<leader>x` | 导出 | 导出 Session 到编辑器 |
| `<leader>u` / `<leader>r` | 撤销/重做 | 撤销或重做上一轮对话 |
| `<leader>b` | 侧边栏 | 切换侧边栏显示 |
| `←` `→` `↑` | 子代理导航 | 在父子代理间切换 |
| `ctrl+b` | 后台 | 将子代理移到后台运行 |
| `ctrl+p` | 命令面板 | 打开命令面板搜索所有命令 |
| `ctrl+r` | Oryna 重登录 | 当 Oryna AI token 过期时重新登录 |

---


## 完整快捷键分类

## 4. 完整快捷键参考

### 1 全局快捷键

| 快捷键 | 功能 |
|--------|------|
| `ctrl+p` | 打开命令面板 |
| `ctrl+c`, `ctrl+d`, `<leader>q` | 退出 OrynaCode |
| `ctrl+z` | 挂起终端（macOS/Linux） |

### 2 会话管理

| 快捷键 | 功能 |
|--------|------|
| `<leader>n` | 新建 Session |
| `<leader>l` | Session 列表 / 切换 |
| `<leader>1` ~ `<leader>9` | 快速切换到第 N 个 Session |
| `ctrl+r` | 重命名当前 Session |
| `ctrl+d` | 删除当前 Session |
| `<leader>x` | 导出 Session 到编辑器 |
| `<leader>g` | 打开时间线浏览器 |
| `/share` | 生成分享链接 |
| `<leader>u` | 撤销上一轮对话 |
| `<leader>r` | 重做已撤销的对话 |
| `<leader>c` | 压缩长 Session |
| `escape` | 中断当前 AI 执行 |

### 3 模型与 Agent

| 快捷键 | 功能 |
|--------|------|
| `<leader>m` | 列出所有可用模型 |
| `F2` | 下一个最近使用的模型 |
| `Shift+F2` | 上一个最近使用的模型 |
| `<leader>a` | 列出所有 Agent |
| `Tab` | 下一个 Agent |
| `Shift+Tab` | 上一个 Agent |
| `ctrl+t` | 切换模型变体 |

### 4 会话导航（消息滚动）

| 快捷键 | 功能 |
|--------|------|
| `PageUp` / `PageDown` | 上/下翻页 |
| `Home` / `End` | 跳到第一条/最后一条消息 |
| `ctrl+alt+u` / `ctrl+alt+d` | 上半页/下半页滚动 |
| `ctrl+alt+y` / `ctrl+alt+e` | 上/下一行滚动 |

### 5 子代理导航

| 快捷键 | 功能 |
|--------|------|
| `<leader>down` | 跳到第一个子代理 |
| `↑` | 返回父代理 |
| `→` | 下一个子代理 |
| `←` | 上一个子代理 |
| `ctrl+b` | 将当前子代理移到后台运行 |

### 6 输入框操作

| 快捷键 | 功能 |
|--------|------|
| `Enter` | 发送（单行模式）/ 确认提交 |
| `Shift+Enter`, `ctrl+j` | 插入新行 |
| `ctrl+a` / `ctrl+e` | 行首 / 行尾 |
| `ctrl+k` | 删除到行尾 |
| `ctrl+u` | 删除到行首 |
| `ctrl+w` | 删除前一个词 |
| `alt+f` / `alt+b` | 向前/向后跳一个词 |
| `↑` / `↓` | 上一条/下一条历史记录 |
| `ctrl+v` | 粘贴 |
| `<leader>e` | 打开外部编辑器输入 |

### 7 对话框操作

| 快捷键 | 功能 |
|--------|------|
| `↑` / `↓` | 上/下选择 |
| `Enter` | 确认选择 |
| `Escape` | 关闭对话框 |
| `PageUp` / `PageDown` | 翻页 |

### 8 Diff 查看器

| 快捷键 | 功能 |
|--------|------|
| `Enter` / `Space` | 展开/折叠 |
| `→` / `←` | 展开/折叠 |
| `n` / `p` | 下一个/上一个文件 |
| `]` / `[` | 下一个/上一个 hunk |
| `v` | 切换统一/分栏视图 |
| `b` | 切换文件树 |
| `q` / `Escape` | 关闭 |

### 9 显示切换

| 快捷键 | 功能 |
|--------|------|
| `<leader>b` | 切换侧边栏 |
| `<leader>t` | 切换主题 |
| `<leader>h` | 切换代码块折叠 |
| `/thinking` | 切换思考块显示 |
| `/timestamps` | 切换消息时间戳 |
| `/scrollbar` | 切换滚动条 |

---

