'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Settings, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const REJECTION_REASONS = [
  'Provided verification parameters cannot support professional background alignment.',
  'Biography lacks explicit detailed descriptions of educational domain timelines.',
  'Platform capacities for your requested instructional domain are fully met.',
  'Please enrich the presentation detailing past educational work history before re-applying.',
];

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('requests');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [chosenReason, setChosenReason] = useState(REJECTION_REASONS[0]);

 const reviewMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: id, status, rejectionReason: reason }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (data) => {
      // 💡 If the backend generated a temporary password, show it right here in the alert!
      if (data.password) {
        toast.success(`Teacher Approved! 🍎 Temp Password: ${data.password}`, {
          duration: 10000, // Keeps it visible longer so you can copy it
        });
      } else {
        toast.success('Teacher status updated workflow successfully! 🎉');
      }
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['teacher-requests'] });
    },
  });

  const { data: requests } = useQuery({
    queryKey: ['teacher-requests'],
    queryFn: async () => {
      const res = await fetch('/api/admin/teachers');
      if (res.status === 401 || res.status === 403) {
        setIsAdminAuthenticated(false);
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error('Failed');
      setIsAdminAuthenticated(true);
      return res.json();
    },
    retry: false,
  });

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAuth(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmailInput, password: adminPasswordInput }),
      });

      if (res.status === 403) {
        toast.error('This email is not registered as an Admin in the database.');
      } else if (res.ok) {
        toast.success('Clearance authorized! Welcome back Administrator. 👑');
        setIsAdminAuthenticated(true);
        queryClient.invalidateQueries({ queryKey: ['teacher-requests'] });
      } else {
        toast.error('Invalid administrative security password.');
      }
    } catch {
      toast.error('An error occurred during authentication.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  if (isAdminAuthenticated === false) {
    return (
      <div className="flex min-h-screen items-center justify-center font-nunito flex-col px-4" style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #311042 100%)' }}>
        <Card className="w-full max-w-md border-4 border-[#C4B5FD] bg-white/95 backdrop-blur shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] p-6 text-center text-white">
            <span className="text-4xl block mb-2">👑</span>
            <h2 className="text-2xl font-black tracking-tight">EduFlow Central Core</h2>
            <p className="text-xs font-bold opacity-90 mt-1">Authorized Administration Clearance Required</p>
          </div>
          <CardContent className="p-6 pt-6">
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              
              {/* Email Input Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#7C3AED] uppercase tracking-wider block">Admin Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-[#C4B5FD]" />
                  <input
                    type="email"
                    placeholder="admin@eduflow.com"
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#FAF5FF] border-2 border-[#E9D5FF] focus:border-[#7C3AED] text-[#3B0764] rounded-2xl outline-none font-bold text-sm transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[#7C3AED] uppercase tracking-wider block">System Master Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-[#C4B5FD]" />
                  <input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#FAF5FF] border-2 border-[#E9D5FF] focus:border-[#7C3AED] text-[#3B0764] rounded-2xl outline-none font-bold text-center tracking-widest transition-all"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmittingAuth} className="w-full rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black py-6 text-base shadow-lg transition-all mt-2">
                {isSubmittingAuth ? 'Verifying Authorization...' : 'Unlock Control Room 🎛️'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAdminAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center font-nunito" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FEF9F0 100%)' }}>
        <p className="text-lg font-bold text-[#7C3AED] animate-pulse">Establishing core terminal connection...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-nunito relative" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FEF9F0 100%)' }}>
      <nav className="bg-white/90 backdrop-blur-md border-b-4 border-[#C4B5FD] sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED] shadow-lg">
                <span className="text-2xl">🌟</span>
              </div>
              <div>
                <span className="text-2xl font-black text-[#7C3AED]">EduFlow</span>
                <div className="text-xs font-bold text-[#EC4899]">Admin Console 👑</div>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm font-black bg-[#FEF3C7] border-4 border-[#FCD34D] text-[#D97706] px-4 py-2 rounded-full">
                👑 Administrator
              </span>
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-[#7C3AED] font-bold rounded-full">
                  Exit Control Room 👋
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <span className="text-5xl">🎛️</span>
          <div>
            <h1 className="text-3xl font-black text-[#3B0764]">Platform Control Room</h1>
            <p className="text-base font-bold text-[#7E22CE]">Manage teachers, revenue, and platform settings! 🚀</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { value: 'requests', label: '🍎 Teacher Requests' },
            { value: 'revenue', label: '💰 Revenue' },
            { value: 'settings', label: '⚙️ Settings' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-3 rounded-full font-black text-base transition-all ${
                activeTab === tab.value ? 'bg-[#7C3AED] text-white shadow-lg' : 'bg-white text-[#7C3AED] border-4 border-[#C4B5FD] hover:bg-[#EDE9FE]'
              }`}
              style={{ borderWidth: activeTab === tab.value ? '0' : '3px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Tabs value={activeTab}>
          <TabsContent value="requests" className="space-y-6">
            <div className="grid gap-6">
              {requests?.requests?.map((req: any) => (
                <Card key={req.id} className="border-4 border-[#C4B5FD] bg-white shadow-lg rounded-3xl">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#FCE7F3] flex items-center justify-center text-2xl font-black text-[#7C3AED] border-4 border-[#C4B5FD]">
                            {req.name ? req.name[0] : 'T'}
                          </div>
                          <div>
                            <h4 className="font-black text-[#3B0764] text-lg">{req.name}</h4>
                            <p className="text-sm font-bold text-[#7E22CE]">Applicant Address: {req.email}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#7C3AED] uppercase tracking-wider mb-2">🍎 Teacher Bio</p>
                          <p className="text-sm font-semibold text-[#6D28D9] bg-[#FAF5FF] p-4 rounded-2xl border-4 border-[#E9D5FF]">{req.bio}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="rounded-full border-4 border-[#FECDD3] text-[#E11D48] hover:bg-[#FFF1F2] gap-2 font-bold"
                          onClick={() => {
                            setSelectedRequest(req);
                            setChosenReason(REJECTION_REASONS[0]);
                          }}
                          disabled={reviewMutation.isPending}
                        >
                          <XCircle className="h-4 w-4" /> Decline...
                        </Button>
                        <Button
                          className="rounded-full bg-[#10B981] hover:bg-[#059669] gap-2 font-bold text-white shadow-lg"
                          onClick={() => reviewMutation.mutate({ id: req.id, status: 'approved' })}
                          disabled={reviewMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4" /> Confirm & Approve!
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {(!requests?.requests || requests.requests.length === 0) && (
                <div className="flex flex-col items-center justify-center py-24 bg-white border-4 border-dashed border-[#C4B5FD] rounded-3xl">
                  <span className="text-6xl mb-4">🍎</span>
                  <p className="text-base font-bold text-[#7E22CE]">No pending teacher applications inside queue! 🎉</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="revenue" className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { emoji: '💰', label: 'Total Revenue', value: '$12,450', sub: '70% of goal', bg: 'bg-[#D1FAE5]', border: 'border-[#6EE7B7]', text: 'text-[#059669]' },
                { emoji: '👩‍🏫', label: 'Teacher Payouts', value: '$9,800', sub: 'Next payout in 4 days', bg: 'bg-[#EDE9FE]', border: 'border-[#C4B5FD]', text: 'text-[#7C3AED]' },
                { emoji: '🏦', label: 'Platform Cut (15%)', value: '$2,650', sub: '+15% from last month 🚀', bg: 'bg-[#FEF3C7]', border: 'border-[#FCD34D]', text: 'text-[#D97706]' },
              ].map((stat) => (
                <Card key={stat.label} className={`${stat.bg} border-4 ${stat.border} shadow-lg rounded-3xl`}>
                  <div className="p-6">
                    <div className="text-4xl mb-3">{stat.emoji}</div>
                    <p className="text-xs font-black text-[#6D28D9] uppercase tracking-wide mb-2">{stat.label}</p>
                    <p className={`text-4xl font-black ${stat.text} mb-2`}>{stat.value}</p>
                    <p className="text-xs font-bold text-[#9CA3AF]">{stat.sub}</p>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-4 border-[#C4B5FD] bg-white shadow-lg rounded-3xl max-w-2xl">
              <div className="bg-gradient-to-r from-[#EDE9FE] to-[#FCE7F3] py-4 px-6 rounded-t-3xl border-b-2 border-[#E9D5FF]">
                <h3 className="text-xl font-black text-[#3B0764] flex items-center gap-2">
                  <Settings className="h-5 w-5 text-[#7C3AED]" />⚙️ Platform Settings
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <Button className="w-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black text-base py-6 shadow-lg hover:scale-[1.02] transition-all">
                  💾 Save Settings!
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Card className="border-4 border-[#C4B5FD] bg-white shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#F43F5E] to-[#E11D48] p-4 text-white font-black text-center text-lg">
              ❌ Selection Feedback Reason
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-bold text-[#3B0764]">
                Choose feedback parameters to inform <strong>{selectedRequest.name}</strong> regarding submission evaluation closure:
              </p>
              <div className="space-y-2">
                {REJECTION_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer text-xs font-bold transition-all ${
                      chosenReason === reason ? 'border-[#E11D48] bg-[#FFF1F2] text-[#E11D48]' : 'border-[#EDE9FE] bg-[#FAF5FF] text-[#6D28D9] hover:bg-[#EDE9FE]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejection-reason"
                      checked={chosenReason === reason}
                      onChange={() => setChosenReason(reason)}
                      className="mt-0.5 accent-[#E11D48]"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1 font-bold rounded-full border-2 border-gray-200" onClick={() => setSelectedRequest(null)}>
                  Dismiss
                </Button>
                <Button
                  className="flex-1 bg-[#E11D48] hover:bg-[#BE123C] font-black text-white rounded-full shadow-md"
                  onClick={() => reviewMutation.mutate({ id: selectedRequest.id, status: 'rejected', reason: chosenReason })}
                  disabled={reviewMutation.isPending}
                >
                  Send Rejection Notification
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}