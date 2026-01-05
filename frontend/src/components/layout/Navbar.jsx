import React from 'react';
import { Menu, Search, X, Zap, Sun, Moon, Check } from 'lucide-react';
import { THEMES } from '../../constants';

/**
 * Top navigation bar component
 * @param {Object} props
 * @param {Object} props.theme - Theme object
 * @param {string} props.activeTheme - Current theme key
 * @param {Function} props.setActiveTheme - Theme setter
 * @param {boolean} props.showMainSidebar - Whether main sidebar is open
 * @param {Function} props.setShowMainSidebar - Main sidebar setter
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.setSearchTerm - Search term setter
 * @param {boolean} props.connected - WebSocket connection status
 * @param {boolean} props.showSettings - Whether settings dropdown is open
 * @param {Function} props.setShowSettings - Settings dropdown setter
 * @param {React.RefObject} props.settingsRef - Ref for settings dropdown
 */
const Navbar = ({
    theme,
    activeTheme,
    setActiveTheme,
    showMainSidebar,
    setShowMainSidebar,
    searchTerm,
    setSearchTerm,
    connected,
    showSettings,
    setShowSettings,
    settingsRef
}) => {
    const ThemeIcon = activeTheme === 'light' ? Sun : Moon;

    return (
        <nav className="h-12 border-b flex items-center justify-between px-4 flex-shrink-0 z-20 relative shadow-sm"
            style={{ backgroundColor: theme.colors.activityBar, borderColor: theme.colors.border }}>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setShowMainSidebar(!showMainSidebar)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors active:scale-95"
                    style={{ color: showMainSidebar ? theme.colors.accent : theme.colors.textMuted }}
                >
                    <Menu size={20} />
                </button>

                <span className="text-sm font-bold tracking-wide flex items-center gap-1.5 select-none">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">OpenDev</span>
                    <span className="text-gray-500 font-medium">Studio</span>
                </span>
            </div>

            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center rounded-lg px-3 py-1.5 w-1/3 min-w-[360px] border transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20"
                style={{ backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border }}>
                <Search size={16} style={{ color: theme.colors.textMuted }} className="mr-2.5" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search files..."
                    className="bg-transparent border-none outline-none text-xs w-full placeholder-opacity-50" style={{ color: theme.colors.text }} />
                {searchTerm && <X size={14} className="cursor-pointer opacity-50 hover:opacity-100" onClick={() => setSearchTerm('')} />}
            </div>

            <div className="flex items-center gap-5 relative">
                <Zap size={16} className={connected ? "text-green-500 drop-shadow-[0_0_3px_rgba(34,197,94,0.5)]" : "text-red-500"} />
                <div className="relative" ref={settingsRef}>
                    <ThemeIcon size={18} style={{ color: theme.colors.textMuted }} className="cursor-pointer hover:text-white transition-colors" onClick={() => setShowSettings(!showSettings)} />
                    {showSettings && (
                        <div className="absolute right-0 top-10 w-48 rounded-xl shadow-2xl border py-2 z-50 backdrop-blur-sm bg-opacity-95"
                            style={{ backgroundColor: theme.colors.panelBg, borderColor: theme.colors.border }}>
                            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider opacity-40">Select Theme</div>
                            {Object.entries(THEMES).map(([key, t]) => (
                                <button key={key} className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-blue-500/10 transition-colors"
                                    style={{ color: theme.colors.text }} onClick={() => { setActiveTheme(key); setShowSettings(false); }}>
                                    {t.name} {activeTheme === key && <Check size={14} style={{ color: theme.colors.accent }} />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
