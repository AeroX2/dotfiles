(function() {
  var CompositeDisposable, CursorStyleManager, Disposable, Point, getCursorNode, getOffset, isSpecMode, lineHeight, ref, setStyle, settings, swrap,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Point = ref.Point, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  settings = require('./settings');

  swrap = require('./selection-wrapper');

  isSpecMode = atom.inSpecMode();

  lineHeight = null;

  getCursorNode = function(editorElement, cursor) {
    var cursorsComponent;
    cursorsComponent = editorElement.component.linesComponent.cursorsComponent;
    return cursorsComponent.cursorNodesById[cursor.id];
  };

  getOffset = function(submode, cursor, isSoftWrapped) {
    var bufferPoint, editor, endRow, ref1, screenPoint, selection, startRow, traversal;
    selection = cursor.selection, editor = cursor.editor;
    traversal = new Point(0, 0);
    switch (submode) {
      case 'characterwise':
      case 'blockwise':
        if (!selection.isReversed() && !cursor.isAtBeginningOfLine()) {
          traversal.column -= 1;
        }
        break;
      case 'linewise':
        bufferPoint = swrap(selection).getBufferPositionFor('head', {
          fromProperty: true
        });
        ref1 = selection.getBufferRowRange(), startRow = ref1[0], endRow = ref1[1];
        if (selection.isReversed()) {
          bufferPoint.row = startRow;
        }
        traversal = isSoftWrapped ? (screenPoint = editor.screenPositionForBufferPosition(bufferPoint), screenPoint.traversalFrom(cursor.getScreenPosition())) : bufferPoint.traversalFrom(cursor.getBufferPosition());
    }
    if (!selection.isReversed() && cursor.isAtBeginningOfLine() && submode !== 'blockwise') {
      traversal.row = -1;
    }
    return traversal;
  };

  setStyle = function(style, arg) {
    var column, row;
    row = arg.row, column = arg.column;
    if (row !== 0) {
      style.setProperty('top', (row * lineHeight) + "em");
    }
    if (column !== 0) {
      style.setProperty('left', column + "ch");
    }
    return new Disposable(function() {
      style.removeProperty('top');
      return style.removeProperty('left');
    });
  };

  CursorStyleManager = (function() {
    function CursorStyleManager(vimState) {
      var ref1;
      this.vimState = vimState;
      ref1 = this.vimState, this.editorElement = ref1.editorElement, this.editor = ref1.editor;
      this.lineHeightObserver = atom.config.observe('editor.lineHeight', (function(_this) {
        return function(newValue) {
          lineHeight = newValue;
          return _this.refresh();
        };
      })(this));
    }

    CursorStyleManager.prototype.destroy = function() {
      var ref1, ref2;
      if ((ref1 = this.subscriptions) != null) {
        ref1.dispose();
      }
      this.lineHeightObserver.dispose();
      return ref2 = {}, this.subscriptions = ref2.subscriptions, this.lineHeightObserver = ref2.lineHeightObserver, ref2;
    };

    CursorStyleManager.prototype.refresh = function() {
      var cursor, cursorNode, cursors, cursorsToShow, i, isSoftWrapped, j, len, len1, ref1, results, submode;
      submode = this.vimState.submode;
      if ((ref1 = this.subscriptions) != null) {
        ref1.dispose();
      }
      this.subscriptions = new CompositeDisposable;
      if (!(this.vimState.isMode('visual') && settings.get('showCursorInVisualMode'))) {
        return;
      }
      cursors = cursorsToShow = this.editor.getCursors();
      if (submode === 'blockwise') {
        cursorsToShow = this.vimState.getBlockwiseSelections().map(function(bs) {
          return bs.getHeadSelection().cursor;
        });
      }
      for (i = 0, len = cursors.length; i < len; i++) {
        cursor = cursors[i];
        if (indexOf.call(cursorsToShow, cursor) >= 0) {
          if (!cursor.isVisible()) {
            cursor.setVisible(true);
          }
        } else {
          if (cursor.isVisible()) {
            cursor.setVisible(false);
          }
        }
      }
      if (submode === 'characterwise' || submode === 'blockwise') {
        this.editorElement.component.updateSync();
      }
      if (isSpecMode) {
        return;
      }
      isSoftWrapped = this.editor.isSoftWrapped();
      results = [];
      for (j = 0, len1 = cursorsToShow.length; j < len1; j++) {
        cursor = cursorsToShow[j];
        if (cursorNode = getCursorNode(this.editorElement, cursor)) {
          results.push(this.subscriptions.add(setStyle(cursorNode.style, getOffset(submode, cursor, isSoftWrapped))));
        }
      }
      return results;
    };

    return CursorStyleManager;

  })();

  module.exports = CursorStyleManager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvY3Vyc29yLXN0eWxlLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw0SUFBQTtJQUFBOztFQUFBLE1BQTJDLE9BQUEsQ0FBUSxNQUFSLENBQTNDLEVBQUMsaUJBQUQsRUFBUSwyQkFBUixFQUFvQjs7RUFFcEIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUNYLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBQ1IsVUFBQSxHQUFhLElBQUksQ0FBQyxVQUFMLENBQUE7O0VBQ2IsVUFBQSxHQUFhOztFQUViLGFBQUEsR0FBZ0IsU0FBQyxhQUFELEVBQWdCLE1BQWhCO0FBQ2QsUUFBQTtJQUFBLGdCQUFBLEdBQW1CLGFBQWEsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDO1dBQzFELGdCQUFnQixDQUFDLGVBQWdCLENBQUEsTUFBTSxDQUFDLEVBQVA7RUFGbkI7O0VBTWhCLFNBQUEsR0FBWSxTQUFDLE9BQUQsRUFBVSxNQUFWLEVBQWtCLGFBQWxCO0FBQ1YsUUFBQTtJQUFDLDRCQUFELEVBQVk7SUFDWixTQUFBLEdBQWdCLElBQUEsS0FBQSxDQUFNLENBQU4sRUFBUyxDQUFUO0FBQ2hCLFlBQU8sT0FBUDtBQUFBLFdBQ08sZUFEUDtBQUFBLFdBQ3dCLFdBRHhCO1FBRUksSUFBRyxDQUFJLFNBQVMsQ0FBQyxVQUFWLENBQUEsQ0FBSixJQUErQixDQUFJLE1BQU0sQ0FBQyxtQkFBUCxDQUFBLENBQXRDO1VBQ0UsU0FBUyxDQUFDLE1BQVYsSUFBb0IsRUFEdEI7O0FBRG9CO0FBRHhCLFdBSU8sVUFKUDtRQUtJLFdBQUEsR0FBYyxLQUFBLENBQU0sU0FBTixDQUFnQixDQUFDLG9CQUFqQixDQUFzQyxNQUF0QyxFQUE4QztVQUFBLFlBQUEsRUFBYyxJQUFkO1NBQTlDO1FBR2QsT0FB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QUEsQ0FBK0IsTUFBTSxDQUFDLFNBQVAsQ0FBQSxDQUEvQjtZQUFBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLElBQWxCLEVBQUE7V0FERjtTQUFBLE1BQUE7VUFHRSxJQUE0QixNQUFNLENBQUMsU0FBUCxDQUFBLENBQTVCO1lBQUEsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsS0FBbEIsRUFBQTtXQUhGOztBQURGO01BVUEsSUFBeUMsT0FBQSxLQUFZLGVBQVosSUFBQSxPQUFBLEtBQTZCLFdBQXRFO1FBQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsVUFBekIsQ0FBQSxFQUFBOztNQUdBLElBQVUsVUFBVjtBQUFBLGVBQUE7O01BQ0EsYUFBQSxHQUFnQixJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBQTtBQUNoQjtXQUFBLGlEQUFBOztZQUFpQyxVQUFBLEdBQWEsYUFBQSxDQUFjLElBQUMsQ0FBQSxhQUFmLEVBQThCLE1BQTlCO3VCQUM1QyxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsUUFBQSxDQUFTLFVBQVUsQ0FBQyxLQUFwQixFQUEyQixTQUFBLENBQVUsT0FBVixFQUFtQixNQUFuQixFQUEyQixhQUEzQixDQUEzQixDQUFuQjs7QUFERjs7SUExQk87Ozs7OztFQTZCWCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQXZGakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7UG9pbnQsIERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuaXNTcGVjTW9kZSA9IGF0b20uaW5TcGVjTW9kZSgpXG5saW5lSGVpZ2h0ID0gbnVsbFxuXG5nZXRDdXJzb3JOb2RlID0gKGVkaXRvckVsZW1lbnQsIGN1cnNvcikgLT5cbiAgY3Vyc29yc0NvbXBvbmVudCA9IGVkaXRvckVsZW1lbnQuY29tcG9uZW50LmxpbmVzQ29tcG9uZW50LmN1cnNvcnNDb21wb25lbnRcbiAgY3Vyc29yc0NvbXBvbmVudC5jdXJzb3JOb2Rlc0J5SWRbY3Vyc29yLmlkXVxuXG4jIFJldHVybiBjdXJzb3Igc3R5bGUgb2Zmc2V0KHRvcCwgbGVmdClcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5nZXRPZmZzZXQgPSAoc3VibW9kZSwgY3Vyc29yLCBpc1NvZnRXcmFwcGVkKSAtPlxuICB7c2VsZWN0aW9uLCBlZGl0b3J9ID0gY3Vyc29yXG4gIHRyYXZlcnNhbCA9IG5ldyBQb2ludCgwLCAwKVxuICBzd2l0Y2ggc3VibW9kZVxuICAgIHdoZW4gJ2NoYXJhY3Rlcndpc2UnLCAnYmxvY2t3aXNlJ1xuICAgICAgaWYgbm90IHNlbGVjdGlvbi5pc1JldmVyc2VkKCkgYW5kIG5vdCBjdXJzb3IuaXNBdEJlZ2lubmluZ09mTGluZSgpXG4gICAgICAgIHRyYXZlcnNhbC5jb2x1bW4gLT0gMVxuICAgIHdoZW4gJ2xpbmV3aXNlJ1xuICAgICAgYnVmZmVyUG9pbnQgPSBzd3JhcChzZWxlY3Rpb24pLmdldEJ1ZmZlclBvc2l0aW9uRm9yKCdoZWFkJywgZnJvbVByb3BlcnR5OiB0cnVlKVxuICAgICAgIyBGSVhNRSBuZWVkIHRvIHVwZGF0ZSBvcmlnaW5hbCBzZWxlY3Rpb24gcHJvcGVydHk/XG4gICAgICAjIHRvIHJlZmxlY3Qgb3V0ZXIgdm1wIGNvbW1hbmQgbW9kaWZ5IGxpbmV3aXNlIHNlbGVjdGlvbj9cbiAgICAgIFtzdGFydFJvdywgZW5kUm93XSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSb3dSYW5nZSgpXG4gICAgICBpZiBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG4gICAgICAgIGJ1ZmZlclBvaW50LnJvdyA9IHN0YXJ0Um93XG5cbiAgICAgIHRyYXZlcnNhbCA9IGlmIGlzU29mdFdyYXBwZWRcbiAgICAgICAgc2NyZWVuUG9pbnQgPSBlZGl0b3Iuc2NyZWVuUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihidWZmZXJQb2ludClcbiAgICAgICAgc2NyZWVuUG9pbnQudHJhdmVyc2FsRnJvbShjdXJzb3IuZ2V0U2NyZWVuUG9zaXRpb24oKSlcbiAgICAgIGVsc2VcbiAgICAgICAgYnVmZmVyUG9pbnQudHJhdmVyc2FsRnJvbShjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgaWYgbm90IHNlbGVjdGlvbi5pc1JldmVyc2VkKCkgYW5kIGN1cnNvci5pc0F0QmVnaW5uaW5nT2ZMaW5lKCkgYW5kIHN1Ym1vZGUgaXNudCAnYmxvY2t3aXNlJ1xuICAgIHRyYXZlcnNhbC5yb3cgPSAtMVxuICB0cmF2ZXJzYWxcblxuc2V0U3R5bGUgPSAoc3R5bGUsIHtyb3csIGNvbHVtbn0pIC0+XG4gIHN0eWxlLnNldFByb3BlcnR5KCd0b3AnLCBcIiN7cm93ICogbGluZUhlaWdodH1lbVwiKSB1bmxlc3Mgcm93IGlzIDBcbiAgc3R5bGUuc2V0UHJvcGVydHkoJ2xlZnQnLCBcIiN7Y29sdW1ufWNoXCIpIHVubGVzcyBjb2x1bW4gaXMgMFxuICBuZXcgRGlzcG9zYWJsZSAtPlxuICAgIHN0eWxlLnJlbW92ZVByb3BlcnR5KCd0b3AnKVxuICAgIHN0eWxlLnJlbW92ZVByb3BlcnR5KCdsZWZ0JylcblxuIyBEaXNwbGF5IGN1cnNvciBpbiB2aXN1YWwgbW9kZS5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQ3Vyc29yU3R5bGVNYW5hZ2VyXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yRWxlbWVudCwgQGVkaXRvcn0gPSBAdmltU3RhdGVcbiAgICBAbGluZUhlaWdodE9ic2VydmVyID0gYXRvbS5jb25maWcub2JzZXJ2ZSAnZWRpdG9yLmxpbmVIZWlnaHQnLCAobmV3VmFsdWUpID0+XG4gICAgICBsaW5lSGVpZ2h0ID0gbmV3VmFsdWVcbiAgICAgIEByZWZyZXNoKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICBAbGluZUhlaWdodE9ic2VydmVyLmRpc3Bvc2UoKVxuICAgIHtAc3Vic2NyaXB0aW9ucywgQGxpbmVIZWlnaHRPYnNlcnZlcn0gPSB7fVxuXG4gIHJlZnJlc2g6IC0+XG4gICAge3N1Ym1vZGV9ID0gQHZpbVN0YXRlXG4gICAgQHN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICByZXR1cm4gdW5sZXNzIChAdmltU3RhdGUuaXNNb2RlKCd2aXN1YWwnKSBhbmQgc2V0dGluZ3MuZ2V0KCdzaG93Q3Vyc29ySW5WaXN1YWxNb2RlJykpXG5cbiAgICBjdXJzb3JzID0gY3Vyc29yc1RvU2hvdyA9IEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgaWYgc3VibW9kZSBpcyAnYmxvY2t3aXNlJ1xuICAgICAgY3Vyc29yc1RvU2hvdyA9IEB2aW1TdGF0ZS5nZXRCbG9ja3dpc2VTZWxlY3Rpb25zKCkubWFwIChicykgLT4gYnMuZ2V0SGVhZFNlbGVjdGlvbigpLmN1cnNvclxuXG4gICAgIyB1cGRhdGUgdmlzaWJpbGl0eVxuICAgIGZvciBjdXJzb3IgaW4gY3Vyc29yc1xuICAgICAgaWYgY3Vyc29yIGluIGN1cnNvcnNUb1Nob3dcbiAgICAgICAgY3Vyc29yLnNldFZpc2libGUodHJ1ZSkgdW5sZXNzIGN1cnNvci5pc1Zpc2libGUoKVxuICAgICAgZWxzZVxuICAgICAgICBjdXJzb3Iuc2V0VmlzaWJsZShmYWxzZSkgaWYgY3Vyc29yLmlzVmlzaWJsZSgpXG5cbiAgICAjIFtOT1RFXSBJbiBCbG9ja3dpc2VTZWxlY3Qgd2UgYWRkIHNlbGVjdGlvbnMoYW5kIGNvcnJlc3BvbmRpbmcgY3Vyc29ycykgaW4gYmx1ay5cbiAgICAjIEJ1dCBjb3JyZXNwb25kaW5nIGN1cnNvcnNDb21wb25lbnQoSFRNTCBlbGVtZW50KSBpcyBhZGRlZCBpbiBzeW5jLlxuICAgICMgU28gdG8gbW9kaWZ5IHN0eWxlIG9mIGN1cnNvcnNDb21wb25lbnQsIHdlIGhhdmUgdG8gbWFrZSBzdXJlIGNvcnJlc3BvbmRpbmcgY3Vyc29yc0NvbXBvbmVudFxuICAgICMgaXMgYXZhaWxhYmxlIGJ5IGNvbXBvbmVudCBpbiBzeW5jIHRvIG1vZGVsLlxuICAgIEBlZGl0b3JFbGVtZW50LmNvbXBvbmVudC51cGRhdGVTeW5jKCkgaWYgc3VibW9kZSBpbiBbJ2NoYXJhY3Rlcndpc2UnLCAnYmxvY2t3aXNlJ11cblxuICAgICMgW0ZJWE1FXSBJbiBzcGVjIG1vZGUsIHdlIHNraXAgaGVyZSBzaW5jZSBub3QgYWxsIHNwZWMgaGF2ZSBkb20gYXR0YWNoZWQuXG4gICAgcmV0dXJuIGlmIGlzU3BlY01vZGVcbiAgICBpc1NvZnRXcmFwcGVkID0gQGVkaXRvci5pc1NvZnRXcmFwcGVkKClcbiAgICBmb3IgY3Vyc29yIGluIGN1cnNvcnNUb1Nob3cgd2hlbiBjdXJzb3JOb2RlID0gZ2V0Q3Vyc29yTm9kZShAZWRpdG9yRWxlbWVudCwgY3Vyc29yKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIHNldFN0eWxlKGN1cnNvck5vZGUuc3R5bGUsIGdldE9mZnNldChzdWJtb2RlLCBjdXJzb3IsIGlzU29mdFdyYXBwZWQpKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEN1cnNvclN0eWxlTWFuYWdlclxuIl19
