export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'DOCTOR' | 'NURSE' | 'HR' | 'ADMIN' | 'AGENCY';
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  facilityName?: string;
  requiredRole: 'DOCTOR' | 'NURSE' | 'AGENCY';
  specialization?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  hourlyRate: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'FILLED';
  maxAssignments: number;
  currentAssignments: number;
  requirements: {
    boardCertified?: boolean;
    experience: string;
    skills: string[];
  };
  benefits: {
    mealAllowance: boolean;
    parking: boolean;
    malpractice: boolean;
  };
  facilityName: string;
  facilityAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactPerson: {
    name: string;
    phone: string;
    email: string;
    position: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobAssignment {
  id: string;
  jobId: string;
  userId: string;
  status: 'PENDING' | 'ASSIGNED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';
  hourlyRate: number;
  notes?: string;
  rejectionReason?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  job?: Job;
  user?: User;
  // Additional properties for check-in/out functionality
  isCheckedIn?: boolean;
  checkInId?: string | null;
  // ✅ New fields for user tracking
  checkedInBy?: any; // User who checked in
  checkedOutBy?: any; // User who checked out
  jobContext?: {
    facilityName: string;
    location: string;
    department: string;
    specialization?: string;
  };
}

export interface CheckIn {
  id: string;
  jobAssignmentId: string;
  checkInTime: string;
  checkInLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  notes?: string;
  createdAt: string;
  jobContext?: {
    facilityName: string;
    location: string;
    department: string;
    specialization?: string;
  };
}

export interface CheckOut {
  id: string;
  checkInId: string;
  checkOutTime: string;
  checkOutLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  notes?: string;
  createdAt: string;
  jobContext?: {
    facilityName: string;
    location: string;
    department: string;
    specialization?: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'DOCTOR' | 'NURSE';
  department: string;
  location: string;
  specialization?: string;
  licenseNumber?: string;
  phone: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  hospitalId?: number;
  unitCode?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QRCodeData {
  assignmentId: string;
  providerId: string;
  location: string;
  timestamp: string;
  action: 'checkin' | 'checkout';
  jobTitle?: string;
  providerName?: string;
}

// ✅ User information interface for check-in/check-out responses
export interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'DOCTOR' | 'NURSE' | 'HR' | 'ADMIN';
  department: string;
}

// Notification interface
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'assignment' | 'job';
  isRead: boolean;
  createdAt: string;
  relatedId?: string; // Related job/assignment ID
}