import React from 'react';
import { Folder, FilePlus, FolderPlus, Trash2, PanelLeftClose } from 'lucide-react';
import { CollapsedSidebar } from '../layout';
import { FileTreeItem } from '../explorer';

/**
 * Left explorer panel component
 * @param {Object} props
 * @param {Object} props.theme - Theme object
 * @param {boolean} props.isCollapsed - Whether panel is collapsed
 * @param {Function} props.setIsCollapsed - Collapse state setter
 * @param {number} props.width - Panel width
 * @param {boolean} props.isResizing - Whether currently resizing
 * @param {Array} props.files - Displayed file tree nodes
 * @param {string} props.selectedId - Currently selected node ID
 * @param {Function} props.onSelectNode - Node selection handler
 * @param {Object} props.newItemInput - New item input state
 * @param {Function} props.setNewItemInput - New item input setter
 * @param {string} props.newItemName - New item name
 * @param {Function} props.setNewItemName - New item name setter
 * @param {Function} props.onCreateItem - Create item handler
 * @param {Function} props.onDeleteItem - Delete item handler
 */
const ExplorerPanel = ({
    theme,
    isCollapsed,
    setIsCollapsed,
    width,
    isResizing,
    files,
    selectedId,
    onSelectNode,
    newItemInput,
    setNewItemInput,
    newItemName,
    setNewItemName,
    onCreateItem,
    onDeleteItem,
    COLLAPSED_WIDTH = 50
}) => {
    return (
        <div
            style={{
                width: isCollapsed ? COLLAPSED_WIDTH : width,
                transition: isResizing ? 'none' : 'width 0.2s ease-out',
                backgroundColor: theme.colors.panelBg,
                borderColor: theme.colors.border
            }}
            className="flex-shrink-0 flex flex-col relative rounded-2xl overflow-hidden shadow-sm border"
        >
            <div className="absolute inset-0 flex flex-col" style={{ backgroundColor: theme.colors.panelBg }}>
                {isCollapsed ? (
                    <CollapsedSidebar onExpand={() => setIsCollapsed(false)} icon={Folder} side="left" theme={theme} />
                ) : (
                    <>
                        <div className="h-10 px-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider"
                            style={{ backgroundColor: theme.colors.activityBar, color: theme.colors.textMuted }}>
                            <span className="truncate min-w-0 tracking-widest">Explorer</span>
                            <div className="flex gap-3 flex-shrink-0 ml-auto items-center">
                                <FilePlus size={15} className="cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setNewItemInput({ type: 'file' })} title="New File" />
                                <FolderPlus size={15} className="cursor-pointer hover:text-yellow-400 transition-colors" onClick={() => setNewItemInput({ type: 'folder' })} title="New Folder" />
                                <Trash2 size={15} className={`cursor-pointer transition-colors ${selectedId ? 'hover:text-red-400' : 'opacity-20 cursor-not-allowed'}`} onClick={onDeleteItem} title="Delete" />
                                <div className="w-[1px] h-3 bg-gray-700 mx-1"></div>
                                <button onClick={() => setIsCollapsed(true)} className="opacity-50 hover:opacity-100 transition-opacity"><PanelLeftClose size={15} /></button>
                            </div>
                        </div>

                        {newItemInput && (
                            <div className="p-3 mx-2 mt-2 rounded-lg border bg-opacity-20" style={{ borderColor: theme.colors.accent, backgroundColor: `${theme.colors.accent}10` }}>
                                <div className="text-[10px] mb-1.5 font-semibold opacity-70">New {newItemInput.type} name:</div>
                                <input autoFocus type="text" className="w-full text-xs p-2 rounded bg-[#00000040] text-white border border-gray-700 focus:border-blue-500 outline-none"
                                    value={newItemName} onChange={e => setNewItemName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') onCreateItem(); if (e.key === 'Escape') setNewItemInput(null); }}
                                    onBlur={() => setTimeout(() => setNewItemInput(null), 200)} />
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto py-3">
                            {files.map(item => (
                                <FileTreeItem key={item.id} item={item} level={0} onSelectNode={onSelectNode} selectedId={selectedId} colors={theme.colors} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ExplorerPanel;
