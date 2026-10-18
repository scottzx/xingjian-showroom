import { Layers3, MousePointer2, ScanLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LayerVisibility, SceneLayer } from '../scenarios/sceneTypes';
import type { InspectionResult } from '../scenarios/interior/mountAssessment';

interface Props {
  layers: LayerVisibility; onLayer: (id: SceneLayer, enabled: boolean) => void;
  xray: boolean; onXray: (value: boolean) => void;
  inspection: boolean; onInspection: () => void;
  result: InspectionResult | null; onHeight: (height: number) => void;
}
const layers: { id: SceneLayer; name: string; color: string }[] = [
  { id: 'furniture', name: '家具布置', color: '#997e5f' }, { id: 'labels', name: '房间名称', color: '#5a7368' },
  { id: 'finishes', name: '装修细节', color: '#c3b89e' }, { id: 'ceiling', name: '吊顶净高', color: '#b3c3ae' },
  { id: 'drawing', name: '装饰底图', color: '#64766f' }, { id: 'electrical', name: '三维电气', color: '#d39827' },
  { id: 'plumbing', name: '三维给排水', color: '#378ca4' }, { id: 'risk', name: '待核对范围', color: '#bd8b36' },
];

function MountHeightInput({ height, onHeight }: { height: number; onHeight: Props['onHeight'] }) {
  const value = String(Math.round(height * 1000));
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  return <label className="mount-height-label">离完成地面高度（毫米）<input type="number" min="0" max="3000" step="10" value={draft} onBlur={() => setDraft(value)} onChange={event => {
    const next = event.target.value; setDraft(next);
    if (next !== '' && Number(next) >= 0 && Number(next) <= 3000) onHeight(Number(next) / 1000);
  }} /></label>;
}

export function CadInspectionPanel(props: Props) {
  const assessment = props.result?.kind === 'mount' ? props.result.assessment : undefined;
  return <>
    <div className="configuration-section cad-layer-section">
      <div className="step-heading"><Layers3 size={14} /><h3>CAD 空间与水电图层</h3><small>以 CAD 为依据</small></div>
      <div className="cad-layers">{layers.map(item => <label key={item.id}><span className="surface-dot" style={{ background: item.color }} /><span>{item.name}</span><input type="checkbox" checked={!!props.layers[item.id]} onChange={event => props.onLayer(item.id, event.target.checked)} /><span className="cad-toggle" aria-hidden="true" /></label>)}</div>
      <button className={`cad-xray ${props.xray ? 'selected' : ''}`} aria-pressed={props.xray} onClick={() => props.onXray(!props.xray)}><ScanLine size={14} />{props.xray ? '关闭墙地透视' : '透视墙地 · 查看暗管'}</button>
      {(props.layers.electrical || props.layers.plumbing) && <div className="mep-legend"><span><i style={{ background: '#db9a27' }} />电气</span><span><i style={{ background: '#348cbb' }} />冷水</span><span><i style={{ background: '#d45d54' }} />热水</span><span><i style={{ background: '#69738b' }} />排水</span><p>点位按标注高度；半透明虚线为连接示意或标高未明确的管段。</p></div>}
    </div>
    <div className="configuration-section mounting-section">
      <button className={`cad-mount-button ${props.inspection ? 'active' : ''}`} aria-pressed={props.inspection} onClick={props.onInspection}><MousePointer2 size={15} />{props.inspection ? '退出上墙位置核对' : '上墙固定位置核对'}</button>
      <p className="mounting-note">CAD 为设计依据。未显示管线的地方，也不能直接判断可钻孔；现场还需核对暗管和钢筋。</p>
      {props.inspection && <div className="mount-result" aria-live="polite">
        {!props.result && <p>点击竖直墙面核对位置，或点选彩色点位、管段查看高度与图纸出处。</p>}
        {props.result?.kind === 'instruction' && <p>{props.result.message}</p>}
        {props.result?.kind === 'service' && <><strong>{props.result.label}</strong><span className="inspection-height">{props.result.heightLabel}</span><p>{props.result.details}</p><details><summary>图纸出处</summary>{props.result.source.map((source, i) => <p key={i}>{source}</p>)}</details></>}
        {assessment && <>
          <strong>{assessment.status === 'near-design-service' ? '邻近图纸点位 / 路径' : '未排除隐蔽风险'}</strong>
          <MountHeightInput height={assessment.point[1]} onHeight={props.onHeight} />
          <p>{assessment.message}</p>
          {assessment.candidates.length > 0 && <ul>{assessment.candidates.slice(0, 4).map(item => <li key={item.id}>{item.label}<span>{item.uncertainHeight ? '平面距' : '模型距'} {Math.round(item.distance * 1000)} mm</span></li>)}</ul>}
          <small>红色圆点为本次查询位置。带状核对范围为 150 mm 展示设定，非施工安全间距。未知标高不会因改变查询高度而自动排除。</small>
        </>}
      </div>}
    </div>
  </>;
}
