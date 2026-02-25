const DEFAULT_SETTINGS = {
  dedup: true,
  githubSplit: true,
};

const dedupEl = document.getElementById("dedup");
const githubSplitEl = document.getElementById("githubSplit");

// Load settings
chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
  dedupEl.checked = settings.dedup;
  githubSplitEl.checked = settings.githubSplit;
});

// Save on change
dedupEl.addEventListener("change", () => {
  chrome.storage.local.set({ dedup: dedupEl.checked });
});

githubSplitEl.addEventListener("change", () => {
  chrome.storage.local.set({ githubSplit: githubSplitEl.checked });
});

// Open options page
document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
