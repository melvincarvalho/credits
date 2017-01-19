var board,
statusEl = $('#status'),
fenEl = $('#fen'),
pgnEl = $('#pgn');


var f,g;
var db;

var CHAT  = $rdf.Namespace("https://ns.rww.io/chat#");
var CURR  = $rdf.Namespace("https://w3id.org/cc#");
var DCT   = $rdf.Namespace("http://purl.org/dc/terms/");
var FACE  = $rdf.Namespace("https://graph.facebook.com/schema/~/");
var FOAF  = $rdf.Namespace("http://xmlns.com/foaf/0.1/");
var LIKE  = $rdf.Namespace("http://ontologi.es/like#");
var LDP   = $rdf.Namespace("http://www.w3.org/ns/ldp#");
var MBLOG = $rdf.Namespace("http://www.w3.org/ns/mblog#");
var OWL   = $rdf.Namespace("http://www.w3.org/2002/07/owl#");
var PIM   = $rdf.Namespace("http://www.w3.org/ns/pim/space#");
var RDF   = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
var RDFS  = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
var SIOC  = $rdf.Namespace("http://rdfs.org/sioc/ns#");
var SOLID = $rdf.Namespace("http://www.w3.org/ns/solid/app#");
var URN   = $rdf.Namespace("urn:");

var AUTHENDPOINT = "https://databox.me/";
var PROXY = "https://rww.io/proxy.php?uri={uri}";
var TIMEOUT = 5000;
var DEBUG = true;

var scope = {};
var gg;

$rdf.Fetcher.crossSiteProxyTemplate=PROXY;

var App = angular.module('myApp', [
  'lumx',
  'ngAudio',
]);

App.config(function($locationProvider) {
  $locationProvider
  .html5Mode({ enabled: true, requireBase: false });
});


/**
 * The app controller
 */
App.controller('Main', function($scope, $http, $location, $timeout, $sce, ngAudio, LxNotificationService, LxProgressService, LxDialogService) {


  /**
   * Initialize app
   */
  $scope.initApp = function() {
    $scope.init();
  };

  /**
   * Initialize
   */
  $scope.init = function() {

    $scope.initStore();
    $scope.fetchPoints();
    $scope.initUI();
    $scope.points = 0;

  };

  /**
   * Init UI
   */
  $scope.initUI = function() {
    $scope.initialized = true;
    $scope.loggedIn = false;
    $scope.loginTLSButtonText = "Login";
    $scope.audio = ngAudio.load('audio/button-3.mp3');
  };

  /**
   * Init store
   */
  $scope.initStore = function() {
    // start in memory DB
    g = $rdf.graph();
    f = $rdf.fetcher(g);
    // add CORS proxy
    var PROXY      = "https://data.fm/proxy?uri={uri}";
    var AUTH_PROXY = "https://rww.io/auth-proxy?uri=";
    //$rdf.Fetcher.crossSiteProxyTemplate=PROXY;
    var kb         = $rdf.graph();
    var fetcher    = $rdf.fetcher(kb);
  };



  // RENDER functions
  /**
   * Render the main screen
   */
  $scope.render = function() {
  };

  /**
   * Refresh the board
   */
  $scope.refresh = function() {
    LxNotificationService.error('Refreshing');
    $scope.fetchPoints();
    $scope.fetchSeeAlso();
    $scope.render();
  };


  // QUEUE functions
  //
  //

  // FETCH functions
  //
  //
  /**
   * Fetch the points
   */
  $scope.fetchPoints = function () {
    navigator.vibrate(500);
    $scope.points = 0;
    var storageURI = 'https://melvin.databox.me/Public/inbox/';
    if ($location.search().storageURI) {
      storageURI = $location.search().storageURI;
    }
    $scope.storageURI = storageURI;
    connectToSocket($scope.storageURI);


    f.requestURI(storageURI, undefined, true, function(ok, body) {
      var p = g.statementsMatching(undefined, undefined, undefined, $rdf.sym(storageURI));
      if (p.length) {
        //$scope.points = p[0].object.value;
        $scope.points = 0;
        $scope.render();
      }
    });
  };

  /**
   * Fetch the seeAlso
   */
  $scope.fetchSeeAlso = function () {
    var seeAlso = 'https://melvin.databox.me/Public/inbox/points.ttl';
    if ($location.search().seeAlso) {
      storageURI = $location.search().seeAlso;
    }
    g.nowOrWhenFetched(seeAlso, true, function(ok, body) {
      console.log('seeAlso fetched from : ' + seeAlso);
    });
  };

  /**
   * Invalidate a cached URI
   * @param  {String} uri The URI to invalidate
   */
  $scope.invalidate = function(uri) {
    console.log('invalidate : ' + uri);
    f.unload(uri);
    f.refresh($rdf.sym(uri));
  };

  // HELPER functions
  //
  //
  /**
   * Open a modal dialog
   * @param  {String} elem  [description]
   */
  $scope.openDialog = function(elem) {
    LxDialogService.open(elem);
    $(document).keyup(function(e) {
      if (e.keyCode===27) {
        LxDialogService.close(elem);
      }
    });
  };

  /**
   * Save the position
   */
  $scope.save = function() {
    var position = $scope.position;
    if (!position) {
      LxNotificationService.error('position is empty');
      return;
    }
    console.log(position);

    $http({
      method: 'PUT',
      url: $scope.storageURI,
      withCredentials: true,
      headers: {
        "Content-Type": "text/turtle"
      },
      data: '<#this> '+ URN('fen') +' """' + position + '""" .',
    }).
    success(function(data, status, headers) {
      LxNotificationService.success('Position saved');
      $location.search('storageURI', $scope.storageURI);
    }).
    error(function(data, status, headers) {
      LxNotificationService.error('could not save position');
    });

  };

  /**
   * [function description]
   * @param  {Number} amount how much to add
   */
  $scope.add = function(amount) {
    $scope.points = parseInt(amount) + parseInt($scope.points);

    var tx  = "<#this>\n";
        tx += "<https://w3id.org/cc#amount> "+ $scope.points +"  ;\n";
        tx += "<https://w3id.org/cc#currency> <https://w3id.org/cc#bit> ;\n";
        tx += "  <https://w3id.org/cc#destination> <http://melvincarvalho.com/#me> ;\n";
        tx += "<https://w3id.org/cc#source> <https://workbot.databox.me/profile/card#me> ;\n";
        tx += "<https://w3id.org/cc#description> \"mobile\" ;\n";
        tx += "<https://w3id.org/cc#wallet>      <http://melvincarvalho.com/wallet/small.ttl#this> ;\n";
        tx += "a <https://w3id.org/cc#Credit> .\n";

        console.log(tx);

    $http({
      method: 'POST',
      url: $scope.storageURI,
      withCredentials: true,
      headers: {
        "Content-Type": "text/turtle"
      },

      data: tx,
    }).
    success(function(data, status, headers) {
      LxNotificationService.success('Points saved');
      $location.search('storageURI', $scope.storageURI);
      $scope.render();
    }).
    error(function(data, status, headers) {
      LxNotificationService.error('could not save points');
    });


    //LxNotificationService.success('Add of '+ ammount +' Successful!');
  };


  /**
   * TLS Login with WebID
   */
  $scope.TLSlogin = function() {
    $scope.loginTLSButtonText = 'Logging in...';
    $http({
      method: 'HEAD',
      url: AUTHENDPOINT,
      withCredentials: true
    }).success(function(data, status, headers) {
      // add dir to local list
      var user = headers('User');
      if (user && user.length > 0 && user.slice(0,4) == 'http') {
        LxNotificationService.success('Login Successful!');
        $scope.loggedIn = true;
        $scope.user = user;
      } else {
        LxNotificationService.error('WebID-TLS authentication failed.');
        console.log('WebID-TLS authentication failed.');
      }
      $scope.loginTLSButtonText = 'Login';
    }).error(function(data, status, headers) {
      LxNotificationService.error('Could not connect to auth server: HTTP '+status);
      console.log('Could not connect to auth server: HTTP '+status);
      $scope.loginTLSButtonText = 'Login';
    });
  };


  /**
   * Logout
   */
  $scope.logout = function() {
    $scope.init();
    LxNotificationService.success('Logout Successful!');
  };

  // SOCKETS
  //
  //
  /**
   * Get wss from URI
   * @param  {String} uri The URI to use
   */
  function getWss(uri) {
    return 'wss://' + uri.split('/')[2];
  }

  /**
   * Send subscrption
   * @param  {String} message The message
   * @param  {String} socket  The socket to send to
   */
  function sendSub(message, socket) {
    socket.send(message);
  }

  /**
   * Connect to a web socket
   * @param  {String} sub Where to subscribe to
   */
  function connectToSocket(sub) {
    if ($scope.socket) return;

    var socket;

    var wss = getWss(sub);
    console.log('connecting to : ' + wss);

    socket = new WebSocket(wss);

    socket.onopen = function(){
      console.log(sub);
      $scope.socket = socket;
    };

    socket.onmessage = function(msg) {
      console.log('Incoming message : ');
      var a = msg.data.split(' ');
      console.log(a[1]);

      $scope.invalidate(a[1]);
      $scope.fetchPoints();
      $scope.audio.play();

      Notification.requestPermission(function (permission) {
        // If the user is okay, let's create a notification
        if (permission === "granted") {
          notify = true;
        }
      });

    };

    // delay in case socket is still opening
    var DELAY = 1000;
    setTimeout(function(){
      sendSub('sub ' + sub, socket);
    }, DELAY);


  }


  $scope.initApp();

});

/**
 * Escape URIs filter
 */
App.filter('escape', function() {
  return window.encodeURIComponent;
});
