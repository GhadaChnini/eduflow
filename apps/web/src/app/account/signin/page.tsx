'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { SocialSignInButtons } from '@/components/SocialSignInButtons';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: '/dashboard',
      });
      if (result?.error) {
        setError(result.error.message || 'Invalid email or password');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 font-nunito"
      style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FEF9F0 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED] shadow-lg">
              <span className="text-3xl">🌟</span>
            </div>
            <div className="text-left">
              <div className="text-2xl font-black text-[#7C3AED]">EduFlow</div>
              <div className="text-sm font-bold text-[#EC4899]">Kids Learning ✨</div>
            </div>
          </div>
          <h1 className="text-3xl font-black text-[#3B0764] mb-2">Welcome Back! 👋</h1>
          <p className="text-base font-bold text-[#7E22CE]">
            Great to see you again, superstar! 🌟
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border-4 border-[#C4B5FD] shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-black text-[#7C3AED] uppercase tracking-wide"
              >
                📧 Your Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-4 border-[#C4B5FD] rounded-2xl text-base font-semibold focus:border-[#7C3AED] text-[#3B0764] bg-[#FAF5FF] py-6"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-black text-[#7C3AED] uppercase tracking-wide"
              >
                🔒 Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-4 border-[#C4B5FD] rounded-2xl text-base font-semibold focus:border-[#7C3AED] text-[#3B0764] bg-[#FAF5FF] py-6"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 border-4 border-red-100">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] py-7 text-lg font-black hover:opacity-90 shadow-xl shadow-[#7C3AED]/30 hover:scale-[1.02] transition-all"
              disabled={loading}
            >
              {loading ? '🌀 Signing in...' : "🚀 Let's Go!"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-[#E9D5FF]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[#9CA3AF] font-bold">Or continue with</span>
            </div>
          </div>

          <SocialSignInButtons callbackUrl="/dashboard" />

          <p className="mt-6 text-center text-base font-bold text-[#7E22CE]">
            New here?{' '}
            <Link
              href="/account/signup"
              className="font-black text-[#7C3AED] hover:text-[#EC4899] underline transition-colors"
            >
              Join the fun! 🎉
            </Link>
          </p>
        </div>
        <p className="text-center mt-6 text-sm font-bold text-[#9CA3AF]">
          <Link href="/" className="hover:text-[#7C3AED] transition-colors">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}
