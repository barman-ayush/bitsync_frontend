import type {
    RepoHasCommits,
    RepoListFilters,
    RepoRole,
    RepoSortDirection,
    RepoSortField,
} from '@/types/repos';

const ROLE_VALUES: RepoRole[] = ['owner', 'admin', 'member'];
const SORT_VALUES: RepoSortField[] = ['created', 'updated', 'name'];
const DIRECTION_VALUES: RepoSortDirection[] = ['asc', 'desc'];

const QUALIFIER_RE = /(\w+):("([^"]*)"|(\S+))/g;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ParsedQualifier =
    | { type: 'owner'; value: string }
    | { type: 'role'; value: RepoRole }
    | { type: 'has_commits'; value: RepoHasCommits }
    | { type: 'sort'; value: RepoSortField }
    | { type: 'direction'; value: RepoSortDirection }
    | { type: 'created_from'; value: string; displayOp: '>' | '>=' | 'range' }
    | { type: 'created_to'; value: string; displayOp: '<' | '<=' | 'range' }
    | { type: 'description'; value: string }
    | { type: 'name'; value: string };

export interface ParseResult {
    qualifiers: ParsedQualifier[];
    freeText: string;
}

export function parseSearchInput(input: string): ParseResult {
    const qualifiers: ParsedQualifier[] = [];
    const freeTextParts: string[] = [];
    let lastIndex = 0;

    QUALIFIER_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = QUALIFIER_RE.exec(input)) !== null) {
        const before = input.slice(lastIndex, match.index);
        if (before.trim()) freeTextParts.push(before.trim());
        lastIndex = match.index + match[0].length;

        const key = match[1].toLowerCase();
        const value = (match[3] ?? match[4] ?? '').trim();
        if (!value) continue;

        const consumed = consumeQualifier(key, value, qualifiers);
        if (!consumed) {
            freeTextParts.push(match[0]);
        }
    }

    const tail = input.slice(lastIndex);
    if (tail.trim()) freeTextParts.push(tail.trim());

    return {
        qualifiers,
        freeText: freeTextParts.join(' ').replace(/\s+/g, ' ').trim(),
    };
}

function consumeQualifier(key: string, value: string, out: ParsedQualifier[]): boolean {
    switch (key) {
        case 'owner':
            out.push({ type: 'owner', value });
            return true;
        case 'role': {
            const v = value.toLowerCase() as RepoRole;
            if (!ROLE_VALUES.includes(v)) return false;
            out.push({ type: 'role', value: v });
            return true;
        }
        case 'has_commits': {
            const v = value.toLowerCase();
            if (v !== 'true' && v !== 'false') return false;
            out.push({ type: 'has_commits', value: v });
            return true;
        }
        case 'sort': {
            const v = value.toLowerCase() as RepoSortField;
            if (!SORT_VALUES.includes(v)) return false;
            out.push({ type: 'sort', value: v });
            return true;
        }
        case 'direction': {
            const v = value.toLowerCase() as RepoSortDirection;
            if (!DIRECTION_VALUES.includes(v)) return false;
            out.push({ type: 'direction', value: v });
            return true;
        }
        case 'created':
            return consumeCreated(value, out);
        case 'description':
            out.push({ type: 'description', value });
            return true;
        case 'name':
            out.push({ type: 'name', value });
            return true;
        default:
            return false;
    }
}

function consumeCreated(value: string, out: ParsedQualifier[]): boolean {
    if (value.includes('..')) {
        const [from, to] = value.split('..');
        if (from && !DATE_RE.test(from)) return false;
        if (to && !DATE_RE.test(to)) return false;
        if (from) out.push({ type: 'created_from', value: from, displayOp: 'range' });
        if (to) out.push({ type: 'created_to', value: to, displayOp: 'range' });
        return true;
    }
    if (value.startsWith('>=')) {
        const d = value.slice(2);
        if (!DATE_RE.test(d)) return false;
        out.push({ type: 'created_from', value: d, displayOp: '>=' });
        return true;
    }
    if (value.startsWith('<=')) {
        const d = value.slice(2);
        if (!DATE_RE.test(d)) return false;
        out.push({ type: 'created_to', value: d, displayOp: '<=' });
        return true;
    }
    if (value.startsWith('>')) {
        const d = value.slice(1);
        if (!DATE_RE.test(d)) return false;
        out.push({ type: 'created_from', value: shiftDay(d, 1), displayOp: '>' });
        return true;
    }
    if (value.startsWith('<')) {
        const d = value.slice(1);
        if (!DATE_RE.test(d)) return false;
        out.push({ type: 'created_to', value: shiftDay(d, -1), displayOp: '<' });
        return true;
    }
    if (DATE_RE.test(value)) {
        out.push({ type: 'created_from', value, displayOp: 'range' });
        out.push({ type: 'created_to', value, displayOp: 'range' });
        return true;
    }
    return false;
}

function shiftDay(iso: string, days: number): string {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

export interface BuildFiltersOptions {
    sort: RepoSortField;
    direction: RepoSortDirection;
    page: number;
    per_page: number;
}

export function buildFilters(parsed: ParseResult, defaults: BuildFiltersOptions): RepoListFilters {
    const filters: RepoListFilters = {
        sort: defaults.sort,
        direction: defaults.direction,
        page: defaults.page,
        per_page: defaults.per_page,
    };

    const qParts: string[] = [];
    if (parsed.freeText) qParts.push(parsed.freeText);

    for (const q of parsed.qualifiers) {
        switch (q.type) {
            case 'owner':
                filters.owner = q.value;
                break;
            case 'role':
                filters.role = q.value;
                break;
            case 'has_commits':
                filters.has_commits = q.value;
                break;
            case 'sort':
                filters.sort = q.value;
                break;
            case 'direction':
                filters.direction = q.value;
                break;
            case 'created_from':
                filters.created_from = q.value;
                break;
            case 'created_to':
                filters.created_to = q.value;
                break;
            case 'description':
            case 'name':
                qParts.push(q.value);
                break;
        }
    }

    const q = qParts.join(' ').trim();
    if (q) filters.q = q;

    return filters;
}

const SINGLE_VALUE_KEYS = new Set([
    'owner',
    'role',
    'has_commits',
    'sort',
    'direction',
    'created',
]);

export function setQualifier(input: string, key: string, value: string | null): string {
    const re = new RegExp(`(^|\\s)${key}:(?:"[^"]*"|\\S+)`, 'gi');
    const stripped = input.replace(re, ' ').replace(/\s+/g, ' ').trim();
    if (value == null || value === '') return stripped;
    const needsQuote = /\s/.test(value);
    const piece = `${key}:${needsQuote ? `"${value}"` : value}`;
    if (!SINGLE_VALUE_KEYS.has(key)) {
        return stripped ? `${stripped} ${piece}` : piece;
    }
    return stripped ? `${stripped} ${piece}` : piece;
}

export function describeQualifier(q: ParsedQualifier): string {
    switch (q.type) {
        case 'owner':
            return `owner: ${q.value}`;
        case 'role':
            return `role: ${q.value}`;
        case 'has_commits':
            return q.value === 'true' ? 'has commits' : 'no commits';
        case 'sort':
            return `sort: ${q.value}`;
        case 'direction':
            return `direction: ${q.value}`;
        case 'created_from':
            return q.displayOp === 'range'
                ? `created ≥ ${q.value}`
                : `created ${q.displayOp} ${q.value}`;
        case 'created_to':
            return q.displayOp === 'range'
                ? `created ≤ ${q.value}`
                : `created ${q.displayOp} ${q.value}`;
        case 'description':
            return `description: ${q.value}`;
        case 'name':
            return `name: ${q.value}`;
    }
}

export function qualifierKey(q: ParsedQualifier): string {
    if (q.type === 'created_from' || q.type === 'created_to') return 'created';
    return q.type;
}
