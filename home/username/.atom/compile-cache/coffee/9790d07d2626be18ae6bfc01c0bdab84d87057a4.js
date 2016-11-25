(function() {
  var TextData, _, getVimState, ref, settings, withMockPlatform;

  _ = require('underscore-plus');

  ref = require('./spec-helper'), getVimState = ref.getVimState, TextData = ref.TextData, withMockPlatform = ref.withMockPlatform;

  settings = require('../lib/settings');

  describe("VimState", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      return getVimState(function(state, vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
      });
    });
    beforeEach(function() {
      return vimState.resetNormalMode();
    });
    describe("initialization", function() {
      it("puts the editor in normal-mode initially by default", function() {
        return ensure({
          mode: 'normal'
        });
      });
      return it("puts the editor in insert-mode if startInInsertMode is true", function() {
        settings.set('startInInsertMode', true);
        return getVimState(function(state, vim) {
          return vim.ensure({
            mode: 'insert'
          });
        });
      });
    });
    describe("::destroy", function() {
      it("re-enables text input on the editor", function() {
        expect(editorElement.component.isInputEnabled()).toBeFalsy();
        vimState.destroy();
        return expect(editorElement.component.isInputEnabled()).toBeTruthy();
      });
      it("removes the mode classes from the editor", function() {
        ensure({
          mode: 'normal'
        });
        vimState.destroy();
        return expect(editorElement.classList.contains("normal-mode")).toBeFalsy();
      });
      return it("is a noop when the editor is already destroyed", function() {
        editorElement.getModel().destroy();
        return vimState.destroy();
      });
    });
    describe("normal-mode", function() {
      describe("when entering an insertable character", function() {
        beforeEach(function() {
          return keystroke('\\');
        });
        return it("stops propagation", function() {
          return ensure({
            text: ''
          });
        });
      });
      describe("when entering an operator", function() {
        beforeEach(function() {
          return keystroke('d');
        });
        describe("with an operator that can't be composed", function() {
          beforeEach(function() {
            return keystroke('x');
          });
          return it("clears the operator stack", function() {
            return expect(vimState.operationStack.isEmpty()).toBe(true);
          });
        });
        describe("the escape keybinding", function() {
          beforeEach(function() {
            return keystroke('escape');
          });
          return it("clears the operator stack", function() {
            return expect(vimState.operationStack.isEmpty()).toBe(true);
          });
        });
        return describe("the ctrl-c keybinding", function() {
          beforeEach(function() {
            return keystroke('ctrl-c');
          });
          return it("clears the operator stack", function() {
            return expect(vimState.operationStack.isEmpty()).toBe(true);
          });
        });
      });
      describe("the escape keybinding", function() {
        return it("clears any extra cursors", function() {
          set({
            text: "one-two-three",
            addCursor: [0, 3]
          });
          ensure({
            numCursors: 2
          });
          return ensure('escape', {
            numCursors: 1
          });
        });
      });
      describe("the v keybinding", function() {
        beforeEach(function() {
          set({
            text: "abc",
            cursor: [0, 0]
          });
          return keystroke('v');
        });
        return it("puts the editor into visual characterwise mode", function() {
          return ensure({
            mode: ['visual', 'characterwise']
          });
        });
      });
      describe("the V keybinding", function() {
        beforeEach(function() {
          return set({
            text: "012345\nabcdef",
            cursor: [0, 0]
          });
        });
        it("puts the editor into visual linewise mode", function() {
          return ensure('V', {
            mode: ['visual', 'linewise']
          });
        });
        return it("selects the current line", function() {
          return ensure('V', {
            selectedText: '012345\n'
          });
        });
      });
      describe("the ctrl-v keybinding", function() {
        return it("puts the editor into visual blockwise mode", function() {
          set({
            text: "012345\n\nabcdef",
            cursor: [0, 0]
          });
          return ensure('ctrl-v', {
            mode: ['visual', 'blockwise']
          });
        });
      });
      describe("selecting text", function() {
        beforeEach(function() {
          spyOn(_._, "now").andCallFake(function() {
            return window.now;
          });
          return set({
            text: "abc def",
            cursor: [0, 0]
          });
        });
        it("puts the editor into visual mode", function() {
          ensure({
            mode: 'normal'
          });
          advanceClock(200);
          atom.commands.dispatch(editorElement, "core:select-right");
          return ensure({
            mode: ['visual', 'characterwise'],
            selectedBufferRange: [[0, 0], [0, 1]]
          });
        });
        it("handles the editor being destroyed shortly after selecting text", function() {
          set({
            selectedBufferRange: [[0, 0], [0, 3]]
          });
          editor.destroy();
          vimState.destroy();
          return advanceClock(100);
        });
        return it('handles native selection such as core:select-all', function() {
          atom.commands.dispatch(editorElement, 'core:select-all');
          return ensure({
            selectedBufferRange: [[0, 0], [0, 7]]
          });
        });
      });
      describe("the i keybinding", function() {
        return it("puts the editor into insert mode", function() {
          return ensure('i', {
            mode: 'insert'
          });
        });
      });
      describe("the R keybinding", function() {
        return it("puts the editor into replace mode", function() {
          return ensure('R', {
            mode: ['insert', 'replace']
          });
        });
      });
      describe("with content", function() {
        beforeEach(function() {
          return set({
            text: "012345\n\nabcdef",
            cursor: [0, 0]
          });
        });
        describe("on a line with content", function() {
          return it("[Changed] won't adjust cursor position if outer command place the cursor on end of line('\\n') character", function() {
            ensure({
              mode: 'normal'
            });
            atom.commands.dispatch(editorElement, "editor:move-to-end-of-line");
            return ensure({
              cursor: [0, 6]
            });
          });
        });
        return describe("on an empty line", function() {
          return it("allows the cursor to be placed on the \n character", function() {
            set({
              cursor: [1, 0]
            });
            return ensure({
              cursor: [1, 0]
            });
          });
        });
      });
      return describe('with character-input operations', function() {
        beforeEach(function() {
          return set({
            text: '012345\nabcdef'
          });
        });
        return it('properly clears the operations', function() {
          var target;
          ensure('d r', {
            mode: 'normal'
          });
          expect(vimState.operationStack.isEmpty()).toBe(true);
          target = vimState.input.editorElement;
          keystroke('d');
          atom.commands.dispatch(target, 'core:cancel');
          return ensure({
            text: '012345\nabcdef'
          });
        });
      });
    });
    describe("activate-normal-mode-once command", function() {
      beforeEach(function() {
        set({
          text: "0 23456\n1 23456",
          cursor: [0, 2]
        });
        return ensure('i', {
          mode: 'insert',
          cursor: [0, 2]
        });
      });
      return it("activate normal mode without moving cursors left, then back to insert-mode once some command executed", function() {
        ensure('ctrl-o', {
          cursor: [0, 2],
          mode: 'normal'
        });
        return ensure('l', {
          cursor: [0, 3],
          mode: 'insert'
        });
      });
    });
    describe("insert-mode", function() {
      beforeEach(function() {
        return keystroke('i');
      });
      describe("with content", function() {
        beforeEach(function() {
          return set({
            text: "012345\n\nabcdef"
          });
        });
        describe("when cursor is in the middle of the line", function() {
          return it("moves the cursor to the left when exiting insert mode", function() {
            set({
              cursor: [0, 3]
            });
            return ensure('escape', {
              cursor: [0, 2]
            });
          });
        });
        describe("when cursor is at the beginning of line", function() {
          return it("leaves the cursor at the beginning of line", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('escape', {
              cursor: [1, 0]
            });
          });
        });
        return describe("on a line with content", function() {
          return it("allows the cursor to be placed on the \n character", function() {
            set({
              cursor: [0, 6]
            });
            return ensure({
              cursor: [0, 6]
            });
          });
        });
      });
      it("puts the editor into normal mode when <escape> is pressed", function() {
        return escape('escape', {
          mode: 'normal'
        });
      });
      it("puts the editor into normal mode when <ctrl-c> is pressed", function() {
        return withMockPlatform(editorElement, 'platform-darwin', function() {
          return ensure('ctrl-c', {
            mode: 'normal'
          });
        });
      });
      return describe("clearMultipleCursorsOnEscapeInsertMode setting", function() {
        beforeEach(function() {
          return set({
            text: 'abc',
            cursor: [[0, 0], [0, 1]]
          });
        });
        describe("when enabled", function() {
          beforeEach(function() {
            return settings.set('clearMultipleCursorsOnEscapeInsertMode', true);
          });
          return it("clear multiple cursor on escape", function() {
            return ensure('escape', {
              mode: 'normal',
              numCursors: 1
            });
          });
        });
        return describe("when disabled", function() {
          beforeEach(function() {
            return settings.set('clearMultipleCursorsOnEscapeInsertMode', false);
          });
          return it("clear multiple cursor on escape", function() {
            return ensure('escape', {
              mode: 'normal',
              numCursors: 2
            });
          });
        });
      });
    });
    describe("replace-mode", function() {
      describe("with content", function() {
        beforeEach(function() {
          return set({
            text: "012345\n\nabcdef"
          });
        });
        describe("when cursor is in the middle of the line", function() {
          return it("moves the cursor to the left when exiting replace mode", function() {
            set({
              cursor: [0, 3]
            });
            return ensure('R escape', {
              cursor: [0, 2]
            });
          });
        });
        describe("when cursor is at the beginning of line", function() {
          beforeEach(function() {});
          return it("leaves the cursor at the beginning of line", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('R escape', {
              cursor: [1, 0]
            });
          });
        });
        return describe("on a line with content", function() {
          return it("allows the cursor to be placed on the \n character", function() {
            keystroke('R');
            set({
              cursor: [0, 6]
            });
            return ensure({
              cursor: [0, 6]
            });
          });
        });
      });
      it("puts the editor into normal mode when <escape> is pressed", function() {
        return ensure('R escape', {
          mode: 'normal'
        });
      });
      return it("puts the editor into normal mode when <ctrl-c> is pressed", function() {
        return withMockPlatform(editorElement, 'platform-darwin', function() {
          return ensure('R ctrl-c', {
            mode: 'normal'
          });
        });
      });
    });
    describe("visual-mode", function() {
      beforeEach(function() {
        set({
          text: "one two three",
          cursorBuffer: [0, 4]
        });
        return keystroke('v');
      });
      it("selects the character under the cursor", function() {
        return ensure({
          selectedBufferRange: [[0, 4], [0, 5]],
          selectedText: 't'
        });
      });
      it("puts the editor into normal mode when <escape> is pressed", function() {
        return ensure('escape', {
          cursorBuffer: [0, 4],
          mode: 'normal'
        });
      });
      it("puts the editor into normal mode when <escape> is pressed on selection is reversed", function() {
        ensure({
          selectedText: 't'
        });
        ensure('h h', {
          selectedText: 'e t',
          selectionIsReversed: true
        });
        return ensure('escape', {
          mode: 'normal',
          cursorBuffer: [0, 2]
        });
      });
      describe("motions", function() {
        it("transforms the selection", function() {
          return ensure('w', {
            selectedText: 'two t'
          });
        });
        return it("always leaves the initially selected character selected", function() {
          ensure('h', {
            selectedText: ' t'
          });
          ensure('l', {
            selectedText: 't'
          });
          return ensure('l', {
            selectedText: 'tw'
          });
        });
      });
      describe("operators", function() {
        return it("operate on the current selection", function() {
          set({
            text: "012345\n\nabcdef",
            cursor: [0, 0]
          });
          return ensure('V d', {
            text: "\nabcdef"
          });
        });
      });
      describe("returning to normal-mode", function() {
        return it("operate on the current selection", function() {
          set({
            text: "012345\n\nabcdef"
          });
          return ensure('V escape', {
            selectedText: ''
          });
        });
      });
      describe("the o keybinding", function() {
        it("reversed each selection", function() {
          set({
            addCursor: [0, 12]
          });
          ensure('i w', {
            selectedText: ["two", "three"],
            selectionIsReversed: false
          });
          return ensure('o', {
            selectionIsReversed: true
          });
        });
        return xit("harmonizes selection directions", function() {
          set({
            cursorBuffer: [0, 0]
          });
          keystroke('e e');
          set({
            addCursor: [0, 2e308]
          });
          ensure('h h', {
            selectedBufferRange: [[[0, 0], [0, 5]], [[0, 11], [0, 13]]],
            cursorBuffer: [[0, 5], [0, 11]]
          });
          return ensure('o', {
            selectedBufferRange: [[[0, 0], [0, 5]], [[0, 11], [0, 13]]],
            cursorBuffer: [[0, 5], [0, 13]]
          });
        });
      });
      describe("activate visualmode within visualmode", function() {
        var cursorPosition;
        cursorPosition = null;
        beforeEach(function() {
          cursorPosition = [0, 4];
          set({
            text: "line one\nline two\nline three\n",
            cursor: cursorPosition
          });
          return ensure('escape', {
            mode: 'normal'
          });
        });
        describe("activateVisualMode with same type puts the editor into normal mode", function() {
          describe("characterwise: vv", function() {
            return it("activating twice make editor return to normal mode ", function() {
              ensure('v', {
                mode: ['visual', 'characterwise']
              });
              return ensure('v', {
                mode: 'normal',
                cursor: cursorPosition
              });
            });
          });
          describe("linewise: VV", function() {
            return it("activating twice make editor return to normal mode ", function() {
              ensure('V', {
                mode: ['visual', 'linewise']
              });
              return ensure('V', {
                mode: 'normal',
                cursor: cursorPosition
              });
            });
          });
          return describe("blockwise: ctrl-v twice", function() {
            return it("activating twice make editor return to normal mode ", function() {
              ensure('ctrl-v', {
                mode: ['visual', 'blockwise']
              });
              return ensure('ctrl-v', {
                mode: 'normal',
                cursor: cursorPosition
              });
            });
          });
        });
        describe("change submode within visualmode", function() {
          beforeEach(function() {
            return set({
              text: "line one\nline two\nline three\n",
              cursorBuffer: [[0, 5], [2, 5]]
            });
          });
          it("can change submode within visual mode", function() {
            ensure('v', {
              mode: ['visual', 'characterwise']
            });
            ensure('V', {
              mode: ['visual', 'linewise']
            });
            ensure('ctrl-v', {
              mode: ['visual', 'blockwise']
            });
            return ensure('v', {
              mode: ['visual', 'characterwise']
            });
          });
          return it("recover original range when shift from linewise to characterwise", function() {
            ensure('v i w', {
              selectedText: ['one', 'three']
            });
            ensure('V', {
              selectedText: ["line one\n", "line three\n"]
            });
            return ensure('v', {
              selectedText: ["one", "three"]
            });
          });
        });
        return describe("keep goalColum when submode change in visual-mode", function() {
          var text;
          text = null;
          beforeEach(function() {
            text = new TextData("0_34567890ABCDEF\n1_34567890\n2_34567\n3_34567890A\n4_34567890ABCDEF\n");
            return set({
              text: text.getRaw(),
              cursor: [0, 0]
            });
          });
          return it("keep goalColumn when shift linewise to characterwise", function() {
            ensure('V', {
              selectedText: text.getLines([0]),
              characterwiseHead: [0, 0],
              mode: ['visual', 'linewise']
            });
            ensure('$', {
              selectedText: text.getLines([0]),
              characterwiseHead: [0, 15],
              mode: ['visual', 'linewise']
            });
            ensure('j', {
              selectedText: text.getLines([0, 1]),
              characterwiseHead: [1, 9],
              mode: ['visual', 'linewise']
            });
            ensure('j', {
              selectedText: text.getLines([0, 1, 2]),
              characterwiseHead: [2, 6],
              mode: ['visual', 'linewise']
            });
            ensure('v', {
              selectedText: text.getLines([0, 1, 2], {
                chomp: true
              }),
              characterwiseHead: [2, 6],
              mode: ['visual', 'characterwise']
            });
            ensure('j', {
              selectedText: text.getLines([0, 1, 2, 3], {
                chomp: true
              }),
              cursor: [3, 11],
              mode: ['visual', 'characterwise']
            });
            ensure('v', {
              cursor: [3, 10],
              mode: 'normal'
            });
            return ensure('j', {
              cursor: [4, 15],
              mode: 'normal'
            });
          });
        });
      });
      describe("deactivating visual mode", function() {
        beforeEach(function() {
          ensure('escape', {
            mode: 'normal'
          });
          return set({
            text: "line one\nline two\nline three\n",
            cursor: [0, 7]
          });
        });
        it("can put cursor at in visual char mode", function() {
          return ensure('v', {
            mode: ['visual', 'characterwise'],
            cursor: [0, 8]
          });
        });
        it("adjust cursor position 1 column left when deactivated", function() {
          return ensure('v escape', {
            mode: 'normal',
            cursor: [0, 7]
          });
        });
        return it("[CHANGED from vim-mode] can not select new line in characterwise visual mode", function() {
          ensure('v l l', {
            cursor: [0, 8]
          });
          return ensure('escape', {
            mode: 'normal',
            cursor: [0, 7]
          });
        });
      });
      return describe("deactivating visual mode on blank line", function() {
        beforeEach(function() {
          ensure('escape', {
            mode: 'normal'
          });
          return set({
            text: "0: abc\n\n2: abc",
            cursor: [1, 0]
          });
        });
        it("v case-1", function() {
          ensure('v', {
            mode: ['visual', 'characterwise'],
            cursor: [2, 0]
          });
          return ensure('escape', {
            mode: 'normal',
            cursor: [1, 0]
          });
        });
        it("v case-2 selection head is blank line", function() {
          set({
            cursor: [0, 1]
          });
          ensure('v j', {
            mode: ['visual', 'characterwise'],
            cursor: [2, 0],
            selectedText: ": abc\n\n"
          });
          return ensure('escape', {
            mode: 'normal',
            cursor: [1, 0]
          });
        });
        it("V case-1", function() {
          ensure('V', {
            mode: ['visual', 'linewise'],
            cursor: [2, 0]
          });
          return ensure('escape', {
            mode: 'normal',
            cursor: [1, 0]
          });
        });
        it("V case-2 selection head is blank line", function() {
          set({
            cursor: [0, 1]
          });
          ensure('V j', {
            mode: ['visual', 'linewise'],
            cursor: [2, 0],
            selectedText: "0: abc\n\n"
          });
          return ensure('escape', {
            mode: 'normal',
            cursor: [1, 0]
          });
        });
        it("ctrl-v", function() {
          ensure('ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedBufferRange: [[1, 0], [1, 0]]
          });
          return ensure('escape', {
            mode: 'normal',
            cursor: [1, 0]
          });
        });
        return it("ctrl-v and move over empty line", function() {
          ensure('ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedBufferRangeOrdered: [[1, 0], [1, 0]]
          });
          ensure('k', {
            mode: ['visual', 'blockwise'],
            selectedBufferRangeOrdered: [[[0, 0], [0, 1]], [[1, 0], [1, 0]]]
          });
          ensure('j', {
            mode: ['visual', 'blockwise'],
            selectedBufferRangeOrdered: [[1, 0], [1, 0]]
          });
          return ensure('j', {
            mode: ['visual', 'blockwise'],
            selectedBufferRangeOrdered: [[[1, 0], [1, 0]], [[2, 0], [2, 1]]]
          });
        });
      });
    });
    describe("marks", function() {
      beforeEach(function() {
        return set({
          text: "text in line 1\ntext in line 2\ntext in line 3"
        });
      });
      it("basic marking functionality", function() {
        set({
          cursor: [1, 1]
        });
        keystroke('m t');
        set({
          cursor: [2, 2]
        });
        return ensure('` t', {
          cursor: [1, 1]
        });
      });
      it("real (tracking) marking functionality", function() {
        set({
          cursor: [2, 2]
        });
        keystroke('m q');
        set({
          cursor: [1, 2]
        });
        return ensure('o escape ` q', {
          cursor: [3, 2]
        });
      });
      return it("real (tracking) marking functionality", function() {
        set({
          cursor: [2, 2]
        });
        keystroke('m q');
        set({
          cursor: [1, 2]
        });
        return ensure('d d escape ` q', {
          cursor: [1, 2]
        });
      });
    });
    return describe("is-narrowed attribute", function() {
      var ensureNormalModeState;
      ensureNormalModeState = function() {
        return ensure("escape", {
          mode: 'normal',
          selectedText: '',
          selectionIsNarrowed: false
        });
      };
      beforeEach(function() {
        return set({
          text: "1:-----\n2:-----\n3:-----\n4:-----",
          cursor: [0, 0]
        });
      });
      describe("normal-mode", function() {
        return it("is not narrowed", function() {
          return ensure({
            mode: ['normal'],
            selectionIsNarrowed: false
          });
        });
      });
      describe("visual-mode.characterwise", function() {
        it("[single row] is narrowed", function() {
          ensure('v $', {
            selectedText: '1:-----',
            mode: ['visual', 'characterwise'],
            selectionIsNarrowed: false
          });
          return ensureNormalModeState();
        });
        return it("[multi-row] is narrowed", function() {
          ensure('v j', {
            selectedText: "1:-----\n2",
            mode: ['visual', 'characterwise'],
            selectionIsNarrowed: true
          });
          return ensureNormalModeState();
        });
      });
      describe("visual-mode.linewise", function() {
        it("[single row] is narrowed", function() {
          ensure('V', {
            selectedText: "1:-----\n",
            mode: ['visual', 'linewise'],
            selectionIsNarrowed: false
          });
          return ensureNormalModeState();
        });
        return it("[multi-row] is narrowed", function() {
          ensure('V j', {
            selectedText: "1:-----\n2:-----\n",
            mode: ['visual', 'linewise'],
            selectionIsNarrowed: true
          });
          return ensureNormalModeState();
        });
      });
      return describe("visual-mode.blockwise", function() {
        it("[single row] is narrowed", function() {
          ensure('ctrl-v l', {
            selectedText: "1:",
            mode: ['visual', 'blockwise'],
            selectionIsNarrowed: false
          });
          return ensureNormalModeState();
        });
        return it("[multi-row] is narrowed", function() {
          ensure('ctrl-v l j', {
            selectedText: ["1:", "2:"],
            mode: ['visual', 'blockwise'],
            selectionIsNarrowed: true
          });
          return ensureNormalModeState();
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL3ZpbS1zdGF0ZS1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUE0QyxPQUFBLENBQVEsZUFBUixDQUE1QyxFQUFDLDZCQUFELEVBQWMsdUJBQWQsRUFBd0I7O0VBQ3hCLFFBQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0VBRVgsUUFBQSxDQUFTLFVBQVQsRUFBcUIsU0FBQTtBQUNuQixRQUFBO0lBQUEsT0FBNEQsRUFBNUQsRUFBQyxhQUFELEVBQU0sZ0JBQU4sRUFBYyxtQkFBZCxFQUF5QixnQkFBekIsRUFBaUMsdUJBQWpDLEVBQWdEO0lBRWhELFVBQUEsQ0FBVyxTQUFBO2FBQ1QsV0FBQSxDQUFZLFNBQUMsS0FBRCxFQUFRLEdBQVI7UUFDVixRQUFBLEdBQVc7UUFDVix3QkFBRCxFQUFTO2VBQ1IsYUFBRCxFQUFNLG1CQUFOLEVBQWMseUJBQWQsRUFBMkI7TUFIakIsQ0FBWjtJQURTLENBQVg7SUFNQSxVQUFBLENBQVcsU0FBQTthQUNULFFBQVEsQ0FBQyxlQUFULENBQUE7SUFEUyxDQUFYO0lBR0EsUUFBQSxDQUFTLGdCQUFULEVBQTJCLFNBQUE7TUFDekIsRUFBQSxDQUFHLHFEQUFILEVBQTBELFNBQUE7ZUFDeEQsTUFBQSxDQUFPO1VBQUEsSUFBQSxFQUFNLFFBQU47U0FBUDtNQUR3RCxDQUExRDthQUdBLEVBQUEsQ0FBRyw2REFBSCxFQUFrRSxTQUFBO1FBQ2hFLFFBQVEsQ0FBQyxHQUFULENBQWEsbUJBQWIsRUFBa0MsSUFBbEM7ZUFDQSxXQUFBLENBQVksU0FBQyxLQUFELEVBQVEsR0FBUjtpQkFDVixHQUFHLENBQUMsTUFBSixDQUFXO1lBQUEsSUFBQSxFQUFNLFFBQU47V0FBWDtRQURVLENBQVo7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Q0EsSUFBQSxFQUFNLENBQUMsUUFBRCxFQUFXLFdBQVgsQ0FETjtZQUVBLG1CQUFBLEVBQXFCLEtBRnJCO1dBREY7aUJBSUEscUJBQUEsQ0FBQTtRQUw2QixDQUEvQjtlQU1BLEVBQUEsQ0FBRyx5QkFBSCxFQUE4QixTQUFBO1VBQzVCLE1BQUEsQ0FBTyxZQUFQLEVBQ0U7WUFBQSxZQUFBLEVBQWMsQ0FBQyxJQUFELEVBQU8sSUFBUCxDQUFkO1lBQ0EsSUFBQSxFQUFNLENBQUMsUUFBRCxFQUFXLFdBQVgsQ0FETjtZQUVBLG1CQUFBLEVBQXFCLElBRnJCO1dBREY7aUJBSUEscUJBQUEsQ0FBQTtRQUw0QixDQUE5QjtNQVBnQyxDQUFsQztJQXJEZ0MsQ0FBbEM7RUFqZW1CLENBQXJCO0FBSkEiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue2dldFZpbVN0YXRlLCBUZXh0RGF0YSwgd2l0aE1vY2tQbGF0Zm9ybX0gPSByZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuLi9saWIvc2V0dGluZ3MnXG5cbmRlc2NyaWJlIFwiVmltU3RhdGVcIiwgLT5cbiAgW3NldCwgZW5zdXJlLCBrZXlzdHJva2UsIGVkaXRvciwgZWRpdG9yRWxlbWVudCwgdmltU3RhdGVdID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgZ2V0VmltU3RhdGUgKHN0YXRlLCB2aW0pIC0+XG4gICAgICB2aW1TdGF0ZSA9IHN0YXRlXG4gICAgICB7ZWRpdG9yLCBlZGl0b3JFbGVtZW50fSA9IHZpbVN0YXRlXG4gICAgICB7c2V0LCBlbnN1cmUsIGtleXN0cm9rZX0gPSB2aW1cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgdmltU3RhdGUucmVzZXROb3JtYWxNb2RlKClcblxuICBkZXNjcmliZSBcImluaXRpYWxpemF0aW9uXCIsIC0+XG4gICAgaXQgXCJwdXRzIHRoZSBlZGl0b3IgaW4gbm9ybWFsLW1vZGUgaW5pdGlhbGx5IGJ5IGRlZmF1bHRcIiwgLT5cbiAgICAgIGVuc3VyZSBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgaXQgXCJwdXRzIHRoZSBlZGl0b3IgaW4gaW5zZXJ0LW1vZGUgaWYgc3RhcnRJbkluc2VydE1vZGUgaXMgdHJ1ZVwiLCAtPlxuICAgICAgc2V0dGluZ3Muc2V0ICdzdGFydEluSW5zZXJ0TW9kZScsIHRydWVcbiAgICAgIGdldFZpbVN0YXRlIChzdGF0ZSwgdmltKSAtPlxuICAgICAgICB2aW0uZW5zdXJlIG1vZGU6ICdpbnNlcnQnXG5cbiAgZGVzY3JpYmUgXCI6OmRlc3Ryb3lcIiwgLT5cbiAgICBpdCBcInJlLWVuYWJsZXMgdGV4dCBpbnB1dCBvbiB0aGUgZWRpdG9yXCIsIC0+XG4gICAgICBleHBlY3QoZWRpdG9yRWxlbWVudC5jb21wb25lbnQuaXNJbnB1dEVuYWJsZWQoKSkudG9CZUZhbHN5KClcbiAgICAgIHZpbVN0YXRlLmRlc3Ryb3koKVxuICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQuY29tcG9uZW50LmlzSW5wdXRFbmFibGVkKCkpLnRvQmVUcnV0aHkoKVxuXG4gICAgaXQgXCJyZW1vdmVzIHRoZSBtb2RlIGNsYXNzZXMgZnJvbSB0aGUgZWRpdG9yXCIsIC0+XG4gICAgICBlbnN1cmUgbW9kZTogJ25vcm1hbCdcbiAgICAgIHZpbVN0YXRlLmRlc3Ryb3koKVxuICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibm9ybWFsLW1vZGVcIikpLnRvQmVGYWxzeSgpXG5cbiAgICBpdCBcImlzIGEgbm9vcCB3aGVuIHRoZSBlZGl0b3IgaXMgYWxyZWFkeSBkZXN0cm95ZWRcIiwgLT5cbiAgICAgIGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKS5kZXN0cm95KClcbiAgICAgIHZpbVN0YXRlLmRlc3Ryb3koKVxuXG4gIGRlc2NyaWJlIFwibm9ybWFsLW1vZGVcIiwgLT5cbiAgICBkZXNjcmliZSBcIndoZW4gZW50ZXJpbmcgYW4gaW5zZXJ0YWJsZSBjaGFyYWN0ZXJcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAga2V5c3Ryb2tlICdcXFxcJ1xuXG4gICAgICBpdCBcInN0b3BzIHByb3BhZ2F0aW9uXCIsIC0+XG4gICAgICAgIGVuc3VyZSB0ZXh0OiAnJ1xuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGVudGVyaW5nIGFuIG9wZXJhdG9yXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGtleXN0cm9rZSAnZCdcblxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIGFuIG9wZXJhdG9yIHRoYXQgY2FuJ3QgYmUgY29tcG9zZWRcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGtleXN0cm9rZSAneCdcblxuICAgICAgICBpdCBcImNsZWFycyB0aGUgb3BlcmF0b3Igc3RhY2tcIiwgLT5cbiAgICAgICAgICBleHBlY3QodmltU3RhdGUub3BlcmF0aW9uU3RhY2suaXNFbXB0eSgpKS50b0JlKHRydWUpXG5cbiAgICAgIGRlc2NyaWJlIFwidGhlIGVzY2FwZSBrZXliaW5kaW5nXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBrZXlzdHJva2UgJ2VzY2FwZSdcblxuICAgICAgICBpdCBcImNsZWFycyB0aGUgb3BlcmF0b3Igc3RhY2tcIiwgLT5cbiAgICAgICAgICBleHBlY3QodmltU3RhdGUub3BlcmF0aW9uU3RhY2suaXNFbXB0eSgpKS50b0JlKHRydWUpXG5cbiAgICAgIGRlc2NyaWJlIFwidGhlIGN0cmwtYyBrZXliaW5kaW5nXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBrZXlzdHJva2UgJ2N0cmwtYydcblxuICAgICAgICBpdCBcImNsZWFycyB0aGUgb3BlcmF0b3Igc3RhY2tcIiwgLT5cbiAgICAgICAgICBleHBlY3QodmltU3RhdGUub3BlcmF0aW9uU3RhY2suaXNFbXB0eSgpKS50b0JlKHRydWUpXG5cbiAgICBkZXNjcmliZSBcInRoZSBlc2NhcGUga2V5YmluZGluZ1wiLCAtPlxuICAgICAgaXQgXCJjbGVhcnMgYW55IGV4dHJhIGN1cnNvcnNcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJvbmUtdHdvLXRocmVlXCJcbiAgICAgICAgICBhZGRDdXJzb3I6IFswLCAzXVxuICAgICAgICBlbnN1cmUgbnVtQ3Vyc29yczogMlxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG51bUN1cnNvcnM6IDFcblxuICAgIGRlc2NyaWJlIFwidGhlIHYga2V5YmluZGluZ1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGFiY1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAga2V5c3Ryb2tlICd2J1xuXG4gICAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbnRvIHZpc3VhbCBjaGFyYWN0ZXJ3aXNlIG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG5cbiAgICBkZXNjcmliZSBcInRoZSBWIGtleWJpbmRpbmdcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCIwMTIzNDVcXG5hYmNkZWZcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGl0IFwicHV0cyB0aGUgZWRpdG9yIGludG8gdmlzdWFsIGxpbmV3aXNlIG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlICdWJywgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuXG4gICAgICBpdCBcInNlbGVjdHMgdGhlIGN1cnJlbnQgbGluZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ1YnLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogJzAxMjM0NVxcbidcblxuICAgIGRlc2NyaWJlIFwidGhlIGN0cmwtdiBrZXliaW5kaW5nXCIsIC0+XG4gICAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbnRvIHZpc3VhbCBibG9ja3dpc2UgbW9kZVwiLCAtPlxuICAgICAgICBzZXQgdGV4dDogXCIwMTIzNDVcXG5cXG5hYmNkZWZcIiwgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdjdHJsLXYnLCBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuXG4gICAgZGVzY3JpYmUgXCJzZWxlY3RpbmcgdGV4dFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzcHlPbihfLl8sIFwibm93XCIpLmFuZENhbGxGYWtlIC0+IHdpbmRvdy5ub3dcbiAgICAgICAgc2V0IHRleHQ6IFwiYWJjIGRlZlwiLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbnRvIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgICAgIGFkdmFuY2VDbG9jaygyMDApXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goZWRpdG9yRWxlbWVudCwgXCJjb3JlOnNlbGVjdC1yaWdodFwiKVxuICAgICAgICBlbnN1cmVcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbWzAsIDBdLCBbMCwgMV1dXG5cbiAgICAgIGl0IFwiaGFuZGxlcyB0aGUgZWRpdG9yIGJlaW5nIGRlc3Ryb3llZCBzaG9ydGx5IGFmdGVyIHNlbGVjdGluZyB0ZXh0XCIsIC0+XG4gICAgICAgIHNldCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbWzAsIDBdLCBbMCwgM11dXG4gICAgICAgIGVkaXRvci5kZXN0cm95KClcbiAgICAgICAgdmltU3RhdGUuZGVzdHJveSgpXG4gICAgICAgIGFkdmFuY2VDbG9jaygxMDApXG5cbiAgICAgIGl0ICdoYW5kbGVzIG5hdGl2ZSBzZWxlY3Rpb24gc3VjaCBhcyBjb3JlOnNlbGVjdC1hbGwnLCAtPlxuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVkaXRvckVsZW1lbnQsICdjb3JlOnNlbGVjdC1hbGwnKVxuICAgICAgICBlbnN1cmUgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1swLCAwXSwgWzAsIDddXVxuXG4gICAgZGVzY3JpYmUgXCJ0aGUgaSBrZXliaW5kaW5nXCIsIC0+XG4gICAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbnRvIGluc2VydCBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnaScsIG1vZGU6ICdpbnNlcnQnXG5cbiAgICBkZXNjcmliZSBcInRoZSBSIGtleWJpbmRpbmdcIiwgLT5cbiAgICAgIGl0IFwicHV0cyB0aGUgZWRpdG9yIGludG8gcmVwbGFjZSBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnUicsIG1vZGU6IFsnaW5zZXJ0JywgJ3JlcGxhY2UnXVxuXG4gICAgZGVzY3JpYmUgXCJ3aXRoIGNvbnRlbnRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiMDEyMzQ1XFxuXFxuYWJjZGVmXCIsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwib24gYSBsaW5lIHdpdGggY29udGVudFwiLCAtPlxuICAgICAgICBpdCBcIltDaGFuZ2VkXSB3b24ndCBhZGp1c3QgY3Vyc29yIHBvc2l0aW9uIGlmIG91dGVyIGNvbW1hbmQgcGxhY2UgdGhlIGN1cnNvciBvbiBlbmQgb2YgbGluZSgnXFxcXG4nKSBjaGFyYWN0ZXJcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVkaXRvckVsZW1lbnQsIFwiZWRpdG9yOm1vdmUtdG8tZW5kLW9mLWxpbmVcIilcbiAgICAgICAgICBlbnN1cmUgY3Vyc29yOiBbMCwgNl1cblxuICAgICAgZGVzY3JpYmUgXCJvbiBhbiBlbXB0eSBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiYWxsb3dzIHRoZSBjdXJzb3IgdG8gYmUgcGxhY2VkIG9uIHRoZSBcXG4gY2hhcmFjdGVyXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlIGN1cnNvcjogWzEsIDBdXG5cbiAgICBkZXNjcmliZSAnd2l0aCBjaGFyYWN0ZXItaW5wdXQgb3BlcmF0aW9ucycsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiAnMDEyMzQ1XFxuYWJjZGVmJ1xuXG4gICAgICBpdCAncHJvcGVybHkgY2xlYXJzIHRoZSBvcGVyYXRpb25zJywgLT5cbiAgICAgICAgZW5zdXJlICdkIHInLFxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIGV4cGVjdCh2aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5pc0VtcHR5KCkpLnRvQmUodHJ1ZSlcbiAgICAgICAgdGFyZ2V0ID0gdmltU3RhdGUuaW5wdXQuZWRpdG9yRWxlbWVudFxuICAgICAgICBrZXlzdHJva2UgJ2QnXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2godGFyZ2V0LCAnY29yZTpjYW5jZWwnKVxuICAgICAgICBlbnN1cmUgdGV4dDogJzAxMjM0NVxcbmFiY2RlZidcblxuICBkZXNjcmliZSBcImFjdGl2YXRlLW5vcm1hbC1tb2RlLW9uY2UgY29tbWFuZFwiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgMCAyMzQ1NlxuICAgICAgICAxIDIzNDU2XG4gICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFswLCAyXVxuICAgICAgZW5zdXJlICdpJywgbW9kZTogJ2luc2VydCcsIGN1cnNvcjogWzAsIDJdXG5cbiAgICBpdCBcImFjdGl2YXRlIG5vcm1hbCBtb2RlIHdpdGhvdXQgbW92aW5nIGN1cnNvcnMgbGVmdCwgdGhlbiBiYWNrIHRvIGluc2VydC1tb2RlIG9uY2Ugc29tZSBjb21tYW5kIGV4ZWN1dGVkXCIsIC0+XG4gICAgICBlbnN1cmUgJ2N0cmwtbycsIGN1cnNvcjogWzAsIDJdLCBtb2RlOiAnbm9ybWFsJ1xuICAgICAgZW5zdXJlICdsJywgY3Vyc29yOiBbMCwgM10sIG1vZGU6ICdpbnNlcnQnXG5cbiAgZGVzY3JpYmUgXCJpbnNlcnQtbW9kZVwiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT4ga2V5c3Ryb2tlICdpJ1xuXG4gICAgZGVzY3JpYmUgXCJ3aXRoIGNvbnRlbnRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiMDEyMzQ1XFxuXFxuYWJjZGVmXCJcblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIGN1cnNvciBpcyBpbiB0aGUgbWlkZGxlIG9mIHRoZSBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgbGVmdCB3aGVuIGV4aXRpbmcgaW5zZXJ0IG1vZGVcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgM11cbiAgICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIGN1cnNvcjogWzAsIDJdXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgYXQgdGhlIGJlZ2lubmluZyBvZiBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwibGVhdmVzIHRoZSBjdXJzb3IgYXQgdGhlIGJlZ2lubmluZyBvZiBsaW5lXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICdlc2NhcGUnLCBjdXJzb3I6IFsxLCAwXVxuXG4gICAgICBkZXNjcmliZSBcIm9uIGEgbGluZSB3aXRoIGNvbnRlbnRcIiwgLT5cbiAgICAgICAgaXQgXCJhbGxvd3MgdGhlIGN1cnNvciB0byBiZSBwbGFjZWQgb24gdGhlIFxcbiBjaGFyYWN0ZXJcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgNl1cbiAgICAgICAgICBlbnN1cmUgY3Vyc29yOiBbMCwgNl1cblxuICAgIGl0IFwicHV0cyB0aGUgZWRpdG9yIGludG8gbm9ybWFsIG1vZGUgd2hlbiA8ZXNjYXBlPiBpcyBwcmVzc2VkXCIsIC0+XG4gICAgICBlc2NhcGUgJ2VzY2FwZScsXG4gICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbnRvIG5vcm1hbCBtb2RlIHdoZW4gPGN0cmwtYz4gaXMgcHJlc3NlZFwiLCAtPlxuICAgICAgd2l0aE1vY2tQbGF0Zm9ybSBlZGl0b3JFbGVtZW50LCAncGxhdGZvcm0tZGFyd2luJyAsIC0+XG4gICAgICAgIGVuc3VyZSAnY3RybC1jJywgbW9kZTogJ25vcm1hbCdcblxuICAgIGRlc2NyaWJlIFwiY2xlYXJNdWx0aXBsZUN1cnNvcnNPbkVzY2FwZUluc2VydE1vZGUgc2V0dGluZ1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiAnYWJjJ1xuICAgICAgICAgIGN1cnNvcjogW1swLCAwXSwgWzAsIDFdXVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gZW5hYmxlZFwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0dGluZ3Muc2V0KCdjbGVhck11bHRpcGxlQ3Vyc29yc09uRXNjYXBlSW5zZXJ0TW9kZScsIHRydWUpXG4gICAgICAgIGl0IFwiY2xlYXIgbXVsdGlwbGUgY3Vyc29yIG9uIGVzY2FwZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnZXNjYXBlJywgbW9kZTogJ25vcm1hbCcsIG51bUN1cnNvcnM6IDFcblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIGRpc2FibGVkXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXR0aW5ncy5zZXQoJ2NsZWFyTXVsdGlwbGVDdXJzb3JzT25Fc2NhcGVJbnNlcnRNb2RlJywgZmFsc2UpXG4gICAgICAgIGl0IFwiY2xlYXIgbXVsdGlwbGUgY3Vyc29yIG9uIGVzY2FwZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnZXNjYXBlJywgbW9kZTogJ25vcm1hbCcsIG51bUN1cnNvcnM6IDJcblxuICBkZXNjcmliZSBcInJlcGxhY2UtbW9kZVwiLCAtPlxuICAgIGRlc2NyaWJlIFwid2l0aCBjb250ZW50XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+IHNldCB0ZXh0OiBcIjAxMjM0NVxcblxcbmFiY2RlZlwiXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgaW4gdGhlIG1pZGRsZSBvZiB0aGUgbGluZVwiLCAtPlxuICAgICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGxlZnQgd2hlbiBleGl0aW5nIHJlcGxhY2UgbW9kZVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAzXVxuICAgICAgICAgIGVuc3VyZSAnUiBlc2NhcGUnLCBjdXJzb3I6IFswLCAyXVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gY3Vyc29yIGlzIGF0IHRoZSBiZWdpbm5pbmcgb2YgbGluZVwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG5cbiAgICAgICAgaXQgXCJsZWF2ZXMgdGhlIGN1cnNvciBhdCB0aGUgYmVnaW5uaW5nIG9mIGxpbmVcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICBlbnN1cmUgJ1IgZXNjYXBlJywgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJvbiBhIGxpbmUgd2l0aCBjb250ZW50XCIsIC0+XG4gICAgICAgIGl0IFwiYWxsb3dzIHRoZSBjdXJzb3IgdG8gYmUgcGxhY2VkIG9uIHRoZSBcXG4gY2hhcmFjdGVyXCIsIC0+XG4gICAgICAgICAga2V5c3Ryb2tlICdSJ1xuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCA2XVxuICAgICAgICAgIGVuc3VyZSBjdXJzb3I6IFswLCA2XVxuXG4gICAgaXQgXCJwdXRzIHRoZSBlZGl0b3IgaW50byBub3JtYWwgbW9kZSB3aGVuIDxlc2NhcGU+IGlzIHByZXNzZWRcIiwgLT5cbiAgICAgIGVuc3VyZSAnUiBlc2NhcGUnLFxuICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgaXQgXCJwdXRzIHRoZSBlZGl0b3IgaW50byBub3JtYWwgbW9kZSB3aGVuIDxjdHJsLWM+IGlzIHByZXNzZWRcIiwgLT5cbiAgICAgIHdpdGhNb2NrUGxhdGZvcm0gZWRpdG9yRWxlbWVudCwgJ3BsYXRmb3JtLWRhcndpbicgLCAtPlxuICAgICAgICBlbnN1cmUgJ1IgY3RybC1jJywgbW9kZTogJ25vcm1hbCdcblxuICBkZXNjcmliZSBcInZpc3VhbC1tb2RlXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICBvbmUgdHdvIHRocmVlXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3JCdWZmZXI6IFswLCA0XVxuICAgICAga2V5c3Ryb2tlICd2J1xuXG4gICAgaXQgXCJzZWxlY3RzIHRoZSBjaGFyYWN0ZXIgdW5kZXIgdGhlIGN1cnNvclwiLCAtPlxuICAgICAgZW5zdXJlXG4gICAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IFtbMCwgNF0sIFswLCA1XV1cbiAgICAgICAgc2VsZWN0ZWRUZXh0OiAndCdcblxuICAgIGl0IFwicHV0cyB0aGUgZWRpdG9yIGludG8gbm9ybWFsIG1vZGUgd2hlbiA8ZXNjYXBlPiBpcyBwcmVzc2VkXCIsIC0+XG4gICAgICBlbnN1cmUgJ2VzY2FwZScsXG4gICAgICAgIGN1cnNvckJ1ZmZlcjogWzAsIDRdXG4gICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbnRvIG5vcm1hbCBtb2RlIHdoZW4gPGVzY2FwZT4gaXMgcHJlc3NlZCBvbiBzZWxlY3Rpb24gaXMgcmV2ZXJzZWRcIiwgLT5cbiAgICAgIGVuc3VyZSBzZWxlY3RlZFRleHQ6ICd0J1xuICAgICAgZW5zdXJlICdoIGgnLFxuICAgICAgICBzZWxlY3RlZFRleHQ6ICdlIHQnXG4gICAgICAgIHNlbGVjdGlvbklzUmV2ZXJzZWQ6IHRydWVcbiAgICAgIGVuc3VyZSAnZXNjYXBlJyxcbiAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgY3Vyc29yQnVmZmVyOiBbMCwgMl1cblxuICAgIGRlc2NyaWJlIFwibW90aW9uc1wiLCAtPlxuICAgICAgaXQgXCJ0cmFuc2Zvcm1zIHRoZSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgZW5zdXJlICd3Jywgc2VsZWN0ZWRUZXh0OiAndHdvIHQnXG5cbiAgICAgIGl0IFwiYWx3YXlzIGxlYXZlcyB0aGUgaW5pdGlhbGx5IHNlbGVjdGVkIGNoYXJhY3RlciBzZWxlY3RlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2gnLCBzZWxlY3RlZFRleHQ6ICcgdCdcbiAgICAgICAgZW5zdXJlICdsJywgc2VsZWN0ZWRUZXh0OiAndCdcbiAgICAgICAgZW5zdXJlICdsJywgc2VsZWN0ZWRUZXh0OiAndHcnXG5cbiAgICBkZXNjcmliZSBcIm9wZXJhdG9yc1wiLCAtPlxuICAgICAgaXQgXCJvcGVyYXRlIG9uIHRoZSBjdXJyZW50IHNlbGVjdGlvblwiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIjAxMjM0NVxcblxcbmFiY2RlZlwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdWIGQnLCB0ZXh0OiBcIlxcbmFiY2RlZlwiXG5cbiAgICBkZXNjcmliZSBcInJldHVybmluZyB0byBub3JtYWwtbW9kZVwiLCAtPlxuICAgICAgaXQgXCJvcGVyYXRlIG9uIHRoZSBjdXJyZW50IHNlbGVjdGlvblwiLCAtPlxuICAgICAgICBzZXQgdGV4dDogXCIwMTIzNDVcXG5cXG5hYmNkZWZcIlxuICAgICAgICBlbnN1cmUgJ1YgZXNjYXBlJywgc2VsZWN0ZWRUZXh0OiAnJ1xuXG4gICAgZGVzY3JpYmUgXCJ0aGUgbyBrZXliaW5kaW5nXCIsIC0+XG4gICAgICBpdCBcInJldmVyc2VkIGVhY2ggc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIHNldCBhZGRDdXJzb3I6IFswLCAxMl1cbiAgICAgICAgZW5zdXJlICdpIHcnLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogW1widHdvXCIsIFwidGhyZWVcIl1cbiAgICAgICAgICBzZWxlY3Rpb25Jc1JldmVyc2VkOiBmYWxzZVxuICAgICAgICBlbnN1cmUgJ28nLFxuICAgICAgICAgIHNlbGVjdGlvbklzUmV2ZXJzZWQ6IHRydWVcblxuICAgICAgeGl0IFwiaGFybW9uaXplcyBzZWxlY3Rpb24gZGlyZWN0aW9uc1wiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yQnVmZmVyOiBbMCwgMF1cbiAgICAgICAga2V5c3Ryb2tlICdlIGUnXG4gICAgICAgIHNldCBhZGRDdXJzb3I6IFswLCBJbmZpbml0eV1cbiAgICAgICAgZW5zdXJlICdoIGgnLFxuICAgICAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IFtcbiAgICAgICAgICAgIFtbMCwgMF0sIFswLCA1XV0sXG4gICAgICAgICAgICBbWzAsIDExXSwgWzAsIDEzXV1cbiAgICAgICAgICBdXG4gICAgICAgICAgY3Vyc29yQnVmZmVyOiBbXG4gICAgICAgICAgICBbMCwgNV1cbiAgICAgICAgICAgIFswLCAxMV1cbiAgICAgICAgICBdXG5cbiAgICAgICAgZW5zdXJlICdvJyxcbiAgICAgICAgICBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbXG4gICAgICAgICAgICBbWzAsIDBdLCBbMCwgNV1dLFxuICAgICAgICAgICAgW1swLCAxMV0sIFswLCAxM11dXG4gICAgICAgICAgXVxuICAgICAgICAgIGN1cnNvckJ1ZmZlcjogW1xuICAgICAgICAgICAgWzAsIDVdXG4gICAgICAgICAgICBbMCwgMTNdXG4gICAgICAgICAgXVxuXG4gICAgZGVzY3JpYmUgXCJhY3RpdmF0ZSB2aXN1YWxtb2RlIHdpdGhpbiB2aXN1YWxtb2RlXCIsIC0+XG4gICAgICBjdXJzb3JQb3NpdGlvbiA9IG51bGxcbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgY3Vyc29yUG9zaXRpb24gPSBbMCwgNF1cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJsaW5lIG9uZVxcbmxpbmUgdHdvXFxubGluZSB0aHJlZVxcblwiXG4gICAgICAgICAgY3Vyc29yOiBjdXJzb3JQb3NpdGlvblxuXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgbW9kZTogJ25vcm1hbCdcblxuICAgICAgZGVzY3JpYmUgXCJhY3RpdmF0ZVZpc3VhbE1vZGUgd2l0aCBzYW1lIHR5cGUgcHV0cyB0aGUgZWRpdG9yIGludG8gbm9ybWFsIG1vZGVcIiwgLT5cbiAgICAgICAgZGVzY3JpYmUgXCJjaGFyYWN0ZXJ3aXNlOiB2dlwiLCAtPlxuICAgICAgICAgIGl0IFwiYWN0aXZhdGluZyB0d2ljZSBtYWtlIGVkaXRvciByZXR1cm4gdG8gbm9ybWFsIG1vZGUgXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ3YnLCBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgICAgICAgIGVuc3VyZSAndicsIG1vZGU6ICdub3JtYWwnLCBjdXJzb3I6IGN1cnNvclBvc2l0aW9uXG5cbiAgICAgICAgZGVzY3JpYmUgXCJsaW5ld2lzZTogVlZcIiwgLT5cbiAgICAgICAgICBpdCBcImFjdGl2YXRpbmcgdHdpY2UgbWFrZSBlZGl0b3IgcmV0dXJuIHRvIG5vcm1hbCBtb2RlIFwiLCAtPlxuICAgICAgICAgICAgZW5zdXJlICdWJywgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuICAgICAgICAgICAgZW5zdXJlICdWJywgbW9kZTogJ25vcm1hbCcsIGN1cnNvcjogY3Vyc29yUG9zaXRpb25cblxuICAgICAgICBkZXNjcmliZSBcImJsb2Nrd2lzZTogY3RybC12IHR3aWNlXCIsIC0+XG4gICAgICAgICAgaXQgXCJhY3RpdmF0aW5nIHR3aWNlIG1ha2UgZWRpdG9yIHJldHVybiB0byBub3JtYWwgbW9kZSBcIiwgLT5cbiAgICAgICAgICAgIGVuc3VyZSAnY3RybC12JywgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgICAgICAgIGVuc3VyZSAnY3RybC12JywgbW9kZTogJ25vcm1hbCcsIGN1cnNvcjogY3Vyc29yUG9zaXRpb25cblxuICAgICAgZGVzY3JpYmUgXCJjaGFuZ2Ugc3VibW9kZSB3aXRoaW4gdmlzdWFsbW9kZVwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcImxpbmUgb25lXFxubGluZSB0d29cXG5saW5lIHRocmVlXFxuXCJcbiAgICAgICAgICAgIGN1cnNvckJ1ZmZlcjogW1swLCA1XSwgWzIsIDVdXVxuXG4gICAgICAgIGl0IFwiY2FuIGNoYW5nZSBzdWJtb2RlIHdpdGhpbiB2aXN1YWwgbW9kZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAndicgICAgICAgICwgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG4gICAgICAgICAgZW5zdXJlICdWJyAgICAgICAgLCBtb2RlOiBbJ3Zpc3VhbCcsICdsaW5ld2lzZSddXG4gICAgICAgICAgZW5zdXJlICdjdHJsLXYnLCBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgICAgIGVuc3VyZSAndicgICAgICAgICwgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG5cbiAgICAgICAgaXQgXCJyZWNvdmVyIG9yaWdpbmFsIHJhbmdlIHdoZW4gc2hpZnQgZnJvbSBsaW5ld2lzZSB0byBjaGFyYWN0ZXJ3aXNlXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICd2IGkgdycsIHNlbGVjdGVkVGV4dDogWydvbmUnLCAndGhyZWUnXVxuICAgICAgICAgIGVuc3VyZSAnVicsIHNlbGVjdGVkVGV4dDogW1wibGluZSBvbmVcXG5cIiwgXCJsaW5lIHRocmVlXFxuXCJdXG4gICAgICAgICAgZW5zdXJlICd2Jywgc2VsZWN0ZWRUZXh0OiBbXCJvbmVcIiwgXCJ0aHJlZVwiXVxuXG4gICAgICBkZXNjcmliZSBcImtlZXAgZ29hbENvbHVtIHdoZW4gc3VibW9kZSBjaGFuZ2UgaW4gdmlzdWFsLW1vZGVcIiwgLT5cbiAgICAgICAgdGV4dCA9IG51bGxcbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHRleHQgPSBuZXcgVGV4dERhdGEgXCJcIlwiXG4gICAgICAgICAgMF8zNDU2Nzg5MEFCQ0RFRlxuICAgICAgICAgIDFfMzQ1Njc4OTBcbiAgICAgICAgICAyXzM0NTY3XG4gICAgICAgICAgM18zNDU2Nzg5MEFcbiAgICAgICAgICA0XzM0NTY3ODkwQUJDREVGXFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiB0ZXh0LmdldFJhdygpXG4gICAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuXG4gICAgICAgIGl0IFwia2VlcCBnb2FsQ29sdW1uIHdoZW4gc2hpZnQgbGluZXdpc2UgdG8gY2hhcmFjdGVyd2lzZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnVicsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMF0pLCBjaGFyYWN0ZXJ3aXNlSGVhZDogWzAsIDBdLCBtb2RlOiBbJ3Zpc3VhbCcsICdsaW5ld2lzZSddXG4gICAgICAgICAgZW5zdXJlICckJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFswXSksIGNoYXJhY3Rlcndpc2VIZWFkOiBbMCwgMTVdLCBtb2RlOiBbJ3Zpc3VhbCcsICdsaW5ld2lzZSddXG4gICAgICAgICAgZW5zdXJlICdqJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFswLCAxXSksIGNoYXJhY3Rlcndpc2VIZWFkOiBbMSwgOV0sIG1vZGU6IFsndmlzdWFsJywgJ2xpbmV3aXNlJ11cbiAgICAgICAgICBlbnN1cmUgJ2onLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzAuLjJdKSwgY2hhcmFjdGVyd2lzZUhlYWQ6IFsyLCA2XSwgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuICAgICAgICAgIGVuc3VyZSAndicsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMC4uMl0sIGNob21wOiB0cnVlKSwgY2hhcmFjdGVyd2lzZUhlYWQ6IFsyLCA2XSwgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG4gICAgICAgICAgZW5zdXJlICdqJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFswLi4zXSwgY2hvbXA6IHRydWUpLCBjdXJzb3I6IFszLCAxMV0sIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgICAgIGVuc3VyZSAndicsIGN1cnNvcjogWzMsIDEwXSwgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICBlbnN1cmUgJ2onLCBjdXJzb3I6IFs0LCAxNV0sIG1vZGU6ICdub3JtYWwnXG5cbiAgICBkZXNjcmliZSBcImRlYWN0aXZhdGluZyB2aXN1YWwgbW9kZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgbGluZSBvbmVcbiAgICAgICAgICAgIGxpbmUgdHdvXG4gICAgICAgICAgICBsaW5lIHRocmVlXFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCA3XVxuICAgICAgaXQgXCJjYW4gcHV0IGN1cnNvciBhdCBpbiB2aXN1YWwgY2hhciBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAndicsIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXSwgY3Vyc29yOiBbMCwgOF1cbiAgICAgIGl0IFwiYWRqdXN0IGN1cnNvciBwb3NpdGlvbiAxIGNvbHVtbiBsZWZ0IHdoZW4gZGVhY3RpdmF0ZWRcIiwgLT5cbiAgICAgICAgZW5zdXJlICd2IGVzY2FwZScsIG1vZGU6ICdub3JtYWwnLCBjdXJzb3I6IFswLCA3XVxuICAgICAgaXQgXCJbQ0hBTkdFRCBmcm9tIHZpbS1tb2RlXSBjYW4gbm90IHNlbGVjdCBuZXcgbGluZSBpbiBjaGFyYWN0ZXJ3aXNlIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAndiBsIGwnLCBjdXJzb3I6IFswLCA4XVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnLCBjdXJzb3I6IFswLCA3XVxuXG4gICAgZGVzY3JpYmUgXCJkZWFjdGl2YXRpbmcgdmlzdWFsIG1vZGUgb24gYmxhbmsgbGluZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMDogYWJjXG5cbiAgICAgICAgICAgIDI6IGFiY1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMF1cbiAgICAgIGl0IFwidiBjYXNlLTFcIiwgLT5cbiAgICAgICAgZW5zdXJlICd2JywgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddLCBjdXJzb3I6IFsyLCAwXVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgaXQgXCJ2IGNhc2UtMiBzZWxlY3Rpb24gaGVhZCBpcyBibGFuayBsaW5lXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAxXVxuICAgICAgICBlbnN1cmUgJ3YgaicsIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXSwgY3Vyc29yOiBbMiwgMF0sIHNlbGVjdGVkVGV4dDogXCI6IGFiY1xcblxcblwiXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgbW9kZTogJ25vcm1hbCcsIGN1cnNvcjogWzEsIDBdXG4gICAgICBpdCBcIlYgY2FzZS0xXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnVicsIG1vZGU6IFsndmlzdWFsJywgJ2xpbmV3aXNlJ10sIGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgbW9kZTogJ25vcm1hbCcsIGN1cnNvcjogWzEsIDBdXG4gICAgICBpdCBcIlYgY2FzZS0yIHNlbGVjdGlvbiBoZWFkIGlzIGJsYW5rIGxpbmVcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGVuc3VyZSAnViBqJywgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXSwgY3Vyc29yOiBbMiwgMF0sIHNlbGVjdGVkVGV4dDogXCIwOiBhYmNcXG5cXG5cIlxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgaXQgXCJjdHJsLXZcIiwgLT5cbiAgICAgICAgZW5zdXJlICdjdHJsLXYnLCBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXSwgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1sxLCAwXSwgWzEsIDBdXVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgaXQgXCJjdHJsLXYgYW5kIG1vdmUgb3ZlciBlbXB0eSBsaW5lXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnY3RybC12JywgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ10sIHNlbGVjdGVkQnVmZmVyUmFuZ2VPcmRlcmVkOiBbWzEsIDBdLCBbMSwgMF1dXG4gICAgICAgIGVuc3VyZSAnaycsIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddLCBzZWxlY3RlZEJ1ZmZlclJhbmdlT3JkZXJlZDogW1tbMCwgMF0sIFswLCAxXV0sIFtbMSwgMF0sIFsxLCAwXV1dXG4gICAgICAgIGVuc3VyZSAnaicsIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddLCBzZWxlY3RlZEJ1ZmZlclJhbmdlT3JkZXJlZDogW1sxLCAwXSwgWzEsIDBdXVxuICAgICAgICBlbnN1cmUgJ2onLCBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXSwgc2VsZWN0ZWRCdWZmZXJSYW5nZU9yZGVyZWQ6IFtbWzEsIDBdLCBbMSwgMF1dLCBbWzIsIDBdLCBbMiwgMV1dXVxuXG4gIGRlc2NyaWJlIFwibWFya3NcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+IHNldCB0ZXh0OiBcInRleHQgaW4gbGluZSAxXFxudGV4dCBpbiBsaW5lIDJcXG50ZXh0IGluIGxpbmUgM1wiXG5cbiAgICBpdCBcImJhc2ljIG1hcmtpbmcgZnVuY3Rpb25hbGl0eVwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzEsIDFdXG4gICAgICBrZXlzdHJva2UgJ20gdCdcbiAgICAgIHNldCBjdXJzb3I6IFsyLCAyXVxuICAgICAgZW5zdXJlICdgIHQnLCBjdXJzb3I6IFsxLCAxXVxuXG4gICAgaXQgXCJyZWFsICh0cmFja2luZykgbWFya2luZyBmdW5jdGlvbmFsaXR5XCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMiwgMl1cbiAgICAgIGtleXN0cm9rZSAnbSBxJ1xuICAgICAgc2V0IGN1cnNvcjogWzEsIDJdXG4gICAgICBlbnN1cmUgJ28gZXNjYXBlIGAgcScsIGN1cnNvcjogWzMsIDJdXG5cbiAgICBpdCBcInJlYWwgKHRyYWNraW5nKSBtYXJraW5nIGZ1bmN0aW9uYWxpdHlcIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFsyLCAyXVxuICAgICAga2V5c3Ryb2tlICdtIHEnXG4gICAgICBzZXQgY3Vyc29yOiBbMSwgMl1cbiAgICAgIGVuc3VyZSAnZCBkIGVzY2FwZSBgIHEnLCBjdXJzb3I6IFsxLCAyXVxuXG4gIGRlc2NyaWJlIFwiaXMtbmFycm93ZWQgYXR0cmlidXRlXCIsIC0+XG4gICAgZW5zdXJlTm9ybWFsTW9kZVN0YXRlID0gLT5cbiAgICAgIGVuc3VyZSBcImVzY2FwZVwiLFxuICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICBzZWxlY3RlZFRleHQ6ICcnXG4gICAgICAgIHNlbGVjdGlvbklzTmFycm93ZWQ6IGZhbHNlXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAxOi0tLS0tXG4gICAgICAgIDI6LS0tLS1cbiAgICAgICAgMzotLS0tLVxuICAgICAgICA0Oi0tLS0tXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFswLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJub3JtYWwtbW9kZVwiLCAtPlxuICAgICAgaXQgXCJpcyBub3QgbmFycm93ZWRcIiwgLT5cbiAgICAgICAgZW5zdXJlXG4gICAgICAgICAgbW9kZTogWydub3JtYWwnXVxuICAgICAgICAgIHNlbGVjdGlvbklzTmFycm93ZWQ6IGZhbHNlXG4gICAgZGVzY3JpYmUgXCJ2aXN1YWwtbW9kZS5jaGFyYWN0ZXJ3aXNlXCIsIC0+XG4gICAgICBpdCBcIltzaW5nbGUgcm93XSBpcyBuYXJyb3dlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3YgJCcsXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0OiAnMTotLS0tLSdcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgICAgICBzZWxlY3Rpb25Jc05hcnJvd2VkOiBmYWxzZVxuICAgICAgICBlbnN1cmVOb3JtYWxNb2RlU3RhdGUoKVxuICAgICAgaXQgXCJbbXVsdGktcm93XSBpcyBuYXJyb3dlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3YgaicsXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0OiBcIlwiXCJcbiAgICAgICAgICAxOi0tLS0tXG4gICAgICAgICAgMlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgICAgIHNlbGVjdGlvbklzTmFycm93ZWQ6IHRydWVcbiAgICAgICAgZW5zdXJlTm9ybWFsTW9kZVN0YXRlKClcbiAgICBkZXNjcmliZSBcInZpc3VhbC1tb2RlLmxpbmV3aXNlXCIsIC0+XG4gICAgICBpdCBcIltzaW5nbGUgcm93XSBpcyBuYXJyb3dlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ1YnLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogXCIxOi0tLS0tXFxuXCJcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdsaW5ld2lzZSddXG4gICAgICAgICAgc2VsZWN0aW9uSXNOYXJyb3dlZDogZmFsc2VcbiAgICAgICAgZW5zdXJlTm9ybWFsTW9kZVN0YXRlKClcbiAgICAgIGl0IFwiW211bHRpLXJvd10gaXMgbmFycm93ZWRcIiwgLT5cbiAgICAgICAgZW5zdXJlICdWIGonLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogXCJcIlwiXG4gICAgICAgICAgMTotLS0tLVxuICAgICAgICAgIDI6LS0tLS1cXG5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdsaW5ld2lzZSddXG4gICAgICAgICAgc2VsZWN0aW9uSXNOYXJyb3dlZDogdHJ1ZVxuICAgICAgICBlbnN1cmVOb3JtYWxNb2RlU3RhdGUoKVxuICAgIGRlc2NyaWJlIFwidmlzdWFsLW1vZGUuYmxvY2t3aXNlXCIsIC0+XG4gICAgICBpdCBcIltzaW5nbGUgcm93XSBpcyBuYXJyb3dlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2N0cmwtdiBsJyxcbiAgICAgICAgICBzZWxlY3RlZFRleHQ6IFwiMTpcIlxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgICAgc2VsZWN0aW9uSXNOYXJyb3dlZDogZmFsc2VcbiAgICAgICAgZW5zdXJlTm9ybWFsTW9kZVN0YXRlKClcbiAgICAgIGl0IFwiW211bHRpLXJvd10gaXMgbmFycm93ZWRcIiwgLT5cbiAgICAgICAgZW5zdXJlICdjdHJsLXYgbCBqJyxcbiAgICAgICAgICBzZWxlY3RlZFRleHQ6IFtcIjE6XCIsIFwiMjpcIl1cbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgICAgIHNlbGVjdGlvbklzTmFycm93ZWQ6IHRydWVcbiAgICAgICAgZW5zdXJlTm9ybWFsTW9kZVN0YXRlKClcbiJdfQ==
