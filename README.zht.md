# OrynaCode

OrynaCode 是一個基於 [OpenCode](https://github.com/anomalyco/opencode)（MIT 授權）建構的 AI 編碼代理，專為 Oryna AI 平台客製化。

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — 透過 `https://oryna.ai` 一鍵登入，支援 JWT 自動刷新
- **Terminal TUI** — 完整的互動式終端介面，具備語法高亮和差異檢視器

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

按 `ctrl+p` → `/connect` 連接 Oryna AI 並開始編碼。

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — 基於 [OpenCode](https://github.com/anomalyco/opencode) by Anomaly Innovations Inc.
