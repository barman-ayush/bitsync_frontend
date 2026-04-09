import { Button } from "./ui/button";
import { Card } from "./ui/card";

export default function Pricing() {
    return <>
        <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8 bg-card/30">
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 text-center space-y-4">
                    <h2 className="text-4xl font-bold">Simple, transparent pricing</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Choose the plan that fits your team&apos;s needs
                    </p>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                    {[
                        {
                            name: 'Starter',
                            price: 'Free',
                            description: 'Perfect for individuals',
                            features: ['Up to 5GB storage', '1 workspace', 'Basic version history', 'Community support'],
                        },
                        {
                            name: 'Professional',
                            price: '$12',
                            period: '/month',
                            description: 'For growing teams',
                            features: ['500GB storage', 'Unlimited workspaces', 'Advanced version control', 'Priority support', 'Team collaboration'],
                            highlighted: true,
                        },
                        {
                            name: 'Enterprise',
                            price: 'Custom',
                            description: 'For large organizations',
                            features: ['Unlimited storage', 'SSO & advanced security', 'Dedicated support', 'Custom integrations', 'On-premise option'],
                        },
                    ].map((plan, idx) => (
                        <Card
                            key={idx}
                            className={`p-8 border transition flex flex-col ${plan.highlighted
                                ? 'border-primary bg-primary/5 shadow-lg scale-105'
                                : 'border-border/50 hover:border-border'
                                }`}
                        >
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                <p className="text-muted-foreground mb-6">{plan.description}</p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature, fidx) => (
                                        <li key={fidx} className="flex items-center gap-2 text-sm">
                                            <div className="h-2 w-2 rounded-full bg-primary"></div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button
                                className={`w-full ${plan.highlighted
                                    ? 'bg-primary hover:bg-primary/90'
                                    : 'bg-secondary/20 hover:bg-secondary/30 text-foreground'
                                    }`}
                            >
                                Get Started
                            </Button>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    </>
}
