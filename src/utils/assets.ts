/**
 * Get asset URLs for wrap templates and 3D models
 * Assets are located in src/assets/wraps/{folderName}/
 * 
 * In Vite, assets in src/ need to be imported or accessed via a special path
 */

// Pre-load all template images using Vite's glob import
// Note: Paths must be relative to the project root
const templateModules = import.meta.glob('../assets/wraps/**/template.png', { 
  eager: true,
  query: '?url',
  import: 'default'
});

// Pre-load all GLTF/GLB files (look in 3D subfolder or root) - same pattern as template images
const gltfModules = import.meta.glob('../assets/wraps/**/3D/*.{gltf,glb}', { 
  eager: true,
  query: '?url',
  import: 'default'
});

// Also check for GLB files in the model root
const glbModules = import.meta.glob('../assets/wraps/**/*.glb', { 
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;

// Pre-load all vehicle preview images
const vehicleImageModules = import.meta.glob('../assets/wraps/**/vehicle_image.png', { 
  eager: true,
  query: '?url',
  import: 'default'
});

/**
 * Get the URL for a template image
 */
export const getTemplateUrl = (folderName: string): string => {
  const path = `../assets/wraps/${folderName}/template.png`;
  const module = templateModules[path];
  if (module && typeof module === 'string') {
    return module;
  }
  // Fallback: try direct import path
  return new URL(`../assets/wraps/${folderName}/template.png`, import.meta.url).href;
};

/**
 * Get the URL for a vehicle preview image
 */
export const getVehicleImageUrl = (folderName: string): string => {
  const path = `../assets/wraps/${folderName}/vehicle_image.png`;
  const module = vehicleImageModules[path];
  if (module && typeof module === 'string') {
    return module;
  }
  // Fallback: try direct import path
  return new URL(`../assets/wraps/${folderName}/vehicle_image.png`, import.meta.url).href;
};

/** Return only existing bundled models; never manufacture a URL for a missing asset. */
export const getGltfUrl = (folderName: string): string | null => {
  for (const [path, value] of Object.entries({ ...gltfModules, ...glbModules })) {
    if (path.includes(`/${folderName}/`) && typeof value === 'string') return value;
  }
  return null;
};
