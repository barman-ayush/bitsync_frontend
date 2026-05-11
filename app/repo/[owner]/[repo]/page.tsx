import { useState } from 'react';
import { RepoNavbar } from '@/components/repo-navbar';
import { FileBrowser } from '@/components/file-browser';
import { FileItem } from '@/types/files';

// Mock data - replace with actual API calls
const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'src',
    type: 'folder',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    modifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'barman-ayush',
    description: 'Source code files',
    versions: 12,
  },
  {
    id: '2',
    name: 'public',
    type: 'folder',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    modifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'barman-ayush',
    description: 'Static assets',
    versions: 4,
  },
  {
    id: '3',
    name: 'package.json',
    type: 'file',
    size: 2048,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    modifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'barman-ayush',
    description: 'Project dependencies',
    versions: 8,
  },
  {
    id: '4',
    name: '.gitignore',
    type: 'file',
    size: 512,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    modifiedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'barman-ayush',
    versions: 3,
  },
  {
    id: '5',
    name: 'README.md',
    type: 'file',
    size: 5120,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    modifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'barman-ayush',
    description: 'Project documentation',
    versions: 15,
  },
  {
    id: '6',
    name: 'next.config.js',
    type: 'file',
    size: 1024,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    modifiedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'barman-ayush',
    versions: 5,
  },
  {
    id: '7',
    name: 'tailwind.config.ts',
    type: 'file',
    size: 1536,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    modifiedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'barman-ayush',
    versions: 4,
  },
  {
    id: '8',
    name: 'tsconfig.json',
    type: 'file',
    size: 768,
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    modifiedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    owner: 'barman-ayush',
    versions: 2,
  },
];

interface RepositoryPageProps {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const { owner, repo } = await params;

  return (
    <RepositoryPageContent owner={owner} repo={repo} files={mockFiles} />
  );
}

function RepositoryPageContent({
  owner,
  repo,
  files,
}: {
  owner: string;
  repo: string;
  files: FileItem[];
}) {
  const [activeTab, setActiveTab] = useState('files');

  return (
    <div className="flex flex-col h-screen bg-background">
      <RepoNavbar
        owner={owner}
        repo={repo}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' && <FileBrowser files={files} />}
        {activeTab === 'contributors' && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Contributors view coming soon
          </div>
        )}
        {activeTab === 'workspaces' && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Workspaces view coming soon
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Settings view coming soon
          </div>
        )}
      </div>
    </div>
  );
}
