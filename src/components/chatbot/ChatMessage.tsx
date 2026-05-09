import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage as Msg } from './useChatbot';
import ChatSources from './ChatSources';

interface Props {
  message: Msg;
}

const ChatMessage: React.FC<Props> = ({ message }) => {
  return (
    <div className={`chat-msg ${message.role}`}>
      <div className="chat-bubble">
        {message.role === 'assistant' ? (
          <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
        ) : (
          <span>{message.content}</span>
        )}
      </div>
      {message.role === 'assistant' && message.sources?.length ? (
        <ChatSources sources={message.sources} />
      ) : null}
    </div>
  );
};

export default ChatMessage;
