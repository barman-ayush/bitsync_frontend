import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { NotificationsButton } from "./notifications.component";
import { useUser } from "@/contexts/user.context";
import { useRouter } from "next/navigation";

export default function LandingaNavbar() {
    const { user, clearUser, setIsLoading } = useUser();
    const router = useRouter();

    const handleLogout = async () => {
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

            router.push(`/?toast="Logged out successfully!!"&toastType="success"`)

        } catch (e) {
            console.log("Network error : ", e);
        } finally {
            setIsLoading(false);
        }
    }

    return <>
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
            <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                        B
                    </div>
                    <span className="text-xl font-semibold">BitSync</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium hover:text-primary transition">Features</a>
                    <a href="#security" className="text-sm font-medium hover:text-primary transition">Security</a>
                    <a href="#pricing" className="text-sm font-medium hover:text-primary transition">Pricing</a>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    {
                        !user ?
                            (
                                <>
                                    <Link href="/auth/login">
                                        <Button variant="outline" className="hidden sm:flex">Sign In</Button>
                                    </Link>
                                    <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
                                </>
                            ) :
                            (
                                <>
                                    <NotificationsButton />
                                    <Button onClick={handleLogout} className="bg-primary hover:bg-primary/90">Logout</Button>
                                </>
                            )
                    }

                </div>
            </nav>
        </header>

    </>
}