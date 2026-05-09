import React, { useState } from 'react';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';
import './chatbot.css';

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="chatbot-widget-root">
      <ChatButton open={open} onClick={() => setOpen(v => !v)} />
      <ChatWindow open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default ChatWidget;
