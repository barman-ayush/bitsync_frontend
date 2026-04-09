import { GitBranch, History, Lock, Shield, Users, Zap } from "lucide-react";
import { Card } from "./ui/card";

export default function Features() {
    return <>
        <section id="features" className="px-4 py-20 sm:px-6 lg:px-8 bg-card/30">
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 text-center space-y-4">
                    <h2 className="text-4xl font-bold">Powerful features for teams</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Everything you need to collaborate effectively and maintain complete control over your files
                    </p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {[
                        {
                            icon: GitBranch,
                            title: 'Version Control',
                            description: 'Track every change with a complete history. Revert to any previous version instantly.',
                        },
                        {
                            icon: Users,
                            title: 'Real-time Collaboration',
                            description: 'Work together seamlessly. See live edits from your team members as they happen.',
                        },
                        {
                            icon: Lock,
                            title: 'Enterprise Security',
                            description: 'Bank-level encryption, access controls, and compliance with industry standards.',
                        },
                        {
                            icon: Zap,
                            title: 'Instant Sync',
                            description: 'Changes sync across all devices instantly. Never lose work again.',
                        },
                        {
                            icon: History,
                            title: 'Change Tracking',
                            description: 'See who changed what and when. Detailed audit trails for accountability.',
                        },
                        {
                            icon: Shield,
                            title: 'Data Protection',
                            description: 'Automatic backups and disaster recovery. Your data is always safe.',
                        },
                    ].map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <Card key={idx} className="p-6 border border-border/50 hover:border-border hover:shadow-lg transition">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                                        <Icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-lg">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    </>
}