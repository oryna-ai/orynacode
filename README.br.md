# OrynaCode

OrynaCode é um agente de programação com IA construído sobre o [OpenCode](https://github.com/anomalyco/opencode) (licença MIT), personalizado para a plataforma Oryna AI.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Login com um clique via `https://oryna.ai` com renovação automática do JWT
- **Terminal TUI** — Interface de terminal interativa completa com destaque de sintaxe e visualizador de diff

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Pressione `ctrl+p` → `/connect` para conectar o Oryna AI e começar a programar.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — baseado no [OpenCode](https://github.com/anomalyco/opencode) por Anomaly Innovations Inc.
