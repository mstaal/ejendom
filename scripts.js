function getKommuner() {
    var url = "https://dawa.aws.dk/kommuner?struktur=mini";
    fetchJsonViaGet(url)
    .then(kommuner => {
        var dropdown = document.getElementById("dropdown");
        var option = document.createElement('option');
        dropdown.add(option, kommuner.length);
        for (let index = 0; index < kommuner.length; index++) {
            var kommune = kommuner[index];
            var option = document.createElement('option');
            option.value = kommune.kode;
            option.text = option.text = kommune.kode.concat(" - ", kommune.navn);
            dropdown.add(option, kommuner.length - index + 1);
        }
    });
}

function getEjendomme() {
    var table  = document.getElementById('ejendomme');
    var moder = document.getElementById("mom").checked;
    while (table.rows.length > 1) {
        table.deleteRow(-1);
    }
    fetchJsonViaGet(obtainAdresseUrl())
    .then(ejendomme => {
        var enhedurl = obtainEnhedUrl(ejendomme);
        fetchJsonViaGet(enhedurl)
        .then(enheder => alterEnheder(enheder, moder, ejendomme))
        .then(obtainOpgangUrl)
        .then(ejendomme => {
            fetchJsonViaGet(ejendomme.opgangurl)
            .then(opgange => obtainBygningUrl(opgange, ejendomme))
            .then(ejendomme => {
                fetchJsonViaGet(ejendomme.bygningurl)
                .then(bygninger => alterBPFG(bygninger, moder, ejendomme))
                .then(constructTableFromEjendomme);
            })
        })
    })
}

function obtainAdresseUrl() {
    var search = document.getElementById("search").value;
    var page = document.getElementById("page").value;
    var pagesize = document.getElementById("pagesize").value;
    var random = document.getElementById("random").checked;
    var kommuner = document.getElementById("dropdown");
    var kommune = kommuner.options[kommuner.selectedIndex].value;
    var sidenr = random ? Math.floor(Math.random() * 100) + 1 : page;
    document.getElementById("page").value = sidenr;
    var urlroot = "https://dawa.aws.dk/adresser?per_side=".concat(pagesize);
    var url = urlroot.concat("&side=", sidenr);
    if(kommune?.length > 0) {
        url = url.concat("&kommunekode=", kommune);
    }
    if(search?.length > 0) {
        url = url.concat("&q=", search);
    }
    return url;
}

function obtainOpgangUrl(ejendomme) {
    var adgangsadresseSamling = "";
    for (let index = 0; index < ejendomme.length; index++) {
        var adresse = ejendomme[index];
        if(adresse?.adgangsadresse?.id?.length > 0) {
            adgangsadresseSamling = adgangsadresseSamling.concat("|", adresse.adgangsadresse.id)
        }
    }
    var opgangurl = "https://dawa.aws.dk/bbrlight/opgange?";
    if(adgangsadresseSamling.length > 0) {
        opgangurl = opgangurl.concat("adgangsadresseid=", adgangsadresseSamling.substring(1))
    } else {
        opgangurl = opgangurl.concat("per_side=1&kommunekode=0000")
    }
    ejendomme.opgangurl = opgangurl;
    return ejendomme
}

function obtainBygningUrl(opgange, ejendomme) {
    var bygningSamling = "";
    for (let index = 0; index < opgange.length; index++) {
        var opgang = opgange[index];
        if(opgang?.Bygning_id?.length > 0) {
            bygningSamling = bygningSamling.concat("|", opgang.Bygning_id)
        }
    }
    var bygningurl = "https://dawa.aws.dk/bbrlight/bygninger?";
    if(bygningSamling.length > 0) {
        bygningurl = bygningurl.concat("id=", bygningSamling.substring(1))
    } else {
        bygningurl = bygningurl.concat("per_side=1&kommunekode=0000")
    }
    ejendomme.bygningurl = bygningurl;
    return ejendomme
}

function obtainEnhedUrl(ejendomme) {
    var enhedSamling = "";
    for (let index = 0; index < ejendomme.length; index++) {
        var adresse = ejendomme[index];
        if(adresse?.etage?.length > 0) {
            enhedSamling = enhedSamling.concat("|", adresse.id)
        }
    }
    var enhedurl = "https://dawa.aws.dk/bbrlight/enheder?";
    if(enhedSamling.length > 0) {
        enhedurl = enhedurl.concat("adresseid=", enhedSamling.substring(1))
    } else {
        enhedurl = enhedurl.concat("per_side=1&&id=00000000-0000-0000-0000-000000000000")
    }
    return enhedurl
}

function alterEnheder(enheder, moder, ejendomme) {
    if(!moder) {
        for(let enhedIndex = 0; enhedIndex < enheder.length; enhedIndex++) {
            var enhed = enheder[enhedIndex];
            for (let ejdIndex = 0; ejdIndex < ejendomme.length; ejdIndex++) {
                var ejendom = ejendomme[ejdIndex];
                var ejerskabejendomsnr = enhed?.ejerskaber[0]?.ESREjdNr;
                if(enhed.EnhAdr_id === ejendom.id && ejerskabejendomsnr > 0) {
                    ejendom.adgangsadresse.esrejendomsnr = ejerskabejendomsnr;
                }
            }
        }
    }
    return ejendomme;
}

function alterBPFG(bygninger, moder, ejendomme) {
    if(!moder) {
        for(let bygningIndex = 0; bygningIndex < bygninger.length; bygningIndex++) {
            var bygning = bygninger[bygningIndex]
            var currentAdgang = bygning.AdgAdr_id;
            var ejerskab = bygning.ejerskaber?.length > 0 ? bygning.ejerskaber[0] : null;
            if(ejerskab) {
                for(let ejendomIndex = 0; ejendomIndex < ejendomme.length; ejendomIndex++) {
                    var ejendom = ejendomme[ejendomIndex];
                    if(ejendom.adgangsadresse.id === currentAdgang) {
                        ejendom.adgangsadresse.esrejendomsnr = ejerskab.ESREjdNr;
                    }
                }
            }
        }
    }
    return ejendomme;
}

function constructTableFromEjendomme(ejendomme) {
    var body = document.body;
    var table  = document.getElementById('ejendomme');

    for (let index = 0; index < ejendomme.length; index++) {
        var adresse = ejendomme[index]
        var adgang = adresse.adgangsadresse;
        var row = table.insertRow(-1);
        var kommunekode = row.insertCell(0);
        var ejendomsnummer = row.insertCell(1);
        var matrikel = row.insertCell(2);
        var adressenavn = row.insertCell(3);
        var ejendomsrelation = row.insertCell(4);
        var bbrmeddelelse = row.insertCell(5);
        kommunekode.innerHTML = adgang.kommune.kode;
        var ejdlength = adgang.esrejendomsnr ? adgang.esrejendomsnr.length : 0;
        ejendomsnummer.innerHTML = adgang.esrejendomsnr ? "000000".concat(adgang.esrejendomsnr).substring(ejdlength) : "Ukendt";
        matrikel.innerHTML = adgang?.ejerlav?.kode && adgang?.matrikelnr ? "(".concat(adgang.ejerlav.kode,", ",adgang.matrikelnr,")") : "Ukendt";
        adressenavn.innerHTML = adresse.adressebetegnelse;
        if(adgang.esrejendomsnr) {
            var bbrdafurl = "https://services.datafordeler.dk/BBR/BBRPublic/1/rest/ejendomsrelation?&format=xml";
            bbrdafurl = bbrdafurl.concat("&kommunekode=", adgang.kommune.kode, "&ejendomsnummer=", adgang.esrejendomsnr, "&username=GVTBDWFELM&password=Test1234!");
            ejendomsrelation.innerHTML = "<a href='" + bbrdafurl + "' target='_blank'>Link</a>";
            
            var bbrmeddelelseurl = "https://bbr.dk/pls/wwwdata/get_ois_pck.show_bbr_meddelelse_pdf?i_municipalitycode="
                .concat(adgang.kommune.kode,"&i_realpropertyidentifier=", adgang.esrejendomsnr);
            bbrmeddelelse.innerHTML = "<a href='" + bbrmeddelelseurl + "' target='_blank'>BBR</a>"
        }
    }
    body.appendChild(table);
}

function fetchJsonViaGet(url) {
    return fetch(url, {
        method: 'GET',
        headers: {
            'Accept': "application/json"
          }
    }).then(responseToJson);
}

function responseToJson(response) {
    if(!response.ok) {
        alert("Status ".concat(response.status, ": ", response.statusText, ": ", url));
    }
    return response.json();
}
