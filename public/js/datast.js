window.onload = function() {
    getdatastFromDatabase()
    checkFacebookLoginState()
    firebase.auth().onAuthStateChanged(function(u) {
        user = u
        if (u) {
            console.log("Logget inn med Google")
            console.log(u)
            document.getElementById("loginBtn").innerHTML = "Logout";
            document.getElementById("loginpopup").style.visibility = "hidden"

        } else {
            document.getElementById("loginBtn").innerHTML = "Login";
            console.log("ikke logget inn med Google")
        }
    });

    //onclick for buttons
    document.getElementById("renderBtn").onclick = renderValues;
    document.getElementById("loginBtn").onclick = login;
    document.getElementById("saveBtn").onclick = saveToDatabase;
    document.getElementById("signinGoogle").onclick = loginWithGoogle
    document.getElementById("signinFacebook").onclick = loginWithFacebook
}

function saveToDatabase() {
    if (checkFacebookLoginState() == "connected") {

    } else if (user) {
        //TODO:
        //Henter parametere
        var params = getParams();
        //Henter tiden (Brukes senere for å lagre UTC tid i databasen)
        var d = new Date();
        return firebase.database().ref('users/' + user.uid + "/projects/" + params["id"]).once('value').then(function(snapshot) {
            //Sjekker om prosjektiden i urlen allerede finnes i prosjektlista
            //Hvis den gjør det så er det ditt eget prosjekt
            if (snapshot.val()) {
                firebase.database().ref('projects/' + params["id"]).set({
                    js: javascriptPane.value,
                    html: HTMLPane.value,
                    css: CssPane.value,
                });
                firebase.database().ref('users/' + user.uid + "/projects/" + params["id"]).set({
                    lastUpdated: new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()).toString(),
                });
            }
            //Finnes ikke fra før
            else {
                //Genererer en unik nøkkel
                var key = firebase.database().ref('projects/').push().key
                //Sjekker om noen andre eier prosjektet
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
                });
                firebase.database().ref('users/' + user.uid + "/projects/" + key).set({
                    created: new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()).toString()
                });
                window.location.replace("https://datast-24d32.firebaseapp.com/?id=" + key)
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
    //TODO:
    //Sjekk hvilken måte brukeren er logget inn på (Facebook, Google, gitub osv)
    //Sjekker om bruker er logget på faebook
    if (checkFacebookLoginState() == "connected") {
        FB.logout(function(response) {
            document.getElementById("loginpopup").style.visibility = "hidden"
            document.getElementById("loginBtn").innerHTML = "Login";
        });
    }
    //Sjekker om bruker er logget på med google
    else if (user) {
        firebase.auth().signOut().then(function() {
            document.getElementById("loginpopup").style.visibility = "hidden"
            document.getElementById("loginBtn").innerHTML = "Login";
        }).catch(function(error) {
            console.warn("feil ved utlogging")
            console.log(error)
        });
    }
    //Bruker er ikke logget på
    else {
        document.getElementById("loginBtn").innerHTML = "Login";
        document.getElementById("loginpopup").style.visibility = "visible"
    }
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
