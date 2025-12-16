import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const getFrontendApi = () => {
  try {
    if (typeof api !== 'undefined') return api;
    if (typeof window !== 'undefined' && window.api) return window.api;
    return null;
  } catch (e) {
    console.error("Trilium Spreadsheet: api not found. Make sure note type is JS Frontend.", e);
  }
};

// Main execution function
(function main() {
  const triliumApi = getFrontendApi();
  let retryCount = 0;
  const maxRetries = 3;
  const retryInterval = 100;

  // 2. Trilium JS Frontend Mounting with Retry
  function tryMount() {
    if (!triliumApi) {
      console.error("Trilium Spreadsheet: api not found. Make sure note type is JS Frontend.");
      return;
    } else if (triliumApi && triliumApi.$container && triliumApi.$container.length) {
      const container = triliumApi.$container[0];

      // Cleanup / Idempotency
      container.innerHTML = '';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.height = '100%';
      container.style.width = '100%';

      const rootDiv = document.createElement('div');
      rootDiv.style.flex = '1';
      rootDiv.style.height = '100%';
      rootDiv.className = 'fortune-sheet-mount';
      container.appendChild(rootDiv);

      ReactDOM.createRoot(rootDiv).render(
        <App />
      );
    } else {
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Spreadsheet: Waiting for container... (${retryCount}/${maxRetries})`);
        setTimeout(tryMount, retryInterval);
      } else {
        console.error("Trilium Spreadsheet: api found but $container is missing after retries. Make sure note type is JS Frontend.");
      }
    }
  }

  tryMount();
})();
