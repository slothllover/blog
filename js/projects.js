// ============================================================
// projects.js — Carica e filtra i post dalla sezione Progetti
// ============================================================

const SUPABASE_URL = "https://rylrgyqvabgtvcjwidqg.supabase.co";
const SUPABASE_KEY = "sb_publishable_ltI-p9eQ9K9zfUDwRnwAlg_aThQgZvP";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allProjects = [];
let currentFilter = 'all';

// ---- Tab switching ----
function setupTabs() {
    const tabs = document.querySelectorAll('.projects-tabs .tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderProjects();
        });
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

// ---- Render filtered projects ----
function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const filtered = currentFilter === 'all'
        ? allProjects
        : allProjects.filter(p => p.sottocategoria === currentFilter);

    if (filtered.length === 0) {
        container.innerHTML = `
            <section class="hero">
                <div class="container">
                    <p style="text-align: center; padding: 40px 20px; color: #666;">
                        Nessun progetto in questa categoria.
                    </p>
                </div>
            </section>`;
        return;
    }

    container.innerHTML = '';

    filtered.forEach(project => {
        const sub = project.sottocategoria || '';
        const subClass = sub.toLowerCase();

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
                    ${sub ? `<span class="project-badge ${subClass}">${sub}</span>` : ''}
                    <div class="heading">
                        <h1 class="title">${project.titolo}</h1>
                        <p class="date-time">${dataOra}</p>
                    </div>
                    <div class="content">
                        <div>
                            <p>${(project.contenuto || '').replace(/\n/g, '<br>')}</p>
                        </div>
                        ${tagImmagine}
                    </div>
                </div>
            </section>`;

        container.innerHTML += postHTML;
    });
}

// ---- Init ----
setupTabs();
loadProjects();