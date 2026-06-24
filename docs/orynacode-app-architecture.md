# OrynaCode Desktop 架构设计

> 基于 Wails3 + opencode vanilla 的桌面客户端。Go 层承载 Auth / WS / 项目管理，opencode 保持最小 patch。

## 目录

1. [项目定位](#1-项目定位)
2. [整体架构](#2-整体架构)
3. [Go Backend 设计](#3-go-backend-设计)
4. [前端设计](#4-前端设计)
5. [数据流](#5-数据流)
6. [OrynaCode Patch 范围](#6-orynacode-patch-范围)
7. [构建与发布](#7-构建与发布)
8. [项目与 Session 联动](#8-项目与-session-联动)
9. [分层与 TUI 通信](#9-分层与-tui-通信)
10. [已确认的技术决策](#10-已确认的技术决策)
11. [待确认](#11-待确认)

---

## 1. 项目定位

### 与现有项目的关系

```
当前仓库：oryna.ai/code
  ├── 主要发行版：终端 TUI（packages/opencode + packages/tui）
  ├── 维护模式：缩减到 2 个 patch（auto-reply + branding）
  └── 继续发布 TUI 版本

新仓库：oryna.ai/orynacode-app
  ├── 新项目：Wails3 Desktop 客户端
  ├── 从零初始化（wails3 init）
  ├── opencode 以二进制子进程方式引入（Go embed 打入 Wails3 二进制）
  └── Go 层承载 Auth / WS / 项目管理
```

### 核心思路

```
opencode vanilla（上游最新版）
  ↓ 只打 2 个 patch（auto-reply + branding）
  ↓ 作为 Bun 子进程运行
  ↑ Go Backend 通过 shell args + env vars 注入配置
  ↑ 不修改 opencode 核心代码
```

### Go Backend 承接的功能

| 功能 | 原位置（OrynaCode fork） | 新位置 |
|------|------------------------|--------|
| OAuth 登录 / JWT 刷新 | `oryna.ts`、`plugin/oryna.ts` | Go Auth Layer |
| 401 重登录提示 | `session/index.tsx`、`processor.ts` | Go HTTP Proxy |
| OrynaGate WS 连接 | `oryna/agent.ts` | Go WS Manager |
| 局域网扫描 | `util/lan-scan.ts` | Go LAN Scanner |
| 协作回复收发 | `oryna/reply-service.ts` | Go WS Manager |
| `.orynagate` 读取 | `oryna/agent.ts` | Go Project Manager |
| API Key 注入 | `provider.ts:1689`、`agent.ts:82` | Go env injection |
| needs_auth 状态 | `session/status.ts` | Go Proxy 拦截 |

---

## 2. 整体架构

### 架构图

```
┌──────────────────────────────────────────────────────────┐
│                  orynacode.app (Wails3)                   │
│                                                          │
│    ┌──────────────────────────────────────────────┐     │
│    │              Frontend (SolidJS)                │     │
│    │                                               │     │
│    │  ┌───────────────┐  ┌──────────────────────┐ │     │
│    │  │   Sidebar     │  │  Terminal (xterm.js)  │ │     │
│    │  │               │  │                       │ │     │
│    │  │ 📁 Projects   │  │  ┌─────────────────┐  │ │     │
│    │  │  · orynacode  │  │  │                 │  │ │     │
│    │  │  · qingyun    │  │  │  orynacode TUI  │  │ │     │
│    │  │ ─────────────│  │  │  █▀▀█ █▀▀█ █^^█ │  │ │     │
│    │  │ 💬 Sessions  │  │  └─────────────────┘  │ │     │
│    │  │  · 修复登录   │  │                       │ │     │
│    │  └───────────────┘  └──────────────────────┘ │     │
│    └───────────────────────┬───────────────────────┘     │
│                            │                              │
│              Wails3 IPC Bindings + Events                 │
│                            │                              │
│    ┌───────────────────────┴───────────────────────┐     │
│    │              Go Backend                         │     │
│    │                                                │     │
│    │  ┌───────────┐ ┌──────────┐ ┌──────────────┐ │     │
│    │  │    Auth   │ │ WS Mgr   │ │ Project Mgr  │ │     │
│    │  │           │ │          │ │              │ │     │
│    │  │ OAuth     │ │ WS Pool  │ │ .orynagate   │ │     │
│    │  │ JWT store │ │ connect  │ │ env inject   │ │     │
│    │  │ refresh   │ │ relay    │ │ PTY spawn    │ │     │
│    │  │ 401 retry │ │ hearbeat │ │              │ │     │
│    │  └───────────┘ └────┬─────┘ └──────┬───────┘ │     │
│    │                     │              │          │     │
│    └─────────────────────┼──────────────┼──────────┘     │
│                          │ WS           │ PTY            │
└──────────────────────────┼──────────────┼────────────────┘
                           │              │
              ┌────────────┴─────┐  ┌────┴──────────────┐
              │   OrynaGate      │  │   Bun Server       │
              │   Server         │  │   (vanilla + 2)    │
              │                  │  │                    │
              │   collab msg     │  │   · auto-reply     │
              │   forwarding     │  │   · branding       │
              └──────────────────┘  └────────────────────┘
```

### 3 条数据主线

```
主线 1：用户 —> TUI
  Sidebar 选项目 → Go 读 .orynagate → inject env → spawn PTY
  → xterm.js 渲染 → 用户输入 → PTY → orynacode CLI → LLM 请求
  → 响应 → PTY stdout → xterm.js 渲染

主线 2：协作消息（OrynaGate）
  OrynaGate → WS → Go WS Manager → onCollabMessage event → 
  Bun Server (HTTP prompt API) → LLM 执行 → processor auto-reply
  → sendReply() → Go WS Manager → OrynaGate

主线 3：项目切换
  Sidebar 选择 → Go kill PTY → Go 读 {dir}/.orynagate
  → Go inject env → Go spawn new PTY → xterm.js reconnect
```

---

## 3. Go Backend 设计

### 3.1 PTY Manager

**职责**：为每个活动项目维护一个 PTY 子进程

```go
type PtyManager struct {
    current *os.Process   // 当前活动的子进程
    pty     *os.File      // PTY 主端文件描述符
}

// 启动 orynacode CLI
func (m *PtyManager) Start(dir string, env map[string]string) error

// 停止当前子进程
func (m *PtyManager) Stop() error

// 切换项目（Stop + Start）
func (m *PtyManager) Switch(dir string, env map[string]string) error

// PTY 数据读取循环（goroutine）
func (m *PtyManager) ReadLoop(onData func([]byte))
```

**接口**（Wails3 bindings 暴露给前端）：

| 方法 | 说明 |
|------|------|
| `SwitchProject(dir string)` | 切换项目 |
| `ResizeTerminal(cols, rows int)` | 终端尺寸变化 |

### 3.2 Auth Layer

**职责**：OAuth 登录、JWT 存储、自动刷新、token 发放

```go
type AuthManager struct {
    token    string          // 当前 JWT
    store    TokenStore      // macOS Keychain / 文件存储
    server   *OAuthServer    // 本地 HTTP server，接收 callback
}

// 登录流程
func (a *AuthManager) Login() (string, error) {
    // 1. 启动本地 HTTP server（随机端口）
    // 2. 打开浏览器：https://oryna.ai/login?redirect_uri=...&state=...
    // 3. 等待 callback 返回 token
    // 4. 保存到 Keychain
    // 5. 返回 token
}

// 自动刷新
func (a *AuthManager) Refresh() error

// 获取当前 token（内部处理过期刷新）
func (a *AuthManager) GetToken() (string, error)
```

**Token 存储策略**：

| 平台 | 存储方式 |
|------|---------|
| macOS | Keychain (`security add-generic-password`) |
| Windows | Credential Manager (Win32 API) |
| Linux | Secret Service (`secret-tool`) 或 fallback 加密文件 |

### 3.3 WS Manager（OrynaGate 协作）

**职责**：OrynaGate WebSocket 连接池、消息转发

```go
type WsManager struct {
    conn     *websocket.Conn
    url      string
    token    string
    ready    bool
}

// 连接到 OrynaGate
func (w *WsManager) Connect(url, token string) error

// 断开连接
func (w *WsManager) Disconnect()

// 设置 ready 状态
func (w *WsManager) SetReady(ready bool)

// 发送协作回复（TUI 通过 HTTP /reply 端点调用）
func (w *WsManager) SendReply(content, to string) error
```

**事件**（Go → 前端）：

| 事件 | 说明 |
|------|------|
| `collab:message` | 收到协作消息 `{content, from}` |
| `collab:status` | WS 连接状态变化 `{connected, processing, url}` |

### 3.4 Project Manager

**职责**：项目发现、`.orynagate` 读取、env 组装

```go
type ProjectManager struct {
    current string        // 当前项目目录
}

// 读取 .orynagate
func (p *ProjectManager) ReadConfig(dir string) (OrynaGateConfig, error)

// 为项目计算 env vars
func (p *ProjectManager) EnvFor(dir string) map[string]string {
    cfg, _ := p.ReadConfig(dir)
    return map[string]string{
        "ORYNA_GATE_API_KEY":   cfg.ApiKey(),
        "ORYNA_GATE_TOKEN":     cfg.Token(),
        "ORYNA_GATE_WORKSPACE":   dir,
        "ORYNA_GATE_URL":       cfg.Url,
    }
}
```

---

## 4. 前端设计

### 4.1 Terminal 组件

**技术选型**：xterm.js + `xterm-addon-fit`

```tsx
// 核心数据流
Go PTY stdout → WebSocket/WriteFile → xterm.js term.write(data)
xterm.js 用户输入 → term.onData(callback) → WriteFile → Go PTY stdin
```

**关键实现**：

```tsx
function Terminal() {
    const termRef = useRef<Terminal>()
    
    useEffect(() => {
        const term = new Terminal({ 
            fontSize: 14, 
            fontFamily: 'MesloLGS NF, monospace',
            allowProposedApi: true,
        })
        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(containerRef.current)
        fitAddon.fit()

        // PTY 的输出 → 写入终端
        window.go.main.PtyManager.OnData((data: Uint8Array) => {
            term.write(data)
        })

        // 用户输入 → 写入 PTY
        term.onData((input: string) => {
            window.go.main.PtyManager.Write(input)
        })

        // 窗口大小变化
        const onResize = () => { 
            fitAddon.fit()
            const { cols, rows } = term
            window.go.main.PtyManager.ResizeTerminal(cols, rows)
        }
        window.addEventListener('resize', onResize)
        return () => term.dispose()
    }, [])
    
    return <div ref={containerRef} />
}
```

### 4.2 Sidebar 组件

**数据源**：Bun Server HTTP API（已有）

| Panel | API | 响应结构 |
|-------|-----|---------|
| 项目列表 | `GET /config/projects` | `Project[]` |
| Session 列表 | `GET /session/list?directory=xxx` | `Session[]` |
| Provider 状态 | `GET /provider` | `Provider[]` |

**项目切换**：

```tsx
function ProjectItem({ dir }: { dir: string }) {
    const active = useProject(dir)
    
    return (
        <div 
            className={active ? 'active' : ''}
            onClick={() => window.go.main.PtyManager.SwitchProject(dir)}
        >
            {path.basename(dir)}
            <span className="status">{active ? '●' : ''}</span>
        </div>
    )
}
```

### 4.3 通信方式总结

| 通道 | 用途 | 方向 |
|------|------|------|
| PTY stdin/stdout | Terminal ↔ TUI CLI | 双向 |
| HTTP API | Sidebar ↔ Bun Server | 双向（REST） |
| Wails3 Bindings | Frontend → Go (call) | 单向 |
| Wails3 Events | Go → Frontend (notify) | 单向 |

---

## 5. 数据流

### 5.1 项目切换流程

```
用户点 Sidebar 选择项目 "qingyun"
  ↓
Frontend: Go.SwitchProject("/Users/lishan/qingyun")
  ↓
Go: PtyManager.Stop()               # kill 当前子进程
  ↓
Go: ProjectManager.EnvFor(dir)       # 读 .orynagate + 组装 env
  ↓  env = {
  ↓    ORYNA_GATE_API_KEY=sk-ticket-lishan-xxx
  ↓    ORYNA_GATE_WORKSPACE=/Users/lishan/qingyun
  ↓    ORYNA_GATE_URL=http://192.168.1.100:9527
  ↓  }
  ↓
Go: PtyManager.Start(dir, env)       # spawn "orynacode" with env
  ↓
Go: OnData callback → Frontend       # PTY 输出流开始
  ↓
Frontend: xterm.js 重连并渲染
```

### 5.2 协作消息接收

```
OrynaGate → WS → Go WsManager.Receive()
  ↓
Go: EmitEvent("collab:message", {content, from})
  ↓
Frontend: onCollabMessage → sdk.client.session.prompt({
  system: "你是协作参与者...",
  parts: [{text: content}],
  agent: currentAgent
})
  ↓
Bun Server → LLM → processor auto-reply hook
  ↓
processor: sendReply(output, from)  → fetch(ORYNA_GATE_REPLY_URL + "/reply")
  ↓
Go: WsManager.HandleReply()  # HTTP handler
  ↓
Go: WsManager.SendReply()  # 通过 WS 发给 OrynaGate
```

### 5.3 OAuth 登录流程

```
用户点 "Login with Oryna AI"
  ↓
Frontend: Go.Auth.Login()
  ↓
Go: 启动本地 HTTP server (127.0.0.1:随机端口)
Go: 打开浏览器 https://oryna.ai/login?redirect_uri=...&state=...
  ↓ (用户完成登录)
  ↓ 浏览器 → localhost/callback?token=jwt&state=...
Go: 校验 state，提取 JWT
Go: 存入 Keychain
  ↓
Go: 返回 token 给 Frontend
  ↓
Frontend: 注入 env → 重启 PTY → TUI 使用新 token
```

---

## 6. OrynaCode Patch 范围

### 需要保留的 2 个 patch

| # | 文件 | 内容 | 原因 |
|---|------|------|------|
| 1 | `processor.ts` | 协作 auto-reply hook | 纯 server 端逻辑，与 Wails3 无关 |
| 2 | 品牌相关 | logo / 命令名 / 更新检查地址 | 对外开放的品牌标识 |

### 可以删除（移至 Go 层）

| 文件 | 功能 | 新位置 |
|------|------|--------|
| `oryna/agent.ts` | WS 连接/心跳/Reply 轮询 | Go WsManager |
| `oryna/agent-signal.ts` | 连接状态 Signal | Go Events |
| `oryna/reply-service.ts` | 文件 IPC 回复 | Go WsManager |
| `oryna/util/lan-scan.ts` | 局域网扫描 | Go LAN Scanner |
| `plugin/oryna.ts` | OAuth/JWT 刷新/OrynaGateProvider | Go AuthLayer + 不需要 Provider |
| `session/status.ts` | `needs_auth` status | Go Proxy 拦截 |
| `session/processor.ts` | 401 → needs_auth | Go Proxy 拦截 |
| `provider/provider.ts` | orynagate apiKey override | Go env injection |
| `session/index.tsx` | needsReAuth / handleOrynaReAuth / ctrl+r | Frontend Auth UI |
| `dialog-model.tsx` | Oryna OAuth auto-trigger | Frontend Auth UI |
| `dialog-provider.tsx` | ConnectLocal / LAN scan UI | Frontend + Go |
| `app.tsx` | `ORYNA_GATE_WORKSPACE` env | Go PTY Manager |
| `presentation.ts` / `logo.ts` | 部分品牌内容 | 可能需要保留 |

### 需要的 env vars

Go 层注入给 Bun CLI 的环境变量：

| 变量 | 说明 | 示例 |
|------|------|------|
| `ORYNA_API_KEY` | Oryna AI 的 JWT Token | `eyJhbG...` |
| `ORYNA_GATE_URL` | OrynaGate 服务地址 | `http://192.168.1.100:9527` |
| `ORYNA_GATE_API_KEY` | OrynaGate API Key（用于 LLM 请求） | `sk-ticket-lishan-abc123` |
| `ORYNA_GATE_TOKEN` | OrynaGate WS Token | `sk-ticket-lishan-abc123` |
| `ORYNA_GATE_WORKSPACE` | 工作区目录 | `/Users/lishan/qingyun` |

---

## 7. 构建与发布

### 7.1 项目目录结构

详见 [8.5 仓库结构](#85-仓库结构)。

### 7.2 Wails3 配置

```json
{
    "name": "orynacode-app",
    "outputfilename": "OrynaCode",
    "frontend:install": "bun install",
    "frontend:build": "bun run build",
    "frontend:dev:watcher": "bun run dev",
    "author": {
        "name": "Oryna AI",
        "email": "hi@oryna.ai"
    }
}
```

### 7.3 开发命令

```bash
# 下载 opencode 二进制（开发时用）
VERSION=1.17.8
make download-opencode VERSION=$VERSION    # 下载到 build/

# 开发模式
wails3 dev                                  # 热重载前端 + Go

# 构建（编译时 embed opencode）
wails3 build

# 打包 DMG (macOS)
wails3 build -platform darwin/universal
```

**开发 vs 发布**：开发模式下（`wails3 dev`），Go embed 可能不可用——Go 直接调 `build/opencode-{platform}`。发布构建时（`wails3 build`），`//go:embed` 将 opencode 打包进 Wails3 二进制。

---

## 8. 项目与 Session 联动

### 8.1 组件间关系

```
Wails3 Sidebar                          Bun Server
┌──────────────────┐                    ┌──────────────┐
│ 📁 Projects      │                    │              │
│  · orynacode  ●─ │──HTTP GET─────────→│ /session/list│
│  · qingyun       │←───Session[]──────│ /project/{id}│
│ ─────────────────│                    │              │
│ 💬 Sessions      │                    └──────────────┘
│  · 修复登录bug    │──点击─→ Go PTY Manager → 注入 env → spawn PTY
│  · API重构       │                          ↓
│  · 测试部署      │                    xterm.js 渲染 TUI
└──────────────────┘
```

### 8.2 Bun Server 已有的联动 API

以下 API 无需修改，Wails3 直接使用：

| API | 用途 | 示例 |
|-----|------|------|
| `GET /session/list?directory={dir}` | 列出项目的所有 Session | `GET /session/list?directory=/Users/lishan/qingyun` |
| `GET /session/list?scope=global` | 列出所有项目的 Session | Sidebar "All Sessions" 视图 |
| `GET /project/{id}/directories` | 获取项目已知目录 | 用于同步 `projects.json` |
| `GET /project/current` | 获取当前活跃项目信息 | 启动时恢复上次状态 |

### 8.3 联动流程

**流程 A：选项目 → 刷新 Session 列表**

```
用户点 Sidebar 选择 "qingyun"
  ↓
Go 并发两件事：
  ├→ HTTP GET /session/list?directory=/Users/lishan/qingyun
  │       ↓ 返回 [{id: "ses_xxx", title: "修复登录bug"}, ...]
  │       ↓ EmitEvent("sidebar:sessions", sessions)
  │       ↓ Sidebar 刷新 Session 列表
  │
  └→ PtyManager.Switch("/Users/lishan/qingyun")
          ↓ kill 旧 PTY → inject env → spawn 新 PTY
          ↓ xterm.js 重连 → 显示新 TUI
```

**流程 B：点击 Session → TUI 跳转**

```
Sidebar 点 Session "修复登录bug"（sessionID: ses_abc）
  ↓
两种方式：

方式 1（推荐，通过 CLI 子进程）：
  Go → PTY stdin: "/session ses_abc\n"
  ↓
  TUI 自动跳转到该 Session

方式 2（通过 HTTP API）：
  Go → HTTP POST /session/{ses_abc}/select
  ↓
  TUI 事件广播 → session/index.tsx 收到 → 导航到 Session
```

### 8.4 项目存储

Go 侧维护 `~/.orynacode/projects.json`：

```json
{
  "recent": [
    {
      "name": "OrynaCode",
      "dir": "/Users/lishan/orynacode",
      "ticket": "649310e5adbdc2879544b4f9",
      "orynagate_url": "http://192.168.1.100:9527"
    },
    { "name": "qingyun", "dir": "/Users/lishan/qingyun" }
  ],
  "current": "/Users/lishan/orynacode"
}
```

三层发现机制：

| 层 | 触发时机 | 机制 |
|----|---------|------|
| **手动** | 用户点 "Open Project" | Go 调原生文件对话框 |
| **自动发现** | App 首次启动 | Go 扫描常见目录找 `.orynagate` 或 `.git` |
| **同步** | Bun Server 启动后 | Go 调 `GET /project/{id}/directories` 合并 |

### 8.5 仓库结构

OrynaCode Desktop 是**独立仓库**，不与 TUI fork 混在同一 Git 仓库：

```
独立仓库：github.com/oryna-ai/orynacode-app
├── main.go                 # Wails3 入口
├── go.mod                  # Go 依赖
├── app.go                  # 应用启动 + Wails3 bindings
├── internal/
│   ├── pty/                # PTY Manager
│   ├── auth/               # Auth Layer (OAuth + JWT + Keychain)
│   ├── ws/                 # WS Manager (OrynaGate collab + reply polling)
│   └── project/            # Project Manager (.orynagate + env + store)
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # 主布局：Sidebar + Terminal
│   │   ├── Terminal.tsx    # xterm.js 组件
│   │   └── Sidebar.tsx     # 项目 + Session 列表
│   └── package.json
├── build/                   # 构建时下载，每个平台一个 opencode 二进制
│   ├── opencode-darwin-arm64
│   ├── opencode-darwin-x64
│   ├── opencode-linux-x64
│   └── opencode-windows-x64
├── wails.json              # Wails3 配置
└── Makefile

# opencode 二进制通过 Go embed 打入 Wails3 包内
# 运行时提取到临时目录执行
# Wails3 有自己的 bin/ 目录，不冲突

独立仓库：github.com/oryna-ai/code （当前项目）
├── packages/opencode/      # TUI fork（继续维护，2 个 patch）
└── packages/tui/           # TUI SolidJS 前端
```

**为什么独立仓库**：

| 维度 | 同项目分支 | 独立仓库 |
|------|----------|---------|
| Git 历史 | TUI fork + Go + Wails3 混乱 | 干净，独立演进 |
| 发布 | 版本号纠缠 | 独立版本号 |
| 构建系统 | Bun monorepo + Go 混在一起 | 各自独立构建 |
| 引用关系 | 没有清晰边界 | TUI fork 可作 git submodule 或不需要 |

opencode 通过 **Go embed** 机制打入 Wails3 二进制——构建时下载 opencode 到 `build/` 目录，编译时 `//go:embed` 嵌入，运行时提取到临时目录执行。

```go
// build/embed.go
package build

import (
    "io/fs"
    "embed"
)

//go:embed opencode-darwin-arm64 opencode-darwin-x64 opencode-linux-x64 opencode-windows-x64
var opencodeFS embed.FS

func ExtractOpenCode() (string, error) {
    bin, _ := opencodeFS.ReadFile("opencode-" + runtime.GOOS + "-" + runtime.GOARCH)
    dir, _ := os.MkdirTemp("", "orynacode-*")
    path := filepath.Join(dir, "opencode")
    os.WriteFile(path, bin, 0755)
    return path, nil
}
```

**优点**：用户无需下载，app 自带 opencode，版本锁定，离线可用。

**缺点**：`.app` 体积约 110MB（opencode ~54MB + Wails3 ~55MB）。

---

## 9. 分层与 TUI 通信

### 9.1 三层架构

```
┌──────────────────────────────────────────────────────┐
│  Wails3 Frontend (SolidJS)                           │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │     Sidebar      │  │    Terminal (xterm.js)   │ │
│  │  ────────────────│  │                          │ │
│  │  import Go bindings│ │  ── PTY stream ──        │ │
│  │  Go.Switch()     │  │  no Go bindings          │ │
│  │  Go.Login()      │  │                          │ │
│  └────────┬─────────┘  └───────────┬──────────────┘ │
│           │ Wails3 IPC             │ PTY I/O         │
├───────────┼────────────────────────┼──────────────────┤
│           ▼                        ▼                  │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │   Go Backend     │  │  Bun CLI (子进程)         │ │
│  │                  │  │                          │ │
│  │  Auth Manager    │  │  process.env 注入          │ │
│  │  WS Manager      │  │   ORYNA_API_KEY          │ │
│  │  Project Manager │  │   ORYNA_GATE_API_KEY     │ │
│  │  PTY Manager     │  │   ORYNA_GATE_TOKEN       │ │
│  └──────────────────┘  └──────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### 9.2 Sidebar — 有 Go bindings

```tsx
// Sidebar.tsx (Wails3 自动生成 Go bindings)
import { SwitchProject, Login } from "../../bindings/orynacode/app"

function Sidebar() {
  return (
    <div>
      {/* 代理选择 */}
      <button onClick={() => Login()}>Login with Oryna AI</button>

      {/* 项目切换 */}
      <div onClick={() => SwitchProject("/Users/lishan/qingyun")}>
        qingyun {active ? '●' : ''}
      </div>
    </div>
  )
}
```

### 9.3 Terminal — 无 Go bindings

```tsx
// Terminal.tsx (纯 xterm.js, 不 import Go bindings)
function Terminal() {
  // PTY 输出 → xterm.js
  useEffect(() => {
    window.go.main.PtyManager.OnData((data) => term.write(data))
  }, [])

  // 用户输入 → PTY
  term.onData((input) => window.go.main.PtyManager.Write(input))

  return <div ref={containerRef}/>
}
```

### 9.4 TUI (Bun CLI) — 通过 env vars 获取所有配置

```
Go spawn PTY 前注入 env vars:

  ORYNA_API_KEY       = eyJhbG...       ← Oryna AI OAuth JWT
  ORYNA_GATE_API_KEY  = sk-ticket-xxx   ← OrynaGate LLM 用
  ORYNA_GATE_TOKEN    = sk-ticket-xxx   ← OrynaGate WS 用
  ORYNA_GATE_URL      = http://...      ← OrynaGate 地址
  ORYNA_GATE_WORKSPACE = /path/to/proj  ← 工作区目录

TUI 启动后:

  provider.ts (LLM 请求)
    → const key = process.env.ORYNA_GATE_API_KEY
    → options["apiKey"] = process.env.ORYNA_API_KEY

  agent.ts (WS 连接)
    → const token = process.env.ORYNA_GATE_TOKEN

  选模型（Oryna AI / OrynaGate）
    → 直接从 env 读，不需要跨进程调用
```

### 9.5 TUI 不需要 Go bindings

| TUI 内操作 | 数据来源 | 是否需要 Go bindings |
|-----------|---------|---------------------|
| 选 Oryna AI 模型 | `process.env.ORYNA_API_KEY` | ❌ env 已注入 |
| 选 OrynaGate 模型 | `process.env.ORYNA_GATE_API_KEY` | ❌ env 已注入 |
| WS 连接 OrynaGate | `process.env.ORYNA_GATE_TOKEN` | ❌ env 已注入 |
| 协作自动回复 | processor hook | ❌ 纯 server 端 |
| 切换项目 | Go kill PTY → Go 重新 spawn | ❌ 由 Sidebar 触发 |

### 9.6 项目切换完整流程

```
用户点 Sidebar 选项目 "qingyun"
  ↓
1. Sidebar: Go.SwitchProject("/Users/lishan/qingyun")
  ↓
2. Go PTY Manager:
   a. kill 当前子进程
   b. 读 /Users/lishan/qingyun/.orynagate
   c. 组装 env vars（ORYNA_GATE_API_KEY, ORYNA_GATE_TOKEN 等）
   d. 合并 Auth token（ORYNA_API_KEY）
   e. spawn 新 PTY: orynacode --project /Users/lishan/qingyun
  ↓
3. Bun CLI 启动 → 读 env vars → 初始化 provider/auth/agent
  ↓
4. xterm.js 接收新 PTY 输出 → 渲染新 TUI
```

---

## 10. 已确认的技术决策

### 10.1 仓库策略

**两个独立仓库，不混在同一个 Git 仓库。**

| 仓库 | 用途 |
|------|------|
| `oryna.ai/code` | 当前项目，继续维护 TUI fork（2 个 patch） |
| `oryna.ai/orynacode-app` | 新项目，Wails3 + Go + opencode vanilla |

### 10.2 opencode 引入方式

**Go embed**：构建时 `//go:embed` 打入 Wails3 二进制，运行时提取到临时目录。

```
构建时：  curl → build/opencode-darwin-arm64 → wails3 build → Go embed → orynacode.app
运行时：  Go → 从 embed.FS 提取 → /tmp/orynacode-xxx/opencode → PTY spawn
```

### 10.3 Auth 层

| 组件 | 实现位置 |
|------|---------|
| OAuth 登录 | Go Auth Layer（macOS Keychain 存储 JWT） |
| JWT 刷新 | Go Auth Layer（自动刷新，401 时重新登录） |
| Token 注入 | Go PTY Manager spawn 时注入 `ORYNA_API_KEY` env |
| OrynaGate ticket | Go 读 `.orynagate` 注入 `ORYNA_GATE_API_KEY` / `ORYNA_GATE_TOKEN` env |

### 10.4 WS 管理

| 功能 | 实现 |
|------|------|
| OrynaGate WS 连接 | Go WS Manager（连接池、心跳） |
| 协作消息接收 | Go WS → Wails3 event → Sidebar → HTTP prompt API |
| 协作回复发送 | processor auto-reply → HTTP /reply → Go WS 发送 |
| 局域网扫描 | Go LAN Scanner |

### 10.5 项目与 Session 联动

| 操作 | 实现 |
|------|------|
| 选项目 → 刷新 Session | Go 调 `GET /session/list?directory={dir}` |
| 点击 Session → TUI 跳转 | Go 通过 PTY stdin 发送 `/session {id}` |
| 项目存储 | Go 维护 `~/.orynacode/projects.json` |

### 10.6 Patch 范围

OrynaCode fork 保留 **2 个 patch**，其余功能移至 Go 层：

| 保留 | 删除（移至 Go） |
|------|----------------|
| 协作 auto-reply（processor hook） | OAuth / JWT / 401 / WS / LAN scan / `.orynagate` / needs_auth |
| 品牌（logo / 命令名 / 更新检查） | |

### 10.7 已确认的技术选型

| 选型 | 决策 |
|------|------|
| opencode 引入 | Go embed（构建时打入，不运行时下载） |
| 多项目 | 全局 Bun Server + `x-opencode-directory` header 路由 |
| Auth Token | 全局（per-user，非 per-project） |
| sendReply 桥接 | **Go HTTP server（复用 OAuth callback server）** |

---

## 11. 待确认

### 11.1 sendReply() 桥接方式

**已确认。** 采用 Go HTTP server 方案。

OAuth 流程已需要一个本地 HTTP server 接 `/callback`。reply 端点挂到同一个 server：

```go
// Wails3 进程内，一个 mux 复用
mux := http.NewServeMux()
mux.HandleFunc("/callback", handleOAuthCallback)  // OAuth 已有
mux.HandleFunc("/reply", handleReply)             // 协作回复（新增）
mux.HandleFunc("/ready", handleReady)             // WS ready（可加）
ln, _ := net.Listen("tcp", "127.0.0.1:0")         // 随机端口
go http.Serve(ln, mux)
```

Bun TUI 通过 env `ORYNA_GATE_REPLY_URL` 获取端口，`sendReply()` 调 `fetch()`：

```ts
// processor.ts 替换原有的 writeFileSync
await fetch(process.env.ORYNA_GATE_REPLY_URL + "/reply", {
    method: "POST",
    body: JSON.stringify({ content, to })
})
```

| 对比 | 文件 IPC（旧） | Go HTTP server（新） |
|------|-------------|-------------------|
| Go 改动 | +20 行 file poll | +10 行 handler（复用 callback server） |
| Bun 改动 | 0 | `writeFileSync` → `fetch()`（+2 行） |
| 延迟 | ~300ms | ~0ms |
| 额外进程 | 0 | 0（Wails3 进程内 goroutine） |

### 11.2 多项目管理

| 方案 | 机制 | 优点 | 缺点 |
|------|------|------|------|
| **A: 全局 Server** | 一个 `orynacode serve` 为所有项目提供服务 | 简单，资源少 | 项目切换可能丢上下文 |
| **B: Per-project Server** | 每个项目独立的 serve 实例（不同端口） | 隔离性强 | 端口管理复杂 |

**建议**：先用 A。Bun 服务器已支持多目录路由（`x-opencode-directory` header），侧栏项目切换只改 directory 参数。

### 11.3 Auth Token 范围

| 方案 | 机制 |
|------|------|
| **A: 全局** | 一个 Token 用于所有项目 |
| **B: Per-project** | 每个项目独立 OAuth 登录 |

**建议**：先用 A。`.orynagate` 的 `ticket` 是 per-project 的，但 Oryna AI 的 JWT 是 per-user 的。

### 11.4 Sidebar 设计

待确认的具体需求：

1. Sidebar 放左边 vs 右边？
2. 要显示项目状态（busy/idle）吗？
3. Session 列表点击是切换还是 Fork？
4. 要不要支持重命名/删除 Session？

---

> 本方案基于 Wails3 (Go + WebView) 架构。技术选型以最小依赖和最少 patch 为原则。Go 层负责所有身份验证和服务管理，opencode 保持原版。欢迎根据实际需要调整。
