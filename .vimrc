"Not compatible with Vi
set nocompatible

"Pathogen
execute pathogen#infect()

"Making backspace work
set backspace=indent,eol,start

"Basic stuff.
set hidden
set autoread
set number
set noerrorbells
set nowrap

"UI
set number
set showcmd
set wildmenu

"Colors
set background=dark
let g:solarized_termcolors=256
let g:solarized_termtrans=1
colorscheme solarized

"Tabs
set shiftwidth=4
set tabstop=4
"set softtabstop=4
set noexpandtab

"Indenting
filetype plugin indent on
"set smartindent

"Syntax
syntax on
set statusline+=%#warningmsg#
set statusline+=%{SyntasticStatuslineFlag()}
set statusline+=%*

let g:syntastic_always_populate_loc_list = 1
let g:syntastic_auto_loc_list = 1
let g:syntastic_check_on_open = 1
let g:syntastic_check_on_wq = 0
let g:syntastic_python_python_exec = '/usr/bin/python3'

"Airline
let g:airline_enable_syntastic=1
"Please shutup
let g:airline#extensions#whitespace#enabled = 0
set laststatus=2

"Searching
set incsearch
set hlsearch

"Key bindings
"Visual thingy
vnoremap < <gv
vnoremap > >gv

"Remap, no need for shift to insert commands
nore ; :

"Home maps to first character
noremap <expr> <silent> <Home> col('.') == match(getline('.'),'\S')+1 ? '0' : '^'
imap <silent> <Home> <C-O><Home>

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
