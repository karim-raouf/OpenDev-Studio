import React from 'react';
import { Settings, X, ArrowLeft, Cpu, Wrench, Check } from 'lucide-react';
import { PROVIDER_OPTIONS } from '../../constants';

/**
 * Settings sidebar overlay component
 * @param {Object} props
 * @param {Object} props.theme - Theme object
 * @param {boolean} props.show - Whether to show the sidebar
 * @param {Function} props.onClose - Close handler
 * @param {string} props.sidebarView - Current view ('menu', 'models', 'tools')
 * @param {Function} props.setSidebarView - View setter
 * @param {string} props.activeCredTab - Active credentials tab
 * @param {Function} props.setActiveCredTab - Credentials tab setter
 * @param {Object} props.apiKeys - API keys object
 * @param {Function} props.handleKeyChange - Key change handler
 */
const SettingsSidebar = ({
    theme,
    show,
    onClose,
    sidebarView,
    setSidebarView,
    activeCredTab,
    setActiveCredTab,
    apiKeys,
    handleKeyChange
}) => {
    if (!show) return null;

    const renderSidebarContent = () => {
        if (sidebarView === 'menu') {
            return (
                <div className="p-4 space-y-4">
                    <button onClick={() => setSidebarView('models')}
                        className="w-full p-4 rounded-xl border flex flex-col gap-2 transition-all hover:border-blue-500 hover:bg-blue-500/5 group"
                        style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.inputBg }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20"><Cpu size={20} /></div>
                            <div className="text-left">
                                <div className="text-sm font-bold">Model Credentials</div>
                                <div className="text-[10px] opacity-60">Manage API keys for LLM providers</div>
                            </div>
                        </div>
                    </button>

                    <button onClick={() => setSidebarView('tools')}
                        className="w-full p-4 rounded-xl border flex flex-col gap-2 transition-all hover:border-yellow-500 hover:bg-yellow-500/5 group"
                        style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.inputBg }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20"><Wrench size={20} /></div>
                            <div className="text-left">
                                <div className="text-sm font-bold">Tool Credentials</div>
                                <div className="text-[10px] opacity-60">Configure MCP tools & services</div>
                            </div>
                        </div>
                    </button>
                </div>
            );
        }

        if (sidebarView === 'models') {
            return (
                <div className="flex flex-1 overflow-hidden flex-col">
                    <div className="p-2 border-b flex items-center gap-2" style={{ borderColor: theme.colors.border }}>
                        <button onClick={() => setSidebarView('menu')} className="p-1.5 rounded hover:bg-white/10"><ArrowLeft size={14} /></button>
                        <span className="text-xs font-bold uppercase tracking-wider">Models</span>
                    </div>
                    <div className="flex flex-1 overflow-hidden">
                        {/* Provider List */}
                        <div className="w-32 border-r flex flex-col overflow-y-auto py-2" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.activityBar }}>
                            {PROVIDER_OPTIONS.map(provider => (
                                <button key={provider.value} onClick={() => setActiveCredTab(provider.value)}
                                    className={`text-xs py-3 px-2 text-center border-l-2 transition-all ${activeCredTab === provider.value ? 'border-blue-500 bg-blue-500/10 text-white font-medium' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
                                    {provider.label}
                                </button>
                            ))}
                        </div>
                        {/* Input */}
                        <div className="flex-1 p-4 overflow-y-auto">
                            <div className="mb-4">
                                <h4 className="text-sm font-medium mb-1">{PROVIDER_OPTIONS.find(p => p.value === activeCredTab)?.label} Key</h4>
                                <p className="text-[10px] text-gray-500 mb-3">Enter secure key.</p>
                                <div className="relative">
                                    <input type="password" value={apiKeys[activeCredTab] || ''} onChange={(e) => handleKeyChange(activeCredTab, e.target.value)} placeholder={`sk-...`}
                                        className="w-full text-xs p-2.5 rounded-md border focus:border-blue-500 outline-none transition-colors font-mono tracking-wide"
                                        style={{ backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }} />
                                    <div className="absolute right-2 top-2.5 text-green-500 opacity-50 pointer-events-none">{apiKeys[activeCredTab] ? <Check size={14} /> : null}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return <div className="p-4 text-center opacity-50 text-xs mt-10">Tools coming soon... <button onClick={() => setSidebarView('menu')} className="block mx-auto mt-4 text-blue-400 hover:underline">Go Back</button></div>;
    };

    return (
        <>
            <div
                className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            ></div>
            <div className="absolute top-0 left-0 h-full w-[600px] z-50 border-r shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
                style={{ backgroundColor: theme.colors.panelBg, borderColor: theme.colors.border }}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.colors.border }}>
                    <div className="flex items-center gap-2">
                        <Settings size={18} className="text-blue-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wider">Settings</h3>
                    </div>
                    <button onClick={onClose}><X size={16} className="opacity-50 hover:opacity-100" /></button>
                </div>
                {renderSidebarContent()}
            </div>
        </>
    );
};

export default SettingsSidebar;
