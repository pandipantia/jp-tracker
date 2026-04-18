import { useState, useEffect } from "react";

const APPS_KEY = "jp_apps_v2";
const SESSIONS_KEY = "jp_sessions_v2";

const ACCENT_COLORS = [
  { label: "Rose", value: "#f2545b" },
  { label: "Orange", value: "#f97316" },
  { label: "Jaune", value: "#eab308" },
  { label: "Vert", value: "#22c55e" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Bleu", value: "#3b82f6" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Rose vif", value: "#ec4899" },
];

const DEFAULT_APPS = [
  { id: "lingodeer", name: "LingoDeer", color: "#22c55e", icon: "🦌" },
  { id: "wagotabi", name: "WAgotabi", color: "#3b82f6", icon: "📚" },
];

const EMOJI_LIST = ["📖","🎌","🔊","✏️","🎵","🃏","📝","🎮","🌸","⛩️","🗾","🈶","🔤","🎯","🧠","💬","🎧","📱"];
const DAY_LABELS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
const MONTH_FR = { "01":"Janvier","02":"Février","03":"Mars","04":"Avril","05":"Mai","06":"Juin","07":"Juillet","08":"Août","09":"Septembre","10":"Octobre","11":"Novembre","12":"Décembre" };
const MONTH_SHORT = { "01":"Jan","02":"Fév","03":"Mar","04":"Avr","05":"Mai","06":"Jun","07":"Jul","08":"Aoû","09":"Sep","10":"Oct","11":"Nov","12":"Déc" };

function load(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function today() { return new Date().toISOString().split("T")[0]; }
function getWeekKey(date) { const d = new Date(date); d.setHours(0,0,0,0); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return d.toISOString().split("T")[0]; }
function getMonthKey(date) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function getWeekDays(wk) { const days=[]; const s=new Date(wk); for(let i=0;i<7;i++){const d=new Date(s);d.setDate(s.getDate()+i);days.push(d.toISOString().split("T")[0]);} return days; }
function fmt(min) { if(!min) return "—"; const h=Math.floor(min/60),m=min%60; return h===0?`${m}min`:m===0?`${h}h`:`${h}h${m}`; }
function fmtLong(min) { if(!min) return "0 min"; const h=Math.floor(min/60),m=min%60; return h===0?`${m} min`:m===0?`${h}h 00`:`${h}h ${String(m).padStart(2,"0")}`; }
function fmtDate(str) { return new Date(str).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}); }
function getLast8Weeks() { const w=[]; const n=new Date(); for(let i=7;i>=0;i--){const d=new Date(n);d.setDate(n.getDate()-i*7);w.push(getWeekKey(d.toISOString().split("T")[0]));} return [...new Set(w)]; }
function getLast6Months() { const m=[]; const n=new Date(); for(let i=5;i>=0;i--){const d=new Date(n.getFullYear(),n.getMonth()-i,1);m.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);} return m; }

function Tag({ color, children }) {
  return <span style={{ background: color + "18", color, borderRadius: 4, padding: "1px 8px", fontSize: 12, fontWeight: 600, letterSpacing: 0.2 }}>{children}</span>;
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ background: "#f1f1ef", borderRadius: 4, height: 6, overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, pct))}%`, background: color, borderRadius: 4, transition: "width 0.4s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

export default function App() {
  const [apps, setApps] = useState(() => load(APPS_KEY, DEFAULT_APPS));
  const [sessions, setSessions] = useState(() => load(SESSIONS_KEY, {}));
  const [view, setView] = useState("journal");
  const [showAddApp, setShowAddApp] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📖");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [logDate, setLogDate] = useState(today());
  const [editing, setEditing] = useState({});
  const [toast, setToast] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(getWeekKey(today()));
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(today()));

  useEffect(() => { save(APPS_KEY, apps); }, [apps]);
  useEffect(() => { save(SESSIONS_KEY, sessions); }, [sessions]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2000); }

  function addApp() {
    if (!newName.trim()) return;
    setApps(p => [...p, { id: Date.now().toString(), name: newName.trim(), color: newColor, icon: newIcon }]);
    setNewName(""); setNewIcon("📖"); setNewColor("#3b82f6");
    setShowAddApp(false);
    showToast(`« ${newName.trim()} » ajoutée ✓`);
  }

  function removeApp(id) { setApps(p => p.filter(a => a.id !== id)); showToast("Application supprimée"); }
  function getMin(appId, date) { return sessions[date]?.[appId] || 0; }

  function saveSession(appId, date, raw) {
    const v = parseInt(raw, 10);
    const min = isNaN(v) || v < 0 ? 0 : v;
    setSessions(p => ({ ...p, [date]: { ...(p[date] || {}), [appId]: min } }));
    setEditing(p => { const n = {...p}; delete n[appId]; return n; });
    showToast("Enregistré ✓");
  }

  function totalDate(d) { return Object.values(sessions[d] || {}).reduce((a,b) => a+b, 0); }
  function totalAppWeek(id, wk) { return getWeekDays(wk).reduce((s,d) => s + getMin(id, d), 0); }
  function totalAppMonth(id, mk) { return Object.keys(sessions).filter(d => getMonthKey(d) === mk).reduce((s,d) => s + (sessions[d]?.[id] || 0), 0); }
  function totalWeek(wk) { return apps.reduce((s,a) => s + totalAppWeek(a.id, wk), 0); }
  function totalMonth(mk) { return apps.reduce((s,a) => s + totalAppMonth(a.id, mk), 0); }
  function doReset() { setSessions({}); setShowReset(false); showToast("Données réinitialisées"); }

  const weeks8 = getLast8Weeks();
  const months6 = getLast6Months();
  const maxWeek = Math.max(1, ...weeks8.map(w => totalWeek(w)));
  const maxMonth = Math.max(1, ...months6.map(m => totalMonth(m)));
  const weekDays = getWeekDays(selectedWeek);
  const maxDay = Math.max(1, ...weekDays.map(d => totalDate(d)));

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#1a1a1a" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #e9e9e7", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 18, paddingBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#f2545b,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🇯🇵</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3, lineHeight: 1.1 }}>Révisions japonais</div>
              <div style={{ fontSize: 11, color: "#9b9b98", fontWeight: 500 }}>Suivi personnel · JLPT N5 2026</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={S.btnGhost} onClick={() => setShowReset(true)} title="Réinitialiser les données">🗑</button>
            <button style={S.btnDark} onClick={() => setShowAddApp(true)}>+ Appli</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 2, marginBottom: -1 }}>
          {[{ k:"journal", label:"📅  Journal" },{ k:"semaine", label:"📊  Semaine" },{ k:"mois", label:"🗓  Mois" }].map(({k,label}) => (
            <button key={k} onClick={() => setView(k)} style={{ background:"none", border:"none", borderBottom: view===k?"2px solid #1a1a1a":"2px solid transparent", padding:"7px 14px 10px", fontSize:13, fontWeight:view===k?600:400, color:view===k?"#1a1a1a":"#9b9b98", cursor:"pointer", fontFamily:"inherit", letterSpacing:0.1 }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px" }}>

        {/* ── JOURNAL ── */}
        {view === "journal" && <>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <button style={S.btnGhost} onClick={() => { const d=new Date(logDate);d.setDate(d.getDate()-1);setLogDate(d.toISOString().split("T")[0]); }}>‹</button>
            <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} max={today()} style={{ flex:1, border:"1px solid #e9e9e7", borderRadius:6, padding:"6px 10px", fontFamily:"inherit", fontSize:13, color:"#1a1a1a", background:"#fff", outline:"none" }} />
            <button style={S.btnGhost} onClick={() => { const d=new Date(logDate);d.setDate(d.getDate()+1);const n=d.toISOString().split("T")[0];if(n<=today())setLogDate(n); }}>›</button>
            {logDate===today() && <Tag color="#f97316">Aujourd'hui</Tag>}
          </div>
          <div style={S.callout}>
            <span style={S.calloutLabel}>Total du jour</span>
            <span style={S.calloutValue}>{fmtLong(totalDate(logDate))}</span>
          </div>
          {apps.length === 0 && <div style={{ textAlign:"center", color:"#c7c7c5", padding:"40px 0", fontSize:13 }}>Aucune application — cliquez sur <strong>+ Appli</strong> pour commencer.</div>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:14 }}>
            {apps.map(app => {
              const cur = getMin(app.id, logDate);
              const val = editing[app.id] ?? (cur || "");
              return (
                <div key={app.id} style={{ ...S.appCard, borderLeft:`3px solid ${app.color}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:18 }}>{app.icon}</span>
                      <span style={{ fontWeight:600, fontSize:13, lineHeight:1.1 }}>{app.name}</span>
                    </div>
                    <button onClick={() => removeApp(app.id)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:15,color:"#c7c7c5",padding:"0 2px",lineHeight:1 }}>×</button>
                  </div>
                  {cur > 0 && <div style={{ marginBottom:8 }}><Tag color={app.color}>{fmt(cur)}</Tag></div>}
                  <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                    <input
                      type="number" min="0" placeholder="0"
                      value={val}
                      onChange={e => setEditing(p => ({...p,[app.id]:e.target.value}))}
                      onKeyDown={e => e.key==="Enter" && saveSession(app.id, logDate, String(val))}
                      style={{ flex:1, border:"1px solid #e9e9e7", borderRadius:6, padding:"5px 6px", fontFamily:"inherit", fontSize:13, textAlign:"center", outline:"none", color:"#1a1a1a", minWidth:0 }}
                    />
                    <span style={{ color:"#9b9b98", fontSize:12, flexShrink:0 }}>min</span>
                    <button style={{ ...S.btnSave, background:app.color, flexShrink:0 }} onClick={() => saveSession(app.id, logDate, String(val))}>OK</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>}

        {/* ── SEMAINE ── */}
        {view === "semaine" && <>
          <div style={S.navRow}>
            <button style={S.btnGhost} onClick={() => { const i=weeks8.indexOf(selectedWeek);if(i>0)setSelectedWeek(weeks8[i-1]); }}>‹</button>
            <span style={{ fontWeight:600, fontSize:14 }}>Semaine du {fmtDate(selectedWeek)}</span>
            <button style={S.btnGhost} onClick={() => { const i=weeks8.indexOf(selectedWeek);if(i<weeks8.length-1)setSelectedWeek(weeks8[i+1]); }}>›</button>
          </div>
          <div style={S.callout}>
            <span style={S.calloutLabel}>Total semaine</span>
            <span style={S.calloutValue}>{fmtLong(totalWeek(selectedWeek))}</span>
          </div>
          <div style={S.section}>
            <div style={S.sectionTitle}>Répartition par jour</div>
            <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:80, marginTop:8 }}>
              {weekDays.map((d,i) => {
                const t = totalDate(d);
                const pct = (t/maxDay)*100;
                const isToday = d===today();
                return (
                  <div key={d} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                    <div style={{ fontSize:9, color:"#9b9b98" }}>{fmt(t)}</div>
                    <div style={{ flex:1, width:"100%", display:"flex", alignItems:"flex-end" }}>
                      <div style={{ width:"100%", borderRadius:"4px 4px 0 0", height:`${Math.max(4,pct)}%`, background:isToday?"#f2545b":"#e9e9e7", transition:"height 0.4s" }} />
                    </div>
                    <div style={{ fontSize:10, fontWeight:isToday?700:400, color:isToday?"#f2545b":"#9b9b98" }}>{DAY_LABELS[i]}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={S.section}>
            <div style={S.sectionTitle}>Par application</div>
            {apps.map(app => {
              const min = totalAppWeek(app.id, selectedWeek);
              const pct = (min/Math.max(1,totalWeek(selectedWeek)))*100;
              return (
                <div key={app.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:15 }}>{app.icon}</span>
                  <span style={{ fontSize:13, fontWeight:600, width:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{app.name}</span>
                  <ProgressBar pct={pct} color={app.color} />
                  <span style={{ fontSize:12, fontWeight:700, color:app.color, minWidth:44, textAlign:"right" }}>{fmt(min)}</span>
                </div>
              );
            })}
          </div>
          <div style={S.section}>
            <div style={S.sectionTitle}>Tendance — 8 semaines</div>
            <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:56, marginTop:8 }}>
              {weeks8.map((w,i) => {
                const t = totalWeek(w);
                const pct = (t/maxWeek)*100;
                const active = w===selectedWeek;
                return (
                  <div key={w} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer" }} onClick={() => setSelectedWeek(w)}>
                    <div style={{ flex:1, width:"100%", display:"flex", alignItems:"flex-end" }}>
                      <div style={{ width:"100%", borderRadius:"3px 3px 0 0", height:`${Math.max(4,pct)}%`, background:active?"#8b5cf6":"#e9e9e7", transition:"all 0.3s" }} />
                    </div>
                    <div style={{ fontSize:9, fontWeight:active?700:400, color:active?"#8b5cf6":"#c7c7c5" }}>S{i+1}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>}

        {/* ── MOIS ── */}
        {view === "mois" && <>
          <div style={S.navRow}>
            <button style={S.btnGhost} onClick={() => { const i=months6.indexOf(selectedMonth);if(i>0)setSelectedMonth(months6[i-1]); }}>‹</button>
            <span style={{ fontWeight:600, fontSize:14 }}>{MONTH_FR[selectedMonth.split("-")[1]]} {selectedMonth.split("-")[0]}</span>
            <button style={S.btnGhost} onClick={() => { const i=months6.indexOf(selectedMonth);if(i<months6.length-1)setSelectedMonth(months6[i+1]); }}>›</button>
          </div>
          <div style={S.callout}>
            <span style={S.calloutLabel}>Total du mois</span>
            <span style={S.calloutValue}>{fmtLong(totalMonth(selectedMonth))}</span>
          </div>
          <div style={S.section}>
            <div style={S.sectionTitle}>Par application</div>
            {apps.map(app => {
              const min = totalAppMonth(app.id, selectedMonth);
              const pct = (min/Math.max(1,totalMonth(selectedMonth)))*100;
              return (
                <div key={app.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:15 }}>{app.icon}</span>
                  <span style={{ fontSize:13, fontWeight:600, width:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{app.name}</span>
                  <ProgressBar pct={pct} color={app.color} />
                  <span style={{ fontSize:12, fontWeight:700, color:app.color, minWidth:44, textAlign:"right" }}>{fmt(min)}</span>
                </div>
              );
            })}
          </div>
          <div style={S.section}>
            <div style={S.sectionTitle}>Par semaine</div>
            {weeks8.filter(w => getWeekDays(w).some(d => getMonthKey(d)===selectedMonth)).map(w => {
              const t = totalWeek(w);
              const pct = (t/maxWeek)*100;
              return (
                <div key={w} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:12, color:"#9b9b98", width:60, flexShrink:0 }}>{fmtDate(w)}</span>
                  <ProgressBar pct={pct} color="#06b6d4" />
                  <span style={{ fontSize:12, fontWeight:700, color:"#06b6d4", minWidth:44, textAlign:"right" }}>{fmt(t)}</span>
                </div>
              );
            })}
          </div>
          <div style={S.section}>
            <div style={S.sectionTitle}>Tendance — 6 mois</div>
            <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:56, marginTop:8 }}>
              {months6.map(m => {
                const t = totalMonth(m);
                const pct = (t/maxMonth)*100;
                const active = m===selectedMonth;
                return (
                  <div key={m} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer" }} onClick={() => setSelectedMonth(m)}>
                    <div style={{ flex:1, width:"100%", display:"flex", alignItems:"flex-end" }}>
                      <div style={{ width:"100%", borderRadius:"3px 3px 0 0", height:`${Math.max(4,pct)}%`, background:active?"#f2545b":"#e9e9e7", transition:"all 0.3s" }} />
                    </div>
                    <div style={{ fontSize:9, fontWeight:active?700:400, color:active?"#f2545b":"#c7c7c5" }}>{MONTH_SHORT[m.split("-")[1]]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>}
      </div>

      {/* Modal ajout appli */}
      {showAddApp && (
        <div style={S.overlay} onClick={() => setShowAddApp(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>Ajouter une application</div>
            <label style={S.fieldLabel}>Nom</label>
            <input autoFocus style={S.textInput} placeholder="Ex: Anki" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key==="Enter" && addApp()} />
            <label style={S.fieldLabel}>Icône</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
              {EMOJI_LIST.map(ico => (
                <button key={ico} onClick={() => setNewIcon(ico)} style={{ background:newIcon===ico?"#f1f1ef":"transparent", border:newIcon===ico?"1.5px solid #1a1a1a":"1.5px solid transparent", borderRadius:6, fontSize:17, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>{ico}</button>
              ))}
            </div>
            <label style={S.fieldLabel}>Couleur</label>
            <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:18 }}>
              {ACCENT_COLORS.map(c => (
                <button key={c.value} onClick={() => setNewColor(c.value)} title={c.label} style={{ width:26, height:26, borderRadius:"50%", background:c.value, border:newColor===c.value?"3px solid #1a1a1a":"3px solid transparent", cursor:"pointer", outline:newColor===c.value?`2px solid ${c.value}`:"none", outlineOffset:2 }} />
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={{ ...S.btnGhost, flex:1, padding:"8px 0", justifyContent:"center" }} onClick={() => setShowAddApp(false)}>Annuler</button>
              <button style={{ flex:1, padding:"8px 0", background:newColor, color:"#fff", border:"none", borderRadius:6, fontFamily:"inherit", fontWeight:700, fontSize:13, cursor:"pointer" }} onClick={addApp}>Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal reset */}
      {showReset && (
        <div style={S.overlay} onClick={() => setShowReset(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>Réinitialiser les données ?</div>
            <div style={{ fontSize:13, color:"#9b9b98", marginBottom:20, lineHeight:1.6 }}>Toutes les sessions seront supprimées définitivement. Les applications resteront.</div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={{ ...S.btnGhost, flex:1, padding:"8px 0", justifyContent:"center" }} onClick={() => setShowReset(false)}>Annuler</button>
              <button style={{ flex:1, padding:"8px 0", background:"#f2545b", color:"#fff", border:"none", borderRadius:6, fontFamily:"inherit", fontWeight:700, fontSize:13, cursor:"pointer" }} onClick={doReset}>Réinitialiser</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)", background:"#1a1a1a", color:"#fff", padding:"8px 18px", borderRadius:8, fontSize:13, fontWeight:500, zIndex:300, pointerEvents:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.15)", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

const S = {
  btnDark: { background:"#1a1a1a", color:"#fff", border:"none", borderRadius:6, padding:"6px 14px", fontSize:13, fontFamily:"inherit", cursor:"pointer", fontWeight:600 },
  btnGhost: { background:"transparent", border:"1px solid #e9e9e7", color:"#1a1a1a", borderRadius:6, padding:"5px 10px", fontSize:13, fontFamily:"inherit", cursor:"pointer", display:"flex", alignItems:"center", gap:4 },
  btnSave: { color:"#fff", border:"none", borderRadius:6, padding:"5px 10px", fontSize:12, fontFamily:"inherit", cursor:"pointer", fontWeight:700 },
  appCard: { background:"#ffffff", border:"1px solid #e9e9e7", borderRadius:10, padding:"12px 12px 10px" },
  callout: { background:"#f9f9f7", border:"1px solid #e9e9e7", borderRadius:8, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 },
  calloutLabel: { fontSize:12, color:"#9b9b98", fontWeight:600, letterSpacing:0.5, textTransform:"uppercase" },
  calloutValue: { fontWeight:700, fontSize:22, letterSpacing:-0.5 },
  section: { border:"1px solid #e9e9e7", borderRadius:10, padding:"14px 14px 8px", marginBottom:12 },
  sectionTitle: { fontSize:11, fontWeight:700, color:"#9b9b98", letterSpacing:0.8, textTransform:"uppercase", marginBottom:4 },
  navRow: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, gap:8 },
  overlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.3)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
  modal: { background:"#fff", borderRadius:12, padding:"20px 20px 18px", width:"100%", maxWidth:360, boxShadow:"0 8px 40px rgba(0,0,0,0.15)" },
  fieldLabel: { display:"block", fontSize:11, fontWeight:700, color:"#9b9b98", letterSpacing:0.6, textTransform:"uppercase", marginBottom:6 },
  textInput: { width:"100%", padding:"7px 10px", border:"1px solid #e9e9e7", borderRadius:6, fontFamily:"inherit", fontSize:13, color:"#1a1a1a", marginBottom:14, boxSizing:"border-box", outline:"none" },
};
