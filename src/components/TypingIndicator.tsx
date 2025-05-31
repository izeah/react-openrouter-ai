import React from "react";

interface TypingIndicatorProps {}

const TypingIndicator: React.FC<TypingIndicatorProps> = () => {
  return (
    <div className="typing-indicator">
      <div className="typing-dot"></div>
      <div className="typing-dot"></div>
      <div className="typing-dot"></div>
    </div>
  );
};

export default TypingIndicator;
