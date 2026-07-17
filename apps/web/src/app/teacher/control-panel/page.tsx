'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: async () => {
      const res = await fetch('/api/teacher/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-nunito p-4 sm:p-8">
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#3B0764]">🍎 Teacher Hub</h1>
          <p className="text-[#7E22CE] font-bold">Manage your classes and track student progress.</p>
        </div>
        <Link href="/teacher/control-panel/create">
          <Button className="bg-[#7C3AED] hover:bg-[#6D28D9] rounded-full font-bold shadow-lg py-6 px-6">
            + Create New Course
          </Button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex gap-2 pb-2 overflow-x-auto">
            {['overview', 'my-courses', 'students'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full font-black capitalize transition-all ${
                  activeTab === tab ? 'bg-[#7C3AED] text-white' : 'bg-white border-2 border-[#E5E7EB] text-gray-600'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-2 border-purple-100 shadow-sm rounded-3xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="text-4xl p-4 rounded-2xl bg-blue-50">👥</div>
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase">Total Students</p>
                    <p className="text-3xl font-black text-[#3B0764]">
                      {isLoading ? '...' : stats?.totalStudents || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-100 shadow-sm rounded-3xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="text-4xl p-4 rounded-2xl bg-purple-50">📚</div>
                  <div>
                    <p className="text-sm font-bold text-gray-500 uppercase">Active Courses</p>
                    <p className="text-3xl font-black text-[#3B0764]">
                      {isLoading ? '...' : stats?.activeCourses || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}