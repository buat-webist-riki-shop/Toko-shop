import { Octokit } from "@octokit/rest";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const PRODUCTS_FILE_PATH = 'data/isi_json/products.json';
const PROMO_FILE_PATH = 'data/isi_json/promos.json';
const SETTINGS_FILE_PATH = 'data/isi_json/settings.json';

async function getGithubFile(octokit, owner, repo, path) {
    try {
        const { data } = await octokit.repos.getContent({ owner, repo, path });
        return {
            sha: data.sha,
            json: JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'))
        };
    } catch (error) {
        if (error.status === 404) {
             return { sha: null, json: {} };
        }
        throw error;
    }
}

async function updateGithubFile(octokit, owner, repo, path, sha, json, message) {
    const content = Buffer.from(JSON.stringify(json, null, 4)).toString('base64');
    await octokit.repos.createOrUpdateFileContents({
        owner, repo, path, sha, message, content,
    });
}

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    const { action, data } = request.body;
    if (!action) {
        return response.status(400).json({ message: 'Aksi (action) wajib diisi.' });
    }

    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    try {
        if (action === 'updateSettings') {
            const { sha } = await getGithubFile(octokit, REPO_OWNER, REPO_NAME, SETTINGS_FILE_PATH);
            await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, SETTINGS_FILE_PATH, sha, data, 'feat: Memperbarui pengaturan situs');
            return response.status(200).json({ message: 'Pengaturan berhasil disimpan!' });
        }

        if (action.startsWith('promo')) {
            const { sha, json: promosJson } = await getGithubFile(octokit, REPO_OWNER, REPO_NAME, PROMO_FILE_PATH);
            
            switch(action) {
                case 'promoValidate': {
                    const { code, context } = data;
                    const upperCaseCode = code.toUpperCase();
                    const promoData = promosJson[upperCaseCode];

                    if (!promoData) return response.status(404).json({ message: 'Kode promo tidak ditemukan.' });
                    if (new Date(promoData.expires) < new Date()) return response.status(410).json({ message: 'Kode promo sudah kedaluwarsa.' });
                    if (promoData.maxUses !== 0 && promoData.uses >= promoData.maxUses) return response.status(409).json({ message: 'Kode promo sudah habis digunakan.' });

                    if (promoData.allowedCategories && promoData.allowedCategories.length > 0) {
                        if (!context || !context.type) return response.status(400).json({ message: 'Konteks produk/keranjang dibutuhkan.' });
                        
                        const allowedCatsText = `<strong>${promoData.allowedCategories.join(', ')}</strong>`;

                        if (context.type === 'product') {
                            if (!context.category || !promoData.allowedCategories.includes(context.category)) {
                                // MODIFIKASI: Pesan error baru yang lebih spesifik untuk halaman produk
                                const newErrorMessage = `Maaf, kode ini khusus kategori ${allowedCatsText}, tidak bisa digunakan di kategori ini. Harap gunakan di kategori yang sudah diatur oleh admin, yaitu ${allowedCatsText}.`;
                                return response.status(403).json({ message: newErrorMessage });
                            }
                        }
                        
                        if (context.type === 'cart') {
                            if (!context.categories || context.categories.length === 0) {
                                return response.status(403).json({ message: `Keranjang Anda tidak berisi produk dari kategori yang diizinkan (${allowedCatsText}).` });
                            }
                            const cartCategories = new Set(context.categories);
                            const isAllowed = promoData.allowedCategories.some(cat => cartCategories.has(cat));
                            if (!isAllowed) {
                                // MODIFIKASI: Pesan error baru yang lebih spesifik untuk halaman keranjang
                                const newErrorMessage = `Maaf, kode ini khusus untuk kategori ${allowedCatsText}. Pastikan setidaknya ada satu produk dari kategori tersebut di keranjang Anda.`;
                                return response.status(403).json({ message: newErrorMessage });
                            }
                        }
                    }

                    return response.status(200).json({ 
                        message: `Promo ${promoData.percentage}% berhasil diterapkan!`,
                        code: upperCaseCode,
                        percentage: promoData.percentage,
                        allowedCategories: promoData.allowedCategories || []
                    });
                }
                case 'promoGetAll': {
                    return response.status(200).json(promosJson);
                }
                case 'promoAdd': {
                    const { code, percentage, expires, maxUses, allowedCategories } = data;
                    const upperCaseCode = code.toUpperCase();
                    if (promosJson[upperCaseCode]) {
                        return response.status(409).json({ message: `Kode promo "${upperCaseCode}" sudah ada.` });
                    }
                    promosJson[upperCaseCode] = { code: upperCaseCode, percentage, expires, maxUses: parseInt(maxUses, 10), uses: 0, allowedCategories };
                    await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, PROMO_FILE_PATH, sha, promosJson, `feat: Menambah kode promo ${upperCaseCode}`);
                    return response.status(200).json({ message: 'Kode promo berhasil ditambahkan!' });
                }
                case 'promoDelete': {
                    const { code } = data;
                    if (!promosJson[code]) {
                        return response.status(404).json({ message: `Kode promo "${code}" tidak ditemukan.` });
                    }
                    delete promosJson[code];
                    await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, PROMO_FILE_PATH, sha, promosJson, `feat: Menghapus kode promo ${code}`);
                    return response.status(200).json({ message: 'Kode promo berhasil dihapus.' });
                }
                default:
                    return response.status(400).json({ message: 'Aksi promo tidak valid.' });
            }
        }

        const { sha, json: productsJson } = await getGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_FILE_PATH);

        switch (action) {
            case 'addProduct': {
                if (!data.category) return response.status(400).json({ message: 'Kategori harus dipilih.' });
                let maxId = 0;
                Object.values(productsJson).flat().forEach(p => { if (p.id > maxId) maxId = p.id; });
                
                const newProduct = {
                    id: maxId + 1,
                    nama: data.nama,
                    harga: data.harga,
                    hargaAsli: data.harga,
                    deskripsiPanjang: data.deskripsiPanjang.replace(/\n/g, ' || '),
                    createdAt: new Date().toISOString(),
                    nomorWA: data.nomorWA || "",
                    images: data.images || [],
                    menuContent: data.menuContent || ""
                };
                if (!productsJson[data.category]) productsJson[data.category] = [];
                productsJson[data.category].unshift(newProduct);
                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_FILE_PATH, sha, productsJson, `feat: Menambahkan produk "${data.nama}"`);
                return response.status(200).json({ message: 'Produk berhasil ditambahkan!' });
            }

            case 'updateProduct': {
                const { id, category } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });

                let productFound = false;
                productsJson[category] = productsJson[category].map(p => {
                    if (p.id === id) {
                        productFound = true;
                        return { ...p, ...data };
                    }
                    return p;
                });

                if (!productFound) return response.status(404).json({ message: 'Produk tidak ditemukan.' });

                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_FILE_PATH, sha, productsJson, `feat: Memperbarui produk ID ${id}`);
                return response.status(200).json({ message: 'Produk berhasil diperbarui!' });
            }

            case 'deleteProduct': {
                const { id, category } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });
                
                const initialLength = productsJson[category].length;
                productsJson[category] = productsJson[category].filter(p => p.id !== id);

                if (productsJson[category].length === initialLength) return response.status(404).json({ message: 'Produk tidak ditemukan.' });

                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_FILE_PATH, sha, productsJson, `feat: Menghapus produk ID ${id}`);
                return response.status(200).json({ message: 'Produk berhasil dihapus.' });
            }
            
            case 'addCategory': {
                const { categoryName } = data;
                if (!categoryName) return response.status(400).json({ message: 'Nama kategori wajib diisi.' });
                if (productsJson[categoryName]) return response.status(409).json({ message: 'Kategori dengan nama tersebut sudah ada.' });
                
                productsJson[categoryName] = [];
                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_FILE_PATH, sha, productsJson, `feat: Menambah kategori baru "${categoryName}"`);
                return response.status(200).json({ message: 'Kategori berhasil ditambahkan!' });
            }

            case 'deleteCategory': {
                const { categoryName } = data;
                if (!categoryName) return response.status(400).json({ message: 'Nama kategori wajib diisi.' });
                if (typeof productsJson[categoryName] === 'undefined') return response.status(404).json({ message: 'Kategori tidak ditemukan.' });
                
                delete productsJson[categoryName];
                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_FILE_PATH, sha, productsJson, `feat: Menghapus kategori "${categoryName}"`);
                return response.status(200).json({ message: 'Kategori berhasil dihapus.' });
            }

            case 'reorderProducts': {
                const { category, order } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });
                
                const productMap = new Map(productsJson[category].map(p => [p.id, p]));
                productsJson[category] = order.map(id => productMap.get(id)).filter(Boolean);

                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_FILE_PATH, sha, productsJson, `feat: Mengurutkan ulang kategori ${category}`);
                return response.status(200).json({ message: 'Urutan berhasil disimpan.' });
            }
            
            case 'updateProductsInCategory': {
                const { category, newPrice } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });

                productsJson[category] = productsJson[category].map(p => {
                    p.harga = newPrice;
                    p.discountPrice = null;
                    p.discountEndDate = null;
                    return p;
                });
                
                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_FILE_PATH, sha, productsJson, `feat: Update harga massal kategori ${category}`);
                return response.status(200).json({ message: `Harga untuk kategori "${category}" berhasil diubah.` });
            }

            case 'resetCategoryPrices': {
                const { category } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });

                productsJson[category] = productsJson[category].map(p => {
                    if (p.hargaAsli) p.harga = p.hargaAsli;
                    p.discountPrice = null;
                    p.discountEndDate = null;
                    return p;
                });

                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_FILE_PATH, sha, productsJson, `feat: Reset harga kategori ${category}`);
                return response.status(200).json({ message: `Harga untuk kategori "${category}" berhasil dikembalikan.` });
            }

            default:
                return response.status(400).json({ message: 'Aksi tidak valid.' });
        }

    } catch (error) {
        console.error(`Error pada aksi "${action}":`, error);
        return response.status(500).json({ message: 'Terjadi kesalahan di server.', error: error.message });
    }
}