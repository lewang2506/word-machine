import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// Astryx 样式接线：index.css 只静态引入 core 的 reset → astryx 两层；
// 主题 token 由 App.tsx 中的 <Theme> provider 按当前选中主题运行时注入，
// 因此这里不再额外包一层固定 neutral 的 Theme（避免 <html> 上的主题属性
// 被钉死为 neutral，导致滚动条等原生外观不随切换变化）。
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
