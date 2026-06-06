# OrynaCode

OrynaCode, [OpenCode](https://github.com/anomalyco/opencode) (MIT Lisansı) üzerine inşa edilmiş, Oryna AI platformu için özelleştirilmiş bir yapay zeka kodlama aracısıdır.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — `https://oryna.ai` üzerinden tek tıkla giriş, JWT otomatik yenileme
- **Terminal TUI** — Sözdizimi vurgulama ve diff görüntüleyici ile tam etkileşimli terminal arayüzü

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Oryna AI'ya bağlanmak ve kodlamaya başlamak için `ctrl+p` → `/connect` tuşlarına basın.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — Anomaly Innovations Inc. tarafından geliştirilen [OpenCode](https://github.com/anomalyco/opencode) tabanlıdır
