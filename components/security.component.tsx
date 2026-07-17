export default function Security() {
    return <>
        <section id="security" className="px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 p-12 lg:p-16">
                    <div className="grid gap-12 lg:grid-cols-2 items-center">
                        <div className="space-y-6">
                            <h2 className="text-4xl font-bold">Built to keep your work safe</h2>
                            <p className="text-lg text-muted-foreground">
                                You shouldn't have to think about security to benefit from it. BitSync handles the hard parts so your team can focus on what they're building.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'Secure authentication with session management',
                                    'Role-based access — owners, admins, and members',
                                    'Email verification on every account',
                                    'All communication encrypted over HTTPS',
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
                            <div className="relative h-full rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-8 flex flex-col justify-center">
                                <div className="space-y-4 w-full">
                                    <div className="text-xs text-muted-foreground border-b border-border/30 pb-3 font-medium tracking-wide uppercase">
                                        Activity
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { icon: '✓', color: 'text-green-500/80', text: 'Session verified', time: 'just now' },
                                            { icon: '✓', color: 'text-green-500/80', text: 'Repository access granted', time: '2s ago' },
                                            { icon: '✓', color: 'text-green-500/80', text: 'Pull request merged by admin', time: '12m ago' },
                                            { icon: '✓', color: 'text-green-500/80', text: 'Email verification completed', time: '1h ago' },
                                            { icon: '⚠', color: 'text-yellow-500/80', text: 'Unauthorized access blocked', time: '3h ago' },
                                        ].map((log, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground flex items-center gap-2">
                                                    <span className={log.color}>{log.icon}</span>
                                                    {log.text}
                                                </span>
                                                <span className="text-muted-foreground/50">{log.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </>
}
