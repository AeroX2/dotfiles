"===VIM PLUGINS===

call plug#begin()

Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
Plug 'altercation/vim-colors-solarized'

Plug 'tpope/vim-abolish'
Plug 'tpope/vim-repeat'

Plug 'neomake/neomake'

Plug 'Shougo/deoplete.nvim', { 'do': ':UpdateRemotePlugins' }
Plug 'mhartington/deoplete-typescript'

Plug 'terryma/vim-multiple-cursors'
Plug 'ctrlpvim/ctrlp.vim'

Plug 'pangloss/vim-javascript'
Plug 'leafgarland/typescript-vim'

call plug#end()

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
set textwidth=0
set wrapmargin=0
set shiftwidth=4
set tabstop=4
set noexpandtab
set autoindent

"Indenting
filetype plugin indent on

"Syntax
syntax on

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

"Mimic syntastic in neomake
let g:neomake_error_sign = {
            \ 'text': '>>',
            \ 'texthl': 'ErrorMsg',
            \ }
hi MyWarningMsg ctermbg=3 ctermfg=0
let g:neomake_warning_sign = {
            \ 'text': '>>',
            \ 'texthl': 'MyWarningMsg',
            \ }
autocmd BufWritePost,BufEnter * Neomake

let g:neomake_cpp_clang_args = ["-std=c++14", "-Wextra", "-Wall"]

"Deoplete enable
let g:deoplete#enable_at_startup = 1

"Airline
"Shutup Airline
let g:airline#extensions#whitespace#enabled = 0

"===KEY BINDINGS===

"Remap, no need for shift to insert commands
nore ; :

"Disable F1
inoremap <F1> <ESC>
nnoremap <F1> <ESC>
vnoremap <F1> <ESC>

"No arrow keys
"map  <up>    <nop>
"imap <up>    <nop>
"map  <down>  <nop>
"imap <down>  <nop>
"map  <left>  <nop>
"map  <right> <nop>
"imap <left>  <nop>
"imap <right> <nop>
" B A Start Select

"Home maps to first character
noremap <expr> <silent> <Home> col('.') == match(getline('.'),'\S')+1 ? '0' : '^'
imap <silent> <Home> <C-O><Home>

"Shift indent
vnoremap < <gv
vnoremap > >gv

"Captial Q also quits
:command! -bar -bang Q quit<bang>

" Deoplete tab-complete
inoremap <expr><tab> pumvisible() ? "\<c-n>" : "\<tab>"
autocmd FileType javascript nnoremap <silent> <buffer> gb :TernDef<CR>

"===LEADER KEY MAPPINGS===

"Leader key
let mapleader = ","

nnoremap <leader>l :ls<CR>:b<space>

"Replace word with copied word
nmap <leader>r ciw<C-R>0<Esc>

"Replace word under cursor
nnoremap <leader>s :%s/\<<C-r><C-w>\>//g<Left><Left>

function! CloseAllBuffersButCurrent()
  let curr = bufnr("%")
  let last = bufnr("$")

  if curr > 1    | silent! execute "1,".(curr-1)."bd"     | endif
  if curr < last | silent! execute (curr+1).",".last."bd" | endif
endfunction

nmap <leader>g :call CloseAllBuffersButCurrent()<CR>

"Clear highlighting
nnoremap <leader>c :noh<cr>

"Paste last yank text
nnoremap <leader>p "0p

"===WINDOW AND TAB HANDLING===

"Split panes
nnoremap <leader>h <C-w>S<C-w>j
nnoremap <leader>v <C-w>v<C-w>l
nnoremap <C-h> <C-w>h
nnoremap <C-j> <C-w>j
nnoremap <C-k> <C-w>k
nnoremap <C-l> <C-w>l

"Tab handling
nnoremap <a-h> :tabprevious<cr>
nnoremap <a-l> :tabnext<cr>
nnoremap <a-H> :tabmove -1<cr>
nnoremap <a-L> :tabmove<cr>
nnoremap <leader>n :tabnew<cr>

"Tab handling in neovim terminal
tnoremap <a-h> <C-\><C-n>:tabprevious<cr>
tnoremap <a-l> <C-\><C-n>:tabnext<cr>

"===MISC KEY BINDINGS===

"Neovim term escape to normal mode
tnoremap <Esc> <C-\><C-n>

"Insert single character
nmap <Space> i_<Esc>r

"Add header to C file
"autocmd bufnewfile *.c so ~/.c_header.txt
"autocmd bufnewfile *.c exe "1," . 5 . "g/Creation Date:.*/s//Creation Date: " .strftime("%d-%m-%Y")
"autocmd Bufwritepre,filewritepre *.c execute "normal ma"
"autocmd Bufwritepre,filewritepre *.c exe "1," . 10 . "g/Last Modified:.*/s/Last Modified:.*/Last Modified: " .strftime("%c")
"autocmd bufwritepost,filewritepost *.c execute "normal `a"
