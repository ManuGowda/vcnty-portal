'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const handleCallback = async () => {
            const { error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error during auth callback:', error);
                router.push('/login?error=callback_failed');
            } else {
                router.push('/dashboard');
            }
        };

        handleCallback();
    }, [router]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
    );
}
