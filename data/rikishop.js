let youtubePlayer;
let isYouTubeApiReady = false;

function onYouTubeIframeAPIReady() { isYouTubeApiReady = true; }
(function() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
})();

const WA_ADMIN_NUMBER = "6285771555374";
const WA_SELLER_NUMBER = "6285771555374";
const CREATOR_USERNAME = "Riki Shop Real";
const SOSMED_LINK = "https://rikishopreal.vercel.app";
const TESTIMONI_LINK = "https://rikishopreal.vercel.app/testimoni";
const SALURAN_WA_LINK = "https://whatsapp.com/channel/0029VaP4QyV3WHTgYm4pS23Z";

// --- Elemen DOM ---
const welcomeScreen = document.getElementById('welcomeScreen');
const mainContainer = document.getElementById('mainContainer');
const serviceGrid = document.getElementById('serviceGrid');
const offcanvasMenu = document.getElementById('offcanvasMenu');
const overlay = document.getElementById('overlay');
const openMenuBtn = document.getElementById('openMenu');
const closeMenuBtn = document.getElementById('closeMenu');
const openCartBtn = document.getElementById('openCart');
const cartCountSpan = document.getElementById('cartCount');
const currentDateTimeSpan = document.getElementById('currentDateTime');
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
let products = {};
let siteSettings = {};
let cart = JSON.parse(localStorage.getItem('rikishop_cart')) || [];
let currentPage = 'home-page';
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-rikishop';

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
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
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
            transaction.set(visitorDocRef, {
                count: currentCount + 1
            }, {
                merge: true
            });
        });
    } catch (error) {
        console.error("Error pada Firebase Visitor Counter:", error);
        visitorCountSpan.textContent = 'Error';
    }
}

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
    themeSwitchBtn.querySelector('i').className = document.body.classList.contains('dark-mode') ? 'fas fa-moon' : 'fas fa-sun';
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

function showPage(pageId) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    currentPage = pageId;
    mainContainer.scrollTop = 0;
}

function updateDateTime() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    currentDateTimeSpan.innerHTML = `<span class="date">${formattedDate}</span><br><span class="time">${formattedTime}</span>`;
}

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

function getPhoneNumberForProduct(product, serviceType) {
    if (product && product.nomorWA) return product.nomorWA;
    if (siteSettings.categoryPhoneNumbers && siteSettings.categoryPhoneNumbers[serviceType] && siteSettings.categoryPhoneNumbers[serviceType] !== "") {
        return siteSettings.categoryPhoneNumbers[serviceType];
    }
    if (siteSettings.globalPhoneNumber) {
        return siteSettings.globalPhoneNumber;
    }
    return WA_ADMIN_NUMBER;
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
        dots[index].classList.add("active");
    }
    if (bannerInterval) clearInterval(bannerInterval);
    bannerInterval = setInterval(() => goToSlide((currentBannerIndex + 1) % bannerItems.length), 4000);
}

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
    if (link.dataset.page) {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(link.dataset.page);
            closeOffcanvas();
        });
    }
});
openAboutUsModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    aboutUsModal.style.display = 'flex';
    closeOffcanvas();
});
closeAboutUsModalBtn.addEventListener('click', () => aboutUsModal.style.display = 'none');
openChatAiModalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    chatAiModal.style.display = 'flex';
    closeOffcanvas();
});
closeChatAiModalBtn.addEventListener('click', () => chatAiModal.style.display = 'none');
closeGenericScriptMenuModalBtn.addEventListener('click', () => genericScriptMenuModal.style.display = 'none');
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) event.target.style.display = 'none';
});

function loadServiceProducts(serviceType) {
    serviceDetailPageTitle.textContent = serviceType;
    productListDiv.innerHTML = '';
    productDetailViewDiv.style.display = 'none';
    const productData = products[serviceType] || [];
    if (productData.length > 0) {
        productData.forEach(product => {
            const productItem = document.createElement('div');
            productItem.classList.add('product-item');
            const isNew = product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) < 24 * 60 * 60 * 1000;
            let finalPrice = product.harga;
            const originalPrice = product.hargaAsli;
            if (product.discountEndDate && new Date(product.discountEndDate) < new Date()) {
                finalPrice = originalPrice;
            }
            let priceDisplay = `<span class="product-price-list">${formatRupiah(finalPrice)}</span>`;
            if (originalPrice && originalPrice > finalPrice) {
                priceDisplay = `<span class="original-price"><del>${formatRupiah(originalPrice)}</del></span> <span class="discounted-price">${formatRupiah(finalPrice)}</span>`;
            }
            productItem.innerHTML = `
                <div>
                    <span class="product-name">${product.nama} ${isNew ? '<span class="new-badge">NEW</span>' : ''}</span>
                    <p class="product-short-desc">${product.deskripsiPanjang ? product.deskripsiPanjang.split('||')[0].trim() + '...' : ''}</p>
                    ${priceDisplay}
                </div>
                <i class="fas fa-chevron-right"></i>`;
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
    if (product.discountEndDate && new Date(product.discountEndDate) < new Date()) {
        finalPrice = originalPrice;
    }
    detailProductPrice.innerHTML = (originalPrice && originalPrice > finalPrice) ?
        `<span class="original-price"><del>${formatRupiah(originalPrice)}</del></span> <span class="discounted-price">${formatRupiah(finalPrice)}</span>` :
        formatRupiah(finalPrice);
    detailProductActions.innerHTML = '';

    if (countdownInterval) clearInterval(countdownInterval);
    if (product.discountEndDate && new Date(product.discountEndDate) > new Date()) {
        countdownTimerDiv.style.display = 'block';
        const endTime = new Date(product.discountEndDate).getTime();
        const updateTimer = () => {
            const distance = endTime - new Date().getTime();
            if (distance < 0) {
                clearInterval(countdownInterval);
                countdownTimerDiv.innerHTML = '<div class="timer-title">Diskon Berakhir</div>';
                detailProductPrice.innerHTML = formatRupiah(originalPrice);
                return;
            }
            const d = Math.floor(distance / (86400000));
            const h = Math.floor((distance % 86400000) / 3600000);
            const m = Math.floor((distance % 3600000) / 60000);
            const s = Math.floor((distance % 60000) / 1000);
            document.getElementById('countdown-display').textContent = `${d}h ${h}j ${m}m ${s}d`;
        };
        updateTimer();
        countdownInterval = setInterval(updateTimer, 1000);
    } else {
        countdownTimerDiv.style.display = 'none';
    }

    const targetPhoneNumber = getPhoneNumberForProduct(product, serviceType);
    const buyNowLink = document.createElement('a');
    buyNowLink.className = 'buy-now';
    buyNowLink.textContent = 'Beli Sekarang';
    buyNowLink.target = "_blank";

    const updateBuyNowLink = (selectedImageUrl = null) => {
        let baseMessage = `Halo Kak, saya tertarik memesan produk:\n\nProduk: *${product.nama}*\nHarga: *${formatRupiah(finalPrice)}*\n\n`;
        if (selectedImageUrl) {
            baseMessage += `Gambar yang dipilih:\n${selectedImageUrl}\n\n`;
        }
        baseMessage += `Mohon info selanjutnya. Terima kasih! 🙏`;
        buyNowLink.href = `https://wa.me/${targetPhoneNumber}?text=${encodeURIComponent(baseMessage)}`;
    };

    updateBuyNowLink((product.images && product.images.length > 0) ? product.images[0] : null);

    if ((serviceType === 'Stock Akun' || serviceType === 'Logo') && product.images && product.images.length > 0) {
        stockImageSliderContainer.style.display = 'block';
        detailProductDescriptionContent.innerHTML = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/\|\|/g, '<br>') : 'Tidak ada deskripsi.';
        stockImageSlider.innerHTML = '';
        product.images.forEach((imgUrl, index) => {
            const slideContainer = document.createElement('div');
            slideContainer.className = 'image-slide-container';
            const slide = document.createElement('div');
            slide.className = 'image-slide';
            slide.style.backgroundImage = `url('${imgUrl}')`;
            slide.addEventListener('click', () => openLightbox(imgUrl));
            slideContainer.appendChild(slide);

            if (serviceType === 'Logo') {
                const chooseBtn = document.createElement('button');
                chooseBtn.className = 'choose-image-btn';
                chooseBtn.textContent = `Pilih Gambar #${index + 1}`;
                chooseBtn.onclick = () => {
                    updateBuyNowLink(imgUrl);
                    showToastNotification(`Gambar #${index + 1} dipilih untuk dikirim ke WhatsApp.`);
                    document.querySelectorAll('.choose-image-btn').forEach(b => b.classList.remove('selected'));
                    chooseBtn.classList.add('selected');
                };
                slideContainer.appendChild(chooseBtn);
            }
            stockImageSlider.appendChild(slideContainer);
        });
        totalStockImages = product.images.length;
        currentStockImageIndex = 0;
        updateSliderPosition();
    } else {
        stockImageSliderContainer.style.display = 'none';
        detailProductDescriptionContent.innerHTML = product.deskripsiPanjang ? product.deskripsiPanjang.replace(/\|\|/g, '<br>') : 'Tidak ada deskripsi.';
    }

    const addToCartBtn = document.createElement('button');
    addToCartBtn.className = 'add-to-cart';
    addToCartBtn.textContent = 'Tambah ke Keranjang';
    Object.assign(addToCartBtn.dataset, {
        productId: product.id,
        productName: product.nama,
        productPrice: finalPrice,
        serviceType: serviceType
    });
    addToCartBtn.addEventListener('click', addToCart);
    detailProductActions.appendChild(addToCartBtn);
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
sliderNextBtn.addEventListener('click', showNextImage);
sliderPrevBtn.addEventListener('click', showPrevImage);
lightboxClose.addEventListener('click', closeLightbox);
imageLightbox.addEventListener('click', (e) => {
    if (e.target === imageLightbox) closeLightbox();
});

backArrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
        if (currentPage === 'service-detail-page' && productDetailViewDiv.style.display === 'block') {
            productListDiv.style.display = 'block';
            productDetailViewDiv.style.display = 'none';
        } else {
            showPage(arrow.dataset.backTo || 'home-page');
        }
    });
});

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
    const {
        productId,
        productName,
        productPrice,
        serviceType
    } = event.target.dataset;
    const id = parseInt(productId),
        price = parseInt(productPrice);
    const existingItem = cart.find(item => item.id === id);
    if (serviceType === 'Stock Akun') {
        if (existingItem) {
            showToastNotification('Stok Akun hanya bisa dibeli 1 kali.', 'fa-exclamation-circle');
            return;
        }
        cart.push({
            id,
            name: productName,
            price,
            quantity: 1,
            serviceType
        });
    } else {
        if (existingItem) existingItem.quantity++;
        else cart.push({
            id,
            name: productName,
            price,
            quantity: 1,
            serviceType
        });
    }
    localStorage.setItem('rikishop_cart', JSON.stringify(cart));
    updateCartCount();
    showToastNotification(`<b>${productName}</b> ditambahkan ke keranjang.`);
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
            let itemActionsHTML = (item.serviceType === 'Stock Akun') ? `
                <div class="item-actions">
                    <span class="stock-info">Hanya 1 Stok</span>
                    <button type="button" class="remove-item-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash-alt"></i> Hapus</button>
                </div>` : `
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button type="button" class="quantity-btn" onclick="decreaseQuantity(${item.id})">-</button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button type="button" class="quantity-btn" onclick="increaseQuantity(${item.id})">+</button>
                    </div>
                    <button type="button" class="remove-item-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash-alt"></i> Hapus</button>
                </div>`;
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
        if (item.quantity <= 0) removeFromCart(productId);
        else {
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
openCartBtn.addEventListener('click', () => {
    showPage('cart-page');
    renderCart();
});
checkoutButton.addEventListener('click', () => {
    if (cart.length === 0) return;
    let itemsText = cart.map((item, index) => `*${index + 1}. ${item.name}*\n   (${formatRupiah(item.price)}) x ${item.quantity}`).join('\n');
    let totalOrder = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let message = `Halo Kak, saya ingin mengonfirmasi pesanan:\n\n--- PESANAN ---\n${itemsText}\n--------------------\n\n*Total: ${formatRupiah(totalOrder)}*\n\nMohon konfirmasinya. Terima kasih! 🙏`;
    window.open(`https://wa.me/${siteSettings.globalPhoneNumber || WA_ADMIN_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
});

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
    if (lowerInput.match(/\bselamat (pagi|siang|sore|malam)\b/)) {
        const time = lowerInput.match(/\b(pagi|siang|sore|malam)\b/)[0];
        return `Selamat ${time} juga. Ada yang bisa saya bantu di Rikishop?`;
    }
    if (lowerInput.match(/^(halo|hai|hi|hallo)$/)) return `Halo juga! Ada yang bisa saya bantu terkait layanan di Rikishop?`;
    if (lowerInput.includes('terima kasih')) return `Sama-sama! Jika ada pertanyaan lain, jangan ragu untuk bertanya lagi.`;
    if (lowerInput.includes('siapa namamu') || lowerInput.includes('kamu siapa')) return `Nama saya <b>Toko Riki AI</b>, asisten virtual yang siap membantu Anda di sini.`;
    if (lowerInput.includes('dibuat oleh') || lowerInput.includes('pembuat') || lowerInput.includes('pengembang') || lowerInput.includes('creator')) return `Saya dikembangkan oleh <b>${CREATOR_USERNAME}</b> untuk membantu para pelanggan mendapatkan informasi dengan cepat.`;
    if (lowerInput.includes('toko apa ini') || lowerInput.includes('rikishop itu apa')) return `<b>Rikishop</b> adalah platform penyedia layanan digital terlengkap. Kami fokus pada produk berkualitas seperti Panel Hosting, VPS, Script Bot, dan berbagai jasa digital lainnya dengan harga terjangkau.`;
    if (lowerInput.includes('aman') || lowerInput.includes('terpercaya') || lowerInput.includes('tipu')) return `Tentu! Keamanan dan kepercayaan pelanggan adalah prioritas utama kami. Semua transaksi dijamin aman dan produk yang kami jual memiliki kualitas terbaik. Anda bisa melihat testimoni dari pelanggan kami.`;
    if (lowerInput.includes('testi') || lowerInput.includes('testimoni')) return `Tentu, Anda bisa melihat semua testimoni pelanggan kami di halaman ini: <a href="${TESTIMONI_LINK}" target="_blank">${TESTIMONI_LINK}</a>`;
    if (lowerInput.includes('jual apa') || lowerInput.includes('produk apa') || lowerInput.includes('layanan')) {
        const categories = Object.keys(products).join(', ');
        return `Kami menyediakan berbagai layanan digital, antara lain: <b>${categories}</b>. Apakah ada kategori spesifik yang ingin Anda ketahui lebih lanjut?`;
    }
    if (lowerInput.includes('panel')) return `Kami menyediakan Panel Hosting dengan berbagai pilihan RAM, mulai dari 1GB hingga UNLIMITED. Server kami private, berkualitas, dan bergaransi. Cocok untuk menjalankan berbagai jenis bot.`;
    if (lowerInput.includes('vps')) return `Tentu, untuk VPS kami punya banyak pilihan spesifikasi RAM dan CPU. Setiap pembelian VPS akan mendapatkan bonus menarik seperti gratis install panel. Sangat cocok untuk kebutuhan server Anda.`;
    if (lowerInput.includes('script')) return `Kami menjual berbagai script fungsional seperti script push kontak, cpanel untuk reseller, bot Telegram, dan banyak lagi. Semua script sudah teruji dan siap pakai.`;
    if (lowerInput.includes('harga')) return `Untuk informasi harga yang paling akurat dan terbaru, silakan pilih kategori layanan yang Anda minati di halaman Beranda. Harga kami sangat kompetitif, mulai dari ribuan rupiah saja.`;
    if (lowerInput.includes('sosmed') || lowerInput.includes('sosial media') || lowerInput.includes('link')) return `Tentu, Anda bisa mengunjungi semua sosial media kami melalui link berikut: <a href="${SOSMED_LINK}" target="_blank">${SOSMED_LINK}</a>`;
    if (lowerInput.includes('kontak') || lowerInput.includes('admin') || lowerInput.includes('nomor')) return `Anda bisa menghubungi admin kami langsung melalui WhatsApp di nomor <a href="https://wa.me/${WA_ADMIN_NUMBER}" target="_blank">${WA_ADMIN_NUMBER}</a>.`;
    if (lowerInput.includes('grup') || lowerInput.includes('channel') || lowerInput.includes('saluran')) return `Tentu, Anda bisa bergabung dengan Saluran WhatsApp kami untuk info dan promo terbaru di sini: <a href="${SALURAN_WA_LINK}" target="_blank">Gabung Saluran WA</a>.`;
    return `Maaf, saya hanya bisa membantu dengan pertanyaan seputar Rikishop. Coba tanyakan tentang: <br>• Keamanan toko <br>• Informasi produk (Panel, VPS, dll) <br>• Harga umum <br>• Kontak admin & sosial media`;
}

function appendMessageToChatPage(text, className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.innerHTML = text.replace(/\n/g, '<br>');
    chatAiMessagesPage.appendChild(messageDiv);
    chatAiMessagesPage.scrollTop = chatAiMessagesPage.scrollHeight;
}
sendChatAiBtnPage.addEventListener('click', handleSendChatMessagePage);
chatAiInputPage.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendChatMessagePage();
    }
});

openMusicPopupBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    musicPlayerPopup.classList.add('active');
    musicPlayerOverlay.classList.add('active');
});

function closeMusicPlayerPopup() {
    musicPlayerPopup.classList.remove('active');
    musicPlayerOverlay.classList.remove('active');
}
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
            showToastNotification("Link YouTube tidak valid.", "fa-times-circle");
        }
    } catch (error) {
        showToastNotification("Format link tidak dikenal.", "fa-times-circle");
    }
});

function createYouTubePlayer(videoId) {
    const checkApiReady = setInterval(() => {
        if (isYouTubeApiReady) {
            clearInterval(checkApiReady);
            if (youtubePlayer && typeof youtubePlayer.destroy === 'function') youtubePlayer.destroy();
            mediaPlayerContainer.innerHTML = '<div id="youtube-player-embed"></div>';
            youtubePlayer = new YT.Player('youtube-player-embed', {
                videoId: videoId,
                playerVars: {
                    'autoplay': 1,
                    'controls': 0,
                    'rel': 0
                },
                events: {
                    'onReady': (e) => e.target.playVideo(),
                    'onStateChange': (e) => {
                        if (e.data === YT.PlayerState.PLAYING) closeMusicPlayerPopup();
                    }
                }
            });
        }
    }, 100);
}

function playBackgroundMusic() {
    if (backgroundAudio.src && !backgroundAudio.muted && backgroundAudio.paused) backgroundAudio.play().catch(e => {});
}

async function initializeApp() {
    mainContainer.style.display = 'none';
    try {
        const ts = Date.now();
        const [productsResponse, settingsResponse, categoryMetaResponse] = await Promise.all([
            fetch(`data/isi_json/products.json?v=${ts}`),
            fetch(`data/isi_json/settings.json?v=${ts}`),
            fetch(`data/isi_json/category_meta.json?v=${ts}`)
        ]);
        if (!productsResponse.ok) throw new Error(`Gagal memuat produk.`);
        products = await productsResponse.json();
        if (settingsResponse.ok) siteSettings = await settingsResponse.json();
        if (categoryMetaResponse.ok) renderServiceGrid(await categoryMetaResponse.json());
        else renderServiceGrid({});
    } catch (error) {
        console.error("Gagal memuat data awal:", error);
        serviceGrid.innerHTML = `<p style="text-align:center; color:red;">Gagal memuat data.</p>`;
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);
    updateCartCount();
    welcomeScreen.style.display = 'flex';
    let progress = 0;
    const pBar = document.getElementById("progressBar"),
        pText = document.getElementById("progress-text");
    const interval = setInterval(() => {
        progress += 5;
        pBar.style.width = progress + "%";
        pText.textContent = progress + "%";
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                welcomeScreen.classList.add("fade-out");
                welcomeScreen.addEventListener('transitionend', () => {
                    welcomeScreen.style.display = "none";
                    mainContainer.style.display = "flex";
                    showPage('home-page');
                    setupBannerCarousel();
                }, {
                    once: true
                });
            }, 400);
        }
    }, 80);
}

function renderServiceGrid(categoryMetaData) {
    serviceGrid.innerHTML = '';
    const categories = Object.keys(products);
    categories.forEach(cat => {
        const iconUrl = categoryMetaData[cat] || 'logo.jpg';
        const serviceLink = document.createElement('a');
        serviceLink.href = "#";
        serviceLink.className = "service-item";
        serviceLink.dataset.service = cat;
        serviceLink.innerHTML = `<img src="${iconUrl}" alt="${cat} Icon"><span>${cat}</span>`;
        serviceLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadServiceProducts(cat);
            showPage('service-detail-page');
        });
        serviceGrid.appendChild(serviceLink);
    });
}

document.addEventListener('firebaseReady', () => {
    initializeApp();
    setupFirebaseVisitorCounter();
});
document.addEventListener('firebaseFailed', () => {
    initializeApp();
    if (visitorCountDisplay) visitorCountDisplay.querySelector('.count').textContent = 'R/S';
});