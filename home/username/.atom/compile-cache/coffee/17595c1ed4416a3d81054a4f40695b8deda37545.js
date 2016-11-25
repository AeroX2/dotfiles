(function() {
  var ActivateNormalModeOnce, Base, BlockwiseOtherEnd, MiscCommand, Range, Redo, ReplaceModeBackspace, ReverseSelections, Scroll, ScrollCursor, ScrollCursorToBottom, ScrollCursorToBottomLeave, ScrollCursorToLeft, ScrollCursorToMiddle, ScrollCursorToMiddleLeave, ScrollCursorToRight, ScrollCursorToTop, ScrollCursorToTopLeave, ScrollDown, ScrollUp, ToggleFold, Undo, _, highlightRanges, mergeIntersectingRanges, moveCursorRight, pointIsAtEndOfLine, ref, settings, swrap,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Range = require('atom').Range;

  Base = require('./base');

  swrap = require('./selection-wrapper');

  settings = require('./settings');

  _ = require('underscore-plus');

  moveCursorRight = require('./utils').moveCursorRight;

  ref = require('./utils'), pointIsAtEndOfLine = ref.pointIsAtEndOfLine, mergeIntersectingRanges = ref.mergeIntersectingRanges, highlightRanges = ref.highlightRanges;

  MiscCommand = (function(superClass) {
    extend(MiscCommand, superClass);

    MiscCommand.extend(false);

    function MiscCommand() {
      MiscCommand.__super__.constructor.apply(this, arguments);
      this.initialize();
    }

    return MiscCommand;

  })(Base);

  ReverseSelections = (function(superClass) {
    extend(ReverseSelections, superClass);

    function ReverseSelections() {
      return ReverseSelections.__super__.constructor.apply(this, arguments);
    }

    ReverseSelections.extend();

    ReverseSelections.prototype.execute = function() {
      var i, len, ref1, results, reversed, selection;
      reversed = this.editor.getLastSelection().isReversed();
      ref1 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (selection.isReversed() === reversed) {
          results.push(swrap(selection).reverse());
        }
      }
      return results;
    };

    return ReverseSelections;

  })(MiscCommand);

  BlockwiseOtherEnd = (function(superClass) {
    extend(BlockwiseOtherEnd, superClass);

    function BlockwiseOtherEnd() {
      return BlockwiseOtherEnd.__super__.constructor.apply(this, arguments);
    }

    BlockwiseOtherEnd.extend();

    BlockwiseOtherEnd.prototype.execute = function() {
      var bs, i, len, ref1;
      ref1 = this.getBlockwiseSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        bs = ref1[i];
        bs.reverse();
      }
      return BlockwiseOtherEnd.__super__.execute.apply(this, arguments);
    };

    return BlockwiseOtherEnd;

  })(ReverseSelections);

  Undo = (function(superClass) {
    extend(Undo, superClass);

    function Undo() {
      return Undo.__super__.constructor.apply(this, arguments);
    }

    Undo.extend();

    Undo.prototype.saveRangeAsMarker = function(markers, range) {
      if (_.all(markers, function(m) {
        return !m.getBufferRange().intersectsWith(range);
      })) {
        return markers.push(this.editor.markBufferRange(range));
      }
    };

    Undo.prototype.trimEndOfLineRange = function(range) {
      var start;
      start = range.start;
      if ((start.column !== 0) && pointIsAtEndOfLine(this.editor, start)) {
        return range.traverse([+1, 0], [0, 0]);
      } else {
        return range;
      }
    };

    Undo.prototype.mapToChangedRanges = function(list, fn) {
      var ranges;
      ranges = list.map(function(e) {
        return fn(e);
      });
      return mergeIntersectingRanges(ranges).map((function(_this) {
        return function(r) {
          return _this.trimEndOfLineRange(r);
        };
      })(this));
    };

    Undo.prototype.mutateWithTrackingChanges = function(fn) {
      var disposable, firstAdded, lastRemoved, markersAdded, range, rangesAdded, rangesRemoved;
      markersAdded = [];
      rangesRemoved = [];
      disposable = this.editor.getBuffer().onDidChange((function(_this) {
        return function(arg) {
          var newRange, oldRange;
          oldRange = arg.oldRange, newRange = arg.newRange;
          if (!oldRange.isEmpty()) {
            rangesRemoved.push(oldRange);
          }
          if (!newRange.isEmpty()) {
            return _this.saveRangeAsMarker(markersAdded, newRange);
          }
        };
      })(this));
      this.mutate();
      disposable.dispose();
      rangesAdded = this.mapToChangedRanges(markersAdded, function(m) {
        return m.getBufferRange();
      });
      markersAdded.forEach(function(m) {
        return m.destroy();
      });
      rangesRemoved = this.mapToChangedRanges(rangesRemoved, function(r) {
        return r;
      });
      firstAdded = rangesAdded[0];
      lastRemoved = _.last(rangesRemoved);
      range = (firstAdded != null) && (lastRemoved != null) ? firstAdded.start.isLessThan(lastRemoved.start) ? firstAdded : lastRemoved : firstAdded || lastRemoved;
      if (range != null) {
        fn(range);
      }
      if (settings.get('flashOnUndoRedo')) {
        return this.onDidFinishOperation((function(_this) {
          return function() {
            _this.vimState.flash(rangesRemoved, {
              type: 'removed'
            });
            return _this.vimState.flash(rangesAdded, {
              type: 'added'
            });
          };
        })(this));
      }
    };

    Undo.prototype.execute = function() {
      var i, len, ref1, selection;
      this.mutateWithTrackingChanges((function(_this) {
        return function(range) {
          _this.vimState.mark.setRange('[', ']', range);
          if (settings.get('setCursorToStartOfChangeOnUndoRedo')) {
            return _this.editor.setCursorBufferPosition(range.start);
          }
        };
      })(this));
      ref1 = this.editor.getSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        selection.clear();
      }
      return this.activateMode('normal');
    };

    Undo.prototype.mutate = function() {
      return this.editor.undo();
    };

    return Undo;

  })(MiscCommand);

  Redo = (function(superClass) {
    extend(Redo, superClass);

    function Redo() {
      return Redo.__super__.constructor.apply(this, arguments);
    }

    Redo.extend();

    Redo.prototype.mutate = function() {
      return this.editor.redo();
    };

    return Redo;

  })(Undo);

  ToggleFold = (function(superClass) {
    extend(ToggleFold, superClass);

    function ToggleFold() {
      return ToggleFold.__super__.constructor.apply(this, arguments);
    }

    ToggleFold.extend();

    ToggleFold.prototype.execute = function() {
      var point;
      point = this.editor.getCursorBufferPosition();
      return this.editor.toggleFoldAtBufferRow(point.row);
    };

    return ToggleFold;

  })(MiscCommand);

  ReplaceModeBackspace = (function(superClass) {
    extend(ReplaceModeBackspace, superClass);

    function ReplaceModeBackspace() {
      return ReplaceModeBackspace.__super__.constructor.apply(this, arguments);
    }

    ReplaceModeBackspace.commandScope = 'atom-text-editor.vim-mode-plus.insert-mode.replace';

    ReplaceModeBackspace.extend();

    ReplaceModeBackspace.prototype.execute = function() {
      return this.editor.getSelections().forEach((function(_this) {
        return function(selection) {
          var char;
          char = _this.vimState.modeManager.getReplacedCharForSelection(selection);
          if (char != null) {
            selection.selectLeft();
            if (!selection.insertText(char).isEmpty()) {
              return selection.cursor.moveLeft();
            }
          }
        };
      })(this));
    };

    return ReplaceModeBackspace;

  })(MiscCommand);

  Scroll = (function(superClass) {
    extend(Scroll, superClass);

    function Scroll() {
      return Scroll.__super__.constructor.apply(this, arguments);
    }

    Scroll.extend(false);

    Scroll.prototype.scrolloff = 2;

    Scroll.prototype.cursorPixel = null;

    Scroll.prototype.getFirstVisibleScreenRow = function() {
      return this.editorElement.getFirstVisibleScreenRow();
    };

    Scroll.prototype.getLastVisibleScreenRow = function() {
      return this.editorElement.getLastVisibleScreenRow();
    };

    Scroll.prototype.getLastScreenRow = function() {
      return this.editor.getLastScreenRow();
    };

    Scroll.prototype.getCursorPixel = function() {
      var point;
      point = this.editor.getCursorScreenPosition();
      return this.editorElement.pixelPositionForScreenPosition(point);
    };

    return Scroll;

  })(MiscCommand);

  ScrollDown = (function(superClass) {
    extend(ScrollDown, superClass);

    function ScrollDown() {
      return ScrollDown.__super__.constructor.apply(this, arguments);
    }

    ScrollDown.extend();

    ScrollDown.prototype.execute = function() {
      var column, count, margin, newFirstRow, newPoint, oldFirstRow, ref1, row;
      count = this.getCount();
      oldFirstRow = this.editor.getFirstVisibleScreenRow();
      this.editor.setFirstVisibleScreenRow(oldFirstRow + count);
      newFirstRow = this.editor.getFirstVisibleScreenRow();
      margin = this.editor.getVerticalScrollMargin();
      ref1 = this.editor.getCursorScreenPosition(), row = ref1.row, column = ref1.column;
      if (row < (newFirstRow + margin)) {
        newPoint = [row + count, column];
        return this.editor.setCursorScreenPosition(newPoint, {
          autoscroll: false
        });
      }
    };

    return ScrollDown;

  })(Scroll);

  ScrollUp = (function(superClass) {
    extend(ScrollUp, superClass);

    function ScrollUp() {
      return ScrollUp.__super__.constructor.apply(this, arguments);
    }

    ScrollUp.extend();

    ScrollUp.prototype.execute = function() {
      var column, count, margin, newLastRow, newPoint, oldFirstRow, ref1, row;
      count = this.getCount();
      oldFirstRow = this.editor.getFirstVisibleScreenRow();
      this.editor.setFirstVisibleScreenRow(oldFirstRow - count);
      newLastRow = this.editor.getLastVisibleScreenRow();
      margin = this.editor.getVerticalScrollMargin();
      ref1 = this.editor.getCursorScreenPosition(), row = ref1.row, column = ref1.column;
      if (row >= (newLastRow - margin)) {
        newPoint = [row - count, column];
        return this.editor.setCursorScreenPosition(newPoint, {
          autoscroll: false
        });
      }
    };

    return ScrollUp;

  })(Scroll);

  ScrollCursor = (function(superClass) {
    extend(ScrollCursor, superClass);

    function ScrollCursor() {
      return ScrollCursor.__super__.constructor.apply(this, arguments);
    }

    ScrollCursor.extend(false);

    ScrollCursor.prototype.execute = function() {
      if (typeof this.moveToFirstCharacterOfLine === "function") {
        this.moveToFirstCharacterOfLine();
      }
      if (this.isScrollable()) {
        return this.editorElement.setScrollTop(this.getScrollTop());
      }
    };

    ScrollCursor.prototype.moveToFirstCharacterOfLine = function() {
      return this.editor.moveToFirstCharacterOfLine();
    };

    ScrollCursor.prototype.getOffSetPixelHeight = function(lineDelta) {
      if (lineDelta == null) {
        lineDelta = 0;
      }
      return this.editor.getLineHeightInPixels() * (this.scrolloff + lineDelta);
    };

    return ScrollCursor;

  })(Scroll);

  ScrollCursorToTop = (function(superClass) {
    extend(ScrollCursorToTop, superClass);

    function ScrollCursorToTop() {
      return ScrollCursorToTop.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToTop.extend();

    ScrollCursorToTop.prototype.isScrollable = function() {
      return this.getLastVisibleScreenRow() !== this.getLastScreenRow();
    };

    ScrollCursorToTop.prototype.getScrollTop = function() {
      return this.getCursorPixel().top - this.getOffSetPixelHeight();
    };

    return ScrollCursorToTop;

  })(ScrollCursor);

  ScrollCursorToTopLeave = (function(superClass) {
    extend(ScrollCursorToTopLeave, superClass);

    function ScrollCursorToTopLeave() {
      return ScrollCursorToTopLeave.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToTopLeave.extend();

    ScrollCursorToTopLeave.prototype.moveToFirstCharacterOfLine = null;

    return ScrollCursorToTopLeave;

  })(ScrollCursorToTop);

  ScrollCursorToBottom = (function(superClass) {
    extend(ScrollCursorToBottom, superClass);

    function ScrollCursorToBottom() {
      return ScrollCursorToBottom.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToBottom.extend();

    ScrollCursorToBottom.prototype.isScrollable = function() {
      return this.getFirstVisibleScreenRow() !== 0;
    };

    ScrollCursorToBottom.prototype.getScrollTop = function() {
      return this.getCursorPixel().top - (this.editorElement.getHeight() - this.getOffSetPixelHeight(1));
    };

    return ScrollCursorToBottom;

  })(ScrollCursor);

  ScrollCursorToBottomLeave = (function(superClass) {
    extend(ScrollCursorToBottomLeave, superClass);

    function ScrollCursorToBottomLeave() {
      return ScrollCursorToBottomLeave.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToBottomLeave.extend();

    ScrollCursorToBottomLeave.prototype.moveToFirstCharacterOfLine = null;

    return ScrollCursorToBottomLeave;

  })(ScrollCursorToBottom);

  ScrollCursorToMiddle = (function(superClass) {
    extend(ScrollCursorToMiddle, superClass);

    function ScrollCursorToMiddle() {
      return ScrollCursorToMiddle.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToMiddle.extend();

    ScrollCursorToMiddle.prototype.isScrollable = function() {
      return true;
    };

    ScrollCursorToMiddle.prototype.getScrollTop = function() {
      return this.getCursorPixel().top - (this.editorElement.getHeight() / 2);
    };

    return ScrollCursorToMiddle;

  })(ScrollCursor);

  ScrollCursorToMiddleLeave = (function(superClass) {
    extend(ScrollCursorToMiddleLeave, superClass);

    function ScrollCursorToMiddleLeave() {
      return ScrollCursorToMiddleLeave.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToMiddleLeave.extend();

    ScrollCursorToMiddleLeave.prototype.moveToFirstCharacterOfLine = null;

    return ScrollCursorToMiddleLeave;

  })(ScrollCursorToMiddle);

  ScrollCursorToLeft = (function(superClass) {
    extend(ScrollCursorToLeft, superClass);

    function ScrollCursorToLeft() {
      return ScrollCursorToLeft.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToLeft.extend();

    ScrollCursorToLeft.prototype.execute = function() {
      return this.editorElement.setScrollLeft(this.getCursorPixel().left);
    };

    return ScrollCursorToLeft;

  })(Scroll);

  ScrollCursorToRight = (function(superClass) {
    extend(ScrollCursorToRight, superClass);

    function ScrollCursorToRight() {
      return ScrollCursorToRight.__super__.constructor.apply(this, arguments);
    }

    ScrollCursorToRight.extend();

    ScrollCursorToRight.prototype.execute = function() {
      return this.editorElement.setScrollRight(this.getCursorPixel().left);
    };

    return ScrollCursorToRight;

  })(ScrollCursorToLeft);

  ActivateNormalModeOnce = (function(superClass) {
    extend(ActivateNormalModeOnce, superClass);

    function ActivateNormalModeOnce() {
      return ActivateNormalModeOnce.__super__.constructor.apply(this, arguments);
    }

    ActivateNormalModeOnce.extend();

    ActivateNormalModeOnce.commandScope = 'atom-text-editor.vim-mode-plus.insert-mode';

    ActivateNormalModeOnce.prototype.thisCommandName = ActivateNormalModeOnce.getCommandName();

    ActivateNormalModeOnce.prototype.execute = function() {
      var cursor, cursorsToMoveRight, disposable, i, len;
      cursorsToMoveRight = this.editor.getCursors().filter(function(cursor) {
        return !cursor.isAtBeginningOfLine();
      });
      this.vimState.activate('normal');
      for (i = 0, len = cursorsToMoveRight.length; i < len; i++) {
        cursor = cursorsToMoveRight[i];
        moveCursorRight(cursor);
      }
      return disposable = atom.commands.onDidDispatch((function(_this) {
        return function(arg) {
          var type;
          type = arg.type;
          if (type === _this.thisCommandName) {
            return;
          }
          disposable.dispose();
          disposable = null;
          return _this.vimState.activate('insert');
        };
      })(this));
    };

    return ActivateNormalModeOnce;

  })(MiscCommand);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvbWlzYy1jb21tYW5kLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsOGNBQUE7SUFBQTs7O0VBQUMsUUFBUyxPQUFBLENBQVEsTUFBUjs7RUFDVixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ1AsS0FBQSxHQUFRLE9BQUEsQ0FBUSxxQkFBUjs7RUFDUixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBQ1gsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxrQkFBbUIsT0FBQSxDQUFRLFNBQVI7O0VBRXBCLE1BSUksT0FBQSxDQUFRLFNBQVIsQ0FKSixFQUNFLDJDQURGLEVBRUUscURBRkYsRUFHRTs7RUFHSTs7O0lBQ0osV0FBQyxDQUFBLE1BQUQsQ0FBUSxLQUFSOztJQUNhLHFCQUFBO01BQ1gsOENBQUEsU0FBQTtNQUNBLElBQUMsQ0FBQSxVQUFELENBQUE7SUFGVzs7OztLQUZXOztFQU1wQjs7Ozs7OztJQUNKLGlCQUFDLENBQUEsTUFBRCxDQUFBOztnQ0FDQSxPQUFBLEdBQVMsU0FBQTtBQUVQLFVBQUE7TUFBQSxRQUFBLEdBQVcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUFBLENBQTBCLENBQUMsVUFBM0IsQ0FBQTtBQUNYO0FBQUE7V0FBQSxzQ0FBQTs7WUFBOEMsU0FBUyxDQUFDLFVBQVYsQ0FBQSxDQUFBLEtBQTBCO3VCQUN0RSxLQUFBLENBQU0sU0FBTixDQUFnQixDQUFDLE9BQWpCLENBQUE7O0FBREY7O0lBSE87Ozs7S0FGcUI7O0VBUTFCOzs7Ozs7O0lBQ0osaUJBQUMsQ0FBQSxNQUFELENBQUE7O2dDQUNBLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtBQUFBO0FBQUEsV0FBQSxzQ0FBQTs7UUFBQSxFQUFFLENBQUMsT0FBSCxDQUFBO0FBQUE7YUFD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QUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsYUFBYSxDQUFDLGNBQWYsQ0FBOEIsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUFpQixDQUFDLElBQWhEO0lBRE87Ozs7S0FIdUI7O0VBTTVCOzs7Ozs7O0lBQ0osc0JBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0Esc0JBQUMsQ0FBQSxZQUFELEdBQWU7O3FDQUNmLGVBQUEsR0FBaUIsc0JBQUMsQ0FBQSxjQUFELENBQUE7O3FDQUVqQixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7TUFBQSxrQkFBQSxHQUFxQixJQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQSxDQUFvQixDQUFDLE1BQXJCLENBQTRCLFNBQUMsTUFBRDtlQUFZLENBQUksTUFBTSxDQUFDLG1CQUFQLENBQUE7TUFBaEIsQ0FBNUI7TUFDckIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxRQUFWLENBQW1CLFFBQW5CO0FBQ0EsV0FBQSxvREFBQTs7UUFBQSxlQUFBLENBQWdCLE1BQWhCO0FBQUE7YUFDQSxVQUFBLEdBQWEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFkLENBQTRCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFEO0FBQ3ZDLGNBQUE7VUFEeUMsT0FBRDtVQUN4QyxJQUFVLElBQUEsS0FBUSxLQUFDLENBQUEsZUFBbkI7QUFBQSxtQkFBQTs7VUFDQSxVQUFVLENBQUMsT0FBWCxDQUFBO1VBQ0EsVUFBQSxHQUFhO2lCQUNiLEtBQUMsQ0FBQSxRQUFRLENBQUMsUUFBVixDQUFtQixRQUFuQjtRQUp1QztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBNUI7SUFKTjs7OztLQUwwQjtBQXhQckMiLCJzb3VyY2VzQ29udGVudCI6WyJ7UmFuZ2V9ID0gcmVxdWlyZSAnYXRvbSdcbkJhc2UgPSByZXF1aXJlICcuL2Jhc2UnXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue21vdmVDdXJzb3JSaWdodH0gPSByZXF1aXJlICcuL3V0aWxzJ1xuXG57XG4gIHBvaW50SXNBdEVuZE9mTGluZVxuICBtZXJnZUludGVyc2VjdGluZ1Jhbmdlc1xuICBoaWdobGlnaHRSYW5nZXNcbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuXG5jbGFzcyBNaXNjQ29tbWFuZCBleHRlbmRzIEJhc2VcbiAgQGV4dGVuZChmYWxzZSlcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgc3VwZXJcbiAgICBAaW5pdGlhbGl6ZSgpXG5cbmNsYXNzIFJldmVyc2VTZWxlY3Rpb25zIGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgIyBSZXZlcnNlIG9ubHkgc2VsZWN0aW9uIHdoaWNoIHJldmVyc2VkIHN0YXRlIGlzIGluLXN5bmMgdG8gbGFzdCBzZWxlY3Rpb24uXG4gICAgcmV2ZXJzZWQgPSBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5pc1JldmVyc2VkKClcbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpIHdoZW4gc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKSBpcyByZXZlcnNlZFxuICAgICAgc3dyYXAoc2VsZWN0aW9uKS5yZXZlcnNlKClcblxuY2xhc3MgQmxvY2t3aXNlT3RoZXJFbmQgZXh0ZW5kcyBSZXZlcnNlU2VsZWN0aW9uc1xuICBAZXh0ZW5kKClcbiAgZXhlY3V0ZTogLT5cbiAgICBicy5yZXZlcnNlKCkgZm9yIGJzIGluIEBnZXRCbG9ja3dpc2VTZWxlY3Rpb25zKClcbiAgICBzdXBlclxuXG5jbGFzcyBVbmRvIGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGV4dGVuZCgpXG5cbiAgc2F2ZVJhbmdlQXNNYXJrZXI6IChtYXJrZXJzLCByYW5nZSkgLT5cbiAgICBpZiBfLmFsbChtYXJrZXJzLCAobSkgLT4gbm90IG0uZ2V0QnVmZmVyUmFuZ2UoKS5pbnRlcnNlY3RzV2l0aChyYW5nZSkpXG4gICAgICBtYXJrZXJzLnB1c2ggQGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UpXG5cbiAgdHJpbUVuZE9mTGluZVJhbmdlOiAocmFuZ2UpIC0+XG4gICAge3N0YXJ0fSA9IHJhbmdlXG4gICAgaWYgKHN0YXJ0LmNvbHVtbiBpc250IDApIGFuZCBwb2ludElzQXRFbmRPZkxpbmUoQGVkaXRvciwgc3RhcnQpXG4gICAgICByYW5nZS50cmF2ZXJzZShbKzEsIDBdLCBbMCwgMF0pXG4gICAgZWxzZVxuICAgICAgcmFuZ2VcblxuICBtYXBUb0NoYW5nZWRSYW5nZXM6IChsaXN0LCBmbikgLT5cbiAgICByYW5nZXMgPSBsaXN0Lm1hcCAoZSkgLT4gZm4oZSlcbiAgICBtZXJnZUludGVyc2VjdGluZ1JhbmdlcyhyYW5nZXMpLm1hcCAocikgPT5cbiAgICAgIEB0cmltRW5kT2ZMaW5lUmFuZ2UocilcblxuICBtdXRhdGVXaXRoVHJhY2tpbmdDaGFuZ2VzOiAoZm4pIC0+XG4gICAgbWFya2Vyc0FkZGVkID0gW11cbiAgICByYW5nZXNSZW1vdmVkID0gW11cblxuICAgIGRpc3Bvc2FibGUgPSBAZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkQ2hhbmdlICh7b2xkUmFuZ2UsIG5ld1JhbmdlfSkgPT5cbiAgICAgICMgVG8gaGlnaGxpZ2h0KGRlY29yYXRlKSByZW1vdmVkIHJhbmdlLCBJIGRvbid0IHdhbnQgbWFya2VyJ3MgYXV0by10cmFja2luZy1yYW5nZS1jaGFuZ2UgZmVhdHVyZS5cbiAgICAgICMgU28gaGVyZSBJIHNpbXBseSB1c2UgcmFuZ2UgZm9yIHJlbW92YWxcbiAgICAgIHJhbmdlc1JlbW92ZWQucHVzaChvbGRSYW5nZSkgdW5sZXNzIG9sZFJhbmdlLmlzRW1wdHkoKVxuICAgICAgIyBGb3IgYWRkZWQgcmFuZ2UgSSB3YW50IG1hcmtlcidzIGF1dG8tdHJhY2tpbmctcmFuZ2UtY2hhbmdlIGZlYXR1cmUuXG4gICAgICBAc2F2ZVJhbmdlQXNNYXJrZXIobWFya2Vyc0FkZGVkLCBuZXdSYW5nZSkgdW5sZXNzIG5ld1JhbmdlLmlzRW1wdHkoKVxuICAgIEBtdXRhdGUoKVxuICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpXG5cbiAgICAjIEZJWE1FOiB0aGlzIGlzIHN0aWxsIG5vdCBjb21wbGV0ZWx5IGFjY3VyYXRlIGFuZCBoZWF2eSBhcHByb2FjaC5cbiAgICAjIFRvIGFjY3VyYXRlbHkgdHJhY2sgcmFuZ2UgdXBkYXRlZCwgbmVlZCB0byBhZGQvcmVtb3ZlIG1hbnVhbGx5LlxuICAgIHJhbmdlc0FkZGVkID0gQG1hcFRvQ2hhbmdlZFJhbmdlcyBtYXJrZXJzQWRkZWQsIChtKSAtPiBtLmdldEJ1ZmZlclJhbmdlKClcbiAgICBtYXJrZXJzQWRkZWQuZm9yRWFjaCAobSkgLT4gbS5kZXN0cm95KClcbiAgICByYW5nZXNSZW1vdmVkID0gQG1hcFRvQ2hhbmdlZFJhbmdlcyByYW5nZXNSZW1vdmVkLCAocikgLT4gclxuXG4gICAgZmlyc3RBZGRlZCA9IHJhbmdlc0FkZGVkWzBdXG4gICAgbGFzdFJlbW92ZWQgPSBfLmxhc3QocmFuZ2VzUmVtb3ZlZClcbiAgICByYW5nZSA9XG4gICAgICBpZiBmaXJzdEFkZGVkPyBhbmQgbGFzdFJlbW92ZWQ/XG4gICAgICAgIGlmIGZpcnN0QWRkZWQuc3RhcnQuaXNMZXNzVGhhbihsYXN0UmVtb3ZlZC5zdGFydClcbiAgICAgICAgICBmaXJzdEFkZGVkXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBsYXN0UmVtb3ZlZFxuICAgICAgZWxzZVxuICAgICAgICBmaXJzdEFkZGVkIG9yIGxhc3RSZW1vdmVkXG5cbiAgICBmbihyYW5nZSkgaWYgcmFuZ2U/XG4gICAgaWYgc2V0dGluZ3MuZ2V0KCdmbGFzaE9uVW5kb1JlZG8nKVxuICAgICAgQG9uRGlkRmluaXNoT3BlcmF0aW9uID0+XG4gICAgICAgIEB2aW1TdGF0ZS5mbGFzaChyYW5nZXNSZW1vdmVkLCB0eXBlOiAncmVtb3ZlZCcpXG4gICAgICAgIEB2aW1TdGF0ZS5mbGFzaChyYW5nZXNBZGRlZCwgdHlwZTogJ2FkZGVkJylcblxuICBleGVjdXRlOiAtPlxuICAgIEBtdXRhdGVXaXRoVHJhY2tpbmdDaGFuZ2VzIChyYW5nZSkgPT5cbiAgICAgIEB2aW1TdGF0ZS5tYXJrLnNldFJhbmdlKCdbJywgJ10nLCByYW5nZSlcbiAgICAgIGlmIHNldHRpbmdzLmdldCgnc2V0Q3Vyc29yVG9TdGFydE9mQ2hhbmdlT25VbmRvUmVkbycpXG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24ocmFuZ2Uuc3RhcnQpXG5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBzZWxlY3Rpb24uY2xlYXIoKVxuICAgIEBhY3RpdmF0ZU1vZGUoJ25vcm1hbCcpXG5cbiAgbXV0YXRlOiAtPlxuICAgIEBlZGl0b3IudW5kbygpXG5cbmNsYXNzIFJlZG8gZXh0ZW5kcyBVbmRvXG4gIEBleHRlbmQoKVxuICBtdXRhdGU6IC0+XG4gICAgQGVkaXRvci5yZWRvKClcblxuY2xhc3MgVG9nZ2xlRm9sZCBleHRlbmRzIE1pc2NDb21tYW5kXG4gIEBleHRlbmQoKVxuICBleGVjdXRlOiAtPlxuICAgIHBvaW50ID0gQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgQGVkaXRvci50b2dnbGVGb2xkQXRCdWZmZXJSb3cocG9pbnQucm93KVxuXG5jbGFzcyBSZXBsYWNlTW9kZUJhY2tzcGFjZSBleHRlbmRzIE1pc2NDb21tYW5kXG4gIEBjb21tYW5kU2NvcGU6ICdhdG9tLXRleHQtZWRpdG9yLnZpbS1tb2RlLXBsdXMuaW5zZXJ0LW1vZGUucmVwbGFjZSdcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgQGVkaXRvci5nZXRTZWxlY3Rpb25zKCkuZm9yRWFjaCAoc2VsZWN0aW9uKSA9PlxuICAgICAgIyBjaGFyIG1pZ2h0IGJlIGVtcHR5LlxuICAgICAgY2hhciA9IEB2aW1TdGF0ZS5tb2RlTWFuYWdlci5nZXRSZXBsYWNlZENoYXJGb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgICAgaWYgY2hhcj9cbiAgICAgICAgc2VsZWN0aW9uLnNlbGVjdExlZnQoKVxuICAgICAgICB1bmxlc3Mgc2VsZWN0aW9uLmluc2VydFRleHQoY2hhcikuaXNFbXB0eSgpXG4gICAgICAgICAgc2VsZWN0aW9uLmN1cnNvci5tb3ZlTGVmdCgpXG5cbiMgW0ZJWE1FXSBOYW1lIFNjcm9sbCBpcyBtaXNsZWFkaW5nLCBBZGp1c3RWaXNpYmxlQXJlYSBpcyBtb3JlIGV4cGxpY2l0LlxuY2xhc3MgU2Nyb2xsIGV4dGVuZHMgTWlzY0NvbW1hbmRcbiAgQGV4dGVuZChmYWxzZSlcbiAgc2Nyb2xsb2ZmOiAyICMgYXRvbSBkZWZhdWx0LiBCZXR0ZXIgdG8gdXNlIGVkaXRvci5nZXRWZXJ0aWNhbFNjcm9sbE1hcmdpbigpP1xuICBjdXJzb3JQaXhlbDogbnVsbFxuXG4gIGdldEZpcnN0VmlzaWJsZVNjcmVlblJvdzogLT5cbiAgICBAZWRpdG9yRWxlbWVudC5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuXG4gIGdldExhc3RWaXNpYmxlU2NyZWVuUm93OiAtPlxuICAgIEBlZGl0b3JFbGVtZW50LmdldExhc3RWaXNpYmxlU2NyZWVuUm93KClcblxuICBnZXRMYXN0U2NyZWVuUm93OiAtPlxuICAgIEBlZGl0b3IuZ2V0TGFzdFNjcmVlblJvdygpXG5cbiAgZ2V0Q3Vyc29yUGl4ZWw6IC0+XG4gICAgcG9pbnQgPSBAZWRpdG9yLmdldEN1cnNvclNjcmVlblBvc2l0aW9uKClcbiAgICBAZWRpdG9yRWxlbWVudC5waXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24ocG9pbnQpXG5cbiMgY3RybC1lIHNjcm9sbCBsaW5lcyBkb3dud2FyZHNcbmNsYXNzIFNjcm9sbERvd24gZXh0ZW5kcyBTY3JvbGxcbiAgQGV4dGVuZCgpXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBjb3VudCA9IEBnZXRDb3VudCgpXG4gICAgb2xkRmlyc3RSb3cgPSBAZWRpdG9yLmdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpXG4gICAgQGVkaXRvci5zZXRGaXJzdFZpc2libGVTY3JlZW5Sb3cob2xkRmlyc3RSb3cgKyBjb3VudClcbiAgICBuZXdGaXJzdFJvdyA9IEBlZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KClcblxuICAgIG1hcmdpbiA9IEBlZGl0b3IuZ2V0VmVydGljYWxTY3JvbGxNYXJnaW4oKVxuICAgIHtyb3csIGNvbHVtbn0gPSBAZWRpdG9yLmdldEN1cnNvclNjcmVlblBvc2l0aW9uKClcbiAgICBpZiByb3cgPCAobmV3Rmlyc3RSb3cgKyBtYXJnaW4pXG4gICAgICBuZXdQb2ludCA9IFtyb3cgKyBjb3VudCwgY29sdW1uXVxuICAgICAgQGVkaXRvci5zZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbihuZXdQb2ludCwgYXV0b3Njcm9sbDogZmFsc2UpXG5cbiMgY3RybC15IHNjcm9sbCBsaW5lcyB1cHdhcmRzXG5jbGFzcyBTY3JvbGxVcCBleHRlbmRzIFNjcm9sbFxuICBAZXh0ZW5kKClcblxuICBleGVjdXRlOiAtPlxuICAgIGNvdW50ID0gQGdldENvdW50KClcbiAgICBvbGRGaXJzdFJvdyA9IEBlZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgICBAZWRpdG9yLnNldEZpcnN0VmlzaWJsZVNjcmVlblJvdyhvbGRGaXJzdFJvdyAtIGNvdW50KVxuICAgIG5ld0xhc3RSb3cgPSBAZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KClcblxuICAgIG1hcmdpbiA9IEBlZGl0b3IuZ2V0VmVydGljYWxTY3JvbGxNYXJnaW4oKVxuICAgIHtyb3csIGNvbHVtbn0gPSBAZWRpdG9yLmdldEN1cnNvclNjcmVlblBvc2l0aW9uKClcbiAgICBpZiByb3cgPj0gKG5ld0xhc3RSb3cgLSBtYXJnaW4pXG4gICAgICBuZXdQb2ludCA9IFtyb3cgLSBjb3VudCwgY29sdW1uXVxuICAgICAgQGVkaXRvci5zZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbihuZXdQb2ludCwgYXV0b3Njcm9sbDogZmFsc2UpXG5cbiMgU2Nyb2xsIHdpdGhvdXQgQ3Vyc29yIFBvc2l0aW9uIGNoYW5nZS5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgU2Nyb2xsQ3Vyc29yIGV4dGVuZHMgU2Nyb2xsXG4gIEBleHRlbmQoZmFsc2UpXG4gIGV4ZWN1dGU6IC0+XG4gICAgQG1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lPygpXG4gICAgaWYgQGlzU2Nyb2xsYWJsZSgpXG4gICAgICBAZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxUb3AgQGdldFNjcm9sbFRvcCgpXG5cbiAgbW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmU6IC0+XG4gICAgQGVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG5cbiAgZ2V0T2ZmU2V0UGl4ZWxIZWlnaHQ6IChsaW5lRGVsdGE9MCkgLT5cbiAgICBAZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpICogKEBzY3JvbGxvZmYgKyBsaW5lRGVsdGEpXG5cbiMgeiBlbnRlclxuY2xhc3MgU2Nyb2xsQ3Vyc29yVG9Ub3AgZXh0ZW5kcyBTY3JvbGxDdXJzb3JcbiAgQGV4dGVuZCgpXG4gIGlzU2Nyb2xsYWJsZTogLT5cbiAgICBAZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKSBpc250IEBnZXRMYXN0U2NyZWVuUm93KClcblxuICBnZXRTY3JvbGxUb3A6IC0+XG4gICAgQGdldEN1cnNvclBpeGVsKCkudG9wIC0gQGdldE9mZlNldFBpeGVsSGVpZ2h0KClcblxuIyB6dFxuY2xhc3MgU2Nyb2xsQ3Vyc29yVG9Ub3BMZWF2ZSBleHRlbmRzIFNjcm9sbEN1cnNvclRvVG9wXG4gIEBleHRlbmQoKVxuICBtb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZTogbnVsbFxuXG4jIHotXG5jbGFzcyBTY3JvbGxDdXJzb3JUb0JvdHRvbSBleHRlbmRzIFNjcm9sbEN1cnNvclxuICBAZXh0ZW5kKClcbiAgaXNTY3JvbGxhYmxlOiAtPlxuICAgIEBnZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKSBpc250IDBcblxuICBnZXRTY3JvbGxUb3A6IC0+XG4gICAgQGdldEN1cnNvclBpeGVsKCkudG9wIC0gKEBlZGl0b3JFbGVtZW50LmdldEhlaWdodCgpIC0gQGdldE9mZlNldFBpeGVsSGVpZ2h0KDEpKVxuXG4jIHpiXG5jbGFzcyBTY3JvbGxDdXJzb3JUb0JvdHRvbUxlYXZlIGV4dGVuZHMgU2Nyb2xsQ3Vyc29yVG9Cb3R0b21cbiAgQGV4dGVuZCgpXG4gIG1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lOiBudWxsXG5cbiMgei5cbmNsYXNzIFNjcm9sbEN1cnNvclRvTWlkZGxlIGV4dGVuZHMgU2Nyb2xsQ3Vyc29yXG4gIEBleHRlbmQoKVxuICBpc1Njcm9sbGFibGU6IC0+XG4gICAgdHJ1ZVxuXG4gIGdldFNjcm9sbFRvcDogLT5cbiAgICBAZ2V0Q3Vyc29yUGl4ZWwoKS50b3AgLSAoQGVkaXRvckVsZW1lbnQuZ2V0SGVpZ2h0KCkgLyAyKVxuXG4jIHp6XG5jbGFzcyBTY3JvbGxDdXJzb3JUb01pZGRsZUxlYXZlIGV4dGVuZHMgU2Nyb2xsQ3Vyc29yVG9NaWRkbGVcbiAgQGV4dGVuZCgpXG4gIG1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lOiBudWxsXG5cbiMgSG9yaXpvbnRhbCBTY3JvbGxcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyB6c1xuY2xhc3MgU2Nyb2xsQ3Vyc29yVG9MZWZ0IGV4dGVuZHMgU2Nyb2xsXG4gIEBleHRlbmQoKVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgQGVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsTGVmdChAZ2V0Q3Vyc29yUGl4ZWwoKS5sZWZ0KVxuXG4jIHplXG5jbGFzcyBTY3JvbGxDdXJzb3JUb1JpZ2h0IGV4dGVuZHMgU2Nyb2xsQ3Vyc29yVG9MZWZ0XG4gIEBleHRlbmQoKVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgQGVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsUmlnaHQoQGdldEN1cnNvclBpeGVsKCkubGVmdClcblxuY2xhc3MgQWN0aXZhdGVOb3JtYWxNb2RlT25jZSBleHRlbmRzIE1pc2NDb21tYW5kXG4gIEBleHRlbmQoKVxuICBAY29tbWFuZFNjb3BlOiAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzLmluc2VydC1tb2RlJ1xuICB0aGlzQ29tbWFuZE5hbWU6IEBnZXRDb21tYW5kTmFtZSgpXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBjdXJzb3JzVG9Nb3ZlUmlnaHQgPSBAZWRpdG9yLmdldEN1cnNvcnMoKS5maWx0ZXIgKGN1cnNvcikgLT4gbm90IGN1cnNvci5pc0F0QmVnaW5uaW5nT2ZMaW5lKClcbiAgICBAdmltU3RhdGUuYWN0aXZhdGUoJ25vcm1hbCcpXG4gICAgbW92ZUN1cnNvclJpZ2h0KGN1cnNvcikgZm9yIGN1cnNvciBpbiBjdXJzb3JzVG9Nb3ZlUmlnaHRcbiAgICBkaXNwb3NhYmxlID0gYXRvbS5jb21tYW5kcy5vbkRpZERpc3BhdGNoICh7dHlwZX0pID0+XG4gICAgICByZXR1cm4gaWYgdHlwZSBpcyBAdGhpc0NvbW1hbmROYW1lXG4gICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgICAgZGlzcG9zYWJsZSA9IG51bGxcbiAgICAgIEB2aW1TdGF0ZS5hY3RpdmF0ZSgnaW5zZXJ0JylcbiJdfQ==
