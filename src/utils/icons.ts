import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

// Import all the icons you need using deep imports for better performance
import { faHome } from '@fortawesome/free-solid-svg-icons/faHome';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { faUsers } from '@fortawesome/free-solid-svg-icons/faUsers';
import { faBriefcase } from '@fortawesome/free-solid-svg-icons/faBriefcase';
import { faCalendar } from '@fortawesome/free-solid-svg-icons/faCalendar';
import { faClock } from '@fortawesome/free-solid-svg-icons/faClock';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons/faMapMarkerAlt';
import { faPhone } from '@fortawesome/free-solid-svg-icons/faPhone';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons/faEnvelope';
import { faCog } from '@fortawesome/free-solid-svg-icons/faCog';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons/faSignOutAlt';
import { faSignInAlt } from '@fortawesome/free-solid-svg-icons/faSignInAlt';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import { faSearch } from '@fortawesome/free-solid-svg-icons/faSearch';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faEdit } from '@fortawesome/free-solid-svg-icons/faEdit';
import { faTrash } from '@fortawesome/free-solid-svg-icons/faTrash';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons/faChevronUp';
import { faEye } from '@fortawesome/free-solid-svg-icons/faEye';
import { faEyeSlash } from '@fortawesome/free-solid-svg-icons/faEyeSlash';
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
import { faUnlock } from '@fortawesome/free-solid-svg-icons/faUnlock';
import { faHeart } from '@fortawesome/free-solid-svg-icons/faHeart';
import { faStar } from '@fortawesome/free-solid-svg-icons/faStar';
import { faFilter } from '@fortawesome/free-solid-svg-icons/faFilter';
import { faSort } from '@fortawesome/free-solid-svg-icons/faSort';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faUpload } from '@fortawesome/free-solid-svg-icons/faUpload';
import { faShare } from '@fortawesome/free-solid-svg-icons/faShare';
import { faBookmark } from '@fortawesome/free-solid-svg-icons/faBookmark';
import { faComment } from '@fortawesome/free-solid-svg-icons/faComment';
import { faThumbsUp } from '@fortawesome/free-solid-svg-icons/faThumbsUp';
import { faThumbsDown } from '@fortawesome/free-solid-svg-icons/faThumbsDown';
import { faFlag } from '@fortawesome/free-solid-svg-icons/faFlag';
import { faExclamation } from '@fortawesome/free-solid-svg-icons/faExclamation';
import { faInfo } from '@fortawesome/free-solid-svg-icons/faInfo';
import { faQuestion } from '@fortawesome/free-solid-svg-icons/faQuestion';
import { faWarning } from '@fortawesome/free-solid-svg-icons/faWarning';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons/faCheckCircle';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons/faTimesCircle';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons/faExclamationTriangle';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons/faInfoCircle';
import { faUserMd } from '@fortawesome/free-solid-svg-icons/faUserMd';
import { faStethoscope } from '@fortawesome/free-solid-svg-icons/faStethoscope';
import { faHospital } from '@fortawesome/free-solid-svg-icons/faHospital';
import { faPills } from '@fortawesome/free-solid-svg-icons/faPills';
import { faHeartbeat } from '@fortawesome/free-solid-svg-icons/faHeartbeat';
import { faAmbulance } from '@fortawesome/free-solid-svg-icons/faAmbulance';
import { faSyringe } from '@fortawesome/free-solid-svg-icons/faSyringe';
import { faFileMedical } from '@fortawesome/free-solid-svg-icons/faFileMedical';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons/faClipboardList';
import { faChartBar } from '@fortawesome/free-solid-svg-icons/faChartBar';
import { faChartLine } from '@fortawesome/free-solid-svg-icons/faChartLine';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons/faCalendarCheck';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons/faUserCheck';
import { faUserTimes } from '@fortawesome/free-solid-svg-icons/faUserTimes';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons/faUserPlus';
import { faUserMinus } from '@fortawesome/free-solid-svg-icons/faUserMinus';
import { faUserEdit } from '@fortawesome/free-solid-svg-icons/faUserEdit';
import { faUserTag } from '@fortawesome/free-solid-svg-icons/faUserTag';
import { faUserShield } from '@fortawesome/free-solid-svg-icons/faUserShield';
import { faUserCog } from '@fortawesome/free-solid-svg-icons/faUserCog';
import { faUserFriends } from '@fortawesome/free-solid-svg-icons/faUserFriends';
import { faUserGraduate } from '@fortawesome/free-solid-svg-icons/faUserGraduate';
import { faUserNurse } from '@fortawesome/free-solid-svg-icons/faUserNurse';
import { faUserDoctor } from '@fortawesome/free-solid-svg-icons/faUserDoctor';
import { faUserInjured } from '@fortawesome/free-solid-svg-icons/faUserInjured';
import { faUserSecret } from '@fortawesome/free-solid-svg-icons/faUserSecret';
import { faUserTie } from '@fortawesome/free-solid-svg-icons/faUserTie';
import { faList } from '@fortawesome/free-solid-svg-icons/faList';
import { faListOl } from '@fortawesome/free-solid-svg-icons/faListOl';
import { faAlignLeft } from '@fortawesome/free-solid-svg-icons/faAlignLeft';
import { faAlignCenter } from '@fortawesome/free-solid-svg-icons/faAlignCenter';
import { faAlignRight } from '@fortawesome/free-solid-svg-icons/faAlignRight';
import { faAlignJustify } from '@fortawesome/free-solid-svg-icons/faAlignJustify';
import { faBuilding } from '@fortawesome/free-solid-svg-icons/faBuilding';
import { faDollarSign } from '@fortawesome/free-solid-svg-icons/faDollarSign';
import { faRupeeSign } from '@fortawesome/free-solid-svg-icons/faRupeeSign';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons/faEllipsisV';
import { faSync } from '@fortawesome/free-solid-svg-icons/faSync';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons/faCalendarAlt';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons/faPaperPlane';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons/faGraduationCap';
import { faUtensils } from '@fortawesome/free-solid-svg-icons/faUtensils';
import { faParking } from '@fortawesome/free-solid-svg-icons/faParking';
import { faShieldAlt } from '@fortawesome/free-solid-svg-icons/faShieldAlt';

// Add all icons to the library
library.add(
  faHome as any,
  faUser as any,
  faUsers as any,
  faBriefcase as any,
  faCalendar as any,
  faClock as any,
  faMapMarkerAlt as any,
  faPhone as any,
  faEnvelope as any,
  faCog as any,
  faSignOutAlt as any,
  faSignInAlt as any,
  faBell as any,
  faSearch as any,
  faPlus as any,
  faEdit as any,
  faTrash as any,
  faCheck as any,
  faTimes as any,
  faArrowLeft as any,
  faArrowRight as any,
  faChevronDown as any,
  faChevronUp as any,
  faEye as any,
  faEyeSlash as any,
  faLock as any,
  faUnlock as any,
  faHeart as any,
  faStar as any,
  faFilter as any,
  faSort as any,
  faDownload as any,
  faUpload as any,
  faShare as any,
  faBookmark as any,
  faComment as any,
  faThumbsUp as any,
  faThumbsDown as any,
  faFlag as any,
  faExclamation as any,
  faInfo as any,
  faQuestion as any,
  faWarning as any,
  faCheckCircle as any,
  faTimesCircle as any,
  faExclamationTriangle as any,
  faInfoCircle as any,
  faUserMd as any,
  faStethoscope as any,
  faHospital as any,
  faPills as any,
  faHeartbeat as any,
  faAmbulance as any,
  faSyringe as any,
  faFileMedical as any,
  faClipboardList as any,
  faChartBar as any,
  faChartLine as any,
  faCalendarCheck as any,
  faPlay as any,
  faUserCheck as any,
  faUserTimes as any,
  faUserPlus as any,
  faUserMinus as any,
  faUserEdit as any,
  faUserTag as any,
  faUserShield as any,
  faUserCog as any,
  faUserFriends as any,
  faUserGraduate as any,
  faUserNurse as any,
  faUserDoctor as any,
  faUserInjured as any,
  faUserSecret as any,
  faUserTie as any,
  faList as any,
  faListOl as any,
  faAlignLeft as any,
  faAlignCenter as any,
  faAlignRight as any,
  faAlignJustify as any,
  faBuilding as any,
  faDollarSign as any,
  faRupeeSign as any,
  faEllipsisV as any,
  faSync as any,
  faCalendarAlt as any,
  faPaperPlane as any,
  faGraduationCap as any,
  faUtensils as any,
  faParking as any,
  faShieldAlt as any,
);

export { FontAwesomeIcon };