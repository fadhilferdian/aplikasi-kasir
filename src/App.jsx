import React, { useState } from 'react';
import { ShoppingCart, Coffee, Package, BarChart3, Trash2, Plus, Minus, AlertTriangle, CheckCircle, Save, Edit2, RotateCcw, X, Utensils, PlusCircle, XCircle, Calendar, Filter, SaveAll, Download } from 'lucide-react';

// --- DATA DUMMY AWAL ---
const INITIAL_INVENTORY = [
  { id: 1, name: 'Biji Kopi', stock: 1000, unit: 'gram', minLevel: 200 },
  { id: 2, name: 'Susu UHT', stock: 5000, unit: 'ml', minLevel: 1000 },
  { id: 3, name: 'Gula Aren', stock: 500, unit: 'ml', minLevel: 100 },
  { id: 4, name: 'Cup Plastik', stock: 50, unit: 'pcs', minLevel: 10 },
  { id: 5, name: 'Teh', stock: 300, unit: 'gram', minLevel: 50 },
];

const INITIAL_PRODUCTS = [
  { 
    id: 1, 
    name: 'Kopi Susu Gula Aren', 
    price: 18000, 
    recipe: [
      { inventoryId: 1, amount: 15 },
      { inventoryId: 2, amount: 150 },
      { inventoryId: 3, amount: 30 },
      { inventoryId: 4, amount: 1 }
    ]
  },
  { 
    id: 2, 
    name: 'Americano', 
    price: 15000, 
    recipe: [
      { inventoryId: 1, amount: 18 }, 
      { inventoryId: 4, amount: 1 }
    ]
  },
  { 
    id: 3, 
    name: 'Teh Tarik', 
    price: 12000, 
    recipe: [
      { inventoryId: 5, amount: 10 }, 
      { inventoryId: 2, amount: 100 }, 
      { inventoryId: 4, amount: 1 }
    ]
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [cart, setCart] = useState([]);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [salesLog, setSalesLog] = useState([]);
  const [notification, setNotification] = useState(null);
  
  // State untuk mode edit Stok
  const [editingStockId, setEditingStockId] = useState(null);
  const [tempStockValue, setTempStockValue] = useState('');
  const [isAddingInventory, setIsAddingInventory] = useState(false);

  // State untuk Manajemen Menu
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // State untuk Filter Laporan
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // State Baru: Edit Transaksi di Laporan
  const [editingTransaction, setEditingTransaction] = useState(null);

  // State Baru: Tanggal Transaksi Kasir
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);

  // --- LOGIC KASIR ---

  const addToCart = (product) => {
    const isAvailable = checkAvailability(product);
    if (!isAvailable) {
      showNotification("Stok bahan baku tidak cukup!", "error");
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQty = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const calculateTotal = (items = cart) => {
    return items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  const checkAvailability = (product) => {
    if (!product.recipe || product.recipe.length === 0) return true;
    
    for (let ing of product.recipe) {
      const stockItem = inventory.find(i => i.id === ing.inventoryId);
      if (!stockItem) continue;

      const inCartQty = cart.find(c => c.id === product.id)?.qty || 0;
      const totalNeeded = (inCartQty + 1) * ing.amount;
      if (stockItem.stock < totalNeeded) return false;
    }
    return true;
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    let newInventory = inventory.map(item => ({...item}));
    
    cart.forEach(item => {
      item.recipe.forEach(ing => {
        const invIndex = newInventory.findIndex(i => i.id === ing.inventoryId);
        if (invIndex > -1) {
          newInventory[invIndex].stock -= (ing.amount * item.qty);
        }
      });
    });
    setInventory(newInventory);

    // Logic Tanggal Custom
    const selectedDateObj = new Date(transactionDate);
    const now = new Date();
    selectedDateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const transaction = {
      id: Date.now(), 
      date: selectedDateObj.toLocaleString('id-ID'),
      timestamp: selectedDateObj.getTime(),
      items: [...cart],
      total: calculateTotal(),
    };
    setSalesLog([transaction, ...salesLog]);

    setCart([]);
    showNotification("Transaksi Berhasil!", "success");
  };

  // --- LOGIC: MANAJEMEN STOK ---

  const startEditingStock = (item) => {
    setEditingStockId(item.id);
    setTempStockValue(item.stock);
  };

  const saveStock = (id) => {
    const newVal = parseInt(tempStockValue);
    if (isNaN(newVal) || newVal < 0) {
      showNotification("Nilai stok tidak valid", "error");
      return;
    }
    setInventory(inventory.map(item => item.id === id ? { ...item, stock: newVal } : item));
    setEditingStockId(null);
    showNotification("Stok berhasil diperbarui", "success");
  };

  const handleAddInventory = (newItem) => {
    if (!newItem.name || !newItem.unit) {
      showNotification("Nama dan Satuan wajib diisi", "error");
      return;
    }
    const newId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
    setInventory([...inventory, { ...newItem, id: newId }]);
    setIsAddingInventory(false);
    showNotification("Bahan baku baru ditambahkan", "success");
  };

  const handleDeleteInventory = (id) => {
    const usedIn = products.filter(p => p.recipe && p.recipe.some(r => r.inventoryId === id));
    if (usedIn.length > 0) {
      const names = usedIn.map(p => p.name).join(", ");
      showNotification(`Tidak bisa dihapus — dipakai oleh: ${names}`, "error");
      return;
    }

    if (!window.confirm("Yakin ingin menghapus bahan ini? Tindakan ini tidak dapat dibatalkan.")) return;

    setInventory(prev => prev.filter(i => i.id !== id));

    if (editingStockId === id) {
      setEditingStockId(null);
      setTempStockValue('');
    }

    showNotification("Bahan baku dihapus", "success");
  };
  // --- LOGIC: MANAJEMEN MENU ---

  const handleSaveMenu = (menuData) => {
    if (!menuData.name || !menuData.price) {
      showNotification("Nama dan Harga wajib diisi", "error");
      return;
    }

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...menuData, id: p.id } : p));
      showNotification("Menu berhasil diperbarui", "success");
    } else {
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      setProducts([...products, { ...menuData, id: newId }]);
      showNotification("Menu baru berhasil ditambahkan", "success");
    }
    setIsEditingMenu(false);
    setEditingProduct(null);
  };

  const handleDeleteMenu = (id) => {
    if (window.confirm("Yakin ingin menghapus menu ini?")) {
      setProducts(products.filter(p => p.id !== id));
      showNotification("Menu dihapus", "success");
    }
  };

  // --- LOGIC: EDIT & HAPUS RIWAYAT ---

  const deleteTransaction = (transactionId) => {
    if(!window.confirm("Yakin ingin menghapus transaksi ini? Stok bahan akan dikembalikan otomatis.")) return;

    const transaction = salesLog.find(t => t.id === transactionId);
    if (!transaction) return;

    let newInventory = inventory.map(item => ({...item}));

    transaction.items.forEach(item => {
      if (item.recipe) {
        item.recipe.forEach(ing => {
          const invIndex = newInventory.findIndex(i => i.id === ing.inventoryId);
          if (invIndex > -1) {
            newInventory[invIndex].stock += (ing.amount * item.qty);
          }
        });
      }
    });

    setInventory(newInventory);
    setSalesLog(prevLogs => prevLogs.filter(t => t.id !== transactionId));
    
    showNotification("Transaksi dihapus & Stok dikembalikan", "success");
  };

  const saveEditedTransaction = (newItems) => {
    if (newItems.length === 0) {
      showNotification("Transaksi tidak boleh kosong. Gunakan tombol hapus saja.", "error");
      return;
    }

    const originalTransaction = salesLog.find(t => t.id === editingTransaction.id);
    if (!originalTransaction) return;

    let tempInventory = JSON.parse(JSON.stringify(inventory));

    originalTransaction.items.forEach(item => {
      if(item.recipe) {
        item.recipe.forEach(ing => {
          const invIndex = tempInventory.findIndex(i => i.id === ing.inventoryId);
          if (invIndex > -1) {
            tempInventory[invIndex].stock += (ing.amount * item.qty);
          }
        });
      }
    });

    let isStockEnough = true;
    for (const item of newItems) {
       if(item.recipe) {
         for (const ing of item.recipe) {
           const invIndex = tempInventory.findIndex(i => i.id === ing.inventoryId);
           const needed = ing.amount * item.qty;
           
           if (invIndex === -1 || tempInventory[invIndex].stock < needed) {
             isStockEnough = false;
             break;
           }
           tempInventory[invIndex].stock -= needed;
         }
       }
       if(!isStockEnough) break;
    }

    if (!isStockEnough) {
      showNotification("Stok tidak cukup untuk perubahan ini!", "error");
      return;
    }

    setInventory(tempInventory);
    
    const updatedLog = salesLog.map(t => 
      t.id === editingTransaction.id 
      ? { ...t, items: newItems, total: calculateTotal(newItems) } 
      : t
    );
    setSalesLog(updatedLog);
    
    setEditingTransaction(null);
    showNotification("Transaksi diperbarui & Stok disesuaikan", "success");
  };

  // --- LOGIC: EXPORT TO CSV ---
  
  const exportToCSV = (data) => {
    const headers = ["ID Transaksi", "Waktu", "Detail Item", "Total (Rp)"];
    const rows = data.map(log => {
      const itemDetails = log.items.map(i => `${i.qty}x ${i.name}`).join("; ");
      const escapedItemDetails = `"${itemDetails}"`; 
      return [
        log.id,
        `"${log.date}"`,
        escapedItemDetails,
        log.total
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan_penjualan_${new Date().toLocaleDateString('id-ID')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- UTILITIES ---

  const showNotification = (msg, type) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
  };

  // --- SUB-COMPONENTS ---
  
  const InventoryForm = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [stock, setStock] = useState('');
    const [unit, setUnit] = useState('gram');
    const [minLevel, setMinLevel] = useState('');

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <h3 className="text-xl font-bold mb-4">Tambah Bahan Baku Baru</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nama Bahan</label>
            <input type="text" className="w-full border p-2 rounded" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Sirup Vanilla" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Stok Awal</label>
              <input type="number" className="w-full border p-2 rounded" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" />
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-bold text-slate-700 mb-1">Satuan</label>
              <select className="w-full border p-2 rounded" value={unit} onChange={e => setUnit(e.target.value)}>
                <option value="gram">gram</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
                <option value="kg">kg</option>
                <option value="liter">liter</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Batas Minimum (Peringatan)</label>
            <input type="number" className="w-full border p-2 rounded" value={minLevel} onChange={e => setMinLevel(e.target.value)} placeholder="Contoh: 100" />
          </div>
          <div className="flex gap-2 pt-4">
            <button onClick={onCancel} className="flex-1 py-2 border border-slate-300 rounded hover:bg-slate-50">Batal</button>
            <button 
              onClick={() => onSave({ name, stock: parseInt(stock) || 0, unit, minLevel: parseInt(minLevel) || 0 })} 
              className="flex-1 py-2 bg-slate-800 text-white font-bold rounded hover:bg-slate-700"
            >
              Simpan Bahan
            </button>
          </div>
        </div>
      </div>
    );
  };

  const MenuForm = ({ initialData, onSave, onCancel, inventory }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [price, setPrice] = useState(initialData?.price || '');
    const [recipe, setRecipe] = useState(initialData?.recipe || []);
    const [selectedIng, setSelectedIng] = useState(inventory[0]?.id || '');
    const [amountIng, setAmountIng] = useState('');

    const addIngredient = () => {
      if (!selectedIng || !amountIng) return;
      const existing = recipe.find(r => r.inventoryId === parseInt(selectedIng));
      if (existing) {
        setRecipe(recipe.map(r => r.inventoryId === parseInt(selectedIng) ? { ...r, amount: parseInt(amountIng) } : r));
      } else {
        setRecipe([...recipe, { inventoryId: parseInt(selectedIng), amount: parseInt(amountIng) }]);
      }
      setAmountIng('');
    };

    const removeIngredient = (invId) => {
      setRecipe(recipe.filter(r => r.inventoryId !== invId));
    };

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <h3 className="text-xl font-bold mb-4">{initialData ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nama Menu</label>
            <input type="text" className="w-full border p-2 rounded" value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Kopi Tubruk" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Harga Jual (Rp)</label>
            <input type="number" className="w-full border p-2 rounded" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
          </div>
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">Resep / Bahan Baku</label>
            <div className="flex gap-2 mb-2">
              <select className="border p-2 rounded flex-1" value={selectedIng} onChange={e => setSelectedIng(e.target.value)}>
                {inventory.map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                ))}
              </select>
              <input type="number" className="border p-2 rounded w-24" placeholder="Jml" value={amountIng} onChange={e => setAmountIng(e.target.value)} />
              <button onClick={addIngredient} className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700"><Plus size={20}/></button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto bg-slate-50 p-2 rounded">
              {recipe.map((r, idx) => {
                const inv = inventory.find(i => i.id === r.inventoryId);
                return (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm">
                    <span>{inv?.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{r.amount} {inv?.unit}</span>
                      <button onClick={() => removeIngredient(r.inventoryId)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={14}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <button onClick={onCancel} className="flex-1 py-2 border border-slate-300 rounded hover:bg-slate-50">Batal</button>
            <button onClick={() => onSave({ name, price: parseInt(price), recipe })} className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-500 font-bold rounded">Simpan Menu</button>
          </div>
        </div>
      </div>
    );
  };

  const TransactionEditModal = ({ transaction, onSave, onCancel }) => {
    const [items, setItems] = useState([...transaction.items]);

    const updateItemQty = (productId, delta) => {
      setItems(curr => curr.map(item => {
        if (item.id === productId) {
          const newQty = Math.max(0, item.qty + delta);
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(item => item.qty > 0));
    };

    const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
             <h3 className="font-bold">Edit Transaksi</h3>
             <button onClick={onCancel}><X size={20}/></button>
          </div>
          
          <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
             <div className="text-xs text-slate-500 mb-2">ID: {transaction.id}</div>
             {items.length === 0 && <div className="text-center text-red-500">Item kosong. Transaksi akan dihapus jika disimpan.</div>}
             
             {items.map((item, idx) => (
               <div key={idx} className="flex justify-between items-center border p-2 rounded">
                 <div>
                   <div className="font-bold text-sm">{item.name}</div>
                   <div className="text-xs text-slate-500">{formatRupiah(item.price)}</div>
                 </div>
                 <div className="flex items-center gap-3">
                   <button onClick={() => updateItemQty(item.id, -1)} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><Minus size={14}/></button>
                   <span className="font-bold w-4 text-center">{item.qty}</span>
                   <button onClick={() => updateItemQty(item.id, 1)} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><Plus size={14}/></button>
                 </div>
               </div>
             ))}
          </div>

          <div className="p-4 border-t bg-slate-50">
             <div className="flex justify-between font-bold text-lg mb-4">
               <span>Total Baru</span>
               <span>{formatRupiah(total)}</span>
             </div>
             <button 
               onClick={() => onSave(items)}
               className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 rounded-lg flex justify-center items-center gap-2"
             >
               <SaveAll size={18}/> Simpan Perubahan
             </button>
          </div>
        </div>
      </div>
    );
  };

  // --- VIEWS ---

  const Sidebar = () => (
    <div className="w-20 md:w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 z-20 shadow-xl">
      <div className="p-4 font-bold text-xl flex items-center gap-2 text-yellow-400">
        <Coffee className="w-8 h-8" />
        <span className="hidden md:inline">KafePintar</span>
      </div>
      <nav className="flex-1 mt-6">
        <button onClick={() => setActiveTab('pos')} className={`w-full p-4 flex items-center gap-3 hover:bg-slate-800 transition ${activeTab === 'pos' ? 'bg-slate-800 border-r-4 border-yellow-400' : ''}`}>
          <ShoppingCart /> <span className="hidden md:inline">Kasir</span>
        </button>
        <button onClick={() => setActiveTab('inventory')} className={`w-full p-4 flex items-center gap-3 hover:bg-slate-800 transition ${activeTab === 'inventory' ? 'bg-slate-800 border-r-4 border-yellow-400' : ''}`}>
          <Package /> <span className="hidden md:inline">Stok Bahan</span>
        </button>
        <button onClick={() => setActiveTab('menu')} className={`w-full p-4 flex items-center gap-3 hover:bg-slate-800 transition ${activeTab === 'menu' ? 'bg-slate-800 border-r-4 border-yellow-400' : ''}`}>
          <Utensils /> <span className="hidden md:inline">Manajemen Menu</span>
        </button>
        <button onClick={() => setActiveTab('report')} className={`w-full p-4 flex items-center gap-3 hover:bg-slate-800 transition ${activeTab === 'report' ? 'bg-slate-800 border-r-4 border-yellow-400' : ''}`}>
          <BarChart3 /> <span className="hidden md:inline">Laporan</span>
        </button>
      </nav>
    </div>
  );

  const POSView = () => (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">Menu Kasir</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => {
            const available = checkAvailability(product);
            return (
              <div key={product.id} 
                onClick={() => available && addToCart(product)}
                className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer transition transform hover:-translate-y-1 ${!available ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:shadow-md'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg text-slate-800">{product.name}</div>
                  {!available && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">Stok Habis</span>}
                </div>
                <div className="text-yellow-600 font-bold">{formatRupiah(product.price)}</div>
                <div className="text-xs text-slate-400 mt-2">Bahan: {product.recipe.length} item</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-[calc(100vh-100px)] lg:h-auto">
        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-lg text-slate-700">Keranjang Pesanan</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-slate-400 py-10">Belum ada item dipilih</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded-lg">
                <div>
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-xs text-slate-500">{formatRupiah(item.price)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-slate-100 rounded"><Minus size={14} /></button>
                  <span className="w-4 text-center text-sm font-bold">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-slate-100 rounded"><Plus size={14} /></button>
                  <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-2"><Trash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl space-y-3">
          {/* Input Tanggal Transaksi */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Transaksi</label>
            <input 
              type="date" 
              className="w-full border border-slate-300 p-2 rounded text-sm"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
          </div>

          <div className="flex justify-between text-lg font-bold text-slate-800">
            <span>Total</span>
            <span>{formatRupiah(calculateTotal())}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition flex justify-center items-center gap-2"
          >
            <CheckCircle size={20} />
            Bayar
          </button>
        </div>
      </div>
    </div>
  );

  const MenuView = () => {
    if (isEditingMenu) {
      return (
        <div className="max-w-2xl mx-auto">
          <MenuForm 
            initialData={editingProduct} 
            inventory={inventory}
            onSave={handleSaveMenu} 
            onCancel={() => { setIsEditingMenu(false); setEditingProduct(null); }} 
          />
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Daftar Menu</h2>
          <button 
            onClick={() => { setEditingProduct(null); setIsEditingMenu(true); }} 
            className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2"
          >
            <PlusCircle size={20} /> Tambah Menu
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
               <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg text-slate-800">{product.name}</div>
                  <div className="text-yellow-600 font-bold">{formatRupiah(product.price)}</div>
               </div>
               
               <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded">
                 <strong>Resep:</strong>
                 <ul className="list-disc pl-4 mt-1 space-y-1">
                   {product.recipe.map((r, idx) => {
                     const inv = inventory.find(i => i.id === r.inventoryId);
                     return <li key={idx}>{inv?.name}: {r.amount} {inv?.unit}</li>
                   })}
                 </ul>
               </div>

               <div className="flex gap-2 mt-auto">
                 <button 
                   onClick={() => { setEditingProduct(product); setIsEditingMenu(true); }} 
                   className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm flex items-center justify-center gap-2"
                 >
                   <Edit2 size={14} /> Edit
                 </button>
                 <button 
                   onClick={() => handleDeleteMenu(product.id)} 
                   className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-500 rounded text-sm"
                 >
                   <Trash2 size={14} />
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const InventoryView = () => {
    if (isAddingInventory) {
      return (
        <div className="max-w-2xl mx-auto">
          <InventoryForm 
            onSave={handleAddInventory}
            onCancel={() => setIsAddingInventory(false)}
          />
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Stok Bahan</h2>
          <button 
            onClick={() => setIsAddingInventory(true)} 
            className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2"
          >
            <PlusCircle size={20} /> Tambah Bahan Baru
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map(item => {
            const status = item.stock <= 0 ? 'Habis' : item.stock < item.minLevel ? 'Kritis' : 'Aman';
            const statusColor = item.stock <= 0 ? 'bg-red-500' : item.stock < item.minLevel ? 'bg-orange-500' : 'bg-green-500';
            const isEditing = editingStockId === item.id;

            return (
              <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                    <p className="text-sm text-slate-500">Min: {item.minLevel} {item.unit}</p>
                  </div>
                  <span className={`${statusColor} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
                    {status}
                  </span>
                </div>
                
                <div className="mb-4">
                  {isEditing ? (
                     <div className="flex items-center gap-2">
                       <input 
                          type="number" 
                          value={tempStockValue} 
                          onChange={(e) => setTempStockValue(e.target.value)}
                          className="w-full border-2 border-yellow-400 rounded-lg p-2 text-xl font-bold focus:outline-none"
                          autoFocus
                       />
                       <span className="text-slate-500">{item.unit}</span>
                     </div>
                  ) : (
                    <div className="flex items-end gap-1">
                      <span className={`text-3xl font-bold ${item.stock < item.minLevel ? 'text-red-600' : 'text-slate-800'}`}>
                        {item.stock}
                      </span>
                      <span className="text-sm font-medium text-slate-500 mb-1">{item.unit}</span>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <button onClick={() => saveStock(item.id)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg flex justify-center items-center gap-1">
                      <Save size={16} /> Simpan
                    </button>
                    <button onClick={() => setEditingStockId(null)} className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startEditingStock(item)}
                      className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 flex justify-center items-center gap-2 border border-slate-300"
                    >
                      <Edit2 size={14} /> Edit Manual
                    </button>

                    <button
                      onClick={() => handleDeleteInventory(item.id)}
                      className="w-12 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 flex items-center justify-center"
                      title="Hapus Bahan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const ReportView = () => {
    const filteredLogs = salesLog.filter(log => {
      // Gunakan timestamp untuk filter, bukan id, karena id dibuat saat ini juga
      const date = new Date(log.timestamp);
      return date.getMonth() === filterMonth && date.getFullYear() === filterYear;
    });

    const totalRevenue = filteredLogs.reduce((sum, log) => sum + log.total, 0);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    return (
      <div className="relative">
        {editingTransaction && (
          <TransactionEditModal 
            transaction={editingTransaction}
            onSave={saveEditedTransaction}
            onCancel={() => setEditingTransaction(null)}
          />
        )}

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">Laporan & Riwayat</h2>
            <button 
              onClick={() => exportToCSV(filteredLogs)}
              disabled={filteredLogs.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download CSV untuk Google Sheets/Excel"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
          
          <div className="flex items-center bg-white p-2 rounded-lg border border-slate-300 shadow-sm gap-2">
            <Filter size={20} className="text-slate-500 ml-2" />
            <span className="font-semibold text-slate-700 mr-2">Periode:</span>
            
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded p-1 text-sm outline-none focus:border-yellow-400"
            >
              {months.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>

            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="bg-slate-50 border border-slate-300 rounded p-1 text-sm outline-none focus:border-yellow-400"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
            <div className="text-slate-300 mb-1 flex items-center gap-2">
              <Calendar size={16} />
              Omset {months[filterMonth]} {filterYear}
            </div>
            <div className="text-3xl font-bold text-yellow-400">{formatRupiah(totalRevenue)}</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="text-slate-500 mb-1">Transaksi ({months[filterMonth]})</div>
            <div className="text-3xl font-bold text-slate-800">{filteredLogs.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-4 font-semibold w-1/4">Waktu</th>
                <th className="p-4 font-semibold w-1/3">Item</th>
                <th className="p-4 font-semibold text-right">Total</th>
                <th className="p-4 font-semibold text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-400">Belum ada penjualan pada periode ini.</td></tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 group transition">
                    <td className="p-4 text-sm text-slate-500">{log.date}</td>
                    <td className="p-4">
                      {log.items.map((item, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-bold text-slate-700">{item.qty}x</span> {item.name}
                        </div>
                      ))}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">{formatRupiah(log.total)}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setEditingTransaction(log)}
                          className="p-2 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition tooltip-trigger"
                          title="Edit Transaksi"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteTransaction(log.id)}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition tooltip-trigger"
                          title="Hapus Transaksi & Kembalikan Stok"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <main className="pl-20 md:pl-64 min-h-screen transition-all">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {notification && (
            <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-bold animate-bounce ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
              {notification.msg}
            </div>
          )}

          {activeTab === 'pos' && <POSView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'menu' && <MenuView />}
          {activeTab === 'report' && <ReportView />}
        </div>
      </main>
    </div>
  );
}