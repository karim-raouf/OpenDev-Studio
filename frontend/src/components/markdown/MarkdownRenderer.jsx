import React from 'react';
import { ChatCodeBlock } from '../ui';
import TextWithTableRenderer from './TextWithTableRenderer';

/**
 * Main markdown renderer that handles code blocks and text
 * @param {Object} props
 * @param {string} props.content - The markdown content to render
 * @param {Object} props.theme - Theme object
 */
const MarkdownRenderer = ({ content, theme }) => {
    if (typeof content !== 'string') return null;

    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
        parts.push({ type: 'code', lang: match[1], content: match[2] });
        lastIndex = codeBlockRegex.lastIndex;
    }
    if (lastIndex < content.length) parts.push({ type: 'text', content: content.slice(lastIndex) });

    return (
        <div className="text-sm space-y-1">
            {parts.map((part, idx) => {
                if (part.type === 'code') return <ChatCodeBlock key={idx} lang={part.lang} content={part.content} theme={theme} />;
                return <TextWithTableRenderer key={idx} content={part.content} theme={theme} />;
            })}
        </div>
    );
};

export default MarkdownRenderer;
