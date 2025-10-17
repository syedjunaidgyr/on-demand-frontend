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
  requiredRole: 'DOCTOR' | 'NURSE';
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
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
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
  firstName: string;
  lastName: string;
  role: 'DOCTOR' | 'NURSE';
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
