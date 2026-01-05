import React from 'react';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';

/**
 * Collapsed sidebar component
 * @param {Object} props
 * @param {Function} props.onExpand - Handler to expand the sidebar
 * @param {React.Component} props.icon - Icon component to display
 * @param {string} props.side - 'left' or 'right'
 * @param {Object} props.theme - Theme object
 */
const CollapsedSidebar = ({ onExpand, icon: Icon, side, theme }) => (
    <div className="flex flex-col items-center py-4 gap-6 h-full w-full border-r border-l"
        style={{
            backgroundColor: theme.colors.activityBar,
            borderColor: theme.colors.border,
            borderRightWidth: side === 'left' ? 1 : 0,
            borderLeftWidth: side === 'right' ? 1 : 0
        }}>
        <button onClick={onExpand} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
            {side === 'left' ? <PanelLeftOpen size={20} /> : <PanelRightOpen size={20} />}
        </button>
        <div className="w-8 h-[1px] bg-gray-800"></div>
        <Icon size={24} color={theme.colors.accent} />
    </div>
);

export default CollapsedSidebar;
