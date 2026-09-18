"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { CATEGORY_SUGGESTIONS, ICON_CHOICES } from "@/lib/ideas";

export default function NewIdeaModal({ open, onClose }) {
  const { user, backend, addIdea, refreshIdeas, showToast } = useApp();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORY_SUGGESTIONS[0]);
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [desc, setDesc] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [features, setFeatures] = useState("");
  const [errs, setErrs] = useState({});

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    const errsNow = {};
    if (title.trim().length < 3) errsNow.title = "Title needs at least 3 characters.";
    if (desc.trim().length < 10) errsNow.desc = "Description needs at least 10 characters.";
    if (!problem.trim() || !solution.trim()) showToast("Please fill problem & solution");
    if (!problem.trim() || !solution.trim()) errsNow.rest = true;
    setErrs(errsNow);
    if (Object.keys(errsNow).length) return;
    const idea = {
      id: Date.now(),
      title: title.trim(), category, icon,
      desc: desc.trim(), problem: problem.trim(), solution: solution.trim(),
      features: features.trim()
        ? features.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6)
        : ["MVP ready concept", "User focused", "Scalable"],
      likes: 0, mine: true, author: user?.name || "You",
      createdAt: new Date().toISOString(),
    };
    try {
      const created = await addIdea(idea);
      onClose();
      showToast("🎉 Idea published!");
      setTitle(""); setDesc(""); setProblem(""); setSolution(""); setFeatures("");
      const t = (created && created.title) || idea.title;
      if (window.location.pathname !== "/explore") router.push(`/explore?q=${encodeURIComponent(t)}`);
    } catch (err) {
      showToast(err.message || "Could not publish idea");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#121416] border border-[#6b2127] rounded-[18px] max-w-[620px] w-full max-h-[92vh] overflow-auto p-7 shadow-card animate-popIn" role="dialog" aria-modal="true">
        <h2 className="text-2xl font-extrabold">Submit a <span className="text-brand">New Idea</span> 🚀</h2>
        <p className="text-neutral-400 mt-2">Share your startup concept. It appears instantly in Explore.</p>
        <form onSubmit={submit} noValidate>
          <label className="label">Idea Title *</label>
          <input className="input" placeholder="e.g. AI Fitness Coach" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} />
          <small className="error">{errs.title || ""}</small>
          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3">
            <div>
              <label className="label">Category *</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORY_SUGGESTIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Icon</label>
              <select className="input" value={icon} onChange={(e) => setIcon(e.target.value)}>
                {ICON_CHOICES.map((i) => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <label className="label">Short Description * (min 10 chars)</label>
          <textarea className="input min-h-[88px] resize-y" placeholder="What does your idea do?" maxLength={220} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <small className="error">{errs.desc || ""}</small>
          <label className="label">Problem Statement *</label>
          <textarea className="input min-h-[88px] resize-y" placeholder="What problem does it solve?" value={problem} onChange={(e) => setProblem(e.target.value)} />
          <label className="label">Solution *</label>
          <textarea className="input min-h-[88px] resize-y" placeholder="How does it solve it?" value={solution} onChange={(e) => setSolution(e.target.value)} />
          <label className="label">Key Features (comma separated)</label>
          <input className="input" placeholder="e.g. Live tracking, AI tips" value={features} onChange={(e) => setFeatures(e.target.value)} />
          <div className="flex gap-2.5 mt-5">
            <button type="button" className="btn btn-outline flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1">🚀 Publish Idea</button>
          </div>
        </form>
      </div>
    </div>
  );
}
