function loginWithProvider(provider) {
    firebase.auth().signInWithPopup(provider).then(function(result) {
    }).catch(function(error) {
        console.warn("Error during login")
        // Handle Errors here.
        var errorCode = error.code;
        console.log("Errorcode: " + errorCode)
        var errorMessage = error.message;
        console.log("errorMessage: " + errorMessage)

        // The email of the user's account used.
        var email = error.email;
        console.log("users email: " + email)

        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        console.log("credential: " + credential)
        // ...
    });
}
