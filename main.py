import os
import random
import logging
from datetime import datetime
from typing import Dict
from flask import Flask, render_template, request, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.middleware.proxy_fix import ProxyFix

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Config
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or os.urandom(24)
    DEBUG = True
    CORS_ORIGINS = "*"
    CHAT_ROOMS = ['General', 'Start chatting', 'Chat with me', 'AI family']

# Initialize Flask + SocketIO
app = Flask(__name__)
app.config.from_object(Config)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

socketio = SocketIO(app, cors_allowed_origins=app.config['CORS_ORIGINS'])

# Store active users
active_users: Dict[str, dict] = {}

def generate_guest_username():
    return f"Guest_{random.randint(1000,9999)}"

@app.route('/')
def index():
    return render_template('index.html', rooms=app.config['CHAT_ROOMS'])

# ------------------ SocketIO Events ------------------ #

@socketio.on('connect')
def connect():
    logger.info("A user connected")

@socketio.on('set_username')
def handle_set_username(data):
    username = data.get('username', '').strip() or generate_guest_username()
    session['username'] = username
    active_users[request.sid] = {
        'username': username,
        'connected_at': datetime.now().isoformat()
    }

    emit('active_users', {
        'users': [u['username'] for u in active_users.values()]
    }, broadcast=True)
    logger.info(f"Username set: {username}")

@socketio.on('message')
def handle_message(data):
    username = session.get('username', 'Guest')
    room = data.get('room', 'General')
    message = data.get('msg', '').strip()
    if not message:
        return

    timestamp = datetime.now().strftime("%H:%M:%S")

    emit('message', {
        'username': username,
        'msg': message,
        'room': room,
        'timestamp': timestamp
    }, broadcast=True)
    logger.info(f"[{room}] {username}: {message}")

@socketio.on('disconnect')
def disconnect():
    if request.sid in active_users:
        username = active_users[request.sid]['username']
        del active_users[request.sid]
        emit('active_users', {
            'users': [u['username'] for u in active_users.values()]
        }, broadcast=True)
        logger.info(f"User disconnected: {username}")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
