import { useState, useEffect } from 'react';
import { useAuth } from '../navigation/AppNavigator';
import ApiService from '../services/api';

interface Permission {
  id: number;
  code: string;
  name: string;
  category?: string;
  resource?: string;
  action?: string;
  scope?: string;
  description?: string;
}

interface PermissionGroup {
  global: Permission[];
  hospital: Permission[];
  unit: Permission[];
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PermissionGroup>({
    global: [],
    hospital: [],
    unit: [],
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Load user profile to get hospitalId for Hospital Admin (if not in user object)
        let effectiveHospitalId = user?.hospitalId;
        let effectiveUnitCode = user?.unitCode;

        if (user?.role === 'HOSPITAL_ADMIN' && !effectiveHospitalId) {
          try {
            const profile = await ApiService.getProfile();
            setUserProfile(profile);
            effectiveHospitalId = profile?.hospitalId;
            effectiveUnitCode = profile?.unitCode;
          } catch (profileError) {
            console.error('Failed to load user profile for Hospital Admin:', profileError);
          }
        }

        const params: any = {};
        if (effectiveHospitalId) {
          params.hospitalId = effectiveHospitalId;
        }
        if (effectiveUnitCode) {
          params.unitCode = effectiveUnitCode;
        }
        console.log('[usePermissions] GET /permissions/my-permissions params =', params);
        const res = await ApiService.getMyPermissions(params);
        console.log('[usePermissions] permissions response =', {
          hasGlobal: Array.isArray(res?.permissions?.global) ? res.permissions.global.length : 'n/a',
          hasHospital: Array.isArray(res?.permissions?.hospital) ? res.permissions.hospital.length : 'n/a',
          hasUnit: Array.isArray(res?.permissions?.unit) ? res.permissions.unit.length : 'n/a',
        });
        setPermissions(res.permissions || { global: [], hospital: [], unit: [] });
      } catch (error) {
        console.error('Failed to load permissions:', error);
        // Set empty permissions on error
        setPermissions({ global: [], hospital: [], unit: [] });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      load();
    } else {
      setLoading(false);
    }
  }, [user]);

  /**
   * Check if user has a specific permission
   * @param code - Permission code (e.g., 'JOB_CREATE', 'USER_UPDATE')
   * @returns true if user has the permission at any scope (global, hospital, or unit)
   */
  const hasPermission = (code: string): boolean => {
    const all = [
      ...permissions.global,
      ...permissions.hospital,
      ...permissions.unit,
    ];
    return all.some((p) => p.code === code);
  };

  /**
   * Check if user has any of the specified permissions (OR logic)
   * @param codes - Array of permission codes
   * @returns true if user has at least one of the permissions
   */
  const hasAnyPermission = (codes: string[]): boolean => {
    return codes.some((code) => hasPermission(code));
  };

  /**
   * Check if user has all of the specified permissions (AND logic)
   * @param codes - Array of permission codes
   * @returns true if user has all of the permissions
   */
  const hasAllPermissions = (codes: string[]): boolean => {
    return codes.every((code) => hasPermission(code));
  };

  /**
   * Get permission by code
   * @param code - Permission code
   * @returns Permission object or null
   */
  const getPermission = (code: string): Permission | null => {
    const all = [
      ...permissions.global,
      ...permissions.hospital,
      ...permissions.unit,
    ];
    return all.find((p) => p.code === code) || null;
  };

  /**
   * Check if user has permission at a specific scope
   * @param code - Permission code
   * @param scope - 'GLOBAL', 'HOSPITAL', or 'UNIT'
   * @returns true if user has the permission at the specified scope
   */
  const hasPermissionAtScope = (code: string, scope: 'GLOBAL' | 'HOSPITAL' | 'UNIT'): boolean => {
    switch (scope) {
      case 'GLOBAL':
        return permissions.global.some((p) => p.code === code);
      case 'HOSPITAL':
        return permissions.hospital.some((p) => p.code === code);
      case 'UNIT':
        return permissions.unit.some((p) => p.code === code);
      default:
        return false;
    }
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermission,
    hasPermissionAtScope,
    userProfile, // Expose user profile for Hospital Admin scoping
  };
};

