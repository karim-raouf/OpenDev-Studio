import React, { useState, useEffect } from 'react';
import { Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { getFileIcon } from '../../utils';

/**
 * File tree item component (recursive)
 * @param {Object} props
 * @param {Object} props.item - The file/folder node
 * @param {number} props.level - Nesting level
 * @param {Function} props.onSelectNode - Node selection handler
 * @param {string} props.selectedId - Currently selected node ID
 * @param {Object} props.colors - Theme colors object
 */
const FileTreeItem = ({ item, level, onSelectNode, selectedId, colors }) => {
    const [isOpen, setIsOpen] = useState(item.isOpen || false);

    useEffect(() => { setIsOpen(item.isOpen); }, [item.isOpen]);

    useEffect(() => {
        if (!item.children) return;
        const hasSelectedChild = (node) => {
            if (node.id === selectedId) return true;
            return node.children ? node.children.some(hasSelectedChild) : false;
        };
        if (hasSelectedChild(item) && item.id !== selectedId) {
            setIsOpen(true);
        }
    }, [selectedId, item]);

    const handleClick = (e) => {
        e.stopPropagation();
        onSelectNode(item);
        if (item.type === 'folder') setIsOpen(!isOpen);
    };

    const isSelected = selectedId === item.id;

    return (
        <div className="select-none">
            <div
                className={`flex items-center py-1.5 px-2 mx-2 rounded-md cursor-pointer transition-all duration-150 group`}
                style={{
                    paddingLeft: `${level * 12 + 8}px`,
                    backgroundColor: isSelected ? colors.hover : 'transparent',
                    color: isSelected ? colors.text : colors.textMuted,
                }}
                onClick={handleClick}
            >
                <span className="mr-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                    {item.type === 'folder' && (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                </span>
                <span className="mr-2">
                    {item.type === 'folder' ? <Folder size={15} className="text-amber-500" /> : getFileIcon(item.name)}
                </span>
                <span className={`text-sm truncate font-medium ${isSelected ? 'text-blue-400' : ''}`}>{item.name}</span>
            </div>
            {item.type === 'folder' && isOpen && item.children && (
                <div>
                    {item.children.map(child => (
                        <FileTreeItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            onSelectNode={onSelectNode}
                            selectedId={selectedId}
                            colors={colors}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileTreeItem;
