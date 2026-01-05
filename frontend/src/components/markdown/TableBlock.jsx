import React from 'react';

/**
 * Render inline styles (bold, code) within text
 * @param {string} text - The text to render
 * @param {Object} theme - Theme object
 * @returns {JSX.Element[]} Rendered elements
 */
export const renderInlineStyles = (text, theme) => {
    if (typeof text !== 'string') return null;
    const lines = text.split(/<br\s*\/?>/i);
    const isDark = theme ? theme.isDark : true;

    return lines.map((line, lineIdx) => {
        const regex = /(\*\*.*?\*\*|`.*?`|'.*?')/g;
        const parts = line.split(regex);
        const renderedParts = parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className={`font-bold ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>{part.slice(2, -2)}</strong>;
            if ((part.startsWith('`') && part.endsWith('`')) || (part.startsWith("'") && part.endsWith("'"))) {
                return <span key={i} className={`px-1.5 py-0.5 rounded-md font-mono text-xs mx-0.5 border ${isDark ? 'bg-[#2a2a2d] text-yellow-200 border-gray-700' : 'bg-gray-100 text-yellow-700 border-gray-200'}`}>{part.slice(1, -1)}</span>;
            }
            return part;
        });

        return (
            <React.Fragment key={lineIdx}>
                {lineIdx > 0 && <br />}
                {renderedParts}
            </React.Fragment>
        );
    });
};

/**
 * Markdown table component
 * @param {Object} props
 * @param {Array} props.rows - Array of table row strings
 * @param {Object} props.theme - Theme object
 */
const TableBlock = ({ rows, theme }) => {
    if (!rows || !Array.isArray(rows)) return null;
    const parsedRows = rows.map(r => r.split('|').filter(c => c.trim().length > 0).map(c => c.trim()));
    const contentRows = parsedRows.filter(row => !row.every(cell => cell.match(/^[-:]+$/)));
    if (contentRows.length < 1) return null;
    const header = contentRows[0];
    const body = contentRows.slice(1);

    return (
        <div className="my-4 overflow-x-auto rounded-lg border shadow-sm block" style={{ borderColor: theme.colors.border, maxWidth: '100%' }}>
            <table className="min-w-full text-left text-sm border-collapse">
                <thead style={{ backgroundColor: theme.colors.inputBg, color: theme.colors.text }}>
                    <tr>{header.map((h, i) => <th key={i} className="px-4 py-2 font-medium border-b whitespace-nowrap" style={{ borderColor: theme.colors.border }}>{renderInlineStyles(h, theme)}</th>)}</tr>
                </thead>
                <tbody className="divide-y" style={{ backgroundColor: theme.colors.bg, borderColor: theme.colors.border }}>
                    {body.map((row, i) => (
                        <tr key={i} className="transition-colors hover:opacity-90" style={{ borderColor: theme.colors.border }}>
                            {row.map((cell, j) => <td key={j} className="px-4 py-2 border-r last:border-0 whitespace-nowrap" style={{ borderColor: theme.colors.border }}>{renderInlineStyles(cell, theme)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableBlock;
