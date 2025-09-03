// index.js - Server Backend Node.js dengan Express.js

// Impor modul yang diperlukan
import express from 'express';
import cors from 'cors'; // Untuk mengatasi masalah CORS jika di-deploy ke domain yang berbeda (saat development biasanya tidak perlu jika static diserve dari sini)
import path from 'path'; // Modul Path untuk menangani jalur file
import { fileURLToPath } from 'url'; // Untuk mendapatkan __dirname di ES Modules

// Dapatkan __dirname untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000; // Server akan berjalan di port 3000 secara default

// Middleware untuk mengizinkan Express mengurai body permintaan dalam format JSON
app.use(express.json());

// Middleware untuk mengizinkan permintaan lintas asal (Cross-Origin Resource Sharing)
// Ini penting jika frontend (admin.html) dihosting di domain/port yang berbeda dari backend ini.
// Karena kita akan menyajikan file statis dari server ini, CORS mungkin tidak sepenuhnya diperlukan
// tetapi tidak ada salahnya untuk tetap disertakan.
app.use(cors());

// --- MENYAJIKAN FILE STATIS ---
// Ini akan membuat file seperti admin.html, admin.js, admin.css dapat diakses
// dari URL root server (misalnya http://localhost:3000/admin.html)
app.use(express.static(__dirname)); // Menyajikan file statis dari direktori saat ini

// --- RUTE API UNTUK LOGIN ---
app.post('/api/login', (req, res) => {
    const { password } = req.body; // Mengambil password dari body permintaan

    // Logika verifikasi password Anda
    // GANTI 'password-rahasia-anda-kuat' dengan password yang benar untuk admin
    if (password === 'password-rahasia-anda-kuat') {
        // Jika password benar, kirim respons sukses (JSON)
        res.status(200).json({ message: 'Login berhasil!' });
    } else {
        // Jika password salah, kirim respons error (JSON)
        // Pastikan pesan error juga dalam format JSON
        res.status(401).json({ message: 'Password salah.' });
    }
});

// --- RUTE API UNTUK MENAMBAH PRODUK ---
app.post('/api/addProduct', (req, res) => {
    const productData = req.body; // Mengambil data produk dari body permintaan

    // Di sini Anda akan menambahkan logika untuk menyimpan productData ke database
    // atau sumber data lainnya. Untuk demo ini, kita hanya akan mencetak data yang diterima.
    console.log('Menerima data produk baru:', productData);

    // Kirim respons sukses (JSON)
    res.status(200).json({ message: `Produk "${productData.nama}" berhasil ditambahkan.` });
});

// --- RUTE DEFAULT ---
// Jika ada yang mengakses root URL (misalnya http://localhost:3000/)
// kita bisa mengarahkan mereka ke admin.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --- Penanganan rute yang tidak ditemukan (404) ---
// Ini penting agar server mengirimkan respons JSON yang benar jika ada rute yang tidak dikenal
app.use((req, res, next) => {
    // Jika permintaan adalah API, kirimkan JSON error 404
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ message: 'API Endpoint tidak ditemukan.' });
    }
    // Untuk rute non-API lainnya, biarkan Express menangani serving static files atau 404 standar
    res.status(404).send('File atau halaman tidak ditemukan.');
});

// --- Mulai Server ---
app.listen(PORT, () => {
    console.log(`Server backend berjalan di http://localhost:${PORT}`);
    console.log(`Akses Admin Panel di: http://localhost:${PORT}/admin.html atau http://localhost:${PORT}/`);
    console.log(`(Ganti 'password-rahasia-anda-kuat' di index.js dengan password yang Anda inginkan)`);
});