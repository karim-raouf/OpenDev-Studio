import React, { useState, useRef } from 'react';
import { Terminal, AlertTriangle } from 'lucide-react';
import { highlightSyntax } from './SyntaxHighlighter';

/**
 * Code editor component with syntax highlighting and line numbers
 * @param {Object} props
 * @param {Object} props.file - The file object with id, name, and content
 * @param {Function} props.onChange - Change handler (fileId, newContent)
 * @param {Object} props.theme - Theme object with colors
 */
const CodeEditor = ({ file, onChange, theme }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const preRef = useRef(null);

    if (!file || !theme) return (
        <div className="flex flex-col items-center justify-center h-full" style={{ color: theme?.colors.textMuted || 'gray' }}>
            <div className="w-20 h-20 mb-4 rounded-2xl flex items-center justify-center bg-opacity-20" style={{ backgroundColor: theme?.colors.border }}>
                <Terminal size={40} className="opacity-50" />
            </div>
            <p className="text-sm font-medium opacity-60">Select a file to start editing</p>
        </div>
    );

    const lines = file.content ? file.content.split('\n') : [''];

    if (lines.length > 2000) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-yellow-500">
                <AlertTriangle size={48} className="mb-4" />
                <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>File Too Large</h3>
                <p className="text-sm opacity-70 mt-2">Performance mode enabled.</p>
            </div>
        );
    }

    const handleScroll = (e) => {
        const { scrollTop, scrollLeft } = e.target;
        setScrollTop(scrollTop);
        if (preRef.current) {
            preRef.current.scrollTop = scrollTop;
            preRef.current.scrollLeft = scrollLeft;
        }
    };

    return (
        <div className="h-full font-mono text-sm relative flex rounded-b-xl overflow-hidden" style={{ backgroundColor: theme.colors.editor }}>
            <div className="w-14 flex-shrink-0 text-right pr-4 pt-4 select-none border-r h-full overflow-hidden"
                style={{ backgroundColor: theme.colors.editor, color: theme.colors.textMuted, borderColor: theme.colors.border }}>
                <div style={{ transform: `translateY(-${scrollTop}px)` }}>
                    {lines.map((_, i) => <div key={i} className="h-6 leading-6 text-xs">{i + 1}</div>)}
                </div>
            </div>
            <div className="flex-1 relative overflow-hidden">
                <pre ref={preRef} className="absolute inset-0 p-4 m-0 pointer-events-none whitespace-pre tab-4 overflow-hidden"
                    style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '24px', tabSize: 2 }} aria-hidden="true">
                    {lines.map((line, i) => <div key={i} className="h-6">{highlightSyntax(line, theme.isDark)}</div>)}
                </pre>
                <textarea className="absolute inset-0 w-full h-full p-4 m-0 bg-transparent outline-none border-none resize-none whitespace-pre tab-4 overflow-auto"
                    style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '24px', tabSize: 2, color: 'transparent', caretColor: theme.colors.text }}
                    value={file.content || ''}
                    onChange={(e) => onChange(file.id, e.target.value)}
                    onScroll={handleScroll}
                    spellCheck="false" autoComplete="off" />
            </div>
        </div>
    );
};

export default CodeEditor;
