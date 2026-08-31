/**
 * Device helper utility to generate persistent client device ID and detailed device model information.
 */

export const getDeviceId = () => {
  let deviceId = localStorage.getItem('saby_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    localStorage.setItem('saby_device_id', deviceId);
  }
  return deviceId;
};

export const getDeviceName = () => {
  const ua = navigator.userAgent || '';
  const width = window.screen?.width || 0;
  const height = window.screen?.height || 0;
  const dpr = window.devicePixelRatio || 1;
  const maxDim = Math.max(width, height);
  const minDim = Math.min(width, height);

  let model = '';

  // 1. Precise iPhone & Apple Model Resolution
  if (/iPhone|iPod/.test(ua)) {
    if (minDim === 430 && maxDim === 932) {
      model = 'iPhone 15 Pro Max / 14 Pro Max';
    } else if (minDim === 393 && maxDim === 852) {
      model = 'iPhone 15 Pro / 15 / 14 Pro';
    } else if (minDim === 390 && maxDim === 844) {
      model = 'iPhone 14 / 13 / 12 Pro';
    } else if (minDim === 428 && maxDim === 926) {
      model = 'iPhone 13 Pro Max / 12 Pro Max';
    } else if (minDim === 375 && maxDim === 812) {
      model = 'iPhone 11 Pro / XS / X';
    } else if (minDim === 414 && maxDim === 896) {
      model = dpr >= 3 ? 'iPhone 11 Pro Max / XS Max' : 'iPhone 11 / XR';
    } else if (minDim === 375 && maxDim === 667) {
      model = 'iPhone SE / 8';
    } else {
      model = 'iPhone';
    }
  } else if (/iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    model = 'iPad';
  } else if (/Android/.test(ua)) {
    // Parse Android device model string from User-Agent
    const androidMatch = ua.match(/\(([^)]+)\)/);
    if (androidMatch && androidMatch[1]) {
      const parts = androidMatch[1].split(';');
      for (let part of parts) {
        part = part.trim();
        if (part.includes('Build/') || part.startsWith('SM-') || part.startsWith('Pixel') || part.startsWith('Redmi') || part.startsWith('M2') || part.startsWith('CPH')) {
          const modelName = part.split('Build/')[0].trim();
          if (modelName) {
            model = modelName;
            break;
          }
        }
      }
    }
    if (!model) {
      if (ua.includes('Samsung') || ua.includes('SM-')) model = 'Samsung Galaxy';
      else if (ua.includes('Pixel')) model = 'Google Pixel';
      else if (ua.includes('Xiaomi') || ua.includes('Redmi')) model = 'Xiaomi Redmi';
      else if (ua.includes('OPPO')) model = 'OPPO Phone';
      else if (ua.includes('vivo')) model = 'Vivo Phone';
      else model = 'Android Phone';
    }
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    model = 'MacBook / Mac PC';
  } else if (/Windows NT 10.0/.test(ua)) {
    model = 'Windows 11 / 10 PC';
  } else if (/Windows/.test(ua)) {
    model = 'Windows PC';
  } else if (/Linux/.test(ua)) {
    model = 'Linux Desktop';
  }

  // Detect Browser
  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome') && !ua.includes('Chromium')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';

  return model ? `${model} (${browser})` : `${browser} on Device`;
};

export const getDeviceMetadata = () => {
  return {
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
  };
};
