# 🎥 YouTube Video İndirici - Chrome Extension

Chrome sekmelerinden YouTube videolarını MP3 veya MP4 formatında indiren Chrome extension'ı.

## 🚀 Özellikler

- 🎯 **Otomatik Tarama**: Açık Chrome sekmelerinden YouTube linklerini otomatik algılama
- 🎵 **Çoklu Format**: MP3 ve MP4 formatlarında indirme
- 🎨 **Kalite Seçimi**: Farklı video kalitelerinde indirme (720p, 480p, 360p, vb.)
- 📱 **Modern UI**: Güzel ve kullanıcı dostu arayüz
- ⚡ **Hızlı İşlem**: Tek tıkla toplu indirme
- 🔒 **Güvenli**: Sadece YouTube sayfalarında çalışır

## 📦 Kurulum

### 1. Backend Server'ı Başlatın

```bash
# Gerekli paketleri yükleyin
pip install flask flask-cors yt-dlp pillow

# Server'ı başlatın
python server.py
```

### 2. Chrome Extension'ını Yükleyin

1. **Chrome'u açın**
2. **Adres çubuğuna yazın**: `chrome://extensions/`
3. **Geliştirici modunu açın** (sağ üst köşe)
4. **"Paketlenmemiş öğe yükle"** butonuna tıklayın
5. **Extension klasörünü seçin** (manifest.json'ın bulunduğu klasör)

### 3. Extension'ı Kullanın

1. **YouTube videoları açın**
2. **Extension ikonuna tıklayın** (toolbar'da)
3. **"Sekmeleri Tara"** butonuna tıklayın
4. **Videoları seçin** ve **"İndir"** butonuna tıklayın

## 🎯 Kullanım

### Video Tarama
- Extension açıldığında otomatik olarak YouTube sekmelerini tarar
- **"Sekmeleri Tara"** butonu ile manuel tarama yapabilirsiniz
- Bulunan videolar listede görüntülenir

### Video Seçimi
- Tek tek video seçebilirsiniz
- **"Tümünü Seç"** checkbox'ı ile toplu seçim yapabilirsiniz
- Seçilen videolar vurgulanır

### İndirme Seçenekleri
- **Format**: MP4 Video veya MP3 Audio
- **Kalite**: En İyi, 720p, 480p, 360p, En Düşük

### İndirme
- **"Seçilenleri İndir"**: Sadece seçili videoları indirir
- **"Tümünü İndir"**: Listelenen tüm videoları indirir
- İndirme durumu gerçek zamanlı olarak gösterilir

## 📁 Dosya Yapısı

```
youtube-downloader-extension/
├── manifest.json          # Extension konfigürasyonu
├── popup.html            # Popup arayüzü
├── popup.js              # Popup JavaScript
├── background.js         # Background service worker
├── content.js            # Content script
├── server.py             # Python backend API
├── icons/                # Extension ikonları
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── README.md             # Bu dosya
└── KURULUM.md            # Detaylı kurulum rehberi
```

## ⚠️ Gereksinimler

- **Google Chrome** tarayıcısı
- **Python 3.7+** 
- **FFmpeg** (MP3 dönüştürme için)

## 🔧 FFmpeg Kurulumu

**Windows:**
1. [FFmpeg'i indirin](https://ffmpeg.org/download.html)
2. ZIP dosyasını çıkartın
3. `bin` klasörünü PATH'e ekleyin

**Veya Chocolatey ile:**
```bash
choco install ffmpeg
```

## 🐛 Sorun Giderme

### Server Başlamıyor
```bash
# Port 5000 kullanımda mı kontrol edin
netstat -an | findstr :5000
```

### Extension Yüklenmiyor
1. Geliştirici modunun açık olduğundan emin olun
2. Dosya yollarının doğru olduğunu kontrol edin
3. `manifest.json` dosyasının geçerli olduğunu kontrol edin

### Videolar Bulunamıyor
1. YouTube sayfalarının açık olduğundan emin olun
2. Sayfaların tamamen yüklendiğini bekleyin
3. **"Sekmeleri Tara"** butonuna tekrar tıklayın

### İndirme Çalışmıyor
1. Server'ın çalıştığını kontrol edin (`http://localhost:5000/health`)
2. FFmpeg'in kurulu olduğunu kontrol edin
3. İnternet bağlantınızı kontrol edin

## 🔒 Güvenlik

- Extension sadece YouTube sayfalarında çalışır
- Kişisel verilerinizi toplamaz
- Yerel API server kullanır (internet bağlantısı gerekmez)
## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

**Not**: Bu extension eğitim amaçlıdır. YouTube'un kullanım şartlarına uygun kullanın.

