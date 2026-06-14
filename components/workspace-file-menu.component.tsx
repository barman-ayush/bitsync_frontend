'use client';

import { useEffect, useState } from 'react';
import { FileUp, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface WorkspaceFileMenuProps {
    /** File name shown in the menu's dialogs. */
    fileName: string;
    /** Names already present at this level (incl. `fileName`), for conflict checks. */
    existingNames: string[];
    /** Queue this file for deletion. */
    onDelete: () => void;
    /** Queue this file's rename to `newName` (same folder). */
    onRename: (newName: string) => void;
    /** Extra classes for the trigger button (e.g. sizing for compact rows). */
    className?: string;
}

/**
 * The per-file "⋮" actions menu. Opens a dropdown with file actions: "Rename"
 * and "Delete" confirm through a dialog before queueing the change. "Upload new
 * version" is stubbed for now (disabled).
 */
export function WorkspaceFileMenu({
    fileName,
    existingNames,
    onDelete,
    onRename,
    className,
}: WorkspaceFileMenuProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [renameOpen, setRenameOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        aria-label={`Actions for ${fileName}`}
                        // Don't let the click bubble to the row's open handler.
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            'shrink-0 rounded p-1 text-muted-foreground transition hover:bg-border hover:text-foreground',
                            className,
                        )}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="w-48"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DropdownMenuItem
                        className="gap-2"
                        onSelect={() => setRenameOpen(true)}
                    >
                        <Pencil className="h-4 w-4" />
                        Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="gap-2">
                        <FileUp className="h-4 w-4" />
                        Upload new version
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        variant="destructive"
                        className="gap-2"
                        onSelect={() => setConfirmOpen(true)}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <RenameFileDialog
                open={renameOpen}
                onOpenChange={setRenameOpen}
                fileName={fileName}
                existingNames={existingNames}
                onRename={onRename}
            />

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete file?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="font-mono text-foreground">{fileName}</span>{' '}
                            will be queued for deletion. Stage your changes to apply it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onDelete}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function RenameFileDialog({
    open,
    onOpenChange,
    fileName,
    existingNames,
    onRename,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fileName: string;
    existingNames: string[];
    onRename: (newName: string) => void;
}) {
    const [name, setName] = useState(fileName);

    // Seed with the current name each time the dialog opens.
    useEffect(() => {
        if (open) setName(fileName);
    }, [open, fileName]);

    const trimmed = name.trim();
    const hasSlash = /[/\\]/.test(trimmed);
    const unchanged = trimmed === fileName;
    // Any sibling other than this file claiming the name is a conflict.
    const isDuplicate = existingNames.some(
        (n) => n !== fileName && n === trimmed,
    );

    const error = hasSlash
        ? 'File names cannot contain slashes.'
        : isDuplicate
          ? 'A file or folder with that name already exists here.'
          : null;
    const isValid = trimmed.length > 0 && !unchanged && !error;

    const handleRename = () => {
        if (!isValid) return;
        onRename(trimmed);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Rename file</DialogTitle>
                    <DialogDescription>
                        Renaming{' '}
                        <span className="font-mono text-foreground">{fileName}</span>{' '}
                        queues a deletion of the old path and an addition at the new
                        one. Stage your changes to apply it.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleRename();
                    }}
                    className="space-y-2"
                >
                    <label
                        htmlFor="rename-file"
                        className="text-sm font-semibold text-foreground"
                    >
                        New name <span className="text-destructive">*</span>
                    </label>
                    <Input
                        id="rename-file"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="off"
                        autoFocus
                        placeholder="e.g. parser.py"
                    />
                    {trimmed.length > 0 && error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isValid}>
                            Rename
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
