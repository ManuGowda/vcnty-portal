'use client';

import { useAuth } from '@/lib/auth-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Truck, CheckCircle2, Package, Clock, XCircle, MapPin } from 'lucide-react';

export default function OrdersPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: orders, isLoading } = useQuery({
        queryKey: ['orders-seller'],
        queryFn: async () => {
            const { data } = await supabase.auth.getSession();
            return api.get<any[]>('/orders/seller', data.session?.access_token);
        },
        enabled: !!user,
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, status, reason }: { orderId: string; status: string; reason?: string }) => {
            const { data } = await supabase.auth.getSession();
            return api.patch(`/orders/${orderId}/status`, { status, reason }, data.session?.access_token);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders-seller'] });
        }
    });

    const handleUpdateStatus = (orderId: string, status: string, reason?: string) => {
        updateStatusMutation.mutate({ orderId, status, reason });
    };

    if (isLoading) {
        return <div className="p-12 text-center font-mono animate-pulse">Scanning Neighborhood Orders...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="border-b-4 border-black pb-6">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter">Order Fulfillment</h1>
                <p className="text-gray-500 mt-2 font-mono text-xs uppercase">Manage items your neighbors have requested.</p>
            </div>

            <div className="grid col-1 gap-6">
                {orders && orders.length > 0 ? (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row gap-8">
                            {/* Order Details */}
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-black text-white p-2">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg uppercase tracking-tight">Order #{order.id.slice(0, 8)}</h2>
                                            <p className="text-[10px] font-mono text-gray-400 uppercase">{new Date(order.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-black ${order.status === 'PENDING' ? 'bg-yellow-400' :
                                        order.status === 'PROCESSING' ? 'bg-blue-400' :
                                            order.status === 'CONFIRMED' ? 'bg-green-400' :
                                                order.status === 'DELIVERED' ? 'bg-black text-white' :
                                                    'bg-gray-100'
                                        }`}>
                                        {order.status}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 border-2 border-black">
                                        <div className="flex items-center space-x-2 text-gray-400 mb-1">
                                            <MapPin size={12} />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Delivery Address</span>
                                        </div>
                                        <p className="text-xs font-medium">{order.deliveryAddress}</p>
                                    </div>
                                    <div className="bg-slate-50 p-3 border-2 border-black">
                                        <div className="flex items-center space-x-2 text-gray-400 mb-1">
                                            <ShoppingBag size={12} />
                                            <span className="text-[8px] font-black uppercase tracking-widest">Total Value</span>
                                        </div>
                                        <p className="text-xs font-bold">{order.currency}{order.totalAmount}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-400">Order Items</span>
                                    <div className="space-y-2">
                                        {order.items?.map((item: any) => (
                                            <div key={item.id} className="flex items-center justify-between py-2 border-b-2 border-gray-100">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-gray-100 border-2 border-black overflow-hidden flex items-center justify-center">
                                                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <ShoppingBag size={16} className="text-gray-300" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold">{item.name}</p>
                                                        <p className="text-[8px] text-gray-400 uppercase">{item.storeName} • Qty: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-mono font-bold">{item.currency}{item.price}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="md:w-64 border-l-0 md:border-l-2 border-black md:pl-8 flex flex-col justify-center space-y-4">
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-center text-gray-400">Update Status</span>

                                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' ? (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                                            disabled={order.status === 'SHIPPED' || updateStatusMutation.isPending}
                                            className="w-full py-4 border-2 border-black font-bold text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-20"
                                        >
                                            <div className="flex items-center justify-center space-x-2">
                                                <Truck size={16} />
                                                <span>Mark as Shipped</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                            disabled={updateStatusMutation.isPending}
                                            className="w-full py-4 bg-black text-white font-bold text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-20 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                                        >
                                            <div className="flex items-center justify-center space-x-2">
                                                <CheckCircle2 size={16} />
                                                <span>Mark as Delivered</span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const reason = window.prompt("Reason for cancellation (e.g., Out of stock):");
                                                if (reason !== null) {
                                                    handleUpdateStatus(order.id, 'CANCELLED', reason);
                                                }
                                            }}
                                            disabled={updateStatusMutation.isPending}
                                            className="w-full py-2 text-red-500 font-bold text-[8px] uppercase tracking-widest hover:underline disabled:opacity-20"
                                        >
                                            <div className="flex items-center justify-center space-x-2">
                                                <XCircle size={12} />
                                                <span>Cancel Order</span>
                                            </div>
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">No further actions</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-slate-50 border-4 border-black border-dashed p-20 text-center">
                        <Package size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="font-serif text-xl">No active orders found.</p>
                        <p className="text-gray-400 font-mono text-[10px] uppercase mt-2">Orders requested by your neighbors will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
