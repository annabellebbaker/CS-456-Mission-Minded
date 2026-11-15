import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SymbolViewProps } from 'expo-symbols';
import { View, type ColorValue } from 'react-native';

import { colors } from '@/theme/colors';

type TabIconName = NonNullable<SymbolViewProps['name']>;

function tabIcon(name: TabIconName) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: focused ? colors.tabActiveBg : 'transparent',
        }}>
        <SymbolView name={name} tintColor={color ?? colors.tabInactive} size={22} />
      </View>
    );
  };
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon({ ios: 'house.fill', android: 'home', web: 'home' }),
        }}
      />
      <Tabs.Screen
        name="missionary"
        options={{
          title: 'Missionary',
          tabBarIcon: tabIcon({ ios: 'globe.americas.fill', android: 'public', web: 'public' }),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: tabIcon({ ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' }),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: tabIcon({ ios: 'gearshape.fill', android: 'settings', web: 'settings' }),
        }}
      />
    </Tabs>
  );
}
