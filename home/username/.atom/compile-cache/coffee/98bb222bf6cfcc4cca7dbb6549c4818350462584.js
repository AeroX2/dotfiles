(function() {
  var BlockwiseSelection, Range, _, getBufferRows, ref, sortRanges, swrap;

  Range = require('atom').Range;

  _ = require('underscore-plus');

  ref = require('./utils'), sortRanges = ref.sortRanges, getBufferRows = ref.getBufferRows;

  swrap = require('./selection-wrapper');

  BlockwiseSelection = (function() {
    BlockwiseSelection.prototype.editor = null;

    BlockwiseSelection.prototype.selections = null;

    BlockwiseSelection.prototype.goalColumn = null;

    BlockwiseSelection.prototype.reversed = false;

    function BlockwiseSelection(selection) {
      this.editor = selection.editor;
      this.initialize(selection);
    }

    BlockwiseSelection.prototype.getSelections = function() {
      return this.selections;
    };

    BlockwiseSelection.prototype.isBlockwise = function() {
      return true;
    };

    BlockwiseSelection.prototype.isEmpty = function() {
      return this.getSelections().every(function(selection) {
        return selection.isEmpty();
      });
    };

    BlockwiseSelection.prototype.initialize = function(selection) {
      var end, i, j, len, range, ranges, ref1, ref2, results, reversed, start, wasReversed;
      this.goalColumn = selection.cursor.goalColumn;
      this.selections = [selection];
      wasReversed = reversed = selection.isReversed();
      range = selection.getBufferRange();
      if (range.end.column === 0) {
        range.end.row = range.end.row - 1;
      }
      if (this.goalColumn != null) {
        if (wasReversed) {
          range.start.column = this.goalColumn;
        } else {
          range.end.column = this.goalColumn + 1;
        }
      }
      if (range.start.column >= range.end.column) {
        reversed = !reversed;
        range = range.translate([0, 1], [0, -1]);
      }
      start = range.start, end = range.end;
      ranges = (function() {
        results = [];
        for (var i = ref1 = start.row, ref2 = end.row; ref1 <= ref2 ? i <= ref2 : i >= ref2; ref1 <= ref2 ? i++ : i--){ results.push(i); }
        return results;
      }).apply(this).map(function(row) {
        return [[row, start.column], [row, end.column]];
      });
      selection.setBufferRange(ranges.shift(), {
        reversed: reversed
      });
      for (j = 0, len = ranges.length; j < len; j++) {
        range = ranges[j];
        this.selections.push(this.editor.addSelectionForBufferRange(range, {
          reversed: reversed
        }));
      }
      if (wasReversed) {
        this.reverse();
      }
      return this.updateGoalColumn();
    };

    BlockwiseSelection.prototype.isReversed = function() {
      return this.reversed;
    };

    BlockwiseSelection.prototype.reverse = function() {
      return this.reversed = !this.reversed;
    };

    BlockwiseSelection.prototype.updateGoalColumn = function() {
      var i, len, ref1, results, selection;
      if (this.goalColumn != null) {
        ref1 = this.selections;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          selection = ref1[i];
          results.push(selection.cursor.goalColumn = this.goalColumn);
        }
        return results;
      }
    };

    BlockwiseSelection.prototype.isSingleRow = function() {
      return this.selections.length === 1;
    };

    BlockwiseSelection.prototype.getHeight = function() {
      var endRow, ref1, startRow;
      ref1 = this.getBufferRowRange(), startRow = ref1[0], endRow = ref1[1];
      return (endRow - startRow) + 1;
    };

    BlockwiseSelection.prototype.getStartSelection = function() {
      return this.selections[0];
    };

    BlockwiseSelection.prototype.getEndSelection = function() {
      return _.last(this.selections);
    };

    BlockwiseSelection.prototype.getHeadSelection = function() {
      if (this.isReversed()) {
        return this.getStartSelection();
      } else {
        return this.getEndSelection();
      }
    };

    BlockwiseSelection.prototype.getTailSelection = function() {
      if (this.isReversed()) {
        return this.getEndSelection();
      } else {
        return this.getStartSelection();
      }
    };

    BlockwiseSelection.prototype.getHeadBufferPosition = function() {
      return this.getHeadSelection().getHeadBufferPosition();
    };

    BlockwiseSelection.prototype.getTailBufferPosition = function() {
      return this.getTailSelection().getTailBufferPosition();
    };

    BlockwiseSelection.prototype.getStartBufferPosition = function() {
      return this.getStartSelection().getBufferRange().start;
    };

    BlockwiseSelection.prototype.getEndBufferPosition = function() {
      return this.getStartSelection().getBufferRange().end;
    };

    BlockwiseSelection.prototype.getBufferRowRange = function() {
      var endRow, startRow;
      startRow = this.getStartSelection().getBufferRowRange()[0];
      endRow = this.getEndSelection().getBufferRowRange()[0];
      return [startRow, endRow];
    };

    BlockwiseSelection.prototype.headReversedStateIsInSync = function() {
      return this.isReversed() === this.getHeadSelection().isReversed();
    };

    BlockwiseSelection.prototype.setSelectedBufferRanges = function(ranges, arg) {
      var i, len, range, reversed;
      reversed = arg.reversed;
      sortRanges(ranges);
      range = ranges.shift();
      this.setHeadBufferRange(range, {
        reversed: reversed
      });
      for (i = 0, len = ranges.length; i < len; i++) {
        range = ranges[i];
        this.selections.push(this.editor.addSelectionForBufferRange(range, {
          reversed: reversed
        }));
      }
      return this.updateGoalColumn();
    };

    BlockwiseSelection.prototype.sortSelections = function() {
      var ref1;
      return (ref1 = this.selections) != null ? ref1.sort(function(a, b) {
        return a.compare(b);
      }) : void 0;
    };

    BlockwiseSelection.prototype.setPositionForSelections = function(which) {
      var i, len, ref1, results, selection;
      ref1 = this.selections;
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        results.push(swrap(selection).setBufferPositionTo(which));
      }
      return results;
    };

    BlockwiseSelection.prototype.clearSelections = function(arg) {
      var except, i, len, ref1, results, selection;
      except = (arg != null ? arg : {}).except;
      ref1 = this.selections.slice();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (selection !== except) {
          results.push(this.removeSelection(selection));
        }
      }
      return results;
    };

    BlockwiseSelection.prototype.setHeadBufferPosition = function(point) {
      var head;
      head = this.getHeadSelection();
      this.clearSelections({
        except: head
      });
      return head.cursor.setBufferPosition(point);
    };

    BlockwiseSelection.prototype.removeEmptySelections = function() {
      var i, len, ref1, results, selection;
      ref1 = this.selections.slice();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (selection.isEmpty()) {
          results.push(this.removeSelection(selection));
        }
      }
      return results;
    };

    BlockwiseSelection.prototype.removeSelection = function(selection) {
      _.remove(this.selections, selection);
      return selection.destroy();
    };

    BlockwiseSelection.prototype.setHeadBufferRange = function(range, options) {
      var base, goalColumn, head;
      head = this.getHeadSelection();
      this.clearSelections({
        except: head
      });
      goalColumn = head.cursor.goalColumn;
      head.setBufferRange(range, options);
      if (goalColumn != null) {
        return (base = head.cursor).goalColumn != null ? base.goalColumn : base.goalColumn = goalColumn;
      }
    };

    BlockwiseSelection.prototype.getCharacterwiseProperties = function() {
      var end, head, ref1, ref2, start, tail;
      head = this.getHeadBufferPosition();
      tail = this.getTailBufferPosition();
      if (this.isReversed()) {
        ref1 = [head, tail], start = ref1[0], end = ref1[1];
      } else {
        ref2 = [tail, head], start = ref2[0], end = ref2[1];
      }
      if (!(this.isSingleRow() || this.headReversedStateIsInSync())) {
        start.column -= 1;
        end.column += 1;
      }
      return {
        head: head,
        tail: tail
      };
    };

    BlockwiseSelection.prototype.getBufferRange = function() {
      var end, start;
      if (this.headReversedStateIsInSync()) {
        start = this.getStartSelection.getBufferrange().start;
        end = this.getEndSelection.getBufferrange().end;
      } else {
        start = this.getStartSelection.getBufferrange().end.translate([0, -1]);
        end = this.getEndSelection.getBufferrange().start.translate([0, +1]);
      }
      return {
        start: start,
        end: end
      };
    };

    BlockwiseSelection.prototype.restoreCharacterwise = function() {
      var base, goalColumn, head, properties;
      if (this.isEmpty()) {
        return;
      }
      properties = this.getCharacterwiseProperties();
      head = this.getHeadSelection();
      this.clearSelections({
        except: head
      });
      goalColumn = head.cursor.goalColumn;
      swrap(head).selectByProperties(properties);
      if (head.getBufferRange().end.column === 0) {
        swrap(head).translateSelectionEndAndClip('forward');
      }
      if (goalColumn != null) {
        return (base = head.cursor).goalColumn != null ? base.goalColumn : base.goalColumn = goalColumn;
      }
    };

    return BlockwiseSelection;

  })();

  module.exports = BlockwiseSelection;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvYmxvY2t3aXNlLXNlbGVjdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLFFBQVMsT0FBQSxDQUFRLE1BQVI7O0VBQ1YsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFFSixNQUE4QixPQUFBLENBQVEsU0FBUixDQUE5QixFQUFDLDJCQUFELEVBQWE7O0VBQ2IsS0FBQSxHQUFRLE9BQUEsQ0FBUSxxQkFBUjs7RUFFRjtpQ0FDSixNQUFBLEdBQVE7O2lDQUNSLFVBQUEsR0FBWTs7aUNBQ1osVUFBQSxHQUFZOztpQ0FDWixRQUFBLEdBQVU7O0lBRUcsNEJBQUMsU0FBRDtNQUNWLElBQUMsQ0FBQSxTQUFVLFVBQVY7TUFDRixJQUFDLENBQUEsVUFBRCxDQUFZLFNBQVo7SUFGVzs7aUNBSWIsYUFBQSxHQUFlLFNBQUE7YUFDYixJQUFDLENBQUE7SUFEWTs7aUNBR2YsV0FBQSxHQUFhLFNBQUE7YUFDWDtJQURXOztpQ0FHYixPQUFBLEdBQVMsU0FBQTthQUNQLElBQUMsQ0FBQSxhQUFELENBQUEsQ0FBZ0IsQ0FBQyxLQUFqQixDQUF1QixTQUFDLFNBQUQ7ZUFDckIsU0FBUyxDQUFDLE9BQVYsQ0FBQTtNQURxQixDQUF2QjtJQURPOztpQ0FJVCxVQUFBLEdBQVksU0FBQyxTQUFEO0FBQ1YsVUFBQTtNQUFDLElBQUMsQ0FBQSxhQUFjLFNBQVMsQ0FBQyxPQUF4QjtNQUNGLElBQUMsQ0FBQSxVQUFELEdBQWMsQ0FBQyxTQUFEO01BQ2QsV0FBQSxHQUFjLFFBQUEsR0FBVyxTQUFTLENBQUMsVUFBVixDQUFBO01BRXpCLEtBQUEsR0FBUSxTQUFTLENBQUMsY0FBVixDQUFBO01BQ1IsSUFBRyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQVYsS0FBb0IsQ0FBdkI7UUFDRSxLQUFLLENBQUMs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LENBQUMsR0FBRyxDQUFDLFNBQXhDLENBQWtELENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBTCxDQUFsRDtRQUNSLEdBQUEsR0FBTSxJQUFDLENBQUEsZUFBZSxDQUFDLGNBQWpCLENBQUEsQ0FBaUMsQ0FBQyxLQUFLLENBQUMsU0FBeEMsQ0FBa0QsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQWxELEVBTFI7O2FBTUE7UUFBQyxPQUFBLEtBQUQ7UUFBUSxLQUFBLEdBQVI7O0lBUGM7O2lDQVVoQixvQkFBQSxHQUFzQixTQUFBO0FBR3BCLFVBQUE7TUFBQSxJQUFVLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBVjtBQUFBLGVBQUE7O01BRUEsVUFBQSxHQUFhLElBQUMsQ0FBQSwwQkFBRCxDQUFBO01BQ2IsSUFBQSxHQUFPLElBQUMsQ0FBQSxnQkFBRCxDQUFBO01BQ1AsSUFBQyxDQUFBLGVBQUQsQ0FBaUI7UUFBQSxNQUFBLEVBQVEsSUFBUjtPQUFqQjtNQUNDLGFBQWMsSUFBSSxDQUFDO01BQ3BCLEtBQUEsQ0FBTSxJQUFOLENBQVcsQ0FBQyxrQkFBWixDQUErQixVQUEvQjtNQUVBLElBQUcsSUFBSSxDQUFDLGNBQUwsQ0FBQSxDQUFxQixDQUFDLEdBQUcsQ0FBQyxNQUExQixLQUFvQyxDQUF2QztRQUNFLEtBQUEsQ0FBTSxJQUFOLENBQVcsQ0FBQyw0QkFBWixDQUF5QyxTQUF6QyxFQURGOztNQUdBLElBQXdDLGtCQUF4Qzs2REFBVyxDQUFDLGlCQUFELENBQUMsYUFBYyxXQUExQjs7SUFkb0I7Ozs7OztFQWdCeEIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFyTWpCIiwic291cmNlc0NvbnRlbnQiOlsie1JhbmdlfSA9IHJlcXVpcmUgJ2F0b20nXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG57c29ydFJhbmdlcywgZ2V0QnVmZmVyUm93c30gPSByZXF1aXJlICcuL3V0aWxzJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuXG5jbGFzcyBCbG9ja3dpc2VTZWxlY3Rpb25cbiAgZWRpdG9yOiBudWxsXG4gIHNlbGVjdGlvbnM6IG51bGxcbiAgZ29hbENvbHVtbjogbnVsbFxuICByZXZlcnNlZDogZmFsc2VcblxuICBjb25zdHJ1Y3RvcjogKHNlbGVjdGlvbikgLT5cbiAgICB7QGVkaXRvcn0gPSBzZWxlY3Rpb25cbiAgICBAaW5pdGlhbGl6ZShzZWxlY3Rpb24pXG5cbiAgZ2V0U2VsZWN0aW9uczogLT5cbiAgICBAc2VsZWN0aW9uc1xuXG4gIGlzQmxvY2t3aXNlOiAtPlxuICAgIHRydWVcblxuICBpc0VtcHR5OiAtPlxuICAgIEBnZXRTZWxlY3Rpb25zKCkuZXZlcnkgKHNlbGVjdGlvbikgLT5cbiAgICAgIHNlbGVjdGlvbi5pc0VtcHR5KClcblxuICBpbml0aWFsaXplOiAoc2VsZWN0aW9uKSAtPlxuICAgIHtAZ29hbENvbHVtbn0gPSBzZWxlY3Rpb24uY3Vyc29yXG4gICAgQHNlbGVjdGlvbnMgPSBbc2VsZWN0aW9uXVxuICAgIHdhc1JldmVyc2VkID0gcmV2ZXJzZWQgPSBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG5cbiAgICByYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgaWYgcmFuZ2UuZW5kLmNvbHVtbiBpcyAwXG4gICAgICByYW5nZS5lbmQucm93ID0gcmFuZ2UuZW5kLnJvdyAtIDFcblxuICAgIGlmIEBnb2FsQ29sdW1uP1xuICAgICAgaWYgd2FzUmV2ZXJzZWRcbiAgICAgICAgcmFuZ2Uuc3RhcnQuY29sdW1uID0gQGdvYWxDb2x1bW5cbiAgICAgIGVsc2VcbiAgICAgICAgcmFuZ2UuZW5kLmNvbHVtbiA9IEBnb2FsQ29sdW1uICsgMVxuXG4gICAgaWYgcmFuZ2Uuc3RhcnQuY29sdW1uID49IHJhbmdlLmVuZC5jb2x1bW5cbiAgICAgIHJldmVyc2VkID0gbm90IHJldmVyc2VkXG4gICAgICByYW5nZSA9IHJhbmdlLnRyYW5zbGF0ZShbMCwgMV0sIFswLCAtMV0pXG5cbiAgICB7c3RhcnQsIGVuZH0gPSByYW5nZVxuICAgIHJhbmdlcyA9IFtzdGFydC5yb3cuLmVuZC5yb3ddLm1hcCAocm93KSAtPlxuICAgICAgW1tyb3csIHN0YXJ0LmNvbHVtbl0sIFtyb3csIGVuZC5jb2x1bW5dXVxuXG4gICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKHJhbmdlcy5zaGlmdCgpLCB7cmV2ZXJzZWR9KVxuICAgIGZvciByYW5nZSBpbiByYW5nZXNcbiAgICAgIEBzZWxlY3Rpb25zLnB1c2goQGVkaXRvci5hZGRTZWxlY3Rpb25Gb3JCdWZmZXJSYW5nZShyYW5nZSwge3JldmVyc2VkfSkpXG4gICAgQHJldmVyc2UoKSBpZiB3YXNSZXZlcnNlZFxuICAgIEB1cGRhdGVHb2FsQ29sdW1uKClcblxuICBpc1JldmVyc2VkOiAtPlxuICAgIEByZXZlcnNlZFxuXG4gIHJldmVyc2U6IC0+XG4gICAgQHJldmVyc2VkID0gbm90IEByZXZlcnNlZFxuXG4gIHVwZGF0ZUdvYWxDb2x1bW46IC0+XG4gICAgaWYgQGdvYWxDb2x1bW4/XG4gICAgICBmb3Igc2VsZWN0aW9uIGluIEBzZWxlY3Rpb25zXG4gICAgICAgIHNlbGVjdGlvbi5jdXJzb3IuZ29hbENvbHVtbiA9IEBnb2FsQ29sdW1uXG5cbiAgaXNTaW5nbGVSb3c6IC0+XG4gICAgQHNlbGVjdGlvbnMubGVuZ3RoIGlzIDFcblxuICBnZXRIZWlnaHQ6IC0+XG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gQGdldEJ1ZmZlclJvd1JhbmdlKClcbiAgICAoZW5kUm93IC0gc3RhcnRSb3cpICsgMVxuXG4gIGdldFN0YXJ0U2VsZWN0aW9uOiAtPlxuICAgIEBzZWxlY3Rpb25zWzBdXG5cbiAgZ2V0RW5kU2VsZWN0aW9uOiAtPlxuICAgIF8ubGFzdChAc2VsZWN0aW9ucylcblxuICBnZXRIZWFkU2VsZWN0aW9uOiAtPlxuICAgIGlmIEBpc1JldmVyc2VkKClcbiAgICAgIEBnZXRTdGFydFNlbGVjdGlvbigpXG4gICAgZWxzZVxuICAgICAgQGdldEVuZFNlbGVjdGlvbigpXG5cbiAgZ2V0VGFpbFNlbGVjdGlvbjogLT5cbiAgICBpZiBAaXNSZXZlcnNlZCgpXG4gICAgICBAZ2V0RW5kU2VsZWN0aW9uKClcbiAgICBlbHNlXG4gICAgICBAZ2V0U3RhcnRTZWxlY3Rpb24oKVxuXG4gIGdldEhlYWRCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBAZ2V0SGVhZFNlbGVjdGlvbigpLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG5cbiAgZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIEBnZXRUYWlsU2VsZWN0aW9uKCkuZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcblxuICBnZXRTdGFydEJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIEBnZXRTdGFydFNlbGVjdGlvbigpLmdldEJ1ZmZlclJhbmdlKCkuc3RhcnRcblxuICBnZXRFbmRCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBAZ2V0U3RhcnRTZWxlY3Rpb24oKS5nZXRCdWZmZXJSYW5nZSgpLmVuZFxuXG4gIGdldEJ1ZmZlclJvd1JhbmdlOiAtPlxuICAgIHN0YXJ0Um93ID0gQGdldFN0YXJ0U2VsZWN0aW9uKCkuZ2V0QnVmZmVyUm93UmFuZ2UoKVswXVxuICAgIGVuZFJvdyA9IEBnZXRFbmRTZWxlY3Rpb24oKS5nZXRCdWZmZXJSb3dSYW5nZSgpWzBdXG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddXG5cbiAgaGVhZFJldmVyc2VkU3RhdGVJc0luU3luYzogLT5cbiAgICBAaXNSZXZlcnNlZCgpIGlzIEBnZXRIZWFkU2VsZWN0aW9uKCkuaXNSZXZlcnNlZCgpXG5cbiAgIyBbTk9URV0gVXNlZCBieSBwbHVnaW4gcGFja2FnZSB2bXA6bW92ZS1zZWxlY3RlZC10ZXh0XG4gIHNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzOiAocmFuZ2VzLCB7cmV2ZXJzZWR9KSAtPlxuICAgIHNvcnRSYW5nZXMocmFuZ2VzKVxuICAgIHJhbmdlID0gcmFuZ2VzLnNoaWZ0KClcbiAgICBAc2V0SGVhZEJ1ZmZlclJhbmdlKHJhbmdlLCB7cmV2ZXJzZWR9KVxuICAgIGZvciByYW5nZSBpbiByYW5nZXNcbiAgICAgIEBzZWxlY3Rpb25zLnB1c2ggQGVkaXRvci5hZGRTZWxlY3Rpb25Gb3JCdWZmZXJSYW5nZShyYW5nZSwge3JldmVyc2VkfSlcbiAgICBAdXBkYXRlR29hbENvbHVtbigpXG5cbiAgc29ydFNlbGVjdGlvbnM6IC0+XG4gICAgQHNlbGVjdGlvbnM/LnNvcnQgKGEsIGIpIC0+IGEuY29tcGFyZShiKVxuXG4gICMgd2hpY2ggbXVzdCBvbmUgb2YgWydzdGFydCcsICdlbmQnLCAnaGVhZCcsICd0YWlsJ11cbiAgc2V0UG9zaXRpb25Gb3JTZWxlY3Rpb25zOiAod2hpY2gpIC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAc2VsZWN0aW9uc1xuICAgICAgc3dyYXAoc2VsZWN0aW9uKS5zZXRCdWZmZXJQb3NpdGlvblRvKHdoaWNoKVxuXG4gIGNsZWFyU2VsZWN0aW9uczogKHtleGNlcHR9PXt9KSAtPlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQHNlbGVjdGlvbnMuc2xpY2UoKSB3aGVuIChzZWxlY3Rpb24gaXNudCBleGNlcHQpXG4gICAgICBAcmVtb3ZlU2VsZWN0aW9uKHNlbGVjdGlvbilcblxuICBzZXRIZWFkQnVmZmVyUG9zaXRpb246IChwb2ludCkgLT5cbiAgICBoZWFkID0gQGdldEhlYWRTZWxlY3Rpb24oKVxuICAgIEBjbGVhclNlbGVjdGlvbnMoZXhjZXB0OiBoZWFkKVxuICAgIGhlYWQuY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gIHJlbW92ZUVtcHR5U2VsZWN0aW9uczogLT5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBzZWxlY3Rpb25zLnNsaWNlKCkgd2hlbiBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICBAcmVtb3ZlU2VsZWN0aW9uKHNlbGVjdGlvbilcblxuICByZW1vdmVTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgXy5yZW1vdmUoQHNlbGVjdGlvbnMsIHNlbGVjdGlvbilcbiAgICBzZWxlY3Rpb24uZGVzdHJveSgpXG5cbiAgc2V0SGVhZEJ1ZmZlclJhbmdlOiAocmFuZ2UsIG9wdGlvbnMpIC0+XG4gICAgaGVhZCA9IEBnZXRIZWFkU2VsZWN0aW9uKClcbiAgICBAY2xlYXJTZWxlY3Rpb25zKGV4Y2VwdDogaGVhZClcbiAgICB7Z29hbENvbHVtbn0gPSBoZWFkLmN1cnNvclxuICAgICMgV2hlbiByZXZlcnNlZCBzdGF0ZSBvZiBzZWxlY3Rpb24gY2hhbmdlLCBnb2FsQ29sdW1uIGlzIGNsZWFyZWQuXG4gICAgIyBCdXQgaGVyZSBmb3IgYmxvY2t3aXNlLCBJIHdhbnQgdG8ga2VlcCBnb2FsQ29sdW1uIHVuY2hhbmdlZC5cbiAgICAjIFRoaXMgYmVoYXZpb3IgaXMgbm90IGlkZW50aWNhbCB0byBwdXJlIFZpbSBJIGtub3cuXG4gICAgIyBCdXQgSSBiZWxpZXZlIHRoaXMgaXMgbW9yZSB1bm5vaXN5IGFuZCBsZXNzIGNvbmZ1c2lvbiB3aGlsZSBtb3ZpbmdcbiAgICAjIGN1cnNvciBpbiB2aXN1YWwtYmxvY2sgbW9kZS5cbiAgICBoZWFkLnNldEJ1ZmZlclJhbmdlKHJhbmdlLCBvcHRpb25zKVxuICAgIGhlYWQuY3Vyc29yLmdvYWxDb2x1bW4gPz0gZ29hbENvbHVtbiBpZiBnb2FsQ29sdW1uP1xuXG4gIGdldENoYXJhY3Rlcndpc2VQcm9wZXJ0aWVzOiAtPlxuICAgIGhlYWQgPSBAZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcbiAgICB0YWlsID0gQGdldFRhaWxCdWZmZXJQb3NpdGlvbigpXG5cbiAgICBpZiBAaXNSZXZlcnNlZCgpXG4gICAgICBbc3RhcnQsIGVuZF0gPSBbaGVhZCwgdGFpbF1cbiAgICBlbHNlXG4gICAgICBbc3RhcnQsIGVuZF0gPSBbdGFpbCwgaGVhZF1cblxuICAgIHVubGVzcyAoQGlzU2luZ2xlUm93KCkgb3IgQGhlYWRSZXZlcnNlZFN0YXRlSXNJblN5bmMoKSlcbiAgICAgIHN0YXJ0LmNvbHVtbiAtPSAxXG4gICAgICBlbmQuY29sdW1uICs9IDFcbiAgICB7aGVhZCwgdGFpbH1cblxuICBnZXRCdWZmZXJSYW5nZTogLT5cbiAgICBpZiBAaGVhZFJldmVyc2VkU3RhdGVJc0luU3luYygpXG4gICAgICBzdGFydCA9IEBnZXRTdGFydFNlbGVjdGlvbi5nZXRCdWZmZXJyYW5nZSgpLnN0YXJ0XG4gICAgICBlbmQgPSBAZ2V0RW5kU2VsZWN0aW9uLmdldEJ1ZmZlcnJhbmdlKCkuZW5kXG4gICAgZWxzZVxuICAgICAgc3RhcnQgPSBAZ2V0U3RhcnRTZWxlY3Rpb24uZ2V0QnVmZmVycmFuZ2UoKS5lbmQudHJhbnNsYXRlKFswLCAtMV0pXG4gICAgICBlbmQgPSBAZ2V0RW5kU2VsZWN0aW9uLmdldEJ1ZmZlcnJhbmdlKCkuc3RhcnQudHJhbnNsYXRlKFswLCArMV0pXG4gICAge3N0YXJ0LCBlbmR9XG5cbiAgIyBbRklYTUVdIGR1cGxpY2F0ZSBjb2RlcyB3aXRoIHNldEhlYWRCdWZmZXJSYW5nZVxuICByZXN0b3JlQ2hhcmFjdGVyd2lzZTogLT5cbiAgICAjIFdoZW4gYWxsIHNlbGVjdGlvbiBpcyBlbXB0eSwgd2UgZG9uJ3Qgd2FudCB0byBsb29zZSBtdWx0aS1jdXJzb3JcbiAgICAjIGJ5IHJlc3RvcmVpbmcgY2hhcmFjdGVyd2lzZSByYW5nZS5cbiAgICByZXR1cm4gaWYgQGlzRW1wdHkoKVxuXG4gICAgcHJvcGVydGllcyA9IEBnZXRDaGFyYWN0ZXJ3aXNlUHJvcGVydGllcygpXG4gICAgaGVhZCA9IEBnZXRIZWFkU2VsZWN0aW9uKClcbiAgICBAY2xlYXJTZWxlY3Rpb25zKGV4Y2VwdDogaGVhZClcbiAgICB7Z29hbENvbHVtbn0gPSBoZWFkLmN1cnNvclxuICAgIHN3cmFwKGhlYWQpLnNlbGVjdEJ5UHJvcGVydGllcyhwcm9wZXJ0aWVzKVxuXG4gICAgaWYgaGVhZC5nZXRCdWZmZXJSYW5nZSgpLmVuZC5jb2x1bW4gaXMgMFxuICAgICAgc3dyYXAoaGVhZCkudHJhbnNsYXRlU2VsZWN0aW9uRW5kQW5kQ2xpcCgnZm9yd2FyZCcpXG5cbiAgICBoZWFkLmN1cnNvci5nb2FsQ29sdW1uID89IGdvYWxDb2x1bW4gaWYgZ29hbENvbHVtbj9cblxubW9kdWxlLmV4cG9ydHMgPSBCbG9ja3dpc2VTZWxlY3Rpb25cbiJdfQ==
