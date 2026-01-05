import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { highlightSyntax } from '../editor/SyntaxHighlighter';

/**
 * Code block component for chat messages with copy functionality
 * @param {Object} props
 * @param {string} props.lang - The programming language
 * @param {string} props.content - The code content
 * @param {Object} props.theme - Theme object with colors
 */
const ChatCodeBlock = ({ lang, content, theme }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isDark = theme ? theme.isDark : true;

    return (
        <div className="my-3 rounded-lg overflow-hidden border shadow-sm"
            style={{ borderColor: theme?.colors.border || '#333', backgroundColor: isDark ? '#0f0f11' : '#f8fafc' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b"
                style={{ backgroundColor: theme?.colors.inputBg || '#18181b', borderColor: theme?.colors.border || '#333' }}>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">{lang || 'code'}</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-[10px] opacity-70 hover:opacity-100 transition-colors">
                    {copied ? <><Check size={12} className="text-green-500" /><span className="text-green-500">Copied</span></> : <><Copy size={12} /><span>Copy</span></>}
                </button>
            </div>
            <div className="p-4 overflow-x-auto font-mono text-xs leading-relaxed">
                {highlightSyntax(content, isDark)}
            </div>
        </div>
    );
};

export default ChatCodeBlock;
