'use client';

import { Button } from '@/components/ui/button';
import { GitCommit, Plus } from 'lucide-react';

interface EmptyRepoStateProps {
    repoName?: string;
    onCreateWorkspace: () => void;
}

export function EmptyRepoState({ repoName, onCreateWorkspace }: EmptyRepoStateProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-background text-center px-4 py-12">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-6">
                <GitCommit className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">No commits yet</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                {repoName ? (
                    <>
                        <span className="font-medium text-foreground">{repoName}</span> is
                        empty. Create a workspace to start adding files and make your first
                        commit.
                    </>
                ) : (
                    'This repository is empty. Create a workspace to start adding files and make your first commit.'
                )}
            </p>
            <Button onClick={onCreateWorkspace} className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Create workspace
            </Button>
        </div>
    );
}
