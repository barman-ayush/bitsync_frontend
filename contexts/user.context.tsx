'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    emailVerified: boolean;
    createdAt: string;
}

interface UserContextValue {
    user: User | null;
    setUser: (user: User | null) => void;
    clearUser: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();

    useEffect(() => {
        async function rehydrate() {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/user/data`,
                    { credentials: 'include' },
                );

                if (!res.ok) {
                    const body = await res.json();
                    if (body.code === 'EMAIL_NOT_VERIFIED') {
                        router.push('/auth/verify-email');
                        return;
                    }
                    console.log('User not authenticated');
                    return;
                }

                const { data } = await res.json();
                setUserState({
                    id: data.id,
                    email: data.email,
                    displayName: data.displayName,
                    avatarUrl: data.avatarUrl,
                    emailVerified: data.emailVerified,
                    createdAt: String(data.createdAt),
                });
            } catch (e) {
                console.log('Failed to fetch user data:', e);
            } finally {
                setIsLoading(false);
            }
        }

        rehydrate();
    }, []);

    const setUser = useCallback((next: User | null) => {
        setUserState(next);
    }, []);

    const clearUser = useCallback(() => {
        setUserState(null);
    }, []);

    const value = useMemo<UserContextValue>(
        () => ({
            user,
            setUser,
            clearUser,
            isAuthenticated: user !== null,
            isLoading,
            setIsLoading,
        }),
        [user, setUser, clearUser, isLoading],
    );

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
    const ctx = useContext(UserContext);
    if (ctx === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return ctx;
}
