'use client';
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

const schema = z.object({
  panelSerialNumber: z.string().min(1, 'Required'),
  issueCategory: z.enum(ISSUE_CATEGORIES as [string, ...string[]]),
  description: z.string().min(10, 'At least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

type FormData = z.infer<typeof schema>;

export default function NewTicketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [createTicket, { isLoading }] = useCreateTicketMutation();

  const panels = user?.panels || [];

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await createTicket(data).unwrap();
      toast.success(`Ticket ${res.data.ticketId} created successfully!`);
      router.push(`/customer/tickets/${res.data.ticketId}`);
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed to create ticket');
    }
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

          <Select
            label="Priority"
            id="priority"
            {...register('priority')}
            error={errors.priority?.message}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
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

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isLoading} className="flex-1">Submit Ticket</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
