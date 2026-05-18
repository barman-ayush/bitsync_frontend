'use client';

import { useState } from 'react';
import { RepoNavbar } from '@/components/repo-navbar.component';
import { RepoList } from '@/components/repo-list.component';
import { Repository } from '@/types/repos';
import { RepoSearchNavbar } from '@/components/repo-search-navbar.component';

// Mock data - replace with actual API calls
const mockRepositories: Repository[] = [
    {
        id: '1',
        name: 'bitsync-backend',
        owner: 'ayush',
        description: 'Backend service for BitSync file sharing platform with version control capabilities',
        isPrivate: false,
        visibility: 'public',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        filesCount: 47,
        contributorsCount: 5,
        language: 'TypeScript',
        starsCount: 12,
        forksCount: 3,
    },
    {
        id: '2',
        name: 'bitsync-frontend',
        owner: 'ayush',
        description: 'Frontend application for BitSync with React and Next.js',
        isPrivate: false,
        visibility: 'public',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        filesCount: 62,
        contributorsCount: 4,
        language: 'TypeScript',
        starsCount: 8,
        forksCount: 1,
    },
    {
        id: '3',
        name: 'collaboration-tools',
        owner: 'ayush',
        description: 'Real-time collaboration utilities and shared components',
        isPrivate: true,
        visibility: 'private',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        filesCount: 23,
        contributorsCount: 3,
        language: 'JavaScript',
        starsCount: 0,
        forksCount: 0,
    },
    {
        id: '4',
        name: 'docs-internal',
        owner: 'ayush',
        description: 'Internal documentation and API reference for BitSync development',
        isPrivate: true,
        visibility: 'private',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        filesCount: 18,
        contributorsCount: 2,
        language: 'TeX',
        starsCount: 0,
        forksCount: 0,
    },
    {
        id: '5',
        name: 'mobile-sdk',
        owner: 'ayush',
        description: 'Mobile SDK for integrating BitSync into native applications',
        isPrivate: false,
        visibility: 'public',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        filesCount: 35,
        contributorsCount: 3,
        language: 'Go',
        starsCount: 4,
        forksCount: 2,
    },
    {
        id: '6',
        name: 'infrastructure',
        owner: 'ayush',
        description: 'Infrastructure as Code for BitSync deployment and scaling',
        isPrivate: true,
        visibility: 'private',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        filesCount: 28,
        contributorsCount: 2,
        language: 'Python',
        starsCount: 1,
        forksCount: 0,
    },
];

export default function RepositoriesPage() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex-1 overflow-auto">
                <RepoSearchNavbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
                <RepoList repositories={mockRepositories} searchQuery={searchQuery} />
            </div>
        </div>
    );
}
