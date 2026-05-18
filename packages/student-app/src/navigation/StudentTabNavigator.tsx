import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Svg, { Path, Circle, Rect } from 'react-native-svg'
import { colors, type, spacing, shadow } from '../theme/tokens'

import HomeTab from '../screens/tabs/HomeTab'
import PastSessionsTab from '../screens/tabs/PastSessionsTab'
import StudentReportTab from '../screens/tabs/StudentReportTab'
import ProfileTab from '../screens/tabs/ProfileTab'

export type TabParamList = {
  Home: undefined
  Sessions: undefined
  Report: undefined
  Profile: undefined
}

const Tab = createBottomTabNavigator<TabParamList>()

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const color = focused ? colors.coralDeep : colors.inkFaint
  const sw = focused ? '2.2' : '1.8'

  if (name === 'Home') return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M3 11L12 3l9 8v9a1 1 0 0 1-1 1H15v-5h-6v5H4a1 1 0 0 1-1-1v-9z"
            stroke={color} strokeWidth={sw} fill={focused ? colors.coralWash : 'none'}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )

  if (name === 'Sessions') return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw} fill={focused ? colors.skyWash : 'none'} />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth={sw}
            strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )

  if (name === 'Report') return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Rect x="3" y="3" width="18" height="18" rx="3"
            stroke={color} strokeWidth={sw} fill={focused ? colors.goldWash : 'none'} />
      <Path d="M8 17v-4M12 17v-7M16 17v-2"
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  )

  if (name === 'Profile') return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={sw}
              fill={focused ? colors.sageWash : 'none'} />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
            stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </Svg>
  )

  return null
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[
      styles.tabLabel,
      { color: focused ? colors.coralDeep : colors.inkFaint,
        fontWeight: focused ? '700' : '500' }
    ]}>
      {label}
    </Text>
  )
}

export default function StudentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.coralDeep,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarLabel: ({ focused }) => <TabLabel label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home"     component={HomeTab} />
      <Tab.Screen name="Sessions" component={PastSessionsTab} />
      <Tab.Screen name="Report"   component={StudentReportTab} />
      <Tab.Screen name="Profile"  component={ProfileTab} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    height: 62 + (Platform.OS === 'ios' ? 0 : 0),
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 16 : 10,
    ...shadow.soft,
  },
  tabLabel: {
    ...type.caption,
    fontSize: 10,
    letterSpacing: 0.2,
    marginTop: 2,
  },
})
