#alias rm='rm -i'
alias mv='mv -i'
alias cp='cp -i'

alias home='cd ~'
alias desktop='cd ~/Desktop'
alias downloads='cd ~/Downloads'

alias update='sudo pacman -Sy'
alias upgrade='sudo pacman -Syu'

alias install='sudo pacman -S '
alias remove='sudo pacman -R '
alias autoremove='sudo pacman -Rns $(pacman -Qtdq)'

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

alias vi='vim'
alias python='python3'
alias hibernate='systemctl hibernate'
