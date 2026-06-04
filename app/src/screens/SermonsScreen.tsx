import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Play, 
  Mic, 
  Headphones,
  CheckCircle,
  Video,
  Share2
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import SalesforceService, { Sermon } from '../services/SalesforceService';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All'];

export default function SermonsScreen({ navigation }: any) {
  const { isDark, toggleTheme, colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSermons = async () => {
    try {
      const data = await SalesforceService.getSermons(32);
      setSermons(data);
    } catch (error) {
      console.error('Error fetching sermons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSermons();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSermons();
  };

  const latestSermon = sermons[0] || {
    id: 'placeholder',
    title: 'Walking in Faith Through Every Trial',
    titleTelugu: 'విశ్వాసంతో నడవడం',
    pastor: 'Brother Y. Rajesh',
    date: 'Apr 13',
    scripture: 'James 1:2-4',
    duration: '42 min',
    viewCount: 1240,
    youtubeId: 'mock'
  };

  const renderSermonItem = ({ item, index }: { item: Sermon; index: number }) => (
    <TouchableOpacity 
      style={styles.sermonCard}
      onPress={() => navigation.navigate('DailyVideo', { 
        youtubeId: item.youtubeId, 
        videoTitle: item.title,
        pastor: item.pastor 
      })}
    >
      <View style={styles.scThumb}>
        <View style={styles.playOverlay}>
          <Play size={16} color="#fff" fill="#c0392b" />
        </View>
      </View>
      <View style={styles.scInfo}>
        <Text style={styles.scTitle} numberOfLines={1}>
          {item.title} {item.titleTelugu ? `|| ${item.titleTelugu}` : ''}
        </Text>
        <Text style={styles.scMeta}>
          {item.pastor || 'Brother Y. Rajesh'} · {item.date || 'N/A'} {item.duration && item.duration !== 'N/A' ? ` · ${item.duration}` : ''}
        </Text>
        <View style={styles.scTags}>
          <View style={[styles.tag, { backgroundColor: '#f5f3ff' }]}>
            <Text style={[styles.tagTxt, { color: '#7c3aed' }]}>Prayer Life</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: '#fff1f2' }]}>
            <Play size={10} color="#e11d48" fill="#e11d48" />
            <Text style={[styles.tagTxt, { color: '#e11d48' }]}>YouTube</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: '#f0fdf4' }]}>
            <Mic size={10} color="#16a34a" />
            <Text style={[styles.tagTxt, { color: '#16a34a' }]}>Audio</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.primary }]}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading Sermons...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── Page Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Sermons</Text>
          <Text style={styles.headerSub}>{sermons.length} sermons</Text>
        </View>

        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <Text style={styles.themeToggleText}>{isDark ? '🌙 Dark' : '☀️ Light'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Category Filters ── */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.pill, activeCategory === cat && styles.pillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.pillText, activeCategory === cat && styles.pillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={sermons.length > 1 ? sermons.slice(1) : []}
        keyExtractor={(item) => item.id}
        renderItem={renderSermonItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" />
        }
        ListHeaderComponent={() => (
          <View>
            {/* ── Hero Latest Sermon Card ── */}
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>LATEST SERMON · తాజా ప్రసంగం</Text>
              <Text style={styles.heroTitle}>
                {latestSermon.title} {latestSermon.titleTelugu ? `|| ${latestSermon.titleTelugu}` : ''}
              </Text>
              
              <Text style={styles.heroMeta}>
                {latestSermon.pastor} · {latestSermon.date} {latestSermon.scripture ? ` · ${latestSermon.scripture}` : ''} {latestSermon.duration && latestSermon.duration !== 'N/A' ? ` · ${latestSermon.duration}` : ''}
              </Text>

              <View style={styles.heroActions}>
                <TouchableOpacity 
                  style={styles.heroWatchBtn}
                  onPress={() => navigation.navigate('DailyVideo', { 
                    youtubeId: latestSermon.youtubeId, 
                    videoTitle: latestSermon.title,
                    pastor: latestSermon.pastor 
                  })}
                >
                  <Play size={18} color="#fff" fill="#fff" />
                  <Text style={styles.heroBtnText}>Watch</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.heroListenBtn}>
                  <Mic size={18} color="#fff" />
                  <Text style={styles.heroBtnText}>Listen</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fbbf24', marginTop: 15, fontWeight: '600' },

  // Header
  header: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 60 : 25,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSub: { color: '#aac4e8', fontSize: 11, marginTop: 2 },
  themeToggle: { 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  themeToggleText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Filters
  filterSection: { paddingVertical: 15 },
  filterScroll: { paddingHorizontal: 20, gap: 10 },
  pill: { 
    paddingHorizontal: 18, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  pillActive: { backgroundColor: '#1a2d5a', borderColor: '#1a2d5a' },
  pillText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  pillTextActive: { color: '#fff' },

  // Hero Card
  heroCard: { 
    margin: 20, 
    marginTop: 5,
    backgroundColor: '#1a2d5a', 
    borderRadius: 20, 
    padding: 22,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  heroLabel: { fontSize: 10, color: '#FCD34D', fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  heroTitle: { fontSize: 19, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroTitleTe: { fontSize: 17, color: '#aac4e8', marginBottom: 10, fontWeight: '500' },
  heroMeta: { fontSize: 11, color: '#7aa3d4', lineHeight: 18, marginBottom: 20 },
  heroActions: { flexDirection: 'row', gap: 12 },
  heroWatchBtn: { 
    flex: 1, 
    backgroundColor: '#c0392b', 
    borderRadius: 12, 
    paddingVertical: 14, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8 
  },
  heroListenBtn: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: 12, 
    paddingVertical: 14, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8 
  },
  heroBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // List
  listContainer: { paddingBottom: 40 },
  sermonCard: { 
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    marginBottom: 12, 
    borderRadius: 16, 
    padding: 15,
    flexDirection: 'row',
    gap: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  scThumb: { 
    width: 85, 
    height: 60, 
    backgroundColor: '#0f172a', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden'
  },
  playOverlay: { 
    width: '100%', 
    height: '100%', 
    backgroundColor: 'rgba(0,0,0,0.1)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scInfo: { flex: 1 },
  scTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  scTitleTe: { fontSize: 12, color: '#64748b', marginTop: 2 },
  scMeta: { fontSize: 10, color: '#94a3b8', marginTop: 5 },
  scTags: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  tag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 8, 
    gap: 4 
  },
  tagTxt: { fontSize: 9, fontWeight: '700' },
});
