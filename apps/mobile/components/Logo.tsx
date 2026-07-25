import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconDimension = isSm ? 32 : isLg ? 56 : 42;
  const fontSize = isSm ? 16 : isLg ? 28 : 22;

  return (
    <View style={styles.container}>
      {/* Icon Tile */}
      <View
        style={[
          styles.iconTile,
          { width: iconDimension, height: iconDimension, borderRadius: iconDimension * 0.3 },
        ]}
      >
        <View style={styles.roofShape} />
        <View style={styles.barsRow}>
          <View style={[styles.bar, { height: '50%', backgroundColor: '#38BDF8' }]} />
          <View style={[styles.bar, { height: '75%', backgroundColor: '#A855F7' }]} />
          <View style={[styles.bar, { height: '100%', backgroundColor: '#34D399' }]} />
        </View>
        <View style={styles.sparkDot} />
      </View>

      {/* Brand Text */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.brandText, { fontSize }]}>
            Hogar<Text style={styles.iqText}>IQ</Text>
          </Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconTile: {
    backgroundColor: '#1E1B4B',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  roofShape: {
    position: 'absolute',
    top: 6,
    width: '75%',
    height: 3,
    backgroundColor: '#A855F7',
    borderRadius: 2,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: '60%',
    marginTop: 8,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
  sparkDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  iqText: {
    color: '#C084FC',
  },
  aiBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
