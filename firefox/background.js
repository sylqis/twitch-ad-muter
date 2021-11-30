console.log("Loading Twitch Ad Muter...");

// Set default settings
browser.storage.local.set({
    on: true
});

browser.webRequest.onBeforeRequest.addListener(
    function (details) {
        var tabID = details.tabId;
        if (tabID < 0)
            return { cancel: false }; // Request isn't related to a tab, ignore

        return Promise.all([browser.storage.local.get('on'), browser.tabs.get(tabID)]) // Get on/off state of this extension and get the tab that made this request
        .then(([result, tab]) => {
            // Checks if the extension is on, and if the tab's already muted by anything but this extension (e.g. the user)
            // (used to prevent this extension from incorrectly unmuting tabs that the user themselves muted)
            if (!result.on || (('mutedInfo' in tab && tab.mutedInfo.muted) &&
                               (('extensionId' in tab.mutedInfo && tab.mutedInfo.extensionId != browser.runtime.id) ||
                                ('reason' in tab.mutedInfo && tab.mutedInfo.reason == "user"))))
                return; // Return early; let request go through
            
            if ('requestBody' in details && details.requestBody && 'raw' in details.requestBody) { // Prevents a bunch of null/undefined errors
                // Parse request body
                var formData = JSON.parse(new TextDecoder().decode(details.requestBody.raw[0].bytes));
                if (!Array.isArray(formData)) // formData is sometimes a list, but we want it to always be one
                    formData = [formData];
    
                formData.forEach(function (request) { // Iterate through array of JSON GraphQL requests
                    if ('operationName' in request && request.operationName == "ClientSideAdEventHandling_RecordAdEvent") {
                        if (request.variables.input.eventName == "video_ad_impression") {  // Ad started
                            return browser.tabs.update(tabID, { muted: true });
                        }
                        else if (request.variables.input.eventName == "video_ad_pod_complete" ||
                            request.variables.input.eventName == "video_ad_error") { // Ad ended 
                            return browser.tabs.update(tabID, { muted: false });
                        }
                    }
                });
            }
        })
        .catch(error => {
            console.error("Twitch Ad Muter | Error: "+ error);
        })
        .then(() => {
            return { cancel: false }; // Always allow the request to go through
        });
    },

    { urls: ["*://*.twitch.tv/*"] },

    ["blocking", "requestBody"]
);

console.log("Loaded Twitch Ad Muter.");