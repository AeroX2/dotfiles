(function() {
  var dispatch, highlightSearch, indentGuide, lineNumbers, moveToLine, moveToLineByPercent, q, qall, showInvisible, softWrap, split, toggleConfig, vsplit, w, wall, wq, wqall;

  dispatch = function(target, command) {
    return atom.commands.dispatch(target, command);
  };

  w = function(arg) {
    var editor;
    editor = (arg != null ? arg : {}).editor;
    if (editor != null ? editor.getPath() : void 0) {
      return editor.save();
    } else {
      return atom.workspace.saveActivePaneItem();
    }
  };

  q = function() {
    return atom.workspace.closeActivePaneItemOrEmptyPaneOrWindow();
  };

  wq = function() {
    w();
    return q();
  };

  qall = function() {
    var i, item, len, ref, results;
    ref = atom.workspace.getPaneItems();
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      item = ref[i];
      results.push(q());
    }
    return results;
  };

  wall = function() {
    var editor, i, len, ref, results;
    ref = atom.workspace.getTextEditors();
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      editor = ref[i];
      if (editor.isModified()) {
        results.push(w({
          editor: editor
        }));
      }
    }
    return results;
  };

  wqall = function() {
    var i, item, len, ref, results;
    ref = atom.workspace.getPaneItems();
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      item = ref[i];
      w();
      results.push(q());
    }
    return results;
  };

  split = function(arg) {
    var editor, editorElement;
    editor = arg.editor, editorElement = arg.editorElement;
    return dispatch(editorElement, 'pane:split-down-and-copy-active-item');
  };

  vsplit = function(arg) {
    var editor, editorElement;
    editor = arg.editor, editorElement = arg.editorElement;
    return dispatch(editorElement, 'pane:split-right-and-copy-active-item');
  };

  toggleConfig = function(param) {
    var value;
    value = atom.config.get(param);
    return atom.config.set(param, !value);
  };

  showInvisible = function() {
    return toggleConfig('editor.showInvisibles');
  };

  highlightSearch = function() {
    return toggleConfig('vim-mode-plus.highlightSearch');
  };

  softWrap = function(arg) {
    var editorElement;
    editorElement = arg.editorElement;
    return dispatch(editorElement, 'editor:toggle-soft-wrap');
  };

  indentGuide = function(arg) {
    var editorElement;
    editorElement = arg.editorElement;
    return dispatch(editorElement, 'editor:toggle-indent-guide');
  };

  lineNumbers = function(arg) {
    var editorElement;
    editorElement = arg.editorElement;
    return dispatch(editorElement, 'editor:toggle-line-numbers');
  };

  moveToLine = function(vimState, count) {
    vimState.setCount(count);
    return vimState.operationStack.run('MoveToFirstLine');
  };

  moveToLineByPercent = function(vimState, count) {
    vimState.setCount(count);
    return vimState.operationStack.run('MoveToLineByPercent');
  };

  module.exports = {
    normalCommands: {
      w: w,
      wq: wq,
      wall: wall,
      wqall: wqall,
      q: q,
      qall: qall,
      split: split,
      vsplit: vsplit
    },
    toggleCommands: {
      showInvisible: showInvisible,
      softWrap: softWrap,
      indentGuide: indentGuide,
      lineNumbers: lineNumbers,
      highlightSearch: highlightSearch
    },
    numberCommands: {
      moveToLine: moveToLine,
      moveToLineByPercent: moveToLineByPercent
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy1leC1tb2RlL2xpYi9jb21tYW5kcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUE7QUFBQSxNQUFBOztFQUFBLFFBQUEsR0FBVyxTQUFDLE1BQUQsRUFBUyxPQUFUO1dBQ1QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLE1BQXZCLEVBQStCLE9BQS9CO0VBRFM7O0VBS1gsQ0FBQSxHQUFJLFNBQUMsR0FBRDtBQUNGLFFBQUE7SUFESSx3QkFBRCxNQUFTO0lBQ1oscUJBQUcsTUFBTSxDQUFFLE9BQVIsQ0FBQSxVQUFIO2FBQ0UsTUFBTSxDQUFDLElBQVAsQ0FBQSxFQURGO0tBQUEsTUFBQTthQUdFLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWYsQ0FBQSxFQUhGOztFQURFOztFQU1KLENBQUEsR0FBSSxTQUFBO1dBQ0YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxzQ0FBZixDQUFBO0VBREU7O0VBR0osRUFBQSxHQUFLLFNBQUE7SUFDSCxDQUFBLENBQUE7V0FDQSxDQUFBLENBQUE7RUFGRzs7RUFJTCxJQUFBLEdBQU8sU0FBQTtBQUNMLFFBQUE7QUFBQTtBQUFBO1NBQUEscUNBQUE7O21CQUFBLENBQUEsQ0FBQTtBQUFBOztFQURLOztFQUdQLElBQUEsR0FBTyxTQUFBO0FBQ0wsUUFBQTtBQUFBO0FBQUE7U0FBQSxxQ0FBQTs7VUFBK0QsTUFBTSxDQUFDLFVBQVAsQ0FBQTtxQkFBL0QsQ0FBQSxDQUFFO1VBQUMsUUFBQSxNQUFEO1NBQUY7O0FBQUE7O0VBREs7O0VBR1AsS0FBQSxHQUFRLFNBQUE7QUFDTixRQUFBO0FBQUE7QUFBQTtTQUFBLHFDQUFBOztNQUNFLENBQUEsQ0FBQTttQkFDQSxDQUFBLENBQUE7QUFGRjs7RUFETTs7RUFLUixLQUFBLEdBQVEsU0FBQyxHQUFEO0FBQ04sUUFBQTtJQURRLHFCQUFRO1dBQ2hCLFFBQUEsQ0FBUyxhQUFULEVBQXdCLHNDQUF4QjtFQURNOztFQUdSLE1BQUEsR0FBUyxTQUFDLEdBQUQ7QUFDUCxRQUFBO0lBRFMscUJBQVE7V0FDakIsUUFBQSxDQUFTLGFBQVQsRUFBd0IsdUNBQXhCO0VBRE87O0VBTVQsWUFBQSxHQUFlLFNBQUMsS0FBRDtBQUNiLFFBQUE7SUFBQSxLQUFBLEdBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLEtBQWhCO1dBQ1IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLEtBQWhCLEVBQXVCLENBQUksS0FBM0I7RUFGYTs7RUFJZixhQUFBLEdBQWdCLFNBQUE7V0FDZCxZQUFBLENBQWEsdUJBQWI7RUFEYzs7RUFHaEIsZUFBQSxHQUFrQixTQUFBO1dBQ2hCLFlBQUEsQ0FBYSwrQkFBYjtFQURnQjs7RUFHbEIsUUFBQSxHQUFXLFNBQUMsR0FBRDtBQUNULFFBQUE7SUFEVyxnQkFBRDtXQUNWLFFBQUEsQ0FBUyxhQUFULEVBQXdCLHlCQUF4QjtFQURTOztFQUdYLFdBQUEsR0FBYyxTQUFDLEdBQUQ7QUFDWixRQUFBO0lBRGMsZ0JBQUQ7V0FDYixRQUFBLENBQVMsYUFBVCxFQUF3Qiw0QkFBeEI7RUFEWTs7RUFHZCxXQUFBLEdBQWMsU0FBQyxHQUFEO0FBQ1osUUFBQTtJQURjLGdCQUFEO1dBQ2IsUUFBQSxDQUFTLGFBQVQsRUFBd0IsNEJBQXhCO0VBRFk7O0VBS2QsVUFBQSxHQUFhLFNBQUMsUUFBRCxFQUFXLEtBQVg7SUFDWCxRQUFRLENBQUMsUUFBVCxDQUFrQixLQUFsQjtXQUNBLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBeEIsQ0FBNEIsaUJBQTVCO0VBRlc7O0VBSWIsbUJBQUEsR0FBc0IsU0FBQyxRQUFELEVBQVcsS0FBWDtJQUNwQixRQUFRLENBQUMsUUFBVCxDQUFrQixLQUFsQjtXQUNBLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBeEIsQ0FBNEIscUJBQTVCO0VBRm9COztFQUl0QixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsY0FBQSxFQUFnQjtNQUNkLEdBQUEsQ0FEYztNQUVkLElBQUEsRUFGYztNQUdkLE1BQUEsSUFIYztNQUlkLE9BQUEsS0FKYztNQUtkLEdBQUEsQ0FMYztNQU1kLE1BQUEsSUFOYztNQU9kLE9BQUEsS0FQYztNQVFkLFFBQUEsTUFSYztLQUFoQjtJQVVBLGNBQUEsRUFBZ0I7TUFDZCxlQUFBLGFBRGM7TUFFZCxVQUFBLFFBRmM7TUFHZCxhQUFBLFdBSGM7TUFJZCxhQUFBLFdBSmM7TUFLZCxpQkFBQSxlQUxjO0tBVmhCO0lBaUJBLGNBQUEsRUFBZ0I7TUFDZCxZQUFBLFVBRGM7TUFFZCxxQkFBQSxtQkFGYztLQWpCaEI7O0FBcEVGIiwic291cmNlc0NvbnRlbnQiOlsiIyBVdGlsc1xuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5kaXNwYXRjaCA9ICh0YXJnZXQsIGNvbW1hbmQpIC0+XG4gIGF0b20uY29tbWFuZHMuZGlzcGF0Y2godGFyZ2V0LCBjb21tYW5kKVxuXG4jIGV4IGNvbW1hbmRcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxudyA9ICh7ZWRpdG9yfT17fSkgLT5cbiAgaWYgZWRpdG9yPy5nZXRQYXRoKClcbiAgICBlZGl0b3Iuc2F2ZSgpXG4gIGVsc2VcbiAgICBhdG9tLndvcmtzcGFjZS5zYXZlQWN0aXZlUGFuZUl0ZW0oKVxuXG5xID0gLT5cbiAgYXRvbS53b3Jrc3BhY2UuY2xvc2VBY3RpdmVQYW5lSXRlbU9yRW1wdHlQYW5lT3JXaW5kb3coKVxuXG53cSA9IC0+XG4gIHcoKVxuICBxKClcblxucWFsbCA9IC0+XG4gIHEoKSBmb3IgaXRlbSBpbiBhdG9tLndvcmtzcGFjZS5nZXRQYW5lSXRlbXMoKVxuXG53YWxsID0gLT5cbiAgdyh7ZWRpdG9yfSkgZm9yIGVkaXRvciBpbiBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpIHdoZW4gZWRpdG9yLmlzTW9kaWZpZWQoKVxuXG53cWFsbCA9IC0+XG4gIGZvciBpdGVtIGluIGF0b20ud29ya3NwYWNlLmdldFBhbmVJdGVtcygpXG4gICAgdygpXG4gICAgcSgpXG5cbnNwbGl0ID0gKHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9KSAtPlxuICBkaXNwYXRjaChlZGl0b3JFbGVtZW50LCAncGFuZTpzcGxpdC1kb3duLWFuZC1jb3B5LWFjdGl2ZS1pdGVtJylcblxudnNwbGl0ID0gKHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9KSAtPlxuICBkaXNwYXRjaChlZGl0b3JFbGVtZW50LCAncGFuZTpzcGxpdC1yaWdodC1hbmQtY29weS1hY3RpdmUtaXRlbScpXG5cbiMgQ29uZmlndXJhdGlvbiBzd2l0Y2hcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBVdGlsXG50b2dnbGVDb25maWcgPSAocGFyYW0pIC0+XG4gIHZhbHVlID0gYXRvbS5jb25maWcuZ2V0KHBhcmFtKVxuICBhdG9tLmNvbmZpZy5zZXQocGFyYW0sIG5vdCB2YWx1ZSlcblxuc2hvd0ludmlzaWJsZSA9IC0+XG4gIHRvZ2dsZUNvbmZpZygnZWRpdG9yLnNob3dJbnZpc2libGVzJylcblxuaGlnaGxpZ2h0U2VhcmNoID0gLT5cbiAgdG9nZ2xlQ29uZmlnKCd2aW0tbW9kZS1wbHVzLmhpZ2hsaWdodFNlYXJjaCcpXG5cbnNvZnRXcmFwID0gKHtlZGl0b3JFbGVtZW50fSkgLT5cbiAgZGlzcGF0Y2goZWRpdG9yRWxlbWVudCwgJ2VkaXRvcjp0b2dnbGUtc29mdC13cmFwJylcblxuaW5kZW50R3VpZGUgPSAoe2VkaXRvckVsZW1lbnR9KSAtPlxuICBkaXNwYXRjaChlZGl0b3JFbGVtZW50LCAnZWRpdG9yOnRvZ2dsZS1pbmRlbnQtZ3VpZGUnKVxuXG5saW5lTnVtYmVycyA9ICh7ZWRpdG9yRWxlbWVudH0pIC0+XG4gIGRpc3BhdGNoKGVkaXRvckVsZW1lbnQsICdlZGl0b3I6dG9nZ2xlLWxpbmUtbnVtYmVycycpXG5cbiMgV2hlbiBudW1iZXIgd2FzIHR5cGVkXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbm1vdmVUb0xpbmUgPSAodmltU3RhdGUsIGNvdW50KSAtPlxuICB2aW1TdGF0ZS5zZXRDb3VudChjb3VudClcbiAgdmltU3RhdGUub3BlcmF0aW9uU3RhY2sucnVuKCdNb3ZlVG9GaXJzdExpbmUnKVxuXG5tb3ZlVG9MaW5lQnlQZXJjZW50ID0gKHZpbVN0YXRlLCBjb3VudCkgLT5cbiAgdmltU3RhdGUuc2V0Q291bnQoY291bnQpXG4gIHZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLnJ1bignTW92ZVRvTGluZUJ5UGVyY2VudCcpXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgbm9ybWFsQ29tbWFuZHM6IHtcbiAgICB3XG4gICAgd3FcbiAgICB3YWxsXG4gICAgd3FhbGxcbiAgICBxXG4gICAgcWFsbFxuICAgIHNwbGl0XG4gICAgdnNwbGl0XG4gIH1cbiAgdG9nZ2xlQ29tbWFuZHM6IHtcbiAgICBzaG93SW52aXNpYmxlXG4gICAgc29mdFdyYXBcbiAgICBpbmRlbnRHdWlkZVxuICAgIGxpbmVOdW1iZXJzXG4gICAgaGlnaGxpZ2h0U2VhcmNoXG4gIH1cbiAgbnVtYmVyQ29tbWFuZHM6IHtcbiAgICBtb3ZlVG9MaW5lXG4gICAgbW92ZVRvTGluZUJ5UGVyY2VudFxuICB9XG4iXX0=
