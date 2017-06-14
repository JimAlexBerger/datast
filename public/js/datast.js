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
        firebase.auth().signInWithPopup(provider)

    }
}

function render() {
    var css = document.getElementById("CssPane").innerHTML;
    var html = document.getElementById("HTMLPane").innerHTML;
    var js = document.getElementById("javascriptPane").innerHTML;
    var result = '<html><head><style>' + css + '</style></head><body>' + html + '<script type="text/javascript">' + js + '</script></body></html>'
    var iframe = document.getElementById('OutputPane');

    if (iframe.contentDocument) doc = iframe.contentDocument;
    else if (iframe.contentWindow) doc = iframe.contentWindow.document;
    else doc = iframe.document;

    doc.open();
    doc.writeln(result);
    doc.close();
}
