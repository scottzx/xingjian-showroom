import { ArrowDown, ArrowUpRight, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clients, industries, products } from '../catalog/catalog';
import { defaultPlan } from '../features/sharing/plan';
import { ProductViewer } from '../viewer/ProductViewer';
import './showroom.css';

export function ShowroomHome() {
  return (
    <div className="showroom-app showroom-home">
      <header className="showroom-header">
        <Link to="/" className="showroom-brand"><span className="brand-symbol"><Layers3 size={23} /></span><span>形见<span className="brand-en">SHOWROOM</span></span></Link>
        <nav aria-label="主导航"><span className="header-caption">企业方案展示中心</span><Link to="/editor/free" className="plain-link">图案工作台 <ArrowUpRight size={15} /></Link></nav>
      </header>
      <main>
        <section className="showroom-hero">
          <div className="hero-copy"><span className="eyebrow">企业方案展示中心</span><h1>让方案展示，<br /><span>更直观、更专业。</span></h1><p>通过三维演示、材质配置与方案分享，支持企业间的方案沟通。</p><button className="solid-button" onClick={() => document.getElementById('industry-demos')?.scrollIntoView({ behavior: 'smooth' })}>查看行业方案 <ArrowDown size={16} /></button></div>
          <aside className="hero-note" aria-label="展示能力"><span className="eyebrow">方案沟通能力</span><ul><li><strong>三维演示</strong><span>查看空间、部件与商品外观</span></li><li><strong>材质配置</strong><span>按区域核对材质与颜色</span></li><li><strong>方案分享</strong><span>保存本机方案，通过链接恢复</span></li></ul></aside>
        </section>
        <section id="industry-demos" className="industry-section" aria-label="行业演示">
          <div className="section-heading"><div><span className="eyebrow">INDUSTRY SOLUTIONS</span><h2>行业演示方案</h2></div><span className="section-hint">演示目录 · 无需登录</span></div>
          <div className="industry-grid">
            {industries.flatMap(industry => {
              const client = clients.find(item => item.id === industry.clientId)!;
              return client.productIds.map(id => ({ industry, client, product: products.find(item => item.id === id)! }));
            }).map(({ industry, client, product }, index) => {
              return <Link className={`industry-card card-${industry.id}`} key={product.id} to={`/showcase/${client.id}/${product.id}`}>
                <div className="industry-preview"><ProductViewer product={product} plan={defaultPlan(client.id, product)} interactive={false} /><span className="preview-number">0{index + 1}</span><span className="preview-pill">交互演示 <ArrowUpRight size={13} /></span></div>
                <div className="industry-card-copy"><span className="eyebrow">{industry.english}</span><div className="card-title-row"><h3>{product.name}</h3><span className="card-arrow"><ArrowUpRight size={22} /></span></div><p>{product.description}</p><span className="card-detail">{product.subtitle}</span></div>
              </Link>;
            })}
          </div>
        </section>
        <section className="showroom-bottom-note"><div className="bottom-note-icon"><Layers3 size={26} /></div><div><h3>支持企业间的方案沟通</h3><p>按区域配置材质，保存当前方案，并通过链接与客户核对。</p></div><span>三维演示 · 材质配置 · 方案分享</span></section>
      </main>
      <footer className="showroom-footer"><span>形见 SHOWROOM</span><span>当前为示意商品与演示品牌，可接入实际商品。</span><span>为方案演示与沟通提供参考。</span></footer>
    </div>
  );
}
