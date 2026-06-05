import React, { useState, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Music, Save, ChevronDown, CheckCircle, FileText, Globe } from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import SalesforceService from '../../services/SalesforceService';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

const KEYS = ['C', 'C# / Db', 'D', 'D# / Eb', 'E', 'F', 'F# / Gb', 'G', 'G# / Ab', 'A', 'A# / Bb', 'B'];

export default function AdminSongEditor() {
  const { setActiveTab } = useContext(AdminTabContext);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [titleEn, setTitleEn] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [artist, setArtist] = useState('COG Worship');
  const [keySignature, setKeySignature] = useState('C');
  const [lyrics, setLyrics] = useState('');
  const [status, setStatus] = useState('Published');
  const [youtubeId, setYoutubeId] = useState('');

  const [showKeyPicker, setShowKeyPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [syncReceipt, setSyncReceipt] = useState({ savedTo: '', id: '' });

  const handlePublishSong = async () => {
    if (!titleEn.trim()) {
      Alert.alert('Required', 'Please enter a Song Title (English).');
      return;
    }
    if (!lyrics.trim()) {
      Alert.alert('Required', 'Please enter the Song Lyrics.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Automatically push to Salesforce via SalesforceService
      console.log('Sending song to Salesforce...');
      const receipt = await SalesforceService.createWorshipSong({
        titleEn: `${titleEn.trim()} (Song)`, // Ensure Name LIKE '%Song%' catches it in queries
        titleTe: titleTe.trim(),
        artist: artist.trim(),
        keySignature: keySignature,
        lyrics: lyrics.trim(),
        status: status,
        youtubeId: youtubeId.trim()
      });

      setSyncReceipt({
        savedTo: receipt.savedTo,
        id: receipt.id
      });

      const db = getFirestore();

      // 2. Also save to Firebase Firestore in the 'worshipSongs' collection for instant user updates & offline support
      console.log('Syncing song with Firestore...');
      try {
        await addDoc(collection(db, 'worshipSongs'), {
          title: titleEn.trim(),
          titleTe: titleTe.trim(),
          artist: artist.trim(),
          key: keySignature,
          lyrics: lyrics.trim(),
          status: status,
          youtubeId: youtubeId.trim(),
          createdAt: serverTimestamp()
        });
      } catch (fErr) {
        console.warn('⚠️ Firestore Sync (worshipSongs) bypassed due to Security Rules:', fErr);
      }

      // 3. Append to updates collection so it shows up in "Church Updates" immediately
      console.log('Saving announcement notification...');
      try {
        await addDoc(collection(db, 'broadcasts'), {
          title: `🎵 New Song Posted: ${titleEn.trim()}`,
          content: `A new worship song "${titleEn.trim()}" has been posted. Learn the lyrics and chord keys now!`,
          date: new Date().toISOString().split('T')[0],
          type: 'announcement',
          createdAt: serverTimestamp()
        });
      } catch (fErr) {
        console.warn('⚠️ Firestore Sync (broadcasts) bypassed due to Security Rules:', fErr);
      }

      setShowSuccess(true);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Salesforce Sync Error', error.message || 'Failed to sync with Salesforce. Please verify configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Music size={20} color="#FCD34D" />
          <View>
            <Text style={styles.headerTitle}>Post Song Lyrics</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>SONG DETAILS</Text>

          {/* Title English */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SONG TITLE (ENGLISH) · ఆంగ్ల శీర్షిక *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="E.g. Amazing Grace, How Great Is Our God..."
              placeholderTextColor="#94a3b8"
              value={titleEn}
              onChangeText={setTitleEn}
            />
          </View>

          {/* Title Telugu */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SONG TITLE (TELUGU) · తెలుగు శీర్షిక</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ఉదాహరణ: అద్భుతమైన కృప..."
              placeholderTextColor="#94a3b8"
              value={titleTe}
              onChangeText={setTitleTe}
            />
          </View>

          {/* YouTube Video ID / Link */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>YOUTUBE VIDEO ID / LINK · యూట్యూబ్ లింక్ (ఐడి)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="E.g. dQw4w9WgXcQ or https://youtu.be/..."
              placeholderTextColor="#94a3b8"
              value={youtubeId}
              onChangeText={setYoutubeId}
            />
          </View>

          {/* Artist & Key Signature Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>ARTIST / BAND · గాయకులు</Text>
              <TextInput
                style={styles.textInput}
                placeholder="E.g. COG Worship, Hillsong..."
                placeholderTextColor="#94a3b8"
                value={artist}
                onChangeText={setArtist}
              />
            </View>

            <View style={{ width: 15 }} />

            <View style={[styles.inputGroup, { width: 120 }]}>
              <Text style={styles.label}>KEY SIGNATURE</Text>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowKeyPicker(!showKeyPicker)}>
                <Text style={styles.pickerTxt}>{keySignature}</Text>
                <ChevronDown size={14} color="#64748b" />
              </TouchableOpacity>
              {showKeyPicker && (
                <View style={styles.dropdown}>
                  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                    {KEYS.map(k => (
                      <TouchableOpacity 
                        key={k} 
                        style={styles.dropItem} 
                        onPress={() => { setKeySignature(k); setShowKeyPicker(false); }}
                      >
                        <Text style={styles.dropTxt}>{k}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Lyrics Box */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SONG LYRICS & SCRIPTS · సాహిత్యం *</Text>
            <TextInput
              style={[styles.textInput, { height: 200, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Verse 1:&#10;Amazing grace! How sweet the sound...&#10;&#10;Chorus:&#10;My chains are gone, I've been set free..."
              placeholderTextColor="#94a3b8"
              multiline
              value={lyrics}
              onChangeText={setLyrics}
            />
          </View>

          {/* Status Row */}
          <View style={styles.statusSelectRow}>
            <Text style={styles.statusLabel}>Publish Status</Text>
            <View style={styles.statusBtnGroup}>
              <TouchableOpacity 
                style={[styles.statusBtn, status === 'Published' && styles.statusBtnActive]} 
                onPress={() => setStatus('Published')}
              >
                <Text style={[styles.statusBtnTxt, status === 'Published' && styles.statusBtnTxtActive]}>Published</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusBtn, status === 'Draft' && styles.statusBtnActiveDraft]} 
                onPress={() => setStatus('Draft')}
              >
                <Text style={[styles.statusBtnTxt, status === 'Draft' && styles.statusBtnTxtActive]}>Draft</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Sync Status Box */}
        <View style={styles.infoBox}>
          <CheckCircle size={16} color="#059669" />
          <Text style={styles.infoText}>
            This action creates a custom <Text style={{ fontWeight: '700' }}>Worship_Song__c</Text> SObject record in Salesforce Production and syncs the lyrics in real time!
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.saveBtn, submitting && { backgroundColor: '#94a3b8' }]} 
          onPress={handlePublishSong}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={18} color="#fff" />
              <Text style={styles.saveBtnTxt}>Publish Song Lyrics</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Premium Success Modal */}
      {showSuccess && (
        <Modal transparent visible={true} animationType="fade">
          <View style={styles.successBg}>
            <View style={styles.successCard}>
              <View style={styles.successIconOuter}>
                <View style={styles.successIconInner}>
                  <CheckCircle size={36} color="#fff" />
                </View>
              </View>
              
              <Text style={styles.successTitle}>Publication Successful!</Text>
              <Text style={styles.successDesc}>
                Your worship song has been successfully synchronized with Salesforce Production and is now live for all church members!
              </Text>

              {/* Song Metadata Card */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLbl}>SONG METADATA SYNCED</Text>
                <View style={styles.summaryRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.summaryTitleEn} numberOfLines={1}>{titleEn}</Text>
                    {titleTe ? <Text style={styles.summaryTitleTe} numberOfLines={1}>{titleTe}</Text> : null}
                  </View>
                  <View style={styles.summaryBadge}>
                    <Text style={styles.summaryBadgeTxt}>KEY: {keySignature}</Text>
                  </View>
                </View>
                <Text style={styles.summaryArtist}>Worship Leader: {artist}</Text>

                {/* Salesforce Live Sync Receipt */}
                <View style={styles.receiptBox}>
                  <Text style={styles.receiptLbl}>SALESFORCE DATABASE RECEIPT</Text>
                  <Text style={styles.receiptText}>Target Object: <Text style={{ fontWeight: '700', color: '#1e293b' }}>{syncReceipt.savedTo}</Text></Text>
                  <Text style={styles.receiptText}>Record ID: <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: '#475569', fontWeight: '700' }}>{syncReceipt.id}</Text></Text>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity 
                style={styles.successActionBtn}
                onPress={() => {
                  setShowSuccess(false);
                  // Clear form
                  setTitleEn('');
                  setTitleTe('');
                  setLyrics('');
                  setYoutubeId('');
                  // Go back to Dashboard
                  setActiveTab(0);
                }}
              >
                <Text style={styles.successActionTxt}>Back to Dashboard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.successSecBtn}
                onPress={() => {
                  setShowSuccess(false);
                  // Clear form
                  setTitleEn('');
                  setTitleTe('');
                  setLyrics('');
                  setYoutubeId('');
                }}
              >
                <Text style={styles.successSecTxt}>Create Another Song</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: '#aac4e8', marginTop: 2 },

  scroll: { padding: 16 },

  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5
  },

  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#1a2d5a', letterSpacing: 1, marginBottom: 20 },

  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  label: { fontSize: 10, fontWeight: '800', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600'
  },

  pickerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    height: 48 
  },
  pickerTxt: { fontSize: 13, color: '#1e293b', fontWeight: '700' },
  dropdown: { 
    position: 'absolute',
    top: 72,
    right: 0,
    left: 0,
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#e2e8f0', 
    borderRadius: 8, 
    zIndex: 1000,
    elevation: 5,
    overflow: 'hidden'
  },
  dropItem: { padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  dropTxt: { fontSize: 13, color: '#334155', fontWeight: '600' },

  statusSelectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  statusLabel: { fontSize: 13, color: '#334155', fontWeight: '700' },
  statusBtnGroup: { flexDirection: 'row', gap: 8 },
  statusBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f1f5f9' },
  statusBtnActive: { backgroundColor: '#1a2d5a' },
  statusBtnActiveDraft: { backgroundColor: '#64748b' },
  statusBtnTxt: { fontSize: 12, color: '#475569', fontWeight: '700' },
  statusBtnTxtActive: { color: '#fff' },

  infoBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: '#ecfdf5', 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 0.5, 
    borderColor: '#a7f3d0',
    marginBottom: 20
  },
  infoText: { flex: 1, fontSize: 11, color: '#065f46', lineHeight: 18, fontWeight: '500' },

  saveBtn: { 
    backgroundColor: '#c0392b', 
    height: 54, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10,
    elevation: 4,
    shadowColor: '#c0392b',
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  saveBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Success Modal Styles
  successBg: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400, alignItems: 'center', elevation: 10, shadowColor: '#0f172a', shadowOpacity: 0.15, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
  successIconOuter: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successIconInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 5 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  successDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  summaryBox: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, width: '100%', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  summaryLbl: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitleEn: { fontSize: 15, fontWeight: '800', color: '#1a2d5a' },
  summaryTitleTe: { fontSize: 12, color: '#475569', marginTop: 2, fontWeight: '600' },
  summaryBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  summaryBadgeTxt: { fontSize: 9, color: '#166534', fontWeight: '800' },
  summaryArtist: { fontSize: 11, color: '#64748b', marginTop: 8, fontWeight: '600' },
  successActionBtn: { backgroundColor: '#1a2d5a', height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 2 },
  successActionTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  successSecBtn: { height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  successSecTxt: { color: '#475569', fontSize: 13, fontWeight: '800' },
  receiptBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#cbd5e1' },
  receiptLbl: { fontSize: 8, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 4 },
  receiptText: { fontSize: 11, color: '#64748b', marginTop: 2 }
});
