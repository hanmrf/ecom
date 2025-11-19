// Import library yang dibutuhkan
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Inisialisasi aplikasi express (HANYA SEKALI)
const app = express();
app.use(cors()); // Mengizinkan akses dari frontend
app.use(express.json()); // Membaca data JSON dari request

// Memberitahu Express untuk menyajikan file apa pun di folder 'public'
// Ini agar gambar Anda bisa diakses
app.use(express.static('public'));

// Data dummy untuk produk sepatu kita
const products = [
    { id: 'sepatu-001', name: 'Velocity Runner', brand: 'AeroStride', price: 750000, imageUrl: 'http://localhost:5000/images/sepatu-lari.jpeg' },
    { id: 'sepatu-002', name: 'Urban Walker', brand: 'CityScout', price: 550000, imageUrl: 'http://localhost:5000/images/sepatu-kota.jpg' },
    { id: 'sepatu-003', name: 'Trail Blazer', brand: 'TerraFlex', price: 950000, imageUrl: 'http://localhost:5000/images/sepatu-trail.jpeg' },
    { id: 'sepatu-004', name: 'Classic Canvas', brand: 'OldSkool', price: 450000, imageUrl: 'http://localhost:5000/images/sepatu-canvas.jpg' },
    
    // === HARGA PRODUK BARU SUDAH DIUBAH ===
    { 
      id: 'sepatu-005', 
      name: 'Ortuseight Hyperblast 2.0', 
      brand: 'Ortuseight', 
      price: 1500000,
      imageUrl: 'http://localhost:5000/images/ortuseight-hyperblast.jpg'
    },
    { 
      id: 'sepatu-006', 
      name: 'Ortuseight Solar 1.0', 
      brand: 'Ortuseight', 
      price: 1000000,
      imageUrl: 'http://localhost:5000/images/ortuseight-solar.jpg'
    }
    // === BATAS PRODUK BARU ===
];

// === ENDPOINTS API ===

// 1. Endpoint untuk mendapatkan daftar produk
// Ini adalah SATU-SATUNYA endpoint yang kita perlukan
app.get('/api/products', (req, res) => {
    res.status(200).json(products);
});

// (Endpoint /api/create-transaction dihapus karena tidak dipakai di Opsi 1)

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));