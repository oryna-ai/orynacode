# Skills 技能系统

Skills 是 OrynaCode 的扩展机制——通过加载预定义的技能文件，给 AI 注入专业知识和参考手册。每个 Skill 是一个 Markdown 文件，包含指令、示例和资源引用。

## 目录

1. [Skills 是什么](#1-skills-是什么)
2. [Skills 加载机制](#2-skills-加载机制)
3. [如何使用 Skills](#3-如何使用-skills)
4. [创建自定义 Skill](#4-创建自定义-skill)
5. [内置 Skill](#5-内置-skill)
6. [Skills 权限](#6-skills-权限)
7. [对话中的 Skill 展示](#7-对话中的-skill-展示)
8. [加载流程](#8-加载流程)

---

## 1. Skills 是什么

Skills 就像给 AI 准备的"专业技能手册"。每个 Skill 包含：

| 组件 | 说明 | 示例 |
|------|------|------|
| **指令内容** | Markdown 格式的专业知识和工作流 | "当用户说要部署 Cloudflare 时..." |
| **文件资源** | Skill 目录下的脚本、模板、配置文件 | `deploy.sh`, `wrangler.toml` |
| **前置条件** | `description` 描述何时该加载此 Skill | "Use ONLY when working with Cloudflare Workers" |

Skills 与工具的对比：

| | Skills | 工具（Tools） |
|------|--------|-------------|
| 目的 | 提供知识和流程指导 | 执行具体操作 |
| 形式 | Markdown 文档 + 附属文件 | TypeScript/JS 函数 |
| 触发 | AI 判断任务匹配 / 用户指定 | AI 根据任务需求调用 |
| 输出 | 技能内容注入到对话上下文 | 执行结果（文件内容、命令输出等） |

---

## 2. Skills 加载机制

OrynaCode 从 4 种来源自动发现 Skills：

### 2.1 外部目录（默认启用）

```
~/.claude/skills/**/SKILL.md     # Claude Code 兼容
~/.agents/skills/**/SKILL.md     # Agents 兼容
```

同时会从当前工作目录向上 walk，查找 `.claude/` 和 `.agents/` 目录。

**禁用外部扫描**：

```bash
OPENCODE_DISABLE_EXTERNAL_SKILLS=1
# 或单独禁用 Claude 格式
OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1
```

### 2.2 配置目录（自动发现）

```
项目/.orynacode/skills/<name>/SKILL.md
~/.config/orynacode/skills/<name>/SKILL.md
```

放在这些目录下的 Skill 会自动被发现和加载。子目录名为 Skill 名称，必须与 `SKILL.md` frontmatter 中的 `name` 字段一致。

### 2.3 自定义路径

在 `orynacode.json` 中指定额外的 Skill 目录：

```jsonc
{
  "skills": {
    "paths": [
      ".orynacode/skills",           // 相对路径（相对于项目根目录）
      "/usr/local/share/my-skills",  // 绝对路径
      "~/work/team-skills"           // ~ 展开为用户主目录
    ]
  }
}
```

### 2.4 远程 URL

从远程仓库下载 Skills：

```jsonc
{
  "skills": {
    "urls": [
      "https://example.com/.well-known/skills/"
    ]
  }
}
```

远程 Skills 通过 `index.json` 索引文件发现（格式：`{ "skills": [{ "name": "...", "files": ["SKILL.md", "..."] }] }`），文件下载后缓存在本地。

---

## 3. 如何使用 Skills

### 3.1 `/skills` 对话框

输入 `/skills` 打开 Skill 选择器，显示所有可用的 Skill 列表。选择后输入框自动填入 `/<skill-name>`。

![Skills 选择对话框](images/placeholder.png)

### 3.2 斜杠命令

直接输入 `/<skill-name>` + `Enter` 加载指定 Skill。例如：

```
/cloudflare 帮我把这个项目部署到 Workers
```

### 3.3 AI 自动判断

Skills 也会通过 system prompt 注入给 AI。AI 阅读 Skill 的 `description` 后，当任务匹配时会自动调用 Skill 工具加载相关内容。

System prompt 中的 Skill 列表格式：

```xml
<available_skills>
  <skill>
    <name>cloudflare</name>
    <description>Deploy and manage Cloudflare Workers, Pages, and R2.</description>
    <location>file:///path/to/skills/cloudflare/SKILL.md</location>
  </skill>
</available_skills>
```

> **注意**：没有 `description` 的 Skill 不会出现在 system prompt 中——AI 看不到它。但依然可以通过 `/skill-name` 手动加载。

---

## 4. 创建自定义 Skill

### 4.1 目录结构

```
.orynacode/skills/
└── my-deploy/               ← 目录名 = Skill 名称
    ├── SKILL.md              ← 必需：Skill 的主文件
    └── deploy.sh             ← 可选：附属资源文件
```

### 4.2 SKILL.md 格式

```markdown
---
name: my-deploy
description: Use ONLY when deploying this project to production.
---

## Deployment Workflow

1. Run `deploy.sh` to build the project
2. Check the output for errors
3. If successful, verify the deployment URL

### Environment Variables

- `DEPLOY_TARGET`: Set to `production` or `staging`
- `DEPLOY_KEY`: API key for the deployment service

### Common Issues

- **Build fails with "no such module"**: Run `npm install` first
- **Timeout**: Increase `DEPLOY_TIMEOUT` in `.env`
```

### 4.3 字段说明

| 字段 | 必需 | 说明 |
|------|------|------|
| `name` | ✅ | Skill 名称，小写 + 连字符，最长 64 字符。必须与目录名一致 |
| `description` | **强烈建议** | 一句话说明何时使用此 Skill。没有此字段的 Skill 不会在 system prompt 中列出 |
| body | ✅ | Markdown 格式的指令和知识内容 |

### 4.4 编写建议

- **description 要精确**：写清楚触发条件。好的示例：`"Use ONLY when deploying Cloudflare Workers from this monorepo."` 差的示例：`"Helps with deployment."`
- **body 要结构化**：分步骤、分场景，用标题组织
- **引用相对路径**：Skill 中的文件路径相对于 SKILL.md 所在目录
- **可包含代码示例**：Markdown 代码块会被正确注入到 AI 上下文

---

## 5. 内置 Skill

OrynaCode 预置了一个内置 Skill：**`customize-opencode`**。

### 功能

当用户在编辑或创建 OrynaCode 自身的配置时（`orynacode.json`、`.orynacode/` 目录、Agent、Subagent、Plugin 等），AI 自动加载此 Skill，提供：

- 配置项参考（agent、mode、permission、plugin 等）
- Skill 创建规范（frontmatter 格式、命名约定）
- 文件位置参考（`~/.config/orynacode/`、`.orynacode/`）
- 最佳实践和常见模式

### 覆盖机制

如果用户在 `.orynacode/skills/` 下创建了同名的 `customize-opencode` Skill，用户版本**会覆盖**内置版本——加载用户定义的版本。

---

## 6. Skills 权限

Skills 的可用性可以按 Agent 控制。在 `orynacode.json` 中：

```jsonc
{
  "agent": {
    "build": {
      "permission": {
        "skill": "allow"    // Build Agent 可以使用 Skills
      }
    },
    "plan": {
      "permission": {
        "skill": "deny"     // Plan Agent 禁止使用 Skills
      }
    }
  }
}
```

也可以在全局级别控制：

```jsonc
{
  "permission": {
    "skill": "allow"
  }
}
```

权限不允许的 Agent，其 system prompt 中不会列出 Skills，AI 也无法调用 Skill 工具。

---

## 7. 对话中的 Skill 展示

当 AI 加载一个 Skill 时，对话中会显示：

```
→  Skill "my-deploy"      ← 加载中
→  Skill "my-deploy" ✓    ← 加载完成
```

加载后，Skill 的内容被注入到 AI 的对话上下文中，AI 可以按 Skill 里的指导来执行任务。

![Skill 工具调用](images/placeholder.png)

---

## 8. 加载流程

Skills 从启动到可用，经历以下完整 pipeline：

```
1. 环境变量检查 → OPENCODE_DISABLE_EXTERNAL_SKILLS / OPENCODE_DISABLE_CLAUDE_CODE_SKILLS
       ↓
2. 外部目录扫描 → ~/.claude/skills/**/SKILL.md + ~/.agents/skills/**/SKILL.md
       ↓         + 从工作目录向上 walk 查找 .claude/ .agents/
3. 配置目录扫描 → .orynacode/skills/**/SKILL.md + ~/.config/orynacode/skills/**/SKILL.md
       ↓
4. 自定义路径 → skills.paths 中的目录，递归扫描 **/SKILL.md
       ↓
5. 远程 URL → skills.urls 中的地址，下载 index.json → 拉取文件 → 本地缓存
       ↓
6. 解析每个 SKILL.md → 提取 frontmatter（name, description）和 body
       ↓
7. 去重 → 同名 Skill 以最后加载的为准（自定义路径 > 配置目录 > 外部目录）
       ↓
8. 权限过滤 → 按 Agent 权限过滤可用 Skills
       ↓
9. 注入 system prompt → 有 description 的 Skills 列出在 <available_skills> 中
```

---

## 环境变量参考

| 变量 | 说明 |
|------|------|
| `OPENCODE_DISABLE_EXTERNAL_SKILLS` | 设为 `1` 禁用所有外部目录扫描 |
| `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` | 设为 `1` 仅禁用 `.claude/` 目录扫描 |

> **相关文档**：
> - [命令大全](10-commands.md) — `/skills` 斜杠命令
> - [Agent 模式详解](05-agents.md) — 自定义 Agent 和权限配置
> - [配置参考 & 常见问题](08-config.md) — `orynacode.json` 配置项
