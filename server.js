/*********************************************************************************
The MIT License (MIT)

Copyright (c) 2013   ʞɐǝɹɟʞǝǝƃ

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
**********************************************************************************/

var connect    = require("connect") ; // deprecated
var path       = require("path") ;
var fs         = require("fs") ;
var exec       = require("child_process").exec ;

// CONSTANTS
var LOG_ENABLED  = true ;
var LOG_VERBOSE  = true ;
var SERVE_STATIC = true ;
var HTTP_PORT    = 8080 ;
var WEBHOOK_PORT = HTTP_PORT + 1 ;

var log = function log() {
  
  var setColor = function setColor(val) {
    return '\x1b['+val+'m'
  }; 
  
  var ink = {
    reset     : setColor(39)
  , black     : setColor(30)
  , red       : setColor(31)
  , green     : setColor(32)
  , yellow    : setColor(33)
  , blue      : setColor(34)
  , violet    : setColor(35)
  , cyan      : setColor(36)
  , lightGrey : setColor(37)
  , grey      : setColor(90)
  }

  var message = Array.prototype.slice.call(arguments).join(ink.cyan+' , '+ink.reset);
  
  LOG_ENABLED && console.log(ink.blue + new Date().toString().split(" ")[4] + ink.violet + " [" + process.pid + '] ' + ink.reset + message + ink.reset) ;
    
} ;

// commandline must contain a project name
var project = process.argv[2] || process.exit(1) ;

// set the port to listen for github hooks on
//    : use next incremental port number if none provided
var gitHookPort = process.argv[3] || WEBHOOK_PORT ;

var workspace = path.resolve(__dirname, '..') ;

// documentRoot is the folder http content is served from.
// rename ==> repositoryContainer
var documentRoot = path.join(workspace, project) ;

log(["project:",project].join(" ")) ;

// verify documentRoot exists
fs.stat(documentRoot, function(err, stats) {

    if (stats && stats.isDirectory()) {

        if (SERVE_STATIC) {

            connect.createServer( //deprecated
              connect.logger({ format: "\x1b[35m" + project + ":\x1b[37m :remote-addr :method :status :url :response-time" })
            , connect.compress()
            , connect.static(documentRoot)
            ).listen(HTTP_PORT) ;

            log("static content serving from " + documentRoot ) ;
            log("http on " + HTTP_PORT ) ;
        }

        // launch github webhook api listener
        connect.createServer( // deprecated
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
        log("\x1b[31mInvalid project:\x1b[39m" + project + " : " + documentRoot) ;
    }
}) ;
