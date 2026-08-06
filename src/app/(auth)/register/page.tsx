'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useRegisterMutation } from '@/store/api/authApi';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password is required (min 8 characters)'),
  organizationName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  panels: z.array(z.object({
    serialNumber: z.string().min(1, 'Required'),
    size: z.string().min(1, 'Required'),
    installationDate: z.string().min(1, 'Required'),
  })).optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [register, { isLoading }] = useRegisterMutation();
  const { register: reg, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { panels: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'panels' });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        panels: data.panels?.map((p) => ({
          ...p,
          installationDate: new Date(p.installationDate).toISOString(),
        })),
      };
      await register(payload).unwrap();
      toast.success('Registration successful! Please login.');
      router.push('/login');
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 py-8 px-4">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary-700">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Register your IFPD panel with Student Alliance</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name *" id="name" {...reg('name')} error={errors.name?.message} />
            <Input label="Mobile Number *" id="mobile" {...reg('mobileNumber')} error={errors.mobileNumber?.message} />
            <Input label="Email *" id="email" type="email" {...reg('email')} error={errors.email?.message} />
            <Input label="Password *" id="password" type="password" {...reg('password')} error={errors.password?.message} />
            <Input label="Organization Name" id="org" {...reg('organizationName')} />
            <Input label="City" id="city" {...reg('city')} />
            <Input label="State" id="state" {...reg('state')} />
            <Input label="Address" id="address" {...reg('address')} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">IFPD Panels</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ serialNumber: '', size: '', installationDate: '' })}>
                <Plus className="w-4 h-4" /> Add Panel
              </Button>
            </div>
            {fields.map((field, i) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-3 relative">
                <button type="button" onClick={() => remove(i)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input label="Serial Number" {...reg(`panels.${i}.serialNumber`)} error={errors.panels?.[i]?.serialNumber?.message} />
                  <Input label="Panel Size" {...reg(`panels.${i}.size`)} placeholder='e.g. 75"' error={errors.panels?.[i]?.size?.message} />
                  <Input label="Installation Date" type="date" {...reg(`panels.${i}.installationDate`)} error={errors.panels?.[i]?.installationDate?.message} />
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" loading={isLoading}>Create Account</Button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already registered? <a href="/login" className="text-primary-600 font-medium hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
