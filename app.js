let DID_RECORDS = [];
let activeCategory = "all";
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]));
const prettyCategory = value => String(value || "Other").replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());

function recordSearchText(record) {
  return [record.term, record.display_name, record.category, ...(record.aliases || []), ...(record.themes || []), record.summary].join(" ").toLowerCase();
}

function detectRecords(text) {
  const lower = text.toLowerCase();
  return DID_RECORDS.map(record => {
    const terms = [record.term, ...(record.aliases || [])].filter(Boolean).sort((a,b) => b.length-a.length);
    const matched = terms.find(term => lower.includes(String(term).toLowerCase()));
    return matched ? {...record, matched_term: matched} : null;
  }).filter(Boolean).sort((a,b) => String(b.matched_term).length - String(a.matched_term).length).slice(0, 12);
}

function buildInterpretation(text, emotion, context, wakeFeeling, recurring) {
  const matches = detectRecords(text);
  const themes = [...new Set(matches.flatMap(record => record.themes || []))].slice(0, 8);
  const symbolHTML = matches.length
    ? matches.map(record => `<li><strong>${escapeHTML(record.display_name || record.term)}:</strong> ${escapeHTML(record.summary)}${record.source_count ? ` <span class="source-count">${record.source_count} source${record.source_count === 1 ? "" : "s"}</span>` : ""}</li>`).join("")
    : "<li>No exact database term matched. Focus on the most vivid image, action, person, place, and emotion, then search those separately in the Dream Interpretation Database.</li>";
  const prompts = [...new Set(matches.flatMap(record => record.prompts || []))].slice(0, 5);
  const promptHTML = (prompts.length ? prompts : ["What felt most vivid?", "Where in waking life do you feel something similar?", "What changed between the beginning and end?"]).map(p => `<li>${escapeHTML(p)}</li>`).join("");
  const contextLine = context ? `You noted this possible connection: <em>${escapeHTML(context)}</em>` : "Consider recent events, relationships, decisions, stress, or excitement that may connect with the dream.";
  const wakeLine = wakeFeeling ? `You felt <strong>${escapeHTML(wakeFeeling)}</strong> after waking. The feeling that remained may be as important as the imagery.` : "Notice the feeling that remained after waking; it can help identify what mattered most.";
  const recurringLine = recurring === "yes" ? "Because this has happened before, compare what stays the same and what changes each time." : recurring === "not-sure" ? "Watch for similar settings, emotions, or situations in future dreams." : "Even a one-time dream can echo a current concern, memory, or emotion.";
  return `<h3>Possible themes</h3><p>${themes.length ? `The matched material points toward <strong>${escapeHTML(themes.join(", "))}</strong>.` : "The strongest emotion and personal associations may provide the clearest starting point."} Your selected emotion was <strong>${escapeHTML(emotion)}</strong>.</p><h3>Dream elements noticed</h3><ul>${symbolHTML}</ul><h3>Your context</h3><p>${contextLine}</p><p>${wakeLine}</p><p>${recurringLine}</p><h3>Questions to reflect on</h3><ul>${promptHTML}</ul>`;
}

function getJournal(){try{return JSON.parse(localStorage.getItem("somneiros-journal")||"[]")}catch{return[]}}
function setJournal(entries){localStorage.setItem("somneiros-journal",JSON.stringify(entries));renderJournal()}
function renderJournal(){const entries=getJournal();$("journalList").innerHTML=entries.length?entries.map((entry,index)=>`<article class="journal-entry"><h3>${escapeHTML(entry.title||"Untitled dream")}</h3><div class="entry-meta">${new Date(entry.createdAt).toLocaleString()} • ${escapeHTML(entry.emotion)} • intensity ${escapeHTML(entry.intensity)}/5</div><p>${escapeHTML(entry.text.slice(0,240))}${entry.text.length>240?"…":""}</p><div class="entry-actions"><button data-view="${index}">View</button><button data-delete="${index}">Delete</button></div></article>`).join(""):`<div class="journal-entry"><p>No dreams saved yet.</p></div>`}

$("dreamForm").addEventListener("submit", event => {
  event.preventDefault();
  const entry={title:$("dreamTitle").value.trim()||"Untitled dream",text:$("dreamText").value.trim(),emotion:$("emotion").value,intensity:$("intensity").value,context:$("lifeContext").value.trim(),wakeFeeling:$("wakeFeeling").value.trim(),recurring:$("recurring").value,createdAt:new Date().toISOString()};
  $("resultTitle").textContent=entry.title;$("resultBody").innerHTML=buildInterpretation(entry.text,entry.emotion,entry.context,entry.wakeFeeling,entry.recurring);$("resultCard").hidden=false;$("resultCard").scrollIntoView({behavior:"smooth",block:"start"});
  if($("saveDream").checked){const entries=getJournal();entries.unshift(entry);setJournal(entries.slice(0,250))}
});
$("journalList").addEventListener("click",event=>{const entries=getJournal();if(event.target.dataset.view!==undefined){const entry=entries[Number(event.target.dataset.view)];$("resultTitle").textContent=entry.title;$("resultBody").innerHTML=buildInterpretation(entry.text,entry.emotion,entry.context||"",entry.wakeFeeling||"",entry.recurring||"no");$("resultCard").hidden=false;$("resultCard").scrollIntoView({behavior:"smooth",block:"start"})}if(event.target.dataset.delete!==undefined){entries.splice(Number(event.target.dataset.delete),1);setJournal(entries)}});
$("exportButton").onclick=()=>{const blob=new Blob([JSON.stringify(getJournal(),null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),anchor=document.createElement("a");anchor.href=url;anchor.download="somneiros-dream-journal.json";anchor.click();URL.revokeObjectURL(url)};
$("clearButton").onclick=()=>{if(confirm("Delete all locally saved dreams?"))setJournal([])};

function renderCategoryFilters(){const categories=[...new Set(DID_RECORDS.map(r=>r.category).filter(Boolean))].sort();$("categoryFilters").innerHTML=["all",...categories].map(category=>`<button class="category-chip ${category===activeCategory?"active":""}" data-category="${escapeHTML(category)}">${category==="all"?"All":prettyCategory(category)}</button>`).join("");}
function renderSymbols(query="") {
  const term=query.toLowerCase().trim();
  const filtered=DID_RECORDS.filter(record=>(activeCategory==="all"||record.category===activeCategory)&&(!term||recordSearchText(record).includes(term))).slice(0,180);
  $("symbolGrid").innerHTML=filtered.map(record=>`<article class="symbol-card"><div class="symbol-header"><h3>${escapeHTML(record.display_name||record.term)}</h3><span class="category-label">${escapeHTML(prettyCategory(record.category))}</span></div><span class="eyebrow">${escapeHTML((record.themes||[]).join(" • "))}</span><p>${escapeHTML(record.summary)}</p><details><summary>Questions to consider</summary><ul>${(record.prompts||[]).map(p=>`<li>${escapeHTML(p)}</li>`).join("")}</ul>${record.safety_notes?.length?`<p class="record-caution">${escapeHTML(record.safety_notes[0])}</p>`:""}</details></article>`).join("")||"<p>No matching dream element was found. Try a broader word or a related action, feeling, person, place, or object.</p>";
  $("didStats").textContent=`${DID_RECORDS.length.toLocaleString()} dream elements across ${new Set(DID_RECORDS.map(r=>r.category)).size} categories${filtered.length<DID_RECORDS.length?` • showing ${filtered.length.toLocaleString()}`:""}`;
}
$("symbolSearch").addEventListener("input",event=>renderSymbols(event.target.value));
$("categoryFilters").addEventListener("click",event=>{const button=event.target.closest("[data-category]");if(!button)return;activeCategory=button.dataset.category;renderCategoryFilters();renderSymbols($("symbolSearch").value)});

async function loadDID(){try{const response=await fetch("data/did_app.json?v=5",{cache:"no-store"});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();DID_RECORDS=Array.isArray(data)?data:(data.records||[]);renderCategoryFilters();renderSymbols();}catch(error){$("didStats").textContent="The dream database could not be loaded. Refresh the page and try again.";$("symbolGrid").innerHTML="";console.error("DID error:",error)}}

const drawer=$("drawer"),scrim=$("scrim");function toggleDrawer(open){drawer.classList.toggle("open",open);drawer.setAttribute("aria-hidden",String(!open));scrim.hidden=!open}$("menuButton").onclick=()=>toggleDrawer(true);$("closeDrawer").onclick=()=>toggleDrawer(false);scrim.onclick=()=>toggleDrawer(false);drawer.querySelectorAll("a").forEach(link=>link.onclick=()=>toggleDrawer(false));
const savedTheme=localStorage.getItem("somneiros-theme");if(savedTheme)document.documentElement.dataset.theme=savedTheme;$("themeButton").onclick=()=>{const next=document.documentElement.dataset.theme==="light"?"dark":"light";document.documentElement.dataset.theme=next;localStorage.setItem("somneiros-theme",next)};
let deferredPrompt;window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredPrompt=event;$("installButton").hidden=false});$("installButton").onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installButton").hidden=true};

let learningData=null;async function loadLearningData(){try{const response=await fetch("data/understanding_dreams.json?v=5",{cache:"no-store"});if(!response.ok)throw new Error(`HTTP ${response.status}`);learningData=await response.json();renderLearning("what_are_dreams");$("learningStatus").hidden=true}catch(error){$("learningStatus").textContent="The dream-learning articles could not be loaded. Refresh the page and try again.";console.error("Learning error:",error)}}
function renderLearning(section){if(!learningData)return;const entries=learningData[section]||[];$("learningGrid").innerHTML=entries.map(item=>{const body=item.summary||item.claim||"";const detail=item.status?`<p><strong>Evidence status:</strong> ${escapeHTML(item.status)}</p>`:"";const evidence=item.evidence||item.note||"";const source=item.source_url?`<a class="source-link" href="${escapeHTML(item.source_url)}" target="_blank" rel="noopener">Review source</a>`:"";return `<article class="learning-card"><img src="${escapeHTML(item.image)}" alt=""><div class="learning-card-content"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(body)}</p>${detail}${evidence?`<span class="evidence-label">${escapeHTML(evidence)}</span>`:""}${source}</div></article>`}).join("")}
document.querySelectorAll(".learning-tab").forEach(button=>button.addEventListener("click",()=>{document.querySelectorAll(".learning-tab").forEach(tab=>tab.classList.remove("active"));button.classList.add("active");renderLearning(button.dataset.learning)}));

if("serviceWorker" in navigator){let reloading=false;navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!reloading){reloading=true;window.location.reload()}});window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"}).then(reg=>reg.update()).catch(console.error))}
renderJournal();loadDID();loadLearningData();