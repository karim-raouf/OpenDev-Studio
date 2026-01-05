import React from 'react';

/**
 * Highlight code syntax with colors
 * @param {string} code - The code to highlight
 * @param {boolean} isDark - Whether dark theme is active
 * @returns {JSX.Element} Highlighted code elements
 */
export const highlightSyntax = (code, isDark = true) => {
    if (typeof code !== 'string') return <span>{String(code || '')}</span>;

    try {
        const parts = code.split(/(\/\/.*$|#.*$|['"`].*?['"`]|\b\d+\b|[a-zA-Z_$][a-zA-Z0-9_$]*(?=\()|@[a-zA-Z_$][a-zA-Z0-9_$]*|[a-zA-Z_$][a-zA-Z0-9_$]*|[(){}[\],.;:<>])/gm);

        const keywords = [
            'import', 'export', 'from', 'const', 'let', 'var', 'function', 'return', 'class', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
            'try', 'catch', 'finally', 'throw', 'async', 'await', 'new', 'this', 'super', 'extends', 'implements', 'interface', 'type', 'void', 'typeof', 'instanceof',
            'def', 'elif', 'pass', 'lambda', 'with', 'as', 'is', 'in', 'not', 'and', 'or', 'global', 'nonlocal', 'assert', 'del', 'yield', 'raise', 'except'
        ];
        const builtins = ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'print', 'console', 'window', 'document', 'module', 'require', 'self', 'None', 'True', 'False'];

        return parts.map((part, idx) => {
            if (!part) return null;
            if (part.startsWith('//') || part.startsWith('#')) return <span key={idx} className={isDark ? "text-[#6A9955]" : "text-[#008000] italic"}>{part}</span>;
            if ((part.startsWith("'") && part.endsWith("'")) || (part.startsWith('"') && part.endsWith('"')) || (part.startsWith('`') && part.endsWith('`'))) return <span key={idx} className={isDark ? "text-[#CE9178]" : "text-[#a31515]"}>{part}</span>;
            if (/^\d+$/.test(part)) return <span key={idx} className={isDark ? "text-[#B5CEA8]" : "text-[#098658]"}>{part}</span>;
            if (part.startsWith('@')) return <span key={idx} className={isDark ? "text-[#DCDCAA]" : "text-[#795E26]"}>{part}</span>;
            if (keywords.includes(part)) return <span key={idx} className={isDark ? "text-[#C586C0]" : "text-[#AF00DB]"}>{part}</span>;
            if (builtins.includes(part)) return <span key={idx} className={isDark ? "text-[#569CD6]" : "text-[#0000FF]"}>{part}</span>;
            if (part.match(/^[A-Z][a-zA-Z0-9]*$/) && part.length > 1 && !keywords.includes(part)) return <span key={idx} className={isDark ? "text-[#4EC9B0]" : "text-[#267F99]"}>{part}</span>;
            if (['=', '+', '-', '*', '/', '%', '!', '&', '|', '?', ':'].includes(part)) return <span key={idx} className={isDark ? "text-[#D4D4D4]" : "text-gray-600"}>{part}</span>;
            if (part.match(/^<[a-zA-Z]/) || part.match(/>$/)) return <span key={idx} className={isDark ? "text-[#569CD6]" : "text-[#800000]"}>{part}</span>;
            return <span key={idx} className={isDark ? "text-[#9CDCFE]" : "text-[#001080]"}>{part}</span>;
        });
    } catch (e) {
        return <span>{String(code)}</span>;
    }
};
