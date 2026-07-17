'use client';

import { useCallback, useEffect, useState } from 'react';
import { WorkspaceSidebar } from '@/components/workspace-sidebar.component';
import { WorkspaceFileView } from '@/components/workspace-file-view.component';
import { WorkspaceChangesBar } from '@/components/workspace-changes-bar.component';
import { WorkspaceUploadFab } from '@/components/workspace-upload-fab.component';
import { CreateFolderDialog } from '@/components/create-folder-dialog.component';
import { UploadConflictDialog } from '@/components/upload-conflict-dialog.component';
import { CommitDialog } from '@/components/commit-dialog.component';
import { CreatePrDialog } from '@/components/create-pr-dialog.component';
import { ROOT_PATH, useWorkspaceTree } from '@/hooks/use-workspace-tree';
import { usePendingChanges } from '@/hooks/use-pending-changes';
import { useCommit } from '@/hooks/use-commit';
import { useWorkspaceStatus } from '@/hooks/use-workspace-status';
import { usePRStatus } from '@/hooks/use-pr-status';
import { useFileContent } from '@/hooks/use-file-content';
import { mergePendingEntries } from '@/lib/merge-pending-entries';
import { useToast } from '@/components/toast-provider';
import type { Workspace } from '@/types/workspaces';
import type {
    SelectedWorkspaceFile,
    WorkspaceSelection,
} from '@/types/workspace-tree';

interface WorkspaceViewProps {
    /** Repository the workspaces belong to; the switcher loads its list by id. */
    repoId: string | undefined;
    /** Active workspace id, mirrored in the URL so the view is shareable. */
    workspaceId?: string;
    /**
     * Open file or folder, from the URL. A folder keeps its trailing slash
     * (`src/`); a file doesn't (`src/index.ts`); `undefined` is the root listing.
     */
    path?: string;
    /** Writes the chosen workspace id back to the URL. */
    onWorkspaceChange: (workspaceId: string) => void;
    /** Writes the open file/folder path back to the URL. */
    onPathChange: (path: string | undefined) => void;
    /** Triggers navigation or action when Create PR is clicked. */
    onCreatePR?: () => void;
    /** Triggers navigation or action when View PR is clicked. */
    onViewPR?: (prId: string) => void;
}

/** The parent directory (trailing slash, or `''` for root) of a full path. */
function parentOf(path: string): string {
    const idx = path.lastIndexOf('/');
    return idx === -1 ? ROOT_PATH : path.slice(0, idx + 1);
}

/**
 * The directory levels that must be loaded before `target` can be resolved,
 * shallowest first. For the file `a/b/c.ts` → `['', 'a/', 'a/b/']`; for the
 * folder `a/b/` → `['', 'a/']`. Each level needs its parent's tree hash to load.
 */
function ancestorDirs(target: string): string[] {
    const trimmed = target.endsWith('/') ? target.slice(0, -1) : target;
    const segments = trimmed.split('/');
    const dirs = [ROOT_PATH];
    let acc = '';
    for (let i = 0; i < segments.length - 1; i++) {
        acc += `${segments[i]}/`;
        dirs.push(acc);
    }
    return dirs;
}

/**
 * The full workspace experience rendered inside the repository's "Workspaces"
 * tab: a left sidebar (workspace switcher + file tree) beside the file pane.
 * Selecting a folder browses it (GitHub-style); selecting a file shows its
 * contents. A floating button uploads files / creates folders and a banner
 * stages the queued changes. The active workspace and open path are mirrored
 * into the URL (`?workspaceId=…&path=…`) so the view can be shared / bookmarked.
 */
export function WorkspaceView({
    repoId,
    workspaceId,
    path,
    onWorkspaceChange,
    onPathChange,
    onCreatePR,
    onViewPR,
}: WorkspaceViewProps) {
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [selection, setSelection] = useState<WorkspaceSelection | null>(null);
    // Directory that uploads / new folders land in; root until the user picks one.
    const [activeFolderPath, setActiveFolderPath] = useState<string>(ROOT_PATH);
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [commitOpen, setCommitOpen] = useState(false);
    const [createPrOpen, setCreatePrOpen] = useState(false);
    const [isCreatingPr, setIsCreatingPr] = useState(false);
    const { addToast } = useToast();
    // Same-name uploads awaiting a keep-old / keep-new decision.
    const [conflicts, setConflicts] = useState<{
        files: File[];
        folder: string;
    } | null>(null);

    const tree = useWorkspaceTree(repoId, currentWorkspace?.id);
    const pending = usePendingChanges(repoId, currentWorkspace?.id);
    const commit = useCommit(repoId, currentWorkspace?.id);
    const workspaceStatus = useWorkspaceStatus(repoId, currentWorkspace?.id);
    const prStatus = usePRStatus(repoId, currentWorkspace?.id);
    const content = useFileContent(
        repoId,
        currentWorkspace?.id,
        selection?.type === 'file' ? selection.file : null,
    );

    // The queued changes belong to a single workspace, so they're meaningless
    // once it changes. (The tree + open file reset themselves off the id too.)
    useEffect(() => {
        pending.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWorkspace?.id]);

    // Open a folder/file from a user action: update local state *and* the URL.
    const openDir = (dirPath: string, treeHash?: string | null) => {
        tree.loadDir(dirPath, treeHash ?? undefined);
        setSelection({ type: 'dir', path: dirPath });
        setActiveFolderPath(dirPath);
        onPathChange(dirPath === ROOT_PATH ? undefined : dirPath);
    };

    const openFile = (file: SelectedWorkspaceFile) => {
        setSelection({ type: 'file', file });
        // Opening a file targets its containing folder for the next upload.
        setActiveFolderPath(parentOf(file.path));
        onPathChange(file.path);
    };

    // Restore the open folder/file from the URL `path` as the tree streams in.
    // The walk is progressive and idempotent: each pass loads the shallowest
    // ancestor directory that isn't ready yet (every level needs its parent's
    // tree hash) and re-runs when that load lands; once the target's parent is
    // loaded it selects the folder or file directly (no URL write — the URL is
    // already the source here). Listing `tree.getDir` as a dep is what makes the
    // effect re-fire on each directory load without an infinite loop, since
    // getDir's identity only changes when the cached tree changes.
    useEffect(() => {
        const wsId = currentWorkspace?.id;
        if (!wsId) {
            setSelection(null);
            setActiveFolderPath(ROOT_PATH);
            return;
        }

        const target = path ?? ROOT_PATH;
        const shownPath =
            selection?.type === 'file'
                ? selection.file.path
                : selection?.type === 'dir'
                    ? selection.path
                    : null;
        // Already showing the target → nothing to reconcile.
        if (shownPath === target) return;

        if (target === ROOT_PATH) {
            setSelection({ type: 'dir', path: ROOT_PATH });
            setActiveFolderPath(ROOT_PATH);
            return;
        }

        const isDir = target.endsWith('/');
        const dirs = ancestorDirs(target);
        const segments = (isDir ? target.slice(0, -1) : target).split('/');

        // Walk down; ensure each ancestor directory is loaded before the target.
        for (let i = 0; i < dirs.length; i++) {
            const dir = tree.getDir(dirs[i]);
            if (dir.status === 'success') continue;
            // Can't resolve a path whose ancestor failed to load — give up.
            if (dir.status === 'error') return;
            if (dir.status === 'idle') {
                if (i === 0) {
                    tree.loadDir(ROOT_PATH);
                } else {
                    const parent = tree.getDir(dirs[i - 1]);
                    const entry = parent.entries.find(
                        (e) => e.name === segments[i - 1] && e.type === 'tree',
                    );
                    if (!entry) return; // path no longer exists in this workspace
                    tree.loadDir(dirs[i], entry.objectHash);
                }
            }
            return; // wait for the load; the effect re-runs when it completes
        }

        // Every ancestor is loaded → resolve the target inside its parent dir.
        const parentDir = tree.getDir(dirs[dirs.length - 1]);
        const name = segments[segments.length - 1];
        if (isDir) {
            const entry = parentDir.entries.find(
                (e) => e.name === name && e.type === 'tree',
            );
            if (!entry) return;
            tree.loadDir(target, entry.objectHash);
            setSelection({ type: 'dir', path: target });
            setActiveFolderPath(target);
        } else {
            const entry = parentDir.entries.find(
                (e) => e.name === name && e.type === 'blob',
            );
            if (!entry) return;
            setSelection({
                type: 'file',
                file: {
                    name,
                    path: target,
                    objectHash: entry.objectHash,
                    size: entry.size,
                    status: entry.status,
                },
            });
            setActiveFolderPath(parentOf(target));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWorkspace?.id, path, tree.getDir, tree.loadDir]);

    // The switcher resolves the URL's `workspaceId` (or its auto-picked default)
    // to a full workspace; cache the object for its name and push the id to the
    // URL when it differs from what's already there.
    const handleSelectWorkspace = useCallback(
        (workspace: Workspace) => {
            setCurrentWorkspace(workspace);
            if (workspace.id !== workspaceId) onWorkspaceChange(workspace.id);
        },
        [workspaceId, onWorkspaceChange],
    );

    const handleUploadFiles = (files: File[]) => {
        const folder = activeFolderPath;
        // Names currently visible at this level (committed + queued); a name
        // already queued for deletion is free to reuse.
        const taken = new Set(
            mergePendingEntries(tree.getDir(folder).entries, pending.changes, folder)
                .filter((e) => e.status !== 'DELETED')
                .map((e) => e.name),
        );
        const fresh = files.filter((f) => !taken.has(f.name));
        const clashing = files.filter((f) => taken.has(f.name));

        if (fresh.length) pending.uploadFiles(fresh, folder);
        // Clashing names need the user to pick the older or newer file first.
        if (clashing.length) setConflicts({ files: clashing, folder });
    };

    const handleResolveConflicts = (keepUploaded: string[]) => {
        if (conflicts && keepUploaded.length) {
            // Keeping the new file uploads it; re-uploading its path replaces the
            // existing entry, i.e. the old one is dropped and the new one added.
            const toUpload = conflicts.files.filter((f) =>
                keepUploaded.includes(f.name),
            );
            if (toUpload.length) pending.uploadFiles(toUpload, conflicts.folder);
        }
        setConflicts(null);
    };

    const handleCreateFolder = (name: string) => {
        // Local placeholder only — it carries no backend hash and is seeded as an
        // empty, loaded directory so expanding it doesn't hit the backend.
        tree.upsertEntry(activeFolderPath, {
            name,
            type: 'tree',
            objectHash: null,
            size: null,
            status: 'ADDED',
        });
        const newPath = `${activeFolderPath}${name}/`;
        tree.markDirLoaded(newPath);
        openDir(newPath);
    };

    const handleDeleteFile = (filePath: string, name: string, committed: boolean) => {
        pending.deleteFile(filePath, name, committed);
        // If the file being deleted is the one on screen, fall back to its folder.
        if (selection?.type === 'file' && selection.file.path === filePath) {
            openDir(parentOf(filePath));
        }
    };

    const handleRenameFile = (
        oldPath: string,
        newPath: string,
        blobHash: string,
        size: number,
        committed: boolean,
    ) => {
        pending.renameFile(oldPath, newPath, blobHash, size, committed);
        // If the renamed file is on screen, follow it to its new path.
        if (selection?.type === 'file' && selection.file.path === oldPath) {
            openFile({
                name: newPath.slice(newPath.lastIndexOf('/') + 1),
                path: newPath,
                objectHash: blobHash,
                size,
                status: 'ADDED',
            });
        }
    };

    const handleStage = async () => {
        const staged = await pending.stage();
        if (!staged) return;
        // Staging turns the queue into uncommitted changes — re-check so the
        // commit button enables.
        workspaceStatus.refresh();
        // Reflect the staged changes in the tree on the FE without a round trip:
        // remove deletions, and drop adds/modifies into their directory.
        for (const change of staged) {
            const parent = parentOf(change.filePath);
            if (change.blobHash === null) {
                tree.removeEntry(parent, change.name);
                continue;
            }
            const existing = tree
                .getDir(parent)
                .entries.find((e) => e.name === change.name && e.type === 'blob');
            tree.upsertEntry(parent, {
                name: change.name,
                type: 'blob',
                objectHash: change.blobHash,
                size: change.size,
                status: existing ? 'MODIFIED' : 'ADDED',
            });
        }
    };

    const handleCommit = async (message: string) => {
        const result = await commit.commit(message);
        if (result) {
            workspaceStatus.refresh();
            prStatus.refresh();
        }
        return result;
    };

    const targetLabel = activeFolderPath === ROOT_PATH ? 'root' : activeFolderPath;
    const folderNames = tree.getDir(activeFolderPath).entries.map((e) => e.name);
    const selectedPath = selection?.type === 'file' ? selection.file.path : undefined;

    // The commit button is clickable only when there is something to commit and
    // nothing left unstaged: disabled with no active workspace, while changes are
    // still queued (unstaged), or when the workspace has no uncommitted changes.
    const hasUnstagedChanges = pending.changes.length > 0;
    const commitDisabled =
        !currentWorkspace?.id ||
        hasUnstagedChanges ||
        workspaceStatus.status !== 'DIRTY';
        
    const commitDisabledReason = !currentWorkspace?.id
        ? 'You need to be logged in to commit.'
        : hasUnstagedChanges
            ? 'Stage your changes before committing.'
            : workspaceStatus.status !== 'DIRTY'
                ? 'No uncommitted changes to commit.'
                : undefined;

    return (
        <div className="relative flex h-full bg-background">
            <WorkspaceSidebar
                repoId={repoId}
                workspaceId={currentWorkspace?.id}
                currentWorkspaceId={workspaceId}
                tree={tree}
                pendingChanges={pending.changes}
                selectedPath={selectedPath}
                activeFolderPath={activeFolderPath}
                onSelectFile={openFile}
                onSelectFolder={openDir}
                onSelectWorkspace={handleSelectWorkspace}
                onCommit={() => setCommitOpen(true)}
                commitDisabled={commitDisabled}
                commitDisabledReason={commitDisabledReason}
            />

            <div className="flex h-full min-w-0 flex-1 flex-col">
                <WorkspaceChangesBar
                    changes={pending.changes}
                    isStaging={pending.isStaging}
                    onStage={handleStage}
                    onRemove={pending.removeChange}
                    onClear={pending.clear}
                />
                <WorkspaceFileView
                    workspaceName={currentWorkspace?.name}
                    repoId={repoId}
                    workspaceId={currentWorkspace?.id}
                    selection={selection}
                    tree={tree}
                    pendingChanges={pending.changes}
                    content={content}
                    prStatus={prStatus.status}
                    onOpenDir={openDir}
                    onOpenFile={openFile}
                    onDeleteFile={handleDeleteFile}
                    onRenameFile={handleRenameFile}
                    onCreatePR={() => (onCreatePR ? onCreatePR() : setCreatePrOpen(true))}
                    onViewPR={() => {
                        if (prStatus.prData?.id && onViewPR) {
                            onViewPR(prStatus.prData.id);
                        }
                    }}
                />
            </div>

            <WorkspaceUploadFab
                disabled={!currentWorkspace?.id}
                isUploading={pending.isUploading}
                targetLabel={targetLabel}
                onUploadFiles={handleUploadFiles}
                onCreateFolder={() => setCreateFolderOpen(true)}
            />

            <CreateFolderDialog
                open={createFolderOpen}
                onOpenChange={setCreateFolderOpen}
                parentLabel={targetLabel}
                existingNames={folderNames}
                onCreate={handleCreateFolder}
            />

            <UploadConflictDialog
                open={conflicts !== null}
                onOpenChange={(open) => {
                    if (!open) setConflicts(null);
                }}
                folderLabel={
                    conflicts
                        ? conflicts.folder === ROOT_PATH
                            ? 'root'
                            : conflicts.folder
                        : ''
                }
                fileNames={conflicts ? conflicts.files.map((f) => f.name) : []}
                onResolve={handleResolveConflicts}
            />

            <CommitDialog
                open={commitOpen}
                onOpenChange={setCommitOpen}
                workspaceLabel={currentWorkspace?.name}
                isCommitting={commit.isCommitting}
                onCommit={handleCommit}
            />

            <CreatePrDialog
                open={createPrOpen}
                onOpenChange={setCreatePrOpen}
                repoId={repoId}
                workspaceId={currentWorkspace?.id}
                workspaceLabel={currentWorkspace?.name}
                isCreating={isCreatingPr}
                onCreate={async (title, description) => {
                    if (!repoId || !currentWorkspace?.id) return false;
                    setIsCreatingPr(true);
                    try {
                        const res = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}/api/pr/create/${encodeURIComponent(repoId)}/${encodeURIComponent(currentWorkspace.id)}`,
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                credentials: 'include',
                                body: JSON.stringify({ title, description }),
                            }
                        );

                        const body = await res.json().catch(() => null);

                        if (!res.ok) {
                            addToast(body?.message ?? `Failed to create PR: ${res.status}`, 'error');
                            return false;
                        }

                        addToast('Pull request created successfully!', 'success');
                        return true;
                    } catch (err) {
                        addToast(err instanceof Error ? err.message : 'Network error', 'error');
                        return false;
                    } finally {
                        setIsCreatingPr(false);
                    }
                }}
            />
        </div>
    );
}
