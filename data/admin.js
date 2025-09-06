document.addEventListener('DOMContentLoaded', () => {
    // --- Variabel Elemen ---
    const loginScreen = document.getElementById('login-screen');
    const productFormScreen = document.getElementById('product-form-screen');
    const toastContainer = document.getElementById('toast-container');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');
    const passwordToggle = document.getElementById('passwordToggle');
    const themeSwitchBtnLogin = document.getElementById('themeSwitchBtnLogin');
    const themeSwitchBtnPanel = document.getElementById('themeSwitchBtnPanel');
    const body = document.body;
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Variabel Produk
    const categorySelect = document.getElementById('category');
    const nameInput = document.getElementById('product-name');
    const priceInput = document.getElementById('product-price');
    const descriptionInput = document.getElementById('product-description');
    const productWhatsappNumberInput = document.getElementById('product-whatsapp-number');
    const scriptMenuSection = document.getElementById('scriptMenuSection');
    const scriptMenuContentInput = document.getElementById('script-menu-content');
    const stockPhotoSection = document.getElementById('stock-photo-section');
    const photosInput = document.getElementById('product-photos');
    const addButton = document.getElementById('add-product-button');
    const manageCategorySelect = document.getElementById('manage-category');
    const manageProductList = document.getElementById('manage-product-list');
    const saveOrderButton = document.getElementById('save-order-button');
    const bulkPriceEditContainer = document.getElementById('bulk-price-edit-container');
    const bulkPriceInput = document.getElementById('bulk-price-input');
    const applyBulkPriceBtn = document.getElementById('apply-bulk-price-btn');
    const resetPricesBtn = document.getElementById('reset-prices-btn');

    // Variabel Modal
    const modals = document.querySelectorAll('.modal');
    const customConfirmModal = document.getElementById('customConfirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    let resolveConfirmPromise;
    
    // Variabel Pengaturan
    const saveSettingsButton = document.getElementById('save-settings-button');
    const globalWhatsappNumberInput = document.getElementById('global-whatsapp-number');
    const categoryWhatsappNumbersContainer = document.getElementById('category-whatsapp-numbers-container');
    const apikeyWhatsappNumberInput = document.getElementById('apikey-whatsapp-number');
    const apiKeyPriceSettingsContainer = document.getElementById('api-key-price-settings-container');
    const addNewPriceTierBtn = document.getElementById('add-new-price-tier-btn');
    const newCategoryNameInput = document.getElementById('new-category-name');
    const newCategoryIconInput = document.getElementById('new-category-icon');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const manageCategoriesList = document.getElementById('manage-categories-list');

    // Variabel Modal Edit
    const editWhatsappNumberInput = document.getElementById('edit-whatsapp-number');

    // Variabel Manajer Domain
    const apiKeyListContainer = document.getElementById('apiKeyListContainer');
    const createApiKeyBtn = document.getElementById('create-apikey-btn');
    const rootDomainListContainer = document.getElementById('rootDomainListContainer');
    const addDomainBtn = document.getElementById('add-domain-btn');
    const permanentKeyCheckbox = document.getElementById('permanent-key');
    const durationSection = document.getElementById('duration-section');
    const showAddApiKeyModalBtn = document.getElementById('show-add-apikey-modal-btn');
    const showAddDomainModalBtn = document.getElementById('show-add-domain-modal-btn');
    const addApiKeyModal = document.getElementById('addApiKeyModal');
    const addDomainModal = document.getElementById('addDomainModal');
    const apiKeySuccessModal = document.getElementById('apiKeySuccessModal');
    const apiKeyDetailsTextarea = document.getElementById('apiKeyDetails');
    const copyApiKeyDetailsBtn = document.getElementById('copyApiKeyDetailsBtn');
    
    // Variabel Form Promo
    const addPromoForm = document.getElementById('addPromoForm');
    const promoCodeInput = document.getElementById('promo-code');
    const promoPercentageInput = document.getElementById('promo-percentage');
    const promoExpiresInput = document.getElementById('promo-expires');
    const promoMaxUsesInput = document.getElementById('promo-max-uses');
    const addPromoBtn = document.getElementById('add-promo-btn');
    const promoListContainer = document.getElementById('promo-list-container');

    // Alamat API
    const API_PRODUCTS_URL = '/api/products';
    const API_CLOUDFLARE_URL = '/api/cloudflare';
    const API_BASE_URL = '/api'; 
    let activeToastTimeout = null;
    let siteSettings = {};
    let allCategories = [];
    
    async function uploadImages(fileList, buttonElement) {
        if (!fileList || fileList.length === 0) {
            return [];
        }
        const uploadPromises = Array.from(fileList).map(file => {
            const formData = new FormData();
            formData.append('image', file);
            return fetch('/api/tourl', {
                method: 'POST',
                body: formData,
            }).then(response => {
                if (!response.ok) {
                    return response.json().then(err => Promise.reject(err));
                }
                return response.json();
            }).then(result => result.link);
        });
        const originalButtonText = buttonElement ? buttonElement.textContent : '';
        try {
            const urls = await Promise.all(uploadPromises.map(async (promise, index) => {
                if (buttonElement) buttonElement.textContent = `Mengunggah ${index + 1} dari ${fileList.length}...`;
                return await promise;
            }));
            if (buttonElement) buttonElement.textContent = originalButtonText;
            return urls;
        } catch (error) {
            if (buttonElement) buttonElement.textContent = originalButtonText;
            throw new Error(error.message || 'Gagal mengunggah salah satu gambar.');
        }
    }

    const savedTheme = localStorage.getItem('admin-theme') || 'light-mode';
    body.className = savedTheme;
    function updateThemeButton() {
        const iconClass = body.classList.contains('dark-mode') ? 'fa-sun' : 'fa-moon';
        if (themeSwitchBtnLogin) themeSwitchBtnLogin.querySelector('i').className = `fas ${iconClass}`;
        if (themeSwitchBtnPanel) themeSwitchBtnPanel.querySelector('i').className = `fas ${iconClass}`;
    }
    updateThemeButton();
    function toggleTheme() {
        body.classList.toggle('light-mode');
        body.classList.toggle('dark-mode');
        localStorage.setItem('admin-theme', body.className);
        updateThemeButton();
    }
    if (themeSwitchBtnLogin) themeSwitchBtnLogin.addEventListener('click', toggleTheme);
    if (themeSwitchBtnPanel) themeSwitchBtnPanel.addEventListener('click', toggleTheme);
    
    if (passwordToggle) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            passwordToggle.querySelector('i').className = `fas ${type === 'password' ? 'fa-eye-slash' : 'fa-eye'}`;
        });
    }

    function showToast(message, type = 'info', duration = 3000) {
        if (activeToastTimeout) clearTimeout(activeToastTimeout);
        toastContainer.innerHTML = '';
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        let iconClass = 'fas fa-info-circle';
        if (type === 'success') iconClass = 'fas fa-check-circle';
        if (type === 'error') iconClass = 'fas fa-exclamation-circle';
        toast.innerHTML = `<i class="${iconClass}"></i> ${message}`;
        toastContainer.appendChild(toast);
        activeToastTimeout = setTimeout(() => {
            toast.classList.add('fade-out');
            toast.addEventListener('animationend', () => toast.remove());
        }, duration);
    }
    
    function openModal(modal) { if(modal) modal.classList.add('is-visible'); }
    function closeModal(modal) { if(modal) modal.classList.remove('is-visible'); }

    modals.forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target.matches('.modal, .close-button')) {
                closeModal(modal);
            }
        });
    });

    if (showAddApiKeyModalBtn) showAddApiKeyModalBtn.addEventListener('click', () => openModal(addApiKeyModal));
    if (showAddDomainModalBtn) showAddDomainModalBtn.addEventListener('click', () => openModal(addDomainModal));

    function showCustomConfirm(message) {
        confirmMessage.innerHTML = message;
        openModal(customConfirmModal);
        return new Promise((resolve) => {
            resolveConfirmPromise = resolve;
        });
    }

    if (confirmOkBtn) {
        confirmOkBtn.addEventListener('click', () => {
            closeModal(customConfirmModal);
            if (resolveConfirmPromise) resolveConfirmPromise(true);
        });
    }

    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => {
            closeModal(customConfirmModal);
            if (resolveConfirmPromise) resolveConfirmPromise(false);
        });
    }
    
    function validatePhoneNumber(number) {
        if (!number) return true;
        const phoneRegex = /^[1-9]\d{7,}$/;
        return phoneRegex.test(number);
    }
    
    async function fetchAdminApi(action, data) {
        const adminPassword = localStorage.getItem('adminPassword');
        if (!adminPassword) {
            showToast('Sesi login tidak valid. Silakan login ulang.', 'error');
            return Promise.reject(new Error('Password admin tidak ditemukan'));
        }
        const response = await fetch(API_CLOUDFLARE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, data, adminPassword })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        return result;
    }
    
    async function loadCategoriesAndSettings() {
        try {
            const productsRes = await fetch(`data/isi_json/products.json?v=${Date.now()}`);
            if (!productsRes.ok) throw new Error('Gagal memuat produk untuk kategori.');
            const productsData = await productsRes.json();
            allCategories = Object.keys(productsData);

            const categoryDropdowns = document.querySelectorAll('#category, #manage-category');
            categoryDropdowns.forEach(dropdown => {
                const currentValue = dropdown.value;
                dropdown.innerHTML = (dropdown.id === 'manage-category') ? '<option value="">-- Pilih Kategori --</option>' : '';
                allCategories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    dropdown.appendChild(option);
                });
                if (allCategories.includes(currentValue)) {
                    dropdown.value = currentValue;
                }
            });

            const settingsRes = await fetch(`data/isi_json/settings.json?v=${Date.now()}`);
            siteSettings = settingsRes.ok ? await settingsRes.json() : {};
            
            if(globalWhatsappNumberInput) globalWhatsappNumberInput.value = siteSettings.globalPhoneNumber || '';
            if(apikeyWhatsappNumberInput) apikeyWhatsappNumberInput.value = siteSettings.apiKeyPurchaseNumber || '';

            if (categoryWhatsappNumbersContainer) {
                categoryWhatsappNumbersContainer.innerHTML = '<h3><i class="fas fa-list-alt"></i> Nomor WA per Kategori (Opsional)</h3>';
                const categoriesInSettings = siteSettings.categoryPhoneNumbers || {};
                allCategories.forEach(cat => {
                    const div = document.createElement('div');
                    div.className = 'category-wa-input';
                    div.innerHTML = `<label for="wa-${cat}">${cat}:</label><input type="text" id="wa-${cat}" data-category="${cat}" value="${categoriesInSettings[cat] || ''}" placeholder="Kosongkan untuk pakai nomor global">`;
                    categoryWhatsappNumbersContainer.appendChild(div);
                });
            }
            if (apiKeyPriceSettingsContainer) renderApiKeyPriceSettings(siteSettings.apiKeyPrices || []);
            if (manageCategoriesList) renderManageCategoryList();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
    
    const handleLogin = async () => {
        const password = passwordInput.value;
        if (!password) return showToast('Password tidak boleh kosong.', 'error');
        loginButton.textContent = 'Memverifikasi...';
        loginButton.disabled = true;
        try {
            const res = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            
            localStorage.setItem('isAdminAuthenticated', 'true');
            localStorage.setItem('adminPassword', password);
            
            loginScreen.style.display = 'none';
            productFormScreen.style.display = 'block';
            showToast('Login berhasil!', 'success');
            await loadCategoriesAndSettings();
            document.querySelector('.tab-button[data-tab="addProduct"]').click();
        } catch (e) {
            showToast(e.message || 'Password salah.', 'error');
        } finally {
            loginButton.textContent = 'Masuk';
            loginButton.disabled = false;
        }
    };
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            showCustomConfirm("Anda yakin ingin keluar?").then(isConfirmed => {
                if (isConfirmed) {
                    localStorage.removeItem('isAdminAuthenticated');
                    localStorage.removeItem('adminPassword');
                    location.reload();
                }
            });
        });
    }

    if (loginButton) loginButton.addEventListener('click', handleLogin);
    if (passwordInput) passwordInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(button.dataset.tab).classList.add('active');
            
            if (button.dataset.tab === 'manageProducts' && manageCategorySelect.value) manageCategorySelect.dispatchEvent(new Event('change'));
            if (button.dataset.tab === 'domainManager') { loadApiKeys(); loadRootDomains(); }
            if (button.dataset.tab === 'settings') await loadCategoriesAndSettings();
            if (button.dataset.tab === 'promo') loadPromoCodes();
        });
    });

    async function loadPromoCodes() {
    promoListContainer.innerHTML = 'Memuat...';
    try {
        // Isi dropdown kategori promo
        const promoCategoriesSelect = document.getElementById('promo-categories');
        promoCategoriesSelect.innerHTML = '';
        allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            promoCategoriesSelect.appendChild(option);
        });

        const res = await fetch(API_PRODUCTS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'promoGetAll' })
        });
        if (!res.ok) throw new Error('Gagal memuat data promo.');
        const promos = await res.json();
        
        promoListContainer.innerHTML = '';
        if (Object.keys(promos).length === 0) {
            promoListContainer.innerHTML = '<p>Belum ada kode promo yang dibuat.</p>';
            return;
        }

        for (const code in promos) {
            const promo = promos[code];
            const expiresDate = new Date(promo.expires);
            const isExpired = expiresDate < new Date();
            const usageText = promo.maxUses === 0 ? `${promo.uses} / ∞ (Tanpa Batas)` : `${promo.uses} / ${promo.maxUses}`;
            const categoriesText = (promo.allowedCategories && promo.allowedCategories.length > 0)
                ? `Hanya untuk: ${promo.allowedCategories.join(', ')}`
                : 'Semua Kategori';

            const item = document.createElement('div');
            item.className = 'delete-item';
            item.innerHTML = `
                <div class="item-header">
                    <span>
                        <strong>${promo.code}</strong> - ${promo.percentage}% 
                        <small style="display:block; color: ${isExpired ? 'var(--error-color)' : 'inherit'}">
                            ${isExpired ? 'Telah Kedaluwarsa' : 'Berlaku hingga ' + expiresDate.toLocaleString('id-ID')}
                        </small>
                        <small style="display:block;">Penggunaan: ${usageText}</small>
                        <small style="display:block; font-style: italic;">${categoriesText}</small>
                    </span>
                    <div class="item-actions">
                        <button type="button" class="delete-btn delete-promo-btn" data-code="${promo.code}"><i class="fas fa-trash-alt"></i> Hapus</button>
                    </div>
                </div>
            `;
            promoListContainer.appendChild(item);
        }
    } catch (err) {
        promoListContainer.innerHTML = `<p style="color:red;">${err.message}</p>`;
    }
}

    if (addPromoBtn) {
        addPromoBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const selectedCategories = Array.from(document.getElementById('promo-categories').selectedOptions).map(opt => opt.value);

    const promoData = {
        code: promoCodeInput.value.trim().toUpperCase(),
        percentage: parseInt(promoPercentageInput.value, 10),
        expires: new Date(promoExpiresInput.value).toISOString(),
        maxUses: parseInt(promoMaxUsesInput.value, 10),
        allowedCategories: selectedCategories
    };

    if (!promoData.code || isNaN(promoData.percentage) || !promoExpiresInput.value || isNaN(promoData.maxUses) || promoData.maxUses < 0) {
        return showToast('Semua kolom wajib diisi dengan benar.', 'error');
    }

            addPromoBtn.disabled = true;
            addPromoBtn.textContent = 'Menambahkan...';
            try {
                const res = await fetch(API_PRODUCTS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'promoAdd', data: promoData })
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.message);

                showToast(result.message, 'success');
                addPromoForm.reset();
                loadPromoCodes();
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                addPromoBtn.disabled = false;
                addPromoBtn.textContent = 'Tambah Kode Promo';
            }
        });
    }
    
    async function saveAllSettings(updatedSettings) {
        saveSettingsButton.disabled = true;
        saveSettingsButton.textContent = 'Menyimpan...';
        try {
            const res = await fetch(API_PRODUCTS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({ action: 'updateSettings', data: updatedSettings })
            });
            const result = await res.json();
            if(!res.ok) throw new Error(result.message);
            showToast('Pengaturan berhasil disimpan!', 'success');
            siteSettings = updatedSettings;
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            saveSettingsButton.disabled = false;
            saveSettingsButton.textContent = 'Simpan Semua Pengaturan';
        }
    }
    
    async function addCategoryLogic() {
        const categoryName = newCategoryNameInput.value.trim();
        if (!categoryName) return showToast('Nama kategori tidak boleh kosong.', 'error');

        addCategoryBtn.disabled = true;
        addCategoryBtn.textContent = "Menambah...";

        try {
            const resProd = await fetch(API_PRODUCTS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addCategory', data: { categoryName } })
            });
            const resultProd = await resProd.json();
            if(!resProd.ok) throw new Error(resultProd.message);

            await loadCategoriesAndSettings();

            if (newCategoryIconInput.files.length > 0) {
                const uploadedUrls = await uploadImages(newCategoryIconInput.files, addCategoryBtn);
                if (uploadedUrls.length > 0) {
                    const iconUrl = uploadedUrls[0];
                    if (!siteSettings.categoryMetadata) {
                        siteSettings.categoryMetadata = {};
                    }
                    siteSettings.categoryMetadata[categoryName] = { icon: iconUrl };
                    await saveAllSettings(siteSettings);
                }
            } else {
                 if (!siteSettings.categoryMetadata) {
                    siteSettings.categoryMetadata = {};
                }
                siteSettings.categoryMetadata[categoryName] = { icon: "" }; 
                await saveAllSettings(siteSettings);
            }

            showToast(resultProd.message, 'success');
            newCategoryNameInput.value = '';
            newCategoryIconInput.value = '';
            await loadCategoriesAndSettings();

        } catch (err) {
            showToast(err.message || 'Gagal menambah kategori.', 'error');
        } finally {
            addCategoryBtn.disabled = false;
            addCategoryBtn.textContent = "Tambah Kategori";
        }
    }
    
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', addCategoryLogic);
    
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            const category = categorySelect.value;
            const photoCategories = ['Stock Akun', 'Logo'];
            stockPhotoSection.style.display = photoCategories.includes(category) ? 'block' : 'none';
            scriptMenuSection.style.display = category === 'Script' ? 'block' : 'none';
        });
    }
    
    if (addButton) {
        addButton.addEventListener('click', async (e) => { 
            e.preventDefault();
            addButton.disabled = true;
            try {
                const imageUrls = await uploadImages(photosInput.files, addButton);
                const waNumber = productWhatsappNumberInput.value.trim();
                if (waNumber && !validatePhoneNumber(waNumber)) {
                    throw new Error("Format Nomor WA salah. Harus diawali kode negara (contoh: 628...)");
                }
                const productData = {
                    category: categorySelect.value,
                    nama: nameInput.value.trim(),
                    harga: parseInt(priceInput.value, 10),
                    deskripsiPanjang: descriptionInput.value.trim(),
                    images: imageUrls,
                    nomorWA: waNumber,
                    menuContent: scriptMenuContentInput.value.trim()
                };

                if (!productData.category || !productData.nama || isNaN(productData.harga) || productData.harga < 0 || !productData.deskripsiPanjang) {
                    throw new Error('Kategori, Nama, Harga, dan Deskripsi wajib diisi.');
                }

                addButton.textContent = 'Menyimpan Produk...';
                const res = await fetch(API_PRODUCTS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'addProduct', data: productData })
                });
                const result = await res.json();
                if(!res.ok) throw new Error(result.message);

                showToast(`Produk "${productData.nama}" berhasil ditambahkan.`, 'success');
                document.getElementById('addProductForm').reset();
                categorySelect.dispatchEvent(new Event('change'));

            } catch (err) {
                showToast(err.message || 'Gagal menambahkan produk.', 'error');
            } finally {
                addButton.textContent = 'Tambah Produk';
                addButton.disabled = false;
            }
        });
    }

    if (manageCategorySelect) {
        manageCategorySelect.addEventListener('change', async () => {
            manageProductList.innerHTML = 'Memuat...';
            const category = manageCategorySelect.value;
            if (!category) {
                manageProductList.innerHTML = '<p>Pilih kategori untuk mengelola produk.</p>';
                if (saveOrderButton) saveOrderButton.style.display = 'none';
                if (bulkPriceEditContainer) bulkPriceEditContainer.style.display = 'none';
                return;
            }
            try {
                const res = await fetch(`data/isi_json/products.json?v=${new Date().getTime()}`);
                if (!res.ok) throw new Error(`Gagal memuat produk: ${res.status}`);
                const data = await res.json(); 
                const productsInCat = data[category] || [];
                if (productsInCat.length === 0) {
                    manageProductList.innerHTML = '<p>Tidak ada produk di kategori ini.</p>';
                    if (saveOrderButton) saveOrderButton.style.display = 'none';
                    if (bulkPriceEditContainer) bulkPriceEditContainer.style.display = 'none';
                    return;
                }
                renderManageList(productsInCat, category);
                if (saveOrderButton) saveOrderButton.style.display = 'block';
                if (bulkPriceEditContainer) bulkPriceEditContainer.style.display = 'flex'; 
            } catch (err) {
                showToast(err.message, 'error');
                manageProductList.innerHTML = `<p style="color:red;">${err.message}</p>`;
            }
        });
    }

    function renderManageList(productsToRender, category) {
        manageProductList.innerHTML = '';
        productsToRender.forEach(prod => {
            const isNew = prod.createdAt && Date.now() - new Date(prod.createdAt).getTime() < 24 * 60 * 60 * 1000;
            const item = document.createElement('div');
            item.className = 'delete-item';
            item.setAttribute('draggable', 'true');
            item.dataset.id = prod.id;
            let priceDisplay = `<span>${formatRupiah(prod.harga)}</span>`;
            if (prod.hargaAsli && prod.hargaAsli > prod.harga) {
                priceDisplay = `<span class="original-price"><del>${formatRupiah(prod.hargaAsli)}</del></span> <span class="discounted-price">${formatRupiah(prod.harga)}</span>`;
            } else if (prod.hargaAsli) {
                priceDisplay = `<span>${formatRupiah(prod.hargaAsli)}</span>`;
            }
            item.innerHTML = `
                <div class="item-header">
                    <span>${prod.nama} - ${priceDisplay} ${isNew ? '<span class="new-badge">NEW</span>' : ''}</span>
                    <div class="item-actions">
                        <button type="button" class="edit-btn" data-id="${prod.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button type="button" class="delete-btn delete-product-btn" data-id="${prod.id}"><i class="fas fa-trash-alt"></i> Hapus</button>
                    </div>
                </div>`;
            manageProductList.appendChild(item);
        });
        setupManageActions(category, productsToRender);
    }
    
    function formatRupiah(number) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    }

    function setupManageActions(category, productsInCat) {
        const editModal = document.getElementById('editProductModal');
        const closeEditModalBtn = document.getElementById('closeEditModal');
        const editModalTitle = document.getElementById('editModalTitle');
        const saveEditBtn = document.getElementById('save-edit-btn');
        const editProductId = document.getElementById('edit-product-id');
        const editProductCategory = document.getElementById('edit-product-category');
        const editNameInput = document.getElementById('edit-name');
        const editPriceInput = document.getElementById('edit-price');
        const editDiscountPriceInput = document.getElementById('edit-discount-price');
        const editDiscountDateInput = document.getElementById('edit-discount-date');
        const editDescInput = document.getElementById('edit-desc');
        const editPhotoSection = document.getElementById('edit-photo-section');
        const editPhotoGrid = document.getElementById('edit-photo-grid');
        const addPhotoInput = document.getElementById('add-photo-input');
        const addPhotoBtn = document.getElementById('add-photo-btn');
        const editScriptMenuSection = document.getElementById('edit-script-menu-section');
        const editScriptMenuContent = document.getElementById('edit-script-menu-content');
        
        manageProductList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.id);
                const product = productsInCat.find(p => p.id === productId);
                if (!product) return showToast('Produk tidak ditemukan.', 'error');
                
                editProductId.value = product.id;
                editProductCategory.value = category;
                editModalTitle.innerHTML = `<i class="fas fa-edit"></i> Edit Produk: ${product.nama}`;
                editNameInput.value = product.nama;
                editPriceInput.value = product.hargaAsli || product.harga;
                editDiscountPriceInput.value = product.discountPrice || '';
                editDiscountDateInput.value = product.discountEndDate ? product.discountEndDate.slice(0, 16) : '';
                editDescInput.value = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/ \|\| /g, '\n') : '';
                editWhatsappNumberInput.value = product.nomorWA || '';
                
                const photoCategories = ['Stock Akun', 'Logo'];
                editPhotoSection.style.display = photoCategories.includes(category) ? 'block' : 'none';
                if (photoCategories.includes(category)) {
                    editPhotoGrid.innerHTML = '';
                    (product.images || []).forEach(img => {
                        const photoItem = document.createElement('div');
                        photoItem.className = 'photo-item';
                        photoItem.innerHTML = `<img src="${img}" alt="Product Photo"><button type="button" class="delete-photo-btn"><i class="fas fa-times"></i></button>`;
                        editPhotoGrid.appendChild(photoItem);
                        photoItem.querySelector('.delete-photo-btn').addEventListener('click', (e_photo) => e_photo.currentTarget.closest('.photo-item').remove());
                    });
                }
                
                editScriptMenuSection.style.display = category === 'Script' ? 'block' : 'none';
                if (category === 'Script') {
                    editScriptMenuContent.value = product.menuContent || '';
                }
                
                openModal(editModal);
            });
        });

        if(closeEditModalBtn) closeEditModalBtn.addEventListener('click', () => closeModal(editModal));
        
        if(addPhotoBtn) {
            addPhotoBtn.addEventListener('click', async (e) => {
                 const button = e.currentTarget;
                 button.disabled = true;
                 try {
                    const newImageUrls = await uploadImages(addPhotoInput.files, button);
                    newImageUrls.forEach(imgUrl => {
                         const photoItem = document.createElement('div');
                         photoItem.className = 'photo-item';
                         photoItem.innerHTML = `<img src="${imgUrl}" alt="Product Photo"><button type="button" class="delete-photo-btn"><i class="fas fa-times"></i></button>`;
                         editPhotoGrid.appendChild(photoItem);
                         photoItem.querySelector('.delete-photo-btn').addEventListener('click', (e_photo) => e_photo.currentTarget.closest('.photo-item').remove());
                    });
                    addPhotoInput.value = '';
                 } catch(err) {
                    showToast(err.message || 'Gagal mengunggah foto.', 'error');
                 } finally {
                    button.disabled = false;
                 }
            });
        }

        if(saveEditBtn) {
            saveEditBtn.addEventListener('click', async () => {
                const newWaNumber = editWhatsappNumberInput.value.trim();
                if (newWaNumber && !validatePhoneNumber(newWaNumber)) {
                    return showToast("Format Nomor WA salah. Harus diawali kode negara (contoh: 628...)", 'error');
                }
                const hargaAsli = parseInt(editPriceInput.value, 10);
                const discountPrice = editDiscountPriceInput.value ? parseInt(editDiscountPriceInput.value, 10) : null;
                const discountEndDate = editDiscountDateInput.value ? new Date(editDiscountDateInput.value).toISOString() : null;
                let harga = hargaAsli;
                if (discountPrice !== null && discountPrice > 0 && discountEndDate && new Date(discountEndDate) > new Date()) {
                    harga = discountPrice;
                }
                const productData = {
                    id: parseInt(editProductId.value),
                    category: editProductCategory.value,
                    nama: editNameInput.value.trim(),
                    hargaAsli,
                    harga,
                    discountPrice,
                    discountEndDate,
                    deskripsiPanjang: editDescInput.value.trim().replace(/\n/g, ' || '),
                    images: [...editPhotoGrid.querySelectorAll('.photo-item img')].map(img => img.src),
                    menuContent: editScriptMenuContent.value.trim(),
                    nomorWA: newWaNumber
                };
                if (isNaN(productData.hargaAsli) || productData.hargaAsli < 0 || !productData.nama || !productData.deskripsiPanjang) {
                    return showToast('Data tidak valid (Nama, Harga Asli, Deskripsi harus diisi).', 'error');
                }
                saveEditBtn.textContent = 'Menyimpan...';
                saveEditBtn.disabled = true;
                try {
                    const res = await fetch(API_PRODUCTS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'updateProduct', data: productData })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message);
                    showToast('Produk berhasil diperbarui.', 'success');
                    closeModal(editModal);
                    manageCategorySelect.dispatchEvent(new Event('change'));
                } catch (err) {
                    showToast(err.message, 'error');
                } finally {
                    saveEditBtn.textContent = 'Simpan Perubahan';
                    saveEditBtn.disabled = false;
                }
            });
        }
        
        let draggingItem = null;
        if (manageProductList) {
            manageProductList.addEventListener('dragstart', (e) => {
                draggingItem = e.target;
                setTimeout(() => draggingItem.classList.add('dragging'), 0);
            });
            manageProductList.addEventListener('dragend', (e) => {
                if (draggingItem) {
                    draggingItem.classList.remove('dragging');
                    draggingItem = null;
                }
            });
            manageProductList.addEventListener('dragover', (e) => {
                e.preventDefault(); 
                const afterElement = getDragAfterElement(manageProductList, e.clientY);
                const draggable = document.querySelector('.dragging');
                if (draggable) {
                     if (afterElement == null) manageProductList.appendChild(draggable);
                     else manageProductList.insertBefore(draggable, afterElement);
                }
            });
        }

        if (saveOrderButton) {
            saveOrderButton.addEventListener('click', async () => {
                const newOrder = [...manageProductList.children].map(item => parseInt(item.dataset.id));
                const category = manageCategorySelect.value;
                if (!category || newOrder.length === 0) return;
                saveOrderButton.disabled = true;
                try {
                    const res = await fetch(API_PRODUCTS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'reorderProducts', data: { category, order: newOrder } })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message);
                    showToast('Urutan berhasil disimpan.', 'success');
                } catch (err) {
                    showToast(err.message, 'error');
                } finally {
                    saveOrderButton.disabled = false;
                }
            });
        }

        if (applyBulkPriceBtn) {
            applyBulkPriceBtn.addEventListener('click', async () => {
                const category = manageCategorySelect.value;
                const newBulkPrice = parseInt(bulkPriceInput.value, 10);
                if (!category || isNaN(newBulkPrice)) return;
                if (!(await showCustomConfirm(`Yakin mengubah harga SEMUA produk di "<b>${category}</b>" menjadi <b>${formatRupiah(newBulkPrice)}</b>?`))) return;
                applyBulkPriceBtn.disabled = true;
                try {
                    const res = await fetch(API_PRODUCTS_URL, { 
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'updateProductsInCategory', data: { category, newPrice: newBulkPrice } })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message);
                    showToast(result.message, 'success');
                    bulkPriceInput.value = ''; 
                    manageCategorySelect.dispatchEvent(new Event('change')); 
                } catch (err) {
                    showToast(`Gagal: ${err.message}`, 'error');
                } finally {
                    applyBulkPriceBtn.disabled = false;
                }
            });
        }
        
        if (resetPricesBtn) {
            resetPricesBtn.addEventListener('click', async () => {
                const category = manageCategorySelect.value;
                if (!category) return;
                if (!(await showCustomConfirm(`Yakin mengembalikan harga SEMUA produk di "<b>${category}</b>" ke harga awal?`))) return;
                resetPricesBtn.disabled = true;
                try {
                    const res = await fetch(API_PRODUCTS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'resetCategoryPrices', data: { category } })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message);
                    showToast(result.message, 'success');
                    manageCategorySelect.dispatchEvent(new Event('change'));
                } catch (err) {
                    showToast(`Gagal: ${err.message}`, 'error');
                } finally {
                    resetPricesBtn.disabled = false;
                }
            });
        }
    }
    
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.delete-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    function renderApiKeyPriceSettings(prices) {
        if (!apiKeyPriceSettingsContainer) return;
        apiKeyPriceSettingsContainer.innerHTML = '';
        if (!prices || prices.length === 0) {
             apiKeyPriceSettingsContainer.innerHTML = '<p>Belum ada tingkatan harga. Klik tombol di bawah untuk menambahkan.</p>';
             return;
        }
        prices.forEach((price) => {
            const div = document.createElement('div');
            div.className = 'price-tier-item'; 
            div.innerHTML = `
                <input type="text" class="tier-name" placeholder="Nama Paket (e.g., 7 Hari)" value="${price.tier || ''}">
                <input type="number" class="tier-price" placeholder="Harga Asli (e.g., 10000)" value="${price.price || ''}">
                <input type="number" class="tier-discount-price" placeholder="Harga Diskon (Opsional)" value="${price.discountPrice || ''}">
                <input type="datetime-local" class="tier-discount-date" value="${price.discountEndDate ? price.discountEndDate.slice(0, 16) : ''}">
                <button type="button" class="delete-tier-btn">&times;</button>
            `;
            apiKeyPriceSettingsContainer.appendChild(div);
        });
    
        apiKeyPriceSettingsContainer.querySelectorAll('.delete-tier-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.parentElement.remove();
                if (apiKeyPriceSettingsContainer.children.length === 0) {
                    apiKeyPriceSettingsContainer.innerHTML = '<p>Belum ada tingkatan harga. Klik tombol di bawah untuk menambahkan.</p>';
                }
                showToast('Paket harga dihapus. Klik "Simpan" untuk konfirmasi.', 'info');
            });
        });
    }

    if (addNewPriceTierBtn) {
        addNewPriceTierBtn.addEventListener('click', () => {
            if(apiKeyPriceSettingsContainer.querySelector('p')) {
                apiKeyPriceSettingsContainer.innerHTML = ''; 
            }
            const currentPrices = collectApiKeyPrices();
            renderApiKeyPriceSettings([...currentPrices, {}]); 
        });
    }

    function collectApiKeyPrices() {
        const prices = [];
        apiKeyPriceSettingsContainer.querySelectorAll('.price-tier-item').forEach(item => {
            const tier = item.querySelector('.tier-name').value.trim();
            const price = parseInt(item.querySelector('.tier-price').value, 10);
            const discountPrice = item.querySelector('.tier-discount-price').value ? parseInt(item.querySelector('.tier-discount-price').value, 10) : null;
            const discountEndDate = item.querySelector('.tier-discount-date').value ? new Date(item.querySelector('.tier-discount-date').value).toISOString() : null;
            
            if (tier && !isNaN(price) && price > 0) {
                prices.push({ tier, price, discountPrice, discountEndDate });
            }
        });
        return prices;
    }

    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', async () => {
            const globalNumber = globalWhatsappNumberInput.value.trim();
            const apiKeyNumber = apikeyWhatsappNumberInput.value.trim();

            if (!validatePhoneNumber(globalNumber) || !globalNumber) return showToast("Nomor WA Global wajib diisi dengan format kode negara (contoh: 628...)", 'error');
            if (apiKeyNumber && !validatePhoneNumber(apiKeyNumber)) return showToast("Format Nomor WA API Key salah.", 'error');

            const categoryNumbers = {};
            let isCategoryValid = true;
            categoryWhatsappNumbersContainer.querySelectorAll('input[data-category]').forEach(input => {
                const num = input.value.trim();
                if (num && !validatePhoneNumber(num)) {
                    showToast(`Format Nomor WA kategori ${input.dataset.category} salah.`, 'error');
                    isCategoryValid = false;
                }
                categoryNumbers[input.dataset.category] = num;
            });
            if (!isCategoryValid) return;

            const apiKeyPrices = collectApiKeyPrices();
            if (apiKeyPriceSettingsContainer.querySelectorAll('.price-tier-item').length > apiKeyPrices.length) {
                 return showToast('Pastikan semua Nama Paket dan Harga Asli pada tingkatan harga API Key terisi dengan benar.', 'error');
            }
            
            const settingsData = {
                ...siteSettings,
                globalPhoneNumber: globalNumber,
                categoryPhoneNumbers: categoryNumbers,
                apiKeyPurchaseNumber: apiKeyNumber,
                apiKeyPrices: apiKeyPrices,
                categoryMetadata: siteSettings.categoryMetadata || {}
            };

            await saveAllSettings(settingsData);
        });
    }

    function renderManageCategoryList() {
        if (!manageCategoriesList) return;
        manageCategoriesList.innerHTML = '';
        const metadata = siteSettings.categoryMetadata || {};
        if (allCategories.length > 0) {
            allCategories.forEach(cat => {
                const iconUrl = metadata[cat]?.icon || 'https://via.placeholder.com/40';
                const item = document.createElement('div');
                item.className = 'delete-item';
                item.innerHTML = `
                    <div class="item-header">
                        <img src="${iconUrl}" class="category-icon-preview" alt="Ikon">
                        <span>${cat}</span>
                        <div class="item-actions">
                            <button type="button" class="delete-btn delete-category-btn" data-category="${cat}"><i class="fas fa-trash-alt"></i> Hapus</button>
                        </div>
                    </div>`;
                manageCategoriesList.appendChild(item);
            });
        } else {
            manageCategoriesList.innerHTML = '<p>Belum ada kategori.</p>';
        }
    }
    
    if (permanentKeyCheckbox) {
        permanentKeyCheckbox.addEventListener('change', (e) => {
            durationSection.style.display = e.target.checked ? 'none' : 'block';
        });
    }

    async function loadApiKeys() {
        if (!apiKeyListContainer) return;
        apiKeyListContainer.innerHTML = 'Memuat...';
        try {
            const keys = await fetchAdminApi('getApiKeys', {});
            let html = '';
            if (Object.keys(keys).length === 0) {
                html = '<p>Belum ada API Key.</p>';
            } else {
                for (const key in keys) {
                    const keyData = keys[key];
                    const expires = keyData.expires_at === 'permanent' ? 'Permanen' : new Date(keyData.expires_at).toLocaleString('id-ID');
                    html += `
                        <div class="delete-item">
                            <div class="item-header">
                                <span><strong>${key}</strong><br><small>Kadaluwarsa: ${expires}</small></span>
                                <div class="item-actions">
                                    <button type="button" class="delete-btn delete-apikey-btn" data-key="${key}">Hapus</button>
                                </div>
                            </div>
                        </div>`;
                }
            }
            apiKeyListContainer.innerHTML = html;
        } catch (err) {
            apiKeyListContainer.innerHTML = `<p style="color: red;">Gagal memuat: ${err.message}</p>`;
        }
    }

    async function loadRootDomains() {
        if (!rootDomainListContainer) return;
        rootDomainListContainer.innerHTML = 'Memuat...';
        try {
            const domains = await fetchAdminApi('getRootDomainsAdmin', {});
            let html = '';
            if (Object.keys(domains).length === 0) {
                html = '<p>Belum ada Domain Utama.</p>';
            } else {
                for (const domain in domains) {
                    html += `
                        <div class="delete-item">
                             <div class="item-header">
                                <span><strong>${domain}</strong></span>
                                <div class="item-actions">
                                    <button type="button" class="delete-btn delete-domain-btn" data-domain="${domain}">Hapus</button>
                                </div>
                            </div>
                        </div>`;
                }
            }
            rootDomainListContainer.innerHTML = html;
        } catch (err) {
            rootDomainListContainer.innerHTML = `<p style="color: red;">Gagal memuat: ${err.message}</p>`;
        }
    }
    
    if (createApiKeyBtn) {
        createApiKeyBtn.addEventListener('click', async () => {
            const key = document.getElementById('new-apikey-name').value.trim();
            const duration = parseInt(document.getElementById('new-apikey-duration').value, 10);
            const unit = document.getElementById('new-apikey-unit').value;
            const isPermanent = permanentKeyCheckbox.checked;

            if (!key || (!isPermanent && (isNaN(duration) || duration <= 0))) {
                return showToast('Nama Key dan Durasi harus valid.', 'error');
            }
            createApiKeyBtn.textContent = 'Membuat...';
            createApiKeyBtn.disabled = true;
            try {
                const result = await fetchAdminApi('createApiKey', { key, duration, unit, isPermanent });
                showToast(result.message, 'success');
                document.getElementById('addApiKeyForm').reset();
                loadApiKeys();
                closeModal(addApiKeyModal);
                if (result.details && typeof result.details === 'object') {
                    const keyData = result.details;
                    const createdAt = new Date(keyData.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
                    const expiresAt = keyData.expires_at === 'permanent' ? 'Permanen' : new Date(keyData.expires_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
                    const detailsText = `✨ API Key Telah Dibuat! ✨\n-------------------------\n🔑 Kunci API   : ${key}\n🗓️ Dibuat Pada : ${createdAt}\n⏳ Kedaluwarsa : ${expiresAt}\n-------------------------\nHarap simpan dan berikan kunci ini kepada pengguna.`;
                    apiKeyDetailsTextarea.value = detailsText;
                    openModal(apiKeySuccessModal);
                }
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                createApiKeyBtn.textContent = 'Buat API Key';
                createApiKeyBtn.disabled = false;
            }
        });
    }

    if (copyApiKeyDetailsBtn) {
        copyApiKeyDetailsBtn.addEventListener('click', () => {
            apiKeyDetailsTextarea.select();
            apiKeyDetailsTextarea.setSelectionRange(0, 99999);
            try {
                navigator.clipboard.writeText(apiKeyDetailsTextarea.value);
                showToast('Detail berhasil disalin!', 'success');
            } catch (err) {
                showToast('Gagal menyalin. Coba salin manual.', 'error');
            }
        });
    }

    if (addDomainBtn) {
        addDomainBtn.addEventListener('click', async () => {
            const domain = document.getElementById('new-domain-name').value.trim();
            const zone = document.getElementById('new-domain-zone').value.trim();
            const apitoken = document.getElementById('new-domain-token').value.trim();
            if (!domain || !zone || !apitoken) {
                return showToast('Semua kolom domain wajib diisi.', 'error');
            }
            addDomainBtn.textContent = 'Menambah...';
            addDomainBtn.disabled = true;
            try {
                const result = await fetchAdminApi('addRootDomain', { domain, zone, apitoken });
                showToast(result.message, 'success');
                document.getElementById('addDomainForm').reset();
                loadRootDomains();
                closeModal(addDomainModal);
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                addDomainBtn.textContent = 'Tambah Domain';
                addDomainBtn.disabled = false;
            }
        });
    }

    document.body.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (!deleteBtn) return;

        if (deleteBtn.classList.contains('delete-promo-btn')) {
            const code = deleteBtn.dataset.code;
            const confirm = await showCustomConfirm(`Yakin ingin menghapus kode promo <strong>${code}</strong> secara permanen?`);
            if (confirm) {
                try {
                     const res = await fetch(API_PRODUCTS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'promoDelete', data: { code } })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message);
                    showToast(result.message, 'success');
                    loadPromoCodes();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        }
        else if (deleteBtn.classList.contains('delete-product-btn')) {
            const parent = deleteBtn.closest('.delete-item');
            const id = parseInt(parent.dataset.id);
            const category = manageCategorySelect.value;
            const confirm = await showCustomConfirm(`Yakin ingin menghapus produk <b>${parent.querySelector('span').textContent.split(' - ')[0]}</b>?`);
            if (confirm) {
                try {
                    const res = await fetch(API_PRODUCTS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'deleteProduct', data: { id, category } })
                    });
                    const result = await res.json();
                    if(!res.ok) throw new Error(result.message);
                    parent.remove();
                    showToast(result.message, 'success');
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        } else if (deleteBtn.classList.contains('delete-category-btn')) {
            const category = deleteBtn.dataset.category;
            const confirm = await showCustomConfirm(`Yakin menghapus kategori "<b>${category}</b>"?<br><br><b>PERINGATAN:</b> Semua produk di dalam kategori ini akan ikut terhapus secara permanen!`);
            if (confirm) {
                try {
                    const res = await fetch(API_PRODUCTS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'deleteCategory', data: { categoryName: category } })
                    });
                    const result = await res.json();
                    if(!res.ok) throw new Error(result.message);
                    
                    if (siteSettings.categoryMetadata && siteSettings.categoryMetadata[category]) {
                        delete siteSettings.categoryMetadata[category];
                        await saveAllSettings(siteSettings);
                    }
                    
                    showToast(result.message, 'success');
                    if (manageCategorySelect.value === category) {
                        manageCategorySelect.value = '';
                        manageCategorySelect.dispatchEvent(new Event('change'));
                    }
                    await loadCategoriesAndSettings();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        } else if (deleteBtn.classList.contains('delete-apikey-btn')) {
            const key = deleteBtn.dataset.key;
            if (await showCustomConfirm(`Yakin menghapus API Key "<b>${key}</b>"?`)) {
                try {
                    const result = await fetchAdminApi('deleteApiKey', { key });
                    showToast(result.message, 'success');
                    loadApiKeys();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        } else if (deleteBtn.classList.contains('delete-domain-btn')) {
            const domain = deleteBtn.dataset.domain;
            if (await showCustomConfirm(`Yakin menghapus Domain "<b>${domain}</b>"?`)) {
                 try {
                    const result = await fetchAdminApi('deleteRootDomain', { domain });
                    showToast(result.message, 'success');
                    loadRootDomains();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        }
    });

    if (localStorage.getItem('isAdminAuthenticated')) {
        loginScreen.style.display = 'none';
        productFormScreen.style.display = 'block';
        loadCategoriesAndSettings();
        document.querySelector('.tab-button[data-tab="addProduct"]').click();
    }
});