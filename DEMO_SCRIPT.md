# AI-NMS — Complete Judge Demo Script (Exact UI Steps)

---

## 30-Second Pitch (say this first)

"AI-NMS is a full-stack agentic cybersecurity platform. It monitors live network traffic, scans websites in a sandboxed browser before you load them, and uses Groq's Llama 3.3 70B AI to classify threats in real time. Every AI action — blocking IPs, rate limiting, scanning sites — is governed by Civic's MCP Hub with hard guardrails and a full audit trail. The Chrome extension intercepts your browsing and feeds real traffic into the dashboard. Everything runs in-memory, zero database, zero setup."

---

## Before You Start

1. Open terminal in the project folder
2. Run: `npm run dev`
3. Open Chrome → go to `http://localhost:3000`
4. Keep the terminal visible so judges can see it's a real server

---

## DEMO STEP 1 — The Dashboard (30 seconds)

**What to show:** The system is already alive and monitoring.

1. The page opens on the **DASHBOARD** tab (default)
2. Point to the **top status bar** — it shows:
   - `SYS:OK` (green dot) — system running
   - `NET:ACTIVE` or `NET:ALERT` — live network status
   - `AI:ONLINE` — Groq LLM connected
   - `TRAFFIC:XX` — live packet count going up
   - `BLOCKED:XX` — blocked IPs count
   - Top-right: `CIVIC:CONNECTED` or `CIVIC:LOCAL` — governance status
   - Top-right: live clock ticking in cyan

3. Point to the **5 metric cards** at the top of the content area:
   - `TOTAL_REQUESTS` — increases every 4 seconds (simulation running)
   - `ACTIVE_ALERTS` — red when threats detected
   - `BLOCKED_IPS` — yellow count
   - `SAFE_TRAFFIC` — green count
   - `SITES_SCANNED` — from extension

4. Point to **RESOURCE_MONITOR** panel (left side):
   - CPU, RAM, NETWORK, STORAGE bars — live percentages
   - Below the bars: SAFE / SUSPECT / ATTACK counters in green/yellow/red

5. Point to **SECURITY_SCORE** panel (right side):
   - Big number (0-100) glowing green/yellow/red
   - Shows `// SYSTEM SECURE` or `// THREATS DETECTED`

6. Say: *"This is all updating live via Server-Sent Events — no polling, instant push."*

---

## DEMO STEP 2 — Run the AI Scan (20 seconds)

**What to show:** Groq LLM analyzing traffic in real time.

1. Look at the **left sidebar** — under `// TOOLS` section
2. Click `$ RUN AI SCAN`
   - You'll hear a **rising sweep sound** (Web Audio API)
   - The button changes to `SCANNING...` and goes dim
3. Watch the **AI_ANALYSIS_STREAM** panel (bottom-right of dashboard):
   - Lines appear: `AI> initiating full network scan...`
   - Then: `AI> scan complete — XX packets analyzed`
   - Below that, live threat detections appear like:
     `AI> detected=DDoS ip=45.33.22.11 risk=87`
4. The **SECURITY_SCORE** number updates
5. Say: *"That's Groq's Llama 3.3 70B classifying every packet — DDoS, brute force, port scan, bot traffic."*

---

## DEMO STEP 3 — Live Traffic Logs (20 seconds)

**What to show:** Real traffic being logged and classified.

1. In the **left sidebar** under `// NAVIGATION`, click `> TRAFFIC LOGS`
2. A full table appears: `TRAFFIC_LOG_STREAM — XX RECORDS`
3. Point to the columns:
   - `TIMESTAMP` — exact time
   - `IP_ADDRESS` — source IP
   - `PORT` — destination port
   - `RISK` — score in red/yellow/green
   - `STATUS` — `[ATTACK]` / `[SUSPICIOUS]` / `[SAFE]` tags
   - `ATTACK_TYPE` — cyan button (DDoS, Brute Force, etc.)
   - `ACTION` — red `BLOCK` button on high-risk rows
4. Click any **cyan attack type button** (e.g. `DDoS`)
   - A **knowledge panel** pops up bottom-right: `AI_KNOWLEDGE_BASE`
   - Shows AI explanation of that attack type
   - Auto-closes after 12 seconds
5. Click a red **`BLOCK`** button on a high-risk row
   - Hear the **thud sound** (block sound effect)
   - That IP moves to the blocked list instantly

---

## DEMO STEP 4 — Threat Analysis (20 seconds)

**What to show:** Active threat alerts with one-click response.

1. In the sidebar, click `> THREAT ANALYSIS`
   - If there are alerts, you'll see a red badge number on this nav item
2. Each threat row shows:
   - `DANGER` / `WARNING` / `INFO` tag (red/yellow/blue)
   - IP address
   - Attack type
   - Risk score (colored)
   - Reason text
   - `INFO` button (cyan) — click for AI knowledge
   - `BLOCK` or `LIMIT` button (red) — click to execute response
3. Click `BLOCK` on a DANGER row
   - Hear the block sound
   - Watch `BLOCKED_IPS` counter in the top metrics go up
4. Point to **ATTACK_VECTOR_BREAKDOWN** panel below:
   - Bar chart showing DDoS vs Brute Force vs Port Scan counts

---

## DEMO STEP 5 — Response Engine (20 seconds)

**What to show:** Blocked IPs and full response log.

1. In the sidebar, click `> RESPONSE ENGINE`
   - Yellow badge shows how many IPs are blocked
2. **Left panel — BLOCKED_IPS:**
   - Each row: `BLOCKED` tag, IP address, reason
   - Green `UNBLOCK` button on the right
   - Click `UNBLOCK` on any IP — it disappears instantly
   - The AI log on dashboard shows: `AI> unblocked XX.XX.XX.XX`
3. **Right panel — RESPONSE_LOG:**
   - Every action logged: `BLOCK IP`, `RATE LIMIT`, `CAPTCHA CHALLENGE`
   - Shows IP, reason, severity, timestamp
4. Say: *"Every decision is logged, explainable, and reversible."*

---

## DEMO STEP 6 — Chrome Extension (30 seconds)

**What to show:** Real browser protection in action.

**Setup (do this before the demo if possible):**
1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer mode** (toggle, top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder in the project
5. The extension icon appears in the Chrome toolbar

**During demo:**
1. Open a new tab and go to any real website (e.g. `https://github.com`)
2. Look at the **bottom-left corner** of the page — a small floating widget appears:
   - Shows a number (security score) in green/yellow/red
   - Has a red badge if threats found
3. Click the widget — it expands into a full panel showing:
   - Score ring (0-100)
   - `SAFE` / `WARNING` / `HIGH RISK` / `CRITICAL` label
   - Domain name in cyan
   - List of verified findings with `LOW`/`MEDIUM`/`HIGH`/`CRITICAL` tags
   - `[ OPEN_DASHBOARD ]` button — opens `localhost:3000`
   - `[ CLOSE ]` button
4. Look at the extension icon in the toolbar — shows the score as a badge
5. Go back to `localhost:3000` → **DASHBOARD** tab → scroll to **CHROME_EXTENSION_FEED** panel
   - The scanned site appears there with score and timestamp

---

## DEMO STEP 7 — Website Security Tab (20 seconds)

**What to show:** Sandbox scanning and recent sites.

1. In the sidebar, click `> WEBSITE SECURITY`
2. **Top panel — RECENT_SITES_SCANNED:**
   - Grid of cards, each showing: domain (cyan), security score, risk tag, timestamp, verdict (`SAFE` / `WARNING` / `BLOCK`)
   - These come from the sandbox scanner (Playwright headless browser)
3. **Bottom panel — WEBSITE_SECURITY_ANALYSIS:**
   - Full extension feed with detailed threat breakdowns
   - Click any threat card — a **ThreatPopup** appears with full details
4. Say: *"Before you load a site, our Playwright sandbox opens it in an isolated browser, collects cookies, scripts, mixed content, and JS patterns — then scores it."*

---

## DEMO STEP 8 — Civic AI Governance (40 seconds)

**What to show:** The AI governing itself with real guardrails.

1. In the sidebar, click `> CIVIC AUDIT`
2. **Top panel — CIVIC_GOVERNANCE_STATUS:**
   - Status shows `● HUB CONNECTED` (green) or `● LOCAL MODE` (yellow)
   - 4 stat counters: `BLOCK_IP`, `RATE_LIMIT_IP`, `SCAN_WEBSITE`, `LOG_EVENT` — call counts
   - Two buttons top-right:
     - `PING` — tests Civic Hub connection
     - `RUN DEMO CALLS` — fires 3 live tool calls to Civic

3. Click **`RUN DEMO CALLS`**
   - Watch the terminal stream below fill with:
     ```
     CIVIC> triggering live tool calls...
     CIVIC> log_security_event: HUB EXECUTED
     CIVIC> audit_id: xxxxxxxxxxxxxxxx...
     CIVIC> retrieve_recent_threats: HUB EXECUTED
     CIVIC> scan_website: HUB EXECUTED
     CIVIC> audit log updated
     ```

4. **Middle-left panel — GUARDRAIL_STATUS:**
   - 4 rules all showing green `PASS` / `ENFORCED`:
     - Cannot block localhost / 127.0.0.1
     - Max 5 block_ip calls per minute
     - AI cannot revoke own permissions
     - All tool calls logged to audit trail

5. **Middle-right panel — AI_TOOL_ACCESS:**
   - Shows `ENABLED` in green
   - Click the red **`[ REVOKE ACCESS ]`** button
   - Status changes to `REVOKED` in red
   - Top status bar changes to `CIVIC:REVOKED` in red
   - Panel shows: `⚠ Tool access has been revoked. AI agent cannot execute any security tools until restored.`
   - Say: *"The AI is now locked out. It cannot block IPs, scan sites, or take any action."*
   - Click **`[ RESTORE ACCESS ]`** — everything goes green again

6. **AI_SECURITY_ASSISTANT terminal** (below guardrails):
   - Type `scan example.com` in the input box → press Enter or click `RUN`
   - Watch the stream:
     ```
     CIVIC> $ scan example.com
     CIVIC> tool call: scan_website { domain: "example.com" }
     CIVIC> guardrail check: PASSED
     CIVIC> audit_id: xxxxxxxx
     ```
   - Type `show blocked ips` → see the list
   - Type `analyze last threat` → see the latest threat details
   - Type `stats` → see tool call counts

7. **Bottom panel — CIVIC_AUDIT_LOG table:**
   - Every tool call logged: timestamp, tool name, params, result (`ALLOWED`/`BLOCKED`), Civic ID, reason
   - Say: *"Every single AI action has a Civic audit ID — fully traceable."*

---

## DEMO STEP 9 — Auto-Response Toggle (10 seconds)

1. In the sidebar under `// TOOLS`, find:
   `$ AUTO-RESPONSE: ON` (green)
2. Click it — toggles to `AUTO-RESPONSE: OFF` (red)
3. Say: *"When ON, the AI automatically blocks high-risk IPs. When OFF, it only alerts."*
4. Toggle it back ON

---

## DEMO STEP 10 — Export Data (10 seconds)

1. In the sidebar under `// TOOLS`:
   - Click `$ EXPORT JSON` — downloads all traffic/threat data as JSON
   - Click `$ EXPORT CSV` — downloads as CSV for spreadsheet analysis
2. Open the downloaded file to show it's real data

---

## Key Points to Emphasize

| Feature | What to say |
|---|---|
| SSE live updates | "No polling — pure Server-Sent Events, instant push" |
| Groq LLM | "Llama 3.3 70B classifying every packet in real time" |
| Civic guardrails | "The AI literally cannot block localhost — hard-coded guardrail" |
| Sandbox scanner | "Playwright opens the site in isolation before you load it" |
| Sound effects | "Alert beep, scan sweep, block thud — Web Audio API, no files" |
| Zero database | "Entire system in-memory — zero setup, instant demo" |
| Extension | "Real browser traffic, not simulated — chrome.webRequest API" |

---

## If Something Goes Wrong

- **No traffic showing** → sidebar: click `$ REFRESH DATA`
- **AI scan fails** → check terminal for errors, Groq key is in `.env.local`
- **Civic shows LOCAL** → that's fine, it falls back gracefully, all features still work
- **Extension not showing widget** → make sure you're on an external site (not localhost)
- **Charts empty** → wait 10-15 seconds for simulation to populate data
