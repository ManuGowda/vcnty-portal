'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Store, ShoppingBag, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    const navItems = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Stores', href: '/dashboard/stores', icon: Store },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className={`bg-black text-white w-64 fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out z-30`}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-bold tracking-tighter italic">VCNTY Portal</h1>
                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="border-t border-white/10 pt-4 mt-auto">
                        <div className="px-4 py-3 mb-4">
                            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Signed in as</p>
                            <p className="text-sm font-medium truncate">{user.email}</p>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="flex items-center space-x-3 px-4 py-3 w-full text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                        >
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 flex flex-col min-w-0 ${isSidebarOpen ? 'lg:pl-64' : ''}`}>
                <header className="bg-white border-b-2 border-black h-16 flex items-center px-6 sticky top-0 z-20">
                    <button onClick={() => setIsSidebarOpen(true)} className={`${isSidebarOpen ? 'hidden' : 'flex'} text-black mr-4`}>
                        <Menu size={24} />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-sm font-bold uppercase tracking-widest">
                            {navItems.find(item => item.href === pathname)?.name || 'Dashboard'}
                        </h2>
                    </div>
                </header>

                <main className="flex-1 p-6 lg:p-10">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
