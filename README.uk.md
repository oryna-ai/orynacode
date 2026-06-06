# OrynaCode

OrynaCode — це AI-агент для програмування, створений на базі [OpenCode](https://github.com/anomalyco/opencode) (ліцензія MIT) і адаптований для платформи Oryna AI.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Вхід одним кліком через `https://oryna.ai` з автоматичним оновленням JWT
- **Terminal TUI** — Повноцінний інтерактивний термінальний інтерфейс із підсвічуванням синтаксису та переглядачем diff

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Натисніть `ctrl+p` → `/connect`, щоб підключитися до Oryna AI і почати програмувати.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — на основі [OpenCode](https://github.com/anomalyco/opencode) від Anomaly Innovations Inc.
