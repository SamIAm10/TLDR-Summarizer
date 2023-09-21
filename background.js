const apiKey = "API_KEY"; // Needs to be a valid OpenAI API key

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "summarizeText",
        title: "Summarize",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "summarizeText") {
        const selectedText = info.selectionText;
        const tabId = tab.id;
        // Make a request to the ChatGPT API to summarize the selected text
        summarizeText(selectedText, tabId);
    }
});

// Function to send a request to the ChatGPT API for summarization
async function summarizeText(text, tabId) {
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            prompt: `Summarize the following text:\n${text}`,
            model: "gpt-3.5-turbo",
            max_tokens: 50 // Determines the summary length
        })
    });

    const data = await response.json();
    console.log(data); // For debugging

    let summary;
    if (data.error) {
        summary = `ChatGPT Error: ${data.error.message}`;
    }
    else {
        summary = data.choices[0].text.trim();
    }

    // Inject custom CSS into the active tab
    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ["style.css"],
    });

    // Execute function to display the summary in the active tab
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: showSummaryModal,
        args: [summary]
    });
}

// Function to display the summary in a dismissible modal
function showSummaryModal(summary) {
    // Create a container for the popup
    const popupContainer = document.createElement("div");
    popupContainer.className = "summary-popup-container";
    popupContainer.innerHTML = `
    <div class="summary-popup">
		<h2>Here's the TLDR:</h2>
		<a class="close" href="#">&times;</a>
		<div class="content">
            ${summary}
        </div>
    </div>
    `;

    // Add the popup container to the page
    document.body.appendChild(popupContainer);

    // Add a click event listener to close the popup
    const closeButton = popupContainer.querySelector(".close");
    closeButton.addEventListener("click", () => {
        // Remove the popup from the page
        popupContainer.remove();
    });
}