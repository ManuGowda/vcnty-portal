'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Plus, Store, ArrowRight, Settings, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Store {
    id: string;
    name: string;
    description?: string;
    category?: string;
    status: 'active' | 'inactive' | 'archived';
}

export default function StoresPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const limit = 6;

    const { data: storesData, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['stores', page],
        queryFn: async () => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            return api.get<{ items: Store[]; total: number }>(`/stores?limit=${limit}&offset=${page * limit}`, token);
        },
        enabled: !!user,
        retry: 1, // Don't retry indefinitely
        staleTime: 30000,
    });

    const stores = storesData?.items || [];
    const total = storesData?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const deleteStoreMutation = useMutation({
        mutationFn: async ({ id }: { id: string; name: string }) => {
            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            return api.delete(`/stores/${id}`, token);
        },
        onMutate: async ({ id: deletedStoreId }) => {
            await queryClient.cancelQueries({ queryKey: ['stores'] });
            const previousData = queryClient.getQueryData<{ items: Store[]; total: number }>(['stores']);
            queryClient.setQueryData(['stores'], (old: { items: Store[]; total: number } | undefined) =>
                old ? { ...old, items: old.items.filter((store) => store.id !== deletedStoreId) } : old
            );
            return { previousData };
        },
        onError: (err, variables, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['stores'], context.previousData);
            }
            alert(err instanceof Error ? err.message : 'Failed to delete store');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['stores'] });
        }
    });

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the store "${name}"? This action cannot be undone and will delete all items in this store.`)) {
            deleteStoreMutation.mutate({ id, name });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b-4 border-black pb-8">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">My Stores</h1>
                    <p className="text-gray-500 mt-2">Manage your physical store locations and their inventory.</p>
                </div>
                <Link
                    href="/dashboard/stores/new"
                    className="bg-black text-white px-8 py-5 font-bold uppercase tracking-widest text-sm flex items-center space-x-3 hover:bg-gray-800 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none translate-y-0 active:translate-y-[2px]"
                >
                    <Plus size={18} />
                    <span>Add New Store</span>
                </Link>
            </div>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-black mb-4"></div>
                    <p className="text-xs font-black uppercase tracking-widest animate-pulse">Fetching stores...</p>
                </div>
            ) : isError ? (
                <div className="bg-red-50 border-4 border-black p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tight text-red-600">Sync Failure</h2>
                        <p className="text-gray-700 mb-8 italic">
                            We couldn't reach the VCNTY network. This might be due to a connection issue or security policy.
                            <br />
                            <span className="text-[10px] font-bold not-italic">Error: {error instanceof Error ? error.message : 'Unknown error'}</span>
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="bg-black text-white px-8 py-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-800 transition-all active:scale-95 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]"
                        >
                            Retry Sync
                        </button>
                    </div>
                </div>
            ) : stores && stores.length > 0 ? (
                <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {stores.map((store: any) => (
                            <div key={store.id} className="bg-white border-4 border-black overflow-hidden flex flex-col group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
                                <div className="p-8 flex-1">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="bg-black p-3 rounded-none text-white">
                                            <Store size={24} />
                                        </div>
                                        <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-2 border-black ${store.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                                            {store.status || 'inactive'}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black mb-2">{store.name}</h3>
                                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 italic">{store.description || 'No description provided.'}</p>

                                    <div className="flex items-center space-x-4">
                                        <span className="text-xs font-bold uppercase tracking-wide text-black/40">Category:</span>
                                        <span className="text-xs font-bold border-b-2 border-black">{store.category}</span>
                                    </div>
                                </div>

                                <div className="border-t-4 border-black border-collapse">
                                    <Link
                                        href={`/dashboard/stores/${store.id}`}
                                        className="p-4 w-full text-center text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex items-center justify-center space-x-2 border-b-4 border-black"
                                    >
                                        <span>Manage Inventory</span>
                                        <ArrowRight size={14} />
                                    </Link>
                                    <div className="grid grid-cols-2 divide-x-4 divide-black">
                                        <Link
                                            href={`/dashboard/stores/${store.id}/edit`}
                                            className="p-4 text-center text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex items-center justify-center space-x-2"
                                        >
                                            <Settings size={14} />
                                            <span>Edit</span>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(store.id, store.name)}
                                            className="p-4 text-center text-xs font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center space-x-2 text-red-600"
                                        >
                                            <Trash2 size={14} />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center space-x-4 border-t-4 border-black pt-8">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-4 border-4 border-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all active:translate-y-1"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div className="text-sm font-black uppercase tracking-widest">
                                Page {page + 1} of {totalPages}
                            </div>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= totalPages - 1}
                                className="p-4 border-4 border-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all active:translate-y-1"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white border-4 border-black p-20 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-20 h-20 bg-slate-100 border-2 border-black flex items-center justify-center mx-auto mb-6">
                            <Store size={40} className="text-black/20" />
                        </div>
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tight">No Stores Found</h2>
                        <p className="text-gray-500 mb-10 italic">Your VCNTY is empty. Start your journey by creating a store to share your items with the neighborhood.</p>
                        <Link
                            href="/dashboard/stores/new"
                            className="inline-block bg-black text-white px-8 py-5 font-bold uppercase tracking-widest text-sm hover:bg-gray-800 transition-colors"
                        >
                            Create First Store
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
