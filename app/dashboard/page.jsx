"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useApp } from "@/lib/store";
export default function DashboardPage() {
  const { user, ready, allIdeas, saved } = useApp();
  const router = useRouter();
  useEffect(() => { if (ready && !user) router.replace("/"); }, [ready, user, router]);
  if (!ready || !user) return <p className="p-10 text-neutral-500">Loading...</p>;
  const cats = new Set(allIdeas.map((i) => i.category)).size;
  const popCats = ["AI & ML", "FinTech", "HealthTech", "EdTech", "Green Tech", "E-commerce"];
  const icons = { "AI & ML": "🤖", FinTech: "💳", HealthTech: "❤️", EdTech: "📚", "Green Tech": "🌱", "E-commerce": "🛒" };
  return (
    <AppShell showSearch>
      <main className="max-w-[1200px] mx-auto px-9 py-11 max-md:px-4">
        <section className="animate-fadeUp">
          <p className="eyebrow">YOUR COMMAND CENTER</p>
          <h1 className="text-4xl font-extrabold mt-1">Hello, {user.name} 👋</h1>
          <p className="text-neutral-500">Ready to explore new opportunities?</p>
        </section>
        <section className="grid grid-cols-4 max-md:grid-cols-2 gap-4 my-8">
          {[[allIdeas.length, "Startup Ideas"], [saved.length, "Saved Ideas"], [cats, "Categories"], ["1", "Active Session"]].map(([v, l]) => (
            <article key={l} className="card p-5 transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-card">
              <strong className="block text-3xl text-brand">{v}</strong><span className="text-neutral-500 text-sm">{l}</span>
            </article>
          ))}
        </section>
        <section className="min-h-[250px] border border-[#7d2027] rounded-[18px] p-8 bg-gradient-to-[120deg,#190709,#430b10_55%,#160607] flex items-center justify-between overflow-hidden transition-all hover:border-brand hover:shadow-glow">
          <div>
            <p className="eyebrow">IDEAS TODAY</p>
            <h2 className="text-4xl max-md:text-2xl font-extrabold my-1">Small Ideas Can Create <span className="text-brand">Big Change.</span></h2>
            <p className="text-neutral-400">Discover. Save. Build.</p>
            <Link href="/explore" className="btn btn-primary mt-4">Explore Ideas →</Link>
          </div>
          <div className="text-8xl max-md:text-6xl -rotate-[20deg] drop-shadow-[0_0_25px_#ff3038]">🚀</div>
        </section>
        <section>
          <div className="flex justify-between items-center mt-10">
            <h2 className="text-xl font-bold">Popular Categories</h2>
            <Link href="/explore" className="text-brand-light">View all</Link>
          </div>
          <div className="grid grid-cols-6 max-md:grid-cols-3 max-sm:grid-cols-2 gap-3 mt-3">
            {popCats.map((c) => (
              <Link key={c} href={`/explore?category=${encodeURIComponent(c)}`} className="card p-[18px] text-center transition-all hover:-translate-y-1.5 hover:scale-[1.03] hover:border-brand hover:bg-[#1c0f11] hover:shadow-glow">
                {icons[c]} {c}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
