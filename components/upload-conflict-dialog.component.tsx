'use client';

import { useEffect, useState } from 'react';
import { File } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Which file to keep for a name that already exists at the target level. */
type Choice = 'existing' | 'uploaded';

interface UploadConflictDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Human label of the folder being uploaded into (e.g. `src/` or `root`). */
    folderLabel: string;
    /** Names already present at this level that the upload would overwrite. */
    fileNames: string[];
    /**
     * Resolve the conflicts: `keepUploaded` is the subset of names the user chose
     * to replace with the newly-uploaded file. The rest keep the existing file.
     */
    onResolve: (keepUploaded: string[]) => void;
}

/**
 * Asks the user how to resolve upload name clashes: keep the existing ("older")
 * file or replace it with the one being uploaded ("newer"). Choosing the new
 * one deletes the old and adds the new in its place once staged.
 */
export function UploadConflictDialog({
    open,
    onOpenChange,
    folderLabel,
    fileNames,
    onResolve,
}: UploadConflictDialogProps) {
    const [choices, setChoices] = useState<Record<string, Choice>>({});

    // Default every clash to keeping the uploaded file (the user's just-picked
    // one). Keyed on the names themselves so re-renders don't reset live choices.
    const namesKey = fileNames.join('\n');
    useEffect(() => {
        if (open) {
            setChoices(Object.fromEntries(fileNames.map((n) => [n, 'uploaded'])));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, namesKey]);

    const handleConfirm = () => {
        onResolve(fileNames.filter((n) => choices[n] === 'uploaded'));
        onOpenChange(false);
    };

    const count = fileNames.length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {count === 1 ? 'A file already exists' : 'Some files already exist'}
                    </DialogTitle>
                    <DialogDescription>
                        {count === 1 ? 'This name is' : 'These names are'} already in{' '}
                        <span className="font-mono">{folderLabel}</span>. Choose which
                        file to keep — replacing deletes the old one and adds the new.
                    </DialogDescription>
                </DialogHeader>

                <ul className="space-y-3">
                    {fileNames.map((name) => (
                        <li key={name} className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <File className="h-4 w-4 shrink-0 text-secondary" />
                                <span className="min-w-0 truncate font-mono">{name}</span>
                            </div>
                            <div className="flex gap-2">
                                <ChoiceButton
                                    active={choices[name] === 'existing'}
                                    onClick={() =>
                                        setChoices((p) => ({ ...p, [name]: 'existing' }))
                                    }
                                    title="Keep existing"
                                    subtitle="Older file"
                                />
                                <ChoiceButton
                                    active={choices[name] === 'uploaded'}
                                    onClick={() =>
                                        setChoices((p) => ({ ...p, [name]: 'uploaded' }))
                                    }
                                    title="Replace"
                                    subtitle="Newer file"
                                />
                            </div>
                        </li>
                    ))}
                </ul>

                <DialogFooter className="pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleConfirm}>
                        Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ChoiceButton({
    active,
    onClick,
    title,
    subtitle,
}: {
    active: boolean;
    onClick: () => void;
    title: string;
    subtitle: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex-1 rounded-md border px-3 py-2 text-left transition',
                active
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:bg-muted',
            )}
        >
            <span className="block text-sm font-medium text-foreground">{title}</span>
            <span className="block text-xs text-muted-foreground">{subtitle}</span>
        </button>
    );
}
