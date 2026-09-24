// ============================================================
// projects.js — Carica e filtra i post dalla sezione Progetti
// ============================================================

const SUPABASE_URL = "https://rylrgyqvabgtvcjwidqg.supabase.co";
const SUPABASE_KEY = "sb_publishable_ltI-p9eQ9K9zfUDwRnwAlg_aThQgZvP";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allProjects = [];
let activeFilters = new Set(); // empty = "all"
let conteggiCommenti = {};     // { id_progetto: numero di commenti }

// ---- Tab switching (multi-select) ----
function setupTabs() {
    const tabs = document.querySelectorAll('.projects-tabs');

    document.querySelector('.projects-tabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;

        const filter = tab.dataset.filter;

        if (filter === 'all') {
            // Click su "Tutti": deseleziona tutto
            activeFilters.clear();
            updateTabUI();
        } else {
            // Toggle this filter
            if (activeFilters.has(filter)) {
                activeFilters.delete(filter);
            } else {
                // Rimuovi "all" quando si seleziona qualcosa
                activeFilters.add(filter);
            }
            updateTabUI();
        }

        renderProjects();
    });
}

function updateTabUI() {
    const tabs = document.querySelectorAll('.projects-tabs .tab');
    tabs.forEach(tab => {
        const f = tab.dataset.filter;
        if (f === 'all') {
            tab.classList.toggle('active', activeFilters.size === 0);
        } else {
            tab.classList.toggle('active', activeFilters.has(f));
        }
    });
}

// ---- Load from Supabase ----
async function loadProjects() {
    const container = document.getElementById('projects-container');

    const { data, error } = await db
        .from('posts')
        .select('*')
        .eq('categoria', 'projects')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Errore nel recupero progetti:", error);
        if (container) container.innerHTML = `
            <section class="hero">
                <div class="container">
                    <p style="text-align: center; color: red;">Errore nel caricamento. Controlla la console.</p>
                </div>
            </section>`;
        return;
    }

    allProjects = data || [];
    // I conteggi devono essere pronti prima del primo disegno (come in blog.js)
    await caricaConteggiCommenti();

    if (allProjects.length === 0) {
        if (container) container.innerHTML = `
            <section class="hero">
                <div class="container">
                    <p style="text-align: center; padding: 40px 20px; color: #666;">
                        <i class="fas fa-rocket" style="font-size: 2rem; display: block; margin-bottom: 10px;"></i>
                        Nessun progetto ancora pubblicato.<br>
                        <small>Usa il pannello admin per aggiungere il primo!</small>
                    </p>
                </div>
            </section>`;
        return;
    }

    renderProjects();
}

// ---- Conteggio commenti per progetto (link "Commenti (N)") ----
async function caricaConteggiCommenti() {
    const { data, error } = await db
        .from('comments')
        .select('post_id');   // basta solo l'id: il conteggio lo facciamo qui
    if (error) {
        console.error("Errore nel conteggio commenti:", error);
        return;
    }
    conteggiCommenti = {};
    data.forEach(c => {
        conteggiCommenti[c.post_id] = (conteggiCommenti[c.post_id] || 0) + 1;
    });
}

// ---- Render filtered projects ----
function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const filtered = activeFilters.size === 0
        ? allProjects
        : allProjects.filter(p => {
            const subs = Array.isArray(p.sottocategoria)
                ? p.sottocategoria
                : (p.sottocategoria ? [p.sottocategoria] : []);
            return subs.some(s => activeFilters.has(s));
        });

    if (filtered.length === 0) {
        container.innerHTML = `
            <section class="hero">
                <div class="container">
                    <p style="text-align: center; padding: 40px 20px; color: #666;">
                        Nessun progetto con i filtri selezionati.
                    </p>
                </div>
            </section>`;
        return;
    }

    container.innerHTML = '';

    filtered.forEach(project => {
        // Normalizza sottocategoria: può essere array o stringa
        const subs = Array.isArray(project.sottocategoria)
            ? project.sottocategoria
            : (project.sottocategoria ? [project.sottocategoria] : []);
        // Badge in ordine alfabetico
        subs.sort((a, b) => a.localeCompare(b, 'it'));

        // Un badge per ogni sottocategoria
        const badges = subs.map(sub => {
            const subClass = sub.toLowerCase();
            return `<span class="project-badge ${subClass}">${sub}</span>`;
        }).join('');

        // Single image
        let tagImmagine = '';
        const ottimizzaUrl = (url) => {
            if (url && url.includes('cloudinary.com')) {
                return url.replace('/upload/', '/upload/f_auto,q_auto/');
            }
            return url;
        };

        if (project.immagine && project.immagine.trim() !== '') {
            tagImmagine = `<img src="${ottimizzaUrl(project.immagine)}" alt="Cover">`;
        }

        const dataOra = new Date(project.created_at).toLocaleDateString('en-US', {
            day: 'numeric', month: 'long', year: 'numeric'
        }) + ' — ' + new Date(project.created_at).toLocaleTimeString('it-IT', {
            hour: '2-digit', minute: '2-digit'
        });

        const postHTML = `
            <section class="hero">
                <div class="container">
                    ${badges}
                    <div class="heading">
                        <h1 class="title"><a class="post-title-link" href="post.html?id=${project.id}">${project.titolo}</a></h1>
                        <p class="date-time">${dataOra}</p>
                    </div>
                    <div class="content">
                        <div>
                            <p>${(project.contenuto || '').replace(/\n/g, '<br>')}</p>
                        </div>
                        ${tagImmagine}
                    </div>

                    <div class="comments-link-wrap">
                        <a class="post-comments-link" href="post.html?id=${project.id}">
                            <i class="fas fa-comment-dots"></i> Commenti (${conteggiCommenti[project.id] || 0})
                        </a>
                    </div>
                </div>
            </section>`;

        container.innerHTML += postHTML;
    });

    // I link del contenuto si aprono in una nuova scheda
    rendiLinkEsterni(container);
}

// ---- Init ----
setupTabs();
loadProjects();