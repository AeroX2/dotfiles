(function() {
  var Base, CompositeDisposable, Delegato, OperationAbortedError, _, getEditorState, getVimEofBufferPosition, getVimLastBufferRow, getVimLastScreenRow, getWordBufferRangeAndKindAtBufferPosition, ref, selectList, settings, swrap, vimStateMethods,
    slice = [].slice,
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  Delegato = require('delegato');

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('./utils'), getVimEofBufferPosition = ref.getVimEofBufferPosition, getVimLastBufferRow = ref.getVimLastBufferRow, getVimLastScreenRow = ref.getVimLastScreenRow, getWordBufferRangeAndKindAtBufferPosition = ref.getWordBufferRangeAndKindAtBufferPosition;

  swrap = require('./selection-wrapper');

  settings = require('./settings');

  selectList = null;

  getEditorState = null;

  OperationAbortedError = require('./errors').OperationAbortedError;

  vimStateMethods = ["onDidChangeInput", "onDidConfirmInput", "onDidCancelInput", "onDidChangeSearch", "onDidConfirmSearch", "onDidCancelSearch", "onDidCommandSearch", "onDidSetTarget", "onWillSelectTarget", "onDidSelectTarget", "preemptWillSelectTarget", "preemptDidSelectTarget", "onDidRestoreCursorPositions", "onDidSetOperatorModifier", "onDidResetOperationStack", "onWillActivateMode", "onDidActivateMode", "onWillDeactivateMode", "preemptWillDeactivateMode", "onDidDeactivateMode", "onDidFinishOperation", "onDidCancelSelectList", "subscribe", "isMode", "getBlockwiseSelections", "updateSelectionProperties", "addToClassList"];

  Base = (function() {
    var registries;

    Delegato.includeInto(Base);

    Base.delegatesMethods.apply(Base, slice.call(vimStateMethods).concat([{
      toProperty: 'vimState'
    }]));

    function Base(vimState1, properties) {
      var hover, ref1, ref2;
      this.vimState = vimState1;
      if (properties == null) {
        properties = null;
      }
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement, this.globalState = ref1.globalState;
      if (properties != null) {
        _.extend(this, properties);
      }
      if (settings.get('showHoverOnOperate')) {
        hover = (ref2 = this.hover) != null ? ref2[settings.get('showHoverOnOperateIcon')] : void 0;
        if ((hover != null) && !this.isComplete()) {
          this.addHover(hover);
        }
      }
    }

    Base.prototype.initialize = function() {};

    Base.prototype.isComplete = function() {
      var ref1;
      if (this.isRequireInput() && !this.hasInput()) {
        return false;
      } else if (this.isRequireTarget()) {
        return (ref1 = this.getTarget()) != null ? typeof ref1.isComplete === "function" ? ref1.isComplete() : void 0 : void 0;
      } else {
        return true;
      }
    };

    Base.prototype.target = null;

    Base.prototype.hasTarget = function() {
      return this.target != null;
    };

    Base.prototype.getTarget = function() {
      return this.target;
    };

    Base.prototype.requireTarget = false;

    Base.prototype.isRequireTarget = function() {
      return this.requireTarget;
    };

    Base.prototype.requireInput = false;

    Base.prototype.isRequireInput = function() {
      return this.requireInput;
    };

    Base.prototype.recordable = false;

    Base.prototype.isRecordable = function() {
      return this.recordable;
    };

    Base.prototype.repeated = false;

    Base.prototype.isRepeated = function() {
      return this.repeated;
    };

    Base.prototype.setRepeated = function() {
      return this.repeated = true;
    };

    Base.prototype.operator = null;

    Base.prototype.hasOperator = function() {
      return this.operator != null;
    };

    Base.prototype.getOperator = function() {
      return this.operator;
    };

    Base.prototype.setOperator = function(operator1) {
      this.operator = operator1;
      return this.operator;
    };

    Base.prototype.isAsOperatorTarget = function() {
      return this.hasOperator() && !this.getOperator()["instanceof"]('Select');
    };

    Base.prototype.abort = function() {
      throw new OperationAbortedError('aborted');
    };

    Base.prototype.count = null;

    Base.prototype.defaultCount = 1;

    Base.prototype.getCount = function() {
      var ref1;
      return this.count != null ? this.count : this.count = (ref1 = this.vimState.getCount()) != null ? ref1 : this.defaultCount;
    };

    Base.prototype.resetCount = function() {
      return this.count = null;
    };

    Base.prototype.isDefaultCount = function() {
      return this.count === this.defaultCount;
    };

    Base.prototype.register = null;

    Base.prototype.getRegisterName = function() {
      var text;
      this.vimState.register.getName();
      return text = this.vimState.register.getText(this.getInput(), selection);
    };

    Base.prototype.getRegisterValueAsText = function(name, selection) {
      if (name == null) {
        name = null;
      }
      return this.vimState.register.getText(name, selection);
    };

    Base.prototype.isDefaultRegisterName = function() {
      return this.vimState.register.isDefaultName();
    };

    Base.prototype.countTimes = function(fn) {
      var count, i, isFinal, last, ref1, results, stop, stopped;
      if ((last = this.getCount()) < 1) {
        return;
      }
      stopped = false;
      stop = function() {
        return stopped = true;
      };
      results = [];
      for (count = i = 1, ref1 = last; 1 <= ref1 ? i <= ref1 : i >= ref1; count = 1 <= ref1 ? ++i : --i) {
        isFinal = count === last;
        fn({
          count: count,
          isFinal: isFinal,
          stop: stop
        });
        if (stopped) {
          break;
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Base.prototype.activateMode = function(mode, submode) {
      return this.onDidFinishOperation((function(_this) {
        return function() {
          return _this.vimState.activate(mode, submode);
        };
      })(this));
    };

    Base.prototype.activateModeIfNecessary = function(mode, submode) {
      if (!this.vimState.isMode(mode, submode)) {
        return this.activateMode(mode, submode);
      }
    };

    Base.prototype.addHover = function(text, arg, point) {
      var replace;
      replace = (arg != null ? arg : {}).replace;
      if (point == null) {
        point = null;
      }
      if (replace != null ? replace : false) {
        return this.vimState.hover.replaceLastSection(text, point);
      } else {
        return this.vimState.hover.add(text, point);
      }
    };

    Base.prototype["new"] = function(name, properties) {
      var klass;
      klass = Base.getClass(name);
      return new klass(this.vimState, properties);
    };

    Base.prototype.clone = function(vimState) {
      var excludeProperties, key, klass, properties, ref1, value;
      properties = {};
      excludeProperties = ['editor', 'editorElement', 'globalState', 'vimState'];
      ref1 = this;
      for (key in ref1) {
        if (!hasProp.call(ref1, key)) continue;
        value = ref1[key];
        if (indexOf.call(excludeProperties, key) < 0) {
          properties[key] = value;
        }
      }
      klass = this.constructor;
      return new klass(vimState, properties);
    };

    Base.prototype.cancelOperation = function() {
      return this.vimState.operationStack.cancel();
    };

    Base.prototype.processOperation = function() {
      return this.vimState.operationStack.process();
    };

    Base.prototype.focusSelectList = function(options) {
      if (options == null) {
        options = {};
      }
      this.onDidCancelSelectList((function(_this) {
        return function() {
          return _this.cancelOperation();
        };
      })(this));
      if (selectList == null) {
        selectList = require('./select-list');
      }
      return selectList.show(this.vimState, options);
    };

    Base.prototype.input = null;

    Base.prototype.hasInput = function() {
      return this.input != null;
    };

    Base.prototype.getInput = function() {
      return this.input;
    };

    Base.prototype.focusInput = function(charsMax) {
      var replace;
      this.onDidConfirmInput((function(_this) {
        return function(input) {
          if (_this.input == null) {
            _this.input = input;
            return _this.processOperation();
          }
        };
      })(this));
      if (charsMax !== 1) {
        replace = false;
        this.onDidChangeInput((function(_this) {
          return function(input) {
            _this.addHover(input, {
              replace: replace
            });
            return replace = true;
          };
        })(this));
      }
      this.onDidCancelInput((function(_this) {
        return function() {
          return _this.cancelOperation();
        };
      })(this));
      return this.vimState.input.focus(charsMax);
    };

    Base.prototype.getVimEofBufferPosition = function() {
      return getVimEofBufferPosition(this.editor);
    };

    Base.prototype.getVimLastBufferRow = function() {
      return getVimLastBufferRow(this.editor);
    };

    Base.prototype.getVimLastScreenRow = function() {
      return getVimLastScreenRow(this.editor);
    };

    Base.prototype.getWordBufferRangeAndKindAtBufferPosition = function(point, options) {
      return getWordBufferRangeAndKindAtBufferPosition(this.editor, point, options);
    };

    Base.prototype["instanceof"] = function(klassName) {
      return this instanceof Base.getClass(klassName);
    };

    Base.prototype.is = function(klassName) {
      return this.constructor === Base.getClass(klassName);
    };

    Base.prototype.isOperator = function() {
      return this["instanceof"]('Operator');
    };

    Base.prototype.isMotion = function() {
      return this["instanceof"]('Motion');
    };

    Base.prototype.isTextObject = function() {
      return this["instanceof"]('TextObject');
    };

    Base.prototype.isTarget = function() {
      return this.isMotion() || this.isTextObject();
    };

    Base.prototype.getName = function() {
      return this.constructor.name;
    };

    Base.prototype.getCursorBufferPosition = function() {
      if (this.isMode('visual')) {
        return this.getCursorPositionForSelection(this.editor.getLastSelection());
      } else {
        return this.editor.getCursorBufferPosition();
      }
    };

    Base.prototype.getCursorBufferPositions = function() {
      if (this.isMode('visual')) {
        return this.editor.getSelections().map(this.getCursorPositionForSelection.bind(this));
      } else {
        return this.editor.getCursorBufferPositions();
      }
    };

    Base.prototype.getBufferPositionForCursor = function(cursor) {
      if (this.isMode('visual')) {
        return this.getCursorPositionForSelection(cursor.selection);
      } else {
        return cursor.getBufferPosition();
      }
    };

    Base.prototype.getCursorPositionForSelection = function(selection) {
      var options;
      options = {
        fromProperty: true,
        allowFallback: true
      };
      return swrap(selection).getBufferPositionFor('head', options);
    };

    Base.prototype.toString = function() {
      var str;
      str = this.getName();
      if (this.hasTarget()) {
        str += ", target=" + (this.getTarget().toString());
      }
      return str;
    };

    Base.prototype.emitWillSelectTarget = function() {
      return this.vimState.emitter.emit('will-select-target');
    };

    Base.prototype.emitDidSelectTarget = function() {
      return this.vimState.emitter.emit('did-select-target');
    };

    Base.prototype.emitDidSetTarget = function(operator) {
      return this.vimState.emitter.emit('did-set-target', operator);
    };

    Base.prototype.emitDidRestoreCursorPositions = function() {
      return this.vimState.emitter.emit('did-restore-cursor-positions');
    };

    Base.init = function(service) {
      var __, klass, ref1;
      getEditorState = service.getEditorState;
      this.subscriptions = new CompositeDisposable();
      ['./operator', './operator-insert', './operator-transform-string', './motion', './motion-search', './text-object', './insert-mode', './misc-command'].forEach(require);
      ref1 = this.getRegistries();
      for (__ in ref1) {
        klass = ref1[__];
        if (klass.isCommand()) {
          this.subscriptions.add(klass.registerCommand());
        }
      }
      return this.subscriptions;
    };

    Base.reset = function() {
      var __, klass, ref1, results;
      this.subscriptions.dispose();
      this.subscriptions = new CompositeDisposable();
      ref1 = this.getRegistries();
      results = [];
      for (__ in ref1) {
        klass = ref1[__];
        if (klass.isCommand()) {
          results.push(this.subscriptions.add(klass.registerCommand()));
        }
      }
      return results;
    };

    registries = {
      Base: Base
    };

    Base.extend = function(command) {
      this.command = command != null ? command : true;
      if ((name in registries) && (!this.suppressWarning)) {
        console.warn("Duplicate constructor " + this.name);
      }
      return registries[this.name] = this;
    };

    Base.getClass = function(name) {
      var klass;
      if ((klass = registries[name]) != null) {
        return klass;
      } else {
        throw new Error("class '" + name + "' not found");
      }
    };

    Base.getRegistries = function() {
      return registries;
    };

    Base.isCommand = function() {
      return this.command;
    };

    Base.commandPrefix = 'vim-mode-plus';

    Base.getCommandName = function() {
      return this.commandPrefix + ':' + _.dasherize(this.name);
    };

    Base.getCommandNameWithoutPrefix = function() {
      return _.dasherize(this.name);
    };

    Base.commandScope = 'atom-text-editor';

    Base.getCommandScope = function() {
      return this.commandScope;
    };

    Base.getDesctiption = function() {
      if (this.hasOwnProperty("description")) {
        return this.description;
      } else {
        return null;
      }
    };

    Base.registerCommand = function() {
      var klass;
      klass = this;
      return atom.commands.add(this.getCommandScope(), this.getCommandName(), function(event) {
        var ref1, vimState;
        vimState = (ref1 = getEditorState(this.getModel())) != null ? ref1 : getEditorState(atom.workspace.getActiveTextEditor());
        if (vimState != null) {
          vimState.operationStack.run(klass);
        }
        return event.stopPropagation();
      });
    };

    return Base;

  })();

  module.exports = Base;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvYmFzZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDhPQUFBO0lBQUE7Ozs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLFFBQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7RUFDVixzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLE1BS0ksT0FBQSxDQUFRLFNBQVIsQ0FMSixFQUNFLHFEQURGLEVBRUUsNkNBRkYsRUFHRSw2Q0FIRixFQUlFOztFQUVGLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBRVIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUNYLFVBQUEsR0FBYTs7RUFDYixjQUFBLEdBQWlCOztFQUNoQix3QkFBeUIsT0FBQSxDQUFRLFVBQVI7O0VBRTFCLGVBQUEsR0FBa0IsQ0FDaEIsa0JBRGdCLEVBRWhCLG1CQUZnQixFQUdoQixrQkFIZ0IsRUFLaEIsbUJBTGdCLEVBTWhCLG9CQU5nQixFQU9oQixtQkFQZ0IsRUFRaEIsb0JBUmdCLEVBVWhCLGdCQVZnQixFQVdoQixvQkFYZ0IsRUFZaEIsbUJBWmdCLEVBYWhCLHlCQWJnQixFQWNoQix3QkFkZ0IsRUFlaEIsNkJBZmdCLEVBZ0JoQiwwQkFoQmdCLEVBaUJoQiwwQkFqQmdCLEVBbUJoQixvQkFuQmdCLEVBb0JoQixtQkFwQmdCLEVBcUJoQixzQkFyQmdCLEVBc0JoQiwyQkF0QmdCLEVBdUJoQixxQkF2QmdCLEVBeUJoQixzQkF6QmdCLEVBMkJoQix1QkEzQmdCLEVBNEJoQixXQTVCZ0IsRUE2QmhCLFFBN0JnQixFQThCaEIsd0JBOUJnQixFQStCaEIsMkJBL0JnQixFQWdDaEIsZ0JBaENnQjs7RUFtQ1o7QUFDSixRQUFBOztJQUFBLFFBQVEsQ0FBQyxXQUFULENBQXFCLElBQXJCOztJQUNBLElB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QUFnQixhQUFoQixDQUFIO2VBQ0UsSUFBQyxDQUFBLFlBREg7T0FBQSxNQUFBO2VBR0UsS0FIRjs7SUFEZTs7SUFNakIsSUFBQyxDQUFBLGVBQUQsR0FBa0IsU0FBQTtBQUNoQixVQUFBO01BQUEsS0FBQSxHQUFRO2FBQ1IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLElBQUMsQ0FBQSxlQUFELENBQUEsQ0FBbEIsRUFBc0MsSUFBQyxDQUFBLGNBQUQsQ0FBQSxDQUF0QyxFQUF5RCxTQUFDLEtBQUQ7QUFDdkQsWUFBQTtRQUFBLFFBQUEsNkRBQXlDLGNBQUEsQ0FBZSxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUEsQ0FBZjtRQUN6QyxJQUFHLGdCQUFIO1VBRUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxHQUF4QixDQUE0QixLQUE1QixFQUZGOztlQUdBLEtBQUssQ0FBQyxlQUFOLENBQUE7TUFMdUQsQ0FBekQ7SUFGZ0I7Ozs7OztFQVNwQixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQTdWakIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuRGVsZWdhdG8gPSByZXF1aXJlICdkZWxlZ2F0bydcbntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG57XG4gIGdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uXG4gIGdldFZpbUxhc3RCdWZmZXJSb3dcbiAgZ2V0VmltTGFzdFNjcmVlblJvd1xuICBnZXRXb3JkQnVmZmVyUmFuZ2VBbmRLaW5kQXRCdWZmZXJQb3NpdGlvblxufSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5cbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcbnNlbGVjdExpc3QgPSBudWxsXG5nZXRFZGl0b3JTdGF0ZSA9IG51bGwgIyBzZXQgYnkgQmFzZS5pbml0KClcbntPcGVyYXRpb25BYm9ydGVkRXJyb3J9ID0gcmVxdWlyZSAnLi9lcnJvcnMnXG5cbnZpbVN0YXRlTWV0aG9kcyA9IFtcbiAgXCJvbkRpZENoYW5nZUlucHV0XCJcbiAgXCJvbkRpZENvbmZpcm1JbnB1dFwiXG4gIFwib25EaWRDYW5jZWxJbnB1dFwiXG5cbiAgXCJvbkRpZENoYW5nZVNlYXJjaFwiXG4gIFwib25EaWRDb25maXJtU2VhcmNoXCJcbiAgXCJvbkRpZENhbmNlbFNlYXJjaFwiXG4gIFwib25EaWRDb21tYW5kU2VhcmNoXCJcblxuICBcIm9uRGlkU2V0VGFyZ2V0XCJcbiAgXCJvbldpbGxTZWxlY3RUYXJnZXRcIlxuICBcIm9uRGlkU2VsZWN0VGFyZ2V0XCJcbiAgXCJwcmVlbXB0V2lsbFNlbGVjdFRhcmdldFwiXG4gIFwicHJlZW1wdERpZFNlbGVjdFRhcmdldFwiXG4gIFwib25EaWRSZXN0b3JlQ3Vyc29yUG9zaXRpb25zXCJcbiAgXCJvbkRpZFNldE9wZXJhdG9yTW9kaWZpZXJcIlxuICBcIm9uRGlkUmVzZXRPcGVyYXRpb25TdGFja1wiXG5cbiAgXCJvbldpbGxBY3RpdmF0ZU1vZGVcIlxuICBcIm9uRGlkQWN0aXZhdGVNb2RlXCJcbiAgXCJvbldpbGxEZWFjdGl2YXRlTW9kZVwiXG4gIFwicHJlZW1wdFdpbGxEZWFjdGl2YXRlTW9kZVwiXG4gIFwib25EaWREZWFjdGl2YXRlTW9kZVwiXG5cbiAgXCJvbkRpZEZpbmlzaE9wZXJhdGlvblwiXG5cbiAgXCJvbkRpZENhbmNlbFNlbGVjdExpc3RcIlxuICBcInN1YnNjcmliZVwiXG4gIFwiaXNNb2RlXCJcbiAgXCJnZXRCbG9ja3dpc2VTZWxlY3Rpb25zXCJcbiAgXCJ1cGRhdGVTZWxlY3Rpb25Qcm9wZXJ0aWVzXCJcbiAgXCJhZGRUb0NsYXNzTGlzdFwiXG5dXG5cbmNsYXNzIEJhc2VcbiAgRGVsZWdhdG8uaW5jbHVkZUludG8odGhpcylcbiAgQGRlbGVnYXRlc01ldGhvZHModmltU3RhdGVNZXRob2RzLi4uLCB0b1Byb3BlcnR5OiAndmltU3RhdGUnKVxuXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlLCBwcm9wZXJ0aWVzPW51bGwpIC0+XG4gICAge0BlZGl0b3IsIEBlZGl0b3JFbGVtZW50LCBAZ2xvYmFsU3RhdGV9ID0gQHZpbVN0YXRlXG4gICAgXy5leHRlbmQodGhpcywgcHJvcGVydGllcykgaWYgcHJvcGVydGllcz9cbiAgICBpZiBzZXR0aW5ncy5nZXQoJ3Nob3dIb3Zlck9uT3BlcmF0ZScpXG4gICAgICBob3ZlciA9IEBob3Zlcj9bc2V0dGluZ3MuZ2V0KCdzaG93SG92ZXJPbk9wZXJhdGVJY29uJyldXG4gICAgICBpZiBob3Zlcj8gYW5kIG5vdCBAaXNDb21wbGV0ZSgpXG4gICAgICAgIEBhZGRIb3Zlcihob3ZlcilcblxuICAjIFRlbXBsYXRlXG4gIGluaXRpYWxpemU6IC0+XG5cbiAgIyBPcGVyYXRpb24gcHJvY2Vzc29yIGV4ZWN1dGUgb25seSB3aGVuIGlzQ29tcGxldGUoKSByZXR1cm4gdHJ1ZS5cbiAgIyBJZiBmYWxzZSwgb3BlcmF0aW9uIHByb2Nlc3NvciBwb3N0cG9uZSBpdHMgZXhlY3V0aW9uLlxuICBpc0NvbXBsZXRlOiAtPlxuICAgIGlmIChAaXNSZXF1aXJlSW5wdXQoKSBhbmQgbm90IEBoYXNJbnB1dCgpKVxuICAgICAgZmFsc2VcbiAgICBlbHNlIGlmIEBpc1JlcXVpcmVUYXJnZXQoKVxuICAgICAgIyBXaGVuIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGluIEJhc2U6OmNvbnN0cnVjdG9yXG4gICAgICAjIHRhZ2VydCBpcyBzdGlsbCBzdHJpbmcgbGlrZSBgTW92ZVRvUmlnaHRgLCBpbiB0aGlzIGNhc2UgaXNDb21wbGV0ZVxuICAgICAgIyBpcyBub3QgYXZhaWxhYmxlLlxuICAgICAgQGdldFRhcmdldCgpPy5pc0NvbXBsZXRlPygpXG4gICAgZWxzZVxuICAgICAgdHJ1ZVxuXG4gIHRhcmdldDogbnVsbFxuICBoYXNUYXJnZXQ6IC0+IEB0YXJnZXQ/XG4gIGdldFRhcmdldDogLT4gQHRhcmdldFxuXG4gIHJlcXVpcmVUYXJnZXQ6IGZhbHNlXG4gIGlzUmVxdWlyZVRhcmdldDogLT4gQHJlcXVpcmVUYXJnZXRcblxuICByZXF1aXJlSW5wdXQ6IGZhbHNlXG4gIGlzUmVxdWlyZUlucHV0OiAtPiBAcmVxdWlyZUlucHV0XG5cbiAgcmVjb3JkYWJsZTogZmFsc2VcbiAgaXNSZWNvcmRhYmxlOiAtPiBAcmVjb3JkYWJsZVxuXG4gIHJlcGVhdGVkOiBmYWxzZVxuICBpc1JlcGVhdGVkOiAtPiBAcmVwZWF0ZWRcbiAgc2V0UmVwZWF0ZWQ6IC0+IEByZXBlYXRlZCA9IHRydWVcblxuICAjIEludGVuZGVkIHRvIGJlIHVzZWQgYnkgVGV4dE9iamVjdCBvciBNb3Rpb25cbiAgb3BlcmF0b3I6IG51bGxcbiAgaGFzT3BlcmF0b3I6IC0+IEBvcGVyYXRvcj9cbiAgZ2V0T3BlcmF0b3I6IC0+IEBvcGVyYXRvclxuICBzZXRPcGVyYXRvcjogKEBvcGVyYXRvcikgLT4gQG9wZXJhdG9yXG4gIGlzQXNPcGVyYXRvclRhcmdldDogLT5cbiAgICBAaGFzT3BlcmF0b3IoKSBhbmQgbm90IEBnZXRPcGVyYXRvcigpLmluc3RhbmNlb2YoJ1NlbGVjdCcpXG5cbiAgYWJvcnQ6IC0+XG4gICAgdGhyb3cgbmV3IE9wZXJhdGlvbkFib3J0ZWRFcnJvcignYWJvcnRlZCcpXG5cbiAgIyBDb3VudFxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY291bnQ6IG51bGxcbiAgZGVmYXVsdENvdW50OiAxXG4gIGdldENvdW50OiAtPlxuICAgIEBjb3VudCA/PSBAdmltU3RhdGUuZ2V0Q291bnQoKSA/IEBkZWZhdWx0Q291bnRcblxuICByZXNldENvdW50OiAtPlxuICAgIEBjb3VudCA9IG51bGxcblxuICBpc0RlZmF1bHRDb3VudDogLT5cbiAgICBAY291bnQgaXMgQGRlZmF1bHRDb3VudFxuXG4gICMgUmVnaXN0ZXJcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJlZ2lzdGVyOiBudWxsXG4gIGdldFJlZ2lzdGVyTmFtZTogLT5cbiAgICBAdmltU3RhdGUucmVnaXN0ZXIuZ2V0TmFtZSgpXG4gICAgdGV4dCA9IEB2aW1TdGF0ZS5yZWdpc3Rlci5nZXRUZXh0KEBnZXRJbnB1dCgpLCBzZWxlY3Rpb24pXG5cbiAgZ2V0UmVnaXN0ZXJWYWx1ZUFzVGV4dDogKG5hbWU9bnVsbCwgc2VsZWN0aW9uKSAtPlxuICAgIEB2aW1TdGF0ZS5yZWdpc3Rlci5nZXRUZXh0KG5hbWUsIHNlbGVjdGlvbilcblxuICBpc0RlZmF1bHRSZWdpc3Rlck5hbWU6IC0+XG4gICAgQHZpbVN0YXRlLnJlZ2lzdGVyLmlzRGVmYXVsdE5hbWUoKVxuXG4gICMgTWlzY1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY291bnRUaW1lczogKGZuKSAtPlxuICAgIHJldHVybiBpZiAobGFzdCA9IEBnZXRDb3VudCgpKSA8IDFcblxuICAgIHN0b3BwZWQgPSBmYWxzZVxuICAgIHN0b3AgPSAtPiBzdG9wcGVkID0gdHJ1ZVxuICAgIGZvciBjb3VudCBpbiBbMS4ubGFzdF1cbiAgICAgIGlzRmluYWwgPSBjb3VudCBpcyBsYXN0XG4gICAgICBmbih7Y291bnQsIGlzRmluYWwsIHN0b3B9KVxuICAgICAgYnJlYWsgaWYgc3RvcHBlZFxuXG4gIGFjdGl2YXRlTW9kZTogKG1vZGUsIHN1Ym1vZGUpIC0+XG4gICAgQG9uRGlkRmluaXNoT3BlcmF0aW9uID0+XG4gICAgICBAdmltU3RhdGUuYWN0aXZhdGUobW9kZSwgc3VibW9kZSlcblxuICBhY3RpdmF0ZU1vZGVJZk5lY2Vzc2FyeTogKG1vZGUsIHN1Ym1vZGUpIC0+XG4gICAgdW5sZXNzIEB2aW1TdGF0ZS5pc01vZGUobW9kZSwgc3VibW9kZSlcbiAgICAgIEBhY3RpdmF0ZU1vZGUobW9kZSwgc3VibW9kZSlcblxuICBhZGRIb3ZlcjogKHRleHQsIHtyZXBsYWNlfT17fSwgcG9pbnQ9bnVsbCkgLT5cbiAgICBpZiByZXBsYWNlID8gZmFsc2VcbiAgICAgIEB2aW1TdGF0ZS5ob3Zlci5yZXBsYWNlTGFzdFNlY3Rpb24odGV4dCwgcG9pbnQpXG4gICAgZWxzZVxuICAgICAgQHZpbVN0YXRlLmhvdmVyLmFkZCh0ZXh0LCBwb2ludClcblxuICBuZXc6IChuYW1lLCBwcm9wZXJ0aWVzKSAtPlxuICAgIGtsYXNzID0gQmFzZS5nZXRDbGFzcyhuYW1lKVxuICAgIG5ldyBrbGFzcyhAdmltU3RhdGUsIHByb3BlcnRpZXMpXG5cbiAgY2xvbmU6ICh2aW1TdGF0ZSkgLT5cbiAgICBwcm9wZXJ0aWVzID0ge31cbiAgICBleGNsdWRlUHJvcGVydGllcyA9IFsnZWRpdG9yJywgJ2VkaXRvckVsZW1lbnQnLCAnZ2xvYmFsU3RhdGUnLCAndmltU3RhdGUnXVxuICAgIGZvciBvd24ga2V5LCB2YWx1ZSBvZiB0aGlzIHdoZW4ga2V5IG5vdCBpbiBleGNsdWRlUHJvcGVydGllc1xuICAgICAgcHJvcGVydGllc1trZXldID0gdmFsdWVcbiAgICBrbGFzcyA9IHRoaXMuY29uc3RydWN0b3JcbiAgICBuZXcga2xhc3ModmltU3RhdGUsIHByb3BlcnRpZXMpXG5cbiAgY2FuY2VsT3BlcmF0aW9uOiAtPlxuICAgIEB2aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5jYW5jZWwoKVxuXG4gIHByb2Nlc3NPcGVyYXRpb246IC0+XG4gICAgQHZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLnByb2Nlc3MoKVxuXG4gIGZvY3VzU2VsZWN0TGlzdDogKG9wdGlvbnM9e30pIC0+XG4gICAgQG9uRGlkQ2FuY2VsU2VsZWN0TGlzdCA9PlxuICAgICAgQGNhbmNlbE9wZXJhdGlvbigpXG4gICAgc2VsZWN0TGlzdCA/PSByZXF1aXJlICcuL3NlbGVjdC1saXN0J1xuICAgIHNlbGVjdExpc3Quc2hvdyhAdmltU3RhdGUsIG9wdGlvbnMpXG5cbiAgaW5wdXQ6IG51bGxcbiAgaGFzSW5wdXQ6IC0+IEBpbnB1dD9cbiAgZ2V0SW5wdXQ6IC0+IEBpbnB1dFxuXG4gIGZvY3VzSW5wdXQ6IChjaGFyc01heCkgLT5cbiAgICBAb25EaWRDb25maXJtSW5wdXQgKGlucHV0KSA9PlxuICAgICAgIyBbRklYTUUgUkVBTExZXSB3aGVuIGJvdGggb3BlcmF0b3IgYW5kIG1vdGlvbiB0YWtlIHVzZXItaW5wdXQsXG4gICAgICAjIEN1cnJlbnRseSBpbnB1dCBVSSBpcyB1bmFwcHJvcHJlYXRlbHkgc2hhcmVkIGJ5IG9wZXJhdG9yIGFuZCBtb3Rpb24uXG4gICAgICAjIFNvIHdpdGhvdXQgdGhpcyBndWFyZCwgQGlucHV0IGlzIG92ZXJ3cml0dGVuIGJ5IGxhdGVyIGlucHV0LlxuICAgICAgdW5sZXNzIEBpbnB1dD9cbiAgICAgICAgQGlucHV0ID0gaW5wdXRcbiAgICAgICAgQHByb2Nlc3NPcGVyYXRpb24oKVxuXG4gICAgIyBGcm9tIDJuZCBhZGRIb3Zlciwgd2UgcmVwbGFjZSBsYXN0IHNlY3Rpb24gb2YgaG92ZXJcbiAgICAjIHRvIHN5bmMgY29udGVudCB3aXRoIGlucHV0IG1pbmkgZWRpdG9yLlxuICAgIHVubGVzcyBjaGFyc01heCBpcyAxXG4gICAgICByZXBsYWNlID0gZmFsc2VcbiAgICAgIEBvbkRpZENoYW5nZUlucHV0IChpbnB1dCkgPT5cbiAgICAgICAgQGFkZEhvdmVyKGlucHV0LCB7cmVwbGFjZX0pXG4gICAgICAgIHJlcGxhY2UgPSB0cnVlXG5cbiAgICBAb25EaWRDYW5jZWxJbnB1dCA9PlxuICAgICAgQGNhbmNlbE9wZXJhdGlvbigpXG5cbiAgICBAdmltU3RhdGUuaW5wdXQuZm9jdXMoY2hhcnNNYXgpXG5cbiAgZ2V0VmltRW9mQnVmZmVyUG9zaXRpb246IC0+XG4gICAgZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oQGVkaXRvcilcblxuICBnZXRWaW1MYXN0QnVmZmVyUm93OiAtPlxuICAgIGdldFZpbUxhc3RCdWZmZXJSb3coQGVkaXRvcilcblxuICBnZXRWaW1MYXN0U2NyZWVuUm93OiAtPlxuICAgIGdldFZpbUxhc3RTY3JlZW5Sb3coQGVkaXRvcilcblxuICBnZXRXb3JkQnVmZmVyUmFuZ2VBbmRLaW5kQXRCdWZmZXJQb3NpdGlvbjogKHBvaW50LCBvcHRpb25zKSAtPlxuICAgIGdldFdvcmRCdWZmZXJSYW5nZUFuZEtpbmRBdEJ1ZmZlclBvc2l0aW9uKEBlZGl0b3IsIHBvaW50LCBvcHRpb25zKVxuXG4gIGluc3RhbmNlb2Y6IChrbGFzc05hbWUpIC0+XG4gICAgdGhpcyBpbnN0YW5jZW9mIEJhc2UuZ2V0Q2xhc3Moa2xhc3NOYW1lKVxuXG4gIGlzOiAoa2xhc3NOYW1lKSAtPlxuICAgIHRoaXMuY29uc3RydWN0b3IgaXMgQmFzZS5nZXRDbGFzcyhrbGFzc05hbWUpXG5cbiAgaXNPcGVyYXRvcjogLT5cbiAgICBAaW5zdGFuY2VvZignT3BlcmF0b3InKVxuXG4gIGlzTW90aW9uOiAtPlxuICAgIEBpbnN0YW5jZW9mKCdNb3Rpb24nKVxuXG4gIGlzVGV4dE9iamVjdDogLT5cbiAgICBAaW5zdGFuY2VvZignVGV4dE9iamVjdCcpXG5cbiAgaXNUYXJnZXQ6IC0+XG4gICAgQGlzTW90aW9uKCkgb3IgQGlzVGV4dE9iamVjdCgpXG5cbiAgZ2V0TmFtZTogLT5cbiAgICBAY29uc3RydWN0b3IubmFtZVxuXG4gIGdldEN1cnNvckJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgICBAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkpXG4gICAgZWxzZVxuICAgICAgQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG5cbiAgZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zOiAtPlxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgICBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5tYXAoQGdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uLmJpbmQodGhpcykpXG4gICAgZWxzZVxuICAgICAgQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbnMoKVxuXG4gIGdldEJ1ZmZlclBvc2l0aW9uRm9yQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG4gICAgICBAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oY3Vyc29yLnNlbGVjdGlvbilcbiAgICBlbHNlXG4gICAgICBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuXG4gIGdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIG9wdGlvbnMgPSB7ZnJvbVByb3BlcnR5OiB0cnVlLCBhbGxvd0ZhbGxiYWNrOiB0cnVlfVxuICAgIHN3cmFwKHNlbGVjdGlvbikuZ2V0QnVmZmVyUG9zaXRpb25Gb3IoJ2hlYWQnLCBvcHRpb25zKVxuXG4gIHRvU3RyaW5nOiAtPlxuICAgIHN0ciA9IEBnZXROYW1lKClcbiAgICBzdHIgKz0gXCIsIHRhcmdldD0je0BnZXRUYXJnZXQoKS50b1N0cmluZygpfVwiIGlmIEBoYXNUYXJnZXQoKVxuICAgIHN0clxuXG4gIGVtaXRXaWxsU2VsZWN0VGFyZ2V0OiAtPlxuICAgIEB2aW1TdGF0ZS5lbWl0dGVyLmVtaXQoJ3dpbGwtc2VsZWN0LXRhcmdldCcpXG5cbiAgZW1pdERpZFNlbGVjdFRhcmdldDogLT5cbiAgICBAdmltU3RhdGUuZW1pdHRlci5lbWl0KCdkaWQtc2VsZWN0LXRhcmdldCcpXG5cbiAgZW1pdERpZFNldFRhcmdldDogKG9wZXJhdG9yKSAtPlxuICAgIEB2aW1TdGF0ZS5lbWl0dGVyLmVtaXQoJ2RpZC1zZXQtdGFyZ2V0Jywgb3BlcmF0b3IpXG5cbiAgZW1pdERpZFJlc3RvcmVDdXJzb3JQb3NpdGlvbnM6IC0+XG4gICAgQHZpbVN0YXRlLmVtaXR0ZXIuZW1pdCgnZGlkLXJlc3RvcmUtY3Vyc29yLXBvc2l0aW9ucycpXG5cbiAgIyBDbGFzcyBtZXRob2RzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAaW5pdDogKHNlcnZpY2UpIC0+XG4gICAge2dldEVkaXRvclN0YXRlfSA9IHNlcnZpY2VcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIFtcbiAgICAgICcuL29wZXJhdG9yJywgJy4vb3BlcmF0b3ItaW5zZXJ0JywgJy4vb3BlcmF0b3ItdHJhbnNmb3JtLXN0cmluZycsXG4gICAgICAnLi9tb3Rpb24nLCAnLi9tb3Rpb24tc2VhcmNoJyxcbiAgICAgICcuL3RleHQtb2JqZWN0JyxcbiAgICAgICcuL2luc2VydC1tb2RlJywgJy4vbWlzYy1jb21tYW5kJ1xuICAgIF0uZm9yRWFjaChyZXF1aXJlKVxuXG4gICAgZm9yIF9fLCBrbGFzcyBvZiBAZ2V0UmVnaXN0cmllcygpIHdoZW4ga2xhc3MuaXNDb21tYW5kKClcbiAgICAgIEBzdWJzY3JpcHRpb25zLmFkZChrbGFzcy5yZWdpc3RlckNvbW1hbmQoKSlcbiAgICBAc3Vic2NyaXB0aW9uc1xuXG4gICMgRm9yIGRldmVsb3BtZW50IGVhc2luZXNzIHdpdGhvdXQgcmVsb2FkaW5nIHZpbS1tb2RlLXBsdXNcbiAgQHJlc2V0OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIGZvciBfXywga2xhc3Mgb2YgQGdldFJlZ2lzdHJpZXMoKSB3aGVuIGtsYXNzLmlzQ29tbWFuZCgpXG4gICAgICBAc3Vic2NyaXB0aW9ucy5hZGQoa2xhc3MucmVnaXN0ZXJDb21tYW5kKCkpXG5cbiAgcmVnaXN0cmllcyA9IHtCYXNlfVxuICBAZXh0ZW5kOiAoQGNvbW1hbmQ9dHJ1ZSkgLT5cbiAgICBpZiAobmFtZSBvZiByZWdpc3RyaWVzKSBhbmQgKG5vdCBAc3VwcHJlc3NXYXJuaW5nKVxuICAgICAgY29uc29sZS53YXJuKFwiRHVwbGljYXRlIGNvbnN0cnVjdG9yICN7QG5hbWV9XCIpXG4gICAgcmVnaXN0cmllc1tAbmFtZV0gPSB0aGlzXG5cbiAgQGdldENsYXNzOiAobmFtZSkgLT5cbiAgICBpZiAoa2xhc3MgPSByZWdpc3RyaWVzW25hbWVdKT9cbiAgICAgIGtsYXNzXG4gICAgZWxzZVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2xhc3MgJyN7bmFtZX0nIG5vdCBmb3VuZFwiKVxuXG4gIEBnZXRSZWdpc3RyaWVzOiAtPlxuICAgIHJlZ2lzdHJpZXNcblxuICBAaXNDb21tYW5kOiAtPlxuICAgIEBjb21tYW5kXG5cbiAgQGNvbW1hbmRQcmVmaXg6ICd2aW0tbW9kZS1wbHVzJ1xuICBAZ2V0Q29tbWFuZE5hbWU6IC0+XG4gICAgQGNvbW1hbmRQcmVmaXggKyAnOicgKyBfLmRhc2hlcml6ZShAbmFtZSlcblxuICBAZ2V0Q29tbWFuZE5hbWVXaXRob3V0UHJlZml4OiAtPlxuICAgIF8uZGFzaGVyaXplKEBuYW1lKVxuXG4gIEBjb21tYW5kU2NvcGU6ICdhdG9tLXRleHQtZWRpdG9yJ1xuICBAZ2V0Q29tbWFuZFNjb3BlOiAtPlxuICAgIEBjb21tYW5kU2NvcGVcblxuICBAZ2V0RGVzY3RpcHRpb246IC0+XG4gICAgaWYgQGhhc093blByb3BlcnR5KFwiZGVzY3JpcHRpb25cIilcbiAgICAgIEBkZXNjcmlwdGlvblxuICAgIGVsc2VcbiAgICAgIG51bGxcblxuICBAcmVnaXN0ZXJDb21tYW5kOiAtPlxuICAgIGtsYXNzID0gdGhpc1xuICAgIGF0b20uY29tbWFuZHMuYWRkIEBnZXRDb21tYW5kU2NvcGUoKSwgQGdldENvbW1hbmROYW1lKCksIChldmVudCkgLT5cbiAgICAgIHZpbVN0YXRlID0gZ2V0RWRpdG9yU3RhdGUoQGdldE1vZGVsKCkpID8gZ2V0RWRpdG9yU3RhdGUoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKVxuICAgICAgaWYgdmltU3RhdGU/XG4gICAgICAgICMgUmVhc29uOiBodHRwczovL2dpdGh1Yi5jb20vdDltZC9hdG9tLXZpbS1tb2RlLXBsdXMvaXNzdWVzLzg1XG4gICAgICAgIHZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLnJ1bihrbGFzcylcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZVxuIl19
