import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

export default function Hero() {
    return <>
        <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
                            <span className="inline-block h-2 w-2 rounded-full bg-accent mr-2"></span>
                            Version Control Meets Collaboration
                        </div>
                        <h1 className="text-5xl sm:text-6xl font-bold leading-tight text-balance">
                            Seamless file sharing with version control
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            Track every change, manage versions effortlessly, and collaborate with your team in real-time. BitSync brings Git-like version control to your files.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg">
                                Start Free Trial
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button size="lg" variant="outline" className="text-lg">
                                Watch Demo
                            </Button>
                        </div>
                    </div>
                    <div className="relative h-96 lg:h-full min-h-96">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-2xl blur-3xl"></div>
                        <div className="relative h-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-8 flex items-center justify-center">
                            <div className="space-y-4 w-full">
                                <div className="h-12 bg-primary/10 rounded-lg"></div>
                                <div className="h-8 bg-accent/10 rounded-lg w-2/3"></div>
                                <div className="h-8 bg-secondary/10 rounded-lg w-1/2"></div>
                                <div className="pt-4 space-y-2">
                                    <div className="h-4 bg-muted rounded-lg"></div>
                                    <div className="h-4 bg-muted rounded-lg w-5/6"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </>
}