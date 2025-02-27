import { createClockifyButton } from "../helpers/button";

function getShortcutStoryDetails() {
    const storyTitleElement = document.querySelector("[data-test='story-name']");
    const storyTitle = storyTitleElement ? storyTitleElement.innerText.trim() : "Unknown Story";

    // Extract story ID from the URL
    const urlMatch = window.location.href.match(/stories\/(\d+)/);
    const storyId = urlMatch ? urlMatch[1] : null;

    if (!storyId) return null;

    return {
        id: storyId,
        title: storyTitle
    };
}

function addClockifyButton() {
    const toolbar = document.querySelector("[data-test='story-detail-actions']");
    if (!toolbar) return;

    const storyData = getShortcutStoryDetails();
    if (!storyData) return;

    console.log("Clockify Shortcut integration detected story:", storyData);

    const description = `#${storyData.id} - ${storyData.title}`;

    // Create the Clockify button
    const clockifyButton = createClockifyButton({
        description,
        projectName: "Shortcut", // Can be changed based on user's preference
    });

    // Prevent duplicate button insertion
    if (toolbar.querySelector(".clockify-button")) return;

    // Insert the Clockify button into the Shortcut UI
    toolbar.appendChild(clockifyButton);
}

// Run the integration when the page loads
setTimeout(() => {
    addClockifyButton();
}, 1000);
