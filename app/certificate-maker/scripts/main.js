$("#makePdf").click(function () {

  var doc = new jsPDF("landscape", "pt", "a4");


  var url = "template/1/data.json";
  $.getJSON(url, null, function (data, status, xhr) {
    //console.log("status: " + status + ", xhr: " + xhr + ",data : " + JSON.stringify(data) );
    console.log("status: " + status + ", xhr: " + xhr + ",data : " + JSON.stringify(data.title) );


    makePdf(data);

  });

  function makePdf(data) {
    var props = ['title', 'action', 'recipient', 'reason', 'date'];


    doc.addImage(data.base64, 0,0,0,0);

    function px2pt(x) {
      var px2pt = 0.264583 * 72 / 25.4
      return x * px2pt;

    }

    function calcXfromCenter(centerX, txt, font_size) {
      //var font_factor = 96 / 72; // font size in pixel,
      //var font_factor = 0.5; // font size in pixel,

      //var res = px2pt(centerX - ( (txt.length / 2) *  (font_size)));
      var center = 841.89/2;
      var font_factor = 0.48;
      var res = (center - ( (txt.length / 2) *  (font_size * font_factor)));

      console.log("res : " + res);
      return res;
      //return 841.89/2;
    }


    for (var i in props) {
      var prop = data[props[i]];

      //var style = ;

      // 	helvetica         : "helvetica",
      //"sans-serif"      : "helvetica",
      //  "times new roman" : "times",
      //  serif             : "times",
      //  times             : "times",
      //  monospace         : "courier",
      //  courier           : "courier"
      var fontName = "times";
      if(prop.font_name) {
        fontName = prop.font_name;
      }
      doc.setFontSize(prop.font_size);
      //doc.setFont(fontName);


      var x = calcXfromCenter( px2pt(prop.loc[0]), prop.txt, prop.font_size);
      doc.text(x, px2pt(prop.loc[1]), prop.txt);


      //doc.text(prop.text, prop.loc[0], prop.loc[1]);

      console.log(JSON.stringify(prop));
    }



    doc.save('Test.pdf');

  }


});
