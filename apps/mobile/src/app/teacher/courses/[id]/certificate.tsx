import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/utils/auth/getSession';

export default function CourseCertificateScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [eligibleStudents, setEligibleStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [certRes, studentsRes] = await Promise.all([
        authFetch(`/api/teacher/certificate?course_id=${id}`),
        authFetch(`/api/teacher/analytics?course_id=${id}`),
      ]);
      const certData = await certRes.json();
      const studentsData = await studentsRes.json();

      if (certData.certificates) setCertificates(certData.certificates);

      // Filter students who completed but don't have a certificate yet
      const certStudentIds = certData.certificates?.map((c: any) => c.student_id) || [];
      const completed = studentsData.students?.filter(
        (s: any) => s.completed && !certStudentIds.includes(s.id)
      ) || [];
      setEligibleStudents(completed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const issueCertificate = async (student_id: string, student_name: string) => {
    Alert.alert('Issue Certificate', `Issue certificate to ${student_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Issue 🏆',
        onPress: async () => {
          try {
            const res = await authFetch('/api/teacher/certificate', {
              method: 'POST',
              body: JSON.stringify({ student_id, course_id: id }),
            });
            const data = await res.json();
            if (data.error) {
              Alert.alert('Error', data.error);
            } else {
              Alert.alert('🏆 Success!', `Certificate issued to ${student_name}`);
              fetchData();
            }
          } catch (e) {
            Alert.alert('Error', 'Failed to issue certificate');
          }
        },
      },
    ]);
  };

  const bulkIssueCertificates = async () => {
    Alert.alert(
      'Bulk Issue Certificates',
      `Issue certificates to all ${eligibleStudents.length} completed student(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Issue All 🏆',
          onPress: async () => {
            setBulkLoading(true);
            try {
              const res = await authFetch('/api/teacher/certificate', {
                method: 'PUT',
                body: JSON.stringify({ course_id: id }),
              });
              const data = await res.json();
              Alert.alert('🏆 Success!', `${data.issued} certificate(s) issued`);
              fetchData();
            } catch (e) {
              Alert.alert('Error', 'Failed to issue certificates');
            } finally {
              setBulkLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Certificates</Text>
        <Text style={styles.countText}>{certificates.length} issued</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor="#7C3AED"
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Eligible Students */}
        {eligibleStudents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                ⏳ Eligible ({eligibleStudents.length})
              </Text>
              {eligibleStudents.length > 1 && (
                <TouchableOpacity
                  style={styles.bulkBtn}
                  onPress={bulkIssueCertificates}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? (
                    <ActivityIndicator size="small" color="#7C3AED" />
                  ) : (
                    <Text style={styles.bulkBtnText}>Issue All</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
            {eligibleStudents.map((student) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {student.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentSub}>✅ Course completed</Text>
                </View>
                <TouchableOpacity
                  style={styles.issueBtn}
                  onPress={() => issueCertificate(student.id, student.name)}
                >
                  <Text style={styles.issueBtnText}>🏆 Issue</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Issued Certificates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ✅ Issued Certificates ({certificates.length})
          </Text>
          {certificates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>No certificates issued yet</Text>
              <Text style={styles.emptySubtitle}>
                Issue certificates to students who completed this course
              </Text>
            </View>
          ) : (
            certificates.map((cert) => (
              <View key={cert.id} style={styles.certCard}>
                <View style={styles.certLeft}>
                  <View style={styles.certIcon}>
                    <Text style={styles.certIconText}>🏆</Text>
                  </View>
                  <View style={styles.certInfo}>
                    <Text style={styles.certStudentName}>{cert.student_name}</Text>
                    <Text style={styles.certDate}>
                      Issued {new Date(cert.issued_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => {
                    if (cert.certificate_url) {
                      Linking.openURL(cert.certificate_url);
                    }
                  }}
                >
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  countText: { color: '#DDD6FE', fontSize: 13, fontFamily: 'Nunito_600SemiBold' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 24, gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  bulkBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  bulkBtnText: { color: '#7C3AED', fontSize: 13, fontFamily: 'Nunito_700Bold' },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontFamily: 'Nunito_700Bold' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  studentSub: { fontSize: 12, color: '#059669', fontFamily: 'Nunito_600SemiBold', marginTop: 2 },
  issueBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  issueBtnText: { fontSize: 13, color: '#D97706', fontFamily: 'Nunito_700Bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  certCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  certLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  certIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  certIconText: { fontSize: 22 },
  certInfo: { flex: 1 },
  certStudentName: { fontSize: 14, fontFamily: 'Nunito_700Bold', color: '#1F2937' },
  certDate: { fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito_400Regular', marginTop: 2 },
  viewBtn: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewBtnText: { fontSize: 13, color: '#7C3AED', fontFamily: 'Nunito_700Bold' },
});