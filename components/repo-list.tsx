'use client';

import { Repository } from '@/types/repos';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, FileText, Users } from 'lucide-react';
import Link from 'next/link';

interface RepoListProps {
  repositories: Repository[];
  searchQuery: string;
}

export function RepoList({ repositories, searchQuery }: RepoListProps) {
  const filteredRepos = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredRepos.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center space-y-4">
          <FileText className="h-12 w-12 mx-auto opacity-50" />
          <p className="text-lg">No repositories found</p>
          <p className="text-sm">Try adjusting your search query</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-6">
      {filteredRepos.map((repo) => (
        <Link key={repo.id} href={`/repo/${repo.owner}/${repo.name}`}>
          <Card className="p-6 hover:shadow-lg hover:border-primary/50 transition cursor-pointer">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-foreground hover:text-primary transition">
                    {repo.owner}/{repo.name}
                  </h3>
                  <Badge
                    variant={repo.visibility === 'private' ? 'outline' : 'secondary'}
                    className="flex items-center gap-1 w-fit"
                  >
                    {repo.visibility === 'private' && <Lock className="h-3 w-3" />}
                    <span className="text-xs capitalize">{repo.visibility}</span>
                  </Badge>
                </div>

                {repo.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {repo.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{repo.filesCount} files</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{repo.contributorsCount} contributor{repo.contributorsCount !== 1 ? 's' : ''}</span>
                  </div>
                  <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
