(function() {
  var TextData, dispatch, getView, getVimState, rawKeystroke, ref, settings, withMockPlatform;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData, getView = ref.getView, withMockPlatform = ref.withMockPlatform, rawKeystroke = ref.rawKeystroke;

  settings = require('../lib/settings');

  describe("Occurrence", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      getVimState(function(state, vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
      });
      return runs(function() {
        return jasmine.attachToDOM(editorElement);
      });
    });
    afterEach(function() {
      return vimState.resetNormalMode();
    });
    describe("operator-modifier-occurrence", function() {
      beforeEach(function() {
        return set({
          text: "\nooo: xxx: ooo:\n|||: ooo: xxx: ooo:\nooo: xxx: |||: xxx: ooo:\nxxx: |||: ooo: ooo:\n\nooo: xxx: ooo:\n|||: ooo: xxx: ooo:\nooo: xxx: |||: xxx: ooo:\nxxx: |||: ooo: ooo:\n"
        });
      });
      describe("operator-modifier-characterwise", function() {
        return it("change occurrence of cursor word in inner-paragraph", function() {
          set({
            cursor: [1, 0]
          });
          ensure("c o i p", {
            mode: 'insert',
            numCursors: 8,
            text: "\n: xxx: :\n|||: : xxx: :\n: xxx: |||: xxx: :\nxxx: |||: : :\n\nooo: xxx: ooo:\n|||: ooo: xxx: ooo:\nooo: xxx: |||: xxx: ooo:\nxxx: |||: ooo: ooo:\n"
          });
          editor.insertText('!!!');
          ensure("escape", {
            mode: 'normal',
            numCursors: 8,
            text: "\n!!!: xxx: !!!:\n|||: !!!: xxx: !!!:\n!!!: xxx: |||: xxx: !!!:\nxxx: |||: !!!: !!!:\n\nooo: xxx: ooo:\n|||: ooo: xxx: ooo:\nooo: xxx: |||: xxx: ooo:\nxxx: |||: ooo: ooo:\n"
          });
          return ensure("} j .", {
            mode: 'normal',
            numCursors: 8,
            text: "\n!!!: xxx: !!!:\n|||: !!!: xxx: !!!:\n!!!: xxx: |||: xxx: !!!:\nxxx: |||: !!!: !!!:\n\n!!!: xxx: !!!:\n|||: !!!: xxx: !!!:\n!!!: xxx: |||: xxx: !!!:\nxxx: |||: !!!: !!!:\n"
          });
        });
      });
      describe("apply various operator to occurrence in various target", function() {
        beforeEach(function() {
          return set({
            text: "ooo: xxx: ooo:\n|||: ooo: xxx: ooo:\nooo: xxx: |||: xxx: ooo:\nxxx: |||: ooo: ooo:"
          });
        });
        it("upper case inner-word", function() {
          set({
            cursor: [0, 11]
          });
          ensure("g U o i l", function() {
            return {
              text: "OOO: xxx: OOO:\n|||: ooo: xxx: ooo:\nooo: xxx: |||: xxx: ooo:\nxxx: |||: ooo: ooo:",
              cursor: [0, 0]
            };
          });
          ensure("2 j .", function() {
            return {
              text: "OOO: xxx: OOO:\n|||: ooo: xxx: ooo:\nOOO: xxx: |||: xxx: OOO:\nxxx: |||: ooo: ooo:",
              cursor: [2, 0]
            };
          });
          return ensure("j .", function() {
            return {
              text: "OOO: xxx: OOO:\n|||: ooo: xxx: ooo:\nOOO: xxx: |||: xxx: OOO:\nxxx: |||: OOO: OOO:",
              cursor: [2, 0]
            };
          });
        });
        return it("lower case with motion", function() {
          set({
            text: "OOO: XXX: OOO:\n|||: OOO: XXX: OOO:\nOOO: XXX: |||: XXX: OOO:\nXXX: |||: OOO: OOO:",
            cursor: [0, 6]
          });
          return ensure("g u o 2 j", {
            text: "OOO: xxx: OOO:\n|||: OOO: xxx: OOO:\nOOO: xxx: |||: xxx: OOO:\nXXX: |||: OOO: OOO:"
          });
        });
      });
      describe("auto extend target range to include occurrence", function() {
        var textFinal, textOriginal;
        textOriginal = "This text have 3 instance of 'text' in the whole text.\n";
        textFinal = textOriginal.replace(/text/g, '');
        beforeEach(function() {
          return set({
            text: textOriginal
          });
        });
        it("[from start of 1st]", function() {
          set({
            cursor: [0, 5]
          });
          return ensure('d o $', {
            text: textFinal
          });
        });
        it("[from middle of 1st]", function() {
          set({
            cursor: [0, 7]
          });
          return ensure('d o $', {
            text: textFinal
          });
        });
        it("[from end of last]", function() {
          set({
            cursor: [0, 52]
          });
          return ensure('d o 0', {
            text: textFinal
          });
        });
        return it("[from middle of last]", function() {
          set({
            cursor: [0, 51]
          });
          return ensure('d o 0', {
            text: textFinal
          });
        });
      });
      return describe("select-occurrence", function() {
        beforeEach(function() {
          return set({
            text: "vim-mode-plus vim-mode-plus"
          });
        });
        return describe("what the cursor-word", function() {
          var ensureCursorWord;
          ensureCursorWord = function(initialPoint, arg) {
            var selectedText;
            selectedText = arg.selectedText;
            set({
              cursor: initialPoint
            });
            ensure("g cmd-d i p", {
              selectedText: selectedText,
              mode: ['visual', 'characterwise']
            });
            return ensure("escape", {
              mode: "normal"
            });
          };
          describe("cursor is on normal word", function() {
            return it("pick word but not pick partially matched one [by select]", function() {
              ensureCursorWord([0, 0], {
                selectedText: ['vim', 'vim']
              });
              ensureCursorWord([0, 3], {
                selectedText: ['-', '-', '-', '-']
              });
              ensureCursorWord([0, 4], {
                selectedText: ['mode', 'mode']
              });
              return ensureCursorWord([0, 9], {
                selectedText: ['plus', 'plus']
              });
            });
          });
          describe("cursor is at single white space [by delete]", function() {
            return it("pick single white space only", function() {
              set({
                text: "ooo ooo ooo\n ooo ooo ooo",
                cursor: [0, 3]
              });
              return ensure("d o i p", {
                text: "ooooooooo\nooooooooo"
              });
            });
          });
          return describe("cursor is at sequnce of space [by delete]", function() {
            return it("select sequnce of white spaces including partially mached one", function() {
              set({
                cursor: [0, 3],
                text_: "ooo___ooo ooo\n ooo ooo____ooo________ooo"
              });
              return ensure("d o i p", {
                text_: "oooooo ooo\n ooo ooo ooo  ooo"
              });
            });
          });
        });
      });
    });
    describe("from visual-mode.is-narrowed", function() {
      beforeEach(function() {
        return set({
          text: "ooo: xxx: ooo:\n|||: ooo: xxx: ooo:\nooo: xxx: |||: xxx: ooo:\nxxx: |||: ooo: ooo:",
          cursor: [0, 0]
        });
      });
      describe("[vC] select-occurrence", function() {
        return it("select cursor-word which intersecting selection then apply upper-case", function() {
          return ensure("v 2 j cmd-d U", {
            text: "OOO: xxx: OOO:\n|||: OOO: xxx: OOO:\nOOO: xxx: |||: xxx: ooo:\nxxx: |||: ooo: ooo:",
            numCursors: 5
          });
        });
      });
      describe("[vL] select-occurrence", function() {
        return it("select cursor-word which intersecting selection then apply upper-case", function() {
          return ensure("5 l V 2 j cmd-d U", {
            text: "ooo: XXX: ooo:\n|||: ooo: XXX: ooo:\nooo: XXX: |||: XXX: ooo:\nxxx: |||: ooo: ooo:",
            numCursors: 4
          });
        });
      });
      return describe("[vB] select-occurrence", function() {
        it("select cursor-word which intersecting selection then apply upper-case", function() {
          return ensure("W ctrl-v 2 j $ h cmd-d U", {
            text: "ooo: xxx: OOO:\n|||: OOO: xxx: OOO:\nooo: xxx: |||: xxx: OOO:\nxxx: |||: ooo: ooo:",
            numCursors: 4
          });
        });
        return it("pick cursor-word from vB range", function() {
          return ensure("ctrl-v 7 l 2 j o cmd-d U", {
            text: "OOO: xxx: ooo:\n|||: OOO: xxx: ooo:\nOOO: xxx: |||: xxx: ooo:\nxxx: |||: ooo: ooo:",
            numCursors: 3
          });
        });
      });
    });
    describe("incremental search integration: change-occurrence-from-search, select-occurrence-from-search", function() {
      var ref2, searchEditor, searchEditorElement;
      ref2 = [], searchEditor = ref2[0], searchEditorElement = ref2[1];
      beforeEach(function() {
        searchEditor = vimState.searchInput.editor;
        searchEditorElement = searchEditor.element;
        jasmine.attachToDOM(getView(atom.workspace));
        settings.set('incrementalSearch', true);
        return set({
          text: "ooo: xxx: ooo: 0000\n1: ooo: 22: ooo:\nooo: xxx: |||: xxx: 3333:\n444: |||: ooo: ooo:",
          cursor: [0, 0]
        });
      });
      describe("from normal mode", function() {
        it("select occurrence by pattern match", function() {
          keystroke('/');
          searchEditor.insertText('\\d{3,4}');
          return withMockPlatform(searchEditorElement, 'platform-darwin', function() {
            rawKeystroke('cmd-d', document.activeElement);
            return ensure('i e', {
              selectedText: ['0000', '3333', '444'],
              mode: ['visual', 'characterwise']
            });
          });
        });
        return it("change occurrence by pattern match", function() {
          keystroke('/');
          searchEditor.insertText('^\\w+:');
          return withMockPlatform(searchEditorElement, 'platform-darwin', function() {
            rawKeystroke('ctrl-cmd-c', document.activeElement);
            ensure('i e', {
              mode: 'insert'
            });
            editor.insertText('hello');
            return ensure({
              text: "hello xxx: ooo: 0000\nhello ooo: 22: ooo:\nhello xxx: |||: xxx: 3333:\nhello |||: ooo: ooo:"
            });
          });
        });
      });
      describe("from visual mode", function() {
        describe("visual characterwise", function() {
          return it("change occurrence in narrowed selection", function() {
            keystroke('v j /');
            searchEditor.insertText('o+');
            return withMockPlatform(searchEditorElement, 'platform-darwin', function() {
              rawKeystroke('cmd-d', document.activeElement);
              return ensure('U', {
                text: "OOO: xxx: OOO: 0000\n1: ooo: 22: ooo:\nooo: xxx: |||: xxx: 3333:\n444: |||: ooo: ooo:"
              });
            });
          });
        });
        describe("visual linewise", function() {
          return it("change occurrence in narrowed selection", function() {
            keystroke('V j /');
            searchEditor.insertText('o+');
            return withMockPlatform(searchEditorElement, 'platform-darwin', function() {
              rawKeystroke('cmd-d', document.activeElement);
              return ensure('U', {
                text: "OOO: xxx: OOO: 0000\n1: OOO: 22: OOO:\nooo: xxx: |||: xxx: 3333:\n444: |||: ooo: ooo:"
              });
            });
          });
        });
        return describe("visual blockwise", function() {
          return it("change occurrence in narrowed selection", function() {
            set({
              cursor: [0, 5]
            });
            keystroke('ctrl-v 2 j 1 0 l /');
            searchEditor.insertText('o+');
            return withMockPlatform(searchEditorElement, 'platform-darwin', function() {
              rawKeystroke('cmd-d', document.activeElement);
              return ensure('U', {
                text: "ooo: xxx: OOO: 0000\n1: OOO: 22: OOO:\nooo: xxx: |||: xxx: 3333:\n444: |||: ooo: ooo:"
              });
            });
          });
        });
      });
      describe("persistent-selection is exists", function() {
        var persistentSelectionBufferRange;
        persistentSelectionBufferRange = null;
        beforeEach(function() {
          atom.keymaps.add("create-persistent-selection", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              'm': 'vim-mode-plus:create-persistent-selection'
            }
          });
          set({
            text: "ooo: xxx: ooo:\n|||: ooo: xxx: ooo:\nooo: xxx: |||: xxx: ooo:\nxxx: |||: ooo: ooo:\n",
            cursor: [0, 0]
          });
          persistentSelectionBufferRange = [[[0, 0], [2, 0]], [[3, 0], [4, 0]]];
          return ensure('V j m G m m', {
            persistentSelectionBufferRange: persistentSelectionBufferRange
          });
        });
        describe("when no selection is exists", function() {
          return it("select occurrence in all persistent-selection", function() {
            set({
              cursor: [0, 0]
            });
            keystroke('/');
            searchEditor.insertText('xxx');
            return withMockPlatform(searchEditorElement, 'platform-darwin', function() {
              rawKeystroke('cmd-d', document.activeElement);
              return ensure('U', {
                text: "ooo: XXX: ooo:\n|||: ooo: XXX: ooo:\nooo: xxx: |||: xxx: ooo:\nXXX: |||: ooo: ooo:\n",
                persistentSelectionCount: 0
              });
            });
          });
        });
        return describe("when both exits, operator applied to both", function() {
          return it("select all occurrence in selection", function() {
            set({
              cursor: [0, 0]
            });
            keystroke('V 2 j /');
            searchEditor.insertText('xxx');
            return withMockPlatform(searchEditorElement, 'platform-darwin', function() {
              rawKeystroke('cmd-d', document.activeElement);
              return ensure('U', {
                text: "ooo: XXX: ooo:\n|||: ooo: XXX: ooo:\nooo: XXX: |||: XXX: ooo:\nXXX: |||: ooo: ooo:\n",
                persistentSelectionCount: 0
              });
            });
          });
        });
      });
      return describe("demonstrate persistent-selection's practical scenario", function() {
        var oldGrammar;
        oldGrammar = [][0];
        afterEach(function() {
          return editor.setGrammar(oldGrammar);
        });
        beforeEach(function() {
          atom.keymaps.add("create-persistent-selection", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              'm': 'vim-mode-plus:toggle-persistent-selection'
            }
          });
          waitsForPromise(function() {
            return atom.packages.activatePackage('language-coffee-script');
          });
          runs(function() {
            oldGrammar = editor.getGrammar();
            return editor.setGrammar(atom.grammars.grammarForScopeName('source.coffee'));
          });
          return set({
            text: "constructor: (@main, @editor, @statusBarManager) ->\n  @editorElement = @editor.element\n  @emitter = new Emitter\n  @subscriptions = new CompositeDisposable\n  @modeManager = new ModeManager(this)\n  @mark = new MarkManager(this)\n  @register = new RegisterManager(this)\n  @persistentSelections = []\n\n  @highlightSearchSubscription = @editorElement.onDidChangeScrollTop =>\n    @refreshHighlightSearch()\n\n  @operationStack = new OperationStack(this)\n  @cursorStyleManager = new CursorStyleManager(this)\n\nanotherFunc: ->\n  @hello = []"
          });
        });
        return it('change all assignment("=") of current-function to "?="', function() {
          set({
            cursor: [0, 0]
          });
          ensure([
            'j f', {
              input: '='
            }
          ], {
            cursor: [1, 17]
          });
          runs(function() {
            return withMockPlatform(searchEditorElement, 'platform-darwin', function() {
              var textsInBufferRange, textsInBufferRangeIsAllEqualChar;
              keystroke(['g cmd-d', 'i f', 'm'].join(" "));
              textsInBufferRange = vimState.persistentSelection.getMarkerBufferRanges().map(function(range) {
                return editor.getTextInBufferRange(range);
              });
              textsInBufferRangeIsAllEqualChar = textsInBufferRange.every(function(text) {
                return text === '=';
              });
              expect(textsInBufferRangeIsAllEqualChar).toBe(true);
              expect(vimState.persistentSelection.getMarkers()).toHaveLength(11);
              keystroke('2 l');
              ensure([
                '/', {
                  search: '=>'
                }
              ], {
                cursor: [9, 69]
              });
              keystroke("m");
              return expect(vimState.persistentSelection.getMarkers()).toHaveLength(10);
            });
          });
          waitsFor(function() {
            return editorElement.classList.contains('has-persistent-selection');
          });
          return runs(function() {
            return withMockPlatform(searchEditorElement, 'platform-darwin', function() {
              keystroke(['ctrl-cmd-g', 'I']);
              editor.insertText('?');
              return ensure('escape', {
                text: "constructor: (@main, @editor, @statusBarManager) ->\n  @editorElement ?= @editor.element\n  @emitter ?= new Emitter\n  @subscriptions ?= new CompositeDisposable\n  @modeManager ?= new ModeManager(this)\n  @mark ?= new MarkManager(this)\n  @register ?= new RegisterManager(this)\n  @persistentSelections ?= []\n\n  @highlightSearchSubscription ?= @editorElement.onDidChangeScrollTop =>\n    @refreshHighlightSearch()\n\n  @operationStack ?= new OperationStack(this)\n  @cursorStyleManager ?= new CursorStyleManager(this)\n\nanotherFunc: ->\n  @hello = []"
              });
            });
          });
        });
      });
    });
    return describe("preset occurrence marker", function() {
      beforeEach(function() {
        jasmine.attachToDOM(getView(atom.workspace));
        return set({
          text: "This text have 3 instance of 'text' in the whole text",
          cursor: [0, 0]
        });
      });
      describe("toggle-preset-occurrence commands", function() {
        describe("in normal-mode", function() {
          describe("add preset occurrence", function() {
            return it('set cursor-ward as preset occurrence marker and not move cursor', function() {
              ensure('g o', {
                occurrenceCount: 1,
                occurrenceText: 'This',
                cursor: [0, 0]
              });
              ensure('w', {
                cursor: [0, 5]
              });
              return ensure('g o', {
                occurrenceCount: 4,
                occurrenceText: ['This', 'text', 'text', 'text'],
                cursor: [0, 5]
              });
            });
          });
          describe("remove preset occurrence", function() {
            it('removes occurrence one by one separately', function() {
              ensure('g o', {
                occurrenceCount: 1,
                occurrenceText: 'This',
                cursor: [0, 0]
              });
              ensure('w', {
                cursor: [0, 5]
              });
              ensure('g o', {
                occurrenceCount: 4,
                occurrenceText: ['This', 'text', 'text', 'text'],
                cursor: [0, 5]
              });
              ensure('g o', {
                occurrenceCount: 3,
                occurrenceText: ['This', 'text', 'text'],
                cursor: [0, 5]
              });
              return ensure('b g o', {
                occurrenceCount: 2,
                occurrenceText: ['text', 'text'],
                cursor: [0, 0]
              });
            });
            return it('removes all occurrence in this editor by escape', function() {
              ensure('g o', {
                occurrenceCount: 1,
                occurrenceText: 'This',
                cursor: [0, 0]
              });
              ensure('w', {
                cursor: [0, 5]
              });
              ensure('g o', {
                occurrenceCount: 4,
                occurrenceText: ['This', 'text', 'text', 'text'],
                cursor: [0, 5]
              });
              return ensure('escape', {
                occurrenceCount: 0
              });
            });
          });
          return describe("css class has-occurrence", function() {
            var classList, ref2, update;
            ref2 = [], classList = ref2[0], update = ref2[1];
            beforeEach(function() {
              return vimState.occurrenceManager.markerLayer.onDidUpdate(update = jasmine.createSpy());
            });
            return it('is auto-set/unset wheter at least one preset-occurrence was exists or not', function() {
              runs(function() {
                expect(editorElement.classList.contains('has-occurrence')).toBe(false);
                return ensure('g o', {
                  occurrenceCount: 1,
                  occurrenceText: 'This',
                  cursor: [0, 0]
                });
              });
              waitsFor(function() {
                return update.callCount === 1;
              });
              runs(function() {
                expect(editorElement.classList.contains('has-occurrence')).toBe(true);
                return ensure('g o', {
                  occurrenceCount: 0,
                  cursor: [0, 0]
                });
              });
              waitsFor(function() {
                return update.callCount === 2;
              });
              return runs(function() {
                return expect(editorElement.classList.contains('has-occurrence')).toBe(false);
              });
            });
          });
        });
        describe("in visual-mode", function() {
          describe("add preset occurrence", function() {
            return it('set selected-text as preset occurrence marker and not move cursor', function() {
              ensure('w v l', {
                mode: ['visual', 'characterwise'],
                selectedText: 'te'
              });
              return ensure('g o', {
                mode: 'normal',
                occurrenceText: ['te', 'te', 'te']
              });
            });
          });
          return describe("is-narrowed selection", function() {
            var textOriginal;
            textOriginal = [][0];
            beforeEach(function() {
              textOriginal = "This text have 3 instance of 'text' in the whole text\nThis text have 3 instance of 'text' in the whole text\n";
              return set({
                cursor: [0, 0],
                text: textOriginal
              });
            });
            return it("pick ocurrence-word from cursor position and continue visual-mode", function() {
              ensure('w V j', {
                mode: ['visual', 'linewise'],
                selectedText: textOriginal
              });
              ensure('g o', {
                mode: ['visual', 'linewise'],
                selectedText: textOriginal,
                occurrenceText: ['text', 'text', 'text', 'text', 'text', 'text']
              });
              return ensure([
                'r', {
                  input: '!'
                }
              ], {
                mode: 'normal',
                text: "This !!!! have 3 instance of '!!!!' in the whole !!!!\nThis !!!! have 3 instance of '!!!!' in the whole !!!!\n"
              });
            });
          });
        });
        return describe("in incremental-search", function() {
          var ref2, searchEditor, searchEditorElement;
          ref2 = [], searchEditor = ref2[0], searchEditorElement = ref2[1];
          beforeEach(function() {
            searchEditor = vimState.searchInput.editor;
            searchEditorElement = searchEditor.element;
            jasmine.attachToDOM(getView(atom.workspace));
            return settings.set('incrementalSearch', true);
          });
          return describe("add-occurrence-pattern-from-search", function() {
            return it('mark as occurrence which matches regex entered in search-ui', function() {
              keystroke('/');
              searchEditor.insertText('\\bt\\w+');
              return withMockPlatform(searchEditorElement, 'platform-darwin', function() {
                rawKeystroke('cmd-o', document.activeElement);
                return ensure({
                  occurrenceText: ['text', 'text', 'the', 'text']
                });
              });
            });
          });
        });
      });
      describe("mutate preset occurence", function() {
        beforeEach(function() {
          set({
            text: "ooo: xxx: ooo xxx: ooo:\n!!!: ooo: xxx: ooo xxx: ooo:"
          });
          ({
            cursor: [0, 0]
          });
          return jasmine.attachToDOM(getView(atom.workspace));
        });
        describe("normal-mode", function() {
          it('[delete] apply operation to preset-marker intersecting selected target', function() {
            return ensure('l g o D', {
              text: ": xxx:  xxx: :\n!!!: ooo: xxx: ooo xxx: ooo:"
            });
          });
          it('[upcase] apply operation to preset-marker intersecting selected target', function() {
            set({
              cursor: [0, 6]
            });
            return ensure('l g o g U j', {
              text: "ooo: XXX: ooo XXX: ooo:\n!!!: ooo: XXX: ooo XXX: ooo:"
            });
          });
          it('[upcase exclude] won\'t mutate removed marker', function() {
            set({
              cursor: [0, 0]
            });
            ensure('g o', {
              occurrenceCount: 6
            });
            ensure('g o', {
              occurrenceCount: 5
            });
            return ensure('g U j', {
              text: "ooo: xxx: OOO xxx: OOO:\n!!!: OOO: xxx: OOO xxx: OOO:"
            });
          });
          it('[delete] apply operation to preset-marker intersecting selected target', function() {
            set({
              cursor: [0, 10]
            });
            return ensure('g o g U $', {
              text: "ooo: xxx: OOO xxx: OOO:\n!!!: ooo: xxx: ooo xxx: ooo:"
            });
          });
          it('[change] apply operation to preset-marker intersecting selected target', function() {
            ensure('l g o C', {
              mode: 'insert',
              text: ": xxx:  xxx: :\n!!!: ooo: xxx: ooo xxx: ooo:"
            });
            editor.insertText('YYY');
            return ensure('l g o C', {
              mode: 'insert',
              text: "YYY: xxx: YYY xxx: YYY:\n!!!: ooo: xxx: ooo xxx: ooo:",
              numCursors: 3
            });
          });
          return describe("predefined keymap on when has-occurrence", function() {
            beforeEach(function() {
              return set({
                text: "Vim is editor I used before\nVim is editor I used before\nVim is editor I used before\nVim is editor I used before"
              });
            });
            it('[insert-at-start] apply operation to preset-marker intersecting selected target', function() {
              set({
                cursor: [1, 1]
              });
              runs(function() {
                return ensure('g o', {
                  occurrenceText: ['Vim', 'Vim', 'Vim', 'Vim']
                });
              });
              waitsFor(function() {
                return editorElement.classList.contains('has-occurrence');
              });
              return runs(function() {
                ensure('I k', {
                  mode: 'insert',
                  numCursors: 2
                });
                editor.insertText("pure-");
                return ensure('escape', {
                  mode: 'normal',
                  text: "pure-Vim is editor I used before\npure-Vim is editor I used before\nVim is editor I used before\nVim is editor I used before"
                });
              });
            });
            return it('[insert-after-start] apply operation to preset-marker intersecting selected target', function() {
              set({
                cursor: [1, 1]
              });
              runs(function() {
                return ensure('g o', {
                  occurrenceText: ['Vim', 'Vim', 'Vim', 'Vim']
                });
              });
              waitsFor(function() {
                return editorElement.classList.contains('has-occurrence');
              });
              return runs(function() {
                ensure('A j', {
                  mode: 'insert',
                  numCursors: 2
                });
                editor.insertText(" and Emacs");
                return ensure('escape', {
                  mode: 'normal',
                  text: "Vim is editor I used before\nVim and Emacs is editor I used before\nVim and Emacs is editor I used before\nVim is editor I used before"
                });
              });
            });
          });
        });
        describe("visual-mode", function() {
          return it('[upcase] apply to preset-marker as long as it intersects selection', function() {
            set({
              cursor: [0, 6],
              text: "ooo: xxx: ooo xxx: ooo:\nxxx: ooo: xxx: ooo xxx: ooo:"
            });
            ensure('g o', {
              occurrenceCount: 5
            });
            return ensure('v j U', {
              text: "ooo: XXX: ooo XXX: ooo:\nXXX: ooo: xxx: ooo xxx: ooo:"
            });
          });
        });
        describe("visual-linewise-mode", function() {
          return it('[upcase] apply to preset-marker as long as it intersects selection', function() {
            set({
              cursor: [0, 6],
              text: "ooo: xxx: ooo xxx: ooo:\nxxx: ooo: xxx: ooo xxx: ooo:"
            });
            ensure('g o', {
              occurrenceCount: 5
            });
            return ensure('V U', {
              text: "ooo: XXX: ooo XXX: ooo:\nxxx: ooo: xxx: ooo xxx: ooo:"
            });
          });
        });
        return describe("visual-blockwise-mode", function() {
          return it('[upcase] apply to preset-marker as long as it intersects selection', function() {
            set({
              cursor: [0, 6],
              text: "ooo: xxx: ooo xxx: ooo:\nxxx: ooo: xxx: ooo xxx: ooo:"
            });
            ensure('g o', {
              occurrenceCount: 5
            });
            return ensure('ctrl-v j 2 w U', {
              text: "ooo: XXX: ooo xxx: ooo:\nxxx: ooo: XXX: ooo xxx: ooo:"
            });
          });
        });
      });
      return describe("explict operator-modifier o and preset-marker", function() {
        beforeEach(function() {
          return set({
            text: "ooo: xxx: ooo xxx: ooo:\n!!!: ooo: xxx: ooo xxx: ooo:",
            cursor: [0, 0]
          }, jasmine.attachToDOM(getView(atom.workspace)));
        });
        describe("'o' modifier when preset occurrence already exists", function() {
          return it("'o' always pick cursor-word and overwrite existing preset marker)", function() {
            ensure("g o", {
              occurrenceText: ["ooo", "ooo", "ooo", "ooo", "ooo", "ooo"]
            });
            ensure("2 w d o", {
              occurrenceText: ["xxx", "xxx", "xxx", "xxx"],
              mode: 'operator-pending'
            });
            return ensure("j", {
              text: "ooo: : ooo : ooo:\n!!!: ooo: : ooo : ooo:",
              mode: 'normal'
            });
          });
        });
        return describe("occurrence bound operator don't overwite pre-existing preset marker", function() {
          return it("'o' always pick cursor-word and clear existing preset marker", function() {
            ensure("g o", {
              occurrenceText: ["ooo", "ooo", "ooo", "ooo", "ooo", "ooo"]
            });
            ensure("2 w g cmd-d", {
              occurrenceText: ["ooo", "ooo", "ooo", "ooo", "ooo", "ooo"],
              mode: 'operator-pending'
            });
            return ensure("j", {
              selectedText: ["ooo", "ooo", "ooo", "ooo", "ooo", "ooo"]
            });
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL29jY3VycmVuY2Utc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQTZFLE9BQUEsQ0FBUSxlQUFSLENBQTdFLEVBQUMsNkJBQUQsRUFBYyx1QkFBZCxFQUF3Qix1QkFBeEIsRUFBa0MscUJBQWxDLEVBQTJDLHVDQUEzQyxFQUE2RDs7RUFDN0QsUUFBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7RUFFWCxRQUFBLENBQVMsWUFBVCxFQUF1QixTQUFBO0FBQ3JCLFFBQUE7SUFBQSxPQUE0RCxFQUE1RCxFQUFDLGFBQUQsRUFBTSxnQkFBTixFQUFjLG1CQUFkLEVBQXlCLGdCQUF6QixFQUFpQyx1QkFBakMsRUFBZ0Q7SUFFaEQsVUFBQSxDQUFXLFNBQUE7TUFDVCxXQUFBLENBQVksU0FBQyxLQUFELEVBQVEsR0FBUjtRQUNWLFFBQUEsR0FBVztRQUNWLHdCQUFELEVBQVM7ZUFDUixhQUFELEVBQU0sbUJBQU4sRUFBYyx5QkFBZCxFQUEyQjtNQUhqQixDQUFaO2FBS0EsSUFBQSxDQUFLLFNBQUE7ZUFDSCxPQUFPLENBQUMsV0FBUixDQUFvQixhQUFwQjtNQURHLENBQUw7SUFOUyxDQUFYO0lBU0EsU0FBQSxDQUFVLFNBQUE7YUFDUixRQUFRLENBQUMsZUFBVCxDQUFBO0lBRFEsQ0FBVjtJQUdBLFFBQUEsQ0FBUyw4QkFBVCxFQUF5QyxTQUFBO01BQ3ZDLFVBQUEsQ0FBVyxTQUFBO2VBQ1QsR0FBQSxDQUNFO1VBQUEsSUFBQSxFQUFNLDhLQUFOO1NBREY7TUFEUyxDQUFYO01BZ0JBLFFBQUEsQ0FBUyxpQ0FBVCxFQUE0QyxTQUFBO2VBQzFDLEVBQUEsQ0FBRyxxREFBSCxFQUEwRCxTQUFBO1VBQ3hELEdBQUEsQ0FBSTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFK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aCwgVGV4dERhdGEsIGdldFZpZXcsIHdpdGhNb2NrUGxhdGZvcm0sIHJhd0tleXN0cm9rZX0gPSByZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuLi9saWIvc2V0dGluZ3MnXG5cbmRlc2NyaWJlIFwiT2NjdXJyZW5jZVwiLCAtPlxuICBbc2V0LCBlbnN1cmUsIGtleXN0cm9rZSwgZWRpdG9yLCBlZGl0b3JFbGVtZW50LCB2aW1TdGF0ZV0gPSBbXVxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICBnZXRWaW1TdGF0ZSAoc3RhdGUsIHZpbSkgLT5cbiAgICAgIHZpbVN0YXRlID0gc3RhdGVcbiAgICAgIHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9ID0gdmltU3RhdGVcbiAgICAgIHtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlfSA9IHZpbVxuXG4gICAgcnVucyAtPlxuICAgICAgamFzbWluZS5hdHRhY2hUb0RPTShlZGl0b3JFbGVtZW50KVxuXG4gIGFmdGVyRWFjaCAtPlxuICAgIHZpbVN0YXRlLnJlc2V0Tm9ybWFsTW9kZSgpXG5cbiAgZGVzY3JpYmUgXCJvcGVyYXRvci1tb2RpZmllci1vY2N1cnJlbmNlXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuXG4gICAgICAgIG9vbzogeHh4OiBvb286XG4gICAgICAgIHx8fDogb29vOiB4eHg6IG9vbzpcbiAgICAgICAgb29vOiB4eHg6IHx8fDogeHh4OiBvb286XG4gICAgICAgIHh4eDogfHx8OiBvb286IG9vbzpcblxuICAgICAgICBvb286IHh4eDogb29vOlxuICAgICAgICB8fHw6IG9vbzogeHh4OiBvb286XG4gICAgICAgIG9vbzogeHh4OiB8fHw6IHh4eDogb29vOlxuICAgICAgICB4eHg6IHx8fDogb29vOiBvb286XG5cbiAgICAgICAgXCJcIlwiXG5cbiAgICBkZXNjcmliZSBcIm9wZXJhdG9yLW1vZGlmaWVyLWNoYXJhY3Rlcndpc2VcIiwgLT5cbiAgICAgIGl0IFwiY2hhbmdlIG9jY3VycmVuY2Ugb2YgY3Vyc29yIHdvcmQgaW4gaW5uZXItcGFyYWdyYXBoXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBlbnN1cmUgXCJjIG8gaSBwXCIsXG4gICAgICAgICAgbW9kZTogJ2luc2VydCdcbiAgICAgICAgICBudW1DdXJzb3JzOiA4XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG5cbiAgICAgICAgICA6IHh4eDogOlxuICAgICAgICAgIHx8fDogOiB4eHg6IDpcbiAgICAgICAgICA6IHh4eDogfHx8OiB4eHg6IDpcbiAgICAgICAgICB4eHg6IHx8fDogOiA6XG5cbiAgICAgICAgICBvb286IHh4eDogb29vOlxuICAgICAgICAgIHx8fDogb29vOiB4eHg6IG9vbzpcbiAgICAgICAgICBvb286IHh4eDogfHx8OiB4eHg6IG9vbzpcbiAgICAgICAgICB4eHg6IHx8fDogb29vOiBvb286XG5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZWRpdG9yLmluc2VydFRleHQoJyEhIScpXG4gICAgICAgIGVuc3VyZSBcImVzY2FwZVwiLFxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgbnVtQ3Vyc29yczogOFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuXG4gICAgICAgICAgISEhOiB4eHg6ICEhITpcbiAgICAgICAgICB8fHw6ICEhITogeHh4OiAhISE6XG4gICAgICAgICAgISEhOiB4eHg6IHx8fDogeHh4OiAhISE6XG4gICAgICAgICAgeHh4OiB8fHw6ICEhITogISEhOlxuXG4gICAgICAgICAgb29vOiB4eHg6IG9vbzpcbiAgICAgICAgICB8fHw6IG9vbzogeHh4OiBvb286XG4gICAgICAgICAgb29vOiB4eHg6IHx8fDogeHh4OiBvb286XG4gICAgICAgICAgeHh4OiB8fHw6IG9vbzogb29vOlxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGVuc3VyZSBcIn0gaiAuXCIsXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICBudW1DdXJzb3JzOiA4XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG5cbiAgICAgICAgICAhISE6IHh4eDogISEhOlxuICAgICAgICAgIHx8fDogISEhOiB4eHg6ICEhITpcbiAgICAgICAgICAhISE6IHh4eDogfHx8OiB4eHg6ICEhITpcbiAgICAgICAgICB4eHg6IHx8fDogISEhOiAhISE6XG5cbiAgICAgICAgICAhISE6IHh4eDogISEhOlxuICAgICAgICAgIHx8fDogISEhOiB4eHg6ICEhITpcbiAgICAgICAgICAhISE6IHh4eDogfHx8OiB4eHg6ICEhITpcbiAgICAgICAgICB4eHg6IHx8fDogISEhOiAhISE6XG5cbiAgICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwiYXBwbHkgdmFyaW91cyBvcGVyYXRvciB0byBvY2N1cnJlbmNlIGluIHZhcmlvdXMgdGFyZ2V0XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIG9vbzogeHh4OiBvb286XG4gICAgICAgICAgfHx8OiBvb286IHh4eDogb29vOlxuICAgICAgICAgIG9vbzogeHh4OiB8fHw6IHh4eDogb29vOlxuICAgICAgICAgIHh4eDogfHx8OiBvb286IG9vbzpcbiAgICAgICAgICBcIlwiXCJcbiAgICAgIGl0IFwidXBwZXIgY2FzZSBpbm5lci13b3JkXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAxMV1cbiAgICAgICAgZW5zdXJlIFwiZyBVIG8gaSBsXCIsIC0+XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgT09POiB4eHg6IE9PTzpcbiAgICAgICAgICB8fHw6IG9vbzogeHh4OiBvb286XG4gICAgICAgICAgb29vOiB4eHg6IHx8fDogeHh4OiBvb286XG4gICAgICAgICAgeHh4OiB8fHw6IG9vbzogb29vOlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSBcIjIgaiAuXCIsIC0+XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgT09POiB4eHg6IE9PTzpcbiAgICAgICAgICB8fHw6IG9vbzogeHh4OiBvb286XG4gICAgICAgICAgT09POiB4eHg6IHx8fDogeHh4OiBPT086XG4gICAgICAgICAgeHh4OiB8fHw6IG9vbzogb29vOlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGVuc3VyZSBcImogLlwiLCAtPlxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIE9PTzogeHh4OiBPT086XG4gICAgICAgICAgfHx8OiBvb286IHh4eDogb29vOlxuICAgICAgICAgIE9PTzogeHh4OiB8fHw6IHh4eDogT09POlxuICAgICAgICAgIHh4eDogfHx8OiBPT086IE9PTzpcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFsyLCAwXVxuICAgICAgaXQgXCJsb3dlciBjYXNlIHdpdGggbW90aW9uXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIE9PTzogWFhYOiBPT086XG4gICAgICAgICAgfHx8OiBPT086IFhYWDogT09POlxuICAgICAgICAgIE9PTzogWFhYOiB8fHw6IFhYWDogT09POlxuICAgICAgICAgIFhYWDogfHx8OiBPT086IE9PTzpcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCA2XVxuICAgICAgICBlbnN1cmUgXCJnIHUgbyAyIGpcIiwgIyBsb3dlcmNhc2UgeHh4IG9ubHlcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBPT086IHh4eDogT09POlxuICAgICAgICAgIHx8fDogT09POiB4eHg6IE9PTzpcbiAgICAgICAgICBPT086IHh4eDogfHx8OiB4eHg6IE9PTzpcbiAgICAgICAgICBYWFg6IHx8fDogT09POiBPT086XG4gICAgICAgICAgXCJcIlwiXG5cbiAgICBkZXNjcmliZSBcImF1dG8gZXh0ZW5kIHRhcmdldCByYW5nZSB0byBpbmNsdWRlIG9jY3VycmVuY2VcIiwgLT5cbiAgICAgIHRleHRPcmlnaW5hbCA9IFwiVGhpcyB0ZXh0IGhhdmUgMyBpbnN0YW5jZSBvZiAndGV4dCcgaW4gdGhlIHdob2xlIHRleHQuXFxuXCJcbiAgICAgIHRleHRGaW5hbCA9IHRleHRPcmlnaW5hbC5yZXBsYWNlKC90ZXh0L2csICcnKVxuXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiB0ZXh0T3JpZ2luYWxcblxuICAgICAgaXQgXCJbZnJvbSBzdGFydCBvZiAxc3RdXCIsIC0+IHNldCBjdXJzb3I6IFswLCA1XTsgZW5zdXJlICdkIG8gJCcsIHRleHQ6IHRleHRGaW5hbFxuICAgICAgaXQgXCJbZnJvbSBtaWRkbGUgb2YgMXN0XVwiLCAtPiBzZXQgY3Vyc29yOiBbMCwgN107IGVuc3VyZSAnZCBvICQnLCB0ZXh0OiB0ZXh0RmluYWxcbiAgICAgIGl0IFwiW2Zyb20gZW5kIG9mIGxhc3RdXCIsIC0+IHNldCBjdXJzb3I6IFswLCA1Ml07IGVuc3VyZSAnZCBvIDAnLCB0ZXh0OiB0ZXh0RmluYWxcbiAgICAgIGl0IFwiW2Zyb20gbWlkZGxlIG9mIGxhc3RdXCIsIC0+IHNldCBjdXJzb3I6IFswLCA1MV07IGVuc3VyZSAnZCBvIDAnLCB0ZXh0OiB0ZXh0RmluYWxcblxuICAgIGRlc2NyaWJlIFwic2VsZWN0LW9jY3VycmVuY2VcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgdmltLW1vZGUtcGx1cyB2aW0tbW9kZS1wbHVzXG4gICAgICAgICAgXCJcIlwiXG4gICAgICBkZXNjcmliZSBcIndoYXQgdGhlIGN1cnNvci13b3JkXCIsIC0+XG4gICAgICAgIGVuc3VyZUN1cnNvcldvcmQgPSAoaW5pdGlhbFBvaW50LCB7c2VsZWN0ZWRUZXh0fSkgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBpbml0aWFsUG9pbnRcbiAgICAgICAgICBlbnN1cmUgXCJnIGNtZC1kIGkgcFwiLFxuICAgICAgICAgICAgc2VsZWN0ZWRUZXh0OiBzZWxlY3RlZFRleHRcbiAgICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgICAgIGVuc3VyZSBcImVzY2FwZVwiLCBtb2RlOiBcIm5vcm1hbFwiXG5cbiAgICAgICAgZGVzY3JpYmUgXCJjdXJzb3IgaXMgb24gbm9ybWFsIHdvcmRcIiwgLT5cbiAgICAgICAgICBpdCBcInBpY2sgd29yZCBidXQgbm90IHBpY2sgcGFydGlhbGx5IG1hdGNoZWQgb25lIFtieSBzZWxlY3RdXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmVDdXJzb3JXb3JkKFswLCAwXSwgc2VsZWN0ZWRUZXh0OiBbJ3ZpbScsICd2aW0nXSlcbiAgICAgICAgICAgIGVuc3VyZUN1cnNvcldvcmQoWzAsIDNdLCBzZWxlY3RlZFRleHQ6IFsnLScsICctJywgJy0nLCAnLSddKVxuICAgICAgICAgICAgZW5zdXJlQ3Vyc29yV29yZChbMCwgNF0sIHNlbGVjdGVkVGV4dDogWydtb2RlJywgJ21vZGUnXSlcbiAgICAgICAgICAgIGVuc3VyZUN1cnNvcldvcmQoWzAsIDldLCBzZWxlY3RlZFRleHQ6IFsncGx1cycsICdwbHVzJ10pXG5cbiAgICAgICAgZGVzY3JpYmUgXCJjdXJzb3IgaXMgYXQgc2luZ2xlIHdoaXRlIHNwYWNlIFtieSBkZWxldGVdXCIsIC0+XG4gICAgICAgICAgaXQgXCJwaWNrIHNpbmdsZSB3aGl0ZSBzcGFjZSBvbmx5XCIsIC0+XG4gICAgICAgICAgICBzZXRcbiAgICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIG9vbyBvb28gb29vXG4gICAgICAgICAgICAgICBvb28gb29vIG9vb1xuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgICAgY3Vyc29yOiBbMCwgM11cbiAgICAgICAgICAgIGVuc3VyZSBcImQgbyBpIHBcIixcbiAgICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIG9vb29vb29vb1xuICAgICAgICAgICAgICBvb29vb29vb29cbiAgICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgZGVzY3JpYmUgXCJjdXJzb3IgaXMgYXQgc2VxdW5jZSBvZiBzcGFjZSBbYnkgZGVsZXRlXVwiLCAtPlxuICAgICAgICAgIGl0IFwic2VsZWN0IHNlcXVuY2Ugb2Ygd2hpdGUgc3BhY2VzIGluY2x1ZGluZyBwYXJ0aWFsbHkgbWFjaGVkIG9uZVwiLCAtPlxuICAgICAgICAgICAgc2V0XG4gICAgICAgICAgICAgIGN1cnNvcjogWzAsIDNdXG4gICAgICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICAgICAgb29vX19fb29vIG9vb1xuICAgICAgICAgICAgICAgb29vIG9vb19fX19vb29fX19fX19fX29vb1xuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIGVuc3VyZSBcImQgbyBpIHBcIixcbiAgICAgICAgICAgICAgdGV4dF86IFwiXCJcIlxuICAgICAgICAgICAgICBvb29vb28gb29vXG4gICAgICAgICAgICAgICBvb28gb29vIG9vbyAgb29vXG4gICAgICAgICAgICAgIFwiXCJcIlxuXG4gIGRlc2NyaWJlIFwiZnJvbSB2aXN1YWwtbW9kZS5pcy1uYXJyb3dlZFwiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgb29vOiB4eHg6IG9vbzpcbiAgICAgICAgfHx8OiBvb286IHh4eDogb29vOlxuICAgICAgICBvb286IHh4eDogfHx8OiB4eHg6IG9vbzpcbiAgICAgICAgeHh4OiB8fHw6IG9vbzogb29vOlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwiW3ZDXSBzZWxlY3Qtb2NjdXJyZW5jZVwiLCAtPlxuICAgICAgaXQgXCJzZWxlY3QgY3Vyc29yLXdvcmQgd2hpY2ggaW50ZXJzZWN0aW5nIHNlbGVjdGlvbiB0aGVuIGFwcGx5IHVwcGVyLWNhc2VcIiwgLT5cbiAgICAgICAgZW5zdXJlIFwidiAyIGogY21kLWQgVVwiLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIE9PTzogeHh4OiBPT086XG4gICAgICAgICAgfHx8OiBPT086IHh4eDogT09POlxuICAgICAgICAgIE9PTzogeHh4OiB8fHw6IHh4eDogb29vOlxuICAgICAgICAgIHh4eDogfHx8OiBvb286IG9vbzpcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBudW1DdXJzb3JzOiA1XG5cbiAgICBkZXNjcmliZSBcIlt2TF0gc2VsZWN0LW9jY3VycmVuY2VcIiwgLT5cbiAgICAgIGl0IFwic2VsZWN0IGN1cnNvci13b3JkIHdoaWNoIGludGVyc2VjdGluZyBzZWxlY3Rpb24gdGhlbiBhcHBseSB1cHBlci1jYXNlXCIsIC0+XG4gICAgICAgIGVuc3VyZSBcIjUgbCBWIDIgaiBjbWQtZCBVXCIsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgb29vOiBYWFg6IG9vbzpcbiAgICAgICAgICB8fHw6IG9vbzogWFhYOiBvb286XG4gICAgICAgICAgb29vOiBYWFg6IHx8fDogWFhYOiBvb286XG4gICAgICAgICAgeHh4OiB8fHw6IG9vbzogb29vOlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIG51bUN1cnNvcnM6IDRcblxuICAgIGRlc2NyaWJlIFwiW3ZCXSBzZWxlY3Qtb2NjdXJyZW5jZVwiLCAtPlxuICAgICAgaXQgXCJzZWxlY3QgY3Vyc29yLXdvcmQgd2hpY2ggaW50ZXJzZWN0aW5nIHNlbGVjdGlvbiB0aGVuIGFwcGx5IHVwcGVyLWNhc2VcIiwgLT5cbiAgICAgICAgZW5zdXJlIFwiVyBjdHJsLXYgMiBqICQgaCBjbWQtZCBVXCIsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgb29vOiB4eHg6IE9PTzpcbiAgICAgICAgICB8fHw6IE9PTzogeHh4OiBPT086XG4gICAgICAgICAgb29vOiB4eHg6IHx8fDogeHh4OiBPT086XG4gICAgICAgICAgeHh4OiB8fHw6IG9vbzogb29vOlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIG51bUN1cnNvcnM6IDRcblxuICAgICAgaXQgXCJwaWNrIGN1cnNvci13b3JkIGZyb20gdkIgcmFuZ2VcIiwgLT5cbiAgICAgICAgZW5zdXJlIFwiY3RybC12IDcgbCAyIGogbyBjbWQtZCBVXCIsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgT09POiB4eHg6IG9vbzpcbiAgICAgICAgICB8fHw6IE9PTzogeHh4OiBvb286XG4gICAgICAgICAgT09POiB4eHg6IHx8fDogeHh4OiBvb286XG4gICAgICAgICAgeHh4OiB8fHw6IG9vbzogb29vOlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIG51bUN1cnNvcnM6IDNcblxuICBkZXNjcmliZSBcImluY3JlbWVudGFsIHNlYXJjaCBpbnRlZ3JhdGlvbjogY2hhbmdlLW9jY3VycmVuY2UtZnJvbS1zZWFyY2gsIHNlbGVjdC1vY2N1cnJlbmNlLWZyb20tc2VhcmNoXCIsIC0+XG4gICAgW3NlYXJjaEVkaXRvciwgc2VhcmNoRWRpdG9yRWxlbWVudF0gPSBbXVxuXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2VhcmNoRWRpdG9yID0gdmltU3RhdGUuc2VhcmNoSW5wdXQuZWRpdG9yXG4gICAgICBzZWFyY2hFZGl0b3JFbGVtZW50ID0gc2VhcmNoRWRpdG9yLmVsZW1lbnRcbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00oZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkpXG4gICAgICBzZXR0aW5ncy5zZXQoJ2luY3JlbWVudGFsU2VhcmNoJywgdHJ1ZSlcbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgb29vOiB4eHg6IG9vbzogMDAwMFxuICAgICAgICAxOiBvb286IDIyOiBvb286XG4gICAgICAgIG9vbzogeHh4OiB8fHw6IHh4eDogMzMzMzpcbiAgICAgICAgNDQ0OiB8fHw6IG9vbzogb29vOlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwiZnJvbSBub3JtYWwgbW9kZVwiLCAtPlxuICAgICAgaXQgXCJzZWxlY3Qgb2NjdXJyZW5jZSBieSBwYXR0ZXJuIG1hdGNoXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAnLydcbiAgICAgICAgc2VhcmNoRWRpdG9yLmluc2VydFRleHQoJ1xcXFxkezMsNH0nKVxuICAgICAgICB3aXRoTW9ja1BsYXRmb3JtIHNlYXJjaEVkaXRvckVsZW1lbnQsICdwbGF0Zm9ybS1kYXJ3aW4nICwgLT5cbiAgICAgICAgICByYXdLZXlzdHJva2UgJ2NtZC1kJywgZG9jdW1lbnQuYWN0aXZlRWxlbWVudFxuICAgICAgICAgIGVuc3VyZSAnaSBlJyxcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogWycwMDAwJywgJzMzMzMnLCAnNDQ0J11cbiAgICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuXG4gICAgICBpdCBcImNoYW5nZSBvY2N1cnJlbmNlIGJ5IHBhdHRlcm4gbWF0Y2hcIiwgLT5cbiAgICAgICAga2V5c3Ryb2tlICcvJ1xuICAgICAgICBzZWFyY2hFZGl0b3IuaW5zZXJ0VGV4dCgnXlxcXFx3KzonKVxuICAgICAgICB3aXRoTW9ja1BsYXRmb3JtIHNlYXJjaEVkaXRvckVsZW1lbnQsICdwbGF0Zm9ybS1kYXJ3aW4nICwgLT5cbiAgICAgICAgICByYXdLZXlzdHJva2UgJ2N0cmwtY21kLWMnLCBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG4gICAgICAgICAgZW5zdXJlICdpIGUnLCBtb2RlOiAnaW5zZXJ0J1xuICAgICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KCdoZWxsbycpXG4gICAgICAgICAgZW5zdXJlXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGhlbGxvIHh4eDogb29vOiAwMDAwXG4gICAgICAgICAgICBoZWxsbyBvb286IDIyOiBvb286XG4gICAgICAgICAgICBoZWxsbyB4eHg6IHx8fDogeHh4OiAzMzMzOlxuICAgICAgICAgICAgaGVsbG8gfHx8OiBvb286IG9vbzpcbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJmcm9tIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICBkZXNjcmliZSBcInZpc3VhbCBjaGFyYWN0ZXJ3aXNlXCIsIC0+XG4gICAgICAgIGl0IFwiY2hhbmdlIG9jY3VycmVuY2UgaW4gbmFycm93ZWQgc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgICAga2V5c3Ryb2tlICd2IGogLydcbiAgICAgICAgICBzZWFyY2hFZGl0b3IuaW5zZXJ0VGV4dCgnbysnKVxuICAgICAgICAgIHdpdGhNb2NrUGxhdGZvcm0gc2VhcmNoRWRpdG9yRWxlbWVudCwgJ3BsYXRmb3JtLWRhcndpbicgLCAtPlxuICAgICAgICAgICAgcmF3S2V5c3Ryb2tlICdjbWQtZCcsIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnRcbiAgICAgICAgICAgIGVuc3VyZSAnVScsXG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBPT086IHh4eDogT09POiAwMDAwXG4gICAgICAgICAgICAgIDE6IG9vbzogMjI6IG9vbzpcbiAgICAgICAgICAgICAgb29vOiB4eHg6IHx8fDogeHh4OiAzMzMzOlxuICAgICAgICAgICAgICA0NDQ6IHx8fDogb29vOiBvb286XG4gICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICBkZXNjcmliZSBcInZpc3VhbCBsaW5ld2lzZVwiLCAtPlxuICAgICAgICBpdCBcImNoYW5nZSBvY2N1cnJlbmNlIGluIG5hcnJvd2VkIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICAgIGtleXN0cm9rZSAnViBqIC8nXG4gICAgICAgICAgc2VhcmNoRWRpdG9yLmluc2VydFRleHQoJ28rJylcbiAgICAgICAgICB3aXRoTW9ja1BsYXRmb3JtIHNlYXJjaEVkaXRvckVsZW1lbnQsICdwbGF0Zm9ybS1kYXJ3aW4nICwgLT5cbiAgICAgICAgICAgIHJhd0tleXN0cm9rZSAnY21kLWQnLCBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG4gICAgICAgICAgICBlbnN1cmUgJ1UnLFxuICAgICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgICAgT09POiB4eHg6IE9PTzogMDAwMFxuICAgICAgICAgICAgICAxOiBPT086IDIyOiBPT086XG4gICAgICAgICAgICAgIG9vbzogeHh4OiB8fHw6IHh4eDogMzMzMzpcbiAgICAgICAgICAgICAgNDQ0OiB8fHw6IG9vbzogb29vOlxuICAgICAgICAgICAgICBcIlwiXCJcblxuICAgICAgZGVzY3JpYmUgXCJ2aXN1YWwgYmxvY2t3aXNlXCIsIC0+XG4gICAgICAgIGl0IFwiY2hhbmdlIG9jY3VycmVuY2UgaW4gbmFycm93ZWQgc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDVdXG4gICAgICAgICAga2V5c3Ryb2tlICdjdHJsLXYgMiBqIDEgMCBsIC8nXG4gICAgICAgICAgc2VhcmNoRWRpdG9yLmluc2VydFRleHQoJ28rJylcblxuICAgICAgICAgIHdpdGhNb2NrUGxhdGZvcm0gc2VhcmNoRWRpdG9yRWxlbWVudCwgJ3BsYXRmb3JtLWRhcndpbicgLCAtPlxuICAgICAgICAgICAgcmF3S2V5c3Ryb2tlICdjbWQtZCcsIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnRcbiAgICAgICAgICAgIGVuc3VyZSAnVScsXG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBvb286IHh4eDogT09POiAwMDAwXG4gICAgICAgICAgICAgIDE6IE9PTzogMjI6IE9PTzpcbiAgICAgICAgICAgICAgb29vOiB4eHg6IHx8fDogeHh4OiAzMzMzOlxuICAgICAgICAgICAgICA0NDQ6IHx8fDogb29vOiBvb286XG4gICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJwZXJzaXN0ZW50LXNlbGVjdGlvbiBpcyBleGlzdHNcIiwgLT5cbiAgICAgIHBlcnNpc3RlbnRTZWxlY3Rpb25CdWZmZXJSYW5nZSA9IG51bGxcbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgYXRvbS5rZXltYXBzLmFkZCBcImNyZWF0ZS1wZXJzaXN0ZW50LXNlbGVjdGlvblwiLFxuICAgICAgICAgICdhdG9tLXRleHQtZWRpdG9yLnZpbS1tb2RlLXBsdXM6bm90KC5pbnNlcnQtbW9kZSknOlxuICAgICAgICAgICAgJ20nOiAndmltLW1vZGUtcGx1czpjcmVhdGUtcGVyc2lzdGVudC1zZWxlY3Rpb24nXG5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgb29vOiB4eHg6IG9vbzpcbiAgICAgICAgICB8fHw6IG9vbzogeHh4OiBvb286XG4gICAgICAgICAgb29vOiB4eHg6IHx8fDogeHh4OiBvb286XG4gICAgICAgICAgeHh4OiB8fHw6IG9vbzogb29vOlxcblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgICAgcGVyc2lzdGVudFNlbGVjdGlvbkJ1ZmZlclJhbmdlID0gW1xuICAgICAgICAgIFtbMCwgMF0sIFsyLCAwXV1cbiAgICAgICAgICBbWzMsIDBdLCBbNCwgMF1dXG4gICAgICAgIF1cbiAgICAgICAgZW5zdXJlICdWIGogbSBHIG0gbScsXG4gICAgICAgICAgcGVyc2lzdGVudFNlbGVjdGlvbkJ1ZmZlclJhbmdlOiBwZXJzaXN0ZW50U2VsZWN0aW9uQnVmZmVyUmFuZ2VcblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIG5vIHNlbGVjdGlvbiBpcyBleGlzdHNcIiwgLT5cbiAgICAgICAgaXQgXCJzZWxlY3Qgb2NjdXJyZW5jZSBpbiBhbGwgcGVyc2lzdGVudC1zZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBrZXlzdHJva2UgJy8nXG4gICAgICAgICAgc2VhcmNoRWRpdG9yLmluc2VydFRleHQoJ3h4eCcpXG4gICAgICAgICAgd2l0aE1vY2tQbGF0Zm9ybSBzZWFyY2hFZGl0b3JFbGVtZW50LCAncGxhdGZvcm0tZGFyd2luJyAsIC0+XG4gICAgICAgICAgICByYXdLZXlzdHJva2UgJ2NtZC1kJywgZG9jdW1lbnQuYWN0aXZlRWxlbWVudFxuICAgICAgICAgICAgZW5zdXJlICdVJyxcbiAgICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIG9vbzogWFhYOiBvb286XG4gICAgICAgICAgICAgIHx8fDogb29vOiBYWFg6IG9vbzpcbiAgICAgICAgICAgICAgb29vOiB4eHg6IHx8fDogeHh4OiBvb286XG4gICAgICAgICAgICAgIFhYWDogfHx8OiBvb286IG9vbzpcXG5cbiAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICAgIHBlcnNpc3RlbnRTZWxlY3Rpb25Db3VudDogMFxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gYm90aCBleGl0cywgb3BlcmF0b3IgYXBwbGllZCB0byBib3RoXCIsIC0+XG4gICAgICAgIGl0IFwic2VsZWN0IGFsbCBvY2N1cnJlbmNlIGluIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIGtleXN0cm9rZSAnViAyIGogLydcbiAgICAgICAgICBzZWFyY2hFZGl0b3IuaW5zZXJ0VGV4dCgneHh4JylcbiAgICAgICAgICB3aXRoTW9ja1BsYXRmb3JtIHNlYXJjaEVkaXRvckVsZW1lbnQsICdwbGF0Zm9ybS1kYXJ3aW4nICwgLT5cbiAgICAgICAgICAgIHJhd0tleXN0cm9rZSAnY21kLWQnLCBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG4gICAgICAgICAgICBlbnN1cmUgJ1UnLFxuICAgICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgICAgb29vOiBYWFg6IG9vbzpcbiAgICAgICAgICAgICAgfHx8OiBvb286IFhYWDogb29vOlxuICAgICAgICAgICAgICBvb286IFhYWDogfHx8OiBYWFg6IG9vbzpcbiAgICAgICAgICAgICAgWFhYOiB8fHw6IG9vbzogb29vOlxcblxuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgICAgcGVyc2lzdGVudFNlbGVjdGlvbkNvdW50OiAwXG5cbiAgICBkZXNjcmliZSBcImRlbW9uc3RyYXRlIHBlcnNpc3RlbnQtc2VsZWN0aW9uJ3MgcHJhY3RpY2FsIHNjZW5hcmlvXCIsIC0+XG4gICAgICBbb2xkR3JhbW1hcl0gPSBbXVxuICAgICAgYWZ0ZXJFYWNoIC0+XG4gICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKG9sZEdyYW1tYXIpXG5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgYXRvbS5rZXltYXBzLmFkZCBcImNyZWF0ZS1wZXJzaXN0ZW50LXNlbGVjdGlvblwiLFxuICAgICAgICAgICdhdG9tLXRleHQtZWRpdG9yLnZpbS1tb2RlLXBsdXM6bm90KC5pbnNlcnQtbW9kZSknOlxuICAgICAgICAgICAgJ20nOiAndmltLW1vZGUtcGx1czp0b2dnbGUtcGVyc2lzdGVudC1zZWxlY3Rpb24nXG5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWNvZmZlZS1zY3JpcHQnKVxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBvbGRHcmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKVxuICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZSgnc291cmNlLmNvZmZlZScpKVxuXG4gICAgICAgIHNldCB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yOiAoQG1haW4sIEBlZGl0b3IsIEBzdGF0dXNCYXJNYW5hZ2VyKSAtPlxuICAgICAgICAgICAgICBAZWRpdG9yRWxlbWVudCA9IEBlZGl0b3IuZWxlbWVudFxuICAgICAgICAgICAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgICAgICAgICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICAgICAgICAgICAgQG1vZGVNYW5hZ2VyID0gbmV3IE1vZGVNYW5hZ2VyKHRoaXMpXG4gICAgICAgICAgICAgIEBtYXJrID0gbmV3IE1hcmtNYW5hZ2VyKHRoaXMpXG4gICAgICAgICAgICAgIEByZWdpc3RlciA9IG5ldyBSZWdpc3Rlck1hbmFnZXIodGhpcylcbiAgICAgICAgICAgICAgQHBlcnNpc3RlbnRTZWxlY3Rpb25zID0gW11cblxuICAgICAgICAgICAgICBAaGlnaGxpZ2h0U2VhcmNoU3Vic2NyaXB0aW9uID0gQGVkaXRvckVsZW1lbnQub25EaWRDaGFuZ2VTY3JvbGxUb3AgPT5cbiAgICAgICAgICAgICAgICBAcmVmcmVzaEhpZ2hsaWdodFNlYXJjaCgpXG5cbiAgICAgICAgICAgICAgQG9wZXJhdGlvblN0YWNrID0gbmV3IE9wZXJhdGlvblN0YWNrKHRoaXMpXG4gICAgICAgICAgICAgIEBjdXJzb3JTdHlsZU1hbmFnZXIgPSBuZXcgQ3Vyc29yU3R5bGVNYW5hZ2VyKHRoaXMpXG5cbiAgICAgICAgICAgIGFub3RoZXJGdW5jOiAtPlxuICAgICAgICAgICAgICBAaGVsbG8gPSBbXVxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGl0ICdjaGFuZ2UgYWxsIGFzc2lnbm1lbnQoXCI9XCIpIG9mIGN1cnJlbnQtZnVuY3Rpb24gdG8gXCI/PVwiJywgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSBbJ2ogZicsIGlucHV0OiAnPSddLCBjdXJzb3I6IFsxLCAxN11cblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgd2l0aE1vY2tQbGF0Zm9ybSBzZWFyY2hFZGl0b3JFbGVtZW50LCAncGxhdGZvcm0tZGFyd2luJyAsIC0+XG4gICAgICAgICAgICBrZXlzdHJva2UgW1xuICAgICAgICAgICAgICAnZyBjbWQtZCcgIyBzZWxlY3Qtb2NjdXJyZW5jZVxuICAgICAgICAgICAgICAnaSBmJyAgICAgIyBpbm5lci1mdW5jdGlvbi10ZXh0LW9iamVjdFxuICAgICAgICAgICAgICAnbScgICAgICAgIyB0b2dnbGUtcGVyc2lzdGVudC1zZWxlY3Rpb25cbiAgICAgICAgICAgIF0uam9pbihcIiBcIilcblxuICAgICAgICAgICAgdGV4dHNJbkJ1ZmZlclJhbmdlID0gdmltU3RhdGUucGVyc2lzdGVudFNlbGVjdGlvbi5nZXRNYXJrZXJCdWZmZXJSYW5nZXMoKS5tYXAgKHJhbmdlKSAtPlxuICAgICAgICAgICAgICBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgICAgICAgICB0ZXh0c0luQnVmZmVyUmFuZ2VJc0FsbEVxdWFsQ2hhciA9IHRleHRzSW5CdWZmZXJSYW5nZS5ldmVyeSgodGV4dCkgLT4gdGV4dCBpcyAnPScpXG4gICAgICAgICAgICBleHBlY3QodGV4dHNJbkJ1ZmZlclJhbmdlSXNBbGxFcXVhbENoYXIpLnRvQmUodHJ1ZSlcbiAgICAgICAgICAgIGV4cGVjdCh2aW1TdGF0ZS5wZXJzaXN0ZW50U2VsZWN0aW9uLmdldE1hcmtlcnMoKSkudG9IYXZlTGVuZ3RoKDExKVxuXG4gICAgICAgICAgICBrZXlzdHJva2UgJzIgbCcgIyB0byBtb3ZlIHRvIG91dC1zaWRlIG9mIHJhbmdlLW1ya2VyXG4gICAgICAgICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnPT4nXSwgY3Vyc29yOiBbOSwgNjldXG4gICAgICAgICAgICBrZXlzdHJva2UgXCJtXCIgIyBjbGVhciBwZXJzaXN0ZW50U2VsZWN0aW9uIGF0IGN1cnNvciB3aGljaCBpcyA9IHNpZ24gcGFydCBvZiBmYXQgYXJyb3cuXG4gICAgICAgICAgICBleHBlY3QodmltU3RhdGUucGVyc2lzdGVudFNlbGVjdGlvbi5nZXRNYXJrZXJzKCkpLnRvSGF2ZUxlbmd0aCgxMClcblxuICAgICAgICB3YWl0c0ZvciAtPlxuICAgICAgICAgIGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdoYXMtcGVyc2lzdGVudC1zZWxlY3Rpb24nKVxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICB3aXRoTW9ja1BsYXRmb3JtIHNlYXJjaEVkaXRvckVsZW1lbnQsICdwbGF0Zm9ybS1kYXJ3aW4nICwgLT5cbiAgICAgICAgICAgIGtleXN0cm9rZSBbXG4gICAgICAgICAgICAgICdjdHJsLWNtZC1nJyAjIHNlbGVjdC1wZXJzaXN0ZW50LXNlbGVjdGlvblxuICAgICAgICAgICAgICAnSScgICAgICAgICAgIyBJbnNlcnQgYXQgc3RhcnQgb2Ygc2VsZWN0aW9uXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dCgnPycpXG4gICAgICAgICAgICBlbnN1cmUgJ2VzY2FwZScsXG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBjb25zdHJ1Y3RvcjogKEBtYWluLCBAZWRpdG9yLCBAc3RhdHVzQmFyTWFuYWdlcikgLT5cbiAgICAgICAgICAgICAgICBAZWRpdG9yRWxlbWVudCA/PSBAZWRpdG9yLmVsZW1lbnRcbiAgICAgICAgICAgICAgICBAZW1pdHRlciA/PSBuZXcgRW1pdHRlclxuICAgICAgICAgICAgICAgIEBzdWJzY3JpcHRpb25zID89IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgICAgICAgICAgICAgQG1vZGVNYW5hZ2VyID89IG5ldyBNb2RlTWFuYWdlcih0aGlzKVxuICAgICAgICAgICAgICAgIEBtYXJrID89IG5ldyBNYXJrTWFuYWdlcih0aGlzKVxuICAgICAgICAgICAgICAgIEByZWdpc3RlciA/PSBuZXcgUmVnaXN0ZXJNYW5hZ2VyKHRoaXMpXG4gICAgICAgICAgICAgICAgQHBlcnNpc3RlbnRTZWxlY3Rpb25zID89IFtdXG5cbiAgICAgICAgICAgICAgICBAaGlnaGxpZ2h0U2VhcmNoU3Vic2NyaXB0aW9uID89IEBlZGl0b3JFbGVtZW50Lm9uRGlkQ2hhbmdlU2Nyb2xsVG9wID0+XG4gICAgICAgICAgICAgICAgICBAcmVmcmVzaEhpZ2hsaWdodFNlYXJjaCgpXG5cbiAgICAgICAgICAgICAgICBAb3BlcmF0aW9uU3RhY2sgPz0gbmV3IE9wZXJhdGlvblN0YWNrKHRoaXMpXG4gICAgICAgICAgICAgICAgQGN1cnNvclN0eWxlTWFuYWdlciA/PSBuZXcgQ3Vyc29yU3R5bGVNYW5hZ2VyKHRoaXMpXG5cbiAgICAgICAgICAgICAgYW5vdGhlckZ1bmM6IC0+XG4gICAgICAgICAgICAgICAgQGhlbGxvID0gW11cbiAgICAgICAgICAgICAgXCJcIlwiXG5cbiAgZGVzY3JpYmUgXCJwcmVzZXQgb2NjdXJyZW5jZSBtYXJrZXJcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKGdldFZpZXcoYXRvbS53b3Jrc3BhY2UpKVxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICBUaGlzIHRleHQgaGF2ZSAzIGluc3RhbmNlIG9mICd0ZXh0JyBpbiB0aGUgd2hvbGUgdGV4dFxuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwidG9nZ2xlLXByZXNldC1vY2N1cnJlbmNlIGNvbW1hbmRzXCIsIC0+XG4gICAgICBkZXNjcmliZSBcImluIG5vcm1hbC1tb2RlXCIsIC0+XG4gICAgICAgIGRlc2NyaWJlIFwiYWRkIHByZXNldCBvY2N1cnJlbmNlXCIsIC0+XG4gICAgICAgICAgaXQgJ3NldCBjdXJzb3Itd2FyZCBhcyBwcmVzZXQgb2NjdXJyZW5jZSBtYXJrZXIgYW5kIG5vdCBtb3ZlIGN1cnNvcicsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ2cgbycsIG9jY3VycmVuY2VDb3VudDogMSwgb2NjdXJyZW5jZVRleHQ6ICdUaGlzJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICAgIGVuc3VyZSAndycsIGN1cnNvcjogWzAsIDVdXG4gICAgICAgICAgICBlbnN1cmUgJ2cgbycsIG9jY3VycmVuY2VDb3VudDogNCwgb2NjdXJyZW5jZVRleHQ6IFsnVGhpcycsICd0ZXh0JywgJ3RleHQnLCAndGV4dCddLCBjdXJzb3I6IFswLCA1XVxuXG4gICAgICAgIGRlc2NyaWJlIFwicmVtb3ZlIHByZXNldCBvY2N1cnJlbmNlXCIsIC0+XG4gICAgICAgICAgaXQgJ3JlbW92ZXMgb2NjdXJyZW5jZSBvbmUgYnkgb25lIHNlcGFyYXRlbHknLCAtPlxuICAgICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlQ291bnQ6IDEsIG9jY3VycmVuY2VUZXh0OiAnVGhpcycsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJ3cnLCBjdXJzb3I6IFswLCA1XVxuICAgICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlQ291bnQ6IDQsIG9jY3VycmVuY2VUZXh0OiBbJ1RoaXMnLCAndGV4dCcsICd0ZXh0JywgJ3RleHQnXSwgY3Vyc29yOiBbMCwgNV1cbiAgICAgICAgICAgIGVuc3VyZSAnZyBvJywgb2NjdXJyZW5jZUNvdW50OiAzLCBvY2N1cnJlbmNlVGV4dDogWydUaGlzJywgJ3RleHQnLCAndGV4dCddLCBjdXJzb3I6IFswLCA1XVxuICAgICAgICAgICAgZW5zdXJlICdiIGcgbycsIG9jY3VycmVuY2VDb3VudDogMiwgb2NjdXJyZW5jZVRleHQ6IFsndGV4dCcsICd0ZXh0J10sIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgaXQgJ3JlbW92ZXMgYWxsIG9jY3VycmVuY2UgaW4gdGhpcyBlZGl0b3IgYnkgZXNjYXBlJywgLT5cbiAgICAgICAgICAgIGVuc3VyZSAnZyBvJywgb2NjdXJyZW5jZUNvdW50OiAxLCBvY2N1cnJlbmNlVGV4dDogJ1RoaXMnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgZW5zdXJlICd3JywgY3Vyc29yOiBbMCwgNV1cbiAgICAgICAgICAgIGVuc3VyZSAnZyBvJywgb2NjdXJyZW5jZUNvdW50OiA0LCBvY2N1cnJlbmNlVGV4dDogWydUaGlzJywgJ3RleHQnLCAndGV4dCcsICd0ZXh0J10sIGN1cnNvcjogWzAsIDVdXG4gICAgICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG9jY3VycmVuY2VDb3VudDogMFxuXG4gICAgICAgIGRlc2NyaWJlIFwiY3NzIGNsYXNzIGhhcy1vY2N1cnJlbmNlXCIsIC0+XG4gICAgICAgICAgW2NsYXNzTGlzdCwgdXBkYXRlXSA9IFtdXG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgdmltU3RhdGUub2NjdXJyZW5jZU1hbmFnZXIubWFya2VyTGF5ZXIub25EaWRVcGRhdGUodXBkYXRlID0gamFzbWluZS5jcmVhdGVTcHkoKSlcbiAgICAgICAgICBpdCAnaXMgYXV0by1zZXQvdW5zZXQgd2hldGVyIGF0IGxlYXN0IG9uZSBwcmVzZXQtb2NjdXJyZW5jZSB3YXMgZXhpc3RzIG9yIG5vdCcsIC0+XG4gICAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICAgIGV4cGVjdChlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnaGFzLW9jY3VycmVuY2UnKSkudG9CZShmYWxzZSlcbiAgICAgICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlQ291bnQ6IDEsIG9jY3VycmVuY2VUZXh0OiAnVGhpcycsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgICB3YWl0c0ZvciAtPlxuICAgICAgICAgICAgICB1cGRhdGUuY2FsbENvdW50IGlzIDFcbiAgICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKCdoYXMtb2NjdXJyZW5jZScpKS50b0JlKHRydWUpXG4gICAgICAgICAgICAgIGVuc3VyZSAnZyBvJywgb2NjdXJyZW5jZUNvdW50OiAwLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgd2FpdHNGb3IgLT5cbiAgICAgICAgICAgICAgdXBkYXRlLmNhbGxDb3VudCBpcyAyXG4gICAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICAgIGV4cGVjdChlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygnaGFzLW9jY3VycmVuY2UnKSkudG9CZShmYWxzZSlcblxuICAgICAgZGVzY3JpYmUgXCJpbiB2aXN1YWwtbW9kZVwiLCAtPlxuICAgICAgICBkZXNjcmliZSBcImFkZCBwcmVzZXQgb2NjdXJyZW5jZVwiLCAtPlxuICAgICAgICAgIGl0ICdzZXQgc2VsZWN0ZWQtdGV4dCBhcyBwcmVzZXQgb2NjdXJyZW5jZSBtYXJrZXIgYW5kIG5vdCBtb3ZlIGN1cnNvcicsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ3cgdiBsJywgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddLCBzZWxlY3RlZFRleHQ6ICd0ZSdcbiAgICAgICAgICAgIGVuc3VyZSAnZyBvJywgbW9kZTogJ25vcm1hbCcsIG9jY3VycmVuY2VUZXh0OiBbJ3RlJywgJ3RlJywgJ3RlJ11cbiAgICAgICAgZGVzY3JpYmUgXCJpcy1uYXJyb3dlZCBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgICBbdGV4dE9yaWdpbmFsXSA9IFtdXG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgdGV4dE9yaWdpbmFsID0gXCJcIlwiXG4gICAgICAgICAgICAgIFRoaXMgdGV4dCBoYXZlIDMgaW5zdGFuY2Ugb2YgJ3RleHQnIGluIHRoZSB3aG9sZSB0ZXh0XG4gICAgICAgICAgICAgIFRoaXMgdGV4dCBoYXZlIDMgaW5zdGFuY2Ugb2YgJ3RleHQnIGluIHRoZSB3aG9sZSB0ZXh0XFxuXG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgc2V0XG4gICAgICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgICAgIHRleHQ6IHRleHRPcmlnaW5hbFxuICAgICAgICAgIGl0IFwicGljayBvY3VycmVuY2Utd29yZCBmcm9tIGN1cnNvciBwb3NpdGlvbiBhbmQgY29udGludWUgdmlzdWFsLW1vZGVcIiwgLT5cbiAgICAgICAgICAgICMgc3dyYXAoZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSkuY2xlYXJQcm9wZXJ0aWVzKClcbiAgICAgICAgICAgIGVuc3VyZSAndyBWIGonLCBtb2RlOiBbJ3Zpc3VhbCcsICdsaW5ld2lzZSddLCBzZWxlY3RlZFRleHQ6IHRleHRPcmlnaW5hbFxuICAgICAgICAgICAgZW5zdXJlICdnIG8nLFxuICAgICAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdsaW5ld2lzZSddXG4gICAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogdGV4dE9yaWdpbmFsXG4gICAgICAgICAgICAgIG9jY3VycmVuY2VUZXh0OiBbJ3RleHQnLCAndGV4dCcsICd0ZXh0JywgJ3RleHQnLCAndGV4dCcsICd0ZXh0J11cbiAgICAgICAgICAgIGVuc3VyZSBbJ3InLCBpbnB1dDogJyEnXSxcbiAgICAgICAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIFRoaXMgISEhISBoYXZlIDMgaW5zdGFuY2Ugb2YgJyEhISEnIGluIHRoZSB3aG9sZSAhISEhXG4gICAgICAgICAgICAgIFRoaXMgISEhISBoYXZlIDMgaW5zdGFuY2Ugb2YgJyEhISEnIGluIHRoZSB3aG9sZSAhISEhXFxuXG4gICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICBkZXNjcmliZSBcImluIGluY3JlbWVudGFsLXNlYXJjaFwiLCAtPlxuICAgICAgICBbc2VhcmNoRWRpdG9yLCBzZWFyY2hFZGl0b3JFbGVtZW50XSA9IFtdXG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZWFyY2hFZGl0b3IgPSB2aW1TdGF0ZS5zZWFyY2hJbnB1dC5lZGl0b3JcbiAgICAgICAgICBzZWFyY2hFZGl0b3JFbGVtZW50ID0gc2VhcmNoRWRpdG9yLmVsZW1lbnRcbiAgICAgICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKGdldFZpZXcoYXRvbS53b3Jrc3BhY2UpKVxuICAgICAgICAgIHNldHRpbmdzLnNldCgnaW5jcmVtZW50YWxTZWFyY2gnLCB0cnVlKVxuXG4gICAgICAgIGRlc2NyaWJlIFwiYWRkLW9jY3VycmVuY2UtcGF0dGVybi1mcm9tLXNlYXJjaFwiLCAtPlxuICAgICAgICAgIGl0ICdtYXJrIGFzIG9jY3VycmVuY2Ugd2hpY2ggbWF0Y2hlcyByZWdleCBlbnRlcmVkIGluIHNlYXJjaC11aScsIC0+XG4gICAgICAgICAgICBrZXlzdHJva2UgJy8nXG4gICAgICAgICAgICBzZWFyY2hFZGl0b3IuaW5zZXJ0VGV4dCgnXFxcXGJ0XFxcXHcrJylcbiAgICAgICAgICAgIHdpdGhNb2NrUGxhdGZvcm0gc2VhcmNoRWRpdG9yRWxlbWVudCwgJ3BsYXRmb3JtLWRhcndpbicgLCAtPlxuICAgICAgICAgICAgICByYXdLZXlzdHJva2UgJ2NtZC1vJywgZG9jdW1lbnQuYWN0aXZlRWxlbWVudFxuICAgICAgICAgICAgICBlbnN1cmVcbiAgICAgICAgICAgICAgICBvY2N1cnJlbmNlVGV4dDogWyd0ZXh0JywgJ3RleHQnLCAndGhlJywgJ3RleHQnXVxuXG4gICAgZGVzY3JpYmUgXCJtdXRhdGUgcHJlc2V0IG9jY3VyZW5jZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogXCJcIlwiXG4gICAgICAgIG9vbzogeHh4OiBvb28geHh4OiBvb286XG4gICAgICAgICEhITogb29vOiB4eHg6IG9vbyB4eHg6IG9vbzpcbiAgICAgICAgXCJcIlwiXG4gICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGphc21pbmUuYXR0YWNoVG9ET00oZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkpXG5cbiAgICAgIGRlc2NyaWJlIFwibm9ybWFsLW1vZGVcIiwgLT5cbiAgICAgICAgaXQgJ1tkZWxldGVdIGFwcGx5IG9wZXJhdGlvbiB0byBwcmVzZXQtbWFya2VyIGludGVyc2VjdGluZyBzZWxlY3RlZCB0YXJnZXQnLCAtPlxuICAgICAgICAgIGVuc3VyZSAnbCBnIG8gRCcsXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDogeHh4OiAgeHh4OiA6XG4gICAgICAgICAgICAhISE6IG9vbzogeHh4OiBvb28geHh4OiBvb286XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgaXQgJ1t1cGNhc2VdIGFwcGx5IG9wZXJhdGlvbiB0byBwcmVzZXQtbWFya2VyIGludGVyc2VjdGluZyBzZWxlY3RlZCB0YXJnZXQnLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCA2XVxuICAgICAgICAgIGVuc3VyZSAnbCBnIG8gZyBVIGonLFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBvb286IFhYWDogb29vIFhYWDogb29vOlxuICAgICAgICAgICAgISEhOiBvb286IFhYWDogb29vIFhYWDogb29vOlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIGl0ICdbdXBjYXNlIGV4Y2x1ZGVdIHdvblxcJ3QgbXV0YXRlIHJlbW92ZWQgbWFya2VyJywgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBlbnN1cmUgJ2cgbycsIG9jY3VycmVuY2VDb3VudDogNlxuICAgICAgICAgIGVuc3VyZSAnZyBvJywgb2NjdXJyZW5jZUNvdW50OiA1XG4gICAgICAgICAgZW5zdXJlICdnIFUgaicsXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIG9vbzogeHh4OiBPT08geHh4OiBPT086XG4gICAgICAgICAgICAhISE6IE9PTzogeHh4OiBPT08geHh4OiBPT086XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgaXQgJ1tkZWxldGVdIGFwcGx5IG9wZXJhdGlvbiB0byBwcmVzZXQtbWFya2VyIGludGVyc2VjdGluZyBzZWxlY3RlZCB0YXJnZXQnLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAxMF1cbiAgICAgICAgICBlbnN1cmUgJ2cgbyBnIFUgJCcsXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIG9vbzogeHh4OiBPT08geHh4OiBPT086XG4gICAgICAgICAgICAhISE6IG9vbzogeHh4OiBvb28geHh4OiBvb286XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgaXQgJ1tjaGFuZ2VdIGFwcGx5IG9wZXJhdGlvbiB0byBwcmVzZXQtbWFya2VyIGludGVyc2VjdGluZyBzZWxlY3RlZCB0YXJnZXQnLCAtPlxuICAgICAgICAgIGVuc3VyZSAnbCBnIG8gQycsXG4gICAgICAgICAgICBtb2RlOiAnaW5zZXJ0J1xuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICA6IHh4eDogIHh4eDogOlxuICAgICAgICAgICAgISEhOiBvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgZWRpdG9yLmluc2VydFRleHQoJ1lZWScpXG4gICAgICAgICAgZW5zdXJlICdsIGcgbyBDJyxcbiAgICAgICAgICAgIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIFlZWTogeHh4OiBZWVkgeHh4OiBZWVk6XG4gICAgICAgICAgICAhISE6IG9vbzogeHh4OiBvb28geHh4OiBvb286XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIG51bUN1cnNvcnM6IDNcbiAgICAgICAgZGVzY3JpYmUgXCJwcmVkZWZpbmVkIGtleW1hcCBvbiB3aGVuIGhhcy1vY2N1cnJlbmNlXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgc2V0XG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBWaW0gaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgVmltIGlzIGVkaXRvciBJIHVzZWQgYmVmb3JlXG4gICAgICAgICAgICAgIFZpbSBpcyBlZGl0b3IgSSB1c2VkIGJlZm9yZVxuICAgICAgICAgICAgICBWaW0gaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgICBpdCAnW2luc2VydC1hdC1zdGFydF0gYXBwbHkgb3BlcmF0aW9uIHRvIHByZXNldC1tYXJrZXIgaW50ZXJzZWN0aW5nIHNlbGVjdGVkIHRhcmdldCcsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMV1cbiAgICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlVGV4dDogWydWaW0nLCAnVmltJywgJ1ZpbScsICdWaW0nXVxuICAgICAgICAgICAgd2FpdHNGb3IgLT5cbiAgICAgICAgICAgICAgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2hhcy1vY2N1cnJlbmNlJylcbiAgICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgICAgZW5zdXJlICdJIGsnLFxuICAgICAgICAgICAgICAgIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgICAgICAgICAgbnVtQ3Vyc29yczogMlxuICAgICAgICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dChcInB1cmUtXCIpXG4gICAgICAgICAgICAgIGVuc3VyZSAnZXNjYXBlJyxcbiAgICAgICAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICAgIHB1cmUtVmltIGlzIGVkaXRvciBJIHVzZWQgYmVmb3JlXG4gICAgICAgICAgICAgICAgcHVyZS1WaW0gaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgICBWaW0gaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgICBWaW0gaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBpdCAnW2luc2VydC1hZnRlci1zdGFydF0gYXBwbHkgb3BlcmF0aW9uIHRvIHByZXNldC1tYXJrZXIgaW50ZXJzZWN0aW5nIHNlbGVjdGVkIHRhcmdldCcsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMV1cbiAgICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlVGV4dDogWydWaW0nLCAnVmltJywgJ1ZpbScsICdWaW0nXVxuICAgICAgICAgICAgd2FpdHNGb3IgLT5cbiAgICAgICAgICAgICAgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2hhcy1vY2N1cnJlbmNlJylcbiAgICAgICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICAgICAgZW5zdXJlICdBIGonLFxuICAgICAgICAgICAgICAgIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgICAgICAgICAgbnVtQ3Vyc29yczogMlxuICAgICAgICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dChcIiBhbmQgRW1hY3NcIilcbiAgICAgICAgICAgICAgZW5zdXJlICdlc2NhcGUnLFxuICAgICAgICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgICAgVmltIGlzIGVkaXRvciBJIHVzZWQgYmVmb3JlXG4gICAgICAgICAgICAgICAgVmltIGFuZCBFbWFjcyBpcyBlZGl0b3IgSSB1c2VkIGJlZm9yZVxuICAgICAgICAgICAgICAgIFZpbSBhbmQgRW1hY3MgaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgICBWaW0gaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgICBcIlwiXCJcblxuICAgICAgZGVzY3JpYmUgXCJ2aXN1YWwtbW9kZVwiLCAtPlxuICAgICAgICBpdCAnW3VwY2FzZV0gYXBwbHkgdG8gcHJlc2V0LW1hcmtlciBhcyBsb25nIGFzIGl0IGludGVyc2VjdHMgc2VsZWN0aW9uJywgLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIGN1cnNvcjogWzAsIDZdXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIG9vbzogeHh4OiBvb28geHh4OiBvb286XG4gICAgICAgICAgICB4eHg6IG9vbzogeHh4OiBvb28geHh4OiBvb286XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBlbnN1cmUgJ2cgbycsIG9jY3VycmVuY2VDb3VudDogNVxuICAgICAgICAgIGVuc3VyZSAndiBqIFUnLFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBvb286IFhYWDogb29vIFhYWDogb29vOlxuICAgICAgICAgICAgWFhYOiBvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGRlc2NyaWJlIFwidmlzdWFsLWxpbmV3aXNlLW1vZGVcIiwgLT5cbiAgICAgICAgaXQgJ1t1cGNhc2VdIGFwcGx5IHRvIHByZXNldC1tYXJrZXIgYXMgbG9uZyBhcyBpdCBpbnRlcnNlY3RzIHNlbGVjdGlvbicsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICBjdXJzb3I6IFswLCA2XVxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICAgICAgeHh4OiBvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlQ291bnQ6IDVcbiAgICAgICAgICBlbnN1cmUgJ1YgVScsXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIG9vbzogWFhYOiBvb28gWFhYOiBvb286XG4gICAgICAgICAgICB4eHg6IG9vbzogeHh4OiBvb28geHh4OiBvb286XG4gICAgICAgICAgICBcIlwiXCJcblxuICAgICAgZGVzY3JpYmUgXCJ2aXN1YWwtYmxvY2t3aXNlLW1vZGVcIiwgLT5cbiAgICAgICAgaXQgJ1t1cGNhc2VdIGFwcGx5IHRvIHByZXNldC1tYXJrZXIgYXMgbG9uZyBhcyBpdCBpbnRlcnNlY3RzIHNlbGVjdGlvbicsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICBjdXJzb3I6IFswLCA2XVxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICAgICAgeHh4OiBvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlQ291bnQ6IDVcbiAgICAgICAgICBlbnN1cmUgJ2N0cmwtdiBqIDIgdyBVJyxcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgb29vOiBYWFg6IG9vbyB4eHg6IG9vbzpcbiAgICAgICAgICAgIHh4eDogb29vOiBYWFg6IG9vbyB4eHg6IG9vbzpcbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJleHBsaWN0IG9wZXJhdG9yLW1vZGlmaWVyIG8gYW5kIHByZXNldC1tYXJrZXJcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgb29vOiB4eHg6IG9vbyB4eHg6IG9vbzpcbiAgICAgICAgICAhISE6IG9vbzogeHh4OiBvb28geHh4OiBvb286XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKGdldFZpZXcoYXRvbS53b3Jrc3BhY2UpKVxuXG4gICAgICBkZXNjcmliZSBcIidvJyBtb2RpZmllciB3aGVuIHByZXNldCBvY2N1cnJlbmNlIGFscmVhZHkgZXhpc3RzXCIsIC0+XG4gICAgICAgIGl0IFwiJ28nIGFsd2F5cyBwaWNrIGN1cnNvci13b3JkIGFuZCBvdmVyd3JpdGUgZXhpc3RpbmcgcHJlc2V0IG1hcmtlcilcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgXCJnIG9cIixcbiAgICAgICAgICAgIG9jY3VycmVuY2VUZXh0OiBbXCJvb29cIiwgXCJvb29cIiwgXCJvb29cIiwgXCJvb29cIiwgXCJvb29cIiwgXCJvb29cIl1cbiAgICAgICAgICBlbnN1cmUgXCIyIHcgZCBvXCIsXG4gICAgICAgICAgICBvY2N1cnJlbmNlVGV4dDogW1wieHh4XCIsIFwieHh4XCIsIFwieHh4XCIsIFwieHh4XCJdXG4gICAgICAgICAgICBtb2RlOiAnb3BlcmF0b3ItcGVuZGluZydcbiAgICAgICAgICBlbnN1cmUgXCJqXCIsXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIG9vbzogOiBvb28gOiBvb286XG4gICAgICAgICAgICAhISE6IG9vbzogOiBvb28gOiBvb286XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgIGRlc2NyaWJlIFwib2NjdXJyZW5jZSBib3VuZCBvcGVyYXRvciBkb24ndCBvdmVyd2l0ZSBwcmUtZXhpc3RpbmcgcHJlc2V0IG1hcmtlclwiLCAtPlxuICAgICAgICBpdCBcIidvJyBhbHdheXMgcGljayBjdXJzb3Itd29yZCBhbmQgY2xlYXIgZXhpc3RpbmcgcHJlc2V0IG1hcmtlclwiLCAtPlxuICAgICAgICAgIGVuc3VyZSBcImcgb1wiLFxuICAgICAgICAgICAgb2NjdXJyZW5jZVRleHQ6IFtcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiXVxuICAgICAgICAgIGVuc3VyZSBcIjIgdyBnIGNtZC1kXCIsXG4gICAgICAgICAgICBvY2N1cnJlbmNlVGV4dDogW1wib29vXCIsIFwib29vXCIsIFwib29vXCIsIFwib29vXCIsIFwib29vXCIsIFwib29vXCJdXG4gICAgICAgICAgICBtb2RlOiAnb3BlcmF0b3ItcGVuZGluZydcbiAgICAgICAgICBlbnN1cmUgXCJqXCIsXG4gICAgICAgICAgICBzZWxlY3RlZFRleHQ6IFtcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiXVxuIl19
