"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<"company" | "user">("user");
  const [sourceOrg, setSourceOrg] = useState("");
  const [tags, setTags] = useState("");
  const [license, setLicense] = useState("");
  const [provenanceUrl, setProvenanceUrl] = useState("");
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose a .ipynb file");
      return;
    }
    const form = new FormData();
    form.set("file", file);
    form.set("title", title || file.name.replace(/\.ipynb$/, ""));
    form.set("sourceType", sourceType);
    if (sourceOrg) form.set("sourceOrg", sourceOrg);
    if (tags) form.set("tags", tags);
    if (license) form.set("license", license);
    if (provenanceUrl) form.set("provenanceUrl", provenanceUrl);
    form.set("published", String(published));
    setBusy(true);
    try {
      const res = await fetch("/api/admin/notebooks/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "upload failed");
      const q = json.commitUrl ? `?commit=${encodeURIComponent(json.commitUrl)}` : "";
      router.push(`/notebooks/${json.id}${q}`);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin: Upload Notebook</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Notebook (.ipynb)</label>
          <input type="file" accept=".ipynb,application/json" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input className="w-full rounded border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Source Type</label>
            <select className="w-full rounded border px-3 py-2" value={sourceType} onChange={(e) => setSourceType(e.target.value as any)}>
              <option value="user">User</option>
              <option value="company">Company</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Source Org (optional)</label>
            <input className="w-full rounded border px-3 py-2" value={sourceOrg} onChange={(e) => setSourceOrg(e.target.value)} placeholder="e.g., Anthropic" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input className="w-full rounded border px-3 py-2" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vision, rlhf" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">License</label>
            <input className="w-full rounded border px-3 py-2" value={license} onChange={(e) => setLicense(e.target.value)} placeholder="e.g., MIT, Apache-2.0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Provenance URL</label>
            <input className="w-full rounded border px-3 py-2" value={provenanceUrl} onChange={(e) => setProvenanceUrl(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publish
        </label>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button disabled={busy} className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-alain-yellow text-alain-blue font-semibold disabled:opacity-50">
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>
    </div>
  );
}
