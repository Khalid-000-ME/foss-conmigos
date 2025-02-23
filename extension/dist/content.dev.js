"use strict";

// Define Flask API endpoints
var FLASK_API_URL = "http://localhost:5000";
USER_ID = "user_conm";
var STORE_CONTEXT_URL = "".concat(FLASK_API_URL, "/store_context/").concat(USER_ID); // Replace with dynamic user ID if needed

var GET_CONTEXT_URL = "".concat(FLASK_API_URL, "/get_context/").concat(USER_ID); // Function to send data to Flask API

function sendDataToAPI(prompt, response) {
  var payload = {
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
  }).then(function (response) {
    return response.json();
  }).then(function (data) {
    return console.log("✅ Data stored successfully:", data);
  })["catch"](function (error) {
    return console.error("❌ Error sending data:", error);
  });
} // Function to extract messages based on AI app


var lastPrompt = "";
var lastResponse = ""; // Function to extract latest prompt and response

function extractMessages(aiApp) {
  var prompt = "";
  var response = "";

  if (aiApp === "chatgpt") {
    var userMessages = document.querySelectorAll('div[data-message-author-role="user"]');
    var assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');

    if (userMessages.length > 0 && assistantMessages.length > 0) {
      prompt = userMessages[userMessages.length - 1].innerText.trim();
      response = assistantMessages[assistantMessages.length - 1].innerText.trim();
    }
  } else if (aiApp === "gemini") {
    var _userMessages = document.querySelectorAll('p.query-text-line.ng-star-inserted');

    var _assistantMessages = document.querySelectorAll('[id^="model-response-message"]');

    if (_userMessages.length > 0 && _assistantMessages.length > 0) {
      prompt = _userMessages[_userMessages.length - 1].innerText.trim();
      response = _assistantMessages[_assistantMessages.length - 1].innerText.trim();
    }
  } // Send data only if new


  if (prompt && response && (prompt !== lastPrompt || response !== lastResponse)) {
    lastPrompt = prompt;
    lastResponse = response;
    console.log("📩 Sending to API:", {
      prompt: prompt,
      response: response
    });
    sendDataToAPI(prompt, response);
  }
} // Function to set up MutationObserver


function setupObserver(aiApp) {
  var chatContainerSelector = aiApp === "chatgpt" ? 'div.flex.h-full.w-full.flex-col' // ChatGPT chat container
  : 'infinite-scroller'; // Gemini chat container (adjust as needed)

  var chatContainer = document.querySelector(chatContainerSelector);

  if (!chatContainer) {
    console.warn("⚠️ Chat container not found!");
    return;
  } // Flag to ignore initial page load mutations


  var isInitialLoad = true;
  setTimeout(function () {
    return isInitialLoad = false;
  }, 5000); // Ignore mutations for the first 5 seconds
  // Debounce function to limit API calls

  function debounce(func, delay) {
    var timeout;
    return function () {
      var _this = this;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      clearTimeout(timeout);
      timeout = setTimeout(function () {
        return func.apply(_this, args);
      }, delay);
    };
  }

  var debouncedExtractMessages = debounce(function () {
    return extractMessages(aiApp);
  }, 1000); // MutationObserver callback

  var observerCallback = function observerCallback(mutationsList) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = mutationsList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var mutation = _step.value;

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
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }; // Start observing document.body


  var observer = new MutationObserver(observerCallback);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  console.log("✅ Observer set up for:", aiApp);
}

function startPolling(aiApp) {
  console.log("\u23F3 Starting polling for ".concat(aiApp));
  setInterval(function () {
    return extractMessages(aiApp);
  }, 2000); // Check every 2 seconds
} // Detect AI application and start observer


function detectAIApplication() {
  console.log("🌍 Detecting AI Application, hostname:", window.location.hostname);

  if (window.location.hostname.includes("chat.openai.com") || window.location.hostname.includes("chatgpt")) {
    console.log("✅ ChatGPT detected!");
    startPolling("chatgpt");
  } else if (window.location.hostname.includes("https://gemini.google.com/app")) {
    console.log("✅ Gemini detected!");
    startPolling("gemini");
  } else {
    console.log("⚠️ No AI application detected.");
  }
}

function insertContextIntoChat(contextText) {
  // Update this selector to match the target chat input element
  var chatInput = document.querySelector('div[id="prompt-textarea"]');

  if (chatInput) {
    chatInput.innerHTML = "<p>".concat(contextText["up_str"], "</p>");
    console.log("String version", chatInput.value);
    chatInput.focus();
    console.log("✅ Context inserted into chat input");
  } else {
    console.warn("⚠️ Chat input not found.");
  }
}

function fetchContext(prompt) {
  var payload, response, data;
  return regeneratorRuntime.async(function fetchContext$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          payload = {
            prompt: prompt
          };
          _context.next = 4;
          return regeneratorRuntime.awrap(fetch(GET_CONTEXT_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          }));

        case 4:
          response = _context.sent;
          _context.next = 7;
          return regeneratorRuntime.awrap(response.json());

        case 7:
          data = _context.sent;
          console.log("🔍 Retrieved context:", data); // Assume the API returns a field called `context` with the fetched text

          return _context.abrupt("return", data || "");

        case 12:
          _context.prev = 12;
          _context.t0 = _context["catch"](0);
          console.error("❌ Error fetching context:", _context.t0);
          return _context.abrupt("return", "");

        case 16:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 12]]);
} // Create and inject a floating button near the chat input field.


function injectFloatingButton() {
  var chatInput = document.querySelector('div[id="prompt-textarea"]');

  if (!chatInput) {
    console.warn("Chat input not found. Retrying in 2 seconds...");
    setTimeout(injectFloatingButton, 2000);
    return;
  } // Get bounding rectangle of the text area


  var rect = chatInput.getBoundingClientRect();
  var floatBtn = document.createElement("button");
  floatBtn.innerText = "⚙️ Context";
  floatBtn.style.position = "absolute";
  floatBtn.style.zIndex = "9999";
  floatBtn.style.padding = "5px 10px";
  floatBtn.style.cursor = "pointer"; // Position the button above or to the side of the text area
  // Adjust these values as needed

  floatBtn.style.top = rect.top - 40 + window.scrollY + "px";
  floatBtn.style.left = rect.left + window.scrollX + "px";
  document.body.appendChild(floatBtn);
  floatBtn.addEventListener("click", showContextPopup);
} // Function to display the popup form near the text area


function showContextPopup() {
  // Remove any existing popup
  var oldPopup = document.getElementById("context-popup");
  if (oldPopup) oldPopup.remove();
  var chatInput = document.querySelector('div[id="prompt-textarea"]');

  if (!chatInput) {
    console.warn("Chat input not found.");
    return;
  } // Get bounding rectangle of the text area


  var rect = chatInput.getBoundingClientRect(); // Create the popup container

  var popup = document.createElement("div");
  popup.id = "context-popup";
  popup.style.position = "absolute";
  popup.style.zIndex = "10000";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ccc";
  popup.style.borderRadius = "5px";
  popup.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
  popup.style.padding = "10px";
  popup.style.width = "300px";
  popup.style.fontFamily = "Arial, sans-serif"; // Position the popup near the text area (adjust top/left as needed)

  popup.style.top = rect.top - 160 + window.scrollY + "px"; // 160px above text area

  popup.style.left = rect.left + window.scrollX + "px"; // Popup content: settings and a prompt field to fetch context.

  popup.innerHTML = "\n    <div style=\"color: black;\">\n      <h3 style=\"margin-top: 500;margin-left: 500;\">Fetch Context</h3>\n      <label for=\"custom-prompt\">Enter a prompt:</label><br/>\n      <textarea id=\"custom-prompt\" rows=\"3\" style=\"width: 100%;\">Provide a summary of recent conversation</textarea>\n      <br/><br/>\n      <button id=\"finish-btn\" style=\"padding: 5px 10px;\">Finish</button>\n      <button id=\"cancel-btn\" style=\"padding: 5px 10px; margin-left: 5px;\">Cancel</button>\n    </div>\n      ";
  document.body.appendChild(popup); // When "Finish" is clicked, fetch context and insert it

  document.getElementById("finish-btn").addEventListener("click", function _callee() {
    var customPrompt, fetchedContext;
    return regeneratorRuntime.async(function _callee$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            customPrompt = document.getElementById("custom-prompt").value;
            console.log("Custom prompt:", customPrompt);
            _context2.next = 4;
            return regeneratorRuntime.awrap(fetchContext(customPrompt));

          case 4:
            fetchedContext = _context2.sent;

            if (fetchedContext) {
              insertContextIntoChat(fetchedContext);
            } else {
              console.warn("No context fetched.");
            }

            popup.remove();

          case 7:
          case "end":
            return _context2.stop();
        }
      }
    });
  }); // Cancel button simply removes the popup.

  document.getElementById("cancel-btn").addEventListener("click", function () {
    popup.remove();
  });
} // Initialize the injection after the page loads


function initializePopupFeature() {
  injectFloatingButton();
} // Call this function when the extension is enabled


chrome.storage.local.get("enabled", function (data) {
  if (data.enabled) {
    initializePopupFeature();
  }
}); // Optionally, also listen for toggle messages to reinitialize or remove the popup feature.

chrome.runtime.onMessage.addListener(function (message) {
  if (message.action === "toggle") {
    if (message.enabled) {
      initializePopupFeature();
    } else {
      var btn = document.querySelector("button#context-popup");
      if (btn) btn.remove();
    }
  }
}); // Start the script

chrome.storage.local.get("enabled", function (data) {
  if (data.enabled) {
    detectAIApplication();
  }
});
chrome.runtime.onMessage.addListener(function (message) {
  if (message.action === "toggle") {
    if (message.enabled) {
      detectAIApplication();
    } else {
      location.reload(); // Disable by reloading the page
    }
  }
});