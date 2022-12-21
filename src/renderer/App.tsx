import './App.css';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import {
  MemoryRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

import { useEffect } from 'react';
import { Tabs } from './modules/Tabs';
import { ROUTER_PATHS, ROUTER_PATHS_PARAMS } from './modules/Router';
import { Index } from './modules/Index';
import { Page1 } from './modules/Pages';
import IntlMessages from './intl';
import { ValuesProvider } from './modules/EngineIntegration';
import { IOSetup } from './modules/IOSetup';
import { Root } from './modules/Root';

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
      <IntlProvider locale="en-US" messages={IntlMessages['en-US']}>
        <ValuesProvider>
          <Router>
            <MenuRouterListener />

            <Routes>
              <Route path={ROUTER_PATHS.IO_SETUP} element={<IOSetup />} />
              <Route
                path={ROUTER_PATHS.CTRL_ROOT}
                element={<Tabs pageCount={1} />}
              >
                <Route
                  path={ROUTER_PATHS_PARAMS.CTRL_PAGE(0)}
                  element={<Index />}
                />
                <Route
                  path={ROUTER_PATHS_PARAMS.CTRL_PAGE(1)}
                  element={<Page1 />}
                />
              </Route>

              <Route path="/" element={<Root />} />
            </Routes>
          </Router>
        </ValuesProvider>
      </IntlProvider>
    </ThemeProvider>
  );
}
