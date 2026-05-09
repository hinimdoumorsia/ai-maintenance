import { useEffect, useMemo, useState } from 'react';
import { API } from '../../contexts/DatasetContext';

export type ChatRole = 'user' | 'assistant';

export interface ChatSource {
  doc_id?: string;
  doc_title?: string;
  source_pdf?: string;
  page_number?: number;
  heading_context?: string;
  excerpt?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  sources?: ChatSource[];
}

const STORAGE_KEY = 'chatbot_history_session';

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [themeFilter, setThemeFilter] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setMessages(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const conversationHistory = useMemo(
    () =>
      messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      })),
    [messages]
  );

  const sendMessage = async (content: string) => {
    const clean = content.trim();
    if (!clean || isLoading) return;

    setError('');
    const userMsg: ChatMessage = { id: newId(), role: 'user', content: clean };
    const assistantMsgId = newId();
    const assistantMsg: ChatMessage = { id: assistantMsgId, role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      const res = await fetch(`${API}/api/chatbot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          conversation_history: conversationHistory,
          filters: { theme: themeFilter },
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Backend indisponible (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const line = evt
            .split('\n')
            .find(l => l.startsWith('data: '));
          if (!line) continue;
          const payload = JSON.parse(line.slice(6));

          if (payload.type === 'token') {
            setMessages(prev =>
              prev.map(m => (m.id === assistantMsgId ? { ...m, content: m.content + payload.token } : m))
            );
          } else if (payload.type === 'done') {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, sources: payload.sources || [] }
                  : m
              )
            );
          }
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la reponse du bot.');
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: "Le backend chatbot est indisponible. Verifiez l'API FastAPI." }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
    setError('');
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
    themeFilter,
    setThemeFilter,
  };
}
