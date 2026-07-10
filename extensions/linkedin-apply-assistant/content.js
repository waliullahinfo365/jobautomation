(function () {
  if (!location.href.includes("/jobs/")) return;

  const bar = document.createElement("div");
  bar.id = "njg-apply-bar";
  bar.style.cssText =
    "position:fixed;bottom:16px;right:16px;z-index:99999;background:#4D63E0;color:#fff;padding:10px 14px;border-radius:12px;font:600 13px system-ui;box-shadow:0 4px 20px rgba(0,0,0,.25);cursor:pointer;";

  chrome.storage.sync.get(["appUrl"], (data) => {
    const appUrl = (data.appUrl || "https://www.newjob.guru").replace(/\/$/, "");
    bar.textContent = "Open in NewJob Guru";
    bar.addEventListener("click", () => {
      window.open(`${appUrl}/apply-assistant`, "_blank");
    });
    document.body.appendChild(bar);
  });
})();
