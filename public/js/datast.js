/*Copyright (c) 2010, Ajax.org B.V.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of Ajax.org B.V. nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/

//Global variables
var user = {}
var params;
var datast = {js:null,html:null,css:null};
var db;
var liveCoding = false;
var typingTimer;
var doneTypingInterval = 500;

toastr.options = {
  "positionClass": "toast-top-center",
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut",
  "preventDuplicates": true
}

window.onload = function() {
    db = firebase.database();
    params = getParams()
    getDatastFromDatabase();
    //Checking if user is logged in
    firebase.auth().onAuthStateChanged(function(u) {
        user = u;
        if (u) {
            console.log("Signed in")
            setCSS("#saveBtn","display","inline-block")
            setHTML("#loginBtn", "Logout")
            setCSS("#loginpopup", "visibility", "hidden")
            setHTML("#info", "Signed in as " + u.displayName)
            setCSS("#pic", "visibility", "visible")
            setCSS("#pic", "height", "100px")
            setCSS("#pic", "width", "100px")
            getElement("#pic").src = u.photoURL
        } else {
            console.log("Not logged in")
            setCSS("#saveBtn","display","none")
            setCSS("#pic", "display", "none")
            setHTML("#info", "")
            setHTML("#loginBtn", "Login")
            setCSS("#loginpopup", "visibility", "hidden")
        }
    });

    //onclick for buttons
    getElement("#renderBtn").onclick = renderValues;
    getElement("#loginBtn").onclick = login;
    getElement("#saveBtn").onclick = saveToDatabase;
    getElement("#fork").onclick = fork;
    getElement("#live").onclick = toggleLive;
    getElement("#settings").onclick = toggleSettings;
    getElement("#togglePublicLive").onclick = togglePublicLive;
    getElement("#signinGoogle").addEventListener('click', function() {
        loginWithProvider(new firebase.auth.GoogleAuthProvider())
    });
    getElement("#signinFacebook").addEventListener('click', function() {
        loginWithProvider(new firebase.auth.FacebookAuthProvider())
    });
    getElement("#signinGitHub").addEventListener('click', function() {
        loginWithProvider(new firebase.auth.GithubAuthProvider())
    });
    getElement("#signinTwitter").addEventListener('click', function() {
        loginWithProvider(new firebase.auth.TwitterAuthProvider())
    });

    //Save to database when ctrl + S is pressed
    document.addEventListener("keydown", function(e) {
      if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        saveToDatabase();
      }
    }, false);

    datast.js = ace.edit("javascriptPane");
    datast.js.setTheme("ace/theme/dawn");
    datast.js.session.setMode("ace/mode/javascript");

    datast.html = ace.edit("HTMLPane");
    datast.html.setTheme("ace/theme/dawn");
    datast.html.session.setMode("ace/mode/html");

    datast.css = ace.edit("CssPane");
    datast.css.setTheme("ace/theme/dawn");
    datast.css.session.setMode("ace/mode/css");

    stopListeningLive();
    getPublicLive();

    //Editors onkeydown functions
    javascriptPane.onkeydown = function() {
        clearTimeout(typingTimer);
    };
    HTMLPane.onkeydown = function() {
        clearTimeout(typingTimer);
    };
    CssPane.onkeydown = function() {
        clearTimeout(typingTimer);
    };

}

function checkPlaceholderText() {
    updatePlaceholder(datast.js,"Javascript code goes here");
    updatePlaceholder(datast.html,"HTML code goes here");
    updatePlaceholder(datast.css,"CSS code goes here");
}

function setSelection(id, start, end) {
    var input = document.getElementById(id);
    input.focus();
    input.setSelectionRange(start, end);
}

function updatePlaceholder(editor,text) {
    var shouldShow = !editor.session.getValue().length;
    var node = editor.renderer.emptyMessageNode;
    if (!shouldShow && node) {
        editor.renderer.scroller.removeChild(editor.renderer.emptyMessageNode);
        editor.renderer.emptyMessageNode = null;
    } else if (shouldShow && !node) {
        node = editor.renderer.emptyMessageNode = document.createElement("div");
        node.textContent = text;
        node.className = "ace_invisible ace_emptyMessage"
        node.style.padding = "0 9px"
        editor.renderer.scroller.appendChild(node);
    }
}

function toggleLive() {
    if(liveCoding) {
        liveCoding = false;
        setHTML("#live", "Live coding: off")
        setCSS("#live", "color", "red")
        stopListeningLive()
    } else {
        liveCoding = true;
        setHTML("#live", "Live coding: on")
        setCSS("#live", "color", "green")
        listenLive();
    }
}

function saveToDatabase() {
    if (user) {
        var key = (params["id"]?params["id"]:db.ref().push().key);
        var promise = firebase.database().ref('projects/' + key).set({
            config: {
                ownerID: user.uid,
                publicLive: false,
            },
            content: {
                js: datast.js.getValue(),
                html: datast.html.getValue(),
                css: datast.css.getValue(),
            }
        });

        promise.then(() => {
            toastr["success"]("", "Saved to database");
            if(!params["id"]) {
                window.location.replace(getURL() + "?id=" + key);
            }


        });
        promise.catch(() => {

            toastr["error"]("", "You do not have write access for this project")
        });

    } else {
        toastr["info"]("", "You have to be logged in to save")
    }
}

function getDatastFromDatabase() {
    //Checking for projectID in url
    if(params["id"]) {
        db.ref('projects/' + params["id"] + '/content').once('value').then(function(snapshot) {
            if(snapshot.val()) {
                datast.js.setValue(snapshot.val().js);
                datast.html.setValue(snapshot.val().html);
                datast.css.setValue(snapshot.val().css);
                checkPlaceholderText();
                renderValues();
            }
        });
    }
    else {
        document.addEventListener('DOMContentLoaded', function() {
            checkPlaceholderText();
        });
    }
}

function fork() {
    if (user) {
        var key = db.ref().push().key;
        var promise = firebase.database().ref('projects/' + key).set({
            config: {
                ownerID: user.uid,
                publicLive: false,
            },
            content: {
                js: datast.js.getValue(),
                html: datast.html.getValue(),
                css: datast.css.getValue(),
            }
        });

        promise.then(() => {
            toastr["success"]("", "Forked project");
            window.location.replace(getURL() + "?id=" + key);
        });
        promise.catch(() => {
            toastr["error"]("Code: 001", "Something went wrong")
        });
    } else {
        toastr["info"]("", "You have to be logged in to fork a project")
    }
}

function listenLive() {
    db.ref('projects/' + params["id"] + "/content/css").on('value', function(snapshot) {
        if(snapshot.val() !=  datast.css.getValue()) {
            datast.css.setValue(snapshot.val());
            resetTimer(datast.css,"Css code goes here")
        }
    })
    db.ref('projects/' + params["id"] + "/content/html").on('value', function(snapshot) {
        if(snapshot.val() !=  datast.html.getValue()) {
            datast.html.setValue(snapshot.val());
            resetTimer(datast.html,"HTML code goes here")
        }
    })
    db.ref('projects/' + params["id"] + "/content/js").on('value', function(snapshot) {
        if(snapshot.val() !=  datast.js.getValue()) {
            datast.js.setValue(snapshot.val());
            resetTimer(datast.js,"Javascript code goes here")
        }
    })

    CssPane.onkeyup = function() {
        update = {}
        update['projects/' + params["id"] + "/content/css"] = datast.css.getValue()
        db.ref().update(update).catch(function() {
            toastr["info"]("But you can still watch live", "You dont have write access")
        });
        resetTimer(datast.css,"Css code goes here")
    }
    HTMLPane.onkeyup = function() {
        update = {}
        update['projects/' + params["id"] + "/content/html"] = datast.html.getValue()
        db.ref().update(update).catch(function() {
            toastr["info"]("But you can still watch live", "You dont have write access")
        });
        resetTimer(datast.html,"HTML code goes here")

    }
    javascriptPane.onkeyup = function() {
        update = {}
        update['projects/' + params["id"] + "/content/js"] = datast.js.getValue()
        db.ref().update(update).catch(function() {
            toastr["info"]("But you can still watch live", "You dont have write access")
        });
        resetTimer(datast.js,"Javascript code goes here")

    }
}

function resetTimer(editor,text) {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(renderValues, doneTypingInterval);
    updatePlaceholder(editor,text);
}

function stopListeningLive() {
    javascriptPane.onkeyup = function() {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(renderValues, doneTypingInterval);
        updatePlaceholder(datast.js,"Javascript code goes here");
    };
    HTMLPane.onkeyup = function() {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(renderValues, doneTypingInterval);
        updatePlaceholder(datast.html,"HTML code goes here");
    };
    CssPane.onkeyup = function() {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(renderValues, doneTypingInterval);
        updatePlaceholder(datast.css,"CSS code goes here");
    };


    db.ref('projects/' + params["id"] + "content/css").off()
    db.ref('projects/' + params["id"] + "content/html").off()
    db.ref('projects/' + params["id"] + "content/js").off()
}

//Funksjon for loginknappen
function login() {
    //if user is logged in
    if (user) {
        firebase.auth().signOut();
        setHTML("#loginBtn", "Logout")
        setCSS("#loginpopup", "visibility", "hidden")
    }
    else {
        setHTML("#loginBtn", "Login")
        if(getElement("#loginpopup").style.visibility == "visible") {
            setCSS("#loginpopup", "visibility", "hidden")
        } else {
            setCSS("#loginpopup", "visibility", "visible")
        }

    }
}

function toggleSettings() {
    if(document.getElementById("settingspopup").style.visibility == "visible") {
        setCSS("#settingspopup", "visibility", "hidden")
    }else {
        setCSS("#settingspopup", "visibility", "visible")
    }

}

function getPublicLive() {
    if(user && params["id"]) {
        db.ref('projects/' + params["id"] + '/config').once('value').then(function(snapshot) {
            getElement("#togglePublicLive").innerHTML = (snapshot.val().publicLive?"on":"off")
            setCSS("#togglePublicLive","color",(snapshot.val().publicLive?"green":"red"));
        }).catch(function() {
            console.log()
        })
    } else {

    }
}

function togglePublicLive() {
    db.ref('projects/' + params["id"] + '/config').once('value').then(function(snapshot) {
        update = {}
        update['projects/' + params["id"] + '/config/publicLive'] = !snapshot.val().publicLive
        db.ref().update(update).then(function(){
            getElement("#togglePublicLive").innerHTML = (!snapshot.val().publicLive?"on":"off")
            setCSS("#togglePublicLive","color",(!snapshot.val().publicLive?"green":"red"))
        });
    });
}

//Henter ut parametere fra URLen
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

//get url without paramteres
function getURL() {
    var url = window.location.href
    if (url.indexOf("?") > 0)
        return url.substring(0, url.indexOf("?"));
    else
        return url
}

//Funksjoner for å endre DOM elementer
function getElement(selector) {
    if (selector.substring(0, 1) == "#")
        return document.getElementById(selector.substring(1))
    if (selector.substring(0, 1) == ".")
        return document.getElementsByClassName(selector.substring(1))
    else
        return document.getElementsByTagName(selector)
}

function setHTML(selector, text) {
    var element = getElement(selector)
    if (element.length) {
        for (var i = 0; i < element.length; i++) {
            element[i].innerHTML = text;
        }
    } else {
        element.innerHTML = text;
    }
}

function setCSS(selector, property, value) {
    var element = getElement(selector)
    if (element.length) {
        for (var i = 0; i < element.length; i++) {
            element[i].style[property] = value;
        }
    } else {
        element.style[property] = value;
    }
}
