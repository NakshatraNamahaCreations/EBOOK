import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { walletService } from '../src/services/wallet.service';
import { useAppSelector } from '../src/hooks/useAppSelector';
import { useAppDispatch } from '../src/hooks/useAppDispatch';
import { updateCoinBalance } from '../src/store/slices/authSlice';
import { CoinTransaction } from '../src/types';

interface CoinPack {
  id: string;
  name: string;
  coins: number;
  bonus_coins: number;
  total_coins: number;
  price_inr: number;
  price_usd?: number;
  is_offer: boolean;
  offer_label?: string | null;
}

const fallbackPacks: CoinPack[] = [
  {
    id: '1',
    name: 'Premium Pack',
    coins: 1200,
    bonus_coins: 200,
    total_coins: 1400,
    price_inr: 899,
    is_offer: true,
    offer_label: 'Best Value!',
  },
  {
    id: '2',
    name: 'Ultra Pack',
    coins: 3000,
    bonus_coins: 750,
    total_coins: 3750,
    price_inr: 1999,
    is_offer: true,
    offer_label: '25% Bonus!',
  },
  {
    id: '3',
    name: 'Starter Pack',
    coins: 400,
    bonus_coins: 0,
    total_coins: 400,
    price_inr: 299,
    is_offer: false,
    offer_label: null,
  },
  {
    id: '4',
    name: 'Pro Pack',
    coins: 800,
    bonus_coins: 100,
    total_coins: 900,
    price_inr: 599,
    is_offer: false,
    offer_label: null,
  },
];

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
    case 'purchase':
      return { name: 'add-outline', bg: '#18263E', color: '#60A5FA' };
    case 'debit':
    case 'unlock':
      return { name: 'arrow-up-outline', bg: '#241D24', color: '#F87171' };
    case 'bonus':
      return { name: 'gift-outline', bg: '#1D2B1F', color: '#4ADE80' };
    case 'refund':
      return { name: 'refresh-outline', bg: '#1D2432', color: '#A78BFA' };
    default:
      return { name: 'ellipse-outline', bg: '#1F2937', color: '#9CA3AF' };
  }
}

export default function WalletScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(false);
  const [packs, setPacks] = useState<CoinPack[]>(fallbackPacks);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);
  const [loadingPacks, setLoadingPacks] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false);

  useEffect(() => {
    loadPacks();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadTransactions();
    }
  }, [user?.id]);

  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((txn) => {
        const d = new Date(txn.created_at);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear() &&
          (txn.transaction_type === 'purchase' ||
            txn.transaction_type === 'bonus' ||
            txn.transaction_type === 'refund')
        );
      })
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
  }, [transactions]);

  const lifetimeCredits = useMemo(() => {
    return transactions
      .filter(
        (txn) =>
          txn.transaction_type === 'purchase' ||
          txn.transaction_type === 'bonus' ||
          txn.transaction_type === 'refund'
      )
      .reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
  }, [transactions]);

  const loadPacks = async () => {
    try {
      setLoadingPacks(true);
      const data = await walletService.getCoinPacks();
      if (Array.isArray(data) && data.length > 0) {
        setPacks(data);
      } else {
        setPacks(fallbackPacks);
      }
    } catch (error) {
      setPacks(fallbackPacks);
    } finally {
      setLoadingPacks(false);
    }
  };

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
    } catch (error) {
      if (!append) setTransactions([]);
    } finally {
      setLoadingTransactions(false);
      setLoadingMoreTransactions(false);
    }
  };

  const handleLoadMoreTransactions = () => {
    if (!txHasMore || loadingMoreTransactions) return;
    loadTransactions(txPage + 1, true);
  };

  const handleBuyCoins = async (pack: CoinPack) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found.');
      return;
    }

    try {
      setBuyingPackId(pack.id);
      const result = await walletService.addCoins(user.id, pack.total_coins);
      dispatch(updateCoinBalance(result.new_balance));
      Alert.alert('Success', `${pack.total_coins} coins added to your wallet.`);
      await loadTransactions();
    } catch (error) {
      Alert.alert('Error', 'Failed to purchase coins. Please try again.');
    } finally {
      setBuyingPackId(null);
    }
  };

  const handleGoBack = () => {
    try {
      if (navigation?.goBack) {
        navigation.goBack();
      }
    } catch (error) {
      // no-op
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#070B14" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
       

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          

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

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionCircle}>
                <Ionicons
                  name="arrow-down-outline"
                  size={22}
                  color="#60A5FA"
                />
              </View>
              <Text style={styles.actionText}>Receive</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionCircle}>
                <Ionicons name="arrow-up-outline" size={22} color="#F87171" />
              </View>
              <Text style={styles.actionText}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionCircle}>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={22}
                  color="#A78BFA"
                />
              </View>
              <Text style={styles.actionText}>Swap</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Purchase Coins</Text>
              <TouchableOpacity>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>

            {loadingPacks ? (
              <ActivityIndicator color="#60A5FA" style={{ marginTop: 20 }} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.packsRow}
              >
                {packs.map((pack) => {
                  const isBuying = buyingPackId === pack.id;

                  return (
                    <TouchableOpacity
                      key={pack.id}
                      activeOpacity={0.9}
                      style={styles.packCard}
                      onPress={() => handleBuyCoins(pack)}
                      disabled={!!buyingPackId}
                    >
                      {pack.offer_label ? (
                        <View style={styles.packOfferWrap}>
                          <View style={styles.packOfferBadge}>
                            <Text style={styles.packOfferText}>
                              {pack.offer_label}
                            </Text>
                          </View>
                        </View>
                      ) : null}

                      <Text style={styles.packCoins}>
                        {pack.total_coins.toLocaleString()}
                      </Text>
                      <Text style={styles.packCoinsLabel}>coins</Text>

                      {pack.bonus_coins > 0 ? (
                        <View style={styles.bonusRow}>
                          <Ionicons
                            name="gift-outline"
                            size={13}
                            color="#60A5FA"
                          />
                          <Text style={styles.bonusText}>
                            +{pack.bonus_coins} bonus
                          </Text>
                        </View>
                      ) : (
                        <View style={{ height: 20 }} />
                      )}

                      <Text style={styles.packName}>{pack.name}</Text>

                      <Text style={styles.packPrice}>
                        ₹{pack.price_inr.toLocaleString()}
                      </Text>

                      <LinearGradient
                        colors={['#6AA8FF', '#3B82F6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.purchaseButton}
                      >
                        {isBuying ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.purchaseButtonText}>Purchase</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transaction History</Text>
              <TouchableOpacity>
                <Text style={styles.sectionLink}>Filter</Text>
              </TouchableOpacity>
            </View>

            {loadingTransactions ? (
              <ActivityIndicator color="#60A5FA" style={{ marginTop: 20 }} />
            ) : transactions.length > 0 ? (
              <View style={styles.transactionList}>
                {transactions.map((txn, index) => {
                  const icon = getTxnIcon(txn.transaction_type);
                  const isCredit =
                    txn.transaction_type === 'purchase' ||
                    txn.transaction_type === 'bonus' ||
                    txn.transaction_type === 'refund';

                  return (
                    <View
                      key={txn.id}
                      style={[
                        styles.transactionItem,
                        index === transactions.length - 1 && {
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
                        <Ionicons
                          name={icon.name}
                          size={18}
                          color={icon.color}
                        />
                      </View>

                      <View style={styles.transactionInfo}>
                        <Text
                          numberOfLines={1}
                          style={styles.transactionTitle}
                        >
                          {txn.description || 'Transaction'}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(txn.created_at)}
                        </Text>
                      </View>

                      <View style={styles.transactionAmountWrap}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            { color: isCredit ? '#60A5FA' : '#F87171' },
                          ]}
                        >
                          {isCredit ? '+' : '-'}
                          {txn.amount}
                        </Text>
                        <Text style={styles.transactionCoinsText}>coins</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Load More / pagination info */}
            {transactions.length > 0 && (
              <View style={styles.txPaginationRow}>
                {loadingMoreTransactions ? (
                  <ActivityIndicator color="#60A5FA" />
                ) : txHasMore ? (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={handleLoadMoreTransactions}
                  >
                    <Text style={styles.loadMoreText}>Load More</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.txEndText}>
                    Showing all {transactions.length} transactions
                  </Text>
                )}
              </View>
            )}

            {transactions.length === 0 && !loadingTransactions && (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons
                    name="receipt-outline"
                    size={28}
                    color="#8B95A7"
                  />
                </View>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptySubtitle}>
                  Your wallet activity will appear here.
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

  topBar: {
    height: 56,
    backgroundColor: '#0A0D13',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  topBarRightSpace: {
    width: 34,
  },

  pageHeader: {
    marginTop: 18,
    marginBottom: 18,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#192235',
    borderWidth: 1,
    borderColor: '#22314B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  balanceCard: {
    marginHorizontal: 22,
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

  actionsRow: {
    marginTop: 26,
    marginHorizontal: 34,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionItem: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1D2840',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    color: '#A6B1C2',
    fontSize: 13,
    fontWeight: '500',
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
  sectionLink: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
  },

  packsRow: {
    paddingLeft: 22,
    paddingRight: 10,
  },
  packCard: {
    width: 176,
    minHeight: 240,
    marginRight: 12,
    backgroundColor: '#0F1625',
    borderRadius: 20,
    borderWidth: 1.4,
    borderColor: '#56A0FF',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    overflow: 'visible',
  },
  packOfferWrap: {
    position: 'absolute',
    top: -1,
    left: 14,
    zIndex: 2,
  },
  packOfferBadge: {
    backgroundColor: '#5EA2FF',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  packOfferText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  packCoins: {
    marginTop: 14,
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  packCoinsLabel: {
    color: '#9AA7BC',
    fontSize: 13,
    marginTop: 2,
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  bonusText: {
    marginLeft: 4,
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700',
  },
  packName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  packPrice: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 16,
  },
  purchaseButton: {
    marginTop: 'auto',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
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