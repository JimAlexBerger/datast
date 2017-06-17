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
    if (checkFacebookLoginState()) {

    } else if (user) {
        //TODO:
        var params = getParams()
        if (params["id"]) {
            var d = new Date();
            firebase.database().ref('projects/' + params["id"]).set({
                js: javascriptPane.value,
                html: HTMLPane.value,
                css: CssPane.value
            });
            firebase.database().ref('users/' + user.uid + "/projects/" + params["id"]).set({
                lastUpdated: new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()).toString()
            });
            console.log("lagret i database")
        }
    } else {
        alert("You have to be logged in to save")
    }
}

function getdatastFromDatabase() {
    var params = getParams()
    return firebase.database().ref('projects/' + params["id"]).once('value').then(function(snapshot) {
        if(snapshot.val()) {
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
    if (checkFacebookLoginState()) {
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
