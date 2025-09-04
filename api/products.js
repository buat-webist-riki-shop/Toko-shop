import { Octokit } from "@octokit/rest";

// Fungsi helper untuk otentikasi dan mendapatkan konten file
async function getGithubFile(octokit, owner, repo, path) {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    return {
        sha: data.sha,
        json: JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'))
    };
}

// Fungsi helper untuk update file di GitHub
async function updateGithubFile(octokit, owner, repo, path, sha, json, message) {
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
        return response.status(400).json({ message: 'Aksi (action) dan data wajib diisi.' });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER;
    const REPO_NAME = process.env.REPO_NAME;
    const FILE_PATH = 'data/isi_json/products.json';

    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    try {
        const { sha, json: productsJson } = await getGithubFile(octokit, REPO_OWNER, REPO_NAME, FILE_PATH);

        switch (action) {
            // --- KASUS: MENAMBAHKAN PRODUK BARU ---
            case 'addProduct': {
                if (!data.category) {
                    return response.status(400).json({ message: 'Kategori harus dipilih.' });
                }
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
                
                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, FILE_PATH, sha, productsJson, `feat: Menambahkan produk "${data.nama}"`);
                return response.status(200).json({ message: 'Produk berhasil ditambahkan!' });
            }

            // --- KASUS: MENGEDIT PRODUK ---
            case 'updateProduct': {
                const { id, category } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });

                let productFound = false;
                productsJson[category] = productsJson[category].map(p => {
                    if (p.id === id) {
                        productFound = true;
                        return { ...p, ...data }; // Menggabungkan data lama dengan data baru
                    }
                    return p;
                });

                if (!productFound) return response.status(404).json({ message: 'Produk tidak ditemukan.' });

                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, FILE_PATH, sha, productsJson, `feat: Memperbarui produk ID ${id}`);
                return response.status(200).json({ message: 'Produk berhasil diperbarui!' });
            }

            // --- KASUS: MENGHAPUS PRODUK ---
            case 'deleteProduct': {
                const { id, category } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });
                
                const initialLength = productsJson[category].length;
                productsJson[category] = productsJson[category].filter(p => p.id !== id);

                if (productsJson[category].length === initialLength) return response.status(404).json({ message: 'Produk tidak ditemukan.' });

                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, FILE_PATH, sha, productsJson, `feat: Menghapus produk ID ${id}`);
                return response.status(200).json({ message: 'Produk berhasil dihapus.' });
            }
            
            // --- [MODIFIKASI #2] KASUS BARU: MENAMBAH KATEGORI ---
            case 'addCategory': {
                const { categoryName } = data;
                if (!categoryName) {
                    return response.status(400).json({ message: 'Nama kategori wajib diisi.' });
                }
                if (productsJson[categoryName]) {
                    return response.status(409).json({ message: 'Kategori dengan nama tersebut sudah ada.' });
                }
                productsJson[categoryName] = []; // Buat array kosong untuk produk baru
                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, FILE_PATH, sha, productsJson, `feat: Menambah kategori baru "${categoryName}"`);
                return response.status(200).json({ message: 'Kategori berhasil ditambahkan!' });
            }

            // --- [MODIFIKASI #2] KASUS BARU: MENGHAPUS KATEGORI ---
            case 'deleteCategory': {
                const { categoryName } = data;
                if (!categoryName) {
                    return response.status(400).json({ message: 'Nama kategori wajib diisi.' });
                }
                if (typeof productsJson[categoryName] === 'undefined') {
                    return response.status(404).json({ message: 'Kategori tidak ditemukan.' });
                }
                delete productsJson[categoryName]; // Hapus properti (kategori) dari objek
                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, FILE_PATH, sha, productsJson, `feat: Menghapus kategori "${categoryName}"`);
                return response.status(200).json({ message: 'Kategori berhasil dihapus.' });
            }

            // --- KASUS: MENGURUTKAN ULANG PRODUK ---
            case 'reorderProducts': {
                const { category, order } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });
                
                const productMap = new Map(productsJson[category].map(p => [p.id, p]));
                productsJson[category] = order.map(id => productMap.get(id)).filter(Boolean);

                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, FILE_PATH, sha, productsJson, `feat: Mengurutkan ulang kategori ${category}`);
                return response.status(200).json({ message: 'Urutan berhasil disimpan.' });
            }
            
            // --- KASUS: UPDATE HARGA MASSAL ---
            case 'updateProductsInCategory': {
                const { category, newPrice } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });

                productsJson[category] = productsJson[category].map(p => {
                    p.harga = newPrice;
                    p.discountPrice = null;
                    p.discountEndDate = null;
                    return p;
                });
                
                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, FILE_PATH, sha, productsJson, `feat: Update harga massal kategori ${category}`);
                return response.status(200).json({ message: `Harga untuk kategori "${category}" berhasil diubah.` });
            }

            // --- KASUS: KEMBALIKAN HARGA AWAL ---
            case 'resetCategoryPrices': {
                const { category } = data;
                if (!productsJson[category]) return response.status(404).json({ message: 'Kategori tidak ditemukan.' });

                productsJson[category] = productsJson[category].map(p => {
                    if (p.hargaAsli) p.harga = p.hargaAsli;
                    p.discountPrice = null;
                    p.discountEndDate = null;
                    return p;
                });

                await updateGithubFile(octokit, REPO_OWNER, REPO_NAME, FILE_PATH, sha, productsJson, `feat: Reset harga kategori ${category}`);
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