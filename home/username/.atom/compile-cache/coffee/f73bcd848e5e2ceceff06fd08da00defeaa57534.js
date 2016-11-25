(function() {
  var ActivateInsertMode, ActivateReplaceMode, Change, ChangeOccurrence, ChangeOccurrenceInAFunctionOrInnerParagraph, ChangeOccurrenceInAPersistentSelection, ChangeToLastCharacterOfLine, InsertAboveWithNewline, InsertAfter, InsertAfterEndOfLine, InsertAtBeginningOfLine, InsertAtEndOfInnerSmartWord, InsertAtEndOfTarget, InsertAtHeadOfTarget, InsertAtLastInsert, InsertAtNextFoldStart, InsertAtPreviousFoldStart, InsertAtStartOfInnerSmartWord, InsertAtStartOfTarget, InsertAtTailOfTarget, InsertBelowWithNewline, InsertByTarget, Operator, Substitute, SubstituteLine, _, moveCursorLeft, moveCursorRight, ref, settings, swrap,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('./utils'), moveCursorLeft = ref.moveCursorLeft, moveCursorRight = ref.moveCursorRight;

  swrap = require('./selection-wrapper');

  settings = require('./settings');

  Operator = require('./base').getClass('Operator');

  ActivateInsertMode = (function(superClass) {
    extend(ActivateInsertMode, superClass);

    function ActivateInsertMode() {
      return ActivateInsertMode.__super__.constructor.apply(this, arguments);
    }

    ActivateInsertMode.extend();

    ActivateInsertMode.prototype.requireTarget = false;

    ActivateInsertMode.prototype.flashTarget = false;

    ActivateInsertMode.prototype.checkpoint = null;

    ActivateInsertMode.prototype.finalSubmode = null;

    ActivateInsertMode.prototype.supportInsertionCount = true;

    ActivateInsertMode.prototype.observeWillDeactivateMode = function() {
      var disposable;
      return disposable = this.vimState.modeManager.preemptWillDeactivateMode((function(_this) {
        return function(arg) {
          var change, mode, textByUserInput;
          mode = arg.mode;
          if (mode !== 'insert') {
            return;
          }
          disposable.dispose();
          _this.vimState.mark.set('^', _this.editor.getCursorBufferPosition());
          textByUserInput = '';
          if (change = _this.getChangeSinceCheckpoint('insert')) {
            _this.lastChange = change;
            _this.vimState.mark.set('[', change.start);
            _this.vimState.mark.set(']', change.start.traverse(change.newExtent));
            textByUserInput = change.newText;
          }
          _this.vimState.register.set('.', {
            text: textByUserInput
          });
          _.times(_this.getInsertionCount(), function() {
            var i, len, ref1, results, selection, text;
            text = _this.textByOperator + textByUserInput;
            ref1 = _this.editor.getSelections();
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
              selection = ref1[i];
              results.push(selection.insertText(text, {
                autoIndent: true
              }));
            }
            return results;
          });
          if (settings.get('groupChangesWhenLeavingInsertMode')) {
            return _this.editor.groupChangesSinceCheckpoint(_this.getCheckpoint('undo'));
          }
        };
      })(this));
    };

    ActivateInsertMode.prototype.initialize = function() {
      ActivateInsertMode.__super__.initialize.apply(this, arguments);
      this.checkpoint = {};
      if (!this.isRepeated()) {
        this.setCheckpoint('undo');
      }
      return this.observeWillDeactivateMode();
    };

    ActivateInsertMode.prototype.setCheckpoint = function(purpose) {
      return this.checkpoint[purpose] = this.editor.createCheckpoint();
    };

    ActivateInsertMode.prototype.getCheckpoint = function(purpose) {
      return this.checkpoint[purpose];
    };

    ActivateInsertMode.prototype.getChangeSinceCheckpoint = function(purpose) {
      var checkpoint;
      checkpoint = this.getCheckpoint(purpose);
      return this.editor.buffer.getChangesSinceCheckpoint(checkpoint)[0];
    };

    ActivateInsertMode.prototype.replayLastChange = function(selection) {
      var deletionEnd, deletionStart, newExtent, newText, oldExtent, ref1, start, traversalToStartOfDelete;
      if (this.lastChange != null) {
        ref1 = this.lastChange, start = ref1.start, newExtent = ref1.newExtent, oldExtent = ref1.oldExtent, newText = ref1.newText;
        if (!oldExtent.isZero()) {
          traversalToStartOfDelete = start.traversalFrom(this.topCursorPositionAtInsertionStart);
          deletionStart = selection.cursor.getBufferPosition().traverse(traversalToStartOfDelete);
          deletionEnd = deletionStart.traverse(oldExtent);
          selection.setBufferRange([deletionStart, deletionEnd]);
        }
      } else {
        newText = '';
      }
      return selection.insertText(newText, {
        autoIndent: true
      });
    };

    ActivateInsertMode.prototype.repeatInsert = function(selection, text) {
      return this.replayLastChange(selection);
    };

    ActivateInsertMode.prototype.getInsertionCount = function() {
      if (this.insertionCount == null) {
        this.insertionCount = this.supportInsertionCount ? this.getCount() - 1 : 0;
      }
      return this.insertionCount;
    };

    ActivateInsertMode.prototype.execute = function() {
      var ref1, ref2, topCursor;
      if (this.isRepeated()) {
        if (!this["instanceof"]('Change')) {
          this.flashTarget = this.trackChange = true;
          this.emitDidSelectTarget();
        }
        this.editor.transact((function(_this) {
          return function() {
            var i, len, ref1, ref2, ref3, results, selection;
            ref1 = _this.editor.getSelections();
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
              selection = ref1[i];
              _this.repeatInsert(selection, (ref2 = (ref3 = _this.lastChange) != null ? ref3.newText : void 0) != null ? ref2 : '');
              results.push(moveCursorLeft(selection.cursor));
            }
            return results;
          };
        })(this));
        if (settings.get('clearMultipleCursorsOnEscapeInsertMode')) {
          return this.editor.clearSelections();
        }
      } else {
        if (this.getInsertionCount() > 0) {
          this.textByOperator = (ref1 = (ref2 = this.getChangeSinceCheckpoint('undo')) != null ? ref2.newText : void 0) != null ? ref1 : '';
        }
        this.setCheckpoint('insert');
        topCursor = this.editor.getCursorsOrderedByBufferPosition()[0];
        this.topCursorPositionAtInsertionStart = topCursor.getBufferPosition();
        return this.vimState.activate('insert', this.finalSubmode);
      }
    };

    return ActivateInsertMode;

  })(Operator);

  ActivateReplaceMode = (function(superClass) {
    extend(ActivateReplaceMode, superClass);

    function ActivateReplaceMode() {
      return ActivateReplaceMode.__super__.constructor.apply(this, arguments);
    }

    ActivateReplaceMode.extend();

    ActivateReplaceMode.prototype.finalSubmode = 'replace';

    ActivateReplaceMode.prototype.repeatInsert = function(selection, text) {
      var char, i, len;
      for (i = 0, len = text.length; i < len; i++) {
        char = text[i];
        if (!(char !== "\n")) {
          continue;
        }
        if (selection.cursor.isAtEndOfLine()) {
          break;
        }
        selection.selectRight();
      }
      return selection.insertText(text, {
        autoIndent: false
      });
    };

    return ActivateReplaceMode;

  })(ActivateInsertMode);

  InsertAfter = (function(superClass) {
    extend(InsertAfter, superClass);

    function InsertAfter() {
      return InsertAfter.__super__.constructor.apply(this, arguments);
    }

    InsertAfter.extend();

    InsertAfter.prototype.execute = function() {
      var cursor, i, len, ref1;
      ref1 = this.editor.getCursors();
      for (i = 0, len = ref1.length; i < len; i++) {
        cursor = ref1[i];
        moveCursorRight(cursor);
      }
      return InsertAfter.__super__.execute.apply(this, arguments);
    };

    return InsertAfter;

  })(ActivateInsertMode);

  InsertAfterEndOfLine = (function(superClass) {
    extend(InsertAfterEndOfLine, superClass);

    function InsertAfterEndOfLine() {
      return InsertAfterEndOfLine.__super__.constructor.apply(this, arguments);
    }

    InsertAfterEndOfLine.extend();

    InsertAfterEndOfLine.prototype.execute = function() {
      this.editor.moveToEndOfLine();
      return InsertAfterEndOfLine.__super__.execute.apply(this, arguments);
    };

    return InsertAfterEndOfLine;

  })(ActivateInsertMode);

  InsertAtBeginningOfLine = (function(superClass) {
    extend(InsertAtBeginningOfLine, superClass);

    function InsertAtBeginningOfLine() {
      return InsertAtBeginningOfLine.__super__.constructor.apply(this, arguments);
    }

    InsertAtBeginningOfLine.extend();

    InsertAtBeginningOfLine.prototype.execute = function() {
      this.editor.moveToBeginningOfLine();
      this.editor.moveToFirstCharacterOfLine();
      return InsertAtBeginningOfLine.__super__.execute.apply(this, arguments);
    };

    return InsertAtBeginningOfLine;

  })(ActivateInsertMode);

  InsertAtLastInsert = (function(superClass) {
    extend(InsertAtLastInsert, superClass);

    function InsertAtLastInsert() {
      return InsertAtLastInsert.__super__.constructor.apply(this, arguments);
    }

    InsertAtLastInsert.extend();

    InsertAtLastInsert.prototype.execute = function() {
      var point;
      if ((point = this.vimState.mark.get('^'))) {
        this.editor.setCursorBufferPosition(point);
        this.editor.scrollToCursorPosition({
          center: true
        });
      }
      return InsertAtLastInsert.__super__.execute.apply(this, arguments);
    };

    return InsertAtLastInsert;

  })(ActivateInsertMode);

  InsertAboveWithNewline = (function(superClass) {
    extend(InsertAboveWithNewline, superClass);

    function InsertAboveWithNewline() {
      return InsertAboveWithNewline.__super__.constructor.apply(this, arguments);
    }

    InsertAboveWithNewline.extend();

    InsertAboveWithNewline.prototype.execute = function() {
      this.insertNewline();
      return InsertAboveWithNewline.__super__.execute.apply(this, arguments);
    };

    InsertAboveWithNewline.prototype.insertNewline = function() {
      return this.editor.insertNewlineAbove();
    };

    InsertAboveWithNewline.prototype.repeatInsert = function(selection, text) {
      return selection.insertText(text.trimLeft(), {
        autoIndent: true
      });
    };

    return InsertAboveWithNewline;

  })(ActivateInsertMode);

  InsertBelowWithNewline = (function(superClass) {
    extend(InsertBelowWithNewline, superClass);

    function InsertBelowWithNewline() {
      return InsertBelowWithNewline.__super__.constructor.apply(this, arguments);
    }

    InsertBelowWithNewline.extend();

    InsertBelowWithNewline.prototype.insertNewline = function() {
      return this.editor.insertNewlineBelow();
    };

    return InsertBelowWithNewline;

  })(InsertAboveWithNewline);

  InsertByTarget = (function(superClass) {
    extend(InsertByTarget, superClass);

    function InsertByTarget() {
      return InsertByTarget.__super__.constructor.apply(this, arguments);
    }

    InsertByTarget.extend(false);

    InsertByTarget.prototype.requireTarget = true;

    InsertByTarget.prototype.which = null;

    InsertByTarget.prototype.execute = function() {
      var i, len, ref1, selection;
      this.selectTarget();
      ref1 = this.editor.getSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        swrap(selection).setBufferPositionTo(this.which);
      }
      return InsertByTarget.__super__.execute.apply(this, arguments);
    };

    return InsertByTarget;

  })(ActivateInsertMode);

  InsertAtStartOfTarget = (function(superClass) {
    extend(InsertAtStartOfTarget, superClass);

    function InsertAtStartOfTarget() {
      return InsertAtStartOfTarget.__super__.constructor.apply(this, arguments);
    }

    InsertAtStartOfTarget.extend();

    InsertAtStartOfTarget.prototype.which = 'start';

    return InsertAtStartOfTarget;

  })(InsertByTarget);

  InsertAtEndOfTarget = (function(superClass) {
    extend(InsertAtEndOfTarget, superClass);

    function InsertAtEndOfTarget() {
      return InsertAtEndOfTarget.__super__.constructor.apply(this, arguments);
    }

    InsertAtEndOfTarget.extend();

    InsertAtEndOfTarget.prototype.which = 'end';

    return InsertAtEndOfTarget;

  })(InsertByTarget);

  InsertAtStartOfInnerSmartWord = (function(superClass) {
    extend(InsertAtStartOfInnerSmartWord, superClass);

    function InsertAtStartOfInnerSmartWord() {
      return InsertAtStartOfInnerSmartWord.__super__.constructor.apply(this, arguments);
    }

    InsertAtStartOfInnerSmartWord.extend();

    InsertAtStartOfInnerSmartWord.prototype.which = 'start';

    InsertAtStartOfInnerSmartWord.prototype.target = "InnerSmartWord";

    return InsertAtStartOfInnerSmartWord;

  })(InsertByTarget);

  InsertAtEndOfInnerSmartWord = (function(superClass) {
    extend(InsertAtEndOfInnerSmartWord, superClass);

    function InsertAtEndOfInnerSmartWord() {
      return InsertAtEndOfInnerSmartWord.__super__.constructor.apply(this, arguments);
    }

    InsertAtEndOfInnerSmartWord.extend();

    InsertAtEndOfInnerSmartWord.prototype.which = 'end';

    InsertAtEndOfInnerSmartWord.prototype.target = "InnerSmartWord";

    return InsertAtEndOfInnerSmartWord;

  })(InsertByTarget);

  InsertAtHeadOfTarget = (function(superClass) {
    extend(InsertAtHeadOfTarget, superClass);

    function InsertAtHeadOfTarget() {
      return InsertAtHeadOfTarget.__super__.constructor.apply(this, arguments);
    }

    InsertAtHeadOfTarget.extend();

    InsertAtHeadOfTarget.prototype.which = 'head';

    return InsertAtHeadOfTarget;

  })(InsertByTarget);

  InsertAtTailOfTarget = (function(superClass) {
    extend(InsertAtTailOfTarget, superClass);

    function InsertAtTailOfTarget() {
      return InsertAtTailOfTarget.__super__.constructor.apply(this, arguments);
    }

    InsertAtTailOfTarget.extend();

    InsertAtTailOfTarget.prototype.which = 'tail';

    return InsertAtTailOfTarget;

  })(InsertByTarget);

  InsertAtPreviousFoldStart = (function(superClass) {
    extend(InsertAtPreviousFoldStart, superClass);

    function InsertAtPreviousFoldStart() {
      return InsertAtPreviousFoldStart.__super__.constructor.apply(this, arguments);
    }

    InsertAtPreviousFoldStart.extend();

    InsertAtPreviousFoldStart.description = "Move to previous fold start then enter insert-mode";

    InsertAtPreviousFoldStart.prototype.target = 'MoveToPreviousFoldStart';

    return InsertAtPreviousFoldStart;

  })(InsertAtHeadOfTarget);

  InsertAtNextFoldStart = (function(superClass) {
    extend(InsertAtNextFoldStart, superClass);

    function InsertAtNextFoldStart() {
      return InsertAtNextFoldStart.__super__.constructor.apply(this, arguments);
    }

    InsertAtNextFoldStart.extend();

    InsertAtNextFoldStart.description = "Move to next fold start then enter insert-mode";

    InsertAtNextFoldStart.prototype.target = 'MoveToNextFoldStart';

    return InsertAtNextFoldStart;

  })(InsertAtHeadOfTarget);

  Change = (function(superClass) {
    extend(Change, superClass);

    function Change() {
      return Change.__super__.constructor.apply(this, arguments);
    }

    Change.extend();

    Change.prototype.requireTarget = true;

    Change.prototype.trackChange = true;

    Change.prototype.supportInsertionCount = false;

    Change.prototype.execute = function() {
      var base, selected, text;
      if (this.isRepeated()) {
        this.flashTarget = true;
      }
      selected = this.selectTarget();
      if (this.isOccurrence() && !selected) {
        this.vimState.activate('normal');
        return;
      }
      text = '';
      if (this.target.isTextObject() || this.target.isMotion()) {
        if (swrap.detectVisualModeSubmode(this.editor) === 'linewise') {
          text = "\n";
        }
      } else {
        if (typeof (base = this.target).isLinewise === "function" ? base.isLinewise() : void 0) {
          text = "\n";
        }
      }
      this.editor.transact((function(_this) {
        return function() {
          var i, len, range, ref1, results, selection;
          ref1 = _this.editor.getSelections();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            selection = ref1[i];
            _this.setTextToRegisterForSelection(selection);
            range = selection.insertText(text, {
              autoIndent: true
            });
            if (!range.isEmpty()) {
              results.push(selection.cursor.moveLeft());
            } else {
              results.push(void 0);
            }
          }
          return results;
        };
      })(this));
      return Change.__super__.execute.apply(this, arguments);
    };

    return Change;

  })(ActivateInsertMode);

  ChangeOccurrence = (function(superClass) {
    extend(ChangeOccurrence, superClass);

    function ChangeOccurrence() {
      return ChangeOccurrence.__super__.constructor.apply(this, arguments);
    }

    ChangeOccurrence.extend();

    ChangeOccurrence.description = "Change all matching word within target range";

    ChangeOccurrence.prototype.occurrence = true;

    return ChangeOccurrence;

  })(Change);

  ChangeOccurrenceInAFunctionOrInnerParagraph = (function(superClass) {
    extend(ChangeOccurrenceInAFunctionOrInnerParagraph, superClass);

    function ChangeOccurrenceInAFunctionOrInnerParagraph() {
      return ChangeOccurrenceInAFunctionOrInnerParagraph.__super__.constructor.apply(this, arguments);
    }

    ChangeOccurrenceInAFunctionOrInnerParagraph.extend();

    ChangeOccurrenceInAFunctionOrInnerParagraph.prototype.target = 'AFunctionOrInnerParagraph';

    return ChangeOccurrenceInAFunctionOrInnerParagraph;

  })(ChangeOccurrence);

  ChangeOccurrenceInAPersistentSelection = (function(superClass) {
    extend(ChangeOccurrenceInAPersistentSelection, superClass);

    function ChangeOccurrenceInAPersistentSelection() {
      return ChangeOccurrenceInAPersistentSelection.__super__.constructor.apply(this, arguments);
    }

    ChangeOccurrenceInAPersistentSelection.extend();

    ChangeOccurrenceInAPersistentSelection.prototype.target = "APersistentSelection";

    return ChangeOccurrenceInAPersistentSelection;

  })(ChangeOccurrence);

  Substitute = (function(superClass) {
    extend(Substitute, superClass);

    function Substitute() {
      return Substitute.__super__.constructor.apply(this, arguments);
    }

    Substitute.extend();

    Substitute.prototype.target = 'MoveRight';

    return Substitute;

  })(Change);

  SubstituteLine = (function(superClass) {
    extend(SubstituteLine, superClass);

    function SubstituteLine() {
      return SubstituteLine.__super__.constructor.apply(this, arguments);
    }

    SubstituteLine.extend();

    SubstituteLine.prototype.target = 'MoveToRelativeLine';

    return SubstituteLine;

  })(Change);

  ChangeToLastCharacterOfLine = (function(superClass) {
    extend(ChangeToLastCharacterOfLine, superClass);

    function ChangeToLastCharacterOfLine() {
      return ChangeToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    ChangeToLastCharacterOfLine.extend();

    ChangeToLastCharacterOfLine.prototype.target = 'MoveToLastCharacterOfLine';

    ChangeToLastCharacterOfLine.prototype.execute = function() {
      if (this.isMode('visual', 'blockwise')) {
        swrap.setReversedState(this.editor, false);
      }
      return ChangeToLastCharacterOfLine.__super__.execute.apply(this, arguments);
    };

    return ChangeToLastCharacterOfLine;

  })(Change);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvb3BlcmF0b3ItaW5zZXJ0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEseW1CQUFBO0lBQUE7OztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBRUosTUFFSSxPQUFBLENBQVEsU0FBUixDQUZKLEVBQ0UsbUNBREYsRUFDa0I7O0VBRWxCLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBQ1IsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsUUFBUixDQUFpQixDQUFDLFFBQWxCLENBQTJCLFVBQTNCOztFQUlMOzs7Ozs7O0lBQ0osa0JBQUMsQ0FBQSxNQUFELENBQUE7O2lDQUNBLGFBQUEsR0FBZTs7aUNBQ2YsV0FBQSxHQUFhOztpQ0FDYixVQUFBLEdBQVk7O2lDQUNaLFlBQUEsR0FBYzs7aUNBQ2QscUJBQUEsR0FBdUI7O2lDQUV2Qix5QkFBQSxHQUEyQixTQUFBO0FBQ3pCLFVBQUE7YUFBQSxVQUFBLEdBQWEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxXQUFXLENBQUMseUJBQXRCLENBQWdELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFEO0FBQzNELGNBQUE7VUFENkQsT0FBRDtVQUM1RCxJQUFjLElBQUEsS0FBUSxRQUF0QjtBQUFBLG1CQUFBOztVQUNBLFVBQVUsQ0FBQyxPQUFYLENBQUE7VUFFQSxLQUFDLENBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFmLENBQW1CLEdBQW5CLEVBQXdCLEtBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBQSxDQUF4QjtVQUNBLGVBQUEsR0FBa0I7VUFDbEIsSUFBRyxNQUFBLEdBQVMsS0FBQyxDQUFBLHdCQUFELENBQTBCLFFBQTFCLENBQVo7WUFDRSxLQUFDLENBQUEsVUFBRCxHQUFj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QUFBOzs2QkFDQSxNQUFBLEdBQVE7Ozs7S0FGbUI7O0VBSXZCOzs7Ozs7O0lBQ0osMkJBQUMsQ0FBQSxNQUFELENBQUE7OzBDQUNBLE1BQUEsR0FBUTs7MENBRVIsT0FBQSxHQUFTLFNBQUE7TUFFUCxJQUFHLElBQUMsQ0FBQSxNQUFELENBQVEsUUFBUixFQUFrQixXQUFsQixDQUFIO1FBQ0UsS0FBSyxDQUFDLGdCQUFOLENBQXVCLElBQUMsQ0FBQSxNQUF4QixFQUFnQyxLQUFoQyxFQURGOzthQUVBLDBEQUFBLFNBQUE7SUFKTzs7OztLQUorQjtBQTlRMUMiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG57XG4gIG1vdmVDdXJzb3JMZWZ0LCBtb3ZlQ3Vyc29yUmlnaHRcbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuT3BlcmF0b3IgPSByZXF1aXJlKCcuL2Jhc2UnKS5nZXRDbGFzcygnT3BlcmF0b3InKVxuXG4jIEluc2VydCBlbnRlcmluZyBvcGVyYXRpb25cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQWN0aXZhdGVJbnNlcnRNb2RlIGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZCgpXG4gIHJlcXVpcmVUYXJnZXQ6IGZhbHNlXG4gIGZsYXNoVGFyZ2V0OiBmYWxzZVxuICBjaGVja3BvaW50OiBudWxsXG4gIGZpbmFsU3VibW9kZTogbnVsbFxuICBzdXBwb3J0SW5zZXJ0aW9uQ291bnQ6IHRydWVcblxuICBvYnNlcnZlV2lsbERlYWN0aXZhdGVNb2RlOiAtPlxuICAgIGRpc3Bvc2FibGUgPSBAdmltU3RhdGUubW9kZU1hbmFnZXIucHJlZW1wdFdpbGxEZWFjdGl2YXRlTW9kZSAoe21vZGV9KSA9PlxuICAgICAgcmV0dXJuIHVubGVzcyBtb2RlIGlzICdpbnNlcnQnXG4gICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuXG4gICAgICBAdmltU3RhdGUubWFyay5zZXQoJ14nLCBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICB0ZXh0QnlVc2VySW5wdXQgPSAnJ1xuICAgICAgaWYgY2hhbmdlID0gQGdldENoYW5nZVNpbmNlQ2hlY2twb2ludCgnaW5zZXJ0JylcbiAgICAgICAgQGxhc3RDaGFuZ2UgPSBjaGFuZ2VcbiAgICAgICAgQHZpbVN0YXRlLm1hcmsuc2V0KCdbJywgY2hhbmdlLnN0YXJ0KVxuICAgICAgICBAdmltU3RhdGUubWFyay5zZXQoJ10nLCBjaGFuZ2Uuc3RhcnQudHJhdmVyc2UoY2hhbmdlLm5ld0V4dGVudCkpXG4gICAgICAgIHRleHRCeVVzZXJJbnB1dCA9IGNoYW5nZS5uZXdUZXh0XG4gICAgICBAdmltU3RhdGUucmVnaXN0ZXIuc2V0KCcuJywgdGV4dDogdGV4dEJ5VXNlcklucHV0KVxuXG4gICAgICBfLnRpbWVzIEBnZXRJbnNlcnRpb25Db3VudCgpLCA9PlxuICAgICAgICB0ZXh0ID0gQHRleHRCeU9wZXJhdG9yICsgdGV4dEJ5VXNlcklucHV0XG4gICAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0LCBhdXRvSW5kZW50OiB0cnVlKVxuXG4gICAgICAjIGdyb3VwaW5nIGNoYW5nZXMgZm9yIHVuZG8gY2hlY2twb2ludCBuZWVkIHRvIGNvbWUgbGFzdFxuICAgICAgaWYgc2V0dGluZ3MuZ2V0KCdncm91cENoYW5nZXNXaGVuTGVhdmluZ0luc2VydE1vZGUnKVxuICAgICAgICBAZWRpdG9yLmdyb3VwQ2hhbmdlc1NpbmNlQ2hlY2twb2ludChAZ2V0Q2hlY2twb2ludCgndW5kbycpKVxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcbiAgICBAY2hlY2twb2ludCA9IHt9XG4gICAgQHNldENoZWNrcG9pbnQoJ3VuZG8nKSB1bmxlc3MgQGlzUmVwZWF0ZWQoKVxuICAgIEBvYnNlcnZlV2lsbERlYWN0aXZhdGVNb2RlKClcblxuICAjIHdlIGhhdmUgdG8gbWFuYWdlIHR3byBzZXBhcmF0ZSBjaGVja3BvaW50IGZvciBkaWZmZXJlbnQgcHVycG9zZSh0aW1pbmcgaXMgZGlmZmVyZW50KVxuICAjIC0gb25lIGZvciB1bmRvKGhhbmRsZWQgYnkgbW9kZU1hbmFnZXIpXG4gICMgLSBvbmUgZm9yIHByZXNlcnZlIGxhc3QgaW5zZXJ0ZWQgdGV4dFxuICBzZXRDaGVja3BvaW50OiAocHVycG9zZSkgLT5cbiAgICBAY2hlY2twb2ludFtwdXJwb3NlXSA9IEBlZGl0b3IuY3JlYXRlQ2hlY2twb2ludCgpXG5cbiAgZ2V0Q2hlY2twb2ludDogKHB1cnBvc2UpIC0+XG4gICAgQGNoZWNrcG9pbnRbcHVycG9zZV1cblxuICAjIFdoZW4gZWFjaCBtdXRhaW9uJ3MgZXh0ZW50IGlzIG5vdCBpbnRlcnNlY3RpbmcsIG11aXRpcGxlIGNoYW5nZXMgYXJlIHJlY29yZGVkXG4gICMgZS5nXG4gICMgIC0gTXVsdGljdXJzb3JzIGVkaXRcbiAgIyAgLSBDdXJzb3IgbW92ZWQgaW4gaW5zZXJ0LW1vZGUoZS5nIGN0cmwtZiwgY3RybC1iKVxuICAjIEJ1dCBJIGRvbid0IGNhcmUgbXVsdGlwbGUgY2hhbmdlcyBqdXN0IGJlY2F1c2UgSSdtIGxhenkoc28gbm90IHBlcmZlY3QgaW1wbGVtZW50YXRpb24pLlxuICAjIEkgb25seSB0YWtlIGNhcmUgb2Ygb25lIGNoYW5nZSBoYXBwZW5lZCBhdCBlYXJsaWVzdCh0b3BDdXJzb3IncyBjaGFuZ2UpIHBvc2l0aW9uLlxuICAjIFRoYXRzJyB3aHkgSSBzYXZlIHRvcEN1cnNvcidzIHBvc2l0aW9uIHRvIEB0b3BDdXJzb3JQb3NpdGlvbkF0SW5zZXJ0aW9uU3RhcnQgdG8gY29tcGFyZSB0cmF2ZXJzYWwgdG8gZGVsZXRpb25TdGFydFxuICAjIFdoeSBJIHVzZSB0b3BDdXJzb3IncyBjaGFuZ2U/IEp1c3QgYmVjYXVzZSBpdCdzIGVhc3kgdG8gdXNlIGZpcnN0IGNoYW5nZSByZXR1cm5lZCBieSBnZXRDaGFuZ2VTaW5jZUNoZWNrcG9pbnQoKS5cbiAgZ2V0Q2hhbmdlU2luY2VDaGVja3BvaW50OiAocHVycG9zZSkgLT5cbiAgICBjaGVja3BvaW50ID0gQGdldENoZWNrcG9pbnQocHVycG9zZSlcbiAgICBAZWRpdG9yLmJ1ZmZlci5nZXRDaGFuZ2VzU2luY2VDaGVja3BvaW50KGNoZWNrcG9pbnQpWzBdXG5cbiAgIyBbQlVHXSBSZXBsYXlpbmcgdGV4dC1kZWxldGlvbi1vcGVyYXRpb24gaXMgbm90IGNvbXBhdGlibGUgdG8gcHVyZSBWaW0uXG4gICMgUHVyZSBWaW0gcmVjb3JkIGFsbCBvcGVyYXRpb24gaW4gaW5zZXJ0LW1vZGUgYXMga2V5c3Ryb2tlIGxldmVsIGFuZCBjYW4gZGlzdGluZ3Vpc2hcbiAgIyBjaGFyYWN0ZXIgZGVsZXRlZCBieSBgRGVsZXRlYCBvciBieSBgY3RybC11YC5cbiAgIyBCdXQgSSBjYW4gbm90IGFuZCBkb24ndCB0cnlpbmcgdG8gbWluaWMgdGhpcyBsZXZlbCBvZiBjb21wYXRpYmlsaXR5LlxuICAjIFNvIGJhc2ljYWxseSBkZWxldGlvbi1kb25lLWluLW9uZSBpcyBleHBlY3RlZCB0byB3b3JrIHdlbGwuXG4gIHJlcGxheUxhc3RDaGFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgaWYgQGxhc3RDaGFuZ2U/XG4gICAgICB7c3RhcnQsIG5ld0V4dGVudCwgb2xkRXh0ZW50LCBuZXdUZXh0fSA9IEBsYXN0Q2hhbmdlXG4gICAgICB1bmxlc3Mgb2xkRXh0ZW50LmlzWmVybygpXG4gICAgICAgIHRyYXZlcnNhbFRvU3RhcnRPZkRlbGV0ZSA9IHN0YXJ0LnRyYXZlcnNhbEZyb20oQHRvcEN1cnNvclBvc2l0aW9uQXRJbnNlcnRpb25TdGFydClcbiAgICAgICAgZGVsZXRpb25TdGFydCA9IHNlbGVjdGlvbi5jdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKS50cmF2ZXJzZSh0cmF2ZXJzYWxUb1N0YXJ0T2ZEZWxldGUpXG4gICAgICAgIGRlbGV0aW9uRW5kID0gZGVsZXRpb25TdGFydC50cmF2ZXJzZShvbGRFeHRlbnQpXG4gICAgICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShbZGVsZXRpb25TdGFydCwgZGVsZXRpb25FbmRdKVxuICAgIGVsc2VcbiAgICAgIG5ld1RleHQgPSAnJ1xuICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KG5ld1RleHQsIGF1dG9JbmRlbnQ6IHRydWUpXG5cbiAgIyBjYWxsZWQgd2hlbiByZXBlYXRlZFxuICAjIFtGSVhNRV0gdG8gdXNlIHJlcGxheUxhc3RDaGFuZ2UgaW4gcmVwZWF0SW5zZXJ0IG92ZXJyaWRpbmcgc3ViY2xhc3NzLlxuICByZXBlYXRJbnNlcnQ6IChzZWxlY3Rpb24sIHRleHQpIC0+XG4gICAgQHJlcGxheUxhc3RDaGFuZ2Uoc2VsZWN0aW9uKVxuXG4gIGdldEluc2VydGlvbkNvdW50OiAtPlxuICAgIEBpbnNlcnRpb25Db3VudCA/PSBpZiBAc3VwcG9ydEluc2VydGlvbkNvdW50IHRoZW4gKEBnZXRDb3VudCgpIC0gMSkgZWxzZSAwXG4gICAgQGluc2VydGlvbkNvdW50XG5cbiAgZXhlY3V0ZTogLT5cbiAgICBpZiBAaXNSZXBlYXRlZCgpXG4gICAgICB1bmxlc3MgQGluc3RhbmNlb2YoJ0NoYW5nZScpXG4gICAgICAgIEBmbGFzaFRhcmdldCA9IEB0cmFja0NoYW5nZSA9IHRydWVcbiAgICAgICAgQGVtaXREaWRTZWxlY3RUYXJnZXQoKVxuICAgICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgICAgQHJlcGVhdEluc2VydChzZWxlY3Rpb24sIEBsYXN0Q2hhbmdlPy5uZXdUZXh0ID8gJycpXG4gICAgICAgICAgbW92ZUN1cnNvckxlZnQoc2VsZWN0aW9uLmN1cnNvcilcblxuICAgICAgaWYgc2V0dGluZ3MuZ2V0KCdjbGVhck11bHRpcGxlQ3Vyc29yc09uRXNjYXBlSW5zZXJ0TW9kZScpXG4gICAgICAgIEBlZGl0b3IuY2xlYXJTZWxlY3Rpb25zKClcblxuICAgIGVsc2VcbiAgICAgIGlmIEBnZXRJbnNlcnRpb25Db3VudCgpID4gMFxuICAgICAgICBAdGV4dEJ5T3BlcmF0b3IgPSBAZ2V0Q2hhbmdlU2luY2VDaGVja3BvaW50KCd1bmRvJyk/Lm5ld1RleHQgPyAnJ1xuICAgICAgQHNldENoZWNrcG9pbnQoJ2luc2VydCcpXG4gICAgICB0b3BDdXJzb3IgPSBAZWRpdG9yLmdldEN1cnNvcnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbigpWzBdXG4gICAgICBAdG9wQ3Vyc29yUG9zaXRpb25BdEluc2VydGlvblN0YXJ0ID0gdG9wQ3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIEB2aW1TdGF0ZS5hY3RpdmF0ZSgnaW5zZXJ0JywgQGZpbmFsU3VibW9kZSlcblxuY2xhc3MgQWN0aXZhdGVSZXBsYWNlTW9kZSBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZVxuICBAZXh0ZW5kKClcbiAgZmluYWxTdWJtb2RlOiAncmVwbGFjZSdcblxuICByZXBlYXRJbnNlcnQ6IChzZWxlY3Rpb24sIHRleHQpIC0+XG4gICAgZm9yIGNoYXIgaW4gdGV4dCB3aGVuIChjaGFyIGlzbnQgXCJcXG5cIilcbiAgICAgIGJyZWFrIGlmIHNlbGVjdGlvbi5jdXJzb3IuaXNBdEVuZE9mTGluZSgpXG4gICAgICBzZWxlY3Rpb24uc2VsZWN0UmlnaHQoKVxuICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KHRleHQsIGF1dG9JbmRlbnQ6IGZhbHNlKVxuXG5jbGFzcyBJbnNlcnRBZnRlciBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZVxuICBAZXh0ZW5kKClcbiAgZXhlY3V0ZTogLT5cbiAgICBtb3ZlQ3Vyc29yUmlnaHQoY3Vyc29yKSBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgc3VwZXJcblxuY2xhc3MgSW5zZXJ0QWZ0ZXJFbmRPZkxpbmUgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgQGVkaXRvci5tb3ZlVG9FbmRPZkxpbmUoKVxuICAgIHN1cGVyXG5cbmNsYXNzIEluc2VydEF0QmVnaW5uaW5nT2ZMaW5lIGV4dGVuZHMgQWN0aXZhdGVJbnNlcnRNb2RlXG4gIEBleHRlbmQoKVxuICBleGVjdXRlOiAtPlxuICAgIEBlZGl0b3IubW92ZVRvQmVnaW5uaW5nT2ZMaW5lKClcbiAgICBAZWRpdG9yLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKClcbiAgICBzdXBlclxuXG5jbGFzcyBJbnNlcnRBdExhc3RJbnNlcnQgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgaWYgKHBvaW50ID0gQHZpbVN0YXRlLm1hcmsuZ2V0KCdeJykpXG4gICAgICBAZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgICAgQGVkaXRvci5zY3JvbGxUb0N1cnNvclBvc2l0aW9uKHtjZW50ZXI6IHRydWV9KVxuICAgIHN1cGVyXG5cbmNsYXNzIEluc2VydEFib3ZlV2l0aE5ld2xpbmUgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgQGluc2VydE5ld2xpbmUoKVxuICAgIHN1cGVyXG5cbiAgaW5zZXJ0TmV3bGluZTogLT5cbiAgICBAZWRpdG9yLmluc2VydE5ld2xpbmVBYm92ZSgpXG5cbiAgcmVwZWF0SW5zZXJ0OiAoc2VsZWN0aW9uLCB0ZXh0KSAtPlxuICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KHRleHQudHJpbUxlZnQoKSwgYXV0b0luZGVudDogdHJ1ZSlcblxuY2xhc3MgSW5zZXJ0QmVsb3dXaXRoTmV3bGluZSBleHRlbmRzIEluc2VydEFib3ZlV2l0aE5ld2xpbmVcbiAgQGV4dGVuZCgpXG4gIGluc2VydE5ld2xpbmU6IC0+XG4gICAgQGVkaXRvci5pbnNlcnROZXdsaW5lQmVsb3coKVxuXG4jIEFkdmFuY2VkIEluc2VydGlvblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBJbnNlcnRCeVRhcmdldCBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZVxuICBAZXh0ZW5kKGZhbHNlKVxuICByZXF1aXJlVGFyZ2V0OiB0cnVlXG4gIHdoaWNoOiBudWxsICMgb25lIG9mIFsnc3RhcnQnLCAnZW5kJywgJ2hlYWQnLCAndGFpbCddXG4gIGV4ZWN1dGU6IC0+XG4gICAgQHNlbGVjdFRhcmdldCgpXG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgc3dyYXAoc2VsZWN0aW9uKS5zZXRCdWZmZXJQb3NpdGlvblRvKEB3aGljaClcbiAgICBzdXBlclxuXG5jbGFzcyBJbnNlcnRBdFN0YXJ0T2ZUYXJnZXQgZXh0ZW5kcyBJbnNlcnRCeVRhcmdldFxuICBAZXh0ZW5kKClcbiAgd2hpY2g6ICdzdGFydCdcblxuY2xhc3MgSW5zZXJ0QXRFbmRPZlRhcmdldCBleHRlbmRzIEluc2VydEJ5VGFyZ2V0XG4gIEBleHRlbmQoKVxuICB3aGljaDogJ2VuZCdcblxuY2xhc3MgSW5zZXJ0QXRTdGFydE9mSW5uZXJTbWFydFdvcmQgZXh0ZW5kcyBJbnNlcnRCeVRhcmdldFxuICBAZXh0ZW5kKClcbiAgd2hpY2g6ICdzdGFydCdcbiAgdGFyZ2V0OiBcIklubmVyU21hcnRXb3JkXCJcblxuY2xhc3MgSW5zZXJ0QXRFbmRPZklubmVyU21hcnRXb3JkIGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXRcbiAgQGV4dGVuZCgpXG4gIHdoaWNoOiAnZW5kJ1xuICB0YXJnZXQ6IFwiSW5uZXJTbWFydFdvcmRcIlxuXG5jbGFzcyBJbnNlcnRBdEhlYWRPZlRhcmdldCBleHRlbmRzIEluc2VydEJ5VGFyZ2V0XG4gIEBleHRlbmQoKVxuICB3aGljaDogJ2hlYWQnXG5cbmNsYXNzIEluc2VydEF0VGFpbE9mVGFyZ2V0IGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXRcbiAgQGV4dGVuZCgpXG4gIHdoaWNoOiAndGFpbCdcblxuY2xhc3MgSW5zZXJ0QXRQcmV2aW91c0ZvbGRTdGFydCBleHRlbmRzIEluc2VydEF0SGVhZE9mVGFyZ2V0XG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBmb2xkIHN0YXJ0IHRoZW4gZW50ZXIgaW5zZXJ0LW1vZGVcIlxuICB0YXJnZXQ6ICdNb3ZlVG9QcmV2aW91c0ZvbGRTdGFydCdcblxuY2xhc3MgSW5zZXJ0QXROZXh0Rm9sZFN0YXJ0IGV4dGVuZHMgSW5zZXJ0QXRIZWFkT2ZUYXJnZXRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgZm9sZCBzdGFydCB0aGVuIGVudGVyIGluc2VydC1tb2RlXCJcbiAgdGFyZ2V0OiAnTW92ZVRvTmV4dEZvbGRTdGFydCdcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBDaGFuZ2UgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIHJlcXVpcmVUYXJnZXQ6IHRydWVcbiAgdHJhY2tDaGFuZ2U6IHRydWVcbiAgc3VwcG9ydEluc2VydGlvbkNvdW50OiBmYWxzZVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgaWYgQGlzUmVwZWF0ZWQoKVxuICAgICAgQGZsYXNoVGFyZ2V0ID0gdHJ1ZVxuXG4gICAgc2VsZWN0ZWQgPSBAc2VsZWN0VGFyZ2V0KClcbiAgICBpZiBAaXNPY2N1cnJlbmNlKCkgYW5kIG5vdCBzZWxlY3RlZFxuICAgICAgQHZpbVN0YXRlLmFjdGl2YXRlKCdub3JtYWwnKVxuICAgICAgcmV0dXJuXG5cbiAgICB0ZXh0ID0gJydcbiAgICBpZiBAdGFyZ2V0LmlzVGV4dE9iamVjdCgpIG9yIEB0YXJnZXQuaXNNb3Rpb24oKVxuICAgICAgdGV4dCA9IFwiXFxuXCIgaWYgKHN3cmFwLmRldGVjdFZpc3VhbE1vZGVTdWJtb2RlKEBlZGl0b3IpIGlzICdsaW5ld2lzZScpXG4gICAgZWxzZVxuICAgICAgdGV4dCA9IFwiXFxuXCIgaWYgQHRhcmdldC5pc0xpbmV3aXNlPygpXG5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgIEBzZXRUZXh0VG9SZWdpc3RlckZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgICAgIHJhbmdlID0gc2VsZWN0aW9uLmluc2VydFRleHQodGV4dCwgYXV0b0luZGVudDogdHJ1ZSlcbiAgICAgICAgc2VsZWN0aW9uLmN1cnNvci5tb3ZlTGVmdCgpIHVubGVzcyByYW5nZS5pc0VtcHR5KClcbiAgICAjIEZJWE1FIGNhbGxpbmcgc3VwZXIgb24gT1VUU0lERSBvZiBlZGl0b3IudHJhbnNhY3QuXG4gICAgIyBUaGF0J3Mgd2h5IHJlcGVhdFJlY29yZGVkKCkgbmVlZCB0cmFuc2FjdC53cmFwXG4gICAgc3VwZXJcblxuY2xhc3MgQ2hhbmdlT2NjdXJyZW5jZSBleHRlbmRzIENoYW5nZVxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIkNoYW5nZSBhbGwgbWF0Y2hpbmcgd29yZCB3aXRoaW4gdGFyZ2V0IHJhbmdlXCJcbiAgb2NjdXJyZW5jZTogdHJ1ZVxuXG5jbGFzcyBDaGFuZ2VPY2N1cnJlbmNlSW5BRnVuY3Rpb25PcklubmVyUGFyYWdyYXBoIGV4dGVuZHMgQ2hhbmdlT2NjdXJyZW5jZVxuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnQUZ1bmN0aW9uT3JJbm5lclBhcmFncmFwaCdcblxuY2xhc3MgQ2hhbmdlT2NjdXJyZW5jZUluQVBlcnNpc3RlbnRTZWxlY3Rpb24gZXh0ZW5kcyBDaGFuZ2VPY2N1cnJlbmNlXG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6IFwiQVBlcnNpc3RlbnRTZWxlY3Rpb25cIlxuXG5jbGFzcyBTdWJzdGl0dXRlIGV4dGVuZHMgQ2hhbmdlXG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6ICdNb3ZlUmlnaHQnXG5cbmNsYXNzIFN1YnN0aXR1dGVMaW5lIGV4dGVuZHMgQ2hhbmdlXG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6ICdNb3ZlVG9SZWxhdGl2ZUxpbmUnXG5cbmNsYXNzIENoYW5nZVRvTGFzdENoYXJhY3Rlck9mTGluZSBleHRlbmRzIENoYW5nZVxuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnTW92ZVRvTGFzdENoYXJhY3Rlck9mTGluZSdcblxuICBleGVjdXRlOiAtPlxuICAgICMgRW5zdXJlIGFsbCBzZWxlY3Rpb25zIHRvIHVuLXJldmVyc2VkXG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJywgJ2Jsb2Nrd2lzZScpXG4gICAgICBzd3JhcC5zZXRSZXZlcnNlZFN0YXRlKEBlZGl0b3IsIGZhbHNlKVxuICAgIHN1cGVyXG4iXX0=
