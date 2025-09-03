import { Octokit } from "@octokit/rest";

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    try {
        // [PERBAIKAN 1] Ambil SEMUA data yang dikirim dari browser
        const { globalPhoneNumber, categoryPhoneNumbers, apiKeyPurchaseNumber, apiKeyPrices } = request.body;
        
        // Validasi sederhana untuk memastikan data utama ada
        if (typeof globalPhoneNumber === 'undefined' || typeof categoryPhoneNumbers === 'undefined' || typeof apiKeyPurchaseNumber === 'undefined' || typeof apiKeyPrices === 'undefined') {
            return response.status(400).json({ message: 'Data yang dikirim tidak lengkap.' });
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const REPO_OWNER = process.env.REPO_OWNER;
        const REPO_NAME = process.env.REPO_NAME;
        const FILE_PATH = 'data/isi_json/settings.json';

        const octokit = new Octokit({ auth: GITHUB_TOKEN });

        // 1. Ambil file yang ada, termasuk konten dan SHA-nya
        const { data: fileData } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
        });

        // [PERBAIKAN 2] Baca konten file yang ada, jangan langsung menimpa
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const existingSettings = JSON.parse(content);

        // [PERBAIKAN 3] Buat objek pengaturan baru dengan menggabungkan data lama dan baru
        const updatedSettings = {
            ...existingSettings, // <-- Ini penting untuk mempertahankan data lain yang mungkin ada
            globalPhoneNumber,
            categoryPhoneNumbers,
            apiKeyPurchaseNumber,
            apiKeyPrices // <-- Menyimpan data harga API Key
        };

        // 2. Update file di GitHub dengan konten yang sudah lengkap
        await octokit.repos.createOrUpdateFileContents({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
            message: 'chore: Memperbarui pengaturan website', // Pesan commit lebih umum
            content: Buffer.from(JSON.stringify(updatedSettings, null, 4)).toString('base64'),
            sha: fileData.sha,
        });

        response.status(200).json({ message: 'Pengaturan berhasil disimpan!' });

    } catch (error) {
        console.error("Error updateSettings:", error);
        response.status(500).json({ message: 'Terjadi kesalahan di server.', error: error.message });
    }
}