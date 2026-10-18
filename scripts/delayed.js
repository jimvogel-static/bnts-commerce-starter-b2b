import { getConfigValue } from '@dropins/tools/lib/aem/configs.js';
import { getConsent, pushAnalyticsContext } from './commerce.js';

async function initAnalytics() {
  try {
    // Load Commerce events SDK and collector
    // only if "analytics" has been added to the config.
    // BNTS: the storefront, shopper and AEP contexts are pushed earlier, in
    // commerce.js pushAnalyticsContext(), so events fired before this point carry them.
    const analyticsConfig = getConfigValue('analytics');

    if (analyticsConfig && getConsent('commerce-collection')) {
      // Fallback: push the contexts now if the eager push did not run
      pushAnalyticsContext();

      // Load events SDK and collector
      import('./commerce-events-sdk.js');
      import('./commerce-events-collector.js');
    }
  } catch (error) {
    console.warn('Error initializing analytics', error);
  }
}

if (document.prerendering) {
  document.addEventListener('prerenderingchange', initAnalytics, { once: true });
} else {
  initAnalytics();
}

// add delayed functionality here
