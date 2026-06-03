// 1. Configurazione e Connessione a Supabase
const SUPABASE_URL = "https://rylrgyqvabgtvcjwidqg.supabase.co";
const SUPABASE_KEY = "sb_publishable_ltI-p9eQ9K9zfUDwRnwAlg_aThQgZvP"; 
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

// 4. Invio del Post con caricamento immagine su CLOUDINARY

const submitBtn = document.getElementById('submit-btn');
if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        const titleInput = document.getElementById('title').value;
        const contentInput = document.getElementById('content').innerHTML;
        const imageElement = document.getElementById('image');
        const imageFile = imageElement ? imageElement.files[0] : null;

// 1. LEGGIAMO LA CATEGORIA SELEZIONATA (blog o books)
        const categoryElement = document.getElementById('category');
        const categoryInput = categoryElement ? categoryElement.value : 'blog';

        if (!titleInput || !contentInput) {
            alert("Per favore, inserisci almeno un titolo e un contenuto!");
            return;
        }

        let urlImmagineFinale = "";

        // Se l'utente ha selezionato un file, lo carichiamo su Cloudinary
        if (imageFile) {
            const CLOUD_NAME = "dx1hcvhht"; 
            const UPLOAD_PRESET = "blog-uploads"; 

            // Prepariamo i dati da inviare a Cloudinary
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', UPLOAD_PRESET);

            try {
                // Disabilitiamo temporaneamente il bottone per evitare click multipli durante il caricamento
                submitBtn.disabled = true;
                submitBtn.innerText = "Caricamento immagine...";

                // Inviamo il file a Cloudinary tramite API
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: formData
                });

                const cloudinaryData = await response.json();

                if (cloudinaryData.secure_url) {
                    // Cloudinary ci restituisce il link sicuro (https) dell'immagine
                    urlImmagineFinale = cloudinaryData.secure_url;
                } else {
                    console.error("Errore Cloudinary:", cloudinaryData);
                    alert("Errore nel caricamento dell'immagine su Cloudinary.");
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Pubblica Post";
                    return;
                }
            } catch (err) {
                console.error("Errore di rete con Cloudinary:", err);
                alert("Impossibile connettersi a Cloudinary.");
                submitBtn.disabled = false;
                submitBtn.innerText = "Pubblica Post";
                return;
            }
        }

        // Cambiamo il testo del bottone durante l'inserimento nel database
        submitBtn.innerText = "Salvataggio nel database...";

        // Salviamo tutto su Supabase
        const { data, error } = await db
            .from('posts')
            .insert([
                { 
                    titolo: titleInput, 
                    immagine: urlImmagineFinale, // Link sicuro di Cloudinary
                    contenuto: contentInput,
                    categoria: categoryInput
                }
            ]);

        // Ripristiniamo il bottone
        submitBtn.disabled = false;
        submitBtn.innerText = "Pubblica Post";

        if (error) {
            console.error("Errore Supabase:", error);
            alert("Errore di permessi nel database.");
        } else {
            alert("Success!");
            
            // Svuotiamo tutti i campi del form per il prossimo post
            document.getElementById('title').value = '';
            document.getElementById('content').value = '';
            if (imageElement) imageElement.value = ''; // Resetta correttamente il file selezionato
        }
    });
}
