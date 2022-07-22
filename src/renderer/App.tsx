import './App.css';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

import { Tabs } from './modules/Tabs';
import { ROUTER_PATHS_PARAMS } from './modules/Router';
import { Index } from './modules/Index';
import { Page1 } from './modules/Pages';
import IntlMessages from './intl';
import { ValuesProvider } from './modules/EngineIntegration';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <IntlProvider locale="en-US" messages={IntlMessages['en-US']}>
        <ValuesProvider>
          <Router>
            <Tabs pageCount={1} />

            <Routes>
              <Route
                path={ROUTER_PATHS_PARAMS.CTRL_PAGE(0)}
                element={<Index />}
              />
              <Route
                path={ROUTER_PATHS_PARAMS.CTRL_PAGE(1)}
                element={<Page1 />}
              />
            </Routes>
          </Router>
        </ValuesProvider>
      </IntlProvider>
    </ThemeProvider>
  );
}
