import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { Stage } from 'konva/lib/Stage';
import { X } from 'lucide-react';
import { products } from '../catalog/catalog';
import { defaultPlan } from '../features/sharing/plan';
import { useEditorStore } from '../editor/state/useEditorStore';
import { captureEditorCanvas } from '../utils/exportPng';
import { ProductViewer } from './ProductViewer';
import type { ProductViewerHandle } from './ProductViewer';
import '../pages/showroom.css';

const product = products.find(item => item.id === 'sedan')!;
const plan = defaultPlan('wrap-demo', product);

export function EditorThreePreview({ isOpen, onClose, stageRef }: { isOpen: boolean; onClose: () => void; stageRef: RefObject<Stage | null> }) {
  const viewer = useRef<ProductViewerHandle>(null);
  const layers = useEditorStore(state => state.layers);
  const baseColor = useEditorStore(state => state.baseColor);
  const sync = useCallback(() => {
    if (!stageRef.current) return;
    try { viewer.current?.setEditorCanvas(captureEditorCanvas(stageRef.current)); }
    catch (error) { console.warn('Unable to capture the editor texture', error); }
  }, [stageRef]);
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(sync, 200);
    return () => window.clearTimeout(timer);
  }, [isOpen, layers, baseColor, sync]);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return <div className="showroom-app editor-three-overlay" role="dialog" aria-modal="true" aria-label="车身示意预览"><div className="editor-three-modal"><div className="editor-three-heading"><div><h2>车身示意预览</h2><p>当前使用通用车身展示图案，具体车型的贴图位置需用对应模型校准。</p></div><button className="icon-button" aria-label="关闭三维预览" autoFocus onClick={onClose}><X size={22} /></button></div><div className="editor-three-content"><ProductViewer ref={viewer} product={product} plan={plan} autoRotate onReady={sync} /></div></div></div>;
}
