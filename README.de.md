# OrynaCode

OrynaCode ist ein KI-Coding-Agent, der auf [OpenCode](https://github.com/anomalyco/opencode) (MIT-Lizenz) basiert und für die Oryna AI-Plattform angepasst wurde.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Ein-Klick-Login über `https://oryna.ai` mit automatischer JWT-Aktualisierung
- **Terminal TUI** — Vollständig interaktive Terminal-Oberfläche mit Syntaxhervorhebung und Diff-Viewer

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Drücke `ctrl+p` → `/connect`, um Oryna AI zu verbinden und mit dem Coden zu beginnen.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — basierend auf [OpenCode](https://github.com/anomalyco/opencode) von Anomaly Innovations Inc.
