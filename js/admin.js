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
    blog: ['Sport', 'Viaggi', 'Everyday', 'Tech', 'Musica', 'Eventi', 'Scuola'],
    projects: ['Elettronica', 'Informatica', 'AI'],
    books: []
};

// Colori badge per ogni sottocategoria (usati anche nella home)
const SUBCATEGORY_COLORS = {
    // Blog
    'Sport':       { bg: '#ffe0cc', color: '#9a4d00' },
    'Viaggi':      { bg: '#cce5ff', color: '#004e9a' },
    'Everyday':    { bg: '#e8f5e9', color: '#2e7d32' },
    'Tech':        { bg: '#e3f2fd', color: '#1565c0' },
    'Musica':      { bg: '#fce4ec', color: '#c62828' },
    'Eventi':      { bg: '#f3e5f5', color: '#7b1fa2' },
    'Scuola':      { bg: '#fff9c4', color: '#827717' },
    // Projects
    'Elettronica': { bg: '#fff0cc', color: '#9a6e00' },
    'Informatica': { bg: '#cce5ff', color: '#004e9a' },
    'AI':          { bg: '#e8ccff', color: '#5c009a' }
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
    });
});

// ============================================================
// 3. SUBCATEGORY VISIBILITY
// ============================================================

const categorySelect = document.getElementById('category');
const subcategoryGroup = document.getElementById('subcategory-group');

categorySelect.addEventListener('change', () => {
    const cat = categorySelect.value;
    const subsExist = (CATEGORY_SUBCATEGORIES[cat] || []).length > 0;
    if (subsExist) {
        subcategoryGroup.style.display = 'block';
        renderSubcategoryCheckboxes(cat);
    } else {
        subcategoryGroup.style.display = 'none';
    }
});

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
    if (categoryInput === 'projects' || categoryInput === 'blog') record.sottocategoria = subcategoriesArray;

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
// 8. LOAD POST LIST
// ============================================================

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

    const catLabels = { blog: 'Blog', books: 'Libri', projects: 'Progetti' };

    let html = `<table class="admin-post-list">
        <thead><tr><th>Titolo</th><th>Categoria</th><th>Data</th><th style="width:120px;">Azioni</th></tr></thead><tbody>`;

    data.forEach(post => {
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

    if (data.categoria === 'projects' || data.categoria === 'blog') {
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