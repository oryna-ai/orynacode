# OrynaCode

OrynaCode to agent kodujący AI zbudowany na bazie [OpenCode](https://github.com/anomalyco/opencode) (licencja MIT), dostosowany do platformy Oryna AI.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Logowanie jednym kliknięciem przez `https://oryna.ai` z automatycznym odświeżaniem JWT
- **Terminal TUI** — Pełny interaktywny interfejs terminala z podświetlaniem składni i podglądem diff

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Naciśnij `ctrl+p` → `/connect`, aby połączyć się z Oryna AI i rozpocząć kodowanie.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — oparty na [OpenCode](https://github.com/anomalyco/opencode) autorstwa Anomaly Innovations Inc.
