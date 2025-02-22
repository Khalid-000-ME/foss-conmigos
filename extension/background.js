chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggle") {
        const iconPath = message.enabled ? "icon_on.png" : "icon_off.png";
        chrome.action.setIcon({ path: iconPath });
    }
});