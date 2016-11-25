(function() {
  var TextData, dispatch, getVimState, ref, settings,
    slice = [].slice;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData;

  settings = require('../lib/settings');

  describe("Operator general", function() {
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
    describe("cancelling operations", function() {
      return it("clear pending operation", function() {
        keystroke('/');
        expect(vimState.operationStack.isEmpty()).toBe(false);
        vimState.searchInput.cancel();
        expect(vimState.operationStack.isEmpty()).toBe(true);
        return expect(function() {
          return vimState.searchInput.cancel();
        }).not.toThrow();
      });
    });
    describe("the x keybinding", function() {
      describe("on a line with content", function() {
        describe("without vim-mode-plus.wrapLeftRightMotion", function() {
          beforeEach(function() {
            return set({
              text: "abc\n012345\n\nxyz",
              cursor: [1, 4]
            });
          });
          it("deletes a character", function() {
            ensure('x', {
              text: 'abc\n01235\n\nxyz',
              cursor: [1, 4],
              register: {
                '"': {
                  text: '4'
                }
              }
            });
            ensure('x', {
              text: 'abc\n0123\n\nxyz',
              cursor: [1, 3],
              register: {
                '"': {
                  text: '5'
                }
              }
            });
            ensure('x', {
              text: 'abc\n012\n\nxyz',
              cursor: [1, 2],
              register: {
                '"': {
                  text: '3'
                }
              }
            });
            ensure('x', {
              text: 'abc\n01\n\nxyz',
              cursor: [1, 1],
              register: {
                '"': {
                  text: '2'
                }
              }
            });
            ensure('x', {
              text: 'abc\n0\n\nxyz',
              cursor: [1, 0],
              register: {
                '"': {
                  text: '1'
                }
              }
            });
            return ensure('x', {
              text: 'abc\n\n\nxyz',
              cursor: [1, 0],
              register: {
                '"': {
                  text: '0'
                }
              }
            });
          });
          return it("deletes multiple characters with a count", function() {
            ensure('2 x', {
              text: 'abc\n0123\n\nxyz',
              cursor: [1, 3],
              register: {
                '"': {
                  text: '45'
                }
              }
            });
            set({
              cursor: [0, 1]
            });
            return ensure('3 x', {
              text: 'a\n0123\n\nxyz',
              cursor: [0, 0],
              register: {
                '"': {
                  text: 'bc'
                }
              }
            });
          });
        });
        describe("with multiple cursors", function() {
          beforeEach(function() {
            return set({
              text: "abc\n012345\n\nxyz",
              cursor: [[1, 4], [0, 1]]
            });
          });
          return it("is undone as one operation", function() {
            ensure('x', {
              text: "ac\n01235\n\nxyz"
            });
            return ensure('u', {
              text: 'abc\n012345\n\nxyz'
            });
          });
        });
        return describe("with vim-mode-plus.wrapLeftRightMotion", function() {
          beforeEach(function() {
            set({
              text: 'abc\n012345\n\nxyz',
              cursor: [1, 4]
            });
            return settings.set('wrapLeftRightMotion', true);
          });
          it("deletes a character", function() {
            ensure('x', {
              text: 'abc\n01235\n\nxyz',
              cursor: [1, 4],
              register: {
                '"': {
                  text: '4'
                }
              }
            });
            ensure('x', {
              text: 'abc\n0123\n\nxyz',
              cursor: [1, 3],
              register: {
                '"': {
                  text: '5'
                }
              }
            });
            ensure('x', {
              text: 'abc\n012\n\nxyz',
              cursor: [1, 2],
              register: {
                '"': {
                  text: '3'
                }
              }
            });
            ensure('x', {
              text: 'abc\n01\n\nxyz',
              cursor: [1, 1],
              register: {
                '"': {
                  text: '2'
                }
              }
            });
            ensure('x', {
              text: 'abc\n0\n\nxyz',
              cursor: [1, 0],
              register: {
                '"': {
                  text: '1'
                }
              }
            });
            return ensure('x', {
              text: 'abc\n\n\nxyz',
              cursor: [1, 0],
              register: {
                '"': {
                  text: '0'
                }
              }
            });
          });
          return it("deletes multiple characters and newlines with a count", function() {
            settings.set('wrapLeftRightMotion', true);
            ensure('2 x', {
              text: 'abc\n0123\n\nxyz',
              cursor: [1, 3],
              register: {
                '"': {
                  text: '45'
                }
              }
            });
            set({
              cursor: [0, 1]
            });
            ensure('3 x', {
              text: 'a0123\n\nxyz',
              cursor: [0, 1],
              register: {
                '"': {
                  text: 'bc\n'
                }
              }
            });
            return ensure('7 x', {
              text: 'ayz',
              cursor: [0, 1],
              register: {
                '"': {
                  text: '0123\n\nx'
                }
              }
            });
          });
        });
      });
      return describe("on an empty line", function() {
        beforeEach(function() {
          return set({
            text: "abc\n012345\n\nxyz",
            cursor: [2, 0]
          });
        });
        it("deletes nothing on an empty line when vim-mode-plus.wrapLeftRightMotion is false", function() {
          settings.set('wrapLeftRightMotion', false);
          return ensure('x', {
            text: "abc\n012345\n\nxyz",
            cursor: [2, 0]
          });
        });
        return it("deletes an empty line when vim-mode-plus.wrapLeftRightMotion is true", function() {
          settings.set('wrapLeftRightMotion', true);
          return ensure('x', {
            text: "abc\n012345\nxyz",
            cursor: [2, 0]
          });
        });
      });
    });
    describe("the X keybinding", function() {
      describe("on a line with content", function() {
        beforeEach(function() {
          return set({
            text: "ab\n012345",
            cursor: [1, 2]
          });
        });
        return it("deletes a character", function() {
          ensure('X', {
            text: 'ab\n02345',
            cursor: [1, 1],
            register: {
              '"': {
                text: '1'
              }
            }
          });
          ensure('X', {
            text: 'ab\n2345',
            cursor: [1, 0],
            register: {
              '"': {
                text: '0'
              }
            }
          });
          ensure('X', {
            text: 'ab\n2345',
            cursor: [1, 0],
            register: {
              '"': {
                text: '0'
              }
            }
          });
          settings.set('wrapLeftRightMotion', true);
          return ensure('X', {
            text: 'ab2345',
            cursor: [0, 2],
            register: {
              '"': {
                text: '\n'
              }
            }
          });
        });
      });
      return describe("on an empty line", function() {
        beforeEach(function() {
          return set({
            text: "012345\n\nabcdef",
            cursor: [1, 0]
          });
        });
        it("deletes nothing when vim-mode-plus.wrapLeftRightMotion is false", function() {
          settings.set('wrapLeftRightMotion', false);
          return ensure('X', {
            text: "012345\n\nabcdef",
            cursor: [1, 0]
          });
        });
        return it("deletes the newline when wrapLeftRightMotion is true", function() {
          settings.set('wrapLeftRightMotion', true);
          return ensure('X', {
            text: "012345\nabcdef",
            cursor: [0, 5]
          });
        });
      });
    });
    describe("the d keybinding", function() {
      beforeEach(function() {
        return set({
          text: "12345\nabcde\n\nABCDE\n",
          cursor: [1, 1]
        });
      });
      it("enters operator-pending mode", function() {
        return ensure('d', {
          mode: 'operator-pending'
        });
      });
      describe("when followed by a d", function() {
        it("deletes the current line and exits operator-pending mode", function() {
          set({
            cursor: [1, 1]
          });
          return ensure('d d', {
            text: "12345\n\nABCDE\n",
            cursor: [1, 0],
            register: {
              '"': {
                text: "abcde\n"
              }
            },
            mode: 'normal'
          });
        });
        it("deletes the last line and always make non-blank-line last line", function() {
          set({
            cursor: [2, 0]
          });
          return ensure('2 d d', {
            text: "12345\nabcde\n",
            cursor: [1, 0]
          });
        });
        return it("leaves the cursor on the first nonblank character", function() {
          set({
            text: "12345\n  abcde\n",
            cursor: [0, 4]
          });
          return ensure('d d', {
            text: "  abcde\n",
            cursor: [0, 2]
          });
        });
      });
      describe("undo behavior", function() {
        var originalText;
        originalText = "12345\nabcde\nABCDE\nQWERT";
        beforeEach(function() {
          return set({
            text: originalText,
            cursor: [1, 1]
          });
        });
        it("undoes both lines", function() {
          return ensure('d 2 d u', {
            text: originalText,
            selectedText: ''
          });
        });
        return describe("with multiple cursors", function() {
          beforeEach(function() {
            return set({
              cursor: [[1, 1], [0, 0]]
            });
          });
          describe("setCursorToStartOfChangeOnUndoRedo is true(default)", function() {
            return it("is undone as one operation and clear cursors", function() {
              return ensure('d l u', {
                text: originalText,
                selectedText: [''],
                numCursors: 1
              });
            });
          });
          return describe("setCursorToStartOfChangeOnUndoRedo is false", function() {
            beforeEach(function() {
              return settings.set('setCursorToStartOfChangeOnUndoRedo', false);
            });
            return it("is undone as one operation", function() {
              return ensure('d l u', {
                text: originalText,
                selectedText: ['', ''],
                numCursors: 2
              });
            });
          });
        });
      });
      describe("when followed by a w", function() {
        it("deletes the next word until the end of the line and exits operator-pending mode", function() {
          set({
            text: 'abcd efg\nabc',
            cursor: [0, 5]
          });
          return ensure('d w', {
            text: "abcd \nabc",
            cursor: [0, 4],
            mode: 'normal'
          });
        });
        return it("deletes to the beginning of the next word", function() {
          set({
            text: 'abcd efg',
            cursor: [0, 2]
          });
          ensure('d w', {
            text: 'abefg',
            cursor: [0, 2]
          });
          set({
            text: 'one two three four',
            cursor: [0, 0]
          });
          return ensure('d 3 w', {
            text: 'four',
            cursor: [0, 0]
          });
        });
      });
      describe("when followed by an iw", function() {
        return it("deletes the containing word", function() {
          set({
            text: "12345 abcde ABCDE",
            cursor: [0, 9]
          });
          ensure('d', {
            mode: 'operator-pending'
          });
          return ensure('i w', {
            text: "12345  ABCDE",
            cursor: [0, 6],
            register: {
              '"': {
                text: 'abcde'
              }
            },
            mode: 'normal'
          });
        });
      });
      describe("when followed by a j", function() {
        var originalText;
        originalText = "12345\nabcde\nABCDE\n";
        beforeEach(function() {
          return set({
            text: originalText
          });
        });
        describe("on the beginning of the file", function() {
          return it("deletes the next two lines", function() {
            set({
              cursor: [0, 0]
            });
            return ensure('d j', {
              text: 'ABCDE\n'
            });
          });
        });
        describe("on the middle of second line", function() {
          return it("deletes the last two lines", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('d j', {
              text: '12345\n'
            });
          });
        });
        return describe("when cursor is on blank line", function() {
          beforeEach(function() {
            return set({
              text: "a\n\n\nb\n",
              cursor: [1, 0]
            });
          });
          return it("deletes both lines", function() {
            return ensure('d j', {
              text: "a\nb\n",
              cursor: [1, 0]
            });
          });
        });
      });
      describe("when followed by an k", function() {
        var originalText;
        originalText = "12345\nabcde\nABCDE";
        beforeEach(function() {
          return set({
            text: originalText
          });
        });
        describe("on the end of the file", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [2, 4]
            });
            return ensure('d k', {
              text: '12345\n'
            });
          });
        });
        describe("on the beginning of the file", function() {
          return xit("deletes nothing", function() {
            set({
              cursor: [0, 0]
            });
            return ensure('d k', {
              text: originalText
            });
          });
        });
        describe("when on the middle of second line", function() {
          return it("deletes the first two lines", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('d k', {
              text: 'ABCDE'
            });
          });
        });
        describe("when cursor is on blank line", function() {
          beforeEach(function() {
            return set({
              text: "a\n\n\nb\n",
              cursor: [2, 0]
            });
          });
          return it("deletes both lines", function() {
            return ensure('d k', {
              text: "a\nb\n",
              cursor: [1, 0]
            });
          });
        });
        return xdescribe("when it can't move", function() {
          var cursorOriginal, textOriginal;
          textOriginal = "a\nb\n";
          cursorOriginal = [0, 0];
          return it("deletes delete nothing", function() {
            set({
              text: textOriginal,
              cursor: cursorOriginal
            });
            return ensure('d k', {
              text: textOriginal,
              cursor: cursorOriginal
            });
          });
        });
      });
      describe("when followed by a G", function() {
        beforeEach(function() {
          var originalText;
          originalText = "12345\nabcde\nABCDE";
          return set({
            text: originalText
          });
        });
        describe("on the beginning of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('d G', {
              text: '12345\n'
            });
          });
        });
        return describe("on the middle of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('d G', {
              text: '12345\n'
            });
          });
        });
      });
      describe("when followed by a goto line G", function() {
        beforeEach(function() {
          var originalText;
          originalText = "12345\nabcde\nABCDE";
          return set({
            text: originalText
          });
        });
        describe("on the beginning of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('d 2 G', {
              text: '12345\nABCDE'
            });
          });
        });
        return describe("on the middle of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('d 2 G', {
              text: '12345\nABCDE'
            });
          });
        });
      });
      describe("when followed by a t)", function() {
        return describe("with the entire line yanked before", function() {
          beforeEach(function() {
            return set({
              text: "test (xyz)",
              cursor: [0, 6]
            });
          });
          return it("deletes until the closing parenthesis", function() {
            return ensure([
              'd t', {
                input: ')'
              }
            ], {
              text: 'test ()',
              cursor: [0, 6]
            });
          });
        });
      });
      describe("with multiple cursors", function() {
        it("deletes each selection", function() {
          set({
            text: "abcd\n1234\nABCD\n",
            cursorBuffer: [[0, 1], [1, 2], [2, 3]]
          });
          return ensure('d e', {
            text: "a\n12\nABC",
            cursorBuffer: [[0, 0], [1, 1], [2, 2]]
          });
        });
        return it("doesn't delete empty selections", function() {
          set({
            text: "abcd\nabc\nabd",
            cursorBuffer: [[0, 0], [1, 0], [2, 0]]
          });
          return ensure([
            'd t', {
              input: 'd'
            }
          ], {
            text: "d\nabc\nd",
            cursorBuffer: [[0, 0], [1, 0], [2, 0]]
          });
        });
      });
      return describe("stayOnDelete setting", function() {
        beforeEach(function() {
          settings.set('stayOnDelete', true);
          return set({
            text_: "___3333\n__2222\n_1111\n__2222\n___3333\n",
            cursor: [0, 3]
          });
        });
        describe("target range is linewise range", function() {
          it("keep original column after delete", function() {
            ensure("d d", {
              cursor: [0, 3],
              text_: "__2222\n_1111\n__2222\n___3333\n"
            });
            ensure(".", {
              cursor: [0, 3],
              text_: "_1111\n__2222\n___3333\n"
            });
            ensure(".", {
              cursor: [0, 3],
              text_: "__2222\n___3333\n"
            });
            return ensure(".", {
              cursor: [0, 3],
              text_: "___3333\n"
            });
          });
          return it("v_D also keep original column after delete", function() {
            return ensure("v 2 j D", {
              cursor: [0, 3],
              text_: "__2222\n___3333\n"
            });
          });
        });
        return describe("target range is text object", function() {
          describe("target is indent", function() {
            var indentText, textData;
            indentText = "0000000000000000\n  22222222222222\n  22222222222222\n  22222222222222\n0000000000000000\n";
            textData = new TextData(indentText);
            beforeEach(function() {
              return set({
                text: textData.getRaw()
              });
            });
            it("[from top] keep column", function() {
              set({
                cursor: [1, 10]
              });
              return ensure('d i i', {
                cursor: [1, 10],
                text: textData.getLines([0, 4])
              });
            });
            it("[from middle] keep column", function() {
              set({
                cursor: [2, 10]
              });
              return ensure('d i i', {
                cursor: [1, 10],
                text: textData.getLines([0, 4])
              });
            });
            return it("[from bottom] keep column", function() {
              set({
                cursor: [3, 10]
              });
              return ensure('d i i', {
                cursor: [1, 10],
                text: textData.getLines([0, 4])
              });
            });
          });
          return describe("target is paragraph", function() {
            var B1, B2, B3, P1, P2, P3, paragraphText, textData;
            paragraphText = "p1---------------\np1---------------\np1---------------\n\np2---------------\np2---------------\np2---------------\n\np3---------------\np3---------------\np3---------------\n";
            textData = new TextData(paragraphText);
            P1 = [0, 1, 2];
            B1 = 3;
            P2 = [4, 5, 6];
            B2 = 7;
            P3 = [8, 9, 10];
            B3 = 11;
            beforeEach(function() {
              return set({
                text: textData.getRaw()
              });
            });
            it("set cursor to start of deletion after delete [from bottom of paragraph]", function() {
              var i, results;
              set({
                cursor: [0, 0]
              });
              ensure('d i p', {
                cursor: [0, 0],
                text: textData.getLines((function() {
                  results = [];
                  for (var i = B1; B1 <= B3 ? i <= B3 : i >= B3; B1 <= B3 ? i++ : i--){ results.push(i); }
                  return results;
                }).apply(this), {
                  chomp: true
                })
              });
              ensure('j .', {
                cursor: [1, 0],
                text: textData.getLines([B1, B2].concat(slice.call(P3), [B3]), {
                  chomp: true
                })
              });
              return ensure('j .', {
                cursor: [1, 0],
                text: textData.getLines([B1, B2, B3], {
                  chomp: true
                })
              });
            });
            it("set cursor to start of deletion after delete [from middle of paragraph]", function() {
              var i, results;
              set({
                cursor: [1, 0]
              });
              ensure('d i p', {
                cursor: [0, 0],
                text: textData.getLines((function() {
                  results = [];
                  for (var i = B1; B1 <= B3 ? i <= B3 : i >= B3; B1 <= B3 ? i++ : i--){ results.push(i); }
                  return results;
                }).apply(this), {
                  chomp: true
                })
              });
              ensure('2 j .', {
                cursor: [1, 0],
                text: textData.getLines([B1, B2].concat(slice.call(P3), [B3]), {
                  chomp: true
                })
              });
              return ensure('2 j .', {
                cursor: [1, 0],
                text: textData.getLines([B1, B2, B3], {
                  chomp: true
                })
              });
            });
            return it("set cursor to start of deletion after delete [from bottom of paragraph]", function() {
              var i, results;
              set({
                cursor: [1, 0]
              });
              ensure('d i p', {
                cursor: [0, 0],
                text: textData.getLines((function() {
                  results = [];
                  for (var i = B1; B1 <= B3 ? i <= B3 : i >= B3; B1 <= B3 ? i++ : i--){ results.push(i); }
                  return results;
                }).apply(this), {
                  chomp: true
                })
              });
              ensure('3 j .', {
                cursor: [1, 0],
                text: textData.getLines([B1, B2].concat(slice.call(P3), [B3]), {
                  chomp: true
                })
              });
              return ensure('3 j .', {
                cursor: [1, 0],
                text: textData.getLines([B1, B2, B3], {
                  chomp: true
                })
              });
            });
          });
        });
      });
    });
    describe("the D keybinding", function() {
      beforeEach(function() {
        return set({
          text: "0000\n1111\n2222\n3333",
          cursor: [0, 1]
        });
      });
      it("deletes the contents until the end of the line", function() {
        return ensure('D', {
          text: "0\n1111\n2222\n3333"
        });
      });
      return it("in visual-mode, it delete whole line", function() {
        ensure('v D', {
          text: "1111\n2222\n3333"
        });
        return ensure("v j D", {
          text: "3333"
        });
      });
    });
    describe("the y keybinding", function() {
      beforeEach(function() {
        return set({
          text: "012 345\nabc\n",
          cursor: [0, 4]
        });
      });
      describe("when selected lines in visual linewise mode", function() {
        beforeEach(function() {
          return keystroke('V j y');
        });
        it("is in linewise motion", function() {
          return ensure({
            register: {
              '"': {
                type: 'linewise'
              }
            }
          });
        });
        it("saves the lines to the default register", function() {
          return ensure({
            register: {
              '"': {
                text: "012 345\nabc\n"
              }
            }
          });
        });
        return it("places the cursor at the beginning of the selection", function() {
          return ensure({
            cursorBuffer: [0, 0]
          });
        });
      });
      describe("when followed by a second y ", function() {
        beforeEach(function() {
          return keystroke('y y');
        });
        it("saves the line to the default register", function() {
          return ensure({
            register: {
              '"': {
                text: "012 345\n"
              }
            }
          });
        });
        return it("leaves the cursor at the starting position", function() {
          return ensure({
            cursor: [0, 4]
          });
        });
      });
      describe("when useClipboardAsDefaultRegister enabled", function() {
        return it("writes to clipboard", function() {
          settings.set('useClipboardAsDefaultRegister', true);
          keystroke('y y');
          return expect(atom.clipboard.read()).toBe('012 345\n');
        });
      });
      describe("when followed with a repeated y", function() {
        beforeEach(function() {
          return keystroke('y 2 y');
        });
        it("copies n lines, starting from the current", function() {
          return ensure({
            register: {
              '"': {
                text: "012 345\nabc\n"
              }
            }
          });
        });
        return it("leaves the cursor at the starting position", function() {
          return ensure({
            cursor: [0, 4]
          });
        });
      });
      describe("with a register", function() {
        beforeEach(function() {
          return keystroke([
            '"', {
              input: 'a'
            }, 'y y'
          ]);
        });
        it("saves the line to the a register", function() {
          return ensure({
            register: {
              a: {
                text: "012 345\n"
              }
            }
          });
        });
        return it("appends the line to the A register", function() {
          return ensure([
            '"', {
              input: 'A'
            }, 'y y'
          ], {
            register: {
              a: {
                text: "012 345\n012 345\n"
              }
            }
          });
        });
      });
      describe("with a forward motion", function() {
        beforeEach(function() {
          return keystroke('y e');
        });
        it("saves the selected text to the default register", function() {
          return ensure({
            register: {
              '"': {
                text: '345'
              }
            }
          });
        });
        it("leaves the cursor at the starting position", function() {
          return ensure({
            cursor: [0, 4]
          });
        });
        return it("does not yank when motion fails", function() {
          return ensure([
            'y t', {
              input: 'x'
            }
          ], {
            register: {
              '"': {
                text: '345'
              }
            }
          });
        });
      });
      describe("with a text object", function() {
        return it("moves the cursor to the beginning of the text object", function() {
          set({
            cursorBuffer: [0, 5]
          });
          return ensure('y i w', {
            cursorBuffer: [0, 4]
          });
        });
      });
      describe("with a left motion", function() {
        beforeEach(function() {
          return keystroke('y h');
        });
        it("saves the left letter to the default register", function() {
          return ensure({
            register: {
              '"': {
                text: ' '
              }
            }
          });
        });
        return it("moves the cursor position to the left", function() {
          return ensure({
            cursor: [0, 3]
          });
        });
      });
      describe("with a down motion", function() {
        beforeEach(function() {
          return keystroke('y j');
        });
        it("saves both full lines to the default register", function() {
          return ensure({
            register: {
              '"': {
                text: "012 345\nabc\n"
              }
            }
          });
        });
        return it("leaves the cursor at the starting position", function() {
          return ensure({
            cursor: [0, 4]
          });
        });
      });
      describe("when followed by a G", function() {
        beforeEach(function() {
          var originalText;
          originalText = "12345\nabcde\nABCDE";
          return set({
            text: originalText
          });
        });
        describe("on the beginning of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('y G P', {
              text: '12345\nabcde\nABCDE\nabcde\nABCDE'
            });
          });
        });
        return describe("on the middle of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('y G P', {
              text: '12345\nabcde\nABCDE\nabcde\nABCDE'
            });
          });
        });
      });
      describe("when followed by a goto line G", function() {
        beforeEach(function() {
          var originalText;
          originalText = "12345\nabcde\nABCDE";
          return set({
            text: originalText
          });
        });
        describe("on the beginning of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('y 2 G P', {
              text: '12345\nabcde\nabcde\nABCDE'
            });
          });
        });
        return describe("on the middle of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('y 2 G P', {
              text: '12345\nabcde\nabcde\nABCDE'
            });
          });
        });
      });
      describe("with multiple cursors", function() {
        return it("moves each cursor and copies the last selection's text", function() {
          set({
            text: "  abcd\n  1234",
            cursorBuffer: [[0, 0], [1, 5]]
          });
          return ensure('y ^', {
            register: {
              '"': {
                text: '123'
              }
            },
            cursorBuffer: [[0, 0], [1, 2]]
          });
        });
      });
      return describe("stayOnYank setting", function() {
        var text;
        text = null;
        beforeEach(function() {
          settings.set('stayOnYank', true);
          text = new TextData("0_234567\n1_234567\n2_234567\n\n4_234567\n");
          return set({
            text: text.getRaw(),
            cursor: [1, 2]
          });
        });
        it("don't move cursor after yank from normal-mode", function() {
          ensure("y i p", {
            cursorBuffer: [1, 2],
            register: {
              '"': {
                text: text.getLines([0, 1, 2])
              }
            }
          });
          ensure("j y y", {
            cursorBuffer: [2, 2],
            register: {
              '"': {
                text: text.getLines([2])
              }
            }
          });
          return ensure("k .", {
            cursorBuffer: [1, 2],
            register: {
              '"': {
                text: text.getLines([1])
              }
            }
          });
        });
        it("don't move cursor after yank from visual-linewise", function() {
          ensure("V y", {
            cursorBuffer: [1, 2],
            register: {
              '"': {
                text: text.getLines([1])
              }
            }
          });
          return ensure("V j y", {
            cursorBuffer: [2, 2],
            register: {
              '"': {
                text: text.getLines([1, 2])
              }
            }
          });
        });
        return it("don't move cursor after yank from visual-characterwise", function() {
          ensure("v l l y", {
            cursorBuffer: [1, 4],
            register: {
              '"': {
                text: "234"
              }
            }
          });
          ensure("v h h y", {
            cursorBuffer: [1, 2],
            register: {
              '"': {
                text: "234"
              }
            }
          });
          ensure("v j y", {
            cursorBuffer: [2, 2],
            register: {
              '"': {
                text: "234567\n2_2"
              }
            }
          });
          return ensure("v 2 k y", {
            cursorBuffer: [0, 2],
            register: {
              '"': {
                text: "234567\n1_234567\n2_2"
              }
            }
          });
        });
      });
    });
    describe("the yy keybinding", function() {
      describe("on a single line file", function() {
        beforeEach(function() {
          return set({
            text: "exclamation!\n",
            cursor: [0, 0]
          });
        });
        return it("copies the entire line and pastes it correctly", function() {
          return ensure('y y p', {
            register: {
              '"': {
                text: "exclamation!\n"
              }
            },
            text: "exclamation!\nexclamation!\n"
          });
        });
      });
      return describe("on a single line file with no newline", function() {
        beforeEach(function() {
          return set({
            text: "no newline!",
            cursor: [0, 0]
          });
        });
        it("copies the entire line and pastes it correctly", function() {
          return ensure('y y p', {
            register: {
              '"': {
                text: "no newline!\n"
              }
            },
            text: "no newline!\nno newline!"
          });
        });
        return it("copies the entire line and pastes it respecting count and new lines", function() {
          return ensure('y y 2 p', {
            register: {
              '"': {
                text: "no newline!\n"
              }
            },
            text: "no newline!\nno newline!\nno newline!"
          });
        });
      });
    });
    describe("the Y keybinding", function() {
      var text;
      text = "012 345\nabc\n";
      beforeEach(function() {
        return set({
          text: text,
          cursor: [0, 4]
        });
      });
      it("saves the line to the default register", function() {
        return ensure('Y', {
          cursor: [0, 4],
          register: {
            '"': {
              text: "012 345\n"
            }
          }
        });
      });
      return it("yank the whole lines to the default register", function() {
        return ensure('v j Y', {
          cursor: [0, 0],
          register: {
            '"': {
              text: text
            }
          }
        });
      });
    });
    describe("the p keybinding", function() {
      describe("with character contents", function() {
        beforeEach(function() {
          set({
            text: "012\n",
            cursor: [0, 0]
          });
          set({
            register: {
              '"': {
                text: '345'
              }
            }
          });
          set({
            register: {
              'a': {
                text: 'a'
              }
            }
          });
          return atom.clipboard.write("clip");
        });
        describe("from the default register", function() {
          beforeEach(function() {
            return keystroke('p');
          });
          return it("inserts the contents", function() {
            return ensure({
              text: "034512\n",
              cursor: [0, 3]
            });
          });
        });
        describe("at the end of a line", function() {
          beforeEach(function() {
            set({
              cursor: [0, 2]
            });
            return keystroke('p');
          });
          return it("positions cursor correctly", function() {
            return ensure({
              text: "012345\n",
              cursor: [0, 5]
            });
          });
        });
        describe("paste to empty line", function() {
          return it("paste content to that empty line", function() {
            set({
              text: "1st\n\n3rd",
              cursor: [1, 0],
              register: {
                '"': {
                  text: '2nd'
                }
              }
            });
            return ensure('p', {
              text: "1st\n2nd\n3rd"
            });
          });
        });
        describe("when useClipboardAsDefaultRegister enabled", function() {
          return it("inserts contents from clipboard", function() {
            settings.set('useClipboardAsDefaultRegister', true);
            return ensure('p', {
              text: "0clip12\n"
            });
          });
        });
        describe("from a specified register", function() {
          beforeEach(function() {
            return keystroke([
              '"', {
                input: 'a'
              }, 'p'
            ]);
          });
          return it("inserts the contents of the 'a' register", function() {
            return ensure({
              text: "0a12\n",
              cursor: [0, 1]
            });
          });
        });
        return describe("at the end of a line", function() {
          return it("inserts before the current line's newline", function() {
            set({
              text: "abcde\none two three",
              cursor: [1, 4]
            });
            return ensure('d $ k $ p', {
              text: "abcdetwo three\none "
            });
          });
        });
      });
      describe("with linewise contents", function() {
        describe("on a single line", function() {
          beforeEach(function() {
            return set({
              text: '012',
              cursor: [0, 1],
              register: {
                '"': {
                  text: " 345\n",
                  type: 'linewise'
                }
              }
            });
          });
          it("inserts the contents of the default register", function() {
            return ensure('p', {
              text: "012\n 345",
              cursor: [1, 1]
            });
          });
          return it("replaces the current selection and put cursor to the first char of line", function() {
            return ensure('v p', {
              text: "0\n 345\n2",
              cursor: [1, 1]
            });
          });
        });
        return describe("on multiple lines", function() {
          beforeEach(function() {
            return set({
              text: "012\n 345",
              register: {
                '"': {
                  text: " 456\n",
                  type: 'linewise'
                }
              }
            });
          });
          it("inserts the contents of the default register at middle line", function() {
            set({
              cursor: [0, 1]
            });
            keystroke('p');
            return ensure({
              text: "012\n 456\n 345",
              cursor: [1, 1]
            });
          });
          return it("inserts the contents of the default register at end of line", function() {
            set({
              cursor: [1, 1]
            });
            return ensure('p', {
              text: "012\n 345\n 456",
              cursor: [2, 1]
            });
          });
        });
      });
      describe("with multiple linewise contents", function() {
        beforeEach(function() {
          set({
            text: "012\nabc",
            cursor: [1, 0],
            register: {
              '"': {
                text: " 345\n 678\n",
                type: 'linewise'
              }
            }
          });
          return keystroke('p');
        });
        return it("inserts the contents of the default register", function() {
          return ensure({
            text: "012\nabc\n 345\n 678",
            cursor: [2, 1]
          });
        });
      });
      describe("pasting twice", function() {
        beforeEach(function() {
          set({
            text: "12345\nabcde\nABCDE\nQWERT",
            cursor: [1, 1],
            register: {
              '"': {
                text: '123'
              }
            }
          });
          return keystroke('2 p');
        });
        it("inserts the same line twice", function() {
          return ensure({
            text: "12345\nab123123cde\nABCDE\nQWERT"
          });
        });
        return describe("when undone", function() {
          return it("removes both lines", function() {
            return ensure('u', {
              text: "12345\nabcde\nABCDE\nQWERT"
            });
          });
        });
      });
      describe("support multiple cursors", function() {
        return it("paste text for each cursors", function() {
          set({
            text: "12345\nabcde\nABCDE\nQWERT",
            cursor: [[1, 0], [2, 0]],
            register: {
              '"': {
                text: 'ZZZ'
              }
            }
          });
          return ensure('p', {
            text: "12345\naZZZbcde\nAZZZBCDE\nQWERT",
            cursor: [[1, 3], [2, 3]]
          });
        });
      });
      return describe("with a selection", function() {
        beforeEach(function() {
          return set({
            text: '012\n',
            cursor: [0, 1]
          });
        });
        describe("with characterwise selection", function() {
          it("replaces selection with charwise content", function() {
            set({
              register: {
                '"': {
                  text: "345"
                }
              }
            });
            return ensure('v p', {
              text: "03452\n",
              cursor: [0, 3]
            });
          });
          return it("replaces selection with linewise content", function() {
            set({
              register: {
                '"': {
                  text: "345\n"
                }
              }
            });
            return ensure('v p', {
              text: "0\n345\n2\n",
              cursor: [1, 0]
            });
          });
        });
        return describe("with linewise selection", function() {
          it("replaces selection with charwise content", function() {
            set({
              text: "012\nabc",
              cursor: [0, 1]
            });
            set({
              register: {
                '"': {
                  text: "345"
                }
              }
            });
            return ensure('V p', {
              text: "345\nabc",
              cursor: [0, 0]
            });
          });
          return it("replaces selection with linewise content", function() {
            set({
              register: {
                '"': {
                  text: "345\n"
                }
              }
            });
            return ensure('V p', {
              text: "345\n",
              cursor: [0, 0]
            });
          });
        });
      });
    });
    describe("the P keybinding", function() {
      return describe("with character contents", function() {
        beforeEach(function() {
          set({
            text: "012\n",
            cursor: [0, 0]
          });
          set({
            register: {
              '"': {
                text: '345'
              }
            }
          });
          set({
            register: {
              a: {
                text: 'a'
              }
            }
          });
          return keystroke('P');
        });
        return it("inserts the contents of the default register above", function() {
          return ensure({
            text: "345012\n",
            cursor: [0, 2]
          });
        });
      });
    });
    describe("PutAfterAndSelect and PutBeforeAndSelect", function() {
      beforeEach(function() {
        atom.keymaps.add("text", {
          'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
            'g p': 'vim-mode-plus:put-after-and-select',
            'g P': 'vim-mode-plus:put-before-and-select'
          }
        });
        return set({
          text: "111\n222\n333\n",
          cursor: [1, 0]
        });
      });
      describe("in visual-mode", function() {
        describe("linewise register", function() {
          beforeEach(function() {
            return set({
              register: {
                '"': {
                  text: "AAA\n"
                }
              }
            });
          });
          it("paste and select: [selection:linewise]", function() {
            return ensure('V g p', {
              text: "111\nAAA\n333\n",
              selectedText: "AAA\n",
              mode: ['visual', 'linewise']
            });
          });
          return it("paste and select: [selection:charwise, register:linewise]", function() {
            return ensure('v g P', {
              text: "111\n\nAAA\n22\n333\n",
              selectedText: "AAA\n",
              mode: ['visual', 'linewise']
            });
          });
        });
        return describe("characterwise register", function() {
          beforeEach(function() {
            return set({
              register: {
                '"': {
                  text: "AAA"
                }
              }
            });
          });
          it("paste and select: [selection:linewise, register:charwise]", function() {
            return ensure('V g p', {
              text: "111\nAAA\n333\n",
              selectedText: "AAA\n",
              mode: ['visual', 'linewise']
            });
          });
          return it("paste and select: [selection:charwise, register:charwise]", function() {
            return ensure('v g P', {
              text: "111\nAAA22\n333\n",
              selectedText: "AAA",
              mode: ['visual', 'characterwise']
            });
          });
        });
      });
      return describe("in normal", function() {
        describe("linewise register", function() {
          beforeEach(function() {
            return set({
              register: {
                '"': {
                  text: "AAA\n"
                }
              }
            });
          });
          it("putAfter and select", function() {
            return ensure('g p', {
              text: "111\n222\nAAA\n333\n",
              selectedText: "AAA\n",
              mode: ['visual', 'linewise']
            });
          });
          return it("putBefore and select", function() {
            return ensure('g P', {
              text: "111\nAAA\n222\n333\n",
              selectedText: "AAA\n",
              mode: ['visual', 'linewise']
            });
          });
        });
        return describe("characterwise register", function() {
          beforeEach(function() {
            return set({
              register: {
                '"': {
                  text: "AAA"
                }
              }
            });
          });
          it("putAfter and select", function() {
            return ensure('g p', {
              text: "111\n2AAA22\n333\n",
              selectedText: "AAA",
              mode: ['visual', 'characterwise']
            });
          });
          return it("putAfter and select", function() {
            return ensure('g P', {
              text: "111\nAAA222\n333\n",
              selectedText: "AAA",
              mode: ['visual', 'characterwise']
            });
          });
        });
      });
    });
    describe("the J keybinding", function() {
      beforeEach(function() {
        return set({
          text: "012\n    456\n",
          cursor: [0, 1]
        });
      });
      describe("without repeating", function() {
        beforeEach(function() {
          return keystroke('J');
        });
        return it("joins the contents of the current line with the one below it", function() {
          return ensure({
            text: "012 456\n"
          });
        });
      });
      return describe("with repeating", function() {
        beforeEach(function() {
          set({
            text: "12345\nabcde\nABCDE\nQWERT",
            cursor: [1, 1]
          });
          return keystroke('2 J');
        });
        return describe("undo behavior", function() {
          beforeEach(function() {
            return keystroke('u');
          });
          return it("handles repeats", function() {
            return ensure({
              text: "12345\nabcde\nABCDE\nQWERT"
            });
          });
        });
      });
    });
    describe("the . keybinding", function() {
      beforeEach(function() {
        return set({
          text: "12\n34\n56\n78",
          cursor: [0, 0]
        });
      });
      it("repeats the last operation", function() {
        return ensure('2 d d .', {
          text: ""
        });
      });
      return it("composes with motions", function() {
        return ensure('d d 2 .', {
          text: "78"
        });
      });
    });
    describe("the r keybinding", function() {
      beforeEach(function() {
        return set({
          text: "12\n34\n\n",
          cursorBuffer: [[0, 0], [1, 0]]
        });
      });
      it("replaces a single character", function() {
        return ensure([
          'r', {
            input: 'x'
          }
        ], {
          text: 'x2\nx4\n\n'
        });
      });
      it("does nothing when cancelled", function() {
        keystroke('r');
        vimState.input.cancel();
        return ensure({
          text: '12\n34\n\n',
          mode: 'normal'
        });
      });
      it("remain visual-mode when cancelled", function() {
        keystroke('v r');
        vimState.input.cancel();
        return ensure({
          text: '12\n34\n\n',
          mode: ['visual', 'characterwise']
        });
      });
      it("replaces a single character with a line break", function() {
        return ensure('r enter', {
          text: '\n2\n\n4\n\n',
          cursorBuffer: [[1, 0], [3, 0]]
        });
      });
      it("composes properly with motions", function() {
        return ensure([
          '2 r', {
            input: 'x'
          }
        ], {
          text: 'xx\nxx\n\n'
        });
      });
      it("does nothing on an empty line", function() {
        set({
          cursorBuffer: [2, 0]
        });
        return ensure([
          'r', {
            input: 'x'
          }
        ], {
          text: '12\n34\n\n'
        });
      });
      it("does nothing if asked to replace more characters than there are on a line", function() {
        return ensure([
          '3 r', {
            input: 'x'
          }
        ], {
          text: '12\n34\n\n'
        });
      });
      describe("when in visual mode", function() {
        beforeEach(function() {
          return keystroke('v e');
        });
        it("replaces the entire selection with the given character", function() {
          return ensure([
            'r', {
              input: 'x'
            }
          ], {
            text: 'xx\nxx\n\n'
          });
        });
        return it("leaves the cursor at the beginning of the selection", function() {
          return ensure([
            'r', {
              input: 'x'
            }
          ], {
            cursorBuffer: [[0, 0], [1, 0]]
          });
        });
      });
      return describe("when in visual-block mode", function() {
        var textOriginal, textRepeated, textReplaced;
        textOriginal = "0:2345\n1: o11o\n2: o22o\n3: o33o\n4: o44o\n";
        textReplaced = "0:2345\n1: oxxo\n2: oxxo\n3: oxxo\n4: oxxo\n";
        textRepeated = "0:2345\nxx oxxo\nxx oxxo\nxx oxxo\nxx oxxo\n";
        beforeEach(function() {
          set({
            text: textOriginal,
            cursor: [1, 4]
          });
          return ensure('ctrl-v l 3 j', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['11', '22', '33', '44']
          });
        });
        return xit("replaces each selection and put cursor on start of top selection", function() {
          ensure([
            'r', {
              input: 'x'
            }
          ], {
            mode: 'normal',
            text: textReplaced,
            cursor: [1, 4]
          });
          set({
            cursor: [1, 0]
          });
          return ensure('.', {
            mode: 'normal',
            text: textRepeated,
            cursor: [1, 0]
          });
        });
      });
    });
    describe('the m keybinding', function() {
      beforeEach(function() {
        return set({
          text: '12\n34\n56\n',
          cursorBuffer: [0, 1]
        });
      });
      return it('marks a position', function() {
        keystroke('m a');
        return expect(vimState.mark.get('a')).toEqual([0, 1]);
      });
    });
    return describe('the R keybinding', function() {
      beforeEach(function() {
        return set({
          text: "12345\n67890",
          cursorBuffer: [0, 2]
        });
      });
      it("enters replace mode and replaces characters", function() {
        ensure('R', {
          mode: ['insert', 'replace']
        });
        editor.insertText("ab");
        return ensure('escape', {
          text: "12ab5\n67890",
          cursor: [0, 3],
          mode: 'normal'
        });
      });
      it("continues beyond end of line as insert", function() {
        ensure('R', {
          mode: ['insert', 'replace']
        });
        editor.insertText("abcde");
        return ensure('escape', {
          text: '12abcde\n67890'
        });
      });
      it('treats backspace as undo', function() {
        editor.insertText("foo");
        keystroke('R');
        editor.insertText("a");
        editor.insertText("b");
        ensure({
          text: "12fooab5\n67890"
        });
        ensure('backspace', {
          text: "12fooa45\n67890"
        });
        editor.insertText("c");
        ensure({
          text: "12fooac5\n67890"
        });
        ensure('backspace backspace', {
          text: "12foo345\n67890",
          selectedText: ''
        });
        return ensure('backspace', {
          text: "12foo345\n67890",
          selectedText: ''
        });
      });
      it("can be repeated", function() {
        keystroke('R');
        editor.insertText("ab");
        keystroke('escape');
        set({
          cursorBuffer: [1, 2]
        });
        ensure('.', {
          text: "12ab5\n67ab0",
          cursor: [1, 3]
        });
        set({
          cursorBuffer: [0, 4]
        });
        return ensure('.', {
          text: "12abab\n67ab0",
          cursor: [0, 5]
        });
      });
      it("can be interrupted by arrow keys and behave as insert for repeat", function() {});
      it("repeats correctly when backspace was used in the text", function() {
        keystroke('R');
        editor.insertText("a");
        keystroke('backspace');
        editor.insertText("b");
        keystroke('escape');
        set({
          cursorBuffer: [1, 2]
        });
        ensure('.', {
          text: "12b45\n67b90",
          cursor: [1, 2]
        });
        set({
          cursorBuffer: [0, 4]
        });
        return ensure('.', {
          text: "12b4b\n67b90",
          cursor: [0, 4]
        });
      });
      it("doesn't replace a character if newline is entered", function() {
        ensure('R', {
          mode: ['insert', 'replace']
        });
        editor.insertText("\n");
        return ensure('escape', {
          text: "12\n345\n67890"
        });
      });
      return describe("multiline situation", function() {
        var textOriginal;
        textOriginal = "01234\n56789";
        beforeEach(function() {
          return set({
            text: textOriginal,
            cursor: [0, 0]
          });
        });
        it("replace character unless input isnt new line(\\n)", function() {
          ensure('R', {
            mode: ['insert', 'replace']
          });
          editor.insertText("a\nb\nc");
          return ensure({
            text: "a\nb\nc34\n56789",
            cursor: [2, 1]
          });
        });
        it("handle backspace", function() {
          ensure('R', {
            mode: ['insert', 'replace']
          });
          set({
            cursor: [0, 1]
          });
          editor.insertText("a\nb\nc");
          ensure({
            text: "0a\nb\nc4\n56789",
            cursor: [2, 1]
          });
          ensure('backspace', {
            text: "0a\nb\n34\n56789",
            cursor: [2, 0]
          });
          ensure('backspace', {
            text: "0a\nb34\n56789",
            cursor: [1, 1]
          });
          ensure('backspace', {
            text: "0a\n234\n56789",
            cursor: [1, 0]
          });
          ensure('backspace', {
            text: "0a234\n56789",
            cursor: [0, 2]
          });
          ensure('backspace', {
            text: "01234\n56789",
            cursor: [0, 1]
          });
          ensure('backspace', {
            text: "01234\n56789",
            cursor: [0, 1]
          });
          return ensure('escape', {
            text: "01234\n56789",
            cursor: [0, 0],
            mode: 'normal'
          });
        });
        it("repeate multiline text case-1", function() {
          ensure('R', {
            mode: ['insert', 'replace']
          });
          editor.insertText("abc\ndef");
          ensure({
            text: "abc\ndef\n56789",
            cursor: [1, 3]
          });
          ensure('escape', {
            cursor: [1, 2],
            mode: 'normal'
          });
          ensure('u', {
            text: textOriginal
          });
          ensure('.', {
            text: "abc\ndef\n56789",
            cursor: [1, 2],
            mode: 'normal'
          });
          return ensure('j .', {
            text: "abc\ndef\n56abc\ndef",
            cursor: [3, 2],
            mode: 'normal'
          });
        });
        return it("repeate multiline text case-2", function() {
          ensure('R', {
            mode: ['insert', 'replace']
          });
          editor.insertText("abc\nd");
          ensure({
            text: "abc\nd4\n56789",
            cursor: [1, 1]
          });
          ensure('escape', {
            cursor: [1, 0],
            mode: 'normal'
          });
          return ensure('j .', {
            text: "abc\nd4\nabc\nd9",
            cursor: [3, 0],
            mode: 'normal'
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL29wZXJhdG9yLWdlbmVyYWwtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDhDQUFBO0lBQUE7O0VBQUEsTUFBb0MsT0FBQSxDQUFRLGVBQVIsQ0FBcEMsRUFBQyw2QkFBRCxFQUFjLHVCQUFkLEVBQXdCOztFQUN4QixRQUFBLEdBQVcsT0FBQSxDQUFRLGlCQUFSOztFQUVYLFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO0FBQzNCLFFBQUE7SUFBQSxPQUE0RCxFQUE1RCxFQUFDLGFBQUQsRUFBTSxnQkFBTixFQUFjLG1CQUFkLEVBQXlCLGdCQUF6QixFQUFpQyx1QkFBakMsRUFBZ0Q7SUFFaEQsVUFBQSxDQUFXLFNBQUE7YUFDVCxXQUFBLENBQVksU0FBQyxLQUFELEVBQVEsR0FBUjtRQUNWLFFBQUEsR0FBVztRQUNWLHdCQUFELEVBQVM7ZUFDUixhQUFELEVBQU0sbUJBQU4sRUFBYyx5QkFBZCxFQUEyQjtNQUhqQixDQUFaO0lBRFMsQ0FBWDtJQU1BLFNBQUEsQ0FBVSxTQUFBO2FBQ1IsUUFBUSxDQUFDLGVBQVQsQ0FBQTtJQURRLENBQVY7SUFHQSxRQUFBLENBQVMsdUJBQVQsRUFBa0MsU0FBQTthQUNoQyxFQUFBLENBQUcseUJBQUgsRUFBOEIsU0FBQTtRQUM1QixTQUFBLENBQVUsR0FBVjtRQUNBLE1BQUEsQ0FBTyxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQXhCLENBQUEsQ0FBUCxDQUF5QyxDQUFDLElBQTFDLENBQStDLEtBQS9DO1FBQ0EsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFyQixDQUFBO1FBQ0EsTUFBQSxDQUFPLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBeEIsQ0FBQSxDQUFQLENBQXlDLENBQUMsSUFBMUMsQ0FBK0MsSUFBL0M7ZUFDQSxNQUFBLENBQU8sU0FBQTtp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RUFBSSxDQUFKLENBTlI7WUFPQSxJQUFBLEVBQU0sUUFQTjtXQURGO1FBcEJrQyxDQUFwQztlQTZCQSxFQUFBLENBQUcsK0JBQUgsRUFBb0MsU0FBQTtVQUNsQyxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsSUFBQSxFQUFNLENBQUMsUUFBRCxFQUFXLFNBQVgsQ0FBTjtXQUFaO1VBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsUUFBbEI7VUFDQSxNQUFBLENBQ0U7WUFBQSxJQUFBLEVBQU0sZ0JBQU47WUFLQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUxSO1dBREY7VUFPQSxNQUFBLENBQU8sUUFBUCxFQUFpQjtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7WUFBZ0IsSUFBQSxFQUFNLFFBQXRCO1dBQWpCO2lCQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sa0JBQU47WUFNQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQU5SO1lBT0EsSUFBQSxFQUFNLFFBUE47V0FERjtRQVhrQyxDQUFwQztNQTFHOEIsQ0FBaEM7SUF0RTJCLENBQTdCO0VBbC9CMkIsQ0FBN0I7QUFIQSIsInNvdXJjZXNDb250ZW50IjpbIntnZXRWaW1TdGF0ZSwgZGlzcGF0Y2gsIFRleHREYXRhfSA9IHJlcXVpcmUgJy4vc3BlYy1oZWxwZXInXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4uL2xpYi9zZXR0aW5ncydcblxuZGVzY3JpYmUgXCJPcGVyYXRvciBnZW5lcmFsXCIsIC0+XG4gIFtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlLCBlZGl0b3IsIGVkaXRvckVsZW1lbnQsIHZpbVN0YXRlXSA9IFtdXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIGdldFZpbVN0YXRlIChzdGF0ZSwgdmltKSAtPlxuICAgICAgdmltU3RhdGUgPSBzdGF0ZVxuICAgICAge2VkaXRvciwgZWRpdG9yRWxlbWVudH0gPSB2aW1TdGF0ZVxuICAgICAge3NldCwgZW5zdXJlLCBrZXlzdHJva2V9ID0gdmltXG5cbiAgYWZ0ZXJFYWNoIC0+XG4gICAgdmltU3RhdGUucmVzZXROb3JtYWxNb2RlKClcblxuICBkZXNjcmliZSBcImNhbmNlbGxpbmcgb3BlcmF0aW9uc1wiLCAtPlxuICAgIGl0IFwiY2xlYXIgcGVuZGluZyBvcGVyYXRpb25cIiwgLT5cbiAgICAgIGtleXN0cm9rZSAnLydcbiAgICAgIGV4cGVjdCh2aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5pc0VtcHR5KCkpLnRvQmUgZmFsc2VcbiAgICAgIHZpbVN0YXRlLnNlYXJjaElucHV0LmNhbmNlbCgpXG4gICAgICBleHBlY3QodmltU3RhdGUub3BlcmF0aW9uU3RhY2suaXNFbXB0eSgpKS50b0JlIHRydWVcbiAgICAgIGV4cGVjdCgtPiB2aW1TdGF0ZS5zZWFyY2hJbnB1dC5jYW5jZWwoKSkubm90LnRvVGhyb3coKVxuXG4gIGRlc2NyaWJlIFwidGhlIHgga2V5YmluZGluZ1wiLCAtPlxuICAgIGRlc2NyaWJlIFwib24gYSBsaW5lIHdpdGggY29udGVudFwiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJ3aXRob3V0IHZpbS1tb2RlLXBsdXMud3JhcExlZnRSaWdodE1vdGlvblwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcImFiY1xcbjAxMjM0NVxcblxcbnh5elwiXG4gICAgICAgICAgICBjdXJzb3I6IFsxLCA0XVxuXG4gICAgICAgIGl0IFwiZGVsZXRlcyBhIGNoYXJhY3RlclwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAneCcsIHRleHQ6ICdhYmNcXG4wMTIzNVxcblxcbnh5eicsIGN1cnNvcjogWzEsIDRdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzQnXG4gICAgICAgICAgZW5zdXJlICd4JywgdGV4dDogJ2FiY1xcbjAxMjNcXG5cXG54eXonICwgY3Vyc29yOiBbMSwgM10sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnNSdcbiAgICAgICAgICBlbnN1cmUgJ3gnLCB0ZXh0OiAnYWJjXFxuMDEyXFxuXFxueHl6JyAgLCBjdXJzb3I6IFsxLCAyXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICczJ1xuICAgICAgICAgIGVuc3VyZSAneCcsIHRleHQ6ICdhYmNcXG4wMVxcblxcbnh5eicgICAsIGN1cnNvcjogWzEsIDFdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzInXG4gICAgICAgICAgZW5zdXJlICd4JywgdGV4dDogJ2FiY1xcbjBcXG5cXG54eXonICAgICwgY3Vyc29yOiBbMSwgMF0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMSdcbiAgICAgICAgICBlbnN1cmUgJ3gnLCB0ZXh0OiAnYWJjXFxuXFxuXFxueHl6JyAgICAgLCBjdXJzb3I6IFsxLCAwXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICcwJ1xuXG4gICAgICAgIGl0IFwiZGVsZXRlcyBtdWx0aXBsZSBjaGFyYWN0ZXJzIHdpdGggYSBjb3VudFwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnMiB4JywgdGV4dDogJ2FiY1xcbjAxMjNcXG5cXG54eXonLCBjdXJzb3I6IFsxLCAzXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICc0NSdcbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgICBlbnN1cmUgJzMgeCcsXG4gICAgICAgICAgICB0ZXh0OiAnYVxcbjAxMjNcXG5cXG54eXonXG4gICAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICdiYydcblxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIG11bHRpcGxlIGN1cnNvcnNcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJhYmNcXG4wMTIzNDVcXG5cXG54eXpcIlxuICAgICAgICAgICAgY3Vyc29yOiBbWzEsIDRdLCBbMCwgMV1dXG5cbiAgICAgICAgaXQgXCJpcyB1bmRvbmUgYXMgb25lIG9wZXJhdGlvblwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAneCcsIHRleHQ6IFwiYWNcXG4wMTIzNVxcblxcbnh5elwiXG4gICAgICAgICAgZW5zdXJlICd1JywgdGV4dDogJ2FiY1xcbjAxMjM0NVxcblxcbnh5eidcblxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIHZpbS1tb2RlLXBsdXMud3JhcExlZnRSaWdodE1vdGlvblwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHRleHQ6ICdhYmNcXG4wMTIzNDVcXG5cXG54eXonLCBjdXJzb3I6IFsxLCA0XVxuICAgICAgICAgIHNldHRpbmdzLnNldCgnd3JhcExlZnRSaWdodE1vdGlvbicsIHRydWUpXG5cbiAgICAgICAgaXQgXCJkZWxldGVzIGEgY2hhcmFjdGVyXCIsIC0+XG4gICAgICAgICAgIyBjb3B5IG9mIHRoZSBlYXJsaWVyIHRlc3QgYmVjYXVzZSB3cmFwTGVmdFJpZ2h0TW90aW9uIHNob3VsZCBub3QgYWZmZWN0IGl0XG4gICAgICAgICAgZW5zdXJlICd4JywgdGV4dDogJ2FiY1xcbjAxMjM1XFxuXFxueHl6JywgY3Vyc29yOiBbMSwgNF0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnNCdcbiAgICAgICAgICBlbnN1cmUgJ3gnLCB0ZXh0OiAnYWJjXFxuMDEyM1xcblxcbnh5eicgLCBjdXJzb3I6IFsxLCAzXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICc1J1xuICAgICAgICAgIGVuc3VyZSAneCcsIHRleHQ6ICdhYmNcXG4wMTJcXG5cXG54eXonICAsIGN1cnNvcjogWzEsIDJdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzMnXG4gICAgICAgICAgZW5zdXJlICd4JywgdGV4dDogJ2FiY1xcbjAxXFxuXFxueHl6JyAgICwgY3Vyc29yOiBbMSwgMV0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMidcbiAgICAgICAgICBlbnN1cmUgJ3gnLCB0ZXh0OiAnYWJjXFxuMFxcblxcbnh5eicgICAgLCBjdXJzb3I6IFsxLCAwXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICcxJ1xuICAgICAgICAgIGVuc3VyZSAneCcsIHRleHQ6ICdhYmNcXG5cXG5cXG54eXonICAgICAsIGN1cnNvcjogWzEsIDBdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzAnXG5cbiAgICAgICAgaXQgXCJkZWxldGVzIG11bHRpcGxlIGNoYXJhY3RlcnMgYW5kIG5ld2xpbmVzIHdpdGggYSBjb3VudFwiLCAtPlxuICAgICAgICAgIHNldHRpbmdzLnNldCgnd3JhcExlZnRSaWdodE1vdGlvbicsIHRydWUpXG4gICAgICAgICAgZW5zdXJlICcyIHgnLCB0ZXh0OiAnYWJjXFxuMDEyM1xcblxcbnh5eicsIGN1cnNvcjogWzEsIDNdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzQ1J1xuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAxXVxuICAgICAgICAgIGVuc3VyZSAnMyB4JywgdGV4dDogJ2EwMTIzXFxuXFxueHl6JywgY3Vyc29yOiBbMCwgMV0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnYmNcXG4nXG4gICAgICAgICAgZW5zdXJlICc3IHgnLCB0ZXh0OiAnYXl6JywgY3Vyc29yOiBbMCwgMV0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMDEyM1xcblxcbngnXG5cbiAgICBkZXNjcmliZSBcIm9uIGFuIGVtcHR5IGxpbmVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiYWJjXFxuMDEyMzQ1XFxuXFxueHl6XCIsIGN1cnNvcjogWzIsIDBdXG5cbiAgICAgIGl0IFwiZGVsZXRlcyBub3RoaW5nIG9uIGFuIGVtcHR5IGxpbmUgd2hlbiB2aW0tbW9kZS1wbHVzLndyYXBMZWZ0UmlnaHRNb3Rpb24gaXMgZmFsc2VcIiwgLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KCd3cmFwTGVmdFJpZ2h0TW90aW9uJywgZmFsc2UpXG4gICAgICAgIGVuc3VyZSAneCcsIHRleHQ6IFwiYWJjXFxuMDEyMzQ1XFxuXFxueHl6XCIsIGN1cnNvcjogWzIsIDBdXG5cbiAgICAgIGl0IFwiZGVsZXRlcyBhbiBlbXB0eSBsaW5lIHdoZW4gdmltLW1vZGUtcGx1cy53cmFwTGVmdFJpZ2h0TW90aW9uIGlzIHRydWVcIiwgLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KCd3cmFwTGVmdFJpZ2h0TW90aW9uJywgdHJ1ZSlcbiAgICAgICAgZW5zdXJlICd4JywgdGV4dDogXCJhYmNcXG4wMTIzNDVcXG54eXpcIiwgY3Vyc29yOiBbMiwgMF1cblxuICBkZXNjcmliZSBcInRoZSBYIGtleWJpbmRpbmdcIiwgLT5cbiAgICBkZXNjcmliZSBcIm9uIGEgbGluZSB3aXRoIGNvbnRlbnRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiYWJcXG4wMTIzNDVcIiwgY3Vyc29yOiBbMSwgMl1cblxuICAgICAgaXQgXCJkZWxldGVzIGEgY2hhcmFjdGVyXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnWCcsIHRleHQ6ICdhYlxcbjAyMzQ1JywgY3Vyc29yOiBbMSwgMV0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMSdcbiAgICAgICAgZW5zdXJlICdYJywgdGV4dDogJ2FiXFxuMjM0NScsIGN1cnNvcjogWzEsIDBdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzAnXG4gICAgICAgIGVuc3VyZSAnWCcsIHRleHQ6ICdhYlxcbjIzNDUnLCBjdXJzb3I6IFsxLCAwXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICcwJ1xuICAgICAgICBzZXR0aW5ncy5zZXQoJ3dyYXBMZWZ0UmlnaHRNb3Rpb24nLCB0cnVlKVxuICAgICAgICBlbnN1cmUgJ1gnLCB0ZXh0OiAnYWIyMzQ1JywgY3Vyc29yOiBbMCwgMl0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnXFxuJ1xuXG4gICAgZGVzY3JpYmUgXCJvbiBhbiBlbXB0eSBsaW5lXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiMDEyMzQ1XFxuXFxuYWJjZGVmXCJcbiAgICAgICAgICBjdXJzb3I6IFsxLCAwXVxuXG4gICAgICBpdCBcImRlbGV0ZXMgbm90aGluZyB3aGVuIHZpbS1tb2RlLXBsdXMud3JhcExlZnRSaWdodE1vdGlvbiBpcyBmYWxzZVwiLCAtPlxuICAgICAgICBzZXR0aW5ncy5zZXQoJ3dyYXBMZWZ0UmlnaHRNb3Rpb24nLCBmYWxzZSlcbiAgICAgICAgZW5zdXJlICdYJywgdGV4dDogXCIwMTIzNDVcXG5cXG5hYmNkZWZcIiwgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgaXQgXCJkZWxldGVzIHRoZSBuZXdsaW5lIHdoZW4gd3JhcExlZnRSaWdodE1vdGlvbiBpcyB0cnVlXCIsIC0+XG4gICAgICAgIHNldHRpbmdzLnNldCgnd3JhcExlZnRSaWdodE1vdGlvbicsIHRydWUpXG4gICAgICAgIGVuc3VyZSAnWCcsIHRleHQ6IFwiMDEyMzQ1XFxuYWJjZGVmXCIsIGN1cnNvcjogWzAsIDVdXG5cbiAgZGVzY3JpYmUgXCJ0aGUgZCBrZXliaW5kaW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIDEyMzQ1XG4gICAgICAgICAgYWJjZGVcblxuICAgICAgICAgIEFCQ0RFXFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGN1cnNvcjogWzEsIDFdXG5cbiAgICBpdCBcImVudGVycyBvcGVyYXRvci1wZW5kaW5nIG1vZGVcIiwgLT5cbiAgICAgIGVuc3VyZSAnZCcsIG1vZGU6ICdvcGVyYXRvci1wZW5kaW5nJ1xuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIGJ5IGEgZFwiLCAtPlxuICAgICAgaXQgXCJkZWxldGVzIHRoZSBjdXJyZW50IGxpbmUgYW5kIGV4aXRzIG9wZXJhdG9yLXBlbmRpbmcgbW9kZVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMV1cbiAgICAgICAgZW5zdXJlICdkIGQnLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMTIzNDVcblxuICAgICAgICAgICAgQUJDREVcXG5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiYWJjZGVcXG5cIlxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgIGl0IFwiZGVsZXRlcyB0aGUgbGFzdCBsaW5lIGFuZCBhbHdheXMgbWFrZSBub24tYmxhbmstbGluZSBsYXN0IGxpbmVcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGVuc3VyZSAnMiBkIGQnLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMTIzNDVcbiAgICAgICAgICAgIGFiY2RlXFxuXG4gICAgICAgICAgICBcIlwiXCIsXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgaXQgXCJsZWF2ZXMgdGhlIGN1cnNvciBvbiB0aGUgZmlyc3Qgbm9uYmxhbmsgY2hhcmFjdGVyXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIDEyMzQ1XG4gICAgICAgICAgICBhYmNkZVxcblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDRdXG4gICAgICAgIGVuc3VyZSAnZCBkJyxcbiAgICAgICAgICB0ZXh0OiBcIiAgYWJjZGVcXG5cIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDJdXG5cbiAgICBkZXNjcmliZSBcInVuZG8gYmVoYXZpb3JcIiwgLT5cbiAgICAgIG9yaWdpbmFsVGV4dCA9IFwiMTIzNDVcXG5hYmNkZVxcbkFCQ0RFXFxuUVdFUlRcIlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogb3JpZ2luYWxUZXh0LCBjdXJzb3I6IFsxLCAxXVxuXG4gICAgICBpdCBcInVuZG9lcyBib3RoIGxpbmVzXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnZCAyIGQgdScsIHRleHQ6IG9yaWdpbmFsVGV4dCwgc2VsZWN0ZWRUZXh0OiAnJ1xuXG4gICAgICBkZXNjcmliZSBcIndpdGggbXVsdGlwbGUgY3Vyc29yc1wiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogW1sxLCAxXSwgWzAsIDBdXVxuXG4gICAgICAgIGRlc2NyaWJlIFwic2V0Q3Vyc29yVG9TdGFydE9mQ2hhbmdlT25VbmRvUmVkbyBpcyB0cnVlKGRlZmF1bHQpXCIsIC0+XG4gICAgICAgICAgIyBbRklYTUVdIFNob3VsZCBrZWVwIGN1cnNvcj8uIHNvIGd1cmFudWxhcml0eSBpcyBub3QgcGVyZmVjdCBpbiBtdWx0aS1jdXJzb3JzXG4gICAgICAgICAgIyBBbmQgZW5zdXJlIHNldCBwb3NpdGlvbiB0byBzdGFydC5cbiAgICAgICAgICBpdCBcImlzIHVuZG9uZSBhcyBvbmUgb3BlcmF0aW9uIGFuZCBjbGVhciBjdXJzb3JzXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ2QgbCB1JyxcbiAgICAgICAgICAgICAgdGV4dDogb3JpZ2luYWxUZXh0XG4gICAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogWycnXVxuICAgICAgICAgICAgICBudW1DdXJzb3JzOiAxXG5cbiAgICAgICAgZGVzY3JpYmUgXCJzZXRDdXJzb3JUb1N0YXJ0T2ZDaGFuZ2VPblVuZG9SZWRvIGlzIGZhbHNlXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgc2V0dGluZ3Muc2V0KCdzZXRDdXJzb3JUb1N0YXJ0T2ZDaGFuZ2VPblVuZG9SZWRvJywgZmFsc2UpXG5cbiAgICAgICAgICBpdCBcImlzIHVuZG9uZSBhcyBvbmUgb3BlcmF0aW9uXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ2QgbCB1JyxcbiAgICAgICAgICAgICAgdGV4dDogb3JpZ2luYWxUZXh0XG4gICAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogWycnLCAnJ11cbiAgICAgICAgICAgICAgbnVtQ3Vyc29yczogMlxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIGJ5IGEgd1wiLCAtPlxuICAgICAgaXQgXCJkZWxldGVzIHRoZSBuZXh0IHdvcmQgdW50aWwgdGhlIGVuZCBvZiB0aGUgbGluZSBhbmQgZXhpdHMgb3BlcmF0b3ItcGVuZGluZyBtb2RlXCIsIC0+XG4gICAgICAgIHNldCB0ZXh0OiAnYWJjZCBlZmdcXG5hYmMnLCBjdXJzb3I6IFswLCA1XVxuICAgICAgICBlbnN1cmUgJ2QgdycsXG4gICAgICAgICAgdGV4dDogXCJhYmNkIFxcbmFiY1wiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgNF1cbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgICBpdCBcImRlbGV0ZXMgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbmV4dCB3b3JkXCIsIC0+XG4gICAgICAgIHNldCB0ZXh0OiAnYWJjZCBlZmcnLCBjdXJzb3I6IFswLCAyXVxuICAgICAgICBlbnN1cmUgJ2QgdycsIHRleHQ6ICdhYmVmZycsIGN1cnNvcjogWzAsIDJdXG4gICAgICAgIHNldCB0ZXh0OiAnb25lIHR3byB0aHJlZSBmb3VyJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdkIDMgdycsIHRleHQ6ICdmb3VyJywgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwid2hlbiBmb2xsb3dlZCBieSBhbiBpd1wiLCAtPlxuICAgICAgaXQgXCJkZWxldGVzIHRoZSBjb250YWluaW5nIHdvcmRcIiwgLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiMTIzNDUgYWJjZGUgQUJDREVcIiwgY3Vyc29yOiBbMCwgOV1cblxuICAgICAgICBlbnN1cmUgJ2QnLFxuICAgICAgICAgIG1vZGU6ICdvcGVyYXRvci1wZW5kaW5nJ1xuXG4gICAgICAgIGVuc3VyZSAnaSB3JyxcbiAgICAgICAgICB0ZXh0OiBcIjEyMzQ1ICBBQkNERVwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgNl1cbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogJ2FiY2RlJ1xuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICBkZXNjcmliZSBcIndoZW4gZm9sbG93ZWQgYnkgYSBqXCIsIC0+XG4gICAgICBvcmlnaW5hbFRleHQgPSBcIlwiXCJcbiAgICAgICAgMTIzNDVcbiAgICAgICAgYWJjZGVcbiAgICAgICAgQUJDREVcXG5cbiAgICAgICAgXCJcIlwiXG5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IG9yaWdpbmFsVGV4dFxuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGZpbGVcIiwgLT5cbiAgICAgICAgaXQgXCJkZWxldGVzIHRoZSBuZXh0IHR3byBsaW5lc1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIGVuc3VyZSAnZCBqJywgdGV4dDogJ0FCQ0RFXFxuJ1xuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBtaWRkbGUgb2Ygc2Vjb25kIGxpbmVcIiwgLT5cbiAgICAgICAgaXQgXCJkZWxldGVzIHRoZSBsYXN0IHR3byBsaW5lc1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAyXVxuICAgICAgICAgIGVuc3VyZSAnZCBqJywgdGV4dDogJzEyMzQ1XFxuJ1xuXG4gICAgICBkZXNjcmliZSBcIndoZW4gY3Vyc29yIGlzIG9uIGJsYW5rIGxpbmVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIGFcblxuXG4gICAgICAgICAgICAgIGJcXG5cbiAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBpdCBcImRlbGV0ZXMgYm90aCBsaW5lc1wiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnZCBqJywgdGV4dDogXCJhXFxuYlxcblwiLCBjdXJzb3I6IFsxLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIGJ5IGFuIGtcIiwgLT5cbiAgICAgIG9yaWdpbmFsVGV4dCA9IFwiXCJcIlxuICAgICAgICAxMjM0NVxuICAgICAgICBhYmNkZVxuICAgICAgICBBQkNERVxuICAgICAgICBcIlwiXCJcblxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogb3JpZ2luYWxUZXh0XG5cbiAgICAgIGRlc2NyaWJlIFwib24gdGhlIGVuZCBvZiB0aGUgZmlsZVwiLCAtPlxuICAgICAgICBpdCBcImRlbGV0ZXMgdGhlIGJvdHRvbSB0d28gbGluZXNcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMiwgNF1cbiAgICAgICAgICBlbnN1cmUgJ2QgaycsIHRleHQ6ICcxMjM0NVxcbidcblxuICAgICAgZGVzY3JpYmUgXCJvbiB0aGUgYmVnaW5uaW5nIG9mIHRoZSBmaWxlXCIsIC0+XG4gICAgICAgIHhpdCBcImRlbGV0ZXMgbm90aGluZ1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIGVuc3VyZSAnZCBrJywgdGV4dDogb3JpZ2luYWxUZXh0XG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBvbiB0aGUgbWlkZGxlIG9mIHNlY29uZCBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgZmlyc3QgdHdvIGxpbmVzXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDJdXG4gICAgICAgICAgZW5zdXJlICdkIGsnLCB0ZXh0OiAnQUJDREUnXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgb24gYmxhbmsgbGluZVwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgICAgYVxuXG5cbiAgICAgICAgICAgICAgYlxcblxuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGl0IFwiZGVsZXRlcyBib3RoIGxpbmVzXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdkIGsnLCB0ZXh0OiBcImFcXG5iXFxuXCIsIGN1cnNvcjogWzEsIDBdXG5cbiAgICAgICMgW1RPRE9dIHdyaXRlIG1vcmUgZ2VuZXJpYyBvcGVyYXRvciB0ZXN0LiAjMTE5XG4gICAgICAjIFRoaXMgaXMgZ2VuZXJhbCBiZWhhdmlvciBvZiBhbGwgb3BlcmF0b3IuXG4gICAgICAjIFdoZW4gaXQgY2FudCBtb3ZlLCBpdHMgdGFyZ2V0IHNlbGVjdGlvbiBzaG91bGQgYmUgZW1wdHkgc28gbm90aGluZyBoYXBwZW4uXG4gICAgICB4ZGVzY3JpYmUgXCJ3aGVuIGl0IGNhbid0IG1vdmVcIiwgLT5cbiAgICAgICAgdGV4dE9yaWdpbmFsID0gXCJhXFxuYlxcblwiXG4gICAgICAgIGN1cnNvck9yaWdpbmFsID0gWzAsIDBdXG4gICAgICAgIGl0IFwiZGVsZXRlcyBkZWxldGUgbm90aGluZ1wiLCAtPlxuICAgICAgICAgIHNldCB0ZXh0OiB0ZXh0T3JpZ2luYWwsIGN1cnNvcjogY3Vyc29yT3JpZ2luYWxcbiAgICAgICAgICBlbnN1cmUgJ2QgaycsIHRleHQ6IHRleHRPcmlnaW5hbCwgY3Vyc29yOiBjdXJzb3JPcmlnaW5hbFxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIGJ5IGEgR1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBvcmlnaW5hbFRleHQgPSBcIjEyMzQ1XFxuYWJjZGVcXG5BQkNERVwiXG4gICAgICAgIHNldCB0ZXh0OiBvcmlnaW5hbFRleHRcblxuICAgICAgZGVzY3JpYmUgXCJvbiB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzZWNvbmQgbGluZVwiLCAtPlxuICAgICAgICBpdCBcImRlbGV0ZXMgdGhlIGJvdHRvbSB0d28gbGluZXNcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICBlbnN1cmUgJ2QgRycsIHRleHQ6ICcxMjM0NVxcbidcblxuICAgICAgZGVzY3JpYmUgXCJvbiB0aGUgbWlkZGxlIG9mIHRoZSBzZWNvbmQgbGluZVwiLCAtPlxuICAgICAgICBpdCBcImRlbGV0ZXMgdGhlIGJvdHRvbSB0d28gbGluZXNcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgICBlbnN1cmUgJ2QgRycsIHRleHQ6ICcxMjM0NVxcbidcblxuICAgIGRlc2NyaWJlIFwid2hlbiBmb2xsb3dlZCBieSBhIGdvdG8gbGluZSBHXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIG9yaWdpbmFsVGV4dCA9IFwiMTIzNDVcXG5hYmNkZVxcbkFCQ0RFXCJcbiAgICAgICAgc2V0IHRleHQ6IG9yaWdpbmFsVGV4dFxuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNlY29uZCBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgYm90dG9tIHR3byBsaW5lc1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnZCAyIEcnLCB0ZXh0OiAnMTIzNDVcXG5BQkNERSdcblxuICAgICAgZGVzY3JpYmUgXCJvbiB0aGUgbWlkZGxlIG9mIHRoZSBzZWNvbmQgbGluZVwiLCAtPlxuICAgICAgICBpdCBcImRlbGV0ZXMgdGhlIGJvdHRvbSB0d28gbGluZXNcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgICBlbnN1cmUgJ2QgMiBHJywgdGV4dDogJzEyMzQ1XFxuQUJDREUnXG5cbiAgICBkZXNjcmliZSBcIndoZW4gZm9sbG93ZWQgYnkgYSB0KVwiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIHRoZSBlbnRpcmUgbGluZSB5YW5rZWQgYmVmb3JlXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXQgdGV4dDogXCJ0ZXN0ICh4eXopXCIsIGN1cnNvcjogWzAsIDZdXG5cbiAgICAgICAgaXQgXCJkZWxldGVzIHVudGlsIHRoZSBjbG9zaW5nIHBhcmVudGhlc2lzXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFsnZCB0JywgaW5wdXQ6ICcpJ10sXG4gICAgICAgICAgICB0ZXh0OiAndGVzdCAoKSdcbiAgICAgICAgICAgIGN1cnNvcjogWzAsIDZdXG5cbiAgICBkZXNjcmliZSBcIndpdGggbXVsdGlwbGUgY3Vyc29yc1wiLCAtPlxuICAgICAgaXQgXCJkZWxldGVzIGVhY2ggc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgYWJjZFxuICAgICAgICAgICAgMTIzNFxuICAgICAgICAgICAgQUJDRFxcblxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yQnVmZmVyOiBbWzAsIDFdLCBbMSwgMl0sIFsyLCAzXV1cblxuICAgICAgICBlbnN1cmUgJ2QgZScsXG4gICAgICAgICAgdGV4dDogXCJhXFxuMTJcXG5BQkNcIlxuICAgICAgICAgIGN1cnNvckJ1ZmZlcjogW1swLCAwXSwgWzEsIDFdLCBbMiwgMl1dXG5cbiAgICAgIGl0IFwiZG9lc24ndCBkZWxldGUgZW1wdHkgc2VsZWN0aW9uc1wiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcImFiY2RcXG5hYmNcXG5hYmRcIlxuICAgICAgICAgIGN1cnNvckJ1ZmZlcjogW1swLCAwXSwgWzEsIDBdLCBbMiwgMF1dXG5cbiAgICAgICAgZW5zdXJlIFsnZCB0JywgaW5wdXQ6ICdkJ10sXG4gICAgICAgICAgdGV4dDogXCJkXFxuYWJjXFxuZFwiXG4gICAgICAgICAgY3Vyc29yQnVmZmVyOiBbWzAsIDBdLCBbMSwgMF0sIFsyLCAwXV1cblxuICAgIGRlc2NyaWJlIFwic3RheU9uRGVsZXRlIHNldHRpbmdcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KCdzdGF5T25EZWxldGUnLCB0cnVlKVxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0XzogXCJcIlwiXG4gICAgICAgICAgX19fMzMzM1xuICAgICAgICAgIF9fMjIyMlxuICAgICAgICAgIF8xMTExXG4gICAgICAgICAgX18yMjIyXG4gICAgICAgICAgX19fMzMzM1xcblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDNdXG4gICAgICAgICAgIyBcIl9fXzMzMzNcXG5fXzIyMjJcXG4xMTExXFxuX18yMjIyXFxuX19fMzMzM1wiXG5cbiAgICAgIGRlc2NyaWJlIFwidGFyZ2V0IHJhbmdlIGlzIGxpbmV3aXNlIHJhbmdlXCIsIC0+XG4gICAgICAgIGl0IFwia2VlcCBvcmlnaW5hbCBjb2x1bW4gYWZ0ZXIgZGVsZXRlXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFwiZCBkXCIsIGN1cnNvcjogWzAsIDNdLCB0ZXh0XzogXCJfXzIyMjJcXG5fMTExMVxcbl9fMjIyMlxcbl9fXzMzMzNcXG5cIlxuICAgICAgICAgIGVuc3VyZSBcIi5cIiwgY3Vyc29yOiBbMCwgM10sIHRleHRfOiBcIl8xMTExXFxuX18yMjIyXFxuX19fMzMzM1xcblwiXG4gICAgICAgICAgZW5zdXJlIFwiLlwiLCBjdXJzb3I6IFswLCAzXSwgdGV4dF86IFwiX18yMjIyXFxuX19fMzMzM1xcblwiXG4gICAgICAgICAgZW5zdXJlIFwiLlwiLCBjdXJzb3I6IFswLCAzXSwgdGV4dF86IFwiX19fMzMzM1xcblwiXG5cbiAgICAgICAgaXQgXCJ2X0QgYWxzbyBrZWVwIG9yaWdpbmFsIGNvbHVtbiBhZnRlciBkZWxldGVcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgXCJ2IDIgaiBEXCIsIGN1cnNvcjogWzAsIDNdLCB0ZXh0XzogXCJfXzIyMjJcXG5fX18zMzMzXFxuXCJcblxuICAgICAgZGVzY3JpYmUgXCJ0YXJnZXQgcmFuZ2UgaXMgdGV4dCBvYmplY3RcIiwgLT5cbiAgICAgICAgZGVzY3JpYmUgXCJ0YXJnZXQgaXMgaW5kZW50XCIsIC0+XG4gICAgICAgICAgaW5kZW50VGV4dCA9IFwiXCJcIlxuICAgICAgICAgIDAwMDAwMDAwMDAwMDAwMDBcbiAgICAgICAgICAgIDIyMjIyMjIyMjIyMjIyXG4gICAgICAgICAgICAyMjIyMjIyMjIyMjIyMlxuICAgICAgICAgICAgMjIyMjIyMjIyMjIyMjJcbiAgICAgICAgICAwMDAwMDAwMDAwMDAwMDAwXFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgdGV4dERhdGEgPSBuZXcgVGV4dERhdGEoaW5kZW50VGV4dClcbiAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICBzZXRcbiAgICAgICAgICAgICAgdGV4dDogdGV4dERhdGEuZ2V0UmF3KClcblxuICAgICAgICAgIGl0IFwiW2Zyb20gdG9wXSBrZWVwIGNvbHVtblwiLCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDEwXVxuICAgICAgICAgICAgZW5zdXJlICdkIGkgaScsIGN1cnNvcjogWzEsIDEwXSwgdGV4dDogdGV4dERhdGEuZ2V0TGluZXMoWzAsIDRdKVxuICAgICAgICAgIGl0IFwiW2Zyb20gbWlkZGxlXSBrZWVwIGNvbHVtblwiLCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvcjogWzIsIDEwXVxuICAgICAgICAgICAgZW5zdXJlICdkIGkgaScsIGN1cnNvcjogWzEsIDEwXSwgdGV4dDogdGV4dERhdGEuZ2V0TGluZXMoWzAsIDRdKVxuICAgICAgICAgIGl0IFwiW2Zyb20gYm90dG9tXSBrZWVwIGNvbHVtblwiLCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvcjogWzMsIDEwXVxuICAgICAgICAgICAgZW5zdXJlICdkIGkgaScsIGN1cnNvcjogWzEsIDEwXSwgdGV4dDogdGV4dERhdGEuZ2V0TGluZXMoWzAsIDRdKVxuXG4gICAgICAgIGRlc2NyaWJlIFwidGFyZ2V0IGlzIHBhcmFncmFwaFwiLCAtPlxuICAgICAgICAgIHBhcmFncmFwaFRleHQgPSBcIlwiXCJcbiAgICAgICAgICAgIHAxLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICAgICBwMS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgcDEtLS0tLS0tLS0tLS0tLS1cblxuICAgICAgICAgICAgcDItLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICAgIHAyLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICAgICBwMi0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICAgICAgICBwMy0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgcDMtLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICAgIHAzLS0tLS0tLS0tLS0tLS0tXFxuXG4gICAgICAgICAgICBcIlwiXCJcblxuICAgICAgICAgIHRleHREYXRhID0gbmV3IFRleHREYXRhKHBhcmFncmFwaFRleHQpXG4gICAgICAgICAgUDEgPSBbMCwgMSwgMl1cbiAgICAgICAgICBCMSA9IDNcbiAgICAgICAgICBQMiA9IFs0LCA1LCA2XVxuICAgICAgICAgIEIyID0gN1xuICAgICAgICAgIFAzID0gWzgsIDksIDEwXVxuICAgICAgICAgIEIzID0gMTFcblxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIHNldFxuICAgICAgICAgICAgICB0ZXh0OiB0ZXh0RGF0YS5nZXRSYXcoKVxuXG4gICAgICAgICAgaXQgXCJzZXQgY3Vyc29yIHRvIHN0YXJ0IG9mIGRlbGV0aW9uIGFmdGVyIGRlbGV0ZSBbZnJvbSBib3R0b20gb2YgcGFyYWdyYXBoXVwiLCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJ2QgaSBwJywgY3Vyc29yOiBbMCwgMF0sIHRleHQ6IHRleHREYXRhLmdldExpbmVzKFtCMS4uQjNdLCBjaG9tcDogdHJ1ZSlcbiAgICAgICAgICAgIGVuc3VyZSAnaiAuJywgY3Vyc29yOiBbMSwgMF0sIHRleHQ6IHRleHREYXRhLmdldExpbmVzKFtCMSwgQjIsIFAzLi4uLCBCM10sIGNob21wOiB0cnVlKVxuICAgICAgICAgICAgZW5zdXJlICdqIC4nLCBjdXJzb3I6IFsxLCAwXSwgdGV4dDogdGV4dERhdGEuZ2V0TGluZXMoW0IxLCBCMiwgQjNdLCBjaG9tcDogdHJ1ZSlcbiAgICAgICAgICBpdCBcInNldCBjdXJzb3IgdG8gc3RhcnQgb2YgZGVsZXRpb24gYWZ0ZXIgZGVsZXRlIFtmcm9tIG1pZGRsZSBvZiBwYXJhZ3JhcGhdXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICAgIGVuc3VyZSAnZCBpIHAnLCBjdXJzb3I6IFswLCAwXSwgdGV4dDogdGV4dERhdGEuZ2V0TGluZXMoW0IxLi5CM10sIGNob21wOiB0cnVlKVxuICAgICAgICAgICAgZW5zdXJlICcyIGogLicsIGN1cnNvcjogWzEsIDBdLCB0ZXh0OiB0ZXh0RGF0YS5nZXRMaW5lcyhbQjEsIEIyLCBQMy4uLiwgQjNdLCBjaG9tcDogdHJ1ZSlcbiAgICAgICAgICAgIGVuc3VyZSAnMiBqIC4nLCBjdXJzb3I6IFsxLCAwXSwgdGV4dDogdGV4dERhdGEuZ2V0TGluZXMoW0IxLCBCMiwgQjNdLCBjaG9tcDogdHJ1ZSlcbiAgICAgICAgICBpdCBcInNldCBjdXJzb3IgdG8gc3RhcnQgb2YgZGVsZXRpb24gYWZ0ZXIgZGVsZXRlIFtmcm9tIGJvdHRvbSBvZiBwYXJhZ3JhcGhdXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICAgIGVuc3VyZSAnZCBpIHAnLCBjdXJzb3I6IFswLCAwXSwgdGV4dDogdGV4dERhdGEuZ2V0TGluZXMoW0IxLi5CM10sIGNob21wOiB0cnVlKVxuICAgICAgICAgICAgZW5zdXJlICczIGogLicsIGN1cnNvcjogWzEsIDBdLCB0ZXh0OiB0ZXh0RGF0YS5nZXRMaW5lcyhbQjEsIEIyLCBQMy4uLiwgQjNdLCBjaG9tcDogdHJ1ZSlcbiAgICAgICAgICAgIGVuc3VyZSAnMyBqIC4nLCBjdXJzb3I6IFsxLCAwXSwgdGV4dDogdGV4dERhdGEuZ2V0TGluZXMoW0IxLCBCMiwgQjNdLCBjaG9tcDogdHJ1ZSlcblxuXG4gIGRlc2NyaWJlIFwidGhlIEQga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgMDAwMFxuICAgICAgICAxMTExXG4gICAgICAgIDIyMjJcbiAgICAgICAgMzMzM1xuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMV1cblxuICAgIGl0IFwiZGVsZXRlcyB0aGUgY29udGVudHMgdW50aWwgdGhlIGVuZCBvZiB0aGUgbGluZVwiLCAtPlxuICAgICAgZW5zdXJlICdEJywgdGV4dDogXCIwXFxuMTExMVxcbjIyMjJcXG4zMzMzXCJcblxuICAgIGl0IFwiaW4gdmlzdWFsLW1vZGUsIGl0IGRlbGV0ZSB3aG9sZSBsaW5lXCIsIC0+XG4gICAgICBlbnN1cmUgJ3YgRCcsIHRleHQ6IFwiMTExMVxcbjIyMjJcXG4zMzMzXCJcbiAgICAgIGVuc3VyZSBcInYgaiBEXCIsIHRleHQ6IFwiMzMzM1wiXG5cbiAgZGVzY3JpYmUgXCJ0aGUgeSBrZXliaW5kaW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0IHRleHQ6IFwiMDEyIDM0NVxcbmFiY1xcblwiLCBjdXJzb3I6IFswLCA0XVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHNlbGVjdGVkIGxpbmVzIGluIHZpc3VhbCBsaW5ld2lzZSBtb2RlXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGtleXN0cm9rZSAnViBqIHknXG5cbiAgICAgIGl0IFwiaXMgaW4gbGluZXdpc2UgbW90aW9uXCIsIC0+XG4gICAgICAgIGVuc3VyZSByZWdpc3RlcjogJ1wiJzogdHlwZTogJ2xpbmV3aXNlJ1xuXG4gICAgICBpdCBcInNhdmVzIHRoZSBsaW5lcyB0byB0aGUgZGVmYXVsdCByZWdpc3RlclwiLCAtPlxuICAgICAgICBlbnN1cmUgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiMDEyIDM0NVxcbmFiY1xcblwiXG5cbiAgICAgIGl0IFwicGxhY2VzIHRoZSBjdXJzb3IgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIGVuc3VyZSBjdXJzb3JCdWZmZXI6IFswLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIGJ5IGEgc2Vjb25kIHkgXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGtleXN0cm9rZSAneSB5J1xuXG4gICAgICBpdCBcInNhdmVzIHRoZSBsaW5lIHRvIHRoZSBkZWZhdWx0IHJlZ2lzdGVyXCIsIC0+XG4gICAgICAgIGVuc3VyZSByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIwMTIgMzQ1XFxuXCJcblxuICAgICAgaXQgXCJsZWF2ZXMgdGhlIGN1cnNvciBhdCB0aGUgc3RhcnRpbmcgcG9zaXRpb25cIiwgLT5cbiAgICAgICAgZW5zdXJlIGN1cnNvcjogWzAsIDRdXG5cbiAgICBkZXNjcmliZSBcIndoZW4gdXNlQ2xpcGJvYXJkQXNEZWZhdWx0UmVnaXN0ZXIgZW5hYmxlZFwiLCAtPlxuICAgICAgaXQgXCJ3cml0ZXMgdG8gY2xpcGJvYXJkXCIsIC0+XG4gICAgICAgIHNldHRpbmdzLnNldCAndXNlQ2xpcGJvYXJkQXNEZWZhdWx0UmVnaXN0ZXInLCB0cnVlXG4gICAgICAgIGtleXN0cm9rZSAneSB5J1xuICAgICAgICBleHBlY3QoYXRvbS5jbGlwYm9hcmQucmVhZCgpKS50b0JlICcwMTIgMzQ1XFxuJ1xuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIHdpdGggYSByZXBlYXRlZCB5XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGtleXN0cm9rZSAneSAyIHknXG5cbiAgICAgIGl0IFwiY29waWVzIG4gbGluZXMsIHN0YXJ0aW5nIGZyb20gdGhlIGN1cnJlbnRcIiwgLT5cbiAgICAgICAgZW5zdXJlIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcIjAxMiAzNDVcXG5hYmNcXG5cIlxuXG4gICAgICBpdCBcImxlYXZlcyB0aGUgY3Vyc29yIGF0IHRoZSBzdGFydGluZyBwb3NpdGlvblwiLCAtPlxuICAgICAgICBlbnN1cmUgY3Vyc29yOiBbMCwgNF1cblxuICAgIGRlc2NyaWJlIFwid2l0aCBhIHJlZ2lzdGVyXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGtleXN0cm9rZSBbJ1wiJywgaW5wdXQ6ICdhJywgJ3kgeSddXG5cbiAgICAgIGl0IFwic2F2ZXMgdGhlIGxpbmUgdG8gdGhlIGEgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgZW5zdXJlIHJlZ2lzdGVyOiBhOiB0ZXh0OiBcIjAxMiAzNDVcXG5cIlxuXG4gICAgICBpdCBcImFwcGVuZHMgdGhlIGxpbmUgdG8gdGhlIEEgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgZW5zdXJlIFsnXCInLCBpbnB1dDogJ0EnLCAneSB5J10sXG4gICAgICAgICAgcmVnaXN0ZXI6IGE6IHRleHQ6IFwiMDEyIDM0NVxcbjAxMiAzNDVcXG5cIlxuXG4gICAgZGVzY3JpYmUgXCJ3aXRoIGEgZm9yd2FyZCBtb3Rpb25cIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAga2V5c3Ryb2tlICd5IGUnXG5cbiAgICAgIGl0IFwic2F2ZXMgdGhlIHNlbGVjdGVkIHRleHQgdG8gdGhlIGRlZmF1bHQgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgZW5zdXJlIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMzQ1J1xuXG4gICAgICBpdCBcImxlYXZlcyB0aGUgY3Vyc29yIGF0IHRoZSBzdGFydGluZyBwb3NpdGlvblwiLCAtPlxuICAgICAgICBlbnN1cmUgY3Vyc29yOiBbMCwgNF1cblxuICAgICAgaXQgXCJkb2VzIG5vdCB5YW5rIHdoZW4gbW90aW9uIGZhaWxzXCIsIC0+XG4gICAgICAgIGVuc3VyZSBbJ3kgdCcsIGlucHV0OiAneCddLFxuICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMzQ1J1xuXG4gICAgZGVzY3JpYmUgXCJ3aXRoIGEgdGV4dCBvYmplY3RcIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSB0ZXh0IG9iamVjdFwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yQnVmZmVyOiBbMCwgNV1cbiAgICAgICAgZW5zdXJlICd5IGkgdycsIGN1cnNvckJ1ZmZlcjogWzAsIDRdXG5cbiAgICBkZXNjcmliZSBcIndpdGggYSBsZWZ0IG1vdGlvblwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBrZXlzdHJva2UgJ3kgaCdcblxuICAgICAgaXQgXCJzYXZlcyB0aGUgbGVmdCBsZXR0ZXIgdG8gdGhlIGRlZmF1bHQgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgZW5zdXJlIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnICdcblxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHBvc2l0aW9uIHRvIHRoZSBsZWZ0XCIsIC0+XG4gICAgICAgIGVuc3VyZSBjdXJzb3I6IFswLCAzXVxuXG4gICAgZGVzY3JpYmUgXCJ3aXRoIGEgZG93biBtb3Rpb25cIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAga2V5c3Ryb2tlICd5IGonXG5cbiAgICAgIGl0IFwic2F2ZXMgYm90aCBmdWxsIGxpbmVzIHRvIHRoZSBkZWZhdWx0IHJlZ2lzdGVyXCIsIC0+XG4gICAgICAgIGVuc3VyZSByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIwMTIgMzQ1XFxuYWJjXFxuXCJcblxuICAgICAgaXQgXCJsZWF2ZXMgdGhlIGN1cnNvciBhdCB0aGUgc3RhcnRpbmcgcG9zaXRpb25cIiwgLT5cbiAgICAgICAgZW5zdXJlIGN1cnNvcjogWzAsIDRdXG5cbiAgICBkZXNjcmliZSBcIndoZW4gZm9sbG93ZWQgYnkgYSBHXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIG9yaWdpbmFsVGV4dCA9IFwiMTIzNDVcXG5hYmNkZVxcbkFCQ0RFXCJcbiAgICAgICAgc2V0IHRleHQ6IG9yaWdpbmFsVGV4dFxuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNlY29uZCBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgYm90dG9tIHR3byBsaW5lc1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAneSBHIFAnLCB0ZXh0OiAnMTIzNDVcXG5hYmNkZVxcbkFCQ0RFXFxuYWJjZGVcXG5BQkNERSdcblxuICAgICAgZGVzY3JpYmUgXCJvbiB0aGUgbWlkZGxlIG9mIHRoZSBzZWNvbmQgbGluZVwiLCAtPlxuICAgICAgICBpdCBcImRlbGV0ZXMgdGhlIGJvdHRvbSB0d28gbGluZXNcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgICBlbnN1cmUgJ3kgRyBQJywgdGV4dDogJzEyMzQ1XFxuYWJjZGVcXG5BQkNERVxcbmFiY2RlXFxuQUJDREUnXG5cbiAgICBkZXNjcmliZSBcIndoZW4gZm9sbG93ZWQgYnkgYSBnb3RvIGxpbmUgR1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBvcmlnaW5hbFRleHQgPSBcIjEyMzQ1XFxuYWJjZGVcXG5BQkNERVwiXG4gICAgICAgIHNldCB0ZXh0OiBvcmlnaW5hbFRleHRcblxuICAgICAgZGVzY3JpYmUgXCJvbiB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzZWNvbmQgbGluZVwiLCAtPlxuICAgICAgICBpdCBcImRlbGV0ZXMgdGhlIGJvdHRvbSB0d28gbGluZXNcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICBlbnN1cmUgJ3kgMiBHIFAnLCB0ZXh0OiAnMTIzNDVcXG5hYmNkZVxcbmFiY2RlXFxuQUJDREUnXG5cbiAgICAgIGRlc2NyaWJlIFwib24gdGhlIG1pZGRsZSBvZiB0aGUgc2Vjb25kIGxpbmVcIiwgLT5cbiAgICAgICAgaXQgXCJkZWxldGVzIHRoZSBib3R0b20gdHdvIGxpbmVzXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDJdXG4gICAgICAgICAgZW5zdXJlICd5IDIgRyBQJywgdGV4dDogJzEyMzQ1XFxuYWJjZGVcXG5hYmNkZVxcbkFCQ0RFJ1xuXG4gICAgZGVzY3JpYmUgXCJ3aXRoIG11bHRpcGxlIGN1cnNvcnNcIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgZWFjaCBjdXJzb3IgYW5kIGNvcGllcyB0aGUgbGFzdCBzZWxlY3Rpb24ncyB0ZXh0XCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiICBhYmNkXFxuICAxMjM0XCJcbiAgICAgICAgICBjdXJzb3JCdWZmZXI6IFtbMCwgMF0sIFsxLCA1XV1cbiAgICAgICAgZW5zdXJlICd5IF4nLFxuICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMTIzJ1xuICAgICAgICAgIGN1cnNvckJ1ZmZlcjogW1swLCAwXSwgWzEsIDJdXVxuXG4gICAgZGVzY3JpYmUgXCJzdGF5T25ZYW5rIHNldHRpbmdcIiwgLT5cbiAgICAgIHRleHQgPSBudWxsXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldHRpbmdzLnNldCgnc3RheU9uWWFuaycsIHRydWUpXG5cbiAgICAgICAgdGV4dCA9IG5ldyBUZXh0RGF0YSBcIlwiXCJcbiAgICAgICAgICAwXzIzNDU2N1xuICAgICAgICAgIDFfMjM0NTY3XG4gICAgICAgICAgMl8yMzQ1NjdcblxuICAgICAgICAgIDRfMjM0NTY3XFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHNldCB0ZXh0OiB0ZXh0LmdldFJhdygpLCBjdXJzb3I6IFsxLCAyXVxuXG4gICAgICBpdCBcImRvbid0IG1vdmUgY3Vyc29yIGFmdGVyIHlhbmsgZnJvbSBub3JtYWwtbW9kZVwiLCAtPlxuICAgICAgICBlbnN1cmUgXCJ5IGkgcFwiLCBjdXJzb3JCdWZmZXI6IFsxLCAyXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IHRleHQuZ2V0TGluZXMoWzAuLjJdKVxuICAgICAgICBlbnN1cmUgXCJqIHkgeVwiLCBjdXJzb3JCdWZmZXI6IFsyLCAyXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IHRleHQuZ2V0TGluZXMoWzJdKVxuICAgICAgICBlbnN1cmUgXCJrIC5cIiwgY3Vyc29yQnVmZmVyOiBbMSwgMl0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiB0ZXh0LmdldExpbmVzKFsxXSlcblxuICAgICAgaXQgXCJkb24ndCBtb3ZlIGN1cnNvciBhZnRlciB5YW5rIGZyb20gdmlzdWFsLWxpbmV3aXNlXCIsIC0+XG4gICAgICAgIGVuc3VyZSBcIlYgeVwiLCBjdXJzb3JCdWZmZXI6IFsxLCAyXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IHRleHQuZ2V0TGluZXMoWzFdKVxuICAgICAgICBlbnN1cmUgXCJWIGogeVwiLCBjdXJzb3JCdWZmZXI6IFsyLCAyXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IHRleHQuZ2V0TGluZXMoWzEuLjJdKVxuXG4gICAgICBpdCBcImRvbid0IG1vdmUgY3Vyc29yIGFmdGVyIHlhbmsgZnJvbSB2aXN1YWwtY2hhcmFjdGVyd2lzZVwiLCAtPlxuICAgICAgICBlbnN1cmUgXCJ2IGwgbCB5XCIsIGN1cnNvckJ1ZmZlcjogWzEsIDRdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIyMzRcIlxuICAgICAgICBlbnN1cmUgXCJ2IGggaCB5XCIsIGN1cnNvckJ1ZmZlcjogWzEsIDJdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIyMzRcIlxuICAgICAgICBlbnN1cmUgXCJ2IGogeVwiLCBjdXJzb3JCdWZmZXI6IFsyLCAyXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiMjM0NTY3XFxuMl8yXCJcbiAgICAgICAgZW5zdXJlIFwidiAyIGsgeVwiLCBjdXJzb3JCdWZmZXI6IFswLCAyXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiMjM0NTY3XFxuMV8yMzQ1NjdcXG4yXzJcIlxuXG4gIGRlc2NyaWJlIFwidGhlIHl5IGtleWJpbmRpbmdcIiwgLT5cbiAgICBkZXNjcmliZSBcIm9uIGEgc2luZ2xlIGxpbmUgZmlsZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogXCJleGNsYW1hdGlvbiFcXG5cIiwgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgaXQgXCJjb3BpZXMgdGhlIGVudGlyZSBsaW5lIGFuZCBwYXN0ZXMgaXQgY29ycmVjdGx5XCIsIC0+XG4gICAgICAgIGVuc3VyZSAneSB5IHAnLFxuICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcImV4Y2xhbWF0aW9uIVxcblwiXG4gICAgICAgICAgdGV4dDogXCJleGNsYW1hdGlvbiFcXG5leGNsYW1hdGlvbiFcXG5cIlxuXG4gICAgZGVzY3JpYmUgXCJvbiBhIHNpbmdsZSBsaW5lIGZpbGUgd2l0aCBubyBuZXdsaW5lXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIm5vIG5ld2xpbmUhXCIsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGl0IFwiY29waWVzIHRoZSBlbnRpcmUgbGluZSBhbmQgcGFzdGVzIGl0IGNvcnJlY3RseVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3kgeSBwJyxcbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogXCJubyBuZXdsaW5lIVxcblwiXG4gICAgICAgICAgdGV4dDogXCJubyBuZXdsaW5lIVxcbm5vIG5ld2xpbmUhXCJcblxuICAgICAgaXQgXCJjb3BpZXMgdGhlIGVudGlyZSBsaW5lIGFuZCBwYXN0ZXMgaXQgcmVzcGVjdGluZyBjb3VudCBhbmQgbmV3IGxpbmVzXCIsIC0+XG4gICAgICAgIGVuc3VyZSAneSB5IDIgcCcsXG4gICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwibm8gbmV3bGluZSFcXG5cIlxuICAgICAgICAgIHRleHQ6IFwibm8gbmV3bGluZSFcXG5ubyBuZXdsaW5lIVxcbm5vIG5ld2xpbmUhXCJcblxuICBkZXNjcmliZSBcInRoZSBZIGtleWJpbmRpbmdcIiwgLT5cbiAgICB0ZXh0ID0gXCJcIlwiXG4gICAgMDEyIDM0NVxuICAgIGFiY1xcblxuICAgIFwiXCJcIlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiB0ZXh0XG4gICAgICAgIGN1cnNvcjogWzAsIDRdXG5cbiAgICBpdCBcInNhdmVzIHRoZSBsaW5lIHRvIHRoZSBkZWZhdWx0IHJlZ2lzdGVyXCIsIC0+XG4gICAgICBlbnN1cmUgJ1knLCBjdXJzb3I6IFswLCA0XSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiMDEyIDM0NVxcblwiXG5cbiAgICBpdCBcInlhbmsgdGhlIHdob2xlIGxpbmVzIHRvIHRoZSBkZWZhdWx0IHJlZ2lzdGVyXCIsIC0+XG4gICAgICBlbnN1cmUgJ3YgaiBZJywgY3Vyc29yOiBbMCwgMF0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiB0ZXh0XG5cbiAgZGVzY3JpYmUgXCJ0aGUgcCBrZXliaW5kaW5nXCIsIC0+XG4gICAgZGVzY3JpYmUgXCJ3aXRoIGNoYXJhY3RlciBjb250ZW50c1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogXCIwMTJcXG5cIiwgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgc2V0IHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMzQ1J1xuICAgICAgICBzZXQgcmVnaXN0ZXI6ICdhJzogdGV4dDogJ2EnXG4gICAgICAgIGF0b20uY2xpcGJvYXJkLndyaXRlIFwiY2xpcFwiXG5cbiAgICAgIGRlc2NyaWJlIFwiZnJvbSB0aGUgZGVmYXVsdCByZWdpc3RlclwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+IGtleXN0cm9rZSAncCdcblxuICAgICAgICBpdCBcImluc2VydHMgdGhlIGNvbnRlbnRzXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIHRleHQ6IFwiMDM0NTEyXFxuXCIsIGN1cnNvcjogWzAsIDNdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXQgdGhlIGVuZCBvZiBhIGxpbmVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAyXVxuICAgICAgICAgIGtleXN0cm9rZSAncCdcblxuICAgICAgICBpdCBcInBvc2l0aW9ucyBjdXJzb3IgY29ycmVjdGx5XCIsIC0+XG4gICAgICAgICAgZW5zdXJlIHRleHQ6IFwiMDEyMzQ1XFxuXCIsIGN1cnNvcjogWzAsIDVdXG5cbiAgICAgIGRlc2NyaWJlIFwicGFzdGUgdG8gZW1wdHkgbGluZVwiLCAtPlxuICAgICAgICBpdCBcInBhc3RlIGNvbnRlbnQgdG8gdGhhdCBlbXB0eSBsaW5lXCIsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDFzdFxuXG4gICAgICAgICAgICAzcmRcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMm5kJ1xuICAgICAgICAgIGVuc3VyZSAncCcsXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDFzdFxuICAgICAgICAgICAgMm5kXG4gICAgICAgICAgICAzcmRcbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gdXNlQ2xpcGJvYXJkQXNEZWZhdWx0UmVnaXN0ZXIgZW5hYmxlZFwiLCAtPlxuICAgICAgICBpdCBcImluc2VydHMgY29udGVudHMgZnJvbSBjbGlwYm9hcmRcIiwgLT5cbiAgICAgICAgICBzZXR0aW5ncy5zZXQgJ3VzZUNsaXBib2FyZEFzRGVmYXVsdFJlZ2lzdGVyJywgdHJ1ZVxuICAgICAgICAgIGVuc3VyZSAncCcsIHRleHQ6IFwiMGNsaXAxMlxcblwiXG5cbiAgICAgIGRlc2NyaWJlIFwiZnJvbSBhIHNwZWNpZmllZCByZWdpc3RlclwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAga2V5c3Ryb2tlIFsnXCInLCBpbnB1dDogJ2EnLCAncCddXG5cbiAgICAgICAgaXQgXCJpbnNlcnRzIHRoZSBjb250ZW50cyBvZiB0aGUgJ2EnIHJlZ2lzdGVyXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIHRleHQ6IFwiMGExMlxcblwiLCBjdXJzb3I6IFswLCAxXVxuXG4gICAgICBkZXNjcmliZSBcImF0IHRoZSBlbmQgb2YgYSBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiaW5zZXJ0cyBiZWZvcmUgdGhlIGN1cnJlbnQgbGluZSdzIG5ld2xpbmVcIiwgLT5cbiAgICAgICAgICBzZXQgdGV4dDogXCJhYmNkZVxcbm9uZSB0d28gdGhyZWVcIiwgY3Vyc29yOiBbMSwgNF1cbiAgICAgICAgICBlbnN1cmUgJ2QgJCBrICQgcCcsIHRleHQ6IFwiYWJjZGV0d28gdGhyZWVcXG5vbmUgXCJcblxuICAgIGRlc2NyaWJlIFwid2l0aCBsaW5ld2lzZSBjb250ZW50c1wiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJvbiBhIHNpbmdsZSBsaW5lXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6ICcwMTInXG4gICAgICAgICAgICBjdXJzb3I6IFswLCAxXVxuICAgICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiIDM0NVxcblwiLCB0eXBlOiAnbGluZXdpc2UnXG5cbiAgICAgICAgaXQgXCJpbnNlcnRzIHRoZSBjb250ZW50cyBvZiB0aGUgZGVmYXVsdCByZWdpc3RlclwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAncCcsIHRleHQ6IFwiMDEyXFxuIDM0NVwiLCBjdXJzb3I6IFsxLCAxXVxuXG4gICAgICAgIGl0IFwicmVwbGFjZXMgdGhlIGN1cnJlbnQgc2VsZWN0aW9uIGFuZCBwdXQgY3Vyc29yIHRvIHRoZSBmaXJzdCBjaGFyIG9mIGxpbmVcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ3YgcCcsXG4gICAgICAgICAgICB0ZXh0OiBcIjBcXG4gMzQ1XFxuMlwiXG4gICAgICAgICAgICBjdXJzb3I6IFsxLCAxXVxuXG4gICAgICBkZXNjcmliZSBcIm9uIG11bHRpcGxlIGxpbmVzXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiMDEyXFxuIDM0NVwiXG4gICAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIgNDU2XFxuXCIsIHR5cGU6ICdsaW5ld2lzZSdcblxuICAgICAgICBpdCBcImluc2VydHMgdGhlIGNvbnRlbnRzIG9mIHRoZSBkZWZhdWx0IHJlZ2lzdGVyIGF0IG1pZGRsZSBsaW5lXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDFdXG4gICAgICAgICAga2V5c3Ryb2tlICdwJ1xuICAgICAgICAgIGVuc3VyZSB0ZXh0OiBcIjAxMlxcbiA0NTZcXG4gMzQ1XCIsIGN1cnNvcjogWzEsIDFdXG5cbiAgICAgICAgaXQgXCJpbnNlcnRzIHRoZSBjb250ZW50cyBvZiB0aGUgZGVmYXVsdCByZWdpc3RlciBhdCBlbmQgb2YgbGluZVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAxXVxuICAgICAgICAgIGVuc3VyZSAncCcsIHRleHQ6IFwiMDEyXFxuIDM0NVxcbiA0NTZcIiwgY3Vyc29yOiBbMiwgMV1cblxuICAgIGRlc2NyaWJlIFwid2l0aCBtdWx0aXBsZSBsaW5ld2lzZSBjb250ZW50c1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIjAxMlxcbmFiY1wiLFxuICAgICAgICAgIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiIDM0NVxcbiA2NzhcXG5cIiwgdHlwZTogJ2xpbmV3aXNlJ1xuICAgICAgICBrZXlzdHJva2UgJ3AnXG5cbiAgICAgIGl0IFwiaW5zZXJ0cyB0aGUgY29udGVudHMgb2YgdGhlIGRlZmF1bHQgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgZW5zdXJlIHRleHQ6IFwiMDEyXFxuYWJjXFxuIDM0NVxcbiA2NzhcIiwgY3Vyc29yOiBbMiwgMV1cblxuICAgIGRlc2NyaWJlIFwicGFzdGluZyB0d2ljZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIjEyMzQ1XFxuYWJjZGVcXG5BQkNERVxcblFXRVJUXCJcbiAgICAgICAgICBjdXJzb3I6IFsxLCAxXVxuICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMTIzJ1xuICAgICAgICBrZXlzdHJva2UgJzIgcCdcblxuICAgICAgaXQgXCJpbnNlcnRzIHRoZSBzYW1lIGxpbmUgdHdpY2VcIiwgLT5cbiAgICAgICAgZW5zdXJlIHRleHQ6IFwiMTIzNDVcXG5hYjEyMzEyM2NkZVxcbkFCQ0RFXFxuUVdFUlRcIlxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gdW5kb25lXCIsIC0+XG4gICAgICAgIGl0IFwicmVtb3ZlcyBib3RoIGxpbmVzXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICd1JywgdGV4dDogXCIxMjM0NVxcbmFiY2RlXFxuQUJDREVcXG5RV0VSVFwiXG5cbiAgICBkZXNjcmliZSBcInN1cHBvcnQgbXVsdGlwbGUgY3Vyc29yc1wiLCAtPlxuICAgICAgaXQgXCJwYXN0ZSB0ZXh0IGZvciBlYWNoIGN1cnNvcnNcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCIxMjM0NVxcbmFiY2RlXFxuQUJDREVcXG5RV0VSVFwiXG4gICAgICAgICAgY3Vyc29yOiBbWzEsIDBdLCBbMiwgMF1dXG4gICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICdaWlonXG4gICAgICAgIGVuc3VyZSAncCcsXG4gICAgICAgICAgdGV4dDogXCIxMjM0NVxcbmFaWlpiY2RlXFxuQVpaWkJDREVcXG5RV0VSVFwiXG4gICAgICAgICAgY3Vyc29yOiBbWzEsIDNdLCBbMiwgM11dXG5cbiAgICBkZXNjcmliZSBcIndpdGggYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogJzAxMlxcbidcbiAgICAgICAgICBjdXJzb3I6IFswLCAxXVxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIGNoYXJhY3Rlcndpc2Ugc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIGl0IFwicmVwbGFjZXMgc2VsZWN0aW9uIHdpdGggY2hhcndpc2UgY29udGVudFwiLCAtPlxuICAgICAgICAgIHNldCByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIzNDVcIlxuICAgICAgICAgIGVuc3VyZSAndiBwJywgdGV4dDogXCIwMzQ1MlxcblwiLCBjdXJzb3I6IFswLCAzXVxuICAgICAgICBpdCBcInJlcGxhY2VzIHNlbGVjdGlvbiB3aXRoIGxpbmV3aXNlIGNvbnRlbnRcIiwgLT5cbiAgICAgICAgICBzZXQgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiMzQ1XFxuXCJcbiAgICAgICAgICBlbnN1cmUgJ3YgcCcsIHRleHQ6IFwiMFxcbjM0NVxcbjJcXG5cIiwgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIGxpbmV3aXNlIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICBpdCBcInJlcGxhY2VzIHNlbGVjdGlvbiB3aXRoIGNoYXJ3aXNlIGNvbnRlbnRcIiwgLT5cbiAgICAgICAgICBzZXQgdGV4dDogXCIwMTJcXG5hYmNcIiwgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgICBzZXQgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiMzQ1XCJcbiAgICAgICAgICBlbnN1cmUgJ1YgcCcsIHRleHQ6IFwiMzQ1XFxuYWJjXCIsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGl0IFwicmVwbGFjZXMgc2VsZWN0aW9uIHdpdGggbGluZXdpc2UgY29udGVudFwiLCAtPlxuICAgICAgICAgIHNldCByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIzNDVcXG5cIlxuICAgICAgICAgIGVuc3VyZSAnViBwJywgdGV4dDogXCIzNDVcXG5cIiwgY3Vyc29yOiBbMCwgMF1cblxuICBkZXNjcmliZSBcInRoZSBQIGtleWJpbmRpbmdcIiwgLT5cbiAgICBkZXNjcmliZSBcIndpdGggY2hhcmFjdGVyIGNvbnRlbnRzXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIjAxMlxcblwiLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBzZXQgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICczNDUnXG4gICAgICAgIHNldCByZWdpc3RlcjogYTogdGV4dDogJ2EnXG4gICAgICAgIGtleXN0cm9rZSAnUCdcblxuICAgICAgaXQgXCJpbnNlcnRzIHRoZSBjb250ZW50cyBvZiB0aGUgZGVmYXVsdCByZWdpc3RlciBhYm92ZVwiLCAtPlxuICAgICAgICBlbnN1cmUgdGV4dDogXCIzNDUwMTJcXG5cIiwgY3Vyc29yOiBbMCwgMl1cblxuICBkZXNjcmliZSBcIlB1dEFmdGVyQW5kU2VsZWN0IGFuZCBQdXRCZWZvcmVBbmRTZWxlY3RcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBhdG9tLmtleW1hcHMuYWRkIFwidGV4dFwiLFxuICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzOm5vdCguaW5zZXJ0LW1vZGUpJzpcbiAgICAgICAgICAnZyBwJzogJ3ZpbS1tb2RlLXBsdXM6cHV0LWFmdGVyLWFuZC1zZWxlY3QnXG4gICAgICAgICAgJ2cgUCc6ICd2aW0tbW9kZS1wbHVzOnB1dC1iZWZvcmUtYW5kLXNlbGVjdCdcbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAxMTFcbiAgICAgICAgICAyMjJcbiAgICAgICAgICAzMzNcblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFsxLCAwXVxuICAgIGRlc2NyaWJlIFwiaW4gdmlzdWFsLW1vZGVcIiwgLT5cbiAgICAgIGRlc2NyaWJlIFwibGluZXdpc2UgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCByZWdpc3RlcjogJ1wiJzogdGV4dDogXCJBQUFcXG5cIlxuICAgICAgICBpdCBcInBhc3RlIGFuZCBzZWxlY3Q6IFtzZWxlY3Rpb246bGluZXdpc2VdXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdWIGcgcCcsIHRleHQ6IFwiMTExXFxuQUFBXFxuMzMzXFxuXCIsIHNlbGVjdGVkVGV4dDogXCJBQUFcXG5cIiwgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuICAgICAgICBpdCBcInBhc3RlIGFuZCBzZWxlY3Q6IFtzZWxlY3Rpb246Y2hhcndpc2UsIHJlZ2lzdGVyOmxpbmV3aXNlXVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAndiBnIFAnLCB0ZXh0OiBcIjExMVxcblxcbkFBQVxcbjIyXFxuMzMzXFxuXCIsIHNlbGVjdGVkVGV4dDogXCJBQUFcXG5cIiwgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuXG4gICAgICBkZXNjcmliZSBcImNoYXJhY3Rlcndpc2UgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCByZWdpc3RlcjogJ1wiJzogdGV4dDogXCJBQUFcIlxuICAgICAgICBpdCBcInBhc3RlIGFuZCBzZWxlY3Q6IFtzZWxlY3Rpb246bGluZXdpc2UsIHJlZ2lzdGVyOmNoYXJ3aXNlXVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnViBnIHAnLCB0ZXh0OiBcIjExMVxcbkFBQVxcbjMzM1xcblwiLCBzZWxlY3RlZFRleHQ6IFwiQUFBXFxuXCIsIG1vZGU6IFsndmlzdWFsJywgJ2xpbmV3aXNlJ11cbiAgICAgICAgaXQgXCJwYXN0ZSBhbmQgc2VsZWN0OiBbc2VsZWN0aW9uOmNoYXJ3aXNlLCByZWdpc3RlcjpjaGFyd2lzZV1cIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ3YgZyBQJywgdGV4dDogXCIxMTFcXG5BQUEyMlxcbjMzM1xcblwiLCBzZWxlY3RlZFRleHQ6IFwiQUFBXCIsIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuXG4gICAgZGVzY3JpYmUgXCJpbiBub3JtYWxcIiwgLT5cbiAgICAgIGRlc2NyaWJlIFwibGluZXdpc2UgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCByZWdpc3RlcjogJ1wiJzogdGV4dDogXCJBQUFcXG5cIlxuICAgICAgICBpdCBcInB1dEFmdGVyIGFuZCBzZWxlY3RcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ2cgcCcsIHRleHQ6IFwiMTExXFxuMjIyXFxuQUFBXFxuMzMzXFxuXCIsIHNlbGVjdGVkVGV4dDogXCJBQUFcXG5cIiwgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuICAgICAgICBpdCBcInB1dEJlZm9yZSBhbmQgc2VsZWN0XCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdnIFAnLCB0ZXh0OiBcIjExMVxcbkFBQVxcbjIyMlxcbjMzM1xcblwiLCBzZWxlY3RlZFRleHQ6IFwiQUFBXFxuXCIsIG1vZGU6IFsndmlzdWFsJywgJ2xpbmV3aXNlJ11cbiAgICAgIGRlc2NyaWJlIFwiY2hhcmFjdGVyd2lzZSByZWdpc3RlclwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcIkFBQVwiXG4gICAgICAgIGl0IFwicHV0QWZ0ZXIgYW5kIHNlbGVjdFwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnZyBwJywgdGV4dDogXCIxMTFcXG4yQUFBMjJcXG4zMzNcXG5cIiwgc2VsZWN0ZWRUZXh0OiBcIkFBQVwiLCBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgICAgaXQgXCJwdXRBZnRlciBhbmQgc2VsZWN0XCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdnIFAnLCB0ZXh0OiBcIjExMVxcbkFBQTIyMlxcbjMzM1xcblwiLCBzZWxlY3RlZFRleHQ6IFwiQUFBXCIsIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuXG4gIGRlc2NyaWJlIFwidGhlIEoga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldCB0ZXh0OiBcIjAxMlxcbiAgICA0NTZcXG5cIiwgY3Vyc29yOiBbMCwgMV1cblxuICAgIGRlc2NyaWJlIFwid2l0aG91dCByZXBlYXRpbmdcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT4ga2V5c3Ryb2tlICdKJ1xuXG4gICAgICBpdCBcImpvaW5zIHRoZSBjb250ZW50cyBvZiB0aGUgY3VycmVudCBsaW5lIHdpdGggdGhlIG9uZSBiZWxvdyBpdFwiLCAtPlxuICAgICAgICBlbnN1cmUgdGV4dDogXCIwMTIgNDU2XFxuXCJcblxuICAgIGRlc2NyaWJlIFwid2l0aCByZXBlYXRpbmdcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCIxMjM0NVxcbmFiY2RlXFxuQUJDREVcXG5RV0VSVFwiXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMV1cbiAgICAgICAga2V5c3Ryb2tlICcyIEonXG5cbiAgICAgIGRlc2NyaWJlIFwidW5kbyBiZWhhdmlvclwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+IGtleXN0cm9rZSAndSdcblxuICAgICAgICBpdCBcImhhbmRsZXMgcmVwZWF0c1wiLCAtPlxuICAgICAgICAgIGVuc3VyZSB0ZXh0OiBcIjEyMzQ1XFxuYWJjZGVcXG5BQkNERVxcblFXRVJUXCJcblxuICBkZXNjcmliZSBcInRoZSAuIGtleWJpbmRpbmdcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgdGV4dDogXCIxMlxcbjM0XFxuNTZcXG43OFwiLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgaXQgXCJyZXBlYXRzIHRoZSBsYXN0IG9wZXJhdGlvblwiLCAtPlxuICAgICAgZW5zdXJlICcyIGQgZCAuJywgdGV4dDogXCJcIlxuXG4gICAgaXQgXCJjb21wb3NlcyB3aXRoIG1vdGlvbnNcIiwgLT5cbiAgICAgIGVuc3VyZSAnZCBkIDIgLicsIHRleHQ6IFwiNzhcIlxuXG4gIGRlc2NyaWJlIFwidGhlIHIga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgMTJcbiAgICAgICAgMzRcbiAgICAgICAgXFxuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3JCdWZmZXI6IFtbMCwgMF0sIFsxLCAwXV1cblxuICAgIGl0IFwicmVwbGFjZXMgYSBzaW5nbGUgY2hhcmFjdGVyXCIsIC0+XG4gICAgICBlbnN1cmUgWydyJywgaW5wdXQ6ICd4J10sIHRleHQ6ICd4Mlxcbng0XFxuXFxuJ1xuXG4gICAgaXQgXCJkb2VzIG5vdGhpbmcgd2hlbiBjYW5jZWxsZWRcIiwgLT5cbiAgICAgIGtleXN0cm9rZSAncidcbiAgICAgIHZpbVN0YXRlLmlucHV0LmNhbmNlbCgpXG4gICAgICBlbnN1cmVcbiAgICAgICAgdGV4dDogJzEyXFxuMzRcXG5cXG4nXG4gICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICBpdCBcInJlbWFpbiB2aXN1YWwtbW9kZSB3aGVuIGNhbmNlbGxlZFwiLCAtPlxuICAgICAga2V5c3Ryb2tlICd2IHInXG4gICAgICB2aW1TdGF0ZS5pbnB1dC5jYW5jZWwoKVxuICAgICAgZW5zdXJlXG4gICAgICAgIHRleHQ6ICcxMlxcbjM0XFxuXFxuJ1xuICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cblxuICAgIGl0IFwicmVwbGFjZXMgYSBzaW5nbGUgY2hhcmFjdGVyIHdpdGggYSBsaW5lIGJyZWFrXCIsIC0+XG4gICAgICBlbnN1cmUgJ3IgZW50ZXInLFxuICAgICAgICB0ZXh0OiAnXFxuMlxcblxcbjRcXG5cXG4nXG4gICAgICAgIGN1cnNvckJ1ZmZlcjogW1sxLCAwXSwgWzMsIDBdXVxuXG4gICAgaXQgXCJjb21wb3NlcyBwcm9wZXJseSB3aXRoIG1vdGlvbnNcIiwgLT5cbiAgICAgIGVuc3VyZSBbJzIgcicsIGlucHV0OiAneCddLCB0ZXh0OiAneHhcXG54eFxcblxcbidcblxuICAgIGl0IFwiZG9lcyBub3RoaW5nIG9uIGFuIGVtcHR5IGxpbmVcIiwgLT5cbiAgICAgIHNldCBjdXJzb3JCdWZmZXI6IFsyLCAwXVxuICAgICAgZW5zdXJlIFsncicsIGlucHV0OiAneCddLCB0ZXh0OiAnMTJcXG4zNFxcblxcbidcblxuICAgIGl0IFwiZG9lcyBub3RoaW5nIGlmIGFza2VkIHRvIHJlcGxhY2UgbW9yZSBjaGFyYWN0ZXJzIHRoYW4gdGhlcmUgYXJlIG9uIGEgbGluZVwiLCAtPlxuICAgICAgZW5zdXJlIFsnMyByJywgaW5wdXQ6ICd4J10sIHRleHQ6ICcxMlxcbjM0XFxuXFxuJ1xuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGluIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGtleXN0cm9rZSAndiBlJ1xuXG4gICAgICBpdCBcInJlcGxhY2VzIHRoZSBlbnRpcmUgc2VsZWN0aW9uIHdpdGggdGhlIGdpdmVuIGNoYXJhY3RlclwiLCAtPlxuICAgICAgICBlbnN1cmUgWydyJywgaW5wdXQ6ICd4J10sIHRleHQ6ICd4eFxcbnh4XFxuXFxuJ1xuXG4gICAgICBpdCBcImxlYXZlcyB0aGUgY3Vyc29yIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICBlbnN1cmUgWydyJywgaW5wdXQ6ICd4JyBdLCBjdXJzb3JCdWZmZXI6IFtbMCwgMF0sIFsxLCAwXV1cblxuICAgIGRlc2NyaWJlIFwid2hlbiBpbiB2aXN1YWwtYmxvY2sgbW9kZVwiLCAtPlxuICAgICAgdGV4dE9yaWdpbmFsID0gXCJcIlwiXG4gICAgICAgIDA6MjM0NVxuICAgICAgICAxOiBvMTFvXG4gICAgICAgIDI6IG8yMm9cbiAgICAgICAgMzogbzMzb1xuICAgICAgICA0OiBvNDRvXFxuXG4gICAgICAgIFwiXCJcIlxuICAgICAgdGV4dFJlcGxhY2VkID0gXCJcIlwiXG4gICAgICAgIDA6MjM0NVxuICAgICAgICAxOiBveHhvXG4gICAgICAgIDI6IG94eG9cbiAgICAgICAgMzogb3h4b1xuICAgICAgICA0OiBveHhvXFxuXG4gICAgICAgIFwiXCJcIlxuICAgICAgdGV4dFJlcGVhdGVkID0gXCJcIlwiXG4gICAgICAgIDA6MjM0NVxuICAgICAgICB4eCBveHhvXG4gICAgICAgIHh4IG94eG9cbiAgICAgICAgeHggb3h4b1xuICAgICAgICB4eCBveHhvXFxuXG4gICAgICAgIFwiXCJcIlxuXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiB0ZXh0T3JpZ2luYWwsIGN1cnNvcjogWzEsIDRdXG4gICAgICAgIGVuc3VyZSAnY3RybC12IGwgMyBqJyxcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgICAgIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFsnMTEnLCAnMjInLCAnMzMnLCAnNDQnXSxcblxuICAgICAgIyBbRklYTUVdXG4gICAgICB4aXQgXCJyZXBsYWNlcyBlYWNoIHNlbGVjdGlvbiBhbmQgcHV0IGN1cnNvciBvbiBzdGFydCBvZiB0b3Agc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIGVuc3VyZSBbJ3InLCBpbnB1dDogJ3gnXSxcbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICAgIHRleHQ6IHRleHRSZXBsYWNlZFxuICAgICAgICAgIGN1cnNvcjogWzEsIDRdXG4gICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBlbnN1cmUgJy4nLFxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgdGV4dDogdGV4dFJlcGVhdGVkXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMF1cblxuICBkZXNjcmliZSAndGhlIG0ga2V5YmluZGluZycsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0IHRleHQ6ICcxMlxcbjM0XFxuNTZcXG4nLCBjdXJzb3JCdWZmZXI6IFswLCAxXVxuXG4gICAgaXQgJ21hcmtzIGEgcG9zaXRpb24nLCAtPlxuICAgICAga2V5c3Ryb2tlICdtIGEnXG4gICAgICBleHBlY3QodmltU3RhdGUubWFyay5nZXQoJ2EnKSkudG9FcXVhbCBbMCwgMV1cblxuICBkZXNjcmliZSAndGhlIFIga2V5YmluZGluZycsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIDEyMzQ1XG4gICAgICAgICAgNjc4OTBcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yQnVmZmVyOiBbMCwgMl1cblxuICAgIGl0IFwiZW50ZXJzIHJlcGxhY2UgbW9kZSBhbmQgcmVwbGFjZXMgY2hhcmFjdGVyc1wiLCAtPlxuICAgICAgZW5zdXJlICdSJyxcbiAgICAgICAgbW9kZTogWydpbnNlcnQnLCAncmVwbGFjZSddXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcImFiXCJcbiAgICAgIGVuc3VyZSAnZXNjYXBlJyxcbiAgICAgICAgdGV4dDogXCIxMmFiNVxcbjY3ODkwXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgM11cbiAgICAgICAgbW9kZTogJ25vcm1hbCdcblxuICAgIGl0IFwiY29udGludWVzIGJleW9uZCBlbmQgb2YgbGluZSBhcyBpbnNlcnRcIiwgLT5cbiAgICAgIGVuc3VyZSAnUicsXG4gICAgICAgIG1vZGU6IFsnaW5zZXJ0JywgJ3JlcGxhY2UnXVxuICAgICAgZWRpdG9yLmluc2VydFRleHQgXCJhYmNkZVwiXG4gICAgICBlbnN1cmUgJ2VzY2FwZScsIHRleHQ6ICcxMmFiY2RlXFxuNjc4OTAnXG5cbiAgICBpdCAndHJlYXRzIGJhY2tzcGFjZSBhcyB1bmRvJywgLT5cbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiZm9vXCJcbiAgICAgIGtleXN0cm9rZSAnUidcbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiYVwiXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcImJcIlxuICAgICAgZW5zdXJlIHRleHQ6IFwiMTJmb29hYjVcXG42Nzg5MFwiXG5cbiAgICAgIGVuc3VyZSAnYmFja3NwYWNlJywgdGV4dDogXCIxMmZvb2E0NVxcbjY3ODkwXCJcbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiY1wiXG4gICAgICBlbnN1cmUgdGV4dDogXCIxMmZvb2FjNVxcbjY3ODkwXCJcbiAgICAgIGVuc3VyZSAnYmFja3NwYWNlIGJhY2tzcGFjZScsXG4gICAgICAgIHRleHQ6IFwiMTJmb28zNDVcXG42Nzg5MFwiXG4gICAgICAgIHNlbGVjdGVkVGV4dDogJydcblxuICAgICAgZW5zdXJlICdiYWNrc3BhY2UnLFxuICAgICAgICB0ZXh0OiBcIjEyZm9vMzQ1XFxuNjc4OTBcIlxuICAgICAgICBzZWxlY3RlZFRleHQ6ICcnXG5cbiAgICBpdCBcImNhbiBiZSByZXBlYXRlZFwiLCAtPlxuICAgICAga2V5c3Ryb2tlICdSJ1xuICAgICAgZWRpdG9yLmluc2VydFRleHQgXCJhYlwiXG4gICAgICBrZXlzdHJva2UgJ2VzY2FwZSdcbiAgICAgIHNldCBjdXJzb3JCdWZmZXI6IFsxLCAyXVxuICAgICAgZW5zdXJlICcuJywgdGV4dDogXCIxMmFiNVxcbjY3YWIwXCIsIGN1cnNvcjogWzEsIDNdXG4gICAgICBzZXQgY3Vyc29yQnVmZmVyOiBbMCwgNF1cbiAgICAgIGVuc3VyZSAnLicsIHRleHQ6IFwiMTJhYmFiXFxuNjdhYjBcIiwgY3Vyc29yOiBbMCwgNV1cblxuICAgIGl0IFwiY2FuIGJlIGludGVycnVwdGVkIGJ5IGFycm93IGtleXMgYW5kIGJlaGF2ZSBhcyBpbnNlcnQgZm9yIHJlcGVhdFwiLCAtPlxuICAgICAgIyBGSVhNRSBkb24ndCBrbm93IGhvdyB0byB0ZXN0IHRoaXMgKGFsc28sIGRlcGVuZHMgb24gUFIgIzU2OClcblxuICAgIGl0IFwicmVwZWF0cyBjb3JyZWN0bHkgd2hlbiBiYWNrc3BhY2Ugd2FzIHVzZWQgaW4gdGhlIHRleHRcIiwgLT5cbiAgICAgIGtleXN0cm9rZSAnUidcbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiYVwiXG4gICAgICBrZXlzdHJva2UgJ2JhY2tzcGFjZSdcbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiYlwiXG4gICAgICBrZXlzdHJva2UgJ2VzY2FwZSdcbiAgICAgIHNldCBjdXJzb3JCdWZmZXI6IFsxLCAyXVxuICAgICAgZW5zdXJlICcuJywgdGV4dDogXCIxMmI0NVxcbjY3YjkwXCIsIGN1cnNvcjogWzEsIDJdXG4gICAgICBzZXQgY3Vyc29yQnVmZmVyOiBbMCwgNF1cbiAgICAgIGVuc3VyZSAnLicsIHRleHQ6IFwiMTJiNGJcXG42N2I5MFwiLCBjdXJzb3I6IFswLCA0XVxuXG4gICAgaXQgXCJkb2Vzbid0IHJlcGxhY2UgYSBjaGFyYWN0ZXIgaWYgbmV3bGluZSBpcyBlbnRlcmVkXCIsIC0+XG4gICAgICBlbnN1cmUgJ1InLCBtb2RlOiBbJ2luc2VydCcsICdyZXBsYWNlJ11cbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiXFxuXCJcbiAgICAgIGVuc3VyZSAnZXNjYXBlJywgdGV4dDogXCIxMlxcbjM0NVxcbjY3ODkwXCJcblxuICAgIGRlc2NyaWJlIFwibXVsdGlsaW5lIHNpdHVhdGlvblwiLCAtPlxuICAgICAgdGV4dE9yaWdpbmFsID0gXCJcIlwiXG4gICAgICAgIDAxMjM0XG4gICAgICAgIDU2Nzg5XG4gICAgICAgIFwiXCJcIlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogdGV4dE9yaWdpbmFsLCBjdXJzb3I6IFswLCAwXVxuICAgICAgaXQgXCJyZXBsYWNlIGNoYXJhY3RlciB1bmxlc3MgaW5wdXQgaXNudCBuZXcgbGluZShcXFxcbilcIiwgLT5cbiAgICAgICAgZW5zdXJlICdSJywgbW9kZTogWydpbnNlcnQnLCAncmVwbGFjZSddXG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiYVxcbmJcXG5jXCJcbiAgICAgICAgZW5zdXJlXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBhXG4gICAgICAgICAgICBiXG4gICAgICAgICAgICBjMzRcbiAgICAgICAgICAgIDU2Nzg5XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFsyLCAxXVxuICAgICAgaXQgXCJoYW5kbGUgYmFja3NwYWNlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnUicsIG1vZGU6IFsnaW5zZXJ0JywgJ3JlcGxhY2UnXVxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgZWRpdG9yLmluc2VydFRleHQgXCJhXFxuYlxcbmNcIlxuICAgICAgICBlbnN1cmVcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDBhXG4gICAgICAgICAgICBiXG4gICAgICAgICAgICBjNFxuICAgICAgICAgICAgNTY3ODlcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzIsIDFdXG4gICAgICAgIGVuc3VyZSAnYmFja3NwYWNlJyxcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDBhXG4gICAgICAgICAgICBiXG4gICAgICAgICAgICAzNFxuICAgICAgICAgICAgNTY3ODlcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGVuc3VyZSAnYmFja3NwYWNlJyxcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDBhXG4gICAgICAgICAgICBiMzRcbiAgICAgICAgICAgIDU2Nzg5XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFsxLCAxXVxuICAgICAgICBlbnN1cmUgJ2JhY2tzcGFjZScsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAwYVxuICAgICAgICAgICAgMjM0XG4gICAgICAgICAgICA1Njc4OVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgZW5zdXJlICdiYWNrc3BhY2UnLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMGEyMzRcbiAgICAgICAgICAgIDU2Nzg5XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAyXVxuICAgICAgICBlbnN1cmUgJ2JhY2tzcGFjZScsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAwMTIzNFxuICAgICAgICAgICAgNTY3ODlcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGVuc3VyZSAnYmFja3NwYWNlJywgIyBkbyBub3RoaW5nXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAwMTIzNFxuICAgICAgICAgICAgNTY3ODlcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJyxcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDAxMjM0XG4gICAgICAgICAgICA1Njc4OVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgaXQgXCJyZXBlYXRlIG11bHRpbGluZSB0ZXh0IGNhc2UtMVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ1InLCBtb2RlOiBbJ2luc2VydCcsICdyZXBsYWNlJ11cbiAgICAgICAgZWRpdG9yLmluc2VydFRleHQgXCJhYmNcXG5kZWZcIlxuICAgICAgICBlbnN1cmVcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGFiY1xuICAgICAgICAgICAgZGVmXG4gICAgICAgICAgICA1Njc4OVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMSwgM11cbiAgICAgICAgZW5zdXJlICdlc2NhcGUnLCBjdXJzb3I6IFsxLCAyXSwgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgZW5zdXJlICd1JywgdGV4dDogdGV4dE9yaWdpbmFsXG4gICAgICAgIGVuc3VyZSAnLicsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBhYmNcbiAgICAgICAgICAgIGRlZlxuICAgICAgICAgICAgNTY3ODlcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzEsIDJdXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgZW5zdXJlICdqIC4nLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgYWJjXG4gICAgICAgICAgICBkZWZcbiAgICAgICAgICAgIDU2YWJjXG4gICAgICAgICAgICBkZWZcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzMsIDJdXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgIGl0IFwicmVwZWF0ZSBtdWx0aWxpbmUgdGV4dCBjYXNlLTJcIiwgLT5cbiAgICAgICAgZW5zdXJlICdSJywgbW9kZTogWydpbnNlcnQnLCAncmVwbGFjZSddXG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiYWJjXFxuZFwiXG4gICAgICAgIGVuc3VyZVxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgYWJjXG4gICAgICAgICAgICBkNFxuICAgICAgICAgICAgNTY3ODlcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzEsIDFdXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgY3Vyc29yOiBbMSwgMF0sIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIGVuc3VyZSAnaiAuJyxcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBhYmNcbiAgICAgICAgICBkNFxuICAgICAgICAgIGFiY1xuICAgICAgICAgIGQ5XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMywgMF1cbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuIl19
