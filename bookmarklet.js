javascript:(function() {
    // Beder brugeren om at indtaste en liste af IDs adskilt af komma eller linjeskift
    var inputIds = prompt('Indtast fordringsIDs adskilt af komma eller linjeskift:', '');
    if (!inputIds) return; // Afslutter scriptet, hvis brugeren ikke indtaster noget

    // Opdeler inputtet i et array af trimmede IDs ved hjælp af komma eller linjeskift
    var ids = inputIds.split(/[\r\n,]+/).map(function(id) {
        return id.trim(); // Fjerner mellemrum før og efter hvert ID
    });
    var totalIds = ids.length; // Gemmer det totale antal IDs til tracking
    var processedCount = 0; // Tæller til antallet af behandlede IDs
    var originalTitle = document.title || 'My Page'; // Gemmer den oprindelige titel på siden til senere fallback

    // Funktion til at opdatere fanens titel med fremdriftsstatus
    function updateProgress() {
        processedCount++; // Øger tælleren for behandlede IDs
        var pct = Math.round((processedCount / totalIds) * 100); // Beregner procentvis fremdrift
        document.title = 'Markerer: ' + pct + '% - ' + originalTitle; // Opdaterer sidens titel
    }

    // Adgang til main frame
    var f = window.frames['main'];
    if (!f) return; // Afslutter, hvis rammen ikke findes

    // Adgang til iframe'en ved navn 'uiMap' inden for main frame
    var i = f.document.querySelector('iframe[name="uiMap"]');
    if (!i) return; // Afslutter, hvis iframe'en ikke findes

    // Adgang til iframe'en
    var d = i.contentDocument || i.contentWindow.document; 
    if (!d) return; // Afslutter, hvis iframe ikke er tilgængeligt

    // Finder alle <td>-elementer med attributten orafield="obligationInfo"
    var tds = d.querySelectorAll('td[orafield="obligationInfo"]');
    var foundIds = new Set(); // Opretter sæt til at gemme matchede IDs

    // Itererer over hvert input-ID, som brugeren har indtastet
    ids.forEach(function(inputId) {

        // Gennemgår alle <td>-elementer i iframe'en
        tds.forEach(function(td) {
            var tdText = td.textContent || ''; // Henter tekstindholdet i <td>
            
            // Tjekker, om tekstindholdet indeholder det aktuelle input-ID
            if (tdText.includes(inputId)) {
                foundIds.add(inputId); // Tilføjer det matchede ID til sættet

                // Finder parent <tr> (rækken) som indeholder <td>'en
                var tr = td.closest('tr');
                if (tr) {
                    // Finder en checkbox i rækken
                    var checkbox = tr.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.checked = true; // Marker checkboxen som valgt
                        
                        // Udløser en 'change'-hændelse for at simulere brugerinteraktion
                        var e = new Event('change', { bubbles: true });
                        checkbox.dispatchEvent(e);
                    }
                }
            }
        });

        // Opdaterer fremdriften efter at have behandlet hvert ID
        updateProgress();
    });

    // Opdaterer sidens titel for at angive, at markeringen er færdig
    document.title = 'Markering færdig - ' + originalTitle;

    // Gendanner den oprindelige titel efter 5 sekunder
    setTimeout(function() {
        document.title = originalTitle;
    }, 5000);

    // Find IDs der ikke blev matchet
    var notFound = ids.filter(function(id) {
        return !foundIds.has(id);
    });

    // Vis besked-boks med status
    if (notFound.length === 0) {
        alert("Krydsbot er færdig.\nAlle fordringsIDs er krydset af.");
    } else {
        alert("Krydsbot er færdig.\nDisse fordringsIDs er ikke krydset af: " + notFound.join(", "));
    }

})();
