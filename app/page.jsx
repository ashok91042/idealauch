"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
export default function LoginPage() {
  const { user, backend, signinBackend, signupBackend, login, registerUser, findUser, showToast } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errs, setErrs] = useState({});
  const [name, setName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suErrs, setSuErrs] = useState({});
  useEffect(() => { if (user) router.replace("/dashboard"); }, [user, router]);
  const cap = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

  const signin = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e2.email = "Enter valid email.";
    if (password.length < 6) e2.pass = "Min 6 chars.";
    setErrs(e2);
    if (Object.keys(e2).length) return;
    try {
      if (backend) {
        await signinBackend(email.trim(), password);
      } else {
        const ex = findUser(email.trim());
        if (ex && ex.pass !== btoa(password)) { setErrs({ pass: "Wrong password." }); return; }
        if (!ex) {
          const dn = cap(email.trim().split("@")[0].replace(/[._-]+/g, " ") || "Innovator");
          registerUser({ name: dn, email: email.trim(), pass: password });
          login(dn, email.trim());
        } else login(ex.name, ex.email);
      }
      showToast("Welcome back!");
    } catch (err) {
      if (err.status === 401) setErrs({ pass: err.message || "Wrong password." });
      else setErrs({ email: err.message || "Could not sign in. Is the API running?" });
    }
  };
  const signup = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (name.trim().length < 2) e2.name = "Enter name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(suEmail.trim())) e2.email = "Enter valid email.";
    if (suPass.length < 6) e2.pass = "Min 6 chars.";
    if (suPass !== suConfirm) e2.confirm = "No match.";
    setSuErrs(e2);
    if (Object.keys(e2).length) return;
    const dn = cap(name.trim());
    try {
      if (backend) {
        await signupBackend(dn, suEmail.trim(), suPass);
      } else {
        if (findUser(suEmail.trim())) { setSuErrs({ email: "Exists." }); setTab("signin"); return; }
        registerUser({ name: dn, email: suEmail.trim(), pass: suPass });
        login(dn, suEmail.trim());
      }
      showToast("Account created!");
    } catch (err) {
      if (err.status === 409) { setSuErrs({ email: "Account exists. Sign in." }); setTab("signin"); }
      else setSuErrs({ email: err.message || "Could not sign up. Is the API running?" });
    }
  };
  return (
    <div className="min-h-screen bg-[#08090b]">
      <header className="max-w-[1200px] mx-auto px-10 py-5"><span className="font-black text-lg">IDEA<span className="text-brand">LAUNCH</span></span></header>
      <main className="max-w-[1200px] mx-auto p-10 grid grid-cols-[1.2fr_.8fr] gap-14 items-center">
        <section>
          <p className="eyebrow">DISCOVER BUILD LAUNCH</p>
          <h1 className="text-6xl font-black my-6">Big Ideas<br />Start <span className="grad-text">Here.</span></h1>
          <p className="text-neutral-400">Join innovators and explore startup ideas.</p>
        </section>
        <section className="card p-8">
          <div className="grid grid-cols-2 gap-1 bg-black/40 rounded-xl p-1 mb-5">
            <button type="button" onClick={() => setTab("signin")} className={tab === "signin" ? "btn btn-primary" : "btn text-neutral-400"}>Sign In</button>
            <button type="button" onClick={() => setTab("signup")} className={tab === "signup" ? "btn btn-primary" : "btn text-neutral-400"}>Sign Up</button>
          </div>
          {tab === "signin" ? (
            <form onSubmit={signin} noValidate>
              <label className="label">Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              <small className="error">{errs.email || ""}</small>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 chars" />
              <small className="error">{errs.pass || ""}</small>
              <button className="btn btn-primary btn-full" type="submit">Sign In</button>
              <p className="text-center text-sm mt-3 text-neutral-500">No account? <button type="button" className="link" onClick={() => setTab("signup")}>Sign up</button></p>
            </form>
          ) : (
            <form onSubmit={signup} noValidate>
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              <small className="error">{suErrs.name || ""}</small>
              <label className="label">Email</label>
              <input className="input" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="you@example.com" />
              <small className="error">{suErrs.email || ""}</small>
              <label className="label">Password</label>
              <input className="input" type="password" value={suPass} onChange={(e) => setSuPass(e.target.value)} placeholder="Min 6 chars" />
              <small className="error">{suErrs.pass || ""}</small>
              <label className="label">Confirm</label>
              <input className="input" type="password" value={suConfirm} onChange={(e) => setSuConfirm(e.target.value)} placeholder="Repeat" />
              <small className="error">{suErrs.confirm || ""}</small>
              <button className="btn btn-primary btn-full" type="submit">Sign Up</button>
              <p className="text-center text-sm mt-3 text-neutral-500">Have account? <button type="button" className="link" onClick={() => setTab("signin")}>Sign in</button></p>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
