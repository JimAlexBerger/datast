window.onload = function() {

    //Setup loginbutton text
    firebase.auth().onAuthStateChanged(function(u) {
        //The u argument conatins information about the user
        user = u
      if (u) {
          console.log(u)
          document.getElementById("loginBtn").innerHTML = "Logg ut";
      } else {
          document.getElementById("loginBtn").innerHTML = "Logg inn";

          console.log("ikke logget inn")
          console.log(u)
      }
    });

    //onclick for buttons
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
        }).catch(function(error) {
            console.warn("feil ved utlogging")
            console.log(error)
        });
    } else {
        loginWithGoogle()
    }
}

function render() {
    renderValues();
}
