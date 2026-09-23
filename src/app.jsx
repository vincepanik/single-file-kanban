import { useState, useRef, useEffect } from "react";

const COL_COLORS = ["#94A3B8","#E8C547","#E87B47","#E84770","#A347E8","#4770E8","#47C5E8","#47E87B"];
const CARD_COLORS = ["#E8C547","#E87B47","#E84770","#A347E8","#4770E8","#47C5E8","#47E87B","#E84747","#F08080","#90EE90"];
// Valeurs internes des priorités : STOCKÉES dans les cartes, jamais traduites.
// Seul leur libellé d'affichage change de langue (STR[lang].prio).
const PRIORITIES = ["haute","normale","basse"];
const PRIORITY_COLORS = { haute:"#E84770", normale:"#E8C547", basse:"#94A3B8" };

// ── Internationalisation ─────────────────────────────────────────────────
// Seuls les textes de l'interface sont traduits. Le contenu saisi par
// l'utilisateur (titres de cartes, colonnes renommées, tags, notes) lui
// appartient et n'est jamais réécrit lors d'un changement de langue.
const STR = {
  fr: {
    docTitle:"Mon Organisateur — kanban local",
    appTitle:"Mes Projets", countOne:"projet", countMany:"projets", saved:"Sauvegardé",
    searchPh:"Rechercher…",
    export:"Exporter", exportTitle:"Télécharger une sauvegarde JSON",
    import:"Importer", importTitle:"Restaurer depuis une sauvegarde JSON",
    langTitle:"Switch to English",
    renameCol:"Cliquer pour renommer", deleteColTitle:"Supprimer la colonne",
    hasNotes:"Contient des notes", addCard:"+ Ajouter un projet", newCol:"Nouvelle colonne",
    newCard:"Nouveau projet", editCard:"Modifier le projet",
    tabInfos:"Infos", tabNotes:"Notes",
    fTitle:"Titre", fTitlePh:"Nom du projet…",
    fType:"Type", newTagPh:"Nouveau type…", createTag:"+ Créer",
    fPriority:"Priorité", fDeadline:"Échéance", clear:"Effacer", fColor:"Couleur",
    freeNotes:"Notes libres", notesPh:"Idées, contacts, liens, prochaines étapes…",
    notesHint:"Point bleu • sur la carte = notes présentes",
    delete:"Supprimer", cancel:"Annuler", add:"Ajouter", save:"Sauvegarder",
    colName:"Nom", colNamePh:"Ex: En attente, Archivé…", create:"Créer",
    delColQ:"Supprimer la colonne ?",
    delColBody:"Tous les projets dans cette colonne seront supprimés. Cette action est irréversible.",
    delCardQ:"Supprimer ce projet ?",
    delCardBody:(title) => "\u00ab " + title + " \u00bb et ses notes seront supprimés définitivement.",
    autoBackup:"Sauvegarde auto téléchargée, garde ce fichier au chaud",
    importErr:"Fichier invalide, utilise un fichier exporté depuis cette appli.",
    dlOver:"Échéance dépassée", dlLabel:"Échéance",
    dlIn:(d) => "Échéance dans " + d + " jour" + (d > 1 ? "s" : ""),
    prio:{ haute:"haute", normale:"normale", basse:"basse" },
    locale:"fr-FR",
  },
  en: {
    docTitle:"Single File Kanban",
    appTitle:"My Board", countOne:"card", countMany:"cards", saved:"Saved",
    searchPh:"Search…",
    export:"Export", exportTitle:"Download a JSON backup",
    import:"Import", importTitle:"Restore from a JSON backup",
    langTitle:"Passer en français",
    renameCol:"Click to rename", deleteColTitle:"Delete column",
    hasNotes:"Has notes", addCard:"+ Add a card", newCol:"New column",
    newCard:"New card", editCard:"Edit card",
    tabInfos:"Info", tabNotes:"Notes",
    fTitle:"Title", fTitlePh:"Card name…",
    fType:"Tag", newTagPh:"New tag…", createTag:"+ Create",
    fPriority:"Priority", fDeadline:"Deadline", clear:"Clear", fColor:"Color",
    freeNotes:"Notes", notesPh:"Ideas, contacts, links, next steps…",
    notesHint:"A blue dot • on a card means it has notes",
    delete:"Delete", cancel:"Cancel", add:"Add", save:"Save",
    colName:"Name", colNamePh:"e.g. Waiting, Archived…", create:"Create",
    delColQ:"Delete this column?",
    delColBody:"Every card in this column will be deleted. This cannot be undone.",
    delCardQ:"Delete this card?",
    delCardBody:(title) => "\u201c" + title + "\u201d and its notes will be permanently deleted.",
    autoBackup:"Automatic backup downloaded, keep that file somewhere safe",
    importErr:"Invalid file, use a file exported from this app.",
    dlOver:"Overdue", dlLabel:"Deadline",
    dlIn:(d) => "Due in " + d + " day" + (d > 1 ? "s" : ""),
    prio:{ haute:"high", normale:"normal", basse:"low" },
    locale:"en-US",
  },
};

// Langue retenue, sinon celle du navigateur, sinon anglais.
function detectLang() {
  try {
    const saved = localStorage.getItem("organisateur_lang");
    if (saved === "fr" || saved === "en") return saved;
  } catch {}
  try {
    return String(navigator.language || "en").toLowerCase().startsWith("fr") ? "fr" : "en";
  } catch { return "en"; }
}

// Données de démonstration, semées une seule fois dans la langue détectée.
const DEMO = {
  fr: {
    tags:["Travail","Perso","Client","Tech","Design","Admin","Apprentissage","Idée"],
    cols:[
      ["idee","Idée","#94A3B8",[
        ["c1","Refaire le site perso","Perso","#A347E8","basse","Exemple de carte. Clique dessus pour la modifier ou la supprimer."],
        ["c2","Apprendre un nouvel outil","Apprentissage","#47C5E8","normale",""]]],
      ["todo","À faire","#E8C547",[
        ["c3","Préparer la réunion de lundi","Travail","#E8C547","haute","Ajoute une échéance pour voir le badge de rappel."],
        ["c4","Trier les papiers administratifs","Admin","#E84747","basse",""]]],
      ["encours","En cours","#E87B47",[
        ["c5","Maquette du nouveau logo","Design","#E87B47","haute",""],
        ["c6","Devis client","Client","#47E87B","normale",""]]],
      ["attente","En attente","#A347E8",[
        ["c7","Retour du client sur la V1","Client","#4770E8","normale",""]]],
      ["termine","Terminé","#47E87B",[
        ["c8","Sauvegarde des fichiers","Tech","#47C5E8","normale",""],
        ["c9","Inscription à la newsletter","Perso","#47E87B","basse",""]]],
    ],
  },
  en: {
    tags:["Work","Personal","Client","Tech","Design","Admin","Learning","Idea"],
    cols:[
      ["idee","Ideas","#94A3B8",[
        ["c1","Redo my personal site","Personal","#A347E8","basse","Example card. Click it to edit or delete it."],
        ["c2","Learn a new tool","Learning","#47C5E8","normale",""]]],
      ["todo","To do","#E8C547",[
        ["c3","Prep Monday's meeting","Work","#E8C547","haute","Add a deadline to see the reminder badge."],
        ["c4","Sort out the paperwork","Admin","#E84747","basse",""]]],
      ["encours","In progress","#E87B47",[
        ["c5","New logo mockup","Design","#E87B47","haute",""],
        ["c6","Client quote","Client","#47E87B","normale",""]]],
      ["attente","Waiting","#A347E8",[
        ["c7","Client feedback on v1","Client","#4770E8","normale",""]]],
      ["termine","Done","#47E87B",[
        ["c8","Back up the files","Tech","#47C5E8","normale",""],
        ["c9","Sign up to the newsletter","Personal","#47E87B","basse",""]]],
    ],
  },
};
const defaultTags = (lang) => DEMO[lang].tags.slice();
const defaultColumns = (lang) => DEMO[lang].cols.map(([id, title, color, cards]) => ({
  id, title, color,
  cards: cards.map(([cid, ctitle, tag, ccolor, priority, notes]) =>
    ({ id:cid, title:ctitle, tag, color:ccolor, priority, notes })),
}));

function loadState(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch { return fallback; }
}

// Générateur d'identifiant unique (remplace l'ancien compteur qui repartait
// à 20 à chaque rechargement et créait des ids en double → bug de duplication au drag & drop)
const uid = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Répare les données existantes : supprime les doublons exacts créés par l'ancien bug
// et ré-attribue un id unique aux cartes qui partagent le même id.
function sanitizeColumns(cols) {
  if (!Array.isArray(cols)) return cols;
  const seenIds = new Set();
  const seenExact = new Set();
  return cols.map(col => {
    const cards = [];
    (col.cards || []).forEach(card => {
      const sig = `${card.id}|${card.title}|${card.notes || ""}`;
      if (seenExact.has(sig)) return; // doublon exact → on l'écarte
      seenExact.add(sig);
      let c = card;
      if (!c.id || seenIds.has(c.id)) c = { ...c, id: uid() };
      seenIds.add(c.id);
      cards.push(c);
    });
    return { ...col, cards };
  });
}

// Infos d'affichage pour une date d'échéance (badge coloré sur la carte)
function deadlineInfo(d, t) {
  if (!d) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const date = new Date(d + "T00:00:00");
  if (isNaN(date)) return null;
  const days = Math.round((date - today) / 86400000);
  const label = date.toLocaleDateString(t.locale, { day: "numeric", month: "short" });
  if (days < 0)  return { label, color: "#E84770", title: t.dlOver };
  if (days <= 7) return { label, color: "#E87B47", title: t.dlIn(days) };
  return { label, color: "#94A3B8", title: t.dlLabel };
}

function EditableColTitle({ title, hint, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(title);
  const inputRef = useRef(null);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  const commit = () => { if (val.trim()) onSave(val.trim()); setEditing(false); };
  if (editing) return (
    <input ref={inputRef} value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key==="Enter") commit(); if (e.key==="Escape") setEditing(false); }}
      style={{
        background:"transparent", border:"none", borderBottom:"1px solid #E8C547",
        color:"#F0EDE6", fontFamily:"'Inter',sans-serif", fontWeight:700,
        fontSize:13, outline:"none", width:"100%", padding:"1px 0"
      }}
    />
  );
  return (
    <span title={hint} onClick={() => setEditing(true)}
      style={{ cursor:"text", flex:1, fontSize:13, fontWeight:700, letterSpacing:"0.02em" }}>
      {title}
    </span>
  );
}

export default function KanbanApp() {
  const [lang, setLang] = useState(detectLang);
  const t = STR[lang];
  const [columns, setColumns] = useState(() => sanitizeColumns(loadState("organisateur_columns", defaultColumns(detectLang()))));
  const [tags, setTags] = useState(() => loadState("organisateur_tags", defaultTags(detectLang())));
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title:"", tag:"", color:CARD_COLORS[0], priority:"normale", notes:"", deadline:"" });
  const [search, setSearch] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [confirmDeleteCol, setConfirmDeleteCol] = useState(null);
  const [confirmDeleteCard, setConfirmDeleteCard] = useState(null);
  const [dragOverCard, setDragOverCard] = useState(null);
  const [autoBackupToast, setAutoBackupToast] = useState(false);
  const [colModal, setColModal] = useState(null);
  const [colForm, setColForm] = useState({ title:"", color:COL_COLORS[0] });
  const [activeTab, setActiveTab] = useState("infos");
  const [savedFlash, setSavedFlash] = useState(false);
  const [importError, setImportError] = useState("");
  const importRef = useRef(null);

  // Sauvegarde auto localStorage
  useEffect(() => {
    localStorage.setItem("organisateur_columns", JSON.stringify(columns));
    localStorage.setItem("organisateur_tags", JSON.stringify(tags));
    setSavedFlash(true);
    const id = setTimeout(() => setSavedFlash(false), 1400);
    return () => clearTimeout(id);
  }, [columns, tags]);

  // Langue : retenue d'une visite à l'autre, et reportée sur le document
  useEffect(() => {
    try { localStorage.setItem("organisateur_lang", lang); } catch {}
    document.documentElement.lang = lang;
    document.title = STR[lang].docTitle;
  }, [lang]);

  // ── Export JSON ──────────────────────────────────────────────
  const handleExport = () => {
    const data = { version:1, exportedAt: new Date().toISOString(), columns, tags };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = (lang === "fr" ? "organisateur-sauvegarde-" : "kanban-backup-") + date + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Sauvegarde auto hebdomadaire ─────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem("organisateur_last_autobackup");
    // Premiere ouverture : on amorce le compteur sans declencher de telechargement
    if (!raw) { localStorage.setItem("organisateur_last_autobackup", String(Date.now())); return; }
    if (Date.now() - Number(raw) < 7 * 24 * 3600 * 1000) return;
    const id = setTimeout(() => {
      handleExport();
      localStorage.setItem("organisateur_last_autobackup", String(Date.now()));
      setAutoBackupToast(true);
      setTimeout(() => setAutoBackupToast(false), 8000);
    }, 3000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Import JSON ──────────────────────────────────────────────
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.columns || !Array.isArray(data.columns)) throw new Error("Format invalide");
        setColumns(sanitizeColumns(data.columns));
        if (data.tags && Array.isArray(data.tags)) setTags(data.tags);
        setImportError("");
      } catch {
        setImportError(t.importErr);
        setTimeout(() => setImportError(""), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── Drag & drop ──────────────────────────────────────────────
  const handleDragStart = (cardId, colId) => setDragging({ cardId, fromColId:colId });
  const handleDragOver = (e, colId) => { e.preventDefault(); setDragOver(colId); };
  // Dépôt sur une colonne (targetCardId=null → en fin de colonne)
  // ou sur une carte (targetCardId → insertion juste avant cette carte).
  const handleDrop = (e, toColId, targetCardId = null) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragging && dragging.cardId !== targetCardId) {
      setColumns(cols => {
        const card = cols.find(c => c.id===dragging.fromColId)?.cards.find(c => c.id===dragging.cardId);
        if (!card) return cols;
        // 1) retirer la carte de sa colonne d'origine
        let next = cols.map(col =>
          col.id===dragging.fromColId ? { ...col, cards:col.cards.filter(c => c.id!==dragging.cardId) } : col
        );
        // 2) l'insérer à la position visée
        next = next.map(col => {
          if (col.id!==toColId) return col;
          const cards = [...col.cards];
          const idx = targetCardId ? cards.findIndex(c => c.id===targetCardId) : -1;
          if (idx === -1) cards.push(card); else cards.splice(idx, 0, card);
          return { ...col, cards };
        });
        return next;
      });
    }
    setDragging(null); setDragOver(null); setDragOverCard(null);
  };

  const renameCol = (colId, title) => setColumns(cols => cols.map(col => col.id===colId ? {...col, title} : col));
  const deleteCol = (colId) => { setColumns(cols => cols.filter(col => col.id!==colId)); setConfirmDeleteCol(null); };
  const addColumn = () => { setColForm({ title:"", color:COL_COLORS[0] }); setColModal("add"); };
  const saveColumn = () => {
    if (!colForm.title.trim()) return;
    setColumns(cols => [...cols, { id:"col"+Date.now(), title:colForm.title.trim(), color:colForm.color, cards:[] }]);
    setColModal(null);
  };

  const openAdd = (colId) => {
    setForm({ title:"", tag:tags[0]||"", color:CARD_COLORS[0], priority:"normale", notes:"", deadline:"" });
    setActiveTab("infos"); setModal({ mode:"add", colId });
  };
  const openEdit = (card, colId) => {
    setForm({ title:card.title, tag:card.tag, color:card.color, priority:card.priority, notes:card.notes||"", deadline:card.deadline||"" });
    setActiveTab("infos"); setModal({ mode:"edit", colId, card });
  };
  const closeModal = () => { setModal(null); setNewTagInput(""); };
  const saveCard = () => {
    if (!form.title.trim()) return;
    if (modal.mode==="add") {
      setColumns(cols => cols.map(col =>
        col.id===modal.colId ? {...col, cards:[...col.cards, { id:uid(), ...form }]} : col
      ));
    } else {
      setColumns(cols => cols.map(col =>
        col.id===modal.colId ? {...col, cards:col.cards.map(c => c.id===modal.card.id ? {...c, ...form} : c)} : col
      ));
    }
    closeModal();
  };
  const deleteCard = (cardId, colId) => {
    setColumns(cols => cols.map(col => col.id===colId ? {...col, cards:col.cards.filter(c => c.id!==cardId)} : col));
    closeModal();
  };

  const addTag = () => {
    const v = newTagInput.trim();
    if (v && !tags.includes(v)) { setTags(prev => [...prev, v]); setForm(f => ({...f, tag:v})); }
    setNewTagInput("");
  };
  const deleteTag = (tag) => {
    setTags(prev => prev.filter(x => x!==tag));
    if (form.tag===tag) setForm(f => ({...f, tag:""}));
  };

  const filteredColumns = columns.map(col => ({
    ...col,
    cards: search ? col.cards.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.tag.toLowerCase().includes(search.toLowerCase()) ||
      (c.notes||"").toLowerCase().includes(search.toLowerCase())
    ) : col.cards
  }));

  const totalCards = columns.reduce((acc, col) => acc + col.cards.length, 0);

  return (
    <div style={{ minHeight:"100vh", background:"#0F0F13", color:"#F0EDE6", fontFamily:"'Inter', system-ui, sans-serif" }}>
      <style>{`
        /* Police Inter embarquee dans le <style> du document, aucune requete externe */
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:#1A1A22; }
        ::-webkit-scrollbar-thumb { background:#3A3A4A; border-radius:2px; }
        .card-item {
          background:#1A1A22; border:1px solid #2A2A35;
          border-radius:10px; padding:13px 14px; cursor:grab;
          transition:all 0.18s; position:relative; overflow:hidden;
        }
        .card-item::before {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background:var(--card-color, #E8C547);
        }
        .card-item:hover { border-color:#3A3A50; transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,0.4); }
        .col-wrapper {
          background:#14141C; border:1px solid #1E1E2A; border-radius:14px;
          width:255px; flex-shrink:0; display:flex; flex-direction:column;
          max-height:calc(100vh - 110px); transition:border-color 0.2s;
        }
        .col-wrapper.drag-over { border-color:#E8C547; background:#16161F; }
        .add-card-btn {
          background:none; border:1px dashed #2A2A40; color:#5A5A70;
          border-radius:8px; padding:8px; width:100%; cursor:pointer;
          font-family:'Inter',sans-serif; font-size:12px; transition:all 0.2s; margin-top:8px;
        }
        .add-card-btn:hover { border-color:#E8C547; color:#E8C547; }
        .modal-overlay {
          position:fixed; inset:0; background:rgba(0,0,0,0.8);
          display:flex; align-items:center; justify-content:center;
          z-index:1000; backdrop-filter:blur(5px);
        }
        .modal-box {
          background:#1A1A24; border:1px solid #2A2A38; border-radius:16px;
          width:480px; max-width:96vw; max-height:90vh;
          display:flex; flex-direction:column; overflow:hidden;
        }
        .modal-header { padding:20px 24px 0; flex-shrink:0; }
        .modal-body { padding:0 24px 20px; overflow-y:auto; flex:1; }
        .modal-footer {
          padding:14px 24px 20px; border-top:1px solid #1E1E2A;
          display:flex; gap:10px; justify-content:space-between; flex-shrink:0;
        }
        .m-input {
          background:#0F0F18; border:1px solid #2A2A38; border-radius:8px;
          padding:9px 13px; color:#F0EDE6; width:100%;
          font-family:'Inter',sans-serif; font-size:13px; outline:none; transition:border-color 0.2s;
        }
        .m-input:focus { border-color:#E8C547; }
        .notes-textarea {
          background:#0F0F18; border:1px solid #2A2A38; border-radius:10px;
          padding:14px; color:#E0DDD6; width:100%; min-height:220px;
          font-family:'Inter',sans-serif; font-size:13.5px; line-height:1.7;
          outline:none; resize:vertical; transition:border-color 0.2s;
        }
        .notes-textarea:focus { border-color:#E8C547; }
        .notes-textarea::placeholder { color:#3A3A55; }
        .save-btn {
          background:#E8C547; color:#0F0F13; border:none; border-radius:8px;
          padding:9px 20px; font-family:'Inter',sans-serif; font-size:13px;
          font-weight:600; cursor:pointer; transition:all 0.2s;
        }
        .save-btn:hover { background:#F0D060; }
        .search-input {
          background:#14141C; border:1px solid #2A2A38; border-radius:8px;
          padding:8px 13px; color:#F0EDE6; width:180px;
          font-family:'Inter',sans-serif; font-size:13px; outline:none;
        }
        .search-input:focus { border-color:#E8C547; }
        .tag-pill {
          font-family:'Inter',sans-serif; font-size:11px; font-weight:500;
          padding:2px 9px; border-radius:100px;
          background:rgba(255,255,255,0.07); color:#94A3B8;
        }
        .new-col-btn {
          background:#14141C; border:1px dashed #2A2A38; color:#3A3A55;
          border-radius:14px; width:200px; flex-shrink:0; height:60px;
          cursor:pointer; font-family:'Inter',sans-serif; font-size:13px;
          transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .new-col-btn:hover { border-color:#E8C547; color:#E8C547; }
        .icon-btn {
          background:none; border:none; cursor:pointer; color:#3A3A55;
          padding:2px 4px; border-radius:4px; font-size:14px;
          transition:color 0.15s; display:flex; align-items:center;
        }
        .icon-btn:hover { color:#E84770; }
        .mlabel {
          font-family:'Inter',sans-serif; font-size:11px; font-weight:600;
          color:#5A5A70; letter-spacing:0.08em; display:block;
          margin-bottom:6px; text-transform:uppercase;
        }
        .header-btn {
          display:flex; align-items:center; gap:6px;
          background:#1A1A24; border:1px solid #2A2A38; border-radius:8px;
          padding:7px 13px; cursor:pointer; font-family:'Inter',sans-serif;
          font-size:12px; font-weight:500; color:#94A3B8; transition:all 0.18s;
        }
        .header-btn:hover { border-color:#E8C547; color:#E8C547; }
        .header-btn.import:hover { border-color:#4770E8; color:#4770E8; }
        .error-toast {
          position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
          background:#2A0F18; border:1px solid #E84770; color:#E84770;
          border-radius:10px; padding:10px 20px; font-size:13px;
          font-family:'Inter',sans-serif; z-index:2000;
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding:"16px 24px", borderBottom:"1px solid #1A1A26",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        gap:12, flexWrap:"wrap"
      }}>
        {/* Gauche */}
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <h1 style={{ fontSize:21, fontWeight:700, letterSpacing:"-0.01em" }}>{t.appTitle}</h1>
          <span style={{ fontSize:12, color:"#5A5A70", fontWeight:500 }}>{totalCards} {totalCards > 1 ? t.countMany : t.countOne}</span>
          <span style={{
            display:"flex", alignItems:"center", gap:5,
            fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:500,
            color:"#47E87B", transition:"opacity 0.4s",
            opacity: savedFlash ? 1 : 0
          }}>
            <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="#47E87B"/></svg>
            {t.saved}
          </span>
        </div>

        {/* Droite */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button className="header-btn" onClick={() => setLang(l => l === "fr" ? "en" : "fr")}
            title={t.langTitle}
            style={{ fontWeight:600, letterSpacing:"0.04em" }}>
            {lang === "fr" ? "EN" : "FR"}
          </button>
          <input className="search-input" placeholder={t.searchPh} value={search} onChange={e => setSearch(e.target.value)} />

          {/* Bouton Exporter */}
          <button className="header-btn" onClick={handleExport} title={t.exportTitle}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t.export}
          </button>

          {/* Bouton Importer */}
          <button className="header-btn import" onClick={() => importRef.current?.click()} title={t.importTitle}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 9V1M4 4l3-3 3 3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t.import}
          </button>
          <input ref={importRef} type="file" accept=".json" style={{ display:"none" }} onChange={handleImportFile} />
        </div>
      </div>

      {/* Board */}
      <div style={{
        display:"flex", gap:12, padding:"16px 24px",
        overflowX:"auto", alignItems:"flex-start", minHeight:"calc(100vh - 72px)"
      }}>
        {filteredColumns.map(col => (
          <div key={col.id}
            className={`col-wrapper${dragOver===col.id?" drag-over":""}`}
            onDragOver={e => handleDragOver(e, col.id)}
            onDrop={e => handleDrop(e, col.id)}
          >
            <div style={{ padding:"13px 12px 11px", borderBottom:"1px solid #1E1E2A", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:col.color, flexShrink:0 }} />
              <EditableColTitle title={col.title} hint={t.renameCol} onSave={v => renameCol(col.id, v)} />
              <span style={{ fontSize:11, color:"#5A5A70", fontWeight:600, background:"#0F0F18", borderRadius:6, padding:"2px 6px", flexShrink:0 }}>{col.cards.length}</span>
              <button className="icon-btn" title={t.deleteColTitle} onClick={() => setConfirmDeleteCol(col.id)}>✕</button>
            </div>
            <div style={{ padding:"10px", overflowY:"auto", flex:1 }}>
              {col.cards.map(card => (
                <div key={card.id} className="card-item"
                  style={{
                    "--card-color":card.color, marginBottom:8,
                    boxShadow: dragging && dragOverCard===card.id && dragging.cardId!==card.id
                      ? "0 -3px 0 0 #E8C547" : undefined
                  }}
                  draggable
                  onDragStart={() => handleDragStart(card.id, col.id)}
                  onDragOver={e => { e.preventDefault(); setDragOver(col.id); setDragOverCard(card.id); }}
                  onDragLeave={() => setDragOverCard(cur => cur===card.id ? null : cur)}
                  onDrop={e => handleDrop(e, col.id, card.id)}
                  onClick={() => openEdit(card, col.id)}
                >
                  <div style={{ fontSize:13.5, lineHeight:1.45, fontWeight:500, marginBottom:9, color:"#EEE" }}>
                    {card.title}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    {card.tag && <span className="tag-pill">{card.tag}</span>}
                    {deadlineInfo(card.deadline, t) && (
                      <span title={deadlineInfo(card.deadline, t).title}
                        style={{ fontSize:11, fontWeight:600, color:deadlineInfo(card.deadline, t).color, flexShrink:0 }}>
                        ◷ {deadlineInfo(card.deadline, t).label}
                      </span>
                    )}
                    {card.notes && <span style={{ width:6, height:6, borderRadius:"50%", background:"#4770E8", display:"inline-block", flexShrink:0 }} title={t.hasNotes} />}
                    <span style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:4 }}>
                      <span style={{ width:6, height:6, borderRadius:"50%", background:PRIORITY_COLORS[card.priority], display:"inline-block" }} />
                      <span style={{ fontSize:11, fontWeight:500, color:PRIORITY_COLORS[card.priority] }}>{t.prio[card.priority] || card.priority}</span>
                    </span>
                  </div>
                </div>
              ))}
              <button className="add-card-btn" onClick={() => openAdd(col.id)}>{t.addCard}</button>
            </div>
          </div>
        ))}
        <button className="new-col-btn" onClick={addColumn}>
          <span style={{ fontSize:16 }}>+</span><span>{t.newCol}</span>
        </button>
      </div>

      {/* Modal carte */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize:17, fontWeight:700, marginBottom:16 }}>
                {modal.mode==="add" ? t.newCard : form.title || t.editCard}
              </h2>
              <div style={{ display:"flex", borderBottom:"1px solid #1E1E2A" }}>
                {[["infos",t.tabInfos],["notes",t.tabNotes]].map(([key, label]) => (
                  <button key={key} onClick={() => setActiveTab(key)} style={{
                    flex:1, padding:"10px 0", border:"none", background:"transparent", cursor:"pointer",
                    fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500,
                    color: activeTab===key ? "#F0EDE6" : "#5A5A70",
                    borderBottom: activeTab===key ? "2px solid #E8C547" : "2px solid transparent",
                    transition:"all 0.15s"
                  }}>
                    {label}
                    {key==="notes" && form.notes && (
                      <span style={{ marginLeft:6, width:6, height:6, borderRadius:"50%", background:"#4770E8", display:"inline-block", verticalAlign:"middle" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-body" style={{ paddingTop:20 }}>
              {activeTab==="infos" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div>
                    <label className="mlabel">{t.fTitle}</label>
                    <input className="m-input" value={form.title}
                      onChange={e => setForm(f => ({...f, title:e.target.value}))}
                      placeholder={t.fTitlePh} autoFocus
                      onKeyDown={e => e.key==="Enter" && saveCard()} />
                  </div>
                  <div>
                    <label className="mlabel">{t.fType}</label>
                    <div style={{ display:"flex", gap:6, marginBottom:8, flexWrap:"wrap" }}>
                      {tags.map(tag => (
                        <div key={tag} style={{ display:"flex", alignItems:"center" }}>
                          <button onClick={() => setForm(f => ({...f, tag}))} style={{
                            padding:"5px 11px", border:"1px solid",
                            borderColor: form.tag===tag ? "#E8C547" : "#2A2A38",
                            borderRadius:"100px 0 0 100px",
                            background: form.tag===tag ? "#E8C54722" : "transparent",
                            color: form.tag===tag ? "#E8C547" : "#7A7A90",
                            fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500,
                            cursor:"pointer", transition:"all 0.15s"
                          }}>{tag}</button>
                          <button onClick={() => deleteTag(tag)} style={{
                            padding:"5px 7px", border:"1px solid #2A2A38", borderLeft:"none",
                            borderRadius:"0 100px 100px 0", background:"transparent", color:"#3A3A55",
                            fontFamily:"'Inter',sans-serif", fontSize:11, cursor:"pointer", lineHeight:1
                          }}
                            onMouseOver={e => e.currentTarget.style.color="#E84770"}
                            onMouseOut={e => e.currentTarget.style.color="#3A3A55"}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <input className="m-input" value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        onKeyDown={e => e.key==="Enter" && addTag()}
                        placeholder={t.newTagPh} style={{ flex:1 }} />
                      <button onClick={addTag} style={{
                        background:"#1E1E2E", border:"1px solid #2A2A38", color:"#E8C547",
                        borderRadius:8, padding:"9px 14px", cursor:"pointer",
                        fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, whiteSpace:"nowrap"
                      }}>{t.createTag}</button>
                    </div>
                  </div>
                  <div>
                    <label className="mlabel">{t.fPriority}</label>
                    <div style={{ display:"flex", gap:8 }}>
                      {PRIORITIES.map(p => (
                        <button key={p} onClick={() => setForm(f => ({...f, priority:p}))} style={{
                          flex:1, padding:"7px", border:"1px solid",
                          borderColor: form.priority===p ? PRIORITY_COLORS[p] : "#2A2A38",
                          borderRadius:8,
                          background: form.priority===p ? PRIORITY_COLORS[p]+"22" : "transparent",
                          color: form.priority===p ? PRIORITY_COLORS[p] : "#5A5A70",
                          fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500,
                          cursor:"pointer", transition:"all 0.15s"
                        }}>{t.prio[p] || p}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mlabel">{t.fDeadline}</label>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <input type="date" className="m-input" value={form.deadline}
                        onChange={e => setForm(f => ({...f, deadline:e.target.value}))}
                        style={{ colorScheme:"dark", flex:1 }} />
                      {form.deadline && (
                        <button onClick={() => setForm(f => ({...f, deadline:""}))} style={{
                          background:"none", border:"1px solid #2A2A38", color:"#5A5A70",
                          borderRadius:8, padding:"8px 12px", cursor:"pointer",
                          fontFamily:"'Inter',sans-serif", fontSize:12, whiteSpace:"nowrap"
                        }}>{t.clear}</button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mlabel">{t.fColor}</label>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {CARD_COLORS.map(c => (
                        <button key={c} onClick={() => setForm(f => ({...f, color:c}))} style={{
                          width:28, height:28, borderRadius:"50%", background:c,
                          border: form.color===c ? "3px solid white" : "3px solid transparent",
                          cursor:"pointer", flexShrink:0
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab==="notes" && (
                <div>
                  <label className="mlabel" style={{ marginBottom:10 }}>{t.freeNotes}</label>
                  <textarea className="notes-textarea"
                    value={form.notes}
                    onChange={e => setForm(f => ({...f, notes:e.target.value}))}
                    placeholder={t.notesPh}
                    autoFocus
                  />
                  <p style={{ fontSize:11, color:"#3A3A55", marginTop:8 }}>
                    {t.notesHint}
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {modal.mode==="edit" ? (
                <button onClick={() => setConfirmDeleteCard({ cardId:modal.card.id, colId:modal.colId, title:form.title })} style={{
                  background:"none", border:"1px solid #3A1A22", color:"#E84770",
                  borderRadius:8, padding:"8px 14px",
                  fontFamily:"'Inter',sans-serif", fontSize:12, cursor:"pointer"
                }}>{t.delete}</button>
              ) : <div />}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={closeModal} style={{
                  background:"none", border:"1px solid #2A2A38", color:"#5A5A70",
                  borderRadius:8, padding:"8px 14px",
                  fontFamily:"'Inter',sans-serif", fontSize:12, cursor:"pointer"
                }}>{t.cancel}</button>
                <button className="save-btn" onClick={saveCard}>
                  {modal.mode==="add" ? t.add : t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nouvelle colonne */}
      {colModal && (
        <div className="modal-overlay" onClick={() => setColModal(null)}>
          <div className="modal-box" style={{ width:340 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ paddingBottom:0 }}>
              <h2 style={{ fontSize:17, fontWeight:700, marginBottom:20 }}>{t.newCol}</h2>
            </div>
            <div className="modal-body" style={{ paddingTop:4 }}>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label className="mlabel">{t.colName}</label>
                  <input className="m-input" value={colForm.title}
                    onChange={e => setColForm(f => ({...f, title:e.target.value}))}
                    placeholder={t.colNamePh} autoFocus
                    onKeyDown={e => e.key==="Enter" && saveColumn()} />
                </div>
                <div>
                  <label className="mlabel">{t.fColor}</label>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {COL_COLORS.map(c => (
                      <button key={c} onClick={() => setColForm(f => ({...f, color:c}))} style={{
                        width:28, height:28, borderRadius:"50%", background:c,
                        border: colForm.color===c ? "3px solid white" : "3px solid transparent",
                        cursor:"pointer"
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <div />
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setColModal(null)} style={{
                  background:"none", border:"1px solid #2A2A38", color:"#5A5A70",
                  borderRadius:8, padding:"8px 14px",
                  fontFamily:"'Inter',sans-serif", fontSize:12, cursor:"pointer"
                }}>{t.cancel}</button>
                <button className="save-btn" onClick={saveColumn}>{t.create}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete colonne */}
      {confirmDeleteCol && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteCol(null)}>
          <div className="modal-box" style={{ width:340 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize:16, fontWeight:700, marginBottom:12 }}>{t.delColQ}</h2>
            </div>
            <div className="modal-body">
              <p style={{ fontSize:13, color:"#94A3B8", lineHeight:1.6 }}>
                {t.delColBody}
              </p>
            </div>
            <div className="modal-footer">
              <div />
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setConfirmDeleteCol(null)} style={{
                  background:"none", border:"1px solid #2A2A38", color:"#5A5A70",
                  borderRadius:8, padding:"8px 14px",
                  fontFamily:"'Inter',sans-serif", fontSize:12, cursor:"pointer"
                }}>{t.cancel}</button>
                <button onClick={() => deleteCol(confirmDeleteCol)} style={{
                  background:"#E84770", color:"white", border:"none",
                  borderRadius:8, padding:"8px 16px",
                  fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer"
                }}>{t.delete}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete carte */}
      {confirmDeleteCard && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteCard(null)}>
          <div className="modal-box" style={{ width:340 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize:16, fontWeight:700, marginBottom:12 }}>{t.delCardQ}</h2>
            </div>
            <div className="modal-body">
              <p style={{ fontSize:13, color:"#94A3B8", lineHeight:1.6 }}>
                {t.delCardBody(confirmDeleteCard.title)}
              </p>
            </div>
            <div className="modal-footer">
              <div />
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setConfirmDeleteCard(null)} style={{
                  background:"none", border:"1px solid #2A2A38", color:"#5A5A70",
                  borderRadius:8, padding:"8px 14px",
                  fontFamily:"'Inter',sans-serif", fontSize:12, cursor:"pointer"
                }}>{t.cancel}</button>
                <button onClick={() => { deleteCard(confirmDeleteCard.cardId, confirmDeleteCard.colId); setConfirmDeleteCard(null); }} style={{
                  background:"#E84770", color:"white", border:"none",
                  borderRadius:8, padding:"8px 16px",
                  fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer"
                }}>{t.delete}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast sauvegarde auto */}
      {autoBackupToast && (
        <div className="error-toast" style={{ borderColor:"#47E87B", color:"#47E87B", background:"#0F2A18" }}>
          {t.autoBackup}
        </div>
      )}

      {/* Toast erreur import */}
      {importError && <div className="error-toast">{importError}</div>}
    </div>
  );
}
