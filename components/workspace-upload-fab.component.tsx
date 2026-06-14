'use client';

import { useRef } from 'react';
import { FolderPlus, Plus, Upload } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface WorkspaceUploadFabProps {
    /** Disabled until a workspace is active. */
    disabled?: boolean;
    /** A blob upload is in flight — swaps the icon for a spinner. */
    isUploading?: boolean;
    /** Display label for the folder the actions target (e.g. `src/` or `root`). */
    targetLabel: string;
    /** Fired with the chosen files when the user picks "Upload file". */
    onUploadFiles: (files: File[]) => void;
    /** Fired when the user picks "Create folder". */
    onCreateFolder: () => void;
}

/**
 * The bottom-right floating action button for the workspace view. Opens a menu
 * to upload files or create a (local placeholder) folder, both targeting the
 * currently-selected folder. Folder deletion is intentionally absent — it's
 * still under development on the backend.
 */
export function WorkspaceUploadFab({
    disabled,
    isUploading,
    targetLabel,
    onUploadFiles,
    onCreateFolder,
}: WorkspaceUploadFabProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        // Reset so re-picking the same file still fires onChange.
        e.target.value = '';
        if (files.length > 0) onUploadFiles(files);
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFilesPicked}
            />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        disabled={disabled}
                        aria-label="Add to workspace"
                        className={cn(
                            'absolute bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            disabled && 'pointer-events-none opacity-50',
                        )}
                    >
                        {isUploading ? (
                            <Spinner className="h-6 w-6" />
                        ) : (
                            <Plus className="h-6 w-6" />
                        )}
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" side="top" sideOffset={12} className="w-56">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Adding to{' '}
                        <span className="font-mono font-medium text-foreground">
                            {targetLabel}
                        </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => inputRef.current?.click()}
                        className="gap-2"
                    >
                        <Upload className="h-4 w-4" />
                        Upload file
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onCreateFolder} className="gap-2">
                        <FolderPlus className="h-4 w-4" />
                        Create folder
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
