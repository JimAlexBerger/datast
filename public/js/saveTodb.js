const databaseRef = firebase.database().ref().child("prjoects")


var newData = {};
newData['/users/' + uid + '/last_update'] = Firebase.ServerValue.TIMESTAMP;
newData['/projects/' + /* NEW KEY ??? */] = {
  user: uid,
  ...
};
ref.update(newData);
