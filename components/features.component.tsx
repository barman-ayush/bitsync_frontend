import { GitBranch, GitPullRequest, History, Lock, Users, FolderGit2 } from "lucide-react";
import { Card } from "./ui/card";

export default function Features() {
    return <>
        <section id="features" className="px-4 py-20 sm:px-6 lg:px-8 bg-card/30">
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 text-center space-y-4">
                    <h2 className="text-4xl font-bold">Everything your team needs, nothing they don't</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        BitSync strips version control down to the essentials — so your team can focus on the work, not the tooling.
                    </p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {[
                        {
                            icon: FolderGit2,
                            title: 'Repositories',
                            description: 'Organize your projects into repositories. Each one gets its own history, contributors, and workspaces.',
                        },
                        {
                            icon: GitBranch,
                            title: 'Workspaces',
                            description: 'Every contributor gets their own workspace. Make changes independently and merge when you\'re ready — no stepping on each other\'s toes.',
                        },
                        {
                            icon: GitPullRequest,
                            title: 'Pull Requests',
                            description: 'Propose changes, describe what you did, and assign reviewers. A structured way to get work merged without confusion.',
                        },
                        {
                            icon: Users,
                            title: 'Reviews & Approvals',
                            description: 'Reviewers can look at exactly what changed, leave comments, and approve or request changes before anything gets merged.',
                        },
                        {
                            icon: History,
                            title: 'Commit History',
                            description: 'Every change is tracked with a full commit trail. See who changed what, when, and why — across any workspace.',
                        },
                        {
                            icon: Lock,
                            title: 'Roles & Permissions',
                            description: 'Control who can do what. Owners, admins, and members each have their own level of access to keep things secure.',
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