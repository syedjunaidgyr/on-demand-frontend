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
    await this.api.delete(`/hospital-admin/themes/${themeId}`);
  }
}

export default new HospitalAdminApiService();


