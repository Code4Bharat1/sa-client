'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { setCredentials } from '@/features/auth/authSlice';
import { useLoginMutation, useRequestOTPMutation, useVerifyOTPMutation } from '@/store/api/authApi';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const loginSchema = z.object({ identifier: z.string().min(1, 'Required'), password: z.string().min(1, 'Required') });
const otpReqSchema = z.object({ identifier: z.string().min(1, 'Required') });
const otpVerSchema = z.object({ code: z.string().length(6, 'Must be 6 digits') });

type LoginForm = z.infer<typeof loginSchema>;
type OTPReqForm = z.infer<typeof otpReqSchema>;
type OTPVerForm = z.infer<typeof otpVerSchema>;

export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'otp-request' | 'otp-verify'>('password');
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();

  const [login, { isLoading: loginLoading }] = useLoginMutation();
  const [requestOTP, { isLoading: otpReqLoading }] = useRequestOTPMutation();
  const [verifyOTP, { isLoading: otpVerLoading }] = useVerifyOTPMutation();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const otpReqForm = useForm<OTPReqForm>({ resolver: zodResolver(otpReqSchema) });
  const otpVerForm = useForm<OTPVerForm>({ resolver: zodResolver(otpVerSchema) });

  const redirectByRole = (role: string) => {
    const map: Record<string, string> = {
      customer: '/customer/dashboard',
      admin: '/admin/dashboard',
      technician: '/technician/dashboard',
    };
    router.push(map[role] || '/');
  };

  const onPasswordLogin = async (data: LoginForm) => {
    try {
      const res = await login(data).unwrap();
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      toast.success('Welcome back!');
      redirectByRole(res.data.user.role);
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Login failed');
    }
  };

  const onOTPRequest = async (data: OTPReqForm) => {
    try {
      await requestOTP(data).unwrap();
      setOtpIdentifier(data.identifier);
      setMode('otp-verify');
      toast.success('OTP sent to your mobile/email');
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Failed to send OTP');
    }
  };

  const onOTPVerify = async (data: OTPVerForm) => {
    try {
      const res = await verifyOTP({ identifier: otpIdentifier, code: data.code }).unwrap();
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      toast.success('Welcome back!');
      redirectByRole(res.data.user.role);
    } catch (err: unknown) {
      toast.error((err as { data?: { message?: string } }).data?.message || 'Invalid or expired OTP');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo card */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gold-500 flex items-center justify-center text-primary-900 font-extrabold text-2xl shadow-lg mb-3">
            SA
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Student Alliance</h1>
          <p className="text-primary-300 text-sm mt-1">IFPD Panel Support Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-primary-900 mb-6">
            {mode === 'password' && 'Sign In to Your Account'}
            {mode === 'otp-request' && 'Login with OTP'}
            {mode === 'otp-verify' && 'Enter Verification Code'}
          </h2>

          {mode === 'password' && (
            <form onSubmit={loginForm.handleSubmit(onPasswordLogin)} className="space-y-4">
              <Input
                label="Email / Customer ID / Mobile"
                id="identifier"
                {...loginForm.register('identifier')}
                error={loginForm.formState.errors.identifier?.message}
                placeholder="e.g. john@example.com or CUST-00001"
              />
              <Input
                label="Password"
                id="password"
                type="password"
                {...loginForm.register('password')}
                error={loginForm.formState.errors.password?.message}
                placeholder="Your password"
              />
              <Button type="submit" className="w-full" size="lg" loading={loginLoading}>
                Sign In
              </Button>
              <div className="relative flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={() => setMode('otp-request')}>
                Login with OTP
              </Button>
            </form>
          )}

          {mode === 'otp-request' && (
            <form onSubmit={otpReqForm.handleSubmit(onOTPRequest)} className="space-y-4">
              <Input
                label="Mobile / Email / Customer ID"
                id="otp-identifier"
                {...otpReqForm.register('identifier')}
                error={otpReqForm.formState.errors.identifier?.message}
                placeholder="Enter your registered contact"
                autoFocus
              />
              <Button type="submit" className="w-full" size="lg" loading={otpReqLoading}>
                Send OTP
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode('password')}>
                ← Back to password login
              </Button>
            </form>
          )}

          {mode === 'otp-verify' && (
            <form onSubmit={otpVerForm.handleSubmit(onOTPVerify)} className="space-y-4">
              <div className="p-3 bg-primary-50 rounded-lg text-sm text-primary-800 border border-primary-100">
                OTP sent to <strong>{otpIdentifier}</strong>. Valid for 5 minutes.
              </div>
              <Input
                label="6-Digit OTP"
                id="otp-code"
                {...otpVerForm.register('code')}
                error={otpVerForm.formState.errors.code?.message}
                placeholder="Enter 6-digit code"
                maxLength={6}
                autoFocus
                className="text-center text-xl tracking-widest font-mono"
              />
              <Button type="submit" className="w-full" size="lg" loading={otpVerLoading}>
                Verify & Sign In
              </Button>
              <Button
                type="button" variant="ghost" className="w-full"
                onClick={() => { setMode('otp-request'); otpVerForm.reset(); }}
              >
                Resend OTP
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            New customer?{' '}
            <Link href="/register" className="text-primary-700 font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
