/**
 * Platform detection utility
 */

export function isFlutterWebView(): boolean {
  if (typeof window === 'undefined') return false

  const userAgent = navigator.userAgent.toLowerCase()

  // Check for Flutter WebView indicators
  if (userAgent.includes('flutter')) return true

  // Check for mobile platforms
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return true
  }

  return false
}

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false

  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    navigator.userAgent.toLowerCase()
  )
}

export function getPlatform(): 'webview' | 'browser' {
  return isFlutterWebView() ? 'webview' : 'browser'
}
