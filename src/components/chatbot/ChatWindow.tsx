import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Trash2, X } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChatbot } from './useChatbot';
import { API } from '../../contexts/DatasetContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ChatWindow: React.FC<Props> = ({ open, onClose }) => {
  const { messages, isLoading, error, sendMessage, clearHistory, themeFilter, setThemeFilter } = useChatbot();
  const [themes, setThemes] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/api/chatbot/themes`)
      .then(r => r.json())
      .then(d => setThemes(d.themes || []))
      .catch(() => setThemes([]));
  }, []);

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, isLoading]);

  const welcome = useMemo(
    () => ({
      id: 'welcome',
      role: 'assistant' as const,
      content:
        "Bonjour ! Je suis votre assistant technique. Posez-moi vos questions sur l'analyse vibratoire, les roulements, la maintenance conditionnelle et les normes.",
    }),
    []
  );

  if (!open) return null;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-title"><Bot size={15} /> Assistant Maintenance</div>
        <div className="chat-actions">
          <button title="Vider l'historique" onClick={clearHistory}><Trash2 size={14} /></button>
          <button title="Fermer" onClick={onClose}><X size={14} /></button>
        </div>
      </div>

      <div className="chat-theme-filter">
        <select value={themeFilter || ''} onChange={e => setThemeFilter(e.target.value || null)}>
          <option value="">Tous les thèmes</option>
          {themes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {messages.length === 0 && <ChatMessage message={welcome as any} />}
        {messages.map(m => <ChatMessage key={m.id} message={m} />)}
        {isLoading && <div className="chat-typing"><span /><span /><span /></div>}
      </div>

      {error && <div className="chat-error">{error}</div>}
      <ChatInput disabled={isLoading} onSend={sendMessage} />
    </div>
  );
};

export default ChatWindow;
