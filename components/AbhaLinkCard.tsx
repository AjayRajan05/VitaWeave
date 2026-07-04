import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../app/_constants/theme';

type Props = {
  abhaId?: string | null;
  verified?: boolean;
};

/**
 * ABHA M1 placeholder — full M2/M3 HIP/HIU integration deferred per roadmap.
 */
export function AbhaLinkCard({ abhaId, verified }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>ABHA HEALTH ID</Text>
      {abhaId ? (
        <>
          <Text style={styles.id}>{abhaId}</Text>
          <Text style={styles.status}>{verified ? 'Verified' : 'Pending verification'}</Text>
        </>
      ) : (
        <Text style={styles.placeholder}>
          Not linked yet. ABHA M2/M3 integration is planned for a future release.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { fontFamily: Fonts.medium, fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5 },
  id: { fontFamily: Fonts.semiBold, fontSize: 16, color: Colors.textPrimary, marginTop: 6 },
  status: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  placeholder: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, marginTop: 6, lineHeight: 18 },
});
