// Background service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'downloadVideo') {
        // Her video için ayrı bir Promise oluştur
        handleVideoDownload(request.video, request.format, request.quality)
            .then(() => {
                console.log(`${request.video.title} indirme işlemi tamamlandı`);
            })
            .catch((error) => {
                console.error(`${request.video.title} indirme hatası:`, error);
            });
        
        // Hemen response gönder
        sendResponse({ status: 'started' });
    }
    return true; // Async response için gerekli
});

// Video indirme işlemi
async function handleVideoDownload(video, format, quality) {
    try {
        // Video ID'sini URL'den çıkar
        const videoId = extractVideoId(video.url);
        if (!videoId) {
            throw new Error('Geçersiz YouTube URL\'si');
        }

        // yt-dlp API'sini kullan
        const downloadUrl = await getDownloadUrl(videoId, format, quality);
        
        // Dosya adını oluştur
        const fileName = generateFileName(video.title, format);
        
        // Chrome download API'sini kullan
        chrome.downloads.download({
            url: downloadUrl,
            filename: fileName,
            saveAs: false
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('İndirme hatası:', chrome.runtime.lastError);
            } else {
                console.log('İndirme başlatıldı:', downloadId);
            }
        });

    } catch (error) {
        console.error('Video indirme hatası:', error);
        // Kullanıcıya hata mesajı göster
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'İndirme Hatası',
            message: `${video.title} indirilemedi: ${error.message}`
        });
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

// İndirme URL'sini al (gerçek API ile)
async function getDownloadUrl(videoId, format, quality) {
    try {
        // Yerel API server'a istek gönder
        const response = await fetch('http://localhost:5000/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: `https://www.youtube.com/watch?v=${videoId}`,
                format: format,
                quality: quality
            })
        });
        
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        // Hızlı status kontrolü - format parametresini geçir
        return await checkDownloadStatusFast(videoId, format);
        
    } catch (error) {
        console.error('API hatası:', error);
        throw new Error('İndirme başlatılamadı: ' + error.message);
    }
}

// Ultra hızlı indirme durumu kontrolü (sadece 2 saniye)
async function checkDownloadStatusFast(videoId, format, maxAttempts = 2) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`http://localhost:5000/api/status/${videoId}`);
            const status = await response.json();
            
            if (status.status === 'completed') {
                // İndirme tamamlandı, dosyayı indir
                const downloadResponse = await fetch(`http://localhost:5000/api/downloads`);
                const downloads = await downloadResponse.json();
                
                // Video ID'si ile dosyayı bul
                const file = downloads.files.find(f => f.name.includes(videoId));
                if (file) {
                    return `http://localhost:5000/api/download/${file.name}`;
                }
            } else if (status.status === 'error') {
                throw new Error(status.error);
            } else {
                // Hala indiriliyor, çok kısa bekleme
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
            
        } catch (error) {
            console.error(`Ultra hızlı durum kontrolü hatası (${attempts + 1}/${maxAttempts}):`, error);
            attempts++;
            if (attempts >= maxAttempts) {
                // Zaman aşımı durumunda direkt dosya URL'si döndür
                return `http://localhost:5000/api/download/video_${videoId}.${format}`;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // Zaman aşımı durumunda direkt dosya URL'si döndür
    return `http://localhost:5000/api/download/video_${videoId}.${format}`;
}

// Uzun süreli indirme durumu kontrolü (gerekirse)
async function checkDownloadStatus(videoId, maxAttempts = 30) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`http://localhost:5000/api/status/${videoId}`);
            const status = await response.json();
            
            if (status.status === 'completed') {
                // İndirme tamamlandı, dosyayı indir
                const downloadResponse = await fetch(`http://localhost:5000/api/downloads`);
                const downloads = await downloadResponse.json();
                
                // Video ID'si ile dosyayı bul
                const file = downloads.files.find(f => f.name.includes(videoId));
                if (file) {
                    return `http://localhost:5000/api/download/${file.name}`;
                }
            } else if (status.status === 'error') {
                throw new Error(status.error);
            } else {
                // Hala indiriliyor, tekrar dene
                await new Promise(resolve => setTimeout(resolve, 2000));
                attempts++;
            }
            
        } catch (error) {
            console.error(`Durum kontrolü hatası (${attempts + 1}/${maxAttempts}):`, error);
            attempts++;
            if (attempts >= maxAttempts) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    throw new Error('İndirme zaman aşımına uğradı');
}

// Dosya adını oluştur
function generateFileName(title, format) {
    // Dosya adını temizle
    const cleanTitle = title
        .replace(/[<>:"/\\|?*]/g, '') // Geçersiz karakterleri kaldır
        .replace(/\s+/g, '_') // Boşlukları alt çizgi ile değiştir
        .substring(0, 50) // Uzunluğu sınırla
        + '_abulauncher'; // Sonuna abulauncher ekle
    
    return `${cleanTitle}.${format}`;
}

// Extension yüklendiğinde
chrome.runtime.onInstalled.addListener(() => {
    console.log('YouTube Video İndirici extension yüklendi');
});

// Tab güncellendiğinde
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // YouTube sayfalarında content script'i çalıştır
    if (changeInfo.status === 'complete' && 
        tab.url && 
        (tab.url.includes('youtube.com/watch') || tab.url.includes('youtu.be/'))) {
        
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
    }
});
