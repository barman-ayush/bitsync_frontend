'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { WorkspaceSwitcher } from '@/components/workspace-switcher.component';
import { WorkspaceFileTree } from '@/components/workspace-file-tree.component';
import { Input } from '@/components/ui/input';
import type { UseWorkspaceTreeResult } from '@/hooks/use-workspace-tree';
import type { Workspace } from '@/types/workspaces';
import type {
    PendingChange,
    SelectedWorkspaceFile,
} from '@/types/workspace-tree';

interface WorkspaceSidebarProps {
    repoId: string | undefined;
    workspaceId?: string;
    currentWorkspaceId?: string;
    /** Shared tree state, owned by the workspace view. */
    tree: UseWorkspaceTreeResult;
    /** Unstaged uploads, overlaid onto the tree. */
    pendingChanges: PendingChange[];
    selectedPath?: string;
    activeFolderPath?: string;
    onSelectFile: (file: SelectedWorkspaceFile) => void;
    onSelectFolder: (path: string, treeHash?: string | null) => void;
    onSelectWorkspace: (workspace: Workspace) => void;
}

/**
 * The left-hand column of the workspace view: the workspace switcher pinned to
 * the top, with the workspace's lazily-loaded file tree filling the remaining
 * height below.
 */
export function WorkspaceSidebar({
    repoId,
    workspaceId,
    currentWorkspaceId,
    tree,
    pendingChanges,
    selectedPath,
    activeFolderPath,
    onSelectFile,
    onSelectFolder,
    onSelectWorkspace,
}: WorkspaceSidebarProps) {
    const [query, setQuery] = useState('');

    return (
        <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-sidebar">
            <WorkspaceSwitcher
                repoId={repoId}
                currentWorkspaceId={currentWorkspaceId}
                onSelect={onSelectWorkspace}
            />

            {/* File search */}
            <div className="p-3">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search files…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="h-9 bg-card pl-8 text-sm"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between px-4 pb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Files
                </span>
            </div>

            {/* File tree */}
            <div className="flex-1 overflow-y-auto px-2 pb-3">
                <WorkspaceFileTree
                    workspaceId={workspaceId}
                    tree={tree}
                    pendingChanges={pendingChanges}
                    query={query}
                    selectedPath={selectedPath}
                    activeFolderPath={activeFolderPath}
                    onSelectFile={onSelectFile}
                    onSelectFolder={onSelectFolder}
                />
            </div>
        </aside>
    );
}
