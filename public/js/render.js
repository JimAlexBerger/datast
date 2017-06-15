function renderValues(){
    var css = document.getElementById("CssPane").value;
    var html = document.getElementById("HTMLPane").value;
    var js = document.getElementById("javascriptPane").value;
    var result = '<html><head><style>' + css + '</style></head><body>' + html + '<script type="text/javascript">' + js + '</script></body></html>'
    var iframe = document.getElementById('OutputPane');

    if (iframe.contentDocument) doc = iframe.contentDocument;
    else if (iframe.contentWindow) doc = iframe.contentWindow.document;
    else doc = iframe.document;

    doc.open();
    doc.writeln(result);
    doc.close();
}
