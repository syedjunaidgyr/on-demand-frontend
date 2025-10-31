import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAppColors } from '../../hooks/useAppColors';
import HospitalAdminApi from '../../services/hospitalAdminApi';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';

const HospitalAdminUploadLogoScreen: React.FC = () => {
  const appColors = useAppColors();
  const [filePath, setFilePath] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);

  const onUpload = async () => {
    const uri = selected?.uri || filePath;
    if (!uri) {
      Alert.alert('Validation', 'Please choose an image or enter a file path.');
      return;
    }
    try {
      setIsUploading(true);
      const form = new FormData();
      form.append('logo', {
        // @ts-ignore - React Native FormData file
        uri: uri.startsWith('file://') || uri.startsWith('content://') ? uri : `file://${uri}`,
        name: selected?.fileName || 'logo.jpg',
        type: selected?.type || 'image/jpeg',
      });
      await HospitalAdminApi.uploadLogo(form);
      Alert.alert('Success', 'Logo uploaded successfully.');
    } catch (e: any) {
      Alert.alert('Upload failed', e?.response?.data?.message || e?.message || 'Please try again');
    } finally {
      setIsUploading(false);
    }
  };

  const pickFromGallery = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.9 });
    if (res.assets && res.assets.length > 0) {
      setSelected(res.assets[0]);
      setFilePath('');
    }
  };

  const takePhoto = async () => {
    const res = await launchCamera({ mediaType: 'photo', quality: 0.9, saveToPhotos: true });
    if (res.assets && res.assets.length > 0) {
      setSelected(res.assets[0]);
      setFilePath('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: appColors.background }]}>
      <Text style={[styles.title, { color: appColors.textPrimary }]}>Upload Hospital Logo</Text>
      <Text style={[styles.subtitle, { color: appColors.textPrimary }]}>Choose an image or enter a file path.</Text>

      {selected?.uri ? (
        <View style={styles.previewWrapper}>
          <Image source={{ uri: selected.uri }} style={styles.preview} resizeMode="contain" />
          <Text style={styles.previewName} numberOfLines={1}>{selected.fileName || selected.uri}</Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
          <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
          <Text style={styles.secondaryButtonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="e.g., /storage/emulated/0/Download/logo.png"
        placeholderTextColor={Colors.textSecondary}
        value={filePath}
        autoCapitalize="none"
        onChangeText={setFilePath}
      />
      <TouchableOpacity style={styles.button} onPress={onUpload} disabled={isUploading}>
        <Text style={styles.buttonText}>{isUploading ? 'Uploading...' : 'Upload'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  previewWrapper: {
    alignItems: 'center',
    marginBottom: 12,
  },
  preview: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewName: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default HospitalAdminUploadLogoScreen;


