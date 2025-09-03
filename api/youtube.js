import fetch from 'node-fetch';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    const { url: youtubeUrl } = request.body;
    const apiKey = "free";
    
    if (!youtubeUrl || (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be'))) {
        return response.status(400).json({ message: 'URL YouTube tidak valid.' });
    }

    // URL API eksternal untuk YouTube MP3
    const externalApiUrl = `https://api-simplebot.vercel.app/download/ytmp4?apikey=${apiKey}&url=${encodeURIComponent(youtubeUrl)}`;

    try {
        const apiResponse = await fetch(externalApiUrl);
        const data = await apiResponse.json();

        if (!apiResponse.ok || !data.status) {
            throw new Error(data.result || 'Gagal mengambil data dari API eksternal.');
        }

        // Kirim kembali hanya bagian "result" (yang berupa link MP3) ke frontend
        response.status(200).json(data.result);

    } catch (error) {
        console.error("Error pada API YouTube:", error);
        response.status(500).json({ message: error.message || 'Terjadi kesalahan di server.' });
    }
}