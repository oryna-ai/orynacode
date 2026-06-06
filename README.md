# OrynaCode

OrynaCode is an AI coding agent built on top of [OpenCode](https://github.com/anomalyco/opencode) (MIT License), customized for the Oryna AI platform.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — One-click login via `https://oryna.ai` with JWT auto-refresh
- **Terminal TUI** — Full interactive terminal interface with syntax highlighting and diff viewer

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Press `ctrl+p` → `/connect` to connect Oryna AI and start coding.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — based on [OpenCode](https://github.com/anomalyco/opencode) by Anomaly Innovations Inc.
