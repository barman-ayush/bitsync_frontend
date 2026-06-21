'use client';

import { useEffect, useState } from 'react';
import { GitCommit } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';

const MAX_MESSAGE = 1000;

interface CommitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Name of the workspace being committed, shown for context. */
    workspaceLabel?: string;
    /** A commit request is in flight — disables the form and shows a spinner. */
    isCommitting: boolean;
    /**
     * Fired with the validated message on submit. Should resolve truthy on a
     * successful commit (so the dialog closes) or falsy on failure (left open).
     */
    onCommit: (message: string) => Promise<unknown>;
}

/**
 * Collects a commit message and bakes the workspace's staged changes into a new
 * commit. The author and the file list come from the backend (JWT +
 * `workspace_changes`), so only the message is entered here.
 */
export function CommitDialog({
    open,
    onOpenChange,
    workspaceLabel,
    isCommitting,
    onCommit,
}: CommitDialogProps) {
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (open) setMessage('');
    }, [open]);

    const trimmed = message.trim();
    const tooLong = trimmed.length > MAX_MESSAGE;
    const isValid = trimmed.length > 0 && !tooLong;

    const handleCommit = async () => {
        if (!isValid || isCommitting) return;
        const result = await onCommit(trimmed);
        if (result) onOpenChange(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                // Don't let the dialog be dismissed mid-request.
                if (isCommitting) return;
                onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Commit changes</DialogTitle>
                    <DialogDescription>
                        Bakes the staged changes in{' '}
                        <span className="font-mono">{workspaceLabel ?? 'this workspace'}</span>{' '}
                        into a new commit.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleCommit();
                    }}
                    className="space-y-2"
                >
                    <label
                        htmlFor="commit-message"
                        className="text-sm font-semibold text-foreground"
                    >
                        Message <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                        id="commit-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isCommitting}
                        autoFocus
                        rows={4}
                        placeholder="Describe what changed in this commit"
                        aria-invalid={tooLong}
                        // Submit on Cmd/Ctrl+Enter, the usual commit shortcut.
                        onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                e.preventDefault();
                                handleCommit();
                            }
                        }}
                    />
                    <div className="flex items-center justify-between">
                        {tooLong ? (
                            <p className="text-sm text-destructive">
                                Message must be at most {MAX_MESSAGE} characters.
                            </p>
                        ) : (
                            <span />
                        )}
                        <span
                            className={
                                tooLong
                                    ? 'text-xs text-destructive'
                                    : 'text-xs text-muted-foreground'
                            }
                        >
                            {trimmed.length}/{MAX_MESSAGE}
                        </span>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isCommitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isValid || isCommitting}
                            // Solid hover background: the default variant's
                            // `hover:bg-primary/90` darkens over the dialog until
                            // the dark primary-foreground text vanishes.
                            className="gap-1.5 hover:bg-primary hover:opacity-90"
                        >
                            {isCommitting ? (
                                <>
                                    <Spinner className="h-3.5 w-3.5" />
                                    Committing…
                                </>
                            ) : (
                                <>
                                    <GitCommit className="h-4 w-4" />
                                    Commit
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
