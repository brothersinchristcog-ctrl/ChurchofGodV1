import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, spacing, radius, typography, shadow } from '../../../theme/Theme';
import SalesforceService from '../../../services/SalesforceService';
import { CustomAlert, AlertButton } from '../../../components/CustomAlert';
import { PastorEvent } from '../../../types/event';
import { openInMaps } from '../../../utils/maps';
import EventTypeBadge from '../../../components/EventTypeBadge';
import DistanceBadge from '../../../components/DistanceBadge';
import { getStartingLocation } from '../../../utils/locationStore';

export const PastorEventDetail = ({ route, navigation }: { route: any; navigation: any }) => {
  const { event, allEvents = [] } = route.params as { event: PastorEvent; allEvents: PastorEvent[] };
  const [deleting, setDeleting] = React.useState(false);

  const getShortVenueName = (venue?: string) => {
    if (!venue) return 'DEST';
    const parts = venue.split(',');
    const name = parts.length > 1 ? parts[1].trim() : parts[0].trim();
    return name.substring(0, 10).toUpperCase();
  };

  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    buttons?: AlertButton[];
  }>({ visible: false, title: '', message: '', type: 'info' });

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // Format date nicely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const d = date.getDate().toString().padStart(2, '0');
      const m = date.toLocaleString('default', { month: 'short' });
      const y = date.getFullYear();
      return `${d} ${m}, ${y}`;
    } catch {
      return dateStr;
    }
  };

  // Helper to convert time strings like "9:00 AM" to sortable minutes
  const timeToMins = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(' ');
    if (parts.length < 2) return 0;
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(':');
    let h = parseInt(hours, 10);
    let m = parseInt(minutes || '0', 10);
    if (h === 12) h = 0;
    if (modifier.toUpperCase() === 'PM') h += 12;
    return h * 60 + m;
  };

  // Find next event for route planner link
  const sameDayEvents = allEvents
    .filter(e => e.date === event.date)
    .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
  
  const eventIndex = sameDayEvents.findIndex(e => e.id === event.id);
  const nextEvent = sameDayEvents[eventIndex + 1];

  // Global Next Event for Distance calculations
  const globalEventIndex = allEvents.findIndex(e => e.id === event.id);
  const globalNextEvent = globalEventIndex >= 0 && globalEventIndex < allEvents.length - 1 ? allEvents[globalEventIndex + 1] : undefined;

  const [nextEventTravel, setNextEventTravel] = React.useState<{
    loading: boolean;
    currentToNextKm: number;
    currentToNextMins: number;
    homeToNextKm: number;
    homeToNextMins: number;
  }>({ loading: false, currentToNextKm: 0, currentToNextMins: 0, homeToNextKm: 0, homeToNextMins: 0 });

  React.useEffect(() => {
    if (!globalNextEvent || !globalNextEvent.lat || !globalNextEvent.lng) return;

    const calculateTravel = async () => {
      setNextEventTravel(prev => ({ ...prev, loading: true }));
      try {
        const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
        if (!GOOGLE_KEY) {
          setNextEventTravel(prev => ({ ...prev, loading: false }));
          return;
        }

        const destLat = globalNextEvent.lat;
        const destLng = globalNextEvent.lng;

        // 1. Current Event -> Next Event
        let curToNextKm = 0;
        let curToNextMins = 0;
        if (event.lat && event.lng) {
          const res1 = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${event.lat},${event.lng}&destinations=${destLat},${destLng}&key=${GOOGLE_KEY}`);
          const data1 = await res1.json();
          if (data1.status === 'OK' && data1.rows[0].elements[0].status === 'OK') {
            const element = data1.rows[0].elements[0];
            curToNextKm = element.distance.value / 1000;
            curToNextMins = Math.round(element.duration.value / 60);
          }
        }

        // 2. Home -> Next Event
        let homeToNextKm = 0;
        let homeToNextMins = 0;
        const home = await getStartingLocation();
        if (home && home.lat && home.lng) {
          const res2 = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${home.lat},${home.lng}&destinations=${destLat},${destLng}&key=${GOOGLE_KEY}`);
          const data2 = await res2.json();
          if (data2.status === 'OK' && data2.rows[0].elements[0].status === 'OK') {
            const element = data2.rows[0].elements[0];
            homeToNextKm = element.distance.value / 1000;
            homeToNextMins = Math.round(element.duration.value / 60);
          }
        }

        setNextEventTravel({
          loading: false,
          currentToNextKm: curToNextKm,
          currentToNextMins: curToNextMins,
          homeToNextKm: homeToNextKm,
          homeToNextMins: homeToNextMins
        });
      } catch (e) {
        console.warn('Failed to calculate travel for next event:', e);
        setNextEventTravel(prev => ({ ...prev, loading: false }));
      }
    };

    calculateTravel();
  }, [globalNextEvent]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDirections = () => {
    openInMaps(event.lat || 0, event.lng || 0, event.title, event.address || event.venue);
  };

  const handleEdit = () => {
    navigation.navigate('CreateEvent', { editEvent: event });
  };

  const handleDelete = () => {
    setAlertConfig({
      visible: true,
      title: 'Delete Event',
      message: 'Are you sure you want to permanently delete this event?',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: closeAlert },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            closeAlert();
            try {
              setDeleting(true);
              await SalesforceService.deletePastorEvent(event.id);
              
              // Slight delay so the previous modal can unmount fully before showing success
              setTimeout(() => {
                setAlertConfig({
                  visible: true,
                  title: 'Deleted',
                  message: 'Event has been deleted.',
                  type: 'success',
                  buttons: [{ text: 'OK', onPress: () => { closeAlert(); navigation.navigate('AdminRoot'); } }]
                });
              }, 300);
            } catch (err: any) {
              setDeleting(false);
              setTimeout(() => {
                setAlertConfig({
                  visible: true,
                  title: 'Delete Failed',
                  message: err?.message || 'Could not delete event.',
                  type: 'error',
                  buttons: [{ text: 'OK', onPress: closeAlert }]
                });
              }, 300);
            }
          }
        }
      ]
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgPrimary} />
      
      <CustomAlert 
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={closeAlert}
      />
      
      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>Event Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Event Card */}
        <View style={styles.card}>
          <Text style={[styles.mainTitle, { marginBottom: 12 }]}>{event.title}</Text>

          <View style={{ gap: 8, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={[styles.timeVal, { marginLeft: 8 }]}>{formatDate(event.date)}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[styles.timeVal, { marginLeft: 8 }]}>
                Start: {event.startTime}{event.endTime ? ` | End: ${event.endTime}` : ''}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="hourglass-outline" size={16} color={colors.primary} />
              <Text style={[styles.timeVal, { marginLeft: 8, color: colors.textSecondary }]}>
                Meeting length: {event.durationMins >= 60 ? `${Math.round(event.durationMins / 60 * 10) / 10} hours` : `${event.durationMins} mins`}
              </Text>
            </View>
          </View>

          <Text style={styles.cardLabel}>VENUE & LOCATION</Text>
          <Text style={styles.venueTitle}>{event.venue || 'No Venue'}</Text>
          <Text style={styles.addressText}>{event.address || event.venue || 'No location provided'}</Text>

          <TouchableOpacity style={[styles.mapsButtonOutline, { marginBottom: 16 }]} onPress={handleDirections}>
            <Ionicons name="navigate-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.mapsButtonOutlineText}>Get Directions</Text>
          </TouchableOpacity>

          {event.travel && event.travel.distKm > 0 && (
            <>
              <View style={styles.distanceMiniCard}>
                <View style={styles.distanceMiniCardEndpoint}>
                  <Ionicons name={event.travel.isFirstEvent ? "home" : "location"} size={20} color={colors.primary} />
                  <Text style={styles.distanceMiniCardEndpointText} numberOfLines={1}>
                    {event.travel.prevVenueName || (event.travel.isFirstEvent ? "HOME" : "PREV")}
                  </Text>
                </View>
                
                <View style={styles.distanceMiniCardCenter}>
                  <View style={styles.distanceMiniCardPill}>
                    <Text style={styles.distanceMiniCardPillText}>
                      {event.travel.distKm.toFixed(1)} km • {event.travel.car >= 60 ? `${Math.floor(event.travel.car/60)}h ${event.travel.car%60}m` : `${event.travel.car}m`}
                    </Text>
                  </View>
                  <View style={styles.distanceMiniCardLineRow}>
                    <View style={styles.distanceMiniCardLine} />
                    <Ionicons name="car" size={16} color={colors.primary} style={{marginHorizontal: 8}} />
                    <View style={styles.distanceMiniCardLine} />
                  </View>
                </View>

                <View style={styles.distanceMiniCardEndpoint}>
                  <Ionicons name="location" size={20} color={colors.primary} />
                  <Text style={styles.distanceMiniCardEndpointText} numberOfLines={1}>
                    {getShortVenueName(event.venue)}
                  </Text>
                </View>
              </View>

              {!event.travel.isFirstEvent && event.travel.homeDistKm !== undefined && event.travel.homeDistKm > 0 && (
                <View style={[styles.distanceMiniCard, { marginTop: 8, borderColor: `${colors.primary}30`, backgroundColor: `${colors.primary}05` }]}>
                  <View style={styles.distanceMiniCardEndpoint}>
                    <Ionicons name="home" size={20} color={colors.primary} />
                    <Text style={styles.distanceMiniCardEndpointText} numberOfLines={1}>HOME</Text>
                  </View>
                  
                  <View style={styles.distanceMiniCardCenter}>
                    <View style={styles.distanceMiniCardPill}>
                      <Text style={styles.distanceMiniCardPillText}>
                        {event.travel.homeDistKm.toFixed(1)} km • {event.travel.homeCar && event.travel.homeCar >= 60 ? `${Math.floor(event.travel.homeCar/60)}h ${event.travel.homeCar%60}m` : `${event.travel.homeCar}m`}
                      </Text>
                    </View>
                    <View style={styles.distanceMiniCardLineRow}>
                      <View style={styles.distanceMiniCardLine} />
                      <Ionicons name="car" size={16} color={colors.primary} style={{marginHorizontal: 8}} />
                      <View style={styles.distanceMiniCardLine} />
                    </View>
                  </View>

                  <View style={styles.distanceMiniCardEndpoint}>
                    <Ionicons name="location" size={20} color={colors.primary} />
                    <Text style={styles.distanceMiniCardEndpointText} numberOfLines={1}>
                      {getShortVenueName(event.venue)}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Description Card */}
        {event.description && event.description.replace(/--- Travel Estimation ---[\s\S]*/, '').trim() ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Description</Text>
            <Text style={styles.bodyText}>
              {event.description.replace(/--- Travel Estimation ---[\s\S]*/, '').trim()}
            </Text>
          </View>
        ) : null}

        {/* Notes Card */}
        {event.notes ? (
          <View style={[styles.card, styles.notesCard]}>
            <Text style={[styles.cardLabel, { color: colors.warning }]}>Special Notes</Text>
            <Text style={styles.bodyText}>{event.notes}</Text>
          </View>
        ) : null}

        {/* Contact Details Card */}
        {event.contactName ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Contact Person</Text>
            <View style={styles.contactRow}>
              <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{event.contactName}</Text>
                {event.contactPhone && <Text style={styles.contactPhone}>{event.contactPhone}</Text>}
              </View>
              {event.contactPhone && (
                <TouchableOpacity style={styles.callButton} onPress={() => handleCall(event.contactPhone!)}>
                  <Ionicons name="call" size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}


        {/* Next Chronological Event Distance Planning Card */}
        {globalNextEvent && (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.push('EventDetail', { event: globalNextEvent, allEvents })}
            activeOpacity={0.7}
          >
            <Text style={styles.cardLabel}>Next Scheduled Event</Text>
            
            <View style={{ marginBottom: spacing.md }}>
              <Text style={styles.venueTitle}>{globalNextEvent.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.timeVal, { marginLeft: 6, fontSize: 13, color: colors.textSecondary }]}>
                  {formatDate(globalNextEvent.date)} • {globalNextEvent.startTime}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.timeVal, { marginLeft: 6, fontSize: 13, color: colors.textSecondary }]}>
                  {globalNextEvent.venue || globalNextEvent.address || 'Location TBD'}
                </Text>
              </View>
            </View>

            {nextEventTravel.loading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : nextEventTravel.currentToNextKm > 0 ? (
              <View style={styles.distanceMiniCard}>
                <View style={styles.distanceMiniCardEndpoint}>
                  <Ionicons name="location" size={20} color={colors.primary} />
                  <Text style={styles.distanceMiniCardEndpointText} numberOfLines={1}>
                    {getShortVenueName(event.venue)}
                  </Text>
                </View>
                
                <View style={styles.distanceMiniCardCenter}>
                  <View style={styles.distanceMiniCardPill}>
                    <Text style={styles.distanceMiniCardPillText}>
                      {nextEventTravel.currentToNextKm.toFixed(1)} km • {nextEventTravel.currentToNextMins >= 60 ? `${Math.floor(nextEventTravel.currentToNextMins/60)}h ${nextEventTravel.currentToNextMins%60}m` : `${nextEventTravel.currentToNextMins}m`}
                    </Text>
                  </View>
                  <View style={styles.distanceMiniCardLineRow}>
                    <View style={styles.distanceMiniCardLine} />
                    <Ionicons name="car" size={16} color={colors.primary} style={{marginHorizontal: 8}} />
                    <View style={styles.distanceMiniCardLine} />
                  </View>
                </View>

                <View style={styles.distanceMiniCardEndpoint}>
                  <Ionicons name="location" size={20} color={colors.primary} />
                  <Text style={styles.distanceMiniCardEndpointText} numberOfLines={1}>
                    {getShortVenueName(globalNextEvent.venue)}
                  </Text>
                </View>
              </View>
            ) : null}
          </TouchableOpacity>
        )}

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, justifyContent: 'center' }}>
          <TouchableOpacity 
            style={styles.editBadge}
            onPress={handleEdit}
            disabled={deleting}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
            <Text style={styles.editBadgeText}>Edit Event</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.deleteBadge}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color={colors.error} size="small" />
            ) : (
              <>
                <Ionicons name="trash" size={16} color={colors.error} />
                <Text style={styles.deleteBadgeText}>Delete Event</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSecondary
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: 56,
    backgroundColor: colors.bgPrimary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  navTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center'
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md
  },
  card: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary
  },
  mainTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  timeVal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  },
  travelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryMid
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
    textTransform: 'uppercase'
  },
  travelText: {
    fontSize: 12,
    color: colors.primaryDark,
    marginTop: 2
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs
  },
  venueTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 2
  },
  addressText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 10,
    gap: 6
  },
  mapsButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600'
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary
  },
  notesCard: {
    borderColor: colors.primaryMid,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  contactDetails: {
    flex: 1
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  },
  contactPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  nextEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary
  },
  nextEventTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm
  },
  plannerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  plannerLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary
  },
  editBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}1A`, // 10% opacity primary
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editBadgeText: {
    marginLeft: 6,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  deleteBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.error}1A`, // 10% opacity error
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteBadgeText: {
    marginLeft: 6,
    color: colors.error,
    fontWeight: '700',
    fontSize: 14,
  },
  mapsButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  mapsButtonOutlineText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6
  },
  distanceMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.md,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  distanceMiniCardEndpoint: {
    alignItems: 'center',
    width: 60
  },
  distanceMiniCardEndpointText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  distanceMiniCardCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12
  },
  distanceMiniCardPill: {
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  distanceMiniCardPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark
  },
  distanceMiniCardLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 8
  },
  distanceMiniCardLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border
  }
});

export default PastorEventDetail;
