document.addEventListener("DOMContentLoaded", function () {
    let jsonData = [];
    let selectedColumns = [];
    let currentData = [];
    let lastTableData = [];
    let selectedRowsForEdit = [];


document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file && file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // ✅ NUOVO: Salva i dati originali nel sessionStorage
                sessionStorage.setItem('originalJsonData', JSON.stringify(jsonData));
                
                // Resto del codice esistente...
                generateFilters(jsonData);
                generateTable(jsonData);
                generateActionMenu(jsonData);
                
                console.log("File JSON caricato e salvato nel sessionStorage");
            } catch (error) {
                alert("Errore nella lettura del file JSON: " + error.message);
            }
        };
        reader.readAsText(file);
    } else {
        alert("Seleziona un file JSON valido");
    }
});
      

    //generazione tabella iniziale
    function generateTable(data, visibleColumns = null) {
    const tableContainer = document.getElementById("tableContainer");
    tableContainer.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
        alert("Il JSON caricato non è valido");
        return;
    }

    // Aggiungi il bottone Modifica sopra la tabella
    const editButtonContainer = document.createElement("div");
    editButtonContainer.style.marginBottom = "10px";
    
    const editButton = document.createElement("button");
    editButton.id = "editButton";
    editButton.textContent = "Modifica Righe Selezionate";
    editButton.style.padding = "6px 12px";
    editButton.style.backgroundColor = "#0977b8";
    editButton.style.color = "white";
    editButton.style.border = "none";
    editButton.style.borderRadius = "4px";
    editButton.style.cursor = "pointer";
    editButton.style.marginRight = "10px";
    editButton.addEventListener("click", openEditPage);
    
    editButtonContainer.appendChild(editButton);
    tableContainer.appendChild(editButtonContainer);

    const table = document.createElement("table");
    table.classList.add("data-table");
    table.id = "dataTable";
    const headerRow = document.createElement("tr");

    // Aggiungi colonna per checkbox di selezione riga
    const selectTh = document.createElement("th");
    selectTh.textContent = "Seleziona";
    selectTh.style.width = "80px";
    headerRow.appendChild(selectTh);

    const columns = visibleColumns || Object.keys(data[0]);

    columns.forEach(column => {
        const th = document.createElement("th");

        const group = document.createElement("div");
        group.classList.add("filter-group");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectedColumns.includes(column);
        checkbox.addEventListener("change", () => toggleColumnSelection(column, checkbox.checked));

        const label = document.createElement("label");
        label.textContent = column;

        const filterInput = document.createElement("input");
        filterInput.type = "text";
        filterInput.placeholder = "Filtra...";
        filterInput.classList.add("filter-input");
        filterInput.dataset.column = column;

        const sortButton = document.createElement("button");
        sortButton.classList.add("sort-button");
        sortButton.innerHTML = "↕️";
        sortButton.dataset.column = column;
        sortButton.dataset.direction = "none";
        sortButton.addEventListener("click", () => sortTableByColumn(data, column, sortButton));

        group.appendChild(checkbox);
        group.appendChild(label);
        group.appendChild(filterInput);
        group.appendChild(sortButton);

        th.appendChild(group);
        headerRow.appendChild(th);
    });

    table.appendChild(headerRow);

    data.forEach((row, index) => {
        const tr = document.createElement("tr");
        
        // Aggiungi checkbox per selezione riga
        const selectTd = document.createElement("td");
        const rowCheckbox = document.createElement("input");
        rowCheckbox.type = "checkbox";
        rowCheckbox.dataset.rowIndex = index;
        rowCheckbox.addEventListener("change", (e) => toggleRowSelection(index, row, e.target.checked));
        selectTd.appendChild(rowCheckbox);
        tr.appendChild(selectTd);

        columns.forEach(column => {
            const td = document.createElement("td");
            td.textContent = row[column];
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    tableContainer.appendChild(table);

    lastTableData = data.map(row => {
        const filteredRow = {};
        columns.forEach(col => filteredRow[col] = row[col]);
        return filteredRow;
    });
}

    // Funzione separata per l'ordinamento della tabella
    function sortTableByColumn(originalData, columnName, button) {
        let tableData = [...originalData];
    
        const currentDirection = button.dataset.direction;
    
        document.querySelectorAll(".sort-button").forEach(btn => {
            btn.dataset.direction = "none";
            btn.innerHTML = "↕️";
        });
    
        let newDirection;
    
        switch (currentDirection) {
            case "none":
            case "desc":
                newDirection = "asc";
                button.innerHTML = "↑";
                break;
            case "asc":
                newDirection = "desc";
                button.innerHTML = "↓";
                break;
        }
    
        button.dataset.direction = newDirection;
    
        tableData.sort((a, b) => {
            let valA = a[columnName];
            let valB = b[columnName];
    
            // ✅ Usa parseEuropeanNumber per entrambi i valori
            const parsedA = parseEuropeanNumber(valA);
            const parsedB = parseEuropeanNumber(valB);
    
            const isNumeric = typeof parsedA === 'number' && typeof parsedB === 'number' &&
                              !isNaN(parsedA) && !isNaN(parsedB);
    
            if (isNumeric) {
                valA = parsedA;
                valB = parsedB;
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }
    
            if (valA < valB) return newDirection === "asc" ? -1 : 1;
            if (valA > valB) return newDirection === "asc" ? 1 : -1;
            return 0;
        });
    
        const table = document.getElementById("dataTable");
        const visibleColumns = [];
        const headers = table.querySelectorAll("th");
    
        headers.forEach(header => {
            const group = header.querySelector(".filter-group");
            const label = group.querySelector("label");
            visibleColumns.push(label.textContent);
        });
    
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
    
        tableData.forEach(row => {
            const tr = document.createElement("tr");
            visibleColumns.forEach(column => {
                const td = document.createElement("td");
                td.textContent = row[column];
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });
         // 🔧 AGGIORNA LA VARIABILE GLOBALE
        lastTableData = tableData.map(row => {
            const filteredRow = {};
            visibleColumns.forEach(col => filteredRow[col] = row[col]);
            return filteredRow;
        });
        console.log("Dati ordinati salvati in lastTableData:", lastTableData);
    }
    
    

    function toggleColumnSelection(column, isChecked) {
        if (isChecked) {
            selectedColumns.push(column);
        } else {
            selectedColumns = selectedColumns.filter(col => col !== column);
        }
    }

    document.getElementById("filterButton").addEventListener("click", applyFilters);

    document.getElementById("visualizzaButton").addEventListener("click", function () {
        if (selectedColumns.length === 0) {
            alert("Seleziona almeno una colonna da visualizzare.");
            return;
        }
        generateSelectedTable(currentData);
    });
    
    //filtro
    function applyFilters() {
        const filters = {};
        document.querySelectorAll(".filter-input").forEach(input => {
            const value = input.value.trim();
            if (value) {
                // Split su "-" con o senza spazi, e rimuove gli spazi superflui
                const values = value.split(/\s*-\s*/).map(v => v.toLowerCase().trim());
                filters[input.dataset.column] = values;
            }
        });
    
        if (Object.keys(filters).length === 0) {
            alert("Inserisci almeno un filtro!");
            return;
        }
    
        const filteredData = jsonData.filter(row => {
            return Object.entries(filters).every(([column, filterValues]) => {
                if (!row[column]) return false;
                const cellValue = row[column].toString().trim().toLowerCase();
                // Match se almeno uno dei valori del filtro è contenuto nella cella
                return filterValues.some(filter => cellValue.includes(filter));
            });
        });
    
        currentData = filteredData;
    
        // ✅ mostra tutte le colonne, indipendentemente dalle checkbox selezionate
        generateTable(filteredData);
    }
    
    
    
    //menu a tendina
    document.getElementById("actionMenu").addEventListener("change", function () {
        const action = this.value;
        this.value = "";

        if (action === "confronta") {
            if (selectedColumns.length < 2) {
                alert("Seleziona almeno due colonne per confrontarle.");
                return;
            }
            generateBarChart(currentData);
        } else if (action === "torta") {
            if (selectedColumns.length !== 1) {
                alert("Seleziona una sola colonna per il grafico a torta.");
                return;
            }
            generatePieChart(currentData);
        }
        else if (action === "somma") {
            if (selectedColumns.length === 0) {
                alert("Seleziona almeno una colonna da sommare.");
                return;
            }
            calculateSum(); // ✅ Chiamata alla funzione
        }
        else if (action === "sottrazione") {
            if (selectedColumns.length === 0) {
                alert("Seleziona almeno una colonna da sommare.");
                return;
            }
            calculateSubtraction(); // ✅ Chiamata alla funzione
        }
        else if (action === "obbiettivo") {
            if (selectedColumns.length !== 1) {
                alert("Seleziona una sola colonna per il grafico a torta.");
                return;
            }
            handleObiettivo();
        }
    });

    //generazione grafico a colonne
    function generateBarChart() {
        const chartContainer = document.getElementById("chartContainer");
        chartContainer.innerHTML = "";
    
        // Verifica che ci siano dati validi
        if (!Array.isArray(lastTableData) || lastTableData.length === 0) {
            console.warn("Nessun dato disponibile in lastTableData per generare il grafico.");
            return;
        }
    
        const chunkSize = 10;
        const totalChunks = Math.ceil(lastTableData.length / chunkSize);
    
        for (let i = 0; i < totalChunks; i++) {
            const chunk = lastTableData.slice(i * chunkSize, (i + 1) * chunkSize);
    
            const labels = chunk.map(row => row[Object.keys(row)[0]]);
            const datasets = selectedColumns.map((col, index) => ({
                label: col,
                data: chunk.map(row => {
                    let rawValue = row[col];
                    if (typeof rawValue === "string") {
                        rawValue = rawValue.replace(/\./g, "").replace(",", ".");
                    }
                    return parseFloat(rawValue) || 0;
                }),
                backgroundColor: `hsl(${index * 90}, 70%, 50%)`
            }));
    
            const canvas = document.createElement("canvas");
            canvas.style.marginBottom = "30px";
            chartContainer.appendChild(canvas);
    
            new Chart(canvas.getContext("2d"), {
                type: "bar",
                data: { labels, datasets },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: "top" },
                        title: {
                            display: totalChunks > 1,
                            text: `Grafico ${i + 1} (${i * chunkSize + 1}–${Math.min((i + 1) * chunkSize, lastTableData.length)})`
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.dataset.label + ': ' + context.formattedValue;
                                }
                            }
                        },
                        datalabels: {
                            anchor: 'end',
                            align: 'start',
                            color: '#000',
                            font: {
                                weight: 'bold'
                            },
                            formatter: function (value) {
                                return value.toLocaleString('it-IT', { maximumFractionDigits: 2 });
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                },
                plugins: [ChartDataLabels]
            });
        }
    }
    
    
    
    
    //grafico a torta
    function generatePieChart(data) {
        const chartContainer = document.getElementById("chartContainer");
        chartContainer.innerHTML = "";

        const col = selectedColumns[0];
        const labels = data.map(row => row[Object.keys(row)[0]]);
        const values = data.map(row => parseFloat(row[col]) || 0);
        const colors = values.map((_, i) => `hsl(${(i * 360 / values.length) % 360}, 70%, 50%)`);

        const canvas = document.createElement("canvas");
        chartContainer.appendChild(canvas);

        new Chart(canvas.getContext("2d"), {
            type: "pie",
            data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
            options: {
                responsive: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (tooltipItem) =>
                                `${labels[tooltipItem.dataIndex]} - ${values[tooltipItem.dataIndex]}%`
                        }
                    }
                }
            }
        });
    }
    //somma colonne
    function calculateSum() {
        const resultContainer = document.getElementById("chartContainer");
        resultContainer.innerHTML = "";
    
        if (selectedColumns.length === 0) {
            alert("Seleziona almeno una colonna per calcolare la somma.");
            return;
        }
    
        const results = [];
        let totalSum = 0;
        let allInvalid = true;
    
        selectedColumns.forEach(col => {
            let sum = 0;
            let validCount = 0;
    
            currentData.forEach(row => {
                const value = row[col];
                if (value === null || value === undefined || value === "") return;
    
                const numero = parseEuropeanNumber(value);
                if (!isNaN(numero)) {
                    sum += numero;
                    validCount++;
                }
            });
    
            if (validCount > 0) {
                allInvalid = false;
                totalSum += sum;
    
                const p = document.createElement("p");
                p.innerHTML = `<strong style="color:#4CAF50">${col}</strong> = <span style="color:#2196F3">${sum.toFixed(2)}</span>`;
                results.push(p);
            }
        });
    
        if (allInvalid) {
            alert("Le colonne selezionate non contengono numeri validi.");
            return;
        }
    
        if (selectedColumns.length > 1) {
            const total = document.createElement("p");
            total.innerHTML = `<strong style="color:#D32F2F">Totale</strong> = <span style="color:#FF5722">${totalSum.toFixed(2)}</span>`;
            results.push(document.createElement("hr"));
            results.push(total);
        }
    
        results.forEach(el => resultContainer.appendChild(el));
    }

    //sottrazione colonne
    function calculateSubtraction() {
        const resultContainer = document.getElementById("chartContainer");
        // Non svuoto il container qua, lo svuoti tu prima se vuoi ricalcolare tutto
    
        if (selectedColumns.length < 2) {
            alert("Seleziona almeno due colonne per calcolare la sottrazione.");
            return;
        }
    
        let allInvalid = true;
        let subtractionResult = null;
        let firstColumnName = "";
        let details = [];
    
        selectedColumns.forEach((col, index) => {
            let sum = 0;
            let validCount = 0;
    
            currentData.forEach(row => {
                const value = row[col];
                if (value === null || value === undefined || value === "") return;
    
                const numero = parseEuropeanNumber(value);
                if (!isNaN(numero)) {
                    sum += numero;
                    validCount++;
                }
            });
    
            if (validCount > 0) {
                allInvalid = false;
                if (index === 0) {
                    subtractionResult = sum;
                    firstColumnName = col;
                } else {
                    subtractionResult -= sum;
                }
    
                details.push({ column: col, sum: sum });
            }
        });
    
        if (allInvalid) {
            alert("Le colonne selezionate non contengono numeri validi.");
            return;
        }
    
        // Output dei dettagli della sottrazione
        const subtractionDetails = document.createElement("div");
        subtractionDetails.innerHTML = `<strong style="color:#D32F2F">Sottrazione (${firstColumnName} - altre colonne):</strong><br>`;
        
        details.forEach((detail, index) => {
            subtractionDetails.innerHTML += `${index === 0 ? '' : '- '}${detail.column}: ${detail.sum.toFixed(2)}<br>`;
        });
    
        const finalResult = document.createElement("p");
        finalResult.innerHTML = `<strong style="color:#673AB7">Risultato finale</strong> = <span style="color:#9C27B0">${subtractionResult.toFixed(2)}</span>`;
    
        resultContainer.appendChild(document.createElement("hr"));
        resultContainer.appendChild(subtractionDetails);
        resultContainer.appendChild(finalResult);
    }

    function parseEuropeanNumber(value) {
        if (typeof value !== "string") value = value.toString().trim();
        value = value.trim();
    
        if (value.includes(".") && value.includes(",")) {
            value = value.replace(/\./g, "").replace(",", ".");
        } else if (value.includes(".")) {
            const parts = value.split(".");
            const decimals = parts[1];
            if (decimals && decimals.length === 3) {
                value = value.replace(/\./g, "");
            }
        } else if (value.includes(",")) {
            value = value.replace(",", ".");
        }
    
        value = value.replace(/\s/g, "");
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    }
    
    function handleObiettivo() {
        if (selectedColumns.length !== 1) {
            alert("Seleziona una sola colonna per impostare un obbiettivo.");
            return;
        }
    
        const obiettivoInput = prompt("Inserisci il tuo obbiettivo (numero intero):");
        const obiettivo = parseInt(obiettivoInput);
    
        if (isNaN(obiettivo) || obiettivo <= 0) {
            alert("Valore non valido. Inserisci un numero intero positivo.");
            return;
        }
    
        const colonnaSelezionata = selectedColumns[0];
        let somma = 0;
    
        currentData.forEach(row => {
            const valore = parseEuropeanNumber(row[colonnaSelezionata]);
            if (valore !== null) {
                somma += valore;
            }
        });
    
        const percentuale = Math.round((somma / obiettivo) * 100);
    
        // Colori e messaggi dinamici
        let classeColore = "";
        let messaggio = `Avanzamento: ${percentuale}%`;
    
        if (percentuale <= 33) {
            classeColore = "obiettivo-rosso";
        } else if (percentuale <= 66) {
            classeColore = "obiettivo-giallo";
        } else if (percentuale <= 99) {
            classeColore = "obiettivo-verde";
        } else if (percentuale === 100) {
            classeColore = "obiettivo-verde-completo";
            messaggio = "<strong>Obbiettivo Completato!</strong>";
        } else if (percentuale > 100) {
            classeColore = "obiettivo-verde-completo";
            const extra = percentuale - 100;
            messaggio = `<strong>Obbiettivo Superato del ${extra}%</strong>`;
        }
    
        // Creazione o aggiornamento del container
        let container = document.getElementById("obiettivoContainer");
        if (!container) {
            container = document.createElement("div");
            container.id = "obiettivoContainer";
            document.body.insertBefore(container, document.getElementById("tableContainer"));
        }
    
        container.className = classeColore;
    
        container.innerHTML = `
            <p><strong>Somma della colonna:</strong> ${somma.toFixed(2)}</p>
            <p><strong>Obbiettivo:</strong> ${obiettivo}</p>
            <div style="background-color: #ddd; height: 25px; border-radius: 5px; overflow: hidden;">
                <div style="width: ${Math.min(percentuale, 100)}%; height: 100%; background-color: rgba(0,0,0,0.1); text-align: center; font-weight: bold;">
                    ${percentuale}%
                </div>
            </div>
            <p style="margin-top: 10px;">${messaggio}</p>
        `;
    }
    
    
    
    //controllo numeri decimali/migliaia
    function parseEuropeanNumber(value) {
        if (typeof value !== "string") value = value.toString().trim();
    
        value = value.trim();
    
        // Caso con sia . che , (es: 1.234,56)
        if (value.includes(".") && value.includes(",")) {
            // punto = migliaia, virgola = decimale
            value = value.replace(/\./g, "").replace(",", ".");
        }
        // Caso solo punto
        else if (value.includes(".")) {
            const parts = value.split(".");
            const decimals = parts[1];
    
            if (decimals && decimals.length === 3) {
                // Es. 1.234 → 1234
                value = value.replace(/\./g, "");
            } else {
                // Es. 1234.56 → lascia invariato
                // Es. 1324.9 → lascia invariato
            }
        }
        // Caso solo virgola
        else if (value.includes(",")) {
            // Es. 1234,56 → converti in 1234.56
            value = value.replace(",", ".");
        }
    
        value = value.replace(/\s/g, ""); // rimuovi spazi
    
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    }
    //controllo selezione tabelle
    function generateSelectedTable(data) {
        if (selectedColumns.length === 0) {
            alert("Seleziona almeno una colonna da visualizzare.");
            return;
        }
        generateTable(data, selectedColumns); // ✅ genera la tabella con checkbox e filtri mantenuti
    }


    //modifica
    function toggleRowSelection(index, rowData, isSelected) {
    if (isSelected) {
        selectedRowsForEdit.push({ index: index, data: rowData });
    } else {
        selectedRowsForEdit = selectedRowsForEdit.filter(item => item.index !== index);
    }
}

    
function reloadDataFromStorage() {
    const storedData = sessionStorage.getItem('originalJsonData');
    if (storedData) {
        try {
            const jsonData = JSON.parse(storedData);
            generateFilters(jsonData);
            generateTable(jsonData);
            generateActionMenu(jsonData);
            console.log("Dati ricaricati dal sessionStorage");
            return true;
        } catch (error) {
            console.error("Errore nel ricaricare i dati:", error);
            return false;
        }
    }
    return false;
}

// ✅ NUOVO: Controlla se ci sono dati aggiornati quando la pagina viene caricata
window.addEventListener('focus', function() {
    // Controlla se siamo tornati dalla pagina di modifica
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('refresh') === 'true') {
        reloadDataFromStorage();
        // Rimuovi il parametro dall'URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// ✅ MODIFICA la funzione openEditPage esistente:
function openEditPage() {
    if (selectedRowsForEdit.length === 0) {
        alert("Seleziona almeno una riga da modificare");
        return;
    }
    
    // Salva i dati selezionati nel sessionStorage
    sessionStorage.setItem('selectedRowsForEdit', JSON.stringify(selectedRowsForEdit));
    
    // ✅ NUOVO: Salva anche i dati completi se non sono già presenti
    if (!sessionStorage.getItem('originalJsonData')) {
        if (lastTableData && lastTableData.length > 0) {
            sessionStorage.setItem('originalJsonData', JSON.stringify(lastTableData));
        }
    }
    
    // Apri la pagina di modifica
    window.location.href = 'modifica.html';
}
    
    
    
});
