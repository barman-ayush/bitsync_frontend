import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6">
                <FileQuestion className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-7xl md:text-8xl font-bold tracking-tight text-foreground">
                404
            </h1>
            <p className="mt-4 text-lg font-medium text-foreground">
                This page could not be found
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
                The repository may have been deleted, renamed, or you don&apos;t have
                access to it.
            </p>
            <Button asChild className="mt-8 gap-2">
                <Link href="/repositories">
                    <Home className="h-4 w-4" />
                    Back to repositories
                </Link>
            </Button>
        </div>
    );
}
