'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RepoSearchNavbar } from '@/components/repo-search-navbar.component';
import { RepoList } from '@/components/repo-list.component';
import { useRepoList } from '@/hooks/use-repo-list';
import { buildFilters, parseSearchInput } from '@/lib/repo-search-parser';

const PER_PAGE = 20;

export default function RepositoriesPage() {
    const router = useRouter();
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);

    const filters = useMemo(() => {
        const parsed = parseSearchInput(searchInput);
        return buildFilters(parsed, {
            sort: 'updated',
            direction: 'desc',
            page,
            per_page: PER_PAGE,
        });
    }, [searchInput, page]);

    const { data, status, error } = useRepoList(filters);

    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        if (page !== 1) setPage(1);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex-1 overflow-auto">
                <RepoSearchNavbar
                    searchInput={searchInput}
                    onSearchInputChange={handleSearchChange}
                    onNewRepo={() => router.push('/create/repository')}
                />
                <RepoList
                    data={data}
                    status={status}
                    error={error}
                    page={page}
                    onPageChange={setPage}
                />
            </div>
        </div>
    );
}
