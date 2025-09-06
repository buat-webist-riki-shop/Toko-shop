let youtubePlayer;
let isYouTubeApiReady = false;
function onYouTubeIframeAPIReady() { isYouTubeApiReady = true; }
(function() { const tag = document.createElement('script'); tag.src = "https://www.youtube.com/iframe_api"; const firstScriptTag = document.getElementsByTagName('script')[0]; firstScriptTag.parentNode.insertBefore(tag, firstScriptTag); })();

const WA_ADMIN_NUMBER = "6285771555374";
const WA_SELLER_NUMBER = "6285771555374";
const CREATOR_USERNAME = "Riki Shop Real";
const SOSMED_LINK = "https://rikishopreal.vercel.app";
const TESTIMONI_LINK = "https://rikishopreal.vercel.app/testimoni";
const SALURAN_WA_LINK = "https://whatsapp.com/channel/0029VaP4QyV3WHTgYm4pS23Z";

// --- Elemen DOM ---
const welcomeScreen = document.getElementById('welcomeScreen');
const mainContainer = document.getElementById('mainContainer');
const offcanvasMenu = document.getElementById('offcanvasMenu');
const overlay = document.getElementById('overlay');
const openMenuBtn = document.getElementById('openMenu');
const closeMenuBtn = document.getElementById('closeMenu');
const openCartBtn = document.getElementById('openCart');
const cartCountSpan = document.getElementById('cartCount');
const currentDateTimeSpan = document.getElementById('currentDateTime');
const serviceGrid = document.getElementById('serviceGrid');
const productListDiv = document.getElementById('productList');
const productDetailViewDiv = document.getElementById('productDetailView');
const serviceDetailPageTitle = document.getElementById('serviceDetailPageTitle');
const detailProductName = document.getElementById('detailProductName');
const detailProductDescriptionContent = document.getElementById('detailProductDescriptionContent');
const detailProductPrice = document.getElementById('detailProductPrice');
const detailProductActions = document.getElementById('detailProductActions');
const cartItemsList = document.getElementById('cartItems');
const cartTotalSpan = document.getElementById('cartTotal');
const checkoutButton = document.getElementById('checkoutButton');
const backArrows = document.querySelectorAll('.back-arrow');
const cartEmptyMessage = document.getElementById('cartEmptyMessage');
const bannerCarousel = document.getElementById('bannerCarousel');
const bannerPagination = document.getElementById('bannerPagination');
const visitorCountDisplay = document.getElementById('visitorCountDisplay');
const visitorCountSpan = visitorCountDisplay ? visitorCountDisplay.querySelector('.count') : null;
const countdownTimerDiv = document.getElementById('countdownTimer');
let countdownInterval = null;
const stockImageSliderContainer = document.getElementById('stockImageSliderContainer');
const stockImageSlider = document.getElementById('stockImageSlider');
const sliderPrevBtn = document.getElementById('sliderPrevBtn');
const sliderNextBtn = document.getElementById('sliderNextBtn');
const imageLightbox = document.getElementById('imageLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.querySelector('.lightbox-close');
let currentStockImageIndex = 0;
let totalStockImages = 0;
const aboutUsModal = document.getElementById('aboutUsModal');
const openAboutUsModalBtn = document.getElementById('openAboutUsModal');
const closeAboutUsModalBtn = document.getElementById('closeAboutUsModal');
const genericScriptMenuModal = document.getElementById('genericScriptMenuModal');
const closeGenericScriptMenuModalBtn = document.getElementById('closeGenericScriptMenuModal');
const genericScriptMenuTitle = document.getElementById('genericScriptMenuTitle');
const genericScriptMenuContent = document.getElementById('genericScriptMenuContent');
const chatAiModal = document.getElementById('chatAiModal');
const openChatAiModalBtn = document.getElementById('openChatAiModal');
const closeChatAiModalBtn = document.getElementById('closeChatAiModal');
const chatAiMessagesPage = document.getElementById('chatAiMessagesPage');
const chatAiInputPage = document.getElementById('chatAiInputPage');
const sendChatAiBtnPage = document.getElementById('sendChatAiBtnPage');
const chatAiLoadingPage = document.getElementById('chatAiLoadingPage');
const multifunctionFab = document.getElementById('multifunctionFab');
const themeSwitchBtn = document.getElementById('themeSwitchBtn');
const openMusicPopupBtn = document.getElementById('openMusicPopupBtn');
const linktreeBtn = document.getElementById('linktreeBtn');
const muteAudioBtn = document.getElementById('muteAudioBtn');
let isFabFirstClick = true;
const musicPlayerOverlay = document.getElementById('musicPlayerOverlay');
const musicPlayerPopup = document.getElementById('musicPlayerPopup');
const closeMusicPlayer = document.getElementById('closeMusicPlayer');
const mediaLinkInput = document.getElementById('mediaLinkInput');
const loadMediaBtn = document.getElementById('loadMediaBtn');
const mediaPlayerContainer = document.getElementById('mediaPlayerContainer');
const backgroundAudio = document.getElementById('background-audio');
let toastTimeout;
let customMusicMuted = false;
let bannerInterval;

// --- Elemen & Variabel untuk Promo (Bottom Sheet) ---
const promoBottomSheet = document.getElementById('promoBottomSheet');
const promoOverlay = document.getElementById('promoOverlay');
const closePromoSheetBtn = document.getElementById('closePromoSheetBtn');
const showProductPromoPopupBtn = document.getElementById('showProductPromoPopupBtn');
const showCartPromoPopupBtn = document.getElementById('showCartPromoPopupBtn');
const promoInput = document.getElementById('promoInput');
const promoApplyBtn = document.getElementById('promoApplyBtn');
const promoFeedback = document.getElementById('promoFeedback');
const cartPromoContainer = document.getElementById('cartPromoContainer');

let promoContext = '';
let currentProductOnDetailPage = null;
let productPagePromo = null;
let cartPagePromo = null;
let products = {};
let siteSettings = {};
let cart = JSON.parse(localStorage.getItem('rikishop_cart_v2')) || [];
let currentPage = 'home-page';
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-rikishop';

async function validatePromoCode(code, context = {}) { // Terima konteks
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'promoValidate',
                data: { code: code, context: context } // Kirim konteks ke backend
            })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message);
        }
        return result;
    } catch (error) {
        console.error("Promo API Error:", error);
        throw new Error("Gagal menghubungi server promo.");
    }
}

async function setupFirebaseVisitorCounter() {
    if (!visitorCountSpan) return;
    visitorCountSpan.textContent = '-';
    if (!window.firebaseServices) {
        console.warn("Layanan Firebase tidak tersedia.");
        visitorCountSpan.textContent = 'R/S';
        return;
    }
    const { auth, db, doc, runTransaction, onSnapshot, signInAnonymously, signInWithCustomToken, initialAuthToken } = window.firebaseServices;
    try {
        if (!auth.currentUser) {
            if (initialAuthToken) { await signInWithCustomToken(auth, initialAuthToken); }
            else { await signInAnonymously(auth); }
        }
        const visitorDocRef = doc(db, "artifacts", appId, "public/data/site_stats/visitors");
        onSnapshot(visitorDocRef, (doc) => {
            const oldCount = visitorCountSpan.textContent;
            let newCountText = '0';
            if (doc.exists() && typeof doc.data().count === 'number' && !isNaN(doc.data().count)) {
                newCountText = doc.data().count.toString();
            }
            visitorCountSpan.textContent = newCountText;
            if (oldCount !== '-' && oldCount !== newCountText) {
                visitorCountDisplay.classList.add('updated');
                setTimeout(() => visitorCountDisplay.classList.remove('updated'), 500);
            }
        });
        await runTransaction(db, async (transaction) => {
            const visitorDoc = await transaction.get(visitorDocRef);
            let currentCount = 0;
            if (visitorDoc.exists() && typeof visitorDoc.data().count === 'number') {
                currentCount = visitorDoc.data().count;
            }
            const newCount = currentCount + 1;
            transaction.set(visitorDocRef, { count: newCount }, { merge: true });
        });
    } catch (error) {
        console.error("Error pada Firebase Visitor Counter:", error);
        visitorCountSpan.textContent = 'Error';
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    currentPage = pageId;
    mainContainer.scrollTop = 0;
}

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

function getPhoneNumberForProduct(product, serviceType) {
    if (product && product.nomorWA) return product.nomorWA;
    if (siteSettings.categoryPhoneNumbers && siteSettings.categoryPhoneNumbers[serviceType]) return siteSettings.categoryPhoneNumbers[serviceType];
    if (siteSettings.globalPhoneNumber) return siteSettings.globalPhoneNumber;
    return WA_ADMIN_NUMBER;
}

function updateDateTime() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    if (currentDateTimeSpan) {
        currentDateTimeSpan.innerHTML = `<span class="date">${formattedDate}</span><br><span class="time">${formattedTime}</span>`;
    }
}

function showToastNotification(message, iconClass = 'fa-check-circle') {
    const toast = document.getElementById('toast-notification');
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

function setupBannerCarousel() {
    const bannerItems = bannerCarousel.querySelectorAll(".banner-item");
    if (bannerItems.length === 0) return;
    bannerPagination.innerHTML = '';
    bannerItems.forEach((_, i) => {
        let dot = document.createElement("span");
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", () => goToSlide(i));
        bannerPagination.appendChild(dot);
    });
    let currentBannerIndex = 0;
    function goToSlide(index) {
        currentBannerIndex = index;
        bannerCarousel.style.transform = `translateX(-${index * 100}%)`;
        const dots = bannerPagination.querySelectorAll("span");
        dots.forEach(dot => dot.classList.remove("active"));
        if (dots[index]) dots[index].classList.add("active");
    }
    function nextBanner() {
        let nextIndex = (currentBannerIndex + 1) % bannerItems.length;
        goToSlide(nextIndex);
    }
    if (bannerInterval) clearInterval(bannerInterval);
    bannerInterval = setInterval(nextBanner, 4000);
}

function renderServiceGrid() {
    serviceGrid.innerHTML = '';
    const categoryMetadata = siteSettings.categoryMetadata || {};
    const fallbackIcons = {
        'Panel': 'image/panel.png',
        'VPS': 'image/vps.png',
        'Script': 'image/script.png',
        'Jasa': 'image/jasa.png',
        'murid': 'image/murid.png',
        'Sewa Bot': 'image/bot.png',
        'Stock Akun': 'image/stock.png',
        'Suntik Sosmed': 'image/suntik.png',
        'Logo': 'https://img.icons8.com/fluency/48/color-palette.png'
    };
    for (const categoryName in products) {
        const placeholderUrl = 'https://via.placeholder.com/45/EFEFEF/AFAFAF?text=ICON';
        const iconUrl = categoryMetadata[categoryName]?.icon || fallbackIcons[categoryName] || placeholderUrl;
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'service-item';
        item.dataset.service = categoryName;
        item.innerHTML = `<img src="${iconUrl}" alt="${categoryName} Icon"><span>${categoryName}</span>`;
        item.addEventListener('click', (e) => {
            e.preventDefault();
            loadServiceProducts(categoryName);
            showPage('service-detail-page');
        });
        serviceGrid.appendChild(item);
    }
}

function loadServiceProducts(serviceType) {
    serviceDetailPageTitle.textContent = serviceType;
    productListDiv.innerHTML = '';
    productDetailViewDiv.style.display = 'none';
    const productData = products[serviceType] || [];
    if (productData.length > 0) {
        productData.forEach(product => {
            const productItem = document.createElement('div');
            productItem.classList.add('product-item');
            let isNew = product.createdAt && (Date.now() - new Date(product.createdAt).getTime() < 86400000);
            let finalPrice = product.harga;
            if (product.discountEndDate && new Date(product.discountEndDate) < new Date()) { finalPrice = product.hargaAsli; }
            let priceDisplay = `<span class="product-price-list">${formatRupiah(finalPrice)}</span>`;
            if (product.hargaAsli && product.hargaAsli > finalPrice) { priceDisplay = `<span class="original-price"><del>${formatRupiah(product.hargaAsli)}</del></span> <span class="discounted-price">${formatRupiah(finalPrice)}</span>`; }
            productItem.innerHTML = `<div><span class="product-name">${product.nama} ${isNew ? '<span class="new-badge">NEW</span>' : ''}</span><p class="product-short-desc">${product.deskripsiPanjang ? product.deskripsiPanjang.split('||')[0].trim() + '...' : ''}</p>${priceDisplay}</div><i class="fas fa-chevron-right"></i>`;
            productItem.addEventListener('click', () => showProductDetail(product, serviceType));
            productListDiv.appendChild(productItem);
        });
        productListDiv.style.display = 'block';
    } else {
        productListDiv.innerHTML = '<p style="text-align: center; color: var(--light-text-color); padding: 20px;">Produk akan segera hadir.</p>';
    }
}

function showProductDetail(product, serviceType) {
    productListDiv.style.display = 'none';
    productDetailViewDiv.style.display = 'block';
    currentProductOnDetailPage = product;
    productPagePromo = null;
    promoInput.value = '';
    promoFeedback.textContent = '';
    promoFeedback.className = '';
    detailProductName.textContent = product.nama;
    detailProductActions.innerHTML = '';
    updateProductPriceDisplay();
    if ((serviceType === 'Stock Akun' || serviceType === 'Logo') && product.images && product.images.length > 0) {
        stockImageSliderContainer.style.display = 'block';
        detailProductDescriptionContent.innerHTML = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/\|\|/g, '<br>') : 'Tidak ada deskripsi.';
        stockImageSlider.innerHTML = '';
        product.images.forEach((imgUrl, index) => {
            const slideWrapper = document.createElement('div');
            slideWrapper.className = 'image-slide-wrapper';
            slideWrapper.dataset.imageUrl = imgUrl;
            let slideContent = '';
            if (serviceType === 'Stock Akun') {
                slideContent = `<div class="image-slide" style="background-image: url('${imgUrl}');"></div><span class="image-number-badge">${index + 1}</span>`;
                slideWrapper.addEventListener('click', () => openLightbox(imgUrl));
            } else if (serviceType === 'Logo') {
                slideWrapper.classList.add('logo-selectable');
                slideContent = `<div class="image-slide" style="background-image: url('${imgUrl}');"></div><div class="logo-overlay"></div><i class="fas fa-check-circle logo-checkmark"></i>`;
                slideWrapper.addEventListener('click', () => slideWrapper.classList.toggle('selected'));
            }
            slideWrapper.innerHTML = slideContent;
            stockImageSlider.appendChild(slideWrapper);
        });
        totalStockImages = product.images.length;
        currentStockImageIndex = 0;
        updateSliderPosition();
    } else {
        stockImageSliderContainer.style.display = 'none';
        detailProductDescriptionContent.innerHTML = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/\|\|/g, '<br>') : 'Tidak ada deskripsi.';
    }
}

function updateProductPriceDisplay() {
    if (!currentProductOnDetailPage) return;
    let product = currentProductOnDetailPage;
    let originalPrice = product.hargaAsli || product.harga;
    let finalPrice = originalPrice;
    let priceHtml = formatRupiah(originalPrice);
    if (productPagePromo) {
        const discountAmount = originalPrice * (productPagePromo.percentage / 100);
        finalPrice = originalPrice - discountAmount;
        priceHtml = `<span class="original-price"><del>${formatRupiah(originalPrice)}</del></span> <span class="discounted-price">${formatRupiah(finalPrice)}</span>`;
    }
    detailProductPrice.innerHTML = priceHtml;
    generateProductActionButtons(finalPrice);
}

function generateProductActionButtons(currentPrice) {
    let product = currentProductOnDetailPage;
    let serviceType = findCategoryOfProduct(product.id);
    detailProductActions.innerHTML = '';
    const addToCartBtn = document.createElement('button');
    addToCartBtn.className = 'add-to-cart';
    addToCartBtn.textContent = 'Tambah ke Keranjang';
    Object.assign(addToCartBtn.dataset, {
        productId: product.id,
        productName: product.nama,
        productPrice: currentPrice,
        serviceType: serviceType
    });
    addToCartBtn.addEventListener('click', (e) => {
        const itemData = {
            id: parseInt(e.target.dataset.productId),
            name: e.target.dataset.productName,
            price: parseFloat(e.target.dataset.productPrice),
            serviceType: e.target.dataset.serviceType,
            originalPrice: product.hargaAsli || product.harga
        };
        addToCart(itemData);
    });
    detailProductActions.appendChild(addToCartBtn);
    const buyNowLink = document.createElement('a');
    buyNowLink.className = 'buy-now';
    buyNowLink.textContent = 'Beli Sekarang';
    buyNowLink.href = "#";
    buyNowLink.addEventListener('click', (e) => {
        e.preventDefault();
        let waMessage;
        const targetPhoneNumber = getPhoneNumberForProduct(product, serviceType);
        if (serviceType === 'Logo') {
            const selectedImages = document.querySelectorAll('#stockImageSlider .image-slide-wrapper.selected');
            if (selectedImages.length === 0) {
                showToastNotification('Pilih minimal satu desain logo.', 'fa-exclamation-circle');
                return;
            }
            let imagesText = '';
            selectedImages.forEach((imgWrapper, index) => { imagesText += `\n${index + 1}. ${imgWrapper.dataset.imageUrl}`; });
            waMessage = `Halo Kak, saya tertarik memesan Logo:\n\nProduk: *${product.nama}*\nHarga: *${formatRupiah(currentPrice)}*\n\nDesain yang saya pilih:${imagesText}\n\nMohon info selanjutnya. Terima kasih! 🙏`;
        } else {
            waMessage = `Halo Kak, saya tertarik memesan produk:\n\nProduk: *${product.nama}*\nHarga: *${formatRupiah(currentPrice)}*\n\nMohon info selanjutnya. Terima kasih! 🙏`;
        }
        window.open(`https://wa.me/${targetPhoneNumber}?text=${encodeURIComponent(waMessage)}`, "_blank");
    });
    detailProductActions.appendChild(buyNowLink);
}

function updateSliderPosition() {
    if (stockImageSlider) stockImageSlider.style.transform = `translateX(-${currentStockImageIndex * 100}%)`;
}
function showNextImage() {
    currentStockImageIndex = (currentStockImageIndex + 1) % totalStockImages;
    updateSliderPosition();
}
function showPrevImage() {
    currentStockImageIndex = (currentStockImageIndex - 1 + totalStockImages) % totalStockImages;
    updateSliderPosition();
}
function openLightbox(imageUrl) {
    lightboxImage.src = imageUrl;
    imageLightbox.style.display = 'flex';
}
function closeLightbox() {
    imageLightbox.style.display = 'none';
}

function addToCart(itemData) {
    const existingItem = cart.find(item => item.id === itemData.id);
    const nonStackable = ['Stock Akun', 'Logo'];
    if (nonStackable.includes(itemData.serviceType)) {
        if (existingItem) {
            showToastNotification(`Produk tipe ini hanya bisa dibeli 1 kali.`, 'fa-exclamation-circle');
            return;
        }
        cart.push({ ...itemData, quantity: 1 });
    } else {
        if (existingItem) {
            existingItem.quantity++;
            existingItem.price = itemData.price;
            existingItem.originalPrice = itemData.originalPrice;
        } else {
            cart.push({ ...itemData, quantity: 1 });
        }
    }
    localStorage.setItem('rikishop_cart_v2', JSON.stringify(cart));
    updateCartCount();
    showToastNotification(`<b>${itemData.name}</b> ditambahkan ke keranjang.`);
}

function renderCart() {
    cartItemsList.innerHTML = '';
    cartPagePromo = null;
    if (cart.length === 0) {
        cartEmptyMessage.style.display = 'block';
        cartPromoContainer.style.display = 'none';
        document.querySelector('.cart-summary').style.display = 'none';
        checkoutButton.style.display = 'none';
    } else {
        cartEmptyMessage.style.display = 'none';
        cartPromoContainer.style.display = 'block';
        document.querySelector('.cart-summary').style.display = 'flex';
        checkoutButton.style.display = 'block';
        cart.forEach(item => {
            const cartItemCard = document.createElement('div');
            cartItemCard.className = 'cart-item-card';
            let itemActionsHTML = (['Stock Akun', 'Logo'].includes(item.serviceType)) 
                ? `<div class="item-actions"><span class="stock-info">Hanya 1 Stok</span><button type="button" class="remove-item-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash-alt"></i> Hapus</button></div>` 
                : `<div class="item-actions"><div class="quantity-controls"><button type="button" class="quantity-btn" onclick="decreaseQuantity(${item.id})">-</button><span class="item-quantity">${item.quantity}</span><button type="button" class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button></div><button type="button" class="remove-item-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash-alt"></i> Hapus</button></div>`;
            cartItemCard.innerHTML = `<div class="item-image"><i class="fas fa-box-open"></i></div><div class="item-details"><div class="item-name">${item.name}</div><div class="item-price">${formatRupiah(item.price)}</div></div>${itemActionsHTML}`;
            cartItemsList.appendChild(cartItemCard);
        });
    }
    updateCartTotal();
}

function updateCartTotal() {
    let originalSubtotal = cart.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
    
    if (cartPagePromo) {
        let discountedTotal = 0;
        let nonDiscountedTotal = 0;
        const allowed = cartPagePromo.allowedCategories;

        if (allowed && allowed.length > 0) {
            // Hitung diskon hanya untuk item di kategori yang diizinkan
            cart.forEach(item => {
                const itemCategory = findCategoryOfProduct(item.id);
                if (allowed.includes(itemCategory)) {
                    discountedTotal += item.originalPrice * item.quantity;
                } else {
                    nonDiscountedTotal += item.price * item.quantity;
                }
            });
            const discountAmount = discountedTotal * (cartPagePromo.percentage / 100);
            const finalTotal = (discountedTotal - discountAmount) + nonDiscountedTotal;
             cartTotalSpan.innerHTML = `<span class="original-total">${formatRupiah(originalSubtotal)}</span><span class="final-total">${formatRupiah(finalTotal)}</span>`;
        } else {
            // Promo berlaku untuk semua
            const discountAmount = originalSubtotal * (cartPagePromo.percentage / 100);
            const finalTotal = originalSubtotal - discountAmount;
            cartTotalSpan.innerHTML = `<span class="original-total">${formatRupiah(originalSubtotal)}</span><span class="final-total">${formatRupiah(finalTotal)}</span>`;
        }
    } else {
        let currentTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalSpan.innerHTML = formatRupiah(currentTotal);
    }
}

function increaseQuantity(productId) {
    const item = cart.find(p => p.id === productId);
    if (item) {
        item.quantity++;
        localStorage.setItem('rikishop_cart_v2', JSON.stringify(cart));
        renderCart();
    }
}

function decreaseQuantity(productId) {
    const item = cart.find(p => p.id === productId);
    if (item) {
        item.quantity--;
        if (item.quantity <= 0) removeFromCart(productId);
        else {
            localStorage.setItem('rikishop_cart_v2', JSON.stringify(cart));
            renderCart();
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('rikishop_cart_v2', JSON.stringify(cart));
    renderCart();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = count;
    cartCountSpan.style.display = count > 0 ? 'flex' : 'none';
}

function findCategoryOfProduct(productId) {
    for (const category in products) {
        if (products[category].some(p => p.id === productId)) {
            return category;
        }
    }
    return null;
}

function getAiResponse(input) {
    const lowerInput = input.toLowerCase();
    const responses = {
        'assalamualaikum': "Wa'alaikumsalam warahmatullahi wabarakatuh. Ada yang bisa saya bantu?",
        'halo': "Halo juga! Ada yang bisa saya bantu terkait layanan di Rikishop?",
        'terima kasih': "Sama-sama! Jika ada pertanyaan lain, jangan ragu untuk bertanya lagi.",
        'siapa kamu': `Nama saya <b>Toko Riki AI</b>, asisten virtual yang siap membantu Anda di sini.`,
        'pembuat': `Saya dikembangkan oleh <b>${CREATOR_USERNAME}</b> untuk membantu pelanggan.`,
        'toko apa ini': `<b>Rikishop</b> adalah platform penyedia layanan digital terlengkap.`,
        'aman': `Tentu! Keamanan dan kepercayaan pelanggan adalah prioritas utama kami.`,
        'testimoni': `Tentu, Anda bisa melihat testimoni di: <a href="${TESTIMONI_LINK}" target="_blank">${TESTIMONI_LINK}</a>`,
        'produk': `Kami menyediakan: <b>${Object.keys(products).join(', ')}</b>.`,
        'harga': `Untuk info harga terbaru, silakan pilih kategori di Beranda.`,
        'kontak': `Anda bisa menghubungi admin via WhatsApp di <a href="https://wa.me/${WA_ADMIN_NUMBER}" target="_blank">${WA_ADMIN_NUMBER}</a>.`,
        'saluran': `Gabung Saluran WhatsApp kami di: <a href="${SALURAN_WA_LINK}" target="_blank">Gabung Saluran WA</a>.`
    };
    for (const key in responses) {
        if (lowerInput.includes(key)) return responses[key];
    }
    return `Maaf, saya kurang mengerti. Coba tanyakan tentang: Keamanan, Produk, Harga, atau Kontak admin.`;
}

async function handleSendChatMessagePage() {
    const userInput = chatAiInputPage.value.trim();
    if (userInput === '') return;
    appendMessageToChatPage(userInput, 'user-message');
    chatAiInputPage.value = '';
    chatAiLoadingPage.style.display = 'flex';
    setTimeout(() => {
        const response = getAiResponse(userInput);
        appendMessageToChatPage(response, 'ai-message');
        chatAiLoadingPage.style.display = 'none';
    }, 800 + Math.random() * 400);
}

function appendMessageToChatPage(text, className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.innerHTML = text.replace(/\n/g, '<br>');
    chatAiMessagesPage.appendChild(messageDiv);
    chatAiMessagesPage.scrollTop = chatAiMessagesPage.scrollHeight;
}

function playBackgroundMusic() {
    if (backgroundAudio.src && !backgroundAudio.muted && backgroundAudio.paused) {
        backgroundAudio.play().catch(e => console.log("Autoplay dicegah oleh browser."));
    }
}

function createYouTubePlayer(videoId) {
    const checkApiReady = setInterval(() => {
        if (isYouTubeApiReady) {
            clearInterval(checkApiReady);
            if (youtubePlayer) youtubePlayer.destroy();
            mediaPlayerContainer.innerHTML = '<div id="youtube-player-embed"></div>';
            youtubePlayer = new YT.Player('youtube-player-embed', {
                videoId: videoId,
                playerVars: { 'autoplay': 1, 'controls': 0, 'rel': 0, 'showinfo': 0, 'iv_load_policy': 3 },
                events: { 'onReady': (e) => e.target.playVideo(), 'onStateChange': (e) => { if (e.data === 1) { document.getElementById('musicPlayerPopup').classList.remove('active'); document.getElementById('musicPlayerOverlay').classList.remove('active'); } } }
            });
        }
    }, 100);
}

function openPromoPopup(context) {
    promoContext = context;
    promoInput.value = '';
    promoFeedback.textContent = '';
    promoFeedback.className = '';
    promoOverlay.classList.add('active');
    promoBottomSheet.classList.add('active');
}

function closePromoPopup() {
    promoOverlay.classList.remove('active');
    promoBottomSheet.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', initializeApp);
if (showProductPromoPopupBtn) showProductPromoPopupBtn.addEventListener('click', () => openPromoPopup('product'));
if (showCartPromoPopupBtn) showCartPromoPopupBtn.addEventListener('click', () => openPromoPopup('cart'));
if (closePromoSheetBtn) closePromoSheetBtn.addEventListener('click', closePromoPopup);
if (promoOverlay) promoOverlay.addEventListener('click', closePromoPopup);
if (promoApplyBtn) {
    promoApplyBtn.addEventListener('click', async () => {
        const code = promoInput.value.trim();
        if (!code) {
            promoFeedback.textContent = 'Masukkan kode.';
            promoFeedback.className = 'error';
            return;
        }
        try {
            const result = await validatePromoCode(code);
            promoFeedback.textContent = result.message;
            promoFeedback.className = 'success';
            
     let context = {};
    if (promoContext === 'product') {
        const category = findCategoryOfProduct(currentProductOnDetailPage.id);
        context = { type: 'product', category: category };
    } else if (promoContext === 'cart') {
        const categoriesInCart = [...new Set(cart.map(item => findCategoryOfProduct(item.id)))];
        context = { type: 'cart', categories: categoriesInCart };
    }

    try {
        const result = await validatePromoCode(code, context); // Kirim konteks
        promoFeedback.textContent = result.message;
        promoFeedback.className = 'success';
        
        if (promoContext === 'product') {
            productPagePromo = result;
            updateProductPriceDisplay();
        } else if (promoContext === 'cart') {
            cartPagePromo = result; // Simpan hasil promo lengkap
            updateCartTotal();
        }
        
        setTimeout(closePromoPopup, 1200);;

        } catch (error) {
            promoFeedback.textContent = error.message;
            promoFeedback.className = 'error';
            if (promoContext === 'product') {
                productPagePromo = null;
                updateProductPriceDisplay();
            } else if (promoContext === 'cart') {
                cartPagePromo = null;
                updateCartTotal();
            }
        }
    });
}
if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
        if (cart.length === 0) return;
        let itemsText = '';
        let subtotalFromOriginal = 0;
        cart.forEach((item, i) => {
            itemsText += `*${i + 1}. ${item.name}*\n   (${formatRupiah(item.price)}) x ${item.quantity}\n`;
            subtotalFromOriginal += item.originalPrice * item.quantity;
        });
        let promoText = '';
        let finalTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (cartPagePromo) {
            const discountAmount = subtotalFromOriginal * (cartPagePromo.percentage / 100);
            finalTotal = subtotalFromOriginal - discountAmount;
            promoText = `Kode Promo (*${cartPagePromo.code.toUpperCase()}*): -${formatRupiah(discountAmount)}\n--------------------\n`;
        }
        let message = `Halo Kak, saya ingin mengonfirmasi pesanan dari keranjang:\n\n--- PESANAN ---\n${itemsText}--------------------\n*Subtotal: ${formatRupiah(subtotalFromOriginal)}*\n${promoText}*Total Akhir: ${formatRupiah(finalTotal)}*\n\nMohon konfirmasinya. Terima kasih! 🙏`;
        const checkoutNumber = siteSettings.globalPhoneNumber || WA_ADMIN_NUMBER;
        window.open(`https://wa.me/${checkoutNumber}?text=${encodeURIComponent(message)}`, '_blank');
    });
}
if (openCartBtn) openCartBtn.addEventListener('click', () => { showPage('cart-page'); renderCart(); });
backArrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
        const backToPageId = arrow.dataset.backTo;
        if (currentPage === 'service-detail-page' && productDetailViewDiv.style.display === 'block') {
            productListDiv.style.display = 'block';
            productDetailViewDiv.style.display = 'none';
        } else {
            showPage(backToPageId || 'home-page');
        }
    });
});
if (sliderNextBtn) sliderNextBtn.addEventListener('click', showNextImage);
if (sliderPrevBtn) sliderPrevBtn.addEventListener('click', showPrevImage);
if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if (imageLightbox) imageLightbox.addEventListener('click', (e) => {
    if (e.target === imageLightbox) closeLightbox();
});
if (openMenuBtn) openMenuBtn.addEventListener('click', () => { offcanvasMenu.classList.add('active'); overlay.classList.add('active'); });
if (closeMenuBtn) closeMenuBtn.addEventListener('click', () => { offcanvasMenu.classList.remove('active'); overlay.classList.remove('active'); });
if (overlay) overlay.addEventListener('click', () => { offcanvasMenu.classList.remove('active'); overlay.classList.remove('active'); });
document.querySelectorAll('#offcanvasMenu a').forEach(link => { const pageTarget = link.dataset.page; if (pageTarget) { link.addEventListener('click', (e) => { e.preventDefault(); showPage(pageTarget); offcanvasMenu.classList.remove('active'); overlay.classList.remove('active'); }); } });
if (openAboutUsModalBtn) openAboutUsModalBtn.addEventListener('click', (e) => { e.preventDefault(); aboutUsModal.style.display = 'flex'; offcanvasMenu.classList.remove('active'); overlay.classList.remove('active'); });
if (closeAboutUsModalBtn) closeAboutUsModalBtn.addEventListener('click', () => aboutUsModal.style.display = 'none');
if (openChatAiModalBtn) openChatAiModalBtn.addEventListener('click', (e) => { e.preventDefault(); chatAiModal.style.display = 'flex'; offcanvasMenu.classList.remove('active'); overlay.classList.remove('active'); });
if (closeChatAiModalBtn) closeChatAiModalBtn.addEventListener('click', () => chatAiModal.style.display = 'none');
if (sendChatAiBtnPage) sendChatAiBtnPage.addEventListener('click', handleSendChatMessagePage);
if (chatAiInputPage) chatAiInputPage.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChatMessagePage(); } });
if (multifunctionFab) multifunctionFab.addEventListener('click', (e) => { if (e.target.classList.contains('main-fab-icon')) { multifunctionFab.classList.toggle('active'); if (isFabFirstClick) { playBackgroundMusic(); isFabFirstClick = false; } } });
if (themeSwitchBtn) themeSwitchBtn.addEventListener('click', (e) => { e.stopPropagation(); document.body.classList.toggle('dark-mode'); const icon = themeSwitchBtn.querySelector('i'); icon.className = document.body.classList.contains('dark-mode') ? 'fas fa-moon' : 'fas fa-sun'; });
if (linktreeBtn) linktreeBtn.addEventListener('click', (e) => { e.stopPropagation(); window.open(SOSMED_LINK, '_blank'); });
if (muteAudioBtn) muteAudioBtn.addEventListener('click', (e) => { e.stopPropagation(); const icon = muteAudioBtn.querySelector('i'); if (youtubePlayer && typeof youtubePlayer.isMuted === 'function') { if (youtubePlayer.isMuted()) { youtubePlayer.unMute(); customMusicMuted = false; icon.className = 'fas fa-volume-up'; showToastNotification("Suara diaktifkan", "fa-volume-up"); } else { youtubePlayer.mute(); customMusicMuted = true; icon.className = 'fas fa-volume-mute'; showToastNotification("Suara dimatikan", "fa-volume-mute"); } } else { backgroundAudio.muted = !backgroundAudio.muted; icon.className = backgroundAudio.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up'; } });
if (openMusicPopupBtn) openMusicPopupBtn.addEventListener('click', (e) => { e.stopPropagation(); musicPlayerPopup.classList.add('active'); musicPlayerOverlay.classList.add('active'); });
if (closeMusicPlayer) closeMusicPlayer.addEventListener('click', () => { musicPlayerPopup.classList.remove('active'); musicPlayerOverlay.classList.remove('active'); });
if (musicPlayerOverlay) musicPlayerOverlay.addEventListener('click', () => { musicPlayerPopup.classList.remove('active'); musicPlayerOverlay.classList.remove('active'); });
if (loadMediaBtn) loadMediaBtn.addEventListener('click', () => { const mediaLink = mediaLinkInput.value.trim(); if (!mediaLink) return showToastNotification("Silakan masukkan link.", "fa-exclamation-circle"); backgroundAudio.pause(); backgroundAudio.src = ''; if (youtubePlayer && typeof youtubePlayer.destroy === 'function') youtubePlayer.destroy(); mediaPlayerContainer.innerHTML = ''; customMusicMuted = false; try { let videoId = null; if (mediaLink.includes('youtu.be') || mediaLink.includes('youtube.com')) { const url = new URL(mediaLink); videoId = url.hostname === 'youtu.be' ? url.pathname.substring(1) : url.searchParams.get('v'); } if (videoId) { createYouTubePlayer(videoId); showToastNotification("Memuat video...", "fa-play-circle"); muteAudioBtn.querySelector('i').className = 'fas fa-volume-up'; } else { showToastNotification("Link YouTube tidak valid.", "fa-times-circle"); } } catch (error) { showToastNotification("Format link tidak dikenal.", "fa-times-circle"); } });

async function initializeApp() {
    mainContainer.style.display = 'none';
    try {
        const ts = new Date().getTime();
        const [productsResponse, settingsResponse] = await Promise.all([
            fetch(`data/isi_json/products.json?v=${ts}`),
            fetch(`data/isi_json/settings.json?v=${ts}`)
        ]);
        if (!productsResponse.ok) throw new Error(`Gagal memuat produk`);
        products = await productsResponse.json();
        if (settingsResponse.ok) siteSettings = await settingsResponse.json();
        else console.warn("Gagal memuat settings.json, menggunakan fallback.");
        renderServiceGrid();
    } catch (error) {
        console.error("Gagal memuat data awal:", error);
        document.querySelector('.main-content').innerHTML = `<p style="text-align:center; color:red;">Gagal memuat data. Muat ulang halaman.</p>`;
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);
    updateCartCount();
    welcomeScreen.style.display = 'flex';
    let progress = 0;
    let progressBar = document.getElementById("progressBar");
    let progressText = document.getElementById("progress-text");
    let interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = progress + "%";
        progressText.textContent = progress + "%";
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                welcomeScreen.classList.add("fade-out");
                welcomeScreen.addEventListener('transitionend', () => {
                    welcomeScreen.style.display = "none";
                    mainContainer.style.display = "flex";
                    showPage('home-page');
                    setupBannerCarousel();
                }, { once: true });
            }, 400);
        }
    }, 80);
}
document.addEventListener('firebaseReady', () => {
    initializeApp();
    setupFirebaseVisitorCounter();
});
document.addEventListener('firebaseFailed', () => {
    initializeApp();
    if(visitorCountDisplay) visitorCountDisplay.querySelector('.count').textContent = 'R/S';
});