import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://ecom-production-a639.up.railway.app'; 
const QRIS_IMAGE_URL = `${API_URL}/images/qris-saya.jpg`; 

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orders, setOrders] = useState([]);
  
  // State UI
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [infoModal, setInfoModal] = useState({ show: false, title: '', content: null });
  const [confirmModal, setConfirmModal] = useState({ show: false, orderId: null });
  const [isProductsVisible, setIsProductsVisible] = useState(false);
  
  // === 1. STATE BARU: LOADING ===
  const [isLoading, setIsLoading] = useState(true); 

  // State Size Selector
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  useEffect(() => {
    setIsLoading(true); // Mulai loading
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false); // Stop loading setelah data dapat
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        setIsLoading(false); // Stop loading meski error
      });
  }, []);

  useEffect(() => {
    const savedOrders = localStorage.getItem('myOrders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  // --- FUNGSI BANTUAN ---
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleGoHome = () => {
    setIsProductsVisible(false);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll halus
  };

  // --- LOGIKA CART & MODAL UKURAN ---
  const openSizeModal = (product) => {
    setSelectedProduct(product);
    setSelectedSize(null);
    setIsSizeModalOpen(true);
  };

  const confirmAddToCart = () => {
    if (!selectedSize) {
      showNotification("Silakan pilih ukuran terlebih dahulu!", "error");
      return;
    }
    const product = selectedProduct;
    const size = selectedSize;
    const cartItemId = `${product.id}-${size}`;

    setCart(currentCart => {
      const isItemInCart = currentCart.find(item => item.cartItemId === cartItemId);
      if (isItemInCart) {
        return currentCart.map(item =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...product, quantity: 1, size: size, cartItemId: cartItemId }];
    });

    setIsSizeModalOpen(false);
    setSelectedProduct(null);
    setSelectedSize(null);
    showNotification(`Berhasil menambahkan ${product.name} ke keranjang!`, "success");
  };
  
  const handleCustomerChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  }

  // --- LOGIKA CHECKOUT ---
  const handleCheckout = async () => {
    if (cart.length === 0) { showNotification("Keranjang Anda kosong!", "error"); return; }
    if (!paymentMethod) { showNotification("Pilih metode pembayaran dulu!", "error"); return; }
    if (!customer.address || !customer.name || !customer.phone) { showNotification("Lengkapi data diri & alamat!", "error"); return; }

    const total = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    let orderStatus = 'Menunggu Pembayaran';
    if (paymentMethod === 'Cash on Delivery (COD)') orderStatus = 'Diproses (COD)';

    const newOrder = {
      id: `ORDER-${Date.now()}`,
      items: cart,
      totalAmount: total,
      customer: customer,
      paymentMethod: paymentMethod,
      status: orderStatus,
      createdAt: new Date().toLocaleString('id-ID')
    };
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('myOrders', JSON.stringify(updatedOrders));

    setCart([]);
    setPaymentMethod('');

    if (paymentMethod === 'Transfer Bank') {
      setInfoModal({
        show: true,
        title: 'Instruksi Transfer Bank',
        content: (
          <div className="modal-text-content">
            <p>Silakan transfer <strong>Rp {total.toLocaleString('id-ID')}</strong> ke:</p>
            <div className="bank-account"><p>BCA: <strong>1234567890</strong></p><p>a.n. SoleMates</p></div>
            <p className="modal-note">Pesanan akan diproses setelah konfirmasi.</p>
          </div>
        )
      });
    } else if (paymentMethod === 'E-Wallet / QRIS') {
      setInfoModal({
        show: true,
        title: 'Pesanan Dibuat! (Menunggu Pembayaran)',
        content: (
          <div className="modal-center-content">
            <p>Silakan scan QRIS di bawah ini dan masukkan nominal secara manual.</p>
            <img src={QRIS_IMAGE_URL} alt="QRIS" className="qris-image-modal" />
            <h3 className="modal-total">Total: Rp {total.toLocaleString('id-ID')}</h3>
            <p className="modal-note">Pesanan Anda akan diproses setelah kami memverifikasi pembayaran.</p>
          </div>
        )
      });
    } else if (paymentMethod === 'Cash on Delivery (COD)') {
      setInfoModal({
        show: true,
        title: 'Pesanan COD Diterima',
        content: (
          <div className="modal-text-content">
            <p>Mohon siapkan uang pas sebesar <strong>Rp {total.toLocaleString('id-ID')}</strong> saat kurir datang.</p>
          </div>
        )
      });
    }
  };

  const handleConfirmPayment = (id) => updateOrderStatus(id, 'Diproses');
  const handleCompleteOrder = (id) => updateOrderStatus(id, 'Selesai');
  
  const updateOrderStatus = (id, status) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    localStorage.setItem('myOrders', JSON.stringify(updated));
    showNotification(`Status pesanan diubah jadi: ${status}`, "success");
  };

  const initiateDelete = (id) => setConfirmModal({ show: true, orderId: id });
  const confirmDelete = () => {
    const updated = orders.filter(o => o.id !== confirmModal.orderId);
    setOrders(updated);
    localStorage.setItem('myOrders', JSON.stringify(updated));
    setConfirmModal({ show: false, orderId: null });
    showNotification("Riwayat pesanan dihapus.", "success");
  };

  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <div className="container">
      {notification.show && <div className={`notification-toast ${notification.type}`}>{notification.message}</div>}

      <header>
        <h1 onClick={handleGoHome} style={{ cursor: 'pointer', userSelect: 'none' }} title="Kembali ke Awal">
          👟 SoleMates 👟
        </h1>
        <p>"Temukan SoleMates-mu. Kami antar, gratis."</p>
      </header>

      <section className="hero">
        <div className="hero-content">
          <h2>Pasangan Sempurna Untuk Kakimu</h2>
          <p>Dari sneaker kasual hingga sepatu lari profesional.</p>
          <a href="#product-section" className="hero-cta" onClick={() => setIsProductsVisible(true)}>
            Lihat Semua Produk
          </a>
        </div>
      </section>

      <main>
        {/* === TAMPILAN LOADING ATAU PRODUK === */}
        {isProductsVisible && (
          <section id="product-section" className="product-section">
            <h2 className="section-title">Produk Kami</h2>
            
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Sedang mengambil data sepatu...</p>
              </div>
            ) : (
              <div className="product-list">
                {products.map(product => (
                  <div key={product.id} className="product-card">
                    <img src={product.imageUrl} alt={product.name} />
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="brand">{product.brand}</p>
                      <p className="price">Rp {product.price.toLocaleString('id-ID')}</p>
                      <button className="add-to-cart-btn" onClick={() => openSizeModal(product)}>+ Tambah ke Keranjang</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="cart-section">
          <div className="cart">
            <h2 className="section-title">Keranjang Belanja</h2>
            {cart.length === 0 ? <p>Keranjang masih kosong.</p> : (
              <div>
                {cart.map(item => (
                  <div key={item.cartItemId} className="cart-item">
                    <span>{item.name} <strong>(Uk. {item.size})</strong> <span>(x{item.quantity})</span></span>
                    <span>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
                <hr/><div className="cart-total">Total: Rp {totalAmount.toLocaleString('id-ID')}</div>
              </div>
            )}
            
            {cart.length > 0 && (
              <div className="checkout-form">
                <h3>Detail Pelanggan</h3>
                <input type="text" name="name" placeholder="Nama Lengkap" value={customer.name} onChange={handleCustomerChange} />
                <input type="email" name="email" placeholder="Email" value={customer.email} onChange={handleCustomerChange} />
                <input type="text" name="phone" placeholder="Nomor Telepon" value={customer.phone} onChange={handleCustomerChange} />
                <textarea name="address" placeholder="Alamat Lengkap" value={customer.address} onChange={handleCustomerChange} rows="4" />
                
                <div className="payment-options">
                  <h3>Pilih Metode Pembayaran</h3>
                  {['Transfer Bank', 'E-Wallet / QRIS', 'Cash on Delivery (COD)'].map(method => (
                    <div key={method} className="payment-option">
                      <input type="radio" id={method} name="paymentMethod" value={method} checked={paymentMethod === method} onChange={(e) => setPaymentMethod(e.target.value)} />
                      <label htmlFor={method}>{method}</label>
                    </div>
                  ))}
                </div>
                <button className="checkout-button" onClick={handleCheckout}>Buat Pesanan</button>
              </div>
            )}
          </div>
        </section>

        <section className="order-list-section">
          <h2 className="section-title">Daftar Pesanan Saya</h2>
          {orders.length === 0 ? <p>Belum ada riwayat pesanan.</p> : (
            <div className="order-list">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <h3>{order.id}</h3>
                    <span className={`order-status ${order.status === 'Menunggu Pembayaran' ? 'pending' : order.status === 'Selesai' ? 'completed' : 'processing'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="order-date">Tanggal: {order.createdAt}</p>
                  <div className="order-shipping">
                    <strong>Kirim ke: {order.customer.name}</strong>
                    <p>{order.customer.address}</p>
                  </div>
                  <ul className="order-items-list">
                    {order.items.map(item => (
                      <li key={item.cartItemId}>{item.name} <strong>(Uk. {item.size})</strong> <span>(x{item.quantity})</span></li>
                    ))}
                  </ul>
                  <p className="order-total">Total: Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                  <p className="order-payment">Metode: {order.paymentMethod}</p>

                  {order.status === 'Menunggu Pembayaran' && <button className="confirm-payment-btn" onClick={() => handleConfirmPayment(order.id)}>Konfirmasi Pembayaran</button>}
                  {(order.status === 'Diproses' || order.status === 'Diproses (COD)') && <button className="complete-btn" onClick={() => handleCompleteOrder(order.id)}>Tandai Selesai</button>}
                  {order.status === 'Selesai' && <button className="delete-btn" onClick={() => initiateDelete(order.id)}>Hapus Riwayat</button>}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* === FOOTER (Gaya Hero) === */}
      <footer>
        <p>&copy; 2025 SoleMates. All rights reserved.</p>
      </footer>

      {/* MODALS (Size, Info, Confirm) */}
      {isSizeModalOpen && selectedProduct && (
        <div className="modal-backdrop" onClick={() => setIsSizeModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsSizeModalOpen(false)}>&times;</button>
            <h3>Pilih Ukuran</h3>
            <p className="modal-subtitle">{selectedProduct.name}</p>
            <div className="size-grid">
              {[39, 40, 41, 42, 43, 44, 45].map(size => (
                <button key={size} className={`size-btn ${selectedSize === size ? 'active' : ''}`} onClick={() => setSelectedSize(size)}>{size}</button>
              ))}
            </div>
            <button className="modal-close-bottom-btn" onClick={confirmAddToCart}>Masukan Keranjang</button>
          </div>
        </div>
      )}

      {infoModal.show && (
        <div className="modal-backdrop" onClick={() => setInfoModal({ ...infoModal, show: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setInfoModal({ ...infoModal, show: false })}>&times;</button>
            <h2>{infoModal.title}</h2>
            {infoModal.content}
            <button className="modal-close-bottom-btn" onClick={() => setInfoModal({ ...infoModal, show: false })}>Saya Mengerti (Tutup)</button>
          </div>
        </div>
      )}

      {confirmModal.show && (
        <div className="modal-backdrop" onClick={() => setConfirmModal({ show: false, orderId: null })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Hapus Riwayat?</h3>
            <p>Apakah Anda yakin ingin menghapus pesanan ini dari riwayat?</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="modal-close-bottom-btn" style={{ backgroundColor: '#ccc', color: '#333' }} onClick={() => setConfirmModal({ show: false, orderId: null })}>Batal</button>
              <button className="modal-close-bottom-btn" style={{ backgroundColor: '#dc3545' }} onClick={confirmDelete}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;