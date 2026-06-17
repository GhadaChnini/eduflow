'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Lock, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client'; 

export default function TeacherGatewayPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: email.trim(),
        password: password,
      });

      if (error) {
        toast.error(error.message || 'Invalid credentials. Please try again.');
      } else {
        toast.success('Welcome back to your workspace! 🍎');
        router.push('/teacher/dashboard');
      }
    } catch (err) {
      toast.error('An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* FIXED OVERFLOW: Changed h-screen to min-h-screen and removed overflow-hidden so users can scroll down on mobile viewports */
    <div className="min-h-screen w-full font-nunito flex flex-col md:flex-row select-none pb-12 md:pb-0" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FEF9F0 100%)' }}>
      
      {/* Left Column: Eye-Catching Promotional Card / Info Split */}
      <div className="flex-shrink-0 flex flex-col justify-center p-8 lg:p-16 bg-gradient-to-br from-[#7C3AED] to-[#EC4899] text-white relative overflow-hidden md:max-w-xl md:min-h-screen">
        <div className="absolute top-[-20%] right-[-20%] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 bg-black/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 space-y-6 max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-black border border-white/20 hover:bg-white/30 transition-all">
            ✨ Back to EduFlow
          </Link>
          <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center text-3xl shadow-xl">
            🎓
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Empower Learners Around the World.
          </h1>
          <p className="text-base font-bold opacity-90">
            Create high-impact courses, track clear milestones, manage your students, and scale your personal impact all from one dedicated terminal.
          </p>
          <div className="pt-4 border-t-2 border-white/20 space-y-3">
            <div className="flex items-center gap-3 text-sm font-bold">
              <Sparkles className="h-5 w-5 text-[#FCD34D]" /> Full control over structural curriculum content
            </div>
            <div className="flex items-center gap-3 text-sm font-bold">
              <Sparkles className="h-5 w-5 text-[#FCD34D]" /> Seamless student tracking metrics
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Interaction Form Gate */}
      {/* FIXED WRAPPER: Changed md:h-full to items-start or center with explicit padding top/bottom to handle mobile webview limits */}
      <div className="flex-1 flex flex-col justify-start md:justify-center items-center p-4 sm:p-12">
        <Card className="w-full max-w-md border-4 border-[#C4B5FD] bg-white shadow-2xl rounded-3xl overflow-hidden transform transition-transform duration-150">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-[#3B0764] flex items-center justify-center md:justify-start gap-2">
                <GraduationCap className="h-7 w-7 text-[#7C3AED]" /> Teacher Workspace
              </h2>
              <p className="text-sm font-bold text-[#7E22CE] mt-1">
                Access your active instruction terminal panels.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#7C3AED] uppercase tracking-wider block">Workspace Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-[#C4B5FD]" />
                  <input
                    type="email"
                    placeholder="instructor@eduflow.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#FAF5FF] border-2 border-[#E9D5FF] focus:border-[#7C3AED] text-[#3B0764] rounded-2xl outline-none font-bold text-sm transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#7C3AED] uppercase tracking-wider block">Security Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-[#C4B5FD]" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#FAF5FF] border-2 border-[#E9D5FF] focus:border-[#7C3AED] text-[#3B0764] rounded-2xl outline-none font-bold transition-all text-sm"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black py-6 text-base shadow-lg transition-all mt-2">
                {isLoading ? 'Booting Workspace...' : 'Enter Teacher Control Panel 🚀'}
              </Button>
            </form>

            <div className="border-t-4 border-[#FAF5FF] my-4" />

            {/* CTA Application Block for non-registered users */}
            <div className="bg-[#FAF5FF] border-2 border-[#E9D5FF] rounded-2xl p-4 text-center">
              <p className="text-sm font-black text-[#3B0764]">New to EduFlow or don't have an instructor account?</p>
              <p className="text-xs font-bold text-[#7E22CE] mt-1 mb-3">Submit your professional background profile for admin approval!</p>
              <Link href="/teacher/apply">
                <Button variant="outline" className="w-full rounded-full border-2 border-[#7C3AED] text-[#7C3AED] hover:bg-[#EDE9FE] font-black gap-2 text-sm bg-white">
                  Join as an Instructor <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

          </div>
        </Card>
      </div>

    </div>
  );
}