👟 SoleMates - E-Commerce Simulation

Website e-commerce simulasi untuk toko sepatu, dibangun dengan React.js dan Node.js.
Proyek ini menggunakan Guest Checkout (tanpa login user) dan LocalStorage untuk manajemen data, serta fitur Admin Mode tersembunyi.

🔗 Live Demo: https://solematess.vercel.app (Ganti dengan link Vercel Anda)

🚀 Fitur Utama

Product Catalog: Fetching data produk real-time dari backend Railway.

Smart Cart: Keranjang belanja persisten (tidak hilang saat refresh).

Custom UI Components:

Modal Pop-up untuk pilih ukuran.

Toast Notification untuk feedback user.

Modal Informasi Pembayaran (QRIS/Transfer/COD).

Admin Mode:

Login rahasia (admin / 12345).

Manajemen status pesanan (Konfirmasi, Kirim, Selesai).

Hapus riwayat pesanan.

🛠️ Tech Stack

Frontend: React.js, CSS3 (Custom Styling)

Backend: Node.js, Express.js

Database: LocalStorage (Client-side persistence)

Deployment: Vercel (Frontend) & Railway (Backend)

💻 Cara Menjalankan di Lokal

Clone Repository

git clone [https://github.com/hanmrf/ecom.git](https://github.com/hanmrf/ecom.git)
cd ecom


Setup Backend

cd backend
npm install
npm start
# Server berjalan di http://localhost:5000


Setup Frontend

cd frontend
npm install
npm start
# Buka http://localhost:3000


Dibuat oleh Muhammad Raihan Fitriyansyah (NPM 202243501052)