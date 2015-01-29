var app = angular.module('app', ['ui.bootstrap']);

app.controller('appCtrl',  ['$scope', '$http', function ($scope, $http) {

  // A4 width/height in 'mm'
  //$scope.cert_width = 148.5;
  //$scope.cert_height = 105;

  $scope.cert_width = 1123;
  $scope.cert_height = 792;
  $scope.prev_factor = 0.5;

  var fontFamilies = ['times', 'helvetica'];  // 'courier' has spacing problem with PDF.

  var fontStyles = ['normal', 'italic', 'bold', 'bolditalic'];

  function processData(data) {

    for (var key in data) {
      var field = data[key];

      if (!field.x) {
        field.x = $scope.cert_width / 2;
      }

      if (!field.font_family) {
        field.font_family = fontFamilies[0];
      }

      if (!field.font_style) {
        field.font_style = fontStyles[0];
      }
    }


    return data;
  }

  var certUrl = 'template/1/';

  $http.get(certUrl + 'data.json').success(function (data) {

    $scope.cert = processData(data);


    console.log("data: " + JSON.stringify(data));
  });

  $scope.abc = 'def';


  $scope.keys = ["title", "action", "recipient", "reason", "date"];

  function px2pt(v) {
    var k = 72 / 96;
    return v * k;
   //case 'px':  k = 96 / 72;    break; 1.33333333

    //var px2pt = 0.264583 * 72 / 25.4;
    //return v * px2pt;

  }

  function calcXfromCenterForPdf(centerX, txt, font_size) {



    //var center = 841.89 / 2;
    //var font_factor = 0.48;
    var font_factor = 0.35;
    var res = (centerX - ( (txt.length / 2) * (font_size * font_factor)));
    return res;


  }

  function calcYfromTopForPdf(y,  font_size) {

    var font_factor = 0.75;
    var res = (y + ( (1 ) * (font_size * font_factor)));
    return res;


  }

  $scope.makePdf = function () {

    console.info("preview clicked, cert: " + JSON.stringify($scope.cert));

    $http.get(certUrl + 'bg.b64').success(function (data) {

      var bg_base64 = data;
      var docPt = new jsPDF("landscape", "pt", "a4");


      docPt.addImage(bg_base64, 0, 0, 0, 0);

      for (var key in $scope.cert) {
        var field = $scope.cert[key];

        x_pt = px2pt(field.x);
        y_pt = px2pt(field.y);
        size_pt = px2pt(field.font_size);

        var x = calcXfromCenterForPdf(x_pt, field.txt, field.font_size);
        var y = calcYfromTopForPdf(y_pt, field.font_size);
        docPt.setFontSize(size_pt);
        docPt.setFont(field.font_family, field.font_style);
        docPt.text(x, y, field.txt);

      }


      docPt.save('cert-pt.pdf');
      //makePdf_px($scope.cert, bg_base64);
      //docPx.save('cert-px.pdf');
    });
  };

  function makePdf_px(cert, bg_base64) {
    var docPx = new jsPDF("landscape", "px", "a4");

    docPx.addImage(bg_base64, 0, 0, 0, 0);
    for (var key in $scope.cert) {
      var field = $scope.cert[key];

      var fontName = "times";
      if (field.font_family) {
        fontName = field.font_family;
      }

      var x = calcXfromCenterForPdf(field.x, field.txt, field.font_size);
      docPx.setFontSize(field.font_size);
      docPx.setFont(field.font_family, field.font_style);
      docPx.text(x, field.y, field.txt);

    }


    docPx.save('cert-px.pdf');

  }

  $scope.print = function () {
    console.info("preview clicked, cert: " + JSON.stringify($scope.cert));

    var printContents = document.getElementById('preview').innerHTML;

    var w = window.open('', 'my div', 'height=600,width=800');

    w.document.write('<html><head>');
    w.document.write('<link rel="stylesheet" href="styles/print.css" type="text/css" />');
    w.document.write('</head><body >');

    w.document.write(printContents);
    w.document.write('</body></html>');

    w.document.close(); // necessary for IE >= 10
    w.focus(); // necessary for IE >= 10

    w.print();
    w.close();


  };

  $scope.outerStyle = function(field) {
    return {'position': 'absolute',
      'left': (field.x ? field.x : cert_width/2) + 'px'
      ,'top': field.y +'px'
    }
  };

  $scope.innerStyle = function (field) {
    return {
      'font-family': field.font_family,
      'font-style': field.font_style,
      'font-size': field.font_size + 'px'
      , 'width': $scope.cert_width +'px'
    }
  };


  $scope.incFontSize = function (field) {
    field.font_size += 1;
    console.info("size" + field.font_size);
  };

  $scope.decFontSize = function (field) {
    field.font_size -= 1;
  };

  $scope.incY = function (field) {
    field.y += 1;
  };
  $scope.decY = function (field) {
    field.y -= 1;
  };

  $scope.incX = function (field) {
    if (!field.x) {
      field.x = $scope.cert_width / 2;
    }
    field.x += 1;
  };
  $scope.decX = function (field) {
    if (!field.x) {
      field.x = $scope.cert_width / 2;
    }
    field.x -= 1;
  };

}])
;
