# Imports here
import os
import random
import logging
from datetime import datetime
from typing import Dict

from flask import Flask, render_template, request, session, redirect, url_for
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.middleware.proxy_fix import ProxyFix

# Config logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# App Configuration
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or os.urandom(24)
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
    CHAT_ROOMS = ['General', 'Start chatting', 'Chat with me', 'AI family']

# Initialize Flask + SocketIO
app = Flask(__name__)
app.config.from_object(Config)
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
socketio = SocketIO(app, cors_allowed_origins=app.config['CORS_ORIGINS'], logger=True, engineio_logger=True)

# In-memory storage
active_users: Dict[str, dict] = {}

# ---------------- ROUTES ---------------- #

@app.route('/', methods=['GET', 'POST'])
def index():
    """Ask for username before entering chat."""
    if request.method == 'POST':
        username = request.form.get('username')
        if username:
            session['username'] = username.strip()
            logger.info(f"User '{username}' joined via form input.")
            return redirect(url_for('chat'))
    return render_template('login.html')

@app.route('/chat')
def chat():
    if 'username' not in session:
        return redirect(url_for('index'))
    ngrok_url = request.host_url  # Flask automatically detects public host (ngrok)
    return render_template(
        'index.html',
        username=session['username'],
        rooms=app.config['CHAT_ROOMS'],
        ngrok_url=ngrok_url
    )


# ---------------- SOCKET EVENTS ---------------- #

@socketio.event
def connect():
    try:
        if 'username' not in session:
            session['username'] = f"Guest{random.randint(1000,9999)}"
        active_users[request.sid] = {
            'username': session['username'],
            'connected_at': datetime.now().isoformat()
        }
        emit('active_users', {'users': [u['username'] for u in active_users.values()]}, broadcast=True)
        logger.info(f"User connected: {session['username']}")
    except Exception as e:
        logger.error(f"Connection error: {str(e)}")
        return False

@socketio.event
def disconnect():
    try:
        if request.sid in active_users:
            username = active_users[request.sid]['username']
            del active_users[request.sid]
            emit('active_users', {'users': [u['username'] for u in active_users.values()]}, broadcast=True)
            logger.info(f"User disconnected: {username}")
    except Exception as e:
        logger.error(f"Disconnection error: {str(e)}")

@socketio.on('join')
def on_join(data):
    try:
        username = session['username']
        room = data['room']
        if room not in app.config['CHAT_ROOMS']:
            return
        join_room(room)
        active_users[request.sid]['room'] = room
        emit('status', {
            'msg': f'{username} has joined the room.',
            'type': 'join',
            'timestamp': datetime.now().isoformat()
        }, room=room)
        logger.info(f"User {username} joined room: {room}")
    except Exception as e:
        logger.error(f"Join room error: {str(e)}")

@socketio.on('leave')
def on_leave(data):
    try:
        username = session['username']
        room = data['room']
        leave_room(room)
        if request.sid in active_users:
            active_users[request.sid].pop('room', None)
        emit('status', {
            'msg': f'{username} has left the room.',
            'type': 'leave',
            'timestamp': datetime.now().isoformat()
        }, room=room)
        logger.info(f"User {username} left room: {room}")
    except Exception as e:
        logger.error(f"Leave room error: {str(e)}")

@socketio.on('message')
def handle_message(data):
    try:
        username = session['username']
        room = data.get('room', 'General')
        msg_type = data.get('type', 'message')
        message = data.get('msg', '').strip()
        if not message:
            return
        timestamp = datetime.now().isoformat()

        if msg_type == 'private':
            target_user = data.get('target')
            for sid, u in active_users.items():
                if u['username'] == target_user:
                    emit('private_message', {
                        'msg': message,
                        'from': username,
                        'to': target_user,
                        'timestamp': timestamp
                    }, room=sid)
                    logger.info(f"Private message: {username} -> {target_user}")
                    return
        else:
            if room in app.config['CHAT_ROOMS']:
                emit('message', {
                    'msg': message,
                    'username': username,
                    'room': room,
                    'timestamp': timestamp
                }, room=room)
                logger.info(f"Message sent in {room} by {username}")
    except Exception as e:
        logger.error(f"Message handling error: {str(e)}")

# ---------------- MAIN ---------------- #
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=5001, debug=app.config['DEBUG'])
