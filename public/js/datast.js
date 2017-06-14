window.onload = function() {
    console.log(user)
    if (user) {
        document.getElementById("loginBtn").innerHTML = "Logg ut";
    }
    document.getElementById("renderBtn").onclick = render;
    document.getElementById("loginBtn").onclick = login;
    document.getElementById("saveBtn").onclick = saveToDatabase;
}

function saveToDatabase() {
    console.log("lagra, lover")
}

function login() {
    if (user) {
        firebase.auth().signOut().then(function() {
            document.getElementById("loginBtn").innerHTML = "Logg inn";
        }).catch(function(error) {
            console.warn("feil ved utlogging")
            console.log(error)
        });
    } else {
        loginWithGoogle()
    });
}
}

function render() {
    renderValues();
}
