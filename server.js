var connect    = require("connect") ;
var path       = require("path") ;
var fs         = require("fs") ;
var qs         = require("querystring") ;

var sys        = require("sys") ;
var exec       = require("child_process").exec ;

// CONSTANTS
var LOG_VERBOSE = false ;

// get process id
var pid        = process.getgid() ;

var log = function(message) {
    
    var clrBlack     = "\x1b[30m" ; // Black
    var clrGrey      = "\x1b[90m" ; // Grey
    var clrLightGrey = "\x1b[37m" ; // Light Grey
    var clrWhite     = "\x1b[39m" ; // White
    var clrRed       = "\x1b[31m" ; // Red
    var clrGreen     = "\x1b[32m" ; // Green
    var clrBlue      = "\x1b[34m" ; // Blue
    var clrYellow    = "\x1b[33m" ; // Yellow
    var clrViolet    = "\x1b[35m" ; // Violet
    var clrCyan      = "\x1b[36m" ; // Cyan
       
    console.log(clrGrey + pid + ":" + clrLightGrey + message) ;
}

// commandline must contain a project name
var project      = process.argv[2] || process.exit(1) ;

// set the port to listen for http traffic on 
//    : use 8888 as default if none provided
var port         = process.argv[3] || 8888 ;

// set the port to listen for github hooks on 
//    : use next incremental port number if none provided 
var gitHookPort  = process.argv[4] || 1 + port * 1 ;

// documentRoot is the folder http content is served from.
var documentRoot = path.join(__dirname, project) ;

log("pageserver.js") ;

// verify documentRoot exists
fs.stat(documentRoot, function(err, stats) { 
    
    if (stats && stats.isDirectory()) {      
        
        // The folder exists
        // launch static page http daemon
        connect.createServer(
            connect.logger({ format: "\x1b[35m" + project + ":\x1b[37m :remote-addr :method :status :url :response-time" })
          , connect.compress()
          , connect.static(documentRoot)
        ).listen(port) ;
        log("static content serving from " + documentRoot ) ;
        log("http on " + port ) ;

        // launch github webhook api listener                     
        connect.createServer(
            connect.favicon()
          , connect.logger({ format: "\x1b[31mgithub:\x1b[39m :remote-addr :method :status :url :response-time" })
          , connect.bodyParser()
          , function(request, response) {
              var postReceiveMessage = JSON.parse(request.body.payload || {} ) ;
              LOG_VERBOSE && log(JSON.stringify(postReceiveMessage)) ;
              if (postReceiveMessage.repository.name !== project) {
                  response.writeHead(404, {
                      "Content-Type": "text/plain"
                  });
                  response.write("404 Not Found\n") ;
                  response.end() ;
              } else {
                  log("githook trigger for " + postReceiveMessage.repository.name) ;
                  process.chdir(documentRoot) ;
                  child = exec("git pull", function (error, stdout, stderr) {
                    LOG_VERBOSE && log("stdout: " + stdout) ;
                    LOG_VERBOSE && log("stderr: " + stderr) ;
                    if (error !== null) {
                        log("exec error: " + error) ;
                    } else {
                        log(postReceiveMessage.repository.name + " updated") ;
                    } ;
                  }) ;
                  process.chdir(__dirname) ;
              }
            }
        ).listen(gitHookPort) ;
        log("githook listener on " + gitHookPort ) ;
 
    } else {
        log("\x1b[31mInvalid project:\x1b[39m" + project ) ;
    }
}) ; 