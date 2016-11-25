(function() {
  var dispatch, getVimState, ref, settings;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch;

  settings = require('../lib/settings');

  describe("Operator TransformString", function() {
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
    describe('the ~ keybinding', function() {
      beforeEach(function() {
        return set({
          text: 'aBc\nXyZ',
          cursorBuffer: [[0, 0], [1, 0]]
        });
      });
      it('toggles the case and moves right', function() {
        ensure('~', {
          text: 'ABc\nxyZ',
          cursor: [[0, 1], [1, 1]]
        });
        ensure('~', {
          text: 'Abc\nxYZ',
          cursor: [[0, 2], [1, 2]]
        });
        return ensure('~', {
          text: 'AbC\nxYz',
          cursor: [[0, 2], [1, 2]]
        });
      });
      it('takes a count', function() {
        return ensure('4 ~', {
          text: 'AbC\nxYz',
          cursor: [[0, 2], [1, 2]]
        });
      });
      describe("in visual mode", function() {
        return it("toggles the case of the selected text", function() {
          set({
            cursorBuffer: [0, 0]
          });
          return ensure('V ~', {
            text: 'AbC\nXyZ'
          });
        });
      });
      return describe("with g and motion", function() {
        it("toggles the case of text, won't move cursor", function() {
          set({
            cursorBuffer: [0, 0]
          });
          return ensure('g ~ 2 l', {
            text: 'Abc\nXyZ',
            cursor: [0, 0]
          });
        });
        it("g~~ toggles the line of text, won't move cursor", function() {
          set({
            cursorBuffer: [0, 1]
          });
          return ensure('g ~ ~', {
            text: 'AbC\nXyZ',
            cursor: [0, 1]
          });
        });
        return it("g~g~ toggles the line of text, won't move cursor", function() {
          set({
            cursorBuffer: [0, 1]
          });
          return ensure('g ~ g ~', {
            text: 'AbC\nXyZ',
            cursor: [0, 1]
          });
        });
      });
    });
    describe('the U keybinding', function() {
      beforeEach(function() {
        return set({
          text: 'aBc\nXyZ',
          cursorBuffer: [0, 0]
        });
      });
      it("makes text uppercase with g and motion, and won't move cursor", function() {
        ensure('g U l', {
          text: 'ABc\nXyZ',
          cursor: [0, 0]
        });
        ensure('g U e', {
          text: 'ABC\nXyZ',
          cursor: [0, 0]
        });
        set({
          cursorBuffer: [1, 0]
        });
        return ensure('g U $', {
          text: 'ABC\nXYZ',
          cursor: [1, 0]
        });
      });
      it("makes the selected text uppercase in visual mode", function() {
        return ensure('V U', {
          text: 'ABC\nXyZ'
        });
      });
      it("gUU upcase the line of text, won't move cursor", function() {
        set({
          cursorBuffer: [0, 1]
        });
        return ensure('g U U', {
          text: 'ABC\nXyZ',
          cursor: [0, 1]
        });
      });
      return it("gUgU upcase the line of text, won't move cursor", function() {
        set({
          cursorBuffer: [0, 1]
        });
        return ensure('g U g U', {
          text: 'ABC\nXyZ',
          cursor: [0, 1]
        });
      });
    });
    describe('the u keybinding', function() {
      beforeEach(function() {
        return set({
          text: 'aBc\nXyZ',
          cursorBuffer: [0, 0]
        });
      });
      it("makes text lowercase with g and motion, and won't move cursor", function() {
        return ensure('g u $', {
          text: 'abc\nXyZ',
          cursor: [0, 0]
        });
      });
      it("makes the selected text lowercase in visual mode", function() {
        return ensure('V u', {
          text: 'abc\nXyZ'
        });
      });
      it("guu downcase the line of text, won't move cursor", function() {
        set({
          cursorBuffer: [0, 1]
        });
        return ensure('g u u', {
          text: 'abc\nXyZ',
          cursor: [0, 1]
        });
      });
      return it("gugu downcase the line of text, won't move cursor", function() {
        set({
          cursorBuffer: [0, 1]
        });
        return ensure('g u g u', {
          text: 'abc\nXyZ',
          cursor: [0, 1]
        });
      });
    });
    describe("the > keybinding", function() {
      beforeEach(function() {
        return set({
          text: "12345\nabcde\nABCDE"
        });
      });
      describe("on the last line", function() {
        beforeEach(function() {
          return set({
            cursor: [2, 0]
          });
        });
        return describe("when followed by a >", function() {
          return it("indents the current line", function() {
            return ensure('> >', {
              text: "12345\nabcde\n  ABCDE",
              cursor: [2, 2]
            });
          });
        });
      });
      describe("on the first line", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 0]
          });
        });
        describe("when followed by a >", function() {
          return it("indents the current line", function() {
            return ensure('> >', {
              text: "  12345\nabcde\nABCDE",
              cursor: [0, 2]
            });
          });
        });
        return describe("when followed by a repeating >", function() {
          beforeEach(function() {
            return keystroke('3 > >');
          });
          it("indents multiple lines at once", function() {
            return ensure({
              text: "  12345\n  abcde\n  ABCDE",
              cursor: [0, 2]
            });
          });
          return describe("undo behavior", function() {
            return it("outdents all three lines", function() {
              return ensure('u', {
                text: "12345\nabcde\nABCDE"
              });
            });
          });
        });
      });
      describe("in visual mode", function() {
        beforeEach(function() {
          set({
            cursor: [0, 0]
          });
          return keystroke('V >');
        });
        it("indents the current line and exits visual mode", function() {
          return ensure({
            mode: 'normal',
            text: "  12345\nabcde\nABCDE",
            selectedBufferRange: [[0, 2], [0, 2]]
          });
        });
        return it("allows repeating the operation", function() {
          return ensure('.', {
            text: "    12345\nabcde\nABCDE"
          });
        });
      });
      return describe("in visual mode and stayOnTransformString enabled", function() {
        beforeEach(function() {
          settings.set('stayOnTransformString', true);
          return set({
            cursor: [0, 0]
          });
        });
        it("indents the currrent selection and exits visual mode", function() {
          return ensure('v j >', {
            mode: 'normal',
            cursor: [1, 2],
            text: "  12345\n  abcde\nABCDE"
          });
        });
        it("when repeated, operate on same range when cursor was not moved", function() {
          ensure('v j >', {
            mode: 'normal',
            cursor: [1, 2],
            text: "  12345\n  abcde\nABCDE"
          });
          return ensure('.', {
            mode: 'normal',
            cursor: [1, 4],
            text: "    12345\n    abcde\nABCDE"
          });
        });
        return it("when repeated, operate on relative range from cursor position with same extent when cursor was moved", function() {
          ensure('v j >', {
            mode: 'normal',
            cursor: [1, 2],
            text: "  12345\n  abcde\nABCDE"
          });
          return ensure('l .', {
            mode: 'normal',
            cursor: [1, 5],
            text_: "__12345\n____abcde\n__ABCDE"
          });
        });
      });
    });
    describe("the < keybinding", function() {
      beforeEach(function() {
        return set({
          text: "  12345\n  abcde\nABCDE",
          cursor: [0, 0]
        });
      });
      describe("when followed by a <", function() {
        return it("indents the current line", function() {
          return ensure('< <', {
            text: "12345\n  abcde\nABCDE",
            cursor: [0, 0]
          });
        });
      });
      describe("when followed by a repeating <", function() {
        beforeEach(function() {
          return keystroke('2 < <');
        });
        it("indents multiple lines at once", function() {
          return ensure({
            text: "12345\nabcde\nABCDE",
            cursor: [0, 0]
          });
        });
        return describe("undo behavior", function() {
          return it("indents both lines", function() {
            return ensure('u', {
              text: "  12345\n  abcde\nABCDE"
            });
          });
        });
      });
      return describe("in visual mode", function() {
        return it("indents the current line and exits visual mode", function() {
          return ensure('V <', {
            mode: 'normal',
            text: "12345\n  abcde\nABCDE",
            selectedBufferRange: [[0, 0], [0, 0]]
          });
        });
      });
    });
    describe("the = keybinding", function() {
      var oldGrammar;
      oldGrammar = [];
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.packages.activatePackage('language-javascript');
        });
        oldGrammar = editor.getGrammar();
        return set({
          text: "foo\n  bar\n  baz",
          cursor: [1, 0]
        });
      });
      return describe("when used in a scope that supports auto-indent", function() {
        beforeEach(function() {
          var jsGrammar;
          jsGrammar = atom.grammars.grammarForScopeName('source.js');
          return editor.setGrammar(jsGrammar);
        });
        afterEach(function() {
          return editor.setGrammar(oldGrammar);
        });
        describe("when followed by a =", function() {
          beforeEach(function() {
            return keystroke('= =');
          });
          return it("indents the current line", function() {
            return expect(editor.indentationForBufferRow(1)).toBe(0);
          });
        });
        return describe("when followed by a repeating =", function() {
          beforeEach(function() {
            return keystroke('2 = =');
          });
          it("autoindents multiple lines at once", function() {
            return ensure({
              text: "foo\nbar\nbaz",
              cursor: [1, 0]
            });
          });
          return describe("undo behavior", function() {
            return it("indents both lines", function() {
              return ensure('u', {
                text: "foo\n  bar\n  baz"
              });
            });
          });
        });
      });
    });
    describe('CamelCase', function() {
      beforeEach(function() {
        return set({
          text: 'vim-mode\natom-text-editor\n',
          cursorBuffer: [0, 0]
        });
      });
      it("transform text by motion and repeatable", function() {
        ensure('g c $', {
          text: 'vimMode\natom-text-editor\n',
          cursor: [0, 0]
        });
        return ensure('j .', {
          text: 'vimMode\natomTextEditor\n',
          cursor: [1, 0]
        });
      });
      it("transform selection", function() {
        return ensure('V j g c', {
          text: 'vimMode\natomTextEditor\n',
          cursor: [0, 0]
        });
      });
      return it("repeating twice works on current-line and won't move cursor", function() {
        return ensure('l g c g c', {
          text: 'vimMode\natom-text-editor\n',
          cursor: [0, 1]
        });
      });
    });
    describe('PascalCase', function() {
      beforeEach(function() {
        return set({
          text: 'vim-mode\natom-text-editor\n',
          cursorBuffer: [0, 0]
        });
      });
      it("transform text by motion and repeatable", function() {
        ensure('g C $', {
          text: 'VimMode\natom-text-editor\n',
          cursor: [0, 0]
        });
        return ensure('j .', {
          text: 'VimMode\nAtomTextEditor\n',
          cursor: [1, 0]
        });
      });
      it("transform selection", function() {
        return ensure('V j g C', {
          text: 'VimMode\natomTextEditor\n',
          cursor: [0, 0]
        });
      });
      return it("repeating twice works on current-line and won't move cursor", function() {
        return ensure('l g C g C', {
          text: 'VimMode\natom-text-editor\n',
          cursor: [0, 1]
        });
      });
    });
    describe('SnakeCase', function() {
      beforeEach(function() {
        set({
          text: 'vim-mode\natom-text-editor\n',
          cursorBuffer: [0, 0]
        });
        return atom.keymaps.add("g_", {
          'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
            'g _': 'vim-mode-plus:snake-case'
          }
        });
      });
      it("transform text by motion and repeatable", function() {
        ensure('g _ $', {
          text: 'vim_mode\natom-text-editor\n',
          cursor: [0, 0]
        });
        return ensure('j .', {
          text: 'vim_mode\natom_text_editor\n',
          cursor: [1, 0]
        });
      });
      it("transform selection", function() {
        return ensure('V j g _', {
          text: 'vim_mode\natom_text_editor\n',
          cursor: [0, 0]
        });
      });
      return it("repeating twice works on current-line and won't move cursor", function() {
        return ensure('l g _ g _', {
          text: 'vim_mode\natom-text-editor\n',
          cursor: [0, 1]
        });
      });
    });
    describe('DashCase', function() {
      beforeEach(function() {
        return set({
          text: 'vimMode\natom_text_editor\n',
          cursorBuffer: [0, 0]
        });
      });
      it("transform text by motion and repeatable", function() {
        ensure('g - $', {
          text: 'vim-mode\natom_text_editor\n',
          cursor: [0, 0]
        });
        return ensure('j .', {
          text: 'vim-mode\natom-text-editor\n',
          cursor: [1, 0]
        });
      });
      it("transform selection", function() {
        return ensure('V j g -', {
          text: 'vim-mode\natom-text-editor\n',
          cursor: [0, 0]
        });
      });
      return it("repeating twice works on current-line and won't move cursor", function() {
        return ensure('l g - g -', {
          text: 'vim-mode\natom_text_editor\n',
          cursor: [0, 1]
        });
      });
    });
    describe('ConvertToSoftTab', function() {
      beforeEach(function() {
        return atom.keymaps.add("test", {
          'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
            'g tab': 'vim-mode-plus:convert-to-soft-tab'
          }
        });
      });
      return describe("basic behavior", function() {
        return it("convert tabs to spaces", function() {
          expect(editor.getTabLength()).toBe(2);
          set({
            text: "\tvar10 =\t\t0;",
            cursor: [0, 0]
          });
          return ensure('g tab $', {
            text: "  var10 =   0;"
          });
        });
      });
    });
    describe('ConvertToHardTab', function() {
      beforeEach(function() {
        return atom.keymaps.add("test", {
          'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
            'g shift-tab': 'vim-mode-plus:convert-to-hard-tab'
          }
        });
      });
      return describe("basic behavior", function() {
        return it("convert spaces to tabs", function() {
          expect(editor.getTabLength()).toBe(2);
          set({
            text: "  var10 =    0;",
            cursor: [0, 0]
          });
          return ensure('g shift-tab $', {
            text: "\tvar10\t=\t\t 0;"
          });
        });
      });
    });
    describe('CompactSpaces', function() {
      beforeEach(function() {
        return set({
          cursorBuffer: [0, 0]
        });
      });
      return describe("basic behavior", function() {
        it("compats multiple space into one", function() {
          set({
            text: 'var0   =   0; var10   =   10',
            cursor: [0, 0]
          });
          return ensure('g space $', {
            text: 'var0 = 0; var10 = 10'
          });
        });
        it("don't apply compaction for leading and trailing space", function() {
          set({
            text_: "___var0   =   0; var10   =   10___\n___var1   =   1; var11   =   11___\n___var2   =   2; var12   =   12___\n\n___var4   =   4; var14   =   14___",
            cursor: [0, 0]
          });
          return ensure('g space i p', {
            text_: "___var0 = 0; var10 = 10___\n___var1 = 1; var11 = 11___\n___var2 = 2; var12 = 12___\n\n___var4   =   4; var14   =   14___"
          });
        });
        return it("but it compact spaces when target all text is spaces", function() {
          set({
            text: '01234    90',
            cursor: [0, 5]
          });
          return ensure('g space w', {
            text: '01234 90'
          });
        });
      });
    });
    describe('TrimString', function() {
      beforeEach(function() {
        return set({
          text: " text = @getNewText( selection.getText(), selection )  ",
          cursor: [0, 42]
        });
      });
      return describe("basic behavior", function() {
        it("trim string for a-line text object", function() {
          set({
            text_: "___abc___\n___def___",
            cursor: [0, 0]
          });
          ensure('g | a l', {
            text_: "abc\n___def___"
          });
          return ensure('j .', {
            text_: "abc\ndef"
          });
        });
        it("trim string for inner-parenthesis text object", function() {
          set({
            text_: "(  abc  )\n(  def  )",
            cursor: [0, 0]
          });
          ensure('g | i (', {
            text_: "(abc)\n(  def  )"
          });
          return ensure('j .', {
            text_: "(abc)\n(def)"
          });
        });
        return it("trim string for inner-any-pair text object", function() {
          atom.keymaps.add("test", {
            'atom-text-editor.vim-mode-plus.operator-pending-mode, atom-text-editor.vim-mode-plus.visual-mode': {
              'i ;': 'vim-mode-plus:inner-any-pair'
            }
          });
          set({
            text_: "( [ {  abc  } ] )",
            cursor: [0, 8]
          });
          ensure('g | i ;', {
            text_: "( [ {abc} ] )"
          });
          ensure('2 h .', {
            text_: "( [{abc}] )"
          });
          return ensure('2 h .', {
            text_: "([{abc}])"
          });
        });
      });
    });
    describe('surround', function() {
      beforeEach(function() {
        return set({
          text: "apple\npairs: [brackets]\npairs: [brackets]\n( multi\n  line )",
          cursorBuffer: [0, 0]
        });
      });
      describe('surround', function() {
        beforeEach(function() {
          return atom.keymaps.add("surround-test", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              'y s': 'vim-mode-plus:surround'
            }
          }, 100);
        });
        it("surround text object with ( and repeatable", function() {
          ensure([
            'y s i w', {
              input: '('
            }
          ], {
            text: "(apple)\npairs: [brackets]\npairs: [brackets]\n( multi\n  line )",
            cursor: [0, 0]
          });
          return ensure('j .', {
            text: "(apple)\n(pairs): [brackets]\npairs: [brackets]\n( multi\n  line )"
          });
        });
        it("surround text object with { and repeatable", function() {
          ensure([
            'y s i w', {
              input: '{'
            }
          ], {
            text: "{apple}\npairs: [brackets]\npairs: [brackets]\n( multi\n  line )",
            cursor: [0, 0]
          });
          return ensure('j .', {
            text: "{apple}\n{pairs}: [brackets]\npairs: [brackets]\n( multi\n  line )"
          });
        });
        it("surround linewise", function() {
          ensure([
            'y s y s', {
              input: '{'
            }
          ], {
            text: "{\napple\n}\npairs: [brackets]\npairs: [brackets]\n( multi\n  line )",
            cursor: [0, 0]
          });
          return ensure('3 j .', {
            text: "{\napple\n}\n{\npairs: [brackets]\n}\npairs: [brackets]\n( multi\n  line )"
          });
        });
        describe('with motion which aloso taking user-iinput', function() {
          beforeEach(function() {
            return set({
              text: "s _____ e",
              cursor: [0, 0]
            });
          });
          describe("with 'f' motion", function() {
            return it("surround with 'f' motion", function() {
              return ensure([
                'y s f', {
                  input: 'e('
                }
              ], {
                text: "(s _____ e)",
                cursor: [0, 0]
              });
            });
          });
          return describe("with '`' motion", function() {
            beforeEach(function() {
              set({
                cursor: [0, 8]
              });
              ensure('m a', {
                mark: {
                  'a': [0, 8]
                }
              });
              return set({
                cursor: [0, 0]
              });
            });
            return it("surround with '`' motion", function() {
              return ensure([
                'y s `', {
                  input: 'a('
                }
              ], {
                text: "(s _____ )e",
                cursor: [0, 0]
              });
            });
          });
        });
        return describe('charactersToAddSpaceOnSurround setting', function() {
          beforeEach(function() {
            settings.set('charactersToAddSpaceOnSurround', ['(', '{', '[']);
            return set({
              text: "apple\norange\nlemmon",
              cursorBuffer: [0, 0]
            });
          });
          describe("char is in charactersToAddSpaceOnSurround", function() {
            return it("add additional space inside pair char when surround", function() {
              ensure([
                'y s i w', {
                  input: '('
                }
              ], {
                text: "( apple )\norange\nlemmon"
              });
              keystroke('j');
              ensure([
                'y s i w', {
                  input: '{'
                }
              ], {
                text: "( apple )\n{ orange }\nlemmon"
              });
              keystroke('j');
              return ensure([
                'y s i w', {
                  input: '['
                }
              ], {
                text: "( apple )\n{ orange }\n[ lemmon ]"
              });
            });
          });
          return describe("char is not in charactersToAddSpaceOnSurround", function() {
            return it("add additional space inside pair char when surround", function() {
              ensure([
                'y s i w', {
                  input: ')'
                }
              ], {
                text: "(apple)\norange\nlemmon"
              });
              keystroke('j');
              ensure([
                'y s i w', {
                  input: '}'
                }
              ], {
                text: "(apple)\n{orange}\nlemmon"
              });
              keystroke('j');
              return ensure([
                'y s i w', {
                  input: ']'
                }
              ], {
                text: "(apple)\n{orange}\n[lemmon]"
              });
            });
          });
        });
      });
      describe('map-surround', function() {
        beforeEach(function() {
          jasmine.attachToDOM(editorElement);
          set({
            text: "\napple\npairs tomato\norange\nmilk\n",
            cursorBuffer: [1, 0]
          });
          return atom.keymaps.add("ms", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              'm s': 'vim-mode-plus:map-surround'
            },
            'atom-text-editor.vim-mode-plus.visual-mode': {
              'm s': 'vim-mode-plus:map-surround'
            }
          });
        });
        it("surround text for each word in target case-1", function() {
          return ensure([
            'm s i p', {
              input: '('
            }
          ], {
            text: "\n(apple)\n(pairs) (tomato)\n(orange)\n(milk)\n",
            cursor: [1, 0]
          });
        });
        it("surround text for each word in target case-2", function() {
          set({
            cursor: [2, 1]
          });
          return ensure([
            'm s i l', {
              input: '<'
            }
          ], {
            text: '\napple\n<pairs> <tomato>\norange\nmilk\n',
            cursor: [2, 0]
          });
        });
        return it("surround text for each word in visual selection", function() {
          return ensure([
            'v i p m s', {
              input: '"'
            }
          ], {
            text: '\n"apple"\n"pairs" "tomato"\n"orange"\n"milk"\n',
            cursor: [1, 0]
          });
        });
      });
      describe('delete surround', function() {
        beforeEach(function() {
          atom.keymaps.add("surround-test", {
            'atom-text-editor.vim-mode-plus.normal-mode': {
              'd s': 'vim-mode-plus:delete-surround'
            }
          });
          return set({
            cursor: [1, 8]
          });
        });
        it("delete surrounded chars and repeatable", function() {
          ensure([
            'd s', {
              input: '['
            }
          ], {
            text: "apple\npairs: brackets\npairs: [brackets]\n( multi\n  line )"
          });
          return ensure('j l .', {
            text: "apple\npairs: brackets\npairs: brackets\n( multi\n  line )"
          });
        });
        it("delete surrounded chars expanded to multi-line", function() {
          set({
            cursor: [3, 1]
          });
          return ensure([
            'd s', {
              input: '('
            }
          ], {
            text: "apple\npairs: [brackets]\npairs: [brackets]\n multi\n  line "
          });
        });
        it("delete surrounded chars and trim padding spaces for non-identical pair-char", function() {
          set({
            text: "( apple )\n{  orange   }\n",
            cursor: [0, 0]
          });
          ensure([
            'd s', {
              input: '('
            }
          ], {
            text: "apple\n{  orange   }\n"
          });
          return ensure([
            'j d s', {
              input: '{'
            }
          ], {
            text: "apple\norange\n"
          });
        });
        it("delete surrounded chars and NOT trim padding spaces for identical pair-char", function() {
          set({
            text: "` apple `\n\"  orange   \"\n",
            cursor: [0, 0]
          });
          ensure([
            'd s', {
              input: '`'
            }
          ], {
            text_: '_apple_\n"__orange___"\n'
          });
          return ensure([
            'j d s', {
              input: '"'
            }
          ], {
            text_: "_apple_\n__orange___\n"
          });
        });
        return it("delete surrounded for multi-line but dont affect code layout", function() {
          set({
            cursor: [0, 34],
            text: "highlightRanges @editor, range, {\n  timeout: timeout\n  hello: world\n}"
          });
          return ensure([
            'd s', {
              input: '{'
            }
          ], {
            text: ["highlightRanges @editor, range, ", "  timeout: timeout", "  hello: world", ""].join("\n")
          });
        });
      });
      describe('change surround', function() {
        beforeEach(function() {
          atom.keymaps.add("surround-test", {
            'atom-text-editor.vim-mode-plus.normal-mode': {
              'c s': 'vim-mode-plus:change-surround'
            }
          });
          return set({
            text: "(apple)\n(grape)\n<lemmon>\n{orange}",
            cursorBuffer: [0, 1]
          });
        });
        it("change surrounded chars and repeatable", function() {
          ensure([
            'c s', {
              input: '(['
            }
          ], {
            text: "[apple]\n(grape)\n<lemmon>\n{orange}"
          });
          return ensure('j l .', {
            text: "[apple]\n[grape]\n<lemmon>\n{orange}"
          });
        });
        it("change surrounded chars", function() {
          ensure([
            'j j c s', {
              input: '<"'
            }
          ], {
            text: "(apple)\n(grape)\n\"lemmon\"\n{orange}"
          });
          return ensure([
            'j l c s', {
              input: '{!'
            }
          ], {
            text: "(apple)\n(grape)\n\"lemmon\"\n!orange!"
          });
        });
        it("change surrounded for multi-line but dont affect code layout", function() {
          set({
            cursor: [0, 34],
            text: "highlightRanges @editor, range, {\n  timeout: timeout\n  hello: world\n}"
          });
          return ensure([
            'c s', {
              input: '{('
            }
          ], {
            text: "highlightRanges @editor, range, (\n  timeout: timeout\n  hello: world\n)"
          });
        });
        return describe('charactersToAddSpaceOnSurround setting', function() {
          var ensureChangeSurround;
          ensureChangeSurround = function(inputKeystrokes, options) {
            var keystrokes;
            set({
              text: options.initialText,
              cursorBuffer: [0, 0]
            });
            delete options.initialText;
            keystrokes = ['c s'].concat({
              input: inputKeystrokes
            });
            return ensure(keystrokes, options);
          };
          beforeEach(function() {
            return settings.set('charactersToAddSpaceOnSurround', ['(', '{', '[']);
          });
          describe('when input char is in charactersToAddSpaceOnSurround', function() {
            describe('single line text', function() {
              return it("add single space around pair regardless of exsiting inner text", function() {
                ensureChangeSurround('({', {
                  initialText: "(apple)",
                  text: "{ apple }"
                });
                ensureChangeSurround('({', {
                  initialText: "( apple )",
                  text: "{ apple }"
                });
                return ensureChangeSurround('({', {
                  initialText: "(  apple  )",
                  text: "{ apple }"
                });
              });
            });
            return describe('multi line text', function() {
              return it("don't sadd single space around pair", function() {
                return ensureChangeSurround('({', {
                  initialText: "(\napple\n)",
                  text: "{\napple\n}"
                });
              });
            });
          });
          return describe('when first input char is not in charactersToAddSpaceOnSurround', function() {
            it("remove surrounding space of inner text for identical pair-char", function() {
              ensureChangeSurround('(}', {
                initialText: "(apple)",
                text: "{apple}"
              });
              ensureChangeSurround('(}', {
                initialText: "( apple )",
                text: "{apple}"
              });
              return ensureChangeSurround('(}', {
                initialText: "(  apple  )",
                text: "{apple}"
              });
            });
            return it("doesn't remove surrounding space of inner text for non-identical pair-char", function() {
              ensureChangeSurround('"`', {
                initialText: '"apple"',
                text: "`apple`"
              });
              ensureChangeSurround('"`', {
                initialText: '"  apple  "',
                text: "`  apple  `"
              });
              return ensureChangeSurround("\"'", {
                initialText: '"  apple  "',
                text: "'  apple  '"
              });
            });
          });
        });
      });
      describe('surround-word', function() {
        beforeEach(function() {
          return atom.keymaps.add("surround-test", {
            'atom-text-editor.vim-mode-plus.normal-mode': {
              'y s w': 'vim-mode-plus:surround-word'
            }
          });
        });
        it("surround a word with ( and repeatable", function() {
          ensure([
            'y s w', {
              input: '('
            }
          ], {
            text: "(apple)\npairs: [brackets]\npairs: [brackets]\n( multi\n  line )",
            cursor: [0, 0]
          });
          return ensure('j .', {
            text: "(apple)\n(pairs): [brackets]\npairs: [brackets]\n( multi\n  line )"
          });
        });
        return it("surround a word with { and repeatable", function() {
          ensure([
            'y s w', {
              input: '{'
            }
          ], {
            text: "{apple}\npairs: [brackets]\npairs: [brackets]\n( multi\n  line )",
            cursor: [0, 0]
          });
          return ensure('j .', {
            text: "{apple}\n{pairs}: [brackets]\npairs: [brackets]\n( multi\n  line )"
          });
        });
      });
      describe('delete-surround-any-pair', function() {
        beforeEach(function() {
          set({
            text: "apple\n(pairs: [brackets])\n{pairs \"s\" [brackets]}\n( multi\n  line )",
            cursor: [1, 9]
          });
          return atom.keymaps.add("test", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              'd s': 'vim-mode-plus:delete-surround-any-pair'
            }
          });
        });
        it("delete surrounded any pair found and repeatable", function() {
          ensure('d s', {
            text: 'apple\n(pairs: brackets)\n{pairs "s" [brackets]}\n( multi\n  line )'
          });
          return ensure('.', {
            text: 'apple\npairs: brackets\n{pairs "s" [brackets]}\n( multi\n  line )'
          });
        });
        it("delete surrounded any pair found with skip pair out of cursor and repeatable", function() {
          set({
            cursor: [2, 14]
          });
          ensure('d s', {
            text: 'apple\n(pairs: [brackets])\n{pairs "s" brackets}\n( multi\n  line )'
          });
          ensure('.', {
            text: 'apple\n(pairs: [brackets])\npairs "s" brackets\n( multi\n  line )'
          });
          return ensure('.', {
            text: 'apple\n(pairs: [brackets])\npairs "s" brackets\n( multi\n  line )'
          });
        });
        return it("delete surrounded chars expanded to multi-line", function() {
          set({
            cursor: [3, 1]
          });
          return ensure('d s', {
            text: 'apple\n(pairs: [brackets])\n{pairs "s" [brackets]}\n multi\n  line '
          });
        });
      });
      describe('delete-surround-any-pair-allow-forwarding', function() {
        beforeEach(function() {
          settings.set('stayOnTransformString', true);
          return atom.keymaps.add("test", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              'd s': 'vim-mode-plus:delete-surround-any-pair-allow-forwarding'
            }
          });
        });
        return it("[1] single line", function() {
          set({
            cursor: [0, 0],
            text: "___(inner)\n___(inner)"
          });
          ensure('d s', {
            text: "___inner\n___(inner)",
            cursor: [0, 0]
          });
          return ensure('j .', {
            text: "___inner\n___inner",
            cursor: [1, 0]
          });
        });
      });
      describe('change-surround-any-pair', function() {
        beforeEach(function() {
          set({
            text: "(apple)\n(grape)\n<lemmon>\n{orange}",
            cursor: [0, 1]
          });
          return atom.keymaps.add("test", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              'c s': 'vim-mode-plus:change-surround-any-pair'
            }
          });
        });
        return it("change any surrounded pair found and repeatable", function() {
          ensure([
            'c s', {
              input: '<'
            }
          ], {
            text: "<apple>\n(grape)\n<lemmon>\n{orange}"
          });
          ensure('j .', {
            text: "<apple>\n<grape>\n<lemmon>\n{orange}"
          });
          return ensure('j j .', {
            text: "<apple>\n<grape>\n<lemmon>\n<orange>"
          });
        });
      });
      return describe('change-surround-any-pair-allow-forwarding', function() {
        beforeEach(function() {
          settings.set('stayOnTransformString', true);
          return atom.keymaps.add("test", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              'c s': 'vim-mode-plus:change-surround-any-pair-allow-forwarding'
            }
          });
        });
        return it("[1] single line", function() {
          set({
            cursor: [0, 0],
            text: "___(inner)\n___(inner)"
          });
          ensure([
            'c s', {
              input: '<'
            }
          ], {
            text: "___<inner>\n___(inner)",
            cursor: [0, 0]
          });
          return ensure('j .', {
            text: "___<inner>\n___<inner>",
            cursor: [1, 0]
          });
        });
      });
    });
    describe('ReplaceWithRegister', function() {
      var originalText;
      originalText = null;
      beforeEach(function() {
        atom.keymaps.add("test", {
          'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
            '_': 'vim-mode-plus:replace-with-register'
          }
        });
        originalText = "abc def 'aaa'\nhere (parenthesis)\nhere (parenthesis)";
        set({
          text: originalText,
          cursor: [0, 9]
        });
        set({
          register: {
            '"': {
              text: 'default register',
              type: 'character'
            }
          }
        });
        return set({
          register: {
            'a': {
              text: 'A register',
              type: 'character'
            }
          }
        });
      });
      it("replace selection with regisgter's content", function() {
        ensure('v i w', {
          selectedText: 'aaa'
        });
        return ensure('_', {
          mode: 'normal',
          text: originalText.replace('aaa', 'default register')
        });
      });
      it("replace text object with regisgter's content", function() {
        set({
          cursor: [1, 6]
        });
        return ensure('_ i (', {
          mode: 'normal',
          text: originalText.replace('parenthesis', 'default register')
        });
      });
      it("can repeat", function() {
        set({
          cursor: [1, 6]
        });
        return ensure('_ i ( j .', {
          mode: 'normal',
          text: originalText.replace(/parenthesis/g, 'default register')
        });
      });
      return it("can use specified register to replace with", function() {
        set({
          cursor: [1, 6]
        });
        return ensure([
          '"', {
            input: 'a'
          }, '_ i ('
        ], {
          mode: 'normal',
          text: originalText.replace('parenthesis', 'A register')
        });
      });
    });
    describe('SwapWithRegister', function() {
      var originalText;
      originalText = null;
      beforeEach(function() {
        atom.keymaps.add("test", {
          'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
            'g p': 'vim-mode-plus:swap-with-register'
          }
        });
        originalText = "abc def 'aaa'\nhere (111)\nhere (222)";
        set({
          text: originalText,
          cursor: [0, 9]
        });
        set({
          register: {
            '"': {
              text: 'default register',
              type: 'character'
            }
          }
        });
        return set({
          register: {
            'a': {
              text: 'A register',
              type: 'character'
            }
          }
        });
      });
      it("swap selection with regisgter's content", function() {
        ensure('v i w', {
          selectedText: 'aaa'
        });
        return ensure('g p', {
          mode: 'normal',
          text: originalText.replace('aaa', 'default register'),
          register: {
            '"': {
              text: 'aaa'
            }
          }
        });
      });
      it("swap text object with regisgter's content", function() {
        set({
          cursor: [1, 6]
        });
        return ensure('g p i (', {
          mode: 'normal',
          text: originalText.replace('111', 'default register'),
          register: {
            '"': {
              text: '111'
            }
          }
        });
      });
      it("can repeat", function() {
        var updatedText;
        set({
          cursor: [1, 6]
        });
        updatedText = "abc def 'aaa'\nhere (default register)\nhere (111)";
        return ensure('g p i ( j .', {
          mode: 'normal',
          text: updatedText,
          register: {
            '"': {
              text: '222'
            }
          }
        });
      });
      return it("can use specified register to swap with", function() {
        set({
          cursor: [1, 6]
        });
        return ensure([
          '"', {
            input: 'a'
          }, 'g p i ('
        ], {
          mode: 'normal',
          text: originalText.replace('111', 'A register'),
          register: {
            'a': {
              text: '111'
            }
          }
        });
      });
    });
    describe('Reverse and Sort', function() {
      beforeEach(function() {
        atom.keymaps.add("test", {
          'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
            'g r': 'vim-mode-plus:reverse',
            'g s': 'vim-mode-plus:sort'
          }
        });
        return set({
          text: "a\n2\nc\n3\n1\nb\n",
          cursor: [2, 0]
        });
      });
      return it('sort rows, reverse rows', function() {
        ensure("g s i p", function() {
          return {
            text: "1\n2\n3\na\nb\nc\n"
          };
        });
        return ensure("g r i p", function() {
          return {
            text: "c\nb\na\n3\n2\n1\n"
          };
        });
      });
    });
    return describe('ToggleLineComments', function() {
      var oldGrammar, originalText, ref2;
      ref2 = [], oldGrammar = ref2[0], originalText = ref2[1];
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.packages.activatePackage('language-coffee-script');
        });
        return runs(function() {
          var grammar;
          oldGrammar = editor.getGrammar();
          grammar = atom.grammars.grammarForScopeName('source.coffee');
          editor.setGrammar(grammar);
          originalText = "class Base\n  constructor: (args) ->\n    pivot = items.shift()\n    left = []\n    right = []\n\nconsole.log \"hello\"";
          return set({
            text: originalText
          });
        });
      });
      afterEach(function() {
        return editor.setGrammar(oldGrammar);
      });
      it('toggle comment for textobject for indent and repeatable', function() {
        set({
          cursor: [2, 0]
        });
        ensure('g / i i', {
          text: "class Base\n  constructor: (args) ->\n    # pivot = items.shift()\n    # left = []\n    # right = []\n\nconsole.log \"hello\""
        });
        return ensure('.', {
          text: originalText
        });
      });
      return it('toggle comment for textobject for paragraph and repeatable', function() {
        set({
          cursor: [2, 0]
        });
        ensure('g / i p', {
          text: "# class Base\n#   constructor: (args) ->\n#     pivot = items.shift()\n#     left = []\n#     right = []\n\nconsole.log \"hello\""
        });
        return ensure('.', {
          text: originalText
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL29wZXJhdG9yLXRyYW5zZm9ybS1zdHJpbmctc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQTBCLE9BQUEsQ0FBUSxlQUFSLENBQTFCLEVBQUMsNkJBQUQsRUFBYzs7RUFDZCxRQUFBLEdBQVcsT0FBQSxDQUFRLGlCQUFSOztFQUVYLFFBQUEsQ0FBUywwQkFBVCxFQUFxQyxTQUFBO0FBQ25DLFFBQUE7SUFBQSxPQUE0RCxFQUE1RCxFQUFDLGFBQUQsRUFBTSxnQkFBTixFQUFjLG1CQUFkLEVBQXlCLGdCQUF6QixFQUFpQyx1QkFBakMsRUFBZ0Q7SUFFaEQsVUFBQSxDQUFXLFNBQUE7YUFDVCxXQUFBLENBQVksU0FBQyxLQUFELEVBQVEsR0FBUjtRQUNWLFFBQUEsR0FBVztRQUNWLHdCQUFELEVBQVM7ZUFDUixhQUFELEVBQU0sbUJBQU4sRUFBYyx5QkFBZCxFQUEyQjtNQUhqQixDQUFaO0lBRFMsQ0FBWDtJQU1BLFNBQUEsQ0FBVSxTQUFBO2FBQ1IsUUFBUSxDQUFDLGVBQVQsQ0FBQTtJQURRLENBQVY7SUFHQSxRQUFBLENBQVMsa0JBQVQsRUFBNkIsU0FBQTtNQUMzQixVQUFBLENBQVcsU0FBQTtlQUNULEdBQUEsQ0FDRTtVQUFBLElBQUEsRUFBTSxVQUFOO1VBQ0EsWUFBQSxFQUFjLENBQUMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFELEVBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFULENBRGQ7U0FERjtNQURTLENBQVg7TUFLQSxFQUFBLENBQUcsa0NBQUgsRUFBdUMsU0FBQTtRQUNyQyxNQUFBLENBQU8sR0FBUCxFQUNFO1VBQUEsSUFBQSxFQUFNLFVBQU47VUFDQSxNQUFBLEVBQVEsQ0FBQyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQUQsRUFBUyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVQsQ0FEUjtTQURGO1FBSUEsTUFBQSxDQUFPLEdBQVAsRUFDRTtVQUFBLElBQUEsRUFBTSxVQUFOO1VBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFELEVBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFULENBRFI7U0FERjtlQUlBLE1BQUEsQ0FBUSxHQUFSLEVBQ0U7VUFBQSxJQUFBLEVBQU0sVUFBTjtVQUNBLE1BQUEsRUFBUSxDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBVCxDQURSO1NBREY7TUFUcUMsQ0FBdkM7TUFhQSxFQUFBLENBQUcsZUFBSCxFQUFvQixTQUFBO2VBQ2xCLE1BQUEsQ0FBTyxLQUFQLEVBQ0U7VUFBQSxJQUFBLEVBQU0sVUFBTjtVQUNBLE1BQUEsRUFBUSxDQUFDLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBRCxFQUFTLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBVCxDQURSO1NBREY7TUFEa0IsQ0FBcEI7TUFLQSxRQUFBLENBQVMsZ0JBQVQsRUFBMkIsU0FBQTtlQUN6QixFQUFBLENBQUcsdUNBQUgsRUFBNEMsU0FBQTtVQUMxQyxHQUFBLENBQUk7WUFBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO1dBQUo7aUJBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBYztZQUFBLElBQUEsRUFBTSxVQUFOO1dBQWQ7UUFGMEMsQ0FBNUM7TUFEeUIsQ0FBM0I7YUFLQSxRQUFBLENBQVMsbUJBQVQsRUFBOEIsU0FBQTtRQUM1QixFQUFBLENBQUcsNkNBQUgsRUFBa0QsU0FBQTtVQUNoRCxHQUFBLENBQUk7WUFBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO1dBQUo7aUJBQ0EsTUFBQSxDQUFPLFNBQVAsRUFBa0I7WUFBQSxJQUFBLEVBQU0sVUFBTjtZQUFrQixNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUExQjtXQUFsQjtRQUZnRCxDQUFsRDtRQUlBLEVBQUEsQ0FBRyxpREFBSCxFQUFzRCxTQUFBO1VBQ3BELEdBQUEsQ0FBSTtZQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7V0FBSjtpQkFDQSxNQUFBLENBQU8sT0FBUCxFQUFnQjtZQUFBLElBQUEsRUFBTSxVQUFOO1lBQWtCLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTFCO1dBQWhCO1FBRm9ELENBQXREO2VBSUEsRUFBQSxDQUFHLGtEQUFILEVBQXVELFNBQUE7VUFDckQsR0FBQSxDQUFJO1lBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDtXQUFKO2lCQUNBLE1BQUEsQ0FBTyxTQUFQLEVBQWtCO1lBQUEsSUFBQSxFQUFNLFVBQU47WUFBa0IsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBMUI7V0FBbEI7UUFGcUQsQ0FBdkQ7TUFUNEIsQ0FBOUI7SUE3QjJCLENBQTdCO0lBMENBLFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO01BQzNCLFVBQUEsQ0FBVyxTQUFBO2VBQ1QsR0FBQSxDQUNFO1VBQUEsSUFBQSxFQUFNLFVBQU47VUFDQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURkO1NBREY7TUFEUyxDQUFYO01BS0EsRUFBQSxDQUFHLCtEQUFILEVBQW9FLFNBQUE7UUFDbEUsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7VUFBQSxJQUFBLEVBQU0sVUFBTjtVQUFrQixNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUExQjtTQUFoQjtRQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQWdCO1VBQUEsSUFBQSxFQUFNLFVBQU47VUFBa0IsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBMUI7U0FBaEI7UUFDQSxHQUFBLENBQUk7VUFBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO1NBQUo7ZUFDQSxNQUFBLENBQU8sT0FBUCxFQUFnQjtVQUFBLElBQUEsRUFBTSxVQUFOO1VBQWtCLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTFCO1NBQWhCO01BSmtFLENBQXBFO01BTUEsRUFBQSxDQUFHLGtEQUFILEVBQXVELFNBQUE7ZUFDckQsTUFBQSxDQUFPLEtBQVAsRUFBYztVQUFBLElBQUEsRUFBTSxVQUFOO1NBQWQ7TUFEcUQsQ0FBdkQ7TUFHQSxFQUFBLENBQUcsZ0RBQUgsRUFBcUQsU0FBQTtRQUNuRCxHQUFBLENBQUk7VUFBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO1NBQUo7ZUFDQSxNQUFBLENBQU8sT0FBUCxFQUFnQjtVQUFBLElBQUEsRUFBTSxVQUFOO1VBQWtCLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTFCO1NBQWhCO01BRm1ELENBQXJEO2FBSUEsRUFBQSxDQUFHLGlEQUFILEVBQXNELFNBQUE7UUFDcEQsR0FBQSxDQUFJO1VBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDtTQUFKO2VBQ0EsTUFBQSxDQUFPLFNBQVAsRUFBa0I7VUFBQSxJQUFBLEVBQU0sVUFBTjtVQUFrQixNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUExQjtTQUFsQjtNQUZvRCxDQUF0RDtJQW5CMkIsQ0FBN0I7SUF1QkEsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7TUFDM0IsVUFBQSxDQUFXLFNBQUE7ZUFDVCxHQUFBLENBQUk7VUFBQSxJQUFBLEVBQU0sVUFBTjtVQUFrQixZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFoQztTQUFKO01BRFMsQ0FBWDtNQUdBLEVBQUEsQ0FBRywrREFBSCxFQUFvRSxTQUFBO2VBQ2xFLE1BQUEsQ0FBTyxPQUFQLEVBQWdCO1VBQUEsSUFBQSxFQUFNLFVBQU47VUFBa0IsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBMUI7U0FBaEI7TUFEa0UsQ0FBcEU7TUFHQSxFQUFBLENBQUcsa0RBQUgsRUFBdUQsU0FBQTtlQUNyRCxNQUFBLENBQU8sS0FBUCxFQUFjO1VBQUEsSUFBQSxFQUFNLFVBQU47U0FBZDtNQURxRCxDQUF2RDtNQUdBLEVBQUEsQ0FBRyxrREFBSCxFQUF1RCxTQUFBO1FBQ3JELEdBQUEsQ0FBSTtVQUFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWQ7U0FBSjtlQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQWdCO1VBQUEsSUFBQSxFQUFNLFVBQU47VUFBa0IsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBMUI7U0FBaEI7TUFGcUQsQ0FBdkQ7YUFJQSxFQUFBLENBQUcsbURBQUgsRUFBd0QsU0FBQTtRQUN0RCxHQUFBLENBQUk7VUFBQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFkO1NBQUo7ZUFDQSxNQUFBLENBQU8sU0FBUCxFQUFrQjtVQUFBLElBQUEsRUFBTSxVQUFOO1VBQWtCLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTFCO1NBQWxCO01BRnNELENBQXhEO0lBZDJCLENBQTdCO0lBa0JBLFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO01BQzNCLFVBQUEsQ0FBVyxTQUFBO2VBQ1QsR0FBQSxDQUFJO1VBQUEsSUFBQSxFQUFNLHFCQUFOO1NBQUo7TUFEUyxDQUFYO01BT0EsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7UUFDM0IsVUFBQSxDQUFXLFNBQUE7aUJBQ1QsR0FBQSxDQUFJO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFKO1FBRFMsQ0FBWDtlQUdBLFFBQUEsQ0FBUyxzQkFBVCxFQUFpQyxTQUFBO2lCQUMvQixFQUFBLENBQUcsMEJBQUgsRUFBK0IsU0FBQTttQkFDN0IsTUFBQSxDQUFPLEtBQVAsRUFDRTtjQUFBLElBQUEsRUFBTSx1QkFBTjtjQUNBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBRFI7YUFERjtVQUQ2QixDQUEvQjtRQUQrQixDQUFqQztNQUoyQixDQUE3QjtNQVVBLFFBQUEsQ0FBUyxtQkFBVCxFQUE4QixTQUFBO1FBQzVCLFVBQUEsQ0FBVyxTQUFBO2lCQUNULEdBQUEsQ0FBSTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBSjtRQURTLENBQVg7UUFHQSxRQUFBLENBQVMsc0JBQVQsRUFBaUMsU0FBQTtpQkFDL0IsRUFBQSxDQUFHLDBCQUFILEVBQStCLFNBQUE7bUJBQzdCLE1BQUEsQ0FBTyxLQUFQLEVBQ0U7Y0FBQSxJQUFBLEVBQU0sdUJBQU47Y0FDQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURSO2FBREY7VUFENkIsQ0FBL0I7UUFEK0IsQ0FBakM7ZUFNQSxRQUFBLENBQVMsZ0NBQVQsRUFBMkMsU0FBQTtVQUN6QyxVQUFBLENBQVcsU0FBQTttQkFDVCxTQUFBLENBQVUsT0FBVjtVQURTLENBQVg7VUFHQSxFQUFBLENBQUcsZ0NBQUgsRUFBcUMsU0FBQTttQkFDbkMsTUFBQSxDQUNFO2NBQUEsSUFBQSxFQUFNLDJCQUFOO2NBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjthQURGO1VBRG1DLENBQXJDO2lCQUtBLFFBQUEsQ0FBUyxlQUFULEVBQTBCLFNBQUE7bUJBQ3hCLEVBQUEsQ0FBRywwQkFBSCxFQUErQixTQUFBO3FCQUM3QixNQUFBLENBQU8sR0FBUCxFQUFZO2dCQUFBLElBQUEsRUFBTSxxQkFBTjtlQUFaO1lBRDZCLENBQS9CO1VBRHdCLENBQTFCO1FBVHlDLENBQTNDO01BVjRCLENBQTlCO01BdUJBLFFBQUEsQ0FBUyxnQkFBVCxFQUEyQixTQUFBO1FBQ3pCLFVBQUEsQ0FBVyxTQUFBO1VBQ1QsR0FBQSxDQUFJO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFKO2lCQUNBLFNBQUEsQ0FBVSxLQUFWO1FBRlMsQ0FBWDtRQUlBLEVBQUEsQ0FBRyxnREFBSCxFQUFxRCxTQUFBO2lCQUNuRCxNQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0sUUFBTjtZQUNBLElBQUEsRUFBTSx1QkFETjtZQUVBLG1CQUFBLEVBQXFCLENBQUMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFELEVBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFULENBRnJCO1dBREY7UUFEbUQsQ0FBckQ7ZUFNQSxFQUFBLENBQUcsZ0NBQUgsRUFBcUMsU0FBQTtpQkFDbkMsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLElBQUEsRUFBTSx5QkFBTjtXQUFaO1FBRG1DLENBQXJDO01BWHlCLENBQTNCO2FBY0EsUUFBQSxDQUFTLGtEQUFULEVBQTZELFNBQUE7UUFDM0QsVUFBQSxDQUFXLFNBQUE7VUFDVCxRQUFRLENBQUMsR0FBVCxDQUFhLHVCQUFiLEVBQXNDLElBQXRDO2lCQUNBLEdBQUEsQ0FBSTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBSjtRQUZTLENBQVg7UUFJQSxFQUFBLENBQUcsc0RBQUgsRUFBMkQsU0FBQTtpQkFDekQsTUFBQSxDQUFPLE9BQVAsRUFDRTtZQUFBLElBQUEsRUFBTSxRQUFOO1lBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjtZQUVBLElBQUEsRUFBTSx5QkFGTjtXQURGO1FBRHlELENBQTNEO1FBU0EsRUFBQSxDQUFHLGdFQUFILEVBQXFFLFNBQUE7VUFDbkUsTUFBQSxDQUFPLE9BQVAsRUFDRTtZQUFBLElBQUEsRUFBTSxRQUFOO1lBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjtZQUVBLElBQUEsRUFBTSx5QkFGTjtXQURGO2lCQVFBLE1BQUEsQ0FBTyxHQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sUUFBTjtZQUNBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBRFI7WUFFQSxJQUFBLEVBQU0sNkJBRk47V0FERjtRQVRtRSxDQUFyRTtlQWlCQSxFQUFBLENBQUcsc0dBQUgsRUFBMkcsU0FBQTtVQUN6RyxNQUFBLENBQU8sT0FBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLFFBQU47WUFDQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURSO1lBRUEsSUFBQSxFQUFNLHlCQUZOO1dBREY7aUJBUUEsTUFBQSxDQUFPLEtBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSxRQUFOO1lBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjtZQUVBLEtBQUEsRUFBTyw2QkFGUDtXQURGO1FBVHlHLENBQTNHO01BL0IyRCxDQUE3RDtJQXZEMkIsQ0FBN0I7SUF3R0EsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7TUFDM0IsVUFBQSxDQUFXLFNBQUE7ZUFDVCxHQUFBLENBQUk7VUFBQSxJQUFBLEVBQU0seUJBQU47VUFBaUMsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBekM7U0FBSjtNQURTLENBQVg7TUFHQSxRQUFBLENBQVMsc0JBQVQsRUFBaUMsU0FBQTtlQUMvQixFQUFBLENBQUcsMEJBQUgsRUFBK0IsU0FBQTtpQkFDN0IsTUFBQSxDQUFPLEtBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSx1QkFBTjtZQUNBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBRFI7V0FERjtRQUQ2QixDQUEvQjtNQUQrQixDQUFqQztNQU1BLFFBQUEsQ0FBUyxnQ0FBVCxFQUEyQyxTQUFBO1FBQ3pDLFVBQUEsQ0FBVyxTQUFBO2lCQUNULFNBQUEsQ0FBVSxPQUFWO1FBRFMsQ0FBWDtRQUdBLEVBQUEsQ0FBRyxnQ0FBSCxFQUFxQyxTQUFBO2lCQUNuQyxNQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0scUJBQU47WUFDQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURSO1dBREY7UUFEbUMsQ0FBckM7ZUFLQSxRQUFBLENBQVMsZUFBVCxFQUEwQixTQUFBO2lCQUN4QixFQUFBLENBQUcsb0JBQUgsRUFBeUIsU0FBQTttQkFDdkIsTUFBQSxDQUFPLEdBQVAsRUFBWTtjQUFBLElBQUEsRUFBTSx5QkFBTjthQUFaO1VBRHVCLENBQXpCO1FBRHdCLENBQTFCO01BVHlDLENBQTNDO2FBYUEsUUFBQSxDQUFTLGdCQUFULEVBQTJCLFNBQUE7ZUFDekIsRUFBQSxDQUFHLGdEQUFILEVBQXFELFNBQUE7aUJBQ25ELE1BQUEsQ0FBTyxLQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sUUFBTjtZQUNBLElBQUEsRUFBTSx1QkFETjtZQUVBLG1CQUFBLEVBQXFCLENBQUMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFELEVBQVMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFULENBRnJCO1dBREY7UUFEbUQsQ0FBckQ7TUFEeUIsQ0FBM0I7SUF2QjJCLENBQTdCO0lBOEJBLFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO0FBQzNCLFVBQUE7TUFBQSxVQUFBLEdBQWE7TUFFYixVQUFBLENBQVcsU0FBQTtRQUNULGVBQUEsQ0FBZ0IsU0FBQTtpQkFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIscUJBQTlCO1FBRGMsQ0FBaEI7UUFHQSxVQUFBLEdBQWEsTUFBTSxDQUFDLFVBQVAsQ0FBQTtlQUNiLEdBQUEsQ0FBSTtVQUFBLElBQUEsRUFBTSxtQkFBTjtVQUEyQixNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFuQztTQUFKO01BTFMsQ0FBWDthQVFBLFFBQUEsQ0FBUyxnREFBVCxFQUEyRCxTQUFBO1FBQ3pELFVBQUEsQ0FBVyxTQUFBO0FBQ1QsY0FBQTtVQUFBLFNBQUEsR0FBWSxJQUFJLENBQUMsUUFBUSxDQUFDLG1CQUFkLENBQWtDLFdBQWxDO2lCQUNaLE1BQU0sQ0FBQyxVQUFQLENBQWtCLFNBQWxCO1FBRlMsQ0FBWDtRQUlBLFNBQUEsQ0FBVSxTQUFBO2lCQUNSLE1BQU0sQ0FBQyxVQUFQLENBQWtCLFVBQWxCO1FBRFEsQ0FBVjtRQUdBLFFBQUEsQ0FBUyxzQkFBVCxFQUFpQyxTQUFBO1VBQy9CLFVBQUEsQ0FBVyxTQUFBO21CQUNULFNBQUEsQ0FBVSxLQUFWO1VBRFMsQ0FBWDtpQkFHQSxFQUFBLENBQUcsMEJBQUgsRUFBK0IsU0FBQTttQkFDN0IsTUFBQSxDQUFPLE1BQU0sQ0FBQyx1QkFBUCxDQUErQixDQUEvQixDQUFQLENBQXlDLENBQUMsSUFBMUMsQ0FBK0MsQ0FBL0M7VUFENkIsQ0FBL0I7UUFKK0IsQ0FBakM7ZUFPQSxRQUFBLENBQVMsZ0NBQVQsRUFBMkMsU0FBQTtVQUN6QyxVQUFBLENBQVcsU0FBQTttQkFDVCxTQUFBLENBQVUsT0FBVjtVQURTLENBQVg7VUFHQSxFQUFBLENBQUcsb0NBQUgsRUFBeUMsU0FBQTttQkFDdkMsTUFBQSxDQUFPO2NBQUEsSUFBQSxFQUFNLGVBQU47Y0FBdUIsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBL0I7YUFBUDtVQUR1QyxDQUF6QztpQkFHQSxRQUFBLENBQVMsZUFBVCxFQUEwQixTQUFBO21CQUN4QixFQUFBLENBQUcsb0JBQUgsRUFBeUIsU0FBQTtxQkFDdkIsTUFBQSxDQUFPLEdBQVAsRUFBWTtnQkFBQSxJQUFBLEVBQU0sbUJBQU47ZUFBWjtZQUR1QixDQUF6QjtVQUR3QixDQUExQjtRQVB5QyxDQUEzQztNQWZ5RCxDQUEzRDtJQVgyQixDQUE3QjtJQXFDQSxRQUFBLENBQVMsV0FBVCxFQUFzQixTQUFBO01BQ3BCLFVBQUEsQ0FBVyxTQUFBO2VBQ1QsR0FBQSxDQUNFO1VBQUEsSUFBQSxFQUFNLDhCQUFOO1VBQ0EsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEZDtTQURGO01BRFMsQ0FBWDtNQUtBLEVBQUEsQ0FBRyx5Q0FBSCxFQUE4QyxTQUFBO1FBQzVDLE1BQUEsQ0FBTyxPQUFQLEVBQWdCO1VBQUEsSUFBQSxFQUFNLDZCQUFOO1VBQXFDLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTdDO1NBQWhCO2VBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBYztVQUFBLElBQUEsRUFBTSwyQkFBTjtVQUFtQyxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUEzQztTQUFkO01BRjRDLENBQTlDO01BSUEsRUFBQSxDQUFHLHFCQUFILEVBQTBCLFNBQUE7ZUFDeEIsTUFBQSxDQUFPLFNBQVAsRUFBa0I7VUFBQSxJQUFBLEVBQU0sMkJBQU47VUFBbUMsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBM0M7U0FBbEI7TUFEd0IsQ0FBMUI7YUFHQSxFQUFBLENBQUcsNkRBQUgsRUFBa0UsU0FBQTtlQUNoRSxNQUFBLENBQU8sV0FBUCxFQUFvQjtVQUFBLElBQUEsRUFBTSw2QkFBTjtVQUFxQyxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUE3QztTQUFwQjtNQURnRSxDQUFsRTtJQWJvQixDQUF0QjtJQWdCQSxRQUFBLENBQVMsWUFBVCxFQUF1QixTQUFBO01BQ3JCLFVBQUEsQ0FBVyxTQUFBO2VBQ1QsR0FBQSxDQUNFO1VBQUEsSUFBQSxFQUFNLDhCQUFOO1VBQ0EsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEZDtTQURGO01BRFMsQ0FBWDtNQUtBLEVBQUEsQ0FBRyx5Q0FBSCxFQUE4QyxTQUFBO1FBQzVDLE1BQUEsQ0FBTyxPQUFQLEVBQWdCO1VBQUEsSUFBQSxFQUFNLDZCQUFOO1VBQXFDLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTdDO1NBQWhCO2VBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBYztVQUFBLElBQUEsRUFBTSwyQkFBTjtVQUFtQyxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUEzQztTQUFkO01BRjRDLENBQTlDO01BSUEsRUFBQSxDQUFHLHFCQUFILEVBQTBCLFNBQUE7ZUFDeEIsTUFBQSxDQUFPLFNBQVAsRUFBa0I7VUFBQSxJQUFBLEVBQU0sMkJBQU47VUFBbUMsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBM0M7U0FBbEI7TUFEd0IsQ0FBMUI7YUFHQSxFQUFBLENBQUcsNkRBQUgsRUFBa0UsU0FBQTtlQUNoRSxNQUFBLENBQU8sV0FBUCxFQUFvQjtVQUFBLElBQUEsRUFBTSw2QkFBTjtVQUFxQyxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUE3QztTQUFwQjtNQURnRSxDQUFsRTtJQWJxQixDQUF2QjtJQWdCQSxRQUFBLENBQVMsV0FBVCxFQUFzQixTQUFBO01BQ3BCLFVBQUEsQ0FBVyxTQUFBO1FBQ1QsR0FBQSxDQUNFO1VBQUEsSUFBQSxFQUFNLDhCQUFOO1VBQ0EsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEZDtTQURGO2VBR0EsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFiLENBQWlCLElBQWpCLEVBQ0U7VUFBQSxrREFBQSxFQUNFO1lBQUEsS0FBQSxFQUFPLDBCQUFQO1dBREY7U0FERjtNQUpTLENBQVg7TUFRQSxFQUFBLENBQUcseUNBQUgsRUFBOEMsU0FBQTtRQUM1QyxNQUFBLENBQU8sT0FBUCxFQUFnQjtVQUFBLElBQUEsRUFBTSw4QkFBTjtVQUFzQyxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUE5QztTQUFoQjtlQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQWM7VUFBQSxJQUFBLEVBQU0sOEJBQU47VUFBc0MsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBOUM7U0FBZDtNQUY0QyxDQUE5QztNQUlBLEVBQUEsQ0FBRyxxQkFBSCxFQUEwQixTQUFBO2VBQ3hCLE1BQUEsQ0FBTyxTQUFQLEVBQWtCO1VBQUEsSUFBQSxFQUFNLDhCQUFOO1VBQXNDLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTlDO1NBQWxCO01BRHdCLENBQTFCO2FBR0EsRUFBQSxDQUFHLDZEQUFILEVBQWtFLFNBQUE7ZUFDaEUsTUFBQSxDQUFPLFdBQVAsRUFBb0I7VUFBQSxJQUFBLEVBQU0sOEJBQU47VUFBc0MsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBOUM7U0FBcEI7TUFEZ0UsQ0FBbEU7SUFoQm9CLENBQXRCO0lBbUJBLFFBQUEsQ0FBUyxVQUFULEVBQXFCLFNBQUE7TUFDbkIsVUFBQSxDQUFXLFNBQUE7ZUFDVCxHQUFBLENBQ0U7VUFBQSxJQUFBLEVBQU0sNkJBQU47VUFDQSxZQUFBLEVBQWMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURkO1NBREY7TUFEUyxDQUFYO01BS0EsRUFBQSxDQUFHLHlDQUFILEVBQThDLFNBQUE7UUFDNUMsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7VUFBQSxJQUFBLEVBQU0sOEJBQU47VUFBc0MsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBOUM7U0FBaEI7ZUFDQSxNQUFBLENBQU8sS0FBUCxFQUFjO1VBQUEsSUFBQSxFQUFNLDhCQUFOO1VBQXNDLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTlDO1NBQWQ7TUFGNEMsQ0FBOUM7TUFJQSxFQUFBLENBQUcscUJBQUgsRUFBMEIsU0FBQTtlQUN4QixNQUFBLENBQU8sU0FBUCxFQUFrQjtVQUFBLElBQUEsRUFBTSw4QkFBTjtVQUFzQyxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUE5QztTQUFsQjtNQUR3QixDQUExQjthQUdBLEVBQUEsQ0FBRyw2REFBSCxFQUFrRSxTQUFBO2VBQ2hFLE1BQUEsQ0FBTyxXQUFQLEVBQW9CO1VBQUEsSUFBQSxFQUFNLDhCQUFOO1VBQXNDLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTlDO1NBQXBCO01BRGdFLENBQWxFO0lBYm1CLENBQXJCO0lBZ0JBLFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO01BQzNCLFVBQUEsQ0FBVyxTQUFBO2VBQ1QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFiLENBQWlCLE1BQWpCLEVBQ0U7VUFBQSxrREFBQSxFQUNFO1lBQUEsT0FBQSxFQUFTLG1DQUFUO1dBREY7U0FERjtNQURTLENBQVg7YUFLQSxRQUFBLENBQVMsZ0JBQVQsRUFBMkIsU0FBQTtlQUN6QixFQUFBLENBQUcsd0JBQUgsRUFBNkIsU0FBQTtVQUMzQixNQUFBLENBQU8sTUFBTSxDQUFDLFlBQVAsQ0FBQSxDQUFQLENBQTZCLENBQUMsSUFBOUIsQ0FBbUMsQ0FBbkM7VUFDQSxHQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0saUJBQU47WUFDQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURSO1dBREY7aUJBR0EsTUFBQSxDQUFPLFNBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSxnQkFBTjtXQURGO1FBTDJCLENBQTdCO01BRHlCLENBQTNCO0lBTjJCLENBQTdCO0lBZUEsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7TUFDM0IsVUFBQSxDQUFXLFNBQUE7ZUFDVCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQWIsQ0FBaUIsTUFBakIsRUFDRTtVQUFBLGtEQUFBLEVBQ0U7WUFBQSxhQUFBLEVBQWUsbUNBQWY7V0FERjtTQURGO01BRFMsQ0FBWDthQUtBLFFBQUEsQ0FBUyxnQkFBVCxFQUEyQixTQUFBO2VBQ3pCLEVBQUEsQ0FBRyx3QkFBSCxFQUE2QixTQUFBO1VBQzNCLE1BQUEsQ0FBTyxNQUFNLENBQUMsWUFBUCxDQUFBLENBQVAsQ0FBNkIsQ0FBQyxJQUE5QixDQUFtQyxDQUFuQztVQUNBLEdBQUEsQ0FDRTtZQUFBLElBQUEsRUFBTSxpQkFBTjtZQUNBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBRFI7V0FERjtpQkFHQSxNQUFBLENBQU8sZUFBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLG1CQUFOO1dBREY7UUFMMkIsQ0FBN0I7TUFEeUIsQ0FBM0I7SUFOMkIsQ0FBN0I7SUFlQSxRQUFBLENBQVMsZUFBVCxFQUEwQixTQUFBO01BQ3hCLFVBQUEsQ0FBVyxTQUFBO2VBQ1QsR0FBQSxDQUNFO1VBQUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZDtTQURGO01BRFMsQ0FBWDthQUlBLFFBQUEsQ0FBUyxnQkFBVCxFQUEyQixTQUFBO1FBQ3pCLEVBQUEsQ0FBRyxpQ0FBSCxFQUFzQyxTQUFBO1VBQ3BDLEdBQUEsQ0FDRTtZQUFBLElBQUEsRUFBTSw4QkFBTjtZQUNBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBRFI7V0FERjtpQkFHQSxNQUFBLENBQU8sV0FBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLHNCQUFOO1dBREY7UUFKb0MsQ0FBdEM7UUFNQSxFQUFBLENBQUcsdURBQUgsRUFBNEQsU0FBQTtVQUMxRCxHQUFBLENBQ0U7WUFBQSxLQUFBLEVBQU8sa0pBQVA7WUFPQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQVBSO1dBREY7aUJBU0EsTUFBQSxDQUFPLGFBQVAsRUFDRTtZQUFBLEtBQUEsRUFBTywwSEFBUDtXQURGO1FBVjBELENBQTVEO2VBa0JBLEVBQUEsQ0FBRyxzREFBSCxFQUEyRCxTQUFBO1VBQ3pELEdBQUEsQ0FDRTtZQUFBLElBQUEsRUFBTSxhQUFOO1lBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjtXQURGO2lCQUdBLE1BQUEsQ0FBTyxXQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sVUFBTjtXQURGO1FBSnlELENBQTNEO01BekJ5QixDQUEzQjtJQUx3QixDQUExQjtJQXFDQSxRQUFBLENBQVMsWUFBVCxFQUF1QixTQUFBO01BQ3JCLFVBQUEsQ0FBVyxTQUFBO2VBQ1QsR0FBQSxDQUNFO1VBQUEsSUFBQSxFQUFNLHlEQUFOO1VBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLEVBQUosQ0FEUjtTQURGO01BRFMsQ0FBWDthQUtBLFFBQUEsQ0FBUyxnQkFBVCxFQUEyQixTQUFBO1FBQ3pCLEVBQUEsQ0FBRyxvQ0FBSCxFQUF5QyxTQUFBO1VBQ3ZDLEdBQUEsQ0FDRTtZQUFBLEtBQUEsRUFBTyxzQkFBUDtZQUlBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBSlI7V0FERjtVQU1BLE1BQUEsQ0FBTyxTQUFQLEVBQ0U7WUFBQSxLQUFBLEVBQU8sZ0JBQVA7V0FERjtpQkFLQSxNQUFBLENBQU8sS0FBUCxFQUNFO1lBQUEsS0FBQSxFQUFPLFVBQVA7V0FERjtRQVp1QyxDQUF6QztRQWlCQSxFQUFBLENBQUcsK0NBQUgsRUFBb0QsU0FBQTtVQUNsRCxHQUFBLENBQ0U7WUFBQSxLQUFBLEVBQU8sc0JBQVA7WUFJQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUpSO1dBREY7VUFNQSxNQUFBLENBQU8sU0FBUCxFQUNFO1lBQUEsS0FBQSxFQUFPLGtCQUFQO1dBREY7aUJBS0EsTUFBQSxDQUFPLEtBQVAsRUFDRTtZQUFBLEtBQUEsRUFBTyxjQUFQO1dBREY7UUFaa0QsQ0FBcEQ7ZUFpQkEsRUFBQSxDQUFHLDRDQUFILEVBQWlELFNBQUE7VUFDL0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFiLENBQWlCLE1BQWpCLEVBQ0U7WUFBQSxrR0FBQSxFQUNFO2NBQUEsS0FBQSxFQUFRLDhCQUFSO2FBREY7V0FERjtVQUlBLEdBQUEsQ0FBSTtZQUFBLEtBQUEsRUFBTyxtQkFBUDtZQUE0QixNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFwQztXQUFKO1VBQ0EsTUFBQSxDQUFPLFNBQVAsRUFBa0I7WUFBQSxLQUFBLEVBQU8sZUFBUDtXQUFsQjtVQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQWdCO1lBQUEsS0FBQSxFQUFPLGFBQVA7V0FBaEI7aUJBQ0EsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7WUFBQSxLQUFBLEVBQU8sV0FBUDtXQUFoQjtRQVIrQyxDQUFqRDtNQW5DeUIsQ0FBM0I7SUFOcUIsQ0FBdkI7SUFtREEsUUFBQSxDQUFTLFVBQVQsRUFBcUIsU0FBQTtNQUNuQixVQUFBLENBQVcsU0FBQTtlQUNULEdBQUEsQ0FDRTtVQUFBLElBQUEsRUFBTSxnRUFBTjtVQU9BLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBUGQ7U0FERjtNQURTLENBQVg7TUFXQSxRQUFBLENBQVMsVUFBVCxFQUFxQixTQUFBO1FBQ25CLFVBQUEsQ0FBVyxTQUFBO2lCQUNULElBQUksQ0FBQyxPQUFPLENBQUMsR0FBYixDQUFpQixlQUFqQixFQUNFO1lBQUEsa0RBQUEsRUFDRTtjQUFBLEtBQUEsRUFBTyx3QkFBUDthQURGO1dBREYsRUFHSSxHQUhKO1FBRFMsQ0FBWDtRQU1BLEVBQUEsQ0FBRyw0Q0FBSCxFQUFpRCxTQUFBO1VBQy9DLE1BQUEsQ0FBTztZQUFDLFNBQUQsRUFBWTtjQUFBLEtBQUEsRUFBTyxHQUFQO2FBQVo7V0FBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLGtFQUFOO1lBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjtXQURGO2lCQUdBLE1BQUEsQ0FBTyxLQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sb0VBQU47V0FERjtRQUorQyxDQUFqRDtRQU1BLEVBQUEsQ0FBRyw0Q0FBSCxFQUFpRCxTQUFBO1VBQy9DLE1BQUEsQ0FBTztZQUFDLFNBQUQsRUFBWTtjQUFBLEtBQUEsRUFBTyxHQUFQO2FBQVo7V0FBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLGtFQUFOO1lBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjtXQURGO2lCQUdBLE1BQUEsQ0FBTyxLQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sb0VBQU47V0FERjtRQUorQyxDQUFqRDtRQU1BLEVBQUEsQ0FBRyxtQkFBSCxFQUF3QixTQUFBO1VBQ3RCLE1BQUEsQ0FBTztZQUFDLFNBQUQsRUFBWTtjQUFBLEtBQUEsRUFBTyxHQUFQO2FBQVo7V0FBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLHNFQUFOO1lBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjtXQURGO2lCQUdBLE1BQUEsQ0FBTyxPQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sNEVBQU47V0FERjtRQUpzQixDQUF4QjtRQU1BLFFBQUEsQ0FBUyw0Q0FBVCxFQUF1RCxTQUFBO1VBQ3JELFVBQUEsQ0FBVyxTQUFBO21CQUNULEdBQUEsQ0FBSTtjQUFBLElBQUEsRUFBTSxXQUFOO2NBQW1CLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTNCO2FBQUo7VUFEUyxDQUFYO1VBRUEsUUFBQSxDQUFTLGlCQUFULEVBQTRCLFNBQUE7bUJBQzFCLEVBQUEsQ0FBRywwQkFBSCxFQUErQixTQUFBO3FCQUM3QixNQUFBLENBQU87Z0JBQUMsT0FBRCxFQUFVO2tCQUFBLEtBQUEsRUFBTyxJQUFQO2lCQUFWO2VBQVAsRUFBK0I7Z0JBQUEsSUFBQSxFQUFNLGFBQU47Z0JBQXFCLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTdCO2VBQS9CO1lBRDZCLENBQS9CO1VBRDBCLENBQTVCO2lCQUlBLFFBQUEsQ0FBUyxpQkFBVCxFQUE0QixTQUFBO1lBQzFCLFVBQUEsQ0FBVyxTQUFBO2NBQ1QsR0FBQSxDQUFJO2dCQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7ZUFBSjtjQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Z0JBQUEsSUFBQSxFQUFNO2tCQUFBLEdBQUEsRUFBSyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQUw7aUJBQU47ZUFBZDtxQkFDQSxHQUFBLENBQUk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFKO1lBSFMsQ0FBWDttQkFLQSxFQUFBLENBQUcsMEJBQUgsRUFBK0IsU0FBQTtxQkFDN0IsTUFBQSxDQUFPO2dCQUFDLE9BQUQsRUFBVTtrQkFBQSxLQUFBLEVBQU8sSUFBUDtpQkFBVjtlQUFQLEVBQStCO2dCQUFBLElBQUEsRUFBTSxhQUFOO2dCQUFxQixNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUE3QjtlQUEvQjtZQUQ2QixDQUEvQjtVQU4wQixDQUE1QjtRQVBxRCxDQUF2RDtlQWdCQSxRQUFBLENBQVMsd0NBQVQsRUFBbUQsU0FBQTtVQUNqRCxVQUFBLENBQVcsU0FBQTtZQUNULFFBQVEsQ0FBQyxHQUFULENBQWEsZ0NBQWIsRUFBK0MsQ0FBQyxHQUFELEVBQU0sR0FBTixFQUFXLEdBQVgsQ0FBL0M7bUJBQ0EsR0FBQSxDQUNFO2NBQUEsSUFBQSxFQUFNLHVCQUFOO2NBQ0EsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEZDthQURGO1VBRlMsQ0FBWDtVQU1BLFFBQUEsQ0FBUywyQ0FBVCxFQUFzRCxTQUFBO21CQUNwRCxFQUFBLENBQUcscURBQUgsRUFBMEQsU0FBQTtjQUN4RCxNQUFBLENBQU87Z0JBQUMsU0FBRCxFQUFZO2tCQUFBLEtBQUEsRUFBTyxHQUFQO2lCQUFaO2VBQVAsRUFBZ0M7Z0JBQUEsSUFBQSxFQUFNLDJCQUFOO2VBQWhDO2NBQ0EsU0FBQSxDQUFVLEdBQVY7Y0FDQSxNQUFBLENBQU87Z0JBQUMsU0FBRCxFQUFZO2tCQUFBLEtBQUEsRUFBTyxHQUFQO2lCQUFaO2VBQVAsRUFBZ0M7Z0JBQUEsSUFBQSxFQUFNLCtCQUFOO2VBQWhDO2NBQ0EsU0FBQSxDQUFVLEdBQVY7cUJBQ0EsTUFBQSxDQUFPO2dCQUFDLFNBQUQsRUFBWTtrQkFBQSxLQUFBLEVBQU8sR0FBUDtpQkFBWjtlQUFQLEVBQWdDO2dCQUFBLElBQUEsRUFBTSxtQ0FBTjtlQUFoQztZQUx3RCxDQUExRDtVQURvRCxDQUF0RDtpQkFRQSxRQUFBLENBQVMsK0NBQVQsRUFBMEQsU0FBQTttQkFDeEQsRUFBQSxDQUFHLHFEQUFILEVBQTBELFNBQUE7Y0FDeEQsTUFBQSxDQUFPO2dCQUFDLFNBQUQsRUFBWTtrQkFBQSxLQUFBLEVBQU8sR0FBUDtpQkFBWjtlQUFQLEVBQWdDO2dCQUFBLElBQUEsRUFBTSx5QkFBTjtlQUFoQztjQUNBLFNBQUEsQ0FBVSxHQUFWO2NBQ0EsTUFBQSxDQUFPO2dCQUFDLFNBQUQsRUFBWTtrQkFBQSxLQUFBLEVBQU8sR0FBUDtpQkFBWjtlQUFQLEVBQWdDO2dCQUFBLElBQUEsRUFBTSwyQkFBTjtlQUFoQztjQUNBLFNBQUEsQ0FBVSxHQUFWO3FCQUNBLE1BQUEsQ0FBTztnQkFBQyxTQUFELEVBQVk7a0JBQUEsS0FBQSxFQUFPLEdBQVA7aUJBQVo7ZUFBUCxFQUFnQztnQkFBQSxJQUFBLEVBQU0sNkJBQU47ZUFBaEM7WUFMd0QsQ0FBMUQ7VUFEd0QsQ0FBMUQ7UUFmaUQsQ0FBbkQ7TUF6Q21CLENBQXJCO01BZ0VBLFFBQUEsQ0FBUyxjQUFULEVBQXlCLFNBQUE7UUFDdkIsVUFBQSxDQUFXLFNBQUE7VUFDVCxPQUFPLENBQUMsV0FBUixDQUFvQixhQUFwQjtVQUVBLEdBQUEsQ0FDRTtZQUFBLElBQUEsRUFBTSx1Q0FBTjtZQVFBLFlBQUEsRUFBYyxDQUFDLENBQUQsRUFBSSxDQUFKLENBUmQ7V0FERjtpQkFXQSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQWIsQ0FBaUIsSUFBakIsRUFDRTtZQUFBLGtEQUFBLEVBQ0U7Y0FBQSxLQUFBLEVBQU8sNEJBQVA7YUFERjtZQUVBLDRDQUFBLEVBQ0U7Y0FBQSxLQUFBLEVBQVEsNEJBQVI7YUFIRjtXQURGO1FBZFMsQ0FBWDtRQW1CQSxFQUFBLENBQUcsOENBQUgsRUFBbUQsU0FBQTtpQkFDakQsTUFBQSxDQUFPO1lBQUMsU0FBRCxFQUFZO2NBQUEsS0FBQSxFQUFPLEdBQVA7YUFBWjtXQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0saURBQU47WUFDQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURSO1dBREY7UUFEaUQsQ0FBbkQ7UUFJQSxFQUFBLENBQUcsOENBQUgsRUFBbUQsU0FBQTtVQUNqRCxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7aUJBQ0EsTUFBQSxDQUFPO1lBQUMsU0FBRCxFQUFZO2NBQUEsS0FBQSxFQUFPLEdBQVA7YUFBWjtXQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sMkNBQU47WUFDQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURSO1dBREY7UUFGaUQsQ0FBbkQ7ZUFLQSxFQUFBLENBQUcsaURBQUgsRUFBc0QsU0FBQTtpQkFDcEQsTUFBQSxDQUFPO1lBQUMsV0FBRCxFQUFjO2NBQUEsS0FBQSxFQUFPLEdBQVA7YUFBZDtXQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0saURBQU47WUFDQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURSO1dBREY7UUFEb0QsQ0FBdEQ7TUE3QnVCLENBQXpCO01Ba0NBLFFBQUEsQ0FBUyxpQkFBVCxFQUE0QixTQUFBO1FBQzFCLFVBQUEsQ0FBVyxTQUFBO1VBQ1QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFiLENBQWlCLGVBQWpCLEVBQ0U7WUFBQSw0Q0FBQSxFQUNFO2NBQUEsS0FBQSxFQUFPLCtCQUFQO2FBREY7V0FERjtpQkFHQSxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7UUFKUyxDQUFYO1FBTUEsRUFBQSxDQUFHLHdDQUFILEVBQTZDLFNBQUE7VUFDM0MsTUFBQSxDQUFPO1lBQUMsS0FBRCxFQUFRO2NBQUEsS0FBQSxFQUFPLEdBQVA7YUFBUjtXQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sOERBQU47V0FERjtpQkFFQSxNQUFBLENBQU8sT0FBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLDREQUFOO1dBREY7UUFIMkMsQ0FBN0M7UUFLQSxFQUFBLENBQUcsZ0RBQUgsRUFBcUQsU0FBQTtVQUNuRCxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7aUJBQ0EsTUFBQSxDQUFPO1lBQUMsS0FBRCxFQUFRO2NBQUEsS0FBQSxFQUFPLEdBQVA7YUFBUjtXQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sOERBQU47V0FERjtRQUZtRCxDQUFyRDtRQUlBLEVBQUEsQ0FBRyw2RUFBSCxFQUFrRixTQUFBO1VBQ2hGLEdBQUEsQ0FDRTtZQUFBLElBQUEsRUFBTSw0QkFBTjtZQUlBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBSlI7V0FERjtVQU1BLE1BQUEsQ0FBTztZQUFDLEtBQUQsRUFBUTtjQUFBLEtBQUEsRUFBTyxHQUFQO2FBQVI7V0FBUCxFQUE0QjtZQUFBLElBQUEsRUFBTSx3QkFBTjtXQUE1QjtpQkFDQSxNQUFBLENBQU87WUFBQyxPQUFELEVBQVU7Y0FBQSxLQUFBLEVBQU8sR0FBUDthQUFWO1dBQVAsRUFBOEI7WUFBQSxJQUFBLEVBQU0saUJBQU47V0FBOUI7UUFSZ0YsQ0FBbEY7UUFTQSxFQUFBLENBQUcsNkVBQUgsRUFBa0YsU0FBQTtVQUNoRixHQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0sOEJBQU47WUFJQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUpSO1dBREY7VUFNQSxNQUFBLENBQU87WUFBQyxLQUFELEVBQVE7Y0FBQSxLQUFBLEVBQU8sR0FBUDthQUFSO1dBQVAsRUFBNEI7WUFBQSxLQUFBLEVBQU8sMEJBQVA7V0FBNUI7aUJBQ0EsTUFBQSxDQUFPO1lBQUMsT0FBRCxFQUFVO2NBQUEsS0FBQSxFQUFPLEdBQVA7YUFBVjtXQUFQLEVBQThCO1lBQUEsS0FBQSxFQUFPLHdCQUFQO1dBQTlCO1FBUmdGLENBQWxGO2VBU0EsRUFBQSxDQUFHLDhEQUFILEVBQW1FLFNBQUE7VUFDakUsR0FBQSxDQUNFO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLEVBQUosQ0FBUjtZQUNBLElBQUEsRUFBTSwwRUFETjtXQURGO2lCQVFBLE1BQUEsQ0FBTztZQUFDLEtBQUQsRUFBUTtjQUFBLEtBQUEsRUFBTyxHQUFQO2FBQVI7V0FBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLENBQ0Ysa0NBREUsRUFFRixvQkFGRSxFQUdGLGdCQUhFLEVBSUYsRUFKRSxDQUtILENBQUMsSUFMRSxDQUtHLElBTEgsQ0FBTjtXQURGO1FBVGlFLENBQW5FO01BbEMwQixDQUE1QjtNQW1EQSxRQUFBLENBQVMsaUJBQVQsRUFBNEIsU0FBQTtRQUMxQixVQUFBLENBQVcsU0FBQTtVQUNULElBQUksQ0FBQyxPQUFPLENBQUMsR0FBYixDQUFpQixlQUFqQixFQUNFO1lBQUEsNENBQUEsRUFDRTtjQUFBLEtBQUEsRUFBTywrQkFBUDthQURGO1dBREY7aUJBSUEsR0FBQSxDQUNFO1lBQUEsSUFBQSxFQUFNLHNDQUFOO1lBTUEsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FOZDtXQURGO1FBTFMsQ0FBWDtRQWFBLEVBQUEsQ0FBRyx3Q0FBSCxFQUE2QyxTQUFBO1VBQzNDLE1BQUEsQ0FBTztZQUFDLEtBQUQsRUFBUTtjQUFBLEtBQUEsRUFBTyxJQUFQO2FBQVI7V0FBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLHNDQUFOO1dBREY7aUJBT0EsTUFBQSxDQUFPLE9BQVAsRUFDRTtZQUFBLElBQUEsRUFBTSxzQ0FBTjtXQURGO1FBUjJDLENBQTdDO1FBZUEsRUFBQSxDQUFHLHlCQUFILEVBQThCLFNBQUE7VUFDNUIsTUFBQSxDQUFPO1lBQUMsU0FBRCxFQUFZO2NBQUEsS0FBQSxFQUFPLElBQVA7YUFBWjtXQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sd0NBQU47V0FERjtpQkFPQSxNQUFBLENBQU87WUFBQyxTQUFELEVBQVk7Y0FBQSxLQUFBLEVBQU8sSUFBUDthQUFaO1dBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSx3Q0FBTjtXQURGO1FBUjRCLENBQTlCO1FBZ0JBLEVBQUEsQ0FBRyw4REFBSCxFQUFtRSxTQUFBO1VBQ2pFLEdBQUEsQ0FDRTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxFQUFKLENBQVI7WUFDQSxJQUFBLEVBQU0sMEVBRE47V0FERjtpQkFRQSxNQUFBLENBQU87WUFBQyxLQUFELEVBQVE7Y0FBQSxLQUFBLEVBQU8sSUFBUDthQUFSO1dBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSwwRUFBTjtXQURGO1FBVGlFLENBQW5FO2VBaUJBLFFBQUEsQ0FBUyx3Q0FBVCxFQUFtRCxTQUFBO0FBQ2pELGNBQUE7VUFBQSxvQkFBQSxHQUF1QixTQUFDLGVBQUQsRUFBa0IsT0FBbEI7QUFDckIsZ0JBQUE7WUFBQSxHQUFBLENBQUk7Y0FBQSxJQUFBLEVBQU0sT0FBTyxDQUFDLFdBQWQ7Y0FBMkIsWUFBQSxFQUFjLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBekM7YUFBSjtZQUNBLE9BQU8sT0FBTyxDQUFDO1lBQ2YsVUFBQSxHQUFhLENBQUMsS0FBRCxDQUFPLENBQUMsTUFBUixDQUFlO2NBQUMsS0FBQSxFQUFPLGVBQVI7YUFBZjttQkFDYixNQUFBLENBQU8sVUFBUCxFQUFtQixPQUFuQjtVQUpxQjtVQU12QixVQUFBLENBQVcsU0FBQTttQkFDVCxRQUFRLENBQUMsR0FBVCxDQUFhLGdDQUFiLEVBQStDLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLENBQS9DO1VBRFMsQ0FBWDtVQUdBLFFBQUEsQ0FBUyxzREFBVCxFQUFpRSxTQUFBO1lBQy9ELFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO3FCQUMzQixFQUFBLENBQUcsZ0VBQUgsRUFBcUUsU0FBQTtnQkFDbkUsb0JBQUEsQ0FBcUIsSUFBckIsRUFBMkI7a0JBQUEsV0FBQSxFQUFhLFNBQWI7a0JBQXdCLElBQUEsRUFBTSxXQUE5QjtpQkFBM0I7Z0JBQ0Esb0JBQUEsQ0FBcUIsSUFBckIsRUFBMkI7a0JBQUEsV0FBQSxFQUFhLFdBQWI7a0JBQTBCLElBQUEsRUFBTSxXQUFoQztpQkFBM0I7dUJBQ0Esb0JBQUEsQ0FBcUIsSUFBckIsRUFBMkI7a0JBQUEsV0FBQSxFQUFhLGFBQWI7a0JBQTRCLElBQUEsRUFBTSxXQUFsQztpQkFBM0I7Y0FIbUUsQ0FBckU7WUFEMkIsQ0FBN0I7bUJBTUEsUUFBQSxDQUFTLGlCQUFULEVBQTRCLFNBQUE7cUJBQzFCLEVBQUEsQ0FBRyxxQ0FBSCxFQUEwQyxTQUFBO3VCQUN4QyxvQkFBQSxDQUFxQixJQUFyQixFQUEyQjtrQkFBQSxXQUFBLEVBQWEsYUFBYjtrQkFBNEIsSUFBQSxFQUFNLGFBQWxDO2lCQUEzQjtjQUR3QyxDQUExQztZQUQwQixDQUE1QjtVQVArRCxDQUFqRTtpQkFXQSxRQUFBLENBQVMsZ0VBQVQsRUFBMkUsU0FBQTtZQUN6RSxFQUFBLENBQUcsZ0VBQUgsRUFBcUUsU0FBQTtjQUNuRSxvQkFBQSxDQUFxQixJQUFyQixFQUEyQjtnQkFBQSxXQUFBLEVBQWEsU0FBYjtnQkFBd0IsSUFBQSxFQUFNLFNBQTlCO2VBQTNCO2NBQ0Esb0JBQUEsQ0FBcUIsSUFBckIsRUFBMkI7Z0JBQUEsV0FBQSxFQUFhLFdBQWI7Z0JBQTBCLElBQUEsRUFBTSxTQUFoQztlQUEzQjtxQkFDQSxvQkFBQSxDQUFxQixJQUFyQixFQUEyQjtnQkFBQSxXQUFBLEVBQWEsYUFBYjtnQkFBNEIsSUFBQSxFQUFNLFNBQWxDO2VBQTNCO1lBSG1FLENBQXJFO21CQUlBLEVBQUEsQ0FBRyw0RUFBSCxFQUFpRixTQUFBO2NBQy9FLG9CQUFBLENBQXFCLElBQXJCLEVBQTJCO2dCQUFBLFdBQUEsRUFBYSxTQUFiO2dCQUF3QixJQUFBLEVBQU0sU0FBOUI7ZUFBM0I7Y0FDQSxvQkFBQSxDQUFxQixJQUFyQixFQUEyQjtnQkFBQSxXQUFBLEVBQWEsYUFBYjtnQkFBNEIsSUFBQSxFQUFNLGFBQWxDO2VBQTNCO3FCQUNBLG9CQUFBLENBQXFCLEtBQXJCLEVBQTRCO2dCQUFBLFdBQUEsRUFBYSxhQUFiO2dCQUE0QixJQUFBLEVBQU0sYUFBbEM7ZUFBNUI7WUFIK0UsQ0FBakY7VUFMeUUsQ0FBM0U7UUFyQmlELENBQW5EO01BOUQwQixDQUE1QjtNQTZGQSxRQUFBLENBQVMsZUFBVCxFQUEwQixTQUFBO1FBQ3hCLFVBQUEsQ0FBVyxTQUFBO2lCQUNULElBQUksQ0FBQyxPQUFPLENBQUMsR0FBYixDQUFpQixlQUFqQixFQUNFO1lBQUEsNENBQUEsRUFDRTtjQUFBLE9BQUEsRUFBUyw2QkFBVDthQURGO1dBREY7UUFEUyxDQUFYO1FBS0EsRUFBQSxDQUFHLHVDQUFILEVBQTRDLFNBQUE7VUFDMUMsTUFBQSxDQUFPO1lBQUMsT0FBRCxFQUFVO2NBQUEsS0FBQSxFQUFPLEdBQVA7YUFBVjtXQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sa0VBQU47WUFDQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURSO1dBREY7aUJBR0EsTUFBQSxDQUFPLEtBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSxvRUFBTjtXQURGO1FBSjBDLENBQTVDO2VBTUEsRUFBQSxDQUFHLHVDQUFILEVBQTRDLFNBQUE7VUFDMUMsTUFBQSxDQUFPO1lBQUMsT0FBRCxFQUFVO2NBQUEsS0FBQSxFQUFPLEdBQVA7YUFBVjtXQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sa0VBQU47WUFDQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQURSO1dBREY7aUJBR0EsTUFBQSxDQUFPLEtBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSxvRUFBTjtXQURGO1FBSjBDLENBQTVDO01BWndCLENBQTFCO01BbUJBLFFBQUEsQ0FBUywwQkFBVCxFQUFxQyxTQUFBO1FBQ25DLFVBQUEsQ0FBVyxTQUFBO1VBQ1QsR0FBQSxDQUNFO1lBQUEsSUFBQSxFQUFNLHlFQUFOO1lBT0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FQUjtXQURGO2lCQVVBLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBYixDQUFpQixNQUFqQixFQUNFO1lBQUEsa0RBQUEsRUFDRTtjQUFBLEtBQUEsRUFBTyx3Q0FBUDthQURGO1dBREY7UUFYUyxDQUFYO1FBZUEsRUFBQSxDQUFHLGlEQUFILEVBQXNELFNBQUE7VUFDcEQsTUFBQSxDQUFPLEtBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSxxRUFBTjtXQURGO2lCQUVBLE1BQUEsQ0FBTyxHQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sbUVBQU47V0FERjtRQUhvRCxDQUF0RDtRQU1BLEVBQUEsQ0FBRyw4RUFBSCxFQUFtRixTQUFBO1VBQ2pGLEdBQUEsQ0FBSTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxFQUFKLENBQVI7V0FBSjtVQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0scUVBQU47V0FERjtVQUVBLE1BQUEsQ0FBTyxHQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sbUVBQU47V0FERjtpQkFFQSxNQUFBLENBQU8sR0FBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLG1FQUFOO1dBREY7UUFOaUYsQ0FBbkY7ZUFTQSxFQUFBLENBQUcsZ0RBQUgsRUFBcUQsU0FBQTtVQUNuRCxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7aUJBQ0EsTUFBQSxDQUFPLEtBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSxxRUFBTjtXQURGO1FBRm1ELENBQXJEO01BL0JtQyxDQUFyQztNQW9DQSxRQUFBLENBQVMsMkNBQVQsRUFBc0QsU0FBQTtRQUNwRCxVQUFBLENBQVcsU0FBQTtVQUNULFFBQVEsQ0FBQyxHQUFULENBQWEsdUJBQWIsRUFBc0MsSUFBdEM7aUJBQ0EsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFiLENBQWlCLE1BQWpCLEVBQ0U7WUFBQSxrREFBQSxFQUNFO2NBQUEsS0FBQSxFQUFPLHlEQUFQO2FBREY7V0FERjtRQUZTLENBQVg7ZUFLQSxFQUFBLENBQUcsaUJBQUgsRUFBc0IsU0FBQTtVQUNwQixHQUFBLENBQ0U7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1lBQ0EsSUFBQSxFQUFNLHdCQUROO1dBREY7VUFNQSxNQUFBLENBQU8sS0FBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLHNCQUFOO1lBSUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FKUjtXQURGO2lCQU1BLE1BQUEsQ0FBTyxLQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sb0JBQU47WUFJQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUpSO1dBREY7UUFib0IsQ0FBdEI7TUFOb0QsQ0FBdEQ7TUEwQkEsUUFBQSxDQUFTLDBCQUFULEVBQXFDLFNBQUE7UUFDbkMsVUFBQSxDQUFXLFNBQUE7VUFDVCxHQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0sc0NBQU47WUFNQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQU5SO1dBREY7aUJBU0EsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFiLENBQWlCLE1BQWpCLEVBQ0U7WUFBQSxrREFBQSxFQUNFO2NBQUEsS0FBQSxFQUFPLHdDQUFQO2FBREY7V0FERjtRQVZTLENBQVg7ZUFjQSxFQUFBLENBQUcsaURBQUgsRUFBc0QsU0FBQTtVQUNwRCxNQUFBLENBQU87WUFBQyxLQUFELEVBQVE7Y0FBQSxLQUFBLEVBQU8sR0FBUDthQUFSO1dBQVAsRUFBNEI7WUFBQSxJQUFBLEVBQU0sc0NBQU47V0FBNUI7VUFDQSxNQUFBLENBQU8sS0FBUCxFQUFjO1lBQUEsSUFBQSxFQUFNLHNDQUFOO1dBQWQ7aUJBQ0EsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7WUFBQSxJQUFBLEVBQU0sc0NBQU47V0FBaEI7UUFIb0QsQ0FBdEQ7TUFmbUMsQ0FBckM7YUFvQkEsUUFBQSxDQUFTLDJDQUFULEVBQXNELFNBQUE7UUFDcEQsVUFBQSxDQUFXLFNBQUE7VUFDVCxRQUFRLENBQUMsR0FBVCxDQUFhLHVCQUFiLEVBQXNDLElBQXRDO2lCQUNBLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBYixDQUFpQixNQUFqQixFQUNFO1lBQUEsa0RBQUEsRUFDRTtjQUFBLEtBQUEsRUFBTyx5REFBUDthQURGO1dBREY7UUFGUyxDQUFYO2VBS0EsRUFBQSxDQUFHLGlCQUFILEVBQXNCLFNBQUE7VUFDcEIsR0FBQSxDQUNFO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtZQUNBLElBQUEsRUFBTSx3QkFETjtXQURGO1VBTUEsTUFBQSxDQUFPO1lBQUMsS0FBRCxFQUFRO2NBQUEsS0FBQSxFQUFPLEdBQVA7YUFBUjtXQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sd0JBQU47WUFJQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUpSO1dBREY7aUJBTUEsTUFBQSxDQUFPLEtBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSx3QkFBTjtZQUlBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBSlI7V0FERjtRQWJvQixDQUF0QjtNQU5vRCxDQUF0RDtJQW5XbUIsQ0FBckI7SUE2WEEsUUFBQSxDQUFTLHFCQUFULEVBQWdDLFNBQUE7QUFDOUIsVUFBQTtNQUFBLFlBQUEsR0FBZTtNQUNmLFVBQUEsQ0FBVyxTQUFBO1FBQ1QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFiLENBQWlCLE1BQWpCLEVBQ0U7VUFBQSxrREFBQSxFQUNFO1lBQUEsR0FBQSxFQUFLLHFDQUFMO1dBREY7U0FERjtRQUlBLFlBQUEsR0FBZTtRQUtmLEdBQUEsQ0FDRTtVQUFBLElBQUEsRUFBTSxZQUFOO1VBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjtTQURGO1FBSUEsR0FBQSxDQUFJO1VBQUEsUUFBQSxFQUFVO1lBQUEsR0FBQSxFQUFLO2NBQUEsSUFBQSxFQUFNLGtCQUFOO2NBQTBCLElBQUEsRUFBTSxXQUFoQzthQUFMO1dBQVY7U0FBSjtlQUNBLEdBQUEsQ0FBSTtVQUFBLFFBQUEsRUFBVTtZQUFBLEdBQUEsRUFBSztjQUFBLElBQUEsRUFBTSxZQUFOO2NBQW9CLElBQUEsRUFBTSxXQUExQjthQUFMO1dBQVY7U0FBSjtNQWZTLENBQVg7TUFpQkEsRUFBQSxDQUFHLDRDQUFILEVBQWlELFNBQUE7UUFDL0MsTUFBQSxDQUFPLE9BQVAsRUFDRTtVQUFBLFlBQUEsRUFBYyxLQUFkO1NBREY7ZUFFQSxNQUFBLENBQU8sR0FBUCxFQUNFO1VBQUEsSUFBQSxFQUFNLFFBQU47VUFDQSxJQUFBLEVBQU0sWUFBWSxDQUFDLE9BQWIsQ0FBcUIsS0FBckIsRUFBNEIsa0JBQTVCLENBRE47U0FERjtNQUgrQyxDQUFqRDtNQU9BLEVBQUEsQ0FBRyw4Q0FBSCxFQUFtRCxTQUFBO1FBQ2pELEdBQUEsQ0FBSTtVQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7U0FBSjtlQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQ0U7VUFBQSxJQUFBLEVBQU0sUUFBTjtVQUNBLElBQUEsRUFBTSxZQUFZLENBQUMsT0FBYixDQUFxQixhQUFyQixFQUFvQyxrQkFBcEMsQ0FETjtTQURGO01BRmlELENBQW5EO01BTUEsRUFBQSxDQUFHLFlBQUgsRUFBaUIsU0FBQTtRQUNmLEdBQUEsQ0FBSTtVQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7U0FBSjtlQUNBLE1BQUEsQ0FBTyxXQUFQLEVBQ0U7VUFBQSxJQUFBLEVBQU0sUUFBTjtVQUNBLElBQUEsRUFBTSxZQUFZLENBQUMsT0FBYixDQUFxQixjQUFyQixFQUFxQyxrQkFBckMsQ0FETjtTQURGO01BRmUsQ0FBakI7YUFNQSxFQUFBLENBQUcsNENBQUgsRUFBaUQsU0FBQTtRQUMvQyxHQUFBLENBQUk7VUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1NBQUo7ZUFDQSxNQUFBLENBQU87VUFBQyxHQUFELEVBQU07WUFBQSxLQUFBLEVBQU8sR0FBUDtXQUFOLEVBQWtCLE9BQWxCO1NBQVAsRUFDRTtVQUFBLElBQUEsRUFBTSxRQUFOO1VBQ0EsSUFBQSxFQUFNLFlBQVksQ0FBQyxPQUFiLENBQXFCLGFBQXJCLEVBQW9DLFlBQXBDLENBRE47U0FERjtNQUYrQyxDQUFqRDtJQXRDOEIsQ0FBaEM7SUE0Q0EsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7QUFDM0IsVUFBQTtNQUFBLFlBQUEsR0FBZTtNQUNmLFVBQUEsQ0FBVyxTQUFBO1FBQ1QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFiLENBQWlCLE1BQWpCLEVBQ0U7VUFBQSxrREFBQSxFQUNFO1lBQUEsS0FBQSxFQUFPLGtDQUFQO1dBREY7U0FERjtRQUlBLFlBQUEsR0FBZTtRQUtmLEdBQUEsQ0FDRTtVQUFBLElBQUEsRUFBTSxZQUFOO1VBQ0EsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FEUjtTQURGO1FBSUEsR0FBQSxDQUFJO1VBQUEsUUFBQSxFQUFVO1lBQUEsR0FBQSxFQUFLO2NBQUEsSUFBQSxFQUFNLGtCQUFOO2NBQTBCLElBQUEsRUFBTSxXQUFoQzthQUFMO1dBQVY7U0FBSjtlQUNBLEdBQUEsQ0FBSTtVQUFBLFFBQUEsRUFBVTtZQUFBLEdBQUEsRUFBSztjQUFBLElBQUEsRUFBTSxZQUFOO2NBQW9CLElBQUEsRUFBTSxXQUExQjthQUFMO1dBQVY7U0FBSjtNQWZTLENBQVg7TUFpQkEsRUFBQSxDQUFHLHlDQUFILEVBQThDLFNBQUE7UUFDNUMsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7VUFBQSxZQUFBLEVBQWMsS0FBZDtTQUFoQjtlQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQ0U7VUFBQSxJQUFBLEVBQU0sUUFBTjtVQUNBLElBQUEsRUFBTSxZQUFZLENBQUMsT0FBYixDQUFxQixLQUFyQixFQUE0QixrQkFBNUIsQ0FETjtVQUVBLFFBQUEsRUFBVTtZQUFBLEdBQUEsRUFBSztjQUFBLElBQUEsRUFBTSxLQUFOO2FBQUw7V0FGVjtTQURGO01BRjRDLENBQTlDO01BT0EsRUFBQSxDQUFHLDJDQUFILEVBQWdELFNBQUE7UUFDOUMsR0FBQSxDQUFJO1VBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtTQUFKO2VBQ0EsTUFBQSxDQUFPLFNBQVAsRUFDRTtVQUFBLElBQUEsRUFBTSxRQUFOO1VBQ0EsSUFBQSxFQUFNLFlBQVksQ0FBQyxPQUFiLENBQXFCLEtBQXJCLEVBQTRCLGtCQUE1QixDQUROO1VBRUEsUUFBQSxFQUFVO1lBQUEsR0FBQSxFQUFLO2NBQUEsSUFBQSxFQUFNLEtBQU47YUFBTDtXQUZWO1NBREY7TUFGOEMsQ0FBaEQ7TUFPQSxFQUFBLENBQUcsWUFBSCxFQUFpQixTQUFBO0FBQ2YsWUFBQTtRQUFBLEdBQUEsQ0FBSTtVQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7U0FBSjtRQUNBLFdBQUEsR0FBYztlQUtkLE1BQUEsQ0FBTyxhQUFQLEVBQ0U7VUFBQSxJQUFBLEVBQU0sUUFBTjtVQUNBLElBQUEsRUFBTSxXQUROO1VBRUEsUUFBQSxFQUFVO1lBQUEsR0FBQSxFQUFLO2NBQUEsSUFBQSxFQUFNLEtBQU47YUFBTDtXQUZWO1NBREY7TUFQZSxDQUFqQjthQVlBLEVBQUEsQ0FBRyx5Q0FBSCxFQUE4QyxTQUFBO1FBQzVDLEdBQUEsQ0FBSTtVQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7U0FBSjtlQUNBLE1BQUEsQ0FBTztVQUFDLEdBQUQsRUFBTTtZQUFBLEtBQUEsRUFBTyxHQUFQO1dBQU4sRUFBa0IsU0FBbEI7U0FBUCxFQUNFO1VBQUEsSUFBQSxFQUFNLFFBQU47VUFDQSxJQUFBLEVBQU0sWUFBWSxDQUFDLE9BQWIsQ0FBcUIsS0FBckIsRUFBNEIsWUFBNUIsQ0FETjtVQUVBLFFBQUEsRUFBVTtZQUFBLEdBQUEsRUFBSztjQUFBLElBQUEsRUFBTSxLQUFOO2FBQUw7V0FGVjtTQURGO01BRjRDLENBQTlDO0lBN0MyQixDQUE3QjtJQW9EQSxRQUFBLENBQVMsa0JBQVQsRUFBNkIsU0FBQTtNQUMzQixVQUFBLENBQVcsU0FBQTtRQUNULElBQUksQ0FBQyxPQUFPLENBQUMsR0FBYixDQUFpQixNQUFqQixFQUNFO1VBQUEsa0RBQUEsRUFDRTtZQUFBLEtBQUEsRUFBUyx1QkFBVDtZQUNBLEtBQUEsRUFBUyxvQkFEVDtXQURGO1NBREY7ZUFJQSxHQUFBLENBQ0U7VUFBQSxJQUFBLEVBQU0sb0JBQU47VUFTQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQVRSO1NBREY7TUFMUyxDQUFYO2FBaUJBLEVBQUEsQ0FBRyx5QkFBSCxFQUE4QixTQUFBO1FBQzVCLE1BQUEsQ0FBTyxTQUFQLEVBQWtCLFNBQUE7aUJBQ2hCO1lBQUEsSUFBQSxFQUFNLG9CQUFOOztRQURnQixDQUFsQjtlQVVBLE1BQUEsQ0FBTyxTQUFQLEVBQWtCLFNBQUE7aUJBQ2hCO1lBQUEsSUFBQSxFQUFNLG9CQUFOOztRQURnQixDQUFsQjtNQVg0QixDQUE5QjtJQWxCMkIsQ0FBN0I7V0F3Q0EsUUFBQSxDQUFTLG9CQUFULEVBQStCLFNBQUE7QUFDN0IsVUFBQTtNQUFBLE9BQTZCLEVBQTdCLEVBQUMsb0JBQUQsRUFBYTtNQUNiLFVBQUEsQ0FBVyxTQUFBO1FBQ1QsZUFBQSxDQUFnQixTQUFBO2lCQUNkLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4Qix3QkFBOUI7UUFEYyxDQUFoQjtlQUdBLElBQUEsQ0FBSyxTQUFBO0FBQ0gsY0FBQTtVQUFBLFVBQUEsR0FBYSxNQUFNLENBQUMsVUFBUCxDQUFBO1VBQ2IsT0FBQSxHQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsbUJBQWQsQ0FBa0MsZUFBbEM7VUFDVixNQUFNLENBQUMsVUFBUCxDQUFrQixPQUFsQjtVQUNBLFlBQUEsR0FBZTtpQkFTZixHQUFBLENBQUk7WUFBQSxJQUFBLEVBQU0sWUFBTjtXQUFKO1FBYkcsQ0FBTDtNQUpTLENBQVg7TUFtQkEsU0FBQSxDQUFVLFNBQUE7ZUFDUixNQUFNLENBQUMsVUFBUCxDQUFrQixVQUFsQjtNQURRLENBQVY7TUFHQSxFQUFBLENBQUcseURBQUgsRUFBOEQsU0FBQTtRQUM1RCxHQUFBLENBQUk7VUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1NBQUo7UUFDQSxNQUFBLENBQU8sU0FBUCxFQUNFO1VBQUEsSUFBQSxFQUFNLCtIQUFOO1NBREY7ZUFVQSxNQUFBLENBQU8sR0FBUCxFQUFZO1VBQUEsSUFBQSxFQUFNLFlBQU47U0FBWjtNQVo0RCxDQUE5RDthQWNBLEVBQUEsQ0FBRyw0REFBSCxFQUFpRSxTQUFBO1FBQy9ELEdBQUEsQ0FBSTtVQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7U0FBSjtRQUNBLE1BQUEsQ0FBTyxTQUFQLEVBQ0U7VUFBQSxJQUFBLEVBQU0sbUlBQU47U0FERjtlQVdBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxJQUFBLEVBQU0sWUFBTjtTQUFaO01BYitELENBQWpFO0lBdEM2QixDQUEvQjtFQXg4Qm1DLENBQXJDO0FBSEEiLCJzb3VyY2VzQ29udGVudCI6WyJ7Z2V0VmltU3RhdGUsIGRpc3BhdGNofSA9IHJlcXVpcmUgJy4vc3BlYy1oZWxwZXInXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4uL2xpYi9zZXR0aW5ncydcblxuZGVzY3JpYmUgXCJPcGVyYXRvciBUcmFuc2Zvcm1TdHJpbmdcIiwgLT5cbiAgW3NldCwgZW5zdXJlLCBrZXlzdHJva2UsIGVkaXRvciwgZWRpdG9yRWxlbWVudCwgdmltU3RhdGVdID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgZ2V0VmltU3RhdGUgKHN0YXRlLCB2aW0pIC0+XG4gICAgICB2aW1TdGF0ZSA9IHN0YXRlXG4gICAgICB7ZWRpdG9yLCBlZGl0b3JFbGVtZW50fSA9IHZpbVN0YXRlXG4gICAgICB7c2V0LCBlbnN1cmUsIGtleXN0cm9rZX0gPSB2aW1cblxuICBhZnRlckVhY2ggLT5cbiAgICB2aW1TdGF0ZS5yZXNldE5vcm1hbE1vZGUoKVxuXG4gIGRlc2NyaWJlICd0aGUgfiBrZXliaW5kaW5nJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogJ2FCY1xcblh5WidcbiAgICAgICAgY3Vyc29yQnVmZmVyOiBbWzAsIDBdLCBbMSwgMF1dXG5cbiAgICBpdCAndG9nZ2xlcyB0aGUgY2FzZSBhbmQgbW92ZXMgcmlnaHQnLCAtPlxuICAgICAgZW5zdXJlICd+JyxcbiAgICAgICAgdGV4dDogJ0FCY1xcbnh5WidcbiAgICAgICAgY3Vyc29yOiBbWzAsIDFdLCBbMSwgMV1dXG5cbiAgICAgIGVuc3VyZSAnficsXG4gICAgICAgIHRleHQ6ICdBYmNcXG54WVonXG4gICAgICAgIGN1cnNvcjogW1swLCAyXSwgWzEsIDJdXVxuXG4gICAgICBlbnN1cmUgICd+JyxcbiAgICAgICAgdGV4dDogJ0FiQ1xcbnhZeidcbiAgICAgICAgY3Vyc29yOiBbWzAsIDJdLCBbMSwgMl1dXG5cbiAgICBpdCAndGFrZXMgYSBjb3VudCcsIC0+XG4gICAgICBlbnN1cmUgJzQgficsXG4gICAgICAgIHRleHQ6ICdBYkNcXG54WXonXG4gICAgICAgIGN1cnNvcjogW1swLCAyXSwgWzEsIDJdXVxuXG4gICAgZGVzY3JpYmUgXCJpbiB2aXN1YWwgbW9kZVwiLCAtPlxuICAgICAgaXQgXCJ0b2dnbGVzIHRoZSBjYXNlIG9mIHRoZSBzZWxlY3RlZCB0ZXh0XCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3JCdWZmZXI6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ1YgficsIHRleHQ6ICdBYkNcXG5YeVonXG5cbiAgICBkZXNjcmliZSBcIndpdGggZyBhbmQgbW90aW9uXCIsIC0+XG4gICAgICBpdCBcInRvZ2dsZXMgdGhlIGNhc2Ugb2YgdGV4dCwgd29uJ3QgbW92ZSBjdXJzb3JcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvckJ1ZmZlcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnZyB+IDIgbCcsIHRleHQ6ICdBYmNcXG5YeVonLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBpdCBcImd+fiB0b2dnbGVzIHRoZSBsaW5lIG9mIHRleHQsIHdvbid0IG1vdmUgY3Vyc29yXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3JCdWZmZXI6IFswLCAxXVxuICAgICAgICBlbnN1cmUgJ2cgfiB+JywgdGV4dDogJ0FiQ1xcblh5WicsIGN1cnNvcjogWzAsIDFdXG5cbiAgICAgIGl0IFwiZ35nfiB0b2dnbGVzIHRoZSBsaW5lIG9mIHRleHQsIHdvbid0IG1vdmUgY3Vyc29yXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3JCdWZmZXI6IFswLCAxXVxuICAgICAgICBlbnN1cmUgJ2cgfiBnIH4nLCB0ZXh0OiAnQWJDXFxuWHlaJywgY3Vyc29yOiBbMCwgMV1cblxuICBkZXNjcmliZSAndGhlIFUga2V5YmluZGluZycsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6ICdhQmNcXG5YeVonXG4gICAgICAgIGN1cnNvckJ1ZmZlcjogWzAsIDBdXG5cbiAgICBpdCBcIm1ha2VzIHRleHQgdXBwZXJjYXNlIHdpdGggZyBhbmQgbW90aW9uLCBhbmQgd29uJ3QgbW92ZSBjdXJzb3JcIiwgLT5cbiAgICAgIGVuc3VyZSAnZyBVIGwnLCB0ZXh0OiAnQUJjXFxuWHlaJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGVuc3VyZSAnZyBVIGUnLCB0ZXh0OiAnQUJDXFxuWHlaJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgIHNldCBjdXJzb3JCdWZmZXI6IFsxLCAwXVxuICAgICAgZW5zdXJlICdnIFUgJCcsIHRleHQ6ICdBQkNcXG5YWVonLCBjdXJzb3I6IFsxLCAwXVxuXG4gICAgaXQgXCJtYWtlcyB0aGUgc2VsZWN0ZWQgdGV4dCB1cHBlcmNhc2UgaW4gdmlzdWFsIG1vZGVcIiwgLT5cbiAgICAgIGVuc3VyZSAnViBVJywgdGV4dDogJ0FCQ1xcblh5WidcblxuICAgIGl0IFwiZ1VVIHVwY2FzZSB0aGUgbGluZSBvZiB0ZXh0LCB3b24ndCBtb3ZlIGN1cnNvclwiLCAtPlxuICAgICAgc2V0IGN1cnNvckJ1ZmZlcjogWzAsIDFdXG4gICAgICBlbnN1cmUgJ2cgVSBVJywgdGV4dDogJ0FCQ1xcblh5WicsIGN1cnNvcjogWzAsIDFdXG5cbiAgICBpdCBcImdVZ1UgdXBjYXNlIHRoZSBsaW5lIG9mIHRleHQsIHdvbid0IG1vdmUgY3Vyc29yXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yQnVmZmVyOiBbMCwgMV1cbiAgICAgIGVuc3VyZSAnZyBVIGcgVScsIHRleHQ6ICdBQkNcXG5YeVonLCBjdXJzb3I6IFswLCAxXVxuXG4gIGRlc2NyaWJlICd0aGUgdSBrZXliaW5kaW5nJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgdGV4dDogJ2FCY1xcblh5WicsIGN1cnNvckJ1ZmZlcjogWzAsIDBdXG5cbiAgICBpdCBcIm1ha2VzIHRleHQgbG93ZXJjYXNlIHdpdGggZyBhbmQgbW90aW9uLCBhbmQgd29uJ3QgbW92ZSBjdXJzb3JcIiwgLT5cbiAgICAgIGVuc3VyZSAnZyB1ICQnLCB0ZXh0OiAnYWJjXFxuWHlaJywgY3Vyc29yOiBbMCwgMF1cblxuICAgIGl0IFwibWFrZXMgdGhlIHNlbGVjdGVkIHRleHQgbG93ZXJjYXNlIGluIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICBlbnN1cmUgJ1YgdScsIHRleHQ6ICdhYmNcXG5YeVonXG5cbiAgICBpdCBcImd1dSBkb3duY2FzZSB0aGUgbGluZSBvZiB0ZXh0LCB3b24ndCBtb3ZlIGN1cnNvclwiLCAtPlxuICAgICAgc2V0IGN1cnNvckJ1ZmZlcjogWzAsIDFdXG4gICAgICBlbnN1cmUgJ2cgdSB1JywgdGV4dDogJ2FiY1xcblh5WicsIGN1cnNvcjogWzAsIDFdXG5cbiAgICBpdCBcImd1Z3UgZG93bmNhc2UgdGhlIGxpbmUgb2YgdGV4dCwgd29uJ3QgbW92ZSBjdXJzb3JcIiwgLT5cbiAgICAgIHNldCBjdXJzb3JCdWZmZXI6IFswLCAxXVxuICAgICAgZW5zdXJlICdnIHUgZyB1JywgdGV4dDogJ2FiY1xcblh5WicsIGN1cnNvcjogWzAsIDFdXG5cbiAgZGVzY3JpYmUgXCJ0aGUgPiBrZXliaW5kaW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0IHRleHQ6IFwiXCJcIlxuICAgICAgICAxMjM0NVxuICAgICAgICBhYmNkZVxuICAgICAgICBBQkNERVxuICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwib24gdGhlIGxhc3QgbGluZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIGJ5IGEgPlwiLCAtPlxuICAgICAgICBpdCBcImluZGVudHMgdGhlIGN1cnJlbnQgbGluZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnPiA+JyxcbiAgICAgICAgICAgIHRleHQ6IFwiMTIzNDVcXG5hYmNkZVxcbiAgQUJDREVcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMiwgMl1cblxuICAgIGRlc2NyaWJlIFwib24gdGhlIGZpcnN0IGxpbmVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBmb2xsb3dlZCBieSBhID5cIiwgLT5cbiAgICAgICAgaXQgXCJpbmRlbnRzIHRoZSBjdXJyZW50IGxpbmVcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJz4gPicsXG4gICAgICAgICAgICB0ZXh0OiBcIiAgMTIzNDVcXG5hYmNkZVxcbkFCQ0RFXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzAsIDJdXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBmb2xsb3dlZCBieSBhIHJlcGVhdGluZyA+XCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBrZXlzdHJva2UgJzMgPiA+J1xuXG4gICAgICAgIGl0IFwiaW5kZW50cyBtdWx0aXBsZSBsaW5lcyBhdCBvbmNlXCIsIC0+XG4gICAgICAgICAgZW5zdXJlXG4gICAgICAgICAgICB0ZXh0OiBcIiAgMTIzNDVcXG4gIGFiY2RlXFxuICBBQkNERVwiXG4gICAgICAgICAgICBjdXJzb3I6IFswLCAyXVxuXG4gICAgICAgIGRlc2NyaWJlIFwidW5kbyBiZWhhdmlvclwiLCAtPlxuICAgICAgICAgIGl0IFwib3V0ZGVudHMgYWxsIHRocmVlIGxpbmVzXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ3UnLCB0ZXh0OiBcIjEyMzQ1XFxuYWJjZGVcXG5BQkNERVwiXG5cbiAgICBkZXNjcmliZSBcImluIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBrZXlzdHJva2UgJ1YgPidcblxuICAgICAgaXQgXCJpbmRlbnRzIHRoZSBjdXJyZW50IGxpbmUgYW5kIGV4aXRzIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZVxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgdGV4dDogXCIgIDEyMzQ1XFxuYWJjZGVcXG5BQkNERVwiXG4gICAgICAgICAgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1swLCAyXSwgWzAsIDJdXVxuXG4gICAgICBpdCBcImFsbG93cyByZXBlYXRpbmcgdGhlIG9wZXJhdGlvblwiLCAtPlxuICAgICAgICBlbnN1cmUgJy4nLCB0ZXh0OiBcIiAgICAxMjM0NVxcbmFiY2RlXFxuQUJDREVcIlxuXG4gICAgZGVzY3JpYmUgXCJpbiB2aXN1YWwgbW9kZSBhbmQgc3RheU9uVHJhbnNmb3JtU3RyaW5nIGVuYWJsZWRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KCdzdGF5T25UcmFuc2Zvcm1TdHJpbmcnLCB0cnVlKVxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgaXQgXCJpbmRlbnRzIHRoZSBjdXJycmVudCBzZWxlY3Rpb24gYW5kIGV4aXRzIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAndiBqID4nLFxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDEyMzQ1XG4gICAgICAgICAgICBhYmNkZVxuICAgICAgICAgIEFCQ0RFXG4gICAgICAgICAgXCJcIlwiXG4gICAgICBpdCBcIndoZW4gcmVwZWF0ZWQsIG9wZXJhdGUgb24gc2FtZSByYW5nZSB3aGVuIGN1cnNvciB3YXMgbm90IG1vdmVkXCIsIC0+XG4gICAgICAgIGVuc3VyZSAndiBqID4nLFxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDEyMzQ1XG4gICAgICAgICAgICBhYmNkZVxuICAgICAgICAgIEFCQ0RFXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGVuc3VyZSAnLicsXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICBjdXJzb3I6IFsxLCA0XVxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICAxMjM0NVxuICAgICAgICAgICAgICBhYmNkZVxuICAgICAgICAgIEFCQ0RFXG4gICAgICAgICAgXCJcIlwiXG4gICAgICBpdCBcIndoZW4gcmVwZWF0ZWQsIG9wZXJhdGUgb24gcmVsYXRpdmUgcmFuZ2UgZnJvbSBjdXJzb3IgcG9zaXRpb24gd2l0aCBzYW1lIGV4dGVudCB3aGVuIGN1cnNvciB3YXMgbW92ZWRcIiwgLT5cbiAgICAgICAgZW5zdXJlICd2IGogPicsXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICBjdXJzb3I6IFsxLCAyXVxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMTIzNDVcbiAgICAgICAgICAgIGFiY2RlXG4gICAgICAgICAgQUJDREVcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZW5zdXJlICdsIC4nLFxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgY3Vyc29yOiBbMSwgNV1cbiAgICAgICAgICB0ZXh0XzogXCJcIlwiXG4gICAgICAgICAgX18xMjM0NVxuICAgICAgICAgIF9fX19hYmNkZVxuICAgICAgICAgIF9fQUJDREVcbiAgICAgICAgICBcIlwiXCJcblxuICBkZXNjcmliZSBcInRoZSA8IGtleWJpbmRpbmdcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgdGV4dDogXCIgIDEyMzQ1XFxuICBhYmNkZVxcbkFCQ0RFXCIsIGN1cnNvcjogWzAsIDBdXG5cbiAgICBkZXNjcmliZSBcIndoZW4gZm9sbG93ZWQgYnkgYSA8XCIsIC0+XG4gICAgICBpdCBcImluZGVudHMgdGhlIGN1cnJlbnQgbGluZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJzwgPCcsXG4gICAgICAgICAgdGV4dDogXCIxMjM0NVxcbiAgYWJjZGVcXG5BQkNERVwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwid2hlbiBmb2xsb3dlZCBieSBhIHJlcGVhdGluZyA8XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGtleXN0cm9rZSAnMiA8IDwnXG5cbiAgICAgIGl0IFwiaW5kZW50cyBtdWx0aXBsZSBsaW5lcyBhdCBvbmNlXCIsIC0+XG4gICAgICAgIGVuc3VyZVxuICAgICAgICAgIHRleHQ6IFwiMTIzNDVcXG5hYmNkZVxcbkFCQ0RFXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBkZXNjcmliZSBcInVuZG8gYmVoYXZpb3JcIiwgLT5cbiAgICAgICAgaXQgXCJpbmRlbnRzIGJvdGggbGluZXNcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ3UnLCB0ZXh0OiBcIiAgMTIzNDVcXG4gIGFiY2RlXFxuQUJDREVcIlxuXG4gICAgZGVzY3JpYmUgXCJpbiB2aXN1YWwgbW9kZVwiLCAtPlxuICAgICAgaXQgXCJpbmRlbnRzIHRoZSBjdXJyZW50IGxpbmUgYW5kIGV4aXRzIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnViA8JyxcbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICAgIHRleHQ6IFwiMTIzNDVcXG4gIGFiY2RlXFxuQUJDREVcIlxuICAgICAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IFtbMCwgMF0sIFswLCAwXV1cblxuICBkZXNjcmliZSBcInRoZSA9IGtleWJpbmRpbmdcIiwgLT5cbiAgICBvbGRHcmFtbWFyID0gW11cblxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbGFuZ3VhZ2UtamF2YXNjcmlwdCcpXG5cbiAgICAgIG9sZEdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpXG4gICAgICBzZXQgdGV4dDogXCJmb29cXG4gIGJhclxcbiAgYmF6XCIsIGN1cnNvcjogWzEsIDBdXG5cblxuICAgIGRlc2NyaWJlIFwid2hlbiB1c2VkIGluIGEgc2NvcGUgdGhhdCBzdXBwb3J0cyBhdXRvLWluZGVudFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBqc0dyYW1tYXIgPSBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoJ3NvdXJjZS5qcycpXG4gICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKGpzR3JhbW1hcilcblxuICAgICAgYWZ0ZXJFYWNoIC0+XG4gICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKG9sZEdyYW1tYXIpXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBmb2xsb3dlZCBieSBhID1cIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGtleXN0cm9rZSAnPSA9J1xuXG4gICAgICAgIGl0IFwiaW5kZW50cyB0aGUgY3VycmVudCBsaW5lXCIsIC0+XG4gICAgICAgICAgZXhwZWN0KGVkaXRvci5pbmRlbnRhdGlvbkZvckJ1ZmZlclJvdygxKSkudG9CZSAwXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBmb2xsb3dlZCBieSBhIHJlcGVhdGluZyA9XCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBrZXlzdHJva2UgJzIgPSA9J1xuXG4gICAgICAgIGl0IFwiYXV0b2luZGVudHMgbXVsdGlwbGUgbGluZXMgYXQgb25jZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSB0ZXh0OiBcImZvb1xcbmJhclxcbmJhelwiLCBjdXJzb3I6IFsxLCAwXVxuXG4gICAgICAgIGRlc2NyaWJlIFwidW5kbyBiZWhhdmlvclwiLCAtPlxuICAgICAgICAgIGl0IFwiaW5kZW50cyBib3RoIGxpbmVzXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ3UnLCB0ZXh0OiBcImZvb1xcbiAgYmFyXFxuICBiYXpcIlxuXG4gIGRlc2NyaWJlICdDYW1lbENhc2UnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiAndmltLW1vZGVcXG5hdG9tLXRleHQtZWRpdG9yXFxuJ1xuICAgICAgICBjdXJzb3JCdWZmZXI6IFswLCAwXVxuXG4gICAgaXQgXCJ0cmFuc2Zvcm0gdGV4dCBieSBtb3Rpb24gYW5kIHJlcGVhdGFibGVcIiwgLT5cbiAgICAgIGVuc3VyZSAnZyBjICQnLCB0ZXh0OiAndmltTW9kZVxcbmF0b20tdGV4dC1lZGl0b3JcXG4nLCBjdXJzb3I6IFswLCAwXVxuICAgICAgZW5zdXJlICdqIC4nLCB0ZXh0OiAndmltTW9kZVxcbmF0b21UZXh0RWRpdG9yXFxuJywgY3Vyc29yOiBbMSwgMF1cblxuICAgIGl0IFwidHJhbnNmb3JtIHNlbGVjdGlvblwiLCAtPlxuICAgICAgZW5zdXJlICdWIGogZyBjJywgdGV4dDogJ3ZpbU1vZGVcXG5hdG9tVGV4dEVkaXRvclxcbicsIGN1cnNvcjogWzAsIDBdXG5cbiAgICBpdCBcInJlcGVhdGluZyB0d2ljZSB3b3JrcyBvbiBjdXJyZW50LWxpbmUgYW5kIHdvbid0IG1vdmUgY3Vyc29yXCIsIC0+XG4gICAgICBlbnN1cmUgJ2wgZyBjIGcgYycsIHRleHQ6ICd2aW1Nb2RlXFxuYXRvbS10ZXh0LWVkaXRvclxcbicsIGN1cnNvcjogWzAsIDFdXG5cbiAgZGVzY3JpYmUgJ1Bhc2NhbENhc2UnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiAndmltLW1vZGVcXG5hdG9tLXRleHQtZWRpdG9yXFxuJ1xuICAgICAgICBjdXJzb3JCdWZmZXI6IFswLCAwXVxuXG4gICAgaXQgXCJ0cmFuc2Zvcm0gdGV4dCBieSBtb3Rpb24gYW5kIHJlcGVhdGFibGVcIiwgLT5cbiAgICAgIGVuc3VyZSAnZyBDICQnLCB0ZXh0OiAnVmltTW9kZVxcbmF0b20tdGV4dC1lZGl0b3JcXG4nLCBjdXJzb3I6IFswLCAwXVxuICAgICAgZW5zdXJlICdqIC4nLCB0ZXh0OiAnVmltTW9kZVxcbkF0b21UZXh0RWRpdG9yXFxuJywgY3Vyc29yOiBbMSwgMF1cblxuICAgIGl0IFwidHJhbnNmb3JtIHNlbGVjdGlvblwiLCAtPlxuICAgICAgZW5zdXJlICdWIGogZyBDJywgdGV4dDogJ1ZpbU1vZGVcXG5hdG9tVGV4dEVkaXRvclxcbicsIGN1cnNvcjogWzAsIDBdXG5cbiAgICBpdCBcInJlcGVhdGluZyB0d2ljZSB3b3JrcyBvbiBjdXJyZW50LWxpbmUgYW5kIHdvbid0IG1vdmUgY3Vyc29yXCIsIC0+XG4gICAgICBlbnN1cmUgJ2wgZyBDIGcgQycsIHRleHQ6ICdWaW1Nb2RlXFxuYXRvbS10ZXh0LWVkaXRvclxcbicsIGN1cnNvcjogWzAsIDFdXG5cbiAgZGVzY3JpYmUgJ1NuYWtlQ2FzZScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6ICd2aW0tbW9kZVxcbmF0b20tdGV4dC1lZGl0b3JcXG4nXG4gICAgICAgIGN1cnNvckJ1ZmZlcjogWzAsIDBdXG4gICAgICBhdG9tLmtleW1hcHMuYWRkIFwiZ19cIixcbiAgICAgICAgJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1czpub3QoLmluc2VydC1tb2RlKSc6XG4gICAgICAgICAgJ2cgXyc6ICd2aW0tbW9kZS1wbHVzOnNuYWtlLWNhc2UnXG5cbiAgICBpdCBcInRyYW5zZm9ybSB0ZXh0IGJ5IG1vdGlvbiBhbmQgcmVwZWF0YWJsZVwiLCAtPlxuICAgICAgZW5zdXJlICdnIF8gJCcsIHRleHQ6ICd2aW1fbW9kZVxcbmF0b20tdGV4dC1lZGl0b3JcXG4nLCBjdXJzb3I6IFswLCAwXVxuICAgICAgZW5zdXJlICdqIC4nLCB0ZXh0OiAndmltX21vZGVcXG5hdG9tX3RleHRfZWRpdG9yXFxuJywgY3Vyc29yOiBbMSwgMF1cblxuICAgIGl0IFwidHJhbnNmb3JtIHNlbGVjdGlvblwiLCAtPlxuICAgICAgZW5zdXJlICdWIGogZyBfJywgdGV4dDogJ3ZpbV9tb2RlXFxuYXRvbV90ZXh0X2VkaXRvclxcbicsIGN1cnNvcjogWzAsIDBdXG5cbiAgICBpdCBcInJlcGVhdGluZyB0d2ljZSB3b3JrcyBvbiBjdXJyZW50LWxpbmUgYW5kIHdvbid0IG1vdmUgY3Vyc29yXCIsIC0+XG4gICAgICBlbnN1cmUgJ2wgZyBfIGcgXycsIHRleHQ6ICd2aW1fbW9kZVxcbmF0b20tdGV4dC1lZGl0b3JcXG4nLCBjdXJzb3I6IFswLCAxXVxuXG4gIGRlc2NyaWJlICdEYXNoQ2FzZScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6ICd2aW1Nb2RlXFxuYXRvbV90ZXh0X2VkaXRvclxcbidcbiAgICAgICAgY3Vyc29yQnVmZmVyOiBbMCwgMF1cblxuICAgIGl0IFwidHJhbnNmb3JtIHRleHQgYnkgbW90aW9uIGFuZCByZXBlYXRhYmxlXCIsIC0+XG4gICAgICBlbnN1cmUgJ2cgLSAkJywgdGV4dDogJ3ZpbS1tb2RlXFxuYXRvbV90ZXh0X2VkaXRvclxcbicsIGN1cnNvcjogWzAsIDBdXG4gICAgICBlbnN1cmUgJ2ogLicsIHRleHQ6ICd2aW0tbW9kZVxcbmF0b20tdGV4dC1lZGl0b3JcXG4nLCBjdXJzb3I6IFsxLCAwXVxuXG4gICAgaXQgXCJ0cmFuc2Zvcm0gc2VsZWN0aW9uXCIsIC0+XG4gICAgICBlbnN1cmUgJ1YgaiBnIC0nLCB0ZXh0OiAndmltLW1vZGVcXG5hdG9tLXRleHQtZWRpdG9yXFxuJywgY3Vyc29yOiBbMCwgMF1cblxuICAgIGl0IFwicmVwZWF0aW5nIHR3aWNlIHdvcmtzIG9uIGN1cnJlbnQtbGluZSBhbmQgd29uJ3QgbW92ZSBjdXJzb3JcIiwgLT5cbiAgICAgIGVuc3VyZSAnbCBnIC0gZyAtJywgdGV4dDogJ3ZpbS1tb2RlXFxuYXRvbV90ZXh0X2VkaXRvclxcbicsIGN1cnNvcjogWzAsIDFdXG5cbiAgZGVzY3JpYmUgJ0NvbnZlcnRUb1NvZnRUYWInLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGF0b20ua2V5bWFwcy5hZGQgXCJ0ZXN0XCIsXG4gICAgICAgICdhdG9tLXRleHQtZWRpdG9yLnZpbS1tb2RlLXBsdXM6bm90KC5pbnNlcnQtbW9kZSknOlxuICAgICAgICAgICdnIHRhYic6ICd2aW0tbW9kZS1wbHVzOmNvbnZlcnQtdG8tc29mdC10YWInXG5cbiAgICBkZXNjcmliZSBcImJhc2ljIGJlaGF2aW9yXCIsIC0+XG4gICAgICBpdCBcImNvbnZlcnQgdGFicyB0byBzcGFjZXNcIiwgLT5cbiAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRUYWJMZW5ndGgoKSkudG9CZSgyKVxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlxcdHZhcjEwID1cXHRcXHQwO1wiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdnIHRhYiAkJyxcbiAgICAgICAgICB0ZXh0OiBcIiAgdmFyMTAgPSAgIDA7XCJcblxuICBkZXNjcmliZSAnQ29udmVydFRvSGFyZFRhYicsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgYXRvbS5rZXltYXBzLmFkZCBcInRlc3RcIixcbiAgICAgICAgJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1czpub3QoLmluc2VydC1tb2RlKSc6XG4gICAgICAgICAgJ2cgc2hpZnQtdGFiJzogJ3ZpbS1tb2RlLXBsdXM6Y29udmVydC10by1oYXJkLXRhYidcblxuICAgIGRlc2NyaWJlIFwiYmFzaWMgYmVoYXZpb3JcIiwgLT5cbiAgICAgIGl0IFwiY29udmVydCBzcGFjZXMgdG8gdGFic1wiLCAtPlxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldFRhYkxlbmd0aCgpKS50b0JlKDIpXG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiICB2YXIxMCA9ICAgIDA7XCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ2cgc2hpZnQtdGFiICQnLFxuICAgICAgICAgIHRleHQ6IFwiXFx0dmFyMTBcXHQ9XFx0XFx0IDA7XCJcblxuICBkZXNjcmliZSAnQ29tcGFjdFNwYWNlcycsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIGN1cnNvckJ1ZmZlcjogWzAsIDBdXG5cbiAgICBkZXNjcmliZSBcImJhc2ljIGJlaGF2aW9yXCIsIC0+XG4gICAgICBpdCBcImNvbXBhdHMgbXVsdGlwbGUgc3BhY2UgaW50byBvbmVcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogJ3ZhcjAgICA9ICAgMDsgdmFyMTAgICA9ICAgMTAnXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdnIHNwYWNlICQnLFxuICAgICAgICAgIHRleHQ6ICd2YXIwID0gMDsgdmFyMTAgPSAxMCdcbiAgICAgIGl0IFwiZG9uJ3QgYXBwbHkgY29tcGFjdGlvbiBmb3IgbGVhZGluZyBhbmQgdHJhaWxpbmcgc3BhY2VcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dF86IFwiXCJcIlxuICAgICAgICAgIF9fX3ZhcjAgICA9ICAgMDsgdmFyMTAgICA9ICAgMTBfX19cbiAgICAgICAgICBfX192YXIxICAgPSAgIDE7IHZhcjExICAgPSAgIDExX19fXG4gICAgICAgICAgX19fdmFyMiAgID0gICAyOyB2YXIxMiAgID0gICAxMl9fX1xuXG4gICAgICAgICAgX19fdmFyNCAgID0gICA0OyB2YXIxNCAgID0gICAxNF9fX1xuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnZyBzcGFjZSBpIHAnLFxuICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICBfX192YXIwID0gMDsgdmFyMTAgPSAxMF9fX1xuICAgICAgICAgIF9fX3ZhcjEgPSAxOyB2YXIxMSA9IDExX19fXG4gICAgICAgICAgX19fdmFyMiA9IDI7IHZhcjEyID0gMTJfX19cblxuICAgICAgICAgIF9fX3ZhcjQgICA9ICAgNDsgdmFyMTQgICA9ICAgMTRfX19cbiAgICAgICAgICBcIlwiXCJcbiAgICAgIGl0IFwiYnV0IGl0IGNvbXBhY3Qgc3BhY2VzIHdoZW4gdGFyZ2V0IGFsbCB0ZXh0IGlzIHNwYWNlc1wiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiAnMDEyMzQgICAgOTAnXG4gICAgICAgICAgY3Vyc29yOiBbMCwgNV1cbiAgICAgICAgZW5zdXJlICdnIHNwYWNlIHcnLFxuICAgICAgICAgIHRleHQ6ICcwMTIzNCA5MCdcblxuICBkZXNjcmliZSAnVHJpbVN0cmluZycsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiIHRleHQgPSBAZ2V0TmV3VGV4dCggc2VsZWN0aW9uLmdldFRleHQoKSwgc2VsZWN0aW9uICkgIFwiXG4gICAgICAgIGN1cnNvcjogWzAsIDQyXVxuXG4gICAgZGVzY3JpYmUgXCJiYXNpYyBiZWhhdmlvclwiLCAtPlxuICAgICAgaXQgXCJ0cmltIHN0cmluZyBmb3IgYS1saW5lIHRleHQgb2JqZWN0XCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICBfX19hYmNfX19cbiAgICAgICAgICBfX19kZWZfX19cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ2cgfCBhIGwnLFxuICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICBhYmNcbiAgICAgICAgICBfX19kZWZfX19cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZW5zdXJlICdqIC4nLFxuICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICBhYmNcbiAgICAgICAgICBkZWZcbiAgICAgICAgICBcIlwiXCJcbiAgICAgIGl0IFwidHJpbSBzdHJpbmcgZm9yIGlubmVyLXBhcmVudGhlc2lzIHRleHQgb2JqZWN0XCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICAoICBhYmMgIClcbiAgICAgICAgICAoICBkZWYgIClcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ2cgfCBpICgnLFxuICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICAoYWJjKVxuICAgICAgICAgICggIGRlZiAgKVxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbnN1cmUgJ2ogLicsXG4gICAgICAgICAgdGV4dF86IFwiXCJcIlxuICAgICAgICAgIChhYmMpXG4gICAgICAgICAgKGRlZilcbiAgICAgICAgICBcIlwiXCJcbiAgICAgIGl0IFwidHJpbSBzdHJpbmcgZm9yIGlubmVyLWFueS1wYWlyIHRleHQgb2JqZWN0XCIsIC0+XG4gICAgICAgIGF0b20ua2V5bWFwcy5hZGQgXCJ0ZXN0XCIsXG4gICAgICAgICAgJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1cy5vcGVyYXRvci1wZW5kaW5nLW1vZGUsIGF0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1cy52aXN1YWwtbW9kZSc6XG4gICAgICAgICAgICAnaSA7JzogICd2aW0tbW9kZS1wbHVzOmlubmVyLWFueS1wYWlyJ1xuXG4gICAgICAgIHNldCB0ZXh0XzogXCIoIFsgeyAgYWJjICB9IF0gKVwiLCBjdXJzb3I6IFswLCA4XVxuICAgICAgICBlbnN1cmUgJ2cgfCBpIDsnLCB0ZXh0XzogXCIoIFsge2FiY30gXSApXCJcbiAgICAgICAgZW5zdXJlICcyIGggLicsIHRleHRfOiBcIiggW3thYmN9XSApXCJcbiAgICAgICAgZW5zdXJlICcyIGggLicsIHRleHRfOiBcIihbe2FiY31dKVwiXG5cbiAgZGVzY3JpYmUgJ3N1cnJvdW5kJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgYXBwbGVcbiAgICAgICAgICBwYWlyczogW2JyYWNrZXRzXVxuICAgICAgICAgIHBhaXJzOiBbYnJhY2tldHNdXG4gICAgICAgICAgKCBtdWx0aVxuICAgICAgICAgICAgbGluZSApXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGN1cnNvckJ1ZmZlcjogWzAsIDBdXG5cbiAgICBkZXNjcmliZSAnc3Vycm91bmQnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBhdG9tLmtleW1hcHMuYWRkIFwic3Vycm91bmQtdGVzdFwiLFxuICAgICAgICAgICdhdG9tLXRleHQtZWRpdG9yLnZpbS1tb2RlLXBsdXM6bm90KC5pbnNlcnQtbW9kZSknOlxuICAgICAgICAgICAgJ3kgcyc6ICd2aW0tbW9kZS1wbHVzOnN1cnJvdW5kJ1xuICAgICAgICAgICwgMTAwXG5cbiAgICAgIGl0IFwic3Vycm91bmQgdGV4dCBvYmplY3Qgd2l0aCAoIGFuZCByZXBlYXRhYmxlXCIsIC0+XG4gICAgICAgIGVuc3VyZSBbJ3kgcyBpIHcnLCBpbnB1dDogJygnXSxcbiAgICAgICAgICB0ZXh0OiBcIihhcHBsZSlcXG5wYWlyczogW2JyYWNrZXRzXVxcbnBhaXJzOiBbYnJhY2tldHNdXFxuKCBtdWx0aVxcbiAgbGluZSApXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ2ogLicsXG4gICAgICAgICAgdGV4dDogXCIoYXBwbGUpXFxuKHBhaXJzKTogW2JyYWNrZXRzXVxcbnBhaXJzOiBbYnJhY2tldHNdXFxuKCBtdWx0aVxcbiAgbGluZSApXCJcbiAgICAgIGl0IFwic3Vycm91bmQgdGV4dCBvYmplY3Qgd2l0aCB7IGFuZCByZXBlYXRhYmxlXCIsIC0+XG4gICAgICAgIGVuc3VyZSBbJ3kgcyBpIHcnLCBpbnB1dDogJ3snXSxcbiAgICAgICAgICB0ZXh0OiBcInthcHBsZX1cXG5wYWlyczogW2JyYWNrZXRzXVxcbnBhaXJzOiBbYnJhY2tldHNdXFxuKCBtdWx0aVxcbiAgbGluZSApXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ2ogLicsXG4gICAgICAgICAgdGV4dDogXCJ7YXBwbGV9XFxue3BhaXJzfTogW2JyYWNrZXRzXVxcbnBhaXJzOiBbYnJhY2tldHNdXFxuKCBtdWx0aVxcbiAgbGluZSApXCJcbiAgICAgIGl0IFwic3Vycm91bmQgbGluZXdpc2VcIiwgLT5cbiAgICAgICAgZW5zdXJlIFsneSBzIHkgcycsIGlucHV0OiAneyddLFxuICAgICAgICAgIHRleHQ6IFwie1xcbmFwcGxlXFxufVxcbnBhaXJzOiBbYnJhY2tldHNdXFxucGFpcnM6IFticmFja2V0c11cXG4oIG11bHRpXFxuICBsaW5lIClcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnMyBqIC4nLFxuICAgICAgICAgIHRleHQ6IFwie1xcbmFwcGxlXFxufVxcbntcXG5wYWlyczogW2JyYWNrZXRzXVxcbn1cXG5wYWlyczogW2JyYWNrZXRzXVxcbiggbXVsdGlcXG4gIGxpbmUgKVwiXG4gICAgICBkZXNjcmliZSAnd2l0aCBtb3Rpb24gd2hpY2ggYWxvc28gdGFraW5nIHVzZXItaWlucHV0JywgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCB0ZXh0OiBcInMgX19fX18gZVwiLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBkZXNjcmliZSBcIndpdGggJ2YnIG1vdGlvblwiLCAtPlxuICAgICAgICAgIGl0IFwic3Vycm91bmQgd2l0aCAnZicgbW90aW9uXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgWyd5IHMgZicsIGlucHV0OiAnZSgnXSwgdGV4dDogXCIocyBfX19fXyBlKVwiLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICAgIGRlc2NyaWJlIFwid2l0aCAnYCcgbW90aW9uXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDhdICMgc3RhcnQgYXQgYGVgIGNoYXJcbiAgICAgICAgICAgIGVuc3VyZSAnbSBhJywgbWFyazogJ2EnOiBbMCwgOF1cbiAgICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICAgICAgaXQgXCJzdXJyb3VuZCB3aXRoICdgJyBtb3Rpb25cIiwgLT5cbiAgICAgICAgICAgIGVuc3VyZSBbJ3kgcyBgJywgaW5wdXQ6ICdhKCddLCB0ZXh0OiBcIihzIF9fX19fICllXCIsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGRlc2NyaWJlICdjaGFyYWN0ZXJzVG9BZGRTcGFjZU9uU3Vycm91bmQgc2V0dGluZycsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXR0aW5ncy5zZXQoJ2NoYXJhY3RlcnNUb0FkZFNwYWNlT25TdXJyb3VuZCcsIFsnKCcsICd7JywgJ1snXSlcbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiYXBwbGVcXG5vcmFuZ2VcXG5sZW1tb25cIlxuICAgICAgICAgICAgY3Vyc29yQnVmZmVyOiBbMCwgMF1cblxuICAgICAgICBkZXNjcmliZSBcImNoYXIgaXMgaW4gY2hhcmFjdGVyc1RvQWRkU3BhY2VPblN1cnJvdW5kXCIsIC0+XG4gICAgICAgICAgaXQgXCJhZGQgYWRkaXRpb25hbCBzcGFjZSBpbnNpZGUgcGFpciBjaGFyIHdoZW4gc3Vycm91bmRcIiwgLT5cbiAgICAgICAgICAgIGVuc3VyZSBbJ3kgcyBpIHcnLCBpbnB1dDogJygnXSwgdGV4dDogXCIoIGFwcGxlIClcXG5vcmFuZ2VcXG5sZW1tb25cIlxuICAgICAgICAgICAga2V5c3Ryb2tlICdqJ1xuICAgICAgICAgICAgZW5zdXJlIFsneSBzIGkgdycsIGlucHV0OiAneyddLCB0ZXh0OiBcIiggYXBwbGUgKVxcbnsgb3JhbmdlIH1cXG5sZW1tb25cIlxuICAgICAgICAgICAga2V5c3Ryb2tlICdqJ1xuICAgICAgICAgICAgZW5zdXJlIFsneSBzIGkgdycsIGlucHV0OiAnWyddLCB0ZXh0OiBcIiggYXBwbGUgKVxcbnsgb3JhbmdlIH1cXG5bIGxlbW1vbiBdXCJcblxuICAgICAgICBkZXNjcmliZSBcImNoYXIgaXMgbm90IGluIGNoYXJhY3RlcnNUb0FkZFNwYWNlT25TdXJyb3VuZFwiLCAtPlxuICAgICAgICAgIGl0IFwiYWRkIGFkZGl0aW9uYWwgc3BhY2UgaW5zaWRlIHBhaXIgY2hhciB3aGVuIHN1cnJvdW5kXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgWyd5IHMgaSB3JywgaW5wdXQ6ICcpJ10sIHRleHQ6IFwiKGFwcGxlKVxcbm9yYW5nZVxcbmxlbW1vblwiXG4gICAgICAgICAgICBrZXlzdHJva2UgJ2onXG4gICAgICAgICAgICBlbnN1cmUgWyd5IHMgaSB3JywgaW5wdXQ6ICd9J10sIHRleHQ6IFwiKGFwcGxlKVxcbntvcmFuZ2V9XFxubGVtbW9uXCJcbiAgICAgICAgICAgIGtleXN0cm9rZSAnaidcbiAgICAgICAgICAgIGVuc3VyZSBbJ3kgcyBpIHcnLCBpbnB1dDogJ10nXSwgdGV4dDogXCIoYXBwbGUpXFxue29yYW5nZX1cXG5bbGVtbW9uXVwiXG5cbiAgICBkZXNjcmliZSAnbWFwLXN1cnJvdW5kJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgamFzbWluZS5hdHRhY2hUb0RPTShlZGl0b3JFbGVtZW50KVxuXG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuXG4gICAgICAgICAgICBhcHBsZVxuICAgICAgICAgICAgcGFpcnMgdG9tYXRvXG4gICAgICAgICAgICBvcmFuZ2VcbiAgICAgICAgICAgIG1pbGtcblxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yQnVmZmVyOiBbMSwgMF1cblxuICAgICAgICBhdG9tLmtleW1hcHMuYWRkIFwibXNcIixcbiAgICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzOm5vdCguaW5zZXJ0LW1vZGUpJzpcbiAgICAgICAgICAgICdtIHMnOiAndmltLW1vZGUtcGx1czptYXAtc3Vycm91bmQnXG4gICAgICAgICAgJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1cy52aXN1YWwtbW9kZSc6XG4gICAgICAgICAgICAnbSBzJzogICd2aW0tbW9kZS1wbHVzOm1hcC1zdXJyb3VuZCdcbiAgICAgIGl0IFwic3Vycm91bmQgdGV4dCBmb3IgZWFjaCB3b3JkIGluIHRhcmdldCBjYXNlLTFcIiwgLT5cbiAgICAgICAgZW5zdXJlIFsnbSBzIGkgcCcsIGlucHV0OiAnKCddLFxuICAgICAgICAgIHRleHQ6IFwiXFxuKGFwcGxlKVxcbihwYWlycykgKHRvbWF0bylcXG4ob3JhbmdlKVxcbihtaWxrKVxcblwiXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMF1cbiAgICAgIGl0IFwic3Vycm91bmQgdGV4dCBmb3IgZWFjaCB3b3JkIGluIHRhcmdldCBjYXNlLTJcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzIsIDFdXG4gICAgICAgIGVuc3VyZSBbJ20gcyBpIGwnLCBpbnB1dDogJzwnXSxcbiAgICAgICAgICB0ZXh0OiAnXFxuYXBwbGVcXG48cGFpcnM+IDx0b21hdG8+XFxub3JhbmdlXFxubWlsa1xcbidcbiAgICAgICAgICBjdXJzb3I6IFsyLCAwXVxuICAgICAgaXQgXCJzdXJyb3VuZCB0ZXh0IGZvciBlYWNoIHdvcmQgaW4gdmlzdWFsIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICBlbnN1cmUgWyd2IGkgcCBtIHMnLCBpbnB1dDogJ1wiJ10sXG4gICAgICAgICAgdGV4dDogJ1xcblwiYXBwbGVcIlxcblwicGFpcnNcIiBcInRvbWF0b1wiXFxuXCJvcmFuZ2VcIlxcblwibWlsa1wiXFxuJ1xuICAgICAgICAgIGN1cnNvcjogWzEsIDBdXG5cbiAgICBkZXNjcmliZSAnZGVsZXRlIHN1cnJvdW5kJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgYXRvbS5rZXltYXBzLmFkZCBcInN1cnJvdW5kLXRlc3RcIixcbiAgICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzLm5vcm1hbC1tb2RlJzpcbiAgICAgICAgICAgICdkIHMnOiAndmltLW1vZGUtcGx1czpkZWxldGUtc3Vycm91bmQnXG4gICAgICAgIHNldCBjdXJzb3I6IFsxLCA4XVxuXG4gICAgICBpdCBcImRlbGV0ZSBzdXJyb3VuZGVkIGNoYXJzIGFuZCByZXBlYXRhYmxlXCIsIC0+XG4gICAgICAgIGVuc3VyZSBbJ2QgcycsIGlucHV0OiAnWyddLFxuICAgICAgICAgIHRleHQ6IFwiYXBwbGVcXG5wYWlyczogYnJhY2tldHNcXG5wYWlyczogW2JyYWNrZXRzXVxcbiggbXVsdGlcXG4gIGxpbmUgKVwiXG4gICAgICAgIGVuc3VyZSAnaiBsIC4nLFxuICAgICAgICAgIHRleHQ6IFwiYXBwbGVcXG5wYWlyczogYnJhY2tldHNcXG5wYWlyczogYnJhY2tldHNcXG4oIG11bHRpXFxuICBsaW5lIClcIlxuICAgICAgaXQgXCJkZWxldGUgc3Vycm91bmRlZCBjaGFycyBleHBhbmRlZCB0byBtdWx0aS1saW5lXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFszLCAxXVxuICAgICAgICBlbnN1cmUgWydkIHMnLCBpbnB1dDogJygnXSxcbiAgICAgICAgICB0ZXh0OiBcImFwcGxlXFxucGFpcnM6IFticmFja2V0c11cXG5wYWlyczogW2JyYWNrZXRzXVxcbiBtdWx0aVxcbiAgbGluZSBcIlxuICAgICAgaXQgXCJkZWxldGUgc3Vycm91bmRlZCBjaGFycyBhbmQgdHJpbSBwYWRkaW5nIHNwYWNlcyBmb3Igbm9uLWlkZW50aWNhbCBwYWlyLWNoYXJcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAoIGFwcGxlIClcbiAgICAgICAgICAgIHsgIG9yYW5nZSAgIH1cXG5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSBbJ2QgcycsIGlucHV0OiAnKCddLCB0ZXh0OiBcImFwcGxlXFxueyAgb3JhbmdlICAgfVxcblwiXG4gICAgICAgIGVuc3VyZSBbJ2ogZCBzJywgaW5wdXQ6ICd7J10sIHRleHQ6IFwiYXBwbGVcXG5vcmFuZ2VcXG5cIlxuICAgICAgaXQgXCJkZWxldGUgc3Vycm91bmRlZCBjaGFycyBhbmQgTk9UIHRyaW0gcGFkZGluZyBzcGFjZXMgZm9yIGlkZW50aWNhbCBwYWlyLWNoYXJcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBgIGFwcGxlIGBcbiAgICAgICAgICAgIFwiICBvcmFuZ2UgICBcIlxcblxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlIFsnZCBzJywgaW5wdXQ6ICdgJ10sIHRleHRfOiAnX2FwcGxlX1xcblwiX19vcmFuZ2VfX19cIlxcbidcbiAgICAgICAgZW5zdXJlIFsnaiBkIHMnLCBpbnB1dDogJ1wiJ10sIHRleHRfOiBcIl9hcHBsZV9cXG5fX29yYW5nZV9fX1xcblwiXG4gICAgICBpdCBcImRlbGV0ZSBzdXJyb3VuZGVkIGZvciBtdWx0aS1saW5lIGJ1dCBkb250IGFmZmVjdCBjb2RlIGxheW91dFwiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICBjdXJzb3I6IFswLCAzNF1cbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGhpZ2hsaWdodFJhbmdlcyBAZWRpdG9yLCByYW5nZSwge1xuICAgICAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0XG4gICAgICAgICAgICAgIGhlbGxvOiB3b3JsZFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIGVuc3VyZSBbJ2QgcycsIGlucHV0OiAneyddLFxuICAgICAgICAgIHRleHQ6IFtcbiAgICAgICAgICAgICAgXCJoaWdobGlnaHRSYW5nZXMgQGVkaXRvciwgcmFuZ2UsIFwiXG4gICAgICAgICAgICAgIFwiICB0aW1lb3V0OiB0aW1lb3V0XCJcbiAgICAgICAgICAgICAgXCIgIGhlbGxvOiB3b3JsZFwiXG4gICAgICAgICAgICAgIFwiXCJcbiAgICAgICAgICAgIF0uam9pbihcIlxcblwiKVxuXG4gICAgZGVzY3JpYmUgJ2NoYW5nZSBzdXJyb3VuZCcsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGF0b20ua2V5bWFwcy5hZGQgXCJzdXJyb3VuZC10ZXN0XCIsXG4gICAgICAgICAgJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1cy5ub3JtYWwtbW9kZSc6XG4gICAgICAgICAgICAnYyBzJzogJ3ZpbS1tb2RlLXBsdXM6Y2hhbmdlLXN1cnJvdW5kJ1xuXG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgKGFwcGxlKVxuICAgICAgICAgICAgKGdyYXBlKVxuICAgICAgICAgICAgPGxlbW1vbj5cbiAgICAgICAgICAgIHtvcmFuZ2V9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3JCdWZmZXI6IFswLCAxXVxuICAgICAgaXQgXCJjaGFuZ2Ugc3Vycm91bmRlZCBjaGFycyBhbmQgcmVwZWF0YWJsZVwiLCAtPlxuICAgICAgICBlbnN1cmUgWydjIHMnLCBpbnB1dDogJyhbJ10sXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBbYXBwbGVdXG4gICAgICAgICAgICAoZ3JhcGUpXG4gICAgICAgICAgICA8bGVtbW9uPlxuICAgICAgICAgICAge29yYW5nZX1cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbnN1cmUgJ2ogbCAuJyxcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIFthcHBsZV1cbiAgICAgICAgICAgIFtncmFwZV1cbiAgICAgICAgICAgIDxsZW1tb24+XG4gICAgICAgICAgICB7b3JhbmdlfVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICBpdCBcImNoYW5nZSBzdXJyb3VuZGVkIGNoYXJzXCIsIC0+XG4gICAgICAgIGVuc3VyZSBbJ2ogaiBjIHMnLCBpbnB1dDogJzxcIiddLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgKGFwcGxlKVxuICAgICAgICAgICAgKGdyYXBlKVxuICAgICAgICAgICAgXCJsZW1tb25cIlxuICAgICAgICAgICAge29yYW5nZX1cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbnN1cmUgWydqIGwgYyBzJywgaW5wdXQ6ICd7ISddLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgKGFwcGxlKVxuICAgICAgICAgICAgKGdyYXBlKVxuICAgICAgICAgICAgXCJsZW1tb25cIlxuICAgICAgICAgICAgIW9yYW5nZSFcbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICBpdCBcImNoYW5nZSBzdXJyb3VuZGVkIGZvciBtdWx0aS1saW5lIGJ1dCBkb250IGFmZmVjdCBjb2RlIGxheW91dFwiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICBjdXJzb3I6IFswLCAzNF1cbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGhpZ2hsaWdodFJhbmdlcyBAZWRpdG9yLCByYW5nZSwge1xuICAgICAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0XG4gICAgICAgICAgICAgIGhlbGxvOiB3b3JsZFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIGVuc3VyZSBbJ2MgcycsIGlucHV0OiAneygnXSxcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGhpZ2hsaWdodFJhbmdlcyBAZWRpdG9yLCByYW5nZSwgKFxuICAgICAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0XG4gICAgICAgICAgICAgIGhlbGxvOiB3b3JsZFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGRlc2NyaWJlICdjaGFyYWN0ZXJzVG9BZGRTcGFjZU9uU3Vycm91bmQgc2V0dGluZycsIC0+XG4gICAgICAgIGVuc3VyZUNoYW5nZVN1cnJvdW5kID0gKGlucHV0S2V5c3Ryb2tlcywgb3B0aW9ucykgLT5cbiAgICAgICAgICBzZXQodGV4dDogb3B0aW9ucy5pbml0aWFsVGV4dCwgY3Vyc29yQnVmZmVyOiBbMCwgMF0pXG4gICAgICAgICAgZGVsZXRlIG9wdGlvbnMuaW5pdGlhbFRleHRcbiAgICAgICAgICBrZXlzdHJva2VzID0gWydjIHMnXS5jb25jYXQoe2lucHV0OiBpbnB1dEtleXN0cm9rZXN9KVxuICAgICAgICAgIGVuc3VyZShrZXlzdHJva2VzLCBvcHRpb25zKVxuXG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXR0aW5ncy5zZXQoJ2NoYXJhY3RlcnNUb0FkZFNwYWNlT25TdXJyb3VuZCcsIFsnKCcsICd7JywgJ1snXSlcblxuICAgICAgICBkZXNjcmliZSAnd2hlbiBpbnB1dCBjaGFyIGlzIGluIGNoYXJhY3RlcnNUb0FkZFNwYWNlT25TdXJyb3VuZCcsIC0+XG4gICAgICAgICAgZGVzY3JpYmUgJ3NpbmdsZSBsaW5lIHRleHQnLCAtPlxuICAgICAgICAgICAgaXQgXCJhZGQgc2luZ2xlIHNwYWNlIGFyb3VuZCBwYWlyIHJlZ2FyZGxlc3Mgb2YgZXhzaXRpbmcgaW5uZXIgdGV4dFwiLCAtPlxuICAgICAgICAgICAgICBlbnN1cmVDaGFuZ2VTdXJyb3VuZCAnKHsnLCBpbml0aWFsVGV4dDogXCIoYXBwbGUpXCIsIHRleHQ6IFwieyBhcHBsZSB9XCJcbiAgICAgICAgICAgICAgZW5zdXJlQ2hhbmdlU3Vycm91bmQgJyh7JywgaW5pdGlhbFRleHQ6IFwiKCBhcHBsZSApXCIsIHRleHQ6IFwieyBhcHBsZSB9XCJcbiAgICAgICAgICAgICAgZW5zdXJlQ2hhbmdlU3Vycm91bmQgJyh7JywgaW5pdGlhbFRleHQ6IFwiKCAgYXBwbGUgIClcIiwgdGV4dDogXCJ7IGFwcGxlIH1cIlxuXG4gICAgICAgICAgZGVzY3JpYmUgJ211bHRpIGxpbmUgdGV4dCcsIC0+XG4gICAgICAgICAgICBpdCBcImRvbid0IHNhZGQgc2luZ2xlIHNwYWNlIGFyb3VuZCBwYWlyXCIsIC0+XG4gICAgICAgICAgICAgIGVuc3VyZUNoYW5nZVN1cnJvdW5kICcoeycsIGluaXRpYWxUZXh0OiBcIihcXG5hcHBsZVxcbilcIiwgdGV4dDogXCJ7XFxuYXBwbGVcXG59XCJcblxuICAgICAgICBkZXNjcmliZSAnd2hlbiBmaXJzdCBpbnB1dCBjaGFyIGlzIG5vdCBpbiBjaGFyYWN0ZXJzVG9BZGRTcGFjZU9uU3Vycm91bmQnLCAtPlxuICAgICAgICAgIGl0IFwicmVtb3ZlIHN1cnJvdW5kaW5nIHNwYWNlIG9mIGlubmVyIHRleHQgZm9yIGlkZW50aWNhbCBwYWlyLWNoYXJcIiwgLT5cbiAgICAgICAgICAgIGVuc3VyZUNoYW5nZVN1cnJvdW5kICcofScsIGluaXRpYWxUZXh0OiBcIihhcHBsZSlcIiwgdGV4dDogXCJ7YXBwbGV9XCJcbiAgICAgICAgICAgIGVuc3VyZUNoYW5nZVN1cnJvdW5kICcofScsIGluaXRpYWxUZXh0OiBcIiggYXBwbGUgKVwiLCB0ZXh0OiBcInthcHBsZX1cIlxuICAgICAgICAgICAgZW5zdXJlQ2hhbmdlU3Vycm91bmQgJyh9JywgaW5pdGlhbFRleHQ6IFwiKCAgYXBwbGUgIClcIiwgdGV4dDogXCJ7YXBwbGV9XCJcbiAgICAgICAgICBpdCBcImRvZXNuJ3QgcmVtb3ZlIHN1cnJvdW5kaW5nIHNwYWNlIG9mIGlubmVyIHRleHQgZm9yIG5vbi1pZGVudGljYWwgcGFpci1jaGFyXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmVDaGFuZ2VTdXJyb3VuZCAnXCJgJywgaW5pdGlhbFRleHQ6ICdcImFwcGxlXCInLCB0ZXh0OiBcImBhcHBsZWBcIlxuICAgICAgICAgICAgZW5zdXJlQ2hhbmdlU3Vycm91bmQgJ1wiYCcsIGluaXRpYWxUZXh0OiAnXCIgIGFwcGxlICBcIicsIHRleHQ6IFwiYCAgYXBwbGUgIGBcIlxuICAgICAgICAgICAgZW5zdXJlQ2hhbmdlU3Vycm91bmQgXCJcXFwiJ1wiLCBpbml0aWFsVGV4dDogJ1wiICBhcHBsZSAgXCInLCB0ZXh0OiBcIicgIGFwcGxlICAnXCJcblxuICAgIGRlc2NyaWJlICdzdXJyb3VuZC13b3JkJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgYXRvbS5rZXltYXBzLmFkZCBcInN1cnJvdW5kLXRlc3RcIixcbiAgICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzLm5vcm1hbC1tb2RlJzpcbiAgICAgICAgICAgICd5IHMgdyc6ICd2aW0tbW9kZS1wbHVzOnN1cnJvdW5kLXdvcmQnXG5cbiAgICAgIGl0IFwic3Vycm91bmQgYSB3b3JkIHdpdGggKCBhbmQgcmVwZWF0YWJsZVwiLCAtPlxuICAgICAgICBlbnN1cmUgWyd5IHMgdycsIGlucHV0OiAnKCddLFxuICAgICAgICAgIHRleHQ6IFwiKGFwcGxlKVxcbnBhaXJzOiBbYnJhY2tldHNdXFxucGFpcnM6IFticmFja2V0c11cXG4oIG11bHRpXFxuICBsaW5lIClcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnaiAuJyxcbiAgICAgICAgICB0ZXh0OiBcIihhcHBsZSlcXG4ocGFpcnMpOiBbYnJhY2tldHNdXFxucGFpcnM6IFticmFja2V0c11cXG4oIG11bHRpXFxuICBsaW5lIClcIlxuICAgICAgaXQgXCJzdXJyb3VuZCBhIHdvcmQgd2l0aCB7IGFuZCByZXBlYXRhYmxlXCIsIC0+XG4gICAgICAgIGVuc3VyZSBbJ3kgcyB3JywgaW5wdXQ6ICd7J10sXG4gICAgICAgICAgdGV4dDogXCJ7YXBwbGV9XFxucGFpcnM6IFticmFja2V0c11cXG5wYWlyczogW2JyYWNrZXRzXVxcbiggbXVsdGlcXG4gIGxpbmUgKVwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdqIC4nLFxuICAgICAgICAgIHRleHQ6IFwie2FwcGxlfVxcbntwYWlyc306IFticmFja2V0c11cXG5wYWlyczogW2JyYWNrZXRzXVxcbiggbXVsdGlcXG4gIGxpbmUgKVwiXG5cbiAgICBkZXNjcmliZSAnZGVsZXRlLXN1cnJvdW5kLWFueS1wYWlyJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBhcHBsZVxuICAgICAgICAgICAgKHBhaXJzOiBbYnJhY2tldHNdKVxuICAgICAgICAgICAge3BhaXJzIFwic1wiIFticmFja2V0c119XG4gICAgICAgICAgICAoIG11bHRpXG4gICAgICAgICAgICAgIGxpbmUgKVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMSwgOV1cblxuICAgICAgICBhdG9tLmtleW1hcHMuYWRkIFwidGVzdFwiLFxuICAgICAgICAgICdhdG9tLXRleHQtZWRpdG9yLnZpbS1tb2RlLXBsdXM6bm90KC5pbnNlcnQtbW9kZSknOlxuICAgICAgICAgICAgJ2Qgcyc6ICd2aW0tbW9kZS1wbHVzOmRlbGV0ZS1zdXJyb3VuZC1hbnktcGFpcidcblxuICAgICAgaXQgXCJkZWxldGUgc3Vycm91bmRlZCBhbnkgcGFpciBmb3VuZCBhbmQgcmVwZWF0YWJsZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2QgcycsXG4gICAgICAgICAgdGV4dDogJ2FwcGxlXFxuKHBhaXJzOiBicmFja2V0cylcXG57cGFpcnMgXCJzXCIgW2JyYWNrZXRzXX1cXG4oIG11bHRpXFxuICBsaW5lICknXG4gICAgICAgIGVuc3VyZSAnLicsXG4gICAgICAgICAgdGV4dDogJ2FwcGxlXFxucGFpcnM6IGJyYWNrZXRzXFxue3BhaXJzIFwic1wiIFticmFja2V0c119XFxuKCBtdWx0aVxcbiAgbGluZSApJ1xuXG4gICAgICBpdCBcImRlbGV0ZSBzdXJyb3VuZGVkIGFueSBwYWlyIGZvdW5kIHdpdGggc2tpcCBwYWlyIG91dCBvZiBjdXJzb3IgYW5kIHJlcGVhdGFibGVcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzIsIDE0XVxuICAgICAgICBlbnN1cmUgJ2QgcycsXG4gICAgICAgICAgdGV4dDogJ2FwcGxlXFxuKHBhaXJzOiBbYnJhY2tldHNdKVxcbntwYWlycyBcInNcIiBicmFja2V0c31cXG4oIG11bHRpXFxuICBsaW5lICknXG4gICAgICAgIGVuc3VyZSAnLicsXG4gICAgICAgICAgdGV4dDogJ2FwcGxlXFxuKHBhaXJzOiBbYnJhY2tldHNdKVxcbnBhaXJzIFwic1wiIGJyYWNrZXRzXFxuKCBtdWx0aVxcbiAgbGluZSApJ1xuICAgICAgICBlbnN1cmUgJy4nLCAjIGRvIG5vdGhpbmcgYW55IG1vcmVcbiAgICAgICAgICB0ZXh0OiAnYXBwbGVcXG4ocGFpcnM6IFticmFja2V0c10pXFxucGFpcnMgXCJzXCIgYnJhY2tldHNcXG4oIG11bHRpXFxuICBsaW5lICknXG5cbiAgICAgIGl0IFwiZGVsZXRlIHN1cnJvdW5kZWQgY2hhcnMgZXhwYW5kZWQgdG8gbXVsdGktbGluZVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMywgMV1cbiAgICAgICAgZW5zdXJlICdkIHMnLFxuICAgICAgICAgIHRleHQ6ICdhcHBsZVxcbihwYWlyczogW2JyYWNrZXRzXSlcXG57cGFpcnMgXCJzXCIgW2JyYWNrZXRzXX1cXG4gbXVsdGlcXG4gIGxpbmUgJ1xuXG4gICAgZGVzY3JpYmUgJ2RlbGV0ZS1zdXJyb3VuZC1hbnktcGFpci1hbGxvdy1mb3J3YXJkaW5nJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KCdzdGF5T25UcmFuc2Zvcm1TdHJpbmcnLCB0cnVlKVxuICAgICAgICBhdG9tLmtleW1hcHMuYWRkIFwidGVzdFwiLFxuICAgICAgICAgICdhdG9tLXRleHQtZWRpdG9yLnZpbS1tb2RlLXBsdXM6bm90KC5pbnNlcnQtbW9kZSknOlxuICAgICAgICAgICAgJ2Qgcyc6ICd2aW0tbW9kZS1wbHVzOmRlbGV0ZS1zdXJyb3VuZC1hbnktcGFpci1hbGxvdy1mb3J3YXJkaW5nJ1xuICAgICAgaXQgXCJbMV0gc2luZ2xlIGxpbmVcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBfX18oaW5uZXIpXG4gICAgICAgICAgX19fKGlubmVyKVxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbnN1cmUgJ2QgcycsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgX19faW5uZXJcbiAgICAgICAgICBfX18oaW5uZXIpXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdqIC4nLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIF9fX2lubmVyXG4gICAgICAgICAgX19faW5uZXJcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFsxLCAwXVxuXG4gICAgZGVzY3JpYmUgJ2NoYW5nZS1zdXJyb3VuZC1hbnktcGFpcicsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgKGFwcGxlKVxuICAgICAgICAgICAgKGdyYXBlKVxuICAgICAgICAgICAgPGxlbW1vbj5cbiAgICAgICAgICAgIHtvcmFuZ2V9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAxXVxuXG4gICAgICAgIGF0b20ua2V5bWFwcy5hZGQgXCJ0ZXN0XCIsXG4gICAgICAgICAgJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1czpub3QoLmluc2VydC1tb2RlKSc6XG4gICAgICAgICAgICAnYyBzJzogJ3ZpbS1tb2RlLXBsdXM6Y2hhbmdlLXN1cnJvdW5kLWFueS1wYWlyJ1xuXG4gICAgICBpdCBcImNoYW5nZSBhbnkgc3Vycm91bmRlZCBwYWlyIGZvdW5kIGFuZCByZXBlYXRhYmxlXCIsIC0+XG4gICAgICAgIGVuc3VyZSBbJ2MgcycsIGlucHV0OiAnPCddLCB0ZXh0OiBcIjxhcHBsZT5cXG4oZ3JhcGUpXFxuPGxlbW1vbj5cXG57b3JhbmdlfVwiXG4gICAgICAgIGVuc3VyZSAnaiAuJywgdGV4dDogXCI8YXBwbGU+XFxuPGdyYXBlPlxcbjxsZW1tb24+XFxue29yYW5nZX1cIlxuICAgICAgICBlbnN1cmUgJ2ogaiAuJywgdGV4dDogXCI8YXBwbGU+XFxuPGdyYXBlPlxcbjxsZW1tb24+XFxuPG9yYW5nZT5cIlxuXG4gICAgZGVzY3JpYmUgJ2NoYW5nZS1zdXJyb3VuZC1hbnktcGFpci1hbGxvdy1mb3J3YXJkaW5nJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KCdzdGF5T25UcmFuc2Zvcm1TdHJpbmcnLCB0cnVlKVxuICAgICAgICBhdG9tLmtleW1hcHMuYWRkIFwidGVzdFwiLFxuICAgICAgICAgICdhdG9tLXRleHQtZWRpdG9yLnZpbS1tb2RlLXBsdXM6bm90KC5pbnNlcnQtbW9kZSknOlxuICAgICAgICAgICAgJ2Mgcyc6ICd2aW0tbW9kZS1wbHVzOmNoYW5nZS1zdXJyb3VuZC1hbnktcGFpci1hbGxvdy1mb3J3YXJkaW5nJ1xuICAgICAgaXQgXCJbMV0gc2luZ2xlIGxpbmVcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBfX18oaW5uZXIpXG4gICAgICAgICAgX19fKGlubmVyKVxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbnN1cmUgWydjIHMnLCBpbnB1dDogJzwnXSxcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBfX188aW5uZXI+XG4gICAgICAgICAgX19fKGlubmVyKVxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnaiAuJyxcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBfX188aW5uZXI+XG4gICAgICAgICAgX19fPGlubmVyPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzEsIDBdXG5cbiAgZGVzY3JpYmUgJ1JlcGxhY2VXaXRoUmVnaXN0ZXInLCAtPlxuICAgIG9yaWdpbmFsVGV4dCA9IG51bGxcbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBhdG9tLmtleW1hcHMuYWRkIFwidGVzdFwiLFxuICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzOm5vdCguaW5zZXJ0LW1vZGUpJzpcbiAgICAgICAgICAnXyc6ICd2aW0tbW9kZS1wbHVzOnJlcGxhY2Utd2l0aC1yZWdpc3RlcidcblxuICAgICAgb3JpZ2luYWxUZXh0ID0gXCJcIlwiXG4gICAgICBhYmMgZGVmICdhYWEnXG4gICAgICBoZXJlIChwYXJlbnRoZXNpcylcbiAgICAgIGhlcmUgKHBhcmVudGhlc2lzKVxuICAgICAgXCJcIlwiXG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogb3JpZ2luYWxUZXh0XG4gICAgICAgIGN1cnNvcjogWzAsIDldXG5cbiAgICAgIHNldCByZWdpc3RlcjogJ1wiJzogdGV4dDogJ2RlZmF1bHQgcmVnaXN0ZXInLCB0eXBlOiAnY2hhcmFjdGVyJ1xuICAgICAgc2V0IHJlZ2lzdGVyOiAnYSc6IHRleHQ6ICdBIHJlZ2lzdGVyJywgdHlwZTogJ2NoYXJhY3RlcidcblxuICAgIGl0IFwicmVwbGFjZSBzZWxlY3Rpb24gd2l0aCByZWdpc2d0ZXIncyBjb250ZW50XCIsIC0+XG4gICAgICBlbnN1cmUgJ3YgaSB3JyxcbiAgICAgICAgc2VsZWN0ZWRUZXh0OiAnYWFhJ1xuICAgICAgZW5zdXJlICdfJyxcbiAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgdGV4dDogb3JpZ2luYWxUZXh0LnJlcGxhY2UoJ2FhYScsICdkZWZhdWx0IHJlZ2lzdGVyJylcblxuICAgIGl0IFwicmVwbGFjZSB0ZXh0IG9iamVjdCB3aXRoIHJlZ2lzZ3RlcidzIGNvbnRlbnRcIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFsxLCA2XVxuICAgICAgZW5zdXJlICdfIGkgKCcsXG4gICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIHRleHQ6IG9yaWdpbmFsVGV4dC5yZXBsYWNlKCdwYXJlbnRoZXNpcycsICdkZWZhdWx0IHJlZ2lzdGVyJylcblxuICAgIGl0IFwiY2FuIHJlcGVhdFwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzEsIDZdXG4gICAgICBlbnN1cmUgJ18gaSAoIGogLicsXG4gICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIHRleHQ6IG9yaWdpbmFsVGV4dC5yZXBsYWNlKC9wYXJlbnRoZXNpcy9nLCAnZGVmYXVsdCByZWdpc3RlcicpXG5cbiAgICBpdCBcImNhbiB1c2Ugc3BlY2lmaWVkIHJlZ2lzdGVyIHRvIHJlcGxhY2Ugd2l0aFwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzEsIDZdXG4gICAgICBlbnN1cmUgWydcIicsIGlucHV0OiAnYScsICdfIGkgKCddLFxuICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICB0ZXh0OiBvcmlnaW5hbFRleHQucmVwbGFjZSgncGFyZW50aGVzaXMnLCAnQSByZWdpc3RlcicpXG5cbiAgZGVzY3JpYmUgJ1N3YXBXaXRoUmVnaXN0ZXInLCAtPlxuICAgIG9yaWdpbmFsVGV4dCA9IG51bGxcbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBhdG9tLmtleW1hcHMuYWRkIFwidGVzdFwiLFxuICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzOm5vdCguaW5zZXJ0LW1vZGUpJzpcbiAgICAgICAgICAnZyBwJzogJ3ZpbS1tb2RlLXBsdXM6c3dhcC13aXRoLXJlZ2lzdGVyJ1xuXG4gICAgICBvcmlnaW5hbFRleHQgPSBcIlwiXCJcbiAgICAgIGFiYyBkZWYgJ2FhYSdcbiAgICAgIGhlcmUgKDExMSlcbiAgICAgIGhlcmUgKDIyMilcbiAgICAgIFwiXCJcIlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IG9yaWdpbmFsVGV4dFxuICAgICAgICBjdXJzb3I6IFswLCA5XVxuXG4gICAgICBzZXQgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICdkZWZhdWx0IHJlZ2lzdGVyJywgdHlwZTogJ2NoYXJhY3RlcidcbiAgICAgIHNldCByZWdpc3RlcjogJ2EnOiB0ZXh0OiAnQSByZWdpc3RlcicsIHR5cGU6ICdjaGFyYWN0ZXInXG5cbiAgICBpdCBcInN3YXAgc2VsZWN0aW9uIHdpdGggcmVnaXNndGVyJ3MgY29udGVudFwiLCAtPlxuICAgICAgZW5zdXJlICd2IGkgdycsIHNlbGVjdGVkVGV4dDogJ2FhYSdcbiAgICAgIGVuc3VyZSAnZyBwJyxcbiAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgdGV4dDogb3JpZ2luYWxUZXh0LnJlcGxhY2UoJ2FhYScsICdkZWZhdWx0IHJlZ2lzdGVyJylcbiAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICdhYWEnXG5cbiAgICBpdCBcInN3YXAgdGV4dCBvYmplY3Qgd2l0aCByZWdpc2d0ZXIncyBjb250ZW50XCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMSwgNl1cbiAgICAgIGVuc3VyZSAnZyBwIGkgKCcsXG4gICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIHRleHQ6IG9yaWdpbmFsVGV4dC5yZXBsYWNlKCcxMTEnLCAnZGVmYXVsdCByZWdpc3RlcicpXG4gICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMTExJ1xuXG4gICAgaXQgXCJjYW4gcmVwZWF0XCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMSwgNl1cbiAgICAgIHVwZGF0ZWRUZXh0ID0gXCJcIlwiXG4gICAgICAgIGFiYyBkZWYgJ2FhYSdcbiAgICAgICAgaGVyZSAoZGVmYXVsdCByZWdpc3RlcilcbiAgICAgICAgaGVyZSAoMTExKVxuICAgICAgICBcIlwiXCJcbiAgICAgIGVuc3VyZSAnZyBwIGkgKCBqIC4nLFxuICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICB0ZXh0OiB1cGRhdGVkVGV4dFxuICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogJzIyMidcblxuICAgIGl0IFwiY2FuIHVzZSBzcGVjaWZpZWQgcmVnaXN0ZXIgdG8gc3dhcCB3aXRoXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMSwgNl1cbiAgICAgIGVuc3VyZSBbJ1wiJywgaW5wdXQ6ICdhJywgJ2cgcCBpICgnXSxcbiAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgdGV4dDogb3JpZ2luYWxUZXh0LnJlcGxhY2UoJzExMScsICdBIHJlZ2lzdGVyJylcbiAgICAgICAgcmVnaXN0ZXI6ICdhJzogdGV4dDogJzExMSdcblxuICBkZXNjcmliZSAnUmV2ZXJzZSBhbmQgU29ydCcsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgYXRvbS5rZXltYXBzLmFkZCBcInRlc3RcIixcbiAgICAgICAgJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1czpub3QoLmluc2VydC1tb2RlKSc6XG4gICAgICAgICAgJ2cgcic6ICAgJ3ZpbS1tb2RlLXBsdXM6cmV2ZXJzZSdcbiAgICAgICAgICAnZyBzJzogICAndmltLW1vZGUtcGx1czpzb3J0J1xuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICBhXG4gICAgICAgIDJcbiAgICAgICAgY1xuICAgICAgICAzXG4gICAgICAgIDFcbiAgICAgICAgYlxuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFsyLCAwXVxuXG4gICAgaXQgJ3NvcnQgcm93cywgcmV2ZXJzZSByb3dzJywgLT5cbiAgICAgIGVuc3VyZSBcImcgcyBpIHBcIiwgLT5cbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgIDFcbiAgICAgICAgMlxuICAgICAgICAzXG4gICAgICAgIGFcbiAgICAgICAgYlxuICAgICAgICBjXG5cbiAgICAgICAgXCJcIlwiXG4gICAgICBlbnN1cmUgXCJnIHIgaSBwXCIsIC0+XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICBjXG4gICAgICAgIGJcbiAgICAgICAgYVxuICAgICAgICAzXG4gICAgICAgIDJcbiAgICAgICAgMVxuXG4gICAgICAgIFwiXCJcIlxuXG4gIGRlc2NyaWJlICdUb2dnbGVMaW5lQ29tbWVudHMnLCAtPlxuICAgIFtvbGRHcmFtbWFyLCBvcmlnaW5hbFRleHRdID0gW11cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWNvZmZlZS1zY3JpcHQnKVxuXG4gICAgICBydW5zIC0+XG4gICAgICAgIG9sZEdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpXG4gICAgICAgIGdyYW1tYXIgPSBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoJ3NvdXJjZS5jb2ZmZWUnKVxuICAgICAgICBlZGl0b3Iuc2V0R3JhbW1hcihncmFtbWFyKVxuICAgICAgICBvcmlnaW5hbFRleHQgPSBcIlwiXCJcbiAgICAgICAgICBjbGFzcyBCYXNlXG4gICAgICAgICAgICBjb25zdHJ1Y3RvcjogKGFyZ3MpIC0+XG4gICAgICAgICAgICAgIHBpdm90ID0gaXRlbXMuc2hpZnQoKVxuICAgICAgICAgICAgICBsZWZ0ID0gW11cbiAgICAgICAgICAgICAgcmlnaHQgPSBbXVxuXG4gICAgICAgICAgY29uc29sZS5sb2cgXCJoZWxsb1wiXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBzZXQgdGV4dDogb3JpZ2luYWxUZXh0XG5cbiAgICBhZnRlckVhY2ggLT5cbiAgICAgIGVkaXRvci5zZXRHcmFtbWFyKG9sZEdyYW1tYXIpXG5cbiAgICBpdCAndG9nZ2xlIGNvbW1lbnQgZm9yIHRleHRvYmplY3QgZm9yIGluZGVudCBhbmQgcmVwZWF0YWJsZScsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMiwgMF1cbiAgICAgIGVuc3VyZSAnZyAvIGkgaScsXG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIGNsYXNzIEJhc2VcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yOiAoYXJncykgLT5cbiAgICAgICAgICAgICAgIyBwaXZvdCA9IGl0ZW1zLnNoaWZ0KClcbiAgICAgICAgICAgICAgIyBsZWZ0ID0gW11cbiAgICAgICAgICAgICAgIyByaWdodCA9IFtdXG5cbiAgICAgICAgICBjb25zb2xlLmxvZyBcImhlbGxvXCJcbiAgICAgICAgXCJcIlwiXG4gICAgICBlbnN1cmUgJy4nLCB0ZXh0OiBvcmlnaW5hbFRleHRcblxuICAgIGl0ICd0b2dnbGUgY29tbWVudCBmb3IgdGV4dG9iamVjdCBmb3IgcGFyYWdyYXBoIGFuZCByZXBlYXRhYmxlJywgLT5cbiAgICAgIHNldCBjdXJzb3I6IFsyLCAwXVxuICAgICAgZW5zdXJlICdnIC8gaSBwJyxcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgIyBjbGFzcyBCYXNlXG4gICAgICAgICAgIyAgIGNvbnN0cnVjdG9yOiAoYXJncykgLT5cbiAgICAgICAgICAjICAgICBwaXZvdCA9IGl0ZW1zLnNoaWZ0KClcbiAgICAgICAgICAjICAgICBsZWZ0ID0gW11cbiAgICAgICAgICAjICAgICByaWdodCA9IFtdXG5cbiAgICAgICAgICBjb25zb2xlLmxvZyBcImhlbGxvXCJcbiAgICAgICAgXCJcIlwiXG5cbiAgICAgIGVuc3VyZSAnLicsIHRleHQ6IG9yaWdpbmFsVGV4dFxuIl19
