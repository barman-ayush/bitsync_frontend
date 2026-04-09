export default function Security() {
    return <>
        <section id="security" className="px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 p-12 lg:p-16">
                    <div className="grid gap-12 lg:grid-cols-2 items-center">
                        <div className="space-y-6">
                            <h2 className="text-4xl font-bold">Enterprise-grade security</h2>
                            <p className="text-lg text-muted-foreground">
                                Your files are protected with industry-leading security measures, ensuring complete peace of mind.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'End-to-end encryption for all files',
                                    'SOC 2 Type II certified',
                                    'GDPR and HIPAA compliant',
                                    'Regular security audits',
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-muted-foreground">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
                                            <div className="h-2 w-2 rounded-full bg-accent"></div>
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative h-96">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-3xl"></div>
                            <div className="relative h-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-8 flex items-center justify-center">
                                <div className="space-y-4 w-full">
                                    <div className="flex gap-2">
                                        <div className="h-4 w-4 rounded-full bg-primary/30"></div>
                                        <div className="h-4 w-4 rounded-full bg-accent/30"></div>
                                        <div className="h-4 w-4 rounded-full bg-secondary/30"></div>
                                    </div>
                                    <div className="h-32 bg-muted/20 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </>
}
