import type { ProductDefinition, ShowcasePlan } from '../../catalog/types.ts';

export const planStorageKey = (clientId: string, productId: string) => `showcase:v1:${clientId}:${productId}`;

export function defaultPlan(clientId: string, product: ProductDefinition): ShowcasePlan {
  return { version: 1, clientId, productId: product.id, finishes: Object.fromEntries(product.surfaces.map(surface => [surface.id, surface.defaultFinishId])), label: product.defaultLabel ?? '' };
}

/** Treat URL and localStorage values as untrusted; never accept unknown surfaces or finishes. */
export function sanitizePlan(value: unknown, clientId: string, product: ProductDefinition): ShowcasePlan | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Partial<ShowcasePlan>;
  if (input.version !== 1 || input.clientId !== clientId || input.productId !== product.id) return null;
  const plan = defaultPlan(clientId, product);
  if (input.finishes && typeof input.finishes === 'object') {
    for (const surface of product.surfaces) {
      const id = input.finishes[surface.id];
      if (typeof id === 'string' && surface.finishIds.includes(id)) plan.finishes[surface.id] = id;
    }
  }
  if (typeof input.label === 'string' && product.features.label) plan.label = input.label.replace(/[\u0000-\u001f]/g, '').slice(0, 24);
  return plan;
}

export function encodePlan(plan: ShowcasePlan): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(plan))));
}

export function decodePlan(encoded: string | null, clientId: string, product: ProductDefinition): ShowcasePlan | null {
  if (!encoded || encoded.length > 8192) return null;
  try {
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    return sanitizePlan(JSON.parse(new TextDecoder().decode(bytes)), clientId, product);
  } catch { return null; }
}

export function readSavedPlan(clientId: string, product: ProductDefinition): ShowcasePlan | null {
  try {
    const value = localStorage.getItem(planStorageKey(clientId, product.id));
    return value ? sanitizePlan(JSON.parse(value), clientId, product) : null;
  } catch { return null; }
}

export function savePlan(plan: ShowcasePlan): boolean {
  try { localStorage.setItem(planStorageKey(plan.clientId, plan.productId), JSON.stringify(plan)); return true; }
  catch { return false; }
}

export function shareUrl(plan: ShowcasePlan): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = `/showcase/${encodeURIComponent(plan.clientId)}/${encodeURIComponent(plan.productId)}?design=${encodeURIComponent(encodePlan(plan))}`;
  return url.toString();
}
