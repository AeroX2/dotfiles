autoload -U compinit promptinit colors
colors
compinit
promptinit

function collapse_pwd {
	echo $(pwd | sed -e "s,^$HOME,~," | sed -r 's,([^/])[^/]*/,\1/,g')
}

#Theme
prompt walters
setopt PROMPT_SUBST
PROMPT='%{$fg_bold[green]%}%n@%m %{$reset_color%}%{$fg_bold[blue]%}$(collapse_pwd)%{$reset_color%} %{$fg_bold[green]%}$ %{$reset_color%}'
RPROMPT=""

#Ignore duplicate commands
setopt histignoredups

#Thing
setopt autonamedirs

#Other thing
setopt listtypes

# create a zkbd compatible hash;
# to add other keys to this hash, see: man 5 terminfo
typeset -A key

key[Home]=${terminfo[khome]}

key[End]=${terminfo[kend]}
key[Insert]=${terminfo[kich1]}
key[Delete]=${terminfo[kdch1]}
key[Up]=${terminfo[kcuu1]}
key[Down]=${terminfo[kcud1]}
key[Left]=${terminfo[kcub1]}
key[Right]=${terminfo[kcuf1]}
key[PageUp]=${terminfo[kpp]}
key[PageDown]=${terminfo[knp]}

# setup key accordingly
[[ -n "${key[Home]}"     ]]  && bindkey  "${key[Home]}"     beginning-of-line
[[ -n "${key[End]}"      ]]  && bindkey  "${key[End]}"      end-of-line
[[ -n "${key[Insert]}"   ]]  && bindkey  "${key[Insert]}"   overwrite-mode
[[ -n "${key[Delete]}"   ]]  && bindkey  "${key[Delete]}"   delete-char
[[ -n "${key[Up]}"       ]]  && bindkey  "${key[Up]}"       up-line-or-history
[[ -n "${key[Down]}"     ]]  && bindkey  "${key[Down]}"     down-line-or-history
[[ -n "${key[Left]}"     ]]  && bindkey  "${key[Left]}"     backward-char
[[ -n "${key[Right]}"    ]]  && bindkey  "${key[Right]}"    forward-char
[[ -n "${key[PageUp]}"   ]]  && bindkey  "${key[PageUp]}"   beginning-of-buffer-or-history
[[ -n "${key[PageDown]}" ]]  && bindkey  "${key[PageDown]}" end-of-buffer-or-history

# Finally, make sure the terminal is in application mode, when zle is
# active. Only then are the values from $terminfo valid.
if (( ${+terminfo[smkx]} )) && (( ${+terminfo[rmkx]} )); then
    function zle-line-init () {
        printf '%s' "${terminfo[smkx]}"
    }
    function zle-line-finish () {
        printf '%s' "${terminfo[rmkx]}"
    }
    zle -N zle-line-init
    zle -N zle-line-finish
fi

#Autocomplete from both ends
setopt completeinword

#Tab completion case insensitive
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'

#Killall completion
zstyle ':completion:*:killall:*' command 'ps -u $USER -o cmd'

#LS Colors
if [[ -x "`whence -p dircolors`" ]]; then
  eval `dircolors`
  alias ls='ls -F --color=auto'
else
  alias ls='ls -F'
fi

#256 Colors
if [ -e /usr/share/terminfo/x/xterm-256color ]; then
        export TERM='xterm-256color'
else
        export TERM='xterm-color'
fi

#Share history
HISTFILE=~/.zhistory
HISTSIZE=SAVEHIST=10000
setopt sharehistory
setopt extendedhistory

#Welcome message
clear
cat ~/.zsh_banner
echo -e ""
echo "`uname -o` (`uname -sr`)"
date
echo -e ""; cal;

source ~/.zaliases
export PATH=$PATH:/opt/android-sdk/build-tools/22.0.1:/opt/android-sdk/platform-tools
PATH="/usr/local/heroku/bin:$PATH"
