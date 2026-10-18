import { useRef, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from './state/useEditorStore';
import { exportPng } from '../utils/exportPng';
import { carModels } from '../data/carModels';
import { loadProjectFromFile, getProjectFileAccept } from '../utils/projectFile';
import { calculateImageScale } from '../utils/image';
import heic2any from 'heic2any';
import { InfoDialog } from './components/InfoDialog';
import { OpenProjectDialog } from './components/OpenProjectDialog';
import { FeatureDevelopmentDialog } from './components/FeatureDevelopmentDialog';
import { SaveDialog } from './components/SaveDialog';
import { UnsavedChangesDialog } from './components/UnsavedChangesDialog';
import { ProfileMenu } from '../components/ProfileMenu';
import { useAuth } from '../contexts/AuthContext';
import { LoginDialog } from '../components/LoginDialog';
import type { Stage as StageType } from 'konva/lib/Stage';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import { useChangeLanguage } from '../hooks/useChangeLanguage';

interface ToolbarProps {
  stageRef: React.RefObject<StageType | null>;
  onOpen3DPreview: () => void;
}

export const Toolbar = ({ stageRef, onOpen3DPreview }: ToolbarProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toggleLanguage, getCurrentLabel } = useChangeLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const projectNameInputRef = useRef<HTMLInputElement>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [isOpenProjectDialogOpen, setIsOpenProjectDialogOpen] = useState(false);
  const [isFeatureDevelopmentDialogOpen, setIsFeatureDevelopmentDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'open' | null>(null);
  const [pendingSaveCallback, setPendingSaveCallback] = useState<(() => void) | null>(null);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingName, setEditingName] = useState('');
  const { user } = useAuth();

  // Horizontal scroll drag state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Use selective selectors to prevent unnecessary re-renders
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const currentModelId = useEditorStore((state) => state.currentModelId);
  const addLayer = useEditorStore((state) => state.addLayer);
  const isDirty = useEditorStore((state) => state.isDirty);
  const projectName = useEditorStore((state) => state.projectName);
  const setProjectName = useEditorStore((state) => state.setProjectName);
  const loadProject = useEditorStore((state) => state.loadProject);

  // Derived state with memoization
  const currentModel = useMemo(
    () => carModels.find((m) => m.id === currentModelId) || carModels[0],
    [currentModelId]
  );
  const canUndo = useEditorStore((state) => state.historyIndex > 0);
  const canRedo = useEditorStore((state) => state.historyIndex < state.history.length - 1);
  const isModelYLongRange = currentModelId === 'modely-l';

  // Generate export filename from project name
  const getExportFilename = () => {
    const sanitizedName = projectName
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
    return `${sanitizedName}_${currentModel.folderName}.png`;
  };

  const handleExport = () => {
    if (stageRef.current) {
      exportPng(stageRef.current, getExportFilename());
    }
  };

  // Project name editing handlers
  const handleProjectNameClick = () => {
    setEditingName(projectName);
    setIsEditingProjectName(true);
    // Focus the input after state update
    setTimeout(() => {
      projectNameInputRef.current?.focus();
      projectNameInputRef.current?.select();
    }, 0);
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  };

  const handleProjectNameBlur = () => {
    const trimmedName = editingName.trim();
    if (trimmedName) {
      setProjectName(trimmedName);
    }
    setIsEditingProjectName(false);
  };

  const handleProjectNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleProjectNameBlur();
    } else if (e.key === 'Escape') {
      setIsEditingProjectName(false);
    }
  };

  // Handle Open Project button
  const handleOpenProject = () => {
    if (isDirty) {
      setPendingAction('open');
      setIsUnsavedChangesDialogOpen(true);
    } else {
      setIsOpenProjectDialogOpen(true);
    }
  };

  // Handle unsaved changes dialog actions
  const handleUnsavedSave = async () => {
    setIsUnsavedChangesDialogOpen(false);
    if (!user) {
      setIsLoginDialogOpen(true);
      setPendingSaveCallback(() => {
        setIsUnsavedChangesDialogOpen(true);
      });
      return;
    }
    setIsSaveDialogOpen(true);
    setPendingSaveCallback(() => {
      // After save completes, proceed with pending action
      if (pendingAction === 'open') {
        setIsOpenProjectDialogOpen(true);
      }
      setPendingAction(null);
    });
  };

  const handleUnsavedDiscard = () => {
    setIsUnsavedChangesDialogOpen(false);
    if (pendingAction === 'open') {
      setIsOpenProjectDialogOpen(true);
    }
    setPendingAction(null);
  };

  const handleUnsavedCancel = () => {
    setIsUnsavedChangesDialogOpen(false);
    setPendingAction(null);
  };

  // Handle Save Project
  const handleSaveProject = () => {
    // Check if user is authenticated
    if (!user) {
      setIsLoginDialogOpen(true);
      return;
    }
    
    // Show save dialog
    setIsSaveDialogOpen(true);
  };


  // Handle project file selection
  const handleProjectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const project = await loadProjectFromFile(file);
      await loadProject(project);
    } catch (error: any) {
      alert(error.message || 'Failed to load project file.');
    }

    // Reset input
    e.target.value = '';
  };

  // Handle info dialog
  const handleShowInstallInstructions = () => {
    setIsInfoDialogOpen(true);
  };

  // Horizontal scroll drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start drag if clicking directly on the container, not on buttons
    if (e.target !== e.currentTarget) return;
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Add global mouse move/up listeners for drag
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (scrollContainerRef.current) {
        const x = e.pageX - (scrollContainerRef.current.offsetLeft);
        const walk = (x - startX) * 1.5;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startX, scrollLeft]);

  // Handle image file selection (for adding image layers)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image or HEIC file
    const isHeicByExtension = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    const isHeicByType = file.type === 'image/heic' || file.type === 'image/heif' || file.type === 'image/heic-sequence';
    const isHeicFile = isHeicByExtension || isHeicByType;
    if (!file.type.startsWith('image/') && !isHeicFile) {
      alert('Please select an image file');
      return;
    }

    let src: string;

    if (isHeicFile) {
      try {
        // Convert HEIC to JPEG
        const result = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.9,
        });
        // Handle both single Blob and Blob[] cases
        const blob = Array.isArray(result) ? result[0] : result;
        // Convert blob to data URL to avoid cross-origin issues
        src = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Failed to convert HEIC file:', error);
        alert('Failed to convert HEIC image. Please try another format.');
        return;
      }
    } else {
      // Handle regular image files as before
      src = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // Create an image element to get dimensions
    const img = new Image();
    img.onload = () => {
      // Calculate scale to make long side ~300px
      const scale = calculateImageScale(img, 300);
      
      // Center the image on canvas (1024x1024)
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (1024 - scaledWidth) / 2;
      const y = (1024 - scaledHeight) / 2;
      
      // Add as a new image layer
      addLayer({
        type: 'image',
        name: file.name,
        src,
        image: img,
        visible: true,
        locked: false,
        opacity: 1,
        x,
        y,
        rotation: 0,
        scaleX: scale,
        scaleY: scale,
      });
    };
    img.src = src;

    // Reset input
    e.target.value = '';
  };

  return (
    <>
      <div className="panel border-b-0 rounded-xl p-2 sm:p-3 shadow-lg relative z-[100]">
        <div
          ref={scrollContainerRef}
          className={`flex items-center gap-2 sm:gap-3 min-h-[54px] overflow-x-auto toolbar-scroll ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 border-r border-tesla-dark/50 pr-2 sm:pr-3 flex-shrink-0">
          <div
            className="h-6 sm:h-8 w-auto drop-shadow cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/gallery')}
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
        </div>

        {/* File Operations */}
        <div className="flex items-center gap-1 border-r border-tesla-dark/50 pr-2 sm:pr-3 flex-shrink-0">
          <Tooltip title={t('toolbar.openProject')} placement="bottom" arrow>
            <button
              onClick={handleOpenProject}
              className="px-2 sm:px-3 py-1.5 text-xs font-medium text-tesla-light bg-tesla-black/70 rounded hover:bg-tesla-black transition-colors"
            >
              {t('toolbar.open')}
            </button>
          </Tooltip>
          <Tooltip title={t('toolbar.saveProject')} placement="bottom" arrow>
            <button
              onClick={handleSaveProject}
              className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                isDirty
                  ? 'text-white bg-tesla-red hover:bg-tesla-red/80'
                  : 'text-tesla-light bg-tesla-black/70 hover:bg-tesla-black'
              }`}
            >
              {t('toolbar.save')}
            </button>
          </Tooltip>
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
            aria-label="Upload image file"
            title="Upload image file"
          />
          <input
            ref={projectFileInputRef}
            type="file"
            accept={getProjectFileAccept()}
            onChange={handleProjectFileChange}
            className="hidden"
            aria-label="Upload project file"
            title="Upload project file"
          />
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
              ref={projectNameInputRef}
              type="text"
              value={editingName}
              onChange={handleProjectNameChange}
              onBlur={handleProjectNameBlur}
              onKeyDown={handleProjectNameKeyDown}
              className="px-2 py-0.5 text-xs sm:text-sm font-medium text-tesla-light bg-tesla-black/80 border border-tesla-red/50 rounded outline-none focus:ring-1 focus:ring-tesla-red/50 max-w-[120px] sm:max-w-[200px]"
              autoFocus
              title="Project name"
              placeholder="Project name"
            />
          ) : (
            <span 
              className="text-tesla-light font-medium truncate cursor-pointer hover:text-white transition-colors flex-shrink-0"
              title={`${projectName} (click to edit)`}
              onClick={handleProjectNameClick}
            >
              {projectName}
            </span>
          )}
          <span className="text-tesla-dark hidden xl:inline">•</span>
          <span className="text-tesla-gray whitespace-nowrap hidden xl:inline">{currentModel.name}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
          <div className="relative z-[100]">
            <Tooltip title={t('toolbar.installWrap')} placement="bottom" arrow>
              <button
                onClick={handleShowInstallInstructions}
                className="btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </Tooltip>
          </div>

          {/* Language Switcher */}
          <Tooltip title={getCurrentLabel() === '中' ? 'Switch to English' : '切换到中文'} placement="bottom" arrow>
            <button
              onClick={toggleLanguage}
              className="btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 text-xs"
            >
              {getCurrentLabel()}
            </button>
          </Tooltip>

          <Tooltip
            title={isModelYLongRange ? t('toolbar.modelNotAvailable') : t('toolbar.preview3d')}
            placement="bottom"
            arrow
          >
            <span>
              <button
                onClick={onOpen3DPreview}
                disabled={isModelYLongRange}
                className={`btn-secondary flex items-center gap-1 sm:gap-2 px-2 sm:px-4 ${
                  isModelYLongRange ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="hidden sm:inline">{t('toolbar.preview3d')}</span>
              </button>
            </span>
          </Tooltip>
          <Tooltip title={t('toolbar.exportPng')} placement="bottom" arrow>
            <button
              onClick={handleExport}
              className="btn-primary flex items-center gap-1 sm:gap-2 px-2 sm:px-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">{t('toolbar.exportPng')}</span>
            </button>
          </Tooltip>
            {/* Profile Menu (far right) */}
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={isUnsavedChangesDialogOpen}
        onSave={handleUnsavedSave}
        onDiscard={handleUnsavedDiscard}
        onCancel={handleUnsavedCancel}
      />

      {/* Info Dialog */}
      <InfoDialog
        isOpen={isInfoDialogOpen}
        onClose={() => setIsInfoDialogOpen(false)}
      />

      {/* Open Project Dialog */}
      <OpenProjectDialog
        isOpen={isOpenProjectDialogOpen}
        onClose={() => setIsOpenProjectDialogOpen(false)}
        onProjectLoaded={() => {
          // Project loaded successfully, dialog will close itself
        }}
      />

      {/* Feature Development Dialog */}
      <FeatureDevelopmentDialog
        isOpen={isFeatureDevelopmentDialogOpen}
        onClose={() => setIsFeatureDevelopmentDialogOpen(false)}
      />

      {/* Save Dialog */}
      <SaveDialog
        isOpen={isSaveDialogOpen}
        onClose={() => {
          setIsSaveDialogOpen(false);
          if (pendingSaveCallback) {
            pendingSaveCallback();
            setPendingSaveCallback(null);
          }
        }}
        onSuccess={() => {
          setIsSaveDialogOpen(false);
          if (pendingSaveCallback) {
            pendingSaveCallback();
            setPendingSaveCallback(null);
          }
        }}
        stageRef={stageRef}
      />

      {/* Login Dialog */}
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        onSuccess={() => {
          setIsLoginDialogOpen(false);
          // After login, show save dialog
          setIsSaveDialogOpen(true);
        }}
      />
    </>
  );
};
