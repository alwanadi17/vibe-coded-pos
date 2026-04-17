import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, X, Check, ArrowRight, Lock, Droplets } from 'lucide-react';
import { getAllProducts, addTransaction, getAllCategories, getSettings } from '../lib/db';
import { Product, CartItem, Category } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import ProductImage from '../components/ProductImage';

export default function Webstore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'success'>('idle');

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadCategories();
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function loadProducts() {
    const data = await getAllProducts();
    setProducts(data);
  }

  async function loadCategories() {
    const data = await getAllCategories();
    setCategories(data);
  }

  const handleAdminAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const settings = await getSettings();
    if (adminPinInput === settings.adminPin || (!settings.adminPin && adminPinInput === '1234')) {
      setPinModalOpen(false);
      navigate('/admin');
    } else {
      setPinError(true);
    }
  };

  const brands = Array.from(new Set(categories.map(c => c.namaKategori)));
  
  const filteredProducts = activeFilter === 'All' 
    ? products 
    : products.filter(p => p.kategori === activeFilter);

  const cartTotal = cart.reduce((sum, item) => sum + (item.harga * item.kuantitas), 0);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.kuantitas >= product.stok) return prev; // Limit max stock
        return prev.map(item => 
          item.id === product.id ? { ...item, kuantitas: item.kuantitas + 1 } : item
        );
      }
      return [...prev, { ...product, kuantitas: 1 }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, Math.min(item.kuantitas + delta, item.stok));
        return { ...item, kuantitas: newQty };
      }
      return item;
    }).filter(item => item.kuantitas > 0));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Create new transaction
    const transaction = {
      id: crypto.randomUUID(),
      tanggal: new Date().toISOString(),
      totalHarga: cartTotal,
      tunai: cartTotal, // Since webstore assumes digital payment, exact amount
      kembalian: 0,
      itemDibeli: cart.map(item => ({
        productId: item.id,
        nama: item.nama,
        harga: item.harga,
        kuantitas: item.kuantitas
      }))
    };

    await addTransaction(transaction);
    setCart([]);
    setCheckoutStatus('success');
    await loadProducts(); // Refresh stock
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] font-sans selection:bg-[#1A1A1A] selection:text-[#F5F2ED]">
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 w-full z-40 transition-all duration-300",
        isScrolled ? "bg-[#F5F2ED]/90 backdrop-blur-md py-4 shadow-sm" : "bg-transparent py-6"
      )}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex gap-8 text-xs uppercase tracking-[0.1em] font-medium hidden md:flex">
            <a href="#home" className="hover:opacity-60 transition-opacity">Home</a>
            <a href="#collection" className="hover:opacity-60 transition-opacity">Collection</a>
            <a href="#brands" className="hover:opacity-60 transition-opacity">Brands</a>
          </div>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-[#1A1A1A]" />
            <div className="text-xl font-serif tracking-widest uppercase text-[#1A1A1A]">
              Lunaria
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setPinError(false);
                setAdminPinInput('');
                setPinModalOpen(true);
              }}
              className="text-gray-400 hover:text-[#1A1A1A] transition-colors"
              title="Admin POS"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCartOpen(true)}
              className="relative hover:opacity-60 transition-opacity"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-[#1A1A1A] text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                  {cart.reduce((sum, i) => sum + i.kuantitas, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-6 min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="order-2 lg:order-1"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-light leading-[1.1] mb-6">
              Discover Your<br />
              <span className="italic text-[#8C8C8C]">Signature</span> Scent.
            </h1>
            <p className="text-sm tracking-wide text-gray-600 mb-10 max-w-md leading-relaxed uppercase">
              Curated collection of the finest fragrances from master perfumers. Elevate your presence.
            </p>
            <a 
              href="#collection"
              className="inline-flex items-center gap-3 border border-[#1A1A1A] px-8 py-4 text-xs uppercase tracking-[0.1em] font-medium hover:bg-[#1A1A1A] hover:text-white transition-all duration-300"
            >
              Shop Collection <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="order-1 lg:order-2 aspect-[4/5] overflow-hidden"
          >
            <img 
              src="https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop" 
              alt="Premium Perfume" 
              className="w-full h-full object-cover rounded-none"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Brands Marquee */}
      <section id="brands" className="py-12 border-y border-[#1A1A1A]/10 overflow-hidden bg-[#F5F2ED]">
        <div className="flex gap-16 whitespace-nowrap px-6 uppercase tracking-[0.2em] font-serif text-2xl md:text-3xl text-[#1A1A1A]/40 w-full overflow-hidden">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex gap-16 md:gap-32 items-center"
          >
             <span>Maison Margiela</span> <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" />
             <span>Le Labo</span> <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" />
             <span>Yves Saint Laurent</span> <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" />
             
             {/* Duplicate for seamless looping */}
             <span>Maison Margiela</span> <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" />
             <span>Le Labo</span> <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" />
             <span>Yves Saint Laurent</span> <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/20" />
          </motion.div>
        </div>
      </section>

      {/* Collection Section */}
      <section id="collection" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <h2 className="text-4xl font-serif font-light">The Collection</h2>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.1em] font-medium">
            {['All', ...brands].map(brand => (
              <button
                key={brand}
                onClick={() => setActiveFilter(brand)}
                className={cn(
                  "px-4 py-2 border transition-all duration-300",
                  activeFilter === brand 
                    ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" 
                    : "border-transparent text-gray-500 hover:text-black"
                )}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {filteredProducts.map((product, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              key={product.id} className="group cursor-pointer"
            >
              <div className="relative aspect-[3/4] mb-6 overflow-hidden bg-[#E8E6E1] flex items-center justify-center">
                <ProductImage 
                  src={product.urlGambar}
                  alt={product.nama}
                  className="w-full h-full mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                  fallbackTextSize="text-5xl"
                />
                
                {product.stok > 0 ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    className="absolute bottom-0 left-0 w-full bg-[#1A1A1A] text-white py-4 text-xs uppercase tracking-[0.1em] font-medium translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    Add to Bag
                  </button>
                ) : (
                  <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur text-[#1A1A1A] py-4 text-xs uppercase tracking-[0.1em] font-medium text-center">
                    Sold Out
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-1 items-center text-center">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#8C8C8C]">{product.kategori}</div>
                <h3 className="font-serif text-xl">{product.nama}</h3>
                <div className="text-sm mt-1">{formatCurrency(product.harga)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 bg-[#F5F2ED]/80 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.4 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-[0.1em] font-medium">Your Bag ({cart.reduce((s, i) => s + i.kuantitas, 0)})</h2>
                <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-gray-50 transition-colors">
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center text-gray-500">
                    <ShoppingBag className="w-12 h-12 stroke-[1] mb-4 text-gray-300" />
                    <p className="font-serif text-xl mb-2">Your Bag is Empty</p>
                    <p className="text-xs uppercase tracking-widest">Boutique items await</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-20 h-24 shrink-0 flex items-center justify-center overflow-hidden">
                        <ProductImage 
                          src={item.urlGambar}
                          alt={item.nama}
                          className="w-full h-full mix-blend-multiply"
                          fallbackTextSize="text-2xl"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="text-[10px] uppercase tracking-[0.1em] text-gray-500 mb-1">{item.kategori}</div>
                        <h4 className="font-serif text-lg leading-tight mb-2">{item.nama}</h4>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center border border-gray-200">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 hover:bg-gray-50 text-gray-500">-</button>
                            <span className="text-xs font-medium w-6 text-center">{item.kuantitas}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 hover:bg-gray-50 text-gray-500">+</button>
                          </div>
                          <div className="text-sm font-medium">{formatCurrency(item.harga * item.kuantitas)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-[#F5F2ED]/50">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs uppercase tracking-[0.1em] font-medium text-gray-500">Subtotal</span>
                    <span className="font-serif text-2xl">{formatCurrency(cartTotal)}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-[#1A1A1A] text-white py-4 text-xs uppercase tracking-[0.1em] font-medium hover:bg-black transition-colors"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Success Modal */}
      <AnimatePresence>
        {checkoutStatus === 'success' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#F5F2ED]/80 backdrop-blur-md"
              onClick={() => setCheckoutStatus('idle')}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white p-12 max-w-sm w-full text-center relative z-10 border border-gray-100 shadow-2xl"
            >
              <div className="w-16 h-16 bg-[#F5F2ED] rounded-full flex items-center justify-center mx-auto mb-6 text-green-700">
                <Check className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="font-serif text-3xl mb-2">Thank You</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">Your order has been received and is being prepared with elegance.</p>
              <button 
                onClick={() => setCheckoutStatus('idle')}
                className="border border-[#1A1A1A] w-full py-4 text-xs uppercase tracking-[0.1em] font-medium hover:bg-[#1A1A1A] hover:text-white transition-colors"
              >
                Continue Shopping
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin PIN Modal */}
      <AnimatePresence>
        {pinModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#1A1A1A]/80 backdrop-blur-md"
              onClick={() => setPinModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white p-10 max-w-sm w-full relative z-10 border border-gray-100 shadow-2xl rounded-none"
            >
              <div className="mb-8 text-center flex flex-col items-center">
                <Lock className="w-8 h-8 stroke-[1.5] mb-4" />
                <h3 className="font-serif text-2xl uppercase tracking-widest">Admin Access</h3>
                <p className="text-xs text-gray-400 mt-2 tracking-widest uppercase">Secured area</p>
              </div>

              <form onSubmit={handleAdminAccess} className="space-y-6">
                <div>
                  <input
                    type="password"
                    maxLength={6}
                    value={adminPinInput}
                    onChange={e => {
                      setAdminPinInput(e.target.value.replace(/\D/g, ''));
                      setPinError(false);
                    }}
                    autoFocus
                    placeholder="ENTER PIN"
                    className={cn(
                      "w-full text-center tracking-[0.5em] font-mono text-2xl py-4 border-b-2 bg-transparent focus:outline-none transition-colors",
                      pinError ? "border-red-500 text-red-500" : "border-gray-200 focus:border-[#1A1A1A]"
                    )}
                  />
                  {pinError ? (
                    <p className="text-center text-red-500 text-xs uppercase tracking-widest mt-3">Incorrect PIN</p>
                  ) : (
                    <p className="text-center text-gray-400 text-xs uppercase tracking-widest mt-3 opacity-0">Placeholder</p>
                  )}
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#1A1A1A] text-white py-4 text-xs uppercase tracking-[0.1em] font-medium hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  Unlock <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
