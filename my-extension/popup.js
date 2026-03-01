document.addEventListener('DOMContentLoaded', async () => {
  const downloadBtn = document.getElementById('downloadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const trustBtn = document.getElementById('trustBtn');
  const untrustBtn = document.getElementById('untrustBtn');
  const toggleBtn = document.getElementById('toggleLabelsBtn');
  const toggleIcon = document.getElementById('toggleIcon');

  const historyBtn = document.getElementById('historyBtn');
  const arrowIcon = document.getElementById('arrowIcon');
  const historyList = document.getElementById('historyList');
  let historyVisible = false;

  const trustedBtn = document.getElementById('trustedBtn');
  const trustedArrow = document.getElementById('trustedArrow');
  const trustedList = document.getElementById('trustedList');
  let trustedVisible = false;

  // Получение текущего hostname
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);
  const hostname = url.hostname;

chrome.storage.local.get({ customWhitelist: {} }, (data) => {
  const whitelist = data.customWhitelist || {};
  updateTrustButtons(hostname, Object.keys(whitelist));
});

function updateTrustButtons(hostname, whitelistArray) {
  if (whitelistArray.includes(hostname)) {
    trustBtn.style.display = 'none';
    untrustBtn.style.display = 'inline-flex';
  } else {
    trustBtn.style.display = 'inline-flex';
    untrustBtn.style.display = 'none';
  }
}

  trustBtn.addEventListener('click', () => {
    chrome.storage.local.get({ customWhitelist: {} }, (data) => {
      const whitelist = data.customWhitelist || {};
      if (!whitelist[hostname]) {
        whitelist[hostname] = new Date().toISOString();
        chrome.storage.local.set({ customWhitelist: whitelist }, () => {
          updateTrustButtons(hostname, Object.keys(whitelist)); 
          chrome.storage.local.get({ history: [] }, (result) => {
            const updated = result.history.map(item => {
              if (item.url === tab.url && item.prediction === 'phishing') {
                return {
                  ...item,
                  prediction: 'legitimate (manually trusted)'
                };
              }
              return item;
            });
            chrome.storage.local.set({ history: updated }, () => {
              console.log('История обновлена для вручную доверенного сайта.');
              loadHistory();
            });
          });
        });
      }
    });
  }); 
  untrustBtn.addEventListener('click', () => {
    chrome.storage.local.get({ customWhitelist: {} }, (data) => {
      const whitelist = data.customWhitelist || {};
      delete whitelist[hostname];
      chrome.storage.local.set({ customWhitelist: whitelist }, () => {
        updateTrustButtons(hostname, Object.keys(whitelist));
      });
    });
  });

  downloadBtn.addEventListener('click', () => {
    chrome.storage.local.get({ phishingUrls: [] }, (data) => {
      const urls = data.phishingUrls || []; 
      if (urls.length === 0) {
        alert('Phishing database is empty.');
        return;
      } 
      const rows = urls.map(url => `"${url}"`);
      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const urlBlob = URL.createObjectURL(blob); 
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = 'phishing_urls.csv';
      a.click();

      URL.revokeObjectURL(urlBlob);
    });
  });

  clearBtn.addEventListener('click', () => {
    chrome.storage.local.set({ phishingUrls: [] }, () => {
      alert('Phishing database cleared.');
    });
  }); 
  toggleBtn.addEventListener('click', () => {
    const isIconsOnly = document.body.classList.toggle('only-icons');
    toggleIcon.src = isIconsOnly ? 'show.svg' : 'hide.svg';
  }); 
  historyBtn.addEventListener('click', () => {
    historyVisible = !historyVisible; 
    if (historyVisible) {
      historyList.classList.add('visible');
      arrowIcon.classList.add('rotated');
      loadHistory();
    } else {
      historyList.classList.remove('visible');
      arrowIcon.classList.remove('rotated');
      historyList.innerHTML = '';
    }
  });

  trustedBtn.addEventListener('click', () => {
    trustedVisible = !trustedVisible; 
    if (trustedVisible) {
      trustedList.classList.add('visible');
      trustedArrow.classList.add('rotated');
      loadTrustedSites();
    } else {
      trustedList.classList.remove('visible');
      trustedArrow.classList.remove('rotated');
      trustedList.innerHTML = '';
    }
  });
});

function loadHistory() {
  chrome.storage.local.get({ history: [] }, (data) => {
    const list = document.getElementById('historyList');
    if (!list) return; 
    list.innerHTML = '';

    for (const item of data.history) {
      const li = document.createElement('li');
      li.style.marginBottom = '6px'; 
      const link = document.createElement('a');
      link.href = item.url;
      link.textContent = item.url;
      link.target = '_blank';
      link.style.color = item.prediction.startsWith('phishing') ? 'red' : 'lightgreen';
      link.style.fontWeight = 'bold';
      link.style.textDecoration = 'none';
      link.style.marginRight = '5px'; 
      const meta = document.createElement('span');
      meta.textContent = ` | ${item.prediction} | ${item.probability ?? '?'} | ${new Date(item.timestamp).toLocaleString()}`; 
      li.appendChild(link);
      li.appendChild(meta);
      list.appendChild(li);
    }
  });
}

function loadTrustedSites() {
  chrome.storage.local.get({ customWhitelist: {} }, (data) => {
    const whitelist = data.customWhitelist || {}; 
    const trustedList = document.getElementById('trustedList');
    trustedList.innerHTML = ''; 
    for (const [domain, date] of Object.entries(whitelist)) {
      const li = document.createElement('li');
      li.style.marginBottom = '6px';
      li.innerHTML = `<strong>${domain}</strong> — added ${new Date(date).toLocaleString()}`;
      trustedList.appendChild(li);
    }
  });
}
