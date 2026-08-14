// Lightbox leggero per le immagini dei post
// - click su un'immagine -> si ingrandisce
// - se il post ha più di una immagine -> frecce per navigare
(function () {
    let immagini = [];
    let indice = 0;
    let overlay = null;

    function getOverlay() {
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.className = 'lightbox';
        overlay.innerHTML = `
            <button class="lightbox-close" aria-label="Chiudi">&times;</button>
            <button class="lightbox-nav lightbox-prev" aria-label="Immagine precedente">&#10094;</button>
            <img class="lightbox-img" src="" alt="Immagine ingrandita">
            <button class="lightbox-nav lightbox-next" aria-label="Immagine successiva">&#10095;</button>
            <div class="lightbox-counter"></div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    function apri(lista, idx) {
        immagini = lista;
        indice = idx;
        getOverlay().classList.add('lightbox-open');
        renderizza();
    }

    function renderizza() {
        const o = getOverlay();
        o.querySelector('.lightbox-img').src = immagini[indice];
        const piuDiUna = immagini.length > 1;
        o.querySelector('.lightbox-prev').style.display = piuDiUna ? 'flex' : 'none';
        o.querySelector('.lightbox-next').style.display = piuDiUna ? 'flex' : 'none';
        o.querySelector('.lightbox-counter').textContent = piuDiUna ? (indice + 1) + ' / ' + immagini.length : '';
    }

    function chiudi() {
        getOverlay().classList.remove('lightbox-open');
        immagini = [];
        indice = 0;
    }

    function successiva() { indice = (indice + 1) % immagini.length; renderizza(); }
    function precedente() { indice = (indice - 1 + immagini.length) % immagini.length; renderizza(); }

    // Apertura: click su un'immagine di un post
    document.addEventListener('click', function (e) {
        const img = e.target.closest('.content img');
        if (!img) return;

        const gallery = img.closest('.gallery');
        let lista;
        if (gallery) {
            // immagini della galleria, nell'ordine degli slot
            lista = Array.from(gallery.querySelectorAll('img')).map(function (i) { return i.src; });
        } else {
            lista = [img.src];
        }

        const idx = lista.indexOf(img.src);
        apri(lista, idx >= 0 ? idx : 0);
    });

    // Chiusura: click sullo sfondo o sul pulsante X
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('lightbox') || e.target.classList.contains('lightbox-close')) {
            chiudi();
        }
    });

    // Navigazione con i pulsanti freccia
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('lightbox-next')) successiva();
        else if (e.target.classList.contains('lightbox-prev')) precedente();
    });

    // Navigazione da tastiera (Esc / frecce)
    document.addEventListener('keydown', function (e) {
        if (!overlay || !overlay.classList.contains('lightbox-open')) return;
        if (e.key === 'Escape') chiudi();
        else if (e.key === 'ArrowRight') successiva();
        else if (e.key === 'ArrowLeft') precedente();
    });
})();
