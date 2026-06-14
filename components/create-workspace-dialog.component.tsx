'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
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
import { useToast } from '@/components/toast-provider';
import { useWorkspaceNameAvailability } from '@/hooks/use-workspace-name-availability';
import { normalizeWorkspace } from '@/lib/normalize-workspace';
import type { Workspace } from '@/types/workspaces';

interface CreateWorkspaceDialogProps {
    repoId: string | undefined;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Fired with the created workspace so the caller can surface/select it. */
    onCreated: (workspace: Workspace) => void;
}

/**
 * Modal for creating a workspace under a repo. The name field runs the same
 * debounced availability check used elsewhere (`GET /api/workspace/check/...`)
 * so users get inline feedback before submitting; creation posts to
 * `POST /api/workspace/create/:repoId/:name` and flashes a toast on failure.
 */
export function CreateWorkspaceDialog({
    repoId,
    open,
    onOpenChange,
    onCreated,
}: CreateWorkspaceDialogProps) {
    const { addToast } = useToast();
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { status: nameStatus, debouncedName } = useWorkspaceNameAvailability(
        repoId,
        name,
    );

    // Reset the field each time the dialog is freshly opened.
    useEffect(() => {
        if (open) {
            setName('');
            setIsSubmitting(false);
        }
    }, [open]);

    const trimmed = name.trim();
    const showIndicator = trimmed.length > 0;
    const showMessage = showIndicator && nameStatus !== 'idle';

    const isValid =
        !!repoId &&
        trimmed.length > 0 &&
        nameStatus !== 'taken' &&
        nameStatus !== 'checking' &&
        !isSubmitting;

    const handleCreate = async () => {
        if (!isValid || !repoId) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/create/${encodeURIComponent(
                    repoId,
                )}/${encodeURIComponent(trimmed)}`,
                {
                    method: 'POST',
                    credentials: 'include',
                },
            );
            const body = await res.json().catch(() => null);

            if (!res.ok) {
                addToast(body?.message ?? 'Could not create workspace.', 'error');
                return;
            }

            const created = normalizeWorkspace(body?.data ?? body);
            onCreated(created);
            addToast(body?.message ?? 'Workspace created.', 'success');
            onOpenChange(false);
        } catch {
            addToast('Something went wrong. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create workspace</DialogTitle>
                    <DialogDescription>
                        Workspaces let you organise files separately within this
                        repository.
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
                        htmlFor="workspace-name"
                        className="text-sm font-semibold text-foreground"
                    >
                        Workspace name <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                        <Input
                            id="workspace-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="off"
                            autoFocus
                            placeholder="e.g. feature-auth"
                            className={showIndicator ? 'pr-10' : undefined}
                        />
                        {showIndicator && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity duration-200">
                                {nameStatus === 'checking' && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                                {nameStatus === 'available' && (
                                    <CheckCircle2 className="h-4 w-4 text-accent" />
                                )}
                                {nameStatus === 'taken' && (
                                    <XCircle className="h-4 w-4 text-destructive" />
                                )}
                            </div>
                        )}
                    </div>

                    <div
                        className={`grid transition-all duration-300 ease-out ${
                            showMessage
                                ? 'grid-rows-[1fr] opacity-100'
                                : 'grid-rows-[0fr] opacity-0'
                        }`}
                    >
                        <div className="overflow-hidden">
                            {nameStatus === 'checking' && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Checking availability…
                                </p>
                            )}
                            {nameStatus === 'available' && (
                                <p className="text-sm text-accent flex items-center gap-1.5 font-medium">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span className="font-mono">{debouncedName}</span> is
                                    available
                                </p>
                            )}
                            {nameStatus === 'taken' && (
                                <p className="text-sm text-destructive flex items-center gap-1.5">
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span className="font-mono">{debouncedName}</span> is
                                    already taken in this repository
                                </p>
                            )}
                            {nameStatus === 'error' && (
                                <p className="text-sm text-muted-foreground">
                                    Could not check availability.
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!isValid}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating…
                                </>
                            ) : (
                                'Create workspace'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
