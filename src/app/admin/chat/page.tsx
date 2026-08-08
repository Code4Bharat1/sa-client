'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetAdminChatThreadsQuery } from '@/store/api/messagesApi';
import { TicketChat } from '@/components/tickets/TicketChat';
import { StatusBadge, PriorityBadge } from '@/components/shared/StatusBadge';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { Search, MessageSquare, ExternalLink, Ticket, Shield, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AdminChatPage() {
  const searchParams = useSearchParams();
  const queryTicketId = searchParams.get('ticketId');

  const { data, isLoading, refetch } = useGetAdminChatThreadsQuery();
  const threads = data?.data || [];

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeThread =
    threads.find((t) => t.ticketId === (selectedTicketId || queryTicketId)) ||
    threads[0] ||
    null;
  const currentTicketId = selectedTicketId || queryTicketId || activeThread?.ticketId || null;

  const filteredThreads = threads.filter((t) => {
    const q = searchQuery.toLowerCase();
    const tId = t.ticketId.toLowerCase();
    const custName = t.ticket?.customerId?.name?.toLowerCase() || '';
    const panelSn = t.ticket?.panelSerialNumber?.toLowerCase() || '';
    return tId.includes(q) || custName.includes(q) || panelSn.includes(q);
  });

  if (isLoading) return <Spinner className="py-16" />;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" /> Live Support Chat
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Direct real-time communication console with customers for active support tickets.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 text-gray-500 hover:text-primary-600 border border-gray-200 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Threads
        </button>
      </div>

      {/* Main Dual-Pane Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-140px)] min-h-[500px]">
        {/* Left Pane: Conversation List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-gray-100 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket, customer, panel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
            </div>
          </div>

          {/* Threads list */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredThreads.length === 0 ? (
              <div className="text-center text-gray-400 py-12 text-xs">
                No active chat conversations found.
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isActive = t.ticketId === currentTicketId;
                return (
                  <button
                    key={t.ticketId}
                    onClick={() => setSelectedTicketId(t.ticketId)}
                    className={`w-full text-left p-3 transition flex flex-col space-y-1.5 ${
                      isActive ? 'bg-primary-50/60 border-l-4 border-primary-600' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary-900">#{t.ticketId}</span>
                      <span className="text-[10px] text-gray-400">{formatDate(t.updatedAt)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700 truncate">
                        {t.ticket?.customerId?.name || 'Customer'}
                      </span>
                      {t.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {t.unreadCount} new
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 truncate">
                      <span className="font-medium text-gray-600">{t.lastSenderName}: </span>
                      {t.lastMessage || 'Sent an attachment'}
                    </p>

                    {t.ticket && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <StatusBadge status={t.ticket.status} />
                        <PriorityBadge priority={t.ticket.priority} />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Ticket Chat & Details */}
        <div className="lg:col-span-8 flex flex-col space-y-4 h-full min-h-0 overflow-hidden">
          {activeThread && currentTicketId ? (
            <>
              {/* Ticket Quick Header */}
              {activeThread.ticket && (
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-gray-900">
                        {activeThread.ticket.customerId?.name || 'Customer'}
                      </h2>
                      <StatusBadge status={activeThread.ticket.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      Panel: <span className="font-mono font-medium text-gray-700">{activeThread.ticket.panelSerialNumber}</span> | Category: <span className="font-medium text-gray-700">{activeThread.ticket.issueCategory}</span>
                    </p>
                  </div>

                  <Link
                    href={`/admin/tickets/${currentTicketId}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800 bg-primary-50 px-2.5 py-1.5 rounded-lg border border-primary-100 transition"
                  >
                    View Ticket Details <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* Chat Window */}
              <TicketChat
                ticketId={currentTicketId}
                ticketStatus={activeThread.ticket?.status}
                className="flex-1 h-full min-h-0 max-h-none"
              />
            </>
          ) : (
            <div className="h-full bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-200 mb-2" />
              <p className="text-sm font-medium">Select a conversation from the left to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
