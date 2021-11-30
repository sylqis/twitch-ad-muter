console.log("Loading Twitch Ad Muter...");

chrome.webRequest.onBeforeRequest.addListener(
    function (details) {

        if ('requestBody' in details && details.requestBody && 'raw' in details.requestBody) { // Prevents a bunch of null/undefined errors
            var tabID = details.tabId;
            var formData = JSON.parse(new TextDecoder().decode(details.requestBody.raw[0].bytes));

            if (!Array.isArray(formData)) // formData is sometimes a list, but we want it to always be one
                formData = [formData];

            formData.forEach(function (request) { // Iterate through array of JSON GraphQL requests
                if ('operationName' in request && request.operationName == "ClientSideAdEventHandling_RecordAdEvent") {

                    // Get tab info and check if the tab's already muted by anything but this extension (e.g. the user)
                    // (used to prevent this extension from incorrectly unmuting tabs that the user themselves muted)
                    chrome.tabs.get(tabID, function (tab) {
                        if (('mutedInfo' in tab && tab.mutedInfo.muted) &&
                            (('extensionId' in tab.mutedInfo && tab.mutedInfo.extensionId != chrome.runtime.id) ||
                            ('reason' in tab.mutedInfo && tab.mutedInfo.reason == "user"))) {
                            console.log("Tab " + tabID + " already muted by something else -- ignore");
                        }
                        else if (request.variables.input.eventName == "video_ad_impression") {  // Ad started
                            chrome.tabs.update(tabID, { muted: true }, function (tab) {
                                console.log("Muted tab " + tabID);
                            });
                        }
                        else if (request.variables.input.eventName == "video_ad_pod_complete" ||
                            request.variables.input.eventName == "video_ad_error") { // Ad ended 
                            chrome.tabs.update(tabID, { muted: false }, function (tab) {
                                console.log("Unmuted tab " + tabID);
                            });
                        }

                    });
                }
            });

        }

        return { cancel: false }; // Always allow the request to go through
    },

    { urls: ["*://*.twitch.tv/*"] },

    ["blocking", "requestBody"]
);

console.log("Loaded");