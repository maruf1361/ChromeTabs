"use client";

import { useState, useEffect, useCallback } from 'react';

export function useTabData() {
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contentScriptReady, setContentScriptReady] = useState(false);
  const [receivedInitialData, setReceivedInitialData] = useState(false);

  const requestTabs = useCallback(() => {
    if (!contentScriptReady) {
      console.log('Content script not ready yet, skipping tab request');
      return;
    }
    
    console.log('Requesting tabs data...');
    try {
      window.postMessage({
        type: 'TO_EXTENSION',
        data: { action: 'getTabs' }
      }, '*');
    } catch (err) {
      console.error('Error requesting tabs:', err);
    }
  }, [contentScriptReady]);

  useEffect(() => {
    console.log('Setting up tab data listener');
    let retryTimeout;
    let pollInterval;
    let initTimeout;

    const handleMessage = (event) => {
      // Only accept messages from the same window
      if (event.source !== window) return;
      
      console.log('Received message:', event.data);
      
      if (event.data.type === 'CONTENT_SCRIPT_READY') {
        console.log('Content script is ready');
        setContentScriptReady(true);
        // Clear any existing error when content script becomes ready
        setError(null);
        requestTabs();
      }
      
      if (event.data.type === 'FROM_EXTENSION') {
        console.log('Processing extension data:', event.data.data);
        const message = event.data.data;
        
        if (message.type === 'tabsUpdate' && Array.isArray(message.data)) {
          console.log('Received tabs data:', message.data);
          setTabs(message.data);
          setLoading(false);
          setError(null);
          setReceivedInitialData(true);
        }
      }

      if (event.data.type === 'EXTENSION_ERROR') {
        console.error('Extension error:', event.data.error);
        setError(`Extension error: ${event.data.error}`);
        setLoading(false);
      }
    };

    // Set up message listener
    window.addEventListener('message', handleMessage);

    // Initial check for content script
    console.log('Checking for content script...');
    window.postMessage({ type: 'CHECK_CONTENT_SCRIPT' }, '*');

    // Set timeout for initial connection
    initTimeout = setTimeout(() => {
      if (!contentScriptReady) {
        console.error('Content script not ready after timeout');
        setError('Content script not ready. Please check if the extension is installed correctly.');
        setLoading(false);
      }
    }, 3000);

    // Poll for tabs data only if content script is ready
    pollInterval = setInterval(() => {
      if (contentScriptReady) {
        requestTabs();
      }
    }, 2000);

    // Set timeout for data loading
    retryTimeout = setTimeout(() => {
      if (loading && !receivedInitialData) {
        console.error('Failed to load tabs data after timeout');
        setError('Failed to receive tabs data. Please check the extension and refresh the page.');
        setLoading(false);
      }
    }, 5000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(pollInterval);
      clearTimeout(retryTimeout);
      clearTimeout(initTimeout);
    };
  }, [contentScriptReady, requestTabs, receivedInitialData]);

  const focusTab = useCallback((tabId, windowId) => {
    if (contentScriptReady) {
      console.log('Focusing tab:', tabId, 'in window:', windowId);
      window.postMessage({
        type: 'TO_EXTENSION',
        data: { 
          action: 'focusTab',
          tabId,
          windowId
        }
      }, '*');
    }
  }, [contentScriptReady]);

  return { 
    tabs, 
    loading, 
    error, 
    focusTab,
    contentScriptReady,
    refreshTabs: requestTabs,
    debug: {
      contentScriptReady,
      receivedInitialData,
      tabCount: tabs.length
    }
  };
}
