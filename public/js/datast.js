//Globale variabler
var user = {}
var liveID, params;
//Oppstartsfunksjon
window.onload = function() {
    liveID = firebase.database().ref('projects/').push().key
    params = getParams()
    getDatastFromDatabase()
    //Sjekker om bruker er pålogget via google
    firebase.auth().onAuthStateChanged(function(u) {
        user = u
        if (u) {
            setHTML("#loginBtn","Logout")
            setCSS("#loginpopup","visibility","hidden")
            console.log("Logget inn")
            setHTML("#info","Logget inn som " + u.displayName)
            setCSS("#pic","visibility","visible")
            setCSS("#pic","height","100px")
            setCSS("#pic","width","100px")
            getElement("#pic").src = u.photoURL
        } else {
            setCSS("#pic","visibility","hidden")
            setHTML("#info","")
            console.log("ikke logget inn")
            setHTML("#loginBtn","Login")
            setCSS("#loginpopup","visibility","hidden")
        }
    });

    //onclick for buttons
    document.getElementById("renderBtn").onclick = renderValues;
    document.getElementById("loginBtn").onclick = login;
    document.getElementById("saveBtn").onclick = saveToDatabase;
    document.getElementById("live").onclick = toggleLive;
    document.getElementById("signinGoogle").addEventListener('click', function() {
        loginWithProvider(new firebase.auth.GoogleAuthProvider())
    });
    document.getElementById("signinFacebook").addEventListener('click', function() {
        loginWithProvider(new firebase.auth.FacebookAuthProvider())
    });
    document.getElementById("signinGitHub").addEventListener('click', function() {
        loginWithProvider(new firebase.auth.GithubAuthProvider())
    });



}

//Bruker trykker på toggle live knapper
//Tidemann skal fikse her, har skrevet sudokode
function toggleLive() {
    var db = firebase.database()
    db.ref('projects/' + params["id"]).once('value').then(function(snapshot) {
        //Hvis prosjektet eksisterer
        if (snapshot.val()) {
            //Hvis det ikke finnes noe liveID for prosjektet
            if (!snapshot.val().liveID) {
                update = {}
                update['projects/' + params["id"] + "/liveID"] = liveID
                firebase.database().ref().update(update);
                listenLive()
            } else {
                db.ref('projects/' + params["id"] + "/liveID").remove();
                stopListeningLive()
            }
        }
    })
}

function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}
//Bruker trykker på save (Brukes ved manuell lagring)
function saveToDatabase() {
    if (user.uid) {
        //Henter tiden (Brukes senere for å lagre UTC tid i databasen)
        var d = new Date();
        //Sjekker om brukeren har skriverettigheter til dette prosjektet
        firebase.database().ref('users/' + user.uid + "/projects/" + params["id"]).once('value').then(function(snapshot) {
            if (snapshot.val()) {
                //Oppdaterer prosjektet med ny kode
                firebase.database().ref('projects/' + params["id"]).set({
                    js: javascriptPane.value,
                    html: HTMLPane.value,
                    css: CssPane.value,
                });
                //Oppdaterer tiden prosjektet er sist endret
                firebase.database().ref('users/' + user.uid + "/projects/" + params["id"]).set({
                    lastUpdated: new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()).toString(),
                });
            }
            //Hvis prosjektet ikke er i lista til brukeren
            else {
                //Genererer en unik nøkkel
                var key = firebase.database().ref('projects/').push().key
                //Sjekker om noen andre eier prosjektIDen som er i urlen
                firebase.database().ref('projects/' + params["id"]).once('value').then(function(snapshot) {
                    //hvis de gjør det blir de lagt til som author av prosjektet
                    if (snapshot.val()) {
                        firebase.database().ref('projects/' + key).set({
                            js: javascriptPane.value,
                            html: HTMLPane.value,
                            css: CssPane.value,
                            originalAuthor: snapshot.val().author
                        });
                    }
                    //Hvis ingen andre eier prosjektiden blir brukeren lagt til som originalAuthor
                    else {
                        firebase.database().ref('projects/' + key).set({
                            js: javascriptPane.value,
                            html: HTMLPane.value,
                            css: CssPane.value,
                            originalAuthor: user.displayName
                        });
                    }
                    firebase.database().ref('users/' + user.uid + "/projects/" + key).set({
                        created: new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()).toString()
                    });
                    window.location.replace(getURL() + "?id=" + key)
                });
            }
        });
    } else {
        alert("You have to be logged in to save")
    }
}

//Henter ut info fra database ved oppstart
//Tidemann skal fikse her, har skrevet sudokode
function getDatastFromDatabase() {
    firebase.database().ref('projects/' + params["id"]).once('value').then(function(snapshot) {
        //Sjekker om prosjektet eksisterer
        if (snapshot.val()) {
            //henter ut verdiene fra databasen og oppdaterer inputboksene
            javascriptPane.value = snapshot.val().js
            HTMLPane.value = snapshot.val().html
            CssPane.value = snapshot.val().css
            //Sjekker om du har liveID i uren
            if (snapshot.val().liveID == params["liveID"]) {
                listenLive()
            }
            else {
                stopListeningLive()
            }
        } else {
            stopListeningLive()
        }
    });
    //TODO: Sjekk om bruker eier prosjektet
}

//Tidemann skal fikse her, har skrevet sudokode
function listenLive() {
    if (!params["liveID"] == liveID)
        window.location.replace(getURL() + "?id=" + key + "&liveID=" + liveID)
    setHTML("#live", "Live coding: on")
    setCSS("#live", "color", "green")
    //TODO: Sjekk om bruker har tilgang til live session
    firebase.database().ref('projects/' + params["id"] + "/liveID").on('value', function(snapshot) {
        if (snapshot.val() == params["liveID"] || snapshot.val() == liveID) {
            firebase.database().ref('projects/' + params["id"] + "/css").on('value', function(snapshot) {
                CssPane.value = snapshot.val()
            })
            firebase.database().ref('projects/' + params["id"] + "/html").on('value', function(snapshot) {
                HTMLPane.value = snapshot.val()
            })
            firebase.database().ref('projects/' + params["id"] + "/js").on('value', function(snapshot) {
                javascriptPane.value = snapshot.val()
            })
        } else {
            stopListeningLive()
        }
    })
    CssPane.onkeyup = function() {
        update = {}
        update['projects/' + params["id"] + "/css"] = CssPane.value
        firebase.database().ref().update(update);
    }
    HTMLPane.onkeyup = function() {
        update = {}
        update['projects/' + params["id"] + "/html"] = HTMLPane.value

        firebase.database().ref().update(update);
    }
    javascriptPane.onkeyup = function() {
        update = {}
        update['projects/' + params["id"] + "/js"] = javascriptPane.value
        firebase.database().ref().update(update);
    }
}

//Tidemann skal fikse her, har skrevet sudokode
function stopListeningLive() {
    setHTML("#live", "Live coding: off")
    setCSS("#live", "color", "red")
    CssPane.onkeyup = null;
    HTMLPane.onkeyup = null;
    javascriptPane.onkeyup = null;

    firebase.database().ref('projects/' + params["id"] + "/css").off()
    firebase.database().ref('projects/' + params["id"] + "/html").off()
    firebase.database().ref('projects/' + params["id"] + "/js").off()
}

//Funksjon for loginknappen
function login() {
    //Hvis bruker er pålogget
    if (user) {
        firebase.auth().signOut();
        setHTML("#loginBtn","Logout")
        setCSS("#loginpopup","visibility","hidden")
    }
    //Hvis bruker ikke er pålogget
    else
        setHTML("#loginBtn","Login")
        setCSS("#loginpopup","visibility","visible")
}

//Henter ut parametere fra URLen
function getParams() {
    var parameters = {}
    //Henter url
    var url = window.location.href
    //Sjekker om det er parametere i url
    if (url.indexOf("?") > 0) {
        //Lagrer alle parametere i en string
        urlpart = url.substring(url.indexOf("?") + 1);
        //Deler opp alle parametere i urlen
        urlpart = urlpart.split("&")
        //Går gjennom alle parametere
        for (var i = 0; i < urlpart.length; i++) {
            //Deler opp key og value
            keyValueParams = urlpart[i].split("=")
            //Går gjennom alle key og value par
            for (var j = 0; j < keyValueParams.length; j += 2) {
                //Lagrer key value par i parameters
                parameters[keyValueParams[j]] = keyValueParams[j + 1]
            }
        }
    }
    //Returnerer parameters objektet
    return parameters
}

//Midlertidig funksjon slik at vi kan bruke localhost
function getURL() {
    var url = window.location.href
    if (url.indexOf("?") > 0)
        return url.substring(0, url.indexOf("?"));
    else
        return url
}


//Funksjoner for å endre DOM elementer
function getElement(selector) {
    if (selector.substring(0, 1) == "#")
        return document.getElementById(selector.substring(1))
    if (selector.substring(0, 1) == ".")
        return document.getElementsByClassName(selector.substring(1))
    else
        return document.getElementsByTagName(selector)
}
function setHTML(selector, text) {
    var element = getElement(selector)
    if (element.length) {
        for (var i = 0; i < element.length; i++) {
            element[i].innerHTML = text;
        }
    } else {
        element.innerHTML = text;
    }
}
function setCSS(selector, property, value) {
    var element = getElement(selector)
    if (element.length) {
        for (var i = 0; i < element.length; i++) {
            element[i].style[property] = value;
        }
    } else {
        element.style[property] = value;
    }
}
