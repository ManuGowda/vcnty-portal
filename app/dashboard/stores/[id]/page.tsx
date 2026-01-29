'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Image as ImageIcon,
    Edit3,
    Power,
    Search,
    CheckSquare,
    Square,
    FileUp,
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import CSVBulkUpload from '@/components/stores/CSVBulkUpload';
import ItemForm, { CATEGORIES } from '@/components/items/ItemForm';

export default function StoreDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const shouldOpenUpload = searchParams.get('upload') === 'true';
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isCSVModalOpen, setIsCSVModalOpen] = useState(shouldOpenUpload);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

    const [page, setPage] = useState(0);
    const limit = 10;

    // Fetch store details
    const { data: store, isLoading: isStoreLoading } = useQuery({
        queryKey: ['store', id],
        queryFn: async () => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            return api.get<any>(`/stores/${id}`, token);
        },
        enabled: !!id,
    });

    // Fetch items for this store
    const { data: itemsData, isLoading: isItemsLoading } = useQuery({
        queryKey: ['items', id, page],
        queryFn: async () => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            return api.get<any>(`/items/store/${id}?limit=${limit}&offset=${page * limit}`, token);
        },
        enabled: !!id,
    });

    const items = itemsData?.items || [];
    const total = itemsData?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Toggle store status mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async (newStatus: string) => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            return api.put(`/stores/${id}`, { status: newStatus }, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['store', id] });
        }
    });

    // Create item mutation
    const createItemMutation = useMutation({
        mutationFn: async (itemData: any) => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            return api.post('/items', { ...itemData, storeId: id }, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items', id] });
            setIsItemModalOpen(false);
        }
    });

    // Update item mutation with optimistic updates
    const updateItemMutation = useMutation({
        mutationFn: async (itemData: any) => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            return api.put(`/items/${itemData.id}`, itemData, token);
        },
        onMutate: async (updatedItem: any) => {
            await queryClient.cancelQueries({ queryKey: ['items', id] });
            const previousData = queryClient.getQueryData(['items', id]);
            queryClient.setQueryData(['items', id], (old: any | undefined) =>
                old ? { ...old, items: old.items.map((item: any) => item.id === updatedItem.id ? { ...item, ...updatedItem } : item) } : old
            );
            return { previousData };
        },
        onError: (err, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['items', id], context.previousData);
            }
            alert(err instanceof Error ? err.message : 'Failed to update item');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['items', id] });
            setEditingItem(null);
        }
    });

    // Delete item mutation with optimistic updates
    const deleteItemMutation = useMutation({
        mutationFn: async (itemId: string) => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            return api.delete(`/items/${itemId}`, token);
        },
        onMutate: async (deletedItemId: string) => {
            await queryClient.cancelQueries({ queryKey: ['items', id] });
            const previousData = queryClient.getQueryData(['items', id]);
            queryClient.setQueryData(['items', id], (old: any | undefined) =>
                old ? { ...old, items: old.items.filter((item: any) => item.id !== deletedItemId) } : old
            );
            return { previousData };
        },
        onError: (err, deletedItemId, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['items', id], context.previousData);
            }
            alert(err instanceof Error ? err.message : 'Failed to delete item');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['items', id] });
        }
    });

    // Batch delete item mutation
    const batchDeleteMutation = useMutation({
        mutationFn: async (itemIds: string[]) => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            return api.post('/items/batch-delete', { ids: itemIds }, token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['items', id] });
            setSelectedItemIds([]);
        },
        onError: (err) => {
            alert(err instanceof Error ? err.message : 'Failed to delete items');
        }
    });

    // Delete store mutation
    const deleteStoreMutation = useMutation({
        mutationFn: async () => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            return api.delete(`/stores/${id}`, token);
        },
        onSuccess: () => {
            router.push('/dashboard/stores');
        }
    });

    if (isStoreLoading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black" /></div>;
    }

    if (!store) {
        return <div className="text-center py-20">Store not found.</div>;
    }

    const isOnline = store.status === 'PUBLISHED';
    const availableCategories = Array.from(new Set([
        ...CATEGORIES,
        ...(items || []).map((item: any) => item.category).filter(Boolean)
    ])).sort();

    const filteredItems = (items || []).filter((item: any) => {
        const query = searchQuery.toLowerCase();
        return (
            item.title?.toLowerCase().includes(query) ||
            item.sku?.toLowerCase().includes(query) ||
            item.category?.toLowerCase().includes(query) ||
            item.shortDescription?.toLowerCase().includes(query)
        );
    });

    const toggleSelectAll = () => {
        if (selectedItemIds.length === filteredItems.length) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(filteredItems.map((item: any) => item.id));
        }
    };

    const toggleSelectItem = (itemId: string) => {
        setSelectedItemIds(prev =>
            prev.includes(itemId)
                ? prev.filter(i => i !== itemId)
                : [...prev, itemId]
        );
    };

    return (
        <div className="space-y-10 relative" >
            {/* Header */}
            < div className="flex flex-col md:flex-row md:items-end justify-between gap-6" >
                <div className="space-y-4">
                    <Link href="/dashboard/stores" className="text-xs font-bold uppercase tracking-widest flex items-center space-x-2 text-gray-500 hover:text-black">
                        <ArrowLeft size={16} />
                        <span>Back to all stores</span>
                    </Link>
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">{store.name}</h1>
                    <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-2 border-black ${isOnline ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                        <span className="text-xs font-mono text-gray-400">ID: {store.id}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => toggleStatusMutation.mutate(isOnline ? 'DRAFT' : 'PUBLISHED')}
                        disabled={toggleStatusMutation.isPending}
                        className={`px-6 py-4 font-bold uppercase tracking-widest text-xs flex items-center space-x-3 border-2 border-black transition-all ${isOnline ? 'bg-white text-black hover:bg-red-50' : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                    >
                        <Power size={16} />
                        <span>{isOnline ? 'Take Offline' : 'Publish Store'}</span>
                    </button>

                    <button
                        onClick={() => setIsCSVModalOpen(true)}
                        className="bg-white text-black border-2 border-black px-6 py-4 font-bold uppercase tracking-widest text-xs flex items-center space-x-3 hover:bg-gray-50 transition-all"
                    >
                        <FileUp size={16} />
                        <span>Bulk Upload</span>
                    </button>

                    <button
                        onClick={() => setIsItemModalOpen(true)}
                        className="bg-black text-white px-6 py-4 font-bold uppercase tracking-widest text-xs flex items-center space-x-3 hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                    >
                        <Plus size={18} />
                        <span>New Item Listing</span>
                    </button>
                </div>
            </div >

            {/* Grid: Details & Inventory */}
            < div className="grid grid-cols-1 lg:grid-cols-4 gap-10" >
                {/* Left: Store Meta */}
                < div className="lg:col-span-1 space-y-6" >
                    <div className="bg-white border-4 border-black p-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest mb-6 border-b-2 border-black pb-2">Store Info</h3>
                        <div className="space-y-6">
                            <div>
                                <span className="block text-[10px] text-gray-400 uppercase font-black mb-1">Description</span>
                                <p className="text-sm italic text-gray-600">{store.description || 'No description listed.'}</p>
                            </div>
                            <div>
                                <span className="block text-[10px] text-gray-400 uppercase font-black mb-1">Category</span>
                                <p className="text-sm font-bold border-b-2 border-black inline-block">{store.category}</p>
                            </div>
                            <Link
                                href={`/dashboard/stores/${id}/edit`}
                                className="block text-center border-2 border-black p-3 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                            >
                                Edit Store Settings
                            </Link>
                            <button
                                onClick={() => {
                                    if (window.confirm(`Delete store "${store.name}"? This cannot be undone.`)) {
                                        deleteStoreMutation.mutate();
                                    }
                                }}
                                disabled={deleteStoreMutation.isPending}
                                className="w-full text-center border-2 border-red-200 p-3 text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                            >
                                {deleteStoreMutation.isPending ? 'Deleting...' : 'Delete Store'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-50 border-4 border-blue-200 p-8">
                        <div className="flex items-start space-x-3">
                            <AlertCircle size={20} className="text-blue-500 mt-1" />
                            <div className="space-y-2">
                                <h4 className="font-bold text-sm uppercase tracking-tight text-blue-900">Visibility Note</h4>
                                <p className="text-xs text-blue-800 leading-relaxed">
                                    When your store is <strong>Online</strong>, neighbors in your VCNTY can see your inventory on their mobile maps. Toggle to Offline to temporarily hide your listing.
                                </p>
                            </div>
                        </div>
                    </div>
                </div >

                {/* Right: Items Listing Table */}
                < div className="lg:col-span-3 space-y-6" >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black uppercase tracking-tight">Active Inventory</h2>
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                                Showing {items.length} of {total} items
                            </p>
                        </div>

                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search inventory by title, SKU, or category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-4 border-black font-bold focus:outline-none focus:bg-slate-50 transition-colors placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    {
                        selectedItemIds.length > 0 && (
                            <div className="bg-black text-white p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                                <span className="text-xs font-black uppercase tracking-widest">
                                    {selectedItemIds.length} items selected
                                </span>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setSelectedItemIds([])}
                                        className="text-xs uppercase font-bold border-b-2 border-white hover:opacity-70"
                                    >
                                        Deselect All
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Permanently delete ${selectedItemIds.length} items?`)) {
                                                batchDeleteMutation.mutate(selectedItemIds);
                                            }
                                        }}
                                        disabled={batchDeleteMutation.isPending}
                                        className="bg-red-500 text-white px-4 py-2 text-xs font-black uppercase tracking-widest hover:bg-red-600 disabled:opacity-50"
                                    >
                                        {batchDeleteMutation.isPending ? 'Deleting...' : 'Delete Selected'}
                                    </button>
                                </div>
                            </div>
                        )
                    }

                    {
                        isItemsLoading ? (
                            <div className="py-20 flex justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-black" /></div>
                        ) : items && items.length > 0 ? (
                            <div className="bg-white border-4 border-black overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-4 border-black bg-slate-50">
                                            <th className="p-4 w-10">
                                                <button onClick={toggleSelectAll} className="flex items-center justify-center">
                                                    {selectedItemIds.length === filteredItems.length && filteredItems.length > 0 ? (
                                                        <CheckSquare size={20} className="text-black" />
                                                    ) : (
                                                        <Square size={20} className="text-gray-300" />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest w-20">Preview</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Title</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Stock</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest">Price</th>
                                            <th className="p-4 text-[10px] font-black uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-black">
                                        {filteredItems.map((item: any) => (
                                            <tr key={item.id} className={`hover:bg-slate-50 transition-colors group ${selectedItemIds.includes(item.id) ? 'bg-slate-50' : ''}`}>
                                                <td className="p-4">
                                                    <button onClick={() => toggleSelectItem(item.id)} className="flex items-center justify-center">
                                                        {selectedItemIds.includes(item.id) ? (
                                                            <CheckSquare size={18} className="text-black" />
                                                        ) : (
                                                            <Square size={18} className="text-gray-200 group-hover:text-gray-400" />
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <div className="w-12 h-12 border-2 border-black bg-slate-100 flex items-center justify-center overflow-hidden">
                                                        {item.images?.[0] ? (
                                                            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon size={20} className="text-slate-300" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-sm">{item.title}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-tight font-bold">{item.category}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-sm tracking-tighter">{item.quantity}</div>
                                                    <div className="text-[9px] text-gray-400 font-mono">{item.sku || '-'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-mono font-bold text-sm bg-yellow-100 px-2 py-1">{item.price} {item.currency}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => setEditingItem(item)}
                                                            className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all"
                                                            title="Edit Item"
                                                        >
                                                            <Edit3 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Permanently remove this item from your inventory?'))
                                                                    deleteItemMutation.mutate(item.id);
                                                            }}
                                                            className="p-2 border-2 border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                            title="Delete Item"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="border-4 border-black border-dashed p-20 text-center bg-slate-50">
                                <p className="text-gray-400 italic mb-6 text-sm font-medium">Your inventory is empty. Add items to start appearing in your VCNTY.</p>
                                <button
                                    onClick={() => setIsItemModalOpen(true)}
                                    className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest text-xs inline-flex items-center space-x-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
                                >
                                    <Plus size={16} />
                                    <span>Add first item</span>
                                </button>
                            </div>
                        )
                    }

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center space-x-4 border-t-4 border-black pt-8">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-3 border-2 border-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all active:translate-y-1"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="text-xs font-black uppercase tracking-widest">
                                Page {page + 1} of {totalPages}
                            </div>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= totalPages - 1}
                                className="p-3 border-2 border-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all active:translate-y-1"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div >
            </div >

            {/* Modals */}
            {
                isItemModalOpen && (
                    <ItemForm
                        availableCategories={availableCategories}
                        storeStatus={store.status}
                        onClose={() => setIsItemModalOpen(false)}
                        onSubmit={async (data) => createItemMutation.mutate(data)}
                        isSubmitting={createItemMutation.isPending}
                    />
                )
            }

            {
                editingItem && (
                    <ItemForm
                        key={editingItem.id}
                        availableCategories={availableCategories}
                        initialData={editingItem}
                        storeLocation={{ latitude: store.latitude, longitude: store.longitude }}
                        storeStatus={store.status}
                        onClose={() => setEditingItem(null)}
                        onSubmit={async (data) => updateItemMutation.mutate({ ...data, id: editingItem.id })}
                        isSubmitting={updateItemMutation.isPending}
                    />
                )
            }

            {
                isCSVModalOpen && (
                    <CSVBulkUpload
                        storeId={id as string}
                        storeLocation={{ latitude: store.latitude, longitude: store.longitude }}
                        onClose={() => setIsCSVModalOpen(false)}
                        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['items', id] })}
                    />
                )
            }
        </div >
    );
}

