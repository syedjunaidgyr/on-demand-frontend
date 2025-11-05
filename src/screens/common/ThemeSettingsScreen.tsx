import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlobalHeader from '../../components/GlobalHeader';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAppColors } from '../../hooks/useAppColors';
import ColorPicker, { Panel1, HueSlider, Preview } from 'reanimated-color-picker';
import { runOnJS } from 'react-native-reanimated';
import ApiService from '../../services/api';

const ThemeSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const appColors = useAppColors();
  const { theme, setTheme } = useTheme() as any;

  const [form, setForm] = useState({
    name: theme?.name || '',
    primaryColor: theme?.primaryColor || '#3B82F6',
    secondaryColor: theme?.secondaryColor || '#2563EB',
    backgroundColor: theme?.backgroundColor || '#F3F9FF',
    textColor: theme?.textColor || '#111827',
    accentTextColor: theme?.accentTextColor || '#FFFFFF',
  });

  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeKey, setActiveKey] = useState<keyof typeof form | null>(null);
  const [tempColor, setTempColor] = useState<string>('');
  const [availableThemes, setAvailableThemes] = useState<any[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await ApiService.getProfileThemes?.();
        const themes = res?.themes || [];
        setAvailableThemes(themes);
        const chosen = res?.selectedThemeId || res?.defaultThemeId || res?.defaultTheme?.id || null;
        if (chosen) setSelectedThemeId(String(chosen));
      } catch (e) {
        setAvailableThemes([]);
      }
    })();
  }, []);

  const normalizeHex = (value: string) => {
    if (!value) return value;
    let v = value.trim();
    if (!v.startsWith('#')) v = `#${v}`;
    return v;
  };
  const isValidHex = (value: string) => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test((value||'').trim());
  const getSafeHex = (value: string, fallback: string = '#3B82F6') => {
    if (!value) return fallback;
    const nv = normalizeHex(value);
    return isValidHex(nv) ? nv : fallback;
  };
  const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex2 = (n: number) => clamp255(n).toString(16).padStart(2, '0');
  const hexToRgb = (hex: string) => {
    const v = normalizeHex(hex).replace('#', '');
    if (v.length === 3) return { r: parseInt(v[0]+v[0],16), g: parseInt(v[1]+v[1],16), b: parseInt(v[2]+v[2],16) };
    if (v.length === 6) return { r: parseInt(v.substring(0,2),16), g: parseInt(v.substring(2,4),16), b: parseInt(v.substring(4,6),16) };
    return { r:0,g:0,b:0 };
  };

  const renderColorField = (label: string, key: keyof typeof form) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.colorRow}>
        <TextInput
          style={[styles.input]}
          placeholder={`#${key}`}
          value={(form as any)[key]}
          onChangeText={(v)=> setForm((p)=> ({...p, [key]: normalizeHex(v)}))}
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.swatch, { backgroundColor: getSafeHex((form as any)[key] as string) }]}
          onPress={()=>{ setActiveKey(key); setTempColor(getSafeHex((form as any)[key] as string)); setPickerVisible(true); }}
        />
      </View>
    </View>
  );

  const save = async () => {
    await setTheme({
      name: form.name,
      primaryColor: getSafeHex(form.primaryColor),
      secondaryColor: getSafeHex(form.secondaryColor),
      backgroundColor: getSafeHex(form.backgroundColor),
      textColor: getSafeHex(form.textColor),
      accentTextColor: getSafeHex(form.accentTextColor),
    });
    (navigation as any).goBack();
  };

  const applyThemeFromList = async (t: any) => {
    try {
      setSelectedThemeId(String(t.id));
      await ApiService.updateUserTheme(String(t.id));
      await setTheme({
        name: t.name,
        primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor,
        backgroundColor: t.backgroundColor,
        textColor: t.textColor,
        accentTextColor: t.accentTextColor,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: appColors.background }}>
      <GlobalHeader
        title="Theme Settings"
        showBackButton
        onBackPress={()=> (navigation as any).goBack()}
        backgroundColor={appColors.accentText}
        titleColor={appColors.textPrimary}
      />
      <ScrollView style={{ padding: 16 }}>
        {/* Available Themes from Profile API */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontFamily: Typography.fontFamily.bold, color: appColors.textPrimary, marginBottom: 8 }}>Available Themes</Text>
          {availableThemes.length === 0 ? (
            <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>No themes available</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableThemes.map((t) => (
                <View key={String(t.id)} style={{ alignItems:'center', marginRight: 12 }}>
                  <TouchableOpacity
                    onPress={() => applyThemeFromList(t)}
                    activeOpacity={0.85}
                    style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: t.primaryColor, justifyContent: 'center', alignItems: 'center', borderWidth: selectedThemeId === String(t.id) ? 2 : 1, borderColor: selectedThemeId === String(t.id) ? appColors.primary : '#E5E7EB' }}
                  >
                    <View style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: t.secondaryColor }} />
                  </TouchableOpacity>
                  <Text numberOfLines={1} style={{ fontSize: 12, color: appColors.textSecondary, marginTop: 6, maxWidth: 80, textAlign: 'center' }}>{t.name}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Theme Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., My Theme"
            value={form.name}
            onChangeText={(v)=> setForm((p)=> ({...p, name: v }))}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>{renderColorField('Primary Color', 'primaryColor')}</View>
          <View style={styles.gridCol}>{renderColorField('Secondary Color', 'secondaryColor')}</View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>{renderColorField('Background Color', 'backgroundColor')}</View>
          <View style={styles.gridCol}>{renderColorField('Text Color', 'textColor')}</View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.gridCol}>{renderColorField('Accent Text Color', 'accentTextColor')}</View>
          <View style={styles.gridCol} />
        </View>
        <View style={{ flexDirection:'row', gap:10, marginTop: 8 }}>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: appColors.primary }]} onPress={save}>
            <Text style={styles.primaryBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={pickerVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pick Color</Text>
            <View style={{ marginBottom: 10 }}>
              <TextInput
                style={[styles.input, styles.inputLarge]}
                placeholder="#RRGGBB"
                value={tempColor}
                onChangeText={(v)=> setTempColor(normalizeHex(v))}
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
              />
            </View>
            <View style={{ marginBottom: 12 }}>
              <ColorPicker
                value={getSafeHex(tempColor || '#3B82F6')}
                onChange={(color: any) => {
                  'worklet';
                  try {
                    const hex = (color && color.hex) ? color.hex : tempColor;
                    const safe = hex && typeof hex === 'string' ? hex : '#3B82F6';
                    runOnJS(setTempColor)(safe);
                  } catch {}
                }}
                style={{ width: '100%' }}
              >
                <Preview hideText style={{ marginBottom: 8 }} />
                <Panel1 style={{ height: 150, borderRadius: 12, marginBottom: 10 }} />
                <HueSlider style={{ marginBottom: 8 }} sliderThickness={10} thumbSize={16} />
              </ColorPicker>
            </View>
            <View style={{ flexDirection:'row', justifyContent:'flex-end' }}>
              <TouchableOpacity style={[styles.smallBtn]} onPress={() => setPickerVisible(false)}>
                <Text style={styles.smallBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallBtn, { marginLeft: 10 }]} onPress={()=>{ if (activeKey) setForm((p)=> ({...p, [activeKey]: getSafeHex(tempColor)})); setPickerVisible(false); }}>
                <Text style={styles.smallBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fieldBlock: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  input: { flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#111827', fontSize: 16 },
  inputLarge: { fontSize: 16, paddingVertical: 12 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  gridRow: { flexDirection: 'row', gap: 12 },
  gridCol: { flex: 1 },
  primaryBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, width: '90%', maxWidth: 420 },
  modalTitle: { fontSize: 18, fontFamily: Typography.fontFamily.bold, color: '#111827', marginBottom: 10 },
  smallBtn: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  smallBtnText: { color: '#111827', fontSize: 14, fontWeight: '600' },
});

export default ThemeSettingsScreen;


