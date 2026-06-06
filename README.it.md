# OrynaCode

OrynaCode è un agente di coding AI costruito su [OpenCode](https://github.com/anomalyco/opencode) (licenza MIT), personalizzato per la piattaforma Oryna AI.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Accesso con un clic tramite `https://oryna.ai` con rinnovo automatico del JWT
- **Terminal TUI** — Interfaccia terminale interattiva completa con evidenziazione della sintassi e visualizzatore diff

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Premi `ctrl+p` → `/connect` per connetterti a Oryna AI e iniziare a programmare.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — basato su [OpenCode](https://github.com/anomalyco/opencode) di Anomaly Innovations Inc.
