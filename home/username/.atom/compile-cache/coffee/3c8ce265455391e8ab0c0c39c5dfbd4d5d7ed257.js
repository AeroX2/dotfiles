(function() {
  var TextData, getVimState, ref, swrap,
    slice = [].slice;

  ref = require('./spec-helper'), getVimState = ref.getVimState, TextData = ref.TextData;

  swrap = require('../lib/selection-wrapper');

  describe("Visual Blockwise", function() {
    var blockTexts, editor, editorElement, ensure, ensureBlockwiseSelection, keystroke, ref1, selectBlockwise, selectBlockwiseReversely, set, textAfterDeleted, textAfterInserted, textData, textInitial, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    textInitial = "01234567890123456789\n1-------------------\n2----A---------B----\n3----***********----\n4----+++++++++++----\n5----C---------D----\n6-------------------";
    textAfterDeleted = "01234567890123456789\n1-------------------\n2----\n3----\n4----\n5----\n6-------------------";
    textAfterInserted = "01234567890123456789\n1-------------------\n2----!!!\n3----!!!\n4----!!!\n5----!!!\n6-------------------";
    blockTexts = ['56789012345', '-----------', 'A---------B', '***********', '+++++++++++', 'C---------D', '-----------'];
    textData = new TextData(textInitial);
    selectBlockwise = function() {
      set({
        cursor: [2, 5]
      });
      return ensure('v 3 j 1 0 l ctrl-v', {
        mode: ['visual', 'blockwise'],
        selectedBufferRange: [[[2, 5], [2, 16]], [[3, 5], [3, 16]], [[4, 5], [4, 16]], [[5, 5], [5, 16]]],
        selectedText: blockTexts.slice(2, 6)
      });
    };
    selectBlockwiseReversely = function() {
      set({
        cursor: [2, 15]
      });
      return ensure('v 3 j 1 0 h ctrl-v', {
        mode: ['visual', 'blockwise'],
        selectedBufferRange: [[[2, 5], [2, 16]], [[3, 5], [3, 16]], [[4, 5], [4, 16]], [[5, 5], [5, 16]]],
        selectedText: blockTexts.slice(2, 6)
      });
    };
    ensureBlockwiseSelection = function(o) {
      var bs, first, head, i, j, k, last, len, len1, others, results, s, selections, tail;
      selections = editor.getSelectionsOrderedByBufferPosition();
      if (selections.length === 1) {
        first = last = selections[0];
      } else {
        first = selections[0], others = 3 <= selections.length ? slice.call(selections, 1, i = selections.length - 1) : (i = 1, []), last = selections[i++];
      }
      head = (function() {
        switch (o.head) {
          case 'top':
            return first;
          case 'bottom':
            return last;
        }
      })();
      bs = vimState.getLastBlockwiseSelection();
      expect(bs.getHeadSelection()).toBe(head);
      tail = (function() {
        switch (o.tail) {
          case 'top':
            return first;
          case 'bottom':
            return last;
        }
      })();
      expect(bs.getTailSelection()).toBe(tail);
      for (j = 0, len = others.length; j < len; j++) {
        s = others[j];
        expect(bs.getHeadSelection()).not.toBe(s);
        expect(bs.getTailSelection()).not.toBe(s);
      }
      if (o.reversed != null) {
        results = [];
        for (k = 0, len1 = selections.length; k < len1; k++) {
          s = selections[k];
          results.push(expect(s.isReversed()).toBe(o.reversed));
        }
        return results;
      }
    };
    beforeEach(function() {
      getVimState(function(state, vimEditor) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = vimEditor.set, ensure = vimEditor.ensure, keystroke = vimEditor.keystroke, vimEditor;
      });
      return runs(function() {
        return set({
          text: textInitial
        });
      });
    });
    afterEach(function() {
      return vimState.resetNormalMode();
    });
    describe("j", function() {
      beforeEach(function() {
        set({
          cursor: [3, 5]
        });
        return ensure('v 1 0 l ctrl-v', {
          selectedText: blockTexts[3],
          mode: ['visual', 'blockwise']
        });
      });
      it("add selection to down direction", function() {
        ensure('j', {
          selectedText: blockTexts.slice(3, 5)
        });
        return ensure('j', {
          selectedText: blockTexts.slice(3, 6)
        });
      });
      it("delete selection when blocwise is reversed", function() {
        ensure('3 k', {
          selectedTextOrdered: blockTexts.slice(0, 4)
        });
        ensure('j', {
          selectedTextOrdered: blockTexts.slice(1, 4)
        });
        return ensure('2 j', {
          selectedTextOrdered: blockTexts[3]
        });
      });
      return it("keep tail row when reversed status changed", function() {
        ensure('j', {
          selectedText: blockTexts.slice(3, 5)
        });
        return ensure('2 k', {
          selectedTextOrdered: blockTexts.slice(2, 4)
        });
      });
    });
    describe("k", function() {
      beforeEach(function() {
        set({
          cursor: [3, 5]
        });
        return ensure('v 1 0 l ctrl-v', {
          selectedText: blockTexts[3],
          mode: ['visual', 'blockwise']
        });
      });
      it("add selection to up direction", function() {
        ensure('k', {
          selectedTextOrdered: blockTexts.slice(2, 4)
        });
        return ensure('k', {
          selectedTextOrdered: blockTexts.slice(1, 4)
        });
      });
      return it("delete selection when blocwise is reversed", function() {
        ensure('3 j', {
          selectedTextOrdered: blockTexts.slice(3, 7)
        });
        ensure('k', {
          selectedTextOrdered: blockTexts.slice(3, 6)
        });
        return ensure('2 k', {
          selectedTextOrdered: blockTexts[3]
        });
      });
    });
    describe("C", function() {
      var ensureChange;
      ensureChange = function() {
        ensure('C', {
          mode: 'insert',
          cursor: [[2, 5], [3, 5], [4, 5], [5, 5]],
          text: textAfterDeleted
        });
        editor.insertText("!!!");
        return ensure({
          mode: 'insert',
          cursor: [[2, 8], [3, 8], [4, 8], [5, 8]],
          text: textAfterInserted
        });
      };
      it("change-to-last-character-of-line for each selection", function() {
        selectBlockwise();
        return ensureChange();
      });
      return it("[selection reversed] change-to-last-character-of-line for each selection", function() {
        selectBlockwiseReversely();
        return ensureChange();
      });
    });
    describe("D", function() {
      var ensureDelete;
      ensureDelete = function() {
        return ensure('D', {
          text: textAfterDeleted,
          cursor: [2, 4],
          mode: 'normal'
        });
      };
      it("delete-to-last-character-of-line for each selection", function() {
        selectBlockwise();
        return ensureDelete();
      });
      return it("[selection reversed] delete-to-last-character-of-line for each selection", function() {
        selectBlockwiseReversely();
        return ensureDelete();
      });
    });
    describe("I", function() {
      beforeEach(function() {
        return selectBlockwise();
      });
      return it("enter insert mode with each cursors position set to start of selection", function() {
        keystroke('I');
        editor.insertText("!!!");
        return ensure({
          text: "01234567890123456789\n1-------------------\n2----!!!A---------B----\n3----!!!***********----\n4----!!!+++++++++++----\n5----!!!C---------D----\n6-------------------",
          cursor: [[2, 8], [3, 8], [4, 8], [5, 8]],
          mode: 'insert'
        });
      });
    });
    describe("A", function() {
      beforeEach(function() {
        return selectBlockwise();
      });
      return it("enter insert mode with each cursors position set to end of selection", function() {
        keystroke('A');
        editor.insertText("!!!");
        return ensure({
          text: "01234567890123456789\n1-------------------\n2----A---------B!!!----\n3----***********!!!----\n4----+++++++++++!!!----\n5----C---------D!!!----\n6-------------------",
          cursor: [[2, 19], [3, 19], [4, 19], [5, 19]]
        });
      });
    });
    describe("o and O keybinding", function() {
      beforeEach(function() {
        return selectBlockwise();
      });
      describe('o', function() {
        return it("change blockwiseHead to opposite side and reverse selection", function() {
          keystroke('o');
          ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            reversed: true
          });
          keystroke('o');
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: false
          });
        });
      });
      return describe('capital O', function() {
        return it("reverse each selection", function() {
          keystroke('O');
          ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: true
          });
          keystroke('O');
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: false
          });
        });
      });
    });
    describe("shift from characterwise to blockwise", function() {
      describe("when selection is not reversed", function() {
        beforeEach(function() {
          set({
            cursor: [2, 5]
          });
          return ensure('v', {
            selectedText: 'A',
            mode: ['visual', 'characterwise']
          });
        });
        it('case-1', function() {
          ensure('3 j ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['A', '*', '+', 'C']
          });
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: false
          });
        });
        it('case-2', function() {
          ensure('h 3 j ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['-A', '-*', '-+', '-C']
          });
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: true
          });
        });
        it('case-3', function() {
          ensure('2 h 3 j ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['--A', '--*', '--+', '--C']
          });
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: true
          });
        });
        it('case-4', function() {
          ensure('l 3 j ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['A-', '**', '++', 'C-']
          });
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: false
          });
        });
        return it('case-5', function() {
          ensure('2 l 3 j ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['A--', '***', '+++', 'C--']
          });
          return ensureBlockwiseSelection({
            head: 'bottom',
            tail: 'top',
            reversed: false
          });
        });
      });
      return describe("when selection is reversed", function() {
        beforeEach(function() {
          set({
            cursor: [5, 5]
          });
          return ensure('v', {
            selectedText: 'C',
            mode: ['visual', 'characterwise']
          });
        });
        it('case-1', function() {
          ensure('3 k ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['A', '*', '+', 'C']
          });
          return ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            reversed: true
          });
        });
        it('case-2', function() {
          ensure('h 3 k ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['-A', '-*', '-+', '-C']
          });
          return ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            reversed: true
          });
        });
        it('case-3', function() {
          ensure('2 h 3 k ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['--A', '--*', '--+', '--C']
          });
          return ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            reversed: true
          });
        });
        it('case-4', function() {
          ensure('l 3 k ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['A-', '**', '++', 'C-']
          });
          return ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            reversed: false
          });
        });
        return it('case-5', function() {
          ensure('2 l 3 k ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['A--', '***', '+++', 'C--']
          });
          return ensureBlockwiseSelection({
            head: 'top',
            tail: 'bottom',
            reversed: false
          });
        });
      });
    });
    describe("shift from blockwise to characterwise", function() {
      var ensureCharacterwiseWasRestored, preserveSelection;
      preserveSelection = function() {
        var cursor, mode, selectedBufferRange, selectedText;
        selectedText = editor.getSelectedText();
        selectedBufferRange = editor.getSelectedBufferRange();
        cursor = editor.getCursorBufferPosition();
        mode = [vimState.mode, vimState.submode];
        return {
          selectedText: selectedText,
          selectedBufferRange: selectedBufferRange,
          cursor: cursor,
          mode: mode
        };
      };
      ensureCharacterwiseWasRestored = function(keystroke) {
        var characterwiseState;
        ensure(keystroke, {
          mode: ['visual', 'characterwise']
        });
        characterwiseState = preserveSelection();
        ensure('ctrl-v', {
          mode: ['visual', 'blockwise']
        });
        return ensure('v', characterwiseState);
      };
      describe("when selection is not reversed", function() {
        beforeEach(function() {
          return set({
            cursor: [2, 5]
          });
        });
        it('case-1', function() {
          return ensureCharacterwiseWasRestored('v');
        });
        it('case-2', function() {
          return ensureCharacterwiseWasRestored('v 3 j');
        });
        it('case-3', function() {
          return ensureCharacterwiseWasRestored('v h 3 j');
        });
        it('case-4', function() {
          return ensureCharacterwiseWasRestored('v 2 h 3 j');
        });
        it('case-5', function() {
          return ensureCharacterwiseWasRestored('v l 3 j');
        });
        return it('case-6', function() {
          return ensureCharacterwiseWasRestored('v 2 l 3 j');
        });
      });
      return describe("when selection is reversed", function() {
        beforeEach(function() {
          return set({
            cursor: [5, 5]
          });
        });
        it('case-1', function() {
          return ensureCharacterwiseWasRestored('v');
        });
        it('case-2', function() {
          return ensureCharacterwiseWasRestored('v 3 k');
        });
        it('case-3', function() {
          return ensureCharacterwiseWasRestored('v h 3 k');
        });
        it('case-4', function() {
          return ensureCharacterwiseWasRestored('v 2 h 3 k');
        });
        it('case-5', function() {
          return ensureCharacterwiseWasRestored('v l 3 k');
        });
        it('case-6', function() {
          return ensureCharacterwiseWasRestored('v 2 l 3 k');
        });
        return it('case-7', function() {
          set({
            cursor: [5, 0]
          });
          return ensureCharacterwiseWasRestored('v 5 l 3 k');
        });
      });
    });
    return describe("gv feature", function() {
      var ensureRestored, preserveSelection;
      preserveSelection = function() {
        var cursor, mode, s, selectedBufferRangeOrdered, selectedTextOrdered, selections;
        selections = editor.getSelectionsOrderedByBufferPosition();
        selectedTextOrdered = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = selections.length; i < len; i++) {
            s = selections[i];
            results.push(s.getText());
          }
          return results;
        })();
        selectedBufferRangeOrdered = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = selections.length; i < len; i++) {
            s = selections[i];
            results.push(s.getBufferRange());
          }
          return results;
        })();
        cursor = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = selections.length; i < len; i++) {
            s = selections[i];
            results.push(s.getHeadScreenPosition());
          }
          return results;
        })();
        mode = [vimState.mode, vimState.submode];
        return {
          selectedTextOrdered: selectedTextOrdered,
          selectedBufferRangeOrdered: selectedBufferRangeOrdered,
          cursor: cursor,
          mode: mode
        };
      };
      ensureRestored = function(keystroke, spec) {
        var preserved;
        ensure(keystroke, spec);
        preserved = preserveSelection();
        ensure('escape j j', {
          mode: 'normal',
          selectedText: ''
        });
        return ensure('g v', preserved);
      };
      describe("linewise selection", function() {
        beforeEach(function() {
          return set({
            cursor: [2, 0]
          });
        });
        describe("selection is not reversed", function() {
          return it('restore previous selection', function() {
            return ensureRestored('V j', {
              selectedText: textData.getLines([2, 3]),
              mode: ['visual', 'linewise']
            });
          });
        });
        return describe("selection is reversed", function() {
          return it('restore previous selection', function() {
            return ensureRestored('V k', {
              selectedText: textData.getLines([1, 2]),
              mode: ['visual', 'linewise']
            });
          });
        });
      });
      describe("characterwise selection", function() {
        beforeEach(function() {
          return set({
            cursor: [2, 0]
          });
        });
        describe("selection is not reversed", function() {
          return it('restore previous selection', function() {
            return ensureRestored('v j', {
              selectedText: "2----A---------B----\n3",
              mode: ['visual', 'characterwise']
            });
          });
        });
        return describe("selection is reversed", function() {
          return it('restore previous selection', function() {
            return ensureRestored('v k', {
              selectedText: "1-------------------\n2",
              mode: ['visual', 'characterwise']
            });
          });
        });
      });
      return describe("blockwise selection", function() {
        describe("selection is not reversed", function() {
          it('restore previous selection case-1', function() {
            set({
              cursor: [2, 5]
            });
            keystroke('ctrl-v 1 0 l');
            return ensureRestored('3 j', {
              selectedText: blockTexts.slice(2, 6),
              mode: ['visual', 'blockwise']
            });
          });
          return it('restore previous selection case-2', function() {
            set({
              cursor: [5, 5]
            });
            keystroke('ctrl-v 1 0 l');
            return ensureRestored('3 k', {
              selectedTextOrdered: blockTexts.slice(2, 6),
              mode: ['visual', 'blockwise']
            });
          });
        });
        return describe("selection is reversed", function() {
          it('restore previous selection case-1', function() {
            set({
              cursor: [2, 15]
            });
            keystroke('ctrl-v 1 0 h');
            return ensureRestored('3 j', {
              selectedText: blockTexts.slice(2, 6),
              mode: ['visual', 'blockwise']
            });
          });
          return it('restore previous selection case-2', function() {
            set({
              cursor: [5, 15]
            });
            keystroke('ctrl-v 1 0 h');
            return ensureRestored('3 k', {
              selectedTextOrdered: blockTexts.slice(2, 6),
              mode: ['visual', 'blockwise']
            });
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL3Zpc3VhbC1ibG9ja3dpc2Utc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGlDQUFBO0lBQUE7O0VBQUEsTUFBMEIsT0FBQSxDQUFRLGVBQVIsQ0FBMUIsRUFBQyw2QkFBRCxFQUFjOztFQUNkLEtBQUEsR0FBUSxPQUFBLENBQVEsMEJBQVI7O0VBRVIsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7QUFDM0IsUUFBQTtJQUFBLE9BQTRELEVBQTVELEVBQUMsYUFBRCxFQUFNLGdCQUFOLEVBQWMsbUJBQWQsRUFBeUIsZ0JBQXpCLEVBQWlDLHVCQUFqQyxFQUFnRDtJQUNoRCxXQUFBLEdBQWM7SUFVZCxnQkFBQSxHQUFtQjtJQVVuQixpQkFBQSxHQUFvQjtJQVVwQixVQUFBLEdBQWEsQ0FDWCxhQURXLEVBRVgsYUFGVyxFQUdYLGFBSFcsRUFJWCxhQUpXLEVBS1gsYUFMVyxFQU1YLGFBTlcsRUFPWCxhQVBXO0lBVWIsUUFBQSxHQUFlLElBQUEsUUFBQSxDQUFTLFdBQVQ7SUFFZixlQUFBLEdBQWtCLFNBQUE7TUFDaEIsR0FBQSxDQUFJO1FBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtPQUFKO2FBQ0EsTUFBQSxDQUFPLG9CQUFQLEVBQ0U7UUFBQSxJQUFBLEVBQU0sQ0FBQyxRQUFELEVBQVcsV0FBWCxDQUFOO1FBQ0EsbUJBQUEsRUFBcUIsQ0FDbkIsQ0FBQyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQUQsRUFBUyxDQUFDLENBQUQsRUFBSSxFQUFKLENBQVQsQ0FEbUIsRUFFbkIsQ0FBQyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQUQsRUFBUyxDQUFDLENBQUQsRUFBSSxFQUFKLENBQVQsQ0FGbUIsRUFHbkIsQ0FBQyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQUQs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UUFBRCxFQUFXLFdBQVgsQ0FETjthQURGO1VBSHNDLENBQXhDO2lCQU1BLEVBQUEsQ0FBRyxtQ0FBSCxFQUF3QyxTQUFBO1lBQ3RDLEdBQUEsQ0FBSTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBSjtZQUNBLFNBQUEsQ0FBVSxjQUFWO21CQUNBLGNBQUEsQ0FBZSxLQUFmLEVBQ0U7Y0FBQSxtQkFBQSxFQUFxQixVQUFXLFlBQWhDO2NBQ0EsSUFBQSxFQUFNLENBQUMsUUFBRCxFQUFXLFdBQVgsQ0FETjthQURGO1VBSHNDLENBQXhDO1FBUG9DLENBQXRDO2VBYUEsUUFBQSxDQUFTLHVCQUFULEVBQWtDLFNBQUE7VUFDaEMsRUFBQSxDQUFHLG1DQUFILEVBQXdDLFNBQUE7WUFDdEMsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLEVBQUosQ0FBUjthQUFKO1lBQ0EsU0FBQSxDQUFVLGNBQVY7bUJBQ0EsY0FBQSxDQUFlLEtBQWYsRUFDRTtjQUFBLFlBQUEsRUFBYyxVQUFXLFlBQXpCO2NBQ0EsSUFBQSxFQUFNLENBQUMsUUFBRCxFQUFXLFdBQVgsQ0FETjthQURGO1VBSHNDLENBQXhDO2lCQU1BLEVBQUEsQ0FBRyxtQ0FBSCxFQUF3QyxTQUFBO1lBQ3RDLEdBQUEsQ0FBSTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxFQUFKLENBQVI7YUFBSjtZQUNBLFNBQUEsQ0FBVSxjQUFWO21CQUNBLGNBQUEsQ0FBZSxLQUFmLEVBQ0U7Y0FBQSxtQkFBQSxFQUFxQixVQUFXLFlBQWhDO2NBQ0EsSUFBQSxFQUFNLENBQUMsUUFBRCxFQUFXLFdBQVgsQ0FETjthQURGO1VBSHNDLENBQXhDO1FBUGdDLENBQWxDO01BZDhCLENBQWhDO0lBakRxQixDQUF2QjtFQS9ZMkIsQ0FBN0I7QUFIQSIsInNvdXJjZXNDb250ZW50IjpbIntnZXRWaW1TdGF0ZSwgVGV4dERhdGF9ID0gcmVxdWlyZSAnLi9zcGVjLWhlbHBlcidcbnN3cmFwID0gcmVxdWlyZSAnLi4vbGliL3NlbGVjdGlvbi13cmFwcGVyJ1xuXG5kZXNjcmliZSBcIlZpc3VhbCBCbG9ja3dpc2VcIiwgLT5cbiAgW3NldCwgZW5zdXJlLCBrZXlzdHJva2UsIGVkaXRvciwgZWRpdG9yRWxlbWVudCwgdmltU3RhdGVdID0gW11cbiAgdGV4dEluaXRpYWwgPSBcIlwiXCJcbiAgICAwMTIzNDU2Nzg5MDEyMzQ1Njc4OVxuICAgIDEtLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgMi0tLS1BLS0tLS0tLS0tQi0tLS1cbiAgICAzLS0tLSoqKioqKioqKioqLS0tLVxuICAgIDQtLS0tKysrKysrKysrKystLS0tXG4gICAgNS0tLS1DLS0tLS0tLS0tRC0tLS1cbiAgICA2LS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFwiXCJcIlxuXG4gIHRleHRBZnRlckRlbGV0ZWQgPSBcIlwiXCJcbiAgICAwMTIzNDU2Nzg5MDEyMzQ1Njc4OVxuICAgIDEtLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgMi0tLS1cbiAgICAzLS0tLVxuICAgIDQtLS0tXG4gICAgNS0tLS1cbiAgICA2LS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIFwiXCJcIlxuXG4gIHRleHRBZnRlckluc2VydGVkID0gXCJcIlwiXG4gICAgMDEyMzQ1Njc4OTAxMjM0NTY3ODlcbiAgICAxLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIDItLS0tISEhXG4gICAgMy0tLS0hISFcbiAgICA0LS0tLSEhIVxuICAgIDUtLS0tISEhXG4gICAgNi0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBcIlwiXCJcblxuICBibG9ja1RleHRzID0gW1xuICAgICc1Njc4OTAxMjM0NScgIyAwXG4gICAgJy0tLS0tLS0tLS0tJyAjIDFcbiAgICAnQS0tLS0tLS0tLUInICMgMlxuICAgICcqKioqKioqKioqKicgIyAzXG4gICAgJysrKysrKysrKysrJyAjIDRcbiAgICAnQy0tLS0tLS0tLUQnICMgNVxuICAgICctLS0tLS0tLS0tLScgIyA2XG4gIF1cblxuICB0ZXh0RGF0YSA9IG5ldyBUZXh0RGF0YSh0ZXh0SW5pdGlhbClcblxuICBzZWxlY3RCbG9ja3dpc2UgPSAtPlxuICAgIHNldCBjdXJzb3I6IFsyLCA1XVxuICAgIGVuc3VyZSAndiAzIGogMSAwIGwgY3RybC12JyxcbiAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbXG4gICAgICAgIFtbMiwgNV0sIFsyLCAxNl1dXG4gICAgICAgIFtbMywgNV0sIFszLCAxNl1dXG4gICAgICAgIFtbNCwgNV0sIFs0LCAxNl1dXG4gICAgICAgIFtbNSwgNV0sIFs1LCAxNl1dXG4gICAgICBdXG4gICAgICBzZWxlY3RlZFRleHQ6IGJsb2NrVGV4dHNbMi4uNV1cblxuICBzZWxlY3RCbG9ja3dpc2VSZXZlcnNlbHkgPSAtPlxuICAgIHNldCBjdXJzb3I6IFsyLCAxNV1cbiAgICBlbnN1cmUgJ3YgMyBqIDEgMCBoIGN0cmwtdicsXG4gICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1xuICAgICAgICBbWzIsIDVdLCBbMiwgMTZdXVxuICAgICAgICBbWzMsIDVdLCBbMywgMTZdXVxuICAgICAgICBbWzQsIDVdLCBbNCwgMTZdXVxuICAgICAgICBbWzUsIDVdLCBbNSwgMTZdXVxuICAgICAgXVxuICAgICAgc2VsZWN0ZWRUZXh0OiBibG9ja1RleHRzWzIuLjVdXG5cbiAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uID0gKG8pIC0+XG4gICAgc2VsZWN0aW9ucyA9IGVkaXRvci5nZXRTZWxlY3Rpb25zT3JkZXJlZEJ5QnVmZmVyUG9zaXRpb24oKVxuICAgIGlmIHNlbGVjdGlvbnMubGVuZ3RoIGlzIDFcbiAgICAgIGZpcnN0ID0gbGFzdCA9IHNlbGVjdGlvbnNbMF1cbiAgICBlbHNlXG4gICAgICBbZmlyc3QsIG90aGVycy4uLiwgbGFzdF0gPSBzZWxlY3Rpb25zXG5cbiAgICBoZWFkID0gc3dpdGNoIG8uaGVhZFxuICAgICAgd2hlbiAndG9wJyB0aGVuIGZpcnN0XG4gICAgICB3aGVuICdib3R0b20nIHRoZW4gbGFzdFxuICAgIGJzID0gdmltU3RhdGUuZ2V0TGFzdEJsb2Nrd2lzZVNlbGVjdGlvbigpXG4gICAgZXhwZWN0KGJzLmdldEhlYWRTZWxlY3Rpb24oKSkudG9CZSBoZWFkXG4gICAgdGFpbCA9IHN3aXRjaCBvLnRhaWxcbiAgICAgIHdoZW4gJ3RvcCcgdGhlbiBmaXJzdFxuICAgICAgd2hlbiAnYm90dG9tJyB0aGVuIGxhc3RcbiAgICBleHBlY3QoYnMuZ2V0VGFpbFNlbGVjdGlvbigpKS50b0JlIHRhaWxcblxuICAgIGZvciBzIGluIG90aGVyc1xuICAgICAgZXhwZWN0KGJzLmdldEhlYWRTZWxlY3Rpb24oKSkubm90LnRvQmUgc1xuICAgICAgZXhwZWN0KGJzLmdldFRhaWxTZWxlY3Rpb24oKSkubm90LnRvQmUgc1xuICAgIGlmIG8ucmV2ZXJzZWQ/XG4gICAgICBmb3IgcyBpbiBzZWxlY3Rpb25zXG4gICAgICAgIGV4cGVjdChzLmlzUmV2ZXJzZWQoKSkudG9CZSBvLnJldmVyc2VkXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIGdldFZpbVN0YXRlIChzdGF0ZSwgdmltRWRpdG9yKSAtPlxuICAgICAgdmltU3RhdGUgPSBzdGF0ZVxuICAgICAge2VkaXRvciwgZWRpdG9yRWxlbWVudH0gPSB2aW1TdGF0ZVxuICAgICAge3NldCwgZW5zdXJlLCBrZXlzdHJva2V9ID0gdmltRWRpdG9yXG5cbiAgICBydW5zIC0+XG4gICAgICBzZXQgdGV4dDogdGV4dEluaXRpYWxcblxuICBhZnRlckVhY2ggLT5cbiAgICB2aW1TdGF0ZS5yZXNldE5vcm1hbE1vZGUoKVxuXG4gIGRlc2NyaWJlIFwialwiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldCBjdXJzb3I6IFszLCA1XVxuICAgICAgZW5zdXJlICd2IDEgMCBsIGN0cmwtdicsXG4gICAgICAgIHNlbGVjdGVkVGV4dDogYmxvY2tUZXh0c1szXVxuICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuXG4gICAgaXQgXCJhZGQgc2VsZWN0aW9uIHRvIGRvd24gZGlyZWN0aW9uXCIsIC0+XG4gICAgICBlbnN1cmUgJ2onLCBzZWxlY3RlZFRleHQ6IGJsb2NrVGV4dHNbMy4uNF1cbiAgICAgIGVuc3VyZSAnaicsIHNlbGVjdGVkVGV4dDogYmxvY2tUZXh0c1szLi41XVxuXG4gICAgaXQgXCJkZWxldGUgc2VsZWN0aW9uIHdoZW4gYmxvY3dpc2UgaXMgcmV2ZXJzZWRcIiwgLT5cbiAgICAgIGVuc3VyZSAnMyBrJywgc2VsZWN0ZWRUZXh0T3JkZXJlZDogYmxvY2tUZXh0c1swLi4zXVxuICAgICAgZW5zdXJlICdqJywgc2VsZWN0ZWRUZXh0T3JkZXJlZDogYmxvY2tUZXh0c1sxLi4zXVxuICAgICAgZW5zdXJlICcyIGonLCBzZWxlY3RlZFRleHRPcmRlcmVkOiBibG9ja1RleHRzWzNdXG5cbiAgICBpdCBcImtlZXAgdGFpbCByb3cgd2hlbiByZXZlcnNlZCBzdGF0dXMgY2hhbmdlZFwiLCAtPlxuICAgICAgZW5zdXJlICdqJywgc2VsZWN0ZWRUZXh0OiBibG9ja1RleHRzWzMuLjRdXG4gICAgICBlbnN1cmUgJzIgaycsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IGJsb2NrVGV4dHNbMi4uM11cblxuICBkZXNjcmliZSBcImtcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMywgNV1cbiAgICAgIGVuc3VyZSAndiAxIDAgbCBjdHJsLXYnLFxuICAgICAgICBzZWxlY3RlZFRleHQ6IGJsb2NrVGV4dHNbM11cbiAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cblxuICAgIGl0IFwiYWRkIHNlbGVjdGlvbiB0byB1cCBkaXJlY3Rpb25cIiwgLT5cbiAgICAgIGVuc3VyZSAnaycsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IGJsb2NrVGV4dHNbMi4uM11cbiAgICAgIGVuc3VyZSAnaycsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IGJsb2NrVGV4dHNbMS4uM11cblxuICAgIGl0IFwiZGVsZXRlIHNlbGVjdGlvbiB3aGVuIGJsb2N3aXNlIGlzIHJldmVyc2VkXCIsIC0+XG4gICAgICBlbnN1cmUgJzMgaicsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IGJsb2NrVGV4dHNbMy4uNl1cbiAgICAgIGVuc3VyZSAnaycsIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IGJsb2NrVGV4dHNbMy4uNV1cbiAgICAgIGVuc3VyZSAnMiBrJywgc2VsZWN0ZWRUZXh0T3JkZXJlZDogYmxvY2tUZXh0c1szXVxuXG4gICMgRklYTUUgYWRkIEMsIEQgc3BlYyBmb3Igc2VsZWN0QmxvY2t3aXNlUmV2ZXJzZWx5KCkgc2l0dWF0aW9uXG4gIGRlc2NyaWJlIFwiQ1wiLCAtPlxuICAgIGVuc3VyZUNoYW5nZSA9IC0+XG4gICAgICBlbnN1cmUgJ0MnLFxuICAgICAgICBtb2RlOiAnaW5zZXJ0J1xuICAgICAgICBjdXJzb3I6IFtbMiwgNV0sIFszLCA1XSwgWzQsIDVdLCBbNSwgNV0gXVxuICAgICAgICB0ZXh0OiB0ZXh0QWZ0ZXJEZWxldGVkXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dChcIiEhIVwiKVxuICAgICAgZW5zdXJlXG4gICAgICAgIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgIGN1cnNvcjogW1syLCA4XSwgWzMsIDhdLCBbNCwgOF0sIFs1LCA4XV1cbiAgICAgICAgdGV4dDogdGV4dEFmdGVySW5zZXJ0ZWRcblxuICAgIGl0IFwiY2hhbmdlLXRvLWxhc3QtY2hhcmFjdGVyLW9mLWxpbmUgZm9yIGVhY2ggc2VsZWN0aW9uXCIsIC0+XG4gICAgICBzZWxlY3RCbG9ja3dpc2UoKVxuICAgICAgZW5zdXJlQ2hhbmdlKClcblxuICAgIGl0IFwiW3NlbGVjdGlvbiByZXZlcnNlZF0gY2hhbmdlLXRvLWxhc3QtY2hhcmFjdGVyLW9mLWxpbmUgZm9yIGVhY2ggc2VsZWN0aW9uXCIsIC0+XG4gICAgICBzZWxlY3RCbG9ja3dpc2VSZXZlcnNlbHkoKVxuICAgICAgZW5zdXJlQ2hhbmdlKClcblxuICBkZXNjcmliZSBcIkRcIiwgLT5cbiAgICBlbnN1cmVEZWxldGUgPSAtPlxuICAgICAgZW5zdXJlICdEJyxcbiAgICAgICAgdGV4dDogdGV4dEFmdGVyRGVsZXRlZFxuICAgICAgICBjdXJzb3I6IFsyLCA0XVxuICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgaXQgXCJkZWxldGUtdG8tbGFzdC1jaGFyYWN0ZXItb2YtbGluZSBmb3IgZWFjaCBzZWxlY3Rpb25cIiwgLT5cbiAgICAgIHNlbGVjdEJsb2Nrd2lzZSgpXG4gICAgICBlbnN1cmVEZWxldGUoKVxuICAgIGl0IFwiW3NlbGVjdGlvbiByZXZlcnNlZF0gZGVsZXRlLXRvLWxhc3QtY2hhcmFjdGVyLW9mLWxpbmUgZm9yIGVhY2ggc2VsZWN0aW9uXCIsIC0+XG4gICAgICBzZWxlY3RCbG9ja3dpc2VSZXZlcnNlbHkoKVxuICAgICAgZW5zdXJlRGVsZXRlKClcblxuICBkZXNjcmliZSBcIklcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZWxlY3RCbG9ja3dpc2UoKVxuICAgIGl0IFwiZW50ZXIgaW5zZXJ0IG1vZGUgd2l0aCBlYWNoIGN1cnNvcnMgcG9zaXRpb24gc2V0IHRvIHN0YXJ0IG9mIHNlbGVjdGlvblwiLCAtPlxuICAgICAga2V5c3Ryb2tlICdJJ1xuICAgICAgZWRpdG9yLmluc2VydFRleHQgXCIhISFcIlxuICAgICAgZW5zdXJlXG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIDAxMjM0NTY3ODkwMTIzNDU2Nzg5XG4gICAgICAgICAgMS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICAyLS0tLSEhIUEtLS0tLS0tLS1CLS0tLVxuICAgICAgICAgIDMtLS0tISEhKioqKioqKioqKiotLS0tXG4gICAgICAgICAgNC0tLS0hISErKysrKysrKysrKy0tLS1cbiAgICAgICAgICA1LS0tLSEhIUMtLS0tLS0tLS1ELS0tLVxuICAgICAgICAgIDYtLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGN1cnNvcjogW1xuICAgICAgICAgICAgWzIsIDhdLFxuICAgICAgICAgICAgWzMsIDhdLFxuICAgICAgICAgICAgWzQsIDhdLFxuICAgICAgICAgICAgWzUsIDhdLFxuICAgICAgICAgIF1cbiAgICAgICAgbW9kZTogJ2luc2VydCdcblxuICBkZXNjcmliZSBcIkFcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZWxlY3RCbG9ja3dpc2UoKVxuICAgIGl0IFwiZW50ZXIgaW5zZXJ0IG1vZGUgd2l0aCBlYWNoIGN1cnNvcnMgcG9zaXRpb24gc2V0IHRvIGVuZCBvZiBzZWxlY3Rpb25cIiwgLT5cbiAgICAgIGtleXN0cm9rZSAnQSdcbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiISEhXCJcbiAgICAgIGVuc3VyZVxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAwMTIzNDU2Nzg5MDEyMzQ1Njc4OVxuICAgICAgICAgIDEtLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICAgMi0tLS1BLS0tLS0tLS0tQiEhIS0tLS1cbiAgICAgICAgICAzLS0tLSoqKioqKioqKioqISEhLS0tLVxuICAgICAgICAgIDQtLS0tKysrKysrKysrKyshISEtLS0tXG4gICAgICAgICAgNS0tLS1DLS0tLS0tLS0tRCEhIS0tLS1cbiAgICAgICAgICA2LS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFtcbiAgICAgICAgICAgIFsyLCAxOV0sXG4gICAgICAgICAgICBbMywgMTldLFxuICAgICAgICAgICAgWzQsIDE5XSxcbiAgICAgICAgICAgIFs1LCAxOV0sXG4gICAgICAgICAgXVxuXG4gIGRlc2NyaWJlIFwibyBhbmQgTyBrZXliaW5kaW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2VsZWN0QmxvY2t3aXNlKClcblxuICAgIGRlc2NyaWJlICdvJywgLT5cbiAgICAgIGl0IFwiY2hhbmdlIGJsb2Nrd2lzZUhlYWQgdG8gb3Bwb3NpdGUgc2lkZSBhbmQgcmV2ZXJzZSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAga2V5c3Ryb2tlICdvJ1xuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ3RvcCcsIHRhaWw6ICdib3R0b20nLCByZXZlcnNlZDogdHJ1ZVxuXG4gICAgICAgIGtleXN0cm9rZSAnbydcbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICdib3R0b20nLCB0YWlsOiAndG9wJywgcmV2ZXJzZWQ6IGZhbHNlXG4gICAgZGVzY3JpYmUgJ2NhcGl0YWwgTycsIC0+XG4gICAgICBpdCBcInJldmVyc2UgZWFjaCBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAga2V5c3Ryb2tlICdPJ1xuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ2JvdHRvbScsIHRhaWw6ICd0b3AnLCByZXZlcnNlZDogdHJ1ZVxuICAgICAgICBrZXlzdHJva2UgJ08nXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAnYm90dG9tJywgdGFpbDogJ3RvcCcsIHJldmVyc2VkOiBmYWxzZVxuXG4gIGRlc2NyaWJlIFwic2hpZnQgZnJvbSBjaGFyYWN0ZXJ3aXNlIHRvIGJsb2Nrd2lzZVwiLCAtPlxuICAgIGRlc2NyaWJlIFwid2hlbiBzZWxlY3Rpb24gaXMgbm90IHJldmVyc2VkXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsyLCA1XVxuICAgICAgICBlbnN1cmUgJ3YnLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogJ0EnXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG5cbiAgICAgIGl0ICdjYXNlLTEnLCAtPlxuICAgICAgICBlbnN1cmUgJzMgaiBjdHJsLXYnLFxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1xuICAgICAgICAgICAgJ0EnXG4gICAgICAgICAgICAnKidcbiAgICAgICAgICAgICcrJ1xuICAgICAgICAgICAgJ0MnXG4gICAgICAgICAgXVxuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ2JvdHRvbScsIHRhaWw6ICd0b3AnLCByZXZlcnNlZDogZmFsc2VcblxuICAgICAgaXQgJ2Nhc2UtMicsIC0+XG4gICAgICAgIGVuc3VyZSAnaCAzIGogY3RybC12JyxcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgICAgIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcbiAgICAgICAgICAgICctQSdcbiAgICAgICAgICAgICctKidcbiAgICAgICAgICAgICctKydcbiAgICAgICAgICAgICctQydcbiAgICAgICAgICBdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAnYm90dG9tJywgdGFpbDogJ3RvcCcsIHJldmVyc2VkOiB0cnVlXG5cbiAgICAgIGl0ICdjYXNlLTMnLCAtPlxuICAgICAgICBlbnN1cmUgJzIgaCAzIGogY3RybC12JyxcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgICAgIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcbiAgICAgICAgICAgICctLUEnXG4gICAgICAgICAgICAnLS0qJ1xuICAgICAgICAgICAgJy0tKydcbiAgICAgICAgICAgICctLUMnXG4gICAgICAgICAgXVxuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ2JvdHRvbScsIHRhaWw6ICd0b3AnLCByZXZlcnNlZDogdHJ1ZVxuXG4gICAgICBpdCAnY2FzZS00JywgLT5cbiAgICAgICAgZW5zdXJlICdsIDMgaiBjdHJsLXYnLFxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1xuICAgICAgICAgICAgJ0EtJ1xuICAgICAgICAgICAgJyoqJ1xuICAgICAgICAgICAgJysrJ1xuICAgICAgICAgICAgJ0MtJ1xuICAgICAgICAgIF1cbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICdib3R0b20nLCB0YWlsOiAndG9wJywgcmV2ZXJzZWQ6IGZhbHNlXG4gICAgICBpdCAnY2FzZS01JywgLT5cbiAgICAgICAgZW5zdXJlICcyIGwgMyBqIGN0cmwtdicsXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXG4gICAgICAgICAgICAnQS0tJ1xuICAgICAgICAgICAgJyoqKidcbiAgICAgICAgICAgICcrKysnXG4gICAgICAgICAgICAnQy0tJ1xuICAgICAgICAgIF1cbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICdib3R0b20nLCB0YWlsOiAndG9wJywgcmV2ZXJzZWQ6IGZhbHNlXG5cbiAgICBkZXNjcmliZSBcIndoZW4gc2VsZWN0aW9uIGlzIHJldmVyc2VkXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFs1LCA1XVxuICAgICAgICBlbnN1cmUgJ3YnLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogJ0MnXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG5cbiAgICAgIGl0ICdjYXNlLTEnLCAtPlxuICAgICAgICBlbnN1cmUgJzMgayBjdHJsLXYnLFxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1xuICAgICAgICAgICAgJ0EnXG4gICAgICAgICAgICAnKidcbiAgICAgICAgICAgICcrJ1xuICAgICAgICAgICAgJ0MnXG4gICAgICAgICAgXVxuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ3RvcCcsIHRhaWw6ICdib3R0b20nLCByZXZlcnNlZDogdHJ1ZVxuXG4gICAgICBpdCAnY2FzZS0yJywgLT5cbiAgICAgICAgZW5zdXJlICdoIDMgayBjdHJsLXYnLFxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1xuICAgICAgICAgICAgJy1BJ1xuICAgICAgICAgICAgJy0qJ1xuICAgICAgICAgICAgJy0rJ1xuICAgICAgICAgICAgJy1DJ1xuICAgICAgICAgIF1cbiAgICAgICAgZW5zdXJlQmxvY2t3aXNlU2VsZWN0aW9uIGhlYWQ6ICd0b3AnLCB0YWlsOiAnYm90dG9tJywgcmV2ZXJzZWQ6IHRydWVcblxuICAgICAgaXQgJ2Nhc2UtMycsIC0+XG4gICAgICAgIGVuc3VyZSAnMiBoIDMgayBjdHJsLXYnLFxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1xuICAgICAgICAgICAgJy0tQSdcbiAgICAgICAgICAgICctLSonXG4gICAgICAgICAgICAnLS0rJ1xuICAgICAgICAgICAgJy0tQydcbiAgICAgICAgICBdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAndG9wJywgdGFpbDogJ2JvdHRvbScsIHJldmVyc2VkOiB0cnVlXG5cbiAgICAgIGl0ICdjYXNlLTQnLCAtPlxuICAgICAgICBlbnN1cmUgJ2wgMyBrIGN0cmwtdicsXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZFRleHRPcmRlcmVkOiBbXG4gICAgICAgICAgICAnQS0nXG4gICAgICAgICAgICAnKionXG4gICAgICAgICAgICAnKysnXG4gICAgICAgICAgICAnQy0nXG4gICAgICAgICAgXVxuICAgICAgICBlbnN1cmVCbG9ja3dpc2VTZWxlY3Rpb24gaGVhZDogJ3RvcCcsIHRhaWw6ICdib3R0b20nLCByZXZlcnNlZDogZmFsc2VcblxuICAgICAgaXQgJ2Nhc2UtNScsIC0+XG4gICAgICAgIGVuc3VyZSAnMiBsIDMgayBjdHJsLXYnLFxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0T3JkZXJlZDogW1xuICAgICAgICAgICAgJ0EtLSdcbiAgICAgICAgICAgICcqKionXG4gICAgICAgICAgICAnKysrJ1xuICAgICAgICAgICAgJ0MtLSdcbiAgICAgICAgICBdXG4gICAgICAgIGVuc3VyZUJsb2Nrd2lzZVNlbGVjdGlvbiBoZWFkOiAndG9wJywgdGFpbDogJ2JvdHRvbScsIHJldmVyc2VkOiBmYWxzZVxuXG4gIGRlc2NyaWJlIFwic2hpZnQgZnJvbSBibG9ja3dpc2UgdG8gY2hhcmFjdGVyd2lzZVwiLCAtPlxuICAgIHByZXNlcnZlU2VsZWN0aW9uID0gLT5cbiAgICAgIHNlbGVjdGVkVGV4dCA9IGVkaXRvci5nZXRTZWxlY3RlZFRleHQoKVxuICAgICAgc2VsZWN0ZWRCdWZmZXJSYW5nZSA9IGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKClcbiAgICAgIGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgICBtb2RlID0gW3ZpbVN0YXRlLm1vZGUsIHZpbVN0YXRlLnN1Ym1vZGVdXG4gICAgICB7c2VsZWN0ZWRUZXh0LCBzZWxlY3RlZEJ1ZmZlclJhbmdlLCBjdXJzb3IsIG1vZGV9XG5cbiAgICBlbnN1cmVDaGFyYWN0ZXJ3aXNlV2FzUmVzdG9yZWQgPSAoa2V5c3Ryb2tlKSAtPlxuICAgICAgZW5zdXJlIGtleXN0cm9rZSwgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG4gICAgICBjaGFyYWN0ZXJ3aXNlU3RhdGUgPSBwcmVzZXJ2ZVNlbGVjdGlvbigpXG4gICAgICBlbnN1cmUgJ2N0cmwtdicsIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICBlbnN1cmUgJ3YnLCBjaGFyYWN0ZXJ3aXNlU3RhdGVcblxuICAgIGRlc2NyaWJlIFwid2hlbiBzZWxlY3Rpb24gaXMgbm90IHJldmVyc2VkXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsyLCA1XVxuICAgICAgaXQgJ2Nhc2UtMScsIC0+IGVuc3VyZUNoYXJhY3Rlcndpc2VXYXNSZXN0b3JlZCgndicpXG4gICAgICBpdCAnY2FzZS0yJywgLT4gZW5zdXJlQ2hhcmFjdGVyd2lzZVdhc1Jlc3RvcmVkKCd2IDMgaicpXG4gICAgICBpdCAnY2FzZS0zJywgLT4gZW5zdXJlQ2hhcmFjdGVyd2lzZVdhc1Jlc3RvcmVkKCd2IGggMyBqJylcbiAgICAgIGl0ICdjYXNlLTQnLCAtPiBlbnN1cmVDaGFyYWN0ZXJ3aXNlV2FzUmVzdG9yZWQoJ3YgMiBoIDMgaicpXG4gICAgICBpdCAnY2FzZS01JywgLT4gZW5zdXJlQ2hhcmFjdGVyd2lzZVdhc1Jlc3RvcmVkKCd2IGwgMyBqJylcbiAgICAgIGl0ICdjYXNlLTYnLCAtPiBlbnN1cmVDaGFyYWN0ZXJ3aXNlV2FzUmVzdG9yZWQoJ3YgMiBsIDMgaicpXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHNlbGVjdGlvbiBpcyByZXZlcnNlZFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbNSwgNV1cbiAgICAgIGl0ICdjYXNlLTEnLCAtPiBlbnN1cmVDaGFyYWN0ZXJ3aXNlV2FzUmVzdG9yZWQoJ3YnKVxuICAgICAgaXQgJ2Nhc2UtMicsIC0+IGVuc3VyZUNoYXJhY3Rlcndpc2VXYXNSZXN0b3JlZCgndiAzIGsnKVxuICAgICAgaXQgJ2Nhc2UtMycsIC0+IGVuc3VyZUNoYXJhY3Rlcndpc2VXYXNSZXN0b3JlZCgndiBoIDMgaycpXG4gICAgICBpdCAnY2FzZS00JywgLT4gZW5zdXJlQ2hhcmFjdGVyd2lzZVdhc1Jlc3RvcmVkKCd2IDIgaCAzIGsnKVxuICAgICAgaXQgJ2Nhc2UtNScsIC0+IGVuc3VyZUNoYXJhY3Rlcndpc2VXYXNSZXN0b3JlZCgndiBsIDMgaycpXG4gICAgICBpdCAnY2FzZS02JywgLT4gZW5zdXJlQ2hhcmFjdGVyd2lzZVdhc1Jlc3RvcmVkKCd2IDIgbCAzIGsnKVxuICAgICAgaXQgJ2Nhc2UtNycsIC0+IHNldCBjdXJzb3I6IFs1LCAwXTsgZW5zdXJlQ2hhcmFjdGVyd2lzZVdhc1Jlc3RvcmVkKCd2IDUgbCAzIGsnKVxuXG4gICMgW0ZJWE1FXSBub3QgYXBwcm9wcmlhdGUgcHV0IGhlcmUsIHJlLWNvbnNpZGVyIGFsbCBzcGVjIGZpbGUgbGF5b3V0IGxhdGVyLlxuICBkZXNjcmliZSBcImd2IGZlYXR1cmVcIiwgLT5cbiAgICBwcmVzZXJ2ZVNlbGVjdGlvbiA9IC0+XG4gICAgICBzZWxlY3Rpb25zID0gZWRpdG9yLmdldFNlbGVjdGlvbnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbigpXG4gICAgICBzZWxlY3RlZFRleHRPcmRlcmVkID0gKHMuZ2V0VGV4dCgpIGZvciBzIGluIHNlbGVjdGlvbnMpXG4gICAgICBzZWxlY3RlZEJ1ZmZlclJhbmdlT3JkZXJlZCA9IChzLmdldEJ1ZmZlclJhbmdlKCkgZm9yIHMgaW4gc2VsZWN0aW9ucylcbiAgICAgIGN1cnNvciA9IChzLmdldEhlYWRTY3JlZW5Qb3NpdGlvbigpIGZvciBzIGluIHNlbGVjdGlvbnMpXG4gICAgICBtb2RlID0gW3ZpbVN0YXRlLm1vZGUsIHZpbVN0YXRlLnN1Ym1vZGVdXG4gICAgICB7c2VsZWN0ZWRUZXh0T3JkZXJlZCwgc2VsZWN0ZWRCdWZmZXJSYW5nZU9yZGVyZWQsIGN1cnNvciwgbW9kZX1cblxuICAgIGVuc3VyZVJlc3RvcmVkID0gKGtleXN0cm9rZSwgc3BlYykgLT5cbiAgICAgIGVuc3VyZSBrZXlzdHJva2UsIHNwZWNcbiAgICAgIHByZXNlcnZlZCA9IHByZXNlcnZlU2VsZWN0aW9uKClcbiAgICAgIGVuc3VyZSAnZXNjYXBlIGogaicsIG1vZGU6ICdub3JtYWwnLCBzZWxlY3RlZFRleHQ6ICcnXG4gICAgICBlbnN1cmUgJ2cgdicsIHByZXNlcnZlZFxuXG4gICAgZGVzY3JpYmUgXCJsaW5ld2lzZSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzIsIDBdXG4gICAgICBkZXNjcmliZSBcInNlbGVjdGlvbiBpcyBub3QgcmV2ZXJzZWRcIiwgLT5cbiAgICAgICAgaXQgJ3Jlc3RvcmUgcHJldmlvdXMgc2VsZWN0aW9uJywgLT5cbiAgICAgICAgICBlbnN1cmVSZXN0b3JlZCAnViBqJyxcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogdGV4dERhdGEuZ2V0TGluZXMoWzIsIDNdKVxuICAgICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuICAgICAgZGVzY3JpYmUgXCJzZWxlY3Rpb24gaXMgcmV2ZXJzZWRcIiwgLT5cbiAgICAgICAgaXQgJ3Jlc3RvcmUgcHJldmlvdXMgc2VsZWN0aW9uJywgLT5cbiAgICAgICAgICBlbnN1cmVSZXN0b3JlZCAnViBrJyxcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogdGV4dERhdGEuZ2V0TGluZXMoWzEsIDJdKVxuICAgICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuXG4gICAgZGVzY3JpYmUgXCJjaGFyYWN0ZXJ3aXNlIHNlbGVjdGlvblwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMF1cbiAgICAgIGRlc2NyaWJlIFwic2VsZWN0aW9uIGlzIG5vdCByZXZlcnNlZFwiLCAtPlxuICAgICAgICBpdCAncmVzdG9yZSBwcmV2aW91cyBzZWxlY3Rpb24nLCAtPlxuICAgICAgICAgIGVuc3VyZVJlc3RvcmVkICd2IGonLFxuICAgICAgICAgICAgc2VsZWN0ZWRUZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDItLS0tQS0tLS0tLS0tLUItLS0tXG4gICAgICAgICAgICAzXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgZGVzY3JpYmUgXCJzZWxlY3Rpb24gaXMgcmV2ZXJzZWRcIiwgLT5cbiAgICAgICAgaXQgJ3Jlc3RvcmUgcHJldmlvdXMgc2VsZWN0aW9uJywgLT5cbiAgICAgICAgICBlbnN1cmVSZXN0b3JlZCAndiBrJyxcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogXCJcIlwiXG4gICAgICAgICAgICAxLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgMlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cblxuICAgIGRlc2NyaWJlIFwiYmxvY2t3aXNlIHNlbGVjdGlvblwiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJzZWxlY3Rpb24gaXMgbm90IHJldmVyc2VkXCIsIC0+XG4gICAgICAgIGl0ICdyZXN0b3JlIHByZXZpb3VzIHNlbGVjdGlvbiBjYXNlLTEnLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsyLCA1XVxuICAgICAgICAgIGtleXN0cm9rZSAnY3RybC12IDEgMCBsJ1xuICAgICAgICAgIGVuc3VyZVJlc3RvcmVkICczIGonLFxuICAgICAgICAgICAgc2VsZWN0ZWRUZXh0OiBibG9ja1RleHRzWzIuLjVdXG4gICAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgICBpdCAncmVzdG9yZSBwcmV2aW91cyBzZWxlY3Rpb24gY2FzZS0yJywgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbNSwgNV1cbiAgICAgICAgICBrZXlzdHJva2UgJ2N0cmwtdiAxIDAgbCdcbiAgICAgICAgICBlbnN1cmVSZXN0b3JlZCAnMyBrJyxcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IGJsb2NrVGV4dHNbMi4uNV1cbiAgICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICBkZXNjcmliZSBcInNlbGVjdGlvbiBpcyByZXZlcnNlZFwiLCAtPlxuICAgICAgICBpdCAncmVzdG9yZSBwcmV2aW91cyBzZWxlY3Rpb24gY2FzZS0xJywgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMTVdXG4gICAgICAgICAga2V5c3Ryb2tlICdjdHJsLXYgMSAwIGgnXG4gICAgICAgICAgZW5zdXJlUmVzdG9yZWQgJzMgaicsXG4gICAgICAgICAgICBzZWxlY3RlZFRleHQ6IGJsb2NrVGV4dHNbMi4uNV1cbiAgICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgIGl0ICdyZXN0b3JlIHByZXZpb3VzIHNlbGVjdGlvbiBjYXNlLTInLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFs1LCAxNV1cbiAgICAgICAgICBrZXlzdHJva2UgJ2N0cmwtdiAxIDAgaCdcbiAgICAgICAgICBlbnN1cmVSZXN0b3JlZCAnMyBrJyxcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IGJsb2NrVGV4dHNbMi4uNV1cbiAgICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4iXX0=
