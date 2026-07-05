'use client';

import { useState, useEffect } from 'react';
import { Loader2, Copy, Check, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SafeFileContentRendererProps {
    url: string;
    filePath: string;
}

export function SafeFileContentRenderer({ url, filePath }: SafeFileContentRendererProps) {
    const [content, setContent] = useState<string | null>(null);
    const [xlsxData, setXlsxData] = useState<{ [sheetName: string]: any[][] } | null>(null);
    const [sheets, setSheets] = useState<string[]>([]);
    const [activeSheet, setActiveSheet] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fileName = filePath.split('/').pop() || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(extension);
    const isPdf = extension === 'pdf';
    const isXlsx = extension === 'xlsx';
    const isBinary = ['zip', 'tar', 'gz', 'rar', '7z', 'exe', 'dmg', 'iso', 'bin'].includes(extension);

    // Effect for regular text files
    useEffect(() => {
        if (isImage || isPdf || isBinary || isXlsx || !url) {
            setContent(null);
            setError(null);
            return;
        }

        let isMounted = true;
        const controller = new AbortController();

        async function fetchContent() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const text = await res.text();
                if (isMounted) {
                    setContent(text);
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                if (isMounted) {
                    setError(err.message || 'Failed to fetch content');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchContent();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [url, isImage, isPdf, isBinary, isXlsx]);

    // Effect for XLSX spreadsheets
    useEffect(() => {
        if (!isXlsx || !url) {
            setXlsxData(null);
            setSheets([]);
            setActiveSheet('');
            return;
        }

        let isMounted = true;
        const controller = new AbortController();

        async function fetchXlsx() {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(url, { signal: controller.signal });
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                const buffer = await res.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                
                const dataMap: { [sheetName: string]: any[][] } = {};
                workbook.SheetNames.forEach(name => {
                    const sheet = workbook.Sheets[name];
                    dataMap[name] = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
                });

                if (isMounted) {
                    setSheets(workbook.SheetNames);
                    setXlsxData(dataMap);
                    setActiveSheet(workbook.SheetNames[0] || '');
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                if (isMounted) {
                    setError(err.message || 'Failed to parse Excel file');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchXlsx();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [url, isXlsx]);

    const handleCopy = async () => {
        if (!content) return;
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // ignore
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-16 border border-zinc-200 rounded-lg bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/20 text-sm text-zinc-500">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-600 dark:text-zinc-400" />
                <span>Loading file content...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-12 text-center text-sm text-red-500 border border-red-200 rounded-lg bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10 px-4">
                <p className="font-semibold">Error loading file content</p>
                <p className="text-xs mt-1 text-red-500/80 font-mono">{error}</p>
                <p className="text-xs mt-3">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-red-600">
                        Open raw file directly
                    </a>
                </p>
            </div>
        );
    }

    if (isImage) {
        return (
            <div className="flex items-center justify-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-zinc-50 dark:bg-zinc-900/10 min-h-[300px]">
                <div className="relative group max-w-full">
                    <img
                        src={url}
                        alt={fileName}
                        className="max-h-[500px] max-w-full rounded-md border border-zinc-200 dark:border-zinc-800 shadow-sm object-contain bg-zinc-100 dark:bg-zinc-900"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 text-white text-[10px] px-2 py-1 rounded">
                        {extension.toUpperCase()} Image
                    </div>
                </div>
            </div>
        );
    }

    if (isPdf) {
        return (
            <div className="relative w-full h-[600px] border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-background">
                <iframe
                    src={url}
                    className="w-full h-full border-0"
                    title={fileName}
                    sandbox="allow-same-origin allow-scripts"
                />
            </div>
        );
    }

    if (isXlsx) {
        if (!activeSheet || !xlsxData || !xlsxData[activeSheet]) {
            return (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/20 text-zinc-500 text-sm">
                    <span>No data available in this spreadsheet.</span>
                </div>
            );
        }

        const rows = xlsxData[activeSheet];
        const maxCols = Math.max(...rows.map(row => row.length), 0);

        const getColLabel = (index: number): string => {
            let label = '';
            let temp = index;
            while (temp >= 0) {
                label = String.fromCharCode((temp % 26) + 65) + label;
                temp = Math.floor(temp / 26) - 1;
            }
            return label;
        };

        return (
            <div className="flex flex-col rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-md">
                {/* Excel Table Title Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-805 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-650 dark:text-zinc-400 font-semibold">
                    <span className="truncate">{fileName}</span>
                    <span className="text-[10px] uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-450 px-2 py-0.5 rounded font-mono">
                        Spreadsheet Preview
                    </span>
                </div>

                {/* Spreadsheet Grid Container */}
                <div className="flex-1 overflow-auto max-h-[500px]">
                    <table className="w-full border-collapse border-spacing-0 select-text">
                        <thead className="sticky top-0 z-20 bg-zinc-50 dark:bg-zinc-900 shadow-[0_1px_0_0_rgba(228,228,231,1)] dark:shadow-[0_1px_0_0_rgba(39,39,42,1)]">
                            <tr className="border-b border-zinc-200 dark:border-zinc-800">
                                <th className="w-12 text-center text-[10px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-900/80 border-r border-b border-zinc-200 dark:border-zinc-800 p-1 sticky left-0 z-30 select-none"></th>
                                {Array.from({ length: maxCols }).map((_, colIndex) => (
                                    <th key={colIndex} className="px-3 py-1 text-center text-xs font-semibold text-zinc-550 dark:text-zinc-400 border-r border-b border-zinc-200 dark:border-zinc-800 font-mono min-w-[100px] select-none">
                                        {getColLabel(colIndex)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                            {rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                                    <td className="w-12 text-center text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 font-mono select-none sticky left-0 z-10">
                                        {rowIndex + 1}
                                    </td>
                                    {Array.from({ length: maxCols }).map((_, colIndex) => {
                                        const cellValue = row[colIndex];
                                        return (
                                            <td key={colIndex} className="px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800/80 text-xs text-zinc-800 dark:text-zinc-300 font-normal truncate max-w-[200px]" title={cellValue !== undefined && cellValue !== null ? String(cellValue) : ''}>
                                                {cellValue !== undefined && cellValue !== null ? String(cellValue) : ''}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Sheets Tab Selection Bar */}
                {sheets.length > 0 && (
                    <div className="flex border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2 gap-2 overflow-x-auto select-none">
                        {sheets.map(name => (
                            <button
                                key={name}
                                onClick={() => setActiveSheet(name)}
                                className={`px-3 py-1 text-xs font-medium rounded border transition-all cursor-pointer ${
                                    activeSheet === name
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-semibold'
                                        : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                                }`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (isBinary) {
        return (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/20 text-zinc-500 text-sm">
                <FileText className="h-10 w-10 text-zinc-400 mb-2" />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{fileName}</span>
                <span className="text-xs mt-1">Binary file ({extension.toUpperCase()}) cannot be previewed.</span>
                <a
                    href={url}
                    download={fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 px-4 py-2 text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                >
                    Download File
                </a>
            </div>
        );
    }

    if (content === null) {
        return (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900/20 text-zinc-500 text-sm">
                <span>No content available.</span>
            </div>
        );
    }

    const lines = content.split(/\r?\n/);
    const highlightedCode = highlightCode(content, fileName);
    const highlightedLines = highlightedCode.split(/\r?\n/);

    return (
        <div className="flex flex-col rounded-lg border border-zinc-800 overflow-hidden bg-zinc-950 text-zinc-100 shadow-lg font-sans">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80 text-xs text-zinc-400">
                <span className="font-mono truncate">{fileName}</span>
                <button
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-200 text-zinc-400 transition-colors text-xs font-medium cursor-pointer"
                    onClick={handleCopy}
                >
                    {copied ? (
                        <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            
            <div className="flex font-mono text-[13px] leading-6 overflow-x-auto max-h-[500px]">
                {/* Line Numbers */}
                <div className="select-none text-right pr-4 pl-3 border-r border-zinc-800 text-zinc-600 bg-zinc-900/20 py-4 min-w-[3.5rem] sticky left-0 z-10">
                    {lines.map((_, i) => (
                        <div key={i} className="h-6">{i + 1}</div>
                    ))}
                </div>
                {/* Code Content */}
                <pre className="flex-1 py-4 px-4 overflow-x-auto text-left bg-zinc-950/50 m-0">
                    <code className="block">
                        {highlightedLines.map((lineContent, i) => (
                            <div
                                key={i}
                                className="h-6 whitespace-pre hover:bg-zinc-900/40 px-1 rounded-sm transition-colors"
                                dangerouslySetInnerHTML={{ __html: lineContent || ' ' }}
                            />
                        ))}
                    </code>
                </pre>
            </div>
        </div>
    );
}

function highlightCode(code: string, fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'py', 'go', 'rs', 'java', 'cpp', 'c', 'sh', 'yaml', 'yml', 'md'].includes(ext || '')) {
        return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    let escaped = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Replace strings and comments with placeholders to avoid matching keywords inside them
    const placeholders: string[] = [];
    
    // 1. Double/single quotes and backticks strings
    escaped = escaped.replace(/(["'`])(?:\\.|[^\\])*?\1/g, (match) => {
        placeholders.push(`<span class="text-emerald-400">${match}</span>`);
        return `___PLACEHOLDER_${placeholders.length - 1}___`;
    });

    // 2. Comments (inline and block)
    escaped = escaped.replace(/(\/\/.*|\/\*[\s\S]*?\*\/|#.*)/g, (match) => {
        placeholders.push(`<span class="text-zinc-500 italic">${match}</span>`);
        return `___PLACEHOLDER_${placeholders.length - 1}___`;
    });

    // 3. Keywords
    const keywords = /\b(const|let|var|function|return|class|import|export|default|from|extends|super|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|this|typeof|instanceof|async|await|yield|public|private|protected|static|readonly|interface|type|enum|as|any|string|number|boolean|void|null|undefined|true|false|def|elif|except|with|lambda|pass|none|package|func|chan|struct|map|range|defer|fn|mut|impl|trait|use|mod|pub|crate|self|Self|match|loop|dyn)\b/g;
    escaped = escaped.replace(keywords, '<span class="text-sky-400 font-semibold">$1</span>');

    // 4. Numbers
    escaped = escaped.replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');

    // 5. Functions
    escaped = escaped.replace(/\b(\w+)(?=\s*\()/g, '<span class="text-violet-400">$1</span>');

    // Restore placeholders
    for (let i = placeholders.length - 1; i >= 0; i--) {
        escaped = escaped.replace(`___PLACEHOLDER_${i}___`, placeholders[i]);
    }

    // Replace tabs with 4 spaces for better monospace alignment
    escaped = escaped.replace(/\t/g, '    ');

    return escaped;
}
