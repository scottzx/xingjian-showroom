import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from './state/useEditorStore';
import { carModels } from '../data/carModels';
import { useAuth } from '../contexts/AuthContext';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import { useChangeLanguage } from '../hooks/useChangeLanguage';

interface FreeToolbarProps {
  stageRef: React.RefObject<any>;
  onOpen3DPreview: () => void;
  onExport: () => void;
  onShowInfo: () => void;
}

export const FreeToolbar = ({ onOpen3DPreview, onExport, onShowInfo }: FreeToolbarProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toggleLanguage, getCurrentLabel } = useChangeLanguage();

  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const projectNameInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  // Editor store selectors
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const currentModelId = useEditorStore((state) => state.currentModelId);
  const projectName = useEditorStore((state) => state.projectName);
  const setProjectName = useEditorStore((state) => state.setProjectName);

  // Derived state
  const currentModel = carModels.find((m) => m.id === currentModelId) || carModels[0];
  const canUndo = useEditorStore((state) => state.historyIndex > 0);
  const canRedo = useEditorStore((state) => state.historyIndex < state.history.length - 1);

  const handleProjectNameClick = () => {
    setEditingName(projectName);
    setIsEditingProjectName(true);
    setTimeout(() => {
      projectNameInputRef.current?.focus();
      projectNameInputRef.current?.select();
    }, 0);
  };

  const handleProjectNameBlur = () => {
    const trimmedName = editingName.trim();
    if (trimmedName) {
      setProjectName(trimmedName);
    }
    setIsEditingProjectName(false);
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  };

  const handleProjectNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleProjectNameBlur();
    } else if (e.key === 'Escape') {
      setIsEditingProjectName(false);
    }
  };

  return (
    <div className="panel border-b-0 rounded-xl p-2 sm:p-3 shadow-lg relative z-[100]">
      <div className="flex items-center gap-2 sm:gap-3 min-h-[54px] overflow-x-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 border-r border-tesla-dark/50 pr-2 sm:pr-3 flex-shrink-0">
          <div
            className="h-6 sm:h-8 w-auto drop-shadow cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
            title="形见 · 图案工作台"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tesla-red to-red-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-palette w-5 h-5 text-white">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
              </svg>
            </div>
          </div>
          <span className="text-xs text-tesla-gray/50 hidden sm:inline">Pattern Studio</span>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 sm:gap-1.5 border-r border-tesla-dark/50 pr-2 sm:pr-3 flex-shrink-0">
          <Tooltip title={`${t('toolbar.undo')} (Ctrl+Z)`} placement="bottom" arrow>
            <span>
              <button
                onClick={undo}
                disabled={!canUndo}
                className="btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
            </span>
          </Tooltip>
          <Tooltip title={`${t('toolbar.redo')} (Ctrl+Y)`} placement="bottom" arrow>
            <span>
              <button
                onClick={redo}
                disabled={!canRedo}
                className="btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </span>
          </Tooltip>
        </div>

        {/* Project Info */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-tesla-gray flex-shrink min-w-0 overflow-hidden">
          {isEditingProjectName ? (
            <input
              ref={(el) => {
                if (el) projectNameInputRef.current = el;
              }}
              type="text"
              value={editingName}
              onChange={handleProjectNameChange}
              onBlur={handleProjectNameBlur}
              onKeyDown={handleProjectNameKeyDown}
              className="px-2 py-0.5 text-xs sm:text-sm font-medium text-tesla-light bg-tesla-black/80 border border-tesla-red/50 rounded outline-none focus:ring-1 focus:ring-tesla-red/50 max-w-[120px] sm:max-w-[200px]"
              autoFocus
            />
          ) : (
            <span
              className="text-tesla-light font-medium truncate cursor-pointer hover:text-white transition-colors flex-shrink-0"
              onClick={handleProjectNameClick}
              title={`${projectName} (click to edit)`}
            >
              {projectName}
            </span>
          )}
          <span className="text-tesla-dark hidden xl:inline">•</span>
          <span className="text-tesla-gray whitespace-nowrap hidden xl:inline">{currentModel.name}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
          {/* Info */}
          <Tooltip title={t('toolbar.installWrap')} placement="bottom" arrow>
            <button
              onClick={onShowInfo}
              className="btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </Tooltip>

          {/* Language Switcher */}
          <Tooltip title={getCurrentLabel() === '中' ? 'Switch to English' : '切换到中文'} placement="bottom" arrow>
            <button
              onClick={toggleLanguage}
              className="btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-xs"
            >
              {getCurrentLabel()}
            </button>
          </Tooltip>

          {/* 3D Preview */}
          <Tooltip title={t('toolbar.preview3d')} placement="bottom" arrow>
            <button
              onClick={onOpen3DPreview}
              className="btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="hidden sm:inline">{t('toolbar.preview3d')}</span>
            </button>
          </Tooltip>

          {/* Export */}
          <Tooltip title={t('toolbar.exportPng')} placement="bottom" arrow>
            <button
              onClick={onExport}
              className="btn-primary flex items-center gap-1 sm:gap-2 px-2 sm:px-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">{t('toolbar.exportPng')}</span>
            </button>
          </Tooltip>

          {/* Login indicator - only show if logged in */}
          {user && (
            <Tooltip title={user.email || 'Logged in'} placement="bottom" arrow>
              <div className="px-3 py-1.5 text-xs font-medium text-tesla-light bg-green-600/20 border border-green-500/30 rounded flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">{user.email?.slice(0, 1)}</span>
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
