(function() {
  var TextData, dispatch, getView, getVimState, ref, settings;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData, getView = ref.getView;

  settings = require('../lib/settings');

  describe("Motion Search", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      return getVimState(function(state, _vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = _vim.set, ensure = _vim.ensure, keystroke = _vim.keystroke, _vim;
      });
    });
    afterEach(function() {
      return vimState.resetNormalMode();
    });
    describe("the / keybinding", function() {
      var pane;
      pane = null;
      beforeEach(function() {
        pane = {
          activate: jasmine.createSpy("activate")
        };
        set({
          text: "abc\ndef\nabc\ndef\n",
          cursor: [0, 0]
        });
        spyOn(atom.workspace, 'getActivePane').andReturn(pane);
        vimState.searchHistory.clear();
        return vimState.globalState.set('currentSearch', null);
      });
      describe("as a motion", function() {
        it("moves the cursor to the specified search pattern", function() {
          ensure([
            '/', {
              search: 'def'
            }
          ], {
            cursor: [1, 0]
          });
          return expect(pane.activate).toHaveBeenCalled();
        });
        it("loops back around", function() {
          set({
            cursor: [3, 0]
          });
          return ensure([
            '/', {
              search: 'def'
            }
          ], {
            cursor: [1, 0]
          });
        });
        it("uses a valid regex as a regex", function() {
          ensure([
            '/', {
              search: '[abc]'
            }
          ], {
            cursor: [0, 1]
          });
          return ensure('n', {
            cursor: [0, 2]
          });
        });
        it("uses an invalid regex as a literal string", function() {
          set({
            text: "abc\n[abc]\n"
          });
          ensure([
            '/', {
              search: '[abc'
            }
          ], {
            cursor: [1, 0]
          });
          return ensure('n', {
            cursor: [1, 0]
          });
        });
        it("uses ? as a literal string", function() {
          set({
            text: "abc\n[a?c?\n"
          });
          ensure([
            '/', {
              search: '?'
            }
          ], {
            cursor: [1, 2]
          });
          return ensure('n', {
            cursor: [1, 4]
          });
        });
        it('works with selection in visual mode', function() {
          set({
            text: 'one two three'
          });
          ensure([
            'v /', {
              search: 'th'
            }
          ], {
            cursor: [0, 9]
          });
          return ensure('d', {
            text: 'hree'
          });
        });
        it('extends selection when repeating search in visual mode', function() {
          set({
            text: "line1\nline2\nline3"
          });
          ensure([
            'v /', {
              search: 'line'
            }
          ], {
            selectedBufferRange: [[0, 0], [1, 1]]
          });
          return ensure('n', {
            selectedBufferRange: [[0, 0], [2, 1]]
          });
        });
        it('searches to the correct column in visual linewise mode', function() {
          return ensure([
            'V /', {
              search: 'ef'
            }
          ], {
            selectedText: "abc\ndef\n",
            characterwiseHead: [1, 1],
            cursor: [2, 0],
            mode: ['visual', 'linewise']
          });
        });
        it('not extend linwise selection if search matches on same line', function() {
          set({
            text: "abc def\ndef\n"
          });
          return ensure([
            'V /', {
              search: 'ef'
            }
          ], {
            selectedText: "abc def\n"
          });
        });
        describe("case sensitivity", function() {
          beforeEach(function() {
            return set({
              text: "\nabc\nABC\n",
              cursor: [0, 0]
            });
          });
          it("works in case sensitive mode", function() {
            ensure([
              '/', {
                search: 'ABC'
              }
            ], {
              cursor: [2, 0]
            });
            return ensure('n', {
              cursor: [2, 0]
            });
          });
          it("works in case insensitive mode", function() {
            ensure([
              '/', {
                search: '\\cAbC'
              }
            ], {
              cursor: [1, 0]
            });
            return ensure('n', {
              cursor: [2, 0]
            });
          });
          it("works in case insensitive mode wherever \\c is", function() {
            ensure([
              '/', {
                search: 'AbC\\c'
              }
            ], {
              cursor: [1, 0]
            });
            return ensure('n', {
              cursor: [2, 0]
            });
          });
          describe("when ignoreCaseForSearch is enabled", function() {
            beforeEach(function() {
              return settings.set('ignoreCaseForSearch', true);
            });
            it("ignore case when search [case-1]", function() {
              ensure([
                '/', {
                  search: 'abc'
                }
              ], {
                cursor: [1, 0]
              });
              return ensure('n', {
                cursor: [2, 0]
              });
            });
            return it("ignore case when search [case-2]", function() {
              ensure([
                '/', {
                  search: 'ABC'
                }
              ], {
                cursor: [1, 0]
              });
              return ensure('n', {
                cursor: [2, 0]
              });
            });
          });
          return describe("when useSmartcaseForSearch is enabled", function() {
            beforeEach(function() {
              return settings.set('useSmartcaseForSearch', true);
            });
            it("ignore case when searh term includes A-Z", function() {
              ensure([
                '/', {
                  search: 'ABC'
                }
              ], {
                cursor: [2, 0]
              });
              return ensure('n', {
                cursor: [2, 0]
              });
            });
            it("ignore case when searh term NOT includes A-Z regardress of `ignoreCaseForSearch`", function() {
              settings.set('ignoreCaseForSearch', false);
              ensure([
                '/', {
                  search: 'abc'
                }
              ], {
                cursor: [1, 0]
              });
              return ensure('n', {
                cursor: [2, 0]
              });
            });
            return it("ignore case when searh term NOT includes A-Z regardress of `ignoreCaseForSearch`", function() {
              settings.set('ignoreCaseForSearch', true);
              ensure([
                '/', {
                  search: 'abc'
                }
              ], {
                cursor: [1, 0]
              });
              return ensure('n', {
                cursor: [2, 0]
              });
            });
          });
        });
        describe("repeating", function() {
          return it("does nothing with no search history", function() {
            set({
              cursor: [0, 0]
            });
            ensure('n', {
              cursor: [0, 0]
            });
            set({
              cursor: [1, 1]
            });
            return ensure('n', {
              cursor: [1, 1]
            });
          });
        });
        describe("repeating with search history", function() {
          beforeEach(function() {
            return keystroke([
              '/', {
                search: 'def'
              }
            ]);
          });
          it("repeats previous search with /<enter>", function() {
            return ensure([
              '/', {
                search: ''
              }
            ], {
              cursor: [3, 0]
            });
          });
          it("repeats previous search with //", function() {
            return ensure([
              '/', {
                search: '/'
              }
            ], {
              cursor: [3, 0]
            });
          });
          describe("the n keybinding", function() {
            return it("repeats the last search", function() {
              return ensure('n', {
                cursor: [3, 0]
              });
            });
          });
          return describe("the N keybinding", function() {
            return it("repeats the last search backwards", function() {
              set({
                cursor: [0, 0]
              });
              ensure('N', {
                cursor: [3, 0]
              });
              return ensure('N', {
                cursor: [1, 0]
              });
            });
          });
        });
        return describe("composing", function() {
          it("composes with operators", function() {
            return ensure([
              'd /', {
                search: 'def'
              }
            ], {
              text: "def\nabc\ndef\n"
            });
          });
          return it("repeats correctly with operators", function() {
            return ensure([
              'd /', {
                search: 'def'
              }, '.'
            ], {
              text: "def\n"
            });
          });
        });
      });
      describe("when reversed as ?", function() {
        it("moves the cursor backwards to the specified search pattern", function() {
          return ensure([
            '?', {
              search: 'def'
            }
          ], {
            cursor: [3, 0]
          });
        });
        it("accepts / as a literal search pattern", function() {
          set({
            text: "abc\nd/f\nabc\nd/f\n",
            cursor: [0, 0]
          });
          ensure([
            '?', {
              search: '/'
            }
          ], {
            cursor: [3, 1]
          });
          return ensure([
            '?', {
              search: '/'
            }
          ], {
            cursor: [1, 1]
          });
        });
        return describe("repeating", function() {
          beforeEach(function() {
            return keystroke([
              '?', {
                search: 'def'
              }
            ]);
          });
          it("repeats previous search as reversed with ?<enter>", function() {
            return ensure([
              '?', {
                search: ''
              }
            ], {
              cursor: [1, 0]
            });
          });
          it("repeats previous search as reversed with ??", function() {
            return ensure([
              '?', {
                search: '?'
              }
            ], {
              cursor: [1, 0]
            });
          });
          describe('the n keybinding', function() {
            return it("repeats the last search backwards", function() {
              set({
                cursor: [0, 0]
              });
              return ensure('n', {
                cursor: [3, 0]
              });
            });
          });
          return describe('the N keybinding', function() {
            return it("repeats the last search forwards", function() {
              set({
                cursor: [0, 0]
              });
              return ensure('N', {
                cursor: [1, 0]
              });
            });
          });
        });
      });
      describe("using search history", function() {
        var ensureInputEditor, inputEditor;
        inputEditor = null;
        ensureInputEditor = function(command, arg) {
          var text;
          text = arg.text;
          dispatch(inputEditor, command);
          return expect(inputEditor.getModel().getText()).toEqual(text);
        };
        beforeEach(function() {
          ensure([
            '/', {
              search: 'def'
            }
          ], {
            cursor: [1, 0]
          });
          ensure([
            '/', {
              search: 'abc'
            }
          ], {
            cursor: [2, 0]
          });
          return inputEditor = vimState.searchInput.editorElement;
        });
        it("allows searching history in the search field", function() {
          keystroke('/');
          ensureInputEditor('core:move-up', {
            text: 'abc'
          });
          ensureInputEditor('core:move-up', {
            text: 'def'
          });
          return ensureInputEditor('core:move-up', {
            text: 'def'
          });
        });
        return it("resets the search field to empty when scrolling back", function() {
          keystroke('/');
          ensureInputEditor('core:move-up', {
            text: 'abc'
          });
          ensureInputEditor('core:move-up', {
            text: 'def'
          });
          ensureInputEditor('core:move-down', {
            text: 'abc'
          });
          return ensureInputEditor('core:move-down', {
            text: ''
          });
        });
      });
      return describe("highlightSearch", function() {
        var ensureHightlightSearch, textForMarker;
        textForMarker = function(marker) {
          return editor.getTextInBufferRange(marker.getBufferRange());
        };
        ensureHightlightSearch = function(options) {
          var markers, text;
          markers = vimState.highlightSearch.getMarkers();
          if (options.length != null) {
            expect(markers).toHaveLength(options.length);
          }
          if (options.text != null) {
            text = markers.map(function(marker) {
              return textForMarker(marker);
            });
            expect(text).toEqual(options.text);
          }
          if (options.mode != null) {
            return ensure({
              mode: options.mode
            });
          }
        };
        beforeEach(function() {
          jasmine.attachToDOM(getView(atom.workspace));
          settings.set('highlightSearch', true);
          expect(vimState.highlightSearch.hasMarkers()).toBe(false);
          return ensure([
            '/', {
              search: 'def'
            }
          ], {
            cursor: [1, 0]
          });
        });
        describe("clearHighlightSearch command", function() {
          return it("clear highlightSearch marker", function() {
            ensureHightlightSearch({
              length: 2,
              text: ["def", "def"],
              mode: 'normal'
            });
            dispatch(editorElement, 'vim-mode-plus:clear-highlight-search');
            return expect(vimState.highlightSearch.hasMarkers()).toBe(false);
          });
        });
        return describe("clearHighlightSearchOnResetNormalMode", function() {
          describe("default setting", function() {
            return it("it won't clear highlightSearch", function() {
              ensureHightlightSearch({
                length: 2,
                text: ["def", "def"],
                mode: 'normal'
              });
              dispatch(editorElement, 'vim-mode-plus:reset-normal-mode');
              return ensureHightlightSearch({
                length: 2,
                text: ["def", "def"],
                mode: 'normal'
              });
            });
          });
          return describe("when enabled", function() {
            return it("it clear highlightSearch on reset-normal-mode", function() {
              settings.set('clearHighlightSearchOnResetNormalMode', true);
              ensureHightlightSearch({
                length: 2,
                text: ["def", "def"],
                mode: 'normal'
              });
              dispatch(editorElement, 'vim-mode-plus:reset-normal-mode');
              expect(vimState.highlightSearch.hasMarkers()).toBe(false);
              return ensure({
                mode: 'normal'
              });
            });
          });
        });
      });
    });
    describe("IncrementalSearch", function() {
      beforeEach(function() {
        settings.set('incrementalSearch', true);
        return jasmine.attachToDOM(getView(atom.workspace));
      });
      describe("with multiple-cursors", function() {
        beforeEach(function() {
          return set({
            text: "0:    abc\n1:    abc\n2:    abc\n3:    abc",
            cursor: [[0, 0], [1, 0]]
          });
        });
        it("[forward] move each cursor to match", function() {
          return ensure([
            '/', {
              search: 'abc'
            }
          ], {
            cursor: [[0, 6], [1, 6]]
          });
        });
        it("[forward: count specified], move each cursor to match", function() {
          return ensure([
            '2 /', {
              search: 'abc'
            }
          ], {
            cursor: [[1, 6], [2, 6]]
          });
        });
        it("[backward] move each cursor to match", function() {
          return ensure([
            '?', {
              search: 'abc'
            }
          ], {
            cursor: [[3, 6], [0, 6]]
          });
        });
        return it("[backward: count specified] move each cursor to match", function() {
          return ensure([
            '2 ?', {
              search: 'abc'
            }
          ], {
            cursor: [[2, 6], [3, 6]]
          });
        });
      });
      return describe("blank input repeat last search", function() {
        beforeEach(function() {
          vimState.searchHistory.clear();
          return set({
            text: "0:    abc\n1:    abc\n2:    abc\n3:    abc\n4:"
          });
        });
        it("Do nothing when search history is empty", function() {
          set({
            cursor: [2, 1]
          });
          ensure([
            '/', {
              search: ''
            }
          ], {
            cursor: [2, 1]
          });
          return ensure([
            '?', {
              search: ''
            }
          ], {
            cursor: [2, 1]
          });
        });
        it("Repeat forward direction", function() {
          set({
            cursor: [0, 0]
          });
          ensure([
            '/', {
              search: 'abc'
            }
          ], {
            cursor: [0, 6]
          });
          ensure([
            '/', {
              search: ''
            }
          ], {
            cursor: [1, 6]
          });
          return ensure([
            '2 /', {
              search: ''
            }
          ], {
            cursor: [3, 6]
          });
        });
        return it("Repeat backward direction", function() {
          set({
            cursor: [4, 0]
          });
          ensure([
            '?', {
              search: 'abc'
            }
          ], {
            cursor: [3, 6]
          });
          ensure([
            '?', {
              search: ''
            }
          ], {
            cursor: [2, 6]
          });
          return ensure([
            '2 ?', {
              search: ''
            }
          ], {
            cursor: [0, 6]
          });
        });
      });
    });
    describe("the * keybinding", function() {
      beforeEach(function() {
        return set({
          text: "abd\n@def\nabd\ndef\n",
          cursorBuffer: [0, 0]
        });
      });
      describe("as a motion", function() {
        it("moves cursor to next occurrence of word under cursor", function() {
          return ensure('*', {
            cursorBuffer: [2, 0]
          });
        });
        it("repeats with the n key", function() {
          ensure('*', {
            cursorBuffer: [2, 0]
          });
          return ensure('n', {
            cursorBuffer: [0, 0]
          });
        });
        it("doesn't move cursor unless next occurrence is the exact word (no partial matches)", function() {
          set({
            text: "abc\ndef\nghiabc\njkl\nabcdef",
            cursorBuffer: [0, 0]
          });
          return ensure('*', {
            cursorBuffer: [0, 0]
          });
        });
        describe("with words that contain 'non-word' characters", function() {
          it("skips non-word-char when picking cursor-word then place cursor to next occurrence of word", function() {
            set({
              text: "abc\n@def\nabc\n@def\n",
              cursorBuffer: [1, 0]
            });
            return ensure('*', {
              cursorBuffer: [3, 1]
            });
          });
          it("doesn't move cursor unless next match has exact word ending", function() {
            set({
              text: "abc\n@def\nabc\n@def1\n",
              cursorBuffer: [1, 1]
            });
            return ensure('*', {
              cursorBuffer: [1, 1]
            });
          });
          return it("moves cursor to the start of valid word char", function() {
            set({
              text: "abc\ndef\nabc\n@def\n",
              cursorBuffer: [1, 0]
            });
            return ensure('*', {
              cursorBuffer: [3, 1]
            });
          });
        });
        describe("when cursor is on non-word char column", function() {
          return it("matches only the non-word char", function() {
            set({
              text: "abc\n@def\nabc\n@def\n",
              cursorBuffer: [1, 0]
            });
            return ensure('*', {
              cursorBuffer: [3, 1]
            });
          });
        });
        describe("when cursor is not on a word", function() {
          return it("does a match with the next word", function() {
            set({
              text: "abc\na  @def\n abc\n @def",
              cursorBuffer: [1, 1]
            });
            return ensure('*', {
              cursorBuffer: [3, 2]
            });
          });
        });
        return describe("when cursor is at EOF", function() {
          return it("doesn't try to do any match", function() {
            set({
              text: "abc\n@def\nabc\n ",
              cursorBuffer: [3, 0]
            });
            return ensure('*', {
              cursorBuffer: [3, 0]
            });
          });
        });
      });
      return describe("caseSensitivity setting", function() {
        beforeEach(function() {
          return set({
            text: "abc\nABC\nabC\nabc\nABC",
            cursor: [0, 0]
          });
        });
        it("search case sensitively when `ignoreCaseForSearchCurrentWord` is false(=default)", function() {
          expect(settings.get('ignoreCaseForSearchCurrentWord')).toBe(false);
          ensure('*', {
            cursorBuffer: [3, 0]
          });
          return ensure('n', {
            cursorBuffer: [0, 0]
          });
        });
        it("search case insensitively when `ignoreCaseForSearchCurrentWord` true", function() {
          settings.set('ignoreCaseForSearchCurrentWord', true);
          ensure('*', {
            cursorBuffer: [1, 0]
          });
          ensure('n', {
            cursorBuffer: [2, 0]
          });
          ensure('n', {
            cursorBuffer: [3, 0]
          });
          return ensure('n', {
            cursorBuffer: [4, 0]
          });
        });
        return describe("useSmartcaseForSearchCurrentWord is enabled", function() {
          beforeEach(function() {
            return settings.set('useSmartcaseForSearchCurrentWord', true);
          });
          it("search case sensitively when enable and search term includes uppercase", function() {
            set({
              cursor: [1, 0]
            });
            ensure('*', {
              cursorBuffer: [4, 0]
            });
            return ensure('n', {
              cursorBuffer: [1, 0]
            });
          });
          return it("search case insensitively when enable and search term NOT includes uppercase", function() {
            set({
              cursor: [0, 0]
            });
            ensure('*', {
              cursorBuffer: [1, 0]
            });
            ensure('n', {
              cursorBuffer: [2, 0]
            });
            ensure('n', {
              cursorBuffer: [3, 0]
            });
            return ensure('n', {
              cursorBuffer: [4, 0]
            });
          });
        });
      });
    });
    describe("the hash keybinding", function() {
      describe("as a motion", function() {
        it("moves cursor to previous occurrence of word under cursor", function() {
          set({
            text: "abc\n@def\nabc\ndef\n",
            cursorBuffer: [2, 1]
          });
          return ensure('#', {
            cursorBuffer: [0, 0]
          });
        });
        it("repeats with n", function() {
          set({
            text: "abc\n@def\nabc\ndef\nabc\n",
            cursorBuffer: [2, 1]
          });
          ensure('#', {
            cursorBuffer: [0, 0]
          });
          ensure('n', {
            cursorBuffer: [4, 0]
          });
          return ensure('n', {
            cursorBuffer: [2, 0]
          });
        });
        it("doesn't move cursor unless next occurrence is the exact word (no partial matches)", function() {
          set({
            text: "abc\ndef\nghiabc\njkl\nabcdef",
            cursorBuffer: [0, 0]
          });
          return ensure('#', {
            cursorBuffer: [0, 0]
          });
        });
        describe("with words that containt 'non-word' characters", function() {
          it("moves cursor to next occurrence of word under cursor", function() {
            set({
              text: "abc\n@def\nabc\n@def\n",
              cursorBuffer: [3, 0]
            });
            return ensure('#', {
              cursorBuffer: [1, 1]
            });
          });
          return it("moves cursor to the start of valid word char", function() {
            set({
              text: "abc\n@def\nabc\ndef\n",
              cursorBuffer: [3, 0]
            });
            return ensure('#', {
              cursorBuffer: [1, 1]
            });
          });
        });
        return describe("when cursor is on non-word char column", function() {
          return it("matches only the non-word char", function() {
            set({
              text: "abc\n@def\nabc\n@def\n",
              cursorBuffer: [1, 0]
            });
            return ensure('*', {
              cursorBuffer: [3, 1]
            });
          });
        });
      });
      return describe("caseSensitivity setting", function() {
        beforeEach(function() {
          return set({
            text: "abc\nABC\nabC\nabc\nABC",
            cursor: [4, 0]
          });
        });
        it("search case sensitively when `ignoreCaseForSearchCurrentWord` is false(=default)", function() {
          expect(settings.get('ignoreCaseForSearchCurrentWord')).toBe(false);
          ensure('#', {
            cursorBuffer: [1, 0]
          });
          return ensure('n', {
            cursorBuffer: [4, 0]
          });
        });
        it("search case insensitively when `ignoreCaseForSearchCurrentWord` true", function() {
          settings.set('ignoreCaseForSearchCurrentWord', true);
          ensure('#', {
            cursorBuffer: [3, 0]
          });
          ensure('n', {
            cursorBuffer: [2, 0]
          });
          ensure('n', {
            cursorBuffer: [1, 0]
          });
          return ensure('n', {
            cursorBuffer: [0, 0]
          });
        });
        return describe("useSmartcaseForSearchCurrentWord is enabled", function() {
          beforeEach(function() {
            return settings.set('useSmartcaseForSearchCurrentWord', true);
          });
          it("search case sensitively when enable and search term includes uppercase", function() {
            set({
              cursor: [4, 0]
            });
            ensure('#', {
              cursorBuffer: [1, 0]
            });
            return ensure('n', {
              cursorBuffer: [4, 0]
            });
          });
          return it("search case insensitively when enable and search term NOT includes uppercase", function() {
            set({
              cursor: [0, 0]
            });
            ensure('#', {
              cursorBuffer: [4, 0]
            });
            ensure('n', {
              cursorBuffer: [3, 0]
            });
            ensure('n', {
              cursorBuffer: [2, 0]
            });
            ensure('n', {
              cursorBuffer: [1, 0]
            });
            return ensure('n', {
              cursorBuffer: [0, 0]
            });
          });
        });
      });
    });
    return describe('the % motion', function() {
      describe("Parenthesis", function() {
        beforeEach(function() {
          return set({
            text: "(___)"
          });
        });
        describe("as operator target", function() {
          beforeEach(function() {
            return set({
              text: "(_(_)_)"
            });
          });
          it('behave inclusively when is at open pair', function() {
            set({
              cursor: [0, 2]
            });
            return ensure('d %', {
              text: "(__)"
            });
          });
          return it('behave inclusively when is at open pair', function() {
            set({
              cursor: [0, 4]
            });
            return ensure('d %', {
              text: "(__)"
            });
          });
        });
        describe("cursor is at pair char", function() {
          it("cursor is at open pair, it move to closing pair", function() {
            set({
              cursor: [0, 0]
            });
            ensure('%', {
              cursor: [0, 4]
            });
            return ensure('%', {
              cursor: [0, 0]
            });
          });
          return it("cursor is at close pair, it move to open pair", function() {
            set({
              cursor: [0, 4]
            });
            ensure('%', {
              cursor: [0, 0]
            });
            return ensure('%', {
              cursor: [0, 4]
            });
          });
        });
        describe("cursor is enclosed by pair", function() {
          beforeEach(function() {
            return set({
              text: "(___)",
              cursor: [0, 2]
            });
          });
          return it("move to open pair", function() {
            return ensure('%', {
              cursor: [0, 0]
            });
          });
        });
        describe("cursor is bofore open pair", function() {
          beforeEach(function() {
            return set({
              text: "__(___)",
              cursor: [0, 0]
            });
          });
          return it("move to open pair", function() {
            return ensure('%', {
              cursor: [0, 6]
            });
          });
        });
        describe("cursor is after close pair", function() {
          beforeEach(function() {
            return set({
              text: "__(___)__",
              cursor: [0, 7]
            });
          });
          return it("fail to move", function() {
            return ensure('%', {
              cursor: [0, 7]
            });
          });
        });
        return describe("multi line", function() {
          beforeEach(function() {
            return set({
              text: "___\n___(__\n___\n___)"
            });
          });
          describe("when open and close pair is not at cursor line", function() {
            it("fail to move", function() {
              set({
                cursor: [0, 0]
              });
              return ensure('%', {
                cursor: [0, 0]
              });
            });
            return it("fail to move", function() {
              set({
                cursor: [2, 0]
              });
              return ensure('%', {
                cursor: [2, 0]
              });
            });
          });
          describe("when open pair is forwarding to cursor in same row", function() {
            return it("move to closing pair", function() {
              set({
                cursor: [1, 0]
              });
              return ensure('%', {
                cursor: [3, 3]
              });
            });
          });
          describe("when cursor position is greater than open pair", function() {
            return it("fail to move", function() {
              set({
                cursor: [1, 4]
              });
              return ensure('%', {
                cursor: [1, 4]
              });
            });
          });
          return describe("when close pair is forwarding to cursor in same row", function() {
            return it("move to closing pair", function() {
              set({
                cursor: [3, 0]
              });
              return ensure('%', {
                cursor: [1, 3]
              });
            });
          });
        });
      });
      describe("CurlyBracket", function() {
        beforeEach(function() {
          return set({
            text: "{___}"
          });
        });
        it("cursor is at open pair, it move to closing pair", function() {
          set({
            cursor: [0, 0]
          });
          ensure('%', {
            cursor: [0, 4]
          });
          return ensure('%', {
            cursor: [0, 0]
          });
        });
        return it("cursor is at close pair, it move to open pair", function() {
          set({
            cursor: [0, 4]
          });
          ensure('%', {
            cursor: [0, 0]
          });
          return ensure('%', {
            cursor: [0, 4]
          });
        });
      });
      describe("SquareBracket", function() {
        beforeEach(function() {
          return set({
            text: "[___]"
          });
        });
        it("cursor is at open pair, it move to closing pair", function() {
          set({
            cursor: [0, 0]
          });
          ensure('%', {
            cursor: [0, 4]
          });
          return ensure('%', {
            cursor: [0, 0]
          });
        });
        return it("cursor is at close pair, it move to open pair", function() {
          set({
            cursor: [0, 4]
          });
          ensure('%', {
            cursor: [0, 0]
          });
          return ensure('%', {
            cursor: [0, 4]
          });
        });
      });
      describe("complex situation", function() {
        beforeEach(function() {
          return set({
            text: "(_____)__{__[___]__}\n_"
          });
        });
        it('move to closing pair which open pair come first', function() {
          set({
            cursor: [0, 7]
          });
          ensure('%', {
            cursor: [0, 19]
          });
          set({
            cursor: [0, 10]
          });
          return ensure('%', {
            cursor: [0, 16]
          });
        });
        return it('enclosing pair is prioritized over forwarding range', function() {
          set({
            cursor: [0, 2]
          });
          return ensure('%', {
            cursor: [0, 0]
          });
        });
      });
      return describe("complex situation with html tag", function() {
        beforeEach(function() {
          return set({
            text: "<div>\n  <span>\n    some text\n  </span>\n</div>"
          });
        });
        it('when cursor is on AngleBracket(<, >), it moves to opposite AngleBracket', function() {
          set({
            cursor: [0, 0]
          });
          ensure('%', {
            cursor: [0, 4]
          });
          return ensure('%', {
            cursor: [0, 0]
          });
        });
        it('can find forwarding range of AngleBracket', function() {
          set({
            cursor: [1, 0]
          });
          ensure('%', {
            cursor: [1, 7]
          });
          return ensure('%', {
            cursor: [1, 2]
          });
        });
        return it('move to pair tag only when cursor is on open or close tag but not on AngleBracket(<, >)', function() {
          set({
            cursor: [0, 0]
          });
          ensure('%', {
            cursor: [0, 4]
          });
          set({
            cursor: [0, 1]
          });
          ensure('%', {
            cursor: [4, 1]
          });
          set({
            cursor: [0, 2]
          });
          ensure('%', {
            cursor: [4, 1]
          });
          set({
            cursor: [0, 3]
          });
          ensure('%', {
            cursor: [4, 1]
          });
          set({
            cursor: [0, 4]
          });
          ensure('%', {
            cursor: [0, 0]
          });
          set({
            cursor: [4, 0]
          });
          ensure('%', {
            cursor: [4, 5]
          });
          set({
            cursor: [4, 1]
          });
          ensure('%', {
            cursor: [0, 1]
          });
          set({
            cursor: [4, 2]
          });
          ensure('%', {
            cursor: [0, 1]
          });
          set({
            cursor: [4, 3]
          });
          ensure('%', {
            cursor: [0, 1]
          });
          set({
            cursor: [4, 4]
          });
          ensure('%', {
            cursor: [0, 1]
          });
          set({
            cursor: [4, 5]
          });
          return ensure('%', {
            cursor: [4, 0]
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL21vdGlvbi1zZWFyY2gtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQTZDLE9BQUEsQ0FBUSxlQUFSLENBQTdDLEVBQUMsNkJBQUQsRUFBYyx1QkFBZCxFQUF3Qix1QkFBeEIsRUFBa0M7O0VBQ2xDLFFBQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0VBRVgsUUFBQSxDQUFTLGVBQVQsRUFBMEIsU0FBQTtBQUN4QixRQUFBO0lBQUEsT0FBNEQsRUFBNUQsRUFBQyxhQUFELEVBQU0sZ0JBQU4sRUFBYyxtQkFBZCxFQUF5QixnQkFBekIsRUFBaUMsdUJBQWpDLEVBQWdEO0lBRWhELFVBQUEsQ0FBVyxTQUFBO2FBQ1QsV0FBQSxDQUFZLFNBQUMsS0FBRCxFQUFRLElBQVI7UUFDVixRQUFBLEdBQVc7UUFDVix3QkFBRCxFQUFTO2VBQ1IsY0FBRCxFQUFNLG9CQUFOLEVBQWMsMEJBQWQsRUFBMkI7TUFIakIsQ0FBWjtJQURTLENBQVg7SUFNQSxTQUFBLENBQVUsU0FBQTthQUNSLFFBQVEsQ0FBQyxlQUFULENBQUE7SUFEUSxDQUFWO0lBR0EsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7QUFDM0IsVUFBQTtNQUFBLElBQUEsR0FBTztNQUVQLFVBQUEsQ0FBVyxTQUFBO1FBQ1QsSUFBQSxHQUFPO1VBQUMsUUFBQSxFQUFVLE9BQU8sQ0FBQyxTQUFSLENBQWtCLFVBQWxCLENBQVg7O1FBQ1AsR0FBQSxDQUNFO1VBQUEsSUFBQSxFQUFNLHNCQUFOO1VBTUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FOUjtTQURGO1FBUUEsS0FBQSxDQUFNLElBQUksQ0FBQyxTQUFYLEVBQXNCLGVBQXRCLENBQXNDLENBQUMsU0FBdkMsQ0FBaUQsSUFBakQ7UUFHQSxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQXZCLENBQUE7ZUFDQSxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQXJCLENBQXlCLGVBQXpCLEVBQTBDLElBQTFDO01BZFMsQ0FBWDtNQWdCQSxRQUFBLENBQVMsYUFBVCxFQUF3QixTQUFBO1FBQ3RCLEVBQUEsQ0FBRyxrREFBSCxFQUF1RCxTQUFBO1VBQ3JELE1BQUEsQ0FBTztZQUFDLEdBQUQsRUFBTTtjQUFBLE1BQUEsRUFBUSxLQUFSO2FBQU47V0FBUCxFQUNFO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQURGO2lCQUVBLE1BQUEsQ0FBTyxJQUFJLENBQUMsUUFBWixDQUFxQixDQUFDLGdCQUF0QixDQUFBO1FBSHFELENBQXZEO1FBS0EsRUFBQSxDQUFHLG1CQUFILEVBQXdCLFNBQUE7VUFDdEIsR0FBQSxDQUFJO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFKO2lCQUNBLE1BQUEsQ0FBTztZQUFDLEdBQUQsRUFBTTtjQUFBLE1BQUEsRUFBUSxLQUFSO2FBQU47V0FBUCxFQUE2QjtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBN0I7UUFGc0IsQ0FBeEI7UUFJQSxFQUFBLENBQUcsK0JBQUgsRUFBb0MsU0FBQTtVQUVsQyxNQUFBLENBQU87WUFBQyxHQUFELEVBQU07Y0FBQSxNQUFBLEVBQVEsT0FBUjthQUFOO1dBQVAsRUFBK0I7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQS9CO2lCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQVo7UUFIa0MsQ0FBcEM7UUFLQSxFQUFBLENBQUcsMkNBQUgsRUFBZ0QsU0FBQTtVQUU5QyxHQUFBLENBQUk7WUFBQSxJQUFBLEVBQU0sY0FBTjtXQUFKO1VBQ0EsTUFBQSxDQUFPO1lBQUMsR0FBRCxFQUFNO2NBQUEsTUFBQSxFQUFRLE1BQVI7YUFBTjtXQUFQLEVBQThCO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUE5QjtpQkFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFaO1FBSjhDLENBQWhEO1FBTUEsRUFBQSxDQUFHLDRCQUFILEVBQWlDLFNBQUE7VUFDL0IsR0FBQSxDQUFJO1lBQUEsSUFBQSxFQUFNLGNBQU47V0FBSjtVQUNBLE1BQUEsQ0FBTztZQUFDLEdBQUQsRUFBTTtjQUFBLE1BQUEsRUFBUSxHQUFSO2FBQU47V0FBUCxFQUEyQjtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBM0I7aUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtRQUgrQixDQUFqQztRQUtBLEVBQUEsQ0FBRyxxQ0FBSCxFQUEwQyxTQUFBO1VBQ3hDLEdBQUEsQ0FBSTtZQUFBLElBQUEsRUFBTSxlQUFOO1dBQUo7VUFDQSxNQUFBLENBQU87WUFBQyxLQUFELEVBQVE7Y0FBQSxNQUFBLEVBQVEsSUFBUjthQUFSO1dBQVAsRUFBOEI7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQTlCO2lCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxJQUFBLEVBQU0sTUFBTjtXQUFaO1FBSHdDLENBQTFDO1FBS0EsRUFBQSxDQUFHLHdEQUFILEVBQTZELFNBQUE7VUFDM0QsR0FBQSxDQUFJO1lBQUEsSUFBQSxFQUFNLHFCQUFOO1dBQUo7VUFNQSxNQUFBLENBQU87WUFBQyxLQUFELEVBQVE7Y0FBQSxNQUFBLEVBQVEsTUFBUjthQUFSO1dBQVAsRUFDRTtZQUFBLG1CQUFBLEVBQXFCLENBQUMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFELEVBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFULENBQXJCO1dBREY7aUJBRUEsTUFBQSxDQUFPLEdBQVAsRUFDRTtZQUFBLG1CQUFBLEVBQXFCLENBQUMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFELEVBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFULENBQXJCO1dBREY7UUFUMkQsQ0FBN0Q7UUFZQSxFQUFBLENBQUcsd0RBQUgsRUFBNkQsU0FBQTtpQkFDM0QsTUFBQSxDQUFPO1lBQUMsS0FBRCxFQUFRO2NBQUEsTUFBQSxFQUFRLElBQVI7YUFBUjtXQUFQLEVBQ0U7WUFBQSxZQUFBLEVBQWMsWUFBZDtZQUNBLGlCQUFBLEVBQW1CLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEbkI7WUFFQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUZSO1lBR0EsSUFBQSxFQUFNLENBQUMsUUFBRCxFQUFXLFVBQVgsQ0FITjtXQURGO1FBRDJELENBQTdEO1FBT0EsRUFBQSxDQUFHLDZEQUFILEVBQWtFLFNBQUE7VUFDaEUsR0FBQSxDQUFJO1lBQUEsSUFBQSxFQUFNLGdCQUFOO1dBQUo7aUJBSUEsTUFBQSxDQUFPO1lBQUMsS0FBRCxFQUFRO2NBQUEsTUFBQSxFQUFRLElBQVI7YUFBUjtXQUFQLEVBQ0U7WUFBQSxZQUFBLEVBQWMsV0FBZDtXQURGO1FBTGdFLENBQWxFO1FBUUEsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7VUFDM0IsVUFBQSxDQUFXLFNBQUE7bUJBQ1QsR0FBQSxDQUNFO2NBQUEsSUFBQSxFQUFNLGNBQU47Y0FDQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURSO2FBREY7VUFEUyxDQUFYO1VBS0EsRUFBQSxDQUFHLDhCQUFILEVBQW1DLFNBQUE7WUFDakMsTUFBQSxDQUFPO2NBQUMsR0FBRCxFQUFNO2dCQUFBLE1BQUEsRUFBUSxLQUFSO2VBQU47YUFBUCxFQUE2QjtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBN0I7bUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBWjtVQUZpQyxDQUFuQztVQUlBLEVBQUEsQ0FBRyxnQ0FBSCxFQUFxQyxTQUFBO1lBQ25DLE1BQUEsQ0FBTztjQUFDLEdBQUQsRUFBTTtnQkFBQSxNQUFBLEVBQVEsUUFBUjtlQUFOO2FBQVAsRUFBZ0M7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2FBQWhDO21CQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2FBQVo7VUFGbUMsQ0FBckM7VUFJQSxFQUFBLENBQUcsZ0RBQUgsRUFBcUQsU0FBQTtZQUNuRCxNQUFBLENBQU87Y0FBQyxHQUFELEVBQU07Z0JBQUEsTUFBQSxFQUFRLFFBQVI7ZUFBTjthQUFQLEVBQWdDO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFoQzttQkFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFaO1VBRm1ELENBQXJEO1VBSUEsUUFBQSxDQUFTLHFDQUFULEVBQWdELFNBQUE7WUFDOUMsVUFBQSxDQUFXLFNBQUE7cUJBQ1QsUUFBUSxDQUFDLEdBQVQsQ0FBYSxxQkFBYixFQUFvQyxJQUFwQztZQURTLENBQVg7WUFHQSxFQUFBLENBQUcsa0NBQUgsRUFBdUMsU0FBQTtjQUNyQyxNQUFBLENBQU87Z0JBQUMsR0FBRCxFQUFNO2tCQUFBLE1BQUEsRUFBUSxLQUFSO2lCQUFOO2VBQVAsRUFBNkI7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUE3QjtxQkFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2dCQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7ZUFBWjtZQUZxQyxDQUF2QzttQkFJQSxFQUFBLENBQUcsa0NBQUgsRUFBdUMsU0FBQTtjQUNyQyxNQUFBLENBQU87Z0JBQUMsR0FBRCxFQUFNO2tCQUFBLE1BQUEsRUFBUSxLQUFSO2lCQUFOO2VBQVAsRUFBNkI7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUE3QjtxQkFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2dCQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7ZUFBWjtZQUZxQyxDQUF2QztVQVI4QyxDQUFoRDtpQkFZQSxRQUFBLENBQVMsdUNBQVQsRUFBa0QsU0FBQTtZQUNoRCxVQUFBLENBQVcsU0FBQTtxQkFDVCxRQUFRLENBQUMsR0FBVCxDQUFhLHVCQUFiLEVBQXNDLElBQXRDO1lBRFMsQ0FBWDtZQUdBLEVBQUEsQ0FBRywwQ0FBSCxFQUErQyxTQUFBO2NBQzdDLE1BQUEsQ0FBTztnQkFBQyxHQUFELEVBQU07a0JBQUEsTUFBQSxFQUFRLEtBQVI7aUJBQU47ZUFBUCxFQUE2QjtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQTdCO3FCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFaO1lBRjZDLENBQS9DO1lBSUEsRUFBQSxDQUFHLGtGQUFILEVBQXVGLFNBQUE7Y0FDckYsUUFBUSxDQUFDLEdBQVQsQ0FBYSxxQkFBYixFQUFvQyxLQUFwQztjQUNBLE1BQUEsQ0FBTztnQkFBQyxHQUFELEVBQU07a0JBQUEsTUFBQSxFQUFRLEtBQVI7aUJBQU47ZUFBUCxFQUE2QjtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQTdCO3FCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFaO1lBSHFGLENBQXZGO21CQUtBLEVBQUEsQ0FBRyxrRkFBSCxFQUF1RixTQUFBO2NBQ3JGLFFBQVEsQ0FBQyxHQUFULENBQWEscUJBQWIsRUFBb0MsSUFBcEM7Y0FDQSxNQUFBLENBQU87Z0JBQUMsR0FBRCxFQUFNO2tCQUFBLE1BQUEsRUFBUSxLQUFSO2lCQUFOO2VBQVAsRUFBNkI7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUE3QjtxQkFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2dCQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7ZUFBWjtZQUhxRixDQUF2RjtVQWJnRCxDQUFsRDtRQTlCMkIsQ0FBN0I7UUFnREEsUUFBQSxDQUFTLFdBQVQsRUFBc0IsU0FBQTtpQkFDcEIsRUFBQSxDQUFHLHFDQUFILEVBQTBDLFNBQUE7WUFDeEMsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFKO1lBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBWjtZQUNBLEdBQUEsQ0FBSTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBSjttQkFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFaO1VBSndDLENBQTFDO1FBRG9CLENBQXRCO1FBT0EsUUFBQSxDQUFTLCtCQUFULEVBQTBDLFNBQUE7VUFDeEMsVUFBQSxDQUFXLFNBQUE7bUJBQ1QsU0FBQSxDQUFVO2NBQUMsR0FBRCxFQUFNO2dCQUFBLE1BQUEsRUFBUSxLQUFSO2VBQU47YUFBVjtVQURTLENBQVg7VUFHQSxFQUFBLENBQUcsdUNBQUgsRUFBNEMsU0FBQTttQkFDMUMsTUFBQSxDQUFPO2NBQUMsR0FBRCxFQUFNO2dCQUFBLE1BQUEsRUFBUSxFQUFSO2VBQU47YUFBUCxFQUEwQjtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBMUI7VUFEMEMsQ0FBNUM7VUFHQSxFQUFBLENBQUcsaUNBQUgsRUFBc0MsU0FBQTttQkFDcEMsTUFBQSxDQUFPO2NBQUMsR0FBRCxFQUFNO2dCQUFBLE1BQUEsRUFBUSxHQUFSO2VBQU47YUFBUCxFQUEyQjtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBM0I7VUFEb0MsQ0FBdEM7VUFHQSxRQUFBLENBQVMsa0JBQVQsRUFBNkIsU0FBQTttQkFDM0IsRUFBQSxDQUFHLHlCQUFILEVBQThCLFNBQUE7cUJBQzVCLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFaO1lBRDRCLENBQTlCO1VBRDJCLENBQTdCO2lCQUlBLFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO21CQUMzQixFQUFBLENBQUcsbUNBQUgsRUFBd0MsU0FBQTtjQUN0QyxHQUFBLENBQUk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFKO2NBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQVo7cUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQVo7WUFIc0MsQ0FBeEM7VUFEMkIsQ0FBN0I7UUFkd0MsQ0FBMUM7ZUFvQkEsUUFBQSxDQUFTLFdBQVQsRUFBc0IsU0FBQTtVQUNwQixFQUFBLENBQUcseUJBQUgsRUFBOEIsU0FBQTttQkFDNUIsTUFBQSxDQUFPO2NBQUMsS0FBRCxFQUFRO2dCQUFBLE1BQUEsRUFBUSxLQUFSO2VBQVI7YUFBUCxFQUErQjtjQUFBLElBQUEsRUFBTSxpQkFBTjthQUEvQjtVQUQ0QixDQUE5QjtpQkFHQSxFQUFBLENBQUcsa0NBQUgsRUFBdUMsU0FBQTttQkFDckMsTUFBQSxDQUFPO2NBQUMsS0FBRCxFQUFRO2dCQUFBLE1BQUEsRUFBUSxLQUFSO2VBQVIsRUFBdUIsR0FBdkI7YUFBUCxFQUNFO2NBQUEsSUFBQSxFQUFNLE9BQU47YUFERjtVQURxQyxDQUF2QztRQUpvQixDQUF0QjtNQXJJc0IsQ0FBeEI7TUE2SUEsUUFBQSxDQUFTLG9CQUFULEVBQStCLFNBQUE7UUFDN0IsRUFBQSxDQUFHLDREQUFILEVBQWlFLFNBQUE7aUJBQy9ELE1BQUEsQ0FBTztZQUFDLEdBQUQsRUFBTTtjQUFBLE1BQUEsRUFBUSxLQUFSO2FBQU47V0FBUCxFQUE2QjtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBN0I7UUFEK0QsQ0FBakU7UUFHQSxFQUFBLENBQUcsdUNBQUgsRUFBNEMsU0FBQTtVQUMxQyxHQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0sc0JBQU47WUFDQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURSO1dBREY7VUFHQSxNQUFBLENBQU87WUFBQyxHQUFELEVBQU07Y0FBQSxNQUFBLEVBQVEsR0FBUjthQUFOO1dBQVAsRUFBMkI7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQTNCO2lCQUNBLE1BQUEsQ0FBTztZQUFDLEdBQUQsRUFBTTtjQUFBLE1BQUEsRUFBUSxHQUFSO2FBQU47V0FBUCxFQUEyQjtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBM0I7UUFMMEMsQ0FBNUM7ZUFPQSxRQUFBLENBQVMsV0FBVCxFQUFzQixTQUFBO1VBQ3BCLFVBQUEsQ0FBVyxTQUFBO21CQUNULFNBQUEsQ0FBVTtjQUFDLEdBQUQsRUFBTTtnQkFBQSxNQUFBLEVBQVEsS0FBUjtlQUFOO2FBQVY7VUFEUyxDQUFYO1VBR0EsRUFBQSxDQUFHLG1EQUFILEVBQXdELFNBQUE7bUJBQ3RELE1BQUEsQ0FBTztjQUFDLEdBQUQsRUFBTTtnQkFBQSxNQUFBLEVBQVEsRUFBUjtlQUFOO2FBQVAsRUFBMEI7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2FBQTFCO1VBRHNELENBQXhEO1VBR0EsRUFBQSxDQUFHLDZDQUFILEVBQWtELFNBQUE7bUJBQ2hELE1BQUEsQ0FBTztjQUFDLEdBQUQsRUFBTTtnQkFBQSxNQUFBLEVBQVEsR0FBUjtlQUFOO2FBQVAsRUFBMkI7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2FBQTNCO1VBRGdELENBQWxEO1VBR0EsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7bUJBQzNCLEVBQUEsQ0FBRyxtQ0FBSCxFQUF3QyxTQUFBO2NBQ3RDLEdBQUEsQ0FBSTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQUo7cUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQVo7WUFGc0MsQ0FBeEM7VUFEMkIsQ0FBN0I7aUJBS0EsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7bUJBQzNCLEVBQUEsQ0FBRyxrQ0FBSCxFQUF1QyxTQUFBO2NBQ3JDLEdBQUEsQ0FBSTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQUo7cUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQVo7WUFGcUMsQ0FBdkM7VUFEMkIsQ0FBN0I7UUFmb0IsQ0FBdEI7TUFYNkIsQ0FBL0I7TUErQkEsUUFBQSxDQUFTLHNCQUFULEVBQWlDLFNBQUE7QUFDL0IsWUFBQTtRQUFBLFdBQUEsR0FBYztRQUNkLGlCQUFBLEdBQW9CLFNBQUMsT0FBRCxFQUFVLEdBQVY7QUFDbEIsY0FBQTtVQUQ2QixPQUFEO1VBQzVCLFFBQUEsQ0FBUyxXQUFULEVBQXNCLE9BQXRCO2lCQUNBLE1BQUEsQ0FBTyxXQUFXLENBQUMsUUFBWixDQUFBLENBQXNCLENBQUMsT0FBdkIsQ0FBQSxDQUFQLENBQXdDLENBQUMsT0FBekMsQ0FBaUQsSUFBakQ7UUFGa0I7UUFJcEIsVUFBQSxDQUFXLFNBQUE7VUFDVCxNQUFBLENBQU87WUFBQyxHQUFELEVBQU07Y0FBQSxNQUFBLEVBQVEsS0FBUjthQUFOO1dBQVAsRUFBNkI7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQTdCO1VBQ0EsTUFBQSxDQUFPO1lBQUMsR0FBRCxFQUFNO2NBQUEsTUFBQSxFQUFRLEtBQVI7YUFBTjtXQUFQLEVBQTZCO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUE3QjtpQkFDQSxXQUFBLEdBQWMsUUFBUSxDQUFDLFdBQVcsQ0FBQztRQUgxQixDQUFYO1FBS0EsRUFBQSxDQUFHLDhDQUFILEVBQW1ELFNBQUE7VUFDakQsU0FBQSxDQUFVLEdBQVY7VUFDQSxpQkFBQSxDQUFrQixjQUFsQixFQUFrQztZQUFBLElBQUEsRUFBTSxLQUFOO1dBQWxDO1VBQ0EsaUJBQUEsQ0FBa0IsY0FBbEIsRUFBa0M7WUFBQSxJQUFBLEVBQU0sS0FBTjtXQUFsQztpQkFDQSxpQkFBQSxDQUFrQixjQUFsQixFQUFrQztZQUFBLElBQUEsRUFBTSxLQUFOO1dBQWxDO1FBSmlELENBQW5EO2VBTUEsRUFBQSxDQUFHLHNEQUFILEVBQTJELFNBQUE7VUFDekQsU0FBQSxDQUFVLEdBQVY7VUFDQSxpQkFBQSxDQUFrQixjQUFsQixFQUFrQztZQUFBLElBQUEsRUFBTSxLQUFOO1dBQWxDO1VBQ0EsaUJBQUEsQ0FBa0IsY0FBbEIsRUFBa0M7WUFBQSxJQUFBLEVBQU0sS0FBTjtXQUFsQztVQUNBLGlCQUFBLENBQWtCLGdCQUFsQixFQUFvQztZQUFBLElBQUEsRUFBTSxLQUFOO1dBQXBDO2lCQUNBLGlCQUFBLENBQWtCLGdCQUFsQixFQUFvQztZQUFBLElBQUEsRUFBTSxFQUFOO1dBQXBDO1FBTHlELENBQTNEO01BakIrQixDQUFqQzthQXdCQSxRQUFBLENBQVMsaUJBQVQsRUFBNEIsU0FBQTtBQUMxQixZQUFBO1FBQUEsYUFBQSxHQUFnQixTQUFDLE1BQUQ7aUJBQ2QsTUFBTSxDQUFDLG9CQUFQLENBQTRCLE1BQU0sQ0FBQyxjQUFQLENBQUEsQ0FBNUI7UUFEYztRQUdoQixzQkFBQSxHQUF5QixTQUFDLE9BQUQ7QUFDdkIsY0FBQTtVQUFBLE9BQUEsR0FBVSxRQUFRLENBQUMsZUFBZSxDQUFDLFVBQXpCLENBQUE7VUFDVixJQUFHLHNCQUFIO1lBQ0UsTUFBQSxDQUFPLE9BQVAsQ0FBZSxDQUFDLFlBQWhCLENBQTZCLE9BQU8sQ0FBQyxNQUFyQyxFQURGOztVQUdBLElBQUcsb0JBQUg7WUFDRSxJQUFBLEdBQU8sT0FBTyxDQUFDLEdBQVIsQ0FBWSxTQUFDLE1BQUQ7cUJBQVksYUFBQSxDQUFjLE1BQWQ7WUFBWixDQUFaO1lBQ1AsTUFBQSxDQUFPLElBQVAsQ0FBWSxDQUFDLE9BQWIsQ0FBcUIsT0FBTyxDQUFDLElBQTdCLEVBRkY7O1VBSUEsSUFBRyxvQkFBSDttQkFDRSxNQUFBLENBQU87Y0FBQyxJQUFBLEVBQU0sT0FBTyxDQUFDLElBQWY7YUFBUCxFQURGOztRQVR1QjtRQVl6QixVQUFBLENBQVcsU0FBQTtVQUNULE9BQU8sQ0FBQyxXQUFSLENBQW9CLE9BQUEsQ0FBUSxJQUFJLENBQUMsU0FBYixDQUFwQjtVQUNBLFFBQVEsQ0FBQyxHQUFULENBQWEsaUJBQWIsRUFBZ0MsSUFBaEM7VUFDQSxNQUFBLENBQU8sUUFBUSxDQUFDLGVBQWUsQ0FBQyxVQUF6QixDQUFBLENBQVAsQ0FBNkMsQ0FBQyxJQUE5QyxDQUFtRCxLQUFuRDtpQkFDQSxNQUFBLENBQU87WUFBQyxHQUFELEVBQU07Y0FBQSxNQUFBLEVBQVEsS0FBUjthQUFOO1dBQVAsRUFBNkI7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQTdCO1FBSlMsQ0FBWDtRQU1BLFFBQUEsQ0FBUyw4QkFBVCxFQUF5QyxTQUFBO2lCQUN2QyxFQUFBLENBQUcsOEJBQUgsRUFBbUMsU0FBQTtZQUNqQyxzQkFBQSxDQUF1QjtjQUFBLE1BQUEsRUFBUSxDQUFSO2NBQVcsSUFBQSxFQUFNLENBQUMsS0FBRCxFQUFRLEtBQVIsQ0FBakI7Y0FBaUMsSUFBQSxFQUFNLFFBQXZDO2FBQXZCO1lBQ0EsUUFBQSxDQUFTLGFBQVQsRUFBd0Isc0NBQXhCO21CQUNBLE1BQUEsQ0FBTyxRQUFRLENBQUMsZUFBZSxDQUFDLFVBQXpCLENBQUEsQ0FBUCxDQUE2QyxDQUFDLElBQTlDLENBQW1ELEtBQW5EO1VBSGlDLENBQW5DO1FBRHVDLENBQXpDO2VBTUEsUUFBQSxDQUFTLHVDQUFULEVBQWtELFNBQUE7VUFDaEQsUUFBQSxDQUFTLGlCQUFULEVBQTRCLFNBQUE7bUJBQzFCLEVBQUEsQ0FBRyxnQ0FBSCxFQUFxQyxTQUFBO2NBQ25DLHNCQUFBLENBQXVCO2dCQUFBLE1BQUEsRUFBUSxDQUFSO2dCQUFXLElBQUEsRUFBTSxDQUFDLEtBQUQsRUFBUSxLQUFSLENBQWpCO2dCQUFpQyxJQUFBLEVBQU0sUUFBdkM7ZUFBdkI7Y0FDQSxRQUFBLENBQVMsYUFBVCxFQUF3QixpQ0FBeEI7cUJBQ0Esc0JBQUEsQ0FBdUI7Z0JBQUEsTUFBQSxFQUFRLENBQVI7Z0JBQVcsSUFBQSxFQUFNLENBQUMsS0FBRCxFQUFRLEtBQVIsQ0FBakI7Z0JBQWlDLElBQUEsRUFBTSxRQUF2QztlQUF2QjtZQUhtQyxDQUFyQztVQUQwQixDQUE1QjtpQkFNQSxRQUFBLENBQVMsY0FBVCxFQUF5QixTQUFBO21CQUN2QixFQUFBLENBQUcsK0NBQUgsRUFBb0QsU0FBQTtjQUNsRCxRQUFRLENBQUMsR0FBVCxDQUFhLHVDQUFiLEVBQXNELElBQXREO2NBQ0Esc0JBQUEsQ0FBdUI7Z0JBQUEsTUFBQSxFQUFRLENBQVI7Z0JBQVcsSUFBQSxFQUFNLENBQUMsS0FBRCxFQUFRLEtBQVIsQ0FBakI7Z0JBQWlDLElBQUEsRUFBTSxRQUF2QztlQUF2QjtjQUNBLFFBQUEsQ0FBUyxhQUFULEVBQXdCLGlDQUF4QjtjQUNBLE1BQUEsQ0FBTyxRQUFRLENBQUMsZUFBZSxDQUFDLFVBQXpCLENBQUEsQ0FBUCxDQUE2QyxDQUFDLElBQTlDLENBQW1ELEtBQW5EO3FCQUNBLE1BQUEsQ0FBTztnQkFBQSxJQUFBLEVBQU0sUUFBTjtlQUFQO1lBTGtELENBQXBEO1VBRHVCLENBQXpCO1FBUGdELENBQWxEO01BNUIwQixDQUE1QjtJQXZOMkIsQ0FBN0I7SUFrUUEsUUFBQSxDQUFTLG1CQUFULEVBQThCLFNBQUE7TUFDNUIsVUFBQSxDQUFXLFNBQUE7UUFDVCxRQUFRLENBQUMsR0FBVCxDQUFhLG1CQUFiLEVBQWtDLElBQWxDO2VBQ0EsT0FBTyxDQUFDLFdBQVIsQ0FBb0IsT0FBQSxDQUFRLElBQUksQ0FBQyxTQUFiLENBQXBCO01BRlMsQ0FBWDtNQUlBLFFBQUEsQ0FBUyx1QkFBVCxFQUFrQyxTQUFBO1FBQ2hDLFVBQUEsQ0FBVyxTQUFBO2lCQUNULEdBQUEsQ0FDRTtZQUFBLElBQUEsRUFBTSw0Q0FBTjtZQU1BLE1BQUEsRUFBUSxDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBVCxDQU5SO1dBREY7UUFEUyxDQUFYO1FBVUEsRUFBQSxDQUFHLHFDQUFILEVBQTBDLFNBQUE7aUJBQ3hDLE1BQUEsQ0FBTztZQUFDLEdBQUQsRUFBTTtjQUFBLE1BQUEsRUFBUSxLQUFSO2FBQU47V0FBUCxFQUE2QjtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBVCxDQUFSO1dBQTdCO1FBRHdDLENBQTFDO1FBRUEsRUFBQSxDQUFHLHVEQUFILEVBQTRELFNBQUE7aUJBQzFELE1BQUEsQ0FBTztZQUFDLEtBQUQsRUFBUTtjQUFBLE1BQUEsRUFBUSxLQUFSO2FBQVI7V0FBUCxFQUErQjtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBVCxDQUFSO1dBQS9CO1FBRDBELENBQTVEO1FBR0EsRUFBQSxDQUFHLHNDQUFILEVBQTJDLFNBQUE7aUJBQ3pDLE1BQUEsQ0FBTztZQUFDLEdBQUQsRUFBTTtjQUFBLE1BQUEsRUFBUSxLQUFSO2FBQU47V0FBUCxFQUE2QjtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBVCxDQUFSO1dBQTdCO1FBRHlDLENBQTNDO2VBRUEsRUFBQSxDQUFHLHVEQUFILEVBQTRELFNBQUE7aUJBQzFELE1BQUEsQ0FBTztZQUFDLEtBQUQsRUFBUTtjQUFBLE1BQUEsRUFBUSxLQUFSO2FBQVI7V0FBUCxFQUErQjtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBVCxDQUFSO1dBQS9CO1FBRDBELENBQTVEO01BbEJnQyxDQUFsQzthQXFCQSxRQUFBLENBQVMsZ0NBQVQsRUFBMkMsU0FBQTtRQUN6QyxVQUFBLENBQVcsU0FBQTtVQUNULFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBdkIsQ0FBQTtpQkFDQSxHQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0sZ0RBQU47V0FERjtRQUZTLENBQVg7UUFXQSxFQUFBLENBQUcseUNBQUgsRUFBOEMsU0FBQTtVQUM1QyxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFDQSxNQUFBLENBQU87WUFBQyxHQUFELEVBQU07Y0FBQSxNQUFBLEVBQVEsRUFBUjthQUFOO1dBQVAsRUFBMEI7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQTFCO2lCQUNBLE1BQUEsQ0FBTztZQUFDLEdBQUQsRUFBTTtjQUFBLE1BQUEsRUFBUSxFQUFSO2FBQU47V0FBUCxFQUEwQjtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBMUI7UUFINEMsQ0FBOUM7UUFLQSxFQUFBLENBQUcsMEJBQUgsRUFBK0IsU0FBQTtVQUM3QixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFDQSxNQUFBLENBQU87WUFBQyxHQUFELEVBQU07Y0FBQSxNQUFBLEVBQVEsS0FBUjthQUFOO1dBQVAsRUFBNkI7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQTdCO1VBQ0EsTUFBQSxDQUFPO1lBQUMsR0FBRCxFQUFNO2NBQUEsTUFBQSxFQUFRLEVBQVI7YUFBTjtXQUFQLEVBQTBCO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUExQjtpQkFDQSxNQUFBLENBQU87WUFBQyxLQUFELEVBQVE7Y0FBQSxNQUFBLEVBQVEsRUFBUjthQUFSO1dBQVAsRUFBNEI7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQTVCO1FBSjZCLENBQS9CO2VBTUEsRUFBQSxDQUFHLDJCQUFILEVBQWdDLFNBQUE7VUFDOUIsR0FBQSxDQUFJO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFKO1VBQ0EsTUFBQSxDQUFPO1lBQUMsR0FBRCxFQUFNO2NBQUEsTUFBQSxFQUFRLEtBQVI7YUFBTjtXQUFQLEVBQTZCO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUE3QjtVQUNBLE1BQUEsQ0FBTztZQUFDLEdBQUQsRUFBTTtjQUFBLE1BQUEsRUFBUSxFQUFSO2FBQU47V0FBUCxFQUEwQjtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBMUI7aUJBQ0EsTUFBQSxDQUFPO1lBQUMsS0FBRCxFQUFRO2NBQUEsTUFBQSxFQUFRLEVBQVI7YUFBUjtXQUFQLEVBQTRCO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUE1QjtRQUo4QixDQUFoQztNQXZCeUMsQ0FBM0M7SUExQjRCLENBQTlCO0lBdURBLFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO01BQzNCLFVBQUEsQ0FBVyxTQUFBO2VBQ1QsR0FBQSxDQUNFO1VBQUEsSUFBQSxFQUFNLHVCQUFOO1VBQ0EsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEZDtTQURGO01BRFMsQ0FBWDtNQUtBLFFBQUEsQ0FBUyxhQUFULEVBQXdCLFNBQUE7UUFDdEIsRUFBQSxDQUFHLHNEQUFILEVBQTJELFNBQUE7aUJBQ3pELE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO1dBQVo7UUFEeUQsQ0FBM0Q7UUFHQSxFQUFBLENBQUcsd0JBQUgsRUFBNkIsU0FBQTtVQUMzQixNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDtXQUFaO2lCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO1dBQVo7UUFGMkIsQ0FBN0I7UUFJQSxFQUFBLENBQUcsbUZBQUgsRUFBd0YsU0FBQTtVQUN0RixHQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0sK0JBQU47WUFDQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURkO1dBREY7aUJBR0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7V0FBWjtRQUpzRixDQUF4RjtRQU1BLFFBQUEsQ0FBUywrQ0FBVCxFQUEwRCxTQUFBO1VBQ3hELEVBQUEsQ0FBRywyRkFBSCxFQUFnRyxTQUFBO1lBQzlGLEdBQUEsQ0FDRTtjQUFBLElBQUEsRUFBTSx3QkFBTjtjQU1BLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBTmQ7YUFERjttQkFRQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDthQUFaO1VBVDhGLENBQWhHO1VBV0EsRUFBQSxDQUFHLDZEQUFILEVBQWtFLFNBQUE7WUFDaEUsR0FBQSxDQUNFO2NBQUEsSUFBQSxFQUFNLHlCQUFOO2NBTUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FOZDthQURGO21CQVFBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Y0FBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO2FBQVo7VUFUZ0UsQ0FBbEU7aUJBV0EsRUFBQSxDQUFHLDhDQUFILEVBQW1ELFNBQUE7WUFDakQsR0FBQSxDQUNFO2NBQUEsSUFBQSxFQUFNLHVCQUFOO2NBQ0EsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEZDthQURGO21CQUdBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Y0FBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO2FBQVo7VUFKaUQsQ0FBbkQ7UUF2QndELENBQTFEO1FBNkJBLFFBQUEsQ0FBUyx3Q0FBVCxFQUFtRCxTQUFBO2lCQUNqRCxFQUFBLENBQUcsZ0NBQUgsRUFBcUMsU0FBQTtZQUNuQyxHQUFBLENBQ0U7Y0FBQSxJQUFBLEVBQU0sd0JBQU47Y0FDQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURkO2FBREY7bUJBR0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7YUFBWjtVQUptQyxDQUFyQztRQURpRCxDQUFuRDtRQU9BLFFBQUEsQ0FBUyw4QkFBVCxFQUF5QyxTQUFBO2lCQUN2QyxFQUFBLENBQUcsaUNBQUgsRUFBc0MsU0FBQTtZQUNwQyxHQUFBLENBQ0U7Y0FBQSxJQUFBLEVBQU0sMkJBQU47Y0FDQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURkO2FBREY7bUJBR0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7YUFBWjtVQUpvQyxDQUF0QztRQUR1QyxDQUF6QztlQU9BLFFBQUEsQ0FBUyx1QkFBVCxFQUFrQyxTQUFBO2lCQUNoQyxFQUFBLENBQUcsNkJBQUgsRUFBa0MsU0FBQTtZQUNoQyxHQUFBLENBQ0U7Y0FBQSxJQUFBLEVBQU0sbUJBQU47Y0FDQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURkO2FBREY7bUJBR0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7YUFBWjtVQUpnQyxDQUFsQztRQURnQyxDQUFsQztNQXpEc0IsQ0FBeEI7YUFnRUEsUUFBQSxDQUFTLHlCQUFULEVBQW9DLFNBQUE7UUFDbEMsVUFBQSxDQUFXLFNBQUE7aUJBQ1QsR0FBQSxDQUNFO1lBQUEsSUFBQSxFQUFNLHlCQUFOO1lBT0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FQUjtXQURGO1FBRFMsQ0FBWDtRQVdBLEVBQUEsQ0FBRyxrRkFBSCxFQUF1RixTQUFBO1VBQ3JGLE1BQUEsQ0FBTyxRQUFRLENBQUMsR0FBVCxDQUFhLGdDQUFiLENBQVAsQ0FBc0QsQ0FBQyxJQUF2RCxDQUE0RCxLQUE1RDtVQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO1dBQVo7aUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7V0FBWjtRQUhxRixDQUF2RjtRQUtBLEVBQUEsQ0FBRyxzRUFBSCxFQUEyRSxTQUFBO1VBQ3pFLFFBQVEsQ0FBQyxHQUFULENBQWEsZ0NBQWIsRUFBK0MsSUFBL0M7VUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDtXQUFaO1VBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7V0FBWjtVQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO1dBQVo7aUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7V0FBWjtRQUx5RSxDQUEzRTtlQU9BLFFBQUEsQ0FBUyw2Q0FBVCxFQUF3RCxTQUFBO1VBQ3RELFVBQUEsQ0FBVyxTQUFBO21CQUNULFFBQVEsQ0FBQyxHQUFULENBQWEsa0NBQWIsRUFBaUQsSUFBakQ7VUFEUyxDQUFYO1VBR0EsRUFBQSxDQUFHLHdFQUFILEVBQTZFLFNBQUE7WUFDM0UsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFKO1lBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7YUFBWjttQkFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDthQUFaO1VBSDJFLENBQTdFO2lCQUtBLEVBQUEsQ0FBRyw4RUFBSCxFQUFtRixTQUFBO1lBQ2pGLEdBQUEsQ0FBSTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBSjtZQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Y0FBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO2FBQVo7WUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDthQUFaO1lBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7YUFBWjttQkFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDthQUFaO1VBTGlGLENBQW5GO1FBVHNELENBQXhEO01BeEJrQyxDQUFwQztJQXRFMkIsQ0FBN0I7SUE4R0EsUUFBQSxDQUFTLHFCQUFULEVBQWdDLFNBQUE7TUFDOUIsUUFBQSxDQUFTLGFBQVQsRUFBd0IsU0FBQTtRQUN0QixFQUFBLENBQUcsMERBQUgsRUFBK0QsU0FBQTtVQUM3RCxHQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0sdUJBQU47WUFDQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURkO1dBREY7aUJBR0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7V0FBWjtRQUo2RCxDQUEvRDtRQU1BLEVBQUEsQ0FBRyxnQkFBSCxFQUFxQixTQUFBO1VBQ25CLEdBQUEsQ0FDRTtZQUFBLElBQUEsRUFBTSw0QkFBTjtZQUNBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBRGQ7V0FERjtVQUdBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO1dBQVo7VUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDtXQUFaO2lCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO1dBQVo7UUFObUIsQ0FBckI7UUFRQSxFQUFBLENBQUcsbUZBQUgsRUFBd0YsU0FBQTtVQUN0RixHQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0sK0JBQU47WUFDQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURkO1dBREY7aUJBR0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7V0FBWjtRQUpzRixDQUF4RjtRQU1BLFFBQUEsQ0FBUyxnREFBVCxFQUEyRCxTQUFBO1VBQ3pELEVBQUEsQ0FBRyxzREFBSCxFQUEyRCxTQUFBO1lBQ3pELEdBQUEsQ0FDRTtjQUFBLElBQUEsRUFBTSx3QkFBTjtjQUNBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBRGQ7YUFERjttQkFHQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDthQUFaO1VBSnlELENBQTNEO2lCQU1BLEVBQUEsQ0FBRyw4Q0FBSCxFQUFtRCxTQUFBO1lBQ2pELEdBQUEsQ0FDRTtjQUFBLElBQUEsRUFBTSx1QkFBTjtjQUNBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBRGQ7YUFERjttQkFHQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDthQUFaO1VBSmlELENBQW5EO1FBUHlELENBQTNEO2VBYUEsUUFBQSxDQUFTLHdDQUFULEVBQW1ELFNBQUE7aUJBQ2pELEVBQUEsQ0FBRyxnQ0FBSCxFQUFxQyxTQUFBO1lBQ25DLEdBQUEsQ0FDRTtjQUFBLElBQUEsRUFBTSx3QkFBTjtjQUNBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBRGQ7YUFERjttQkFHQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDthQUFaO1VBSm1DLENBQXJDO1FBRGlELENBQW5EO01BbENzQixDQUF4QjthQXlDQSxRQUFBLENBQVMseUJBQVQsRUFBb0MsU0FBQTtRQUNsQyxVQUFBLENBQVcsU0FBQTtpQkFDVCxHQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0seUJBQU47WUFPQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQVBSO1dBREY7UUFEUyxDQUFYO1FBV0EsRUFBQSxDQUFHLGtGQUFILEVBQXVGLFNBQUE7VUFDckYsTUFBQSxDQUFPLFFBQVEsQ0FBQyxHQUFULENBQWEsZ0NBQWIsQ0FBUCxDQUFzRCxDQUFDLElBQXZELENBQTRELEtBQTVEO1VBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7V0FBWjtpQkFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDtXQUFaO1FBSHFGLENBQXZGO1FBS0EsRUFBQSxDQUFHLHNFQUFILEVBQTJFLFNBQUE7VUFDekUsUUFBUSxDQUFDLEdBQVQsQ0FBYSxnQ0FBYixFQUErQyxJQUEvQztVQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO1dBQVo7VUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDtXQUFaO1VBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7V0FBWjtpQkFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDtXQUFaO1FBTHlFLENBQTNFO2VBT0EsUUFBQSxDQUFTLDZDQUFULEVBQXdELFNBQUE7VUFDdEQsVUFBQSxDQUFXLFNBQUE7bUJBQ1QsUUFBUSxDQUFDLEdBQVQsQ0FBYSxrQ0FBYixFQUFpRCxJQUFqRDtVQURTLENBQVg7VUFHQSxFQUFBLENBQUcsd0VBQUgsRUFBNkUsU0FBQTtZQUMzRSxHQUFBLENBQUk7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2FBQUo7WUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDthQUFaO21CQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Y0FBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO2FBQVo7VUFIMkUsQ0FBN0U7aUJBS0EsRUFBQSxDQUFHLDhFQUFILEVBQW1GLFNBQUE7WUFDakYsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFKO1lBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7YUFBWjtZQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Y0FBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO2FBQVo7WUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDthQUFaO1lBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7YUFBWjttQkFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDthQUFaO1VBTmlGLENBQW5GO1FBVHNELENBQXhEO01BeEJrQyxDQUFwQztJQTFDOEIsQ0FBaEM7V0FvRkEsUUFBQSxDQUFTLGNBQVQsRUFBeUIsU0FBQTtNQUN2QixRQUFBLENBQVMsYUFBVCxFQUF3QixTQUFBO1FBQ3RCLFVBQUEsQ0FBVyxTQUFBO2lCQUNULEdBQUEsQ0FBSTtZQUFBLElBQUEsRUFBTSxPQUFOO1dBQUo7UUFEUyxDQUFYO1FBRUEsUUFBQSxDQUFTLG9CQUFULEVBQStCLFNBQUE7VUFDN0IsVUFBQSxDQUFXLFNBQUE7bUJBQ1QsR0FBQSxDQUFJO2NBQUEsSUFBQSxFQUFNLFNBQU47YUFBSjtVQURTLENBQVg7VUFFQSxFQUFBLENBQUcseUNBQUgsRUFBOEMsU0FBQTtZQUM1QyxHQUFBLENBQUk7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2FBQUo7bUJBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBYztjQUFBLElBQUEsRUFBTSxNQUFOO2FBQWQ7VUFGNEMsQ0FBOUM7aUJBR0EsRUFBQSxDQUFHLHlDQUFILEVBQThDLFNBQUE7WUFDNUMsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFKO21CQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Y0FBQSxJQUFBLEVBQU0sTUFBTjthQUFkO1VBRjRDLENBQTlDO1FBTjZCLENBQS9CO1FBU0EsUUFBQSxDQUFTLHdCQUFULEVBQW1DLFNBQUE7VUFDakMsRUFBQSxDQUFHLGlEQUFILEVBQXNELFNBQUE7WUFDcEQsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFKO1lBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBWjttQkFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFaO1VBSG9ELENBQXREO2lCQUlBLEVBQUEsQ0FBRywrQ0FBSCxFQUFvRCxTQUFBO1lBQ2xELEdBQUEsQ0FBSTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBSjtZQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2FBQVo7bUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBWjtVQUhrRCxDQUFwRDtRQUxpQyxDQUFuQztRQVNBLFFBQUEsQ0FBUyw0QkFBVCxFQUF1QyxTQUFBO1VBQ3JDLFVBQUEsQ0FBVyxTQUFBO21CQUNULEdBQUEsQ0FDRTtjQUFBLElBQUEsRUFBTSxPQUFOO2NBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjthQURGO1VBRFMsQ0FBWDtpQkFJQSxFQUFBLENBQUcsbUJBQUgsRUFBd0IsU0FBQTttQkFDdEIsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBWjtVQURzQixDQUF4QjtRQUxxQyxDQUF2QztRQU9BLFFBQUEsQ0FBUyw0QkFBVCxFQUF1QyxTQUFBO1VBQ3JDLFVBQUEsQ0FBVyxTQUFBO21CQUNULEdBQUEsQ0FDRTtjQUFBLElBQUEsRUFBTSxTQUFOO2NBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjthQURGO1VBRFMsQ0FBWDtpQkFJQSxFQUFBLENBQUcsbUJBQUgsRUFBd0IsU0FBQTttQkFDdEIsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBWjtVQURzQixDQUF4QjtRQUxxQyxDQUF2QztRQU9BLFFBQUEsQ0FBUyw0QkFBVCxFQUF1QyxTQUFBO1VBQ3JDLFVBQUEsQ0FBVyxTQUFBO21CQUNULEdBQUEsQ0FDRTtjQUFBLElBQUEsRUFBTSxXQUFOO2NBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjthQURGO1VBRFMsQ0FBWDtpQkFJQSxFQUFBLENBQUcsY0FBSCxFQUFtQixTQUFBO21CQUNqQixNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFaO1VBRGlCLENBQW5CO1FBTHFDLENBQXZDO2VBT0EsUUFBQSxDQUFTLFlBQVQsRUFBdUIsU0FBQTtVQUNyQixVQUFBLENBQVcsU0FBQTttQkFDVCxHQUFBLENBQ0U7Y0FBQSxJQUFBLEVBQU0sd0JBQU47YUFERjtVQURTLENBQVg7VUFRQSxRQUFBLENBQVMsZ0RBQVQsRUFBMkQsU0FBQTtZQUN6RCxFQUFBLENBQUcsY0FBSCxFQUFtQixTQUFBO2NBQ2pCLEdBQUEsQ0FBSTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQUo7cUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQVo7WUFGaUIsQ0FBbkI7bUJBR0EsRUFBQSxDQUFHLGNBQUgsRUFBbUIsU0FBQTtjQUNqQixHQUFBLENBQUk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFKO3FCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFaO1lBRmlCLENBQW5CO1VBSnlELENBQTNEO1VBT0EsUUFBQSxDQUFTLG9EQUFULEVBQStELFNBQUE7bUJBQzdELEVBQUEsQ0FBRyxzQkFBSCxFQUEyQixTQUFBO2NBQ3pCLEdBQUEsQ0FBSTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQUo7cUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQVo7WUFGeUIsQ0FBM0I7VUFENkQsQ0FBL0Q7VUFJQSxRQUFBLENBQVMsZ0RBQVQsRUFBMkQsU0FBQTttQkFDekQsRUFBQSxDQUFHLGNBQUgsRUFBbUIsU0FBQTtjQUNqQixHQUFBLENBQUk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFKO3FCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFaO1lBRmlCLENBQW5CO1VBRHlELENBQTNEO2lCQUlBLFFBQUEsQ0FBUyxxREFBVCxFQUFnRSxTQUFBO21CQUM5RCxFQUFBLENBQUcsc0JBQUgsRUFBMkIsU0FBQTtjQUN6QixHQUFBLENBQUk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFKO3FCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFaO1lBRnlCLENBQTNCO1VBRDhELENBQWhFO1FBeEJxQixDQUF2QjtNQTFDc0IsQ0FBeEI7TUF1RUEsUUFBQSxDQUFTLGNBQVQsRUFBeUIsU0FBQTtRQUN2QixVQUFBLENBQVcsU0FBQTtpQkFDVCxHQUFBLENBQUk7WUFBQSxJQUFBLEVBQU0sT0FBTjtXQUFKO1FBRFMsQ0FBWDtRQUVBLEVBQUEsQ0FBRyxpREFBSCxFQUFzRCxTQUFBO1VBQ3BELEdBQUEsQ0FBSTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBSjtVQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQVo7aUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtRQUhvRCxDQUF0RDtlQUlBLEVBQUEsQ0FBRywrQ0FBSCxFQUFvRCxTQUFBO1VBQ2xELEdBQUEsQ0FBSTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBSjtVQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQVo7aUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtRQUhrRCxDQUFwRDtNQVB1QixDQUF6QjtNQVlBLFFBQUEsQ0FBUyxlQUFULEVBQTBCLFNBQUE7UUFDeEIsVUFBQSxDQUFXLFNBQUE7aUJBQ1QsR0FBQSxDQUFJO1lBQUEsSUFBQSxFQUFNLE9BQU47V0FBSjtRQURTLENBQVg7UUFFQSxFQUFBLENBQUcsaURBQUgsRUFBc0QsU0FBQTtVQUNwRCxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFaO2lCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQVo7UUFIb0QsQ0FBdEQ7ZUFJQSxFQUFBLENBQUcsK0NBQUgsRUFBb0QsU0FBQTtVQUNsRCxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFaO2lCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQVo7UUFIa0QsQ0FBcEQ7TUFQd0IsQ0FBMUI7TUFZQSxRQUFBLENBQVMsbUJBQVQsRUFBOEIsU0FBQTtRQUM1QixVQUFBLENBQVcsU0FBQTtpQkFDVCxHQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0seUJBQU47V0FERjtRQURTLENBQVg7UUFNQSxFQUFBLENBQUcsaURBQUgsRUFBc0QsU0FBQTtVQUNwRCxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLEVBQUosQ0FBUjtXQUFaO1VBQ0EsR0FBQSxDQUFJO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLEVBQUosQ0FBUjtXQUFKO2lCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksRUFBSixDQUFSO1dBQVo7UUFKb0QsQ0FBdEQ7ZUFLQSxFQUFBLENBQUcscURBQUgsRUFBMEQsU0FBQTtVQUN4RCxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7aUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtRQUZ3RCxDQUExRDtNQVo0QixDQUE5QjthQWdCQSxRQUFBLENBQVMsaUNBQVQsRUFBNEMsU0FBQTtRQUMxQyxVQUFBLENBQVcsU0FBQTtpQkFDVCxHQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0sbURBQU47V0FERjtRQURTLENBQVg7UUFTQSxFQUFBLENBQUcseUVBQUgsRUFBOEUsU0FBQTtVQUM1RSxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFaO2lCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQVo7UUFINEUsQ0FBOUU7UUFJQSxFQUFBLENBQUcsMkNBQUgsRUFBZ0QsU0FBQTtVQUM5QyxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFaO2lCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQVo7UUFIOEMsQ0FBaEQ7ZUFJQSxFQUFBLENBQUcseUZBQUgsRUFBOEYsU0FBQTtVQUM1RixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFBb0IsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtVQUNwQixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFBb0IsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtVQUNwQixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFBb0IsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtVQUNwQixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFBb0IsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtVQUNwQixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFBb0IsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtVQUVwQixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFBb0IsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtVQUNwQixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFBb0IsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtVQUNwQixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFBb0IsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtVQUNwQixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFBb0IsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtVQUNwQixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFBb0IsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtVQUNwQixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7aUJBQW9CLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQVo7UUFad0UsQ0FBOUY7TUFsQjBDLENBQTVDO0lBaEh1QixDQUF6QjtFQXZnQndCLENBQTFCO0FBSEEiLCJzb3VyY2VzQ29udGVudCI6WyJ7Z2V0VmltU3RhdGUsIGRpc3BhdGNoLCBUZXh0RGF0YSwgZ2V0Vmlld30gPSByZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuLi9saWIvc2V0dGluZ3MnXG5cbmRlc2NyaWJlIFwiTW90aW9uIFNlYXJjaFwiLCAtPlxuICBbc2V0LCBlbnN1cmUsIGtleXN0cm9rZSwgZWRpdG9yLCBlZGl0b3JFbGVtZW50LCB2aW1TdGF0ZV0gPSBbXVxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICBnZXRWaW1TdGF0ZSAoc3RhdGUsIF92aW0pIC0+XG4gICAgICB2aW1TdGF0ZSA9IHN0YXRlICMgdG8gcmVmZXIgYXMgdmltU3RhdGUgbGF0ZXIuXG4gICAgICB7ZWRpdG9yLCBlZGl0b3JFbGVtZW50fSA9IHZpbVN0YXRlXG4gICAgICB7c2V0LCBlbnN1cmUsIGtleXN0cm9rZX0gPSBfdmltXG5cbiAgYWZ0ZXJFYWNoIC0+XG4gICAgdmltU3RhdGUucmVzZXROb3JtYWxNb2RlKClcblxuICBkZXNjcmliZSBcInRoZSAvIGtleWJpbmRpbmdcIiwgLT5cbiAgICBwYW5lID0gbnVsbFxuXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgcGFuZSA9IHthY3RpdmF0ZTogamFzbWluZS5jcmVhdGVTcHkoXCJhY3RpdmF0ZVwiKX1cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGFiY1xuICAgICAgICAgICAgZGVmXG4gICAgICAgICAgICBhYmNcbiAgICAgICAgICAgIGRlZlxcblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgc3B5T24oYXRvbS53b3Jrc3BhY2UsICdnZXRBY3RpdmVQYW5lJykuYW5kUmV0dXJuKHBhbmUpXG5cbiAgICAgICMgY2xlYXIgc2VhcmNoIGhpc3RvcnlcbiAgICAgIHZpbVN0YXRlLnNlYXJjaEhpc3RvcnkuY2xlYXIoKVxuICAgICAgdmltU3RhdGUuZ2xvYmFsU3RhdGUuc2V0KCdjdXJyZW50U2VhcmNoJywgbnVsbClcblxuICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgc3BlY2lmaWVkIHNlYXJjaCBwYXR0ZXJuXCIsIC0+XG4gICAgICAgIGVuc3VyZSBbJy8nLCBzZWFyY2g6ICdkZWYnXSxcbiAgICAgICAgICBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBleHBlY3QocGFuZS5hY3RpdmF0ZSkudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICAgIGl0IFwibG9vcHMgYmFjayBhcm91bmRcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzMsIDBdXG4gICAgICAgIGVuc3VyZSBbJy8nLCBzZWFyY2g6ICdkZWYnXSwgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgaXQgXCJ1c2VzIGEgdmFsaWQgcmVnZXggYXMgYSByZWdleFwiLCAtPlxuICAgICAgICAjIEN5Y2xlIHRocm91Z2ggdGhlICdhYmMnIG9uIHRoZSBmaXJzdCBsaW5lIHdpdGggYSBjaGFyYWN0ZXIgcGF0dGVyblxuICAgICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnW2FiY10nXSwgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMCwgMl1cblxuICAgICAgaXQgXCJ1c2VzIGFuIGludmFsaWQgcmVnZXggYXMgYSBsaXRlcmFsIHN0cmluZ1wiLCAtPlxuICAgICAgICAjIEdvIHN0cmFpZ2h0IHRvIHRoZSBsaXRlcmFsIFthYmNcbiAgICAgICAgc2V0IHRleHQ6IFwiYWJjXFxuW2FiY11cXG5cIlxuICAgICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnW2FiYyddLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFsxLCAwXVxuXG4gICAgICBpdCBcInVzZXMgPyBhcyBhIGxpdGVyYWwgc3RyaW5nXCIsIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcImFiY1xcblthP2M/XFxuXCJcbiAgICAgICAgZW5zdXJlIFsnLycsIHNlYXJjaDogJz8nXSwgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMSwgNF1cblxuICAgICAgaXQgJ3dvcmtzIHdpdGggc2VsZWN0aW9uIGluIHZpc3VhbCBtb2RlJywgLT5cbiAgICAgICAgc2V0IHRleHQ6ICdvbmUgdHdvIHRocmVlJ1xuICAgICAgICBlbnN1cmUgWyd2IC8nLCBzZWFyY2g6ICd0aCddLCBjdXJzb3I6IFswLCA5XVxuICAgICAgICBlbnN1cmUgJ2QnLCB0ZXh0OiAnaHJlZSdcblxuICAgICAgaXQgJ2V4dGVuZHMgc2VsZWN0aW9uIHdoZW4gcmVwZWF0aW5nIHNlYXJjaCBpbiB2aXN1YWwgbW9kZScsIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBsaW5lMVxuICAgICAgICAgIGxpbmUyXG4gICAgICAgICAgbGluZTNcbiAgICAgICAgICBcIlwiXCJcblxuICAgICAgICBlbnN1cmUgWyd2IC8nLCBzZWFyY2g6ICdsaW5lJ10sXG4gICAgICAgICAgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1swLCAwXSwgWzEsIDFdXVxuICAgICAgICBlbnN1cmUgJ24nLFxuICAgICAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IFtbMCwgMF0sIFsyLCAxXV1cblxuICAgICAgaXQgJ3NlYXJjaGVzIHRvIHRoZSBjb3JyZWN0IGNvbHVtbiBpbiB2aXN1YWwgbGluZXdpc2UgbW9kZScsIC0+XG4gICAgICAgIGVuc3VyZSBbJ1YgLycsIHNlYXJjaDogJ2VmJ10sXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0OiBcImFiY1xcbmRlZlxcblwiLFxuICAgICAgICAgIGNoYXJhY3Rlcndpc2VIZWFkOiBbMSwgMV1cbiAgICAgICAgICBjdXJzb3I6IFsyLCAwXVxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2xpbmV3aXNlJ11cblxuICAgICAgaXQgJ25vdCBleHRlbmQgbGlud2lzZSBzZWxlY3Rpb24gaWYgc2VhcmNoIG1hdGNoZXMgb24gc2FtZSBsaW5lJywgLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiXCJcIlxuICAgICAgICAgIGFiYyBkZWZcbiAgICAgICAgICBkZWZcXG5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZW5zdXJlIFsnViAvJywgc2VhcmNoOiAnZWYnXSxcbiAgICAgICAgICBzZWxlY3RlZFRleHQ6IFwiYWJjIGRlZlxcblwiLFxuXG4gICAgICBkZXNjcmliZSBcImNhc2Ugc2Vuc2l0aXZpdHlcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJcXG5hYmNcXG5BQkNcXG5cIlxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgICBpdCBcIndvcmtzIGluIGNhc2Ugc2Vuc2l0aXZlIG1vZGVcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnQUJDJ10sIGN1cnNvcjogWzIsIDBdXG4gICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgICBpdCBcIndvcmtzIGluIGNhc2UgaW5zZW5zaXRpdmUgbW9kZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSBbJy8nLCBzZWFyY2g6ICdcXFxcY0FiQyddLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnbicsIGN1cnNvcjogWzIsIDBdXG5cbiAgICAgICAgaXQgXCJ3b3JrcyBpbiBjYXNlIGluc2Vuc2l0aXZlIG1vZGUgd2hlcmV2ZXIgXFxcXGMgaXNcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnQWJDXFxcXGMnXSwgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFsyLCAwXVxuXG4gICAgICAgIGRlc2NyaWJlIFwid2hlbiBpZ25vcmVDYXNlRm9yU2VhcmNoIGlzIGVuYWJsZWRcIiwgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICBzZXR0aW5ncy5zZXQgJ2lnbm9yZUNhc2VGb3JTZWFyY2gnLCB0cnVlXG5cbiAgICAgICAgICBpdCBcImlnbm9yZSBjYXNlIHdoZW4gc2VhcmNoIFtjYXNlLTFdXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnYWJjJ10sIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFsyLCAwXVxuXG4gICAgICAgICAgaXQgXCJpZ25vcmUgY2FzZSB3aGVuIHNlYXJjaCBbY2FzZS0yXVwiLCAtPlxuICAgICAgICAgICAgZW5zdXJlIFsnLycsIHNlYXJjaDogJ0FCQyddLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgICBkZXNjcmliZSBcIndoZW4gdXNlU21hcnRjYXNlRm9yU2VhcmNoIGlzIGVuYWJsZWRcIiwgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICBzZXR0aW5ncy5zZXQgJ3VzZVNtYXJ0Y2FzZUZvclNlYXJjaCcsIHRydWVcblxuICAgICAgICAgIGl0IFwiaWdub3JlIGNhc2Ugd2hlbiBzZWFyaCB0ZXJtIGluY2x1ZGVzIEEtWlwiLCAtPlxuICAgICAgICAgICAgZW5zdXJlIFsnLycsIHNlYXJjaDogJ0FCQyddLCBjdXJzb3I6IFsyLCAwXVxuICAgICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgICAgIGl0IFwiaWdub3JlIGNhc2Ugd2hlbiBzZWFyaCB0ZXJtIE5PVCBpbmNsdWRlcyBBLVogcmVnYXJkcmVzcyBvZiBgaWdub3JlQ2FzZUZvclNlYXJjaGBcIiwgLT5cbiAgICAgICAgICAgIHNldHRpbmdzLnNldCAnaWdub3JlQ2FzZUZvclNlYXJjaCcsIGZhbHNlICMgZGVmYXVsdFxuICAgICAgICAgICAgZW5zdXJlIFsnLycsIHNlYXJjaDogJ2FiYyddLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgICAgIGl0IFwiaWdub3JlIGNhc2Ugd2hlbiBzZWFyaCB0ZXJtIE5PVCBpbmNsdWRlcyBBLVogcmVnYXJkcmVzcyBvZiBgaWdub3JlQ2FzZUZvclNlYXJjaGBcIiwgLT5cbiAgICAgICAgICAgIHNldHRpbmdzLnNldCAnaWdub3JlQ2FzZUZvclNlYXJjaCcsIHRydWUgIyBkZWZhdWx0XG4gICAgICAgICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnYWJjJ10sIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFsyLCAwXVxuXG4gICAgICBkZXNjcmliZSBcInJlcGVhdGluZ1wiLCAtPlxuICAgICAgICBpdCBcImRvZXMgbm90aGluZyB3aXRoIG5vIHNlYXJjaCBoaXN0b3J5XCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMV1cbiAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFsxLCAxXVxuXG4gICAgICBkZXNjcmliZSBcInJlcGVhdGluZyB3aXRoIHNlYXJjaCBoaXN0b3J5XCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBrZXlzdHJva2UgWycvJywgc2VhcmNoOiAnZGVmJ11cblxuICAgICAgICBpdCBcInJlcGVhdHMgcHJldmlvdXMgc2VhcmNoIHdpdGggLzxlbnRlcj5cIiwgLT5cbiAgICAgICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnJ10sIGN1cnNvcjogWzMsIDBdXG5cbiAgICAgICAgaXQgXCJyZXBlYXRzIHByZXZpb3VzIHNlYXJjaCB3aXRoIC8vXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFsnLycsIHNlYXJjaDogJy8nXSwgY3Vyc29yOiBbMywgMF1cblxuICAgICAgICBkZXNjcmliZSBcInRoZSBuIGtleWJpbmRpbmdcIiwgLT5cbiAgICAgICAgICBpdCBcInJlcGVhdHMgdGhlIGxhc3Qgc2VhcmNoXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFszLCAwXVxuXG4gICAgICAgIGRlc2NyaWJlIFwidGhlIE4ga2V5YmluZGluZ1wiLCAtPlxuICAgICAgICAgIGl0IFwicmVwZWF0cyB0aGUgbGFzdCBzZWFyY2ggYmFja3dhcmRzXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICAgIGVuc3VyZSAnTicsIGN1cnNvcjogWzMsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJ04nLCBjdXJzb3I6IFsxLCAwXVxuXG4gICAgICBkZXNjcmliZSBcImNvbXBvc2luZ1wiLCAtPlxuICAgICAgICBpdCBcImNvbXBvc2VzIHdpdGggb3BlcmF0b3JzXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFsnZCAvJywgc2VhcmNoOiAnZGVmJ10sIHRleHQ6IFwiZGVmXFxuYWJjXFxuZGVmXFxuXCJcblxuICAgICAgICBpdCBcInJlcGVhdHMgY29ycmVjdGx5IHdpdGggb3BlcmF0b3JzXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFsnZCAvJywgc2VhcmNoOiAnZGVmJywgJy4nXSxcbiAgICAgICAgICAgIHRleHQ6IFwiZGVmXFxuXCJcblxuICAgIGRlc2NyaWJlIFwid2hlbiByZXZlcnNlZCBhcyA/XCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgYmFja3dhcmRzIHRvIHRoZSBzcGVjaWZpZWQgc2VhcmNoIHBhdHRlcm5cIiwgLT5cbiAgICAgICAgZW5zdXJlIFsnPycsIHNlYXJjaDogJ2RlZiddLCBjdXJzb3I6IFszLCAwXVxuXG4gICAgICBpdCBcImFjY2VwdHMgLyBhcyBhIGxpdGVyYWwgc2VhcmNoIHBhdHRlcm5cIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJhYmNcXG5kL2ZcXG5hYmNcXG5kL2ZcXG5cIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSBbJz8nLCBzZWFyY2g6ICcvJ10sIGN1cnNvcjogWzMsIDFdXG4gICAgICAgIGVuc3VyZSBbJz8nLCBzZWFyY2g6ICcvJ10sIGN1cnNvcjogWzEsIDFdXG5cbiAgICAgIGRlc2NyaWJlIFwicmVwZWF0aW5nXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBrZXlzdHJva2UgWyc/Jywgc2VhcmNoOiAnZGVmJ11cblxuICAgICAgICBpdCBcInJlcGVhdHMgcHJldmlvdXMgc2VhcmNoIGFzIHJldmVyc2VkIHdpdGggPzxlbnRlcj5cIiwgLT5cbiAgICAgICAgICBlbnN1cmUgWyc/Jywgc2VhcmNoOiAnJ10sIGN1cnNvcjogWzEsIDBdXG5cbiAgICAgICAgaXQgXCJyZXBlYXRzIHByZXZpb3VzIHNlYXJjaCBhcyByZXZlcnNlZCB3aXRoID8/XCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFsnPycsIHNlYXJjaDogJz8nXSwgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgICBkZXNjcmliZSAndGhlIG4ga2V5YmluZGluZycsIC0+XG4gICAgICAgICAgaXQgXCJyZXBlYXRzIHRoZSBsYXN0IHNlYXJjaCBiYWNrd2FyZHNcIiwgLT5cbiAgICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMywgMF1cblxuICAgICAgICBkZXNjcmliZSAndGhlIE4ga2V5YmluZGluZycsIC0+XG4gICAgICAgICAgaXQgXCJyZXBlYXRzIHRoZSBsYXN0IHNlYXJjaCBmb3J3YXJkc1wiLCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJ04nLCBjdXJzb3I6IFsxLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJ1c2luZyBzZWFyY2ggaGlzdG9yeVwiLCAtPlxuICAgICAgaW5wdXRFZGl0b3IgPSBudWxsXG4gICAgICBlbnN1cmVJbnB1dEVkaXRvciA9IChjb21tYW5kLCB7dGV4dH0pIC0+XG4gICAgICAgIGRpc3BhdGNoKGlucHV0RWRpdG9yLCBjb21tYW5kKVxuICAgICAgICBleHBlY3QoaW5wdXRFZGl0b3IuZ2V0TW9kZWwoKS5nZXRUZXh0KCkpLnRvRXF1YWwodGV4dClcblxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnZGVmJ10sIGN1cnNvcjogWzEsIDBdXG4gICAgICAgIGVuc3VyZSBbJy8nLCBzZWFyY2g6ICdhYmMnXSwgY3Vyc29yOiBbMiwgMF1cbiAgICAgICAgaW5wdXRFZGl0b3IgPSB2aW1TdGF0ZS5zZWFyY2hJbnB1dC5lZGl0b3JFbGVtZW50XG5cbiAgICAgIGl0IFwiYWxsb3dzIHNlYXJjaGluZyBoaXN0b3J5IGluIHRoZSBzZWFyY2ggZmllbGRcIiwgLT5cbiAgICAgICAga2V5c3Ryb2tlICcvJ1xuICAgICAgICBlbnN1cmVJbnB1dEVkaXRvciAnY29yZTptb3ZlLXVwJywgdGV4dDogJ2FiYydcbiAgICAgICAgZW5zdXJlSW5wdXRFZGl0b3IgJ2NvcmU6bW92ZS11cCcsIHRleHQ6ICdkZWYnXG4gICAgICAgIGVuc3VyZUlucHV0RWRpdG9yICdjb3JlOm1vdmUtdXAnLCB0ZXh0OiAnZGVmJ1xuXG4gICAgICBpdCBcInJlc2V0cyB0aGUgc2VhcmNoIGZpZWxkIHRvIGVtcHR5IHdoZW4gc2Nyb2xsaW5nIGJhY2tcIiwgLT5cbiAgICAgICAga2V5c3Ryb2tlICcvJ1xuICAgICAgICBlbnN1cmVJbnB1dEVkaXRvciAnY29yZTptb3ZlLXVwJywgdGV4dDogJ2FiYydcbiAgICAgICAgZW5zdXJlSW5wdXRFZGl0b3IgJ2NvcmU6bW92ZS11cCcsIHRleHQ6ICdkZWYnXG4gICAgICAgIGVuc3VyZUlucHV0RWRpdG9yICdjb3JlOm1vdmUtZG93bicsIHRleHQ6ICdhYmMnXG4gICAgICAgIGVuc3VyZUlucHV0RWRpdG9yICdjb3JlOm1vdmUtZG93bicsIHRleHQ6ICcnXG5cbiAgICBkZXNjcmliZSBcImhpZ2hsaWdodFNlYXJjaFwiLCAtPlxuICAgICAgdGV4dEZvck1hcmtlciA9IChtYXJrZXIpIC0+XG4gICAgICAgIGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKSlcblxuICAgICAgZW5zdXJlSGlnaHRsaWdodFNlYXJjaCA9IChvcHRpb25zKSAtPlxuICAgICAgICBtYXJrZXJzID0gdmltU3RhdGUuaGlnaGxpZ2h0U2VhcmNoLmdldE1hcmtlcnMoKVxuICAgICAgICBpZiBvcHRpb25zLmxlbmd0aD9cbiAgICAgICAgICBleHBlY3QobWFya2VycykudG9IYXZlTGVuZ3RoKG9wdGlvbnMubGVuZ3RoKVxuXG4gICAgICAgIGlmIG9wdGlvbnMudGV4dD9cbiAgICAgICAgICB0ZXh0ID0gbWFya2Vycy5tYXAgKG1hcmtlcikgLT4gdGV4dEZvck1hcmtlcihtYXJrZXIpXG4gICAgICAgICAgZXhwZWN0KHRleHQpLnRvRXF1YWwob3B0aW9ucy50ZXh0KVxuXG4gICAgICAgIGlmIG9wdGlvbnMubW9kZT9cbiAgICAgICAgICBlbnN1cmUge21vZGU6IG9wdGlvbnMubW9kZX1cblxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKGdldFZpZXcoYXRvbS53b3Jrc3BhY2UpKVxuICAgICAgICBzZXR0aW5ncy5zZXQoJ2hpZ2hsaWdodFNlYXJjaCcsIHRydWUpXG4gICAgICAgIGV4cGVjdCh2aW1TdGF0ZS5oaWdobGlnaHRTZWFyY2guaGFzTWFya2VycygpKS50b0JlKGZhbHNlKVxuICAgICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnZGVmJ10sIGN1cnNvcjogWzEsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwiY2xlYXJIaWdobGlnaHRTZWFyY2ggY29tbWFuZFwiLCAtPlxuICAgICAgICBpdCBcImNsZWFyIGhpZ2hsaWdodFNlYXJjaCBtYXJrZXJcIiwgLT5cbiAgICAgICAgICBlbnN1cmVIaWdodGxpZ2h0U2VhcmNoIGxlbmd0aDogMiwgdGV4dDogW1wiZGVmXCIsIFwiZGVmXCJdLCBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICAgIGRpc3BhdGNoKGVkaXRvckVsZW1lbnQsICd2aW0tbW9kZS1wbHVzOmNsZWFyLWhpZ2hsaWdodC1zZWFyY2gnKVxuICAgICAgICAgIGV4cGVjdCh2aW1TdGF0ZS5oaWdobGlnaHRTZWFyY2guaGFzTWFya2VycygpKS50b0JlKGZhbHNlKVxuXG4gICAgICBkZXNjcmliZSBcImNsZWFySGlnaGxpZ2h0U2VhcmNoT25SZXNldE5vcm1hbE1vZGVcIiwgLT5cbiAgICAgICAgZGVzY3JpYmUgXCJkZWZhdWx0IHNldHRpbmdcIiwgLT5cbiAgICAgICAgICBpdCBcIml0IHdvbid0IGNsZWFyIGhpZ2hsaWdodFNlYXJjaFwiLCAtPlxuICAgICAgICAgICAgZW5zdXJlSGlnaHRsaWdodFNlYXJjaCBsZW5ndGg6IDIsIHRleHQ6IFtcImRlZlwiLCBcImRlZlwiXSwgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICAgIGRpc3BhdGNoKGVkaXRvckVsZW1lbnQsICd2aW0tbW9kZS1wbHVzOnJlc2V0LW5vcm1hbC1tb2RlJylcbiAgICAgICAgICAgIGVuc3VyZUhpZ2h0bGlnaHRTZWFyY2ggbGVuZ3RoOiAyLCB0ZXh0OiBbXCJkZWZcIiwgXCJkZWZcIl0sIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgICAgZGVzY3JpYmUgXCJ3aGVuIGVuYWJsZWRcIiwgLT5cbiAgICAgICAgICBpdCBcIml0IGNsZWFyIGhpZ2hsaWdodFNlYXJjaCBvbiByZXNldC1ub3JtYWwtbW9kZVwiLCAtPlxuICAgICAgICAgICAgc2V0dGluZ3Muc2V0KCdjbGVhckhpZ2hsaWdodFNlYXJjaE9uUmVzZXROb3JtYWxNb2RlJywgdHJ1ZSlcbiAgICAgICAgICAgIGVuc3VyZUhpZ2h0bGlnaHRTZWFyY2ggbGVuZ3RoOiAyLCB0ZXh0OiBbXCJkZWZcIiwgXCJkZWZcIl0sIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgICBkaXNwYXRjaChlZGl0b3JFbGVtZW50LCAndmltLW1vZGUtcGx1czpyZXNldC1ub3JtYWwtbW9kZScpXG4gICAgICAgICAgICBleHBlY3QodmltU3RhdGUuaGlnaGxpZ2h0U2VhcmNoLmhhc01hcmtlcnMoKSkudG9CZShmYWxzZSlcbiAgICAgICAgICAgIGVuc3VyZSBtb2RlOiAnbm9ybWFsJ1xuXG4gIGRlc2NyaWJlIFwiSW5jcmVtZW50YWxTZWFyY2hcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXR0aW5ncy5zZXQoJ2luY3JlbWVudGFsU2VhcmNoJywgdHJ1ZSlcbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00oZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkpXG5cbiAgICBkZXNjcmliZSBcIndpdGggbXVsdGlwbGUtY3Vyc29yc1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAwOiAgICBhYmNcbiAgICAgICAgICAxOiAgICBhYmNcbiAgICAgICAgICAyOiAgICBhYmNcbiAgICAgICAgICAzOiAgICBhYmNcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFtbMCwgMF0sIFsxLCAwXV1cblxuICAgICAgaXQgXCJbZm9yd2FyZF0gbW92ZSBlYWNoIGN1cnNvciB0byBtYXRjaFwiLCAtPlxuICAgICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnYWJjJ10sIGN1cnNvcjogW1swLCA2XSwgWzEsIDZdXVxuICAgICAgaXQgXCJbZm9yd2FyZDogY291bnQgc3BlY2lmaWVkXSwgbW92ZSBlYWNoIGN1cnNvciB0byBtYXRjaFwiLCAtPlxuICAgICAgICBlbnN1cmUgWycyIC8nLCBzZWFyY2g6ICdhYmMnXSwgY3Vyc29yOiBbWzEsIDZdLCBbMiwgNl1dXG5cbiAgICAgIGl0IFwiW2JhY2t3YXJkXSBtb3ZlIGVhY2ggY3Vyc29yIHRvIG1hdGNoXCIsIC0+XG4gICAgICAgIGVuc3VyZSBbJz8nLCBzZWFyY2g6ICdhYmMnXSwgY3Vyc29yOiBbWzMsIDZdLCBbMCwgNl1dXG4gICAgICBpdCBcIltiYWNrd2FyZDogY291bnQgc3BlY2lmaWVkXSBtb3ZlIGVhY2ggY3Vyc29yIHRvIG1hdGNoXCIsIC0+XG4gICAgICAgIGVuc3VyZSBbJzIgPycsIHNlYXJjaDogJ2FiYyddLCBjdXJzb3I6IFtbMiwgNl0sIFszLCA2XV1cblxuICAgIGRlc2NyaWJlIFwiYmxhbmsgaW5wdXQgcmVwZWF0IGxhc3Qgc2VhcmNoXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHZpbVN0YXRlLnNlYXJjaEhpc3RvcnkuY2xlYXIoKVxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAwOiAgICBhYmNcbiAgICAgICAgICAxOiAgICBhYmNcbiAgICAgICAgICAyOiAgICBhYmNcbiAgICAgICAgICAzOiAgICBhYmNcbiAgICAgICAgICA0OlxuICAgICAgICAgIFwiXCJcIlxuXG4gICAgICBpdCBcIkRvIG5vdGhpbmcgd2hlbiBzZWFyY2ggaGlzdG9yeSBpcyBlbXB0eVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMV1cbiAgICAgICAgZW5zdXJlIFsnLycsIHNlYXJjaDogJyddLCBjdXJzb3I6IFsyLCAxXVxuICAgICAgICBlbnN1cmUgWyc/Jywgc2VhcmNoOiAnJ10sIGN1cnNvcjogWzIsIDFdXG5cbiAgICAgIGl0IFwiUmVwZWF0IGZvcndhcmQgZGlyZWN0aW9uXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnYWJjJ10sIGN1cnNvcjogWzAsIDZdXG4gICAgICAgIGVuc3VyZSBbJy8nLCBzZWFyY2g6ICcnXSwgY3Vyc29yOiBbMSwgNl1cbiAgICAgICAgZW5zdXJlIFsnMiAvJywgc2VhcmNoOiAnJ10sIGN1cnNvcjogWzMsIDZdXG5cbiAgICAgIGl0IFwiUmVwZWF0IGJhY2t3YXJkIGRpcmVjdGlvblwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbNCwgMF1cbiAgICAgICAgZW5zdXJlIFsnPycsIHNlYXJjaDogJ2FiYyddLCBjdXJzb3I6IFszLCA2XVxuICAgICAgICBlbnN1cmUgWyc/Jywgc2VhcmNoOiAnJ10sIGN1cnNvcjogWzIsIDZdXG4gICAgICAgIGVuc3VyZSBbJzIgPycsIHNlYXJjaDogJyddLCBjdXJzb3I6IFswLCA2XVxuXG4gIGRlc2NyaWJlIFwidGhlICoga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcImFiZFxcbkBkZWZcXG5hYmRcXG5kZWZcXG5cIlxuICAgICAgICBjdXJzb3JCdWZmZXI6IFswLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJhcyBhIG1vdGlvblwiLCAtPlxuICAgICAgaXQgXCJtb3ZlcyBjdXJzb3IgdG8gbmV4dCBvY2N1cnJlbmNlIG9mIHdvcmQgdW5kZXIgY3Vyc29yXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnKicsIGN1cnNvckJ1ZmZlcjogWzIsIDBdXG5cbiAgICAgIGl0IFwicmVwZWF0cyB3aXRoIHRoZSBuIGtleVwiLCAtPlxuICAgICAgICBlbnN1cmUgJyonLCBjdXJzb3JCdWZmZXI6IFsyLCAwXVxuICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3JCdWZmZXI6IFswLCAwXVxuXG4gICAgICBpdCBcImRvZXNuJ3QgbW92ZSBjdXJzb3IgdW5sZXNzIG5leHQgb2NjdXJyZW5jZSBpcyB0aGUgZXhhY3Qgd29yZCAobm8gcGFydGlhbCBtYXRjaGVzKVwiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcImFiY1xcbmRlZlxcbmdoaWFiY1xcbmprbFxcbmFiY2RlZlwiXG4gICAgICAgICAgY3Vyc29yQnVmZmVyOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICcqJywgY3Vyc29yQnVmZmVyOiBbMCwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIHdvcmRzIHRoYXQgY29udGFpbiAnbm9uLXdvcmQnIGNoYXJhY3RlcnNcIiwgLT5cbiAgICAgICAgaXQgXCJza2lwcyBub24td29yZC1jaGFyIHdoZW4gcGlja2luZyBjdXJzb3Itd29yZCB0aGVuIHBsYWNlIGN1cnNvciB0byBuZXh0IG9jY3VycmVuY2Ugb2Ygd29yZFwiLCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBhYmNcbiAgICAgICAgICAgIEBkZWZcbiAgICAgICAgICAgIGFiY1xuICAgICAgICAgICAgQGRlZlxcblxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBjdXJzb3JCdWZmZXI6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnKicsIGN1cnNvckJ1ZmZlcjogWzMsIDFdXG5cbiAgICAgICAgaXQgXCJkb2Vzbid0IG1vdmUgY3Vyc29yIHVubGVzcyBuZXh0IG1hdGNoIGhhcyBleGFjdCB3b3JkIGVuZGluZ1wiLCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBhYmNcbiAgICAgICAgICAgIEBkZWZcbiAgICAgICAgICAgIGFiY1xuICAgICAgICAgICAgQGRlZjFcXG5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY3Vyc29yQnVmZmVyOiBbMSwgMV1cbiAgICAgICAgICBlbnN1cmUgJyonLCBjdXJzb3JCdWZmZXI6IFsxLCAxXVxuXG4gICAgICAgIGl0IFwibW92ZXMgY3Vyc29yIHRvIHRoZSBzdGFydCBvZiB2YWxpZCB3b3JkIGNoYXJcIiwgLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiYWJjXFxuZGVmXFxuYWJjXFxuQGRlZlxcblwiXG4gICAgICAgICAgICBjdXJzb3JCdWZmZXI6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnKicsIGN1cnNvckJ1ZmZlcjogWzMsIDFdXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgb24gbm9uLXdvcmQgY2hhciBjb2x1bW5cIiwgLT5cbiAgICAgICAgaXQgXCJtYXRjaGVzIG9ubHkgdGhlIG5vbi13b3JkIGNoYXJcIiwgLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiYWJjXFxuQGRlZlxcbmFiY1xcbkBkZWZcXG5cIlxuICAgICAgICAgICAgY3Vyc29yQnVmZmVyOiBbMSwgMF1cbiAgICAgICAgICBlbnN1cmUgJyonLCBjdXJzb3JCdWZmZXI6IFszLCAxXVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gY3Vyc29yIGlzIG5vdCBvbiBhIHdvcmRcIiwgLT5cbiAgICAgICAgaXQgXCJkb2VzIGEgbWF0Y2ggd2l0aCB0aGUgbmV4dCB3b3JkXCIsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcImFiY1xcbmEgIEBkZWZcXG4gYWJjXFxuIEBkZWZcIlxuICAgICAgICAgICAgY3Vyc29yQnVmZmVyOiBbMSwgMV1cbiAgICAgICAgICBlbnN1cmUgJyonLCBjdXJzb3JCdWZmZXI6IFszLCAyXVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gY3Vyc29yIGlzIGF0IEVPRlwiLCAtPlxuICAgICAgICBpdCBcImRvZXNuJ3QgdHJ5IHRvIGRvIGFueSBtYXRjaFwiLCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJhYmNcXG5AZGVmXFxuYWJjXFxuIFwiXG4gICAgICAgICAgICBjdXJzb3JCdWZmZXI6IFszLCAwXVxuICAgICAgICAgIGVuc3VyZSAnKicsIGN1cnNvckJ1ZmZlcjogWzMsIDBdXG5cbiAgICBkZXNjcmliZSBcImNhc2VTZW5zaXRpdml0eSBzZXR0aW5nXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIGFiY1xuICAgICAgICAgIEFCQ1xuICAgICAgICAgIGFiQ1xuICAgICAgICAgIGFiY1xuICAgICAgICAgIEFCQ1xuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGl0IFwic2VhcmNoIGNhc2Ugc2Vuc2l0aXZlbHkgd2hlbiBgaWdub3JlQ2FzZUZvclNlYXJjaEN1cnJlbnRXb3JkYCBpcyBmYWxzZSg9ZGVmYXVsdClcIiwgLT5cbiAgICAgICAgZXhwZWN0KHNldHRpbmdzLmdldCgnaWdub3JlQ2FzZUZvclNlYXJjaEN1cnJlbnRXb3JkJykpLnRvQmUoZmFsc2UpXG4gICAgICAgIGVuc3VyZSAnKicsIGN1cnNvckJ1ZmZlcjogWzMsIDBdXG4gICAgICAgIGVuc3VyZSAnbicsIGN1cnNvckJ1ZmZlcjogWzAsIDBdXG5cbiAgICAgIGl0IFwic2VhcmNoIGNhc2UgaW5zZW5zaXRpdmVseSB3aGVuIGBpZ25vcmVDYXNlRm9yU2VhcmNoQ3VycmVudFdvcmRgIHRydWVcIiwgLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0ICdpZ25vcmVDYXNlRm9yU2VhcmNoQ3VycmVudFdvcmQnLCB0cnVlXG4gICAgICAgIGVuc3VyZSAnKicsIGN1cnNvckJ1ZmZlcjogWzEsIDBdXG4gICAgICAgIGVuc3VyZSAnbicsIGN1cnNvckJ1ZmZlcjogWzIsIDBdXG4gICAgICAgIGVuc3VyZSAnbicsIGN1cnNvckJ1ZmZlcjogWzMsIDBdXG4gICAgICAgIGVuc3VyZSAnbicsIGN1cnNvckJ1ZmZlcjogWzQsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwidXNlU21hcnRjYXNlRm9yU2VhcmNoQ3VycmVudFdvcmQgaXMgZW5hYmxlZFwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0dGluZ3Muc2V0ICd1c2VTbWFydGNhc2VGb3JTZWFyY2hDdXJyZW50V29yZCcsIHRydWVcblxuICAgICAgICBpdCBcInNlYXJjaCBjYXNlIHNlbnNpdGl2ZWx5IHdoZW4gZW5hYmxlIGFuZCBzZWFyY2ggdGVybSBpbmNsdWRlcyB1cHBlcmNhc2VcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICBlbnN1cmUgJyonLCBjdXJzb3JCdWZmZXI6IFs0LCAwXVxuICAgICAgICAgIGVuc3VyZSAnbicsIGN1cnNvckJ1ZmZlcjogWzEsIDBdXG5cbiAgICAgICAgaXQgXCJzZWFyY2ggY2FzZSBpbnNlbnNpdGl2ZWx5IHdoZW4gZW5hYmxlIGFuZCBzZWFyY2ggdGVybSBOT1QgaW5jbHVkZXMgdXBwZXJjYXNlXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgZW5zdXJlICcqJywgY3Vyc29yQnVmZmVyOiBbMSwgMF1cbiAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3JCdWZmZXI6IFsyLCAwXVxuICAgICAgICAgIGVuc3VyZSAnbicsIGN1cnNvckJ1ZmZlcjogWzMsIDBdXG4gICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yQnVmZmVyOiBbNCwgMF1cblxuICBkZXNjcmliZSBcInRoZSBoYXNoIGtleWJpbmRpbmdcIiwgLT5cbiAgICBkZXNjcmliZSBcImFzIGEgbW90aW9uXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIGN1cnNvciB0byBwcmV2aW91cyBvY2N1cnJlbmNlIG9mIHdvcmQgdW5kZXIgY3Vyc29yXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiYWJjXFxuQGRlZlxcbmFiY1xcbmRlZlxcblwiXG4gICAgICAgICAgY3Vyc29yQnVmZmVyOiBbMiwgMV1cbiAgICAgICAgZW5zdXJlICcjJywgY3Vyc29yQnVmZmVyOiBbMCwgMF1cblxuICAgICAgaXQgXCJyZXBlYXRzIHdpdGggblwiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcImFiY1xcbkBkZWZcXG5hYmNcXG5kZWZcXG5hYmNcXG5cIlxuICAgICAgICAgIGN1cnNvckJ1ZmZlcjogWzIsIDFdXG4gICAgICAgIGVuc3VyZSAnIycsIGN1cnNvckJ1ZmZlcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnbicsIGN1cnNvckJ1ZmZlcjogWzQsIDBdXG4gICAgICAgIGVuc3VyZSAnbicsIGN1cnNvckJ1ZmZlcjogWzIsIDBdXG5cbiAgICAgIGl0IFwiZG9lc24ndCBtb3ZlIGN1cnNvciB1bmxlc3MgbmV4dCBvY2N1cnJlbmNlIGlzIHRoZSBleGFjdCB3b3JkIChubyBwYXJ0aWFsIG1hdGNoZXMpXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiYWJjXFxuZGVmXFxuZ2hpYWJjXFxuamtsXFxuYWJjZGVmXCJcbiAgICAgICAgICBjdXJzb3JCdWZmZXI6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJyMnLCBjdXJzb3JCdWZmZXI6IFswLCAwXVxuXG4gICAgICBkZXNjcmliZSBcIndpdGggd29yZHMgdGhhdCBjb250YWludCAnbm9uLXdvcmQnIGNoYXJhY3RlcnNcIiwgLT5cbiAgICAgICAgaXQgXCJtb3ZlcyBjdXJzb3IgdG8gbmV4dCBvY2N1cnJlbmNlIG9mIHdvcmQgdW5kZXIgY3Vyc29yXCIsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcImFiY1xcbkBkZWZcXG5hYmNcXG5AZGVmXFxuXCJcbiAgICAgICAgICAgIGN1cnNvckJ1ZmZlcjogWzMsIDBdXG4gICAgICAgICAgZW5zdXJlICcjJywgY3Vyc29yQnVmZmVyOiBbMSwgMV1cblxuICAgICAgICBpdCBcIm1vdmVzIGN1cnNvciB0byB0aGUgc3RhcnQgb2YgdmFsaWQgd29yZCBjaGFyXCIsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcImFiY1xcbkBkZWZcXG5hYmNcXG5kZWZcXG5cIlxuICAgICAgICAgICAgY3Vyc29yQnVmZmVyOiBbMywgMF1cbiAgICAgICAgICBlbnN1cmUgJyMnLCBjdXJzb3JCdWZmZXI6IFsxLCAxXVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gY3Vyc29yIGlzIG9uIG5vbi13b3JkIGNoYXIgY29sdW1uXCIsIC0+XG4gICAgICAgIGl0IFwibWF0Y2hlcyBvbmx5IHRoZSBub24td29yZCBjaGFyXCIsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcImFiY1xcbkBkZWZcXG5hYmNcXG5AZGVmXFxuXCJcbiAgICAgICAgICAgIGN1cnNvckJ1ZmZlcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICcqJywgY3Vyc29yQnVmZmVyOiBbMywgMV1cblxuICAgIGRlc2NyaWJlIFwiY2FzZVNlbnNpdGl2aXR5IHNldHRpbmdcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgYWJjXG4gICAgICAgICAgQUJDXG4gICAgICAgICAgYWJDXG4gICAgICAgICAgYWJjXG4gICAgICAgICAgQUJDXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbNCwgMF1cblxuICAgICAgaXQgXCJzZWFyY2ggY2FzZSBzZW5zaXRpdmVseSB3aGVuIGBpZ25vcmVDYXNlRm9yU2VhcmNoQ3VycmVudFdvcmRgIGlzIGZhbHNlKD1kZWZhdWx0KVwiLCAtPlxuICAgICAgICBleHBlY3Qoc2V0dGluZ3MuZ2V0KCdpZ25vcmVDYXNlRm9yU2VhcmNoQ3VycmVudFdvcmQnKSkudG9CZShmYWxzZSlcbiAgICAgICAgZW5zdXJlICcjJywgY3Vyc29yQnVmZmVyOiBbMSwgMF1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yQnVmZmVyOiBbNCwgMF1cblxuICAgICAgaXQgXCJzZWFyY2ggY2FzZSBpbnNlbnNpdGl2ZWx5IHdoZW4gYGlnbm9yZUNhc2VGb3JTZWFyY2hDdXJyZW50V29yZGAgdHJ1ZVwiLCAtPlxuICAgICAgICBzZXR0aW5ncy5zZXQgJ2lnbm9yZUNhc2VGb3JTZWFyY2hDdXJyZW50V29yZCcsIHRydWVcbiAgICAgICAgZW5zdXJlICcjJywgY3Vyc29yQnVmZmVyOiBbMywgMF1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yQnVmZmVyOiBbMiwgMF1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yQnVmZmVyOiBbMSwgMF1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yQnVmZmVyOiBbMCwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJ1c2VTbWFydGNhc2VGb3JTZWFyY2hDdXJyZW50V29yZCBpcyBlbmFibGVkXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXR0aW5ncy5zZXQgJ3VzZVNtYXJ0Y2FzZUZvclNlYXJjaEN1cnJlbnRXb3JkJywgdHJ1ZVxuXG4gICAgICAgIGl0IFwic2VhcmNoIGNhc2Ugc2Vuc2l0aXZlbHkgd2hlbiBlbmFibGUgYW5kIHNlYXJjaCB0ZXJtIGluY2x1ZGVzIHVwcGVyY2FzZVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFs0LCAwXVxuICAgICAgICAgIGVuc3VyZSAnIycsIGN1cnNvckJ1ZmZlcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yQnVmZmVyOiBbNCwgMF1cblxuICAgICAgICBpdCBcInNlYXJjaCBjYXNlIGluc2Vuc2l0aXZlbHkgd2hlbiBlbmFibGUgYW5kIHNlYXJjaCB0ZXJtIE5PVCBpbmNsdWRlcyB1cHBlcmNhc2VcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBlbnN1cmUgJyMnLCBjdXJzb3JCdWZmZXI6IFs0LCAwXVxuICAgICAgICAgIGVuc3VyZSAnbicsIGN1cnNvckJ1ZmZlcjogWzMsIDBdXG4gICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yQnVmZmVyOiBbMiwgMF1cbiAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3JCdWZmZXI6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnbicsIGN1cnNvckJ1ZmZlcjogWzAsIDBdXG5cbiAgIyBGSVhNRTogTm8gbG9uZ2VyIGNoaWxkIG9mIHNlYXJjaCBzbyBtb3ZlIHRvIG1vdGlvbi1nZW5lcmFsLXNwZWMuY29mZmU/XG4gIGRlc2NyaWJlICd0aGUgJSBtb3Rpb24nLCAtPlxuICAgIGRlc2NyaWJlIFwiUGFyZW50aGVzaXNcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiKF9fXylcIlxuICAgICAgZGVzY3JpYmUgXCJhcyBvcGVyYXRvciB0YXJnZXRcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCB0ZXh0OiBcIihfKF8pXylcIlxuICAgICAgICBpdCAnYmVoYXZlIGluY2x1c2l2ZWx5IHdoZW4gaXMgYXQgb3BlbiBwYWlyJywgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgICBlbnN1cmUgJ2QgJScsIHRleHQ6IFwiKF9fKVwiXG4gICAgICAgIGl0ICdiZWhhdmUgaW5jbHVzaXZlbHkgd2hlbiBpcyBhdCBvcGVuIHBhaXInLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCA0XVxuICAgICAgICAgIGVuc3VyZSAnZCAlJywgdGV4dDogXCIoX18pXCJcbiAgICAgIGRlc2NyaWJlIFwiY3Vyc29yIGlzIGF0IHBhaXIgY2hhclwiLCAtPlxuICAgICAgICBpdCBcImN1cnNvciBpcyBhdCBvcGVuIHBhaXIsIGl0IG1vdmUgdG8gY2xvc2luZyBwYWlyXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgNF1cbiAgICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBpdCBcImN1cnNvciBpcyBhdCBjbG9zZSBwYWlyLCBpdCBtb3ZlIHRvIG9wZW4gcGFpclwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCA0XVxuICAgICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgNF1cbiAgICAgIGRlc2NyaWJlIFwiY3Vyc29yIGlzIGVuY2xvc2VkIGJ5IHBhaXJcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCIoX19fKVwiLFxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgaXQgXCJtb3ZlIHRvIG9wZW4gcGFpclwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDBdXG4gICAgICBkZXNjcmliZSBcImN1cnNvciBpcyBib2ZvcmUgb3BlbiBwYWlyXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiX18oX19fKVwiLFxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgaXQgXCJtb3ZlIHRvIG9wZW4gcGFpclwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDZdXG4gICAgICBkZXNjcmliZSBcImN1cnNvciBpcyBhZnRlciBjbG9zZSBwYWlyXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiX18oX19fKV9fXCIsXG4gICAgICAgICAgICBjdXJzb3I6IFswLCA3XVxuICAgICAgICBpdCBcImZhaWwgdG8gbW92ZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDddXG4gICAgICBkZXNjcmliZSBcIm11bHRpIGxpbmVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBfX19cbiAgICAgICAgICAgIF9fXyhfX1xuICAgICAgICAgICAgX19fXG4gICAgICAgICAgICBfX18pXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZGVzY3JpYmUgXCJ3aGVuIG9wZW4gYW5kIGNsb3NlIHBhaXIgaXMgbm90IGF0IGN1cnNvciBsaW5lXCIsIC0+XG4gICAgICAgICAgaXQgXCJmYWlsIHRvIG1vdmVcIiwgLT5cbiAgICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBpdCBcImZhaWwgdG8gbW92ZVwiLCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvcjogWzIsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFsyLCAwXVxuICAgICAgICBkZXNjcmliZSBcIndoZW4gb3BlbiBwYWlyIGlzIGZvcndhcmRpbmcgdG8gY3Vyc29yIGluIHNhbWUgcm93XCIsIC0+XG4gICAgICAgICAgaXQgXCJtb3ZlIHRvIGNsb3NpbmcgcGFpclwiLCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFszLCAzXVxuICAgICAgICBkZXNjcmliZSBcIndoZW4gY3Vyc29yIHBvc2l0aW9uIGlzIGdyZWF0ZXIgdGhhbiBvcGVuIHBhaXJcIiwgLT5cbiAgICAgICAgICBpdCBcImZhaWwgdG8gbW92ZVwiLCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDRdXG4gICAgICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFsxLCA0XVxuICAgICAgICBkZXNjcmliZSBcIndoZW4gY2xvc2UgcGFpciBpcyBmb3J3YXJkaW5nIHRvIGN1cnNvciBpbiBzYW1lIHJvd1wiLCAtPlxuICAgICAgICAgIGl0IFwibW92ZSB0byBjbG9zaW5nIHBhaXJcIiwgLT5cbiAgICAgICAgICAgIHNldCBjdXJzb3I6IFszLCAwXVxuICAgICAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMSwgM11cblxuICAgIGRlc2NyaWJlIFwiQ3VybHlCcmFja2V0XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIntfX199XCJcbiAgICAgIGl0IFwiY3Vyc29yIGlzIGF0IG9wZW4gcGFpciwgaXQgbW92ZSB0byBjbG9zaW5nIHBhaXJcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDRdXG4gICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDBdXG4gICAgICBpdCBcImN1cnNvciBpcyBhdCBjbG9zZSBwYWlyLCBpdCBtb3ZlIHRvIG9wZW4gcGFpclwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgNF1cbiAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgNF1cblxuICAgIGRlc2NyaWJlIFwiU3F1YXJlQnJhY2tldFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogXCJbX19fXVwiXG4gICAgICBpdCBcImN1cnNvciBpcyBhdCBvcGVuIHBhaXIsIGl0IG1vdmUgdG8gY2xvc2luZyBwYWlyXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFswLCA0XVxuICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgaXQgXCJjdXJzb3IgaXMgYXQgY2xvc2UgcGFpciwgaXQgbW92ZSB0byBvcGVuIHBhaXJcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDRdXG4gICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDRdXG5cbiAgICBkZXNjcmliZSBcImNvbXBsZXggc2l0dWF0aW9uXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIChfX19fXylfX3tfX1tfX19dX199XG4gICAgICAgICAgX1xuICAgICAgICAgIFwiXCJcIlxuICAgICAgaXQgJ21vdmUgdG8gY2xvc2luZyBwYWlyIHdoaWNoIG9wZW4gcGFpciBjb21lIGZpcnN0JywgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDddXG4gICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDE5XVxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMTBdXG4gICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDE2XVxuICAgICAgaXQgJ2VuY2xvc2luZyBwYWlyIGlzIHByaW9yaXRpemVkIG92ZXIgZm9yd2FyZGluZyByYW5nZScsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAyXVxuICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJjb21wbGV4IHNpdHVhdGlvbiB3aXRoIGh0bWwgdGFnXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAgc29tZSB0ZXh0XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgXCJcIlwiXG4gICAgICBpdCAnd2hlbiBjdXJzb3IgaXMgb24gQW5nbGVCcmFja2V0KDwsID4pLCBpdCBtb3ZlcyB0byBvcHBvc2l0ZSBBbmdsZUJyYWNrZXQnLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgNF1cbiAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGl0ICdjYW4gZmluZCBmb3J3YXJkaW5nIHJhbmdlIG9mIEFuZ2xlQnJhY2tldCcsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFsxLCA3XVxuICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFsxLCAyXVxuICAgICAgaXQgJ21vdmUgdG8gcGFpciB0YWcgb25seSB3aGVuIGN1cnNvciBpcyBvbiBvcGVuIG9yIGNsb3NlIHRhZyBidXQgbm90IG9uIEFuZ2xlQnJhY2tldCg8LCA+KScsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXTsgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgNF0gIyBvbiAnPCcgb2YgPGRpdj5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDFdOyBlbnN1cmUgJyUnLCBjdXJzb3I6IFs0LCAxXVxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMl07IGVuc3VyZSAnJScsIGN1cnNvcjogWzQsIDFdXG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAzXTsgZW5zdXJlICclJywgY3Vyc29yOiBbNCwgMV1cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDRdOyBlbnN1cmUgJyUnLCBjdXJzb3I6IFswLCAwXSAjIG9uICc+JyBvZiA8ZGl2PlxuXG4gICAgICAgIHNldCBjdXJzb3I6IFs0LCAwXTsgZW5zdXJlICclJywgY3Vyc29yOiBbNCwgNV0gIyBvbiAnPCcgb2YgPC9kaXY+XG4gICAgICAgIHNldCBjdXJzb3I6IFs0LCAxXTsgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgc2V0IGN1cnNvcjogWzQsIDJdOyBlbnN1cmUgJyUnLCBjdXJzb3I6IFswLCAxXVxuICAgICAgICBzZXQgY3Vyc29yOiBbNCwgM107IGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIHNldCBjdXJzb3I6IFs0LCA0XTsgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgc2V0IGN1cnNvcjogWzQsIDVdOyBlbnN1cmUgJyUnLCBjdXJzb3I6IFs0LCAwXSAjIG9uICc+JyBvZiA8L2Rpdj5cbiJdfQ==
