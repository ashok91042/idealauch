"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useApp } from "@/lib/store";
export default function ProfilePage() {
  const { user, ready, saved, allIdeas, login, showToast, backend, updateProfileBackend } = useApp();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [n, setN] = useState("");
  const [e, setE] = useState("");
  useEffect(() => { if (ready && !user) router.replace("/"); }, [ready, user, router]);
  useEffect(() => { if (user) { setN(user.name); setE(user.email); } }, [user]);
  if (!ready || !user) return <p className="p-10 text-neutral-500">Loading...</p>;
  const save = async () => {
    if (n.trim().length < 2) { showToast("Name too short"); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim())) { showToast("Invalid email"); return; }
    try {
      if (backend && updateProfileBackend) await updateProfileBackend(n.trim(), e.trim());
      else login(n.trim(), e.trim());
      setEditing(false);
      showToast("Profile updated ✓");
    } catch (err) {
      showToast(err.message || "Update failed");
    }
  };
  return (
    <AppShell>
      <main className="max-w-[1200px] mx-auto px-9 py-11 max-md:px-4">
        <p className="eyebrow">ACCOUNT</p>
        <h1 className="text-4xl font-extrabold">Your Profile</h1>
        <section className="card p-6 flex items-center gap-5 mt-6">
          <div className="w-[70px] h-[70px] rounded-full grid place-items-center bg-brand text-2xl font-black">{user.name.charAt(0).toUpperCase()}</div>
          <div><h2 className="font-bold text-lg">{user.name}</h2><p className="text-neutral-500">{user.email}</p></div>
          <button className="btn btn-outline ml-auto" onClick={() => setEditing(!editing)}>{editing ? "Cancel" : "Edit Profile"}</button>
        </section>
        {editing && (
          <section className="card p-6 mt-4 animate-fadeUp">
            <label className="label">Display name</label>
            <input className="input" value={n} onChange={(ev) => setN(ev.target.value)} />
            <label className="label">Email</label>
            <input className="input" value={e} onChange={(ev) => setE(ev.target.value)} />
            <button className="btn btn-primary mt-4" onClick={save}>Save Changes</button>
          </section>
        )}
        <section className="grid grid-cols-4 max-md:grid-cols-2 gap-4 my-5">
          {[[saved.length, "Saved Ideas"], [allIdeas.length, "Explored Ideas"], ["2026", "Member Since"]].map(([v, l]) => (
            <article key={l} className="card p-5"><strong className="block text-3xl text-brand">{v}</strong><span className="text-neutral-500 text-sm">{l}</span></article>
          ))}
        </section>
        <section className="card p-6">
          <h2 className="font-bold">About Me</h2>
          <p className="text-neutral-400">Passionate about technology, startups and solving real-world problems.</p>
          <h3 className="font-bold mt-4">Preferences</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {["AI & ML", "EdTech", "HealthTech", "Green Tech"].map((t) => (
              <span key={t} className="border border-[#403033] rounded-full px-3 py-1.5 text-sm transition-all hover:bg-brand/10 hover:border-brand hover:-translate-y-0.5 cursor-default">{t}</span>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
