var app = angular.module('app', ['ui.bootstrap', 'angular-growl']);


app.controller('appCtrl', ['$scope', '$http', '$location', 'growl', function ($scope, $http, $location, growl) {

  // A4 width/height in 'mm'
  //$scope.cert_width = 148.5;
  //$scope.cert_height = 105;

  $scope.cert_width = 1123;
  $scope.cert_height = 794;
  $scope.prev_factor = 0.5;
  $scope.selected_template_id = 1;

  var templateId = $location.path().replace(/[^0-9]/g, '');
  console.info("path: " + $location.path() + ", id: " + templateId);
  if (templateId) {
    $scope.selected_template_id = templateId;
  }


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

  $scope.showCounter = function () {
    console.info(". ");
  };


  $scope.status = {
    isopen: false
  };


  $scope.toggleDropdown = function ($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.status.isopen = !$scope.status.isopen;
  };


  $scope.getTemplateBaseUrl = function () {
    return 'template/' + $scope.selected_template_id;
  };

  $scope.selectTemplate = function (id) {
    $scope.selected_template_id = id;

    refreshData();
  };

  function refreshData() {
    $http.get($scope.getTemplateBaseUrl() + '/data.json').success(function (data) {

      $scope.cert = processData(data);
      console.log("data: " + JSON.stringify(data));
    });
  };

  refreshData();


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

  function calcYfromTopForPdf(y, font_size) {

    var font_factor = 0.75;
    var res = (y + ( (1 ) * (font_size * font_factor)));
    return res;


  }

  $scope.test = function () {
    testMakeAllPdf();
  };

  function testMakeAllPdf() {
    for (var i = 1; i < 10; i++) {
      (function (templateId) {
        $http.get("template/" + templateId + '/data.json').success(function (data) {

          var db = processData(data);
          $scope.makePdf(templateId, db);

          console.log("data: " + JSON.stringify(data));
        });
      })(i);
    }
  }


  $scope.makePdf = function (templateId, certDb) {

    console.info("preview clicked, cert: " + JSON.stringify(certDb));

    growl.info('Generating Pdf....', {ttl: 2000});

    (function (templateId, certDb) {
      $http.get("template/" + templateId + '/bg.b64').success(function (data) {

        var bg_base64 = data;
        var docPt = new jsPDF("landscape", "pt", "a4");

        try {
          docPt.addImage(bg_base64, 0, 0, 0, 0);

          for (var key in certDb) {
            var field = certDb[key];

            var x_pt = px2pt(field.x);
            var y_pt = px2pt(field.y);
            var size_pt = px2pt(field.font_size);

            var x = calcXfromCenterForPdf(x_pt, field.txt, field.font_size);
            var y = calcYfromTopForPdf(y_pt, field.font_size);
            docPt.setFontSize(size_pt);
            docPt.setFont(field.font_family, field.font_style);
            docPt.text(x, y, field.txt);

          }


          docPt.save('certificate-' + templateId + '.pdf');
        } catch (e) {
          console.log('' + e);
          growl.error('' + e, {ttl: 3000});

        }
        //makePdf_px($scope.cert, bg_base64);
        //docPx.save('cert-px.pdf');
      })
    })(templateId, certDb);

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
    w.document.write('<link rel="stylesheet" href="../styles/print.css" type="text/css" />');
    w.document.write('</head><body >');

    w.document.write(printContents);
    w.document.write('</body></html>');

    w.document.close(); // necessary for IE >= 10
    w.focus(); // necessary for IE >= 10

    w.print();
    w.close();


  };

  $scope.outerStyle = function (field) {
    return {
      'position': 'absolute',
      'left': (field.x ? field.x : cert_width / 2) + 'px'
      , 'top': field.y + 'px'
    }
  };

  $scope.innerStyle = function (field) {
    return {
      'font-family': field.font_family,
      'font-style': field.font_style,
      'font-size': field.font_size + 'px'
      , 'width': $scope.cert_width + 'px'
    }
  };

  $scope.updateField = function(name, x, y) {
    console.info('update field: ' + name + " x, " + x + ", y:" + y);

    $scope.cert[name].x = x;
    $scope.cert[name].y = y;

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



//  http://stackoverflow.com/questions/6230834/html5-drag-and-drop-anywhere-on-the-screen

function drag_start(event, field) {

  console.info('field: ' + field);
  var style = window.getComputedStyle(event.target, null);
  var str = (parseInt(style.getPropertyValue("left")) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top")) - event.clientY) + ',' + event.target.id;
  event.dataTransfer.setData("Text", str);
}

function drop(event) {
  var offset = event.dataTransfer.getData("Text").split(',');
  var dm = document.getElementById(offset[2]);

  var x = event.clientX + parseInt(offset[0], 10);
  var y = (event.clientY + parseInt(offset[1], 10));
  dm.style.left = x + 'px';
  dm.style.top = y + 'px';
  angular.element(event.srcElement).scope().updateField(event.srcElement.id, x, y);
  //angular.element(event.srcElement).scope().selected_template_id

  event.preventDefault();
  return false;
}

function drag_over(event) {
  event.preventDefault();
  return false;
}
