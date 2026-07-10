const DEFAULT_APP = "https://www.newjob.guru";

document.getElementById("open").addEventListener("click", () => {
  const appUrl = document.getElementById("appUrl").value.trim() || DEFAULT_APP;
  chrome.storage.sync.set({ appUrl });
  chrome.tabs.create({ url: `${appUrl.replace(/\/$/, "")}/apply-assistant` });
});

chrome.storage.sync.get(["appUrl"], (data) => {
  document.getElementById("appUrl").value = data.appUrl || DEFAULT_APP;
});
