import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { LoaderCircle, RotateCcw, TriangleAlert } from 'lucide-react';
import type { ProductDefinition, ShowcasePlan } from '../catalog/types';
import { createViewerRuntime } from './runtime';
import type { ViewerRuntime } from './runtime';
import type { LayerVisibility } from '../scenarios/sceneTypes';
import type { InspectionResult } from '../scenarios/interior/mountAssessment';

export interface ProductViewerHandle {
  resetCamera: () => void;
  topView: () => void;
  capture: () => string | undefined;
  setEditorCanvas: (canvas: HTMLCanvasElement | null) => void;
  inspectHeight: (height: number) => void;
}

interface Props {
  product: ProductDefinition;
  plan: ShowcasePlan;
  selectedSurfaceId?: string;
  autoRotate?: boolean;
  visibleLevelIds?: string[];
  selectedElementId?: string;
  onElementSelect?: (id: string) => void;
  cutaway?: boolean;
  layerVisibility?: LayerVisibility;
  xray?: boolean;
  inspection?: boolean;
  onInspect?: (result: InspectionResult) => void;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  onReady?: () => void;
}

export const ProductViewer = forwardRef<ProductViewerHandle, Props>(function ProductViewer({ product, plan, selectedSurfaceId, visibleLevelIds, selectedElementId, onElementSelect, autoRotate = false, cutaway = false, layerVisibility, xray = false, inspection = false, onInspect, interactive = true, onSelect, onReady }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<ViewerRuntime | null>(null);
  const callbacks = useRef({ onSelect, onReady, onInspect, onElementSelect });
  const latest = useRef({ plan, selectedSurfaceId, visibleLevelIds, selectedElementId, autoRotate, cutaway, layerVisibility, xray, inspection });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => { callbacks.current = { onSelect, onReady, onInspect, onElementSelect }; }, [onSelect, onReady, onInspect, onElementSelect]);
  useEffect(() => {
    latest.current = { plan, selectedSurfaceId, visibleLevelIds, selectedElementId, autoRotate, cutaway, layerVisibility, xray, inspection };
    runtime.current?.update(latest.current);
  }, [plan, selectedSurfaceId, visibleLevelIds, selectedElementId, autoRotate, cutaway, layerVisibility, xray, inspection]);
  useImperativeHandle(ref, () => ({
    resetCamera: () => runtime.current?.resetCamera(), topView: () => runtime.current?.topView(),
    capture: () => status === 'ready' ? runtime.current?.capture() : undefined, setEditorCanvas: canvas => runtime.current?.setEditorCanvas(canvas),
    inspectHeight: height => runtime.current?.inspectHeight(height),
  }), [status]);
  useEffect(() => {
    if (!host.current) return;
    let active = true;
    queueMicrotask(() => { if (active) setStatus('loading'); });
    try {
      runtime.current = createViewerRuntime(host.current, product, {
        interactive,
        onSelect: id => callbacks.current.onSelect?.(id),
        onElementSelect: id => callbacks.current.onElementSelect?.(id),
        onInspect: result => callbacks.current.onInspect?.(result),
        onStatus: (next, error) => {
          if (!active) return;
          setStatus(next); setMessage(error ?? '');
          if (next === 'ready') callbacks.current.onReady?.();
        },
      });
      runtime.current.update(latest.current);
    } catch {
      queueMicrotask(() => { if (active) { setStatus('error'); setMessage('当前浏览器无法启动三维展示。请启用硬件加速，或换用支持 WebGL 2 的浏览器。'); } });
    }
    return () => { active = false; runtime.current?.dispose(); runtime.current = null; };
  }, [product, interactive, retry]);
  return (
    <div className="product-viewer" data-status={status}>
      <div className="product-viewer-canvas" ref={host} />
      {status === 'loading' && <div className="viewer-state" role="status"><LoaderCircle className="spin" size={22} /><span>正在准备展示…</span></div>}
      {status === 'error' && <div className="viewer-state viewer-error" role="alert"><TriangleAlert size={28} /><strong>暂时无法展示模型</strong><span>{message}</span><button type="button" onClick={() => setRetry(value => value + 1)}><RotateCcw size={15} />重新加载</button></div>}
    </div>
  );
});
