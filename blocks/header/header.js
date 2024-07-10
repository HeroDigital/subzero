import { cartApi } from '../../scripts/minicart/api.js';
import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-categories');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-categories .default-content-wrapper').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('role');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

function setClassByLevel(rootElement) {
  function traverseAndSetClass(element, level, col) {
    if (element.tagName.toLowerCase() === 'li') {
      element.classList.add('level-' + level);
      element.classList.add('col-' + col);
    }

    const children = Array.from(element.children);
    children.forEach((child, index) => {
      if (child.tagName.toLowerCase() === 'ul' || child.tagName.toLowerCase() === 'li') {
        traverseAndSetClass(child, child.tagName.toLowerCase() === 'ul' ? level + 1 : level, index);
      }
    });
  }

  // Start the recursion with the root element and level 1
  traverseAndSetClass(rootElement, 1);
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools', 'categories'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');

  const navCategories = nav.querySelector('.nav-categories');
  const navBreak = document.createElement('div');
  navBreak.className = 'nav-break';
  navCategories.insertAdjacentElement('beforebegin', navBreak);

  if (navCategories) {
    setClassByLevel(navCategories.querySelector(':scope .default-content-wrapper > ul'));

    navCategories.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navCategory) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'wrapper';
      const subMenu = navCategory.querySelector(':scope > ul');
      if (subMenu) {
        wrapper.appendChild(subMenu);
        navCategory.append(wrapper);
      }

      navCategory.addEventListener('mouseenter', () => {
        if (isDesktop.matches) {
          const expanded = navCategory.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navCategories);
          navCategory.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });

      navCategory.addEventListener('mouseleave', () => {
        const expanded = navCategory.getAttribute('aria-expanded') === 'true';
        toggleAllNavSections(navCategories);
        navCategory.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      });
    });
  }

  const navTools = nav.querySelector('.nav-tools');

  // Minicart
  const minicartButton = document.createRange().createContextualFragment(`<div class="minicart-wrapper">
    <button type="button" class="button nav-cart-button">0</button>
    <div></div>
  </div>`);
  navTools.append(minicartButton);
  navTools.querySelector('.nav-cart-button').addEventListener('click', () => {
    cartApi.toggleCart();
  });
  cartApi.cartItemsQuantity.watch((quantity) => {
    navTools.querySelector('.nav-cart-button').textContent = quantity;
  });

  // Search
  const searchInput = document.createRange().createContextualFragment(`<div class="nav-search">
      <form id="search_mini_form" action="/search" method="GET">
        <input id="search" type="search" name="q" placeholder="Search" />
        <div id="search_autocomplete" class="search-autocomplete"></div>
        <button type="button" class="button nav-search-button"></button>
      </form>
    </div>`);
  navSections.append(searchInput);

  navSections.querySelector('.nav-search-button').addEventListener('click', async () => {
    await import('./searchbar.js');
  });

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.append(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
