let youtubePlayer;
let isYouTubeApiReady = false;
function onYouTubeIframeAPIReady() { isYouTubeApiReady = true; }
(function() { const tag = document.createElement('script'); tag.src = "https://www.youtube.com/iframe_api"; const firstScriptTag = document.getElementsByTagName('script')[0]; firstScriptTag.parentNode.insertBefore(tag, firstScriptTag); })();

const WA_ADMIN_NUMBER = "6285771555374"; // Fallback jika settings.json gagal dimuat
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
const serviceItems = document.querySelectorAll('.service-item');
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
let currentBannerIndex = 0;
let bannerInterval;

// Elemen Countdown Timer
const countdownTimerDiv = document.getElementById('countdownTimer');
let countdownInterval = null;

// --- Elemen untuk Fitur Stock Akun ---
const stockImageSliderContainer = document.getElementById('stockImageSliderContainer');
const stockImageSlider = document.getElementById('stockImageSlider');
const sliderPrevBtn = document.getElementById('sliderPrevBtn');
const sliderNextBtn = document.getElementById('sliderNextBtn');
const imageLightbox = document.getElementById('imageLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.querySelector('.lightbox-close');
let currentStockImageIndex = 0;
let totalStockImages = 0;

// Elemen Modal
const aboutUsModal = document.getElementById('aboutUsModal');
const openAboutUsModalBtn = document.getElementById('openAboutUsModal');
const closeAboutUsModalBtn = document.getElementById('closeAboutUsModal');
const genericScriptMenuModal = document.getElementById('genericScriptMenuModal');
const closeGenericScriptMenuModalBtn = document.getElementById('closeGenericScriptMenuModal');
const genericScriptMenuTitle = document.getElementById('genericScriptMenuTitle');
const genericScriptMenuContent = document.getElementById('genericScriptMenuContent');

// Elemen AI Modal
const chatAiModal = document.getElementById('chatAiModal');
const openChatAiModalBtn = document.getElementById('openChatAiModal');
const closeChatAiModalBtn = document.getElementById('closeChatAiModal');
const chatAiMessagesPage = document.getElementById('chatAiMessagesPage');
const chatAiInputPage = document.getElementById('chatAiInputPage');
const sendChatAiBtnPage = document.getElementById('sendChatAiBtnPage');
const chatAiLoadingPage = document.getElementById('chatAiLoadingPage');

// Elemen Tombol Multifungsi (FAB)
const multifunctionFab = document.getElementById('multifunctionFab');
const themeSwitchBtn = document.getElementById('themeSwitchBtn');
const openMusicPopupBtn = document.getElementById('openMusicPopupBtn');
const linktreeBtn = document.getElementById('linktreeBtn');
const muteAudioBtn = document.getElementById('muteAudioBtn');
let isFabFirstClick = true;

// Elemen Music Player
const musicPlayerOverlay = document.getElementById('musicPlayerOverlay');
const musicPlayerPopup = document.getElementById('musicPlayerPopup');
const closeMusicPlayer = document.getElementById('closeMusicPlayer');
const mediaLinkInput = document.getElementById('mediaLinkInput');
const loadMediaBtn = document.getElementById('loadMediaBtn');
const mediaPlayerContainer = document.getElementById('mediaPlayerContainer');
const backgroundAudio = document.getElementById('background-audio');
let toastTimeout;
let customMusicMuted = false;

// Variabel Global
let products = {};
let siteSettings = {}; // Menyimpan data dari settings.json
let cart = JSON.parse(localStorage.getItem('rikishop_cart')) || [];
let currentPage = 'home-page';
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-rikishop';

// --- Logika Firebase untuk Pengunjung & Hitungan Masuk ---
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
                setTimeout(() => {
                    visitorCountDisplay.classList.remove('updated');
                }, 500);
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

// --- Logika Tombol Multifungsi (FAB) ---
multifunctionFab.addEventListener('click', (e) => {
    if (e.target.classList.contains('main-fab-icon')) {
        multifunctionFab.classList.toggle('active');
        if (isFabFirstClick) {
            playBackgroundMusic();
            isFabFirstClick = false;
        }
    }
});
themeSwitchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.body.classList.toggle('dark-mode');
    const icon = themeSwitchBtn.querySelector('i');
    icon.className = document.body.classList.contains('dark-mode') ? 'fas fa-moon' : 'fas fa-sun';
});
linktreeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.open(SOSMED_LINK, '_blank');
});
muteAudioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const icon = muteAudioBtn.querySelector('i');
    
    if (youtubePlayer && typeof youtubePlayer.isMuted === 'function') {
        if (youtubePlayer.isMuted()) {
            youtubePlayer.unMute();
            customMusicMuted = false;
            icon.className = 'fas fa-volume-up';
            showToastNotification("Suara diaktifkan", "fa-volume-up");
        } else {
            youtubePlayer.mute();
            customMusicMuted = true;
            icon.className = 'fas fa-volume-mute';
            showToastNotification("Suara dimatikan", "fa-volume-mute");
        }
    } else {
        backgroundAudio.muted = !backgroundAudio.muted;
        icon.className = backgroundAudio.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    }
});

// --- Fungsi Pembantu ---
function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    currentPage = pageId;
    mainContainer.scrollTop = 0;
}
function updateDateTime() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    currentDateTimeSpan.innerHTML = `<span class="date">${formattedDate}</span><br><span class="time">${formattedTime}</span>`;
}
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}
function getPhoneNumberForProduct(product, serviceType) {
    // Hierarki: Produk -> Kategori -> Global -> Default
    if (product && product.nomorWA) {
        return product.nomorWA;
    }
    if (siteSettings.categoryPhoneNumbers && siteSettings.categoryPhoneNumbers[serviceType] && siteSettings.categoryPhoneNumbers[serviceType] !== "") {
        return siteSettings.categoryPhoneNumbers[serviceType];
    }
    if (siteSettings.globalPhoneNumber) {
        return siteSettings.globalPhoneNumber;
    }
    return WA_ADMIN_NUMBER; // Fallback ke nomor default
}

// --- Logika Carousel ---
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
        dots[index].classList.add("active");
    }
    function nextBanner() {
        let nextIndex = (currentBannerIndex + 1) % bannerItems.length;
        goToSlide(nextIndex);
    }
    if (bannerInterval) clearInterval(bannerInterval);
    bannerInterval = setInterval(nextBanner, 4000);
}

// --- Logika Menu & Modal ---
openMenuBtn.addEventListener('click', () => {
    offcanvasMenu.classList.add('active');
    overlay.classList.add('active');
});
function closeOffcanvas() {
    offcanvasMenu.classList.remove('active');
    overlay.classList.remove('active');
}
closeMenuBtn.addEventListener('click', closeOffcanvas);
overlay.addEventListener('click', closeOffcanvas);

document.querySelectorAll('#offcanvasMenu a').forEach(link => {
    const pageTarget = link.dataset.page;
    if (pageTarget) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(pageTarget);
            closeOffcanvas();
        });
    }
});

openAboutUsModalBtn.addEventListener('click', (e) => { e.preventDefault(); aboutUsModal.style.display = 'flex'; closeOffcanvas(); });
closeAboutUsModalBtn.addEventListener('click', () => aboutUsModal.style.display = 'none');
openChatAiModalBtn.addEventListener('click', (e) => { e.preventDefault(); chatAiModal.style.display = 'flex'; closeOffcanvas(); });
closeChatAiModalBtn.addEventListener('click', () => chatAiModal.style.display = 'none');
closeGenericScriptMenuModalBtn.addEventListener('click', () => genericScriptMenuModal.style.display = 'none');
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

// --- Logika Produk ---
serviceItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const serviceType = item.dataset.service;
        loadServiceProducts(serviceType);
        showPage('service-detail-page');
    });
});
function loadServiceProducts(serviceType) {
    serviceDetailPageTitle.textContent = serviceType;
    productListDiv.innerHTML = '';
    productDetailViewDiv.style.display = 'none';
    let productData = products[serviceType];
    
    if (productData && productData.length > 0) {
        productData.forEach(product => {
            const productItem = document.createElement('div');
            productItem.classList.add('product-item');

            let isNew = false;
            if (product.createdAt) {
                const createdTime = new Date(product.createdAt).getTime();
                const now = Date.now();
                const oneDayInMs = 24 * 60 * 60 * 1000;
                if (now - createdTime < oneDayInMs) {
                    isNew = true;
                }
            }

            // --- CHANGED: Logika harga dipindahkan ke sini ---
            let finalPrice = product.harga;
            const originalPrice = product.hargaAsli;

            // Cek apakah diskon sudah berakhir
            if (product.discountEndDate && new Date(product.discountEndDate) < new Date()) {
                finalPrice = originalPrice; // Kembalikan ke harga asli jika sudah berakhir
            }

            let priceDisplay = `<span class="product-price-list">${formatRupiah(finalPrice)}</span>`;
            if (originalPrice && originalPrice > finalPrice) {
                priceDisplay = `<span class="original-price"><del>${formatRupiah(originalPrice)}</del></span> <span class="discounted-price">${formatRupiah(finalPrice)}</span>`;
            }
            // --- END CHANGED ---
            
            productItem.innerHTML = `
                <div>
                    <span class="product-name">
                        ${product.nama} 
                        ${isNew ? '<span class="new-badge">NEW</span>' : ''}
                    </span>
                    <p class="product-short-desc">
                        ${product.deskripsiPanjang ? product.deskripsiPanjang.split('||')[0].trim() + '...' : ''}
                    </p>
                    ${priceDisplay}
                </div>
                <i class="fas fa-chevron-right"></i>
            `;

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
    detailProductName.textContent = product.nama;
    
    let finalPrice = product.harga;
    let originalPrice = product.hargaAsli;
    
    // Cek apakah diskon sudah berakhir
    if (product.discountEndDate && new Date(product.discountEndDate) < new Date()) {
        finalPrice = originalPrice; 
    }

    const priceHtml = (originalPrice && originalPrice > finalPrice)
        ? `<span class="original-price"><del>${formatRupiah(originalPrice)}</del></span> <span class="discounted-price">${formatRupiah(finalPrice)}</span>`
        : `${formatRupiah(finalPrice)}`;

    detailProductPrice.innerHTML = priceHtml;
    detailProductActions.innerHTML = '';
    
    // Logika Countdown Timer
    if (countdownInterval) clearInterval(countdownInterval);
    if (product.discountEndDate && new Date(product.discountEndDate) > new Date()) {
        countdownTimerDiv.style.display = 'block';
        const endTime = new Date(product.discountEndDate).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance < 0) {
                clearInterval(countdownInterval);
                countdownTimerDiv.innerHTML = '<div class="timer-title">Diskon Berakhir</div>';
                detailProductPrice.innerHTML = `${formatRupiah(originalPrice)}`;
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.getElementById('countdown-display').textContent = 
                `${days}h ${hours}j ${minutes}m ${seconds}d`;
        };

        updateTimer();
        countdownInterval = setInterval(updateTimer, 1000);
    } else {
        countdownTimerDiv.style.display = 'none';
    }

    if ((serviceType === 'Stock Akun' || serviceType === 'Logo') && product.images && product.images.length > 0) {
        stockImageSliderContainer.style.display = 'block';
        detailProductDescriptionContent.innerHTML = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/\|\|/g, '<br>') : 'Tidak ada deskripsi.';
        
        stockImageSlider.innerHTML = '';
        product.images.forEach((imgUrl) => {
            const slide = document.createElement('div');
            slide.className = 'image-slide';
            slide.style.backgroundImage = `url('${imgUrl}')`;
            slide.addEventListener('click', () => openLightbox(imgUrl));
            stockImageSlider.appendChild(slide);
        });
        
        totalStockImages = product.images.length;
        currentStockImageIndex = 0;
        updateSliderPosition();

    } else {
        stockImageSliderContainer.style.display = 'none';
        detailProductDescriptionContent.innerHTML = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/\|\|/g, '<br>').replace(/â–ªï¸Ž/g, 'â€¢') : 'Tidak ada deskripsi.';
    }

    const addToCartBtn = document.createElement('button');
    addToCartBtn.className = 'add-to-cart';
    addToCartBtn.textContent = 'Tambah ke Keranjang';
    Object.assign(addToCartBtn.dataset, {
        productId: product.id,
        productName: product.nama,
        productPrice: finalPrice, // Gunakan harga final untuk keranjang
        serviceType: serviceType
    });
    addToCartBtn.addEventListener('click', addToCart);
    detailProductActions.appendChild(addToCartBtn);

    const buyNowLink = document.createElement('a');
    buyNowLink.className = 'buy-now';
    buyNowLink.textContent = 'Beli Sekarang';

    const targetPhoneNumber = getPhoneNumberForProduct(product, serviceType);

    let buyNowMessage = '';
    if (serviceType === 'Stock Akun' && product.images && product.images.length > 0) {
        buyNowMessage = `Halo Kak, saya tertarik memesan Akun:\n\nProduk: *${product.nama}*\nHarga: *${formatRupiah(finalPrice)}*\n\nReferensi gambar:\n${product.images[0]}\n\nMohon info ketersediaannya. Terima kasih! ðŸ™ `;
    } else if (serviceType === 'Logo' && product.images && product.images.length > 0) {
        buyNowMessage = `Halo Kak, saya tertarik memesan Logo:\n\nNama Logo: *${product.nama}*\nHarga: *${formatRupiah(finalPrice)}*\n\nReferensi gambar:\n${product.images[0]}\n\nMohon info ketersediaannya. Terima kasih! ðŸ™ `;
    } else {
        buyNowMessage = `Halo Kak, saya tertarik memesan produk:\n\nProduk: *${product.nama}*\nHarga: *${formatRupiah(finalPrice)}*\n\nMohon info selanjutnya. Terima kasih! ðŸ™ `;
    }
    
    buyNowLink.href = `https://wa.me/${targetPhoneNumber}?text=${encodeURIComponent(buyNowMessage)}`;
    buyNowLink.target = "_blank";
    detailProductActions.appendChild(buyNowLink);

    if (serviceType === 'Script' && product.menuContent) {
        const cekMenuBtn = document.createElement('button');
        cekMenuBtn.className = 'cek-menu';
        cekMenuBtn.textContent = 'Cek Menu';
        cekMenuBtn.addEventListener('click', () => {
            genericScriptMenuTitle.textContent = `Menu ${product.nama}`;
            genericScriptMenuContent.innerHTML = product.menuContent.replace(/\n/g, '<br>');
            genericScriptMenuModal.style.display = 'flex';
        });
        detailProductActions.appendChild(cekMenuBtn);
    }
}

// --- Logika untuk Slider & Lightbox ---
function updateSliderPosition() {
    if(stockImageSlider) stockImageSlider.style.transform = `translateX(-${currentStockImageIndex * 100}%)`;
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
sliderNextBtn.addEventListener('click', showNextImage);
sliderPrevBtn.addEventListener('click', showPrevImage);
lightboxClose.addEventListener('click', closeLightbox);
imageLightbox.addEventListener('click', (e) => {
    if (e.target === imageLightbox) {
        closeLightbox();
    }
});

// --- Logika Tombol Kembali ---
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

// --- Logika Notifikasi & Keranjang ---
function showToastNotification(message, iconClass = 'fa-check-circle') {
    const toast = document.getElementById('toast-notification');
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = count;
    cartCountSpan.style.display = count > 0 ? 'flex' : 'none';
}
function addToCart(event) {
    const { productId, productName, productPrice, serviceType } = event.target.dataset;
    const id = parseInt(productId), price = parseInt(productPrice);
    const existingItem = cart.find(item => item.id === id);

    if (serviceType === 'Stock Akun') {
        if (existingItem) {
            showToastNotification('Stok Akun hanya bisa dibeli 1 kali.', 'fa-exclamation-circle');
            return;
        } else {
            cart.push({ id, name: productName, price, quantity: 1, serviceType });
        }
    } else {
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id, name: productName, price, quantity: 1, serviceType });
        }
    }

    localStorage.setItem('rikishop_cart', JSON.stringify(cart));
    updateCartCount();
    const itemInCart = cart.find(item => item.id === id);
    showToastNotification(`<b>${productName}</b><b>(${itemInCart.quantity} barang)</b> ditambahkan.`);
}
function renderCart() {
    cartItemsList.innerHTML = '';
    let total = 0;
    if (cart.length === 0) {
        cartEmptyMessage.style.display = 'block';
        document.querySelector('.cart-summary').style.display = 'none';
        checkoutButton.style.display = 'none';
    } else {
        cartEmptyMessage.style.display = 'none';
        document.querySelector('.cart-summary').style.display = 'flex';
        checkoutButton.style.display = 'block';
        cart.forEach(item => {
            const cartItemCard = document.createElement('div');
            cartItemCard.className = 'cart-item-card';

            let itemActionsHTML = '';
            if (item.serviceType === 'Stock Akun') {
                itemActionsHTML = `
                    <div class="item-actions">
                        <span class="stock-info">Hanya 1 Stok</span>
                        <button type="button" class="remove-item-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash-alt"></i> Hapus</button>
                    </div>`;
            } else {
                itemActionsHTML = `
                    <div class="item-actions">
                        <div class="quantity-controls">
                            <button type="button" class="quantity-btn" onclick="decreaseQuantity(${item.id})">-</button>
                            <span class="item-quantity">${item.quantity}</span>
                            <button type="button" class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button>
                        </div>
                        <button type="button" class="remove-item-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash-alt"></i> Hapus</button>
                    </div>`;
            }

            cartItemCard.innerHTML = `
                <div class="item-image"><i class="fas fa-box-open"></i></div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">${formatRupiah(item.price)}</div>
                </div>
                ${itemActionsHTML}`;

            cartItemsList.appendChild(cartItemCard);
            total += item.price * item.quantity;
        });
    }
    cartTotalSpan.textContent = formatRupiah(total);
}
function increaseQuantity(productId) {
    const item = cart.find(p => p.id === productId);
    if (item) {
        item.quantity++;
        localStorage.setItem('rikishop_cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
    }
}
function decreaseQuantity(productId) {
    const item = cart.find(p => p.id === productId);
    if (item) {
        item.quantity--;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            localStorage.setItem('rikishop_cart', JSON.stringify(cart));
            updateCartCount();
            renderCart();
        }
    }
}
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('rikishop_cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
}
openCartBtn.addEventListener('click', () => { showPage('cart-page'); renderCart(); });
checkoutButton.addEventListener('click', () => {
    if (cart.length === 0) return;

    let itemsText = '';
    let totalOrder = 0;
    cart.forEach((item, index) => {
        itemsText += `*${index + 1}. ${item.name}*\n   (${formatRupiah(item.price)}) x ${item.quantity}\n`;
        totalOrder += item.price * item.quantity;
    });

    let message = `Halo Kak, saya ingin mengonfirmasi pesanan dari keranjang:\n\n--- PESANAN ---\n${itemsText}--------------------\n\n*Total: ${formatRupiah(totalOrder)}*\n\nMohon konfirmasinya. Terima kasih! ðŸ™ `;
    
    const checkoutNumber = siteSettings.globalPhoneNumber || WA_ADMIN_NUMBER;
    window.open(`https://wa.me/${checkoutNumber}?text=${encodeURIComponent(message)}`, '_blank');
});

// --- Logika AI Lokal ---
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
function getAiResponse(input) {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('assalamualaikum')) return `Wa'alaikumsalam warahmatullahi wabarakatuh. Ada yang bisa saya bantu?`;
    if (lowerInput.includes('om swastiastu')) return `Om shanti, shanti, shanti, om. Selamat datang di Rikishop, ada yang bisa dibantu?`;
    if (lowerInput.includes('namo buddhaya')) return `Namo buddhaya. Ada yang bisa saya bantu?`;
    if (lowerInput.includes('salam sejahtera')) return `Salam sejahtera juga untuk Anda. Ada yang bisa saya bantu?`;
    if (lowerInput.match(/\bselamat (pagi|siang|sore|malam)\b/)) { const time = lowerInput.match(/\b(pagi|siang|sore|malam)\b/)[0]; return `Selamat ${time} juga. Ada yang bisa saya bantu di Rikishop?`; }
    if (lowerInput.match(/^(halo|hai|hi|hallo)$/)) return `Halo juga! Ada yang bisa saya bantu terkait layanan di Rikishop?`;
    if (lowerInput.includes('terima kasih')) return `Sama-sama! Jika ada pertanyaan lain, jangan ragu untuk bertanya lagi.`;
    if (lowerInput.includes('siapa namamu') || lowerInput.includes('kamu siapa')) return `Nama saya <b>Toko Riki AI</b>, asisten virtual yang siap membantu Anda di sini.`;
    if (lowerInput.includes('dibuat oleh') || lowerInput.includes('pembuat') || lowerInput.includes('pengembang') || lowerInput.includes('creator')) return `Saya dikembangkan oleh <b>${CREATOR_USERNAME}</b> untuk membantu para pelanggan mendapatkan informasi dengan cepat.`;
    if (lowerInput.includes('toko apa ini') || lowerInput.includes('rikishop itu apa')) return `<b>Rikishop</b> adalah platform penyedia layanan digital terlengkap. Kami fokus pada produk berkualitas seperti Panel Hosting, VPS, Script Bot, dan berbagai jasa digital lainnya dengan harga terjangkau.`;
    if (lowerInput.includes('aman') || lowerInput.includes('terpercaya') || lowerInput.includes('tipu')) return `Tentu! Keamanan dan kepercayaan pelanggan adalah prioritas utama kami. Semua transaksi dijamin aman dan produk yang kami jual memiliki kualitas terbaik. Anda bisa melihat testimoni dari pelanggan kami.`;
    if (lowerInput.includes('testi') || lowerInput.includes('testimoni')) return `Tentu, Anda bisa melihat semua testimoni pelanggan kami di halaman ini: <a href="${TESTIMONI_LINK}" target="_blank">${TESTIMONI_LINK}</a>`;
    if (lowerInput.includes('jual apa') || lowerInput.includes('produk apa') || lowerInput.includes('layanan')) { const categories = Object.keys(products).join(', '); return `Kami menyediakan berbagai layanan digital, antara lain: <b>${categories}</b>. Apakah ada kategori spesifik yang ingin Anda ketahui lebih lanjut?`; }
    if (lowerInput.includes('panel')) return `Kami menyediakan Panel Hosting dengan berbagai pilihan RAM, mulai dari 1GB hingga UNLIMITED. Server kami private, berkualitas, dan bergaransi. Cocok untuk menjalankan berbagai jenis bot.`;
    if (lowerInput.includes('vps')) return `Tentu, untuk VPS kami punya banyak pilihan spesifikasi RAM dan CPU. Setiap pembelian VPS akan mendapatkan bonus menarik seperti gratis install panel. Sangat cocok untuk kebutuhan server Anda.`;
    if (lowerInput.includes('script')) return `Kami menjual berbagai script fungsional seperti script push kontak, cpanel untuk reseller, bot Telegram, dan banyak lagi. Semua script sudah teruji dan siap pakai.`;
    if (lowerInput.includes('harga')) return `Untuk informasi harga yang paling akurat dan terbaru, silakan pilih kategori layanan yang Anda minati di halaman Beranda. Harga kami sangat kompetitif, mulai dari ribuan rupiah saja.`;
    if (lowerInput.includes('sosmed') || lowerInput.includes('sosial media') || lowerInput.includes('link')) return `Tentu, Anda bisa mengunjungi semua sosial media kami melalui link berikut: <a href="${SOSMED_LINK}" target="_blank">${SOSMED_LINK}</a>`;
    if (lowerInput.includes('kontak') || lowerInput.includes('admin') || lowerInput.includes('nomor')) return `Anda bisa menghubungi admin kami langsung melalui WhatsApp di nomor <a href="https://wa.me/${WA_ADMIN_NUMBER}" target="_blank">${WA_ADMIN_NUMBER}</a>.`;
    if (lowerInput.includes('grup') || lowerInput.includes('channel') || lowerInput.includes('saluran')) return `Tentu, Anda bisa bergabung dengan Saluran WhatsApp kami untuk info dan promo terbaru di sini: <a href="${SALURAN_WA_LINK}" target="_blank">Gabung Saluran WA</a>.`;
    return `Maaf, saya hanya bisa membantu dengan pertanyaan seputar Rikishop. Coba tanyakan tentang: <br>â€¢ Keamanan toko <br>â€¢ Informasi produk (Panel, VPS, dll) <br>â€¢ Harga umum <br>â€¢ Kontak admin & sosial media`;
}
function appendMessageToChatPage(text, className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    let formattedText = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    messageDiv.innerHTML = formattedText;
    chatAiMessagesPage.appendChild(messageDiv);
    chatAiMessagesPage.scrollTop = chatAiMessagesPage.scrollHeight;
}
sendChatAiBtnPage.addEventListener('click', handleSendChatMessagePage);
chatAiInputPage.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChatMessagePage(); } });

// --- Logika Musik ---
openMusicPopupBtn.addEventListener('click', (e) => { e.stopPropagation(); musicPlayerPopup.classList.add('active'); musicPlayerOverlay.classList.add('active'); });
function closeMusicPlayerPopup() { musicPlayerPopup.classList.remove('active'); musicPlayerOverlay.classList.remove('active'); }
closeMusicPlayer.addEventListener('click', closeMusicPlayerPopup);
musicPlayerOverlay.addEventListener('click', closeMusicPlayerPopup);
loadMediaBtn.addEventListener('click', () => {
    const mediaLink = mediaLinkInput.value.trim();
    if (!mediaLink) return showToastNotification("Silakan masukkan link.", "fa-exclamation-circle");
    
    backgroundAudio.pause();
    backgroundAudio.src = '';
    if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
        youtubePlayer.destroy();
        youtubePlayer = null;
    }
    mediaPlayerContainer.innerHTML = '';
    customMusicMuted = false;

    try {
        let videoId = null;
        if (mediaLink.includes('youtu.be') || mediaLink.includes('youtube.com')) {
            const url = new URL(mediaLink);
            videoId = url.hostname === 'youtu.be' ? url.pathname.substring(1) : url.searchParams.get('v');
        }

        if (videoId) {
            createYouTubePlayer(videoId);
            showToastNotification("Memuat video...", "fa-play-circle");
            muteAudioBtn.querySelector('i').className = 'fas fa-volume-up';
        } else {
            showToastNotification("Link YouTube tidak valid atau tidak didukung.", "fa-times-circle");
        }
    } catch (error) { 
        console.error("Error parsing link:", error);
        showToastNotification("Format link tidak dikenal.", "fa-times-circle"); 
    }
});
function createYouTubePlayer(videoId) {
    const checkApiReady = setInterval(() => {
        if (isYouTubeApiReady) {
            clearInterval(checkApiReady);
            if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
                youtubePlayer.destroy();
            }
            mediaPlayerContainer.innerHTML = '<div id="youtube-player-embed"></div>';
            youtubePlayer = new YT.Player('youtube-player-embed', {
                videoId: videoId,
                playerVars: { 'autoplay': 1, 'controls': 0, 'rel': 0, 'showinfo': 0, 'iv_load_policy': 3 },
                events: {
                    'onReady': (event) => { event.target.playVideo(); },
                    'onStateChange': (event) => { if (event.data === YT.PlayerState.PLAYING) { closeMusicPlayerPopup(); } }
                }
            });
        }
    }, 100);
}
function playBackgroundMusic() { 
    if (backgroundAudio.src && !backgroundAudio.muted && backgroundAudio.paused) { 
        backgroundAudio.play().catch(e => console.log("Autoplay dicegah oleh browser.")); 
    } 
}

// --- Inisialisasi Aplikasi ---
async function initializeApp() {
    mainContainer.style.display = 'none';
    try {
        const timestamp = new Date().getTime();
        const [productsResponse, settingsResponse] = await Promise.all([
            fetch(`data/isi_json/products.json?v=${timestamp}`),
            fetch(`data/isi_json/settings.json?v=${timestamp}`)
        ]);

        if (!productsResponse.ok) throw new Error(`Gagal memuat produk: ${productsResponse.status}`);
        products = await productsResponse.json();
        
        if (settingsResponse.ok) {
            siteSettings = await settingsResponse.json();
        } else {
            console.warn("Gagal memuat settings.json, menggunakan nomor fallback.");
        }

    } catch (error) {
        console.error("Gagal memuat data awal:", error);
        document.querySelector('.main-content').innerHTML = `<p style="text-align:center; color:red;">Gagal memuat data. Coba muat ulang halaman.</p>`;
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
    console.log("Firebase is ready, initializing app and visitor counter.");
    initializeApp();
    setupFirebaseVisitorCounter();
});
document.addEventListener('firebaseFailed', () => {
    console.log("Firebase failed to load, initializing app without visitor counter.");
    initializeApp();
    if(visitorCountDisplay) visitorCountDisplay.querySelector('.count').textContent = 'R/S';
});