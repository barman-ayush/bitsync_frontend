import { FileItem } from '@/types/files';
import { Contributor } from '@/types/contributors';
import { RepositoryPageContent } from '@/components/repository-page-content.component';

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

const mockContributors: Contributor[] = [
    {
        id: '1',
        name: 'Ayush Barman',
        email: 'ayush@bitsync.dev',
        role: 'owner',
        joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@bitsync.dev',
        role: 'admin',
        joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '3',
        name: 'Mike Chen',
        email: 'mike@example.com',
        role: 'editor',
        joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '4',
        name: 'Emma Davis',
        email: 'emma@example.com',
        role: 'editor',
        joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '5',
        name: 'Alex Rodriguez',
        email: 'alex@example.com',
        role: 'viewer',
        joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export default function RepositoryPage() {
    return (
        <RepositoryPageContent files={mockFiles} contributors={mockContributors} />
    );
}
