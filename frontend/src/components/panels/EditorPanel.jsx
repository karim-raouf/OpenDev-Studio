import React from 'react';
import { X } from 'lucide-react';
import { CodeEditor } from '../editor';
import { getFileIcon } from '../../utils';

/**
 * Editor panel component with tabs and code editor
 * @param {Object} props
 * @param {Object} props.theme - Theme object
 * @param {Array} props.openFiles - Array of open file IDs
 * @param {string} props.activeFileId - Currently active file ID
 * @param {Function} props.setActiveFileId - Active file ID setter
 * @param {Object} props.activeFile - Currently active file object
 * @param {Function} props.findNodeById - Function to find node by ID
 * @param {Array} props.files - All file tree nodes
 * @param {Function} props.onFileContentChange - File content change handler
 * @param {Function} props.onCloseFile - File close handler
 * @param {React.RefObject} props.tabsContainerRef - Ref for tabs container
 */
const EditorPanel = ({
    theme,
    openFiles,
    activeFileId,
    setActiveFileId,
    activeFile,
    findNodeById,
    files,
    onFileContentChange,
    onCloseFile,
    tabsContainerRef
}) => {
    return (
        <div className="flex-1 flex flex-col min-w-0 relative rounded-2xl overflow-hidden shadow-sm border"
            style={{ backgroundColor: theme.colors.panelBg, borderColor: theme.colors.border }}>
            <div ref={tabsContainerRef} className="h-10 flex overflow-x-auto scrollbar-hide items-end border-b"
                style={{ backgroundColor: theme.colors.headerBg, borderColor: theme.colors.border }}>
                {openFiles.map(fileId => {
                    const file = findNodeById(files, fileId);
                    if (!file) return null;
                    const isActive = activeFileId === fileId;
                    return (
                        <div key={fileId} data-file-id={fileId} onClick={() => setActiveFileId(fileId)}
                            className={`flex items-center px-4 h-full text-xs min-w-fit mr-1 cursor-pointer select-none transition-all border-r ${isActive ? 'font-medium' : 'opacity-70 hover:opacity-100 hover:bg-white/5'}`}
                            style={{ backgroundColor: isActive ? theme.colors.tabActiveBg : 'transparent', color: isActive ? theme.colors.text : theme.colors.textMuted, borderColor: isActive ? theme.colors.border : 'transparent' }}>
                            <span className="mr-2 opacity-80">{getFileIcon(file.name)}</span> <span className="mr-3">{file.name}</span>
                            <div onClick={(e) => onCloseFile(e, fileId)} className="p-0.5 rounded-sm hover:bg-red-500/20 hover:text-red-400 ml-auto transition-colors"><X size={11} /></div>
                        </div>
                    );
                })}
            </div>
            <div className="flex-1 overflow-hidden relative">
                <CodeEditor file={activeFile} onChange={onFileContentChange} theme={theme} />
            </div>
        </div>
    );
};

export default EditorPanel;
