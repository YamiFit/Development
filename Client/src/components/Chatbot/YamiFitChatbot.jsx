/**
 * YamiFit Chatbot Component
 * Floating chat widget for nutrition and fitness coaching
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/context/LanguageContext';
import { useChatbot } from '@/hooks/useChatbot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Trash2,
  Bot,
  User,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

/**
 * Single chat message component
 */
const ChatMessage = ({ message, isRTL }) => {
  const isUser = message.role === 'user';
  const isOptimistic = message.isOptimistic;

  return (
    <div
      className={cn(
        'flex gap-2 mb-3',
        isUser ? (isRTL ? 'flex-row-reverse' : 'flex-row-reverse') : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-emerald-500 text-white'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm',
          isOptimistic && 'opacity-70'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-inherit">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        {message.created_at && (
          <p
            className={cn(
              'text-[10px] mt-1 opacity-60',
              isUser ? 'text-right' : 'text-left'
            )}
          >
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Typing indicator component
 */
const TypingIndicator = () => (
  <div className="flex gap-2 mb-3">
    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
      <Bot className="w-4 h-4 text-white" />
    </div>
    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

/**
 * Empty state component
 */
const EmptyState = ({ isRTL }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
        <Bot className="w-8 h-8 text-emerald-600" />
      </div>
      <h3 className="font-semibold text-lg mb-2">
        {isRTL ? 'مرحباً! أنا YamiFit Chatbot' : 'Hi! I\'m YamiFit Chatbot'}
      </h3>
      <p className="text-muted-foreground text-sm max-w-[250px]">
        {isRTL 
          ? 'أنا هنا لمساعدتك في التغذية والتمارين الرياضية. اسألني أي شيء!'
          : 'I\'m here to help with nutrition and workouts. Ask me anything!'
        }
      </p>
      <p className="text-xs text-muted-foreground mt-4 opacity-70">
        {isRTL ? 'يتم حفظ المحادثات لمدة 24 ساعة' : 'Chats are kept for 24 hours'}
      </p>
    </div>
  );
};

/**
 * Main Chatbot Component
 */
const YamiFitChatbot = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const inputRef = useRef(null);
  
  const {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    clearHistory,
    loadHistory,
    messagesEndRef,
    setError,
  } = useChatbot();

  // Popup notification - show every 2 minutes for 5 seconds when chat is closed
  useEffect(() => {
    // Don't show popup if chat is open
    if (isOpen) {
      setShowPopup(false);
      return;
    }

    // Show popup initially after 5 seconds
    const initialTimeout = setTimeout(() => {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 5000);
    }, 5000);

    // Then show every 2 minutes
    const interval = setInterval(() => {
      if (!isOpen) {
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000);
      }
    }, 120000); // 2 minutes = 120000ms

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    if (window.confirm(isRTL ? 'هل تريد مسح المحادثة؟' : 'Clear chat history?')) {
      await clearHistory();
    }
  };

  return (
    <>
      {/* Popup Notification Tooltip */}
      {showPopup && !isOpen && (
        <div
          className={cn(
            'fixed bottom-24 z-50 animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
            isRTL ? 'left-4' : 'right-4'
          )}
        >
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-emerald-200 dark:border-emerald-700 p-4 max-w-[200px]">
            {/* Arrow pointing down */}
            <div 
              className={cn(
                'absolute -bottom-2 w-4 h-4 bg-white dark:bg-gray-800 border-b border-r border-emerald-200 dark:border-emerald-700 transform rotate-45',
                isRTL ? 'left-6' : 'right-6'
              )}
            />
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-5 h-5 text-emerald-500" />
              <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                {isRTL ? 'مساعد YamiFit' : 'YamiFit AI'}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {isRTL 
                ? '👋 مرحباً! تحدث معي للحصول على نصائح التغذية واللياقة!' 
                : '👋 Hey! Chat with me for nutrition & fitness tips!'}
            </p>
            {/* Close button */}
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-2 rtl:right-auto rtl:left-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 z-50 w-14 h-14 rounded-full shadow-lg',
          'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
          'flex items-center justify-center transition-all duration-200',
          'hover:scale-105 active:scale-95',
          isRTL ? 'left-6' : 'right-6'
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-24 z-50 w-[360px] h-[500px] max-h-[70vh]',
            'bg-background border rounded-2xl shadow-2xl',
            'flex flex-col overflow-hidden',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            isRTL ? 'left-6' : 'right-6'
          )}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-emerald-500 to-green-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">YamiFit Chatbot</h3>
                <p className="text-[10px] text-white/80">
                  {isRTL ? 'مدرب التغذية واللياقة' : 'Nutrition & Fitness Coach'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={handleClear}
                  title={isRTL ? 'مسح المحادثة' : 'Clear chat'}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState isRTL={isRTL} />
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} isRTL={isRTL} />
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </ScrollArea>

          {/* Error Display */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => {
                    setError(null);
                    loadHistory();
                  }}
                  className="p-1 hover:bg-destructive/10 rounded"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t bg-muted/30">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRTL ? 'اكتب رسالتك...' : 'Type a message...'}
                disabled={isLoading}
                className="flex-1 bg-background"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className={cn('w-4 h-4', isRTL && 'rotate-180')} />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              {isRTL ? 'يتم حفظ المحادثات لمدة 24 ساعة' : 'Chats are kept for 24 hours'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default YamiFitChatbot;
