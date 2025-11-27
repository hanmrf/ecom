import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_URL = 'https://ecom-production-a639.up.railway.app'; 
const QRIS_IMAGE_URL = `/images/qris-saya.jpg`; 

const PAYMENT_OPTIONS = [
  { 
    id: 'Transfer Bank', 
    icon: '🏦', 
    label: 'Transfer Bank', 
    description: 'BCA' 
  },
  { 
    id: 'E-Wallet / QRIS', 
    icon: '📱', 
    label: 'QRIS / E-Wallet', 
    description: 'GoPay' 
  },
  { 
    id: 'Cash on Delivery (COD)', 
    icon: '📦', 
    label: 'COD (Bayar di Tempat)', 
    description: 'Bayar tunai saat kurir datang' 
  }
];

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
  const [isLoading, setIsLoading] = useState(true); 
  const [searchTerm, setSearchTerm] = useState('');

  // State Size Selector
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // === STATE LOGIN ADMIN ===
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false); 
  const [adminLoginData, setAdminLoginData] = useState({ username: '', password: '' });

  // === STATE LOGIN PELANGGAN ===
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isUserLoginModalOpen, setIsUserLoginModalOpen] = useState(false);
  const [userLoginData, setUserLoginData] = useState({ name: '', email: '' });

  // PiP Ref
  const [isPipActive, setIsPipActive] = useState(false);
  const pipWindowRef = useRef(null);
  const avatarContentRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching products:", err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const savedOrders = localStorage.getItem('myOrders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));

    const adminStatus = localStorage.getItem('isAdminLoggedIn');
    if (adminStatus === 'true') setIsAdmin(true);

    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setIsUserLoggedIn(true);
      setCustomer(prev => ({ ...prev, name: parsedUser.name, email: parsedUser.email }));
    }

    const savedCart = localStorage.getItem('myCart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem('myCart', JSON.stringify(cart));
  }, [cart]);

  // --- FUNGSI BANTUAN ---
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleGoHome = () => {
    setIsProductsVisible(false);
    setSearchTerm('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToCartSection = () => {
    if (!isUserLoggedIn) {
      showNotification("Silakan login untuk melihat keranjang.", "error");
      setIsUserLoginModalOpen(true);
      return;
    }
    const cartElement = document.querySelector('.cart-section');
    if (cartElement) {
      cartElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      if(isAdmin) showNotification("Mode Admin: Keranjang tidak aktif.", "error");
      else if (!isProductsVisible) showNotification("Silakan lihat produk terlebih dahulu.", "error");
    }
  };

  // --- LOGIKA LOGIN PELANGGAN ---
  const handleUserLoginInput = (e) => {
    setUserLoginData({ ...userLoginData, [e.target.name]: e.target.value });
  }

  const handleUserLoginSubmit = () => {
    if (!userLoginData.name || !userLoginData.email) {
      showNotification("Nama dan Email harus diisi!", "error");
      return;
    }
    const userData = { name: userLoginData.name, email: userLoginData.email };
    setUser(userData);
    setIsUserLoggedIn(true);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setCustomer(prev => ({ ...prev, name: userData.name, email: userData.email }));
    setIsUserLoginModalOpen(false);
    showNotification(`Selamat datang, ${userData.name}!`, "success");
  };

  const handleUserLogout = () => {
    setUser(null);
    setIsUserLoggedIn(false);
    localStorage.removeItem('currentUser');
    setCustomer({ name: '', email: '', phone: '', address: '' });
    setCart([]);
    localStorage.removeItem('myCart');
    showNotification("Anda berhasil logout.", "success");
  };

  // --- LOGIKA LOGIN ADMIN ---
  const handleAdminLoginInput = (e) => {
    setAdminLoginData({ ...adminLoginData, [e.target.name]: e.target.value });
  };

  const handleAdminLoginSubmit = () => {
    if (adminLoginData.username === 'admin' && adminLoginData.password === '12345') {
      setIsAdmin(true);
      if(isUserLoggedIn) handleUserLogout();
      
      localStorage.setItem('isAdminLoggedIn', 'true');
      setIsAdminLoginModalOpen(false); 
      showNotification("Login Admin Berhasil!", "success");
    } else {
      showNotification("Username atau Password salah!", "error");
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdminLoggedIn');
    showNotification("Mode Admin dinonaktifkan.", "success");
  };

  // --- LOGIKA CART & CHECKOUT ---
  const openSizeModal = (product) => {
    if (!isUserLoggedIn) {
      showNotification("Silakan login untuk belanja!", "error");
      setIsUserLoginModalOpen(true);
      return;
    }
    setSelectedProduct(product);
    setSelectedSize(null);
    setIsSizeModalOpen(true);
  };

  const confirmAddToCart = () => {
    if (!selectedSize) {
      showNotification("Pilih ukuran dulu, Bos!", "error");
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

  const removeFromCart = (cartItemId) => {
    setCart(currentCart => currentCart.filter(item => item.cartItemId !== cartItemId));
    showNotification("Item dihapus dari keranjang.", "success");
  };
  
  const handleCustomerChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  }

  const handleCheckout = async () => {
    if (!isUserLoggedIn) {
      showNotification("Silakan Login Pelanggan terlebih dahulu!", "error");
      setIsUserLoginModalOpen(true);
      return;
    }

    if (cart.length === 0) { showNotification("Keranjang Anda kosong!", "error"); return; }
    if (!paymentMethod) { showNotification("Pilih metode pembayaran dulu!", "error"); return; }
    if (!customer.address || !customer.phone) { showNotification("Lengkapi alamat dan telepon!", "error"); return; }

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
      userEmail: user.email,
      createdAt: new Date().toLocaleString('id-ID')
    };
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('myOrders', JSON.stringify(updatedOrders));

    setCart([]); 
    localStorage.removeItem('myCart');
    setPaymentMethod('');

    if (paymentMethod === 'Transfer Bank') {
      setInfoModal({ show: true, title: 'Pesanan Dibuat! (Menunggu Pembayaran)', content: (<div className="modal-text-content"><p>Silakan transfer <strong>Rp {total.toLocaleString('id-ID')}</strong> ke:</p><div className="bank-account"><p>BCA: <strong>1234567890</strong></p><p>a.n. SoleMates</p></div><p className="modal-note">Pesanan Anda akan diproses setelah kami verifikasi pembayaran Anda.</p></div>) });
    } else if (paymentMethod === 'E-Wallet / QRIS') {
      setInfoModal({ show: true, title: 'Pesanan Dibuat! (Menunggu Pembayaran)', content: (<div className="modal-center-content"><p>Silakan scan QRIS di bawah ini dan masukkan nominal secara manual.</p><img src={QRIS_IMAGE_URL} alt="QRIS" className="qris-image-modal" /><h3 className="modal-total">Total: Rp {total.toLocaleString('id-ID')}</h3><p className="modal-note">Pesanan Anda akan diproses setelah kami verifikasi pembayaran Anda.</p></div>) });
    } else if (paymentMethod === 'Cash on Delivery (COD)') {
      setInfoModal({ show: true, title: 'Pesanan COD Diterima', content: (<div className="modal-text-content"><p>Mohon siapkan uang pas sebesar <strong>Rp {total.toLocaleString('id-ID')}</strong> saat kurir datang.</p></div>) });
    }
  };

  const displayedOrders = isAdmin 
    ? orders 
    : orders.filter(order => isUserLoggedIn && order.userEmail === user.email);

  const handleCustomerConfirmPayment = (id) => {
    updateOrderStatus(id, 'Menunggu Verifikasi');
    showNotification("Konfirmasi pembayaran terkirim!", "success");
  };

  const handleAdminVerify = (id) => updateOrderStatus(id, 'Diproses');
  const handleCompleteOrder = (id) => updateOrderStatus(id, 'Selesai');
  
  const updateOrderStatus = (id, status) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    localStorage.setItem('myOrders', JSON.stringify(updated));
  };

  const initiateDelete = (id) => setConfirmModal({ show: true, orderId: id });
  const confirmDelete = () => {
    const updated = orders.filter(o => o.id !== confirmModal.orderId);
    setOrders(updated);
    localStorage.setItem('myOrders', JSON.stringify(updated));
    setConfirmModal({ show: false, orderId: null });
    showNotification("Riwayat pesanan dihapus.", "success");
  };

  // PiP Logic
  const togglePip = async () => {
    if (!("documentPictureInPicture" in window)) {
      showNotification("Browser tidak support PiP.", "error");
      return;
    }
    if (isPipActive) { pipWindowRef.current.close(); return; }

    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({ width: 300, height: 400 });
      pipWindowRef.current = pipWindow;
      setIsPipActive(true);
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch (e) {
          const link = document.createElement('link');
          link.rel = 'stylesheet'; link.type = styleSheet.type; link.media = styleSheet.media; link.href = styleSheet.href;
          pipWindow.document.head.appendChild(link);
        }
      });
      pipWindow.document.body.append(avatarContentRef.current);
      pipWindow.addEventListener("pagehide", () => {
        const container = document.getElementById('avatar-container-main');
        if (container && avatarContentRef.current) container.append(avatarContentRef.current);
        setIsPipActive(false);
        pipWindowRef.current = null;
      });
    } catch (error) { console.error(error); }
  };

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalAmount = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <div className="container">
      
      {/* PiP Widget */}
      <div id="avatar-container-main" className="avatar-wrapper">
        <div ref={avatarContentRef} className="pip-content">
          <div className="pip-header"><span style={{fontSize: '1.5rem'}}>👟</span><strong>Asisten SoleMates</strong></div>
          <div className="pip-body">
            <p>Halo, {isUserLoggedIn ? user.name.split(' ')[0] : 'Tamu'}!</p>
            <p>Keranjang: <strong>{cartItemCount} Item</strong></p>
            <p>Total: <strong>Rp {totalAmount.toLocaleString('id-ID')}</strong></p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="admin-top-bar">
          <span>🔒 <strong>ADMINISTRATOR MODE</strong></span>
          <button className="logout-btn-small" onClick={handleAdminLogout}>Keluar Admin</button>
        </div>
      )}

      {notification.show && <div className={`notification-toast ${notification.type}`}>{notification.message}</div>}

      <header>
        <div className="header-content">
          <div className="header-title-group">
            <h1 onClick={handleGoHome} style={{ cursor: 'pointer', userSelect: 'none' }} title="Kembali ke Awal">
              {isAdmin ? '⚙️ Dashboard SoleMates' : '👟 SoleMates 👟'}
            </h1>
            <p>{isAdmin ? "Panel Kontrol Manajemen Pesanan" : "\"Temukan SoleMates-mu. Kami antar, gratis.\""}</p>
          </div>

          {!isAdmin && (
            <div className="user-menu">
              {isUserLoggedIn ? (
                <div className="user-info">
                  <span>Halo, <strong>{user.name.split(' ')[0]}</strong></span>
                  <button className="logout-link" onClick={handleUserLogout}>(Logout)</button>
                </div>
              ) : (
                <button className="login-btn-header" onClick={() => setIsUserLoginModalOpen(true)}>
                  Masuk / Daftar
                </button>
              )}
              
              <div className="header-cart" onClick={scrollToCartSection}>
                <span className="cart-icon">🛒</span>
                {isUserLoggedIn && cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
              </div>
            </div>
          )}
        </div>
      </header>

      {!isAdmin && (
        <section className="hero">
          <div className="hero-content">
            <h2>Pasangan Sempurna Untuk Kakimu</h2>
            <p>Dari sneaker kasual hingga sepatu lari profesional. Temukan yang pas untuk setiap langkahmu.</p>
            <a href="#product-section" className="hero-cta" onClick={() => setIsProductsVisible(true)}>
              Lihat Semua Produk
            </a>
          </div>
        </section>
      )}

      <main>
        {isProductsVisible && !isAdmin && (
          <section id="product-section" className="product-section">
            <div className="section-header-row">
              <h2 className="section-title">Produk Kami</h2>
              <input type="text" className="search-input" placeholder="Cari sepatu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            {isLoading ? (
              <div className="loading-container"><div className="loading-spinner"></div><p>Sedang mengambil data sepatu...</p></div>
            ) : (
              <div className="product-list">
                {filteredProducts.length > 0 ? filteredProducts.map(product => (
                  <div key={product.id} className="product-card">
                    <img src={product.imageUrl} alt={product.name} />
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="brand">{product.brand}</p>
                      <p className="price">Rp {product.price.toLocaleString('id-ID')}</p>
                      <button className="add-to-cart-btn" onClick={() => openSizeModal(product)}>+ Tambah ke Keranjang</button>
                    </div>
                  </div>
                )) : <p className="no-results">Produk tidak ditemukan.</p>}
              </div>
            )}
          </section>
        )}

        {!isAdmin && isUserLoggedIn && (
          <section className="cart-section">
            <div className="cart">
              <h2 className="section-title">Keranjang Belanja</h2>
              {cart.length === 0 ? <p>Keranjang masih kosong.</p> : (
                <div>
                  {cart.map(item => (
                    <div key={item.cartItemId} className="cart-item">
                      <div className="cart-item-info"><span>{item.name} <strong>(Uk. {item.size})</strong></span><span className="cart-item-qty">x{item.quantity} @ Rp {item.price.toLocaleString('id-ID')}</span></div>
                      <button className="remove-item-btn" onClick={() => removeFromCart(item.cartItemId)}>&times;</button>
                    </div>
                  ))}
                  <hr/><div className="cart-total">Total: Rp {totalAmount.toLocaleString('id-ID')}</div>
                </div>
              )}
              
              {cart.length > 0 && (
                <div className="checkout-form">
                  <h3>Detail Pengiriman</h3>
                  <input type="text" name="name" placeholder="Nama Lengkap" value={customer.name} onChange={handleCustomerChange} disabled title="Nama dari akun login" />
                  <input type="email" name="email" placeholder="Email" value={customer.email} onChange={handleCustomerChange} disabled title="Email dari akun login" />
                  <input type="text" name="phone" placeholder="Nomor Telepon" value={customer.phone} onChange={handleCustomerChange} />
                  <textarea name="address" placeholder="Alamat Lengkap" value={customer.address} onChange={handleCustomerChange} rows="4" />
                  
                  {/* === BAGIAN YANG DIPERBAIKI (DATA-DRIVEN) === */}
                  <div className="payment-options">
                    <h3>Pilih Metode Pembayaran</h3>
                    {PAYMENT_OPTIONS.map((option) => (
                      <div 
                        key={option.id} 
                        className="payment-option"
                        style={{
                          marginBottom: '10px', 
                          padding: '10px', 
                          border: isUserLoggedIn ? '1px solid #e2e8f0' : '1px solid #ccc',
                          borderRadius: '8px',
                          backgroundColor: paymentMethod === option.id ? '#f0f9ff' : 'white',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onClick={() => setPaymentMethod(option.id)} // Bisa klik div-nya juga
                      >
                        <input 
                          type="radio" 
                          id={option.id} 
                          name="paymentMethod" 
                          value={option.id} 
                          checked={paymentMethod === option.id} 
                          onChange={(e) => setPaymentMethod(e.target.value)} 
                          style={{ marginRight: '15px', cursor: 'pointer' }}
                          onClick={(e) => e.stopPropagation()} // Mencegah double trigger
                        />
                        <label 
                          htmlFor={option.id} 
                          style={{
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '15px', 
                            cursor: 'pointer', 
                            width: '100%'
                          }}
                        >
                          <span style={{ fontSize: '1.8rem' }}>{option.icon}</span> 
                          <div>
                            <span style={{ fontWeight: 'bold', display: 'block', color: '#2d3748' }}>
                              {option.label}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#718096' }}>
                              {option.description}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                  {/* =========================================== */}

                  <button className="checkout-button" onClick={handleCheckout}>Buat Pesanan</button>
                </div>
              )}
            </div>
          </section>
        )}

        {!isAdmin && !isUserLoggedIn && isProductsVisible && (
          <div style={{textAlign: 'center', margin: '40px 0', color: '#718096'}}>
            <p>🔒 <strong>Anda harus login untuk melihat keranjang dan memesan.</strong></p>
            <button className="login-btn-header" onClick={() => setIsUserLoginModalOpen(true)} style={{marginTop: '10px'}}>Login Sekarang</button>
          </div>
        )}

        {(isAdmin || isUserLoggedIn) && (
          <section className="order-list-section">
            <h2 className="section-title">{isAdmin ? '📋 Manajemen Semua Pesanan' : 'Riwayat Pesanan Anda'}</h2>
            {displayedOrders.length === 0 ? <p>{isAdmin ? "Belum ada pesanan masuk." : "Anda belum memiliki pesanan."}</p> : (
              <div className="order-list">
                {displayedOrders.map(order => (
                  <div key={order.id} className={`order-card ${isAdmin ? 'admin-view' : ''}`}>
                    <div className="order-header">
                      <h3>{order.id}</h3>
                      <span className={`order-status ${order.status === 'Menunggu Pembayaran' ? 'pending' : order.status === 'Menunggu Verifikasi' ? 'verifying' : order.status === 'Selesai' ? 'completed' : order.status.includes('COD') ? 'cod' : 'processing'}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="order-date">Tanggal: {order.createdAt}</p>
                    <div className="order-shipping">
                      <strong>Penerima: {order.customer.name}</strong>
                      <p>{order.customer.address}</p>
                      {isAdmin && <p style={{fontSize: '0.8rem', color: '#6a11cb', marginTop: '5px'}}>User: {order.userEmail} | Telp: {order.customer.phone}</p>}
                    </div>
                    <ul className="order-items-list">
                      {order.items.map(item => (
                        <li key={item.cartItemId}>{item.name} <strong>(Uk. {item.size})</strong> <span>(x{item.quantity})</span></li>
                      ))}
                    </ul>
                    <p className="order-total">Total: Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                    <p className="order-payment">Metode: {order.paymentMethod}</p>

                    {!isAdmin && isUserLoggedIn && order.status === 'Menunggu Pembayaran' && (
                      <button className="pay-button" onClick={() => handleCustomerConfirmPayment(order.id)}>Saya Sudah Bayar</button>
                    )}

                    {isAdmin && (
                      <div className="admin-actions">
                        <p className="admin-badge">Aksi Admin</p>
                        {order.status === 'Menunggu Verifikasi' && <button className="confirm-payment-btn" onClick={() => handleAdminVerify(order.id)}>✅ Terima & Verifikasi</button>}
                        {order.status === 'Menunggu Pembayaran' && <button className="confirm-payment-btn" style={{background: '#6c757d'}} onClick={() => handleAdminVerify(order.id)}>Manual Confirm</button>}
                        {(order.status === 'Diproses' || order.status === 'Diproses (COD)') && <button className="complete-btn" onClick={() => handleCompleteOrder(order.id)}>📦 Selesai & Kirim</button>}
                        {order.status === 'Selesai' && <button className="delete-btn" onClick={() => initiateDelete(order.id)}>🗑️ Hapus</button>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <footer>
        <p>&copy; 2025 SoleMates. All rights reserved.</p>
        <div style={{ marginTop: '20px' }}>
          {!isAdmin && !isUserLoggedIn && (
            <button onClick={() => setIsAdminLoginModalOpen(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Admin Login</button>
          )}
        </div>
      </footer>

      {/* MODALS */}
      {isSizeModalOpen && selectedProduct && (
        <div className="modal-backdrop" onClick={() => setIsSizeModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsSizeModalOpen(false)}>&times;</button>
            <h3>Pilih Ukuran</h3>
            <p className="modal-subtitle">{selectedProduct.name}</p>
            <div className="size-grid">{[39, 40, 41, 42, 43, 44, 45].map(size => (<button key={size} className={`size-btn ${selectedSize === size ? 'active' : ''}`} onClick={() => setSelectedSize(size)}>{size}</button>))}</div>
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
            <p>Yakin hapus pesanan ini?</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="modal-close-bottom-btn" style={{ backgroundColor: '#ccc', color: '#333' }} onClick={() => setConfirmModal({ show: false, orderId: null })}>Batal</button>
              <button className="modal-close-bottom-btn" style={{ backgroundColor: '#dc3545' }} onClick={confirmDelete}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LOGIN ADMIN */}
      {isAdminLoginModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAdminLoginModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsAdminLoginModalOpen(false)}>&times;</button>
            <h3>Login Admin</h3>
            <p className="modal-note" style={{marginBottom: '20px'}}>Masukkan kredensial admin.</p>
            <input type="text" name="username" placeholder="Username" value={adminLoginData.username} onChange={handleAdminLoginInput} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', boxSizing: 'border-box' }} />
            <input type="password" name="password" placeholder="Password" value={adminLoginData.password} onChange={handleAdminLoginInput} style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #cbd5e0', borderRadius: '6px', boxSizing: 'border-box' }} />
            <button className="modal-close-bottom-btn" onClick={handleAdminLoginSubmit}>Login</button>
          </div>
        </div>
      )}

      {/* MODAL LOGIN PELANGGAN */}
      {isUserLoginModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsUserLoginModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsUserLoginModalOpen(false)}>&times;</button>
            <h3>Masuk / Daftar</h3>
            <p className="modal-note" style={{marginBottom: '20px'}}>Masukkan nama dan email Anda untuk mulai belanja.</p>
            <input type="text" name="name" placeholder="Nama Lengkap" value={userLoginData.name} onChange={handleUserLoginInput} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #cbd5e0', borderRadius: '6px', boxSizing: 'border-box' }} />
            <input type="email" name="email" placeholder="Alamat Email" value={userLoginData.email} onChange={handleUserLoginInput} style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #cbd5e0', borderRadius: '6px', boxSizing: 'border-box' }} />
            <button className="modal-close-bottom-btn" onClick={handleUserLoginSubmit}>Lanjutkan</button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;