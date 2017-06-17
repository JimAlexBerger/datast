var user = {}
window.onload = function() {
    getdatastFromDatabase()
    //Sjekker om bruker er pålogget via google
    firebase.auth().onAuthStateChanged(function(u) {
        user = u
        if (u) {
            setLoginMenu("hidden", "Logout")
            console.log("Logget inn")
        } else {
            console.log("ikke logget inn")
            setLoginMenu("hidden", "Login")
        }
    });

    //onclick for buttons
    document.getElementById("renderBtn").onclick = renderValues;
    document.getElementById("loginBtn").onclick = login;
    document.getElementById("saveBtn").onclick = saveToDatabase;
    document.getElementById("signinGoogle").addEventListener('click', function() {
        loginWithProvider(new firebase.auth.GoogleAuthProvider())
    });
    document.getElementById("signinFacebook").addEventListener('click', function() {
        loginWithProvider(new firebase.auth.FacebookAuthProvider())
    });
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

function saveToDatabase() {
    if (user.uid) {
        //Henter parametere
        var params = getParams();
        //Henter tiden (Brukes senere for å lagre UTC tid i databasen)
        var d = new Date();
        //Sjekker om brukeren har skriverettigheter til dette prosjektet
        return firebase.database().ref('users/' + user.uid + "/projects/" + params["id"]).once('value').then(function(snapshot) {
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
                return firebase.database().ref('projects/' + params["id"]).once('value').then(function(snapshot) {
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
                    console.log("WHAT??!")
                    window.location.replace("https://datast-24d32.firebaseapp.com/?id=" + key)
                });
            }
        });
    } else {
        alert("You have to be logged in to save")
    }
}

function getdatastFromDatabase() {
    var params = getParams()
    return firebase.database().ref('projects/' + params["id"]).once('value').then(function(snapshot) {
        if (snapshot.val()) {
            javascriptPane.value = snapshot.val().js
            HTMLPane.value = snapshot.val().html
            CssPane.value = snapshot.val().css
        }
    });
}

function login() {
    //Hvis bruker er pålogget
    if (user) {
        firebase.auth().signOut();
        setLoginMenu("hidden", "Logout")
    }
    //Hvis bruker ikke er pålogget
    else
        setLoginMenu("visible", "Login")
}

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

function setLoginMenu(visibility, loginButtonText) {
    document.getElementById("loginBtn").innerHTML = loginButtonText;
    document.getElementById("loginpopup").style.visibility = visibility
}
