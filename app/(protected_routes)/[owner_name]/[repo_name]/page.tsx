'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { RepoTabs, type RepoTabId } from '@/components/repo-tabs.component';
import { ErrorDisplay } from '@/components/error-display.component';
import { FileBrowser } from '@/components/file-browser.component';
import { EmptyRepoState } from '@/components/empty-repo-state.component';
import { Contributors } from '@/components/contributors.component';
import { WorkspaceView } from '@/components/workspace-view.component';
import { FileItem } from '@/types/files';
import { Contributor } from '@/types/contributors';
import { Repository } from '@/types/repos';
import { normalizeRepository } from '@/lib/normalize-repository';
import { normalizeContributor } from '@/lib/normalize-contributor';

// Mock data - replace with actual API calls
const mockFiles: FileItem[] = [
    {
        id: '1',
        name: 'src',
        type: 'folder',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'barman-ayush',
        description: 'Source code files',
        versions: 12,
    },
    {
        id: '2',
        name: 'public',
        type: 'folder',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'barman-ayush',
        description: 'Static assets',
        versions: 4,
    },
    {
        id: '3',
        name: 'package.json',
        type: 'file',
        size: 2048,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'barman-ayush',
        description: 'Project dependencies',
        versions: 8,
    },
    {
        id: '4',
        name: '.gitignore',
        type: 'file',
        size: 512,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'barman-ayush',
        versions: 3,
    },
    {
        id: '5',
        name: 'README.md',
        type: 'file',
        size: 5120,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'barman-ayush',
        description: 'Project documentation',
        versions: 15,
    },
    {
        id: '6',
        name: 'next.config.js',
        type: 'file',
        size: 1024,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'barman-ayush',
        versions: 5,
    },
    {
        id: '7',
        name: 'tailwind.config.ts',
        type: 'file',
        size: 1536,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'barman-ayush',
        versions: 4,
    },
    {
        id: '8',
        name: 'tsconfig.json',
        type: 'file',
        size: 768,
        createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        owner: 'barman-ayush',
        versions: 2,
    },
];

export default function RepositoryPage() {
    const params = useParams<{ owner_name: string; repo_name: string }>();
    const ownerName = params?.owner_name;
    const repoName = params?.repo_name;

    const [repository, setRepository] = useState<Repository | null>(null);
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [activeTab, setActiveTab] = useState<RepoTabId>('files');
    const [error, setError] = useState<{ code: number; message: string } | null>(null);

    useEffect(() => {
        if (!ownerName || !repoName) return;

        let cancelled = false;
        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/repo/${encodeURIComponent(
                        ownerName,
                    )}/${encodeURIComponent(repoName)}`,
                    { credentials: 'include', signal: controller.signal },
                );
                const body = await res.json().catch(() => null);
                if (cancelled) return;
                if (res.status === 404 || (res.ok && !body?.data)) {
                    // Repository was deleted or never existed → render the 404 page.
                    notFound();
                    return;
                }
                if (!res.ok || !body?.data) {
                    setError({
                        code: res.status,
                        message:
                            body?.message ??
                            'Something went wrong while loading this repository',
                    });
                    return;
                }
                setError(null);
                setRepository(normalizeRepository(body.data));
            } catch (e) {
                if (cancelled || (e as Error).name === 'AbortError') return;
                setError({
                    code: 500,
                    message: 'Something went wrong while loading this repository',
                });
            }
        })();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [ownerName, repoName]);

    const repoId = repository?.id;

    useEffect(() => {
        if (!repoId) return;

        let cancelled = false;
        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/repo/${encodeURIComponent(
                        repoId,
                    )}/contributors`,
                    { credentials: 'include', signal: controller.signal },
                );
                const body = await res.json().catch(() => null);
                if (cancelled || !res.ok || !Array.isArray(body?.data)) return;
                setContributors(body.data.map(normalizeContributor));
            } catch (e) {
                if (cancelled || (e as Error).name === 'AbortError') return;
            }
        })();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [repoId]);

    if (error) {
        return <ErrorDisplay code={error.code} message={error.message} />;
    }

    return (
        <div className="flex flex-col h-full bg-background">
            <RepoTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="flex-1 overflow-hidden">
                {activeTab === 'files' &&
                    (repository && !repository.headCommit ? (
                        <EmptyRepoState
                            repoName={repository.name}
                            onCreateWorkspace={() => setActiveTab('workspaces')}
                        />
                    ) : (
                        <FileBrowser files={mockFiles} />
                    ))}
                {activeTab === 'contributors' && (
                    <Contributors
                        contributors={contributors}
                        repoId={repoId}
                        onContributorsChange={setContributors}
                    />
                )}
                {activeTab === 'workspaces' && <WorkspaceView repoId={repoId} />}
                {activeTab === 'settings' && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Settings view coming soon
                    </div>
                )}
            </div>
        </div>
    );
}
