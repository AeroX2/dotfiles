(function() {
  var Base, CreatePersistentSelection, Decrease, DecrementNumber, Delete, DeleteLeft, DeleteLine, DeleteOccurrenceInAFunctionOrInnerParagraph, DeleteRight, DeleteToLastCharacterOfLine, Disposable, Increase, IncrementNumber, LineEndingRegExp, Mark, Operator, Point, PutAfter, PutAfterAndSelect, PutBefore, PutBeforeAndSelect, Range, Select, SelectLatestChange, SelectOccurrence, SelectOccurrenceInAFunctionOrInnerParagraph, SelectPersistentSelection, SelectPreviousSelection, TogglePersistentSelection, TogglePresetOccurrence, Yank, YankLine, YankToLastCharacterOfLine, _, cursorIsAtEmptyRow, debug, destroyNonLastSelection, getValidVimBufferRow, getVisibleBufferRange, getWordPatternAtBufferPosition, haveSomeNonEmptySelection, highlightRanges, inspect, isEndsWithNewLineForBufferRow, ref, ref1, selectedRange, selectedText, settings, swrap, toString,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  LineEndingRegExp = /(?:\n|\r\n)$/;

  _ = require('underscore-plus');

  ref = require('atom'), Point = ref.Point, Range = ref.Range, Disposable = ref.Disposable;

  inspect = require('util').inspect;

  ref1 = require('./utils'), haveSomeNonEmptySelection = ref1.haveSomeNonEmptySelection, highlightRanges = ref1.highlightRanges, isEndsWithNewLineForBufferRow = ref1.isEndsWithNewLineForBufferRow, getValidVimBufferRow = ref1.getValidVimBufferRow, cursorIsAtEmptyRow = ref1.cursorIsAtEmptyRow, getVisibleBufferRange = ref1.getVisibleBufferRange, getWordPatternAtBufferPosition = ref1.getWordPatternAtBufferPosition, destroyNonLastSelection = ref1.destroyNonLastSelection, selectedRange = ref1.selectedRange, selectedText = ref1.selectedText, toString = ref1.toString, debug = ref1.debug;

  swrap = require('./selection-wrapper');

  settings = require('./settings');

  Base = require('./base');

  Operator = (function(superClass) {
    extend(Operator, superClass);

    Operator.extend(false);

    Operator.prototype.requireTarget = true;

    Operator.prototype.recordable = true;

    Operator.prototype.wise = null;

    Operator.prototype.occurrence = false;

    Operator.prototype.patternForOccurrence = null;

    Operator.prototype.stayOnLinewise = false;

    Operator.prototype.stayAtSamePosition = null;

    Operator.prototype.clipToMutationEndOnStay = true;

    Operator.prototype.useMarkerForStay = false;

    Operator.prototype.restorePositions = true;

    Operator.prototype.restorePositionsToMutationEnd = false;

    Operator.prototype.flashTarget = true;

    Operator.prototype.trackChange = false;

    Operator.prototype.acceptPresetOccurrence = true;

    Operator.prototype.acceptPersistentSelection = true;

    Operator.prototype.needStay = function() {
      return this.stayAtSamePosition != null ? this.stayAtSamePosition : this.stayAtSamePosition = (function(_this) {
        return function() {
          var base, param;
          param = _this.getStayParam();
          if (_this.isMode('visual', 'linewise')) {
            return settings.get(param);
          } else {
            return settings.get(param) || (_this.stayOnLinewise && (typeof (base = _this.target).isLinewise === "function" ? base.isLinewise() : void 0));
          }
        };
      })(this)();
    };

    Operator.prototype.getStayParam = function() {
      switch (false) {
        case !this["instanceof"]('Increase'):
          return 'stayOnIncrease';
        case !this["instanceof"]('TransformString'):
          return 'stayOnTransformString';
        case !this["instanceof"]('Delete'):
          return 'stayOnDelete';
        default:
          return "stayOn" + (this.getName());
      }
    };

    Operator.prototype.isOccurrence = function() {
      return this.occurrence;
    };

    Operator.prototype.setMarkForChange = function(range) {
      return this.vimState.mark.setRange('[', ']', range);
    };

    Operator.prototype.needFlash = function() {
      var ref2;
      if (this.flashTarget && !this.isMode('visual')) {
        return settings.get('flashOnOperate') && (ref2 = this.getName(), indexOf.call(settings.get('flashOnOperateBlacklist'), ref2) < 0);
      }
    };

    Operator.prototype.flashIfNecessary = function(ranges) {
      if (!this.needFlash()) {
        return;
      }
      return this.vimState.flash(ranges, {
        type: 'operator'
      });
    };

    Operator.prototype.flashChangeIfNecessary = function() {
      if (!this.needFlash()) {
        return;
      }
      return this.onDidFinishOperation((function(_this) {
        return function() {
          var ranges;
          ranges = _this.mutationManager.getMarkerBufferRanges().filter(function(range) {
            return !range.isEmpty();
          });
          if (ranges.length) {
            return _this.flashIfNecessary(ranges);
          }
        };
      })(this));
    };

    Operator.prototype.trackChangeIfNecessary = function() {
      if (!this.trackChange) {
        return;
      }
      return this.onDidFinishOperation((function(_this) {
        return function() {
          var marker, ref2;
          if (marker = (ref2 = _this.mutationManager.getMutationForSelection(_this.editor.getLastSelection())) != null ? ref2.marker : void 0) {
            return _this.setMarkForChange(marker.getBufferRange());
          }
        };
      })(this));
    };

    function Operator() {
      var implicitTarget, ref2;
      Operator.__super__.constructor.apply(this, arguments);
      ref2 = this.vimState, this.mutationManager = ref2.mutationManager, this.occurrenceManager = ref2.occurrenceManager, this.persistentSelection = ref2.persistentSelection;
      this.initialize();
      this.onDidSetOperatorModifier((function(_this) {
        return function(arg) {
          var occurrence, wise;
          occurrence = arg.occurrence, wise = arg.wise;
          if (wise != null) {
            _this.wise = wise;
          }
          if (occurrence != null) {
            return _this.setOccurrence('modifier');
          }
        };
      })(this));
      if (implicitTarget = this.getImplicitTarget()) {
        if (this.target == null) {
          this.target = implicitTarget;
        }
      }
      if (_.isString(this.target)) {
        this.setTarget(this["new"](this.target));
      }
      if (this.occurrence) {
        this.setOccurrence('static');
      } else if (this.acceptPresetOccurrence && this.occurrenceManager.hasPatterns()) {
        this.setOccurrence('preset');
      }
      if (this.acceptPersistentSelection) {
        this.subscribe(this.onDidDeactivateMode((function(_this) {
          return function(arg) {
            var mode;
            mode = arg.mode;
            if (mode === 'operator-pending') {
              return _this.occurrenceManager.resetPatterns();
            }
          };
        })(this)));
      }
    }

    Operator.prototype.getImplicitTarget = function() {
      if (this.canSelectPersistentSelection()) {
        this.destroyUnknownSelection = true;
        if (this.isMode('visual')) {
          return "ACurrentSelectionAndAPersistentSelection";
        } else {
          return "APersistentSelection";
        }
      } else {
        if (this.isMode('visual')) {
          return "CurrentSelection";
        }
      }
    };

    Operator.prototype.canSelectPersistentSelection = function() {
      return this.acceptPersistentSelection && this.vimState.hasPersistentSelections() && settings.get('autoSelectPersistentSelectionOnOperate');
    };

    Operator.prototype.setOccurrence = function(type) {
      this.occurrence = true;
      switch (type) {
        case 'static':
          if (!this.isComplete()) {
            debug('static: mark as we enter operator-pending');
            if (!this.occurrenceManager.hasMarkers()) {
              return this.addOccurrencePattern();
            }
          }
          break;
        case 'preset':
          return debug('preset: nothing to do since we have markers already');
        case 'modifier':
          debug('modifier: overwrite existing marker when manually typed `o`');
          this.occurrenceManager.resetPatterns();
          return this.addOccurrencePattern();
      }
    };

    Operator.prototype.addOccurrencePattern = function(pattern) {
      var point;
      if (pattern == null) {
        pattern = null;
      }
      if (pattern == null) {
        pattern = this.patternForOccurrence;
      }
      if (pattern == null) {
        point = this.getCursorBufferPosition();
        pattern = getWordPatternAtBufferPosition(this.editor, point, {
          singleNonWordChar: true
        });
      }
      return this.occurrenceManager.addPattern(pattern);
    };

    Operator.prototype.setTarget = function(target) {
      this.target = target;
      this.target.setOperator(this);
      this.emitDidSetTarget(this);
      return this;
    };

    Operator.prototype.setTextToRegisterForSelection = function(selection) {
      return this.setTextToRegister(selection.getText(), selection);
    };

    Operator.prototype.setTextToRegister = function(text, selection) {
      var base;
      if ((typeof (base = this.target).isLinewise === "function" ? base.isLinewise() : void 0) && (!text.endsWith('\n'))) {
        text += "\n";
      }
      if (text) {
        return this.vimState.register.set({
          text: text,
          selection: selection
        });
      }
    };

    Operator.prototype.execute = function() {
      var canMutate, stopMutation;
      canMutate = true;
      stopMutation = function() {
        return canMutate = false;
      };
      if (this.selectTarget()) {
        this.editor.transact((function(_this) {
          return function() {
            var i, len, ref2, results, selection;
            ref2 = _this.editor.getSelections();
            results = [];
            for (i = 0, len = ref2.length; i < len; i++) {
              selection = ref2[i];
              if (canMutate) {
                results.push(_this.mutateSelection(selection, stopMutation));
              }
            }
            return results;
          };
        })(this));
        this.restoreCursorPositionsIfNecessary();
      }
      return this.activateMode('normal');
    };

    Operator.prototype.selectOccurrence = function() {
      var ranges, selectedRanges;
      if (!this.occurrenceManager.hasMarkers()) {
        this.addOccurrencePattern();
      }
      if (this.patternForOccurrence == null) {
        this.patternForOccurrence = this.occurrenceManager.buildPattern();
      }
      selectedRanges = this.editor.getSelectedBufferRanges();
      ranges = this.occurrenceManager.getMarkerRangesIntersectsWithRanges(selectedRanges, this.isMode('visual'));
      if (ranges.length) {
        if (this.isMode('visual')) {
          this.vimState.modeManager.deactivate();
        }
        this.editor.setSelectedBufferRanges(ranges);
      } else {
        this.mutationManager.restoreInitialPositions();
      }
      return this.occurrenceManager.resetPatterns();
    };

    Operator.prototype.selectTarget = function() {
      var options;
      options = {
        isSelect: this["instanceof"]('Select'),
        useMarker: this.useMarkerForStay
      };
      this.mutationManager.init(options);
      this.mutationManager.setCheckPoint('will-select');
      if (this.wise && this.target.isMotion()) {
        this.target.forceWise(this.wise);
      }
      this.emitWillSelectTarget();
      if (this.isOccurrence() && !this.occurrenceManager.hasMarkers()) {
        this.addOccurrencePattern();
      }
      this.target.select();
      if (this.isOccurrence()) {
        this.selectOccurrence();
      }
      if (haveSomeNonEmptySelection(this.editor) || this.target.getName() === "Empty") {
        this.mutationManager.setCheckPoint('did-select');
        this.emitDidSelectTarget();
        this.flashChangeIfNecessary();
        this.trackChangeIfNecessary();
        return true;
      } else {
        return false;
      }
    };

    Operator.prototype.restoreCursorPositionsIfNecessary = function() {
      var options, ref2;
      if (!this.restorePositions) {
        return;
      }
      options = {
        stay: this.needStay(),
        strict: this.isOccurrence() || this.destroyUnknownSelection,
        clipToMutationEnd: this.clipToMutationEndOnStay,
        isBlockwise: (ref2 = this.target) != null ? typeof ref2.isBlockwise === "function" ? ref2.isBlockwise() : void 0 : void 0,
        mutationEnd: this.restorePositionsToMutationEnd
      };
      this.mutationManager.restoreCursorPositions(options);
      return this.emitDidRestoreCursorPositions();
    };

    return Operator;

  })(Base);

  Select = (function(superClass) {
    extend(Select, superClass);

    function Select() {
      return Select.__super__.constructor.apply(this, arguments);
    }

    Select.extend(false);

    Select.prototype.flashTarget = false;

    Select.prototype.recordable = false;

    Select.prototype.acceptPresetOccurrence = false;

    Select.prototype.acceptPersistentSelection = false;

    Select.prototype.canChangeMode = function() {
      var base;
      if (this.isMode('visual')) {
        return this.isOccurrence() || (typeof (base = this.target).isAllowSubmodeChange === "function" ? base.isAllowSubmodeChange() : void 0);
      } else {
        return true;
      }
    };

    Select.prototype.execute = function() {
      var submode;
      this.selectTarget();
      if (this.canChangeMode()) {
        submode = swrap.detectVisualModeSubmode(this.editor);
        return this.activateModeIfNecessary('visual', submode);
      }
    };

    return Select;

  })(Operator);

  SelectLatestChange = (function(superClass) {
    extend(SelectLatestChange, superClass);

    function SelectLatestChange() {
      return SelectLatestChange.__super__.constructor.apply(this, arguments);
    }

    SelectLatestChange.extend();

    SelectLatestChange.description = "Select latest yanked or changed range";

    SelectLatestChange.prototype.target = 'ALatestChange';

    return SelectLatestChange;

  })(Select);

  SelectPreviousSelection = (function(superClass) {
    extend(SelectPreviousSelection, superClass);

    function SelectPreviousSelection() {
      return SelectPreviousSelection.__super__.constructor.apply(this, arguments);
    }

    SelectPreviousSelection.extend();

    SelectPreviousSelection.prototype.target = "PreviousSelection";

    SelectPreviousSelection.prototype.execute = function() {
      this.selectTarget();
      if (this.target.submode != null) {
        return this.activateModeIfNecessary('visual', this.target.submode);
      }
    };

    return SelectPreviousSelection;

  })(Select);

  SelectPersistentSelection = (function(superClass) {
    extend(SelectPersistentSelection, superClass);

    function SelectPersistentSelection() {
      return SelectPersistentSelection.__super__.constructor.apply(this, arguments);
    }

    SelectPersistentSelection.extend();

    SelectPersistentSelection.description = "Select persistent-selection and clear all persistent-selection, it's like convert to real-selection";

    SelectPersistentSelection.prototype.target = "APersistentSelection";

    return SelectPersistentSelection;

  })(Select);

  SelectOccurrence = (function(superClass) {
    extend(SelectOccurrence, superClass);

    function SelectOccurrence() {
      return SelectOccurrence.__super__.constructor.apply(this, arguments);
    }

    SelectOccurrence.extend();

    SelectOccurrence.description = "Add selection onto each matching word within target range";

    SelectOccurrence.prototype.occurrence = true;

    SelectOccurrence.prototype.initialize = function() {
      SelectOccurrence.__super__.initialize.apply(this, arguments);
      return this.onDidSelectTarget((function(_this) {
        return function() {
          return swrap.clearProperties(_this.editor);
        };
      })(this));
    };

    SelectOccurrence.prototype.execute = function() {
      var submode;
      if (this.selectTarget()) {
        submode = swrap.detectVisualModeSubmode(this.editor);
        return this.activateModeIfNecessary('visual', submode);
      }
    };

    return SelectOccurrence;

  })(Operator);

  SelectOccurrenceInAFunctionOrInnerParagraph = (function(superClass) {
    extend(SelectOccurrenceInAFunctionOrInnerParagraph, superClass);

    function SelectOccurrenceInAFunctionOrInnerParagraph() {
      return SelectOccurrenceInAFunctionOrInnerParagraph.__super__.constructor.apply(this, arguments);
    }

    SelectOccurrenceInAFunctionOrInnerParagraph.extend();

    SelectOccurrenceInAFunctionOrInnerParagraph.prototype.target = "AFunctionOrInnerParagraph";

    return SelectOccurrenceInAFunctionOrInnerParagraph;

  })(SelectOccurrence);

  CreatePersistentSelection = (function(superClass) {
    extend(CreatePersistentSelection, superClass);

    function CreatePersistentSelection() {
      return CreatePersistentSelection.__super__.constructor.apply(this, arguments);
    }

    CreatePersistentSelection.extend();

    CreatePersistentSelection.prototype.flashTarget = false;

    CreatePersistentSelection.prototype.stayAtSamePosition = true;

    CreatePersistentSelection.prototype.acceptPresetOccurrence = false;

    CreatePersistentSelection.prototype.acceptPersistentSelection = false;

    CreatePersistentSelection.prototype.mutateSelection = function(selection) {
      return this.persistentSelection.markBufferRange(selection.getBufferRange());
    };

    CreatePersistentSelection.prototype.execute = function() {
      this.onDidFinishOperation((function(_this) {
        return function() {
          return destroyNonLastSelection(_this.editor);
        };
      })(this));
      return CreatePersistentSelection.__super__.execute.apply(this, arguments);
    };

    return CreatePersistentSelection;

  })(Operator);

  TogglePersistentSelection = (function(superClass) {
    extend(TogglePersistentSelection, superClass);

    function TogglePersistentSelection() {
      return TogglePersistentSelection.__super__.constructor.apply(this, arguments);
    }

    TogglePersistentSelection.extend();

    TogglePersistentSelection.prototype.isComplete = function() {
      var point;
      point = this.editor.getCursorBufferPosition();
      if (this.markerToRemove = this.persistentSelection.getMarkerAtPoint(point)) {
        return true;
      } else {
        return TogglePersistentSelection.__super__.isComplete.apply(this, arguments);
      }
    };

    TogglePersistentSelection.prototype.execute = function() {
      if (this.markerToRemove) {
        return this.markerToRemove.destroy();
      } else {
        return TogglePersistentSelection.__super__.execute.apply(this, arguments);
      }
    };

    return TogglePersistentSelection;

  })(CreatePersistentSelection);

  TogglePresetOccurrence = (function(superClass) {
    extend(TogglePresetOccurrence, superClass);

    function TogglePresetOccurrence() {
      return TogglePresetOccurrence.__super__.constructor.apply(this, arguments);
    }

    TogglePresetOccurrence.extend();

    TogglePresetOccurrence.prototype.flashTarget = false;

    TogglePresetOccurrence.prototype.requireTarget = false;

    TogglePresetOccurrence.prototype.stayAtSamePosition = true;

    TogglePresetOccurrence.prototype.acceptPresetOccurrence = false;

    TogglePresetOccurrence.prototype.execute = function() {
      var isNarrowed, marker, pattern, text;
      this.occurrenceManager = this.vimState.occurrenceManager;
      if (marker = this.occurrenceManager.getMarkerAtPoint(this.editor.getCursorBufferPosition())) {
        return marker.destroy();
      } else {
        pattern = null;
        isNarrowed = this.vimState.modeManager.isNarrowed();
        if (this.isMode('visual') && !isNarrowed) {
          text = this.editor.getSelectedText();
          pattern = new RegExp(_.escapeRegExp(text), 'g');
        }
        this.addOccurrencePattern(pattern);
        if (!isNarrowed) {
          return this.activateMode('normal');
        }
      }
    };

    return TogglePresetOccurrence;

  })(Operator);

  Delete = (function(superClass) {
    extend(Delete, superClass);

    function Delete() {
      this.mutateSelection = bind(this.mutateSelection, this);
      return Delete.__super__.constructor.apply(this, arguments);
    }

    Delete.extend();

    Delete.prototype.hover = {
      icon: ':delete:',
      emoji: ':scissors:'
    };

    Delete.prototype.trackChange = true;

    Delete.prototype.flashTarget = false;

    Delete.prototype.execute = function() {
      this.onDidSelectTarget((function(_this) {
        return function() {
          if (_this.target.isLinewise()) {
            return _this.requestAdjustCursorPositions();
          }
        };
      })(this));
      return Delete.__super__.execute.apply(this, arguments);
    };

    Delete.prototype.mutateSelection = function(selection) {
      this.setTextToRegisterForSelection(selection);
      return selection.deleteSelectedText();
    };

    Delete.prototype.requestAdjustCursorPositions = function() {
      return this.onDidRestoreCursorPositions((function(_this) {
        return function() {
          var cursor, i, len, ref2, results;
          ref2 = _this.editor.getCursors();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            cursor = ref2[i];
            results.push(_this.adjustCursor(cursor));
          }
          return results;
        };
      })(this));
    };

    Delete.prototype.adjustCursor = function(cursor) {
      var point, row;
      row = getValidVimBufferRow(this.editor, cursor.getBufferRow());
      if (this.needStay()) {
        point = this.mutationManager.getInitialPointForSelection(cursor.selection);
        return cursor.setBufferPosition([row, point.column]);
      } else {
        cursor.setBufferPosition([row, 0]);
        return cursor.skipLeadingWhitespace();
      }
    };

    return Delete;

  })(Operator);

  DeleteRight = (function(superClass) {
    extend(DeleteRight, superClass);

    function DeleteRight() {
      return DeleteRight.__super__.constructor.apply(this, arguments);
    }

    DeleteRight.extend();

    DeleteRight.prototype.target = 'MoveRight';

    DeleteRight.prototype.hover = null;

    return DeleteRight;

  })(Delete);

  DeleteLeft = (function(superClass) {
    extend(DeleteLeft, superClass);

    function DeleteLeft() {
      return DeleteLeft.__super__.constructor.apply(this, arguments);
    }

    DeleteLeft.extend();

    DeleteLeft.prototype.target = 'MoveLeft';

    return DeleteLeft;

  })(Delete);

  DeleteToLastCharacterOfLine = (function(superClass) {
    extend(DeleteToLastCharacterOfLine, superClass);

    function DeleteToLastCharacterOfLine() {
      return DeleteToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    DeleteToLastCharacterOfLine.extend();

    DeleteToLastCharacterOfLine.prototype.target = 'MoveToLastCharacterOfLine';

    DeleteToLastCharacterOfLine.prototype.execute = function() {
      if (this.isMode('visual', 'blockwise')) {
        swrap.setReversedState(this.editor, false);
      }
      return DeleteToLastCharacterOfLine.__super__.execute.apply(this, arguments);
    };

    return DeleteToLastCharacterOfLine;

  })(Delete);

  DeleteLine = (function(superClass) {
    extend(DeleteLine, superClass);

    function DeleteLine() {
      return DeleteLine.__super__.constructor.apply(this, arguments);
    }

    DeleteLine.extend();

    DeleteLine.commandScope = 'atom-text-editor.vim-mode-plus.visual-mode';

    DeleteLine.prototype.wise = 'linewise';

    return DeleteLine;

  })(Delete);

  DeleteOccurrenceInAFunctionOrInnerParagraph = (function(superClass) {
    extend(DeleteOccurrenceInAFunctionOrInnerParagraph, superClass);

    function DeleteOccurrenceInAFunctionOrInnerParagraph() {
      return DeleteOccurrenceInAFunctionOrInnerParagraph.__super__.constructor.apply(this, arguments);
    }

    DeleteOccurrenceInAFunctionOrInnerParagraph.extend();

    DeleteOccurrenceInAFunctionOrInnerParagraph.prototype.occurrence = true;

    DeleteOccurrenceInAFunctionOrInnerParagraph.prototype.target = "AFunctionOrInnerParagraph";

    return DeleteOccurrenceInAFunctionOrInnerParagraph;

  })(Delete);

  Yank = (function(superClass) {
    extend(Yank, superClass);

    function Yank() {
      return Yank.__super__.constructor.apply(this, arguments);
    }

    Yank.extend();

    Yank.prototype.hover = {
      icon: ':yank:',
      emoji: ':clipboard:'
    };

    Yank.prototype.trackChange = true;

    Yank.prototype.stayOnLinewise = true;

    Yank.prototype.clipToMutationEndOnStay = false;

    Yank.prototype.mutateSelection = function(selection) {
      return this.setTextToRegisterForSelection(selection);
    };

    return Yank;

  })(Operator);

  YankLine = (function(superClass) {
    extend(YankLine, superClass);

    function YankLine() {
      return YankLine.__super__.constructor.apply(this, arguments);
    }

    YankLine.extend();

    YankLine.prototype.wise = 'linewise';

    YankLine.prototype.initialize = function() {
      YankLine.__super__.initialize.apply(this, arguments);
      if (this.isMode('normal')) {
        this.target = 'MoveToRelativeLine';
      }
      if (this.isMode('visual', 'characterwise')) {
        return this.stayOnLinewise = false;
      }
    };

    return YankLine;

  })(Yank);

  YankToLastCharacterOfLine = (function(superClass) {
    extend(YankToLastCharacterOfLine, superClass);

    function YankToLastCharacterOfLine() {
      return YankToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    YankToLastCharacterOfLine.extend();

    YankToLastCharacterOfLine.prototype.target = 'MoveToLastCharacterOfLine';

    return YankToLastCharacterOfLine;

  })(Yank);

  Increase = (function(superClass) {
    extend(Increase, superClass);

    function Increase() {
      return Increase.__super__.constructor.apply(this, arguments);
    }

    Increase.extend();

    Increase.prototype.requireTarget = false;

    Increase.prototype.step = 1;

    Increase.prototype.execute = function() {
      var newRanges, pattern;
      pattern = RegExp("" + (settings.get('numberRegex')), "g");
      newRanges = [];
      this.editor.transact((function(_this) {
        return function() {
          var cursor, i, len, ranges, ref2, results, scanRange;
          ref2 = _this.editor.getCursors();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            cursor = ref2[i];
            scanRange = _this.isMode('visual') ? cursor.selection.getBufferRange() : cursor.getCurrentLineBufferRange();
            ranges = _this.increaseNumber(cursor, scanRange, pattern);
            if (!_this.isMode('visual') && ranges.length) {
              cursor.setBufferPosition(ranges[0].end.translate([0, -1]));
            }
            results.push(newRanges.push(ranges));
          }
          return results;
        };
      })(this));
      if ((newRanges = _.flatten(newRanges)).length) {
        return this.flashIfNecessary(newRanges);
      } else {
        return atom.beep();
      }
    };

    Increase.prototype.increaseNumber = function(cursor, scanRange, pattern) {
      var newRanges;
      newRanges = [];
      this.editor.scanInBufferRange(pattern, scanRange, (function(_this) {
        return function(arg) {
          var matchText, newText, range, replace, stop;
          matchText = arg.matchText, range = arg.range, stop = arg.stop, replace = arg.replace;
          newText = String(parseInt(matchText, 10) + _this.step * _this.getCount());
          if (_this.isMode('visual')) {
            return newRanges.push(replace(newText));
          } else {
            if (!range.end.isGreaterThan(cursor.getBufferPosition())) {
              return;
            }
            newRanges.push(replace(newText));
            return stop();
          }
        };
      })(this));
      return newRanges;
    };

    return Increase;

  })(Operator);

  Decrease = (function(superClass) {
    extend(Decrease, superClass);

    function Decrease() {
      return Decrease.__super__.constructor.apply(this, arguments);
    }

    Decrease.extend();

    Decrease.prototype.step = -1;

    return Decrease;

  })(Increase);

  IncrementNumber = (function(superClass) {
    extend(IncrementNumber, superClass);

    function IncrementNumber() {
      return IncrementNumber.__super__.constructor.apply(this, arguments);
    }

    IncrementNumber.extend();

    IncrementNumber.prototype.displayName = 'Increment ++';

    IncrementNumber.prototype.step = 1;

    IncrementNumber.prototype.baseNumber = null;

    IncrementNumber.prototype.execute = function() {
      var i, len, newRanges, pattern, ref2, selection;
      pattern = RegExp("" + (settings.get('numberRegex')), "g");
      newRanges = null;
      this.selectTarget();
      this.editor.transact((function(_this) {
        return function() {
          var selection;
          return newRanges = (function() {
            var i, len, ref2, results;
            ref2 = this.editor.getSelectionsOrderedByBufferPosition();
            results = [];
            for (i = 0, len = ref2.length; i < len; i++) {
              selection = ref2[i];
              results.push(this.replaceNumber(selection.getBufferRange(), pattern));
            }
            return results;
          }).call(_this);
        };
      })(this));
      if ((newRanges = _.flatten(newRanges)).length) {
        this.flashIfNecessary(newRanges);
      } else {
        atom.beep();
      }
      ref2 = this.editor.getSelections();
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        selection.cursor.setBufferPosition(selection.getBufferRange().start);
      }
      return this.activateModeIfNecessary('normal');
    };

    IncrementNumber.prototype.replaceNumber = function(scanRange, pattern) {
      var newRanges;
      newRanges = [];
      this.editor.scanInBufferRange(pattern, scanRange, (function(_this) {
        return function(arg) {
          var matchText, replace;
          matchText = arg.matchText, replace = arg.replace;
          return newRanges.push(replace(_this.getNewText(matchText)));
        };
      })(this));
      return newRanges;
    };

    IncrementNumber.prototype.getNewText = function(text) {
      this.baseNumber = this.baseNumber != null ? this.baseNumber + this.step * this.getCount() : parseInt(text, 10);
      return String(this.baseNumber);
    };

    return IncrementNumber;

  })(Operator);

  DecrementNumber = (function(superClass) {
    extend(DecrementNumber, superClass);

    function DecrementNumber() {
      return DecrementNumber.__super__.constructor.apply(this, arguments);
    }

    DecrementNumber.extend();

    DecrementNumber.prototype.displayName = 'Decrement --';

    DecrementNumber.prototype.step = -1;

    return DecrementNumber;

  })(IncrementNumber);

  PutBefore = (function(superClass) {
    extend(PutBefore, superClass);

    function PutBefore() {
      return PutBefore.__super__.constructor.apply(this, arguments);
    }

    PutBefore.extend();

    PutBefore.prototype.restorePositions = false;

    PutBefore.prototype.location = 'before';

    PutBefore.prototype.initialize = function() {
      if (this.isMode('normal')) {
        return this.target = 'Empty';
      }
    };

    PutBefore.prototype.mutateSelection = function(selection) {
      var linewise, ref2, text, type;
      ref2 = this.vimState.register.get(null, selection), text = ref2.text, type = ref2.type;
      if (!text) {
        return;
      }
      text = _.multiplyString(text, this.getCount());
      linewise = (type === 'linewise') || this.isMode('visual', 'linewise');
      return this.paste(selection, text, {
        linewise: linewise,
        selectPastedText: this.selectPastedText
      });
    };

    PutBefore.prototype.paste = function(selection, text, arg) {
      var adjustCursor, cursor, linewise, newRange, selectPastedText;
      linewise = arg.linewise, selectPastedText = arg.selectPastedText;
      cursor = selection.cursor;
      if (linewise) {
        newRange = this.pasteLinewise(selection, text);
        adjustCursor = function(range) {
          cursor.setBufferPosition(range.start);
          return cursor.moveToFirstCharacterOfLine();
        };
      } else {
        newRange = this.pasteCharacterwise(selection, text);
        adjustCursor = function(range) {
          return cursor.setBufferPosition(range.end.translate([0, -1]));
        };
      }
      this.setMarkForChange(newRange);
      if (selectPastedText) {
        return selection.setBufferRange(newRange);
      } else {
        return adjustCursor(newRange);
      }
    };

    PutBefore.prototype.pasteLinewise = function(selection, text) {
      var cursor, end, range, row;
      cursor = selection.cursor;
      if (!text.endsWith("\n")) {
        text += "\n";
      }
      if (selection.isEmpty()) {
        row = cursor.getBufferRow();
        switch (this.location) {
          case 'before':
            range = [[row, 0], [row, 0]];
            break;
          case 'after':
            if (!isEndsWithNewLineForBufferRow(this.editor, row)) {
              text = text.replace(LineEndingRegExp, '');
            }
            cursor.moveToEndOfLine();
            end = selection.insertText("\n").end;
            range = this.editor.bufferRangeForBufferRow(end.row, {
              includeNewline: true
            });
        }
        return this.editor.setTextInBufferRange(range, text);
      } else {
        if (this.isMode('visual', 'linewise')) {
          if (selection.getBufferRange().end.column !== 0) {
            text = text.replace(LineEndingRegExp, '');
          }
        } else {
          selection.insertText("\n");
        }
        return selection.insertText(text);
      }
    };

    PutBefore.prototype.pasteCharacterwise = function(selection, text) {
      if (this.location === 'after' && selection.isEmpty() && !cursorIsAtEmptyRow(selection.cursor)) {
        selection.cursor.moveRight();
      }
      return selection.insertText(text);
    };

    return PutBefore;

  })(Operator);

  PutAfter = (function(superClass) {
    extend(PutAfter, superClass);

    function PutAfter() {
      return PutAfter.__super__.constructor.apply(this, arguments);
    }

    PutAfter.extend();

    PutAfter.prototype.location = 'after';

    return PutAfter;

  })(PutBefore);

  PutBeforeAndSelect = (function(superClass) {
    extend(PutBeforeAndSelect, superClass);

    function PutBeforeAndSelect() {
      return PutBeforeAndSelect.__super__.constructor.apply(this, arguments);
    }

    PutBeforeAndSelect.extend();

    PutBeforeAndSelect.description = "Paste before then select";

    PutBeforeAndSelect.prototype.selectPastedText = true;

    PutBeforeAndSelect.prototype.activateMode = function() {
      var submode;
      submode = swrap.detectVisualModeSubmode(this.editor);
      if (!this.vimState.isMode('visual', submode)) {
        return PutBeforeAndSelect.__super__.activateMode.call(this, 'visual', submode);
      }
    };

    return PutBeforeAndSelect;

  })(PutBefore);

  PutAfterAndSelect = (function(superClass) {
    extend(PutAfterAndSelect, superClass);

    function PutAfterAndSelect() {
      return PutAfterAndSelect.__super__.constructor.apply(this, arguments);
    }

    PutAfterAndSelect.extend();

    PutAfterAndSelect.description = "Paste after then select";

    PutAfterAndSelect.prototype.location = 'after';

    return PutAfterAndSelect;

  })(PutBeforeAndSelect);

  Mark = (function(superClass) {
    extend(Mark, superClass);

    function Mark() {
      return Mark.__super__.constructor.apply(this, arguments);
    }

    Mark.extend();

    Mark.prototype.requireInput = true;

    Mark.prototype.requireTarget = false;

    Mark.prototype.initialize = function() {
      return this.focusInput();
    };

    Mark.prototype.execute = function() {
      this.vimState.mark.set(this.input, this.editor.getCursorBufferPosition());
      return this.activateMode('normal');
    };

    return Mark;

  })(Operator);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvb3BlcmF0b3IuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw0MEJBQUE7SUFBQTs7Ozs7RUFBQSxnQkFBQSxHQUFtQjs7RUFDbkIsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUE2QixPQUFBLENBQVEsTUFBUixDQUE3QixFQUFDLGlCQUFELEVBQVEsaUJBQVIsRUFBZTs7RUFFZCxVQUFXLE9BQUEsQ0FBUSxNQUFSOztFQUNaLE9BY0ksT0FBQSxDQUFRLFNBQVIsQ0FkSixFQUNFLDBEQURGLEVBRUUsc0NBRkYsRUFHRSxrRUFIRixFQUlFLGdEQUpGLEVBS0UsNENBTEYsRUFNRSxrREFORixFQU9FLG9FQVBGLEVBUUUsc0RBUkYsRUFVRSxrQ0FWRixFQVdFLGdDQVhGLEVBWUUsd0JBWkYsRUFhRTs7RUFFRixLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQUNSLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7RUFDWCxJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBRUQ7OztJQUNKLFFBQUMsQ0FBQSxNQUFELENBQVEsS0FBUjs7dUJBQ0EsYUFBQSxHQUFlOzt1QkFDZixVQUFBLEdBQVk7O3VCQUVaLElBQUEsR0FBTTs7dUJBQ04sVUFBQSxHQUFZOzt1QkFFWixvQkFBQSxHQUFzQjs7dUJBQ3RCLGNBQUEsR0FBZ0I7O3VCQUNoQixrQkFBQSxHQUFvQjs7dUJBQ3BCLHVCQUFBLEdBQXlCOzt1QkFDekIsZ0JBQUEsR0FBa0I7O3VCQUNsQixnQkFBQSxHQUFrQjs7dUJBQ2xCLDZCQUFBLEdBQStCOzt1QkFDL0IsV0FBQSxHQUFhOzt1QkFDYixXQUFBLEdBQWE7O3VCQUNiLHNCQUFBLEdBQXdCOzt1QkFDeEIseUJBQUEsR0FBMkI7O3VCQUszQixRQUFBLEdBQVUsU0FBQTsrQ0FD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O0VBVTNCOzs7Ozs7O0lBQ0osaUJBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0EsaUJBQUMsQ0FBQSxXQUFELEdBQWM7O2dDQUNkLFFBQUEsR0FBVTs7OztLQUhvQjs7RUFNMUI7Ozs7Ozs7SUFDSixJQUFDLENBQUEsTUFBRCxDQUFBOzttQkFFQSxZQUFBLEdBQWM7O21CQUNkLGFBQUEsR0FBZTs7bUJBQ2YsVUFBQSxHQUFZLFNBQUE7YUFDVixJQUFDLENBQUEsVUFBRCxDQUFBO0lBRFU7O21CQUdaLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsS0FBcEIsRUFBMkIsSUFBQyxDQUFBLE1BQU0sQ0FBQyx1QkFBUixDQUFBLENBQTNCO2FBQ0EsSUFBQyxDQUFBLFlBQUQsQ0FBYyxRQUFkO0lBRk87Ozs7S0FSUTtBQXJtQm5CIiwic291cmNlc0NvbnRlbnQiOlsiTGluZUVuZGluZ1JlZ0V4cCA9IC8oPzpcXG58XFxyXFxuKSQvXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue1BvaW50LCBSYW5nZSwgRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG57aW5zcGVjdH0gPSByZXF1aXJlICd1dGlsJ1xue1xuICBoYXZlU29tZU5vbkVtcHR5U2VsZWN0aW9uXG4gIGhpZ2hsaWdodFJhbmdlc1xuICBpc0VuZHNXaXRoTmV3TGluZUZvckJ1ZmZlclJvd1xuICBnZXRWYWxpZFZpbUJ1ZmZlclJvd1xuICBjdXJzb3JJc0F0RW1wdHlSb3dcbiAgZ2V0VmlzaWJsZUJ1ZmZlclJhbmdlXG4gIGdldFdvcmRQYXR0ZXJuQXRCdWZmZXJQb3NpdGlvblxuICBkZXN0cm95Tm9uTGFzdFNlbGVjdGlvblxuXG4gIHNlbGVjdGVkUmFuZ2VcbiAgc2VsZWN0ZWRUZXh0XG4gIHRvU3RyaW5nXG4gIGRlYnVnXG59ID0gcmVxdWlyZSAnLi91dGlscydcbnN3cmFwID0gcmVxdWlyZSAnLi9zZWxlY3Rpb24td3JhcHBlcidcbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcbkJhc2UgPSByZXF1aXJlICcuL2Jhc2UnXG5cbmNsYXNzIE9wZXJhdG9yIGV4dGVuZHMgQmFzZVxuICBAZXh0ZW5kKGZhbHNlKVxuICByZXF1aXJlVGFyZ2V0OiB0cnVlXG4gIHJlY29yZGFibGU6IHRydWVcblxuICB3aXNlOiBudWxsXG4gIG9jY3VycmVuY2U6IGZhbHNlXG5cbiAgcGF0dGVybkZvck9jY3VycmVuY2U6IG51bGxcbiAgc3RheU9uTGluZXdpc2U6IGZhbHNlXG4gIHN0YXlBdFNhbWVQb3NpdGlvbjogbnVsbFxuICBjbGlwVG9NdXRhdGlvbkVuZE9uU3RheTogdHJ1ZVxuICB1c2VNYXJrZXJGb3JTdGF5OiBmYWxzZVxuICByZXN0b3JlUG9zaXRpb25zOiB0cnVlXG4gIHJlc3RvcmVQb3NpdGlvbnNUb011dGF0aW9uRW5kOiBmYWxzZVxuICBmbGFzaFRhcmdldDogdHJ1ZVxuICB0cmFja0NoYW5nZTogZmFsc2VcbiAgYWNjZXB0UHJlc2V0T2NjdXJyZW5jZTogdHJ1ZVxuICBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uOiB0cnVlXG5cbiAgIyBbRklYTUVdXG4gICMgRm9yIFRleHRPYmplY3QsIGlzTGluZXdpc2UgcmVzdWx0IGlzIGNoYW5nZWQgYmVmb3JlIC8gYWZ0ZXIgc2VsZWN0LlxuICAjIFRoaXMgbWVhbiByZXR1cm4gdmFsdWUgbWF5IGNoYW5nZSBkZXBlbmRpbmcgb24gd2hlbiB5b3UgY2FsbC5cbiAgbmVlZFN0YXk6IC0+XG4gICAgQHN0YXlBdFNhbWVQb3NpdGlvbiA/PSBkbyA9PlxuICAgICAgcGFyYW0gPSBAZ2V0U3RheVBhcmFtKClcbiAgICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsICdsaW5ld2lzZScpXG4gICAgICAgIHNldHRpbmdzLmdldChwYXJhbSlcbiAgICAgIGVsc2VcbiAgICAgICAgc2V0dGluZ3MuZ2V0KHBhcmFtKSBvciAoQHN0YXlPbkxpbmV3aXNlIGFuZCBAdGFyZ2V0LmlzTGluZXdpc2U/KCkpXG5cbiAgZ2V0U3RheVBhcmFtOiAtPlxuICAgIHN3aXRjaFxuICAgICAgd2hlbiBAaW5zdGFuY2VvZignSW5jcmVhc2UnKVxuICAgICAgICAnc3RheU9uSW5jcmVhc2UnXG4gICAgICB3aGVuIEBpbnN0YW5jZW9mKCdUcmFuc2Zvcm1TdHJpbmcnKVxuICAgICAgICAnc3RheU9uVHJhbnNmb3JtU3RyaW5nJ1xuICAgICAgd2hlbiBAaW5zdGFuY2VvZignRGVsZXRlJylcbiAgICAgICAgJ3N0YXlPbkRlbGV0ZSdcbiAgICAgIGVsc2VcbiAgICAgICAgXCJzdGF5T24je0BnZXROYW1lKCl9XCJcblxuICBpc09jY3VycmVuY2U6IC0+XG4gICAgQG9jY3VycmVuY2VcblxuICBzZXRNYXJrRm9yQ2hhbmdlOiAocmFuZ2UpIC0+XG4gICAgQHZpbVN0YXRlLm1hcmsuc2V0UmFuZ2UoJ1snLCAnXScsIHJhbmdlKVxuXG4gIG5lZWRGbGFzaDogLT5cbiAgICBpZiBAZmxhc2hUYXJnZXQgYW5kIG5vdCBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgc2V0dGluZ3MuZ2V0KCdmbGFzaE9uT3BlcmF0ZScpIGFuZCAoQGdldE5hbWUoKSBub3QgaW4gc2V0dGluZ3MuZ2V0KCdmbGFzaE9uT3BlcmF0ZUJsYWNrbGlzdCcpKVxuXG4gIGZsYXNoSWZOZWNlc3Nhcnk6IChyYW5nZXMpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAbmVlZEZsYXNoKClcbiAgICBAdmltU3RhdGUuZmxhc2gocmFuZ2VzLCB0eXBlOiAnb3BlcmF0b3InKVxuXG4gIGZsYXNoQ2hhbmdlSWZOZWNlc3Nhcnk6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAbmVlZEZsYXNoKClcblxuICAgIEBvbkRpZEZpbmlzaE9wZXJhdGlvbiA9PlxuICAgICAgcmFuZ2VzID0gQG11dGF0aW9uTWFuYWdlci5nZXRNYXJrZXJCdWZmZXJSYW5nZXMoKS5maWx0ZXIgKHJhbmdlKSAtPiBub3QgcmFuZ2UuaXNFbXB0eSgpXG4gICAgICBpZiByYW5nZXMubGVuZ3RoXG4gICAgICAgIEBmbGFzaElmTmVjZXNzYXJ5KHJhbmdlcylcblxuICB0cmFja0NoYW5nZUlmTmVjZXNzYXJ5OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHRyYWNrQ2hhbmdlXG5cbiAgICBAb25EaWRGaW5pc2hPcGVyYXRpb24gPT5cbiAgICAgIGlmIG1hcmtlciA9IEBtdXRhdGlvbk1hbmFnZXIuZ2V0TXV0YXRpb25Gb3JTZWxlY3Rpb24oQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkpPy5tYXJrZXJcbiAgICAgICAgQHNldE1hcmtGb3JDaGFuZ2UobWFya2VyLmdldEJ1ZmZlclJhbmdlKCkpXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgc3VwZXJcbiAgICB7QG11dGF0aW9uTWFuYWdlciwgQG9jY3VycmVuY2VNYW5hZ2VyLCBAcGVyc2lzdGVudFNlbGVjdGlvbn0gPSBAdmltU3RhdGVcblxuICAgIEBpbml0aWFsaXplKClcblxuICAgIEBvbkRpZFNldE9wZXJhdG9yTW9kaWZpZXIgKHtvY2N1cnJlbmNlLCB3aXNlfSkgPT5cbiAgICAgIEB3aXNlID0gd2lzZSBpZiB3aXNlP1xuICAgICAgQHNldE9jY3VycmVuY2UoJ21vZGlmaWVyJykgaWYgb2NjdXJyZW5jZT9cblxuICAgIEB0YXJnZXQgPz0gaW1wbGljaXRUYXJnZXQgaWYgaW1wbGljaXRUYXJnZXQgPSBAZ2V0SW1wbGljaXRUYXJnZXQoKVxuXG4gICAgaWYgXy5pc1N0cmluZyhAdGFyZ2V0KVxuICAgICAgQHNldFRhcmdldChAbmV3KEB0YXJnZXQpKVxuXG4gICAgIyBXaGVuIHByZXNldC1vY2N1cnJlbmNlIHdhcyBleGlzdHMsIGF1dG8gZW5hYmxlIG9jY3VycmVuY2Utd2lzZVxuICAgIGlmIEBvY2N1cnJlbmNlXG4gICAgICBAc2V0T2NjdXJyZW5jZSgnc3RhdGljJylcbiAgICBlbHNlIGlmIEBhY2NlcHRQcmVzZXRPY2N1cnJlbmNlIGFuZCBAb2NjdXJyZW5jZU1hbmFnZXIuaGFzUGF0dGVybnMoKVxuICAgICAgQHNldE9jY3VycmVuY2UoJ3ByZXNldCcpXG5cbiAgICBpZiBAYWNjZXB0UGVyc2lzdGVudFNlbGVjdGlvblxuICAgICAgQHN1YnNjcmliZSBAb25EaWREZWFjdGl2YXRlTW9kZSAoe21vZGV9KSA9PlxuICAgICAgICBAb2NjdXJyZW5jZU1hbmFnZXIucmVzZXRQYXR0ZXJucygpIGlmIG1vZGUgaXMgJ29wZXJhdG9yLXBlbmRpbmcnXG5cbiAgZ2V0SW1wbGljaXRUYXJnZXQ6IC0+XG4gICAgIyBJbiB2aXN1YWwtbW9kZSBhbmQgdGFyZ2V0IHdhcyBub3QgcHJlLXNldCwgb3BlcmF0ZSBvbiBzZWxlY3RlZCBhcmVhLlxuICAgIGlmIEBjYW5TZWxlY3RQZXJzaXN0ZW50U2VsZWN0aW9uKClcbiAgICAgIEBkZXN0cm95VW5rbm93blNlbGVjdGlvbiA9IHRydWVcbiAgICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgICAgIFwiQUN1cnJlbnRTZWxlY3Rpb25BbmRBUGVyc2lzdGVudFNlbGVjdGlvblwiXG4gICAgICBlbHNlXG4gICAgICAgIFwiQVBlcnNpc3RlbnRTZWxlY3Rpb25cIlxuICAgIGVsc2VcbiAgICAgIFwiQ3VycmVudFNlbGVjdGlvblwiIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG5cbiAgY2FuU2VsZWN0UGVyc2lzdGVudFNlbGVjdGlvbjogLT5cbiAgICBAYWNjZXB0UGVyc2lzdGVudFNlbGVjdGlvbiBhbmRcbiAgICBAdmltU3RhdGUuaGFzUGVyc2lzdGVudFNlbGVjdGlvbnMoKSBhbmRcbiAgICBzZXR0aW5ncy5nZXQoJ2F1dG9TZWxlY3RQZXJzaXN0ZW50U2VsZWN0aW9uT25PcGVyYXRlJylcblxuICAjIHR5cGUgaXMgb25lIG9mIFsncHJlc2V0JywgJ21vZGlmaWVyJ11cbiAgc2V0T2NjdXJyZW5jZTogKHR5cGUpIC0+XG4gICAgQG9jY3VycmVuY2UgPSB0cnVlXG4gICAgc3dpdGNoIHR5cGVcbiAgICAgIHdoZW4gJ3N0YXRpYydcbiAgICAgICAgdW5sZXNzIEBpc0NvbXBsZXRlKCkgIyB3ZSBlbnRlciBvcGVyYXRvci1wZW5kaW5nXG4gICAgICAgICAgZGVidWcgJ3N0YXRpYzogbWFyayBhcyB3ZSBlbnRlciBvcGVyYXRvci1wZW5kaW5nJ1xuICAgICAgICAgIEBhZGRPY2N1cnJlbmNlUGF0dGVybigpIHVubGVzcyBAb2NjdXJyZW5jZU1hbmFnZXIuaGFzTWFya2VycygpXG4gICAgICB3aGVuICdwcmVzZXQnXG4gICAgICAgIGRlYnVnICdwcmVzZXQ6IG5vdGhpbmcgdG8gZG8gc2luY2Ugd2UgaGF2ZSBtYXJrZXJzIGFscmVhZHknXG4gICAgICB3aGVuICdtb2RpZmllcidcbiAgICAgICAgZGVidWcgJ21vZGlmaWVyOiBvdmVyd3JpdGUgZXhpc3RpbmcgbWFya2VyIHdoZW4gbWFudWFsbHkgdHlwZWQgYG9gJ1xuICAgICAgICBAb2NjdXJyZW5jZU1hbmFnZXIucmVzZXRQYXR0ZXJucygpICMgY2xlYXIgZXhpc3RpbmcgbWFya2VyXG4gICAgICAgIEBhZGRPY2N1cnJlbmNlUGF0dGVybigpICMgbWFyayBjdXJzb3Igd29yZC5cblxuICBhZGRPY2N1cnJlbmNlUGF0dGVybjogKHBhdHRlcm49bnVsbCkgLT5cbiAgICBwYXR0ZXJuID89IEBwYXR0ZXJuRm9yT2NjdXJyZW5jZVxuICAgIHVubGVzcyBwYXR0ZXJuP1xuICAgICAgcG9pbnQgPSBAZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgICAgcGF0dGVybiA9IGdldFdvcmRQYXR0ZXJuQXRCdWZmZXJQb3NpdGlvbihAZWRpdG9yLCBwb2ludCwgc2luZ2xlTm9uV29yZENoYXI6IHRydWUpXG4gICAgQG9jY3VycmVuY2VNYW5hZ2VyLmFkZFBhdHRlcm4ocGF0dGVybilcblxuICAjIHRhcmdldCBpcyBUZXh0T2JqZWN0IG9yIE1vdGlvbiB0byBvcGVyYXRlIG9uLlxuICBzZXRUYXJnZXQ6IChAdGFyZ2V0KSAtPlxuICAgIEB0YXJnZXQuc2V0T3BlcmF0b3IodGhpcylcbiAgICBAZW1pdERpZFNldFRhcmdldCh0aGlzKVxuICAgIHRoaXNcblxuICBzZXRUZXh0VG9SZWdpc3RlckZvclNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBAc2V0VGV4dFRvUmVnaXN0ZXIoc2VsZWN0aW9uLmdldFRleHQoKSwgc2VsZWN0aW9uKVxuXG4gIHNldFRleHRUb1JlZ2lzdGVyOiAodGV4dCwgc2VsZWN0aW9uKSAtPlxuICAgIHRleHQgKz0gXCJcXG5cIiBpZiAoQHRhcmdldC5pc0xpbmV3aXNlPygpIGFuZCAobm90IHRleHQuZW5kc1dpdGgoJ1xcbicpKSlcbiAgICBAdmltU3RhdGUucmVnaXN0ZXIuc2V0KHt0ZXh0LCBzZWxlY3Rpb259KSBpZiB0ZXh0XG5cbiAgIyBNYWluXG4gIGV4ZWN1dGU6IC0+XG4gICAgY2FuTXV0YXRlID0gdHJ1ZVxuICAgIHN0b3BNdXRhdGlvbiA9IC0+IGNhbk11dGF0ZSA9IGZhbHNlXG4gICAgaWYgQHNlbGVjdFRhcmdldCgpXG4gICAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKCkgd2hlbiBjYW5NdXRhdGVcbiAgICAgICAgICBAbXV0YXRlU2VsZWN0aW9uKHNlbGVjdGlvbiwgc3RvcE11dGF0aW9uKVxuICAgICAgQHJlc3RvcmVDdXJzb3JQb3NpdGlvbnNJZk5lY2Vzc2FyeSgpXG5cbiAgICAjIEV2ZW4gdGhvdWdoIHdlIGZhaWwgdG8gc2VsZWN0IHRhcmdldCBhbmQgZmFpbCB0byBtdXRhdGUsXG4gICAgIyB3ZSBoYXZlIHRvIHJldHVybiB0byBub3JtYWwtbW9kZSBmcm9tIG9wZXJhdG9yLXBlbmRpbmcgb3IgdmlzdWFsXG4gICAgQGFjdGl2YXRlTW9kZSgnbm9ybWFsJylcblxuICBzZWxlY3RPY2N1cnJlbmNlOiAtPlxuICAgIEBhZGRPY2N1cnJlbmNlUGF0dGVybigpIHVubGVzcyBAb2NjdXJyZW5jZU1hbmFnZXIuaGFzTWFya2VycygpXG5cbiAgICAjIFRvIHJlcG9lYXQoYC5gKSBvcGVyYXRpb24gd2hlcmUgbXVsdGlwbGUgb2NjdXJyZW5jZSBwYXR0ZXJucyB3YXMgc2V0LlxuICAgICMgSGVyZSB3ZSBzYXZlIHBhdHRlcm5zIHdoaWNoIHJlc3Jlc2VudCB1bmlvbmVkIHJlZ2V4IHdoaWNoIEBvY2N1cnJlbmNlTWFuYWdlciBrbm93cy5cbiAgICBAcGF0dGVybkZvck9jY3VycmVuY2UgPz0gQG9jY3VycmVuY2VNYW5hZ2VyLmJ1aWxkUGF0dGVybigpXG5cbiAgICBzZWxlY3RlZFJhbmdlcyA9IEBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXMoKVxuICAgIHJhbmdlcyA9IEBvY2N1cnJlbmNlTWFuYWdlci5nZXRNYXJrZXJSYW5nZXNJbnRlcnNlY3RzV2l0aFJhbmdlcyhzZWxlY3RlZFJhbmdlcywgQGlzTW9kZSgndmlzdWFsJykpXG4gICAgaWYgcmFuZ2VzLmxlbmd0aFxuICAgICAgQHZpbVN0YXRlLm1vZGVNYW5hZ2VyLmRlYWN0aXZhdGUoKSBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgQGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcyhyYW5nZXMpXG4gICAgZWxzZVxuICAgICAgQG11dGF0aW9uTWFuYWdlci5yZXN0b3JlSW5pdGlhbFBvc2l0aW9ucygpICMgUmVzdG9yZWluZyBwb3NpdGlvbiBhbHNvIGNsZWFyIHNlbGVjdGlvbi5cbiAgICBAb2NjdXJyZW5jZU1hbmFnZXIucmVzZXRQYXR0ZXJucygpXG5cbiAgIyBSZXR1cm4gdHJ1ZSB1bmxlc3MgYWxsIHNlbGVjdGlvbiBpcyBlbXB0eS5cbiAgc2VsZWN0VGFyZ2V0OiAtPlxuICAgIG9wdGlvbnMgPSB7aXNTZWxlY3Q6IEBpbnN0YW5jZW9mKCdTZWxlY3QnKSwgdXNlTWFya2VyOiBAdXNlTWFya2VyRm9yU3RheX1cbiAgICBAbXV0YXRpb25NYW5hZ2VyLmluaXQob3B0aW9ucylcbiAgICBAbXV0YXRpb25NYW5hZ2VyLnNldENoZWNrUG9pbnQoJ3dpbGwtc2VsZWN0JylcblxuICAgIEB0YXJnZXQuZm9yY2VXaXNlKEB3aXNlKSBpZiBAd2lzZSBhbmQgQHRhcmdldC5pc01vdGlvbigpXG4gICAgQGVtaXRXaWxsU2VsZWN0VGFyZ2V0KClcblxuICAgICMgVG8gdXNlIENVUlJFTlQgY3Vyc29yIHBvc2l0aW9uLCB0aGlzIGhhcyB0byBiZSBCRUZPUkUgQHRhcmdldC5zZWxlY3QoKSB3aGljaCBtb3ZlIGN1cnNvcnMuXG4gICAgaWYgQGlzT2NjdXJyZW5jZSgpIGFuZCBub3QgQG9jY3VycmVuY2VNYW5hZ2VyLmhhc01hcmtlcnMoKVxuICAgICAgQGFkZE9jY3VycmVuY2VQYXR0ZXJuKClcblxuICAgIEB0YXJnZXQuc2VsZWN0KClcbiAgICBpZiBAaXNPY2N1cnJlbmNlKClcbiAgICAgIEBzZWxlY3RPY2N1cnJlbmNlKClcblxuICAgIGlmIGhhdmVTb21lTm9uRW1wdHlTZWxlY3Rpb24oQGVkaXRvcikgb3IgQHRhcmdldC5nZXROYW1lKCkgaXMgXCJFbXB0eVwiXG4gICAgICBAbXV0YXRpb25NYW5hZ2VyLnNldENoZWNrUG9pbnQoJ2RpZC1zZWxlY3QnKVxuICAgICAgQGVtaXREaWRTZWxlY3RUYXJnZXQoKVxuICAgICAgQGZsYXNoQ2hhbmdlSWZOZWNlc3NhcnkoKVxuICAgICAgQHRyYWNrQ2hhbmdlSWZOZWNlc3NhcnkoKVxuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGZhbHNlXG5cbiAgcmVzdG9yZUN1cnNvclBvc2l0aW9uc0lmTmVjZXNzYXJ5OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHJlc3RvcmVQb3NpdGlvbnNcblxuICAgIG9wdGlvbnMgPVxuICAgICAgc3RheTogQG5lZWRTdGF5KClcbiAgICAgIHN0cmljdDogQGlzT2NjdXJyZW5jZSgpIG9yIEBkZXN0cm95VW5rbm93blNlbGVjdGlvblxuICAgICAgY2xpcFRvTXV0YXRpb25FbmQ6IEBjbGlwVG9NdXRhdGlvbkVuZE9uU3RheVxuICAgICAgaXNCbG9ja3dpc2U6IEB0YXJnZXQ/LmlzQmxvY2t3aXNlPygpXG4gICAgICBtdXRhdGlvbkVuZDogQHJlc3RvcmVQb3NpdGlvbnNUb011dGF0aW9uRW5kXG5cbiAgICBAbXV0YXRpb25NYW5hZ2VyLnJlc3RvcmVDdXJzb3JQb3NpdGlvbnMob3B0aW9ucylcbiAgICBAZW1pdERpZFJlc3RvcmVDdXJzb3JQb3NpdGlvbnMoKVxuXG4jIFNlbGVjdFxuIyBXaGVuIHRleHQtb2JqZWN0IGlzIGludm9rZWQgZnJvbSBub3JtYWwgb3Igdml1c2FsLW1vZGUsIG9wZXJhdGlvbiB3b3VsZCBiZVxuIyAgPT4gU2VsZWN0IG9wZXJhdG9yIHdpdGggdGFyZ2V0PXRleHQtb2JqZWN0XG4jIFdoZW4gbW90aW9uIGlzIGludm9rZWQgZnJvbSB2aXN1YWwtbW9kZSwgb3BlcmF0aW9uIHdvdWxkIGJlXG4jICA9PiBTZWxlY3Qgb3BlcmF0b3Igd2l0aCB0YXJnZXQ9bW90aW9uKVxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgU2VsZWN0IGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZChmYWxzZSlcbiAgZmxhc2hUYXJnZXQ6IGZhbHNlXG4gIHJlY29yZGFibGU6IGZhbHNlXG4gIGFjY2VwdFByZXNldE9jY3VycmVuY2U6IGZhbHNlXG4gIGFjY2VwdFBlcnNpc3RlbnRTZWxlY3Rpb246IGZhbHNlXG5cbiAgY2FuQ2hhbmdlTW9kZTogLT5cbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgQGlzT2NjdXJyZW5jZSgpIG9yIEB0YXJnZXQuaXNBbGxvd1N1Ym1vZGVDaGFuZ2U/KClcbiAgICBlbHNlXG4gICAgICB0cnVlXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBAc2VsZWN0VGFyZ2V0KClcbiAgICBpZiBAY2FuQ2hhbmdlTW9kZSgpXG4gICAgICBzdWJtb2RlID0gc3dyYXAuZGV0ZWN0VmlzdWFsTW9kZVN1Ym1vZGUoQGVkaXRvcilcbiAgICAgIEBhY3RpdmF0ZU1vZGVJZk5lY2Vzc2FyeSgndmlzdWFsJywgc3VibW9kZSlcblxuY2xhc3MgU2VsZWN0TGF0ZXN0Q2hhbmdlIGV4dGVuZHMgU2VsZWN0XG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiU2VsZWN0IGxhdGVzdCB5YW5rZWQgb3IgY2hhbmdlZCByYW5nZVwiXG4gIHRhcmdldDogJ0FMYXRlc3RDaGFuZ2UnXG5cbmNsYXNzIFNlbGVjdFByZXZpb3VzU2VsZWN0aW9uIGV4dGVuZHMgU2VsZWN0XG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6IFwiUHJldmlvdXNTZWxlY3Rpb25cIlxuICBleGVjdXRlOiAtPlxuICAgIEBzZWxlY3RUYXJnZXQoKVxuICAgIGlmIEB0YXJnZXQuc3VibW9kZT9cbiAgICAgIEBhY3RpdmF0ZU1vZGVJZk5lY2Vzc2FyeSgndmlzdWFsJywgQHRhcmdldC5zdWJtb2RlKVxuXG5jbGFzcyBTZWxlY3RQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgU2VsZWN0XG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiU2VsZWN0IHBlcnNpc3RlbnQtc2VsZWN0aW9uIGFuZCBjbGVhciBhbGwgcGVyc2lzdGVudC1zZWxlY3Rpb24sIGl0J3MgbGlrZSBjb252ZXJ0IHRvIHJlYWwtc2VsZWN0aW9uXCJcbiAgdGFyZ2V0OiBcIkFQZXJzaXN0ZW50U2VsZWN0aW9uXCJcblxuY2xhc3MgU2VsZWN0T2NjdXJyZW5jZSBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiQWRkIHNlbGVjdGlvbiBvbnRvIGVhY2ggbWF0Y2hpbmcgd29yZCB3aXRoaW4gdGFyZ2V0IHJhbmdlXCJcbiAgb2NjdXJyZW5jZTogdHJ1ZVxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgQG9uRGlkU2VsZWN0VGFyZ2V0ID0+XG4gICAgICBzd3JhcC5jbGVhclByb3BlcnRpZXMoQGVkaXRvcilcblxuICBleGVjdXRlOiAtPlxuICAgIGlmIEBzZWxlY3RUYXJnZXQoKVxuICAgICAgc3VibW9kZSA9IHN3cmFwLmRldGVjdFZpc3VhbE1vZGVTdWJtb2RlKEBlZGl0b3IpXG4gICAgICBAYWN0aXZhdGVNb2RlSWZOZWNlc3NhcnkoJ3Zpc3VhbCcsIHN1Ym1vZGUpXG5cbmNsYXNzIFNlbGVjdE9jY3VycmVuY2VJbkFGdW5jdGlvbk9ySW5uZXJQYXJhZ3JhcGggZXh0ZW5kcyBTZWxlY3RPY2N1cnJlbmNlXG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6IFwiQUZ1bmN0aW9uT3JJbm5lclBhcmFncmFwaFwiXG5cbiMgUmFuZ2UgTWFya2VyXG4jID09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIENyZWF0ZVBlcnNpc3RlbnRTZWxlY3Rpb24gZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKClcbiAgZmxhc2hUYXJnZXQ6IGZhbHNlXG4gIHN0YXlBdFNhbWVQb3NpdGlvbjogdHJ1ZVxuICBhY2NlcHRQcmVzZXRPY2N1cnJlbmNlOiBmYWxzZVxuICBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uOiBmYWxzZVxuXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBAcGVyc2lzdGVudFNlbGVjdGlvbi5tYXJrQnVmZmVyUmFuZ2Uoc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkpXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBAb25EaWRGaW5pc2hPcGVyYXRpb24gPT5cbiAgICAgIGRlc3Ryb3lOb25MYXN0U2VsZWN0aW9uKEBlZGl0b3IpXG4gICAgc3VwZXJcblxuY2xhc3MgVG9nZ2xlUGVyc2lzdGVudFNlbGVjdGlvbiBleHRlbmRzIENyZWF0ZVBlcnNpc3RlbnRTZWxlY3Rpb25cbiAgQGV4dGVuZCgpXG5cbiAgaXNDb21wbGV0ZTogLT5cbiAgICBwb2ludCA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgIGlmIEBtYXJrZXJUb1JlbW92ZSA9IEBwZXJzaXN0ZW50U2VsZWN0aW9uLmdldE1hcmtlckF0UG9pbnQocG9pbnQpXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgc3VwZXJcblxuICBleGVjdXRlOiAtPlxuICAgIGlmIEBtYXJrZXJUb1JlbW92ZVxuICAgICAgQG1hcmtlclRvUmVtb3ZlLmRlc3Ryb3koKVxuICAgIGVsc2VcbiAgICAgIHN1cGVyXG5cbiMgUHJlc2V0IE9jY3VycmVuY2VcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgVG9nZ2xlUHJlc2V0T2NjdXJyZW5jZSBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICBmbGFzaFRhcmdldDogZmFsc2VcbiAgcmVxdWlyZVRhcmdldDogZmFsc2VcbiAgc3RheUF0U2FtZVBvc2l0aW9uOiB0cnVlXG4gIGFjY2VwdFByZXNldE9jY3VycmVuY2U6IGZhbHNlXG5cbiAgZXhlY3V0ZTogLT5cbiAgICB7QG9jY3VycmVuY2VNYW5hZ2VyfSA9IEB2aW1TdGF0ZVxuICAgIGlmIG1hcmtlciA9IEBvY2N1cnJlbmNlTWFuYWdlci5nZXRNYXJrZXJBdFBvaW50KEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcbiAgICAgIG1hcmtlci5kZXN0cm95KClcbiAgICBlbHNlXG4gICAgICBwYXR0ZXJuID0gbnVsbFxuICAgICAgaXNOYXJyb3dlZCA9IEB2aW1TdGF0ZS5tb2RlTWFuYWdlci5pc05hcnJvd2VkKClcbiAgICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcpIGFuZCBub3QgaXNOYXJyb3dlZFxuICAgICAgICB0ZXh0ID0gQGVkaXRvci5nZXRTZWxlY3RlZFRleHQoKVxuICAgICAgICBwYXR0ZXJuID0gbmV3IFJlZ0V4cChfLmVzY2FwZVJlZ0V4cCh0ZXh0KSwgJ2cnKVxuXG4gICAgICBAYWRkT2NjdXJyZW5jZVBhdHRlcm4ocGF0dGVybilcbiAgICAgIEBhY3RpdmF0ZU1vZGUoJ25vcm1hbCcpIHVubGVzcyBpc05hcnJvd2VkXG5cbiMgRGVsZXRlXG4jID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBEZWxldGUgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKClcbiAgaG92ZXI6IGljb246ICc6ZGVsZXRlOicsIGVtb2ppOiAnOnNjaXNzb3JzOidcbiAgdHJhY2tDaGFuZ2U6IHRydWVcbiAgZmxhc2hUYXJnZXQ6IGZhbHNlXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBAb25EaWRTZWxlY3RUYXJnZXQgPT5cbiAgICAgIEByZXF1ZXN0QWRqdXN0Q3Vyc29yUG9zaXRpb25zKCkgaWYgQHRhcmdldC5pc0xpbmV3aXNlKClcbiAgICBzdXBlclxuXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgPT5cbiAgICBAc2V0VGV4dFRvUmVnaXN0ZXJGb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIHNlbGVjdGlvbi5kZWxldGVTZWxlY3RlZFRleHQoKVxuXG4gIHJlcXVlc3RBZGp1c3RDdXJzb3JQb3NpdGlvbnM6IC0+XG4gICAgQG9uRGlkUmVzdG9yZUN1cnNvclBvc2l0aW9ucyA9PlxuICAgICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgICAgICBAYWRqdXN0Q3Vyc29yKGN1cnNvcilcblxuICBhZGp1c3RDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgcm93ID0gZ2V0VmFsaWRWaW1CdWZmZXJSb3coQGVkaXRvciwgY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuICAgIGlmIEBuZWVkU3RheSgpXG4gICAgICBwb2ludCA9IEBtdXRhdGlvbk1hbmFnZXIuZ2V0SW5pdGlhbFBvaW50Rm9yU2VsZWN0aW9uKGN1cnNvci5zZWxlY3Rpb24pXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oW3JvdywgcG9pbnQuY29sdW1uXSlcbiAgICBlbHNlXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oW3JvdywgMF0pXG4gICAgICBjdXJzb3Iuc2tpcExlYWRpbmdXaGl0ZXNwYWNlKClcblxuY2xhc3MgRGVsZXRlUmlnaHQgZXh0ZW5kcyBEZWxldGVcbiAgQGV4dGVuZCgpXG4gIHRhcmdldDogJ01vdmVSaWdodCdcbiAgaG92ZXI6IG51bGxcblxuY2xhc3MgRGVsZXRlTGVmdCBleHRlbmRzIERlbGV0ZVxuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnTW92ZUxlZnQnXG5cbmNsYXNzIERlbGV0ZVRvTGFzdENoYXJhY3Rlck9mTGluZSBleHRlbmRzIERlbGV0ZVxuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnTW92ZVRvTGFzdENoYXJhY3Rlck9mTGluZSdcbiAgZXhlY3V0ZTogLT5cbiAgICAjIEVuc3VyZSBhbGwgc2VsZWN0aW9ucyB0byB1bi1yZXZlcnNlZFxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKVxuICAgICAgc3dyYXAuc2V0UmV2ZXJzZWRTdGF0ZShAZWRpdG9yLCBmYWxzZSlcbiAgICBzdXBlclxuXG5jbGFzcyBEZWxldGVMaW5lIGV4dGVuZHMgRGVsZXRlXG4gIEBleHRlbmQoKVxuICBAY29tbWFuZFNjb3BlOiAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzLnZpc3VhbC1tb2RlJ1xuICB3aXNlOiAnbGluZXdpc2UnXG5cbmNsYXNzIERlbGV0ZU9jY3VycmVuY2VJbkFGdW5jdGlvbk9ySW5uZXJQYXJhZ3JhcGggZXh0ZW5kcyBEZWxldGVcbiAgQGV4dGVuZCgpXG4gIG9jY3VycmVuY2U6IHRydWVcbiAgdGFyZ2V0OiBcIkFGdW5jdGlvbk9ySW5uZXJQYXJhZ3JhcGhcIlxuXG4jIFlhbmtcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgWWFuayBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICBob3ZlcjogaWNvbjogJzp5YW5rOicsIGVtb2ppOiAnOmNsaXBib2FyZDonXG4gIHRyYWNrQ2hhbmdlOiB0cnVlXG4gIHN0YXlPbkxpbmV3aXNlOiB0cnVlXG4gIGNsaXBUb011dGF0aW9uRW5kT25TdGF5OiBmYWxzZVxuXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBAc2V0VGV4dFRvUmVnaXN0ZXJGb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuXG5jbGFzcyBZYW5rTGluZSBleHRlbmRzIFlhbmtcbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcblxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgQHRhcmdldCA9ICdNb3ZlVG9SZWxhdGl2ZUxpbmUnIGlmIEBpc01vZGUoJ25vcm1hbCcpXG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnKVxuICAgICAgQHN0YXlPbkxpbmV3aXNlID0gZmFsc2VcblxuY2xhc3MgWWFua1RvTGFzdENoYXJhY3Rlck9mTGluZSBleHRlbmRzIFlhbmtcbiAgQGV4dGVuZCgpXG4gIHRhcmdldDogJ01vdmVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUnXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBbRklYTUU/XTogaW5jb25zaXN0ZW50IGJlaGF2aW9yIGZyb20gbm9ybWFsIG9wZXJhdG9yXG4jIFNpbmNlIGl0cyBzdXBwb3J0IHZpc3VhbC1tb2RlIGJ1dCBub3QgdXNlIHNldFRhcmdldCgpIGNvbnZlbnNpb24uXG4jIE1heWJlIHNlcGFyYXRpbmcgY29tcGxldGUvaW4tY29tcGxldGUgdmVyc2lvbiBsaWtlIEluY3JlYXNlTm93IGFuZCBJbmNyZWFzZT9cbmNsYXNzIEluY3JlYXNlIGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZCgpXG4gIHJlcXVpcmVUYXJnZXQ6IGZhbHNlXG4gIHN0ZXA6IDFcblxuICBleGVjdXRlOiAtPlxuICAgIHBhdHRlcm4gPSAvLy8je3NldHRpbmdzLmdldCgnbnVtYmVyUmVnZXgnKX0vLy9nXG5cbiAgICBuZXdSYW5nZXMgPSBbXVxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIGZvciBjdXJzb3IgaW4gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICAgICAgc2NhblJhbmdlID0gaWYgQGlzTW9kZSgndmlzdWFsJylcbiAgICAgICAgICBjdXJzb3Iuc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGN1cnNvci5nZXRDdXJyZW50TGluZUJ1ZmZlclJhbmdlKClcbiAgICAgICAgcmFuZ2VzID0gQGluY3JlYXNlTnVtYmVyKGN1cnNvciwgc2NhblJhbmdlLCBwYXR0ZXJuKVxuICAgICAgICBpZiBub3QgQGlzTW9kZSgndmlzdWFsJykgYW5kIHJhbmdlcy5sZW5ndGhcbiAgICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24gcmFuZ2VzWzBdLmVuZC50cmFuc2xhdGUoWzAsIC0xXSlcbiAgICAgICAgbmV3UmFuZ2VzLnB1c2ggcmFuZ2VzXG5cbiAgICBpZiAobmV3UmFuZ2VzID0gXy5mbGF0dGVuKG5ld1JhbmdlcykpLmxlbmd0aFxuICAgICAgQGZsYXNoSWZOZWNlc3NhcnkobmV3UmFuZ2VzKVxuICAgIGVsc2VcbiAgICAgIGF0b20uYmVlcCgpXG5cbiAgaW5jcmVhc2VOdW1iZXI6IChjdXJzb3IsIHNjYW5SYW5nZSwgcGF0dGVybikgLT5cbiAgICBuZXdSYW5nZXMgPSBbXVxuICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgcGF0dGVybiwgc2NhblJhbmdlLCAoe21hdGNoVGV4dCwgcmFuZ2UsIHN0b3AsIHJlcGxhY2V9KSA9PlxuICAgICAgbmV3VGV4dCA9IFN0cmluZyhwYXJzZUludChtYXRjaFRleHQsIDEwKSArIEBzdGVwICogQGdldENvdW50KCkpXG4gICAgICBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgICBuZXdSYW5nZXMucHVzaCByZXBsYWNlKG5ld1RleHQpXG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiB1bmxlc3MgcmFuZ2UuZW5kLmlzR3JlYXRlclRoYW4gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgbmV3UmFuZ2VzLnB1c2ggcmVwbGFjZShuZXdUZXh0KVxuICAgICAgICBzdG9wKClcbiAgICBuZXdSYW5nZXNcblxuY2xhc3MgRGVjcmVhc2UgZXh0ZW5kcyBJbmNyZWFzZVxuICBAZXh0ZW5kKClcbiAgc3RlcDogLTFcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBJbmNyZW1lbnROdW1iZXIgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKClcbiAgZGlzcGxheU5hbWU6ICdJbmNyZW1lbnQgKysnXG4gIHN0ZXA6IDFcbiAgYmFzZU51bWJlcjogbnVsbFxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgcGF0dGVybiA9IC8vLyN7c2V0dGluZ3MuZ2V0KCdudW1iZXJSZWdleCcpfS8vL2dcbiAgICBuZXdSYW5nZXMgPSBudWxsXG4gICAgQHNlbGVjdFRhcmdldCgpXG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgbmV3UmFuZ2VzID0gZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbigpXG4gICAgICAgIEByZXBsYWNlTnVtYmVyKHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLCBwYXR0ZXJuKVxuICAgIGlmIChuZXdSYW5nZXMgPSBfLmZsYXR0ZW4obmV3UmFuZ2VzKSkubGVuZ3RoXG4gICAgICBAZmxhc2hJZk5lY2Vzc2FyeShuZXdSYW5nZXMpXG4gICAgZWxzZVxuICAgICAgYXRvbS5iZWVwKClcbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBzZWxlY3Rpb24uY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0KVxuICAgIEBhY3RpdmF0ZU1vZGVJZk5lY2Vzc2FyeSgnbm9ybWFsJylcblxuICByZXBsYWNlTnVtYmVyOiAoc2NhblJhbmdlLCBwYXR0ZXJuKSAtPlxuICAgIG5ld1JhbmdlcyA9IFtdXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSBwYXR0ZXJuLCBzY2FuUmFuZ2UsICh7bWF0Y2hUZXh0LCByZXBsYWNlfSkgPT5cbiAgICAgIG5ld1Jhbmdlcy5wdXNoIHJlcGxhY2UoQGdldE5ld1RleHQobWF0Y2hUZXh0KSlcbiAgICBuZXdSYW5nZXNcblxuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICBAYmFzZU51bWJlciA9IGlmIEBiYXNlTnVtYmVyP1xuICAgICAgQGJhc2VOdW1iZXIgKyBAc3RlcCAqIEBnZXRDb3VudCgpXG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQodGV4dCwgMTApXG4gICAgU3RyaW5nKEBiYXNlTnVtYmVyKVxuXG5jbGFzcyBEZWNyZW1lbnROdW1iZXIgZXh0ZW5kcyBJbmNyZW1lbnROdW1iZXJcbiAgQGV4dGVuZCgpXG4gIGRpc3BsYXlOYW1lOiAnRGVjcmVtZW50IC0tJ1xuICBzdGVwOiAtMVxuXG4jIFB1dFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBQdXRCZWZvcmUgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKClcbiAgcmVzdG9yZVBvc2l0aW9uczogZmFsc2VcbiAgbG9jYXRpb246ICdiZWZvcmUnXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAdGFyZ2V0ID0gJ0VtcHR5JyBpZiBAaXNNb2RlKCdub3JtYWwnKVxuXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICB7dGV4dCwgdHlwZX0gPSBAdmltU3RhdGUucmVnaXN0ZXIuZ2V0KG51bGwsIHNlbGVjdGlvbilcbiAgICByZXR1cm4gdW5sZXNzIHRleHRcblxuICAgIHRleHQgPSBfLm11bHRpcGx5U3RyaW5nKHRleHQsIEBnZXRDb3VudCgpKVxuICAgIGxpbmV3aXNlID0gKHR5cGUgaXMgJ2xpbmV3aXNlJykgb3IgQGlzTW9kZSgndmlzdWFsJywgJ2xpbmV3aXNlJylcbiAgICBAcGFzdGUoc2VsZWN0aW9uLCB0ZXh0LCB7bGluZXdpc2UsIEBzZWxlY3RQYXN0ZWRUZXh0fSlcblxuICBwYXN0ZTogKHNlbGVjdGlvbiwgdGV4dCwge2xpbmV3aXNlLCBzZWxlY3RQYXN0ZWRUZXh0fSkgLT5cbiAgICB7Y3Vyc29yfSA9IHNlbGVjdGlvblxuICAgIGlmIGxpbmV3aXNlXG4gICAgICBuZXdSYW5nZSA9IEBwYXN0ZUxpbmV3aXNlKHNlbGVjdGlvbiwgdGV4dClcbiAgICAgIGFkanVzdEN1cnNvciA9IChyYW5nZSkgLT5cbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHJhbmdlLnN0YXJ0KVxuICAgICAgICBjdXJzb3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuICAgIGVsc2VcbiAgICAgIG5ld1JhbmdlID0gQHBhc3RlQ2hhcmFjdGVyd2lzZShzZWxlY3Rpb24sIHRleHQpXG4gICAgICBhZGp1c3RDdXJzb3IgPSAocmFuZ2UpIC0+XG4gICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihyYW5nZS5lbmQudHJhbnNsYXRlKFswLCAtMV0pKVxuXG4gICAgQHNldE1hcmtGb3JDaGFuZ2UobmV3UmFuZ2UpXG4gICAgaWYgc2VsZWN0UGFzdGVkVGV4dFxuICAgICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKG5ld1JhbmdlKVxuICAgIGVsc2VcbiAgICAgIGFkanVzdEN1cnNvcihuZXdSYW5nZSlcblxuICAjIFJldHVybiBuZXdSYW5nZVxuICBwYXN0ZUxpbmV3aXNlOiAoc2VsZWN0aW9uLCB0ZXh0KSAtPlxuICAgIHtjdXJzb3J9ID0gc2VsZWN0aW9uXG4gICAgdGV4dCArPSBcIlxcblwiIHVubGVzcyB0ZXh0LmVuZHNXaXRoKFwiXFxuXCIpXG4gICAgaWYgc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgcm93ID0gY3Vyc29yLmdldEJ1ZmZlclJvdygpXG4gICAgICBzd2l0Y2ggQGxvY2F0aW9uXG4gICAgICAgIHdoZW4gJ2JlZm9yZSdcbiAgICAgICAgICByYW5nZSA9IFtbcm93LCAwXSwgW3JvdywgMF1dXG4gICAgICAgIHdoZW4gJ2FmdGVyJ1xuICAgICAgICAgIHVubGVzcyBpc0VuZHNXaXRoTmV3TGluZUZvckJ1ZmZlclJvdyhAZWRpdG9yLCByb3cpXG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKExpbmVFbmRpbmdSZWdFeHAsICcnKVxuICAgICAgICAgIGN1cnNvci5tb3ZlVG9FbmRPZkxpbmUoKVxuICAgICAgICAgIHtlbmR9ID0gc2VsZWN0aW9uLmluc2VydFRleHQoXCJcXG5cIilcbiAgICAgICAgICByYW5nZSA9IEBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3coZW5kLnJvdywge2luY2x1ZGVOZXdsaW5lOiB0cnVlfSlcbiAgICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UsIHRleHQpXG4gICAgZWxzZVxuICAgICAgaWYgQGlzTW9kZSgndmlzdWFsJywgJ2xpbmV3aXNlJylcbiAgICAgICAgdW5sZXNzIHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLmVuZC5jb2x1bW4gaXMgMFxuICAgICAgICAgICMgUG9zc2libGUgaW4gbGFzdCBidWZmZXIgbGluZSBub3QgaGF2ZSBlbmRpbmcgbmV3TGluZVxuICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoTGluZUVuZGluZ1JlZ0V4cCwgJycpXG4gICAgICBlbHNlXG4gICAgICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KFwiXFxuXCIpXG4gICAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0KVxuXG4gIHBhc3RlQ2hhcmFjdGVyd2lzZTogKHNlbGVjdGlvbiwgdGV4dCkgLT5cbiAgICBpZiBAbG9jYXRpb24gaXMgJ2FmdGVyJyBhbmQgc2VsZWN0aW9uLmlzRW1wdHkoKSBhbmQgbm90IGN1cnNvcklzQXRFbXB0eVJvdyhzZWxlY3Rpb24uY3Vyc29yKVxuICAgICAgc2VsZWN0aW9uLmN1cnNvci5tb3ZlUmlnaHQoKVxuICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KHRleHQpXG5cbmNsYXNzIFB1dEFmdGVyIGV4dGVuZHMgUHV0QmVmb3JlXG4gIEBleHRlbmQoKVxuICBsb2NhdGlvbjogJ2FmdGVyJ1xuXG5jbGFzcyBQdXRCZWZvcmVBbmRTZWxlY3QgZXh0ZW5kcyBQdXRCZWZvcmVcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJQYXN0ZSBiZWZvcmUgdGhlbiBzZWxlY3RcIlxuICBzZWxlY3RQYXN0ZWRUZXh0OiB0cnVlXG5cbiAgYWN0aXZhdGVNb2RlOiAtPlxuICAgIHN1Ym1vZGUgPSBzd3JhcC5kZXRlY3RWaXN1YWxNb2RlU3VibW9kZShAZWRpdG9yKVxuICAgIHVubGVzcyBAdmltU3RhdGUuaXNNb2RlKCd2aXN1YWwnLCBzdWJtb2RlKVxuICAgICAgc3VwZXIoJ3Zpc3VhbCcsIHN1Ym1vZGUpXG5cbmNsYXNzIFB1dEFmdGVyQW5kU2VsZWN0IGV4dGVuZHMgUHV0QmVmb3JlQW5kU2VsZWN0XG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiUGFzdGUgYWZ0ZXIgdGhlbiBzZWxlY3RcIlxuICBsb2NhdGlvbjogJ2FmdGVyJ1xuXG4jIFtGSVhNRV0gdGhpcyBpcyBub3Qgb3BlcmF0b3JcbmNsYXNzIE1hcmsgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKClcbiAgIyBob3ZlcjogaWNvbjogJzptYXJrOicsIGVtb2ppOiAnOnJvdW5kX3B1c2hwaW46J1xuICByZXF1aXJlSW5wdXQ6IHRydWVcbiAgcmVxdWlyZVRhcmdldDogZmFsc2VcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBAZm9jdXNJbnB1dCgpXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBAdmltU3RhdGUubWFyay5zZXQoQGlucHV0LCBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgQGFjdGl2YXRlTW9kZSgnbm9ybWFsJylcbiJdfQ==
