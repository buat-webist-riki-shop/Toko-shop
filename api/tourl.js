import { promises as fs } from 'fs';
import { IncomingForm } from 'formidable';
import { ImageUploadService } from 'node-upload-images';
import path from 'path';
import sharp from 'sharp'; // Impor library Sharp

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

        // --- KONVERSI GAMBAR KE JPG ---
        // Apapun format inputnya (PNG, WEBP, GIF, dll.),
        // akan dikonversi ke JPG dengan kualitas 90%.
        const outputBuffer = await sharp(fileContent)
            .jpeg({ quality: 90 })
            .toBuffer();
        
        const outputExtension = '.jpg'; // Nama file ekstensi baru
        const newFilename = `by_rikishopreal${outputExtension}`;
        // --- AKHIR KONVERSI ---
        
        const service = new ImageUploadService('pixhost.to');
        
        // Unggah buffer gambar yang sudah dikonversi
        const { directLink } = await service.uploadFromBinary(outputBuffer, newFilename);
        
        await fs.unlink(imageFile.filepath); // Hapus file temp

        response.status(200).json({ link: directLink });

    } catch (error) {
        console.error("Error pada API tourl:", error);
        response.status(500).json({ message: 'Terjadi kesalahan saat mengunggah gambar.' });
    }
}