import {useEffect, useState} from 'react';
import {Theme} from '@astryxdesign/core/theme';
import {gothicTheme} from '@astryxdesign/theme-gothic';
import {neutralTheme} from '@astryxdesign/theme-neutral';
import {StoreProvider} from './store';
import {Home} from './pages/Home';
import {TeacherApp} from './teacher/TeacherApp';
import {StudentApp} from './student/StudentApp';

function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash.replace(/^#/, '') || '/';
}

export default function App() {
  const route = useHashRoute();

  let content;
  let theme = neutralTheme;
  let mode: 'light' | 'dark' = 'light';

  if (route.startsWith('/teacher')) {
    theme = gothicTheme;
    mode = 'dark'; // gothic 为 dark-only 主题
    content = <TeacherApp />;
  } else if (route.startsWith('/student')) {
    content = <StudentApp />;
  } else {
    content = <Home />;
  }

  return (
    <Theme theme={theme} mode={mode}>
      <StoreProvider>{content}</StoreProvider>
    </Theme>
  );
}
