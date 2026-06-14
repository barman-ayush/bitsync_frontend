'use client';

import { useEffect, useState } from 'react';
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

interface CreateFolderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Human label of the folder the new folder lands in (e.g. `src/` or `root`). */
    parentLabel: string;
    /** Names already present in the target folder, for duplicate detection. */
    existingNames: string[];
    /** Fired with the validated folder name on confirm. */
    onCreate: (name: string) => void;
}

/**
 * Names a new folder before it's added to the tree. The folder is a local
 * placeholder only — nothing is sent to the backend until a file is uploaded
 * into it and the changes are staged.
 */
export function CreateFolderDialog({
    open,
    onOpenChange,
    parentLabel,
    existingNames,
    onCreate,
}: CreateFolderDialogProps) {
    const [name, setName] = useState('');

    useEffect(() => {
        if (open) setName('');
    }, [open]);

    const trimmed = name.trim();
    const hasSlash = /[/\\]/.test(trimmed);
    const isDuplicate = existingNames.includes(trimmed);

    const error = hasSlash
        ? 'Folder names cannot contain slashes.'
        : isDuplicate
          ? 'A file or folder with that name already exists here.'
          : null;
    const isValid = trimmed.length > 0 && !error;

    const handleCreate = () => {
        if (!isValid) return;
        onCreate(trimmed);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create folder</DialogTitle>
                    <DialogDescription>
                        Adds a folder in{' '}
                        <span className="font-mono">{parentLabel}</span>. It stays
                        local until you upload a file into it and stage your changes.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleCreate();
                    }}
                    className="space-y-2"
                >
                    <label
                        htmlFor="folder-name"
                        className="text-sm font-semibold text-foreground"
                    >
                        Folder name <span className="text-destructive">*</span>
                    </label>
                    <Input
                        id="folder-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="off"
                        autoFocus
                        placeholder="e.g. components"
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
                            Create folder
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
