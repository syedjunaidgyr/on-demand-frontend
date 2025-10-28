# Reports Screen Export Feature - Documentation

## Overview
The Reports Screen has been enhanced with a comprehensive export functionality that allows users to export data in both PDF and Excel formats. The feature includes:

1. **Global Export Buttons** - Export all jobs or all assignments at once
2. **Individual Export Buttons** - Export each job or assignment separately
3. **No Alerts** - Seamless background processing
4. **Clean UI** - Neat and organized modal layout with proper alignment

## Features

### 1. Global Export Buttons
Located at the top of "All Jobs" and "All Assignments" sections:

- **PDF Button**: Exports all data as a formatted HTML report
- **Excel/XLSX Button**: Exports all data as tab-separated values (TSV)

### 2. Individual Card Export Buttons
Each job and assignment card includes:

- **Red PDF Button**: Export individual item as PDF
- **Green Excel Button**: Export individual item as Excel

### 3. Export Functionality

#### PDF Export
- Creates a beautifully formatted HTML report with:
  - Header with report title and generation timestamp
  - Professional table layout with all data
  - Summary section showing total records
  - Footer with generation information
- Users can open, save, or email the report

#### Excel Export
- Exports data in TSV (Tab-Separated Values) format
- Compatible with Microsoft Excel and Google Sheets
- All fields properly escaped for Excel compatibility
- Can be saved or emailed directly

### 4. Modal Improvements
- Fixed alignment for Job Details Modal
- Fixed alignment for Assignment Details Modal
- Increased close button size for better usability
- Improved header spacing and layout
- Proper scrolling for large content

## File Structure

### Modified Files
1. **src/screens/hr/ReportsScreen.tsx**
   - Added export state management (`exportingJobId`, `exportingAssignmentId`)
   - Added export handler functions:
     - `handleExportJob(jobId, format)`
     - `handleExportAssignment(assignmentId, format)`
     - `handleExportAllJobs(format)`
     - `handleExportAllAssignments(format)`
   - Updated JSX to include export buttons on cards
   - Added global export buttons in section headers
   - Improved modal styles for better alignment

2. **src/utils/exportUtils.ts** (New File)
   - `exportToPDF()` - Export to PDF/HTML format
   - `exportToExcel()` - Export to Excel/TSV format
   - `exportToCSV()` - Export to CSV format
   - Helper functions for data conversion

3. **package.json**
   - react-native-share is already included (v12.2.0)
   - No new dependencies needed

## Usage

### For End Users

#### Exporting All Data
1. Navigate to Reports Screen
2. Go to "All Jobs" or "All Assignments" tab
3. Click the **PDF** or **XLSX** button in the header
4. Share the file via email, save to drive, etc.

#### Exporting Individual Items
1. In "All Jobs" or "All Assignments" tab
2. Find the card you want to export
3. Click the **PDF** (red) or **Excel** (green) button on the card
4. Share the file via email, save to drive, etc.

#### Viewing Detailed Modal
1. Click on any job or assignment card
2. The modal shows all details
3. Export buttons are available on individual cards

### For Developers

#### Adding Export to Other Screens
```typescript
import * as ExportUtils from '../../utils/exportUtils';

// Export to PDF
await ExportUtils.exportToPDF(data, 'fileName', 'Report Title');

// Export to Excel
await ExportUtils.exportToExcel(
  dataArray,
  'fileName',
  ['column1', 'column2', 'column3']
);

// Get CSV string (for other uses)
const csvString = ExportUtils.getCSVString(dataArray);
```

## Styling

### Export Button Styles
- **Global Export Buttons**: Compact buttons with icons
  - PDF: Primary blue color
  - Excel: Green/success color
  - Size: 80px × 32px

- **Card Export Buttons**: Small icon-only buttons
  - PDF: Red color
  - Excel: Green color
  - Size: 32px × 32px

### Modal Improvements
- Header: 40px close button with proper spacing
- Proper flexbox alignment
- Better content spacing
- Improved visual hierarchy

## Data Format

### Jobs Export
Fields included:
- ID
- Title
- Department
- Location
- Start Date
- End Date
- Status
- Specialization

### Assignments Export
Fields included:
- ID
- Job Title
- User Name
- Status
- Total Hours
- Total Payment
- Hourly Rate
- Created At

## Error Handling
- Graceful error handling with console logging
- No error alerts shown to user
- Automatic fallback if data is unavailable
- Empty data validation

## Platform Support
- ✅ iOS (via Share API)
- ✅ Android (via Share API)
- ✅ Both physical devices and emulators

## Performance
- Background export processing with loading indicators
- No blocking of UI during export
- Efficient data conversion
- Minimal memory footprint

## Testing Checklist
- [ ] Export all jobs as PDF
- [ ] Export all jobs as Excel
- [ ] Export single job as PDF
- [ ] Export single job as Excel
- [ ] Export all assignments as PDF
- [ ] Export all assignments as Excel
- [ ] Export single assignment as PDF
- [ ] Export single assignment as Excel
- [ ] Modal shows correctly with export buttons
- [ ] No error alerts appear during export
- [ ] Loading indicators show during export
- [ ] Files can be saved to device
- [ ] Files can be emailed
- [ ] Files can be saved to cloud storage

## Troubleshooting

### Export button not working
1. Check that react-native-share is properly installed
2. Ensure user has file sharing permissions
3. Check console for errors

### Files not saving
1. Ensure app has storage permissions (check AndroidManifest.xml)
2. Try a different share method (email, cloud storage)
3. Check device storage availability

### Modal alignment issues
1. Clear app cache and rebuild
2. Verify styles are properly applied
3. Check theme colors are correctly defined

## Future Enhancements
- [ ] PDF generation with native PDF library
- [ ] Direct file download without Share API
- [ ] Scheduled exports
- [ ] Email exports directly from app
- [ ] Custom export templates
- [ ] Export history
- [ ] Batch exports
- [ ] Export with custom filters applied

## Dependencies
- react-native-share (v12.2.0) - Already included
- React Native built-in APIs only

## Notes
- Export functionality uses React Native's native Share API
- No backend changes required
- Works offline once data is loaded
- Timestamps are in local device timezone
