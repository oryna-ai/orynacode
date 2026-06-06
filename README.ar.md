# OrynaCode

OrynaCode هو وكيل برمجة بالذكاء الاصطناعي مبني على [OpenCode](https://github.com/anomalyco/opencode) (رخصة MIT)، ومخصص لمنصة Oryna AI.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — تسجيل دخول بنقرة واحدة عبر `https://oryna.ai` مع تحديث JWT تلقائي
- **Terminal TUI** — واجهة طرفية تفاعلية كاملة مع تمييز الصيغة وعارض الفروقات (diff)

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

اضغط على `ctrl+p` ← `/connect` للاتصال بـ Oryna AI وبدء البرمجة.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — مبني على [OpenCode](https://github.com/anomalyco/opencode) من Anomaly Innovations Inc.
