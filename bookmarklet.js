javascript:(function() {
    var inputIds = prompt('Indtast fordringsIDs adskilt af komma eller linjeskift:', '');
    if (inputIds === null) { 
        // Hvis brugeren trykker "Annuller", afslut uden at vise nogen besked
        return; 
    }

    // Split, trim og filtrer input
    var rawIds = inputIds.split(/[\r\n,]+/).map(function(id) { return id.trim(); });
    rawIds = rawIds.filter(function(id) { return id.length > 0; });

    var validIds = [];
    var invalidIds = [];

    // Check for 12-cifrede tal
    rawIds.forEach(function(rid) {
        if (/^\d{12}$/.test(rid)) {
            validIds.push(rid);
        } else {
            invalidIds.push(rid);
        }
    });

    // Hvis ingen gyldige IDs er indtastet, vis en besked og afslut
    if (validIds.length === 0) {
        alert("Der skal angives mindst ét fordringsID");
        return;
    }

    // Beregn totale angivne IDs og fjern dubletter
    var totalAngivne = validIds.length;
    var uniqueIds = Array.from(new Set(validIds)); // Fjern dubletter
    var totalAngivneDubletter = totalAngivne - uniqueIds.length; // Beregn antal dubletter

    // De unikke IDs bruges til krydsningsprocessen
    var ids = uniqueIds; 
    var totalIds = ids.length; // Total antal unikke IDs
    var processedCount = 0; // Holder styr på antallet af behandlede IDs
    var originalTitle = document.title || 'My Page'; // Gemmer sidens oprindelige titel

    // Funktion til at opdatere fremdriften i fanens titel
    function updateProgress() {
        processedCount++;
        var pct = Math.round((processedCount / totalIds) * 100); // Procentdel fuldført
        document.title = 'Markerer: ' + pct + '% - ' + originalTitle; // Opdater titel
    }

    // Find "main" frame i dokumentet
    var f = window.frames['main'];
    if (!f) {
        alert("Rammen 'main' blev ikke fundet.");
        return;
    }

    // Find "uiMap" iframe indenfor "main"-rammen
    var i = f.document.querySelector('iframe[name="uiMap"]');
    if (!i) {
        alert("Iframe 'uiMap' blev ikke fundet.");
        return;
    }

    // Hent iframe-indholdet
    var d = i.contentDocument || i.contentWindow.document; 
    if (!d) {
        alert("Indhold af iframe 'uiMap' er ikke tilgængeligt.");
        return;
    }

    // Find alle <td>-elementer med attributten `orafield="obligationInfo"`
    var tds = d.querySelectorAll('td[orafield="obligationInfo"]');
    var foundIds = new Set(); // Holder styr på hvilke IDs der er fundet
    var checkedCount = 0; // Tæller antallet af afkrydsede felter

    // Iterer over hver ID i listen
    ids.forEach(function(inputId) {
        // For hver <td> i iframe'en, tjek om teksten matcher det aktuelle ID
        tds.forEach(function(td) {
            var tdText = td.textContent || ''; // Hent tekstindholdet
            if (tdText.includes(inputId)) { // Hvis teksten indeholder ID'et
                foundIds.add(inputId); // Tilføj ID'et til listen over fundne
                var tr = td.closest('tr'); // Find den tilhørende tabelrække
                if (tr) {
                    var checkbox = tr.querySelector('input[type="checkbox"]'); // Find en checkbox i rækken
                    if (checkbox && !checkbox.checked) { // Hvis checkboxen ikke allerede er markeret
                        checkbox.checked = true; // Marker den
                        checkedCount++; // Forøg tælleren for afkrydsede felter
                        var e = new Event('change', { bubbles: true }); // Simuler en 'change'-hændelse
                        checkbox.dispatchEvent(e); // Udløs hændelsen
                    }
                }
            }
        });
        updateProgress(); // Opdater fremdrift efter hver iteration
    });

    // Når processen er færdig, opdater titlen og gendan den oprindelige titel efter 5 sekunder
    document.title = 'Markering færdig - ' + originalTitle;
    setTimeout(function() {
        document.title = originalTitle;
    }, 5000);

    // Identificer IDs, der ikke blev fundet
    var notFound = ids.filter(function(id) {
        return !foundIds.has(id);
    });

    var totalFundne = foundIds.size; // Antallet af unikke fundne IDs

    // Opbygning af slutbeskeden
    var besked = "Krydsbot er færdig.\n";

    // Håndtering af forskellige scenarier
    if (checkedCount === 0) {
        besked += "Der blev ikke fundet noget fordringsID til afkrydsning.\n";
    } else if (totalFundne === ids.length && notFound.length === 0) {
        besked += "Alle angivne fordringsIDs er krydset af.\n";
    }

    // Tilføj statuslinjer
    var angivneLinje = "Angivne fordringsIDs: " + totalAngivne;
    if (totalAngivneDubletter > 0) {
        angivneLinje += " (heraf angivne dubletter: " + totalAngivneDubletter + ")";
    }
    angivneLinje += ".\n"; // Tilføj linjeskift her
    besked += angivneLinje + "Fundne fordringsIDs: " + totalFundne + ". Afkrydsede felter: " + checkedCount + ".\n";

    // Tilføj linje med ikke fundne IDs, hvis relevant
    if (notFound.length === 1) {
        besked += "Dette fordringsID blev ikke fundet:\n" + notFound[0] + "\n";
    } else if (notFound.length > 1) {
        besked += "Disse fordringsIDs blev ikke fundet:\n" + notFound.join(", ") + "\n";
    }

    // Tilføj linje med ugyldigt input, hvis relevant
    if (invalidIds.length > 0) {
        besked += "Dette blev angivet, men ikke accepteret som fordringsID af Krydsbot:\n" + invalidIds.join(", ");
    }

    // Vis slutbeskeden
    alert(besked);
})();
