set history save on

source ~/.gdbinit-gef.py

source ~/.gdbinit-dashboard
dashboard assembly -style context 10
dashboard -layout source assembly registers stack 
