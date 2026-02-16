import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group z-50 float-animation"
                    aria-label="Open AI Assistant"
                >
                    <MessageCircle className="w-6 h-6" />
                    <span className="absolute right-16 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
                        AI Assistant
                    </span>
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div
                    className={`fixed bottom-6 right-6 w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-300 z-50 overflow-hidden ${isMinimized ? 'h-14' : 'h-[550px]'
                        }`}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between shadow-md cursor-pointer" onClick={handleMinimize}>
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-5 h-5 text-blue-100" />
                            <div>
                                <h3 className="font-bold text-sm">AI Well Analyst</h3>
                                <p className="text-xs text-blue-100 opacity-90">Powered by Claude 3.5 Sonnet</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleMinimize(); }}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                aria-label="Minimize"
                            >
                                <Minimize2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors hover:text-red-200"
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
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                                {messages.length === 0 && (
                                    <div className="text-center text-gray-500 mt-12 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                            <MessageCircle className="w-8 h-8 text-blue-500" />
                                        </div>
                                        <h4 className="font-semibold text-gray-700 mb-2">How can I help?</h4>
                                        <p className="text-sm text-gray-500 max-w-[250px]">
                                            Ask me to interpret specific zones, explain anomalies, or analyze fluid indicators.
                                        </p>
                                        <div className="mt-6 space-y-2 w-full max-w-[280px]">
                                            <button
                                                onClick={() => setInputMessage("Analyze the most distinctive zone in this well")}
                                                className="w-full text-left text-xs bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                                            >
                                                "Analyze the most distinctive zone..."
                                            </button>
                                            <button
                                                onClick={() => setInputMessage("Are there any hydrocarbon indicators?")}
                                                className="w-full text-left text-xs bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                                            >
                                                "Are there any hydrocarbon indicators?"
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-br-none'
                                                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                                                }`}
                                        >
                                            {msg.role === 'user' ? (
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                            ) : (
                                                <div className="markdown-content text-sm space-y-2">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ node, ...props }) => <p className="leading-relaxed" {...props} />,
                                                            strong: ({ node, ...props }) => <strong className="font-semibold text-blue-900" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1" {...props} />,
                                                            li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                            h1: ({ node, ...props }) => <h1 className="font-bold text-base mt-2 mb-1" {...props} />,
                                                            h2: ({ node, ...props }) => <h2 className="font-bold text-sm mt-2 mb-1 text-gray-900" {...props} />,
                                                            h3: ({ node, ...props }) => <h3 className="font-semibold text-sm mt-2 mb-1" {...props} />,
                                                            code: ({ node, inline, ...props }) =>
                                                                inline
                                                                    ? <code className="bg-gray-100 text-pink-600 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                                                                    : <code className="block bg-gray-100 p-2 rounded text-xs font-mono my-2 overflow-x-auto" {...props} />,
                                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-200 pl-3 italic text-gray-500 my-2" {...props} />,
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium ml-1">AI Thinking...</span>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-gray-200 bg-white">
                                <div className="flex gap-2 items-end bg-gray-50 border border-gray-200 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
                                    <textarea
                                        ref={inputRef}
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Ask about this well..."
                                        disabled={isLoading}
                                        rows={1}
                                        className="flex-1 px-3 py-2 bg-transparent focus:outline-none disabled:cursor-not-allowed text-sm resize-none max-h-24 scrollbar-hide"
                                        style={{ minHeight: '38px' }}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!inputMessage.trim() || isLoading}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-sm mb-0.5"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-center mt-2">
                                    <p className="text-[10px] text-gray-400">AI can make mistakes. Verify important info.</p>
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
