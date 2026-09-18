"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/store";

export default function Topbar({ onNewIdea, showSearch = false }) {
  const { user } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <header className="h-[75px] border-b border-[#222528] flex items-center justify-between px-9 max-md:px-4 sticky top-0 bg-ink/90 backdrop-blur-xl z-[5]">
      {showSearch ? (
        <form
          className="w-[min(420px,55%)] flex"
          onSubmit={(e) => { e.preventDefault(); router.push(`/explore?q=${encodeURIComponent(q)}`); }}
        >
          <input className="input !rounded-r-none" aria-label="Search ideas" placeholder="Search ideas, categories..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="border border-[#35383d] border-l-0 bg-[#15171a] rounded-r-[9px] px-4 hover:bg-brand hover:border-brand transition-all">⌕</button>
        </form>
      ) : <div />}
      <div className="flex items-center gap-3">
        <button onClick={onNewIdea} className="btn btn-primary !py-2.5 max-md:!px-3 max-md:text-sm whitespace-nowrap hover:scale-[1.03]">+ New Idea</button>
        <span className="text-neutral-300">● {user?.name || "Innovator"}</span>
      </div>
    </header>
  );
}
