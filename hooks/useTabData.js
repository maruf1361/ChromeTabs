
"use client";

import { useState, useEffect } from 'react';

export function useTabData() {
  const [tabs, setTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contentScriptReady, setContentScriptReady] = useState(false);
  const [receivedData, setReceivedData] = useState(false);

  useEffect(() => {
    console.log('Setting up tab data listener');

    const handleMessage = (event) => {
      // Only accept messages from the same window
      if (event.source !== window) return;
      
      console.log('Webpage received message:', event.data);
      
      if (event.data.type === 'CONTENT_SCRIPT_READY') {
        console.log('Content script is ready');
        setContentScriptReady(true);
      }
      
      if (event.data.type === 'FROM_EXTENSION') {
        console.log('Processing extension data:', event.data.data);
        const message = event.data.data;
        if (message.type === 'tabsUpdate' && message.data) {
          const tabsWithPosition = message.data.map((tab, index) => ({
            ...tab,
            x: 100 + (index % 4) * 300,
            y: 100 + Math.floor(index / 4) * 200
          }));
          setTabs(tabsWithPosition);
          setLoading(false);
          setReceivedData(true); // Mark that we received real data
          setError(null); // Clear any existing error
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Request tabs data periodically
    const requestInterval = setInterval(() => {
      if (contentScriptReady) {
        console.log('Requesting tabs data');
        window.postMessage({
          type: 'TO_EXTENSION',
          data: { action: 'getTabs' }
        }, '*');
      }
    }, 2000);

    // Fallback timer - only show error if we haven't received any real data
    const fallbackTimer = setTimeout(() => {
      if (loading && !receivedData) {
        console.log('Extension not responding, showing error');
        setTabs([
          { id: 1, title: "Extension Not Connected", url: "Please check extension installation", x: 100, y: 100 },
        ]);
        setLoading(false);
        setError('Extension not detected. Please check installation.');
      }
    }, 5000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(requestInterval);
      clearTimeout(fallbackTimer);
    };
  }, [contentScriptReady]);

  const focusTab = (tabId, windowId) => {
    if (contentScriptReady) {
      window.postMessage({
        type: 'TO_EXTENSION',
        data: { 
          action: 'focusTab',
          tabId,
          windowId
        }
      }, '*');
    }
  };

  return { tabs, loading, error, focusTab };
}