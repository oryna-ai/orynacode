# OrynaCode

OrynaCode 是基于 [OpenCode](https://github.com/anomalyco/opencode)（MIT 协议）构建的 AI 编程助手，专为 Oryna AI 平台定制。

## 特性

- **Oryna AI** — 中国顶尖大模型，一站接入全世界。
- **Oryna Local** — 自动发现并连接局域网内的 LLM 服务器
- **浏览器登录** — 一键跳转 `https://oryna.ai` 登录，JWT 自动续期
- **终端 TUI** — 全功能交互式终端界面，支持语法高亮和 diff 查看

## 安装

```bash
curl -fsSL https://oryna.ai/install | bash
```

## 快速开始

```bash
orynacode
```

按 `ctrl+p` → `/connect` 连接 Oryna AI 开始编程。

## 从源码构建

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## 协议

MIT — 基于 Anomaly Innovations Inc. 的 [OpenCode](https://github.com/anomalyco/opencode)
