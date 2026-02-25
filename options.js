const DEFAULT_HOSTS = ["github.com"];

const hostListEl = document.getElementById("hostList");
const addHostBtn = document.getElementById("addHost");
const savedMsg = document.getElementById("savedMsg");

let saveTimer;

function createHostItem(value) {
  const li = document.createElement("li");
  li.className = "host-item";

  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.placeholder = "例: git.example.com";
  input.addEventListener("input", saveHosts);

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn btn-remove";
  removeBtn.textContent = "\u00d7";
  removeBtn.addEventListener("click", () => {
    li.remove();
    saveHosts();
  });

  li.appendChild(input);
  li.appendChild(removeBtn);
  return li;
}

function saveHosts() {
  const inputs = hostListEl.querySelectorAll("input[type='text']");
  const hosts = Array.from(inputs)
    .map((el) => el.value.trim())
    .filter(Boolean);
  chrome.storage.local.set({ githubHosts: hosts });

  // Show saved indicator
  clearTimeout(saveTimer);
  savedMsg.classList.add("show");
  saveTimer = setTimeout(() => savedMsg.classList.remove("show"), 1500);
}

// Load
chrome.storage.local.get({ githubHosts: DEFAULT_HOSTS }, (settings) => {
  for (const host of settings.githubHosts) {
    hostListEl.appendChild(createHostItem(host));
  }
});

// Add host
addHostBtn.addEventListener("click", () => {
  const item = createHostItem("");
  hostListEl.appendChild(item);
  item.querySelector("input").focus();
});
