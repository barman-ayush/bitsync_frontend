import { Button } from "./ui/button";
import Link from "next/link";

export default function CTA() {
    return <>
        <section className="px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center space-y-8">
                <h2 className="text-5xl font-bold">Ready to simplify how your team works?</h2>
                <p className="text-xl text-muted-foreground">
                    Create your first repository and see how easy version control can be.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/repositories">
                        <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg">
                            Get Started
                        </Button>
                    </Link>
                    <a href="#features">
                        <Button size="lg" variant="outline" className="text-lg">
                            Learn More
                        </Button>
                    </a>
                </div>
            </div>
        </section>
    </>
}
