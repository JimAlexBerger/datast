document.onload = function(){
    firebase.auth().signInWithPopup(provider);
}
