# OrynaCode

OrynaCode es un agente de programación con IA construido sobre [OpenCode](https://github.com/anomalyco/opencode) (licencia MIT), personalizado para la plataforma Oryna AI.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Inicio de sesión con un clic a través de `https://oryna.ai` con renovación automática de JWT
- **Terminal TUI** — Interfaz de terminal interactiva completa con resaltado de sintaxis y visor de diferencias

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Presiona `ctrl+p` → `/connect` para conectar Oryna AI y comenzar a programar.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — basado en [OpenCode](https://github.com/anomalyco/opencode) por Anomaly Innovations Inc.
