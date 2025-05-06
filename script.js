document.addEventListener("DOMContentLoaded", function () {
    let jsonData = [];
    let selectedColumns = [];
    let currentData = [];

    document.getElementById("fileInput").addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    jsonData = JSON.parse(e.target.result);
                    currentData = jsonData;
                    generateTable(jsonData);
                } catch (error) {
                    alert("Errore nel file JSON");
                }
            };
            reader.readAsText(file);
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
    
        const table = document.createElement("table");
        table.classList.add("data-table");
        table.id = "dataTable"; // Aggiungiamo un ID alla tabella per riferimento
        const headerRow = document.createElement("tr");
    
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
    
            // Aggiungiamo il pulsante di ordinamento a forma di freccia
            const sortButton = document.createElement("button");
            sortButton.classList.add("sort-button");
            sortButton.innerHTML = "↕️"; // Freccia su e giù
            sortButton.dataset.column = column;
            sortButton.dataset.direction = "none"; // Stato iniziale: nessun ordinamento
            sortButton.addEventListener("click", () => sortTableByColumn(data, column, sortButton));
    
            group.appendChild(checkbox);
            group.appendChild(label);
            group.appendChild(filterInput);
            group.appendChild(sortButton);
    
            th.appendChild(group);
            headerRow.appendChild(th);
        });
    
        table.appendChild(headerRow);
    
        data.forEach(row => {
            const tr = document.createElement("tr");
            columns.forEach(column => {
                const td = document.createElement("td");
                td.textContent = row[column];
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });
    
        tableContainer.appendChild(table);
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
    });

    //generazione grafico a colonne
    function generateBarChart(data) {
        const chartContainer = document.getElementById("chartContainer");
        chartContainer.innerHTML = "";
    
        const chunkSize = 10;
        const totalChunks = Math.ceil(data.length / chunkSize);
        
        for (let i = 0; i < totalChunks; i++) {
            const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
    
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
                            text: `Grafico ${i + 1} (${i * chunkSize + 1}–${Math.min((i + 1) * chunkSize, data.length)})`
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
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
                            formatter: function(value) {
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
                plugins: [ChartDataLabels] // qui serve il plugin ChartDataLabels
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
    
    
    
    
    
});
