"Not compatible with Vi
set nocompatible

"Pathogen
execute pathogen#infect()

"Making backspace work
set backspace=indent,eol,start

"Basic stuff.
set encoding=utf-8
set scrolloff=3
set hidden
set autoread
set number
set noerrorbells
set nowrap

"UI
set number
set showcmd
set wildmenu
set wildmode=list:longest
set mouse=a

"Security
set modelines=0

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
nnoremap / /\v
vnoremap / /\v
set ignorecase
set smartcase
set gdefault
set incsearch
set showmatch
set hlsearch
nnoremap <leader><space> :noh<cr>
nnoremap <tab> %
vnoremap <tab> %

"Key bindings
"Visual thingy
vnoremap < <gv
vnoremap > >gv

"Disable F1
inoremap <F1> <ESC>
nnoremap <F1> <ESC>
vnoremap <F1> <ESC>

"Remap, no need for shift to insert commands
nore ; :
inoremap jj <ESC>

"Leader key
let mapleader = ","

"Split panes
nnoremap <leader>v <C-w>v<C-w>l
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l

"Home maps to first character
noremap <expr> <silent> <Home> col('.') == match(getline('.'),'\S')+1 ? '0' : '^'
imap <silent> <Home> <C-O><Home>

"No arrow keys?
map  <up>    <nop>
imap <up>    <nop>
map  <down>  <nop>
imap <down>  <nop>
map  <left>  <nop>
map  <right> <nop>
imap <left>  <nop>
imap <right> <nop>
" B-A Start

"Suffixes (lower priority tab completion)
set suffixes=.bak,~,.swp,.o,.info,.aux,.log,.dvi,.bbl,.blg,.brf,.cb,.ind,.idx,.ilg,.inx,.out,.toc

"Copying and pasting
"map <C-c> :w !xclip<CR><CR>
"vmap <C-c> "*y
"map <C-v> :r!xclip -o<CR>

"Tab handling
nnoremap <Esc>l :tabprevious<cr>
nnoremap <Esc>h :tabnext<cr>
nnoremap <leader>n :tabnew<cr>

"Insert single character
nmap <Space> i_<Esc>r

"Replace word with copied word
nmap <leader>r ciw<C-R>0<Esc>

Save on focus lost
au FocusLost * :wa
