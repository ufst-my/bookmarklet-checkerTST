javascript:(function() {
    var inputIds = prompt('Indtast fordringsIDs adskilt af komma eller linjeskift:', '');
    if (inputIds === null) { 
        // Hvis brugeren trykker annuller, afslut uden at vise en besked
        return; 
    }

    // Split, trim og filtrer input
    var rawIds = inputIds.split(/[\r\n,]+/).map(function(id) { return id.trim(); });
    rawIds = rawIds.filter(function(id) { return id.length > 0; }); // Fjern tomme

    var validIds = [];
    var invalidIds = [];

    // Check for 12-cifrede tal
    rawIds.forEach(function(rid) {
        // Tjek om rid er et 12-cifret tal
        if (/^\d{12}$/.test(rid)) {
            validIds.push(rid);
        } else {
            invalidIds.push(rid);
        }
    });

    // Hvis ingen gyldige IDs
    if (validIds.length === 0) {
        alert("Der skal angives mindst ét fordringsID");
        return;
    }

    var totalAngivne = validIds.length;
    // Fjern dubletter fra validIds for det egentlige opslag
    var uniqueIds = Array.from(new Set(validIds));
    var totalAngivneDubletter = totalAngivne - uniqueIds.length;

    var ids = uniqueIds; // Disse bruges til den egentlige krydsning
    var totalIds = ids.length; 
    var processedCount = 0;
    var originalTitle = document.title || 'My Page';

    function updateProgress() {
        processedCount++;
        var pct = Math.round((processedCount / totalIds) * 100);
        document.title = 'Markerer: ' + pct + '% - ' + originalTitle;
    }

    // Adgang til main frame
    var f = window.frames['main'];
    if (!f) {
        alert("Rammen 'main' blev ikke fundet.");
        return;
    }

    // Adgang til iframe 'uiMap'
    var i = f.document.querySelector('iframe[name="uiMap"]');
    if (!i) {
        alert("Iframe 'uiMap' blev ikke fundet.");
        return;
    }

    var d = i.contentDocument || i.contentWindow.document; 
    if (!d) {
        alert("Indhold af iframe 'uiMap' er ikke tilgængeligt.");
        return;
    }

    var tds = d.querySelectorAll('td[orafield="obligationInfo"]');
    var foundIds = new Set(); 
    var checkedCount = 0; // Tæller antallet af afkrydsede felter

    ids.forEach(function(inputId) {
        tds.forEach(function(td) {
            var tdText = td.textContent || '';
            if (tdText.includes(inputId)) {
                foundIds.add(inputId);
                var tr = td.closest('tr');
                if (tr) {
                    var checkbox = tr.querySelector('input[type="checkbox"]');
                    if (checkbox && !checkbox.checked) {
                        checkbox.checked = true;
                        checkedCount++;
                        var e = new Event('change', { bubbles: true });
                        checkbox.dispatchEvent(e);
                    }
                }
            }
        });
        updateProgress();
    });

    document.title = 'Markering færdig - ' + originalTitle;
    setTimeout(function() {
        document.title = originalTitle;
    }, 5000);

    var notFound = ids.filter(function(id) {
        return !foundIds.has(id);
    });

    var totalFundne = foundIds.size;

    // Opbygning af slutbesked
    var besked = "Krydsbot er færdig.\n";

    // Håndter scenarioer
    if (checkedCount === 0) {
        // Ingen felter afkrydset
        besked = "Der blev ikke fundet noget fordringsID til afkrydsning.";
    } else if (totalFundne === ids.length && notFound.length === 0) {
        // Alle fundne
        besked += "Alle angivne fordringsIDs er krydset af.\n";
    } else if (notFound.length === 1) {
        // En enkelt ikke fundet
        besked += "Dette fordringsID blev ikke fundet:\n" + notFound[0] + "\n";
    } else if (notFound.length > 1) {
        // Flere ikke fundet
        besked += "Disse fordringsIDs blev ikke fundet:\n" + notFound.join(", ") + "\n";
    }

    // Tilføj statuslinjer for angivne, fundne, afkrydsede
    // Hvis ingen afkrydninger, har vi allerede vist en besked, men det skader ikke at vise detaljer.
    // Som minimum ved "ingen afkrydninger" er der ingen fundne, men vi følger den generelle struktur.
    var angivneLinje = "Angivne fordringsIDs: " + totalAngivne;
    if (totalAngivneDubletter > 0) {
        angivneLinje += " (heraf angivne dubletter: " + totalAngivneDubletter + ")";
    }
    angivneLinje += ".";
    besked += angivneLinje + " Fundne fordringsIDs: " + totalFundne + ". Afkrydsede felter: " + checkedCount + ".";

    // Hvis der er invalid input, tilføj nederst
    if (invalidIds.length > 0) {
        besked += "\nDette blev angivet, men ikke accepteret som fordringsID af Krydsbot:\n" + invalidIds.join(", ");
    }

    alert(besked);
})();
