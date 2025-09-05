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


    // --- FUNGSI DASAR (Tema, Toast, Konfirmasi, Modal, Validasi) ---
    const savedTheme = localStorage.getItem('admin-theme') || 'light-mode';
    body.className = savedTheme;
    function updateThemeButton() {
        const iconClass = body.classList.contains('dark-mode') ? 'fa-sun' : 'fa-moon';
        themeSwitchBtnLogin.querySelector('i').className = `fas ${iconClass}`;
        if (themeSwitchBtnPanel) {
            themeSwitchBtnPanel.querySelector('i').className = `fas ${iconClass}`;
        }
    }
    updateThemeButton();

    function toggleTheme() {
        body.classList.toggle('light-mode');
        body.classList.toggle('dark-mode');
        localStorage.setItem('admin-theme', body.className);
        updateThemeButton();
    }
    themeSwitchBtnLogin.addEventListener('click', toggleTheme);
    if (themeSwitchBtnPanel) themeSwitchBtnPanel.addEventListener('click', toggleTheme);
    
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        passwordToggle.querySelector('i').className = `fas ${type === 'password' ? 'fa-eye-slash' : 'fa-eye'}`;
    });

    function showToast(message, type = 'info', duration = 3000) {
        if (toastContainer.firstChild) {
            clearTimeout(activeToastTimeout);
            toastContainer.innerHTML = '';
        }
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
            if (e.target.classList.contains('modal') || e.target.classList.contains('close-button')) {
                closeModal(modal);
            }
        });
    });

    showAddApiKeyModalBtn.addEventListener('click', () => openModal(addApiKeyModal));
    showAddDomainModalBtn.addEventListener('click', () => openModal(addDomainModal));

    function showCustomConfirm(message) {
        confirmMessage.innerHTML = message;
        openModal(customConfirmModal);
        return new Promise((resolve) => {
            resolveConfirmPromise = resolve;
        });
    }

    confirmOkBtn.addEventListener('click', () => {
        closeModal(customConfirmModal);
        if (resolveConfirmPromise) resolveConfirmPromise(true);
    });

    confirmCancelBtn.addEventListener('click', () => {
        closeModal(customConfirmModal);
        if (resolveConfirmPromise) resolveConfirmPromise(false);
    });
    
    function validatePhoneNumber(number) {
        if (!number) return true;
        const phoneRegex = /^[1-9]\d{7,}$/;
        return phoneRegex.test(number);
    }
    
    async function fetchAdminApi(action, data) {
        const adminPassword = sessionStorage.getItem('adminPassword');
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
            if (!settingsRes.ok) {
                console.warn('File settings.json tidak ditemukan, akan menggunakan data default.');
                siteSettings = {}; 
            } else {
                siteSettings = await settingsRes.json();
            }
            
            globalWhatsappNumberInput.value = siteSettings.globalPhoneNumber || '';
            apikeyWhatsappNumberInput.value = siteSettings.apiKeyPurchaseNumber || '';

            categoryWhatsappNumbersContainer.innerHTML = '<h3><i class="fas fa-list-alt"></i> Nomor WA per Kategori (Opsional)</h3>';
            const categoriesInSettings = siteSettings.categoryPhoneNumbers || {};
            allCategories.forEach(cat => {
                const div = document.createElement('div');
                div.className = 'category-wa-input';
                div.innerHTML = `
                    <label for="wa-${cat}">${cat}:</label>
                    <input type="text" id="wa-${cat}" data-category="${cat}" value="${categoriesInSettings[cat] || ''}" placeholder="Kosongkan untuk pakai nomor global">`;
                categoryWhatsappNumbersContainer.appendChild(div);
            });
            
            renderApiKeyPriceSettings(siteSettings.apiKeyPrices || []);
            renderManageCategoryList();

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
            
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            sessionStorage.setItem('adminPassword', password);
            
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
    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(button.dataset.tab).classList.add('active');
            
            if (button.dataset.tab === 'manageProducts' && manageCategorySelect.value) {
                manageCategorySelect.dispatchEvent(new Event('change'));
            }
            if (button.dataset.tab === 'domainManager') { 
                loadApiKeys(); 
                loadRootDomains(); 
            }
            if (button.dataset.tab === 'settings') {
                await loadCategoriesAndSettings();
            }
            if (button.dataset.tab === 'promo') {
                loadPromoCodes();
            }
        });
    });

    async function loadPromoCodes() {
        promoListContainer.innerHTML = 'Memuat...';
        try {
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

    addPromoBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const promoData = {
            code: promoCodeInput.value.trim().toUpperCase(),
            percentage: parseInt(promoPercentageInput.value, 10),
            expires: new Date(promoExpiresInput.value).toISOString(),
            maxUses: parseInt(promoMaxUsesInput.value, 10)
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
    
    async function saveAllSettings(updatedSettings) {
        saveSettingsButton.disabled = true;
        saveSettingsButton.textContent = 'Menyimpan...';
        try {
            const res = await fetch(API_PRODUCTS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'updateSettings',
                    data: updatedSettings
                })
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
    
    addCategoryBtn.addEventListener('click', addCategoryLogic);
    
    if (sessionStorage.getItem('isAdminAuthenticated')) {
        loginScreen.style.display = 'none';
        productFormScreen.style.display = 'block';
        loadCategoriesAndSettings();
        document.querySelector('.tab-button[data-tab="addProduct"]').click();
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

    categorySelect.addEventListener("change",()=>{const e=categorySelect.value,t=["Stock Akun","Logo"];stockPhotoSection.style.display=t.includes(e)?"block":"none",scriptMenuSection.style.display="Script"===e?"block":"none"});
    manageCategorySelect.addEventListener("change",async()=>{manageProductList.innerHTML="Memuat...";const e=manageCategorySelect.value;if(!e)return manageProductList.innerHTML="<p>Pilih kategori untuk mengelola produk.</p>",saveOrderButton.style.display="none",void(bulkPriceEditContainer.style.display="none");try{const t=await fetch(`data/isi_json/products.json?v=${new Date().getTime()}`);if(!t.ok)throw new Error(`Gagal memuat produk: ${t.status}`);const n=await t.json(),o=n[e]||[];0===o.length?(manageProductList.innerHTML="<p>Tidak ada produk di kategori ini.</p>",saveOrderButton.style.display="none",bulkPriceEditContainer.style.display="none"):(renderManageList(o,e),saveOrderButton.style.display="block",bulkPriceEditContainer.style.display="flex")}catch(e){showToast(e.message,"error"),manageProductList.innerHTML=`<p style="color:red;">${e.message}</p>`}});
    function renderManageList(e,t){manageProductList.innerHTML="",e.forEach(e=>{const n=e.createdAt&&Date.now()-new Date(e.createdAt).getTime()<864e5,o=document.createElement("div");o.className="delete-item",o.setAttribute("draggable","true"),o.dataset.id=e.id;let a=`<span>${formatRupiah(e.harga)}</span>`;e.hargaAsli&&e.hargaAsli>e.harga?a=`<span class="original-price"><del>${formatRupiah(e.hargaAsli)}</del></span> <span class="discounted-price">${formatRupiah(e.harga)}</span>`:e.hargaAsli&&(a=`<span>${formatRupiah(e.hargaAsli)}</span>`),o.innerHTML=`\n <div class="item-header">\n <span>${e.nama} - ${a} ${n?'<span class="new-badge">NEW</span>':""}</span>\n <div class="item-actions">\n <button type="button" class="edit-btn" data-id="${e.id}"><i class="fas fa-edit"></i> Edit</button>\n <button type="button" class="delete-btn delete-product-btn" data-id="${e.id}"><i class="fas fa-trash-alt"></i> Hapus</button>\n </div>\n </div>`,manageProductList.appendChild(o)}),setupManageActions(t,e)}
    function setupManageActions(e,t){const n=document.getElementById("editProductModal"),o=document.getElementById("closeEditModal"),a=document.getElementById("editModalTitle"),i=document.getElementById("save-edit-btn"),r=document.getElementById("edit-product-id"),d=document.getElementById("edit-product-category"),s=document.getElementById("edit-name"),c=document.getElementById("edit-price"),l=document.getElementById("edit-discount-price"),m=document.getElementById("edit-discount-date"),u=document.getElementById("edit-desc"),p=document.getElementById("edit-photo-section"),h=document.getElementById("edit-photo-grid"),g=document.getElementById("add-photo-input"),f=document.getElementById("add-photo-btn"),y=document.getElementById("edit-script-menu-section"),b=document.getElementById("edit-script-menu-content");manageProductList.querySelectorAll(".edit-btn").forEach(n=>{n.addEventListener("click",n=>{const o=parseInt(n.currentTarget.dataset.id),i=t.find(e=>e.id===o);if(!i)return showToast("Produk tidak ditemukan.","error");r.value=i.id,d.value=e,a.innerHTML=`<i class="fas fa-edit"></i> Edit Produk: ${i.nama}`,s.value=i.nama,c.value=i.hargaAsli||i.harga,l.value=i.discountPrice||"",m.value=i.discountEndDate?i.discountEndDate.slice(0,16):"",u.value=i.deskripsiPanjang?i.deskripsiPanjang.replace(/ \|\| /g,"\n"):"",editWhatsappNumberInput.value=i.nomorWA||"";const g=["Stock Akun","Logo"];p.style.display=g.includes(e)?"block":"none",g.includes(e)&&(h.innerHTML="",(i.images||[]).forEach(e=>{const t=document.createElement("div");t.className="photo-item",t.innerHTML=`<img src="${e}" alt="Product Photo"><button type="button" class="delete-photo-btn"><i class="fas fa-times"></i></button>`,h.appendChild(t),t.querySelector(".delete-photo-btn").addEventListener("click",e=>e.currentTarget.closest(".photo-item").remove())})),y.style.display="Script"===e?"block":"none","Script"===e&&(b.value=i.menuContent||""),openModal(editModal)})}),o.addEventListener("click",()=>closeModal(n)),f.addEventListener("click",async e=>{const t=e.currentTarget;t.disabled=!0;try{const e=await uploadImages(g.files,t);e.forEach(e=>{const t=document.createElement("div");t.className="photo-item",t.innerHTML=`<img src="${e}" alt="Product Photo"><button type="button" class="delete-photo-btn"><i class="fas fa-times"></i></button>`,h.appendChild(t),t.querySelector(".delete-photo-btn").addEventListener("click",e=>e.currentTarget.closest(".photo-item").remove())}),g.value=""}catch(e){showToast(e.message||"Gagal mengunggah foto.","error")}finally{t.disabled=!1}}),i.addEventListener("click",async()=>{const e=editWhatsappNumberInput.value.trim();if(e&&!validatePhoneNumber(e))return showToast("Format Nomor WA salah. Harus diawali kode negara (contoh: 628...)","error");const t=parseInt(c.value,10),o=l.value?parseInt(l.value,10):null,a=m.value?new Date(m.value).toISOString():null;let p=t;null!==o&&o>0&&a&&new Date(a)>new Date&&(p=o);const g={id:parseInt(r.value),category:d.value,nama:s.value.trim(),hargaAsli:t,harga:p,discountPrice:o,discountEndDate:a,deskripsiPanjang:u.value.trim().replace(/\n/g," || "),images:[...h.querySelectorAll(".photo-item img")].map(e=>e.src),menuContent:b.value.trim(),nomorWA:e};if(isNaN(g.hargaAsli)||g.hargaAsli<0||!g.nama||!g.deskripsiPanjang)return showToast("Data tidak valid (Nama, Harga Asli, Deskripsi harus diisi).","error");i.textContent="Menyimpan...",i.disabled=!0;try{const e=await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"updateProduct",data:g})}),t=await e.json();if(!e.ok)throw new Error(t.message);showToast("Produk berhasil diperbarui.","success"),closeModal(n),manageCategorySelect.dispatchEvent(new Event("change"))}catch(e){showToast(e.message,"error")}finally{i.textContent="Simpan Perubahan",i.disabled=!1}});let a=null;manageProductList.addEventListener("dragstart",e=>{a=e.target,setTimeout(()=>a.classList.add("dragging"),0)}),manageProductList.addEventListener("dragend",e=>{e.target.classList.remove("dragging")}),manageProductList.addEventListener("dragover",e=>{e.preventDefault();const t=getDragAfterElement(manageProductList,e.clientY),n=document.querySelector(".dragging");n&&(null==t?manageProductList.appendChild(n):manageProductList.insertBefore(n,t))}),saveOrderButton.addEventListener("click",async()=>{const e=[...manageProductList.children].map(e=>parseInt(e.dataset.id)),t=manageCategorySelect.value;if(!t||0===e.length)return;saveOrderButton.disabled=!0;try{const n=await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"reorderProducts",data:{category:t,order:e}})}),o=await n.json();if(!n.ok)throw new Error(o.message);showToast("Urutan berhasil disimpan.","success")}catch(e){showToast(e.message,"error")}finally{saveOrderButton.disabled=!1}}),applyBulkPriceBtn.addEventListener("click",async()=>{const e=manageCategorySelect.value,t=parseInt(bulkPriceInput.value,10);if(!e||isNaN(t))return;if(!await showCustomConfirm(`Yakin mengubah harga SEMUA produk di "<b>${e}</b>" menjadi <b>${formatRupiah(t)}</b>?`))return;applyBulkPriceBtn.disabled=!0;try{const n=await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"updateProductsInCategory",data:{category:e,newPrice:t}})}),o=await n.json();if(!n.ok)throw new Error(o.message);showToast(o.message,"success"),bulkPriceInput.value="",manageCategorySelect.dispatchEvent(new Event("change"))}catch(e){showToast(`Gagal: ${e.message}`,"error")}finally{applyBulkPriceBtn.disabled=!1}}),resetPricesBtn.addEventListener("click",async()=>{const e=manageCategorySelect.value;if(!e)return;if(!await showCustomConfirm(`Yakin mengembalikan harga SEMUA produk di "<b>${e}</b>" ke harga awal?`))return;resetPricesBtn.disabled=!0;try{const t=await fetch("/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"resetCategoryPrices",data:{category:e}})}),n=await t.json();if(!t.ok)throw new Error(n.message);showToast(n.message,"success"),manageCategorySelect.dispatchEvent(new Event("change"))}catch(e){showToast(`Gagal: ${e.message}`,"error")}finally{resetPricesBtn.disabled=!1}})}
    function getDragAfterElement(e,t){const n=[...e.querySelectorAll(".delete-item:not(.dragging)")];return n.reduce((e,n)=>{const o=n.getBoundingClientRect(),a=t-o.top-o.height/2;return a<0&&a>e.offset?{offset:a,element:n}:e},{offset:Number.NEGATIVE_INFINITY}).element}
    function renderApiKeyPriceSettings(e){apiKeyPriceSettingsContainer.innerHTML="",e&&0!==e.length?(e.forEach(e=>{const t=document.createElement("div");t.className="price-tier-item",t.innerHTML=`\n <input type="text" class="tier-name" placeholder="Nama Paket (e.g., 7 Hari)" value="${e.tier||""}">\n <input type="number" class="tier-price" placeholder="Harga Asli (e.g., 10000)" value="${e.price||""}">\n <input type="number" class="tier-discount-price" placeholder="Harga Diskon (Opsional)" value="${e.discountPrice||""}">\n <input type="datetime-local" class="tier-discount-date" value="${e.discountEndDate?e.discountEndDate.slice(0,16):""}">\n <button type="button" class="delete-tier-btn">&times;</button>\n `,apiKeyPriceSettingsContainer.appendChild(t)}),apiKeyPriceSettingsContainer.querySelectorAll(".delete-tier-btn").forEach(e=>{e.addEventListener("click",()=>{e.parentElement.remove(),0===apiKeyPriceSettingsContainer.children.length&&(apiKeyPriceSettingsContainer.innerHTML="<p>Belum ada tingkatan harga. Klik tombol di bawah untuk menambahkan.</p>"),showToast('Paket harga dihapus. Klik "Simpan" untuk konfirmasi.',"info")})})):apiKeyPriceSettingsContainer.innerHTML="<p>Belum ada tingkatan harga. Klik tombol di bawah untuk menambahkan.</p>"}
    function collectApiKeyPrices(){const e=[];return apiKeyPriceSettingsContainer.querySelectorAll(".price-tier-item").forEach(t=>{const n=t.querySelector(".tier-name").value.trim(),o=parseInt(t.querySelector(".tier-price").value,10),a=t.querySelector(".tier-discount-price").value?parseInt(t.querySelector(".tier-discount-price").value,10):null,i=t.querySelector(".tier-discount-date").value?new Date(t.querySelector(".tier-discount-date").value).toISOString():null;n&&!isNaN(o)&&o>0&&e.push({tier:n,price:o,discountPrice:a,discountEndDate:i})}),e}
    function renderManageCategoryList(){manageCategoriesList.innerHTML="";const e=siteSettings.categoryMetadata||{};allCategories.length>0?allCategories.forEach(t=>{const n=e[t]?.icon||"https://via.placeholder.com/40",o=document.createElement("div");o.className="delete-item",o.innerHTML=`\n <div class="item-header">\n <img src="${n}" class="category-icon-preview" alt="Ikon">\n <span>${t}</span>\n <div class="item-actions">\n <button type="button" class="delete-btn delete-category-btn" data-category="${t}"><i class="fas fa-trash-alt"></i> Hapus</button>\n </div>\n </div>`,manageCategoriesList.appendChild(o)}):manageCategoriesList.innerHTML="<p>Belum ada kategori.</p>"}
    async function loadApiKeys(){apiKeyListContainer.innerHTML="Memuat...";try{const e=await fetchAdminApi("getApiKeys",{});let t="";if(0===Object.keys(e).length)t="<p>Belum ada API Key.</p>";else for(const n in e){const o=e[n],a="permanent"===o.expires_at?"Permanen":new Date(o.expires_at).toLocaleString("id-ID");t+=`\n <div class="delete-item">\n <div class="item-header">\n <span><strong>${n}</strong><br><small>Kadaluwarsa: ${a}</small></span>\n <div class="item-actions">\n <button type="button" class="delete-btn delete-apikey-btn" data-key="${n}">Hapus</button>\n </div>\n </div>\n </div>`}apiKeyListContainer.innerHTML=t}catch(e){apiKeyListContainer.innerHTML=`<p style="color: red;">Gagal memuat: ${e.message}</p>`}}async function loadRootDomains(){rootDomainListContainer.innerHTML="Memuat...";try{const e=await fetchAdminApi("getRootDomainsAdmin",{});let t="";if(0===Object.keys(e).length)t="<p>Belum ada Domain Utama.</p>";else for(const n in e)t+=`\n <div class="delete-item">\n <div class="item-header">\n <span><strong>${n}</strong></span>\n <div class="item-actions">\n <button type="button" class="delete-btn delete-domain-btn" data-domain="${n}">Hapus</button>\n </div>\n </div>\n </div>`;rootDomainListContainer.innerHTML=t}catch(e){rootDomainListContainer.innerHTML=`<p style="color: red;">Gagal memuat: ${e.message}</p>`}}
    addNewPriceTierBtn.addEventListener('click',()=>{if(apiKeyPriceSettingsContainer.querySelector("p")){apiKeyPriceSettingsContainer.innerHTML=""}const e=collectApiKeyPrices();renderApiKeyPriceSettings([...e,{}])});
    saveSettingsButton.addEventListener('click',async()=>{const e=globalWhatsappNumberInput.value.trim(),t=apikeyWhatsappNumberInput.value.trim();if(!validatePhoneNumber(e)||!e)return showToast("Nomor WA Global wajib diisi dengan format kode negara (contoh: 628...)","error");if(t&&!validatePhoneNumber(t))return showToast("Format Nomor WA API Key salah.","error");const n={};let o=!0;if(categoryWhatsappNumbersContainer.querySelectorAll("input[data-category]").forEach(e=>{const t=e.value.trim();t&&!validatePhoneNumber(t)&&(showToast(`Format Nomor WA kategori ${e.dataset.category} salah.`,"error"),o=!1),n[e.dataset.category]=t}),!o)return;const a=collectApiKeyPrices();if(apiKeyPriceSettingsContainer.querySelectorAll(".price-tier-item").length>a.length)return showToast("Pastikan semua Nama Paket dan Harga Asli pada tingkatan harga API Key terisi dengan benar.","error");const i={...siteSettings,globalPhoneNumber:e,categoryPhoneNumbers:n,apiKeyPurchaseNumber:t,apiKeyPrices:a};await saveAllSettings(i)});
    permanentKeyCheckbox.addEventListener("change",e=>{durationSection.style.display=e.target.checked?"none":"block"});
    createApiKeyBtn.addEventListener('click',async()=>{const e=document.getElementById("new-apikey-name").value.trim(),t=parseInt(document.getElementById("new-apikey-duration").value,10),n=document.getElementById("new-apikey-unit").value,o=permanentKeyCheckbox.checked;if(!e||!o&&(isNaN(t)||t<=0))return showToast("Nama Key dan Durasi harus valid.","error");createApiKeyBtn.textContent="Membuat...",createApiKeyBtn.disabled=!0;try{const a=await fetchAdminApi("createApiKey",{key:e,duration:t,unit:n,isPermanent:o});if(showToast(a.message,"success"),document.getElementById("addApiKeyForm").reset(),loadApiKeys(),closeModal(addApiKeyModal),a.details&&"object"==typeof a.details){const t=a.details,n=new Date(t.created_at).toLocaleString("id-ID",{dateStyle:"full",timeStyle:"short"}),o="permanent"===t.expires_at?"Permanen":new Date(t.expires_at).toLocaleString("id-ID",{dateStyle:"full",timeStyle:"short"}),i=`✨ API Key Telah Dibuat! ✨\n-------------------------\n🔑 Kunci API   : ${e}\n🗓️ Dibuat Pada : ${n}\n⏳ Kedaluwarsa : ${o}\n-------------------------\nHarap simpan dan berikan kunci ini kepada pengguna.`;apiKeyDetailsTextarea.value=i,openModal(apiKeySuccessModal)}}catch(e){showToast(e.message,"error")}finally{createApiKeyBtn.textContent="Buat API Key",createApiKeyBtn.disabled=!1}});
    copyApiKeyDetailsBtn.addEventListener('click',()=>{apiKeyDetailsTextarea.select(),apiKeyDetailsTextarea.setSelectionRange(0,99999);try{navigator.clipboard.writeText(apiKeyDetailsTextarea.value),showToast("Detail berhasil disalin!","success")}catch(e){showToast("Gagal menyalin. Coba salin manual.","error")}});
    addDomainBtn.addEventListener('click',async()=>{const e=document.getElementById("new-domain-name").value.trim(),t=document.getElementById("new-domain-zone").value.trim(),n=document.getElementById("new-domain-token").value.trim();if(!e||!t||!n)return showToast("Semua kolom domain wajib diisi.","error");addDomainBtn.textContent="Menambah...",addDomainBtn.disabled=!0;try{const o=await fetchAdminApi("addRootDomain",{domain:e,zone:t,apitoken:n});showToast(o.message,"success"),document.getElementById("addDomainForm").reset(),loadRootDomains(),closeModal(addDomainModal)}catch(e){showToast(e.message,"error")}finally{addDomainBtn.textContent="Tambah Domain",addDomainBtn.disabled=!1}});
});