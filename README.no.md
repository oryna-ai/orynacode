# OrynaCode

OrynaCode er en AI-kodeagent bygget på [OpenCode](https://github.com/anomalyco/opencode) (MIT-lisens), tilpasset Oryna AI-plattformen.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Ett-klikks-innlogging via `https://oryna.ai` med automatisk JWT-oppdatering
- **Terminal TUI** — Fullt interaktivt terminalgrensesnitt med syntaksutheving og diff-visning

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Trykk `ctrl+p` → `/connect` for å koble til Oryna AI og begynne å kode.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — basert på [OpenCode](https://github.com/anomalyco/opencode) av Anomaly Innovations Inc.
