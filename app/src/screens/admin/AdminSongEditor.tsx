import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Music, Save, ChevronDown, CheckCircle, Pencil, X, List } from 'lucide-react-native';
import { AdminTabContext } from '../../context/AdminTabContext';
import SalesforceService, { WorshipSong } from '../../services/SalesforceService';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get('window');

const KEYS = ['C', 'C# / Db', 'D', 'D# / Eb', 'E', 'F', 'F# / Gb', 'G', 'G# / Ab', 'A', 'A# / Bb', 'B'];
const CATEGORIES = [
  'Stuthi Songs',
  'Aradhana Songs',
  'Offering Songs',
  'Christmas Songs',
  'Easter Songs',
  'Youth Songs',
  'Other'
];

export default function AdminSongEditor() {
  const { setActiveTab } = useContext(AdminTabContext);

  // Screen-level tab
  const [screenTab, setScreenTab] = useState<'post' | 'list'>('post');
  const [submitting, setSubmitting] = useState(false);

  // ── POST SONG FORM ──────────────────────────────
  const [titleEn, setTitleEn] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [artist, setArtist] = useState('COG Worship');
  const [keySignature, setKeySignature] = useState('C');
  const [lyrics, setLyrics] = useState('');
  const [status, setStatus] = useState('Published');
  const [category, setCategory] = useState('Stuthi Songs');
  const [youtubeId, setYoutubeId] = useState('');

  const [showKeyPicker, setShowKeyPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [syncReceipt, setSyncReceipt] = useState({ savedTo: '', id: '' });

  // ── POSTED SONGS LIST ───────────────────────────
  const [postedSongs, setPostedSongs] = useState<WorshipSong[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // ── EDIT MODAL ──────────────────────────────────
  const [editingSong, setEditingSong] = useState<WorshipSong | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTitleTe, setEditTitleTe] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editKey, setEditKey] = useState('C');
  const [editLyrics, setEditLyrics] = useState('');
  const [editCategory, setEditCategory] = useState('Stuthi Songs');
  const [editYoutubeId, setEditYoutubeId] = useState('');
  const [editStatus, setEditStatus] = useState('Published');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showEditKeyPicker, setShowEditKeyPicker] = useState(false);
  const [showEditCategoryPicker, setShowEditCategoryPicker] = useState(false);

  const fetchPostedSongs = async () => {
    setLoadingList(true);
    try {
      const data = await SalesforceService.getWorshipSongs();
      setPostedSongs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (screenTab === 'list') fetchPostedSongs();
  }, [screenTab]);

  // ── PUBLISH NEW SONG ─────────────────────────────
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
      const receipt = await SalesforceService.createWorshipSong({
        titleEn: titleEn.trim(),
        titleTe: titleTe.trim(),
        artist: artist.trim(),
        keySignature,
        lyrics: lyrics.trim(),
        status,
        category,
        youtubeId: youtubeId.trim()
      });
      setSyncReceipt({ savedTo: receipt.savedTo, id: receipt.id });

      const db = getFirestore();
      try {
        await addDoc(collection(db, 'worshipSongs'), {
          title: titleEn.trim(), titleTe: titleTe.trim(), artist: artist.trim(),
          key: keySignature, lyrics: lyrics.trim(), status, category,
          youtubeId: youtubeId.trim(), createdAt: serverTimestamp()
        });
      } catch { /* rules may block — OK */ }

      try {
        await addDoc(collection(db, 'broadcasts'), {
          title: `🎵 New Song: ${titleEn.trim()}`,
          content: `A new worship song "${titleEn.trim()}" has been posted under ${category}!`,
          date: new Date().toISOString().split('T')[0],
          type: 'announcement',
          createdAt: serverTimestamp()
        });
      } catch { /* rules may block — OK */ }

      setShowSuccess(true);
    } catch (error: any) {
      Alert.alert('Salesforce Sync Error', error.message || 'Failed to sync with Salesforce.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitleEn(''); setTitleTe(''); setLyrics(''); setYoutubeId('');
    setArtist('COG Worship'); setKeySignature('C');
    setCategory('Stuthi Songs'); setStatus('Published');
  };

  // ── OPEN EDIT MODAL ──────────────────────────────
  const openEdit = (song: WorshipSong) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditTitleTe(song.titleTe || '');
    setEditArtist(song.artist || 'COG Worship');
    setEditKey(song.key || 'C');
    setEditLyrics(song.lyrics || '');
    setEditCategory(song.category || 'Stuthi Songs');
    setEditYoutubeId(song.youtubeId || '');
    setEditStatus('Published');
  };

  const handleSaveEdit = async () => {
    if (!editingSong) return;
    if (!editTitle.trim()) { Alert.alert('Required', 'Song title is required.'); return; }
    setSavingEdit(true);
    try {
      await SalesforceService.updateWorshipSong(editingSong.id, {
        titleEn: editTitle.trim(),
        titleTe: editTitleTe.trim(),
        artist: editArtist.trim(),
        keySignature: editKey,
        lyrics: editLyrics.trim(),
        category: editCategory,
        status: editStatus,
        youtubeId: editYoutubeId.trim()
      });
      Alert.alert('✅ Updated', 'Song updated successfully in Salesforce!');
      setEditingSong(null);
      fetchPostedSongs();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update song.');
    } finally {
      setSavingEdit(false);
    }
  };

  // ── RENDER POSTED SONG ITEM ──────────────────────
  const renderSongItem = ({ item, index }: { item: WorshipSong; index: number }) => (
    <View style={styles.songItem}>
      <View style={styles.songIconBox}>
        <Music size={16} color="#1a2d5a" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.songItemTitle} numberOfLines={1}>{index + 1}. {item.title}</Text>
        <Text style={styles.songItemSub} numberOfLines={1}>
          {item.category || 'Other'} · Key: {item.key}
        </Text>
      </View>
      <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
        <Pencil size={15} color="#1a2d5a" />
      </TouchableOpacity>
    </View>
  );

  // ── POST SONG FORM UI ────────────────────────────
  const renderPostForm = () => (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>SONG DETAILS</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SONG TITLE (ENGLISH) · ఆంగ్ల శీర్షిక *</Text>
          <TextInput style={styles.textInput} placeholder="E.g. Amazing Grace..."
            placeholderTextColor="#94a3b8" value={titleEn} onChangeText={setTitleEn} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SONG TITLE (TELUGU) · తెలుగు శీర్షిక</Text>
          <TextInput style={styles.textInput} placeholder="ఉదాహరణ: అద్భుతమైన కృప..."
            placeholderTextColor="#94a3b8" value={titleTe} onChangeText={setTitleTe} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>YOUTUBE VIDEO LINK · యూట్యూబ్ లింక్</Text>
          <TextInput style={styles.textInput} placeholder="E.g. dQw4w9WgXcQ or https://youtu.be/..."
            placeholderTextColor="#94a3b8" value={youtubeId} onChangeText={setYoutubeId} />
        </View>

        {/* Artist + Category Row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>ARTIST / BAND</Text>
            <TextInput style={styles.textInput} placeholder="COG Worship..."
              placeholderTextColor="#94a3b8" value={artist} onChangeText={setArtist} />
          </View>
          <View style={{ width: 10 }} />
          <View style={[styles.inputGroup, { width: 145 }]}>
            <Text style={styles.label}>CATEGORY</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCategoryPicker(true)}>
              <Text style={styles.pickerTxt} numberOfLines={1}>{category}</Text>
              <ChevronDown size={14} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.inputGroup, { width: 160 }]}>
          <Text style={styles.label}>KEY SIGNATURE</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowKeyPicker(true)}>
            <Text style={styles.pickerTxt}>{keySignature}</Text>
            <ChevronDown size={14} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SONG LYRICS & SCRIPTS · సాహిత్యం *</Text>
          <TextInput
            style={[styles.textInput, { height: 200, textAlignVertical: 'top', paddingTop: 12 }]}
            placeholder={`Verse 1:\nAmazing grace! How sweet the sound...\n\nChorus:\nMy chains are gone, I've been set free...`}
            placeholderTextColor="#94a3b8" multiline value={lyrics} onChangeText={setLyrics}
          />
        </View>

        <View style={styles.statusSelectRow}>
          <Text style={styles.statusLabel}>Publish Status</Text>
          <View style={styles.statusBtnGroup}>
            <TouchableOpacity style={[styles.statusBtn, status === 'Published' && styles.statusBtnActive]}
              onPress={() => setStatus('Published')}>
              <Text style={[styles.statusBtnTxt, status === 'Published' && styles.statusBtnTxtActive]}>Published</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statusBtn, status === 'Draft' && styles.statusBtnActiveDraft]}
              onPress={() => setStatus('Draft')}>
              <Text style={[styles.statusBtnTxt, status === 'Draft' && styles.statusBtnTxtActive]}>Draft</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.infoBox}>
        <CheckCircle size={16} color="#059669" />
        <Text style={styles.infoText}>
          This syncs a <Text style={{ fontWeight: '700' }}>Worship_Song__c</Text> record to Salesforce Production instantly!
        </Text>
      </View>

      <TouchableOpacity style={[styles.saveBtn, submitting && { backgroundColor: '#94a3b8' }]}
        onPress={handlePublishSong} disabled={submitting}>
        {submitting
          ? <ActivityIndicator size="small" color="#fff" />
          : <><Save size={18} color="#fff" /><Text style={styles.saveBtnTxt}>Publish Song Lyrics</Text></>
        }
      </TouchableOpacity>
      <View style={{ height: 60 }} />
    </ScrollView>
  );

  // ── POSTED SONGS LIST UI ─────────────────────────
  const renderPostedList = () => (
    <View style={{ flex: 1 }}>
      {loadingList ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#c0392b" />
        </View>
      ) : (
        <FlatList
          data={postedSongs}
          keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={styles.listHeaderRow}>
              <Text style={styles.listHeaderTitle}>All Posted Songs</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countTxt}>{postedSongs.length} Songs</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Music size={44} color="#cbd5e1" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1a2d5a', marginTop: 12 }}>No songs yet</Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Post your first song using the "Post Song" tab.</Text>
            </View>
          )}
          refreshing={loadingList}
          onRefresh={fetchPostedSongs}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Music size={20} color="#FCD34D" />
          <Text style={styles.headerTitle}>Song Manager</Text>
        </View>
      </View>

      {/* Screen Tabs */}
      <View style={styles.screenTabBar}>
        <TouchableOpacity
          style={[styles.screenTab, screenTab === 'post' && styles.screenTabActive]}
          onPress={() => setScreenTab('post')}>
          <Save size={14} color={screenTab === 'post' ? '#fff' : '#64748b'} />
          <Text style={[styles.screenTabTxt, screenTab === 'post' && styles.screenTabTxtActive]}>Post Song</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.screenTab, screenTab === 'list' && styles.screenTabActive]}
          onPress={() => setScreenTab('list')}>
          <List size={14} color={screenTab === 'list' ? '#fff' : '#64748b'} />
          <Text style={[styles.screenTabTxt, screenTab === 'list' && styles.screenTabTxtActive]}>Posted Songs</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {screenTab === 'post' ? renderPostForm() : renderPostedList()}

      {/* ── Category Picker Modal ── */}
      {showCategoryPicker && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setShowCategoryPicker(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCategoryPicker(false)}>
            <View style={styles.pickerModalBox}>
              <Text style={styles.pickerModalTitle}>Select Category</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} style={styles.pickerModalItem}
                    onPress={() => { setCategory(c); setShowCategoryPicker(false); }}>
                    <Text style={[styles.pickerModalTxt, category === c && { color: '#c0392b', fontWeight: '800' }]}>{c}</Text>
                    {category === c && <CheckCircle size={16} color="#c0392b" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ── Key Picker Modal ── */}
      {showKeyPicker && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setShowKeyPicker(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowKeyPicker(false)}>
            <View style={styles.pickerModalBox}>
              <Text style={styles.pickerModalTitle}>Select Key Signature</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {KEYS.map(k => (
                  <TouchableOpacity key={k} style={styles.pickerModalItem}
                    onPress={() => { setKeySignature(k); setShowKeyPicker(false); }}>
                    <Text style={[styles.pickerModalTxt, keySignature === k && { color: '#c0392b', fontWeight: '800' }]}>{k}</Text>
                    {keySignature === k && <CheckCircle size={16} color="#c0392b" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ── Edit Song Modal ── */}
      {editingSong && (
        <Modal transparent animationType="slide" visible onRequestClose={() => setEditingSong(null)}>
          <View style={styles.editModalBg}>
            <View style={styles.editModalCard}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Edit Song</Text>
                <TouchableOpacity onPress={() => setEditingSong(null)} style={styles.editCloseBtn}>
                  <X size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={{ padding: 20 }}>
                  <Text style={styles.label}>TITLE (ENGLISH) *</Text>
                  <TextInput style={[styles.textInput, { marginBottom: 14 }]} value={editTitle}
                    onChangeText={setEditTitle} placeholder="Song title..." placeholderTextColor="#94a3b8" />

                  <Text style={styles.label}>TITLE (TELUGU)</Text>
                  <TextInput style={[styles.textInput, { marginBottom: 14 }]} value={editTitleTe}
                    onChangeText={setEditTitleTe} placeholder="తెలుగు శీర్షిక..." placeholderTextColor="#94a3b8" />

                  <Text style={styles.label}>ARTIST</Text>
                  <TextInput style={[styles.textInput, { marginBottom: 14 }]} value={editArtist}
                    onChangeText={setEditArtist} placeholder="COG Worship..." placeholderTextColor="#94a3b8" />

                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>CATEGORY</Text>
                      <TouchableOpacity style={[styles.pickerBtn, { marginBottom: 14 }]}
                        onPress={() => setShowEditCategoryPicker(true)}>
                        <Text style={styles.pickerTxt} numberOfLines={1}>{editCategory}</Text>
                        <ChevronDown size={14} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ width: 10 }} />
                    <View style={{ width: 120 }}>
                      <Text style={styles.label}>KEY</Text>
                      <TouchableOpacity style={[styles.pickerBtn, { marginBottom: 14 }]}
                        onPress={() => setShowEditKeyPicker(true)}>
                        <Text style={styles.pickerTxt}>{editKey}</Text>
                        <ChevronDown size={14} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.label}>YOUTUBE ID / LINK</Text>
                  <TextInput style={[styles.textInput, { marginBottom: 14 }]} value={editYoutubeId}
                    onChangeText={setEditYoutubeId} placeholder="YouTube ID..." placeholderTextColor="#94a3b8" />

                  <Text style={styles.label}>LYRICS *</Text>
                  <TextInput
                    style={[styles.textInput, { height: 180, textAlignVertical: 'top', paddingTop: 12, marginBottom: 20 }]}
                    value={editLyrics} onChangeText={setEditLyrics}
                    placeholder="Song lyrics..." placeholderTextColor="#94a3b8" multiline
                  />

                  <TouchableOpacity style={[styles.saveBtn, savingEdit && { backgroundColor: '#94a3b8' }]}
                    onPress={handleSaveEdit} disabled={savingEdit}>
                    {savingEdit
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <><Save size={18} color="#fff" /><Text style={styles.saveBtnTxt}>Save Changes</Text></>
                    }
                  </TouchableOpacity>
                  <View style={{ height: 30 }} />
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Edit Category Picker */}
          {showEditCategoryPicker && (
            <Modal transparent animationType="fade" visible onRequestClose={() => setShowEditCategoryPicker(false)}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1}
                onPress={() => setShowEditCategoryPicker(false)}>
                <View style={styles.pickerModalBox}>
                  <Text style={styles.pickerModalTitle}>Select Category</Text>
                  <ScrollView>
                    {CATEGORIES.map(c => (
                      <TouchableOpacity key={c} style={styles.pickerModalItem}
                        onPress={() => { setEditCategory(c); setShowEditCategoryPicker(false); }}>
                        <Text style={[styles.pickerModalTxt, editCategory === c && { color: '#c0392b', fontWeight: '800' }]}>{c}</Text>
                        {editCategory === c && <CheckCircle size={16} color="#c0392b" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          )}
          {/* Edit Key Picker */}
          {showEditKeyPicker && (
            <Modal transparent animationType="fade" visible onRequestClose={() => setShowEditKeyPicker(false)}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1}
                onPress={() => setShowEditKeyPicker(false)}>
                <View style={styles.pickerModalBox}>
                  <Text style={styles.pickerModalTitle}>Select Key</Text>
                  <ScrollView>
                    {KEYS.map(k => (
                      <TouchableOpacity key={k} style={styles.pickerModalItem}
                        onPress={() => { setEditKey(k); setShowEditKeyPicker(false); }}>
                        <Text style={[styles.pickerModalTxt, editKey === k && { color: '#c0392b', fontWeight: '800' }]}>{k}</Text>
                        {editKey === k && <CheckCircle size={16} color="#c0392b" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </Modal>
      )}

      {/* ── Success Modal ── */}
      {showSuccess && (
        <Modal transparent visible animationType="fade">
          <View style={styles.successBg}>
            <View style={styles.successCard}>
              <View style={styles.successIconOuter}>
                <View style={styles.successIconInner}>
                  <CheckCircle size={36} color="#fff" />
                </View>
              </View>
              <Text style={styles.successTitle}>Publication Successful!</Text>
              <Text style={styles.successDesc}>
                "{titleEn}" has been published under <Text style={{ fontWeight: '800', color: '#1a2d5a' }}>{category}</Text> and synced to Salesforce!
              </Text>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryLbl}>SALESFORCE RECEIPT</Text>
                <Text style={styles.receiptText}>Object: <Text style={{ fontWeight: '700', color: '#1e293b' }}>{syncReceipt.savedTo}</Text></Text>
                <Text style={styles.receiptText}>ID: <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 10, color: '#475569', fontWeight: '700' }}>{syncReceipt.id}</Text></Text>
              </View>
              <TouchableOpacity style={styles.successActionBtn} onPress={() => { setShowSuccess(false); resetForm(); setActiveTab(0); }}>
                <Text style={styles.successActionTxt}>Back to Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.successSecBtn} onPress={() => { setShowSuccess(false); resetForm(); }}>
                <Text style={styles.successSecTxt}>Post Another Song</Text>
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

  // Screen Tab Bar
  screenTabBar: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    margin: 16,
    borderRadius: 25,
    padding: 4,
    gap: 4
  },
  screenTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 21, gap: 6 },
  screenTabActive: { backgroundColor: '#1a2d5a' },
  screenTabTxt: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  screenTabTxtActive: { color: '#fff' },

  scroll: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#1a2d5a', letterSpacing: 1, marginBottom: 20 },

  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  label: { fontSize: 10, fontWeight: '800', color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  textInput: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 8, paddingHorizontal: 14, height: 48, fontSize: 13, color: '#1e293b', fontWeight: '600'
  },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, height: 48 },
  pickerTxt: { fontSize: 13, color: '#1e293b', fontWeight: '700', flex: 1 },

  statusSelectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  statusLabel: { fontSize: 13, color: '#334155', fontWeight: '700' },
  statusBtnGroup: { flexDirection: 'row', gap: 8 },
  statusBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#f1f5f9' },
  statusBtnActive: { backgroundColor: '#1a2d5a' },
  statusBtnActiveDraft: { backgroundColor: '#64748b' },
  statusBtnTxt: { fontSize: 12, color: '#475569', fontWeight: '700' },
  statusBtnTxtActive: { color: '#fff' },

  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ecfdf5', padding: 15, borderRadius: 12, borderWidth: 0.5, borderColor: '#a7f3d0', marginBottom: 20 },
  infoText: { flex: 1, fontSize: 11, color: '#065f46', lineHeight: 18, fontWeight: '500' },

  saveBtn: { backgroundColor: '#c0392b', height: 54, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 4, shadowColor: '#c0392b', shadowOpacity: 0.3, shadowRadius: 5 },
  saveBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // List
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listHeaderTitle: { fontSize: 15, fontWeight: '800', color: '#1a2d5a' },
  countBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  countTxt: { fontSize: 11, fontWeight: '800', color: '#059669' },
  songItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3 },
  songIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  songItemTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  songItemSub: { fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: '500' },
  editBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center' },

  // Picker Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  pickerModalBox: { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 320, maxHeight: '65%', paddingVertical: 15, elevation: 10 },
  pickerModalTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 5, letterSpacing: 0.5 },
  pickerModalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  pickerModalTxt: { fontSize: 15, color: '#1e293b', fontWeight: '600' },

  // Edit Modal
  editModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  editModalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: height * 0.88 },
  editModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  editModalTitle: { fontSize: 17, fontWeight: '900', color: '#1e293b' },
  editCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },

  // Success Modal
  successBg: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  successCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400, alignItems: 'center', elevation: 10 },
  successIconOuter: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successIconInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  successDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  summaryBox: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, width: '100%', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  summaryLbl: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 6 },
  receiptText: { fontSize: 11, color: '#64748b', marginTop: 2 },
  successActionBtn: { backgroundColor: '#1a2d5a', height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  successActionTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  successSecBtn: { height: 48, borderRadius: 12, width: '100%', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  successSecTxt: { color: '#475569', fontSize: 13, fontWeight: '800' },
});
