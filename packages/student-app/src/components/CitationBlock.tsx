import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, type, radius } from '../theme/tokens'

export function CitationBlock({
  citations,
  confidence,
  confidenceNote
}: {
  citations?: Array<{ label?: string; source?: string; page?: number }>
  confidence?: 'high' | 'medium' | 'low'
  confidenceNote?: string
}) {
  if (!citations?.length && !confidence) return null
  return (
    <View style={styles.wrap}>
      {confidence && confidence !== 'high' && (
        <Text style={[styles.conf, confidence === 'low' && styles.confLow]}>
          {confidence === 'low' ? '⚠️' : 'ℹ️'} {confidenceNote || 'Verify with teacher'}
        </Text>
      )}
      {citations?.map((c, i) => (
        <Text key={i} style={styles.cite}>
          {c.label || `📖 From ${c.source}, p.${c.page}`}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.line, borderStyle: 'dashed' },
  conf: { ...type.caption, color: colors.coralDeep, marginBottom: 4 },
  confLow: { color: colors.coral },
  cite: { ...type.caption, color: colors.skyDeep, marginTop: 4, backgroundColor: colors.skyWash, padding: 6, borderRadius: radius.sm }
})
