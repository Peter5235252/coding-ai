import React from 'react';
import { PanelId } from '../types';
import { SurfacePalette } from '../utils/themeData';
import { GripVertical, Maximize2, Minimize2, ArrowLeftRight, EyeOff } from 'lucide-react';

interface PanelControlsProps {
  panelId: PanelId;
  surface: SurfacePalette;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  onCyclePosition?: () => void;
  onHidePanel?: () => void;
}

export const PanelControls: React.FC<PanelControlsProps> = ({
  surface,
  isMaximized = false,
  onToggleMaximize,
  onCyclePosition,
  onHidePanel,
}) => {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {onCyclePosition && (
        <button
          type="button"
          onClick={onCyclePosition}
          title="Move or swap panel placement"
          className={`p-1.5 rounded-lg ${surface.textSubtle} ${surface.hoverBg} group`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
        </button>
      )}
      {onToggleMaximize && (
        <button
          type="button"
          onClick={onToggleMaximize}
          title={isMaximized ? 'Restore panel size' : 'Expand panel'}
          className={`p-1.5 rounded-lg ${surface.textSubtle} ${surface.hoverBg} group`}
        >
          {isMaximized ? (
            <Minimize2 className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
          )}
        </button>
      )}
      {onHidePanel && (
        <button
          type="button"
          onClick={onHidePanel}
          title="Hide panel (restore anytime)"
          className={`p-1.5 rounded-lg ${surface.textSubtle} ${surface.hoverBg} group`}
        >
          <EyeOff className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
        </button>
      )}
      <span
        className={`p-1 ${surface.textSubtle} cursor-grab active:cursor-grabbing hidden sm:inline-flex transition-transform duration-200 hover:scale-110`}
        title="Drag header to swap panel positions"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </span>
    </div>
  );
};
