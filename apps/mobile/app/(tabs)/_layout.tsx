import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import {
  Home,
  Calendar,
  Target,
  CreditCard,
  Gem,
  Users,
  BarChart3,
} from 'lucide-react-native';
import { FamilyMint } from '@/constants/Colors';
import { getUser, getHousehold } from '@/constants/Api';

interface TabBarIconProps {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  focused: boolean;
  isKids?: boolean;
}

function TabBarIcon({ Icon, focused, isKids }: TabBarIconProps) {
  const activeColor = isKids ? '#0284C7' : FamilyMint.primary;
  const inactiveColor = isKids ? '#64748B' : FamilyMint.foregroundSubtle;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Icon
        size={20}
        color={focused ? activeColor : inactiveColor}
        strokeWidth={focused ? 2.4 : 1.8}
      />
    </View>
  );
}

export default function TabLayout() {
  const [isChildAccount, setIsChildAccount] = useState(false);

  useEffect(() => {
    Promise.all([getUser(), getHousehold()])
      .then(([u, h]) => {
        if (h?.role === 'DEPENDENT' || h?.isChildAccount || u?.isChildAccount) {
          setIsChildAccount(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isChildAccount ? '#0284C7' : FamilyMint.primary,
        tabBarInactiveTintColor: isChildAccount ? '#64748B' : FamilyMint.foregroundSubtle,
        tabBarStyle: {
          backgroundColor: isChildAccount ? '#FFFFFF' : FamilyMint.background,
          borderTopColor: isChildAccount ? '#BAE6FD' : FamilyMint.border,
          borderTopWidth: isChildAccount ? 2 : 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isChildAccount ? 'Mi Alcancía' : 'Inicio',
          tabBarIcon: ({ focused }) => <TabBarIcon Icon={Home} focused={focused} isKids={isChildAccount} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendario',
          href: isChildAccount ? null : undefined,
          tabBarIcon: ({ focused }) => <TabBarIcon Icon={Calendar} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Presupuestos',
          href: isChildAccount ? null : undefined,
          tabBarIcon: ({ focused }) => <TabBarIcon Icon={Target} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="commitments"
        options={{
          title: 'Compromisos',
          href: isChildAccount ? null : undefined,
          tabBarIcon: ({ focused }) => <TabBarIcon Icon={CreditCard} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="patrimony"
        options={{
          title: 'Patrimonio',
          href: isChildAccount ? null : undefined,
          tabBarIcon: ({ focused }) => <TabBarIcon Icon={Gem} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: isChildAccount ? 'Misiones' : 'Familia',
          tabBarIcon: ({ focused }) => <TabBarIcon Icon={Users} focused={focused} isKids={isChildAccount} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reportes',
          href: isChildAccount ? null : undefined,
          tabBarIcon: ({ focused }) => <TabBarIcon Icon={BarChart3} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
