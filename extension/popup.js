document.addEventListener("DOMContentLoaded", function () {
    const toggleBtn = document.getElementById("toggle-btn");

    // Load current state
    chrome.storage.local.get("enabled", (data) => {
        let enabled = data.enabled ?? false;
        updateButton(enabled);
    });

    toggleBtn.addEventListener("click", () => {
        chrome.storage.local.get("enabled", (data) => {
            let enabled = !data.enabled;  // Toggle state
            chrome.storage.local.set({ enabled: enabled }, () => {
                updateButton(enabled);
                chrome.runtime.sendMessage({ action: "toggle", enabled: enabled });
            });
        });
    });

    function updateButton(enabled) {
        toggleBtn.textContent = enabled ? "Disable" : "Enable";
    }
});
