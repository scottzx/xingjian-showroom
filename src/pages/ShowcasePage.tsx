import { ConstructionCadPanel } from './ConstructionCadPanel';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, CheckCheck, ChevronDown, Copy, Download, Eye, EyeOff, FileText, Layers3, Maximize, MousePointer2, RotateCcw, RotateCw, Save, Share2, SlidersHorizontal, X } from 'lucide-react';
import { finishes, getShowcase, industries, products } from '../catalog/catalog';
import type { ClientDefinition, ProductDefinition, ShowcasePlan } from '../catalog/types';
import { decodePlan, defaultPlan, readSavedPlan, savePlan, shareUrl } from '../features/sharing/plan';
import { ProductViewer } from '../viewer/ProductViewer';
import type { ProductViewerHandle } from '../viewer/ProductViewer';
import type { LayerVisibility, SceneLayer } from '../scenarios/sceneTypes';
import { CadInspectionPanel } from './CadInspectionPanel';
import { ConstructionSitePanel } from './ConstructionSitePanel';
import type { InspectionResult } from '../scenarios/interior/mountAssessment';
import { publicAssetUrl } from '../utils/publicAssetUrl';
import './showroom.css';

function Modal({ children, title, onClose }: { children: ReactNode; title: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="showroom-dialog" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div className="dialog-heading"><h2>{title}</h2><button className="icon-button" aria-label="关闭弹窗" onClick={onClose}><X size={20} /></button></div>{children}</dialog>;
}

export function ShowcaseRoute() {
  const { clientId = '', productId = '' } = useParams();
  const location = useLocation();
  const showcase = getShowcase(clientId, productId);
  if (!showcase) return <div className="showroom-app not-found"><Layers3 size={40} /><h1>没有找到这个展示</h1><p>商品可能已调整，或不属于当前展示目录。</p><Link className="solid-button" to="/">返回展示首页 <ArrowUpRight size={16} /></Link></div>;
  return <ShowcasePage key={`${clientId}:${productId}:${location.search}`} {...showcase} />;
}

function ShowcasePage({ client, product }: { client: ClientDefinition; product: ProductDefinition }) {
  const isCad = product.model.kind === 'cad';
  const isBuilding = product.model.kind === 'construction-cad';
  const [buildingLevels, setBuildingLevels] = useState(['ground', 'upper']);
  const [buildingElement, setBuildingElement] = useState<string>();
  const [buildingPlan, setBuildingPlan] = useState(false);
  const [planLevel, setPlanLevel] = useState('upper');
  const isSite = product.model.kind === 'construction-site';
  const [searchParams] = useSearchParams();
  const design = searchParams.get('design');
  const shared = decodePlan(design, client.id, product);
  const [plan, setPlan] = useState<ShowcasePlan>(() => shared ?? readSavedPlan(client.id, product) ?? defaultPlan(client.id, product));
  const [selected, setSelected] = useState(product.surfaces[0].id);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cutaway, setCutaway] = useState(isCad);
  const defaultLayers: LayerVisibility = { furniture: true, labels: true, finishes: true, ceiling: false, drawing: false, electrical: false, plumbing: false, risk: false };
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(defaultLayers);
  const [xray, setXray] = useState(false);
  const [inspection, setInspection] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<InspectionResult | null>(null);
  const [compare, setCompare] = useState(false);
  const [notice, setNotice] = useState(design && !shared ? '分享方案无效，已打开本地方案或默认方案。' : shared ? '已载入分享的配置方案。' : '');
  const [dialog, setDialog] = useState<'share' | 'summary' | null>(null);
  const viewer = useRef<ProductViewerHandle>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const surface = product.surfaces.find(item => item.id === selected)!;
  const currentFinish = finishes.find(item => item.id === plan.finishes[selected])!;
  const industry = industries.find(item => item.id === product.industry)!;
  const shownPlan = compare ? defaultPlan(client.id, product) : plan;
  useEffect(() => { document.title = `${product.name} · ${client.name} | 形见`; return () => { document.title = '形见 · 企业方案展示中心'; }; }, [client.name, product.name]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 4500); return () => window.clearTimeout(timer); }, [notice]);
  const setFinish = (id: string) => {
    setCompare(false);
    setPlan(previous => ({ ...previous, finishes: { ...previous.finishes, [selected]: id } }));
  };
  const reset = () => {
    setBuildingLevels(['ground', 'upper']); setBuildingPlan(false); setBuildingElement(undefined); setPlan(defaultPlan(client.id, product)); setCompare(false); setCutaway(isCad); setAutoRotate(false); setLayerVisibility(defaultLayers); setXray(false); setInspection(false); setInspectionResult(null); viewer.current?.resetCamera(); setNotice('已还原默认方案。');
  };
  const toggleLayer = (id: SceneLayer, enabled: boolean) => {
    setLayerVisibility(previous => ({ ...previous, [id]: enabled }));
    if (enabled && (id === 'electrical' || id === 'plumbing')) { setXray(true); setAutoRotate(false); }
  };
  const toggleInspection = () => {
    const enabled = !inspection; setInspection(enabled); setXray(enabled); setAutoRotate(false); setCutaway(!enabled); setInspectionResult(null);
    setLayerVisibility(enabled ? { furniture: false, labels: false, finishes: false, ceiling: false, drawing: false, electrical: true, plumbing: true, risk: true } : defaultLayers);
    viewer.current?.resetCamera();
  };
  const screenshot = () => {
    try {
      const image = viewer.current?.capture();
      if (!image) throw new Error();
      const anchor = document.createElement('a'); anchor.href = image; anchor.download = `${product.id}-${compare ? 'default' : 'design'}.png`; anchor.click();
      setNotice('展示图片已导出。');
    } catch { setNotice('图片导出失败，请等待模型加载完成后重试。'); }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl(plan)); setNotice('方案链接已复制，可发送给客户。'); }
    catch { setNotice('暂时无法自动复制，请选中链接后手动复制。'); }
  };
  const exportPlan = () => {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${product.id}-plan.json`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className={`showroom-app showcase-page ${isCad ? 'cad-model' : ''} ${isSite ? 'construction-model' : ''} ${isBuilding ? 'construction-cad-model' : ''}`} style={{ '--showroom-accent': client.accent } as CSSProperties}>
      <header className="showroom-header">
        <Link to="/" className="showroom-brand"><span className="client-symbol">{client.initials}</span><span>{client.name}<span className="brand-en">{client.tagline}</span></span></Link>
        <nav aria-label="展示导航"><Link to="/" className="plain-link"><ArrowLeft size={15} />全部演示</Link><button className="outline-button" onClick={() => setDialog('share')}><Share2 size={15} />分享方案</button></nav>
      </header>
      <main className="showcase-main">
        <div className="showcase-intro"><div><span className="eyebrow">{industry.english} / INTERACTIVE SHOWCASE</span><h1>{product.name}</h1><p>{product.description}</p></div><nav className="industry-tabs" aria-label="切换行业演示">{industries.map(item => <Link key={item.id} to={`/showcase/${item.clientId}/${item.productId}`} className={item.id === product.industry ? 'active' : ''} aria-current={item.id === product.industry ? 'page' : undefined}>{item.name}</Link>)}</nav></div>
        {client.productIds.length > 1 && <label className="product-picker">切换商品 <select value={product.id} onChange={event => { window.location.hash = `/showcase/${client.id}/${event.target.value}`; }}>{client.productIds.map(id => <option key={id} value={id}>{products.find(item => item.id === id)?.name}</option>)}</select><ChevronDown size={14} /></label>}
        {isBuilding && <div className="cad-scope-banner" role="note"><strong>IFG BLC1 · R00 设计图重建</strong><span>两层主体 · 门窗净洞 · 中庭保留</span><small>二层 FF 3.37 m 为准入试验解释；原 +3.24 标高文字冲突保留。</small></div>}
        {isSite && <div className="site-warning" role="note"><strong>教学样例 · 比例暂定 · 高度示意</strong><span>暂定 80×80 m；独立尺寸控制 0 处。实际高度全部未知，仅展示边界与六设施足迹。</span></div>}
        <div className="showcase-workspace">
          <section className="viewport-panel" ref={viewport} aria-label="商品三维展示">
            <div className="viewport-topline"><span className="live-badge"><span className="status-dot" />实时预览</span><span className="model-badge">{isBuilding ? '真实设计 CAD · 米制 / Y 向上' : isSite ? '教学 · 比例暂定 / 高度示意' : isCad ? 'CAD 实图建模 · 米' : product.demo ? '示意模型' : '商品模型'}</span></div>
            <ProductViewer ref={viewer} product={product} plan={shownPlan} visibleLevelIds={isBuilding ? buildingLevels : undefined} selectedElementId={isBuilding ? buildingElement : undefined} onElementSelect={isBuilding ? setBuildingElement : undefined} selectedSurfaceId={compare || inspection ? undefined : selected} autoRotate={autoRotate} cutaway={cutaway} layerVisibility={layerVisibility} xray={xray} inspection={inspection} onInspect={setInspectionResult} onSelect={id => { setSelected(id); setCompare(false); }} />
            {isBuilding && <><div className="cad-view-switch building-view-switch"><button onClick={() => { setAutoRotate(false); setBuildingLevels(['ground', 'upper']); setCutaway(false); viewer.current?.resetCamera(); }}>总览</button><button className={buildingLevels.length === 1 && buildingLevels[0] === 'ground' ? 'active' : ''} onClick={() => { setBuildingLevels(['ground']); setBuildingElement(undefined); setPlanLevel('ground'); }}>一层</button><button className={buildingLevels.length === 1 && buildingLevels[0] === 'upper' ? 'active' : ''} onClick={() => { setBuildingLevels(['upper']); setBuildingElement(undefined); setPlanLevel('upper'); }}>二层</button><button className={cutaway ? 'active' : ''} aria-pressed={cutaway} onClick={() => setCutaway(v => !v)}>低位剖切</button><button onClick={() => { setAutoRotate(false); setCutaway(true); viewer.current?.topView(); }}>俯视</button><button className={buildingPlan ? 'active' : ''} aria-pressed={buildingPlan} onClick={() => setBuildingPlan(v => !v)}>二维对照</button></div>{buildingPlan && <div className="building-plan-compare"><div><strong>源线与重建墙投影</strong><select aria-label="二维对照楼层" value={planLevel} onChange={e => setPlanLevel(e.target.value)}><option value="ground">一层</option><option value="upper">二层</option></select><button aria-label="关闭二维对照" onClick={() => setBuildingPlan(false)}><X size={15} /></button></div><img alt={`IFG ${planLevel === 'ground' ? '一层' : '二层'} CAD 来源线与墙体、中庭楼梯空洞对照`} src={publicAssetUrl(`/models/construction-cad/ifg-classroom/plan-${planLevel}.svg`)} /><small>灰：源线 · 蓝绿：合并墙投影 · 红：上层空洞；开口按竖向分带扣除。</small></div>}</>}
            {isCad && <div className="cad-view-switch"><button className={!cutaway ? 'active' : ''} aria-pressed={!cutaway} onClick={() => { setCutaway(false); viewer.current?.resetCamera(); }}>完整墙体</button><button className={cutaway ? 'active' : ''} aria-pressed={cutaway} onClick={() => setCutaway(true)}>剖切查看</button><button onClick={() => { setCutaway(true); viewer.current?.topView(); }}>俯视核对</button></div>}
            {isSite && <div className="cad-view-switch site-view-switch"><button onClick={() => { setAutoRotate(false); viewer.current?.resetCamera(); }}>总览体块</button><button onClick={() => { setAutoRotate(false); viewer.current?.topView(); }}>俯视核对</button></div>}
            <div className="viewport-selection"><MousePointer2 size={14} /><span>{compare ? '正在查看默认方案' : isBuilding ? `当前视图：${buildingLevels.length === 1 ? buildingLevels[0] === 'upper' ? '二层' : '一层' : '两层总览'}` : `当前区域：${surface.name}`}</span></div>
            <div className="viewport-toolbar"><div className="view-tools"><button className={autoRotate ? 'active' : ''} title="自动旋转" aria-label="自动旋转" aria-pressed={autoRotate} onClick={() => setAutoRotate(value => !value)}><RotateCw size={17} /></button><button title="复位视角" aria-label="复位视角" onClick={() => viewer.current?.resetCamera()}><RotateCcw size={17} /></button>{product.features.cutaway && <><button title="隐藏墙体" aria-label="隐藏墙体" aria-pressed={cutaway} className={cutaway ? 'active' : ''} onClick={() => setCutaway(value => !value)}>{cutaway ? <EyeOff size={17} /> : <Eye size={17} />}</button><button title="俯视户型" aria-label="俯视户型" onClick={() => viewer.current?.topView()}><Layers3 size={17} /></button></>}<span className="toolbar-separator" /><button title="全屏展示" aria-label="全屏展示" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else if (viewport.current?.requestFullscreen) void viewport.current.requestFullscreen().catch(() => setNotice('当前浏览器无法进入全屏。')); else setNotice('当前浏览器不支持全屏展示。'); }}><Maximize size={17} /></button><button title="导出图片" aria-label="导出图片" onClick={screenshot}><Download size={17} /></button></div><span className="viewer-hint">拖动旋转 · 滚轮缩放 · 点击选区</span></div>
          </section>
          <aside className="configuration-panel" aria-label="方案配置">
            <div className="configuration-heading"><SlidersHorizontal size={17} /><h2>{isBuilding ? '建筑与设计依据' : isSite ? '设施与来源核对' : isCad ? '空间与材质配置' : '方案配置'}</h2><span>LIVE</span></div>
            {isBuilding && product.model.kind === 'construction-cad' && <ConstructionCadPanel url={product.model.url} elementId={buildingElement} onElement={setBuildingElement} />}
            {isCad && <CadInspectionPanel layers={layerVisibility} onLayer={toggleLayer} xray={xray} onXray={setXray} inspection={inspection} onInspection={toggleInspection} result={inspectionResult} onHeight={height => viewer.current?.inspectHeight(height)} />}
            {isSite && <ConstructionSitePanel selected={selected} onSelect={id => { setSelected(id); setCompare(false); }} />}
            <div className="configuration-section"><div className="step-heading"><span>{isBuilding ? '02' : '01'}</span><h3>{isBuilding ? '展示材质区域' : '选择区域'}</h3><small>{product.surfaces.length} 个可选区域</small></div><div className="surface-grid">{product.surfaces.map(item => <button key={item.id} className={`surface-button ${selected === item.id ? 'selected' : ''}`} aria-pressed={selected === item.id} onClick={() => { setSelected(item.id); setCompare(false); }}><span className="surface-dot" style={{ background: finishes.find(finish => finish.id === plan.finishes[item.id])?.color }} />{item.name}{selected === item.id && <Check size={14} />}</button>)}</div><p className="surface-description">{surface.description}</p></div>
            <div className="configuration-section finish-section"><div className="step-heading"><span>{isBuilding ? '03' : '02'}</span><h3>{isBuilding ? '展示颜色' : isSite ? '示意展示颜色' : '选择材质与颜色'}</h3></div><div className="finish-grid">{surface.finishIds.map(id => {
              const finish = finishes.find(item => item.id === id)!;
              return <button key={id} className={`finish-button ${plan.finishes[selected] === id ? 'selected' : ''}`} aria-pressed={plan.finishes[selected] === id} aria-label={`选择${finish.name}`} onClick={() => setFinish(id)}><span className={`finish-swatch pattern-${finish.pattern ?? 'solid'}`} style={{ '--swatch-color': finish.color } as CSSProperties}>{plan.finishes[selected] === id && <Check size={18} />}</span><span>{finish.name}</span></button>;
            })}</div><div className="finish-description"><strong>{currentFinish.name}</strong><span>{currentFinish.detail}</span></div>{product.industry === 'vehicle-wrap' && <button className="apply-all" onClick={() => { setPlan(previous => ({ ...previous, finishes: Object.fromEntries(product.surfaces.map(item => [item.id, item.finishIds.includes(currentFinish.id) ? currentFinish.id : previous.finishes[item.id]])) })); setCompare(false); }}><CheckCheck size={14} />将此膜材应用至整车</button>}</div>
            {product.features.label && <div className="configuration-section"><div className="step-heading"><span>03</span><h3>品牌文字</h3></div><label className="brand-input-label" htmlFor="brand-text">标签上的品牌名称</label><input className="brand-text-input" id="brand-text" value={plan.label} maxLength={24} placeholder="输入品牌名称" onChange={event => { setPlan(previous => ({ ...previous, label: event.target.value })); setCompare(false); }} /><span className="input-hint">最多 24 个字符，实时更新标签</span></div>}
            {isCad && <details className="cad-evidence"><summary><FileText size={14} />立面核对与图纸依据<ChevronDown size={14} /></summary><p>装修净高：客餐厅及厨卫 2.40 m，卧室与书房 2.42 m；厨房台面 0.82 m，室内门高 2.10 m。</p><p>厨房窗台 / 窗高 1.00 / 1.30 m；客厅长窗下口 / 框高约 0.682 / 1.65 m，来自立面线形量取。原建筑窗未给出独立窗表的部分继续保留待确认标记。</p><p>客餐厅 600×600 地砖，卧室、书房实木地板，厨卫 300×300 地砖与 300×600 墙砖。成品家具、选样颜色和部分细节仍为示意。</p><a href={publicAssetUrl('/models/c108/evidence/living-elevations.png')} target="_blank" rel="noreferrer">核对客厅立面 <ArrowUpRight size={12} /></a><a href={publicAssetUrl('/models/c108/evidence/kitchen-elevations.png')} target="_blank" rel="noreferrer">核对厨房立面 <ArrowUpRight size={12} /></a><a href={publicAssetUrl('/models/c108/evidence/bedroom-elevations.png')} target="_blank" rel="noreferrer">核对卧室立面 <ArrowUpRight size={12} /></a><a href={publicAssetUrl('/models/c108/evidence/plumbing-systems.png')} target="_blank" rel="noreferrer">核对给排水系统标高 <ArrowUpRight size={12} /></a><a href={publicAssetUrl('/models/c108/model-notes.html')} target="_blank" rel="noreferrer">完整尺寸、材料与采用值 <ArrowUpRight size={12} /></a></details>}
            <div className="configuration-actions"><button className={`comparison-button ${compare ? 'selected' : ''}`} aria-pressed={compare} onClick={() => setCompare(value => !value)}><Eye size={16} />{compare ? '返回当前方案' : '对比默认方案'}</button><div className="save-reset-row"><button className="solid-button" onClick={() => setNotice(savePlan(plan) ? '方案已保存到当前浏览器。' : '当前浏览器无法保存，请通过分享链接保留方案。')}><Save size={15} />保存方案</button><button className="outline-button" onClick={reset}><RotateCcw size={15} />还原</button></div><p className="local-save-note">方案保存在本机，分享链接可保留当前配置。</p>{isCad && <><a className="cad-download" href={publicAssetUrl('/models/c108/apartment.glb')} download="C户型-108方-标准层.glb"><Download size={14} />下载装修模型 · GLB<ArrowUpRight size={13} /></a><a className="cad-download" href={publicAssetUrl('/models/c108/apartment-services.glb')} download="C户型-108方-标准层-含水电.glb"><Download size={14} />下载含三维水电模型 · GLB<ArrowUpRight size={13} /></a></>}</div>
          </aside>
        </div>
        <div className="showcase-bottom"><p><span className="status-dot" />{isBuilding ? '源自 IFG BLC1 R00 真实设计资料 · 两层主体试验模型；颜色为展示设置，待核对项见来源面板。' : isSite ? '教学样例 · 比例暂定 · 高度示意；非实测或签发施工模型。' : isCad ? '依据提供的 CAD 建模 · 108 方为原图户型名称，空间尺寸以图纸标注为准。' : product.demo ? '当前为外观示意，颜色与材质以实物为准。' : '展示效果供方案沟通参考，颜色与材质以实物为准。'}</p>{client.contact ? <a className="plain-link" href={client.contact.url} target="_blank" rel="noreferrer">{client.contact.label}<ArrowUpRight size={15} /></a> : <button className="plain-link" onClick={() => setDialog('summary')}><FileText size={15} />查看方案摘要 <ArrowUpRight size={15} /></button>}</div>
      </main>
      {notice && <div className="showroom-toast" role="status"><Check size={16} />{notice}</div>}
      {dialog && <Modal title={dialog === 'share' ? '分享方案' : '方案摘要'} onClose={() => setDialog(null)}><p className="dialog-description">{client.name} / {product.name}</p><dl className="plan-summary">{product.surfaces.map(item => <div key={item.id}><dt>{item.name}</dt><dd><span className="surface-dot" style={{ background: finishes.find(finish => finish.id === plan.finishes[item.id])?.color }} />{finishes.find(finish => finish.id === plan.finishes[item.id])?.name}</dd></div>)}{product.features.label && <div><dt>品牌文字</dt><dd>{plan.label || '未填写'}</dd></div>}</dl>{dialog === 'share' && <><label className="brand-input-label" htmlFor="share-url">包含当前配置的分享链接</label><input id="share-url" className="share-url" readOnly value={shareUrl(plan)} onFocus={event => event.target.select()} /><button className="solid-button dialog-primary" onClick={() => void copyLink()}><Copy size={16} />复制方案链接</button><p className="local-save-note">客户可直接打开，无需登录。链接不包含图片或个人资料。</p></>}{notice && <p className="dialog-notice" role="status">{notice}</p>}<button className="outline-button dialog-secondary" onClick={exportPlan}><Download size={15} />下载方案文件</button></Modal>}
    </div>
  );
}
