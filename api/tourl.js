import { promises as fs } from 'fs';
import { IncomingForm } from 'formidable';
import { ImageUploadService } from 'node-upload-images';
import path from 'path';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    try {
        const form = new IncomingForm();
        const [fields, files] = await form.parse(request);
        const imageFile = files.image?.[0];

        if (!imageFile) {
            return response.status(400).json({ message: 'Tidak ada file gambar yang diunggah.' });
        }

        const fileContent = await fs.readFile(imageFile.filepath);
        const fileExtension = path.extname(imageFile.originalFilename);
        const newFilename = `by_rikishopreal${fileExtension}`;
        
        const service = new ImageUploadService('pixhost.to');
        const { directLink } = await service.uploadFromBinary(fileContent, newFilename);
        
        await fs.unlink(imageFile.filepath);

        response.status(200).json({ link: directLink });

    } catch (error) {
        console.error("Error pada API tourl:", error);
        response.status(500).json({ message: 'Terjadi kesalahan saat mengunggah gambar.' });
    }
}