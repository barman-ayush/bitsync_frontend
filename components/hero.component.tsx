import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

export default function Hero() {
    return <>
        <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
                            <span className="inline-block h-2 w-2 rounded-full bg-accent mr-2"></span>
                            Version Control, Simplified
                        </div>
                        <h1 className="text-5xl sm:text-6xl font-bold leading-tight text-balance">
                            Version control that gets out of your way
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            Not everyone lives in a terminal. BitSync brings the power of version control — repositories, workspaces, pull requests, and reviews — into a clean interface that anyone on your team can pick up in minutes.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link href="/repositories">
                                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg">
                                    Get Started
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <a href="#features">
                                <Button size="lg" variant="outline" className="text-lg">
                                    See How It Works
                                </Button>
                            </a>
                        </div>
                    </div>
                    <div className="relative h-96 lg:h-full min-h-96">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl blur-3xl"></div>
                        <div className="relative h-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-8 flex flex-col justify-center">
                            <div className="space-y-5 w-full">
                                {/* Mini repo card */}
                                <div className="rounded-lg border border-border/40 bg-background/60 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 rounded bg-primary/20"></div>
                                            <span className="text-sm font-semibold text-foreground">design-system</span>
                                        </div>
                                        <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full border border-border/50">Public</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Updated 2 minutes ago</p>
                                </div>
                                {/* Mini PR item */}
                                <div className="rounded-lg border border-border/40 bg-background/60 p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 rounded-full bg-green-500/30 flex items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                                        </div>
                                        <span className="text-sm font-medium text-foreground">Update homepage layout</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                        <span>opened by <span className="text-foreground font-medium">sarah</span></span>
                                        <span>· 3 files changed</span>
                                    </div>
                                </div>
                                {/* Mini review badge */}
                                <div className="flex items-center gap-3 px-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">A</div>
                                        <span className="text-xs text-green-500 font-medium">Approved</span>
                                    </div>
                                    <div className="h-px flex-1 bg-border/30"></div>
                                    <span className="text-[10px] text-muted-foreground">Ready to merge</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </>
}