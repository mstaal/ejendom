function getKommuner() {
    var url = "https://dawa.aws.dk/kommuner?struktur=mini";
    fetch(url, {
        method: 'GET',
        headers: {
            'Accept': "application/json"
          }
    }).then(r => {
        if(!r.ok) {
            alert("Status ".concat(r.status, ": ", r.statusText, ": ", toolkit));
        }
        return r.json();
    }).then(kommuner => {
        var dropdown = document.getElementById("dropdown");
        for (let index = 0; index < kommuner.length; index++) {
            var kommune = kommuner[index];
            var option = document.createElement('option');
            option.text = option.value = kommune.kode;
            option.text = option.text = kommune.kode.concat(" - ", kommune.navn);
            dropdown.add(option, kommuner.length - index);
        }
    });
}

function getEjendommeViaKommune() {
    var page = document.getElementById("page").value
    var pagesize = document.getElementById("pagesize").value
    var urlroot = "https://dawa.aws.dk/adgangsadresser?per_side=".concat(pagesize,"&kommunekode=");
    var kommuner = document.getElementById("dropdown");
    var kommune = kommuner.options[kommuner.selectedIndex].value;
    var number = page.includes("?") ? Math.floor(Math.random() * 100) + 1 : page;
    var url = urlroot.concat(kommune, "&side=", number);
    fetch(url, {
        method: 'GET',
        headers: {
            'Accept': "application/json"
          }
    }).then(r => {
        if(!r.ok) {
            alert("Status ".concat(r.status, ": ", r.statusText, ": ", toolkit));
        }
        return r.json();
    }).then(ejendomme => {
        var body = document.body;
        var table  = document.getElementById('ejendomme');
        while (table.rows.length > 1) {
            var row = table.deleteRow(-1);
        }        
        for (let index = 0; index < ejendomme.length; index++) {
            var ejendom = ejendomme[index]
            var row = table.insertRow(-1);
            var kommunekode = row.insertCell(0);
            var ejendomsnummer = row.insertCell(1);
            var matrikel = row.insertCell(2);
            var adressenavn = row.insertCell(3);
            kommunekode.innerHTML = ejendom.kommune.kode;
            var ejdlength = ejendom.esrejendomsnr.length;
            ejendomsnummer.innerHTML = "000000".concat(ejendom.esrejendomsnr).substring(ejdlength);
            matrikel.innerHTML = "(".concat(ejendom.ejerlav.kode,", ",ejendom.matrikelnr,")");
            adressenavn.innerHTML = ejendom.vejstykke.navn.concat(" ", ejendom.husnr, ", ", ejendom.postnummer.nr);
        }
        body.appendChild(table);
    });
}