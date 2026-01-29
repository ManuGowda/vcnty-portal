'use client';

import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Store, ShoppingBag, Plus, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
    const { user } = useAuth();

    const { data: storesData } = useQuery({
        queryKey: ['stores'],
        queryFn: async () => {
            const { data } = await supabase.auth.getSession();
            return api.get<any>('/stores', data.session?.access_token);
        },
        enabled: !!user,
    });

    const stores = storesData?.items || [];

    const { data: itemsData } = useQuery({
        queryKey: ['items-owner', user?.id],
        queryFn: async () => {
            const { data } = await supabase.auth.getSession();
            return api.get<any>(`/items/owner/${user?.id}`, data.session?.access_token);
        },
        enabled: !!user,
    });

    const items = itemsData?.items || [];

    const { data: ordersData } = useQuery({
        queryKey: ['orders-seller'],
        queryFn: async () => {
            const { data } = await supabase.auth.getSession();
            return api.get<any>('/orders/seller', data.session?.access_token);
        },
        enabled: !!user,
    });

    const orders = ordersData?.items || [];

    const pendingOrdersCount = orders?.filter(o => ['PENDING', 'PROCESSING'].includes(o.status)).length || 0;

    const stats = [
        { label: 'Active Stores', value: stores?.length || 0, icon: Store },
        { label: 'Total Products', value: items?.length || 0, icon: ShoppingBag },
        { label: 'Pending Orders', value: pendingOrdersCount, icon: ArrowUpRight },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">Welcome back!</h1>
                    <p className="text-gray-500 mt-2">Here's what's happening in your VCNTY.</p>
                </div>
                <Link
                    href="/dashboard/stores/new"
                    className="bg-black text-white px-6 py-4 font-bold uppercase tracking-widest text-xs flex items-center space-x-2 hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:shadow-none translate-y-0 active:translate-y-[2px]"
                >
                    <Plus size={16} />
                    <span>New Store</span>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{stat.label}</span>
                                <Icon size={20} className="text-black" />
                            </div>
                            <div className="text-4xl font-black">{stat.value}</div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                <div className="bg-white border-4 border-black p-8">
                    <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b-2 border-black pb-4">Recent Stores</h2>
                    {stores && stores.length > 0 ? (
                        <div className="space-y-4">
                            {stores.slice(0, 3).map((store: any) => (
                                <div key={store.id} className="flex items-center justify-between p-4 border-2 border-slate-100 hover:border-black transition-colors group">
                                    <div>
                                        <h3 className="font-bold">{store.name}</h3>
                                        <p className="text-xs text-gray-500 uppercase">{store.category}</p>
                                    </div>
                                    <Link href={`/dashboard/stores/${store.id}`} className="text-black group-hover:translate-x-1 transition-transform">
                                        <ArrowUpRight size={20} />
                                    </Link>
                                </div>
                            ))}
                            <Link href="/dashboard/stores" className="block text-center text-xs font-bold uppercase tracking-widest mt-6 underline">View all stores</Link>
                        </div>
                    ) : (
                        <div className="py-10 text-center">
                            <p className="text-gray-500 italic">No stores created yet.</p>
                            <Link href="/dashboard/stores/new" className="text-black font-bold underline mt-2 block">Create your first store</Link>
                        </div>
                    )}
                </div>

                <div className="bg-black text-white p-8 overflow-hidden">
                    <h2 className="text-xl font-bold uppercase tracking-widest mb-6 border-b-1 border-white/20 pb-4">Recent Orders</h2>
                    {orders && orders.length > 0 ? (
                        <div className="space-y-4">
                            {orders.slice(0, 3).map((order: any) => (
                                <div key={order.id} className="flex items-center justify-between p-4 border border-white/10 hover:border-white transition-colors group">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-bold truncate text-sm">Order #{order.id.slice(0, 8)}</h3>
                                            <span className={`text-[8px] px-1.5 py-0.5 font-black uppercase tracking-widest rounded ${order.status === 'PENDING' ? 'bg-yellow-400 text-black' :
                                                order.status === 'PROCESSING' ? 'bg-blue-400 text-black' :
                                                    order.status === 'CONFIRMED' ? 'bg-green-400 text-black' :
                                                        'bg-white/20 text-white'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                                            {order.items?.length || 0} items • {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold ml-4">{order.currency}{order.totalAmount}</span>
                                </div>
                            ))}
                            <Link href="/dashboard/orders" className="block text-center text-[10px] font-bold uppercase tracking-widest mt-6 text-white/40 hover:text-white underline">Manage all orders</Link>
                        </div>
                    ) : (
                        <div className="py-10 text-center">
                            <ShoppingBag size={40} className="mx-auto text-white/10 mb-4" />
                            <p className="text-white/40 italic text-sm">No orders yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
