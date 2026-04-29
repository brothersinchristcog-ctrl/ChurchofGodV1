import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { ChevronLeft, Bell, Calendar, Info, MessageCircle } from 'lucide-react-native';

const UPDATES = [
  {
    id: '1',
    title: 'Sunday Service Timing Change',
    content: 'Please note that this Sunday\'s service will start at 10:00 AM instead of 9:30 AM due to a special baptism ceremony.',
    date: '2026-04-27',
    type: 'announcement',
    icon: Calendar,
    color: '#3b82f6'
  },
  {
    id: '2',
    title: 'Community Prayer Meeting',
    content: 'Join us this Wednesday for our weekly community prayer meeting. We will be praying for healing and peace in our families.',
    date: '2026-04-26',
    type: 'event',
    icon: MessageCircle,
    color: '#10b981'
  },
  {
    id: '3',
    title: 'Youth Ministry Updates',
    content: 'The youth ministry is planning a retreat for next month. Interested members please sign up at the church office.',
    date: '2026-04-25',
    type: 'info',
    icon: Info,
    color: '#f59e0b'
  }
];

export default function UpdatesScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Page Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Church Updates</Text>
          <Text style={styles.headerSub}>Latest announcements & news</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {UPDATES.map((update) => (
            <View key={update.id} style={styles.updateCard}>
              <View style={[styles.iconBox, { backgroundColor: update.color + '15' }]}>
                <update.icon size={22} color={update.color} />
              </View>
              <View style={styles.updateInfo}>
                <View style={styles.metaRow}>
                  <Text style={[styles.typeTag, { color: update.color }]}>{update.type.toUpperCase()}</Text>
                  <Text style={styles.dateTxt}>{update.date}</Text>
                </View>
                <Text style={styles.updateTitle}>{update.title}</Text>
                <Text style={styles.updateContent}>{update.content}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 60 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  
  updateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  updateInfo: { flex: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  typeTag: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  dateTxt: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  updateTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  updateContent: { fontSize: 13, color: '#475569', lineHeight: 20 }
});
