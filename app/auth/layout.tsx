import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              B
            </div>
            <span className="text-lg font-semibold">BitSync</span>
          </Link>
        </nav>
      </header>

      {/* Content */}
      {children}
    </div>
  );
}
