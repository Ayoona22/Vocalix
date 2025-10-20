// -------------------------
// Chat.js for Flask-SocketIO + ngrok
// -------------------------

// NGROK_URL is passed from Flask in index.html
var socket = io(NGROK_URL, { transports: ['websocket'] });
var currentRoom = 'General';

// Join default room
socket.emit('join', { room: currentRoom });

// -------------------------
// Send message
// -------------------------
function sendMessage() {
    const msgInput = document.getElementById('message');
    const msg = msgInput.value.trim();
    if (!msg) return;

    socket.emit('message', {
        msg: msg,
        room: currentRoom,
        type: 'message'
    });
    msgInput.value = '';
}

// -------------------------
// Handle Enter key
// -------------------------
function handleKeyPress(event) {
    if (event.key === 'Enter') sendMessage();
}

// -------------------------
// Join a different room
// -------------------------
function joinRoom(room) {
    if (room === currentRoom) return;

    socket.emit('leave', { room: currentRoom });
    currentRoom = room;
    socket.emit('join', { room: currentRoom });

    const chat = document.getElementById('chat');
    chat.innerHTML = ''; // Clear chat area when switching rooms
}

// -------------------------
// Display incoming messages
// -------------------------
socket.on('message', function(data) {
    if (data.room !== currentRoom) return;

    const chat = document.getElementById('chat');
    chat.innerHTML += `<div><strong>${data.username}:</strong> ${data.msg}</div>`;
    chat.scrollTop = chat.scrollHeight;
});

// -------------------------
// Display status messages (join/leave)
// -------------------------
socket.on('status', function(data) {
    const chat = document.getElementById('chat');
    chat.innerHTML += `<div style="color: gray;"><em>${data.msg}</em></div>`;
    chat.scrollTop = chat.scrollHeight;
});

// -------------------------
// Update active users
// -------------------------
socket.on('active_users', function(data) {
    const userList = document.getElementById('active-users');
    userList.innerHTML = '';
    data.users.forEach(function(user) {
        userList.innerHTML += `<div>${user}</div>`;
    });
});
