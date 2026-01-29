'use client';

import { useAuth } from '@/lib/auth-context';
import { Package, Search, Plus } from 'lucide-react';

export default function ItemsPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Products & Items</h1>
                    <p className="text-gray-500 mt-2 font-medium">Manage your storefront inventory across all locations.</p>
                </div>
                <button className="bg-black text-white px-6 py-3 font-bold uppercase tracking-widest text-sm flex items-center space-x-2 hover:bg-gray-900 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                    <Plus size={18} />
                    <span>Add New Item</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="border-4 border-black p-4 bg-white flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="SEARCH ITEMS BY NAME, SKU, OR CATEGORY..."
                        className="w-full pl-12 pr-4 py-3 border-2 border-black font-bold uppercase placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                </div>
                <select className="px-6 py-3 border-2 border-black font-black uppercase tracking-widest text-xs focus:outline-none">
                    <option>All Categories</option>
                    <option>Electronics</option>
                    <option>Clothing</option>
                    <option>Home</option>
                </select>
                <select className="px-6 py-3 border-2 border-black font-black uppercase tracking-widest text-xs focus:outline-none">
                    <option>Sort By: Newest</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Stock: Low to High</option>
                </select>
            </div>

            {/* Empty State */}
            <div className="border-4 border-black border-dashed p-12 flex flex-col items-center justify-center bg-white">
                <div className="w-24 h-24 bg-gray-100 flex items-center justify-center mb-6">
                    <Package size={48} className="text-gray-300" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-2">No Items Found</h2>
                <p className="text-gray-500 mb-8 max-w-sm text-center">
                    You haven't added any items to your inventory yet. Start by adding your first product.
                </p>
                <button className="bg-black text-white px-8 py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-900 transition-all active:scale-95 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]">
                    Create Your First Item
                </button>
            </div>
        </div>
    );
}
