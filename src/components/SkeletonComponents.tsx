import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius } from '../constants/spacing';

// Simple shimmer animation
const useShimmer = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return opacity;
};

const SkeletonView = ({ width, height, borderRadius = 4, style }: any) => {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E0E0E0',
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonHeader = () => (
  <View style={styles.skeletonHeaderContainer}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <SkeletonView width={100} height={14} style={{ marginBottom: 6 }} />
        <SkeletonView width={150} height={24} />
      </View>
      <View style={styles.headerRight}>
        <SkeletonView width={40} height={40} borderRadius={20} />
        <SkeletonView width={40} height={40} borderRadius={20} style={{ marginLeft: 8 }} />
      </View>
    </View>
  </View>
);

export const SkeletonStatCard = () => (
  <View style={styles.skeletonStatCardWrapper}>
    <View style={styles.statCard}>
      <SkeletonView width={48} height={48} borderRadius={12} style={{ marginRight: Spacing.md }} />
      <View style={styles.statContent}>
        <SkeletonView width="50%" height={28} style={{ marginBottom: 6 }} />
        <SkeletonView width="70%" height={14} />
      </View>
    </View>
  </View>
);

export const SkeletonListCard = () => (
  <View style={styles.skeletonListCardWrapper}>
    <View style={styles.listCard}>
      <View style={styles.listTopRow}>
        <SkeletonView width={120} height={12} />
        <SkeletonView width={16} height={16} borderRadius={8} />
      </View>
      <View style={styles.listDivider} />
      <View style={styles.listContentRow}>
        <SkeletonView width={44} height={44} borderRadius={22} style={{ marginRight: Spacing.sm }} />
        <View style={styles.listContent}>
          <SkeletonView width="70%" height={18} style={{ marginBottom: 6 }} />
          <SkeletonView width="85%" height={14} style={{ marginBottom: 8 }} />
          <View style={styles.listInfoRow}>
            <SkeletonView width="30%" height={30} style={{ marginRight: 12 }} />
            <SkeletonView width="30%" height={30} style={{ marginRight: 12 }} />
            <SkeletonView width="30%" height={30} />
          </View>
        </View>
      </View>
    </View>
  </View>
);

export const SkeletonSearchBar = () => (
  <View style={styles.skeletonSearchBarWrapper}>
    <View style={styles.searchBar}>
      <SkeletonView width={18} height={18} borderRadius={9} style={{ marginRight: Spacing.sm }} />
      <SkeletonView width="100%" height={20} style={{ flex: 1 }} />
    </View>
  </View>
);

export const SkeletonQuickAction = () => (
  <View style={styles.skeletonQuickActionWrapper}>
    <View style={styles.quickAction}>
      <SkeletonView width={56} height={56} borderRadius={28} style={{ marginBottom: Spacing.md }} />
      <SkeletonView width="80%" height={18} style={{ marginBottom: 8 }} />
      <SkeletonView width="60%" height={14} />
    </View>
  </View>
);

export const SkeletonJobCard = () => (
  <View style={styles.skeletonJobCardWrapper}>
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <SkeletonView width="70%" height={20} style={{ flex: 1, marginRight: Spacing.sm }} />
        <SkeletonView width={80} height={24} borderRadius={12} />
      </View>
      <SkeletonView width="100%" height={60} style={{ marginBottom: Spacing.md }} />
      <View style={styles.jobDetails}>
        <SkeletonView width="100%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonView width="100%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonView width="100%" height={16} style={{ marginBottom: 8 }} />
      </View>
      <SkeletonView width="100%" height={40} style={{ marginTop: Spacing.md }} />
    </View>
  </View>
);

export const SkeletonUserCard = () => (
  <View style={styles.skeletonUserCardWrapper}>
    <View style={styles.userCard}>
      <View style={styles.userTopRow}>
        <SkeletonView width={120} height={12} />
        <SkeletonView width={16} height={16} borderRadius={8} />
      </View>
      <View style={styles.userDivider} />
      <View style={styles.userRow}>
        <SkeletonView width={44} height={44} borderRadius={22} style={{ marginRight: Spacing.sm }} />
        <View style={styles.userContent}>
          <SkeletonView width="60%" height={18} style={{ marginBottom: 6 }} />
          <SkeletonView width="80%" height={14} style={{ marginBottom: 8 }} />
          <View style={styles.userInfoRow}>
            <SkeletonView width="30%" height={30} style={{ marginRight: 12 }} />
            <SkeletonView width="30%" height={30} style={{ marginRight: 12 }} />
            <SkeletonView width="30%" height={30} />
          </View>
        </View>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  // Header styles
  skeletonHeaderContainer: {
    backgroundColor: Colors.white,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  // Stat card styles
  skeletonStatCardWrapper: {
    flex: 1,
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d3d3d3',
    minHeight: 100,
  },
  statContent: {
    flex: 1,
  },
  // List card styles
  skeletonListCardWrapper: {
    paddingHorizontal: Spacing.md,
  },
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  listTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  listDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: Spacing.xs,
  },
  listContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listContent: {
    flex: 1,
  },
  listInfoRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  // Search bar styles
  skeletonSearchBarWrapper: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  // Quick action styles
  skeletonQuickActionWrapper: {
    width: '48%',
    flexBasis: '48%',
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 8,
  },
  quickAction: {
    width: '100%',
    height: 190,
    borderRadius: 24,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#DADADA',
  },
  // Job card styles
  skeletonJobCardWrapper: {
    paddingHorizontal: Spacing.md,
  },
  jobCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  jobDetails: {
    marginBottom: Spacing.md,
  },
  // User card styles
  skeletonUserCardWrapper: {
    paddingHorizontal: Spacing.sm,
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  userTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  userDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: Spacing.xs,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userContent: {
    flex: 1,
  },
  userInfoRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
});
