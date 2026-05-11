'use client';

import { useState } from 'react';
import { FileItem, FileMetadata } from '@/types/files';
import { FileMetadataSidebar } from './file-metadata-sidebar';
import { File, Folder, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileBrowserProps {
  files: FileItem[];
}

export function FileBrowser({ files }: FileBrowserProps) {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
  };

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-full">
          {/* File list header */}
          <div className="sticky top-0 bg-card/50 backdrop-blur border-b border-border px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center text-sm font-semibold text-muted-foreground">
              <div className="col-span-6">Name</div>
              <div className="col-span-2">Modified</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Actions</div>
            </div>
          </div>

          {/* Files list */}
          <div className="divide-y divide-border">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => handleFileClick(file)}
                className="hover:bg-muted/50 transition cursor-pointer px-6 py-4 border-b border-border/50 last:border-b-0"
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
                        handleFileClick(file);
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

          {files.length === 0 && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No files or folders
            </div>
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
