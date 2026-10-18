import { useEffect, useState } from 'react';
import { ArrowUpRight, Download, FileText } from 'lucide-react';
import type { ConstructionSite } from '../scenarios/construction-site/types';

const base = '/models/construction-site';

export function ConstructionSitePanel({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const [data, setData] = useState<ConstructionSite | null>(null);
  const [error, setError] = useState('');
  const [raw, setRaw] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${base}/site.json`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('来源数据加载失败');
      return response.json() as Promise<ConstructionSite>;
    }).then(setData).catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, []);
  if (error) return <p role="alert" className="site-source-panel">{error}</p>;
  if (!data) return <p className="site-source-panel" role="status">正在读取设施来源…</p>;
  const facility = data.facilities.find(item => item.id === selected) ?? data.facilities[0];
  const dimensions = facility.adoptedDimensionsMeters;
  const cadXs = facility.cadPoints.map(point => point[0]), cadYs = facility.cadPoints.map(point => point[1]);
  return <section className="site-source-panel" aria-label="施工场地来源核对">
    <div className="step-heading"><FileText size={16} /><h3>来源核对</h3><small>六设施 · handle 可追溯</small></div>
    <div className="site-plan-switch"><button aria-pressed={!raw} onClick={() => setRaw(false)}>足迹定位</button><button aria-pressed={raw} onClick={() => setRaw(true)}>原 CAD 二维</button></div>
    {raw ? <a href={`${base}/raw-plan.svg`} target="_blank" rel="noreferrer"><img className="site-raw-plan" src={`${base}/raw-plan.svg`} alt="原CAD全部34图元二维预览，含图框与图签；未校正比例" /></a> : <svg className="site-plan" viewBox="-5 -8 90 95" role="group" aria-label="六设施平面定位，可点选；CAD正Y向上，非已知北向">
      <text x="0" y="-3" fontSize="2.6" fill="var(--muted)">CAD +Y ↑ · 非北向 · 暂定 80×80 m</text>
      <path d="M0 0H80V80H0Z" fill="var(--brand-soft)" stroke="var(--brand-accent-line)" strokeWidth=".35" />
      {data.facilities.map(item => {
        const x = item.localMetersPoints.reduce((sum, p) => sum + p[0], 0) / item.localMetersPoints.length;
        const y = 80 - item.localMetersPoints.reduce((sum, p) => sum + p[1], 0) / item.localMetersPoints.length;
        return <g key={item.id} role="button" tabIndex={0} aria-label={`定位${item.id} ${item.nameZh}`} aria-pressed={item.id === selected} onClick={() => onSelect(item.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(item.id); } }}>
          <polygon points={item.localMetersPoints.map(p => `${p[0]},${80 - p[1]}`).join(' ')} fill={item.displayColor} stroke={item.id === selected ? 'var(--showroom-accent)' : 'var(--brand-accent-line)'} strokeWidth={item.id === selected ? .7 : .25} />
          <circle cx={x} cy={y} r="2.5" fill="transparent" />
          <text x={x + 1} y={y - 2} fontSize="3" fontWeight="600" fill="var(--ink)" paintOrder="stroke" stroke="white" strokeWidth=".8">{item.id}</text>
        </g>;
      })}
    </svg>}
    <strong className="site-facility-title">{facility.id} · {facility.nameZh} <small>{facility.nameOriginal}</small></strong>
    <dl className="site-facts">
      <div><dt>源轮廓 handle</dt><dd>{facility.source.footprintHandle} · {facility.source.layer}</dd></div>
      <div><dt>名称 / 面积文字</dt><dd>{facility.source.nameTextHandle} / {facility.source.areaTextHandle}</dd></div>
      <div><dt>原 CAD 平面尺寸</dt><dd>{(Math.max(...cadXs) - Math.min(...cadXs)).toFixed(4)} × {(Math.max(...cadYs) - Math.min(...cadYs)).toFixed(4)} CAD u</dd></div>
      <div><dt>暂定平面尺寸</dt><dd>{dimensions.width.toFixed(2)} × {dimensions.depth.toFixed(2)} m</dd></div>
      <div><dt>暂定足迹面积</dt><dd>{dimensions.area.toFixed(3)} m²</dd></div>
      <div><dt>实际高度</dt><dd>未知 · 原图未提供</dd></div>
      <div><dt>{facility.representation === 'flat-zone' ? '区域展示厚度' : '通用体块展示高度'}</dt><dd>{facility.displayHeight.toFixed(2)} m · 示意</dd></div>
    </dl>
    <p className="site-unknowns">待确认：{facility.unknowns.join('、')}。</p>
    <details className="site-provenance"><summary>原 CAD 顶点坐标 · 未换算</summary><pre className="site-hash">{facility.cadPoints.map(point => `(${point.map(value => value.toFixed(6)).join(', ')})`).join('\n')}</pre><p>轮廓来自几何量取；名称与翻译来自人工对应；米制尺寸为暂定换算；竖向体块、材料与颜色均为展示示意。</p></details>
    <details className="site-provenance"><summary>比例冲突与可逆变换</summary><p>CAD 边界 handle 41 为 220×220。按作者配套输入暂定 80×80 m，缩放 80/220。INSUNITS=6 与静态图签 1:100 均不直接采用。独立尺寸控制为 0，面积文字与几何同源，尺寸未验证。</p><p>原点 CAD (10,10)；平面 XY → XZ，Y 为展示竖向。X=(CAD_X−10)×80/220−40；Z=40−(CAD_Y−10)×80/220。逆变换和原坐标保存在下载数据中。高程基准与北向未知。</p><p>来源版本：{data.source.repositoryCommit}</p><p className="site-hash">DXF SHA-256：{data.source.sha256}</p><a href={data.source.url} target="_blank" rel="noreferrer">作者固定版本来源 <ArrowUpRight size={12} /></a><p>来源许可未知，仅本轮本机/组网教学流程试验，不推断商用或再分发授权。</p></details>
    <div className="site-downloads"><a href={`${base}/site.glb`} download="施工场地-教学示意.glb"><Download size={14} />默认示意模型 GLB</a><a href={`${base}/site.json`} download="施工场地-来源模型.json"><Download size={14} />模型与来源 JSON</a><a href={`${base}/model-notes.html`} target="_blank" rel="noreferrer">完整来源与未知项 <ArrowUpRight size={13} /></a></div>
    <p className="local-save-note">下载为默认示意体块；网页颜色配置可另存方案。仅包含边界与六足迹，空地不代表道路或可施工空间。</p>
  </section>;
}
