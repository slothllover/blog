// 1. Configurazione e Connessione a Supabase
const SUPABASE_URL = "https://rylrgyqvabgtvcjwidqg.supabase.co";
const SUPABASE_KEY = "sb_publishable_ltI-p9eQ9K9zfUDwRnwAlg_aThQgZvP"; 
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Layout galleria disponibili (numero immagini + etichette degli slot)
const LAYOUTS = {
    "single":           { count: 1, labels: ["Immagine di Copertina"] },
    "two-side":         { count: 2, labels: ["Immagine 1 (sinistra)", "Immagine 2 (destra)"] },
    "two-stack":        { count: 2, labels: ["Immagine 1 (sopra)", "Immagine 2 (sotto)"] },
    "three-big-left":   { count: 3, labels: ["Immagine grande (sinistra)", "Piccola 1 (alto a destra)", "Piccola 2 (basso a destra)"] },
    "three-big-right":  { count: 3, labels: ["Immagine grande (destra)", "Piccola 1 (alto a sinistra)", "Piccola 2 (basso a sinistra)"] },
    "three-big-top":    { count: 3, labels: ["Immagine grande (sopra)", "Piccola 1 (sotto a sinistra)", "Piccola 2 (sotto a destra)"] },
    "three-big-bottom": { count: 3, labels: ["Immagine grande (sotto)", "Piccola 1 (sopra a sinistra)", "Piccola 2 (sopra a destra)"] },
    "four-grid":        { count: 4, labels: ["Immagine 1 (alto sinistra)", "Immagine 2 (alto destra)", "Immagine 3 (basso sinistra)", "Immagine 4 (basso destra)"] }
};

// Riferimenti agli elementi della pagina
const loginBox = document.getElementById('login-box');
const adminPanel = document.getElementById('admin-panel');

// Funzione per controllare la sessione dell'utente all'apertura
async function controllaSessione() {
    const { data: { session } } = await db.auth.getSession();
    if (session) {
        if (loginBox) loginBox.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
    } else {
        if (loginBox) loginBox.style.display = 'block';
        if (adminPanel) adminPanel.style.display = 'none';
    }
}

// Avviamo il controllo sessione appena lo script viene letto
controllaSessione();

// 2. Gestione del pulsante di Login
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const { data, error } = await db.auth.signInWithPassword({ email, password });

        if (error) {
            alert("Accesso negato: " + error.message);
        } else {
            await controllaSessione(); // Mostra il pannello di scrittura
        }
    });
}

// 3. Gestione del pulsante Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await db.auth.signOut();
        await controllaSessione(); // Torna alla schermata di login
    });
}

// 4. Generazione dinamica degli slot immagine in base al layout scelto
function aggiornaSlotImmagini() {
    const select = document.getElementById('layout');
    const container = document.getElementById('image-slots');
    if (!select || !container) return;

    const layout = select.value;
    const cfg = LAYOUTS[layout] || LAYOUTS["single"];
    let html = '';
    for (let i = 0; i < cfg.count; i++) {
        html += `
            <div class="form-group">
                <label for="image-${i}">${cfg.labels[i]}</label>
                <input type="file" id="image-${i}" accept="image/*">
            </div>`;
    }
    container.innerHTML = html;
}

const layoutSelect = document.getElementById('layout');
if (layoutSelect) {
    layoutSelect.addEventListener('change', aggiornaSlotImmagini);
    aggiornaSlotImmagini(); // inizializza gli slot al caricamento
}

// 5. Upload di un singolo file su Cloudinary
async function caricaSuCloudinary(file) {
    const CLOUD_NAME = "dx1hcvhht"; 
    const UPLOAD_PRESET = "blog-uploads"; 

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    if (data.secure_url) {
        return data.secure_url;
    }
    throw new Error(data.error?.message || "Errore Cloudinary");
}

// 6. Invio del Post
const submitBtn = document.getElementById('submit-btn');
if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        const titleInput = document.getElementById('title').value;
        const contentInput = document.getElementById('content').innerHTML;

        // Categoria (blog o books)
        const categoryElement = document.getElementById('category');
        const categoryInput = categoryElement ? categoryElement.value : 'blog';

        // Layout scelto
        const layoutInput = (document.getElementById('layout') || {}).value || 'single';
        const cfg = LAYOUTS[layoutInput] || LAYOUTS["single"];

        if (!titleInput || !contentInput) {
            alert("Per favore, inserisci almeno un titolo e un contenuto!");
            return;
        }

        let immagineFinale = "";
        let galleriaFinale = null;

        // Raccogliamo i file dagli slot
        const files = [];
        for (let i = 0; i < cfg.count; i++) {
            const el = document.getElementById('image-' + i);
            files.push(el && el.files[0] ? el.files[0] : null);
        }

        try {
            if (layoutInput === "single") {
                // Caso singola immagine (comportamento attuale, retrocompatibile)
                if (files[0]) {
                    submitBtn.disabled = true;
                    submitBtn.innerText = "Caricamento immagine...";
                    immagineFinale = await caricaSuCloudinary(files[0]);
                }
            } else {
                // Galleria multi-immagine: tutti gli slot sono obbligatori
                for (let i = 0; i < cfg.count; i++) {
                    if (!files[i]) {
                        alert(`Carica l'immagine per lo slot ${i + 1} ("${cfg.labels[i]}").`);
                        return;
                    }
                }

                submitBtn.disabled = true;
                submitBtn.innerText = "Caricamento immagini...";

                const urls = [];
                for (let i = 0; i < cfg.count; i++) {
                    urls.push(await caricaSuCloudinary(files[i]));
                }
                galleriaFinale = { layout: layoutInput, images: urls };
            }
        } catch (err) {
            console.error("Errore di caricamento:", err);
            alert("Errore: " + err.message);
            submitBtn.disabled = false;
            submitBtn.innerText = "Pubblica Post";
            return;
        }

        submitBtn.innerText = "Salvataggio nel database...";

        // Costruiamo il record da salvare su Supabase
        const record = {
            titolo: titleInput,
            immagine: immagineFinale,       // URL singolo (vuoto per le gallerie)
            contenuto: contentInput,
            categoria: categoryInput
        };
        if (galleriaFinale) {
            record.galleria = galleriaFinale; // { layout, images[] }
        }

        const { error } = await db
            .from('posts')
            .insert([record]);

        submitBtn.disabled = false;
        submitBtn.innerText = "Pubblica Post";

        if (error) {
            console.error("Errore Supabase:", error);
            alert("Errore di permessi nel database.");
        } else {
            alert("Success!");
            document.getElementById('title').value = '';
            document.getElementById('content').innerHTML = '';
            aggiornaSlotImmagini(); // resetta gli input file
        }
    });
}
