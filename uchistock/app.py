"""ローカル開発用の起動スクリプト。本番は Vercel の api/index.py が使われる。"""
import os
from api.index import app

if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', '0') == '1'
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
