   // ============================================================
   // post.js — Pagina articolo singolo: contenuto + commenti
   // ============================================================

   // 1. Config — Qui possiamo dichiarare le costanti libremente:
   //    questa pagina carica SOLO questo script (in index.html, dove
   //    blog.js dichiara già db, non si potrebbe: errore di ridichiarazione)
   const SUPABASE_URL = "https://rylrgyqvabgtvcjwidqg.supabase.co";
   const SUPABASE_KEY = "sb_publishable_ltI-p9eQ9K9zfUDwRnwAlg_aThQgZvP";
   const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

   // 2. L'id del post arriva dall'URL: post.html?id=61
   const params = new URLSearchParams(window.location.search);
   const POST_ID = parseInt(params.get('id') || '', 10);

   // 3. ESCAPING: trasforma i caratteri pericolosi in entità sicure.
   //    Si usa su TUTTO ciò che è stato scritto dagli utenti.
   function esc(s) {
       return String(s)
           .replace(/&/g, '&amp;')
           .replace(/</g, '&lt;')
           .replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;')
           .replace(/'/g, '&#39;');
   }

   // 4. Gestione immagini Cloudinary (identica a blog.js)
   function ottimizzaUrl(url) {
       if (url && url.includes("cloudinary.com")) {
           return url.replace("/upload/", "/upload/f_auto,q_auto/");
       }
       return url;
   }

   // 5. Data/ora come nel resto del sito
   function formattaData(ts) {
       const data = new Date(ts).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
       const ora = new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
       return `${data} - ${ora}`;
   }

   // 6. Carica e mostra l'articolo completo
   async function caricaPost() {
       const container = document.getElementById('post-container');

       const { data: post, error } = await db
           .from('posts')
           .select('*')
           .eq('id', POST_ID)
           .single();   // .single() = mi aspetto esattamente UNA riga

       if (error || !post) {
           container.innerHTML = `
               <p style="text-align:center; padding:60px;">
                   Articolo non trovato. <a href="index.html" style="color:#2d5a27;">Torna alla home</a>
               </p>`;
           return;
       }

       // Badges sottocategoria (come in blog.js)
       const subs = Array.isArray(post.sottocategoria)
           ? post.sottocategoria
           : (post.sottocategoria ? [post.sottocategoria] : []);
       const badges = subs.map(s =>
           `<span class="project-badge ${s.toLowerCase()}">${s}</span>`).join('');

       // Immagine: galleria oppure singola
       let tagImmagine = "";
       if (post.galleria && Array.isArray(post.galleria.images) && post.galleria.images.length >= 2) {
           const layout = post.galleria.layout || "four-grid";
           const aree = ["a", "b", "c", "d"];
           const imgs = post.galleria.images.slice(0, 4)
               .map((url, i) => `<img src="${ottimizzaUrl(url)}" alt="Immagine ${i+1}" style="grid-area: ${aree[i]};">`)
               .join("");
           tagImmagine = `<div class="gallery gallery-${layout}">${imgs}</div>`;
       } else if (post.immagine && post.immagine.trim() !== "") {
           tagImmagine = `<img src="${ottimizzaUrl(post.immagine)}" alt="Copertina">`;
       }

       container.innerHTML = `
           <section class="hero">
               <div class="container">
                   ${badges}
                   <div class="heading">
                       <h1 class="title">${post.titolo}</h1>
                       <p class="date-time">${formattaData(post.created_at)}</p>
                   </div>
                   <div class="content">
                       <div><p>${post.contenuto.replace(/\n/g, '<br>')}</p></div>
                       ${tagImmagine}
                   </div>
               </div>
           </section>`;

       // I link del contenuto si aprono in una nuova scheda
       rendiLinkEsterni(container);

       // Il post esiste: facciamo vedere commenti e form
       document.getElementById('comments-container').style.display = 'block';
       caricaCommenti();
   }

   // 7. Carica e mostra i commenti del post (più vecchi in alto)
   async function caricaCommenti() {
       const list = document.getElementById('comments-list');
       const { data: commenti, error } = await db
           .from('comments')
           .select('*')
           .eq('post_id', POST_ID)
           .order('created_at', { ascending: true });   // cronologico, dal più vecchio

       if (error) {
           list.innerHTML = `<p style="color:red;">Errore nel caricamento dei commenti.</p>`;
           return;
       }

       // Nota: si usa textContent, mai innerHTML, per i numeri derivati da input
       const n = commenti.length;
       document.getElementById('comment-count').textContent =
           `${n} ${n === 1 ? 'commento' : 'commenti'}`;

       if (n === 0) {
           list.innerHTML = `<p style="color:#666;">Nessun commento. Sii il primo a scriverne uno!</p>`;
           return;
       }

       // ESCAPING su autore e testo; poi il testo viene "fuggito",
       // quindi il CSS white-space:pre-line gestirà i suoi a capo in sicurezza
       list.innerHTML = commenti.map(c => `
           <div class="comment">
               <div class="comment-header">
                   <strong>${esc(c.author_name)}</strong>
                   <time>${formattaData(c.created_at)}</time>
               </div>
               <p class="comment-text">${esc(c.comment_text)}</p>
           </div>`).join('');
   }

   // 8. Invio del commento
   async function inviaCommento(e) {
       e.preventDefault();   // impedisci il ricaricamento della pagina

       const feedback = document.getElementById('comment-feedback');
       const submit = document.getElementById('comment-submit');
       const anonimo = document.getElementById('anonimo-check').checked;
       const nome = document.getElementById('comment-name').value.trim();
       const password = document.getElementById('comment-password').value;
       const testo = document.getElementById('comment-text').value.trim();

       // HONEYPOT: se compilato, è un bot → finto successo, nessuna chiamata
       if (document.getElementById('website').value !== '') {
           feedback.innerHTML = '<span style="color:green;">Commento inviato!</span>';
           document.getElementById('comment-text').value = '';
           return;
       }

       // Validazioni lato cliente (quelle vere però stanno nel database)
       if (testo === '') {
           feedback.innerHTML = '<span style="color:red;">Scrivi un commento prima di inviare.</span>';
           return;
       }
       if (!anonimo && nome === '') {
           feedback.innerHTML = '<span style="color:red;">Scegli un nome oppure spunta Anonimo.</span>';
           return;
       }
       if (!anonimo && password.length < 4) {
           feedback.innerHTML = '<span style="color:red;">La password deve avere almeno 4 caratteri.</span>';
           return;
       }

       submit.disabled = true;
       submit.innerText = "Invio in corso…";

       const { data, error } = await db.rpc('add_comment', {
           p_post_id: POST_ID,
           p_name: anonimo ? 'Anonimo' : nome,
           p_password: anonimo ? '' : password,
           p_text: testo
       });

       submit.disabled = false;
       submit.innerText = "Invia commento";

       if (error) {
           // Errore di rete/database (la chiamata è proprio fallita)
           feedback.innerHTML = `<span style="color:red;">Errore di invio: ${esc(error.message)}</span>`;
           return;
       }
       if (!data.ok) {
           // La funzione ha rifiutato con un motivo di business (es. password errata)
           feedback.innerHTML = `<span style="color:red;">${esc(data.error)}</span>`;
           if (data.error && data.error.toLowerCase().includes('password')) {
               document.getElementById('comment-password').focus();
           }
           return;
       }

       // Successo: messaggio (con avviso se il nome è stato appena registrato)
       if (data.nuovo_nome) {
           feedback.innerHTML = `<span style="color:green;">Commento inviato! Il nome "${esc(nome)}" è ora registrato: da adesso per usarlo servirà la sua password.</span>`;
       } else {
           feedback.innerHTML = '<span style="color:green;">Commento inviato!</span>';
       }

       // Svuota il form e ricarica la lista
       document.getElementById('comment-name').value = '';
       document.getElementById('comment-password').value = '';
       document.getElementById('comment-text').value = '';
       caricaCommenti();
   }

   // 9. Avvio
   if (!POST_ID || Number.isNaN(POST_ID)) {
       document.getElementById('post-container').innerHTML =
           `<p style="text-align:center; padding:60px;">URL non valido: manca l'id del post. <a href="index.html">Torna alla home</a></p>`;
   } else {
       document.getElementById('comment-form').addEventListener('submit', inviaCommento);
       caricaPost();
   }
