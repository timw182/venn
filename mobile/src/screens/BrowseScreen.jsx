import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryPicker from '../components/CategoryPicker';
import CardStack from '../components/CardStack';
import { CATEGORIES } from '../lib/constants';
import { colors, fonts, space } from '../theme/tokens';
import client from '../api/client';
import SlideView from '../components/SlideView';

export default function BrowseScreen() {
  const [activeCategory, setActiveCategory] = useState('foreplay');
  const [catalog, setCatalog] = useState([]);
  const [responses, setResponses] = useState({});
  const [matchItem, setMatchItem] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [stackHeight, setStackHeight] = useState(0);

  useEffect(() => {
    Promise.all([client.get('/catalog'), client.get('/catalog/responses')])
      .then(([items, resps]) => {
        setCatalog(items);
        setResponses(resps);
      })
      .catch(() => {});
  }, []);

  const categoryItems = useMemo(() => {
    return catalog.filter((item) => item.category === activeCategory && !responses[String(item.id)]);
  }, [catalog, activeCategory, responses]);

  const progress = useMemo(() => {
    const prog = {};
    for (const cat of CATEGORIES) {
      const total = catalog.filter((i) => i.category === cat.key).length;
      const done = catalog.filter((i) => i.category === cat.key && responses[String(i.id)]).length;
      prog[cat.key] = { total, done };
    }
    return prog;
  }, [catalog, responses]);

  const handleUndo = useCallback(() => {
    if (!lastResponse) return;
    const { item } = lastResponse;
    setLastResponse(null);
    setResponses((prev) => {
      const next = { ...prev };
      delete next[String(item.id)];
      return next;
    });
  }, [lastResponse]);

  const handleRespond = useCallback((itemId, response) => {
    const item = catalog.find((i) => i.id === itemId);
    if (item) setLastResponse({ item, response });
    setResponses((prev) => ({ ...prev, [String(itemId)]: response }));
    client.post('/catalog/respond', { item_id: itemId, response }).catch(() => {});

    if (response === 'yes') {
      client.get('/matches').then((matches) => {
        const fresh = matches.find((m) => String(m.id) === String(itemId) && !m.seen);
        if (fresh && item) {
          setTimeout(() => {
            setMatchItem(item);
            setTimeout(() => setMatchItem(null), 2500);
          }, 300);
        }
      }).catch(() => {});
    }
  }, [catalog]);

  return (
    <SlideView>
      <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse</Text>
        <Text style={styles.headerSub}>Over 200 kinks in 6 categories</Text>
      </View>
      <CategoryPicker active={activeCategory} onChange={setActiveCategory} progress={progress} />
      <View style={styles.stackArea} onLayout={(e) => setStackHeight(e.nativeEvent.layout.height)}>
        <CardStack
          items={categoryItems}
          onRespond={handleRespond}
          matchItem={matchItem}
          onUndo={lastResponse ? handleUndo : null}
          availableHeight={stackHeight}
        />
      </View>
    </SafeAreaView>
    </SlideView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: space[5],
    paddingTop: space[4],
    paddingBottom: space[2],
  },
  headerTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 24,
    color: colors.text,
  },
  headerSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  stackArea: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: space[4], paddingBottom: space[4] },
});