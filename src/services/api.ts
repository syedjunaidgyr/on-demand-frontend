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

  async getJobById(jobId: string): Promise<Job> {
    const response: AxiosResponse<Job> = await this.api.get(`/jobs/${jobId}`);
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
    await this.api.post(`/staff/assignments/${assignmentId}/respond`, {
      action,
      rejectionReason,
    });
  }

  async checkIn(jobAssignmentId: string, location: { latitude: number; longitude: number; address: string }, notes?: string): Promise<CheckIn> {
    const response: AxiosResponse<CheckIn> = await this.api.post('/staff/check-in', {
      jobAssignmentId,
      location,
      notes,
    });
    return response.data;
  }

  async checkOut(jobAssignmentId: string, location: { latitude: number; longitude: number; address: string }, notes?: string): Promise<CheckOut> {
    const response: AxiosResponse<CheckOut> = await this.api.post('/staff/check-out', {
      jobAssignmentId,
      location,
      notes,
    });
    return response.data;
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

  async nurseCheckIn(jobAssignmentId: string, location: { latitude: number; longitude: number; address: string }, notes?: string): Promise<CheckIn> {
    // Use the same staff endpoint as doctors
    return this.checkIn(jobAssignmentId, location, notes);
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
}

export default new ApiService();
