import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BUSINESS_EVENTS } from '@/constants/game-content';
import { eventChoiceCost } from '@/constants/business-rules';
import { useGame } from '@/providers/GameProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useColors } from '@/hooks/useColors';
import { MotionPressable, Reveal } from './Motion';

export function BusinessDecision() {
  const { state, hydrated, resolveBusinessEvent } = useGame();
  const { user } = useAuth();
  const colors = useColors();
  const [error, setError] = useState('');
  const event = BUSINESS_EVENTS.find((item) => item.id === state.pendingEventId);
  return (
    <Modal visible={Boolean(event && hydrated && user)} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Reveal style={[styles.dialog, { backgroundColor: colors.card }]}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.icon, { backgroundColor: colors.orangeSoft }]}><Ionicons name="warning-outline" size={28} color={colors.primary} /></View>
            <Text style={[styles.status, { color: colors.primary }]}>SHOP PAUSED · YOUR DECISION</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>{event?.title}</Text>
            <Text style={[styles.story, { color: colors.inkSoft }]}>{event?.story}</Text>
            <Text style={[styles.note, { color: colors.mutedForeground }]}>Customers are waiting. Choose a plan to reopen your shop.</Text>
            {event?.choices.map((choice, index) => {
              const { cost, fromSavings } = eventChoiceCost(event.id, index, state.ventureId);
              const canAfford = (fromSavings ? state.savings : state.cash) >= cost;
              const detail = event.id === 'supply-shortage' && index === 0
                ? `Spend ${cost} Biz Bucks to restock from a different shop.` : choice.detail;
              return (
                <MotionPressable key={`${event.id}-${index}`} accessibilityRole="button" accessibilityLabel={`${choice.label}. ${detail}`} accessibilityState={{ disabled: !canAfford }} disabled={!canAfford} testID={`event-choice-${index}`} onPress={() => {
                  const result = resolveBusinessEvent(index);
                  setError(result ? '' : 'That choice is not available. Try one of the free plans.');
                }} style={[styles.choice, { backgroundColor: colors.background, borderColor: colors.border, opacity: canAfford ? 1 : 0.5 }]}>
                  <View style={styles.copy}>
                    <Text style={[styles.choiceTitle, { color: colors.foreground }]}>{choice.label}</Text>
                    <Text style={[styles.detail, { color: colors.mutedForeground }]}>{detail}</Text>
                    {!canAfford ? <Text style={[styles.detail, { color: colors.destructive }]}>Not enough {fromSavings ? 'savings' : 'Biz Bucks'}</Text> : null}
                  </View>
                  <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                </MotionPressable>
              );
            })}
            {error ? <Text accessibilityLiveRegion="polite" style={[styles.detail, { color: colors.destructive }]}>{error}</Text> : null}
          </ScrollView>
        </Reveal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 440, maxHeight: '90%', borderRadius: 24, overflow: 'hidden' },
  content: { padding: 22, gap: 13 },
  icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  status: { fontSize: 10, fontWeight: '900' },
  title: { fontSize: 24, lineHeight: 29, fontWeight: '900' },
  story: { fontSize: 14, lineHeight: 21 },
  note: { fontSize: 12, lineHeight: 18 },
  choice: { minHeight: 78, borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  copy: { flex: 1, gap: 5 },
  choiceTitle: { fontSize: 13, fontWeight: '900' },
  detail: { fontSize: 12, lineHeight: 17 },
});