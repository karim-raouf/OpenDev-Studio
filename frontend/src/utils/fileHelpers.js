/**
 * Update file content in a nested file tree structure
 * @param {Array} nodes - The file tree nodes
 * @param {string} fileId - The ID of the file to update
 * @param {string} newContent - The new content for the file
 * @returns {Array} Updated file tree nodes
 */
export const updateFileContent = (nodes, fileId, newContent) => {
    return nodes.map(node => {
        if (node.id === fileId) return { ...node, content: newContent };
        if (node.children) return { ...node, children: updateFileContent(node.children, fileId, newContent) };
        return node;
    });
};

/**
 * Filter nodes by search term
 * @param {Array} nodes - The file tree nodes
 * @param {string} term - The search term
 * @returns {Array} Filtered nodes
 */
export const filterNodes = (nodes, term) => {
    return nodes.reduce((acc, node) => {
        if (node.type === 'file' && node.name.toLowerCase().includes(term.toLowerCase())) {
            acc.push(node);
        } else if (node.type === 'folder') {
            const filteredChildren = filterNodes(node.children || [], term);
            if (filteredChildren.length > 0 || node.name.toLowerCase().includes(term.toLowerCase())) {
                acc.push({ ...node, children: filteredChildren, isOpen: true });
            }
        }
        return acc;
    }, []);
};

/**
 * Find a node by its ID in the file tree
 * @param {Array} nodes - The file tree nodes
 * @param {string} id - The ID to search for
 * @returns {Object|null} The found node or null
 */
export const findNodeById = (nodes, id) => {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findNodeById(node.children, id);
            if (found) return found;
        }
    }
    return null;
};

/**
 * Merge content from old tree to new tree
 * @param {Array} oldNodes - The old file tree nodes
 * @param {Array} newNodes - The new file tree nodes
 * @returns {Array} Merged file tree nodes
 */
export const mergeTreeContent = (oldNodes, newNodes) => {
    const contentMap = new Map();

    const traverseOld = (nodes) => {
        nodes.forEach(node => {
            if (node.type === 'file' && node.content !== undefined) {
                contentMap.set(node.id, node.content);
            }
            if (node.children) traverseOld(node.children);
        });
    };
    traverseOld(oldNodes);

    const applyContent = (nodes) => {
        return nodes.map(node => {
            const newNode = { ...node };
            if (contentMap.has(node.id)) {
                newNode.content = contentMap.get(node.id);
            }
            if (newNode.children) {
                newNode.children = applyContent(newNode.children);
            }
            return newNode;
        });
    };

    return applyContent(newNodes);
};

/**
 * Flatten file tree into a Map of file nodes
 * @param {Array} nodes - The file tree nodes
 * @param {Map} map - The Map to populate (optional)
 * @returns {Map} Map of file ID to file node
 */
export const flattenFiles = (nodes, map = new Map()) => {
    nodes.forEach(node => {
        if (node.type === 'file') map.set(node.id, node);
        if (node.children) flattenFiles(node.children, map);
    });
    return map;
};
