"Not compatible with Vi
set nocompatible

"Making backspace work
set backspace=indent,eol,start

"Basic stuff.
set hidden
set autoread
set number
set noerrorbells
set nowrap

"Colors

"Tabs
set shiftwidth=4
set tabstop=4
set softtabstop=4
set expandtab

"UI
set number
set showcmd
"set cursorline

"Indenting
filetype indent on
set smartindent

set wildmenu
set showmatch

"Searching
set incsearch
set hlsearch

"Key bindings
vnoremap < <gv
vnoremap > >gv

"Remap, no need for shift to insert commands
nore ; :

"No arrow keys?
"map  <up>    <nop>
"imap <up>    <nop>
"map  <down>  <nop>
"imap <down>  <nop>
"map  <left>  <nop>
"map  <right> <nop>
"imap <left>  <nop>
"imap <right> <nop>
" B-A Start

"Suffixes (lower priority tab completion)
set suffixes=.bak,~,.swp,.o,.info,.aux,.log,.dvi,.bbl,.blg,.brf,.cb,.ind,.idx,.ilg,.inx,.out,.toc
