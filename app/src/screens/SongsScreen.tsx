import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Search, 
  Music, 
  ChevronRight, 
  Play, 
  AlertCircle,
  FileText,
  X,
  BookOpen
} from 'lucide-react-native';
import Theme from '../theme/Theme';
import SalesforceService, { WorshipSong } from '../services/SalesforceService';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface StaticLyricSong {
  id: string;
  titleEn: string;
  titleTe: string;
  artist: string;
  lyricsEn: string;
  lyricsTe: string;
  suggestedKey: string;
}

const STATIC_LYRICS: StaticLyricSong[] = []; // Replaced by dynamic Salesforce feed below

export default function SongsScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'list' | 'lyrics'>('list');
  const [search, setSearch] = useState('');
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLyricSong, setSelectedLyricSong] = useState<StaticLyricSong | null>(null);

  const fetchSongs = async () => {
    try {
      const data = await SalesforceService.getWorshipSongs();
      setSongs(data);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSongs();
  };

  // Filter Worship Songs (Dynamic Salesforce Songs)
  const filteredSongs = songs.filter(s => {
    const songData = s as any;
    const query = search.toLowerCase().trim();
    return (
      s.title.toLowerCase().includes(query) || 
      (songData.titleTe && songData.titleTe.toLowerCase().includes(query)) ||
      (s.artist && s.artist.toLowerCase().includes(query)) ||
      (s.key && s.key.toLowerCase().includes(query))
    );
  });

  // Filter Dynamic Lyrics (Salesforce Songs under Lyrics View)
  const filteredLyrics = songs.filter(s => {
    const songData = s as any;
    const query = search.toLowerCase().trim();
    return (
      s.title.toLowerCase().includes(query) || 
      (songData.titleTe && songData.titleTe.toLowerCase().includes(query)) ||
      (s.artist && s.artist.toLowerCase().includes(query))
    );
  });

  const renderWorshipSong = ({ item }: { item: WorshipSong }) => {
    const songData = item as any;
    const lyricSong: StaticLyricSong = {
      id: item.id,
      titleEn: item.title,
      titleTe: songData.titleTe || '',
      artist: item.artist || 'COG Worship',
      suggestedKey: item.key || 'C',
      lyricsEn: songData.lyrics || 'Lyrics details are currently being updated in Salesforce by the administrator.',
      lyricsTe: ''
    };

    return (
      <TouchableOpacity 
        style={[styles.songCard, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e5e7eb' }]}
        onPress={() => setSelectedLyricSong(lyricSong)}
      >
        <View style={[styles.iconBox, { backgroundColor: isDark ? '#0f172a' : '#f3f4f6' }]}>
          <Music size={18} color="#1a2d5a" />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.artist, { color: isDark ? '#94a3b8' : '#6B7280' }]} numberOfLines={1}>
            {songData.titleTe ? `${songData.titleTe} · ` : ''}{item.artist}
          </Text>
        </View>
        <View style={styles.keyBadge}>
          <Text style={styles.keyTxt}>KEY: {item.key || 'C'}</Text>
        </View>
        <ChevronRight size={16} color={isDark ? '#475569' : '#D1D5DB'} />
      </TouchableOpacity>
    );
  };

  const renderLyricItem = ({ item }: { item: WorshipSong }) => {
    const songData = item as any;
    const lyricSong: StaticLyricSong = {
      id: item.id,
      titleEn: item.title,
      titleTe: songData.titleTe || '',
      artist: item.artist || 'COG Worship',
      suggestedKey: item.key || 'C',
      lyricsEn: songData.lyrics || 'Lyrics details are currently being updated in Salesforce by the administrator.',
      lyricsTe: ''
    };

    return (
      <TouchableOpacity 
        style={[styles.songCard, { backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e5e7eb' }]}
        onPress={() => setSelectedLyricSong(lyricSong)}
      >
        <View style={[styles.iconBox, { backgroundColor: isDark ? '#0f172a' : '#f3f4f6' }]}>
          <FileText size={18} color="#0F766E" />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.artist, { color: isDark ? '#94a3b8' : '#6B7280' }]} numberOfLines={1}>
            {songData.titleTe ? `${songData.titleTe} · ` : ''}{item.artist}
          </Text>
        </View>
        <View style={[styles.keyBadge, { backgroundColor: '#eff6ff' }]}>
          <Text style={[styles.keyTxt, { color: '#1e40af' }]}>KEY: {item.key || 'C'}</Text>
        </View>
        <ChevronRight size={16} color={isDark ? '#475569' : '#D1D5DB'} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* Header */}
      <View style={styles.pageHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.titleCol}>
          <Text style={styles.pageTitle}>Worship & Praise</Text>
          <Text style={styles.pageSub}>స్తుతి మరియు ఆరాధన</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Elegant Sub-Tab Toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'list' && styles.tabActive]}
          onPress={() => {
            setActiveTab('list');
            setSearch('');
          }}
        >
          <Music size={14} color={activeTab === 'list' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>
            Worship Songs List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'lyrics' && styles.tabActive]}
          onPress={() => {
            setActiveTab('lyrics');
            setSearch('');
          }}
        >
          <FileText size={14} color={activeTab === 'lyrics' ? '#fff' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'lyrics' && styles.tabTextActive]}>
            Lyrics / Scripts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBarContainer, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
        <Search size={20} color={isDark ? '#94a3b8' : '#64748b'} />
        <TextInput
          placeholder={activeTab === 'list' ? "Search worship songs list..." : "Search scripts & lyrics..."}
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
          style={[styles.searchInput, { color: isDark ? '#fff' : '#0f172a' }]}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.searchClearBtn}>
            <Text style={styles.searchClearTxt}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Lists */}
      {activeTab === 'list' ? (
        loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fbbf24" />
          </View>
        ) : (
          <FlatList
            data={filteredSongs}
            keyExtractor={(item) => item.id}
            renderItem={renderWorshipSong}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" />
            }
            ListHeaderComponent={() => (
              <Text style={styles.secLbl}>CHURCH CHORD LIST · గీతాల జాబితా</Text>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <AlertCircle size={44} color="#cbd5e1" />
                <Text style={[styles.emptyTitle, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>No worship songs found</Text>
                <Text style={styles.emptySub}>Refresh the list or search a different chord</Text>
              </View>
            }
          />
        )
      ) : (
        <FlatList
          data={filteredLyrics}
          keyExtractor={(item) => item.id}
          renderItem={renderLyricItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <Text style={styles.secLbl}>PRAISE SCRIPTS · లిరిక్స్ / స్క్రిప్ట్స్</Text>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AlertCircle size={44} color="#cbd5e1" />
              <Text style={[styles.emptyTitle, { color: isDark ? '#94a3b8' : '#1a2d5a' }]}>No lyrics found</Text>
              <Text style={styles.emptySub}>Try searching other titles</Text>
            </View>
          }
        />
      )}

      {/* Lyrics Detail Modal */}
      {selectedLyricSong && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSelectedLyricSong(null)}
        >
          <View style={styles.modalBg}>
            <View style={[styles.modalCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitleEn, { color: isDark ? '#fff' : '#0f172a' }]}>{selectedLyricSong.titleEn}</Text>
                  <Text style={styles.modalTitleTe}>{selectedLyricSong.titleTe} · Key: {selectedLyricSong.suggestedKey}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.modalCloseBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]} 
                  onPress={() => setSelectedLyricSong(null)}
                >
                  <X size={20} color={isDark ? '#fff' : '#475569'} />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {selectedLyricSong.lyricsEn ? (
                  <>
                    <Text style={[styles.modalSecHeader, { color: '#1a2d5a' }]}>LYRICS & SCRIPTS · సాహిత్యం</Text>
                    <View style={[styles.lyricsBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                      <Text style={[styles.lyricsText, { color: isDark ? '#e2e8f0' : '#334155' }]}>{selectedLyricSong.lyricsEn}</Text>
                    </View>
                  </>
                ) : null}

                {selectedLyricSong.lyricsTe ? (
                  <>
                    <View style={{ height: 20 }} />
                    <Text style={[styles.modalSecHeader, { color: '#0F766E' }]}>తెలుగు లిరిక్స్</Text>
                    <View style={[styles.lyricsBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                      <Text style={[styles.lyricsText, { color: isDark ? '#e2e8f0' : '#334155', fontSize: 14 }]}>{selectedLyricSong.lyricsTe}</Text>
                    </View>
                  </>
                ) : null}
                <View style={{ height: 60 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  
  // Header
  pageHeader: {
    backgroundColor: '#1a2d5a',
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  backBtn: { padding: 4 },
  titleCol: { flex: 1, alignItems: 'center' },
  pageTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  pageSub: { color: '#aac4e8', fontSize: 10, marginTop: 1, fontWeight: '500' },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
    marginVertical: 15,
    borderRadius: 25,
    padding: 4,
    gap: 4
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 21,
    gap: 6
  },
  tabActive: { backgroundColor: '#1a2d5a' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 15,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 48,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
    marginLeft: 8
  },
  searchClearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearTxt: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
  },

  listContent: { paddingBottom: 40 },
  secLbl: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.8, marginHorizontal: 16, marginBottom: 12, marginTop: 5 },

  // Song Card
  songCard: { 
    borderRadius: 16, borderWidth: 0.5, 
    marginHorizontal: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', padding: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }
  },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700' },
  artist: { fontSize: 11, marginTop: 2, fontWeight: '500' },
  
  keyBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  keyTxt: { fontSize: 9, color: '#166534', fontWeight: '800' },

  emptyState: { padding: 40, alignItems: 'center', marginTop: 30 },
  emptyTitle: { fontSize: 15, fontWeight: '800', marginTop: 12 },
  emptySub: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 4 },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 25, borderTopRightRadius: 25, height: height * 0.85, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderColor: '#cbd5e1', paddingBottom: 15, marginBottom: 15 },
  modalTitleEn: { fontSize: 18, fontWeight: '900' },
  modalTitleTe: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '700' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalScroll: { flex: 1 },
  modalSecHeader: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  lyricsBox: { borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#e2e8f0' },
  lyricsText: { fontSize: 13, lineHeight: 22, fontWeight: '600', fontStyle: 'italic' }
});
