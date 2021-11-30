"use strict";

function setImage(on){
    if (on)
        document.querySelector('#image').src='extension_on.png'
    else
        document.querySelector('#image').src='extension_off.gif'
}

// When the popup window finishes loading, make it reflect the user's saved settings
document.addEventListener('DOMContentLoaded', function() {
    browser.storage.local.get('on').then((result) => {
        document.querySelector("input[name='onOff']").checked = result.on;
        setImage(result.on);
    });

    // On/off switch functionality
    var onOff = document.querySelector("input[name='onOff']");
    onOff.addEventListener('change', function() {
        browser.storage.local.set({
            on: this.checked // On/off switch sets a persistent variable in storage
        });
        setImage(this.checked); // Image depends on the on/off state of the extension
    }); 
});