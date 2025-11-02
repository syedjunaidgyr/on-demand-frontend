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
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '../../utils/icons';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import ApiService from '../../services/api';
import Responsive from '../../utils/responsive';
import { RegisterRequest } from '../../types';

const { width, height } = Dimensions.get('window');

// Device size detection for responsive design - now using Responsive utility
const IS_SMALL_DEVICE = Responsive.isSmallScreen();
const IS_VERY_SMALL_DEVICE = Responsive.getScreenHeight() < 600;

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
  error,
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
  error?: string;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
      <FontAwesomeIcon icon={icon} size={Responsive.iconSize(20)} color={error ? Colors.error : Colors.textTertiary} style={styles.inputIcon} />
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
            size={Responsive.iconSize(20)}
            color={Colors.textTertiary}
          />
        </TouchableOpacity>
      )}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
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
  styles,
  error
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (callback: (prev: string) => string) => void;
  items: Array<{label: string, value: string}>;
  placeholder: string;
  loading: boolean;
  styles: any;
  error?: string;
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
      style={[styles.dropdownStyle, error && styles.dropdownStyleError]}
      textStyle={styles.dropdownTextStyle}
      placeholderStyle={styles.dropdownPlaceholderStyle}
      dropDownContainerStyle={styles.dropdownContainerStyle}
      listItemContainerStyle={styles.dropdownListItemContainerStyle}
      listItemLabelStyle={styles.dropdownListItemStyle}
      closeAfterSelecting={true}
      searchable={false}
      listMode="SCROLLVIEW"
      zIndex={4000}
      zIndexInverse={1000}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
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
  styles,
  error
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
  error?: string;
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
      style={[styles.dropdownStyle, error && styles.dropdownStyleError]}
      textStyle={styles.dropdownTextStyle}
      placeholderStyle={styles.dropdownPlaceholderStyle}
      dropDownContainerStyle={styles.dropdownContainerStyle}
      listItemContainerStyle={styles.dropdownListItemContainerStyle}
      listItemLabelStyle={styles.dropdownListItemStyle}
      closeAfterSelecting={true}
      searchable={false}
      listMode="SCROLLVIEW"
      zIndex={3000}
      zIndexInverse={2000}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const DepartmentDropdown = ({ 
  open, 
  setOpen, 
  value, 
  setValue, 
  items, 
  placeholder, 
  styles,
  error
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (callback: (prev: string) => string) => void;
  items: Array<{label: string, value: string}>;
  placeholder: string;
  styles: any;
  error?: string;
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
      style={[styles.dropdownStyle, error && styles.dropdownStyleError]}
      textStyle={styles.dropdownTextStyle}
      placeholderStyle={styles.dropdownPlaceholderStyle}
      dropDownContainerStyle={styles.dropdownContainerStyle}
      listItemContainerStyle={styles.dropdownListItemContainerStyle}
      listItemLabelStyle={styles.dropdownListItemStyle}
      closeAfterSelecting={true}
      searchable={false}
      listMode="SCROLLVIEW"
      zIndex={2000}
      zIndexInverse={3000}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const SpecializationDropdown = ({ 
  open, 
  setOpen, 
  value, 
  setValue, 
  items, 
  placeholder, 
  styles,
  error
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (callback: (prev: string) => string) => void;
  items: Array<{label: string, value: string}>;
  placeholder: string;
  styles: any;
  error?: string;
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
      style={[styles.dropdownStyle, error && styles.dropdownStyleError]}
      textStyle={styles.dropdownTextStyle}
      placeholderStyle={styles.dropdownPlaceholderStyle}
      dropDownContainerStyle={styles.dropdownContainerStyle}
      listItemContainerStyle={styles.dropdownListItemContainerStyle}
      listItemLabelStyle={styles.dropdownListItemStyle}
      closeAfterSelecting={true}
      searchable={false}
      listMode="SCROLLVIEW"
      zIndex={1000}
      zIndexInverse={4000}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const RelationshipDropdown = ({ 
  open, 
  setOpen, 
  value, 
  setValue, 
  items, 
  placeholder, 
  styles,
  error
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (callback: (prev: string) => string) => void;
  items: Array<{label: string, value: string}>;
  placeholder: string;
  styles: any;
  error?: string;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>Relationship</Text>
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue}
      placeholder={placeholder}
      style={[styles.dropdownStyle, error && styles.dropdownStyleError]}
      textStyle={styles.dropdownTextStyle}
      placeholderStyle={[styles.dropdownPlaceholderStyle, styles.relationshipPlaceholderStyle]}
      dropDownContainerStyle={styles.dropdownContainerStyle}
      listItemContainerStyle={styles.dropdownListItemContainerStyle}
      listItemLabelStyle={styles.dropdownListItemStyle}
      closeAfterSelecting={true}
      searchable={false}
      listMode="SCROLLVIEW"
      zIndex={500}
      zIndexInverse={5000}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const StateDropdown = ({ 
  open, 
  setOpen, 
  value, 
  setValue, 
  items, 
  placeholder, 
  styles,
  error
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (callback: (prev: string) => string) => void;
  items: Array<{label: string, value: string}>;
  placeholder: string;
  styles: any;
  error?: string;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>State</Text>
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue}
      placeholder={placeholder}
      style={[styles.dropdownStyle, error && styles.dropdownStyleError]}
      textStyle={styles.dropdownTextStyle}
      placeholderStyle={styles.dropdownPlaceholderStyle}
      dropDownContainerStyle={styles.dropdownContainerStyle}
      listItemContainerStyle={styles.dropdownListItemContainerStyle}
      listItemLabelStyle={styles.dropdownListItemStyle}
      closeAfterSelecting={true}
      searchable={false}
      listMode="SCROLLVIEW"
      zIndex={400}
      zIndexInverse={4600}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

const CityDropdown = ({ 
  open, 
  setOpen, 
  value, 
  setValue, 
  items, 
  placeholder, 
  styles,
  error,
  disabled
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (callback: (prev: string) => string) => void;
  items: Array<{label: string, value: string}>;
  placeholder: string;
  styles: any;
  error?: string;
  disabled?: boolean;
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>City</Text>
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue}
      placeholder={placeholder}
      disabled={disabled}
      style={[styles.dropdownStyle, error && styles.dropdownStyleError]}
      textStyle={styles.dropdownTextStyle}
      placeholderStyle={styles.dropdownPlaceholderStyle}
      dropDownContainerStyle={styles.dropdownContainerStyle}
      listItemContainerStyle={styles.dropdownListItemContainerStyle}
      listItemLabelStyle={styles.dropdownListItemStyle}
      closeAfterSelecting={true}
      searchable={false}
      listMode="SCROLLVIEW"
      zIndex={300}
      zIndexInverse={4700}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
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
  
  
  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // Validation functions
  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain uppercase, lowercase, and number';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const validateName = (name: string, fieldName: string) => {
    if (!name.trim()) return `${fieldName} is required`;
    if (name.trim().length < 2) return `${fieldName} must be at least 2 characters long`;
    return '';
  };

  const validatePhone = (phone: string) => {
    if (!phone.trim()) return 'Phone number is required';
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return 'Please enter a valid 10-digit phone number';
    }
    return '';
  };

  const validateLicenseNumber = (licenseNumber: string) => {
    if (!licenseNumber.trim()) return 'License number is required';
    if (licenseNumber.trim().length < 5) return 'License number must be at least 5 characters long';
    return '';
  };

  const validateLocation = (location: string) => {
    if (!location.trim()) return 'Location is required';
    return '';
  };

  const validateDepartment = (department: string) => {
    if (!department) return 'Please select your department';
    return '';
  };

  const validateSpecialization = (specialization: string, role: string) => {
    if (role === 'DOCTOR' && !specialization) {
      return 'Please select your specialization';
    }
    return '';
  };

  const validateAddress = (address: string, fieldName: string) => {
    if (!address.trim()) return `${fieldName} is required`;
    if (fieldName === 'Street Address' && address.trim().length < 5) {
      return 'Please enter a complete street address';
    }
    return '';
  };

  const validateZipCode = (zipCode: string) => {
    if (!zipCode.trim()) return 'PIN code is required';
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(zipCode.trim())) {
      return 'Please enter a valid PIN code (6 digits)';
    }
    return '';
  };

  const validateEmergencyContact = (contact: string, fieldName: string) => {
    if (!contact.trim()) return `${fieldName} is required`;
    if (fieldName === 'Contact Name' && contact.trim().length < 2) {
      return 'Contact name must be at least 2 characters long';
    }
    if (fieldName === 'Contact Phone') {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(contact.replace(/\s/g, ''))) {
        return 'Please enter a valid 10-digit phone number';
      }
    }
    return '';
  };

  const validateHospitalAssignment = (hospitalId: string, unitCode: string) => {
    if (hospitalId && !unitCode) {
      return 'Please select a unit when a hospital is selected';
    }
    return '';
  };

  const validateUnitCode = (unitCode: string, hospitalId: string) => {
    if (hospitalId && !unitCode) {
      return 'Please select a unit';
    }
    return '';
  };

  // Update validation errors
  const updateValidationError = (field: string, error: string) => {
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };


  // Dropdown states
  const [hospitalDropdownOpen, setHospitalDropdownOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [specializationDropdownOpen, setSpecializationDropdownOpen] = useState(false);
  const [relationshipDropdownOpen, setRelationshipDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const modalSlideAnim = useRef(new Animated.Value(height)).current;
  const sparkleScale1 = useRef(new Animated.Value(0)).current;
  const sparkleScale2 = useRef(new Animated.Value(0)).current;
  const sparkleScale3 = useRef(new Animated.Value(0)).current;
  const sparkleScale4 = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;

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

  // Relationship options for emergency contact
  const relationshipOptions = [
    'Spouse',
    'Parent',
    'Sibling',
    'Child',
    'Friend',
    'Relative',
    'Other',
  ];

  // Indian states and cities mapping
  const stateCityMapping: Record<string, string[]> = {
    'Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala'],
    'Himachal Pradesh': ['Shimla', 'Mandi', 'Solan', 'Dharamshala'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
    'Manipur': ['Imphal', 'Thoubal', 'Bishnupur'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Champhai'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
    'Sikkim': ['Gangtok', 'Namchi', 'Mangan'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam'],
    'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Rishikesh'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol'],
    'Delhi': ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  };

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
    const error = validateEmail(value);
    updateValidationError('email', error);
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, password: value }));
    const error = validatePassword(value);
    updateValidationError('password', error);
    
    // Also validate confirm password if it exists
    if (formData.confirmPassword) {
      const confirmError = validateConfirmPassword(formData.confirmPassword, value);
      updateValidationError('confirmPassword', confirmError);
    }
  }, [formData.confirmPassword]);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, confirmPassword: value }));
    const error = validateConfirmPassword(value, formData.password);
    updateValidationError('confirmPassword', error);
  }, [formData.password]);

  const handleFirstNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, firstName: value }));
    const error = validateName(value, 'First name');
    updateValidationError('firstName', error);
  }, []);

  const handleLastNameChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, lastName: value }));
    const error = validateName(value, 'Last name');
    updateValidationError('lastName', error);
  }, []);

  const handleLocationChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, location: value }));
    const error = validateLocation(value);
    updateValidationError('location', error);
  }, []);

  const handlePhoneChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, phone: value }));
    const error = validatePhone(value);
    updateValidationError('phone', error);
  }, []);

  const handleLicenseNumberChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, licenseNumber: value }));
    const error = validateLicenseNumber(value);
    updateValidationError('licenseNumber', error);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate the field
    let error = '';
    switch (field) {
      case 'department':
        error = validateDepartment(value);
        break;
      case 'specialization':
        error = validateSpecialization(value, formData.role);
        break;
      case 'role':
        // When role changes, validate specialization if it's doctor
        if (value === 'DOCTOR' && formData.specialization) {
          updateValidationError('specialization', validateSpecialization(formData.specialization, value));
        }
        break;
      default:
        break;
    }
    
    if (error) {
      updateValidationError(field, error);
    } else {
      // Clear error if validation passes
      updateValidationError(field, '');
    }
    
    // If hospital changes, reset unit and load new units
    if (field === 'hospitalId') {
      setFormData(prev => ({ ...prev, hospitalId: value, unitCode: '' }));
      setUnits([]);
      if (value) {
        loadUnits(parseInt(value));
      }
      // Validate hospital assignment
      const hospitalError = validateHospitalAssignment(value, '');
      updateValidationError('hospitalAssignment', hospitalError);
      // Clear unit error since unit is reset
      updateValidationError('unitCode', '');
    }
    
    // If unit changes, validate unit
    if (field === 'unitCode') {
      const unitError = validateUnitCode(value, formData.hospitalId);
      updateValidationError('unitCode', unitError);
      // Also validate hospital assignment
      const hospitalError = validateHospitalAssignment(formData.hospitalId, value);
      updateValidationError('hospitalAssignment', hospitalError);
    }
    
    // If department changes, reset specialization
    if (field === 'department') {
      setFormData(prev => ({ ...prev, department: value, specialization: '' }));
      updateValidationError('specialization', '');
    }
    
    // If state changes, reset city
    if (field === 'state') {
      setFormData(prev => ({ ...prev, state: value, city: '' }));
      updateValidationError('city', '');
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

  // Animate success modal when it appears
  useEffect(() => {
    if (showSuccessModal) {
      // Slide modal up from bottom
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();

      // Animate checkmark with bounce
      setTimeout(() => {
        Animated.sequence([
          Animated.spring(checkmarkScale, {
            toValue: 1.3,
            useNativeDriver: true,
            tension: 100,
            friction: 3,
          }),
          Animated.spring(checkmarkScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 3,
          }),
        ]).start();
      }, 100);

      // Animate sparkles
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(sparkleScale1, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
            delay: 0,
          }),
          Animated.spring(sparkleScale2, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
            delay: 100,
          }),
          Animated.spring(sparkleScale3, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
            delay: 200,
          }),
          Animated.spring(sparkleScale4, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
            delay: 300,
          }),
        ]).start();
      }, 200);
    } else {
      // Reset animations when modal closes
      modalSlideAnim.setValue(height);
      checkmarkScale.setValue(0);
      sparkleScale1.setValue(0);
      sparkleScale2.setValue(0);
      sparkleScale3.setValue(0);
      sparkleScale4.setValue(0);
    }
  }, [showSuccessModal]);


  const validateForm = () => {
    // Validate all fields and collect errors
    const errors: {[key: string]: string} = {};
    
    errors.email = validateEmail(formData.email);
    errors.password = validatePassword(formData.password);
    errors.confirmPassword = validateConfirmPassword(formData.confirmPassword, formData.password);
    errors.firstName = validateName(formData.firstName, 'First name');
    errors.lastName = validateName(formData.lastName, 'Last name');
    errors.department = validateDepartment(formData.department);
    errors.location = validateLocation(formData.location);
    errors.phone = validatePhone(formData.phone);
    
    // License number is required for both DOCTOR and NURSE
    errors.licenseNumber = validateLicenseNumber(formData.licenseNumber);
    
    if (formData.role === 'DOCTOR') {
      errors.specialization = validateSpecialization(formData.specialization, formData.role);
    }
    
    // Emergency Contact and Address fields are now optional
    // Only validate if any field in the section is filled
    const hasEmergencyContact = formData.emergencyContactName || formData.emergencyContactPhone || formData.emergencyContactRelationship;
    if (hasEmergencyContact) {
      if (formData.emergencyContactName) errors.emergencyContactName = validateEmergencyContact(formData.emergencyContactName, 'Contact Name');
      if (formData.emergencyContactPhone) errors.emergencyContactPhone = validateEmergencyContact(formData.emergencyContactPhone, 'Contact Phone');
      if (formData.emergencyContactRelationship) errors.emergencyContactRelationship = validateEmergencyContact(formData.emergencyContactRelationship, 'Relationship');
    }
    
    const hasAddress = formData.street || formData.city || formData.state || formData.zipCode;
    if (hasAddress) {
      if (formData.street) errors.street = validateAddress(formData.street, 'Street Address');
      if (formData.city) errors.city = validateAddress(formData.city, 'City');
      if (formData.state) errors.state = validateAddress(formData.state, 'State');
      if (formData.zipCode) errors.zipCode = validateZipCode(formData.zipCode);
    }
    
    errors.hospitalAssignment = validateHospitalAssignment(formData.hospitalId, formData.unitCode);
    errors.unitCode = validateUnitCode(formData.unitCode, formData.hospitalId);
    
    // Update validation errors state
    setValidationErrors(errors);
    
    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    
    if (hasErrors) {
      Alert.alert('Validation Error', 'Please fix all validation errors before submitting.');
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Only include emergency contact if any field is provided
      const hasEmergencyContact = formData.emergencyContactName || formData.emergencyContactPhone || formData.emergencyContactRelationship;
      const emergencyContact = hasEmergencyContact ? {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
        relationship: formData.emergencyContactRelationship,
      } : undefined;

      // Only include address if any field is provided
      const hasAddress = formData.street || formData.city || formData.state || formData.zipCode;
      const address = hasAddress ? {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      } : undefined;

      const registerData: RegisterRequest = {
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
        ...(emergencyContact && { emergencyContact }),
        ...(address && { address }),
        hospitalId: formData.hospitalId ? parseInt(formData.hospitalId) : undefined,
        unitCode: formData.unitCode || undefined,
      } as RegisterRequest;
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
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={handleSuccessDone} />
      <Animated.View 
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: modalSlideAnim }]
          }
        ]}
      >
        <View style={styles.modalIconContainer}>
          {/* Sparkles around checkmark */}
          <Animated.View 
            style={[
              styles.sparkle,
              styles.sparkle1,
              {
                transform: [{ scale: sparkleScale1 }]
              }
            ]}
          >
            <FontAwesomeIcon icon="star" size={20} color="#FFD700" />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.sparkle,
              styles.sparkle2,
              {
                transform: [{ scale: sparkleScale2 }]
              }
            ]}
          >
            <FontAwesomeIcon icon="star" size={18} color="#C0C0C0" />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.sparkle,
              styles.sparkle3,
              {
                transform: [{ scale: sparkleScale3 }]
              }
            ]}
          >
            <FontAwesomeIcon icon="star" size={18} color="#FFB6C1" />
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.sparkle,
              styles.sparkle4,
              {
                transform: [{ scale: sparkleScale4 }]
              }
            ]}
          >
            <FontAwesomeIcon icon="star" size={16} color="#87CEEB" />
          </Animated.View>
          
          {/* Checkmark */}
          <Animated.View
            style={{
              transform: [{ scale: checkmarkScale }]
            }}
          >
            <FontAwesomeIcon icon="check-circle" size={Responsive.iconSize(64)} color="#4CAF50" />
          </Animated.View>
        </View>
        
        <Text style={styles.modalTitle}>You Have Successfully Registered</Text>
        
        <Text style={styles.modalMessage}>
          Your account has been successfully created. You can now sign in with your credentials.
        </Text>
        
        <TouchableOpacity style={styles.modalDoneButton} onPress={handleSuccessDone}>
          <Text style={styles.modalDoneButtonText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
            <FontAwesomeIcon icon="arrow-left" size={Responsive.iconSize(24)} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.flex1} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={styles.scrollContentContainer}
        >
        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Join Locum Healthcare</Text>
          <Text style={styles.subtitleText}>Fill in your details to get started</Text>

          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                formData.role === 'DOCTOR' && styles.roleTabActive,
              ]}
              onPress={() => handleInputChange('role', 'DOCTOR')}>
              <Text style={[
                styles.roleTabText,
                formData.role === 'DOCTOR' && styles.roleTabTextActive,
              ]}>
                Doctor
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleTab,
                formData.role === 'NURSE' && styles.roleTabActive,
              ]}
              onPress={() => handleInputChange('role', 'NURSE')}>
              <Text style={[
                styles.roleTabText,
                formData.role === 'NURSE' && styles.roleTabTextActive,
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
            error={validationErrors.email}
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
            error={validationErrors.password}
          />

          <InputField
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            placeholder="Confirm your password"
            secureTextEntry={!showConfirmPassword}
            icon="lock"
            showEye={true}
            onToggleEye={() => setShowConfirmPassword(!showConfirmPassword)}
            error={validationErrors.confirmPassword}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="First Name"
                value={formData.firstName}
                onChangeText={handleFirstNameChange}
                placeholder="First name"
                icon="user"
                error={validationErrors.firstName}
              />
            </View>
            <View style={styles.halfWidth}>
              <InputField
                label="Last Name"
                value={formData.lastName}
                onChangeText={handleLastNameChange}
                placeholder="Last name"
                icon="user"
                error={validationErrors.lastName}
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
            error={validationErrors.department}
          />

          <InputField
            label="Location"
            value={formData.location}
            onChangeText={handleLocationChange}
            placeholder="e.g., New York"
            icon="map-marker-alt"
            error={validationErrors.location}
          />

          {formData.role === 'DOCTOR' && (
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
              error={validationErrors.specialization}
            />
          )}

          <InputField
            label="License Number"
            value={formData.licenseNumber}
            onChangeText={handleLicenseNumberChange}
            placeholder={formData.role === 'DOCTOR' ? 'Medical license number' : 'Nursing license number'}
            icon="file-medical"
            error={validationErrors.licenseNumber}
          />

          <InputField
            label="Phone Number"
            value={formData.phone}
            onChangeText={handlePhoneChange}
            placeholder="1234567890"
            keyboardType="numeric"
            icon="phone"
            error={validationErrors.phone}
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
            error={validationErrors.hospitalAssignment}
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
            error={validationErrors.unitCode}
          />
          
        

          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <InputField
            label="Contact Name"
            value={formData.emergencyContactName}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, emergencyContactName: text }));
              const error = validateEmergencyContact(text, 'Contact Name');
              updateValidationError('emergencyContactName', error);
            }}
            placeholder="Emergency contact name"
            icon="user"
            error={validationErrors.emergencyContactName}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <InputField
                label="Contact Phone"
                value={formData.emergencyContactPhone}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, emergencyContactPhone: text }));
                  const error = validateEmergencyContact(text, 'Contact Phone');
                  updateValidationError('emergencyContactPhone', error);
                }}
                placeholder="1234567890"
                keyboardType="numeric"
                icon="phone"
                error={validationErrors.emergencyContactPhone}
              />
            </View>
            <View style={styles.halfWidth}>
              <RelationshipDropdown 
                open={relationshipDropdownOpen}
                setOpen={(open) => {
                  setRelationshipDropdownOpen(open);
                  if (open) {
                    setHospitalDropdownOpen(false);
                    setUnitDropdownOpen(false);
                    setDepartmentDropdownOpen(false);
                    setSpecializationDropdownOpen(false);
                    setStateDropdownOpen(false);
                    setCityDropdownOpen(false);
                  }
                }}
                value={formData.emergencyContactRelationship}
                setValue={(callback) => {
                  const newValue = callback(formData.emergencyContactRelationship);
                  setFormData(prev => ({ ...prev, emergencyContactRelationship: newValue }));
                  const error = validateEmergencyContact(newValue, 'Relationship');
                  updateValidationError('emergencyContactRelationship', error);
                }}
                items={relationshipOptions.map(option => ({
                  label: option,
                  value: option,
                }))}
                placeholder="Select"
                styles={styles}
                error={validationErrors.emergencyContactRelationship}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Address</Text>
          <InputField
            label="Street Address"
            value={formData.street}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, street: text }));
              const error = validateAddress(text, 'Street Address');
              updateValidationError('street', error);
            }}
            placeholder="123 Main St"
            icon="map-marker-alt"
            error={validationErrors.street}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <StateDropdown 
                open={stateDropdownOpen}
                setOpen={(open) => {
                  setStateDropdownOpen(open);
                  if (open) {
                    setHospitalDropdownOpen(false);
                    setUnitDropdownOpen(false);
                    setDepartmentDropdownOpen(false);
                    setSpecializationDropdownOpen(false);
                    setRelationshipDropdownOpen(false);
                    setCityDropdownOpen(false);
                  }
                }}
                value={formData.state}
                setValue={(callback) => {
                  const newValue = callback(formData.state);
                  handleInputChange('state', newValue);
                }}
                items={Object.keys(stateCityMapping).map(state => ({
                  label: state,
                  value: state,
                }))}
                placeholder="Select state"
                styles={styles}
                error={validationErrors.state}
              />
            </View>
            <View style={styles.halfWidth}>
              <CityDropdown 
                open={cityDropdownOpen}
                setOpen={(open) => {
                  setCityDropdownOpen(open);
                  if (open) {
                    setHospitalDropdownOpen(false);
                    setUnitDropdownOpen(false);
                    setDepartmentDropdownOpen(false);
                    setSpecializationDropdownOpen(false);
                    setRelationshipDropdownOpen(false);
                    setStateDropdownOpen(false);
                  }
                }}
                value={formData.city}
                setValue={(callback) => {
                  const newValue = callback(formData.city);
                  setFormData(prev => ({ ...prev, city: newValue }));
                  const error = validateAddress(newValue, 'City');
                  updateValidationError('city', error);
                }}
                items={(stateCityMapping[formData.state] || []).map(city => ({
                  label: city,
                  value: city,
                }))}
                placeholder="Select city"
                styles={styles}
                error={validationErrors.city}
                disabled={!formData.state}
              />
            </View>
          </View>

          <InputField
            label="PIN Code"
            value={formData.zipCode}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, zipCode: text }));
              const error = validateZipCode(text);
              updateValidationError('zipCode', error);
            }}
            placeholder="123456"
            keyboardType="numeric"
            icon="map-marker-alt"
            error={validationErrors.zipCode}
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

      {/* Powered By Section - Fixed at bottom */}
      <View style={styles.poweredByContainer}>
        <Text style={styles.poweredByText}>Powered by</Text>
        <Image
          source={require('../../assets/footer_logo.png')}
          style={styles.companyLogo}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  flex1: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Responsive.verticalScale(24),
    paddingBottom: Responsive.verticalScale(24),
    paddingHorizontal: Responsive.scale(24),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Responsive.verticalScale(46),
  },
  backButton: {
    width: Responsive.scale(40),
    height: Responsive.verticalScale(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Responsive.scale(12),
    marginTop: Responsive.verticalScale(30),
  },
  headerTitle: {
    fontSize: Responsive.fontSize(20),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
    marginTop: Responsive.verticalScale(25),
    marginLeft: Responsive.scale(20),
  },
  content: {
    flex: 1,
    paddingHorizontal: Responsive.scale(24),
    paddingTop: 0,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: Responsive.verticalScale(40),
  },
  formContainer: {
    paddingTop: Responsive.verticalScale(24),
    paddingBottom: Responsive.verticalScale(48),
    paddingHorizontal: 0,
  },
  welcomeText: {
    fontSize: Responsive.fontSize(24),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Responsive.verticalScale(8),
  },
  subtitleText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Responsive.verticalScale(40),
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: Responsive.verticalScale(24),
    marginTop: Responsive.verticalScale(-15),
    marginHorizontal: 0,
    backgroundColor: 'transparent',
    borderRadius: Responsive.scale(12),
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: Responsive.scale(6),
    width: '100%',
    alignSelf: 'stretch',
  },
  roleTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Responsive.verticalScale(14),
    paddingHorizontal: Responsive.scale(8),
    borderRadius: Responsive.scale(8),
    backgroundColor: 'transparent',
    minHeight: 48,
  },
  roleTabActive: {
    backgroundColor: '#000000',
  },
  roleTabText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.medium,
    color: '#999999',
    textAlign: 'center',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.bold,
  },
  inputContainer: {
    marginBottom: Responsive.verticalScale(16),
  },
  inputLabel: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    marginBottom: Responsive.verticalScale(8),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: Responsive.scale(16),
    paddingHorizontal: Responsive.scale(16),
    paddingVertical: Responsive.verticalScale(16),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWrapperError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: Responsive.scale(4),
  },
  errorText: {
    fontSize: Responsive.fontSize(12),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error,
    marginTop: Responsive.verticalScale(4),
    marginLeft: Responsive.scale(4),
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Responsive.fontSize(18),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginTop: Responsive.verticalScale(24),
    marginBottom: Responsive.verticalScale(16),
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: Responsive.scale(16),
    paddingVertical: Responsive.verticalScale(16),
    alignItems: 'center',
    marginTop: Responsive.verticalScale(40),
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
    fontSize: Responsive.fontSize(18),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  loginButton: {
    alignItems: 'center',
    marginTop: Responsive.verticalScale(24),
  },
  loginButtonText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  loginLinkText: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.bold,
  },
  dropdownStyle: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 56,
    paddingHorizontal: Responsive.scale(16),
    paddingVertical: Responsive.verticalScale(16),
  },
  dropdownStyleError: {
    borderColor: Colors.error,
  },
  dropdownTextStyle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  dropdownPlaceholderStyle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textTertiary,
  },
  relationshipPlaceholderStyle: {
    textAlign: 'left',
    paddingLeft: 0,
    marginLeft: 0,
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
  dropdownListItemContainerStyle: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownListItemStyle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Responsive.scale(24),
    borderTopRightRadius: Responsive.scale(24),
    padding: Responsive.scale(28),
    paddingTop: Responsive.scale(24),
    paddingBottom: Responsive.scale(28),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: Responsive.verticalScale(-2),
    },
    shadowOpacity: 0.25,
    shadowRadius: Responsive.scale(20),
    elevation: 8,
    width: '100%',
  },
  modalTitle: {
    fontSize: Responsive.fontSize(24),
    fontFamily: Typography.fontFamily.bold,
    color: '#333333',
    marginBottom: Responsive.verticalScale(12),
    textAlign: 'center',
  },
  modalIconContainer: {
    marginBottom: Responsive.verticalScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    width: Responsive.scale(100),
    height: Responsive.scale(100),
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: Responsive.verticalScale(10),
    left: Responsive.scale(10),
  },
  sparkle2: {
    bottom: Responsive.verticalScale(15),
    left: Responsive.scale(8),
  },
  sparkle3: {
    top: Responsive.verticalScale(15),
    right: Responsive.scale(8),
  },
  sparkle4: {
    bottom: Responsive.verticalScale(10),
    right: Responsive.scale(10),
  },
  modalMessage: {
    fontSize: Responsive.fontSize(15),
    fontFamily: Typography.fontFamily.regular,
    color: '#666666',
    textAlign: 'center',
    lineHeight: Responsive.verticalScale(20),
    marginBottom: Responsive.verticalScale(24),
    paddingHorizontal: Responsive.scale(4),
  },
  modalDoneButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: Responsive.scale(8),
    paddingVertical: Responsive.verticalScale(14),
    paddingHorizontal: Responsive.scale(48),
    alignItems: 'center',
    minWidth: Responsive.scale(140),
    marginBottom: Responsive.verticalScale(0),
  },
  modalDoneButtonText: {
    fontSize: Responsive.fontSize(16),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  modalEditLink: {
    paddingVertical: Responsive.verticalScale(8),
    paddingHorizontal: Responsive.scale(16),
  },
  modalEditLinkText: {
    fontSize: Responsive.fontSize(14),
    fontFamily: Typography.fontFamily.regular,
    color: '#999999',
    textAlign: 'center',
  },
  poweredByContainer: {
    position: 'absolute',
    bottom: IS_VERY_SMALL_DEVICE ? Responsive.hp('2%') : Responsive.hp('1%'),
    right: IS_VERY_SMALL_DEVICE ? Responsive.wp('3%') : Responsive.wp('2%'),
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: Responsive.wp('40%'),
  },
  poweredByText: {
    fontSize: Responsive.fontSize(12),
    fontFamily: Typography.fontFamily.medium, // DM Sans Medium
    color: '#000000',
    marginRight: IS_VERY_SMALL_DEVICE ? Responsive.scale(-15) : Responsive.scale(-25),
  },
  companyLogo: {
    height: IS_VERY_SMALL_DEVICE ? Responsive.verticalScale(12) : Responsive.verticalScale(15),
    width: IS_VERY_SMALL_DEVICE ? Responsive.scale(80) : Responsive.scale(95),
  },
});

export default RegisterScreen;
