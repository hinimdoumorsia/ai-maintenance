import React from 'react';
import { FileText } from 'lucide-react';
import type { ChatSource } from './useChatbot';

interface Props {
  sources: ChatSource[];
}

const ChatSources: React.FC<Props> = ({ sources }) => {
  if (!sources?.length) return null;

  const goToDoc = (s: ChatSource) => {
    const docParam = s.doc_id ? `&docId=${encodeURIComponent(s.doc_id)}` : '';
    window.location.href = `/donnees?tab=docs-tech${docParam}`;
  };

  return (
    <details className="chat-sources">
      <summary>Sources ({sources.length})</summary>
      <div className="chat-sources-list">
        {sources.map((s, i) => (
          <button key={i} className="chat-source-item" onClick={() => goToDoc(s)}>
            <FileText size={14} />
            <div>
              <strong>{s.doc_title || s.source_pdf || 'Document'}</strong>
              <div>Page {s.page_number || '?'} - {s.heading_context || 'Section'}</div>
              {s.excerpt && <em>{s.excerpt}</em>}
            </div>
          </button>
        ))}
      </div>
    </details>
  );
};

export default ChatSources;
