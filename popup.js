// Fonction pour ajouter une nouvelle règle
function addRule(inputName, inputValue) {
    // D'abord on récupère les règles existantes
    chrome.storage.sync.get('rules', function(data) {
        // Si aucune règle n'existe encore, on initialise un tableau vide
        let rules = data.rules || [];
        
        // On ajoute la nouvelle règle
        rules.push({
            selector: inputName,
            value: inputValue
        });
        
        // On sauvegarde le tableau mis à jour
        chrome.storage.sync.set({ rules: rules }, function() {
            console.log('Règle ajoutée !');
            displayRules(); // Rafraîchit l'affichage
        });
    });
}

// Fonction pour supprimer une règle
function deleteRule(index) {
    chrome.storage.sync.get('rules', function(data) {
        let rules = data.rules || [];
        rules.splice(index, 1); // Supprime la règle à l'index spécifié
        
        chrome.storage.sync.set({ rules: rules }, function() {
            console.log('Règle supprimée !');
            displayRules(); // Rafraîchit l'affichage
        });
    });
}

// Fonction pour afficher toutes les règles
function displayRules() {
    chrome.storage.sync.get('rules', function(data) {
        let rules = data.rules || [];
        let rulesContainer = document.getElementById('rules-list');
        rulesContainer.innerHTML = ''; // Vide la liste

        rules.forEach((rule, index) => {
            let ruleElement = document.createElement('div');
            ruleElement.innerHTML = `
                <span>${rule.selector} : ${rule.value}</span>
                <button onclick="deleteRule(${index})">Supprimer</button>
            `;
            rulesContainer.appendChild(ruleElement);
        });
    });
} 