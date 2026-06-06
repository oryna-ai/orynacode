# OrynaCode

OrynaCode là một trợ lý lập trình AI được xây dựng trên [OpenCode](https://github.com/anomalyco/opencode) (giấy phép MIT), tùy chỉnh cho nền tảng Oryna AI.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — Đăng nhập một lần qua `https://oryna.ai` với tự động làm mới JWT
- **Terminal TUI** — Giao diện terminal tương tác đầy đủ với tô sáng cú pháp và trình xem diff

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

Nhấn `ctrl+p` → `/connect` để kết nối Oryna AI và bắt đầu lập trình.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — dựa trên [OpenCode](https://github.com/anomalyco/opencode) bởi Anomaly Innovations Inc.
