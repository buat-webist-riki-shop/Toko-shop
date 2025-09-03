import fetch from 'node-fetch';

export default async function handler(request, response) {
    const { url } = request.query;
    if (!url) return response.status(400).send('URL parameter is required.');

    try {
        const allowedDomains = [
            'tiktokcdn.com', 
            'rapidcdn.app', 
            'cdninstagram.com',
            'pixhost.to',           // Jika Anda menggunakan Pixhost untuk upload gambar
            'replicate.delivery'    // <-- DOMAIN PENTING UNTUK HASIL HD
        ];
        const urlHost = new URL(url).hostname;
        if (!allowedDomains.some(domain => urlHost.endsWith(domain))) {
             return response.status(403).send('Domain not allowed.');
        }

        const externalResponse = await fetch(url);
        if (!externalResponse.ok) return response.status(externalResponse.status).send('Failed to fetch image.');
        
        const contentType = externalResponse.headers.get('content-type');
        response.setHeader('Content-Type', contentType || 'image/jpeg');
        
        externalResponse.body.pipe(response);

    } catch (error) {
        console.error("Image Proxy Error:", error);
        response.status(500).send('Error processing image request.');
    }
}