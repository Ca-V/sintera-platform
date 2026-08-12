// Componentes de UI reutilizáveis do Mobile (espelham a identidade da Web).
import React from 'react'
import {
  View, Text, Pressable, TextInput, ScrollView, ActivityIndicator,
  type TextInputProps, type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { colors, spacing, radius, font } from '@/lib/theme'

/** Tela padrão: fundo, cabeçalho com voltar opcional, conteúdo rolável. */
export function Screen({ title, back, children, scroll = true }: {
  title?: string; back?: boolean; children: React.ReactNode; scroll?: boolean
}) {
  const router = useRouter()
  const Body = scroll ? ScrollView : View
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }} edges={['top']}>
      {(title || back) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
          {back && (
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Text style={{ color: colors.petal, fontSize: font.size.lg }}>‹</Text>
            </Pressable>
          )}
          {title && <Text style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.onyx }}>{title}</Text>}
        </View>
      )}
      <Body style={{ flex: 1 }} contentContainerStyle={scroll ? { padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.md } : undefined}>
        {children}
      </Body>
    </SafeAreaView>
  )
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ backgroundColor: colors.cream, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg }, style]}>
      {children}
    </View>
  )
}

export function Button({ label, onPress, disabled, loading, variant = 'primary' }: {
  label: string; onPress: () => void; disabled?: boolean; loading?: boolean; variant?: 'primary' | 'ghost'
}) {
  const primary = variant === 'primary'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        backgroundColor: primary ? colors.petal : 'transparent',
        borderWidth: primary ? 0 : 1,
        borderColor: colors.border,
        borderRadius: radius.full,
        paddingVertical: spacing.md,
        alignItems: 'center',
        opacity: disabled || loading ? 0.5 : 1,
      }}
    >
      {loading
        ? <ActivityIndicator color={primary ? '#fff' : colors.petal} />
        : <Text style={{ color: primary ? '#fff' : colors.onyx, fontSize: font.size.md, fontWeight: font.weight.semibold }}>{label}</Text>}
    </Pressable>
  )
}

export function Field({ label, ...props }: { label?: string } & TextInputProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      {label && <Text style={{ fontSize: font.size.xs, color: colors.mauve, textTransform: 'uppercase' }}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.mauve}
        {...props}
        style={{
          borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
          backgroundColor: colors.ivory, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
          fontSize: font.size.md, color: colors.onyx,
        }}
      />
    </View>
  )
}

export function EmptyOrError({ text }: { text: string }) {
  return <Text style={{ color: colors.mauve, fontSize: font.size.sm }}>{text}</Text>
}

export function Loading() {
  return <ActivityIndicator color={colors.petal} style={{ marginTop: spacing.xl }} />
}
