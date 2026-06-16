'use client';
import { useState } from 'react';
import { useListUsersQuery, useUpdateUserMutation } from '@/store/api/reportsApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';
import { formatShortDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('technician');
  const { data, isLoading, refetch } = useListUsersQuery({ role, page });
  const [updateUser] = useUpdateUserMutation();
  const users = data?.data || [];

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateUser({ id, isActive: !isActive }).unwrap();
      toast.success('User updated');
      refetch();
    } catch {
      toast.error('Failed to update user');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>

      <div className="flex gap-2">
        {['customer','admin','technician'].map((r) => (
          <Button key={r} size="sm" variant={role === r ? 'primary' : 'outline'} onClick={() => { setRole(r); setPage(1); }}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? <Spinner /> : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                {['Name','Email','Mobile','Role','Status','Joined','Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.mobileNumber}</td>
                  <td className="px-4 py-3"><Badge className="bg-purple-100 text-purple-700 capitalize">{u.role}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge className={u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatShortDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant={u.isActive ? 'danger' : 'secondary'} onClick={() => toggleActive(u.id, u.isActive)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page >= (data?.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
