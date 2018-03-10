"===VIM PLUGINS=== 
call plug#begin()

Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
Plug 'miyakogi/seiya.vim'
Plug 'NLKNguyen/papercolor-theme'

Plug 'tpope/vim-abolish'
Plug 'tpope/vim-repeat'

Plug 'neomake/neomake'
Plug 'vim-syntastic/syntastic'

Plug 'Valloric/YouCompleteMe', { 'do': './install.py --clang-completer --system-libclang' }
Plug 'rdnetto/YCM-Generator', { 'branch': 'stable'}

Plug 'terryma/vim-multiple-cursors'
Plug 'ctrlpvim/ctrlp.vim'

call plug#end()

"Basic stuff.
set encoding=utf-8
set scrolloff=3
set hidden
set autoread
set number
set noerrorbells
set nowrap

set backup
set writebackup

set backupdir=~/.vim/backup//
set directory=~/.vim/swp//

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
colorscheme PaperColor
let g:seiya_auto_enable=1

"Making backspace work
set backspace=indent,eol,start

"Tabs
set textwidth=0
set wrapmargin=0
set shiftwidth=4
set tabstop=4
set noexpandtab
set smarttab
set autoindent

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

let g:neomake_cpp_enabled_makers=['clang']
let g:neomake_cpp_clang_args = ["-std=c++14"]

"Airline
let g:airline#extensions#syntastic#enabled = 1

"Shutup Airline
let g:airline#extensions#whitespace#enabled = 0

"YouCompleteMe settings
let g:ycm_confirm_extra_conf = 0
let g:ycm_autoclose_preview_window_after_insertion = 1
let g:ycm_autoclose_preview_window_after_completion = 1

"YCM Goto
nmap <C-B> :YcmCompleter GoToDefinition<cr>
nmap <C-U> :YcmCompleter GoToReferences<cr>

let g:EclimCompletionMethod = 'omnifunc'
set laststatus=2

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

"Capital versions do the same thing
:command WQ wq
:command Wq wq
:command W w
:command Q q

"===LEADER KEY MAPPINGS===

"Leader key
let mapleader = ","

"Show open buffers
nnoremap <leader>l :ls<CR>:b<space>

"Replace word with copied word
nmap <leader>r ciw<C-r>0<ESC>

"Replace word under cursor
nnoremap <leader>s :%s/\<<C-r><C-w>\>//<Left>

function! CloseAllBuffersButCurrent()
  let curr = bufnr("%")
  let last = bufnr("$")

  if curr > 1    | silent! execute "1,".(curr-1)."bd"     | endif
  if curr < last | silent! execute (curr+1).",".last."bd" | endif
endfunction

nmap <leader>g :call CloseAllBuffersButCurrent()<CR>

"Clear highlighting
nnoremap <leader>c :noh<cr>

"Copy to system clipboard
set clipboard=unnamedplus
nnoremap <leader>y "+y

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
nnoremap <a-L> :tabmove +1<cr>
nnoremap <leader>n :tabnew<cr>

"Tab handling in neovim terminal
tnoremap <a-h> <C-\><C-n>:tabprevious<cr>
tnoremap <a-l> <C-\><C-n>:tabnext<cr>

"===MISC KEY BINDINGS===

"Neovim term escape to normal mode
tnoremap <Esc> <C-\><C-n>

"Insert single character
nmap <Space> i_<Esc>r

"autocmd bufnewfile *.c so ~/.c_header.txt
"autocmd bufnewfile *.c exe "1," . 5 . "g/Creation Date:.*/s//Creation Date: " .strftime("%d-%m-%Y")
"autocmd Bufwritepre,filewritepre *.c execute "normal ma"
"autocmd Bufwritepre,filewritepre *.c exe "1," . 10 . "g/Last Modified:.*/s/Last Modified:.*/Last Modified: " .strftime("%c")
"autocmd bufwritepost,filewritepost *.c execute "normal `a"
