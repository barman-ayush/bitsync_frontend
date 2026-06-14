'use client';

import { FileUp, Trash2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import type { PendingChange } from '@/types/workspace-tree';

interface WorkspaceChangesBarProps {
    changes: PendingChange[];
    isStaging: boolean;
    /** Commit the queued changes. */
    onStage: () => void;
    /** Drop a single queued change. */
    onRemove: (filePath: string) => void;
    /** Discard the whole queue. */
    onClear: () => void;
}

/**
 * The banner across the top of the file-view pane summarising queued (uploaded
 * but not yet staged) changes. The count opens a popover listing each file with
 * a remove control; "Stage changes" commits them all to the workspace tree.
 */
export function WorkspaceChangesBar({
    changes,
    isStaging,
    onStage,
    onRemove,
    onClear,
}: WorkspaceChangesBarProps) {
    if (changes.length === 0) return null;

    const count = changes.length;

    return (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-accent/10 px-4 py-2">
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm font-medium text-foreground transition hover:bg-muted"
                    >
                        <FileUp className="h-4 w-4 text-accent" />
                        {count} pending change{count === 1 ? '' : 's'}
                    </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 p-0">
                    <div className="flex items-center justify-between border-b border-border px-3 py-2">
                        <span className="text-sm font-semibold text-foreground">
                            Pending changes
                        </span>
                        <button
                            type="button"
                            onClick={onClear}
                            disabled={isStaging}
                            className="flex items-center gap-1 text-xs text-muted-foreground transition hover:text-destructive disabled:opacity-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Clear all
                        </button>
                    </div>
                    <ul className="max-h-72 overflow-y-auto p-1">
                        {changes.map((change) => {
                            const isDeletion = change.blobHash === null;
                            return (
                            <li
                                key={change.filePath}
                                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5 truncate font-medium text-foreground">
                                        <span className="truncate">{change.name}</span>
                                        {isDeletion && (
                                            <span className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                                                Delete
                                            </span>
                                        )}
                                    </span>
                                    <span className="block truncate font-mono text-xs text-muted-foreground">
                                        {change.filePath}
                                    </span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onRemove(change.filePath)}
                                    disabled={isStaging}
                                    aria-label={`Remove ${change.filePath}`}
                                    className="shrink-0 rounded p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </li>
                            );
                        })}
                    </ul>
                </PopoverContent>
            </Popover>

            <Button size="sm" onClick={onStage} disabled={isStaging} className="gap-1.5">
                {isStaging ? (
                    <>
                        <Spinner className="h-3.5 w-3.5" />
                        Staging…
                    </>
                ) : (
                    <>
                        <UploadCloud className="h-3.5 w-3.5" />
                        Stage changes
                    </>
                )}
            </Button>
        </div>
    );
}
