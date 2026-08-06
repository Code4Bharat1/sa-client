'use client';
import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCompleteProfileMutation } from '@/store/api/authApi';
import { setCredentials } from '@/features/auth/authSlice';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

const schema = z.object({
  password: z.string().min(8, 'Password is required (min 8 characters)'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
  organizationName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  panels: z
    .array(
      z.object({
        serialNumber: z.string().min(1, 'Required'),
        size: z.string().min(1, 'Required'),
        installationDate: z.string().min(1, 'Required'),
      })
    )
    .optional(),
});

type FormData = z.infer<typeof schema>;

export default function CompleteProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated, isInitialized, accessToken } = useAuth();
  const [completeProfile, { isLoading }] = useCompleteProfileMutation();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (user.profileComplete !== false) {
      const redirectMap: Record<string, string> = {
        customer: '/customer/dashboard',
        admin: '/admin/dashboard',
        technician: '/technician/dashboard',
      };
      router.replace(redirectMap[user.role] || '/');
    }
  }, [isInitialized, isAuthenticated, user, router]);

  const {
    register: reg,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      mobileNumber: user?.mobileNumber || '',
      organizationName: user?.organizationName || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      panels: user?.panels || [],
    },
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
      const res = await completeProfile(payload).unwrap();
      if (res.data && accessToken) {
        dispatch(setCredentials({ user: res.data, accessToken }));
      }
      toast.success('Profile completed successfully!');
      router.push('/customer/dashboard');
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { message?: string } }).data?.message || 'Failed to complete profile'
      );
    }
  };

  if (!isInitialized || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8 border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-bold text-primary-700">Complete Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            Please set your account password and fill in contact details to finish setting up your account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" id="name" value={user.name} disabled className="bg-gray-50 text-gray-500" />
            <Input label="Email" id="email" value={user.email} disabled className="bg-gray-50 text-gray-500" />
            <Input
              label="Password *"
              id="password"
              type="password"
              placeholder="Set a password for your account"
              {...reg('password')}
              error={errors.password?.message}
            />
            <Input
              label="Mobile Number *"
              id="mobile"
              placeholder="e.g. 9876543210"
              {...reg('mobileNumber')}
              error={errors.mobileNumber?.message}
            />
            <Input label="Organization Name" id="org" placeholder="e.g. Alliance International School" {...reg('organizationName')} />
            <Input label="City" id="city" placeholder="e.g. Mumbai" {...reg('city')} />
            <Input label="State" id="state" placeholder="e.g. Maharashtra" {...reg('state')} />
            <div className="md:col-span-2">
              <Input label="Address" id="address" placeholder="e.g. 123 Main Street" {...reg('address')} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">IFPD Panels (Optional)</h3>
                <p className="text-xs text-gray-400">Add any registered panel details now or add them later.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ serialNumber: '', size: '', installationDate: '' })}
              >
                <Plus className="w-4 h-4" /> Add Panel
              </Button>
            </div>
            {fields.map((field, i) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-3 relative bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    label="Serial Number"
                    {...reg(`panels.${i}.serialNumber`)}
                    error={errors.panels?.[i]?.serialNumber?.message}
                  />
                  <Input
                    label="Panel Size"
                    placeholder='e.g. 75"'
                    {...reg(`panels.${i}.size`)}
                    error={errors.panels?.[i]?.size?.message}
                  />
                  <Input
                    label="Installation Date"
                    type="date"
                    {...reg(`panels.${i}.installationDate`)}
                    error={errors.panels?.[i]?.installationDate?.message}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" loading={isLoading}>
            Complete & Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
