import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { colors } from '@/theme/colors';

type TabIconName = NonNullable<SymbolViewProps['name']>;

function tabIcon(name: TabIconName) {
  return ({ color }: { color: ColorValue }) => (
    <SymbolView name={name} tintColor={color ?? colors.textSecondary} size={22} />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon({ ios: 'house.fill', android: 'home', web: 'home' }),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: tabIcon({ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }),
        }}
      />
      <Tabs.Screen
        name="packing"
        options={{
          title: 'Packing',
          tabBarIcon: tabIcon({ ios: 'bag.fill', android: 'backpack', web: 'backpack' }),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabIcon({ ios: 'person.crop.circle', android: 'person', web: 'person' }),
        }}
      />
    </Tabs>
  );
}
