'use client';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCreateTicketMutation } from '@/store/api/ticketsApi';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { ISSUE_CATEGORIES } from '@/types';
import { Paperclip, Mic, Square, Trash, Loader2 } from 'lucide-react';

const schema = z.object({
  panelSerialNumber: z.string().min(1, 'Required'),
  issueCategory: z.enum(ISSUE_CATEGORIES as [string, ...string[]], {
    errorMap: () => ({ message: 'Please select an issue category' }),
  }),
  description: z.string().min(10, 'At least 10 characters'),
});

type FormData = z.infer<typeof schema>;

export default function NewTicketPage() {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [createTicket, { isLoading }] = useCreateTicketMutation();

  const [attachments, setAttachments] = useState<string[]>([]);
  const [attachmentError, setAttachmentError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const panels = user?.panels || [];

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const uploadFile = async (file: File | Blob, filename?: string): Promise<string> => {
    const formData = new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    } else {
      formData.append('file', file, filename || 'voice-note.webm');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tickets/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'application/pdf',
      'audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/m4a', 'audio/x-m4a'
    ];
    const maxSizeBytes = 20 * 1024 * 1024; // 20MB

    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > maxSizeBytes) {
          toast.error(`File "${file.name}" exceeds the 20MB limit.`);
          continue;
        }
        if (!allowedTypes.includes(file.type)) {
          toast.error(`File type "${file.type || 'unknown'}" is not supported.`);
          continue;
        }
        const url = await uploadFile(file);
        setAttachments((prev) => [...prev, url]);
        setAttachmentError(false);
        toast.success(`Uploaded "${file.name}"`);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to upload files');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setUploading(true);
        try {
          const url = await uploadFile(audioBlob, `voice-note-${Date.now()}.webm`);
          setAttachments((prev) => [...prev, url]);
          setAttachmentError(false);
          toast.success('Voice note recorded and uploaded');
        } catch (err: unknown) {
          toast.error((err as Error).message || 'Failed to upload voice note');
        } finally {
          setUploading(false);
        }

        // Stop all audio tracks in stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordDuration(0);
      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const onSubmit = async (data: FormData) => {
    if (attachments.length === 0) {
      setAttachmentError(true);
      toast.error('Please attach at least one media file or record a voice note.');
      return;
    }
    setAttachmentError(false);
    try {
      const payload = {
        ...data,
        attachments,
      };
      const res = await createTicket(payload).unwrap();
      toast.success(`Ticket ${res.data.ticketId} created successfully!`);
      router.push(`/customer/tickets/${res.data.ticketId}`);
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed to create ticket');
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Raise a Support Ticket</h1>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {panels.length > 0 ? (
            <Select
              label="Panel Serial Number *"
              id="panel"
              {...register('panelSerialNumber')}
              error={errors.panelSerialNumber?.message}
              options={panels.map((p) => ({ value: p.serialNumber, label: `${p.serialNumber} (${p.size})` }))}
              placeholder="Select a panel"
            />
          ) : (
            <Input
              label="Panel Serial Number *"
              id="serial"
              {...register('panelSerialNumber')}
              error={errors.panelSerialNumber?.message}
              placeholder="e.g. SN-2024-00123"
            />
          )}

          <Select
            label="Issue Category *"
            id="category"
            {...register('issueCategory')}
            error={errors.issueCategory?.message}
            options={ISSUE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            placeholder="Select issue category"
          />

          <div className="space-y-1">
            <label htmlFor="desc" className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              id="desc"
              rows={5}
              {...register('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Describe the issue in detail..."
            />
            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
          </div>

          {/* Attachment section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Attachments & Voice Notes *</label>
            {attachmentError && (
              <p className="text-xs text-red-600 font-medium">At least one attachment (photo, video, or voice note) is required.</p>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              {/* File upload trigger */}
              <div>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  id="media-uploader"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label
                  htmlFor="media-uploader"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-500 bg-gray-50 hover:bg-gray-100 rounded-xl p-4 cursor-pointer transition text-center"
                >
                  <Paperclip className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-sm font-semibold text-gray-700">Attach Media</span>
                  <span className="text-xs text-gray-500 mt-0.5">Photos or Videos (Max 20MB)</span>
                </label>
              </div>

              {/* Voice note trigger */}
              <div className="flex flex-col justify-center items-center border border-gray-200 rounded-xl p-4 bg-gray-50">
                {recording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex flex-col items-center justify-center text-red-600 animate-pulse"
                  >
                    <Square className="w-6 h-6 mb-1 fill-red-600" />
                    <span className="text-sm font-semibold">Recording... ({formatDuration(recordDuration)})</span>
                    <span className="text-xs text-gray-500 mt-0.5">Click to stop and upload</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={uploading}
                    className="flex flex-col items-center justify-center text-primary-600 hover:text-primary-700"
                  >
                    <Mic className="w-6 h-6 text-primary-500 mb-1" />
                    <span className="text-sm font-semibold">Record Voice Note</span>
                    <span className="text-xs text-gray-500 mt-0.5">Explain the issue verbally</span>
                  </button>
                )}
              </div>
            </div>

            {/* List of uploaded attachments */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Uploaded:</span>
                <ul className="divide-y divide-gray-100">
                  {attachments.map((url, index) => {
                    const isAudio = url.includes('.webm') || url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a');
                    const filename = url.split('/').pop() || '';
                    const displayName = filename.replace(/^\d+-\d+-/, '').replace(/_/g, ' ');
                    return (
                      <li key={index} className="py-2 flex items-center justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          {isAudio ? (
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs font-medium text-gray-700">Voice Note #{index + 1} ({displayName})</span>
                              <audio src={url} controls className="h-8 max-w-full" />
                            </div>
                          ) : (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-primary-600 hover:underline truncate block"
                            >
                              {displayName}
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded-full transition"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {uploading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span>Processing attachment... Please wait.</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isLoading || uploading} className="flex-1">Submit Ticket</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
