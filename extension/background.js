let tabsData = [];
console.log('Background script initializing');

// Core tab data management
async function updateTabsData() {
  try {
    const windows = await chrome.windows.getAll({ populate: true });
    const newTabsData = [];
    
    for (const window of windows) {
      for (const tab of window.tabs) {
        newTabsData.push({
          id: tab.id,
          windowId: tab.windowId,
          title: tab.title,
          url: tab.url,
          favicon: tab.favIconUrl,
          parentId: tab.openerTabId
        });
      }
    }

    tabsData = newTabsData;
    await chrome.storage.local.set({ tabsData: tabsData });
    
    // Broadcast update to all tabs except localhost:3000
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      if (!tab.url.includes('tabmap.netlify.app')) {
        try {
          chrome.tabs.sendMessage(tab.id, {
            type: 'tabsUpdate',
            data: tabsData
          });
        } catch (error) {
          console.error('Error sending to tab:', tab.id, error);
        }
      }
    });

    console.log('Tabs updated:', tabsData.length);
  } catch (error) {
    console.error('Error updating tabs:', error);
  }
}

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request.action);

  try {
    switch (request.action) {
      case 'getTabs':
        console.log('Sending tabs data:', tabsData.length, 'tabs');
        sendResponse({ type: 'tabsUpdate', data: tabsData });
        break;

      case 'focusTab':
        chrome.windows.update(request.windowId, { focused: true })
          .then(() => chrome.tabs.update(request.tabId, { active: true }))
          .then(() => {
            console.log('Tab focused:', request.tabId);
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error('Error focusing tab:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true;

      case 'closeTab':
        chrome.tabs.remove(request.tabId)
          .then(() => {
            console.log('Tab closed:', request.tabId);
            sendResponse({ success: true });
            updateTabsData(); // Update data after closing
          })
          .catch(error => {
            console.error('Error closing tab:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true;

      case 'searchTabs':
        const query = request.query.toLowerCase();
        const results = tabsData.filter(tab => 
          tab.title?.toLowerCase().includes(query) ||
          tab.url?.toLowerCase().includes(query)
        );
        sendResponse({ type: 'searchResults', data: results });
        break;

      default:
        console.log('Unknown action:', request.action);
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }

  return true;
});

// Tab event listeners
chrome.tabs.onCreated.addListener(() => {
  console.log('Tab created');
  updateTabsData();
});

chrome.tabs.onRemoved.addListener(() => {
  console.log('Tab removed');
  updateTabsData();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab updated:', tabId);
    updateTabsData();
  }
});

chrome.tabs.onAttached.addListener(() => updateTabsData());
chrome.tabs.onDetached.addListener(() => updateTabsData());
chrome.tabs.onMoved.addListener(() => updateTabsData());
chrome.tabs.onReplaced.addListener(() => updateTabsData());
chrome.tabs.onActivated.addListener(() => updateTabsData());

chrome.windows.onCreated.addListener(() => updateTabsData());
chrome.windows.onRemoved.addListener(() => updateTabsData());
chrome.windows.onFocusChanged.addListener(() => updateTabsData());

// Initialize
async function initialize() {
  console.log('Initializing background script');
  try {
    // Load cached data
    const cache = await chrome.storage.local.get('tabsData');
    if (cache.tabsData) {
      tabsData = cache.tabsData;
      console.log('Loaded cached data:', tabsData.length, 'tabs');
    }

    // Get fresh data
    await updateTabsData();
    console.log('Background script initialized successfully');
  } catch (error) {
    console.error('Error initializing background script:', error);
  }
}

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  initialize();
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension starting up');
  initialize();
});

// Start initialization
initialize();

// Error handling
chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension being suspended');
});

