import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Switch,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { 
  Bell, 
  Send, 
  ShieldCheck, 
  Layout, 
  Mic,
  Save,
  Users,
  Clock,
  ChevronDown,
  Megaphone,
  Calendar,
  MoreVertical,
  CheckCircle2
} from 'lucide-react-native';
import Theme from '../../theme/Theme';
import { db as firestore } from '../../services/firebaseConfig';

const { width } = Dimensions.get('window');

export default function AdminNotificationBroadcast() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- State for Daily Promise ---
  const [dailyPromise, setDailyPromise] = useState({
    enabled: true,
    sendTime: '07:00',
    language: 'Telugu + English (bilingual)',
    title: 'ఈ రోజు వాగ్దానం 🙏 · Today\'s Promise'
  });

  // --- State for Sermon Notifications ---
  const [sermonNotif, setSermonNotif] = useState({
    notifyOnPublish: true,
    autoSendImmediate: true,
    sundayReminder: true
  });

  // --- State for Manual Broadcast ---
  const [manualBroadcast, setManualBroadcast] = useState({
    title: '',
    message: '',
    sendTo: 'All members'
  });

  const [lastBroadcast, setLastBroadcast] = useState({
    date: 'April 16',
    count: 1240,
    text: 'Easter service reminder'
  });

  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showSendToPicker, setShowSendToPicker] = useState(false);

  // ── 1. Fetch Settings on Mount ──
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const doc = await firestore.collection('settings').doc('notifications').get();
        if (doc.exists) {
          const data = doc.data();
          if (data?.dailyPromise) setDailyPromise(data.dailyPromise);
          if (data?.sermonNotif) setSermonNotif(data.sermonNotif);
          if (data?.lastBroadcast) setLastBroadcast(data.lastBroadcast);
        }
      } catch (err) {
        console.error('Error fetching notification settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const languages = [
    'Telugu + English (bilingual)',
    'Telugu only',
    'English only'
  ];

  const sendToOptions = [
    'All members',
    'Telugu users only',
    'English users only',
    'Leaders & Elders only',
    'Youth group',
    'Women\'s ministry'
  ];

  // ── 2. Save Settings to Firestore ──
  const handleSaveSettings = async () => {
    setSubmitting(true);
    try {
      await firestore.collection('settings').doc('notifications').set({
        dailyPromise,
        sermonNotif,
        updatedAt: firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      Alert.alert('Success', 'Notification settings saved to Firebase!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 3. Handle Manual Broadcast ──
  const handleSendNow = async () => {
    if (!manualBroadcast.title || !manualBroadcast.message) {
      Alert.alert('Required', 'Please enter a title and message.');
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      
      const newBroadcast = {
        date: dateStr,
        count: 1250, // Mock count
        text: manualBroadcast.title
      };

      // Save to History
      await firestore.collection('settings').doc('notifications').update({
        lastBroadcast: newBroadcast
      });

      // (Optional) Here you would trigger a Firebase Cloud Function for Push Notifications
      
      setLastBroadcast(newBroadcast);
      Alert.alert('Broadcast Sent', `Message successfully sent to ${manualBroadcast.sendTo}!`);
      setManualBroadcast({ ...manualBroadcast, title: '', message: '' });
    } catch (err) {
      Alert.alert('Error', 'Failed to send broadcast.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1a2d5a" />
        <Text style={{ marginTop: 10, color: '#1a2d5a', fontWeight: '600' }}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* ── Fixed Header ── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Bell size={20} color="#FCD34D" />
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSub}>Configure member alerts</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* ── 1. Daily Promise Notification ── */}
        <View style={styles.sectionHeader}>
          <BookOpen size={14} color="#1e40af" />
          <Text style={styles.sectionTitle}>Daily Promise Notification</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.fLabel}>Send daily promise notification</Text>
            <Switch 
              value={dailyPromise.enabled} 
              onValueChange={(v) => setDailyPromise({...dailyPromise, enabled: v})} 
              trackColor={{ false: '#cbd5e1', true: '#1e40af' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fLabelSmall}>Send time (IST)</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={styles.textInput} 
                value={dailyPromise.sendTime} 
                onChangeText={(v) => setDailyPromise({...dailyPromise, sendTime: v})}
              />
              <Clock size={16} color="#64748b" />
            </View>
            <Text style={styles.hint}>Members receive the promise every morning at this time</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fLabelSmall}>Notification language</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowLangPicker(!showLangPicker)}>
              <Text style={styles.pickerTxt}>{dailyPromise.language}</Text>
              <ChevronDown size={16} color="#64748b" />
            </TouchableOpacity>
            {showLangPicker && (
              <View style={styles.dropdown}>
                {languages.map(l => (
                  <TouchableOpacity key={l} style={styles.dropItem} onPress={() => { setDailyPromise({...dailyPromise, language: l}); setShowLangPicker(false); }}>
                    <Text style={styles.dropTxt}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fLabelSmall}>Notification title</Text>
            <TextInput 
              style={styles.inputBoxAlt} 
              value={dailyPromise.title}
              onChangeText={(v) => setDailyPromise({...dailyPromise, title: v})}
            />
          </View>

          <Text style={styles.fLabelSmall}>Notification preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHd}>
              <View style={styles.appIcon} />
              <Text style={styles.previewApp}>Church of GOD · 7:00 AM</Text>
            </View>
            <Text style={styles.previewTitle}>{dailyPromise.title}</Text>
            <Text style={styles.previewBody}>"I can do all things through Christ..." — Phil 4:13</Text>
          </View>
        </View>

        {/* ── 2. Sermon Notifications ── */}
        <View style={[styles.sectionHeader, { marginTop: 30, borderLeftColor: '#ef4444' }]}>
          <Mic size={14} color="#b91c1c" />
          <Text style={[styles.sectionTitle, { color: '#b91c1c' }]}>Sermon Notifications</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.fLabel}>Notify when new sermon is published</Text>
            <Switch 
              value={sermonNotif.notifyOnPublish} 
              onValueChange={(v) => setSermonNotif({...sermonNotif, notifyOnPublish: v})} 
              trackColor={{ false: '#cbd5e1', true: '#1e40af' }}
            />
          </View>
          <View style={[styles.row, { marginTop: 15 }]}>
            <Text style={styles.fLabel}>Auto-send immediately on publish</Text>
            <Switch 
              value={sermonNotif.autoSendImmediate} 
              onValueChange={(v) => setSermonNotif({...sermonNotif, autoSendImmediate: v})} 
              trackColor={{ false: '#cbd5e1', true: '#1e40af' }}
            />
          </View>
          <View style={[styles.row, { marginTop: 15 }]}>
            <Text style={styles.fLabel}>Sunday 9 AM reminder for latest sermon</Text>
            <Switch 
              value={sermonNotif.sundayReminder} 
              onValueChange={(v) => setSermonNotif({...sermonNotif, sundayReminder: v})} 
              trackColor={{ false: '#cbd5e1', true: '#1e40af' }}
            />
          </View>

          <View style={[styles.previewCard, { marginTop: 20 }]}>
            <View style={styles.previewHd}>
              <View style={styles.appIcon} />
              <Text style={styles.previewApp}>Church of GOD · Now</Text>
            </View>
            <Text style={styles.previewTitle}>New Sermon 🎙️ · కొత్త ప్రసంగం</Text>
            <Text style={styles.previewBody}>Walking in Faith — Pastor Daniel Raju. Watch or listen now.</Text>
          </View>
        </View>

        {/* ── 3. Manual Broadcast ── */}
        <View style={[styles.sectionHeader, { marginTop: 30, borderLeftColor: '#f97316' }]}>
          <Megaphone size={14} color="#c2410c" />
          <Text style={[styles.sectionTitle, { color: '#c2410c' }]}>Manual Broadcast</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.fLabelSmall}>Title</Text>
            <TextInput 
              style={styles.inputBoxAlt} 
              placeholder="Special announcement title..."
              value={manualBroadcast.title}
              onChangeText={(v) => setManualBroadcast({...manualBroadcast, title: v})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fLabelSmall}>Message</Text>
            <TextInput 
              style={[styles.inputBoxAlt, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]} 
              placeholder="Type your message to members..."
              multiline
              value={manualBroadcast.message}
              onChangeText={(v) => setManualBroadcast({...manualBroadcast, message: v})}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fLabelSmall}>Send to</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowSendToPicker(!showSendToPicker)}>
              <Text style={styles.pickerTxt}>{manualBroadcast.sendTo}</Text>
              <ChevronDown size={16} color="#64748b" />
            </TouchableOpacity>
            {showSendToPicker && (
              <View style={styles.dropdown}>
                {sendToOptions.map(o => (
                  <TouchableOpacity key={o} style={styles.dropItem} onPress={() => { setManualBroadcast({...manualBroadcast, sendTo: o}); setShowSendToPicker(false); }}>
                    <Text style={styles.dropTxt}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendNow}>
              <Text style={styles.sendBtnTxt}>Send Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scheduleBtn}>
              <Text style={styles.scheduleBtnTxt}>Schedule</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusBox}>
            <CheckCircle2 size={14} color="#059669" />
            <Text style={styles.statusTxt}>
              Last broadcast: <Text style={{ fontWeight: '700' }}>{lastBroadcast.date}</Text> — {lastBroadcast.text}. Delivered to {lastBroadcast.count.toLocaleString()} members.
            </Text>
          </View>
        </View>

        <View style={{ height: 150 }} />
      </ScrollView>

      {/* ── Footer Button ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSettings}>
          <Save size={18} color="#fff" />
          <Text style={styles.saveBtnTxt}>Save Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Icons for the layout since I can't import BookOpen directly from lucide in this context without adding to imports
const BookOpen = ({ size, color }: any) => <Layout size={size} color={color} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { 
    backgroundColor: '#1a2d5a', 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: 20, 
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#c0392b'
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#aac4e8', marginTop: 2 },

  scroll: { padding: 15 },

  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: '#fff', 
    padding: 12, 
    borderTopLeftRadius: 12, 
    borderTopRightRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1e40af', textTransform: 'uppercase', letterSpacing: 0.5 },

  card: { 
    backgroundColor: '#fff', 
    padding: 20, 
    borderBottomLeftRadius: 12, 
    borderBottomRightRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fLabel: { fontSize: 13, fontWeight: '600', color: '#334155' },
  fLabelSmall: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 10, marginTop: 15 },

  inputGroup: { marginBottom: 15 },
  inputBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    paddingHorizontal: 15, 
    height: 48 
  },
  inputBoxAlt: {
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    paddingHorizontal: 15, 
    height: 48,
    fontSize: 13,
    color: '#1e293b'
  },
  textInput: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1e293b' },
  hint: { fontSize: 10, color: '#94a3b8', marginTop: 6 },

  pickerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    paddingHorizontal: 15, 
    height: 48 
  },
  pickerTxt: { fontSize: 13, color: '#1e293b', fontWeight: '500' },

  dropdown: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    marginTop: 5,
    overflow: 'hidden'
  },
  dropItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropTxt: { fontSize: 13, color: '#334155' },

  previewCard: { 
    backgroundColor: '#f8fafc', 
    borderRadius: 12, 
    padding: 15, 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
    marginTop: 10
  },
  previewHd: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  appIcon: { width: 12, height: 12, borderRadius: 3, backgroundColor: '#1a2d5a' },
  previewApp: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  previewTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 2 },
  previewBody: { fontSize: 12, color: '#475569', lineHeight: 18 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  sendBtn: { 
    flex: 1, 
    height: 50, 
    backgroundColor: '#c0392b', 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 3
  },
  sendBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800' },
  scheduleBtn: { 
    flex: 1, 
    height: 50, 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#1a2d5a', 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  scheduleBtnTxt: { color: '#1a2d5a', fontSize: 14, fontWeight: '800' },

  statusBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: '#f0fdf4', 
    padding: 12, 
    borderRadius: 8, 
    marginTop: 20,
    borderWidth: 0.5,
    borderColor: '#bcf0da'
  },
  statusTxt: { flex: 1, fontSize: 11, color: '#065f46' },

  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#fff', 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#e2e8f0' 
  },
  saveBtn: { 
    backgroundColor: '#1a2d5a', 
    height: 56, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10 
  },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }
});
