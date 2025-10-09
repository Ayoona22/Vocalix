import React, { useEffect, useState } from "react";
import "./App.css";

function ChatPage({ user }) {
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${user}`);
    ws.onmessage = (event) => {
      setChatLog((prev) => [...prev, { sender: "other", text: event.data }]);
    };
    setSocket(ws);
    return () => ws.close();
  }, [user]);

  const sendMessage = () => {
    if (socket && message.trim()) {
      socket.send(message);
      setChatLog((prev) => [...prev, { sender: "me", text: message }]);
      setMessage("");
    }
  };

  return (
    <div className="chat-container">
      <aside className="sidebar">
        <div className="profile">
          <img
            src={`https://i.pravatar.cc/100?u=${user}`}
            alt="avatar"
            className="avatar"
          />
          <h2>{user}</h2>
        </div>
        <div className="chats-list">
          <div className="chat-item active">Global Chat</div>
        </div>
      </aside>

      <main className="chat-main">
        <div className="chat-header">
          <h3>Vocalix Chat Room 💬</h3>
        </div>

        <div className="chat-messages">
          {chatLog.map((msg, i) => (
            <div
              key={i}
              className={`message ${msg.sender === "me" ? "sent" : "received"}`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </main>
    </div>
  );
}

export default ChatPage;
