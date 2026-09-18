const defaultIdeas = [
 {id:1,title:"AI Study Buddy",category:"EdTech",icon:"🤖",likes:124,desc:"An AI-powered personal study assistant that helps students learn faster with custom notes, quizzes and doubt solving.",problem:"Students struggle with managing study materials and getting instant help.",solution:"A personalized AI assistant for notes, quizzes and 24/7 doubt solving.",features:["AI based Q&A","Personalized study plans","Progress tracking","Multi-subject support"]},
 {id:2,title:"EcoSwap",category:"Green Tech",icon:"🌱",likes:98,desc:"A platform to buy, sell and swap used items locally.",problem:"Useful products are often discarded while others search for affordable alternatives.",solution:"A trusted local marketplace for exchanging reusable products.",features:["Local discovery","Simple listings","Eco impact tracking","Secure profiles"]},
 {id:3,title:"MediTrack",category:"HealthTech",icon:"❤️",likes:76,desc:"Track health data and get personalized insights.",problem:"People have health information spread across multiple apps and devices.",solution:"One simple dashboard for tracking habits and personal health metrics.",features:["Health dashboard","Reminders","Trend insights","Data export"]},
 {id:4,title:"SkillShare",category:"EdTech",icon:"⭐",likes:64,desc:"Learn and teach skills with a global community.",problem:"Learners struggle to find practical peer-to-peer learning.",solution:"A community marketplace connecting people who want to learn and teach.",features:["Skill profiles","Peer sessions","Ratings","Learning paths"]},
 {id:5,title:"FarmConnect",category:"AgriTech",icon:"🌾",likes:59,desc:"Connect farmers directly with buyers.",problem:"Farmers may lose margin through long distribution chains.",solution:"A direct discovery and communication platform for producers and buyers.",features:["Direct discovery","Price visibility","Buyer profiles","Order requests"]},
 {id:6,title:"QuickCart",category:"E-commerce",icon:"🛒",likes:51,desc:"A hyperlocal delivery platform for daily needs.",problem:"Customers want convenient access to nearby essentials.",solution:"Fast local shopping with neighborhood stores and delivery partners.",features:["Nearby stores","Quick ordering","Order tracking","Digital receipts"]},
 {id:7,title:"FinPilot",category:"FinTech",icon:"💳",likes:88,desc:"A personal finance planning companion for young professionals.",problem:"Budgeting can feel complex and inconsistent.",solution:"A simple planning workspace for goals, budgets and spending insights.",features:["Goal planning","Budget tools","Spending insights","Reminders"]},
 {id:8,title:"CodeGuard",category:"AI & ML",icon:"🛡️",likes:91,desc:"An educational code quality assistant for developers.",problem:"Beginners need understandable feedback when learning to code.",solution:"Clear explanations of common code-quality issues and improvements.",features:["Code hints","Readable feedback","Learning tips","Project checks"]}
];

const ideas = defaultIdeas;
const getCustomIdeas = () => { try { return JSON.parse(localStorage.getItem("ideaCustom") || "[]"); } catch { return []; } };
const setCustomIdeas = list => localStorage.setItem("ideaCustom", JSON.stringify(list));
const getAllIdeas = () => [...getCustomIdeas(), ...defaultIdeas];

const getSaved = () => { try { return JSON.parse(localStorage.getItem("ideaSaved") || "[]"); } catch { return []; } };
const setSaved = ids => localStorage.setItem("ideaSaved", JSON.stringify(ids));

function currentUser(){ try { return JSON.parse(sessionStorage.getItem("ideaUser") || "null"); } catch { return null; } }

function protectPage(){
  if(document.body.dataset.protected !== undefined && !currentUser()){
    window.location.href = "index.html";
    return false;
  }
  return true;
}

function showToast(msg){
  document.querySelectorAll(".toast").forEach(t => t.remove());
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function updateUserUI(){
  const user = currentUser();
  if(!user) return;
  document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = user.name);
  document.querySelectorAll("[data-user-email]").forEach(el => el.textContent = user.email);
  const all = getAllIdeas();
  const saved = getSaved().length;
  const cats = new Set(all.map(i => i.category)).size;
  document.querySelectorAll("#savedCount,#profileSaved").forEach(el => el.textContent = saved);
  const dashStats = document.querySelectorAll(".stats-grid .stat strong");
  if(dashStats.length >= 3 && document.querySelector("#savedCount")){
    dashStats[0].textContent = all.length;
    dashStats[1].textContent = saved;
    dashStats[2].textContent = cats;
  }
  const avatar = document.querySelector(".avatar");
  if(avatar && user.name) avatar.textContent = user.name.charAt(0).toUpperCase();
}

function getUsers(){ try { return JSON.parse(localStorage.getItem("ideaUsers") || "[]"); } catch { return []; } }
function saveUsers(list){ localStorage.setItem("ideaUsers", JSON.stringify(list)); }
function findUser(email){ return getUsers().find(u => u.email.toLowerCase() === String(email).toLowerCase()); }

function setupLogin(){
  // ---- Tab switching ----
  const tabs = document.querySelectorAll(".auth-tab");
  const signinPanel = document.querySelector("#panel-signin");
  const signupPanel = document.querySelector("#panel-signup");
  const tabsBox = document.querySelector(".auth-tabs");
  const showTab = (name) => {
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
    if(tabsBox) tabsBox.classList.toggle("signup-on", name === "signup");
    if(signinPanel) signinPanel.hidden = name !== "signin";
    if(signupPanel) signupPanel.hidden = name !== "signup";
  };
  tabs.forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));
  document.querySelectorAll("[data-goto]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); showTab(a.dataset.goto); }));
  if(new URLSearchParams(location.search).get("mode") === "signup") showTab("signup");

  // ---- Show/hide password ----
  document.querySelectorAll("[data-toggle-pass]").forEach(btn => btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.togglePass);
    if(!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.textContent = show ? "🙈" : "👁";
  }));

  // ---- Password strength ----
  const suPass = document.querySelector("#su-password");
  const bar = document.querySelector("#strengthBar");
  if(suPass && bar) suPass.addEventListener("input", () => {
    const v = suPass.value;
    let score = 0;
    if(v.length >= 6) score++;
    if(v.length >= 10) score++;
    if(/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if(/\d/.test(v)) score++;
    if(/[^A-Za-z0-9]/.test(v)) score++;
    const pct = Math.min(100, score * 20);
    bar.style.width = pct + "%";
    bar.style.background = pct < 40 ? "#ff3038" : pct < 70 ? "#ff9f2e" : "#2ecc71";
  });

  // ---- SIGN UP ----
  const suForm = document.querySelector("#signupForm");
  if(suForm) suForm.addEventListener("submit", event => {
    event.preventDefault();
    const name = document.querySelector("#su-name").value.trim();
    const email = document.querySelector("#su-email").value.trim();
    const pass = document.querySelector("#su-password").value;
    const confirm = document.querySelector("#su-confirm").value;
    document.querySelector("#suNameError").textContent = name.length >= 2 ? "" : "Please enter your name.";
    document.querySelector("#suEmailError").textContent = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? "" : "Enter a valid email address.";
    document.querySelector("#suPassError").textContent = pass.length >= 6 ? "" : "Password must be at least 6 characters.";
    document.querySelector("#suConfirmError").textContent = pass === confirm && confirm ? "" : "Passwords do not match.";
    if(name.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || pass.length < 6 || pass !== confirm) return;
    if(findUser(email)){ document.querySelector("#suEmailError").textContent = "Account already exists. Please sign in."; showTab("signin"); return; }
    const users = getUsers();
    const displayName = name.replace(/\b\w/g, c => c.toUpperCase());
    users.push({name: displayName, email, pass: btoa(pass)});
    saveUsers(users);
    sessionStorage.setItem("ideaUser", JSON.stringify({name: displayName, email}));
    showToast("Account created — welcome, " + displayName + "!");
    setTimeout(() => window.location.href = "dashboard.html", 600);
  });

  // ---- SIGN IN ----
  const form = document.querySelector("#loginForm");
  if(!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const email = document.querySelector("#email");
    const password = document.querySelector("#password");
    const emailError = document.querySelector("#emailError");
    const passwordError = document.querySelector("#passwordError");
    emailError.textContent = "";
    passwordError.textContent = "";
    let valid = true;

    if(!email.value || !email.validity.valid){
      emailError.textContent = "Enter a valid email address.";
      valid = false;
    }
    if(password.value.length < 6){
      passwordError.textContent = "Password must contain at least 6 characters.";
      valid = false;
    }
    if(!valid) return;

    const mail = email.value.trim();
    const existing = findUser(mail);
    if(existing){
      if(existing.pass !== btoa(password.value)){
        passwordError.textContent = "Incorrect password for this account.";
        return;
      }
      sessionStorage.setItem("ideaUser", JSON.stringify({name: existing.name, email: existing.email}));
    } else {
      const raw = mail.split("@")[0].replace(/[._-]+/g," ").trim() || "Innovator";
      const displayName = raw.replace(/\b\w/g, c => c.toUpperCase());
      const users = getUsers();
      users.push({name: displayName, email: mail, pass: btoa(password.value)});
      saveUsers(users);
      sessionStorage.setItem("ideaUser", JSON.stringify({name: displayName, email: mail}));
    }
    showToast("Welcome back!");
    const remember = document.querySelector("#rememberMe");
    if(remember && !remember.checked) sessionStorage.setItem("ideaSessionOnly", "1");
    else sessionStorage.removeItem("ideaSessionOnly");
    setTimeout(() => window.location.href = "dashboard.html", 400);
  });

  const guest = document.querySelector("#guestBtn");
  if(guest) guest.addEventListener("click", () => {
    sessionStorage.setItem("ideaUser", JSON.stringify({name: "Guest Explorer", email: "guest@idealaunch.io"}));
    window.location.href = "dashboard.html";
  });
  const forgot = document.querySelector("#forgotLink");
  if(forgot) forgot.addEventListener("click", e => {
    e.preventDefault();
    const mail = (document.querySelector("#email") || {}).value || "";
    const u = mail && findUser(mail.trim());
    showToast(u ? "Hint: your password is saved on this device — try again." : "Sign up first, or use Guest access.");
  });
}

function escapeHtml(str){
  return String(str ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function ideaCard(idea){
  const saved = getSaved().includes(idea.id);
  return `<article class="idea-card">
    <div class="idea-icon" aria-hidden="true">${escapeHtml(idea.icon || "💡")}</div>
    <div><span class="tag">${escapeHtml(idea.category)}</span>${idea.mine ? `<span class="author-badge">YOUR IDEA</span>` : ""}</div>
    <h3>${escapeHtml(idea.title)}</h3>
    <p>${escapeHtml(idea.desc)}</p>
    <div class="card-actions">
      <button class="heart" data-save="${idea.id}" aria-label="${saved ? "Remove from saved" : "Save idea"}">${saved ? "♥" : "♡"} ${idea.likes}</button>
      <span style="display:flex;gap:8px"><a class="view" href="details.html?id=${idea.id}">View</a>${idea.mine ? `<button class="view" data-delete="${idea.id}">Delete</button>` : ""}</span>
    </div>
  </article>`;
}

function renderExplore(){
  const grid = document.querySelector("#ideaGrid");
  if(!grid) return;
  const categorySelect = document.querySelector("#categoryFilter");
  const searchEl = document.querySelector("#searchInput");
  const sortEl = document.querySelector("#sortFilter");
  const buildCats = (keep) => {
    const cats = [...new Set(getAllIdeas().map(i => i.category))].sort();
    categorySelect.innerHTML = `<option value="All">All Categories</option>` + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    if(cats.includes(keep) || keep === "All") categorySelect.value = keep;
  };
  buildCats("All");

  const params = new URLSearchParams(location.search);
  if(params.get("category")) categorySelect.value = params.get("category");
  if(params.get("category") && ![...categorySelect.options].some(o => o.value === params.get("category"))){
    categorySelect.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(params.get("category"))}">${escapeHtml(params.get("category"))}</option>`);
    categorySelect.value = params.get("category");
  }
  searchEl.value = params.get("q") || "";

  const render = () => {
    const query = searchEl.value.toLowerCase().trim();
    const category = categorySelect.value;
    const sort = sortEl.value;
    let result = getAllIdeas().filter(idea => {
      const matchesText = `${idea.title} ${idea.category} ${idea.desc}`.toLowerCase().includes(query);
      return matchesText && (category === "All" || idea.category === category);
    });
    result = result.sort((a,b) => sort === "likes" ? b.likes-a.likes : a.title.localeCompare(b.title));
    grid.innerHTML = result.length ? result.map(ideaCard).join("") : `<p class="empty">No ideas found. Try another search or category.<br><br><button class="btn primary" data-new-idea>+ Submit Your Idea</button></p>`;
    bindCardButtons();
  };
  ["input","change"].forEach(type => {
    searchEl.addEventListener(type, render);
    categorySelect.addEventListener(type, render);
    sortEl.addEventListener(type, render);
  });
  render();
}

function bindCardButtons(){
  document.querySelectorAll("[data-save]").forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.save);
      let saved = getSaved();
      const adding = !saved.includes(id);
      saved = adding ? [...saved, id] : saved.filter(item => item !== id);
      setSaved(saved);
    if(document.querySelector("#ideaGrid")) renderExplore();
    if(document.querySelector("#savedGrid")) renderSaved();
    if(document.querySelector("#ideaDetails")) renderDetails();
    updateUserUI();
    showToast(adding ? "Saved to your collection ♥" : "Removed from saved");
    };
  });
  document.querySelectorAll("[data-delete]").forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.delete);
      if(!confirm("Delete this idea permanently?")) return;
      setCustomIdeas(getCustomIdeas().filter(i => i.id !== id));
      setSaved(getSaved().filter(s => s !== id));
      if(document.querySelector("#ideaGrid")) renderExplore();
      if(document.querySelector("#savedGrid")) renderSaved();
      updateUserUI();
      showToast("Idea deleted");
    };
  });
  document.querySelectorAll("[data-new-idea]").forEach(btn => {
    btn.onclick = (e) => { e.preventDefault(); openNewIdeaModal(); };
  });
}

function renderSaved(){
  const grid = document.querySelector("#savedGrid");
  if(!grid) return;
  const savedIdeas = getAllIdeas().filter(idea => getSaved().includes(idea.id));
  grid.innerHTML = savedIdeas.length ? savedIdeas.map(ideaCard).join("") : `<p class="empty">No saved ideas yet. <a href="explore.html" style="color:#ff4c53">Explore ideas →</a></p>`;
  bindCardButtons();
}

function renderDetails(){
  const box = document.querySelector("#ideaDetails");
  if(!box) return;
  const id = Number(new URLSearchParams(location.search).get("id")) || (getAllIdeas()[0] && getAllIdeas()[0].id) || 1;
  const idea = getAllIdeas().find(item => item.id === id) || getAllIdeas()[0];
  if(!idea){ box.innerHTML = `<p class="empty">Idea not found.</p>`; return; }
  const saved = getSaved().includes(idea.id);
  box.innerHTML = `<div class="details-head">
    <div class="details-icon" aria-hidden="true">${escapeHtml(idea.icon || "💡")}</div>
    <div><span class="tag">${escapeHtml(idea.category)}</span>${idea.mine ? `<span class="author-badge">YOUR IDEA</span>` : ""}<h1>${escapeHtml(idea.title)}</h1><p>${escapeHtml(idea.desc)}</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
      <button class="btn primary" data-save="${idea.id}">${saved ? "♥ Saved" : "♡ Save Idea"}</button>
      <button class="btn outline" data-share="${idea.id}">⤴ Share</button>
      ${idea.mine ? `<button class="btn outline" data-delete="${idea.id}">Delete</button>` : ""}
    </div></div>
  </div>
  <div class="detail-sections">
    <section class="detail-box"><h2>📌 Problem Statement</h2><p>${escapeHtml(idea.problem || "A real user problem worth solving.")}</p></section>
    <section class="detail-box"><h2>💡 Solution</h2><p>${escapeHtml(idea.solution || idea.desc)}</p></section>
    <section class="detail-box"><h2>✨ Key Features</h2><ul>${(idea.features||[]).map(f => `<li>${escapeHtml(f)}</li>`).join("")}</ul></section>
    <section class="detail-box"><h2>🚀 Potential Impact</h2><p>Can create a useful, scalable product around a real-world user problem.${idea.author ? ` Submitted by ${escapeHtml(idea.author)}.` : ""}</p></section>
  </div>`;
  bindCardButtons();
  document.querySelectorAll("[data-share]").forEach(btn => {
    btn.onclick = async () => {
      const url = location.href;
      const text = `Check out this startup idea: ${idea.title}`;
      if(navigator.share){ try { await navigator.share({title: idea.title, text, url}); } catch {} }
      else if(navigator.clipboard){ await navigator.clipboard.writeText(`${text} - ${url}`); showToast("Link copied to clipboard!"); }
      else { prompt("Copy this link:", url); }
    };
  });
}

function setupHeaderSearch(){
  const form = document.querySelector("#headerSearch");
  if(!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const q = document.querySelector("#headerSearchInput").value.trim();
    window.location.href = `explore.html?q=${encodeURIComponent(q)}`;
  });
}

function setupEditProfile(){
  const btn = document.querySelector("#editProfile");
  if(!btn) return;
  btn.addEventListener("click", () => {
    const user = currentUser() || {name:"Innovator", email:"user@example.com"};
    const name = prompt("Enter your display name:", user.name);
    if(name === null) return;
    const email = prompt("Enter your email:", user.email);
    if(email === null) return;
    if(!name.trim()){ showToast("Name cannot be empty"); return; }
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())){ showToast("Enter a valid email"); return; }
    sessionStorage.setItem("ideaUser", JSON.stringify({name: name.trim(), email: email.trim()}));
    updateUserUI();
    showToast("Profile updated ✓");
  });
}

function setupLogout(){
  document.querySelectorAll("[data-logout]").forEach(btn => btn.addEventListener("click", () => {
    sessionStorage.removeItem("ideaUser");
    window.location.href = "index.html";
  }));
}

const CATEGORY_SUGGESTIONS = ["AI & ML","EdTech","FinTech","HealthTech","Green Tech","E-commerce","AgriTech","Other"];
const ICON_CHOICES = ["💡","🤖","🌱","❤️","⭐","🌾","🛒","💳","🛡️","🚀","📱","🎓"];

function openNewIdeaModal(){
  if(!currentUser()){ window.location.href = "index.html"; return; }
  document.querySelectorAll(".modal-overlay").forEach(m => m.remove());
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><h2>Submit a <span style="color:#ff3038">New Idea</span> 🚀</h2><p>Share your startup concept. It appears instantly in Explore.</p><form id="newIdeaForm" novalidate><label>Idea Title *</label><input id="ni-title" placeholder="e.g. AI Fitness Coach" maxlength="60"><small class="error" id="ni-title-err"></small><div class="form-row"><div><label>Category *</label><select id="ni-category">${CATEGORY_SUGGESTIONS.map(c => `<option>${c}</option>`).join("")}</select></div><div><label>Icon</label><select id="ni-icon">${ICON_CHOICES.map(i => `<option>${i}</option>`).join("")}</select></div></div><label>Short Description * (min 10 chars)</label><textarea id="ni-desc" placeholder="What does your idea do?" maxlength="220"></textarea><small class="error" id="ni-desc-err"></small><label>Problem Statement *</label><textarea id="ni-problem" placeholder="What problem does it solve?"></textarea><label>Solution *</label><textarea id="ni-solution" placeholder="How does it solve it?"></textarea><label>Key Features (comma separated)</label><input id="ni-features" placeholder="e.g. Live tracking, AI tips"><div class="modal-actions"><button type="button" class="btn outline" id="ni-cancel">Cancel</button><button type="submit" class="btn primary">Publish Idea</button></div></form></div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#ni-title").focus();
  overlay.addEventListener("click", e => { if(e.target === overlay) overlay.remove(); });
  document.addEventListener("keydown", function esc(e){ if(e.key === "Escape"){ overlay.remove(); } });
  overlay.querySelector("#ni-cancel").onclick = () => overlay.remove();
  overlay.querySelector("#newIdeaForm").addEventListener("submit", e => {
    e.preventDefault();
    const title = overlay.querySelector("#ni-title").value.trim();
    const category = overlay.querySelector("#ni-category").value;
    const icon = overlay.querySelector("#ni-icon").value;
    const desc = overlay.querySelector("#ni-desc").value.trim();
    const problem = overlay.querySelector("#ni-problem").value.trim();
    const solution = overlay.querySelector("#ni-solution").value.trim();
    const rawFeatures = overlay.querySelector("#ni-features").value.trim();
    let ok = true;
    overlay.querySelector("#ni-title-err").textContent = title.length >= 3 ? "" : "Title needs at least 3 characters.";
    if(title.length < 3) ok = false;
    overlay.querySelector("#ni-desc-err").textContent = desc.length >= 10 ? "" : "Description needs at least 10 characters.";
    if(desc.length < 10) ok = false;
    if(!problem || !solution){ showToast("Please fill problem & solution"); ok = false; }
    if(!ok) return;
    const user = currentUser();
    const newIdea = { id: Date.now(), title, category, icon, desc, problem, solution, features: rawFeatures ? rawFeatures.split(",").map(s => s.trim()).filter(Boolean).slice(0,6) : ["MVP ready concept","User focused","Scalable"], likes: 0, mine: true, author: user ? user.name : "You", createdAt: new Date().toISOString() };
    const list = getCustomIdeas();
    list.unshift(newIdea);
    setCustomIdeas(list);
    overlay.remove();
    updateUserUI();
    if(document.querySelector("#ideaGrid")) renderExplore();
    showToast("Idea published!");
    if(!document.querySelector("#ideaGrid")) window.location.href = `explore.html?q=${encodeURIComponent(title)}`;
  });
}

function setupNewIdeaTriggers(){
  document.querySelectorAll("[data-new-idea]").forEach(btn => {
    btn.onclick = e => { e.preventDefault(); openNewIdeaModal(); };
  });
}

function ensureNewIdeaButtons(){
  document.querySelectorAll(".topbar").forEach(bar => {
    if(bar.querySelector("[data-new-idea]")) return;
    let actions = bar.querySelector(".topbar-actions");
    if(!actions){
      actions = document.createElement("div");
      actions.className = "topbar-actions";
      const chip = bar.querySelector(".user-chip");
      if(chip){ bar.insertBefore(actions, chip); actions.appendChild(chip); }
      else bar.appendChild(actions);
    }
    const btn = document.createElement("button");
    btn.className = "btn primary btn-new";
    btn.setAttribute("data-new-idea", "");
    btn.textContent = "+ New Idea";
    const chip = actions.querySelector(".user-chip");
    if(chip) actions.insertBefore(btn, chip);
    else actions.appendChild(btn);
  });
}


document.addEventListener("DOMContentLoaded", () => {
  if(!protectPage()) return;
  setupLogin();
  ensureNewIdeaButtons();
  setupNewIdeaTriggers();
  setupHeaderSearch();
  setupLogout();
  setupEditProfile();
  updateUserUI();
  renderExplore();
  renderSaved();
  renderDetails();
});