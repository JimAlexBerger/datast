window.onload = function() {
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
    document.getElementById("renderBtn").onclick = render;
    document.getElementById("loginBtn").onclick = login;
    document.getElementById("saveBtn").onclick = saveToDatabase;
    document.getElementById("signinGoogle").onclick = loginWithGoogle
    document.getElementById("signinFacebook").onclick = loginWithFacebook
}

function saveToDatabase() {
    console.log("lagra, lover")
}

function login() {
    //TODO:
    //Sjekk hvilken måte brukeren er logget inn på (Facebook, Google, gitub osv)

    if (checkFacebookLoginState()) {
        FB.logout(function(response) {
            console.log(response)
        });
    }
    if (user) {
        firebase.auth().signOut().then(function() {}).catch(function(error) {
            console.warn("feil ved utlogging")
            console.log(error)
        });
    } else {
        document.getElementById("loginpopup").style.visibility = "visible"
    }
}

function render() {
    renderValues();
}
