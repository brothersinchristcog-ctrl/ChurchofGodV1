import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
  StatusBar,
  Platform,
  ImageBackground,
  Share
} from 'react-native';
import { 
  Bell, 
  Book, 
  Play, 
  ChevronRight, 
  Share2, 
  Mic, 
  Heart, 
  Calendar, 
  MapPin,
  CircleDollarSign as DollarSign,
  BookOpen,
  MessageSquare,
  Users,
  MoreHorizontal,
  CheckCircle,
  Sun,
  Moon
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import Theme from '../theme/Theme';
import SalesforceService, { DailyPromise, ScheduleEvent, SalesforceMember, Sermon } from '../services/SalesforceService';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Utility to strip HTML tags
const stripHtml = (html: string | undefined): string => {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').trim();
};

import { useTheme } from '../context/ThemeContext';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const { mode, isDark, toggleTheme, colors } = useTheme();
  const [member, setMember] = useState<SalesforceMember | null>(null);
  const [promise, setPromise] = useState<DailyPromise | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [latestSermon, setLatestSermon] = useState<Sermon | null>(null);
  const [latestPrayer, setLatestPrayer] = useState<any | null>(null);
  const [prayerCount, setPrayerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // 1. Fetch Member Details
      if (user?.phoneNumber) {
        const contactCheck = await SalesforceService.checkContactExists(user.phoneNumber);
        if (contactCheck?.exists && contactCheck.member) {
          setMember(contactCheck.member);
        }
      }

      // 2. Fetch Daily Promise
      const sfPromise = await SalesforceService.getDailyPromise();
      if (sfPromise) setPromise(sfPromise);

      // 3. Fetch Upcoming Events
      const sfEvents = await SalesforceService.getUpcomingEvents(3);
      setEvents(sfEvents);

      // 4. Fetch Latest Sermon
      const sfSermons = await SalesforceService.getSermons(1);
      if (sfSermons.length > 0) setLatestSermon(sfSermons[0]);

      // 5. Fetch Latest Prayer
      const sfPrayers = await SalesforceService.getPrayerRequests();
      if (sfPrayers.length > 0) {
        setLatestPrayer(sfPrayers[0]);
        setPrayerCount(sfPrayers.length);
      }

    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSharePromise = async () => {
    if (!promise) return;
    try {
      const verseEn = stripHtml(promise.verse);
      const verseTe = stripHtml(promise.verseTelugu);
      const message = `Today's Promise · ఈ రోజు వాగ్దానం\n\n"${verseEn}"\n— ${promise.verseReferenceEn || 'Scripture'}\n\n"${verseTe}"\n— ${promise.verseReferenceTe || 'వాగ్దానం'}\n\nWatch Devotional: https://youtu.be/${promise.youtubeId}\n\nBrothers in Christ Fellowship 🙏`;
      await Share.share({ message });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return { day: '--', month: '---' };
    const d = new Date(dateStr);
    return {
      day: d.getDate().toString(),
      month: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
    };
  };

  const getTeluguDay = () => {
    const days = ['ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం'];
    return days[new Date().getDay()];
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    try {
      // Handles formats like '21:00:00.000Z' or '09:30:00'
      const timePart = timeStr.includes('T') ? timeStr.split('T')[1].split('.')[0] : timeStr;
      const [hours, minutes] = timePart.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedHours = h % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const formatTeluguDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const monthsTe = ['జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్', 'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'];
      return `${monthsTe[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const upcomingEvents = events;

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.primary }]}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Church of GOD — A Gateway to Heaven</Text>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2d5a" />
      
      {/* ── App Header (Updated Layout) ── */}
      <View style={styles.appHeader}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeft}>
            {/* Perfectly circular and centered logo */}
            <View style={styles.logoCircle}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logoImg}
                resizeMode="cover"
              />
            </View>
            <View style={styles.titleCol}>
              <Text style={styles.hdTitle}>Church of GOD</Text>
              <Text style={styles.hdSub}>Kristhunandu Sahodarulu Sahavasamu</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.actionIconButton} onPress={toggleTheme}>
               <View style={styles.themeIconWrap}>
                 {isDark ? <Sun size={18} color="#FCD34D" /> : <Moon size={18} color="#FCD34D" />}
               </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionIconButton} onPress={() => navigation.navigate('Updates')}>
              <Bell color="#fff" size={22} />
              <View style={styles.notifBadge} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.avatarWrapper} onPress={() => navigation.navigate('Profile')}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarLetter}>
                    {(member?.firstName || user?.displayName || 'S').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.onlineBadge} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {getGreeting()}, <Text style={styles.userNameGold}>{member?.name || user?.displayName || 'Member'}</Text> 🙏
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {getTeluguDay()}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a2d5a" />
        }
      >
        <View style={styles.contentPad}>
          {/* ── Promise Hero Card (Improved Ref Logic) ── */}
          <View style={styles.promiseHero}>
            <View style={styles.phInner}>
              <Text style={styles.phLabel}>TODAY'S PROMISE · ఈ రోజు వాగ్దానం</Text>
              <Text style={styles.phEn}>{promise ? `"${stripHtml(promise.verse)}"` : ''}</Text>
              <Text style={styles.phRefEn}>{promise ? `— ${promise.verseReferenceEn || promise.verseReference}` : ''}</Text>
              
              <View style={styles.phDivider} />

              <Text style={styles.phTe}>{promise?.verseTelugu ? `"${stripHtml(promise.verseTelugu)}"` : ''}</Text>
              <Text style={styles.phRefTe}>{promise?.verseReferenceTe ? `— ${promise.verseReferenceTe}` : ''}</Text>
              
              <View style={styles.phActions}>
                <TouchableOpacity style={styles.phShareBtn} onPress={handleSharePromise}>
                  <Share2 size={18} color="#fff" />
                  <Text style={styles.phBtnTxt}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.phWatchBtn} 
                  onPress={() => navigation.navigate('DailyVideo', { 
                    youtubeId: promise?.youtubeId,
                    videoTitle: promise?.videoTitle,
                    pastor: promise?.pastor
                  })}
                >
                  <Play size={18} color="#fff" fill="#fff" />
                  <Text style={styles.phBtnTxt}>Watch video</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── Quick Access Grid ── */}
          <Text style={styles.secLbl}>QUICK ACCESS</Text>
          <View style={styles.iconGrid}>
            <GridItem icon={<Mic size={26} color="#fff" />} label="Sermons" color="#1a2d5a" onPress={() => navigation.navigate('Sermons')} />
            <GridItem icon={<Heart size={26} color="#fff" />} label="Prayer Wall" color="#c0392b" onPress={() => navigation.navigate('Prayer')} />
            <GridItem icon={<Calendar size={26} color="#fff" />} label="Events" color="#0F766E" onPress={() => navigation.navigate('Events')} />
            <GridItem icon={<DollarSign size={26} color="#fff" />} label="Give / Tithe" color="#f0a500" onPress={() => navigation.navigate('Give')} />
            
            <GridItem icon={<BookOpen size={26} color="#fff" />} label="Bible" color="#7C3AED" onPress={() => navigation.navigate('Bible')} />
            <GridItem icon={<Bell size={26} color="#fff" />} label="Updates" color="#0369a1" onPress={() => Alert.alert('Updates', 'Announcements coming soon!')} />
            <GridItem icon={<Users size={26} color="#fff" />} label="Members" color="#BE185D" onPress={() => Alert.alert('Directory', 'Member directory coming soon!')} />
            <GridItem icon={<MoreHorizontal size={26} color="#fff" />} label="More" color="#374151" onPress={() => Alert.alert('More', 'More features coming soon!')} />
          </View>

          {/* ── Next Event Banner (Always Visible) ── */}
          {/* ── Upcoming Events Card (Sermon Style) ── */}
          <View style={styles.eventBanner}>
            <View style={styles.ebHd}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Calendar size={14} color="#FCD34D" />
                <Text style={styles.ebHdLbl}>UPCOMING EVENTS · రాబోయే కార్యక్రమాలు</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Events')}>
                <Text style={styles.ebSeeAll}>See all →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ebList}>
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((item: any, index: number) => (
                  <View key={item.id}>
                    <TouchableOpacity 
                      style={styles.ebItem} 
                      onPress={() => navigation.navigate('EventDetails', { event: item })}
                    >
                      <View style={styles.ebThumbnailContainer}>
                        <Image 
                          source={{ uri: item.image || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=400' }}
                          style={styles.ebThumbnail}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.ebInfo}>
                        <Text style={styles.ebTitle} numberOfLines={2}>
                          {item.title} || {item.titleTelugu || item.title}
                        </Text>
                        
                        <View style={styles.highlightRow}>
                          <View style={styles.dateBadge}>
                            <Calendar size={11} color="#1a2d5a" />
                            <Text style={styles.badgeTextMain}>
                              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} || {formatTeluguDate(item.date)}
                            </Text>
                          </View>
                        </View>
  
                        <View style={[styles.highlightRow, { marginTop: 4 }]}>
                          <View style={styles.timeBadge}>
                            <Play size={8} color="#c0392b" fill="#c0392b" style={{ transform: [{ rotate: '90deg' }] }} />
                            <Text style={styles.timeBadgeText}>{formatTime(item.startTime)} – {formatTime(item.endTime)}</Text>
                          </View>
                        </View>
  
                        <View style={[styles.ebMetaRow, { marginTop: 6, alignItems: 'flex-start' }]}>
                          <MapPin size={11} color="#64748b" style={{ marginTop: 2 }} />
                          <Text style={styles.ebMetaText}>{item.address || item.location || 'Church Main Hall'}</Text>
                        </View>
                        
                        <Text style={styles.ebDetailsLink}>Details →</Text>
                      </View>
                    </TouchableOpacity>
                    {index < upcomingEvents.length - 1 && <View style={styles.ebDivider} />}
                  </View>
                ))
              ) : (
                <View style={styles.emptyEvents}>
                  <Calendar size={32} color="#94a3b8" />
                  <Text style={styles.emptyEventsTxt}>No upcoming events scheduled</Text>
                  <Text style={styles.emptyEventsSub}>Check back soon for updates!</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Latest Sermon Card ── */}
          <View style={styles.sermonCard}>
            <View style={styles.scHd}>
              <View style={styles.scHdLblRow}>
                <Mic size={16} color="#fff" />
                <Text style={styles.scHdLbl}>LATEST SERMON · తాజా ప్రసంగం</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Sermons')}>
                <Text style={styles.scSee}>See all →</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.scBody} onPress={() => navigation.navigate('Sermons')}>
              <View style={styles.scThumb}>
                <View style={styles.playIconOverlay}>
                   <Play size={20} color="#fff" fill="#c0392b" />
                </View>
              </View>
              <View style={styles.scInfo}>
                <Text style={styles.scTitle} numberOfLines={1}>
                  {latestSermon?.title} {latestSermon?.titleTelugu ? `|| ${latestSermon.titleTelugu}` : ''}
                </Text>
                <Text style={styles.scMeta} numberOfLines={1}>{latestSermon?.pastor || 'Pastor Daniel Raju'} · {latestSermon?.date || 'Apr 13'} · {latestSermon?.duration || '42 min'} · 1,240 views</Text>
              </View>
              <View style={styles.playBtnCircle}>
                <Play size={18} color="#1a2d5a" />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Prayer Preview ── */}
          <View style={[styles.prayerCard, { marginBottom: 40 }]}>
            <View style={styles.pcHd}>
              <View style={styles.pcHdLblRow}>
                <Heart size={16} color="#fff" fill="rgba(255,255,255,0.3)" />
                <Text style={styles.pcHdLbl}>PRAYER WALL · ప్రార్థన</Text>
              </View>
              <Text style={styles.pcCount}>{prayerCount} requests</Text>
            </View>
            <TouchableOpacity style={styles.pcBody} onPress={() => navigation.navigate('Prayer')}>
              <View style={styles.pcTextContainer}>
                <Text style={styles.pcText} numberOfLines={3}>
                  {latestPrayer ? `"${latestPrayer.text}" — ${latestPrayer.name}` : '"Please pray for our community and the growth of our church." — Faith Member'}
                </Text>
              </View>
              <View style={styles.pcFoot}>
                <TouchableOpacity style={styles.prayedBtn} onPress={() => Alert.alert('Prayed', 'Thank you for praying!')}>
                   <CheckCircle size={14} color="#4C1D95" />
                   <Text style={styles.prayedBtnTxt}>I prayed</Text>
                </TouchableOpacity>
                <Text style={styles.pcSeeAll}>See all prayers →</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function GridItem({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.iconItem} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        {icon}
      </View>
      <Text style={styles.iconLbl} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8fafc', paddingBottom: 120 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a2d5a' },
  loadingText: { color: '#fbbf24', marginTop: 15, fontSize: 14, fontWeight: '600' },
  
  scroll: { flex: 1 },
  contentPad: { paddingBottom: 20 },
  
  // Header
  appHeader: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTopRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 15,
    justifyContent: 'space-between' 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  logoCircle: { 
    width: 46, height: 46, backgroundColor: '#fff', 
    borderRadius: 23, justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4,
    overflow: 'hidden'
  },
  logoImg: { width: 46, height: 46, borderRadius: 23 },
  titleCol: { marginLeft: 10 },
  hdTitle: { color: '#FCD34D', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  hdSub: { color: '#aac4e8', fontSize: 8.5, marginTop: 1, fontWeight: '500' },
  
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionIconButton: { padding: 4, position: 'relative' },
  themeIconWrap: { 
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  notifBadge: { 
    position: 'absolute', top: 4, right: 4, width: 8, height: 8, 
    backgroundColor: '#ef4444', borderRadius: 4, borderWidth: 1.5, borderColor: '#1a2d5a' 
  },
  avatarWrapper: { width: 38, height: 38, position: 'relative' },
  avatarImg: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: '#FCD34D' },
  avatarPlaceholder: { 
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#1e293b', 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FCD34D' 
  },
  avatarLetter: { color: '#FCD34D', fontWeight: '800', fontSize: 14 },
  onlineBadge: { 
    position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, 
    borderRadius: 5, backgroundColor: '#22c55e', borderWidth: 1.5, borderColor: '#1a2d5a' 
  },
  
  greetingSection: { marginTop: 10 },
  greetingText: { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 2 },
  userNameGold: { 
    color: '#FCD34D', 
    fontWeight: '800', 
    textShadowColor: 'rgba(0,0,0,0.3)', 
    textShadowOffset: { width: 0.5, height: 0.5 }, 
    textShadowRadius: 1 
  },
  dateText: { color: '#aac4e8', fontSize: 12, fontWeight: '500' },

  // Promise Hero
  promiseHero: {
    backgroundColor: '#1a2d5a', margin: 16, borderRadius: 20, overflow: 'hidden',
    marginTop: 20, elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10
  },
  phInner: { padding: 20 },
  phLabel: { fontSize: 11, color: '#FCD34D', fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  phEn: { color: '#fff', fontSize: 15, fontWeight: '600', fontStyle: 'italic', lineHeight: 24, marginBottom: 4 },
  phRefEn: { color: '#FCD34D', fontSize: 12, fontWeight: '700', marginBottom: 15, textAlign: 'right' },
  phDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 15 },
  phTe: { color: '#aac4e8', fontSize: 16, fontStyle: 'italic', lineHeight: 26, marginBottom: 4 },
  phRefTe: { color: '#FCD34D', fontSize: 13, fontWeight: '700', marginBottom: 20, textAlign: 'right' },
  phActions: { flexDirection: 'row', gap: 12 },
  phShareBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  phWatchBtn: { flex: 1, backgroundColor: '#c0392b', borderRadius: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  phBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Event Banner (Sermon Style)
  eventBanner: { margin: 16, marginTop: 4, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  ebHd: { backgroundColor: '#1a2d5a', paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ebHdLbl: { fontSize: 12, color: '#fff', fontWeight: '700' },
  ebSeeAll: { fontSize: 11, color: '#aac4e8', fontWeight: '600' },
  ebList: { padding: 0 },
  ebItem: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  ebDivider: { height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 15 },
  ebThumbnailContainer: { width: 85, height: 85, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  ebThumbnail: { width: '100%', height: '100%', borderRadius: 8 },
  ebInfo: { flex: 1 },
  ebTitle: { fontSize: 13.5, fontWeight: '800', color: '#1a2d5a', marginBottom: 5 },
  ebDetailsLink: { fontSize: 10, fontWeight: '800', color: '#1a2d5a', marginTop: 8 },
  highlightRow: { flexDirection: 'row', alignItems: 'center' },
  dateBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fffbeb', 
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 4
  },
  timeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    paddingHorizontal: 7, 
    paddingVertical: 3, 
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 4
  },
  badgeTextMain: { fontSize: 9.5, fontWeight: '700', color: '#1a2d5a' },
  badgeTextSub: { fontSize: 9.5, color: '#475569', fontWeight: '500' },
  timeBadgeText: { fontSize: 9, fontWeight: '700', color: '#c0392b' },
  ebMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  
  emptyEvents: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyEventsTxt: { color: '#1a2d5a', fontSize: 13, fontWeight: '700', marginTop: 12 },
  emptyEventsSub: { color: '#94a3b8', fontSize: 11, marginTop: 4 },

  secLbl: { fontSize: 13, fontWeight: '800', color: '#1a2d5a', letterSpacing: 0.5, marginHorizontal: 24, marginBottom: 18, marginTop: 15 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, justifyContent: 'space-between' },
  iconItem: { width: (width - 60) / 4, alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 62, height: 62, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  iconLbl: { fontSize: 11, color: '#475569', fontWeight: '600', textAlign: 'center' },

  // Sermon Card
  sermonCard: { margin: 16, marginTop: 4, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  scHd: { backgroundColor: '#1a2d5a', paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scHdLblRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scHdLbl: { fontSize: 12, color: '#fff', fontWeight: '700' },
  scSee: { fontSize: 11, color: '#aac4e8', fontWeight: '600' },
  scBody: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 15 },
  scThumb: { width: 80, height: 50, backgroundColor: '#0f172a', borderRadius: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  playIconOverlay: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  scInfo: { flex: 1 },
  scTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  scTitleTe: { fontSize: 12, color: '#334155', marginBottom: 4 },
  scMeta: { fontSize: 10.5, color: '#64748b' },
  playBtnCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },

  // Prayer Card
  prayerCard: { margin: 16, marginTop: 4, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  pcHd: { backgroundColor: '#7C3AED', paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pcHdLblRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pcHdLbl: { fontSize: 12, color: '#fff', fontWeight: '700' },
  pcCount: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  pcBody: { padding: 16 },
  pcTextContainer: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 15 },
  pcText: { fontSize: 13, color: '#334155', lineHeight: 22, fontStyle: 'italic' },
  pcFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prayedBtn: { backgroundColor: '#f5f3ff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#ddd6fe' },
  prayedBtnTxt: { color: '#4C1D95', fontSize: 12, fontWeight: '700' },
  pcSeeAll: { fontSize: 11.5, color: '#94a3b8', fontWeight: '600' },
});
