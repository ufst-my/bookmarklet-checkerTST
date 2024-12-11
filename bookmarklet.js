javascript:(function() {
    var inputIds = prompt('Indtast fordringsIDs adskilt af komma eller linjeskift:', '');
    if (inputIds === null) { 
        // Hvis brugeren trykker annuller, afslut uden at vise en besked
        return; 
    }

    // Split og trim
    var ids = inputIds.split(/[\r\n,]+/).map(function(id) { return id.trim(); });
    // Fjern tomme strenge
    ids = ids.filter(function(id) { return id.length > 0; });

    // Hvis ingen gyldige IDs
    if (ids.length === 0) {
        alert("Der skal angives mindst ét fordringsID");
        return;
    }

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

    // Opbygning af slutbesked baseret på betingelserne
    var totalAngivne = ids.length;
    var totalFundne = foundIds.size;
    var ikkeFundneCount = notFound.length;
    var besked = "";

    if (totalAngivne === 0) {
        besked = "Der skal angives mindst ét fordringsID";
    } else if (checkedCount === 0) {
        besked = "Der blev ikke fundet noget fordringsID til afkrydsning.";
    } else if (totalFundne === totalAngivne) {
        besked = "Krydsbot er færdig.\nAlle angivne fordringsIDs er krydset af.\n" +
                 "Angivne fordringsIDs: " + totalAngivne + ". " +
                 "Fundne fordringsIDs: " + totalFundne + ". " +
                 "Afkrydsede felter: " + checkedCount + ".";
    } else if (ikkeFundneCount === 1) {
        besked = "Krydsbot er færdig.\n" +
                 "Angivne fordringsIDs: " + totalAngivne + ". " +
                 "Fundne fordringsIDs: " + totalFundne + ". " +
                 "Afkrydsede felter: " + checkedCount + ".\n" +
                 "Dette fordringsID blev ikke fundet:\n" +
                 notFound[0];
    } else {
        besked = "Krydsbot er færdig.\n" +
                 "Angivne fordringsIDs: " + totalAngivne + ". " +
                 "Fundne fordringsIDs: " + totalFundne + ". " +
                 "Afkrydsede felter: " + checkedCount + ".\n" +
                 "Disse fordringsIDs blev ikke fundet:\n" +
                 notFound.join(", ");
    }

    alert(besked);
})();
