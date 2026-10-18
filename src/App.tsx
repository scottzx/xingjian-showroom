import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ShowroomHome } from './pages/ShowroomHome';

const ShowcaseRoute = lazy(() => import('./pages/ShowcasePage').then(module => ({ default: module.ShowcaseRoute })));
const LegacyApp = lazy(() => import('./LegacyApp'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return <HashRouter><ScrollToTop /><Suspense fallback={<div className="showroom-app viewer-state" role="status">正在打开展示空间…</div>}><Routes>
    <Route path="/" element={<ShowroomHome />} />
    <Route path="/showcase/:clientId/:productId" element={<ShowcaseRoute />} />
    <Route path="/*" element={<LegacyApp />} />
  </Routes></Suspense></HashRouter>;
}
