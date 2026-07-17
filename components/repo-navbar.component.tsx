'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GitBranch, FolderGit2, User as UserIcon, LogOut } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { NotificationsButton } from './notifications.component';
import { useUser } from '@/contexts/user.context';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

export function RepoNavbar() {
  const pathname = usePathname();
  const pagination = pathname.split('/').filter(Boolean);
  const { user, clearUser, setIsLoading } = useUser();
  const router = useRouter();
  const fallbackInitial = user?.displayName?.charAt(0).toUpperCase() ?? '?';

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        console.log('Logout failed');
        return;
      }

      clearUser();
      router.push(`/?toast="Logged out successfully!!"&toastType="success"`);
    } catch (e) {
      console.log('Network error : ', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center shrink-0">
            <GitBranch className="h-4 w-4 text-primary" />
          </div>
          {pagination.map((segment, index) => {
            const isLast = index === pagination.length - 1;
            const href = '/' + pagination.slice(0, index + 1).join('/');
            return (
              <span key={index} className="flex items-center gap-2 min-w-0">
                {isLast ? (
                  <span className="text-sm font-bold truncate">{segment}</span>
                ) : (
                  <>
                    <Link
                      href={href}
                      className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors truncate"
                    >
                      {segment}
                    </Link>
                    <span className="text-sm text-muted-foreground">/</span>
                  </>
                )}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <NotificationsButton />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={user?.displayName ? `${user.displayName}'s profile` : 'Profile'}
                className="h-8 w-8 rounded-full overflow-hidden border border-border bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
              >
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName ?? 'User avatar'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{fallbackInitial}</span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="z-[9999] min-w-[12rem]"
            >
              {user && (
                <>
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold truncate">{user.displayName}</span>
                    <span className="text-xs font-normal text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href={'/repositories'} className="cursor-pointer">
                  <FolderGit2 className="h-4 w-4" />
                  <span>All Repositories</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={user?.username ? `/${user.username}` : '#'} className="cursor-pointer">
                  <UserIcon className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
