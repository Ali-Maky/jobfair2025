// --- replace your JobModal handleSubmit with this ---
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
