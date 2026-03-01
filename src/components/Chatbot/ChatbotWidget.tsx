import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, Maximize2, ShoppingCart, Package, HelpCircle, Search, CreditCard } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  buttons?: Array<{ title: string; payload: string }>;
  image?: string;
  quickReplies?: string[];
}

interface ChatbotWidgetProps {
  rasaServerUrl?: string;
  userId?: string;
  chatbotKey: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
}


const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  rasaServerUrl = import.meta.env.VITE_RASA_SERVER_URL || 'http://localhost:5005',
  userId,
  chatbotKey,
  position = 'bottom-right',
  primaryColor = '#3B82F6',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! 👋 Welcome to our store! I\'m here to help you find products, track orders, and answer any questions. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
      quickReplies: ['Browse Products', 'Track Order', 'View Cart', 'Help'],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
  console.log("Chatbot key:", chatbotKey);

  if (!text.trim()) return;

  const userMessage: Message = {
    id: Date.now().toString(),
    text: text.trim(),
    sender: "user",
    timestamp: new Date(),
  };

  setMessages((prev) => [...prev, userMessage]);
  setInputValue("");
  setIsLoading(true);
  setIsTyping(true);

  await new Promise((resolve) => setTimeout(resolve, 400));

  try {
    const faqResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/faq`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          question: text.trim(),
          chatbot_key: chatbotKey,
        }),
      }
    );

    const faqData = await faqResponse.json();

    if (faqData?.answer) {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: faqData.answer,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } else {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I don't have an answer for that yet.",
        sender: "bot",
        timestamp: new Date(),
        quickReplies: ["Help", "Browse Products"],
      };

      setMessages((prev) => [...prev, botMessage]);
    }
  } catch (error) {
    console.error("FAQ request failed:", error);

    const errorMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "Sorry, something went wrong. Please try again.",
      sender: "bot",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
    setIsTyping(false);
  }
};



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const handleButtonClick = (payload: string) => {
    sendMessage(payload);
  };

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const getQuickActionIcon = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('cart') || lowerText.includes('cart')) return <ShoppingCart className="w-4 h-4" />;
    if (lowerText.includes('order') || lowerText.includes('track')) return <Package className="w-4 h-4" />;
    if (lowerText.includes('help')) return <HelpCircle className="w-4 h-4" />;
    if (lowerText.includes('search') || lowerText.includes('product')) return <Search className="w-4 h-4" />;
    if (lowerText.includes('payment') || lowerText.includes('checkout')) return <CreditCard className="w-4 h-4" />;
    return null;
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClasses[position]} w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110 hover:shadow-3xl z-50 animate-bounce`}
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 10px 25px -5px ${primaryColor}40`,
          }}
          aria-label="Open chatbot"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed ${positionClasses[position]} w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 ${
            isMinimized ? 'h-16' : ''
          }`}
          style={{
            boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 rounded-t-2xl text-white"
            style={{ 
              backgroundColor: primaryColor,
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
            }}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Shopping Assistant</h3>
                <p className="text-xs opacity-90">Online now</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? (
                  <Maximize2 className="w-5 h-5" />
                ) : (
                  <Minimize2 className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
                aria-label="Close chatbot"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className="flex flex-col max-w-[85%]">
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                        }`}
                        style={
                          message.sender === 'user'
                            ? {
                                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                              }
                            : {}
                        }
                      >
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Product"
                            className="rounded-lg mb-2 max-w-full h-auto"
                          />
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                        <span className={`text-xs mt-1.5 block ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Quick Replies */}
                      {message.quickReplies && message.sender === 'bot' && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {message.quickReplies.map((reply, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickReply(reply)}
                              className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                            >
                              {getQuickActionIcon(reply)}
                              {reply}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Buttons */}
                      {message.buttons && message.sender === 'bot' && (
                        <div className="flex flex-col gap-2 mt-2">
                          {message.buttons.map((button, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleButtonClick(button.payload)}
                              className="px-4 py-2 text-sm bg-white border-2 rounded-lg hover:bg-gray-50 transition-all duration-200 text-left shadow-sm hover:shadow-md"
                              style={{ borderColor: primaryColor, color: primaryColor }}
                            >
                              {button.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex space-x-1.5">
                        <div
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ 
                            backgroundColor: primaryColor,
                            animationDelay: '0ms',
                          }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ 
                            backgroundColor: primaryColor,
                            animationDelay: '150ms',
                          }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full animate-bounce"
                          style={{ 
                            backgroundColor: primaryColor,
                            animationDelay: '300ms',
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                    style={{
                      focusRingColor: primaryColor,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = primaryColor;
                      e.target.style.boxShadow = `0 0 0 3px ${primaryColor}20`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '';
                      e.target.style.boxShadow = '';
                    }}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="p-3 rounded-xl text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 active:scale-95 shadow-lg"
                    style={{ 
                      backgroundColor: primaryColor,
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                    }}
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Powered by AI • Secure & Private
                </p>
              </form>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default ChatbotWidget;
