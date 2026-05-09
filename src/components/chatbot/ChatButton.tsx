import React from 'react';
import { HelpCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onClick: () => void;
}

const ChatButton: React.FC<Props> = ({ open, onClick }) => {
  return (
    <button className={`chatbot-fab${open ? ' open' : ''}`} onClick={onClick} aria-label="Ouvrir le chat">
      <HelpCircle size={20} />
      {!open && <span className="chatbot-pulse" />}
    </button>
  );
};

export default ChatButton;
