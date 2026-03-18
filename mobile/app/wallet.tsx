import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { walletService } from '../src/services/wallet.service';
import { useAppSelector } from '../src/hooks/useAppSelector';

// Matches actual backend WalletTransaction fields
interface WalletTxn {
  _id: string;
  source: string;   // 'referral' | 'bonus' | 'unlock' | 'coin_pack' | 'refund' | 'adjustment'
  type: string;     // 'credit' | 'debit'
  coins: number;
  notes: string;
  createdAt: string;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getTxnIcon(
  type: string
): { name: keyof typeof Ionicons.glyphMap; bg: string; color: string } {
  switch (type) {
    case 'referral':
      return { name: 'people-outline', bg: '#1D2B1F', color: '#4ADE80' };
    case 'bonus':
      return { name: 'gift-outline', bg: '#1D2B1F', color: '#4ADE80' };
    case 'debit':
    case 'unlock':
      return { name: 'arrow-up-outline', bg: '#241D24', color: '#F87171' };
    case 'refund':
      return { name: 'refresh-outline', bg: '#1D2432', color: '#A78BFA' };
    default:
      return { name: 'ellipse-outline', bg: '#1F2937', color: '#9CA3AF' };
  }
}

export default function WalletScreen() {
  const { user } = useAppSelector((state) => state.auth);

  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadTransactions();
    }
  }, [user?.id]);

  const referralTransactions = useMemo(() => {
    return transactions.filter(
      (txn) => txn.source === 'referral' || txn.source === 'bonus'
    );
  }, [transactions]);

  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return referralTransactions
      .filter((txn) => {
        const d = new Date(txn.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, txn) => sum + Number(txn.coins || 0), 0);
  }, [referralTransactions]);

  const lifetimeCredits = useMemo(() => {
    return referralTransactions.reduce(
      (sum, txn) => sum + Number(txn.coins || 0),
      0
    );
  }, [referralTransactions]);

  const loadTransactions = async (page = 1, append = false) => {
    if (!user?.id) return;
    try {
      if (page === 1) setLoadingTransactions(true);
      else setLoadingMoreTransactions(true);

      const { transactions: data, pagination } = await walletService.getTransactions(user.id, page, 20);
      if (Array.isArray(data)) {
        setTransactions((prev) => (append ? [...prev, ...data] : data));
        setTxPage(page);
        setTxHasMore(pagination ? page < pagination.pages : false);
      } else {
        if (!append) setTransactions([]);
      }
    } catch {
      if (!append) setTransactions([]);
    } finally {
      setLoadingTransactions(false);
      setLoadingMoreTransactions(false);
    }
  };

  const handleLoadMore = () => {
    if (!txHasMore || loadingMoreTransactions) return;
    loadTransactions(txPage + 1, true);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070B14" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Balance Card */}
          <LinearGradient
            colors={['#1D2A40', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <View style={styles.availableBadge}>
                <Text style={styles.availableBadgeText}>Available</Text>
              </View>
            </View>

            <View style={styles.balanceAmountRow}>
              <Text style={styles.balanceCurrency}>₹</Text>
              <Text style={styles.balanceAmount}>
                {Number(user?.coin_balance || 0).toLocaleString()}
              </Text>
              <Text style={styles.balanceUnit}>coins</Text>
            </View>

            <View style={styles.balanceDivider} />

            <View style={styles.balanceBottomRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>This Month</Text>
                <Text style={styles.statValue}>
                  +{thisMonthTotal.toLocaleString()} coins
                </Text>
              </View>
              <View style={styles.statVerticalDivider} />
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Lifetime</Text>
                <Text style={styles.statValue}>
                  {lifetimeCredits.toLocaleString()} coins
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Referral Coins Transactions */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Referral Coins</Text>
            </View>

            {loadingTransactions ? (
              <ActivityIndicator color="#60A5FA" style={{ marginTop: 20 }} />
            ) : referralTransactions.length > 0 ? (
              <View style={styles.transactionList}>
                {referralTransactions.map((txn, index) => {
                  const icon = getTxnIcon(txn.source);
                  return (
                    <View
                      key={txn._id}
                      style={[
                        styles.transactionItem,
                        index === referralTransactions.length - 1 && {
                          borderBottomWidth: 0,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.transactionIconWrap,
                          { backgroundColor: icon.bg },
                        ]}
                      >
                        <Ionicons name={icon.name} size={18} color={icon.color} />
                      </View>

                      <View style={styles.transactionInfo}>
                        <Text numberOfLines={1} style={styles.transactionTitle}>
                          {txn.notes || 'Referral Reward'}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(txn.createdAt)}
                        </Text>
                      </View>

                      <View style={styles.transactionAmountWrap}>
                        <Text style={[styles.transactionAmount, { color: '#4ADE80' }]}>
                          +{txn.coins}
                        </Text>
                        <Text style={styles.transactionCoinsText}>coins</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {referralTransactions.length > 0 && (
              <View style={styles.txPaginationRow}>
                {loadingMoreTransactions ? (
                  <ActivityIndicator color="#60A5FA" />
                ) : txHasMore ? (
                  <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
                    <Text style={styles.loadMoreText}>Load More</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.txEndText}>
                    Showing all {referralTransactions.length} transactions
                  </Text>
                )}
              </View>
            )}

            {referralTransactions.length === 0 && !loadingTransactions && (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="people-outline" size={28} color="#8B95A7" />
                </View>
                <Text style={styles.emptyTitle}>No referral coins yet</Text>
                <Text style={styles.emptySubtitle}>
                  Refer friends to earn coins. Your rewards will appear here.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050811',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#050811',
  },
  scrollContent: {
    paddingBottom: 30,
  },

  balanceCard: {
    marginHorizontal: 22,
    marginTop: 18,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#22314B',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#95A0B2',
    fontSize: 14,
    fontWeight: '600',
  },
  availableBadge: {
    backgroundColor: '#1E3A66',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  availableBadgeText: {
    color: '#68A4FF',
    fontSize: 12,
    fontWeight: '700',
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 26,
  },
  balanceCurrency: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginRight: 3,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 54,
    lineHeight: 58,
    fontWeight: '900',
    letterSpacing: -1.8,
  },
  balanceUnit: {
    color: '#9BA7BA',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
    marginBottom: 10,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: '#24344E',
    marginTop: 26,
    marginBottom: 20,
  },
  balanceBottomRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statBlock: {
    flex: 1,
  },
  statVerticalDivider: {
    width: 1,
    backgroundColor: '#24344E',
    marginHorizontal: 14,
  },
  statLabel: {
    color: '#8F9BAD',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 7,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  sectionWrap: {
    marginTop: 34,
  },
  sectionHeader: {
    paddingHorizontal: 22,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  transactionList: {
    marginHorizontal: 22,
    backgroundColor: '#0F1625',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2333',
  },
  transactionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
    paddingRight: 8,
  },
  transactionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionDate: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  transactionAmountWrap: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  transactionCoinsText: {
    color: '#8F9BAD',
    fontSize: 11,
    marginTop: 2,
  },

  emptyCard: {
    marginHorizontal: 22,
    backgroundColor: '#0F1625',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    paddingVertical: 34,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#182131',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },

  txPaginationRow: {
    marginHorizontal: 22,
    marginTop: 14,
    alignItems: 'center',
  },
  loadMoreBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: '#1D2840',
    borderWidth: 1,
    borderColor: '#2D3F5E',
  },
  loadMoreText: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
  },
  txEndText: {
    color: '#5A6478',
    fontSize: 13,
    fontWeight: '500',
  },
});
