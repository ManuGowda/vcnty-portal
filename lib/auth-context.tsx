'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const ensureUserProfile = async (user: User, token?: string) => {
        if (!token) return;

        try {
            // Check if user exists in backend
            const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (checkResponse.status === 404) {
                console.log('[Auth] Profile not found in backend, creating...');
                // Create user in backend with SELLER type
                const name = user.user_metadata?.full_name || user.user_metadata?.name || 'Seller';

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        id: user.id,
                        name,
                        email: user.email,
                        userType: 'SELLER',
                        signupSource: 'portal',
                        createdAt: new Date().toISOString(),
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    console.error('[Auth] Failed to create user profile:', error);
                } else {
                    console.log('[Auth] Backend profile created successfully');
                }
            }
        } catch (error) {
            console.error('[Auth] Error ensuring user profile:', error);
        }
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                await ensureUserProfile(currentUser, session?.access_token);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                await ensureUserProfile(currentUser, session?.access_token);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            if (error.message.toLowerCase().includes('email not confirmed')) {
                throw new Error('Please confirm your email address before signing in. Check your inbox for the verification link.');
            }
            throw error;
        }
    };

    const signInWithGoogle = async () => {
        // Use a dedicated callback route for more robust session handling
        const redirectUrl = `${window.location.origin}/auth/callback`;
        console.log('[Auth] Initiating Google SSO with redirect:', redirectUrl);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'select_account',
                },
            },
        });
        if (error) throw error;
    };

    const signUp = async (email: string, password: string, name: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    signup_source: 'portal',
                },
            },
        });
        if (error) throw error;

        // ensureUserProfile will be called by onAuthStateChange if session is established
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
