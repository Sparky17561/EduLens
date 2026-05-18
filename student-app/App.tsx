import React, { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces'
import { Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito'
import AppNavigator from './src/navigation/AppNavigator'
import { colors } from './src/theme/tokens'

// Keep the native splash up until our storybook fonts are ready
SplashScreen.preventAutoHideAsync().catch(() => {})

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  })

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root} onLayout={onLayoutRootView}>
        <StatusBar style="dark" />
        <AppNavigator />
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.paper,
  },
})
