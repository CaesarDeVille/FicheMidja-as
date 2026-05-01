/* ── THEME ── */
const DEFAULTS={bg:'#0d0700',bg2:'#1e1008',gold:'#f0c040',text:'#e8d5a0',border:'#8b6914',font:"'Palatino Linotype','Book Antiqua',Palatino,serif",slotEmpty:'#0a0600',speSlot:'#070f16',charPanel:'#0a0600'};

function hexToRgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
function dk(h,f=.5){const[r,g,b]=hexToRgb(h);return`rgb(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)})`;}
function lt(h,f=1.4){const[r,g,b]=hexToRgb(h);return`rgb(${Math.min(255,Math.round(r*f))},${Math.min(255,Math.round(g*f))},${Math.min(255,Math.round(b*f))})`;}
function bl(h,a=.2){const[r,g,b]=hexToRgb(h);return`rgba(${r},${g},${b},${a})`;}

function applyTheme(){
  const bg=document.getElementById('tc-bg').value;
  const bg2=document.getElementById('tc-bg2').value;
  const gold=document.getElementById('tc-gold').value;
  const text=document.getElementById('tc-text').value;
  const border=document.getElementById('tc-border').value;
  const font=document.getElementById('tc-font').value;
  const slotEmpty=(document.getElementById('tc-slot-empty')?.value) || DEFAULTS.slotEmpty;
  const charPanel=(document.getElementById('tc-char-panel')?.value) || DEFAULTS.charPanel;
  const speSlot=(document.getElementById('tc-spe-slot')?.value) || DEFAULTS.speSlot;
  const s=document.documentElement.style;
  s.setProperty('--bg',bg);
  s.setProperty('--bg2',bg2);
  s.setProperty('--bg3',dk(bg2,.75));
  s.setProperty('--border',border);
  s.setProperty('--border2',dk(border,.9));
  s.setProperty('--border3',dk(border,.6));
  s.setProperty('--gold',gold);
  s.setProperty('--text',text);
  s.setProperty('--muted',dk(gold,.75));
  s.setProperty('--dim',dk(gold,.55));
  s.setProperty('--filled',lt(dk(gold,.9),1.1));
  s.setProperty('--hover',bl(border,.3));
  s.setProperty('--font',font);
  s.setProperty('--slot-empty',slotEmpty);
  s.setProperty('--char-panel',charPanel);
  s.setProperty('--spe-slot-empty',speSlot);
  document.body.style.fontFamily=font;
  localStorage.setItem('dnd_theme',JSON.stringify({bg,bg2,gold,text,border,font,slotEmpty,speSlot,charPanel}));
}

function resetTheme(){
  document.getElementById('tc-bg').value=DEFAULTS.bg;
  document.getElementById('tc-bg2').value=DEFAULTS.bg2;
  document.getElementById('tc-gold').value=DEFAULTS.gold;
  document.getElementById('tc-text').value=DEFAULTS.text;
  document.getElementById('tc-border').value=DEFAULTS.border;
  document.getElementById('tc-font').value=DEFAULTS.font;
  const se=document.getElementById('tc-slot-empty'); if(se) se.value=DEFAULTS.slotEmpty;
  const ss=document.getElementById('tc-spe-slot'); if(ss) ss.value=DEFAULTS.speSlot;
  const cp=document.getElementById('tc-char-panel'); if(cp) cp.value=DEFAULTS.charPanel;
  applyTheme();
}

function loadTheme(){
  try{
    const t=JSON.parse(localStorage.getItem('dnd_theme')||'null');
    if(t){
      if(t.bg)document.getElementById('tc-bg').value=t.bg;
      if(t.bg2)document.getElementById('tc-bg2').value=t.bg2;
      if(t.gold)document.getElementById('tc-gold').value=t.gold;
      if(t.text)document.getElementById('tc-text').value=t.text;
      if(t.border)document.getElementById('tc-border').value=t.border;
      if(t.font)document.getElementById('tc-font').value=t.font;
      const se=document.getElementById('tc-slot-empty'); if(se&&t.slotEmpty) se.value=t.slotEmpty;
      const ss=document.getElementById('tc-spe-slot'); if(ss&&t.speSlot) ss.value=t.speSlot;
      const cp=document.getElementById('tc-char-panel'); if(cp&&t.charPanel) cp.value=t.charPanel;
    }
  }catch(e){}
  applyTheme();
}

/* ── DATA ── */
const BAG_CONFIG = {
  sacoche: { norm: 6,  spe: 0 },
  petit:   { norm: 9,  spe: 1 },
  moyen:   { norm: 11, spe: 2 },
  grand:   { norm: 13, spe: 3 },
};
const POCKET_N = 20;

const SPE_OPTIONS = [
  '— Vide —',
  'Tente',
  'Sac de couchage',
  'Marmite',
  'Séchoir',
  'Échelle Pliable',
  'Porte Fioles',
  'Porte Parchemins',
  'Trousse de Soin',
  'Sac de Rations',
  "Sac d'Outils",
  'Livre Inventaire (+4 à +7 empl.)',
  'Autre',
];

const LABELS = {
  cape:'Cape / Manteau', amulette:'Amulette', 'couvre-chef':'Couvre-Chef',
  arme:'Arme en Main', armure:'Armure', dos:'Dos', epaule:'Épaule',
  ceintureGauche:'Ceinture Gauche', ceintureDroite:'Ceinture Droite',
  ceinture:'Ceinture', bottes:'Bottes', divers:'Divers', gants:'Gants', bracelet:'Bracelet',
  anneau1:'Anneau — Gauche', anneau2:'Anneau — Droit', mun:'Munitions',
};

// Named equip slots that use nom/type/effet display
const NAMED_SLOTS = ['couvre-chef','arme','armure','dos','epaule',
  'ceintureGauche','ceintureDroite','ceinture','bottes','divers','gants','bracelet',
  'amulette','cape','anneau1','anneau2'];

let data = {}, curSlot = null;

/* ══════════════════════════════════════════════════════
   ARKELITH — STABILITÉ & SÉCURITÉ
   ══════════════════════════════════════════════════════ */

const ARKELITH_VERSION    = 'Beta 1.07';
const ARKELITH_STORAGE_KEY  = 'dnd_inv';
const ARKELITH_RECOVERY_KEY = 'arkelith_recovery';

// Accès localStorage sécurisé
function safeLocalGet(key, fallback = null) {
  try { return localStorage.getItem(key) ?? fallback; }
  catch (e) { console.warn('[Arkelith] localStorage inaccessible (get):', key, e); return fallback; }
}

function safeLocalSet(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (e) {
    console.warn('[Arkelith] localStorage inaccessible (set):', key, e);
    try { toast(uiT('toast.storageError', 'Stockage local plein. Exporte ta fiche pour ne pas perdre de données.')); } catch(_) {}
    return false;
  }
}

// Snapshot de secours avant toute opération destructive
function createRecoveryPoint(reason = 'manual') {
  if (window.__midjaasSpectatorActive) return false;
  try {
    safeLocalSet(ARKELITH_RECOVERY_KEY, JSON.stringify({
      version: ARKELITH_VERSION,
      reason,
      savedAt: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(data || {}))
    }));
    return true;
  } catch (e) { console.warn('[Arkelith] Snapshot impossible:', e); return false; }
}

// Protection contre la prototype pollution sur les imports JSON
function sanitizeImport(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('La sauvegarde doit être un objet JSON valide.');
  const out = {};
  Object.keys(value).forEach(k => {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') return;
    out[k] = value[k];
  });
  return out;
}

// Diagnostic interne (console uniquement — pas de bouton visible)
function runArkelithDiagnostics() {
  const checks = [];
  const add = (ok, label, detail = '') => checks.push({ ok, label, detail });

  add(!!document.querySelector('.app'),              'Structure .app présente');
  add(!!document.getElementById('page-fiche'),       'Page Fiche présente');
  add(!!document.getElementById('page-inventaire'),  'Page Inventaire présente');
  add(typeof t === 'function' && typeof uiT === 'function', 'Système i18n disponible');
  add(typeof openFirebaseSaveModal === 'function',   'Firebase save branché');

  // IDs dupliqués
  const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  add(dupes.length === 0, 'IDs HTML uniques', dupes.join(', '));

  // Clés i18n manquantes
  const missing = [...document.querySelectorAll('[data-i18n]')]
    .map(el => el.dataset.i18n)
    .filter(k => k && typeof t === 'function' && t(k, '__MISSING__') === '__MISSING__');
  add(missing.length === 0, 'Clés i18n présentes', [...new Set(missing)].slice(0, 10).join(', '));

  // localStorage
  const lsOk = safeLocalSet('arkelith_diag_ping', '1');
  if (lsOk) try { localStorage.removeItem('arkelith_diag_ping'); } catch(_) {}
  add(lsOk, 'localStorage accessible');

  console.groupCollapsed('[Arkelith] Diagnostic');
  checks.forEach(c => (c.ok ? console.info : console.warn)(`${c.ok ? '✓' : '⚠'} ${c.label}`, c.detail || ''));
  console.groupEnd();
  return checks;
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const r = runArkelithDiagnostics();
    const failed = r.filter(c => !c.ok);
    if (failed.length) console.warn('[Arkelith] ' + failed.length + ' point(s) à vérifier — voir le diagnostic ci-dessus.');
  }, 800);
});


var PROSTHESIS_SLOTS = [
  'prothese_tete','prothese_oeil_g','prothese_oeil_d',
  'prothese_bras_g','prothese_corps','prothese_bras_d',
  'prothese_jambe_g','prothese_jambe_d',
  'prothese_extra_1','prothese_extra_2','prothese_extra_3','prothese_extra_4','prothese_extra_5'
];

let curSortKey = null, curSortIdx = null;
let curFreeType = null, curFreeIdx = null;

function loadData() {
  try { data = sanitizeImport(JSON.parse(safeLocalGet(ARKELITH_STORAGE_KEY, '{}') || '{}')); } catch(e) { data = {}; }
  document.getElementById('bagSize').value = data._bagSize || 'sacoche';
  buildBag(); buildPoche(); buildSpe(); refresh(); loadChar();
}

function persist() {
  if (window.__midjaasSpectatorActive) return;
  safeLocalSet(ARKELITH_STORAGE_KEY, JSON.stringify(data));
}
function saveData() {
  if (window.__midjaasSpectatorActive) { toast(uiT('spectator.readOnly','Mode spectateur : lecture seule.')); return; }
  persist(); toast(uiT('toast.saved','Sauvegardé !'));
}

function exportData() {
  // Collect current theme values.
  // getComputedStyle is important: it also captures default CSS variables,
  // not only values manually changed inline.
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const themeKeys = ['--bg','--bg2','--bg3','--gold','--text','--border','--border2','--muted','--dim','--hover','--filled','--slot-empty','--spe-slot-empty','--char-panel'];
  const theme = {};
  themeKeys.forEach(k => { theme[k] = cs.getPropertyValue(k).trim(); });

  const out = Object.assign({}, data, {
    _bagSize: document.getElementById('bagSize')?.value || data._bagSize || 'sacoche',
    _exportTheme: theme,
    _exportFont: cs.getPropertyValue('--font').trim(),
  });

  const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
  const nom = (data._char?.nom || '').trim().replace(/[^a-zA-Z0-9_\-\. ]/g,'').trim() || 'Personnage';
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = nom + ' - Arkelith.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function saveKeepTheme(val) {
  data._keepThemeOnImport = val; persist();
}

function getKeepTheme() {
  return data._keepThemeOnImport !== false; // true by default
}

function importData(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();

  r.onload = ev => {
    let parsed;
    try {
      parsed = sanitizeImport(JSON.parse(ev.target.result));
    } catch (err) {
      console.error(err);
      toast(uiT('toast.jsonError','Erreur JSON'));
      e.target.value = '';
      return;
    }

    try {
      // Option locale AVANT l'import :
      // coché = on garde notre apparence locale
      // décoché = on importe l'apparence de la fiche reçue
      const keepTheme = getKeepTheme();

      const root = document.documentElement;
      const cs = getComputedStyle(root);
      const pickers = {
        '--bg':'tc-bg',
        '--bg2':'tc-bg2',
        '--gold':'tc-gold',
        '--text':'tc-text',
        '--border':'tc-border',
        '--slot-empty':'tc-slot-empty',
        '--spe-slot-empty':'tc-spe-slot',
        '--char-panel':'tc-char-panel'
      };

      const currentTheme = {};
      Object.keys(pickers).forEach(k => {
        currentTheme[k] = cs.getPropertyValue(k).trim();
      });
      const currentFont = cs.getPropertyValue('--font').trim();

      const setPickerValue = (id, value) => {
        const el = document.getElementById(id);
        if (!el || !value) return;
        // Les inputs color n'acceptent que #rrggbb.
        if (el.type === 'color' && !/^#[0-9a-fA-F]{6}$/.test(value.trim())) return;
        el.value = value.trim();
      };

      // Snapshot de secours avant import
      createRecoveryPoint('before-import');

      // Import des données de la fiche
      data = sanitizeImport(parsed);
      preloadFicheImages();
      data._keepThemeOnImport = keepTheme;

      if (keepTheme) {
        // Conserver mes couleurs : restaurer l'apparence locale
        Object.entries(currentTheme).forEach(([k, v]) => { if (v) root.style.setProperty(k, v); });
        if (currentFont) root.style.setProperty('--font', currentFont);

        Object.entries(pickers).forEach(([cssVar, id]) => setPickerValue(id, currentTheme[cssVar]));
        setPickerValue('tc-font', currentFont);
      } else if (parsed._exportTheme && typeof parsed._exportTheme === 'object') {
        // Importer l'apparence de la fiche reçue
        const t = parsed._exportTheme;
        Object.entries(t).forEach(([k, v]) => { if (v) root.style.setProperty(k, v); });
        if (parsed._exportFont) root.style.setProperty('--font', parsed._exportFont);

        Object.entries(pickers).forEach(([cssVar, id]) => setPickerValue(id, t[cssVar]));
        setPickerValue('tc-font', parsed._exportFont);

        localStorage.setItem('dnd_theme', JSON.stringify({
          bg: t['--bg'] || '',
          bg2: t['--bg2'] || '',
          gold: t['--gold'] || '',
          text: t['--text'] || '',
          border: t['--border'] || '',
          font: parsed._exportFont || '',
          slotEmpty: t['--slot-empty'] || '',
          speSlot: t['--spe-slot-empty'] || '',
          charPanel: t['--char-panel'] || ''
        }));
      }

      const bag = document.getElementById('bagSize');
      if (bag) bag.value = data._bagSize || 'sacoche';

      buildBag(); buildPoche(); buildSpe(); refresh(); loadChar();
      applyStatLabels(); applyCharLabels(); applyCatLabels(); applyMagieSetting(); applyParamShow(); applyStatSplits(); applyEffetsPlus(); refreshArmorStats(); applyAllQualityColors(); applySlotLabels(); applyFicheSectionLabels(); buildBourseRows();

      const keepThemeBox = document.getElementById('cfg-keep-theme');
      if (keepThemeBox) keepThemeBox.checked = keepTheme;

      setTimeout(() => {
        resizeAllCartouche();
        document.querySelectorAll('#page-fiche .fiche-stat-inp').forEach(el => resizeFicheInp(el));
      }, 50);

      persist();
      toast(uiT('toast.imported','Importé !'));
    } catch (err) {
      console.error(err);
      toast('Import incomplet : vérifie la console');
    } finally {
      e.target.value = '';
    }
  };

  r.readAsText(f);
}

// Liste des clés de paramètres à préserver lors d'un effacement de fiche
const PARAM_KEYS = ['_catLabels','_charLabels','_statLabels','_qualities','_armorLabels','_armorNames',
  '_armorEnabled','_slotLabels','_ficheSectionLabels','_capLabels','_capWalletLabels',
  '_resSplit','_resNames','_magieEnabled','_infusionEnabled','_showCats','_maxCats',
  '_compFormats','_compArrays','_effetsPlus','_bagConfig','_speConfig','_levelNames',
  '_levelColors','_magicColors','_themeColors','_fontChoice','_fsSizes','_exportTheme','_exportFont',
  '_bourseCount','_bourseLabel','_banqueLabel'];

function clearFiche() {
  if (!confirm(uiT('confirm.resetSheet','Réinitialiser la fiche du personnage ? Les paramètres seront conservés.'))) return;
  createRecoveryPoint('before-clear-sheet');
  // Keep all param keys
  const kept = {};
  PARAM_KEYS.forEach(k => { if (data[k] !== undefined) kept[k] = data[k]; });
  // Also keep bourse values and bourse/banque wallet values
  Object.keys(data).forEach(k => {
    if (k.startsWith('_bourseVal') || k.startsWith('_bourseDevise') ||
        k.startsWith('_banqueVal') || k.startsWith('_banqueDevise') ||
        k.startsWith('_capital') || k.startsWith('_capLabels')) kept[k] = data[k];
  });
  data = kept;
  document.getElementById('bagSize').value = 'sacoche';
  buildBag(); buildPoche(); buildSpe(); refresh(); loadChar(); renderFiche();
  applyStatLabels(); applyCharLabels(); applyCatLabels(); applyMagieSetting(); applyParamShow(); applyStatSplits();
  applyEffetsPlus(); applySlotLabels(); applyFicheSectionLabels(); applyAllQualityColors();
  buildBourseRows(); refreshArmorStats();
  persist();
  toast(uiT('toast.sheetReset','Fiche réinitialisée.'));
}


function resetAllParams() {
  if (!confirm(uiT('confirm.resetAllParams','Réinitialiser tous les paramètres ?'))) return;
  ['qualities','ficheSections','slotLabels','charLabels','catLabels','statLabels','armorStats','capLabels','theme'].forEach(s => {
    try { resetParamSection(s, true); } catch(e) { console.warn(e); }
  });
  persist();
  toast(uiT('toast.paramsReset','Paramètres réinitialisés.'));
}

function clearAll() {
  if (!confirm(uiT('confirm.clearAll','Réinitialiser TOUT (fiche ET paramètres) ? Irréversible.'))) return;
  data = {};
  document.getElementById('bagSize').value = 'sacoche';
  buildBag(); buildPoche(); buildSpe(); refresh(); loadChar(); renderFiche();
  applyStatLabels(); applyCharLabels(); applyCatLabels(); applyMagieSetting(); applyParamShow(); applyStatSplits();
  applyEffetsPlus(); applySlotLabels(); applyFicheSectionLabels(); applyAllQualityColors();
  buildBourseRows(); refreshArmorStats();
  persist();
  toast(uiT('toast.allReset','Tout réinitialisé.'));
}

// Reset individuel de sections de paramètres
function resetParamSection(section, skipConfirm = false) {
  const labels = {
    qualities:'les Qualités/Raretés', ficheSections:'les titres de la Fiche Perso',
    slotLabels:'les noms des slots', charLabels:'le Cartouche Joueur',
    catLabels:'les noms des catégories', statLabels:'les labels des ressources',
    armorStats:'les stats d\'Armure', capLabels:'les titres Capital',
    theme:'l\'apparence',
    pri:'les Compétences Principales', sec:'les Compétences Secondaires',
    mar:'les Compétences Martiales', mag:'les Compétences Magiques',
    sta:'les Statistiques', savoirs:'les Connaissances', coups:'les Coups Spéciaux',
    livre:'le Livre de Sorts', allComps:'toutes les compétences',
    resources:'les Ressources', magie:'les réglages Magie',
    bags:'les types de Sacs', spe:'les Emplacements Spéciaux',
    capital:'les données Capital',
  };
  if (!skipConfirm && !confirm('Réinitialiser '+(labels[section]||section)+' ?')) return;
  const map = {
    qualities:    () => { delete data._qualities; renderQualityParams(); applyAllQualityColors(); },
    ficheSections:() => { delete data._ficheSectionLabels; applyFicheSectionLabels(); renderFicheLabelParams(); },
    slotLabels:   () => { delete data._slotLabels; applySlotLabels(); renderSlotLabelParams(); },
    charLabels:   () => { delete data._charLabels; applyCharLabels(); },
    catLabels:    () => { delete data._catLabels; applyCatLabels(); renderParametres(); },
    statLabels:   () => { delete data._statLabels; delete data._resNames; delete data._resSplit; applyStatLabels(); applyStatSplits(); renderParametres(); },
    armorStats:   () => { delete data._armorLabels; delete data._armorNames; delete data._armorEnabled; renderArmorParams(); refreshArmorStats(); },
    capLabels:    () => { delete data._capLabels; delete data._capWalletLabels; renderCapitalParams(); },
    theme:        () => { delete data._exportTheme; delete data._exportFont; resetTheme(); },
    pri:     () => { if(data._compArrays) delete data._compArrays.pri; renderParametres(); renderCompetences(); },
    sec:     () => { if(data._compArrays) delete data._compArrays.sec; renderParametres(); renderCompetences(); },
    mar:     () => { if(data._compArrays) delete data._compArrays.mar; renderParametres(); renderCompetences(); },
    mag:     () => { if(data._compArrays) delete data._compArrays.mag; renderParametres(); renderCompetences(); },
    sta:     () => { if(data._compArrays) delete data._compArrays.sta; renderParametres(); renderCompetences(); },
    savoirs: () => { delete data._savoirs; renderSavoirs(); },
    coups:   () => { delete data._coups; renderCoups(); },
    livre:   () => { delete data._sorts; renderLivreSorts(); },
    allComps:() => { resetAllComps(); },
    resources:() => { delete data._statLabels; delete data._resNames; delete data._resSplit; applyStatLabels(); applyStatSplits(); renderParametres(); },
    magie:   () => { delete data._magieEnabled; delete data._infusionEnabled; applyMagieSetting(); renderParametres(); },
    bags:    () => { delete data._customBags; updateBagSelect(); buildBag(); renderParametres(); },
    spe:     () => { delete data._customSpe; buildSpe(); renderParametres(); },
    capital: () => { delete data._capital; delete data._capLabels; delete data._capWalletLabels; delete data._banqueLabel; Object.keys(data).filter(k=>k.startsWith('_banqueVal')||k.startsWith('_banqueDevise')).forEach(k=>delete data[k]); renderCapital(); renderCapitalParams(); },
  };
  if (map[section]) { map[section](); persist(); toast(uiT('toast.reset','Réinitialisé.')); }
}

/* ── bag normal slots ── */
function getBagConfig() {
  const sz = document.getElementById('bagSize').value;
  const bags = getCustomBags();
  const bag = bags.find(b=>b.key===sz) || { norm:6, spe:0 };
  const speCount = bag.spe;
  const customSpe = getCustomSpe();
  let extraNorm = 0;
  const speSlots = [];
  const livreRanges = [];
  for (let i = 0; i < speCount; i++) {
    const v = data['_spe' + i] || '';
    if (!v || v === '— Vide —') continue;
    // find the spe config
    const speCfg = customSpe.find(s=>s.label===v) || {};
    if (speCfg.isLivre) {
      const bonus = Math.min(7, Math.max(4, parseInt(data['_livreBonus' + i]) || 4));
      livreRanges.push({ start: bag.norm + extraNorm, count: bonus });
      extraNorm += bonus;
    } else if (speCfg.noStorage || speCfg.slots === 0) {
      // no storage
    } else {
      speSlots.push({ label: v, index: i, count: speCfg.slots || 3 });
    }
  }
  return { norm: bag.norm + extraNorm, baseNorm: bag.norm, speSlots, livreRanges };
}

function isLivreSlot(idx, livreRanges) {
  return livreRanges.some(r => idx >= r.start && idx < r.start + r.count);
}

function buildBag() {
  const { norm, speSlots, livreRanges } = getBagConfig();
  const g = document.getElementById('bagGrid'); g.innerHTML = '';

  for (let i = 0; i < norm; i++) {
    const k = 'bag_' + i;
    const d = data[k];
    const isLivre = isLivreSlot(i, livreRanges);
    const el = document.createElement('div');
    el.className = 'grid-cell' + (d?.nom ? ' filled' : '');
    el.id = 'sl-' + k;
    el.dataset.slotKey = k;
    if (isLivre) {
      el.style.borderLeft = '3px solid #2a6a9a';
      el.style.background = d?.nom ? '#0a1820' : '#070f16';
    }
    el.innerHTML = d?.nom
      ? `<span style="color:var(--text)">${d.nom}</span>${d.type ? `<span style="color:#9a9a9a;margin-left:6px;font-size:10px;">${d.type}</span>` : ''}`
      : (isLivre ? '<span style="color:#2a6a9a;font-style:italic;">Livre Inventaire</span>' : 'Emplacement sac');
    el.onclick = () => { if (!wasDragging) open_(k); };
    makeDraggable(el, k);
    makeDropTarget(el, k);
    if (!isLivre) applyQualityColor(el, d?.quality !== undefined ? d.quality : null);
    else if (d?.quality !== undefined && d.quality !== null) applyQualityColor(el, d.quality);
    attachSlotPreview(el, k);
    g.appendChild(el);
  }

  speSlots.forEach(({ label, index, count }) => {
    for (let j = 0; j < count; j++) {
      const k = 'spe_' + index + '_' + j;
      const d = data[k];
      const el = document.createElement('div');
      el.className = 'grid-cell' + (d?.nom ? ' filled' : '');
      el.id = 'sl-' + k;
      el.dataset.slotKey = k;
      el.style.borderLeft = '3px solid #4a6a8a';
      el.style.background = d?.nom ? 'var(--bg3)' : 'var(--spe-slot-empty)';
      el.innerHTML = d?.nom
        ? `<span style="color:var(--text)">${d.nom}</span>${d.type ? `<span style="color:#9a9a9a;margin-left:6px;font-size:10px;">${d.type}</span>` : ''}`
        : `<span style="color:#4a7a9a;font-style:italic;">${label}</span>`;
      el.onclick = () => { if (!wasDragging) open_(k, label); };
      makeDraggable(el, k);
      makeDropTarget(el, k);
      if (d?.quality !== undefined && d.quality !== null) applyQualityColor(el, d.quality);
      attachSlotPreview(el, k);
      g.appendChild(el);
    }
  });
}

function buildPoche() {
  const g = document.getElementById('pocheGrid'); g.innerHTML = '';
  for (let i = 0; i < POCKET_N; i++) {
    const k = 'poche_' + i;
    const d = data[k];
    const el = document.createElement('div');
    el.className = 'grid-cell' + (d?.nom ? ' filled' : '');
    el.id = 'sl-' + k;
    el.dataset.slotKey = k;
    el.innerHTML = d?.nom
      ? `<span style="color:var(--text)">${d.nom}</span>${d.type ? `<span style="color:#9a9a9a;margin-left:6px;font-size:10px;">${d.type}</span>` : ''}`
      : t('emplacement_poche');
    el.onclick = () => { if (!wasDragging) open_(k); };
    makeDraggable(el, k);
    makeDropTarget(el, k);
    if (d?.quality !== undefined && d.quality !== null) applyQualityColor(el, d.quality);
    attachSlotPreview(el, k);
    g.appendChild(el);
  }
}
function buildSpe() {
  const sz = document.getElementById('bagSize').value;
  const bags = getCustomBags();
  const bag = bags.find(b=>b.key===sz) || { spe:0 };
  const speCount = bag.spe;
  const container = document.getElementById('speDynamic'); if(!container) return;
  container.innerHTML = '';
  const customSpe = getCustomSpe();
  for (let i = 0; i < speCount; i++) {
    const key = '_spe' + i;
    const val = data[key] || '';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:8px;';
    const lbl = document.createElement('span');
    lbl.style.cssText = 'font-size:11px;color:var(--muted);white-space:nowrap;min-width:48px;';
    lbl.textContent = 'Spé ' + (i+1);
    const sel = document.createElement('select');
    sel.className = 'spe-select-dd';
    sel.style.cssText = 'flex:1;background:var(--bg3);border:1.5px solid var(--border2);color:var(--text);font-family:var(--font);font-size:12px;padding:6px 8px;border-radius:3px;cursor:pointer;height:36px;';
    const blank = document.createElement('option');
    blank.value=''; blank.textContent='— Vide —'; if(!val) blank.selected=true; sel.appendChild(blank);
    customSpe.forEach(s => {
      const o = document.createElement('option');
      o.value=s.label; o.textContent=s.label;
      if (s.label===val) o.selected=true;
      sel.appendChild(o);
    });
    sel.onchange = () => { data[key]=sel.value; buildBag(); buildSpe(); persist(); };
    row.appendChild(lbl); row.appendChild(sel);
    const speCfg = customSpe.find(s=>s.label===val);
    if (speCfg?.isLivre) {
      const livreKey = '_livreBonus' + i;
      const bonusVal = data[livreKey] ?? 4;
      const bLbl = document.createElement('span'); bLbl.style.cssText='font-size:11px;color:var(--muted);'; bLbl.textContent='+';
      const bInp = document.createElement('input');
      bInp.type='number'; bInp.min=1; bInp.max=99; bInp.value=bonusVal;
      bInp.style.cssText='width:52px;background:var(--bg3);border:1.5px solid var(--border2);color:var(--gold);font-family:var(--font);font-size:12px;padding:4px 6px;border-radius:3px;text-align:center;outline:none;';
      bInp.oninput = () => { let v=Math.max(1,parseInt(bInp.value)||1); data[livreKey]=v; buildBag(); persist(); };
      const bSuf = document.createElement('span'); bSuf.style.cssText='font-size:11px;color:var(--dim);'; bSuf.textContent='empl.';
      row.appendChild(bLbl); row.appendChild(bInp); row.appendChild(bSuf);
    }
    container.appendChild(row);
  }
  if (speCount===0) {
    const none = document.createElement('div');
    none.style.cssText='font-size:11px;color:var(--dim);margin-top:6px;font-style:italic;';
    none.textContent="Cette sacoche n'a pas d'emplacement spécial.";
    container.appendChild(none);
  }
}

function updateBag() {
  data._bagSize = document.getElementById('bagSize').value;
  buildBag(); buildSpe(); persist();
}

/* ── refresh named slots ── */
function setSlotDisplay(key) {
  const d = data[key] || {};
  const n  = document.getElementById('dsp-' + key + '-nom');
  const tp = document.getElementById('dsp-' + key + '-type');
  const ef = document.getElementById('dsp-' + key + '-effet');

  if (n)  n.textContent  = d.nom   || '—';
  if (tp) tp.textContent = d.type  || '';
  if (ef) ef.textContent = d.effet || '';

  const sl = document.getElementById('sl-' + key);
  if (sl) {
    const hasSomething = !!(d.nom);
    sl.classList.toggle('filled', hasSomething);
    sl.style.background = hasSomething ? 'var(--bg3)' : 'var(--slot-empty)';

    // Quality border color
    applyQualityColor(sl, d.quality !== undefined ? d.quality : null);

    // Background image with preload:
    // important for Firebase loads where base64 images can take a moment.
    let bg = sl.querySelector('.slot-img-bg');

    if (d.img) {
      if (!bg) {
        bg = document.createElement('div');
        bg.className = 'slot-img-bg loading';
        sl.insertBefore(bg, sl.firstChild);
      }

      if (bg.dataset.src !== d.img) {
        bg.dataset.src = d.img;
        bg.classList.remove('loaded');
        bg.classList.add('loading');
        sl.classList.add('img-loading');

        const img = new Image();
        img.onload = () => {
          bg.style.backgroundImage = `url('${d.img}')`;
          bg.classList.remove('loading');
          bg.classList.add('loaded');
          sl.classList.remove('img-loading');
        };
        img.onerror = () => {
          bg.classList.remove('loading');
          sl.classList.remove('img-loading');
        };
        img.src = d.img;
      } else {
        bg.classList.remove('loading');
        bg.classList.add('loaded');
        sl.classList.remove('img-loading');
      }
    } else if (bg) {
      bg.remove();
      sl.classList.remove('img-loading');
    }
  }
}

function refresh() {
  NAMED_SLOTS.forEach(k => {
    setSlotDisplay(k);
    const sl = document.getElementById('sl-' + k);
    if (sl && !sl.dataset.dragReady) {
      const originalOnclick = sl.onclick;
      sl.onclick = () => { if (!wasDragging && originalOnclick) originalOnclick(); };
      makeSlotDraggable(sl, k);
      attachSlotPreview(sl, k);
      sl.dataset.dragReady = '1';
    }
  });
  refreshArmorStats(); // updates slot display + cartouches + fiche

  // mun
  const munEl = document.getElementById('sl-mun');
  if (munEl) {
    if (!munEl.dataset.previewReady) { attachSlotPreview(munEl, 'mun'); munEl.dataset.previewReady = '1'; }
    const mun = data.mun || {};
    const hasMun = !!(mun.nom);
    munEl.classList.toggle('filled', hasMun);
    if (hasMun) {
      munEl.style.cssText = 'border-right:none;border-radius:3px 0 0 3px;cursor:pointer;';
      munEl.innerHTML = '<span style="font-size:var(--fs-item-nom);color:var(--gold);">' + mun.nom + '</span>' + (mun.effet ? '<span style="font-size:var(--fs-item-effet);color:#7ab8d4;font-style:italic;display:block;margin-top:4px;">' + mun.effet + '</span>' : '');
    } else {
      munEl.textContent = 'Munitions';
    }
  }
  const mc = data._munCur, mm = data._munMax;
  const ci = document.getElementById('mun-cur'), mi = document.getElementById('mun-max');
  if (ci && mc != null) ci.value = mc; if (mi && mm != null) mi.value = mm;
  const bl = document.getElementById('bourse-label');
  if (bl) bl.value = data._bourseLabel || 'Bourse';
  buildBourseRows();
  if (typeof renderRingsSlot === 'function') renderRingsSlot();
  if (typeof renderProsthesesPanel === 'function') renderProsthesesPanel();
  if (typeof applyInventorySpecialLabels === 'function') applyInventorySpecialLabels();
}

function open_(key, speLabel) {
  if (window.__midjaasSpectatorActive) { toast(uiT('spectator.rightClickOnly','Mode spectateur : clic droit pour voir l’infobulle.')); return; }
  curSlot = key;
  const label = key.startsWith('bag_') ? 'Sac — Emplacement ' + (+key.split('_')[1] + 1)
    : key.startsWith('poche_') ? 'Poche ' + (+key.split('_')[1] + 1)
    : key.startsWith('spe_') ? (speLabel || 'Emplacement spécial')
    : key.startsWith('prothese_') ? (document.querySelector('#sl-' + key + ' .lbl')?.textContent || getInventorySpecialLabel('prostheses'))
    : getSlotLabel(key) || key;
  document.getElementById('modalTitle').textContent = label;
  const d = data[key] || {};
  document.getElementById('fNom').value = d.nom || '';
  document.getElementById('fType').value = d.type || '';
  document.getElementById('fEffet').value = d.effet || '';
  document.getElementById('fImg').value = d.img || '';
  // Armor stats — show toggle on all slots, load from object data
  const armorSection = document.getElementById('fArmorStats');
  if (armorSection) armorSection.style.display = '';
  const hasArmorStats = !!(d.armorStats);
  const toggleCb = document.getElementById('fArmorStatsToggle');
  if (toggleCb) toggleCb.checked = hasArmorStats;
  toggleArmorStatsSection(hasArmorStats, d.armorStats || {});
  _modalQuality = (d.quality !== undefined && d.quality !== null) ? d.quality : null;
  renderQualityBtns(_modalQuality);
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('fNom').focus(), 60);
}

function saveSlot() {
  if (curSortKey !== null) { saveSortSlot(); return; }
  if (curFreeType !== null) { saveFreeSlot(); return; }
  if (!curSlot) return;
  const nom   = document.getElementById('fNom').value.trim();
  const type  = document.getElementById('fType').value.trim();
  const effet = document.getElementById('fEffet').value.trim();
  const img   = document.getElementById('fImg').value.trim();
  const armorToggle = document.getElementById('fArmorStatsToggle');
  let armorStats = null;
  if (armorToggle?.checked) {
    armorStats = {};
    ARMOR_STATS.filter(s=>isArmorStatEnabled(s.key)).forEach(({ key: sk }) => {
      const inp = document.getElementById('farmor-'+sk);
      if (inp) armorStats[sk] = inp.value.trim();
    });
  }
  if (nom || type || effet || img || armorStats) {
    data[curSlot] = { nom, type, effet, img, quality: _modalQuality, armorStats };
  } else delete data[curSlot];
  persist();
  const k = curSlot;
  closeModal();
  if (k.startsWith('bag_') || k.startsWith('spe_')) { buildBag(); setTimeout(() => refreshArmorStats(), 0); }
  else if (k.startsWith('poche_')) buildPoche();
  else refresh(); // refresh already calls refreshArmorStats
  if (typeof renderRingsSlot === 'function') renderRingsSlot();
  if (typeof renderProsthesesPanel === 'function') renderProsthesesPanel();
  if (typeof renderProsthesesPanel === 'function') renderProsthesesPanel();
}

function clearSlot() {
  if (curSortKey !== null) {
    if (!data._sorts) data._sorts = {};
    if (!data._sorts[curSortKey]) data._sorts[curSortKey] = [];
    data._sorts[curSortKey][curSortIdx] = null;
    persist(); renderLivreSorts(); closeModal(); return;
  }
  if (curFreeType !== null) {
    if (curFreeType === 'coup') { if(data._coups) data._coups[curFreeIdx]=null; persist(); renderCoups(); }
    else { if(data._savoirs) data._savoirs[curFreeIdx]=null; persist(); renderSavoirs(); }
    curFreeType=null; curFreeIdx=null; closeModal(); return;
  }
  if (!curSlot) return;
  const k = curSlot;
  delete data[k]; persist();
  closeModal();
  if (k.startsWith('bag_') || k.startsWith('spe_')) buildBag();
  else if (k.startsWith('poche_')) buildPoche();
  else refresh();
  if (typeof renderRingsSlot === 'function') renderRingsSlot();
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('fTypeField').style.display  = '';
  document.getElementById('fEffetField').style.display = '';
  document.getElementById('fCoutField').style.display  = 'none';
  document.getElementById('fImgField').style.display   = '';
  document.getElementById('fImg').value = '';
  // Restore default modal labels
  const nomLabel   = document.querySelector('.modal .mfield:first-of-type label');
  const typeLabel  = document.querySelector('#fTypeField label');
  const effetLabel = document.querySelector('#fEffetField label');
  if (nomLabel)   nomLabel.textContent  = 'Nom';
  if (typeLabel)  typeLabel.textContent = 'Type';
  if (effetLabel) effetLabel.textContent = 'Effet / Description';
  curSlot = null; curSortKey = null; curSortIdx = null;
  curFreeType = null; curFreeIdx = null;
}
function bgClose(e) { if (e.target === document.getElementById('modalOverlay')) closeModal(); }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && document.getElementById('modalOverlay').classList.contains('open') && document.activeElement.tagName !== 'TEXTAREA') saveSlot();
});

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ══ CHAR LABELS ══ */
const CHAR_LABEL_DEFAULTS = {
  nom: 'Nom', race: 'Race', age: 'Âge Bio', naiss: 'Naissance',
  blessures: 'Blessures', minos: 'Pièce de Minos', infuse: 'Infusé ?'
};
function getCharLabel(key) { return data._charLabels?.[key] || CHAR_LABEL_DEFAULTS[key] || key; }
function saveCharLabel(key, val) {
  if (!data._charLabels) data._charLabels = {};
  data._charLabels[key] = val || CHAR_LABEL_DEFAULTS[key];
  persist(); applyCharLabels();
}
function applyCharLabels() {
  const map = {
    nom:      '[data-i18n-char="nom"]',
    race:     '[data-i18n-char="race"]',
    age:      '[data-i18n-char="age_bio"]',
    naiss:    '[data-i18n-char="naissance"]',
    blessures:'[data-i18n-char="blessures"]',
    infuse:   '[data-i18n-char="infuse"]',
  };
  Object.entries(map).forEach(([key, sel]) => {
    document.querySelectorAll(sel).forEach(el => { el.textContent = getCharLabel(key); });
  });
  // Minos labels (now spans)
  document.querySelectorAll('#inv-minos-lbl, #comp-minos-lbl').forEach(el => {
    el.textContent = getCharLabel('minos');
  });
}

function renderLevelParams() {
  const container = document.getElementById('cfg-levels-list');
  if (!container) return;
  container.innerHTML = '';
  const names = getLevelNames();
  const COLORS = LEVEL_COLORS_DEFAULT;
  names.forEach((name, i) => {
    const row = document.createElement('div');
    row.className = 'param-row';
    row.style.gap = '6px';

    const colorInp = document.createElement('input');
    colorInp.type = 'color';
    colorInp.value = data._levelColors?.[i] || COLORS[i];
    colorInp.style.cssText = 'width:28px;height:22px;border:1px solid var(--border2);border-radius:2px;cursor:pointer;padding:1px;flex-shrink:0;';
    colorInp.oninput = () => saveParamLevelColor(i, colorInp.value);

    const nameInp = document.createElement('input');
    nameInp.className = 'param-comp-input';
    nameInp.type = 'text';
    nameInp.value = name;
    nameInp.oninput = () => saveParamLevelName(i, nameInp.value);

    row.appendChild(colorInp);
    row.appendChild(nameInp);
    container.appendChild(row);
  });
}

/* ══ FONT SIZES ══ */
const FS_DEFAULTS = { nom: 14, type: 12, effet: 12 };
function saveFontSize(key, val) {
  if (!data._fontSizes) data._fontSizes = {};
  data._fontSizes[key] = Math.min(24, Math.max(8, parseInt(val)||FS_DEFAULTS[key]));
  persist(); applyFontSizes();
}
function applyFontSizes() {
  const fs = data._fontSizes || {};
  document.documentElement.style.setProperty('--fs-item-nom',   (fs.nom   || 14)+'px');
  document.documentElement.style.setProperty('--fs-item-type',  (fs.type  || 12)+'px');
  document.documentElement.style.setProperty('--fs-item-effet', (fs.effet || 12)+'px');
}
function resetFontSizes() {
  delete data._fontSizes; persist(); applyFontSizes();
  ['nom','type','effet'].forEach(k => {
    const el = document.getElementById('cfg-fs-'+k);
    if (el) el.value = FS_DEFAULTS[k];
  });
}

/* ══ BAG PARAMS ══ */
function getCustomBags() {
  return data._customBags || Object.entries(BAG_CONFIG).map(([key,cfg]) => ({
    key, label: { sacoche:'Sacoche', petit:'Petit sac', moyen:'Sac moyen', grand:'Grand sac' }[key] || key,
    norm: cfg.norm, spe: cfg.spe
  }));
}
function saveCustomBags(bags) { data._customBags = bags; persist(); updateBagSelect(); }
function getBagConfigDynamic() {
  const bags = getCustomBags();
  const sz = document.getElementById('bagSize')?.value;
  return bags.find(b=>b.key===sz) || bags[0] || { key:'sacoche', label:'Sacoche', norm:6, spe:0 };
}

function renderBagParams() {
  const container = document.getElementById('cfg-bags-list'); if(!container) return;
  container.innerHTML = '';
  const bags = getCustomBags();
  bags.forEach((bag, idx) => {
    const row = document.createElement('div');
    row.className = 'param-comp-row'; row.style.gap = '6px'; row.style.flexWrap = 'wrap';
    const nameInp = document.createElement('input');
    nameInp.className = 'param-comp-input'; nameInp.type='text'; nameInp.value=bag.label; nameInp.placeholder=bag.label||'Nom du sac'; nameInp.style.flex='1';
    nameInp.oninput = () => { bags[idx].label=nameInp.value; saveCustomBags(bags); };
    const normLbl = document.createElement('span'); normLbl.className='param-info'; normLbl.textContent='Empl.';
    const normInp = document.createElement('input');
    normInp.className='param-max-input'; normInp.type='number'; normInp.min='0'; normInp.value=bag.norm;
    normInp.oninput = () => { bags[idx].norm=parseInt(normInp.value)||0; saveCustomBags(bags); };
    const speLbl = document.createElement('span'); speLbl.className='param-info'; speLbl.textContent='Spé.';
    const speInp = document.createElement('input');
    speInp.className='param-max-input'; speInp.type='number'; speInp.min='0'; speInp.value=bag.spe;
    speInp.oninput = () => { bags[idx].spe=parseInt(speInp.value)||0; saveCustomBags(bags); };
    const del = document.createElement('button'); del.className='param-del-btn'; del.textContent='×';
    del.onclick = () => { bags.splice(idx,1); saveCustomBags(bags); renderBagParams(); };
    row.appendChild(nameInp); row.appendChild(normLbl); row.appendChild(normInp);
    row.appendChild(speLbl); row.appendChild(speInp); row.appendChild(del);
    container.appendChild(row);
  });
}

function addCustomBag() {
  const bags = getCustomBags();
  bags.push({ key: 'custom_'+Date.now(), label: 'Nouveau sac', norm: 8, spe: 1 });
  saveCustomBags(bags); renderBagParams(); updateBagSelect();
}

function updateBagSelect() {
  const sel = document.getElementById('bagSize'); if(!sel) return;
  const cur = sel.value;
  sel.innerHTML = '';
  getCustomBags().forEach(bag => {
    const o = document.createElement('option');
    o.value = bag.key;
    o.textContent = bag.label + ' (' + bag.norm + ' empl.' + (bag.spe>0?', '+bag.spe+' spé':'') + ')';
    if (bag.key === cur) o.selected = true;
    sel.appendChild(o);
  });
}

/* ══ SPE PARAMS ══ */
const SPE_DEFAULTS = [
  { label:'Tente', slots:0, noStorage:true },
  { label:'Sac de couchage', slots:0, noStorage:true },
  { label:'Marmite', slots:3, noStorage:false },
  { label:'Séchoir', slots:3, noStorage:false },
  { label:'Échelle Pliable', slots:0, noStorage:true },
  { label:'Porte Fioles', slots:3, noStorage:false },
  { label:'Porte Parchemins', slots:3, noStorage:false },
  { label:'Trousse de Soin', slots:3, noStorage:false },
  { label:'Sac de Rations', slots:3, noStorage:false },
  { label:"Sac d'Outils", slots:3, noStorage:false },
  { label:'Livre Inventaire', slots:0, isLivre:true },
  { label:'Autre', slots:1, noStorage:false },
];
function getCustomSpe() { return data._customSpe || SPE_DEFAULTS.map(s=>({...s})); }
function saveCustomSpe(spe) { data._customSpe = spe; persist(); }
function getSpeLabelList() { return getCustomSpe().map(s=>s.label); }

function renderSpeParams() {
  const container = document.getElementById('cfg-spe-list'); if(!container) return;
  container.innerHTML = '';
  const spe = getCustomSpe();
  spe.forEach((s, idx) => {
    const row = document.createElement('div');
    row.className='param-comp-row'; row.style.gap='6px'; row.style.flexWrap='wrap';
    const nameInp = document.createElement('input');
    nameInp.className='param-comp-input'; nameInp.type='text'; nameInp.value=s.label; nameInp.placeholder=s.label||"Nom de l'emplacement"; nameInp.style.flex='1';
    nameInp.oninput = () => { spe[idx].label=nameInp.value; saveCustomSpe(spe); };
    const slotsLbl = document.createElement('span'); slotsLbl.className='param-info'; slotsLbl.textContent='+empl.';
    const slotsInp = document.createElement('input');
    slotsInp.className='param-max-input'; slotsInp.type='number'; slotsInp.min='0'; slotsInp.value=s.slots||0;
    slotsInp.title = '0 = pas de stockage';
    slotsInp.oninput = () => { spe[idx].slots=parseInt(slotsInp.value)||0; spe[idx].noStorage=spe[idx].slots===0&&!spe[idx].isLivre; saveCustomSpe(spe); };
    const del = document.createElement('button'); del.className='param-del-btn'; del.textContent='×';
    del.onclick = () => { spe.splice(idx,1); saveCustomSpe(spe); renderSpeParams(); };
    row.appendChild(nameInp); row.appendChild(slotsLbl); row.appendChild(slotsInp); row.appendChild(del);
    container.appendChild(row);
  });
}

function addCustomSpe() {
  const spe = getCustomSpe();
  spe.push({ label:'Nouvel emplacement', slots:3, noStorage:false });
  saveCustomSpe(spe); renderSpeParams();
}

function saveEffetsPlus(val) {
  data._effetsPlus = val; persist(); applyEffetsPlus();
}
function applyEffetsPlus() {
  const app = document.querySelector('.app');
  if (app) app.classList.toggle('effets-plus', !!(data._effetsPlus));
  const cb = document.getElementById('cfg-effets-plus');
  if (cb) cb.checked = !!(data._effetsPlus);
}

/* ══ SLOT LABELS (inventaire) ══ */
function getSlotLabel(key) {
  return data._slotLabels?.[key] || LABELS[key] || key;
}
function saveSlotLabel(key, val) {
  if (!data._slotLabels) data._slotLabels = {};
  data._slotLabels[key] = val || LABELS[key] || key;
  persist();
  // Update displayed label in slot
  const el = document.querySelector('#sl-'+key+' .lbl');
  if (el) el.textContent = getSlotLabel(key);
  // Also update modal title if open
  if (curSlot === key) document.getElementById('modalTitle').textContent = getSlotLabel(key);
}
function applySlotLabels() {
  NAMED_SLOTS.forEach(k => {
    const el = document.querySelector('#sl-'+k+' .lbl');
    if (el) el.textContent = getSlotLabel(k);
  });
}

/* ══ FICHE SECTION LABELS ══ */
const FICHE_SECTION_DEFAULTS = {
  caractere: 'Caractère',
  physique:  'Physique',
  histoire:  'Histoire',
};
function getFicheSectionLabel(key) {
  return data._ficheSectionLabels?.[key] || FICHE_SECTION_DEFAULTS[key] || key;
}
function saveFicheSectionLabel(key, val) {
  if (!data._ficheSectionLabels) data._ficheSectionLabels = {};
  data._ficheSectionLabels[key] = val || FICHE_SECTION_DEFAULTS[key];
  persist(); applyFicheSectionLabels();
}
function applyFicheSectionLabels() {
  Object.keys(FICHE_SECTION_DEFAULTS).forEach(key => {
    document.querySelectorAll('[data-fiche-section="'+key+'"]').forEach(el => {
      el.textContent = getFicheSectionLabel(key);
    });
  });
}

/* ══ DYNAMIC QUALITIES ══ */
function addQuality() {
  if (!data._qualities) data._qualities = QUALITY_DEFAULTS.map(q=>({...q}));
  data._qualities.push({ key: 'q'+Date.now(), label: 'Nouvelle qualité', color: '#aaaaaa' });
  persist(); renderQualityParams();
}
function removeQuality(idx) {
  if (!data._qualities) data._qualities = QUALITY_DEFAULTS.map(q=>({...q}));
  if (data._qualities.length <= 1) return;
  data._qualities.splice(idx, 1);
  persist(); renderQualityParams(); applyAllQualityColors();
}

function renderQualityParams() {
  const container = document.getElementById('cfg-quality-list');
  if (!container) return;
  container.innerHTML = '';
  const qualities = data._qualities || QUALITY_DEFAULTS;
  qualities.forEach((q, idx) => {
    const def = QUALITY_DEFAULTS[idx] || {};
    const row = document.createElement('div');
    row.className = 'param-row'; row.style.gap = '6px';
    const colorInp = document.createElement('input');
    colorInp.type = 'color';
    colorInp.value = q.color || '#f0c040';
    colorInp.style.cssText = 'width:28px;height:22px;border:1px solid var(--border2);border-radius:2px;cursor:pointer;padding:1px;flex-shrink:0;';
    colorInp.oninput = () => saveQualityColor(idx, colorInp.value);
    const nameInp = document.createElement('input');
    nameInp.className = 'param-comp-input'; nameInp.type = 'text';
    nameInp.value = q.label; nameInp.placeholder = def.label || 'Qualité';
    nameInp.oninput = () => saveQualityLabel(idx, nameInp.value);
    const delBtn = document.createElement('button');
    delBtn.className = 'param-add-btn'; delBtn.textContent = '✕';
    delBtn.style.cssText = 'color:#f08080;flex-shrink:0;padding:2px 6px;';
    delBtn.onclick = () => removeQuality(idx);
    row.appendChild(colorInp); row.appendChild(nameInp); row.appendChild(delBtn);
    container.appendChild(row);
  });
  const addBtn = document.createElement('button');
  addBtn.className = 'param-add-btn'; addBtn.textContent = '+ Ajouter';
  addBtn.style.marginTop = '4px';
  addBtn.onclick = addQuality;
  container.appendChild(addBtn);
}

function renderSlotLabelParams() {
  const container = document.getElementById('cfg-slot-labels');
  if (!container) return;
  container.innerHTML = '';
  NAMED_SLOTS.forEach(k => {
    const row = document.createElement('div');
    row.className = 'param-row'; row.style.gap = '6px';
    const lbl = document.createElement('span');
    lbl.className = 'param-lbl'; lbl.style.cssText = 'min-width:90px;font-size:10px;color:var(--muted);';
    lbl.textContent = LABELS[k] || k;
    const inp = document.createElement('input');
    inp.className = 'param-comp-input'; inp.type = 'text';
    const def_k = LABELS[k] || k;
    inp.value = data._slotLabels?.[k] && data._slotLabels[k] !== def_k ? data._slotLabels[k] : '';
    inp.placeholder = def_k;
    inp.oninput = () => saveSlotLabel(k, inp.value);
    row.appendChild(lbl); row.appendChild(inp);
    container.appendChild(row);
  });
}

function renderFicheLabelParams() {
  const container = document.getElementById('cfg-fiche-labels');
  if (!container) return;
  container.innerHTML = '';
  Object.entries(FICHE_SECTION_DEFAULTS).forEach(([key, def]) => {
    const row = document.createElement('div');
    row.className = 'param-row'; row.style.gap = '6px';
    const lbl = document.createElement('span');
    lbl.className = 'param-lbl'; lbl.style.cssText = 'min-width:70px;font-size:11px;color:var(--muted);';
    lbl.textContent = def;
    const inp = document.createElement('input');
    inp.className = 'param-comp-input'; inp.type = 'text';
    inp.value = data._ficheSectionLabels?.[key] && data._ficheSectionLabels[key] !== def ? data._ficheSectionLabels[key] : '';
    inp.placeholder = def;
    inp.oninput = () => saveFicheSectionLabel(key, inp.value);
    row.appendChild(lbl); row.appendChild(inp);
    container.appendChild(row);
  });
}

/* ══ PAGE CAPITAL ══ */

function getCapBourseCount() { return getBourseCount(); }

function buildCapBourseRows() {
  const container = document.getElementById('cap-bourse-rows');
  if (!container) return;
  container.innerHTML = '';
  const lbl = document.getElementById('cap-bourse-label');
  if (lbl) lbl.textContent = data._bourseLabel || 'Bourse';
  const count = getBourseCount();
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.className = 'capital-wallet-row';
    const val = document.createElement('input');
    val.className = 'capital-wallet-inp'; val.type = 'text';
    val.placeholder = '0'; val.value = data['_bourseVal'+i] || '';
    val.oninput = () => { data['_bourseVal'+i] = val.value; persist(); syncBourseToInv(i); };
    const dev = document.createElement('input');
    dev.className = 'capital-wallet-dev'; dev.type = 'text';
    dev.placeholder = 'Đ'; dev.value = data['_bourseDevise'+i] || '';
    dev.oninput = () => { data['_bourseDevise'+i] = dev.value; persist(); syncBourseToInv(i); };
    row.appendChild(val); row.appendChild(dev);
    container.appendChild(row);
  }
}

function syncBourseToInv(i) {
  // Sync back to inventaire bourse rows
  buildBourseRows();
}

function buildCapBanqueRows() {
  const container = document.getElementById('cap-banque-rows');
  if (!container) return;
  container.innerHTML = '';
  const count = getBourseCount(); // same count as bourse for consistency
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.className = 'capital-wallet-row';
    const val = document.createElement('input');
    val.className = 'capital-wallet-inp'; val.type = 'text';
    val.placeholder = '0'; val.value = data['_banqueVal'+i] || '';
    val.oninput = () => { data['_banqueVal'+i] = val.value; persist(); };
    const dev = document.createElement('input');
    dev.className = 'capital-wallet-dev'; dev.type = 'text';
    dev.placeholder = 'Đ'; dev.value = data['_banqueDevise'+i] || '';
    dev.oninput = () => { data['_banqueDevise'+i] = dev.value; persist(); };
    row.appendChild(val); row.appendChild(dev);
    container.appendChild(row);
  }
}

function saveCapBanqueLabel(val) { data._banqueLabel = val; persist(); }

function saveCapWalletLabel(key, val) {
  if (key === 'bourse') {
    data._bourseLabel = val; persist();
    const el = document.getElementById('cap-bourse-label');
    if (el) el.textContent = val || 'Bourse';
    const invLbl = document.getElementById('bourse-label');
    if (invLbl) invLbl.value = val || 'Bourse';
  } else if (key === 'banque') {
    data._banqueLabel = val; persist();
    const el = document.getElementById('cap-banque-label');
    if (el) el.value = val || 'Compte en Banque';
  }
}

function saveCapLabelParam(cat, val) {
  saveCapLabel(cat, val);
  const el = document.getElementById('cap-label-'+cat);
  if (el) el.value = val || '';
}

function renderCapitalParams() {
  const b = document.getElementById('cfg-cap-bourse-label');
  if (b) b.value = data._bourseLabel || 'Bourse';
  const bk = document.getElementById('cfg-cap-banque-label');
  if (bk) bk.value = data._banqueLabel || 'Compte en Banque';
  ['possession','immobilier','commerce'].forEach(cat => {
    const inp = document.getElementById('cfg-cap-label-'+cat);
    if (inp) inp.value = getCapLabel(cat);
  });
}

function saveCapLabel(cat, val) {
  if (!data._capLabels) data._capLabels = {};
  data._capLabels[cat] = val; persist();
}

function getCapLabel(cat) {
  const defaults = { possession: 'Possessions', immobilier: 'Immobilier', commerce: 'Commerce' };
  return data._capLabels?.[cat] || defaults[cat] || cat;
}

function toggleCapAccordion(cat) {
  const el = document.getElementById('cap-acc-'+cat);
  if (el) el.classList.toggle('open');
}

function addCapItem(cat) {
  if (!data._capital) data._capital = {};
  if (!data._capital[cat]) data._capital[cat] = [];
  data._capital[cat].push({ nom: '', notes: '' });
  persist(); renderCapGrid(cat);
}

function removeCapItem(cat, idx) {
  if (data._capital?.[cat]) {
    data._capital[cat].splice(idx, 1);
    persist(); renderCapGrid(cat);
  }
}

function saveCapItem(cat, idx, field, val) {
  if (!data._capital) data._capital = {};
  if (!data._capital[cat]) data._capital[cat] = [];
  if (!data._capital[cat][idx]) data._capital[cat][idx] = {};
  data._capital[cat][idx][field] = val; persist();
}

function renderCapGrid(cat) {
  const grid = document.getElementById('cap-grid-'+cat);
  if (!grid) return;
  grid.innerHTML = '';
  const items = data._capital?.[cat] || [];
  items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'capital-card';
    const delBtn = document.createElement('button');
    delBtn.className = 'capital-card-del'; delBtn.textContent = '✕';
    delBtn.onclick = () => removeCapItem(cat, idx);
    const nameInp = document.createElement('input');
    nameInp.className = 'capital-card-name'; nameInp.type = 'text';
    nameInp.placeholder = 'Nom…'; nameInp.value = item.nom || '';
    nameInp.oninput = () => saveCapItem(cat, idx, 'nom', nameInp.value);
    const typeInp = document.createElement('input');
    typeInp.type = 'text'; typeInp.placeholder = 'Type…'; typeInp.value = item.type || '';
    typeInp.style.cssText = 'background:transparent;border:none;border-bottom:1px solid var(--border2);color:var(--muted);font-family:var(--font);font-size:11px;padding:2px 4px;width:100%;outline:none;box-sizing:border-box;letter-spacing:.3px;text-transform:uppercase;';
    typeInp.oninput = () => saveCapItem(cat, idx, 'type', typeInp.value);
    const locInp = document.createElement('input');
    locInp.type = 'text'; locInp.placeholder = 'Localisation…'; locInp.value = item.localisation || '';
    locInp.style.cssText = 'background:transparent;border:none;border-bottom:1px solid var(--border2);color:var(--muted);font-family:var(--font);font-size:11px;padding:2px 4px;width:100%;outline:none;box-sizing:border-box;margin-top:2px;';
    locInp.oninput = () => saveCapItem(cat, idx, 'localisation', locInp.value);
    const notesInp = document.createElement('textarea');
    notesInp.placeholder = 'Notes…'; notesInp.value = item.notes || '';
    notesInp.style.cssText = 'background:transparent;border:none;border-top:1px solid var(--border2);color:var(--text);font-family:var(--font);font-size:12px;padding:4px;width:100%;resize:none;min-height:40px;max-height:220px;overflow-y:auto;outline:none;box-sizing:border-box;white-space:pre-wrap;line-height:1.5;';
    notesInp.oninput = () => { saveCapItem(cat, idx, 'notes', notesInp.value); notesInp.style.height='auto'; notesInp.style.height=Math.min(notesInp.scrollHeight,220)+'px'; };
    // Initial resize on render
    setTimeout(() => { notesInp.style.height='auto'; notesInp.style.height=Math.min(notesInp.scrollHeight,220)+'px'; }, 0);
    card.appendChild(delBtn);
    card.appendChild(nameInp);
    card.appendChild(typeInp);
    card.appendChild(locInp);
    card.appendChild(notesInp);
    grid.appendChild(card);
  });
}

function renderCapital() {
  buildCapBourseRows();
  buildCapBanqueRows();
  // Restore labels
  const banqueLbl = document.getElementById('cap-banque-label');
  if (banqueLbl) banqueLbl.value = data._banqueLabel || 'Compte en Banque';
  ['possession','immobilier','commerce'].forEach(cat => {
    const inp = document.getElementById('cap-label-'+cat);
    if (inp) inp.value = getCapLabel(cat);
    renderCapGrid(cat);
  });
}

function syncBourseToCapital() { buildCapBourseRows(); }

function toggleAccordion(el) {
  el.closest('.param-accordion').classList.toggle('open');
}

function resetCharLabels() {
  delete data._charLabels; persist();
  renderParametres(); applyCharLabels();
}

/* ══ LEVEL CONFIG ══ */
const LEVEL_NAMES_DEFAULT = ['Novice','Adepte','Expert','Maître'];
const LEVEL_COLORS_DEFAULT = ['#3aaa3a','#c8922a','#2aaacc','#e02020'];
// Magic levels start at Adepte (index 1)
const MAGIC_COLORS_DEFAULT = ['#c8922a','#2aaacc','#e02020'];

function getLevelNames() {
  const names = data._levelNames || {};
  return LEVEL_NAMES_DEFAULT.map((d,i) => names[i] || d);
}
function getLevelColors(type) {
  const colors = data._levelColors || {};
  if (type === 'magic') {
    // magic = indices 1,2,3 of the full 4-level palette
    return [1,2,3].map(i => colors[i] || LEVEL_COLORS_DEFAULT[i]);
  }
  return LEVEL_COLORS_DEFAULT.map((d,i) => colors[i] || d);
}
function saveParamLevelName(idx, val) {
  if (!data._levelNames) data._levelNames = {};
  data._levelNames[idx] = val || LEVEL_NAMES_DEFAULT[idx]; persist();
  if (document.getElementById('page-competences')?.classList.contains('active')) renderCompetences();
}
function saveParamLevelColor(idx, val) {
  if (!data._levelColors) data._levelColors = {};
  data._levelColors[idx] = val; persist();
  if (document.getElementById('page-competences')?.classList.contains('active')) renderCompetences();
}
function resetLevelDefaults() {
  delete data._levelNames; delete data._levelColors; persist();
  renderParametres();
  if (document.getElementById('page-competences')?.classList.contains('active')) renderCompetences();
}

function syncMinos(val) {
  data._minos = val;
  ['inv-minos-cb','comp-minos-cb'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el !== document.activeElement) el.checked = val;
  });
  persist();
}

function saveMun() {
  const cur = document.getElementById('mun-cur').value;
  const max = document.getElementById('mun-max').value;
  if (cur !== '') data._munCur = cur; else delete data._munCur;
  if (max !== '') data._munMax = max; else delete data._munMax;
  persist();
}

function getBourseCount() {
  return data._bourseCount || 1;
}

function buildBourseRows() {
  const container = document.getElementById('bourse-rows');
  if (!container) return;
  container.innerHTML = '';
  const count = getBourseCount();
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:4px;align-items:center;' + (i > 0 ? 'margin-top:3px;border-top:1px solid var(--border2);padding-top:3px;' : '');
    const val = document.createElement('input');
    val.className = 'mun-input'; val.type = 'text';
    val.placeholder = '0'; val.style.width = '52px';
    val.value = data['_bourseVal'+i] || '';
    val.oninput = () => { data['_bourseVal'+i] = val.value; persist(); buildCapBourseRows?.(); };
    const dev = document.createElement('input');
    dev.className = 'mun-input'; dev.type = 'text';
    dev.placeholder = 'Đ'; dev.style.cssText = 'width:28px;border-left:1px solid var(--border2);padding-left:4px;';
    dev.value = data['_bourseDevise'+i] || '';
    dev.oninput = () => { data['_bourseDevise'+i] = dev.value; persist(); buildCapBourseRows?.(); };
    row.appendChild(val); row.appendChild(dev);
    container.appendChild(row);
  }
}

function saveBourseCount(n) {
  data._bourseCount = n; persist(); buildBourseRows();
  // Update param selector
  const sel = document.getElementById('cfg-bourse-count');
  if (sel) sel.value = n;
}

function saveBourse() {} // legacy no-op kept for safety
function saveBourseLabel(val) { data._bourseLabel = val; persist(); }

function loadChar() {
  const c = data._char || {};

  // IMPORTANT :
  // Il faut écrire une chaîne vide quand la valeur n'existe plus.
  // Sinon, après reset, les anciens textes restent visuellement dans
  // les cartouches Inventaire / Compétences.
  const f = (id, val) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = (val ?? '');
      if (typeof resizeCharInp === 'function') resizeCharInp(el);
    }
  };

  const fc = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  };

  // Inventaire cartouche
  f('char-nom', c.nom); f('char-age', c.age); f('char-naiss', c.naiss);
  f('char-pv', c.pv); f('char-pa', c.pa); f('char-ps', c.ps); f('char-pe', c.pe);
  f('char-race', c.race); f('char-dsnc', c.dsnc);
  f('char-pv-max', c['pv-max']); f('char-pa-max', c['pa-max']);
  f('char-ps-max', c['ps-max']); f('char-pe-max', c['pe-max']);
  f('char-dsnc-max', c['dsnc-max']);

  // Compétences cartouche
  f('comp-char-nom', c.nom); f('comp-char-age', c.age); f('comp-char-naiss', c.naiss);
  f('comp-char-pv', c.pv); f('comp-char-pa', c.pa); f('comp-char-ps', c.ps); f('comp-char-pe', c.pe);
  f('comp-char-race', c.race); f('comp-char-dsnc', c.dsnc);
  f('comp-char-pv-max', c['pv-max']); f('comp-char-pa-max', c['pa-max']);
  f('comp-char-ps-max', c['ps-max']); f('comp-char-pe-max', c['pe-max']);
  f('comp-char-dsnc-max', c['dsnc-max']);

  // Gender : si absent, on décoche bien tout après reset.
  document.querySelectorAll('input[name="inv-gender"]').forEach(r => r.checked = !!c.gender && r.value === c.gender);
  document.querySelectorAll('input[name="comp-gender"]').forEach(r => r.checked = !!c.gender && r.value === c.gender);
  document.querySelectorAll('input[name="fiche-gender"]').forEach(r => r.checked = !!c.gender && r.value === c.gender);

  applyStatSplits();
  fc('bl1', c.bl1); fc('bl2', c.bl2); fc('bl3', c.bl3);

  // Minos
  const ml = document.getElementById('inv-minos-lbl');
  if (ml) ml.textContent = getCharLabel('minos');
  const mc2 = document.getElementById('inv-minos-cb');
  if (mc2) mc2.checked = data._minos || false;

  // Bourse label
  const bl = document.getElementById('bourse-label');
  if (bl) bl.value = data._bourseLabel || 'Bourse';

  updateTbNom();
  setTimeout(() => resizeAllCartouche(), 50);
}

/* ══ PAGE NAVIGATION ══ */

function closeAllFloatingUI() {
  if (typeof closeRingsPanel === 'function') closeRingsPanel();
  if (typeof toggleProsthesesPanel === 'function') toggleProsthesesPanel(false);
}

function showPage(name) {
  closeAllFloatingUI();

  ['fiche','inventaire','competences','capital','campagne','parametres'].forEach(p => {
    const pageEl = document.getElementById('page-'+p);
    const navEl  = document.getElementById('nav-'+p);
    if (pageEl) pageEl.classList.toggle('active', p===name);
    if (navEl)  navEl.classList.toggle('active', p===name);
  });
  if (name === 'competences') renderCompetences();
  if (name === 'capital') renderCapital();
  if (name === 'parametres') renderParametres();
  if (name === 'fiche') renderFiche();


  if (name === 'campagne') { initCampaignInputs(); renderManagedCampaigns(); updateCampaignUi(); }

  if (name === 'inventaire' && typeof initInventoryRefactor === 'function') initInventoryRefactor();
}


/* ══ SYNC CHAR ══ */
const CHAR_FIELDS = ['nom','age','naiss','pv','pa','ps','pe','race','dsnc','pv-max','pa-max','ps-max','pe-max','dsnc-max'];

// X/X split support
function syncCharMax(stat, val) {
  if (!data._char) data._char = {};
  data._char[stat+'-max'] = val;
  ['char-'+stat+'-max','comp-char-'+stat+'-max'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el !== document.activeElement) el.value = val || '';
  });
  const ficheEl = document.getElementById('fiche-'+stat+'-max');
  if (ficheEl && ficheEl !== document.activeElement) ficheEl.value = val || '';
  persist();
}

function saveParamResSplit(stat, enabled) {
  if (!data._resSplit) data._resSplit = {};
  data._resSplit[stat] = enabled; persist();
  applyStatSplits();
  // Auto-resize all fiche inputs after render
  setTimeout(() => {
    document.querySelectorAll('#page-fiche .fiche-stat-inp').forEach(el => resizeFicheInp(el));
    resizeAllCartouche();
  }, 30);
}

function getResSplit(stat) {
  if (!data._resSplit || data._resSplit[stat] === undefined) return true; // all split by default
  return data._resSplit[stat];
}

function applyStatSplits() {
  ['pv','pa','ps','pe','dsnc'].forEach(stat => {
    const split = getResSplit(stat);
    // Cartouche inventaire
    const sl1 = document.getElementById('stat-slash-'+stat);
    const mx1 = document.getElementById('char-'+stat+'-max');
    if (sl1) sl1.style.display = split ? '' : 'none';
    if (mx1) mx1.style.display = split ? '' : 'none';
    // Cartouche compétences
    const sl2 = document.getElementById('stat-slash-'+stat+'2');
    const mx2 = document.getElementById('comp-char-'+stat+'-max');
    if (sl2) sl2.style.display = split ? '' : 'none';
    if (mx2) mx2.style.display = split ? '' : 'none';
    // Fiche perso
    const sl3 = document.getElementById('fiche-'+stat+'-slash');
    const mx3 = document.getElementById('fiche-'+stat+'-max');
    if (sl3) sl3.style.display = split ? '' : 'none';
    if (mx3) mx3.style.display = split ? '' : 'none';
    // Param checkbox
    const cb = document.getElementById('cfg-'+stat+'-split');
    if (cb) cb.checked = split;
  });
}


/* ══ ARMOR STATS ══ */
const ARMOR_STATS = [
  { key: 'poids',  defaultLabel: 'Poids',  defaultName: 'Poids' },
  { key: 'def',   defaultLabel: 'DEF',   defaultName: 'Défense' },
  { key: 'res',   defaultLabel: 'RES',   defaultName: 'Résistance' },
  { key: 'edpn',  defaultLabel: 'EDP-N', defaultName: 'EDP Normal' },
  { key: 'edpp',  defaultLabel: 'EDP-P', defaultName: 'EDP Perçant' },
  { key: 'edpm',  defaultLabel: 'EDP-M', defaultName: 'EDP Magique' },
  { key: 'edpl',  defaultLabel: 'EDP-L', defaultName: 'EDP Laser' },
];

function getArmorStatLabel(key) {
  return data._armorLabels?.[key] || ARMOR_STATS.find(s=>s.key===key)?.defaultLabel || key.toUpperCase();
}
function getArmorStatName(key) {
  return data._armorNames?.[key] || ARMOR_STATS.find(s=>s.key===key)?.defaultName || key;
}
function isArmorStatEnabled(key) {
  if (!data._armorEnabled || data._armorEnabled[key] === undefined) {
    return key !== 'edpl'; // EDP-L disabled by default
  }
  return data._armorEnabled[key];
}
function saveArmorStatLabel(key, val) {
  if (!data._armorLabels) data._armorLabels = {};
  data._armorLabels[key] = val || ARMOR_STATS.find(s=>s.key===key)?.defaultLabel;
  persist(); applyArmorStatLabels();
}
function saveArmorStatName(key, val) {
  if (!data._armorNames) data._armorNames = {};
  data._armorNames[key] = val;
  persist();
}
function saveArmorStatEnabled(key, val) {
  if (!data._armorEnabled) data._armorEnabled = {};
  data._armorEnabled[key] = val;
  persist(); refreshArmorStats();
}
function saveArmorStat(key, val) {
  if (!data.armure) data.armure = {};
  if (!data.armure.armorStats) data.armure.armorStats = {};
  data.armure.armorStats[key] = val; persist();
  refreshArmureSlotOnly();
}

function refreshArmureSlotOnly() {
  const armureEl = document.getElementById('sl-armure');
  if (!armureEl) return;
  const d = data.armure || {};
  const armorStats = d.armorStats || {};
  let inner = '';
  if (d.img) inner += `<div class="slot-img-bg" style="background-image:url('${d.img}');"></div>`;
  inner += `<span class="lbl" data-i18n="armure">Armure</span>`;
  inner += `<span class="val" id="dsp-armure-nom">${d.nom||'—'}</span>`;
  if (d.type)  inner += `<span class="val-type" id="dsp-armure-type">${d.type}</span>`;
  if (d.effet) inner += `<span class="val-effet" id="dsp-armure-effet">${d.effet}</span>`;
  if (d.armorStats) {
    const activeStats = ARMOR_STATS.filter(s=>isArmorStatEnabled(s.key));
    const hasValues = activeStats.some(s => armorStats[s.key]);
    if (hasValues) {
      inner += `<div class="armure-stats">`;
      activeStats.forEach(({ key }) => {
        const cur = armorStats[key] || '';
        if (cur) inner += `<span class="armure-stat"><span class="armure-stat-lbl">${getArmorStatLabel(key)}</span> <span class="armure-stat-val">${cur}</span></span>`;
      });
      inner += `</div>`;
    }
  }
  armureEl.innerHTML = inner;
}

function applyArmorStatLabels() {
  // Update all armor stat labels in cartouches, fiche, armure slot
  ARMOR_STATS.forEach(({ key }) => {
    const lbl = getArmorStatLabel(key);
    document.querySelectorAll('[data-armor-lbl="'+key+'"]').forEach(el => { el.textContent = lbl; });
  });
  refreshArmorStats();
}

function refreshArmorStats() {
  // Update armure slot display
  refreshArmureSlotOnly();
  // Update cartouche armor rows
  updateArmorCartouche();
  updateFicheArmorStats();
}

function updateArmorCartouche() {
  const armorStats = data.armure?.armorStats || {};
  ['inv-armor-stats','comp-armor-stats'].forEach(containerId => {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    if (!data.armure?.armorStats) return; // only show if armure slot has armor stats
    const isComp = containerId === 'comp-armor-stats';
    if (isComp) el.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;margin-top:4px;width:100%;';
    ARMOR_STATS.filter(s=>isArmorStatEnabled(s.key)).forEach(({ key }) => {
      const val = armorStats[key] || '';
      const wrap = document.createElement('span');
      wrap.className = 'armor-stat-cartouche';
      const w = Math.min(Math.max(3, val.length) + 2, 16) + 'ch';
      wrap.innerHTML = `<span class="char-lbl" data-armor-lbl="${key}">${getArmorStatLabel(key)}</span>
        <input class="char-input narrow stat-cur" style="width:${w};" type="text" value="${val}" placeholder="—" oninput="saveArmorStat('${key}',this.value)">`;
      el.appendChild(wrap);
    });
  });
}

function updateFicheArmorStats() {
  const el = document.getElementById('fiche-armor-stats');
  if (!el) return;
  el.innerHTML = '';
  const armorStats = data.armure?.armorStats;
  if (!armorStats) return; // only show if armure slot has armor stats
  const active = ARMOR_STATS.filter(s=>isArmorStatEnabled(s.key));
  const wFor = k => (['def','res','poids'].includes(k) ? '70px' : '42px');
  for (let i = 0; i < active.length; i += 2) {
    const row = document.createElement('div');
    row.className = 'fiche-row'; row.style.gap = '6px';
    const a = active[i];
    row.innerHTML = `<span class="fiche-lbl" data-armor-lbl="${a.key}" style="font-size:13px;">${getArmorStatLabel(a.key)}</span>
      <input class="fiche-stat-inp" style="width:${wFor(a.key)};" type="text" value="${armorStats[a.key]||''}" placeholder="—" oninput="saveArmorStat('${a.key}',this.value)">`;
    if (active[i+1]) {
      const b = active[i+1];
      row.innerHTML += `<span class="fiche-sep" style="margin:0 4px;">|</span>
        <span class="fiche-lbl" data-armor-lbl="${b.key}" style="font-size:13px;">${getArmorStatLabel(b.key)}</span>
        <input class="fiche-stat-inp" style="width:${wFor(b.key)};" type="text" value="${armorStats[b.key]||''}" placeholder="—" oninput="saveArmorStat('${b.key}',this.value)">`;
    }
    el.appendChild(row);
  }
}

function renderArmorParams() {
  const container = document.getElementById('cfg-armor-stats');
  if (!container) return;
  container.innerHTML = '';
  ARMOR_STATS.forEach(({ key, defaultLabel, defaultName }) => {
    const row = document.createElement('div');
    row.className = 'param-row';
    row.style.gap = '6px';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.className = 'blessure-cb'; cb.checked = isArmorStatEnabled(key);
    cb.title = 'Activer'; cb.onchange = () => saveArmorStatEnabled(key, cb.checked);
    const nameInp = document.createElement('input');
    nameInp.className = 'param-input param-input-wide'; nameInp.type = 'text';
    nameInp.placeholder = defaultName;
    nameInp.value = data._armorNames?.[key] && data._armorNames[key] !== defaultName ? data._armorNames[key] : '';
    nameInp.oninput = () => saveArmorStatName(key, nameInp.value);
    const lblInp = document.createElement('input');
    lblInp.className = 'param-input'; lblInp.type = 'text'; lblInp.style.width = '60px';
    lblInp.placeholder = defaultLabel;
    lblInp.value = data._armorLabels?.[key] && data._armorLabels[key] !== defaultLabel ? data._armorLabels[key] : '';
    lblInp.oninput = () => saveArmorStatLabel(key, lblInp.value);
    row.appendChild(cb); row.appendChild(nameInp); row.appendChild(lblInp);
    container.appendChild(row);
  });
}

/* ══ SLOT PREVIEW ══ */
let previewTimer = null;

function showSlotPreview(e, slotData, armorStats) {
  e.preventDefault();
  if (!slotData?.nom) return;
  const pv = document.getElementById('slot-preview');
  document.getElementById('sp-nom').textContent = slotData.nom || '';
  document.getElementById('sp-type').textContent = slotData.type || '';
  document.getElementById('sp-effet').textContent = slotData.effet || '';
  // Background image
  const bg = document.getElementById('sp-bg');
  bg.style.backgroundImage = slotData.img ? `url('${slotData.img}')` : '';
  // Armor stats
  const statsEl = document.getElementById('sp-armor-stats');
  statsEl.innerHTML = '';
  if (armorStats) {
    ARMOR_STATS.filter(s=>isArmorStatEnabled(s.key)&&armorStats[s.key]).forEach(({key})=>{
      const s = document.createElement('div');
      s.className = 'sp-armor-stat';
      s.innerHTML = getArmorStatLabel(key)+'<span>'+armorStats[key]+'</span>';
      statsEl.appendChild(s);
    });
  }
  // Position near cursor, keep on screen
  pv.style.display = 'block';
  const margin = 16;
  let x = e.clientX + margin;
  let y = e.clientY + margin;
  if (x + 420 > window.innerWidth)  x = e.clientX - 420 - margin;
  if (y + pv.offsetHeight > window.innerHeight) y = e.clientY - pv.offsetHeight - margin;
  pv.style.left = Math.max(8, x) + 'px';
  pv.style.top  = Math.max(8, y) + 'px';
}

function hideSlotPreview() {
  document.getElementById('slot-preview').style.display = 'none';
}

function attachSlotPreview(el, key) {
  el.addEventListener('contextmenu', e => e.preventDefault()); // block browser menu
  el.addEventListener('mousedown', e => {
    if (e.button !== 2) return;
    e.preventDefault();
    const d = data[key] || {};
    showSlotPreview(e, d, d.armorStats || null); document.querySelector('.slot-preview')?.style?.setProperty('z-index','9999');
  });
  el.addEventListener('mouseup', e => { if (e.button === 2) hideSlotPreview(); });
  el.addEventListener('mouseleave', hideSlotPreview);
}

function resizeFicheNom(el) {
  el.style.height = 'auto';
  const scrollH = el.scrollHeight;
  const lineH = parseInt(getComputedStyle(el).lineHeight) || 28;
  const maxH = lineH * 3 + 16;
  el.style.height = Math.min(scrollH, maxH) + 'px';
  el.style.overflowY = scrollH > maxH ? 'auto' : 'hidden';
}

function resizeFicheInp(el) {
  const len = Math.max(2.5, (el.value || '').length);
  el.style.width = Math.min(len + 3.5, 16) + 'ch';
}

function resizeCharInp(el) {
  const len = Math.max(2.5, (el.value || '').length);
  const isWide = el.classList.contains('wide');
  // Les champs du cartouche s'agrandissent avec le texte au lieu de couper.
  // Wide = nom/race/naissance, Narrow = stats.
  const max = isWide ? 80 : 28;
  el.style.width = Math.min(len + 3.5, max) + 'ch';
}

function resizeArmorInp(el) {
  const len = Math.max(3, (el.value || '').length);
  el.style.width = Math.min(len + 2, 16) + 'ch';
}

// Auto-resize handlers
document.addEventListener('input', e => {
  if (e.target.classList.contains('fiche-stat-inp')) resizeFicheInp(e.target);
  if (e.target.closest('#inv-armor-stats, #comp-armor-stats')) resizeArmorInp(e.target);
  if (e.target.classList.contains('char-input')) resizeCharInp(e.target);
});

function resizeAllCartouche() {
  document.querySelectorAll('.char-input').forEach(el => resizeCharInp(el));
  document.querySelectorAll('#inv-armor-stats input, #comp-armor-stats input').forEach(el => resizeArmorInp(el));
}

/* ══ QUALITY / RARITY ══ */
const QUALITY_DEFAULTS = [
  { key: 'bad',    label: 'Mauvaise', color: '#808080' },
  { key: 'common', label: 'Commune',  color: null },      // null = default slot color
  { key: 'high',   label: 'Haute',    color: '#2aaacc' },
  { key: 'master', label: 'Maître',   color: '#e02020' },
];

function getQuality(idx) {
  const q = data._qualities?.[idx];
  const def = QUALITY_DEFAULTS[idx];
  return { label: q?.label || def.label, color: q?.color !== undefined ? q.color : def.color };
}
function saveQualityLabel(idx, val) {
  if (!data._qualities) data._qualities = QUALITY_DEFAULTS.map(q=>({...q}));
  if (!data._qualities[idx]) data._qualities[idx] = {...QUALITY_DEFAULTS[idx]};
  data._qualities[idx].label = val; persist();
  // Don't re-render (would lose focus) — just update quality buttons if modal open
  if (document.getElementById('modalOverlay')?.classList.contains('open')) {
    renderQualityBtns(_modalQuality);
  }
}
function saveQualityColor(idx, val) {
  if (!data._qualities) data._qualities = QUALITY_DEFAULTS.map(q=>({...q}));
  if (!data._qualities[idx]) data._qualities[idx] = {...QUALITY_DEFAULTS[idx]};
  data._qualities[idx].color = val; persist(); applyAllQualityColors();
  if (document.getElementById('modalOverlay')?.classList.contains('open')) {
    renderQualityBtns(_modalQuality);
  }
}
function applyAllQualityColors() {
  // Update border colors on all slots that have a quality set
  NAMED_SLOTS.forEach(k => {
    const d = data[k];
    if (d?.quality !== undefined && d.quality !== null) {
      const sl = document.getElementById('sl-'+k);
      if (sl) applyQualityColor(sl, d.quality);
    }
  });
  // Bag and poche slots
  document.querySelectorAll('[data-bag-quality],[data-poche-quality]').forEach(sl => {
    const qi = parseInt(sl.dataset.bagQuality ?? sl.dataset.pocheQuality);
    if (!isNaN(qi)) applyQualityColor(sl, qi);
  });
}
function applyQualityColor(el, qualityIdx) {
  if (qualityIdx === null || qualityIdx === undefined || qualityIdx === '') {
    el.style.borderColor = ''; return;
  }
  const q = getQuality(qualityIdx);
  el.style.borderColor = q.color || '';
}

function renderQualityBtns(currentQuality) {
  const container = document.getElementById('fQualityBtns');
  if (!container) return;
  container.innerHTML = '';
  const qualities = data._qualities || QUALITY_DEFAULTS;
  // None option
  const noneBtn = document.createElement('button');
  noneBtn.textContent = '—';
  noneBtn.className = 'btn';
  noneBtn.style.cssText = 'padding:4px 10px;font-size:11px;opacity:' + (currentQuality == null ? '1' : '.5');
  noneBtn.onclick = (e) => { e.preventDefault(); setModalQuality(null); };
  container.appendChild(noneBtn);
  qualities.forEach((_, idx) => {
    const q = getQuality(idx);
    const btn = document.createElement('button');
    btn.textContent = q.label;
    btn.className = 'btn';
    const isActive = currentQuality === idx;
    btn.style.cssText = `padding:4px 10px;font-size:11px;border-color:${q.color||'var(--border)'};color:${q.color||'var(--gold)'};opacity:${isActive?'1':'.5'};`;
    if (isActive) btn.style.background = 'rgba('+hexToRgbStr(q.color||'#f0c040')+',0.15)';
    btn.onclick = (e) => { e.preventDefault(); setModalQuality(idx); };
    container.appendChild(btn);
  });
}

let _modalQuality = null;
function setModalQuality(idx) {
  _modalQuality = idx;
  renderQualityBtns(idx);
}

function hexToRgbStr(hex) {
  if (!hex || hex[0]!=='#') return '255,255,255';
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return r+','+g+','+b;
}


function toggleArmorStatsSection(show, existingStats) {
  const list = document.getElementById('fArmorStatsList');
  if (!list) return;
  list.style.display = show ? 'flex' : 'none';
  list.style.flexDirection = 'column';
  if (show && list.children.length === 0) {
    // Build inputs
    ARMOR_STATS.filter(s=>isArmorStatEnabled(s.key)).forEach(({ key: sk }) => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:center;gap:6px;';
      const val = existingStats?.[sk] || '';
      wrap.innerHTML = `<label style="font-size:11px;color:var(--muted);white-space:nowrap;min-width:42px;">${getArmorStatLabel(sk)}</label>
        <input type="text" id="farmor-${sk}" value="${val}" placeholder="—"
          style="flex:1;background:var(--bg3);border:1.5px solid var(--border2);color:var(--gold);font-family:var(--font);font-size:12px;padding:3px 6px;border-radius:3px;outline:none;">`;
      list.appendChild(wrap);
    });
  } else if (!show) {
    list.innerHTML = ''; // clear when hidden so they rebuild fresh next time
  }
}

function syncChar(field, val) {
  if (!data._char) data._char = {};
  data._char[field] = val;
  // Sync cartouche panels
  ['char-'+field, 'comp-char-'+field].forEach(id => {
    const el = document.getElementById(id);
    if (el && el !== document.activeElement) { el.value = val; resizeCharInp(el); }
  });
  // Sync fiche perso inputs
  const ficheMap = { nom:'fiche-nom-inp', race:'fiche-race-inp', age:'fiche-age-inp', naiss:'fiche-naiss-inp', pv:'fiche-pv', pa:'fiche-pa', pe:'fiche-pe', ps:'fiche-ps', dsnc:'fiche-dsnc' };
  if (ficheMap[field]) {
    const el = document.getElementById(ficheMap[field]);
    if (el && el !== document.activeElement) {
      el.value = val || '';
      if (field === 'nom') resizeFicheNom(el);
      else resizeFicheInp(el);
    }
  }
  if (field === 'nom') {
    updateTbNom();
  }
  if (document.getElementById('page-fiche')?.classList.contains('active')) {
    // only re-render non-input parts
    const infCb = document.getElementById('fiche-infuse-cb');
    if (infCb) infCb.checked = data._infuse || false;
  }
  persist();
}

function updateTbNom() {
  const el = document.getElementById('tb-fiche-nom');
  if (!el) return;
  const nom = (data._char && data._char.nom) ? data._char.nom : '';
  const prefix = (typeof t === 'function') ? t('top.sheetOf', 'Fiche de') : 'Fiche de';
  const empty = (typeof t === 'function') ? t('top.sheetOfEmpty', 'Fiche de —') : 'Fiche de —';
  el.textContent = nom ? `${prefix} ${nom}` : empty;
}

function syncGender(val) {
  if (!data._char) data._char = {};
  data._char.gender = val;
  // sync both radio groups
  document.querySelectorAll('input[name="inv-gender"]').forEach(r => r.checked = r.value === val);
  document.querySelectorAll('input[name="comp-gender"]').forEach(r => r.checked = r.value === val);
  persist();
}
function syncBl(n, val) {
  if (!data._char) data._char = {};
  data._char['bl'+n] = val;
  ['bl'+n,'comp-bl'+n].forEach(id => {
    const el = document.getElementById(id);
    if (el && el !== document.activeElement) el.checked = val;
  });
  persist();
}
function loadCompChar() {
  const c = data._char || {};
  CHAR_FIELDS.forEach(f => {
    const el = document.getElementById('comp-char-'+f);
    if (el && c[f] != null) el.value = c[f];
  });
  [1,2,3].forEach(n => {
    const el = document.getElementById('comp-bl'+n);
    if (el && c['bl'+n] != null) el.checked = c['bl'+n];
  });
  if (c.gender) {
    document.querySelectorAll('input[name="comp-gender"]').forEach(r => r.checked = r.value === c.gender);
  }
  const infuse = data._infuse || false;
  const cb = document.getElementById('infuse-cb');
  if (cb) cb.checked = infuse;
  // minos
  const ml = document.getElementById('comp-minos-lbl');
  if (ml) ml.textContent = getCharLabel('minos');
  const mc2 = document.getElementById('comp-minos-cb');
  if (mc2) mc2.checked = data._minos || false;
}

function toggleInfuse(val) {
  data._infuse = val;
  persist();
  // sync all checkboxes
  ['infuse-cb','inv-infuse-cb','fiche-infuse-cb'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el !== document.activeElement) el.checked = val;
  });
  // PS fields — cartouches
  [['comp-char-ps','ps-lbl'],['char-ps','inv-ps-lbl']].forEach(([inp,lbl]) => {
    const i = document.getElementById(inp);
    const l = document.getElementById(lbl);
    const iMax = document.getElementById(inp+'-max');
    const sl = inp==='char-ps' ? document.getElementById('stat-slash-ps') : document.getElementById('stat-slash-ps2');
    if (i) { i.disabled = !val; i.style.opacity = val?'1':'.4'; }
    if (iMax) { iMax.disabled = !val; iMax.style.opacity = val?'1':'.4'; }
    if (sl) sl.style.opacity = val?'1':'.4';
    if (l) l.style.opacity = val?'1':'.4';
  });
  // PS — fiche perso
  const fichePsInp = document.getElementById('fiche-ps');
  const fichePsMax = document.getElementById('fiche-ps-max');
  const fichePsLbl = document.getElementById('fiche-ps-lbl');
  if (fichePsInp) { fichePsInp.disabled = !val; fichePsInp.style.opacity = val?'1':'.4'; }
  if (fichePsMax) { fichePsMax.disabled = !val; fichePsMax.style.opacity = val?'1':'.4'; }
  if (fichePsLbl) fichePsLbl.style.opacity = val?'1':'.4';
  // magic rows
  document.querySelectorAll('#list-magiques .skill-dd-row').forEach(row => {
    row.classList.toggle('disabled', !val);
  });
}

/* ══ COMPETENCES DATA ══ */
// Base arrays (FR) — actual rendering uses t() versions
const COMP_PRINCIPALES = ['Identification','Marchandage','Désamorçage','Vol à la tire','Médecine','Artisanat / Réparation','Alchimie','Chasse / Pistage','Dressage','Acrobaties','Cuisine'];
const COMP_SECONDAIRES = ['Équitation','Navigation','Ambidextrie','Musculation','Méditation','Athlétisme','Apprentissage'];
const COMP_MARTIALES   = ['Dagues','Pugilat','Escrime','Hache','Contondant','Bâton','Hast','Fouet','Armes de lancer','Archerie','Armes à feu','Frondes','Armes à Énergie','Bouclier'];
const COMP_MAGIQUES    = ['Magie du Feu','Magie de l\'Air','Magie de l\'Eau','Magie de la Terre','Magie de l\'Âme','Magie de l\'Esprit','Magie du Corps','Magie du Psionisme','Magie de la Lumière','Magie de l\'Ombre','Magie du Vide','Magie de la Création'];
const LEVELS_STD   = ['Novice','Adepte','Expert','Maître'];
const LEVELS_MAGIC = ['Adepte','Expert','Maître'];

// Get localized arrays — keys stay FR-based (for data storage), labels are localized
// Localized display names — index matches base arrays
function getLocalizedName(baseArr, localArr, frName) {
  const idx = baseArr.indexOf(frName);
  return (localArr && idx >= 0) ? localArr[idx] : frName;
}

function getCompData(key)      { return (data._comp && data._comp[key]) || 0; }
function setCompData(key, val) { if(!data._comp)data._comp={}; data._comp[key]=val; persist(); }

/* Apprentissage level → extra principale slots: Novice+1, Adepte+2, Expert+3, Maître+3 */
function getMaxPrincipales() {
  const base = getMaxForCat('pri'); // 0 = unlimited
  const secArr = getCompArray('sec');
  let appLvl = getCompData('sec_Apprentissage');
  if (!appLvl) {
    const baseIdx = COMP_SECONDAIRES.indexOf('Apprentissage');
    if (baseIdx >= 0 && secArr[baseIdx]) appLvl = getCompData('sec_' + secArr[baseIdx]);
  }
  const bonus = appLvl >= 3 ? 3 : appLvl;
  if (base === 0) return 9999; // unlimited
  return base + bonus;
}
function countPrincipales() {
  return getCompArray('pri').filter(n => getCompData('pri_'+n) > 0).length;
}
function getUsedMagiques() {
  return getCompArray('mag').filter(n => getCompData('mag_'+n) > 0);
}

/* Make a dropdown skill row with level boxes */
function makeDropdownRow(prefix, allOptions, levels, isMagic, container) {
  // Use localized names only if using base arrays; custom arrays use their own names
  const hasCustom = !!(data._customComp && data._customComp[
    prefix==='pri_'?'pri':prefix==='sec_'?'sec':prefix==='mar_'?'mar':prefix==='mag_'?'mag':''
  ]);
  const localArr = hasCustom ? allOptions
    : isMagic ? (I18N[currentLang]?.comp_mag || allOptions)
    : prefix === 'pri_' ? (I18N[currentLang]?.comp_pri || allOptions)
    : prefix === 'sec_' ? (I18N[currentLang]?.comp_sec || allOptions)
    : prefix === 'mar_' ? (I18N[currentLang]?.comp_mar || allOptions)
    : allOptions;

  const used = allOptions.filter(n => getCompData(prefix+n) > 0);
  const isMain = (prefix === 'pri_');
  const cat = prefix==='pri_'?'pri':prefix==='sec_'?'sec':prefix==='mar_'?'mar':'mag';
  const catMax = getMaxForCat(cat); // 0 = unlimited
  const hardMax = isMain ? getMaxPrincipales() : (catMax > 0 ? catMax : allOptions.length);
  const remaining = hardMax - used.length;

  const baseEmpty = used.length === 0 ? Math.min(3, remaining) : (remaining > 0 ? 1 : 0);
  const emptyCount = Math.max(0, baseEmpty);

  container.innerHTML = '';
  used.forEach(name => addSkillRow(prefix, name, levels, isMagic, allOptions, localArr, container));
  for (let i = 0; i < emptyCount; i++) {
    addSkillRow(prefix, null, levels, isMagic, allOptions, localArr, container);
  }
  if (used.length === 0 && emptyCount === 0) {
    const msg = document.createElement('div');
    msg.style.cssText = 'font-size:11px;color:var(--dim);font-style:italic;padding:4px 8px;';
    msg.textContent = isMagic ? (data._infuse ? (currentLang==='en'?'Max reached':'Max atteint') : t('comp_magiques_sub')) : (currentLang==='en'?'Maximum reached':'Maximum atteint');
    container.appendChild(msg);
  }
}

function addSkillRow(prefix, selectedName, levels, isMagic, allOptions, localArr, container) {
  const row = document.createElement('div');
  const infuse = data._infuse || false;
  row.className = 'skill-dd-row' + (selectedName ? ' has-skill' : '') + (isMagic && !infuse ? ' disabled' : '');

  const sel = document.createElement('select');
  sel.className = 'skill-dd';

  const blank = document.createElement('option');
  blank.value = ''; blank.textContent = t('choisir');
  if (!selectedName) blank.selected = true;
  sel.appendChild(blank);

  const usedByOthers = allOptions.filter(n => getCompData(prefix+n) > 0 && n !== selectedName);
  allOptions.forEach((n, idx) => {
    if (usedByOthers.includes(n)) return;
    const o = document.createElement('option');
    o.value = n; // always store FR key
    o.textContent = (localArr && localArr[idx]) ? localArr[idx] : n;
    if (n === selectedName) o.selected = true;
    sel.appendChild(o);
  });

  sel.onchange = () => {
    const newVal = sel.value;
    if (prefix === 'pri_' && newVal) {
      const max = getMaxPrincipales();
      if (countPrincipales() >= max && !selectedName) {
        toast('Maximum atteint ('+max+' comp. principales)');
        sel.value = selectedName || ''; return;
      }
    }
    if (selectedName) setCompData(prefix+selectedName, 0);
    if (newVal) setCompData(prefix+newVal, 1);
    renderCompetences();
  };
  row.appendChild(sel);

  if (selectedName) {
    const cat = prefix==='pri_'?'pri':prefix==='sec_'?'sec':prefix==='mar_'?'mar':'mag';
    if (isCustomFree(cat)) {
      // Free text input
      const freeInp = document.createElement('input');
      freeInp.type = 'text'; freeInp.placeholder = '—';
      freeInp.style.cssText = 'width:80px;background:transparent;border:none;border-bottom:1px solid var(--border2);color:var(--gold);font-family:var(--font);font-size:12px;text-align:center;outline:none;flex-shrink:0;';
      const freeKey = 'compfree_'+prefix+selectedName;
      freeInp.value = data._compFree?.[freeKey] || '';
      freeInp.oninput = (e) => { e.stopPropagation(); if(!data._compFree)data._compFree={}; data._compFree[freeKey]=freeInp.value; persist(); };
      row.appendChild(freeInp);
    } else {
      const lvlWrap = document.createElement('div');
      lvlWrap.className = 'level-sel';
      const cur = getCompData(prefix+selectedName);
      const palette = isMagic ? getLevelColors('magic') : getLevelColors('std');
      const litColor = cur > 0 ? (palette[cur-1] || palette[palette.length-1]) : null;
      levels.forEach((lvlName, i) => {
        const box = document.createElement('div');
        box.className = 'lvl-box'; box.setAttribute('data-tip', lvlName);
        const boxIdx = i + 1;
        if (cur >= boxIdx && litColor) { box.classList.add('lit'); box.style.background = litColor; box.style.borderColor = litColor; }
        box.onclick = (e) => { e.stopPropagation(); const newLvl=(cur===boxIdx)?0:boxIdx; setCompData(prefix+selectedName,newLvl===0?1:newLvl); renderCompetences(); };
        lvlWrap.appendChild(box);
      });
      row.appendChild(lvlWrap);
    }
  }
  container.appendChild(row);
}

/* Livre de sorts */
function renderLivreSorts() {
  const body = document.getElementById('livre-sorts-body');
  if (!body) return;
  body.innerHTML = '';
  body.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;align-items:start;';
  const magiesApprises = getUsedMagiques();
  if (magiesApprises.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:12px;color:var(--dim);font-style:italic;grid-column:1/-1;';
    empty.textContent = 'Aucune magie apprise.';
    body.appendChild(empty);
    return;
  }
  magiesApprises.forEach(magie => {
    const key = 'sorts_' + magie;
    if (!data._sorts) data._sorts = {};
    if (!data._sorts[key]) data._sorts[key] = [];

    const sec = document.createElement('div');
    sec.className = 'sort-section';
    const title = document.createElement('div');
    title.className = 'sort-section-title';
    title.textContent = magie;
    sec.appendChild(title);

    const sorts = data._sorts[key];
    const filled = sorts.filter(s => s && s.nom);
    const maxSorts = getMaxForCat('livre'); // 0 = unlimited
    const hard = maxSorts > 0 ? maxSorts : 9999;
    const showCount = Math.max(3, Math.min(filled.length + 1, hard + 1));

    for (let i = 0; i < showCount; i++) {
      const s = sorts[i] || {};
      const cell = document.createElement('div');
      cell.className = 'free-cell' + (s.nom ? ' filled' : '');
      if (s.nom) {
        cell.innerHTML = `
          <span class="fc-nom">${s.nom}</span>
          ${s.type  ? `<span class="fc-type">${s.type}</span>`  : ''}
          ${s.effet ? `<span class="fc-effet">${s.effet}</span>` : ''}
          ${s.cout  ? `<span class="fc-cout">Coût : ${s.cout}</span>` : ''}
        `;
      } else {
        cell.innerHTML = '<span class="fc-lbl" style="color:var(--dim);font-style:italic;">Emplacement sort…</span>';
      }
      cell.onclick = () => { if (!wasDragging) openSortModal(key, i, s); };
      makeFreecelDraggable(cell, i, 'sort', key);
      applyQualityColor(cell, s.quality !== undefined ? s.quality : null);
      cell.addEventListener('contextmenu', e => e.preventDefault());
      cell.addEventListener('mousedown', e => { if (e.button===2) { e.preventDefault(); showSlotPreview(e, s, null); } });
      cell.addEventListener('mouseup', e => { if (e.button===2) hideSlotPreview(); });
      cell.addEventListener('mouseleave', hideSlotPreview);
      sec.appendChild(cell);
    }
    body.appendChild(sec);
  });
}

/* Sort modal — full Sort/Niveau/Effet */
function openSortModal(key, idx, current) {
  curSortKey = key; curSortIdx = idx; curSlot = null; curFreeType = null;
  document.getElementById('modalTitle').textContent = 'Sort';
  document.getElementById('fNom').value   = current.nom   || '';
  document.getElementById('fTypeField').style.display  = '';
  document.getElementById('fEffetField').style.display = '';
  document.getElementById('fCoutField').style.display  = '';
  document.getElementById('fImgField').style.display   = 'none';
  document.getElementById('fArmorStats').style.display = 'none';
  document.getElementById('fType').value  = current.type  || '';
  document.getElementById('fEffet').value = current.effet || '';
  document.getElementById('fCout').value  = current.cout  || '';
  const typeLabel = document.querySelector('#fTypeField label');
  const effetLabel = document.querySelector('#fEffetField label');
  const coutLabel  = document.querySelector('#fCoutField label');
  const nomLabel = document.querySelector('.modal .mfield:first-of-type label');
  if (nomLabel)   nomLabel.textContent  = 'Sort';
  if (typeLabel)  typeLabel.textContent = 'Niveau du sort';
  if (effetLabel) effetLabel.textContent = 'Effet';
  if (coutLabel)  coutLabel.textContent  = 'Coût';
  _modalQuality = current.quality !== undefined ? current.quality : null;
  renderQualityBtns(_modalQuality);
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('fNom').focus(), 60);
}

function saveSortSlot() {
  if (curSortKey === null) return;
  const nom   = document.getElementById('fNom').value.trim();
  const type  = document.getElementById('fType').value.trim();
  const effet = document.getElementById('fEffet').value.trim();
  const cout  = document.getElementById('fCout').value.trim();
  if (!data._sorts) data._sorts = {};
  if (!data._sorts[curSortKey]) data._sorts[curSortKey] = [];
  data._sorts[curSortKey][curSortIdx] = (nom||type||effet||cout) ? { nom, type, effet, cout, quality: _modalQuality } : null;
  persist();
  renderLivreSorts();
  closeModal();
}

/* ── Coups Spéciaux ── */
/* ── Free-cell drag & drop (coups, savoirs, sorts) ── */
let freeDragSrc = null; // { type, idx, sortKey? }

function makeFreecelDraggable(el, idx, type, sortKey) {
  el.draggable = true;
  el.style.cursor = 'grab';

  el.addEventListener('dragstart', e => {
    wasDragging = false;
    freeDragSrc = { type, idx, sortKey };
    el.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
  });
  el.addEventListener('dragend', () => {
    el.style.opacity = '';
    setTimeout(() => { wasDragging = false; }, 50);
  });
  el.addEventListener('dragover', e => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    el.classList.add('drag-over');
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', e => {
    e.preventDefault(); e.stopPropagation();
    el.classList.remove('drag-over');
    wasDragging = true;
    if (!freeDragSrc) return;
    const src = freeDragSrc;
    freeDragSrc = null;
    if (src.type === type && src.sortKey === sortKey && src.idx === idx) return;
    // Get or create array for any type
    function getArr(t, sk) {
      if (t === 'coup')   return (data._coups   = data._coups   || []);
      if (t === 'savoir') return (data._savoirs = data._savoirs || []);
      if (t === 'sort')   { if(!data._sorts) data._sorts={}; return (data._sorts[sk] = data._sorts[sk] || []); }
      return [];
    }
    const srcArr = getArr(src.type, src.sortKey);
    const dstArr = getArr(type, sortKey);
    const a = srcArr[src.idx] || null;
    const b = dstArr[idx] || null;
    srcArr[src.idx] = b;
    dstArr[idx] = a;
    persist();
    renderCoups(); renderSavoirs(); renderLivreSorts();
  });
}

function renderCoups() {
  const container = document.getElementById('list-coups');
  if (!container) return;
  if (!data._coups) data._coups = [];
  container.innerHTML = '';
  const maxCoups = getMaxForCat('coups');
  const filled = data._coups.filter(c => c && c.nom);
  const hardMax = maxCoups > 0 ? maxCoups : 9999;
  const showCount = Math.max(3, Math.min(filled.length + 1, hardMax + 1));
  for (let i = 0; i < showCount; i++) {
    const coup = data._coups[i] || {};
    const cell = document.createElement('div');
    cell.className = 'free-cell' + (coup.nom ? ' filled' : '');
    if (coup.nom) {
      cell.innerHTML = `
        <span class="fc-nom">${coup.nom}</span>
        ${coup.type  ? `<span class="fc-type">${coup.type}</span>`  : ''}
        ${coup.effet ? `<span class="fc-effet">${coup.effet}</span>` : ''}
        ${coup.cout  ? `<span class="fc-cout">Coût : ${coup.cout}</span>` : ''}
      `;
    } else {
      cell.innerHTML = '<span class="fc-lbl" style="color:var(--dim);font-style:italic;">' + (getCatLabel('coups') || 'Coup spécial…') + '</span>';
    }
    cell.onclick = () => { if (!wasDragging) openFreeModal('coup', i, coup); };
    makeFreecelDraggable(cell, i, 'coup');
    applyQualityColor(cell, coup.quality !== undefined ? coup.quality : null);
    // Right-click preview
    cell.addEventListener('contextmenu', e => e.preventDefault());
    cell.addEventListener('mousedown', e => { if (e.button===2) { e.preventDefault(); showSlotPreview(e, coup, null); } });
    cell.addEventListener('mouseup', e => { if (e.button===2) hideSlotPreview(); });
    cell.addEventListener('mouseleave', hideSlotPreview);
    container.appendChild(cell);
  }
}

/* ── Connaissances et Statut ── */
function renderSavoirs() {
  const container = document.getElementById('list-savoirs');
  if (!container) return;
  if (!data._savoirs) data._savoirs = [];
  container.innerHTML = '';
  const maxSav = getMaxForCat('savoirs');
  const filled = data._savoirs.filter(s => s && s.nom);
  const hardMaxS = maxSav > 0 ? maxSav : 9999;
  const showCount = Math.max(3, Math.min(filled.length + 1, hardMaxS + 1));
  for (let i = 0; i < showCount; i++) {
    const sav = data._savoirs[i] || {};
    const cell = document.createElement('div');
    cell.className = 'free-cell' + (sav.nom ? ' filled' : '');
    if (sav.nom) {
      cell.innerHTML = `
        <span class="fc-nom">${sav.nom}</span>
        ${sav.type  ? `<span class="fc-type">${sav.type}</span>`  : ''}
        ${sav.effet ? `<span class="fc-effet">${sav.effet}</span>` : ''}
      `;
    } else {
      cell.innerHTML = '<span class="fc-lbl" style="color:var(--dim);font-style:italic;">' + (getCatLabel('savoirs') || 'Connaissance…') + '</span>';
    }
    cell.onclick = () => { if (!wasDragging) openFreeModal('savoir', i, sav); };
    makeFreecelDraggable(cell, i, 'savoir');
    applyQualityColor(cell, sav.quality !== undefined ? sav.quality : null);
    cell.addEventListener('contextmenu', e => e.preventDefault());
    cell.addEventListener('mousedown', e => { if (e.button===2) { e.preventDefault(); showSlotPreview(e, sav, null); } });
    cell.addEventListener('mouseup', e => { if (e.button===2) hideSlotPreview(); });
    cell.addEventListener('mouseleave', hideSlotPreview);
    container.appendChild(cell);
  }
}

/* ── Free modal (coup / savoir) ── */
function openFreeModal(type, idx, current) {
  if (window.__midjaasSpectatorActive) { toast(uiT('spectator.rightClickOnly','Mode spectateur : clic droit pour voir l’infobulle.')); return; }
  curFreeType = type; curFreeIdx = idx; curSlot = null; curSortKey = null;
  document.getElementById('modalTitle').textContent = type === 'coup' ? getCatLabel('coups') : getCatLabel('savoirs');
  document.getElementById('fNom').value   = current.nom   || '';
  document.getElementById('fType').value  = current.type  || '';
  document.getElementById('fEffet').value = current.effet || '';
  document.getElementById('fTypeField').style.display  = '';
  document.getElementById('fEffetField').style.display = '';
  document.getElementById('fArmorStats').style.display = 'none';
  const coutField = document.getElementById('fCoutField');
  coutField.style.display = type === 'coup' ? '' : 'none';
  if (type === 'coup') document.getElementById('fCout').value = current.cout || '';
  document.getElementById('fImgField').style.display = 'none';
  _modalQuality = current.quality !== undefined ? current.quality : null;
  renderQualityBtns(_modalQuality);
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('fNom').focus(), 60);
}

function saveFreeSlot() {
  const nom   = document.getElementById('fNom').value.trim();
  const type  = document.getElementById('fType').value.trim();
  const effet = document.getElementById('fEffet').value.trim();
  const cout  = document.getElementById('fCout')?.value.trim() || '';
  const obj   = nom || type || effet ? { nom, type, effet, quality: _modalQuality } : null;
  if (curFreeType === 'coup') {
    if (!data._coups) data._coups = [];
    data._coups[curFreeIdx] = obj ? { ...obj, cout } : null;
    persist(); renderCoups();
  } else {
    if (!data._savoirs) data._savoirs = [];
    data._savoirs[curFreeIdx] = obj || null;
    persist(); renderSavoirs();
  }
  curFreeType = null; curFreeIdx = null;
  closeModal();
}

/* Main render */
function renderCompetences() {
  loadCompChar();

  const max = getMaxPrincipales();
  const cnt = countPrincipales();
  const cpCount = document.getElementById('cp-count');
  if (cpCount) cpCount.textContent = '('+cnt+'/'+max+')';

  // Update section titles — respect custom labels
  const CAT_KEY_MAP = { comp_principales:'pri', comp_secondaires:'sec', comp_martiales:'mar', comp_magiques:'mag', savoirs:'savoirs', coups:'coups', livre_sorts:'livre' };
  document.querySelectorAll('[data-i18n-comp]').forEach(el => {
    const i18nKey = el.dataset.i18nComp;
    const catKey = CAT_KEY_MAP[i18nKey];
    if (catKey && data._catLabels?.[catKey]) {
      el.textContent = data._catLabels[catKey]; // custom label wins
    } else {
      el.textContent = t(i18nKey); // fallback to i18n
    }
  });

  const levels      = getLevelsForCat('pri'); // pri/sec/mar may differ
  const levelsMagic = getLevelsForCat('mag');

  const lp   = document.getElementById('list-principales');
  const ls   = document.getElementById('list-secondaires');
  const lm   = document.getElementById('list-martiales');
  const lmag = document.getElementById('list-magiques');
  if (lp && isShown('pri'))   makeDropdownRow('pri_',getCompArray('pri'),getLevelsForCat('pri'),false,lp);
  else if (lp) lp.innerHTML = '';
  if (ls && isShown('sec'))   makeDropdownRow('sec_',getCompArray('sec'),getLevelsForCat('sec'),false,ls);
  else if (ls) ls.innerHTML = '';
  if (lm && isShown('mar'))   makeDropdownRow('mar_',getCompArray('mar'),getLevelsForCat('mar'),false,lm);
  else if (lm) lm.innerHTML = '';
  if (lmag && isShown('mag')) makeDropdownRow('mag_',getCompArray('mag'),getLevelsForCat('mag'),true,lmag);
  else if (lmag) lmag.innerHTML = '';

  // Render stats section
  const statsList = document.getElementById('list-stats');
  if (statsList && isShown('stats')) {
    statsList.innerHTML = '';
    getCompArray('sta').forEach(name => {
      const box = document.createElement('div');
      box.style.cssText = 'background:var(--bg3);border:1.5px solid var(--border2);border-radius:3px;padding:6px 12px;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:90px;';
      const lbl = document.createElement('div');
      lbl.style.cssText = 'font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;';
      lbl.textContent = name;
      const inp = document.createElement('input');
      inp.style.cssText = 'width:60px;background:transparent;border:none;border-bottom:1px solid var(--border2);color:var(--gold);font-family:var(--font);font-size:14px;text-align:center;outline:none;';
      inp.type = 'text'; inp.placeholder = '—';
      const statKey = 'stat_'+name;
      inp.value = data._stats?.[statKey] || '';
      inp.oninput = () => { if(!data._stats)data._stats={}; data._stats[statKey]=inp.value; persist(); };
      box.appendChild(lbl); box.appendChild(inp);
      statsList.appendChild(box);
    });
  }

  applyParamShow();
  applyMagieSetting();

  renderCoups();
  renderSavoirs();
  renderLivreSorts();
}

/* ══ DRAG & DROP ══ */
let dragSrcKey = null;
let wasDragging = false;

function getSlotData(key) {
  return data[key] ? { ...data[key] } : null;
}

function setSlotData(key, val) {
  if (val) data[key] = val;
  else delete data[key];
}

function swapSlots(keyA, keyB) {
  const a = getSlotData(keyA);
  const b = getSlotData(keyB);
  setSlotData(keyA, b);
  setSlotData(keyB, a);
  persist();
  buildBag(); buildPoche(); refresh();
}

function makeDraggable(el, key) {
  if (window.__midjaasSpectatorActive) { el.draggable = false; return; }
  el.draggable = true;
  el.addEventListener('dragstart', e => {
    dragSrcKey = key;
    wasDragging = true;
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));
    // reset wasDragging after click event fires
    setTimeout(() => { wasDragging = false; }, 50);
  });
}

function makeDropTarget(el, key) {
  el.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    el.classList.add('drag-over');
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', e => {
    e.preventDefault();
    el.classList.remove('drag-over');
    if (dragSrcKey && dragSrcKey !== key) {
      swapSlots(dragSrcKey, key);
      dragSrcKey = null;
    }
  });
}

function makeSlotDraggable(slotEl, key) {
  makeDraggable(slotEl, key);
  makeDropTarget(slotEl, key);
}

/* ══ I18N ══ */
let currentLang = 'fr';

const BUILTIN_TRANSLATIONS = {"fr": {"app.title": "⚔ ARKELITH ⚔", "top.sheetOf": "Fiche de", "top.sheetOfEmpty": "Fiche de —", "top.save": "💾 Sauvegarder / Charger", "top.load": "↻ Charger", "top.undo": "↶ Annuler", "top.redo": "↷ Rétablir", "top.export": "⇧ Export", "top.import": "⇩ Import", "top.resetSheet": "✕ Réinit. fiche", "nav.fiche": "⚬ Fiche Perso", "nav.competences": "⚔ Compétences", "nav.inventaire": "⊞ Inventaire", "nav.capital": "◈ Capital", "nav.campagne": "⚑ Campagne", "nav.parametres": "⚙ Paramètres", "modal.firebaseSave.title": "Sauvegarde Firebase", "modal.firebaseSave.currentCode": "Code actuel", "modal.firebaseSave.noCode": "Aucun code", "modal.firebaseSave.save": "Sauvegarder", "modal.firebaseSave.saveAs": "Sauvegarder sous", "modal.firebaseSave.close": "Fermer", "modal.firebaseSave.info": "“Sauvegarder” écrase la sauvegarde liée au code actuel. “Sauvegarder sous” crée un nouveau code.", "modal.firebaseLoad.title": "Charger une sauvegarde", "modal.firebaseLoad.code": "Code de sauvegarde", "modal.firebaseLoad.load": "Charger", "modal.firebaseLoad.close": "Fermer", "common.name": "Nom", "common.race": "Race", "common.bioAge": "Âge Bio", "common.birth": "Naissance", "common.gender": "Genre", "common.right": "Droite", "common.left": "Gauche", "common.close": "Fermer", "common.cancel": "Annuler", "common.validate": "Valider", "common.delete": "Supprimer", "common.add": "Ajouter", "inventory.amulette": "Amulette", "inventory.couvre-chef": "Couvre-Chef", "inventory.gants": "Gants", "inventory.bracelet": "Bracelet", "inventory.armure": "Armure", "inventory.cape": "Cape / Manteau", "inventory.anneau1": "Anneau", "inventory.anneau2": "Anneau", "inventory.ceinture": "Ceinture", "inventory.divers": "Divers", "inventory.bottes": "Bottes", "inventory.arme": "Arme en Main", "inventory.dos": "Dos", "inventory.epaule": "Épaule", "inventory.ceintureGauche": "Ceinture Gauche", "inventory.ceintureDroite": "Ceinture Droite", "inventory.sac": "Sac", "inventory.poches": "Poches", "inventory.munitions": "Munitions", "inventory.bourse": "Bourse", "fiche.character": "Caractère", "fiche.physical": "Physique", "fiche.history": "Histoire", "fiche.mainHand": "Main dominante", "fiche.photoHint": "Cliquer pour ajouter une image", "params.appearance": "Apparence", "params.keepColors": "Conserver mes couleurs à l'import", "params.keepColorsInfo": "Si coché, l'apparence de la fiche importée est ignorée.", "params.visualEffectsPlus": "Effets Visuels +++", "params.resetAll": "Réinitialiser tous les paramètres", "toast.saved": "Sauvegardé !", "toast.imported": "Importé !", "toast.jsonError": "Erreur JSON", "toast.nothingUndo": "Rien à annuler", "toast.nothingRedo": "Rien à rétablir", "toast.undo": "Action annulée", "toast.redo": "Action rétablie", "toast.firebaseUnavailable": "Firebase indisponible", "toast.invalidCode": "Code invalide", "toast.firebaseSaveError": "Erreur sauvegarde Firebase", "toast.firebaseLoadError": "Erreur chargement Firebase", "toast.noSaveFound": "Aucune sauvegarde trouvée", "toast.invalidSave": "Sauvegarde invalide", "toast.sheetReset": "Fiche réinitialisée.", "confirm.resetSheet": "Réinitialiser la fiche du personnage ? Les paramètres seront conservés.", "confirm.loadSave": "Charger cette sauvegarde ? La fiche actuelle sera remplacée.", "modal.firebase.title": "Sauvegarder / Charger", "modal.firebase.save": "Sauvegarder", "modal.firebase.saveAs": "Sauvegarder sous", "modal.firebase.load": "Charger", "modal.firebase.close": "Fermer", "modal.firebase.noCode": "Aucun code", "modal.firebase.saveInfo": "Sauvegarde sur le code actuel. Si aucun code n’existe, un code est généré.", "modal.firebase.saveAsInfo": "Laisse vide pour générer un nouveau code, ou entre ton propre code.", "arme": "Arme en Main", "dos": "Dos", "epaule": "Épaule", "ceintureGauche": "Ceinture — Gauche", "ceintureDroite": "Ceinture — Droite", "legal.text": "© XVI — Univers Midja’as · Reproduction interdite · Usage personnel autorisé", "campaign.playerTitle": "Campagne Joueur", "campaign.currentCampaign": "Campagne actuelle", "campaign.playerSaveCode": "Code joueur", "campaign.join": "Rejoindre", "campaign.leave": "Quitter la campagne", "campaign.joinInfo": "Le code campagne permet d’associer votre fiche à une campagne.", "campaign.gmTitle": "Gestion MJ", "campaign.create": "Créer", "campaign.campaignCode": "Code Campagne", "campaign.gmCode": "Code MJ", "campaign.manage": "Gérer", "campaign.players": "Joueurs", "campaign.noCampaignLoaded": "Aucune campagne MJ chargée.", "campaign.loadSheet": "Voir fiche", "campaign.kick": "Expulser", "campaign.noPlayers": "Aucun joueur dans cette campagne.", "campaign.created": "Campagne créée", "campaign.joined": "Campagne rejointe", "campaign.left": "Campagne quittée", "campaign.loaded": "Campagne chargée", "campaign.playerKicked": "Joueur expulsé", "campaign.invalidCampaignCode": "Code campagne invalide", "campaign.invalidGmCode": "Code MJ invalide", "campaign.notFound": "Campagne introuvable", "campaign.needSaveCode": "Sauvegarde d’abord ta fiche pour obtenir un code joueur.", "campaign.confirmLeave": "Quitter cette campagne ? Votre fiche ne sera pas supprimée.", "campaign.confirmKick": "Expulser ce joueur de la campagne ?", "campaign.confirmLoadPlayer": "Charger la fiche de ce joueur ? Votre fiche actuelle sera remplacée.", "campaign.playersInCampaign": "Joueurs dans la campagne", "campaign.noCampaignJoined": "Aucune campagne rejointe.", "campaign.managedCampaigns": "Campagnes gérées", "campaign.defaultName": "Campagne sans nom", "campaign.rename": "Renommer", "campaign.renamed": "Campagne renommée", "params.resetAllParams": "↺ Réinitialiser tous les paramètres", "params.clearAll": "⚠ Tout réinitialiser (fiche + params)", "confirm.resetAllParams": "Réinitialiser tous les paramètres ?", "confirm.clearAll": "Réinitialiser TOUT (fiche ET paramètres) ? Irréversible.", "toast.paramsReset": "Paramètres réinitialisés.", "toast.allReset": "Tout réinitialisé.", "toast.reset": "Réinitialisé.", "inventory.rings": "Anneaux", "inventory.customTitle": "Inventaire personnalisé", "params.inventoryLayout": "Inventaire", "params.inventoryMode": "Mode d’inventaire", "params.inventoryDefault": "Inventaire par défaut", "params.inventoryCustom": "Inventaire personnalisé", "params.inventoryCustomInfo": "En mode personnalisé, vous ajoutez vos propres cases d’inventaire. Elles s’affichent sur 3 colonnes.", "params.addCustomSlot": "Ajouter une case", "params.customSlotName": "Nom de la case", "toast.customSlotAdded": "Case ajoutée.", "toast.customSlotRemoved": "Case supprimée.", "inventory.prostheses": "Prothèses", "inventory.separateHand": "Séparer main", "params.renameInventorySpecials": "Renommer les sections spéciales", "prostheses.head": "Tête", "prostheses.leftEye": "Œil gauche", "prostheses.rightEye": "Œil droit", "prostheses.leftArm": "Bras gauche", "prostheses.rightArm": "Bras droit", "prostheses.leftHand": "Main gauche", "prostheses.rightHand": "Main droite", "prostheses.body": "Corps", "prostheses.leftLeg": "Jambe gauche", "prostheses.rightLeg": "Jambe droite", "prostheses.extra1": "Module 1", "prostheses.extra2": "Module 2", "prostheses.extra3": "Module 3", "prostheses.extra4": "Module 4", "prostheses.extra5": "Module 5", "params.renameProsthesisCapsules": "Renommer les capsules de prothèses", "params.resetProsthesisLabels": "Réinitialiser les noms de prothèses", "toast.prosthesisLabelsReset": "Noms de prothèses réinitialisés.", "prostheses.groupHead": "Tête", "prostheses.groupArmsBody": "Bras / Corps", "prostheses.groupLegs": "Jambes", "prostheses.groupModules": "Modules"}, "en": {"app.title": "⚔ ARKELITH ⚔", "top.sheetOf": "Sheet of", "top.sheetOfEmpty": "Sheet of —", "top.save": "💾 Save / Load", "top.load": "↻ Load", "top.undo": "↶ Undo", "top.redo": "↷ Redo", "top.export": "⇧ Export", "top.import": "⇩ Import", "top.resetSheet": "✕ Reset sheet", "nav.fiche": "⚬ Character Sheet", "nav.competences": "⚔ Skills", "nav.inventaire": "⊞ Inventory", "nav.capital": "◈ Capital", "nav.campagne": "⚑ Campaign", "nav.parametres": "⚙ Settings", "modal.firebaseSave.title": "Firebase Save", "modal.firebaseSave.currentCode": "Current code", "modal.firebaseSave.noCode": "No code", "modal.firebaseSave.save": "Save", "modal.firebaseSave.saveAs": "Save as", "modal.firebaseSave.close": "Close", "modal.firebaseSave.info": "“Save” overwrites the save linked to the current code. “Save as” creates a new code.", "modal.firebaseLoad.title": "Load a save", "modal.firebaseLoad.code": "Save code", "modal.firebaseLoad.load": "Load", "modal.firebaseLoad.close": "Close", "common.name": "Name", "common.race": "Race", "common.bioAge": "Bio Age", "common.birth": "Birth", "common.gender": "Gender", "common.right": "Right", "common.left": "Left", "common.close": "Close", "common.cancel": "Cancel", "common.validate": "Confirm", "common.delete": "Delete", "common.add": "Add", "inventory.amulette": "Amulet", "inventory.couvre-chef": "Headgear", "inventory.gants": "Gloves", "inventory.bracelet": "Bracelet", "inventory.armure": "Armor", "inventory.cape": "Cape / Coat", "inventory.anneau1": "Ring", "inventory.anneau2": "Ring", "inventory.ceinture": "Belt", "inventory.divers": "Misc.", "inventory.bottes": "Boots", "inventory.arme": "Main Weapon", "inventory.dos": "Back", "inventory.epaule": "Shoulder", "inventory.ceintureGauche": "Left Belt", "inventory.ceintureDroite": "Right Belt", "inventory.sac": "Bag", "inventory.poches": "Pockets", "inventory.munitions": "Ammunition", "inventory.bourse": "Purse", "fiche.character": "Personality", "fiche.physical": "Appearance", "fiche.history": "History", "fiche.mainHand": "Dominant hand", "fiche.photoHint": "Click to add an image", "params.appearance": "Appearance", "params.keepColors": "Keep my colors on import", "params.keepColorsInfo": "If checked, the imported sheet appearance is ignored.", "params.visualEffectsPlus": "Visual Effects +++", "params.resetAll": "Reset all settings", "toast.saved": "Saved!", "toast.imported": "Imported!", "toast.jsonError": "JSON error", "toast.nothingUndo": "Nothing to undo", "toast.nothingRedo": "Nothing to redo", "toast.undo": "Action undone", "toast.redo": "Action redone", "toast.firebaseUnavailable": "Firebase unavailable", "toast.invalidCode": "Invalid code", "toast.firebaseSaveError": "Firebase save error", "toast.firebaseLoadError": "Firebase load error", "toast.noSaveFound": "No save found", "toast.invalidSave": "Invalid save", "toast.sheetReset": "Sheet reset.", "confirm.resetSheet": "Reset the character sheet? Settings will be kept.", "confirm.loadSave": "Load this save? The current sheet will be replaced.", "modal.firebase.title": "Save / Load", "modal.firebase.save": "Save", "modal.firebase.saveAs": "Save as", "modal.firebase.load": "Load", "modal.firebase.close": "Close", "modal.firebase.noCode": "No code", "modal.firebase.saveInfo": "Saves to the current code. If there is no code yet, one is generated.", "modal.firebase.saveAsInfo": "Leave empty to generate a new code, or enter your own code.", "arme": "Main Weapon", "dos": "Back", "epaule": "Shoulder", "ceintureGauche": "Belt — Left", "ceintureDroite": "Belt — Right", "legal.text": "© XVI — Midja’as Universe · No reproduction · Personal use allowed", "campaign.playerTitle": "Player Campaign", "campaign.currentCampaign": "Current campaign", "campaign.playerSaveCode": "Player code", "campaign.join": "Join", "campaign.leave": "Leave campaign", "campaign.joinInfo": "The campaign code links your sheet to a campaign.", "campaign.gmTitle": "GM Management", "campaign.create": "Create", "campaign.campaignCode": "Campaign Code", "campaign.gmCode": "GM Code", "campaign.manage": "Manage", "campaign.players": "Players", "campaign.noCampaignLoaded": "No GM campaign loaded.", "campaign.loadSheet": "View sheet", "campaign.kick": "Kick", "campaign.noPlayers": "No player in this campaign.", "campaign.created": "Campaign created", "campaign.joined": "Campaign joined", "campaign.left": "Campaign left", "campaign.loaded": "Campaign loaded", "campaign.playerKicked": "Player kicked", "campaign.invalidCampaignCode": "Invalid campaign code", "campaign.invalidGmCode": "Invalid GM code", "campaign.notFound": "Campaign not found", "campaign.needSaveCode": "Save your sheet first to get a player code.", "campaign.confirmLeave": "Leave this campaign? Your sheet will not be deleted.", "campaign.confirmKick": "Kick this player from the campaign?", "campaign.confirmLoadPlayer": "Load this player sheet? Your current sheet will be replaced.", "campaign.playersInCampaign": "Players in campaign", "campaign.noCampaignJoined": "No campaign joined.", "campaign.managedCampaigns": "Managed campaigns", "campaign.defaultName": "Unnamed campaign", "campaign.rename": "Rename", "campaign.renamed": "Campaign renamed", "params.resetAllParams": "↺ Reset all settings", "params.clearAll": "⚠ Reset everything (sheet + settings)", "confirm.resetAllParams": "Reset all settings?", "confirm.clearAll": "Reset EVERYTHING (sheet AND settings)? This cannot be undone.", "toast.paramsReset": "Settings reset.", "toast.allReset": "Everything reset.", "toast.reset": "Reset.", "inventory.rings": "Rings", "inventory.customTitle": "Custom inventory", "params.inventoryLayout": "Inventory", "params.inventoryMode": "Inventory mode", "params.inventoryDefault": "Default inventory", "params.inventoryCustom": "Custom inventory", "params.inventoryCustomInfo": "In custom mode, you add your own inventory slots. They display in 3 columns.", "params.addCustomSlot": "Add slot", "params.customSlotName": "Slot name", "toast.customSlotAdded": "Slot added.", "toast.customSlotRemoved": "Slot removed.", "inventory.prostheses": "Prostheses", "inventory.separateHand": "Separate hand", "params.renameInventorySpecials": "Rename special sections", "prostheses.head": "Head", "prostheses.leftEye": "Left eye", "prostheses.rightEye": "Right eye", "prostheses.leftArm": "Left arm", "prostheses.rightArm": "Right arm", "prostheses.leftHand": "Left hand", "prostheses.rightHand": "Right hand", "prostheses.body": "Body", "prostheses.leftLeg": "Left leg", "prostheses.rightLeg": "Right leg", "prostheses.extra1": "Module 1", "prostheses.extra2": "Module 2", "prostheses.extra3": "Module 3", "prostheses.extra4": "Module 4", "prostheses.extra5": "Module 5", "params.renameProsthesisCapsules": "Rename prosthesis capsules", "params.resetProsthesisLabels": "Reset prosthesis names", "toast.prosthesisLabelsReset": "Prosthesis names reset.", "prostheses.groupHead": "Head", "prostheses.groupArmsBody": "Arms / Body", "prostheses.groupLegs": "Legs", "prostheses.groupModules": "Modules"}};
const I18N = {
  fr: {
    "prostheses.groupHead": "Tête",
    "prostheses.groupArmsBody": "Bras / Corps",
    "prostheses.groupLegs": "Jambes",
    "prostheses.groupModules": "Modules",
    "params.renameProsthesisCapsules": "Renommer les capsules de prothèses",
    "params.resetProsthesisLabels": "Réinitialiser les noms de prothèses",
    "toast.prosthesisLabelsReset": "Noms de prothèses réinitialisés.",
    "prostheses.extra1": "Module 1",
    "prostheses.extra2": "Module 2",
    "prostheses.extra3": "Module 3",
    "prostheses.extra4": "Module 4",
    "prostheses.extra5": "Module 5",
    "inventory.prostheses": "Prothèses",
    "inventory.separateHand": "Séparer main",
    "params.renameInventorySpecials": "Renommer les sections spéciales",
    "prostheses.head": "Tête",
    "prostheses.leftEye": "Œil gauche",
    "prostheses.rightEye": "Œil droit",
    "prostheses.leftArm": "Bras gauche",
    "prostheses.rightArm": "Bras droit",
    "prostheses.leftHand": "Main gauche",
    "prostheses.rightHand": "Main droite",
    "prostheses.body": "Corps",
    "prostheses.leftLeg": "Jambe gauche",
    "prostheses.rightLeg": "Jambe droite",
    "inventory.rings": "Anneaux",
    "inventory.customTitle": "Inventaire personnalisé",
    "params.inventoryLayout": "Inventaire",
    "params.inventoryMode": "Mode d’inventaire",
    "params.inventoryDefault": "Inventaire par défaut",
    "params.inventoryCustom": "Inventaire personnalisé",
    "params.inventoryCustomInfo": "En mode personnalisé, vous ajoutez vos propres cases d’inventaire. Elles s’affichent sur 3 colonnes.",
    "params.addCustomSlot": "Ajouter une case",
    "params.customSlotName": "Nom de la case",
    "toast.customSlotAdded": "Case ajoutée.",
    "toast.customSlotRemoved": "Case supprimée.",
    "campaign.playerTitle": "Campagne Joueur",
    "campaign.currentCampaign": "Campagne actuelle",
    "campaign.playerSaveCode": "Code joueur",
    "campaign.join": "Rejoindre",
    "campaign.leave": "Quitter la campagne",
    "campaign.joinInfo": "Le code campagne permet d’associer votre fiche à une campagne.",
    "campaign.playersInCampaign": "Joueurs dans la campagne",
    "campaign.noCampaignJoined": "Aucune campagne rejointe.",
    "campaign.gmTitle": "Gestion MJ",
    "campaign.create": "Créer",
    "campaign.campaignCode": "Code Campagne",
    "campaign.gmCode": "Code MJ",
    "campaign.manage": "Gérer",
    "campaign.managedCampaigns": "Campagnes gérées",
    "campaign.players": "Joueurs",
    "campaign.noCampaignLoaded": "Aucune campagne MJ chargée.",
    "campaign.loadSheet": "Voir fiche",
    "campaign.kick": "Expulser",
    "campaign.noPlayers": "Aucun joueur dans cette campagne.",
    "campaign.defaultName": "Campagne sans nom",
    "campaign.rename": "Renommer",
    "campaign.renamed": "Campagne renommée",
    "legal.text": "© XVI — Univers Midja’as · Reproduction interdite · Usage personnel autorisé",
    "params.resetAllParams": "↺ Réinitialiser tous les paramètres",
    "params.clearAll": "⚠ Tout réinitialiser (fiche + params)",
    "confirm.resetAllParams": "Réinitialiser tous les paramètres ?",
    "confirm.clearAll": "Réinitialiser TOUT (fiche ET paramètres) ? Irréversible.",
    "toast.paramsReset": "Paramètres réinitialisés.",
    "toast.allReset": "Tout réinitialisé.",
    "toast.reset": "Réinitialisé.",
    "legal.text": "© XVI — Univers Midja’as · Reproduction interdite · Usage personnel autorisé",
    "campaign.rename": "Renommer",
    "campaign.renamed": "Campagne renommée",
    "legal.text": "© XVI — Univers Midja'as · Reproduction interdite · Usage personnel autorisé",
    "campaign.playerTitle": "Campagne Joueur",
    "campaign.currentCampaign": "Campagne actuelle",
    "campaign.playerSaveCode": "Code joueur",
    "campaign.join": "Rejoindre",
    "campaign.leave": "Quitter la campagne",
    "campaign.joinInfo": "Le code campagne permet d’associer votre fiche à une campagne.",
    "campaign.gmTitle": "Gestion MJ",
    "campaign.create": "Créer une campagne",
    "campaign.campaignCode": "Code Campagne",
    "campaign.gmCode": "Code MJ",
    "campaign.manage": "Gérer",
    "campaign.players": "Joueurs",
    "campaign.noCampaignLoaded": "Aucune campagne MJ chargée.",
    "campaign.loadSheet": "Voir fiche",
    "campaign.kick": "Expulser",
    "campaign.noPlayers": "Aucun joueur dans cette campagne.",
    "app.title": "⚔ ARKELITH ⚔",
    "top.sheetOf": "Fiche de",
    "top.sheetOfEmpty": "Fiche de —",
    "top.save": "💾 Sauvegarder / Charger",
    "top.load": "↻ Charger",
    "top.undo": "↶ Annuler",
    "top.redo": "↷ Rétablir",
    "top.export": "⇧ Export",
    "top.import": "⇩ Import",
    "top.resetSheet": "✕ Réinit. fiche",
    "nav.fiche": "⚬ Fiche Perso",
    "nav.competences": "⚔ Compétences",
    "nav.inventaire": "⊞ Inventaire",
    "nav.capital": "◈ Capital",
    "nav.campagne": "⚑ Campagne",
    "nav.parametres": "⚙ Paramètres",
    "inventory.amulette": "Amulette",
    "inventory.couvre-chef": "Couvre-Chef",
    "inventory.gants": "Gants",
    "inventory.bracelet": "Bracelet",
    "inventory.armure": "Armure",
    "inventory.cape": "Cape / Manteau",
    "inventory.anneau1": "Anneau",
    "inventory.anneau2": "Anneau",
    "inventory.ceinture": "Ceinture",
    "inventory.divers": "Divers",
    "inventory.bottes": "Bottes",
    "arme": "Arme en Main",
    "dos": "Dos",
    "epaule": "Épaule",
    "ceintureGauche": "Ceinture — Gauche",
    "ceintureDroite": "Ceinture — Droite",
    "modal.firebase.title": "Sauvegarder / Charger",
    "modal.firebase.save": "Sauvegarder",
    "modal.firebase.saveAs": "Sauvegarder sous",
    "modal.firebase.load": "Charger",
    "modal.firebase.close": "Fermer",
    "modal.firebase.noCode": "Aucun code",
    "modal.firebase.saveInfo": "Sauvegarde sur le code actuel. Si aucun code n’existe, un code est généré.",
    "modal.firebase.saveAsInfo": "Laisse vide pour générer un nouveau code, ou entre ton propre code.",
    "params.keepColors": "Conserver mes couleurs à l'import",
    "params.keepColorsInfo": "Si coché, l'apparence de la fiche importée est ignorée.",
    nav_competences: '⚔ Compétences', nav_inventaire: '⊞ Inventaire', nav_capital: '◈ Capital',
    amulette: 'Amulette', 'couvre-chef': 'Couvre-Chef', gants: 'Gants',
    bracelet: 'Bracelet', armure: 'Armure', cape: 'Cape / Manteau',
    anneau1: 'Anneau', anneau2: 'Anneau',
    ceinture: 'Ceinture', bottes: 'Bottes', divers: 'Divers',
    arme: 'Arme en Main', dos: 'Dos', epaule: 'Épaule',
    ceintureGauche: 'Ceinture — Gauche', ceintureDroite: 'Ceinture — Droite',
    sac: 'Sac', poches: 'Poches', munitions: 'Munitions', bourse: 'Bourse',
    emplacement_sac: 'Emplacement sac', emplacement_poche: 'Emplacement poche',
    nom: 'Nom', age_bio: 'Âge Bio', naissance: 'Naissance',
    pv: 'PV', pa: 'PA', ps: 'PS', pe: 'PE', race: 'Race',
    blessures: 'Blessures', infuse: 'Infusé ?',
    comp_principales: 'Compétences Principales', comp_secondaires: 'Compétences Secondaires',
    comp_martiales: 'Compétences Martiales', comp_magiques: 'Compétences Magiques',
    comp_magiques_sub: '(Infusé requis)', coups: 'Coups Spéciaux',
    savoirs: 'Connaissances et Statut', livre_sorts: 'Livre de Sorts',
    sacoche: 'Sacoche (6 empl.)', petit_sac: 'Petit sac (9 empl. + 1 spé)',
    sac_moyen: 'Sac moyen (11 empl. + 2 spé)', grand_sac: 'Grand sac (13 empl. + 3 spé)',
    capital_wip: '💰 Capital — à venir', choisir: '— Choisir —',
    levels_std: ['Novice','Adepte','Expert','Maître'],
    levels_magic: ['Adepte','Expert','Maître'],
    comp_pri: ['Identification','Marchandage','Désamorçage','Vol à la tire','Médecine','Artisanat / Réparation','Alchimie','Chasse / Pistage','Dressage','Acrobaties','Cuisine'],
    comp_sec: ['Équitation','Navigation','Ambidextrie','Musculation','Méditation','Athlétisme','Apprentissage'],
    comp_mar: ['Dagues','Pugilat','Escrime','Hache','Contondant','Bâton','Hast','Fouet','Armes de lancer','Archerie','Armes à feu','Frondes','Armes à Énergie','Bouclier'],
    comp_mag: ['Magie du Feu','Magie de l\'Air','Magie de l\'Eau','Magie de la Terre','Magie de l\'Âme','Magie de l\'Esprit','Magie du Corps','Magie du Psionisme','Magie de la Lumière','Magie de l\'Ombre','Magie du Vide','Magie de la Création'],
    choisir_comp: '— Choisir —',
    coup_placeholder: 'Coup spécial…', savoir_placeholder: 'Savoir ou connaissance…',
    sort_placeholder: 'Emplacement sort',
  },
  en: {
    "prostheses.groupHead": "Head",
    "prostheses.groupArmsBody": "Arms / Body",
    "prostheses.groupLegs": "Legs",
    "prostheses.groupModules": "Modules",
    "params.renameProsthesisCapsules": "Rename prosthesis capsules",
    "params.resetProsthesisLabels": "Reset prosthesis names",
    "toast.prosthesisLabelsReset": "Prosthesis names reset.",
    "prostheses.extra1": "Module 1",
    "prostheses.extra2": "Module 2",
    "prostheses.extra3": "Module 3",
    "prostheses.extra4": "Module 4",
    "prostheses.extra5": "Module 5",
    "inventory.prostheses": "Prostheses",
    "inventory.separateHand": "Separate hand",
    "params.renameInventorySpecials": "Rename special sections",
    "prostheses.head": "Head",
    "prostheses.leftEye": "Left eye",
    "prostheses.rightEye": "Right eye",
    "prostheses.leftArm": "Left arm",
    "prostheses.rightArm": "Right arm",
    "prostheses.leftHand": "Left hand",
    "prostheses.rightHand": "Right hand",
    "prostheses.body": "Body",
    "prostheses.leftLeg": "Left leg",
    "prostheses.rightLeg": "Right leg",
    "inventory.rings": "Rings",
    "inventory.customTitle": "Custom inventory",
    "params.inventoryLayout": "Inventory",
    "params.inventoryMode": "Inventory mode",
    "params.inventoryDefault": "Default inventory",
    "params.inventoryCustom": "Custom inventory",
    "params.inventoryCustomInfo": "In custom mode, you add your own inventory slots. They display in 3 columns.",
    "params.addCustomSlot": "Add slot",
    "params.customSlotName": "Slot name",
    "toast.customSlotAdded": "Slot added.",
    "toast.customSlotRemoved": "Slot removed.",
    "campaign.playerTitle": "Player Campaign",
    "campaign.currentCampaign": "Current campaign",
    "campaign.playerSaveCode": "Player code",
    "campaign.join": "Join",
    "campaign.leave": "Leave campaign",
    "campaign.joinInfo": "The campaign code links your sheet to a campaign.",
    "campaign.playersInCampaign": "Players in campaign",
    "campaign.noCampaignJoined": "No campaign joined.",
    "campaign.gmTitle": "GM Management",
    "campaign.create": "Create",
    "campaign.campaignCode": "Campaign Code",
    "campaign.gmCode": "GM Code",
    "campaign.manage": "Manage",
    "campaign.managedCampaigns": "Managed campaigns",
    "campaign.players": "Players",
    "campaign.noCampaignLoaded": "No GM campaign loaded.",
    "campaign.loadSheet": "View sheet",
    "campaign.kick": "Kick",
    "campaign.noPlayers": "No player in this campaign.",
    "campaign.defaultName": "Unnamed campaign",
    "campaign.rename": "Rename",
    "campaign.renamed": "Campaign renamed",
    "legal.text": "© XVI — Midja’as Universe · No reproduction · Personal use allowed",
    "params.resetAllParams": "↺ Reset all settings",
    "params.clearAll": "⚠ Reset everything (sheet + settings)",
    "confirm.resetAllParams": "Reset all settings?",
    "confirm.clearAll": "Reset EVERYTHING (sheet AND settings)? This cannot be undone.",
    "toast.paramsReset": "Settings reset.",
    "toast.allReset": "Everything reset.",
    "toast.reset": "Reset.",
    "legal.text": "© XVI — Midja’as Universe · No reproduction · Personal use allowed",
    "campaign.rename": "Rename",
    "campaign.renamed": "Campaign renamed",
    "legal.text": "© XVI — Midja'as Universe · No reproduction · Personal use allowed",
    "campaign.playerTitle": "Player Campaign",
    "campaign.currentCampaign": "Current campaign",
    "campaign.playerSaveCode": "Player code",
    "campaign.join": "Join",
    "campaign.leave": "Leave campaign",
    "campaign.joinInfo": "The campaign code links your sheet to a campaign.",
    "campaign.gmTitle": "GM Management",
    "campaign.create": "Create campaign",
    "campaign.campaignCode": "Campaign Code",
    "campaign.gmCode": "GM Code",
    "campaign.manage": "Manage",
    "campaign.players": "Players",
    "campaign.noCampaignLoaded": "No GM campaign loaded.",
    "campaign.loadSheet": "View sheet",
    "campaign.kick": "Kick",
    "campaign.noPlayers": "No player in this campaign.",
    "app.title": "⚔ ARKELITH ⚔",
    "top.sheetOf": "Sheet of",
    "top.sheetOfEmpty": "Sheet of —",
    "top.save": "💾 Save / Load",
    "top.load": "↻ Load",
    "top.undo": "↶ Undo",
    "top.redo": "↷ Redo",
    "top.export": "⇧ Export",
    "top.import": "⇩ Import",
    "top.resetSheet": "✕ Reset sheet",
    "nav.fiche": "⚬ Character Sheet",
    "nav.competences": "⚔ Skills",
    "nav.inventaire": "⊞ Inventory",
    "nav.capital": "◈ Capital",
    "nav.campagne": "⚑ Campaign",
    "nav.parametres": "⚙ Settings",
    "inventory.amulette": "Amulet",
    "inventory.couvre-chef": "Headgear",
    "inventory.gants": "Gloves",
    "inventory.bracelet": "Bracelet",
    "inventory.armure": "Armor",
    "inventory.cape": "Cape / Coat",
    "inventory.anneau1": "Ring",
    "inventory.anneau2": "Ring",
    "inventory.ceinture": "Belt",
    "inventory.divers": "Misc.",
    "inventory.bottes": "Boots",
    "arme": "Main Weapon",
    "dos": "Back",
    "epaule": "Shoulder",
    "ceintureGauche": "Belt — Left",
    "ceintureDroite": "Belt — Right",
    "modal.firebase.title": "Save / Load",
    "modal.firebase.save": "Save",
    "modal.firebase.saveAs": "Save as",
    "modal.firebase.load": "Load",
    "modal.firebase.close": "Close",
    "modal.firebase.noCode": "No code",
    "modal.firebase.saveInfo": "Saves to the current code. If there is no code yet, one is generated.",
    "modal.firebase.saveAsInfo": "Leave empty to generate a new code, or enter your own code.",
    "params.keepColors": "Keep my colors on import",
    "params.keepColorsInfo": "If checked, the imported sheet appearance is ignored.",
    nav_competences: '⚔ Skills', nav_inventaire: '⊞ Inventory', nav_capital: '◈ Capital',
    amulette: 'Amulet', 'couvre-chef': 'Headgear', gants: 'Gloves',
    bracelet: 'Bracelet', armure: 'Armor', cape: 'Cape / Cloak',
    anneau1: 'Ring', anneau2: 'Ring',
    ceinture: 'Belt', bottes: 'Boots', divers: 'Misc.',
    arme: 'Weapon in Hand', dos: 'Back', epaule: 'Shoulder',
    ceintureGauche: 'Belt — Left', ceintureDroite: 'Belt — Right',
    sac: 'Bag', poches: 'Pockets', munitions: 'Ammo', bourse: 'Purse',
    emplacement_sac: 'Bag slot', emplacement_poche: 'Pocket slot',
    nom: 'Name', age_bio: 'Bio Age', naissance: 'Birth Year',
    pv: 'HP', pa: 'AP', ps: 'SP', pe: 'EP', race: 'Race',
    blessures: 'Wounds', infuse: 'Infused?',
    comp_principales: 'Main Skills', comp_secondaires: 'Secondary Skills',
    comp_martiales: 'Martial Skills', comp_magiques: 'Magic Skills',
    comp_magiques_sub: '(Infused required)', coups: 'Special Moves',
    savoirs: 'Lore & Status', livre_sorts: 'Spellbook',
    sacoche: 'Pouch (6 slots)', petit_sac: 'Small bag (9 slots + 1 sp.)',
    sac_moyen: 'Medium bag (11 slots + 2 sp.)', grand_sac: 'Large bag (13 slots + 3 sp.)',
    capital_wip: '💰 Capital — coming soon', choisir: '— Choose —',
    levels_std: ['Novice','Adept','Expert','Master'],
    levels_magic: ['Adept','Expert','Master'],
    comp_pri: ['Identification','Bargaining','Disarming','Pickpocket','Medicine','Crafting / Repair','Alchemy','Hunting / Tracking','Taming','Acrobatics','Cooking'],
    comp_sec: ['Riding','Navigation','Ambidexterity','Strength Training','Meditation','Athletics','Apprenticeship'],
    comp_mar: ['Daggers','Brawling','Fencing','Axe','Blunt','Staff','Polearm','Whip','Throwing Weapons','Archery','Firearms','Slings','Energy Weapons','Shield'],
    comp_mag: ['Fire Magic','Air Magic','Water Magic','Earth Magic','Soul Magic','Spirit Magic','Body Magic','Psionic Magic','Light Magic','Shadow Magic','Void Magic','Creation Magic'],
    choisir_comp: '— Choose —',
    coup_placeholder: 'Special move…', savoir_placeholder: 'Lore or knowledge…',
    sort_placeholder: 'Spell slot',
  }
};

function t(key, fallback = '') { return (I18N[currentLang]||I18N.fr)[key] || I18N.fr[key] || (typeof UI18N !== 'undefined' && UI18N[key]) || fallback || key; }

function applyI18n() {
  document.getElementById('nav-competences').textContent = t('nav_competences');
  document.getElementById('nav-inventaire').textContent  = t('nav_inventaire');
  document.getElementById('nav-capital').textContent     = t('nav_capital');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    // Ne pas écraser les labels de slots renommés par le joueur
    const slot = el.closest('[id^="sl-"]');
    if (slot && el.classList.contains('lbl')) {
      const key = slot.id.replace('sl-', '');
      if (data._slotLabels?.[key]) { el.textContent = data._slotLabels[key]; return; }
    }
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-char]').forEach(el => { el.textContent = t(el.dataset.i18nChar); });
  const CAT_KEY_MAP2 = { comp_principales:'pri', comp_secondaires:'sec', comp_martiales:'mar', comp_magiques:'mag', savoirs:'savoirs', coups:'coups', livre_sorts:'livre' };
  document.querySelectorAll('[data-i18n-comp]').forEach(el => {
    const catKey = CAT_KEY_MAP2[el.dataset.i18nComp];
    if (catKey && data._catLabels?.[catKey]) el.textContent = data._catLabels[catKey];
    else el.textContent = t(el.dataset.i18nComp);
  });
  // PS label (has id, not data-i18n-char)
  const psLbl = document.getElementById('ps-lbl');
  if (psLbl) psLbl.textContent = t('ps');
  const invPsLbl = document.getElementById('inv-ps-lbl');
  if (invPsLbl) invPsLbl.textContent = t('ps');
  const bagSel = document.getElementById('bagSize');
  if (bagSel) {
    const keys = ['sacoche','petit_sac','sac_moyen','grand_sac'];
    [...bagSel.options].forEach((o,i) => { if(keys[i]) o.textContent = t(keys[i]); });
  }
  const titles = document.querySelectorAll('.inv-title-txt');
  if(titles[0]) titles[0].textContent = t('sac');
  if(titles[1]) titles[1].textContent = t('poches');
  buildBag(); buildPoche();
  if (document.getElementById('page-competences')?.classList.contains('active')) renderCompetences();
  localStorage.setItem('dnd_lang', currentLang);
}

function setLang(lang) { currentLang = lang; applyI18n(); loadTranslations(lang); }

function loadLang() {
  const saved = localStorage.getItem('dnd_lang') || 'fr';
  currentLang = saved;
  document.querySelectorAll('input[name="lang-switch"]').forEach(r => r.checked = r.value === saved);
}

/* ══ PARAMÈTRES ══ */

// Default stat arrays
const STA_DEFAULT = ['Force','Endurance','Précision','Mental','Dextérité','Agilité','Charisme','Spirituel'];

// Custom comp arrays
function getCustomComp(type) { return data._customComp?.[type] || null; }
function setCustomComp(type, arr) {
  if (!data._customComp) data._customComp = {};
  data._customComp[type] = arr; persist();
}
function getCompArray(type) {
  return getCustomComp(type) ||
    (type==='pri'?COMP_PRINCIPALES:type==='sec'?COMP_SECONDAIRES:
     type==='mar'?COMP_MARTIALES:type==='mag'?COMP_MAGIQUES:
     type==='sta'?STA_DEFAULT:[]);
}

// Category labels (renaming)
const CAT_DEFAULTS = {
  stats:'Statistiques', pri:'Compétences Principales', sec:'Compétences Secondaires',
  mar:'Compétences Martiales', mag:'Compétences Magiques',
  savoirs:'Connaissances et Statut', coups:'Coups Spéciaux', livre:'Livre de Sorts'
};
function getCatLabel(cat) { return data._catLabels?.[cat] || CAT_DEFAULTS[cat] || cat; }
function saveParamCatLabel(cat, val) {
  if (!data._catLabels) data._catLabels = {};
  data._catLabels[cat] = val; persist();
  applyCatLabels();
}
function applyCatLabels() {
  // Update comp section titles
  const map = {
    pri: '[data-i18n-comp="comp_principales"]',
    sec: '[data-i18n-comp="comp_secondaires"]',
    mar: '[data-i18n-comp="comp_martiales"]',
    mag: '[data-i18n-comp="comp_magiques"]',
    savoirs: '[data-i18n-comp="savoirs"]',
    coups: '[data-i18n-comp="coups"]',
    livre: '[data-i18n-comp="livre_sorts"]',
  };
  Object.entries(map).forEach(([cat, sel]) => {
    document.querySelectorAll(sel).forEach(el => { el.textContent = getCatLabel(cat); });
  });
  document.querySelectorAll('[data-i18n-comp="savoirs"]').forEach(el => { el.textContent = getCatLabel('savoirs') || el.textContent; });
}

// Category max (0 = unlimited)
function getMaxForCat(cat) {
  const v = data._catMax?.[cat];
  if (v !== undefined && v !== null) return parseInt(v);
  return cat === 'pri' ? 3 : 0; // Principales default 3, others unlimited
}
function saveParamMax(cat, val) {
  if (!data._catMax) data._catMax = {};
  data._catMax[cat] = parseInt(val) || 0; persist();
  if (document.getElementById('page-competences')?.classList.contains('active')) renderCompetences();
}

// Category visibility
function saveParamShow(cat, val) {
  if (!data._paramShow) data._paramShow = {};
  data._paramShow[cat] = val; persist();
  applyParamShow();
}
function isShown(cat) {
  if (!data._paramShow) return cat !== 'stats'; // stats hidden by default
  return data._paramShow[cat] !== false;
}
function applyParamShow() {
  const statsEl = document.getElementById('comp-stats-section');
  if (statsEl) statsEl.style.display = isShown('stats') ? '' : 'none';
  const magEnabled = data._magieEnabled !== false;

  // Simple comp sections
  [
    ['pri','list-principales'], ['sec','list-secondaires'],
    ['mar','list-martiales'],   ['savoirs','list-savoirs'],
    ['coups','list-coups'],
  ].forEach(([cat, listId]) => {
    const listEl = document.getElementById(listId);
    const titleEl = listEl?.previousElementSibling;
    const show = isShown(cat);
    if (listEl)  listEl.style.display  = show ? '' : 'none';
    if (titleEl) titleEl.style.display = show ? '' : 'none';
  });

  // Magiques — row hidden if magie disabled OR toggle off
  const magRow = document.querySelector('.comp-magie-row');
  const showMag = magEnabled && isShown('mag');
  if (magRow) magRow.style.display = showMag ? '' : 'none';

  // Livre de sorts
  const livreRow = document.querySelector('.comp-livre-row');
  const showLivre = magEnabled && isShown('livre');
  if (livreRow) livreRow.style.display = showLivre ? '' : 'none';

  // Keep old references for backward compat
  const listMag = document.getElementById('list-magiques');
  const titleMag = listMag?.previousElementSibling;
  if (listMag)  listMag.style.display  = showMag ? '' : 'none';
  if (titleMag) titleMag.style.display = showMag ? '' : 'none';

  const livreBody  = document.getElementById('livre-sorts-body');
  const livreTitle = livreBody?.previousElementSibling;
  if (livreBody)  livreBody.style.display  = showLivre ? '' : 'none';
  if (livreTitle) livreTitle.style.display = showLivre ? '' : 'none';

  // Entire last comp-col hidden if both off
  const magCol = document.querySelector('.comp-body .comp-col:last-child');
  if (magCol) magCol.style.display = (showMag || showLivre) ? '' : 'none';
}

// Category formats
function getFormat(cat) { return data._paramFormat?.[cat] || (cat==='mag'?'AEM':'NAEM'); }
function isCustomFree(cat) { return getFormat(cat) === 'CUSTOM'; }
function getLevelsForCat(cat) {
  const fmt = getFormat(cat);
  const names = getLevelNames(); // [Novice, Adepte, Expert, Maître]
  if (fmt === 'NAEM') return names;             // all 4
  if (fmt === 'AEM')  return names.slice(1);    // Adepte, Expert, Maître
  return names.slice(1); // default AEM
}
function saveParamFormat(cat, val) {
  if (!data._paramFormat) data._paramFormat = {};
  data._paramFormat[cat] = val; persist();
  if (document.getElementById('page-competences').classList.contains('active')) renderCompetences();
}

function resetParamFormat(cat) {
  if (data._paramFormat) delete data._paramFormat[cat]; persist();
  const sel = document.getElementById('cfg-fmt-'+cat);
  if (sel) sel.value = cat==='mag'?'AEM':'NAEM';
  if (document.getElementById('page-competences').classList.contains('active')) renderCompetences();
}

// Resource labels (long name + abbreviation)
function getResName(stat) { return data._resNames?.[stat] || {pv:'Points de Vie',pa:"Points d'Armure",pe:"Points d'Endurance",ps:'Points de Sort'}[stat] || ''; }
function getStatLabel(stat) { return data._statLabels?.[stat] || stat.toUpperCase(); }
function saveParamRes(stat, field, val) {
  if (field==='name') { if(!data._resNames)data._resNames={}; data._resNames[stat]=val; }
  persist();
}
function saveParamStat(stat, val) {
  if (!data._statLabels) data._statLabels = {};
  data._statLabels[stat] = val || stat.toUpperCase(); persist();
  applyStatLabels();
}

function applyStatLabels() {
  ['pv','pa','pe','ps','dsnc'].forEach(s => {
    const lbl = getStatLabel(s);
    document.querySelectorAll('[data-i18n-char="'+s+'"]').forEach(el => { el.textContent = lbl; });
    if (s==='ps') {
      const a = document.getElementById('inv-ps-lbl');
      const b = document.getElementById('ps-lbl');
      if(a) a.textContent = lbl; if(b) b.textContent = lbl;
    }
    if (s==='dsnc') {
      const a = document.getElementById('inv-dsnc-lbl');
      const b = document.getElementById('comp-dsnc-lbl');
      const c2 = document.getElementById('fiche-dsnc-lbl');
      if(a) a.textContent = lbl; if(b) b.textContent = lbl; if(c2) c2.textContent = lbl;
    }
    ['char-'+s,'comp-char-'+s].forEach(id => {
      const el = document.getElementById(id); if(el) el.placeholder = lbl;
    });
  });
}

function saveParamMagie(val) {
  data._magieEnabled = val; persist(); applyMagieSetting();
}

function applyMagieSetting() {
  const enabled = data._magieEnabled !== false; // default true

  // Hide/show the cfg-infusion-row in params
  const infRow = document.getElementById('cfg-infusion-row');
  if (infRow) infRow.style.display = enabled ? '' : 'none';

  // PS fields
  ['inv-ps-lbl','ps-lbl'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.closest('.char-row') && (el.style.display = enabled ? '' : 'none');
  });
  ['char-ps','comp-char-ps'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = enabled ? '' : 'none';
  });

  // Infusé checkbox
  if (!enabled) {
    // Force infuse ON internally but hide the toggle
    data._infuse = true; persist();
    ['inv-infuse-cb','infuse-cb'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.checked = true; el.style.display = 'none'; }
      const lbl = el?.previousElementSibling;
      const sep = lbl?.previousElementSibling;
      if (lbl) lbl.style.display = 'none';
      if (sep?.classList?.contains('char-sep')) sep.style.display = 'none';
    });
  } else {
    applyInfusionSetting(); // restore based on infusion setting
  }

  // Livre de sorts, compétences magiques section visibility
  const magCol = document.querySelector('.comp-body .comp-col:last-child');
  const magList = document.getElementById('list-magiques');
  const livreSorts = document.getElementById('livre-sorts-body');
  // Find parent comp-section-title of list-magiques
  if (magCol) magCol.style.display = enabled ? '' : 'none';
  if (magList) magList.style.display = enabled ? '' : 'none';
  if (livreSorts) livreSorts.style.display = enabled ? '' : 'none';
  document.querySelectorAll('[data-i18n-comp="comp_magiques"], [data-i18n-comp="comp_magiques_sub"], [data-i18n-comp="livre_sorts"]').forEach(el => {
    const parent = el.closest('.comp-section-title');
    if (parent) parent.style.display = enabled ? '' : 'none';
  });

  // Cfg magie checkbox sync
  const cfgMagie = document.getElementById('cfg-magie');
  if (cfgMagie) cfgMagie.checked = enabled;
}

function saveParamInfusion(val) {
  data._infusionRequired = val; persist(); applyInfusionSetting();
}

function applyInfusionSetting() {
  const magEnabled = data._magieEnabled !== false;
  if (!magEnabled) return; // handled by applyMagieSetting

  const req = data._infusionRequired !== false;

  // Infusé checkbox — only hide/show if magie is enabled
  if (!req) { data._infuse = true; persist(); }
  ['inv-infuse-cb','infuse-cb'].forEach(id => {
    const cb = document.getElementById(id); if (!cb) return;
    const lbl = cb.previousElementSibling;
    const sep = lbl?.previousElementSibling;
    cb.style.display = req ? '' : 'none';
    if (!req) cb.checked = true;
    if (lbl) lbl.style.display = req ? '' : 'none';
    if (sep?.classList?.contains('char-sep')) sep.style.display = req ? '' : 'none';
  });

  // PS stays visible regardless of infusion setting
  const psRow = document.getElementById('cfg-ps-row');
  if (psRow) psRow.style.display = '';

  // Magic skills accessibility
  if (!req) {
    document.querySelectorAll('#list-magiques .skill-dd-row').forEach(r => r.classList.remove('disabled'));
  } else {
    const infuse = data._infuse || false;
    document.querySelectorAll('#list-magiques .skill-dd-row').forEach(r => r.classList.toggle('disabled', !infuse));
  }
}

function resetAllComps() {
  if (!confirm('Restaurer toutes les listes de compétences par défaut ? Cela supprime vos modifications de noms/ajouts/suppressions, mais pas les données de personnage.')) return;
  delete data._customComp;
  persist(); renderParametres();
  if (document.getElementById('page-competences').classList.contains('active')) renderCompetences();
  toast('Compétences restaurées !');
}

function addParamComp(type) {
  const arr = [...getCompArray(type)]; arr.push('Nouvelle compétence');
  setCustomComp(type, arr); renderParametres();
  if(document.getElementById('page-competences').classList.contains('active')) renderCompetences();
}

function renderParamList(type, containerId) {
  const container = document.getElementById(containerId); if(!container) return;
  container.innerHTML = '';
  getCompArray(type).forEach((name, idx) => {
    const row = document.createElement('div'); row.className = 'param-comp-row';
    const inp = document.createElement('input'); inp.className='param-comp-input'; inp.type='text'; inp.value=name; inp.placeholder=name||'Compétence';
    inp.oninput = () => {
      const cur = [...getCompArray(type)]; const old = cur[idx];
      cur[idx] = inp.value; setCustomComp(type, cur);
      const pref = type+'_';
      if(data._comp?.[pref+old]!==undefined){data._comp[pref+inp.value]=data._comp[pref+old];delete data._comp[pref+old];persist();}
      if(document.getElementById('page-competences').classList.contains('active')) renderCompetences();
    };
    const del = document.createElement('button'); del.className='param-del-btn'; del.textContent='×'; del.title='Supprimer';
    del.onclick = () => {
      const cur = [...getCompArray(type)]; cur.splice(idx,1); setCustomComp(type,cur);
      renderParametres();
      if(document.getElementById('page-competences').classList.contains('active')) renderCompetences();
    };
    row.appendChild(inp); row.appendChild(del); container.appendChild(row);
  });
}

function renderParametres() {
  // Resource labels
  ['pv','pa','pe','ps'].forEach(s => {
    const nameEl = document.getElementById('cfg-'+s+'-name');
    const abbEl  = document.getElementById('cfg-'+s);
    if(nameEl) nameEl.value = getResName(s);
    if(abbEl)  abbEl.value  = getStatLabel(s);
  });
  // Effets Visuels +++
  applyEffetsPlus();
  // Keep theme on import
  const ktCb = document.getElementById('cfg-keep-theme');
  if (ktCb) ktCb.checked = getKeepTheme();
  // Stat splits (X/X checkboxes)
  applyStatSplits();
  // Armor stats params
  renderArmorParams();
  // Bourse count
  const bourseCountSel = document.getElementById('cfg-bourse-count');
  if (bourseCountSel) bourseCountSel.value = getBourseCount();
  // Capital labels
  renderCapitalParams();
  // Quality params
  renderQualityParams();
  // Slot labels
  renderSlotLabelParams();
  // Fiche section labels
  renderFicheLabelParams();
  // Level names & colors
  renderLevelParams();
  // Bags & spe
  renderBagParams();
  renderSpeParams();
  // Font sizes
  const fs = data._fontSizes || {};
  ['nom','type','effet'].forEach(k => {
    const el = document.getElementById('cfg-fs-'+k);
    if (el) el.value = fs[k] || FS_DEFAULTS[k];
  });
  // Char labels
  ['nom','race','age','naiss','blessures','minos','infuse'].forEach(key => {
    const el = document.getElementById('cfg-label-'+key);
    if (el) el.value = getCharLabel(key);
  });
  // Cat labels
  ['stats','pri','sec','mar','mag','savoirs','coups','livre'].forEach(cat => {
    const el = document.getElementById('cfg-name-'+cat);
    if (el) el.value = getCatLabel(cat);
  });
  // Cat max
  ['pri','sec','mar','mag','savoirs','coups','livre'].forEach(cat => {
    const el = document.getElementById('cfg-max-'+cat);
    if (el) el.value = getMaxForCat(cat);
  });
  // Stat labels (pv, pa, pe, ps, dsnc)
  ['pv','pa','pe','ps','dsnc'].forEach(s => {
    const nameEl = document.getElementById('cfg-'+s+'-name');
    const abbrEl = document.getElementById('cfg-'+s);
    if (nameEl) nameEl.value = data._resNames?.[s] || '';
    if (abbrEl) abbrEl.value = getStatLabel(s) === s.toUpperCase() ? '' : getStatLabel(s);
    const splitCb = document.getElementById('cfg-'+s+'-split');
    if (splitCb) splitCb.checked = getResSplit(s);
  });
  const psRow = document.getElementById('cfg-ps-row');
  if(psRow) psRow.style.display = data._magieEnabled!==false ? '' : 'none';
  // Infusion + Magie toggles
  const infCb = document.getElementById('cfg-infusion');
  if(infCb) infCb.checked = data._infusionRequired!==false;
  const magCb = document.getElementById('cfg-magie');
  if(magCb) magCb.checked = data._magieEnabled!==false;
  const infRow = document.getElementById('cfg-infusion-row');
  if(infRow) infRow.style.display = data._magieEnabled!==false?'':'none';
  // Show/hide toggles
  ['stats','pri','sec','mar','mag','savoirs','coups','livre'].forEach(cat => {
    const cb = document.getElementById('cfg-show-'+cat);
    if(cb) cb.checked = isShown(cat);
  });
  // Formats
  ['pri','sec','mar','mag'].forEach(cat => {
    const sel = document.getElementById('cfg-fmt-'+cat);
    if(sel) sel.value = getFormat(cat);
  });
  // Comp lists
  renderParamList('sta','cfg-list-sta');
  renderParamList('pri','cfg-list-pri');
  renderParamList('sec','cfg-list-sec');
  renderParamList('mar','cfg-list-mar');
  renderParamList('mag','cfg-list-mag');
}

/* ══ FICHE PERSO ══ */
function renderFiche() {
  const c = data._char || {};
  const f = data._fiche || {};

  const setT = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val||'—'; };
  const setV = (id, val) => { const el=document.getElementById(id); if(el) el.value=val||''; };

  // Nom — textarea
  const nomEl = document.getElementById('fiche-nom-inp');
  if (nomEl) { nomEl.value = c.nom || ''; resizeFicheNom(nomEl); }
  setV('fiche-race-inp', c.race);
  setV('fiche-age-inp', c.age);
  setV('fiche-naiss-inp', c.naiss);
  setT('fiche-genre', c.gender==='m'?'♂':c.gender==='f'?'♀':'—');
  setV('fiche-pv', c.pv); setV('fiche-pa', c.pa);
  setV('fiche-pe', c.pe); setV('fiche-ps', c.ps);
  setV('fiche-dsnc', c.dsnc);
  setV('fiche-pv-max', c['pv-max']); setV('fiche-pa-max', c['pa-max']);
  setV('fiche-pe-max', c['pe-max']); setV('fiche-ps-max', c['ps-max']);
  setV('fiche-dsnc-max', c['dsnc-max']);
  applyStatSplits();

  // Apply stat labels from params
  ['pv','pa','pe'].forEach(s => {
    const el = document.getElementById('fiche-'+s+'-lbl');
    if (el) el.textContent = getStatLabel(s);
  });
  const psLblEl = document.getElementById('fiche-ps-lbl');
  if (psLblEl) psLblEl.textContent = getStatLabel('ps');

  // Apply char labels from params
  const naissLblEl = document.getElementById('fiche-naiss-lbl');
  if (naissLblEl) naissLblEl.textContent = getCharLabel('naiss') || 'Naissance';
  const infuseLblEl = document.getElementById('fiche-infuse-lbl');
  if (infuseLblEl) infuseLblEl.textContent = (getCharLabel('infuse') || 'Infusé ?').replace('?','').trim();

  // Infusé checkbox
  const infuseCb = document.getElementById('fiche-infuse-cb');
  if (infuseCb) { infuseCb.checked = data._infuse || (!data._infusionRequired) || false; }

  // PS visibility
  const psLbl = document.getElementById('fiche-ps-lbl');
  const psEl  = document.getElementById('fiche-ps');
  const psVisible = data._magieEnabled !== false;
  [psLbl, psEl].forEach(el => { if(el) el.style.display = psVisible ? '' : 'none'; });

  // Main dominante
  const main = f.mainDominante || 'droite';
  document.querySelectorAll('input[name="main-dominante"]').forEach(r => r.checked = r.value === main);

  // Textareas
  const setTA = (id, val) => { const el=document.getElementById(id); if(el) el.value=val||''; };
  setTA('fiche-caractere', f.caractere);
  setTA('fiche-physique', f.physique);
  setTA('fiche-histoire', f.histoire);

  // Photo
  const photoEl = document.getElementById('fiche-photo-inner');
  if (photoEl) {
    if (f.photoUrl) {
      photoEl.style.backgroundImage = `url('${f.photoUrl}')`;
      const hint = photoEl.querySelector('.fiche-photo-hint');
      if (hint) hint.style.display = 'none';
      // Set aspect-ratio to match image natural dimensions
      const img = new Image();
      img.onload = () => {
        const ar = img.naturalWidth / img.naturalHeight;
        photoEl.style.aspectRatio = ar.toFixed(4);
        photoEl.style.width = 'auto';
        photoEl.style.maxWidth = '100%';
        photoEl.style.height = 'auto';
        photoEl.style.maxHeight = '100%';
      };
      img.src = f.photoUrl;
    } else {
      photoEl.style.backgroundImage = '';
      photoEl.style.aspectRatio = '';
      photoEl.style.width = '100%';
      photoEl.style.height = '100%';
      const hint = photoEl.querySelector('.fiche-photo-hint');
      if (hint) hint.style.display = '';
    }
  }

  // Ratio — auto-applied when photo loads, nothing to do here
}

function updateFicheRatio(val, save=true) {
  // 0 = 1:2 (tall/portrait), 100 = 1:1 (square)
  const ratio = 2 - (val / 100); // 2.0→1.0
  const photoWrap = document.getElementById('fiche-photo-inner');
  if (photoWrap) photoWrap.style.aspectRatio = '1 / ' + ratio.toFixed(2);
  if (lbl) lbl.textContent = '1:' + ratio.toFixed(1).replace('.0','');
  if (save) {
    if (!data._fiche) data._fiche = {};
    data._fiche.ratioSlider = parseInt(val); persist();
  }
}

function saveFicheField(field, val) {
  if (!data._fiche) data._fiche = {};
  data._fiche[field] = val; persist();
}

function saveFicheMain(val) {
  if (!data._fiche) data._fiche = {};
  data._fiche.mainDominante = val; persist();
}

function openFichePhoto() {
  const overlay = document.getElementById('fiche-photo-overlay');
  if (!overlay) return;
  document.getElementById('fiche-photo-url').value = data._fiche?.photoUrl || '';
  overlay.style.display = 'flex';
}

function saveFichePhoto() {
  const url = document.getElementById('fiche-photo-url')?.value.trim();
  if (!data._fiche) data._fiche = {};
  data._fiche.photoUrl = url || ''; persist();
  document.getElementById('fiche-photo-overlay').style.display = 'none';
  if (url) {
    // Auto-detect ratio from image dimensions
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalHeight / img.naturalWidth;
      const clamped = Math.min(2, Math.max(1, ratio)); // clamp 1:1 to 1:2
      const sliderVal = Math.round((2 - clamped) * 100); // 0=tall(1:2) 100=square(1:1)
      data._fiche.ratioSlider = sliderVal; persist();
      updateFicheRatio(sliderVal, false);
      renderFiche();
    };
    img.onerror = () => renderFiche();
    img.src = url;
  } else {
    renderFiche();
  }
}

function clearFichePhoto() {
  if (!data._fiche) data._fiche = {};
  data._fiche.photoUrl = ''; persist();
  document.getElementById('fiche-photo-overlay').style.display = 'none';
  renderFiche();
}

loadTheme();
loadLang();
loadData();
applyI18n();
applyStatLabels();
applyCharLabels();
applyCatLabels();
applyMagieSetting();
applyParamShow();
applyFontSizes();
applyStatSplits();
applyEffetsPlus();
updateBagSelect();
refreshArmorStats();
applyArmorStatLabels();
applyAllQualityColors();
applySlotLabels();
applyFicheSectionLabels();
applyInventorySpecialLabels();
applyProsthesisGroupLabels();
buildBourseRows();
// Restore PS enabled/disabled state based on saved infuse value
toggleInfuse(data._infuse || false);
renderFiche();
// Resize all inputs after everything is loaded
setTimeout(() => {
  document.querySelectorAll('#page-fiche .fiche-stat-inp').forEach(el => resizeFicheInp(el));
  resizeAllCartouche();
}, 120);


// === UI POLISH : sélection visuelle légère ===
(function initUiPolishSelection(){
  const selectable = '.slot, .free-cell, .sort-cell, .grid-cell, .spe-cell';
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest(selectable);
    if (!el) return;
    document.querySelectorAll('.ui-selected').forEach(x => {
      if (x !== el) x.classList.remove('ui-selected');
    });
    el.classList.add('ui-selected');
    window.setTimeout(() => el.classList.remove('ui-selected'), 900);
  }, true);
})();

// === UI POLISH : feedback drag/drop global ===
(function initUiPolishDragDrop(){
  const zoneSelector = '.slot, .free-cell, .sort-cell, .grid-cell, .spe-cell';

  document.addEventListener('dragstart', (ev) => {
    const el = ev.target.closest(zoneSelector);
    if (el) {
      el.classList.add('ui-dragging');
      document.body.classList.add('ui-drag-active');
    }
  }, true);

  document.addEventListener('dragend', () => {
    document.querySelectorAll('.ui-dragging, .ui-drop-target, .ui-drop-denied').forEach(el => {
      el.classList.remove('ui-dragging', 'ui-drop-target', 'ui-drop-denied');
    });
    document.body.classList.remove('ui-drag-active');
  }, true);

  document.addEventListener('dragenter', (ev) => {
    const el = ev.target.closest(zoneSelector);
    if (el && document.body.classList.contains('ui-drag-active')) {
      el.classList.add('ui-drop-target');
    }
  }, true);

  document.addEventListener('dragover', (ev) => {
    const el = ev.target.closest(zoneSelector);
    if (el && document.body.classList.contains('ui-drag-active')) {
      el.classList.add('ui-drop-target');
    }
  }, true);

  document.addEventListener('dragleave', (ev) => {
    const el = ev.target.closest(zoneSelector);
    if (el && !el.contains(ev.relatedTarget)) {
      el.classList.remove('ui-drop-target', 'ui-drop-denied');
    }
  }, true);

  document.addEventListener('drop', () => {
    document.querySelectorAll('.ui-drop-target, .ui-drop-denied').forEach(el => {
      el.classList.remove('ui-drop-target', 'ui-drop-denied');
    });
  }, true);
})();


/* === UNDO / REDO : Ctrl+Z / Ctrl+Y === */
let undoStack = [];
let redoStack = [];
let undoLastSnapshot = null;
let undoIsRestoring = false;
const UNDO_LIMIT = 40;

function undoSnapshot() {
  try { return JSON.stringify(data); }
  catch (e) { return null; }
}

function updateUndoRedoButtons() {
  const u = document.getElementById('btn-undo');
  const r = document.getElementById('btn-redo');
  if (u) {
    u.disabled = undoStack.length === 0;
    u.style.opacity = undoStack.length === 0 ? '.45' : '';
  }
  if (r) {
    r.disabled = redoStack.length === 0;
    r.style.opacity = redoStack.length === 0 ? '.45' : '';
  }
}

function refreshAfterHistoryRestore() {
  try {
    const bag = document.getElementById('bagSize');
    if (bag) bag.value = data._bagSize || 'sacoche';

    buildBag();
    buildPoche();
    buildSpe();
    refresh();
    loadChar();
    renderFiche();

    applyStatLabels();
    applyCharLabels();
    applyCatLabels();
    applyMagieSetting();
    applyParamShow();
    applyStatSplits();
    applyEffetsPlus();
    applySlotLabels();
    applyFicheSectionLabels();
    applyAllQualityColors();
    buildBourseRows();
    refreshArmorStats();

    setTimeout(() => {
      if (typeof resizeAllCartouche === 'function') resizeAllCartouche();
      document.querySelectorAll('#page-fiche .fiche-stat-inp').forEach(el => {
        if (typeof resizeFicheInp === 'function') resizeFicheInp(el);
      });
    }, 30);
  } catch (e) {
    console.error('Erreur refresh undo/redo', e);
  }
}

function initUndoRedo() {
  undoLastSnapshot = undoSnapshot();

  const originalPersist = persist;
  persist = function() {
    const current = undoSnapshot();

    if (!undoIsRestoring && undoLastSnapshot !== null && current !== null && current !== undoLastSnapshot) {
      undoStack.push(undoLastSnapshot);
      if (undoStack.length > UNDO_LIMIT) undoStack.shift();
      redoStack = [];
      undoLastSnapshot = current;
    }

    originalPersist();
    updateUndoRedoButtons();
  };

  updateUndoRedoButtons();
}

function undoAction() {
  if (!undoStack.length) {
    toast(uiT('toast.nothingUndo','Rien à annuler'));
    return;
  }

  const current = undoSnapshot();
  const previous = undoStack.pop();
  if (current !== null) redoStack.push(current);

  undoIsRestoring = true;
  try {
    data = JSON.parse(previous);
    undoLastSnapshot = previous;
    localStorage.setItem('dnd_inv', previous);
    refreshAfterHistoryRestore();
    toast(uiT('toast.undo','Action annulée'));
  } finally {
    undoIsRestoring = false;
    updateUndoRedoButtons();
  }
}

function redoAction() {
  if (!redoStack.length) {
    toast(uiT('toast.nothingRedo','Rien à rétablir'));
    return;
  }

  const current = undoSnapshot();
  const next = redoStack.pop();
  if (current !== null) undoStack.push(current);

  undoIsRestoring = true;
  try {
    data = JSON.parse(next);
    undoLastSnapshot = next;
    localStorage.setItem('dnd_inv', next);
    refreshAfterHistoryRestore();
    toast(uiT('toast.redo','Action rétablie'));
  } finally {
    undoIsRestoring = false;
    updateUndoRedoButtons();
  }
}

document.addEventListener('keydown', (ev) => {
  const key = ev.key.toLowerCase();

  if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && key === 'z') {
    ev.preventDefault();
    undoAction();
  }

  if ((ev.ctrlKey || ev.metaKey) && (key === 'y' || (ev.shiftKey && key === 'z'))) {
    ev.preventDefault();
    redoAction();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  // Laisse d'abord le script initial charger la fiche, puis branche l'historique.
  setTimeout(initUndoRedo, 0);
});


/* === FIREBASE DIRECT SAVES === */

function normalizeSaveCode(code) {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 9);
}

function formatSaveCode(code) {
  const c = normalizeSaveCode(code);
  return [c.slice(0,3), c.slice(3,6), c.slice(6,9)].filter(Boolean).join(' ');
}

function generateSaveCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sans I/O pour éviter les confusions
  let out = '';
  for (let i = 0; i < 9; i++) out += letters[Math.floor(Math.random() * letters.length)];
  return out;
}

function getSaveCode() {
  return normalizeSaveCode(data._firebaseSaveCode || localStorage.getItem('midjaas_save_code') || '');
}

function setSaveCode(code) {
  const clean = normalizeSaveCode(code);
  data._firebaseSaveCode = clean;
  localStorage.setItem('midjaas_save_code', clean);
  persist();
  updateFirebaseCodeFields();
  return clean;
}

function getFirebaseDbCompat() {
  try {
    if (window.firebase && typeof firebase.database === 'function') {
      return firebase.database();
    }
  } catch(e) {
    console.error(e);
  }
  return null;
}

function firebaseRef(path) {
  const db = getFirebaseDbCompat();
  if (!db) return null;
  return db.ref(path);
}

function makeFirebaseSavePayload() {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const themeKeys = ['--bg','--bg2','--bg3','--gold','--text','--border','--border2','--muted','--dim','--hover','--filled','--slot-empty','--spe-slot-empty','--char-panel'];
  const theme = {};
  themeKeys.forEach(k => { theme[k] = cs.getPropertyValue(k).trim(); });

  return Object.assign({}, data, {
    _bagSize: document.getElementById('bagSize')?.value || data._bagSize || 'sacoche',
    _exportTheme: theme,
    _exportFont: cs.getPropertyValue('--font').trim(),
    _savedAt: Date.now()
  });
}

function updateFirebaseCodeFields() {
  const current = document.getElementById('firebase-current-code');
  if (current) current.value = formatSaveCode(getSaveCode()) || uiT('modal.firebase.noCode','Aucun code');
}

function openFirebaseSaveModal() {
  updateFirebaseCodeFields();
  const saveAs = document.getElementById('firebase-save-as-code');
  const load = document.getElementById('firebase-load-code');
  if (saveAs) saveAs.value = '';
  if (load) load.value = '';
  document.getElementById('firebase-save-modal')?.classList.add('open');
}

function closeFirebaseSaveModal() {
  document.getElementById('firebase-save-modal')?.classList.remove('open');
}

function openFirebaseLoadModal() {
  openFirebaseSaveModal();
  setTimeout(() => document.getElementById('firebase-load-code')?.focus(), 50);
}

async function firebaseSaveToCode(code) {
  const clean = normalizeSaveCode(code);
  if (clean.length !== 9) {
    toast(uiT('toast.invalidCode','Code invalide'));
    return false;
  }

  const ref = firebaseRef('saves/' + clean);
  if (!ref) {
    toast(uiT('toast.firebaseUnavailable','Firebase indisponible'));
    return false;
  }

  const payload = makeFirebaseSavePayload();
  payload._firebaseSaveCode = clean;

  await ref.set({
    payloadJson: JSON.stringify(payload),
    savedAt: Date.now(),
    version: 2
  });
  setSaveCode(clean);
  toast((currentLang === 'en' ? 'Saved: ' : 'Sauvegardé : ') + formatSaveCode(clean));
  return true;
}

async function firebaseSaveCurrent() {
  try {
    let code = getSaveCode();
    if (!code) code = generateSaveCode();
    await firebaseSaveToCode(code);
  } catch (err) {
    console.error(err);
    toast(uiT('toast.firebaseSaveError','Erreur sauvegarde Firebase'));
  }
}

async function firebaseSaveAs() {
  try {
    const input = document.getElementById('firebase-save-as-code');
    let code = normalizeSaveCode(input?.value || '');

    const db = getFirebaseDbCompat();
    if (!db) {
      toast(uiT('toast.firebaseUnavailable','Firebase indisponible'));
      return;
    }

    if (!code) {
      code = generateSaveCode();
      // Évite de réutiliser un code existant.
      for (let i = 0; i < 8; i++) {
        const snap = await db.ref('saves/' + code).get();
        if (!snap.exists()) break;
        code = generateSaveCode();
      }
    }

    if (code.length !== 9) {
      toast(uiT('toast.invalidCode','Code invalide'));
      return;
    }

    await firebaseSaveToCode(code);
    if (input) input.value = formatSaveCode(code);
  } catch (err) {
    console.error(err);
    toast(uiT('toast.firebaseSaveError','Erreur sauvegarde Firebase'));
  }
}

async function firebaseLoadByCode() {
  try {
    const raw = document.getElementById('firebase-load-code')?.value || '';
    const code = normalizeSaveCode(raw);

    if (code.length !== 9) {
      toast(uiT('toast.invalidCode','Code invalide'));
      return;
    }

    const ref = firebaseRef('saves/' + code);
    if (!ref) {
      toast(uiT('toast.firebaseUnavailable','Firebase indisponible'));
      return;
    }

    const snap = await ref.get();
    if (!snap.exists()) {
      toast(uiT('toast.noSaveFound','Aucune sauvegarde trouvée'));
      return;
    }

    let loaded = snap.val();

    // Depuis la correction Firebase, les fiches sont stockées en texte JSON
    // pour éviter les clés interdites par Realtime Database (. # $ / [ ]).
    // On garde aussi la compatibilité avec d'anciennes sauvegardes objet.
    if (loaded && typeof loaded === 'object' && typeof loaded.payloadJson === 'string') {
      try {
        loaded = JSON.parse(loaded.payloadJson);
      } catch (err) {
        console.error(err);
        toast(uiT('toast.invalidSave','Sauvegarde invalide'));
        return;
      }
    }

    if (!loaded || typeof loaded !== 'object') {
      toast(uiT('toast.invalidSave','Sauvegarde invalide'));
      return;
    }

    if (!confirm(uiT('confirm.loadSave','Charger cette sauvegarde ? La fiche actuelle sera remplacée.'))) return;

    createRecoveryPoint('before-firebase-load');
    data = sanitizeImport(loaded);
    data._firebaseSaveCode = code;
    preloadFicheImages();
    safeLocalSet('midjaas_save_code', code);

    const bag = document.getElementById('bagSize');
    if (bag) bag.value = data._bagSize || 'sacoche';

    buildBag(); buildPoche(); buildSpe(); refresh(); loadChar(); renderFiche();
    applyStatLabels(); applyCharLabels(); applyCatLabels(); applyMagieSetting(); applyParamShow(); applyStatSplits();
    applyEffetsPlus(); applySlotLabels(); applyFicheSectionLabels(); applyAllQualityColors();
    buildBourseRows(); refreshArmorStats();

    // Appliquer le thème embarqué dans la sauvegarde si présent
    if (data._exportTheme && typeof data._exportTheme === 'object') {
      const root = document.documentElement;
      const t = data._exportTheme;
      Object.entries(t).forEach(([k, v]) => { if (v) root.style.setProperty(k, v); });
      if (data._exportFont) root.style.setProperty('--font', data._exportFont);
      const pickers = {'--bg':'tc-bg','--bg2':'tc-bg2','--gold':'tc-gold','--text':'tc-text','--border':'tc-border','--slot-empty':'tc-slot-empty','--spe-slot-empty':'tc-spe-slot','--char-panel':'tc-char-panel'};
      Object.entries(pickers).forEach(([cssVar, id]) => { const el = document.getElementById(id); if (el && t[cssVar]) el.value = t[cssVar]; });
      const fontEl = document.getElementById('tc-font'); if (fontEl && data._exportFont) fontEl.value = data._exportFont;
    }

    persist();
    updateFirebaseCodeFields();
    closeFirebaseSaveModal();

    setTimeout(() => {
      document.querySelectorAll('#page-fiche .fiche-stat-inp').forEach(el => { if (typeof resizeFicheInp === 'function') resizeFicheInp(el); });
      if (typeof resizeAllCartouche === 'function') resizeAllCartouche();
    }, 80);

    toast((currentLang === 'en' ? 'Loaded: ' : 'Chargé : ') + formatSaveCode(code));
  } catch (err) {
    console.error(err);
    toast(uiT('toast.firebaseLoadError','Erreur chargement Firebase'));
  }
}

function initFirebaseCodeInputs() {
  ['firebase-load-code', 'firebase-save-as-code'].forEach(id => {
    const input = document.getElementById(id);
    if (!input || input.dataset.codeReady) return;
    input.addEventListener('input', () => {
      const pos = input.selectionStart;
      input.value = formatSaveCode(input.value);
    });
    input.dataset.codeReady = '1';
  });
  updateFirebaseCodeFields();
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initFirebaseCodeInputs, 0);
});

/* === I18N JSON === */
var UI18N = {};
/* UI language is synced with currentLang */

function uiT(key, fallback = '') {
  if (UI18N && UI18N[key]) return UI18N[key];
  const lang = currentLang || localStorage.getItem('midjaas_lang') || 'fr';
  if (typeof BUILTIN_TRANSLATIONS !== 'undefined' && BUILTIN_TRANSLATIONS[lang]?.[key]) return BUILTIN_TRANSLATIONS[lang][key];
  if (typeof BUILTIN_TRANSLATIONS !== 'undefined' && BUILTIN_TRANSLATIONS.fr?.[key]) return BUILTIN_TRANSLATIONS.fr[key];
  if (typeof t === 'function') {
    const embedded = t(key, '');
    if (embedded && embedded !== key) return embedded;
  }
  return fallback || key;
}

// Restaure tous les labels personnalisés après une mise à jour de traduction
function applyAllCustomLabels() {
  if (typeof applyCharLabels === 'function')              applyCharLabels();
  if (typeof applyStatLabels === 'function')              applyStatLabels();
  if (typeof applyFicheSectionLabels === 'function')      applyFicheSectionLabels();
  if (typeof applySlotLabels === 'function')              applySlotLabels();
  if (typeof applyArmorStatLabels === 'function')         applyArmorStatLabels();
  if (typeof applyCatLabels === 'function')               applyCatLabels();
  if (typeof applyInventorySpecialLabels === 'function')  applyInventorySpecialLabels();
  if (typeof applyProsthesisGroupLabels === 'function')   applyProsthesisGroupLabels();
  if (typeof applyProsthesisLabels === 'function')        applyProsthesisLabels();
}

async function loadTranslations(lang) {
  try {
    const res = await fetch(`lang/${lang}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Lang file not found');
    UI18N = await res.json();
    currentLang = lang;
    localStorage.setItem('midjaas_lang', lang); localStorage.setItem('dnd_lang', lang);
    applyTranslations(); if (typeof applyI18n === 'function') applyI18n();
    applyAllCustomLabels();
  } catch (err) {
    console.warn('Impossible de charger la traduction', lang, err);
    UI18N = (typeof BUILTIN_TRANSLATIONS !== 'undefined' && BUILTIN_TRANSLATIONS[lang])
      || (typeof BUILTIN_TRANSLATIONS !== 'undefined' && BUILTIN_TRANSLATIONS.fr)
      || UI18N
      || {};
    currentLang = lang || currentLang || 'fr';
    try { localStorage.setItem('midjaas_lang', currentLang); localStorage.setItem('dnd_lang', currentLang); } catch(e) {}
    applyTranslations();
    if (typeof applyI18n === 'function') applyI18n();
    applyAllCustomLabels();
  }
}

function applyTranslations() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const val = uiT(key, (typeof t === 'function' ? t(key, el.textContent) : el.textContent));
    el.textContent = val;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key) return;
    el.setAttribute('placeholder', uiT(key, el.getAttribute('placeholder') || ''));
  });

  const fr = document.querySelector('input[name="lang-switch"][value="fr"]');
  const en = document.querySelector('input[name="lang-switch"][value="en"]');
  if (fr) fr.checked = currentLang === 'fr';
  if (en) en.checked = currentLang === 'en';

  if (typeof updateTbNom === 'function') updateTbNom();
}


window.addEventListener('DOMContentLoaded', () => {
  loadTranslations(currentLang || localStorage.getItem('midjaas_lang') || localStorage.getItem('dnd_lang') || 'fr');
});


function preloadFicheImages() {
  try {
    const imgKeys = [];
    Object.values(data || {}).forEach(v => {
      if (v && typeof v === 'object' && typeof v.img === 'string' && v.img) imgKeys.push(v.img);
    });
    if (data?._fiche?.photoUrl) imgKeys.push(data._fiche.photoUrl);

    imgKeys.forEach(src => {
      const im = new Image();
      im.src = src;
    });
  } catch (e) {
    console.warn('Préchargement images impossible', e);
  }
}


/* === LEGAL FOOTER APPEARANCE === */
function initLegalFooterReveal() {
  const el = document.querySelector('.site-footer-bar');
  if (!el) return;
  el.classList.add('visible');
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initLegalFooterReveal, 200);
});




/* === CAMPAIGN V3 === */

function escapeHtml(str) {
  return String(str ?? '').replace(/[<>&"']/g, c => ({
    '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&#39;'
  }[c]));
}

function normalizeCampaignCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
}

function normalizeGmCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 7);
}

function formatCampaignCode(code) {
  const c = normalizeCampaignCode(code);
  return [c.slice(0,3), c.slice(3,6)].filter(Boolean).join(' ');
}

function formatGmCode(code) {
  const c = normalizeGmCode(code);
  return [c.slice(0,3), c.slice(3,7)].filter(Boolean).join(' ');
}

function generateLetters(n) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < n; i++) out += letters[Math.floor(Math.random() * letters.length)];
  return out;
}

function campaignRef(path) {
  const db = getFirebaseDbCompat();
  if (!db) {
    toast(uiT('toast.firebaseUnavailable','Firebase indisponible'));
    return null;
  }
  return db.ref(path);
}

async function getCampaignData(campaignCode) {
  const ref = campaignRef('campaigns/' + normalizeCampaignCode(campaignCode));
  if (!ref) return null;
  const snap = await ref.get();
  return snap.exists() ? snap.val() : null;
}

function getCampaignName(camp) {
  return camp?.name || uiT('campaign.defaultName','Campagne sans nom');
}

async function updateCampaignUi() {
  const campCode = normalizeCampaignCode(data._campaignCode || '');
  const player = normalizeSaveCode(data._firebaseSaveCode || localStorage.getItem('midjaas_save_code') || '');

  const curName = document.getElementById('campaign-current-name');
  const curCode = document.getElementById('campaign-current-code');
  const pl = document.getElementById('campaign-player-code');
  const created = document.getElementById('campaign-created-code');
  const createdGm = document.getElementById('campaign-created-gm-code');

  if (pl) pl.textContent = player ? formatSaveCode(player) : '—';
  if (created && data._lastCreatedCampaignCode) created.textContent = formatCampaignCode(data._lastCreatedCampaignCode);
  if (createdGm && data._lastCreatedGmCode) createdGm.textContent = formatGmCode(data._lastCreatedGmCode);

  if (campCode) {
    const camp = await getCampaignData(campCode);
    if (curName) curName.textContent = getCampaignName(camp);
    if (curCode) curCode.textContent = formatCampaignCode(campCode);
    await renderPlayerCampaignList(campCode);
  } else {
    if (curName) curName.textContent = '—';
    if (curCode) curCode.textContent = '—';
    const list = document.getElementById('campaign-player-visible-list');
    if (list) list.innerHTML = `<div class="param-info">${uiT('campaign.noCampaignJoined','Aucune campagne rejointe.')}</div>`;
  }
}

async function createCampaign() {
  try {
    const db = getFirebaseDbCompat();
    if (!db) {
      toast(uiT('toast.firebaseUnavailable','Firebase indisponible'));
      return;
    }

    let campaignCode = generateLetters(6);
    for (let i = 0; i < 8; i++) {
      const snap = await db.ref('campaigns/' + campaignCode).get();
      if (!snap.exists()) break;
      campaignCode = generateLetters(6);
    }

    const gmCode = generateLetters(7);
    const nameInput = document.getElementById('campaign-create-name');
    const name = (nameInput?.value || '').trim() || uiT('campaign.defaultName','Campagne sans nom');

    const payload = {
      name,
      code: campaignCode,
      gmCode,
      createdAt: Date.now(),
      players: {}
    };

    await db.ref('campaigns/' + campaignCode).set(payload);
    await db.ref('gmCampaigns/' + gmCode).set({ campaignCode, name, createdAt: Date.now() });

    data._lastCreatedCampaignCode = campaignCode;
    data._lastCreatedGmCode = gmCode;
    if (!data._managedCampaigns) data._managedCampaigns = {};
    data._managedCampaigns[campaignCode] = { campaignCode, gmCode, name };
    data._gmCampaignCode = campaignCode;
    persist();

    if (nameInput) nameInput.value = '';
    await updateCampaignUi();
    await renderManagedCampaigns();
    toast(uiT('campaign.created','Campagne créée') + ' : ' + formatCampaignCode(campaignCode));
  } catch (err) {
    console.error(err);
    toast(uiT('toast.firebaseSaveError','Erreur sauvegarde Firebase'));
  }
}

async function joinCampaignFromInput() {
  const raw = document.getElementById('campaign-join-code')?.value || '';
  const campaignCode = normalizeCampaignCode(raw);
  if (campaignCode.length !== 6) {
    toast(uiT('campaign.invalidCampaignCode','Code campagne invalide'));
    return;
  }

  const playerCode = getSaveCode();
  if (!playerCode) {
    toast(uiT('campaign.needSaveCode','Sauvegarde d’abord ta fiche pour obtenir un code joueur.'));
    return;
  }

  try {
    const camp = await getCampaignData(campaignCode);
    if (!camp) {
      toast(uiT('campaign.notFound','Campagne introuvable'));
      return;
    }

    if (data._campaignCode && normalizeCampaignCode(data._campaignCode) !== campaignCode) {
      const oldRef = campaignRef('campaigns/' + normalizeCampaignCode(data._campaignCode) + '/players/' + playerCode);
      if (oldRef) await oldRef.remove();
    }

    const name = data._char?.nom || playerCode;
    await campaignRef('campaigns/' + campaignCode + '/players/' + playerCode).set({
      playerCode,
      name,
      joinedAt: Date.now()
    });

    data._campaignCode = campaignCode;
    persist();
    await firebaseSaveToCode(playerCode);

    await updateCampaignUi();
    toast(uiT('campaign.joined','Campagne rejointe') + ' : ' + formatCampaignCode(campaignCode));
  } catch (err) {
    console.error(err);
    toast(uiT('toast.firebaseSaveError','Erreur sauvegarde Firebase'));
  }
}

async function leaveCampaign() {
  const campaignCode = normalizeCampaignCode(data._campaignCode || '');
  const playerCode = getSaveCode();

  if (!campaignCode) return;
  if (!confirm(uiT('campaign.confirmLeave','Quitter cette campagne ? Votre fiche ne sera pas supprimée.'))) return;

  try {
    if (playerCode) {
      const ref = campaignRef('campaigns/' + campaignCode + '/players/' + playerCode);
      if (ref) await ref.remove();
    }

    delete data._campaignCode;
    persist();
    if (playerCode) await firebaseSaveToCode(playerCode);

    await updateCampaignUi();
    toast(uiT('campaign.left','Campagne quittée'));
  } catch (err) {
    console.error(err);
    toast(uiT('toast.firebaseSaveError','Erreur sauvegarde Firebase'));
  }
}

async function gmLoadCampaignFromInput() {
  const raw = document.getElementById('campaign-gm-code-input')?.value || '';
  const gmCode = normalizeGmCode(raw);
  if (gmCode.length !== 7) {
    toast(uiT('campaign.invalidGmCode','Code MJ invalide'));
    return;
  }

  try {
    const gmSnap = await campaignRef('gmCampaigns/' + gmCode).get();
    if (!gmSnap.exists()) {
      toast(uiT('campaign.notFound','Campagne introuvable'));
      return;
    }

    const campaignCode = gmSnap.val()?.campaignCode;
    if (!campaignCode) {
      toast(uiT('campaign.notFound','Campagne introuvable'));
      return;
    }

    const camp = await getCampaignData(campaignCode);
    if (!camp) {
      toast(uiT('campaign.notFound','Campagne introuvable'));
      return;
    }

    if (!data._managedCampaigns) data._managedCampaigns = {};
    data._managedCampaigns[campaignCode] = { campaignCode, gmCode, name: getCampaignName(camp) };
    data._gmCampaignCode = campaignCode;
    data._gmCode = gmCode;
    persist();

    await renderManagedCampaigns();
    toast(uiT('campaign.loaded','Campagne chargée') + ' : ' + formatCampaignCode(campaignCode));
  } catch (err) {
    console.error(err);
    toast(uiT('toast.firebaseLoadError','Erreur chargement Firebase'));
  }
}

async function renderPlayerCampaignList(campaignCode = data._campaignCode) {
  const list = document.getElementById('campaign-player-visible-list');
  if (!list) return;

  const camp = await getCampaignData(campaignCode);
  const players = camp?.players || {};
  const entries = Object.values(players);

  if (!entries.length) {
    list.innerHTML = `<div class="param-info">${uiT('campaign.noPlayers','Aucun joueur dans cette campagne.')}</div>`;
    return;
  }

  const hydrated = await Promise.all(entries.map(p => hydrateCampaignPlayerPreview(p)));
  list.innerHTML = hydrated.map(p => renderCampaignPlayerAccordion(p, { gm: false })).join('');
}

async function hydrateCampaignPlayerPreview(p) {
  const code = normalizeSaveCode(p?.playerCode || p?.code || p?.saveCode);
  const base = { ...(p || {}), playerCode: code };
  if (!code) return base;

  try {
    const ref = campaignRef('saves/' + code);
    if (!ref) return base;
    const snap = await ref.get();
    if (!snap.exists()) return base;

    let loaded = snap.val();
    if (loaded && typeof loaded === 'object' && typeof loaded.payloadJson === 'string') loaded = JSON.parse(loaded.payloadJson);
    if (!loaded || typeof loaded !== 'object') return base;

    const c = loaded._char || {};
    const armorStats = loaded.armure?.armorStats || {};
    return {
      ...base,
      name: c.nom || base.name || code,
      preview: {
        labels: {
          char: loaded._charLabels || {},
          stat: loaded._statLabels || {},
          armor: loaded._armorLabels || {},
          armorEnabled: loaded._armorEnabled || {}
        },
        nom: c.nom || base.name || code,
        race: c.race || '',
        age: c.age || '',
        naissance: c.naiss || '',
        pv: c.pv || '',
        pvMax: c['pv-max'] || '',
        pa: c.pa || '',
        paMax: c['pa-max'] || '',
        ps: c.ps || '',
        psMax: c['ps-max'] || '',
        pe: c.pe || '',
        peMax: c['pe-max'] || '',
        dsnc: c.dsnc || '',
        dsncMax: c['dsnc-max'] || '',
        armorStats
      }
    };
  } catch (err) {
    console.warn('Aperçu joueur indisponible', code, err);
    return base;
  }
}

function formatPreviewPair(cur, max) {
  const a = String(cur ?? '').trim();
  const b = String(max ?? '').trim();
  if (a && b) return `${a} / ${b}`;
  return a || b || '—';
}

function renderCampaignPreviewField(label, value) {
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || '—')}</strong></div>`;
}

function getCampaignPreviewCharLabel(preview, key) {
  return preview?.labels?.char?.[key] || CHAR_LABEL_DEFAULTS[key] || key;
}

function getCampaignPreviewStatLabel(preview, key) {
  return preview?.labels?.stat?.[key] || key.toUpperCase();
}

function getCampaignPreviewArmorLabel(preview, key) {
  return preview?.labels?.armor?.[key] || ARMOR_STATS.find(s => s.key === key)?.defaultLabel || key.toUpperCase();
}

function isCampaignPreviewArmorEnabled(preview, key) {
  const enabled = preview?.labels?.armorEnabled;
  if (!enabled || enabled[key] === undefined) return key !== 'edpl';
  return !!enabled[key];
}


const __campaignPlayerCodeByToken = new Map();

function makeCampaignPlayerToken() {
  try {
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const arr = new Uint32Array(2);
      window.crypto.getRandomValues(arr);
      return 'cp_' + arr[0].toString(36) + arr[1].toString(36);
    }
  } catch (e) {}
  return 'cp_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function registerCampaignPlayerCode(code) {
  const clean = normalizeSaveCode(code);
  if (!clean) return '';
  const token = makeCampaignPlayerToken();
  __campaignPlayerCodeByToken.set(token, clean);
  return token;
}

function resolveCampaignPlayerCode(tokenOrCode) {
  const raw = String(tokenOrCode || '');
  if (__campaignPlayerCodeByToken.has(raw)) return __campaignPlayerCodeByToken.get(raw);
  return normalizeSaveCode(raw);
}

function renderCampaignPlayerAccordion(p, options = {}) {
  const code = normalizeSaveCode(p.playerCode || p.code || p.saveCode);
  const preview = p.preview || {};
  const displayName = preview.nom || p.name || uiT('campaign.defaultName','Campagne sans nom');
  const name = escapeHtml(displayName);
  const playerToken = escapeHtml(registerCampaignPlayerCode(code));
  const gmActions = options.gm ? `<button class="btn-sm danger" onclick="gmKickPlayer('${playerToken}')">${uiT('campaign.kick','Expulser')}</button>` : '';

  const armorStats = preview.armorStats || {};
  const armorFields = ARMOR_STATS
    .filter(s => isCampaignPreviewArmorEnabled(preview, s.key))
    .map(({ key }) => renderCampaignPreviewField(getCampaignPreviewArmorLabel(preview, key), armorStats[key]));

  const cartouche = [
    renderCampaignPreviewField(getCampaignPreviewCharLabel(preview, 'nom'), preview.nom || p.name),
    renderCampaignPreviewField(getCampaignPreviewCharLabel(preview, 'race'), preview.race),
    renderCampaignPreviewField(getCampaignPreviewCharLabel(preview, 'age'), preview.age),
    renderCampaignPreviewField(getCampaignPreviewCharLabel(preview, 'naiss'), preview.naissance),
    renderCampaignPreviewField(getCampaignPreviewStatLabel(preview, 'pv'), formatPreviewPair(preview.pv, preview.pvMax)),
    renderCampaignPreviewField(getCampaignPreviewStatLabel(preview, 'pa'), formatPreviewPair(preview.pa, preview.paMax)),
    renderCampaignPreviewField(getCampaignPreviewStatLabel(preview, 'ps'), formatPreviewPair(preview.ps, preview.psMax)),
    renderCampaignPreviewField(getCampaignPreviewStatLabel(preview, 'pe'), formatPreviewPair(preview.pe, preview.peMax)),
    renderCampaignPreviewField(getCampaignPreviewStatLabel(preview, 'dsnc'), formatPreviewPair(preview.dsnc, preview.dsncMax)),
    ...armorFields
  ].join('');

  return `
    <div class="campaign-player-accordion" data-player="${playerToken}">
      <button class="campaign-player-accordion-head" type="button" onclick="toggleCampaignPlayerCard(this)">
        <span class="campaign-player-name-v2">${name}</span>
        <span class="campaign-accordion-arrow-v3">▾</span>
      </button>
      <div class="campaign-player-accordion-body">
        <div class="campaign-player-card-v3 campaign-player-cartouche">
          <div class="campaign-player-cartouche-title">${name}</div>
          <div class="campaign-player-cartouche-grid">${cartouche}</div>
          <div class="campaign-player-actions">
            <button class="btn-sm" onclick="gmOpenSpectatorSheet('${playerToken}')">${uiT('campaign.loadSheet','Voir fiche')}</button>
            ${gmActions}
          </div>
        </div>
      </div>
    </div>
  `;
}

function toggleCampaignPlayerCard(btn) {
  const card = btn?.closest?.('.campaign-player-accordion');
  if (card) card.classList.toggle('open');
}

async function renderManagedCampaigns() {
  const list = document.getElementById('campaign-managed-list');
  if (!list) return;

  const managed = data._managedCampaigns || {};
  const entries = Object.values(managed);

  if (!entries.length) {
    list.innerHTML = `<div class="param-info">${uiT('campaign.noCampaignLoaded','Aucune campagne MJ chargée.')}</div>`;
    return;
  }

  const chunks = [];
  for (const entry of entries) {
    const campaignCode = normalizeCampaignCode(entry.campaignCode);
    const camp = await getCampaignData(campaignCode);
    const name = getCampaignName(camp || entry);
    const players = await Promise.all(Object.values(camp?.players || {}).map(p => hydrateCampaignPlayerPreview(p)));
    const isOpen = data._gmCampaignCode === campaignCode;

    chunks.push(`
      <div class="campaign-accordion-v3 ${isOpen ? 'open' : ''}" data-campaign="${campaignCode}">
        <div class="campaign-accordion-head-v3" onclick="toggleManagedCampaign('${campaignCode}')">
          <div class="campaign-accordion-name-v3">${escapeHtml(name)}</div>
          <div class="campaign-accordion-code-v3">${formatCampaignCode(campaignCode)} · ${formatGmCode(entry.gmCode || camp?.gmCode || '')}</div>
          <div class="campaign-accordion-arrow-v3">▾</div>
        </div>
        <div class="campaign-accordion-body-v3">
          <div class="campaign-rename-row">
            <input class="campaign-rename-input" id="campaign-rename-${campaignCode}" value="${escapeHtml(name)}">
            <button class="btn-sm" onclick="gmRenameCampaign('${campaignCode}')">${uiT('campaign.rename','Renommer')}</button>
          </div>
          ${players.length ? players.map(p => renderGmPlayerCard(p)).join('') : `<div class="param-info">${uiT('campaign.noPlayers','Aucun joueur dans cette campagne.')}</div>`}
        </div>
      </div>
    `);
  }

  list.innerHTML = chunks.join('');
}

function renderGmPlayerCard(p) {
  return renderCampaignPlayerAccordion(p, { gm: true });
}

function toggleManagedCampaign(campaignCode) {
  const clean = normalizeCampaignCode(campaignCode);
  data._gmCampaignCode = normalizeCampaignCode(data._gmCampaignCode || '') === clean ? '' : clean;
  persist();
  renderManagedCampaigns();
}

async function gmLoadPlayerSheet(playerCode) {
  const code = resolveCampaignPlayerCode(playerCode);
  if (!code) return;
  if (!confirm(uiT('campaign.confirmLoadPlayer','Charger la fiche de ce joueur ? Votre fiche actuelle sera remplacée.'))) return;

  try {
    const snap = await campaignRef('saves/' + code).get();
    if (!snap.exists()) {
      toast(uiT('toast.noSaveFound','Aucune sauvegarde trouvée'));
      return;
    }

    let loaded = snap.val();
    if (loaded && typeof loaded === 'object' && typeof loaded.payloadJson === 'string') {
      loaded = JSON.parse(loaded.payloadJson);
    }

    createRecoveryPoint('before-gm-load-player');
    data = sanitizeImport(loaded);
    data._firebaseSaveCode = code;
    localStorage.setItem('midjaas_save_code', code);

    if (typeof preloadFicheImages === 'function') preloadFicheImages();

    const bag = document.getElementById('bagSize');
    if (bag) bag.value = data._bagSize || 'sacoche';

    buildBag(); buildPoche(); buildSpe(); refresh(); loadChar(); renderFiche();
    applyStatLabels(); applyCharLabels(); applyCatLabels(); applyMagieSetting(); applyParamShow(); applyStatSplits();
    applyEffetsPlus(); applySlotLabels(); applyFicheSectionLabels(); applyAllQualityColors();
    buildBourseRows(); refreshArmorStats();

    // Appliquer le thème embarqué si présent
    if (data._exportTheme && typeof data._exportTheme === 'object') {
      const root = document.documentElement;
      const t = data._exportTheme;
      Object.entries(t).forEach(([k, v]) => { if (v) root.style.setProperty(k, v); });
      if (data._exportFont) root.style.setProperty('--font', data._exportFont);
    }

    await updateCampaignUi();
    persist();

    setTimeout(() => {
      document.querySelectorAll('#page-fiche .fiche-stat-inp').forEach(el => { if (typeof resizeFicheInp === 'function') resizeFicheInp(el); });
      if (typeof resizeAllCartouche === 'function') resizeAllCartouche();
    }, 80);

    toast(uiT('campaign.loadSheet','Voir fiche'));
  } catch (err) {
    console.error(err);
    toast(uiT('toast.firebaseLoadError','Erreur chargement Firebase'));
  }
}


/* === CAMPAIGN SPECTATOR MODE === */
let __midjaasSpectatorBackup = null;
let __midjaasSpectatorPage = 'campagne';

function clonePlain(obj) { try { return JSON.parse(JSON.stringify(obj || {})); } catch (e) { return {}; } }
function getActivePageName() { const active = document.querySelector('.page.active'); return active?.id?.replace(/^page-/, '') || 'fiche'; }

function ensureSpectatorBar() {
  let bar = document.getElementById('spectator-bar');
  if (bar) return bar;
  bar = document.createElement('div');
  bar.id = 'spectator-bar';
  bar.className = 'spectator-bar';
  bar.innerHTML = `<div class="spectator-bar-main"><strong id="spectator-title">${uiT('spectator.title','Mode spectateur')}</strong><span id="spectator-subtitle">${uiT('spectator.info','Lecture seule · clic droit pour les infobulles')}</span></div><button class="btn-sm spectator-close" onclick="closeSpectatorSheet()">${uiT('spectator.close','Fermer')}</button>`;
  document.body.appendChild(bar);
  return bar;
}

function refreshAllAfterDataSwap() {
  const bag = document.getElementById('bagSize'); if (bag) bag.value = data._bagSize || 'sacoche';
  if (typeof preloadFicheImages === 'function') preloadFicheImages();
  if (typeof buildBag === 'function') buildBag();
  if (typeof buildPoche === 'function') buildPoche();
  if (typeof buildSpe === 'function') buildSpe();
  if (typeof refresh === 'function') refresh();
  if (typeof loadChar === 'function') loadChar();
  if (typeof renderFiche === 'function') renderFiche();
  if (typeof renderCompetences === 'function') renderCompetences();
  if (typeof renderCapital === 'function') renderCapital();
  if (typeof applyStatLabels === 'function') applyStatLabels();
  if (typeof applyCharLabels === 'function') applyCharLabels();
  if (typeof applyCatLabels === 'function') applyCatLabels();
  if (typeof applyMagieSetting === 'function') applyMagieSetting();
  if (typeof applyParamShow === 'function') applyParamShow();
  if (typeof applyStatSplits === 'function') applyStatSplits();
  if (typeof applyEffetsPlus === 'function') applyEffetsPlus();
  if (typeof applySlotLabels === 'function') applySlotLabels();
  if (typeof applyFicheSectionLabels === 'function') applyFicheSectionLabels();
  if (typeof applyAllQualityColors === 'function') applyAllQualityColors();
  if (typeof buildBourseRows === 'function') buildBourseRows();
  if (typeof refreshArmorStats === 'function') refreshArmorStats();
  if (typeof initInventoryRefactor === 'function') initInventoryRefactor();
  if (typeof initProsthesesSystem === 'function') initProsthesesSystem();
  if (typeof updateTbNom === 'function') updateTbNom();
}

function setSpectatorReadonlyDom() {
  document.body.classList.toggle('spectator-mode', !!window.__midjaasSpectatorActive);
  if (!window.__midjaasSpectatorActive) return;
  document.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.closest('#spectator-bar')) return;
    el.setAttribute('readonly', 'readonly');
    if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio' || el.type === 'file') el.setAttribute('disabled', 'disabled');
  });
}

async function gmOpenSpectatorSheet(playerCode) {
  const code = resolveCampaignPlayerCode(playerCode);
  if (!code) return;
  try {
    const snap = await campaignRef('saves/' + code).get();
    if (!snap.exists()) { toast(uiT('toast.noSaveFound','Aucune sauvegarde trouvée')); return; }
    let loaded = snap.val();
    if (loaded && typeof loaded === 'object' && typeof loaded.payloadJson === 'string') loaded = JSON.parse(loaded.payloadJson);
    if (!loaded || typeof loaded !== 'object') { toast(uiT('toast.invalidSave','Sauvegarde invalide')); return; }
    if (!window.__midjaasSpectatorActive) { __midjaasSpectatorBackup = clonePlain(data); __midjaasSpectatorPage = getActivePageName(); }
    window.__midjaasSpectatorActive = true;
    data = clonePlain(loaded);
    data._firebaseSaveCode = code;
    ensureSpectatorBar();
    document.body.classList.add('spectator-mode');
    const title = document.getElementById('spectator-title');
    const subtitle = document.getElementById('spectator-subtitle');
    if (title) title.textContent = uiT('spectator.title','Mode spectateur') + ' — ' + (data._char?.nom || uiT('campaign.loadSheet','Voir fiche'));
    if (subtitle) subtitle.textContent = uiT('spectator.info','Lecture seule · clic droit pour les infobulles');
    refreshAllAfterDataSwap();
    showPage('fiche');
    setSpectatorReadonlyDom();
    toast(uiT('spectator.opened','Fiche ouverte en spectateur'));
  } catch (err) { console.error(err); toast(uiT('toast.firebaseLoadError','Erreur chargement Firebase')); }
}

function closeSpectatorSheet() {
  if (!window.__midjaasSpectatorActive) return;
  window.__midjaasSpectatorActive = false;
  data = clonePlain(__midjaasSpectatorBackup || {});
  __midjaasSpectatorBackup = null;
  const bar = document.getElementById('spectator-bar'); if (bar) bar.remove();
  document.body.classList.remove('spectator-mode');
  document.querySelectorAll('input[readonly], textarea[readonly]').forEach(el => el.removeAttribute('readonly'));
  document.querySelectorAll('select[disabled], input[disabled]').forEach(el => el.removeAttribute('disabled'));
  refreshAllAfterDataSwap();
  showPage(__midjaasSpectatorPage || 'campagne');
  toast(uiT('spectator.closed','Mode spectateur fermé'));
}

window.addEventListener('keydown', ev => { if (ev.key === 'Escape' && window.__midjaasSpectatorActive) closeSpectatorSheet(); });

async function gmKickPlayer(playerCode) {
  const campaignCode = normalizeCampaignCode(data._gmCampaignCode || '');
  const code = resolveCampaignPlayerCode(playerCode);
  if (!campaignCode || !code) return;
  if (!confirm(uiT('campaign.confirmKick','Expulser ce joueur de la campagne ?'))) return;

  try {
    await campaignRef('campaigns/' + campaignCode + '/players/' + code).remove();

    const snap = await campaignRef('saves/' + code).get();
    if (snap.exists()) {
      let loaded = snap.val();
      if (loaded && typeof loaded === 'object' && typeof loaded.payloadJson === 'string') {
        loaded = JSON.parse(loaded.payloadJson);
      }
      if (loaded && typeof loaded === 'object' && normalizeCampaignCode(loaded._campaignCode) === campaignCode) {
        delete loaded._campaignCode;
        await campaignRef('saves/' + code).set({
          payloadJson: JSON.stringify(loaded),
          savedAt: Date.now(),
          version: 2
        });
      }
    }

    await renderManagedCampaigns();
    await updateCampaignUi();
    toast(uiT('campaign.playerKicked','Joueur expulsé'));
  } catch (err) {
    console.error(err);
    toast(uiT('toast.firebaseSaveError','Erreur sauvegarde Firebase'));
  }
}


async function gmRenameCampaign(campaignCode) {
  const clean = normalizeCampaignCode(campaignCode);
  const input = document.getElementById('campaign-rename-' + clean);
  const newName = (input?.value || '').trim() || uiT('campaign.defaultName','Campagne sans nom');

  try {
    const campRef = campaignRef('campaigns/' + clean + '/name');
    if (!campRef) return;
    await campRef.set(newName);

    const managed = data._managedCampaigns || {};
    if (managed[clean]) managed[clean].name = newName;
    data._managedCampaigns = managed;

    const gmCode = managed[clean]?.gmCode;
    if (gmCode) {
      const gmNameRef = campaignRef('gmCampaigns/' + gmCode + '/name');
      if (gmNameRef) await gmNameRef.set(newName);
    }

    persist();
    await renderManagedCampaigns();
    await updateCampaignUi();
    toast(uiT('campaign.renamed','Campagne renommée'));
  } catch (err) {
    console.error(err);
    toast(uiT('toast.firebaseSaveError','Erreur sauvegarde Firebase'));
  }
}

function initCampaignInputs() {
  [
    ['campaign-join-code', formatCampaignCode],
    ['campaign-gm-code-input', formatGmCode],
  ].forEach(([id, formatter]) => {
    const input = document.getElementById(id);
    if (!input || input.dataset.campaignReady) return;
    input.addEventListener('input', () => input.value = formatter(input.value));
    input.dataset.campaignReady = '1';
  });
  updateCampaignUi();
  renderManagedCampaigns();
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initCampaignInputs, 0);
});


/* === ARKELITH EASTER EGG : POINT DE QI === */
let midjaasEggClicks = 0;
let midjaasEggTimer = null;

function playQuestSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.85);
    master.connect(ctx.destination);

    const notes = [
      [523.25, 0.00, 0.16], // C5
      [659.25, 0.14, 0.16], // E5
      [783.99, 0.28, 0.20], // G5
      [1046.5, 0.46, 0.30]  // C6
    ];

    notes.forEach(([freq, start, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);

      osc.connect(gain);
      gain.connect(master);

      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.04);
    });

    setTimeout(() => ctx.close?.(), 1200);
  } catch (err) {
    console.warn('Son easter egg impossible', err);
  }
}

function getPocheKeys() {
  // Les vraies poches du code sont nommées poche_0, poche_1, etc.
  const n = (typeof POCKET_N === 'number' && POCKET_N > 0) ? POCKET_N : 6;
  return Array.from({ length: n }, (_, i) => 'poche_' + i);
}

function findEmptyPocheKey() {
  const keys = getPocheKeys();
  for (const key of keys) {
    const v = data[key];
    if (!v || !v.nom) return key;
  }
  return null;
}

function addPointDeQi() {
  const key = findEmptyPocheKey();
  if (!key) {
    toast('Aucune poche libre');
    return;
  }

  data[key] = {
    nom: 'Point de QI.',
    type: 'Point de QI.',
    effet: 'Augmente de 1 le QI du joueur.',
    img: 'https://media.discordapp.net/attachments/348605443314024460/1498876298293149826/unknown.png?ex=69f2c0d5&is=69f16f55&hm=e8772f5e0adcf792220a0d306185e630146fadf84b80365023f948a65329b9c1&=&format=webp&quality=lossless'
  };

  buildPoche();
  refresh();
  persist();
  toast('Objet obtenu : Point de QI.');
}

function triggerMidjaasEgg() {
  const title = document.getElementById('midjaas-title-egg') || document.querySelector('.tb-title');
  title?.classList.remove('egg-pulse');
  void title?.offsetWidth;
  title?.classList.add('egg-pulse');

  playQuestSound();
  addPointDeQi();
}

function initMidjaasEasterEgg() {
  const title = document.getElementById('midjaas-title-egg') || document.querySelector('.tb-title');
  if (!title || title.dataset.eggReady) return;

  title.addEventListener('click', () => {
    midjaasEggClicks++;

    clearTimeout(midjaasEggTimer);
    midjaasEggTimer = setTimeout(() => {
      midjaasEggClicks = 0;
    }, 1200);

    if (midjaasEggClicks >= 3) {
      midjaasEggClicks = 0;
      clearTimeout(midjaasEggTimer);
      triggerMidjaasEgg();
    }
  });

  title.dataset.eggReady = '1';
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initMidjaasEasterEgg, 100);
});


/* === EASTER EGG CLICK FIX : hitbox centrale === */
let midjaasEggHitboxClicks = 0;
let midjaasEggHitboxTimer = null;

function isInsideMidjaasTitleHitbox(ev) {
  const title = document.getElementById('midjaas-title-egg') || document.querySelector('.tb-title');
  if (!title) return false;

  const r = title.getBoundingClientRect();

  // Hitbox un peu plus large que le texte, mais centrée sur lui.
  const padX = 24;
  const padY = 8;

  return (
    ev.clientX >= r.left - padX &&
    ev.clientX <= r.right + padX &&
    ev.clientY >= r.top - padY &&
    ev.clientY <= r.bottom + padY
  );
}

function initMidjaasEasterEggHitboxFix() {
  if (window.__midjaasEggHitboxFixReady) return;
  window.__midjaasEggHitboxFixReady = true;

  document.addEventListener('click', (ev) => {
    if (!isInsideMidjaasTitleHitbox(ev)) return;

    // Empêche le clic de tomber sur Sauvegarder / Charger ou autres boutons.
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    midjaasEggHitboxClicks++;

    clearTimeout(midjaasEggHitboxTimer);
    midjaasEggHitboxTimer = setTimeout(() => {
      midjaasEggHitboxClicks = 0;
    }, 1200);

    if (midjaasEggHitboxClicks >= 3) {
      midjaasEggHitboxClicks = 0;
      clearTimeout(midjaasEggHitboxTimer);
      triggerMidjaasEgg();
    }
  }, true);
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initMidjaasEasterEggHitboxFix, 150);
});


/* === INVENTORY REFACTOR TEST : rings + custom inventory === */

function getRingCount() {
  const n = parseInt(data._ringCount || 2, 10);
  return [1,2,4,6,8,10].includes(n) ? n : 2;
}

function setRingCount(v) {
  data._ringCount = parseInt(v, 10) || 2;
  persist();
  renderRingsSlot();

  const panel = document.getElementById('rings-float');
  if (panel?.classList.contains('open')) {
    openRingsPanel({ currentTarget: document.getElementById('sl-rings'), keepPosition: true });
  }
}

function ringKey(i) {
  return 'anneau' + i;
}

function renderRingMini(i, large = false) {
  const key = ringKey(i);
  const d = data[key] || {};
  const label = d.nom ? escapeHtml(d.nom) : (uiT('inventory.rings','Anneaux') + ' ' + i);
  const cls = d.nom ? 'ring-mini-name' : 'ring-mini-empty';
  return `<div class="ring-mini ${d.nom ? 'filled' : ''}" id="sl-${key}" data-slot-key="${key}" onclick="event.stopPropagation(); open_('${key}')">
    <span class="${cls}">${label}</span>
    ${large && d.type ? `<span class="val-type">${escapeHtml(d.type)}</span>` : ''}
    ${large && d.effet ? `<span class="val-effet">${escapeHtml(d.effet)}</span>` : ''}
  </div>`;
}

function renderRingsSlot() {
  const select = document.getElementById('ring-count-select');
  const inline = document.getElementById('rings-inline');
  const hint = document.getElementById('rings-more-hint');
  const count = getRingCount();

  if (select) select.value = String(count);
  if (!inline) return;

  inline.className = 'rings-inline count-' + Math.min(count, 4);

  if (count <= 4) {
    inline.innerHTML = Array.from({length: count}, (_, i) => renderRingMini(i + 1)).join('');
    if (hint) hint.textContent = '';

    Array.from({length: count}, (_, i) => ringKey(i+1)).forEach(k => {
      const el = document.getElementById('sl-' + k);
      if (el) {
        if (typeof makeDraggable === 'function') makeDraggable(el, k);
        if (typeof makeDropTarget === 'function') makeDropTarget(el, k);
        if (typeof attachSlotPreview === 'function') attachSlotPreview(el, k);
      }
    });
  } else {
    const filled = Array.from({length: count}, (_, i) => data[ringKey(i+1)]?.nom).filter(Boolean).length;
    inline.innerHTML = `
      <div class="rings-summary" onclick="event.stopPropagation(); openRingsPanel(event)">
        <span class="rings-summary-symbol">◯</span>
        <span class="rings-summary-text">
          <span class="rings-summary-count">${filled}/${count}</span>
          <span class="rings-summary-hint">${uiT('inventory.rings','Anneaux')}</span>
        </span>
      </div>
    `;
    if (hint) hint.textContent = '';
  }
}

function openRingsPanel(ev) {
  const count = getRingCount();
  if (count <= 4 && ev?.target?.closest?.('.ring-mini')) return;

  const panel = document.getElementById('rings-float');
  const grid = document.getElementById('rings-float-grid');
  if (!panel || !grid) return;

  const wasOpen = panel.classList.contains('open');
  grid.innerHTML = Array.from({length: count}, (_, i) => renderRingMini(i + 1, true)).join('');
  panel.classList.add('open');

  // Si la fenêtre est déjà ouverte ou déplacée, on conserve sa position.
  if (!wasOpen && !panel.dataset.moved && !ev?.keepPosition) {
    const r = (ev?.currentTarget || document.getElementById('sl-rings')).getBoundingClientRect();
    const left = Math.min(window.innerWidth - panel.offsetWidth - 12, Math.max(12, r.left));
    const top = Math.min(window.innerHeight - panel.offsetHeight - 12, Math.max(12, r.bottom + 8));
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  }

  // Important : dans la fenêtre, les IDs peuvent exister ailleurs dans la page.
  // On attache donc les comportements directement aux éléments du panneau.
  grid.querySelectorAll('.ring-mini').forEach(el => {
    const k = el.dataset.slotKey;
    if (!k) return;

    if (typeof makeDraggable === 'function') makeDraggable(el, k);
    if (typeof makeDropTarget === 'function') makeDropTarget(el, k);

    // Infobulle clic droit spéciale, directe, sans dépendre d'un ID global.
    el.oncontextmenu = e => e.preventDefault();
    el.onmousedown = e => {
      if (e.button !== 2) return;
      e.preventDefault();
      const d = data[k] || {};
      showSlotPreview(e, d, d.armorStats || null); document.querySelector('.slot-preview')?.style?.setProperty('z-index','9999');
    };
    el.onmouseup = e => { if (e.button === 2) hideSlotPreview(); };
    el.onmouseleave = hideSlotPreview;
  });

  initRingsFloatDrag();
}

function closeRingsPanel() {
  document.getElementById('rings-float')?.classList.remove('open');
}











function initInventoryRefactor() {
  renderRingsSlot();
  if (typeof renderProsthesesPanel === 'function') renderProsthesesPanel();
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initInventoryRefactor, 100);
});


function initRingsFloatDrag() {
  const panel = document.getElementById('rings-float');
  const head = panel?.querySelector('.rings-float-head');
  if (!panel || !head || panel.dataset.dragReady === 'document') return;

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let pointerId = null;

  function canStartDrag(ev) {
    // On peut déplacer depuis le titre ou le fond du panneau,
    // mais pas depuis les anneaux ni les boutons/champs.
    if (ev.target.closest('button, input, select, textarea, .ring-mini')) return false;
    return ev.target === panel || ev.target.closest('.rings-float-head');
  }

  function start(ev) {
    if (!canStartDrag(ev)) return;
    dragging = true;
    pointerId = ev.pointerId;
    panel.classList.add('dragging-window');
    const r = panel.getBoundingClientRect();
    offsetX = ev.clientX - r.left;
    offsetY = ev.clientY - r.top;
    ev.preventDefault();
  }

  function move(ev) {
    if (!dragging) return;
    if (pointerId !== null && ev.pointerId !== pointerId) return;

    const maxLeft = window.innerWidth - panel.offsetWidth - 8;
    const maxTop = window.innerHeight - panel.offsetHeight - 8;
    const left = Math.min(maxLeft, Math.max(8, ev.clientX - offsetX));
    const top = Math.min(maxTop, Math.max(8, ev.clientY - offsetY));

    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.dataset.moved = '1';
    ev.preventDefault();
  }

  function end(ev) {
    if (pointerId !== null && ev.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    panel.classList.remove('dragging-window');
  }

  panel.addEventListener('pointerdown', start);
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);

  panel.dataset.dragReady = 'document';
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initRingsFloatDrag, 120);
});


/* === PROSTHESES PANEL + SPECIAL INVENTORY LABELS === */

function getInventorySpecialLabel(key) {
  const fallback = key === 'rings'
    ? uiT('inventory.rings','Anneaux')
    : uiT('inventory.prostheses','Prothèses');
  return data._inventorySpecialLabels?.[key] || fallback;
}

function saveInventorySpecialLabel(key, val) {
  if (!data._inventorySpecialLabels) data._inventorySpecialLabels = {};
  data._inventorySpecialLabels[key] = val.trim();
  persist();
  applyInventorySpecialLabels();
}

function applyInventorySpecialLabels() {
  const rings = getInventorySpecialLabel('rings');
  const prostheses = getInventorySpecialLabel('prostheses');

  document.querySelectorAll('[data-i18n="inventory.rings"]').forEach(el => {
    el.textContent = rings;
  });

  const prostEls = [
    document.getElementById('prostheses-trigger-label'),
    document.getElementById('prostheses-panel-title')
  ];
  prostEls.forEach(el => { if (el) el.textContent = prostheses; });

  const ringInput = document.getElementById('cfg-label-rings');
  const prostInput = document.getElementById('cfg-label-prostheses');
  if (ringInput && document.activeElement !== ringInput) ringInput.value = data._inventorySpecialLabels?.rings || '';
  if (prostInput && document.activeElement !== prostInput) prostInput.value = data._inventorySpecialLabels?.prostheses || '';
}

function toggleProsthesesPanel(force) {
  const panel = document.getElementById('prostheses-panel');
  const trigger = document.querySelector('.prostheses-trigger');
  if (!panel) return;

  const open = force === undefined ? !panel.classList.contains('open') : !!force;
  panel.classList.toggle('open', open);
  trigger?.classList.toggle('open', open);

  if (open) {
    renderProsthesesPanel();
  }
}


function getDefaultProsthesisLabel(key) {
  const map = {
    tete: uiT('prostheses.head','Tête'),
    oeilG: uiT('prostheses.leftEye','Œil gauche'),
    oeilD: uiT('prostheses.rightEye','Œil droit'),
    brasG: uiT('prostheses.leftArm','Bras gauche'),
    brasD: uiT('prostheses.rightArm','Bras droit'),
    corps: uiT('prostheses.body','Corps'),
    jambeG: uiT('prostheses.leftLeg','Jambe gauche'),
    jambeD: uiT('prostheses.rightLeg','Jambe droite'),
    extra1: uiT('prostheses.extra1','Module 1'),
    extra2: uiT('prostheses.extra2','Module 2'),
    extra3: uiT('prostheses.extra3','Module 3'),
    extra4: uiT('prostheses.extra4','Module 4'),
    extra5: uiT('prostheses.extra5','Module 5'),
  };
  return map[key] || key;
}

function getProsthesisLabel(key) {
  return data._prosthesisLabels?.[key] || getDefaultProsthesisLabel(key);
}

function saveProsthesisLabel(key, val) {
  if (!data._prosthesisLabels) data._prosthesisLabels = {};
  const clean = String(val || '').trim();
  if (clean) data._prosthesisLabels[key] = clean;
  else delete data._prosthesisLabels[key];
  persist();
  applyProsthesisLabels();
}

function resetProsthesisLabels() {
  delete data._prosthesisLabels;
  delete data._prosthesisGroupLabels;
  persist();
  applyProsthesisLabels();
  applyProsthesisGroupLabels();
  setTimeout(() => { renderProsthesisLabelParams(); }, 120);
  toast(uiT('toast.prosthesisLabelsReset','Noms de prothèses réinitialisés.'));
}

// ── Renommage des groupes de prothèses ──
function getDefaultProsthesisGroupLabel(key) {
  const map = {
    tete:    uiT('prostheses.groupHead','Tête'),
    bras:    uiT('prostheses.groupArmsBody','Bras / Corps'),
    jambes:  uiT('prostheses.groupLegs','Jambes'),
    modules: uiT('prostheses.groupModules','Modules'),
  };
  return map[key] || key;
}

function getProsthesisGroupLabel(key) {
  return data._prosthesisGroupLabels?.[key] || getDefaultProsthesisGroupLabel(key);
}

function saveProsthesisGroupLabel(key, val) {
  if (!data._prosthesisGroupLabels) data._prosthesisGroupLabels = {};
  const clean = String(val || '').trim();
  if (clean) data._prosthesisGroupLabels[key] = clean;
  else delete data._prosthesisGroupLabels[key];
  persist();
  applyProsthesisGroupLabels();
}

function applyProsthesisGroupLabels() {
  const map = {
    tete:    { i18n: 'prostheses.groupHead',     inp: 'cfg-group-tete' },
    bras:    { i18n: 'prostheses.groupArmsBody',  inp: 'cfg-group-bras' },
    jambes:  { i18n: 'prostheses.groupLegs',      inp: 'cfg-group-jambes' },
    modules: { i18n: 'prostheses.groupModules',   inp: 'cfg-group-modules' },
  };
  Object.entries(map).forEach(([key, cfg]) => {
    const label = getProsthesisGroupLabel(key);
    // Mettre à jour les titres de groupes dans l'inventaire
    document.querySelectorAll('[data-i18n="' + cfg.i18n + '"]').forEach(el => {
      el.textContent = label;
    });
    // Mettre à jour le champ de saisie dans Paramètres
    const inp = document.getElementById(cfg.inp);
    if (inp && document.activeElement !== inp) {
      inp.value = data._prosthesisGroupLabels?.[key] || '';
      inp.placeholder = getDefaultProsthesisGroupLabel(key);
    }
  });
}

function renderProsthesisLabelParams() {
  const keys = ['tete','oeilG','oeilD','brasG','corps','brasD','jambeG','jambeD','extra1','extra2','extra3','extra4','extra5'];
  keys.forEach(key => {
    const el = document.getElementById('cfg-prost-' + key);
    if (el && document.activeElement !== el) {
      el.value = data._prosthesisLabels?.[key] || '';
      el.placeholder = getDefaultProsthesisLabel(key);
    }
  });
}

function applyProsthesisLabels() {
  document.querySelectorAll('[data-prost-label]').forEach(el => {
    const key = el.getAttribute('data-prost-label');
    el.textContent = getProsthesisLabel(key);
  });
  applyProsthesisGroupLabels();
  setTimeout(() => { renderProsthesisLabelParams(); }, 120);
}

function renderProsthesesPanel() {
  const panel = document.getElementById('prostheses-panel');
  if (!panel) return;

  if (typeof applyProsthesisLabels === 'function') applyProsthesisLabels();

  (PROSTHESIS_SLOTS || []).forEach(key => {
    const d = data[key] || {};
    const sl = document.getElementById('sl-' + key);
    const n  = document.getElementById('dsp-' + key + '-nom');
    const tp = document.getElementById('dsp-' + key + '-type');
    const ef = document.getElementById('dsp-' + key + '-effet');

    if (n) n.textContent = d.nom || '—';
    if (tp) tp.textContent = d.type || '';
    if (ef) ef.textContent = d.effet || '';

    if (!sl) return;

    sl.classList.toggle('filled', !!d.nom);

    if (!sl.dataset.prostReady) {
      if (typeof makeDraggable === 'function') makeDraggable(sl, key);
      if (typeof makeDropTarget === 'function') makeDropTarget(sl, key);
      if (typeof attachSlotPreview === 'function') attachSlotPreview(sl, key);
      sl.dataset.prostReady = '1';
    }

    // Bug fix : couleur qualité — toujours appeler avec null si vide pour réinitialiser
    if (typeof applyQualityColor === 'function') {
      applyQualityColor(sl, (d.quality !== undefined && d.quality !== null) ? d.quality : null);
    }

    // Bug fix : image de l'objet dans le slot prothèse
    let bg = sl.querySelector('.slot-img-bg');
    if (d.img) {
      if (!bg) {
        bg = document.createElement('div');
        bg.className = 'slot-img-bg loading';
        sl.insertBefore(bg, sl.firstChild);
      }
      if (bg.dataset.src !== d.img) {
        bg.dataset.src = d.img;
        bg.classList.remove('loaded'); bg.classList.add('loading');
        const img = new Image();
        img.onload = () => { bg.style.backgroundImage = `url('${d.img}')`; bg.classList.remove('loading'); bg.classList.add('loaded'); };
        img.onerror = () => { bg.classList.remove('loading'); };
        img.src = d.img;
      } else {
        bg.classList.remove('loading'); bg.classList.add('loaded');
      }
    } else if (bg) {
      bg.remove();
    }
  });
}

function initProsthesesSystem() {
  applyInventorySpecialLabels();
  applyProsthesisGroupLabels();
  renderProsthesesPanel();
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(initProsthesesSystem, 150);
});

function toggleParamAccordion(el) { toggleAccordion(el); }



/* === CLEAN SAFE BOOT === */
function safeRefreshLateUi() {
  try { if (typeof applyAllCustomLabels === 'function') applyAllCustomLabels(); } catch(e) { console.warn(e); }
  try { if (typeof renderProsthesesPanel === 'function') renderProsthesesPanel(); } catch(e) { console.warn(e); }
  try { if (typeof renderProsthesisLabelParams === 'function') renderProsthesisLabelParams(); } catch(e) { console.warn(e); }
  try { if (typeof initMidjaasEasterEgg === 'function') initMidjaasEasterEgg(); } catch(e) { console.warn(e); }
  try { if (typeof initRingsFloatDrag === 'function') initRingsFloatDrag(); } catch(e) { console.warn(e); }
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(safeRefreshLateUi, 250);
});
