import './App.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import {
  Route,
  MemoryRouter as Router,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { IntlProvider } from 'react-intl';
import { useEffect } from 'react';
import { CodeEditor, CodeEditorTypesRegister } from './modules/CodeEditor';
import { Page1, Page2, Page3 } from './modules/Pages';
import { ROUTER_PATHS, ROUTER_PATHS_PARAMS } from './modules/Router';

import { IOSetup } from './modules/IOSetup';
import { Index } from './modules/Index';
import IntlMessages from './intl';
import { Root } from './modules/Root';
import { Tabs } from './modules/Tabs';
import { ValuesProvider } from './modules/EngineIntegration';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const MENU_ROUTE_MAP: Record<string, string> = {
  io: ROUTER_PATHS.IO_SETUP,
};

const MenuRouterListener: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const callback = (menuRoute: unknown) => {
      const route = MENU_ROUTE_MAP[menuRoute as string];

      if (route) {
        navigate(route);
      }
    };

    return window.electron.ipcRenderer.on('navigate', callback);
  }, [navigate]);

  return null;
};

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <CodeEditorTypesRegister>
        <IntlProvider locale="en-US" messages={IntlMessages['en-US']}>
          <ValuesProvider>
            <Router>
              <MenuRouterListener />

              <Routes>
                <Route path={ROUTER_PATHS.IO_SETUP} element={<IOSetup />} />
                <Route
                  path={ROUTER_PATHS.CTRL_ROOT}
                  element={<Tabs pageCount={3} />}
                >
                  <Route
                    path={ROUTER_PATHS_PARAMS.CTRL_PAGE(0)}
                    element={<CodeEditor />}
                  />
                  <Route
                    path={ROUTER_PATHS_PARAMS.CTRL_PAGE(1)}
                    element={<Index />}
                  />
                  <Route
                    path={ROUTER_PATHS_PARAMS.CTRL_PAGE(2)}
                    element={<Page1 />}
                  />
                  <Route
                    path={ROUTER_PATHS_PARAMS.CTRL_PAGE(3)}
                    element={<Page2 />}
                  />
                  <Route
                    path={ROUTER_PATHS_PARAMS.CTRL_PAGE(4)}
                    element={<Page3 />}
                  />
                </Route>

                <Route path="/" element={<Root />} />
              </Routes>
            </Router>
          </ValuesProvider>
        </IntlProvider>
      </CodeEditorTypesRegister>
    </ThemeProvider>
  );
}
