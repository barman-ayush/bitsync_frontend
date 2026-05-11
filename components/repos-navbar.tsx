'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Github } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

interface ReposNavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ReposNavbar({ searchQuery, onSearchChange }: ReposNavbarProps) {
  return (
    <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Github className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold">Repositories</h1>
        </div>

        {/* Search and actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <Input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-64"
            />
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Repo</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden px-6 pb-4">
        <Input
          type="text"
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
