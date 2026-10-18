import type { Stage } from 'konva/lib/Stage';
import type { Node } from 'konva/lib/Node';
import type { Group } from 'konva/lib/Group';

/** Capture artwork without selection controls; always restore the editor on failure. */
export function captureEditorCanvas(stage: Stage): HTMLCanvasElement {
  const hidden: { node: Node; visible: boolean }[] = [];
  const hide = (node: Node) => { hidden.push({ node, visible: node.visible() }); node.visible(false); };
  const transformer = stage.findOne('Transformer');
  if (transformer) hide(transformer);
  stage.find('Group').forEach(node => {
    const group = node as Group;
    if (group.listening() === false && group.getChildren().length >= 2 && group.getChildren().some(child => child.getClassName() === 'Circle')) hide(group);
  });
  stage.find('Line').forEach(node => { if (['#00FFFF', '#00ffff', 'rgb(0, 255, 255)', 'cyan'].includes(node.getAttr('stroke') as string)) hide(node); });
  stage.find('Circle').forEach(node => { if (node.getAttr('stroke') === '#B73038') hide(node); });
  try { return stage.toCanvas({ pixelRatio: 1 }); }
  finally { hidden.forEach(({ node, visible }) => node.visible(visible)); stage.batchDraw(); }
}

export function exportPng(stage: Stage | null, filename: string): void {
  if (!stage) return;
  const link = document.createElement('a');
  link.download = filename; link.href = captureEditorCanvas(stage).toDataURL('image/png');
  document.body.appendChild(link); link.click(); link.remove();
}
