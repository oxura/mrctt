import React, { useState, useRef, useEffect } from 'react';
import api from '../../utils/api';
import styles from './AIAssistant.module.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', text: 'Привет! Я ваш AI-ассистент. Я могу помочь вам с календарем. Попробуйте написать: "12 ноября у друга днюха".', sender: 'ai', timestamp: new Date() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/command', { command: userMessage.text });
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.data.message,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error(error);
      const errorResponse: Message = {
         id: (Date.now() + 1).toString(),
         text: 'Произошла ошибка при обработке запроса.',
         sender: 'ai',
         timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${styles.container} ${isOpen ? styles.open : ''}`}>
      {!isOpen && (
        <button className={styles.toggleButton} onClick={() => setIsOpen(true)}>
          🤖
        </button>
      )}
      
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <h3>AI Ассистент</h3>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className={styles.messages}>
            {messages.map(msg => (
              <div key={msg.id} className={`${styles.message} ${styles[msg.sender]}`}>
                <p>{msg.text}</p>
                <span className={styles.time}>{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            ))}
            {isLoading && <div className={styles.loading}>Печатает...</div>}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSubmit} className={styles.inputForm}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Напишите команду..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>➤</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
