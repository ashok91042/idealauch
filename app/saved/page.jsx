"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppShell from "@/components/AppShell";
import IdeaCard from "@/components/IdeaCard";
import { useApp } from "@/lib/store";
export default function SavedPage() {
  const { user, ready, allIdeas, saved } = useApp();
  const router = useRouter();
  useEffect(() => { if (ready && !user) router.replace("/"); }, [ready, user, router]);
  if (!ready || !user) return <p className="p-10 text-neutral-500">Loading...</p>;
  const list = allIdeas.filter((i) => saved.map(String).includes(String(i.id)));
  return (
    <AppShell>
      <main className="max-w-[1200px] mx-auto px-9 py-11 max-md:px-4">
        <p className="eyebrow">YOUR COLLECTION</p>
        <h1 className="text-4xl font-extrabold">Your Saved Ideas</h1>
        <p className="text-neutral-500">Ideas you marked as favourites.</p>
        <section className="grid grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1 gap-[18px] mt-8">
          {list.length ? list.map((idea, i) => <IdeaCard key={idea.id} idea={idea} index={i} />)
          : <p className="text-center p-[60px] text-neutral-500 border border-dashed border-neutral-700 rounded-2xl col-span-full">No saved ideas yet. <Link href="/explore" className="text-brand-light">Explore ideas →</Link></p>}
        </section>
      </main>
    </AppShell>
  );
}
