import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import ApiService from '../../services/api';

// Move InputField outside to prevent re-creation on each render
const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry = false, 
  keyboardType = 'default',
  icon,
  showEye = false,
  onToggleEye,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  icon: any;
  showEye?: boolean;
  onToggleEye?: () => void;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <FontAwesomeIcon icon={icon} size={20} color={Colors.textTertiary} style={styles.inputIcon} />
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit={false}
        returnKeyType="next"
        autoFocus={false}
        selectTextOnFocus={false}
        onFocus={() => console.log('Input focused:', label)}
        onBlur={() => console.log('Input blurred:', label)}
      />
      {showEye && (
        <TouchableOpacity onPress={onToggleEye} style={styles.eyeIcon}>
          <FontAwesomeIcon
            icon={secureTextEntry ? "eye-slash" : "eye"}
            size={20}
            color={Colors.textTertiary}
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// Move all dropdown components outside to prevent re-creation on each render
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
      zIndex={4000}
      zIndexInverse={1000}
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
    <Text style={styles.inputLabel}>Unit/Department</Text>
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
      zIndex={3000}
      zIndexInverse={2000}
    />
  </View>
);

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
      zIndex={2000}
      zIndexInverse={3000}
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
      zIndex={1000}
      zIndexInverse={4000}
    />
  </View>
);

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'DOCTOR' as 'DOCTOR' | 'NURSE',
    department: '',
    location: '',
    specialization: '',
    licenseNumber: '',
    phone: '',
    hospitalId: '',
    unitCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hospitals, setHospitals] = useState<Array<{id: number, name: string}>>([]);
  const [units, setUnits] = useState<Array<{code: string, name: string}>>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  
  // Dropdown states
  const [hospitalDropdownOpen, setHospitalDropdownOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [specializationDropdownOpen, setSpecializationDropdownOpen] = useState(false);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Medical specialties for department dropdown
  const medicalSpecialties = [
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

  const handleEmailChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, email: value }));
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, password: value }));
  }, []);

  const handleFirstNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, firstName: value }));
  }, []);

  const handleLastNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, lastName: value }));
  }, []);

  const handleLocationChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
  }, []);

  const handlePhoneChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, phone: value }));
  }, []);

  const handleLicenseNumberChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, licenseNumber: value }));
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If hospital changes, reset unit and load new units
    if (field === 'hospitalId') {
      setFormData(prev => ({ ...prev, hospitalId: value, unitCode: '' }));
      setUnits([]);
      if (value) {
        loadUnits(parseInt(value));
      }
    }
    
    // If department changes, reset specialization
    if (field === 'department') {
      setFormData(prev => ({ ...prev, department: value, specialization: '' }));
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
        'Failed to connect to server. Please check:\n\n1. Your server is running on 192.168.1.5:3000\n2. Your device is on the same network\n3. Try restarting the app'
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
      setUnits([]); // Clear units on error
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  // Load hospitals on component mount
  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);


  const validateForm = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }

    // Password validation
    if (!formData.password) {
      Alert.alert('Validation Error', 'Please enter a password');
        return false;
      }
    if (formData.password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      Alert.alert('Validation Error', 'Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      Alert.alert('Validation Error', 'Please confirm your password');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }

    // Name validation
    if (!formData.firstName.trim()) {
      Alert.alert('Validation Error', 'Please enter your first name');
      return false;
    }
    if (formData.firstName.trim().length < 2) {
      Alert.alert('Validation Error', 'First name must be at least 2 characters long');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Validation Error', 'Please enter your last name');
      return false;
    }
    if (formData.lastName.trim().length < 2) {
      Alert.alert('Validation Error', 'Last name must be at least 2 characters long');
      return false;
    }

    // Department validation
    if (!formData.department) {
      Alert.alert('Validation Error', 'Please select your department');
      return false;
    }

    // Location validation
    if (!formData.location.trim()) {
      Alert.alert('Validation Error', 'Please enter your location');
      return false;
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!formData.phone.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number');
      return false;
    }
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return false;
    }

    // Doctor-specific validations
    if (formData.role === 'DOCTOR') {
      if (!formData.specialization) {
        Alert.alert('Validation Error', 'Please select your specialization');
        return false;
      }
      if (!formData.licenseNumber.trim()) {
        Alert.alert('Validation Error', 'Please enter your medical license number');
        return false;
      }
      if (formData.licenseNumber.trim().length < 5) {
        Alert.alert('Validation Error', 'License number must be at least 5 characters long');
        return false;
      }
    }

    // Hospital assignment validation (optional but if provided, must be complete)
    if (formData.hospitalId && !formData.unitCode) {
      Alert.alert('Validation Error', 'Please select a unit when a hospital is selected');
      return false;
    }

    // Emergency contact validation
    if (!formData.emergencyContactName.trim()) {
      Alert.alert('Validation Error', 'Please enter emergency contact name');
      return false;
    }
    if (formData.emergencyContactName.trim().length < 2) {
      Alert.alert('Validation Error', 'Emergency contact name must be at least 2 characters long');
      return false;
    }
    if (!formData.emergencyContactPhone.trim()) {
      Alert.alert('Validation Error', 'Please enter emergency contact phone number');
      return false;
    }
    if (!phoneRegex.test(formData.emergencyContactPhone.replace(/\s/g, ''))) {
      Alert.alert('Validation Error', 'Please enter a valid emergency contact phone number');
      return false;
    }
    if (!formData.emergencyContactRelationship.trim()) {
      Alert.alert('Validation Error', 'Please enter emergency contact relationship');
      return false;
    }

    // Address validation
    if (!formData.street.trim()) {
      Alert.alert('Validation Error', 'Please enter your street address');
      return false;
    }
    if (formData.street.trim().length < 5) {
      Alert.alert('Validation Error', 'Please enter a complete street address');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Validation Error', 'Please enter your city');
      return false;
    }
    if (!formData.state.trim()) {
      Alert.alert('Validation Error', 'Please enter your state');
      return false;
    }
    if (!formData.zipCode.trim()) {
      Alert.alert('Validation Error', 'Please enter your PIN code');
      return false;
    }
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(formData.zipCode.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid PIN code (6 digits)');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const registerData = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        department: formData.department,
        location: formData.location,
        specialization: formData.specialization || undefined,
        licenseNumber: formData.licenseNumber || undefined,
        phone: formData.phone,
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship,
        },
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        hospitalId: formData.hospitalId ? parseInt(formData.hospitalId) : undefined,
        unitCode: formData.unitCode || undefined,
      };
      console.log('🔐 Register data:', registerData);
      await ApiService.register(registerData);

      // Show success modal
      setShowSuccessModal(true);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.goBack();
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    // Reload and navigate back to login
    setTimeout(() => {
      navigation.goBack();
    }, 100);
  };



  // Success Modal Component
  const SuccessModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>

      <View style={styles.modalIconContainer}>
          <FontAwesomeIcon icon="check-circle" size={60} color="#4CAF50" />
        </View>
        <Text style={styles.modalTitle}>Congratulations!</Text>
      
        <Text style={styles.modalMessage}>
          Your account has been successfully created. You can now sign in with your credentials.
        </Text>
        <TouchableOpacity style={styles.modalDoneButton} onPress={handleSuccessDone}>
          <Text style={styles.modalDoneButtonText}>Done</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalEditLink} onPress={handleSuccessDone}>
          
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
            <FontAwesomeIcon icon="arrow-left" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
        >
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Join Locum Healthcare</Text>
          <Text style={styles.subtitleText}>Fill in your details to get started</Text>

          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === 'DOCTOR' && styles.roleButtonActive,
              ]}
              onPress={() => handleInputChange('role', 'DOCTOR')}>
              <FontAwesomeIcon icon="user-md" size={24} color={formData.role === 'DOCTOR' ? Colors.white : Colors.primary} />
              <Text style={[
                styles.roleButtonText,
                formData.role === 'DOCTOR' && styles.roleButtonTextActive,
              ]}>
                Doctor
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === 'NURSE' && styles.roleButtonActive,
              ]}
              onPress={() => handleInputChange('role', 'NURSE')}>
              <FontAwesomeIcon icon="stethoscope" size={24} color={formData.role === 'NURSE' ? Colors.white : Colors.primary} />
              <Text style={[
                styles.roleButtonText,
                formData.role === 'NURSE' && styles.roleButtonTextActive,
              ]}>
                Nurse
              </Text>
            </TouchableOpacity>
          </View>

          <InputField
            label="Email Address"
            value={formData.email}
            onChangeText={handleEmailChange}
            placeholder="Enter your email"
            keyboardType="email-address"
            icon="envelope"
          />

          <InputField
            label="Password"
            value={formData.password}
            onChangeText={handlePasswordChange}
            placeholder="Create a password"
            secureTextEntry={!showPassword}
            icon="lock"
            showEye={true}
            onToggleEye={() => setShowPassword(!showPassword)}
          />

          <InputField
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
            placeholder="Confirm your password"
            secureTextEntry={!showConfirmPassword}
            icon="lock"
            showEye={true}
            onToggleEye={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="First Name"
                value={formData.firstName}
                onChangeText={handleFirstNameChange}
                placeholder="First name"
                icon="user"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Last Name"
                value={formData.lastName}
                onChangeText={handleLastNameChange}
                placeholder="Last name"
                icon="user"
              />
            </View>
          </View>

          <DepartmentDropdown 
            open={departmentDropdownOpen}
            setOpen={(open) => {
              setDepartmentDropdownOpen(open);
              if (open) {
                setHospitalDropdownOpen(false);
                setUnitDropdownOpen(false);
                setSpecializationDropdownOpen(false);
              }
            }}
            value={formData.department}
            setValue={(callback) => {
              const newValue = callback(formData.department);
              handleInputChange('department', newValue);
            }}
            items={medicalSpecialties.map(specialty => ({
              label: specialty,
              value: specialty,
            }))}
            placeholder="Select your department"
            styles={styles}
          />

          <InputField
            label="Location"
            value={formData.location}
            onChangeText={handleLocationChange}
            placeholder="e.g., New York"
            icon="map-marker-alt"
          />

          {formData.role === 'DOCTOR' && (
            <>
              <SpecializationDropdown 
                open={specializationDropdownOpen}
                setOpen={(open) => {
                  setSpecializationDropdownOpen(open);
                  if (open) {
                    setHospitalDropdownOpen(false);
                    setUnitDropdownOpen(false);
                    setDepartmentDropdownOpen(false);
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
                placeholder="Select your specialization"
                styles={styles}
              />
              <InputField
                label="License Number"
                value={formData.licenseNumber}
                onChangeText={handleLicenseNumberChange}
                placeholder="Medical license number"
                icon="file-medical"
              />
            </>
          )}

          <InputField
            label="Phone Number"
            value={formData.phone}
            onChangeText={handlePhoneChange}
            placeholder="+1234567890"
            keyboardType="phone-pad"
            icon="phone"
          />

          <Text style={styles.sectionTitle}>Hospital Assignment</Text>
          
          <HospitalDropdown 
            open={hospitalDropdownOpen}
            setOpen={(open) => {
              setHospitalDropdownOpen(open);
              if (open) {
                setUnitDropdownOpen(false);
                setDepartmentDropdownOpen(false);
                setSpecializationDropdownOpen(false);
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
            placeholder="Select a hospital"
            loading={loadingHospitals}
            styles={styles}
          />

          <UnitDropdown 
            open={unitDropdownOpen}
            setOpen={(open) => {
              setUnitDropdownOpen(open);
              if (open) {
                setHospitalDropdownOpen(false);
                setDepartmentDropdownOpen(false);
                setSpecializationDropdownOpen(false);
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
            placeholder="Select a unit"
            loading={loadingUnits}
            disabled={!formData.hospitalId || units.length === 0}
            styles={styles}
          />
          
        

          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <InputField
            label="Contact Name"
            value={formData.emergencyContactName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContactName: text }))}
            placeholder="Emergency contact name"
            icon="user"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Contact Phone"
                value={formData.emergencyContactPhone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContactPhone: text }))}
                placeholder="+1234567890"
                keyboardType="phone-pad"
                icon="phone"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Relationship"
                value={formData.emergencyContactRelationship}
                onChangeText={(text) => setFormData(prev => ({ ...prev, emergencyContactRelationship: text }))}
                placeholder="e.g., Spouse"
                icon="users"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Address</Text>
          <InputField
            label="Street Address"
            value={formData.street}
            onChangeText={(text) => setFormData(prev => ({ ...prev, street: text }))}
            placeholder="123 Main St"
                icon="map-marker-alt"
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="City"
                value={formData.city}
                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                placeholder="City"
                icon="building"
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="State"
                value={formData.state}
                onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
                placeholder="State"
                icon="map-marker-alt"
              />
            </View>
          </View>

          <InputField
            label="PIN Code"
            value={formData.zipCode}
            onChangeText={(text) => setFormData(prev => ({ ...prev, zipCode: text }))}
            placeholder="123456"
            keyboardType="numeric"
            icon="map-marker-alt"
          />

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.registerButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={navigateToLogin}>
            <Text style={styles.loginButtonText}>
              Already have an account? <Text style={styles.loginLinkText}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Success Modal */}
      {showSuccessModal && <SuccessModal />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex1: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
    marginTop: 25,
    marginLeft: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formContainer: {
    paddingTop: 14,
    paddingBottom: 48,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    marginTop: -20,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },
  roleButtonTextActive: {
    color: Colors.white,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 24,
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  loginButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loginLinkText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  dropdownStyle: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 50,
  },
  dropdownTextStyle: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  dropdownPlaceholderStyle: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  dropdownContainerStyle: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
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
    fontSize: 16,
    color: Colors.textPrimary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    marginHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalIconContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  modalDoneButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: 'center',
    minWidth: 140,
    marginBottom: 16,
  },
  modalDoneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  modalEditLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalEditLinkText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default RegisterScreen;
