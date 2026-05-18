import { ProtectedRoute } from '@/components/protected-route';
import { RepoNavbar } from '@/components/repo-navbar.component';

export default function ProtectedRoutesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-background">
        <RepoNavbar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
