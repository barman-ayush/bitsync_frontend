'use client';

import { CheckCircle, Code, GitBranch, GitPullRequest, UserCheck } from 'lucide-react';

export type RepoTabId = 'files' | 'contributors' | 'workspaces' | 'pull-requests' | 'review-requests';

interface RepoTabsProps {
  activeTab: RepoTabId;
  onTabChange: (tab: RepoTabId) => void;
}

const tabs: { id: RepoTabId; icon: typeof Code; label: string }[] = [
  { id: 'files', icon: Code, label: 'Files' },
  { id: 'workspaces', icon: GitBranch, label: 'Workspaces' },
  { id: 'pull-requests', icon: GitPullRequest, label: 'Pull Requests' },
  { id: 'review-requests', icon: UserCheck, label: 'Review Requests' },
  { id: 'contributors', icon: CheckCircle, label: 'Contributors' },
];

export function RepoTabs({ activeTab, onTabChange }: RepoTabsProps) {
  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center px-4">
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
      </div>
    </div>
  );
}
