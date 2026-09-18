"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useApp } from "@/lib/store";
function DetailsInner() {
  const { user, ready, allIdeas, saved, toggleSave, deleteIdea, showToast } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  useEffect(() => { if (ready && !user) router.replace("/"); }, [ready, user, router]);
  if (!ready || !user) return <p className="p-10 text-neutral-500">Loading...</p>;
  const id = Number(params.get("id")) || (allIdeas[0] && allIdeas[0].id);
  const idea = allIdeas.find((x) => String(x.id) === String(id)) || allIdeas[0];
  if (!idea) return <AppShell><p className="p-10">Idea not found.</p></AppShell>;
  const isSaved = saved.map(String).includes(String(idea.id));
  const mine = idea.mine || (user && (idea.authorId === user.id || (idea.authorEmail && idea.authorEmail === user.email)));
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: idea.title, text: idea.title, url }); } catch {} }
    else if (navigator.clipboard) { await navigator.clipboard.writeText(url); showToast("Link copied!"); }
  };
  return (
    <AppShell>
      <main className="max-w-[1200px] mx-auto px-9 py-11 max-md:px-4">
        <Link href="/explore" className="inline-block text-neutral-400 mb-5 transition-all hover:text-brand-light hover:pl-1">← Back to Explore</Link>
        <article className="card p-8 max-w-[900px] animate-slideIn">
          <div className="grid grid-cols-[180px_1fr] max-md:grid-cols-1 gap-6">
            <div className="h-[180px] grid place-items-center text-8xl bg-[#250d11] rounded-2xl">{idea.icon || "💡"}</div>
            <div>
              <span className="tag">{idea.category}</span>
              <h1 className="text-3xl font-extrabold mt-2">{idea.title}</h1>
              <p className="text-neutral-400">{idea.desc}</p>
              <div className="flex gap-2.5 flex-wrap mt-3">
                <button className="btn btn-primary" onClick={async () => {
                  try {
                    const nowSaved = await toggleSave(idea.id);
                    showToast(nowSaved ? "Saved ♥" : "Removed");
                  } catch (err) { showToast(err.message || "Please sign in."); }
                }}>{isSaved ? "♥ Saved" : "♡ Save Idea"}</button>
                <button className="btn btn-outline" onClick={share}>⤴ Share</button>
                {mine && <button className="btn btn-outline" onClick={async () => {
                  if (!confirm("Delete this idea permanently?")) return;
                  try { await deleteIdea(idea.id); showToast("Idea deleted"); router.push("/explore"); }
                  catch (err) { showToast(err.message || "Delete failed."); }
                }}>Delete</button>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-4 mt-6">
            {[["📌 Problem Statement", idea.problem], ["💡 Solution", idea.solution]].map(([h, p]) => (
              <section key={h} className="border border-ink-line rounded-xl p-[18px] transition-all hover:border-brand/40 hover:-translate-y-1"><h2 className="font-bold">{h}</h2><p className="text-neutral-400">{p}</p></section>
            ))}
            <section className="border border-ink-line rounded-xl p-[18px]"><h2 className="font-bold">✨ Key Features</h2><ul className="list-disc ml-5 text-neutral-400">{(idea.features || []).map((f) => <li key={f}>{f}</li>)}</ul></section>
            <section className="border border-ink-line rounded-xl p-[18px]"><h2 className="font-bold">🚀 Potential Impact</h2><p className="text-neutral-400">A useful, scalable product around a real user problem.</p></section>
          </div>
        </article>
      </main>
    </AppShell>
  );
}
export default function DetailsPage() {
  return <Suspense fallback={<p className="p-10 text-neutral-500">Loading...</p>}><DetailsInner /></Suspense>;
}
