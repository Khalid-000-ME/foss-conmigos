// Define Flask API endpoints
const FLASK_API_URL = "http://127.0.0.1:5000";
USER_ID="user_conm"
const STORE_CONTEXT_URL = `${FLASK_API_URL}/store_context/${USER_ID}`; // Replace with dynamic user ID if needed
const GET_CONTEXT_URL = `${FLASK_API_URL}/get_context/${USER_ID}`

// Function to send data to Flask API
function sendDataToAPI(prompt, response) {
    const payload = {
        prompt: prompt,
        response: response
    };
    console.log("📡 Sending data:", payload);

    fetch(STORE_CONTEXT_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => console.log("✅ Data stored successfully:", data))
    .catch(error => console.error("❌ Error sending data:", error));
}

// Function to extract messages based on AI app
let lastPrompt = "";
let lastResponse = "";

// Function to extract latest prompt and response
function extractMessages(aiApp) {
    let prompt = "";
    let response = "";

    if (aiApp === "chatgpt") {
        const userMessages = document.querySelectorAll('div[data-message-author-role="user"]');
        const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');

        if (userMessages.length > 0 && assistantMessages.length > 0) {
            prompt = userMessages[userMessages.length - 1].innerText.trim();
            response = assistantMessages[assistantMessages.length - 1].innerText.trim();
        }
    } 
    else if (aiApp === "gemini") {
        const userMessages = document.querySelectorAll('p.query-text-line.ng-star-inserted');
        const assistantMessages = document.querySelectorAll('[id^="model-response-message"]');

        if (userMessages.length > 0 && assistantMessages.length > 0) {
            prompt = userMessages[userMessages.length - 1].innerText.trim();
            response = assistantMessages[assistantMessages.length - 1].innerText.trim();
        }
    }

    // Send data only if new
    if (prompt && response && (prompt !== lastPrompt || response !== lastResponse)) {
        lastPrompt = prompt;
        lastResponse = response;
        console.log("📩 Sending to API:", { prompt, response });
        sendDataToAPI(prompt, response);
    }
}

// Function to set up MutationObserver
function setupObserver(aiApp) {
    const chatContainerSelector = aiApp === "chatgpt"
        ? 'div.flex.h-full.w-full.flex-col' // ChatGPT chat container
        : 'infinite-scroller'; // Gemini chat container (adjust as needed)

    let chatContainer = document.querySelector(chatContainerSelector);
    if (!chatContainer) {
        console.warn("⚠️ Chat container not found!");
        return;
    }

    // Flag to ignore initial page load mutations
    let isInitialLoad = true;
    setTimeout(() => isInitialLoad = false, 5000); // Ignore mutations for the first 5 seconds

    // Debounce function to limit API calls
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    const debouncedExtractMessages = debounce(() => extractMessages(aiApp), 1000);

    // MutationObserver callback
    const observerCallback = (mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if the mutation occurred within the chat container
                if (chatContainer.contains(mutation.target)) {
                    if (!isInitialLoad) {
                        console.log("🔄 Mutation detected in chat container");
                        debouncedExtractMessages();
                    }
                }
            }
        }
    };

    // Start observing document.body
    const observer = new MutationObserver(observerCallback);
    observer.observe(document.body, { childList: true, subtree: true });
    console.log("✅ Observer set up for:", aiApp);
}

function startPolling(aiApp) {
    console.log(`⏳ Starting polling for ${aiApp}`);
    setInterval(() => extractMessages(aiApp), 2000); // Check every 2 seconds
}

// Detect AI application and start observer
function detectAIApplication() {
    console.log("🌍 Detecting AI Application, hostname:", window.location.hostname);

    if (window.location.hostname.includes("chat.openai.com") || window.location.hostname.includes("chatgpt")) {
        console.log("✅ ChatGPT detected!");
        initializePopupFeature("chatgpt")
        startPolling("chatgpt");
    } else if (window.location.hostname.includes("gemini")) {
        console.log("✅ Gemini detected!");
        initializePopupFeature("gemini")
        startPolling("gemini");
    } else {
        console.log("⚠️ No AI application detected.");
    }
}

function insertContextIntoChat(aiApp, contextText) {
    // Update this selector to match the target chat input element
    const chatInput = (aiApp === "chatgpt") ? document.querySelector('div[id="prompt-textarea"]'): document.querySelector('.ql-editor.textarea.new-input-ui');
    if (chatInput) {
        chatInput.innerHTML = `<p>${contextText["up_str"]}</p>`;
        console.log("String version", chatInput.value)
        chatInput.focus();
        console.log("✅ Context inserted into chat input");
    } else {
        console.warn("⚠️ Chat input not found.");
    }
}

async function fetchContext(prompt) {
    try {
        const payload = { prompt: prompt };
        const response = await fetch(GET_CONTEXT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log("🔍 Retrieved context:", data);
        // Assume the API returns a field called `context` with the fetched text
        return data || "";
    } catch (error) {
        console.error("❌ Error fetching context:", error);
        return "";
    }
}

// Create and inject a floating button near the chat input field.
function injectFloatingButton(aiApp) {
    const chatInput = (aiApp === "chatgpt") ? document.querySelector('div[id="prompt-textarea"]'): document.querySelector('.ql-editor.textarea.new-input-ui');
    if (!chatInput) {
        console.warn("Chat input not found. Retrying in 2 seconds...");
        setTimeout(() => injectFloatingButton(aiApp), 2000);
        return;
    }

    // Get bounding rectangle of the text area
    const rect = chatInput.getBoundingClientRect();
    const floatBtn = document.createElement("button");
    floatBtn.innerText = "⚙️ Context";
    floatBtn.style.position = "absolute";
    floatBtn.style.zIndex = "9999";
    floatBtn.style.padding = "5px 10px";
    floatBtn.style.cursor = "pointer";

    // Position the button above or to the side of the text area
    // Adjust these values as needed
    floatBtn.style.top = (rect.top - 40 + window.scrollY) + "px";
    floatBtn.style.left = (rect.left + window.scrollX) + "px";

    document.body.appendChild(floatBtn);

    floatBtn.addEventListener("click", () => showContextPopup(aiApp));
}

// Function to display the popup form near the text area
function showContextPopup(aiApp) {
    // Remove any existing popup
    const oldPopup = document.getElementById("context-popup");
    if (oldPopup) oldPopup.remove();

    const chatInput = (aiApp === "chatgpt") ? document.querySelector('div[id="prompt-textarea"]'): document.querySelector('.ql-editor.textarea.new-input-ui');
    if (!chatInput) {
        console.warn("Chat input not found.");
        return;
    }

    // Get bounding rectangle of the text area
    const rect = chatInput.getBoundingClientRect();

    // Create the popup container
    const popup = document.createElement("div");
    popup.id = "context-popup";
    popup.style.position = "absolute";
    popup.style.zIndex = "10000";
    popup.style.background = "#fff";
    popup.style.border = "1px solid #ccc";
    popup.style.borderRadius = "5px";
    popup.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
    popup.style.padding = "10px";
    popup.style.width = "300px";
    popup.style.fontFamily = "Arial, sans-serif";

    // Position the popup near the text area (adjust top/left as needed)
    popup.style.top = (rect.top - 160 + window.scrollY) + "px"; // 160px above text area
    popup.style.left = (rect.left + window.scrollX) + "px";

    // Popup content: settings and a prompt field to fetch context.
    popup.innerHTML = `
    <div style="color: black;">
      <h3 style="margin-top: 500;margin-left: 500;">Fetch Context</h3>
      <label for="custom-prompt">Enter a prompt:</label><br/>
      <textarea id="custom-prompt" rows="3" style="width: 100%;">Provide a summary of recent conversation</textarea>
      <br/><br/>
      <button id="finish-btn" style="padding: 5px 10px;">Finish</button>
      <button id="cancel-btn" style="padding: 5px 10px; margin-left: 5px;">Cancel</button>
    </div>
      `;

    document.body.appendChild(popup);

    // When "Finish" is clicked, fetch context and insert it
    document.getElementById("finish-btn").addEventListener("click", async () => {
        const customPrompt = document.getElementById("custom-prompt").value;
        console.log("Custom prompt:", customPrompt);
        const fetchedContext = await fetchContext(customPrompt);
        if (fetchedContext) {
            insertContextIntoChat(aiApp, fetchedContext);
        } else {
            console.warn("No context fetched.");
        }
        popup.remove();
    });

    // Cancel button simply removes the popup.
    document.getElementById("cancel-btn").addEventListener("click", () => {
        popup.remove();
    });
}
  
  // Initialize the injection after the page loads
  function initializePopupFeature(aiApp) {
    injectFloatingButton(aiApp);
  }
  
  // Call this function when the extension is enabled
 /* chrome.storage.local.get("enabled", (data) => {
    if (data.enabled) {

      initializePopupFeature();
    }
  }); */
  
  // Optionally, also listen for toggle messages to reinitialize or remove the popup feature.
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggle") {
      if (message.enabled && data.enabled) {
        detectAIApplication();
      } else {
        location.reload();
        const btn = document.querySelector("button#context-popup");
        if (btn) btn.remove();
      }
    }
  });
  

// Start the script

chrome.storage.local.get("enabled", (data) => {
    if (data.enabled) {
        detectAIApplication();
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggle") {
        if (message.enabled) {
            detectAIApplication();
        } else {
            location.reload(); // Disable by reloading the page
        }
    }
});