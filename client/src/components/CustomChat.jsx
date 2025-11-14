import React, { useState, useEffect, useRef } from "react";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";

export function CustomChat() {
  const player = usePlayer();
  const game = useGame();
  const [message, setMessage] = useState("");
  const [showFade, setShowFade] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Get messages from game attribute
  const messages = game.get("chatMessages") || [];
  const currentDisplayName = player.get("displayName") || "You";

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 96) + 'px';
    }
  }, [message]);

  // Handle scroll to show/hide fade
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollTop = scrollContainerRef.current.scrollTop;
      setShowFade(scrollTop > 10);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      playerId: player.id,
      displayName: currentDisplayName,
      text: message.trim(),
      timestamp: Date.now()
    };

    // Append to existing messages
    const updatedMessages = [...messages, newMessage];
    game.set("chatMessages", updatedMessages);

    setMessage("");
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Fade overlay at top - only show when scrolled */}
      {showFade && (
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none z-10"></div>
      )}

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {messages.map((msg, idx) => {
          const isCurrentPlayer = msg.playerId === player.id;

          return (
            <div
              key={idx}
              className={`flex flex-col ${isCurrentPlayer ? "items-end" : "items-start"}`}
            >
              {/* Display name */}
              <div className={`text-xs text-gray-600 mb-1 px-1 ${isCurrentPlayer ? "text-right" : "text-left"}`}>
                {isCurrentPlayer ? "You" : msg.displayName}
              </div>

              {/* Message bubble */}
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                  isCurrentPlayer
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-gray-300 text-gray-900 rounded-bl-sm"
                }`}
              >
                <p className="text-sm break-words">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="border-t border-gray-300 p-2">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
            style={{
              minHeight: '2.5rem',
              maxHeight: '6rem',
              height: 'auto'
            }}
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
