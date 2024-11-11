// Remplir les champs automatiquement
chrome.storage.sync.get('rules', function(data) {
    let rules = data.rules || [];
    
    rules.forEach(rule => {
        // Trouve tous les inputs correspondant au sélecteur
        let inputs = document.querySelectorAll(rule.selector);
        inputs.forEach(input => {
            input.value = rule.value;
        });
    });
}); 