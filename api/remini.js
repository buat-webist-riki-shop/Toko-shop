import fetch from 'node-fetch';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    const { url, type } = request.body;
    if (!url || !type) {
        return response.status(400).json({ message: 'Parameter "url" dan "type" wajib diisi.' });
    }

    let externalApiUrl = '';
    let apiName = '';

    // Pilih API sesuai type
    switch (type) {
        case 'remini':
            apiName = 'Remini';
            externalApiUrl = `https://newapiriki.vercel.app/imagecreator/remini?apikey=rikinew&url=${encodeURIComponent(url)}`;
            break;
        default:
            return response.status(400).json({ message: 'Tipe downloader tidak valid.' });
    }

    try {
        const apiResponse = await fetch(externalApiUrl);
        const data = await apiResponse.json();

        if (!apiResponse.ok || !data.status) {
            const errorMessage = data.result && typeof data.result === 'string'
                ? data.result
                : `Gagal mengambil data dari API ${apiName}.`;
            throw new Error(errorMessage);
        }

        // ✅ API kamu selalu return {status:true, result:"link"}
        response.status(200).json({ result: data.result });

    } catch (error) {
        console.error(`Error pada API ${apiName}:`, error);
        response.status(500).json({ message: error.message || 'Terjadi kesalahan di server.' });
    }
}