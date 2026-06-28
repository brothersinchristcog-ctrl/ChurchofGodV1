import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Modal
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radius, typography, shadow } from '../../../theme/Theme';
import SalesforceService from '../../../services/SalesforceService';
import AIVoiceService from '../../../services/AIVoiceService';
import { useAuth } from '../../../context/AuthContext';
import { CustomAlert, AlertButton } from '../../../components/CustomAlert';

export const CreatePastorEvent = ({ route, navigation }: { route: any; navigation: any }) => {
  const { member } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fallbackContactId, setFallbackContactId] = useState<string | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    buttons?: AlertButton[];
  }>({ visible: false, title: '', message: '', type: 'info' });

  const closeAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  const handleNext = () => {
    const newErrors: { [key: string]: string } = {};
    if (currentStep === 1) {
      if (!title.trim()) newErrors.title = 'Please enter an event title.';
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    } else if (currentStep === 2) {
      if (!venue.trim()) newErrors.venue = 'Please enter a venue name.';
      if (!address.trim()) newErrors.address = 'Please enter a full address.';
      if (!pinCode.trim()) newErrors.pinCode = 'Please enter a PIN Code.';
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }
    setErrors({});
    setCurrentStep(currentStep + 1);
  };

  // Form State
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d;
  });
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // AI Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // UI state for Pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const convertTo24Hour = (timeStr: string) => {
    try {
      let [time, modifier] = timeStr.split(' ');
      if (!modifier) modifier = 'AM';
      let [hours, minutes] = time.split(':');
      if (!minutes) minutes = '00';
      if (hours === '12') hours = '00';
      if (modifier.toUpperCase() === 'PM') hours = String(parseInt(hours, 10) + 12);
      return `${hours.padStart(2, '0')}:${minutes}`;
    } catch {
      return "12:00";
    }
  };

  const handleAIToggle = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessingAI(true);
      try {
        const uri = await AIVoiceService.stopRecording();
        if (uri) {
          const transcript = await AIVoiceService.transcribeAudio(uri);
          const details = await AIVoiceService.extractEventDetails(transcript);
          
          if (details.title) setTitle(details.title);
          if (details.eventType) setEventType(details.eventType);
          if (details.date) {
            const parsedDate = new Date(details.date);
            if (!isNaN(parsedDate.getTime())) setDate(parsedDate);
          }
          if (details.startTime) {
            const parsed = new Date(`1970-01-01T${convertTo24Hour(details.startTime)}:00`);
            if (!isNaN(parsed.getTime())) setStartTime(parsed);
          }
          if (details.endTime) {
            const parsed = new Date(`1970-01-01T${convertTo24Hour(details.endTime)}:00`);
            if (!isNaN(parsed.getTime())) setEndTime(parsed);
          }
          if (details.venue) setVenue(details.venue);
          if (details.address) setAddress(details.address);
          if (details.pinCode) setPinCode(details.pinCode);
          if (details.description) setDescription(details.description);
          if (details.notes) setNotes(details.notes);
          
          Alert.alert('AI Autofill', 'Event details populated successfully!');
        }
      } catch (err) {
        Alert.alert('AI Error', 'Failed to process voice input.');
        console.error(err);
      } finally {
        setIsProcessingAI(false);
      }
    } else {
      try {
        await AIVoiceService.startRecording();
        setIsRecording(true);
      } catch (err) {
        Alert.alert('Permission Denied', 'Microphone access is required.');
      }
    }
  };

  // Derived state
  const durationMinsNum = Math.max(0, (endTime.getTime() - startTime.getTime()) / 60000);
  const durationHoursDerived = durationMinsNum > 0 ? (durationMinsNum / 60).toFixed(1).replace(/\.0$/, '') : '0';

  const editEvent = route?.params?.editEvent;

  useEffect(() => {
    if (editEvent) {
      setTitle(editEvent.title || '');
      setEventType(editEvent.type === 'worship' ? '' : editEvent.type);
      
      if (editEvent.date) setDate(new Date(editEvent.date));
      
      if (editEvent.startTime) {
        const timeDate = new Date();
        const [time, modifier] = editEvent.startTime.split(' ');
        if (time && modifier) {
          let [hours, minutes] = time.split(':');
          let h = parseInt(hours, 10);
          if (h === 12) h = 0;
          if (modifier.toUpperCase() === 'PM') h += 12;
          timeDate.setHours(h, parseInt(minutes || '0', 10), 0, 0);
          setStartTime(timeDate);
          
          if (editEvent.durationMins) {
            setEndTime(new Date(timeDate.getTime() + editEvent.durationMins * 60000));
          } else {
            setEndTime(new Date(timeDate.getTime() + 60 * 60000));
          }
        }
      }
      
      setVenue(editEvent.venue || '');
      
      // Attempt to strip out the venue from the location string if it matches our pattern "Venue — Address"
      let addr = editEvent.address || '';
      if (editEvent.venue && addr.startsWith(`${editEvent.venue} — `)) {
        addr = addr.substring(editEvent.venue.length + 3);
      }
      setAddress(addr);
      setDescription(editEvent.description || '');
    }
  }, [editEvent]);

  useEffect(() => {
    // If not authenticated or member profile is missing, search Salesforce for an admin contact
    if (!member?.id) {
      const loadFallbackContact = async () => {
        try {
          const admins = await SalesforceService.getAdminMembers();
          if (admins && admins.length > 0) {
            setFallbackContactId(admins[0].Id);
          }
        } catch (e) {
          console.warn('Failed to load fallback admin contact', e);
        }
      };
      loadFallbackContact();
    }
  }, [member]);

  const handleSave = async () => {
    if (!title.trim()) {
      setAlertConfig({ visible: true, title: 'Validation Error', message: 'Please enter an event title.', type: 'warning' });
      return;
    }
    if (!venue.trim()) {
      setAlertConfig({ visible: true, title: 'Validation Error', message: 'Please enter a venue name.', type: 'warning' });
      return;
    }
    if (!address.trim()) {
      setAlertConfig({ visible: true, title: 'Validation Error', message: 'Please enter a full address for maps integration.', type: 'warning' });
      return;
    }
    if (!pinCode.trim()) {
      setAlertConfig({ visible: true, title: 'Validation Error', message: 'Please enter a PIN Code to ensure location accuracy.', type: 'warning' });
      return;
    }
    if (endTime <= startTime) {
      setAlertConfig({ visible: true, title: 'Validation Error', message: 'End Time must be greater than Start Time.', type: 'warning' });
      return;
    }

    const targetContactId = member?.id || fallbackContactId;
    if (!targetContactId) {
      setAlertConfig({ visible: true, title: 'Salesforce Error', message: 'Could not locate an Admin Contact record to link this event to. Please check your internet connection.', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      // Calculate start and end date times
      const startDateTime = new Date(date);
      startDateTime.setHours(startTime.getHours());
      startDateTime.setMinutes(startTime.getMinutes());
      startDateTime.setSeconds(0);
      startDateTime.setMilliseconds(0);

      const endDateTime = new Date(startDateTime.getTime() + durationMinsNum * 60 * 1000);

      // Build full address with PIN code for geocoding
      const fullAddress = pinCode
        ? `${address.trim()}, ${pinCode.trim()}`
        : address.trim();

      // Construct Salesforce Event payload — only standard fields that definitely exist
      const payload: any = {
        Subject: title,
        StartDateTime: startDateTime.toISOString(),
        EndDateTime: endDateTime.toISOString(),
        Location: `${venue.trim()} — ${fullAddress}`,
        Description: `${description.trim()}${notes.trim() ? `\n\nNotes: ${notes.trim()}` : ''}`,
      };

      // Temporarily disabled WhoId because it causes "invalid cross reference id" 
      // if the authenticated user doesn't have access to the Contact record or if the ID is wrong.
      // if (targetContactId) {
      //   payload.WhoId = targetContactId;
      // }

      const executeSave = async () => {
        try {
          if (editEvent) {
            await SalesforceService.updatePastorEvent(editEvent.id, payload);
            setAlertConfig({
              visible: true,
              title: 'Success',
              message: 'Pastor event updated successfully!',
              type: 'success',
              buttons: [{ text: 'OK', onPress: () => { closeAlert(); navigation.goBack(); } }]
            });
          } else {
            await SalesforceService.createPastorEvent(payload);
            setAlertConfig({
              visible: true,
              title: 'Success',
              message: 'Pastor event created successfully!',
              type: 'success',
              buttons: [{ text: 'OK', onPress: () => { closeAlert(); navigation.goBack(); } }]
            });
          }
        } catch (e: any) {
          const msg = e?.message || 'An unexpected error occurred.';
          console.error('❌ [CreatePastorEvent] Save failed:', msg);
          setAlertConfig({ visible: true, title: 'Save Failed', message: msg, type: 'error' });
        } finally {
          setLoading(false);
        }
      };

      // --- Schedule Conflict Detection Logic ---
      try {
        const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
        if (GOOGLE_KEY) {
          const existingEvents = await SalesforceService.getPastorEvents();
          
          // Helper to parse the 12-hour AM/PM string into a comparable Date
          const parseTime = (timeStr: string, dateObj: Date) => {
            const [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':');
            let h = parseInt(hours, 10);
            if (h === 12) h = 0;
            if (modifier === 'PM') h += 12;
            const d = new Date(dateObj);
            d.setHours(h, parseInt(minutes, 10), 0, 0);
            return d;
          };

          const targetDateStr = startDateTime.toISOString().split('T')[0];
          
          const sameDayEvents = existingEvents
            .filter((e: any) => e.date === targetDateStr && e.id !== editEvent?.id)
            .sort((a: any, b: any) => parseTime(a.startTime, startDateTime).getTime() - parseTime(b.startTime, startDateTime).getTime());

          const newEventStartMs = startDateTime.getTime();
          
          // Find the event that happens immediately BEFORE this new event
          const prevEvents = sameDayEvents.filter(e => parseTime(e.startTime, startDateTime).getTime() < newEventStartMs);
          
          if (prevEvents.length > 0) {
            const prevEvent = prevEvents[prevEvents.length - 1];

            // Get lat/lng of the NEW event
            const geoResp = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_KEY}`);
            const geoData = await geoResp.json();
            
            if (geoData.status === 'OK' && geoData.results.length > 0) {
              const newLat = geoData.results[0].geometry.location.lat;
              const newLng = geoData.results[0].geometry.location.lng;

              if (newLat && newLng && prevEvent.lat && prevEvent.lng) {
                const origins = `${prevEvent.lat},${prevEvent.lng}`;
                const destinations = `${newLat},${newLng}`;
                const distResp = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${GOOGLE_KEY}`);
                const distData = await distResp.json();

                if (distData.status === 'OK' && distData.rows[0].elements[0].status === 'OK') {
                  const travelTimeSeconds = distData.rows[0].elements[0].duration.value;
                  const travelTimeMins = Math.round(travelTimeSeconds / 60);
                  
                  const prevStartTimeMs = parseTime(prevEvent.startTime, startDateTime).getTime();
                  const prevEndTimeMs = prevStartTimeMs + (prevEvent.durationMins * 60000);
                  
                  const requiredArrivalTimeMs = prevEndTimeMs + (travelTimeMins * 60000);
                  
                  if (requiredArrivalTimeMs > newEventStartMs) {
                    setAlertConfig({
                      visible: true,
                      title: 'Schedule Conflict',
                      message: `Insufficient travel time between ${prevEvent.venue || prevEvent.title} and ${venue.trim() || 'this new location'}.\n\nEstimated travel time is ${travelTimeMins >= 60 ? `${Math.round(travelTimeMins / 60 * 10) / 10} hours` : `${travelTimeMins} minutes`}.`,
                      type: 'warning',
                      buttons: [
                        { text: 'Cancel', style: 'cancel', onPress: () => { setLoading(false); closeAlert(); } },
                        { text: 'Proceed Anyway', onPress: () => { closeAlert(); executeSave(); } }
                      ]
                    });
                    return; // Pause here!
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Conflict detection failed, proceeding with save.', err);
      }

      await executeSave();

    } catch (e: any) {
      const msg = e?.message || 'An unexpected error occurred.';
      console.error('❌ [CreatePastorEvent] Pre-save failed:', msg);
      setAlertConfig({ visible: true, title: 'Save Failed', message: msg, type: 'error' });
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressWrapper}>
      <View style={styles.progressContainer}>
        <View style={[styles.stepCircle, currentStep >= 1 ? styles.stepCircleActive : null]}>
          <Text style={[styles.stepCircleText, currentStep >= 1 ? styles.stepCircleTextActive : null]}>1</Text>
        </View>
        <View style={[styles.stepLine, currentStep >= 2 ? styles.stepLineActive : null]} />
        <View style={[styles.stepCircle, currentStep >= 2 ? styles.stepCircleActive : null]}>
          <Text style={[styles.stepCircleText, currentStep >= 2 ? styles.stepCircleTextActive : null]}>2</Text>
        </View>
        <View style={[styles.stepLine, currentStep >= 3 ? styles.stepLineActive : null]} />
        <View style={[styles.stepCircle, currentStep >= 3 ? styles.stepCircleActive : null]}>
          <Text style={[styles.stepCircleText, currentStep >= 3 ? styles.stepCircleTextActive : null]}>3</Text>
        </View>
      </View>
      <View style={styles.progressLabels}>
        <Text style={[styles.stepLabel, currentStep >= 1 ? styles.stepLabelActive : null]}>Event Info</Text>
        <Text style={[styles.stepLabel, currentStep >= 2 ? styles.stepLabelActive : null]}>Destination</Text>
        <Text style={[styles.stepLabel, currentStep >= 3 ? styles.stepLabelActive : null]}>Notes</Text>
      </View>
    </View>
  );

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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editEvent ? 'Edit Pastor Event' : 'Create Pastor Event'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {renderProgressBar()}

        {currentStep === 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Event Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={[styles.input, errors.title ? styles.inputError : null]}
                placeholderTextColor={colors.textTertiary}
                placeholder="e.g. Sunday Service & Prayer"
                value={title}
                onChangeText={setTitle}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Type</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor={colors.textTertiary}
                placeholder="e.g. Worship Service, Prayer Meeting"
                value={eventType}
                onChangeText={setEventType}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date *</Text>
              <View style={[styles.dropdown, { paddingRight: 10, paddingVertical: 0 }]}>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 14 }} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dropdownText}>
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={handleAIToggle} style={{ marginRight: 15, padding: 5 }}>
                    <Ionicons name={isRecording ? "mic" : "sparkles"} size={22} color={isRecording ? "#EF4444" : colors.primary} />
                  </TouchableOpacity>
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                </View>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Start Time *</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.dropdownText}>
                    {startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display="default"
                    is24Hour={false}
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(false);
                      if (selectedTime) setStartTime(selectedTime);
                    }}
                  />
                )}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.md }]}>
                <Text style={styles.label}>End Time *</Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setShowEndTimePicker(true)}>
                  <Text style={styles.dropdownText}>
                    {endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display="default"
                    is24Hour={false}
                    onChange={(event, selectedTime) => {
                      setShowEndTimePicker(false);
                      if (selectedTime) setEndTime(selectedTime);
                    }}
                  />
                )}
              </View>
            </View>

            <View style={[styles.inputGroup, { marginTop: spacing.md }]}>
              <Text style={styles.label}>Meeting Length (Calculated)</Text>
              <View style={[styles.input, { backgroundColor: colors.bgSecondary, justifyContent: 'center' }]}>
                <Text style={{ color: colors.textPrimary }}>
                  {durationHoursDerived} Hour{parseFloat(durationHoursDerived) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Destination</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Venue Name *</Text>
              <TextInput
                style={[styles.input, errors.venue ? styles.inputError : null]}
                placeholderTextColor={colors.textTertiary}
                placeholder="e.g. Calvary Temple, Guntur"
                value={venue}
                onChangeText={setVenue}
              />
              {errors.venue && <Text style={styles.errorText}>{errors.venue}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Address * (Used for Maps Routing)</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.address ? styles.inputError : null]}
                placeholderTextColor={colors.textTertiary}
                placeholder="e.g. Ring Road, Arundelpet, Guntur, AP, 522002"
                multiline
                numberOfLines={3}
                value={address}
                onChangeText={setAddress}
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PIN Code * (Improves map accuracy)</Text>
              <TextInput
                style={[styles.input, errors.pinCode ? styles.inputError : null]}
                placeholderTextColor={colors.textTertiary}
                placeholder="e.g. 522002"
                keyboardType="numeric"
                maxLength={10}
                value={pinCode}
                onChangeText={setPinCode}
              />
              {errors.pinCode && <Text style={styles.errorText}>{errors.pinCode}</Text>}
            </View>
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Additional Context</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholderTextColor={colors.textTertiary}
                placeholder="What is this itinerary appointment for?"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Special Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholderTextColor={colors.textTertiary}
                placeholder="Any items to bring, contacts to meet, or preparations to make?"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>
        )}

        {/* Footer Buttons */}
        {currentStep === 1 ? (
          <View style={[styles.footer, { justifyContent: 'center', width: '100%' }]}>
            <TouchableOpacity 
              style={styles.footerBtnNextSingle} 
              onPress={handleNext}
            >
              <Text style={styles.footerBtnNextTxt}>Next</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.footer, { width: '100%' }]}>
            <TouchableOpacity style={styles.footerBtnBack} onPress={() => setCurrentStep(currentStep - 1)}>
              <Text style={styles.footerBtnBackTxt}>Back</Text>
            </TouchableOpacity>
            
            {currentStep === 2 ? (
              <TouchableOpacity style={styles.footerBtnNext} onPress={handleNext}>
                <Text style={styles.footerBtnNextTxt}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.footerBtnSubmit, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.footerBtnSubmitTxt}>{editEvent ? 'Update Event' : 'Create Event'}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Processing Modal */}
        <Modal visible={isProcessingAI} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.modalTitle}>Processing with AI...</Text>
              <Text style={styles.modalDesc}>Extracting event details from your voice.</Text>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgSecondary
  },
  header: {
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
    padding: spacing.xs
  },
  headerTitle: {
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
  cardTitle: {
    ...typography.h3,
    color: colors.primaryDark,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgTertiary,
    paddingBottom: spacing.xs
  },
  inputGroup: {
    marginBottom: spacing.md
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.bgSecondary
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top'
  },
  row: {
    flexDirection: 'row'
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    backgroundColor: colors.bgSecondary
  },
  dropdownText: {
    fontSize: 14,
    color: colors.textPrimary
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginTop: spacing.xs,
    backgroundColor: colors.bgPrimary,
    ...shadow.card
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgTertiary
  },
  dropdownItemActive: {
    backgroundColor: colors.primaryLight
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.textPrimary
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: '600'
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    gap: 8,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    ...shadow.card
  },
  saveButtonDisabled: {
    backgroundColor: colors.textTertiary
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700'
  },
  progressWrapper: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  stepCircleTextActive: {
    color: '#FFF',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#F1F5F9',
    marginHorizontal: -5,
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    width: 80,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  footerBtnBack: {
    width: '48%',
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC', // Changed to light gray instead of white
    borderWidth: 1,
    borderColor: '#E2E8F0', // Light border
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnBackTxt: {
    color: '#64748B', // Muted dark text
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerBtnNext: {
    width: '48%',
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnNextSingle: {
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  footerBtnNextTxt: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerBtnSubmit: {
    width: '48%',
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerBtnSubmitTxt: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: radius.lg,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  }
});

export default CreatePastorEvent;
