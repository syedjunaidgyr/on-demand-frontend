import React, { useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Pdf from 'react-native-pdf';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { useNavigation, useRoute } from '@react-navigation/native';

type PDFViewerParams = {
  uri: string;
  title?: string;
};

const PDFViewerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { uri, title } = (route.params as unknown as PDFViewerParams) || {};
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const source = useMemo(() => ({ uri, cache: true }), [uri]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title || 'PDF'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading && !error && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <Pdf
          source={source}
          trustAllCerts={true}
          onLoadComplete={() => setIsLoading(false)}
          onError={(e) => {
            setError(e?.message || 'Failed to load PDF');
            setIsLoading(false);
          }}
          style={styles.pdf}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: 56,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  backText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  headerSpacer: {
    width: 48,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
  },
  pdf: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default PDFViewerScreen;


