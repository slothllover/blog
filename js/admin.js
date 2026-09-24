// ============================================================
// admin.js — Pannello Admin unificato per paolocimenti.com
// ============================================================

const SUPABASE_URL = "https://rylrgyqvabgtvcjwidqg.supabase.co";
const SUPABASE_KEY = "sb_publishable_ltI-p9eQ9K9zfUDwRnwAlg_aThQgZvP";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- Layout config ----
const LAYOUTS = {
    "single":           { count: 1, labels: ["Immagine di Copertina"] },
    "two-side":         { count: 2, labels: ["Immagine 1 (sinistra)", "Immagine 2 (destra)"] },
    "two-stack":        { count: 2, labels: ["Immagine 1 (sopra)", "Immagine 2 (sotto)"] },
    "three-big-left":   { count: 3, labels: ["Immagine grande (sinistra)", "Piccola 1 (alto destra)", "Piccola 2 (basso destra)"] },
    "three-big-right":  { count: 3, labels: ["Immagine grande (destra)", "Piccola 1 (alto sinistra)", "Piccola 2 (basso sinistra)"] },
    "three-big-top":    { count: 3, labels: ["Immagine grande (sopra)", "Piccola 1 (sotto sinistra)", "Piccola 2 (sotto destra)"] },
    "three-big-bottom": { count: 3, labels: ["Immagine grande (sotto)", "Piccola 1 (sopra sinistra)", "Piccola 2 (sopra destra)"] },
    "four-grid":        { count: 4, labels: ["Immagine 1 (alto sinistra)", "Immagine 2 (alto destra)", "Immagine 3 (basso sinistra)", "Immagine 4 (basso destra)"] }
};

// ---- Helpers ----

// Categorie disponibili per ogni tipo di post
const CATEGORY_SUBCATEGORIES = {
    blog: ['Eventi', 'Everyday', 'Musica', 'Scuola', 'Sport', 'Tech', 'Viaggi'],
    projects: ['AI', 'Elettronica', 'Informatica'],
    books: ['Classici', 'Fantascienza', 'Filosofia', 'Non-fiction', 'Politica', 'Romanzi', 'Scienza', 'Storia']
};

// Colori badge per ogni sottocategoria (usati anche nella home)
const SUBCATEGORY_COLORS = {
    // Blog
    'Sport':       { bg: '#ffe0cc', color: '#9a4d00' },
    'Viaggi':      { bg: '#cce5ff', color: '#004e9a' },
    'Everyday':    { bg: '#dcf2c9', color: '#3d7a1e' },
    'Tech':        { bg: '#e3e8ff', color: '#283593' },
    'Musica':      { bg: '#fce4ec', color: '#c62828' },
    'Eventi':      { bg: '#f3e5f5', color: '#7b1fa2' },
    'Scuola':      { bg: '#fff9c4', color: '#827717' },
    // Projects
    'Elettronica': { bg: '#f5dcc3', color: '#8a4b12' },
    'Informatica': { bg: '#d3f0f4', color: '#0f7d94' },
    'AI':          { bg: '#424242', color: '#ffffff' },
    // Libri
    'Classici':    { bg: '#fff3e0', color: '#8d6e63' },
    'Fantascienza': { bg: '#e7d9f8', color: '#6a2c91' },
    'Filosofia':   { bg: '#e0e8f5', color: '#35507a' },
    'Non-fiction': { bg: '#eceff1', color: '#546e7a' },
    'Politica':    { bg: '#e9edc8', color: '#5f6f1f' },
    'Romanzi':     { bg: '#ffdce5', color: '#ad1457' },
    'Scienza':     { bg: '#c9efe8', color: '#0f7a67' },
    'Storia':      { bg: '#f0e6d8', color: '#6d4c41' }
};

function getSubcategories() {
    const boxes = document.querySelectorAll('input[name="subcat"]:checked');
    return Array.from(boxes).map(cb => cb.value);
}

function setSubcategories(values) {
    const arr = Array.isArray(values) ? values : (values ? [values] : []);
    document.querySelectorAll('input[name="subcat"]').forEach(cb => {
        cb.checked = arr.includes(cb.value);
    });
}

function renderSubcategoryCheckboxes(category) {
    const container = document.getElementById('subcategory-checkboxes');
    if (!container) return;
    const subs = CATEGORY_SUBCATEGORIES[category] || [];
    if (subs.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = subs.map(sub =>
        `<label class="checkbox-label">
            <input type="checkbox" name="subcat" value="${sub}"> ${sub}
        </label>`
    ).join('');
}

// ============================================================
// 1. AUTH
// ============================================================

async function checkSession() {
    const { data: { session } } = await db.auth.getSession();
    const loginBox = document.getElementById('login-box');
    const adminPanel = document.getElementById('admin-panel');
    if (session) {
        if (loginBox) loginBox.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
    } else {
        if (loginBox) loginBox.style.display = 'block';
        if (adminPanel) adminPanel.style.display = 'none';
    }
    return !!session;
}

checkSession();

document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Accesso negato: " + error.message);
    } else {
        await checkSession();
        loadPostList();
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    await db.auth.signOut();
    await checkSession();
});

// ============================================================
// 2. TAB SWITCHING
// ============================================================

document.querySelectorAll('.admin-tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab[data-tab]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.admin-tab-content').forEach(tc => tc.classList.remove('active'));
        document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        if (tab.dataset.tab === 'manage-posts') loadPostList();
        if (tab.dataset.tab === 'manage-comments') loadCommentiAdmin();
    });
});

// ============================================================
// 3. SUBCATEGORY VISIBILITY
// ============================================================

const categorySelect = document.getElementById('category');
const subcategoryGroup = document.getElementById('subcategory-group');

function aggiornaSubcategorie() {
    const cat = categorySelect.value;
    const subsExist = (CATEGORY_SUBCATEGORIES[cat] || []).length > 0;
    if (subsExist) {
        subcategoryGroup.style.display = 'block';
        renderSubcategoryCheckboxes(cat);
    } else {
        subcategoryGroup.style.display = 'none';
    }
}

categorySelect.addEventListener('change', aggiornaSubcategorie);
// Inizializzazione: senza questa riga, la destinazione di default "Home Page (Blog)"
// parte senza sottocategorie finché non cambi destinazione (bug che hai trovato tu).
aggiornaSubcategorie();

// ============================================================
// 4. IMAGE SLOTS
// ============================================================

function aggiornaSlotImmagini() {
    const select = document.getElementById('layout');
    const container = document.getElementById('image-slots');
    if (!select || !container) return;
    const cfg = LAYOUTS[select.value] || LAYOUTS["single"];
    let html = '';
    for (let i = 0; i < cfg.count; i++) {
        html += `<div class="admin-form-group">
            <label for="image-${i}">${cfg.labels[i]}</label>
            <input type="file" id="image-${i}" accept="image/*">
        </div>`;
    }
    container.innerHTML = html;
}

document.getElementById('layout').addEventListener('change', aggiornaSlotImmagini);
aggiornaSlotImmagini();

// ============================================================
// 5. CLOUDINARY UPLOAD
// ============================================================

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'blog-uploads');
    const resp = await fetch('https://api.cloudinary.com/v1_1/dx1hcvhht/image/upload', {
        method: 'POST', body: formData
    });
    const data = await resp.json();
    if (data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || 'Errore Cloudinary');
}

// ============================================================
// 6. SUBMIT (create OR update)
// ============================================================

const submitBtn = document.getElementById('submit-btn');
const formStatus = document.getElementById('form-status');

submitBtn.addEventListener('click', async () => {
    const editId = document.getElementById('edit-id').value;
    const titleInput = document.getElementById('title').value.trim();
    const contentInput = document.getElementById('content').innerHTML.trim();
    const categoryInput = document.getElementById('category').value;
    const subcategoriesArray = getSubcategories();
    const layoutInput = document.getElementById('layout').value;
    const cfg = LAYOUTS[layoutInput] || LAYOUTS["single"];

    if (!titleInput || !contentInput) {
        formStatus.innerHTML = '<span style="color:red;">Inserisci almeno titolo e contenuto.</span>';
        return;
    }

    let immagineFinale = "";
    let galleriaFinale = null;

    const files = [];
    for (let i = 0; i < cfg.count; i++) {
        const el = document.getElementById('image-' + i);
        files.push(el && el.files[0] ? el.files[0] : null);
    }

    try {
        if (layoutInput === "single") {
            if (files[0]) {
                submitBtn.disabled = true;
                submitBtn.innerText = "Caricamento immagine…";
                immagineFinale = await uploadToCloudinary(files[0]);
            }
        } else {
            const hasFiles = files.some(f => f !== null);
            if (hasFiles) {
                for (let i = 0; i < cfg.count; i++) {
                    if (!files[i]) {
                        alert(`Carica l'immagine per: "${cfg.labels[i]}".`);
                        return;
                    }
                }
                submitBtn.disabled = true;
                submitBtn.innerText = "Caricamento galleria…";
                const urls = [];
                for (let i = 0; i < cfg.count; i++) {
                    urls.push(await uploadToCloudinary(files[i]));
                }
                galleriaFinale = { layout: layoutInput, images: urls };
            }
        }
    } catch (err) {
        console.error(err);
        alert("Errore upload: " + err.message);
        submitBtn.disabled = false;
        submitBtn.innerText = "Pubblica";
        return;
    }

    submitBtn.innerText = "Salvataggio…";

    const record = {
        titolo: titleInput,
        contenuto: contentInput,
        categoria: categoryInput,
    };
    if (immagineFinale) record.immagine = immagineFinale;
    if (galleriaFinale) record.galleria = galleriaFinale;
    if (CATEGORY_SUBCATEGORIES[categoryInput]?.length) {
        record.sottocategoria = subcategoriesArray;
    }

    let error;
    if (editId) {
        const { error: err } = await db.from('posts').update(record).eq('id', editId);
        error = err;
    } else {
        const { error: err } = await db.from('posts').insert([record]);
        error = err;
    }

    submitBtn.disabled = false;
    submitBtn.innerText = "Pubblica";

    if (error) {
        console.error("Errore Supabase:", error);
        formStatus.innerHTML = '<span style="color:red;">Errore: ' + error.message + '</span>';
    } else {
        formStatus.innerHTML = '<span style="color:green;">✅ ' + (editId ? 'Post aggiornato!' : 'Post pubblicato!') + '</span>';
        clearForm();
        setTimeout(() => { formStatus.innerHTML = ''; }, 3000);
    }
});

// ============================================================
// 7. CLEAR FORM / CANCEL EDIT
// ============================================================

function clearForm() {
    document.getElementById('edit-id').value = '';
    document.getElementById('title').value = '';
    document.getElementById('content').innerHTML = '';
    document.getElementById('category').value = 'blog';
    setSubcategories([]);
    document.getElementById('layout').value = 'single';
    renderSubcategoryCheckboxes('blog');
    subcategoryGroup.style.display = 'block';
    aggiornaSlotImmagini();
    document.getElementById('form-mode-title').innerText = 'Nuovo articolo';
    document.getElementById('form-mode-hint').innerText = 'Compila il form qui sotto per pubblicare un post. Scegli la destinazione in base al tipo di contenuto.';
    document.getElementById('clear-form-btn').style.display = 'none';
    formStatus.innerHTML = '';
}

document.getElementById('clear-form-btn').addEventListener('click', clearForm);

// ============================================================
// 8. LOAD POST LIST (con filtro per categoria)
// ============================================================

let adminFilter = 'all'; // 'all' | 'blog' | 'books' | 'projects'

function setupAdminPostFilters() {
    const tabsContainer = document.querySelector('.admin-filter-tabs');
    if (!tabsContainer) return;

    tabsContainer.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        adminFilter = tab.dataset.adminFilter || 'all';
        document.querySelectorAll('.admin-filter-tabs .tab').forEach(t => {
            t.classList.toggle('active', t === tab);
        });
        loadPostList();
    });
}

async function loadPostList() {
    const container = document.getElementById('post-list');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center; color:#999; padding:30px;">Caricamento…</p>';

    const { data, error } = await db.from('posts').select('*').order('created_at', { ascending: false });

    if (error) { container.innerHTML = `<p style="color:red;">Errore: ${error.message}</p>`; return; }
    if (!data || data.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#666; padding:30px;">Nessun post trovato.</p>`;
        return;
    }

    // Filtro per categoria attiva (tab Tutti / Blog / Libri / Progetti)
    let posts = data;
    if (adminFilter !== 'all') {
        posts = data.filter(p => (p.categoria || 'blog') === adminFilter);
    }
    if (posts.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#666; padding:30px;">Nessun post in questa categoria.</p>`;
        return;
    }

    const catLabels = { blog: 'Blog', books: 'Libri', projects: 'Progetti' };

    let html = `<table class="admin-post-list">
        <thead><tr><th>Titolo</th><th>Categoria</th><th>Data</th><th style="width:120px;">Azioni</th></tr></thead><tbody>`;

    posts.forEach(post => {
        const cat = post.categoria || 'blog';
        const subs = Array.isArray(post.sottocategoria) ? post.sottocategoria : (post.sottocategoria ? [post.sottocategoria] : []);
        const date = new Date(post.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
        const title = post.titolo || '(senza titolo)';
        const subBadges = subs.map(s => `<span class="admin-sub-badge ${s}">${s}</span>`).join('');

        html += `<tr>
            <td class="post-title-cell" title="${title.replace(/"/g,'&quot;')}">${title}</td>
            <td>
                <span class="admin-cat-badge ${cat}">${catLabels[cat] || cat}</span>${subBadges}
            </td>
            <td>${date}</td>
            <td>
                <button class="admin-btn admin-btn-small admin-btn-primary" onclick="editPost(${post.id})" title="Modifica">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="admin-btn admin-btn-small admin-btn-danger" onclick="deletePost(${post.id})" title="Elimina">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>`;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

document.getElementById('refresh-posts-btn').addEventListener('click', loadPostList);
setupAdminPostFilters();

// ============================================================
// 9. EDIT POST
// ============================================================

async function editPost(id) {
    const { data, error } = await db.from('posts').select('*').eq('id', id).single();
    if (error) { alert("Errore: " + error.message); return; }

    document.querySelectorAll('.admin-tab[data-tab]').forEach(t => t.classList.remove('active'));
    document.querySelector('.admin-tab[data-tab="new-post"]').classList.add('active');
    document.querySelectorAll('.admin-tab-content').forEach(tc => tc.classList.remove('active'));
    document.getElementById('tab-new-post').classList.add('active');

    document.getElementById('edit-id').value = data.id;
    document.getElementById('title').value = data.titolo || '';
    document.getElementById('content').innerHTML = data.contenuto || '';
    document.getElementById('category').value = data.categoria || 'blog';

    if ((CATEGORY_SUBCATEGORIES[data.categoria] || []).length > 0) {
        renderSubcategoryCheckboxes(data.categoria);
        subcategoryGroup.style.display = 'block';
        setSubcategories(data.sottocategoria);
    } else {
        subcategoryGroup.style.display = 'none';
    }

    document.getElementById('layout').value = (data.galleria && data.galleria.layout) ? data.galleria.layout : 'single';
    aggiornaSlotImmagini();

    document.getElementById('form-mode-title').innerText = 'Modifica post';
    document.getElementById('form-mode-hint').innerText = 'Stai modificando un post esistente. Le immagini vanno ricaricate solo se vuoi cambiarle.';
    document.getElementById('clear-form-btn').style.display = 'inline-block';
    formStatus.innerHTML = '';
    document.getElementById('tab-new-post').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// 10. DELETE POST
// ============================================================

async function deletePost(id) {
    if (!confirm("Sei sicuro di voler eliminare questo post? L'operazione è irreversibile.")) return;
    const { error } = await db.from('posts').delete().eq('id', id);
    if (error) {
        alert("Errore: " + error.message);
    } else {
        loadPostList();
    }
}

// ============================================================
// INIT
// ============================================================
(async () => {
    const logged = await checkSession();
    if (logged) loadPostList();
})();

   // ============================================================
   // 11. TAB COMMENTI — elenco, azioni, nomi registrati
   // ============================================================

   // Escaping: i commenti sono scritti da utenti, niente innerHTML "nudo"
   function escHtml(s) {
       return String(s ?? '')
           .replace(/&/g, '&amp;')
           .replace(/</g, '&lt;')
           .replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;')
           .replace(/'/g, '&#39;');
   }

   async function loadCommentiAdmin() {
       const nContainer = document.getElementById('commentator-list');
       const cContainer = document.getElementById('admin-comments-list');
       if (!nContainer || !cContainer) return;

       // ---- 1) NOMI REGISTRATI ----
       nContainer.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Caricamento…</p>';
       const { data: nomi, error: errNomi } = await db
           .from('commentators')
           .select('*')
           .order('created_at', { ascending: false });

       if (errNomi) {
           nContainer.innerHTML = `<p style="color:red;">Errore: ${escHtml(errNomi.message)}</p>`;
       } else if (!nomi || nomi.length === 0) {
           nContainer.innerHTML = '<p style="text-align:center; color:#666;">Nessun nome registrato.</p>';
       } else {
           let html = `<table class="admin-post-list">
               <thead><tr><th>Nome</th><th>Registrato il</th><th style="width:330px;">Azioni</th></tr></thead><tbody>`;

           nomi.forEach(n => {
               const dataReg = new Date(n.created_at).toLocaleDateString('it-IT',
                   { day: '2-digit', month: 'short', year: 'numeric' });
               // Il nome dentro onclick va "fuggito" per il JavaScript:
               // un apostrofo lo romperebbe. escHtml NON va usato qui dentro
               // (l'HTML decodifica le entità due volte: prima il browser, poi JS)
               const nomeJs = n.name.replace(/'/g, "\\'");

               html += `<tr>
                   <td>${escHtml(n.name)}</td>
                   <td>${dataReg}</td>
                   <td>
                       <button class="admin-btn admin-btn-small admin-btn-primary" onclick="resetNome('${nomeJs}')" title="Cambia password">
                           <i class="fas fa-key"></i> Reset pw
                       </button>
                       <button class="admin-btn admin-btn-small" style="background:#eee; color:#333;" onclick="eliminaNome('${nomeJs}', 'anonimizza')" title="Commenti → Anonimo, poi cancella
 il nome">
                           <i class="fas fa-user-slash"></i> Anonimizza
                       </button>
                       <button class="admin-btn admin-btn-small admin-btn-danger" onclick="eliminaNome('${nomeJs}', 'cancella')" title="Cancella nome e TUTTI i suoi commenti">
                           <i class="fas fa-trash"></i> Cancella tutto
                       </button>
                   </td>
               </tr>`;
           });

           html += '</tbody></table>';
           nContainer.innerHTML = html;
       }

       // ---- 2) COMMENTI ----
       cContainer.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Caricamento…</p>';

       // Mappa "id post → titolo": pattern utillissimo per unire dati con una sola query
       const { data: posts } = await db.from('posts').select('id, titolo');
       const mappaPost = {};
       (posts || []).forEach(p => { mappaPost[p.id] = p.titolo || '(senza titolo)'; });

       const { data: commenti, error: errCommenti } = await db
           .from('comments')
           .select('*')
           .order('created_at', { ascending: false });   // più recenti in alto

       if (errCommenti) {
           cContainer.innerHTML = `<p style="color:red;">Errore: ${escHtml(errCommenti.message)}</p>`;
           return;
       }
       if (!commenti || commenti.length === 0) {
           cContainer.innerHTML = '<p style="text-align:center; color:#666;">Nessun commento presente.</p>';
           return;
       }

       let html = `<table class="admin-post-list">
           <thead><tr><th>Post</th><th>Autore</th><th>Data</th><th>Commento</th><th style="width:110px;">Azioni</th></tr></thead><tbody>`;

       commenti.forEach(c => {
           const dataC = new Date(c.created_at).toLocaleString('it-IT',
               { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
           const breve = c.comment_text.length > 160
               ? c.comment_text.slice(0, 160) + '…'
               : c.comment_text;

           html += `<tr>
               <td>${escHtml(mappaPost[c.post_id] || '(post cancellato)')}</td>
               <td><strong>${escHtml(c.author_name)}</strong></td>
               <td>${dataC}</td>
               <td>${escHtml(breve)}</td>
               <td>
                   <button class="admin-btn admin-btn-small admin-btn-danger" onclick="eliminaCommento(${c.id})" title="Elimina commento">
                       <i class="fas fa-trash"></i>
                   </button>
               </td>
           </tr>`;
       });

       html += '</tbody></table>';
       cContainer.innerHTML = html;
   }

   document.getElementById('refresh-comments-btn').addEventListener('click', loadCommentiAdmin);

   // ---- Azioni ----
   async function eliminaCommento(id) {
       if (!confirm("Eliminare definitivamente questo commento?")) return;
       const { error } = await db.from('comments').delete().eq('id', id);
       if (error) {
           alert("Errore: " + error.message);
       } else {
           alert("Commento eliminato.");
           loadCommentiAdmin();
       }
   }

   async function eliminaNome(nome, modalita) {
       const msg = modalita === 'cancella'
           ? `Cancellare il nome "${nome}" e TUTTI i suoi commenti?`
           : `Anonimizzare i commenti di "${nome}" e poi cancellare il nome?`;
       if (!confirm(msg)) return;

       // le due funzioni RPC del database: qui si vede tutto il lavoro di fase 1
       const { data, error } = await db.rpc('delete_commentator', {
           p_name: nome,
           p_mode: modalita
       });
       if (error) alert("Errore: " + error.message);
       else if (!data.ok) alert("Rifiutato: " + data.error);
       else { alert("Fatto!"); loadCommentiAdmin(); }
   }

   async function resetNome(nome) {
       const nuova = prompt(`Nuova password per il nome "${nome}" (minimo 4 caratteri):`);
       if (nuova === null) return;                      // ha premuto Annulla
       const { data, error } = await db.rpc('reset_name_password', {
           p_name: nome,
           p_new_password: nuova
       });
       if (error) alert("Errore: " + error.message);
       else if (!data.ok) alert("Rifiutato: " + data.error);
       else alert(`Password aggiornata per "${nome}". Da ora per usarlo servirà la nuova.`);
   }
