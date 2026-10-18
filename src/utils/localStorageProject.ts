import type { ProjectFile } from '../editor/state/useEditorStore';
import { persistenceQueue } from './persistenceQueue';

const STORAGE_KEY = 'tesla_wrap_unsaved_project';
const UI_STATE_KEY = 'tesla_wrap_ui_state';

/**
 * UI state interface for persisting editor UI state
 */
export interface EditorUIState {
  openDialog: 'ai' | 'newProject' | '3dPreview' | null;
  zoom: number;
  autoFit: boolean;
  timestamp: number;
}

/**
 * Synchronous save for critical operations (e.g., before navigation)
 * This bypasses the queue and writes immediately to localStorage.
 * Use this when the data MUST be persisted before the next action (like navigation).
 */
export const saveProjectToLocalStorageSync = (project: ProjectFile): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    console.log('[localStorage] Project saved synchronously');
  } catch (error) {
    console.error('Failed to save project to localStorage:', error);
    throw error;
  }
};

/**
 * Save project to localStorage (for preserving unsaved work during login)
 * Uses the persistence queue for non-blocking writes
 */
export const saveProjectToLocalStorage = (project: ProjectFile, priority: 'high' | 'low' = 'low'): void => {
  persistenceQueue.enqueue(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (error) {
      console.error('Failed to save project to localStorage:', error);
      // If localStorage is full or unavailable, silently fail
    }
  }, priority);
};

/**
 * Load project from localStorage
 */
export const loadProjectFromLocalStorage = (): ProjectFile | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log('[localStorage] loadProjectFromLocalStorage - stored value:', !!stored);
    if (!stored) return null;

    const project = JSON.parse(stored) as ProjectFile;
    console.log('[localStorage] Parsed project:', project);
    console.log('[localStorage] project.version:', project.version);
    console.log('[localStorage] project.modelId:', project.modelId);
    console.log('[localStorage] project.layers:', project.layers);

    // Validate project structure
    if (!project.version || !project.layers || !project.modelId) {
      // Invalid project data in localStorage
      console.log('[localStorage] Validation failed - version:', !!project.version, 'layers:', !!project.layers, 'modelId:', !!project.modelId);
      return null;
    }

    console.log('[localStorage] Validation passed, returning project');
    return project;
  } catch (error) {
    console.error('Failed to load project from localStorage:', error);
    return null;
  }
};

/**
 * Clear saved project from localStorage
 */
export const clearSavedProject = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear saved project from localStorage:', error);
  }
};

/**
 * Save UI state to localStorage
 * Uses the persistence queue for non-blocking writes
 */
export const saveUIState = (state: Omit<EditorUIState, 'timestamp'>): void => {
  persistenceQueue.enqueue(() => {
    try {
      const stateWithTimestamp: EditorUIState = {
        ...state,
        timestamp: Date.now(),
      };
      localStorage.setItem(UI_STATE_KEY, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.error('Failed to save UI state to localStorage:', error);
    }
  }, 'low');
};

/**
 * Load UI state from localStorage
 */
export const loadUIState = (): EditorUIState | null => {
  try {
    const stored = localStorage.getItem(UI_STATE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as EditorUIState;
    
    // Expire UI state after 30 minutes
    if (Date.now() - state.timestamp > 30 * 60 * 1000) {
      clearUIState();
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to load UI state from localStorage:', error);
    return null;
  }
};

/**
 * Clear UI state from localStorage
 */
export const clearUIState = (): void => {
  try {
    localStorage.removeItem(UI_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear UI state from localStorage:', error);
  }
};

/**
 * Clear all saved state (project + UI)
 */
export const clearAllSavedState = (): void => {
  clearSavedProject();
  clearUIState();
};

