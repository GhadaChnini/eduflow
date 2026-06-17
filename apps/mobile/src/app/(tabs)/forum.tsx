import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/utils/auth/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  Nunito_600SemiBold,
} from '@expo-google-fonts/nunito';
import { StatusBar } from 'expo-status-bar';
import KeyboardAvoidingAnimatedView from '@/components/KeyboardAvoidingAnimatedView';
import { authFetch } from '@/utils/auth/getSession';

const POST_EMOJIS = ['💡', '🤔', '🎯', '🌟', '❓', '💬', '🔥', '🦄'];
const POST_COLORS = [
  { border: '#C4B5FD' },
  { border: '#F9A8D4' },
  { border: '#6EE7B7' },
  { border: '#FDBA74' },
  { border: '#93C5FD' },
];

export default function MobileForum() {
  const insets = useSafeAreaInsets();
  const { auth, signIn } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const { data: forumData, isLoading } = useQuery({
    queryKey: ['forum'],
    queryFn: async () => {
      const res = await fetch('/api/forum');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch('/api/forum', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      setShowCreate(false);
      setTitle('');
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['forum'] });
    },
  });

  if (!fontsLoaded) return null;

  const filteredPosts = forumData?.posts?.filter(
    (p: any) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View style={{ flex: 1, backgroundColor: '#FAF5FF', paddingTop: insets.top }}>
        <StatusBar style="dark" />

        {/* Header */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 4,
            borderBottomColor: '#C4B5FD',
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 22, fontFamily: 'Nunito_900Black', color: '#3B0764' }}>
              💬 Ask & Share!
            </Text>
            {auth ? (
              <TouchableOpacity
                onPress={() => setShowCreate(!showCreate)}
                style={{
                  backgroundColor: '#7C3AED',
                  borderRadius: 100,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  shadowColor: '#7C3AED',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: 'Nunito_900Black' }}>
                  ✏️ Ask!
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => signIn()}
                style={{
                  backgroundColor: '#EDE9FE',
                  borderRadius: 100,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: '#7C3AED', fontSize: 13, fontFamily: 'Nunito_900Black' }}>
                  Sign In
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F5F3FF',
              borderWidth: 3,
              borderColor: '#C4B5FD',
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 8,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <TextInput
              placeholder="Search questions..."
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#3B0764' }}
              placeholderTextColor="#C4B5FD"
            />
          </View>
        </View>

        {/* Create Post Form */}
        {showCreate && (
          <View
            style={{
              margin: 16,
              backgroundColor: '#FFFFFF',
              borderWidth: 3,
              borderColor: '#C4B5FD',
              borderRadius: 20,
              padding: 16,
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Nunito_900Black',
                color: '#3B0764',
                marginBottom: 12,
              }}
            >
              ✏️ Ask Your Question!
            </Text>
            <TextInput
              placeholder="What's your question?"
              value={title}
              onChangeText={setTitle}
              style={{
                borderWidth: 3,
                borderColor: '#C4B5FD',
                borderRadius: 14,
                padding: 12,
                fontSize: 14,
                fontFamily: 'Nunito_700Bold',
                color: '#3B0764',
                marginBottom: 10,
                backgroundColor: '#FAF5FF',
              }}
              placeholderTextColor="#C4B5FD"
            />
            <TextInput
              placeholder="Tell us more about it..."
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 3,
                borderColor: '#C4B5FD',
                borderRadius: 14,
                padding: 12,
                fontSize: 14,
                fontFamily: 'Nunito_600SemiBold',
                color: '#3B0764',
                marginBottom: 12,
                minHeight: 80,
                backgroundColor: '#FAF5FF',
                textAlignVertical: 'top',
              }}
              placeholderTextColor="#C4B5FD"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowCreate(false)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderRadius: 100,
                  borderWidth: 2,
                  borderColor: '#C4B5FD',
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: 'Nunito_800ExtraBold', color: '#7C3AED' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => createMutation.mutate()}
                disabled={createMutation.isPending || !title || !content}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderRadius: 100,
                  backgroundColor: '#7C3AED',
                  opacity: !title || !content ? 0.5 : 1,
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: 'Nunito_900Black', color: '#FFFFFF' }}>
                  🚀 Post It!
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 48 }}>🌀</Text>
              <ActivityIndicator color="#7C3AED" size="large" />
            </View>
          ) : (
            <>
              {filteredPosts?.map((post: any, index: number) => (
                <TouchableOpacity
                  key={post.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 3,
                    borderColor: POST_COLORS[index % POST_COLORS.length].border,
                    borderRadius: 20,
                    padding: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: '#EDE9FE',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>
                        {POST_EMOJIS[index % POST_EMOJIS.length]}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: 'Nunito_800ExtraBold',
                          color: '#3B0764',
                          marginBottom: 4,
                        }}
                      >
                        {post.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: 'Nunito_600SemiBold',
                          color: '#7E22CE',
                          marginBottom: 10,
                        }}
                        numberOfLines={2}
                      >
                        {post.content}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: '#EDE9FE',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 2,
                              borderColor: '#C4B5FD',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontFamily: 'Nunito_900Black',
                                color: '#7C3AED',
                              }}
                            >
                              {post.user_name?.[0] || '?'}
                            </Text>
                          </View>
                          <Text
                            style={{ fontSize: 11, fontFamily: 'Nunito_700Bold', color: '#7C3AED' }}
                          >
                            {post.user_name}
                          </Text>
                        </View>
                        <Text
                          style={{ fontSize: 11, fontFamily: 'Nunito_700Bold', color: '#9CA3AF' }}
                        >
                          💬 {post.reply_count || 0} replies
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {(!filteredPosts || filteredPosts.length === 0) && (
                <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 64 }}>💬</Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Nunito_900Black',
                      color: '#3B0764',
                      textAlign: 'center',
                    }}
                  >
                    No questions yet!
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Nunito_700Bold',
                      color: '#7E22CE',
                      textAlign: 'center',
                    }}
                  >
                    Be the first brave one to ask! 🦁
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
