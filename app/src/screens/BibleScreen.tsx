import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search, BookOpen, Globe } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const BIBLE_DATA = {
  English: {
    OT: [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', 
      '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 
      'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 
      'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 
      'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 
      'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 
      'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
    ],
    NT: [
      'Matthew', 'Mark', 'Luke', 'John', 'Acts', 
      'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 
      'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', 
      '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', 
      '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 
      'Jude', 'Revelation'
    ]
  },
  Telugu: {
    OT: [
      'ఆదికాండము', 'నిర్గమకాండము', 'లేవీయకాండము', 'సంఖ్యాకాండము', 'ద్వితీయోపదేశకాండము',
      'యెహోషువ', 'న్యాయాధిపతులు', 'రూతు', '1 సమూయేలు', '2 సమూయేలు',
      '1 రాజులు', '2 రాజులు', '1 దినవృత్తాంతములు', '2 దినవృత్తాంతములు', 'ఎజ్రా',
      'నెహెమ్యా', 'ఎస్తేరు', 'యోబు', 'కీర్తనల గ్రంథము', 'సామెతలు',
      'ప్రసంగి', 'పరమగీతము', 'యెషయా', 'యిర్మియా', 'విలాపవాక్యములు',
      'యెహెజ్కేలు', 'దానియేలు', 'హోషేయ', 'యోవేలు', 'ఆమోసు',
      'ఓబద్యా', 'యోనా', 'మీకా', 'నహూము', 'హబక్కూకు',
      'జెఫన్యా', 'హగ్గయి', 'జెకర్యా', 'మలాకీ'
    ],
    NT: [
      'మత్తయి సువార్త', 'మార్కు సువార్త', 'లూకా సువార్త', 'యోహాను సువార్త', 'అపొస్తలుల కార్యములు',
      'రోమీయులకు వ్రాసిన పత్రిక', '1 కొరింథీయులకు', '2 కొరింథీయులకు', 'గలతీయులకు', 'ఎఫెసీయులకు',
      'ఫిలిప్పీయులకు', 'కొలొస్సయులకు', '1 థెస్సలొనీకయులకు', '2 థెస్సలొనీకయులకు', '1 తిమోతికి',
      '2 తిమోతికి', 'తీతుకు', 'ఫిలేమోనుకు', 'హెబ్రీయులకు', 'యాకోబు',
      '1 పేతురు', '2 పేతురు', '1 యోహాను', '2 యోహాను', '3 యోహాను',
      'యూదా', 'ప్రకటన గ్రంథము'
    ]
  }
};

export default function BibleScreen({ navigation }: any) {
  const { isDark } = useTheme();
  const [lang, setLang] = useState<'English' | 'Telugu'>('Telugu');
  const [testament, setTestament] = useState<'OT' | 'NT'>('NT');

  const books = lang === 'English' ? BIBLE_DATA.English[testament] : BIBLE_DATA.Telugu[testament];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Holy Bible · పరిశుద్ధ గ్రంథం
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Language Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleBtn, lang === 'English' && styles.toggleBtnActive]}
          onPress={() => setLang('English')}
        >
          <Globe size={16} color={lang === 'English' ? '#fff' : '#64748b'} />
          <Text style={[styles.toggleText, lang === 'English' && styles.toggleTextActive]}>English</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleBtn, lang === 'Telugu' && styles.toggleBtnActive]}
          onPress={() => setLang('Telugu')}
        >
          <Globe size={16} color={lang === 'Telugu' ? '#fff' : '#64748b'} />
          <Text style={[styles.toggleText, lang === 'Telugu' && styles.toggleTextActive]}>తెలుగు</Text>
        </TouchableOpacity>
      </View>

      {/* Testament Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, testament === 'OT' && styles.tabActive]}
          onPress={() => setTestament('OT')}
        >
          <Text style={[styles.tabText, testament === 'OT' && styles.tabTextActive]}>
            {lang === 'English' ? 'Old Testament' : 'పాత నిబంధన'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, testament === 'NT' && styles.tabActive]}
          onPress={() => setTestament('NT')}
        >
          <Text style={[styles.tabText, testament === 'NT' && styles.tabTextActive]}>
            {lang === 'English' ? 'New Testament' : 'క్రొత్త నిబంధన'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {books.map((book, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.bookCard, { backgroundColor: isDark ? '#1e293b' : '#fff' }]}
              onPress={() => navigation.navigate('BibleChapters', { 
                bookName: book,
                lang: lang,
                testament: testament
              })}
            >
              <View style={styles.bookIcon}>
                <BookOpen size={20} color="#1a2d5a" />
              </View>
              <Text style={[styles.bookName, { color: isDark ? '#fff' : '#1e293b' }]} numberOfLines={1}>
                {book}
              </Text>
              <Text style={styles.bookSub}>
                {lang === 'English' ? 'Read now' : 'చదవండి'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#1a2d5a',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 25,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 21,
    gap: 6
  },
  toggleBtnActive: { backgroundColor: '#1a2d5a' },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  toggleTextActive: { color: '#fff' },

  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 12
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9'
  },
  tabActive: { backgroundColor: '#c0392b' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#fff' },

  scroll: { flex: 1, paddingHorizontal: 15 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12
  },
  bookCard: {
    width: (width - 42) / 2,
    padding: 16,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    alignItems: 'center'
  },
  bookIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  bookName: { fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  bookSub: { fontSize: 10, color: '#94a3b8', fontWeight: '600' }
});
