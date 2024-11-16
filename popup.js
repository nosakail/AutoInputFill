console.log('Popup script loaded');

// Fonction pour ajouter une nouvelle règle
function addRule(inputName, inputValue) {
    console.log('addRule called with:', inputName, inputValue);
    chrome.storage.sync.get('rules', function(data) {
        let rules = data.rules || [];
        rules.push({
            selector: inputName,
            value: inputValue
        });
        
        chrome.storage.sync.set({ rules: rules }, function() {
            console.log('Rule added!');
            displayRules();
        });
    });
}

// Fonction pour supprimer une règle
function deleteRule(index) {
    chrome.storage.sync.get('rules', function(data) {
        let rules = data.rules || [];
        rules.splice(index, 1);
        
        chrome.storage.sync.set({ rules: rules }, function() {
            console.log('Rule deleted!');
            displayRules();
        });
    });
}

// Fonction pour afficher toutes les règles
function displayRules() {
    console.log('Displaying rules...');
    chrome.storage.sync.get('rules', function(data) {
        let rules = data.rules || [];
        let rulesContainer = document.getElementById('rules-list');
        rulesContainer.innerHTML = '';

        rules.forEach((rule, index) => {
            let ruleElement = document.createElement('div');
            ruleElement.className = 'rule-item';
            
            // Créer les éléments individuellement au lieu d'utiliser innerHTML
            let span = document.createElement('span');
            span.textContent = `${rule.selector} : ${rule.value}`;
            
            let button = document.createElement('button');
            button.textContent = 'Delete';
            button.addEventListener('click', () => deleteRule(index));
            
            ruleElement.appendChild(span);
            ruleElement.appendChild(button);
            rulesContainer.appendChild(ruleElement);
        });
    });
}

// Fonction pour appliquer les règles
function applyRules() {
    console.log('Applying rules...');
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        if (!currentTab?.id) {
            console.log('No active tab found');
            return;
        }

        console.log('Sending message to tab:', currentTab.url);
        
        // Vérifie d'abord si le content script est chargé
        chrome.tabs.sendMessage(currentTab.id, {action: "ping"})
            .then(response => {
                // Si on reçoit une réponse, on peut envoyer les règles
                return chrome.tabs.sendMessage(currentTab.id, {action: "fillForms"});
            })
            .then(response => {
                console.log('Rules applied successfully:', response);
            })
            .catch(error => {
                console.log('Error:', error);
                // Si erreur, on recharge la page
                chrome.tabs.reload(currentTab.id);
            });
    });
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    displayRules();

    document.getElementById('addButton').addEventListener('click', function() {
        let name = document.getElementById('inputName').value;
        let value = document.getElementById('inputValue').value;
        if (name && value) {
            addRule(name, value);
            document.getElementById('inputName').value = '';
            document.getElementById('inputValue').value = '';
        }
    });

    // Ajoute l'écouteur pour le bouton Apply
    document.getElementById('applyButton').addEventListener('click', applyRules);
}); 