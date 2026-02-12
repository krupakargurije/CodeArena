import { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useSelector } from 'react-redux';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const DiscussPanel = ({ roomId }) => {
    const { user } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [connected, setConnected] = useState(false);
    const [connectionError, setConnectionError] = useState('');
    const stompClientRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Connect to WebSocket
    useEffect(() => {
        if (!roomId) return;

        console.log('Attempting to connect to WebSocket for room:', roomId);
        setConnectionError('');

        const client = new Client({
            webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws`),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to chat WebSocket');
                setConnected(true);
                setConnectionError('');

                // Subscribe to room messages
                client.subscribe(`/topic/room/${roomId}`, (message) => {
                    console.log('Received message:', message.body);
                    const chatMessage = JSON.parse(message.body);

                    setMessages((prev) => {
                        // Avoid duplicates if we optimistically added it
                        const isDuplicate = prev.some(m =>
                            m.senderName === chatMessage.senderName &&
                            m.content === chatMessage.content &&
                            Math.abs(new Date(m.timestamp) - new Date(chatMessage.timestamp)) < 1000
                        );
                        if (isDuplicate) return prev;
                        return [...prev, chatMessage];
                    });
                });
            },
            onDisconnect: () => {
                console.log('Disconnected from chat WebSocket');
                setConnected(false);
            },
            onStompError: (frame) => {
                console.error('STOMP error:', frame);
                setConnectionError('Connection error. Make sure backend is running.');
            },
            onWebSocketError: (event) => {
                console.error('WebSocket error:', event);
                setConnectionError('WebSocket error. Restart backend server.');
            },
        });

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [roomId]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !stompClientRef.current || !connected) {
            console.log('Cannot send:', { hasMessage: !!newMessage.trim(), hasClient: !!stompClientRef.current, connected });
            return;
        }

        const chatMessage = {
            roomId,
            senderId: user?.id || 'anonymous',
            senderName: user?.username || user?.email?.split('@')[0] || 'Anonymous',
            content: newMessage.trim(),
            timestamp: new Date().toISOString(),
        };

        // Optimistic update
        setMessages((prev) => [...prev, chatMessage]);

        console.log('Sending message:', chatMessage);

        try {
            stompClientRef.current.publish({
                destination: `/app/chat.send/${roomId}`,
                body: JSON.stringify(chatMessage),
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            // Revert optimistic update if needed, but for now just log
        }

        setNewMessage('');
    };

    const formatTime = (timestamp) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    return (
        <div className="flex flex-col h-full backdrop-blur-xl rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
            {/* Header */}
            <div className="h-10 border-b flex items-center justify-between px-4 flex-shrink-0" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Discuss</span>
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {connected ? 'Connected' : 'Connecting...'}
                </span>
            </div>

            {/* Connection Error */}
            {connectionError && (
                <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs">
                    {connectionError}
                </div>
            )}

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="text-center text-xs py-8" style={{ color: 'var(--text-tertiary)' }}>
                        No messages yet. Start the discussion!
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex flex-col ${msg.senderId === user?.id ? 'items-end' : 'items-start'}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-cyan-400 font-medium">{msg.senderName}</span>
                                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{formatTime(msg.timestamp)}</span>
                            </div>
                            <div
                                className={`max-w-[85%] px-3 py-2 rounded-lg text-xs ${msg.senderId === user?.id
                                    ? 'shadow-sm'
                                    : ''
                                    }`}
                                style={{
                                    background: msg.senderId === user?.id ? 'var(--brand-primary)' : 'var(--bg-tertiary)',
                                    color: msg.senderId === user?.id ? '#ffffff' : 'var(--text-secondary)'
                                }}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-2 border-t" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={connected ? "Type a message..." : "Connecting..."}
                        disabled={!connected}
                        className="flex-1 border rounded-lg px-3 py-2 text-xs focus:outline-none disabled:opacity-50"
                        style={{
                            background: 'var(--bg-input)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-primary)'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!connected || !newMessage.trim()}
                        className="px-3 py-2 text-white rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        style={{ background: 'var(--brand-primary)' }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DiscussPanel;
