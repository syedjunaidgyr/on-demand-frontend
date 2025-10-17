#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Icon mappings from MaterialIcons to FontAwesome
const iconMappings = {
  'dashboard': 'home',
  'work': 'briefcase', 
  'people': 'users',
  'search': 'search',
  'assignment': 'clipboard-list',
  'local-hospital': 'hospital-o',
  'email': 'envelope',
  'lock': 'lock',
  'visibility': 'eye',
  'visibility-off': 'eye-slash',
  'arrow-back': 'arrow-left',
  'medical-services': 'user-md',
  'healing': 'stethoscope',
  'person': 'user',
  'business': 'building',
  'location-on': 'map-marker',
  'badge': 'file-medical',
  'phone': 'phone',
  'home': 'map-marker',
  'location-city': 'building',
  'map': 'map-marker',
  'markunread-mailbox': 'map-marker'
};

// Files to update (excluding already updated ones)
const filesToUpdate = [
  'src/screens/doctor/DoctorDashboardScreen.tsx',
  'src/screens/nurse/NurseCheckInOutScreen.tsx', 
  'src/screens/nurse/NurseMyAssignmentsScreen.tsx',
  'src/screens/nurse/NurseAvailableJobsScreen.tsx',
  'src/screens/nurse/NurseDashboardScreen.tsx',
  'src/screens/doctor/CheckInOutScreen.tsx',
  'src/screens/doctor/MyAssignmentsScreen.tsx',
  'src/screens/doctor/AvailableJobsScreen.tsx',
  'src/screens/common/JobDetailsCommonScreen.tsx',
  'src/screens/hr/CreateJobScreen.tsx',
  'src/screens/hr/HRUsersScreen.tsx',
  'src/screens/hr/HRJobsScreen.tsx',
  'src/screens/hr/HRDashboardScreen.tsx',
  'src/screens/common/ProfileScreen.tsx'
];

function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace import statement
  content = content.replace(
    /import Icon from 'react-native-vector-icons\/MaterialIcons';/g,
    "import { FontAwesomeIcon, FontAwesomeIcons } from '../../utils/icons';"
  );
  
  // Replace Icon usage with FontAwesomeIcon
  content = content.replace(
    /<Icon\s+name=\{?['"`](\w+)['"`]\}?\s+([^>]*?)\/>/g,
    (match, iconName, props) => {
      const mappedIcon = iconMappings[iconName] || iconName;
      return `<FontAwesomeIcon name={FontAwesomeIcons.${mappedIcon.replace('-', '')}} ${props}/>`;
    }
  );
  
  // Replace Icon usage with string names
  content = content.replace(
    /<Icon\s+name=['"`](\w+)['"`]\s+([^>]*?)\/>/g,
    (match, iconName, props) => {
      const mappedIcon = iconMappings[iconName] || iconName;
      return `<FontAwesomeIcon name={FontAwesomeIcons.${mappedIcon.replace('-', '')}} ${props}/>`;
    }
  );
  
  fs.writeFileSync(fullPath, content);
  console.log(`Updated: ${filePath}`);
}

// Update all files
filesToUpdate.forEach(updateFile);

console.log('\nIcon update completed!');
console.log('Note: You may need to manually review and adjust some icon mappings.');
