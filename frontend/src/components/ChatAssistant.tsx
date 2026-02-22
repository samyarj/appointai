import React, { useState, useRef, useEffect } from "react";
import { chatAPI } from "../api";
import { useRefresh } from "../contexts/RefreshContext";
import { useAuth } from "../contexts/AuthContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actionTaken?: string;
}

const getActionDescription = (action: string | undefined): string => {
  switch (action) {
    case "create_event": return "Created a new event";
    case "update_event": return "Updated existing event";
    case "delete_event": return "Deleted event";
    case "create_todo": return "Added a new task";
    case "update_todo": return "Updated task";
    case "delete_todo": return "Deleted task";
    case "create_category": return "Created a new category";
    default: return "Action executed successfully";
  }
};

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerRefresh } = useRefresh();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I am AppointAI, your smart scheduling assistant. How can I help you manage your calendar today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await chatAPI.sendMessage(
        userMessage.content,
        new Date().toString()
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        actionTaken: response.action_taken,
      };

      setMessages(prev => [...prev, botMessage]);

      if (response.action_taken && response.action_taken !== "error") {
        triggerRefresh();
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Action Button */}
      <div 
        className={`transition-all duration-300 ease-in-out transform ${
          isOpen ? 'scale-0 opacity-0 absolute pointer-events-none' : 'scale-100 opacity-100'
        }`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl hover:shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300 border border-blue-500/20"
          aria-label="Open AI Assistant"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      </div>

      {/* Floating Chat Panel */}
      <div 
        className={`w-[360px] sm:w-[400px] h-[600px] max-h-[80vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 transform transition-all duration-300 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none absolute'
        }`}
      >
        {/* Header */}
        <div className="flex-none px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-gray-800 dark:text-white leading-tight">AppointAI</h2>
              <p className="text-[12px] text-gray-500 dark:text-gray-400">Smart Scheduling Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close Assistant"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 bg-gray-50/50 dark:bg-gray-900/20 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                {msg.role === 'assistant' ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                )}
                <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">
                  {msg.role === 'assistant' ? 'AppointAI' : (user?.name || 'You')}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-auto">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div className="pl-8 pr-1">
                <div className="text-[14px] leading-relaxed">
                  {msg.role === 'user' ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-none p-3.5 text-gray-700 dark:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-700">
                      <p className="whitespace-pre-wrap m-0">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="text-gray-600 dark:text-gray-300">
                       <p className="whitespace-pre-wrap m-0">{msg.content}</p>
                    </div>
                  )}
                  
                  {/* Action Feedback */}
                  {msg.actionTaken && msg.actionTaken !== "error" && (
                    <div className="mt-3 flex items-center gap-2 text-[12px] font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-900/30 w-fit">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{getActionDescription(msg.actionTaken)}</span>
                    </div>
                  )}

                  {msg.actionTaken === "error" && (
                    <div className="mt-3 flex items-center gap-2 text-[12px] font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/30 w-fit">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Failed to execute action</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex flex-col gap-1.5 animate-pulse">
              <div className="flex items-center gap-2">
                 <div className="flex h-6 w-6 items-center justify-center rounded border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                   <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                   </svg>
                 </div>
                 <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">AppointAI is working...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 rounded-b-2xl">
          <form onSubmit={handleSendMessage} className="relative flex items-end bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700/50 p-1.5 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/50 transition-all">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Message AppointAI..."
              className="w-full bg-transparent py-2 pl-3 pr-2 text-[14px] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none resize-none overflow-y-auto"
              style={{ maxHeight: '120px' }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={`flex-none h-8 w-8 mb-1 mr-1 flex items-center justify-center rounded-full transition-all duration-300 ${
                inputValue.trim() && !isLoading
                  ? "bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5"
                  : "bg-gray-200 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              }`}
              aria-label="Send message"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
