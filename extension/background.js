let tabsData = [];
let screenshotQueue = [];
let isProcessingQueue = false;

async function updateTabsData() {
  try {
    const windows = await chrome.windows.getAll({ populate: true });
    tabsData = [];
    
    for (const window of windows) {
      for (const tab of window.tabs) {
        tabsData.push({
          id: tab.id,
          windowId: tab.windowId,
          title: tab.title,
          url: tab.url,
          favicon: tab.favIconUrl,
          parentId: tab.openerTabId
        });
      }
    }
    
    await chrome.storage.local.set({ tabsData: tabsData });
  } catch (error) {
    console.error('Error updating tabs:', error);
  }
}

async function captureTabScreenshot(tabId) {
    try {
      // Get current active tab and window
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentWindow = await chrome.windows.getCurrent();
      
      // Get the target tab info
      const targetTab = await chrome.tabs.get(tabId);
      if (!targetTab) throw new Error('Tab not found');
  
      // Ensure target tab's window is focused
      await chrome.windows.update(targetTab.windowId, { focused: true });
      
      // Switch to the target tab
      await chrome.tabs.update(tabId, { active: true });
      
      // Wait for tab to be fully loaded and rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Capture screenshot
      const screenshot = await chrome.tabs.captureVisibleTab(targetTab.windowId, {
        format: 'jpeg',
        quality: 50
      });
      
      // Restore original state
      if (currentWindow.id !== targetTab.windowId) {
        await chrome.windows.update(currentWindow.id, { focused: true });
      }
      if (currentTab) {
        await chrome.tabs.update(currentTab.id, { active: true });
      }
      
      // Cache the screenshot
      if (screenshot) {
        await chrome.storage.local.set({ [`screenshot_${tabId}`]: screenshot });
      }
      
      return screenshot;
    } catch (error) {
      console.error('Screenshot capture error:', error);
      return null;
    }
  }
  
  async function processScreenshotQueue() {
    if (isProcessingQueue || screenshotQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    try {
      while (screenshotQueue.length > 0) {
        const { tabId, sendResponse } = screenshotQueue.shift();
        
        // Check if tab still exists
        try {
          await chrome.tabs.get(tabId);
        } catch (e) {
          sendResponse({
            action: 'tabScreenshot',
            tabId: tabId,
            screenshot: null,
            error: 'Tab no longer exists'
          });
          continue;
        }
        
        // Check cache first
        const data = await chrome.storage.local.get(`screenshot_${tabId}`);
        let screenshot = data[`screenshot_${tabId}`];
        
        // If no cached screenshot or it's older than 5 minutes, capture new one
        const shouldCapture = !screenshot || Date.now() - (data[`screenshot_${tabId}_timestamp`] || 0) > 300000;
        
        if (shouldCapture) {
          screenshot = await captureTabScreenshot(tabId);
          if (screenshot) {
            await chrome.storage.local.set({
              [`screenshot_${tabId}`]: screenshot,
              [`screenshot_${tabId}_timestamp`]: Date.now()
            });
          }
        }
        
        sendResponse({
          action: 'tabScreenshot',
          tabId: tabId,
          screenshot: screenshot
        });
      }
    } finally {
      isProcessingQueue = false;
    }
  }

// Listen for tab changes
chrome.tabs.onCreated.addListener(() => updateTabsData());
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await chrome.storage.local.remove(`screenshot_${tabId}`);
  updateTabsData();
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    updateTabsData();
  }
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);

  if (request.action === 'getTabs') {
    sendResponse({ type: 'tabsUpdate', data: tabsData });
  }
  else if (request.action === 'focusTab') {
    chrome.windows.update(request.windowId, { focused: true });
    chrome.tabs.update(request.tabId, { active: true });
    sendResponse({ success: true });
  }
  else if (request.action === 'closeTab') {
    try {
      chrome.tabs.remove(request.tabId);
      sendResponse({ success: true });
      updateTabsData();
    } catch (error) {
      console.error('Error closing tab:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  else if (request.action === 'getTabScreenshot') {
    screenshotQueue.push({
      tabId: request.tabId,
      sendResponse: sendResponse
    });
    processScreenshotQueue();
    return true; // Will respond asynchronously
  }
  
  return true; // Keep the message channel open
});

// Initial data collection
updateTabsData();