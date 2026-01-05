import React from 'react';
import TableBlock, { renderInlineStyles } from './TableBlock';

/**
 * Renderer for text content that may contain tables
 * @param {Object} props
 * @param {string} props.content - The content to render
 * @param {Object} props.theme - Theme object
 */
const TextWithTableRenderer = ({ content, theme }) => {
    if (typeof content !== 'string') return null;
    const lines = content.split('\n');
    const elements = [];
    let currentTable = [];
    let inTable = false;

    lines.forEach((line) => {
        const trimmed = line.trim();
        const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|');
        if (isTableRow) {
            if (!inTable) inTable = true;
            currentTable.push(line);
        } else {
            if (inTable) { elements.push({ type: 'table', rows: currentTable }); currentTable = []; inTable = false; }
            const headerMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
            if (headerMatch) { elements.push({ type: 'header', level: headerMatch[1].length, content: headerMatch[2] }); return; }
            const listMatch = trimmed.match(/^[-*]\s+(.*)/);
            if (listMatch) { elements.push({ type: 'ul', content: listMatch[1] }); return; }
            const orderedListMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
            if (orderedListMatch) { elements.push({ type: 'ol', number: orderedListMatch[1], content: orderedListMatch[2] }); return; }
            const quoteMatch = trimmed.match(/^>\s+(.*)/);
            if (quoteMatch) { elements.push({ type: 'quote', content: quoteMatch[1] }); return; }
            if (trimmed === '---' || trimmed === '***') { elements.push({ type: 'hr' }); return; }
            elements.push({ type: 'text', content: line });
        }
    });
    if (inTable) elements.push({ type: 'table', rows: currentTable });

    const isDark = theme.isDark;

    return (
        <>
            {elements.map((el, idx) => {
                switch (el.type) {
                    case 'table': return <TableBlock key={idx} rows={el.rows} theme={theme} />;
                    case 'header':
                        const sizes = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-lg', 4: 'text-base' };
                        return <div key={idx} className={`${sizes[el.level] || 'text-base'} font-bold mt-4 mb-2 ${isDark ? 'text-blue-100' : 'text-blue-800'}`}>{renderInlineStyles(el.content, theme)}</div>;
                    case 'ul': return <div key={idx} className="flex items-start gap-2 ml-1 my-1"><div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`} /><span className="leading-relaxed">{renderInlineStyles(el.content, theme)}</span></div>;
                    case 'ol': return <div key={idx} className="flex items-start gap-2 ml-1 my-1"><span className={`font-mono text-sm mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{el.number}.</span><span className="leading-relaxed">{renderInlineStyles(el.content, theme)}</span></div>;
                    case 'quote': return <div key={idx} className={`border-l-4 pl-4 py-2 my-3 italic rounded-r-lg ${isDark ? 'border-blue-500 text-gray-400 bg-blue-500/5' : 'border-blue-400 text-gray-600 bg-blue-50'}`}>{renderInlineStyles(el.content, theme)}</div>;
                    case 'hr': return <hr key={idx} className="my-6" style={{ borderColor: theme.colors.border }} />;
                    default: return <div key={idx} className={`${el.content.trim() === '' ? 'h-2' : 'min-h-[1.5em] leading-relaxed'}`}>{renderInlineStyles(el.content, theme)}</div>;
                }
            })}
        </>
    );
};

export default TextWithTableRenderer;
