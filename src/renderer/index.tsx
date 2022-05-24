import { createRoot } from 'react-dom/client';
import App from './App';
import './modules/EngineIntegration';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);
