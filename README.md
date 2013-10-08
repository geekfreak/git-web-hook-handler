git-web-hook-handler
====================

Basic development webserver which serves static content and responds to github webhook requests

    forever start -a  -l my-domain.com.log -o out.log -e err.log server.js my-domain.com
    forever stop my-domain.com


