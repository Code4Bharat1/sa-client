'use client';
import { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Settings, Bell, Clock, RefreshCw, Shield } from 'lucide-react';

export default function AdminConfigPage() {
  const [slaResponse, setSlaResponse] = useState('4');
  const [slaResolution, setSlaResolution] = useState('48');
  const [autoClose, setAutoClose] = useState('3');
  const [reopenWindow, setReopenWindow] = useState('7');
  const [notifChannels, setNotifChannels] = useState<string[]>(['sms','email','whatsapp','in-app']);

  const handleSave = () => {
    toast.success('Configuration saved (connect to backend in Phase 6)');
  };

  const toggleChannel = (ch: string) => {
    setNotifChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const CONFIG_SECTIONS = [
    {
      icon: Clock,
      title: 'SLA Configuration',
      description: 'Set default response and resolution time targets for tickets',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Default Response Time (hours)"
            type="number"
            min="1"
            value={slaResponse}
            onChange={(e) => setSlaResponse(e.target.value)}
          />
          <Input
            label="Default Resolution Time (hours)"
            type="number"
            min="1"
            value={slaResolution}
            onChange={(e) => setSlaResolution(e.target.value)}
          />
          <div className="md:col-span-2 bg-primary-50 rounded-lg p-3 text-sm text-primary-800 border border-primary-100">
            <strong>Per-category overrides</strong> (set in SLAConfig collection): Panel not turning on = 2h response / 24h resolution · Warranty claim = 8h/120h
          </div>
        </div>
      ),
    },
    {
      icon: RefreshCw,
      title: 'Ticket Lifecycle',
      description: 'Configure auto-close and reopen window periods',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input
            label="Auto-close window (days after resolution)"
            type="number"
            min="1"
            value={autoClose}
            onChange={(e) => setAutoClose(e.target.value)}
          />
          <Input
            label="Reopen window (days after closure)"
            type="number"
            min="1"
            value={reopenWindow}
            onChange={(e) => setReopenWindow(e.target.value)}
          />
        </div>
      ),
    },
    {
      icon: Bell,
      title: 'Notification Channels',
      description: 'Enable or disable notification delivery channels',
      content: (
        <div className="flex flex-wrap gap-3 mt-4">
          {['sms','email','whatsapp','in-app'].map((ch) => (
            <button
              key={ch}
              onClick={() => toggleChannel(ch)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                notifChannels.includes(ch)
                  ? 'bg-primary-800 text-white border-primary-800 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-primary-400'
              }`}
            >
              {ch.toUpperCase()}
            </button>
          ))}
        </div>
      ),
    },
    {
      icon: Shield,
      title: 'Security Settings',
      description: 'Platform-level security configuration',
      content: (
        <div className="mt-4 space-y-3">
          {[
            { label: 'OTP Expiry', value: '5 minutes', note: 'Set in .env: OTP_EXPIRY_MINUTES' },
            { label: 'Access Token TTL', value: '15 minutes', note: 'Set in .env: JWT_ACCESS_EXPIRES_IN' },
            { label: 'Refresh Token TTL', value: '7 days', note: 'Set in .env: JWT_REFRESH_EXPIRES_IN' },
            { label: 'Auth Rate Limit', value: '10 req/min', note: 'Configured in rateLimiter.ts' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400">{item.note}</p>
              </div>
              <span className="text-sm font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">{item.value}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-900">Platform Configuration</h1>
            <p className="text-sm text-slate-500">Manage SLA rules, lifecycle settings and notifications</p>
          </div>
        </div>
        <Button variant="gold" onClick={handleSave}>Save Changes</Button>
      </div>

      {CONFIG_SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <Card key={section.title}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary-700" />
              </div>
              <div className="flex-1">
                <CardTitle>{section.title}</CardTitle>
                <p className="text-sm text-slate-500 mt-0.5">{section.description}</p>
                {section.content}
              </div>
            </div>
          </Card>
        );
      })}

      <Card>
        <div className="text-center py-4">
          <p className="text-sm text-slate-500">
            Multi-tenant organization management and feature flags are available in{' '}
            <strong className="text-primary-800">Phase 6</strong> — Admin hardening.
          </p>
        </div>
      </Card>
    </div>
  );
}
