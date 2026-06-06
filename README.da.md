# OrynaCode

OrynaCode er en AI-kodeagent bygget oven på [OpenCode](https://github.com/anomalyco/opencode) (MIT-licens), tilpasset Oryna AI-platformen.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Et-klik-login via `https://oryna.ai` med automatisk JWT-opdatering
- **Terminal TUI** — Fuld interaktiv terminalgrænseflade med syntaksfremhævning og diff-visning

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Tryk `ctrl+p` → `/connect` for at oprette forbindelse til Oryna AI og begynde at kode.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — baseret på [OpenCode](https://github.com/anomalyco/opencode) af Anomaly Innovations Inc.
