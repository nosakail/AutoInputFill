// Ajoute un identifiant unique pour confirmer que le script est chargé
window.autoFormFillerLoaded = true;

console.log('Content script starting...', window.location.href);

// Écoute les messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received in content script:', message);
    
    if (message.action === "fillForms") {
        // Remplir les champs automatiquement
        chrome.storage.sync.get('rules', function(data) {
            let rules = data.rules || [];
            console.log('Applying rules:', rules);
            
            rules.forEach(rule => {
                let inputs = document.querySelectorAll(rule.selector);
                console.log(`Found ${inputs.length} inputs for selector:`, rule.selector);
                
                inputs.forEach(input => {
                    input.value = rule.value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
            });
            
            sendResponse({status: 'success', rulesApplied: rules.length});
        });
        return true;  // Important pour le sendResponse asynchrone
    }
    if (message.action === "ping") {
        sendResponse({status: 'alive'});
        return;
    }
});

console.log('Content script loaded and listening for messages'); 