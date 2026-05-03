import React, { useState, useRef, useEffect } from 'react';
import chatbotService from '../../services/chatbotService';
import './Chatbot.css';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'ai', text: "Hi! I'm your AI Doubt Solver. Ask me any question based on your course materials!" }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage = { sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            const data = await chatbotService.askQuestion(userMessage.text);
            
            // Simulate a slight delay to make it feel like "thinking"
            setTimeout(() => {
                setMessages(prev => [...prev, { sender: 'ai', text: data.answer }]);
                setIsTyping(false);
            }, 800);

        } catch (error) {
            console.error("Chatbot error:", error);
            setIsTyping(false);
            setMessages(prev => [...prev, { 
                sender: 'ai', 
                text: "Sorry, my server isn't responding. Please make sure the backend is running!" 
            }]);
        }
    };

    const toggleChat = () => setIsOpen(!isOpen);

    // Simple markdown-to-html conversion for basic bolding
    const renderFormattedText = (text) => {
        // Replace **text** with <strong>text</strong>
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className="chatbot-widget-container">
            {!isOpen && (
                <button className="chatbot-toggle-btn" onClick={toggleChat} title="Ask AI Tutor">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
            )}

            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <h3>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M12 16v-4"></path>
                                <path d="M12 8h.01"></path>
                            </svg>
                            AI Doubt Solver
                        </h3>
                        <button className="close-btn" onClick={toggleChat}>&times;</button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                <div className="message-text">{renderFormattedText(msg.text)}</div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chatbot-input-area" onSubmit={handleSend}>
                        <input 
                            type="text" 
                            placeholder="Ask a question..." 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isTyping}
                        />
                        <button type="submit" disabled={isTyping || !inputValue.trim()}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
