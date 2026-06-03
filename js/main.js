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
                        <span><i class="fas fa-envelope"></i> &nbsp; paoloslifeblog@gmail.com</span>
                    </div>
                    <div class="socials">
                        <a target="_blank" href="https://www.facebook.com/paolo_cimenti/"><i class="fab fa-facebook"></i></a>
                        <a target="_blank" href="https://www.instagram.com/paolo_cimenti/"><i class="fab fa-instagram"></i></a>
                        <a target="_blank" href="https://twitter.com/DueQWERY"><i class="fab fa-twitter"></i></a>
                        <a target="_blank" href="https://github.com/DueQWERY"><i class="fab fa-github"></i></a>
                    </div>
                </div>
                <div class="footer-section links">
                    <h2>Quick Links</h2>
                    <div class="quick-links">
                        <a href="books.html"><i class="fas fa-book-open"></i> &nbsp; Books I have Read</a>
                        <a href="redbull.html"><i class="fas fa-mountain"></i> &nbsp; Redbull Ivy images</a>
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
                &copy; paoloslife.com | Designed by Paolo Cimenti | since 2024
            </div>
        </div>
    `;
}

// Avvia la funzione non appena la pagina ha finito di caricare
document.addEventListener('DOMContentLoaded', generaFooter);
