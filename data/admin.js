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
    const modals = document.querySelectorAll('.modal');
    const customConfirmModal = document.getElementById('customConfirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    let resolveConfirmPromise;

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

    // Variabel Pengaturan & Kategori
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

    // Variabel Promo
    const addPromoBtn = document.getElementById('add-promo-btn');
    const promoListContainer = document.getElementById('promo-list-container');
    
    // Variabel Modal Edit
    const editWhatsappNumberInput = document.getElementById('edit-whatsapp-number');

    // Variabel Manajer Domain & API Key
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

    // Alamat API & Variabel Global
    const API_PRODUCTS_URL = '/api/products';
    const API_CLOUDFLARE_URL = '/api/cloudflare';
    const API_BASE_URL = '/api';
    let activeToastTimeout = null;
    let allCategories = [];
    
    async function uploadImages(fileList, buttonElement) {
        if (!fileList || fileList.length === 0) return [];
        const uploadPromises = Array.from(fileList).map(file => {
            const formData = new FormData();
            formData.append('image', file);
            return fetch('/api/tourl', {
                method: 'POST',
                body: formData
            }).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err))).then(result => result.link);
        });
        const originalButtonText = buttonElement ? buttonElement.textContent : '';
        try {
            const urls = await Promise.all(uploadPromises.map(async (promise, index) => {
                if (buttonElement) buttonElement.textContent = `Mengunggah ${index + 1}/${fileList.length}...`;
                return await promise;
            }));
            if (buttonElement) buttonElement.textContent = originalButtonText;
            return urls;
        } catch (error) {
            if (buttonElement) buttonElement.textContent = originalButtonText;
            throw new Error(error.message || 'Gagal mengunggah gambar.');
        }
    }

    const savedTheme = localStorage.getItem('admin-theme') || 'light-mode';
    body.className = savedTheme;
    function updateThemeButton() {
        const iconClass = body.classList.contains('dark-mode') ? 'fa-sun' : 'fa-moon';
        themeSwitchBtnLogin.querySelector('i').className = `fas ${iconClass}`;
        if (themeSwitchBtnPanel) themeSwitchBtnPanel.querySelector('i').className = `fas ${iconClass}`;
    }
    updateThemeButton();

    function toggleTheme() {
        body.classList.toggle('dark-mode');
        body.classList.toggle('light-mode');
        localStorage.setItem('admin-theme', body.className);
        updateThemeButton();
    }
    themeSwitchBtnLogin.addEventListener('click', toggleTheme);
    if (themeSwitchBtnPanel) themeSwitchBtnPanel.addEventListener('click', toggleTheme);

    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
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

    function openModal(modal) { if (modal) modal.classList.add('is-visible'); }
    function closeModal(modal) { if (modal) modal.classList.remove('is-visible'); }

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
        return new Promise((resolve) => { resolveConfirmPromise = resolve; });
    }
    confirmOkBtn.addEventListener('click', () => { closeModal(customConfirmModal); if (resolveConfirmPromise) resolveConfirmPromise(true); });
    confirmCancelBtn.addEventListener('click', () => { closeModal(customConfirmModal); if (resolveConfirmPromise) resolveConfirmPromise(false); });
    
    function validatePhoneNumber(number) {
        if (!number) return true;
        return /^[1-9]\d{7,}$/.test(number);
    }

    async function fetchAdminApi(action, data) {
        const adminPassword = sessionStorage.getItem('adminPassword');
        if (!adminPassword) {
            showToast('Sesi login tidak valid.', 'error');
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

    async function loadInitialData() {
        try {
            const ts = Date.now();
            const [productsRes, settingsRes, promosRes, categoryMetaRes] = await Promise.all([
                fetch(`/data/isi_json/products.json?v=${ts}`),
                fetch(`/data/isi_json/settings.json?v=${ts}`),
                fetch(`/data/isi_json/promos.json?v=${ts}`),
                fetch(`/data/isi_json/category_meta.json?v=${ts}`)
            ]);
            const productsData = productsRes.ok ? await productsRes.json() : {};
            const settingsData = settingsRes.ok ? await settingsRes.json() : {};
            const promosData = promosRes.ok ? await promosRes.json() : {};
            const categoryMetaData = categoryMetaRes.ok ? await categoryMetaRes.json() : {};
            
            allCategories = Object.keys(productsData);
            populateCategoryDropdowns();
            renderSettingsForms(settingsData, categoryMetaData);
            renderPromoList(promosData);
        } catch (err) {
            showToast('Gagal memuat data awal: ' + err.message, 'error');
        }
    }

    function populateCategoryDropdowns() {
        const dropdowns = document.querySelectorAll('#category, #manage-category');
        dropdowns.forEach(dd => {
            const currentVal = dd.value;
            dd.innerHTML = dd.id === 'manage-category' ? '<option value="">-- Pilih Kategori --</option>' : '';
            allCategories.forEach(cat => { dd.innerHTML += `<option value="${cat}">${cat}</option>`; });
            if (allCategories.includes(currentVal)) dd.value = currentVal;
        });
    }

    function renderSettingsForms(settings, catMeta) {
        globalWhatsappNumberInput.value = settings.globalPhoneNumber || '';
        apikeyWhatsappNumberInput.value = settings.apiKeyPurchaseNumber || '';
        const categoriesInSettings = settings.categoryPhoneNumbers || {};
        categoryWhatsappNumbersContainer.innerHTML = '<h3><i class="fas fa-list-alt"></i> Nomor WA per Kategori (Opsional)</h3>';
        allCategories.forEach(cat => {
            const div = document.createElement('div');
            div.className = 'category-wa-input';
            div.innerHTML = `<label for="wa-${cat}">${cat}:</label><input type="text" id="wa-${cat}" data-category="${cat}" value="${categoriesInSettings[cat] || ''}" placeholder="Kosongkan untuk pakai nomor global">`;
            categoryWhatsappNumbersContainer.appendChild(div);
        });
        renderApiKeyPriceSettings(settings.apiKeyPrices || []);
        renderManageCategoryList(catMeta);
    }

    function renderManageCategoryList(categoryMetaData) {
        manageCategoriesList.innerHTML = '';
        allCategories.forEach(cat => {
            const iconSrc = categoryMetaData[cat] || 'logo.jpg';
            const item = document.createElement('div');
            item.className = 'delete-item';
            item.innerHTML = `
                <div class="item-header">
                    <img src="${iconSrc}" class="category-icon-preview" alt="icon">
                    <span>${cat}</span>
                    <div class="item-actions">
                        <button type="button" class="delete-btn delete-category-btn" data-category="${cat}">Hapus</button>
                    </div>
                </div>`;
            manageCategoriesList.appendChild(item);
        });
    }

    const handleLogin = async () => {
        const password = passwordInput.value;
        if (!password) return showToast('Password tidak boleh kosong.', 'error');
        loginButton.disabled = true;
        loginButton.textContent = 'Memverifikasi...';
        try {
            const res = await fetch(`${API_BASE_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            sessionStorage.setItem('adminPassword', password);
            loginScreen.style.display = 'none';
            productFormScreen.style.display = 'block';
            showToast('Login berhasil!', 'success');
            await loadInitialData();
            document.querySelector('.tab-button[data-tab="addProduct"]').click();
        } catch (e) {
            showToast(e.message || 'Password salah.', 'error');
        } finally {
            loginButton.disabled = false;
            loginButton.textContent = 'Masuk';
        }
    };
    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', async () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(button.dataset.tab).classList.add('active');
            if (button.dataset.tab === 'manageProducts' && manageCategorySelect.value) manageCategorySelect.dispatchEvent(new Event('change'));
            if (button.dataset.tab === 'domainManager') { loadApiKeys(); loadRootDomains(); }
            if (['settings', 'managePromos'].includes(button.dataset.tab)) await loadInitialData();
        });
    });

    categorySelect.addEventListener('change', () => {
        const category = categorySelect.value;
        const photoCategories = ['Stock Akun', 'Logo'];
        stockPhotoSection.style.display = photoCategories.includes(category) ? 'block' : 'none';
        scriptMenuSection.style.display = category === 'Script' ? 'block' : 'none';
    });

    addButton.addEventListener('click', async (e) => {
        e.preventDefault();
        addButton.disabled = true;
        try {
            const imageUrls = await uploadImages(photosInput.files, addButton);
            const waNumber = productWhatsappNumberInput.value.trim();
            if (!validatePhoneNumber(waNumber)) throw new Error("Format Nomor WA salah.");
            const productData = {
                category: categorySelect.value,
                nama: nameInput.value.trim(),
                harga: parseInt(priceInput.value, 10),
                deskripsiPanjang: descriptionInput.value.trim(),
                images: imageUrls,
                nomorWA: waNumber,
                menuContent: scriptMenuContentInput.value.trim()
            };
            if (!productData.category || !productData.nama || isNaN(productData.harga) || productData.harga < 0) throw new Error('Data produk tidak lengkap.');
            addButton.textContent = 'Menyimpan Produk...';
            const result = await fetch(API_PRODUCTS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addProduct', data: productData }) }).then(res => res.json());
            if (result.message !== 'Produk berhasil ditambahkan!') throw new Error(result.message);
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

    manageCategorySelect.addEventListener('change', async () => {
        const category = manageCategorySelect.value;
        manageProductList.innerHTML = category ? 'Memuat...' : '<p>Pilih kategori untuk mengelola produk.</p>';
        saveOrderButton.style.display = 'none';
        bulkPriceEditContainer.style.display = 'none';
        if (!category) return;
        try {
            const res = await fetch(`data/isi_json/products.json?v=${Date.now()}`);
            if (!res.ok) throw new Error(`Gagal memuat produk: ${res.status}`);
            const data = await res.json();
            const productsInCat = data[category] || [];
            if (productsInCat.length === 0) {
                manageProductList.innerHTML = '<p>Tidak ada produk di kategori ini.</p>';
            } else {
                renderManageList(productsInCat, category);
                saveOrderButton.style.display = 'block';
                bulkPriceEditContainer.style.display = 'flex';
            }
        } catch (err) {
            showToast(err.message, 'error');
            manageProductList.innerHTML = `<p style="color:red;">${err.message}</p>`;
        }
    });

    function renderManageList(productsToRender, category) {
        manageProductList.innerHTML = '';
        productsToRender.forEach(prod => {
            const isNew = prod.createdAt && (Date.now() - new Date(prod.createdAt).getTime()) < 24 * 60 * 60 * 1000;
            const item = document.createElement('div');
            item.className = 'delete-item';
            item.setAttribute('draggable', 'true');
            item.dataset.id = prod.id;
            let priceDisplay = `<span>${formatRupiah(prod.harga)}</span>`;
            if (prod.hargaAsli && prod.hargaAsli > prod.harga) {
                priceDisplay = `<span class="original-price"><del>${formatRupiah(prod.hargaAsli)}</del></span> <span class="discounted-price">${formatRupiah(prod.harga)}</span>`;
            }
            item.innerHTML = `<div class="item-header"><span>${prod.nama} - ${priceDisplay} ${isNew ? '<span class="new-badge">NEW</span>':''}</span><div class="item-actions"><button type="button" class="edit-btn" data-id="${prod.id}"><i class="fas fa-edit"></i> Edit</button><button type="button" class="delete-btn delete-product-btn" data-id="${prod.id}"><i class="fas fa-trash-alt"></i> Hapus</button></div></div>`;
            manageProductList.appendChild(item);
        });
        setupManageActions(category, productsToRender);
    }
    
    function formatRupiah(number) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number); }

    function setupManageActions(category, productsInCat) {
        const editModal = document.getElementById('editProductModal');
        manageProductList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = parseInt(e.currentTarget.dataset.id);
                const product = productsInCat.find(p => p.id === productId);
                if (!product) return showToast('Produk tidak ditemukan.', 'error');
                
                document.getElementById('edit-product-id').value = product.id;
                document.getElementById('edit-product-category').value = category;
                document.getElementById('editModalTitle').innerHTML = `<i class="fas fa-edit"></i> Edit Produk: ${product.nama}`;
                document.getElementById('edit-name').value = product.nama;
                document.getElementById('edit-price').value = product.hargaAsli || product.harga;
                document.getElementById('edit-discount-price').value = product.discountPrice || '';
                document.getElementById('edit-discount-date').value = product.discountEndDate ? product.discountEndDate.slice(0, 16) : '';
                document.getElementById('edit-desc').value = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/ \|\| /g, '\n') : '';
                editWhatsappNumberInput.value = product.nomorWA || '';
                
                const photoCategories = ['Stock Akun', 'Logo'];
                const isPhotoCategory = photoCategories.includes(category);
                const editPhotoSection = document.getElementById('edit-photo-section');
                editPhotoSection.style.display = isPhotoCategory ? 'block' : 'none';
                if (isPhotoCategory) {
                    const editPhotoGrid = document.getElementById('edit-photo-grid');
                    editPhotoGrid.innerHTML = '';
                    (product.images || []).forEach(img => {
                        const photoItem = document.createElement('div');
                        photoItem.className = 'photo-item';
                        photoItem.innerHTML = `<img src="${img}" alt="Product Photo"><button type="button" class="delete-photo-btn"><i class="fas fa-times"></i></button>`;
                        editPhotoGrid.appendChild(photoItem);
                        photoItem.querySelector('.delete-photo-btn').addEventListener('click', (e_photo) => e_photo.currentTarget.closest('.photo-item').remove());
                    });
                }
                const editScriptMenuSection = document.getElementById('edit-script-menu-section');
                editScriptMenuSection.style.display = category === 'Script' ? 'block' : 'none';
                if (category === 'Script') {
                    document.getElementById('edit-script-menu-content').value = product.menuContent || '';
                }
                openModal(editModal);
            });
        });

        document.getElementById('closeEditModal').addEventListener('click', () => closeModal(document.getElementById('editProductModal')));
        
        document.getElementById('add-photo-btn').addEventListener('click', async (e) => {
             const button = e.currentTarget;
             button.disabled = true;
             try {
                const addPhotoInput = document.getElementById('add-photo-input');
                const newImageUrls = await uploadImages(addPhotoInput.files, button);
                const editPhotoGrid = document.getElementById('edit-photo-grid');
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

        document.getElementById('save-edit-btn').addEventListener('click', async () => {
            const newWaNumber = editWhatsappNumberInput.value.trim();
            if (!validatePhoneNumber(newWaNumber)) return showToast("Format Nomor WA salah.", 'error');
            const hargaAsli = parseInt(document.getElementById('edit-price').value, 10);
            const discountPrice = document.getElementById('edit-discount-price').value ? parseInt(document.getElementById('edit-discount-price').value, 10) : null;
            const discountEndDate = document.getElementById('edit-discount-date').value ? new Date(document.getElementById('edit-discount-date').value).toISOString() : null;
            let harga = (discountPrice && discountEndDate && new Date(discountEndDate) > new Date()) ? discountPrice : hargaAsli;
            
            const productData = {
                id: parseInt(document.getElementById('edit-product-id').value),
                category: document.getElementById('edit-product-category').value,
                nama: document.getElementById('edit-name').value.trim(),
                hargaAsli, harga, discountPrice, discountEndDate,
                deskripsiPanjang: document.getElementById('edit-desc').value.trim().replace(/\n/g, ' || '),
                images: [...document.getElementById('edit-photo-grid').querySelectorAll('.photo-item img')].map(img => img.src),
                menuContent: document.getElementById('edit-script-menu-content').value.trim(),
                nomorWA: newWaNumber
            };
            if (isNaN(productData.hargaAsli)) return showToast('Data tidak valid.', 'error');
            
            const saveEditBtn = document.getElementById('save-edit-btn');
            saveEditBtn.textContent = 'Menyimpan...';
            saveEditBtn.disabled = true;
            try {
                const result = await fetch(API_PRODUCTS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateProduct', data: productData }) }).then(res => res.json());
                if (result.message !== 'Produk berhasil diperbarui!') throw new Error(result.message);
                showToast('Produk berhasil diperbarui.', 'success');
                closeModal(document.getElementById('editProductModal'));
                manageCategorySelect.dispatchEvent(new Event('change'));
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                saveEditBtn.textContent = 'Simpan Perubahan';
                saveEditBtn.disabled = false;
            }
        });

        let draggingItem = null;
        manageProductList.addEventListener('dragstart', (e) => { draggingItem = e.target; setTimeout(() => draggingItem.classList.add('dragging'), 0); });
        manageProductList.addEventListener('dragend', (e) => { e.target.classList.remove('dragging'); });
        manageProductList.addEventListener('dragover', (e) => { e.preventDefault(); const afterElement = getDragAfterElement(manageProductList, e.clientY); if(document.querySelector('.dragging')) manageProductList.insertBefore(document.querySelector('.dragging'), afterElement); });

        saveOrderButton.addEventListener('click', async () => {
            const newOrder = [...manageProductList.children].map(item => parseInt(item.dataset.id));
            const category = manageCategorySelect.value;
            if (!category || newOrder.length === 0) return;
            saveOrderButton.disabled = true;
            try {
                const result = await fetch(API_PRODUCTS_URL, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'reorderProducts', data: { category, order: newOrder }})}).then(res => res.json());
                if (result.message !== 'Urutan berhasil disimpan.') throw new Error(result.message);
                showToast('Urutan berhasil disimpan.', 'success');
            } catch(err) {
                showToast(err.message, 'error');
            } finally {
                saveOrderButton.disabled = false;
            }
        });

        applyBulkPriceBtn.addEventListener('click', async () => {
            const category = manageCategorySelect.value;
            const newBulkPrice = parseInt(bulkPriceInput.value, 10);
            if (!category || isNaN(newBulkPrice)) return;
            if (!(await showCustomConfirm(`Yakin mengubah harga SEMUA produk di "<b>${category}</b>" menjadi <b>${formatRupiah(newBulkPrice)}</b>?`))) return;
            applyBulkPriceBtn.disabled = true;
            try {
                const result = await fetch(API_PRODUCTS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'updateProductsInCategory', data: { category, newPrice: newBulkPrice } }) }).then(res => res.json());
                if (result.message.indexOf('berhasil diubah') === -1) throw new Error(result.message);
                showToast(result.message, 'success');
                bulkPriceInput.value = '';
                manageCategorySelect.dispatchEvent(new Event('change'));
            } catch (err) {
                showToast(`Gagal: ${err.message}`, 'error');
            } finally {
                applyBulkPriceBtn.disabled = false;
            }
        });

        resetPricesBtn.addEventListener('click', async () => {
            const category = manageCategorySelect.value;
            if (!category) return;
            if (!(await showCustomConfirm(`Yakin mengembalikan harga SEMUA produk di "<b>${category}</b>" ke harga awal?`))) return;
            resetPricesBtn.disabled = true;
            try {
                const result = await fetch(API_PRODUCTS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resetCategoryPrices', data: { category } }) }).then(res => res.json());
                if (result.message.indexOf('berhasil dikembalikan') === -1) throw new Error(result.message);
                showToast(result.message, 'success');
                manageCategorySelect.dispatchEvent(new Event('change'));
            } catch (err) {
                showToast(`Gagal: ${err.message}`, 'error');
            } finally {
                resetPricesBtn.disabled = false;
            }
        });
    }
    
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.delete-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            return (offset < 0 && offset > closest.offset) ? { offset: offset, element: child } : closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    addCategoryBtn.addEventListener('click', async () => {
        const categoryName = newCategoryNameInput.value.trim();
        const iconFile = newCategoryIconInput.files[0];
        if (!categoryName || !iconFile) return showToast('Nama kategori dan ikon wajib diisi.', 'error');
        addCategoryBtn.disabled = true;
        try {
            const [iconUrl] = await uploadImages([iconFile], addCategoryBtn);
            if (!iconUrl) throw new Error("Gagal mengunggah ikon.");
            const result = await fetch(API_PRODUCTS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addCategory', data: { categoryName, iconUrl } }) }).then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)));
            showToast(result.message, 'success');
            newCategoryNameInput.value = '';
            newCategoryIconInput.value = '';
            await loadInitialData();
        } catch (err) {
            showToast(err.message || 'Gagal menambah kategori.', 'error');
        } finally {
            addCategoryBtn.disabled = false;
        }
    });

    saveSettingsButton.addEventListener('click', async () => {
        const globalNumber = globalWhatsappNumberInput.value.trim();
        const apiKeyNumber = apikeyWhatsappNumberInput.value.trim();

        if (!validatePhoneNumber(globalNumber) || !globalNumber) return showToast("Nomor WA Global wajib diisi.", 'error');
        if (!validatePhoneNumber(apiKeyNumber) || !apiKeyNumber) return showToast("Nomor WA Beli API Key wajib diisi.", 'error');

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
             return showToast('Pastikan Nama Paket dan Harga Asli pada harga API Key terisi.', 'error');
        }

        saveSettingsButton.disabled = true;
        saveSettingsButton.textContent = 'Menyimpan...';

        try {
            const settingsData = {
                globalPhoneNumber: globalNumber,
                categoryPhoneNumbers: categoryNumbers,
                apiKeyPurchaseNumber: apiKeyNumber,
                apiKeyPrices: apiKeyPrices
            };
            const result = await fetch(`${API_BASE_URL}/updateSettings`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Admin-Password': sessionStorage.getItem('adminPassword') }, body: JSON.stringify(settingsData) }).then(res => res.json());
            if (result.message !== 'Pengaturan berhasil disimpan!') throw new Error(result.message);
            showToast('Pengaturan berhasil disimpan!', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            saveSettingsButton.disabled = false;
            saveSettingsButton.textContent = 'Simpan Semua Pengaturan';
        }
    });

    function renderApiKeyPriceSettings(prices) {
        apiKeyPriceSettingsContainer.innerHTML = '';
        if (!prices || prices.length === 0) {
             apiKeyPriceSettingsContainer.innerHTML = '<label style="margin-top: 20px;">Daftar Harga API Key:</label><small>Atur harga dan diskon untuk penjualan API Key.</small><p>Belum ada paket harga.</p>';
             return;
        }
        apiKeyPriceSettingsContainer.innerHTML = '<label style="margin-top: 20px;">Daftar Harga API Key:</label><small>Atur harga dan diskon untuk penjualan API Key.</small>';
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
            btn.addEventListener('click', () => { btn.parentElement.remove(); showToast('Paket harga dihapus. Klik "Simpan".', 'info'); });
        });
    }

    addNewPriceTierBtn.addEventListener('click', () => {
        if(apiKeyPriceSettingsContainer.querySelector('p')) { apiKeyPriceSettingsContainer.innerHTML = ''; }
        const currentPrices = collectApiKeyPrices();
        renderApiKeyPriceSettings([...currentPrices, {}]); 
    });

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

    function renderPromoList(promos) {
        promoListContainer.innerHTML = Object.keys(promos).length === 0 ? '<p>Belum ada kode promo.</p>' : '';
        for (const code in promos) {
            const promo = promos[code];
            const expires = promo.expiresAt ? new Date(promo.expiresAt).toLocaleString('id-ID') : 'Tidak ada';
            const value = promo.type === 'percentage' ? `${promo.value}%` : formatRupiah(promo.value);
            const item = document.createElement('div');
            item.className = 'delete-item';
            item.innerHTML = `<div class="item-header"><span><strong>${code}</strong><br><small>Diskon: ${value} | Kadaluwarsa: ${expires}</small></span><div class="item-actions"><button type="button" class="delete-btn delete-promo-btn" data-code="${code}">Hapus</button></div></div>`;
            promoListContainer.appendChild(item);
        }
    }

    addPromoBtn.addEventListener('click', async () => {
        const promoData = {
            code: document.getElementById('promo-code').value.trim().toUpperCase(),
            type: document.getElementById('promo-type').value,
            value: document.getElementById('promo-value').value,
            expiresAt: document.getElementById('promo-expires').value ? new Date(document.getElementById('promo-expires').value).toISOString() : null,
            maxUses: document.getElementById('promo-max-uses').value || null
        };
        if (!promoData.code || !promoData.value) return showToast('Kode dan Nilai Promo wajib diisi.', 'error');
        addPromoBtn.disabled = true;
        try {
            const result = await fetch(API_PRODUCTS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addPromo', data: promoData }) }).then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)));
            showToast(result.message, 'success');
            document.getElementById('addPromoForm').reset();
            await loadInitialData();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            addPromoBtn.disabled = false;
        }
    });

    document.body.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (!deleteBtn) return;
        
        if (deleteBtn.classList.contains('delete-promo-btn')) {
            const code = deleteBtn.dataset.code;
            if (await showCustomConfirm(`Yakin menghapus kode promo "<b>${code}</b>"?`)) {
                try {
                    const result = await fetch(API_PRODUCTS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deletePromo', data: { code } }) }).then(res => res.json());
                    if (result.message !== 'Kode promo berhasil dihapus.') throw new Error(result.message);
                    showToast(result.message, 'success');
                    await loadInitialData();
                } catch (err) { showToast(err.message, 'error'); }
            }
        } else if (deleteBtn.classList.contains('delete-category-btn')) {
            const category = deleteBtn.dataset.category;
            if (await showCustomConfirm(`Yakin menghapus kategori "<b>${category}</b>" dan semua produk di dalamnya?`)) {
                try {
                    const result = await fetch(API_PRODUCTS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteCategory', data: { categoryName: category } }) }).then(res => res.json());
                    if (result.message !== 'Kategori berhasil dihapus.') throw new Error(result.message);
                    showToast(result.message, 'success');
                    if (manageCategorySelect.value === category) {
                         manageCategorySelect.value = '';
                         manageCategorySelect.dispatchEvent(new Event('change'));
                    }
                    await loadInitialData();
                } catch (err) { showToast(err.message, 'error'); }
            }
        } else if (deleteBtn.classList.contains('delete-product-btn')) {
             const parent = deleteBtn.closest('.delete-item');
             const id = parseInt(parent.dataset.id);
             const category = manageCategorySelect.value;
             const confirm = await showCustomConfirm(`Yakin ingin menghapus produk <b>${parent.querySelector('span').textContent.split(' - ')[0]}</b>?`);
             if (confirm) {
                 try {
                     const result = await fetch(API_PRODUCTS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteProduct', data: { id, category } }) }).then(res => res.json());
                     if (result.message !== 'Produk berhasil dihapus.') throw new Error(result.message);
                     parent.remove();
                     showToast(result.message, 'success');
                 } catch (err) { showToast(err.message, 'error'); }
             }
        } else if (deleteBtn.classList.contains('delete-apikey-btn')) {
            const key = deleteBtn.dataset.key;
            if (await showCustomConfirm(`Yakin menghapus API Key "<b>${key}</b>"?`)) {
                try {
                    const result = await fetchAdminApi('deleteApiKey', { key });
                    showToast(result.message, 'success');
                    loadApiKeys();
                } catch (err) { showToast(err.message, 'error'); }
            }
        } else if (deleteBtn.classList.contains('delete-domain-btn')) {
            const domain = deleteBtn.dataset.domain;
            if (await showCustomConfirm(`Yakin menghapus Domain "<b>${domain}</b>"?`)) {
                 try {
                    const result = await fetchAdminApi('deleteRootDomain', { domain });
                    showToast(result.message, 'success');
                    loadRootDomains();
                } catch (err) { showToast(err.message, 'error'); }
            }
        }
    });
    
    permanentKeyCheckbox.addEventListener('change', (e) => {
        durationSection.style.display = e.target.checked ? 'none' : 'block';
    });

    async function loadApiKeys() {
        apiKeyListContainer.innerHTML = 'Memuat...';
        try {
            const keys = await fetchAdminApi('getApiKeys', {});
            apiKeyListContainer.innerHTML = Object.keys(keys).length === 0 ? '<p>Belum ada API Key.</p>' : Object.keys(keys).map(key => {
                const keyData = keys[key];
                const expires = keyData.expires_at === 'permanent' ? 'Permanen' : new Date(keyData.expires_at).toLocaleString('id-ID');
                return `<div class="delete-item"><div class="item-header"><span><strong>${key}</strong><br><small>Kadaluwarsa: ${expires}</small></span><div class="item-actions"><button type="button" class="delete-btn delete-apikey-btn" data-key="${key}">Hapus</button></div></div></div>`;
            }).join('');
        } catch (err) {
            apiKeyListContainer.innerHTML = `<p style="color: red;">Gagal memuat: ${err.message}</p>`;
        }
    }

    async function loadRootDomains() {
        rootDomainListContainer.innerHTML = 'Memuat...';
        try {
            const domains = await fetchAdminApi('getRootDomainsAdmin', {});
            rootDomainListContainer.innerHTML = Object.keys(domains).length === 0 ? '<p>Belum ada Domain Utama.</p>' : Object.keys(domains).map(domain => {
                return `<div class="delete-item"><div class="item-header"><span><strong>${domain}</strong></span><div class="item-actions"><button type="button" class="delete-btn delete-domain-btn" data-domain="${domain}">Hapus</button></div></div></div>`;
            }).join('');
        } catch (err) {
            rootDomainListContainer.innerHTML = `<p style="color: red;">Gagal memuat: ${err.message}</p>`;
        }
    }
    
    createApiKeyBtn.addEventListener('click', async () => {
        const key = document.getElementById('new-apikey-name').value.trim();
        const duration = parseInt(document.getElementById('new-apikey-duration').value, 10);
        const unit = document.getElementById('new-apikey-unit').value;
        const isPermanent = permanentKeyCheckbox.checked;

        if (!key || (!isPermanent && (isNaN(duration) || duration <= 0))) {
            return showToast('Nama Key dan Durasi harus valid.', 'error');
        }
        createApiKeyBtn.disabled = true;
        try {
            const result = await fetchAdminApi('createApiKey', { key, duration, unit, isPermanent });
            showToast(result.message, 'success');
            document.getElementById('addApiKeyForm').reset();
            loadApiKeys();
            closeModal(addApiKeyModal);

            if (result.details && typeof result.details === 'object' && result.details.created_at && result.details.expires_at) {
                const keyData = result.details;
                const createdAt = new Date(keyData.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
                const expiresAt = keyData.expires_at === 'permanent' ? 'Permanen' : new Date(keyData.expires_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
                
                const detailsText = `✨ API Key Telah Dibuat! ✨
    -------------------------
    🔑 Kunci API   : ${key}
    🗓️ Dibuat Pada : ${createdAt}
    ⏳ Kedaluwarsa : ${expiresAt}
    -------------------------
    Harap simpan dan berikan kunci ini kepada pengguna.`;
                
                apiKeyDetailsTextarea.value = detailsText;
                openModal(apiKeySuccessModal);
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            createApiKeyBtn.disabled = false;
        }
    });

    copyApiKeyDetailsBtn.addEventListener('click', () => {
        apiKeyDetailsTextarea.select();
        try {
            document.execCommand('copy');
            showToast('Detail berhasil disalin!', 'success');
        } catch (e) {
            showToast('Gagal menyalin.', 'error');
        }
    });

    addDomainBtn.addEventListener('click', async () => {
        const domain = document.getElementById('new-domain-name').value.trim();
        const zone = document.getElementById('new-domain-zone').value.trim();
        const apitoken = document.getElementById('new-domain-token').value.trim();
        if (!domain || !zone || !apitoken) return showToast('Semua kolom domain wajib diisi.', 'error');
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
            addDomainBtn.disabled = false;
        }
    });
    
    if (sessionStorage.getItem('isAdminAuthenticated')) {
        loginScreen.style.display = 'none';
        productFormScreen.style.display = 'block';
        loadInitialData();
        document.querySelector('.tab-button[data-tab="addProduct"]').click();
    }
});