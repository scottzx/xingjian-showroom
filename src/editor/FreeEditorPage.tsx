import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Stage as StageType } from 'konva/lib/Stage';
import { EditorCanvas } from './EditorCanvas';
import { ToolsPanel } from './components/ToolsPanel';
import { LayersPanel } from './LayersPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { EditorThreePreview } from '../viewer/EditorThreePreview';
import { NewProjectDialog } from './components/NewProjectDialog';
import { FreeToolbar } from './FreeToolbar';
import { useEditorStore } from './state/useEditorStore';
import { saveProjectToLocalStorage } from '../utils/localStorageProject';
import { InfoDialog } from './components/InfoDialog';
import { useAuth } from '../contexts/AuthContext';
import { carModels } from '../data/carModels';

/**
 * Free Editor Page - Public editor that works without login
 * Users can:
 * - Create and edit designs
 * - Auto-save to localStorage
 * - Export PNG
 *
 * Login required for:
 * - Cloud save
 * - Project history
 */
export const FreeEditorPage = () => {
  const navigate = useNavigate();
  const stageRef = useRef<StageType | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [show3DPreview, setShow3DPreview] = useState(false);
  const [manualZoom, setManualZoom] = useState(1);
  const [autoFitZoom, setAutoFitZoom] = useState(1);
  const [autoFit, setAutoFit] = useState(true);

  // Dialog states
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(true);
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  const { user } = useAuth();

  // Track previous user state to detect login
  const previousUserRef = useRef<typeof user | null>(null);

  // Auto-redirect to /editor when user logs in
  useEffect(() => {
    // Detect if user just logged in (was null, now has value)
    if (previousUserRef.current === null && user !== null) {
      console.log('[FreeEditor] User logged in, redirecting to /editor');
      navigate('/editor');
    }
    // Update ref
    previousUserRef.current = user;
  }, [user, navigate]);

  // Editor store
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const deleteLayer = useEditorStore((state) => state.deleteLayer);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const updateLayer = useEditorStore((state) => state.updateLayer);
  const layers = useEditorStore((state) => state.layers);
  const isDirty = useEditorStore((state) => state.isDirty);
  const getSerializedState = useEditorStore((state) => state.getSerializedState);

  const lastSavedHashRef = useRef<string>('');

  // Use auto-fit zoom when autoFit is true, otherwise use manual zoom
  const currentZoom = autoFit ? autoFitZoom : manualZoom;

  // Handle new project creation
  const handleCreateProject = () => {
    setShowNewProjectDialog(false);
  };

  // The shared Three.js preview is public, like the industry demonstrations.
  const handleOpen3DPreview = () => {
    setShow3DPreview(true);
  };

  // Handle export - no login required for free users
  const handleExport = () => {
    performExport();
  };

  const performExport = () => {
    if (!stageRef.current) return;

    const projectName = useEditorStore.getState().projectName;
    const currentModelId = useEditorStore.getState().currentModelId;
    const currentModel = carModels.find((m) => m.id === currentModelId) || carModels[0];

    const sanitizedName = projectName
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
    const filename = `${sanitizedName}_${currentModel.folderName}.png`;

    // Import export function
    import('../utils/exportPng').then(({ exportPng }) => {
      exportPng(stageRef.current, filename);
    });
  };

  // Auto-save project on changes (debounced)
  useEffect(() => {
    if (layers.length === 0) return;
    if (!isDirty) return;

    const timer = setTimeout(() => {
      try {
        const currentState = getSerializedState();
        const currentHash = JSON.stringify(currentState);

        if (currentHash !== lastSavedHashRef.current) {
          saveProjectToLocalStorage(currentState);
          lastSavedHashRef.current = currentHash;
          console.log('[FreeEditor] Project auto-saved to localStorage');
        }
      } catch (error) {
        console.error('[FreeEditor] Failed to auto-save:', error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isDirty, layers.length, getSerializedState]);

  // Browser beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete/Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        const layer = layers.find((l) => l.id === selectedLayerId);
        if (layer && !layer.locked) {
          deleteLayer(selectedLayerId);
        }
      }

      // Undo (Ctrl/Cmd + Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo (Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z)
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        redo();
      }

      // Zoom shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setAutoFit(false);
          setManualZoom((prev) => Math.min(prev * 1.1, 5));
        } else if (e.key === '-') {
          e.preventDefault();
          setAutoFit(false);
          setManualZoom((prev) => Math.max(prev / 1.1, 0.1));
        } else if (e.key === '0') {
          e.preventDefault();
          setAutoFit(true);
        }
      }

      // Nudge with arrow keys
      if (selectedLayerId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const layer = layers.find((l) => l.id === selectedLayerId);
        if (!layer || layer.locked) return;

        const nudgeAmount = e.shiftKey ? 10 : 1;
        let newX = layer.x;
        let newY = layer.y;

        switch (e.key) {
          case 'ArrowUp':
            newY -= nudgeAmount;
            break;
          case 'ArrowDown':
            newY += nudgeAmount;
            break;
          case 'ArrowLeft':
            newX -= nudgeAmount;
            break;
          case 'ArrowRight':
            newX += nudgeAmount;
            break;
        }

        updateLayer(selectedLayerId, { x: newX, y: newY });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerId, layers, deleteLayer, undo, redo, updateLayer]);

  return (
    <>
      <div className="h-screen flex flex-col bg-gradient-to-br from-tesla-black via-[#3a3b3c] to-tesla-black overflow-hidden">
        {/* Toolbar */}
        <div className="p-1 relative z-[100]">
          <FreeToolbar
            stageRef={stageRef}
            onOpen3DPreview={handleOpen3DPreview}
            onExport={handleExport}
            onShowInfo={() => setShowInfoDialog(true)}
          />
        </div>
        <div className="flex-1 flex overflow-hidden gap-1 p-1 relative z-0">
          <ToolsPanel />
          <LayersPanel className="hidden md:flex" />
          <div ref={canvasContainerRef} className="flex-1 overflow-hidden relative z-0">
            <EditorCanvas
              ref={stageRef}
              zoom={currentZoom}
              onZoomChange={(newZoom) => {
                if (autoFit) {
                  setAutoFitZoom(newZoom);
                } else {
                  setManualZoom(newZoom);
                }
              }}
              autoFit={autoFit}
              onAutoFitChange={(fit) => {
                setAutoFit(fit);
                if (!fit && autoFitZoom) {
                  setManualZoom(autoFitZoom);
                }
              }}
              loading={false}
            />
          </div>
          <PropertiesPanel className="hidden md:flex" />
        </div>
        <EditorThreePreview
          isOpen={show3DPreview}
          onClose={() => setShow3DPreview(false)}
          stageRef={stageRef}
        />
      </div>

      {/* New Project Dialog */}
      <NewProjectDialog
        isOpen={showNewProjectDialog}
        onClose={() => {
          if (layers.length > 0) {
            setShowNewProjectDialog(false);
          } else {
            navigate('/');
          }
        }}
        onCreate={handleCreateProject}
      />

      {/* Info Dialog */}
      <InfoDialog
        isOpen={showInfoDialog}
        onClose={() => setShowInfoDialog(false)}
      />
    </>
  );
};
