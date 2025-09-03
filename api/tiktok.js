import fetch from 'node-fetch';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    const { url: tiktokUrl } = request.body;
    const apiKey = process.env.TIKTOK_API_KEY || "rikinew";
    
    if (!tiktokUrl || !tiktokUrl.includes('tiktok.com')) {
        return response.status(400).json({ message: 'URL TikTok tidak valid.' });
    }
    
    if (!apiKey) {
        return response.status(500).json({ message: 'API Key server tidak diatur.' });
    }

    // URL API eksternal yang Anda berikan
    const externalApiUrl = `https://newapiriki.vercel.app/download/tiktok?apikey=${apiKey}&url=${encodeURIComponent(tiktokUrl)}`;

    try {
        const apiResponse = await fetch(externalApiUrl);
        const data = await apiResponse.json();

        if (!apiResponse.ok || !data.status) {
            throw new Error(data.message || 'Gagal mengambil data dari API eksternal.');
        }

        // Kirim kembali hanya bagian "result" ke frontend
        response.status(200).json(data.result);

    } catch (error) {
        console.error("Error pada API TikTok:", error);
        response.status(500).json({ message: error.message || 'Terjadi kesalahan di server.' });
    }
}