import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import Constants from 'expo-constants';
import client from '../api/client';

const REVENUECAT_API_KEY = Constants.expoConfig?.extra?.revenueCatApiKey || '';
const PRODUCT_ID = 'lu.venn.pairingcode_v2';
const IS_EXPO_GO = Constants.appOwnership === 'expo';

const PurchaseContext = createContext(null);

export function PurchaseProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [credits, setCredits] = useState(0);
  const mountedRef = useRef(true);

  const fetchCredits = useCallback(async () => {
    try {
      const { data } = await client.get('/pairing/status');
      const n = Number(data?.pairing_credits) || 0;
      if (mountedRef.current) setCredits(n);
      return n;
    } catch (e) {
      if (__DEV__) console.warn('Fetch credits error:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    async function init() {
      if (IS_EXPO_GO) {
        // RevenueCat native store unavailable in Expo Go — skip RC config.
        // Still pull credits from backend so dev builds reflect real state.
        await fetchCredits();
        if (mountedRef.current) setIsReady(true);
        return;
      }
      try {
        Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      } catch (e) {
        if (__DEV__) console.warn('RevenueCat init error:', e);
      }
      await fetchCredits();
      if (mountedRef.current) setIsReady(true);
    }
    init();
    return () => { mountedRef.current = false; };
  }, [fetchCredits]);

  const verifyWithBackend = async (rcUserId) => {
    try {
      const { data } = await client.post('/pairing/verify-purchase', { rc_user_id: rcUserId });
      const n = Number(data?.credits) || 0;
      if (mountedRef.current) setCredits(n);
      return n;
    } catch (e) {
      const err = new Error(
        "Payment received but we couldn't confirm it on our side. Try 'Restore purchases' in a moment — if it still fails, contact support and we'll fix it."
      );
      err.verificationFailed = true;
      throw err;
    }
  };

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
          await verifyWithBackend(customerInfo.originalAppUserId);
          return customerInfo;
        }
      }

      // Fallback: fetch product directly and purchase
      const products = await Purchases.getProducts([PRODUCT_ID]);
      if (products.length === 0) {
        throw new Error('Product not available. Please try again later.');
      }
      const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
      await verifyWithBackend(customerInfo.originalAppUserId);
      return customerInfo;
    } catch (e) {
      if (e.userCancelled) return null;
      throw e;
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      const before = credits;
      try {
        const after = await verifyWithBackend(info?.originalAppUserId);
        return (after ?? 0) > before;
      } catch {
        return false;
      }
    } catch (e) {
      if (__DEV__) console.warn('Restore error:', e);
      return false;
    }
  }, [credits]);

  const identifyUser = useCallback(async (userId) => {
    try {
      await Purchases.logIn(String(userId));
    } catch (e) {
      if (__DEV__) console.warn('RevenueCat identify error:', e);
    }
  }, []);

  const refreshCredits = useCallback(async () => {
    return await fetchCredits();
  }, [fetchCredits]);

  return (
    <PurchaseContext.Provider
      value={{ isReady, credits, purchasePairingCode, restorePurchases, identifyUser, refreshCredits }}
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
