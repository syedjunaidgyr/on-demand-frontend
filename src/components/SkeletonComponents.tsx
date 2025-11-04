import React from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import useShimmer from '../hooks/useShimmer';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius } from '../constants/spacing';
import Responsive from '../utils/responsive';

// Premium shimmer skeleton view component
const SkeletonView = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  baseColor = '#E0E0E0',
  highlightColor = 'rgba(255,255,255,0.7)',
  style,
}: {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  baseColor?: string;
  highlightColor?: string;
  style?: any;
}) => {
  // Calculate width for animation - use a larger value for smooth shimmer
  const widthValue = typeof width === 'string' 
    ? (width.includes('%') ? 400 : parseInt(width) || 400)
    : width || 400;
  
  // Use larger range for smoother animation
  const shimmerWidth = widthValue * 1.5;
  const translateX = useShimmer(1500, shimmerWidth);

  const containerStyle = {
    width: width as any,
    height,
    borderRadius,
    overflow: 'hidden' as const,
    backgroundColor: baseColor,
  };

  const maskStyle = {
    backgroundColor: 'black' as const,
    width: width as any,
    height,
    borderRadius,
  };

  return (
    <View style={[containerStyle, style]}>
      <MaskedView
        style={{ width: width as any, height }}
        maskElement={
          <View style={maskStyle} />
        }
      >
        {/* Base background - exact size to prevent any gaps */}
        <View 
          style={{
            backgroundColor: baseColor,
            width: typeof width === 'number' ? width : shimmerWidth,
            height,
          }} 
        />
        {/* Animated shimmer gradient - properly positioned */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -2,
            left: -shimmerWidth / 2,
            width: shimmerWidth,
            height: height + 4,
            transform: [{ translateX }],
          }}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['transparent', highlightColor, 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: shimmerWidth, height: height + 4 }}
          />
        </Animated.View>
      </MaskedView>
    </View>
  );
};

export const SkeletonTitle = ({ width = 150, height = 16, style }: { width?: number | string; height?: number; style?: any }) => (
  <SkeletonView width={width} height={height} borderRadius={4} style={style} />
);

export const SkeletonHeader = () => (
  <View style={styles.skeletonHeaderContainer}>
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {/* Title skeleton */}
        <SkeletonView width={100} height={14} style={{ marginBottom: 6 }} />
        {/* Subtitle skeleton */}
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
        {/* Title skeleton */}
        <SkeletonView width="50%" height={28} style={{ marginBottom: 6 }} />
        {/* Subtitle skeleton */}
        <SkeletonView width="70%" height={14} />
      </View>
    </View>
  </View>
);

export const SkeletonListCard = () => (
  <View style={styles.skeletonListCardWrapper}>
    <View style={styles.listCard}>
      <View style={styles.listTopRow}>
        {/* Time skeleton */}
        <SkeletonView width={120} height={12} />
        <SkeletonView width={16} height={16} borderRadius={8} />
      </View>
      <View style={styles.listDivider} />
      <View style={styles.listContentRow}>
        <SkeletonView width={44} height={44} borderRadius={22} style={{ marginRight: Spacing.sm }} />
        <View style={styles.listContent}>
          {/* Title skeleton */}
          <SkeletonView width="70%" height={18} style={{ marginBottom: 6 }} />
          {/* Subtitle skeleton */}
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
      {/* Search input skeleton */}
      <SkeletonView width="100%" height={20} style={{ flex: 1 }} />
    </View>
  </View>
);

export const SkeletonQuickAction = () => (
  <View style={styles.skeletonQuickActionWrapper}>
    <View style={styles.quickAction}>
      <SkeletonView width={56} height={56} borderRadius={28} style={{ marginBottom: Spacing.md }} />
      {/* Title skeleton */}
      <SkeletonView width="80%" height={18} style={{ marginBottom: 8 }} />
      {/* Subtitle skeleton */}
      <SkeletonView width="60%" height={14} />
    </View>
  </View>
);

export const SkeletonJobCard = () => (
  <View style={styles.skeletonJobCardWrapper}>
    <View style={styles.jobCard}>
      <View style={styles.jobTopRow}>
        {/* Time skeleton */}
        <SkeletonView width={120} height={12} />
        {/* Status badge skeleton */}
        <SkeletonView width={80} height={20} borderRadius={10} />
      </View>
      <View style={styles.jobDivider} />
      <View style={styles.jobContentRow}>
        <SkeletonView width={44} height={44} borderRadius={22} style={{ marginRight: Spacing.sm }} />
        <View style={styles.jobContent}>
          {/* Title skeleton */}
          <SkeletonView width="90%" height={20} style={{ marginBottom: 6 }} />
          {/* Subtitle skeleton */}
          <SkeletonView width="95%" height={14} style={{ marginBottom: 8 }} />
          <View style={styles.jobInfoRow}>
            <SkeletonView width="28%" height={30} style={{ marginRight: 12 }} />
            <SkeletonView width="28%" height={30} style={{ marginRight: 12 }} />
            <SkeletonView width="28%" height={30} />
          </View>
          {/* Priority badge skeleton */}
          <SkeletonView width={100} height={22} borderRadius={12} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  </View>
);

export const SkeletonUserCard = () => (
  <View style={styles.skeletonUserCardWrapper}>
    <View style={styles.userCard}>
      <View style={styles.userTopRow}>
        {/* Time skeleton */}
        <SkeletonView width={120} height={12} />
        <SkeletonView width={16} height={16} borderRadius={8} />
      </View>
      <View style={styles.userDivider} />
      <View style={styles.userRow}>
        <SkeletonView width={44} height={44} borderRadius={22} style={{ marginRight: Spacing.sm }} />
        <View style={styles.userContent}>
          {/* Title skeleton */}
          <SkeletonView width="60%" height={18} style={{ marginBottom: 6 }} />
          {/* Subtitle skeleton */}
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

export const SkeletonFooter = () => (
  <View style={styles.skeletonFooterContainer}>
    <View style={styles.footerWrapper}>
      <View style={styles.footerRow}>
        {/* Three footer buttons */}
        <View style={styles.footerButton}>
          <SkeletonView width={24} height={24} borderRadius={12} style={{ marginBottom: 4 }} />
          <SkeletonView width={50} height={10} borderRadius={5} />
        </View>
        <View style={styles.footerButton}>
          <SkeletonView width={24} height={24} borderRadius={12} style={{ marginBottom: 4 }} />
          <SkeletonView width={50} height={10} borderRadius={5} />
        </View>
        <View style={styles.footerButton}>
          <SkeletonView width={24} height={24} borderRadius={12} style={{ marginBottom: 4 }} />
          <SkeletonView width={50} height={10} borderRadius={5} />
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
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  jobTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  jobDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: Spacing.xs,
  },
  jobContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  jobContent: {
    flex: 1,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  jobDetails: {
    marginBottom: Spacing.md,
  },
  jobInfoRow: {
    flexDirection: 'row',
    marginTop: 6,
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
  // Footer styles
  skeletonFooterContainer: {
    position: 'absolute',
    bottom: Responsive.verticalScale(-60),
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  footerWrapper: {
    backgroundColor: '#1C2A3A',
    width: '100%',
    paddingBottom: Responsive.verticalScale(50),
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#1C2A3A',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: Responsive.verticalScale(4),
    paddingBottom: Responsive.verticalScale(10),
    paddingHorizontal: Responsive.scale(10),
    minHeight: Responsive.verticalScale(50),
  },
  footerButton: {
    padding: Responsive.scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});
