import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, RefreshControl, Alert, Switch, Modal, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import HospitalAdminApi from '../../services/hospitalAdminApi';
import { useTheme } from '../../contexts/ThemeContext';
import { Typography } from '../../constants/typography';

const HospitalAdminThemeManageScreen: React.FC = () => {
  const { loadAndApplyDefaultTheme } = useTheme();
  const [themes, setThemes] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showManage, setShowManage] = useState(true);
  const [selectModalVisible, setSelectModalVisible] = useState(false);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [activeColorKey, setActiveColorKey] = useState<
    'primaryColor' | 'secondaryColor' | 'backgroundColor' | 'textColor' | 'accentTextColor' | null
  >(null);
  const [tempColor, setTempColor] = useState<string>('');
  const [selectedKey, setSelectedKey] = useState<string | number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rgb, setRgb] = useState<{ r: string; g: string; b: string }>({ r: '0', g: '0', b: '0' });

  // Try to use a richer color picker if installed; otherwise fallback to presets
  const ColorPickerComp = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('react-native-color-picker');
      return mod?.ColorPicker || null;
    } catch (e) {
      return null;
    }
  }, []);
  const TriangleColorPickerComp = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('react-native-color-picker');
      return mod?.TriangleColorPicker || null;
    } catch (e) {
      return null;
    }
  }, []);
  const fromHsv = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('react-native-color-picker');
      return mod?.fromHsv || ((c: any) => tempColor);
    } catch (e) {
      return (c: any) => tempColor;
    }
  }, [tempColor]);
  const toHsv = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('react-native-color-picker');
      return mod?.toHsv || null;
    } catch (e) {
      return null;
    }
  }, []);
  const [form, setForm] = useState({
    id: '',
    name: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#2563EB',
    backgroundColor: '#F3F9FF',
    textColor: '#111827',
    accentTextColor: '#FFFFFF',
    setAsDefault: false,
  });

  const presetColors = [
    // Blues & Teals
    '#2563EB','#3B82F6','#60A5FA','#93C5FD','#0EA5E9','#06B6D4','#22D3EE','#67E8F9',
    // Greens & Limes
    '#16A34A','#22C55E','#4ADE80','#86EFAC','#84CC16','#A3E635','#D9F99D','#65A30D',
    // Purples & Violets
    '#6D28D9','#7C3AED','#8B5CF6','#A78BFA','#C4B5FD','#A855F7','#9333EA','#C084FC',
    // Pinks & Reds
    '#DB2777','#EC4899','#F472B6','#FDA4AF','#EF4444','#F87171','#FB7185','#FCA5A5',
    // Oranges & Ambers
    '#F59E0B','#D97706','#FB923C','#FDBA74','#FCD34D','#FBBF24','#F59E0B','#FEF3C7',
    // Neutrals
    '#111827','#374151','#9CA3AF','#D1D5DB','#E5E7EB','#F3F4F6','#FFFFFF'
  ];

  const normalizeHex = (value: string) => {
    if (!value) return value;
    let v = value.trim();
    if (!v.startsWith('#')) v = `#${v}`;
    return v;
  };

  const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex2 = (n: number) => clamp255(n).toString(16).padStart(2, '0');
  const hexToRgb = (hex: string) => {
    const v = normalizeHex(hex).replace('#', '');
    if (v.length === 3) {
      const r = parseInt(v[0] + v[0], 16);
      const g = parseInt(v[1] + v[1], 16);
      const b = parseInt(v[2] + v[2], 16);
      return { r, g, b };
    }
    if (v.length === 6) {
      const r = parseInt(v.substring(0, 2), 16);
      const g = parseInt(v.substring(2, 4), 16);
      const b = parseInt(v.substring(4, 6), 16);
      return { r, g, b };
    }
    return { r: 0, g: 0, b: 0 };
  };
  const rgbToHex = (r: number, g: number, b: number) => `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;

  const setColorField = (key: 'primaryColor' | 'secondaryColor' | 'backgroundColor' | 'textColor' | 'accentTextColor', value: string) => {
    setForm({ ...form, [key]: normalizeHex(value) } as any);
  };

  const load = async () => {
    const res = await HospitalAdminApi.getThemes();
    setThemes(res?.themes || res || []);
    const current = res?.current;
    const cid = current ? current.id || current : null;
    setCurrentId(cid || null);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const create = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const { setAsDefault, ...themeData } = form;
      const created = await HospitalAdminApi.createTheme({ ...themeData });
      await load();
      if (setAsDefault) {
        const newId = created?.id || created?.theme?.id || created?.name || themeData.name;
        if (newId) {
          await HospitalAdminApi.setDefaultTheme(newId);
          await loadAndApplyDefaultTheme();
          setCurrentId(String(newId));
          setSelectedKey(newId);
        }
      }
      Alert.alert('Success', 'Theme created successfully' + (setAsDefault ? ' and set as default' : ''));
      // Reset form
      setForm({
        id: '',
        name: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#2563EB',
        backgroundColor: '#F3F9FF',
        textColor: '#111827',
        accentTextColor: '#FFFFFF',
        setAsDefault: false,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to create theme');
    } finally { setIsSubmitting(false); }
  };

  const update = async () => {
    if (!form.id && !selectedKey) return Alert.alert('Validation', 'Select a theme to update');
    try {
      setIsSubmitting(true);
      const { id, ...updates } = form as any;
      const key = selectedKey ?? id;
      await HospitalAdminApi.updateTheme(key, updates);
      await load();
      if (form.setAsDefault && key) {
        await HospitalAdminApi.setDefaultTheme(key);
        await loadAndApplyDefaultTheme();
        setCurrentId(String(key));
      }
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to update theme');
    } finally { setIsSubmitting(false); }
  };

  const setDefault = async (id: string | number) => {
    try {
      setIsSubmitting(true);
      await HospitalAdminApi.setDefaultTheme(id);
      await load();
      await loadAndApplyDefaultTheme();
      setSelectedKey(id);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to set default theme');
    } finally { setIsSubmitting(false); }
  };

  const remove = async (id: string | number) => {
    if (currentId === id) return Alert.alert('Blocked', 'Select a different default before deleting this theme.');
    try {
      setIsSubmitting(true);
      if (id === undefined || id === null || String(id).trim() === '') {
        Alert.alert('Validation', 'Theme id is missing. Please select a valid theme.' );
        return;
      }
      if (!Array.isArray(themes) || themes.length <= 1) {
        Alert.alert('Blocked', 'At least one theme must remain. Create another theme before deleting this one.');
        return;
      }
      await HospitalAdminApi.deleteTheme(id);
      await load();
    } catch (e: any) {
      const apiMsg = e?.response?.data?.message || e?.response?.data?.error || e?.message;
      Alert.alert('Error', apiMsg ? `Failed to delete theme: ${apiMsg}` : 'Failed to delete theme');
    } finally { setIsSubmitting(false); }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={() => {
        setShowManage(true);
        setForm({
          id: String(item.id || item.name),
          name: item.name || String(item.id || ''),
          primaryColor: item.primaryColor || '#3B82F6',
          secondaryColor: item.secondaryColor || '#2563EB',
          backgroundColor: item.backgroundColor || '#F3F9FF',
          textColor: item.textColor || '#111827',
          accentTextColor: item.accentTextColor || '#FFFFFF',
          setAsDefault: false,
        });
        setSelectedKey(item.id ?? item.name);
      }}>
      <View style={[styles.colorDot, { backgroundColor: item.primaryColor }]} />
      <Text style={styles.itemName}>{item.id || item.name}</Text>
      <View style={styles.rowActions}>
        <TouchableOpacity style={styles.smallBtn} onPress={() => {
          if (!item?.id && !item?.name) {
            Alert.alert('Validation', 'Theme identifier is missing.');
            return;
          }
          setDefault(item.id || item.name);
        }}>
          <Text style={styles.smallBtnText}>Default</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.smallBtn, styles.deleteBtn]} onPress={() => {
          if (!item?.id) {
            Alert.alert('Validation', 'This theme has no id from server. Please select a theme with an id to delete.');
            return;
          }
          remove(item.id);
        }}>
          <Text style={[styles.smallBtnText, styles.deleteBtnText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderColorField = (
    label: string,
    key: 'primaryColor' | 'secondaryColor' | 'backgroundColor' | 'textColor' | 'accentTextColor',
  ) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.colorRow}>
        <TextInput
          style={styles.input}
          placeholder={`#${key}`}
          value={(form as any)[key]}
          onChangeText={(v) => setColorField(key, v)}
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.swatch, { backgroundColor: (form as any)[key] }]}
          onPress={() => {
            setActiveColorKey(key);
            const current = (form as any)[key];
            setTempColor(current);
            const { r, g, b } = hexToRgb(current);
            setRgb({ r: String(r), g: String(g), b: String(b) });
            setColorPickerVisible(true);
          }}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
        {presetColors.map((c) => (
          <TouchableOpacity key={`${key}-${c}`} style={[styles.preset, { backgroundColor: c }]} onPress={() => setColorField(key, c)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Single Accordion: Manage Theme (Create or Update) */}
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setShowManage(!showManage)}>
        <Text style={styles.accordionTitle}>Manage Theme</Text>
        <Text style={styles.accordionToggle}>{showManage ? '−' : '+'}</Text>
      </TouchableOpacity>
      {showManage && (
        <View style={styles.accordionBody}>
          {/* Theme selector */}
          <View style={styles.selectorRow}>
            <TouchableOpacity style={styles.selector} onPress={() => setSelectModalVisible(true)}>
              <Text style={styles.selectorText}>{form.id ? `Selected: ${form.id}` : 'Create new theme (no selection)'}</Text>
            </TouchableOpacity>
            {!!form.id && (
              <TouchableOpacity
                style={[styles.smallBtn, { marginLeft: 10 }]}
                onPress={() => setForm({
                  id: '', name: '', primaryColor: '#3B82F6', secondaryColor: '#2563EB', backgroundColor: '#F3F9FF', textColor: '#111827', accentTextColor: '#FFFFFF', setAsDefault: false,
                })}
              >
                <Text style={styles.smallBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Name */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Theme Name</Text>
            <TextInput style={styles.input} placeholder="e.g., Brand Blue" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholderTextColor={Colors.textSecondary} />
          </View>

          {/* Grid rows: two columns per row */}
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

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Set as default theme</Text>
            <Switch
              value={form.setAsDefault}
              onValueChange={(v) => setForm({ ...form, setAsDefault: v })}
              trackColor={{ false: '#D1D5DB', true: '#6366F1' }}
              thumbColor={form.setAsDefault ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>

          <View style={styles.actionsRow}>
            {!form.id ? (
              <TouchableOpacity style={[styles.primaryBtn, isSubmitting && { opacity: 0.6 }]} disabled={isSubmitting} onPress={create}><Text style={styles.primaryBtnText}>Create</Text></TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.primaryBtn, isSubmitting && { opacity: 0.6 }]} disabled={isSubmitting} onPress={update}><Text style={styles.primaryBtnText}>Update</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, isSubmitting && { opacity: 0.6 }]} disabled={isSubmitting} onPress={() => setDefault((selectedKey ?? form.id!) as any)}><Text style={styles.primaryBtnText}>Set Default</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, styles.deleteFullBtn, isSubmitting && { opacity: 0.6 }]} disabled={isSubmitting} onPress={() => remove((selectedKey ?? form.id!) as any)}><Text style={styles.primaryBtnText}>Delete</Text></TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* List of themes for quick overview */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.title}>All Themes</Text>
        <TouchableOpacity onPress={onRefresh}><Text style={styles.refreshText}>Refresh</Text></TouchableOpacity>
      </View>
      <FlatList
        data={themes}
        keyExtractor={(item) => String(item.id || item.name)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.subtitle}>No themes</Text>}
      />

      {/* Theme selection modal */}
      <Modal visible={selectModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Theme</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {themes.map((t) => (
                <TouchableOpacity
                  key={String(t.id || t.name)}
                  style={styles.modalItem}
                  onPress={() => {
                    setForm({
                      id: String(t.id || t.name),
                      name: t.name || String(t.id || ''),
                      primaryColor: t.primaryColor || '#3B82F6',
                      secondaryColor: t.secondaryColor || '#2563EB',
                      backgroundColor: t.backgroundColor || '#F3F9FF',
                      textColor: t.textColor || '#111827',
                      accentTextColor: t.accentTextColor || '#FFFFFF',
                      setAsDefault: false,
                    });
                    setSelectedKey(t.id ?? t.name);
                    setSelectModalVisible(false);
                  }}>
                  <View style={[styles.colorDot, { backgroundColor: t.primaryColor }]} />
                  <Text style={styles.itemName}>{t.id || t.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.smallBtn} onPress={() => setSelectModalVisible(false)}>
                <Text style={styles.smallBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Color picker modal */}
      <Modal visible={colorPickerVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pick Color</Text>
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={[styles.input, styles.inputLarge]}
                placeholder="#RRGGBB"
                value={tempColor}
                onChangeText={(v) => setTempColor(normalizeHex(v))}
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
              />
            </View>
            {/* RGB inputs */}
            <View style={styles.rgbRow}>
              <View style={styles.rgbCol}>
                <Text style={styles.rgbLabel}>R</Text>
                <TextInput
                  style={[styles.input, styles.rgbInput]}
                  keyboardType="number-pad"
                  value={rgb.r}
                  onChangeText={(v) => {
                    const n = parseInt(v || '0', 10);
                    const nv = isNaN(n) ? 0 : clamp255(n);
                    setRgb({ ...rgb, r: String(nv) });
                    setTempColor(rgbToHex(nv, parseInt(rgb.g || '0', 10), parseInt(rgb.b || '0', 10)));
                  }}
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={styles.rgbCol}>
                <Text style={styles.rgbLabel}>G</Text>
                <TextInput
                  style={[styles.input, styles.rgbInput]}
                  keyboardType="number-pad"
                  value={rgb.g}
                  onChangeText={(v) => {
                    const n = parseInt(v || '0', 10);
                    const nv = isNaN(n) ? 0 : clamp255(n);
                    setRgb({ ...rgb, g: String(nv) });
                    setTempColor(rgbToHex(parseInt(rgb.r || '0', 10), nv, parseInt(rgb.b || '0', 10)));
                  }}
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={styles.rgbCol}>
                <Text style={styles.rgbLabel}>B</Text>
                <TextInput
                  style={[styles.input, styles.rgbInput]}
                  keyboardType="number-pad"
                  value={rgb.b}
                  onChangeText={(v) => {
                    const n = parseInt(v || '0', 10);
                    const nv = isNaN(n) ? 0 : clamp255(n);
                    setRgb({ ...rgb, b: String(nv) });
                    setTempColor(rgbToHex(parseInt(rgb.r || '0', 10), parseInt(rgb.g || '0', 10), nv));
                  }}
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <View style={styles.previewSwatchWrapper}>
                <View style={[styles.previewSwatch, { backgroundColor: tempColor }]} />
              </View>
            </View>
            {TriangleColorPickerComp && toHsv && fromHsv ? (
              <View style={{ height: 260, marginBottom: 12 }}>
                <TriangleColorPickerComp
                  style={{ flex: 1 }}
                  color={toHsv(tempColor || '#3B82F6')}
                  onColorChange={(hsv: any) => {
                    const hex = fromHsv(hsv);
                    setTempColor(normalizeHex(hex));
                    const { r, g, b } = hexToRgb(hex);
                    setRgb({ r: String(r), g: String(g), b: String(b) });
                  }}
                />
              </View>
            ) : ColorPickerComp ? (
              <View style={{ height: 220, marginBottom: 10 }}>
                <ColorPickerComp
                  style={{ flex: 1 }}
                  defaultColor={tempColor || '#3B82F6'}
                  onColorChange={(hsv: any) => {
                    const hex = fromHsv(hsv);
                    setTempColor(normalizeHex(hex));
                    const { r, g, b } = hexToRgb(hex);
                    setRgb({ r: String(r), g: String(g), b: String(b) });
                  }}
                />
              </View>
            ) : null}
            {/* Always show vivid preset grid as well */}
            <View style={styles.pickerGrid}>
              {presetColors.map((c) => (
                <TouchableOpacity
                  key={`picker-${c}`}
                  style={[styles.presetSquare, { backgroundColor: c }]}
                  onPress={() => setTempColor(c)}
                />
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={() => {
                  if (activeColorKey) setColorField(activeColorKey, tempColor);
                  setColorPickerVisible(false);
                }}>
                <Text style={styles.smallBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary, marginBottom: 10 },
  subtitle: { fontSize: 14, color: Colors.textSecondary },
  formRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  input: { flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: Colors.textPrimary, fontSize: 16 },
  inputLarge: { fontSize: 16, paddingVertical: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  switchLabel: { fontSize: 15, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  primaryBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  colorDot: { width: 16, height: 16, borderRadius: 8, marginRight: 10 },
  itemName: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  rowActions: { flexDirection: 'row', gap: 8 },
  smallBtn: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  smallBtnText: { color: Colors.textPrimary, fontSize: 12, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  deleteBtnText: { color: '#B91C1C' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.white, paddingHorizontal: 12, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  accordionTitle: { fontSize: 16, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  accordionToggle: { fontSize: 20, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary },
  accordionBody: { backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 12 },
  selectorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  selector: { flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  selectorText: { color: Colors.textPrimary },
  fieldBlock: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  presetRow: { marginTop: 8 },
  preset: { width: 28, height: 28, borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  gridRow: { flexDirection: 'row', gap: 12 },
  gridCol: { flex: 1 },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  refreshText: { color: Colors.primary, fontFamily: Typography.fontFamily.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, width: '90%', maxWidth: 420 },
  modalTitle: { fontSize: 18, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: 10 },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  presetSquare: { width: 42, height: 42, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  rgbRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rgbCol: { flexDirection: 'column', width: 70 },
  rgbLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  rgbInput: { paddingVertical: 10, fontSize: 15 },
  previewSwatchWrapper: { marginLeft: 8 },
  previewSwatch: { width: 46, height: 46, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
});

export default HospitalAdminThemeManageScreen;


