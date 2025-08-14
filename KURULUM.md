# 🎥 YouTube Video İndirici - Kurulum Rehberi

Bu rehber, Chrome extension'ını ve backend API server'ını kurmanızı sağlar.

## 📋 Gereksinimler

- ✅ Google Chrome tarayıcısı
- ✅ Python 3.7+ 
- ✅ FFmpeg (MP3 dönüştürme için)

## 🚀 Hızlı Kurulum

### 1. Backend Server'ı Başlatın

```bash
# Gerekli paketleri yükleyin
pip install flask flask-cors yt-dlp pillow

# Server'ı başlatın
python server.py
```

Server başladığında şu mesajı göreceksiniz:
```
🎥 YouTube Video İndirme API Server
📁 İndirme klasörü: C:\Users\...\Downloads\YouTubeVideos
🌐 Server başlatılıyor: http://localhost:5000
```

### 2. Chrome Extension'ını Yükleyin

1. **Chrome'u açın**
2. **Adres çubuğuna yazın**: `chrome://extensions/`
3. **Geliştirici modunu açın** (sağ üst köşe)
4. **"Paketlenmemiş öğe yükle"** butonuna tıklayın
5. **Extension klasörünü seçin** (manifest.json'ın bulunduğu klasör)
6. **"Klasör Seç"** butonuna tıklayın

### 3. Extension'ı Kullanın

1. **YouTube videoları açın**
2. **Extension ikonuna tıklayın** (toolbar'da)
3. **"Sekmeleri Tara"** butonuna tıklayın
4. **Videoları seçin** ve **"İndir"** butonuna tıklayın

## 🔧 Detaylı Kurulum

### Backend Server Kurulumu

#### 1. Python Paketlerini Yükleyin

```bash
pip install flask flask-cors yt-dlp pillow
```

#### 2. FFmpeg Kurulumu (MP3 için)

**Windows:**
1. [FFmpeg'i indirin](https://ffmpeg.org/download.html)
2. ZIP dosyasını çıkartın
3. `bin` klasörünü PATH'e ekleyin

**Veya Chocolatey ile:**
```bash
choco install ffmpeg
```

#### 3. Server'ı Başlatın

```bash
python server.py
```

### Chrome Extension Kurulumu

#### 1. Dosyaları Hazırlayın

Extension klasörünüzde şu dosyalar olmalı:
```
youtube-downloader-extension/
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── content.js
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README_EXTENSION.md
```

#### 2. Chrome'da Yükleyin

1. Chrome'u açın
2. `chrome://extensions/` adresine gidin
3. **"Geliştirici modu"** düğmesini açın
4. **"Paketlenmemiş öğe yükle"** butonuna tıklayın
5. Extension klasörünü seçin

#### 3. Extension'ı Test Edin

1. YouTube'da bir video açın
2. Extension ikonuna tıklayın
3. Video listede görünmelidir

## 🎯 Kullanım

### Video İndirme

1. **YouTube videoları açın** (birden fazla sekme)
2. **Extension ikonuna tıklayın**
3. **"Sekmeleri Tara"** butonuna tıklayın
4. **İndirmek istediğiniz videoları seçin**
5. **Format ve kalite seçin**:
   - **MP4**: Video formatı
   - **MP3**: Sadece ses
   - **Kalite**: En İyi, 720p, 480p, 360p, En Düşük
6. **"Seçilenleri İndir"** veya **"Tümünü İndir"** butonuna tıklayın

### İndirme Durumu

- İndirmeler `~/Downloads/YouTubeVideos/` klasörüne kaydedilir
- İndirme durumu extension'da gösterilir
- Hata durumunda log mesajları görüntülenir

## 🐛 Sorun Giderme

### Server Başlamıyor

```bash
# Port 5000 kullanımda mı kontrol edin
netstat -an | findstr :5000

# Farklı port kullanın
python server.py --port 5001
```

### Extension Yüklenmiyor

1. **Manifest.json kontrol edin**
2. **Tüm dosyaların mevcut olduğunu kontrol edin**
3. **Chrome'u yeniden başlatın**

### Videolar Bulunamıyor

1. **YouTube sayfalarının açık olduğunu kontrol edin**
2. **Sayfaların tamamen yüklendiğini bekleyin**
3. **"Sekmeleri Tara" butonuna tekrar tıklayın**

### İndirme Çalışmıyor

1. **Server'ın çalıştığını kontrol edin** (`http://localhost:5000/health`)
2. **FFmpeg'in kurulu olduğunu kontrol edin**
3. **İnternet bağlantınızı kontrol edin**

### FFmpeg Hatası

```bash
# FFmpeg'i test edin
ffmpeg -version

# PATH'e ekleyin (Windows)
set PATH=%PATH%;C:\ffmpeg\bin
```

## 🔒 Güvenlik

- Extension sadece YouTube sayfalarında çalışır
- Kişisel verilerinizi toplamaz
- Yerel API server kullanır (internet bağlantısı gerekmez)

## 📞 Destek

Sorunlarınız için:
1. **Console loglarını kontrol edin** (F12)
2. **Server loglarını kontrol edin**
3. **README_EXTENSION.md** dosyasını okuyun

---

**Not**: Bu extension eğitim amaçlıdır. YouTube'un kullanım şartlarına uygun kullanın.
