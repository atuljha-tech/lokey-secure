<div align="center">

```
 █████╗ ██╗      ███╗   ██╗███╗   ███╗███████╗
██╔══██╗██║      ████╗  ██║████╗ ████║██╔════╝
███████║██║█████╗██╔██╗ ██║██╔████╔██║███████╗
██╔══██║██║╚════╝██║╚██╗██║██║╚██╔╝██║╚════██║
██║  ██║██║      ██║ ╚████║██║ ╚═╝ ██║███████║
╚═╝  ╚═╝╚═╝      ╚═╝  ╚═══╝╚═╝     ╚═╝╚══════╝
```

**Agentic AI Network Monitoring System**

*Real-time threat detection · Sandbox browser isolation · Civic AI governance · LoKey CLI*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Playwright](https://img.shields.io/badge/Playwright-1.59-45ba4b?style=flat-square&logo=playwright)](https://playwright.dev)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-f55036?style=flat-square)](https://groq.com)
[![Chrome MV3](https://img.shields.io/badge/Chrome-MV3_Extension-4285F4?style=flat-square&logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## What is AI-NMS?

AI-NMS is a full-stack cybersecurity platform that monitors live network traffic, scans websites in an isolated Playwright sandbox before you load them, and uses **Groq's Llama 3.3 70B** to classify threats in real time. Every AI action is governed by **Civic's MCP Hub** with hard guardrails and a full audit trail.

It ships with a **Chrome extension** that intercepts every navigation, a **terminal CLI called LoKey**, and a **live SOC dashboard** — all talking to the same in-memory backend with zero database setup.

---

## Features

| | Feature | Description |
|---|---|---|
| 🛡️ | **Live Traffic Monitoring** | Real-time packet logging with AI risk scoring (0–100) |
| 🤖 | **Groq AI Detection** | Llama 3.3 70B classifies DDoS, brute force, port scan, bot traffic |
| 🔬 | **Sandbox Scanner** | Playwright headless browser scans sites in isolation before you load them |
| 🚦 | **Navigation Interceptor** | Chrome extension redirects every navigation through the warning page |
| 🖥️ | **Interactive Sandbox Browser** | Browse suspicious sites inside an isolated Chromium stream |
| ⚖️ | **Civic AI Governance** | Every AI tool call routed through Civic MCP Hub with hard guardrails |
| ⚡ | **SSE Live Dashboard** | Server-Sent Events replace polling — instant push updates |
| 🔒 | **Auto-Response Engine** | IP blocking, rate limiting, CAPTCHA — all reversible |
| 💻 | **LoKey CLI** | Terminal interface — scan, block, monitor without touching the browser |
| 🔊 | **Sound Effects** | Web Audio API alert/scan/block tones |
| 📤 | **Data Export** | JSON and CSV download of all traffic and threat data |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CHROME EXTENSION                      │
│  Navigation Interceptor → Warning Page → Proceed / Block    │
│  Floating Widget · Threat Panel · Real Traffic Logging       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────▼──────────────────────────────────┐
│                    NEXT.JS SERVER  :3000                     │
│                                                              │
│  /                  SOC Dashboard (6 tabs)                   │
│  /sandbox           Sandbox Scanner + Interactive Browser    │
│  /warning           Navigation Interceptor Warning Page      │
│                                                              │
│  /api/sandbox-scan  Playwright headless scan                 │
│  /api/live-updates  SSE stream                               │
│  /api/traffic       Traffic logging + AI detection           │
│  /api/respond       IP blocking via Civic Hub                │
│  /api/groq-analyze  Llama 3.3 70B analysis                   │
│  /api/civic-audit   Civic MCP tool calls + audit log         │
└──────────┬───────────────────────────────────┬──────────────┘
           │                                   │
┌──────────▼──────────┐             ┌──────────▼──────────────┐
│  SANDBOX SERVER :4000│             │     CIVIC MCP HUB       │
│  WebSocket + Express │             │  Guardrails · Audit     │
│  Playwright Chromium │             │  block_ip · scan_website│
│  Screenshot stream   │             │  log_security_event     │
└─────────────────────┘             └─────────────────────────┘
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 · React 19 · TypeScript 5 |
| Charts | Recharts 3 with animated area/bar/pie |
| AI Inference | Groq SDK · Llama 3.3 70B Versatile |
| Sandbox | Playwright 1.59 · Chromium headless |
| Governance | Civic MCP Hub · JWT token |
| Real-time | Server-Sent Events (native) |
| Extension | Chrome MV3 · webNavigation · webRequest |
| CLI | Commander · Chalk · Boxen · cli-table3 |
| Data Store | In-memory SessionStore (zero DB) |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/atuljha-tech/lokey-secure.git
cd lokey-secure
npm install
npx playwright install chromium
```

### 2. Environment variables

All keys are pre-configured. Create `.env.local` if needed:

```env
GROQ_API_KEY=your_groq_key
CIVIC_API_KEY=your_civic_jwt
CIVIC_MCP_URL=https://app.civic.com/hub/mcp?accountId=...
```

### 3. Start the dashboard

```bash
npm run dev
# → http://localhost:3000
```

### 4. Start the interactive sandbox server *(optional)*

```bash
npm run sandbox
# → ws://localhost:4000
```

### 5. Load the Chrome extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder

---

## LoKey CLI

Terminal access to the entire platform. Server must be running.

```bash
# Scan a website in the Playwright sandbox
npm run lokey -- scan github.com
npm run lokey -- scan http://login-verify-account.com

# Full sandbox execution log
npm run lokey -- sandbox example.com

# Show active threat alerts
npm run lokey -- alerts

# Live traffic stream
npm run lokey -- traffic

# Block an IP address
npm run lokey -- block-ip 45.33.22.11

# Recent sandbox-scanned sites
npm run lokey -- sites

# Full system security stats
npm run lokey -- stats
```

**Example output:**

```
 _          _  __
| |        | |/ /
| |     ___| ' / ___ _   _
| |    / _ \  < / _ \ | | |
| |___| (_) | . \  __/ |_| |
|______\___/|_|\_\___|\__, |
                       __/ |
                      |___/

╔══════════════════════════════════╗
║  AI-NMS Security CLI             ║
║  Terminal interface for AI-NMS   ║
╚══════════════════════════════════╝

╭─────────────────────────────────────────────╮
│  SANDBOX SCAN                               │
│  Target → https://login-verify-account.com  │
╰─────────────────────────────────────────────╯

  ┌──────────────┬──────────────────────────┐
  │ Domain       │ login-verify-account.com │
  │ Risk Score   │ 99 / 100                 │
  │ Security     │ 1 / 100                  │
  │ Verdict      │ BLOCK                    │
  └──────────────┴──────────────────────────┘

  ▌ ⛔ BLOCK ▐  RISK: 99/100

  ┌ CRITICAL ┐  No HTTPS — all data sent in plain text
  ┌ CRITICAL ┐  Phishing URL pattern: "login-verify"
```

---

## Dashboard Tabs

| Tab | What it shows |
|---|---|
| **DASHBOARD** | Resource monitor · Security score · Live traffic stream · AI analysis log · Charts |
| **TRAFFIC LOGS** | Full packet table with risk scores, attack types, BLOCK buttons |
| **THREAT ANALYSIS** | Active alerts with INFO/BLOCK actions · Attack vector breakdown |
| **RESPONSE ENGINE** | Blocked IPs with UNBLOCK · Full response log |
| **WEBSITE SECURITY** | Recent sandbox scans · Chrome extension feed |
| **CIVIC AUDIT** | Tool call stats · Guardrail status · Revoke/Restore AI access · Audit log table |

---

## Sandbox Flow

```
User navigates to URL
        ↓
Extension onCommitted fires
        ↓
Tab redirected → /warning?url=<target>
        ↓
Warning page calls /api/sandbox-scan
        ↓
Playwright opens site in isolation
(no cookies · no history · no exposure)
        ↓
Collects: headers · cookies · scripts · DOM patterns
        ↓
Scores with realScore() + Groq AI enrichment
        ↓
User sees: risk score · threats · PROCEED / GO BACK
        ↓
PROCEED → /api/proceed → 302 → real site loads
        ↓
Result stored in sessionStore.recentSites
        ↓
SSE broadcasts to dashboard
```

---

## Civic AI Governance

Every AI action is routed through Civic's MCP Hub before execution.

**Hard guardrails enforced:**

```
✓  Cannot block localhost / 127.0.0.1
✓  Max 5 block_ip calls per minute
✓  AI cannot revoke its own permissions
✓  All tool calls logged with Civic audit ID
```

**Tools:** `block_ip` · `rate_limit_ip` · `scan_website` · `log_security_event` · `retrieve_recent_threats`

If Civic Hub is unreachable, the system falls back to local execution gracefully — all features continue working.

---

## Security Scoring

The same scoring logic runs in both the extension and the sandbox scanner:

| Check | Risk Added |
|---|---|
| No HTTPS | +40 |
| Password field on HTTP | +40 |
| Session cookie missing Secure flag | +25 |
| Missing Content-Security-Policy | +10 |
| Missing X-Frame-Options | +8 |
| innerHTML assignment in inline JS | +8 |
| Mixed content (HTTP on HTTPS page) | +15 |
| Phishing URL pattern | +45 |
| Known malicious domain | +60 |
| Groq AI enrichment | up to +15 |

**Verdict thresholds:** `safe` < 35 · `warning` 35–59 · `block` ≥ 60

---

## Project Structure

```
├── app/
│   ├── page.tsx              # SOC Dashboard
│   ├── sandbox/page.tsx      # Sandbox scanner + interactive browser
│   ├── warning/page.tsx      # Navigation interceptor warning page
│   └── api/                  # 15 API routes
├── components/
│   ├── SOCDashboard.tsx      # Animated Recharts dashboard
│   ├── SecurityWarningPopup.tsx
│   └── WebsiteSecurityPanel.tsx
├── lib/
│   ├── sandboxScanner.ts     # Playwright scanner engine
│   ├── sessionStore.ts       # In-memory data store
│   ├── ai-detection.ts       # Risk scoring engine
│   ├── civicClient.ts        # Civic MCP Hub client
│   └── sounds.ts             # Web Audio API effects
├── sandbox-server/
│   └── server.ts             # WebSocket screenshot streaming
├── extension/
│   ├── background.js         # Navigation interceptor + traffic logging
│   ├── content.js            # Floating widget + threat panel
│   └── popup.html/js         # Extension popup
└── cli/
    ├── lokey.ts              # CLI entry point
    └── commands/             # scan · sandbox · alerts · traffic · block-ip · sites · stats
```

---

## Known Limitations

- **In-memory only** — all data resets on server restart
- **Sandbox scan speed** — Playwright takes 2–5s per scan
- **Navigation interceptor** — redirect happens after navigation commits (MV3 limitation — true pre-load blocking is not possible)
- **Score parity** — extension and sandbox scores are close but not identical (extension reads live browser cookies, sandbox reads fresh context)

---

<div align="center">

Built for hackathons · Powered by Groq · Governed by Civic

**[Dashboard](http://localhost:3000)** · **[Sandbox](http://localhost:3000/sandbox)** · **[Docs](DOCUMENTATION.md)** · **[Demo Script](DEMO_SCRIPT.md)**

</div>
