import fetch from 'node-fetch';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    const { url: instagramUrl } = request.body;
    
    if (!instagramUrl || !instagramUrl.includes('instagram.com')) {
        return response.status(400).json({ message: 'URL Instagram tidak valid.' });
    }

    // URL API baru dari RikiShop
    const externalApiUrl = `https://api.rikishop.my.id/download/instagram?url=${encodeURIComponent(instagramUrl)}`;

    try {
        const apiResponse = await fetch(externalApiUrl);
        const data = await apiResponse.json();

        // Cek status dari API baru
        if (!apiResponse.ok || data.status !== true) {
            const errorMessage = (data.result && typeof data.result === 'string')
                ? data.result
                : (data.message || 'Gagal mengambil data dari API RikiShop.');
            throw new Error(errorMessage);
        }

        // Kirim kembali hanya bagian "result" (yang berisi object `source` dan `medias`)
        response.status(200).json(data.result);

    } catch (error) {
        console.error("Error pada API Instagram:", error);
        response.status(500).json({ message: error.message || 'Terjadi kesalahan di server.' });
    }
}

