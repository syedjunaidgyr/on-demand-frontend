import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import ApiService from '../../services/api';

// Reusable input components must be defined outside to avoid remounting on each render
const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[styles.textInput, multiline && styles.multilineInput]}
      placeholder={placeholder}
      placeholderTextColor={Colors.textTertiary}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      blurOnSubmit={false}
    />
  </View>
);

// Dropdown components
const DepartmentDropdown = ({ 
  open, 
  setOpen, 
  value, 
  setValue, 
  items, 
  placeholder, 
  styles 
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (callback: (prev: string) => string) => void;
  items: Array<{label: string, value: string}>;
  placeholder: string;
  styles: any;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>Department</Text>
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue}
      placeholder={placeholder}
      style={styles.dropdownStyle}
      textStyle={styles.dropdownTextStyle}
      placeholderStyle={styles.dropdownPlaceholderStyle}
      dropDownContainerStyle={styles.dropdownContainerStyle}
      listItemLabelStyle={styles.dropdownListItemStyle}
      closeAfterSelecting={true}
      searchable={false}
      listMode="SCROLLVIEW"
      zIndex={4000}
      zIndexInverse={1000}
    />
  </View>
);

const SpecializationDropdown = ({ 
  open, 
  setOpen, 
  value, 
  setValue, 
  items, 
  placeholder, 
  styles 
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (callback: (prev: string) => string) => void;
  items: Array<{label: string, value: string}>;
  placeholder: string;
  styles: any;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>Specialization</Text>
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue}
      placeholder={placeholder}
      style={styles.dropdownStyle}
      textStyle={styles.dropdownTextStyle}
      placeholderStyle={styles.dropdownPlaceholderStyle}
      dropDownContainerStyle={styles.dropdownContainerStyle}
      listItemLabelStyle={styles.dropdownListItemStyle}
      closeAfterSelecting={true}
      searchable={false}
      listMode="SCROLLVIEW"
      zIndex={3000}
      zIndexInverse={2000}
    />
  </View>
);

const HospitalDropdown = ({ 
  open, 
  setOpen, 
  value, 
  setValue, 
  items, 
  placeholder, 
  loading, 
  styles 
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (callback: (prev: string) => string) => void;
  items: Array<{label: string, value: string}>;
  placeholder: string;
  loading: boolean;
  styles: any;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>Hospital</Text>
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue}
      placeholder={placeholder}
      loading={loading}
      style={styles.dropdownStyle}
      textStyle={styles.dropdownTextStyle}
      placeholderStyle={styles.dropdownPlaceholderStyle}
      dropDownContainerStyle={styles.dropdownContainerStyle}
      listItemLabelStyle={styles.dropdownListItemStyle}
      closeAfterSelecting={true}
      searchable={false}
      listMode="SCROLLVIEW"
      zIndex={2000}
      zIndexInverse={3000}
    />
  </View>
);

const UnitDropdown = ({ 
  open, 
  setOpen, 
  value, 
  setValue, 
  items, 
  placeholder, 
  loading, 
  disabled,
  styles 
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (callback: (prev: string) => string) => void;
  items: Array<{label: string, value: string}>;
  placeholder: string;
  loading: boolean;
  disabled: boolean;
  styles: any;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>Unit</Text>
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue}
      placeholder={placeholder}
      loading={loading}
      disabled={disabled}
      style={styles.dropdownStyle}
      textStyle={styles.dropdownTextStyle}
      placeholderStyle={styles.dropdownPlaceholderStyle}
      dropDownContainerStyle={styles.dropdownContainerStyle}
      listItemLabelStyle={styles.dropdownListItemStyle}
      closeAfterSelecting={true}
      searchable={false}
      listMode="SCROLLVIEW"
      zIndex={1000}
      zIndexInverse={4000}
    />
  </View>
);

const CheckboxField = ({ 
  label, 
  value, 
  onValueChange 
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => (
  <TouchableOpacity style={styles.checkboxContainer} onPress={() => onValueChange(!value)}>
    <View style={[styles.checkbox, value && styles.checkboxChecked]}>
      {value && <FontAwesomeIcon icon="check" size={16} color={Colors.white}  />}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

const CreateJobScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    location: '',
    requiredRole: 'DOCTOR' as 'DOCTOR' | 'NURSE',
    specialization: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    hourlyRate: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    maxAssignments: '1',
    hospitalId: '',
    unitCode: '',
    facilityName: '',
    facilityStreet: '',
    facilityCity: '',
    facilityState: '',
    facilityZipCode: '',
    facilityCountry: 'USA',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactPosition: '',
    notes: '',
    boardCertified: false,
    experience: '',
    skills: '',
    mealAllowance: false,
    parking: false,
    malpractice: false,
  });

  // Hospital and unit data
  const [hospitals, setHospitals] = useState<Array<{id: number, name: string}>>([]);
  const [units, setUnits] = useState<Array<{code: string, name: string}>>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Dropdown states
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [specializationDropdownOpen, setSpecializationDropdownOpen] = useState(false);
  const [hospitalDropdownOpen, setHospitalDropdownOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);

  // Medical departments and specializations (same as RegisterScreen)
  const medicalDepartments = [
    'Emergency Medicine',
    'General Medicine',
    'General Surgery',
    'Obstetrics & Gynecology',
    'Pediatrics',
    'Orthopedics',
    'Cardiology',
    'Neurology',
    'Urology',
    'Nephrology',
    'Gastroenterology',
    'Oncology',
    'ENT',
    'Ophthalmology',
    'Dermatology',
    'Psychiatry',
    'Radiology',
    'Pathology',
    'Anesthesiology',
    'Physiotherapy',
  ];

  // Department-specific specializations mapping
  const departmentSpecializations: Record<string, string[]> = {
    'Emergency Medicine': ['Trauma Care', 'Critical Care', 'Accident & Emergency', 'Emergency Surgery'],
    'General Medicine': ['Internal Medicine', 'Diabetology', 'Infectious Diseases', 'Geriatric Medicine'],
    'General Surgery': ['Laparoscopic Surgery', 'Gastrointestinal Surgery', 'Hernia Repair', 'Breast Surgery'],
    'Obstetrics & Gynecology': ['Obstetrics', 'Gynecology', 'Infertility', 'Maternal-Fetal Medicine'],
    'Pediatrics': ['Neonatology', 'Pediatric Neurology', 'Pediatric Cardiology', 'Child Development'],
    'Orthopedics': ['Joint Replacement', 'Sports Medicine', 'Spine Surgery', 'Trauma Orthopedics'],
    'Cardiology': ['Interventional Cardiology', 'Non-Invasive Cardiology', 'Pediatric Cardiology', 'Cardiac Rehabilitation'],
    'Neurology': ['Stroke', 'Epilepsy', 'Neurophysiology', 'Movement Disorders'],
    'Urology': ['Andrology', 'Endourology', 'Pediatric Urology', 'Uro-Oncology'],
    'Nephrology': ['Dialysis', 'Renal Transplant', 'Chronic Kidney Disease', 'Hypertension Management'],
    'Gastroenterology': ['Hepatology', 'Pancreatology', 'Endoscopy', 'Liver Transplant'],
    'Oncology': ['Medical Oncology', 'Radiation Oncology', 'Surgical Oncology', 'Hematologic Oncology'],
    'ENT': ['Otology (Ear)', 'Rhinology (Nose)', 'Laryngology (Throat)', 'Head & Neck Surgery'],
    'Ophthalmology': ['Cataract Surgery', 'Glaucoma', 'Retina', 'Cornea & Refractive Surgery'],
    'Dermatology': ['Cosmetic Dermatology', 'Trichology', 'Clinical Dermatology', 'Venereology'],
    'Psychiatry': ['Child Psychiatry', 'Addiction Psychiatry', 'Clinical Psychology', 'Geriatric Psychiatry'],
    'Radiology': ['MRI', 'CT Scan', 'Ultrasound', 'Interventional Radiology'],
    'Pathology': ['Histopathology', 'Cytopathology', 'Hematology', 'Clinical Pathology'],
    'Anesthesiology': ['Cardiac Anesthesia', 'Neuroanesthesia', 'Pain Management', 'Critical Care Anesthesia'],
    'Physiotherapy': ['Orthopedic Physiotherapy', 'Neurological Physiotherapy', 'Cardiopulmonary Physiotherapy', 'Sports Rehabilitation'],
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If department changes, reset specialization
    if (field === 'department') {
      setFormData(prev => ({ ...prev, department: value as string, specialization: '' }));
    }
    
    // If hospital changes, reset unit and load new units
    if (field === 'hospitalId') {
      setFormData(prev => ({ ...prev, hospitalId: value as string, unitCode: '' }));
      setUnits([]);
      if (value) {
        loadUnits(parseInt(value as string));
      }
    }
  };

  const loadHospitals = useCallback(async () => {
    setLoadingHospitals(true);
    try {
      const response = await ApiService.getHospitals();
      const hospitalList = response.hospitals.map(hospital => ({
        id: hospital.id,
        name: hospital.name
      }));
      setHospitals(hospitalList);
    } catch (error) {
      console.error('❌ Failed to load hospitals:', error);
      Alert.alert(
        'Network Error', 
        'Failed to connect to server. Please check your network connection and try again.'
      );
    } finally {
      setLoadingHospitals(false);
    }
  }, []);

  const loadUnits = useCallback(async (hospitalId: number) => {
    setLoadingUnits(true);
    try {
      const response = await ApiService.getHospitalUnits(hospitalId);
      
      if (!response.units || !Array.isArray(response.units)) {
        console.error('❌ No units array found in response:', response);
        setUnits([]);
        return;
      }
      
      const unitList = response.units.map(unit => {
        return {
          code: unit.unitCode || '',
          name: unit.unitName || 'Unknown Unit'
        };
      });
      
      setUnits(unitList);
    } catch (error) {
      console.error('❌ Failed to load units for hospital', hospitalId, ':', error);
      Alert.alert('Error', `Failed to load units for the selected hospital. Please try again.`);
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  // Load hospitals on component mount
  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  const validateForm = () => {
    const requiredFields = [
      'title', 'description', 'department', 'location', 'startDate', 'endDate',
      'startTime', 'endTime', 'hourlyRate', 'facilityName', 'facilityStreet',
      'facilityCity', 'facilityState', 'facilityZipCode', 'contactName',
      'contactPhone', 'contactEmail', 'contactPosition', 'hospitalId', 'unitCode'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        Alert.alert('Validation Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Department and specialization validation
    if (!formData.department) {
      Alert.alert('Validation Error', 'Please select a department');
      return false;
    }

    if (formData.requiredRole === 'DOCTOR' && !formData.specialization) {
      Alert.alert('Validation Error', 'Please select a specialization for doctors');
      return false;
    }

    // Validate specialization matches department
    if (formData.requiredRole === 'DOCTOR' && formData.specialization && formData.department) {
      const validSpecializations = departmentSpecializations[formData.department] || [];
      if (!validSpecializations.includes(formData.specialization)) {
        Alert.alert('Validation Error', `Selected specialization "${formData.specialization}" is not valid for department "${formData.department}"`);
        return false;
      }
    }

    // Hospital and unit validation
    if (!formData.hospitalId) {
      Alert.alert('Validation Error', 'Please select a hospital');
      return false;
    }

    if (!formData.unitCode) {
      Alert.alert('Validation Error', 'Please select a unit');
      return false;
    }

    if (parseFloat(formData.hourlyRate) <= 0) {
      Alert.alert('Validation Error', 'Hourly rate must be greater than 0');
      return false;
    }

    return true;
  };

  const handleCreateJob = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const normalizeDate = (value: string) => {
        const ddmmyyyy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (ddmmyyyy) {
          const [, dd, mm, yyyy] = ddmmyyyy;
          return `${yyyy}-${mm}-${dd}`; // convert to YYYY-MM-DD
        }
        return value;
      };

      const jobData = {
        title: formData.title,
        description: formData.description,
        department: formData.department,
        location: formData.location,
        hospitalId: parseInt(formData.hospitalId),
        unitCode: formData.unitCode,
        createdBy: 1, // TODO: Get from auth context
        requiredRole: formData.requiredRole,
        specialization: formData.specialization || undefined,
        startDate: normalizeDate(formData.startDate),
        endDate: normalizeDate(formData.endDate),
        startTime: formData.startTime,
        endTime: formData.endTime,
        hourlyRate: parseFloat(formData.hourlyRate),
        priority: formData.priority,
        maxAssignments: parseInt(formData.maxAssignments),
        facilityName: formData.facilityName,
        facilityAddress: {
          street: formData.facilityStreet,
          city: formData.facilityCity,
          state: formData.facilityState,
          zipCode: formData.facilityZipCode,
          country: formData.facilityCountry,
        },
        contactPerson: {
          name: formData.contactName,
          phone: formData.contactPhone,
          email: formData.contactEmail,
          position: formData.contactPosition,
        },
        notes: formData.notes || undefined,
        requirements: {
          boardCertified: formData.boardCertified,
          experience: formData.experience || 'Not specified',
          skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
        },
        benefits: {
          mealAllowance: formData.mealAllowance,
          parking: formData.parking,
          malpractice: formData.malpractice,
        },
      };

      console.log('🔧 Job data being sent:', jobData);

      const response = await ApiService.createJob(jobData);
      
      // Handle the new response format with compatibility information
      const compatibleStaffCount = (response as any).compatibleStaffCount || 0;
      const message = compatibleStaffCount > 0 
        ? `Job created successfully! Found ${compatibleStaffCount} compatible staff members.`
        : 'Job created successfully! No compatible staff found yet, but the job is posted.';

      Alert.alert('Success', message, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.log('❌ Create job error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create job');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always" keyboardDismissMode="none">
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Job Details</Text>
          
          <InputField
            label="Job Title"
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            placeholder="e.g., Emergency Medicine Physician - Night Shift"
          />

          <InputField
            label="Description"
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            placeholder="Describe the job requirements and responsibilities"
            multiline={true}
            numberOfLines={4}
          />

          <DepartmentDropdown 
            open={departmentDropdownOpen}
            setOpen={(open) => {
              setDepartmentDropdownOpen(open);
              if (open) {
                setSpecializationDropdownOpen(false);
                setHospitalDropdownOpen(false);
                setUnitDropdownOpen(false);
              }
            }}
            value={formData.department}
            setValue={(callback) => {
              const newValue = callback(formData.department);
              handleInputChange('department', newValue);
            }}
            items={medicalDepartments.map(dept => ({
              label: dept,
              value: dept,
            }))}
            placeholder="Select department"
            styles={styles}
          />

          <InputField
            label="Location"
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
            placeholder="e.g., New York"
          />

          <View style={styles.roleSelector}>
            <Text style={styles.inputLabel}>Required Role</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.requiredRole === 'DOCTOR' && styles.roleButtonActive,
                ]}
                onPress={() => handleInputChange('requiredRole', 'DOCTOR')}>
                <FontAwesomeIcon icon="stethoscope" size={20} color={formData.requiredRole === 'DOCTOR' ? Colors.white : Colors.primary}  />
                <Text style={[
                  styles.roleButtonText,
                  formData.requiredRole === 'DOCTOR' && styles.roleButtonTextActive,
                ]}>
                  Doctor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  formData.requiredRole === 'NURSE' && styles.roleButtonActive,
                ]}
                onPress={() => handleInputChange('requiredRole', 'NURSE')}>
                <FontAwesomeIcon icon="user-nurse" size={20} color={formData.requiredRole === 'NURSE' ? Colors.white : Colors.primary}  />
                <Text style={[
                  styles.roleButtonText,
                  formData.requiredRole === 'NURSE' && styles.roleButtonTextActive,
                ]}>
                  Nurse
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {formData.requiredRole === 'DOCTOR' && (
            <SpecializationDropdown 
              open={specializationDropdownOpen}
              setOpen={(open) => {
                setSpecializationDropdownOpen(open);
                if (open) {
                  setDepartmentDropdownOpen(false);
                  setHospitalDropdownOpen(false);
                  setUnitDropdownOpen(false);
                }
              }}
              value={formData.specialization}
              setValue={(callback) => {
                const newValue = callback(formData.specialization);
                handleInputChange('specialization', newValue);
              }}
              items={(departmentSpecializations[formData.department] || []).map(specialization => ({
                label: specialization,
                value: specialization,
              }))}
              placeholder="Select specialization"
              styles={styles}
            />
          )}

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Start Date"
                value={formData.startDate}
                onChangeText={(text) => handleInputChange('startDate', text)}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="End Date"
                value={formData.endDate}
                onChangeText={(text) => handleInputChange('endDate', text)}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Start Time"
                value={formData.startTime}
                onChangeText={(text) => handleInputChange('startTime', text)}
                placeholder="HH:MM"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="End Time"
                value={formData.endTime}
                onChangeText={(text) => handleInputChange('endTime', text)}
                placeholder="HH:MM"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Hourly Rate (₹)"
                value={formData.hourlyRate}
                onChangeText={(text) => handleInputChange('hourlyRate', text)}
                placeholder="150.00"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Max Assignments"
                value={formData.maxAssignments}
                onChangeText={(text) => handleInputChange('maxAssignments', text)}
                placeholder="1"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.prioritySelector}>
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityButtons}>
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.priorityButton,
                    formData.priority === priority && styles.priorityButtonActive,
                  ]}
                  onPress={() => handleInputChange('priority', priority)}>
                  <Text style={[
                    styles.priorityButtonText,
                    formData.priority === priority && styles.priorityButtonTextActive,
                  ]}>
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Facility Information</Text>
          
          <InputField
            label="Facility Name"
            value={formData.facilityName}
            onChangeText={(text) => handleInputChange('facilityName', text)}
            placeholder="e.g., New York General Hospital"
          />

          <HospitalDropdown 
            open={hospitalDropdownOpen}
            setOpen={(open) => {
              setHospitalDropdownOpen(open);
              if (open) {
                setDepartmentDropdownOpen(false);
                setSpecializationDropdownOpen(false);
                setUnitDropdownOpen(false);
              }
            }}
            value={formData.hospitalId}
            setValue={(callback) => {
              const newValue = callback(formData.hospitalId);
              handleInputChange('hospitalId', newValue);
            }}
            items={hospitals.map(hospital => ({
              label: hospital.name,
              value: hospital.id.toString(),
            }))}
            placeholder="Select hospital"
            loading={loadingHospitals}
            styles={styles}
          />

          <UnitDropdown 
            open={unitDropdownOpen}
            setOpen={(open) => {
              setUnitDropdownOpen(open);
              if (open) {
                setDepartmentDropdownOpen(false);
                setSpecializationDropdownOpen(false);
                setHospitalDropdownOpen(false);
              }
            }}
            value={formData.unitCode}
            setValue={(callback) => {
              const newValue = callback(formData.unitCode);
              handleInputChange('unitCode', newValue);
            }}
            items={units.map(unit => ({
              label: unit.name,
              value: unit.code,
            }))}
            placeholder="Select unit"
            loading={loadingUnits}
            disabled={!formData.hospitalId || units.length === 0}
            styles={styles}
          />

          <InputField
            label="Street Address"
            value={formData.facilityStreet}
            onChangeText={(text) => handleInputChange('facilityStreet', text)}
            placeholder="123 Medical Center Dr"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="City"
                value={formData.facilityCity}
                onChangeText={(text) => handleInputChange('facilityCity', text)}
                placeholder="New York"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="State"
                value={formData.facilityState}
                onChangeText={(text) => handleInputChange('facilityState', text)}
                placeholder="NY"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="ZIP Code"
                value={formData.facilityZipCode}
                onChangeText={(text) => handleInputChange('facilityZipCode', text)}
                placeholder="10001"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Country"
                value={formData.facilityCountry}
                onChangeText={(text) => handleInputChange('facilityCountry', text)}
                placeholder="USA"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <InputField
            label="Contact Name"
            value={formData.contactName}
            onChangeText={(text) => handleInputChange('contactName', text)}
            placeholder="Dr. Sarah Johnson"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Contact Phone"
                value={formData.contactPhone}
                onChangeText={(text) => handleInputChange('contactPhone', text)}
                placeholder="+1234567891"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Contact Email"
                value={formData.contactEmail}
                onChangeText={(text) => handleInputChange('contactEmail', text)}
                placeholder="hr@hospital.com"
                keyboardType="email-address"
              />
            </View>
          </View>

          <InputField
            label="Contact Position"
            value={formData.contactPosition}
            onChangeText={(text) => handleInputChange('contactPosition', text)}
            placeholder="HR Manager"
          />

          <Text style={styles.sectionTitle}>Requirements & Benefits</Text>
          
          <InputField
            label="Experience Required"
            value={formData.experience}
            onChangeText={(text) => handleInputChange('experience', text)}
            placeholder="e.g., 3+ years"
          />

          <InputField
            label="Required Skills (comma-separated)"
            value={formData.skills}
            onChangeText={(text) => handleInputChange('skills', text)}
            placeholder="Trauma Care, Critical Care, Emergency Procedures"
          />

          <View style={styles.checkboxSection}>
            <Text style={styles.inputLabel}>Benefits</Text>
            <CheckboxField
              label="Meal Allowance"
              value={formData.mealAllowance}
              onValueChange={(value) => handleInputChange('mealAllowance', value)}
            />
            <CheckboxField
              label="Parking"
              value={formData.parking}
              onValueChange={(value) => handleInputChange('parking', value)}
            />
            <CheckboxField
              label="Malpractice Insurance"
              value={formData.malpractice}
              onValueChange={(value) => handleInputChange('malpractice', value)}
            />
          </View>

          {formData.requiredRole === 'DOCTOR' && (
            <CheckboxField
              label="Board Certification Required"
              value={formData.boardCertified}
              onValueChange={(value) => handleInputChange('boardCertified', value)}
            />
          )}

          <InputField
            label="Additional Notes"
            value={formData.notes}
            onChangeText={(text) => handleInputChange('notes', text)}
            placeholder="Any additional information or special requirements"
            multiline={true}
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.createButtonDisabled]}
            onPress={handleCreateJob}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.createButtonText}>Create Job</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  formContainer: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  roleSelector: {
    marginBottom: Spacing.lg,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
  },
  roleButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  roleButtonTextActive: {
    color: Colors.white,
  },
  prioritySelector: {
    marginBottom: Spacing.lg,
  },
  priorityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  priorityButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  priorityButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  priorityButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  priorityButtonTextActive: {
    color: Colors.white,
  },
  checkboxSection: {
    marginBottom: Spacing.lg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing['2xl'],
    ...Shadow.md,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  dropdownStyle: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    minHeight: 50,
  },
  dropdownTextStyle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  dropdownPlaceholderStyle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textTertiary,
  },
  dropdownContainerStyle: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownListItemStyle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
});

export default CreateJobScreen;
