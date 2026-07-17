'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { RepoTabId } from '@/components/repo-tabs.component';

const REPO_TABS: RepoTabId[] = ['files', 'pull-requests', 'review-requests', 'contributors', 'workspaces'];
const DEFAULT_TAB: RepoTabId = 'files';

/**
 * The slice of repository-page state that lives in the URL query string so it
 * can be bookmarked and shared:
 *
 *   ?tab=workspaces&workspaceId=<id>&path=<file-or-folder>
 *
 * A folder path keeps its trailing slash (`src/`) and a file path doesn't
 * (`src/index.ts`); the root listing is represented by the absence of `path`.
 */
export interface RepoUrlState {
    tab: RepoTabId;
    workspaceId?: string;
    path?: string;
    prId?: string;
    setTab: (tab: RepoTabId) => void;
    /**
     * Select a workspace. Clears `path` because the open file/folder belonged
     * to the previously-selected workspace.
     */
    setWorkspaceId: (workspaceId: string | undefined) => void;
    setPath: (path: string | undefined) => void;
    setPrId: (prId: string | undefined) => void;
}

function isRepoTab(value: string | null): value is RepoTabId {
    return value !== null && (REPO_TABS as string[]).includes(value);
}

/**
 * Reads the repository page's tab / workspace / path from the URL and returns
 * setters that write them back. Every setter pushes a new history entry so the
 * browser Back button walks through the tabs and files the user visited.
 */
export function useRepoUrlState(): RepoUrlState {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const prId = searchParams.get('prId') ?? undefined;
    const tabParam = searchParams.get('tab');
    const defaultTab = prId ? 'pull-requests' : DEFAULT_TAB;
    const tab = isRepoTab(tabParam) ? tabParam : defaultTab;
    const workspaceId = searchParams.get('workspaceId') ?? undefined;
    const path = searchParams.get('path') ?? undefined;

    // Merge a set of changes into the current query string and navigate. An
    // `undefined` / empty value drops its key so the URL stays clean (e.g. the
    // root listing carries no `path` at all).
    const update = useCallback(
        (changes: Record<string, string | undefined>) => {
            const next = new URLSearchParams(searchParams.toString());
            for (const [key, value] of Object.entries(changes)) {
                if (value === undefined || value === '') next.delete(key);
                else next.set(key, value);
            }
            const qs = next.toString();
            router.push(qs ? `${pathname}?${qs}` : pathname);
        },
        [router, pathname, searchParams],
    );

    const setTab = useCallback(
        (next: RepoTabId) => update({ tab: next, prId: next === 'pull-requests' ? searchParams.get('prId') ?? undefined : undefined }),
        [update, searchParams]
    );

    const setWorkspaceId = useCallback(
        (next: string | undefined) => update({ workspaceId: next, path: undefined }),
        [update],
    );

    const setPath = useCallback(
        (next: string | undefined) => update({ path: next }),
        [update],
    );

    const setPrId = useCallback(
        (next: string | undefined) => {
            const currentTab = searchParams.get('tab');
            const targetTab = currentTab === 'review-requests' ? 'review-requests' : 'pull-requests';
            update({ tab: targetTab, prId: next });
        },
        [update, searchParams],
    );

    return { tab, workspaceId, path, prId, setTab, setWorkspaceId, setPath, setPrId };
}
