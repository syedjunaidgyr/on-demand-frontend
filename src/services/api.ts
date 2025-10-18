import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Job,
  JobAssignment,
  CheckIn,
  CheckOut,
  ApiResponse,
  PaginatedResponse,
} from '../types';

import { getFinalApiUrl } from '../config/api';

// Global logout handler - will be set by the auth context
let globalLogoutHandler: (() => Promise<void>) | null = null;

export const setGlobalLogoutHandler = (handler: () => Promise<void>) => {
  globalLogoutHandler = handler;
};

const BASE_URL = getFinalApiUrl();

class ApiService {
  private api: AxiosInstance;
  staffCheckIn: any;
  post: any;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('jwt_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear storage and trigger global logout
          await AsyncStorage.multiRemove(['jwt_token', 'user_data', 'user_role']);
          
          // Trigger global logout handler if available
          if (globalLogoutHandler) {
            try {
              await globalLogoutHandler();
            } catch (logoutError) {
              console.error('Global logout handler failed:', logoutError);
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting login to:', `${BASE_URL}/auth/login`);
      console.log('📧 Email:', credentials.email);
      
      const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
      
      console.log('✅ Login successful:', response.data);
      await AsyncStorage.setItem('jwt_token', response.data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
      await AsyncStorage.setItem('user_role', response.data.user.role);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', userData);
    await AsyncStorage.setItem('jwt_token', response.data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response: AxiosResponse<{ user: User }> = await this.api.get('/auth/profile');
    return response.data.user;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response: AxiosResponse<User> = await this.api.put('/auth/profile', userData);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  async logout(): Promise<void> {
    try {
      // Try to call the logout endpoint, but don't fail if it returns 401
      await this.api.post('/auth/logout');
    } catch (error: any) {
      // If logout API call fails (e.g., token expired), that's okay
      // We still want to clear local storage
      console.log('Logout API call failed, but continuing with local cleanup:', error.message);
    }
    
    // Always clear local storage regardless of API call result
    await AsyncStorage.multiRemove(['jwt_token', 'user_data', 'user_role']);
  }

  async refreshToken(): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/refresh');
    await AsyncStorage.setItem('jwt_token', response.data.token);
    return response.data;
  }

  // HR endpoints
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PaginatedResponse<User>> {
    const response: AxiosResponse<PaginatedResponse<User>> = await this.api.get('/hr/users', {
      params,
    });
    return response.data;
  }

  async getUserById(userId: string): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get(`/hr/users/${userId}`);
    return response.data;
  }

  async createJob(jobData: Partial<Job>): Promise<Job> {
    const response: AxiosResponse<Job> = await this.api.post('/hr/jobs', jobData);
    return response.data;
  }

  async getAllJobs(params?: {
    page?: number;
    limit?: number;
    department?: string;
    location?: string;
    requiredRole?: string;
    status?: string;
    priority?: string;
  }): Promise<PaginatedResponse<Job>> {
    const response: AxiosResponse<PaginatedResponse<Job>> = await this.api.get('/hr/jobs', {
      params,
    });
    return response.data;
  }


  async getJobDetailsForProvider(jobId: string): Promise<Job> {
    const response: AxiosResponse<Job> = await this.api.get(`/doctor/jobs/${jobId}`);
    return response.data;
  }

  async updateJob(jobId: string, jobData: Partial<Job>): Promise<Job> {
    const response: AxiosResponse<Job> = await this.api.put(`/hr/jobs/${jobId}`, jobData);
    return response.data;
  }

  async cancelJob(jobId: string, reason: string): Promise<void> {
    await this.api.patch(`/hr/jobs/${jobId}/cancel`, { reason });
  }

  async assignJob(jobId: string, userId: string, hourlyRate: number, notes?: string): Promise<JobAssignment> {
    const response: AxiosResponse<JobAssignment> = await this.api.post(`/hr/jobs/${jobId}/assign`, {
      userId,
      hourlyRate,
      notes,
    });
    return response.data;
  }

  async getJobAssignments(jobId: string): Promise<JobAssignment[]> {
    const response: AxiosResponse<JobAssignment[]> = await this.api.get(`/hr/jobs/${jobId}/assignments`);
    return response.data;
  }

  async getJobStatusSummary(jobId: string): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/hr/jobs/${jobId}/status`);
    return response.data;
  }

  async getHRDashboard(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/hr/dashboard');
    return response.data;
  }

  // Doctor endpoints
  async getAvailableJobs(params?: {
    page?: number;
    limit?: number;
    department?: string;
    location?: string;
    specialization?: string;
    minRate?: number;
    maxRate?: number;
  }): Promise<PaginatedResponse<Job>> {
    const response: AxiosResponse<any> = await this.api.get('/staff/jobs/available', {
      params,
    });
    
    // Transform the API response to match PaginatedResponse format
    const jobs = (response.data.jobs || []).map((job: any) => ({
      ...job,
      hourlyRate: typeof job.hourlyRate === 'string' ? parseFloat(job.hourlyRate) : job.hourlyRate,
    }));
    
    return {
      data: jobs,
      pagination: {
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.pages || 1,
      }
    };
  }

  async getUpcomingJobs(): Promise<Job[]> {
    const response: AxiosResponse<any> = await this.api.get('/staff/assignments/active');
    // Handle different response formats: array, { jobs: [...] }, or { upcomingJobs: [...] }
    const jobs = Array.isArray(response.data) 
      ? response.data 
      : (response.data.upcomingJobs || response.data.jobs || response.data.assignments || []);
    
    return jobs.map((job: any) => ({
      ...job,
      hourlyRate: typeof job.hourlyRate === 'string' ? parseFloat(job.hourlyRate) : job.hourlyRate,
    }));
  }

  async getMyAssignments(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<JobAssignment>> {
    const response: AxiosResponse<any> = await this.api.get('/staff/assignments', {
      params,
    });
    
    // Handle different response formats
    if (response.data.assignments) {
      // Format: { assignments: [...], pagination: {...} }
      return {
        data: response.data.assignments,
        pagination: response.data.pagination || { total: response.data.assignments.length, page: 1, limit: 10, totalPages: 1 }
      };
    } else if (response.data.data) {
      // Format: { data: [...], pagination: {...} }
      return response.data;
    } else if (Array.isArray(response.data)) {
      // Format: [...]
      return {
        data: response.data,
        pagination: { total: response.data.length, page: 1, limit: 10, totalPages: 1 }
      };
    } else {
      // Fallback
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };
    }
  }

  async respondToAssignment(assignmentId: string, action: 'ACCEPT' | 'REJECT', rejectionReason?: string): Promise<void> {
    console.log('🔧 Responding to assignment:', assignmentId, 'with action:', action);
    
    const requestBody: any = { action };
    if (action === 'REJECT' && rejectionReason) {
      requestBody.rejectionReason = rejectionReason;
    }
    
    console.log('📤 Request body:', requestBody);
    
    try {
      const response = await this.api.post(`/staff/assignments/${assignmentId}/respond`, requestBody);
      console.log('✅ Assignment response successful:', response.data);
    } catch (error) {
      console.error('❌ Assignment response failed:', error);
      console.error('❌ Error response:', error.response?.data);
      throw error;
    }
  }

  async checkIn(jobAssignmentId: string, location: { latitude: number; longitude: number; address: string }, notes?: string): Promise<CheckIn> {
    const response: AxiosResponse<CheckIn> = await this.api.post('/staff/check-in', {
      jobAssignmentId,
      location,
      notes,
    });
    return response.data;
  }

  async staffCheckIn(checkInData: { jobAssignmentId: string; location: any; notes?: string }): Promise<CheckIn> {
    console.log('🔧 staffCheckIn called with:', checkInData);
    return this.checkIn(checkInData.jobAssignmentId, checkInData.location, checkInData.notes);
  }

  async checkOut(jobAssignmentId: string, location: { latitude: number; longitude: number; address: string }, notes?: string): Promise<CheckOut> {
    const response: AxiosResponse<CheckOut> = await this.api.post('/staff/check-out', {
      jobAssignmentId,
      location,
      notes,
    });
    return response.data;
  }

  async staffCheckOut(checkOutData: { jobAssignmentId: string; location: any; notes?: string }): Promise<CheckOut> {
    console.log('🔧 staffCheckOut called with:', checkOutData);
    return this.checkOut(checkOutData.jobAssignmentId, checkOutData.location, checkOutData.notes);
  }

  async getCheckInStatus(jobAssignmentId: string): Promise<{ isCheckedIn: boolean; checkInId: string | null; checkInTime: string | null }> {
    try {
      const response = await this.api.get(`/staff/check-in-status/${jobAssignmentId}`);
      return response.data;
    } catch (error) {
      console.log('Could not get check-in status:', error);
      // Return default status if endpoint doesn't exist or fails
      return {
        isCheckedIn: false,
        checkInId: null,
        checkInTime: null
      };
    }
  }

  async getMyWorkStatus(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/staff/status');
    return response.data;
  }

  async requestJobExtension(assignmentId: string, reason: string, requestedHours: number): Promise<void> {
    await this.api.post(`/staff/assignments/${assignmentId}/request-extension`, {
      reason,
      requestedHours,
    });
  }

  // Nurse endpoints (similar to doctor endpoints)
  async getNurseAvailableJobs(params?: {
    page?: number;
    limit?: number;
    department?: string;
    location?: string;
    minRate?: number;
    maxRate?: number;
  }): Promise<PaginatedResponse<Job>> {
    // Use the same staff endpoint as doctors
    return this.getAvailableJobs(params);
  }

  async getNurseUpcomingJobs(): Promise<Job[]> {
    // Use the same staff endpoint as doctors
    return this.getUpcomingJobs();
  }

  async getNurseAssignments(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<JobAssignment>> {
    // Use the same staff endpoint as doctors
    return this.getMyAssignments(params);
  }

  async respondToNurseAssignment(assignmentId: string, action: 'ACCEPT' | 'REJECT', rejectionReason?: string): Promise<void> {
    // Use the same staff endpoint as doctors
    return this.respondToAssignment(assignmentId, action, rejectionReason);
  }

  async doctorCheckIn(jobAssignmentId: string, location: { latitude: number; longitude: number; address: string }, notes?: string): Promise<CheckIn> {
    // Use the same staff endpoint as nurses
    return this.checkIn(jobAssignmentId, location, notes);
  }

  async nurseCheckIn(jobAssignmentId: string, location: { latitude: number; longitude: number; address: string }, notes?: string): Promise<CheckIn> {
    // Use the same staff endpoint as doctors
    return this.checkIn(jobAssignmentId, location, notes);
  }

  async doctorCheckOut(jobAssignmentId: string, location: { latitude: number; longitude: number; address: string }, notes?: string): Promise<CheckOut> {
    // Use the same staff endpoint as nurses
    return this.checkOut(jobAssignmentId, location, notes);
  }

  async nurseCheckOut(jobAssignmentId: string, location: { latitude: number; longitude: number; address: string }, notes?: string): Promise<CheckOut> {
    // Use the same staff endpoint as doctors
    return this.checkOut(jobAssignmentId, location, notes);
  }

  async getNurseWorkStatus(): Promise<any> {
    // Use the same staff endpoint as doctors
    return this.getMyWorkStatus();
  }

  async requestNurseJobExtension(assignmentId: string, reason: string, requestedHours: number): Promise<void> {
    // Use the same staff endpoint as doctors
    return this.requestJobExtension(assignmentId, reason, requestedHours);
  }

  // Job application methods (placeholder - may need to be implemented based on actual API)
  async applyForDoctorJob(jobId: string): Promise<void> {
    throw new Error('Job application feature not yet implemented. Please contact HR directly.');
  }

  async applyForNurseJob(jobId: string): Promise<void> {
    throw new Error('Job application feature not yet implemented. Please contact HR directly.');
  }

  // General job endpoints
  async searchJobs(params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    location?: string;
    requiredRole?: string;
    minRate?: number;
    maxRate?: number;
  }): Promise<PaginatedResponse<Job>> {
    const response: AxiosResponse<any> = await this.api.get('/jobs/search', {
      params,
    });
    // Transform the API response to match PaginatedResponse format
    const jobs = (response.data.jobs || []).map((job: any) => ({
      ...job,
      hourlyRate: typeof job.hourlyRate === 'string' ? parseFloat(job.hourlyRate) : job.hourlyRate,
    }));
    
    return {
      data: jobs,
      pagination: {
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        total: response.data.pagination?.total || 0,
        totalPages: response.data.pagination?.pages || 1,
      }
    };
  }

  async getJobCategories(): Promise<{
    departments: string[];
    locations: string[];
    specializations: string[];
  }> {
    const response: AxiosResponse<any> = await this.api.get('/jobs/categories');
    return response.data;
  }

  async getDepartments(): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.api.get('/jobs/categories/departments');
    return response.data;
  }

  async getLocations(): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.api.get('/jobs/categories/locations');
    return response.data;
  }

  async getSpecializations(): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.api.get('/jobs/categories/specializations');
    return response.data;
  }

  async getUrgentJobs(): Promise<Job[]> {
    const response: AxiosResponse<any> = await this.api.get('/jobs/featured/urgent');
    const jobs = Array.isArray(response.data) ? response.data : (response.data.jobs || []);
    return jobs.map((job: any) => ({
      ...job,
      hourlyRate: typeof job.hourlyRate === 'string' ? parseFloat(job.hourlyRate) : job.hourlyRate,
    }));
  }

  async getRecentJobs(): Promise<Job[]> {
    const response: AxiosResponse<any> = await this.api.get('/jobs/featured/recent');
    const jobs = Array.isArray(response.data) ? response.data : (response.data.jobs || []);
    return jobs.map((job: any) => ({
      ...job,
      hourlyRate: typeof job.hourlyRate === 'string' ? parseFloat(job.hourlyRate) : job.hourlyRate,
    }));
  }

  async getJobStatistics(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/jobs/stats/overview');
    return response.data;
  }

  // Public endpoints
  async getHospitals(): Promise<{ hospitals: Array<{ id: number; name: string; code: string; isActive: boolean }> }> {
    try {
      console.log('🏥 Fetching hospitals from:', `${BASE_URL}/public/hospitals`);
      console.log('🌐 Full URL being called:', `${BASE_URL}/public/hospitals`);
      console.log('📡 Network info - Base URL:', BASE_URL);
      
      const response: AxiosResponse<{ hospitals: Array<{ id: number; name: string; code: string; isActive: boolean }> }> = 
        await this.api.get('/public/hospitals');
      
      console.log('✅ Hospitals fetched successfully:', response.data);
      console.log('📊 Number of hospitals:', response.data.hospitals?.length || 0);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch hospitals:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw error;
    }
  }

  async getHospitalUnits(hospitalId: number): Promise<{ units: Array<{ unitCode: string; unitName: string; isActive: boolean }> }> {
    try {
      console.log('🏥 Fetching units for hospital ID:', hospitalId);
      console.log('🌐 Full URL being called:', `${BASE_URL}/public/hospitals/${hospitalId}/units`);
      console.log('📡 Network info - Base URL:', BASE_URL);
      
      const response: AxiosResponse<{ units: Array<{ unitCode: string; unitName: string; isActive: boolean }> }> = 
        await this.api.get(`/public/hospitals/${hospitalId}/units`);
      
      console.log('🔍 RAW API RESPONSE:', JSON.stringify(response.data, null, 2));
      console.log('🔍 Response structure:', {
        hasUnits: 'units' in response.data,
        unitsCount: response.data.units?.length || 0,
        responseType: typeof response.data
      });
      
      console.log('✅ Units fetched successfully for hospital', hospitalId, ':', response.data);
      console.log('📊 Number of units found:', response.data.units?.length || 0);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch units for hospital', hospitalId, ':', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        hospitalId: hospitalId
      });
      throw error;
    }
  }

  // Health check - using a simple endpoint that exists
  async healthCheck(): Promise<any> {
    try {
      console.log('🏥 Health check to:', `${BASE_URL}/auth/login`);
      // Use a simple HEAD request to test connection without actually logging in
      const response: AxiosResponse<any> = await this.api.head('/auth/login');
      console.log('✅ Health check successful - server is reachable');
      return { status: 'ok', message: 'Server is reachable' };
    } catch (error: any) {
      // If we get a 405 (Method Not Allowed) or 400 (Bad Request), the server is reachable
      if (error.response?.status === 405 || error.response?.status === 400) {
        console.log('✅ Health check successful - server is reachable (method not allowed is expected)');
        return { status: 'ok', message: 'Server is reachable' };
      }
      console.error('❌ Health check failed:', error.response?.data || error.message);
      throw error;
    }
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  // Check if user has a valid token
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      return !!token;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  // HR Assignment APIs
  async getCompatibleStaff(jobId: string): Promise<any> {
    try {
      console.log('🔧 Fetching compatible staff for job:', jobId);
      const response = await this.api.get(`/api/v1/hr/jobs/${jobId}/compatible-staff`);
      console.log('✅ Compatible staff:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch compatible staff:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Job not found.');
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch compatible staff.');
      }
      throw new Error('Network error. Please try again.');
    }
  }

  async assignJobToStaff(jobId: string, staffId: string): Promise<void> {
    try {
      console.log('🔧 Assigning job:', jobId, 'to staff:', staffId);
      const response = await this.api.post(`/api/v1/hr/jobs/${jobId}/assign`, {
        staffId: staffId,
        assignedAt: new Date().toISOString()
      });
      console.log('✅ Job assigned successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to assign job:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Job or staff member not found.');
        } else if (error.response?.status === 409) {
          throw new Error('Job has already been assigned.');
        } else if (error.response?.status === 400) {
          throw new Error('Staff member is not compatible with this job.');
        }
        throw new Error(error.response?.data?.message || 'Failed to assign job.');
      }
      throw new Error('Network error. Please try again.');
    }
  }

  // Staff Assignment APIs - Using REAL backend endpoints only
  async getAssignments(params: any = {}): Promise<any[]> {
    try {
      console.log('🔧 ========== FETCHING JOB ASSIGNMENTS ==========');
      console.log('🌐 Base URL:', this.api.defaults.baseURL);
      console.log('🔑 Auth Token:', this.api.defaults.headers.Authorization ? 'Present' : 'Missing');
      console.log('📋 Parameters:', params);
      
      const fullUrl = `${this.api.defaults.baseURL}/api/v1/staff/assignments`;
      console.log(`🌐 Full URL: ${fullUrl}`);
      
      const response = await this.api.get('/api/v1/staff/assignments', { params });
      
      console.log('✅ SUCCESS! Assignments loaded from backend');
      console.log('📊 Response status:', response.status);
      console.log('📦 Response data:', JSON.stringify(response.data, null, 2));
      
      // Return assignments from the response
      return response.data.assignments || [];
      
    } catch (error: any) {
      console.error('❌ Failed to fetch assignments:', error);
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.message);
      console.log('   Response:', error.response?.data);
      throw new Error('Failed to fetch your job assignments. Please try again.');
    }
  }

  async loadAssignmentsFallback(): Promise<any[]> {
    try {
      console.log('🔄 Loading assignments fallback...');
      
      // Get user profile to determine role
      const userData = await this.getProfile();
      
      // Try to get available jobs based on role
      let availableJobs;
      if (userData.role === 'DOCTOR') {
        availableJobs = await this.getAvailableJobs();
      } else if (userData.role === 'NURSE') {
        availableJobs = await this.getNurseAvailableJobs();
      } else {
        availableJobs = await this.getAvailableJobs();
      }
      
      const jobs = availableJobs.data || availableJobs || [];
      
      // Convert jobs to assignment format
      const assignments = jobs.map(job => ({
        id: `assignment-${job.id}`, // Simulated assignment ID
        job: job,
        status: 'PENDING',
        assignedAt: new Date().toISOString(),
        isSimulated: true // Flag to indicate this is a fallback assignment
      }));
      
      console.log('✅ Fallback assignments created:', assignments.length);
      return assignments;
      
    } catch (error) {
      console.error('❌ Fallback failed:', error);
      return [];
    }
  }

  async getJobById(jobId: string): Promise<any> {
    try {
      console.log('🔧 Fetching job details:', jobId);
      
      // Try HR endpoint first
      try {
        const response = await this.api.get(`/hr/jobs/${jobId}`);
        console.log('✅ Job details from HR endpoint:', response.data);
        return response.data;
      } catch (hrError) {
        console.log('HR endpoint failed, trying staff endpoints...');
      }
      
      // Try staff endpoints
      try {
        const response = await this.api.get(`/staff/jobs/${jobId}`);
        console.log('✅ Job details from staff endpoint:', response.data);
        return response.data;
      } catch (staffError) {
        console.log('Staff endpoint failed, trying doctor endpoint...');
      }
      
      // Try doctor endpoint
      try {
        const response = await this.api.get(`/doctor/jobs/${jobId}`);
        console.log('✅ Job details from doctor endpoint:', response.data);
        return response.data;
      } catch (doctorError) {
        console.log('Doctor endpoint failed, trying nurse endpoint...');
      }
      
      // Try nurse endpoint
      try {
        const response = await this.api.get(`/nurse/jobs/${jobId}`);
        console.log('✅ Job details from nurse endpoint:', response.data);
        return response.data;
      } catch (nurseError) {
        console.log('All endpoints failed');
        throw new Error('Job not found in any available endpoints');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch job details:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Job not found.');
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch job details.');
      }
      throw new Error('Network error. Please try again.');
    }
  }

  // HR APIs for managing accepted assignments
  async getAcceptedAssignments(jobId: string): Promise<any[]> {
    console.log('🔍 Getting accepted assignments for jobId:', jobId);
    console.log('🔗 API endpoint:', `/hr/jobs/${jobId}/accepted-assignments`);
    
    try {
      const response = await this.api.get(`/hr/jobs/${jobId}/accepted-assignments`);
      console.log('✅ Accepted assignments response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get accepted assignments:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  }

  async selectCandidate(jobId: string, assignmentId: string): Promise<void> {
    console.log('🔧 Selecting candidate for job:', jobId, 'assignment:', assignmentId);
    console.log('🔗 API endpoint:', `/hr/jobs/${jobId}/select-candidate`);
    
    const requestBody = {
      assignmentId: assignmentId
    };
    console.log('📤 Request body:', requestBody);
    
    try {
      const response = await this.api.post(`/hr/jobs/${jobId}/select-candidate`, requestBody);
      console.log('✅ Select candidate successful:', response.data);
    } catch (error) {
      console.error('❌ Select candidate failed:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  }
}

export default new ApiService();
