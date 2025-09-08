"use client";
import { useState } from "react";

export default function GenerateLessonPage() {
  const [hfUrl, setHfUrl] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hfUrl, difficulty, includeAssessment: true })
      });
      const data = await resp.json();
      if (!data.success) {
        setError(data?.error?.message || "Failed to generate");
        return;
      }
      window.location.href = `/tutorial/${data.tutorialId}`;
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Generate Lesson from Hugging Face URL</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full p-2 rounded bg-gray-900 border border-gray-800"
          placeholder="https://huggingface.co/owner/repo"
          value={hfUrl}
          onChange={(e) => setHfUrl(e.target.value)}
        />
        <select
          className="p-2 rounded bg-gray-900 border border-gray-800"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={loading || !hfUrl.trim()}>
          {loading ? "Generating..." : "Generate Lesson"}
        </button>
      </form>
      {error && <div className="text-red-400">{error}</div>}
    </div>
  );
}

