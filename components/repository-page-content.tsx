'use client';

import { useState } from 'react';
import { RepoNavbar } from '@/components/repo-navbar';
import { FileBrowser } from '@/components/file-browser';
import { FileItem } from '@/types/files';

interface RepositoryPageContentProps {
  owner: string;
  repo: string;
  files: FileItem[];
}

export function RepositoryPageContent({
  owner,
  repo,
  files,
}: RepositoryPageContentProps) {
  const [activeTab, setActiveTab] = useState('files');

  return (
    <div className="flex flex-col h-screen bg-background">
      <RepoNavbar
        owner={owner}
        repo={repo}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' && <FileBrowser files={files} />}
        {activeTab === 'contributors' && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Contributors view coming soon
          </div>
        )}
        {activeTab === 'workspaces' && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Workspaces view coming soon
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Settings view coming soon
          </div>
        )}
      </div>
    </div>
  );
}
