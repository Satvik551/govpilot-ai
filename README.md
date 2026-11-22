# GovPilot AI

GovPilot AI is a hackathon MVP for an autonomous public-service execution agent. It demonstrates a safe, auditable workflow where an agent maps a citizen profile to a government-style web form, identifies portal validation issues, and pauses for human approval before submission.

## Problem

Repeating applications across welfare and public-service portals is slow and error-prone. Citizens may struggle with unfamiliar forms, strict date formats, document rules, and OTP checkpoints. GovPilot AI provides a guided, inspectable automation layer rather than silently completing a submission.

## Architecture

- `index.html` — two-panel dashboard: mock public portal and agent console.
- `styles.css` — responsive light/dark UI, active-field focus, validation recovery, and receipt states.
- `app.js` — profile selection, sequential DOM filling, DOB conversion, OTP checkpoint, tracking receipt, JSON download, and print support.
- `agent_playwright.py` — Playwright reference implementation for Chromium automation.

The web demo is deliberately synthetic and does not connect to a real government system.

## Run the web MVP

1. Open the workspace in VS Code.
2. Start a static server:

   ```powershell
   python -m http.server 5500
   ```

3. Visit `http://127.0.0.1:5500`.
4. Select a profile, click **Launch Autonomous Agent**, then use the **Send OTP** button or enter demo OTP `849206`.
5. Click **Verify OTP & Approve Submit** to complete the submission.

## Run the Playwright reference

Create and activate a Python environment, install dependencies, and install Chromium:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install playwright
python -m playwright install chromium
```

Start the web MVP on port 5500, then run:

```powershell
python agent_playwright.py
```

The script dynamically maps profile keys to form controls, catches validation text, normalizes the DOB, and pauses for the browser approval checkpoint. After approval it waits for the confirmation receipt and saves `receipt.png` beside the script.

Optionally create `profile.json` beside `agent_playwright.py` to override the demo profile. Keys should use `fullName`, `dob`, `studentId`, `annualIncome`, `serviceType`, `address`, and `otp`.
