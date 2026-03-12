import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryPicker from '../components/CategoryPicker';
import CardStack from '../components/CardStack';
import { CATEGORIES } from '../lib/constants';
import { colors, space } from '../theme/tokens';
import client from '../api/client';

export default function BrowseScreen() {
  const [activeCategory, setActiveCategory] = useState('foreplay');
  const [catalog, setCatalog] = useState([]);
  const [responses, setResponses] = useState({});
  const [matchItem, setMatchItem] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>kinklink</Text>
      </View>
      <CategoryPicker active={activeCategory} onChange={setActiveCategory} progress={progress} />
      <View style={styles.stackArea}>
        <CardStack
          items={categoryItems}
          onRespond={handleRespond}
          matchItem={matchItem}
          onUndo={lastResponse ? handleUndo : null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: space[5],
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: 20,
    fontWeight: '500',
    color: colors.accent,
    letterSpacing: -0.5,
  },
  stackArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: space[4] },
});
