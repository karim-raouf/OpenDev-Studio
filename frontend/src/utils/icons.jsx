import React from 'react';
import { File, FileCode, FileJson, FileText, FileImage } from 'lucide-react';

/**
 * Get the appropriate icon for a file based on its extension
 * @param {string} filename - The name of the file
 * @returns {JSX.Element} The icon component
 */
export const getFileIcon = (filename) => {
    if (!filename) return <File size={15} className="text-gray-500" />;
    const ext = filename.split('.').pop().toLowerCase();

    switch (ext) {
        case 'js': case 'jsx': case 'ts': case 'tsx':
            return <FileCode size={15} className="text-yellow-400" />;
        case 'html': case 'htm':
            return <FileCode size={15} className="text-orange-500" />;
        case 'css': case 'scss': case 'sass':
            return <FileCode size={15} className="text-blue-400" />;
        case 'py':
            return <FileCode size={15} className="text-blue-300" />;
        case 'json':
            return <FileJson size={15} className="text-yellow-200" />;
        case 'md':
            return <FileText size={15} className="text-gray-400" />;
        case 'png': case 'jpg': case 'svg':
            return <FileImage size={15} className="text-purple-400" />;
        default:
            return <File size={15} className="text-gray-500" />;
    }
};
