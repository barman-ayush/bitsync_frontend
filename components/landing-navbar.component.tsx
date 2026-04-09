import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";

export default function LandingaNavbar() {
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
                    <Button variant="outline" className="hidden sm:flex">Sign In</Button>
                    <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
                </div>
            </nav>
        </header>

    </>
}