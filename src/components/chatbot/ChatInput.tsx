import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface Props {
  disabled: boolean;
  onSend: (value: string) => void;
}

const ChatInput: React.FC<Props> = ({ disabled, onSend }) => {
  const [value, setValue] = useState('');

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
  };

  return (
    <div className="chat-input-wrap">
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={1}
        maxLength={4000}
        placeholder="Posez votre question technique..."
        disabled={disabled}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <button disabled={disabled || !value.trim()} onClick={submit}>
        <Send size={15} />
      </button>
    </div>
  );
};

export default ChatInput;
