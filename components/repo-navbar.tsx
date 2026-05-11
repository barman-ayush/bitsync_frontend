'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Code, GitBranch, AlertCircle, CheckCircle, Eye, Star, GitFork } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

interface RepoNavbarProps {
  owner: string;
  repo: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function RepoNavbar({ owner, repo, activeTab, onTabChange }: RepoNavbarProps) {
  const [isStarred, setIsStarred] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  const tabs = [
    { id: 'files', icon: Code, label: 'Files' },
    { id: 'contributors', icon: CheckCircle, label: 'Contributors' },
    { id: 'workspaces', icon: GitBranch, label: 'Workspaces' },
    { id: 'settings', icon: AlertCircle, label: 'Settings' },
  ];

  return (
    <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-muted-foreground">{owner}</span>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm font-bold">{repo}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md border border-border bg-input">
            <span className="text-xs text-muted-foreground">Type</span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs">to search</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsWatched(!isWatched)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Watch</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsStarred(!isStarred)}
              className="gap-2"
            >
              <Star className={`h-4 w-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline text-xs">Star</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <GitFork className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Fork</span>
            </Button>
          </div>

          <ThemeToggle />
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-6 px-4 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 transition text-sm font-medium whitespace-nowrap ${
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
