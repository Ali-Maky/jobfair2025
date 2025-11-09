import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Logo asset (swap the path to your hosted file if needed)
// In production, keep the logo under /public
const ZAIN_LOGO_URL = "/zain-logo.png";

// --- Demo Data (edit freely) ---
const INITIAL_JOBS = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "ZINC Partners",
    location: "Baghdad, IQ (Hybrid)",
    type: "Full-time",
    tags: ["React", "Tailwind", "UI"],
    description:
      "Build and polish user-facing features, collaborate with designers, and ensure high performance across modern browsers.",
    responsibilities: [
      "Develop responsive interfaces using React and TailwindCSS",
      "Collaborate with product and design on component systems",
      "Write clean, well-tested code and perform code reviews",
    ],
    requirements: [
      "2+ years experience with React",
      "Solid knowledge of HTML/CSS/JS",
      "Familiarity with REST/GraphQL",
    ],
  },
  {
    id: "2",
    title: "Data Analyst",
    company: "Zain Iraq",
    location: "Basra, IQ (On-site)",
    type: "Contract",
    tags: ["SQL", "Power BI", "Python"],
    description:
      "Turn data into insights and dashboards that guide leadership decisions. Own data quality and storytelling.",
    responsibilities: [
      "Build reports and dashboards (Power BI/Tableau)",
      "Perform ETL and data validation",
      "Partner with stakeholders to define KPIs",
    ],
    requirements: [
      "3+ years in analytics",
      "Advanced SQL, basic Python",
      "Data viz portfolio",
    ],
  },
  {
    id: "3",
    title: "Cybersecurity Engineer",
    company: "Horizon Tech",
    location: "Erbil, IQ (Remote-friendly)",
    type: "Full-time",
    tags: ["Network", "SIEM", "ISO27001"],
    description:
      "Design and maintain security controls, respond to incidents, and drive best practices across teams.",
    responsibilities: [
      "Monitor SIEM and triage security alerts",
      "Conduct vulnerability assessments",
      "Harden cloud and on-prem infrastructure",
    ],
    requirements: [
      "Experience with SOC workflows",
      "Good grasp of networking",
      "Security certs are a plus",
    ],
  },
];

// --- Admin constants ---
const ADMIN_KEY = "job-fair-admin"; // localStorage flag ('1' when signed in)
const ADMIN_HINT = "Ask organizer for passcode";

// --- Helpers ---
const classNames = (...xs) => xs.filter(Boolean).join(" ");

function useSearch(jobs, query, type) {
  return useMemo(() => {
    let list = jobs || [];
    if (type && type !== "All") list = list.filter((j) => j.type === type);
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter((j) =>
      [j.title, j.company, j.location, (j.tags || []).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [jobs, query, type]);
}

function getIsAdmin() {
  try {
    return localStorage.getItem(ADMIN_KEY) === "1";
  } catch {
    return false;
  }
}

function setIsAdmin(v) {
  try {
    if (v) localStorage.setItem(ADMIN_KEY, "1");
    else localStorage.removeItem(ADMIN_KEY);
  } catch {}
}

// --- Main Component ---
export default function JobFairLanding() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState({}); // jobId -> true
  const [jobs, setJobs] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("job-fair-jobs") || "null");
      return Array.isArray(cached) ? cached : INITIAL_JOBS;
    } catch {
      return INITIAL_JOBS;
    }
  });

  const results = useSearch(jobs, query, type);

  // Admin auth state + add modal
  const [admin, setAdmin] = useState(getIsAdmin());
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // persist jobs
  React.useEffect(() => {
    try {
      localStorage.setItem("job-fair-jobs", JSON.stringify(jobs));
    } catch {}
  }, [jobs]);

  // delete vacancy (admin only)
  function deleteJob(id) {
    if (!admin) return;
    if (!confirm("Delete this vacancy? This cannot be undone.")) return;
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      {/* Header */}
      <header className="relative isolate">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-purple-300/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-fuchsia-300/30 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <a href="https://www.iq.zain.com" target="_blank" rel="noopener noreferrer"><img src={ZAIN_LOGO_URL} alt="Zain Iraq" className="h-10 w-auto" /></a>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Woman In Tech 2025 - Job Fair</h1>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-gray-600 md:text-base">
                Explore roles from leading partners. Click a vacancy to view the
                job description and apply by uploading your CV.
              </p>
            </div>

            {/* Admin gate */}
            <div className="flex items-center gap-3">
              {!admin ? (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="rounded-2xl border border-gray-300 px-4 py-2 text-sm"
                  title={ADMIN_HINT}
                >
                  Organizer sign in
                </button>
              ) : (
                <>
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">Admin</span>
                  <button
                    onClick={() => { setAdmin(false); setIsAdmin(false); }}
                    className="rounded-2xl border border-gray-300 px-4 py-2 text-sm"
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <section id="vacancies" className="mx-auto max-w-7xl px-6 pb-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by title, company, location, or tag…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-purple-500"
            />
          </div>
          <div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-purple-500"
            >
              {[
                "All",
                ...Array.from(new Set((jobs || []).map((j) => j.type))),
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Admin Controls (import/export/add) — visible only to admin */}
      {admin ? (
        <section className="mx-auto max-w-7xl px-6 pb-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm cursor-pointer">
                <input
                  type="file"
                  accept=".json,.csv,application/json,text/csv"
                  className="hidden"
                  onChange={handleImportFile}
                />
                <span>Import vacancies (JSON/CSV)</span>
              </label>
              <button
                onClick={exportJSON}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm hover:border-purple-400"
              >
                Export current as JSON
              </button>
              <details className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm">
                <summary className="cursor-pointer select-none">Load from Google Sheet (CSV URL)</summary>
                <div className="mt-3 flex gap-2">
                  <input id="sheet-url" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-purple-500" placeholder="Paste published CSV URL" />
                  <button onClick={() => {
                    const el = document.getElementById('sheet-url');
                    const url = el && 'value' in el ? el.value : '';
                    if (url) loadFromSheet(url);
                  }} className="rounded-xl bg-purple-600 px-3 py-2 text-white text-sm">Load</button>
                </div>
              </details>
              <button
                onClick={() => setShowAdd(true)}
                className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                + Add vacancy
              </button>
            </div>
            <div className="text-sm text-gray-500">
              Admin only. Import JSON/CSV with: id, title, company, location, type, tags (comma), description, responsibilities (semicolon/newline), requirements (semicolon/newline).
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-7xl px-6 pb-6">
          <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
            Organizers: <button onClick={() => setShowAdminLogin(true)} className="underline">sign in</button> to add or import vacancies.
          </div>
        </section>
      )}

      {/* Jobs Grid */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
            No vacancies found. Try a different search.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((job) => (
              <motion.button
                key={job.id}
                layout
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(job)}
                className={classNames(
                  "group text-left rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition",
                  "hover:border-purple-400 hover:shadow-md"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {job.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {job.company} • {job.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                      {job.type}
                    </span>
                    {admin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteJob(job.id); }}
                        title="Delete vacancy"
                        className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-gray-700">
                  {job.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(job.tags || []).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                {submitted[job.id] && (
                  <div className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
                    Application submitted
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <AnimatePresence>
        {selected && (
          <JobModal
            key={selected.id}
            job={selected}
            onClose={() => setSelected(null)}
            onSubmitted={(id) => setSubmitted((s) => ({ ...s, [id]: true }))}
          />
        )}
        {admin && showAdd && (
          <AddVacancyModal
            onClose={() => setShowAdd(false)}
            onSave={(newJob) => {
              const normalized = normalizeJob(newJob);
              setJobs((prev) => [normalized, ...prev]);
              setShowAdd(false);
              alert("Vacancy added.");
            }}
          />
        )}
        {showAdminLogin && (
          <AdminLoginModal
            onClose={() => setShowAdminLogin(false)}
            onSuccess={() => { setAdmin(true); setIsAdmin(true); setShowAdminLogin(false); }}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/60">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-gray-500 flex items-center gap-3">
          <img src={ZAIN_LOGO_URL} alt="Zain Iraq" className="h-6 w-auto opacity-80" />
          <span>© {new Date().getFullYear()} CER — All rights reserved.</span>
        </div>
      </footer>
    </div>
  );

  // --- Import/Export helpers ---
  function normalizeJob(j) {
    return {
      id: String(
        j.id ||
          (typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2))
      ),
      title: (j.title || "Untitled role").trim(),
      company: (j.company || "").trim(),
      location: (j.location || "").trim(),
      type: (j.type || "Full-time").trim(),
      tags: Array.isArray(j.tags)
        ? j.tags
        : typeof j.tags === "string" && j.tags
        ? j.tags.split(",").map((x) => x.trim()).filter(Boolean)
        : [],
      description: j.description || "",
      responsibilities: Array.isArray(j.responsibilities)
        ? j.responsibilities
        : typeof j.responsibilities === "string" && j.responsibilities
        ? j.responsibilities
            .split(/;|
/)
            .map((x) => x.trim())
            .filter(Boolean)
        : [],
      requirements: Array.isArray(j.requirements)
        ? j.requirements
        : typeof j.requirements === "string" && j.requirements
        ? j.requirements
            .split(/;|
/)
            .map((x) => x.trim())
            .filter(Boolean)
        : [],
    };
  }

  function parseCSV(text) {
    const lines = text.split(/
?
/).filter(Boolean);
    if (!lines.length) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const cols = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (ch === "," and !inQuotes) {
          cols.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
      cols.push(current);
      const obj = {};
      headers.forEach((h, idx) => (obj[h] = (cols[idx] || "").trim()));
      return obj;
    });
  }

  async function handleImportFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    let items = [];
    try {
      if (f.type.includes("json") || f.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        items = Array.isArray(parsed) ? parsed : parsed.jobs || [];
      } else {
        items = parseCSV(text);
      }
      const normalized = items.map(normalizeJob).filter((j) => j.title);
      if (!normalized.length) return alert("No valid jobs found in file.");
      setJobs(normalized);
      alert(`Imported ${normalized.length} vacancies.`);
    } catch (err) {
      console.error(err);
      alert("Could not import the file. Please check format.");
    } finally {
      e.target.value = "";
    }
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `job-fair-vacancies-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function loadFromSheet(url) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      const rows = parseCSV(text);
      const normalized = rows.map(normalizeJob).filter((j) => j.title);
      if (!normalized.length) return alert("No valid rows found.");
      setJobs(normalized);
      alert(`Loaded ${normalized.length} vacancies from sheet.`);
    } catch (e) {
      alert("Failed to load from the provided URL. Make sure it is a public CSV.");
    }
  }
}

function AddVacancyModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    tags: "",
    description: "",
    responsibilities: "",
    requirements: "",
  });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title is required.");
    setError("");
    onSave({ ...form });
  }

  const formId = "add-vacancy-form";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="relative z-10 w-full max-w-3xl bg-white shadow-xl md:rounded-3xl h-[90svh] md:h-auto max-h-[90svh] md:max-h-[85svh] overflow-hidden flex flex-col"
        role="dialog" aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b bg-white/95 backdrop-blur px-6 py-4">
          <h2 className="text-2xl font-semibold">Add Vacancy</h2>
          <button onClick={onClose} className="rounded-full bg-gray-100 px-3 py-1 text-sm">Close</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 pt-4 pb-28">
          <form id={formId} onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Title*</label>
              <input className="w-full rounded-xl border border-gray-200 px-3 py-2" value={form.title} onChange={set("title")} placeholder="Backend Developer" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Company</label>
              <input className="w-full rounded-xl border border-gray-200 px-3 py-2" value={form.company} onChange={set("company")} placeholder="Zain Iraq" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Location</label>
              <input className="w-full rounded-xl border border-gray-200 px-3 py-2" value={form.location} onChange={set("location")} placeholder="Baghdad, IQ" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select className="w-full rounded-xl border border-gray-200 px-3 py-2" value={form.type} onChange={set("type")}>
                {['Full-time','Part-time','Contract','Internship','Temporary'].map(t=> <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Tags (comma separated)</label>
              <input className="w-full rounded-xl border border-gray-200 px-3 py-2" value={form.tags} onChange={set("tags")} placeholder="React, Tailwind, UI" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea rows={4} className="w-full rounded-xl border border-gray-200 px-3 py-2" value={form.description} onChange={set("description")} placeholder="Brief role summary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Responsibilities (semicolon or new line)</label>
              <textarea rows={4} className="w-full rounded-xl border border-gray-200 px-3 py-2" value={form.responsibilities} onChange={set("responsibilities")} placeholder={"Build dashboards;
Validate data"} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Requirements (semicolon or new line)</label>
              <textarea rows={4} className="w-full rounded-xl border border-gray-200 px-3 py-2" value={form.requirements} onChange={set("requirements")} placeholder={"3+ years SQL;
Power BI"} />
            </div>
            {error and <div className="md:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          </form>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 border-t bg-white/95 backdrop-blur px-6 py-3">
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-2xl border border-gray-200 px-4 py-2 text-sm">Cancel</button>
            <button form={formId} type="submit" className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white">Save vacancy</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}


function AdminLoginModal({ onClose, onSuccess }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    // NOTE: Front-end only, not secure. Replace with real auth for production.
    const PASS = (window and window.ADMIN_PASSCODE) or "ZAIN-ADMIN"; // override by setting window.ADMIN_PASSCODE
    if (code.trim() === PASS) {
      setError("");
      onSuccess?.();
    } else {
      setError("Invalid passcode. Contact organizer.");
    }
  }

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">Organizer sign in</h2>
        <p className="mt-2 text-sm text-gray-600">Enter the admin passcode to manage vacancies.</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Enter passcode" className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500" />
          {error and <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-2xl border border-gray-300 px-4 py-2 text-sm">Cancel</button>
            <button type="submit" className="rounded-2xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white">Sign in</button>
          </div>
        </form>
        <p className="mt-2 text-xs text-gray-500">{ADMIN_HINT}</p>
      </motion.div>
    </motion.div>
  );
}
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  const v = validate();
  if (v) { setError(v); setOk(false); return; }
  setError("");

  try {
    // 1) Upload the CV to Blob via serverless function
    let cvUrl = "", cvBlobId = "";
    if (file) {
      const fd = new FormData();
      fd.append("jobId", job.id);
      fd.append("file", file, file.name);

      const upl = await fetch("/api/upload", { method: "POST", body: fd });
      const up = await upl.json();
      if (!upl.ok || !up?.ok) throw new Error(up?.error || "Upload failed");
      cvUrl = up.cvUrl; cvBlobId = up.cvBlobId;
    }

    // 2) Save record in Postgres
    const resp = await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        tags: (job.tags || []).join(","),
        name, email, phone,
        cvUrl, cvBlobId
      })
    });
    const data = await resp.json();
    if (!resp.ok || !data?.ok) throw new Error(data?.error || "Could not save application");

    setOk(true);
    onSubmitted?.(job.id);
    setName(""); setEmail(""); setPhone(""); setFile(null);
  } catch (err:any) {
    setOk(false);
    setError(err?.message || "Submission failed");
  }
}
    setError("");

    // Simulated submission — store minimal record locally.
    const record = {
      ts: new Date().toISOString(),
      jobId: job.id,
      jobTitle: job.title,
      name,
      email,
      phone,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };
    try {
      const key = "job-fair-submissions";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push(record);
      localStorage.setItem(key, JSON.stringify(existing));
      setOk(true);
      onSubmitted?.(job.id);

      // Reset form (keep modal open to show success)
      setName("");
      setEmail("");
      setPhone("");
      setFile(null);
    } catch (err) {
      setError("Could not save locally. (This is a demo without a backend.)");
      setOk(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="relative z-10 w-full max-w-3xl rounded-t-3xl bg-white p-6 shadow-xl md:rounded-3xl h-[90vh] md:h-auto max-h-[90vh] md:max-h-[85vh] overflow-y-auto overscroll-contain"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {job.title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {job.company} • {job.location} • {job.type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          {/* Description */}
          <div>
            <p className="text-gray-800">{job.description}</p>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-900">
                Responsibilities
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                {job.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-900">
                Requirements
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                {job.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Apply Form */}
          <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 p-4 pb-24">
            <h3 className="text-base font-semibold">Apply for this role</h3>
            <p className="mb-4 mt-1 text-sm text-gray-600">
              Upload your CV and details. Your submission is stored locally in
              this demo. Wire the onSubmit handler to your backend to go live.
            </p>

            <label className="mb-2 block text-sm font-medium">Full name</label>
            <input
              className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />

            <label className="mb-2 mt-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />

            <label className="mb-2 mt-1 block text-sm font-medium">Phone</label>
            <input
              className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-purple-500 focus:outline-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+964 …"
            />

            <label className="mb-2 mt-1 block text-sm font-medium">CV (PDF / DOCX)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700"
              onChange={(e) => setFile(e.target.files?.[0] or null)}
            />

            {error and (
              <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {ok and (
              <div className="mb-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
                Submitted! We'll be in touch.
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Submit Application
            </button>

            <p className="mt-3 text-xs text-gray-500">
              By submitting, you consent to processing your information for this
              job opportunity.
            </p>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- DEV: lightweight tests (console.assert) ---
(function runDevTests(){
  try {
    const sample = normalizeTestJob({
      id: "x1",
      title: "QA",
      company: "TestCo",
      location: "Baghdad",
      type: "Full-time",
      tags: "A, B, C",
      description: "desc",
      responsibilities: "Task A; Task B;  Task C ",
      requirements: "Req1;Req2; Req3",
    });
    console.assert(Array.isArray(sample.tags) && sample.tags.length === 3, "Tags should split by comma");
    console.assert(sample.responsibilities.length === 3, "Responsibilities should split by semicolon");
    console.assert(sample.requirements.length === 3, "Requirements should split by semicolon");

    const csv = "id,title,company,location,type,tags,description,responsibilities,requirements\n"+
                "1,Dev,Co,City,Full-time,JS|TS,desc,Do A;Do B,Need X;Need Y".replace("|", ",");
    const rows = (function(){
      const lines = csv.split(/\r?\n/).filter(Boolean);
      const headers = lines[0].split(",");
      const vals = lines[1].split(",");
      return [{ [headers[0]]: vals[0], [headers[1]]: vals[1] }];
    })();
    console.assert(rows.length === 1, "CSV parse smoke test");

    // NEW: regex split should work for semicolons OR newlines
    const mixed = "A\nB;C".split(/;|\n/).map(s=>s.trim()).filter(Boolean);
    console.assert(mixed.length === 3 && mixed[0] === "A" && mixed[1] === "B" && mixed[2] === "C", "Regex should split on semicolon OR newline");

    // NEW: admin gate tests (pure function)
    console.assert(canViewAdmin(true) === true && canViewAdmin(false) === false, "Admin gate should reflect flag");
  } catch (e) {
    // avoid breaking UI in production
    console.warn("DEV tests failed:", e);
  }

  function normalizeTestJob(j){
    return {
      id: String(j.id || "-"),
      title: (j.title || "").trim(),
      company: (j.company || "").trim(),
      location: (j.location || "").trim(),
      type: (j.type || "").trim(),
      tags: typeof j.tags === 'string' ? j.tags.split(',').map(s=>s.trim()).filter(Boolean) : (j.tags||[]),
      description: j.description || "",
      responsibilities: typeof j.responsibilities === 'string' ? j.responsibilities.split(';').map(s=>s.trim()).filter(Boolean) : (j.responsibilities||[]),
      requirements: typeof j.requirements === 'string' ? j.requirements.split(';').map(s=>s.trim()).filter(Boolean) : (j.requirements||[]),
    };
  }

  function canViewAdmin(flag){ return !!flag; }
})();
