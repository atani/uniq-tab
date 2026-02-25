const DEFAULT_SETTINGS = {
  dedup: true,
  matchMode: "exact",
  githubSplit: true,
  githubSplitDiff: false,
};

const dedupEl = document.getElementById("dedup");
const matchModeEl = document.getElementById("matchMode");
const githubSplitEl = document.getElementById("githubSplit");
const githubSplitDiffEl = document.getElementById("githubSplitDiff");
const splitDiffSettingEl = document.getElementById("splitDiffSetting");

function updateSplitDiffVisibility() {
  splitDiffSettingEl.classList.toggle("hidden", !githubSplitEl.checked);
}

// Load settings
chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
  dedupEl.checked = settings.dedup;
  matchModeEl.value = settings.matchMode;
  githubSplitEl.checked = settings.githubSplit;
  githubSplitDiffEl.checked = settings.githubSplitDiff;
  updateSplitDiffVisibility();
});

// Save on change
dedupEl.addEventListener("change", () => {
  chrome.storage.local.set({ dedup: dedupEl.checked });
});

matchModeEl.addEventListener("change", () => {
  chrome.storage.local.set({ matchMode: matchModeEl.value });
});

githubSplitEl.addEventListener("change", () => {
  chrome.storage.local.set({ githubSplit: githubSplitEl.checked });
  updateSplitDiffVisibility();
});

githubSplitDiffEl.addEventListener("change", () => {
  chrome.storage.local.set({ githubSplitDiff: githubSplitDiffEl.checked });
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
