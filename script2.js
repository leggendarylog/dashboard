// script2.js - Gestione della pagina modifica.html

// Variabili globali
let selectedRows = [];
let originalJsonData = [];
let modifiedData = {};

// Inizializzazione della pagina
document.addEventListener('DOMContentLoaded', function() {
    loadSelectedRows();
    loadOriginalData();
    displaySelectedRows();
});

// Carica le righe selezionate dal sessionStorage
function loadSelectedRows() {
    selectedRows = JSON.parse(sessionStorage.getItem('selectedRowsForEdit') || '[]');
    console.log('Righe selezionate caricate:', selectedRows);
}

// Carica i dati JSON originali dal sessionStorage
function loadOriginalData() {
    originalJsonData = JSON.parse(sessionStorage.getItem('originalJsonData') || '[]');
    console.log('Dati originali caricati:', originalJsonData);
}

// Visualizza le righe selezionate con campi modificabili
function displaySelectedRows() {
    const container = document.getElementById('editContainer');
    
    if (selectedRows.length === 0) {
        container.innerHTML = '<p>Nessuna riga selezionata per la modifica.</p>';
        return;
    }
    
    container.innerHTML = ''; // Pulisce il container
    
    selectedRows.forEach((rowItem, index) => {
        const rowData = rowItem.data;
        const originalIndex = rowItem.index;
        
        const rowDiv = document.createElement('div');
        rowDiv.style.marginBottom = '30px';
        rowDiv.style.padding = '20px';
        rowDiv.style.border = '1px solid #ddd';
        rowDiv.style.borderRadius = '8px';
        rowDiv.style.backgroundColor = '#f9f9f9';
        rowDiv.dataset.originalIndex = originalIndex;
        
        const title = document.createElement('h3');
        title.textContent = `Riga ${index + 1} (Indice originale: ${originalIndex})`;
        title.style.color = '#0977b8';
        title.style.marginBottom = '15px';
        rowDiv.appendChild(title);
        
        // Crea i campi di input per ogni proprietà della riga
        Object.keys(rowData).forEach(key => {
            const fieldDiv = document.createElement('div');
            fieldDiv.style.marginBottom = '10px';
            fieldDiv.style.display = 'flex';
            fieldDiv.style.alignItems = 'center';
            fieldDiv.style.gap = '10px';
            
            const label = document.createElement('label');
            label.textContent = key + ':';
            label.style.minWidth = '150px';
            label.style.fontWeight = 'bold';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.value = rowData[key] || '';
            input.style.padding = '8px';
            input.style.border = '1px solid #ddd';
            input.style.borderRadius = '4px';
            input.style.flex = '1';
            input.style.fontSize = '14px';
            input.dataset.originalIndex = originalIndex;
            input.dataset.field = key;
            input.dataset.originalValue = rowData[key] || '';
            
            // Evidenzia i campi modificati
            input.addEventListener('input', function() {
                if (this.value !== this.dataset.originalValue) {
                    this.style.backgroundColor = '#fff3cd'; // Giallo chiaro per indicare modifica
                    this.style.borderColor = '#ffeaa7';
                } else {
                    this.style.backgroundColor = '';
                    this.style.borderColor = '#ddd';
                }
                trackChanges();
            });
            
            fieldDiv.appendChild(label);
            fieldDiv.appendChild(input);
            rowDiv.appendChild(fieldDiv);
        });
        
        container.appendChild(rowDiv);
    });
}

// Traccia i cambiamenti effettuati
function trackChanges() {
    const inputs = document.querySelectorAll('#editContainer input');
    let hasChanges = false;
    
    inputs.forEach(input => {
        if (input.value !== input.dataset.originalValue) {
            hasChanges = true;
        }
    });
    
    // Abilita/disabilita il bottone salva in base ai cambiamenti
    const saveButton = document.getElementById('saveButton');
    if (hasChanges) {
        saveButton.style.backgroundColor = '#27ae60';
        saveButton.style.opacity = '1';
    } else {
        saveButton.style.backgroundColor = '#2ecc71';
        saveButton.style.opacity = '0.7';
    }
}

// Raccoglie tutte le modifiche dai campi input
function collectModifications() {
    const inputs = document.querySelectorAll('#editContainer input');
    const modifications = {};
    
    inputs.forEach(input => {
        const originalIndex = parseInt(input.dataset.originalIndex);
        const field = input.dataset.field;
        const newValue = input.value;
        const originalValue = input.dataset.originalValue;
        
        if (newValue !== originalValue) {
            if (!modifications[originalIndex]) {
                modifications[originalIndex] = {};
            }
            modifications[originalIndex][field] = newValue;
        }
    });
    
    return modifications;
}

// Applica le modifiche ai dati originali
function applyModifications() {
    const modifications = collectModifications();
    
    if (Object.keys(modifications).length === 0) {
        showNotification('Nessuna modifica da salvare', 'info');
        return false;
    }
    
    // Applica le modifiche ai dati originali
    Object.keys(modifications).forEach(index => {
        const rowIndex = parseInt(index);
        if (originalJsonData[rowIndex]) {
            Object.keys(modifications[index]).forEach(field => {
                originalJsonData[rowIndex][field] = modifications[index][field];
            });
        }
    });
    
    return true;
}

// Salva le modifiche
function saveModifications() {
    try {
        const success = applyModifications();
        
        if (!success) {
            return;
        }
        
        // Salva i dati modificati nel sessionStorage
        sessionStorage.setItem('originalJsonData', JSON.stringify(originalJsonData));
        
        // Crea e scarica il file JSON modificato
        downloadModifiedJson();
        
        showNotification('Modifiche salvate con successo!', 'success');
        
        // Resetta gli indicatori di modifica
        const inputs = document.querySelectorAll('#editContainer input');
        inputs.forEach(input => {
            input.dataset.originalValue = input.value;
            input.style.backgroundColor = '';
            input.style.borderColor = '#ddd';
        });
        
        trackChanges(); // Aggiorna lo stato del bottone
        
    } catch (error) {
        console.error('Errore durante il salvataggio:', error);
        showNotification('Errore durante il salvataggio delle modifiche', 'error');
    }
}

// Scarica il file JSON modificato
function downloadModifiedJson() {
    const dataStr = JSON.stringify(originalJsonData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'dati_modificati_' + new Date().toISOString().slice(0,10) + '.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
}

// Mostra notifiche all'utente
function showNotification(message, type = 'info') {
    // Rimuovi notifiche esistenti
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Stili per la notifica
    notification.style.position = 'fixed';
    notification.style.top = '80px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = 'white';
    notification.style.fontWeight = 'bold';
    notification.style.zIndex = '10000';
    notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    
    // Colori in base al tipo
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#2ecc71';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f39c12';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
    }
    
    document.body.appendChild(notification);
    
    // Rimuovi automaticamente dopo 3 secondi
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Gestori eventi per i bottoni
function setupEventListeners() {
    const saveButton = document.getElementById('saveButton');
    const cancelButton = document.getElementById('cancelButton');
    
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            if (confirm('Sei sicuro di voler salvare le modifiche? Verrà generato un nuovo file JSON.')) {
                saveModifications();
            }
        });
    }
    
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            const inputs = document.querySelectorAll('#editContainer input');
            let hasChanges = false;
            
            inputs.forEach(input => {
                if (input.value !== input.dataset.originalValue) {
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                if (confirm('Hai modifiche non salvate. Sei sicuro di voler annullare?')) {
                    window.history.back();
                }
            } else {
                window.history.back();
            }
        });
    }
}

// Funzione per tornare alla pagina principale con i dati aggiornati
function returnToMainPage() {
    // I dati sono già aggiornati nel sessionStorage
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Inizializza i gestori eventi quando il DOM è pronto
document.addEventListener('DOMContentLoaded', setupEventListeners);