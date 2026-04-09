export default function Footer() {
    return <>
        <footer className="border-t border-border/50 bg-card/30 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="grid gap-8 md:grid-cols-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                                B
                            </div>
                            <span className="font-semibold">BitSync</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Version control for modern teams.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground transition">Features</a></li>
                            <li><a href="#" className="hover:text-foreground transition">Pricing</a></li>
                            <li><a href="#" className="hover:text-foreground transition">Security</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground transition">About</a></li>
                            <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
                            <li><a href="#" className="hover:text-foreground transition">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><a href="#" className="hover:text-foreground transition">Privacy</a></li>
                            <li><a href="#" className="hover:text-foreground transition">Terms</a></li>
                            <li><a href="#" className="hover:text-foreground transition">Cookies</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground">
                    <p>&copy; 2024 BitSync. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 sm:mt-0">
                        <a href="#" className="hover:text-foreground transition">Twitter</a>
                        <a href="#" className="hover:text-foreground transition">GitHub</a>
                        <a href="#" className="hover:text-foreground transition">LinkedIn</a>
                    </div>
                </div>
            </div>
        </footer>
    </>
}
