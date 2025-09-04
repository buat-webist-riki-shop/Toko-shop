import { Octokit } from "@octokit/rest";

async function getGithubFile(octokit, owner, repo, path) {
    try {
        const { data } = await octokit.repos.getContent({ owner, repo, path });
        return {
            sha: data.sha,
            json: JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'))
        };
    } catch (error) {
        if (error.status === 404) {
            // Jika file tidak ada, kembalikan struktur kosong agar bisa dibuat baru
            return { sha: null, json: {} };
        }
        throw error;
    }
}

async function createOrUpdateGithubFile(octokit, owner, repo, path, sha, json, message) {
    await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        sha,
        message,
        content: Buffer.from(JSON.stringify(json, null, 4)).toString('base64'),
    });
}

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    const { action, data } = request.body;
    if (!action || !data) {
        return response.status(400).json({ message: 'Aksi dan data wajib diisi.' });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER;
    const REPO_NAME = process.env.REPO_NAME;
    const PRODUCTS_PATH = 'data/isi_json/products.json';
    const CATEGORY_META_PATH = 'data/isi_json/category_meta.json';
    const PROMOS_PATH = 'data/isi_json/promos.json';

    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    try {
        // --- LOGIKA PROMO (DITANGANI PERTAMA) ---
        if (action === 'addPromo' || action === 'deletePromo') {
            const { sha, json: promosJson } = await getGithubFile(octokit, REPO_OWNER, REPO_NAME, PROMOS_PATH);
            
            if (action === 'addPromo') {
                const { code, type, value, expiresAt, maxUses } = data;
                if (!code || !type || !value) return response.status(400).json({ message: 'Data promo tidak lengkap.' });
                
                const upperCaseCode = code.toUpperCase();
                if (promosJson[upperCaseCode]) return response.status(409).json({ message: 'Kode promo sudah ada.' });

                promosJson[upperCaseCode] = {
                    type, value: Number(value), expiresAt: expiresAt || null,
                    maxUses: maxUses ? Number(maxUses) : null, totalUses: 0,
                    createdAt: new Date().toISOString()
                };
                await createOrUpdateGithubFile(octokit, REPO_OWNER, REPO_NAME, PROMOS_PATH, sha, promosJson, `feat: Menambahkan kode promo "${upperCaseCode}"`);
                return response.status(200).json({ message: 'Kode promo berhasil ditambahkan!' });
            }

            if (action === 'deletePromo') {
                const { code } = data;
                if (!promosJson[code]) return response.status(404).json({ message: 'Kode promo tidak ditemukan.' });
                
                delete promosJson[code];
                await createOrUpdateGithubFile(octokit, REPO_OWNER, REPO_NAME, PROMOS_PATH, sha, promosJson, `feat: Menghapus kode promo "${code}"`);
                return response.status(200).json({ message: 'Kode promo berhasil dihapus.' });
            }
        }

        // --- LOGIKA PRODUK & KATEGORI ---
        const { sha: productsSha, json: productsJson } = await getGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_PATH);
        
        switch (action) {
            case 'addProduct': {
                if (!data.category) return response.status(400).json({ message: 'Kategori harus dipilih.' });
                let maxId = 0;
                Object.values(productsJson).flat().forEach(p => { if (p.id > maxId) maxId = p.id; });
                
                const newProduct = {
                    id: maxId + 1,
                    nama: data.nama, harga: data.harga, hargaAsli: data.harga,
                    deskripsiPanjang: data.deskripsiPanjang.replace(/\n/g, ' || '),
                    createdAt: new Date().toISOString(), nomorWA: data.nomorWA || "",
                    images: data.images || [], menuContent: data.menuContent || ""
                };
                if (!productsJson[data.category]) productsJson[data.category] = [];
                productsJson[data.category].unshift(newProduct);
                
                await createOrUpdateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_PATH, productsSha, productsJson, `feat: Menambahkan produk "${data.nama}"`);
                return response.status(200).json({ message: 'Produk berhasil ditambahkan!' });
            }
            case 'updateProduct': {
                const { id, category } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });
                let productFound = false;
                productsJson[category] = productsJson[category].map(p => {
                    if (p.id === id) { productFound = true; return { ...p, ...data }; }
                    return p;
                });
                if (!productFound) return response.status(404).json({ message: 'Produk tidak ditemukan.' });
                await createOrUpdateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_PATH, productsSha, productsJson, `feat: Memperbarui produk ID ${id}`);
                return response.status(200).json({ message: 'Produk berhasil diperbarui!' });
            }
            case 'deleteProduct': {
                const { id, category } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });
                const initialLength = productsJson[category].length;
                productsJson[category] = productsJson[category].filter(p => p.id !== id);
                if (productsJson[category].length === initialLength) return response.status(404).json({ message: 'Produk tidak ditemukan.' });
                await createOrUpdateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_PATH, productsSha, productsJson, `feat: Menghapus produk ID ${id}`);
                return response.status(200).json({ message: 'Produk berhasil dihapus.' });
            }
            case 'addCategory': {
                const { categoryName, iconUrl } = data;
                if (!categoryName || !iconUrl) return response.status(400).json({ message: 'Nama dan Ikon kategori wajib diisi.' });
                if (productsJson[categoryName]) return response.status(409).json({ message: 'Kategori sudah ada.' });

                productsJson[categoryName] = [];
                await createOrUpdateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_PATH, productsSha, productsJson, `feat: Menambah kategori "${categoryName}"`);
                
                const { sha: metaSha, json: metaJson } = await getGithubFile(octokit, REPO_OWNER, REPO_NAME, CATEGORY_META_PATH);
                metaJson[categoryName] = iconUrl;
                await createOrUpdateGithubFile(octokit, REPO_OWNER, REPO_NAME, CATEGORY_META_PATH, metaSha, metaJson, `feat: Menambah ikon untuk kategori "${categoryName}"`);
                return response.status(200).json({ message: 'Kategori berhasil ditambahkan!' });
            }
            case 'deleteCategory': {
                const { categoryName } = data;
                if (typeof productsJson[categoryName] === 'undefined') return response.status(404).json({ message: 'Kategori tidak ditemukan.' });
                
                delete productsJson[categoryName];
                await createOrUpdateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_PATH, productsSha, productsJson, `feat: Menghapus kategori "${categoryName}"`);

                const { sha: metaSha, json: metaJson } = await getGithubFile(octokit, REPO_OWNER, REPO_NAME, CATEGORY_META_PATH);
                if (metaJson[categoryName]) {
                    delete metaJson[categoryName];
                    await createOrUpdateGithubFile(octokit, REPO_OWNER, REPO_NAME, CATEGORY_META_PATH, metaSha, metaJson, `feat: Menghapus ikon kategori "${categoryName}"`);
                }
                return response.status(200).json({ message: 'Kategori berhasil dihapus.' });
            }
            case 'reorderProducts': {
                const { category, order } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });
                const productMap = new Map(productsJson[category].map(p => [p.id, p]));
                productsJson[category] = order.map(id => productMap.get(id)).filter(Boolean);
                await createOrUpdateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_PATH, productsSha, productsJson, `feat: Mengurutkan ulang kategori ${category}`);
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
                await createOrUpdateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_PATH, productsSha, productsJson, `feat: Update harga massal kategori ${category}`);
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
                await createOrUpdateGithubFile(octokit, REPO_OWNER, REPO_NAME, PRODUCTS_PATH, productsSha, productsJson, `feat: Reset harga kategori ${category}`);
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