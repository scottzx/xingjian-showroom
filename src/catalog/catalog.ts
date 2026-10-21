import type { ClientDefinition, Finish, IndustryId, ProductDefinition } from './types.ts';
import { publicAssetUrl } from '../utils/publicAssetUrl.ts';

export const finishes: Finish[] = [
  { id: 'oak', name: '浅橡木', detail: '自然木纹 · 温润质感', color: '#c4a47a', roughness: .78, metalness: 0, pattern: 'wood' },
  { id: 'walnut', name: '深胡桃', detail: '深色木纹 · 沉稳质感', color: '#71513b', roughness: .65, metalness: 0, pattern: 'wood' },
  { id: 'stone', name: '浅灰石纹', detail: '细腻石纹 · 哑光表面', color: '#c4c8c3', roughness: .84, metalness: 0, pattern: 'stone' },
  { id: 'warm-white', name: '奶油白', detail: '柔和暖白 · 哑光表面', color: '#eee7d9', roughness: .86, metalness: 0 },
  { id: 'sage', name: '鼠尾草绿', detail: '低饱和绿 · 哑光表面', color: '#8b9c88', roughness: .82, metalness: 0 },
  { id: 'clay', name: '陶土色', detail: '温暖大地色 · 哑光表面', color: '#b78065', roughness: .9, metalness: 0 },
  { id: 'charcoal', name: '石墨灰', detail: '深灰色 · 细腻哑光', color: '#444a49', roughness: .8, metalness: 0 },
  { id: 'film-green', name: '森林绿', detail: '缎面改色膜', color: '#426451', roughness: .36, metalness: .35, clearcoat: .65 },
  { id: 'film-blue', name: '冰川蓝', detail: '高光改色膜', color: '#8bafbf', roughness: .19, metalness: .4, clearcoat: 1 },
  { id: 'film-silver', name: '月光银', detail: '金属改色膜', color: '#c3c7c8', roughness: .26, metalness: .8, clearcoat: .8 },
  { id: 'film-orange', name: '日落橙', detail: '高光改色膜', color: '#d77e45', roughness: .22, metalness: .25, clearcoat: 1 },
  { id: 'film-black', name: '曜石黑', detail: '哑光改色膜', color: '#252c2e', roughness: .66, metalness: .2, clearcoat: .25 },
  { id: 'plastic-cream', name: '暖瓷白', detail: '塑料桶身 · 柔和光泽', color: '#e9e2d3', roughness: .38, metalness: 0, clearcoat: .25 },
  { id: 'plastic-green', name: '植物绿', detail: '塑料桶身 · 柔和光泽', color: '#667d64', roughness: .38, metalness: 0, clearcoat: .25 },
  { id: 'plastic-blue', name: '雾霭蓝', detail: '塑料桶身 · 柔和光泽', color: '#7f9ba5', roughness: .38, metalness: 0, clearcoat: .25 },
  { id: 'label-white', name: '本白标签', detail: '品牌文字 · 环绕展示', color: '#f6f1e5', roughness: .65, metalness: 0, pattern: 'label' },
  { id: 'label-sand', name: '砂色标签', detail: '品牌文字 · 环绕展示', color: '#d2bfa1', roughness: .72, metalness: 0, pattern: 'label' },
];

const filmIds = ['film-green', 'film-blue', 'film-silver', 'film-orange', 'film-black'];
const plasticIds = ['plastic-cream', 'plastic-green', 'plastic-blue', 'charcoal'];

export const products: ProductDefinition[] = [
  {
    id: 'c108', industry: 'interior', name: 'C 户型 · 108 方', subtitle: '真实 CAD 户型 / 材质搭配 / 水电核对',
    description: '依据三份施工图展示空间方案，支持原图、水电图层与材质配置核对。',
    model: { kind: 'cad', url: publicAssetUrl('/models/c108/apartment.json') }, demo: false,
    camera: { position: [13, 16, 16], target: [0, .5, 0], minDistance: 5, maxDistance: 65 },
    features: { cutaway: true },
    surfaces: [
      { id: 'floor', name: '客餐厅地砖', description: '材料表 CT-01 · 600×600 地砖', finishIds: ['stone', 'warm-white'], defaultFinishId: 'stone' },
      { id: 'wood-floor', name: '卧室木地板', description: '材料表 WF-01 · 卧室与书房实木地板（选样）', finishIds: ['oak', 'walnut'], defaultFinishId: 'oak' },
      { id: 'walls', name: '墙面', description: '从 CAD 墙体轮廓生成的墙面', finishIds: ['warm-white', 'sage', 'clay', 'stone'], defaultFinishId: 'warm-white' },
      { id: 'sofa', name: '软装', description: '按布置图位置制作的示意软装', finishIds: ['warm-white', 'sage', 'clay', 'charcoal'], defaultFinishId: 'warm-white' },
      { id: 'cabinet', name: '柜体', description: '按布置图位置制作的示意柜体', finishIds: ['oak', 'walnut', 'warm-white', 'charcoal'], defaultFinishId: 'walnut' },
    ],
  },
  {
    id: 'living-room', industry: 'interior', name: '栖居 · 客厅空间', subtitle: '墙面 / 地板 / 家具',
    description: '室内空间示意演示，支持按区域配置地板、墙面与家具材质，供方案沟通参考。',
    model: { kind: 'procedural', builder: 'interior' }, demo: true,
    camera: { position: [8.5, 7, 9], target: [0, .8, 0], minDistance: 5, maxDistance: 18 },
    features: { cutaway: true },
    surfaces: [
      { id: 'floor', name: '地板', description: '客厅地面整体材质', finishIds: ['oak', 'walnut', 'stone'], defaultFinishId: 'oak' },
      { id: 'walls', name: '墙面', description: '背景墙与侧墙的色彩', finishIds: ['warm-white', 'sage', 'clay', 'stone'], defaultFinishId: 'warm-white' },
      { id: 'sofa', name: '沙发', description: '组合沙发的面料色彩', finishIds: ['warm-white', 'sage', 'clay', 'charcoal'], defaultFinishId: 'sage' },
      { id: 'cabinet', name: '柜体', description: '电视柜与边柜饰面', finishIds: ['oak', 'walnut', 'warm-white', 'charcoal'], defaultFinishId: 'walnut' },
    ],
  },
  {
    id: 'sedan', industry: 'vehicle-wrap', name: '流线 · 车身改色', subtitle: '分区涂装 / 膜材预览',
    description: '车身改色示意演示，支持分区膜材配置与整车应用，便于核对涂装方案。',
    model: { kind: 'procedural', builder: 'vehicle-wrap' }, demo: true,
    camera: { position: [-6.5, 3.4, 6.5], target: [0, .85, 0], minDistance: 4, maxDistance: 13 },
    features: {},
    surfaces: [
      { id: 'body', name: '车身', description: '基础车身与翼子板', finishIds: filmIds, defaultFinishId: 'film-green' },
      { id: 'hood', name: '机盖', description: '前机盖独立配色', finishIds: filmIds, defaultFinishId: 'film-green' },
      { id: 'roof', name: '车顶', description: '车顶独立配色', finishIds: filmIds, defaultFinishId: 'film-black' },
      { id: 'doors', name: '车门', description: '两侧车门组合配色', finishIds: filmIds, defaultFinishId: 'film-green' },
      { id: 'bumpers', name: '保险杠', description: '前后保险杠组合配色', finishIds: filmIds, defaultFinishId: 'film-green' },
    ],
  },
  {
    id: 'film-bucket', industry: 'packaging', name: '本色 · 塑膜桶', subtitle: '桶身 / 桶盖 / 品牌标签',
    description: '包装外观示意演示，支持桶身、桶盖配色及品牌标签文字配置。',
    model: { kind: 'procedural', builder: 'packaging' }, demo: true,
    camera: { position: [3.5, 2.8, 4.8], target: [0, 1.15, 0], minDistance: 3, maxDistance: 9 },
    features: { label: true }, defaultLabel: 'NATURAL',
    surfaces: [
      { id: 'bucket', name: '桶身', description: '锥形桶身的外观颜色', finishIds: plasticIds, defaultFinishId: 'plastic-cream' },
      { id: 'lid', name: '桶盖', description: '桶盖与密封圈配色', finishIds: plasticIds, defaultFinishId: 'plastic-green' },
      { id: 'label', name: '标签', description: '环绕标签的底色与品牌文字', finishIds: ['label-white', 'label-sand'], defaultFinishId: 'label-white' },
    ],
  },
  {
    id: 'construction-site', industry: 'construction-site', name: '施工场地 · 教学样例', subtitle: '六设施足迹 / 比例暂定 / 高度示意',
    description: '依据教学 CAD 的边界与六设施足迹展示布局。80×80 米为暂定比例，实际高度全部未知。',
    model: { kind: 'construction-site', url: publicAssetUrl('/models/construction-site/site.json') }, demo: true,
    camera: { position: [105, 115, 125], target: [0, 0, 0], minDistance: 12, maxDistance: 600 },
    features: {},
    surfaces: [
      { id: 'F01', name: '一般储料区', description: 'F01 · Deposito · 源 handle 42 · 示意体块', finishIds: ['stone', 'sage', 'clay'], defaultFinishId: 'stone' },
      { id: 'F02', name: '升降设施占位', description: 'F02 · Elevador · 源 handle 45 · 通用体块，无设备实参', finishIds: ['charcoal', 'sage', 'clay'], defaultFinishId: 'charcoal' },
      { id: 'F03', name: '卫生间', description: 'F03 · Banheiro · 源 handle 48 · 示意体块', finishIds: ['sage', 'stone', 'clay'], defaultFinishId: 'sage' },
      { id: 'F04', name: '食堂', description: 'F04 · Refeitorio · 源 handle 4B · 示意体块', finishIds: ['clay', 'stone', 'sage'], defaultFinishId: 'clay' },
      { id: 'F05', name: '库房/仓储区', description: 'F05 · Almoxarifado · 源 handle 4E · 示意体块', finishIds: ['sage', 'stone', 'clay'], defaultFinishId: 'sage' },
      { id: 'F06', name: '饮水点', description: 'F06 · Bebedouro · 源 handle 51 · 平面区域，无设备造型', finishIds: ['clay', 'stone', 'sage'], defaultFinishId: 'clay' },
    ],
  },
  {
    id: 'ifg-classroom', industry: 'construction-site', name: 'IFG · BLC1 两层教学楼', subtitle: '真实设计 CAD / 两层主体 / 来源核对',
    description: '由 IFG BLC1 R00 原始设计重建两层建筑主体，核对墙体、门窗开口、地面与中庭。',
    model: { kind: 'construction-cad', url: publicAssetUrl('/models/construction-cad/ifg-classroom/model.json') }, demo: false,
    camera: { position: [82, 75, 70], target: [32.5, 2.5, -10.5], minDistance: 8, maxDistance: 800 },
    features: { cutaway: true },
    surfaces: [
      { id: 'ground-walls', name: '一层墙体', description: '源闭合轮廓与校核墙边合并，按门窗足迹实际扣洞。颜色为展示设置。', finishIds: ['warm-white', 'stone', 'sage'], defaultFinishId: 'warm-white' },
      { id: 'upper-walls', name: '二层墙体', description: '试验楼面 3.37m、净高 3.24m；原 +3.24 标高文字冲突保留。', finishIds: ['warm-white', 'stone', 'sage'], defaultFinishId: 'warm-white' },
      { id: 'ground-floor', name: '一层地面与台阶', description: '源房间净轮廓；薄表面与踏步竖向插值仅作展示。', finishIds: ['stone', 'warm-white', 'charcoal'], defaultFinishId: 'stone' },
      { id: 'upper-floor', name: '二层地面', description: '保留中庭及楼梯排除区；精确结构板边界、厚度未知。', finishIds: ['stone', 'warm-white', 'charcoal'], defaultFinishId: 'stone' },
    ],
  },
];

export const clients: ClientDefinition[] = [
  { id: 'construction-demo', name: '建筑空间展示', initials: '建', tagline: '设计依据 · 空间沟通', accent: 'var(--brand-green)', productIds: ['construction-site', 'ifg-classroom'] },
  { id: 'interior-demo', name: '栖居空间', initials: '栖', tagline: '室内空间方案演示', accent: 'var(--brand-green)', productIds: ['c108', 'living-room'] },
  { id: 'wrap-demo', name: '流线车衣 · 演示客户', initials: '流', tagline: '车身膜材配置演示', accent: 'var(--brand-green)', productIds: ['sedan'] },
  { id: 'packaging-demo', name: '本色包装 · 演示客户', initials: '本', tagline: '包装外观方案演示', accent: 'var(--brand-green)', productIds: ['film-bucket'] },
];

export const industries: { id: IndustryId; name: string; english: string; description: string; clientId: string; productId: string }[] = [
  { id: 'interior', name: '室内装修', english: 'INTERIOR', description: '依据 CAD 图纸展示空间、材质与水电信息。', clientId: 'interior-demo', productId: 'c108' },
  { id: 'vehicle-wrap', name: '车衣定制', english: 'VEHICLE WRAP', description: '按车身部件配置膜材，核对整车配色。', clientId: 'wrap-demo', productId: 'sedan' },
  { id: 'packaging', name: '塑膜桶', english: 'PACKAGING', description: '配置包装颜色与品牌标签，展示外观方案。', clientId: 'packaging-demo', productId: 'film-bucket' },
  { id: 'construction-site', name: '建筑工程', english: 'CONSTRUCTION CAD', description: '依据真实设计 CAD 核对两层建筑、门窗与图纸来源。', clientId: 'construction-demo', productId: 'ifg-classroom' },
];

export function getShowcase(clientId: string, productId: string) {
  const client = clients.find(item => item.id === clientId);
  const product = products.find(item => item.id === productId);
  if (!client || !product || !client.productIds.includes(productId)) return undefined;
  return { client, product };
}

export function validateCatalog() {
  const unique = (values: string[], kind: string) => {
    if (new Set(values).size !== values.length) throw new Error(`${kind} id must be unique`);
  };
  unique(finishes.map(item => item.id), 'finish');
  unique(products.map(item => item.id), 'product');
  unique(clients.map(item => item.id), 'client');
  for (const product of products) {
    unique(product.surfaces.map(item => item.id), `surface in ${product.id}`);
    for (const surface of product.surfaces) {
      if (!surface.finishIds.includes(surface.defaultFinishId)) throw new Error(`Invalid default finish: ${surface.id}`);
      for (const id of surface.finishIds) {
        if (!finishes.some(item => item.id === id)) throw new Error(`Unknown finish: ${id}`);
      }
    }
  }
  for (const client of clients) {
    for (const id of client.productIds) {
      if (!products.some(item => item.id === id)) throw new Error(`Unknown product: ${id}`);
    }
    if (client.contact && !/^(https:\/\/|mailto:|tel:)/.test(client.contact.url)) throw new Error('Invalid contact URL');
  }
}

validateCatalog();
