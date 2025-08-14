// Content script - YouTube sayfalarında çalışır
console.log('YouTube Video İndirici content script yüklendi');

// Video bilgilerini al
function getVideoInfo() {
    try {
        // Video başlığını al
        const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer') ||
                           document.querySelector('h1.title') ||
                           document.querySelector('title');
        
        const title = titleElement ? titleElement.textContent.trim() : 'Bilinmeyen Başlık';
        
        // Video ID'sini URL'den al
        const url = window.location.href;
        const videoId = extractVideoId(url);
        
        return {
            title: title,
            url: url,
            videoId: videoId
        };
    } catch (error) {
        console.error('Video bilgisi alınamadı:', error);
        return null;
    }
}

// Video ID'sini URL'den çıkar
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

// Sayfa yüklendiğinde video bilgilerini background script'e gönder
window.addEventListener('load', () => {
    setTimeout(() => {
        const videoInfo = getVideoInfo();
        if (videoInfo) {
            chrome.runtime.sendMessage({
                action: 'videoInfo',
                data: videoInfo
            });
        }
    }, 2000); // Sayfanın tam yüklenmesi için bekle
});

// URL değişikliklerini dinle (SPA navigasyonu için)
let currentUrl = window.location.href;
const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        setTimeout(() => {
            const videoInfo = getVideoInfo();
            if (videoInfo) {
                chrome.runtime.sendMessage({
                    action: 'videoInfo',
                    data: videoInfo
                });
            }
        }, 1000);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
