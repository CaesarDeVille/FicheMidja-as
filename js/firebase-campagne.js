(function() {
  // ── Init ──
  const FB_CFG = {
    apiKey: "AIzaSyAbpulYeObmWABpe4uFr6ufYSmtQ1em9d4",
    authDomain: "midjaasfichesrpg.firebaseapp.com",
    databaseURL: "https://midjaasfichesrpg-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "midjaasfichesrpg",
    storageBucket: "midjaasfichesrpg.firebasestorage.app",
    messagingSenderId: "428543060349",
    appId: "1:428543060349:web:eb7505960429eae4dc4414"
  };
  if (!firebase.apps.length) firebase.initializeApp(FB_CFG);
  const db = firebase.database();

  // ── State ──
  let mjCodes = [];      // codes des campagnes MJ
  let mjListeners = {};  // listeners par code
  let joueurCode = null;
  let joueurKey  = null;

  // ── Toast ──
  function toast(msg, ok) {
    campToastFn(msg, ok);
  }
  function campToastFn(msg, ok) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 20px;border-radius:6px;font-size:13px;z-index:9999;pointer-events:none;color:#fff;border:1px solid '+(ok?'#4aaa7a':'#c04040')+';background:'+(ok?'#1e3a1e':'#3a1010')+';';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(), 3000);
  }

  // ── Génère code ──
  function genCode() {
    const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s=''; for(let i=0;i<6;i++) s+=c[Math.floor(Math.random()*c.length)];
    return s;
  }

  // ── MJ : Créer campagne ──
  window.createCampagne = function() {
    const name = (document.getElementById('camp-name').value||'').trim() || 'Campagne';
    const code = genCode();   // code joueurs
    const mjCode = genCode(); // code MJ secret
    db.ref('campagnes/'+code).set({ name, createdAt: Date.now(), mjCode })
      .then(()=>{
        toast('Campagne "'+name+'" créée !', true);
        saveMjCode(code, name, mjCode);
        renderMjCampagnes();
        listenCampagne(code);
        document.getElementById('camp-name').value = '';
        // Show both codes
        const d = document.getElementById('camp-code-display');
        if (d) {
          d.style.display = '';
          d.innerHTML = '<div style="margin-bottom:8px;">'
            +'<div style="font-size:11px;color:var(--muted);letter-spacing:1px;margin-bottom:4px;">CODE JOUEURS (à partager)</div>'
            +'<div style="font-size:28px;color:var(--gold);letter-spacing:6px;font-weight:bold;border:2px solid var(--gold);border-radius:6px;padding:8px 16px;display:inline-block;">'+code+'</div>'
            +'<button class="camp-btn-sm" style="display:block;margin:6px auto 0;" onclick="navigator.clipboard.writeText(\''+code+'\').then(()=>campToastFn(\'Code joueur copié !\',true))">Copier</button>'
            +'</div>'
            +'<div style="margin-top:10px;border-top:1px solid var(--border2);padding-top:10px;">'
            +'<div style="font-size:11px;color:#c04040;letter-spacing:1px;margin-bottom:4px;">CODE MJ (gardez-le secret !)</div>'
            +'<div style="font-size:28px;color:#f08080;letter-spacing:6px;font-weight:bold;border:2px solid #c04040;border-radius:6px;padding:8px 16px;display:inline-block;">'+mjCode+'</div>'
            +'<button class="camp-btn-sm" style="display:block;margin:6px auto 0;border-color:#c04040;color:#f08080;" onclick="navigator.clipboard.writeText(\''+mjCode+'\').then(()=>campToastFn(\'Code MJ copié !\',true))">Copier</button>'
            +'</div>';
        }
      })
      .catch(e=>toast('Erreur : '+e.message, false));
  };

  // ── MJ : Rejoindre campagne existante ──
  window.mjJoinCampagne = function() {
    const code = (document.getElementById('camp-mj-join-code').value||'').toUpperCase().trim();
    const mjCodeInput = (document.getElementById('camp-mj-join-mjcode').value||'').toUpperCase().trim();
    const status = document.getElementById('camp-mj-join-status');
    if (code.length !== 6) { toast('Code joueur invalide (6 lettres)', false); return; }
    if (mjCodeInput.length !== 6) { toast('Code MJ invalide (6 lettres)', false); return; }
    db.ref('campagnes/'+code).get().then(snap => {
      if (!snap.exists()) { status.textContent='Campagne introuvable.'; status.style.color='#c04040'; return; }
      const campData = snap.val();
      if (campData.mjCode !== mjCodeInput) {
        status.textContent = 'Code MJ incorrect.'; status.style.color = '#c04040'; return;
      }
      saveMjCode(code, campData.name, mjCodeInput);
      renderMjCampagnes();
      listenCampagne(code);
      status.textContent = '✓ Rejoint "'+campData.name+'" comme MJ';
      status.style.color = '#4aaa7a';
      document.getElementById('camp-mj-join-code').value = '';
      document.getElementById('camp-mj-join-mjcode').value = '';
    }).catch(e=>toast('Erreur : '+e.message, false));
  };

  function saveMjCode(code, name, mjCode) {
    const stored = JSON.parse(localStorage.getItem('mj_codes')||'{}');
    stored[code] = { name, mjCode: mjCode || stored[code]?.mjCode || '' };
    localStorage.setItem('mj_codes', JSON.stringify(stored));
    mjCodes = Object.entries(stored);
  }

  function getMjCodes() {
    const stored = JSON.parse(localStorage.getItem('mj_codes')||'{}');
    return Object.entries(stored).map(([code,v]) => [code, typeof v==='string' ? {name:v,mjCode:''} : v]);
  }

  // Ecouter joueurs
  function listenCampagne(code) {
    if (mjListeners[code]) return; // déjà en écoute
    mjListeners[code] = db.ref('campagnes/'+code+'/joueurs').on('value', () => {
      renderMjCampagnes();
    });
  }

  // ── Render accordéons MJ ──
  function renderMjCampagnes() {
    const container = document.getElementById('camp-mj-campagnes');
    if (!container) return;
    const codes = getMjCodes();
    if (!codes.length) { container.innerHTML = ''; return; }

    // On ne recree que les cartes manquantes (evite de perdre etat ouvert/ferme)
    codes.forEach(([code, info]) => {
      const name = typeof info === 'object' ? info.name : info;
      let acc = document.getElementById('camp-acc-'+code);
      if (!acc) {
        acc = document.createElement('div');
        acc.id = 'camp-acc-'+code;
        acc.className = 'camp-accordion open';
        container.appendChild(acc);
        listenCampagne(code);
      }
      db.ref('campagnes/'+code+'/joueurs').get().then(snap => {
        const joueurs = snap.val() ? Object.entries(snap.val()) : [];
        // Build header
        const hdr = document.createElement('div');
        hdr.className = 'camp-acc-hdr';
        hdr.onclick = () => toggleCampAcc(code);
        const nm2=document.createElement('span');nm2.className='camp-acc-name';nm2.textContent=name;hdr.appendChild(nm2);
        const cd2=document.createElement('span');cd2.className='camp-acc-code';cd2.textContent=code;hdr.appendChild(cd2);
        const ct2=document.createElement('span');ct2.className='camp-acc-count';ct2.textContent=joueurs.length+' joueur'+(joueurs.length!==1?'s':'');hdr.appendChild(ct2);
        const copyBtn = document.createElement('button');
        copyBtn.className = 'camp-btn-sm'; copyBtn.textContent = 'Copier code';
        copyBtn.onclick = (e) => { e.stopPropagation(); copyCampCodeVal(code); };
        const delBtn = document.createElement('button');
        delBtn.className = 'camp-btn-sm'; delBtn.style.cssText = 'color:#f08080;border-color:#5a2010;';
        delBtn.textContent = 'Supprimer';
        delBtn.onclick = (e) => { e.stopPropagation(); deleteCampagne(code); };
        const arrow = document.createElement('span');
        arrow.className = 'camp-acc-arrow'; arrow.textContent = '\u25bc';
        hdr.appendChild(copyBtn); hdr.appendChild(delBtn); hdr.appendChild(arrow);
        // Build body
        const body = document.createElement('div');
        body.className = 'camp-acc-body'; body.id = 'camp-body-'+code;
        if (joueurs.length === 0) {
          const empty = document.createElement('div');
          empty.style.cssText = 'color:var(--dim);font-size:12px;font-style:italic;padding:8px 0;';
          empty.textContent = 'Aucun joueur…';
          body.appendChild(empty);
        } else {
          joueurs.forEach(([key, j]) => {
            const card = document.createElement('div');
            card.className = 'camp-player-card';
            const nm = document.createElement('span'); nm.className='camp-player-name'; nm.textContent=j.nom||key;
            const tm = document.createElement('span'); tm.className='camp-player-time';
            tm.textContent = j.publishedAt ? '\u2713 Publi\u00e9 '+new Date(j.publishedAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : 'En attente\u2026';
            card.appendChild(nm); card.appendChild(tm);
            if (j.fiche) {
              const lb = document.createElement('button'); lb.className='camp-player-load'; lb.textContent='Charger';
              lb.onclick = () => loadPlayerFiche(code, key); card.appendChild(lb);
            }
            const rb = document.createElement('button'); rb.className='camp-player-load';
            rb.style.color='#f08080'; rb.textContent='\u2715';
            rb.onclick = () => removePlayer(code, key); card.appendChild(rb);
            body.appendChild(card);
          });
        }
        acc.innerHTML = '';
        acc.appendChild(hdr); acc.appendChild(body);
      });
    });
  }

  function showRestoreMjBtn() {
    let btn = document.getElementById('mj-restore-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'mj-restore-btn';
      btn.className = 'camp-btn-sm';
      btn.style.cssText = 'position:fixed;top:52px;right:12px;z-index:1000;border-color:var(--gold);color:var(--gold);background:var(--bg2);padding:5px 12px;';
      btn.textContent = '\u21a9 Restaurer mon perso';
      btn.onclick = restoreMjData;
      document.body.appendChild(btn);
    }
    btn.style.display = '';
  }

  window.restoreMjData = function() {
    const saved = localStorage.getItem('mj_own_data');
    if (!saved) { toast('Aucune sauvegarde MJ.', false); return; }
    data = JSON.parse(saved);
    persist();
    buildBag(); buildPoche(); buildSpe(); refresh(); loadChar(); renderFiche();
    applyStatLabels(); applyCharLabels(); applyCatLabels(); applyMagieSetting();
    applyParamShow(); applyStatSplits(); applyEffetsPlus(); applySlotLabels();
    applyFicheSectionLabels(); applyAllQualityColors(); buildBourseRows(); refreshArmorStats();
    if (data._exportTheme) {
      const root = document.documentElement;
      Object.entries(data._exportTheme).forEach(([k,v]) => { if(v) root.style.setProperty(k,v); });
      if (data._exportFont) root.style.setProperty('--font', data._exportFont);
    }
    const btn = document.getElementById('mj-restore-btn');
    if (btn) btn.style.display = 'none';
    toast('Votre personnage restauré !', true);
  };

  window.copyCampCodeVal = function(code) {
    navigator.clipboard?.writeText(code).then(()=>toast('Code "'+code+'" copié !', true));
  };

  window.deleteCampagne = function(code) {
    if (!confirm('Supprimer la campagne '+code+' et tous ses joueurs ?')) return;
    db.ref('campagnes/'+code).remove().then(()=>{
      const stored = JSON.parse(localStorage.getItem('mj_codes')||'{}');
      delete stored[code];
      localStorage.setItem('mj_codes', JSON.stringify(stored));
      const acc = document.getElementById('camp-acc-'+code);
      if (acc) acc.remove();
      toast('Campagne supprimée.', true);
    }).catch(e=>toast('Erreur : '+e.message, false));
  };

  window.removePlayer = function(code, key) {
    if (!confirm('Retirer ce joueur ?')) return;
    db.ref('campagnes/'+code+'/joueurs/'+key).remove()
      .then(()=>toast('Joueur retiré.', true))
      .catch(e=>toast('Erreur : '+e.message, false));
  };

  window.loadPlayerFiche = function(code, key) {
    db.ref('campagnes/'+code+'/joueurs/'+key+'/fiche').get().then(snap => {
      if (!snap.exists()) { toast('Aucune fiche publiée.', false); return; }
      // Save MJ own data before overwriting
      localStorage.setItem('mj_own_data', JSON.stringify(window.data || {}));
      showRestoreMjBtn();
      const ficheData = snap.val();
      data = typeof ficheData === 'string' ? JSON.parse(ficheData) : ficheData;
      persist();
      buildBag(); buildPoche(); buildSpe(); refresh(); loadChar(); renderFiche();
      applyStatLabels(); applyCharLabels(); applyCatLabels(); applyMagieSetting();
      applyParamShow(); applyStatSplits(); applyEffetsPlus(); applySlotLabels();
      applyFicheSectionLabels(); applyAllQualityColors(); buildBourseRows(); refreshArmorStats();
      applyTheme();
      showPage('fiche');
      toast('Fiche de '+(data._char?.nom||key)+' chargée !', true);
    }).catch(e=>toast('Erreur : '+e.message, false));
  };

  // ── Joueur : Rejoindre ──
  window.joinCampagne = function() {
    const code = (document.getElementById('camp-join-code').value||'').toUpperCase().trim();
    const playerName = (window.data?._char?.nom || 'Joueur').replace(/[^a-zA-Z0-9_\-]/g,'_');
    const displayName = window.data?._char?.nom || 'Joueur';
    const status = document.getElementById('camp-join-status');
    if (code.length !== 6) { toast('Code invalide (6 lettres)', false); return; }
    db.ref('campagnes/'+code).get().then(snap => {
      if (!snap.exists()) { status.textContent='Campagne introuvable.'; status.style.color='#c04040'; return; }
      const campName = snap.val().name || code;
      return db.ref('campagnes/'+code+'/joueurs/'+playerName).set({
        nom: displayName, joinedAt: Date.now()
      }).then(()=>{
        joueurCode = code; joueurKey = playerName;
        localStorage.setItem('joueur_camp_code', code);
        localStorage.setItem('joueur_camp_key', playerName);
        localStorage.setItem('joueur_camp_name', displayName);
        status.textContent = '✓ Connecté à "'+campName+'"';
        status.style.color = '#4aaa7a';
        const nameEl = document.getElementById('camp-joined-name');
        if (nameEl) nameEl.textContent = '"'+campName+'"';
        const sec = document.getElementById('camp-publish-section');
        if (sec) sec.style.display = '';
        toast('Rejoint "'+campName+'" !', true);
      });
    }).catch(e=>toast('Erreur : '+e.message, false));
  };

  // ── Joueur : Publier fiche ──
  window.publishFiche = function() {
    if (!joueurCode || !joueurKey) { toast('Rejoins une campagne.', false); return; }
    const displayName = localStorage.getItem('joueur_camp_name') || joueurKey;
    db.ref('campagnes/'+joueurCode+'/joueurs/'+joueurKey).set({
      nom: displayName,
      joinedAt: Date.now(),
      publishedAt: Date.now(),
      fiche: JSON.parse(JSON.stringify(window.data || {}))
    }).then(()=>{
      const status = document.getElementById('camp-publish-status');
      if (status) { status.textContent='✓ Publiée à '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); status.style.color='#4aaa7a'; }
      toast('Fiche publiée !', true);
    }).catch(e=>toast('Erreur : '+e.message, false));
  };

  // ── Joueur : Quitter ──
  window.leaveCampagne = function() {
    if (!joueurCode || !joueurKey) return;
    if (!confirm('Quitter la campagne ?')) return;
    db.ref('campagnes/'+joueurCode+'/joueurs/'+joueurKey).remove().catch(()=>{});
    joueurCode = null; joueurKey = null;
    ['joueur_camp_code','joueur_camp_key','joueur_camp_name'].forEach(k=>localStorage.removeItem(k));
    const status = document.getElementById('camp-join-status');
    if (status) { status.textContent=''; }
    const sec = document.getElementById('camp-publish-section');
    if (sec) sec.style.display = 'none';
    const codeInp = document.getElementById('camp-join-code');
    if (codeInp) codeInp.value = '';
    toast('Campagne quittée.', true);
  };

  // ── Restore sessions ──
  window.addEventListener('load', ()=>{
    // MJ
    getMjCodes().forEach(([code]) => listenCampagne(code));
    renderMjCampagnes();
    // Joueur
    const jc = localStorage.getItem('joueur_camp_code');
    const jk = localStorage.getItem('joueur_camp_key');
    const jn = localStorage.getItem('joueur_camp_name');
    if (jc && jk) {
      joueurCode = jc; joueurKey = jk;
      const codeInp = document.getElementById('camp-join-code');
      const status  = document.getElementById('camp-join-status');
      const sec     = document.getElementById('camp-publish-section');
      const nameEl  = document.getElementById('camp-joined-name');
      if (codeInp) codeInp.value = jc;
      if (status)  { status.textContent = '✓ Connecté ('+jn+')'; status.style.color='#4aaa7a'; }
      if (sec)     sec.style.display = '';
      if (nameEl)  nameEl.textContent = jn || '';
    }
  });

})();
