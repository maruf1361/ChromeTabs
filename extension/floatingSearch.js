(function() {
    if (window.location.href.includes('localhost:3000')) return;
  
    let currentTabs = [];
    let isOpen = false;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let dragStartPos = { x: 0, y: 0 };
    let lastClickTime = 0;
    const DOUBLE_CLICK_THRESHOLD = 300; // milliseconds
  
    const style = document.createElement('style');
    style.textContent = `
      #floating-search-container {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 2147483647;
        font-family: system-ui, -apple-system, sans-serif;
      }
      #search-button {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #3b82f6;
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.2s;
      }
      #search-button:hover {
        transform: scale(1.05);
        background: #2563eb;
      }
      #search-panel {
        position: absolute;
        bottom: 60px;
        right: 0;
        width: 300px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        padding: 12px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(10px);
        transition: all 0.2s ease-out;
        pointer-events: none;
      }
      #search-panel.visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        pointer-events: auto;
      }
      .search-header {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }
      #search-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
      }
      #search-input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
      }
      #view-map-btn {
        padding: 8px 12px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      #view-map-btn:hover {
        background: #2563eb;
      }
      #search-results {
        max-height: 300px;
        overflow-y: auto;
        margin-top: 8px;
      }
      .search-result {
        padding: 8px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: background-color 0.15s;
      }
      .search-result:hover {
        background: #f1f5f9;
      }
      .result-info {
        flex: 1;
        min-width: 0;
      }
      .result-title {
        font-size: 13px;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 2px;
      }
      .result-url {
        font-size: 11px;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
    document.head.appendChild(style);
  
    function createUI() {
      const container = document.createElement('div');
      container.id = 'floating-search-container';
  
      const button = document.createElement('button');
      button.id = 'search-button';
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      `;
  
      const panel = document.createElement('div');
      panel.id = 'search-panel';
  
      const header = document.createElement('div');
      header.className = 'search-header';
  
      const input = document.createElement('input');
      input.id = 'search-input';
      input.type = 'text';
      input.placeholder = 'Search tabs...';
  
      const viewMapBtn = document.createElement('button');
      viewMapBtn.id = 'view-map-btn';
      viewMapBtn.textContent = 'View Map';
  
      const results = document.createElement('div');
      results.id = 'search-results';
  
      header.appendChild(input);
      header.appendChild(viewMapBtn);
      panel.appendChild(header);
      panel.appendChild(results);
      container.appendChild(panel);
      container.appendChild(button);
      document.body.appendChild(container);
  
      return { button, panel, input, results, viewMapBtn };
    }
  
    function handleDragStart(e) {
      const button = document.getElementById('search-button');
      if (e.target !== button) return;
  
      const currentTime = Date.now();
      
      // Handle double-click to toggle search
      if (currentTime - lastClickTime < DOUBLE_CLICK_THRESHOLD) {
        toggleSearch();
        lastClickTime = 0;
        return;
      }
      
      lastClickTime = currentTime;
  
      dragStartPos = {
        x: e.clientX,
        y: e.clientY
      };
  
      isDragging = false;
      const container = document.getElementById('floating-search-container');
      const rect = container.getBoundingClientRect();
      dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
  
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', handleDragEnd);
      e.preventDefault();
    }
  
    function handleDrag(e) {
      isDragging = true;
      const container = document.getElementById('floating-search-container');
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      
      container.style.right = 'auto';
      container.style.bottom = 'auto';
      container.style.left = `${Math.max(0, Math.min(window.innerWidth - container.offsetWidth, x))}px`;
      container.style.top = `${Math.max(0, Math.min(window.innerHeight - container.offsetHeight, y))}px`;
    }
  
    function handleDragEnd(e) {
      const wasDragging = isDragging;
      isDragging = false;
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
      
      // If it's a short movement, consider it a click
      if (!wasDragging && Math.abs(e.clientX - dragStartPos.x) < 5 && Math.abs(e.clientY - dragStartPos.y) < 5) {
        const currentTime = Date.now();
        
        // Open search on first click, close on second click within threshold
        if (currentTime - lastClickTime < DOUBLE_CLICK_THRESHOLD) {
          toggleSearch();
          lastClickTime = 0;
        } else {
          lastClickTime = currentTime;
        }
      }
    }
  
    function toggleSearch() {
      isOpen = !isOpen;
      const panel = document.getElementById('search-panel');
      panel.classList.toggle('visible', isOpen);
      
      if (isOpen) {
        const input = document.getElementById('search-input');
        input.focus();
        requestTabs();
      }
    }
  
    function requestTabs() {
      chrome.runtime.sendMessage({ action: 'getTabs' }, response => {
        if (response?.type === 'tabsUpdate') {
          currentTabs = response.data;
          const input = document.getElementById('search-input');
          if (input.value.trim()) {
            handleSearch(input.value.trim());
          }
        }
      });
    }
  
    function handleSearch(query) {
      if (!query) {
        document.getElementById('search-results').innerHTML = '';
        return;
      }
  
      query = query.toLowerCase();
      const filtered = currentTabs.filter(tab => 
        tab.title?.toLowerCase().includes(query) ||
        tab.url?.toLowerCase().includes(query)
      );
      renderResults(filtered);
    }
  
    function formatUrl(url) {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname + urlObj.pathname;
      } catch {
        return url;
      }
    }
  
    function renderResults(tabs) {
      const results = document.getElementById('search-results');
      
      if (tabs.length === 0) {
        results.innerHTML = '<div style="text-align: center; padding: 12px; color: #64748b;">No matching tabs found</div>';
        return;
      }
  
      results.innerHTML = tabs.map(tab => `
        <div class="search-result" data-tab-id="${tab.id}" data-window-id="${tab.windowId}">
          <img src="${tab.favicon || 'chrome://favicon/size/16@2x'}" 
               style="width: 16px; height: 16px;"
               onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjQ3NDhiIiBzdHJva2Utd2lkdGg9IjIiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PC9zdmc+'"
          >
          <div class="result-info">
            <div class="result-title">${tab.title || 'Untitled'}</div>
            <div class="result-url">${formatUrl(tab.url)}</div>
          </div>
        </div>
      `).join('');
  
      results.querySelectorAll('.search-result').forEach(result => {
        result.addEventListener('click', () => {
          const tabId = Number(result.dataset.tabId);
          const windowId = Number(result.dataset.windowId);
          
          chrome.runtime.sendMessage({
            action: 'focusTab',
            tabId,
            windowId
          }, () => {
            if (!chrome.runtime.lastError) toggleSearch();
          });
        });
      });
    }
  
    function initialize() {
      const ui = createUI();
  
      ui.button.addEventListener('mousedown', handleDragStart);
      
      ui.input.addEventListener('input', (e) => handleSearch(e.target.value.trim()));
  
      ui.viewMapBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'getTabs' }, response => {
          if (response?.type === 'tabsUpdate') {
            const tabs = response.data;
            const mapTab = tabs.find(tab => tab.url.includes('localhost:3000'));
            
            if (mapTab) {
              chrome.runtime.sendMessage({
                action: 'focusTab',
                tabId: mapTab.id,
                windowId: mapTab.windowId
              }, () => toggleSearch());
            } else {
              chrome.runtime.sendMessage({
                action: 'createTab',
                url: 'https://tabmap.netlify.app/'
              }, () => toggleSearch());
            }
          }
        });
      });
  
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'tabsUpdate') {
          currentTabs = message.data;
          if (isOpen) {
            const query = ui.input.value.trim();
            if (query) handleSearch(query);
          }
        }
        return true;
      });
  
      // Improved close logic
      document.addEventListener('click', (e) => {
        const container = document.getElementById('floating-search-container');
        if (isOpen && !container.contains(e.target)) {
          toggleSearch();
        }
      });
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
  })();
