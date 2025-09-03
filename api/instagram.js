import fetch from 'node-fetch';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    const { url: instagramUrl } = request.body;
    const apiKey = "free"; // Sesuai dengan contoh API Anda
    
    if (!instagramUrl || !instagramUrl.includes('instagram.com')) {
        return response.status(400).json({ message: 'URL Instagram tidak valid.' });
    }

    // URL API eksternal untuk Instagram
    const externalApiUrl = `https://api-simplebot.vercel.app/download/instagram?apikey=${apiKey}&url=${encodeURIComponent(instagramUrl)}`;

    try {
        const apiResponse = await fetch(externalApiUrl);
        const data = await apiResponse.json();

        if (!apiResponse.ok || !data.status) {
            // Jika ada pesan error dari API, gunakan itu
            const errorMessage = data.result && typeof data.result === 'string' 
                ? data.result 
                : 'Gagal mengambil data dari API eksternal.';
            throw new Error(errorMessage);
        }

        // Kirim kembali hanya bagian "result" (yang berupa array) ke frontend
        response.status(200).json(data.result);

    } catch (error) {
        console.error("Error pada API Instagram:", error);
        response.status(500).json({ message: error.message || 'Terjadi kesalahan di server.' });
    }
}