'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, GitBranch, Lock, Zap, Users, History, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
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

      {/* Hero Section */}
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

      {/* Features Section */}
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

      {/* Security Section */}
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

      {/* Pricing Section */}
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
                className={`p-8 border transition flex flex-col ${
                  plan.highlighted
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
                  className={`w-full ${
                    plan.highlighted
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

      {/* CTA Section */}
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

      {/* Footer */}
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
    </div>
  );
}
