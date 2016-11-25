(function() {
  var dispatch, getVimState, inspect, ref, settings;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch;

  settings = require('../lib/settings');

  inspect = require('util').inspect;

  describe("Operator ActivateInsertMode family", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      return getVimState(function(state, vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
      });
    });
    afterEach(function() {
      return vimState.resetNormalMode();
    });
    describe("the s keybinding", function() {
      beforeEach(function() {
        return set({
          text: '012345',
          cursor: [0, 1]
        });
      });
      it("deletes the character to the right and enters insert mode", function() {
        return ensure('s', {
          mode: 'insert',
          text: '02345',
          cursor: [0, 1],
          register: {
            '"': {
              text: '1'
            }
          }
        });
      });
      it("is repeatable", function() {
        set({
          cursor: [0, 0]
        });
        keystroke('3 s');
        editor.insertText('ab');
        ensure('escape', {
          text: 'ab345'
        });
        set({
          cursor: [0, 2]
        });
        return ensure('.', {
          text: 'abab'
        });
      });
      it("is undoable", function() {
        set({
          cursor: [0, 0]
        });
        keystroke('3 s');
        editor.insertText('ab');
        ensure('escape', {
          text: 'ab345'
        });
        return ensure('u', {
          text: '012345',
          selectedText: ''
        });
      });
      return describe("in visual mode", function() {
        beforeEach(function() {
          return keystroke('v l s');
        });
        return it("deletes the selected characters and enters insert mode", function() {
          return ensure({
            mode: 'insert',
            text: '0345',
            cursor: [0, 1],
            register: {
              '"': {
                text: '12'
              }
            }
          });
        });
      });
    });
    describe("the S keybinding", function() {
      beforeEach(function() {
        return set({
          text: "12345\nabcde\nABCDE",
          cursor: [1, 3]
        });
      });
      it("deletes the entire line and enters insert mode", function() {
        return ensure('S', {
          mode: 'insert',
          text: "12345\n\nABCDE",
          register: {
            '"': {
              text: 'abcde\n',
              type: 'linewise'
            }
          }
        });
      });
      it("is repeatable", function() {
        keystroke('S');
        editor.insertText('abc');
        ensure('escape', {
          text: '12345\nabc\nABCDE'
        });
        set({
          cursor: [2, 3]
        });
        return ensure('.', {
          text: '12345\nabc\nabc'
        });
      });
      it("is undoable", function() {
        keystroke('S');
        editor.insertText('abc');
        ensure('escape', {
          text: '12345\nabc\nABCDE'
        });
        return ensure('u', {
          text: "12345\nabcde\nABCDE",
          selectedText: ''
        });
      });
      it("works when the cursor's goal column is greater than its current column", function() {
        set({
          text: "\n12345",
          cursor: [1, 2e308]
        });
        return ensure('k S', {
          text: '\n12345'
        });
      });
      return xit("respects indentation", function() {});
    });
    describe("the c keybinding", function() {
      beforeEach(function() {
        return set({
          text: "12345\nabcde\nABCDE"
        });
      });
      describe("when followed by a c", function() {
        describe("with autoindent", function() {
          beforeEach(function() {
            set({
              text: "12345\n  abcde\nABCDE\n"
            });
            set({
              cursor: [1, 1]
            });
            spyOn(editor, 'shouldAutoIndent').andReturn(true);
            spyOn(editor, 'autoIndentBufferRow').andCallFake(function(line) {
              return editor.indent();
            });
            return spyOn(editor.languageMode, 'suggestedIndentForLineAtBufferRow').andCallFake(function() {
              return 1;
            });
          });
          it("deletes the current line and enters insert mode", function() {
            set({
              cursor: [1, 1]
            });
            return ensure('c c', {
              text: "12345\n  \nABCDE\n",
              cursor: [1, 2],
              mode: 'insert'
            });
          });
          it("is repeatable", function() {
            keystroke('c c');
            editor.insertText("abc");
            ensure('escape', {
              text: "12345\n  abc\nABCDE\n"
            });
            set({
              cursor: [2, 3]
            });
            return ensure('.', {
              text: "12345\n  abc\n  abc\n"
            });
          });
          return it("is undoable", function() {
            keystroke('c c');
            editor.insertText("abc");
            ensure('escape', {
              text: "12345\n  abc\nABCDE\n"
            });
            return ensure('u', {
              text: "12345\n  abcde\nABCDE\n",
              selectedText: ''
            });
          });
        });
        describe("when the cursor is on the last line", function() {
          return it("deletes the line's content and enters insert mode on the last line", function() {
            set({
              cursor: [2, 1]
            });
            return ensure('c c', {
              text: "12345\nabcde\n",
              cursor: [2, 0],
              mode: 'insert'
            });
          });
        });
        return describe("when the cursor is on the only line", function() {
          return it("deletes the line's content and enters insert mode", function() {
            set({
              text: "12345",
              cursor: [0, 2]
            });
            return ensure('c c', {
              text: "",
              cursor: [0, 0],
              mode: 'insert'
            });
          });
        });
      });
      describe("when followed by i w", function() {
        it("undo's and redo's completely", function() {
          set({
            cursor: [1, 1]
          });
          ensure('c i w', {
            text: "12345\n\nABCDE",
            cursor: [1, 0],
            mode: 'insert'
          });
          set({
            text: "12345\nfg\nABCDE"
          });
          ensure('escape', {
            text: "12345\nfg\nABCDE",
            mode: 'normal'
          });
          ensure('u', {
            text: "12345\nabcde\nABCDE"
          });
          return ensure('ctrl-r', {
            text: "12345\nfg\nABCDE"
          });
        });
        return it("repeatable", function() {
          set({
            cursor: [1, 1]
          });
          ensure('c i w', {
            text: "12345\n\nABCDE",
            cursor: [1, 0],
            mode: 'insert'
          });
          return ensure('escape j .', {
            text: "12345\n\n",
            cursor: [2, 0],
            mode: 'normal'
          });
        });
      });
      describe("when followed by a w", function() {
        return it("changes the word", function() {
          set({
            text: "word1 word2 word3",
            cursorBuffer: [0, 7]
          });
          return ensure('c w escape', {
            text: "word1 w word3"
          });
        });
      });
      describe("when followed by a G", function() {
        beforeEach(function() {
          var originalText;
          originalText = "12345\nabcde\nABCDE\n";
          return set({
            text: originalText
          });
        });
        describe("on the beginning of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('c G escape', {
              text: '12345\n\n'
            });
          });
        });
        return describe("on the middle of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('c G escape', {
              text: '12345\n\n'
            });
          });
        });
      });
      return describe("when followed by a goto line G", function() {
        beforeEach(function() {
          return set({
            text: "12345\nabcde\nABCDE"
          });
        });
        describe("on the beginning of the second line", function() {
          return it("deletes all the text on the line", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('c 2 G escape', {
              text: '12345\n\nABCDE'
            });
          });
        });
        return describe("on the middle of the second line", function() {
          return it("deletes all the text on the line", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('c 2 G escape', {
              text: '12345\n\nABCDE'
            });
          });
        });
      });
    });
    describe("the C keybinding", function() {
      beforeEach(function() {
        set({
          text: "012\n",
          cursor: [0, 1]
        });
        return keystroke('C');
      });
      return it("deletes the contents until the end of the line and enters insert mode", function() {
        return ensure({
          text: "0\n",
          cursor: [0, 1],
          mode: 'insert'
        });
      });
    });
    describe("the O keybinding", function() {
      beforeEach(function() {
        spyOn(editor, 'shouldAutoIndent').andReturn(true);
        spyOn(editor, 'autoIndentBufferRow').andCallFake(function(line) {
          return editor.indent();
        });
        return set({
          text: "  abc\n  012\n",
          cursor: [1, 1]
        });
      });
      it("switches to insert and adds a newline above the current one", function() {
        keystroke('O');
        return ensure({
          text: "  abc\n  \n  012\n",
          cursor: [1, 2],
          mode: 'insert'
        });
      });
      it("is repeatable", function() {
        set({
          text: "  abc\n  012\n    4spaces\n",
          cursor: [1, 1]
        });
        keystroke('O');
        editor.insertText("def");
        ensure('escape', {
          text: "  abc\n  def\n  012\n    4spaces\n"
        });
        set({
          cursor: [1, 1]
        });
        ensure('.', {
          text: "  abc\n  def\n  def\n  012\n    4spaces\n"
        });
        set({
          cursor: [4, 1]
        });
        return ensure('.', {
          text: "  abc\n  def\n  def\n  012\n    def\n    4spaces\n"
        });
      });
      return it("is undoable", function() {
        keystroke('O');
        editor.insertText("def");
        ensure('escape', {
          text: "  abc\n  def\n  012\n"
        });
        return ensure('u', {
          text: "  abc\n  012\n"
        });
      });
    });
    describe("the o keybinding", function() {
      beforeEach(function() {
        spyOn(editor, 'shouldAutoIndent').andReturn(true);
        spyOn(editor, 'autoIndentBufferRow').andCallFake(function(line) {
          return editor.indent();
        });
        return set({
          text: "abc\n  012\n",
          cursor: [1, 2]
        });
      });
      it("switches to insert and adds a newline above the current one", function() {
        return ensure('o', {
          text: "abc\n  012\n  \n",
          mode: 'insert',
          cursor: [2, 2]
        });
      });
      xit("is repeatable", function() {
        set({
          text: "  abc\n  012\n    4spaces\n",
          cursor: [1, 1]
        });
        keystroke('o');
        editor.insertText("def");
        ensure('escape', {
          text: "  abc\n  012\n  def\n    4spaces\n"
        });
        ensure('.', {
          text: "  abc\n  012\n  def\n  def\n    4spaces\n"
        });
        set({
          cursor: [4, 1]
        });
        return ensure('.', {
          text: "  abc\n  def\n  def\n  012\n    4spaces\n    def\n"
        });
      });
      return it("is undoable", function() {
        keystroke('o');
        editor.insertText("def");
        ensure('escape', {
          text: "abc\n  012\n  def\n"
        });
        return ensure('u', {
          text: "abc\n  012\n"
        });
      });
    });
    describe("the a keybinding", function() {
      beforeEach(function() {
        return set({
          text: "012\n"
        });
      });
      describe("at the beginning of the line", function() {
        beforeEach(function() {
          set({
            cursor: [0, 0]
          });
          return keystroke('a');
        });
        return it("switches to insert mode and shifts to the right", function() {
          return ensure({
            cursor: [0, 1],
            mode: 'insert'
          });
        });
      });
      return describe("at the end of the line", function() {
        beforeEach(function() {
          set({
            cursor: [0, 3]
          });
          return keystroke('a');
        });
        return it("doesn't linewrap", function() {
          return ensure({
            cursor: [0, 3]
          });
        });
      });
    });
    describe("the A keybinding", function() {
      beforeEach(function() {
        return set({
          text: "11\n22\n"
        });
      });
      return describe("at the beginning of a line", function() {
        it("switches to insert mode at the end of the line", function() {
          set({
            cursor: [0, 0]
          });
          return ensure('A', {
            mode: 'insert',
            cursor: [0, 2]
          });
        });
        return it("repeats always as insert at the end of the line", function() {
          set({
            cursor: [0, 0]
          });
          keystroke('A');
          editor.insertText("abc");
          keystroke('escape');
          set({
            cursor: [1, 0]
          });
          return ensure('.', {
            text: "11abc\n22abc\n",
            mode: 'normal',
            cursor: [1, 4]
          });
        });
      });
    });
    describe("the I keybinding", function() {
      beforeEach(function() {
        return set({
          text: "11\n  22\n"
        });
      });
      describe("at the end of a line", function() {
        it("switches to insert mode at the beginning of the line", function() {
          set({
            cursor: [0, 2]
          });
          return ensure('I', {
            cursor: [0, 0],
            mode: 'insert'
          });
        });
        it("switches to insert mode after leading whitespace", function() {
          set({
            cursor: [1, 4]
          });
          return ensure('I', {
            cursor: [1, 2],
            mode: 'insert'
          });
        });
        return it("repeats always as insert at the first character of the line", function() {
          set({
            cursor: [0, 2]
          });
          keystroke('I');
          editor.insertText("abc");
          ensure('escape', {
            cursor: [0, 2]
          });
          set({
            cursor: [1, 4]
          });
          return ensure('.', {
            text: "abc11\n  abc22\n",
            cursor: [1, 4],
            mode: 'normal'
          });
        });
      });
      describe("in visual-characterwise mode", function() {
        beforeEach(function() {
          return set({
            text: "012 456 890"
          });
        });
        describe("selection is not reversed", function() {
          beforeEach(function() {
            set({
              cursor: [0, 4]
            });
            return ensure("v l l", {
              selectedText: "456",
              selectionIsReversed: false
            });
          });
          it("insert at start of selection", function() {
            return ensure("I", {
              cursor: [0, 4],
              mode: "insert"
            });
          });
          return it("insert at end of selection", function() {
            return ensure("A", {
              cursor: [0, 7],
              mode: "insert"
            });
          });
        });
        return describe("selection is reversed", function() {
          beforeEach(function() {
            set({
              cursor: [0, 6]
            });
            return ensure("v h h", {
              selectedText: "456",
              selectionIsReversed: true
            });
          });
          it("insert at start of selection", function() {
            return ensure("I", {
              cursor: [0, 4],
              mode: "insert"
            });
          });
          return it("insert at end of selection", function() {
            return ensure("A", {
              cursor: [0, 7],
              mode: "insert"
            });
          });
        });
      });
      return describe("in visual-linewise mode", function() {
        beforeEach(function() {
          return set({
            text: "0: 3456 890\n1: 3456 890\n2: 3456 890\n3: 3456 890"
          });
        });
        describe("selection is not reversed", function() {
          beforeEach(function() {
            set({
              cursor: [1, 3]
            });
            return ensure("V j", {
              selectedText: "1: 3456 890\n2: 3456 890\n",
              selectionIsReversed: false
            });
          });
          it("insert at start of selection", function() {
            return ensure("I", {
              cursor: [1, 0],
              mode: "insert"
            });
          });
          return it("insert at end of selection", function() {
            return ensure("A", {
              cursor: [3, 0],
              mode: "insert"
            });
          });
        });
        return describe("selection is reversed", function() {
          beforeEach(function() {
            set({
              cursor: [2, 3]
            });
            return ensure("V k", {
              selectedText: "1: 3456 890\n2: 3456 890\n",
              selectionIsReversed: true
            });
          });
          it("insert at start of selection", function() {
            return ensure("I", {
              cursor: [1, 0],
              mode: "insert"
            });
          });
          return it("insert at end of selection", function() {
            return ensure("A", {
              cursor: [3, 0],
              mode: "insert"
            });
          });
        });
      });
    });
    describe("InsertAtPreviousFoldStart and Next", function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.packages.activatePackage('language-coffee-script');
        });
        getVimState('sample.coffee', function(state, vim) {
          editor = state.editor, editorElement = state.editorElement;
          return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
        });
        return runs(function() {
          return atom.keymaps.add("test", {
            'atom-text-editor.vim-mode-plus.normal-mode': {
              'g [': 'vim-mode-plus:insert-at-previous-fold-start',
              'g ]': 'vim-mode-plus:insert-at-next-fold-start'
            }
          });
        });
      });
      afterEach(function() {
        return atom.packages.deactivatePackage('language-coffee-script');
      });
      describe("when cursor is not at fold start row", function() {
        beforeEach(function() {
          return set({
            cursor: [16, 0]
          });
        });
        it("insert at previous fold start row", function() {
          return ensure('g [', {
            cursor: [9, 2],
            mode: 'insert'
          });
        });
        return it("insert at next fold start row", function() {
          return ensure('g ]', {
            cursor: [18, 4],
            mode: 'insert'
          });
        });
      });
      return describe("when cursor is at fold start row", function() {
        beforeEach(function() {
          return set({
            cursor: [20, 6]
          });
        });
        it("insert at previous fold start row", function() {
          return ensure('g [', {
            cursor: [18, 4],
            mode: 'insert'
          });
        });
        return it("insert at next fold start row", function() {
          return ensure('g ]', {
            cursor: [22, 6],
            mode: 'insert'
          });
        });
      });
    });
    describe("the i keybinding", function() {
      beforeEach(function() {
        return set({
          text: "123\n4567",
          cursorBuffer: [[0, 0], [1, 0]]
        });
      });
      it("allows undoing an entire batch of typing", function() {
        keystroke('i');
        editor.insertText("abcXX");
        editor.backspace();
        editor.backspace();
        ensure('escape', {
          text: "abc123\nabc4567"
        });
        keystroke('i');
        editor.insertText("d");
        editor.insertText("e");
        editor.insertText("f");
        ensure('escape', {
          text: "abdefc123\nabdefc4567"
        });
        ensure('u', {
          text: "abc123\nabc4567"
        });
        return ensure('u', {
          text: "123\n4567"
        });
      });
      it("allows repeating typing", function() {
        keystroke('i');
        editor.insertText("abcXX");
        editor.backspace();
        editor.backspace();
        ensure('escape', {
          text: "abc123\nabc4567"
        });
        ensure('.', {
          text: "ababcc123\nababcc4567"
        });
        return ensure('.', {
          text: "abababccc123\nabababccc4567"
        });
      });
      return describe('with nonlinear input', function() {
        beforeEach(function() {
          return set({
            text: '',
            cursorBuffer: [0, 0]
          });
        });
        it('deals with auto-matched brackets', function() {
          keystroke('i');
          editor.insertText('()');
          editor.moveLeft();
          editor.insertText('a');
          editor.moveRight();
          editor.insertText('b\n');
          ensure('escape', {
            cursor: [1, 0]
          });
          return ensure('.', {
            text: '(a)b\n(a)b\n',
            cursor: [2, 0]
          });
        });
        return it('deals with autocomplete', function() {
          keystroke('i');
          editor.insertText('a');
          editor.insertText('d');
          editor.insertText('d');
          editor.setTextInBufferRange([[0, 0], [0, 3]], 'addFoo');
          ensure('escape', {
            cursor: [0, 5],
            text: 'addFoo'
          });
          return ensure('.', {
            text: 'addFoaddFooo',
            cursor: [0, 10]
          });
        });
      });
    });
    describe('the a keybinding', function() {
      beforeEach(function() {
        return set({
          text: '',
          cursorBuffer: [0, 0]
        });
      });
      it("can be undone in one go", function() {
        keystroke('a');
        editor.insertText("abc");
        ensure('escape', {
          text: "abc"
        });
        return ensure('u', {
          text: ""
        });
      });
      return it("repeats correctly", function() {
        keystroke('a');
        editor.insertText("abc");
        ensure('escape', {
          text: "abc",
          cursor: [0, 2]
        });
        return ensure('.', {
          text: "abcabc",
          cursor: [0, 5]
        });
      });
    });
    describe('preserve inserted text', function() {
      beforeEach(function() {
        return set({
          text: "\n\n",
          cursorBuffer: [0, 0]
        });
      });
      return describe("save inserted text to '.' register", function() {
        var ensureDotRegister;
        ensureDotRegister = function(key, arg) {
          var text;
          text = arg.text;
          keystroke(key);
          editor.insertText(text);
          return ensure("escape", {
            register: {
              '.': {
                text: text
              }
            }
          });
        };
        it("[case-i]", function() {
          return ensureDotRegister('i', {
            text: 'abc'
          });
        });
        it("[case-o]", function() {
          return ensureDotRegister('o', {
            text: 'abc'
          });
        });
        it("[case-c]", function() {
          return ensureDotRegister('c', {
            text: 'abc'
          });
        });
        it("[case-C]", function() {
          return ensureDotRegister('C', {
            text: 'abc'
          });
        });
        return it("[case-s]", function() {
          return ensureDotRegister('s', {
            text: 'abc'
          });
        });
      });
    });
    describe("repeat backspace/delete happened in insert-mode", function() {
      describe("single cursor operation", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 0],
            text: "123\n123"
          });
        });
        it("can repeat backspace only mutation: case-i", function() {
          set({
            cursor: [0, 1]
          });
          keystroke('i');
          editor.backspace();
          ensure('escape', {
            text: "23\n123",
            cursor: [0, 0]
          });
          ensure('j .', {
            text: "23\n123"
          });
          return ensure('l .', {
            text: "23\n23"
          });
        });
        it("can repeat backspace only mutation: case-a", function() {
          keystroke('a');
          editor.backspace();
          ensure('escape', {
            text: "23\n123",
            cursor: [0, 0]
          });
          ensure('.', {
            text: "3\n123",
            cursor: [0, 0]
          });
          return ensure('j . .', {
            text: "3\n3"
          });
        });
        it("can repeat delete only mutation: case-i", function() {
          keystroke('i');
          editor["delete"]();
          ensure('escape', {
            text: "23\n123"
          });
          return ensure('j .', {
            text: "23\n23"
          });
        });
        it("can repeat delete only mutation: case-a", function() {
          keystroke('a');
          editor["delete"]();
          ensure('escape', {
            text: "13\n123"
          });
          return ensure('j .', {
            text: "13\n13"
          });
        });
        it("can repeat backspace and insert mutation: case-i", function() {
          set({
            cursor: [0, 1]
          });
          keystroke('i');
          editor.backspace();
          editor.insertText("!!!");
          ensure('escape', {
            text: "!!!23\n123"
          });
          set({
            cursor: [1, 1]
          });
          return ensure('.', {
            text: "!!!23\n!!!23"
          });
        });
        it("can repeat backspace and insert mutation: case-a", function() {
          keystroke('a');
          editor.backspace();
          editor.insertText("!!!");
          ensure('escape', {
            text: "!!!23\n123"
          });
          return ensure('j 0 .', {
            text: "!!!23\n!!!23"
          });
        });
        it("can repeat delete and insert mutation: case-i", function() {
          keystroke('i');
          editor["delete"]();
          editor.insertText("!!!");
          ensure('escape', {
            text: "!!!23\n123"
          });
          return ensure('j 0 .', {
            text: "!!!23\n!!!23"
          });
        });
        return it("can repeat delete and insert mutation: case-a", function() {
          keystroke('a');
          editor["delete"]();
          editor.insertText("!!!");
          ensure('escape', {
            text: "1!!!3\n123"
          });
          return ensure('j 0 .', {
            text: "1!!!3\n1!!!3"
          });
        });
      });
      return describe("multi-cursors operation", function() {
        beforeEach(function() {
          return set({
            text: "123\n\n1234\n\n12345",
            cursor: [[0, 0], [2, 0], [4, 0]]
          });
        });
        it("can repeat backspace only mutation: case-multi-cursors", function() {
          ensure('A', {
            cursor: [[0, 3], [2, 4], [4, 5]],
            mode: 'insert'
          });
          editor.backspace();
          ensure('escape', {
            text: "12\n\n123\n\n1234",
            cursor: [[0, 1], [2, 2], [4, 3]]
          });
          return ensure('.', {
            text: "1\n\n12\n\n123",
            cursor: [[0, 0], [2, 1], [4, 2]]
          });
        });
        return it("can repeat delete only mutation: case-multi-cursors", function() {
          var cursors;
          ensure('I', {
            mode: 'insert'
          });
          editor["delete"]();
          cursors = [[0, 0], [2, 0], [4, 0]];
          ensure('escape', {
            text: "23\n\n234\n\n2345",
            cursor: cursors
          });
          ensure('.', {
            text: "3\n\n34\n\n345",
            cursor: cursors
          });
          ensure('.', {
            text: "\n\n4\n\n45",
            cursor: cursors
          });
          ensure('.', {
            text: "\n\n\n\n5",
            cursor: cursors
          });
          return ensure('.', {
            text: "\n\n\n\n",
            cursor: cursors
          });
        });
      });
    });
    return describe('specify insertion count', function() {
      var ensureInsertionCount;
      ensureInsertionCount = function(key, arg) {
        var cursor, insert, text;
        insert = arg.insert, text = arg.text, cursor = arg.cursor;
        keystroke(key);
        editor.insertText(insert);
        return ensure("escape", {
          text: text,
          cursor: cursor
        });
      };
      beforeEach(function() {
        var initialText;
        initialText = "*\n*\n";
        set({
          text: "",
          cursor: [0, 0]
        });
        keystroke('i');
        editor.insertText(initialText);
        return ensure("escape g g", {
          text: initialText,
          cursor: [0, 0]
        });
      });
      return describe("repeat insertion count times", function() {
        it("[case-i]", function() {
          return ensureInsertionCount('3 i', {
            insert: '=',
            text: "===*\n*\n",
            cursor: [0, 2]
          });
        });
        it("[case-o]", function() {
          return ensureInsertionCount('3 o', {
            insert: '=',
            text: "*\n=\n=\n=\n*\n",
            cursor: [3, 0]
          });
        });
        it("[case-O]", function() {
          return ensureInsertionCount('3 O', {
            insert: '=',
            text: "=\n=\n=\n*\n*\n",
            cursor: [2, 0]
          });
        });
        return describe("children of Change operation won't repeate insertion count times", function() {
          beforeEach(function() {
            set({
              text: "",
              cursor: [0, 0]
            });
            keystroke('i');
            editor.insertText('*');
            return ensure('escape g g', {
              text: '*',
              cursor: [0, 0]
            });
          });
          it("[case-c]", function() {
            return ensureInsertionCount('3 c w', {
              insert: '=',
              text: "=",
              cursor: [0, 0]
            });
          });
          it("[case-C]", function() {
            return ensureInsertionCount('3 C', {
              insert: '=',
              text: "=",
              cursor: [0, 0]
            });
          });
          it("[case-s]", function() {
            return ensureInsertionCount('3 s', {
              insert: '=',
              text: "=",
              cursor: [0, 0]
            });
          });
          return it("[case-S]", function() {
            return ensureInsertionCount('3 S', {
              insert: '=',
              text: "=",
              cursor: [0, 0]
            });
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL29wZXJhdG9yLWFjdGl2YXRlLWluc2VydC1tb2RlLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUEwQixPQUFBLENBQVEsZUFBUixDQUExQixFQUFDLDZCQUFELEVBQWM7O0VBQ2QsUUFBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7RUFDVixVQUFXLE9BQUEsQ0FBUSxNQUFSOztFQUVaLFFBQUEsQ0FBUyxvQ0FBVCxFQUErQyxTQUFBO0FBQzdDLFFBQUE7SUFBQSxPQUE0RCxFQUE1RCxFQUFDLGFBQUQsRUFBTSxnQkFBTixFQUFjLG1CQUFkLEVBQXlCLGdCQUF6QixFQUFpQyx1QkFBakMsRUFBZ0Q7SUFFaEQsVUFBQSxDQUFXLFNBQUE7YUFDVCxXQUFBLENBQVksU0FBQyxLQUFELEVBQVEsR0FBUjtRQUNWLFFBQUEsR0FBVztRQUNWLHdCQUFELEVBQVM7ZUFDUixhQUFELEVBQU0sbUJBQU4sRUFBYyx5QkFBZCxFQUEyQjtNQUhqQixDQUFaO0lBRFMsQ0FBWDtJQU1BLFNBQUEsQ0FBVSxTQUFBO2FBQ1IsUUFBUSxDQUFDLGVBQVQsQ0FBQTtJQURRLENBQVY7SUFHQSxRQUFBLENBQVMsa0JBQVQsRUFBNkIsU0FBQTtNQUMzQixVQUFBLENBQVcsU0FBQTtlQUNULEdBQUEsQ0FBSTtVQUFBLElBQUEsRUFBTSxRQUFOO1VBQWdCLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQXhCO1NBQUo7TUFEUyxDQUFYO01BR0EsRUFBQSxDQUFHLDJEQUFILEVBQWdFLFNBQUE7ZUFDOUQsTUFBQSxDQUFPLEdBQVAsRUFDRTtVQUFBLElBQUEsRUFBTSxRQUFOO1VBQ0EsSUFBQSxFQUFNLE9BRE47VUFFQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUZSO1VBR0Es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QSxDQUFxQixLQUFyQixFQUE0QjtjQUFBLE1BQUEsRUFBUSxHQUFSO2NBQWEsSUFBQSxFQUFNLEdBQW5CO2NBQXdCLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWhDO2FBQTVCO1VBQUgsQ0FBZjtRQVYyRSxDQUE3RTtNQUx1QyxDQUF6QztJQWJrQyxDQUFwQztFQW5vQjZDLENBQS9DO0FBSkEiLCJzb3VyY2VzQ29udGVudCI6WyJ7Z2V0VmltU3RhdGUsIGRpc3BhdGNofSA9IHJlcXVpcmUgJy4vc3BlYy1oZWxwZXInXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4uL2xpYi9zZXR0aW5ncydcbntpbnNwZWN0fSA9IHJlcXVpcmUgJ3V0aWwnXG5cbmRlc2NyaWJlIFwiT3BlcmF0b3IgQWN0aXZhdGVJbnNlcnRNb2RlIGZhbWlseVwiLCAtPlxuICBbc2V0LCBlbnN1cmUsIGtleXN0cm9rZSwgZWRpdG9yLCBlZGl0b3JFbGVtZW50LCB2aW1TdGF0ZV0gPSBbXVxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICBnZXRWaW1TdGF0ZSAoc3RhdGUsIHZpbSkgLT5cbiAgICAgIHZpbVN0YXRlID0gc3RhdGVcbiAgICAgIHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9ID0gdmltU3RhdGVcbiAgICAgIHtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlfSA9IHZpbVxuXG4gIGFmdGVyRWFjaCAtPlxuICAgIHZpbVN0YXRlLnJlc2V0Tm9ybWFsTW9kZSgpXG5cbiAgZGVzY3JpYmUgXCJ0aGUgcyBrZXliaW5kaW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0IHRleHQ6ICcwMTIzNDUnLCBjdXJzb3I6IFswLCAxXVxuXG4gICAgaXQgXCJkZWxldGVzIHRoZSBjaGFyYWN0ZXIgdG8gdGhlIHJpZ2h0IGFuZCBlbnRlcnMgaW5zZXJ0IG1vZGVcIiwgLT5cbiAgICAgIGVuc3VyZSAncycsXG4gICAgICAgIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgIHRleHQ6ICcwMjM0NSdcbiAgICAgICAgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICcxJ1xuXG4gICAgaXQgXCJpcyByZXBlYXRhYmxlXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGtleXN0cm9rZSAnMyBzJ1xuICAgICAgZWRpdG9yLmluc2VydFRleHQgJ2FiJ1xuICAgICAgZW5zdXJlICdlc2NhcGUnLCB0ZXh0OiAnYWIzNDUnXG4gICAgICBzZXQgY3Vyc29yOiBbMCwgMl1cbiAgICAgIGVuc3VyZSAnLicsIHRleHQ6ICdhYmFiJ1xuXG4gICAgaXQgXCJpcyB1bmRvYWJsZVwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICBrZXlzdHJva2UgJzMgcydcbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0ICdhYidcbiAgICAgIGVuc3VyZSAnZXNjYXBlJywgdGV4dDogJ2FiMzQ1J1xuICAgICAgZW5zdXJlICd1JywgdGV4dDogJzAxMjM0NScsIHNlbGVjdGVkVGV4dDogJydcblxuICAgIGRlc2NyaWJlIFwiaW4gdmlzdWFsIG1vZGVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAga2V5c3Ryb2tlICd2IGwgcydcblxuICAgICAgaXQgXCJkZWxldGVzIHRoZSBzZWxlY3RlZCBjaGFyYWN0ZXJzIGFuZCBlbnRlcnMgaW5zZXJ0IG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlXG4gICAgICAgICAgbW9kZTogJ2luc2VydCdcbiAgICAgICAgICB0ZXh0OiAnMDM0NSdcbiAgICAgICAgICBjdXJzb3I6IFswLCAxXVxuICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMTInXG5cbiAgZGVzY3JpYmUgXCJ0aGUgUyBrZXliaW5kaW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiMTIzNDVcXG5hYmNkZVxcbkFCQ0RFXCJcbiAgICAgICAgY3Vyc29yOiBbMSwgM11cblxuICAgIGl0IFwiZGVsZXRlcyB0aGUgZW50aXJlIGxpbmUgYW5kIGVudGVycyBpbnNlcnQgbW9kZVwiLCAtPlxuICAgICAgZW5zdXJlICdTJyxcbiAgICAgICAgbW9kZTogJ2luc2VydCdcbiAgICAgICAgdGV4dDogXCIxMjM0NVxcblxcbkFCQ0RFXCJcbiAgICAgICAgcmVnaXN0ZXI6IHsnXCInOiB0ZXh0OiAnYWJjZGVcXG4nLCB0eXBlOiAnbGluZXdpc2UnfVxuXG4gICAgaXQgXCJpcyByZXBlYXRhYmxlXCIsIC0+XG4gICAgICBrZXlzdHJva2UgJ1MnXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCAnYWJjJ1xuICAgICAgZW5zdXJlICdlc2NhcGUnLCB0ZXh0OiAnMTIzNDVcXG5hYmNcXG5BQkNERSdcbiAgICAgIHNldCBjdXJzb3I6IFsyLCAzXVxuICAgICAgZW5zdXJlICcuJywgdGV4dDogJzEyMzQ1XFxuYWJjXFxuYWJjJ1xuXG4gICAgaXQgXCJpcyB1bmRvYWJsZVwiLCAtPlxuICAgICAga2V5c3Ryb2tlICdTJ1xuICAgICAgZWRpdG9yLmluc2VydFRleHQgJ2FiYydcbiAgICAgIGVuc3VyZSAnZXNjYXBlJywgdGV4dDogJzEyMzQ1XFxuYWJjXFxuQUJDREUnXG4gICAgICBlbnN1cmUgJ3UnLCB0ZXh0OiBcIjEyMzQ1XFxuYWJjZGVcXG5BQkNERVwiLCBzZWxlY3RlZFRleHQ6ICcnXG5cbiAgICAjIEhlcmUgaXMgb3JpZ2luYWwgc3BlYyBJIGJlbGlldmUgaXRzIG5vdCBjb3JyZWN0LCBpZiBpdCBzYXlzICd3b3JrcydcbiAgICAjIHRleHQgcmVzdWx0IHNob3VsZCBiZSAnXFxuJyBzaW5jZSBTIGRlbGV0ZSBjdXJyZW50IGxpbmUuXG4gICAgIyBJdHMgb3JpZ25hbGx5IGFkZGVkIGluIGZvbGxvd2luZyBjb21taXQsIGFzIGZpeCBvZiBTKGZyb20gZGVzY3JpcHRpb24pLlxuICAgICMgQnV0IG9yaWdpbmFsIFN1YnN0aXR1dGVMaW5lIHJlcGxhY2VkIHdpdGggQ2hhbmdlIGFuZCBNb3ZlVG9SZWxhdGl2ZUxpbmUgY29tYm8uXG4gICAgIyBJIGJlbGlldmUgdGhpcyBzcGVjIHNob3VsZCBoYXZlIGJlZW4gZmFpbGVkIGF0IHRoYXQgdGltZSwgYnV0IGhhdmVudCcuXG4gICAgIyBodHRwczovL2dpdGh1Yi5jb20vYXRvbS92aW0tbW9kZS9jb21taXQvNmFjZmZkMjU1OWU1NmY3YzE4YTRkNzY2ZjBhZDkyYzllZDYyMTJhZVxuICAgICNcbiAgICAjIGl0IFwid29ya3Mgd2hlbiB0aGUgY3Vyc29yJ3MgZ29hbCBjb2x1bW4gaXMgZ3JlYXRlciB0aGFuIGl0cyBjdXJyZW50IGNvbHVtblwiLCAtPlxuICAgICMgICBzZXQgdGV4dDogXCJcXG4xMjM0NVwiLCBjdXJzb3I6IFsxLCBJbmZpbml0eV1cbiAgICAjICAgZW5zdXJlICdrUycsIHRleHQ6ICdcXG4xMjM0NSdcblxuICAgIGl0IFwid29ya3Mgd2hlbiB0aGUgY3Vyc29yJ3MgZ29hbCBjb2x1bW4gaXMgZ3JlYXRlciB0aGFuIGl0cyBjdXJyZW50IGNvbHVtblwiLCAtPlxuICAgICAgc2V0IHRleHQ6IFwiXFxuMTIzNDVcIiwgY3Vyc29yOiBbMSwgSW5maW5pdHldXG4gICAgICAjIFNob3VsZCBiZSBoZXJlLCBidXQgSSBjb21tZW50ZWQgb3V0IGJlZm9yZSBJIGhhdmUgY29uZmlkZW5jZS5cbiAgICAgICMgZW5zdXJlICdrUycsIHRleHQ6ICdcXG4nXG4gICAgICAjIEZvbG93aW5nIGxpbmUgaW5jbHVkZSBCdWcgaWJlbGlldmUuXG4gICAgICBlbnN1cmUgJ2sgUycsIHRleHQ6ICdcXG4xMjM0NSdcbiAgICAjIENhbid0IGJlIHRlc3RlZCB3aXRob3V0IHNldHRpbmcgZ3JhbW1hciBvZiB0ZXN0IGJ1ZmZlclxuICAgIHhpdCBcInJlc3BlY3RzIGluZGVudGF0aW9uXCIsIC0+XG5cbiAgZGVzY3JpYmUgXCJ0aGUgYyBrZXliaW5kaW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0IHRleHQ6IFwiXCJcIlxuICAgICAgICAxMjM0NVxuICAgICAgICBhYmNkZVxuICAgICAgICBBQkNERVxuICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwid2hlbiBmb2xsb3dlZCBieSBhIGNcIiwgLT5cbiAgICAgIGRlc2NyaWJlIFwid2l0aCBhdXRvaW5kZW50XCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXQgdGV4dDogXCIxMjM0NVxcbiAgYWJjZGVcXG5BQkNERVxcblwiXG4gICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDFdXG4gICAgICAgICAgc3B5T24oZWRpdG9yLCAnc2hvdWxkQXV0b0luZGVudCcpLmFuZFJldHVybih0cnVlKVxuICAgICAgICAgIHNweU9uKGVkaXRvciwgJ2F1dG9JbmRlbnRCdWZmZXJSb3cnKS5hbmRDYWxsRmFrZSAobGluZSkgLT5cbiAgICAgICAgICAgIGVkaXRvci5pbmRlbnQoKVxuICAgICAgICAgIHNweU9uKGVkaXRvci5sYW5ndWFnZU1vZGUsICdzdWdnZXN0ZWRJbmRlbnRGb3JMaW5lQXRCdWZmZXJSb3cnKS5hbmRDYWxsRmFrZSAtPiAxXG5cbiAgICAgICAgaXQgXCJkZWxldGVzIHRoZSBjdXJyZW50IGxpbmUgYW5kIGVudGVycyBpbnNlcnQgbW9kZVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAxXVxuICAgICAgICAgIGVuc3VyZSAnYyBjJyxcbiAgICAgICAgICAgIHRleHQ6IFwiMTIzNDVcXG4gIFxcbkFCQ0RFXFxuXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzEsIDJdXG4gICAgICAgICAgICBtb2RlOiAnaW5zZXJ0J1xuXG4gICAgICAgIGl0IFwiaXMgcmVwZWF0YWJsZVwiLCAtPlxuICAgICAgICAgIGtleXN0cm9rZSAnYyBjJ1xuICAgICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KFwiYWJjXCIpXG4gICAgICAgICAgZW5zdXJlICdlc2NhcGUnLCB0ZXh0OiBcIjEyMzQ1XFxuICBhYmNcXG5BQkNERVxcblwiXG4gICAgICAgICAgc2V0IGN1cnNvcjogWzIsIDNdXG4gICAgICAgICAgZW5zdXJlICcuJywgdGV4dDogXCIxMjM0NVxcbiAgYWJjXFxuICBhYmNcXG5cIlxuXG4gICAgICAgIGl0IFwiaXMgdW5kb2FibGVcIiwgLT5cbiAgICAgICAgICBrZXlzdHJva2UgJ2MgYydcbiAgICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dChcImFiY1wiKVxuICAgICAgICAgIGVuc3VyZSAnZXNjYXBlJywgdGV4dDogXCIxMjM0NVxcbiAgYWJjXFxuQUJDREVcXG5cIlxuICAgICAgICAgIGVuc3VyZSAndScsIHRleHQ6IFwiMTIzNDVcXG4gIGFiY2RlXFxuQUJDREVcXG5cIiwgc2VsZWN0ZWRUZXh0OiAnJ1xuXG4gICAgICBkZXNjcmliZSBcIndoZW4gdGhlIGN1cnNvciBpcyBvbiB0aGUgbGFzdCBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgbGluZSdzIGNvbnRlbnQgYW5kIGVudGVycyBpbnNlcnQgbW9kZSBvbiB0aGUgbGFzdCBsaW5lXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzIsIDFdXG4gICAgICAgICAgZW5zdXJlICdjIGMnLFxuICAgICAgICAgICAgdGV4dDogXCIxMjM0NVxcbmFiY2RlXFxuXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzIsIDBdXG4gICAgICAgICAgICBtb2RlOiAnaW5zZXJ0J1xuXG4gICAgICBkZXNjcmliZSBcIndoZW4gdGhlIGN1cnNvciBpcyBvbiB0aGUgb25seSBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgbGluZSdzIGNvbnRlbnQgYW5kIGVudGVycyBpbnNlcnQgbW9kZVwiLCAtPlxuICAgICAgICAgIHNldCB0ZXh0OiBcIjEyMzQ1XCIsIGN1cnNvcjogWzAsIDJdXG4gICAgICAgICAgZW5zdXJlICdjIGMnLFxuICAgICAgICAgICAgdGV4dDogXCJcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICAgIG1vZGU6ICdpbnNlcnQnXG5cbiAgICBkZXNjcmliZSBcIndoZW4gZm9sbG93ZWQgYnkgaSB3XCIsIC0+XG4gICAgICBpdCBcInVuZG8ncyBhbmQgcmVkbydzIGNvbXBsZXRlbHlcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzEsIDFdXG4gICAgICAgIGVuc3VyZSAnYyBpIHcnLFxuICAgICAgICAgIHRleHQ6IFwiMTIzNDVcXG5cXG5BQkNERVwiXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICBtb2RlOiAnaW5zZXJ0J1xuXG4gICAgICAgICMgSnVzdCBjYW5ub3QgZ2V0IFwidHlwaW5nXCIgdG8gd29yayBjb3JyZWN0bHkgaW4gdGVzdC5cbiAgICAgICAgc2V0IHRleHQ6IFwiMTIzNDVcXG5mZ1xcbkFCQ0RFXCJcbiAgICAgICAgZW5zdXJlICdlc2NhcGUnLFxuICAgICAgICAgIHRleHQ6IFwiMTIzNDVcXG5mZ1xcbkFCQ0RFXCJcbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICBlbnN1cmUgJ3UnLCB0ZXh0OiBcIjEyMzQ1XFxuYWJjZGVcXG5BQkNERVwiXG4gICAgICAgIGVuc3VyZSAnY3RybC1yJywgdGV4dDogXCIxMjM0NVxcbmZnXFxuQUJDREVcIlxuXG4gICAgICBpdCBcInJlcGVhdGFibGVcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzEsIDFdXG4gICAgICAgIGVuc3VyZSAnYyBpIHcnLFxuICAgICAgICAgIHRleHQ6IFwiMTIzNDVcXG5cXG5BQkNERVwiXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICBtb2RlOiAnaW5zZXJ0J1xuXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlIGogLicsXG4gICAgICAgICAgdGV4dDogXCIxMjM0NVxcblxcblwiXG4gICAgICAgICAgY3Vyc29yOiBbMiwgMF1cbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIGJ5IGEgd1wiLCAtPlxuICAgICAgaXQgXCJjaGFuZ2VzIHRoZSB3b3JkXCIsIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIndvcmQxIHdvcmQyIHdvcmQzXCIsIGN1cnNvckJ1ZmZlcjogWzAsIDddXG4gICAgICAgIGVuc3VyZSAnYyB3IGVzY2FwZScsIHRleHQ6IFwid29yZDEgdyB3b3JkM1wiXG5cbiAgICBkZXNjcmliZSBcIndoZW4gZm9sbG93ZWQgYnkgYSBHXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIG9yaWdpbmFsVGV4dCA9IFwiMTIzNDVcXG5hYmNkZVxcbkFCQ0RFXFxuXCJcbiAgICAgICAgc2V0IHRleHQ6IG9yaWdpbmFsVGV4dFxuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNlY29uZCBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgYm90dG9tIHR3byBsaW5lc1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnYyBHIGVzY2FwZScsIHRleHQ6ICcxMjM0NVxcblxcbidcblxuICAgICAgZGVzY3JpYmUgXCJvbiB0aGUgbWlkZGxlIG9mIHRoZSBzZWNvbmQgbGluZVwiLCAtPlxuICAgICAgICBpdCBcImRlbGV0ZXMgdGhlIGJvdHRvbSB0d28gbGluZXNcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgICBlbnN1cmUgJ2MgRyBlc2NhcGUnLCB0ZXh0OiAnMTIzNDVcXG5cXG4nXG5cbiAgICBkZXNjcmliZSBcIndoZW4gZm9sbG93ZWQgYnkgYSBnb3RvIGxpbmUgR1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogXCIxMjM0NVxcbmFiY2RlXFxuQUJDREVcIlxuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNlY29uZCBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyBhbGwgdGhlIHRleHQgb24gdGhlIGxpbmVcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICBlbnN1cmUgJ2MgMiBHIGVzY2FwZScsIHRleHQ6ICcxMjM0NVxcblxcbkFCQ0RFJ1xuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBtaWRkbGUgb2YgdGhlIHNlY29uZCBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyBhbGwgdGhlIHRleHQgb24gdGhlIGxpbmVcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgICBlbnN1cmUgJ2MgMiBHIGVzY2FwZScsIHRleHQ6ICcxMjM0NVxcblxcbkFCQ0RFJ1xuXG4gIGRlc2NyaWJlIFwidGhlIEMga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldCB0ZXh0OiBcIjAxMlxcblwiLCBjdXJzb3I6IFswLCAxXVxuICAgICAga2V5c3Ryb2tlICdDJ1xuXG4gICAgaXQgXCJkZWxldGVzIHRoZSBjb250ZW50cyB1bnRpbCB0aGUgZW5kIG9mIHRoZSBsaW5lIGFuZCBlbnRlcnMgaW5zZXJ0IG1vZGVcIiwgLT5cbiAgICAgIGVuc3VyZVxuICAgICAgICB0ZXh0OiBcIjBcXG5cIlxuICAgICAgICBjdXJzb3I6IFswLCAxXVxuICAgICAgICBtb2RlOiAnaW5zZXJ0J1xuXG4gIGRlc2NyaWJlIFwidGhlIE8ga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNweU9uKGVkaXRvciwgJ3Nob3VsZEF1dG9JbmRlbnQnKS5hbmRSZXR1cm4odHJ1ZSlcbiAgICAgIHNweU9uKGVkaXRvciwgJ2F1dG9JbmRlbnRCdWZmZXJSb3cnKS5hbmRDYWxsRmFrZSAobGluZSkgLT5cbiAgICAgICAgZWRpdG9yLmluZGVudCgpXG5cbiAgICAgIHNldCB0ZXh0OiBcIiAgYWJjXFxuICAwMTJcXG5cIiwgY3Vyc29yOiBbMSwgMV1cblxuICAgIGl0IFwic3dpdGNoZXMgdG8gaW5zZXJ0IGFuZCBhZGRzIGEgbmV3bGluZSBhYm92ZSB0aGUgY3VycmVudCBvbmVcIiwgLT5cbiAgICAgIGtleXN0cm9rZSAnTydcbiAgICAgIGVuc3VyZVxuICAgICAgICB0ZXh0OiBcIiAgYWJjXFxuICBcXG4gIDAxMlxcblwiXG4gICAgICAgIGN1cnNvcjogWzEsIDJdXG4gICAgICAgIG1vZGU6ICdpbnNlcnQnXG5cbiAgICBpdCBcImlzIHJlcGVhdGFibGVcIiwgLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIiAgYWJjXFxuICAwMTJcXG4gICAgNHNwYWNlc1xcblwiLCBjdXJzb3I6IFsxLCAxXVxuICAgICAga2V5c3Ryb2tlICdPJ1xuICAgICAgZWRpdG9yLmluc2VydFRleHQgXCJkZWZcIlxuICAgICAgZW5zdXJlICdlc2NhcGUnLCB0ZXh0OiBcIiAgYWJjXFxuICBkZWZcXG4gIDAxMlxcbiAgICA0c3BhY2VzXFxuXCJcbiAgICAgIHNldCBjdXJzb3I6IFsxLCAxXVxuICAgICAgZW5zdXJlICcuJywgdGV4dDogXCIgIGFiY1xcbiAgZGVmXFxuICBkZWZcXG4gIDAxMlxcbiAgICA0c3BhY2VzXFxuXCJcbiAgICAgIHNldCBjdXJzb3I6IFs0LCAxXVxuICAgICAgZW5zdXJlICcuJywgdGV4dDogXCIgIGFiY1xcbiAgZGVmXFxuICBkZWZcXG4gIDAxMlxcbiAgICBkZWZcXG4gICAgNHNwYWNlc1xcblwiXG5cbiAgICBpdCBcImlzIHVuZG9hYmxlXCIsIC0+XG4gICAgICBrZXlzdHJva2UgJ08nXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcImRlZlwiXG4gICAgICBlbnN1cmUgJ2VzY2FwZScsIHRleHQ6IFwiICBhYmNcXG4gIGRlZlxcbiAgMDEyXFxuXCJcbiAgICAgIGVuc3VyZSAndScsIHRleHQ6IFwiICBhYmNcXG4gIDAxMlxcblwiXG5cbiAgZGVzY3JpYmUgXCJ0aGUgbyBrZXliaW5kaW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc3B5T24oZWRpdG9yLCAnc2hvdWxkQXV0b0luZGVudCcpLmFuZFJldHVybih0cnVlKVxuICAgICAgc3B5T24oZWRpdG9yLCAnYXV0b0luZGVudEJ1ZmZlclJvdycpLmFuZENhbGxGYWtlIChsaW5lKSAtPlxuICAgICAgICBlZGl0b3IuaW5kZW50KClcblxuICAgICAgc2V0IHRleHQ6IFwiYWJjXFxuICAwMTJcXG5cIiwgY3Vyc29yOiBbMSwgMl1cblxuICAgIGl0IFwic3dpdGNoZXMgdG8gaW5zZXJ0IGFuZCBhZGRzIGEgbmV3bGluZSBhYm92ZSB0aGUgY3VycmVudCBvbmVcIiwgLT5cbiAgICAgIGVuc3VyZSAnbycsXG4gICAgICAgIHRleHQ6IFwiYWJjXFxuICAwMTJcXG4gIFxcblwiXG4gICAgICAgIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgIGN1cnNvcjogWzIsIDJdXG5cbiAgICAjIFRoaXMgd29ya3MgaW4gcHJhY3RpY2UsIGJ1dCB0aGUgZWRpdG9yIGRvZXNuJ3QgcmVzcGVjdCB0aGUgaW5kZW50YXRpb25cbiAgICAjIHJ1bGVzIHdpdGhvdXQgYSBzeW50YXggZ3JhbW1hci4gTmVlZCB0byBzZXQgdGhlIGVkaXRvcidzIGdyYW1tYXJcbiAgICAjIHRvIGZpeCBpdC5cbiAgICB4aXQgXCJpcyByZXBlYXRhYmxlXCIsIC0+XG4gICAgICBzZXQgdGV4dDogXCIgIGFiY1xcbiAgMDEyXFxuICAgIDRzcGFjZXNcXG5cIiwgY3Vyc29yOiBbMSwgMV1cbiAgICAgIGtleXN0cm9rZSAnbydcbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiZGVmXCJcbiAgICAgIGVuc3VyZSAnZXNjYXBlJywgdGV4dDogXCIgIGFiY1xcbiAgMDEyXFxuICBkZWZcXG4gICAgNHNwYWNlc1xcblwiXG4gICAgICBlbnN1cmUgJy4nLCB0ZXh0OiBcIiAgYWJjXFxuICAwMTJcXG4gIGRlZlxcbiAgZGVmXFxuICAgIDRzcGFjZXNcXG5cIlxuICAgICAgc2V0IGN1cnNvcjogWzQsIDFdXG4gICAgICBlbnN1cmUgJy4nLCB0ZXh0OiBcIiAgYWJjXFxuICBkZWZcXG4gIGRlZlxcbiAgMDEyXFxuICAgIDRzcGFjZXNcXG4gICAgZGVmXFxuXCJcblxuICAgIGl0IFwiaXMgdW5kb2FibGVcIiwgLT5cbiAgICAgIGtleXN0cm9rZSAnbydcbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiZGVmXCJcbiAgICAgIGVuc3VyZSAnZXNjYXBlJywgdGV4dDogXCJhYmNcXG4gIDAxMlxcbiAgZGVmXFxuXCJcbiAgICAgIGVuc3VyZSAndScsIHRleHQ6IFwiYWJjXFxuICAwMTJcXG5cIlxuXG4gIGRlc2NyaWJlIFwidGhlIGEga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldCB0ZXh0OiBcIjAxMlxcblwiXG5cbiAgICBkZXNjcmliZSBcImF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGtleXN0cm9rZSAnYSdcblxuICAgICAgaXQgXCJzd2l0Y2hlcyB0byBpbnNlcnQgbW9kZSBhbmQgc2hpZnRzIHRvIHRoZSByaWdodFwiLCAtPlxuICAgICAgICBlbnN1cmUgY3Vyc29yOiBbMCwgMV0sIG1vZGU6ICdpbnNlcnQnXG5cbiAgICBkZXNjcmliZSBcImF0IHRoZSBlbmQgb2YgdGhlIGxpbmVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDNdXG4gICAgICAgIGtleXN0cm9rZSAnYSdcblxuICAgICAgaXQgXCJkb2Vzbid0IGxpbmV3cmFwXCIsIC0+XG4gICAgICAgIGVuc3VyZSBjdXJzb3I6IFswLCAzXVxuXG4gIGRlc2NyaWJlIFwidGhlIEEga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldCB0ZXh0OiBcIjExXFxuMjJcXG5cIlxuXG4gICAgZGVzY3JpYmUgXCJhdCB0aGUgYmVnaW5uaW5nIG9mIGEgbGluZVwiLCAtPlxuICAgICAgaXQgXCJzd2l0Y2hlcyB0byBpbnNlcnQgbW9kZSBhdCB0aGUgZW5kIG9mIHRoZSBsaW5lXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ0EnLFxuICAgICAgICAgIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMl1cblxuICAgICAgaXQgXCJyZXBlYXRzIGFsd2F5cyBhcyBpbnNlcnQgYXQgdGhlIGVuZCBvZiB0aGUgbGluZVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAga2V5c3Ryb2tlICdBJ1xuICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dChcImFiY1wiKVxuICAgICAgICBrZXlzdHJva2UgJ2VzY2FwZSdcbiAgICAgICAgc2V0IGN1cnNvcjogWzEsIDBdXG5cbiAgICAgICAgZW5zdXJlICcuJyxcbiAgICAgICAgICB0ZXh0OiBcIjExYWJjXFxuMjJhYmNcXG5cIlxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgY3Vyc29yOiBbMSwgNF1cblxuICBkZXNjcmliZSBcInRoZSBJIGtleWJpbmRpbmdcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgdGV4dDogXCIxMVxcbiAgMjJcXG5cIlxuXG4gICAgZGVzY3JpYmUgXCJhdCB0aGUgZW5kIG9mIGEgbGluZVwiLCAtPlxuICAgICAgaXQgXCJzd2l0Y2hlcyB0byBpbnNlcnQgbW9kZSBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAyXVxuICAgICAgICBlbnN1cmUgJ0knLFxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgbW9kZTogJ2luc2VydCdcblxuICAgICAgaXQgXCJzd2l0Y2hlcyB0byBpbnNlcnQgbW9kZSBhZnRlciBsZWFkaW5nIHdoaXRlc3BhY2VcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzEsIDRdXG4gICAgICAgIGVuc3VyZSAnSScsXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgICBtb2RlOiAnaW5zZXJ0J1xuXG4gICAgICBpdCBcInJlcGVhdHMgYWx3YXlzIGFzIGluc2VydCBhdCB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBsaW5lXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAyXVxuICAgICAgICBrZXlzdHJva2UgJ0knXG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KFwiYWJjXCIpXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgc2V0IGN1cnNvcjogWzEsIDRdXG4gICAgICAgIGVuc3VyZSAnLicsXG4gICAgICAgICAgdGV4dDogXCJhYmMxMVxcbiAgYWJjMjJcXG5cIlxuICAgICAgICAgIGN1cnNvcjogWzEsIDRdXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcblxuICAgIGRlc2NyaWJlIFwiaW4gdmlzdWFsLWNoYXJhY3Rlcndpc2UgbW9kZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogXCIwMTIgNDU2IDg5MFwiXG5cbiAgICAgIGRlc2NyaWJlIFwic2VsZWN0aW9uIGlzIG5vdCByZXZlcnNlZFwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDRdXG4gICAgICAgICAgZW5zdXJlIFwidiBsIGxcIiwgc2VsZWN0ZWRUZXh0OiBcIjQ1NlwiLCBzZWxlY3Rpb25Jc1JldmVyc2VkOiBmYWxzZVxuXG4gICAgICAgIGl0IFwiaW5zZXJ0IGF0IHN0YXJ0IG9mIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICAgIGVuc3VyZSBcIklcIiwgY3Vyc29yOiBbMCwgNF0sIG1vZGU6IFwiaW5zZXJ0XCJcbiAgICAgICAgaXQgXCJpbnNlcnQgYXQgZW5kIG9mIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICAgIGVuc3VyZSBcIkFcIiwgY3Vyc29yOiBbMCwgN10sIG1vZGU6IFwiaW5zZXJ0XCJcblxuICAgICAgZGVzY3JpYmUgXCJzZWxlY3Rpb24gaXMgcmV2ZXJzZWRcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCA2XVxuICAgICAgICAgIGVuc3VyZSBcInYgaCBoXCIsIHNlbGVjdGVkVGV4dDogXCI0NTZcIiwgc2VsZWN0aW9uSXNSZXZlcnNlZDogdHJ1ZVxuXG4gICAgICAgIGl0IFwiaW5zZXJ0IGF0IHN0YXJ0IG9mIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICAgIGVuc3VyZSBcIklcIiwgY3Vyc29yOiBbMCwgNF0sIG1vZGU6IFwiaW5zZXJ0XCJcbiAgICAgICAgaXQgXCJpbnNlcnQgYXQgZW5kIG9mIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICAgIGVuc3VyZSBcIkFcIiwgY3Vyc29yOiBbMCwgN10sIG1vZGU6IFwiaW5zZXJ0XCJcblxuICAgIGRlc2NyaWJlIFwiaW4gdmlzdWFsLWxpbmV3aXNlIG1vZGVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgMDogMzQ1NiA4OTBcbiAgICAgICAgICAxOiAzNDU2IDg5MFxuICAgICAgICAgIDI6IDM0NTYgODkwXG4gICAgICAgICAgMzogMzQ1NiA4OTBcbiAgICAgICAgICBcIlwiXCJcbiAgICAgIGRlc2NyaWJlIFwic2VsZWN0aW9uIGlzIG5vdCByZXZlcnNlZFwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDNdXG4gICAgICAgICAgZW5zdXJlIFwiViBqXCIsIHNlbGVjdGVkVGV4dDogXCIxOiAzNDU2IDg5MFxcbjI6IDM0NTYgODkwXFxuXCIsIHNlbGVjdGlvbklzUmV2ZXJzZWQ6IGZhbHNlXG5cbiAgICAgICAgaXQgXCJpbnNlcnQgYXQgc3RhcnQgb2Ygc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFwiSVwiLCBjdXJzb3I6IFsxLCAwXSwgbW9kZTogXCJpbnNlcnRcIlxuICAgICAgICBpdCBcImluc2VydCBhdCBlbmQgb2Ygc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFwiQVwiLCBjdXJzb3I6IFszLCAwXSwgbW9kZTogXCJpbnNlcnRcIlxuXG4gICAgICBkZXNjcmliZSBcInNlbGVjdGlvbiBpcyByZXZlcnNlZFwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzIsIDNdXG4gICAgICAgICAgZW5zdXJlIFwiViBrXCIsIHNlbGVjdGVkVGV4dDogXCIxOiAzNDU2IDg5MFxcbjI6IDM0NTYgODkwXFxuXCIsIHNlbGVjdGlvbklzUmV2ZXJzZWQ6IHRydWVcblxuICAgICAgICBpdCBcImluc2VydCBhdCBzdGFydCBvZiBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgICBlbnN1cmUgXCJJXCIsIGN1cnNvcjogWzEsIDBdLCBtb2RlOiBcImluc2VydFwiXG4gICAgICAgIGl0IFwiaW5zZXJ0IGF0IGVuZCBvZiBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgICBlbnN1cmUgXCJBXCIsIGN1cnNvcjogWzMsIDBdLCBtb2RlOiBcImluc2VydFwiXG5cbiAgZGVzY3JpYmUgXCJJbnNlcnRBdFByZXZpb3VzRm9sZFN0YXJ0IGFuZCBOZXh0XCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsYW5ndWFnZS1jb2ZmZWUtc2NyaXB0JylcbiAgICAgIGdldFZpbVN0YXRlICdzYW1wbGUuY29mZmVlJywgKHN0YXRlLCB2aW0pIC0+XG4gICAgICAgIHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9ID0gc3RhdGVcbiAgICAgICAge3NldCwgZW5zdXJlLCBrZXlzdHJva2V9ID0gdmltXG5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgYXRvbS5rZXltYXBzLmFkZCBcInRlc3RcIixcbiAgICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzLm5vcm1hbC1tb2RlJzpcbiAgICAgICAgICAgICdnIFsnOiAndmltLW1vZGUtcGx1czppbnNlcnQtYXQtcHJldmlvdXMtZm9sZC1zdGFydCdcbiAgICAgICAgICAgICdnIF0nOiAndmltLW1vZGUtcGx1czppbnNlcnQtYXQtbmV4dC1mb2xkLXN0YXJ0J1xuXG4gICAgYWZ0ZXJFYWNoIC0+XG4gICAgICBhdG9tLnBhY2thZ2VzLmRlYWN0aXZhdGVQYWNrYWdlKCdsYW5ndWFnZS1jb2ZmZWUtc2NyaXB0JylcblxuICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgbm90IGF0IGZvbGQgc3RhcnQgcm93XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsxNiwgMF1cbiAgICAgIGl0IFwiaW5zZXJ0IGF0IHByZXZpb3VzIGZvbGQgc3RhcnQgcm93XCIsIC0+XG4gICAgICAgIGVuc3VyZSAnZyBbJywgY3Vyc29yOiBbOSwgMl0sIG1vZGU6ICdpbnNlcnQnXG4gICAgICBpdCBcImluc2VydCBhdCBuZXh0IGZvbGQgc3RhcnQgcm93XCIsIC0+XG4gICAgICAgIGVuc3VyZSAnZyBdJywgY3Vyc29yOiBbMTgsIDRdLCBtb2RlOiAnaW5zZXJ0J1xuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGN1cnNvciBpcyBhdCBmb2xkIHN0YXJ0IHJvd1wiLCAtPlxuICAgICAgIyBOb3RoaW5nIHNwZWNpYWwgd2hlbiBjdXJzb3IgaXMgYXQgZm9sZCBzdGFydCByb3csXG4gICAgICAjIG9ubHkgZm9yIHRlc3Qgc2NlbmFyaW8gdGhyb3VnaG5lc3MuXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsyMCwgNl1cbiAgICAgIGl0IFwiaW5zZXJ0IGF0IHByZXZpb3VzIGZvbGQgc3RhcnQgcm93XCIsIC0+XG4gICAgICAgIGVuc3VyZSAnZyBbJywgY3Vyc29yOiBbMTgsIDRdLCBtb2RlOiAnaW5zZXJ0J1xuICAgICAgaXQgXCJpbnNlcnQgYXQgbmV4dCBmb2xkIHN0YXJ0IHJvd1wiLCAtPlxuICAgICAgICBlbnN1cmUgJ2cgXScsIGN1cnNvcjogWzIyLCA2XSwgbW9kZTogJ2luc2VydCdcblxuICBkZXNjcmliZSBcInRoZSBpIGtleWJpbmRpbmdcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgMTIzXG4gICAgICAgICAgNDU2N1xuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3JCdWZmZXI6IFtbMCwgMF0sIFsxLCAwXV1cblxuICAgIGl0IFwiYWxsb3dzIHVuZG9pbmcgYW4gZW50aXJlIGJhdGNoIG9mIHR5cGluZ1wiLCAtPlxuICAgICAga2V5c3Ryb2tlICdpJ1xuICAgICAgZWRpdG9yLmluc2VydFRleHQoXCJhYmNYWFwiKVxuICAgICAgZWRpdG9yLmJhY2tzcGFjZSgpXG4gICAgICBlZGl0b3IuYmFja3NwYWNlKClcbiAgICAgIGVuc3VyZSAnZXNjYXBlJywgdGV4dDogXCJhYmMxMjNcXG5hYmM0NTY3XCJcblxuICAgICAga2V5c3Ryb2tlICdpJ1xuICAgICAgZWRpdG9yLmluc2VydFRleHQgXCJkXCJcbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiZVwiXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcImZcIlxuICAgICAgZW5zdXJlICdlc2NhcGUnLCB0ZXh0OiBcImFiZGVmYzEyM1xcbmFiZGVmYzQ1NjdcIlxuICAgICAgZW5zdXJlICd1JywgdGV4dDogXCJhYmMxMjNcXG5hYmM0NTY3XCJcbiAgICAgIGVuc3VyZSAndScsIHRleHQ6IFwiMTIzXFxuNDU2N1wiXG5cbiAgICBpdCBcImFsbG93cyByZXBlYXRpbmcgdHlwaW5nXCIsIC0+XG4gICAgICBrZXlzdHJva2UgJ2knXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dChcImFiY1hYXCIpXG4gICAgICBlZGl0b3IuYmFja3NwYWNlKClcbiAgICAgIGVkaXRvci5iYWNrc3BhY2UoKVxuICAgICAgZW5zdXJlICdlc2NhcGUnLCB0ZXh0OiBcImFiYzEyM1xcbmFiYzQ1NjdcIlxuICAgICAgZW5zdXJlICcuJywgICAgICB0ZXh0OiBcImFiYWJjYzEyM1xcbmFiYWJjYzQ1NjdcIlxuICAgICAgZW5zdXJlICcuJywgICAgICB0ZXh0OiBcImFiYWJhYmNjYzEyM1xcbmFiYWJhYmNjYzQ1NjdcIlxuXG4gICAgZGVzY3JpYmUgJ3dpdGggbm9ubGluZWFyIGlucHV0JywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6ICcnLCBjdXJzb3JCdWZmZXI6IFswLCAwXVxuXG4gICAgICBpdCAnZGVhbHMgd2l0aCBhdXRvLW1hdGNoZWQgYnJhY2tldHMnLCAtPlxuICAgICAgICBrZXlzdHJva2UgJ2knXG4gICAgICAgICMgdGhpcyBzZXF1ZW5jZSBzaW11bGF0ZXMgd2hhdCB0aGUgYnJhY2tldC1tYXRjaGVyIHBhY2thZ2UgZG9lc1xuICAgICAgICAjIHdoZW4gdGhlIHVzZXIgdHlwZXMgKGEpYjxlbnRlcj5cbiAgICAgICAgZWRpdG9yLmluc2VydFRleHQgJygpJ1xuICAgICAgICBlZGl0b3IubW92ZUxlZnQoKVxuICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dCAnYSdcbiAgICAgICAgZWRpdG9yLm1vdmVSaWdodCgpXG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0ICdiXFxuJ1xuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIGN1cnNvcjogWzEsICAwXVxuICAgICAgICBlbnN1cmUgJy4nLFxuICAgICAgICAgIHRleHQ6ICcoYSliXFxuKGEpYlxcbidcbiAgICAgICAgICBjdXJzb3I6IFsyLCAgMF1cblxuICAgICAgaXQgJ2RlYWxzIHdpdGggYXV0b2NvbXBsZXRlJywgLT5cbiAgICAgICAga2V5c3Ryb2tlICdpJ1xuICAgICAgICAjIHRoaXMgc2VxdWVuY2Ugc2ltdWxhdGVzIGF1dG9jb21wbGV0aW9uIG9mICdhZGQnIHRvICdhZGRGb28nXG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0ICdhJ1xuICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dCAnZCdcbiAgICAgICAgZWRpdG9yLmluc2VydFRleHQgJ2QnXG4gICAgICAgIGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZSBbWzAsIDBdLCBbMCwgM11dLCAnYWRkRm9vJ1xuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsXG4gICAgICAgICAgY3Vyc29yOiBbMCwgIDVdXG4gICAgICAgICAgdGV4dDogJ2FkZEZvbydcbiAgICAgICAgZW5zdXJlICcuJyxcbiAgICAgICAgICB0ZXh0OiAnYWRkRm9hZGRGb29vJ1xuICAgICAgICAgIGN1cnNvcjogWzAsICAxMF1cblxuICBkZXNjcmliZSAndGhlIGEga2V5YmluZGluZycsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6ICcnXG4gICAgICAgIGN1cnNvckJ1ZmZlcjogWzAsIDBdXG5cbiAgICBpdCBcImNhbiBiZSB1bmRvbmUgaW4gb25lIGdvXCIsIC0+XG4gICAgICBrZXlzdHJva2UgJ2EnXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dChcImFiY1wiKVxuICAgICAgZW5zdXJlICdlc2NhcGUnLCB0ZXh0OiBcImFiY1wiXG4gICAgICBlbnN1cmUgJ3UnLCB0ZXh0OiBcIlwiXG5cbiAgICBpdCBcInJlcGVhdHMgY29ycmVjdGx5XCIsIC0+XG4gICAgICBrZXlzdHJva2UgJ2EnXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dChcImFiY1wiKVxuICAgICAgZW5zdXJlICdlc2NhcGUnLFxuICAgICAgICB0ZXh0OiBcImFiY1wiXG4gICAgICAgIGN1cnNvcjogWzAsIDJdXG4gICAgICBlbnN1cmUgJy4nLFxuICAgICAgICB0ZXh0OiBcImFiY2FiY1wiXG4gICAgICAgIGN1cnNvcjogWzAsIDVdXG5cbiAgZGVzY3JpYmUgJ3ByZXNlcnZlIGluc2VydGVkIHRleHQnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlxcblxcblwiXG4gICAgICAgIGN1cnNvckJ1ZmZlcjogWzAsIDBdXG5cbiAgICBkZXNjcmliZSBcInNhdmUgaW5zZXJ0ZWQgdGV4dCB0byAnLicgcmVnaXN0ZXJcIiwgLT5cbiAgICAgIGVuc3VyZURvdFJlZ2lzdGVyID0gKGtleSwge3RleHR9KSAtPlxuICAgICAgICBrZXlzdHJva2Uga2V5XG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KHRleHQpXG4gICAgICAgIGVuc3VyZSBcImVzY2FwZVwiLCByZWdpc3RlcjogJy4nOiB0ZXh0OiB0ZXh0XG4gICAgICBpdCBcIltjYXNlLWldXCIsIC0+IGVuc3VyZURvdFJlZ2lzdGVyICdpJywgdGV4dDogJ2FiYydcbiAgICAgIGl0IFwiW2Nhc2Utb11cIiwgLT4gZW5zdXJlRG90UmVnaXN0ZXIgJ28nLCB0ZXh0OiAnYWJjJ1xuICAgICAgaXQgXCJbY2FzZS1jXVwiLCAtPiBlbnN1cmVEb3RSZWdpc3RlciAnYycsIHRleHQ6ICdhYmMnXG4gICAgICBpdCBcIltjYXNlLUNdXCIsIC0+IGVuc3VyZURvdFJlZ2lzdGVyICdDJywgdGV4dDogJ2FiYydcbiAgICAgIGl0IFwiW2Nhc2Utc11cIiwgLT4gZW5zdXJlRG90UmVnaXN0ZXIgJ3MnLCB0ZXh0OiAnYWJjJ1xuXG4gIGRlc2NyaWJlIFwicmVwZWF0IGJhY2tzcGFjZS9kZWxldGUgaGFwcGVuZWQgaW4gaW5zZXJ0LW1vZGVcIiwgLT5cbiAgICBkZXNjcmliZSBcInNpbmdsZSBjdXJzb3Igb3BlcmF0aW9uXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgMTIzXG4gICAgICAgICAgMTIzXG4gICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGl0IFwiY2FuIHJlcGVhdCBiYWNrc3BhY2Ugb25seSBtdXRhdGlvbjogY2FzZS1pXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAxXVxuICAgICAgICBrZXlzdHJva2UgJ2knXG4gICAgICAgIGVkaXRvci5iYWNrc3BhY2UoKVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIHRleHQ6IFwiMjNcXG4xMjNcIiwgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdqIC4nLCB0ZXh0OiBcIjIzXFxuMTIzXCIgIyBub3RoaW5nIGhhcHBlblxuICAgICAgICBlbnN1cmUgJ2wgLicsIHRleHQ6IFwiMjNcXG4yM1wiXG5cbiAgICAgIGl0IFwiY2FuIHJlcGVhdCBiYWNrc3BhY2Ugb25seSBtdXRhdGlvbjogY2FzZS1hXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAnYSdcbiAgICAgICAgZWRpdG9yLmJhY2tzcGFjZSgpXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgdGV4dDogXCIyM1xcbjEyM1wiLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJy4nLCB0ZXh0OiBcIjNcXG4xMjNcIiwgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdqIC4gLicsIHRleHQ6IFwiM1xcbjNcIlxuXG4gICAgICBpdCBcImNhbiByZXBlYXQgZGVsZXRlIG9ubHkgbXV0YXRpb246IGNhc2UtaVwiLCAtPlxuICAgICAgICBrZXlzdHJva2UgJ2knXG4gICAgICAgIGVkaXRvci5kZWxldGUoKVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIHRleHQ6IFwiMjNcXG4xMjNcIlxuICAgICAgICBlbnN1cmUgJ2ogLicsIHRleHQ6IFwiMjNcXG4yM1wiXG5cbiAgICAgIGl0IFwiY2FuIHJlcGVhdCBkZWxldGUgb25seSBtdXRhdGlvbjogY2FzZS1hXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAnYSdcbiAgICAgICAgZWRpdG9yLmRlbGV0ZSgpXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgdGV4dDogXCIxM1xcbjEyM1wiXG4gICAgICAgIGVuc3VyZSAnaiAuJywgdGV4dDogXCIxM1xcbjEzXCJcblxuICAgICAgaXQgXCJjYW4gcmVwZWF0IGJhY2tzcGFjZSBhbmQgaW5zZXJ0IG11dGF0aW9uOiBjYXNlLWlcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGtleXN0cm9rZSAnaSdcbiAgICAgICAgZWRpdG9yLmJhY2tzcGFjZSgpXG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KFwiISEhXCIpXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgdGV4dDogXCIhISEyM1xcbjEyM1wiXG4gICAgICAgIHNldCBjdXJzb3I6IFsxLCAxXVxuICAgICAgICBlbnN1cmUgJy4nLCB0ZXh0OiBcIiEhITIzXFxuISEhMjNcIlxuXG4gICAgICBpdCBcImNhbiByZXBlYXQgYmFja3NwYWNlIGFuZCBpbnNlcnQgbXV0YXRpb246IGNhc2UtYVwiLCAtPlxuICAgICAgICBrZXlzdHJva2UgJ2EnXG4gICAgICAgIGVkaXRvci5iYWNrc3BhY2UoKVxuICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dChcIiEhIVwiKVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIHRleHQ6IFwiISEhMjNcXG4xMjNcIlxuICAgICAgICBlbnN1cmUgJ2ogMCAuJywgdGV4dDogXCIhISEyM1xcbiEhITIzXCJcblxuICAgICAgaXQgXCJjYW4gcmVwZWF0IGRlbGV0ZSBhbmQgaW5zZXJ0IG11dGF0aW9uOiBjYXNlLWlcIiwgLT5cbiAgICAgICAga2V5c3Ryb2tlICdpJ1xuICAgICAgICBlZGl0b3IuZGVsZXRlKClcbiAgICAgICAgZWRpdG9yLmluc2VydFRleHQoXCIhISFcIilcbiAgICAgICAgZW5zdXJlICdlc2NhcGUnLCB0ZXh0OiBcIiEhITIzXFxuMTIzXCJcbiAgICAgICAgZW5zdXJlICdqIDAgLicsIHRleHQ6IFwiISEhMjNcXG4hISEyM1wiXG5cbiAgICAgIGl0IFwiY2FuIHJlcGVhdCBkZWxldGUgYW5kIGluc2VydCBtdXRhdGlvbjogY2FzZS1hXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAnYSdcbiAgICAgICAgZWRpdG9yLmRlbGV0ZSgpXG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KFwiISEhXCIpXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgdGV4dDogXCIxISEhM1xcbjEyM1wiXG4gICAgICAgIGVuc3VyZSAnaiAwIC4nLCB0ZXh0OiBcIjEhISEzXFxuMSEhITNcIlxuXG4gICAgZGVzY3JpYmUgXCJtdWx0aS1jdXJzb3JzIG9wZXJhdGlvblwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAxMjNcblxuICAgICAgICAgIDEyMzRcblxuICAgICAgICAgIDEyMzQ1XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbWzAsIDBdLCBbMiwgMF0sIFs0LCAwXV1cblxuICAgICAgaXQgXCJjYW4gcmVwZWF0IGJhY2tzcGFjZSBvbmx5IG11dGF0aW9uOiBjYXNlLW11bHRpLWN1cnNvcnNcIiwgLT5cbiAgICAgICAgZW5zdXJlICdBJywgY3Vyc29yOiBbWzAsIDNdLCBbMiwgNF0sIFs0LCA1XV0sIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgIGVkaXRvci5iYWNrc3BhY2UoKVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIHRleHQ6IFwiMTJcXG5cXG4xMjNcXG5cXG4xMjM0XCIsIGN1cnNvcjogW1swLCAxXSwgWzIsIDJdLCBbNCwgM11dXG4gICAgICAgIGVuc3VyZSAnLicsIHRleHQ6IFwiMVxcblxcbjEyXFxuXFxuMTIzXCIsIGN1cnNvcjogW1swLCAwXSwgWzIsIDFdLCBbNCwgMl1dXG5cbiAgICAgIGl0IFwiY2FuIHJlcGVhdCBkZWxldGUgb25seSBtdXRhdGlvbjogY2FzZS1tdWx0aS1jdXJzb3JzXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnSScsIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgIGVkaXRvci5kZWxldGUoKVxuICAgICAgICBjdXJzb3JzID0gW1swLCAwXSwgWzIsIDBdLCBbNCwgMF1dXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgdGV4dDogXCIyM1xcblxcbjIzNFxcblxcbjIzNDVcIiwgY3Vyc29yOiBjdXJzb3JzXG4gICAgICAgIGVuc3VyZSAnLicsIHRleHQ6IFwiM1xcblxcbjM0XFxuXFxuMzQ1XCIsIGN1cnNvcjogY3Vyc29yc1xuICAgICAgICBlbnN1cmUgJy4nLCB0ZXh0OiBcIlxcblxcbjRcXG5cXG40NVwiLCBjdXJzb3I6IGN1cnNvcnNcbiAgICAgICAgZW5zdXJlICcuJywgdGV4dDogXCJcXG5cXG5cXG5cXG41XCIsIGN1cnNvcjogY3Vyc29yc1xuICAgICAgICBlbnN1cmUgJy4nLCB0ZXh0OiBcIlxcblxcblxcblxcblwiLCBjdXJzb3I6IGN1cnNvcnNcblxuICBkZXNjcmliZSAnc3BlY2lmeSBpbnNlcnRpb24gY291bnQnLCAtPlxuICAgIGVuc3VyZUluc2VydGlvbkNvdW50ID0gKGtleSwge2luc2VydCwgdGV4dCwgY3Vyc29yfSkgLT5cbiAgICAgIGtleXN0cm9rZSBrZXlcbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0KGluc2VydClcbiAgICAgIGVuc3VyZSBcImVzY2FwZVwiLCB0ZXh0OiB0ZXh0LCBjdXJzb3I6IGN1cnNvclxuXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgaW5pdGlhbFRleHQgPSBcIipcXG4qXFxuXCJcbiAgICAgIHNldCB0ZXh0OiBcIlwiLCBjdXJzb3I6IFswLCAwXVxuICAgICAga2V5c3Ryb2tlICdpJ1xuICAgICAgZWRpdG9yLmluc2VydFRleHQoaW5pdGlhbFRleHQpXG4gICAgICBlbnN1cmUgXCJlc2NhcGUgZyBnXCIsIHRleHQ6IGluaXRpYWxUZXh0LCBjdXJzb3I6IFswLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJyZXBlYXQgaW5zZXJ0aW9uIGNvdW50IHRpbWVzXCIsIC0+XG4gICAgICBpdCBcIltjYXNlLWldXCIsIC0+IGVuc3VyZUluc2VydGlvbkNvdW50ICczIGknLCBpbnNlcnQ6ICc9JywgdGV4dDogXCI9PT0qXFxuKlxcblwiLCBjdXJzb3I6IFswLCAyXVxuICAgICAgaXQgXCJbY2FzZS1vXVwiLCAtPiBlbnN1cmVJbnNlcnRpb25Db3VudCAnMyBvJywgaW5zZXJ0OiAnPScsIHRleHQ6IFwiKlxcbj1cXG49XFxuPVxcbipcXG5cIiwgY3Vyc29yOiBbMywgMF1cbiAgICAgIGl0IFwiW2Nhc2UtT11cIiwgLT4gZW5zdXJlSW5zZXJ0aW9uQ291bnQgJzMgTycsIGluc2VydDogJz0nLCB0ZXh0OiBcIj1cXG49XFxuPVxcbipcXG4qXFxuXCIsIGN1cnNvcjogWzIsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwiY2hpbGRyZW4gb2YgQ2hhbmdlIG9wZXJhdGlvbiB3b24ndCByZXBlYXRlIGluc2VydGlvbiBjb3VudCB0aW1lc1wiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHRleHQ6IFwiXCIsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAga2V5c3Ryb2tlICdpJ1xuICAgICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KCcqJylcbiAgICAgICAgICBlbnN1cmUgJ2VzY2FwZSBnIGcnLCB0ZXh0OiAnKicsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgICAgaXQgXCJbY2FzZS1jXVwiLCAtPiBlbnN1cmVJbnNlcnRpb25Db3VudCAnMyBjIHcnLCBpbnNlcnQ6ICc9JywgdGV4dDogXCI9XCIsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGl0IFwiW2Nhc2UtQ11cIiwgLT4gZW5zdXJlSW5zZXJ0aW9uQ291bnQgJzMgQycsIGluc2VydDogJz0nLCB0ZXh0OiBcIj1cIiwgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgaXQgXCJbY2FzZS1zXVwiLCAtPiBlbnN1cmVJbnNlcnRpb25Db3VudCAnMyBzJywgaW5zZXJ0OiAnPScsIHRleHQ6IFwiPVwiLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBpdCBcIltjYXNlLVNdXCIsIC0+IGVuc3VyZUluc2VydGlvbkNvdW50ICczIFMnLCBpbnNlcnQ6ICc9JywgdGV4dDogXCI9XCIsIGN1cnNvcjogWzAsIDBdXG4iXX0=
