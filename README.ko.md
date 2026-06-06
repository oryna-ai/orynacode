# OrynaCode

OrynaCode는 [OpenCode](https://github.com/anomalyco/opencode)(MIT 라이선스)를 기반으로 구축된 AI 코딩 에이전트로, Oryna AI 플랫폼에 맞게 커스터마이즈되었습니다.

## Features

- **Oryna AI** — China's Best LLMs, Now Global.
- **Oryna Local** — Auto-discover and connect to run models on your own infrastructure
- **Browser Login** — `https://oryna.ai` 를 통한 원클릭 로그인, JWT 자동 갱신 지원
- **Terminal TUI** — 구문 강조 및 diff 뷰어를 갖춘 완전한 대화형 터미널 인터페이스

## Installation

```bash
curl -fsSL https://oryna.ai/install | bash
```

## Quick Start

```bash
orynacode
```

`ctrl+p` → `/connect` 를 눌러 Oryna AI에 연결하고 코딩을 시작하세요.

## Building from Source

```bash
git clone https://github.com/oryna-ai/orynacode.git
cd orynacode
bun install
cd packages/opencode && bun dev
```

## License

MIT — [OpenCode](https://github.com/anomalyco/opencode) by Anomaly Innovations Inc. 기반
