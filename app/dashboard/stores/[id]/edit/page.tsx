'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { ArrowLeft, Save, MapPin, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const CATEGORIES = ['FOOD', 'BEAUTY', 'CRAFTS', 'ELECTRONICS', 'HOME', 'FASHION', 'OTHER'] as const;

export default function EditStorePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'OTHER',
        latitude: 0,
        longitude: 0,
        address: '',
        city: '',
        pincode: ''
    });

    useEffect(() => {
        const fetchStore = async () => {
            if (!id || !user) return;
            try {
                const session = await supabase.auth.getSession();
                const token = session.data.session?.access_token;
                const store = await api.get<any>(`/stores/${id}`, token);

                // Casing normalization
                const dbCategory = store.category?.toUpperCase() || 'OTHER';
                const matchedCategory = (CATEGORIES as readonly string[]).includes(dbCategory) ? dbCategory : 'OTHER';

                setFormData({
                    name: store.name || '',
                    description: store.description || '',
                    category: matchedCategory,
                    latitude: parseFloat(store.latitude) || 0,
                    longitude: parseFloat(store.longitude) || 0,
                    address: '', // Store doesn't persist this yet, start empty
                    city: '',
                    pincode: ''
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch store details');
            } finally {
                setLoading(false);
            }
        };

        fetchStore();
    }, [id, user]);

    const geocodeAddress = async () => {
        if (!formData.address || !formData.city) return;

        const btnText = document.activeElement?.textContent;
        if (document.activeElement instanceof HTMLElement) document.activeElement.innerText = "Locating...";

        try {
            const query = `${formData.address}, ${formData.city} ${formData.pincode}`;
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (data && data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon)
                }));
            } else {
                alert("Address not found. Please try again or use current location.");
            }
        } catch (e) {
            console.error(e);
            alert("Geocoding failed. Please try again.");
        } finally {
            if (document.activeElement instanceof HTMLElement) document.activeElement.innerText = "Get Coordinates from Address";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;

            // Only send fields the backend expects
            const { address, city, pincode, ...payload } = formData;
            console.log('Updating store with payload:', payload);
            await api.put<any>(`/stores/${id}`, payload, token);
            router.push(`/dashboard/stores/${id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update store');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete the store "${formData.name}"? This action cannot be undone and will delete all items in this store.`)) {
            return;
        }

        setSaving(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            await api.delete(`/stores/${id}`, token);
            router.push('/dashboard/stores');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete store');
            setSaving(false);
        }
    };

    const useCurrentLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }));
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="font-black uppercase tracking-widest text-xs">Loading store settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center space-x-4">
                <Link href={`/dashboard/stores/${id}`} className="p-3 border-2 border-black hover:bg-black hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">Edit Store Settings</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest">Store Name</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium"
                                placeholder="e.g. My Vintage Shop"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest">Business Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium appearance-none"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat.charAt(0) + cat.slice(1).toLowerCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium resize-none"
                                placeholder="Tell neighbors what your store is about..."
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t-2 border-black border-dashed">
                            <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Update Address</h3>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest">Address Line</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium"
                                    placeholder="Enter new address to update coordinates..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest">City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium"
                                        placeholder="City"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest">Pincode</label>
                                    <input
                                        type="text"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-medium"
                                        placeholder="Zip/Postal Code"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={geocodeAddress}
                                    disabled={!formData.address || !formData.city}
                                    className="px-4 py-2 bg-gray-100 border-2 border-black text-xs font-bold uppercase hover:bg-gray-200 disabled:opacity-50"
                                >
                                    Get Coordinates from Address
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t-2 border-black border-dashed">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-widest">Location (Lat/Long)</label>
                                <button
                                    type="button"
                                    onClick={useCurrentLocation}
                                    className="text-[10px] font-bold uppercase tracking-widest underline flex items-center space-x-1 hover:text-blue-600"
                                >
                                    <MapPin size={12} />
                                    <span>Use current location</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold">Latitude</span>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 border-2 border-black text-sm bg-gray-50"
                                        readOnly
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold">Longitude</span>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-2 border-2 border-black text-sm bg-gray-50"
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border-2 border-red-500 text-red-700 text-sm font-bold uppercase tracking-tight">
                            Error: {error}
                        </div>
                    )}
                </div>

                <div className="flex space-x-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-black text-white py-5 font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center space-x-3 hover:bg-gray-800 disabled:bg-gray-400 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none translate-y-0 active:translate-y-[4px] transition-all"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Saving Changes...</span>
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                <span>Update Store Settings</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={saving}
                        className="bg-red-50 text-red-600 px-8 border-2 border-red-200 font-bold uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                    >
                        <Trash2 size={16} className="inline mr-2" />
                        Delete Store
                    </button>
                </div>
            </form>
        </div>
    );
}
