'use client';

import { Button } from '@/components/ui/button';
import { Plus, Search, X } from 'lucide-react';

interface ReposNavbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export function RepoSearchNavbar({ searchQuery, onSearchChange }: ReposNavbarProps) {
    return (
        <div className="px-6 md:px-12 lg:px-20 pt-6 pb-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-foreground">My Repositories</h1>
                <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New repository</span>
                </Button>
            </div>

            <div className="group flex items-center gap-2 h-10 rounded-md border border-border bg-card/40 px-3 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 hover:border-border/80">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                    type="text"
                    placeholder="Find a repository..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-0"
                />
                {searchQuery && (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => onSearchChange('')}
                        className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
