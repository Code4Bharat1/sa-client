'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/context/SocketContext';
import { useGetTicketMessagesQuery, useSendMessageMutation, ChatMessage } from '@/store/api/messagesApi';
import { Paperclip, Mic, Square, Send, Loader2, User, Shield, Smile, Reply, X, ChevronDown } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface TicketChatProps {
  ticketId: string;
  ticketStatus?: string;
  className?: string;
}

export function TicketChat({ ticketId, ticketStatus, className = '' }: TicketChatProps) {
  const { user, accessToken } = useAuth();
  const { socket } = useSocket();
  const { data, isLoading } = useGetTicketMessagesQuery(ticketId);
  const [sendMessageMutation] = useSendMessageMutation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

  const scrollToMessage = (targetMsgId: string) => {
    const elem = document.getElementById(`msg-${targetMsgId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(targetMsgId);
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 2000);
    } else {
      toast.error('Original message not found');
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatFeedRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);

  const isClosed = ticketStatus === 'Closed';

  const handleScroll = () => {
    if (!chatFeedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatFeedRef.current;
    const isFar = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottom(isFar);
    if (!isFar) {
      setHasUnreadBelow(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasUnreadBelow(false);
    setShowScrollBottom(false);
  };

  // Load initial messages
  useEffect(() => {
    if (data?.data) {
      setMessages(data.data);
    }
  }, [data]);

  // Click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Socket room joining and listeners
  useEffect(() => {
    if (!socket || !ticketId) return;

    socket.emit('join_ticket', ticketId);
    socket.emit('mark_read', ticketId);

    const handleNewMessage = (newMsg: ChatMessage) => {
      if (newMsg.ticketId === ticketId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        socket.emit('mark_read', ticketId);

        const isFar = chatFeedRef.current
          ? chatFeedRef.current.scrollHeight - chatFeedRef.current.scrollTop - chatFeedRef.current.clientHeight > 120
          : false;
        if (isFar) {
          setHasUnreadBelow(true);
        }
      }
    };

    const handleUserTyping = (data: { userId: string; senderName: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        if (data.isTyping) {
          setTypingUser(data.senderName);
        } else {
          setTypingUser(null);
        }
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.emit('leave_ticket', ticketId);
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, ticketId, user?.id]);

  // Scroll to bottom on message change if not scrolled up
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUser, showScrollBottom]);

  // Handle typing status notification
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!socket) return;

    socket.emit('typing', { ticketId, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { ticketId, isTyping: false });
    }, 2000);
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setInputText((prev) => prev + emojiData.emoji);
  };

  // Upload handler
  const uploadFile = async (file: File | Blob, filename?: string): Promise<string> => {
    const formData = new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    } else {
      formData.append('file', file, filename || 'chat-voice-note.webm');
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/tickets/upload`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      }
    );

    if (!response.ok) throw new Error('Upload failed');
    const resData = await response.json();
    return resData.url;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadFile(file);
        setAttachments((prev) => [...prev, url]);
      }
      toast.success('File uploaded');
    } catch (err) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setUploading(true);
        try {
          const url = await uploadFile(audioBlob, `voice-note-${Date.now()}.webm`);
          setAttachments((prev) => [...prev, url]);
          toast.success('Voice note attached');
        } catch (err) {
          toast.error('Failed to upload voice note');
        } finally {
          setUploading(false);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Send message handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;

    const messageText = inputText.trim();
    const currentAttachments = [...attachments];
    const replyPayload = replyingTo
      ? {
          messageId: replyingTo._id,
          senderName: replyingTo.senderName,
          senderRole: replyingTo.senderRole,
          message: replyingTo.message || (replyingTo.attachments?.length ? 'Attachment' : ''),
        }
      : undefined;

    setInputText('');
    setAttachments([]);
    setReplyingTo(null);
    setShowEmojiPicker(false);

    if (socket) {
      socket.emit('send_message', {
        ticketId,
        message: messageText,
        attachments: currentAttachments,
        replyTo: replyPayload,
      });
    } else {
      try {
        await sendMessageMutation({
          ticketId,
          message: messageText,
          attachments: currentAttachments,
          replyTo: replyPayload,
        }).unwrap();
      } catch (err) {
        toast.error('Failed to send message');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading chat...
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-[520px] max-h-[520px] bg-white rounded-xl border border-gray-200 shadow-sm relative ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-semibold text-gray-800 text-sm">Live Discussion</h3>
          <span className="text-xs text-gray-400">#{ticketId}</span>
        </div>
        {isClosed && (
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md font-medium">
            Ticket Closed (Read-Only)
          </span>
        )}
      </div>

      {/* Messages Feed */}
      <div ref={chatFeedRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30 relative">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-12 text-xs">
            No messages yet. Start the discussion below.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const isAdmin = msg.senderRole === 'admin';
            return (
              <div
                key={msg._id}
                id={`msg-${msg._id}`}
                className={`group flex gap-2.5 relative transition-all duration-300 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                    isAdmin ? 'bg-indigo-600' : 'bg-primary-600'
                  }`}
                >
                  {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end text-right' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[11px] font-semibold text-gray-700">
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>

                  <div className={`flex items-center gap-1.5 group/msg relative ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div
                      className={`p-3 rounded-2xl text-sm leading-relaxed transition-all duration-300 ${
                        highlightedMsgId === msg._id ? 'ring-4 ring-amber-400 scale-[1.02] shadow-md' : ''
                      } ${
                        isMe
                          ? 'bg-primary-600 text-white rounded-tr-none'
                          : isAdmin
                          ? 'bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-tl-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {/* Quoted Parent Reply Snippet */}
                      {msg.replyTo && (
                        <div
                          onClick={() => scrollToMessage(msg.replyTo!.messageId)}
                          className={`mb-2 p-2 rounded-lg text-xs border-l-3 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all select-none ${
                            isMe
                              ? 'bg-primary-700/60 border-gold-400 text-primary-50 hover:bg-primary-700/80'
                              : 'bg-slate-100 border-indigo-400 text-slate-700 hover:bg-slate-200/80'
                          }`}
                          title="Click to jump to original message"
                        >
                          <p className="font-semibold opacity-90">{msg.replyTo.senderName}</p>
                          <p className="truncate opacity-80 mt-0.5">
                            {msg.replyTo.message || '[Attachment]'}
                          </p>
                        </div>
                      )}

                      {msg.message && <p className="whitespace-pre-wrap">{msg.message}</p>}

                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1.5 border-t border-black/10 pt-1.5">
                          {msg.attachments.map((url, idx) => {
                            const isAudio =
                              url.includes('.webm') ||
                              url.includes('.mp3') ||
                              url.includes('.wav') ||
                              url.includes('.ogg');
                            return isAudio ? (
                              <audio key={idx} src={url} controls className="h-8 max-w-full" />
                            ) : (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs underline block truncate hover:opacity-80"
                              >
                                Attachment #{idx + 1}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Hover Reply Action Button */}
                    {!isClosed && (
                      <button
                        type="button"
                        onClick={() => setReplyingTo(msg)}
                        className={`p-1.5 bg-white border border-gray-200 text-gray-500 hover:text-primary-600 hover:bg-gray-50 rounded-full shadow-sm transition flex-shrink-0 ${
                          replyingTo?._id === msg._id
                            ? 'opacity-100 ring-2 ring-primary-500 text-primary-600'
                            : 'opacity-0 group-hover/msg:opacity-100'
                        }`}
                        title="Reply to message"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typingUser && (
          <div className="text-xs text-gray-400 italic flex items-center gap-1 pl-9">
            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            {typingUser} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className={`sticky bottom-2 float-right z-20 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-semibold transition-all duration-300 animate-bounce ${
              hasUnreadBelow
                ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            <ChevronDown className="w-4 h-4" />
            {hasUnreadBelow ? 'New message below' : 'Scroll to bottom'}
          </button>
        )}
      </div>

      {/* Attachment Previews before sending */}
      {attachments.length > 0 && (
        <div className="p-2 border-t border-gray-100 bg-slate-50 flex items-center gap-2 overflow-x-auto">
          {attachments.map((url, idx) => (
            <span
              key={idx}
              className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded flex items-center gap-1 shadow-sm"
            >
              Attached #{idx + 1}
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="text-red-500 hover:text-red-700 ml-1 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Active Reply Banner */}
      {replyingTo && (
        <div className="px-3 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <Reply className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <div className="truncate">
              <span className="font-semibold">Replying to {replyingTo.senderName}: </span>
              <span className="italic opacity-80">"{replyingTo.message || '[Attachment]'}"</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-indigo-400 hover:text-indigo-700 p-0.5 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-16 left-3 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-200"
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} height={350} width={320} />
        </div>
      )}

      {/* Input Console */}
      {!isClosed ? (
        <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-white flex items-center gap-2">
          {/* File Upload Trigger */}
          <input
            type="file"
            multiple
            id={`chat-file-${ticketId}`}
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label
            htmlFor={`chat-file-${ticketId}`}
            className="p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-gray-100 cursor-pointer transition"
            title="Attach Media"
          >
            <Paperclip className="w-4 h-4" />
          </label>

          {/* Emoji Picker Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`p-2 rounded-full transition ${
              showEmojiPicker ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100'
            }`}
            title="Choose Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Voice Note Record */}
          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full flex items-center gap-1 animate-pulse font-medium"
            >
              <Square className="w-3 h-3 fill-red-600" /> Stop ({recordDuration}s)
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={uploading}
              className="p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-gray-100 transition"
              title="Record Voice Note"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && attachments.length === 0) || uploading}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-40 transition flex items-center justify-center"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      ) : (
        <div className="p-3 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
          This ticket is closed. Discussion is locked.
        </div>
      )}
    </div>
  );
}
