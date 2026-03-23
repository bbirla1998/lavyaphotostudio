/**
 * components.js
 * Handles shared UI components like Navbar and Footer
 */

function renderNavbar() {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (!navbarPlaceholder) return;

    const currentPath = window.location.pathname;
    const isHome = currentPath === '/' || currentPath === '/index.html' || currentPath === '';
    const isServices = currentPath.includes('services.html');
    const isGallery = currentPath.includes('gallery.html');
    const isOffers = currentPath.includes('offers.html');
    const isAbout = currentPath.includes('about.html');
    const isContact = currentPath.includes('contact.html');

    navbarPlaceholder.innerHTML = `
    <nav class="navbar navbar-expand-lg fixed-top shadow-sm py-3">
        <div class="container">
            <div class="d-flex align-items-center">
                <a href="/admin.html" title="Admin Portal" class="admin-brand-icon me-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                </a>
                <a class="navbar-brand studio-name-display fw-bold mb-0 text-uppercase gold-text" href="/">Lavya Studio</a>
            </div>

            <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse justify-content-center" id="navbarNav">
                <ul class="navbar-nav gap-lg-4 text-center">
                    <li class="nav-item"><a class="nav-link ${isHome ? 'active' : ''}" href="/">Home</a></li>
                    <li class="nav-item"><a class="nav-link ${isServices ? 'active' : ''}" href="/services.html">Services</a></li>
                    <li class="nav-item"><a class="nav-link ${isGallery ? 'active' : ''}" href="/gallery.html">Gallery</a></li>
                    <li class="nav-item"><a class="nav-link ${isOffers ? 'active' : ''}" href="/offers.html">Offers</a></li>
                    <li class="nav-item"><a class="nav-link ${isAbout ? 'active' : ''}" href="/about.html">About</a></li>
                    <li class="nav-item"><a class="nav-link ${isContact ? 'active' : ''}" href="/contact.html">Contact</a></li>
                    <li class="nav-item d-lg-none">
                        <a href="javascript:void(0)" class="nav-link gold-text fw-bold" id="themeToggleText">Loading...</a>
                    </li>
                </ul>
            </div>

            <!-- Desktop Theme Toggle Icon -->
            <div class="d-none d-lg-flex ms-lg-3">
                <button id="themeToggle" class="btn btn-outline-gold rounded-pill px-3 py-1 d-flex align-items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-sun"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-moon" style="display:none;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </button>
            </div>
        </div>
    </nav>`;
}

function renderFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) return;

    footerPlaceholder.innerHTML = `
    <footer class="py-5">
        <div class="container">
            <div class="row g-4">
                <div class="col-lg-5 col-md-6">
                    <h4 class="studio-name-display fw-bold gold-text mb-4">Lavya Studio</h4>
                    <p class="text-muted mb-4">Creating timeless memories through our lens. Contact us to make your moments unforgettable.</p>
                    <div class="social-links">
                        <a href="#" class="social-fb" title="Facebook">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                        </a>
                        <a href="#" class="social-ig" title="Instagram">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </a>
                        <a href="#" class="social-wa" title="WhatsApp">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.8 8.5 8.5 0 0 1 4.7 1.5l1.4-1.4a1 1 0 0 1 1.4 0l.1.1a1 1 0 0 1 0 1.4L18.7 7.5a8.38 8.38 0 0 1 2.3 4z"></path></svg>
                        </a>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <h4 class="fw-bold mb-4">Quick Links</h4>
                    <ul class="list-unstyled footer-links">
                        <li class="mb-2"><a href="/gallery.html" class="text-decoration-none text-muted">Portfolio Gallery</a></li>
                        <li class="mb-2"><a href="/offers.html" class="text-decoration-none text-muted">Special Offers</a></li>
                        <li class="mb-2"><a href="/about.html" class="text-decoration-none text-muted">About Us</a></li>
                        <li class="mb-2"><a href="/contact.html" class="text-decoration-none text-muted">Contact Form</a></li>
                    </ul>
                </div>
                <div class="col-lg-4">
                    <h4 class="fw-bold mb-4">Contact Us</h4>
                    <ul class="list-unstyled footer-links">
                        <li class="mb-2 text-muted">Phone: <a href="#" class="studio-phone-display text-decoration-none text-muted"></a></li>
                        <li class="mb-2 text-muted">Email: <a href="#" class="studio-email-display text-decoration-none text-muted"></a></li>
                        <li class="studio-address-display text-muted mb-3"></li>
                    </ul>
                </div>
            </div>
            <hr class="my-4 border-secondary opacity-25">
            <div class="footer-bottom text-center text-muted">
                &copy; <span id="year-copy"></span> <span class="studio-name-display"></span>. All Rights Reserved.
            </div>
        </div>
    </footer>`;
    
    const yearSpan = document.getElementById('year-copy');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
    renderFooter();
});
