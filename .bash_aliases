alias mv='mv -i'
alias cp='cp -i'
alias cp_p='rsync -ah --progress'

alias c='clear'
alias e='exit'
alias update='sudo -E pacman -Sy'
alias upgrade='sudo -E pacman -Syu'

alias install='sudo -E pacman -S '
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
alias resetdmenu='rm ~/.cache/dmenu_run'
alias feh='feh --scale-down '
