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
            
            let ruleText = document.createElement('span');
            ruleText.textContent = `${simplifySelector(rule.selector)} : ${rule.value}`;
            
            let deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-button';
            deleteButton.onclick = () => deleteRule(index);
            
            ruleElement.appendChild(ruleText);
            ruleElement.appendChild(deleteButton);
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

// Fonction pour supprimer toutes les règles
function deleteAllRules() {
    if (confirm('Are you sure you want to delete all rules?')) {
        chrome.storage.sync.set({ rules: [] }, function() {
            console.log('All rules deleted!');
            displayRules();
        });
    }
}

// Fonction pour afficher les inputs de la page
function showPageInputs() {
    const inputsList = document.getElementById('inputsList');
    inputsList.innerHTML = 'Scanning...';  // Feedback immédiat
    inputsList.style.display = 'block';
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        if (!currentTab?.id) return;

        chrome.tabs.sendMessage(currentTab.id, {action: "scanPage"})
            .then(response => {
                console.log('Received response in popup:', response);
                
                if (response && response.inputs && response.inputs.length > 0) {
                    inputsList.innerHTML = '<div>Available inputs on this page:</div>';
                    
                    response.inputs.forEach(input => {
                        const inputInfo = document.createElement('div');
                        inputInfo.className = 'input-info';
                        
                        // Affiche le nom le plus approprié
                        const displayName = input.name || input.id;
                        inputInfo.textContent = `${displayName} (${input.type})`;
                        
                        // Rend l'élément cliquable
                        inputInfo.style.cursor = 'pointer';
                        inputInfo.addEventListener('click', () => {
                            document.getElementById('inputName').value = displayName;
                        });
                        
                        inputsList.appendChild(inputInfo);
                    });
                } else {
                    inputsList.innerHTML = '<div>No visible input fields found on this page. Click again in succession to debug.</div>';
                }
            })
            .catch(error => {
                console.log('Error during scan:', error);
                inputsList.innerHTML = '<div>Error scanning page. Try reloading the page.</div>';
            });
    });
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    displayRules();

    const helpText = document.getElementById('helpText');
    
    // Désactive le lien au démarrage
    helpText.classList.add('disabled');
    
    // Ajoute un span pour le compteur
    const counter = document.createElement('span');
    counter.className = 'counter';
    helpText.appendChild(counter);
    
    // Compte à rebours de 15 secondes
    let secondsLeft = 15;
    counter.textContent = `(${secondsLeft}s)`;
    
    const timer = setInterval(() => {
        secondsLeft--;
        counter.textContent = `(${secondsLeft}s)`;
        
        if (secondsLeft <= 0) {
            clearInterval(timer);
            helpText.classList.remove('disabled');
            counter.remove();
            // Ajoute l'écouteur d'événements seulement après le délai
            helpText.addEventListener('click', function(e) {
                if (!helpText.classList.contains('disabled')) {
                    showPageInputs();
                }
            });
        }
    }, 1000);

    document.getElementById('addButton').addEventListener('click', function() {
        let name = document.getElementById('inputName').value;
        let value = document.getElementById('inputValue').value;
        if (name && value) {
            addRule(name, value);
            document.getElementById('inputName').value = '';
            document.getElementById('inputValue').value = '';
        }
    });

    document.getElementById('applyButton').addEventListener('click', applyRules);
    document.getElementById('deleteAllButton').addEventListener('click', deleteAllRules);
}); 