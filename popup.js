console.log('Popup script loaded');

// Fonction pour formater le sélecteur
function formatSelector(inputName) {
    // Retire les caractères spéciaux
    const cleanName = inputName.replace(/[\[\]"#.]/g, '');
    
    // Si c'est déjà un sélecteur complet, on le garde
    if (inputName.includes('[') || inputName.includes('#') || inputName.includes('.')) {
        return inputName;
    }
    
    // Crée un tableau de sélecteurs possibles
    return `input[name="${cleanName}"], #${cleanName}, input[id="${cleanName}"]`;
}

// Fonction pour simplifier l'affichage du sélecteur
function simplifySelector(selector) {
    // Cherche un pattern comme input[name="xyz"]
    const nameMatch = selector.match(/input\[name="([^"]+)"\]/);
    if (nameMatch) {
        return nameMatch[1]; // Retourne juste la partie entre guillemets
    }
    
    // Si c'est un ID (#xyz)
    const idMatch = selector.match(/#([^,\s]+)/);
    if (idMatch) {
        return idMatch[1];
    }
    
    // Si on ne trouve pas de pattern connu, retourne le sélecteur tel quel
    return selector;
}

// Fonction pour ajouter une nouvelle règle
function addRule(inputName, inputValue) {
    console.log('addRule called with:', inputName, inputValue);
    chrome.storage.sync.get('rules', function(data) {
        let rules = data.rules || [];
        rules.push({
            selector: formatSelector(inputName), // Utilise la fonction de formatage
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
            // Utilise la version simplifiée du sélecteur
            span.textContent = `${simplifySelector(rule.selector)} : ${rule.value}`;
            
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