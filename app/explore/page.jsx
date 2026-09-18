"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import IdeaCard from "@/components/IdeaCard";
import { useApp } from "@/lib/store";
function ExploreInner() {
  const { user, ready, allIdeas } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("title");
  useEffect(() => { if (ready && !user) router.replace("/"); }, [ready, user, router]);
  useEffect(() => {
    setQ(params.get("q") || "");
    if (params.get("category")) setCat(params.get("category"));
  }, [params]);
  const cats = useMemo(() => [...new Set(allIdeas.map((i) => i.category))].sort(), [allIdeas]);
  const result = useMemo(() => {
    const query = q.toLowerCase().trim();
    const r = allIdeas.filter((idea) =>
      `${idea.title} ${idea.category} ${idea.desc}`.toLowerCase().includes(query) &&
      (cat === "All" || idea.category === cat));
    return r.sort((a, b) => sort === "likes" ? b.likes - a.likes : a.title.localeCompare(b.title));
  }, [allIdeas, q, cat, sort]);
  if (!ready || !user) return <p className="p-10 text-neutral-500">Loading...</p>;
  return (
    <AppShell>
      <main className="max-w-[1200px] mx-auto px-9 py-11 max-md:px-4">
        <p className="eyebrow">DISCOVER</p>
        <div className="flex justify-between items-end gap-4 flex-wrap">
          <div><h1 className="text-4xl font-extrabold">Explore Startup Ideas</h1>
          <p className="text-neutral-500">Search, filter and find the perfect idea.</p></div>
        </div>
        <section className="grid grid-cols-[1fr_220px_180px] max-md:grid-cols-1 gap-3 my-8">
          <input className="input" placeholder="Search ideas..." aria-label="Search startup ideas" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="All">All Categories</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="title">Sort by Name</option>
            <option value="likes">Sort by Popularity</option>
          </select>
        </section>
        <section className="grid grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 gap-[18px]">
          {result.length ? result.map((idea, i) => <IdeaCard key={idea.id} idea={idea} index={i} />)
          : <p className="text-center p-[60px] text-neutral-500 border border-dashed border-neutral-700 rounded-2xl col-span-full">No ideas found.</p>}
        </section>
      </main>
    </AppShell>
  );
}
export default function ExplorePage() {
  return <Suspense fallback={<p className="p-10 text-neutral-500">Loading...</p>}><ExploreInner /></Suspense>;
}
