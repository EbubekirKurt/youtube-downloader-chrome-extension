let videos = [];
let selectedVideos = new Set();

const videoList = document.getElementById('videoList');
const scanBtn = document.getElementById('scanBtn');
const downloadBtn = document.getElementById('downloadBtn');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const selectAllCheckbox = document.getElementById('selectAll');
const statusDiv = document.getElementById('status');
const loadingDiv = document.getElementById('loading');

document.addEventListener('DOMContentLoaded', function() {
    scanBtn.addEventListener('click', scanTabs);
    downloadBtn.addEventListener('click', downloadSelected);
    downloadAllBtn.addEventListener('click', downloadAll);
    selectAllCheckbox.addEventListener('change', toggleSelectAll);
    
    document.getElementById('format').addEventListener('change', updateQualityOptions);
    
    // Sayfa yüklendiğinde kalite seçeneklerini güncelle
    updateQualityOptions();
    
    scanTabs();
});

async function scanTabs() {
    showStatus('Sekmeler taranıyor...', 'info');
    scanBtn.disabled = true;
    
    try {
        const tabs = await chrome.tabs.query({});
        
        const youtubeTabs = tabs.filter(tab => 
            tab.url && (
                tab.url.includes('youtube.com/watch') ||
                tab.url.includes('youtu.be/') ||
                tab.url.includes('youtube.com/shorts/')
            )
        );
        
        videos = youtubeTabs.map(tab => ({
            id: tab.id,
            title: tab.title.replace(' - YouTube', ''),
            url: tab.url,
            favicon: tab.favIconUrl
        }));
        
        updateVideoList();
        showStatus(`${videos.length} YouTube videosu bulundu`, 'success');
        
        downloadBtn.disabled = videos.length === 0;
        downloadAllBtn.disabled = videos.length === 0;
        
    } catch (error) {
        console.error('Tarama hatası:', error);
        showStatus('Tarama sırasında hata oluştu', 'error');
    } finally {
        scanBtn.disabled = false;
    }
}

function updateVideoList() {
    if (videos.length === 0) {
        videoList.innerHTML = '<div style="text-align: center; opacity: 0.7;">YouTube videosu bulunamadı</div>';
        document.getElementById('videoCount').textContent = '0 video';
        return;
    }
    
    videoList.innerHTML = videos.map(video => `
        <div class="video-item ${selectedVideos.has(video.id) ? 'selected' : ''}" 
             data-id="${video.id}">
            <input type="checkbox" class="video-checkbox" 
                   ${selectedVideos.has(video.id) ? 'checked' : ''} 
                   data-id="${video.id}">
            <div class="video-content">
                <div class="video-title">${video.title}</div>
                <div class="video-url">${video.url}</div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('videoCount').textContent = `${videos.length} video`;
    
    const videoItems = videoList.querySelectorAll('.video-item');
    const videoCheckboxes = videoList.querySelectorAll('.video-checkbox');
    
    videoItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.classList.contains('video-checkbox')) {
                return;
            }
            const videoId = parseInt(this.getAttribute('data-id'));
            toggleVideoSelection(videoId);
        });
    });
    
    videoCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            e.stopPropagation();
            const videoId = parseInt(this.getAttribute('data-id'));
            toggleVideoSelection(videoId);
        });
    });
}

function toggleVideoSelection(videoId) {
    if (selectedVideos.has(videoId)) {
        selectedVideos.delete(videoId);
    } else {
        selectedVideos.add(videoId);
    }
    
    updateVideoList();
    updateSelectAllCheckbox();
    updateDownloadButtons();
}

function toggleSelectAll() {
    if (selectAllCheckbox.checked) {
        videos.forEach(video => selectedVideos.add(video.id));
    } else {
        selectedVideos.clear();
    }
    
    updateVideoList();
    updateDownloadButtons();
}

function updateSelectAllCheckbox() {
    selectAllCheckbox.checked = selectedVideos.size === videos.length && videos.length > 0;
    selectAllCheckbox.indeterminate = selectedVideos.size > 0 && selectedVideos.size < videos.length;
}

function updateDownloadButtons() {
    downloadBtn.disabled = selectedVideos.size === 0;
    downloadAllBtn.disabled = videos.length === 0;
}

async function downloadSelected() {
    const selectedVideoList = videos.filter(video => selectedVideos.has(video.id));
    await downloadVideos(selectedVideoList);
}

async function downloadAll() {
    await downloadVideos(videos);
}

async function downloadVideos(videoList) {
    if (videoList.length === 0) {
        showStatus('İndirilecek video seçilmedi', 'error');
        return;
    }
    
    const format = document.getElementById('format').value;
    const quality = document.getElementById('quality').value;
    
    showLoading(true);
    showStatus(`${videoList.length} video indiriliyor...`, 'info');
    
    try {
        const downloadPromises = videoList.map(async (video, index) => {
            try {
                await chrome.runtime.sendMessage({
                    action: 'downloadVideo',
                    video: video,
                    format: format,
                    quality: quality
                });
                
                // Minimum bekleme
                await new Promise(resolve => setTimeout(resolve, 30));
                
                return { success: true, video: video };
            } catch (error) {
                console.error(`${video.title} indirme hatası:`, error);
                return { success: false, video: video, error: error.message };
            }
        });
        
        const results = await Promise.allSettled(downloadPromises);
        
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;
        
        if (failed > 0) {
            showStatus(`${successful} video başarıyla, ${failed} video başarısız indirildi`, 'info');
        } else {
            showStatus(`${successful} video başarıyla indirildi!`, 'success');
        }
        
    } catch (error) {
        console.error('İndirme hatası:', error);
        showStatus('İndirme sırasında hata oluştu', 'error');
    } finally {
        showLoading(false);
    }
}

function showStatus(message, type = 'info') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    // 5 saniye sonra gizle
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

// Format değişikliğinde kalite seçeneklerini güncelle
function updateQualityOptions() {
    const format = document.getElementById('format').value;
    const qualitySelect = document.getElementById('quality');
    const qualityGroup = qualitySelect.parentElement;
    
    if (format === 'mp3') {
        qualityGroup.style.display = 'none';
    } else {
        qualityGroup.style.display = 'block';
    }
}

// Loading durumunu göster/gizle
function showLoading(show) {
    loadingDiv.style.display = show ? 'block' : 'none';
    scanBtn.disabled = show;
    downloadBtn.disabled = show;
    downloadAllBtn.disabled = show;
}
