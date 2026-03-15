document.addEventListener('DOMContentLoaded', () => {

    // 1. Session Check Middleware
    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/check');
            const data = await res.json();
            if (!data.isAuthenticated) {
                window.location.href = '/admin.html';
            }
        } catch (err) {
            window.location.href = '/admin.html';
        }
    }
    checkAuth();

    // 1.5 Auto Logout on Inactivity (10 minutes)
    let inactivityTimeout;
    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes in ms

    function resetInactivityTimer() {
        clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/admin.html';
        }, INACTIVITY_LIMIT);
    }

    // Listen for any activity on the admin dashboard
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    resetInactivityTimer(); // start initial timer

    // 2. Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all
            navItems.forEach(n => n.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Add active class to clicked
            item.classList.add('active');
            const target = item.getAttribute('data-target');
            document.getElementById(target).classList.add('active');

            // Lazy load specific data
            if (target === 'gallery-section') { loadCategoriesAdmin(); loadGalleryAdmin(); }
            if (target === 'banner-section') loadBannersAdmin();
            if (target === 'offers-section') loadOffersAdmin();
            if (target === 'categories-section') loadCategoriesAdmin();
            if (target === 'about-section') loadAboutAdmin();
            if (target === 'settings-section') loadSettingsAdmin();
        });
    });

    // 3. Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/admin.html';
    });

    // --- Helper: Toast Notification ---
    window.showToast = function (msg, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.className = 'toast show';
        if (isError) toast.classList.add('error');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }


    /* =========================================
       GALLERY MANAGEMENT
    ========================================= */
    const galleryFilter = document.getElementById('galleryFilter');
    galleryFilter.addEventListener('change', loadGalleryAdmin);

    document.getElementById('galleryUploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const category = document.getElementById('galleryCategory').value;
        const fileInput = document.getElementById('galleryFile');
        const formData = new FormData();

        if (fileInput.files.length === 0) return;
        formData.append('image', fileInput.files[0]);

        try {
            const res = await fetch(`/api/upload/gallery/${category}`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Image uploaded successfully');
                fileInput.value = '';
                // Reload if currently viewing that category
                if (galleryFilter.value === category) loadGalleryAdmin();
            } else {
                showToast(data.error || 'Upload failed', true);
            }
        } catch (err) {
            showToast('Network error on upload', true);
        }
    });

    async function loadGalleryAdmin() {
        const category = galleryFilter.value;
        const grid = document.getElementById('adminGalleryGrid');
        grid.innerHTML = '<p>Loading...</p>';

        try {
            const res = await fetch('/api/upload/gallery');
            const data = await res.json();
            const images = data[category] || [];

            grid.innerHTML = '';
            if (images.length === 0) {
                grid.innerHTML = '<p>No images in this category.</p>';
            } else {
                images.forEach(url => {
                    const filename = url.split('/').pop();
                    const card = document.createElement('div');
                    card.className = 'img-card';
                    const isVideo = url.match(/\.(mp4|webm|ogg)$/i) || url.toLowerCase().includes('video');
                    const mediaTag = isVideo
                        ? `<video src="${url}" muted autoplay loop style="width:100%; height:100%; object-fit:cover; border-radius:8px;"></video>`
                        : `<img src="${url}" alt="Gallery img">`;
                    card.innerHTML = `
                        ${mediaTag}
                        <button class="delete-btn" onclick="deleteGalleryImage('${category}', '${url}')">&times;</button>
                    `;
                    grid.appendChild(card);
                });
            }
        } catch (err) {
            grid.innerHTML = '<p>Error loading gallery.</p>';
        }
    }

    window.deleteGalleryImage = async function (category, url) {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            let res;
            if (url.startsWith('/uploads/')) {
                // It's a local file
                const filename = url.split('/').pop();
                res = await fetch(`/api/upload/gallery/${category}/${filename}`, { method: 'DELETE' });
            } else {
                // It's an external link
                res = await fetch(`/api/upload/external-link?url=${encodeURIComponent(url)}&category=${category}`, { method: 'DELETE' });
            }

            if (res.ok) {
                showToast('Item deleted successfully');
                loadGalleryAdmin();
            } else {
                showToast('Failed to delete item', true);
            }
        } catch (err) {
            showToast('Network error', true);
        }
    }

    window.addExternalLink = async function() {
        const url = document.getElementById('externalUrl').value.trim();
        const category = document.getElementById('galleryCategory').value;

        if (!url) {
            showToast('Please enter a valid URL', true);
            return;
        }

        try {
            const res = await fetch('/api/upload/external-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, category })
            });

            if (res.ok) {
                showToast('URL added to gallery');
                document.getElementById('externalUrl').value = '';
                if (galleryFilter.value === category || galleryFilter.value === 'all') loadGalleryAdmin();
            } else {
                const data = await res.json();
                showToast(data.error || 'Failed to add URL', true);
            }
        } catch (err) {
            showToast('Network error', true);
        }
    }


    /* =========================================
       BANNER MANAGEMENT
    ========================================= */
    document.getElementById('bannerUploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('bannerFile');
        const formData = new FormData();

        if (fileInput.files.length === 0) return;
        formData.append('image', fileInput.files[0]);

        try {
            const res = await fetch('/api/upload/banner', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Banner uploaded');
                fileInput.value = '';
                loadBannersAdmin();
            } else {
                showToast(data.error || 'Upload failed', true);
            }
        } catch (err) {
            showToast('Network error', true);
        }
    });

    async function loadBannersAdmin() {
        const grid = document.getElementById('adminBannerGrid');
        grid.innerHTML = '<p>Loading...</p>';

        try {
            const res = await fetch('/api/upload/banner');
            const images = await res.json();

            grid.innerHTML = '';
            if (!images || images.length === 0) {
                grid.innerHTML = '<p>No banners found.</p>';
            } else {
                images.forEach(url => {
                    const filename = url.split('/').pop();
                    const card = document.createElement('div');
                    card.className = 'img-card';
                    card.innerHTML = `
                        <img src="${url}" alt="Banner img">
                        <button class="delete-btn" onclick="deleteBanner('${filename}')">&times;</button>
                    `;
                    grid.appendChild(card);
                });
            }
        } catch (err) {
            grid.innerHTML = '<p>Error loading banners.</p>';
        }
    }

    window.deleteBanner = async function (filename) {
        if (!confirm('Are you sure you want to delete this banner?')) return;
        try {
            const res = await fetch(`/api/upload/banner/${filename}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Banner deleted');
                loadBannersAdmin();
            } else {
                showToast('Failed to delete', true);
            }
        } catch (err) {
            showToast('Network error', true);
        }
    }


    /* =========================================
       OFFERS MANAGEMENT
    ========================================= */
    const offerForm = document.getElementById('offerForm');

    offerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            id: document.getElementById('offerId').value || null,
            title: document.getElementById('offerTitle').value,
            price: document.getElementById('offerPrice').value,
            image: document.getElementById('offerImage').value,
            description: document.getElementById('offerDesc').value
        };

        try {
            const res = await fetch('/api/data/offers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast('Package Saved');
                resetOfferForm();
                loadOffersAdmin();
            } else {
                showToast('Failed to save', true);
            }
        } catch (err) {
            showToast('Network error', true);
        }
    });

    window.resetOfferForm = function () {
        offerForm.reset();
        document.getElementById('offerId').value = '';
        document.getElementById('offerFormTitle').textContent = 'Add New Package';
    }

    async function loadOffersAdmin() {
        const list = document.getElementById('adminOffersList');
        list.innerHTML = '<p>Loading...</p>';

        try {
            const res = await fetch('/api/data/offers');
            const data = await res.json();

            list.innerHTML = '';
            if (!data || data.length === 0) {
                list.innerHTML = '<p>No packages found.</p>';
                return;
            }

            data.forEach(offer => {
                const li = document.createElement('li');
                li.className = 'list-item';
                li.innerHTML = `
                    <div>
                        <strong>${offer.title}</strong> - <span style="color:var(--accent-gold);">${offer.price}</span>
                    </div>
                    <div>
                        <button class="btn" style="padding: 5px 10px; font-size: 0.8rem;" onclick='editOffer(${JSON.stringify(offer)})'>Edit</button>
                        <button class="btn btn-danger" style="padding: 5px 10px; font-size: 0.8rem; margin-left:5px;" onclick="deleteOffer('${offer.id}')">Delete</button>
                    </div>
                `;
                list.appendChild(li);
            });
        } catch (err) {
            list.innerHTML = '<p>Error loading packages.</p>';
        }
    }

    // Expose object for editing (must escape single quotes if needed, but JSON.stringify usually safe here)
    window.editOffer = function (offer) {
        document.getElementById('offerFormTitle').textContent = 'Edit Package: ' + offer.title;
        document.getElementById('offerId').value = offer.id;
        document.getElementById('offerTitle').value = offer.title;
        document.getElementById('offerPrice').value = offer.price;
        document.getElementById('offerImage').value = offer.image || '';
        document.getElementById('offerDesc').value = offer.description;
        window.scrollTo(0, 0);
    }

    window.deleteOffer = async function (id) {
        if (!confirm('Are you sure you want to delete this package?')) return;
        try {
            const res = await fetch(`/api/data/offers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Package deleted');
                loadOffersAdmin();
            } else {
                showToast('Failed to delete', true);
            }
        } catch (err) {
            showToast('Network error', true);
        }
    }


    /* =========================================
       CATEGORIES MANAGEMENT
    ========================================= */
    const categoryForm = document.getElementById('categoryForm');

    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            id: document.getElementById('newCategoryId').value.toLowerCase().replace(/\s+/g, ''),
            label: document.getElementById('newCategoryLabel').value
        };

        try {
            const res = await fetch('/api/data/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (res.ok) {
                showToast('Category Added: ' + payload.label);
                categoryForm.reset();
                loadCategoriesAdmin();
            } else {
                showToast(result.error || 'Failed to add category', true);
            }
        } catch (err) {
            showToast('Network error: ' + err.message, true);
        }
    });

    async function loadCategoriesAdmin() {
        const catList = document.getElementById('adminCategoriesList');
        const galCategory = document.getElementById('galleryCategory');
        const galFilter = document.getElementById('galleryFilter');

        if (catList) catList.innerHTML = '<p>Loading...</p>';

        try {
            const res = await fetch('/api/data/categories');
            const data = await res.json();

            // Populate Management List
            if (catList) {
                catList.innerHTML = '';
                if (!data || data.length === 0) {
                    catList.innerHTML = '<p>No categories found.</p>';
                } else {
                    data.forEach(cat => {
                        const li = document.createElement('li');
                        li.className = 'list-item';
                        li.innerHTML = `
                            <div><strong>${cat.label}</strong> <span style="color:#666; font-size:0.8rem;">(${cat.id})</span></div>
                            <button class="btn btn-danger" style="padding: 5px 10px; font-size: 0.8rem;" onclick="deleteCategory('${cat.id}')">Delete</button>
                        `;
                        catList.appendChild(li);
                    });
                }
            }

            // Populate Gallery Upload Dropdown
            if (galCategory) {
                galCategory.innerHTML = '';
                data.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.id; opt.textContent = cat.label;
                    galCategory.appendChild(opt);
                });
            }

            // Populate Gallery Filter Dropdown
            if (galFilter) {
                // Save current selection to restore it
                const currentVal = galFilter.value;
                galFilter.innerHTML = '<option value="all">All Categories</option>';
                data.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.id; opt.textContent = cat.label;
                    galFilter.appendChild(opt);
                });
                galFilter.value = currentVal;
            }

        } catch (err) {
            if (catList) catList.innerHTML = '<p>Error loading categories.</p>';
        }
    }

    window.deleteCategory = async function (id) {
        if (!confirm('Delete this category? Gallery images in this category will not be deleted.')) return;
        try {
            const res = await fetch(`/api/data/categories/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (res.ok) {
                showToast('Category deleted');
                loadCategoriesAdmin();
            } else {
                showToast(result.error || 'Failed to delete', true);
            }
        } catch (err) {
            showToast('Network error: ' + err.message, true);
        }
    }

    // Call loadCategoriesAdmin on load so hidden filters are ready
    loadCategoriesAdmin();

    /* =========================================
       ABOUT US MANAGEMENT
    ========================================= */
    const aboutForm = document.getElementById('aboutForm');
    const teamContainer = document.getElementById('team-members-container');

    async function loadAboutAdmin() {
        try {
            const res = await fetch('/api/data/settings');
            const data = await res.json();
            const about = data.about || {};

            document.getElementById('aboutHeadline').value = about.headline || '';
            document.getElementById('aboutImageUrl').value = about.imageUrl || '';
            document.getElementById('aboutDescription').value = about.description || '';

            teamContainer.innerHTML = '';
            if (about.team && about.team.length > 0) {
                about.team.forEach((member, index) => {
                    addTeamMember(member);
                });
            }
        } catch (err) {
            showToast('Error loading About data', true);
        }
    }

    window.addTeamMember = function (member = { name: '', role: '', image: '' }) {
        const div = document.createElement('div');
        div.className = 'team-member-edit card';
        div.style.background = 'rgba(255,255,255,0.03)';
        div.style.marginBottom = '15px';
        div.style.padding = '15px';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h4 style="margin:0;">Team Member</h4>
                <button type="button" class="btn btn-danger" style="padding:5px 10px; font-size:0.8rem;" onclick="this.parentElement.parentElement.remove()">Remove</button>
            </div>
            <div class="form-group">
                <label>Name</label>
                <input type="text" class="form-control member-name" value="${member.name}" required>
            </div>
            <div class="form-group">
                <label>Role</label>
                <input type="text" class="form-control member-role" value="${member.role}" required>
            </div>
            <div class="form-group">
                <label>Image URL</label>
                <input type="text" class="form-control member-image" value="${member.image}" required>
            </div>
        `;
        teamContainer.appendChild(div);
    }

    aboutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const team = [];
        const memberDivs = document.querySelectorAll('.team-member-edit');
        memberDivs.forEach(div => {
            team.push({
                name: div.querySelector('.member-name').value,
                role: div.querySelector('.member-role').value,
                image: div.querySelector('.member-image').value
            });
        });

        const aboutPayload = {
            headline: document.getElementById('aboutHeadline').value,
            imageUrl: document.getElementById('aboutImageUrl').value,
            description: document.getElementById('aboutDescription').value,
            team: team
        };

        try {
            // First get all current settings
            const resGet = await fetch('/api/data/settings');
            const currentSettings = await resGet.json();

            // Merge about into settings
            currentSettings.about = aboutPayload;

            const resPost = await fetch('/api/data/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentSettings)
            });

            if (resPost.ok) {
                showToast('About Us content saved successfully');
            } else {
                showToast('Failed to save content', true);
            }
        } catch (err) {
            showToast('Network error', true);
        }
    });


    /* =========================================
       SETTINGS MANAGEMENT
    ========================================= */
    const settingsForm = document.getElementById('settingsForm');

    async function loadSettingsAdmin() {
        try {
            const res = await fetch('/api/data/settings');
            const data = await res.json();

            document.getElementById('setStudioName').value = data.studioName || '';
            document.getElementById('setEmail').value = data.email || '';
            document.getElementById('setOwner').value = data.ownerName || '';
            document.getElementById('setTime').value = data.time || '';
            document.getElementById('setPhone').value = data.phone || '';
            document.getElementById('setAddress').value = data.address || '';

            if (data.socials) {
                document.getElementById('setFb').value = data.socials.facebook || '';
                document.getElementById('setIg').value = data.socials.instagram || '';
                document.getElementById('setWa').value = data.socials.whatsapp || '';
            }
        } catch (err) {
            showToast('Error loading settings', true);
        }
    }

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            // First get current settings to preserve 'about' and other fields
            const resGet = await fetch('/api/data/settings');
            const currentSettings = await resGet.json();

            const updatedSettings = {
                ...currentSettings,
                studioName: document.getElementById('setStudioName').value,
                email: document.getElementById('setEmail').value,
                ownerName: document.getElementById('setOwner').value,
                time: document.getElementById('setTime').value,
                phone: document.getElementById('setPhone').value,
                address: document.getElementById('setAddress').value,
                socials: {
                    facebook: document.getElementById('setFb').value,
                    instagram: document.getElementById('setIg').value,
                    whatsapp: document.getElementById('setWa').value
                }
            };

            const resPost = await fetch('/api/data/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedSettings)
            });

            if (resPost.ok) {
                showToast('Settings Saved successfully');
            } else {
                showToast('Failed to save settings', true);
            }
        } catch (err) {
            showToast('Network error', true);
        }
    });

});
