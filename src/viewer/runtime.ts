import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { finishes } from '../catalog/catalog.ts';
import type { ProductDefinition, ShowcasePlan } from '../catalog/types.ts';
import { loadSceneAsset } from '../scenarios/registry.ts';
import type { LayerVisibility, SceneAsset, SceneLayer } from '../scenarios/sceneTypes.ts';
import { createFinishTexture } from './textures.ts';
import { assessMountPoint } from '../scenarios/interior/mountAssessment.ts';
import type { InspectionResult } from '../scenarios/interior/mountAssessment.ts';
import type { ServiceDevice, ServiceRoute, SpatialPoint } from '../scenarios/interior/cadTypes.ts';

export interface ViewerAppearance {
  plan: ShowcasePlan;
  selectedSurfaceId?: string;
  autoRotate?: boolean;
  visibleLevelIds?: string[];
  selectedElementId?: string;
  cutaway?: boolean;
  layerVisibility?: LayerVisibility;
  xray?: boolean;
  inspection?: boolean;
}

export interface ViewerRuntime {
  update: (appearance: ViewerAppearance) => void;
  resetCamera: () => void;
  topView: () => void;
  capture: () => string;
  setEditorCanvas: (canvas: HTMLCanvasElement | null) => void;
  dispose: () => void;
  inspectHeight: (height: number) => void;
}

function disposeTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite)) return;
    if ('geometry' in object) geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  textures.forEach(texture => texture.dispose());
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}

export function createViewerRuntime(
  host: HTMLElement, product: ProductDefinition,
  options: { interactive: boolean; onSelect: (id: string) => void; onStatus: (status: 'ready' | 'error', message?: string) => void; onInspect?: (result: InspectionResult) => void; onElementSelect?: (id: string) => void },
): ViewerRuntime {
  const isSite = product.model.kind === 'construction-site';
  const isBuilding = product.model.kind === 'construction-cad';
  const largeModel = isSite || isBuilding;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  if (product.model.kind === 'cad') renderer.toneMappingExposure = .85;
  if (isBuilding) renderer.toneMappingExposure = .72;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-label', `${product.name}三维展示，可拖动旋转和滚轮缩放`);
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.style.touchAction = options.interactive ? 'none' : 'pan-y';
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eef1ed');
  const mountMarker = new THREE.Mesh(new THREE.SphereGeometry(.055, 16, 10), new THREE.MeshBasicMaterial({ color: '#a3483f', depthTest: false }));
  mountMarker.name = '本次上墙查询位置（未确认）'; mountMarker.renderOrder = 10; mountMarker.visible = false; scene.add(mountMarker);
  const camera = new THREE.PerspectiveCamera(35, 1, .05, largeModel ? 2000 : 150);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = options.interactive;
  controls.enableDamping = true;
  controls.dampingFactor = .07;
  controls.autoRotateSpeed = .65;
  controls.minDistance = product.camera.minDistance;
  controls.maxDistance = product.camera.maxDistance;
  controls.maxPolarAngle = Math.PI / 2 - .01;
  let viewMode: 'orbit' | 'top' = 'orbit';
  let framingFactor = 1;
  const getFramingFactor = () => product.model.kind === 'cad' ? Math.max(1, 1.25 / camera.aspect) : largeModel ? Math.max(1, 1 / camera.aspect) : 1;
  const resetCamera = () => {
    viewMode = 'orbit'; framingFactor = getFramingFactor();
    camera.position.set(...product.camera.position);
    controls.target.set(...product.camera.target);
    camera.position.sub(controls.target).multiplyScalar(framingFactor).add(controls.target);
    controls.update();
  };
  resetCamera();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  if (product.model.kind === 'cad') scene.environmentIntensity = .65;
  if (isBuilding) scene.environmentIntensity = .4;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#ffffff', '#adb7ab', 1.25));
  const sunlight = new THREE.DirectionalLight('#fff6e9', product.model.kind === 'cad' ? 1.6 : 2.2);
  sunlight.position.set(-4, 9, 5); sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  sunlight.shadow.camera.left = sunlight.shadow.camera.bottom = -8;
  sunlight.shadow.camera.right = sunlight.shadow.camera.top = 8;
  sunlight.shadow.normalBias = .035;
  sunlight.shadow.bias = -.0001;
  if (isBuilding) {
    sunlight.position.set(5, 65, 20); sunlight.target.position.set(32.5, 0, -10.5); scene.add(sunlight.target);
    sunlight.shadow.camera.left = sunlight.shadow.camera.bottom = -48;
    sunlight.shadow.camera.right = sunlight.shadow.camera.top = 48; sunlight.shadow.camera.far = 200;
  }
  scene.add(sunlight);
  const fill = new THREE.DirectionalLight('#d5e6e4', .8);
  fill.position.set(5, 4, -4); scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#e9ede7', roughness: .95 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -.1; ground.receiveShadow = true; scene.add(ground);
  let disposed = false;
  let asset: SceneAsset | undefined;
  let appearance: ViewerAppearance | undefined;
  let editorTexture: THREE.CanvasTexture | null = null;
  const originalMaterials = new Set<THREE.Material>();
  let frame = 0;
  let visible = true;
  const applyAppearance = () => {
    if (!asset || !appearance) return;
    controls.autoRotate = appearance.autoRotate ?? false;
    for (const [id, group] of Object.entries(asset.levelGroups ?? {})) group.visible = appearance.visibleLevelIds?.includes(id) ?? true;
    asset.cutawayObjects?.forEach(object => { object.visible = !appearance?.cutaway; });
    for (const [layer, group] of Object.entries(asset.layers ?? {})) {
      group.visible = appearance.layerVisibility?.[layer as SceneLayer] ?? ['furniture', 'labels', 'finishes'].includes(layer);
    }
    ground.visible = !appearance.xray;
    if (!appearance.inspection) mountMarker.visible = false;
    controls.maxPolarAngle = appearance.inspection ? Math.PI * .67 : Math.PI / 2 - .01;
    for (const [surfaceId, meshes] of asset.surfaces) {
      const definition = product.surfaces.find(item => item.id === surfaceId);
      if (!definition) continue;
      const finishId = appearance.plan.finishes[surfaceId] ?? definition.defaultFinishId;
      const finish = finishes.find(item => item.id === finishId && definition.finishIds.includes(item.id));
      if (!finish) continue;
      for (const mesh of meshes) {
        const signature = `${finish.id}:${finish.pattern === 'label' ? appearance.plan.label : ''}:${!!editorTexture}`;
        if (mesh.userData.finishSignature !== signature) {
          // Imported GLB materials may be shared: only dispose materials owned by this runtime here.
          if (mesh.userData.showcaseMaterial) {
            const previous = mesh.material as THREE.MeshPhysicalMaterial;
            if (previous.map && previous.map !== editorTexture) previous.map.dispose();
            previous.dispose();
          } else {
            for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) originalMaterials.add(material);
          }
          const map = editorTexture && product.industry === 'vehicle-wrap' ? editorTexture : createFinishTexture(finish, appearance.plan.label);
          if (map && map !== editorTexture && Array.isArray(mesh.userData.textureRepeat)) map.repeat.set(...mesh.userData.textureRepeat as [number, number]);
          mesh.material = new THREE.MeshPhysicalMaterial({ color: map === editorTexture && editorTexture ? '#ffffff' : finish.color, roughness: finish.roughness, metalness: finish.metalness, clearcoat: finish.clearcoat ?? 0, map });
          mesh.userData.finishSignature = signature;
          mesh.userData.showcaseMaterial = true;
        }
        const material = mesh.material as THREE.MeshPhysicalMaterial;
        const selected = appearance.selectedElementId ? mesh.userData.elementId === appearance.selectedElementId : surfaceId === appearance.selectedSurfaceId;
        material.emissive.set(selected ? '#36634e' : '#000000');
        material.emissiveIntensity = selected ? .3 : 0;
      }
    }
    for (const mesh of asset.xrayMeshes ?? []) {
      const material = mesh.material as THREE.MeshPhysicalMaterial;
      const transparent = !!appearance.xray;
      if (material.transparent !== transparent) material.needsUpdate = true;
      material.transparent = transparent; material.opacity = transparent ? .13 : 1; material.depthWrite = !transparent;
    }
  };
  void loadSceneAsset(product).then(loaded => {
    if (disposed) { disposeTree(loaded.root); return; }
    asset = loaded; scene.add(loaded.root);
    const missing = product.surfaces.filter(surface => !loaded.surfaces.has(surface.id));
    if (missing.length) throw new Error(`模型缺少可选区域：${missing.map(item => item.name).join('、')}`);
    applyAppearance(); options.onStatus('ready');
  }).catch(error => { if (!disposed) options.onStatus('error', error instanceof Error ? error.message : '模型加载失败，请重试。'); });
  const fitSiteTop = () => {
    const visibleBox = new THREE.Box3();
    if (isBuilding && asset) asset.root.traverseVisible(object => { if (object instanceof THREE.Mesh) visibleBox.expandByObject(object); });
    const box = !visibleBox.isEmpty() ? visibleBox : asset ? new THREE.Box3().setFromObject(asset.root) : new THREE.Box3(new THREE.Vector3(-40, 0, -40), new THREE.Vector3(40, 3, 40));
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const distance = Math.max(size.z, size.x / camera.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.18;
    camera.position.set(center.x, center.y + distance, center.z + .001);
    controls.target.copy(center);
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    renderer.setSize(width, height); camera.aspect = width / height;
    if (viewMode === 'orbit') {
      const nextFactor = getFramingFactor();
      camera.position.sub(controls.target).multiplyScalar(nextFactor / framingFactor).add(controls.target);
      framingFactor = nextFactor;
    }
    if (largeModel && viewMode === 'top') fitSiteTop();
    camera.updateProjectionMatrix(); controls.update();
  };
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host); resize();
  const intersectionObserver = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; });
  intersectionObserver.observe(host);
  const render = () => {
    if (disposed) return;
    frame = requestAnimationFrame(render);
    if (visible && !document.hidden) { controls.update(); renderer.render(scene, camera); }
  };
  render();
  const raycaster = new THREE.Raycaster();
  let pointerDown: { x: number; y: number } | undefined;
  const pointers = new Set<number>();
  let multiTouch = false;
  let lastMountPoint: SpatialPoint | undefined;
  const reportMount = (point: SpatialPoint) => {
    lastMountPoint = point;
    mountMarker.position.set(point[0], point[1] + .025, point[2]); mountMarker.visible = true;
    options.onInspect?.({ kind: 'mount', assessment: assessMountPoint(asset?.services, point) });
  };
  const onDown = (event: PointerEvent) => {
    pointers.add(event.pointerId);
    if (pointers.size > 1) multiTouch = true;
    pointerDown = { x: event.clientX, y: event.clientY };
  };
  const onUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (multiTouch) { if (!pointers.size) multiTouch = false; pointerDown = undefined; return; }
    if (!options.interactive || !asset || !pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 6) return;
    pointerDown = undefined;
    const rect = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    // Include non-editable objects to prevent selecting a part behind visible geometry.
    const hits = raycaster.intersectObject(asset.root, true).filter(item => {
      if (!(item.object instanceof THREE.Mesh)) return false;
      if (item.object.userData.ignorePick) return false;
      let object: THREE.Object3D | null = item.object;
      while (object) { if (!object.visible) return false; object = object.parent; }
      return true;
    });
    if (appearance?.inspection) {
      const serviceHit = hits.find(item => item.object.userData.service);
      if (serviceHit) {
        mountMarker.visible = false;
        const item = serviceHit.object.userData.service as ServiceDevice | ServiceRoute;
        const heightLabel = 'position' in item ? `${item.heightBasis === 'bottom' ? '底口' : item.heightBasis === 'centre' ? '中心' : '标注基准'} ${(item.position[1] * 1000).toFixed(0)} mm` : '逐段标高 / 埋深未唯一标明';
        options.onInspect?.({ kind: 'service', id: item.id, label: item.label, system: item.system, source: item.source, details: item.details, heightLabel }); return;
      }
      const wallHit = hits.find(item => item.object.userData.surfaceId === 'walls' && Math.abs(item.face?.normal.y ?? 1) < .3);
      if (wallHit) { reportMount([wallHit.point.x, wallHit.point.y - .025, wallHit.point.z]); return; }
      options.onInspect?.({ kind: 'instruction', message: '请点击竖直墙面核对位置，或点选彩色管线查看图纸依据。' }); return;
    }
    const hit = hits[0];
    if (isBuilding && hit?.object.userData.elementId) options.onElementSelect?.(hit.object.userData.elementId as string);
    if (hit?.object.userData.surfaceId) options.onSelect(hit.object.userData.surfaceId as string);
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  const onCancel = () => { pointers.clear(); pointerDown = undefined; multiTouch = false; };
  renderer.domElement.addEventListener('pointercancel', onCancel);
  return {
    update(value) { appearance = value; applyAppearance(); },
    resetCamera,
    inspectHeight(height) {
      if (lastMountPoint && Number.isFinite(height) && height >= -.35 && height <= 3) reportMount([lastMountPoint[0], height, lastMountPoint[2]]);
    },
    topView() {
      viewMode = 'top';
      if (largeModel) { fitSiteTop(); controls.update(); return; }
      const size = asset ? new THREE.Box3().setFromObject(asset.root).getSize(new THREE.Vector3()) : new THREE.Vector3(7, 3, 5);
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const distance = Math.max(size.z, size.x / camera.aspect) / (2 * Math.tan(halfFov)) * 1.18;
      camera.position.set(0, Math.min(product.camera.maxDistance, distance), .001);
      controls.target.set(0, 0, 0); controls.update();
    },
    capture() { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
    setEditorCanvas(canvas) {
      const previous = editorTexture;
      editorTexture = canvas ? new THREE.CanvasTexture(canvas) : null;
      if (editorTexture) { editorTexture.colorSpace = THREE.SRGBColorSpace; editorTexture.flipY = false; }
      asset?.surfaces.forEach(meshes => meshes.forEach(mesh => { mesh.userData.finishSignature = ''; }));
      applyAppearance(); previous?.dispose();
    },
    dispose() {
      disposed = true; cancelAnimationFrame(frame);
      resizeObserver.disconnect(); intersectionObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointercancel', onCancel);
      controls.dispose();
      disposeTree(scene); environment.dispose(); editorTexture?.dispose(); sunlight.shadow.dispose();
      originalMaterials.forEach(material => {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
        material.dispose();
      });
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    },
  };
}
