#!/usr/bin/env python3

import os
import tempfile
import threading
import time
from urllib.parse import urlparse, parse_qs

import yt_dlp
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DOWNLOAD_DIR = os.path.join(os.path.expanduser("~"), "Downloads")

download_status = {}


def extract_video_id(url):
    parsed_url = urlparse(url)

    if parsed_url.hostname in ['www.youtube.com', 'youtube.com']:
        if parsed_url.path == '/watch':
            return parse_qs(parsed_url.query).get('v', [None])[0]
        elif parsed_url.path.startswith('/embed/'):
            return parsed_url.path.split('/')[2]
        elif parsed_url.path.startswith('/v/'):
            return parsed_url.path.split('/')[2]
        elif parsed_url.path.startswith('/shorts/'):
            return parsed_url.path.split('/')[2]
    elif parsed_url.hostname == 'youtu.be':
        return parsed_url.path[1:]

    return None


def get_video_info(url):
    try:
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
            'nocheckcertificate': True,
            'prefer_insecure': True,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                'title': info.get('title', 'Bilinmeyen Başlık'),
                'duration': info.get('duration', 0),
                'thumbnail': info.get('thumbnail', ''),
                'uploader': info.get('uploader', ''),
                'view_count': info.get('view_count', 0),
                'upload_date': info.get('upload_date', ''),
                'description': info.get('description', '')[:200] + '...' if info.get('description') else ''
            }
    except Exception as e:
        print(f"Video info error: {str(e)}")
        return {'error': str(e)}


def download_video(url, format_type, quality, video_id):
    try:
        # Önce video başlığını al
        info_ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
            'nocheckcertificate': True,
            'prefer_insecure': True,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }

        with yt_dlp.YoutubeDL(info_ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            video_title = info.get('title', f'video_{video_id}')

        # Basit dosya adı - sadece video ID kullan
        safe_title = video_id

        # YouTube için özel ayarlar - ultra hızlandırılmış
        ydl_opts = {
            'progress_hooks': [lambda d: update_progress(video_id, d)],
            'nocheckcertificate': True,
            'ignoreerrors': False,
            'no_warnings': True,
            'quiet': True,
            'verbose': False,
            'extract_flat': False,
            'force_generic_extractor': False,
            'prefer_ffmpeg': True,
            'keepvideo': False,
            'writesubtitles': False,
            'writeautomaticsub': False,
            'writethumbnail': False,
            'writeinfojson': False,
            'writedescription': False,
            'writeannotations': False,
            'writecomments': False,
            'getcomments': False,
            'noplaylist': True,
            'prefer_insecure': True,
            'socket_timeout': 5,
            'retries': 2,
            'fragment_retries': 2,
            'concurrent_fragment_downloads': 4,
            'buffersize': 1024,
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        }

        if format_type == 'mp3':
            ydl_opts.update({
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192'
                }],
                'outtmpl': os.path.join(DOWNLOAD_DIR, f'{safe_title}.mp3'),
            })
        else:  # mp4
            ydl_opts['outtmpl'] = os.path.join(DOWNLOAD_DIR, f'{safe_title}.mp4')
            if quality == 'best':
                ydl_opts['format'] = 'best[ext=mp4]/best'
            elif quality == 'worst':
                ydl_opts['format'] = 'worst[ext=mp4]/worst'
            else:
                height = quality.replace('p', '')
                ydl_opts['format'] = f'best[height<={height}][ext=mp4]/best[height<={height}]/best[ext=mp4]/best'

        download_status[video_id] = {
            'status': 'downloading',
            'progress': 0,
            'speed': '0 B/s',
            'eta': 'Unknown',
            'filename': ''
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        download_status[video_id]['status'] = 'completed'
        download_status[video_id]['progress'] = 100

        return True

    except Exception as e:
        download_status[video_id] = {
            'status': 'error',
            'error': str(e)
        }
        print(f"Download error for {video_id}: {str(e)}")
        return False


def update_progress(video_id, d):
    if d['status'] == 'downloading':
        download_status[video_id] = {
            'status': 'downloading',
            'progress': d.get('downloaded_bytes', 0) / d.get('total_bytes', 1) * 100 if d.get('total_bytes') else 0,
            'speed': d.get('_speed_str', '0 B/s'),
            'eta': d.get('_eta_str', 'Unknown'),
            'filename': d.get('filename', '')
        }


@app.route('/api/info', methods=['POST'])
def get_info():
    data = request.json
    url = data.get('url')

    if not url:
        return jsonify({'error': 'URL gerekli'}), 400

    video_id = extract_video_id(url)
    if not video_id:
        return jsonify({'error': 'Geçersiz YouTube URL\'si'}), 400

    info = get_video_info(url)
    info['video_id'] = video_id

    return jsonify(info)


@app.route('/api/download', methods=['POST'])
def start_download():
    data = request.json
    url = data.get('url')
    format_type = data.get('format', 'mp4')
    quality = data.get('quality', 'best')

    if not url:
        return jsonify({'error': 'URL gerekli'}), 400

    video_id = extract_video_id(url)
    if not video_id:
        return jsonify({'error': 'Geçersiz YouTube URL\'si'}), 400

    # Eğer aynı video zaten indiriliyorsa, mevcut durumu döndür
    if video_id in download_status and download_status[video_id]['status'] in ['downloading', 'completed']:
        return jsonify({
            'video_id': video_id,
            'status': download_status[video_id]['status'],
            'message': 'İndirme zaten devam ediyor veya tamamlandı'
        })

    # Hemen status'u ayarla
    download_status[video_id] = {
        'status': 'downloading',
        'progress': 0,
        'speed': '0 B/s',
        'eta': 'Unknown',
        'filename': ''
    }

    # Yeni indirme başlat
    thread = threading.Thread(
        target=download_video,
        args=(url, format_type, quality, video_id)
    )
    thread.daemon = True
    thread.start()

    return jsonify({
        'video_id': video_id,
        'status': 'started',
        'message': 'İndirme başlatıldı'
    })


@app.route('/api/status/<video_id>')
def get_status(video_id):
    if video_id not in download_status:
        return jsonify({'error': 'Video bulunamadı'}), 404

    return jsonify(download_status[video_id])


@app.route('/api/downloads')
def list_downloads():
    files = []
    for filename in os.listdir(DOWNLOAD_DIR):
        filepath = os.path.join(DOWNLOAD_DIR, filename)
        if os.path.isfile(filepath):
            files.append({
                'name': filename,
                'size': os.path.getsize(filepath),
                'modified': os.path.getmtime(filepath)
            })

    return jsonify({'files': files})


@app.route('/api/download/<filename>')
def download_file(filename):
    filepath = os.path.join(DOWNLOAD_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({'error': 'Dosya bulunamadı'}), 404

    return send_file(filepath, as_attachment=True)


@app.route('/health')
def health_check():
    return jsonify({'status': 'ok', 'timestamp': time.time()})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
