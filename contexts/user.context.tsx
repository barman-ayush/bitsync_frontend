'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

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
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<User | null>(null);

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
        }),
        [user, setUser, clearUser],
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
