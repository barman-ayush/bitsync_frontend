'use client';

interface ErrorDisplayProps {
    code: number | string;
    message: string;
}

export function ErrorDisplay({ code, message }: ErrorDisplayProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-background text-center px-4">
            <h1 className="text-8xl md:text-9xl font-bold tracking-tight text-foreground">
                {code}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{message}</p>
        </div>
    );
}
