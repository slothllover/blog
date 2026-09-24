// 1. Configurazione e Connessione a Supabase
const SUPABASE_URL = "https://rylrgyqvabgtvcjwidqg.supabase.co";
const SUPABASE_KEY = "sb_publishable_ltI-p9eQ9K9zfUDwRnwAlg_aThQgZvP"; 
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let allPosts = [];
let activeFilters = new Set(); // empty = "all"
let leggiCommenti = {};

// ---- Tab switching (multi-select) ----
function setupBlogTabs() {
    const tabsContainer = document.querySelector('.blog-tabs');
    if (!tabsContainer) return;

    tabsContainer.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;

        const filter = tab.dataset.filter;

        if (filter === 'all') {
            activeFilters.clear();
            updateBlogTabUI();
        } else {
            if (activeFilters.has(filter)) {
                activeFilters.delete(filter);
            } else {
                activeFilters.add(filter);
            }
            updateBlogTabUI();
        }

        renderPosts();
    });
}

function updateBlogTabUI() {
    const tabs = document.querySelectorAll('.blog-tabs .tab');
    tabs.forEach(tab => {
        const f = tab.dataset.filter;
        if (f === 'all') {
            tab.classList.toggle('active', activeFilters.size === 0);
        } else {
            tab.classList.toggle('active', activeFilters.has(f));
        }
    });
}

// 2. Funzione principale per recuperare e mostrare i post
async function caricaPost() {
    const container = document.getElementById('blog-container');

    // Chiediamo a Supabase i dati della tabella 'posts' ordinati dal più recente
    const { data: posts, error } = await db
        .from('posts')
        .select('*')
        .eq('categoria', 'blog')
        .order('created_at', { ascending: false });

    // Gestione degli errori di connessione o di lettura
    if (error) {
        console.error("Errore nel recupero dei post:", error);
        container.innerHTML = `
            <section class="hero">
                <div class="container">
                    <p style="text-align: center; color: red;">Errore nel caricamento degli articoli. Controlla la console.</p>
                </div>
            </section>
        `;
        return;
    }

    // Se il database è vuoto (non ci sono ancora post)
    if (posts.length === 0) {
        container.innerHTML = `
            <section class="hero">
                <div class="container">
                    <p style="text-align: center;">Non ci sono ancora articoli in questo blog. Usa il pannello admin per scriverne uno!</p>
                </div>
            </section>
        `;
        return;
    }

    allPosts = posts;
    await caricaConteggiCommenti();
    renderPosts();
}

// ---- Conteggio commenti per post (per il link "Commenti (N)") ----
async function caricaConteggiCommenti() {
    // Scarichiamo SOLO la colonna post_id: il conteggio lo facciamo nel browser,
    // con una sola query per tutta la pagina (anche la policy RLS consente la lettura)
    const { data, error } = await db
        .from('comments')
        .select('post_id');

    if (error) {
        console.error("Errore nel conteggio commenti:", error);
        return;
    }

    conteggiCommenti = {};
    data.forEach(c => {
        // Trick comodo: se la chiave non esiste è undefined → "|| 0" la porta a 0
        conteggiCommenti[c.post_id] = (conteggiCommenti[c.post_id] || 0) + 1;
    });
}

// ---- Render filtered posts ----
function renderPosts() {
    const container = document.getElementById('blog-container');
    if (!container) return;

    const filtered = activeFilters.size === 0
        ? allPosts
        : allPosts.filter(p => {
            const subs = Array.isArray(p.sottocategoria)
                ? p.sottocategoria
                : (p.sottocategoria ? [p.sottocategoria] : []);
            return subs.some(s => activeFilters.has(s));
        });

    if (filtered.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; padding: 40px 20px; color: #666;">
                Nessun articolo con i filtri selezionati.
            </p>`;
        return;
    }

    container.innerHTML = '';

    // 3. Cicliamo tutti i post filtrati e generiamo l'HTML
    filtered.forEach(post => {
        // Normalizza sottocategoria
        const subs = Array.isArray(post.sottocategoria)
            ? post.sottocategoria
            : (post.sottocategoria ? [post.sottocategoria] : []);
        // Badge in ordine alfabetico (anche per i post scritti prima delle nuove liste)
        subs.sort((a, b) => a.localeCompare(b, 'it'));

        // Badge per ogni sottocategoria
        const badges = subs.map(sub => {
            const subClass = sub.toLowerCase();
            return `<span class="project-badge ${subClass}">${sub}</span>`;
        }).join('');

        // Ottimizzazione Cloudinary al volo (lascia invariati i link non-Cloudinary)
        const ottimizzaUrl = (url) => {
            if (url && url.includes("cloudinary.com")) {
                return url.replace("/upload/", "/upload/f_auto,q_auto/");
            }
            return url;
        };

        // Blocco immagini: galleria multi-immagine oppure singola immagine
        let tagImmagine = "";

        // 1) Galleria multi-immagine (colonna 'galleria')
        if (post.galleria && Array.isArray(post.galleria.images) && post.galleria.images.length >= 2) {
            const layout = post.galleria.layout || "four-grid";
            const aree = ["a", "b", "c", "d"];
            const imgTags = post.galleria.images
                .slice(0, 4)
                .map((url, i) => `<img src="${ottimizzaUrl(url)}" alt="Immagine ${i + 1}" style="grid-area: ${aree[i]};">`)
                .join("");
            tagImmagine = `<div class="gallery gallery-${layout}">${imgTags}</div>`;
        }
        // 2) Fallback: singola immagine (post esistenti)
        else if (post.immagine && post.immagine.trim() !== "") {
            tagImmagine = `<img src="${ottimizzaUrl(post.immagine)}" alt="Copertina">`;
        }

        // Formattiamo la data
        const dataFormattata = new Date(post.created_at).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const oraFormattata = new Date(post.created_at).toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Rome'
        });

        const dataEOraCompleta = `${dataFormattata} - ${oraFormattata}`;

        // Generiamo la struttura HTML
        const postHTML = `
               <section class="hero">
                   <div class="container">
                       ${badges}
                       <div class="heading">
                           <h1 class="title"><a class="post-title-link" href="post.html?id=${post.id}">${post.titolo}</a></h1>
                           <p class="date-time">${dataEOraCompleta}</p>
                       </div>

                       <div class="content">
                           <div>
                               <p>${post.contenuto.replace(/\n/g, '<br>')}</p>
                           </div>
                           ${tagImmagine}
                       </div>

                       <div class="comments-link-wrap">
                           <a class="post-comments-link" href="post.html?id=${post.id}">
                               <i class="fas fa-comment-dots"></i> Commenti (${conteggiCommenti[post.id] || 0})
                           </a>
                       </div>
                   </div>
               </section>
        `;

        container.innerHTML += postHTML;
    });

    // I link dentro il contenuto si aprono in una nuova scheda
    rendiLinkEsterni(container);
}

// 4. Avviamo
setupBlogTabs();
caricaPost();
