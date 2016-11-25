(function() {
  var Disposable, Point, Range, SelectionWrapper, _, getRangeByTranslatePointAndClip, propertyStore, ref, ref1, swrap, translatePointAndClip;

  _ = require('underscore-plus');

  ref = require('atom'), Range = ref.Range, Point = ref.Point, Disposable = ref.Disposable;

  ref1 = require('./utils'), translatePointAndClip = ref1.translatePointAndClip, getRangeByTranslatePointAndClip = ref1.getRangeByTranslatePointAndClip;

  propertyStore = new Map;

  SelectionWrapper = (function() {
    function SelectionWrapper(selection1) {
      this.selection = selection1;
    }

    SelectionWrapper.prototype.hasProperties = function() {
      return propertyStore.has(this.selection);
    };

    SelectionWrapper.prototype.getProperties = function() {
      var ref2;
      return (ref2 = propertyStore.get(this.selection)) != null ? ref2 : {};
    };

    SelectionWrapper.prototype.setProperties = function(prop) {
      return propertyStore.set(this.selection, prop);
    };

    SelectionWrapper.prototype.clearProperties = function() {
      return propertyStore["delete"](this.selection);
    };

    SelectionWrapper.prototype.setBufferRangeSafely = function(range) {
      if (range) {
        this.setBufferRange(range);
        if (this.selection.isLastSelection()) {
          return this.selection.cursor.autoscroll();
        }
      }
    };

    SelectionWrapper.prototype.getBufferRange = function() {
      return this.selection.getBufferRange();
    };

    SelectionWrapper.prototype.getNormalizedBufferPosition = function() {
      var editor, point, screenPoint;
      point = this.selection.getHeadBufferPosition();
      if (this.isForwarding()) {
        editor = this.selection.editor;
        screenPoint = editor.screenPositionForBufferPosition(point).translate([0, -1]);
        return editor.bufferPositionForScreenPosition(screenPoint, {
          clipDirection: 'backward'
        });
      } else {
        return point;
      }
    };

    SelectionWrapper.prototype.normalizeBufferPosition = function() {
      var head, point;
      head = this.selection.getHeadBufferPosition();
      point = this.getNormalizedBufferPosition();
      this.selection.modifySelection((function(_this) {
        return function() {
          return _this.selection.cursor.setBufferPosition(point);
        };
      })(this));
      return new Disposable((function(_this) {
        return function() {
          if (!head.isEqual(point)) {
            return _this.selection.modifySelection(function() {
              return _this.selection.cursor.setBufferPosition(head);
            });
          }
        };
      })(this));
    };

    SelectionWrapper.prototype.getBufferPositionFor = function(which, arg) {
      var allowFallback, end, fromProperty, head, ref2, ref3, ref4, ref5, ref6, start, tail;
      ref2 = arg != null ? arg : {}, fromProperty = ref2.fromProperty, allowFallback = ref2.allowFallback;
      if (fromProperty == null) {
        fromProperty = false;
      }
      if (allowFallback == null) {
        allowFallback = false;
      }
      if (fromProperty && (!this.hasProperties()) && allowFallback) {
        fromProperty = false;
      }
      if (fromProperty) {
        ref3 = this.getProperties(), head = ref3.head, tail = ref3.tail;
        if (head.isGreaterThanOrEqual(tail)) {
          ref4 = [tail, head], start = ref4[0], end = ref4[1];
        } else {
          ref5 = [head, tail], start = ref5[0], end = ref5[1];
        }
      } else {
        ref6 = this.selection.getBufferRange(), start = ref6.start, end = ref6.end;
        head = this.selection.getHeadBufferPosition();
        tail = this.selection.getTailBufferPosition();
      }
      switch (which) {
        case 'start':
          return start;
        case 'end':
          return end;
        case 'head':
          return head;
        case 'tail':
          return tail;
      }
    };

    SelectionWrapper.prototype.setBufferPositionTo = function(which, options) {
      var point;
      point = this.getBufferPositionFor(which, options);
      return this.selection.cursor.setBufferPosition(point);
    };

    SelectionWrapper.prototype.mergeBufferRange = function(range, option) {
      return this.setBufferRange(this.getBufferRange().union(range), option);
    };

    SelectionWrapper.prototype.reverse = function() {
      var head, ref2, tail;
      this.setReversedState(!this.selection.isReversed());
      ref2 = this.getProperties(), head = ref2.head, tail = ref2.tail;
      if ((head != null) && (tail != null)) {
        return this.setProperties({
          head: tail,
          tail: head
        });
      }
    };

    SelectionWrapper.prototype.setReversedState = function(reversed) {
      var options;
      options = {
        autoscroll: true,
        reversed: reversed,
        preserveFolds: true
      };
      return this.setBufferRange(this.getBufferRange(), options);
    };

    SelectionWrapper.prototype.getRows = function() {
      var endRow, i, ref2, results1, startRow;
      ref2 = this.selection.getBufferRowRange(), startRow = ref2[0], endRow = ref2[1];
      return (function() {
        results1 = [];
        for (var i = startRow; startRow <= endRow ? i <= endRow : i >= endRow; startRow <= endRow ? i++ : i--){ results1.push(i); }
        return results1;
      }).apply(this);
    };

    SelectionWrapper.prototype.getRowCount = function() {
      return this.getRows().length;
    };

    SelectionWrapper.prototype.selectRowRange = function(rowRange) {
      var editor, endRange, range, ref2, startRange;
      editor = this.selection.editor;
      ref2 = rowRange.map(function(row) {
        return editor.bufferRangeForBufferRow(row, {
          includeNewline: true
        });
      }), startRange = ref2[0], endRange = ref2[1];
      range = startRange.union(endRange);
      return this.setBufferRange(range, {
        preserveFolds: true
      });
    };

    SelectionWrapper.prototype.expandOverLine = function(arg) {
      var goalColumn, preserveGoalColumn;
      preserveGoalColumn = (arg != null ? arg : {}).preserveGoalColumn;
      if (preserveGoalColumn) {
        goalColumn = this.selection.cursor.goalColumn;
      }
      this.selectRowRange(this.selection.getBufferRowRange());
      if (goalColumn) {
        return this.selection.cursor.goalColumn = goalColumn;
      }
    };

    SelectionWrapper.prototype.getRowFor = function(where) {
      var endRow, headRow, ref2, ref3, ref4, startRow, tailRow;
      ref2 = this.selection.getBufferRowRange(), startRow = ref2[0], endRow = ref2[1];
      if (!this.selection.isReversed()) {
        ref3 = [startRow, endRow], headRow = ref3[0], tailRow = ref3[1];
      } else {
        ref4 = [endRow, startRow], headRow = ref4[0], tailRow = ref4[1];
      }
      switch (where) {
        case 'start':
          return startRow;
        case 'end':
          return endRow;
        case 'head':
          return headRow;
        case 'tail':
          return tailRow;
      }
    };

    SelectionWrapper.prototype.getHeadRow = function() {
      return this.getRowFor('head');
    };

    SelectionWrapper.prototype.getTailRow = function() {
      return this.getRowFor('tail');
    };

    SelectionWrapper.prototype.getStartRow = function() {
      return this.getRowFor('start');
    };

    SelectionWrapper.prototype.getEndRow = function() {
      return this.getRowFor('end');
    };

    SelectionWrapper.prototype.getTailBufferRange = function() {
      var editor, point, tailPoint;
      editor = this.selection.editor;
      tailPoint = this.selection.getTailBufferPosition();
      if (this.selection.isReversed()) {
        point = translatePointAndClip(editor, tailPoint, 'backward');
        return new Range(point, tailPoint);
      } else {
        point = translatePointAndClip(editor, tailPoint, 'forward', {
          hello: 'when getting tailRange'
        });
        return new Range(tailPoint, point);
      }
    };

    SelectionWrapper.prototype.saveProperties = function() {
      var endPoint, properties;
      properties = this.captureProperties();
      if (!this.selection.isEmpty()) {
        endPoint = this.selection.getBufferRange().end.translate([0, -1]);
        endPoint = this.selection.editor.clipBufferPosition(endPoint);
        if (this.selection.isReversed()) {
          properties.tail = endPoint;
        } else {
          properties.head = endPoint;
        }
      }
      return this.setProperties(properties);
    };

    SelectionWrapper.prototype.captureProperties = function() {
      return {
        head: this.selection.getHeadBufferPosition(),
        tail: this.selection.getTailBufferPosition()
      };
    };

    SelectionWrapper.prototype.selectByProperties = function(arg) {
      var head, tail;
      head = arg.head, tail = arg.tail;
      this.setBufferRange([tail, head]);
      return this.setReversedState(head.isLessThan(tail));
    };

    SelectionWrapper.prototype.isForwarding = function() {
      var head, tail;
      head = this.selection.getHeadBufferPosition();
      tail = this.selection.getTailBufferPosition();
      return head.isGreaterThan(tail);
    };

    SelectionWrapper.prototype.restoreColumnFromProperties = function() {
      var end, head, ref2, ref3, ref4, ref5, start, tail;
      ref2 = this.getProperties(), head = ref2.head, tail = ref2.tail;
      if (!((head != null) && (tail != null))) {
        return;
      }
      if (this.selection.isEmpty()) {
        return;
      }
      if (this.selection.isReversed()) {
        ref3 = [head, tail], start = ref3[0], end = ref3[1];
      } else {
        ref4 = [tail, head], start = ref4[0], end = ref4[1];
      }
      ref5 = this.selection.getBufferRowRange(), start.row = ref5[0], end.row = ref5[1];
      return this.withKeepingGoalColumn((function(_this) {
        return function() {
          _this.setBufferRange([start, end], {
            preserveFolds: true
          });
          return _this.translateSelectionEndAndClip('backward', {
            translate: false
          });
        };
      })(this));
    };

    SelectionWrapper.prototype.setBufferRange = function(range, options) {
      if (options == null) {
        options = {};
      }
      if (options.autoscroll == null) {
        options.autoscroll = false;
      }
      return this.selection.setBufferRange(range, options);
    };

    SelectionWrapper.prototype.replace = function(text) {
      var originalText;
      originalText = this.selection.getText();
      this.selection.insertText(text);
      return originalText;
    };

    SelectionWrapper.prototype.lineTextForBufferRows = function() {
      var editor;
      editor = this.selection.editor;
      return this.getRows().map(function(row) {
        return editor.lineTextForBufferRow(row);
      });
    };

    SelectionWrapper.prototype.translate = function(startDelta, endDelta, options) {
      var newRange;
      if (endDelta == null) {
        endDelta = startDelta;
      }
      newRange = this.getBufferRange().translate(startDelta, endDelta);
      return this.setBufferRange(newRange, options);
    };

    SelectionWrapper.prototype.isSingleRow = function() {
      var endRow, ref2, startRow;
      ref2 = this.selection.getBufferRowRange(), startRow = ref2[0], endRow = ref2[1];
      return startRow === endRow;
    };

    SelectionWrapper.prototype.isLinewise = function() {
      var end, ref2, ref3, start;
      ref2 = this.getBufferRange(), start = ref2.start, end = ref2.end;
      return (start.row !== end.row) && ((start.column === (ref3 = end.column) && ref3 === 0));
    };

    SelectionWrapper.prototype.detectVisualModeSubmode = function() {
      if (this.selection.isEmpty()) {
        return null;
      } else if (this.isLinewise()) {
        return 'linewise';
      } else {
        return 'characterwise';
      }
    };

    SelectionWrapper.prototype.withKeepingGoalColumn = function(fn) {
      var end, goalColumn, ref2, start;
      goalColumn = this.selection.cursor.goalColumn;
      ref2 = this.getBufferRange(), start = ref2.start, end = ref2.end;
      fn();
      if (goalColumn) {
        return this.selection.cursor.goalColumn = goalColumn;
      }
    };

    SelectionWrapper.prototype.translateSelectionEndAndClip = function(direction, options) {
      var editor, newRange, range;
      editor = this.selection.editor;
      range = this.getBufferRange();
      newRange = getRangeByTranslatePointAndClip(editor, range, "end", direction, options);
      return this.withKeepingGoalColumn((function(_this) {
        return function() {
          return _this.setBufferRange(newRange, {
            preserveFolds: true
          });
        };
      })(this));
    };

    SelectionWrapper.prototype.translateSelectionHeadAndClip = function(direction, options) {
      var editor, newRange, range, which;
      editor = this.selection.editor;
      which = this.selection.isReversed() ? 'start' : 'end';
      range = this.getBufferRange();
      newRange = getRangeByTranslatePointAndClip(editor, range, which, direction, options);
      return this.withKeepingGoalColumn((function(_this) {
        return function() {
          return _this.setBufferRange(newRange, {
            preserveFolds: true
          });
        };
      })(this));
    };

    return SelectionWrapper;

  })();

  swrap = function(selection) {
    return new SelectionWrapper(selection);
  };

  swrap.setReversedState = function(editor, reversed) {
    return editor.getSelections().forEach(function(selection) {
      return swrap(selection).setReversedState(reversed);
    });
  };

  swrap.expandOverLine = function(editor, options) {
    return editor.getSelections().forEach(function(selection) {
      return swrap(selection).expandOverLine(options);
    });
  };

  swrap.reverse = function(editor) {
    return editor.getSelections().forEach(function(selection) {
      return swrap(selection).reverse();
    });
  };

  swrap.clearProperties = function(editor) {
    return editor.getSelections().forEach(function(selection) {
      return swrap(selection).clearProperties();
    });
  };

  swrap.detectVisualModeSubmode = function(editor) {
    var results, selection, selections;
    selections = editor.getSelections();
    results = (function() {
      var i, len, results1;
      results1 = [];
      for (i = 0, len = selections.length; i < len; i++) {
        selection = selections[i];
        results1.push(swrap(selection).detectVisualModeSubmode());
      }
      return results1;
    })();
    if (results.every(function(r) {
      return r === 'linewise';
    })) {
      return 'linewise';
    } else if (results.some(function(r) {
      return r === 'characterwise';
    })) {
      return 'characterwise';
    } else {
      return null;
    }
  };

  swrap.updateSelectionProperties = function(editor, arg) {
    var i, len, ref2, results1, selection, unknownOnly;
    unknownOnly = (arg != null ? arg : {}).unknownOnly;
    ref2 = editor.getSelections();
    results1 = [];
    for (i = 0, len = ref2.length; i < len; i++) {
      selection = ref2[i];
      if (unknownOnly && swrap(selection).hasProperties()) {
        continue;
      }
      results1.push(swrap(selection).saveProperties());
    }
    return results1;
  };

  module.exports = swrap;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvc2VsZWN0aW9uLXdyYXBwZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQTZCLE9BQUEsQ0FBUSxNQUFSLENBQTdCLEVBQUMsaUJBQUQsRUFBUSxpQkFBUixFQUFlOztFQUNmLE9BR0ksT0FBQSxDQUFRLFNBQVIsQ0FISixFQUNFLGtEQURGLEVBRUU7O0VBR0YsYUFBQSxHQUFnQixJQUFJOztFQUVkO0lBQ1MsMEJBQUMsVUFBRDtNQUFDLElBQUMsQ0FBQSxZQUFEO0lBQUQ7OytCQUViLGFBQUEsR0FBZSxTQUFBO2FBQUcsYUFBYSxDQUFDLEdBQWQsQ0FBa0IsSUFBQyxDQUFBLFNBQW5CO0lBQUg7OytCQUNmLGFBQUEsR0FBZSxTQUFBO0FBQUcsVUFBQTt5RUFBZ0M7SUFBbkM7OytCQUNmLGFBQUEsR0FBZSxTQUFDLElBQUQ7YUFBVSxhQUFhLENBQUMsR0FBZCxDQUFrQixJQUFDLENBQUEsU0FBbkIsRUFBOEIsSUFBOUI7SUFBVjs7K0JBQ2YsZUFBQSxHQUFpQixTQUFBO2FBQUcsYUFBYSxFQUFDLE1BQUQsRUFBYixDQUFxQixJQUFDLENBQUEsU0FBdEI7SUFBSDs7K0JBRWpCLG9CQUFBLEdBQXNCLFNBQUMsS0FBRDtNQUNwQixJQUFHLEtBQUg7UUFDRSxJQUFDLENBQUEsY0FBRCxDQUFnQixLQUFoQjtRQUNBLElBQUcsSUFBQyxDQUFBLFNBQVMsQ0FBQyxlQUFYLENBQUEsQ0FBSDtpQkFDRSxJQUFDLENBQUEsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFsQixDQUFBLEVBREY7U0FGRjs7SUFEb0I7OytCQU10QixjQUFBLEdBQWdCLFNBQUE7YUFDZCxJQUFDLENBQUEsU0FBUyxDQUFDLGNBQVgsQ0FBQTtJQURjOzsrQkFH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QUE7O01BQ0UsSUFBWSxXQUFBLElBQWdCLEtBQUEsQ0FBTSxTQUFOLENBQWdCLENBQUMsYUFBakIsQ0FBQSxDQUE1QjtBQUFBLGlCQUFBOztvQkFDQSxLQUFBLENBQU0sU0FBTixDQUFnQixDQUFDLGNBQWpCLENBQUE7QUFGRjs7RUFEZ0M7O0VBS2xDLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBdlJqQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57UmFuZ2UsIFBvaW50LCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG57XG4gIHRyYW5zbGF0ZVBvaW50QW5kQ2xpcFxuICBnZXRSYW5nZUJ5VHJhbnNsYXRlUG9pbnRBbmRDbGlwXG59ID0gcmVxdWlyZSAnLi91dGlscydcblxucHJvcGVydHlTdG9yZSA9IG5ldyBNYXBcblxuY2xhc3MgU2VsZWN0aW9uV3JhcHBlclxuICBjb25zdHJ1Y3RvcjogKEBzZWxlY3Rpb24pIC0+XG5cbiAgaGFzUHJvcGVydGllczogLT4gcHJvcGVydHlTdG9yZS5oYXMoQHNlbGVjdGlvbilcbiAgZ2V0UHJvcGVydGllczogLT4gcHJvcGVydHlTdG9yZS5nZXQoQHNlbGVjdGlvbikgPyB7fVxuICBzZXRQcm9wZXJ0aWVzOiAocHJvcCkgLT4gcHJvcGVydHlTdG9yZS5zZXQoQHNlbGVjdGlvbiwgcHJvcClcbiAgY2xlYXJQcm9wZXJ0aWVzOiAtPiBwcm9wZXJ0eVN0b3JlLmRlbGV0ZShAc2VsZWN0aW9uKVxuXG4gIHNldEJ1ZmZlclJhbmdlU2FmZWx5OiAocmFuZ2UpIC0+XG4gICAgaWYgcmFuZ2VcbiAgICAgIEBzZXRCdWZmZXJSYW5nZShyYW5nZSlcbiAgICAgIGlmIEBzZWxlY3Rpb24uaXNMYXN0U2VsZWN0aW9uKClcbiAgICAgICAgQHNlbGVjdGlvbi5jdXJzb3IuYXV0b3Njcm9sbCgpXG5cbiAgZ2V0QnVmZmVyUmFuZ2U6IC0+XG4gICAgQHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG5cbiAgZ2V0Tm9ybWFsaXplZEJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIHBvaW50ID0gQHNlbGVjdGlvbi5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIGlmIEBpc0ZvcndhcmRpbmcoKVxuICAgICAge2VkaXRvcn0gPSBAc2VsZWN0aW9uXG4gICAgICBzY3JlZW5Qb2ludCA9IGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKHBvaW50KS50cmFuc2xhdGUoWzAsIC0xXSlcbiAgICAgIGVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uKHNjcmVlblBvaW50LCBjbGlwRGlyZWN0aW9uOiAnYmFja3dhcmQnKVxuICAgIGVsc2VcbiAgICAgIHBvaW50XG5cbiAgIyBSZXR1cm4gZnVuY3Rpb24gdG8gZGlzcG9zZSg9cmV2ZXJ0KSBub3JtYWxpemF0aW9uLlxuICBub3JtYWxpemVCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBoZWFkID0gQHNlbGVjdGlvbi5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIHBvaW50ID0gQGdldE5vcm1hbGl6ZWRCdWZmZXJQb3NpdGlvbigpXG4gICAgQHNlbGVjdGlvbi5tb2RpZnlTZWxlY3Rpb24gPT5cbiAgICAgIEBzZWxlY3Rpb24uY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gICAgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIHVubGVzcyBoZWFkLmlzRXF1YWwocG9pbnQpXG4gICAgICAgIEBzZWxlY3Rpb24ubW9kaWZ5U2VsZWN0aW9uID0+XG4gICAgICAgICAgQHNlbGVjdGlvbi5jdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oaGVhZClcblxuICBnZXRCdWZmZXJQb3NpdGlvbkZvcjogKHdoaWNoLCB7ZnJvbVByb3BlcnR5LCBhbGxvd0ZhbGxiYWNrfT17fSkgLT5cbiAgICBmcm9tUHJvcGVydHkgPz0gZmFsc2VcbiAgICBhbGxvd0ZhbGxiYWNrID89IGZhbHNlXG5cbiAgICBpZiBmcm9tUHJvcGVydHkgYW5kIChub3QgQGhhc1Byb3BlcnRpZXMoKSkgYW5kIGFsbG93RmFsbGJhY2tcbiAgICAgIGZyb21Qcm9wZXJ0eSA9IGZhbHNlXG5cbiAgICBpZiBmcm9tUHJvcGVydHlcbiAgICAgIHtoZWFkLCB0YWlsfSA9IEBnZXRQcm9wZXJ0aWVzKClcbiAgICAgIGlmIGhlYWQuaXNHcmVhdGVyVGhhbk9yRXF1YWwodGFpbClcbiAgICAgICAgW3N0YXJ0LCBlbmRdID0gW3RhaWwsIGhlYWRdXG4gICAgICBlbHNlXG4gICAgICAgIFtzdGFydCwgZW5kXSA9IFtoZWFkLCB0YWlsXVxuICAgIGVsc2VcbiAgICAgIHtzdGFydCwgZW5kfSA9IEBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgaGVhZCA9IEBzZWxlY3Rpb24uZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIHRhaWwgPSBAc2VsZWN0aW9uLmdldFRhaWxCdWZmZXJQb3NpdGlvbigpXG5cbiAgICBzd2l0Y2ggd2hpY2hcbiAgICAgIHdoZW4gJ3N0YXJ0JyB0aGVuIHN0YXJ0XG4gICAgICB3aGVuICdlbmQnIHRoZW4gZW5kXG4gICAgICB3aGVuICdoZWFkJyB0aGVuIGhlYWRcbiAgICAgIHdoZW4gJ3RhaWwnIHRoZW4gdGFpbFxuXG4gICMgb3B0aW9uczoge2Zyb21Qcm9wZXJ0eX1cbiAgc2V0QnVmZmVyUG9zaXRpb25UbzogKHdoaWNoLCBvcHRpb25zKSAtPlxuICAgIHBvaW50ID0gQGdldEJ1ZmZlclBvc2l0aW9uRm9yKHdoaWNoLCBvcHRpb25zKVxuICAgIEBzZWxlY3Rpb24uY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gIG1lcmdlQnVmZmVyUmFuZ2U6IChyYW5nZSwgb3B0aW9uKSAtPlxuICAgIEBzZXRCdWZmZXJSYW5nZShAZ2V0QnVmZmVyUmFuZ2UoKS51bmlvbihyYW5nZSksIG9wdGlvbilcblxuICByZXZlcnNlOiAtPlxuICAgIEBzZXRSZXZlcnNlZFN0YXRlKG5vdCBAc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKSlcblxuICAgIHtoZWFkLCB0YWlsfSA9IEBnZXRQcm9wZXJ0aWVzKClcbiAgICBpZiBoZWFkPyBhbmQgdGFpbD9cbiAgICAgIEBzZXRQcm9wZXJ0aWVzKGhlYWQ6IHRhaWwsIHRhaWw6IGhlYWQpXG5cbiAgc2V0UmV2ZXJzZWRTdGF0ZTogKHJldmVyc2VkKSAtPlxuICAgIG9wdGlvbnMgPSB7YXV0b3Njcm9sbDogdHJ1ZSwgcmV2ZXJzZWQsIHByZXNlcnZlRm9sZHM6IHRydWV9XG4gICAgQHNldEJ1ZmZlclJhbmdlKEBnZXRCdWZmZXJSYW5nZSgpLCBvcHRpb25zKVxuXG4gIGdldFJvd3M6IC0+XG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gQHNlbGVjdGlvbi5nZXRCdWZmZXJSb3dSYW5nZSgpXG4gICAgW3N0YXJ0Um93Li5lbmRSb3ddXG5cbiAgZ2V0Um93Q291bnQ6IC0+XG4gICAgQGdldFJvd3MoKS5sZW5ndGhcblxuICBzZWxlY3RSb3dSYW5nZTogKHJvd1JhbmdlKSAtPlxuICAgIHtlZGl0b3J9ID0gQHNlbGVjdGlvblxuICAgIFtzdGFydFJhbmdlLCBlbmRSYW5nZV0gPSByb3dSYW5nZS5tYXAgKHJvdykgLT5cbiAgICAgIGVkaXRvci5idWZmZXJSYW5nZUZvckJ1ZmZlclJvdyhyb3csIGluY2x1ZGVOZXdsaW5lOiB0cnVlKVxuICAgIHJhbmdlID0gc3RhcnRSYW5nZS51bmlvbihlbmRSYW5nZSlcbiAgICBAc2V0QnVmZmVyUmFuZ2UocmFuZ2UsIHByZXNlcnZlRm9sZHM6IHRydWUpXG5cbiAgIyBOYXRpdmUgc2VsZWN0aW9uLmV4cGFuZE92ZXJMaW5lIGlzIG5vdCBhd2FyZSBvZiBhY3R1YWwgcm93UmFuZ2Ugb2Ygc2VsZWN0aW9uLlxuICBleHBhbmRPdmVyTGluZTogKHtwcmVzZXJ2ZUdvYWxDb2x1bW59PXt9KSAtPlxuICAgIGlmIHByZXNlcnZlR29hbENvbHVtblxuICAgICAge2dvYWxDb2x1bW59ID0gQHNlbGVjdGlvbi5jdXJzb3JcblxuICAgIEBzZWxlY3RSb3dSYW5nZShAc2VsZWN0aW9uLmdldEJ1ZmZlclJvd1JhbmdlKCkpXG4gICAgQHNlbGVjdGlvbi5jdXJzb3IuZ29hbENvbHVtbiA9IGdvYWxDb2x1bW4gaWYgZ29hbENvbHVtblxuXG4gIGdldFJvd0ZvcjogKHdoZXJlKSAtPlxuICAgIFtzdGFydFJvdywgZW5kUm93XSA9IEBzZWxlY3Rpb24uZ2V0QnVmZmVyUm93UmFuZ2UoKVxuICAgIHVubGVzcyBAc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuICAgICAgW2hlYWRSb3csIHRhaWxSb3ddID0gW3N0YXJ0Um93LCBlbmRSb3ddXG4gICAgZWxzZVxuICAgICAgW2hlYWRSb3csIHRhaWxSb3ddID0gW2VuZFJvdywgc3RhcnRSb3ddXG5cbiAgICBzd2l0Y2ggd2hlcmVcbiAgICAgIHdoZW4gJ3N0YXJ0JyB0aGVuIHN0YXJ0Um93XG4gICAgICB3aGVuICdlbmQnIHRoZW4gZW5kUm93XG4gICAgICB3aGVuICdoZWFkJyB0aGVuIGhlYWRSb3dcbiAgICAgIHdoZW4gJ3RhaWwnIHRoZW4gdGFpbFJvd1xuXG4gIGdldEhlYWRSb3c6IC0+IEBnZXRSb3dGb3IoJ2hlYWQnKVxuICBnZXRUYWlsUm93OiAtPiBAZ2V0Um93Rm9yKCd0YWlsJylcbiAgZ2V0U3RhcnRSb3c6IC0+IEBnZXRSb3dGb3IoJ3N0YXJ0JylcbiAgZ2V0RW5kUm93OiAtPiBAZ2V0Um93Rm9yKCdlbmQnKVxuXG4gIGdldFRhaWxCdWZmZXJSYW5nZTogLT5cbiAgICB7ZWRpdG9yfSA9IEBzZWxlY3Rpb25cbiAgICB0YWlsUG9pbnQgPSBAc2VsZWN0aW9uLmdldFRhaWxCdWZmZXJQb3NpdGlvbigpXG4gICAgaWYgQHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgIHBvaW50ID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKGVkaXRvciwgdGFpbFBvaW50LCAnYmFja3dhcmQnKVxuICAgICAgbmV3IFJhbmdlKHBvaW50LCB0YWlsUG9pbnQpXG4gICAgZWxzZVxuICAgICAgcG9pbnQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAoZWRpdG9yLCB0YWlsUG9pbnQsICdmb3J3YXJkJywgaGVsbG86ICd3aGVuIGdldHRpbmcgdGFpbFJhbmdlJylcbiAgICAgIG5ldyBSYW5nZSh0YWlsUG9pbnQsIHBvaW50KVxuXG4gIHNhdmVQcm9wZXJ0aWVzOiAtPlxuICAgIHByb3BlcnRpZXMgPSBAY2FwdHVyZVByb3BlcnRpZXMoKVxuICAgIHVubGVzcyBAc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgIyBXZSBzZWxlY3QgcmlnaHRlZCBpbiB2aXN1YWwtbW9kZSwgdGhpcyB0cmFuc2xhdGlvbiBkZS1lZmZlY3Qgc2VsZWN0LXJpZ2h0LWVmZmVjdFxuICAgICAgIyBzbyB0aGF0IGFmdGVyIHJlc3RvcmluZyBwcmVzZXJ2ZWQgcG9wZXJ0eSB3ZSBjYW4gZG8gYWN0aXZhdGUtdmlzdWFsIG1vZGUgd2l0aG91dFxuICAgICAgIyBzcGVjaWFsIGNhcmVcbiAgICAgIGVuZFBvaW50ID0gQHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLmVuZC50cmFuc2xhdGUoWzAsIC0xXSlcbiAgICAgIGVuZFBvaW50ID0gQHNlbGVjdGlvbi5lZGl0b3IuY2xpcEJ1ZmZlclBvc2l0aW9uKGVuZFBvaW50KVxuICAgICAgaWYgQHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgICAgcHJvcGVydGllcy50YWlsID0gZW5kUG9pbnRcbiAgICAgIGVsc2VcbiAgICAgICAgcHJvcGVydGllcy5oZWFkID0gZW5kUG9pbnRcbiAgICBAc2V0UHJvcGVydGllcyhwcm9wZXJ0aWVzKVxuXG4gIGNhcHR1cmVQcm9wZXJ0aWVzOiAtPlxuICAgIGhlYWQ6IEBzZWxlY3Rpb24uZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcbiAgICB0YWlsOiBAc2VsZWN0aW9uLmdldFRhaWxCdWZmZXJQb3NpdGlvbigpXG5cbiAgc2VsZWN0QnlQcm9wZXJ0aWVzOiAoe2hlYWQsIHRhaWx9KSAtPlxuICAgICMgTm8gcHJvYmxlbSBpZiBoZWFkIGlzIGdyZWF0ZXIgdGhhbiB0YWlsLCBSYW5nZSBjb25zdHJ1Y3RvciBzd2FwIHN0YXJ0L2VuZC5cbiAgICBAc2V0QnVmZmVyUmFuZ2UoW3RhaWwsIGhlYWRdKVxuICAgIEBzZXRSZXZlcnNlZFN0YXRlKGhlYWQuaXNMZXNzVGhhbih0YWlsKSlcblxuICAjIFJldHVybiB0cnVlIGlmIHNlbGVjdGlvbiB3YXMgbm9uLWVtcHR5IGFuZCBub24tcmV2ZXJzZWQgc2VsZWN0aW9uLlxuICAjIEVxdWl2YWxlbnQgdG8gbm90IHNlbGVjdGlvbi5pc0VtcHR5KCkgYW5kIG5vdCBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXCJcbiAgaXNGb3J3YXJkaW5nOiAtPlxuICAgIGhlYWQgPSBAc2VsZWN0aW9uLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAgdGFpbCA9IEBzZWxlY3Rpb24uZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcbiAgICBoZWFkLmlzR3JlYXRlclRoYW4odGFpbClcblxuICByZXN0b3JlQ29sdW1uRnJvbVByb3BlcnRpZXM6IC0+XG4gICAge2hlYWQsIHRhaWx9ID0gQGdldFByb3BlcnRpZXMoKVxuICAgIHJldHVybiB1bmxlc3MgaGVhZD8gYW5kIHRhaWw/XG4gICAgcmV0dXJuIGlmIEBzZWxlY3Rpb24uaXNFbXB0eSgpXG5cbiAgICBpZiBAc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuICAgICAgW3N0YXJ0LCBlbmRdID0gW2hlYWQsIHRhaWxdXG4gICAgZWxzZVxuICAgICAgW3N0YXJ0LCBlbmRdID0gW3RhaWwsIGhlYWRdXG4gICAgW3N0YXJ0LnJvdywgZW5kLnJvd10gPSBAc2VsZWN0aW9uLmdldEJ1ZmZlclJvd1JhbmdlKClcbiAgICBAd2l0aEtlZXBpbmdHb2FsQ29sdW1uID0+XG4gICAgICBAc2V0QnVmZmVyUmFuZ2UoW3N0YXJ0LCBlbmRdLCBwcmVzZXJ2ZUZvbGRzOiB0cnVlKVxuICAgICAgQHRyYW5zbGF0ZVNlbGVjdGlvbkVuZEFuZENsaXAoJ2JhY2t3YXJkJywgdHJhbnNsYXRlOiBmYWxzZSlcblxuICAjIE9ubHkgZm9yIHNldHRpbmcgYXV0b3Njcm9sbCBvcHRpb24gdG8gZmFsc2UgYnkgZGVmYXVsdFxuICBzZXRCdWZmZXJSYW5nZTogKHJhbmdlLCBvcHRpb25zPXt9KSAtPlxuICAgIG9wdGlvbnMuYXV0b3Njcm9sbCA/PSBmYWxzZVxuICAgIEBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2UocmFuZ2UsIG9wdGlvbnMpXG5cbiAgIyBSZXR1cm4gb3JpZ2luYWwgdGV4dFxuICByZXBsYWNlOiAodGV4dCkgLT5cbiAgICBvcmlnaW5hbFRleHQgPSBAc2VsZWN0aW9uLmdldFRleHQoKVxuICAgIEBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0KVxuICAgIG9yaWdpbmFsVGV4dFxuXG4gIGxpbmVUZXh0Rm9yQnVmZmVyUm93czogLT5cbiAgICB7ZWRpdG9yfSA9IEBzZWxlY3Rpb25cbiAgICBAZ2V0Um93cygpLm1hcCAocm93KSAtPlxuICAgICAgZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHJvdylcblxuICB0cmFuc2xhdGU6IChzdGFydERlbHRhLCBlbmREZWx0YT1zdGFydERlbHRhLCBvcHRpb25zKSAtPlxuICAgIG5ld1JhbmdlID0gQGdldEJ1ZmZlclJhbmdlKCkudHJhbnNsYXRlKHN0YXJ0RGVsdGEsIGVuZERlbHRhKVxuICAgIEBzZXRCdWZmZXJSYW5nZShuZXdSYW5nZSwgb3B0aW9ucylcblxuICBpc1NpbmdsZVJvdzogLT5cbiAgICBbc3RhcnRSb3csIGVuZFJvd10gPSBAc2VsZWN0aW9uLmdldEJ1ZmZlclJvd1JhbmdlKClcbiAgICBzdGFydFJvdyBpcyBlbmRSb3dcblxuICBpc0xpbmV3aXNlOiAtPlxuICAgIHtzdGFydCwgZW5kfSA9IEBnZXRCdWZmZXJSYW5nZSgpXG4gICAgKHN0YXJ0LnJvdyBpc250IGVuZC5yb3cpIGFuZCAoc3RhcnQuY29sdW1uIGlzIGVuZC5jb2x1bW4gaXMgMClcblxuICBkZXRlY3RWaXN1YWxNb2RlU3VibW9kZTogLT5cbiAgICBpZiBAc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgbnVsbFxuICAgIGVsc2UgaWYgQGlzTGluZXdpc2UoKVxuICAgICAgJ2xpbmV3aXNlJ1xuICAgIGVsc2VcbiAgICAgICdjaGFyYWN0ZXJ3aXNlJ1xuXG4gIHdpdGhLZWVwaW5nR29hbENvbHVtbjogKGZuKSAtPlxuICAgIHtnb2FsQ29sdW1ufSA9IEBzZWxlY3Rpb24uY3Vyc29yXG4gICAge3N0YXJ0LCBlbmR9ID0gQGdldEJ1ZmZlclJhbmdlKClcbiAgICBmbigpXG4gICAgQHNlbGVjdGlvbi5jdXJzb3IuZ29hbENvbHVtbiA9IGdvYWxDb2x1bW4gaWYgZ29hbENvbHVtblxuXG4gICMgZGlyZWN0aW9uIG11c3QgYmUgb25lIG9mIFsnZm9yd2FyZCcsICdiYWNrd2FyZCddXG4gICMgb3B0aW9uczoge3RyYW5zbGF0ZTogdHJ1ZSBvciBmYWxzZX0gZGVmYXVsdCB0cnVlXG4gIHRyYW5zbGF0ZVNlbGVjdGlvbkVuZEFuZENsaXA6IChkaXJlY3Rpb24sIG9wdGlvbnMpIC0+XG4gICAgZWRpdG9yID0gQHNlbGVjdGlvbi5lZGl0b3JcbiAgICByYW5nZSA9IEBnZXRCdWZmZXJSYW5nZSgpXG4gICAgbmV3UmFuZ2UgPSBnZXRSYW5nZUJ5VHJhbnNsYXRlUG9pbnRBbmRDbGlwKGVkaXRvciwgcmFuZ2UsIFwiZW5kXCIsIGRpcmVjdGlvbiwgb3B0aW9ucylcbiAgICBAd2l0aEtlZXBpbmdHb2FsQ29sdW1uID0+XG4gICAgICBAc2V0QnVmZmVyUmFuZ2UobmV3UmFuZ2UsIHByZXNlcnZlRm9sZHM6IHRydWUpXG5cbiAgdHJhbnNsYXRlU2VsZWN0aW9uSGVhZEFuZENsaXA6IChkaXJlY3Rpb24sIG9wdGlvbnMpIC0+XG4gICAgZWRpdG9yID0gQHNlbGVjdGlvbi5lZGl0b3JcbiAgICB3aGljaCAgPSBpZiBAc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKSB0aGVuICdzdGFydCcgZWxzZSAnZW5kJ1xuXG4gICAgcmFuZ2UgPSBAZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIG5ld1JhbmdlID0gZ2V0UmFuZ2VCeVRyYW5zbGF0ZVBvaW50QW5kQ2xpcChlZGl0b3IsIHJhbmdlLCB3aGljaCwgZGlyZWN0aW9uLCBvcHRpb25zKVxuICAgIEB3aXRoS2VlcGluZ0dvYWxDb2x1bW4gPT5cbiAgICAgIEBzZXRCdWZmZXJSYW5nZShuZXdSYW5nZSwgcHJlc2VydmVGb2xkczogdHJ1ZSlcblxuc3dyYXAgPSAoc2VsZWN0aW9uKSAtPlxuICBuZXcgU2VsZWN0aW9uV3JhcHBlcihzZWxlY3Rpb24pXG5cbnN3cmFwLnNldFJldmVyc2VkU3RhdGUgPSAoZWRpdG9yLCByZXZlcnNlZCkgLT5cbiAgZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5mb3JFYWNoIChzZWxlY3Rpb24pIC0+XG4gICAgc3dyYXAoc2VsZWN0aW9uKS5zZXRSZXZlcnNlZFN0YXRlKHJldmVyc2VkKVxuXG5zd3JhcC5leHBhbmRPdmVyTGluZSA9IChlZGl0b3IsIG9wdGlvbnMpIC0+XG4gIGVkaXRvci5nZXRTZWxlY3Rpb25zKCkuZm9yRWFjaCAoc2VsZWN0aW9uKSAtPlxuICAgIHN3cmFwKHNlbGVjdGlvbikuZXhwYW5kT3ZlckxpbmUob3B0aW9ucylcblxuc3dyYXAucmV2ZXJzZSA9IChlZGl0b3IpIC0+XG4gIGVkaXRvci5nZXRTZWxlY3Rpb25zKCkuZm9yRWFjaCAoc2VsZWN0aW9uKSAtPlxuICAgIHN3cmFwKHNlbGVjdGlvbikucmV2ZXJzZSgpXG5cbnN3cmFwLmNsZWFyUHJvcGVydGllcyA9IChlZGl0b3IpIC0+XG4gIGVkaXRvci5nZXRTZWxlY3Rpb25zKCkuZm9yRWFjaCAoc2VsZWN0aW9uKSAtPlxuICAgIHN3cmFwKHNlbGVjdGlvbikuY2xlYXJQcm9wZXJ0aWVzKClcblxuc3dyYXAuZGV0ZWN0VmlzdWFsTW9kZVN1Ym1vZGUgPSAoZWRpdG9yKSAtPlxuICBzZWxlY3Rpb25zID0gZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICByZXN1bHRzID0gKHN3cmFwKHNlbGVjdGlvbikuZGV0ZWN0VmlzdWFsTW9kZVN1Ym1vZGUoKSBmb3Igc2VsZWN0aW9uIGluIHNlbGVjdGlvbnMpXG5cbiAgaWYgcmVzdWx0cy5ldmVyeSgocikgLT4gciBpcyAnbGluZXdpc2UnKVxuICAgICdsaW5ld2lzZSdcbiAgZWxzZSBpZiByZXN1bHRzLnNvbWUoKHIpIC0+IHIgaXMgJ2NoYXJhY3Rlcndpc2UnKVxuICAgICdjaGFyYWN0ZXJ3aXNlJ1xuICBlbHNlXG4gICAgbnVsbFxuXG5zd3JhcC51cGRhdGVTZWxlY3Rpb25Qcm9wZXJ0aWVzID0gKGVkaXRvciwge3Vua25vd25Pbmx5fT17fSkgLT5cbiAgZm9yIHNlbGVjdGlvbiBpbiBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgY29udGludWUgaWYgdW5rbm93bk9ubHkgYW5kIHN3cmFwKHNlbGVjdGlvbikuaGFzUHJvcGVydGllcygpXG4gICAgc3dyYXAoc2VsZWN0aW9uKS5zYXZlUHJvcGVydGllcygpXG5cbm1vZHVsZS5leHBvcnRzID0gc3dyYXBcbiJdfQ==
