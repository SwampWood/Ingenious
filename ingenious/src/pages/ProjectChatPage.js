import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import api from "../api";
import "./ProjectChatPage.css";

const ProjectChatPage = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [project, setProject] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projResponse = await api.get(`projects/projects/${id}/`);
        setProject(projResponse.data);

        const chatResponse = await api.get(`chat/rooms/?project=${id}`);
        if (chatResponse.data.length > 0) {
          const roomId = chatResponse.data[0].id;
          const messagesResponse = await api.get(`chat/rooms/${roomId}/messages/`);
          setMessages(messagesResponse.data);
        }
      } catch (error) {
        console.error("Ошибка загрузки чата:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:8000${avatarPath}`;
  };

  const renderMessages = () => {
    if (messages.length === 0) {
      return <div className="no-messages">Нет сообщений. Будьте первым!</div>;
    }

    const groupedMessages = [];
    
    for (let i = 0; i < messages.length; i++) {
      const currentMsg = messages[i];
      const prevMsg = i > 0 ? messages[i - 1] : null;
      const nextMsg = i < messages.length - 1 ? messages[i + 1] : null;

      const showAvatar = currentMsg.author.username !== user.username && 
                  (!nextMsg || nextMsg.author.username !== currentMsg.author.username);
      const showUsername = currentMsg.author.username !== user.username && 
                  (!prevMsg || prevMsg.author.username !== currentMsg.author.username);
      const hasNextFromSameUser = nextMsg && nextMsg.author.username === currentMsg.author.username;
      const hasPrevFromSameUser = prevMsg && prevMsg.author.username === currentMsg.author.username;
      
      groupedMessages.push({
      ...currentMsg,
      showAvatar,
      showUsername,
      hasNextFromSameUser,
      hasPrevFromSameUser,
      isOwnMessage: currentMsg.author.username === user.username
    });
  }

  return groupedMessages.map((msg) => (
    <div
      key={msg.id}
      className={`message ${msg.isOwnMessage ? "own" : "other"} ${msg.hasNextFromSameUser ? "same-user-next" : ""} ${msg.hasPrevFromSameUser ? "same-user-prev" : ""}`}
    >
      {msg.showAvatar && !msg.isOwnMessage && (
        <div className="message-avatar">
          {msg.author.avatar ? (
            <img 
              src={getAvatarUrl(msg.author.avatar)} 
              alt={msg.author.username}
              className="avatar-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<div class="avatar-fallback">${msg.author.username[0]}</div>`;
              }}
            />
          ) : (
            <div className="avatar-fallback">
              {msg.author.username[0]}
            </div>
          )}
        </div>
      )}
      
      {!msg.showAvatar && !msg.isOwnMessage && (
        <div className="message-avatar-placeholder"></div>
      )}
      
      <div className="message-content-wrapper">
        {msg.showUsername && !msg.isOwnMessage && (
          <div className="message-author-name">{msg.author.username}</div>
        )}
        
        <div className="message-bubble">
          <div className="message-text">{msg.content}</div>
          <div className="message-time">
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  ));
};

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      let chatResponse;
      try {
        chatResponse = await api.get(`chat/rooms/?project=${id}`);
      } catch (error) {
        console.log('Ошибка получения комнат, создаём новую');
        chatResponse = { data: [] };
      }
      
      let roomId;
      
      if (chatResponse.data.length > 0) {
        roomId = chatResponse.data[0].id;
        console.log('Используем существующую комнату:', roomId);
      } else {
        console.log('Создаём новую комнату для проекта:', id);

        const projResponse = await api.get(`projects/projects/${id}/`);
        
        const roomResponse = await api.post('chat/rooms/', {
          room_type: 'project',
          project: id
        });
        
        roomId = roomResponse.data.id;
        console.log('Создана комната ID:', roomId);
      }

      await api.post('chat/messages/', {
        room: roomId,
        content: newMessage.trim()
      });

      const messagesResponse = await api.get(`chat/messages/?room=${roomId}`);
      setMessages(messagesResponse.data);
      setNewMessage('');

    } catch (error) {
      console.error('Ошибка отправки:', error.response?.data || error);
      alert('Не удалось отправить сообщение');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  if (!project) return <div>Загрузка...</div>;

  return (
    <div className="chat-page">
      <Header username={user.username} onLogout={onLogout} />
      <main className="chat-content">
        <div className="chat-header">
          <button
            className="back-btn"
            onClick={() => navigate('/')}
          >
            ← К проекту
          </button>
          <h2>Чат проекта: {project.title}</h2>
        </div>

        <div className="messages-container">
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="message-form">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение... (Shift+Enter для переноса строки)"
            className="message-input"
            rows="1"
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button type="submit" className="send-btn">
            Отправить
          </button>
        </form>
      </main>
    </div>
  );
};

export default ProjectChatPage;