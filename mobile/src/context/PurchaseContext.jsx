import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';
import client from '../api/client';

const REVENUECAT_API_KEY = Constants.expoConfig?.extra?.revenueCatApiKey || '';
const PRODUCT_ID = 'lu.venn.pairingcode';
const IS_EXPO_GO = Constants.appOwnership === 'expo';

const PurchaseContext = createContext(null);

export function PurchaseProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    async function init() {
      if (IS_EXPO_GO) {
        // RevenueCat native store unavailable in Expo Go — skip purchase gate
        if (mountedRef.current) { setIsPurchased(true); setIsReady(true); }
        return;
      }
      try {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        const info = await Purchases.getCustomerInfo();
        const active = info.entitlements.active;
        if (mountedRef.current && active && Object.keys(active).length > 0) {
          setIsPurchased(true);
        }
      } catch (e) {
        if (__DEV__) console.warn('RevenueCat init error:', e);
      } finally {
        if (mountedRef.current) setIsReady(true);
      }
    }
    init();
    return () => { mountedRef.current = false; };
  }, []);

  const purchasePairingCode = useCallback(async () => {
    try {
      // Try offerings first
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        const allPackages = offerings.current.availablePackages || [];
        const pkg = allPackages.find(
          (p) => p.product.identifier === PRODUCT_ID
        );
        if (pkg) {
          const { customerInfo } = await Purchases.purchasePackage(pkg);
          await client.post('/pairing/verify-purchase', { rc_user_id: customerInfo.originalAppUserId }).catch(() => {});
          setIsPurchased(true);
          return customerInfo;
        }
      }

      // Fallback: fetch product directly and purchase
      const products = await Purchases.getProducts([PRODUCT_ID]);
      if (products.length === 0) {
        throw new Error('Product not available. Please try again later.');
      }
      const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
      await client.post('/pairing/verify-purchase', { rc_user_id: customerInfo.originalAppUserId }).catch(() => {});
      setIsPurchased(true);
      return customerInfo;
    } catch (e) {
      if (e.userCancelled) return null;
      throw e;
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      const active = info.entitlements.active;
      if (active && Object.keys(active).length > 0) {
        setIsPurchased(true);
        return true;
      }
      return false;
    } catch (e) {
      if (__DEV__) console.warn('Restore error:', e);
      return false;
    }
  }, []);

  const identifyUser = useCallback(async (userId) => {
    try {
      await Purchases.logIn(String(userId));
    } catch (e) {
      if (__DEV__) console.warn('RevenueCat identify error:', e);
    }
  }, []);

  return (
    <PurchaseContext.Provider
      value={{ isReady, isPurchased, purchasePairingCode, restorePurchases, identifyUser }}
    >
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase() {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error('usePurchase must be used within PurchaseProvider');
  return ctx;
}
