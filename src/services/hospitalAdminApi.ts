import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFinalApiUrl } from '../config/api';

const BASE_URL = getFinalApiUrl();

class HospitalAdminApiService {
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
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('jwt_token');
        if (token) {
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async getDashboard(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/hospital-admin/dashboard');
    return response.data;
  }

  async getHospitalDetails(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/hospital-admin/hospital');
    return response.data;
  }

  async updateHospital(data: {
    name?: string;
    code?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    contactInfo?: {
      phone?: string;
      email?: string;
    };
  }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.put('/hospital-admin/hospital', data);
    return response.data;
  }

  async getUsers(params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/hospital-admin/users', { params });
    return response.data;
  }

  async getJobs(params?: { page?: number; limit?: number; search?: string }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/hospital-admin/jobs', { params });
    return response.data;
  }

  async getUnits(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/hospital-admin/units');
    return response.data;
  }

  async uploadLogo(formData: FormData): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/hospital-admin/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getThemes(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/hospital-admin/themes');
    return response.data;
  }

  async setDefaultTheme(themeId: string | number): Promise<any> {
    const response: AxiosResponse<any> = await this.api.put(`/hospital-admin/themes/default/${themeId}`);
    return response.data;
  }

  async createTheme(theme: {
    id?: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentTextColor: string;
  }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/hospital-admin/themes', theme);
    return response.data;
  }

  async updateTheme(themeId: string | number, updates: Partial<{
    name: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentTextColor: string;
  }>): Promise<any> {
    const response: AxiosResponse<any> = await this.api.put(`/hospital-admin/themes/${themeId}`, updates);
    return response.data;
  }

  async deleteTheme(themeId: string | number): Promise<void> {
    try {
      // Debug log for backend tracing
      // eslint-disable-next-line no-console
      console.log('[HospitalAdminApi] DELETE theme ->', `/hospital-admin/themes/${themeId}`);
      await this.api.delete(`/hospital-admin/themes/${themeId}`);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('[HospitalAdminApi] DELETE theme failed', { themeId, error: e?.response?.data || e?.message });
      throw e;
    }
  }

  // Unit Management APIs
  async listUnits(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/hospital-admin/units');
    return response.data;
  }

  async createUnit(data: { unitCode: string; unitName: string }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/hospital-admin/units', data);
    return response.data;
  }

  async updateUnit(unitCode: string, data: Partial<{ unitCode: string; unitName: string; isActive: boolean }>): Promise<any> {
    const response: AxiosResponse<any> = await this.api.put(`/hospital-admin/units/${unitCode}`, data);
    return response.data;
  }

  async deleteUnit(unitCode: string): Promise<void> {
    await this.api.delete(`/hospital-admin/units/${unitCode}`);
  }

  // Agency Blacklisting APIs
  async listBlacklistedAgencies(hospitalId: number, params?: { q?: string; from?: string; to?: string }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/agency/hospitals/${hospitalId}/blacklisted`, { params });
    return response.data;
  }

  async blacklistAgency(agencyId: number, hospitalId: number, data: { reasonCategory: string; reasonDetails: string }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/agency/${agencyId}/hospitals/${hospitalId}/blacklist`, data);
    return response.data;
  }

  async restoreAgency(agencyId: number, hospitalId: number): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/agency/${agencyId}/hospitals/${hospitalId}/restore`);
    return response.data;
  }

  // Agencies → Hospital Linking
  async listUnlinkedAgencies(hospitalId: number): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get(`/agency/hospitals/${hospitalId}/agencies/unlinked`);
    return response.data;
  }

  async linkAgencyToHospital(agencyId: number, hospitalIds: number[]): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/agency/${agencyId}/hospitals`, { hospitalIds });
    return response.data;
  }

  async unlinkAgencyFromHospital(agencyId: number, hospitalId: number): Promise<void> {
    await this.api.delete(`/agency/${agencyId}/hospitals/${hospitalId}`);
  }

  // List all agencies linked to a hospital (approved/blacklisted). If backend differs, adjust path accordingly.
  async listHospitalAgencies(hospitalId: number, params?: { q?: string }): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.api.get(`/agency/hospitals/${hospitalId}/agencies`, { params });
      return response.data;
    } catch (e) {
      // Fallback: return blacklisted list only if generic list endpoint not available
      const fallback = await this.listBlacklistedAgencies(hospitalId, params);
      return { agencies: (fallback.links || []).map((l: any) => ({ ...l.agency, status: l.status, linkId: l.id })) };
    }
  }

  // Agency Registration API
  async registerAgency(data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phone: string;
    companyName?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post('/hospital-admin/agencies/register', data);
    return response.data;
  }

  // Agency Onboarding API
  async onboardAgency(agencyId: number, hospitalId: number, data?: {
    notes?: string;
    terms?: string;
  }): Promise<any> {
    const response: AxiosResponse<any> = await this.api.post(`/hospital-admin/agencies/${agencyId}/hospitals/${hospitalId}/onboard`, data || {});
    return response.data;
  }

  // (deduped methods above)
}

export default new HospitalAdminApiService();


