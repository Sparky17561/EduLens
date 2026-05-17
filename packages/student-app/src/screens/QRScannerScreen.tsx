import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../navigation/AppNavigator'
import { useSessionStore } from '../store/sessionStore'
import { sessionApi, setBackendUrl } from '../api/client'
import { theme } from '../theme'

type Nav = NativeStackNavigationProp<RootStackParamList, 'QRScanner'>

export default function QRScannerScreen() {
  const nav = useNavigation<Nav>()
  const { student, setStudent, setSession } = useSessionStore()
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!permission?.granted) {
    return (
      <View style={s.permContainer}>
        <Text style={s.permText}>Camera permission needed to scan QR codes</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.colors.primary }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleBarcode = async ({ data }: { data: string }) => {
    if (scanned || loading || !student) return
    setScanned(true)
    setLoading(true)

    try {
      // Parse edulens://join/<sessionId>?code=<CODE>&host=<IP>&port=<PORT> safely by converting to standard http scheme for parser compatibility
      let parseData = data
      if (parseData.startsWith('edulens://')) {
        parseData = parseData.replace('edulens://', 'http://')
      }
      const url = new URL(parseData)
      const sessionId = url.pathname.replace('/join/', '').replace('join/', '')
      const sessionCode = url.searchParams.get('code') || ''
      const host = url.searchParams.get('host') || '192.168.1.100'
      const port = parseInt(url.searchParams.get('port') || '3001')

      // Set backend URL from QR
      setBackendUrl(host, port)

      const result = await sessionApi.join({ sessionId, studentName: student.name })
      setStudent({ id: result.studentId, name: result.studentName })
      setSession({ id: result.sessionId, code: result.sessionCode, topic: result.topic, host, port })
      nav.navigate('Lobby')
    } catch (err: any) {
      Alert.alert('Failed to join', err.response?.data?.error || err.message, [
        { text: 'Retry', onPress: () => setScanned(false) }
      ])
    }
    setLoading(false)
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Scan QR Code</Text>
        <View style={{ width: 60 }} />
      </View>

      <CameraView
        style={s.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcode}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={s.overlay}>
          <View style={s.frame} />
          <Text style={s.hint}>Point at the QR code on the teacher's screen</Text>
          {loading && <Text style={s.loading}>Joining session…</Text>}
        </View>
      </CameraView>

      <TouchableOpacity style={s.codeBtn} onPress={() => nav.navigate('CodeEntry')}>
        <Text style={s.codeBtnText}>Enter code instead →</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56, backgroundColor: '#000' },
  back: { color: '#fff', fontSize: 16 },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  frame: {
    width: 240, height: 240,
    borderWidth: 3, borderColor: theme.colors.primary,
    borderRadius: 16,
    backgroundColor: 'transparent'
  },
  hint: { color: '#fff', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  loading: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
  codeBtn: { padding: 20, backgroundColor: '#111', alignItems: 'center' },
  codeBtnText: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
  permContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permText: { textAlign: 'center', marginBottom: 24, color: theme.colors.text },
  permBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12 },
  permBtnText: { color: '#fff', fontWeight: '700' }
})
