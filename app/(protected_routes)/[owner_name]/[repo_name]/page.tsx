'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { RepoTabs } from '@/components/repo-tabs.component';
import { ErrorDisplay } from '@/components/error-display.component';
import { FileBrowser, PathSegment } from '@/components/file-browser.component';
import { EmptyRepoState } from '@/components/empty-repo-state.component';
import { Contributors } from '@/components/contributors.component';
import { WorkspaceView } from '@/components/workspace-view.component';
import { PullRequestsView } from '@/components/pull-requests-view.component';
import { useRepoUrlState } from '@/hooks/use-repo-url-state';
import { FileItem } from '@/types/files';
import { Contributor } from '@/types/contributors';
import { Repository } from '@/types/repos';
import { normalizeRepository } from '@/lib/normalize-repository';
import { normalizeContributor } from '@/lib/normalize-contributor';

export default function RepositoryPage() {
    // `useSearchParams` (read inside RepositoryView) requires a Suspense
    // boundary in the App Router, so the page shell provides one.
    return (
        <Suspense fallback={null}>
            <RepositoryView />
        </Suspense>
    );
}

function RepositoryView() {
    const params = useParams<{ owner_name: string; repo_name: string }>();
    const ownerName = params?.owner_name;
    const repoName = params?.repo_name;

    // Tab / workspace / path / prId live in the URL so the view is shareable.
    const { tab: activeTab, workspaceId, path, prId, setTab, setWorkspaceId, setPath, setPrId } =
        useRepoUrlState();

    const [repository, setRepository] = useState<Repository | null>(null);
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [error, setError] = useState<{ code: number; message: string } | null>(null);

    // States for real-time files tab fetching and navigation
    const [files, setFiles] = useState<FileItem[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [filesError, setFilesError] = useState<string | null>(null);
    const [currentTreeHash, setCurrentTreeHash] = useState<string | undefined>(undefined);
    const [pathStack, setPathStack] = useState<PathSegment[]>([]);

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

    // Reset tree hash navigation when changing repository
    useEffect(() => {
        setCurrentTreeHash(undefined);
        setPathStack([]);
    }, [repoId]);

    // Fetch repository files real-time
    useEffect(() => {
        if (!repoId || activeTab !== 'files') return;

        let cancelled = false;
        const controller = new AbortController();

        (async () => {
            try {
                setFilesLoading(true);
                setFilesError(null);

                const url = new URL(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/repo/get-data/${encodeURIComponent(repoId)}`
                );
                if (currentTreeHash) {
                    url.searchParams.set('treeHash', currentTreeHash);
                }

                const res = await fetch(url.toString(), {
                    credentials: 'include',
                    signal: controller.signal,
                });
                const body = await res.json().catch(() => null);

                if (cancelled) return;

                if (!res.ok || body?.status !== 'success' || !body?.data?.tree) {
                    setFilesError(
                        body?.message ?? 'Something went wrong while loading repository files.'
                    );
                    setFiles([]);
                    return;
                }

                const fetchedFiles: FileItem[] = body.data.tree.map((item: any) => ({
                    id: item.objectHash,
                    name: item.name,
                    type: item.type === 'tree' ? 'folder' : 'file',
                    size: item.size,
                    createdAt: repository?.createdAt ?? new Date().toISOString(),
                    modifiedAt: repository?.updatedAt ?? new Date().toISOString(),
                    owner: repository?.owner.username ?? '',
                }));

                setFiles(fetchedFiles);
            } catch (e) {
                if (cancelled || (e as Error).name === 'AbortError') return;
                setFilesError('Something went wrong while loading repository files.');
                setFiles([]);
            } finally {
                if (!cancelled) {
                    setFilesLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [repoId, activeTab, currentTreeHash, repository]);

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
            <RepoTabs activeTab={activeTab} onTabChange={setTab} />

            <div className="flex-1 overflow-hidden">
                {activeTab === 'files' &&
                    (repository && !repository.headCommit ? (
                        <EmptyRepoState
                            repoName={repository.name}
                            onCreateWorkspace={() => setTab('workspaces')}
                        />
                    ) : (
                        <FileBrowser
                            files={files}
                            isLoading={filesLoading}
                            error={filesError}
                            repoName={repository?.name ?? ''}
                            pathStack={pathStack}
                            onFolderClick={(file) => {
                                setPathStack((prev) => [...prev, { name: file.name, treeHash: file.id }]);
                                setCurrentTreeHash(file.id);
                            }}
                            onBreadcrumbClick={(index) => {
                                if (index === -1) {
                                    setPathStack([]);
                                    setCurrentTreeHash(undefined);
                                } else {
                                    const newStack = pathStack.slice(0, index + 1);
                                    setPathStack(newStack);
                                    setCurrentTreeHash(newStack[newStack.length - 1].treeHash);
                                }
                            }}
                        />
                    ))}
                {activeTab === 'contributors' && (
                    <Contributors
                        contributors={contributors}
                        repoId={repoId}
                        onContributorsChange={setContributors}
                    />
                )}
                {activeTab === 'workspaces' && (
                    <WorkspaceView
                        repoId={repoId}
                        workspaceId={workspaceId}
                        path={path}
                        onWorkspaceChange={setWorkspaceId}
                        onPathChange={setPath}
                        onCreatePR={() => setPrId('draft')}
                        onViewPR={(prId) => setPrId(prId)}
                    />
                )}
                {activeTab === 'pull-requests' && (
                    <PullRequestsView repoId={repoId} workspaceId={workspaceId} prId={prId} onPrIdChange={setPrId} />
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
