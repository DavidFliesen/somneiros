const SYMBOLS = [
  {symbol:"Water",themes:["emotion","change","depth"],meaning:"Often reflects emotional life, uncertainty, cleansing, or movement through change."},
  {symbol:"House",themes:["self","memory","identity"],meaning:"May represent the dreamer, the mind, family life, or different parts of the self."},
  {symbol:"Flying",themes:["freedom","control","escape"],meaning:"Can suggest liberation, confidence, ambition, avoidance, or a wish to rise above pressure."},
  {symbol:"Teeth",themes:["confidence","loss","communication"],meaning:"Frequently linked with vulnerability, self-image, speech, transition, or fear of losing control."},
  {symbol:"Snake",themes:["change","danger","healing"],meaning:"May indicate threat, transformation, instinct, renewal, or concealed knowledge."},
  {symbol:"Road",themes:["direction","choice","journey"],meaning:"Often relates to life direction, decisions, progress, delay, or uncertainty about what comes next."},
  {symbol:"Storm",themes:["conflict","release","overwhelm"],meaning:"Can represent emotional turbulence, mounting pressure, disruption, or an approaching release."},
  {symbol:"Door",themes:["opportunity","boundary","transition"],meaning:"May suggest access, exclusion, new possibilities, guarded feelings, or movement into a new phase."},
  {symbol:"Animal",themes:["instinct","relationship","trait"],meaning:"Often reflects instinctive qualities, emotional bonds, fears, or traits associated with that animal."}
];

const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));

function detectSymbols(text) {
  const lower = text.toLowerCase();
  return SYMBOLS.filter(symbol => lower.includes(symbol.symbol.toLowerCase()));
}

function interpretDream(text, emotion, context, wakeFeeling, recurring) {
  const matches = detectSymbols(text);
  const themes = [...new Set(matches.flatMap(item => item.themes))];
  const symbols = matches.length
    ? matches.map(item => `<li><strong>${escapeHTML(item.symbol)}:</strong> ${escapeHTML(item.meaning)}</li>`).join("")
    : "<li>No exact starter symbol matched. Focus on the most emotionally charged image and what it means in your own life.</li>";
  const contextText = context
    ? `You noted this possible waking-life connection: <em>${escapeHTML(context)}</em>`
    : "Consider whether recent events, relationships, decisions, stress, or excitement connect with the dream.";
  const wakeText = wakeFeeling
    ? `You felt <strong>${escapeHTML(wakeFeeling)}</strong> after waking. That reaction can be as informative as the dream images.`
    : "Notice the feeling that remained after waking; it may help identify what mattered most.";
  const recurringText = recurring === "yes"
    ? "Because this dream has happened before, compare what stays the same and what changes each time."
    : recurring === "not-sure"
      ? "Watch for similar settings, emotions, or situations in future dreams."
      : "Even a one-time dream can echo a current concern, memory, or emotion.";

  return `<h3>Possible themes</h3>
    <p>This dream may touch on <strong>${escapeHTML(themes.slice(0,5).join(", ") || "identity, transition, emotion, and personal meaning")}</strong>. The strongest emotion was <strong>${escapeHTML(emotion)}</strong>, which may matter more than a universal symbol definition.</p>
    <h3>Symbols noticed</h3><ul>${symbols}</ul>
    <h3>Your context</h3><p>${contextText}</p><p>${wakeText}</p><p>${recurringText}</p>
    <h3>Questions to reflect on</h3><ul><li>What felt most vivid?</li><li>Where in waking life do you feel a similar emotion?</li><li>Did you gain or lose control?</li><li>What changed from beginning to end?</li></ul>`;
}

function getJournal() {
  try { return JSON.parse(localStorage.getItem("somneiros-journal") || "[]"); }
  catch { return []; }
}
function setJournal(entries) {
  localStorage.setItem("somneiros-journal", JSON.stringify(entries));
  renderJournal();
}
function renderJournal() {
  const entries = getJournal();
  $("journalList").innerHTML = entries.length
    ? entries.map((entry,index) => `<article class="journal-entry"><h3>${escapeHTML(entry.title || "Untitled dream")}</h3><div class="entry-meta">${new Date(entry.createdAt).toLocaleString()} • ${escapeHTML(entry.emotion)} • intensity ${escapeHTML(entry.intensity)}/5</div><p>${escapeHTML(entry.text.slice(0,240))}${entry.text.length > 240 ? "…" : ""}</p><div class="entry-actions"><button data-view="${index}">View</button><button data-delete="${index}">Delete</button></div></article>`).join("")
    : `<div class="journal-entry"><p>No dreams saved yet.</p></div>`;
}

$("dreamForm").addEventListener("submit", event => {
  event.preventDefault();
  const entry = {
    title: $("dreamTitle").value.trim() || "Untitled dream",
    text: $("dreamText").value.trim(),
    emotion: $("emotion").value,
    intensity: $("intensity").value,
    context: $("lifeContext").value.trim(),
    wakeFeeling: $("wakeFeeling").value.trim(),
    recurring: $("recurring").value,
    createdAt: new Date().toISOString()
  };
  $("resultTitle").textContent = entry.title;
  $("resultBody").innerHTML = interpretDream(entry.text, entry.emotion, entry.context, entry.wakeFeeling, entry.recurring);
  $("resultCard").hidden = false;
  $("resultCard").scrollIntoView({behavior:"smooth", block:"start"});
  if ($("saveDream").checked) {
    const entries = getJournal();
    entries.unshift(entry);
    setJournal(entries.slice(0,100));
  }
});

$("journalList").addEventListener("click", event => {
  const entries = getJournal();
  if (event.target.dataset.view !== undefined) {
    const entry = entries[Number(event.target.dataset.view)];
    if (!entry) return;
    $("resultTitle").textContent = entry.title;
    $("resultBody").innerHTML = interpretDream(entry.text, entry.emotion, entry.context || "", entry.wakeFeeling || "", entry.recurring || "no");
    $("resultCard").hidden = false;
    $("resultCard").scrollIntoView({behavior:"smooth", block:"start"});
  }
  if (event.target.dataset.delete !== undefined) {
    entries.splice(Number(event.target.dataset.delete),1);
    setJournal(entries);
  }
});

$("exportButton").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(getJournal(), null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "somneiros-dream-journal.json";
  anchor.click();
  URL.revokeObjectURL(url);
});
$("clearButton").addEventListener("click", () => { if (confirm("Delete all locally saved dreams?")) setJournal([]); });

function renderSymbols(query = "") {
  const term = query.toLowerCase();
  const filtered = SYMBOLS.filter(item => item.symbol.toLowerCase().includes(term) || item.themes.join(" ").includes(term) || item.meaning.toLowerCase().includes(term));
  $("symbolGrid").innerHTML = filtered.map(item => `<article class="symbol-card"><h3>${escapeHTML(item.symbol)}</h3><span class="eyebrow">${escapeHTML(item.themes.join(" • "))}</span><p>${escapeHTML(item.meaning)}</p></article>`).join("") || "<p>No matching starter symbol.</p>";
}
$("symbolSearch").addEventListener("input", event => renderSymbols(event.target.value));

const drawer = $("drawer");
const scrim = $("scrim");
function toggleDrawer(open) {
  drawer.classList.toggle("open", open);
  drawer.setAttribute("aria-hidden", String(!open));
  scrim.hidden = !open;
}
$("menuButton").addEventListener("click", () => toggleDrawer(true));
$("closeDrawer").addEventListener("click", () => toggleDrawer(false));
scrim.addEventListener("click", () => toggleDrawer(false));
drawer.querySelectorAll("a").forEach(link => link.addEventListener("click", () => toggleDrawer(false)));

const savedTheme = localStorage.getItem("somneiros-theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
$("themeButton").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("somneiros-theme", next);
});

let installPrompt;
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installPrompt = event; $("installButton").hidden = false; });
$("installButton").addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $("installButton").hidden = true;
});

let learningData = null;
async function loadLearningData() {
  const status = $("learningStatus");
  try {
    const response = await fetch("data/understanding_dreams.json?v=3", {cache:"no-store"});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    learningData = await response.json();
    status.hidden = true;
    renderLearning("what_are_dreams");
  } catch (error) {
    status.textContent = "The learning library could not be loaded. Refresh the page after the latest site update finishes deploying.";
    console.error("Learning library error:", error);
  }
}
function renderLearning(section) {
  if (!learningData) return;
  const entries = learningData[section] || [];
  $("learningGrid").innerHTML = entries.map(item => {
    const body = item.summary || item.claim || "";
    const status = item.status ? `<p><strong>Evidence status:</strong> ${escapeHTML(item.status)}</p>` : "";
    const evidence = item.evidence || item.note || "";
    const source = item.source_url ? `<a class="source-link" href="${escapeHTML(item.source_url)}" target="_blank" rel="noopener">Review source</a>` : "";
    return `<article class="learning-card"><img src="${escapeHTML(item.image)}" alt="Illustration for ${escapeHTML(item.title)}" loading="lazy"><div class="learning-card-content"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(body)}</p>${status}${evidence ? `<span class="evidence-label">${escapeHTML(evidence)}</span>` : ""}${source}</div></article>`;
  }).join("") || "<p>No articles are available in this category yet.</p>";
}
document.querySelectorAll(".learning-tab").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".learning-tab").forEach(tab => tab.classList.remove("active"));
  button.classList.add("active");
  renderLearning(button.dataset.learning);
}));

async function loadComparison() {
  try {
    const response = await fetch("data/competitor_comparison.json?v=3", {cache:"no-store"});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();
    $("comparisonGrid").innerHTML = rows.map(row => `<article class="comparison-card"><h3>${escapeHTML(row.app)}</h3><span class="eyebrow">${escapeHTML(row.platforms)}</span><p><strong>Current strengths</strong></p><ul>${row.strengths.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul><p><strong>Somneiros opportunity</strong></p><p>${escapeHTML(row.somneiros_opportunity)}</p></article>`).join("");
  } catch (error) {
    $("comparisonGrid").innerHTML = "<p>The comparison information could not be loaded.</p>";
    console.error("Comparison error:", error);
  }
}

if ("serviceWorker" in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!reloading) { reloading = true; window.location.reload(); }
  });
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js", {updateViaCache:"none"}).then(registration => registration.update()).catch(console.error));
}

renderJournal();
renderSymbols();
loadLearningData();
loadComparison();
