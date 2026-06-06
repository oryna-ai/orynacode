# OrynaCode

OrynaCode est un agent de codage IA construit sur [OpenCode](https://github.com/anomalyco/opencode) (licence MIT), personnalisé pour la plateforme Oryna AI.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Connexion en un clic via `https://oryna.ai` avec rafraîchissement automatique du JWT
- **Terminal TUI** — Interface terminal interactive complète avec coloration syntaxique et visualiseur de diff

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Appuyez sur `ctrl+p` → `/connect` pour vous connecter à Oryna AI et commencer à coder.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — basé sur [OpenCode](https://github.com/anomalyco/opencode) par Anomaly Innovations Inc.
