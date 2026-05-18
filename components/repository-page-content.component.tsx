'use client';

import { useState } from 'react';
import { RepoTabs, type RepoTabId } from '@/components/repo-tabs.component';
import { FileBrowser } from '@/components/file-browser.component';
import { Contributors } from '@/components/contributors.component';
import { FileItem } from '@/types/files';
import { Contributor } from '@/types/contributors';

interface RepositoryPageContentProps {
    files: FileItem[];
    contributors: Contributor[];
}

export function RepositoryPageContent({
    files,
    contributors,
}: RepositoryPageContentProps) {
    const [activeTab, setActiveTab] = useState<RepoTabId>('files');

    return (
        <div className="flex flex-col h-full bg-background">
            <RepoTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="flex-1 overflow-hidden">
                {activeTab === 'files' && <FileBrowser files={files} />}
                {activeTab === 'contributors' && <Contributors contributors={contributors} />}
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
