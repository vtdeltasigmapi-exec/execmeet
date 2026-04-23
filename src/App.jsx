import { useState, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const POSITIONS = [
  { id: "president",    title: "President",                       short: "PRES",  color: "#c084fc" },
  { id: "svp",          title: "Senior Vice President",           short: "SVP",   color: "#60a5fa" },
  { id: "vpco",         title: "VP of Chapter Operations",        short: "VPCO",  color: "#34d399" },
  { id: "vppa",         title: "VP of Professional Activities",   short: "VPPA",  color: "#fbbf24" },
  { id: "vpf",          title: "VP of Finance",                   short: "VPF",   color: "#f87171" },
  { id: "chancellor",   title: "Chancellor",                      short: "CHAN",  color: "#a78bfa" },
  { id: "vppe",         title: "VP of Pledge Education",          short: "VPPE",  color: "#2dd4bf" },
  { id: "vppr",         title: "VP of Public Relations",          short: "VPPR",  color: "#fb923c" },
  { id: "vpsa",         title: "VP of Scholarship & Awards",      short: "VPSA",  color: "#e879f9" },
  { id: "vpcs",         title: "VP of Community Service",         short: "VPCS",  color: "#86efac" },
  { id: "dei",          title: "DEI",                             short: "DEI",   color: "#67e8f9" },
  { id: "brotherhood",  title: "Brotherhood Development",         short: "BDEV",  color: "#fca5a5" },
  { id: "fundraising",  title: "Fundraising",                     short: "FUND",  color: "#fde68a" },
  { id: "activities",   title: "Activities",                      short: "ACT",   color: "#bbf7d0" },
];

const posMap = Object.fromEntries(POSITIONS.map(p => [p.id, p]));

function posColor(id) { return posMap[id]?.color || "#6b7280"; }
function posShort(id) { return posMap[id]?.short || id.toUpperCase(); }
function posTitle(id) { return posMap[id]?.title || id; }

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_MEETINGS = [
  {
    id: "m1",
    title: "Bi-Weekly Executive Meeting",
    date: "2025-04-09",
    attendees: ["president","svp","vpco","vpf","chancellor","vppa","vppr"],
    rawMinutes: `Meeting called to order at 6:00 PM by President.\n\nFinancials: VPF reported current balance of $4,200. Motion to approve $500 for spring social — passed.\n\nChapter Ops: VPCO noted spring retreat logistics need finalizing. Venue deposit due by April 18th.\n\nProfessional: VPPA confirmed alumni networking night for April 25th. Needs RSVPs collected by April 20th.\n\nPublic Relations: VPPR to post recap of last week's community service event on all socials by Friday.\n\nChancellor: Standards board hearing scheduled for April 15th — all involved parties notified.\n\nPresident's remarks: Bi-weekly report due to national chapter by April 30th. President will draft, SVP to review before submission.\n\nMeeting adjourned at 7:15 PM.`,
    summary: "Approved $500 for spring social. Retreat logistics, alumni night, standards hearing, and national report discussed.",
    actions: [
      { id:"a1", text:"Finalize spring retreat venue and pay deposit", owner:"vpco", deadline:"2025-04-18", status:"pending", priority:"high" },
      { id:"a2", text:"Collect RSVPs for alumni networking night", owner:"vppa", deadline:"2025-04-20", status:"pending", priority:"high" },
      { id:"a3", text:"Post community service recap on all social channels", owner:"vppr", deadline:"2025-04-11", status:"done", priority:"medium" },
      { id:"a4", text:"Prepare standards board hearing documentation", owner:"chancellor", deadline:"2025-04-15", status:"pending", priority:"high" },
      { id:"a5", text:"Draft bi-weekly national chapter report", owner:"president", deadline:"2025-04-28", status:"pending", priority:"medium" },
      { id:"a6", text:"Review national chapter report before submission", owner:"svp", deadline:"2025-04-29", status:"pending", priority:"medium" },
    ]
  },
  {
    id: "m2",
    title: "Bi-Weekly Executive Meeting",
    date: "2025-03-26",
    attendees: ["president","svp","vpco","vpf","vppe","vpsa","dei","brotherhood","fundraising","activities"],
    rawMinutes: `Meeting opened at 6:05 PM.\n\nPledge Education: VPPE provided update on new member education program. Week 4 quiz scores averaging 78%. Recommends study session before Week 5.\n\nScholarship: VPSA reminded board that scholarship applications close April 1st. Need at least 3 board members to serve on review committee.\n\nDEI: Proposed cultural awareness workshop for April 12th. Needs room booking confirmation from VPCO.\n\nBrotherhood: Scheduled brotherhood retreat for April 5th — 22 members confirmed. Need to purchase supplies ($150 budget approved).\n\nFundraising: Spring fundraiser car wash planned for April 19th. VPPR to assist with promotion.\n\nActivities: End-of-semester banquet date set for May 3rd. Venue: Riverside Hall. Tickets $25/member.\n\nFinance: VPF to reallocate $200 from general fund to activities budget for banquet.\n\nMeeting adjourned 7:30 PM.`,
    summary: "New member progress reviewed. Scholarship deadline, DEI workshop, brotherhood retreat, car wash, and banquet all coordinated.",
    actions: [
      { id:"a7", text:"Organize Week 5 new member study session", owner:"vppe", deadline:"2025-04-02", status:"done", priority:"medium" },
      { id:"a8", text:"Recruit 3 board members for scholarship review committee", owner:"vpsa", deadline:"2025-04-01", status:"done", priority:"high" },
      { id:"a9", text:"Book room for DEI cultural awareness workshop", owner:"vpco", deadline:"2025-03-29", status:"done", priority:"medium" },
      { id:"a10", text:"Purchase brotherhood retreat supplies ($150)", owner:"brotherhood", deadline:"2025-04-04", status:"done", priority:"medium" },
      { id:"a11", text:"Promote spring car wash fundraiser on all channels", owner:"vppr", deadline:"2025-04-15", status:"pending", priority:"medium" },
      { id:"a12", text:"Reallocate $200 from general fund to activities budget", owner:"vpf", deadline:"2025-03-28", status:"done", priority:"high" },
      { id:"a13", text:"Finalize banquet ticket sales and collection process", owner:"activities", deadline:"2025-04-20", status:"pending", priority:"medium" },
    ]
  }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split("T")[0]; }
function fmt(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function daysUntil(d) {
  if (!d) return null;
  const diff = new Date(d + "T00:00:00") - new Date(today() + "T00:00:00");
  return Math.round(diff / 86400000);
}
function urgencyColor(d, status) {
  if (status === "done") return "#34d399";
  const days = daysUntil(d);
  if (days === null) return "#6b7280";
  if (days < 0) return "#f87171";
  if (days <= 2) return "#fbbf24";
  return "#94a3b8";
}
function uid() { return Math.random().toString(36).slice(2); }

// ─── AI Caller ────────────────────────────────────────────────────────────────
async function callClaude(userMsg, system) {
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: system || "You are an executive assistant AI for a chapter board. Be precise and concise.",
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

async function extractFromMinutes(text) {
  const positions = POSITIONS.map(p => `${p.id} = "${p.title}"`).join(", ");
  const prompt = `You are analyzing executive meeting minutes for a chapter board.

Position IDs available: ${positions}

Meeting minutes:
"""
${text}
"""

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "title": "short meeting title",
  "date": "YYYY-MM-DD or today if unclear",
  "summary": "2-3 sentence summary of key decisions",
  "attendees": ["position_id", ...],
  "actions": [
    {
      "text": "clear action item description",
      "owner": "position_id",
      "deadline": "YYYY-MM-DD",
      "priority": "high|medium|low"
    }
  ]
}

Rules:
- Extract every concrete action item, deadline, or deliverable
- Assign owner to the closest matching position_id from the list
- If no clear deadline, estimate based on context (use dates 1-2 weeks out)
- If owner unclear, assign to "president"
- Return at least 3 action items if text is substantial
- Today is ${today()}`;

  const raw = await callClaude(prompt);
  // Try to find JSON block anywhere in the response
  const clean = raw.replace(/```json|```/g, "").trim();
  // First try direct parse
  try { return JSON.parse(clean); } catch {}
  // Try extracting just the JSON object
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  // Fallback: return a safe shell with the raw text as one action
  console.error("Claude response was:", raw);
  return {
    title: "Executive Meeting",
    date: today(),
    summary: "Meeting minutes uploaded. Please review and add action items manually.",
    attendees: ["president"],
    actions: [{
      text: "Review uploaded meeting minutes and assign action items",
      owner: "president",
      deadline: new Date(Date.now() + 7*86400000).toISOString().split("T")[0],
      priority: "high"
    }]
  };
}

// ─── PDF Reader (PDF.js) ──────────────────────────────────────────────────────
async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function readPdfText(file) {
  try {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText.trim();
  } catch (err) {
    console.error("PDF.js error:", err);
    return "";
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const S = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Figtree:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #f7f5fa;
  --surface: #faf9fc;
  --card: #ffffff;
  --border: #e4dff0;
  --border2: #cdc5e0;
  --text: #1a1624;
  --muted: #6b6278;
  --accent: #3b1f6e;
  --accent2: #522d96;
  --accent-light: #ede8f8;
  --gold: #b8922a;
  --gold-light: #fdf3dc;
  --danger: #b91c1c;
  --danger-light: #fef2f2;
  --warn: #92610a;
  --warn-light: #fefce8;
  --success: #166534;
  --success-light: #f0fdf4;
  --radius: 10px;
  --radius-lg: 16px;
}

body { background: var(--bg); color: var(--text); font-family: 'Figtree', sans-serif; font-size: 14px; line-height: 1.6; }

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

/* ── Layout ── */
.root { display: flex; height: 100vh; overflow: hidden; }
.sidebar { width: 260px; min-width: 260px; background: #2a1650; display: flex; flex-direction: column; overflow: hidden; border-right: 3px solid #b8922a; }
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--bg); }
.content { flex: 1; overflow-y: auto; padding: 28px 32px; }

/* ── Sidebar ── */
.sb-top { padding: 24px 20px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.sb-brand { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 800; color: #f5d98a; letter-spacing: -0.01em; }
.sb-sub { font-size: 10px; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 3px; }
.sb-section { padding: 14px 12px 6px; }
.sb-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255,255,255,0.35); padding: 0 8px; margin-bottom: 4px; }
.nav-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 12px; border-radius: 8px; background: none; border: none; color: rgba(255,255,255,0.65); font-family: 'Figtree', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; text-align: left; }
.nav-btn:hover { background: rgba(255,255,255,0.08); color: #fff; }
.nav-btn.active { background: rgba(184,146,42,0.25); color: #f5d98a; border-left: 3px solid #f5d98a; }
.nav-icon { font-size: 15px; width: 20px; text-align: center; opacity: 0.8; }
.sb-meetings { flex: 1; overflow-y: auto; padding: 0 12px 12px; }
.sb-meeting-item { padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: all 0.15s; margin-bottom: 3px; }
.sb-meeting-item:hover { background: rgba(255,255,255,0.08); }
.sb-meeting-item.active { background: rgba(184,146,42,0.2); border-left: 3px solid #f5d98a; }
.sb-meeting-title { font-size: 12px; color: rgba(255,255,255,0.85); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sb-meeting-date { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px; }
.sb-footer { padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.1); }
.ai-status { display: flex; align-items: center; gap: 8px; }
.ai-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 8px #4ade80; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
.ai-label { font-size: 11px; color: rgba(255,255,255,0.5); }

/* ── Topbar ── */
.topbar { padding: 16px 32px; border-bottom: 1px solid var(--border); background: var(--surface); display: flex; align-items: center; gap: 16px; border-left: 4px solid var(--accent); }
.topbar-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; flex: 1; }
.topbar-meta { font-size: 12px; color: var(--muted); }

/* ── Buttons ── */
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: 1px solid var(--border2); background: var(--card); color: var(--text); font-family: 'Figtree', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.btn:hover { border-color: var(--accent); color: var(--accent); }
.btn-primary { background: var(--gold); border-color: var(--gold); color: #fff; }
.btn-primary:hover { background: #a07828; border-color: #a07828; color: #fff; }
.btn-gold { background: var(--gold); border-color: var(--gold); color: #fff; }
.btn-gold:hover { background: #a07d35; border-color: #a07d35; color: #fff; }
.btn-sm { padding: 5px 11px; font-size: 12px; }
.btn-ghost { background: none; border-color: transparent; }
.btn-ghost:hover { background: var(--accent-light); border-color: var(--accent-light); color: var(--accent); }
.btn-danger { background: var(--danger); border-color: var(--danger); color: #fff; }

/* ── Cards ── */
.card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); }
.card-pad { padding: 20px 24px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.card-title { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 700; }
.section-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); font-weight: 600; margin-bottom: 10px; }

/* ── Stats ── */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
.stat-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 18px; }
.stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 6px; }
.stat-num { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; line-height: 1; }
.stat-sub { font-size: 11px; color: var(--muted); margin-top: 4px; }

/* ── Tags / Pills ── */
.pill { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.priority-high { background: var(--danger-light); color: var(--danger); }
.priority-medium { background: var(--warn-light); color: var(--warn); }
.priority-low { background: var(--accent-light); color: var(--accent); }
.status-done { background: var(--success-light); color: var(--success); }
.status-pending { background: #f0f0f0; color: var(--muted); }
.status-overdue { background: var(--danger-light); color: var(--danger); }

/* ── Action Items ── */
.action-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.action-row:last-child { border-bottom: none; }
.action-check { width: 18px; height: 18px; border: 1.5px solid var(--border2); border-radius: 5px; flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; margin-top: 1px; }
.action-check:hover { border-color: var(--accent); }
.action-check.done { background: var(--success); border-color: var(--success); }
.action-text { font-size: 13px; color: var(--text); flex: 1; line-height: 1.4; }
.action-text.done { text-decoration: line-through; color: var(--muted); }
.action-meta { font-size: 11px; color: var(--muted); margin-top: 3px; display: flex; gap: 10px; flex-wrap: wrap; }
.owner-chip { display: inline-flex; align-items: center; gap: 5px; padding: 1px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
.deadline-chip { font-size: 11px; font-weight: 500; }

/* ── Position Board ── */
.pos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.pos-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; position: relative; overflow: hidden; transition: border-color 0.15s; cursor: pointer; }
.pos-card:hover { border-color: var(--border2); }
.pos-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
.pos-card-title { font-size: 12px; font-weight: 600; margin-bottom: 8px; padding-right: 40px; line-height: 1.3; }
.pos-short { position: absolute; top: 14px; right: 14px; font-size: 9px; font-weight: 700; letter-spacing: 0.06em; opacity: 0.5; }
.pos-stats { display: flex; gap: 14px; }
.pos-stat { }
.pos-stat-num { font-size: 18px; font-weight: 700; font-family: 'Playfair Display', serif; line-height: 1; }
.pos-stat-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); margin-top: 1px; }

/* ── Upload ── */
.upload-zone { border: 2px dashed var(--border2); border-radius: var(--radius-lg); padding: 48px 32px; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--surface); }
.upload-zone:hover, .upload-zone.drag { border-color: var(--gold); background: var(--gold-light); }
.upload-icon { font-size: 36px; margin-bottom: 12px; opacity: 0.5; }
.upload-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.upload-sub { font-size: 13px; color: var(--muted); }

/* ── Minutes view ── */
.minutes-box { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; font-size: 13px; line-height: 1.8; color: var(--muted); white-space: pre-wrap; max-height: 300px; overflow-y: auto; }

/* ── Modal ── */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(2px); }
.modal { background: var(--card); border-radius: var(--radius-lg); padding: 28px; width: 560px; max-width: 95vw; max-height: 90vh; overflow-y: auto; border: 1px solid var(--border); }
.modal-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; margin-bottom: 20px; }
.form-row { margin-bottom: 14px; }
.form-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 5px; }
.input { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 9px 13px; color: var(--text); font-family: 'Figtree', sans-serif; font-size: 13px; outline: none; transition: border-color 0.15s; }
.input:focus { border-color: var(--accent); }
textarea.input { resize: vertical; min-height: 100px; }
select.input { cursor: pointer; }
.modal-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; border-top: 1px solid var(--border); padding-top: 18px; }

/* ── AI Processing ── */
.ai-progress { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 32px; text-align: center; }
.ai-spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.9s linear infinite; margin-bottom: 20px; }
@keyframes spin { to { transform: rotate(360deg); } }
.ai-progress-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.ai-progress-sub { font-size: 13px; color: var(--muted); }

/* ── Review Panel ── */
.review-section { margin-bottom: 20px; }
.review-action { display: flex; align-items: flex-start; gap: 10px; padding: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 8px; }
.review-action.rejected { opacity: 0.4; }
.review-toggle { width: 20px; height: 20px; border: 1.5px solid var(--border2); border-radius: 50%; flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; margin-top: 1px; }
.review-toggle.accepted { background: var(--success); border-color: var(--success); color: #fff; }
.review-toggle.rejected-btn { background: var(--danger); border-color: var(--danger); color: #fff; }

/* ── Weekly view ── */
.week-section { margin-bottom: 28px; }
.week-pos-header { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--radius); margin-bottom: 8px; }
.week-pos-name { font-size: 13px; font-weight: 600; }
.week-count { margin-left: auto; font-size: 11px; opacity: 0.7; }

/* ── Tabs ── */
.tabs { display: flex; gap: 2px; background: var(--bg); border-radius: 9px; padding: 3px; width: fit-content; margin-bottom: 20px; border: 1px solid var(--border); }
.tab { padding: 7px 16px; border-radius: 7px; font-size: 12px; cursor: pointer; color: var(--muted); transition: all 0.15s; font-weight: 500; }
.tab.active { background: var(--card); color: var(--text); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

/* ── Misc ── */
.divider { height: 1px; background: var(--border); margin: 16px 0; }
.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; color: var(--muted); text-align: center; }
.empty-icon { font-size: 32px; margin-bottom: 10px; opacity: 0.35; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.notif { position: fixed; bottom: 24px; right: 24px; background: var(--gold); color: #fff; border-radius: 10px; padding: 12px 18px; font-size: 13px; z-index: 300; display: flex; align-items: center; gap: 8px; animation: slideUp 0.3s ease; box-shadow: 0 4px 20px rgba(184,146,42,0.35); }
@keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
.badge { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; border-radius: 9px; background: var(--danger); color: #fff; font-size: 10px; font-weight: 700; padding: 0 5px; }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function OwnerChip({ id }) {
  const color = posColor(id);
  return (
    <span className="owner-chip" style={{ background: color + "22", color }}>
      {posShort(id)}
    </span>
  );
}

function DeadlineChip({ deadline, status }) {
  if (!deadline) return null;
  const days = daysUntil(deadline);
  const color = urgencyColor(deadline, status);
  let label = fmt(deadline);
  if (status !== "done") {
    if (days < 0) label += ` (${Math.abs(days)}d overdue)`;
    else if (days === 0) label += " (today)";
    else if (days === 1) label += " (tomorrow)";
  }
  return <span className="deadline-chip" style={{ color }}>{label}</span>;
}

function ActionRow({ action, onToggle, showOwner = true }) {
  const done = action.status === "done";
  const overdue = !done && daysUntil(action.deadline) < 0;
  return (
    <div className="action-row">
      <div className={`action-check ${done ? "done" : ""}`} onClick={() => onToggle(action.id)}>
        {done && <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ flex: 1 }}>
        <div className={`action-text ${done ? "done" : ""}`}>{action.text}</div>
        <div className="action-meta">
          {showOwner && <OwnerChip id={action.owner} />}
          <DeadlineChip deadline={action.deadline} status={action.status} />
          <span className={`pill priority-${action.priority}`}>{action.priority}</span>
          {overdue && <span className="pill status-overdue">overdue</span>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

function Dashboard({ meetings, onNav }) {
  const allActions = meetings.flatMap(m => m.actions);
  const pending = allActions.filter(a => a.status !== "done");
  const overdue = pending.filter(a => daysUntil(a.deadline) < 0);
  const dueThisWeek = pending.filter(a => { const d = daysUntil(a.deadline); return d !== null && d >= 0 && d <= 7; });
  const recentMeeting = meetings[0];

  // Per-position load
  const posLoad = POSITIONS.map(p => ({
    ...p,
    total: allActions.filter(a => a.owner === p.id).length,
    pending: allActions.filter(a => a.owner === p.id && a.status !== "done").length,
  })).filter(p => p.total > 0).sort((a,b) => b.pending - a.pending);

  return (
    <div className="content">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Meetings</div>
          <div className="stat-num" style={{ color: "var(--accent)" }}>{meetings.length}</div>
          <div className="stat-sub">bi-weekly cadence</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Open Actions</div>
          <div className="stat-num" style={{ color: "var(--gold)" }}>{pending.length}</div>
          <div className="stat-sub">across all positions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Due This Week</div>
          <div className="stat-num" style={{ color: "var(--accent2)" }}>{dueThisWeek.length}</div>
          <div className="stat-sub">next 7 days</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-num" style={{ color: "var(--danger)" }}>{overdue.length}</div>
          <div className="stat-sub">need attention</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Urgent items */}
        <div className="card card-pad">
          <div className="card-header">
            <div className="card-title">Urgent & Overdue</div>
            <button className="btn btn-sm btn-ghost" onClick={() => onNav("actions")}>See all</button>
          </div>
          {[...overdue, ...dueThisWeek.filter(a => daysUntil(a.deadline) <= 2)].slice(0,5).length === 0
            ? <div className="empty" style={{ padding: 24 }}><div className="empty-icon">✓</div><div style={{ fontSize: 13 }}>All caught up</div></div>
            : [...overdue, ...dueThisWeek.filter(a => daysUntil(a.deadline) <= 2)].slice(0,5).map(a => (
              <div key={a.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <OwnerChip id={a.owner} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.text}</div>
                  <DeadlineChip deadline={a.deadline} status={a.status} />
                </div>
              </div>
            ))
          }
        </div>

        {/* Most recent meeting */}
        {recentMeeting && (
          <div className="card card-pad">
            <div className="card-header">
              <div className="card-title">Last Meeting</div>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{fmt(recentMeeting.date)}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>{recentMeeting.summary}</div>
            <div className="section-label">Attendees</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {recentMeeting.attendees.map(id => <OwnerChip key={id} id={id} />)}
            </div>
          </div>
        )}
      </div>

      {/* Position load */}
      <div className="card card-pad">
        <div className="card-header">
          <div className="card-title">Accountability by Position</div>
          <button className="btn btn-sm btn-ghost" onClick={() => onNav("positions")}>Full view</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {posLoad.map(p => (
            <div key={p.id} style={{ padding: "10px 12px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: p.color, marginBottom: 4 }}>{p.short}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6, lineHeight: 1.3 }}>{p.title}</div>
              <div style={{ display: "flex", gap: 10 }}>
                <div><div style={{ fontSize: 16, fontWeight: 700, fontFamily: "Playfair Display, serif", color: p.pending > 0 ? "var(--warn)" : "var(--success)" }}>{p.pending}</div><div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase" }}>open</div></div>
                <div><div style={{ fontSize: 16, fontWeight: 700, fontFamily: "Playfair Display, serif" }}>{p.total}</div><div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase" }}>total</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MeetingDetail({ meeting, onToggle }) {
  const [tab, setTab] = useState("actions");
  if (!meeting) return <div className="content"><div className="empty"><div className="empty-icon">📋</div><div>Select a meeting from the sidebar</div></div></div>;

  const pending = meeting.actions.filter(a => a.status !== "done");
  const done = meeting.actions.filter(a => a.status === "done");

  return (
    <div className="content">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{meeting.title}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>{fmt(meeting.date)} · {meeting.attendees.length} attendees</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {meeting.attendees.map(id => <OwnerChip key={id} id={id} />)}
        </div>
      </div>

      {meeting.summary && (
        <div className="card card-pad" style={{ marginBottom: 20, borderLeft: "4px solid var(--accent)" }}>
          <div className="section-label">Meeting Summary</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: "var(--muted)" }}>{meeting.summary}</div>
        </div>
      )}

      <div className="tabs">
        {[["actions", `Actions (${meeting.actions.length})`], ["minutes", "Raw Minutes"]].map(([v,l]) => (
          <div key={v} className={`tab ${tab===v?"active":""}`} onClick={()=>setTab(v)}>{l}</div>
        ))}
      </div>

      {tab === "actions" && (
        <div className="card card-pad">
          <div className="card-header">
            <div className="card-title">Action Items</div>
            <div style={{ display: "flex", gap: 8 }}>
              <span className="pill status-pending">{pending.length} pending</span>
              <span className="pill status-done">{done.length} done</span>
            </div>
          </div>
          {meeting.actions.length === 0
            ? <div className="empty" style={{ padding: 24 }}><div>No action items extracted</div></div>
            : meeting.actions.map(a => <ActionRow key={a.id} action={a} onToggle={onToggle} />)
          }
        </div>
      )}

      {tab === "minutes" && (
        <div className="card card-pad">
          <div className="card-header"><div className="card-title">Raw Minutes</div></div>
          <div className="minutes-box">{meeting.rawMinutes || "No minutes recorded."}</div>
        </div>
      )}
    </div>
  );
}

function ActionsView({ meetings, onToggle }) {
  const [filter, setFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const allActions = meetings.flatMap(m => m.actions.map(a => ({ ...a, meetingTitle: m.title, meetingDate: m.date })));

  const filtered = allActions.filter(a => {
    const days = daysUntil(a.deadline);
    if (ownerFilter !== "all" && a.owner !== ownerFilter) return false;
    if (filter === "pending") return a.status !== "done";
    if (filter === "done") return a.status === "done";
    if (filter === "overdue") return a.status !== "done" && days < 0;
    if (filter === "thisweek") return a.status !== "done" && days !== null && days >= 0 && days <= 7;
    if (filter === "high") return a.priority === "high" && a.status !== "done";
    return true;
  }).sort((a,b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (b.status === "done" && a.status !== "done") return -1;
    return (daysUntil(a.deadline)||999) - (daysUntil(b.deadline)||999);
  });

  const activeOwners = [...new Set(allActions.map(a => a.owner))];

  return (
    <div className="content">
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {[["all","All"],["pending","Pending"],["overdue","Overdue"],["thisweek","This Week"],["high","High Priority"],["done","Done"]].map(([v,l]) => (
            <div key={v} className={`tab ${filter===v?"active":""}`} onClick={()=>setFilter(v)}>{l}</div>
          ))}
        </div>
        <select className="input" style={{ width: "auto", minWidth: 180 }} value={ownerFilter} onChange={e=>setOwnerFilter(e.target.value)}>
          <option value="all">All positions</option>
          {activeOwners.map(id => <option key={id} value={id}>{posTitle(id)}</option>)}
        </select>
      </div>

      <div className="card card-pad">
        <div className="card-header">
          <div className="card-title">Action Items</div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{filtered.length} items</span>
        </div>
        {filtered.length === 0
          ? <div className="empty" style={{ padding: 24 }}><div className="empty-icon">✓</div><div>Nothing here</div></div>
          : filtered.map(a => (
            <div key={a.id}>
              <ActionRow action={a} onToggle={onToggle} />
              <div style={{ fontSize: 10, color: "var(--muted)", paddingLeft: 30, marginTop: -6, marginBottom: 4, opacity: 0.7 }}>
                from: {a.meetingTitle} · {fmt(a.meetingDate)}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function PositionsView({ meetings, onToggle }) {
  const [selected, setSelected] = useState(null);
  const allActions = meetings.flatMap(m => m.actions);

  const posData = POSITIONS.map(p => ({
    ...p,
    actions: allActions.filter(a => a.owner === p.id),
    pending: allActions.filter(a => a.owner === p.id && a.status !== "done"),
    overdue: allActions.filter(a => a.owner === p.id && a.status !== "done" && daysUntil(a.deadline) < 0),
  })).filter(p => p.actions.length > 0);

  const focus = selected ? posData.find(p => p.id === selected) : null;

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <div style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>
        <div className="pos-grid">
          {posData.map(p => (
            <div key={p.id} className={`pos-card ${selected===p.id?"":"" }`}
              style={{ borderColor: selected===p.id ? p.color : "" }}
              onClick={() => setSelected(selected===p.id ? null : p.id)}>
              <div className="pos-card::before" />
              <div style={{ height: 3, background: p.color, borderRadius: 2, marginBottom: 10, marginLeft: -16, marginRight: -16, marginTop: -14 }} />
              <div className="pos-short">{p.short}</div>
              <div className="pos-card-title">{p.title}</div>
              <div className="pos-stats">
                <div className="pos-stat">
                  <div className="pos-stat-num" style={{ color: p.pending.length > 0 ? "var(--warn)" : "var(--success)" }}>{p.pending.length}</div>
                  <div className="pos-stat-lbl">open</div>
                </div>
                <div className="pos-stat">
                  <div className="pos-stat-num">{p.actions.length}</div>
                  <div className="pos-stat-lbl">total</div>
                </div>
                {p.overdue.length > 0 && (
                  <div className="pos-stat">
                    <div className="pos-stat-num" style={{ color: "var(--danger)" }}>{p.overdue.length}</div>
                    <div className="pos-stat-lbl">overdue</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {focus && (
        <div style={{ width: 380, minWidth: 380, background: "var(--surface)", borderLeft: "1px solid var(--border)", overflow: "auto", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ height: 4, width: 32, background: focus.color, borderRadius: 2, marginBottom: 8 }} />
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 17, fontWeight: 700 }}>{focus.title}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{focus.pending.length} open · {focus.actions.length - focus.pending.length} done</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={()=>setSelected(null)}>×</button>
          </div>
          <div className="divider" />
          {focus.actions.length === 0
            ? <div className="empty" style={{ padding: 24 }}><div>No actions assigned</div></div>
            : focus.actions.map(a => <ActionRow key={a.id} action={a} onToggle={onToggle} showOwner={false} />)
          }
        </div>
      )}
    </div>
  );
}

function WeeklyView({ meetings }) {
  const allActions = meetings.flatMap(m => m.actions.map(a => ({ ...a, meetingDate: m.date })));
  const pending = allActions.filter(a => a.status !== "done");

  // Group by owner
  const byOwner = POSITIONS.map(p => ({
    ...p,
    items: pending.filter(a => a.owner === p.id).sort((a,b) => (daysUntil(a.deadline)||999)-(daysUntil(b.deadline)||999))
  })).filter(p => p.items.length > 0);

  return (
    <div className="content">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Weekly Action Report</div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>All open items grouped by position holder · {pending.length} total pending</div>
      </div>
      {byOwner.map(p => (
        <div key={p.id} className="week-section">
          <div className="week-pos-header" style={{ background: p.color + "18", border: `1px solid ${p.color}40` }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
            <div className="week-pos-name" style={{ color: p.color }}>{p.title}</div>
            <div className="week-count" style={{ color: p.color }}>{p.items.length} item{p.items.length!==1?"s":""}</div>
          </div>
          <div className="card" style={{ padding: "4px 16px" }}>
            {p.items.map(a => <ActionRow key={a.id} action={a} onToggle={()=>{}} showOwner={false} />)}
          </div>
        </div>
      ))}
      {byOwner.length === 0 && <div className="empty"><div className="empty-icon">🎉</div><div>No open action items — great work!</div></div>}
    </div>
  );
}

// ─── Upload + AI Review Flow ──────────────────────────────────────────────────
function UploadView({ onMeetingCreated }) {
  const [stage, setStage] = useState("upload"); // upload | processing | review | done
  const [drag, setDrag] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [rawText, setRawText] = useState("");
  const [accepted, setAccepted] = useState({});
  const [editOwner, setEditOwner] = useState({});
  const [editDeadline, setEditDeadline] = useState({});
  const [editPriority, setEditPriority] = useState({});
  const fileRef = useRef();

  const process = async (text) => {
    setRawText(text);
    setStage("processing");
    try {
      const result = await extractFromMinutes(text);
      setExtracted(result);
      const acc = {};
      (result.actions || []).forEach((_,i) => { acc[i] = true; });
      setAccepted(acc);
      setStage("review");
    } catch(e) {
      console.error(e);
      setStage("upload");
      alert("Something went wrong during extraction. Try pasting the minutes as text instead of uploading a PDF — that tends to work more reliably.");
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type === "application/pdf") {
      setStage("processing");
      const text = await readPdfText(file);
      if (!text) { setStage("upload"); alert("Could not extract text from PDF."); return; }
      await process(text);
    } else if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const text = await file.text();
      await process(text);
    } else {
      alert("Please upload a PDF or text file.");
    }
  };

  const confirm = () => {
    if (!extracted) return;
    const actions = (extracted.actions || [])
      .filter((_, i) => accepted[i])
      .map((a, i) => ({
        ...a,
        id: uid(),
        owner: editOwner[i] || a.owner,
        deadline: editDeadline[i] || a.deadline,
        priority: editPriority[i] || a.priority,
        status: "pending",
      }));
    const meeting = {
      id: uid(),
      title: extracted.title || "Executive Meeting",
      date: extracted.date || today(),
      summary: extracted.summary || "",
      attendees: extracted.attendees || [],
      rawMinutes: rawText,
      actions,
    };
    onMeetingCreated(meeting);
    setStage("done");
    setTimeout(() => setStage("upload"), 2000);
    setExtracted(null); setRawText("");
  };

  if (stage === "processing") return (
    <div className="content">
      <div className="ai-progress">
        <div className="ai-spinner" />
        <div className="ai-progress-title">Analyzing Meeting Minutes</div>
        <div className="ai-progress-sub">Claude is extracting action items, owners, and deadlines…</div>
      </div>
    </div>
  );

  if (stage === "done") return (
    <div className="content">
      <div className="ai-progress">
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <div className="ai-progress-title">Meeting Added</div>
        <div className="ai-progress-sub">Action items have been assigned to position holders.</div>
      </div>
    </div>
  );

  if (stage === "review" && extracted) return (
    <div className="content">
      <div style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Review Extracted Items</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>AI found {extracted.actions?.length || 0} action items. Confirm, edit, or reject each one.</div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="section-label">Meeting Details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><div className="form-label">Title</div><div style={{ fontSize: 14, fontWeight: 500 }}>{extracted.title}</div></div>
          <div><div className="form-label">Date</div><div style={{ fontSize: 14, fontWeight: 500 }}>{fmt(extracted.date)}</div></div>
        </div>
        {extracted.summary && <div style={{ marginTop: 12 }}><div className="form-label">Summary</div><div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{extracted.summary}</div></div>}
        {extracted.attendees?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="form-label">Detected Attendees</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
              {extracted.attendees.map(id => <OwnerChip key={id} id={id} />)}
            </div>
          </div>
        )}
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">Action Items</div></div>
        {(extracted.actions || []).map((a, i) => (
          <div key={i} className={`review-action ${accepted[i]===false?"rejected":""}`}>
            <div
              className={`review-toggle ${accepted[i]===false?"rejected-btn":"accepted"}`}
              onClick={() => setAccepted(prev => ({ ...prev, [i]: !prev[i] }))}
            >
              {accepted[i] !== false ? <span style={{fontSize:10,fontWeight:700}}>✓</span> : <span style={{fontSize:10,fontWeight:700}}>✕</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{a.text}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div>
                  <div className="form-label">Owner</div>
                  <select className="input" style={{ padding: "5px 8px", fontSize: 12 }}
                    value={editOwner[i] || a.owner}
                    onChange={e => setEditOwner(prev => ({ ...prev, [i]: e.target.value }))}>
                    {POSITIONS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div>
                  <div className="form-label">Deadline</div>
                  <input type="date" className="input" style={{ padding: "5px 8px", fontSize: 12 }}
                    value={editDeadline[i] || a.deadline || ""}
                    onChange={e => setEditDeadline(prev => ({ ...prev, [i]: e.target.value }))} />
                </div>
                <div>
                  <div className="form-label">Priority</div>
                  <select className="input" style={{ padding: "5px 8px", fontSize: 12 }}
                    value={editPriority[i] || a.priority}
                    onChange={e => setEditPriority(prev => ({ ...prev, [i]: e.target.value }))}>
                    {["high","medium","low"].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn" onClick={() => setStage("upload")}>← Back</button>
        <button className="btn btn-primary" onClick={confirm}>
          Confirm {Object.values(accepted).filter(Boolean).length} Action Items →
        </button>
      </div>
    </div>
  );

  return (
    <div className="content">
      <div style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Upload Meeting Minutes</div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>Upload a PDF or text file — Claude will extract action items, owners, and deadlines automatically.</div>

      <div
        className={`upload-zone ${drag ? "drag" : ""}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".pdf,.txt,.md" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        <div className="upload-icon">📄</div>
        <div className="upload-title">Drop minutes here</div>
        <div className="upload-sub">PDF, TXT, or Markdown · click to browse</div>
      </div>

      <div style={{ margin: "20px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>— or paste minutes directly —</div>

      <div className="card card-pad">
        <div className="form-label" style={{ marginBottom: 8 }}>Paste Meeting Minutes</div>
        <textarea className="input" style={{ minHeight: 180 }} placeholder="Paste full meeting minutes text here..." value={rawText} onChange={e => setRawText(e.target.value)} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn btn-primary" disabled={!rawText.trim()} onClick={() => process(rawText)}>
            Extract Action Items →
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [meetings, setMeetings] = useState(SEED_MEETINGS);
  const [nav, setNav] = useState("dashboard");
  const [selectedMeeting, setSelectedMeeting] = useState(SEED_MEETINGS[0]?.id || null);
  const [notif, setNotif] = useState("");

  const showNotif = (msg) => { setNotif(msg); setTimeout(() => setNotif(""), 3000); };

  const toggleAction = useCallback((actionId) => {
    setMeetings(prev => prev.map(m => ({
      ...m,
      actions: m.actions.map(a => a.id === actionId ? { ...a, status: a.status === "done" ? "pending" : "done" } : a)
    })));
  }, []);

  const addMeeting = useCallback((meeting) => {
    setMeetings(prev => [meeting, ...prev]);
    setSelectedMeeting(meeting.id);
    setNav("meeting");
    showNotif(`Meeting added: ${meeting.actions.length} action items extracted`);
  }, []);

  const allPending = meetings.flatMap(m => m.actions).filter(a => a.status !== "done").length;
  const overdue = meetings.flatMap(m => m.actions).filter(a => a.status !== "done" && daysUntil(a.deadline) < 0).length;

  const currentMeeting = meetings.find(m => m.id === selectedMeeting);

  const navItems = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "actions", icon: "◻", label: "All Actions", badge: allPending },
    { id: "positions", icon: "◎", label: "By Position" },
    { id: "weekly", icon: "◧", label: "Weekly Report" },
    { id: "upload", icon: "↑", label: "Upload Minutes" },
  ];

  return (
    <>
      <style>{S}</style>
      <div className="root">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sb-top">
            <div className="sb-brand">ExecMeet</div>
            <div className="sb-sub">Executive Intelligence Hub</div>
          </div>

          <div className="sb-section">
            <div className="sb-label">Navigation</div>
            {navItems.map(n => (
              <button key={n.id} className={`nav-btn ${nav===n.id?"active":""}`} onClick={() => setNav(n.id)}>
                <span className="nav-icon">{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.badge > 0 && <span className="badge">{n.badge}</span>}
              </button>
            ))}
          </div>

          <div className="sb-section" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="sb-label">Meeting Archive</div>
            <div className="sb-meetings">
              {meetings.map(m => (
                <div
                  key={m.id}
                  className={`sb-meeting-item ${nav==="meeting" && selectedMeeting===m.id ? "active" : ""}`}
                  onClick={() => { setSelectedMeeting(m.id); setNav("meeting"); }}
                >
                  <div className="sb-meeting-title">{m.title}</div>
                  <div className="sb-meeting-date">{fmt(m.date)} · {m.actions.filter(a=>a.status!=="done").length} open</div>
                </div>
              ))}
            </div>
          </div>

          <div className="sb-footer">
            <div className="ai-status">
              <div className="ai-dot" />
              <div className="ai-label">Claude AI active</div>
              {overdue > 0 && <span className="badge" style={{ marginLeft: "auto" }}>{overdue} overdue</span>}
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          <div className="topbar">
            <div className="topbar-title">
              {nav === "dashboard" && "Executive Overview"}
              {nav === "actions" && "All Action Items"}
              {nav === "positions" && "Actions by Position"}
              {nav === "weekly" && "Weekly Report"}
              {nav === "upload" && "Upload Meeting Minutes"}
              {nav === "meeting" && (currentMeeting?.title || "Meeting Detail")}
            </div>
            {nav === "meeting" && currentMeeting && (
              <span className="topbar-meta">{fmt(currentMeeting.date)} · {currentMeeting.actions.filter(a=>a.status!=="done").length} open items</span>
            )}
            {nav !== "upload" && (
              <button className="btn btn-primary" onClick={() => setNav("upload")}>+ Upload Minutes</button>
            )}
          </div>

          {nav === "dashboard" && <Dashboard meetings={meetings} onNav={setNav} />}
          {nav === "actions" && <ActionsView meetings={meetings} onToggle={toggleAction} />}
          {nav === "positions" && <PositionsView meetings={meetings} onToggle={toggleAction} />}
          {nav === "weekly" && <WeeklyView meetings={meetings} />}
          {nav === "upload" && <UploadView onMeetingCreated={addMeeting} />}
          {nav === "meeting" && <MeetingDetail meeting={currentMeeting} onToggle={toggleAction} />}
        </div>
      </div>

      {notif && <div className="notif">✓ {notif}</div>}
    </>
  );
}
