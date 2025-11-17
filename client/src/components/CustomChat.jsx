import React, { useState, useEffect, useRef } from "react";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";

// Helper function for relative time
function relTime(timestamp) {
  const difference = (Date.now() - timestamp) / 1000;

  if (difference < 60) {
    return "just now";
  } else if (difference < 3600) {
    const mins = Math.floor(difference / 60);
    return `${mins} ${mins === 1 ? 'min' : 'mins'}`;
  } else if (difference < 86400) {
    const hours = Math.floor(difference / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    const days = Math.floor(difference / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
}

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
        {messages.length === 0 ? (
          <div className="h-full w-full flex justify-center items-center">
            <div className="flex flex-col justify-center items-center w-2/3 space-y-2">
              <div className="w-24 h-24 text-gray-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-full w-full fill-current"
                  viewBox="0 0 512 512"
                >
                  <path d="M123.6 391.3c12.9-9.4 29.6-11.8 44.6-6.4c26.5 9.6 56.2 15.1 87.8 15.1c124.7 0 208-80.5 208-160s-83.3-160-208-160S48 160.5 48 240c0 32 12.4 62.8 35.7 89.2c8.6 9.7 12.8 22.5 11.8 35.5c-1.4 18.1-5.7 34.7-11.3 49.4c17-7.9 31.1-16.7 39.4-22.7zM21.2 431.9c1.8-2.7 3.5-5.4 5.1-8.1c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208s-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6c-15.1 6.6-32.3 12.6-50.1 16.1c-.8 .2-1.6 .3-2.4 .5c-4.4 .8-8.7 1.5-13.2 1.9c-.2 0-.5 .1-.7 .1c-5.1 .5-10.2 .8-15.3 .8c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4c4.1-4.2 7.8-8.7 11.3-13.5c1.7-2.3 3.3-4.6 4.8-6.9c.1-.2 .2-.3 .3-.5z" />
                </svg>
              </div>

              <h4 className="text-gray-700 font-semibold">No chat yet</h4>

              <p className="text-gray-500 text-center">
                Send a message to start the conversation.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isCurrentPlayer = msg.playerId === player.id;

            return (
              <div
                key={idx}
                className={`flex flex-col ${isCurrentPlayer ? "items-end" : "items-start"}`}
              >
                {/* Display name */}
                <div className={`text-xs mb-1 px-1 ${isCurrentPlayer ? "text-right" : "text-left"}`}>
                  <span className={isCurrentPlayer ? "text-blue-500" : "text-gray-600"}>
                    {isCurrentPlayer ? "You" : msg.displayName}
                  </span>
                  {msg.timestamp && (
                    <span className={`ml-1 ${isCurrentPlayer ? "text-blue-400" : "text-gray-400"}`}>({relTime(msg.timestamp)})</span>
                  )}
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
          })
        )}
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
