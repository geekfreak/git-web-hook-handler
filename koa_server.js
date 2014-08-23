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
var workspace           = path.resolve(__dirname, "..") ;       // ??bit wonky??
var repositoryContainer = path.join(workspace, project) ;       // repositoryContainer is the folder http content is served from.

// log helper - !!TODO!! should be a factory
var log = function() {
  var message = Array.prototype.slice.call(arguments).join(" , ") ;
  _log([new Date().toString().split(" ")[4].blue , process.pid.toString().magenta , message.bold.white].join(" ") ,"".white) ;
} ;

log("project:" + project);

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
      //
      // http://requestb.in/15n1hyc1?inspect
      //
      var gitHookApp = koa() ;

      gitHookApp.use(httpLogger(debug)) ;
      gitHookApp.use(gzip()) ;
      gitHookApp.use(function *(){

        var body = /* yield parse(this); //*/  {"ref":"refs/heads/master","after":"19bd5d9f6a72f71719ec4eab4efa20d059f5cf22","before":"0fb2a489ec0c45fe3226aa95704e7e263c837690","created":false,"deleted":false,"forced":false,"compare":"https://github.com/geekfreak/git-web-hook-handler/compare/0fb2a489ec0c...19bd5d9f6a72","commits":[{"id":"19bd5d9f6a72f71719ec4eab4efa20d059f5cf22","distinct":true,"message":"removed ccolors fork dependency","timestamp":"2014-08-23T18:30:02+02:00","url":"https://github.com/geekfreak/git-web-hook-handler/commit/19bd5d9f6a72f71719ec4eab4efa20d059f5cf22","author":{"name":"ʞɐǝɹɟʞǝǝƃ","email":"davey@geekfreak.com","username":"geekfreak"},"committer":{"name":"ʞɐǝɹɟʞǝǝƃ","email":"davey@geekfreak.com","username":"geekfreak"},"added":[],"removed":[],"modified":["koa_server.js"]}],"head_commit":{"id":"19bd5d9f6a72f71719ec4eab4efa20d059f5cf22","distinct":true,"message":"removed ccolors fork dependency","timestamp":"2014-08-23T18:30:02+02:00","url":"https://github.com/geekfreak/git-web-hook-handler/commit/19bd5d9f6a72f71719ec4eab4efa20d059f5cf22","author":{"name":"ʞɐǝɹɟʞǝǝƃ","email":"davey@geekfreak.com","username":"geekfreak"},"committer":{"name":"ʞɐǝɹɟʞǝǝƃ","email":"davey@geekfreak.com","username":"geekfreak"},"added":[],"removed":[],"modified":["koa_server.js"]},"repository":{"id":13365621,"name":"git-web-hook-handler","full_name":"geekfreak/git-web-hook-handler","owner":{"name":"geekfreak","email":"geekfreak@users.noreply.github.com"},"private":false,"html_url":"https://github.com/geekfreak/git-web-hook-handler","description":"Simpler webserver which serves static content and responds to github webhook requests","fork":false,"url":"https://github.com/geekfreak/git-web-hook-handler","forks_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/forks","keys_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/keys{/key_id}","collaborators_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/collaborators{/collaborator}","teams_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/teams","hooks_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/hooks","issue_events_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/issues/events{/number}","events_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/events","assignees_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/assignees{/user}","branches_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/branches{/branch}","tags_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/tags","blobs_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/git/blobs{/sha}","git_tags_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/git/tags{/sha}","git_refs_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/git/refs{/sha}","trees_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/git/trees{/sha}","statuses_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/statuses/{sha}","languages_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/languages","stargazers_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/stargazers","contributors_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/contributors","subscribers_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/subscribers","subscription_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/subscription","commits_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/commits{/sha}","git_commits_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/git/commits{/sha}","comments_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/comments{/number}","issue_comment_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/issues/comments/{number}","contents_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/contents/{+path}","compare_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/compare/{base}...{head}","merges_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/merges","archive_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/{archive_format}{/ref}","downloads_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/downloads","issues_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/issues{/number}","pulls_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/pulls{/number}","milestones_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/milestones{/number}","notifications_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/notifications{?since,all,participating}","labels_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/labels{/name}","releases_url":"https://api.github.com/repos/geekfreak/git-web-hook-handler/releases{/id}","created_at":1381079230,"updated_at":"2014-07-02T11:42:18Z","pushed_at":1408811409,"git_url":"git://github.com/geekfreak/git-web-hook-handler.git","ssh_url":"git@github.com:geekfreak/git-web-hook-handler.git","clone_url":"https://github.com/geekfreak/git-web-hook-handler.git","svn_url":"https://github.com/geekfreak/git-web-hook-handler","homepage":null,"size":280,"stargazers_count":0,"watchers_count":0,"language":"JavaScript","has_issues":true,"has_downloads":true,"has_wiki":true,"forks_count":0,"mirror_url":null,"open_issues_count":0,"forks":0,"open_issues":0,"watchers":0,"default_branch":"master","stargazers":0,"master_branch":"master"},"pusher":{"name":"geekfreak","email":"geekfreak@users.noreply.github.com"}};

        var repo = body.repository || {} ;

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
