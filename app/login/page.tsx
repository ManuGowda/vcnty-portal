'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
    const { user, loading, signIn, signInWithGoogle } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await signIn(email, password);
            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign in');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="border-4 border-black p-8">
                    <h1 className="text-3xl font-bold mb-2 text-black">VCNTY</h1>
                    <p className="text-sm text-black mb-8 uppercase tracking-widest opacity-60">Seller Portal</p>

                    {error && (
                        <div className="bg-red-50 border-2 border-red-500 p-3 mb-4">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold mb-2 uppercase tracking-wide text-black">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="seller@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-bold mb-2 uppercase tracking-wide text-black">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-black text-white py-4 px-4 font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-800 disabled:bg-gray-400 transition-all active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                        >
                            {isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">OR</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => signInWithGoogle()}
                            className="w-full bg-white text-black py-4 px-4 border-2 border-black font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center space-x-3"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span>Continue with Google</span>
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-black">
                        Don&apos;t have an account?{' '}
                        <a href="/signup" className="font-bold text-black underline">
                            Sign up
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
