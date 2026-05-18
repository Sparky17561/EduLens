import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import WelcomeScreen from '../screens/WelcomeScreen'
import QRScannerScreen from '../screens/QRScannerScreen'
import CodeEntryScreen from '../screens/CodeEntryScreen'
import LobbyScreen from '../screens/LobbyScreen'
import ChatScreen from '../screens/ChatScreen'
import QuizScreen from '../screens/QuizScreen'
import ResultsScreen from '../screens/ResultsScreen'
import HomeworkScreen from '../screens/HomeworkScreen'
import ReportScreen from '../screens/ReportScreen'
import FlashcardScreen from '../screens/FlashcardScreen'

export type RootStackParamList = {
  Welcome: undefined
  QRScanner: undefined
  CodeEntry: undefined
  Lobby: undefined
  Chat: undefined
  Quiz: undefined
  Results: undefined
  Homework: undefined
  Report: undefined
  Flashcards: undefined
}

import { useStudentWebSocket } from '../hooks/useStudentWebSocket'
import { navigationRef } from './RootNavigation'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  useStudentWebSocket()

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#ffffff' }
        }}
      >
        <Stack.Screen name="Welcome"  component={WelcomeScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="CodeEntry" component={CodeEntryScreen} />
        <Stack.Screen name="Lobby"    component={LobbyScreen} />
        <Stack.Screen name="Chat"     component={ChatScreen} />
        <Stack.Screen name="Quiz"     component={QuizScreen} />
        <Stack.Screen name="Results"  component={ResultsScreen} />
        <Stack.Screen name="Homework" component={HomeworkScreen} />
        <Stack.Screen name="Report"   component={ReportScreen} />
        <Stack.Screen name="Flashcards" component={FlashcardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
