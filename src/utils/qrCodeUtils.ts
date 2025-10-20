import { QRCodeData, JobAssignment, User } from '../types';

export const generateQRCodeData = (
  assignment: JobAssignment,
  user: User,
  action: 'checkin' | 'checkout'
): QRCodeData => {
  return {
    assignmentId: assignment.id,
    providerId: user.id,
    location: assignment.job?.location || 'Unknown Location',
    timestamp: new Date().toISOString(),
    action,
    jobTitle: assignment.job?.title || 'Assignment',
    providerName: `${user.firstName} ${user.lastName}`,
  };
};

export const formatQRCodeString = (qrData: QRCodeData): string => {
  return JSON.stringify(qrData);
};

export const parseQRCodeString = (qrString: string): QRCodeData | null => {
  try {
    return JSON.parse(qrString);
  } catch (error) {
    console.error('Failed to parse QR code data:', error);
    return null;
  }
};
