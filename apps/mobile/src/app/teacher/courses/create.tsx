import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { authFetch } from '@/utils/auth/getSession';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

const COURSE_TYPES = [
  { value: 'video', label: '🎥 Video', desc: 'Upload a video lesson' },
  { value: 'document', label: '📄 Document', desc: 'Upload a PDF or doc' },
  { value: 'mixed', label: '📚 Mixed', desc: 'Video + documents' },
];

export default function CreateCourseScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'video',
    price: '',
    isFree: true,
    category_id: '',
    tags: '',
    status: 'published' as 'published' | 'draft',
    file_url: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await authFetch('/api/courses');
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (e) {
      console.error(e);
    }
  };

  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setThumbnail(result.assets[0].uri);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: form.type === 'video' ? 'video/*' : '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        setForm((prev) => ({ ...prev, file_url: result.assets[0].uri }));
        Alert.alert('File Selected', result.assets[0].name);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (saveAsDraft = false) => {
    if (!form.title.trim()) {
      Alert.alert('Error', 'Please enter a course title');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        price: form.isFree ? 0 : parseFloat(form.price) || 0,
        category_id: form.category_id || null,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
        status: saveAsDraft ? 'draft' : 'published',
        file_url: form.file_url || null,
        thumbnail_url: thumbnail || null,
      };

      const res = await authFetch('/api/teacher/courses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.error) {
        Alert.alert('Error', data.error);
        return;
      }

      Alert.alert(
        'Success! 🎉',
        saveAsDraft ? 'Course saved as draft' : 'Course published successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✨ Create Course</Text>
        <TouchableOpacity onPress={() => handleSubmit(true)} disabled={loading}>
          <Text style={styles.draftText}>Save Draft</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Thumbnail */}
        <TouchableOpacity style={styles.thumbnailPicker} onPress={pickThumbnail} activeOpacity={0.8}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnailImage} contentFit="cover" />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Text style={styles.thumbnailPlaceholderIcon}>🖼️</Text>
              <Text style={styles.thumbnailPlaceholderText}>Tap to add thumbnail</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Course Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Introduction to Math"
            placeholderTextColor="#9CA3AF"
            value={form.title}
            onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What will students learn?"
            placeholderTextColor="#9CA3AF"
            value={form.description}
            onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Course Type */}
        <View style={styles.field}>
          <Text style={styles.label}>Course Type</Text>
          <View style={styles.typeRow}>
            {COURSE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeBtn, form.type === t.value && styles.typeBtnActive]}
                onPress={() => setForm((p) => ({ ...p, type: t.value }))}
              >
                <Text style={styles.typeLabel}>{t.label}</Text>
                <Text style={styles.typeDesc}>{t.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* File Upload */}
        <View style={styles.field}>
          <Text style={styles.label}>Course File</Text>
          <TouchableOpacity style={styles.fileBtn} onPress={pickFile}>
            <Text style={styles.fileBtnIcon}>📎</Text>
            <Text style={styles.fileBtnText}>
              {form.file_url ? '✅ File selected' : 'Upload file'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catBtn, form.category_id === cat.id && styles.catBtnActive]}
                onPress={() => setForm((p) => ({ ...p, category_id: cat.id }))}
              >
                <Text style={styles.catText}>{cat.icon} {cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tags */}
        <View style={styles.field}>
          <Text style={styles.label}>Tags (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. math, beginner, fun"
            placeholderTextColor="#9CA3AF"
            value={form.tags}
            onChangeText={(t) => setForm((p) => ({ ...p, tags: t }))}
          />
        </View>

        {/* Pricing */}
        <View style={styles.field}>
          <View style={styles.priceHeader}>
            <Text style={styles.label}>Pricing</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Free</Text>
              <Switch
                value={!form.isFree}
                onValueChange={(v) => setForm((p) => ({ ...p, isFree: !v }))}
                trackColor={{ false: '#7C3AED', true: '#E5E7EB' }}
                thumbColor="#fff"
              />
              <Text style={styles.switchLabel}>Paid</Text>
            </View>
          </View>
          {!form.isFree && (
            <TextInput
              style={styles.input}
              placeholder="Price in TND (e.g. 29.99)"
              placeholderTextColor="#9CA3AF"
              value={form.price}
              onChangeText={(t) => setForm((p) => ({ ...p, price: t }))}
              keyboardType="decimal-pad"
            />
          )}
        </View>

        {/* Submit Buttons */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={() => handleSubmit(false)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>🚀 Publish Course</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.draftBtn}
          onPress={() => handleSubmit(true)}
          disabled={loading}
        >
          <Text style={styles.draftBtnText}>💾 Save as Draft</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#7C3AED',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: { padding: 4 },
  backIcon: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_700Bold' },
  draftText: { color: '#DDD6FE', fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  thumbnailPicker: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#EDE9FE',
  },
  thumbnailImage: { width: '100%', height: '100%' },
  thumbnailPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  thumbnailPlaceholderIcon: { fontSize: 40 },
  thumbnailPlaceholderText: { fontSize: 14, color: '#7C3AED', fontFamily: 'Nunito_600SemiBold' },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'Nunito_400Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeRow: { gap: 10 },
  typeBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeBtnActive: { borderColor: '#7C3AED', backgroundColor: '#FAF5FF' },
  typeLabel: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  typeDesc: { fontSize: 12, color: '#6B7280', marginTop: 2, fontFamily: 'Nunito_400Regular' },
  fileBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fileBtnIcon: { fontSize: 20 },
  fileBtnText: { fontSize: 14, color: '#7C3AED', fontFamily: 'Nunito_600SemiBold' },
  categoryRow: { marginTop: 4 },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  catBtnActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  catText: { fontSize: 13, color: '#374151', fontFamily: 'Nunito_600SemiBold' },
  priceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 13, color: '#6B7280', fontFamily: 'Nunito_600SemiBold' },
  submitBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
  draftBtn: {
    backgroundColor: '#EDE9FE',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  draftBtnText: { color: '#7C3AED', fontSize: 16, fontFamily: 'Nunito_700Bold' },
});