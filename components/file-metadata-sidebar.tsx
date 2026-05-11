'use client';

import { FileItem } from '@/types/files';
import { Button } from '@/components/ui/button';
import { X, Share2, Trash2, Copy, Edit2 } from 'lucide-react';

interface FileMetadataSidebarProps {
  file: FileItem;
  onClose: () => void;
}

export function FileMetadataSidebar({ file, onClose }: FileMetadataSidebarProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-80 border-l border-border bg-card/50 backdrop-blur flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <h2 className="font-semibold text-foreground">Details</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* File name and type */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Name
          </div>
          <div className="text-lg font-semibold text-foreground break-words">{file.name}</div>
          <div className="text-sm text-muted-foreground mt-1 capitalize">{file.type}</div>
        </div>

        {/* Size */}
        {file.type !== 'folder' && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Size
            </div>
            <div className="text-sm text-foreground">{formatFileSize(file.size || 0)}</div>
          </div>
        )}

        {/* Created date */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Created
          </div>
          <div className="text-sm text-foreground">{formatDate(file.createdAt)}</div>
        </div>

        {/* Modified date */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Last Modified
          </div>
          <div className="text-sm text-foreground">{formatDate(file.modifiedAt)}</div>
        </div>

        {/* Owner */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Owner
          </div>
          <div className="text-sm text-foreground">{file.owner}</div>
        </div>

        {/* Description */}
        {file.description && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Description
            </div>
            <div className="text-sm text-foreground">{file.description}</div>
          </div>
        )}

        {/* Versions */}
        {file.versions && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Versions
            </div>
            <div className="text-sm text-foreground">{file.versions} version{file.versions !== 1 ? 's' : ''}</div>
          </div>
        )}

        {/* File ID */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            ID
          </div>
          <div className="text-xs text-muted-foreground font-mono break-all">{file.id}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-border/50 space-y-2">
        <Button variant="outline" className="w-full justify-start gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Edit2 className="h-4 w-4" />
          Rename
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
