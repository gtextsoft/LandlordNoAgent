import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundaryWrapper from './components/ErrorBoundaryWrapper.tsx'

createRoot(document.getElementById("root")!).render(
  <ErrorBoundaryWrapper componentName="Root">
    <App />
  </ErrorBoundaryWrapper>
);
