'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Code, Eye, GitBranch, GitFork, GitPullRequest, Star } from 'lucide-react';

export type RepoTabId = 'files' | 'contributors' | 'workspaces' | 'pull-requests' | 'settings';

interface RepoTabsProps {
  activeTab: RepoTabId;
  onTabChange: (tab: RepoTabId) => void;
}

const tabs: { id: RepoTabId; icon: typeof Code; label: string }[] = [
  { id: 'files', icon: Code, label: 'Files' },
  { id: 'pull-requests', icon: GitPullRequest, label: 'Pull Requests' },
  { id: 'contributors', icon: CheckCircle, label: 'Contributors' },
  { id: 'workspaces', icon: GitBranch, label: 'Workspaces' },
  { id: 'settings', icon: AlertCircle, label: 'Settings' },
];

export function RepoTabs({ activeTab, onTabChange }: RepoTabsProps) {
  const [isStarred, setIsStarred] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-6 overflow-x-auto">
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

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setIsWatched(!isWatched)} className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Watch</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsStarred(!isStarred)} className="gap-2">
            <Star className={`h-4 w-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="hidden sm:inline text-xs">Star</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <GitFork className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Fork</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
