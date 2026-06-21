'use client';

import { useEffect, useState } from 'react';
import { WorkspaceSidebar } from '@/components/workspace-sidebar.component';
import { WorkspaceFileView } from '@/components/workspace-file-view.component';
import { WorkspaceChangesBar } from '@/components/workspace-changes-bar.component';
import { WorkspaceUploadFab } from '@/components/workspace-upload-fab.component';
import { CreateFolderDialog } from '@/components/create-folder-dialog.component';
import { UploadConflictDialog } from '@/components/upload-conflict-dialog.component';
import { CommitDialog } from '@/components/commit-dialog.component';
import { ROOT_PATH, useWorkspaceTree } from '@/hooks/use-workspace-tree';
import { usePendingChanges } from '@/hooks/use-pending-changes';
import { useCommit } from '@/hooks/use-commit';
import { useUncommittedStatus } from '@/hooks/use-uncommitted-status';
import { useFileContent } from '@/hooks/use-file-content';
import { mergePendingEntries } from '@/lib/merge-pending-entries';
import type { Workspace } from '@/types/workspaces';
import type {
    SelectedWorkspaceFile,
    WorkspaceSelection,
} from '@/types/workspace-tree';

interface WorkspaceViewProps {
    /** Repository the workspaces belong to; the switcher loads its list by id. */
    repoId: string | undefined;
}

/** The parent directory (trailing slash, or `''` for root) of a full path. */
function parentOf(path: string): string {
    const idx = path.lastIndexOf('/');
    return idx === -1 ? ROOT_PATH : path.slice(0, idx + 1);
}

/**
 * The full workspace experience rendered inside the repository's "Workspaces"
 * tab: a left sidebar (workspace switcher + file tree) beside the file pane.
 * Selecting a folder browses it (GitHub-style); selecting a file shows its
 * contents. A floating button uploads files / creates folders and a banner
 * stages the queued changes. Everything is tracked locally — no route change.
 */
export function WorkspaceView({ repoId }: WorkspaceViewProps) {
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [selection, setSelection] = useState<WorkspaceSelection | null>(null);
    // Directory that uploads / new folders land in; root until the user picks one.
    const [activeFolderPath, setActiveFolderPath] = useState<string>(ROOT_PATH);
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [commitOpen, setCommitOpen] = useState(false);
    // Same-name uploads awaiting a keep-old / keep-new decision.
    const [conflicts, setConflicts] = useState<{
        files: File[];
        folder: string;
    } | null>(null);

    const tree = useWorkspaceTree(repoId, currentWorkspace?.id);
    const pending = usePendingChanges(repoId, currentWorkspace?.id);
    const commit = useCommit(repoId, currentWorkspace?.id);
    const uncommitted = useUncommittedStatus(repoId, currentWorkspace?.id);
    const content = useFileContent(
        repoId,
        currentWorkspace?.id,
        selection?.type === 'file' ? selection.file : null,
    );

    // The file tree and any queued changes belong to a single workspace, so a
    // previous selection / target / queue is meaningless once it changes.
    useEffect(() => {
        // Land on the root listing (or nothing, with no workspace) on switch.
        setSelection(currentWorkspace?.id ? { type: 'dir', path: ROOT_PATH } : null);
        setActiveFolderPath(ROOT_PATH);
        pending.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentWorkspace?.id]);

    const openDir = (path: string, treeHash?: string | null) => {
        tree.loadDir(path, treeHash ?? undefined);
        setSelection({ type: 'dir', path });
        setActiveFolderPath(path);
    };

    const openFile = (file: SelectedWorkspaceFile) => {
        setSelection({ type: 'file', file });
        // Opening a file targets its containing folder for the next upload.
        setActiveFolderPath(parentOf(file.path));
    };

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
        uncommitted.refresh();
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
        // A successful commit clears the workspace's uncommitted changes — re-check
        // so the commit button disables again.
        if (result) uncommitted.refresh();
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
        !uncommitted.hasUncommittedChanges;
    const commitDisabledReason = !currentWorkspace?.id
        ? undefined
        : hasUnstagedChanges
          ? 'Stage your changes before committing.'
          : !uncommitted.hasUncommittedChanges
            ? 'No uncommitted changes to commit.'
            : undefined;

    return (
        <div className="relative flex h-full bg-background">
            <WorkspaceSidebar
                repoId={repoId}
                workspaceId={currentWorkspace?.id}
                currentWorkspaceId={currentWorkspace?.id}
                tree={tree}
                pendingChanges={pending.changes}
                selectedPath={selectedPath}
                activeFolderPath={activeFolderPath}
                onSelectFile={openFile}
                onSelectFolder={openDir}
                onSelectWorkspace={setCurrentWorkspace}
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
                    onOpenDir={openDir}
                    onOpenFile={openFile}
                    onDeleteFile={handleDeleteFile}
                    onRenameFile={handleRenameFile}
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
        </div>
    );
}
