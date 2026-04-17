import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import * as ScreenCapture from 'expo-screen-capture';
import {
  cacheDirectory,
  getInfoAsync,
  downloadAsync,
  deleteAsync,
} from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import api from '../../src/services/api';

// WebView only works on native platforms
let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const FONT_SIZE_KEY = 'reader_font_size';

export default function ReaderScreen() {
  const { id, chapterId } = useLocalSearchParams<{ id: string; chapterId?: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [fontSize, setFontSize] = useState(16);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chapter, setChapter] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pdfProxyUrl, setPdfProxyUrl] = useState('');   // web iframe fallback
  const [pdfCacheUri, setPdfCacheUri] = useState('');   // Android local file URI

  console.log("chapter",chapter)
  // PDF page-wise state
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfTotalPages, setPdfTotalPages] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const webViewRef = useRef<any>(null);

  // Block screenshots and screen recording on this screen
  useEffect(() => {
    if (Platform.OS !== 'web') {
      ScreenCapture.preventScreenCaptureAsync();
    }
    return () => {
      if (Platform.OS !== 'web') {
        ScreenCapture.allowScreenCaptureAsync();
      }
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(FONT_SIZE_KEY).then((val) => {
      if (val) setFontSize(Number(val));
    });
  }, []);

  useEffect(() => {
    fetchChapter();
  }, [id, chapterId]);

  // Animate progress bar when page changes
  useEffect(() => {
    if (pdfTotalPages > 0) {
      Animated.spring(progressAnim, {
        toValue: pdfCurrentPage / pdfTotalPages,
        useNativeDriver: false,
        friction: 8,
        tension: 60,
      }).start();
    }
  }, [pdfCurrentPage, pdfTotalPages]);

  const updateFontSize = (size: number) => {
    setFontSize(size);
    AsyncStorage.setItem(FONT_SIZE_KEY, String(size));
  };

  const fetchChapter = async () => {
    if (!chapterId) { setLoading(false); return; }
    try {
      setLoading(true);
      const res = await api.get(`/reader/books/${id}/chapters/${chapterId}`);
      const payload = res.data;
      const chapterData = payload?.chapter || payload || null;
      setChapter(chapterData);
      setIsUnlocked(payload?.isUnlocked ?? false);

      // Fetch the PDF URL from the dedicated pdf-url endpoint
      if (chapterData?.hasPdfContent && (payload?.isUnlocked ?? false)) {
        const urlRes = await api.get(`/reader/books/${id}/chapters/${chapterId}/pdf-url`);
        const directUrl = urlRes.data?.url;
        if (directUrl) {
          // Web: iframe can fetch the S3 URL directly
          setPdfProxyUrl(directUrl);

          if (Platform.OS === 'web') {
            setPdfCacheUri(directUrl);
          } else {
            // Native: download to local cache first, then feed pdf.js a file:// URI
            // (avoids CORS on S3 Range requests from the WebView origin)
            const cacheFile = `${cacheDirectory}pdf_chapter_v2_${chapterId}.pdf`;
            const info = await getInfoAsync(cacheFile);
            if (!info.exists || (info.size ?? 0) < 1024) {
              if (info.exists) await deleteAsync(cacheFile, { idempotent: true });
              const result = await downloadAsync(directUrl, cacheFile);
              setPdfCacheUri(result.uri);
            } else {
              setPdfCacheUri(cacheFile);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch chapter', error);
    } finally {
      setLoading(false);
    }
  };

  const htmlContent = chapter?.contentHtml || chapter?.content || '';
  const previewContent = chapter?.contentPreview || '';
  const isPdfChapter = chapter?.sourceType === 'pdf' || chapter?.hasPdfContent;
  const isLockedPdf = isPdfChapter && !isUnlocked;

  // Handle messages from PDF WebView (page changes)
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'pageInfo') {
        setPdfCurrentPage(data.currentPage);
        setPdfTotalPages(data.totalPages);
      }
    } catch (e) {
      // ignore non-JSON messages
    }
  }, []);

  // Navigate PDF pages from native side
  const goToPdfPage = useCallback((direction: 'prev' | 'next') => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        window.navigatePage && window.navigatePage('${direction}');
        true;
      `);
    }
  }, []);

  // Locked chapter UI
  const renderLockedContent = () => (
    <View style={styles.lockedContainer}>
      <Ionicons name="lock-closed" size={48} color={colors.textMuted} />
      <Text style={styles.lockedTitle}>Chapter Locked</Text>
      <Text style={styles.lockedText}>
        {chapter?.coinCost > 0
          ? `Unlock this chapter for ${chapter.coinCost} coins`
          : 'Subscribe to premium or purchase to read this chapter'}
      </Text>
      <TouchableOpacity style={styles.unlockButton} onPress={() => router.back()}>
        <Text style={styles.unlockButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  // PDF progress bar & page indicator
  const renderPdfControls = () => {
    if (pdfTotalPages <= 0) return null;
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.pdfControls}>
        <View style={styles.pdfNavRow}>
          {/* Page navigation buttons */}
          <View style={styles.pageNavControls}>
            <TouchableOpacity
              onPress={() => goToPdfPage('prev')}
              style={[styles.pdfNavButton, pdfCurrentPage <= 1 && styles.pdfNavButtonDisabled]}
              disabled={pdfCurrentPage <= 1}
            >
              <Ionicons name="chevron-back" size={20} color={pdfCurrentPage <= 1 ? colors.textDim : colors.text} />
            </TouchableOpacity>

            <View style={styles.pageIndicator}>
              <Text style={styles.pageCurrentText}>{pdfCurrentPage}</Text>
              <Text style={styles.pageSeparator}> / </Text>
              <Text style={styles.pageTotalText}>{pdfTotalPages}</Text>
            </View>

            <TouchableOpacity
              onPress={() => goToPdfPage('next')}
              style={[styles.pdfNavButton, pdfCurrentPage >= pdfTotalPages && styles.pdfNavButtonDisabled]}
              disabled={pdfCurrentPage >= pdfTotalPages}
            >
              <Ionicons name="chevron-forward" size={20} color={pdfCurrentPage >= pdfTotalPages ? colors.textDim : colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: progressWidth },
            ]}
          />
        </View>
      </View>
    );
  };

  const buildPdfHtml = (fileUri: string, bgColor: string, primaryColor: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          width: 100%; height: 100%;
          background: ${bgColor};
          -webkit-user-select: none; user-select: none;
          -webkit-touch-callout: none;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        #viewer {
          width: 100%; height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #canvas-container {
          position: relative;
          display: flex; align-items: center; justify-content: center;
          min-width: 100%; min-height: 100%;
          transition: opacity 0.25s ease;
        }
        #canvas-container.fading { opacity: 0.3; }
        canvas {
          max-width: none;
          display: block;
          transform-origin: center center;
        }
        #loading {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          color: #fff; font-size: 14px;
          z-index: 10;
        }
        .spinner {
          width: 32px; height: 32px;
          border: 3px solid rgba(255,255,255,0.15);
          border-top-color: ${primaryColor};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Tap zones for prev/next */
        .tap-zone {
          position: absolute; top: 0; bottom: 0; width: 25%;
          z-index: 5; cursor: pointer;
        }
        .tap-zone.left { left: 0; }
        .tap-zone.right { right: 0; }
      </style>
    </head>
    <body oncontextmenu="return false">
      <div id="viewer">
        <div id="loading">
          <div class="spinner"></div>
          <span>Loading PDF...</span>
        </div>
        <div id="canvas-container">
          <canvas id="pdf-canvas"></canvas>
        </div>
        <div class="tap-zone left" id="tap-prev"></div>
        <div class="tap-zone right" id="tap-next"></div>
      </div>

      <script>
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        let pdfDoc = null;
        let currentPage = 1;
        let totalPages = 0;
        let rendering = false;
        let pendingPage = null;

        const canvas = document.getElementById('pdf-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('canvas-container');

        function sendPageInfo() {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'pageInfo',
            currentPage: currentPage,
            totalPages: totalPages
          }));
        }

        async function renderPage(num, showFade = true) {
          if (rendering) { pendingPage = num; return; }
          rendering = true;
          if (showFade) container.classList.add('fading');

          try {
            const page = await pdfDoc.getPage(num);
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const unscaledVp = page.getViewport({ scale: 1 });
            const scaleW = vw / unscaledVp.width;
            const scaleH = vh / unscaledVp.height;
            const baseScale = Math.min(scaleW, scaleH) * 0.95;
            
            // Render at 2x for crisp display without excessive memory use
            const highResScale = baseScale * 2.0;
            const renderViewport = page.getViewport({ scale: highResScale });
            const cssViewport = page.getViewport({ scale: baseScale });

            canvas.width = renderViewport.width;
            canvas.height = renderViewport.height;
            canvas.style.width = cssViewport.width + 'px';
            canvas.style.height = cssViewport.height + 'px';

            await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;

            currentPage = num;
            if (showFade) sendPageInfo(); // Don't spam messages on zoom changes
          } catch (e) {
            console.error('Render error', e);
          }

          // Small delay for smooth transition
          if (showFade) {
            setTimeout(() => {
              container.classList.remove('fading');
            }, 50);
          }

          rendering = false;
          if (pendingPage !== null) {
            const p = pendingPage;
            pendingPage = null;
            renderPage(p);
          }
        }

        window.navigatePage = function(direction) {
          if (direction === 'next' && currentPage < totalPages) {
            renderPage(currentPage + 1);
          } else if (direction === 'prev' && currentPage > 1) {
            renderPage(currentPage - 1);
          }
        };

        // Tap zones
        document.getElementById('tap-prev').addEventListener('click', () => {
          const scale = window.visualViewport ? window.visualViewport.scale : 1;
          if (scale <= 1.01) window.navigatePage('prev');
        });
        document.getElementById('tap-next').addEventListener('click', () => {
          const scale = window.visualViewport ? window.visualViewport.scale : 1;
          if (scale <= 1.01) window.navigatePage('next');
        });

        // Swipe gesture support
        let touchStartX = 0;
        let touchStartY = 0;
        document.addEventListener('touchstart', (e) => {
          touchStartX = e.changedTouches[0].screenX;
          touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
          // Disable swipe if zoomed in (user is panning)
          const scale = window.visualViewport ? window.visualViewport.scale : 1;
          if (scale > 1.01) return;

          const dx = e.changedTouches[0].screenX - touchStartX;
          const dy = e.changedTouches[0].screenY - touchStartY;
          // Only trigger if horizontal swipe is dominant and > 50px
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) {
              window.navigatePage('next');
            } else {
              window.navigatePage('prev');
            }
          }
        }, { passive: true });

        // Load document from local cached file
        (async () => {
          try {
            pdfDoc = await pdfjsLib.getDocument({
              url: '${fileUri}'
            }).promise;
            totalPages = pdfDoc.numPages;
            document.getElementById('loading').style.display = 'none';
            sendPageInfo();
            renderPage(1);
          } catch (e) {
            document.getElementById('loading').innerHTML = '<span style="color:#FF6B6B">Failed to load PDF. Check connection.</span>';
          }
        })();
      </script>
    </body>
    </html>
  `;

  // Memoized so WebView never reloads on page turns
  const pdfWebViewSource = React.useMemo(() => {
    if (!pdfCacheUri) return null;
    return {
      html: buildPdfHtml(pdfCacheUri, colors.background, colors.primary),
      baseUrl: 'file:///',
    };
  }, [pdfCacheUri]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {chapter?.title || 'Chapter'}
        </Text>
        {!isPdfChapter && !isLockedPdf ? (
          <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* Font size settings (only for unlocked HTML chapters) */}
      {showSettings && !isPdfChapter && !isLockedPdf && (
        <View style={styles.settings}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Font Size</Text>
            <View style={styles.fontControls}>
              <TouchableOpacity
                onPress={() => updateFontSize(Math.max(12, fontSize - 2))}
                style={styles.fontButton}
              >
                <Text style={styles.fontButtonText}>A-</Text>
              </TouchableOpacity>
              <Text style={styles.fontSizeText}>{fontSize}</Text>
              <TouchableOpacity
                onPress={() => updateFontSize(Math.min(24, fontSize + 2))}
                style={styles.fontButton}
              >
                <Text style={styles.fontButtonText}>A+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !chapter ? (
        <View style={styles.lockedContainer}>
          <Text style={[styles.text, { fontSize, textAlign: 'center' }]}>
            Unable to load chapter. Please go back and try again.
          </Text>
        </View>
      ) : !isUnlocked ? (
        // Locked chapter
        renderLockedContent()
      ) : isPdfChapter && (pdfCacheUri || pdfProxyUrl) ? (
        // Unlocked PDF chapter — page-wise viewer
        <View style={{ flex: 1 }}>
          {Platform.OS === 'web' ? (
            <View style={styles.pdfViewer}>
              <iframe
                src={pdfProxyUrl}
                style={{ width: '100%', height: '100%', border: 'none' } as any}
                title={chapter?.title || 'PDF Chapter'}
                sandbox="allow-scripts allow-same-origin"
              />
            </View>
          ) : WebView && pdfWebViewSource ? (
            <>
              <WebView
                ref={webViewRef}
                source={pdfWebViewSource}
                style={styles.pdfViewer}
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.text, { marginTop: spacing.md, textAlign: 'center' }]}>
                      Loading PDF...
                    </Text>
                  </View>
                )}
                javaScriptEnabled
                originWhitelist={['*']}
                mixedContentMode="compatibility"
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                onMessage={handleWebViewMessage}
                scalesPageToFit={true}
                setBuiltInZoomControls={true}
                setDisplayZoomControls={false}
                scrollEnabled={true}
              />
              {renderPdfControls()}
            </>
          ) : null}
        </View>
      ) : (
        // Unlocked HTML chapter
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {htmlContent ? (
            <RenderHtml
              contentWidth={width}
              source={{ html: htmlContent }}
              tagsStyles={{
                p: { color: colors.text, fontSize, lineHeight: fontSize * 1.6, marginBottom: spacing.md },
                span: { color: colors.text, fontSize },
                strong: { color: colors.text, fontSize, fontWeight: 'bold' },
                h1: { color: colors.text, fontSize: fontSize + 8, marginBottom: spacing.md },
                h2: { color: colors.text, fontSize: fontSize + 6, marginBottom: spacing.sm },
                h3: { color: colors.text, fontSize: fontSize + 4, marginBottom: spacing.sm },
              }}
            />
          ) : previewContent ? (
            <Text style={[styles.text, { fontSize }]}>{previewContent}</Text>
          ) : (
            <Text style={[styles.text, { fontSize }]}>This chapter has no content yet.</Text>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  settings: {
    padding: spacing.md,
    backgroundColor: colors.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: { ...typography.body, color: colors.text },
  fontControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  fontButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontButtonText: { color: colors.text, fontWeight: 'bold' },
  fontSizeText: { ...typography.body, color: colors.text, width: 30, textAlign: 'center' },
  content: { flex: 1 },
  contentContainer: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  text: { color: colors.text, lineHeight: 28 },
  loadingContainer: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
  pdfViewer: { flex: 1 },
  lockedContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: spacing.xl,
  },
  lockedTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  lockedText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center' as const,
    marginBottom: spacing.lg,
  },
  unlockButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  unlockButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // PDF page-wise controls
  pdfControls: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pdfNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  pageNavControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  pdfNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pdfNavButtonDisabled: {
    opacity: 0.4,
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
    justifyContent: 'center',
  },
  pageCurrentText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  pageSeparator: {
    fontSize: 14,
    color: colors.textMuted,
  },
  pageTotalText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.backgroundLight,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
});
