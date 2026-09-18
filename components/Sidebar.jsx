"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";

const links = [
  { href: "/dashboard", label: "⌂ Dashboard" },
  { href: "/explore", label: "⌕ Explore Ideas" },
  { href: "/saved", label: "♡ Saved Ideas" },
  { href: "/profile", label: "♙ Profile" },
];

export default function Sidebar({ onNewIdea }) {
  const path = usePathname();
  const router = useRouter();
  const { logout, showToast } = useApp();
  return (
    <aside className="w-[245px] max-md:w-[75px] bg-[#0d0f11] border-r border-ink-line p-4 max-md:p-2.5 fixed inset-y-0 left-0 z-10">
      <Link href="/dashboard" className="inline-block font-black tracking-wide text-lg max-md:text-[0px]">
        <span className="max-md:text-xl">🚀</span>
        <span className="max-md:hidden"> IDEA<span className="text-brand">LAUNCH</span></span>
      </Link>
      <nav className="grid gap-2 mt-11" aria-label="Main navigation">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`px-3.5 py-3 rounded-[9px] text-neutral-400 transition-all duration-300 hover:translate-x-1 max-md:text-center max-md:text-[0px] max-md:[&::first-letter]:text-xl ${
              path === l.href ? "bg-brand text-white shadow-glow" : "hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="max-md:text-xl">{l.label.slice(0, 2)}</span>
            <span className="max-md:hidden">{l.label.slice(2)}</span>
            <span className="md:hidden">{l.label}</span>
          </Link>
        ))}
        <button
          onClick={onNewIdea}
          className="px-3.5 py-3 rounded-[9px] border border-dashed border-brand text-brand-light text-left transition-all hover:bg-brand/10 max-md:text-center"
        >
          ＋ <span className="max-md:hidden">New Idea</span>
        </button>
        <button
          onClick={() => { logout(); showToast("Logged out"); router.replace("/"); }}
          className="px-3.5 py-3 rounded-[9px] text-left text-brand-light mt-5 transition-all hover:translate-x-1 hover:bg-brand/10 max-md:text-center"
        >
          ↪ <span className="max-md:hidden">Logout</span>
        </button>
      </nav>
    </aside>
  );
}
