'use client';

import { useState } from 'react';
import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import {
    ROOT_PATH,
    type UseWorkspaceTreeResult,
} from '@/hooks/use-workspace-tree';
import { mergePendingEntries } from '@/lib/merge-pending-entries';
import type {
    PendingChange,
    SelectedWorkspaceFile,
    WorkspaceEntryStatus,
    WorkspaceTreeEntry,
} from '@/types/workspace-tree';
import { cn } from '@/lib/utils';

interface WorkspaceFileTreeProps {
    workspaceId: string | undefined;
    /** Shared tree state, lifted to the workspace view so uploads can update it. */
    tree: UseWorkspaceTreeResult;
    /** Unstaged uploads, overlaid onto each directory level. */
    pendingChanges: PendingChange[];
    /** Case-insensitive name filter applied per level. */
    query: string;
    selectedPath?: string;
    /** Folder currently targeted by uploads, highlighted in the tree. */
    activeFolderPath?: string;
    onSelectFile: (file: SelectedWorkspaceFile) => void;
    /**
     * Bubble up a folder's full path (trailing slash) and its tree hash when
     * clicked, so the parent can load and show its contents.
     */
    onSelectFolder: (path: string, treeHash?: string | null) => void;
}

/**
 * The workspace's file tree, loaded lazily from the backend one directory at a
 * time. Folders fetch their children the first time they're expanded; blobs are
 * selectable and bubble up the full path so the editor pane can render them.
 */
export function WorkspaceFileTree({
    workspaceId,
    tree,
    pendingChanges,
    query,
    selectedPath,
    activeFolderPath,
    onSelectFile,
    onSelectFolder,
}: WorkspaceFileTreeProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggle = (entry: WorkspaceTreeEntry, fullPath: string) => {
        // Clicking a folder shows it in the pane and makes it the upload target;
        // the parent loads its contents (objectHash is the tree_hash, omitted for
        // newly-added folders).
        onSelectFolder(fullPath, entry.objectHash ?? undefined);
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(fullPath)) {
                next.delete(fullPath);
            } else {
                next.add(fullPath);
            }
            return next;
        });
    };

    if (!workspaceId) {
        return (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                Select a workspace to browse its files
            </p>
        );
    }

    return (
        <DirLevel
            path={ROOT_PATH}
            depth={0}
            tree={tree}
            pendingChanges={pendingChanges}
            expanded={expanded}
            onToggle={toggle}
            onSelectFile={onSelectFile}
            selectedPath={selectedPath}
            activeFolderPath={activeFolderPath}
            query={query}
        />
    );
}

interface DirLevelProps {
    path: string;
    depth: number;
    tree: UseWorkspaceTreeResult;
    pendingChanges: PendingChange[];
    expanded: Set<string>;
    onToggle: (entry: WorkspaceTreeEntry, fullPath: string) => void;
    onSelectFile: (file: SelectedWorkspaceFile) => void;
    selectedPath?: string;
    activeFolderPath?: string;
    query: string;
}

function DirLevel({
    path,
    depth,
    tree,
    pendingChanges,
    expanded,
    onToggle,
    onSelectFile,
    selectedPath,
    activeFolderPath,
    query,
}: DirLevelProps) {
    const dir = tree.getDir(path);

    // Committed entries with unstaged uploads overlaid (folders-first, sorted).
    const merged = mergePendingEntries(dir.entries, pendingChanges, path);

    if (dir.status === 'loading' && merged.length === 0) {
        return <RowMessage depth={depth}>
            <Spinner className="h-3.5 w-3.5" /> Loading…
        </RowMessage>;
    }

    if (dir.status === 'error') {
        return (
            <RowMessage depth={depth} tone="error">
                {dir.error ?? 'Could not load files'}
            </RowMessage>
        );
    }

    const q = query.trim().toLowerCase();
    const sorted = q
        ? merged.filter((e) => e.name.toLowerCase().includes(q))
        : merged;

    if (sorted.length === 0) {
        return (
            <RowMessage depth={depth}>
                {q
                    ? 'No files match your search'
                    : depth === 0
                      ? 'This workspace is empty'
                      : 'Empty folder'}
            </RowMessage>
        );
    }

    return (
        <ul className="space-y-0.5">
            {sorted.map((entry) => (
                <TreeNode
                    key={`${path}${entry.name}`}
                    entry={entry}
                    parentPath={path}
                    depth={depth}
                    tree={tree}
                    pendingChanges={pendingChanges}
                    expanded={expanded}
                    onToggle={onToggle}
                    onSelectFile={onSelectFile}
                    selectedPath={selectedPath}
                    activeFolderPath={activeFolderPath}
                    query={query}
                />
            ))}
        </ul>
    );
}

interface TreeNodeProps extends Omit<DirLevelProps, 'path'> {
    entry: WorkspaceTreeEntry;
    parentPath: string;
}

function TreeNode({
    entry,
    parentPath,
    depth,
    tree,
    pendingChanges,
    expanded,
    onToggle,
    onSelectFile,
    selectedPath,
    activeFolderPath,
    query,
}: TreeNodeProps) {
    const isFolder = entry.type === 'tree';
    const fullPath = isFolder
        ? `${parentPath}${entry.name}/`
        : `${parentPath}${entry.name}`;
    const isExpanded = isFolder && expanded.has(fullPath);
    const isSelected =
        (!isFolder && selectedPath === fullPath) ||
        (isFolder && activeFolderPath === fullPath);

    const indent = depth * 12 + 8;

    return (
        <li>
            <button
                type="button"
                onClick={() =>
                    isFolder
                        ? onToggle(entry, fullPath)
                        : onSelectFile({
                              name: entry.name,
                              path: fullPath,
                              objectHash: entry.objectHash,
                              size: entry.size,
                              status: entry.status,
                          })
                }
                style={{ paddingLeft: indent }}
                className={cn(
                    'flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-sm transition hover:bg-muted',
                    isSelected
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground',
                )}
            >
                {isFolder ? (
                    <>
                        <ChevronRight
                            className={cn(
                                'h-3.5 w-3.5 shrink-0 transition-transform',
                                isExpanded && 'rotate-90',
                            )}
                        />
                        {isExpanded ? (
                            <FolderOpen className="h-4 w-4 shrink-0 text-accent" />
                        ) : (
                            <Folder className="h-4 w-4 shrink-0 text-accent" />
                        )}
                    </>
                ) : (
                    <>
                        <span className="w-3.5 shrink-0" />
                        <File className="h-4 w-4 shrink-0 text-secondary" />
                    </>
                )}
                <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                <StatusBadge status={entry.status} />
            </button>

            {isExpanded && (
                <div className="mt-0.5">
                    <DirLevel
                        path={fullPath}
                        depth={depth + 1}
                        tree={tree}
                        pendingChanges={pendingChanges}
                        expanded={expanded}
                        onToggle={onToggle}
                        onSelectFile={onSelectFile}
                        selectedPath={selectedPath}
                        activeFolderPath={activeFolderPath}
                        query={query}
                    />
                </div>
            )}
        </li>
    );
}

function RowMessage({
    depth,
    tone,
    children,
}: {
    depth: number;
    tone?: 'error';
    children: React.ReactNode;
}) {
    return (
        <p
            style={{ paddingLeft: depth * 12 + 8 }}
            className={cn(
                'flex items-center gap-1.5 py-1.5 pr-2 text-xs',
                tone === 'error' ? 'text-destructive' : 'text-muted-foreground',
            )}
        >
            {children}
        </p>
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
