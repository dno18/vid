from http.server import BaseHTTPRequestHandler
import json
import requests
import re

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        url = data.get('url')

        if not url:
            self.send_response(400)
            self.end_headers()
            return

        try:
            # استخدام API خارجي قوي جداً (وسيط خفي)
            # سنقوم بإرسال الطلب وكأننا مستخدم عادي
            api_url = f"https://www.tikwm.com/api/?url={url}&hd=1"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(api_url, headers=headers).json()
            
            if response.get('code') == 0:
                video_data = response['data']
                result = {
                    "status": "success",
                    "video_url": video_data.get('hdplay') or video_data.get('play'),
                    "cover": video_data.get('cover'),
                    "title": video_data.get('title')
                }
            else:
                result = {"status": "error", "message": "فشل جلب البيانات"}

        except Exception as e:
            result = {"status": "error", "message": str(e)}

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())
        return

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
