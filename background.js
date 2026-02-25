// ===== Settings =====

const DEFAULT_SETTINGS = {
  dedup: true,
  githubSplit: true,
  githubHosts: ["github.com"],
};

async function getSettings() {
  const stored = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return stored;
}

// ===== URL Utilities =====

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

function isInternalUrl(url) {
  return (
    !url ||
    url === "chrome://newtab/" ||
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("about:")
  );
}

// ===== Duplicate Tab Prevention =====

async function handleDuplicateTab(tabId, url) {
  const settings = await getSettings();
  if (!settings.dedup) return;
  if (isInternalUrl(url)) return;

  const normalized = normalizeUrl(url);
  const allTabs = await chrome.tabs.query({});
  const existing = allTabs.find(
    (t) => t.id !== tabId && normalizeUrl(t.url) === normalized
  );

  if (existing) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
    await chrome.tabs.remove(tabId);
    return true;
  }
  return false;
}

// ===== GitHub PR Auto-Split =====

// Track tab IDs that were auto-opened to prevent re-triggering
const autoOpenedTabs = new Set();
// Track PRs that have already been split to prevent re-triggering on SPA navigation
const splitPRs = new Set();

function parseGitHubPRUrl(url, hosts) {
  try {
    const u = new URL(url);
    if (!hosts.includes(u.hostname)) return null;

    // Match: /owner/repo/pull/123 (exact, no sub-path)
    const match = u.pathname.match(
      /^\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/
    );
    if (!match) return null;

    return {
      host: u.origin,
      owner: match[1],
      repo: match[2],
      number: match[3],
      filesUrl: `${u.origin}/${match[1]}/${match[2]}/pull/${match[3]}/files`,
    };
  } catch {
    return null;
  }
}

async function handleGitHubPRSplit(tabId, url, tab) {
  const settings = await getSettings();
  if (!settings.githubSplit) return;
  if (autoOpenedTabs.has(tabId)) {
    autoOpenedTabs.delete(tabId);
    return;
  }

  const pr = parseGitHubPRUrl(url, settings.githubHosts);
  if (!pr) return;

  // Prevent re-splitting the same PR on SPA navigation / reload
  const prKey = `${pr.host}/${pr.owner}/${pr.repo}/pull/${pr.number}`;
  if (splitPRs.has(prKey)) return;

  // Check if files tab is already open
  const allTabs = await chrome.tabs.query({});
  const filesNormalized = normalizeUrl(pr.filesUrl);
  const alreadyOpen = allTabs.some(
    (t) => normalizeUrl(t.url) === filesNormalized
  );
  if (alreadyOpen) return;

  // Open files tab next to the current tab (inactive)
  const newTab = await chrome.tabs.create({
    url: pr.filesUrl,
    index: tab.index + 1,
    active: false,
  });

  autoOpenedTabs.add(newTab.id);
  splitPRs.add(prKey);

  // Clean up splitPRs entry after 5 seconds (allow re-split if user re-opens later)
  setTimeout(() => splitPRs.delete(prKey), 5000);
}

// ===== Event Listeners =====

// Track recently created tabs for smarter dedup
const recentTabs = new Map();

chrome.tabs.onCreated.addListener((tab) => {
  recentTabs.set(tab.id, Date.now());
});

chrome.tabs.onRemoved.addListener((tabId) => {
  recentTabs.delete(tabId);
  autoOpenedTabs.delete(tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;

  const url = changeInfo.url;

  // Only deduplicate tabs that were recently created (within 10s)
  // This avoids closing tabs when a user navigates within an existing tab
  const createdAt = recentTabs.get(tabId);
  const isNewTab = createdAt && Date.now() - createdAt < 10000;

  if (isNewTab) {
    const wasClosed = await handleDuplicateTab(tabId, url);
    if (wasClosed) return;
  }

  // GitHub PR auto-split
  await handleGitHubPRSplit(tabId, url, tab);
});
