"use client";
import Link from "next/link";
import { useApp } from "@/lib/store";

export default function IdeaCard({ idea, index = 0 }) {
  const { user, saved, toggleSave, deleteIdea, showToast, backend, seedIds } = useApp();
  const isSaved = saved.map(String).includes(String(idea.id));
  const mine = idea.mine || (user && (idea.authorId === user.id || (idea.authorEmail && idea.authorEmail === user.email)));
  const canDelete = backend ? !!mine : !!idea.mine || (idea.authorId && user && idea.authorId === user.id);
  return (
    <article
      className="card p-5 flex flex-col animate-fadeUp hover:-translate-y-2 hover:border-brand/40 hover:shadow-card hover:shadow-brand/10 group"
      style={{ animationDelay: `${Math.min(index, 5) * 60}ms` }}
    >
      <div className="text-2xl w-[50px] h-[50px] grid place-items-center bg-[#261013] rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
        {idea.icon || "💡"}
      </div>
      <div className="mt-3">
        <span className="tag">{idea.category}</span>
        {mine && (
          <span className="inline-block ml-2 text-[.68rem] font-extrabold text-[#ffb3b6] bg-[#4d1418] border border-[#7d2027] px-2 py-0.5 rounded-full align-middle">
            YOUR IDEA
          </span>
        )}
      </div>
      <h3 className="mt-1 font-bold transition-colors group-hover:text-brand-light">{idea.title}</h3>
      <p className="text-neutral-400 text-sm">{idea.desc}</p>
      <div className="flex justify-between items-center mt-auto pt-4">
        <button
          className="text-brand text-xl hover:scale-[1.35] transition-transform"
          aria-label={isSaved ? "Remove from saved" : "Save idea"}
          onClick={async () => {
            try {
              const nowSaved = await toggleSave(idea.id);
              showToast(nowSaved ? "Saved to your collection ♥" : "Removed from saved");
            } catch (err) { showToast(err.message || "Please sign in."); }
          }}
        >
          {isSaved ? "♥" : "♡"} {idea.likes}
        </button>
        <span className="flex gap-2">
          <Link href={`/details?id=${idea.id}`} className="border border-neutral-600 rounded-[7px] px-3 py-1.5 text-sm transition-all hover:bg-brand hover:border-brand hover:text-white hover:shadow-glow">
            View
          </Link>
          {canDelete && (
            <button
              className="border border-neutral-600 rounded-[7px] px-3 py-1.5 text-sm transition-all hover:bg-brand hover:border-brand hover:text-white"
              onClick={async () => {
                if (!confirm("Delete this idea permanently?")) return;
                try { await deleteIdea(idea.id); showToast("Idea deleted"); }
                catch (err) { showToast(err.message || "Delete failed."); }
              }}
            >
              Delete
            </button>
          )}
        </span>
      </div>
    </article>
  );
}
