import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  Dimensions,
  Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '../../utils/icons';
import GlobalHeader from '../../components/GlobalHeader';

import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../constants/spacing';
import ApiService from '../../services/api';
import Responsive from '../../utils/responsive';
import { useAuth } from '../../navigation/AppNavigator';
import { useAppColors } from '../../hooks/useAppColors';

const { width } = Dimensions.get('window');

// Toast Modal Component
const ToastModal = ({ visible, message, type = 'error', onClose }: { visible: boolean; message: string; type?: 'success' | 'error'; onClose: () => void }) => {
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const backgroundColor = type === 'success' ? Colors.success : Colors.error;
  const icon = type === 'success' ? 'check-circle' : 'exclamation-triangle';

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={styles.toastContainer} pointerEvents="box-none">
        <Animated.View 
          style={[
            styles.toast, 
            { 
              transform: [{ translateY: slideAnim }], 
              opacity: opacityAnim,
              backgroundColor 
            }
          ]}>
          <FontAwesomeIcon icon={icon} size={24} color={Colors.white} />
          <Text style={styles.toastMessage}>{message}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.toastClose}>
            <FontAwesomeIcon icon="times" size={16} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Reusable input components
const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error,
  maxWords,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  maxWords?: number;
}) => {
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const wordCount = getWordCount(value);
  const isOverLimit = maxWords ? wordCount > maxWords : false;

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.textInput, multiline && styles.multilineInput, error && styles.textInputError]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          blurOnSubmit={false}
          maxLength={maxWords ? undefined : undefined}
        />
      </View>
      {maxWords && (
        <View style={styles.wordCountWrapper}>
          <Text style={[styles.wordCount, isOverLimit && styles.wordCountError]}>
            {wordCount}/{maxWords}
          </Text>
        </View>
      )}
      {/* inline error hidden; highlight via border only */}
    </View>
  );
};

// Date input component
const DateField = ({
  label,
  value,
  onChange,
  placeholder = 'DD-MM-YYYY',
  error,
  maximumDate,
  minimumDate,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}) => {
  const [show, setShow] = useState(false);

  const parseDateString = (dateString: string): Date => {
    const match = dateString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const formatDate = (date: Date): string => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWithClear}>
        <TouchableOpacity onPress={() => setShow(true)} activeOpacity={0.8} style={styles.inputTouchable}>
          <TextInput
            style={[styles.textInput, error && styles.textInputError]}
            placeholder={placeholder}
            placeholderTextColor={Colors.textTertiary}
            value={value}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
        {value && (
          <TouchableOpacity 
            onPress={() => onChange('')} 
            style={styles.clearButton}
            activeOpacity={0.7}>
            <FontAwesomeIcon icon="times" size={Responsive.iconSize(16)} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
      {/* inline error hidden; highlight via border only */}
      {show && (
        <DateTimePicker
          value={value ? parseDateString(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={(event: any, selectedDate?: Date) => {
            if (Platform.OS === 'android') {
              setShow(false);
            }
            if (selectedDate) {
              onChange(formatDate(selectedDate));
            }
          }}
        />
      )}
    </View>
  );
};

// Time input component
const TimeField = ({
  label,
  value,
  onChange,
  placeholder = 'HH:MM AM/PM',
  error,
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  error?: string;
}) => {
  const [show, setShow] = useState(false);

  const parseTimeString = (timeString: string): Date => {
    // Handle 12-hour format with AM/PM: HH:MM AM/PM
    const match12 = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = parseInt(match12[2], 10);
      const period = match12[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    
    // Handle 24-hour format: HH:MM
    const match24 = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const hours = parseInt(match24[1], 10);
      const minutes = parseInt(match24[2], 10);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    
    return new Date();
  };

  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    if (hours > 12) {
      hours -= 12;
    } else if (hours === 0) {
      hours = 12;
    }
    
    return `${hours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWithClear}>
        <TouchableOpacity onPress={() => setShow(true)} activeOpacity={0.8} style={styles.inputTouchable}>
          <TextInput
            style={[styles.textInput, error && styles.textInputError]}
            placeholder={placeholder}
            placeholderTextColor={Colors.textTertiary}
            value={value}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>
        {value && (
          <TouchableOpacity 
            onPress={() => onChange('')} 
            style={styles.clearButton}
            activeOpacity={0.7}>
            <FontAwesomeIcon icon="times" size={Responsive.iconSize(16)} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
      {/* inline error hidden; highlight via border only */}
      {show && (
        <DateTimePicker
          value={value ? parseTimeString(value) : new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour={false}
          onChange={(event: any, selectedTime?: Date) => {
            if (Platform.OS === 'android') {
              setShow(false);
            }
            if (selectedTime) {
              onChange(formatTime(selectedTime));
            }
          }}
        />
      )}
    </View>
  );
};

// Dropdown components
type SingleSelectItem = { label: string; value: string };

type SingleSelectDropdownProps = {
  label: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (callback: (prev: string) => string) => void;
  items: SingleSelectItem[];
  placeholder?: string;
  styles: any;
  error?: string;
  loading?: boolean;
  allowSearch?: boolean;
  disabled?: boolean;
};

const SingleSelectDropdown: React.FC<SingleSelectDropdownProps> = ({
  label,
  open,
  setOpen,
  value,
  setValue,
  items,
  placeholder,
  styles,
  error,
  loading,
  allowSearch = false,
  disabled = false,
}) => {
  const appColors = useAppColors();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
    }
  }, [open]);

  const selectedItem = items.find((item) => item.value === value);
  const displayLabel = selectedItem?.label ?? placeholder ?? `Select ${label}`;

  const filteredItems = allowSearch
    ? items.filter((item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : items;

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          disabled && styles.dropdownTriggerDisabled,
          error && styles.dropdownTriggerError,
        ]}
        activeOpacity={disabled ? 1 : 0.8}
        onPress={() => {
          if (!disabled) {
            setOpen(true);
          }
        }}
        disabled={disabled}>
        <Text
          style={[
            styles.dropdownTriggerText,
            !selectedItem && styles.dropdownTriggerPlaceholder,
            disabled && styles.dropdownTriggerDisabledText,
            {
              color: selectedItem
                ? appColors.textPrimary
                : appColors.textSecondary,
            },
          ]}
          numberOfLines={1}>
          {displayLabel}
        </Text>
        <FontAwesomeIcon
          icon={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={appColors.textSecondary}
          style={disabled ? { opacity: 0.5 } : undefined}
        />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <View style={styles.dropdownBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={[styles.dropdownModal, { backgroundColor: appColors.accentText }]}>
            <View style={styles.dropdownModalHeader}>
              <Text style={[styles.dropdownModalTitle, { color: appColors.textPrimary }]}>
                {`Select ${label}`}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <FontAwesomeIcon icon="times" size={18} color={appColors.textSecondary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.dropdownLoading}>
                <ActivityIndicator color={appColors.primary} />
              </View>
            ) : (
              <>
                {allowSearch && (
                  <View style={[styles.dropdownSearchContainer, { borderColor: appColors.border }]}>
                    <FontAwesomeIcon icon="search" size={14} color={appColors.textSecondary} />
                    <TextInput
                      style={[styles.dropdownSearchInput, { color: appColors.textPrimary }]}
                      placeholder={`Search ${label}`}
                      placeholderTextColor={appColors.textSecondary}
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                    />
                  </View>
                )}
                <ScrollView style={styles.dropdownList}>
                  {filteredItems.length === 0 ? (
                    <Text style={[styles.dropdownEmptyText, { color: appColors.textSecondary }]}>
                      No options available
                    </Text>
                  ) : (
                    filteredItems.map((option) => {
                      const isSelected = option.value === value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.dropdownOption,
                            isSelected && {
                              backgroundColor: appColors.primary + '15',
                              borderColor: appColors.primary,
                            },
                          ]}
                          activeOpacity={0.8}
                          onPress={() => {
                            setValue(() => option.value);
                            setOpen(false);
                          }}>
                          <Text style={[styles.dropdownOptionLabel, { color: appColors.textPrimary }]}>
                            {option.label}
                          </Text>
                          {isSelected && (
                            <FontAwesomeIcon icon="check" size={14} color={appColors.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

type MultiSelectDropdownProps = {
  label: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string[];
  setValue: (callback: (prev: string[]) => string[]) => void;
  items: SingleSelectItem[];
  placeholder?: string;
  styles: any;
  error?: string;
};

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  open,
  setOpen,
  value,
  setValue,
  items,
  placeholder,
  styles,
  error,
}) => {
  const appColors = useAppColors();

  const toggleValue = (optionValue: string) => {
    setValue((prev) => {
      if (prev.includes(optionValue)) {
        return prev.filter((item) => item !== optionValue);
      }
      return [...prev, optionValue];
    });
  };

  const displayText =
    value.length === 0
      ? placeholder || `Select ${label}`
      : value.length <= 2
      ? value.join(', ')
      : `${value.slice(0, 2).join(', ')} +${value.length - 2} more`;

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          error && styles.dropdownTriggerError,
        ]}
        activeOpacity={0.8}
        onPress={() => setOpen(true)}>
        <Text
          style={[
            styles.dropdownTriggerText,
            value.length === 0 && styles.dropdownTriggerPlaceholder,
            { color: value.length ? appColors.textPrimary : appColors.textSecondary },
          ]}
          numberOfLines={1}>
          {displayText}
        </Text>
        <FontAwesomeIcon
          icon={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={appColors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <View style={styles.dropdownBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={[styles.dropdownModalLarge, { backgroundColor: appColors.accentText }]}>
            <View style={styles.dropdownModalHeader}>
              <Text style={[styles.dropdownModalTitle, { color: appColors.textPrimary }]}>
                {`Select ${label}`}
              </Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <FontAwesomeIcon icon="times" size={18} color={appColors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              {items.length === 0 ? (
                <Text style={[styles.dropdownEmptyText, { color: appColors.textSecondary }]}>
                  No options available
                </Text>
              ) : (
                items.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownOption,
                        isSelected && {
                          backgroundColor: appColors.primary + '15',
                          borderColor: appColors.primary,
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => toggleValue(option.value)}>
                      <Text style={[styles.dropdownOptionLabel, { color: appColors.textPrimary }]}>
                        {option.label}
                      </Text>
                      {isSelected && (
                        <FontAwesomeIcon icon="check" size={14} color={appColors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalPrimaryButton, { backgroundColor: appColors.primary }]}
              activeOpacity={0.85}
              onPress={() => setOpen(false)}>
              <Text style={[styles.modalPrimaryButtonText, { color: appColors.accentText }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DepartmentDropdown = (props: Omit<SingleSelectDropdownProps, 'label'>) => (
  <SingleSelectDropdown label="Department" allowSearch {...props} />
);

const SpecializationDropdown = (props: Omit<SingleSelectDropdownProps, 'label'>) => (
  <SingleSelectDropdown label="Specialization" allowSearch {...props} />
);

const HospitalDropdown = (props: Omit<SingleSelectDropdownProps, 'label'>) => (
  <SingleSelectDropdown label="Hospital" allowSearch {...props} />
);

const UnitDropdown = (props: Omit<SingleSelectDropdownProps, 'label'>) => (
  <SingleSelectDropdown label="Unit" allowSearch {...props} />
);

const StateDropdown = (props: Omit<SingleSelectDropdownProps, 'label'>) => (
  <SingleSelectDropdown label="State" allowSearch {...props} />
);

const CityDropdown = (props: Omit<SingleSelectDropdownProps, 'label'>) => (
  <SingleSelectDropdown label="City" allowSearch {...props} />
);

const CountryDropdown = (props: Omit<SingleSelectDropdownProps, 'label'>) => (
  <SingleSelectDropdown label="Country" allowSearch {...props} />
);

// Experience years dropdown (0-25 years)
const ExperienceDropdown = ({
  open,
  setOpen,
  value,
  setValue,
  styles,
  error
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (callback: (prev: string) => string) => void;
  styles: any;
  error?: string;
}) => {
  const items = Array.from({ length: 26 }, (_, i) => ({ label: `${i} year${i === 1 ? '' : 's'}`, value: String(i) }));
  return (
    <SingleSelectDropdown
      label="Experience"
      open={open}
      setOpen={setOpen}
      value={value}
      setValue={setValue}
      items={items}
      placeholder="Select"
      styles={styles}
      error={error}
    />
  );
};

// (moved) SkillsDropdown defined after departmentRequiredSkills mapping

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
      {value && <FontAwesomeIcon icon="check" size={Responsive.iconSize(16)} color={Colors.white} />}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

// Accordion Section Component
const AccordionSection = ({ 
  title, 
  icon, 
  isExpanded, 
  onToggle, 
  children,
  isComplete 
}: {
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isComplete: boolean;
}) => {
  return (
    <View style={[styles.accordionSection, isExpanded && styles.accordionSectionExpanded]}>
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={onToggle}
        activeOpacity={0.7}>
        <View style={styles.accordionHeaderLeft}>
          <View style={[styles.accordionIconContainer, isComplete && styles.accordionIconComplete]}>
            <FontAwesomeIcon 
              icon={isComplete ? 'check-circle' : icon} 
              size={Responsive.iconSize(20)} 
              color={Colors.white} 
            />
          </View>
          <Text style={styles.accordionTitle}>{title}</Text>
        </View>
        <FontAwesomeIcon 
          icon={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={Responsive.iconSize(18)} 
          color={Colors.textSecondary} 
        />
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.accordionContent}>
          {children}
        </View>
      )}
    </View>
  );
};

const CreateJobScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { height } = Dimensions.get('window');
  const [isLoading, setIsLoading] = useState(false);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const modalSlideAnim = useRef(new Animated.Value(height)).current;
  const sparkleScale1 = useRef(new Animated.Value(0)).current;
  const sparkleScale2 = useRef(new Animated.Value(0)).current;
  const sparkleScale3 = useRef(new Animated.Value(0)).current;
  const sparkleScale4 = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  
  const { user } = useAuth();

  // Get recreate job data from route params if available
  const recreateJobData = (route.params as any)?.recreateJobData;

  // Track keyboard visibility to avoid auto-expanding sections while typing (which can drop TextInput focus)
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [formData, setFormData] = useState({
    title: recreateJobData?.title || '',
    description: recreateJobData?.description || '',
    department: recreateJobData?.department || '',
    location: recreateJobData?.location || '',
    requiredRole: (recreateJobData?.requiredRole || (user?.role === 'AGENCY' ? 'AGENCY' : 'DOCTOR')) as 'DOCTOR' | 'NURSE' | 'AGENCY',
    specialization: recreateJobData?.specialization || '',
    startDate: recreateJobData?.startDate || '', // Will be empty for recreation
    endDate: recreateJobData?.endDate || '', // Will be empty for recreation
    startTime: recreateJobData?.startTime || '', // Will be empty for recreation
    endTime: recreateJobData?.endTime || '', // Will be empty for recreation
    hourlyRate: recreateJobData?.hourlyRate || '',
    priority: (recreateJobData?.priority || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    maxAssignments: recreateJobData?.maxAssignments || '',
    hospitalId: recreateJobData?.hospitalId || '',
    unitCode: recreateJobData?.unitCode || '',
    facilityName: recreateJobData?.facilityName || '',
    facilityStreet: recreateJobData?.facilityStreet || '',
    facilityCity: recreateJobData?.facilityCity || '',
    facilityState: recreateJobData?.facilityState || '',
    facilityZipCode: recreateJobData?.facilityZipCode || '',
    facilityCountry: recreateJobData?.facilityCountry || '',
    contactName: recreateJobData?.contactName || '',
    contactPhone: recreateJobData?.contactPhone || '',
    contactEmail: recreateJobData?.contactEmail || '',
    contactPosition: recreateJobData?.contactPosition || '',
    notes: recreateJobData?.notes || '',
    boardCertified: recreateJobData?.boardCertified || false,
    experience: recreateJobData?.experience || '',
    skills: recreateJobData?.skills || '',
    mealAllowance: recreateJobData?.mealAllowance || false,
    parking: recreateJobData?.parking || false,
    malpractice: recreateJobData?.malpractice || false,
  });

  // Accordion section states
  const [expandedSections, setExpandedSections] = useState({
    jobDetails: true,
    scheduleCompensation: false,
    facilityLocation: false,
    contactInfo: false,
    requirementsBenefits: false,
    additionalInfo: false,
  });

  // Hospital and unit data
  const [hospitals, setHospitals] = useState<Array<{ id: number, name: string }>>([]);
  const [units, setUnits] = useState<Array<{ code: string, name: string }>>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Dropdown states
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [specializationDropdownOpen, setSpecializationDropdownOpen] = useState(false);
  const [hospitalDropdownOpen, setHospitalDropdownOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false);

  // Validation and Toast states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState({ visible: false, message: '', type: 'error' as 'success' | 'error' });

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

  // Department → suggested skills (4-5 per department)
  const departmentRequiredSkills: Record<string, string[]> = {
    'Emergency Medicine': ['Triage', 'ACLS', 'BLS', 'Rapid Assessment', 'Trauma Care'],
    'General Medicine': ['History Taking', 'IV Cannulation', 'Medication Admin', 'Vitals Monitoring', 'Case Notes'],
    'General Surgery': ['Pre-op Prep', 'Post-op Care', 'Suturing Assist', 'Instrument Handling', 'Sterile Technique'],
    'Obstetrics & Gynecology': ['Antenatal Care', 'Labor Support', 'Fetal Monitoring', 'Postnatal Care', 'OR Assist'],
    'Pediatrics': ['Growth Assessment', 'Immunization', 'Pediatric IV', 'Neonatal Care', 'Family Education'],
    'Orthopedics': ['Cast Application', 'Traction Setup', 'Mobility Support', 'Post-op Ortho Care', 'Pain Management'],
    'Cardiology': ['ECG', 'Telemetry', 'CPR', 'Cardiac Monitoring', 'Medication Titration'],
    'Neurology': ['Neuro Checks', 'Stroke Protocol', 'Seizure Care', 'Mobility Support', 'Cognitive Assessments'],
    'Urology': ['Catheter Care', 'OR Assist', 'Post-op Uro Care', 'Fluid Balance', 'Patient Education'],
    'Nephrology': ['Dialysis Setup', 'Access Care', 'Fluid Management', 'Electrolyte Monitoring', 'Infection Control'],
    'Gastroenterology': ['Endoscopy Assist', 'Diet Management', 'IV Therapy', 'GI Assessments', 'Patient Prep'],
    'Oncology': ['Chemo Handling', 'Neutropenic Precautions', 'Pain Control', 'Vitals', 'Patient Education'],
    'ENT': ['Ear Irrigation', 'Post-op ENT Care', 'Instrument Handling', 'Airway Care', 'Audiometry Assist'],
    'Ophthalmology': ['Eye Drops Admin', 'Post-op Eye Care', 'Visual Acuity', 'Instrument Handling', 'OR Assist'],
    'Dermatology': ['Wound Care', 'Dressing', 'Allergy Testing Assist', 'Topical Therapy', 'Patient Education'],
    'Psychiatry': ['De-escalation', 'Observation', 'Medication Admin', 'Counsel Support', 'Care Plans'],
    'Radiology': ['Patient Prep', 'Positioning Assist', 'Safety Protocols', 'Contrast Handling', 'Post-procedure Care'],
    'Pathology': ['Sample Handling', 'Labeling', 'QC Basics', 'Lab Safety', 'Inventory'],
    'Anesthesiology': ['Airway Assist', 'Monitoring', 'Equipment Prep', 'Recovery Support', 'Checklist'],
    'Physiotherapy': ['Exercise Plans', 'Mobility Training', 'Respiratory Physio', 'Pain Modulation', 'Education'],
  };

// Skills dropdown – multi-select based on current department
const SkillsDropdown = ({
  open,
  setOpen,
  department,
  value,
  setValue,
  styles,
  error
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  department: string;
  value: string[];
  setValue: (callback: (prev: string[]) => string[]) => void;
  styles: any;
  error?: string;
}) => {
  const skills = (departmentRequiredSkills as any)[department] || [];
  const items = skills.map((s: string) => ({ label: s, value: s }));
  return (
    <MultiSelectDropdown
      label="Required Skills"
      open={open}
      setOpen={setOpen}
      value={value}
      setValue={setValue}
      items={items}
      placeholder="Select"
      styles={styles}
      error={error}
    />
  );
  };

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

  const countryList = [
    'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 
    'New Zealand', 'Singapore', 'UAE', 'Saudi Arabia', 'Qatar', 
    'Kuwait', 'Oman', 'Bahrain', 'Bangladesh', 'Nepal', 'Sri Lanka'
  ];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sectionOrder: Array<keyof typeof expandedSections> = [
    'jobDetails',
    'scheduleCompensation',
    'facilityLocation',
    'contactInfo',
    'requirementsBenefits',
    'additionalInfo',
  ];

  const openOnlySection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      jobDetails: section === 'jobDetails',
      scheduleCompensation: section === 'scheduleCompensation',
      facilityLocation: section === 'facilityLocation',
      contactInfo: section === 'contactInfo',
      requirementsBenefits: section === 'requirementsBenefits',
      additionalInfo: section === 'additionalInfo',
    });
  };

  const openAllSections = () => {
    setExpandedSections({
      jobDetails: true,
      scheduleCompensation: true,
      facilityLocation: true,
      contactInfo: true,
      requirementsBenefits: true,
      additionalInfo: true,
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    if (field === 'department') {
      setFormData(prev => ({ ...prev, department: value as string, specialization: '', skills: '' }));
    }
    
    if (field === 'hospitalId') {
      setFormData(prev => ({ ...prev, hospitalId: value as string, unitCode: '' }));
      setUnits([]);
      if (value) {
        loadUnits(parseInt(value as string));
      }
    }
    
    if (field === 'facilityState') {
      setFormData(prev => ({ ...prev, facilityState: value as string, facilityCity: '' }));
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
      setToast({ visible: true, message: 'failed to connect to server. please check your network connection and try again.', type: 'error' });
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
      setToast({ visible: true, message: 'failed to load units for the selected hospital. please try again.', type: 'error' });
      setUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  }, []);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  // Load units if hospitalId is provided from recreate job data
  useEffect(() => {
    if (formData.hospitalId) {
      const hospitalIdNum = parseInt(formData.hospitalId);
      if (!isNaN(hospitalIdNum)) {
        loadUnits(hospitalIdNum);
      }
    }
  }, [formData.hospitalId, loadUnits]);

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

  // Check section completion
  const isSectionComplete = (section: string) => {
    switch (section) {
      case 'jobDetails':
        return !!(formData.title && formData.description && formData.department && formData.location && formData.requiredRole);
      case 'scheduleCompensation':
        return !!(formData.startDate && formData.endDate && formData.startTime && formData.endTime && formData.hourlyRate);
      case 'facilityLocation':
        return !!(formData.hospitalId && formData.unitCode && formData.facilityName && formData.facilityStreet && formData.facilityCity && formData.facilityState && formData.facilityZipCode);
      case 'contactInfo':
        return !!(formData.contactName && formData.contactPhone && formData.contactEmail && formData.contactPosition);
      case 'requirementsBenefits':
        return !!(formData.experience || formData.skills);
      case 'additionalInfo':
        return !!formData.notes;
      default:
        return false;
    }
  };

  // Auto-open the next accordion only after the current one is completed
  // Guarded so it DOES NOT trigger while keyboard is open (prevents TextInput focus loss)
  useEffect(() => {
    if (keyboardVisible) return; // don't change layout while typing
    for (let i = 0; i < sectionOrder.length - 1; i++) {
      const current = sectionOrder[i];
      const next = sectionOrder[i + 1];
      if (expandedSections[current] && isSectionComplete(current) && !expandedSections[next]) {
        setExpandedSections(prev => ({ ...prev, [next]: true }));
        break;
      }
    }
  }, [formData, expandedSections, keyboardVisible]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const requiredFields = [
      'title', 'description', 'department', 'location', 'startDate', 'endDate',
      'startTime', 'endTime', 'hourlyRate', 'facilityName', 'facilityStreet',
      'facilityCity', 'facilityState', 'facilityZipCode', 'contactName',
      'contactPhone', 'contactEmail', 'contactPosition', 'hospitalId', 'unitCode',
      // Additional required fields per request
      'experience', 'skills', 'notes'
    ];

    const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
        errors[field] = `${capitalize(fieldName)} is required`;
      }
    }

    if (!formData.department) {
      errors.department = 'Please select a department';
    }

    if (formData.requiredRole === 'DOCTOR' && !formData.specialization) {
      errors.specialization = 'Please select a specialization for doctors';
    }

    if (formData.requiredRole === 'DOCTOR' && formData.specialization && formData.department) {
      const validSpecializations = departmentSpecializations[formData.department] || [];
      if (!validSpecializations.includes(formData.specialization)) {
        errors.specialization = `Selected specialization is not valid for department "${formData.department}"`;
      }
    }

    if (!formData.hospitalId) {
      errors.hospitalId = 'Please select a hospital';
    }

    if (!formData.unitCode) {
      errors.unitCode = 'Please select a unit';
    }

    if (formData.hourlyRate && parseFloat(formData.hourlyRate) <= 0) {
      errors.hourlyRate = 'Hourly rate must be greater than 0';
    }

    if (formData.maxAssignments && parseInt(formData.maxAssignments) <= 0) {
      errors.maxAssignments = 'Max assignments must be greater than 0';
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Determine which accordion contains the first missing field and open it
      const fieldToSection = (field: string): keyof typeof expandedSections => {
        const jobDetailsFields = ['title', 'description', 'department', 'location', 'requiredRole', 'specialization'];
        const scheduleFields = ['startDate', 'endDate', 'startTime', 'endTime', 'hourlyRate', 'maxAssignments', 'priority'];
        const facilityFields = ['hospitalId', 'unitCode', 'facilityName', 'facilityStreet', 'facilityCity', 'facilityState', 'facilityZipCode', 'facilityCountry'];
        const contactFields = ['contactName', 'contactPhone', 'contactEmail', 'contactPosition'];
        const reqFields = ['experience', 'skills', 'boardCertified', 'mealAllowance', 'parking', 'malpractice'];

        if (jobDetailsFields.includes(field)) return 'jobDetails';
        if (scheduleFields.includes(field)) return 'scheduleCompensation';
        if (facilityFields.includes(field)) return 'facilityLocation';
        if (contactFields.includes(field)) return 'contactInfo';
        if (reqFields.includes(field)) return 'requirementsBenefits';
        return 'additionalInfo';
      };

      // Open all sections so all inline errors are visible
      openAllSections();

      setToast({ visible: true, message: 'Please fill in all required fields', type: 'error' });
      return false;
    }

    return true;
  };

  const handleSuccessDone = () => {
    setShowSuccessModal(false);
    // Navigate back after a short delay
    setTimeout(() => {
      navigation.goBack();
    }, 100);
  };

  const handleCreateJob = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const normalizeDate = (value: string) => {
        const ddmmyyyy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (ddmmyyyy) {
          const [, dd, mm, yyyy] = ddmmyyyy;
          return `${yyyy}-${mm}-${dd}`;
        }
        return value;
      };

      const normalizeTime = (value: string) => {
        // Handle 12-hour format with AM/PM: HH:MM AM/PM
        const match12 = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (match12) {
          let hours = parseInt(match12[1], 10);
          const minutes = match12[2];
          const period = match12[3].toUpperCase();
          
          if (period === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }
          
          return `${String(hours).padStart(2, '0')}:${minutes}`;
        }
        
        // Already in 24-hour format, return as is
        return value;
      };

      const jobData = {
        title: formData.title,
        description: formData.description,
        department: formData.department,
        location: formData.location,
        hospitalId: parseInt(formData.hospitalId),
        unitCode: formData.unitCode,
        createdBy: 1,
        requiredRole: formData.requiredRole,
        specialization: formData.specialization || undefined,
        startDate: normalizeDate(formData.startDate),
        endDate: normalizeDate(formData.endDate),
        startTime: normalizeTime(formData.startTime),
        endTime: normalizeTime(formData.endTime),
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
          skills: formData.skills ? formData.skills.split(',').map((s: string) => s.trim()) : [],
        },
        benefits: {
          mealAllowance: formData.mealAllowance,
          parking: formData.parking,
          malpractice: formData.malpractice,
        },
      };

      console.log('🔧 Job data being sent:', jobData);

      const response = await ApiService.createJob(jobData);
      
      const compatibleStaffCount = (response as any).compatibleStaffCount || 0;
      const message = compatibleStaffCount > 0 
        ? `job created successfully! found ${compatibleStaffCount} compatible staff members.`
        : 'job created successfully! no compatible staff found yet, but the job is posted.';

      // Show success modal instead of toast
      setShowSuccessModal(true);
    } catch (error: any) {
      console.log('❌ Create job error response:', error.response?.data);
      setToast({ visible: true, message: error.response?.data?.message || 'failed to create job', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GlobalHeader 
        title="Create Job"
        backgroundColor="#FFFFFF"
        titleColor="#111827"
        onBackPress={() => navigation.goBack()}
        headerStyle={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 16 }}
      />
      <KeyboardAvoidingView 
        style={styles.flex1} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}>
        <View style={styles.formContainer}>
          
          {/* Job Details Section */}
          <AccordionSection
            title="Job Details"
            icon="briefcase"
            isExpanded={expandedSections.jobDetails}
            onToggle={() => toggleSection('jobDetails')}
            isComplete={isSectionComplete('jobDetails')}>
              <View style={styles.fieldBlock}>
            <InputField
              label="Job Title"
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              error={validationErrors.title}
              maxWords={150}
            />
              </View>

              <View style={[styles.fieldBlock, styles.tightBetweenTitleDesc]}>
            <InputField
              label="Description"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              multiline={true}
              numberOfLines={4}
              error={validationErrors.description}
              maxWords={150}
            />
              </View>

              <View style={[styles.fieldBlock, styles.tightUpLarge]}>
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
              styles={styles}
              error={validationErrors.department}
            />
              </View>

              <View style={styles.fieldBlock}>
            <InputField
              label="Location"
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              error={validationErrors.location}
            />
              </View>

              <View style={[styles.roleSelector, styles.fieldBlock]}>
              <Text style={styles.inputLabel}>Required Role</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    formData.requiredRole === 'DOCTOR' && styles.roleButtonActive,
                  ]}
                  onPress={() => handleInputChange('requiredRole', 'DOCTOR')}>
                    <FontAwesomeIcon icon="stethoscope" size={Responsive.iconSize(16)} color={formData.requiredRole === 'DOCTOR' ? Colors.white : Colors.primary} />
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
                    <FontAwesomeIcon icon="user-nurse" size={Responsive.iconSize(16)} color={formData.requiredRole === 'NURSE' ? Colors.white : Colors.primary} />
                  <Text style={[
                    styles.roleButtonText,
                    formData.requiredRole === 'NURSE' && styles.roleButtonTextActive,
                  ]}>
                    Nurse
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    formData.requiredRole === 'AGENCY' && styles.roleButtonActive,
                  ]}
                  onPress={() => handleInputChange('requiredRole', 'AGENCY' as any)}>
                    <FontAwesomeIcon icon="building" size={Responsive.iconSize(16)} color={formData.requiredRole === 'AGENCY' ? Colors.white : Colors.primary} />
                  <Text style={[
                    styles.roleButtonText,
                    formData.requiredRole === 'AGENCY' && styles.roleButtonTextActive,
                  ]}>
                    Agency
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {formData.requiredRole === 'DOCTOR' && (
                <View style={styles.fieldBlock}>
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
                styles={styles}
                error={validationErrors.specialization}
              />
                </View>
            )}
          </AccordionSection>

          {/* Schedule & Compensation Section */}
          <AccordionSection
            title="Schedule & Compensation"
            icon="calendar"
            isExpanded={expandedSections.scheduleCompensation}
            onToggle={() => toggleSection('scheduleCompensation')}
            isComplete={isSectionComplete('scheduleCompensation')}>
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <DateField
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(text) => handleInputChange('startDate', text)}
                  error={validationErrors.startDate}
                  minimumDate={new Date()}
                />
              </View>
              <View style={styles.halfWidth}>
                <DateField
                  label="End Date"
                  value={formData.endDate}
                  onChange={(text) => handleInputChange('endDate', text)}
                  error={validationErrors.endDate}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TimeField
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(text) => handleInputChange('startTime', text)}
                  error={validationErrors.startTime}
                />
              </View>
              <View style={styles.halfWidth}>
                <TimeField
                  label="End Time"
                  value={formData.endTime}
                  onChange={(text) => handleInputChange('endTime', text)}
                  error={validationErrors.endTime}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="Hourly Rate (₹)"
                  value={formData.hourlyRate}
                  onChangeText={(text) => handleInputChange('hourlyRate', text)}
                  keyboardType="numeric"
                  error={validationErrors.hourlyRate}
                />
              </View>
              <View style={styles.halfWidth}>
                <InputField
                  label="Max Assignments"
                  value={formData.maxAssignments}
                  onChangeText={(text) => handleInputChange('maxAssignments', text)}
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
          </AccordionSection>

          {/* Facility & Location Section */}
          <AccordionSection
            title="Facility & Location"
            icon="hospital"
            isExpanded={expandedSections.facilityLocation}
            onToggle={() => toggleSection('facilityLocation')}
            isComplete={isSectionComplete('facilityLocation')}>
            <InputField
              label="Facility Name"
              value={formData.facilityName}
              onChangeText={(text) => handleInputChange('facilityName', text)}
              error={validationErrors.facilityName}
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
              loading={loadingHospitals}
              styles={styles}
              error={validationErrors.hospitalId}
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
              loading={loadingUnits}
              disabled={!formData.hospitalId || units.length === 0}
              styles={styles}
              error={validationErrors.unitCode}
            />

            <InputField
              label="Street Address"
              value={formData.facilityStreet}
              onChangeText={(text) => handleInputChange('facilityStreet', text)}
              error={validationErrors.facilityStreet}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <StateDropdown
                  open={stateDropdownOpen}
                  setOpen={(open) => {
                    setStateDropdownOpen(open);
                    if (open) {
                      setDepartmentDropdownOpen(false);
                      setSpecializationDropdownOpen(false);
                      setHospitalDropdownOpen(false);
                      setUnitDropdownOpen(false);
                      setCityDropdownOpen(false);
                      setCountryDropdownOpen(false);
                    }
                  }}
                  value={formData.facilityState}
                  setValue={(callback) => {
                    const newValue = callback(formData.facilityState);
                    handleInputChange('facilityState', newValue);
                  }}
                  items={Object.keys(stateCityMapping).map(state => ({
                    label: state,
                    value: state,
                  }))}
                  styles={styles}
                  error={validationErrors.facilityState}
                />
              </View>
              <View style={styles.halfWidth}>
                <CityDropdown
                  open={cityDropdownOpen}
                  setOpen={(open) => {
                    setCityDropdownOpen(open);
                    if (open) {
                      setDepartmentDropdownOpen(false);
                      setSpecializationDropdownOpen(false);
                      setHospitalDropdownOpen(false);
                      setUnitDropdownOpen(false);
                      setStateDropdownOpen(false);
                      setCountryDropdownOpen(false);
                    }
                  }}
                  value={formData.facilityCity}
                  setValue={(callback) => {
                    const newValue = callback(formData.facilityCity);
                    handleInputChange('facilityCity', newValue);
                  }}
                  items={(stateCityMapping[formData.facilityState] || []).map(city => ({
                    label: city,
                    value: city,
                  }))}
                  styles={styles}
                  error={validationErrors.facilityCity}
                  disabled={!formData.facilityState}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="ZIP Code"
                  value={formData.facilityZipCode}
                  onChangeText={(text) => handleInputChange('facilityZipCode', text)}
                  keyboardType="numeric"
                  error={validationErrors.facilityZipCode}
                />
              </View>
              <View style={styles.halfWidth}>
                <CountryDropdown
                  open={countryDropdownOpen}
                  setOpen={(open) => {
                    setCountryDropdownOpen(open);
                    if (open) {
                      setDepartmentDropdownOpen(false);
                      setSpecializationDropdownOpen(false);
                      setHospitalDropdownOpen(false);
                      setUnitDropdownOpen(false);
                      setStateDropdownOpen(false);
                      setCityDropdownOpen(false);
                    }
                  }}
                  value={formData.facilityCountry}
                  setValue={(callback) => {
                    const newValue = callback(formData.facilityCountry);
                    handleInputChange('facilityCountry', newValue);
                  }}
                  items={countryList.map(country => ({
                    label: country,
                    value: country,
                  }))}
                  styles={styles}
                />
              </View>
            </View>
          </AccordionSection>

          {/* Contact Information Section */}
          <AccordionSection
            title="Contact Information"
            icon="phone"
            isExpanded={expandedSections.contactInfo}
            onToggle={() => toggleSection('contactInfo')}
            isComplete={isSectionComplete('contactInfo')}>
            <InputField
              label="Contact Name"
              value={formData.contactName}
              onChangeText={(text) => handleInputChange('contactName', text)}
              error={validationErrors.contactName}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <InputField
                  label="Contact Phone"
                  value={formData.contactPhone}
                  onChangeText={(text) => handleInputChange('contactPhone', text)}
                  keyboardType="phone-pad"
                  error={validationErrors.contactPhone}
                />
              </View>
              <View style={styles.halfWidth}>
                <InputField
                  label="Contact Email"
                  value={formData.contactEmail}
                  onChangeText={(text) => handleInputChange('contactEmail', text)}
                  keyboardType="email-address"
                  error={validationErrors.contactEmail}
                />
              </View>
            </View>

            <InputField
              label="Contact Position"
              value={formData.contactPosition}
              onChangeText={(text) => handleInputChange('contactPosition', text)}
              error={validationErrors.contactPosition}
            />
          </AccordionSection>

          {/* Requirements & Benefits Section */}
          <AccordionSection
            title="Requirements & Benefits"
            icon="clipboard-list"
            isExpanded={expandedSections.requirementsBenefits}
            onToggle={() => toggleSection('requirementsBenefits')}
            isComplete={isSectionComplete('requirementsBenefits')}>
              {/* Experience + Department (side-by-side) */}
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <ExperienceDropdown
                    open={departmentDropdownOpen}
                    setOpen={setDepartmentDropdownOpen}
                    value={(formData.experience || '').replace(/\s*years?$/i, '')}
                    setValue={(cb) => {
                      const next = cb((formData.experience || '').replace(/\s*years?$/i, ''));
                      handleInputChange('experience', `${next} years`);
                    }}
                    styles={styles}
                    error={validationErrors.experience}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <DepartmentDropdown
                    open={specializationDropdownOpen}
                    setOpen={(open) => {
                      setSpecializationDropdownOpen(open);
                      if (open) {
                        setHospitalDropdownOpen(false);
                        setUnitDropdownOpen(false);
                        setStateDropdownOpen(false);
                        setCityDropdownOpen(false);
                        setCountryDropdownOpen(false);
                      }
                    }}
                    value={formData.department}
                    setValue={(callback) => {
                      const newValue = callback(formData.department);
                      handleInputChange('department', newValue);
                    }}
                    items={medicalDepartments.map(dept => ({ label: dept, value: dept }))}
                    styles={styles}
                    error={validationErrors.department}
                  />
                </View>
              </View>

              {/* Skills – multi-select based on department */}
              <SkillsDropdown
                open={skillsDropdownOpen}
                setOpen={setSkillsDropdownOpen}
                department={formData.department}
                value={(formData.skills ? String(formData.skills).split(',').map(s => s.trim()).filter(Boolean) : []) as string[]}
                setValue={(cb) => {
                  const prev = (formData.skills ? String(formData.skills).split(',').map(s => s.trim()).filter(Boolean) : []) as string[];
                  const next = cb(prev);
                  handleInputChange('skills', next.join(', '));
                }}
                styles={styles}
                error={validationErrors.skills}
            />

            <View style={styles.checkboxSection}>
              <Text style={styles.inputLabel}>Benefits</Text>
                {formData.requiredRole === 'DOCTOR' ? (
                  <>
                    <CheckboxField
                      label="Malpractice Insurance"
                      value={formData.malpractice}
                      onValueChange={(value) => handleInputChange('malpractice', value)}
                    />
                    <CheckboxField
                      label="Board Certification Required"
                      value={formData.boardCertified}
                      onValueChange={(value) => handleInputChange('boardCertified', value)}
                    />
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
                  </>
                ) : (
                  <>
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
                  </>
                )}
            </View>

          </AccordionSection>

          {/* Additional Information Section */}
          <AccordionSection
            title="Additional Information"
            icon="info-circle"
            isExpanded={expandedSections.additionalInfo}
            onToggle={() => toggleSection('additionalInfo')}
            isComplete={isSectionComplete('additionalInfo')}>
            <InputField
              label="Additional Notes"
              value={formData.notes}
              onChangeText={(text) => handleInputChange('notes', text)}
              multiline={true}
              numberOfLines={3}
                error={validationErrors.notes}
            />
          </AccordionSection>

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
      <ToastModal 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />

      {/* Success Modal */}
      {showSuccessModal && (
        <Modal transparent visible={showSuccessModal} animationType="none" statusBarTranslucent>
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
            
            <Text style={styles.modalTitle}>Job Created Successfully!</Text>
            
            <Text style={styles.modalMessage}>
              Your job posting has been created and is now live. Compatible healthcare professionals will be notified and can apply.
            </Text>
            
            <TouchableOpacity style={styles.modalDoneButton} onPress={handleSuccessDone}>
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
          </View>
        </Modal>
      )}
    </View>
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
  scrollContent: {
    paddingBottom: 0,
  },
  flex1: {
    flex: 1,
  },
  formContainer: {
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  // Accordion styles
  accordionSection: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    // Remove shadow to avoid patchy edges and rely on border only
    // Shadow removed for a crisp border
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accordionSectionExpanded: {
    // keep same look when expanded
    zIndex: 5000,
    elevation: 5,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accordionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  accordionIconComplete: {
    backgroundColor: Colors.success,
  },
  accordionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  accordionContent: {
    padding: Spacing.lg,
    paddingTop: 0,
    overflow: 'visible',
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  textInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputWrapper: {
    position: 'relative',
  },
  wordCountWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  wordCount: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
  },
  wordCountError: {
    color: Colors.error,
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
    gap: Spacing.sm,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  roleButtonActive: {
    backgroundColor: Colors.primary,
  },
  roleButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginLeft: Spacing.xs,
    fontFamily: Typography.fontFamily.medium,
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
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.medium,
  },
  priorityButtonTextActive: {
    color: Colors.white,
  },
  checkboxSection: {
    marginBottom: Spacing.lg,
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  checkboxRowSpacing: {
    marginBottom: Spacing.md,
  },
  checkboxItem: {
    width: '48%',
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
    marginTop: Spacing.xl,
    ...Shadow.md,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  fieldBlock: {
    marginBottom: Spacing.sm,
  },
  tightBetweenTitleDesc: {
    marginTop: -Spacing.md,
  },
  tightUpSmall: {
    marginTop: -Spacing.sm,
  },
  tightUpLarge: {
    marginTop: -Spacing.lg,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  dropdownTriggerDisabled: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.borderLight,
  },
  dropdownTriggerError: {
    borderColor: Colors.error,
  },
  dropdownTriggerText: {
    flex: 1,
    marginRight: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  dropdownTriggerPlaceholder: {
    fontFamily: Typography.fontFamily.regular,
  },
  dropdownTriggerDisabledText: {
    opacity: 0.6,
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dropdownModal: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: BorderRadius.xl || 24,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  dropdownModalLarge: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: BorderRadius.xl || 24,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dropdownModalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  dropdownLoading: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
  },
  dropdownSearchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
  },
  dropdownList: {
    flexGrow: 0,
  },
  dropdownEmptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: Spacing.xs,
  },
  dropdownOptionLabel: {
    flex: 1,
    marginRight: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  modalPrimaryButton: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  inputWithClear: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputTouchable: {
    flex: 1,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  // Toast Modal styles
  toastContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastMessage: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.white,
  },
  toastClose: {
    padding: Spacing.xs,
  },
  // Error styles
  textInputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  // Success Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
    borderTopLeftRadius: BorderRadius.xl || 24,
    borderTopRightRadius: BorderRadius.xl || 24,
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    width: '100%',
  },
  modalTitle: {
    fontSize: Typography.fontSize['2xl'] || 24,
    fontFamily: Typography.fontFamily.bold,
    color: '#333333',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalIconContainer: {
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: 10,
    left: 10,
  },
  sparkle2: {
    bottom: 15,
    left: 8,
  },
  sparkle3: {
    top: 15,
    right: 8,
  },
  sparkle4: {
    bottom: 10,
    right: 10,
  },
  modalMessage: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  modalDoneButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: BorderRadius.md || 8,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl * 2,
    alignItems: 'center',
    minWidth: 140,
    marginBottom: 0,
  },
  modalDoneButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});

export default CreateJobScreen;
