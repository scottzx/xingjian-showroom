import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import type { Finish } from '../catalog/types.ts';

export function createFinishTexture(finish: Finish, label: string): CanvasTexture | null {
  if (!finish.pattern) return null;
  const canvas = document.createElement('canvas');
  canvas.width = finish.pattern === 'label' ? 1536 : 256;
  canvas.height = finish.pattern === 'label' ? 768 : 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const { width: w, height: h } = canvas;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
  if (finish.pattern === 'wood') {
    for (let i = 0; i < 150; i++) {
      ctx.strokeStyle = `rgba(55,35,15,${.015 + (Math.sin(i * 9.7) + 1) * .025})`;
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      for (let y = 0; y <= h; y += 8) {
        const x = i * w / 150 + Math.sin(y / 45 + i * .6) * 2.7;
        if (y === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(60,40,20,.15)'; ctx.fillRect(0, 0, 1, h);
  } else if (finish.pattern === 'stone') {
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = `rgba(80,90,85,${.02 + (i % 5) * .008})`;
      ctx.fillRect((i * 83) % w, (i * 137) % h, 1 + i % 3, 1 + i % 3);
    }
  } else {
    ctx.fillStyle = '#304e41';
    ctx.textAlign = 'center';
    for (const x of [w * .25, w * .75]) {
      ctx.font = '500 24px sans-serif'; ctx.fillText('THOUGHTFULLY MADE', x, 150);
      ctx.font = '600 66px sans-serif'; ctx.fillText(label || 'YOUR BRAND', x, 345, w * .43);
      ctx.lineWidth = 2; ctx.strokeStyle = '#304e41';
      ctx.beginPath(); ctx.moveTo(x - 105, 430); ctx.lineTo(x + 105, 430); ctx.stroke();
      ctx.font = '400 25px sans-serif'; ctx.fillText('DESIGNED FOR EVERYDAY', x, 498);
      ctx.font = '400 22px sans-serif'; ctx.fillText('品质 · 源于每一个细节', x, 555);
    }
    ctx.fillRect(0, h - 24, w, 8);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}
