var user;
// Initialize Firebase
var config = {
    apiKey: "AIzaSyCWo8BV5Su4ASaNj-JE2nr5p4QGHKtSPWA",
    authDomain: "datast-24d32.firebaseapp.com",
    databaseURL: "https://datast-24d32.firebaseio.com",
    projectId: "datast-24d32",
    storageBucket: "datast-24d32.appspot.com",
    messagingSenderId: "671327180228"
};
firebase.initializeApp(config);

firebase.auth().onAuthStateChanged(function(u) {
    //The u argument conatins information about the user
    user = u
  if (u) {
      console.log(u)
  } else {
      console.log("ikke logget inn")
      console.log(u)
  }
});
