import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Platform,
  Share,
  Alert,
  Linking,
  ActivityIndicator
} from 'react-native';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  Share2, 
  Info,
  Play,
  Video
} from 'lucide-react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { findEventVideo } from '../services/YouTubeService';

const { width, height } = Dimensions.get('window');

export default function EventDetailsScreen({ route, navigation }: any) {
  const { event } = route.params;

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    try {
      const timePart = timeStr.includes('T') ? timeStr.split('T')[1].split('.')[0] : timeStr;
      const [hours, minutes] = timePart.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH}:${minutes} ${ampm}`;
    } catch { return timeStr; }
  };

  const formatTeluguDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const monthsTe = ['జనవరి', 'ఫిబ్రవరి', 'మార్చి', 'ఏప్రిల్', 'మే', 'జూన్', 'జూలై', 'ఆగస్టు', 'సెప్టెంబర్', 'అక్టోబర్', 'నవంబర్', 'డిసెంబర్'];
      return `${monthsTe[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } catch (e) { return dateStr; }
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Join us for ${event.title} at ${event.address || event.location} on ${new Date(event.date).toDateString()}!`,
      });
    } catch (error) { console.log(error); }
  };

  const handleRSVP = () => {
    Alert.alert("Success · విజయం", "Thank you for your interest! We'll keep you updated.\nమీ ఆసక్తికి ధన్యవాదాలు! మేము మిమ్మల్ని అప్‌డేట్ చేస్తాము.");
  };

  const extractYoutubeIdFromText = (text: string) => {
    if (!text) return null;
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = text.match(regExp);
    return match ? match[1] : null;
  };

  const isPast = new Date(event.date) < new Date();
  const manualYoutubeId = event.youtubeId || extractYoutubeIdFromText(event.description || event.descEn);

  const [autoYoutubeId, setAutoYoutubeId] = useState<string | null>(null);
  const [videoSearching, setVideoSearching] = useState(false);

  useEffect(() => {
    // Only search YouTube if it's a past event and no manual ID was provided
    if (isPast && !manualYoutubeId) {
      setVideoSearching(true);
      findEventVideo(event.date, event.title || event.name || '')
        .then(id => {
          setAutoYoutubeId(id);
        })
        .finally(() => setVideoSearching(false));
    }
  }, [event.id]);

  const youtubeId = manualYoutubeId || autoYoutubeId;
  console.log('🎬 EventDetailsScreen -> isPast:', isPast, '| final youtubeId:', youtubeId);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* --- Hero Image Section --- */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: event.image || event.bannerUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          
          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.circleBtn}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.circleBtn}
              onPress={onShare}
            >
              <Share2 size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Content Card --- */}
        <View style={styles.contentCard}>
          <View style={styles.indicator} />
          
          {/* Title Area */}
          <View style={styles.titleSection}>
            <Text style={styles.titleEn}>{event.title}</Text>
            <Text style={styles.titleTe}>{event.titleTelugu || event.title}</Text>
          </View>

          {/* Premium Info Badges (Sync with Home) */}
          <View style={styles.badgeRow}>
            <View style={styles.dateBadge}>
              <Calendar size={16} color="#1a2d5a" />
              <View>
                <Text style={styles.badgeValue}>
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                <Text style={styles.badgeSubValue}>{formatTeluguDate(event.date)}</Text>
              </View>
            </View>

            <View style={styles.timeBadge}>
              <Play size={14} color="#c0392b" fill="#c0392b" style={{ transform: [{ rotate: '90deg' }] }} />
              <View>
                <Text style={styles.timeValue}>{formatTime(event.startTime)} – {formatTime(event.endTime)}</Text>
                <Text style={styles.badgeSubValue}>Event Duration</Text>
              </View>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <MapPin size={18} color="#1a2d5a" />
              </View>
              <Text style={styles.sectionTitle}>LOCATION · స్థలం</Text>
            </View>
            <View style={styles.locCard}>
              <Text style={styles.locName}>{event.address || event.location || 'Church Main Hall'}</Text>
              {event.location && event.address && <Text style={styles.locSub}>{event.location}</Text>}
              <TouchableOpacity style={styles.mapBtn}>
                <Text style={styles.mapBtnText}>View on Maps →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#f5f3ff' }]}>
                <Info size={18} color="#7C3AED" />
              </View>
              <Text style={styles.sectionTitle}>ABOUT EVENT · కార్యక్రమం గురించి</Text>
            </View>
            <View style={styles.descCard}>
              <Text style={styles.description}>
                {event.description || event.descEn || "Join us for a powerful time of prayer and fellowship. We invite all members to gather as we seek God's presence together.\n\n'For where two or three gather in my name, there am I with them.' - Matthew 18:20"}
              </Text>
            </View>
          </View>

          {/* Past Event Recording Section */}
          {isPast && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
                  <Video size={18} color="#dc2626" />
                </View>
                <Text style={styles.sectionTitle}>EVENT RECORDING · కార్యక్రమం వీడియో</Text>
              </View>

              {videoSearching ? (
                // State 1: Searching YouTube — show a loading spinner
                <View style={styles.videoSearching}>
                  <ActivityIndicator size="large" color="#dc2626" />
                  <Text style={styles.videoSearchingText}>Finding event recording...</Text>
                  <Text style={styles.videoSearchingSubText}>వీడియో శోధిస్తున్నాం...</Text>
                </View>
              ) : youtubeId ? (
                // State 2: Found the video — embed the player
                <View style={styles.videoContainer}>
                  <YoutubePlayer
                    key={youtubeId}
                    height={width * 0.55}
                    play={false}
                    videoId={youtubeId}
                  />
                </View>
              ) : (
                // State 3: Not found — show the generic channel button
                <TouchableOpacity
                  style={styles.youtubeChannelBtn}
                  onPress={() => Linking.openURL('https://www.youtube.com/@Brothersinchristfellowship/streams')}
                >
                  <Play size={20} color="#fff" fill="#fff" />
                  <View>
                    <Text style={styles.youtubeChannelBtnText}>Watch on YouTube Channel</Text>
                    <Text style={styles.youtubeChannelBtnSub}>@Brothersinchristfellowship</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* --- Premium Floating Bottom Action --- */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.mainBtn} onPress={handleRSVP}>
          <Text style={styles.mainBtnText}>I AM INTERESTED · నేను ఆసక్తిగా ఉన్నాను</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a2d5a' },
  heroContainer: { width: '100%', height: height * 0.28, backgroundColor: '#fff' },
  heroImage: { width: '100%', height: '100%' },
  headerActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    minHeight: height * 0.6,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  indicator: {
    width: 40,
    height: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 25
  },
  titleSection: { marginBottom: 28 },
  titleEn: { fontSize: 26, fontWeight: '900', color: '#1a2d5a', marginBottom: 6, letterSpacing: -0.5 },
  titleTe: { fontSize: 18, color: '#64748b', fontWeight: '600' },
  
  badgeRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  dateBadge: { 
    flex: 1.2,
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fffbeb', 
    padding: 12, 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 12
  },
  timeBadge: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8fafc', 
    padding: 12, 
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12
  },
  badgeValue: { fontSize: 14, fontWeight: '800', color: '#1a2d5a' },
  badgeSubValue: { fontSize: 10, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  timeValue: { fontSize: 13, fontWeight: '800', color: '#c0392b' },
  
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  iconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f0f9ff', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#1a2d5a', letterSpacing: 1.5 },
  
  locCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#f1f5f9' },
  locName: { fontSize: 16, fontWeight: '700', color: '#1e293b', lineHeight: 22, marginBottom: 6 },
  locSub: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  mapBtn: { alignSelf: 'flex-start' },
  mapBtnText: { fontSize: 12, color: '#1a2d5a', fontWeight: '800' },

  descCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#f1f5f9' },
  description: { fontSize: 15, color: '#475569', lineHeight: 26, fontWeight: '400' },
  
  videoContainer: {
    backgroundColor: '#000',
    elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10
  },
  youtubeChannelBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 14,
    elevation: 3,
    shadowColor: '#dc2626', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
  },
  youtubeChannelBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },
  youtubeChannelBtnSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2
  },
  videoSearching: {
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#fee2e2'
  },
  videoSearchingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 6
  },
  videoSearchingSubText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500'
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 45 : 25,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    elevation: 25,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15
  },
  mainBtn: {
    backgroundColor: '#1a2d5a',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#1a2d5a', shadowOpacity: 0.4, shadowRadius: 10
  },
  mainBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }
});
