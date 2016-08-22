
"===VIM PLUGINS===
set nocompatible
filetype off
set rtp+=~/.vim/bundle/Vundle.vim
call vundle#begin()

Plugin 'gmarik/Vundle.vim'

Plugin 'vim-airline/vim-airline'
Plugin 'vim-airline/vim-airline-themes'
Plugin 'altercation/vim-colors-solarized'

Plugin 'tpope/vim-surround'
Plugin 'tpope/vim-abolish'

Plugin 'scrooloose/syntastic'
Plugin 'Valloric/YouCompleteMe'
Plugin 'terryma/vim-multiple-cursors'

call vundle#end()

"Basic stuff.
set encoding=utf-8
set scrolloff=3
set hidden
set autoread
set number
set noerrorbells
set nowrap
set noswapfile

"UI
set number
set showcmd
set wildmenu
set wildmode=list:longest
set mouse=a

"Modeline was fixed ages ago
set modeline
set modelines=5

"Colors
set background=dark
let g:solarized_termcolors=256
let g:solarized_termtrans=1
colorscheme solarized

"Making backspace work
set backspace=indent,eol,start

"Tabs
set textwidth=80
set shiftwidth=4
set tabstop=4
set noexpandtab

"Indenting
filetype plugin indent on

"Syntax
syntax on
set statusline+=%#warningmsg#
set statusline+=%{SyntasticStatuslineFlag()}
set statusline+=%*

"Suffixes (lower priority tab completion)
set suffixes=.bak,~,.swp,.o,.info,.aux,.log,.dvi,.bbl,.blg,.brf,.cb,.ind,.idx,.ilg,.inx,.out,.toc

"===SEARCHING===

set ignorecase
set smartcase
set gdefault
set incsearch
set showmatch
set hlsearch

"Tab remaps to %
nnoremap <tab> %
vnoremap <tab> %

"Save on focus lost
au FocusLost * :wa

"===PLUGINS===

"Syntastic
let g:syntastic_always_populate_loc_list = 1
let g:syntastic_auto_loc_list = 1
let g:syntastic_check_on_open = 1
let g:syntastic_check_on_wq = 0

"CHECK THIS
"let g:syntastic_enable_signs=1

"Syntatic compiler options
let g:syntastic_python_python_exec = '/usr/bin/python3'
let g:syntastic_cpp_compiler = 'g++'
let g:syntastic_cpp_compiler_options = ' -std=c++14 '

"Airline
let g:airline#extensions#syntastic#enabled = 1
"Shutup Airline
let g:airline#extensions#whitespace#enabled = 0

"YouCompleteMe
let g:ycm_path_to_python_interpreter = "/usr/bin/python"
let g:ycm_autoclose_preview_window_after_completion = 1
let g:ycm_confirm_extra_conf = 0 
"let g:ycm_show_diagnostics_ui = 0
"let g:ycm_register_as_syntastic_checker=0
let g:EclimCompletionMethod = 'omnifunc'
set laststatus=2

"YCM Goto
nmap <C-B> :YcmCompleter GoTo<cr>

"===KEY BINDINGS===

"Remap, no need for shift to insert commands
nore ; :

"Disable F1
inoremap <F1> <ESC>
nnoremap <F1> <ESC>
vnoremap <F1> <ESC>

"No arrow keys
map  <up>    <nop>
imap <up>    <nop>
map  <down>  <nop>
imap <down>  <nop>
map  <left>  <nop>
map  <right> <nop>
imap <left>  <nop>
imap <right> <nop>
" B A Start Select

"Home maps to first character
noremap <expr> <silent> <Home> col('.') == match(getline('.'),'\S')+1 ? '0' : '^'
imap <silent> <Home> <C-O><Home>

"Shift indent
vnoremap < <gv
vnoremap > >gv

:command! -bar -bang Q quit<bang>

"===LEADER KEY MAPPINGS===

"Leader key
let mapleader = ","

"Replace word with copied word
nmap <leader>r ciw<C-R>0<Esc>

"Clear highlighting
nnoremap <leader>c :noh<cr>

"===WINDOW AND TAB HANDLING===

"Split panes
nnoremap <leader>h <C-w>S<C-w>j
nnoremap <leader>v <C-w>v<C-w>l
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l

"Tab handling
nnoremap <Esc>h :tabprevious<cr>
nnoremap <Esc>l :tabnext<cr>
nnoremap <Esc>H :tabmove -1<cr>
nnoremap <Esc>L :tabmove<cr>
nnoremap <leader>n :tabnew<cr>

"===MISC KEY BINDINGS===

"Copying and pasting
map <C-C> :w !xclip<CR><CR>
"CHECK THIS
"vmap <C-C> "*y
"map <C-V> :r!xclip -o<CR>

"Insert single character
nmap <Space> i_<Esc>r

autocmd bufnewfile *.c so ~/.c_header.txt
autocmd bufnewfile *.c exe "1," . 5 . "g/Creation Date:.*/s//Creation Date: " .strftime("%d-%m-%Y")
autocmd Bufwritepre,filewritepre *.c execute "normal ma"
autocmd Bufwritepre,filewritepre *.c exe "1," . 10 . "g/Last Modified:.*/s/Last Modified:.*/Last Modified: " .strftime("%c")
autocmd bufwritepost,filewritepost *.c execute "normal `a"
