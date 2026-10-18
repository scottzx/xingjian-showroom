import { useEffect, useState } from 'react';
import { ArrowUpRight, Download, FileText } from 'lucide-react';
import { loadConstructionCadData } from '../scenarios/construction-cad/createConstructionCad';
import type { ConstructionCadModel } from '../scenarios/construction-cad/types';
interface Props { url: string; elementId?: string; onElement: (id: string) => void }
export function ConstructionCadPanel({ url, elementId, onElement }: Props) {
  const [data, setData] = useState<ConstructionCadModel>(); const [query, setQuery] = useState(''); const [error, setError] = useState(false);
  useEffect(() => { let active = true; void loadConstructionCadData(url).then(d => { if (active) setData(d); }).catch(() => { if (active) setError(true); }); return () => { active = false; }; }, [url]);
  if (!data) return <p className="configuration-section">{error ? '来源数据暂时无法加载，请重新加载页面。' : '正在载入图纸来源…'}</p>;
  const base = url.slice(0, url.lastIndexOf('/') + 1);
  const selected = data.elements.find(e => e.id === elementId) ?? data.openings.find(o => o.id === elementId);
  const sourceOnly = elementId ? data.sourceIndex[elementId] : undefined;
  const refs = selected?.sourceRefs ?? (sourceOnly ? [elementId!] : []);
  const items = [...data.elements.filter(e => e.kind === 'room'), ...data.openings, ...(query ? data.elements.filter(e => e.kind === 'wall' && `${e.id} ${e.sourceRefs.join(' ')}`.toLowerCase().includes(query.toLowerCase())) : [])].filter(e => !query || `${e.id} ${'tag' in e ? e.tag : ''} ${e.sourceRefs.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="construction-cad-panel">
    <div className="cad-project-facts"><span>IFG / BLC1 / R00</span><strong>两层建筑主体</strong><p>一层 FF 0 · 净高 3.00 m<br />二层 FF 3.37 · 净高 3.24 m</p><small>二层标高为已准入试验解释。原剖面 +3.24 文字冲突仍待核对。</small></div>
    <div className="configuration-section"><div className="step-heading"><span>01</span><h3>构件与区域来源</h3></div><p className="surface-description">点击三维墙体、地面或窗，或按构件编号 / 源 handle 查询。</p><input aria-label="查找源构件" className="cad-source-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="如 upper-room、17ED3" /><select aria-label="选择来源构件或区域" className="cad-source-select" value={selected?.id ?? ''} onChange={e => onElement(e.target.value)}><option value="">选择区域 / 门窗</option>{selected && !items.some(e => e.id === selected.id) && <option value={selected.id}>{selected.id}</option>}{items.map(e => <option key={e.id} value={e.id}>{e.levelId === 'ground' ? '一层' : '二层'} · {'tag' in e ? String(e.tag) : e.kind === 'wall' ? '墙体' : '净地面'} · {e.id}</option>)}</select>
      {elementId && <div className="cad-selected-source"><strong>{elementId}</strong><p>{selected ? ('basis' in selected ? String(selected.basis) : `${selected.tag} · ${selected.status === 'cut-3d' ? '源足迹实际扣洞' : '轴线未定，仅保留源平面'}`) : '源平面构件 · 高度未准入'}</p>{selected && 'y0' in selected && <p>采用竖向范围 {String(selected.y0)}–{String(selected.y1)} m</p>}{selected && 'height' in selected && <p>源标注宽 {String(selected.width)} · 高 {String(selected.height)} · 窗台 {String(selected.sill)} m</p>}{selected && 'heightSource' in selected && <p>高度依据：{String(selected.heightSource)}<br />标注来源：{String(selected.tagSourceId ?? '源缓存表映射')}</p>}<details><summary><FileText size={13} />查看 {refs.length} 项来源与变换</summary><p>原 DWG SHA256：{data.source.sha256}</p>{refs.map(id => <div className="cad-source-record" key={id}><strong>{id}</strong><pre>{JSON.stringify(data.sourceIndex[id] ?? { sourceRef: id }, null, 2)}</pre></div>)}</details></div>}
    </div>
    <details className="cad-evidence"><summary>建模范围与待核对项</summary><p>30 个源墙闭合轮廓、350 组经本轮几何校核的墙边候选合并；39 个净地面轮廓。167 个门窗按源足迹及竖向高度实际扣洞，2 个保留平面。</p><p>0.37 m 仅为层间构造带。4 cm 薄地面与台阶厚度为展示设置；楼板精确边界、纯混凝土厚度、平台结构界面未知。踏步采用源线，逐级高度为试验插值。</p><p>上层中庭及楼梯排除区保持真实空洞。屋面、坡道、MEP 与钢筋未建模。</p><p>真实历史设计资料；未作现场实测或当前施工状态认证。3 个 JA200 表内标注未配对，数量不作工程量。</p><a href={data.source.url} target="_blank" rel="noreferrer">官方资料出处<ArrowUpRight size={12} /></a><a href={`${base}model-notes.html`} target="_blank" rel="noreferrer">采用值与完整局限<ArrowUpRight size={12} /></a></details>
    <div className="configuration-section cad-model-downloads"><a className="cad-download" href={`${base}building.glb`} download="IFG-BLC1-R00-two-storeys.glb"><Download size={14} />完整两层模型 · GLB</a><a className="cad-download" href={url} download="IFG-BLC1-R00-model.json"><Download size={14} />几何与来源 · JSON</a><small>下载由完整独立场景生成，包含两层；与当前楼层显隐、剖切状态无关。</small></div>
  </div>;
}
