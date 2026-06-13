import React, { useState, useEffect } from "react";
import { Search, Filter, Plus, Book, Cpu, Radio, Clipboard, IndianRupee, RefreshCw, ShoppingCart, User, Trash2 } from "lucide-react";
import { ProductListing, UserProfile } from "../types";
import { subscribeProducts, addProductToDb, buyProductInDb, deleteProductFromDb } from "../firebaseService";

interface MarketplaceProps {
  userRef: UserProfile;
  onUpdateUser: (profile: UserProfile) => void;
}

export default function Marketplace({ userRef, onUpdateUser }: MarketplaceProps) {
  const [products, setProducts] = useState<ProductListing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // New Listing Data state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState<"Books" | "Calculators" | "Electronics" | "Study Materials">("Books");
  const [newPrice, setNewPrice] = useState("");
  const [newCond, setNewCond] = useState<"New" | "Like New" | "Good" | "Fair">("Good");
  const [newImg, setNewImg] = useState("");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeProducts((updatedProducts) => {
      setProducts(updatedProducts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice) {
      setErrorMsg("Title and Price are required.");
      return;
    }
    setErrorMsg("");

    try {
      const newListing = {
        title: newTitle,
        description: newDesc,
        category: newCat,
        price: Number(newPrice),
        condition: newCond,
        imageUrl: newImg || "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
        sellerId: userRef.id,
        sellerName: userRef.name,
        sellerAvatar: userRef.avatar,
        status: "Available" as const
      };
      await addProductToDb(newListing);
      setShowAddModal(false);
      // Reset states
      setNewTitle("");
      setNewDesc("");
      setNewPrice("");
      setNewImg("");
    } catch (err) {
      setErrorMsg("Failed to connect with live database.");
    }
  };

  const handleBuy = async (id: string) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    if (userRef.walletBalance < prod.price) {
      alert("Insufficient wallet balance! Please add funds in the Wallet tab.");
      return;
    }

    try {
      await buyProductInDb(prod, userRef);
      alert(`Purchase successful! Escrow ledger registered for: ${prod.title}. Please coordinate on-campus exchange.`);
    } catch (err) {
      console.error(err);
      alert("Network purchase failed.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this listing?")) return;
    try {
      await deleteProductFromDb(id);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Books": return <Book className="w-4 h-4 text-emerald-400" />;
      case "Calculators": return <Cpu className="w-4 h-4 text-sky-400" />;
      case "Electronics": return <Radio className="w-4 h-4 text-indigo-400" />;
      case "Study Materials": return <Clipboard className="w-4 h-4 text-amber-400" />;
      default: return <Book className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-xl font-sans font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-400" />
            Campus Marketplace
          </h2>
          <p className="text-xs text-slate-400">Secure student peer-to-peer trade with standard escrow protection.</p>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Listing
        </button>
      </div>

      {/* Filters & Navigation Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/60 p-4 border border-slate-800/80 rounded-xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search books, gadgets, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-300 focus:outline-none transition"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {["All", "Books", "Calculators", "Electronics", "Study Materials"].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                selectedCategory === cat 
                  ? "bg-indigo-600 text-white" 
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}

          <button 
            disabled={loading}
            className="p-1.5 bg-slate-950 text-slate-400 hover:text-white border border-slate-800 rounded-lg transition ml-auto md:ml-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Product Listings Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/60">
          <p className="text-sm text-slate-400">No active campus listings matching your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col hover:border-slate-700 transition duration-150">
              <div className="relative h-44 bg-slate-950">
                <img 
                  referrerPolicy="no-referrer"
                  src={p.imageUrl} 
                  alt={p.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400";
                  }}
                />
                
                {/* Condition pill */}
                <span className="absolute top-3 left-3 bg-slate-900/95 text-slate-300 font-mono text-[9px] uppercase px-2 py-0.5 rounded border border-slate-700">
                  {p.condition}
                </span>

                {/* Status pill */}
                <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                  p.status === "Available" 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {p.status}
                </span>
              </div>

              {/* Body Details */}
              <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    {getCategoryIcon(p.category)}
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{p.category}</span>
                  </div>
                  <h3 className="font-sans font-semibold text-white text-sm line-clamp-1">{p.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{p.description}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                    <span className="text-white text-base font-bold flex items-center">
                      <IndianRupee className="w-3.5 h-3.5 text-indigo-400 mr-0.5" />
                      {p.price.toFixed(2)}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <img src={p.sellerAvatar} className="w-5 h-5 rounded-full object-cover border border-slate-700" alt={p.sellerName} />
                      <span className="text-[10px] text-slate-400 font-medium max-w-[80px] truncate">{p.sellerName}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {p.sellerId === userRef.id ? (
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-600/10 hover:bg-red-600/25 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Listing
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy(p.id)}
                        disabled={p.status === "Sold"}
                        className={`w-full py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          p.status === "Sold" 
                            ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed" 
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {p.status === "Sold" ? "Sold in Escrow" : "Purchase via Escrow"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Listing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Create New Merchandise Listing</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-sm cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateListing} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-500/10 text-red-400 text-xs border border-red-500/20 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Product Title *</label>
                <input
                  type="text"
                  placeholder="e.g. iPad Pro M1 256GB with Pencil"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Category *</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Books">Books</option>
                    <option value="Calculators">Calculators</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Study Materials">Study Materials</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Ask Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 45.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Condition</label>
                  <select
                    value={newCond}
                    onChange={(e) => setNewCond(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Custom Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="e.g. https://domain.com/image.png"
                    value={newImg}
                    onChange={(e) => setNewImg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400">Details Description</label>
                <textarea
                  placeholder="Describe your item, details regarding its performance, annotations, standard meeting spots on campus..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-2.5 text-xs text-white focus:outline-none h-20 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 text-slate-300 font-medium text-xs rounded-xl hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-medium text-xs text-white rounded-xl transition cursor-pointer"
                >
                  Create Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
