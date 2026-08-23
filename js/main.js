// ============================================================
// main.js — Shared components for paoloslife.com
// ============================================================

// ---- Navbar (shared across all pages) ----
// Call: generaNavbar('Home')   or   generaNavbar('Progetti')
// Add <nav id="navbar-container"></nav> in each page.

function generaNavbar(pageTitle) {
    const nav = document.getElementById('navbar-container');
    if (!nav) return;

    const titolo = pageTitle || '';

    nav.innerHTML = `
    <div class="navbar">
        <div class="container">
            <div class="navbar-left">
                <div class="logo">
                    <a href="index.html">
                        <img src="images/profile.png" alt="logo">
                    </a>
                </div>
                <div>
                    <a href="index.html" class="page-name">${titolo} <span>-</span> Paolo's life Blog</a>
                </div>
            </div>
            <div class="navbar-right">
                <div class="dropdown">
                    <button class="dropdown-toggle" aria-label="Menu">
                        Menu <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="dropdown-menu">
                        <a href="index.html"><i class="fas fa-home"></i> Home</a>
                        <a href="aboutme.html"><i class="fas fa-user"></i> About Me</a>
                        <div class="dropdown-divider"></div>
                        <a href="todo.html"><i class="fas fa-check-square"></i> ToDo</a>
                        <a href="books.html"><i class="fas fa-book-open"></i> Libri</a>
                        <a href="projects.html"><i class="fas fa-rocket"></i> Progetti</a>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

// ---- Footer (shared across all pages) ----
// Add <div id="footer-condiviso"></div> in each page.

function generaFooter() {
    const footerContainer = document.getElementById('footer-condiviso');
    if (!footerContainer) return;

    footerContainer.innerHTML = `
        <div class="footer">
            <div class="footer-content">
                <div class="footer-section about">
                    <h2 class="logo-text">Paolo's <span>Life</span> Blog</h2>
                    <p>Paolo's Life Blog is my first site, I created it as an experiment 
                        to learn HTML, CSS and JavaScript. <br>
                        I am continuing do update this blog and I can't 
                        wait to see where this project goes!
                    </p>
                    <div class="contact">
                        <span><i class="fas fa-envelope"></i> &nbsp; cimentipaolo07@gmail.com</span>
                    </div>
                    <div class="socials">
                        <a target="_blank" href="https://www.facebook.com/paolo_cimenti/"><i class="fab fa-facebook"></i></a>
                        <a target="_blank" href="https://www.instagram.com/paolo_cimenti/"><i class="fab fa-instagram"></i></a>
                        <a target="_blank" href="https://twitter.com/DueQWERY"><i class="fab fa-twitter"></i></a>
                        <a target="_blank" href="https://github.com/DueQWERY"><i class="fab fa-github"></i></a>
                        <a target="_blank" href="https://www.linkedin.com/in/paolo-cimenti-07b449285"><i class="fab fa-linkedin"></i></a>
                    </div>
                </div>
                <div class="footer-section links">
                    <h2>Quick Links</h2>
                    <div class="quick-links">
                        <a href="books.html"><i class="fas fa-book-open"></i> &nbsp; Books I have Read</a>
                        <a href="redbull.html"><i class="fas fa-mountain"></i> &nbsp; Redbull Ivy images</a>
                        <a href="projects.html"><i class="fas fa-rocket"></i> &nbsp; Projects</a>
                    </div>
                </div>
                <div class="footer-section contact-form">
                    <h2>Contact Me</h2>
                    <br>
                    <div class="compiler">
                        <form action="index.html" method="post">
                            <input type="email" name="email" class="text-input contact-input" placeholder="Your email address...">
                            <textarea name="message" class="text-input contact-input" placeholder="Your message here..."></textarea>
                            <button type="submit" class="btn navbutton sendbutton">
                                <i class="fas fa-envelope"></i>
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                &copy; paolocimenti.com | Designed by Paolo Cimenti | since 2024
            </div>
        </div>
    `;
}

// ---- Shared init (runs on every page) ----
// Pages set <nav id="navbar-container" data-page="Home"></nav> for auto-navbar.
// Pages that need specific init can add their own DOMContentLoaded listener.
// main.js runs first, so navbar + footer are ready before page-specific scripts.
document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('navbar-container');
    if (nav) generaNavbar(nav.dataset.page || '');
    generaFooter();
});