export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'DOCTOR' | 'NURSE' | 'HR' | 'ADMIN';
  department: string;
  location: string;
  specialization?: string;
  licenseNumber?: string;
  phone: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  profilePicture?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  department: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  shiftType: 'DAY' | 'NIGHT' | 'ROTATING';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  requirements: string[];
  benefits: string[];
  hourlyRate: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobAssignment {
  id: string;
  jobId: string;
  job?: Job;
  providerId: string;
  provider?: User;
  user?: User;
  status: 'PENDING' | 'ASSIGNED' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assignedAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  isCheckedIn: boolean;
  checkInId?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface CheckIn {
  id: string;
  jobAssignmentId: string;
  providerId: string;
  checkInTime: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  notes?: string;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface CheckOut {
  id: string;
  checkInId: string;
  jobAssignmentId: string;
  providerId: string;
  checkOutTime: string;
  notes?: string;
  hoursWorked: number;
}

// QR Code related interfaces
export interface QRCodeData {
  assignmentId: string;
  providerId: string;
  location: string;
  timestamp: string;
  action: 'checkin' | 'checkout';
  jobTitle?: string;
  providerName?: string;
}

export interface QRCodeDisplayProps {
  assignment: JobAssignment;
  action: 'checkin' | 'checkout';
}