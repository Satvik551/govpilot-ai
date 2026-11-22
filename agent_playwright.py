"""Reference Playwright automation for the GovPilot AI web MVP."""

from pathlib import Path
import json
import time

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError


MVP_URL = "http://127.0.0.1:5500"
PROFILE_FILE = Path(__file__).with_name("profile.json")
SCREENSHOT_FILE = Path(__file__).with_name("receipt.png")

# Profile keys intentionally match the MVP form field names.
PROFILE = {
    "fullName": "Arjun Mehta",
    "dob": "2006-03-13",
    "studentId": "STU-2026-1048",
    "annualIncome": "185000",
    "serviceType": "Student Transit Pass Renewal",
    "address": "42, Lake View Road, Pune, Maharashtra - 411001",
    "otp": "849206",
}


def convert_dob(value: str) -> str:
    """Convert ISO DOB values to the portal's DD/MM/YYYY format."""
    if len(value) == 10 and value[4] == "-" and value[7] == "-":
        year, month, day = value.split("-")
        return f"{day}/{month}/{year}"
    return value


def fill_by_profile(page, profile: dict) -> None:
    """Resolve profile keys to the form labels, then fill each visible control."""
    label_map = {
        "fullName": "Full Name",
        "dob": "Date of Birth",
        "studentId": "Student / Citizen ID",
        "annualIncome": "Annual Income",
        "serviceType": "Service Type",
        "address": "Residential Address",
        "otp": "One-Time Password",
    }

    for key, label in label_map.items():
        value = str(profile.get(key, "")).strip()
        if not value:
            continue

        # Prefer the real label relationship; fall back to the stable form name
        # for resilience if labels are changed by a later portal revision.
        try:
            control = page.get_by_label(label, exact=False)
        except PlaywrightTimeoutError:
            control = page.locator(f'[name="{key}"]')

        control.wait_for(state="visible")
        control.scroll_into_view_if_needed()

        if control.evaluate("(el) => el.tagName") == "SELECT":
            control.select_option(label=value)
        elif key == "dob":
            control.fill(value)
            time.sleep(0.4)
            control.fill(convert_dob(value))
        else:
            control.fill(value)
        time.sleep(0.25)


def handle_validation(page) -> None:
    """Log and recover common validation messages without bypassing portal checks."""
    validators = [
        "[role='alert']", ".error", ".validation-error",
        "text=Format mismatch", "text=Invalid date",
    ]
    for selector in validators:
        alerts = page.locator(selector)
        if alerts.count():
            print(f"[Validator] Detected: {alerts.first.inner_text()}")
            dob = page.locator("#dob")
            if dob.count() and dob.input_value():
                dob.fill(convert_dob(dob.input_value()))
                print("[Validator] Auto-converted DOB to DD/MM/YYYY")


def main() -> None:
    profile = PROFILE
    if PROFILE_FILE.exists():
        profile = json.loads(PROFILE_FILE.read_text(encoding="utf-8"))

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=False)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.goto(MVP_URL, wait_until="networkidle")
        print(f"Opened {MVP_URL}")

        page.get_by_role("button", name="Launch Autonomous Agent").click()
        # Wait until the MVP agent reaches its explicit OTP human checkpoint.
        page.locator("#statusBadge").get_by_text("Paused for OTP").wait_for(
            state="visible", timeout=20_000
        )
        fill_by_profile(page, profile)
        handle_validation(page)

        # Safety checkpoint: never submit without an explicit human OTP action.
        otp = page.locator("#otp")
        otp.wait_for(state="visible")
        otp.fill(str(profile.get("otp", "")))
        print("Paused for OTP: enter or verify the OTP in the browser.")
        print("Approve submission from the Human approval required panel.")
        page.get_by_role("button", name="Verify OTP & Approve Submit").wait_for(
            state="visible"
        )
        page.get_by_role("button", name="Verify OTP & Approve Submit").click()
        page.locator("#receiptCard").wait_for(state="visible")

        page.screenshot(path=str(SCREENSHOT_FILE), full_page=True)
        print(f"Confirmation screenshot saved to {SCREENSHOT_FILE}")
        browser.close()


if __name__ == "__main__":
    main()
