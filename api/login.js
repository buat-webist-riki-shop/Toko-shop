export default function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Metode tidak diizinkan' });
    }

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const { password } = request.body;

    if (password && password === ADMIN_PASSWORD) {
        response.status(200).json({ message: 'Login berhasil' });
    } else {
        response.status(401).json({ message: 'Password yang Anda masukkan salah.' });
    }
}