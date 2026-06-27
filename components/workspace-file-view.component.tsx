'use client';

import { useState } from 'react';
import { Code, Eye, File, FileText, Folder, GitPullRequest, History, Pencil, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { WorkspaceFileMenu } from '@/components/workspace-file-menu.component';
import { WorkspaceCommitHistory } from '@/components/workspace-commit-history.component';
import { useCommitHistory } from '@/hooks/use-commit-history';
import { ROOT_PATH, type UseWorkspaceTreeResult } from '@/hooks/use-workspace-tree';
import type { UseFileContentResult } from '@/hooks/use-file-content';
import type { PRStatus } from '@/hooks/use-pr-status';
import {
    mergePendingEntries,
    type DisplayTreeEntry,
} from '@/lib/merge-pending-entries';
import type {
    PendingChange,
    SelectedWorkspaceFile,
    WorkspaceEntryStatus,
    WorkspaceSelection,
} from '@/types/workspace-tree';
import { cn } from '@/lib/utils';

type FileViewTab = 'preview' | 'code' | 'blame';

const tabs: { id: FileViewTab; label: string; icon: typeof Eye }[] = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'blame', label: 'Blame', icon: History },
];

interface WorkspaceFileViewProps {
    workspaceName?: string;
    /** Repo / workspace the commit history belongs to. */
    repoId?: string;
    workspaceId?: string;
    /** What to render: a directory listing, an opened file, or nothing. */
    selection: WorkspaceSelection | null;
    /** Shared tree state, used to read the contents of the selected directory. */
    tree: UseWorkspaceTreeResult;
    /** Unstaged uploads, overlaid onto the directory listing. */
    pendingChanges: PendingChange[];
    /** Fetch state for the selected file's contents. */
    content: UseFileContentResult;
    /** The PR sync status for the current workspace. */
    prStatus?: PRStatus | null;
    /** Navigate into a folder (path has a trailing slash; `''` for root). */
    onOpenDir: (path: string, treeHash?: string | null) => void;
    /** Open a file. */
    onOpenFile: (file: SelectedWorkspaceFile) => void;
    /**
     * Queue a file for deletion. `committed` is false for a file that only
     * exists as a not-yet-staged upload, true once it's part of the tree.
     */
    onDeleteFile: (filePath: string, name: string, committed: boolean) => void;
    /** Queue a rename within the same folder, carrying the file's blob hash. */
    onRenameFile: (
        oldPath: string,
        newPath: string,
        blobHash: string,
        size: number,
        committed: boolean,
    ) => void;
    /** Open the create-PR flow. Only invoked when there is at least one commit. */
    onCreatePR?: () => void;
}

/**
 * Whether an entry exists in the committed/staged tree (vs. living only as a
 * queued upload). A purely-pending add hasn't been staged yet.
 */
function isCommitted(status: WorkspaceEntryStatus | null | undefined, pending: boolean): boolean {
    return !(status === 'ADDED' && pending);
}

/** The parent directory (trailing slash, or `''` for root) of a full path. */
function parentOf(path: string): string {
    const idx = path.lastIndexOf('/');
    return idx === -1 ? '' : path.slice(0, idx + 1);
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
    }
    return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/**
 * The main pane of the workspace view. Mirrors GitHub: selecting a folder shows
 * its contents as a navigable listing, while selecting a file shows its
 * contents. With nothing selected it shows an empty state.
 */
export function WorkspaceFileView({
    workspaceName,
    repoId,
    workspaceId,
    selection,
    tree,
    pendingChanges,
    content,
    prStatus,
    onOpenDir,
    onOpenFile,
    onDeleteFile,
    onRenameFile,
    onCreatePR,
}: WorkspaceFileViewProps) {
    // When true the history pane takes over the main area, replacing the
    // breadcrumb bar with a title + back button.
    const [showHistory, setShowHistory] = useState(false);

    if (!selection) {
        return (
            <div className="flex h-full flex-1 flex-col items-center justify-center bg-background text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Nothing selected</h2>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Pick a folder to browse it, or a file to view its contents.
                </p>
            </div>
        );
    }

    if (showHistory) {
        return (
            <div className="flex h-full flex-1 flex-col bg-background">
                <WorkspaceCommitHistory
                    repoId={repoId}
                    workspaceId={workspaceId}
                    onBack={() => {
                        setShowHistory(false);
                        // Back always lands on the root folder listing.
                        onOpenDir(ROOT_PATH);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-1 flex-col bg-background">
            {selection.type === 'dir' ? (
                <DirView
                    workspaceName={workspaceName}
                    repoId={repoId}
                    workspaceId={workspaceId}
                    path={selection.path}
                    tree={tree}
                    pendingChanges={pendingChanges}
                    prStatus={prStatus}
                    onOpenDir={onOpenDir}
                    onOpenFile={onOpenFile}
                    onDeleteFile={onDeleteFile}
                    onRenameFile={onRenameFile}
                    onShowHistory={() => setShowHistory(true)}
                    onCreatePR={onCreatePR}
                />
            ) : (
                <FileContentView
                    workspaceName={workspaceName}
                    file={selection.file}
                    tree={tree}
                    pendingChanges={pendingChanges}
                    content={content}
                    onOpenDir={onOpenDir}
                    onDeleteFile={onDeleteFile}
                    onRenameFile={onRenameFile}
                />
            )}
        </div>
    );
}

/* ------------------------------- Breadcrumb ------------------------------- */

interface Crumb {
    name: string;
    /** Directory path to navigate to (trailing slash). */
    path: string;
    /** The final file segment, which isn't a navigation target. */
    isFile: boolean;
}

function buildCrumbs(path: string, leafIsFile: boolean): Crumb[] {
    const parts = path.split('/').filter(Boolean);
    const crumbs: Crumb[] = [];
    let acc = '';
    parts.forEach((part, i) => {
        const isLast = i === parts.length - 1;
        const isFile = leafIsFile && isLast;
        acc += isFile ? part : `${part}/`;
        crumbs.push({ name: part, path: acc, isFile });
    });
    return crumbs;
}

function Breadcrumb({
    workspaceName,
    path,
    leafIsFile,
    onOpenDir,
}: {
    workspaceName?: string;
    path: string;
    leafIsFile: boolean;
    onOpenDir: (path: string) => void;
}) {
    const crumbs = buildCrumbs(path, leafIsFile);

    return (
        <div className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
            <button
                type="button"
                onClick={() => onOpenDir(ROOT_PATH)}
                className="truncate font-semibold text-foreground transition hover:text-primary"
            >
                {workspaceName ?? 'root'}
            </button>
            {crumbs.map((crumb) => (
                <span key={crumb.path} className="flex items-center gap-1">
                    <span className="text-muted-foreground">/</span>
                    {crumb.isFile ? (
                        <span className="truncate font-semibold text-foreground">
                            {crumb.name}
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onOpenDir(crumb.path)}
                            className="truncate text-muted-foreground transition hover:text-foreground"
                        >
                            {crumb.name}
                        </button>
                    )}
                </span>
            ))}
        </div>
    );
}

/* ------------------------------ Directory view ---------------------------- */

function DirView({
    workspaceName,
    repoId,
    workspaceId,
    path,
    tree,
    pendingChanges,
    prStatus,
    onOpenDir,
    onOpenFile,
    onDeleteFile,
    onRenameFile,
    onShowHistory,
    onCreatePR,
}: {
    workspaceName?: string;
    repoId?: string;
    workspaceId?: string;
    path: string;
    tree: UseWorkspaceTreeResult;
    pendingChanges: PendingChange[];
    prStatus?: PRStatus | null;
    onOpenDir: (path: string, treeHash?: string | null) => void;
    onOpenFile: (file: SelectedWorkspaceFile) => void;
    onDeleteFile: (filePath: string, name: string, committed: boolean) => void;
    onRenameFile: (
        oldPath: string,
        newPath: string,
        blobHash: string,
        size: number,
        committed: boolean,
    ) => void;
    /** Open the commit history pane. */
    onShowHistory: () => void;
    /** Open the create-PR flow. Only invoked when there is at least one commit. */
    onCreatePR?: () => void;
}) {
    const dir = tree.getDir(path);

    // A PR can only be opened once the workspace has at least one new commit.
    const { commits } = useCommitHistory(repoId, workspaceId);
    const canCreatePR = commits.length >= 1;

    // Committed entries with unstaged uploads overlaid (folders-first, sorted).
    const sorted = mergePendingEntries(dir.entries, pendingChanges, path);
    // Every name at this level, for rename conflict detection.
    const siblingNames = sorted.map((e) => e.name);

    return (
        <>
            <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                    <Breadcrumb
                        workspaceName={workspaceName}
                        path={path}
                        leafIsFile={false}
                        onOpenDir={onOpenDir}
                    />
                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onShowHistory}
                            className="gap-1.5"
                        >
                            <History className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Commit history</span>
                        </Button>

                        {(prStatus === 'IN_SYNC' || prStatus === 'PENDING_SYNC') && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={prStatus === 'IN_SYNC'}
                                title={prStatus === 'IN_SYNC' ? 'Workspace is up to date' : 'Sync workspace with upstream'}
                                className="gap-1.5"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Sync</span>
                            </Button>
                        )}

                        {prStatus === 'CREATE_PR' && (
                            <Button
                                type="button"
                                size="sm"
                                onClick={onCreatePR}
                                disabled={!canCreatePR}
                                title={
                                    canCreatePR
                                        ? 'Open a pull request for these commits'
                                        : 'Commit at least one change to open a pull request'
                                }
                                className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                            >
                                <GitPullRequest className="h-4 w-4" />
                                <span className="hidden sm:inline">Create PR</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                <div className="overflow-hidden rounded-lg border border-border">
                    {dir.status === 'loading' && sorted.length === 0 ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                            <Spinner className="h-4 w-4" /> Loading…
                        </div>
                    ) : dir.status === 'error' ? (
                        <div className="py-12 text-center text-sm text-destructive">
                            {dir.error ?? 'Could not load this folder'}
                        </div>
                    ) : sorted.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            This folder is empty
                        </div>
                    ) : (
                        <ul className="divide-y divide-border">
                            {sorted.map((entry) => (
                                <DirRow
                                    key={entry.name}
                                    entry={entry}
                                    parentPath={path}
                                    siblingNames={siblingNames}
                                    onOpenDir={onOpenDir}
                                    onOpenFile={onOpenFile}
                                    onDeleteFile={onDeleteFile}
                                    onRenameFile={onRenameFile}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </>
    );
}

function DirRow({
    entry,
    parentPath,
    siblingNames,
    onOpenDir,
    onOpenFile,
    onDeleteFile,
    onRenameFile,
}: {
    entry: DisplayTreeEntry;
    parentPath: string;
    siblingNames: string[];
    onOpenDir: (path: string, treeHash?: string | null) => void;
    onOpenFile: (file: SelectedWorkspaceFile) => void;
    onDeleteFile: (filePath: string, name: string, committed: boolean) => void;
    onRenameFile: (
        oldPath: string,
        newPath: string,
        blobHash: string,
        size: number,
        committed: boolean,
    ) => void;
}) {
    const isFolder = entry.type === 'tree';
    const fullPath = isFolder
        ? `${parentPath}${entry.name}/`
        : `${parentPath}${entry.name}`;
    const isDeleted = entry.status === 'DELETED';

    return (
        <li className="flex items-center transition hover:bg-muted">
            <button
                type="button"
                onClick={() =>
                    isFolder
                        ? onOpenDir(fullPath, entry.objectHash ?? undefined)
                        : onOpenFile({
                            name: entry.name,
                            path: fullPath,
                            objectHash: entry.objectHash,
                            size: entry.size,
                            status: entry.status,
                        })
                }
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left text-sm"
            >
                {isFolder ? (
                    <Folder className="h-4 w-4 shrink-0 text-accent" />
                ) : (
                    <File className="h-4 w-4 shrink-0 text-secondary" />
                )}
                <span
                    className={cn(
                        'min-w-0 flex-1 truncate font-medium text-foreground',
                        isDeleted && 'text-muted-foreground line-through',
                    )}
                >
                    {entry.name}
                </span>
                {entry.pending && (
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        Pending
                    </span>
                )}
                <StatusBadge status={entry.status} />
                <span className="shrink-0 text-xs text-muted-foreground">
                    {isFolder
                        ? '—'
                        : typeof entry.size === 'number'
                            ? formatBytes(entry.size)
                            : '—'}
                </span>
            </button>
            {!isFolder && (
                <div className="shrink-0 px-2">
                    <WorkspaceFileMenu
                        fileName={entry.name}
                        existingNames={siblingNames}
                        onDelete={() =>
                            onDeleteFile(
                                fullPath,
                                entry.name,
                                isCommitted(entry.status, entry.pending),
                            )
                        }
                        onRename={(newName) =>
                            onRenameFile(
                                fullPath,
                                `${parentPath}${newName}`,
                                entry.objectHash ?? '',
                                typeof entry.size === 'number' ? entry.size : 0,
                                isCommitted(entry.status, entry.pending),
                            )
                        }
                    />
                </div>
            )}
        </li>
    );
}

/* ----------------------------- File content view -------------------------- */

function FileContentView({
    workspaceName,
    file,
    tree,
    pendingChanges,
    content,
    onOpenDir,
    onDeleteFile,
    onRenameFile,
}: {
    workspaceName?: string;
    file: SelectedWorkspaceFile;
    tree: UseWorkspaceTreeResult;
    pendingChanges: PendingChange[];
    content: UseFileContentResult;
    onOpenDir: (path: string) => void;
    onDeleteFile: (filePath: string, name: string, committed: boolean) => void;
    onRenameFile: (
        oldPath: string,
        newPath: string,
        blobHash: string,
        size: number,
        committed: boolean,
    ) => void;
}) {
    const [tab, setTab] = useState<FileViewTab>('code');

    // Names alongside this file, for rename conflict detection.
    const parentPath = parentOf(file.path);
    const siblingNames = mergePendingEntries(
        tree.getDir(parentPath).entries,
        pendingChanges,
        parentPath,
    ).map((e) => e.name);
    const committed = isCommitted(file.status, false);

    return (
        <>
            <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4 px-4 pt-2.5">
                    <Breadcrumb
                        workspaceName={workspaceName}
                        path={file.path}
                        leafIsFile
                        onOpenDir={onOpenDir}
                    />
                    <div className="flex shrink-0 items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs">
                            Raw
                        </Button>
                        <WorkspaceFileMenu
                            fileName={file.name}
                            existingNames={siblingNames}
                            onDelete={() =>
                                onDeleteFile(file.path, file.name, committed)
                            }
                            onRename={(newName) =>
                                onRenameFile(
                                    file.path,
                                    `${parentPath}${newName}`,
                                    file.objectHash ?? '',
                                    typeof file.size === 'number' ? file.size : 0,
                                    committed,
                                )
                            }
                        />
                    </div>
                </div>

                <div className="flex items-center gap-5 px-4">
                    {tabs.map(({ id, label, icon: Icon }) => {
                        const isActive = tab === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setTab(id)}
                                className={cn(
                                    'flex items-center gap-1.5 border-b-2 px-1 py-2.5 text-sm font-medium transition',
                                    isActive
                                        ? 'border-primary text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {tab === 'blame' ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Blame view is not available yet.
                    </div>
                ) : (
                    <div className="p-6">
                        <div className="rounded-lg border border-border bg-card">
                            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 text-xs text-muted-foreground">
                                <span className="truncate font-mono">{file.path}</span>
                                <span className="shrink-0">
                                    {typeof file.size === 'number'
                                        ? formatBytes(file.size)
                                        : '—'}
                                </span>
                            </div>
                            <FileBody content={content} />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

function FileBody({ content }: { content: UseFileContentResult }) {
    if (content.status === 'loading') {
        return (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Spinner className="h-4 w-4" /> Loading file…
            </div>
        );
    }

    if (content.status === 'error') {
        return (
            <div className="py-12 text-center text-sm text-destructive">
                {content.error ?? 'Could not load this file'}
            </div>
        );
    }

    return (
        <pre className="overflow-auto p-4 text-sm leading-relaxed text-foreground">
            <code className="font-mono">{content.content ?? ''}</code>
        </pre>
    );
}

/** Single-letter git-style status marker; nothing for unmodified entries. */
function StatusBadge({ status }: { status?: WorkspaceEntryStatus | null }) {
    if (!status || status === 'UNMODIFIED') return null;

    const map: Record<string, { letter: string; className: string; title: string }> = {
        ADDED: { letter: 'A', className: 'text-accent', title: 'Added' },
        MODIFIED: { letter: 'M', className: 'text-secondary', title: 'Modified' },
        SUBTREE_MODIFIED: {
            letter: 'M',
            className: 'text-secondary',
            title: 'Contains changes',
        },
        DELETED: { letter: 'D', className: 'text-destructive', title: 'Deleted' },
    };
    const badge = map[status] ?? {
        letter: '•',
        className: 'text-muted-foreground',
        title: status,
    };

    return (
        <span
            title={badge.title}
            className={cn('shrink-0 font-mono text-xs font-semibold', badge.className)}
        >
            {badge.letter}
        </span>
    );
}
