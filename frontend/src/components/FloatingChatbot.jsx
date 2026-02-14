import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Loader2 } from 'lucide-react';
import { wellApi } from '../services/api';
import useWellStore from '../store/wellStore';

const FloatingChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const wellId = useWellStore(state => state.wellId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, isMinimized]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading || !wellId) return;

        const userMessage = inputMessage.trim();
        setInputMessage('');
        setIsLoading(true);

        // Add user message to UI
        const newUserMessage = { role: 'user', content: userMessage };
        setMessages(prev => [...prev, newUserMessage]);

        try {
            // Build history (include system prompt if exists)
            const history = systemPrompt
                ? [{ role: 'system', content: systemPrompt }, ...messages]
                : messages;

            const response = await wellApi.sendChatMessage(wellId, userMessage, history);

            if (response.success) {
                // Store system prompt if this was first message
                if (response.data.systemPrompt && !systemPrompt) {
                    setSystemPrompt(response.data.systemPrompt);
                }

                // Add assistant response
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.data.response
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        setIsMinimized(false);
    };

    const handleClose = () => {
        setIsOpen(false);
        setIsMinimized(false);
    };

    const handleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    if (!wellId) return null; // Only show when a well is loaded

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={handleOpen}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group z-50"
                    aria-label="Open AI Assistant"
                >
                    <MessageCircle className="w-6 h-6" />
                    <span className="absolute right-16 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        AI Assistant
                    </span>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div
                    className={`fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 z-50 ${isMinimized ? 'h-14' : 'h-[600px]'
                        }`}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            <h3 className="font-semibold">AI Well Analyst</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleMinimize}
                                className="p-1 hover:bg-white/20 rounded transition-colors"
                                aria-label="Minimize"
                            >
                                <Minimize2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleClose}
                                className="p-1 hover:bg-white/20 rounded transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Chat Content */}
                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-500 mt-8">
                                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">Ask me anything about this well!</p>
                                        <p className="text-xs mt-2 text-gray-400">
                                            I can help analyze curves, identify zones, and answer questions about the data.
                                        </p>
                                    </div>
                                )}

                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-800'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                            <span className="text-sm text-gray-600">Analyzing...</span>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                                <div className="flex gap-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask about this well..."
                                        disabled={isLoading}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || isLoading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default FloatingChatbot;
