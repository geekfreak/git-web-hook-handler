/******************************************************************************\

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

\******************************************************************************/
// CONSTANTS
const LOG_VERBOSE       = true ;
const SERVE_STATIC      = true ;
const HTTP_PORT         = 8080 ;
// koa app server
var koa                 = require("koa") ;                 // https://github.com/koajs/koa
// koa modules
var staticServer        = require("koa-static") ;          // https://github.com/koajs/static
var httpLogger          = require("koa-http-logger") ;     // https://github.com/vesln/koa-http-logger
var router              = require("koa-route") ;           // https://github.com/koajs/route
var gzip                = require("koa-gzip") ;            // https://github.com/node-modules/koa-gzip
// node utils
var _                   = require('underscore') ;          // http://underscorejs.org/
var parse               = require('co-body') ;             // https://github.com/visionmedia/co-body
var Promise             = require("bluebird") ;            // https://github.com/petkaantonov/bluebird
var colors              = require("ccolors") ;             // https://github.com/kolodny/ccolors
var path                = require("path") ;                // http://nodejs.org/docs/v0.4.9/api/path.html
var exec                = require("child_process").exec ;  // http://nodejs.org/api/child_process.html
// debug wrappers
var debug               = require('debug')('koa-static') ; // https://github.com/visionmedia/debug
var _log                = require('debug')('gwhh') ;
var _verbose            = require('debug')('verbose') ;
// wrap fs in Promise/A api

var fs                  = Promise.promisifyAll(require("fs") ) ;
var project             = process.argv[2] || process.exit(1) ;  // commandline must contain a project name
var gitHookPort         = process.argv[3] || -1 ;               // set the port to listen for github hooks on
var workspace           = path.resolve(__dirname, '..') ;       // ??bit wonky??
var repositoryContainer = path.join(workspace, project) ;       // repositoryContainer is the folder http content is served from.

// log helper - !!TODO!! should be a factory
var log = function() {
  var message = Array.prototype.slice.call(arguments).join(" , ") ;
  _log([new Date().toString().split(" ")[4].blue , process.pid.toString().magenta , message.bold.white].join(" ") ,"".white) ;
} ;

var log_verbose = function() {
  var message = Array.prototype.slice.call(arguments).join(" , ") ;
  _verbose([new Date().toString().split(" ")[4].blue , process.pid.toString().magenta , message.bold.white].join(" ") ,"".white) ;
} ;

// verify repositoryContainer exists
fs.stat(repositoryContainer, function(err, repoStats) { // ? Promise style ??

  if (repoStats && repoStats.isDirectory()) {

    if (SERVE_STATIC) {

      var app = koa() ;

      app.use(httpLogger(debug)) ;
      app.use(gzip()) ;
      app.use(staticServer(repositoryContainer)) ;

      log("static content serving from " + repositoryContainer.bold.green ) ;
      log("http on " + HTTP_PORT.toString().bold.green ) ;

      app.listen(HTTP_PORT) ;

    }

    if (!~gitHookPort) {  // Sentinel Detected

      log("githook listener disabled ".blackHi ) ;

    } else {

      var gitHookApp = koa() ;

      gitHookApp.use(httpLogger(debug)) ;
      gitHookApp.use(gzip()) ;
      gitHookApp.use(function *(){

        var body = yield parse(this);
        var repo = body.payload.repository || {} ;

        log("githook trigger for " + repo.name, body) ;

        if (repo.name === project) {

          process.chdir(repositoryContainer) ;

          // !!TODO!! conver to promise style/generator
          child = exec("git pull", function (error, stdout, stderr) {
            log_verbose("stdout: " + stdout) ;
            log_verbose("stderr: " + stderr) ;
            log((error !== null) ? "exec error: " + error : repo.name + " updated") ;
          }) ;

          process.chdir(__dirname) ;

        } else {
           this.throw(404, project +" Not Found");
        }

      });

      gitHookApp.listen(gitHookPort);
      log("githook listener on ".green + gitHookPort ) ;

    }

  } else {

    log("Invalid project: ".red + project.yellowHi + " : " + repositoryContainer.green) ;

  }

}) ;

// test webhook on commit. 
