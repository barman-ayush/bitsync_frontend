'use client';

import { useState, useEffect } from 'react';
import { FileItem } from '@/types/files';
import { FileMetadataSidebar } from './file-metadata-sidebar.component';
import { File, Folder, MoreVertical, LayoutList, Grid3x3, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SafeFileContentRenderer } from './safe-file-content-renderer.component';

export interface PathSegment {
    name: string;
    treeHash?: string;
}

interface FileBrowserProps {
    files: FileItem[];
    isLoading?: boolean;
    error?: string | null;
    repoName: string;
    pathStack: PathSegment[];
    onFolderClick: (file: FileItem) => void;
    onBreadcrumbClick: (index: number) => void;
    repoId: string;
}

type ViewMode = 'list' | 'grid';

export function FileBrowser({
    files,
    isLoading = false,
    error = null,
    repoName,
    pathStack,
    onFolderClick,
    onBreadcrumbClick,
    repoId,
}: FileBrowserProps) {
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [fileContentUrl, setFileContentUrl] = useState<string | null>(null);
    const [isFileLoading, setIsFileLoading] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedFile || !repoId) {
            setFileContentUrl(null);
            setIsFileLoading(false);
            setFileError(null);
            return;
        }

        const controller = new AbortController();
        setIsFileLoading(true);
        setFileContentUrl(null);
        setFileError(null);

        (async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/workspace/blob/${encodeURIComponent(
                        repoId,
                    )}/${encodeURIComponent(selectedFile.id)}`,
                    { credentials: 'include', signal: controller.signal },
                );
                if (controller.signal.aborted) return;

                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    setFileError(body?.message ?? `Request failed with ${res.status}`);
                    setIsFileLoading(false);
                    return;
                }

                const body = await res.json();
                const blobUrl = body?.data?.url;
                if (!blobUrl) {
                    setFileError('Received invalid response from server (missing URL).');
                    setIsFileLoading(false);
                    return;
                }

                setFileContentUrl(blobUrl);
                setIsFileLoading(false);
            } catch (e: any) {
                if (controller.signal.aborted) return;
                setFileError(e.message ?? 'Network error');
                setIsFileLoading(false);
            }
        })();

        return () => controller.abort();
    }, [selectedFile, repoId]);

    const handleFileClick = (file: FileItem) => {
        if (file.type === 'folder') {
            onFolderClick(file);
        } else {
            setSelectedFile(file);
        }
    };

    if (selectedFile) {
        return (
            <div className="flex h-full flex-col bg-background w-full">
                {/* Header/Toolbar */}
                <div className="sticky top-0 bg-card/50 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm flex-wrap">
                        <button
                            onClick={() => {
                                setSelectedFile(null);
                                onBreadcrumbClick(-1);
                            }}
                            className="text-muted-foreground hover:text-foreground transition font-medium"
                        >
                            {repoName}
                        </button>
                        {pathStack.map((segment, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-muted-foreground">
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        onBreadcrumbClick(idx);
                                    }}
                                    className="hover:text-foreground transition font-medium text-muted-foreground"
                                >
                                    {segment.name}
                                </button>
                            </div>
                        ))}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span className="text-foreground font-semibold cursor-default select-none">
                                {selectedFile.name}
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                        Back to Files
                    </Button>
                </div>

                <div className="flex-1 overflow-auto">
                    <div className="p-6">
                        <div className="rounded-lg border border-border bg-card">
                            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2 text-xs text-muted-foreground">
                                <span className="truncate font-mono">{selectedFile.name}</span>
                                <span className="shrink-0">
                                    {typeof selectedFile.size === 'number'
                                        ? formatFileSize(selectedFile.size)
                                        : '—'}
                                </span>
                            </div>

                            {isFileLoading ? (
                                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                                    <Spinner className="h-4 w-4 animate-spin text-primary" /> Loading file…
                                </div>
                            ) : fileError ? (
                                <div className="py-12 text-center text-sm text-destructive">
                                    {fileError}
                                </div>
                            ) : fileContentUrl ? (
                                <SafeFileContentRenderer url={fileContentUrl} filePath={selectedFile.name} />
                            ) : (
                                <div className="py-12 text-center text-sm text-muted-foreground">
                                    No content available for this file.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Main content */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-full">
                    {/* File browser toolbar */}
                    <div className="sticky top-0 bg-card/50 backdrop-blur border-b border-border px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="gap-2"
                            >
                                <LayoutList className="h-4 w-4" />
                                <span className="hidden sm:inline">List</span>
                            </Button>
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className="gap-2"
                            >
                                <Grid3x3 className="h-4 w-4" />
                                <span className="hidden sm:inline">Grid</span>
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {files.length} item{files.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Breadcrumbs path bar */}
                    <div className="px-6 py-3 border-b border-border bg-muted/10 flex items-center gap-1.5 text-sm flex-wrap">
                        <button
                            onClick={() => onBreadcrumbClick(-1)}
                            className="text-muted-foreground hover:text-foreground transition font-medium"
                        >
                            {repoName}
                        </button>
                        {pathStack.map((segment, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-muted-foreground">
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                                <button
                                    onClick={() => onBreadcrumbClick(idx)}
                                    className={`hover:text-foreground transition font-medium ${
                                        idx === pathStack.length - 1 ? 'text-foreground font-semibold cursor-default pointer-events-none' : ''
                                    }`}
                                >
                                    {segment.name}
                                </button>
                            </div>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-2 text-sm text-muted-foreground">
                            <Spinner className="h-6 w-6 animate-spin text-primary" />
                            <span>Loading files...</span>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-64 text-destructive text-sm font-medium">
                            {error}
                        </div>
                    ) : (
                        <>
                            {/* Files list view */}
                            {viewMode === 'list' && (
                                <div>
                                    {/* List header */}
                                    <div className="sticky top-14 bg-card/50 backdrop-blur border-b border-border px-6 py-4">
                                        <div className="grid grid-cols-12 gap-4 items-center text-sm font-semibold text-muted-foreground">
                                            <div className="col-span-6">Name</div>
                                            <div className="col-span-2">Modified</div>
                                            <div className="col-span-2">Size</div>
                                            <div className="col-span-2">Actions</div>
                                        </div>
                                    </div>

                                    {/* List items */}
                                    <div className="divide-y divide-border">
                                        {files.map((file) => (
                                            <div
                                                key={file.id}
                                                onClick={() => handleFileClick(file)}
                                                className="hover:bg-muted/50 transition cursor-pointer px-6 py-4 border-b border-border/50 last:border-b-0 group"
                                            >
                                                <div className="grid grid-cols-12 gap-4 items-center">
                                                    {/* Name */}
                                                    <div className="col-span-6 flex items-center gap-3 min-w-0">
                                                        {file.type === 'folder' ? (
                                                            <Folder className="h-5 w-5 text-accent flex-shrink-0" />
                                                        ) : (
                                                            <File className="h-5 w-5 text-secondary flex-shrink-0" />
                                                        )}
                                                        <div className="truncate">
                                                            <div className="font-medium text-foreground truncate">{file.name}</div>
                                                            {file.description && (
                                                                <div className="text-xs text-muted-foreground truncate">{file.description}</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Modified date */}
                                                    <div className="col-span-2 text-sm text-muted-foreground truncate">
                                                        {new Date(file.modifiedAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </div>

                                                    {/* Size */}
                                                    <div className="col-span-2 text-sm text-muted-foreground truncate">
                                                        {file.type === 'folder' ? '-' : formatFileSize(file.size || 0)}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="col-span-2 flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedFile(file);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 transition"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Files grid view */}
                            {viewMode === 'grid' && (
                                <div className="p-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {files.map((file) => (
                                            <div
                                                key={file.id}
                                                onClick={() => handleFileClick(file)}
                                                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:bg-muted/50 transition cursor-pointer group"
                                            >
                                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                                                    {file.type === 'folder' ? (
                                                        <Folder className="h-6 w-6 text-accent" />
                                                    ) : (
                                                        <File className="h-6 w-6 text-secondary" />
                                                    )}
                                                </div>
                                                <div className="text-center min-w-0">
                                                    <div className="text-sm font-medium text-foreground truncate w-full">{file.name}</div>
                                                    {file.type === 'folder' ? (
                                                        <div className="text-xs text-muted-foreground">Folder</div>
                                                    ) : (
                                                        <div className="text-xs text-muted-foreground">{formatFileSize(file.size || 0)}</div>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFile(file);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition mt-2"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {files.length === 0 && (
                                <div className="flex items-center justify-center h-64 text-muted-foreground">
                                    No files or folders
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Metadata sidebar */}
            {selectedFile && (
                <FileMetadataSidebar file={selectedFile} onClose={() => setSelectedFile(null)} />
            )}
        </div>
    );
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
