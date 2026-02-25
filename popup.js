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

// Deduplicate all existing tabs
const dedupAllBtn = document.getElementById("dedupAll");
const dedupResultEl = document.getElementById("dedupResult");

dedupAllBtn.addEventListener("click", () => {
  dedupAllBtn.disabled = true;
  dedupResultEl.textContent = "スキャン中...";

  chrome.runtime.sendMessage({ action: "deduplicateAll" }, (result) => {
    dedupAllBtn.disabled = false;
    if (result && result.closed > 0) {
      dedupResultEl.textContent = `${result.closed}件の重複タブを閉じました`;
    } else {
      dedupResultEl.textContent = "重複タブはありません";
    }
    setTimeout(() => { dedupResultEl.textContent = ""; }, 3000);
  });
});

// Open options page
document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
