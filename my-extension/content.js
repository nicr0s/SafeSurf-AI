chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'update_page') {
    const prediction = message.prediction;
    const url = message.url;
    const features = message.features || {}; 

    console.log('[DEBUG] Получено сообщение от background.js:', message);

    // Показать уведомление
    showNotification(prediction, url, features);

    // Добавить в базу, если это фишинг
    if (prediction === 'phishing') {
      addPhishingUrlToDB(url);
    }

    console.log('Content script запущен на странице', window.location.href);
  }

  if (message.action === 'show_notification') {
    showNotification(message.prediction, message.url, message.features);
  }
});

function showNotification(prediction, url, features = {}) {
  function shortenUrl(url, maxLength = 60) {
    return url.length > maxLength ? url.slice(0, maxLength) + '…' : url;
  }

  const shortUrl = shortenUrl(url);
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.padding = '12px 20px';
  notification.style.borderRadius = '12px';
  notification.style.fontSize = '16px';
  notification.style.fontWeight = '600';
  notification.style.fontFamily = 'Raleway, sans-serif';
  notification.style.color = prediction === 'phishing' ? 'white' : 'black';
  notification.style.zIndex = 9999;
  notification.style.backgroundColor = prediction === 'phishing' ? 'black' : 'white';
  notification.style.maxWidth = '95%';
  notification.style.wordWrap = 'break-word';
  notification.style.whiteSpace = 'normal';
  notification.style.textAlign = 'center';
  notification.style.boxShadow = '0 4px 15px rgba(255,255,255,0.2)';
  notification.style.opacity = '0';
  notification.style.transition = 'opacity 0.5s ease';
  notification.title = url;

  let message = prediction === 'phishing'
    ? `⚠️ Фишинговый сайт:\n${shortUrl}`
    : `✅ Легитимный сайт:\n${shortUrl}`;

  if (prediction === 'phishing' && features) {
    let reasons = [];

    if (features.is_at) reasons.push('🔹 Содержит символ "@"');
    if (features.have_dash) reasons.push('🔹 Есть дефис в домене');
    if (features.is_ip) reasons.push('🔹 Используется IP-адрес');
    if (features.subdomain_count > 2) reasons.push('🔹 Много поддоменов');
    if (features.url_len > 75) reasons.push(`🔹 Длинный URL (${features.url_len} символов)`);
    if (features.has_suspicious_words) reasons.push('🔹 Подозрительные слова в ссылке');
    if (features.dot_count > 3) reasons.push(`🔹 Много точек (${features.dot_count})`);
    if (features.blacklist_word_count > 0) reasons.push('🔹 Входит в чёрный список слов');
    if (features.ends_with_suspicious) reasons.push('🔹 Подозрительное расширение файла');
    if (features.has_encoded) reasons.push('🔹 Содержит %-кодировку');
    if (features.entropy > 4.0) reasons.push(`🔹 Высокая энтропия (${features.entropy})`);

    if (reasons.length) {
      message += '\n\nПричины:\n' + reasons.join('\n');
    }
  }

  notification.textContent = message;

  document.body.appendChild(notification);
  requestAnimationFrame(() => (notification.style.opacity = '1'));

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 500);
  }, 6000);
}

// Добавить фишинг-ссылку в локальную базу
function addPhishingUrlToDB(url) {
  chrome.storage.local.get({ phishingUrls: [] }, (result) => {
    const urls = result.phishingUrls;
    if (!urls.includes(url)) {
      urls.push(url);
      chrome.storage.local.set({ phishingUrls: urls });
      console.log('Добавлено в базу:', url);
    }
  });
}

const fontStyle = document.createElement('style');
fontStyle.textContent = `
@font-face {
 font-family: 'Raleway';
 src: url('${chrome.runtime.getURL("fonts/Raleway-VariableFont_wght.ttf")}') format('truetype');
 font-weight: normal;
 font-style: normal;
}
`;
document.head.appendChild(fontStyle);


