import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';
import { Typography } from '../../constants/typography';
import { Colors } from '../../constants/colors';
import { User } from '../../types';
import ApiService from '../../services/api';
import Responsive from '../../utils/responsive';
import SuccessOverlay from '../../components/SuccessOverlay';

// Dropdown options
const relationshipOptions = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'
];

// Department options
const departmentOptions = [
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

// Department-Specialization mapping
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

const cityOptions = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
  'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
  'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi'
];

const stateOptions = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry', 'Jammu and Kashmir', 'Ladakh'
];

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showRelationshipDropdown, setShowRelationshipDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    location: '',
    specialization: '',
    licenseNumber: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await ApiService.getProfile();
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: (userData.phone || '').replace(/^\+91/, ''),
        department: userData.department || '',
        location: userData.location || '',
        specialization: userData.specialization || '',
        licenseNumber: userData.licenseNumber || '',
        emergencyContact: {
          name: userData.emergencyContact?.name || '',
          phone: (userData.emergencyContact?.phone || '').replace(/^\+91/, ''),
          relationship: userData.emergencyContact?.relationship || '',
        },
        address: {
          street: userData.address?.street || '',
          city: userData.address?.city || '',
          state: userData.address?.state || '',
          zipCode: userData.address?.zipCode || '',
          country: userData.address?.country || 'India',
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile data');
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validatePIN = (pin: string) => {
    const pinRegex = /^\d{6}$/;
    return pinRegex.test(pin);
  };

  const validateField = (field: string, value: string, section?: string) => {
    let error = '';
    
    switch (field) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) {
          error = `${field === 'firstName' ? 'First' : 'Last'} name is required`;
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!validateEmail(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (value.trim() && !validatePhone(value.trim())) {
          error = 'Please enter a valid 10-digit phone number starting with 6-9';
        }
        break;
      case 'department':
        if (value.trim() && value.trim().length < 2) {
          error = 'Department name should be at least 2 characters';
        }
        break;
      case 'location':
        if (value.trim() && value.trim().length < 2) {
          error = 'Location should be at least 2 characters';
        }
        break;
      case 'specialization':
        if (value.trim() && value.trim().length < 2) {
          error = 'Specialization should be at least 2 characters';
        }
        break;
      case 'licenseNumber':
        if (value.trim() && value.trim().length < 5) {
          error = 'License number should be at least 5 characters';
        }
        break;
      case 'zipCode':
        if (value.trim() && !validatePIN(value.trim())) {
          error = 'Please enter a valid 6-digit PIN code';
        }
        break;
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [section ? `${section}.${field}` : field]: error
    }));
    
    return error === '';
  };

  const showSuccessAnimation = () => {
    setShowSuccessModal(true);
  };

  const handleSave = async () => {
    // Required field validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    // Email validation
    if (!validateEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Phone validation (if provided)
    if (formData.phone.trim() && !validatePhone(formData.phone.trim())) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number starting with 6-9');
      return;
    }

    // PIN code validation (if provided)
    if (formData.address.zipCode.trim() && !validatePIN(formData.address.zipCode.trim())) {
      Alert.alert('Error', 'Please enter a valid 6-digit PIN code');
      return;
    }

    // Emergency contact phone validation (if provided)
    if (formData.emergencyContact.phone.trim() && !validatePhone(formData.emergencyContact.phone.trim())) {
      Alert.alert('Error', 'Please enter a valid 10-digit emergency contact phone number');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare payload - remove licenseNumber if user is not a doctor or if it's empty
      const payload = { ...formData };
      if (user?.role !== 'DOCTOR' || !payload.licenseNumber.trim()) {
        delete payload.licenseNumber;
      }
      
      await ApiService.updateProfile(payload);
      setIsLoading(false);
      showSuccessAnimation();
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const getSpecializationOptions = () => {
    if (!formData.department) return [];
    return departmentSpecializations[formData.department] || [];
  };

  const updateFormData = (field: string, value: string, section?: string) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof typeof prev],
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
    
    // If department changes, reset specialization
    if (field === 'department' && !section) {
      setFormData(prev => ({
        ...prev,
        specialization: '',
      }));
      setValidationErrors(prev => ({
        ...prev,
        specialization: '',
      }));
    }
    
    // Validate the field in real-time
    validateField(field, value, section);
  };

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader
        title="Edit Profile"
        showBackButton={true}
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}
        backButtonStyle={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#d1d5db' }}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.formCard}>
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>First Name *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      validationErrors.firstName && styles.textInputError
                    ]}
                    value={formData.firstName}
                    onChangeText={(value) => updateFormData('firstName', value)}
                    placeholder="Enter first name"
                  />
                  {validationErrors.firstName && (
                    <Text style={styles.errorText}>{validationErrors.firstName}</Text>
                  )}
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Last Name *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      validationErrors.lastName && styles.textInputError
                    ]}
                    value={formData.lastName}
                    onChangeText={(value) => updateFormData('lastName', value)}
                    placeholder="Enter last name"
                  />
                  {validationErrors.lastName && (
                    <Text style={styles.errorText}>{validationErrors.lastName}</Text>
                  )}
                </View>
              </View>

                             <View style={[styles.inputContainer, styles.departmentFieldSpacing]}>
                 <Text style={styles.inputLabel}>Department</Text>
                 <View style={styles.readOnlyInput}>
                   <Text style={styles.readOnlyText}>
                     {formData.department || 'Not specified'}
                   </Text>
                 </View>
               </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    validationErrors.location && styles.textInputError
                  ]}
                  value={formData.location}
                  onChangeText={(value) => updateFormData('location', value)}
                  placeholder="Enter location"
                />
                {validationErrors.location && (
                  <Text style={styles.errorText}>{validationErrors.location}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email *</Text>
                <View style={styles.readOnlyInput}>
                  <Text style={styles.readOnlyText}>
                    {formData.email || 'Not specified'}
                  </Text>
                </View>
              </View>

              <View style={[styles.inputContainer, styles.phoneFieldSpacing]}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    validationErrors.phone && styles.textInputError
                  ]}
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
                {validationErrors.phone && (
                  <Text style={styles.errorText}>{validationErrors.phone}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Specialization</Text>
                <View style={styles.readOnlyInput}>
                  <Text style={styles.readOnlyText}>
                    {formData.specialization || 'Not specified'}
                  </Text>
                </View>
              </View>

              {user?.role === 'DOCTOR' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>License Number</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      validationErrors.licenseNumber && styles.textInputError
                    ]}
                    value={formData.licenseNumber}
                    onChangeText={(value) => updateFormData('licenseNumber', value)}
                    placeholder="Enter license number"
                  />
                  {validationErrors.licenseNumber && (
                    <Text style={styles.errorText}>{validationErrors.licenseNumber}</Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            
            <View style={styles.formCard}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Contact Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.emergencyContact.name}
                  onChangeText={(value) => updateFormData('name', value, 'emergencyContact')}
                  placeholder="Enter contact name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Contact Phone</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    validationErrors['emergencyContact.phone'] && styles.textInputError
                  ]}
                  value={formData.emergencyContact.phone}
                  onChangeText={(value) => updateFormData('phone', value, 'emergencyContact')}
                  placeholder="Enter contact phone"
                  keyboardType="phone-pad"
                />
                {validationErrors['emergencyContact.phone'] && (
                  <Text style={styles.errorText}>{validationErrors['emergencyContact.phone']}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Relationship</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                    setShowRelationshipDropdown(!showRelationshipDropdown);
                    setShowCityDropdown(false);
                    setShowStateDropdown(false);
                  }}>
                  <Text style={[styles.dropdownText, !formData.emergencyContact.relationship && styles.placeholderText]}>
                    {formData.emergencyContact.relationship || 'Select relationship'}
                  </Text>
                  <FontAwesomeIcon 
                    icon={showRelationshipDropdown ? "chevron-up" : "chevron-down"} 
                    size={Responsive.iconSize(16)} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
                {showRelationshipDropdown && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView 
                      style={styles.dropdownList} 
                      contentContainerStyle={styles.dropdownScrollContent}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}>
                      {relationshipOptions.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => {
                            updateFormData('relationship', option, 'emergencyContact');
                            setShowRelationshipDropdown(false);
                          }}>
                          <Text style={styles.dropdownItemText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            
            <View style={styles.formCard}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Street</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.address.street}
                  onChangeText={(value) => updateFormData('street', value, 'address')}
                  placeholder="Enter street address"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowCityDropdown(!showCityDropdown);
                      setShowRelationshipDropdown(false);
                      setShowStateDropdown(false);
                    }}>
                    <Text style={[styles.dropdownText, !formData.address.city && styles.placeholderText]}>
                      {formData.address.city || 'Select city'}
                    </Text>
                    <FontAwesomeIcon 
                      icon={showCityDropdown ? "chevron-up" : "chevron-down"} 
                      size={Responsive.iconSize(16)} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                  {showCityDropdown && (
                    <View style={styles.dropdownContainer}>
                      <ScrollView 
                      style={styles.dropdownList} 
                      contentContainerStyle={styles.dropdownScrollContent}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}>
                        {cityOptions.map((option, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownItem}
                            onPress={() => {
                              updateFormData('city', option, 'address');
                              setShowCityDropdown(false);
                            }}>
                            <Text style={styles.dropdownItemText}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => {
                      setShowStateDropdown(!showStateDropdown);
                      setShowRelationshipDropdown(false);
                      setShowCityDropdown(false);
                    }}>
                    <Text style={[styles.dropdownText, !formData.address.state && styles.placeholderText]}>
                      {formData.address.state || 'Select state'}
                    </Text>
                    <FontAwesomeIcon 
                      icon={showStateDropdown ? "chevron-up" : "chevron-down"} 
                      size={Responsive.iconSize(16)} 
                      color="#6B7280" 
                    />
                  </TouchableOpacity>
                  {showStateDropdown && (
                    <View style={styles.dropdownContainer}>
                      <ScrollView 
                      style={styles.dropdownList} 
                      contentContainerStyle={styles.dropdownScrollContent}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}>
                        {stateOptions.map((option, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownItem}
                            onPress={() => {
                              updateFormData('state', option, 'address');
                              setShowStateDropdown(false);
                            }}>
                            <Text style={styles.dropdownItemText}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              <View style={[styles.inputRow, styles.pinCountryRowSpacing]}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>PIN Code</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      validationErrors['address.zipCode'] && styles.textInputError
                    ]}
                    value={formData.address.zipCode}
                    onChangeText={(value) => updateFormData('zipCode', value, 'address')}
                    placeholder="Enter PIN code"
                    keyboardType="numeric"
                  />
                  {validationErrors['address.zipCode'] && (
                    <Text style={styles.errorText}>{validationErrors['address.zipCode']}</Text>
                  )}
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <View style={styles.readOnlyInput}>
                    <Text style={styles.readOnlyText}>
                      {formData.address.country || 'Not specified'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <FontAwesomeIcon icon="check" size={Responsive.iconSize(18)} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
         </ScrollView>
       </KeyboardAvoidingView>

       {/* Success Screen */}
      <SuccessOverlay 
        visible={showSuccessModal}
        title="Success!"
        message="Profile updated successfully"
        durationMs={2000}
        onDismiss={() => { setShowSuccessModal(false); (navigation as any).goBack(); }}
      />

     </SafeAreaView>
   );
 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
  },
  scrollContentContainer: {
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    flex: 1,
    marginRight: 10,
  },
  inputContainer: {
    marginBottom: 16,
  },
  pinCodeContainer: {
    marginTop: 8,
  },
  departmentFieldSpacing: {
    marginTop: 8,
  },
  phoneFieldSpacing: {
    marginTop: 8,
  },
  pinCountryRowSpacing: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  readOnlyText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: '#6B7280',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C2A3A',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownButtonError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownContainer: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownList: {
    maxHeight: 150,
    flexGrow: 0,
  },
  dropdownScrollContent: {
    flexGrow: 1,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
    color: '#111827',
  },
  textInputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  successFullScreen: {
    flex: 1,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 32,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.regular,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
  },
});

export default EditProfileScreen;
