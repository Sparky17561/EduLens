import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, Pressable, ActivityIndicator } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { sessionApi, setBackendUrl } from '../api/client'
import { colors, type, spacing, radius, shadow } from '../theme/tokens'
import { ScreenScaffold, PrimaryButton } from '../components/ui'
import { ScreenHeader } from '../components/widgets'

type Nav = NativeStackNavigationProp<RootStackParamList, 'QRScanner'>

export default function QRScannerScreen() {
  const nav = useNavigation<Nav>()
  const { student, setStudent, setSession } = useSessionStore()
  const [permission, requestPermission] = useCameraPermissions()
  const scanLock = React.useRef(false)
  const [scanned, setScanned] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!permission?.granted) {
    return (
      <ScreenScaffold tint="dawn">
        <ScreenHeader title="Camera Access" kicker="PERMISSION NEEDED" onBack={() => nav.goBack()} />
        <View style={styles.permContainer}>
          <Text style={styles.permText}>
            EduLens needs camera access to read the session QR code on the teacher's dashboard.
          </Text>
          <PrimaryButton
            label="Grant Permission"
            variant="sky"
            onPress={() => { requestPermission(); }}
            style={{ width: '100%', marginBottom: spacing.md }}
          />
          <Pressable onPress={() => nav.goBack()}>
            <Text style={{ ...type.bodyBold, color: colors.inkSoft }}>Cancel</Text>
          </Pressable>
        </View>
      </ScreenScaffold>
    )
  }

  const handleBarcode = async ({ data }: { data: string }) => {
    if (scanLock.current || loading || !student) return
    scanLock.current = true
    setScanned(true)
    setLoading(true)

    try {
      let parseData = data
      if (parseData.startsWith('edulens://')) {
        parseData = parseData.replace('edulens://', 'http://x.x/')
      }
      const url = new URL(parseData)
      const parts = url.pathname.split('/').filter(Boolean)
      const sessionId = parts[parts.length - 1]
      const sessionCode = url.searchParams.get('code') || ''
      const host = url.searchParams.get('host') || '192.168.1.100'
      const port = parseInt(url.searchParams.get('port') || '3001')

      console.log('[QR] Parsed — sessionId:', sessionId, 'host:', host, 'port:', port)

      setBackendUrl(host, port)

      const result = await sessionApi.join({ sessionId, studentName: student.name })
      setStudent({ id: result.studentId, name: result.studentName })
      setSession({ id: result.sessionId, code: result.sessionCode, topic: result.topic, host, port })
      nav.navigate('Lobby')
    } catch (err: any) {
      Alert.alert('Scan Failed', err.response?.data?.error || err.message || 'Make sure both devices are on the same Wi-Fi.', [
        {
          text: 'Try Again',
          onPress: () => {
            scanLock.current = false
            setScanned(false)
          },
        },
      ])
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      {/* Header overlay */}
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Scan Session QR</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.scannerWrapper}>
        {!scanned && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarcode}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        )}
        
        {/* Overlay frame and hint text */}
        <View style={styles.overlayScrim}>
          <View style={styles.viewfinderFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          <Text style={styles.hintText}>
            Align the QR code on the teacher's dashboard inside the frame.
          </Text>

          {loading && (
            <View style={styles.loadingToast}>
              <ActivityIndicator color={colors.sky} style={{ marginRight: 8 }} />
              <Text style={styles.loadingText}>Connecting to session...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Manual Code entry navigation */}
      <Pressable style={styles.manualBar} onPress={() => nav.navigate('CodeEntry')}>
        <Text style={styles.manualText}>Use a session code instead →</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: '#111',
  },
  backBtn: {
    paddingVertical: 4,
  },
  backText: {
    ...type.bodyBold,
    color: colors.coral,
  },
  title: {
    ...type.subhead,
    color: '#fff',
  },
  scannerWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  overlayScrim: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  viewfinderFrame: {
    width: 220,
    height: 220,
    position: 'relative',
    backgroundColor: 'transparent',
    marginBottom: spacing.md,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.coral,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  hintText: {
    ...type.small,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  loadingToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: spacing.md,
    ...shadow.soft,
  },
  loadingText: {
    ...type.smallBold,
    color: colors.ink,
  },
  manualBar: {
    backgroundColor: '#111',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  manualText: {
    ...type.bodyBold,
    color: colors.sky,
  },
  permContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  permText: {
    ...type.body,
    textAlign: 'center',
    color: colors.inkSoft,
    marginBottom: spacing.lg,
  },
})
