# OrynaCode

Το OrynaCode είναι ένας πράκτορας κωδικοποίησης AI που βασίζεται στο [OpenCode](https://github.com/anomalyco/opencode) (άδεια MIT), προσαρμοσμένο για την πλατφόρμα Oryna AI.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Σύνδεση με ένα κλικ μέσω `https://oryna.ai` με αυτόματη ανανέωση JWT
- **Terminal TUI** — Πλήρης διαδραστική διεπαφή τερματικού με επισήμανση σύνταξης και προβολή διαφορών (diff)

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Πατήστε `ctrl+p` → `/connect` για να συνδεθείτε στο Oryna AI και να ξεκινήσετε την κωδικοποίηση.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — βασισμένο στο [OpenCode](https://github.com/anomalyco/opencode) από την Anomaly Innovations Inc.
