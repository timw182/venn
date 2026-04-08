import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions,
  TextInput, KeyboardAvoidingView, Platform, Modal, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, radii, space } from '../theme/tokens';
import client, { setOnError } from '../api/client';

const ErrorContext = createContext(null);

export function useError() {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error('useError must be used within ErrorProvider');
  return ctx;
}

function ErrorToast({ error, onDismiss, onReport }) {
  const topInset = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      dismiss();
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }

  return (
    <Animated.View style={[styles.toast, { top: topInset + 8, opacity, transform: [{ translateY }] }]}>
      <View style={styles.toastContent}>
        <View style={styles.toastIcon}>
          <Feather name="alert-circle" size={18} color={colors.no} />
        </View>
        <View style={styles.toastBody}>
          <Text style={styles.toastTitle}>Something went wrong</Text>
          <Text style={styles.toastMessage} numberOfLines={2}>{error.message}</Text>
        </View>
        <TouchableOpacity onPress={dismiss} hitSlop={8} style={styles.toastClose}>
          <Feather name="x" size={16} color={colors.textLight} />
        </TouchableOpacity>
      </View>
      <View style={styles.toastActions}>
        <TouchableOpacity onPress={dismiss} style={styles.toastBtn}>
          <Text style={styles.toastBtnText}>Dismiss</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { dismiss(); onReport(error); }} style={[styles.toastBtn, styles.toastBtnReport]}>
          <Feather name="send" size={12} color={colors.rose} />
          <Text style={[styles.toastBtnText, styles.toastBtnReportText]}>Report</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function ReportModal({ visible, error, onClose }) {
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (visible) { setNote(''); setSent(false); }
  }, [visible]);

  async function submit() {
    setSending(true);
    try {
      const message = [
        `[Error Report]`,
        `Error: ${error?.message || 'Unknown'}`,
        error?.endpoint ? `Endpoint: ${error.endpoint}` : null,
        error?.status ? `Status: ${error.status}` : null,
        note ? `\nUser note: ${note}` : null,
      ].filter(Boolean).join('\n');
      await client.post('/tickets', { message });
      setSent(true);
      setTimeout(onClose, 1500);
    } catch {
      // If ticket submission itself fails, just close
      onClose();
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            {sent ? (
              <View style={styles.sentWrap}>
                <Feather name="check-circle" size={32} color={colors.yes} />
                <Text style={styles.sentText}>Report sent — thank you!</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>Report an error</Text>
                <View style={styles.modalErrorBox}>
                  <Text style={styles.modalErrorText}>{error?.message || 'Unknown error'}</Text>
                </View>
                <Text style={styles.modalLabel}>Additional details (optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="What were you doing when this happened?..."
                  placeholderTextColor={colors.textLight}
                  multiline
                  maxLength={1000}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={onClose} style={styles.modalBtnCancel}>
                    <Text style={styles.modalBtnCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={submit} disabled={sending} style={styles.modalBtnSend}>
                    <Text style={styles.modalBtnSendText}>{sending ? 'Sending…' : 'Send report'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ErrorProvider({ children }) {
  const [currentError, setCurrentError] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [reportVisible, setReportVisible] = useState(false);

  const showError = useCallback((message, details = {}) => {
    // Don't show popups for auth errors (handled by AuthContext)
    if (details.status === 401) return;
    setCurrentError({ message, ...details });
  }, []);

  useEffect(() => {
    setOnError((message, details) => showError(message, details));
  }, [showError]);

  const dismissError = useCallback(() => {
    setCurrentError(null);
  }, []);

  function handleReport(error) {
    setReportError(error);
    setReportVisible(true);
  }

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      {currentError && (
        <ErrorToast
          error={currentError}
          onDismiss={dismissError}
          onReport={handleReport}
        />
      )}
      <ReportModal
        visible={reportVisible}
        error={reportError}
        onClose={() => setReportVisible(false)}
      />
    </ErrorContext.Provider>
  );
}

const { width: SW } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Toast
  toast: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(240,122,106,0.3)',
    padding: space[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
  },
  toastIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.noSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  toastBody: { flex: 1 },
  toastTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text,
    marginBottom: 2,
  },
  toastMessage: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  toastClose: { padding: 2 },
  toastActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space[2],
    marginTop: space[2],
    paddingTop: space[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toastBtn: {
    paddingVertical: 6,
    paddingHorizontal: space[3],
    borderRadius: radii.full,
  },
  toastBtnText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textLight,
  },
  toastBtnReport: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(196,84,122,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(196,84,122,0.2)',
  },
  toastBtnReportText: {
    color: colors.rose,
    fontFamily: fonts.sansMedium,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45,31,61,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: Math.min(SW - 48, 400),
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: space[5],
    gap: space[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 20,
    color: colors.text,
  },
  modalErrorBox: {
    backgroundColor: colors.noSoft,
    borderRadius: radii.sm,
    padding: space[3],
  },
  modalErrorText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.no,
  },
  modalLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: space[3],
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: space[2],
    marginTop: space[1],
  },
  modalBtnCancel: {
    paddingVertical: 10,
    paddingHorizontal: space[4],
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalBtnCancelText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  modalBtnSend: {
    paddingVertical: 10,
    paddingHorizontal: space[4],
    borderRadius: radii.full,
    backgroundColor: 'rgba(196,84,122,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(196,84,122,0.3)',
  },
  modalBtnSendText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.rose,
  },

  // Sent confirmation
  sentWrap: {
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[4],
  },
  sentText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.text,
  },
});
