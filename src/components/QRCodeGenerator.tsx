import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Spacing, BorderRadius } from '../constants/spacing';
import { QRCodeData } from '../types';

interface QRCodeGeneratorProps {
  qrData: QRCodeData;
  size?: number;
  showDetails?: boolean;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  qrData,
  size = 200,
  showDetails = true,
}) => {
  const qrString = JSON.stringify(qrData);

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <QRCode
          value={qrString}
          size={size}
          color={Colors.black}
          backgroundColor={Colors.white}
        />
      </View>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{qrData.jobTitle}</Text>
          <Text style={styles.location}>{qrData.location}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  qrContainer: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  detailsContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  location: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  provider: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  action: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
  },
});

export default QRCodeGenerator;
