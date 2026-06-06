# OrynaCode

OrynaCodeは、[OpenCode](https://github.com/anomalyco/opencode)（MITライセンス）をベースに構築されたAIコーディングエージェントで、Oryna AIプラットフォーム向けにカスタマイズされています。

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — `https://oryna.ai` 経由のワンクリックログイン、JWT自動更新対応
- **Terminal TUI** — シンタックスハイライトと差分ビューアを備えたフルインタラクティブ端末インターフェース

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

`ctrl+p` → `/connect` で Oryna AI に接続してコーディングを開始します。

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — [OpenCode](https://github.com/anomalyco/opencode) by Anomaly Innovations Inc. に基づく
