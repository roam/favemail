// Favemail browser extension.
//
// Changes the favicon for Google Mail to make it easier to
// differentiate between multiple accounts.

// URL of the embedded favicon template.
//
// The icon is, from back to front, composed of:
// - Frame: a rounded rect covering the viewport (1 opacity)
// - M frame: a white M shape (.5 opacity)
// - White shapes of the M with varying opacities
//
// Those last shapes aren't changed. The color and opacity of the
// first two however *is* changed based on (a) the current account
// and (b) whether there are unread messages.
const iconUrl = browser.runtime.getURL('icons/m.svg');

// Turn the initial SVG icon into a "template" function.
//
// The template accepts the accent color and a flag indicating
// whether to "emphasize" the icon. That will apply the color to
// the background, rather than the included "M" shape.
const createIconTemplate = (text) => {
  const parser = new DOMParser();
  const svg = parser.parseFromString(text, 'image/svg+xml');
  const serializer = new XMLSerializer();
  return (accentColor, emphasize) => {
    // The rounded rect in the svg.
    const frame = svg.getElementById('frame');
    // The M frame in the svg.
    const m = svg.getElementById('m-frame');
    if (emphasize) {
      // Fill the frame, change the M shape alpha
      frame.setAttribute('fill-opacity', '1');
      frame.setAttribute('fill', accentColor);
      m.setAttribute('fill', '#fff');
      m.setAttribute('fill-opacity', '.5');
    } else {
      // Hide the frame, make the M opaque.
      frame.setAttribute('fill-opacity', '0');
      m.setAttribute('fill-opacity', '1');
      m.setAttribute('fill', accentColor);
    }
    return serializer.serializeToString(svg);
  };
};

// React to changes to the favicon.
//
// Those changes originate from a change to the favicon
// by Gmail itself (e.g. unread count changed), our
// swap, or something else entirely.
//
// It seems like Gmail replaces the entire link element,
// not just the attributes of the favicon link. This means
// we need to observe mutations of the childList of the <head>.
const observeFaviconChanges = (updater) => {
  const inspector = (mutationList) => {
    for (const mutation of mutationList) {
      if (mutation.type !== 'childList') {
        console.error(
          'Expected only mutations of type childList; got:',
          mutation.type
        );
        break;
      }
      for (const node of mutation.addedNodes) {
        if (node.nodeName === 'LINK' && node.getAttribute('rel') === 'icon') {
          updater();
          break;
        }
      }
    }
  };
  const observer = new MutationObserver(inspector);
  observer.observe(document.head, { childList: true });
};

// Swap the favicon using the template function.
const swapFavicon = (template) => {
  const link = document.head.querySelector('link[rel="icon"]');
  if (!link) {
    // No favicon?! Ok, don't bother.
    return;
  }
  const href = link.getAttribute('href');
  if (href.startsWith('data:')) {
    // It's (probably) our favicon. Leave it alone.
    return;
  }
  // Let's perform our magic!
  const color = AccentColor.calculate(extractOrgName(document.title));
  const unread = parseUnreadCount(href);
  const svg = template(color, unread > 0);
  link.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(svg));
  document.body.style.borderTop = '3px solid ' + color;
};

// Determine the accent color for the favicon.
const AccentColor = {
  // Fixed colors based on the app name.
  fixed: {
    Gmail: '#3799EB',
    Roam: '#FC3B71',
  },
  // Calculate a (stable) color from the app name.
  calculate: function (appName) {
    // Use a fixed color when applicable.
    const fixed = this.fixed[appName];
    if (fixed) {
      return fixed;
    }
    // Calculate a "dynamic" color for Google Mail accounts.
    let hash = 0;
    appName.split('').forEach((char) => {
      hash = char.charCodeAt(0) + ((hash << 5) - hash);
    });
    let colour = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      colour += value.toString(16).padStart(2, '0');
    }
    return colour;
  },
};

// Extracts the org name or "Gmail" from the title of the
// document.
//
// The title in Google Mail is composed of three parts:
// 1. Location (Inbox, Drafts, "Label"...)
// 2. Your email address
// 3. Either "Gmail" or "YouOrg Mail" for Google Workspace.
//
// Examples:
// - "Inbox - youraccount@gmail.com - Gmail"
// - "Inbox (1) - name@yourdomain.com - Your Org Mail"
const extractOrgName = (title) => {
  const parts = title.split(' - ');
  const name = parts.length ? parts[parts.length - 1] : null;
  if (!name || name === 'Gmail') {
    return name;
  }
  const suffix = ' Mail';
  if (name.endsWith(suffix)) {
    return name.substring(0, name.length - suffix.length);
  }
  return name;
};

// Parse the favicon url to get the number of unread messages.
// This requires enabling the advanced Google Mail setting
// "Unread message icon".
const parseUnreadCount = (faviconUrl) => {
  // Example: //ssl.gstatic.com/ui/v1/icons/mail/rfr/unreadcountfavicon/3/1_2x.png
  const regex =
    /(https:)?\/\/ssl.gstatic.com\/ui\/v1\/icons\/mail\/rfr\/unreadcountfavicon\/3\/(\d+)_2x.png/;
  const matches = faviconUrl.match(regex);
  if (matches) {
    return parseInt(matches[2], 10);
  }
  return -1;
};

// Initialize the extension.
const initialize = async () => {
  // Create a template function for the SVG icon.
  const template = await fetch(iconUrl)
    .then((response) => response.text())
    .then((text) => createIconTemplate(text));
  // Create a function to signal an update.
  const updater = () => swapFavicon(template);
  // Observe changes from the <head>.
  observeFaviconChanges(updater);
  // Trigger an initial update.
  updater();
};

// Go!
initialize();
