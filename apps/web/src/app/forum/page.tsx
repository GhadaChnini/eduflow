'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { toast } from 'sonner';

function FormattedDate({ date }: { date: string }) {
  const [formatted, setFormatted] = useState('');
  useEffect(() => {
    setFormatted(new Date(date).toLocaleDateString());
  }, [date]);
  return <>{formatted || '...'}</>;
}

export default function ForumPage() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');

  const { data: forumData } = useQuery({
    queryKey: ['forum-posts'],
    queryFn: async () => {
      const res = await fetch('/api/forum');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/forum', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('🎉 Your question is posted!');
      setShowCreate(false);
      setTitle('');
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
    },
  });

  const filteredPosts = forumData?.posts?.filter(
    (p: any) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.content?.toLowerCase().includes(search.toLowerCase())
  );

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
                href="/leaderboard"
                className="text-base font-bold text-[#7C3AED] hover:text-[#EC4899] transition-colors"
              >
                🏆 Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">💬</span>
              <h1 className="text-3xl font-black text-[#3B0764]">Ask & Share! 🙋</h1>
            </div>
            <p className="text-base font-bold text-[#7E22CE]">
              Got a question? Share it here and your friends will help! 🤝
            </p>
          </div>
          {session && (
            <Button
              onClick={() => setShowCreate(!showCreate)}
              className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black text-base px-6 py-5 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              ✏️ Ask a Question!
            </Button>
          )}
        </div>

        {/* Create Post Form */}
        {showCreate && (
          <Card className="mb-8 border-4 border-[#C4B5FD] bg-white shadow-xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#EDE9FE] to-[#FCE7F3] px-6 py-4 flex items-center gap-3">
              <span className="text-2xl">✏️</span>
              <CardTitle className="text-xl font-black text-[#3B0764]">
                Ask Your Question!
              </CardTitle>
            </div>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm font-black text-[#7C3AED] mb-2 block">
                  📝 What's your question?
                </label>
                <Input
                  placeholder="Type your question title here..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-4 border-[#C4B5FD] rounded-2xl text-base font-semibold text-[#3B0764] focus:border-[#7C3AED] bg-[#FAF5FF]"
                />
              </div>
              <div>
                <label className="text-sm font-black text-[#7C3AED] mb-2 block">
                  💭 Tell us more...
                </label>
                <Textarea
                  placeholder="Describe your question in more detail..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="border-4 border-[#C4B5FD] rounded-2xl text-base font-semibold text-[#3B0764] focus:border-[#7C3AED] min-h-[120px] bg-[#FAF5FF]"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowCreate(false)}
                  className="rounded-full font-bold text-[#7C3AED]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => createPostMutation.mutate()}
                  disabled={createPostMutation.isPending || !title || !content}
                  className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-black px-6"
                >
                  🚀 Post It!
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="flex items-center gap-3 bg-white border-4 border-[#C4B5FD] rounded-2xl px-4 py-3 shadow-md mb-6">
          <span className="text-xl">🔍</span>
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-base font-semibold text-[#3B0764] placeholder-[#C4B5FD] focus:outline-none"
          />
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts?.map((post: any, index: number) => {
            const colors = [
              'border-[#C4B5FD] hover:border-[#A78BFA]',
              'border-[#F9A8D4] hover:border-[#F472B6]',
              'border-[#6EE7B7] hover:border-[#34D399]',
              'border-[#FDBA74] hover:border-[#FB923C]',
            ];
            const emojis = ['💡', '🤔', '🎯', '🌟', '❓', '💬', '🔥'];
            return (
              <Card
                key={post.id}
                className={`border-4 ${colors[index % colors.length]} bg-white shadow-md hover:shadow-lg rounded-3xl transition-all hover:scale-[1.01] cursor-pointer`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE9FE] text-2xl flex-shrink-0">
                      {emojis[index % emojis.length]}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-black text-[#3B0764] mb-2">{post.title}</h3>
                      <p className="text-sm font-semibold text-[#7E22CE] line-clamp-2 mb-3">
                        {post.content}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#9CA3AF]">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#EDE9FE] to-[#FCE7F3] flex items-center justify-center text-[#7C3AED] font-black text-xs overflow-hidden border-2 border-[#E9D5FF]">
                            {post.user_image ? (
                              <img src={post.user_image} alt={post.user_name} />
                            ) : (
                              post.user_name?.[0] || '?'
                            )}
                          </div>
                          <span className="font-black text-[#7C3AED]">{post.user_name}</span>
                        </div>
                        <span>
                          📅 <FormattedDate date={post.created_at} />
                        </span>
                        <span>💬 {post.reply_count || 0} replies</span>
                      </div>
                    </div>
                    <span className="text-[#C4B5FD] text-xl">→</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {(!filteredPosts || filteredPosts.length === 0) && (
            <div className="text-center py-16 bg-white border-4 border-dashed border-[#C4B5FD] rounded-3xl">
              <span className="text-6xl block mb-4">💬</span>
              <p className="text-lg font-bold text-[#7E22CE]">
                No questions yet — be brave and ask first! 🦁
              </p>
              {session && (
                <Button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 rounded-full bg-[#7C3AED] text-white font-bold"
                >
                  ✏️ Ask a Question!
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
