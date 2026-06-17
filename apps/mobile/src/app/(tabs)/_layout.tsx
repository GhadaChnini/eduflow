import { useAuth } from '@/utils/auth/useAuth';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
}

export default function TabLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isAuthenticated
          ? {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 4,
              borderTopColor: '#C4B5FD',
              paddingTop: 6,
            }
          : { display: 'none' },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          marginBottom: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="forum"
        options={{
          title: 'Ask & Share',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⭐" focused={focused} />,
        }}
      />
    </Tabs>
  );
}