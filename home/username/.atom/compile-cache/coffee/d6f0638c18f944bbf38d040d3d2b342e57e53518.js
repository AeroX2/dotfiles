(function() {
  var Base, CurrentSelection, Find, FindBackwards, Motion, MoveDown, MoveDownScreen, MoveDownToEdge, MoveLeft, MoveRight, MoveRightBufferColumn, MoveToBeginningOfLine, MoveToBottomOfScreen, MoveToColumn, MoveToEndOfAlphanumericWord, MoveToEndOfSmartWord, MoveToEndOfWholeWord, MoveToEndOfWord, MoveToFirstCharacterOfLine, MoveToFirstCharacterOfLineAndDown, MoveToFirstCharacterOfLineDown, MoveToFirstCharacterOfLineUp, MoveToFirstLine, MoveToLastCharacterOfLine, MoveToLastLine, MoveToLastNonblankCharacterOfLineAndDown, MoveToLineByPercent, MoveToMark, MoveToMarkLine, MoveToMiddleOfScreen, MoveToNextAlphanumericWord, MoveToNextFoldEnd, MoveToNextFoldStart, MoveToNextFoldStartWithSameIndent, MoveToNextFunction, MoveToNextNumber, MoveToNextParagraph, MoveToNextSentence, MoveToNextSentenceSkipBlankRow, MoveToNextSmartWord, MoveToNextString, MoveToNextWholeWord, MoveToNextWord, MoveToPair, MoveToPositionByScope, MoveToPreviousAlphanumericWord, MoveToPreviousEndOfWholeWord, MoveToPreviousEndOfWord, MoveToPreviousFoldEnd, MoveToPreviousFoldStart, MoveToPreviousFoldStartWithSameIndent, MoveToPreviousFunction, MoveToPreviousNumber, MoveToPreviousParagraph, MoveToPreviousSentence, MoveToPreviousSentenceSkipBlankRow, MoveToPreviousSmartWord, MoveToPreviousString, MoveToPreviousWholeWord, MoveToPreviousWord, MoveToRelativeLine, MoveToRelativeLineWithMinimum, MoveToTopOfScreen, MoveUp, MoveUpScreen, MoveUpToEdge, Point, Range, ScrollFullScreenDown, ScrollFullScreenUp, ScrollHalfScreenDown, ScrollHalfScreenUp, Select, Till, TillBackwards, _, cursorIsAtEmptyRow, cursorIsAtEndOfLineAtNonEmptyRow, cursorIsAtVimEndOfFile, cursorIsOnWhiteSpace, debug, detectScopeStartPositionForScope, getBufferRows, getCodeFoldRowRanges, getFirstCharacterBufferPositionForScreenRow, getFirstCharacterColumForBufferRow, getFirstCharacterPositionForBufferRow, getFirstCharacterScreenPositionForScreenRow, getFirstVisibleScreenRow, getIndentLevelForBufferRow, getLargestFoldRangeContainsBufferRow, getLastVisibleScreenRow, getStartPositionForPattern, getValidVimBufferRow, getValidVimScreenRow, getVisibleBufferRange, highlightRanges, isIncludeFunctionScopeForRow, moveCursorDownBuffer, moveCursorDownScreen, moveCursorLeft, moveCursorRight, moveCursorToFirstCharacterAtRow, moveCursorToNextNonWhitespace, moveCursorUpBuffer, moveCursorUpScreen, ref, ref1, saveEditorState, screenPositionIsAtWhiteSpace, settings, sortRanges, swrap,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('atom'), Point = ref.Point, Range = ref.Range;

  Select = null;

  ref1 = require('./utils'), saveEditorState = ref1.saveEditorState, getVisibleBufferRange = ref1.getVisibleBufferRange, moveCursorLeft = ref1.moveCursorLeft, moveCursorRight = ref1.moveCursorRight, moveCursorUpScreen = ref1.moveCursorUpScreen, moveCursorDownScreen = ref1.moveCursorDownScreen, moveCursorDownBuffer = ref1.moveCursorDownBuffer, moveCursorUpBuffer = ref1.moveCursorUpBuffer, cursorIsAtVimEndOfFile = ref1.cursorIsAtVimEndOfFile, getFirstVisibleScreenRow = ref1.getFirstVisibleScreenRow, getLastVisibleScreenRow = ref1.getLastVisibleScreenRow, getValidVimScreenRow = ref1.getValidVimScreenRow, getValidVimBufferRow = ref1.getValidVimBufferRow, highlightRanges = ref1.highlightRanges, moveCursorToFirstCharacterAtRow = ref1.moveCursorToFirstCharacterAtRow, sortRanges = ref1.sortRanges, getIndentLevelForBufferRow = ref1.getIndentLevelForBufferRow, cursorIsOnWhiteSpace = ref1.cursorIsOnWhiteSpace, moveCursorToNextNonWhitespace = ref1.moveCursorToNextNonWhitespace, cursorIsAtEmptyRow = ref1.cursorIsAtEmptyRow, getCodeFoldRowRanges = ref1.getCodeFoldRowRanges, getLargestFoldRangeContainsBufferRow = ref1.getLargestFoldRangeContainsBufferRow, isIncludeFunctionScopeForRow = ref1.isIncludeFunctionScopeForRow, detectScopeStartPositionForScope = ref1.detectScopeStartPositionForScope, getBufferRows = ref1.getBufferRows, getStartPositionForPattern = ref1.getStartPositionForPattern, getFirstCharacterPositionForBufferRow = ref1.getFirstCharacterPositionForBufferRow, getFirstCharacterBufferPositionForScreenRow = ref1.getFirstCharacterBufferPositionForScreenRow, screenPositionIsAtWhiteSpace = ref1.screenPositionIsAtWhiteSpace, cursorIsAtEndOfLineAtNonEmptyRow = ref1.cursorIsAtEndOfLineAtNonEmptyRow, getFirstCharacterColumForBufferRow = ref1.getFirstCharacterColumForBufferRow, getFirstCharacterScreenPositionForScreenRow = ref1.getFirstCharacterScreenPositionForScreenRow, debug = ref1.debug;

  swrap = require('./selection-wrapper');

  settings = require('./settings');

  Base = require('./base');

  Motion = (function(superClass) {
    extend(Motion, superClass);

    Motion.extend(false);

    Motion.prototype.inclusive = false;

    Motion.prototype.wise = 'characterwise';

    Motion.prototype.jump = false;

    function Motion() {
      Motion.__super__.constructor.apply(this, arguments);
      if (this.isMode('visual')) {
        this.inclusive = true;
        this.wise = this.vimState.submode;
      }
      this.initialize();
    }

    Motion.prototype.isInclusive = function() {
      return this.inclusive;
    };

    Motion.prototype.isJump = function() {
      return this.jump;
    };

    Motion.prototype.isCharacterwise = function() {
      return this.wise === 'characterwise';
    };

    Motion.prototype.isLinewise = function() {
      return this.wise === 'linewise';
    };

    Motion.prototype.isBlockwise = function() {
      return this.wise === 'blockwise';
    };

    Motion.prototype.forceWise = function(wise) {
      if (wise === 'characterwise') {
        if (this.wise === 'linewise') {
          this.inclusive = false;
        } else {
          this.inclusive = !this.inclusive;
        }
      }
      return this.wise = wise;
    };

    Motion.prototype.setBufferPositionSafely = function(cursor, point) {
      if (point != null) {
        return cursor.setBufferPosition(point);
      }
    };

    Motion.prototype.setScreenPositionSafely = function(cursor, point) {
      if (point != null) {
        return cursor.setScreenPosition(point);
      }
    };

    Motion.prototype.moveWithSaveJump = function(cursor) {
      var cursorPosition;
      if (cursor.isLastCursor() && this.isJump()) {
        cursorPosition = cursor.getBufferPosition();
      }
      this.moveCursor(cursor);
      if ((cursorPosition != null) && !cursorPosition.isEqual(cursor.getBufferPosition())) {
        this.vimState.mark.set('`', cursorPosition);
        return this.vimState.mark.set("'", cursorPosition);
      }
    };

    Motion.prototype.execute = function() {
      return this.editor.moveCursors((function(_this) {
        return function(cursor) {
          return _this.moveWithSaveJump(cursor);
        };
      })(this));
    };

    Motion.prototype.select = function() {
      var i, len, ref2, selection;
      if (this.isMode('visual')) {
        this.vimState.modeManager.normalizeSelections();
      }
      ref2 = this.editor.getSelections();
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        this.selectByMotion(selection);
      }
      this.editor.mergeCursors();
      this.editor.mergeIntersectingSelections();
      if (this.isMode('visual')) {
        this.updateSelectionProperties();
      }
      switch (this.wise) {
        case 'linewise':
          return this.vimState.selectLinewise();
        case 'blockwise':
          return this.vimState.selectBlockwise();
      }
    };

    Motion.prototype.selectByMotion = function(selection) {
      var cursor;
      cursor = selection.cursor;
      selection.modifySelection((function(_this) {
        return function() {
          return _this.moveWithSaveJump(cursor);
        };
      })(this));
      if (!this.isMode('visual') && selection.isEmpty()) {
        return;
      }
      if (!(this.isInclusive() || this.isLinewise())) {
        return;
      }
      if (this.isMode('visual') && cursorIsAtEndOfLineAtNonEmptyRow(cursor)) {
        swrap(selection).translateSelectionHeadAndClip('backward');
      }
      return swrap(selection).translateSelectionEndAndClip('forward');
    };

    return Motion;

  })(Base);

  CurrentSelection = (function(superClass) {
    extend(CurrentSelection, superClass);

    function CurrentSelection() {
      return CurrentSelection.__super__.constructor.apply(this, arguments);
    }

    CurrentSelection.extend(false);

    CurrentSelection.prototype.selectionExtent = null;

    CurrentSelection.prototype.inclusive = true;

    CurrentSelection.prototype.initialize = function() {
      CurrentSelection.__super__.initialize.apply(this, arguments);
      return this.pointInfoByCursor = new Map;
    };

    CurrentSelection.prototype.execute = function() {
      throw new Error((this.getName()) + " should not be executed");
    };

    CurrentSelection.prototype.moveCursor = function(cursor) {
      var end, head, point, ref2, ref3, start, tail;
      if (this.isMode('visual')) {
        if (this.isBlockwise()) {
          ref2 = cursor.selection.getBufferRange(), start = ref2.start, end = ref2.end;
          ref3 = cursor.selection.isReversed() ? [start, end] : [end, start], head = ref3[0], tail = ref3[1];
          return this.selectionExtent = new Point(head.row - tail.row, head.column - tail.column);
        } else {
          return this.selectionExtent = this.editor.getSelectedBufferRange().getExtent();
        }
      } else {
        point = cursor.getBufferPosition();
        if (this.isBlockwise()) {
          return cursor.setBufferPosition(point.translate(this.selectionExtent));
        } else {
          return cursor.setBufferPosition(point.traverse(this.selectionExtent));
        }
      }
    };

    CurrentSelection.prototype.select = function() {
      var atEOL, cursor, cursorPosition, i, j, len, len1, pointInfo, ref2, ref3, results, startOfSelection;
      if (this.isMode('visual')) {
        CurrentSelection.__super__.select.apply(this, arguments);
      } else {
        ref2 = this.editor.getCursors();
        for (i = 0, len = ref2.length; i < len; i++) {
          cursor = ref2[i];
          if (!(pointInfo = this.pointInfoByCursor.get(cursor))) {
            continue;
          }
          cursorPosition = pointInfo.cursorPosition, startOfSelection = pointInfo.startOfSelection, atEOL = pointInfo.atEOL;
          if (atEOL || cursorPosition.isEqual(cursor.getBufferPosition())) {
            cursor.setBufferPosition(startOfSelection);
          }
        }
        CurrentSelection.__super__.select.apply(this, arguments);
      }
      ref3 = this.editor.getCursors();
      results = [];
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        cursor = ref3[j];
        startOfSelection = cursor.selection.getBufferRange().start;
        results.push(this.onDidFinishOperation((function(_this) {
          return function() {
            cursorPosition = cursor.getBufferPosition();
            atEOL = cursor.isAtEndOfLine();
            return _this.pointInfoByCursor.set(cursor, {
              startOfSelection: startOfSelection,
              cursorPosition: cursorPosition,
              atEOL: atEOL
            });
          };
        })(this)));
      }
      return results;
    };

    return CurrentSelection;

  })(Motion);

  MoveLeft = (function(superClass) {
    extend(MoveLeft, superClass);

    function MoveLeft() {
      return MoveLeft.__super__.constructor.apply(this, arguments);
    }

    MoveLeft.extend();

    MoveLeft.prototype.moveCursor = function(cursor) {
      var allowWrap;
      allowWrap = settings.get('wrapLeftRightMotion');
      return this.countTimes(function() {
        return moveCursorLeft(cursor, {
          allowWrap: allowWrap
        });
      });
    };

    return MoveLeft;

  })(Motion);

  MoveRight = (function(superClass) {
    extend(MoveRight, superClass);

    function MoveRight() {
      return MoveRight.__super__.constructor.apply(this, arguments);
    }

    MoveRight.extend();

    MoveRight.prototype.canWrapToNextLine = function(cursor) {
      if (this.isAsOperatorTarget() && !cursor.isAtEndOfLine()) {
        return false;
      } else {
        return settings.get('wrapLeftRightMotion');
      }
    };

    MoveRight.prototype.moveCursor = function(cursor) {
      return this.countTimes((function(_this) {
        return function() {
          var allowWrap;
          _this.editor.unfoldBufferRow(cursor.getBufferRow());
          allowWrap = _this.canWrapToNextLine(cursor);
          moveCursorRight(cursor);
          if (cursor.isAtEndOfLine() && allowWrap && !cursorIsAtVimEndOfFile(cursor)) {
            return moveCursorRight(cursor, {
              allowWrap: allowWrap
            });
          }
        };
      })(this));
    };

    return MoveRight;

  })(Motion);

  MoveRightBufferColumn = (function(superClass) {
    extend(MoveRightBufferColumn, superClass);

    function MoveRightBufferColumn() {
      return MoveRightBufferColumn.__super__.constructor.apply(this, arguments);
    }

    MoveRightBufferColumn.extend(true);

    MoveRightBufferColumn.prototype.moveCursor = function(cursor) {
      var newPoint;
      newPoint = cursor.getBufferPosition().translate([0, this.getCount()]);
      return cursor.setBufferPosition(newPoint);
    };

    return MoveRightBufferColumn;

  })(Motion);

  MoveUp = (function(superClass) {
    extend(MoveUp, superClass);

    function MoveUp() {
      return MoveUp.__super__.constructor.apply(this, arguments);
    }

    MoveUp.extend();

    MoveUp.prototype.wise = 'linewise';

    MoveUp.prototype.getPoint = function(cursor) {
      var row;
      row = this.getRow(cursor.getBufferRow());
      return new Point(row, cursor.goalColumn);
    };

    MoveUp.prototype.getRow = function(row) {
      row = Math.max(row - 1, 0);
      if (this.editor.isFoldedAtBufferRow(row)) {
        row = getLargestFoldRangeContainsBufferRow(this.editor, row).start.row;
      }
      return row;
    };

    MoveUp.prototype.moveCursor = function(cursor) {
      return this.countTimes((function(_this) {
        return function() {
          var goalColumn;
          if (cursor.goalColumn == null) {
            cursor.goalColumn = cursor.getBufferColumn();
          }
          goalColumn = cursor.goalColumn;
          cursor.setBufferPosition(_this.getPoint(cursor));
          return cursor.goalColumn = goalColumn;
        };
      })(this));
    };

    return MoveUp;

  })(Motion);

  MoveDown = (function(superClass) {
    extend(MoveDown, superClass);

    function MoveDown() {
      return MoveDown.__super__.constructor.apply(this, arguments);
    }

    MoveDown.extend();

    MoveDown.prototype.wise = 'linewise';

    MoveDown.prototype.getRow = function(row) {
      if (this.editor.isFoldedAtBufferRow(row)) {
        row = getLargestFoldRangeContainsBufferRow(this.editor, row).end.row;
      }
      return Math.min(row + 1, this.getVimLastBufferRow());
    };

    return MoveDown;

  })(MoveUp);

  MoveUpScreen = (function(superClass) {
    extend(MoveUpScreen, superClass);

    function MoveUpScreen() {
      return MoveUpScreen.__super__.constructor.apply(this, arguments);
    }

    MoveUpScreen.extend();

    MoveUpScreen.prototype.wise = 'linewise';

    MoveUpScreen.prototype.direction = 'up';

    MoveUpScreen.prototype.moveCursor = function(cursor) {
      return this.countTimes(function() {
        return moveCursorUpScreen(cursor);
      });
    };

    return MoveUpScreen;

  })(Motion);

  MoveDownScreen = (function(superClass) {
    extend(MoveDownScreen, superClass);

    function MoveDownScreen() {
      return MoveDownScreen.__super__.constructor.apply(this, arguments);
    }

    MoveDownScreen.extend();

    MoveDownScreen.prototype.wise = 'linewise';

    MoveDownScreen.prototype.direction = 'down';

    MoveDownScreen.prototype.moveCursor = function(cursor) {
      return this.countTimes(function() {
        return moveCursorDownScreen(cursor);
      });
    };

    return MoveDownScreen;

  })(MoveUpScreen);

  MoveUpToEdge = (function(superClass) {
    extend(MoveUpToEdge, superClass);

    function MoveUpToEdge() {
      return MoveUpToEdge.__super__.constructor.apply(this, arguments);
    }

    MoveUpToEdge.extend();

    MoveUpToEdge.prototype.wise = 'linewise';

    MoveUpToEdge.prototype.jump = true;

    MoveUpToEdge.prototype.direction = 'up';

    MoveUpToEdge.description = "Move cursor up to **edge** char at same-column";

    MoveUpToEdge.prototype.moveCursor = function(cursor) {
      var point;
      point = cursor.getScreenPosition();
      this.countTimes((function(_this) {
        return function(arg) {
          var newPoint, stop;
          stop = arg.stop;
          if ((newPoint = _this.getPoint(point))) {
            return point = newPoint;
          } else {
            return stop();
          }
        };
      })(this));
      return this.setScreenPositionSafely(cursor, point);
    };

    MoveUpToEdge.prototype.getPoint = function(fromPoint) {
      var column, i, len, point, ref2, row;
      column = fromPoint.column;
      ref2 = this.getScanRows(fromPoint);
      for (i = 0, len = ref2.length; i < len; i++) {
        row = ref2[i];
        if (point = new Point(row, column)) {
          if (this.isEdge(point)) {
            return point;
          }
        }
      }
    };

    MoveUpToEdge.prototype.getScanRows = function(arg) {
      var i, j, ref2, ref3, ref4, results, results1, row, validRow;
      row = arg.row;
      validRow = getValidVimScreenRow.bind(null, this.editor);
      switch (this.direction) {
        case 'up':
          return (function() {
            results = [];
            for (var i = ref2 = validRow(row - 1); ref2 <= 0 ? i <= 0 : i >= 0; ref2 <= 0 ? i++ : i--){ results.push(i); }
            return results;
          }).apply(this);
        case 'down':
          return (function() {
            results1 = [];
            for (var j = ref3 = validRow(row + 1), ref4 = this.getVimLastScreenRow(); ref3 <= ref4 ? j <= ref4 : j >= ref4; ref3 <= ref4 ? j++ : j--){ results1.push(j); }
            return results1;
          }).apply(this);
      }
    };

    MoveUpToEdge.prototype.isEdge = function(point) {
      var above, below;
      if (this.isStoppablePoint(point)) {
        above = point.translate([-1, 0]);
        below = point.translate([+1, 0]);
        return (!this.isStoppablePoint(above)) || (!this.isStoppablePoint(below));
      } else {
        return false;
      }
    };

    MoveUpToEdge.prototype.isStoppablePoint = function(point) {
      var leftPoint, rightPoint;
      if (this.isNonWhiteSpacePoint(point)) {
        return true;
      } else {
        leftPoint = point.translate([0, -1]);
        rightPoint = point.translate([0, +1]);
        return this.isNonWhiteSpacePoint(leftPoint) && this.isNonWhiteSpacePoint(rightPoint);
      }
    };

    MoveUpToEdge.prototype.isNonWhiteSpacePoint = function(point) {
      return screenPositionIsAtWhiteSpace(this.editor, point);
    };

    return MoveUpToEdge;

  })(Motion);

  MoveDownToEdge = (function(superClass) {
    extend(MoveDownToEdge, superClass);

    function MoveDownToEdge() {
      return MoveDownToEdge.__super__.constructor.apply(this, arguments);
    }

    MoveDownToEdge.extend();

    MoveDownToEdge.description = "Move cursor down to **edge** char at same-column";

    MoveDownToEdge.prototype.direction = 'down';

    return MoveDownToEdge;

  })(MoveUpToEdge);

  MoveToNextWord = (function(superClass) {
    extend(MoveToNextWord, superClass);

    function MoveToNextWord() {
      return MoveToNextWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextWord.extend();

    MoveToNextWord.prototype.wordRegex = null;

    MoveToNextWord.prototype.getPoint = function(cursor) {
      var cursorPoint, found, pattern, ref2, ref3, scanRange, wordRange;
      cursorPoint = cursor.getBufferPosition();
      pattern = (ref2 = this.wordRegex) != null ? ref2 : cursor.wordRegExp();
      scanRange = [cursorPoint, this.getVimEofBufferPosition()];
      wordRange = null;
      found = false;
      this.editor.scanInBufferRange(pattern, scanRange, function(arg) {
        var matchText, range, stop;
        range = arg.range, matchText = arg.matchText, stop = arg.stop;
        wordRange = range;
        if (matchText === '' && range.start.column !== 0) {
          return;
        }
        if (range.start.isGreaterThan(cursorPoint)) {
          found = true;
          return stop();
        }
      });
      if (found) {
        return wordRange.start;
      } else {
        return (ref3 = wordRange != null ? wordRange.end : void 0) != null ? ref3 : cursorPoint;
      }
    };

    MoveToNextWord.prototype.moveCursor = function(cursor) {
      var wasOnWhiteSpace;
      if (cursorIsAtVimEndOfFile(cursor)) {
        return;
      }
      wasOnWhiteSpace = cursorIsOnWhiteSpace(cursor);
      return this.countTimes((function(_this) {
        return function(arg) {
          var cursorRow, isFinal, point;
          isFinal = arg.isFinal;
          cursorRow = cursor.getBufferRow();
          if (cursorIsAtEmptyRow(cursor) && _this.isAsOperatorTarget()) {
            point = [cursorRow + 1, 0];
          } else {
            point = _this.getPoint(cursor);
            if (isFinal && _this.isAsOperatorTarget()) {
              if (_this.getOperator().getName() === 'Change' && (!wasOnWhiteSpace)) {
                point = cursor.getEndOfCurrentWordBufferPosition({
                  wordRegex: _this.wordRegex
                });
              } else if (point.row > cursorRow) {
                point = [cursorRow, 2e308];
              }
            }
          }
          return cursor.setBufferPosition(point);
        };
      })(this));
    };

    return MoveToNextWord;

  })(Motion);

  MoveToPreviousWord = (function(superClass) {
    extend(MoveToPreviousWord, superClass);

    function MoveToPreviousWord() {
      return MoveToPreviousWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousWord.extend();

    MoveToPreviousWord.prototype.wordRegex = null;

    MoveToPreviousWord.prototype.moveCursor = function(cursor) {
      return this.countTimes((function(_this) {
        return function() {
          var point;
          point = cursor.getBeginningOfCurrentWordBufferPosition({
            wordRegex: _this.wordRegex
          });
          return cursor.setBufferPosition(point);
        };
      })(this));
    };

    return MoveToPreviousWord;

  })(Motion);

  MoveToEndOfWord = (function(superClass) {
    extend(MoveToEndOfWord, superClass);

    function MoveToEndOfWord() {
      return MoveToEndOfWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfWord.extend();

    MoveToEndOfWord.prototype.wordRegex = null;

    MoveToEndOfWord.prototype.inclusive = true;

    MoveToEndOfWord.prototype.moveToNextEndOfWord = function(cursor) {
      var point;
      moveCursorToNextNonWhitespace(cursor);
      point = cursor.getEndOfCurrentWordBufferPosition({
        wordRegex: this.wordRegex
      }).translate([0, -1]);
      point = Point.min(point, this.getVimEofBufferPosition());
      return cursor.setBufferPosition(point);
    };

    MoveToEndOfWord.prototype.moveCursor = function(cursor) {
      return this.countTimes((function(_this) {
        return function() {
          var originalPoint;
          originalPoint = cursor.getBufferPosition();
          _this.moveToNextEndOfWord(cursor);
          if (originalPoint.isEqual(cursor.getBufferPosition())) {
            cursor.moveRight();
            return _this.moveToNextEndOfWord(cursor);
          }
        };
      })(this));
    };

    return MoveToEndOfWord;

  })(Motion);

  MoveToPreviousEndOfWord = (function(superClass) {
    extend(MoveToPreviousEndOfWord, superClass);

    function MoveToPreviousEndOfWord() {
      return MoveToPreviousEndOfWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousEndOfWord.extend();

    MoveToPreviousEndOfWord.prototype.inclusive = true;

    MoveToPreviousEndOfWord.prototype.moveCursor = function(cursor) {
      var cursorPosition, i, point, ref2, times, wordRange;
      times = this.getCount();
      wordRange = cursor.getCurrentWordBufferRange();
      cursorPosition = cursor.getBufferPosition();
      if (cursorPosition.isGreaterThan(wordRange.start) && cursorPosition.isLessThan(wordRange.end)) {
        times += 1;
      }
      for (i = 1, ref2 = times; 1 <= ref2 ? i <= ref2 : i >= ref2; 1 <= ref2 ? i++ : i--) {
        point = cursor.getBeginningOfCurrentWordBufferPosition({
          wordRegex: this.wordRegex
        });
        cursor.setBufferPosition(point);
      }
      this.moveToNextEndOfWord(cursor);
      if (cursor.getBufferPosition().isGreaterThanOrEqual(cursorPosition)) {
        return cursor.setBufferPosition([0, 0]);
      }
    };

    MoveToPreviousEndOfWord.prototype.moveToNextEndOfWord = function(cursor) {
      var point;
      point = cursor.getEndOfCurrentWordBufferPosition({
        wordRegex: this.wordRegex
      }).translate([0, -1]);
      point = Point.min(point, this.getVimEofBufferPosition());
      return cursor.setBufferPosition(point);
    };

    return MoveToPreviousEndOfWord;

  })(MoveToPreviousWord);

  MoveToNextWholeWord = (function(superClass) {
    extend(MoveToNextWholeWord, superClass);

    function MoveToNextWholeWord() {
      return MoveToNextWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextWholeWord.extend();

    MoveToNextWholeWord.prototype.wordRegex = /^\s*$|\S+/g;

    return MoveToNextWholeWord;

  })(MoveToNextWord);

  MoveToPreviousWholeWord = (function(superClass) {
    extend(MoveToPreviousWholeWord, superClass);

    function MoveToPreviousWholeWord() {
      return MoveToPreviousWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousWholeWord.extend();

    MoveToPreviousWholeWord.prototype.wordRegex = /^\s*$|\S+/;

    return MoveToPreviousWholeWord;

  })(MoveToPreviousWord);

  MoveToEndOfWholeWord = (function(superClass) {
    extend(MoveToEndOfWholeWord, superClass);

    function MoveToEndOfWholeWord() {
      return MoveToEndOfWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfWholeWord.extend();

    MoveToEndOfWholeWord.prototype.wordRegex = /\S+/;

    return MoveToEndOfWholeWord;

  })(MoveToEndOfWord);

  MoveToPreviousEndOfWholeWord = (function(superClass) {
    extend(MoveToPreviousEndOfWholeWord, superClass);

    function MoveToPreviousEndOfWholeWord() {
      return MoveToPreviousEndOfWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousEndOfWholeWord.extend();

    MoveToPreviousEndOfWholeWord.prototype.wordRegex = /\S+/;

    return MoveToPreviousEndOfWholeWord;

  })(MoveToPreviousEndOfWord);

  MoveToNextAlphanumericWord = (function(superClass) {
    extend(MoveToNextAlphanumericWord, superClass);

    function MoveToNextAlphanumericWord() {
      return MoveToNextAlphanumericWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextAlphanumericWord.extend();

    MoveToNextAlphanumericWord.description = "Move to next alphanumeric(`/\w+/`) word";

    MoveToNextAlphanumericWord.prototype.wordRegex = /\w+/g;

    return MoveToNextAlphanumericWord;

  })(MoveToNextWord);

  MoveToPreviousAlphanumericWord = (function(superClass) {
    extend(MoveToPreviousAlphanumericWord, superClass);

    function MoveToPreviousAlphanumericWord() {
      return MoveToPreviousAlphanumericWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousAlphanumericWord.extend();

    MoveToPreviousAlphanumericWord.description = "Move to previous alphanumeric(`/\w+/`) word";

    MoveToPreviousAlphanumericWord.prototype.wordRegex = /\w+/;

    return MoveToPreviousAlphanumericWord;

  })(MoveToPreviousWord);

  MoveToEndOfAlphanumericWord = (function(superClass) {
    extend(MoveToEndOfAlphanumericWord, superClass);

    function MoveToEndOfAlphanumericWord() {
      return MoveToEndOfAlphanumericWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfAlphanumericWord.extend();

    MoveToEndOfAlphanumericWord.description = "Move to end of alphanumeric(`/\w+/`) word";

    MoveToEndOfAlphanumericWord.prototype.wordRegex = /\w+/;

    return MoveToEndOfAlphanumericWord;

  })(MoveToEndOfWord);

  MoveToNextSmartWord = (function(superClass) {
    extend(MoveToNextSmartWord, superClass);

    function MoveToNextSmartWord() {
      return MoveToNextSmartWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextSmartWord.extend();

    MoveToNextSmartWord.description = "Move to next smart word (`/[\w-]+/`) word";

    MoveToNextSmartWord.prototype.wordRegex = /[\w-]+/g;

    return MoveToNextSmartWord;

  })(MoveToNextWord);

  MoveToPreviousSmartWord = (function(superClass) {
    extend(MoveToPreviousSmartWord, superClass);

    function MoveToPreviousSmartWord() {
      return MoveToPreviousSmartWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousSmartWord.extend();

    MoveToPreviousSmartWord.description = "Move to previous smart word (`/[\w-]+/`) word";

    MoveToPreviousSmartWord.prototype.wordRegex = /[\w-]+/;

    return MoveToPreviousSmartWord;

  })(MoveToPreviousWord);

  MoveToEndOfSmartWord = (function(superClass) {
    extend(MoveToEndOfSmartWord, superClass);

    function MoveToEndOfSmartWord() {
      return MoveToEndOfSmartWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfSmartWord.extend();

    MoveToEndOfSmartWord.description = "Move to end of smart word (`/[\w-]+/`) word";

    MoveToEndOfSmartWord.prototype.wordRegex = /[\w-]+/;

    return MoveToEndOfSmartWord;

  })(MoveToEndOfWord);

  MoveToNextSentence = (function(superClass) {
    extend(MoveToNextSentence, superClass);

    function MoveToNextSentence() {
      return MoveToNextSentence.__super__.constructor.apply(this, arguments);
    }

    MoveToNextSentence.extend();

    MoveToNextSentence.prototype.jump = true;

    MoveToNextSentence.prototype.sentenceRegex = /(?:[\.!\?][\)\]"']*\s+)|(\n|\r\n)/g;

    MoveToNextSentence.prototype.direction = 'next';

    MoveToNextSentence.prototype.moveCursor = function(cursor) {
      var point;
      point = cursor.getBufferPosition();
      this.countTimes((function(_this) {
        return function() {
          return point = _this.getPoint(point);
        };
      })(this));
      return cursor.setBufferPosition(point);
    };

    MoveToNextSentence.prototype.getPoint = function(fromPoint) {
      if (this.direction === 'next') {
        return this.getNextStartOfSentence(fromPoint);
      } else if (this.direction === 'previous') {
        return this.getPreviousStartOfSentence(fromPoint);
      }
    };

    MoveToNextSentence.prototype.getFirstCharacterPositionForRow = function(row) {
      return new Point(row, getFirstCharacterColumForBufferRow(this.editor, row));
    };

    MoveToNextSentence.prototype.isBlankRow = function(row) {
      return this.editor.isBufferRowBlank(row);
    };

    MoveToNextSentence.prototype.getNextStartOfSentence = function(fromPoint) {
      var foundPoint, scanRange;
      scanRange = new Range(fromPoint, this.getVimEofBufferPosition());
      foundPoint = null;
      this.editor.scanInBufferRange(this.sentenceRegex, scanRange, (function(_this) {
        return function(arg) {
          var endRow, match, matchText, range, ref2, ref3, startRow, stop;
          range = arg.range, matchText = arg.matchText, match = arg.match, stop = arg.stop;
          if (match[1] != null) {
            (ref2 = range.start, startRow = ref2.row), (ref3 = range.end, endRow = ref3.row);
            if (_this.skipBlankRow && _this.isBlankRow(endRow)) {
              return;
            }
            if (_this.isBlankRow(startRow) !== _this.isBlankRow(endRow)) {
              foundPoint = _this.getFirstCharacterPositionForRow(endRow);
            }
          } else {
            foundPoint = range.end;
          }
          if (foundPoint != null) {
            return stop();
          }
        };
      })(this));
      return foundPoint != null ? foundPoint : scanRange.end;
    };

    MoveToNextSentence.prototype.getPreviousStartOfSentence = function(fromPoint) {
      var foundPoint, scanRange;
      scanRange = new Range(fromPoint, [0, 0]);
      foundPoint = null;
      this.editor.backwardsScanInBufferRange(this.sentenceRegex, scanRange, (function(_this) {
        return function(arg) {
          var endRow, match, matchText, point, range, ref2, ref3, startRow, stop;
          range = arg.range, match = arg.match, stop = arg.stop, matchText = arg.matchText;
          if (match[1] != null) {
            (ref2 = range.start, startRow = ref2.row), (ref3 = range.end, endRow = ref3.row);
            if (!_this.isBlankRow(endRow) && _this.isBlankRow(startRow)) {
              point = _this.getFirstCharacterPositionForRow(endRow);
              if (point.isLessThan(fromPoint)) {
                foundPoint = point;
              } else {
                if (_this.skipBlankRow) {
                  return;
                }
                foundPoint = _this.getFirstCharacterPositionForRow(startRow);
              }
            }
          } else {
            if (range.end.isLessThan(fromPoint)) {
              foundPoint = range.end;
            }
          }
          if (foundPoint != null) {
            return stop();
          }
        };
      })(this));
      return foundPoint != null ? foundPoint : scanRange.start;
    };

    return MoveToNextSentence;

  })(Motion);

  MoveToPreviousSentence = (function(superClass) {
    extend(MoveToPreviousSentence, superClass);

    function MoveToPreviousSentence() {
      return MoveToPreviousSentence.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousSentence.extend();

    MoveToPreviousSentence.prototype.direction = 'previous';

    return MoveToPreviousSentence;

  })(MoveToNextSentence);

  MoveToNextSentenceSkipBlankRow = (function(superClass) {
    extend(MoveToNextSentenceSkipBlankRow, superClass);

    function MoveToNextSentenceSkipBlankRow() {
      return MoveToNextSentenceSkipBlankRow.__super__.constructor.apply(this, arguments);
    }

    MoveToNextSentenceSkipBlankRow.extend();

    MoveToNextSentenceSkipBlankRow.prototype.skipBlankRow = true;

    return MoveToNextSentenceSkipBlankRow;

  })(MoveToNextSentence);

  MoveToPreviousSentenceSkipBlankRow = (function(superClass) {
    extend(MoveToPreviousSentenceSkipBlankRow, superClass);

    function MoveToPreviousSentenceSkipBlankRow() {
      return MoveToPreviousSentenceSkipBlankRow.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousSentenceSkipBlankRow.extend();

    MoveToPreviousSentenceSkipBlankRow.prototype.skipBlankRow = true;

    return MoveToPreviousSentenceSkipBlankRow;

  })(MoveToPreviousSentence);

  MoveToNextParagraph = (function(superClass) {
    extend(MoveToNextParagraph, superClass);

    function MoveToNextParagraph() {
      return MoveToNextParagraph.__super__.constructor.apply(this, arguments);
    }

    MoveToNextParagraph.extend();

    MoveToNextParagraph.prototype.jump = true;

    MoveToNextParagraph.prototype.direction = 'next';

    MoveToNextParagraph.prototype.moveCursor = function(cursor) {
      var point;
      point = cursor.getBufferPosition();
      this.countTimes((function(_this) {
        return function() {
          return point = _this.getPoint(point);
        };
      })(this));
      return cursor.setBufferPosition(point);
    };

    MoveToNextParagraph.prototype.getPoint = function(fromPoint) {
      var i, len, ref2, row, startRow, wasAtNonBlankRow;
      startRow = fromPoint.row;
      wasAtNonBlankRow = !this.editor.isBufferRowBlank(startRow);
      ref2 = getBufferRows(this.editor, {
        startRow: startRow,
        direction: this.direction
      });
      for (i = 0, len = ref2.length; i < len; i++) {
        row = ref2[i];
        if (this.editor.isBufferRowBlank(row)) {
          if (wasAtNonBlankRow) {
            return new Point(row, 0);
          }
        } else {
          wasAtNonBlankRow = true;
        }
      }
      switch (this.direction) {
        case 'previous':
          return new Point(0, 0);
        case 'next':
          return this.getVimEofBufferPosition();
      }
    };

    return MoveToNextParagraph;

  })(Motion);

  MoveToPreviousParagraph = (function(superClass) {
    extend(MoveToPreviousParagraph, superClass);

    function MoveToPreviousParagraph() {
      return MoveToPreviousParagraph.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousParagraph.extend();

    MoveToPreviousParagraph.prototype.direction = 'previous';

    return MoveToPreviousParagraph;

  })(MoveToNextParagraph);

  MoveToBeginningOfLine = (function(superClass) {
    extend(MoveToBeginningOfLine, superClass);

    function MoveToBeginningOfLine() {
      return MoveToBeginningOfLine.__super__.constructor.apply(this, arguments);
    }

    MoveToBeginningOfLine.extend();

    MoveToBeginningOfLine.prototype.getPoint = function(arg) {
      var row;
      row = arg.row;
      return new Point(row, 0);
    };

    MoveToBeginningOfLine.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      return cursor.setBufferPosition(point);
    };

    return MoveToBeginningOfLine;

  })(Motion);

  MoveToColumn = (function(superClass) {
    extend(MoveToColumn, superClass);

    function MoveToColumn() {
      return MoveToColumn.__super__.constructor.apply(this, arguments);
    }

    MoveToColumn.extend();

    MoveToColumn.prototype.getCount = function() {
      return MoveToColumn.__super__.getCount.apply(this, arguments) - 1;
    };

    MoveToColumn.prototype.getPoint = function(arg) {
      var row;
      row = arg.row;
      return new Point(row, this.getCount());
    };

    MoveToColumn.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getScreenPosition());
      return cursor.setScreenPosition(point);
    };

    return MoveToColumn;

  })(Motion);

  MoveToLastCharacterOfLine = (function(superClass) {
    extend(MoveToLastCharacterOfLine, superClass);

    function MoveToLastCharacterOfLine() {
      return MoveToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    MoveToLastCharacterOfLine.extend();

    MoveToLastCharacterOfLine.prototype.getCount = function() {
      return MoveToLastCharacterOfLine.__super__.getCount.apply(this, arguments) - 1;
    };

    MoveToLastCharacterOfLine.prototype.getPoint = function(arg) {
      var row;
      row = arg.row;
      row = getValidVimBufferRow(this.editor, row + this.getCount());
      return new Point(row, 2e308);
    };

    MoveToLastCharacterOfLine.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      cursor.setBufferPosition(point);
      return cursor.goalColumn = 2e308;
    };

    return MoveToLastCharacterOfLine;

  })(Motion);

  MoveToLastNonblankCharacterOfLineAndDown = (function(superClass) {
    extend(MoveToLastNonblankCharacterOfLineAndDown, superClass);

    function MoveToLastNonblankCharacterOfLineAndDown() {
      return MoveToLastNonblankCharacterOfLineAndDown.__super__.constructor.apply(this, arguments);
    }

    MoveToLastNonblankCharacterOfLineAndDown.extend();

    MoveToLastNonblankCharacterOfLineAndDown.prototype.inclusive = true;

    MoveToLastNonblankCharacterOfLineAndDown.prototype.getCount = function() {
      return MoveToLastNonblankCharacterOfLineAndDown.__super__.getCount.apply(this, arguments) - 1;
    };

    MoveToLastNonblankCharacterOfLineAndDown.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      return cursor.setBufferPosition(point);
    };

    MoveToLastNonblankCharacterOfLineAndDown.prototype.getPoint = function(arg) {
      var from, point, row;
      row = arg.row;
      row = Math.min(row + this.getCount(), this.getVimLastBufferRow());
      from = new Point(row, 2e308);
      point = getStartPositionForPattern(this.editor, from, /\s*$/);
      return (point != null ? point : from).translate([0, -1]);
    };

    return MoveToLastNonblankCharacterOfLineAndDown;

  })(Motion);

  MoveToFirstCharacterOfLine = (function(superClass) {
    extend(MoveToFirstCharacterOfLine, superClass);

    function MoveToFirstCharacterOfLine() {
      return MoveToFirstCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLine.extend();

    MoveToFirstCharacterOfLine.prototype.moveCursor = function(cursor) {
      return this.setBufferPositionSafely(cursor, this.getPoint(cursor));
    };

    MoveToFirstCharacterOfLine.prototype.getPoint = function(cursor) {
      return getFirstCharacterPositionForBufferRow(this.editor, cursor.getBufferRow());
    };

    return MoveToFirstCharacterOfLine;

  })(Motion);

  MoveToFirstCharacterOfLineUp = (function(superClass) {
    extend(MoveToFirstCharacterOfLineUp, superClass);

    function MoveToFirstCharacterOfLineUp() {
      return MoveToFirstCharacterOfLineUp.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLineUp.extend();

    MoveToFirstCharacterOfLineUp.prototype.wise = 'linewise';

    MoveToFirstCharacterOfLineUp.prototype.moveCursor = function(cursor) {
      this.countTimes(function() {
        return moveCursorUpBuffer(cursor);
      });
      return MoveToFirstCharacterOfLineUp.__super__.moveCursor.apply(this, arguments);
    };

    return MoveToFirstCharacterOfLineUp;

  })(MoveToFirstCharacterOfLine);

  MoveToFirstCharacterOfLineDown = (function(superClass) {
    extend(MoveToFirstCharacterOfLineDown, superClass);

    function MoveToFirstCharacterOfLineDown() {
      return MoveToFirstCharacterOfLineDown.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLineDown.extend();

    MoveToFirstCharacterOfLineDown.prototype.wise = 'linewise';

    MoveToFirstCharacterOfLineDown.prototype.moveCursor = function(cursor) {
      this.countTimes(function() {
        return moveCursorDownBuffer(cursor);
      });
      return MoveToFirstCharacterOfLineDown.__super__.moveCursor.apply(this, arguments);
    };

    return MoveToFirstCharacterOfLineDown;

  })(MoveToFirstCharacterOfLine);

  MoveToFirstCharacterOfLineAndDown = (function(superClass) {
    extend(MoveToFirstCharacterOfLineAndDown, superClass);

    function MoveToFirstCharacterOfLineAndDown() {
      return MoveToFirstCharacterOfLineAndDown.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLineAndDown.extend();

    MoveToFirstCharacterOfLineAndDown.prototype.defaultCount = 0;

    MoveToFirstCharacterOfLineAndDown.prototype.getCount = function() {
      return MoveToFirstCharacterOfLineAndDown.__super__.getCount.apply(this, arguments) - 1;
    };

    return MoveToFirstCharacterOfLineAndDown;

  })(MoveToFirstCharacterOfLineDown);

  MoveToFirstLine = (function(superClass) {
    extend(MoveToFirstLine, superClass);

    function MoveToFirstLine() {
      return MoveToFirstLine.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstLine.extend();

    MoveToFirstLine.prototype.wise = 'linewise';

    MoveToFirstLine.prototype.jump = true;

    MoveToFirstLine.prototype.moveCursor = function(cursor) {
      cursor.setBufferPosition(this.getPoint());
      return cursor.autoscroll({
        center: true
      });
    };

    MoveToFirstLine.prototype.getPoint = function() {
      var row;
      row = getValidVimBufferRow(this.editor, this.getRow());
      return getFirstCharacterPositionForBufferRow(this.editor, row);
    };

    MoveToFirstLine.prototype.getRow = function() {
      return this.getCount() - 1;
    };

    return MoveToFirstLine;

  })(Motion);

  MoveToLastLine = (function(superClass) {
    extend(MoveToLastLine, superClass);

    function MoveToLastLine() {
      return MoveToLastLine.__super__.constructor.apply(this, arguments);
    }

    MoveToLastLine.extend();

    MoveToLastLine.prototype.defaultCount = 2e308;

    return MoveToLastLine;

  })(MoveToFirstLine);

  MoveToLineByPercent = (function(superClass) {
    extend(MoveToLineByPercent, superClass);

    function MoveToLineByPercent() {
      return MoveToLineByPercent.__super__.constructor.apply(this, arguments);
    }

    MoveToLineByPercent.extend();

    MoveToLineByPercent.prototype.getRow = function() {
      var percent;
      percent = Math.min(100, this.getCount());
      return Math.floor(this.getVimLastScreenRow() * (percent / 100));
    };

    return MoveToLineByPercent;

  })(MoveToFirstLine);

  MoveToRelativeLine = (function(superClass) {
    extend(MoveToRelativeLine, superClass);

    function MoveToRelativeLine() {
      return MoveToRelativeLine.__super__.constructor.apply(this, arguments);
    }

    MoveToRelativeLine.extend(false);

    MoveToRelativeLine.prototype.wise = 'linewise';

    MoveToRelativeLine.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      return cursor.setBufferPosition(point);
    };

    MoveToRelativeLine.prototype.getCount = function() {
      return MoveToRelativeLine.__super__.getCount.apply(this, arguments) - 1;
    };

    MoveToRelativeLine.prototype.getPoint = function(arg) {
      var row;
      row = arg.row;
      return [row + this.getCount(), 0];
    };

    return MoveToRelativeLine;

  })(Motion);

  MoveToRelativeLineWithMinimum = (function(superClass) {
    extend(MoveToRelativeLineWithMinimum, superClass);

    function MoveToRelativeLineWithMinimum() {
      return MoveToRelativeLineWithMinimum.__super__.constructor.apply(this, arguments);
    }

    MoveToRelativeLineWithMinimum.extend(false);

    MoveToRelativeLineWithMinimum.prototype.min = 0;

    MoveToRelativeLineWithMinimum.prototype.getCount = function() {
      return Math.max(this.min, MoveToRelativeLineWithMinimum.__super__.getCount.apply(this, arguments));
    };

    return MoveToRelativeLineWithMinimum;

  })(MoveToRelativeLine);

  MoveToTopOfScreen = (function(superClass) {
    extend(MoveToTopOfScreen, superClass);

    function MoveToTopOfScreen() {
      return MoveToTopOfScreen.__super__.constructor.apply(this, arguments);
    }

    MoveToTopOfScreen.extend();

    MoveToTopOfScreen.prototype.wise = 'linewise';

    MoveToTopOfScreen.prototype.jump = true;

    MoveToTopOfScreen.prototype.scrolloff = 2;

    MoveToTopOfScreen.prototype.defaultCount = 0;

    MoveToTopOfScreen.prototype.getCount = function() {
      return MoveToTopOfScreen.__super__.getCount.apply(this, arguments) - 1;
    };

    MoveToTopOfScreen.prototype.moveCursor = function(cursor) {
      return cursor.setBufferPosition(this.getPoint());
    };

    MoveToTopOfScreen.prototype.getPoint = function() {
      return getFirstCharacterBufferPositionForScreenRow(this.editor, this.getRow());
    };

    MoveToTopOfScreen.prototype.getScrolloff = function() {
      if (this.isAsOperatorTarget()) {
        return 0;
      } else {
        return this.scrolloff;
      }
    };

    MoveToTopOfScreen.prototype.getRow = function() {
      var offset, row;
      row = getFirstVisibleScreenRow(this.editor);
      offset = this.getScrolloff();
      if (row === 0) {
        offset = 0;
      }
      offset = Math.max(this.getCount(), offset);
      return row + offset;
    };

    return MoveToTopOfScreen;

  })(Motion);

  MoveToMiddleOfScreen = (function(superClass) {
    extend(MoveToMiddleOfScreen, superClass);

    function MoveToMiddleOfScreen() {
      return MoveToMiddleOfScreen.__super__.constructor.apply(this, arguments);
    }

    MoveToMiddleOfScreen.extend();

    MoveToMiddleOfScreen.prototype.getRow = function() {
      var endRow, startRow, vimLastScreenRow;
      startRow = getFirstVisibleScreenRow(this.editor);
      vimLastScreenRow = this.getVimLastScreenRow();
      endRow = Math.min(this.editor.getLastVisibleScreenRow(), vimLastScreenRow);
      return startRow + Math.floor((endRow - startRow) / 2);
    };

    return MoveToMiddleOfScreen;

  })(MoveToTopOfScreen);

  MoveToBottomOfScreen = (function(superClass) {
    extend(MoveToBottomOfScreen, superClass);

    function MoveToBottomOfScreen() {
      return MoveToBottomOfScreen.__super__.constructor.apply(this, arguments);
    }

    MoveToBottomOfScreen.extend();

    MoveToBottomOfScreen.prototype.getRow = function() {
      var offset, row, vimLastScreenRow;
      vimLastScreenRow = this.getVimLastScreenRow();
      row = Math.min(this.editor.getLastVisibleScreenRow(), vimLastScreenRow);
      offset = this.getScrolloff() + 1;
      if (row === vimLastScreenRow) {
        offset = 0;
      }
      offset = Math.max(this.getCount(), offset);
      return row - offset;
    };

    return MoveToBottomOfScreen;

  })(MoveToTopOfScreen);

  ScrollFullScreenDown = (function(superClass) {
    extend(ScrollFullScreenDown, superClass);

    function ScrollFullScreenDown() {
      return ScrollFullScreenDown.__super__.constructor.apply(this, arguments);
    }

    ScrollFullScreenDown.extend();

    ScrollFullScreenDown.prototype.amountOfPage = +1;

    ScrollFullScreenDown.prototype.isSmoothScrollEnabled = function() {
      if (Math.abs(this.amountOfPage) === 1) {
        return settings.get('smoothScrollOnFullScrollMotion');
      } else {
        return settings.get('smoothScrollOnHalfScrollMotion');
      }
    };

    ScrollFullScreenDown.prototype.getSmoothScrollDuation = function() {
      if (Math.abs(this.amountOfPage) === 1) {
        return settings.get('smoothScrollOnFullScrollMotionDuration');
      } else {
        return settings.get('smoothScrollOnHalfScrollMotionDuration');
      }
    };

    ScrollFullScreenDown.prototype.getPixelRectTopForSceenRow = function(row) {
      var point;
      point = new Point(row, 0);
      return this.editor.element.pixelRectForScreenRange(new Range(point, point)).top;
    };

    ScrollFullScreenDown.prototype.smoothScroll = function(fromRow, toRow, options) {
      var topPixelFrom, topPixelTo;
      if (options == null) {
        options = {};
      }
      topPixelFrom = {
        top: this.getPixelRectTopForSceenRow(fromRow)
      };
      topPixelTo = {
        top: this.getPixelRectTopForSceenRow(toRow)
      };
      options.step = (function(_this) {
        return function(newTop) {
          return _this.editor.element.setScrollTop(newTop);
        };
      })(this);
      options.duration = this.getSmoothScrollDuation();
      return this.vimState.requestScrollAnimation(topPixelFrom, topPixelTo, options);
    };

    ScrollFullScreenDown.prototype.getAmountOfRows = function() {
      return Math.ceil(this.amountOfPage * this.editor.getRowsPerPage() * this.getCount());
    };

    ScrollFullScreenDown.prototype.getPoint = function(cursor) {
      var row;
      row = getValidVimScreenRow(this.editor, cursor.getScreenRow() + this.getAmountOfRows());
      return getFirstCharacterScreenPositionForScreenRow(this.editor, row);
    };

    ScrollFullScreenDown.prototype.moveCursor = function(cursor) {
      var currentTopRow, done, finalTopRow;
      cursor.setScreenPosition(this.getPoint(cursor), {
        autoscroll: false
      });
      if (cursor.isLastCursor()) {
        if (this.isSmoothScrollEnabled()) {
          this.vimState.finishScrollAnimation();
        }
        currentTopRow = this.editor.getFirstVisibleScreenRow();
        finalTopRow = currentTopRow + this.getAmountOfRows();
        done = (function(_this) {
          return function() {
            return _this.editor.setFirstVisibleScreenRow(finalTopRow);
          };
        })(this);
        if (this.isSmoothScrollEnabled()) {
          return this.smoothScroll(currentTopRow, finalTopRow, {
            done: done
          });
        } else {
          return done();
        }
      }
    };

    return ScrollFullScreenDown;

  })(Motion);

  ScrollFullScreenUp = (function(superClass) {
    extend(ScrollFullScreenUp, superClass);

    function ScrollFullScreenUp() {
      return ScrollFullScreenUp.__super__.constructor.apply(this, arguments);
    }

    ScrollFullScreenUp.extend();

    ScrollFullScreenUp.prototype.amountOfPage = -1;

    return ScrollFullScreenUp;

  })(ScrollFullScreenDown);

  ScrollHalfScreenDown = (function(superClass) {
    extend(ScrollHalfScreenDown, superClass);

    function ScrollHalfScreenDown() {
      return ScrollHalfScreenDown.__super__.constructor.apply(this, arguments);
    }

    ScrollHalfScreenDown.extend();

    ScrollHalfScreenDown.prototype.amountOfPage = +1 / 2;

    return ScrollHalfScreenDown;

  })(ScrollFullScreenDown);

  ScrollHalfScreenUp = (function(superClass) {
    extend(ScrollHalfScreenUp, superClass);

    function ScrollHalfScreenUp() {
      return ScrollHalfScreenUp.__super__.constructor.apply(this, arguments);
    }

    ScrollHalfScreenUp.extend();

    ScrollHalfScreenUp.prototype.amountOfPage = -1 / 2;

    return ScrollHalfScreenUp;

  })(ScrollHalfScreenDown);

  Find = (function(superClass) {
    extend(Find, superClass);

    function Find() {
      return Find.__super__.constructor.apply(this, arguments);
    }

    Find.extend();

    Find.prototype.backwards = false;

    Find.prototype.inclusive = true;

    Find.prototype.hover = {
      icon: ':find:',
      emoji: ':mag_right:'
    };

    Find.prototype.offset = 0;

    Find.prototype.requireInput = true;

    Find.prototype.initialize = function() {
      Find.__super__.initialize.apply(this, arguments);
      if (!this.isComplete()) {
        return this.focusInput();
      }
    };

    Find.prototype.isBackwards = function() {
      return this.backwards;
    };

    Find.prototype.getPoint = function(fromPoint) {
      var end, method, offset, points, ref2, ref3, scanRange, start, unOffset;
      ref2 = this.editor.bufferRangeForBufferRow(fromPoint.row), start = ref2.start, end = ref2.end;
      offset = this.isBackwards() ? this.offset : -this.offset;
      unOffset = -offset * this.isRepeated();
      if (this.isBackwards()) {
        scanRange = [start, fromPoint.translate([0, unOffset])];
        method = 'backwardsScanInBufferRange';
      } else {
        scanRange = [fromPoint.translate([0, 1 + unOffset]), end];
        method = 'scanInBufferRange';
      }
      points = [];
      this.editor[method](RegExp("" + (_.escapeRegExp(this.input)), "g"), scanRange, function(arg) {
        var range;
        range = arg.range;
        return points.push(range.start);
      });
      return (ref3 = points[this.getCount()]) != null ? ref3.translate([0, offset]) : void 0;
    };

    Find.prototype.getCount = function() {
      return Find.__super__.getCount.apply(this, arguments) - 1;
    };

    Find.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      this.setBufferPositionSafely(cursor, point);
      if (!this.isRepeated()) {
        return this.globalState.set('currentFind', this);
      }
    };

    return Find;

  })(Motion);

  FindBackwards = (function(superClass) {
    extend(FindBackwards, superClass);

    function FindBackwards() {
      return FindBackwards.__super__.constructor.apply(this, arguments);
    }

    FindBackwards.extend();

    FindBackwards.prototype.inclusive = false;

    FindBackwards.prototype.backwards = true;

    FindBackwards.prototype.hover = {
      icon: ':find:',
      emoji: ':mag:'
    };

    return FindBackwards;

  })(Find);

  Till = (function(superClass) {
    extend(Till, superClass);

    function Till() {
      return Till.__super__.constructor.apply(this, arguments);
    }

    Till.extend();

    Till.prototype.offset = 1;

    Till.prototype.getPoint = function() {
      return this.point = Till.__super__.getPoint.apply(this, arguments);
    };

    Till.prototype.selectByMotion = function(selection) {
      Till.__super__.selectByMotion.apply(this, arguments);
      if (selection.isEmpty() && ((this.point != null) && !this.backwards)) {
        return swrap(selection).translateSelectionEndAndClip('forward');
      }
    };

    return Till;

  })(Find);

  TillBackwards = (function(superClass) {
    extend(TillBackwards, superClass);

    function TillBackwards() {
      return TillBackwards.__super__.constructor.apply(this, arguments);
    }

    TillBackwards.extend();

    TillBackwards.prototype.inclusive = false;

    TillBackwards.prototype.backwards = true;

    return TillBackwards;

  })(Till);

  MoveToMark = (function(superClass) {
    extend(MoveToMark, superClass);

    function MoveToMark() {
      return MoveToMark.__super__.constructor.apply(this, arguments);
    }

    MoveToMark.extend();

    MoveToMark.prototype.jump = true;

    MoveToMark.prototype.requireInput = true;

    MoveToMark.prototype.hover = {
      icon: ":move-to-mark:`",
      emoji: ":round_pushpin:`"
    };

    MoveToMark.prototype.input = null;

    MoveToMark.prototype.initialize = function() {
      MoveToMark.__super__.initialize.apply(this, arguments);
      if (!this.isComplete()) {
        return this.focusInput();
      }
    };

    MoveToMark.prototype.getPoint = function() {
      return this.vimState.mark.get(this.getInput());
    };

    MoveToMark.prototype.moveCursor = function(cursor) {
      var point;
      if (point = this.getPoint()) {
        cursor.setBufferPosition(point);
        return cursor.autoscroll({
          center: true
        });
      }
    };

    return MoveToMark;

  })(Motion);

  MoveToMarkLine = (function(superClass) {
    extend(MoveToMarkLine, superClass);

    function MoveToMarkLine() {
      return MoveToMarkLine.__super__.constructor.apply(this, arguments);
    }

    MoveToMarkLine.extend();

    MoveToMarkLine.prototype.hover = {
      icon: ":move-to-mark:'",
      emoji: ":round_pushpin:'"
    };

    MoveToMarkLine.prototype.wise = 'linewise';

    MoveToMarkLine.prototype.getPoint = function() {
      var point;
      if (point = MoveToMarkLine.__super__.getPoint.apply(this, arguments)) {
        return getFirstCharacterPositionForBufferRow(this.editor, point.row);
      }
    };

    return MoveToMarkLine;

  })(MoveToMark);

  MoveToPreviousFoldStart = (function(superClass) {
    extend(MoveToPreviousFoldStart, superClass);

    function MoveToPreviousFoldStart() {
      return MoveToPreviousFoldStart.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousFoldStart.extend();

    MoveToPreviousFoldStart.description = "Move to previous fold start";

    MoveToPreviousFoldStart.prototype.wise = 'characterwise';

    MoveToPreviousFoldStart.prototype.which = 'start';

    MoveToPreviousFoldStart.prototype.direction = 'prev';

    MoveToPreviousFoldStart.prototype.initialize = function() {
      MoveToPreviousFoldStart.__super__.initialize.apply(this, arguments);
      this.rows = this.getFoldRows(this.which);
      if (this.direction === 'prev') {
        return this.rows.reverse();
      }
    };

    MoveToPreviousFoldStart.prototype.getFoldRows = function(which) {
      var index, rows;
      index = which === 'start' ? 0 : 1;
      rows = getCodeFoldRowRanges(this.editor).map(function(rowRange) {
        return rowRange[index];
      });
      return _.sortBy(_.uniq(rows), function(row) {
        return row;
      });
    };

    MoveToPreviousFoldStart.prototype.getScanRows = function(cursor) {
      var cursorRow, isValidRow;
      cursorRow = cursor.getBufferRow();
      isValidRow = (function() {
        switch (this.direction) {
          case 'prev':
            return function(row) {
              return row < cursorRow;
            };
          case 'next':
            return function(row) {
              return row > cursorRow;
            };
        }
      }).call(this);
      return this.rows.filter(isValidRow);
    };

    MoveToPreviousFoldStart.prototype.detectRow = function(cursor) {
      return this.getScanRows(cursor)[0];
    };

    MoveToPreviousFoldStart.prototype.moveCursor = function(cursor) {
      return this.countTimes((function(_this) {
        return function() {
          var row;
          if ((row = _this.detectRow(cursor)) != null) {
            return moveCursorToFirstCharacterAtRow(cursor, row);
          }
        };
      })(this));
    };

    return MoveToPreviousFoldStart;

  })(Motion);

  MoveToNextFoldStart = (function(superClass) {
    extend(MoveToNextFoldStart, superClass);

    function MoveToNextFoldStart() {
      return MoveToNextFoldStart.__super__.constructor.apply(this, arguments);
    }

    MoveToNextFoldStart.extend();

    MoveToNextFoldStart.description = "Move to next fold start";

    MoveToNextFoldStart.prototype.direction = 'next';

    return MoveToNextFoldStart;

  })(MoveToPreviousFoldStart);

  MoveToPreviousFoldStartWithSameIndent = (function(superClass) {
    extend(MoveToPreviousFoldStartWithSameIndent, superClass);

    function MoveToPreviousFoldStartWithSameIndent() {
      return MoveToPreviousFoldStartWithSameIndent.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousFoldStartWithSameIndent.extend();

    MoveToPreviousFoldStartWithSameIndent.description = "Move to previous same-indented fold start";

    MoveToPreviousFoldStartWithSameIndent.prototype.detectRow = function(cursor) {
      var baseIndentLevel, i, len, ref2, row;
      baseIndentLevel = getIndentLevelForBufferRow(this.editor, cursor.getBufferRow());
      ref2 = this.getScanRows(cursor);
      for (i = 0, len = ref2.length; i < len; i++) {
        row = ref2[i];
        if (getIndentLevelForBufferRow(this.editor, row) === baseIndentLevel) {
          return row;
        }
      }
      return null;
    };

    return MoveToPreviousFoldStartWithSameIndent;

  })(MoveToPreviousFoldStart);

  MoveToNextFoldStartWithSameIndent = (function(superClass) {
    extend(MoveToNextFoldStartWithSameIndent, superClass);

    function MoveToNextFoldStartWithSameIndent() {
      return MoveToNextFoldStartWithSameIndent.__super__.constructor.apply(this, arguments);
    }

    MoveToNextFoldStartWithSameIndent.extend();

    MoveToNextFoldStartWithSameIndent.description = "Move to next same-indented fold start";

    MoveToNextFoldStartWithSameIndent.prototype.direction = 'next';

    return MoveToNextFoldStartWithSameIndent;

  })(MoveToPreviousFoldStartWithSameIndent);

  MoveToPreviousFoldEnd = (function(superClass) {
    extend(MoveToPreviousFoldEnd, superClass);

    function MoveToPreviousFoldEnd() {
      return MoveToPreviousFoldEnd.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousFoldEnd.extend();

    MoveToPreviousFoldEnd.description = "Move to previous fold end";

    MoveToPreviousFoldEnd.prototype.which = 'end';

    return MoveToPreviousFoldEnd;

  })(MoveToPreviousFoldStart);

  MoveToNextFoldEnd = (function(superClass) {
    extend(MoveToNextFoldEnd, superClass);

    function MoveToNextFoldEnd() {
      return MoveToNextFoldEnd.__super__.constructor.apply(this, arguments);
    }

    MoveToNextFoldEnd.extend();

    MoveToNextFoldEnd.description = "Move to next fold end";

    MoveToNextFoldEnd.prototype.direction = 'next';

    return MoveToNextFoldEnd;

  })(MoveToPreviousFoldEnd);

  MoveToPreviousFunction = (function(superClass) {
    extend(MoveToPreviousFunction, superClass);

    function MoveToPreviousFunction() {
      return MoveToPreviousFunction.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousFunction.extend();

    MoveToPreviousFunction.description = "Move to previous function";

    MoveToPreviousFunction.prototype.direction = 'prev';

    MoveToPreviousFunction.prototype.detectRow = function(cursor) {
      return _.detect(this.getScanRows(cursor), (function(_this) {
        return function(row) {
          return isIncludeFunctionScopeForRow(_this.editor, row);
        };
      })(this));
    };

    return MoveToPreviousFunction;

  })(MoveToPreviousFoldStart);

  MoveToNextFunction = (function(superClass) {
    extend(MoveToNextFunction, superClass);

    function MoveToNextFunction() {
      return MoveToNextFunction.__super__.constructor.apply(this, arguments);
    }

    MoveToNextFunction.extend();

    MoveToNextFunction.description = "Move to next function";

    MoveToNextFunction.prototype.direction = 'next';

    return MoveToNextFunction;

  })(MoveToPreviousFunction);

  MoveToPositionByScope = (function(superClass) {
    extend(MoveToPositionByScope, superClass);

    function MoveToPositionByScope() {
      return MoveToPositionByScope.__super__.constructor.apply(this, arguments);
    }

    MoveToPositionByScope.extend(false);

    MoveToPositionByScope.prototype.direction = 'backward';

    MoveToPositionByScope.prototype.scope = '.';

    MoveToPositionByScope.prototype.getPoint = function(fromPoint) {
      return detectScopeStartPositionForScope(this.editor, fromPoint, this.direction, this.scope);
    };

    MoveToPositionByScope.prototype.moveCursor = function(cursor) {
      var point;
      point = cursor.getBufferPosition();
      this.countTimes((function(_this) {
        return function(arg) {
          var newPoint, stop;
          stop = arg.stop;
          if ((newPoint = _this.getPoint(point))) {
            return point = newPoint;
          } else {
            return stop();
          }
        };
      })(this));
      return this.setBufferPositionSafely(cursor, point);
    };

    return MoveToPositionByScope;

  })(Motion);

  MoveToPreviousString = (function(superClass) {
    extend(MoveToPreviousString, superClass);

    function MoveToPreviousString() {
      return MoveToPreviousString.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousString.extend();

    MoveToPreviousString.description = "Move to previous string(searched by `string.begin` scope)";

    MoveToPreviousString.prototype.direction = 'backward';

    MoveToPreviousString.prototype.scope = 'string.begin';

    return MoveToPreviousString;

  })(MoveToPositionByScope);

  MoveToNextString = (function(superClass) {
    extend(MoveToNextString, superClass);

    function MoveToNextString() {
      return MoveToNextString.__super__.constructor.apply(this, arguments);
    }

    MoveToNextString.extend();

    MoveToNextString.description = "Move to next string(searched by `string.begin` scope)";

    MoveToNextString.prototype.direction = 'forward';

    return MoveToNextString;

  })(MoveToPreviousString);

  MoveToPreviousNumber = (function(superClass) {
    extend(MoveToPreviousNumber, superClass);

    function MoveToPreviousNumber() {
      return MoveToPreviousNumber.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousNumber.extend();

    MoveToPreviousNumber.prototype.direction = 'backward';

    MoveToPreviousNumber.description = "Move to previous number(searched by `constant.numeric` scope)";

    MoveToPreviousNumber.prototype.scope = 'constant.numeric';

    return MoveToPreviousNumber;

  })(MoveToPositionByScope);

  MoveToNextNumber = (function(superClass) {
    extend(MoveToNextNumber, superClass);

    function MoveToNextNumber() {
      return MoveToNextNumber.__super__.constructor.apply(this, arguments);
    }

    MoveToNextNumber.extend();

    MoveToNextNumber.description = "Move to next number(searched by `constant.numeric` scope)";

    MoveToNextNumber.prototype.direction = 'forward';

    return MoveToNextNumber;

  })(MoveToPreviousNumber);

  MoveToPair = (function(superClass) {
    extend(MoveToPair, superClass);

    function MoveToPair() {
      return MoveToPair.__super__.constructor.apply(this, arguments);
    }

    MoveToPair.extend();

    MoveToPair.prototype.inclusive = true;

    MoveToPair.prototype.jump = true;

    MoveToPair.prototype.member = ['Parenthesis', 'CurlyBracket', 'SquareBracket', 'AngleBracket'];

    MoveToPair.prototype.moveCursor = function(cursor) {
      return this.setBufferPositionSafely(cursor, this.getPoint(cursor));
    };

    MoveToPair.prototype.getPoint = function(cursor) {
      var cursorPosition, cursorRow, enclosingRange, enclosingRanges, forwardingRanges, getPointForTag, point, ranges, ref2, ref3;
      cursorPosition = cursor.getBufferPosition();
      cursorRow = cursorPosition.row;
      getPointForTag = (function(_this) {
        return function() {
          var closeRange, openRange, p, pairInfo;
          p = cursorPosition;
          pairInfo = _this["new"]("ATag").getPairInfo(p);
          if (pairInfo == null) {
            return null;
          }
          openRange = pairInfo.openRange, closeRange = pairInfo.closeRange;
          openRange = openRange.translate([0, +1], [0, -1]);
          closeRange = closeRange.translate([0, +1], [0, -1]);
          if (openRange.containsPoint(p) && (!p.isEqual(openRange.end))) {
            return closeRange.start;
          }
          if (closeRange.containsPoint(p) && (!p.isEqual(closeRange.end))) {
            return openRange.start;
          }
        };
      })(this);
      point = getPointForTag();
      if (point != null) {
        return point;
      }
      ranges = this["new"]("AAnyPair", {
        allowForwarding: true,
        member: this.member
      }).getRanges(cursor.selection);
      ranges = ranges.filter(function(arg) {
        var end, p, start;
        start = arg.start, end = arg.end;
        p = cursorPosition;
        return (p.row === start.row) && start.isGreaterThanOrEqual(p) || (p.row === end.row) && end.isGreaterThanOrEqual(p);
      });
      if (!ranges.length) {
        return null;
      }
      ref2 = _.partition(ranges, function(range) {
        return range.containsPoint(cursorPosition, true);
      }), enclosingRanges = ref2[0], forwardingRanges = ref2[1];
      enclosingRange = _.last(sortRanges(enclosingRanges));
      forwardingRanges = sortRanges(forwardingRanges);
      if (enclosingRange) {
        forwardingRanges = forwardingRanges.filter(function(range) {
          return enclosingRange.containsRange(range);
        });
      }
      return ((ref3 = forwardingRanges[0]) != null ? ref3.end.translate([0, -1]) : void 0) || (enclosingRange != null ? enclosingRange.start : void 0);
    };

    return MoveToPair;

  })(Motion);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvbW90aW9uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNDJFQUFBO0lBQUE7OztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBaUIsT0FBQSxDQUFRLE1BQVIsQ0FBakIsRUFBQyxpQkFBRCxFQUFROztFQUNSLE1BQUEsR0FBUzs7RUFFVCxPQThCSSxPQUFBLENBQVEsU0FBUixDQTlCSixFQUNFLHNDQURGLEVBQ21CLGtEQURuQixFQUVFLG9DQUZGLEVBRWtCLHNDQUZsQixFQUdFLDRDQUhGLEVBR3NCLGdEQUh0QixFQUlFLGdEQUpGLEVBS0UsNENBTEYsRUFNRSxvREFORixFQU9FLHdEQVBGLEVBTzRCLHNEQVA1QixFQVFFLGdEQVJGLEVBUXdCLGdEQVJ4QixFQVNFLHNDQVRGLEVBVUUsc0VBVkYsRUFXRSw0QkFYRixFQVlFLDREQVpGLEVBYUUsZ0RBYkYsRUFjRSxrRUFkRixFQWVFLDRDQWZGLEVBZ0JFLGdEQWhCRixFQWlCRSxnRkFqQkYsRUFrQkUsZ0VBbEJGLEVBbUJFLHdFQW5CRixFQW9CRSxrQ0FwQkYsRUFxQkUsNERBckJGLEVBc0JFLGtGQXRCRixFQXVCRSw4RkF2QkYsRUF3QkUsZ0VBeEJGLEVBeUJFLHdFQXpCRixFQTBCRSw0RUExQkYsRUEyQkUsOEZBM0JGLEVBNkJFOztFQUdGLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBQ1IsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUNYLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFFRDs7O0lBQ0osTUFBQyxDQUFBLE1BQUQsQ0FBUSxLQUFSOztxQkFDQSxTQUFBLEdBQVc7O3FCQUNYLElBQUEsR0FBTTs7cUJBQ04sSUFBQSxHQUFNOztJQUVPLGdCQUFBO01BQ1gseUNBQUEsU0FBQTtNQUdBLElBQUcsSUFBQyxDQUFBLE1BQUQsQ0FBUSxRQUFSLENBQUg7UUFDRSxJQUFDLENBQUEsU0FBRCxHQUFhO1FBQ2IsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsUUFBUSxDQUFDLFFBRnBCOztNQUdBLElBQUMsQ0FBQSxVQUFELENBQUE7SUFQVzs7cUJBU2IsV0FBQSxHQUFhLFNBQUE7YUFDWCxJQUFDLENBQUE7SUFEVTs7cUJBR2IsTUFBQSxHQUFRLFNBQUE7YUFDTixJQUFDLENBQUE7SUFESzs7cUJBR1IsZUFBQSxHQUFpQixTQUFBO2FBQ2YsSUFBQyxDQUFBLElBQUQsS0FBUztJQURNOztxQkFHakIsVUFBQSxHQUFZLFNBQUE7YUFDVixJQUFDLENBQUEsSUFBRCxLQUFTO0lBREM7O3FCQUdaLFdBQUEsR0FBYSxTQUFBO2FBQ1gsSUFBQyxDQUFBLElBQUQsS0FBUztJQURFOztxQkFHYixTQUFBLEdBQVcsU0FBQyxJQUFEO01BQ1QsSUFBRyxJQUFBLEtBQVEsZUFBWDtRQUNFLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxVQUFaO1VBQ0UsSUFBQyxDQUFBLFNBQUQsR0FBYSxNQURmO1NBQUEsTUFBQTtVQUdFLElBQUMsQ0FBQSxTQUFELEdBQWEsQ0FBSSxJQUFDLENBQUEsVUFIcEI7U0FERjs7YUFLQSxJQUFDLENBQUEsSUFBRCxHQUFRO0lBTkM7O3FCQVFYLHVCQUFBLEdBQXlCLFNBQUMsTUFBRCxFQUFTLEtBQVQ7TUFDdkIsSUFBbUMsYUFBbkM7ZUFBQSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBekIsRUFBQTs7SUFEdUI7O3FCQUd6Qix1QkFBQSxHQUF5QixTQUFDLE1BQUQsRUFBUyxLQUFUO01BQ3ZCLElBQW1DLGFBQW5DO2VBQUEsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQXpCLEVBQUE7O0lBRHVCOztxQkFHekIsZ0JBQUEsR0FBa0IsU0FBQyxNQUFEO0FBQ2hCLFVBQUE7TUFBQSxJQUFHLE1BQU0sQ0FBQyxZQUFQLENBQUEsQ0FBQSxJQUEwQixJQUFDLENBQUEsTUFBRCxDQUFBLENBQTdCO1FBQ0UsY0FBQSxHQUFpQixNQUFNLENBQUMsaUJBQVAsQ0FBQSxFQURuQjs7TUFHQSxJQUFDLENBQUEsVUFBRCxDQUFZLE1BQVo7TUFFQSxJQUFHLHdCQUFBLElBQW9CLENBQUksY0FBYyxDQUFDLE9BQWYsQ0FBdUIsTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBdkIsQ0FBM0I7UUFDRSxJQUFDLENBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFmLENBQW1CLEdBQW5CLEVBQXdCLGNBQXhCO2VBQ0EsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBZixDQUFtQixHQUFuQixFQUF3QixjQUF4QixFQUZGOztJQU5nQjs7cUJBVWxCLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLE1BQU0sQ0FBQyxXQUFSLENBQW9CLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxNQUFEO2lCQUNsQixLQUFDLENBQUEsZ0JBQUQsQ0FBa0IsTUFBbEI7UUFEa0I7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXBCO0lBRE87O3FCQUlULE1BQUEsR0FBUSxTQUFBO0FBQ04sVUFBQTtNQUFBLElBQStDLElBQUMsQ0FBQSxNQUFELENBQVEsUUFBUixDQUEvQztRQUFBLElBQUMsQ0FBQSxRQUFRLENBQUMsV0FBVyxDQUFDLG1CQUF0QixDQUFBLEVBQUE7O0FBRUE7QUFBQSxXQUFBLHNDQUFBOztRQUNFLElBQUMsQ0FBQSxjQUFELENBQWdCLFNBQWhCO0FBREY7TUFHQSxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBQTtNQUNBLElBQUMsQ0FBQSxNQUFNLENBQUMsMkJBQVIsQ0FBQTtNQUVBLElBQWdDLElBQUMsQ0FBQSxNQUFELENBQVEsUUFBUixDQUFoQztRQUFBLElBQUMsQ0FBQSx5QkFBRCxDQUFBLEVBQUE7O0FBR0EsY0FBTyxJQUFDLENBQUEsSUFBUjtBQUFBLGFBQ08sVUFEUDtpQkFDdUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxjQUFWLENBQUE7QUFEdkIsYUFFTyxXQUZQO2lCQUV3QixJQUFDLENBQUEsUUFBUSxDQUFDLGVBQVYsQ0FBQTtBQUZ4QjtJQVpNOztxQkFnQlIsY0FBQSxHQUFnQixTQUFDLFNBQUQ7QUFDZCxVQUFBO01BQUMsU0FBVTtNQUVYLFNBQVMsQ0FBQyxlQUFWLENBQTBCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDeEIsS0FBQyxDQUFBLGdCQUFELENBQWtCLE1BQWxCO1FBRHdCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUExQjtNQUdBLElBQVUsQ0FBSSxJQUFDLENBQUEsTUFBRCxDQUFRLFFBQVIsQ0FBSixJQUEwQixTQUFTLENBQUMsT0FBVixDQUFBLENBQXBDO0FBQUEsZUFBQTs7TUFDQSxJQUFBLENBQUEsQ0FBYyxJQUFDLENBQUEsV0FBRCxDQUFBLENBQUEsSUFBa0IsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFoQyxDQUFBO0FBQUEsZUFBQTs7TUFFQSxJQUFHLElBQUMsQ0FBQSxNQUFELENBQVEsUUFBUixDQUFBLElBQXNCLGdDQUFBLENBQWlDLE1BQWpDLENBQXpCO1FBRUUsS0FBQSxDQUFNLFNBQU4sQ0FBZ0IsQ0FBQyw2QkFBakIsQ0FBK0MsVUFBL0MsRUFGRjs7YUFJQSxLQUFBLENBQU0sU0FBTixDQUFnQixDQUFDLDRCQUFqQixDQUE4QyxTQUE5QztJQWJjOzs7O0tBMUVHOztFQTBGZjs7Ozs7OztJQUNKLGdCQUFDLENBQUEsTUFBRCxDQUFRLEtBQVI7OytCQUNBLGVBQUEsR0FBaUI7OytCQUNqQixTQUFBLEdBQVc7OytCQUVYLFVBQUEsR0FBWSxTQUFBO01BQ1Ysa0RBQUEsU0FBQTthQUNBLElBQUMsQ0FBQSxpQkFBRCxHQUFxQixJQUFJO0lBRmY7OytCQUlaLE9BQUEsR0FBUyxTQUFBO0FBQ1AsWUFBVSxJQUFBLEtBQUEsQ0FBUSxDQUFDLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBRCxDQUFBLEdBQVkseUJBQXBCO0lBREg7OytCQUdULFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFDVixVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsTUFBRCxDQUFRLFFBQVIsQ0FBSDtRQUNFLElBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBQSxDQUFIO1VBQ0UsT0FBZSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWpCLENBQUEsQ0FBZixFQUFDLGtCQUFELEVBQVE7VUFDUixPQUFrQixNQUFNLENBQUMsU0FBUyxDQUFDLFVBQWpCLENBQUEsQ0FBSCxHQUFzQyxDQUFDLEtBQUQsRUFBUSxHQUFSLENBQXRDLEdBQXdELENBQUMsR0FBRCxFQUFNLEtBQU4sQ0FBdkUsRUFBQyxjQUFELEVBQU87aUJBQ1AsSUFBQyxDQUFBLGVBQUQsR0FBdUIsSUFBQSxLQUFBLENBQU0sSUFBSSxDQUFDLEdBQUwsR0FBVyxJQUFJLENBQUMsR0FBdEIsRUFBMkIsSUFBSSxDQUFDLE1BQUwsR0FBYyxJQUFJLENBQUMsTUFBOUMsRUFIekI7U0FBQSxNQUFBO2lCQUtFLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxNQUFNLENBQUMsc0JBQVIsQ0FBQSxDQUFnQyxDQUFDLFNBQWpDLENBQUEsRUFMckI7U0FERjtPQUFBLE1BQUE7UUFRRSxLQUFBLEdBQVEsTUFBTSxDQUFDLGlCQUFQLENBQUE7UUFDUixJQUFHLElBQUMsQ0FBQSxXQUFELENBQUEsQ0FBSDtpQkFDRSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsSUFBQyxDQUFBLGVBQWpCLENBQXpCLEVBREY7U0FBQSxNQUFBO2lCQUdFLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixLQUFLLENBQUMsUUFBTixDQUFlLElBQUMsQ0FBQSxlQUFoQixDQUF6QixFQUhGO1NBVEY7O0lBRFU7OytCQWVaLE1BQUEsR0FBUSxTQUFBO0FBQ04sVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLE1BQUQsQ0FBUSxRQUFSLENBQUg7UUFDRSw4Q0FBQSxTQUFBLEVBREY7T0FBQSxNQUFBO0FBR0U7QUFBQSxhQUFBLHNDQUFBOztnQkFBd0MsU0FBQSxHQUFZLElBQUMsQ0FBQSxpQkFBaUIsQ0FBQyxHQUFuQixDQUF1QixNQUF2Qjs7O1VBQ2pELHlDQUFELEVBQWlCLDZDQUFqQixFQUFtQztVQUNuQyxJQUFHLEtBQUEsSUFBUyxjQUFjLENBQUMsT0FBZixDQUF1QixNQUFNLENBQUMsaUJBQVAsQ0FBQSxDQUF2QixDQUFaO1lBQ0UsTUFBTSxDQUFDLGlCQUFQLENBQXlCLGdCQUF6QixFQURGOztBQUZGO1FBSUEsOENBQUEsU0FBQSxFQVBGOztBQWVBO0FBQUE7V0FBQSx3Q0FBQTs7UUFDRSxnQkFBQSxHQUFtQixNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWpCLENBQUEsQ0FBaUMsQ0FBQztxQkFDckQsSUFBQyxDQUFBLG9CQUFELENBQXNCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7WUFDcEIsY0FBQSxHQUFpQixNQUFNLENBQUMsaUJBQVAsQ0FBQTtZQUNqQixLQUFBLEdBQVEsTUFBTSxDQUFDLGFBQVAsQ0FBQTttQkFDUixLQUFDLENBQUEsaUJBQWlCLENBQUMsR0FBbkIsQ0FBdUIsTUFBdkIsRUFBK0I7Y0FBQyxrQkFBQSxnQkFBRDtjQUFtQixnQkFBQSxjQUFuQjtjQUFtQyxPQUFBLEtBQW5DO2FBQS9CO1VBSG9CO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QjtBQUZGOztJQWhCTTs7OztLQTNCcUI7O0VBa0R6Qjs7Ozs7OztJQUNKLFFBQUMsQ0FBQSxNQUFELENBQUE7O3VCQUNBLFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFDVixVQUFBO01BQUEsU0FBQSxHQUFZLFFBQVEsQ0FBQyxHQUFULENBQWEscUJBQWI7YUFDWixJQUFDLENBQUEsVUFBRCxDQUFZLFNBQUE7ZUFDVixjQUFBLENBQWUsTUFBZixFQUF1QjtVQUFDLFdBQUEsU0FBRDtTQUF2QjtNQURVLENBQVo7SUFGVTs7OztLQUZTOztFQU9qQjs7Ozs7OztJQUNKLFNBQUMsQ0FBQSxNQUFELENBQUE7O3dCQUNBLGlCQUFBLEdBQW1CLFNBQUMsTUFBRDtNQUNqQixJQUFHLElBQUMsQ0FBQSxrQkFBRCxDQUFBLENBQUEsSUFBMEIsQ0FBSSxNQUFNLENBQUMsYUFBUCxDQUFBLENBQWpDO2VBQ0UsTUFERjtPQUFBLE1BQUE7ZUFHRSxRQUFRLENBQUMsR0FBVCxDQUFhLHFCQUFiLEVBSEY7O0lBRGlCOzt3QkFNbkIsVUFBQSxHQUFZLFNBQUMsTUFBRDthQUNWLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQ1YsY0FBQTtVQUFBLEtBQUMsQ0FBQSxNQUFNLENBQUMsZUFBUixDQUF3QixNQUFNLENBQUMsWUFBUCxDQUFBLENBQXhCO1VBQ0EsU0FBQSxHQUFZLEtBQUMsQ0FBQSxpQkFBRCxDQUFtQixNQUFuQjtVQUNaLGVBQUEsQ0FBZ0IsTUFBaEI7VUFDQSxJQUFHLE1BQU0sQ0FBQyxhQUFQLENBQUEsQ0FBQSxJQUEyQixTQUEzQixJQUF5QyxDQUFJLHNCQUFBLENBQXVCLE1BQXZCLENBQWhEO21CQUNFLGVBQUEsQ0FBZ0IsTUFBaEIsRUFBd0I7Y0FBQyxXQUFBLFNBQUQ7YUFBeEIsRUFERjs7UUFKVTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWjtJQURVOzs7O0tBUlU7O0VBZ0JsQjs7Ozs7OztJQUNKLHFCQUFDLENBQUEsTUFBRCxDQUFRLElBQVI7O29DQUNBLFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFDVixVQUFBO01BQUEsUUFBQSxHQUFXLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQTBCLENBQUMsU0FBM0IsQ0FBcUMsQ0FBQyxDQUFELEVBQUksSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFKLENBQXJDO2FBQ1gsTUFBTSxDQUFDLGlCQUFQLENBQXlCLFFBQXpCO0lBRlU7Ozs7S0FGc0I7O0VBTTlCOzs7Ozs7O0lBQ0osTUFBQyxDQUFBLE1BQUQsQ0FBQTs7cUJBQ0EsSUFBQSxHQUFNOztxQkFFTixRQUFBLEdBQVUsU0FBQyxNQUFEO0FBQ1IsVUFBQTtNQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsTUFBRCxDQUFRLE1BQU0sQ0FBQyxZQUFQLENBQUEsQ0FBUjthQUNGLElBQUEsS0FBQSxDQUFNLEdBQU4sRUFBVyxNQUFNLENBQUMsVUFBbEI7SUFGSTs7cUJBSVYsTUFBQSxHQUFRLFNBQUMsR0FBRDtNQUNOLEdBQUEsR0FBTSxJQUFJLENBQUMsR0FBTCxDQUFTLEdBQUEsR0FBTSxDQUFmLEVBQWtCLENBQWxCO01BQ04sSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLG1CQUFSLENBQTRCLEdBQTVCLENBQUg7UUFDRSxHQUFBLEdBQU0sb0NBQUEsQ0FBcUMsSUFBQyxDQUFBLE1BQXRDLEVBQThDLEdBQTlDLENBQWtELENBQUMsS0FBSyxDQUFDLElBRGpFOzthQUVBO0lBSk07O3FCQU1SLFVBQUEsR0FBWSxTQUFDLE1BQUQ7YUFDVixJQUFDLENBQUEsVUFBRCxDQUFZLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUNWLGNBQUE7O1lBQUEsTUFBTSxDQUFDLGFBQWMsTUFBTSxDQUFDLGVBQVAsQ0FBQTs7VUFDcEIsYUFBYztVQUNmLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixLQUFDLENBQUEsUUFBRCxDQUFVLE1BQVYsQ0FBekI7aUJBQ0EsTUFBTSxDQUFDLFVBQVAsR0FBb0I7UUFKVjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWjtJQURVOzs7O0tBZE87O0VBcUJmOzs7Ozs7O0lBQ0osUUFBQyxDQUFBLE1BQUQsQ0FBQTs7dUJBQ0EsSUFBQSxHQUFNOzt1QkFFTixNQUFBLEdBQVEsU0FBQyxHQUFEO01BQ04sSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLG1CQUFSLENBQTRCLEdBQTVCLENBQUg7UUFDRSxHQUFBLEdBQU0sb0NBQUEsQ0FBcUMsSUFBQyxDQUFBLE1BQXRDLEVBQThDLEdBQTlDLENBQWtELENBQUMsR0FBRyxDQUFDLElBRC9EOzthQUVBLElBQUksQ0FBQyxHQUFMLENBQVMsR0FBQSxHQUFNLENBQWYsRUFBa0IsSUFBQyxDQUFBLG1CQUFELENBQUEsQ0FBbEI7SUFITTs7OztLQUphOztFQVNqQjs7Ozs7OztJQUNKLFlBQUMsQ0FBQSxNQUFELENBQUE7OzJCQUNBLElBQUEsR0FBTTs7MkJBQ04sU0FBQSxHQUFXOzsyQkFFWCxVQUFBLEdBQVksU0FBQyxNQUFEO2FBQ1YsSUFBQyxDQUFBLFVBQUQsQ0FBWSxTQUFBO2VBQ1Ysa0JBQUEsQ0FBbUIsTUFBbkI7TUFEVSxDQUFaO0lBRFU7Ozs7S0FMYTs7RUFTckI7Ozs7Ozs7SUFDSixjQUFDLENBQUEsTUFBRCxDQUFBOzs2QkFDQSxJQUFBLEdBQU07OzZCQUNOLFNBQUEsR0FBVzs7NkJBRVgsVUFBQSxHQUFZLFNBQUMsTUFBRDthQUNWLElBQUMsQ0FBQSxVQUFELENBQVksU0FBQTtlQUNWLG9CQUFBLENBQXFCLE1BQXJCO01BRFUsQ0FBWjtJQURVOzs7O0tBTGU7O0VBY3ZCOzs7Ozs7O0lBQ0osWUFBQyxDQUFBLE1BQUQsQ0FBQTs7MkJBQ0EsSUFBQSxHQUFNOzsyQkFDTixJQUFBLEdBQU07OzJCQUNOLFNBQUEsR0FBVzs7SUFDWCxZQUFDLENBQUEsV0FBRCxHQUFjOzsyQkFFZCxVQUFBLEdBQVksU0FBQyxNQUFEO0FBQ1YsVUFBQTtNQUFBLEtBQUEsR0FBUSxNQUFNLENBQUMsaUJBQVAsQ0FBQTtNQUNSLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDVixjQUFBO1VBRFksT0FBRDtVQUNYLElBQUcsQ0FBQyxRQUFBLEdBQVcsS0FBQyxDQUFBLFFBQUQsQ0FBVSxLQUFWLENBQVosQ0FBSDttQkFDRSxLQUFBLEdBQVEsU0FEVjtXQUFBLE1BQUE7bUJBR0UsSUFBQSxDQUFBLEVBSEY7O1FBRFU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVo7YUFLQSxJQUFDLENBQUEsdUJBQUQsQ0FBeUIsTUFBekIsRUFBaUMsS0FBakM7SUFQVTs7MkJBU1osUUFBQSxHQUFVLFNBQUMsU0FBRDtBQUNSLFVBQUE7TUFBQSxNQUFBLEdBQVMsU0FBUyxDQUFDO0FBQ25CO0FBQUEsV0FBQSxzQ0FBQTs7WUFBd0MsS0FBQSxHQUFZLElBQUEsS0FBQSxDQUFNLEdBQU4sRUFBVyxNQUFYO1VBQ2xELElBQWdCLElBQUMsQ0FBQSxNQUFELENBQVEsS0FBUixDQUFoQjtBQUFBLG1CQUFPLE1BQVA7OztBQURGO0lBRlE7OzJCQUtWLFdBQUEsR0FBYSxTQUFDLEdBQUQ7QUFDWCxVQUFBO01BRGEsTUFBRDtNQUNaLFFBQUEsR0FBVyxvQkFBb0IsQ0FBQyxJQUFyQixDQUEwQixJQUExQixFQUFnQyxJQUFDLENBQUEsTUFBakM7QUFDWCxjQUFPLElBQUMsQ0FBQSxTQUFSO0FBQUEsYUFDTyxJQURQO2lCQUNpQjs7Ozs7QUFEakIsYUFFTyxNQUZQO2lCQUVtQjs7Ozs7QUFGbkI7SUFGVzs7MkJBTWIsTUFBQSxHQUFRLFNBQUMsS0FBRDtBQUNOLFVBQUE7TUFBQSxJQUFHLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixLQUFsQixDQUFIO1FBRUUsS0FBQSxHQUFRLEtBQUssQ0FBQyxTQUFOLENBQWdCLENBQUMsQ0FBQyxDQUFGLEVBQUssQ0FBTCxDQUFoQjtRQUNSLEtBQUEsR0FBUSxLQUFLLENBQUMsU0FBTixDQUFnQixDQUFDLENBQUMsQ0FBRixFQUFLLENBQUwsQ0FBaEI7ZUFDUixDQUFDLENBQUksSUFBQyxDQUFBLGdCQUFELENBQWtCLEtBQWxCLENBQUwsQ0FBQSxJQUFrQyxDQUFDLENBQUksSUFBQyxDQUFBLGdCQUFELENBQWtCLEtBQWxCLENBQUwsRUFKcEM7T0FBQSxNQUFBO2VBTUUsTUFORjs7SUFETTs7MkJBU1IsZ0JBQUEsR0FBa0IsU0FBQyxLQUFEO0FBQ2hCLFVBQUE7TUFBQSxJQUFHLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixLQUF0QixDQUFIO2VBQ0UsS0FERjtPQUFBLE1BQUE7UUFHRSxTQUFBLEdBQVksS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQWhCO1FBQ1osVUFBQSxHQUFhLEtBQUssQ0FBQyxTQUFOLENBQWdCLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBTCxDQUFoQjtlQUNiLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixTQUF0QixDQUFBLElBQXFDLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixVQUF0QixFQUx2Qzs7SUFEZ0I7OzJCQVFsQixvQkFBQSxHQUFzQixTQUFDLEtBQUQ7YUFDcEIsNEJBQUEsQ0FBNkIsSUFBQyxDQUFBLE1BQTlCLEVBQXNDLEtBQXRDO0lBRG9COzs7O0tBNUNHOztFQStDckI7Ozs7Ozs7SUFDSixjQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLGNBQUMsQ0FBQSxXQUFELEdBQWM7OzZCQUNkLFNBQUEsR0FBVzs7OztLQUhnQjs7RUFPdkI7Ozs7Ozs7SUFDSixjQUFDLENBQUEsTUFBRCxDQUFBOzs2QkFDQSxTQUFBLEdBQVc7OzZCQUVYLFFBQUEsR0FBVSxTQUFDLE1BQUQ7QUFDUixVQUFBO01BQUEsV0FBQSxHQUFjLE1BQU0sQ0FBQyxpQkFBUCxDQUFBO01BQ2QsT0FBQSw0Q0FBdUIsTUFBTSxDQUFDLFVBQVAsQ0FBQTtNQUN2QixTQUFBLEdBQVksQ0FBQyxXQUFELEVBQWMsSUFBQyxDQUFBLHVCQUFELENBQUEsQ0FBZDtNQUVaLFNBQUEsR0FBWTtNQUNaLEtBQUEsR0FBUTtNQUNSLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBMEIsT0FBMUIsRUFBbUMsU0FBbkMsRUFBOEMsU0FBQyxHQUFEO0FBQzVDLFlBQUE7UUFEOEMsbUJBQU8sMkJBQVc7UUFDaEUsU0FBQSxHQUFZO1FBRVosSUFBVSxTQUFBLEtBQWEsRUFBYixJQUFvQixLQUFLLENBQUMsS0FBSyxDQUFDLE1BQVosS0FBd0IsQ0FBdEQ7QUFBQSxpQkFBQTs7UUFDQSxJQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsYUFBWixDQUEwQixXQUExQixDQUFIO1VBQ0UsS0FBQSxHQUFRO2lCQUNSLElBQUEsQ0FBQSxFQUZGOztNQUo0QyxDQUE5QztNQVFBLElBQUcsS0FBSDtlQUNFLFNBQVMsQ0FBQyxNQURaO09BQUEsTUFBQTtvRkFHbUIsWUFIbkI7O0lBZlE7OzZCQW9CVixVQUFBLEdBQVksU0FBQyxNQUFEO0FBQ1YsVUFBQTtNQUFBLElBQVUsc0JBQUEsQ0FBdUIsTUFBdkIsQ0FBVjtBQUFBLGVBQUE7O01BQ0EsZUFBQSxHQUFrQixvQkFBQSxDQUFxQixNQUFyQjthQUNsQixJQUFDLENBQUEsVUFBRCxDQUFZLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFEO0FBQ1YsY0FBQTtVQURZLFVBQUQ7VUFDWCxTQUFBLEdBQVksTUFBTSxDQUFDLFlBQVAsQ0FBQTtVQUNaLElBQUcsa0JBQUEsQ0FBbUIsTUFBbkIsQ0FBQSxJQUErQixLQUFDLENBQUEsa0JBQUQsQ0FBQSxDQUFsQztZQUNFLEtBQUEsR0FBUSxDQUFDLFNBQUEsR0FBVSxDQUFYLEVBQWMsQ0FBZCxFQURWO1dBQUEsTUFBQTtZQUdFLEtBQUEsR0FBUSxLQUFDLENBQUEsUUFBRCxDQUFVLE1BQVY7WUFDUixJQUFHLE9BQUEsSUFBWSxLQUFDLENBQUEsa0JBQUQsQ0FBQSxDQUFmO2NBQ0UsSUFBRyxLQUFDLENBQUEsV0FBRCxDQUFBLENBQWMsQ0FBQyxPQUFmLENBQUEsQ0FBQSxLQUE0QixRQUE1QixJQUF5QyxDQUFDLENBQUksZUFBTCxDQUE1QztnQkFDRSxLQUFBLEdBQVEsTUFBTSxDQUFDLGlDQUFQLENBQXlDO2tCQUFFLFdBQUQsS0FBQyxDQUFBLFNBQUY7aUJBQXpDLEVBRFY7ZUFBQSxNQUVLLElBQUksS0FBSyxDQUFDLEdBQU4sR0FBWSxTQUFoQjtnQkFDSCxLQUFBLEdBQVEsQ0FBQyxTQUFELEVBQVksS0FBWixFQURMO2VBSFA7YUFKRjs7aUJBU0EsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQXpCO1FBWFU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVo7SUFIVTs7OztLQXhCZTs7RUF5Q3ZCOzs7Ozs7O0lBQ0osa0JBQUMsQ0FBQSxNQUFELENBQUE7O2lDQUNBLFNBQUEsR0FBVzs7aUNBRVgsVUFBQSxHQUFZLFNBQUMsTUFBRDthQUNWLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQ1YsY0FBQTtVQUFBLEtBQUEsR0FBUSxNQUFNLENBQUMsdUNBQVAsQ0FBK0M7WUFBRSxXQUFELEtBQUMsQ0FBQSxTQUFGO1dBQS9DO2lCQUNSLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixLQUF6QjtRQUZVO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFaO0lBRFU7Ozs7S0FKbUI7O0VBUzNCOzs7Ozs7O0lBQ0osZUFBQyxDQUFBLE1BQUQsQ0FBQTs7OEJBQ0EsU0FBQSxHQUFXOzs4QkFDWCxTQUFBLEdBQVc7OzhCQUVYLG1CQUFBLEdBQXFCLFNBQUMsTUFBRDtBQUNuQixVQUFBO01BQUEsNkJBQUEsQ0FBOEIsTUFBOUI7TUFDQSxLQUFBLEdBQVEsTUFBTSxDQUFDLGlDQUFQLENBQXlDO1FBQUUsV0FBRCxJQUFDLENBQUEsU0FBRjtPQUF6QyxDQUFzRCxDQUFDLFNBQXZELENBQWlFLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBTCxDQUFqRTtNQUNSLEtBQUEsR0FBUSxLQUFLLENBQUMsR0FBTixDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLHVCQUFELENBQUEsQ0FBakI7YUFDUixNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBekI7SUFKbUI7OzhCQU1yQixVQUFBLEdBQVksU0FBQyxNQUFEO2FBQ1YsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDVixjQUFBO1VBQUEsYUFBQSxHQUFnQixNQUFNLENBQUMsaUJBQVAsQ0FBQTtVQUNoQixLQUFDLENBQUEsbUJBQUQsQ0FBcUIsTUFBckI7VUFDQSxJQUFHLGFBQWEsQ0FBQyxPQUFkLENBQXNCLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQXRCLENBQUg7WUFFRSxNQUFNLENBQUMsU0FBUCxDQUFBO21CQUNBLEtBQUMsQ0FBQSxtQkFBRCxDQUFxQixNQUFyQixFQUhGOztRQUhVO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFaO0lBRFU7Ozs7S0FYZ0I7O0VBcUJ4Qjs7Ozs7OztJQUNKLHVCQUFDLENBQUEsTUFBRCxDQUFBOztzQ0FDQSxTQUFBLEdBQVc7O3NDQUVYLFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFDVixVQUFBO01BQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxRQUFELENBQUE7TUFDUixTQUFBLEdBQVksTUFBTSxDQUFDLHlCQUFQLENBQUE7TUFDWixjQUFBLEdBQWlCLE1BQU0sQ0FBQyxpQkFBUCxDQUFBO01BR2pCLElBQUcsY0FBYyxDQUFDLGFBQWYsQ0FBNkIsU0FBUyxDQUFDLEtBQXZDLENBQUEsSUFBa0QsY0FBYyxDQUFDLFVBQWYsQ0FBMEIsU0FBUyxDQUFDLEdBQXBDLENBQXJEO1FBQ0UsS0FBQSxJQUFTLEVBRFg7O0FBR0EsV0FBSSw2RUFBSjtRQUNFLEtBQUEsR0FBUSxNQUFNLENBQUMsdUNBQVAsQ0FBK0M7VUFBRSxXQUFELElBQUMsQ0FBQSxTQUFGO1NBQS9DO1FBQ1IsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQXpCO0FBRkY7TUFJQSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsTUFBckI7TUFDQSxJQUFHLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQTBCLENBQUMsb0JBQTNCLENBQWdELGNBQWhELENBQUg7ZUFDRSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUF6QixFQURGOztJQWRVOztzQ0FpQlosbUJBQUEsR0FBcUIsU0FBQyxNQUFEO0FBQ25CLFVBQUE7TUFBQSxLQUFBLEdBQVEsTUFBTSxDQUFDLGlDQUFQLENBQXlDO1FBQUUsV0FBRCxJQUFDLENBQUEsU0FBRjtPQUF6QyxDQUFzRCxDQUFDLFNBQXZELENBQWlFLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBTCxDQUFqRTtNQUNSLEtBQUEsR0FBUSxLQUFLLENBQUMsR0FBTixDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLHVCQUFELENBQUEsQ0FBakI7YUFDUixNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBekI7SUFIbUI7Ozs7S0FyQmU7O0VBNEJoQzs7Ozs7OztJQUNKLG1CQUFDLENBQUEsTUFBRCxDQUFBOztrQ0FDQSxTQUFBLEdBQVc7Ozs7S0FGcUI7O0VBSTVCOzs7Ozs7O0lBQ0osdUJBQUMsQ0FBQSxNQUFELENBQUE7O3NDQUNBLFNBQUEsR0FBVzs7OztLQUZ5Qjs7RUFJaEM7Ozs7Ozs7SUFDSixvQkFBQyxDQUFBLE1BQUQsQ0FBQTs7bUNBQ0EsU0FBQSxHQUFXOzs7O0tBRnNCOztFQUs3Qjs7Ozs7OztJQUNKLDRCQUFDLENBQUEsTUFBRCxDQUFBOzsyQ0FDQSxTQUFBLEdBQVc7Ozs7S0FGOEI7O0VBTXJDOzs7Ozs7O0lBQ0osMEJBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0EsMEJBQUMsQ0FBQSxXQUFELEdBQWM7O3lDQUNkLFNBQUEsR0FBVzs7OztLQUg0Qjs7RUFLbkM7Ozs7Ozs7SUFDSiw4QkFBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSw4QkFBQyxDQUFBLFdBQUQsR0FBYzs7NkNBQ2QsU0FBQSxHQUFXOzs7O0tBSGdDOztFQUt2Qzs7Ozs7OztJQUNKLDJCQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLDJCQUFDLENBQUEsV0FBRCxHQUFjOzswQ0FDZCxTQUFBLEdBQVc7Ozs7S0FINkI7O0VBT3BDOzs7Ozs7O0lBQ0osbUJBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0EsbUJBQUMsQ0FBQSxXQUFELEdBQWM7O2tDQUNkLFNBQUEsR0FBVzs7OztLQUhxQjs7RUFLNUI7Ozs7Ozs7SUFDSix1QkFBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSx1QkFBQyxDQUFBLFdBQUQsR0FBYzs7c0NBQ2QsU0FBQSxHQUFXOzs7O0tBSHlCOztFQUtoQzs7Ozs7OztJQUNKLG9CQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLG9CQUFDLENBQUEsV0FBRCxHQUFjOzttQ0FDZCxTQUFBLEdBQVc7Ozs7S0FIc0I7O0VBYTdCOzs7Ozs7O0lBQ0osa0JBQUMsQ0FBQSxNQUFELENBQUE7O2lDQUNBLElBQUEsR0FBTTs7aUNBQ04sYUFBQSxHQUFlOztpQ0FDZixTQUFBLEdBQVc7O2lDQUVYLFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFDVixVQUFBO01BQUEsS0FBQSxHQUFRLE1BQU0sQ0FBQyxpQkFBUCxDQUFBO01BQ1IsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ1YsS0FBQSxHQUFRLEtBQUMsQ0FBQSxRQUFELENBQVUsS0FBVjtRQURFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFaO2FBRUEsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQXpCO0lBSlU7O2lDQU1aLFFBQUEsR0FBVSxTQUFDLFNBQUQ7TUFDUixJQUFHLElBQUMsQ0FBQSxTQUFELEtBQWMsTUFBakI7ZUFDRSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsU0FBeEIsRUFERjtPQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsU0FBRCxLQUFjLFVBQWpCO2VBQ0gsSUFBQyxDQUFBLDBCQUFELENBQTRCLFNBQTVCLEVBREc7O0lBSEc7O2lDQU1WLCtCQUFBLEdBQWlDLFNBQUMsR0FBRDthQUMzQixJQUFBLEtBQUEsQ0FBTSxHQUFOLEVBQVcsa0NBQUEsQ0FBbUMsSUFBQyxDQUFBLE1BQXBDLEVBQTRDLEdBQTVDLENBQVg7SUFEMkI7O2lDQUdqQyxVQUFBLEdBQVksU0FBQyxHQUFEO2FBQ1YsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUF5QixHQUF6QjtJQURVOztpQ0FHWixzQkFBQSxHQUF3QixTQUFDLFNBQUQ7QUFDdEIsVUFBQTtNQUFBLFNBQUEsR0FBZ0IsSUFBQSxLQUFBLENBQU0sU0FBTixFQUFpQixJQUFDLENBQUEsdUJBQUQsQ0FBQSxDQUFqQjtNQUNoQixVQUFBLEdBQWE7TUFDYixJQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQTBCLElBQUMsQ0FBQSxhQUEzQixFQUEwQyxTQUExQyxFQUFxRCxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtBQUNuRCxjQUFBO1VBRHFELG1CQUFPLDJCQUFXLG1CQUFPO1VBQzlFLElBQUcsZ0JBQUg7MEJBQ0csT0FBYSxnQkFBTCxJQUFULGdCQUF5QixLQUFXLGNBQUw7WUFDL0IsSUFBVSxLQUFDLENBQUEsWUFBRCxJQUFrQixLQUFDLENBQUEsVUFBRCxDQUFZLE1BQVosQ0FBNUI7QUFBQSxxQkFBQTs7WUFDQSxJQUFHLEtBQUMsQ0FBQSxVQUFELENBQVksUUFBWixDQUFBLEtBQTJCLEtBQUMsQ0FBQSxVQUFELENBQVksTUFBWixDQUE5QjtjQUNFLFVBQUEsR0FBYSxLQUFDLENBQUEsK0JBQUQsQ0FBaUMsTUFBakMsRUFEZjthQUhGO1dBQUEsTUFBQTtZQU1FLFVBQUEsR0FBYSxLQUFLLENBQUMsSUFOckI7O1VBT0EsSUFBVSxrQkFBVjttQkFBQSxJQUFBLENBQUEsRUFBQTs7UUFSbUQ7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJEO2tDQVNBLGFBQWEsU0FBUyxDQUFDO0lBWkQ7O2lDQWN4QiwwQkFBQSxHQUE0QixTQUFDLFNBQUQ7QUFDMUIsVUFBQTtNQUFBLFNBQUEsR0FBZ0IsSUFBQSxLQUFBLENBQU0sU0FBTixFQUFpQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQWpCO01BQ2hCLFVBQUEsR0FBYTtNQUNiLElBQUMsQ0FBQSxNQUFNLENBQUMsMEJBQVIsQ0FBbUMsSUFBQyxDQUFBLGFBQXBDLEVBQW1ELFNBQW5ELEVBQThELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFEO0FBQzVELGNBQUE7VUFEOEQsbUJBQU8sbUJBQU8saUJBQU07VUFDbEYsSUFBRyxnQkFBSDswQkFDRyxPQUFhLGdCQUFMLElBQVQsZ0JBQXlCLEtBQVcsY0FBTDtZQUMvQixJQUFHLENBQUksS0FBQyxDQUFBLFVBQUQsQ0FBWSxNQUFaLENBQUosSUFBNEIsS0FBQyxDQUFBLFVBQUQsQ0FBWSxRQUFaLENBQS9CO2NBQ0UsS0FBQSxHQUFRLEtBQUMsQ0FBQSwrQkFBRCxDQUFpQyxNQUFqQztjQUNSLElBQUcsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsU0FBakIsQ0FBSDtnQkFDRSxVQUFBLEdBQWEsTUFEZjtlQUFBLE1BQUE7Z0JBR0UsSUFBVSxLQUFDLENBQUEsWUFBWDtBQUFBLHlCQUFBOztnQkFDQSxVQUFBLEdBQWEsS0FBQyxDQUFBLCtCQUFELENBQWlDLFFBQWpDLEVBSmY7ZUFGRjthQUZGO1dBQUEsTUFBQTtZQVVFLElBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFWLENBQXFCLFNBQXJCLENBQUg7Y0FDRSxVQUFBLEdBQWEsS0FBSyxDQUFDLElBRHJCO2FBVkY7O1VBWUEsSUFBVSxrQkFBVjttQkFBQSxJQUFBLENBQUEsRUFBQTs7UUFiNEQ7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlEO2tDQWNBLGFBQWEsU0FBUyxDQUFDO0lBakJHOzs7O0tBdENHOztFQXlEM0I7Ozs7Ozs7SUFDSixzQkFBQyxDQUFBLE1BQUQsQ0FBQTs7cUNBQ0EsU0FBQSxHQUFXOzs7O0tBRndCOztFQUkvQjs7Ozs7OztJQUNKLDhCQUFDLENBQUEsTUFBRCxDQUFBOzs2Q0FDQSxZQUFBLEdBQWM7Ozs7S0FGNkI7O0VBSXZDOzs7Ozs7O0lBQ0osa0NBQUMsQ0FBQSxNQUFELENBQUE7O2lEQUNBLFlBQUEsR0FBYzs7OztLQUZpQzs7RUFNM0M7Ozs7Ozs7SUFDSixtQkFBQyxDQUFBLE1BQUQsQ0FBQTs7a0NBQ0EsSUFBQSxHQUFNOztrQ0FDTixTQUFBLEdBQVc7O2tDQUVYLFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFDVixVQUFBO01BQUEsS0FBQSxHQUFRLE1BQU0sQ0FBQyxpQkFBUCxDQUFBO01BQ1IsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ1YsS0FBQSxHQUFRLEtBQUMsQ0FBQSxRQUFELENBQVUsS0FBVjtRQURFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFaO2FBRUEsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQXpCO0lBSlU7O2tDQU1aLFFBQUEsR0FBVSxTQUFDLFNBQUQ7QUFDUixVQUFBO01BQUEsUUFBQSxHQUFXLFNBQVMsQ0FBQztNQUNyQixnQkFBQSxHQUFtQixDQUFJLElBQUMsQ0FBQSxNQUFNLENBQUMsZ0JBQVIsQ0FBeUIsUUFBekI7QUFDdkI7Ozs7QUFBQSxXQUFBLHNDQUFBOztRQUNFLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUF5QixHQUF6QixDQUFIO1VBQ0UsSUFBNEIsZ0JBQTVCO0FBQUEsbUJBQVcsSUFBQSxLQUFBLENBQU0sR0FBTixFQUFXLENBQVgsRUFBWDtXQURGO1NBQUEsTUFBQTtVQUdFLGdCQUFBLEdBQW1CLEtBSHJCOztBQURGO0FBT0EsY0FBTyxJQUFDLENBQUEsU0FBUjtBQUFBLGFBQ08sVUFEUDtpQkFDMkIsSUFBQSxLQUFBLENBQU0sQ0FBTixFQUFTLENBQVQ7QUFEM0IsYUFFTyxNQUZQO2lCQUVtQixJQUFDLENBQUEsdUJBQUQsQ0FBQTtBQUZuQjtJQVZROzs7O0tBWHNCOztFQXlCNUI7Ozs7Ozs7SUFDSix1QkFBQyxDQUFBLE1BQUQsQ0FBQTs7c0NBQ0EsU0FBQSxHQUFXOzs7O0tBRnlCOztFQUtoQzs7Ozs7OztJQUNKLHFCQUFDLENBQUEsTUFBRCxDQUFBOztvQ0FFQSxRQUFBLEdBQVUsU0FBQyxHQUFEO0FBQ1IsVUFBQTtNQURVLE1BQUQ7YUFDTCxJQUFBLEtBQUEsQ0FBTSxHQUFOLEVBQVcsQ0FBWDtJQURJOztvQ0FHVixVQUFBLEdBQVksU0FBQyxNQUFEO0FBQ1YsVUFBQTtNQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsUUFBRCxDQUFVLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQVY7YUFDUixNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBekI7SUFGVTs7OztLQU5zQjs7RUFVOUI7Ozs7Ozs7SUFDSixZQUFDLENBQUEsTUFBRCxDQUFBOzsyQkFDQSxRQUFBLEdBQVUsU0FBQTthQUNSLDRDQUFBLFNBQUEsQ0FBQSxHQUFRO0lBREE7OzJCQUdWLFFBQUEsR0FBVSxTQUFDLEdBQUQ7QUFDUixVQUFBO01BRFUsTUFBRDthQUNMLElBQUEsS0FBQSxDQUFNLEdBQU4sRUFBVyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVg7SUFESTs7MkJBR1YsVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUNWLFVBQUE7TUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFNLENBQUMsaUJBQVAsQ0FBQSxDQUFWO2FBQ1IsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQXpCO0lBRlU7Ozs7S0FSYTs7RUFZckI7Ozs7Ozs7SUFDSix5QkFBQyxDQUFBLE1BQUQsQ0FBQTs7d0NBRUEsUUFBQSxHQUFVLFNBQUE7YUFDUix5REFBQSxTQUFBLENBQUEsR0FBUTtJQURBOzt3Q0FHVixRQUFBLEdBQVUsU0FBQyxHQUFEO0FBQ1IsVUFBQTtNQURVLE1BQUQ7TUFDVCxHQUFBLEdBQU0sb0JBQUEsQ0FBcUIsSUFBQyxDQUFBLE1BQXRCLEVBQThCLEdBQUEsR0FBTSxJQUFDLENBQUEsUUFBRCxDQUFBLENBQXBDO2FBQ0YsSUFBQSxLQUFBLENBQU0sR0FBTixFQUFXLEtBQVg7SUFGSTs7d0NBSVYsVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUNWLFVBQUE7TUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFNLENBQUMsaUJBQVAsQ0FBQSxDQUFWO01BQ1IsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQXpCO2FBQ0EsTUFBTSxDQUFDLFVBQVAsR0FBb0I7SUFIVjs7OztLQVYwQjs7RUFlbEM7Ozs7Ozs7SUFDSix3Q0FBQyxDQUFBLE1BQUQsQ0FBQTs7dURBQ0EsU0FBQSxHQUFXOzt1REFFWCxRQUFBLEdBQVUsU0FBQTthQUNSLHdFQUFBLFNBQUEsQ0FBQSxHQUFRO0lBREE7O3VEQUdWLFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFDVixVQUFBO01BQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxRQUFELENBQVUsTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBVjthQUNSLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixLQUF6QjtJQUZVOzt1REFJWixRQUFBLEdBQVUsU0FBQyxHQUFEO0FBQ1IsVUFBQTtNQURVLE1BQUQ7TUFDVCxHQUFBLEdBQU0sSUFBSSxDQUFDLEdBQUwsQ0FBUyxHQUFBLEdBQU0sSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFmLEVBQTRCLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBQTVCO01BQ04sSUFBQSxHQUFXLElBQUEsS0FBQSxDQUFNLEdBQU4sRUFBVyxLQUFYO01BQ1gsS0FBQSxHQUFRLDBCQUFBLENBQTJCLElBQUMsQ0FBQSxNQUE1QixFQUFvQyxJQUFwQyxFQUEwQyxNQUExQzthQUNSLGlCQUFDLFFBQVEsSUFBVCxDQUFjLENBQUMsU0FBZixDQUF5QixDQUFDLENBQUQsRUFBSSxDQUFDLENBQUwsQ0FBekI7SUFKUTs7OztLQVgyQzs7RUFtQmpEOzs7Ozs7O0lBQ0osMEJBQUMsQ0FBQSxNQUFELENBQUE7O3lDQUNBLFVBQUEsR0FBWSxTQUFDLE1BQUQ7YUFDVixJQUFDLENBQUEsdUJBQUQsQ0FBeUIsTUFBekIsRUFBaUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFWLENBQWpDO0lBRFU7O3lDQUdaLFFBQUEsR0FBVSxTQUFDLE1BQUQ7YUFDUixxQ0FBQSxDQUFzQyxJQUFDLENBQUEsTUFBdkMsRUFBK0MsTUFBTSxDQUFDLFlBQVAsQ0FBQSxDQUEvQztJQURROzs7O0tBTDZCOztFQVFuQzs7Ozs7OztJQUNKLDRCQUFDLENBQUEsTUFBRCxDQUFBOzsyQ0FDQSxJQUFBLEdBQU07OzJDQUNOLFVBQUEsR0FBWSxTQUFDLE1BQUQ7TUFDVixJQUFDLENBQUEsVUFBRCxDQUFZLFNBQUE7ZUFDVixrQkFBQSxDQUFtQixNQUFuQjtNQURVLENBQVo7YUFFQSw4REFBQSxTQUFBO0lBSFU7Ozs7S0FINkI7O0VBUXJDOzs7Ozs7O0lBQ0osOEJBQUMsQ0FBQSxNQUFELENBQUE7OzZDQUNBLElBQUEsR0FBTTs7NkNBQ04sVUFBQSxHQUFZLFNBQUMsTUFBRDtNQUNWLElBQUMsQ0FBQSxVQUFELENBQVksU0FBQTtlQUNWLG9CQUFBLENBQXFCLE1BQXJCO01BRFUsQ0FBWjthQUVBLGdFQUFBLFNBQUE7SUFIVTs7OztLQUgrQjs7RUFRdkM7Ozs7Ozs7SUFDSixpQ0FBQyxDQUFBLE1BQUQsQ0FBQTs7Z0RBQ0EsWUFBQSxHQUFjOztnREFDZCxRQUFBLEdBQVUsU0FBQTthQUFHLGlFQUFBLFNBQUEsQ0FBQSxHQUFRO0lBQVg7Ozs7S0FIb0M7O0VBSzFDOzs7Ozs7O0lBQ0osZUFBQyxDQUFBLE1BQUQsQ0FBQTs7OEJBQ0EsSUFBQSxHQUFNOzs4QkFDTixJQUFBLEdBQU07OzhCQUVOLFVBQUEsR0FBWSxTQUFDLE1BQUQ7TUFDVixNQUFNLENBQUMsaUJBQVAsQ0FBeUIsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUF6QjthQUNBLE1BQU0sQ0FBQyxVQUFQLENBQWtCO1FBQUEsTUFBQSxFQUFRLElBQVI7T0FBbEI7SUFGVTs7OEJBSVosUUFBQSxHQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsR0FBQSxHQUFNLG9CQUFBLENBQXFCLElBQUMsQ0FBQSxNQUF0QixFQUE4QixJQUFDLENBQUEsTUFBRCxDQUFBLENBQTlCO2FBQ04scUNBQUEsQ0FBc0MsSUFBQyxDQUFBLE1BQXZDLEVBQStDLEdBQS9DO0lBRlE7OzhCQUlWLE1BQUEsR0FBUSxTQUFBO2FBQ04sSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFBLEdBQWM7SUFEUjs7OztLQWJvQjs7RUFpQnhCOzs7Ozs7O0lBQ0osY0FBQyxDQUFBLE1BQUQsQ0FBQTs7NkJBQ0EsWUFBQSxHQUFjOzs7O0tBRmE7O0VBS3ZCOzs7Ozs7O0lBQ0osbUJBQUMsQ0FBQSxNQUFELENBQUE7O2tDQUVBLE1BQUEsR0FBUSxTQUFBO0FBQ04sVUFBQTtNQUFBLE9BQUEsR0FBVSxJQUFJLENBQUMsR0FBTCxDQUFTLEdBQVQsRUFBYyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQWQ7YUFDVixJQUFJLENBQUMsS0FBTCxDQUFXLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBQUEsR0FBeUIsQ0FBQyxPQUFBLEdBQVUsR0FBWCxDQUFwQztJQUZNOzs7O0tBSHdCOztFQU81Qjs7Ozs7OztJQUNKLGtCQUFDLENBQUEsTUFBRCxDQUFRLEtBQVI7O2lDQUNBLElBQUEsR0FBTTs7aUNBRU4sVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUNWLFVBQUE7TUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFNLENBQUMsaUJBQVAsQ0FBQSxDQUFWO2FBQ1IsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQXpCO0lBRlU7O2lDQUlaLFFBQUEsR0FBVSxTQUFBO2FBQ1Isa0RBQUEsU0FBQSxDQUFBLEdBQVE7SUFEQTs7aUNBR1YsUUFBQSxHQUFVLFNBQUMsR0FBRDtBQUNSLFVBQUE7TUFEVSxNQUFEO2FBQ1QsQ0FBQyxHQUFBLEdBQU0sSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFQLEVBQW9CLENBQXBCO0lBRFE7Ozs7S0FYcUI7O0VBYzNCOzs7Ozs7O0lBQ0osNkJBQUMsQ0FBQSxNQUFELENBQVEsS0FBUjs7NENBQ0EsR0FBQSxHQUFLOzs0Q0FFTCxRQUFBLEdBQVUsU0FBQTthQUNSLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLEdBQVYsRUFBZSw2REFBQSxTQUFBLENBQWY7SUFEUTs7OztLQUpnQzs7RUFVdEM7Ozs7Ozs7SUFDSixpQkFBQyxDQUFBLE1BQUQsQ0FBQTs7Z0NBQ0EsSUFBQSxHQUFNOztnQ0FDTixJQUFBLEdBQU07O2dDQUNOLFNBQUEsR0FBVzs7Z0NBQ1gsWUFBQSxHQUFjOztnQ0FFZCxRQUFBLEdBQVUsU0FBQTthQUNSLGlEQUFBLFNBQUEsQ0FBQSxHQUFRO0lBREE7O2dDQUdWLFVBQUEsR0FBWSxTQUFDLE1BQUQ7YUFDVixNQUFNLENBQUMsaUJBQVAsQ0FBeUIsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUF6QjtJQURVOztnQ0FHWixRQUFBLEdBQVUsU0FBQTthQUNSLDJDQUFBLENBQTRDLElBQUMsQ0FBQSxNQUE3QyxFQUFxRCxJQUFDLENBQUEsTUFBRCxDQUFBLENBQXJEO0lBRFE7O2dDQUdWLFlBQUEsR0FBYyxTQUFBO01BQ1osSUFBRyxJQUFDLENBQUEsa0JBQUQsQ0FBQSxDQUFIO2VBQ0UsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsVUFISDs7SUFEWTs7Z0NBTWQsTUFBQSxHQUFRLFNBQUE7QUFDTixVQUFBO01BQUEsR0FBQSxHQUFNLHdCQUFBLENBQXlCLElBQUMsQ0FBQSxNQUExQjtNQUNOLE1BQUEsR0FBUyxJQUFDLENBQUEsWUFBRCxDQUFBO01BQ1QsSUFBZSxHQUFBLEtBQU8sQ0FBdEI7UUFBQSxNQUFBLEdBQVMsRUFBVDs7TUFDQSxNQUFBLEdBQVMsSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVQsRUFBc0IsTUFBdEI7YUFDVCxHQUFBLEdBQU07SUFMQTs7OztLQXRCc0I7O0VBOEIxQjs7Ozs7OztJQUNKLG9CQUFDLENBQUEsTUFBRCxDQUFBOzttQ0FDQSxNQUFBLEdBQVEsU0FBQTtBQUNOLFVBQUE7TUFBQSxRQUFBLEdBQVcsd0JBQUEsQ0FBeUIsSUFBQyxDQUFBLE1BQTFCO01BQ1gsZ0JBQUEsR0FBbUIsSUFBQyxDQUFBLG1CQUFELENBQUE7TUFDbkIsTUFBQSxHQUFTLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFBLENBQVQsRUFBNEMsZ0JBQTVDO2FBQ1QsUUFBQSxHQUFXLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBQyxNQUFBLEdBQVMsUUFBVixDQUFBLEdBQXNCLENBQWpDO0lBSkw7Ozs7S0FGeUI7O0VBUzdCOzs7Ozs7O0lBQ0osb0JBQUMsQ0FBQSxNQUFELENBQUE7O21DQUNBLE1BQUEsR0FBUSxTQUFBO0FBTU4sVUFBQTtNQUFBLGdCQUFBLEdBQW1CLElBQUMsQ0FBQSxtQkFBRCxDQUFBO01BQ25CLEdBQUEsR0FBTSxJQUFJLENBQUMsR0FBTCxDQUFTLElBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBQSxDQUFULEVBQTRDLGdCQUE1QztNQUNOLE1BQUEsR0FBUyxJQUFDLENBQUEsWUFBRCxDQUFBLENBQUEsR0FBa0I7TUFDM0IsSUFBYyxHQUFBLEtBQU8sZ0JBQXJCO1FBQUEsTUFBQSxHQUFTLEVBQVQ7O01BQ0EsTUFBQSxHQUFTLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFULEVBQXNCLE1BQXRCO2FBQ1QsR0FBQSxHQUFNO0lBWEE7Ozs7S0FGeUI7O0VBb0I3Qjs7Ozs7OztJQUNKLG9CQUFDLENBQUEsTUFBRCxDQUFBOzttQ0FDQSxZQUFBLEdBQWMsQ0FBQzs7bUNBRWYscUJBQUEsR0FBdUIsU0FBQTtNQUNyQixJQUFHLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLFlBQVYsQ0FBQSxLQUEyQixDQUE5QjtlQUNFLFFBQVEsQ0FBQyxHQUFULENBQWEsZ0NBQWIsRUFERjtPQUFBLE1BQUE7ZUFHRSxRQUFRLENBQUMsR0FBVCxDQUFhLGdDQUFiLEVBSEY7O0lBRHFCOzttQ0FNdkIsc0JBQUEsR0FBd0IsU0FBQTtNQUN0QixJQUFHLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLFlBQVYsQ0FBQSxLQUEyQixDQUE5QjtlQUNFLFFBQVEsQ0FBQyxHQUFULENBQWEsd0NBQWIsRUFERjtPQUFBLE1BQUE7ZUFHRSxRQUFRLENBQUMsR0FBVCxDQUFhLHdDQUFiLEVBSEY7O0lBRHNCOzttQ0FNeEIsMEJBQUEsR0FBNEIsU0FBQyxHQUFEO0FBQzFCLFVBQUE7TUFBQSxLQUFBLEdBQVksSUFBQSxLQUFBLENBQU0sR0FBTixFQUFXLENBQVg7YUFDWixJQUFDLENBQUEsTUFBTSxDQUFDLE9BQU8sQ0FBQyx1QkFBaEIsQ0FBNEMsSUFBQSxLQUFBLENBQU0sS0FBTixFQUFhLEtBQWIsQ0FBNUMsQ0FBZ0UsQ0FBQztJQUZ2Qzs7bUNBSTVCLFlBQUEsR0FBYyxTQUFDLE9BQUQsRUFBVSxLQUFWLEVBQWlCLE9BQWpCO0FBQ1osVUFBQTs7UUFENkIsVUFBUTs7TUFDckMsWUFBQSxHQUFlO1FBQUMsR0FBQSxFQUFLLElBQUMsQ0FBQSwwQkFBRCxDQUE0QixPQUE1QixDQUFOOztNQUNmLFVBQUEsR0FBYTtRQUFDLEdBQUEsRUFBSyxJQUFDLENBQUEsMEJBQUQsQ0FBNEIsS0FBNUIsQ0FBTjs7TUFDYixPQUFPLENBQUMsSUFBUixHQUFlLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxNQUFEO2lCQUFZLEtBQUMsQ0FBQSxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQWhCLENBQTZCLE1BQTdCO1FBQVo7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO01BQ2YsT0FBTyxDQUFDLFFBQVIsR0FBbUIsSUFBQyxDQUFBLHNCQUFELENBQUE7YUFDbkIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxzQkFBVixDQUFpQyxZQUFqQyxFQUErQyxVQUEvQyxFQUEyRCxPQUEzRDtJQUxZOzttQ0FPZCxlQUFBLEdBQWlCLFNBQUE7YUFDZixJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUFBLENBQWhCLEdBQTJDLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBckQ7SUFEZTs7bUNBR2pCLFFBQUEsR0FBVSxTQUFDLE1BQUQ7QUFDUixVQUFBO01BQUEsR0FBQSxHQUFNLG9CQUFBLENBQXFCLElBQUMsQ0FBQSxNQUF0QixFQUE4QixNQUFNLENBQUMsWUFBUCxDQUFBLENBQUEsR0FBd0IsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQUF0RDthQUNOLDJDQUFBLENBQTRDLElBQUMsQ0FBQSxNQUE3QyxFQUFxRCxHQUFyRDtJQUZROzttQ0FJVixVQUFBLEdBQVksU0FBQyxNQUFEO0FBQ1YsVUFBQTtNQUFBLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixJQUFDLENBQUEsUUFBRCxDQUFVLE1BQVYsQ0FBekIsRUFBNEM7UUFBQSxVQUFBLEVBQVksS0FBWjtPQUE1QztNQUVBLElBQUcsTUFBTSxDQUFDLFlBQVAsQ0FBQSxDQUFIO1FBQ0UsSUFBRyxJQUFDLENBQUEscUJBQUQsQ0FBQSxDQUFIO1VBQ0UsSUFBQyxDQUFBLFFBQVEsQ0FBQyxxQkFBVixDQUFBLEVBREY7O1FBR0EsYUFBQSxHQUFnQixJQUFDLENBQUEsTUFBTSxDQUFDLHdCQUFSLENBQUE7UUFDaEIsV0FBQSxHQUFjLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLGVBQUQsQ0FBQTtRQUM5QixJQUFBLEdBQU8sQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsTUFBTSxDQUFDLHdCQUFSLENBQWlDLFdBQWpDO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1FBRVAsSUFBRyxJQUFDLENBQUEscUJBQUQsQ0FBQSxDQUFIO2lCQUNFLElBQUMsQ0FBQSxZQUFELENBQWMsYUFBZCxFQUE2QixXQUE3QixFQUEwQztZQUFDLE1BQUEsSUFBRDtXQUExQyxFQURGO1NBQUEsTUFBQTtpQkFHRSxJQUFBLENBQUEsRUFIRjtTQVJGOztJQUhVOzs7O0tBbENxQjs7RUFtRDdCOzs7Ozs7O0lBQ0osa0JBQUMsQ0FBQSxNQUFELENBQUE7O2lDQUNBLFlBQUEsR0FBYyxDQUFDOzs7O0tBRmdCOztFQUszQjs7Ozs7OztJQUNKLG9CQUFDLENBQUEsTUFBRCxDQUFBOzttQ0FDQSxZQUFBLEdBQWMsQ0FBQyxDQUFELEdBQUs7Ozs7S0FGYzs7RUFLN0I7Ozs7Ozs7SUFDSixrQkFBQyxDQUFBLE1BQUQsQ0FBQTs7aUNBQ0EsWUFBQSxHQUFjLENBQUMsQ0FBRCxHQUFLOzs7O0tBRlk7O0VBTzNCOzs7Ozs7O0lBQ0osSUFBQyxDQUFBLE1BQUQsQ0FBQTs7bUJBQ0EsU0FBQSxHQUFXOzttQkFDWCxTQUFBLEdBQVc7O21CQUNYLEtBQUEsR0FBTztNQUFBLElBQUEsRUFBTSxRQUFOO01BQWdCLEtBQUEsRUFBTyxhQUF2Qjs7O21CQUNQLE1BQUEsR0FBUTs7bUJBQ1IsWUFBQSxHQUFjOzttQkFFZCxVQUFBLEdBQVksU0FBQTtNQUNWLHNDQUFBLFNBQUE7TUFDQSxJQUFBLENBQXFCLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBckI7ZUFBQSxJQUFDLENBQUEsVUFBRCxDQUFBLEVBQUE7O0lBRlU7O21CQUlaLFdBQUEsR0FBYSxTQUFBO2FBQ1gsSUFBQyxDQUFBO0lBRFU7O21CQUdiLFFBQUEsR0FBVSxTQUFDLFNBQUQ7QUFDUixVQUFBO01BQUEsT0FBZSxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQWdDLFNBQVMsQ0FBQyxHQUExQyxDQUFmLEVBQUMsa0JBQUQsRUFBUTtNQUVSLE1BQUEsR0FBWSxJQUFDLENBQUEsV0FBRCxDQUFBLENBQUgsR0FBdUIsSUFBQyxDQUFBLE1BQXhCLEdBQW9DLENBQUMsSUFBQyxDQUFBO01BQy9DLFFBQUEsR0FBVyxDQUFDLE1BQUQsR0FBVSxJQUFDLENBQUEsVUFBRCxDQUFBO01BQ3JCLElBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBQSxDQUFIO1FBQ0UsU0FBQSxHQUFZLENBQUMsS0FBRCxFQUFRLFNBQVMsQ0FBQyxTQUFWLENBQW9CLENBQUMsQ0FBRCxFQUFJLFFBQUosQ0FBcEIsQ0FBUjtRQUNaLE1BQUEsR0FBUyw2QkFGWDtPQUFBLE1BQUE7UUFJRSxTQUFBLEdBQVksQ0FBQyxTQUFTLENBQUMsU0FBVixDQUFvQixDQUFDLENBQUQsRUFBSSxDQUFBLEdBQUksUUFBUixDQUFwQixDQUFELEVBQXlDLEdBQXpDO1FBQ1osTUFBQSxHQUFTLG9CQUxYOztNQU9BLE1BQUEsR0FBUztNQUNULElBQUMsQ0FBQSxNQUFPLENBQUEsTUFBQSxDQUFSLENBQWdCLE1BQUEsQ0FBQSxFQUFBLEdBQUksQ0FBQyxDQUFDLENBQUMsWUFBRixDQUFlLElBQUMsQ0FBQSxLQUFoQixDQUFELENBQUosRUFBK0IsR0FBL0IsQ0FBaEIsRUFBa0QsU0FBbEQsRUFBNkQsU0FBQyxHQUFEO0FBQzNELFlBQUE7UUFENkQsUUFBRDtlQUM1RCxNQUFNLENBQUMsSUFBUCxDQUFZLEtBQUssQ0FBQyxLQUFsQjtNQUQyRCxDQUE3RDs0REFFbUIsQ0FBRSxTQUFyQixDQUErQixDQUFDLENBQUQsRUFBSSxNQUFKLENBQS9CO0lBZlE7O21CQWlCVixRQUFBLEdBQVUsU0FBQTthQUNSLG9DQUFBLFNBQUEsQ0FBQSxHQUFRO0lBREE7O21CQUdWLFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFDVixVQUFBO01BQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxRQUFELENBQVUsTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBVjtNQUNSLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixNQUF6QixFQUFpQyxLQUFqQztNQUNBLElBQUEsQ0FBNkMsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUE3QztlQUFBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixhQUFqQixFQUFnQyxJQUFoQyxFQUFBOztJQUhVOzs7O0tBbkNLOztFQXlDYjs7Ozs7OztJQUNKLGFBQUMsQ0FBQSxNQUFELENBQUE7OzRCQUNBLFNBQUEsR0FBVzs7NEJBQ1gsU0FBQSxHQUFXOzs0QkFDWCxLQUFBLEdBQU87TUFBQSxJQUFBLEVBQU0sUUFBTjtNQUFnQixLQUFBLEVBQU8sT0FBdkI7Ozs7O0tBSm1COztFQU90Qjs7Ozs7OztJQUNKLElBQUMsQ0FBQSxNQUFELENBQUE7O21CQUNBLE1BQUEsR0FBUTs7bUJBRVIsUUFBQSxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsS0FBRCxHQUFTLG9DQUFBLFNBQUE7SUFERDs7bUJBR1YsY0FBQSxHQUFnQixTQUFDLFNBQUQ7TUFDZCwwQ0FBQSxTQUFBO01BQ0EsSUFBRyxTQUFTLENBQUMsT0FBVixDQUFBLENBQUEsSUFBd0IsQ0FBQyxvQkFBQSxJQUFZLENBQUksSUFBQyxDQUFBLFNBQWxCLENBQTNCO2VBQ0UsS0FBQSxDQUFNLFNBQU4sQ0FBZ0IsQ0FBQyw0QkFBakIsQ0FBOEMsU0FBOUMsRUFERjs7SUFGYzs7OztLQVBDOztFQWFiOzs7Ozs7O0lBQ0osYUFBQyxDQUFBLE1BQUQsQ0FBQTs7NEJBQ0EsU0FBQSxHQUFXOzs0QkFDWCxTQUFBLEdBQVc7Ozs7S0FIZTs7RUFRdEI7Ozs7Ozs7SUFDSixVQUFDLENBQUEsTUFBRCxDQUFBOzt5QkFDQSxJQUFBLEdBQU07O3lCQUNOLFlBQUEsR0FBYzs7eUJBQ2QsS0FBQSxHQUFPO01BQUEsSUFBQSxFQUFNLGlCQUFOO01BQXlCLEtBQUEsRUFBTyxrQkFBaEM7Ozt5QkFDUCxLQUFBLEdBQU87O3lCQUVQLFVBQUEsR0FBWSxTQUFBO01BQ1YsNENBQUEsU0FBQTtNQUNBLElBQUEsQ0FBcUIsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFyQjtlQUFBLElBQUMsQ0FBQSxVQUFELENBQUEsRUFBQTs7SUFGVTs7eUJBSVosUUFBQSxHQUFVLFNBQUE7YUFDUixJQUFDLENBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBbkI7SUFEUTs7eUJBR1YsVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUNWLFVBQUE7TUFBQSxJQUFHLEtBQUEsR0FBUSxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVg7UUFDRSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBekI7ZUFDQSxNQUFNLENBQUMsVUFBUCxDQUFrQjtVQUFBLE1BQUEsRUFBUSxJQUFSO1NBQWxCLEVBRkY7O0lBRFU7Ozs7S0FkVzs7RUFvQm5COzs7Ozs7O0lBQ0osY0FBQyxDQUFBLE1BQUQsQ0FBQTs7NkJBQ0EsS0FBQSxHQUFPO01BQUEsSUFBQSxFQUFNLGlCQUFOO01BQXlCLEtBQUEsRUFBTyxrQkFBaEM7Ozs2QkFDUCxJQUFBLEdBQU07OzZCQUVOLFFBQUEsR0FBVSxTQUFBO0FBQ1IsVUFBQTtNQUFBLElBQUcsS0FBQSxHQUFRLDhDQUFBLFNBQUEsQ0FBWDtlQUNFLHFDQUFBLENBQXNDLElBQUMsQ0FBQSxNQUF2QyxFQUErQyxLQUFLLENBQUMsR0FBckQsRUFERjs7SUFEUTs7OztLQUxpQjs7RUFXdkI7Ozs7Ozs7SUFDSix1QkFBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSx1QkFBQyxDQUFBLFdBQUQsR0FBYzs7c0NBQ2QsSUFBQSxHQUFNOztzQ0FDTixLQUFBLEdBQU87O3NDQUNQLFNBQUEsR0FBVzs7c0NBRVgsVUFBQSxHQUFZLFNBQUE7TUFDVix5REFBQSxTQUFBO01BQ0EsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxLQUFkO01BQ1IsSUFBbUIsSUFBQyxDQUFBLFNBQUQsS0FBYyxNQUFqQztlQUFBLElBQUMsQ0FBQSxJQUFJLENBQUMsT0FBTixDQUFBLEVBQUE7O0lBSFU7O3NDQUtaLFdBQUEsR0FBYSxTQUFDLEtBQUQ7QUFDWCxVQUFBO01BQUEsS0FBQSxHQUFXLEtBQUEsS0FBUyxPQUFaLEdBQXlCLENBQXpCLEdBQWdDO01BQ3hDLElBQUEsR0FBTyxvQkFBQSxDQUFxQixJQUFDLENBQUEsTUFBdEIsQ0FBNkIsQ0FBQyxHQUE5QixDQUFrQyxTQUFDLFFBQUQ7ZUFDdkMsUUFBUyxDQUFBLEtBQUE7TUFEOEIsQ0FBbEM7YUFFUCxDQUFDLENBQUMsTUFBRixDQUFTLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBUCxDQUFULEVBQXVCLFNBQUMsR0FBRDtlQUFTO01BQVQsQ0FBdkI7SUFKVzs7c0NBTWIsV0FBQSxHQUFhLFNBQUMsTUFBRDtBQUNYLFVBQUE7TUFBQSxTQUFBLEdBQVksTUFBTSxDQUFDLFlBQVAsQ0FBQTtNQUNaLFVBQUE7QUFBYSxnQkFBTyxJQUFDLENBQUEsU0FBUjtBQUFBLGVBQ04sTUFETTttQkFDTSxTQUFDLEdBQUQ7cUJBQVMsR0FBQSxHQUFNO1lBQWY7QUFETixlQUVOLE1BRk07bUJBRU0sU0FBQyxHQUFEO3FCQUFTLEdBQUEsR0FBTTtZQUFmO0FBRk47O2FBR2IsSUFBQyxDQUFBLElBQUksQ0FBQyxNQUFOLENBQWEsVUFBYjtJQUxXOztzQ0FPYixTQUFBLEdBQVcsU0FBQyxNQUFEO2FBQ1QsSUFBQyxDQUFBLFdBQUQsQ0FBYSxNQUFiLENBQXFCLENBQUEsQ0FBQTtJQURaOztzQ0FHWCxVQUFBLEdBQVksU0FBQyxNQUFEO2FBQ1YsSUFBQyxDQUFBLFVBQUQsQ0FBWSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDVixjQUFBO1VBQUEsSUFBRyx1Q0FBSDttQkFDRSwrQkFBQSxDQUFnQyxNQUFoQyxFQUF3QyxHQUF4QyxFQURGOztRQURVO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFaO0lBRFU7Ozs7S0E1QndCOztFQWlDaEM7Ozs7Ozs7SUFDSixtQkFBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSxtQkFBQyxDQUFBLFdBQUQsR0FBYzs7a0NBQ2QsU0FBQSxHQUFXOzs7O0tBSHFCOztFQUs1Qjs7Ozs7OztJQUNKLHFDQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLHFDQUFDLENBQUEsV0FBRCxHQUFjOztvREFDZCxTQUFBLEdBQVcsU0FBQyxNQUFEO0FBQ1QsVUFBQTtNQUFBLGVBQUEsR0FBa0IsMEJBQUEsQ0FBMkIsSUFBQyxDQUFBLE1BQTVCLEVBQW9DLE1BQU0sQ0FBQyxZQUFQLENBQUEsQ0FBcEM7QUFDbEI7QUFBQSxXQUFBLHNDQUFBOztRQUNFLElBQUcsMEJBQUEsQ0FBMkIsSUFBQyxDQUFBLE1BQTVCLEVBQW9DLEdBQXBDLENBQUEsS0FBNEMsZUFBL0M7QUFDRSxpQkFBTyxJQURUOztBQURGO2FBR0E7SUFMUzs7OztLQUh1Qzs7RUFVOUM7Ozs7Ozs7SUFDSixpQ0FBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSxpQ0FBQyxDQUFBLFdBQUQsR0FBYzs7Z0RBQ2QsU0FBQSxHQUFXOzs7O0tBSG1DOztFQUsxQzs7Ozs7OztJQUNKLHFCQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLHFCQUFDLENBQUEsV0FBRCxHQUFjOztvQ0FDZCxLQUFBLEdBQU87Ozs7S0FIMkI7O0VBSzlCOzs7Ozs7O0lBQ0osaUJBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0EsaUJBQUMsQ0FBQSxXQUFELEdBQWM7O2dDQUNkLFNBQUEsR0FBVzs7OztLQUhtQjs7RUFNMUI7Ozs7Ozs7SUFDSixzQkFBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSxzQkFBQyxDQUFBLFdBQUQsR0FBYzs7cUNBQ2QsU0FBQSxHQUFXOztxQ0FDWCxTQUFBLEdBQVcsU0FBQyxNQUFEO2FBQ1QsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxJQUFDLENBQUEsV0FBRCxDQUFhLE1BQWIsQ0FBVCxFQUErQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtpQkFDN0IsNEJBQUEsQ0FBNkIsS0FBQyxDQUFBLE1BQTlCLEVBQXNDLEdBQXRDO1FBRDZCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUEvQjtJQURTOzs7O0tBSndCOztFQVEvQjs7Ozs7OztJQUNKLGtCQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLGtCQUFDLENBQUEsV0FBRCxHQUFjOztpQ0FDZCxTQUFBLEdBQVc7Ozs7S0FIb0I7O0VBTzNCOzs7Ozs7O0lBQ0oscUJBQUMsQ0FBQSxNQUFELENBQVEsS0FBUjs7b0NBQ0EsU0FBQSxHQUFXOztvQ0FDWCxLQUFBLEdBQU87O29DQUVQLFFBQUEsR0FBVSxTQUFDLFNBQUQ7YUFDUixnQ0FBQSxDQUFpQyxJQUFDLENBQUEsTUFBbEMsRUFBMEMsU0FBMUMsRUFBcUQsSUFBQyxDQUFBLFNBQXRELEVBQWlFLElBQUMsQ0FBQSxLQUFsRTtJQURROztvQ0FHVixVQUFBLEdBQVksU0FBQyxNQUFEO0FBQ1YsVUFBQTtNQUFBLEtBQUEsR0FBUSxNQUFNLENBQUMsaUJBQVAsQ0FBQTtNQUNSLElBQUMsQ0FBQSxVQUFELENBQVksQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDVixjQUFBO1VBRFksT0FBRDtVQUNYLElBQUcsQ0FBQyxRQUFBLEdBQVcsS0FBQyxDQUFBLFFBQUQsQ0FBVSxLQUFWLENBQVosQ0FBSDttQkFDRSxLQUFBLEdBQVEsU0FEVjtXQUFBLE1BQUE7bUJBR0UsSUFBQSxDQUFBLEVBSEY7O1FBRFU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVo7YUFLQSxJQUFDLENBQUEsdUJBQUQsQ0FBeUIsTUFBekIsRUFBaUMsS0FBakM7SUFQVTs7OztLQVJzQjs7RUFpQjlCOzs7Ozs7O0lBQ0osb0JBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0Esb0JBQUMsQ0FBQSxXQUFELEdBQWM7O21DQUNkLFNBQUEsR0FBVzs7bUNBQ1gsS0FBQSxHQUFPOzs7O0tBSjBCOztFQU03Qjs7Ozs7OztJQUNKLGdCQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLGdCQUFDLENBQUEsV0FBRCxHQUFjOzsrQkFDZCxTQUFBLEdBQVc7Ozs7S0FIa0I7O0VBS3pCOzs7Ozs7O0lBQ0osb0JBQUMsQ0FBQSxNQUFELENBQUE7O21DQUNBLFNBQUEsR0FBVzs7SUFDWCxvQkFBQyxDQUFBLFdBQUQsR0FBYzs7bUNBQ2QsS0FBQSxHQUFPOzs7O0tBSjBCOztFQU03Qjs7Ozs7OztJQUNKLGdCQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLGdCQUFDLENBQUEsV0FBRCxHQUFjOzsrQkFDZCxTQUFBLEdBQVc7Ozs7S0FIa0I7O0VBT3pCOzs7Ozs7O0lBQ0osVUFBQyxDQUFBLE1BQUQsQ0FBQTs7eUJBQ0EsU0FBQSxHQUFXOzt5QkFDWCxJQUFBLEdBQU07O3lCQUNOLE1BQUEsR0FBUSxDQUFDLGFBQUQsRUFBZ0IsY0FBaEIsRUFBZ0MsZUFBaEMsRUFBaUQsY0FBakQ7O3lCQUVSLFVBQUEsR0FBWSxTQUFDLE1BQUQ7YUFDVixJQUFDLENBQUEsdUJBQUQsQ0FBeUIsTUFBekIsRUFBaUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFWLENBQWpDO0lBRFU7O3lCQUdaLFFBQUEsR0FBVSxTQUFDLE1BQUQ7QUFDUixVQUFBO01BQUEsY0FBQSxHQUFpQixNQUFNLENBQUMsaUJBQVAsQ0FBQTtNQUNqQixTQUFBLEdBQVksY0FBYyxDQUFDO01BRTNCLGNBQUEsR0FBaUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQ2YsY0FBQTtVQUFBLENBQUEsR0FBSTtVQUNKLFFBQUEsR0FBVyxLQUFDLEVBQUEsR0FBQSxFQUFELENBQUssTUFBTCxDQUFZLENBQUMsV0FBYixDQUF5QixDQUF6QjtVQUNYLElBQW1CLGdCQUFuQjtBQUFBLG1CQUFPLEtBQVA7O1VBQ0MsOEJBQUQsRUFBWTtVQUNaLFNBQUEsR0FBWSxTQUFTLENBQUMsU0FBVixDQUFvQixDQUFDLENBQUQsRUFBSSxDQUFDLENBQUwsQ0FBcEIsRUFBNkIsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQTdCO1VBQ1osVUFBQSxHQUFhLFVBQVUsQ0FBQyxTQUFYLENBQXFCLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBTCxDQUFyQixFQUE4QixDQUFDLENBQUQsRUFBSSxDQUFDLENBQUwsQ0FBOUI7VUFDYixJQUEyQixTQUFTLENBQUMsYUFBVixDQUF3QixDQUF4QixDQUFBLElBQStCLENBQUMsQ0FBSSxDQUFDLENBQUMsT0FBRixDQUFVLFNBQVMsQ0FBQyxHQUFwQixDQUFMLENBQTFEO0FBQUEsbUJBQU8sVUFBVSxDQUFDLE1BQWxCOztVQUNBLElBQTBCLFVBQVUsQ0FBQyxhQUFYLENBQXlCLENBQXpCLENBQUEsSUFBZ0MsQ0FBQyxDQUFJLENBQUMsQ0FBQyxPQUFGLENBQVUsVUFBVSxDQUFDLEdBQXJCLENBQUwsQ0FBMUQ7QUFBQSxtQkFBTyxTQUFTLENBQUMsTUFBakI7O1FBUmU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO01BVWpCLEtBQUEsR0FBUSxjQUFBLENBQUE7TUFDUixJQUFnQixhQUFoQjtBQUFBLGVBQU8sTUFBUDs7TUFFQSxNQUFBLEdBQVMsSUFBQyxFQUFBLEdBQUEsRUFBRCxDQUFLLFVBQUwsRUFBaUI7UUFBQyxlQUFBLEVBQWlCLElBQWxCO1FBQXlCLFFBQUQsSUFBQyxDQUFBLE1BQXpCO09BQWpCLENBQWtELENBQUMsU0FBbkQsQ0FBNkQsTUFBTSxDQUFDLFNBQXBFO01BQ1QsTUFBQSxHQUFTLE1BQU0sQ0FBQyxNQUFQLENBQWMsU0FBQyxHQUFEO0FBQ3JCLFlBQUE7UUFEdUIsbUJBQU87UUFDOUIsQ0FBQSxHQUFJO2VBQ0osQ0FBQyxDQUFDLENBQUMsR0FBRixLQUFTLEtBQUssQ0FBQyxHQUFoQixDQUFBLElBQXlCLEtBQUssQ0FBQyxvQkFBTixDQUEyQixDQUEzQixDQUF6QixJQUNFLENBQUMsQ0FBQyxDQUFDLEdBQUYsS0FBUyxHQUFHLENBQUMsR0FBZCxDQURGLElBQ3lCLEdBQUcsQ0FBQyxvQkFBSixDQUF5QixDQUF6QjtNQUhKLENBQWQ7TUFLVCxJQUFBLENBQW1CLE1BQU0sQ0FBQyxNQUExQjtBQUFBLGVBQU8sS0FBUDs7TUFHQSxPQUFzQyxDQUFDLENBQUMsU0FBRixDQUFZLE1BQVosRUFBb0IsU0FBQyxLQUFEO2VBQ3hELEtBQUssQ0FBQyxhQUFOLENBQW9CLGNBQXBCLEVBQW9DLElBQXBDO01BRHdELENBQXBCLENBQXRDLEVBQUMseUJBQUQsRUFBa0I7TUFFbEIsY0FBQSxHQUFpQixDQUFDLENBQUMsSUFBRixDQUFPLFVBQUEsQ0FBVyxlQUFYLENBQVA7TUFDakIsZ0JBQUEsR0FBbUIsVUFBQSxDQUFXLGdCQUFYO01BRW5CLElBQUcsY0FBSDtRQUNFLGdCQUFBLEdBQW1CLGdCQUFnQixDQUFDLE1BQWpCLENBQXdCLFNBQUMsS0FBRDtpQkFDekMsY0FBYyxDQUFDLGFBQWYsQ0FBNkIsS0FBN0I7UUFEeUMsQ0FBeEIsRUFEckI7O3lEQUltQixDQUFFLEdBQUcsQ0FBQyxTQUF6QixDQUFtQyxDQUFDLENBQUQsRUFBSSxDQUFDLENBQUwsQ0FBbkMsV0FBQSw4QkFBK0MsY0FBYyxDQUFFO0lBbkN2RDs7OztLQVRhO0FBcGlDekIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue1BvaW50LCBSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuU2VsZWN0ID0gbnVsbFxuXG57XG4gIHNhdmVFZGl0b3JTdGF0ZSwgZ2V0VmlzaWJsZUJ1ZmZlclJhbmdlXG4gIG1vdmVDdXJzb3JMZWZ0LCBtb3ZlQ3Vyc29yUmlnaHRcbiAgbW92ZUN1cnNvclVwU2NyZWVuLCBtb3ZlQ3Vyc29yRG93blNjcmVlblxuICBtb3ZlQ3Vyc29yRG93bkJ1ZmZlclxuICBtb3ZlQ3Vyc29yVXBCdWZmZXJcbiAgY3Vyc29ySXNBdFZpbUVuZE9mRmlsZVxuICBnZXRGaXJzdFZpc2libGVTY3JlZW5Sb3csIGdldExhc3RWaXNpYmxlU2NyZWVuUm93XG4gIGdldFZhbGlkVmltU2NyZWVuUm93LCBnZXRWYWxpZFZpbUJ1ZmZlclJvd1xuICBoaWdobGlnaHRSYW5nZXNcbiAgbW92ZUN1cnNvclRvRmlyc3RDaGFyYWN0ZXJBdFJvd1xuICBzb3J0UmFuZ2VzXG4gIGdldEluZGVudExldmVsRm9yQnVmZmVyUm93XG4gIGN1cnNvcklzT25XaGl0ZVNwYWNlXG4gIG1vdmVDdXJzb3JUb05leHROb25XaGl0ZXNwYWNlXG4gIGN1cnNvcklzQXRFbXB0eVJvd1xuICBnZXRDb2RlRm9sZFJvd1Jhbmdlc1xuICBnZXRMYXJnZXN0Rm9sZFJhbmdlQ29udGFpbnNCdWZmZXJSb3dcbiAgaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvd1xuICBkZXRlY3RTY29wZVN0YXJ0UG9zaXRpb25Gb3JTY29wZVxuICBnZXRCdWZmZXJSb3dzXG4gIGdldFN0YXJ0UG9zaXRpb25Gb3JQYXR0ZXJuXG4gIGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3dcbiAgZ2V0Rmlyc3RDaGFyYWN0ZXJCdWZmZXJQb3NpdGlvbkZvclNjcmVlblJvd1xuICBzY3JlZW5Qb3NpdGlvbklzQXRXaGl0ZVNwYWNlXG4gIGN1cnNvcklzQXRFbmRPZkxpbmVBdE5vbkVtcHR5Um93XG4gIGdldEZpcnN0Q2hhcmFjdGVyQ29sdW1Gb3JCdWZmZXJSb3dcbiAgZ2V0Rmlyc3RDaGFyYWN0ZXJTY3JlZW5Qb3NpdGlvbkZvclNjcmVlblJvd1xuXG4gIGRlYnVnXG59ID0gcmVxdWlyZSAnLi91dGlscydcblxuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuQmFzZSA9IHJlcXVpcmUgJy4vYmFzZSdcblxuY2xhc3MgTW90aW9uIGV4dGVuZHMgQmFzZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBpbmNsdXNpdmU6IGZhbHNlXG4gIHdpc2U6ICdjaGFyYWN0ZXJ3aXNlJ1xuICBqdW1wOiBmYWxzZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIHN1cGVyXG5cbiAgICAjIHZpc3VhbCBtb2RlIGNhbiBvdmVyd3JpdGUgZGVmYXVsdCB3aXNlIGFuZCBpbmNsdXNpdmVuZXNzXG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJylcbiAgICAgIEBpbmNsdXNpdmUgPSB0cnVlXG4gICAgICBAd2lzZSA9IEB2aW1TdGF0ZS5zdWJtb2RlICMgWydjaGFyYWN0ZXJ3aXNlJywgJ2xpbmV3aXNlJywgJ2Jsb2Nrd2lzZSddXG4gICAgQGluaXRpYWxpemUoKVxuXG4gIGlzSW5jbHVzaXZlOiAtPlxuICAgIEBpbmNsdXNpdmVcblxuICBpc0p1bXA6IC0+XG4gICAgQGp1bXBcblxuICBpc0NoYXJhY3Rlcndpc2U6IC0+XG4gICAgQHdpc2UgaXMgJ2NoYXJhY3Rlcndpc2UnXG5cbiAgaXNMaW5ld2lzZTogLT5cbiAgICBAd2lzZSBpcyAnbGluZXdpc2UnXG5cbiAgaXNCbG9ja3dpc2U6IC0+XG4gICAgQHdpc2UgaXMgJ2Jsb2Nrd2lzZSdcblxuICBmb3JjZVdpc2U6ICh3aXNlKSAtPlxuICAgIGlmIHdpc2UgaXMgJ2NoYXJhY3Rlcndpc2UnXG4gICAgICBpZiBAd2lzZSBpcyAnbGluZXdpc2UnXG4gICAgICAgIEBpbmNsdXNpdmUgPSBmYWxzZVxuICAgICAgZWxzZVxuICAgICAgICBAaW5jbHVzaXZlID0gbm90IEBpbmNsdXNpdmVcbiAgICBAd2lzZSA9IHdpc2VcblxuICBzZXRCdWZmZXJQb3NpdGlvblNhZmVseTogKGN1cnNvciwgcG9pbnQpIC0+XG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KSBpZiBwb2ludD9cblxuICBzZXRTY3JlZW5Qb3NpdGlvblNhZmVseTogKGN1cnNvciwgcG9pbnQpIC0+XG4gICAgY3Vyc29yLnNldFNjcmVlblBvc2l0aW9uKHBvaW50KSBpZiBwb2ludD9cblxuICBtb3ZlV2l0aFNhdmVKdW1wOiAoY3Vyc29yKSAtPlxuICAgIGlmIGN1cnNvci5pc0xhc3RDdXJzb3IoKSBhbmQgQGlzSnVtcCgpXG4gICAgICBjdXJzb3JQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICBAbW92ZUN1cnNvcihjdXJzb3IpXG5cbiAgICBpZiBjdXJzb3JQb3NpdGlvbj8gYW5kIG5vdCBjdXJzb3JQb3NpdGlvbi5pc0VxdWFsKGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgQHZpbVN0YXRlLm1hcmsuc2V0KCdgJywgY3Vyc29yUG9zaXRpb24pXG4gICAgICBAdmltU3RhdGUubWFyay5zZXQoXCInXCIsIGN1cnNvclBvc2l0aW9uKVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgQGVkaXRvci5tb3ZlQ3Vyc29ycyAoY3Vyc29yKSA9PlxuICAgICAgQG1vdmVXaXRoU2F2ZUp1bXAoY3Vyc29yKVxuXG4gIHNlbGVjdDogLT5cbiAgICBAdmltU3RhdGUubW9kZU1hbmFnZXIubm9ybWFsaXplU2VsZWN0aW9ucygpIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBAc2VsZWN0QnlNb3Rpb24oc2VsZWN0aW9uKVxuXG4gICAgQGVkaXRvci5tZXJnZUN1cnNvcnMoKVxuICAgIEBlZGl0b3IubWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zKClcblxuICAgIEB1cGRhdGVTZWxlY3Rpb25Qcm9wZXJ0aWVzKCkgaWYgQGlzTW9kZSgndmlzdWFsJylcblxuICAgICMgTW9kaWZ5IHNlbGVjdGlvbiB0byBzdWJtb2RlLXdpc2VseVxuICAgIHN3aXRjaCBAd2lzZVxuICAgICAgd2hlbiAnbGluZXdpc2UnIHRoZW4gQHZpbVN0YXRlLnNlbGVjdExpbmV3aXNlKClcbiAgICAgIHdoZW4gJ2Jsb2Nrd2lzZScgdGhlbiBAdmltU3RhdGUuc2VsZWN0QmxvY2t3aXNlKClcblxuICBzZWxlY3RCeU1vdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICB7Y3Vyc29yfSA9IHNlbGVjdGlvblxuXG4gICAgc2VsZWN0aW9uLm1vZGlmeVNlbGVjdGlvbiA9PlxuICAgICAgQG1vdmVXaXRoU2F2ZUp1bXAoY3Vyc29yKVxuXG4gICAgcmV0dXJuIGlmIG5vdCBAaXNNb2RlKCd2aXN1YWwnKSBhbmQgc2VsZWN0aW9uLmlzRW1wdHkoKSAjIEZhaWxlZCB0byBtb3ZlLlxuICAgIHJldHVybiB1bmxlc3MgQGlzSW5jbHVzaXZlKCkgb3IgQGlzTGluZXdpc2UoKVxuXG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJykgYW5kIGN1cnNvcklzQXRFbmRPZkxpbmVBdE5vbkVtcHR5Um93KGN1cnNvcilcbiAgICAgICMgQXZvaWQgcHV0aW5nIGN1cnNvciBvbiBFT0wgaW4gdmlzdWFsLW1vZGUgYXMgbG9uZyBhcyBjdXJzb3IncyByb3cgd2FzIG5vbi1lbXB0eS5cbiAgICAgIHN3cmFwKHNlbGVjdGlvbikudHJhbnNsYXRlU2VsZWN0aW9uSGVhZEFuZENsaXAoJ2JhY2t3YXJkJylcbiAgICAjIHRvIHNlbGVjdCBAaW5jbHVzaXZlLWx5XG4gICAgc3dyYXAoc2VsZWN0aW9uKS50cmFuc2xhdGVTZWxlY3Rpb25FbmRBbmRDbGlwKCdmb3J3YXJkJylcblxuIyBVc2VkIGFzIG9wZXJhdG9yJ3MgdGFyZ2V0IGluIHZpc3VhbC1tb2RlLlxuY2xhc3MgQ3VycmVudFNlbGVjdGlvbiBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKGZhbHNlKVxuICBzZWxlY3Rpb25FeHRlbnQ6IG51bGxcbiAgaW5jbHVzaXZlOiB0cnVlXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIEBwb2ludEluZm9CeUN1cnNvciA9IG5ldyBNYXBcblxuICBleGVjdXRlOiAtPlxuICAgIHRocm93IG5ldyBFcnJvcihcIiN7QGdldE5hbWUoKX0gc2hvdWxkIG5vdCBiZSBleGVjdXRlZFwiKVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJylcbiAgICAgIGlmIEBpc0Jsb2Nrd2lzZSgpXG4gICAgICAgIHtzdGFydCwgZW5kfSA9IGN1cnNvci5zZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgICBbaGVhZCwgdGFpbF0gPSBpZiBjdXJzb3Iuc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKSB0aGVuIFtzdGFydCwgZW5kXSBlbHNlIFtlbmQsIHN0YXJ0XVxuICAgICAgICBAc2VsZWN0aW9uRXh0ZW50ID0gbmV3IFBvaW50KGhlYWQucm93IC0gdGFpbC5yb3csIGhlYWQuY29sdW1uIC0gdGFpbC5jb2x1bW4pXG4gICAgICBlbHNlXG4gICAgICAgIEBzZWxlY3Rpb25FeHRlbnQgPSBAZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKS5nZXRFeHRlbnQoKVxuICAgIGVsc2VcbiAgICAgIHBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGlmIEBpc0Jsb2Nrd2lzZSgpXG4gICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludC50cmFuc2xhdGUoQHNlbGVjdGlvbkV4dGVudCkpXG4gICAgICBlbHNlXG4gICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludC50cmF2ZXJzZShAc2VsZWN0aW9uRXh0ZW50KSlcblxuICBzZWxlY3Q6IC0+XG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJylcbiAgICAgIHN1cGVyXG4gICAgZWxzZVxuICAgICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKSB3aGVuIHBvaW50SW5mbyA9IEBwb2ludEluZm9CeUN1cnNvci5nZXQoY3Vyc29yKVxuICAgICAgICB7Y3Vyc29yUG9zaXRpb24sIHN0YXJ0T2ZTZWxlY3Rpb24sIGF0RU9MfSA9IHBvaW50SW5mb1xuICAgICAgICBpZiBhdEVPTCBvciBjdXJzb3JQb3NpdGlvbi5pc0VxdWFsKGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihzdGFydE9mU2VsZWN0aW9uKVxuICAgICAgc3VwZXJcblxuICAgICMgKiBQdXJwb3NlIG9mIHBvaW50SW5mb0J5Q3Vyc29yPyBzZWUgIzIzNSBmb3IgZGV0YWlsLlxuICAgICMgV2hlbiBzdGF5T25UcmFuc2Zvcm1TdHJpbmcgaXMgZW5hYmxlZCwgY3Vyc29yIHBvcyBpcyBub3Qgc2V0IG9uIHN0YXJ0IG9mXG4gICAgIyBvZiBzZWxlY3RlZCByYW5nZS5cbiAgICAjIEJ1dCBJIHdhbnQgZm9sbG93aW5nIGJlaGF2aW9yLCBzbyBuZWVkIHRvIHByZXNlcnZlIHBvc2l0aW9uIGluZm8uXG4gICAgIyAgMS4gYHZqPi5gIC0+IGluZGVudCBzYW1lIHR3byByb3dzIHJlZ2FyZGxlc3Mgb2YgY3VycmVudCBjdXJzb3IncyByb3cuXG4gICAgIyAgMi4gYHZqPmouYCAtPiBpbmRlbnQgdHdvIHJvd3MgZnJvbSBjdXJzb3IncyByb3cuXG4gICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgICAgc3RhcnRPZlNlbGVjdGlvbiA9IGN1cnNvci5zZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydFxuICAgICAgQG9uRGlkRmluaXNoT3BlcmF0aW9uID0+XG4gICAgICAgIGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgYXRFT0wgPSBjdXJzb3IuaXNBdEVuZE9mTGluZSgpXG4gICAgICAgIEBwb2ludEluZm9CeUN1cnNvci5zZXQoY3Vyc29yLCB7c3RhcnRPZlNlbGVjdGlvbiwgY3Vyc29yUG9zaXRpb24sIGF0RU9MfSlcblxuY2xhc3MgTW92ZUxlZnQgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgYWxsb3dXcmFwID0gc2V0dGluZ3MuZ2V0KCd3cmFwTGVmdFJpZ2h0TW90aW9uJylcbiAgICBAY291bnRUaW1lcyAtPlxuICAgICAgbW92ZUN1cnNvckxlZnQoY3Vyc29yLCB7YWxsb3dXcmFwfSlcblxuY2xhc3MgTW92ZVJpZ2h0IGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBjYW5XcmFwVG9OZXh0TGluZTogKGN1cnNvcikgLT5cbiAgICBpZiBAaXNBc09wZXJhdG9yVGFyZ2V0KCkgYW5kIG5vdCBjdXJzb3IuaXNBdEVuZE9mTGluZSgpXG4gICAgICBmYWxzZVxuICAgIGVsc2VcbiAgICAgIHNldHRpbmdzLmdldCgnd3JhcExlZnRSaWdodE1vdGlvbicpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAY291bnRUaW1lcyA9PlxuICAgICAgQGVkaXRvci51bmZvbGRCdWZmZXJSb3coY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuICAgICAgYWxsb3dXcmFwID0gQGNhbldyYXBUb05leHRMaW5lKGN1cnNvcilcbiAgICAgIG1vdmVDdXJzb3JSaWdodChjdXJzb3IpXG4gICAgICBpZiBjdXJzb3IuaXNBdEVuZE9mTGluZSgpIGFuZCBhbGxvd1dyYXAgYW5kIG5vdCBjdXJzb3JJc0F0VmltRW5kT2ZGaWxlKGN1cnNvcilcbiAgICAgICAgbW92ZUN1cnNvclJpZ2h0KGN1cnNvciwge2FsbG93V3JhcH0pXG5cbmNsYXNzIE1vdmVSaWdodEJ1ZmZlckNvbHVtbiBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKHRydWUpXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgbmV3UG9pbnQgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKS50cmFuc2xhdGUoWzAsIEBnZXRDb3VudCgpXSlcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24obmV3UG9pbnQpXG5cbmNsYXNzIE1vdmVVcCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuXG4gIGdldFBvaW50OiAoY3Vyc29yKSAtPlxuICAgIHJvdyA9IEBnZXRSb3coY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuICAgIG5ldyBQb2ludChyb3csIGN1cnNvci5nb2FsQ29sdW1uKVxuXG4gIGdldFJvdzogKHJvdykgLT5cbiAgICByb3cgPSBNYXRoLm1heChyb3cgLSAxLCAwKVxuICAgIGlmIEBlZGl0b3IuaXNGb2xkZWRBdEJ1ZmZlclJvdyhyb3cpXG4gICAgICByb3cgPSBnZXRMYXJnZXN0Rm9sZFJhbmdlQ29udGFpbnNCdWZmZXJSb3coQGVkaXRvciwgcm93KS5zdGFydC5yb3dcbiAgICByb3dcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBjb3VudFRpbWVzID0+XG4gICAgICBjdXJzb3IuZ29hbENvbHVtbiA/PSBjdXJzb3IuZ2V0QnVmZmVyQ29sdW1uKClcbiAgICAgIHtnb2FsQ29sdW1ufSA9IGN1cnNvclxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKEBnZXRQb2ludChjdXJzb3IpKVxuICAgICAgY3Vyc29yLmdvYWxDb2x1bW4gPSBnb2FsQ29sdW1uXG5cbmNsYXNzIE1vdmVEb3duIGV4dGVuZHMgTW92ZVVwXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG5cbiAgZ2V0Um93OiAocm93KSAtPlxuICAgIGlmIEBlZGl0b3IuaXNGb2xkZWRBdEJ1ZmZlclJvdyhyb3cpXG4gICAgICByb3cgPSBnZXRMYXJnZXN0Rm9sZFJhbmdlQ29udGFpbnNCdWZmZXJSb3coQGVkaXRvciwgcm93KS5lbmQucm93XG4gICAgTWF0aC5taW4ocm93ICsgMSwgQGdldFZpbUxhc3RCdWZmZXJSb3coKSlcblxuY2xhc3MgTW92ZVVwU2NyZWVuIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIGRpcmVjdGlvbjogJ3VwJ1xuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQGNvdW50VGltZXMgLT5cbiAgICAgIG1vdmVDdXJzb3JVcFNjcmVlbihjdXJzb3IpXG5cbmNsYXNzIE1vdmVEb3duU2NyZWVuIGV4dGVuZHMgTW92ZVVwU2NyZWVuXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIGRpcmVjdGlvbjogJ2Rvd24nXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAY291bnRUaW1lcyAtPlxuICAgICAgbW92ZUN1cnNvckRvd25TY3JlZW4oY3Vyc29yKVxuXG4jIE1vdmUgZG93bi91cCB0byBFZGdlXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgU2VlIHQ5bWQvYXRvbS12aW0tbW9kZS1wbHVzIzIzNlxuIyBBdCBsZWFzdCB2MS43LjAuIGJ1ZmZlclBvc2l0aW9uIGFuZCBzY3JlZW5Qb3NpdGlvbiBjYW5ub3QgY29udmVydCBhY2N1cmF0ZWx5XG4jIHdoZW4gcm93IGlzIGZvbGRlZC5cbmNsYXNzIE1vdmVVcFRvRWRnZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICBqdW1wOiB0cnVlXG4gIGRpcmVjdGlvbjogJ3VwJ1xuICBAZGVzY3JpcHRpb246IFwiTW92ZSBjdXJzb3IgdXAgdG8gKiplZGdlKiogY2hhciBhdCBzYW1lLWNvbHVtblwiXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBwb2ludCA9IGN1cnNvci5nZXRTY3JlZW5Qb3NpdGlvbigpXG4gICAgQGNvdW50VGltZXMgKHtzdG9wfSkgPT5cbiAgICAgIGlmIChuZXdQb2ludCA9IEBnZXRQb2ludChwb2ludCkpXG4gICAgICAgIHBvaW50ID0gbmV3UG9pbnRcbiAgICAgIGVsc2VcbiAgICAgICAgc3RvcCgpXG4gICAgQHNldFNjcmVlblBvc2l0aW9uU2FmZWx5KGN1cnNvciwgcG9pbnQpXG5cbiAgZ2V0UG9pbnQ6IChmcm9tUG9pbnQpIC0+XG4gICAgY29sdW1uID0gZnJvbVBvaW50LmNvbHVtblxuICAgIGZvciByb3cgaW4gQGdldFNjYW5Sb3dzKGZyb21Qb2ludCkgd2hlbiBwb2ludCA9IG5ldyBQb2ludChyb3csIGNvbHVtbilcbiAgICAgIHJldHVybiBwb2ludCBpZiBAaXNFZGdlKHBvaW50KVxuXG4gIGdldFNjYW5Sb3dzOiAoe3Jvd30pIC0+XG4gICAgdmFsaWRSb3cgPSBnZXRWYWxpZFZpbVNjcmVlblJvdy5iaW5kKG51bGwsIEBlZGl0b3IpXG4gICAgc3dpdGNoIEBkaXJlY3Rpb25cbiAgICAgIHdoZW4gJ3VwJyB0aGVuIFt2YWxpZFJvdyhyb3cgLSAxKS4uMF1cbiAgICAgIHdoZW4gJ2Rvd24nIHRoZW4gW3ZhbGlkUm93KHJvdyArIDEpLi5AZ2V0VmltTGFzdFNjcmVlblJvdygpXVxuXG4gIGlzRWRnZTogKHBvaW50KSAtPlxuICAgIGlmIEBpc1N0b3BwYWJsZVBvaW50KHBvaW50KVxuICAgICAgIyBJZiBvbmUgb2YgYWJvdmUvYmVsb3cgcG9pbnQgd2FzIG5vdCBzdG9wcGFibGUsIGl0J3MgRWRnZSFcbiAgICAgIGFib3ZlID0gcG9pbnQudHJhbnNsYXRlKFstMSwgMF0pXG4gICAgICBiZWxvdyA9IHBvaW50LnRyYW5zbGF0ZShbKzEsIDBdKVxuICAgICAgKG5vdCBAaXNTdG9wcGFibGVQb2ludChhYm92ZSkpIG9yIChub3QgQGlzU3RvcHBhYmxlUG9pbnQoYmVsb3cpKVxuICAgIGVsc2VcbiAgICAgIGZhbHNlXG5cbiAgaXNTdG9wcGFibGVQb2ludDogKHBvaW50KSAtPlxuICAgIGlmIEBpc05vbldoaXRlU3BhY2VQb2ludChwb2ludClcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBsZWZ0UG9pbnQgPSBwb2ludC50cmFuc2xhdGUoWzAsIC0xXSlcbiAgICAgIHJpZ2h0UG9pbnQgPSBwb2ludC50cmFuc2xhdGUoWzAsICsxXSlcbiAgICAgIEBpc05vbldoaXRlU3BhY2VQb2ludChsZWZ0UG9pbnQpIGFuZCBAaXNOb25XaGl0ZVNwYWNlUG9pbnQocmlnaHRQb2ludClcblxuICBpc05vbldoaXRlU3BhY2VQb2ludDogKHBvaW50KSAtPlxuICAgIHNjcmVlblBvc2l0aW9uSXNBdFdoaXRlU3BhY2UoQGVkaXRvciwgcG9pbnQpXG5cbmNsYXNzIE1vdmVEb3duVG9FZGdlIGV4dGVuZHMgTW92ZVVwVG9FZGdlXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSBjdXJzb3IgZG93biB0byAqKmVkZ2UqKiBjaGFyIGF0IHNhbWUtY29sdW1uXCJcbiAgZGlyZWN0aW9uOiAnZG93bidcblxuIyB3b3JkXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb05leHRXb3JkIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICB3b3JkUmVnZXg6IG51bGxcblxuICBnZXRQb2ludDogKGN1cnNvcikgLT5cbiAgICBjdXJzb3JQb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgcGF0dGVybiA9IEB3b3JkUmVnZXggPyBjdXJzb3Iud29yZFJlZ0V4cCgpXG4gICAgc2NhblJhbmdlID0gW2N1cnNvclBvaW50LCBAZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oKV1cblxuICAgIHdvcmRSYW5nZSA9IG51bGxcbiAgICBmb3VuZCA9IGZhbHNlXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSBwYXR0ZXJuLCBzY2FuUmFuZ2UsICh7cmFuZ2UsIG1hdGNoVGV4dCwgc3RvcH0pIC0+XG4gICAgICB3b3JkUmFuZ2UgPSByYW5nZVxuICAgICAgIyBJZ25vcmUgJ2VtcHR5IGxpbmUnIG1hdGNoZXMgYmV0d2VlbiAnXFxyJyBhbmQgJ1xcbidcbiAgICAgIHJldHVybiBpZiBtYXRjaFRleHQgaXMgJycgYW5kIHJhbmdlLnN0YXJ0LmNvbHVtbiBpc250IDBcbiAgICAgIGlmIHJhbmdlLnN0YXJ0LmlzR3JlYXRlclRoYW4oY3Vyc29yUG9pbnQpXG4gICAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICAgICBzdG9wKClcblxuICAgIGlmIGZvdW5kXG4gICAgICB3b3JkUmFuZ2Uuc3RhcnRcbiAgICBlbHNlXG4gICAgICB3b3JkUmFuZ2U/LmVuZCA/IGN1cnNvclBvaW50XG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICByZXR1cm4gaWYgY3Vyc29ySXNBdFZpbUVuZE9mRmlsZShjdXJzb3IpXG4gICAgd2FzT25XaGl0ZVNwYWNlID0gY3Vyc29ySXNPbldoaXRlU3BhY2UoY3Vyc29yKVxuICAgIEBjb3VudFRpbWVzICh7aXNGaW5hbH0pID0+XG4gICAgICBjdXJzb3JSb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KClcbiAgICAgIGlmIGN1cnNvcklzQXRFbXB0eVJvdyhjdXJzb3IpIGFuZCBAaXNBc09wZXJhdG9yVGFyZ2V0KClcbiAgICAgICAgcG9pbnQgPSBbY3Vyc29yUm93KzEsIDBdXG4gICAgICBlbHNlXG4gICAgICAgIHBvaW50ID0gQGdldFBvaW50KGN1cnNvcilcbiAgICAgICAgaWYgaXNGaW5hbCBhbmQgQGlzQXNPcGVyYXRvclRhcmdldCgpXG4gICAgICAgICAgaWYgQGdldE9wZXJhdG9yKCkuZ2V0TmFtZSgpIGlzICdDaGFuZ2UnIGFuZCAobm90IHdhc09uV2hpdGVTcGFjZSlcbiAgICAgICAgICAgIHBvaW50ID0gY3Vyc29yLmdldEVuZE9mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7QHdvcmRSZWdleH0pXG4gICAgICAgICAgZWxzZSBpZiAocG9pbnQucm93ID4gY3Vyc29yUm93KVxuICAgICAgICAgICAgcG9pbnQgPSBbY3Vyc29yUm93LCBJbmZpbml0eV1cbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuIyBiXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1dvcmQgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIHdvcmRSZWdleDogbnVsbFxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQGNvdW50VGltZXMgPT5cbiAgICAgIHBvaW50ID0gY3Vyc29yLmdldEJlZ2lubmluZ09mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7QHdvcmRSZWdleH0pXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbmNsYXNzIE1vdmVUb0VuZE9mV29yZCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgd29yZFJlZ2V4OiBudWxsXG4gIGluY2x1c2l2ZTogdHJ1ZVxuXG4gIG1vdmVUb05leHRFbmRPZldvcmQ6IChjdXJzb3IpIC0+XG4gICAgbW92ZUN1cnNvclRvTmV4dE5vbldoaXRlc3BhY2UoY3Vyc29yKVxuICAgIHBvaW50ID0gY3Vyc29yLmdldEVuZE9mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7QHdvcmRSZWdleH0pLnRyYW5zbGF0ZShbMCwgLTFdKVxuICAgIHBvaW50ID0gUG9pbnQubWluKHBvaW50LCBAZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oKSlcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAY291bnRUaW1lcyA9PlxuICAgICAgb3JpZ2luYWxQb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBAbW92ZVRvTmV4dEVuZE9mV29yZChjdXJzb3IpXG4gICAgICBpZiBvcmlnaW5hbFBvaW50LmlzRXF1YWwoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICAgICMgUmV0cnkgZnJvbSByaWdodCBjb2x1bW4gaWYgY3Vyc29yIHdhcyBhbHJlYWR5IG9uIEVuZE9mV29yZFxuICAgICAgICBjdXJzb3IubW92ZVJpZ2h0KClcbiAgICAgICAgQG1vdmVUb05leHRFbmRPZldvcmQoY3Vyc29yKVxuXG4jIFtUT0RPOiBJbXByb3ZlLCBhY2N1cmFjeV1cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRW5kT2ZXb3JkIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNXb3JkXG4gIEBleHRlbmQoKVxuICBpbmNsdXNpdmU6IHRydWVcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHRpbWVzID0gQGdldENvdW50KClcbiAgICB3b3JkUmFuZ2UgPSBjdXJzb3IuZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZSgpXG4gICAgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuXG4gICAgIyBpZiB3ZSdyZSBpbiB0aGUgbWlkZGxlIG9mIGEgd29yZCB0aGVuIHdlIG5lZWQgdG8gbW92ZSB0byBpdHMgc3RhcnRcbiAgICBpZiBjdXJzb3JQb3NpdGlvbi5pc0dyZWF0ZXJUaGFuKHdvcmRSYW5nZS5zdGFydCkgYW5kIGN1cnNvclBvc2l0aW9uLmlzTGVzc1RoYW4od29yZFJhbmdlLmVuZClcbiAgICAgIHRpbWVzICs9IDFcblxuICAgIGZvciBbMS4udGltZXNdXG4gICAgICBwb2ludCA9IGN1cnNvci5nZXRCZWdpbm5pbmdPZkN1cnJlbnRXb3JkQnVmZmVyUG9zaXRpb24oe0B3b3JkUmVnZXh9KVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gICAgQG1vdmVUb05leHRFbmRPZldvcmQoY3Vyc29yKVxuICAgIGlmIGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLmlzR3JlYXRlclRoYW5PckVxdWFsKGN1cnNvclBvc2l0aW9uKVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKFswLCAwXSlcblxuICBtb3ZlVG9OZXh0RW5kT2ZXb3JkOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gY3Vyc29yLmdldEVuZE9mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7QHdvcmRSZWdleH0pLnRyYW5zbGF0ZShbMCwgLTFdKVxuICAgIHBvaW50ID0gUG9pbnQubWluKHBvaW50LCBAZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oKSlcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiMgV2hvbGUgd29yZFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9OZXh0V2hvbGVXb3JkIGV4dGVuZHMgTW92ZVRvTmV4dFdvcmRcbiAgQGV4dGVuZCgpXG4gIHdvcmRSZWdleDogL15cXHMqJHxcXFMrL2dcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNXaG9sZVdvcmQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c1dvcmRcbiAgQGV4dGVuZCgpXG4gIHdvcmRSZWdleDogL15cXHMqJHxcXFMrL1xuXG5jbGFzcyBNb3ZlVG9FbmRPZldob2xlV29yZCBleHRlbmRzIE1vdmVUb0VuZE9mV29yZFxuICBAZXh0ZW5kKClcbiAgd29yZFJlZ2V4OiAvXFxTKy9cblxuIyBbVE9ETzogSW1wcm92ZSwgYWNjdXJhY3ldXG5jbGFzcyBNb3ZlVG9QcmV2aW91c0VuZE9mV2hvbGVXb3JkIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNFbmRPZldvcmRcbiAgQGV4dGVuZCgpXG4gIHdvcmRSZWdleDogL1xcUysvXG5cbiMgQWxwaGFudW1lcmljIHdvcmQgW0V4cGVyaW1lbnRhbF1cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgTW92ZVRvTmV4dEFscGhhbnVtZXJpY1dvcmQgZXh0ZW5kcyBNb3ZlVG9OZXh0V29yZFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gbmV4dCBhbHBoYW51bWVyaWMoYC9cXHcrL2ApIHdvcmRcIlxuICB3b3JkUmVnZXg6IC9cXHcrL2dcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNBbHBoYW51bWVyaWNXb3JkIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNXb3JkXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBhbHBoYW51bWVyaWMoYC9cXHcrL2ApIHdvcmRcIlxuICB3b3JkUmVnZXg6IC9cXHcrL1xuXG5jbGFzcyBNb3ZlVG9FbmRPZkFscGhhbnVtZXJpY1dvcmQgZXh0ZW5kcyBNb3ZlVG9FbmRPZldvcmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIGVuZCBvZiBhbHBoYW51bWVyaWMoYC9cXHcrL2ApIHdvcmRcIlxuICB3b3JkUmVnZXg6IC9cXHcrL1xuXG4jIEFscGhhbnVtZXJpYyB3b3JkIFtFeHBlcmltZW50YWxdXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb05leHRTbWFydFdvcmQgZXh0ZW5kcyBNb3ZlVG9OZXh0V29yZFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gbmV4dCBzbWFydCB3b3JkIChgL1tcXHctXSsvYCkgd29yZFwiXG4gIHdvcmRSZWdleDogL1tcXHctXSsvZ1xuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1NtYXJ0V29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzV29yZFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gcHJldmlvdXMgc21hcnQgd29yZCAoYC9bXFx3LV0rL2ApIHdvcmRcIlxuICB3b3JkUmVnZXg6IC9bXFx3LV0rL1xuXG5jbGFzcyBNb3ZlVG9FbmRPZlNtYXJ0V29yZCBleHRlbmRzIE1vdmVUb0VuZE9mV29yZFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gZW5kIG9mIHNtYXJ0IHdvcmQgKGAvW1xcdy1dKy9gKSB3b3JkXCJcbiAgd29yZFJlZ2V4OiAvW1xcdy1dKy9cblxuIyBTZW50ZW5jZVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFNlbnRlbmNlIGlzIGRlZmluZWQgYXMgYmVsb3dcbiMgIC0gZW5kIHdpdGggWycuJywgJyEnLCAnPyddXG4jICAtIG9wdGlvbmFsbHkgZm9sbG93ZWQgYnkgWycpJywgJ10nLCAnXCInLCBcIidcIl1cbiMgIC0gZm9sbG93ZWQgYnkgWyckJywgJyAnLCAnXFx0J11cbiMgIC0gcGFyYWdyYXBoIGJvdW5kYXJ5IGlzIGFsc28gc2VudGVuY2UgYm91bmRhcnlcbiMgIC0gc2VjdGlvbiBib3VuZGFyeSBpcyBhbHNvIHNlbnRlbmNlIGJvdW5kYXJ5KGlnbm9yZSlcbmNsYXNzIE1vdmVUb05leHRTZW50ZW5jZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAganVtcDogdHJ1ZVxuICBzZW50ZW5jZVJlZ2V4OiAvLy8oPzpbXFwuIVxcP11bXFwpXFxdXCInXSpcXHMrKXwoXFxufFxcclxcbikvLy9nXG4gIGRpcmVjdGlvbjogJ25leHQnXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBwb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgQGNvdW50VGltZXMgPT5cbiAgICAgIHBvaW50ID0gQGdldFBvaW50KHBvaW50KVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuICBnZXRQb2ludDogKGZyb21Qb2ludCkgLT5cbiAgICBpZiBAZGlyZWN0aW9uIGlzICduZXh0J1xuICAgICAgQGdldE5leHRTdGFydE9mU2VudGVuY2UoZnJvbVBvaW50KVxuICAgIGVsc2UgaWYgQGRpcmVjdGlvbiBpcyAncHJldmlvdXMnXG4gICAgICBAZ2V0UHJldmlvdXNTdGFydE9mU2VudGVuY2UoZnJvbVBvaW50KVxuXG4gIGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JSb3c6IChyb3cpIC0+XG4gICAgbmV3IFBvaW50KHJvdywgZ2V0Rmlyc3RDaGFyYWN0ZXJDb2x1bUZvckJ1ZmZlclJvdyhAZWRpdG9yLCByb3cpKVxuXG4gIGlzQmxhbmtSb3c6IChyb3cpIC0+XG4gICAgQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdylcblxuICBnZXROZXh0U3RhcnRPZlNlbnRlbmNlOiAoZnJvbVBvaW50KSAtPlxuICAgIHNjYW5SYW5nZSA9IG5ldyBSYW5nZShmcm9tUG9pbnQsIEBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbigpKVxuICAgIGZvdW5kUG9pbnQgPSBudWxsXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSBAc2VudGVuY2VSZWdleCwgc2NhblJhbmdlLCAoe3JhbmdlLCBtYXRjaFRleHQsIG1hdGNoLCBzdG9wfSkgPT5cbiAgICAgIGlmIG1hdGNoWzFdP1xuICAgICAgICB7c3RhcnQ6IHtyb3c6IHN0YXJ0Um93fSwgZW5kOiB7cm93OiBlbmRSb3d9fSA9IHJhbmdlXG4gICAgICAgIHJldHVybiBpZiBAc2tpcEJsYW5rUm93IGFuZCBAaXNCbGFua1JvdyhlbmRSb3cpXG4gICAgICAgIGlmIEBpc0JsYW5rUm93KHN0YXJ0Um93KSBpc250IEBpc0JsYW5rUm93KGVuZFJvdylcbiAgICAgICAgICBmb3VuZFBvaW50ID0gQGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JSb3coZW5kUm93KVxuICAgICAgZWxzZVxuICAgICAgICBmb3VuZFBvaW50ID0gcmFuZ2UuZW5kXG4gICAgICBzdG9wKCkgaWYgZm91bmRQb2ludD9cbiAgICBmb3VuZFBvaW50ID8gc2NhblJhbmdlLmVuZFxuXG4gIGdldFByZXZpb3VzU3RhcnRPZlNlbnRlbmNlOiAoZnJvbVBvaW50KSAtPlxuICAgIHNjYW5SYW5nZSA9IG5ldyBSYW5nZShmcm9tUG9pbnQsIFswLCAwXSlcbiAgICBmb3VuZFBvaW50ID0gbnVsbFxuICAgIEBlZGl0b3IuYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UgQHNlbnRlbmNlUmVnZXgsIHNjYW5SYW5nZSwgKHtyYW5nZSwgbWF0Y2gsIHN0b3AsIG1hdGNoVGV4dH0pID0+XG4gICAgICBpZiBtYXRjaFsxXT9cbiAgICAgICAge3N0YXJ0OiB7cm93OiBzdGFydFJvd30sIGVuZDoge3JvdzogZW5kUm93fX0gPSByYW5nZVxuICAgICAgICBpZiBub3QgQGlzQmxhbmtSb3coZW5kUm93KSBhbmQgQGlzQmxhbmtSb3coc3RhcnRSb3cpXG4gICAgICAgICAgcG9pbnQgPSBAZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvclJvdyhlbmRSb3cpXG4gICAgICAgICAgaWYgcG9pbnQuaXNMZXNzVGhhbihmcm9tUG9pbnQpXG4gICAgICAgICAgICBmb3VuZFBvaW50ID0gcG9pbnRcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm4gaWYgQHNraXBCbGFua1Jvd1xuICAgICAgICAgICAgZm91bmRQb2ludCA9IEBnZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yUm93KHN0YXJ0Um93KVxuICAgICAgZWxzZVxuICAgICAgICBpZiByYW5nZS5lbmQuaXNMZXNzVGhhbihmcm9tUG9pbnQpXG4gICAgICAgICAgZm91bmRQb2ludCA9IHJhbmdlLmVuZFxuICAgICAgc3RvcCgpIGlmIGZvdW5kUG9pbnQ/XG4gICAgZm91bmRQb2ludCA/IHNjYW5SYW5nZS5zdGFydFxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1NlbnRlbmNlIGV4dGVuZHMgTW92ZVRvTmV4dFNlbnRlbmNlXG4gIEBleHRlbmQoKVxuICBkaXJlY3Rpb246ICdwcmV2aW91cydcblxuY2xhc3MgTW92ZVRvTmV4dFNlbnRlbmNlU2tpcEJsYW5rUm93IGV4dGVuZHMgTW92ZVRvTmV4dFNlbnRlbmNlXG4gIEBleHRlbmQoKVxuICBza2lwQmxhbmtSb3c6IHRydWVcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNTZW50ZW5jZVNraXBCbGFua1JvdyBleHRlbmRzIE1vdmVUb1ByZXZpb3VzU2VudGVuY2VcbiAgQGV4dGVuZCgpXG4gIHNraXBCbGFua1JvdzogdHJ1ZVxuXG4jIFBhcmFncmFwaFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9OZXh0UGFyYWdyYXBoIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBqdW1wOiB0cnVlXG4gIGRpcmVjdGlvbjogJ25leHQnXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBwb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgQGNvdW50VGltZXMgPT5cbiAgICAgIHBvaW50ID0gQGdldFBvaW50KHBvaW50KVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuICBnZXRQb2ludDogKGZyb21Qb2ludCkgLT5cbiAgICBzdGFydFJvdyA9IGZyb21Qb2ludC5yb3dcbiAgICB3YXNBdE5vbkJsYW5rUm93ID0gbm90IEBlZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhzdGFydFJvdylcbiAgICBmb3Igcm93IGluIGdldEJ1ZmZlclJvd3MoQGVkaXRvciwge3N0YXJ0Um93LCBAZGlyZWN0aW9ufSlcbiAgICAgIGlmIEBlZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQocm93LCAwKSBpZiB3YXNBdE5vbkJsYW5rUm93XG4gICAgICBlbHNlXG4gICAgICAgIHdhc0F0Tm9uQmxhbmtSb3cgPSB0cnVlXG5cbiAgICAjIGZhbGxiYWNrXG4gICAgc3dpdGNoIEBkaXJlY3Rpb25cbiAgICAgIHdoZW4gJ3ByZXZpb3VzJyB0aGVuIG5ldyBQb2ludCgwLCAwKVxuICAgICAgd2hlbiAnbmV4dCcgdGhlbiBAZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oKVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1BhcmFncmFwaCBleHRlbmRzIE1vdmVUb05leHRQYXJhZ3JhcGhcbiAgQGV4dGVuZCgpXG4gIGRpcmVjdGlvbjogJ3ByZXZpb3VzJ1xuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb0JlZ2lubmluZ09mTGluZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcblxuICBnZXRQb2ludDogKHtyb3d9KSAtPlxuICAgIG5ldyBQb2ludChyb3csIDApXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBwb2ludCA9IEBnZXRQb2ludChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbmNsYXNzIE1vdmVUb0NvbHVtbiBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgZ2V0Q291bnQ6IC0+XG4gICAgc3VwZXIgLSAxXG5cbiAgZ2V0UG9pbnQ6ICh7cm93fSkgLT5cbiAgICBuZXcgUG9pbnQocm93LCBAZ2V0Q291bnQoKSlcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gQGdldFBvaW50KGN1cnNvci5nZXRTY3JlZW5Qb3NpdGlvbigpKVxuICAgIGN1cnNvci5zZXRTY3JlZW5Qb3NpdGlvbihwb2ludClcblxuY2xhc3MgTW92ZVRvTGFzdENoYXJhY3Rlck9mTGluZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcblxuICBnZXRDb3VudDogLT5cbiAgICBzdXBlciAtIDFcblxuICBnZXRQb2ludDogKHtyb3d9KSAtPlxuICAgIHJvdyA9IGdldFZhbGlkVmltQnVmZmVyUm93KEBlZGl0b3IsIHJvdyArIEBnZXRDb3VudCgpKVxuICAgIG5ldyBQb2ludChyb3csIEluZmluaXR5KVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgcG9pbnQgPSBAZ2V0UG9pbnQoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgIGN1cnNvci5nb2FsQ29sdW1uID0gSW5maW5pdHlcblxuY2xhc3MgTW92ZVRvTGFzdE5vbmJsYW5rQ2hhcmFjdGVyT2ZMaW5lQW5kRG93biBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgaW5jbHVzaXZlOiB0cnVlXG5cbiAgZ2V0Q291bnQ6IC0+XG4gICAgc3VwZXIgLSAxXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBwb2ludCA9IEBnZXRQb2ludChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgZ2V0UG9pbnQ6ICh7cm93fSkgLT5cbiAgICByb3cgPSBNYXRoLm1pbihyb3cgKyBAZ2V0Q291bnQoKSwgQGdldFZpbUxhc3RCdWZmZXJSb3coKSlcbiAgICBmcm9tID0gbmV3IFBvaW50KHJvdywgSW5maW5pdHkpXG4gICAgcG9pbnQgPSBnZXRTdGFydFBvc2l0aW9uRm9yUGF0dGVybihAZWRpdG9yLCBmcm9tLCAvXFxzKiQvKVxuICAgIChwb2ludCA/IGZyb20pLnRyYW5zbGF0ZShbMCwgLTFdKVxuXG4jIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lIGZhaW1pbHlcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAc2V0QnVmZmVyUG9zaXRpb25TYWZlbHkoY3Vyc29yLCBAZ2V0UG9pbnQoY3Vyc29yKSlcblxuICBnZXRQb2ludDogKGN1cnNvcikgLT5cbiAgICBnZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yQnVmZmVyUm93KEBlZGl0b3IsIGN1cnNvci5nZXRCdWZmZXJSb3coKSlcblxuY2xhc3MgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVVcCBleHRlbmRzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQGNvdW50VGltZXMgLT5cbiAgICAgIG1vdmVDdXJzb3JVcEJ1ZmZlcihjdXJzb3IpXG4gICAgc3VwZXJcblxuY2xhc3MgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVEb3duIGV4dGVuZHMgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVcbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAY291bnRUaW1lcyAtPlxuICAgICAgbW92ZUN1cnNvckRvd25CdWZmZXIoY3Vyc29yKVxuICAgIHN1cGVyXG5cbmNsYXNzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lQW5kRG93biBleHRlbmRzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lRG93blxuICBAZXh0ZW5kKClcbiAgZGVmYXVsdENvdW50OiAwXG4gIGdldENvdW50OiAtPiBzdXBlciAtIDFcblxuY2xhc3MgTW92ZVRvRmlyc3RMaW5lIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIGp1bXA6IHRydWVcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihAZ2V0UG9pbnQoKSlcbiAgICBjdXJzb3IuYXV0b3Njcm9sbChjZW50ZXI6IHRydWUpXG5cbiAgZ2V0UG9pbnQ6IC0+XG4gICAgcm93ID0gZ2V0VmFsaWRWaW1CdWZmZXJSb3coQGVkaXRvciwgQGdldFJvdygpKVxuICAgIGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3coQGVkaXRvciwgcm93KVxuXG4gIGdldFJvdzogLT5cbiAgICBAZ2V0Q291bnQoKSAtIDFcblxuIyBrZXltYXA6IEdcbmNsYXNzIE1vdmVUb0xhc3RMaW5lIGV4dGVuZHMgTW92ZVRvRmlyc3RMaW5lXG4gIEBleHRlbmQoKVxuICBkZWZhdWx0Q291bnQ6IEluZmluaXR5XG5cbiMga2V5bWFwOiBOJSBlLmcuIDEwJVxuY2xhc3MgTW92ZVRvTGluZUJ5UGVyY2VudCBleHRlbmRzIE1vdmVUb0ZpcnN0TGluZVxuICBAZXh0ZW5kKClcblxuICBnZXRSb3c6IC0+XG4gICAgcGVyY2VudCA9IE1hdGgubWluKDEwMCwgQGdldENvdW50KCkpXG4gICAgTWF0aC5mbG9vcihAZ2V0VmltTGFzdFNjcmVlblJvdygpICogKHBlcmNlbnQgLyAxMDApKVxuXG5jbGFzcyBNb3ZlVG9SZWxhdGl2ZUxpbmUgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZChmYWxzZSlcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgcG9pbnQgPSBAZ2V0UG9pbnQoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gIGdldENvdW50OiAtPlxuICAgIHN1cGVyIC0gMVxuXG4gIGdldFBvaW50OiAoe3Jvd30pIC0+XG4gICAgW3JvdyArIEBnZXRDb3VudCgpLCAwXVxuXG5jbGFzcyBNb3ZlVG9SZWxhdGl2ZUxpbmVXaXRoTWluaW11bSBleHRlbmRzIE1vdmVUb1JlbGF0aXZlTGluZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBtaW46IDBcblxuICBnZXRDb3VudDogLT5cbiAgICBNYXRoLm1heChAbWluLCBzdXBlcilcblxuIyBQb3NpdGlvbiBjdXJzb3Igd2l0aG91dCBzY3JvbGxpbmcuLCBILCBNLCBMXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMga2V5bWFwOiBIXG5jbGFzcyBNb3ZlVG9Ub3BPZlNjcmVlbiBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICBqdW1wOiB0cnVlXG4gIHNjcm9sbG9mZjogMlxuICBkZWZhdWx0Q291bnQ6IDBcblxuICBnZXRDb3VudDogLT5cbiAgICBzdXBlciAtIDFcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihAZ2V0UG9pbnQoKSlcblxuICBnZXRQb2ludDogLT5cbiAgICBnZXRGaXJzdENoYXJhY3RlckJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUm93KEBlZGl0b3IsIEBnZXRSb3coKSlcblxuICBnZXRTY3JvbGxvZmY6IC0+XG4gICAgaWYgQGlzQXNPcGVyYXRvclRhcmdldCgpXG4gICAgICAwXG4gICAgZWxzZVxuICAgICAgQHNjcm9sbG9mZlxuXG4gIGdldFJvdzogLT5cbiAgICByb3cgPSBnZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coQGVkaXRvcilcbiAgICBvZmZzZXQgPSBAZ2V0U2Nyb2xsb2ZmKClcbiAgICBvZmZzZXQgPSAwIGlmIChyb3cgaXMgMClcbiAgICBvZmZzZXQgPSBNYXRoLm1heChAZ2V0Q291bnQoKSwgb2Zmc2V0KVxuICAgIHJvdyArIG9mZnNldFxuXG4jIGtleW1hcDogTVxuY2xhc3MgTW92ZVRvTWlkZGxlT2ZTY3JlZW4gZXh0ZW5kcyBNb3ZlVG9Ub3BPZlNjcmVlblxuICBAZXh0ZW5kKClcbiAgZ2V0Um93OiAtPlxuICAgIHN0YXJ0Um93ID0gZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KEBlZGl0b3IpXG4gICAgdmltTGFzdFNjcmVlblJvdyA9IEBnZXRWaW1MYXN0U2NyZWVuUm93KClcbiAgICBlbmRSb3cgPSBNYXRoLm1pbihAZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCksIHZpbUxhc3RTY3JlZW5Sb3cpXG4gICAgc3RhcnRSb3cgKyBNYXRoLmZsb29yKChlbmRSb3cgLSBzdGFydFJvdykgLyAyKVxuXG4jIGtleW1hcDogTFxuY2xhc3MgTW92ZVRvQm90dG9tT2ZTY3JlZW4gZXh0ZW5kcyBNb3ZlVG9Ub3BPZlNjcmVlblxuICBAZXh0ZW5kKClcbiAgZ2V0Um93OiAtPlxuICAgICMgW0ZJWE1FXVxuICAgICMgQXQgbGVhc3QgQXRvbSB2MS42LjAsIHRoZXJlIGFyZSB0d28gaW1wbGVtZW50YXRpb24gb2YgZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgICMgZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCkgYW5kIGVkaXRvckVsZW1lbnQuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgICMgVGhvc2UgdHdvIG1ldGhvZHMgcmV0dXJuIGRpZmZlcmVudCB2YWx1ZSwgZWRpdG9yJ3Mgb25lIGlzIGNvcnJlbnQuXG4gICAgIyBTbyBJIGludGVudGlvbmFsbHkgdXNlIGVkaXRvci5nZXRMYXN0U2NyZWVuUm93IGhlcmUuXG4gICAgdmltTGFzdFNjcmVlblJvdyA9IEBnZXRWaW1MYXN0U2NyZWVuUm93KClcbiAgICByb3cgPSBNYXRoLm1pbihAZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCksIHZpbUxhc3RTY3JlZW5Sb3cpXG4gICAgb2Zmc2V0ID0gQGdldFNjcm9sbG9mZigpICsgMVxuICAgIG9mZnNldCA9IDAgaWYgcm93IGlzIHZpbUxhc3RTY3JlZW5Sb3dcbiAgICBvZmZzZXQgPSBNYXRoLm1heChAZ2V0Q291bnQoKSwgb2Zmc2V0KVxuICAgIHJvdyAtIG9mZnNldFxuXG4jIFNjcm9sbGluZ1xuIyBIYWxmOiBjdHJsLWQsIGN0cmwtdVxuIyBGdWxsOiBjdHJsLWYsIGN0cmwtYlxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFtGSVhNRV0gY291bnQgYmVoYXZlIGRpZmZlcmVudGx5IGZyb20gb3JpZ2luYWwgVmltLlxuY2xhc3MgU2Nyb2xsRnVsbFNjcmVlbkRvd24gZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIGFtb3VudE9mUGFnZTogKzFcblxuICBpc1Ntb290aFNjcm9sbEVuYWJsZWQ6IC0+XG4gICAgaWYgTWF0aC5hYnMoQGFtb3VudE9mUGFnZSkgaXMgMVxuICAgICAgc2V0dGluZ3MuZ2V0KCdzbW9vdGhTY3JvbGxPbkZ1bGxTY3JvbGxNb3Rpb24nKVxuICAgIGVsc2VcbiAgICAgIHNldHRpbmdzLmdldCgnc21vb3RoU2Nyb2xsT25IYWxmU2Nyb2xsTW90aW9uJylcblxuICBnZXRTbW9vdGhTY3JvbGxEdWF0aW9uOiAtPlxuICAgIGlmIE1hdGguYWJzKEBhbW91bnRPZlBhZ2UpIGlzIDFcbiAgICAgIHNldHRpbmdzLmdldCgnc21vb3RoU2Nyb2xsT25GdWxsU2Nyb2xsTW90aW9uRHVyYXRpb24nKVxuICAgIGVsc2VcbiAgICAgIHNldHRpbmdzLmdldCgnc21vb3RoU2Nyb2xsT25IYWxmU2Nyb2xsTW90aW9uRHVyYXRpb24nKVxuXG4gIGdldFBpeGVsUmVjdFRvcEZvclNjZWVuUm93OiAocm93KSAtPlxuICAgIHBvaW50ID0gbmV3IFBvaW50KHJvdywgMClcbiAgICBAZWRpdG9yLmVsZW1lbnQucGl4ZWxSZWN0Rm9yU2NyZWVuUmFuZ2UobmV3IFJhbmdlKHBvaW50LCBwb2ludCkpLnRvcFxuXG4gIHNtb290aFNjcm9sbDogKGZyb21Sb3csIHRvUm93LCBvcHRpb25zPXt9KSAtPlxuICAgIHRvcFBpeGVsRnJvbSA9IHt0b3A6IEBnZXRQaXhlbFJlY3RUb3BGb3JTY2VlblJvdyhmcm9tUm93KX1cbiAgICB0b3BQaXhlbFRvID0ge3RvcDogQGdldFBpeGVsUmVjdFRvcEZvclNjZWVuUm93KHRvUm93KX1cbiAgICBvcHRpb25zLnN0ZXAgPSAobmV3VG9wKSA9PiBAZWRpdG9yLmVsZW1lbnQuc2V0U2Nyb2xsVG9wKG5ld1RvcClcbiAgICBvcHRpb25zLmR1cmF0aW9uID0gQGdldFNtb290aFNjcm9sbER1YXRpb24oKVxuICAgIEB2aW1TdGF0ZS5yZXF1ZXN0U2Nyb2xsQW5pbWF0aW9uKHRvcFBpeGVsRnJvbSwgdG9wUGl4ZWxUbywgb3B0aW9ucylcblxuICBnZXRBbW91bnRPZlJvd3M6IC0+XG4gICAgTWF0aC5jZWlsKEBhbW91bnRPZlBhZ2UgKiBAZWRpdG9yLmdldFJvd3NQZXJQYWdlKCkgKiBAZ2V0Q291bnQoKSlcblxuICBnZXRQb2ludDogKGN1cnNvcikgLT5cbiAgICByb3cgPSBnZXRWYWxpZFZpbVNjcmVlblJvdyhAZWRpdG9yLCBjdXJzb3IuZ2V0U2NyZWVuUm93KCkgKyBAZ2V0QW1vdW50T2ZSb3dzKCkpXG4gICAgZ2V0Rmlyc3RDaGFyYWN0ZXJTY3JlZW5Qb3NpdGlvbkZvclNjcmVlblJvdyhAZWRpdG9yLCByb3cpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBjdXJzb3Iuc2V0U2NyZWVuUG9zaXRpb24oQGdldFBvaW50KGN1cnNvciksIGF1dG9zY3JvbGw6IGZhbHNlKVxuXG4gICAgaWYgY3Vyc29yLmlzTGFzdEN1cnNvcigpXG4gICAgICBpZiBAaXNTbW9vdGhTY3JvbGxFbmFibGVkKClcbiAgICAgICAgQHZpbVN0YXRlLmZpbmlzaFNjcm9sbEFuaW1hdGlvbigpXG5cbiAgICAgIGN1cnJlbnRUb3BSb3cgPSBAZWRpdG9yLmdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpXG4gICAgICBmaW5hbFRvcFJvdyA9IGN1cnJlbnRUb3BSb3cgKyBAZ2V0QW1vdW50T2ZSb3dzKClcbiAgICAgIGRvbmUgPSA9PiBAZWRpdG9yLnNldEZpcnN0VmlzaWJsZVNjcmVlblJvdyhmaW5hbFRvcFJvdylcblxuICAgICAgaWYgQGlzU21vb3RoU2Nyb2xsRW5hYmxlZCgpXG4gICAgICAgIEBzbW9vdGhTY3JvbGwoY3VycmVudFRvcFJvdywgZmluYWxUb3BSb3csIHtkb25lfSlcbiAgICAgIGVsc2VcbiAgICAgICAgZG9uZSgpXG5cbiMga2V5bWFwOiBjdHJsLWJcbmNsYXNzIFNjcm9sbEZ1bGxTY3JlZW5VcCBleHRlbmRzIFNjcm9sbEZ1bGxTY3JlZW5Eb3duXG4gIEBleHRlbmQoKVxuICBhbW91bnRPZlBhZ2U6IC0xXG5cbiMga2V5bWFwOiBjdHJsLWRcbmNsYXNzIFNjcm9sbEhhbGZTY3JlZW5Eb3duIGV4dGVuZHMgU2Nyb2xsRnVsbFNjcmVlbkRvd25cbiAgQGV4dGVuZCgpXG4gIGFtb3VudE9mUGFnZTogKzEgLyAyXG5cbiMga2V5bWFwOiBjdHJsLXVcbmNsYXNzIFNjcm9sbEhhbGZTY3JlZW5VcCBleHRlbmRzIFNjcm9sbEhhbGZTY3JlZW5Eb3duXG4gIEBleHRlbmQoKVxuICBhbW91bnRPZlBhZ2U6IC0xIC8gMlxuXG4jIEZpbmRcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBrZXltYXA6IGZcbmNsYXNzIEZpbmQgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIGJhY2t3YXJkczogZmFsc2VcbiAgaW5jbHVzaXZlOiB0cnVlXG4gIGhvdmVyOiBpY29uOiAnOmZpbmQ6JywgZW1vamk6ICc6bWFnX3JpZ2h0OidcbiAgb2Zmc2V0OiAwXG4gIHJlcXVpcmVJbnB1dDogdHJ1ZVxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcbiAgICBAZm9jdXNJbnB1dCgpIHVubGVzcyBAaXNDb21wbGV0ZSgpXG5cbiAgaXNCYWNrd2FyZHM6IC0+XG4gICAgQGJhY2t3YXJkc1xuXG4gIGdldFBvaW50OiAoZnJvbVBvaW50KSAtPlxuICAgIHtzdGFydCwgZW5kfSA9IEBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3coZnJvbVBvaW50LnJvdylcblxuICAgIG9mZnNldCA9IGlmIEBpc0JhY2t3YXJkcygpIHRoZW4gQG9mZnNldCBlbHNlIC1Ab2Zmc2V0XG4gICAgdW5PZmZzZXQgPSAtb2Zmc2V0ICogQGlzUmVwZWF0ZWQoKVxuICAgIGlmIEBpc0JhY2t3YXJkcygpXG4gICAgICBzY2FuUmFuZ2UgPSBbc3RhcnQsIGZyb21Qb2ludC50cmFuc2xhdGUoWzAsIHVuT2Zmc2V0XSldXG4gICAgICBtZXRob2QgPSAnYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UnXG4gICAgZWxzZVxuICAgICAgc2NhblJhbmdlID0gW2Zyb21Qb2ludC50cmFuc2xhdGUoWzAsIDEgKyB1bk9mZnNldF0pLCBlbmRdXG4gICAgICBtZXRob2QgPSAnc2NhbkluQnVmZmVyUmFuZ2UnXG5cbiAgICBwb2ludHMgPSBbXVxuICAgIEBlZGl0b3JbbWV0aG9kXSAvLy8je18uZXNjYXBlUmVnRXhwKEBpbnB1dCl9Ly8vZywgc2NhblJhbmdlLCAoe3JhbmdlfSkgLT5cbiAgICAgIHBvaW50cy5wdXNoKHJhbmdlLnN0YXJ0KVxuICAgIHBvaW50c1tAZ2V0Q291bnQoKV0/LnRyYW5zbGF0ZShbMCwgb2Zmc2V0XSlcblxuICBnZXRDb3VudDogLT5cbiAgICBzdXBlciAtIDFcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gQGdldFBvaW50KGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgIEBzZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIHBvaW50KVxuICAgIEBnbG9iYWxTdGF0ZS5zZXQoJ2N1cnJlbnRGaW5kJywgdGhpcykgdW5sZXNzIEBpc1JlcGVhdGVkKClcblxuIyBrZXltYXA6IEZcbmNsYXNzIEZpbmRCYWNrd2FyZHMgZXh0ZW5kcyBGaW5kXG4gIEBleHRlbmQoKVxuICBpbmNsdXNpdmU6IGZhbHNlXG4gIGJhY2t3YXJkczogdHJ1ZVxuICBob3ZlcjogaWNvbjogJzpmaW5kOicsIGVtb2ppOiAnOm1hZzonXG5cbiMga2V5bWFwOiB0XG5jbGFzcyBUaWxsIGV4dGVuZHMgRmluZFxuICBAZXh0ZW5kKClcbiAgb2Zmc2V0OiAxXG5cbiAgZ2V0UG9pbnQ6IC0+XG4gICAgQHBvaW50ID0gc3VwZXJcblxuICBzZWxlY3RCeU1vdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBzdXBlclxuICAgIGlmIHNlbGVjdGlvbi5pc0VtcHR5KCkgYW5kIChAcG9pbnQ/IGFuZCBub3QgQGJhY2t3YXJkcylcbiAgICAgIHN3cmFwKHNlbGVjdGlvbikudHJhbnNsYXRlU2VsZWN0aW9uRW5kQW5kQ2xpcCgnZm9yd2FyZCcpXG5cbiMga2V5bWFwOiBUXG5jbGFzcyBUaWxsQmFja3dhcmRzIGV4dGVuZHMgVGlsbFxuICBAZXh0ZW5kKClcbiAgaW5jbHVzaXZlOiBmYWxzZVxuICBiYWNrd2FyZHM6IHRydWVcblxuIyBNYXJrXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMga2V5bWFwOiBgXG5jbGFzcyBNb3ZlVG9NYXJrIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBqdW1wOiB0cnVlXG4gIHJlcXVpcmVJbnB1dDogdHJ1ZVxuICBob3ZlcjogaWNvbjogXCI6bW92ZS10by1tYXJrOmBcIiwgZW1vamk6IFwiOnJvdW5kX3B1c2hwaW46YFwiXG4gIGlucHV0OiBudWxsICMgc2V0IHdoZW4gaW5zdGF0bnRpYXRlZCB2aWEgdmltU3RhdGU6Om1vdmVUb01hcmsoKVxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcbiAgICBAZm9jdXNJbnB1dCgpIHVubGVzcyBAaXNDb21wbGV0ZSgpXG5cbiAgZ2V0UG9pbnQ6IC0+XG4gICAgQHZpbVN0YXRlLm1hcmsuZ2V0KEBnZXRJbnB1dCgpKVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgaWYgcG9pbnQgPSBAZ2V0UG9pbnQoKVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgICAgY3Vyc29yLmF1dG9zY3JvbGwoY2VudGVyOiB0cnVlKVxuXG4jIGtleW1hcDogJ1xuY2xhc3MgTW92ZVRvTWFya0xpbmUgZXh0ZW5kcyBNb3ZlVG9NYXJrXG4gIEBleHRlbmQoKVxuICBob3ZlcjogaWNvbjogXCI6bW92ZS10by1tYXJrOidcIiwgZW1vamk6IFwiOnJvdW5kX3B1c2hwaW46J1wiXG4gIHdpc2U6ICdsaW5ld2lzZSdcblxuICBnZXRQb2ludDogLT5cbiAgICBpZiBwb2ludCA9IHN1cGVyXG4gICAgICBnZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yQnVmZmVyUm93KEBlZGl0b3IsIHBvaW50LnJvdylcblxuIyBGb2xkXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0IGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBmb2xkIHN0YXJ0XCJcbiAgd2lzZTogJ2NoYXJhY3Rlcndpc2UnXG4gIHdoaWNoOiAnc3RhcnQnXG4gIGRpcmVjdGlvbjogJ3ByZXYnXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIEByb3dzID0gQGdldEZvbGRSb3dzKEB3aGljaClcbiAgICBAcm93cy5yZXZlcnNlKCkgaWYgQGRpcmVjdGlvbiBpcyAncHJldidcblxuICBnZXRGb2xkUm93czogKHdoaWNoKSAtPlxuICAgIGluZGV4ID0gaWYgd2hpY2ggaXMgJ3N0YXJ0JyB0aGVuIDAgZWxzZSAxXG4gICAgcm93cyA9IGdldENvZGVGb2xkUm93UmFuZ2VzKEBlZGl0b3IpLm1hcCAocm93UmFuZ2UpIC0+XG4gICAgICByb3dSYW5nZVtpbmRleF1cbiAgICBfLnNvcnRCeShfLnVuaXEocm93cyksIChyb3cpIC0+IHJvdylcblxuICBnZXRTY2FuUm93czogKGN1cnNvcikgLT5cbiAgICBjdXJzb3JSb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KClcbiAgICBpc1ZhbGlkUm93ID0gc3dpdGNoIEBkaXJlY3Rpb25cbiAgICAgIHdoZW4gJ3ByZXYnIHRoZW4gKHJvdykgLT4gcm93IDwgY3Vyc29yUm93XG4gICAgICB3aGVuICduZXh0JyB0aGVuIChyb3cpIC0+IHJvdyA+IGN1cnNvclJvd1xuICAgIEByb3dzLmZpbHRlcihpc1ZhbGlkUm93KVxuXG4gIGRldGVjdFJvdzogKGN1cnNvcikgLT5cbiAgICBAZ2V0U2NhblJvd3MoY3Vyc29yKVswXVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQGNvdW50VGltZXMgPT5cbiAgICAgIGlmIChyb3cgPSBAZGV0ZWN0Um93KGN1cnNvcikpP1xuICAgICAgICBtb3ZlQ3Vyc29yVG9GaXJzdENoYXJhY3RlckF0Um93KGN1cnNvciwgcm93KVxuXG5jbGFzcyBNb3ZlVG9OZXh0Rm9sZFN0YXJ0IGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgZm9sZCBzdGFydFwiXG4gIGRpcmVjdGlvbjogJ25leHQnXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0V2l0aFNhbWVJbmRlbnQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c0ZvbGRTdGFydFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gcHJldmlvdXMgc2FtZS1pbmRlbnRlZCBmb2xkIHN0YXJ0XCJcbiAgZGV0ZWN0Um93OiAoY3Vyc29yKSAtPlxuICAgIGJhc2VJbmRlbnRMZXZlbCA9IGdldEluZGVudExldmVsRm9yQnVmZmVyUm93KEBlZGl0b3IsIGN1cnNvci5nZXRCdWZmZXJSb3coKSlcbiAgICBmb3Igcm93IGluIEBnZXRTY2FuUm93cyhjdXJzb3IpXG4gICAgICBpZiBnZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvdyhAZWRpdG9yLCByb3cpIGlzIGJhc2VJbmRlbnRMZXZlbFxuICAgICAgICByZXR1cm4gcm93XG4gICAgbnVsbFxuXG5jbGFzcyBNb3ZlVG9OZXh0Rm9sZFN0YXJ0V2l0aFNhbWVJbmRlbnQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c0ZvbGRTdGFydFdpdGhTYW1lSW5kZW50XG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBuZXh0IHNhbWUtaW5kZW50ZWQgZm9sZCBzdGFydFwiXG4gIGRpcmVjdGlvbjogJ25leHQnXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRm9sZEVuZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0XG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBmb2xkIGVuZFwiXG4gIHdoaWNoOiAnZW5kJ1xuXG5jbGFzcyBNb3ZlVG9OZXh0Rm9sZEVuZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRm9sZEVuZFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gbmV4dCBmb2xkIGVuZFwiXG4gIGRpcmVjdGlvbjogJ25leHQnXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgTW92ZVRvUHJldmlvdXNGdW5jdGlvbiBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0XG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBmdW5jdGlvblwiXG4gIGRpcmVjdGlvbjogJ3ByZXYnXG4gIGRldGVjdFJvdzogKGN1cnNvcikgLT5cbiAgICBfLmRldGVjdCBAZ2V0U2NhblJvd3MoY3Vyc29yKSwgKHJvdykgPT5cbiAgICAgIGlzSW5jbHVkZUZ1bmN0aW9uU2NvcGVGb3JSb3coQGVkaXRvciwgcm93KVxuXG5jbGFzcyBNb3ZlVG9OZXh0RnVuY3Rpb24gZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c0Z1bmN0aW9uXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBuZXh0IGZ1bmN0aW9uXCJcbiAgZGlyZWN0aW9uOiAnbmV4dCdcblxuIyBTY29wZSBiYXNlZFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9Qb3NpdGlvbkJ5U2NvcGUgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZChmYWxzZSlcbiAgZGlyZWN0aW9uOiAnYmFja3dhcmQnXG4gIHNjb3BlOiAnLidcblxuICBnZXRQb2ludDogKGZyb21Qb2ludCkgLT5cbiAgICBkZXRlY3RTY29wZVN0YXJ0UG9zaXRpb25Gb3JTY29wZShAZWRpdG9yLCBmcm9tUG9pbnQsIEBkaXJlY3Rpb24sIEBzY29wZSlcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBAY291bnRUaW1lcyAoe3N0b3B9KSA9PlxuICAgICAgaWYgKG5ld1BvaW50ID0gQGdldFBvaW50KHBvaW50KSlcbiAgICAgICAgcG9pbnQgPSBuZXdQb2ludFxuICAgICAgZWxzZVxuICAgICAgICBzdG9wKClcbiAgICBAc2V0QnVmZmVyUG9zaXRpb25TYWZlbHkoY3Vyc29yLCBwb2ludClcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNTdHJpbmcgZXh0ZW5kcyBNb3ZlVG9Qb3NpdGlvbkJ5U2NvcGVcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIHN0cmluZyhzZWFyY2hlZCBieSBgc3RyaW5nLmJlZ2luYCBzY29wZSlcIlxuICBkaXJlY3Rpb246ICdiYWNrd2FyZCdcbiAgc2NvcGU6ICdzdHJpbmcuYmVnaW4nXG5cbmNsYXNzIE1vdmVUb05leHRTdHJpbmcgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c1N0cmluZ1xuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gbmV4dCBzdHJpbmcoc2VhcmNoZWQgYnkgYHN0cmluZy5iZWdpbmAgc2NvcGUpXCJcbiAgZGlyZWN0aW9uOiAnZm9yd2FyZCdcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNOdW1iZXIgZXh0ZW5kcyBNb3ZlVG9Qb3NpdGlvbkJ5U2NvcGVcbiAgQGV4dGVuZCgpXG4gIGRpcmVjdGlvbjogJ2JhY2t3YXJkJ1xuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBudW1iZXIoc2VhcmNoZWQgYnkgYGNvbnN0YW50Lm51bWVyaWNgIHNjb3BlKVwiXG4gIHNjb3BlOiAnY29uc3RhbnQubnVtZXJpYydcblxuY2xhc3MgTW92ZVRvTmV4dE51bWJlciBleHRlbmRzIE1vdmVUb1ByZXZpb3VzTnVtYmVyXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBuZXh0IG51bWJlcihzZWFyY2hlZCBieSBgY29uc3RhbnQubnVtZXJpY2Agc2NvcGUpXCJcbiAgZGlyZWN0aW9uOiAnZm9yd2FyZCdcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGtleW1hcDogJVxuY2xhc3MgTW92ZVRvUGFpciBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgaW5jbHVzaXZlOiB0cnVlXG4gIGp1bXA6IHRydWVcbiAgbWVtYmVyOiBbJ1BhcmVudGhlc2lzJywgJ0N1cmx5QnJhY2tldCcsICdTcXVhcmVCcmFja2V0JywgJ0FuZ2xlQnJhY2tldCddXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAc2V0QnVmZmVyUG9zaXRpb25TYWZlbHkoY3Vyc29yLCBAZ2V0UG9pbnQoY3Vyc29yKSlcblxuICBnZXRQb2ludDogKGN1cnNvcikgLT5cbiAgICBjdXJzb3JQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgY3Vyc29yUm93ID0gY3Vyc29yUG9zaXRpb24ucm93XG5cbiAgICBnZXRQb2ludEZvclRhZyA9ID0+XG4gICAgICBwID0gY3Vyc29yUG9zaXRpb25cbiAgICAgIHBhaXJJbmZvID0gQG5ldyhcIkFUYWdcIikuZ2V0UGFpckluZm8ocClcbiAgICAgIHJldHVybiBudWxsIHVubGVzcyBwYWlySW5mbz9cbiAgICAgIHtvcGVuUmFuZ2UsIGNsb3NlUmFuZ2V9ID0gcGFpckluZm9cbiAgICAgIG9wZW5SYW5nZSA9IG9wZW5SYW5nZS50cmFuc2xhdGUoWzAsICsxXSwgWzAsIC0xXSlcbiAgICAgIGNsb3NlUmFuZ2UgPSBjbG9zZVJhbmdlLnRyYW5zbGF0ZShbMCwgKzFdLCBbMCwgLTFdKVxuICAgICAgcmV0dXJuIGNsb3NlUmFuZ2Uuc3RhcnQgaWYgb3BlblJhbmdlLmNvbnRhaW5zUG9pbnQocCkgYW5kIChub3QgcC5pc0VxdWFsKG9wZW5SYW5nZS5lbmQpKVxuICAgICAgcmV0dXJuIG9wZW5SYW5nZS5zdGFydCBpZiBjbG9zZVJhbmdlLmNvbnRhaW5zUG9pbnQocCkgYW5kIChub3QgcC5pc0VxdWFsKGNsb3NlUmFuZ2UuZW5kKSlcblxuICAgIHBvaW50ID0gZ2V0UG9pbnRGb3JUYWcoKVxuICAgIHJldHVybiBwb2ludCBpZiBwb2ludD9cblxuICAgIHJhbmdlcyA9IEBuZXcoXCJBQW55UGFpclwiLCB7YWxsb3dGb3J3YXJkaW5nOiB0cnVlLCBAbWVtYmVyfSkuZ2V0UmFuZ2VzKGN1cnNvci5zZWxlY3Rpb24pXG4gICAgcmFuZ2VzID0gcmFuZ2VzLmZpbHRlciAoe3N0YXJ0LCBlbmR9KSAtPlxuICAgICAgcCA9IGN1cnNvclBvc2l0aW9uXG4gICAgICAocC5yb3cgaXMgc3RhcnQucm93KSBhbmQgc3RhcnQuaXNHcmVhdGVyVGhhbk9yRXF1YWwocCkgb3JcbiAgICAgICAgKHAucm93IGlzIGVuZC5yb3cpIGFuZCBlbmQuaXNHcmVhdGVyVGhhbk9yRXF1YWwocClcblxuICAgIHJldHVybiBudWxsIHVubGVzcyByYW5nZXMubGVuZ3RoXG4gICAgIyBDYWxsaW5nIGNvbnRhaW5zUG9pbnQgZXhjbHVzaXZlKHBhc3MgdHJ1ZSBhcyAybmQgYXJnKSBtYWtlIG9wZW5pbmcgcGFpciB1bmRlclxuICAgICMgY3Vyc29yIGlzIGdyb3VwZWQgdG8gZm9yd2FyZGluZ1Jhbmdlc1xuICAgIFtlbmNsb3NpbmdSYW5nZXMsIGZvcndhcmRpbmdSYW5nZXNdID0gXy5wYXJ0aXRpb24gcmFuZ2VzLCAocmFuZ2UpIC0+XG4gICAgICByYW5nZS5jb250YWluc1BvaW50KGN1cnNvclBvc2l0aW9uLCB0cnVlKVxuICAgIGVuY2xvc2luZ1JhbmdlID0gXy5sYXN0KHNvcnRSYW5nZXMoZW5jbG9zaW5nUmFuZ2VzKSlcbiAgICBmb3J3YXJkaW5nUmFuZ2VzID0gc29ydFJhbmdlcyhmb3J3YXJkaW5nUmFuZ2VzKVxuXG4gICAgaWYgZW5jbG9zaW5nUmFuZ2VcbiAgICAgIGZvcndhcmRpbmdSYW5nZXMgPSBmb3J3YXJkaW5nUmFuZ2VzLmZpbHRlciAocmFuZ2UpIC0+XG4gICAgICAgIGVuY2xvc2luZ1JhbmdlLmNvbnRhaW5zUmFuZ2UocmFuZ2UpXG5cbiAgICBmb3J3YXJkaW5nUmFuZ2VzWzBdPy5lbmQudHJhbnNsYXRlKFswLCAtMV0pIG9yIGVuY2xvc2luZ1JhbmdlPy5zdGFydFxuIl19
