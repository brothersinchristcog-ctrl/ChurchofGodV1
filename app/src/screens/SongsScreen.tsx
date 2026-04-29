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
  Image,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Search, 
  Music, 
  ChevronRight, 
  Play, 
  AlertCircle,
  FileText
} from 'lucide-react-native';
import Theme from '../theme/Theme';
import SalesforceService, { WorshipSong } from '../services/SalesforceService';

const { width } = Dimensions.get('window');

export default function SongsScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [songs, setSongs] = useState<WorshipSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.artist.toLowerCase().includes(search.toLowerCase())
  );

  const renderSong = ({ item }: { item: WorshipSong }) => (
    <TouchableOpacity 
      style={styles.songCard}
      onPress={() => Alert.alert('Play Song', `Playing ${item.title}...`)}
    >
      <View style={styles.iconBox}>
        <Music size={18} color="#1a2d5a" />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <View style={styles.keyBadge}>
        <Text style={styles.keyTxt}>KEY: {item.key}</Text>
      </View>
      <ChevronRight size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Page Header ── */}
      <View style={styles.pageHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={20} color="#aac4e8" />
          <Text style={styles.backBtnTxt}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleCol}>
          <Text style={styles.pageTitle}>Worship Songs</Text>
          <Text style={styles.pageSub}>ఆరాధన గీతాలు</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search lyrics or titles..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        renderItem={renderSong}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" />
        }
        ListHeaderComponent={() => (
          <Text style={styles.secLbl}>ALL PRAISE SONGS · అన్ని పాటలు</Text>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AlertCircle size={50} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No songs found</Text>
            <Text style={styles.emptySub}>Try searching for something else</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  pageHeader: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  backBtnTxt: { color: '#aac4e8', fontSize: 13, fontWeight: '500' },
  titleCol: { flex: 1, alignItems: 'center' },
  pageTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  pageSub: { color: '#aac4e8', fontSize: 9.5, marginTop: 1 },

  // Search
  searchSection: { backgroundColor: '#1a2d5a', paddingHorizontal: 16, paddingBottom: 16 },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 13, marginLeft: 8 },

  listContent: { paddingBottom: 40 },
  secLbl: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.6, marginHorizontal: 16, marginBottom: 12, marginTop: 16 },

  // Song Card
  songCard: { 
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#e5e7eb', 
    marginHorizontal: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', padding: 12 
  },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', color: '#111827' },
  artist: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  
  keyBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 10 },
  keyTxt: { fontSize: 8, color: '#166534', fontWeight: '800' },

  emptyState: { padding: 40, alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1a2d5a', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
});
