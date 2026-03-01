chrome.tabs.onActivated.addListener(async (activeInfo) => {
  let tab = await chrome.tabs.get(activeInfo.tabId);
  console.log('Активная вкладка:', tab.url);
  checkUrl(tab.url);  // Отправляем URL на сервер
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Вкладка обновлена:', tab.url);
    checkUrl(tab.url);  // Отправляем URL на сервер
  }
});


function updatePopup(prediction, url) {
  chrome.runtime.sendMessage({
    action: 'update_popup',
    prediction: prediction,
    url: url
  });
}


function updatePage(prediction, url, features = {}) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: 'update_page',
      prediction: prediction,
      url: url,
      features: features
    });
  });
}




function isWhitelisted(url, callback) {
  try {
    const hostname = new URL(url).hostname;
    chrome.storage.local.get({ customWhitelist: {} }, (result) => {
      const whitelist = result.customWhitelist || {};
      const isTrusted = Object.keys(whitelist).some(domain =>
        hostname === domain || hostname.endsWith('.' + domain)
      );
      callback(isTrusted);
    });
  } catch (e) {
    callback(false);
  }
}

function checkUrl(url) {
  if (!url || !url.startsWith('http')) return;

  isWhitelisted(url, (trusted) => {
    if (trusted) {
      console.log('URL в custom whitelist:', url);
      updatePopup('legitimate', url);
      updatePage('legitimate', url);
      return;
    }

    // Не в whitelist — отправляем на сервер
    fetch('http://localhost:5001/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Ответ от сервера:', data);
      updatePopup(data.prediction, url);
      updatePage(data.prediction, url, data.features);
      saveToHistory(url, data.prediction, data.probability);
    })
    .catch(err => {
      console.error('Ошибка при проверке URL:', err);
    });
  });
}

function saveToHistory(url, prediction, probability) {
  const entry = {
    url,
    prediction,
    probability,
    timestamp: new Date().toISOString()
  };

  chrome.storage.local.get({ history: [] }, (result) => {
    const updated = [entry, ...result.history];
    chrome.storage.local.set({ history: updated.slice(0, 5) }); // сохраняем максимум 50 записей
  });
}

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) { // только основной фрейм
    chrome.tabs.get(details.tabId, (tab) => {
      if (tab && tab.url && tab.url.startsWith('http')) {
        console.log('URL изменился (webNavigation):', tab.url);
        checkUrl(tab.url);
      }
    });
  }
});

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId === 0) {
    chrome.tabs.get(details.tabId, (tab) => {
      if (tab && tab.url && tab.url.startsWith('http')) {
        console.log('URL изменился (SPA):', tab.url);
        checkUrl(tab.url);
      }
    });
  }
});

chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
  if (details.frameId === 0) {
    chrome.tabs.get(details.tabId, (tab) => {
      if (tab && tab.url && tab.url.startsWith('http')) {
        console.log('DOMContentLoaded сработал:', tab.url);
        checkUrl(tab.url);
      }
    });
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  let tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url && tab.url.startsWith('http')) {
    console.log('Активная вкладка:', tab.url);

    // 🧠 Принудительно инъецируем content.js, если его нет
    chrome.scripting.executeScript({
      target: { tabId: activeInfo.tabId },
      files: ['content.js']
    }, () => {
      checkUrl(tab.url); // Только после инъекции
    });
  }
});

