# OrynaCode

OrynaCode হল একটি এআই কোডিং এজেন্ট যা [OpenCode](https://github.com/anomalyco/opencode) (MIT লাইসেন্স) এর উপর নির্মিত, Oryna AI প্ল্যাটফর্মের জন্য কাস্টমাইজড।

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — `https://oryna.ai` এর মাধ্যমে এক-ক্লিকে লগইন, JWT স্বয়ংক্রিয় রিফ্রেশ সহ
- **Terminal TUI** — সিনট্যাক্স হাইলাইটিং এবং ডিফ ভিউয়ার সহ সম্পূর্ণ ইন্টারেক্টিভ টার্মিনাল ইন্টারফেস

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Oryna AI-তে সংযোগ করতে এবং কোডিং শুরু করতে `ctrl+p` → `/connect` চাপুন।

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — Anomaly Innovations Inc. দ্বারা নির্মিত [OpenCode](https://github.com/anomalyco/opencode) এর উপর ভিত্তি করে
