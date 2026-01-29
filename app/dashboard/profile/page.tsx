'use client';

import { useAuth } from '@/lib/auth-context';
import { User, Mail, Shield, LogOut, Bell, Settings } from 'lucide-react';

export default function ProfilePage() {
    const { user, signOut } = useAuth();

    if (!user) return null;

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter">Seller Profile</h1>
                <p className="text-gray-500 mt-2 font-medium">Manage your account settings and preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Overview */}
                <div className="md:col-span-2 space-y-6">
                    <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center space-x-6">
                                <div className="w-24 h-24 bg-black flex items-center justify-center flex-shrink-0">
                                    <User size={48} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight">{user.user_metadata?.full_name || 'Seller'}</h2>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">VCNTY Trusted Seller</p>
                                </div>
                            </div>
                            {/* <button className="px-4 py-2 border-2 border-black font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-white transition-colors">
                                Edit Profile
                            </button> */}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-3 text-black">
                                <Mail size={18} className="opacity-40" />
                                <span className="font-bold uppercase text-sm tracking-wide">{user.email}</span>
                            </div>
                            {/* <div className="flex items-center space-x-3 text-black">
                                <Shield size={18} className="opacity-40" />
                                <span className="font-bold uppercase text-sm tracking-wide">Verification: Level 1</span>
                            </div> */}
                        </div>
                    </div>
                    {/* 
                    <div className="border-4 border-black p-8 bg-white">
                        <h3 className="text-lg font-black uppercase tracking-tight mb-6">Security & Preferences</h3>
                        <div className="space-y-4">
                            <button className="w-full flex items-center justify-between p-4 border-2 border-black hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center space-x-3">
                                    <Bell size={20} />
                                    <span className="font-bold uppercase text-xs tracking-[0.2em]">Notification Settings</span>
                                </div>
                                <Settings size={18} className="opacity-50 group-hover:opacity-100" />
                            </button>
                            <button className="w-full flex items-center justify-between p-4 border-2 border-black hover:bg-gray-50 transition-colors group">
                                <div className="flex items-center space-x-3">
                                    <Shield size={20} />
                                    <span className="font-bold uppercase text-xs tracking-[0.2em]">Two-Factor Auth</span>
                                </div>
                                <Settings size={18} className="opacity-50 group-hover:opacity-100" />
                            </button>
                        </div>
                    </div> */}
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <div className="border-4 border-black p-6 bg-red-50">
                        {/* <h3 className="text-sm font-black uppercase tracking-widest text-red-600 mb-4">Danger Zone</h3> */}
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center justify-center space-x-2 py-4 bg-red-600 text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-red-700 transition-all active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                        >
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </div>

                    {/* <div className="border-4 border-black p-6 bg-black text-white">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-60">Help & Support</h3>
                        <p className="text-xs font-bold leading-relaxed mb-6">
                            NEED HELP MANAGING YOUR STORE OR INVENTORY? ACCESS OUR KNOWLEDGE BASE.
                        </p>
                        <button className="w-full py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-colors">
                            Visit Help Center
                        </button>
                    </div> */}
                </div>
            </div>
        </div>
    );
}
