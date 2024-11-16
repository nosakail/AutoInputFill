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
            
            // Log tous les inputs de la page pour debug
            console.log('All inputs on page:', document.querySelectorAll('input'));
            
            rules.forEach(rule => {
                let inputs = document.querySelectorAll(rule.selector);
                console.log(`Trying selector "${rule.selector}":`, inputs);
                
                if (inputs.length === 0) {
                    // Si aucun input trouvé, essayons de comprendre pourquoi
                    console.log('Available input elements and their attributes:');
                    document.querySelectorAll('input').forEach(input => {
                        console.log('Input:', {
                            id: input.id,
                            name: input.name,
                            type: input.type,
                            class: input.className,
                            placeholder: input.placeholder
                        });
                    });
                }
                
                inputs.forEach(input => {
                    console.log(`Setting value "${rule.value}" for input:`, input);
                    input.value = rule.value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
            });
            
            sendResponse({status: 'success', rulesApplied: rules.length});
        });
        return true;
    }
    if (message.action === "ping") {
        sendResponse({status: 'alive'});
        return;
    }
});

console.log('Content script loaded and listening for messages'); 