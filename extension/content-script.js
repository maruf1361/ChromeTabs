// extension/content-script.js
console.log('Content script loaded');

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let screenshotRequests = new Map(); // Track pending screenshot requests

// Forward messages from webpage to extension with enhanced screenshot handling
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;
  
  if (event.data.type === 'TO_EXTENSION') {
    const { action, tabId } = event.data.data;
    
    // Special handling for screenshot requests
    if (action === 'getTabScreenshot') {
      // Check if we already have a pending request for this tab
      if (screenshotRequests.has(tabId)) {
        console.log('Screenshot request already pending for tab:', tabId);
        return;
      }
      
      screenshotRequests.set(tabId, Date.now());
      
      chrome.runtime.sendMessage(event.data.data, response => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error during screenshot:', chrome.runtime.lastError);
          window.postMessage({
            type: 'FROM_EXTENSION',
            data: {
              action: 'tabScreenshot',
              tabId: tabId,
              screenshot: null,
              error: chrome.runtime.lastError.message
            }
          }, '*');
        } else {
          window.postMessage({
            type: 'FROM_EXTENSION',
            data: response
          }, '*');
        }
        
        // Clean up the request tracking
        screenshotRequests.delete(tabId);
      });
    }
    // Handle tab close requests
    else if (action === 'closeTab') {
      chrome.runtime.sendMessage(event.data.data, response => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error during tab close:', chrome.runtime.lastError);
          window.postMessage({
            type: 'FROM_EXTENSION',
            data: {
              action: 'tabClosed',
              tabId: tabId,
              success: false,
              error: chrome.runtime.lastError.message
            }
          }, '*');
        } else {
          window.postMessage({
            type: 'FROM_EXTENSION',
            data: {
              action: 'tabClosed',
              tabId: tabId,
              ...response
            }
          }, '*');
        }
      });
    }
    // Handle all other messages
    else {
      chrome.runtime.sendMessage(event.data.data, response => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          return;
        }
        window.postMessage({
          type: 'FROM_EXTENSION',
          data: response
        }, '*');
      });
    }
  }
});

// Forward messages from extension to webpage with enhanced error handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    // Special handling for screenshot responses
    if (message.action === 'tabScreenshot') {
      const { tabId } = message;
      const requestTime = screenshotRequests.get(tabId);
      
      // Check if request is still valid (less than 30 seconds old)
      if (requestTime && Date.now() - requestTime < 30000) {
        window.postMessage({
          type: 'FROM_EXTENSION',
          data: message
        }, '*');
      } else {
        console.log('Discarding outdated screenshot response for tab:', tabId);
      }
    } else {
      window.postMessage({
        type: 'FROM_EXTENSION',
        data: message
      }, '*');
    }
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error forwarding message:', error);
    sendResponse({ success: false, error: error.message });
  }
  return true;
});

// Clean up old screenshot requests periodically
setInterval(() => {
  const now = Date.now();
  for (const [tabId, requestTime] of screenshotRequests.entries()) {
    if (now - requestTime > 30000) { // 30 seconds timeout
      console.log('Cleaning up stale screenshot request for tab:', tabId);
      screenshotRequests.delete(tabId);
    }
  }
}, 10000); // Check every 10 seconds

// Function to attempt reconnection
function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('Max reconnection attempts reached');
    return;
  }

  reconnectAttempts++;
  setTimeout(() => {
    try {
      window.postMessage({
        type: 'CONTENT_SCRIPT_READY',
        data: { ready: true }
      }, '*');
    } catch (error) {
      console.error('Error during reconnection:', error);
      attemptReconnect();
    }
  }, 1000 * reconnectAttempts); // Exponential backoff
}

// Initial setup
try {
  window.postMessage({
    type: 'CONTENT_SCRIPT_READY',
    data: { ready: true }
  }, '*');
} catch (error) {
  console.error('Error during initialization:', error);
  attemptReconnect();
}

// Handle extension errors and resets
chrome.runtime.onInstalled.addListener(() => {
  console.log('Content script reinstalled');
  reconnectAttempts = 0;
  screenshotRequests.clear();
});

// Listen for tab updates to clean up related screenshot requests
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    screenshotRequests.delete(tabId);
  }
});

// Listen for tab removals to clean up related screenshot requests
chrome.tabs.onRemoved.addListener((tabId) => {
  screenshotRequests.delete(tabId);
});
