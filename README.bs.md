# OrynaCode

OrynaCode je AI agent za programiranje izgrađen na [OpenCode](https://github.com/anomalyco/opencode) (MIT licenca), prilagođen za Oryna AI platformu.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Prijava jednim klikom putem `https://oryna.ai` sa automatskim osvježavanjem JWT-a
- **Terminal TUI** — Potpuno interaktivno terminalno sučelje sa isticanjem sintakse i preglednikom diff-ova

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Pritisni `ctrl+p` → `/connect` da se povežeš na Oryna AI i počneš programirati.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — zasnovano na [OpenCode](https://github.com/anomalyco/opencode) od Anomaly Innovations Inc.
