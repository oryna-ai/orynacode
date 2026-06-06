# OrynaCode

OrynaCode — это AI-агент для программирования, созданный на базе [OpenCode](https://github.com/anomalyco/opencode) (лицензия MIT) и адаптированный для платформы Oryna AI.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Вход в один клик через `https://oryna.ai` с автоматическим обновлением JWT
- **Terminal TUI** — Полноценный интерактивный терминальный интерфейс с подсветкой синтаксиса и просмотрщиком diff

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Нажмите `ctrl+p` → `/connect`, чтобы подключиться к Oryna AI и начать программировать.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — на основе [OpenCode](https://github.com/anomalyco/opencode) от Anomaly Innovations Inc.
