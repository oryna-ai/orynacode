# OrynaCode

OrynaCode เป็นเอเจนต์การเขียนโค้ดด้วย AI ที่สร้างบน [OpenCode](https://github.com/anomalyco/opencode) (สัญญาอนุญาต MIT) ปรับแต่งสำหรับแพลตฟอร์ม Oryna AI

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — เข้าสู่ระบบด้วยคลิกเดียวผ่าน `https://oryna.ai` พร้อมรีเฟรช JWT อัตโนมัติ
- **Terminal TUI** — อินเทอร์เฟซเทอร์มินัลแบบโต้ตอบเต็มรูปแบบพร้อมการเน้นไวยากรณ์และโปรแกรมดู diff

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

กด `ctrl+p` → `/connect` เพื่อเชื่อมต่อ Oryna AI และเริ่มเขียนโค้ด

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — สร้างจาก [OpenCode](https://github.com/anomalyco/opencode) โดย Anomaly Innovations Inc.
