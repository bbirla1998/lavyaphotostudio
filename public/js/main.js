document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Toggle Logic
    initTheme();

    // Hamburger menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Intercept clicks on the Admin Portal icon (camera icon)
    const adminLinks = document.querySelectorAll('a[title="Admin Portal"]');
    adminLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                // Force logout so clicking the camera ALWAYS requires login
                await fetch('/api/auth/logout', { method: 'POST' });
            } catch (err) {
                console.error('Logout error:', err);
            }
            window.location.href = '/admin.html';
        });
    });

    // Load Global Settings
    loadGlobalSettings();
});

function initTheme() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // 1. Ensure centered container
    let navContainer = navbar.querySelector('.nav-container');
    if (!navContainer) {
        navContainer = document.createElement('div');
        navContainer.className = 'nav-container';
        while (navbar.firstChild) {
            navContainer.appendChild(navbar.firstChild);
        }
        navbar.appendChild(navContainer);
    }

    // 2. Create Left/Right Groups
    let brandGroup = navContainer.querySelector('.brand-group');
    if (!brandGroup) {
        brandGroup = document.createElement('div');
        brandGroup.className = 'brand-group';
        navContainer.insertBefore(brandGroup, navContainer.firstChild);
    }

    let navRight = navContainer.querySelector('.nav-right');
    if (!navRight) {
        navRight = document.createElement('div');
        navRight.className = 'nav-right';
        navContainer.appendChild(navRight);
    }

    // 3. Move Elements to Left Group (Camera + Name)
    const adminLink = document.querySelector('a[title="Admin Portal"]');
    const navBrand = navContainer.querySelector('.nav-brand');
    
    if (adminLink && brandGroup) {
        const parentLi = adminLink.parentElement;
        if (parentLi && parentLi.tagName === 'LI') parentLi.remove();
        adminLink.className = 'admin-brand-icon';
        brandGroup.appendChild(adminLink);
    }
    if (navBrand && brandGroup) {
        brandGroup.appendChild(navBrand);
    }

    // 4. Move Elements to Right Group (Links + Hamburger + Theme)
    const navLinks = navContainer.querySelector('.nav-links');
    const hamburger = navContainer.querySelector('.hamburger');
    if (navLinks) navRight.appendChild(navLinks);
    if (hamburger) navRight.appendChild(hamburger);

    // 5. Create Theme Toggle and place at the VERY END of nav-right
    let toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'theme-toggle';
        toggleBtn.id = 'themeToggle';
        toggleBtn.setAttribute('title', 'Toggle Dark/Light Mode');
        
        const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

        navRight.appendChild(toggleBtn);

        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        toggleBtn.innerHTML = savedTheme === 'dark' ? sunIcon : moonIcon;

        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            toggleBtn.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
        });
    }
}

async function loadGlobalSettings() {
    try {
        const response = await fetch('/api/data/settings');
        const settings = await response.json();

        // Populate common fields if elements exist
        const nameDisplays = document.querySelectorAll('.studio-name-display');
        const phoneDisplays = document.querySelectorAll('.studio-phone-display');
        const emailDisplays = document.querySelectorAll('.studio-email-display');
        const addressDisplays = document.querySelectorAll('.studio-address-display');
        const timeDisplays = document.querySelectorAll('.studio-time-display');
        const ownerDisplays = document.querySelectorAll('.studio-owner-display');

        nameDisplays.forEach(el => el.textContent = settings.studioName || 'Photo Studio');

        phoneDisplays.forEach(el => {
            el.textContent = settings.phone || '';
            if (el.tagName === 'A') el.href = `tel:${settings.phone}`;
        });

        emailDisplays.forEach(el => {
            el.textContent = settings.email || '';
            if (el.tagName === 'A') el.href = `mailto:${settings.email}`;
        });

        addressDisplays.forEach(el => el.textContent = settings.address || '');
        timeDisplays.forEach(el => el.textContent = settings.time || '');
        ownerDisplays.forEach(el => el.textContent = settings.ownerName || '');

        // Populate Social Links
        if (settings.socials) {
            const fbLink = document.querySelector('.social-fb');
            const igLink = document.querySelector('.social-ig');
            const waLink = document.querySelector('.social-wa');

            if (fbLink) fbLink.href = settings.socials.facebook || '#';
            if (igLink) igLink.href = settings.socials.instagram || '#';
            if (waLink) waLink.href = settings.socials.whatsapp || '#';
        }

    } catch (error) {
        console.error('Error loading settings:', error);
    }
}
