import React, { useState, useEffect } from 'react';
import './App.css'; // Pastikan CSS ini diimpor

// URL Backend kita (tempat mengambil data produk & gambar)
const API_URL = 'https://ecom-production-a639.up.railway.app';
// URL gambar QRIS statis (pastikan nama file-nya benar)
const QRIS_IMAGE_URL = `${API_URL}/images/qris-saya.jpg`;

function App() {
  
  // === STATE MANAGEMENT ===
  // State menyimpan semua data yang bisa berubah di aplikasi
  
  // Menyimpan daftar produk dari backend
  const [products, setProducts] = useState([]);
  // Menyimpan item yang ada di keranjang belanja
  const [cart, setCart] = useState([]);
  // Menyimpan data pelanggan dari form (nama, email, dll.)
  const [customer, setCustomer] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    address: ''
  });
  // Menyimpan metode pembayaran yang dipilih (dari radio button)
  const [paymentMethod, setPaymentMethod] = useState('');
  // Menyimpan daftar riwayat pesanan
  const [orders, setOrders] = useState([]);
  
  // State khusus untuk pop-up modal QRIS
  const [isModalOpen, setIsModalOpen] = useState(false); // true = modal terbuka
  const [modalTotal, setModalTotal] = useState(0); // Menyimpan total untuk ditampilkan di modal
  
  // State untuk menyembunyikan/menampilkan produk
  const [isProductsVisible, setIsProductsVisible] = useState(false); // false = tersembunyi

  
  // === EFEK (EFFECTS) ===
  
  // useEffect ini berjalan HANYA SEKALI saat komponen pertama kali dimuat
  // Tugasnya: Mengambil data produk dari backend
  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => setProducts(data)) // Simpan data produk ke state 'products'
      .catch(err => console.error("Error fetching products:", err));
  }, []); // tanda [] berarti "jalankan sekali saja"

  // useEffect ini juga berjalan HANYA SEKALI saat komponen dimuat
  // Tugasnya: Memeriksa apakah ada riwayat pesanan di localStorage browser
  useEffect(() => {
    const savedOrders = localStorage.getItem('myOrders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders)); // Muat riwayat pesanan ke state 'orders'
    }
  }, []); // tanda [] berarti "jalankan sekali saja"

  
  // === FUNGSI-FUNGSI UTAMA (LOGIKA APLIKASI) ===

  // Fungsi untuk mereset halaman ke tampilan awal
  const handleGoHome = () => {
    setIsProductsVisible(false); // Sembunyikan kembali daftar produk
    window.scrollTo(0, 0); // Gulir (scroll) halaman ke paling atas
  };

  // Fungsi untuk menambah item ke keranjang
  const addToCart = (product) => {
    // 1. Tampilkan 'prompt' (kotak dialog) untuk meminta ukuran
    const size = prompt(
      `Silakan masukkan ukuran untuk ${product.name} (antara 39-45):`, 
      "42" // Nilai default
    );
    
    // 2. Validasi input ukuran
    if (!size) { // Jika pengguna klik "Cancel"
      alert('Anda harus memilih ukuran.');
      return; 
    }
    const sizeNum = parseInt(size);
    if (isNaN(sizeNum) || sizeNum < 39 || sizeNum > 45) { // Jika ukuran tidak valid
      alert('Ukuran tidak valid. Harap masukkan angka antara 39 dan 45.');
      return;
    }
    
    // 3. Buat ID unik untuk item keranjang (menggabungkan ID produk + ukuran)
    // Ini penting agar "Sepatu A Uk. 40" dan "Sepatu A Uk. 41" dihitung sebagai 2 item berbeda
    const cartItemId = `${product.id}-${size}`;
    
    setCart(currentCart => {
      // 4. Cek apakah item dengan ID & ukuran yang sama sudah ada di keranjang
      const isItemInCart = currentCart.find(item => item.cartItemId === cartItemId);
      
      if (isItemInCart) {
        // 5a. Jika SUDAH ADA, tambah 'quantity' (jumlah) saja
        return currentCart.map(item =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      
      // 5b. Jika BELUM ADA, tambahkan sebagai item baru di keranjang
      return [...currentCart, { 
        ...product, 
        quantity: 1, 
        size: size, // Simpan ukuran yang dipilih
        cartItemId: cartItemId // Simpan ID unik keranjang
      }];
    });
    alert(`Berhasil menambahkan ${product.name} ukuran ${size} ke keranjang!`);
  };
  
  // Fungsi generik untuk meng-update state 'customer' setiap kali ada ketikan di form
  const handleCustomerChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  }

  // Fungsi utama untuk memproses checkout
  const handleCheckout = async () => {
    
    // --- VALIDASI (Guard Clauses) ---
    // Hentikan fungsi jika ada yang tidak beres
    if (cart.length === 0) {
      alert("Keranjang Anda kosong!");
      return;
    }
    if (!paymentMethod) {
      alert("Silakan pilih metode pembayaran terlebih dahulu.");
      return;
    }
    if (!customer.address || !customer.name || !customer.email || !customer.phone) {
        alert("Harap isi semua detail pelanggan (Nama, Email, Telepon, dan Alamat).");
        return;
    }
    // --- AKHIR VALIDASI ---

    // Hitung total belanja
    const total = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    // Tentukan status pesanan berdasarkan metode pembayaran
    let orderStatus = 'Menunggu Pembayaran';
    if (paymentMethod === 'Cash on Delivery (COD)') {
      orderStatus = 'Diproses (COD)';
    }

    // Buat objek pesanan baru
    const newOrder = {
      id: `ORDER-${Date.now()}`, // ID unik berdasarkan waktu
      items: cart, // Salin isi keranjang saat ini
      totalAmount: total,
      customer: customer, // Salin detail pelanggan saat ini
      paymentMethod: paymentMethod,
      status: orderStatus,
      createdAt: new Date().toLocaleString('id-ID') // Waktu pemesanan
    };
    
    // Update daftar pesanan (state & localStorage)
    const updatedOrders = [newOrder, ...orders]; // Taruh pesanan baru di paling atas
    setOrders(updatedOrders);
    localStorage.setItem('myOrders', JSON.stringify(updatedOrders)); // Simpan ke browser

    // Reset keranjang dan form
    setCart([]);
    setPaymentMethod('');
    // Kita tidak reset data customer, agar mereka tidak perlu mengetik ulang jika ingin order lagi

    // Tampilkan instruksi pembayaran sesuai metode yang dipilih
    if (paymentMethod === 'Transfer Bank') {
      alert(
        `Pesanan Dibuat! (Menunggu Pembayaran)\n\n` +
        `Order ID: ${newOrder.id}\n` +
        `Total: Rp ${newOrder.totalAmount.toLocaleString('id-ID')}\n\n` +
        `Silakan transfer ke rekening (pilih salah satu):\n` +
        `BCA: 1234567890 (a.n. SoleMates)\n` +
        `Mandiri: 0987654321 (a.n. SoleMates)\n\n` +
        `Pesanan Anda akan diproses setelah kami memverifikasi pembayaran.`
      );
    } else if (paymentMethod === 'E-Wallet / QRIS') {
      // Untuk QRIS, kita buka pop-up modal
      setModalTotal(total); // Kirim total belanja ke modal
      setIsModalOpen(true); // Buka modalnya
      
    } else if (paymentMethod === 'Cash on Delivery (COD)') {
      alert(
        `Pesanan COD Dibuat!\n\n` +
        `Order ID: ${newOrder.id}\n` +
        `Total: Rp ${newOrder.totalAmount.toLocaleString('id-ID')}\n\n` +
        `Silakan siapkan uang pas. Pesanan Anda sedang kami proses.`
      );
    }
  };

  // === FUNGSI-FUNGSI "ADMIN" ===
  // Fungsi-fungsi ini memanipulasi daftar pesanan yang sudah ada

  // Dipanggil saat tombol "Konfirmasi Pembayaran" diklik
  const handleConfirmPayment = (orderIdToUpdate) => {
    const updatedOrders = orders.map(order => {
      // Cari pesanan berdasarkan ID-nya
      if (order.id === orderIdToUpdate) {
        // Ubah statusnya menjadi 'Diproses'
        return { ...order, status: 'Diproses' };
      }
      return order; // Kembalikan pesanan lain apa adanya
    });
    // Simpan perubahan ke state dan localStorage
    setOrders(updatedOrders);
    localStorage.setItem('myOrders', JSON.stringify(updatedOrders));
  };
  
  // Dipanggil saat tombol "Tandai Selesai" diklik
  const handleCompleteOrder = (orderIdToUpdate) => {
    const updatedOrders = orders.map(order => {
      if (order.id === orderIdToUpdate) {
        // Ubah statusnya menjadi 'Selesai'
        return { ...order, status: 'Selesai' };
      }
      return order;
    });
    setOrders(updatedOrders);
    localStorage.setItem('myOrders', JSON.stringify(updatedOrders));
  };

  // Dipanggil saat tombol "Hapus Riwayat" diklik
  const handleDeleteOrder = (orderIdToDelete) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus riwayat pesanan ini?')) {
      // Buat array baru yang berisi semua pesanan KECUALI yang ID-nya ingin dihapus
      const updatedOrders = orders.filter(order => order.id !== orderIdToDelete);
      setOrders(updatedOrders);
      localStorage.setItem('myOrders', JSON.stringify(updatedOrders));
    }
  };

  // Menghitung total keranjang untuk ditampilkan (real-time)
  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  // === TAMPILAN (RENDER) ===
  return (
    <div className="container">
      <header>
        {/* Judul ini bisa diklik untuk kembali ke awal */}
        <h1 onClick={handleGoHome} style={{ cursor: 'pointer', userSelect: 'none' }} title="Kembali ke Awal">
          👟 SoleMates 👟
        </h1>
        <p>"Temukan SoleMate-mu. Kami antar, gratis."</p>
      </header>

      {/* Hero Section (Banner) */}
      <section className="hero">
        <div className="hero-content">
          <h2>Pasangan Sempurna Untuk Kakimu</h2>
          <p>Dari sneaker kasual hingga sepatu lari profesional. Temukan yang pas untuk setiap langkahmu.</p>
          {/* Tombol ini akan menampilkan daftar produk saat diklik */}
          <a href="#product-section" className="hero-cta" onClick={() => setIsProductsVisible(true)}>
            Lihat Semua Produk
          </a>
        </div>
      </section>

      <main>
        
        {/* Bagian Produk: Hanya ditampilkan jika isProductsVisible adalah true */}
        {isProductsVisible && (
          <section id="product-section" className="product-section">
            <h2 className="section-title">Produk Kami</h2>
            <div className="product-list">
              {/* Loop (map) melalui state 'products' dan buat kartu untuk setiap produk */}
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <img src={product.imageUrl} alt={product.name} />
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="brand">{product.brand}</p>
                    <p className="price">Rp {product.price.toLocaleString('id-ID')}</p>
                    <button className="add-to-cart-btn" onClick={() => addToCart(product)}>
                      + Tambah ke Keranjang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bagian Keranjang Belanja */}
        <section className="cart-section">
          <div className="cart">
            <h2 className="section-title">Keranjang Belanja</h2>
            {/* Tampilkan pesan jika keranjang kosong */}
            {cart.length === 0 ? (
              <p>Keranjang masih kosong.</p>
            ) : (
              // Tampilkan daftar item jika keranjang ada isi
              <div>
                {cart.map(item => (
                  <div key={item.cartItemId} className="cart-item">
                    <span>
                      {item.name} 
                      <strong> (Uk. {item.size})</strong> {/* Tampilkan ukuran */}
                      <span> (x{item.quantity})</span> {/* Tampilkan jumlah */}
                    </span>
                    <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <hr/>
                <div className="cart-total">
                  Total: Rp {totalAmount.toLocaleString('id-ID')}
                </div>
              </div>
            )}
            
            {/* Form Checkout: Hanya tampil jika ada item di keranjang */}
            {cart.length > 0 && (
              <div className="checkout-form">
                <h3>Detail Pelanggan</h3>
                {/* Setiap input terhubung ke state 'customer' 
                  'value' mengambil data dari state
                  'onChange' meng-update state
                */}
                <input type="text" name="name" placeholder="Nama Lengkap" value={customer.name} onChange={handleCustomerChange} />
                <input type="email" name="email" placeholder="Email" value={customer.email} onChange={handleCustomerChange} />
                <input type="text" name="phone" placeholder="Nomor Telepon" value={customer.phone} onChange={handleCustomerChange} />
                <textarea
                  name="address"
                  placeholder="Alamat Lengkap Pengiriman (termasuk kode pos)"
                  value={customer.address}
                  onChange={handleCustomerChange}
                  rows="4"
                />
                
                <div className="payment-options">
                  <h3>Pilih Metode Pembayaran</h3>
                  <div className="payment-option">
                    <input type="radio" id="transfer" name="paymentMethod" value="Transfer Bank" checked={paymentMethod === 'Transfer Bank'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <label htmlFor="transfer">Transfer Bank (Cek Manual)</label>
                  </div>
                  <div className="payment-option">
                    <input type="radio" id="ewallet" name="paymentMethod" value="E-Wallet / QRIS" checked={paymentMethod === 'E-Wallet / QRIS'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <label htmlFor="ewallet">E-Wallet / QRIS (Cek Manual)</label>
                  </div>
                  <div className="payment-option">
                    <input type="radio" id="cod" name="paymentMethod" value="Cash on Delivery (COD)" checked={paymentMethod === 'Cash on Delivery (COD)'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <label htmlFor="cod">Cash on Delivery (COD)</label>
                  </div>
                </div>

                <button className="checkout-button" onClick={handleCheckout}>
                  Buat Pesanan
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Bagian Daftar Riwayat Pesanan */}
        <section className="order-list-section">
          <h2 className="section-title">Daftar Pesanan Saya</h2>
          {orders.length === 0 ? (
            <p>Belum ada riwayat pesanan.</p>
          ) : (
            <div className="order-list">
              {/* Loop (map) melalui state 'orders' */}
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <h3>{order.id}</h3>
                    {/* Mengganti warna status secara dinamis berdasarkan isinya */}
                    <span className={
                      `order-status ${
                        order.status === 'Menunggu Pembayaran' ? 'pending' :
                        order.status === 'Diproses (COD)' ? 'cod' :
                        order.status === 'Selesai' ? 'completed' : 
                        'processing' // 'processing' untuk 'Diproses'
                      }`
                    }>
                      {order.status}
                    </span>
                  </div>
                  <p className="order-date">Tanggal: {order.createdAt}</p>
                  
                  <div className="order-shipping">
                    <strong>Kirim ke: {order.customer.name}</strong>
                    <p>{order.customer.address}</p>
                    <p>{order.customer.phone} | {order.customer.email}</p>
                  </div>

                  <ul className="order-items-list">
                    {order.items.map(item => (
                      <li key={item.cartItemId}>
                        {item.name} 
                        <strong> (Uk. {item.size})</strong>
                        <span> (x{item.quantity})</span>
                        <span> - Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="order-total">Total: Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                  <p className="order-payment">Metode: {order.paymentMethod}</p>

                  {/* Tampilan tombol admin secara kondisional */}
                  {/* Tombol Konfirmasi: HANYA tampil jika status 'Menunggu Pembayaran' */}
                  {order.status === 'Menunggu Pembayaran' && (
                    <button 
                      className="confirm-payment-btn" 
                      onClick={() => handleConfirmPayment(order.id)}
                    >
                      Konfirmasi Pembayaran
                    </button>
                  )}
                  {/* Tombol Selesai: HANYA tampil jika status 'Diproses' ATAU 'Diproses (COD)' */}
                  {(order.status === 'Diproses' || order.status === 'Diproses (COD)') && (
                    <button 
                      className="complete-btn" 
                      onClick={() => handleCompleteOrder(order.id)}
                    >
                      Tandai Selesai
                    </button>
                  )}
                  {/* Tombol Hapus: HANYA tampil jika status 'Selesai' */}
                  {order.status === 'Selesai' && (
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      Hapus Riwayat
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Pop-up Modal QRIS: HANYA tampil jika isModalOpen adalah true */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
              &times;
            </button>
            <h2>Pesanan Dibuat! (Menunggu Pembayaran)</h2>
            <p>Silakan scan QRIS di bawah ini dan masukkan nominal secara manual.</p>
            
            <img src={QRIS_IMAGE_URL} alt="QRIS Code" className="qris-image-modal" />
            
            <h3 className="modal-total">
              {/* Ambil total dari state 'modalTotal' */}
              Total: Rp {modalTotal.toLocaleString('id-ID')}
            </h3>

            <p className="modal-note">Pesanan Anda akan diproses setelah kami memverifikasi pembayaran.</p>
            <button className="modal-close-bottom-btn" onClick={() => setIsModalOpen(false)}>
              Saya Mengerti (Tutup)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;