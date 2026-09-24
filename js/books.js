// ============================================================
// books.js — Carica, filtra e mostra le recensioni dei libri
// ============================================================

const SUPABASE_URL = "https://rylrgyqvabgtvcjwidqg.supabase.co";
const SUPABASE_KEY = "sb_publishable_ltI-p9eQ9K9zfUDwRnwAlg_aThQgZvP";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allBooks = [];
let activeFilters = new Set(); // empty = "all"

// ---- Tab per categoria (stesso pattern di blog.js/projects.js) ----
function setupBooksTabs() {
    const tabsContainer = document.querySelector('.books-tabs');
    if (!tabsContainer) return;

    tabsContainer.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;

        const filter = tab.dataset.filter;

        if (filter === 'all') {
            activeFilters.clear();
        } else {
            if (activeFilters.has(filter)) {
                activeFilters.delete(filter);
            } else {
                activeFilters.add(filter);
            }
        }

        updateBooksTabUI();
        renderBooks();
    });
}

function updateBooksTabUI() {
    document.querySelectorAll('.books-tabs .tab').forEach(tab => {
        const f = tab.dataset.filter;
        if (f === 'all') {
            tab.classList.toggle('active', activeFilters.size === 0);
        } else {
            tab.classList.toggle('active', activeFilters.has(f));
        }
    });
}

// ---- Caricamento da Supabase ----
async function caricaLibri() {
    const container = document.getElementById('books-container');

    const { data: posts, error } = await db
        .from('posts')
        .select('*')
        .eq('categoria', 'books') // <--- FILTRO FONDAMENTALE!
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Errore nel recupero dei libri:", error);
        if (container) {
            container.innerHTML = `
                <section class="bookreview">
                    <div class="container">
                        <p style="text-align: center; color: red;">Errore nel caricamento delle recensioni.</p>
                    </div>
                </section>
            `;
        }
        return;
    }

    allBooks = posts || [];

    if (allBooks.length === 0) {
        if (container) {
            container.innerHTML = `
                <section class="bookreview">
                    <div class="container">
                        <p style="text-align: center;">Non ci sono ancora recensioni di libri. Usa il pannello admin per scriverne una!</p>
                    </div>
                </section>
            `;
        }
        return;
    }

    renderBooks();
}

// ---- Render (filtrato, badge in ordine alfabetico) ----
function renderBooks() {
    const container = document.getElementById('books-container');
    if (!container) return;

    const filtered = activeFilters.size === 0
        ? allBooks
        : allBooks.filter(p => {
            const subs = Array.isArray(p.sottocategoria)
                ? p.sottocategoria
                : (p.sottocategoria ? [p.sottocategoria] : []);
            return subs.some(s => activeFilters.has(s));
        });

    if (filtered.length === 0) {
        if (container) {
            container.innerHTML = `
                <section class="bookreview">
                    <div class="container">
                        <p style="text-align: center; color: #666;">Nessuna recensione con le categorie selezionate.</p>
                    </div>
                </section>
            `;
        }
        return;
    }

    if (container) container.innerHTML = "";

    filtered.forEach(post => {
        // Sottocategorie normalizzate, copia + ordinamento alfabetico
        const subs = (Array.isArray(post.sottocategoria)
            ? post.sottocategoria
            : (post.sottocategoria ? [post.sottocategoria] : [])).slice();
        subs.sort((a, b) => a.localeCompare(b, 'it'));

        const badges = subs.map(sub =>
            `<span class="project-badge ${sub.toLowerCase()}">${sub}</span>`).join('');

        let tagImmagine = "";
        if (post.immagine && post.immagine.trim() !== "") {
            let urlImmagine = post.immagine;
            if (urlImmagine.includes("cloudinary.com")) {
                urlImmagine = urlImmagine.replace("/upload/", "/upload/f_auto,q_auto/");
            }
            tagImmagine = `<img src="${urlImmagine}" alt="Copertina Libro">`;
        }

        const dataFormattata = new Date(post.created_at).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const oraFormattata = new Date(post.created_at).toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const postHTML = `
            <section class="bookreview">
                <div class="container">
                    ${badges}
                    <div class="heading">
                        <h1 class="title">${post.titolo}</h1>
                        <p class="date-time">${dataFormattata} - ${oraFormattata}</p>
                    </div>

                    <div class="content">
                        ${tagImmagine}
                        <div>
                            <p>${post.contenuto.replace(/\n/g, '<br>')}</p>
                        </div>
                    </div>
                </div>
            </section>
        `;

        if (container) {
            container.innerHTML += postHTML;
        }
    });

    // I link del contenuto si aprono in una nuova scheda
    rendiLinkEsterni(container);
}

// ---- Avvio ----
setupBooksTabs();
caricaLibri();