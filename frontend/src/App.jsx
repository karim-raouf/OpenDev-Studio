import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Constants
import { THEMES, PROVIDER_OPTIONS, INITIAL_MESSAGE } from './constants';

// Hooks
import { useDebounce } from './hooks';

// Utils
import { updateFileContent, filterNodes, findNodeById, mergeTreeContent, flattenFiles } from './utils';

// Components
import { Navbar, ExplorerPanel, EditorPanel, ChatPanel, SettingsSidebar } from './components';

// --- Constants ---
const API_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws";
const COLLAPSED_WIDTH = 50;

export default function AgenticIDE() {
  // File state
  const [files, setFiles] = useState([]);
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // UI state
  const [activeTheme, setActiveTheme] = useState('dark');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [connected, setConnected] = useState(false);
  const [newItemInput, setNewItemInput] = useState(null);
  const [newItemName, setNewItemName] = useState("");
  const [showMainSidebar, setShowMainSidebar] = useState(false);

  // API Key Management
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('opendev_api_keys');
    return saved ? JSON.parse(saved) : {};
  });
  const [sidebarView, setSidebarView] = useState('menu');
  const [activeCredTab, setActiveCredTab] = useState(PROVIDER_OPTIONS[0].value);

  useEffect(() => {
    localStorage.setItem('opendev_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  const handleKeyChange = (provider, value) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
  };

  // Panel state
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(450);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const isDragging = useRef(null);
  const settingsRef = useRef(null);
  const wsRef = useRef(null);
  const textareaRef = useRef(null);
  const tabsContainerRef = useRef(null);
  const activeFileIdRef = useRef(activeFileId);
  const fileToSaveRef = useRef(null);
  const filesRef = useRef(files);
  const openFilesRef = useRef(openFiles);
  const messagesEndRef = useRef(null);

  useEffect(() => { activeFileIdRef.current = activeFileId; }, [activeFileId]);
  useEffect(() => { filesRef.current = files; }, [files]);
  useEffect(() => { openFilesRef.current = openFiles; }, [openFiles]);

  useEffect(() => {
    if (activeFileId) {
      setSelectedId(activeFileId);
    }
  }, [activeFileId]);

  // Chat state
  const [messages, setMessages] = useState([{ id: 1, role: 'agent', text: INITIAL_MESSAGE }]);
  const [inputText, setInputText] = useState("");
  const [chatMode, setChatMode] = useState("Ask");
  const [chatProvider, setChatProvider] = useState("groq");
  const [isProcessing, setIsProcessing] = useState(false);

  const theme = THEMES[activeTheme] || THEMES.dark;

  // Memoized values
  const displayedFiles = useMemo(() => searchTerm ? filterNodes(files, searchTerm) : files, [files, searchTerm]);
  const activeFile = useMemo(() => activeFileId ? findNodeById(files, activeFileId) : null, [files, activeFileId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Auto-Scroll Tabs
  useEffect(() => {
    if (activeFileId && tabsContainerRef.current) {
      const activeTab = tabsContainerRef.current.querySelector(`[data-file-id="${activeFileId}"]`);
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeFileId, openFiles]);

  // Input Resizing
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      const scrollHeight = textareaRef.current.scrollHeight;
      if (scrollHeight > 40) {
        textareaRef.current.style.height = Math.min(scrollHeight, 128) + 'px';
      }
    }
  }, [inputText]);

  const getPlaceholder = () => {
    if (isProcessing) return "Agent working...";
    switch (chatMode) {
      case "Edit": return "Edit or refactor a selected code...";
      case "Agent": return "Describe what you want to build next...";
      default: return "Explore and understand your code...";
    }
  };

  // Debounced file save
  const [fileToSave, setFileToSave] = useState(null);
  const debouncedSaveData = useDebounce(fileToSave, 500);
  useEffect(() => { fileToSaveRef.current = fileToSave; }, [fileToSave]);

  useEffect(() => {
    if (debouncedSaveData) {
      fetch(`${API_URL}/files/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: debouncedSaveData.id, content: debouncedSaveData.content })
      }).then(() => { fileToSaveRef.current = null; }).catch(err => console.error("Save failed", err));
    }
  }, [debouncedSaveData]);

  // WebSocket connection
  useEffect(() => {
    const connectWs = () => {
      wsRef.current = new WebSocket(WS_URL);
      wsRef.current.onopen = () => { setConnected(true); };
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "system_event" && data.event === "file_change") {
            fetchFileTree();
            const filesToRefresh = openFilesRef.current;
            const editingId = fileToSaveRef.current?.id;
            filesToRefresh.forEach(id => {
              if (id !== editingId) fetchFileContent(id);
            });
          } else if (["agent_response", "agent_chunk", "agent_error"].includes(data.type)) {
            if (data.type === "agent_chunk") {
              setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                const newText = String(data.text || '');
                if (lastMsg.role === 'agent' && lastMsg.isStreaming) return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + newText }];
                return [...prev, { id: Date.now(), role: 'agent', text: newText, isStreaming: true }];
              });
            } else {
              setMessages(prev => [...prev, { id: Date.now(), role: 'agent', text: String(data.text || '') }]);
              setIsProcessing(false);
            }
          }
        } catch (e) { console.error("WS Error", e); }
      };
      wsRef.current.onclose = () => { setConnected(false); setTimeout(connectWs, 3000); };
    };
    connectWs();
    fetchFileTree();
    return () => wsRef.current?.close();
  }, []);

  const fetchFileTree = async () => {
    try {
      const res = await fetch(`${API_URL}/files`);
      const newTree = await res.json();

      if (newTree && !newTree.error) {
        setFiles(prevFiles => {
          const prevMap = flattenFiles(prevFiles);
          const newMap = flattenFiles(newTree);

          if (prevFiles.length > 0) {
            const newFileIds = [];
            for (const [id, node] of newMap) {
              if (!prevMap.has(id) && node.type === 'file') {
                newFileIds.push(id);
              }
            }

            if (newFileIds.length > 0) {
              setTimeout(() => {
                setOpenFiles(prev => {
                  const updated = [...prev];
                  newFileIds.forEach(id => {
                    if (!updated.includes(id)) updated.push(id);
                  });
                  return updated;
                });

                const lastNewId = newFileIds[newFileIds.length - 1];
                setActiveFileId(lastNewId);
                fetchFileContent(lastNewId);
              }, 0);
            }
          } else {
            const activeId = activeFileIdRef.current;
            if (activeId && !fileToSaveRef.current && newMap.has(activeId)) {
              setTimeout(() => fetchFileContent(activeId), 0);
            }
          }

          return mergeTreeContent(prevFiles, newTree);
        });
      }
    } catch (e) { console.error(e); }
  };

  const fetchFileContent = async (fileId) => {
    try {
      const res = await fetch(`${API_URL}/files/content?path=${encodeURIComponent(fileId)}`);
      const data = await res.json();
      if (data.content !== undefined) {
        setFiles(prevFiles => {
          const updateNodeContent = (nodes) => nodes.map(node => {
            if (node.id === fileId) return { ...node, content: data.content };
            if (node.children) return { ...node, children: updateNodeContent(node.children) };
            return node;
          });
          return updateNodeContent(prevFiles);
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleCreateItem = async () => {
    if (!newItemName.trim()) { setNewItemInput(null); return; }
    let basePath = "";
    if (selectedId) {
      const node = findNodeById(files, selectedId);
      if (node) {
        if (node.type === 'folder') basePath = node.id;
        else {
          const isWin = node.id.includes('\\');
          const sep = isWin ? '\\' : '/';
          basePath = node.id.substring(0, node.id.lastIndexOf(sep));
        }
      }
    }
    let fullPath = newItemName;
    if (basePath) {
      const isWin = basePath.includes('\\');
      const sep = isWin ? '\\' : '/';
      fullPath = basePath + sep + newItemName;
    }
    try {
      await fetch(`${API_URL}/files/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath, type: newItemInput.type })
      });
      setNewItemInput(null);
      setNewItemName("");
    } catch (e) { console.error(e); }
  };

  const handleDeleteItem = async () => {
    if (!selectedId) { alert("Please select a file or folder to delete."); return; }
    const nodeToDelete = findNodeById(files, selectedId);
    const name = nodeToDelete ? nodeToDelete.name : selectedId;
    if (!confirm(`Are you sure you want to delete '${name}'?`)) return;
    try {
      await fetch(`${API_URL}/files/delete`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedId })
      });
      if (openFiles.includes(selectedId)) {
        setOpenFiles(prev => prev.filter(id => id !== selectedId));
        if (activeFileId === selectedId) setActiveFileId(null);
      }
      setSelectedId(null);
    } catch (e) { console.error(e); }
  };

  const handleNodeSelect = (node) => {
    setSelectedId(node.id);
    if (node.type === 'file') {
      if (!openFiles.includes(node.id)) setOpenFiles(prev => [...prev, node.id]);
      setActiveFileId(node.id);
      fetchFileContent(node.id);
    }
  };

  const handleFileContentChange = (fileId, newContent) => {
    setFiles(prev => updateFileContent(prev, fileId, newContent));
    setFileToSave({ id: fileId, content: newContent });
  };

  const handleCloseFile = (e, fileId) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter(id => id !== fileId);
    setOpenFiles(newOpenFiles);
    if (activeFileId === fileId) setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
  };

  const handleStopResponse = (e) => {
    e.preventDefault();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "stop" }));
      setIsProcessing(false);
      setMessages(p => [...p, { id: Date.now(), role: 'agent', text: "Stopping..." }]);
    }
  };

  const handleChatSubmit = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text: inputText };
    setMessages(p => [...p, userMsg]);
    setInputText("");
    setIsProcessing(true);
    if (textareaRef.current) textareaRef.current.style.height = '40px';
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat",
        message: userMsg.text,
        mode: chatMode,
        provider: chatProvider,
        apiKey: apiKeys[chatProvider.toLowerCase()] || ''
      }));
    } else {
      setMessages(p => [...p, { id: Date.now(), role: 'agent', text: "Error: WebSocket not connected." }]);
      setIsProcessing(false);
    }
  };

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalW = rect.width;
      const minCenterW = totalW * 0.25;

      if (isDragging.current === 'left' && !isLeftCollapsed) {
        const proposedLeft = e.clientX - rect.left;
        const maxLeft = totalW - (isRightCollapsed ? COLLAPSED_WIDTH : rightWidth) - minCenterW;
        setLeftWidth(Math.max(140, Math.min(proposedLeft, maxLeft)));
      } else if (isDragging.current === 'right' && !isRightCollapsed) {
        const proposedRight = rect.right - e.clientX;
        const maxRight = totalW - (isLeftCollapsed ? COLLAPSED_WIDTH : leftWidth) - minCenterW;
        setRightWidth(Math.max(totalW * 0.25, Math.min(proposedRight, maxRight)));
      }
    };
    const handleMouseUp = () => { isDragging.current = null; setIsResizing(false); document.body.style.cursor = 'default'; document.body.style.userSelect = 'auto'; };
    document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [leftWidth, rightWidth, isLeftCollapsed, isRightCollapsed]);

  // Global Style for Scrollbars
  const scrollbarStyle = `
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${theme.colors.hover}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${theme.colors.border}; }
  `;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden transition-colors duration-300 font-sans antialiased" style={{ backgroundColor: theme.colors.appBg, color: theme.colors.text }}>
      <style>{scrollbarStyle}</style>

      {/* Settings Sidebar */}
      <SettingsSidebar
        theme={theme}
        show={showMainSidebar}
        onClose={() => setShowMainSidebar(false)}
        sidebarView={sidebarView}
        setSidebarView={setSidebarView}
        activeCredTab={activeCredTab}
        setActiveCredTab={setActiveCredTab}
        apiKeys={apiKeys}
        handleKeyChange={handleKeyChange}
      />

      {/* Navbar */}
      <Navbar
        theme={theme}
        activeTheme={activeTheme}
        setActiveTheme={setActiveTheme}
        showMainSidebar={showMainSidebar}
        setShowMainSidebar={setShowMainSidebar}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        connected={connected}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        settingsRef={settingsRef}
      />

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden relative p-0.5 gap-0.5" ref={containerRef} style={{ backgroundColor: theme.colors.appBg }}>

        {/* Left Explorer Panel */}
        <ExplorerPanel
          theme={theme}
          isCollapsed={isLeftCollapsed}
          setIsCollapsed={setIsLeftCollapsed}
          width={leftWidth}
          isResizing={isResizing}
          files={displayedFiles}
          selectedId={selectedId}
          onSelectNode={handleNodeSelect}
          newItemInput={newItemInput}
          setNewItemInput={setNewItemInput}
          newItemName={newItemName}
          setNewItemName={setNewItemName}
          onCreateItem={handleCreateItem}
          onDeleteItem={handleDeleteItem}
          COLLAPSED_WIDTH={COLLAPSED_WIDTH}
        />

        {!isLeftCollapsed && <div className="w-2 cursor-col-resize z-30 flex-shrink-0 -ml-1 mr-1 relative hover:bg-blue-500/10 rounded-full transition-colors" onMouseDown={() => { isDragging.current = 'left'; setIsResizing(true); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }} />}

        {/* Editor Panel */}
        <EditorPanel
          theme={theme}
          openFiles={openFiles}
          activeFileId={activeFileId}
          setActiveFileId={setActiveFileId}
          activeFile={activeFile}
          findNodeById={findNodeById}
          files={files}
          onFileContentChange={handleFileContentChange}
          onCloseFile={handleCloseFile}
          tabsContainerRef={tabsContainerRef}
        />

        {!isRightCollapsed && <div className="w-2 cursor-col-resize z-30 flex-shrink-0 -mr-1 ml-1 relative hover:bg-blue-500/10 rounded-full transition-colors" onMouseDown={() => { isDragging.current = 'right'; setIsResizing(true); document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }} />}

        {/* Right Chat Panel */}
        <ChatPanel
          theme={theme}
          isCollapsed={isRightCollapsed}
          setIsCollapsed={setIsRightCollapsed}
          width={rightWidth}
          isResizing={isResizing}
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          chatMode={chatMode}
          setChatMode={setChatMode}
          chatProvider={chatProvider}
          setChatProvider={setChatProvider}
          isProcessing={isProcessing}
          onSubmit={handleChatSubmit}
          onStop={handleStopResponse}
          getPlaceholder={getPlaceholder}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          textareaRef={textareaRef}
          messagesEndRef={messagesEndRef}
          COLLAPSED_WIDTH={COLLAPSED_WIDTH}
        />

      </div>
    </div>
  );
}