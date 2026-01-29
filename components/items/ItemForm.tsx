'use client';

import { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

export const CATEGORIES = ['Food', 'Beauty', 'Crafts', 'Electronics', 'Home', 'Fashion', 'Other'];

interface ItemFormProps {
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    isSubmitting: boolean;
    initialData?: any;
    availableCategories?: string[];
    storeStatus?: 'DRAFT' | 'PUBLISHED';
    storeLocation: { latitude: number; longitude: number };
}

export default function ItemForm({ onClose, onSubmit, isSubmitting, initialData, availableCategories, storeStatus, storeLocation }: ItemFormProps) {
    const defaults = {
        title: initialData?.title || initialData?.name || '',
        shortDescription: initialData?.shortDescription || initialData?.short_description || initialData?.short_desc || '',
        description: initialData?.description || initialData?.full_description || '',
        price: initialData?.price || '',
        currency: initialData?.currency || 'EUR',
        quantity: initialData?.quantity || 1,
        sku: initialData?.sku || initialData?.SKU || '',
        category: initialData?.category || 'Other',
        status: initialData?.status || (storeStatus === 'DRAFT' ? 'DRAFT' : 'AVAILABLE'),
        images: initialData?.images || [],
        tags: initialData?.tags || []
    };

    const [formData, setFormData] = useState(defaults);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            price: parseFloat(String(formData.price)),
            quantity: parseInt(String(formData.quantity)),
            latitude: storeLocation.latitude,
            longitude: storeLocation.longitude
        });
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-white border-4 border-black w-full max-w-xl shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh]">
                <div className="p-6 border-b-4 border-black flex items-center justify-between">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">
                        {initialData ? 'Edit Item' : 'New Item Listing'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Item Title</label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium"
                                placeholder="e.g. Artisanal Sourdough"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">SKU</label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium"
                                placeholder="INTERNAL-SKU-1"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Price</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Currency</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium appearance-none"
                            >
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Stock Quantity</label>
                            <input
                                required
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Short Description</label>
                        <input
                            type="text"
                            value={formData.shortDescription}
                            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium"
                            placeholder="Single line summary..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Full Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium resize-none"
                            placeholder="Detailed product information..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium appearance-none bg-white"
                            >
                                {(availableCategories || CATEGORIES).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                                {formData.category && !(availableCategories || CATEGORIES).includes(formData.category) && (
                                    <option value={formData.category}>{formData.category}</option>
                                )}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium appearance-none bg-white font-bold disabled:bg-gray-100 disabled:text-gray-500"
                                disabled={storeStatus === 'DRAFT'}
                            >
                                {storeStatus === 'DRAFT' && <option value="DRAFT">DRAFT (Store Unpublished)</option>}
                                <option value="AVAILABLE">AVAILABLE</option>
                                <option value="RESERVED">RESERVED</option>
                                <option value="SOLD">SOLD</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tags (Comma separated)</label>
                        <input
                            type="text"
                            value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
                            className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium"
                            placeholder="eco, organic, local"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Image URL</label>
                        <div className="flex gap-4">
                            <input
                                type="url"
                                value={formData.images?.[0] || ''}
                                onChange={(e) => setFormData({ ...formData, images: [e.target.value] })}
                                className="flex-1 px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium"
                                placeholder="https://example.com/image.jpg"
                            />
                            {formData.images?.[0] && (
                                <div className="w-12 h-12 border-2 border-black overflow-hidden shrink-0">
                                    <img src={formData.images[0]} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t-4 border-black mt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-black text-white py-5 font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center space-x-3 hover:bg-gray-800 disabled:bg-gray-400 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-0 active:translate-y-[4px]"
                        >
                            <Save size={18} />
                            <span>{isSubmitting ? 'Saving Changes...' : (initialData ? 'Update Item' : 'List Item')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
