'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/types/task';

interface Props {
  projectId: string;
  userRole: 'manager' | 'vendor';
}

export default function WarRoomChat({ projectId, userRole }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('project_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Simple polling for realtime feel
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    // Only scroll if we added new messages, don't steal focus on every poll
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('project_messages').insert({
        project_id: projectId,
        sender_id: user.id,
        sender_role: userRole,
        content: inputText
      });
      
      if (error) throw error;
      
      setInputText('');
      await fetchMessages();
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="war-room-chat-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '500px', background: 'var(--glass-bg)', borderRadius: '20px', border: '1px solid var(--glass-border)', padding: '1rem' }}>
      <h4 className="intel-title" style={{ marginBottom: '1rem', flexShrink: 0 }}>💬 War Room Comms</h4>
      
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1rem' }}>
        {messages.length === 0 ? (
          <div style={{ opacity: 0.5, fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_role === userRole;
            return (
              <div key={msg.id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.2rem', textAlign: isMine ? 'right' : 'left', textTransform: 'capitalize' }}>
                  {msg.sender_role}
                </div>
                <div style={{
                  background: isMine ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${isMine ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  padding: '0.75rem 1rem',
                  borderRadius: isMine ? '15px 15px 0 15px' : '15px 15px 15px 0',
                  color: isMine ? '#fff' : 'var(--text-secondary)'
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Share updates, links, or media..."
          style={{ flex: 1, padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: '#fff', outline: 'none' }}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !inputText.trim()} style={{
          background: 'linear-gradient(135deg, #0ba360, #3cba92)',
          border: 'none',
          borderRadius: '12px',
          padding: '0 1.5rem',
          color: '#fff',
          fontWeight: 600,
          cursor: inputText.trim() && !loading ? 'pointer' : 'not-allowed',
          opacity: inputText.trim() && !loading ? 1 : 0.5
        }}>
          Send
        </button>
      </form>
    </div>
  );
}
