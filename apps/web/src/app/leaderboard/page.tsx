'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

const RANK_CONFIG = [
  {
    emoji: '🥇',
    bg: 'bg-[#FEF3C7]',
    border: 'border-[#FCD34D]',
    podiumBg: 'bg-gradient-to-b from-[#FCD34D] to-[#F59E0B]',
    height: 'h-40',
    label: '1st Place!',
  },
  {
    emoji: '🥈',
    bg: 'bg-[#F1F5F9]',
    border: 'border-[#CBD5E1]',
    podiumBg: 'bg-gradient-to-b from-[#CBD5E1] to-[#94A3B8]',
    height: 'h-28',
    label: '2nd Place!',
  },
  {
    emoji: '🥉',
    bg: 'bg-[#FFEDD5]',
    border: 'border-[#FDBA74]',
    podiumBg: 'bg-gradient-to-b from-[#FDBA74] to-[#F97316]',
    height: 'h-24',
    label: '3rd Place!',
  },
];

export default function LeaderboardPage() {
  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  return (
    <div
      className="min-h-screen font-nunito"
      style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FEF9F0 100%)' }}
    >
      {/* Nav */}
      <nav className="bg-white/90 backdrop-blur-md border-b-4 border-[#C4B5FD] sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED] shadow-lg">
                <span className="text-2xl">🌟</span>
              </div>
              <div>
                <span className="text-2xl font-black text-[#7C3AED]">EduFlow</span>
                <div className="text-xs font-bold text-[#EC4899]">Kids Learning ✨</div>
              </div>
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-base font-bold text-[#7C3AED] hover:text-[#EC4899] transition-colors"
              >
                🏠 Dashboard
              </Link>
              <Link
                href="/forum"
                className="text-base font-bold text-[#7C3AED] hover:text-[#EC4899] transition-colors"
              >
                💬 Community
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="text-7xl mb-4">🏆</div>
          <h1 className="text-5xl font-black text-[#3B0764] mb-3">Star Learners! ⭐</h1>
          <p className="text-xl font-bold text-[#7E22CE] max-w-xl mx-auto">
            These awesome kids are crushing it! Can you make it to the top? 🚀
          </p>
        </div>

        {/* Podium - Top 3 */}
        {leaderboardData?.leaderboard && leaderboardData.leaderboard.length >= 3 && (
          <div className="mb-10">
            <div className="flex items-end justify-center gap-4 mb-2">
              {/* Display order: 2nd, 1st, 3rd */}
              {[1, 0, 2].map((rankIdx, _displayIdx) => {
                const user = leaderboardData.leaderboard[rankIdx];
                if (!user) return null;
                const cfg = RANK_CONFIG[rankIdx];
                return (
                  <div key={user.id} className="flex flex-col items-center gap-3">
                    <div
                      className={`relative flex flex-col items-center justify-center rounded-3xl border-4 ${cfg.bg} ${cfg.border} p-4 shadow-xl`}
                    >
                      <span className="text-4xl mb-1">{cfg.emoji}</span>
                      <div className="h-16 w-16 rounded-full border-4 border-white bg-gradient-to-br from-[#EDE9FE] to-[#FCE7F3] flex items-center justify-center text-2xl font-black text-[#7C3AED] shadow-lg overflow-hidden">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.name[0]
                        )}
                      </div>
                      <p className="text-sm font-black text-[#3B0764] mt-2 truncate max-w-[80px]">
                        {user.name}
                      </p>
                      <p className="text-xs font-bold text-[#7E22CE]">⭐ {user.points} pts</p>
                      <div className="text-[10px] font-black uppercase tracking-wide text-[#9CA3AF] mt-1">
                        {cfg.label}
                      </div>
                    </div>
                    <div
                      className={`w-24 ${cfg.height} ${cfg.podiumBg} rounded-t-2xl flex items-start justify-center pt-3`}
                    >
                      <span className="text-white font-black text-lg">#{rankIdx + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rest of the list */}
        <Card className="border-4 border-[#C4B5FD] bg-white shadow-xl rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y-2 divide-[#EDE9FE]">
              {leaderboardData?.leaderboard?.slice(3).map((user: any, index: number) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 px-6 hover:bg-[#FAF5FF] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-[#C4B5FD] w-8">#{index + 4}</span>
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#FCE7F3] flex items-center justify-center text-[#7C3AED] font-black text-lg overflow-hidden border-4 border-[#E9D5FF]">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.name[0]
                      )}
                    </div>
                    <div>
                      <p className="text-base font-black text-[#3B0764]">{user.name}</p>
                      <span className="text-xs font-bold text-[#9CA3AF]">
                        {user.role === 'teacher' ? '🍎 Teacher' : '🎓 Student'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-[#FEF3C7] border-4 border-[#FCD34D] rounded-2xl px-4 py-2">
                    <span className="text-lg">⭐</span>
                    <span className="text-base font-black text-[#D97706]">{user.points}</span>
                    <span className="text-xs font-bold text-[#D97706]">pts</span>
                  </div>
                </div>
              ))}
              {(!leaderboardData?.leaderboard || leaderboardData.leaderboard.length === 0) && (
                <div className="flex flex-col items-center justify-center py-16">
                  <span className="text-6xl mb-4">🌟</span>
                  <p className="text-base font-bold text-[#7E22CE]">
                    No learners yet — be the first! 🚀
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Motivational banner */}
        <div className="mt-8 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-3xl p-6 text-center text-white shadow-xl">
          <div className="text-4xl mb-2">💪</div>
          <h3 className="text-xl font-black mb-1">You can reach the top!</h3>
          <p className="text-base font-bold opacity-90">
            Complete courses and earn points to climb the leaderboard! 🏆
          </p>
          <Link href="/dashboard">
            <button className="mt-4 bg-white text-[#7C3AED] font-black rounded-full px-8 py-3 hover:scale-105 transition-all shadow-lg">
              Start Earning Points! ⭐
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
