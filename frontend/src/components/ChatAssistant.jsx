import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = {
        id: Date.now(),
        type: 'bot',
        text: `Hi ${user?.name || 'there'}! 👋 I'm your Event-Yetu assistant. I can help you with:\n\n• Finding the perfect event service\n• Booking recommendations\n• Trending events\n• Pricing information\n• Event planning tips\n\nHow can I assist you today?`,
        timestamp: new Date()
      };
      setMessages([greeting]);
    }
  }, [isOpen]);

  const quickActions = [
    { id: 1, text: 'Show trending services', icon: '📈' },
    { id: 2, text: 'Recommend services for me', icon: '⭐' },
    { id: 3, text: 'What are popular categories?', icon: '🎯' },
    { id: 4, text: 'Event planning tips', icon: '💡' },
  ];

  const handleQuickAction = (actionText) => {
    handleSendMessage(actionText);
  };

  const handleSendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getBotResponse(messageText);
      
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: response.text,
          data: response.data,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      setIsTyping(false);
      toast.error('Sorry, I encountered an error. Please try again.');
    }
  };

  const getBotResponse = async (message) => {
    const lowerMessage = message.toLowerCase();

    // Trending services
    if (lowerMessage.includes('trending') || lowerMessage.includes('popular')) {
      try {
        const response = await fetch('http://localhost/Event-yetu/backend/api/ai.php?action=trending-services', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.trending.length > 0) {
          const serviceList = data.trending.slice(0, 5).map((s, i) => 
            `${i + 1}. **${s.name}** - ${s.category} (${s.recent_bookings} bookings)`
          ).join('\n');
          
          return {
            text: `Here are the top trending services this month:\n\n${serviceList}\n\nThese services are getting lots of attention! Would you like more details about any of them?`,
            data: data.trending
          };
        }
      } catch (error) {
        console.error('Error fetching trending:', error);
      }
    }

    // Recommendations
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggestion')) {
      try {
        const response = await fetch('http://localhost/Event-yetu/backend/api/ai.php?action=service-recommendations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.recommendations.length > 0) {
          const serviceList = data.recommendations.slice(0, 5).map((s, i) => 
            `${i + 1}. **${s.name}** - Ksh ${parseFloat(s.price).toLocaleString()}\n   ${s.recommendation_reason}`
          ).join('\n\n');
          
          return {
            text: `Based on ${data.personalized ? 'your booking history' : 'what\'s popular'}, I recommend:\n\n${serviceList}\n\nWant to learn more about any of these?`,
            data: data.recommendations
          };
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
    }

    // Categories question
    if (lowerMessage.includes('categor') || lowerMessage.includes('type') || lowerMessage.includes('kind')) {
      try {
        const response = await fetch('http://localhost/Event-yetu/backend/api/ai.php?action=demand-forecast', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.forecast.length > 0) {
          const categoryList = data.forecast.map((c, i) => 
            `${i + 1}. **${c.category}** ${c.trend_icon || ''} - Avg ${c.average_bookings} bookings/month`
          ).join('\n');
          
          return {
            text: `Here are our most popular event categories:\n\n${categoryList}\n\nWhich category interests you most?`,
            data: data.forecast
          };
        }
      } catch (error) {
        console.error('Error fetching forecast:', error);
      }
    }

    // Event planning tips
    if (lowerMessage.includes('tip') || lowerMessage.includes('advice') || lowerMessage.includes('planning')) {
      const tips = [
        '📅 **Book Early**: Popular services book up 2-3 months in advance, especially for weddings and corporate events.',
        '💰 **Budget Smart**: Allocate 40% to venue, 30% to catering, 20% to entertainment, and 10% for miscellaneous.',
        '🎯 **Read Reviews**: Check provider ratings and past client feedback before booking.',
        '📋 **Create Checklist**: Break down your event into phases - planning, booking, coordination, and execution.',
        '🤝 **Communicate Clearly**: Share your vision, budget, and expectations upfront with providers.',
        '⏰ **Plan Buffer Time**: Add 15-20% extra time to your schedule for unexpected delays.',
      ];
      
      const randomTips = tips.sort(() => 0.5 - Math.random()).slice(0, 4);
      
      return {
        text: `Here are some event planning tips to help you succeed:\n\n${randomTips.join('\n\n')}\n\nNeed specific advice for your event type?`
      };
    }

    // Pricing question
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget')) {
      return {
        text: `Event pricing varies by category:\n\n• **Venues**: Ksh 10,000 - 200,000+\n• **Catering**: Ksh 500 - 3,000 per person\n• **Photography**: Ksh 15,000 - 80,000\n• **Entertainment**: Ksh 20,000 - 150,000\n• **Decorations**: Ksh 5,000 - 100,000\n\nPrices depend on event size, location, and provider experience. Would you like to see services in a specific price range?`
      };
    }

    // Booking process
    if (lowerMessage.includes('book') || lowerMessage.includes('how to')) {
      return {
        text: `Booking on Event-Yetu is easy! Just follow these steps:\n\n1️⃣ Browse services or use search\n2️⃣ Click on a service you like\n3️⃣ Check availability and details\n4️⃣ Click "Book Now"\n5️⃣ Fill in event details\n6️⃣ Make payment via M-Pesa\n7️⃣ Get instant confirmation!\n\nYou can track all your bookings in "My Bookings". Need help finding a specific service?`
      };
    }

    // Help/general
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you')) {
      return {
        text: `I can assist you with:\n\n✨ **Service Discovery**: Find trending services and personalized recommendations\n📊 **Market Insights**: Popular categories and demand trends\n💡 **Expert Advice**: Event planning tips and best practices\n💰 **Pricing Info**: Budget guidance for different event types\n📖 **How-to Guides**: Booking process and platform features\n\nJust ask me anything about events or services!`
      };
    }

    // Default response
    return {
      text: `I'm not sure I understood that. Try asking me about:\n\n• Trending services\n• Service recommendations\n• Event categories\n• Planning tips\n• Pricing information\n• How to book\n\nWhat would you like to know?`
    };
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 group"
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
          </div>
          <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Chat with AI Assistant
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
              </div>
              <div>
                <h3 className="font-semibold">Event-Yetu Assistant</h3>
                <p className="text-xs text-white/80">Online • AI-powered</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map(message => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border border-gray-200'} rounded-2xl px-4 py-2 shadow-sm`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 1 && !isTyping && (
            <div className="px-4 py-2 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.text)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                  >
                    <span>{action.icon}</span>
                    <span>{action.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isTyping}
                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
