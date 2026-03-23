/**
 * main.js - Core application logic
 * Handles theme initialization, global settings, and page-specific logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Theme Toggle Logic
    initTheme();

    // 2. Load Global Settings (Brand name, contacts, social links)
    // We await this because other functions might depend on settings
    await loadGlobalSettings();

    // 3. Intercept Admin Portal clicks
    initAdminLinkInterceptor();

    // 4. Scroll Reveal Logic
    initScrollReveal();

    // 5. Page-Specific Initialization
    const path = window.location.pathname;
    
    if (path === '/' || path === '/index.html' || path === '') {
        initHomePage();
    } else if (path.includes('about.html')) {
        initAboutPage();
    } else if (path.includes('offers.html')) {
        initOffersPage();
    } else if (path.includes('gallery.html')) {
        initGalleryPage();
    }
});

/**
 * Theme Toggle Functionality
 */
function initTheme() {
    const textToggle = document.getElementById('themeToggleText');
    const iconToggle = document.getElementById('themeToggle');
    
    if (!textToggle && !iconToggle) {
        setTimeout(initTheme, 50);
        return;
    }

    const updateUI = (theme) => {
        if (textToggle) {
            textToggle.textContent = theme === 'dark' ? 'On Light Mode' : 'On Dark Mode';
        }
        if (iconToggle) {
            const sun = iconToggle.querySelector('.theme-icon-sun');
            const moon = iconToggle.querySelector('.theme-icon-moon');
            if (sun && moon) {
                sun.style.display = theme === 'dark' ? 'block' : 'none';
                moon.style.display = theme === 'dark' ? 'none' : 'block';
            }
        }
    };

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
    updateUI(savedTheme);

    const toggle = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateUI(newTheme);
    };

    if (textToggle) textToggle.addEventListener('click', toggle);
    if (iconToggle) iconToggle.addEventListener('click', toggle);
}

/**
 * Intercept Admin Portal clicks to force logout
 */
function initAdminLinkInterceptor() {
    const adminLinks = document.querySelectorAll('a[title="Admin Portal"]');
    adminLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
            } catch (err) {
                console.error('Logout error:', err);
            }
            window.location.href = '/admin.html';
        });
    });
}

/**
 * Load Global Settings from API and populate UI
 */
async function loadGlobalSettings() {
    try {
        const response = await fetch('/api/data/settings');
        const settings = await response.json();
        window.siteSettings = settings; // Store globally for page-specific scripts

        const mappings = {
            '.studio-name-display': settings.studioName || 'Lavya Studio',
            '.studio-phone-display': settings.phone || '',
            '.studio-email-display': settings.email || '',
            '.studio-address-display': settings.address || '',
            '.studio-time-display': settings.time || '',
            '.studio-owner-display': settings.ownerName || ''
        };

        for (const [selector, value] of Object.entries(mappings)) {
            document.querySelectorAll(selector).forEach(el => {
                if (el.tagName === 'A') {
                    if (selector.includes('phone')) el.href = `tel:${value}`;
                    if (selector.includes('email')) el.href = `mailto:${value}`;
                }
                el.textContent = value;
            });
        }

        if (settings.socials) {
            const fb = document.querySelector('.social-fb');
            const ig = document.querySelector('.social-ig');
            const wa = document.querySelector('.social-wa');
            if (fb) fb.href = settings.socials.facebook || '#';
            if (ig) ig.href = settings.socials.instagram || '#';
            if (wa) wa.href = settings.socials.whatsapp || '#';
        }
        
        return settings;
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

/**
 * Page Initializers
 */

async function initHomePage() {
    try {
        const res = await fetch('/api/upload/banner');
        const images = await res.json();
        const heroBg = document.getElementById('hero-bg');
        if (!heroBg || !images || images.length === 0) return;

        let currentIndex = 0;
        heroBg.style.backgroundImage = `url('${images[0]}')`;

        if (images.length > 1) {
            setInterval(() => {
                currentIndex = (currentIndex + 1) % images.length;
                heroBg.style.opacity = '0';
                setTimeout(() => {
                    heroBg.style.backgroundImage = `url('${images[currentIndex]}')`;
                    heroBg.style.opacity = '1';
                }, 1000);
            }, 5000);
        }
    } catch (err) {
        console.error('Failed to load banners:', err);
    }
}

async function initAboutPage() {
    const settings = window.siteSettings;
    if (!settings || !settings.about) return;
    const about = settings.about;

    const headline = document.getElementById('aboutHeadline');
    const image = document.getElementById('aboutImage');
    const desc = document.getElementById('aboutDescription');
    const teamGrid = document.getElementById('teamGrid');

    if (headline && about.headline) {
        const parts = about.headline.split(' ');
        const last = parts.pop();
        headline.innerHTML = `${parts.join(' ')} <span class="gold-text">${last}</span>`;
    }

    if (image && about.imageUrl) image.src = about.imageUrl;

    if (desc && about.description) {
        desc.innerHTML = about.description.split('\n')
            .filter(p => p.trim())
            .map(p => `<p class="mb-3">${p.replace(/Lavya Studio/g, '<strong>Lavya Studio</strong>')}</p>`)
            .join('');
    }

    if (teamGrid && about.team) {
        teamGrid.innerHTML = about.team.map(member => `
            <div class="col-lg-3 col-md-6">
                <div class="team-card h-100">
                    <img src="${member.image}" alt="${member.name}" class="img-fluid">
                    <h3 class="fw-bold h4 mb-2">${member.name}</h3>
                    <p class="text-uppercase small gold-text mb-0">${member.role}</p>
                </div>
            </div>
        `).join('');
    }

    // Initialize reveal for about page content
    initScrollReveal();
}

async function initOffersPage() {
    const container = document.getElementById('offers-container');
    if (!container) return;

    try {
        const res = await fetch('/api/data/offers');
        const offers = await res.json();
        container.innerHTML = '';

        if (!offers || offers.length === 0) {
            container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted lead">No offers currently available.</p></div>';
            return;
        }

        container.innerHTML = offers.map(offer => `
            <div class="col-lg-4 col-md-6">
                <div class="offer-card h-100 d-flex flex-column">
                    <div class="offer-img" style="${offer.image ? `background-image: url('${offer.image}')` : ''}"></div>
                    <div class="offer-content p-4 flex-grow-1 d-flex flex-column text-center">
                        <div class="price-badge mx-auto">${offer.price}</div>
                        <h3 class="fw-bold mb-3">${offer.title}</h3>
                        <p class="text-muted mb-4 flex-grow-1">${offer.description}</p>
                        <a href="/contact.html?subject=Booking for ${encodeURIComponent(offer.title)}" class="btn btn-gold btn-lg w-100">Book This Package</a>
                    </div>
                </div>
            </div>
        `).join('');

        // Initialize reveal for offers
        initScrollReveal();
    } catch (err) {
        console.error("Error loading offers:", err);
    }
}

async function initGalleryPage() {
    const container = document.getElementById('gallery-container');
    const filterContainer = document.getElementById('dynamicFilterBtns');
    if (!container) return;

    let allImages = {};

    async function loadGallery() {
        try {
            // 1. Fetch Categories for Filter Buttons
            if (filterContainer) {
                const catRes = await fetch('/api/data/categories');
                const categories = await catRes.json();
                
                // Add category buttons (keep "All" as it's static)
                if (categories && categories.length > 0) {
                    categories.forEach(cat => {
                        const btn = document.createElement('button');
                        btn.className = 'filter-btn';
                        btn.dataset.filter = cat.id;
                        btn.textContent = cat.label;
                        filterContainer.appendChild(btn);
                    });
                }

                // 2. Attach Click Listeners
                filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                        renderGallery(e.target.dataset.filter);
                    });
                });
            }

            // 3. Fetch and Render Images
            const res = await fetch('/api/upload/gallery');
            allImages = await res.json();
            renderGallery('all');
        } catch (err) {
            console.error('Failed to load gallery:', err);
        }
    }

    function renderGallery(category) {
        let imagesToRender = category === 'all' ? (allImages.all || []) : (allImages[category] || []);
        
        if (imagesToRender.length === 0) {
            container.innerHTML = '<p class="text-center w-100 lead text-muted">No images found in this category.</p>';
            return;
        }

        container.innerHTML = imagesToRender.map(url => {
            const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
            return `
                <div class="col-lg-3 col-md-4 col-sm-6">
                    <div class="gallery-item" data-url="${url}" data-video="${!!isVideo}">
                        ${isVideo ? `<video src="${url}" muted loop></video>` : `<img src="${url}" alt="Gallery Image" loading="lazy">`}
                        <div class="gallery-overlay">
                            <span style="color:white; font-size:1.5rem;">${isVideo ? '&#x25B6;' : '&#x1F50D;'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for video play/pause and lightbox
        container.querySelectorAll('.gallery-item').forEach(item => {
            const url = item.dataset.url;
            const isVideo = item.dataset.video === 'true';
            
            if (isVideo) {
                const video = item.querySelector('video');
                item.addEventListener('mouseenter', () => video.play());
                item.addEventListener('mouseleave', () => video.pause());
            }
            
            item.addEventListener('click', () => openLightbox(url, isVideo));
        });

        // Initialize reveal for dynamic gallery items
        initScrollReveal();
    }

    const lightbox = document.getElementById('lightbox');
    const lightboxContainer = document.getElementById('lightbox-container');
    const closeBtn = document.getElementById('close-lightbox');

    function openLightbox(url, isVideo) {
        if (!lightbox || !lightboxContainer) return;
        lightboxContainer.innerHTML = isVideo
            ? `<video src="${url}" controls autoplay></video>`
            : `<img src="${url}" alt="Enlarged gallery image">`;
        lightbox.classList.add('active');
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            lightbox.classList.remove('active');
            lightboxContainer.innerHTML = '';
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target === lightboxContainer) {
                lightbox.classList.remove('active');
                lightboxContainer.innerHTML = '';
            }
        });
    }

    loadGallery();
}

/**
 * Scroll Reveal Implementation
 */
function initScrollReveal() {
    // 1. Add .reveal class to key elements if not already present
    // We target common structural elements to ensure reveal across all pages
    const targets = document.querySelectorAll('section, .section, .card, .offer-card, .team-card, .gallery-item, .page-header');
    targets.forEach((el, index) => {
        if (!el.classList.contains('reveal')) {
            el.classList.add('reveal');
            // Stagger items within the same row/container
            const parent = el.parentElement;
            if (parent && parent.classList.contains('row')) {
                const siblings = Array.from(parent.children);
                const pos = siblings.indexOf(el);
                el.style.setProperty('--delay', pos + 1);
                el.classList.add('reveal-stagger');
            }
        }
    });

    // 2. Observer Config
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 3. Start Observing
    document.querySelectorAll('.reveal:not(.observed)').forEach(el => {
        el.classList.add('observed');
        observer.observe(el);
    });
}
