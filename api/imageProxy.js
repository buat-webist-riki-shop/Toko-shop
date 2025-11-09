import fetch from 'node-fetch';

export default async function handler(request, response) {
    const { url } = request.query;
    if (!url) return response.status(400).send('URL parameter is required.');

    try {
        const allowedDomains = [
            'tiktokcdn.com', 
            'rapidcdn.app', 
            'cdninstagram.com',
            'pixhost.to',
            'replicate.delivery',
            'cdn.instasave.website' // <-- DOMAIN BARU DITAMBAHKAN
        ];
        
        const urlHost = new URL(url).hostname;
        
        // Cek apakah host diizinkan
        if (!allowedDomains.some(domain => urlHost.endsWith(domain))) {
             console.warn(`Domain ditolak oleh Image Proxy: ${urlHost}`);
             return response.status(403).send('Domain not allowed.');
        }

        const externalResponse = await fetch(url, {
             headers: {
                // Tambahkan Referer untuk beberapa CDN yang membutuhkannya
                'Referer': 'https://www.instagram.com/'
            }
        });
        
        if (!externalResponse.ok) return response.status(externalResponse.status).send('Failed to fetch image.');
        
        const contentType = externalResponse.headers.get('content-type');
        response.setHeader('Content-Type', contentType || 'image/jpeg');
        
        externalResponse.body.pipe(response);

    } catch (error) {
        console.error("Image Proxy Error:", error);
        response.status(500).send('Error processing image request.');
    }
}