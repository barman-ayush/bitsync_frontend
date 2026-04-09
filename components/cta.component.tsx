import { Button } from "./ui/button";

export default function CTA() {
    return <>
        <section className="px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center space-y-8">
                <h2 className="text-5xl font-bold">Ready to sync better?</h2>
                <p className="text-xl text-muted-foreground">
                    Join thousands of teams already using BitSync to collaborate seamlessly
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg">
                        Start Your Free Trial
                    </Button>
                    <Button size="lg" variant="outline" className="text-lg">
                        Schedule Demo
                    </Button>
                </div>
            </div>
        </section>
    </>
}
