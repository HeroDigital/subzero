/* eslint-disable import/no-cycle */
import { sampleRUM } from './aem.js';
import { getConfigValue } from './configs.js';
import { getConsent } from './scripts.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
function addProductItemActions() {
  const items = document.querySelectorAll(".ds-sdk-product-item");
  items.forEach((item) => {
    const actions = document.createElement('div');
    actions.classList.add('product-item-actions');

    const compare = document.createRange().createContextualFragment(`
      <div class="compare-block">
        <input type="checkbox" name="compare">
        <label><span class="compare-label">Compare</span></label>
        <a href="#" class="compare-now-cta hidden">COMPARE NOW</a>
    </div>
    `);
    const wishlist = document.createRange().createContextualFragment(`
      <div class="wishlist-block">
        <img src="icons/wishlist.png" width="20" height="20" alt="Add to Wishlist" />
    </div>`);

    actions.append(compare);
    actions.append(wishlist);
    item.prepend(actions);
  });
}

// Load Commerce events SDK and collector
if (getConsent('commerce-collection')) {
  const config = {
    environmentId: await getConfigValue('commerce-environment-id'),
    environment: await getConfigValue('commerce-environment') === 'Production' ? 'prod' : 'non-prod',
    storeUrl: await getConfigValue('commerce-store-url'),
    websiteId: parseInt(await getConfigValue('commerce-website-id'), 10),
    websiteCode: await getConfigValue('commerce-website-code'),
    storeId: parseInt(await getConfigValue('commerce-store-id'), 10),
    storeCode: await getConfigValue('commerce-store-code'),
    storeViewId: parseInt(await getConfigValue('commerce-store-view-id'), 10),
    storeViewCode: await getConfigValue('commerce-store-view-code'),
    websiteName: await getConfigValue('commerce-website-name'),
    storeName: await getConfigValue('commerce-store-name'),
    storeViewName: await getConfigValue('commerce-store-view-name'),
    baseCurrencyCode: await getConfigValue('commerce-base-currency-code'),
    storeViewCurrencyCode: await getConfigValue('commerce-base-currency-code'),
    storefrontTemplate: 'Franklin',
  };

  window.adobeDataLayer.push(
      { storefrontInstanceContext: config },
      { eventForwardingContext: { commerce: true, aep: false } },
  );

  // Load events SDK and collector
  import('./commerce-events-sdk.js');
  import('./commerce-events-collector.js');
  addProductItemActions();
}
