import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import type {WebViewNavigation} from 'react-native-webview';
// live url
const APP_URL = 'https://campus-resource-hub-frontend.vercel.app/';

function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (canGoBack) {
          webViewRef.current?.goBack();
          return true;
        }

        return false;
      },
    );

    return () => subscription.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = useCallback(
    (event: WebViewNavigation) => {
      setCanGoBack(event.canGoBack);
    },
    [],
  );

  const reload = useCallback(() => {
    setHasError(false);
    webViewRef.current?.reload();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.container}>
          <WebView
            ref={webViewRef}
            source={{uri: APP_URL}}
            style={styles.webView}
            javaScriptEnabled
            domStorageEnabled
            allowsBackForwardNavigationGestures
            setSupportMultipleWindows={false}
            pullToRefreshEnabled={Platform.OS === 'android'}
            onLoadStart={() => setHasError(false)}
            onNavigationStateChange={handleNavigationStateChange}
            onError={() => setHasError(true)}
            onHttpError={event => {
              if (event.nativeEvent.statusCode >= 500) {
                setHasError(true);
              }
            }}
          />

          {hasError ? <ErrorOverlay onRetry={reload} /> : null}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function ErrorOverlay({onRetry}: {onRetry: () => void}) {
  return (
    <View style={styles.overlay}>
      <Image
        source={require('./src/assets/app-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.errorTitle}>Campus Resource Hub</Text>
      <Text style={styles.errorText}>
        The app could not reach the live site. Check your connection and try
        again.
      </Text>
      <Pressable style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2563EB',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: 18,
    paddingHorizontal: 28,
  },
  logo: {
    width: 104,
    height: 104,
  },
  errorTitle: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 23,
    maxWidth: 320,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 132,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 22,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default App;
