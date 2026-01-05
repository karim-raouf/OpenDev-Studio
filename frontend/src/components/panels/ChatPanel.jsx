import React from 'react';
import { MessageSquare, MessageSquarePlus, History, PanelRightClose, X, Clock, Send, Square } from 'lucide-react';
import { CollapsedSidebar } from '../layout';
import { CustomSelect } from '../ui';
import { MarkdownRenderer } from '../markdown';
import { MOCK_HISTORY, MODE_OPTIONS, PROVIDER_OPTIONS } from '../../constants';

/**
 * Chat panel component
 * @param {Object} props
 * @param {Object} props.theme - Theme object
 * @param {boolean} props.isCollapsed - Whether panel is collapsed
 * @param {Function} props.setIsCollapsed - Collapse state setter
 * @param {number} props.width - Panel width
 * @param {boolean} props.isResizing - Whether currently resizing
 * @param {Array} props.messages - Chat messages array
 * @param {string} props.inputText - Current input text
 * @param {Function} props.setInputText - Input text setter
 * @param {string} props.chatMode - Current chat mode
 * @param {Function} props.setChatMode - Chat mode setter
 * @param {string} props.chatProvider - Current chat provider
 * @param {Function} props.setChatProvider - Chat provider setter
 * @param {boolean} props.isProcessing - Whether processing a request
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onStop - Stop handler
 * @param {Function} props.getPlaceholder - Placeholder text getter
 * @param {boolean} props.showHistory - Whether history is shown
 * @param {Function} props.setShowHistory - History visibility setter
 * @param {React.RefObject} props.textareaRef - Ref for textarea
 * @param {React.RefObject} props.messagesEndRef - Ref for messages end
 */
const ChatPanel = ({
    theme,
    isCollapsed,
    setIsCollapsed,
    width,
    isResizing,
    messages,
    inputText,
    setInputText,
    chatMode,
    setChatMode,
    chatProvider,
    setChatProvider,
    isProcessing,
    onSubmit,
    onStop,
    getPlaceholder,
    showHistory,
    setShowHistory,
    textareaRef,
    messagesEndRef,
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
                    <CollapsedSidebar onExpand={() => setIsCollapsed(false)} icon={MessageSquare} side="right" theme={theme} />
                ) : (
                    <>
                        <div className="h-10 px-4 flex items-center justify-between text-xs font-bold uppercase tracking-wider border-b"
                            style={{ borderColor: theme.colors.border, color: theme.colors.textMuted }}>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full animate-pulse bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                                <span>Agent Chat</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="New Chat"><MessageSquarePlus size={15} /></button>
                                <button className={`p-1.5 rounded hover:bg-white/10 transition-colors ${showHistory ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 hover:text-white'}`} title="History" onClick={() => setShowHistory(!showHistory)}><History size={15} /></button>
                                <button onClick={() => setIsCollapsed(true)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><PanelRightClose size={15} /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6 relative">
                            {/* History Overlay */}
                            {showHistory && (
                                <div className="absolute inset-0 z-20 flex flex-col animate-in slide-in-from-right duration-200" style={{ backgroundColor: theme.colors.panelBg }}>
                                    <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: theme.colors.border }}>
                                        <span className="text-xs font-bold uppercase tracking-wider">Chat History</span>
                                        <button onClick={() => setShowHistory(false)} className="hover:text-white text-gray-500"><X size={14} /></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                        {MOCK_HISTORY.map(h => (
                                            <div key={h.id} className="p-3 rounded-lg border hover:border-blue-500/50 cursor-pointer transition-all group" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.inputBg }}>
                                                <div className="text-sm font-medium mb-1 group-hover:text-blue-400">{h.title}</div>
                                                <div className="flex items-center gap-1 text-[10px] text-gray-500"><Clock size={10} /><span>{h.date}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start w-full'}`}>
                                    <div className={`${msg.role === 'user' ? 'w-full rounded-lg px-2.5 py-1.5 border shadow-sm' : 'w-full'}`}
                                        style={{
                                            backgroundColor: msg.role === 'user' ? theme.colors.accent : 'transparent',
                                            color: msg.role === 'user' ? '#fff' : theme.colors.text,
                                            borderColor: msg.role === 'user' ? 'transparent' : 'transparent'
                                        }}>
                                        <MarkdownRenderer content={msg.text} theme={theme} />
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t" style={{ borderColor: theme.colors.border }}>
                            <form onSubmit={onSubmit} className="flex flex-col gap-3 w-full">
                                <textarea
                                    ref={textareaRef}
                                    rows={1}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(e); } }}
                                    placeholder={getPlaceholder()}
                                    disabled={isProcessing}
                                    className="w-full rounded-xl py-2.5 px-3 text-sm focus:outline-none shadow-sm focus:shadow-md disabled:opacity-50 resize-none overflow-y-auto min-h-[40px] max-h-[200px] transition-all bg-transparent border-none ring-0 focus:ring-0"
                                    style={{ color: theme.colors.text }} />

                                <div className="flex justify-between items-center w-full">
                                    <div className="flex gap-2">
                                        <CustomSelect
                                            value={chatMode}
                                            onChange={(e) => setChatMode(e.target.value)}
                                            options={MODE_OPTIONS}
                                            disabled={isProcessing}
                                            width="w-20"
                                            theme={theme}
                                        />
                                        <CustomSelect
                                            value={chatProvider}
                                            onChange={(e) => setChatProvider(e.target.value)}
                                            options={PROVIDER_OPTIONS}
                                            disabled={isProcessing}
                                            width="w-28"
                                            theme={theme}
                                        />
                                    </div>

                                    <div>
                                        {isProcessing ? (
                                            <button type="button" onClick={onStop} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all active:scale-95" title="Stop"><Square size={18} fill="currentColor" /></button>
                                        ) : (
                                            <button type="submit" className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-500/20"><Send size={18} /></button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatPanel;
