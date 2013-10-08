git-web-hook-handler
====================

Simpler webserver which serves static content and responds to github webhook requests

    forever start -l ~/logs/my-domain.com.log -o ~/logs/out.log -e ~/logs/err.log -a  \ 
    www/git-web-hook-handler/server.js my-domain.com
    forever stop my-domain.com

