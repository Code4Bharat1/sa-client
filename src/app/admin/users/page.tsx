'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useListUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '@/store/api/reportsApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Card, CardTitle } from '@/components/ui/Card';
import { BackButton } from '@/components/ui/BackButton';
import toast from 'react-hot-toast';
import { formatShortDate, cn } from '@/lib/utils';
import { UserPlus, Search, X, Users, Trash2 } from 'lucide-react';
import { User } from '@/types';

const createSchema = z.object({
  name: z.string().min(2),
  mobileNumber: z.string().min(10),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal('')),
  role: z.enum(['customer', 'admin', 'technician']),
  organizationName: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

const ROLE_OPTS = [
  { value: 'customer', label: 'Customer' },
  { value: 'admin', label: 'Admin' },
  { value: 'technician', label: 'Technician' },
];

const ROLE_BADGE_COLORS: Record<string, string> = {
  customer: 'bg-blue-100 text-blue-700',
  admin: 'bg-purple-100 text-purple-700',
  technician: 'bg-orange-100 text-orange-700',
};

export default function AdminUsersPage() {
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data, isLoading, refetch } = useListUsersQuery({ role, page, search });
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();
  const users = data?.data || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'technician' },
  });

  const onCreateUser = async (formData: CreateForm) => {
    try {
      await createUser(formData).unwrap();
      toast.success('User created successfully');
      reset();
      setShowCreate(false);
      refetch();
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed to create user');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateUser({ id, isActive: !isActive }).unwrap();
      toast.success(isActive ? 'User deactivated' : 'User activated');
      refetch();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleActionChange = (u: User, action: string) => {
    if (action === 'delete') {
      setUserToDelete(u);
    } else if (action === 'deactivate') {
      if (u.isActive) {
        toggleActive(u.id, true);
      }
    } else if (action === 'active') {
      if (!u.isActive) {
        toggleActive(u.id, false);
      }
    }
  };

  const onConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id).unwrap();
      toast.success('User deleted successfully');
      setUserToDelete(null);
      refetch();
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message || 'Failed to delete user'
      );
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-primary-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-900">User Management</h1>
              <p className="text-sm text-slate-500">Manage user accounts, roles, and access credentials</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate((s) => !s)}>
            {showCreate ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {showCreate ? 'Cancel' : 'Add User'}
          </Button>
        </div>
      </div>

      {/* Create User Form */}
      {showCreate && (
        <Card>
          <CardTitle className="mb-4">Create New User</CardTitle>
          <form onSubmit={handleSubmit(onCreateUser)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Full Name *" {...register('name')} error={errors.name?.message} />
            <Input label="Mobile *" {...register('mobileNumber')} error={errors.mobileNumber?.message} />
            <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Password" type="password" {...register('password')} error={errors.password?.message} placeholder="Min 8 chars" />
            <Select label="Role *" {...register('role')} options={ROLE_OPTS} error={errors.role?.message} />
            <Input label="Organization" {...register('organizationName')} placeholder="Optional" />
            <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-2">
              <Button type="submit" variant="gold" loading={creating}>Create User</Button>
              <Button type="button" variant="outline" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            placeholder="Search name, email, ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {[{ value: '', label: 'All' }, { value: 'customer', label: 'Customers' }, { value: 'admin', label: 'Admins' }, { value: 'technician', label: 'Technicians' }].map(o => (
            <Button key={o.value} size="sm" variant={role === o.value ? 'primary' : 'outline'} onClick={() => { setRole(o.value); setPage(1); }}>
              {o.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Spinner className="py-16" />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left border-b border-slate-100">
                  <tr>
                    {['Customer ID', 'Name', 'Email', 'Mobile', 'Organization', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.length === 0 ? (
                    <tr><td colSpan={9} className="py-12 text-center text-slate-400">No users found</td></tr>
                  ) : users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.customerId}</td>
                      <td className="px-4 py-3 font-medium text-primary-900">{u.name}</td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3 text-slate-600">{u.mobileNumber}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{u.organizationName || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge className={ROLE_BADGE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{formatShortDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.isActive ? 'active' : 'deactivate'}
                          onChange={(e) => handleActionChange(u, e.target.value)}
                          className={cn(
                            'text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all cursor-pointer shadow-sm',
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 focus:ring-emerald-400'
                              : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 focus:ring-rose-400'
                          )}
                        >
                          <option value="active" className="text-slate-800 bg-white font-medium">
                            Active
                          </option>
                          <option value="deactivate" className="text-slate-800 bg-white font-medium">
                            Deactivate
                          </option>
                          <option value="delete" className="text-rose-600 bg-white font-semibold">
                            Delete
                          </option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{data?.total || 0} users</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</Button>
              <span className="text-sm text-slate-600 px-2">Page {page} / {data?.pages || 1}</span>
              <Button variant="outline" size="sm" disabled={page >= (data?.pages || 1)} onClick={() => setPage(p => p + 1)}>Next →</Button>
            </div>
          </div>
        </>
      )}

      {/* Delete User Confirmation Popup */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Delete User Account
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Are you sure you want to completely delete this user? This action cannot be undone and will permanently remove them from the database.
                </p>
              </div>

              {/* User details card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-5 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Customer ID</span>
                  <span className="font-mono font-semibold text-slate-800">{userToDelete.customerId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Name</span>
                  <span className="font-semibold text-slate-900">{userToDelete.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Email</span>
                  <span className="text-slate-700 truncate max-w-[220px]">{userToDelete.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Role</span>
                  <span className="capitalize font-semibold text-slate-700">{userToDelete.role}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={deleting}
                  onClick={() => setUserToDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="flex-1"
                  loading={deleting}
                  onClick={onConfirmDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

