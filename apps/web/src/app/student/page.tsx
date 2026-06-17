'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';
import { toast } from 'sonner';

const BADGE_LIST = [
  { emoji: '🌟', label: 'Star Learner' },
  { emoji: '🚀', label: 'First Launch' },
  { emoji: '📚', label: 'Bookworm' },
  { emoji: '💪', label: 'Go-Getter' },
];

export default function StudentDashboard() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!session,
  });

  const { data: myCourses } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      const res = await fetch('/api/enrollments');
      if (!res.ok) throw new Error('Failed to fetch enrollments');
      return res.json();
    },
    enabled: !!session,
  });

  const { data: allCourses } = useQuery({
    queryKey: ['all-courses'],
    queryFn: async () => {
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Enrollment failed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('🎉 You joined the course!');
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filteredCourses = allCourses?.courses?.filter((c: any) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  if (!session) return null;

  const points = profile?.user?.points || 0;
  const enrollCount = myCourses?.enrollments?.length || 0;

  return (
    <div
      className="min-h-screen font-nunito"
      style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FEF9F0 100%)' }}
    >
      {/* Top Navigation */}
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border-4 border-[#FCD34D] bg-[#FFFBEB] px-4 py-2 shadow-md">
                <span className="text-xl">⭐</span>
                <span className="text-base font-black text-[#D97706]">{points} pts</span>
              </div>
              <Link href="/account/logout">
                <Button variant="ghost" size="sm" className="text-[#7C3AED] font-bold rounded-full">
                  Bye-bye! 👋
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">👋</span>
              <h1 className="text-3xl font-black text-[#3B0764]">
                Hi, {session.user.name.split(' ')[0]}!
              </h1>
            </div>
            <p className="text-base font-bold text-[#7E22CE]">
              Ready for today's learning adventure? 🚀
            </p>
          </div>
          <div className="flex gap-3">
            {profile?.user?.role === 'student' && (
              <Link href="/teacher/onboarding">
                <Button
                  variant="outline"
                  className="rounded-full border-4 border-[#C4B5FD] text-[#7C3AED] font-bold hover:bg-[#EDE9FE]"
                >
                  🍎 Become a Teacher
                </Button>
              </Link>
            )}
            <Link href="/forum">
              <Button className="rounded-full bg-[#EC4899] hover:bg-[#DB2777] text-white font-bold shadow-lg">
                💬 Community
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex overflow-x-auto gap-2 pb-2">
            {[
              { value: 'overview', label: '🏠 Home' },
              { value: 'courses', label: '📚 My Courses' },
              { value: 'browse', label: '🔍 Browse' },
              { value: 'map', label: '🗺️ Learning Map' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`whitespace-nowrap px-5 py-3 rounded-full font-black text-base transition-all border-3 ${
                  activeTab === tab.value
                    ? 'bg-[#7C3AED] text-white shadow-lg border-[#7C3AED]'
                    : 'bg-white text-[#7C3AED] border-[#C4B5FD] hover:bg-[#EDE9FE]'
                }`}
                style={{ borderWidth: '3px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-8">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  emoji: '📚',
                  label: 'Courses Joined',
                  value: String(enrollCount),
                  bg: 'bg-[#EDE9FE]',
                  border: 'border-[#C4B5FD]',
                  text: 'text-[#7C3AED]',
                },
                {
                  emoji: '🏆',
                  label: 'Badges Earned',
                  value: '4',
                  bg: 'bg-[#FEF3C7]',
                  border: 'border-[#FCD34D]',
                  text: 'text-[#D97706]',
                },
                {
                  emoji: '🌍',
                  label: 'World Rank',
                  value: '#12',
                  bg: 'bg-[#D1FAE5]',
                  border: 'border-[#6EE7B7]',
                  text: 'text-[#059669]',
                },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  className={`${stat.bg} border-4 ${stat.border} shadow-lg rounded-3xl`}
                >
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="text-5xl">{stat.emoji}</div>
                    <div>
                      <p className="text-sm font-bold text-[#6D28D9] uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <p className={`text-4xl font-black ${stat.text}`}>{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Badges */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🎖️</span>
                <h3 className="text-xl font-black text-[#3B0764]">My Badges</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {BADGE_LIST.map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center gap-2 bg-white border-4 border-[#FCD34D] rounded-2xl px-4 py-2 shadow-md"
                  >
                    <span className="text-2xl">{badge.emoji}</span>
                    <span className="text-sm font-black text-[#D97706]">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue Learning */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">▶️</span>
                  <h3 className="text-xl font-black text-[#3B0764]">Keep Learning!</h3>
                </div>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="text-[#7C3AED] font-bold text-sm hover:underline"
                >
                  See all →
                </button>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myCourses?.enrollments?.slice(0, 3).map((enrollment: any) => (
                  <Card
                    key={enrollment.id}
                    className="border-4 border-[#C4B5FD] bg-white shadow-lg hover:shadow-xl rounded-3xl overflow-hidden hover:scale-[1.02] transition-all"
                  >
                    <div className="aspect-video w-full bg-gradient-to-br from-[#EDE9FE] to-[#FCE7F3] flex items-center justify-center">
                      {enrollment.thumbnail_url ? (
                        <img
                          src={enrollment.thumbnail_url}
                          className="h-full w-full object-cover"
                          alt={enrollment.title}
                        />
                      ) : (
                        <span className="text-6xl">
                          {enrollment.type === 'video' ? '🎬' : '📄'}
                        </span>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-[#7C3AED] bg-[#EDE9FE] rounded-full px-3 py-1">
                          {enrollment.type}
                        </span>
                      </div>
                      <h4 className="font-black text-[#3B0764] mb-3 truncate text-base">
                        {enrollment.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-3 flex-1 bg-[#EDE9FE] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-full"
                            style={{ width: '45%' }}
                          />
                        </div>
                        <span className="text-xs font-black text-[#7C3AED]">45%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!myCourses?.enrollments || myCourses.enrollments.length === 0) && (
                  <div className="border-4 border-dashed border-[#C4B5FD] rounded-3xl col-span-full bg-white/50">
                    <div className="flex flex-col items-center justify-center p-12">
                      <span className="text-6xl mb-4">📚</span>
                      <p className="text-base font-bold text-[#7E22CE] mb-4">
                        No courses yet! Let's find some! 🎉
                      </p>
                      <Button
                        onClick={() => setActiveTab('browse')}
                        className="rounded-full bg-[#7C3AED] text-white font-bold"
                      >
                        🔍 Find Courses
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          {/* MY COURSES TAB */}
          <TabsContent value="courses" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {myCourses?.enrollments?.map((enrollment: any) => (
                <Card
                  key={enrollment.id}
                  className="border-4 border-[#C4B5FD] bg-white shadow-lg rounded-3xl overflow-hidden hover:scale-[1.02] transition-all"
                >
                  <div className="aspect-video w-full bg-gradient-to-br from-[#EDE9FE] to-[#FCE7F3] flex items-center justify-center">
                    {enrollment.thumbnail_url ? (
                      <img
                        src={enrollment.thumbnail_url}
                        className="h-full w-full object-cover"
                        alt={enrollment.title}
                      />
                    ) : (
                      <span className="text-6xl">{enrollment.type === 'video' ? '🎬' : '📄'}</span>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-black text-[#3B0764] mb-1 truncate text-base">
                      {enrollment.title}
                    </h4>
                    <p className="text-sm font-semibold text-[#7E22CE] line-clamp-2 mb-4">
                      {enrollment.description}
                    </p>
                    <Button className="w-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                      ▶️ Keep Learning!
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {(!myCourses?.enrollments || myCourses.enrollments.length === 0) && (
                <div className="col-span-full text-center py-16">
                  <span className="text-6xl block mb-4">🎒</span>
                  <p className="text-lg font-bold text-[#7E22CE]">Your learning bag is empty!</p>
                  <Button
                    onClick={() => setActiveTab('browse')}
                    className="mt-4 rounded-full bg-[#7C3AED] text-white font-bold"
                  >
                    🔍 Find Courses
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* BROWSE TAB */}
          <TabsContent value="browse" className="space-y-6">
            <div className="flex items-center gap-3 bg-white border-4 border-[#C4B5FD] rounded-2xl px-4 py-2 shadow-md">
              <span className="text-xl">🔍</span>
              <input
                type="text"
                placeholder="Search for fun courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-base font-semibold text-[#3B0764] placeholder-[#C4B5FD] focus:outline-none"
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {filteredCourses?.map((course: any) => {
                const isEnrolled = myCourses?.enrollments?.some(
                  (e: any) => e.course_id === course.id
                );
                return (
                  <Card
                    key={course.id}
                    className="border-4 border-[#E9D5FF] bg-white shadow-lg rounded-3xl overflow-hidden hover:scale-[1.03] transition-all"
                  >
                    <div className="aspect-video w-full bg-gradient-to-br from-[#EDE9FE] to-[#D1FAE5] flex items-center justify-center relative">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          className="h-full w-full object-cover"
                          alt={course.title}
                        />
                      ) : (
                        <span className="text-5xl">{course.type === 'video' ? '🎬' : '📄'}</span>
                      )}
                      <div className="absolute top-2 right-2">
                        <span
                          className={`text-sm font-black px-3 py-1 rounded-full shadow ${course.price === '0.00' ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#FEF3C7] text-[#D97706]'}`}
                        >
                          {course.price === '0.00' ? '🆓 Free!' : `💰 $${course.price}`}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-black text-[#3B0764] mb-1 truncate text-sm">
                        {course.title}
                      </h4>
                      <p className="text-xs font-semibold text-[#7E22CE] mb-3 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#9CA3AF] font-bold">
                          👤 {course.teacher_name}
                        </span>
                        <Button
                          size="sm"
                          disabled={isEnrolled || enrollMutation.isPending}
                          onClick={() => enrollMutation.mutate(course.id)}
                          className={`rounded-full font-black text-xs px-3 h-8 ${isEnrolled ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white'}`}
                        >
                          {isEnrolled
                            ? '✅ Joined!'
                            : enrollMutation.isPending
                              ? '...'
                              : '🚀 Join!'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* LEARNING MAP TAB */}
          <TabsContent value="map" className="space-y-6">
            <Card className="border-4 border-[#C4B5FD] bg-white shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#EDE9FE] to-[#FCE7F3] pb-6">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">🗺️</div>
                  <div>
                    <CardTitle className="text-2xl font-black text-[#3B0764]">
                      ✨ My Learning Adventure Map
                    </CardTitle>
                    <CardDescription className="text-base font-bold text-[#7E22CE] mt-1">
                      Follow your special path to become a learning superstar!
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-8">
                  {[
                    {
                      emoji: '🌱',
                      title: 'Getting Started!',
                      status: 'completed',
                      desc: 'You learned the basics and took your first step!',
                      color: 'bg-[#D1FAE5] border-[#34D399]',
                      dot: 'bg-[#10B981]',
                    },
                    {
                      emoji: '📖',
                      title: 'Going Deeper!',
                      status: 'current',
                      desc: 'You are learning cool new things right now! Keep going!',
                      color: 'bg-[#EDE9FE] border-[#A78BFA]',
                      dot: 'bg-[#7C3AED]',
                    },
                    {
                      emoji: '🚀',
                      title: 'Level Up!',
                      status: 'upcoming',
                      desc: 'Next you will master super advanced topics!',
                      color: 'bg-[#F3F4F6] border-[#D1D5DB]',
                      dot: 'bg-[#D1D5DB]',
                    },
                    {
                      emoji: '🏆',
                      title: 'Champion!',
                      status: 'upcoming',
                      desc: 'Complete everything and become a true learning champion!',
                      color: 'bg-[#F3F4F6] border-[#D1D5DB]',
                      dot: 'bg-[#D1D5DB]',
                    },
                  ].map((step, index, arr) => (
                    <div key={index} className="relative pl-12">
                      {index !== arr.length - 1 && (
                        <div className="absolute left-[22px] top-12 bottom-[-20px] w-1 bg-gradient-to-b from-[#C4B5FD] to-transparent rounded-full" />
                      )}
                      <div
                        className={`absolute left-0 top-1 h-11 w-11 rounded-2xl border-4 flex items-center justify-center ${step.color} shadow-md`}
                      >
                        <span className="text-xl">{step.emoji}</span>
                      </div>
                      <div
                        className={`ml-2 rounded-2xl border-4 p-4 ${step.status === 'upcoming' ? 'opacity-60' : ''} ${step.color}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="text-base font-black text-[#3B0764]">{step.title}</h5>
                          {step.status === 'completed' && <span className="text-sm">✅</span>}
                          {step.status === 'current' && (
                            <span className="text-sm animate-pulse">⚡</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-[#6D28D9]">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Button className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black px-8 py-4 text-base shadow-xl hover:scale-[1.05] transition-all">
                    🤖 Get My AI Learning Path!
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
