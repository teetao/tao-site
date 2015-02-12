var app = angular.module('app', ['ui.bootstrap', 'angular-growl']);


app.controller('appCtrl', ['$scope', '$http', '$location', 'growl', function ($scope, $http, $location, growl) {

  // A4 width/height in 'mm'
  //$scope.cert_width = 148.5;
  //$scope.cert_height = 105;

  $scope.cert_width = 794;
  $scope.cert_height = 1123;

  $scope.prev_factor = 0.5;
  $scope.selected_template_id = 1;

  $scope.input_names = "James Richard, John Smith,Robert Johnson,Frank Williams,Paul Wilson,Mary,Donna,Susan,Elizabeth,Margaret,Michelle";
  $scope.input_names = $scope.input_names.replace(/,/g, '\n');

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
        field.x = $scope.cert_width / 4;
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


  $scope.keys = ["info"];

  function px2pt(v) {
    var k = 72 / 96;
    return v * k;
  }

  function calcXfromCenterForPdf(centerX, txt, font_size) {
    var font_factor = 0.35;
    var res = (centerX - ( (txt.length / 2) * (font_size * font_factor)));

    //console.info("txt length: " )
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

  $scope.getFirstName = function() {

    var names = $scope.input_names.split('\n');
    if(names && names[0]) {
      return names[0];
    }

    return "type names on the left";
  };



  $scope.makePdf = function (templateId, certDb) {

    console.info("preview clicked, cert: " + JSON.stringify(certDb));

    growl.info('Generating Pdf....', {ttl: 2000});


    function isEven(n) {
      return (n % 2) == 0;
    }

    (function (templateId, certDb) {
      $http.get("template/" + templateId + '/bg.b64').success(function (data) {

        var bg_base64 = data;

        var pdf = new jsPDF("portrait", "pt", "a4");


        var names = $scope.input_names.split('\n');

        try {
          var baseX = 0;

          var halfWidth = px2pt($scope.cert_width / 2);
          var halfHeight = px2pt($scope.cert_height / 2);
          var oneFourthHeight = halfHeight / 2;

          var baseY = oneFourthHeight;

          var xDelta = halfWidth;
          var yDelta = halfHeight;

          for (var i = 0; i < names.length; i++) {

            console.info("name: " + names[i]);
            if (i > 0) {

              baseX = isEven(i) ? 0 : xDelta;
              baseY += !isEven(i) ? 0 : yDelta;

              if (i % 4 == 0) {


                pdf.addPage();
                baseX = 0;
                baseY = oneFourthHeight;
              }
            }

            var margin = 5;


            pdf.addImage("data:image/png;base64," + bg_base64, baseX, baseY, 0, 0);
            pdf.setLineWidth(1);

            pdf.rect(baseX + margin, baseY - oneFourthHeight + margin, halfWidth - 2 * margin, halfHeight - 2 * margin, 'S');
            pdf.setLineWidth(0.5);
            pdf.line(baseX + margin * 2, baseY, baseX + halfWidth - margin * 2, baseY);


            var field = certDb.info;
            var x_pt = px2pt(field.x);
            var y_pt = px2pt(field.y);
            var size_pt = px2pt(field.font_size);

            var x = calcXfromCenterForPdf(x_pt, names[i], field.font_size);
            var y = calcYfromTopForPdf(y_pt, field.font_size);
            pdf.setFontSize(size_pt);
            pdf.setFont(field.font_family, field.font_style);
            pdf.text(baseX + x, baseY + y, names[i]);

          }

          pdf.save('place-cards-' + templateId + '.pdf');
        } catch (e) {
          console.log('' + e);
          growl.error('' + e, {ttl: 3000});

        }
      })
    })(templateId, certDb);

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
      , 'width': $scope.cert_width / 2 + 'px'
    }
  };

  $scope.updateField = function (name, x, y) {
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
    console.info("size" + field.font_size);
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
