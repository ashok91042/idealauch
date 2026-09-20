"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_IDEAS } from "./ideas";
import { api, setToken } from "./api";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const read = (k, fb) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fb;
  } catch { return fb; }
};

const write = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
};

/* Backend on/off: NEXT_PUBLIC_API_URL="" forces offline mode. */
const API_FORCED_OFF =
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL === "";

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [customIdeas, setCustomIdeas] = useState([]);
  const [serverIdeas, setServerIdeas] = useState(null);
  const [saved, setSaved] = useState([]);
  const [serverSaved, setServerSaved] = useState(null);
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);
  const [backend, setBackend] = useState(false);

  const showToast = (msg) => setToast(msg);

  useEffect(() => {
    try {
      const u = sessionStorage.getItem("ideaUser");
      if (u) setUser(JSON.parse(u));
    } catch {}
    setCustomIdeas(read("ideaCustom", []));
    setSaved(read("ideaSaved", []));
    setReady(true);
    if (!API_FORCED_OFF) {
      api("/health").then(async () => {
        setBackend(true);
        // Backend is authoritative: drop anonymous/local-only data so
        // everything shown matches the database.
        try { localStorage.removeItem("ideaSaved"); } catch {}
        try { localStorage.removeItem("ideaCustom"); } catch {}
        setSaved([]);
        try {
          const { ideas } = await api("/ideas?sort=title");
          setServerIdeas(ideas);
        } catch {}
        try {
          const me = await api("/auth/me").catch(() => null);
          if (me?.user) {
            setUser(me.user);
            try { sessionStorage.setItem("ideaUser", JSON.stringify(me.user)); } catch {}
            const { ids } = await api("/saved");
            setServerSaved(ids);
            setSaved(ids);
          }
        } catch {}
      }).catch(() => setBackend(false));
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const login = (name, email) => {
    const u = { name, email };
    setUser(u);
    try { sessionStorage.setItem("ideaUser", JSON.stringify(u)); } catch {}
  };
  const logout = () => {
    setUser(null);
    setToken(null);
    setServerSaved(null);
    setSaved([]);            // clear stale saved list from previous account
    setServerIdeas(null);
    try { sessionStorage.removeItem("ideaUser"); } catch {}
  };

  const getUsers = () => read("ideaUsers", []);
  const registerUser = ({ name, email, pass }) => {
    const users = getUsers();
    users.push({ name, email, pass: btoa(pass) });
    write("ideaUsers", users);
  };
  const findUser = (email) =>
    getUsers().find((u) => u.email.toLowerCase() === String(email).toLowerCase());

  const signinBackend = async (email, password) => {
    const data = await api("/auth/signin", { method: "POST", body: { email, password } });
    setToken(data.token);
    setUser(data.user);
    try { sessionStorage.setItem("ideaUser", JSON.stringify(data.user)); } catch {}
    try {
      const { ids } = await api("/saved");
      setServerSaved(ids);
      setSaved(ids);
    } catch {}
    try {
      const { ideas } = await api("/ideas?sort=title");
      setServerIdeas(ideas);
    } catch {}
    // Signed in: the database is the single source of truth now.
    try { localStorage.removeItem("ideaSaved"); } catch {}
    try { localStorage.removeItem("ideaCustom"); } catch {}
    return data;
  };
  const signupBackend = async (name, email, password) => {
    const data = await api("/auth/signup", { method: "POST", body: { name, email, password } });
    setToken(data.token);
    setUser(data.user);
    try { sessionStorage.setItem("ideaUser", JSON.stringify(data.user)); } catch {}
    // Fresh account: sync everything from the database (new users have an
    // empty saved list) and drop stale anonymous/local-only data.
    try {
      const { ids } = await api("/saved");
      setServerSaved(ids);
      setSaved(ids);
    } catch {}
    try {
      const { ideas } = await api("/ideas?sort=title");
      setServerIdeas(ideas);
    } catch {}
    try { localStorage.removeItem("ideaSaved"); } catch {}
    try { localStorage.removeItem("ideaCustom"); } catch {}
    return data;
  };
  const updateProfileBackend = async (name, email) => {
    const data = await api("/auth/profile", { method: "PUT", body: { name, email } });
    if (data.token) setToken(data.token);
    setUser(data.user);
    try { sessionStorage.setItem("ideaUser", JSON.stringify(data.user)); } catch {}
    return data.user;
  };

  const seedIds = useMemo(() => new Set(DEFAULT_IDEAS.map((i) => String(i.id))), []);
  const allIdeas = useMemo(() => {
    if (serverIdeas) return serverIdeas;
    return [...customIdeas, ...DEFAULT_IDEAS];
  }, [serverIdeas, customIdeas]);

  const refreshIdeas = async () => {
    if (!backend) return;
    try {
      const { ideas } = await api("/ideas?sort=title");
      setServerIdeas(ideas);
    } catch {}
  };

  const addIdea = async (idea) => {
    if (backend && !user) throw new Error("Sign up first to publish your idea.");
    if (backend && user) {
      const { idea: created } = await api("/ideas", { method: "POST", body: idea });
      setServerIdeas((prev) => (prev ? [created, ...prev] : prev));
      return created;
    }
    const next = [idea, ...customIdeas];
    setCustomIdeas(next);
    write("ideaCustom", next);
    return idea;
  };
  const deleteIdea = async (id) => {
    if (backend && user) {
      await api(`/ideas/${id}`, { method: "DELETE" });
      setServerIdeas((prev) => (prev ? prev.filter((i) => String(i.id) !== String(id)) : prev));
      // remove from saved list locally + on server (no toggle — that would re-add it)
      const next = (serverSaved ?? saved).filter((x) => String(x) !== String(id));
      setServerSaved(next);
      setSaved(next);
      return;
    }
    const next = customIdeas.filter((i) => String(i.id) !== String(id));
    setCustomIdeas(next);
    write("ideaCustom", next);
    const nextSaved = saved.filter((x) => String(x) !== String(id));
    setSaved(nextSaved);
    write("ideaSaved", nextSaved);
  };

  const toggleSave = async (id, forceRemove = false) => {
    if (backend && !user) throw new Error("Sign up first to save ideas.");
    if (backend && user) {
      if (forceRemove) {
        const ids = (serverSaved ?? saved).map(String);
        if (ids.includes(String(id))) await api(`/saved/${id}`, { method: "POST" });
        const next = (serverSaved ?? saved).filter((x) => String(x) !== String(id));
        setServerSaved(next);
        setSaved(next);
        return false;
      }
      const { saved: isSaved, ids } = await api(`/saved/${id}`, { method: "POST" });
      setServerSaved(ids);
      setSaved(ids);
      if (isSaved) api(`/ideas/${id}/like`, { method: "POST" }).catch(() => {});
      return isSaved;
    }
    let result = false;
    setSaved((prev) => {
      const has = prev.includes(id);
      const next = forceRemove || has ? prev.filter((x) => x !== id) : [...prev, id];
      result = !has && !forceRemove;
      write("ideaSaved", next);
      return next;
    });
    return result;
  };

  const value = {
    user, login, logout, getUsers, registerUser, findUser,
    signinBackend, signupBackend, updateProfileBackend,
    customIdeas, allIdeas, addIdea, deleteIdea, refreshIdeas,
    saved, toggleSave, setSaved, toast, showToast, ready,
    backend, seedIds,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
