"use strict";

const profiles = {
  student: {
    fullName: "Arjun Mehta",
    dob: "2006-03-13",
    studentId: "STU-2026-1048",
    annualIncome: "185000",
    serviceType: "Student Transit Pass Renewal",
    address: "42, Lake View Road, Pune, Maharashtra - 411001"
  },
  senior: {
    fullName: "Kamala Devi Sharma",
    dob: "1958-09-24",
    studentId: "CIT-1958-7721",
    annualIncome: "240000",
    serviceType: "Income Certificate Renewal",
    address: "18, Shanti Nagar, Jaipur, Rajasthan - 302015"
  }
};

const fieldIds = ["fullName", "dob", "studentId", "annualIncome", "serviceType", "address", "otp"];
const form = document.getElementById("publicServiceForm");
const launchButton = document.getElementById("launchAgent");
const approveButton = document.getElementById("approveSubmit");
const submitButton = document.getElementById("submitApplication");
const otpApproval = document.getElementById("otpApproval");
const receiptCard = document.getElementById("receiptCard");
const executionLog = document.getElementById("executionLog");
const statusBadge = document.getElementById("statusBadge");
let selectedProfile = "student";
let running = false;
let submitted = false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function setStatus(text, state) {
  statusBadge.className = `status-badge ${state}`;
  statusBadge.innerHTML = `<span></span><b>${text}</b>`;
}

function log(message, type = "") {
  const line = document.createElement("div");
  line.className = `log-line ${type}`;
  const prefix = type === "warn" ? "VRF" : type === "success" ? "OK " : type === "action" ? "ACT" : "SYS";
  line.innerHTML = `<span>${prefix}</span>[${nowTime()}] ${message}`;
  executionLog.appendChild(line);
  executionLog.scrollTop = executionLog.scrollHeight;
}

function clearForm() {
  fieldIds.forEach(id => {
    const input = document.getElementById(id);
    input.value = "";
    const field = input.closest(".field");
    if (field) field.classList.remove("active-input", "error", "fixed");
  });
  submitButton.disabled = true;
  receiptCard.hidden = true;
  otpApproval.hidden = true;
  submitted = false;
}

function markActive(id) {
  document.querySelectorAll(".field").forEach(field => field.classList.remove("active-input"));
  const input = document.getElementById(id);
  const field = input.closest(".field");
  if (field) field.classList.add("active-input");
  input.focus({ preventScroll: true });
  input.classList.remove("validation-pop");
}

async function setFieldValue(id, value, options = {}) {
  const input = document.getElementById(id);
  markActive(id);
  setStatus(options.status || "Auto-Filling", "filling");
  log(`Inspecting field: ${input.closest(".field").querySelector("span").textContent.replace("*", "").trim()}`, "action");
  await sleep(260);

  input.value = "";
  if (typeof value === "string" && value.length > 0) {
    for (let i = 0; i < value.length; i++) {
      input.value += value[i];
      await sleep(options.fast ? 8 : 24);
    }
  }

  await sleep(180);
  log(`Mapped profile value → ${input.name}`, "success");
}

function convertDob(value) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return value;
}

async function launchAgent() {
  if (running) return;
  running = true;
  clearForm();
  launchButton.disabled = true;
  launchButton.textContent = "Agent Running...";
  executionLog.innerHTML = "";

  const profile = profiles[selectedProfile];
  setStatus("Scanning DOM", "scanning");
  log("Parse selected profile and initialize DOM inspection.", "action");
  await sleep(550);
  log(`Profile resolved: ${selectedProfile === "student" ? "Student Applicant" : "Senior Citizen Pensioner"}`);
  await sleep(350);
  log(`Detected ${fieldIds.length} form fields; validating label-to-key mappings.`);

  for (const id of ["fullName", "dob", "studentId", "annualIncome", "serviceType", "address"]) {
    await setFieldValue(id, profile[id]);
  }

  const dobField = document.querySelector('[data-field="dob"]');
  dobField.classList.remove("active-input");
  dobField.classList.add("error");
  dobField.querySelector(".field-feedback").textContent = "Portal validation: DD/MM/YYYY required";
  setStatus("Recovering Error", "recovering");
  log("Validator: Format mismatch detected — expected DD/MM/YYYY.", "warn");
  await sleep(650);
  dobField.classList.remove("error");
  dobField.classList.add("fixed");
  document.getElementById("dob").value = convertDob(profile.dob);
  dobField.querySelector(".field-feedback").textContent = "Auto-converted successfully";
  log("[Validator] Format mismatch detected — auto-converting to DD/MM/YYYY", "warn");
  await sleep(450);
  log("DOB normalized and format verified.", "success");
  await sleep(250);

  document.querySelectorAll(".field").forEach(field => field.classList.remove("active-input"));
  markActive("otp");
  setStatus("Paused for OTP", "paused");
  log("Final pre-submit validation passed.", "success");
  log("Human checkpoint: waiting for OTP verification.", "warn");
  otpApproval.hidden = false;
  launchButton.disabled = false;
  launchButton.innerHTML = `<svg viewBox="0 0 24 24"><path d="m14 5-9 7 9 7 4-7-4-7Z"/><path d="m14 5 5 7-5 7"/></svg> Agent Paused`;
  running = false;
}

document.querySelectorAll(".profile-card").forEach(card => {
  card.addEventListener("click", () => {
    if (running) return;
    document.querySelectorAll(".profile-card").forEach(item => item.classList.remove("active"));
    card.classList.add("active");
    selectedProfile = card.dataset.profile;
    clearForm();
    executionLog.innerHTML = `<div class="log-line muted"><span>SYS</span> Profile changed. Ready to launch.</div>`;
    setStatus("Idle", "idle");
  });
});

launchButton.addEventListener("click", launchAgent);

document.getElementById("sendOtp").addEventListener("click", () => {
  const otp = document.getElementById("otp");
  otp.value = "849206";
  otp.closest(".field").classList.add("fixed");
  otp.closest(".field").querySelector(".field-feedback").textContent = "Mock OTP delivered";
  log("OTP delivered to registered device; enter or use demo OTP.", "action");
  otp.focus();
});

approveButton.addEventListener("click", () => {
  const otp = document.getElementById("otp");
  if (!/^\d{6}$/.test(otp.value)) {
    const otpField = otp.closest(".field");
    otpField.classList.remove("fixed");
    otpField.classList.add("error");
    otpField.querySelector(".field-feedback").textContent = "Enter a valid 6-digit OTP";
    log("Approval blocked: OTP is missing or invalid.", "warn");
    otp.focus();
    return;
  }
  otp.closest(".field").classList.remove("error", "active-input");
  otp.closest(".field").classList.add("fixed");
  otp.closest(".field").querySelector(".field-feedback").textContent = "OTP verified";
  otpApproval.hidden = true;
  submitButton.disabled = false;
  submitApplication();
});

async function submitApplication() {
  if (submitted) return;
  submitted = true;
  setStatus("Submitted", "submitted");
  log("OTP verified by authorized operator.", "success");
  log("Final validation complete; submitting application...", "action");
  await sleep(650);

  const trackingId = `GOV-2026-${Math.floor(10000 + Math.random() * 89999)}`;
  const submittedAt = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "medium"
  }).format(new Date());

  document.getElementById("trackingId").textContent = trackingId;
  document.getElementById("submittedAt").textContent = submittedAt;
  document.getElementById("receiptApplicant").textContent = document.getElementById("fullName").value;
  receiptCard.hidden = false;
  submitButton.disabled = true;
  submitButton.innerHTML = `<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg> Application Submitted`;
  launchButton.innerHTML = `<svg viewBox="0 0 24 24"><path d="m14 5-9 7 9 7 4-7-4-7Z"/><path d="m14 5 5 7-5 7"/></svg> Launch New Run`;
  log(`Submission accepted. Tracking ID: ${trackingId}`, "success");
  log("Confirmation receipt generated.", "success");
}

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!submitButton.disabled) submitApplication();
});

document.getElementById("downloadReceipt").addEventListener("click", () => {
  const receipt = {
    agency: "GovPilot AI Public Service Portal",
    trackingId: document.getElementById("trackingId").textContent,
    submittedAt: document.getElementById("submittedAt").textContent,
    applicant: document.getElementById("receiptApplicant").textContent,
    status: "Submitted",
    otpVerified: true
  };
  const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${receipt.trackingId}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById("printReceipt").addEventListener("click", () => window.print());

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

setInterval(() => {
  document.getElementById("clock").textContent = nowTime();
}, 1000);
