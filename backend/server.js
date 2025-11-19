const express = require('express');
const cors = require('cors');
const app = express();

// Izinkan frontend mengakses backend
app.use(cors());
app.use(express.json());

// PENTING: Sajikan file gambar dari folder 'public'
app.use(express.static('public'));

// Data Produk (Database Sederhana)
const products = [
    { 
        id: 'sepatu-001', 
        name: 'Velocity Runner', 
        brand: 'AeroStride', 
        price: 750000, 
        imageUrl: 'https://ecom-production.up.railway.app/images/sepatu-lari.jpeg' 
        // Catatan: Nanti browser akan otomatis menyesuaikan domain jika pakai relative path, 
        // tapi untuk aman di Railway, pastikan file ada di folder public/images
    },
    { id: 'sepatu-002', name: 'Urban Walker', brand: 'CityScout', price: 550000, imageUrl: 'https://ecom-production.up.railway.app/images/sepatu-kota.jpg' },
    { id: 'sepatu-003', name: 'Trail Blazer', brand: 'TerraFlex', price: 950000, imageUrl: 'https://ecom-production.up.railway.app/images/sepatu-trail.jpeg' },
    { id: 'sepatu-004', name: 'Classic Canvas', brand: 'OldSkool', price: 450000, imageUrl: 'https://ecom-production.up.railway.app/images/sepatu-canvas.jpg' },
    { 
        id: 'sepatu-005', 
        name: 'Ortuseight Hyperblast 2.0', 
        brand: 'Ortuseight', 
        price: 1000000, 
        imageUrl: 'https://ecom-production.up.railway.app/images/ortuseight-hyperblast.jpg' 
    },
    { 
        id: 'sepatu-006', 
        name: 'Ortuseight Solar 1.0', 
        brand: 'Ortuseight', 
        price: 1500000, 
        imageUrl: 'https://ecom-production.up.railway.app/images/ortuseight-solar.jpg' 
    }
];

// === API ENDPOINTS ===

// 1. Test Route (Untuk cek server nyala/tidak)
app.get('/', (req, res) => {
    res.send('Server SoleMates Berjalan!');
});

// 2. Ambil Data Produk
app.get('/api/products', (req, res) => {
    // Kita map produk untuk memastikan URL gambar dinamis sesuai host
    const hostUrl = `${req.protocol}://${req.get('host')}`;
    
    const updatedProducts = products.map(product => {
        // Ambil nama file saja dari URL yang mungkin hardcoded
        const fileName = product.imageUrl.split('/').pop();
        return {
            ...product,
            imageUrl: `${hostUrl}/images/${fileName}`
        }
    });

    res.status(200).json(updatedProducts);
});

// Jalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));