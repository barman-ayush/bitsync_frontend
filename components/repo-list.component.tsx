'use client';

import { Repository } from '@/types/repos';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Star, GitFork, Settings } from 'lucide-react';
import Link from 'next/link';

interface RepoListProps {
    repositories: Repository[];
    searchQuery: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    'C++': '#f34b7d',
    Go: '#00ADD8',
    Rust: '#dea584',
    Java: '#b07219',
    TeX: '#3D6117',
};

function formatRelative(iso: string): string {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, now - then);
    const day = 24 * 60 * 60 * 1000;
    if (diff < day) return 'today';
    if (diff < 2 * day) return 'yesterday';
    if (diff < 30 * day) return `${Math.floor(diff / day)} days ago`;
    if (diff < 365 * day) {
        const months = Math.floor(diff / (30 * day));
        return `${months} month${months === 1 ? '' : 's'} ago`;
    }
    const years = Math.floor(diff / (365 * day));
    return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function RepoList({ repositories, searchQuery }: RepoListProps) {
    const query = searchQuery.trim().toLowerCase();
    const filteredRepos = repositories.filter((repo) =>
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query),
    );

    return (
        <div className="px-6 md:px-12 lg:px-20 pb-8">
            <div className="flex items-center justify-between border-y border-border py-3">
                <span className="text-sm font-semibold text-foreground">
                    {filteredRepos.length} {filteredRepos.length === 1 ? 'repository' : 'repositories'}
                </span>
            </div>

            {filteredRepos.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center space-y-2">
                        <FileText className="h-10 w-10 mx-auto opacity-50" />
                        <p className="text-base">No repositories found</p>
                        <p className="text-sm">Try adjusting your search query</p>
                    </div>
                </div>
            ) : (
                <ul className="divide-y divide-border">
                    {filteredRepos.map((repo) => {
                        const langColor = repo.language ? LANGUAGE_COLORS[repo.language] ?? '#9ca3af' : null;
                        return (
                            <li key={repo.id} className="py-4 group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Link
                                                href={`/repo/${repo.owner}/${repo.name}`}
                                                className="text-base text-foreground hover:underline"
                                            >
                                                <span className="text-muted-foreground">{repo.owner}/</span>
                                                <span className="font-semibold text-primary">{repo.name}</span>
                                            </Link>
                                            <Badge
                                                variant="outline"
                                                className="rounded-full px-2 py-0 text-[11px] font-medium border-border text-muted-foreground"
                                            >
                                                {repo.visibility === 'private' ? 'Private' : 'Public'}
                                            </Badge>
                                        </div>

                                        {repo.description && (
                                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                                {repo.description}
                                            </p>
                                        )}

                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                            {repo.language && (
                                                <span className="flex items-center gap-1.5">
                                                    <span
                                                        className="inline-block h-2.5 w-2.5 rounded-full"
                                                        style={{ backgroundColor: langColor ?? '#9ca3af' }}
                                                    />
                                                    {repo.language}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <GitFork className="h-3.5 w-3.5" />
                                                {repo.forksCount ?? 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Star className="h-3.5 w-3.5" />
                                                {repo.starsCount ?? 0}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-3.5 w-3.5" />
                                                {repo.filesCount}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3.5 w-3.5" />
                                                {repo.contributorsCount}
                                            </span>
                                            <span>Updated {formatRelative(repo.updatedAt)}</span>
                                            <button
                                                type="button"
                                                aria-label="Repository settings"
                                                className="ml-1 rounded-sm p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
