#alias rm='rm -i'
alias mv='mv -i'
alias cp='cp -i'

alias home='cd ~'
alias desktop='cd ~/Desktop'
alias downloads='cd ~/Downloads'

alias update='sudo apt-get update'
alias upgrade='sudo apt-get upgrade'
alias distupgrade='sudo apt-get dist-upgrade'

alias install='sudo apt-get install '
alias remove='sudo apt-get remove '
alias autoremove='sudo apt-get autoremove'
alias purge='sudo apt-get purge '
alias search='apt-cache search '

function exportproxy() 
{
    read -p "User: " username;
    read -s -p "Password: " password;
    echo

    export http_proxy='http://'$username':'$password'@proxy.det.nsw.edu.au:8080';
    export https_proxy='http://'$username':'$password'@proxy.det.nsw.edu.au:8080';
    export socks_proxy='http://'$username:$password'@proxy.det.nsw.edu.au:8080';
    export ftp_proxy='http://'$username':'$password'@proxy.det.nsw.edu.au:8080';
}

function clearproxy() 
{
    unset http_proxy
    unset https_proxy
    unset socks_proxy
    unset ftp_proxy
}

alias exportproxy=exportproxy
alias clearproxy=clearproxy

alias emacs='emacs -nw'

_apt_install_complete() {
    mapfile -t COMPREPLY < <(apt-cache --no-generate pkgnames "$2");
}
complete -F _apt_install_complete install

_apt_remove_complete() {
	mapfile -t COMPREPLY < <(dpkg --get-selections | sed 's/[ \t]*install//');
}
complete -F _apt_remove_complete remove
complete -F _apt_remove_complete autoremove
complete -F _apt_remove_complete purge

alias python='python3'
