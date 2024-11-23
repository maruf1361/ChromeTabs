document.getElementById('openMap').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://tabmap.netlify.app/' });
  });
  
