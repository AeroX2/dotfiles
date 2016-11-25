(function() {
  var Base, CompositeDisposable, Disposable, MoveToRelativeLine, OperationAbortedError, OperationStack, Select, moveCursorLeft, ref, ref1, settings, swrap;

  ref = require('atom'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  Base = require('./base');

  moveCursorLeft = require('./utils').moveCursorLeft;

  settings = require('./settings');

  ref1 = {}, Select = ref1.Select, MoveToRelativeLine = ref1.MoveToRelativeLine;

  OperationAbortedError = require('./errors').OperationAbortedError;

  swrap = require('./selection-wrapper');

  OperationStack = (function() {
    Object.defineProperty(OperationStack.prototype, 'mode', {
      get: function() {
        return this.modeManager.mode;
      }
    });

    Object.defineProperty(OperationStack.prototype, 'submode', {
      get: function() {
        return this.modeManager.submode;
      }
    });

    function OperationStack(vimState) {
      var ref2;
      this.vimState = vimState;
      ref2 = this.vimState, this.editor = ref2.editor, this.editorElement = ref2.editorElement, this.modeManager = ref2.modeManager;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      if (Select == null) {
        Select = Base.getClass('Select');
      }
      if (MoveToRelativeLine == null) {
        MoveToRelativeLine = Base.getClass('MoveToRelativeLine');
      }
      this.reset();
    }

    OperationStack.prototype.subscribe = function(handler) {
      this.operationSubscriptions.add(handler);
      return handler;
    };

    OperationStack.prototype.reset = function() {
      var ref2;
      this.resetCount();
      this.stack = [];
      this.processing = false;
      this.vimState.emitDidResetOperationStack();
      if ((ref2 = this.operationSubscriptions) != null) {
        ref2.dispose();
      }
      return this.operationSubscriptions = new CompositeDisposable;
    };

    OperationStack.prototype.destroy = function() {
      var ref2, ref3;
      this.subscriptions.dispose();
      if ((ref2 = this.operationSubscriptions) != null) {
        ref2.dispose();
      }
      return ref3 = {}, this.stack = ref3.stack, this.operationSubscriptions = ref3.operationSubscriptions, ref3;
    };

    OperationStack.prototype.peekTop = function() {
      return this.stack[this.stack.length - 1];
    };

    OperationStack.prototype.isEmpty = function() {
      return this.stack.length === 0;
    };

    OperationStack.prototype.run = function(klass, properties) {
      var error, operation, ref2, type;
      try {
        type = typeof klass;
        if (type === 'object') {
          operation = klass;
        } else {
          if (type === 'string') {
            klass = Base.getClass(klass);
          }
          if (((ref2 = this.peekTop()) != null ? ref2.constructor : void 0) === klass) {
            operation = new MoveToRelativeLine(this.vimState);
          } else {
            operation = new klass(this.vimState, properties);
          }
        }
        if (operation.isTextObject() && this.mode !== 'operator-pending' || operation.isMotion() && this.mode === 'visual') {
          operation = new Select(this.vimState).setTarget(operation);
        }
        if (this.isEmpty() || (this.peekTop().isOperator() && operation.isTarget())) {
          this.stack.push(operation);
          return this.process();
        } else {
          if (this.peekTop().isOperator()) {
            this.vimState.emitDidFailToSetTarget();
          }
          return this.vimState.resetNormalMode();
        }
      } catch (error1) {
        error = error1;
        return this.handleError(error);
      }
    };

    OperationStack.prototype.runRecorded = function() {
      var count, operation, ref2;
      if (operation = this.recordedOperation) {
        operation.setRepeated();
        if (this.hasCount()) {
          count = this.getCount();
          operation.count = count;
          if ((ref2 = operation.target) != null) {
            ref2.count = count;
          }
        }
        return this.editor.transact((function(_this) {
          return function() {
            return _this.run(operation);
          };
        })(this));
      }
    };

    OperationStack.prototype.runRecordedMotion = function(key, arg) {
      var operation, reverse;
      reverse = (arg != null ? arg : {}).reverse;
      if (!(operation = this.vimState.globalState.get(key))) {
        return;
      }
      operation = operation.clone(this.vimState);
      operation.setRepeated();
      operation.resetCount();
      if (reverse) {
        operation.backwards = !operation.backwards;
      }
      return this.run(operation);
    };

    OperationStack.prototype.runCurrentFind = function(options) {
      return this.runRecordedMotion('currentFind', options);
    };

    OperationStack.prototype.runCurrentSearch = function(options) {
      return this.runRecordedMotion('currentSearch', options);
    };

    OperationStack.prototype.handleError = function(error) {
      this.vimState.reset();
      if (!(error instanceof OperationAbortedError)) {
        throw error;
      }
    };

    OperationStack.prototype.isProcessing = function() {
      return this.processing;
    };

    OperationStack.prototype.process = function() {
      var base, commandName, operation, top;
      this.processing = true;
      if (this.stack.length === 2) {
        if (!this.peekTop().isComplete()) {
          return;
        }
        operation = this.stack.pop();
        this.peekTop().setTarget(operation);
      }
      top = this.peekTop();
      if (top.isComplete()) {
        return this.execute(this.stack.pop());
      } else {
        if (this.mode === 'normal' && top.isOperator()) {
          this.modeManager.activate('operator-pending');
        }
        if (commandName = typeof (base = top.constructor).getCommandNameWithoutPrefix === "function" ? base.getCommandNameWithoutPrefix() : void 0) {
          return this.addToClassList(commandName + "-pending");
        }
      }
    };

    OperationStack.prototype.execute = function(operation) {
      var execution;
      if (this.mode === 'visual') {
        this.vimState.updatePreviousSelection();
      }
      execution = operation.execute();
      if (execution instanceof Promise) {
        return execution.then((function(_this) {
          return function() {
            return _this.finish(operation);
          };
        })(this))["catch"]((function(_this) {
          return function() {
            return _this.handleError();
          };
        })(this));
      } else {
        return this.finish(operation);
      }
    };

    OperationStack.prototype.cancel = function() {
      var ref2;
      if ((ref2 = this.mode) !== 'visual' && ref2 !== 'insert') {
        this.vimState.resetNormalMode();
      }
      return this.finish();
    };

    OperationStack.prototype.finish = function(operation) {
      if (operation == null) {
        operation = null;
      }
      if (operation != null ? operation.isRecordable() : void 0) {
        this.recordedOperation = operation;
      }
      this.vimState.emitter.emit('did-finish-operation');
      if (this.mode === 'normal') {
        this.ensureAllSelectionsAreEmpty(operation);
        this.ensureAllCursorsAreNotAtEndOfLine();
      } else if (this.mode === 'visual') {
        this.modeManager.updateNarrowedState();
        this.vimState.updatePreviousSelection();
      }
      this.vimState.updateCursorsVisibility();
      return this.vimState.reset();
    };

    OperationStack.prototype.ensureAllSelectionsAreEmpty = function(operation) {
      if (!this.editor.getLastSelection().isEmpty()) {
        if (settings.get('throwErrorOnNonEmptySelectionInNormalMode')) {
          throw new Error("Selection is not empty in normal-mode: " + (operation.toString()));
        } else {
          return this.editor.clearSelections();
        }
      }
    };

    OperationStack.prototype.ensureAllCursorsAreNotAtEndOfLine = function() {
      var cursor, i, len, ref2, results;
      ref2 = this.editor.getCursors();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        cursor = ref2[i];
        if (cursor.isAtEndOfLine()) {
          results.push(moveCursorLeft(cursor, {
            preserveGoalColumn: true
          }));
        }
      }
      return results;
    };

    OperationStack.prototype.addToClassList = function(className) {
      this.editorElement.classList.add(className);
      return this.subscribe(new Disposable((function(_this) {
        return function() {
          return _this.editorElement.classList.remove(className);
        };
      })(this)));
    };

    OperationStack.prototype.hasCount = function() {
      return (this.count['normal'] != null) || (this.count['operator-pending'] != null);
    };

    OperationStack.prototype.getCount = function() {
      var ref2, ref3;
      if (this.hasCount()) {
        return ((ref2 = this.count['normal']) != null ? ref2 : 1) * ((ref3 = this.count['operator-pending']) != null ? ref3 : 1);
      } else {
        return null;
      }
    };

    OperationStack.prototype.setCount = function(number) {
      var base, mode;
      if (this.mode === 'operator-pending') {
        mode = this.mode;
      } else {
        mode = 'normal';
      }
      if ((base = this.count)[mode] == null) {
        base[mode] = 0;
      }
      this.count[mode] = (this.count[mode] * 10) + number;
      this.vimState.hover.add(number);
      return this.vimState.toggleClassList('with-count', true);
    };

    OperationStack.prototype.resetCount = function() {
      this.count = {};
      return this.vimState.toggleClassList('with-count', false);
    };

    return OperationStack;

  })();

  module.exports = OperationStack;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvb3BlcmF0aW9uLXN0YWNrLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBb0MsT0FBQSxDQUFRLE1BQVIsQ0FBcEMsRUFBQywyQkFBRCxFQUFhOztFQUNiLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDTixpQkFBa0IsT0FBQSxDQUFRLFNBQVI7O0VBQ25CLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7RUFDWCxPQUErQixFQUEvQixFQUFDLG9CQUFELEVBQVM7O0VBQ1Isd0JBQXlCLE9BQUEsQ0FBUSxVQUFSOztFQUMxQixLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQVlGO0lBQ0osTUFBTSxDQUFDLGNBQVAsQ0FBc0IsY0FBQyxDQUFBLFNBQXZCLEVBQWtDLE1BQWxDLEVBQTBDO01BQUEsR0FBQSxFQUFLLFNBQUE7ZUFBRyxJQUFDLENBQUEsV0FBVyxDQUFDO01BQWhCLENBQUw7S0FBMUM7O0lBQ0EsTUFBTSxDQUFDLGNBQVAsQ0FBc0IsY0FBQyxDQUFBLFNBQXZCLEVBQWtDLFNBQWxDLEVBQTZDO01BQUEsR0FBQSxFQUFLLFNBQUE7ZUFBRyxJQUFDLENBQUEsV0FBVyxDQUFDO01BQWhCLENBQUw7S0FBN0M7O0lBRWEsd0JBQUMsUUFBRDtBQUNYLFVBQUE7TUFEWSxJQUFDLENBQUEsV0FBRDtNQUNaLE9BQTBDLElBQUMsQ0FBQSxRQUEzQyxFQUFDLElBQUMsQ0FBQSxjQUFBLE1BQUYsRUFBVSxJQUFDLENBQUEscUJBQUEsYUFBWCxFQUEwQixJQUFDLENBQUEsbUJBQUE7TUFFM0IsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxZQUFWLENBQXVCLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLElBQWQsQ0FBdkIsQ0FBbkI7O1FBRUEsU0FBVSxJQUFJLENBQUMsUUFBTCxDQUFjLFFBQWQ7OztRQUNWLHFCQUFzQixJQUFJLENBQUMsUUFBTCxDQUFjLG9CQUFkOztNQUV0QixJQUFDLENBQUEsS0FBRCxDQUFBO0lBVFc7OzZCQVliLFNBQUEsR0FBVyxTQUFDLE9BQUQ7TUFDVCxJQUFDLENBQUEsc0JBQXNCLENBQUMsR0FBeEIsQ0FBNEIsT0FBNUI7YUFDQTtJQUZTOzs2QkFJWCxLQUFBLEdBQU8sU0FBQTtBQUNMLFVBQUE7TUFBQSxJQUFDLENBQUEsVUFBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLEtBQUQsR0FBUztNQUNULElBQUMsQ0FBQSxVQUFELEdBQWM7TUFHZCxJQUFDLENBQUEsUUFBUSxDQUFDLDBCQUFWLENBQUE7O1lBRXVCLENBQUUsT0FBekIsQ0FBQTs7YUFDQSxJQUFDLENBQUEsc0JBQUQsR0FBMEIsSUFBSTtJQVR6Qjs7NkJBV1AsT0FBQSxHQUFTLFNBQUE7QUFDUCxVQUFBO01BQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQUE7O1lBQ3VCLENBQUUsT0FBekIsQ0FBQTs7YUFDQSxPQUFvQyxFQUFwQyxFQUFDLElBQUMsQ0FBQSxhQUFBLEtBQUYsRUFBUyxJQUFDLENBQUEsOEJBQUEsc0JBQVYsRUFBQTtJQUhPOzs2QkFLVCxPQUFBLEdBQVMsU0FBQTthQUNQLElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLEdBQWdCLENBQWhCO0lBREE7OzZCQUdULE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLEtBQWlCO0lBRFY7OzZCQUtULEdBQUEsR0FBSyxTQUFDLEtBQUQsRUFBUSxVQUFSO0FBQ0gsVUFBQTtBQUFBO1FBQ0UsSUFBQSxHQUFPLE9BQU87UUFDZCxJQUFHLElBQUEsS0FBUSxRQUFYO1VBQ0UsU0FBQSxHQUFZLE1BRGQ7U0FBQSxNQUFBO1VBR0UsSUFBZ0MsSUFBQSxLQUFRLFFBQXhDO1lBQUEsS0FBQSxHQUFRLElBQUksQ0FBQyxRQUFMLENBQWMsS0FBZCxFQUFSOztVQUVBLDJDQUFhLENBQUUscUJBQVosS0FBMkIsS0FBOUI7WUFDRSxTQUFBLEdBQWdCLElBQUEsa0JBQUEsQ0FBbUIsSUFBQyxDQUFBLFFBQXBCLEVBRGxCO1dBQUEsTUFBQTtZQUdFLFNBQUEsR0FBZ0IsSUFBQSxLQUFBLENBQU0sSUFBQyxDQUFBLFFBQVAsRUFBaUIsVUFBakIsRUFIbEI7V0FMRjs7UUFXQSxJQUFHLFNBQVMsQ0FBQyxZQUFWLENBQUEsQ0FBQSxJQUE2QixJQUFDLENBQUEsSUFBRCxLQUFXLGtCQUF4QyxJQUE4RCxTQUFTLENBQUMsUUFBVixDQUFBLENBQTlELElBQXVGLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBbkc7VUFDRSxTQUFBLEdBQWdCLElBQUEsTUFBQSxDQUFPLElBQUMsQ0FBQSxRQUFSLENBQWlCLENBQUMsU0FBbEIsQ0FBNEIsU0FBNUIsRUFEbEI7O1FBR0EsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQUEsSUFBYyxDQUFDLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBVSxDQUFDLFVBQVgsQ0FBQSxDQUFBLElBQTRCLFNBQVMsQ0FBQyxRQUFWLENBQUEsQ0FBN0IsQ0FBakI7VUFDRSxJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBWSxTQUFaO2lCQUNBLElBQUMsQ0FBQSxPQUFELENBQUEsRUFGRjtTQUFBLE1BQUE7VUFJRSxJQUFzQyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQVUsQ0FBQyxVQUFYLENBQUEsQ0FBdEM7WUFBQSxJQUFDLENBQUEsUUFBUSxDQUFDLHNCQUFWLENBQUEsRUFBQTs7aUJBQ0EsSUFBQyxDQUFBLFFBQVEsQ0FBQyxlQUFWLENBQUEsRUFMRjtTQWhCRjtPQUFBLGNBQUE7UUFzQk07ZUFDSixJQUFDLENBQUEsV0FBRCxDQUFhLEtBQWIsRUF2QkY7O0lBREc7OzZCQTBCTCxXQUFBLEdBQWEsU0FBQTtBQUNYLFVBQUE7TUFBQSxJQUFHLFNBQUEsR0FBWSxJQUFDLENBQUEsaUJBQWhCO1FBQ0UsU0FBUyxDQUFDLFdBQVYsQ0FBQTtRQUNBLElBQUcsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFIO1VBQ0UsS0FBQSxHQUFRLElBQUMsQ0FBQSxRQUFELENBQUE7VUFDUixTQUFTLENBQUMsS0FBVixHQUFrQjs7Z0JBQ0YsQ0FBRSxLQUFsQixHQUEwQjtXQUg1Qjs7ZUFNQSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVIsQ0FBaUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFDZixLQUFDLENBQUEsR0FBRCxDQUFLLFNBQUw7VUFEZTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakIsRUFSRjs7SUFEVzs7NkJBWWIsaUJBQUEsR0FBbUIsU0FBQyxHQUFELEVBQU0sR0FBTjtBQUNqQixVQUFBO01BRHdCLHlCQUFELE1BQVU7TUFDakMsSUFBQSxDQUFjLENBQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQXRCLENBQTBCLEdBQTFCLENBQVosQ0FBZDtBQUFBLGVBQUE7O01BRUEsU0FBQSxHQUFZLFNBQVMsQ0FBQyxLQUFWLENBQWdCLElBQUMsQ0FBQSxRQUFqQjtNQUNaLFNBQVMsQ0FBQyxXQUFWLENBQUE7TUFDQSxTQUFTLENBQUMsVUFBVixDQUFBO01BQ0EsSUFBRyxPQUFIO1FBQ0UsU0FBUyxDQUFDLFNBQVYsR0FBc0IsQ0FBSSxTQUFTLENBQUMsVUFEdEM7O2FBRUEsSUFBQyxDQUFBLEdBQUQsQ0FBSyxTQUFMO0lBUmlCOzs2QkFVbkIsY0FBQSxHQUFnQixTQUFDLE9BQUQ7YUFDZCxJQUFDLENBQUEsaUJBQUQsQ0FBbUIsYUFBbkIsRUFBa0MsT0FBbEM7SUFEYzs7NkJBR2hCLGdCQUFBLEdBQWtCLFNBQUMsT0FBRDthQUNoQixJQUFDLENBQUEsaUJBQUQsQ0FBbUIsZUFBbkIsRUFBb0MsT0FBcEM7SUFEZ0I7OzZCQUdsQixXQUFBLEdBQWEsU0FBQyxLQUFEO01BQ1gsSUFBQyxDQUFBLFFBQVEsQ0FBQyxLQUFWLENBQUE7TUFDQSxJQUFBLENBQUEsQ0FBTyxLQUFBLFlBQWlCLHFCQUF4QixDQUFBO0FBQ0UsY0FBTSxNQURSOztJQUZXOzs2QkFLYixZQUFBLEdBQWMsU0FBQTthQUNaLElBQUMsQ0FBQTtJQURXOzs2QkFHZCxPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7TUFBQSxJQUFDLENBQUEsVUFBRCxHQUFjO01BQ2QsSUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsS0FBaUIsQ0FBcEI7UUFJRSxJQUFBLENBQWMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFVLENBQUMsVUFBWCxDQUFBLENBQWQ7QUFBQSxpQkFBQTs7UUFDQSxTQUFBLEdBQVksSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFQLENBQUE7UUFDWixJQUFDLENBQUEsT0FBRCxDQUFBLENBQVUsQ0FBQyxTQUFYLENBQXFCLFNBQXJCLEVBTkY7O01BUUEsR0FBQSxHQUFNLElBQUMsQ0FBQSxPQUFELENBQUE7TUFDTixJQUFHLEdBQUcsQ0FBQyxVQUFKLENBQUEsQ0FBSDtlQUNFLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFQLENBQUEsQ0FBVCxFQURGO09BQUEsTUFBQTtRQUdFLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFULElBQXNCLEdBQUcsQ0FBQyxVQUFKLENBQUEsQ0FBekI7VUFDRSxJQUFDLENBQUEsV0FBVyxDQUFDLFFBQWIsQ0FBc0Isa0JBQXRCLEVBREY7O1FBSUEsSUFBRyxXQUFBLG9GQUE2QixDQUFDLHNDQUFqQztpQkFDRSxJQUFDLENBQUEsY0FBRCxDQUFnQixXQUFBLEdBQWMsVUFBOUIsRUFERjtTQVBGOztJQVhPOzs2QkFxQlQsT0FBQSxHQUFTLFNBQUMsU0FBRDtBQUNQLFVBQUE7TUFBQSxJQUF1QyxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQWhEO1FBQUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyx1QkFBVixDQUFBLEVBQUE7O01BQ0EsU0FBQSxHQUFZLFNBQVMsQ0FBQyxPQUFWLENBQUE7TUFDWixJQUFHLFNBQUEsWUFBcUIsT0FBeEI7ZUFDRSxTQUNFLENBQUMsSUFESCxDQUNRLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLE1BQUQsQ0FBUSxTQUFSO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRFIsQ0FFRSxFQUFDLEtBQUQsRUFGRixDQUVTLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLFdBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUZULEVBREY7T0FBQSxNQUFBO2VBS0UsSUFBQyxDQUFBLE1BQUQsQ0FBUSxTQUFSLEVBTEY7O0lBSE87OzZCQVVULE1BQUEsR0FBUSxTQUFBO0FBQ04sVUFBQTtNQUFBLFlBQUcsSUFBQyxDQUFBLEtBQUQsS0FBYyxRQUFkLElBQUEsSUFBQSxLQUF3QixRQUEzQjtRQUNFLElBQUMsQ0FBQSxRQUFRLENBQUMsZUFBVixDQUFBLEVBREY7O2FBRUEsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQUhNOzs2QkFLUixNQUFBLEdBQVEsU0FBQyxTQUFEOztRQUFDLFlBQVU7O01BQ2pCLHdCQUFrQyxTQUFTLENBQUUsWUFBWCxDQUFBLFVBQWxDO1FBQUEsSUFBQyxDQUFBLGlCQUFELEdBQXFCLFVBQXJCOztNQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBTyxDQUFDLElBQWxCLENBQXVCLHNCQUF2QjtNQUVBLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFaO1FBQ0UsSUFBQyxDQUFBLDJCQUFELENBQTZCLFNBQTdCO1FBQ0EsSUFBQyxDQUFBLGlDQUFELENBQUEsRUFGRjtPQUFBLE1BR0ssSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQVo7UUFDSCxJQUFDLENBQUEsV0FBVyxDQUFDLG1CQUFiLENBQUE7UUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLHVCQUFWLENBQUEsRUFGRzs7TUFHTCxJQUFDLENBQUEsUUFBUSxDQUFDLHVCQUFWLENBQUE7YUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLEtBQVYsQ0FBQTtJQVhNOzs2QkFhUiwyQkFBQSxHQUE2QixTQUFDLFNBQUQ7TUFDM0IsSUFBQSxDQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsZ0JBQVIsQ0FBQSxDQUEwQixDQUFDLE9BQTNCLENBQUEsQ0FBUDtRQUNFLElBQUcsUUFBUSxDQUFDLEdBQVQsQ0FBYSwyQ0FBYixDQUFIO0FBQ0UsZ0JBQVUsSUFBQSxLQUFBLENBQU0seUNBQUEsR0FBeUMsQ0FBQyxTQUFTLENBQUMsUUFBVixDQUFBLENBQUQsQ0FBL0MsRUFEWjtTQUFBLE1BQUE7aUJBR0UsSUFBQyxDQUFBLE1BQU0sQ0FBQyxlQUFSLENBQUEsRUFIRjtTQURGOztJQUQyQjs7NkJBTzdCLGlDQUFBLEdBQW1DLFNBQUE7QUFDakMsVUFBQTtBQUFBO0FBQUE7V0FBQSxzQ0FBQTs7WUFBd0MsTUFBTSxDQUFDLGFBQVAsQ0FBQTt1QkFDdEMsY0FBQSxDQUFlLE1BQWYsRUFBdUI7WUFBQyxrQkFBQSxFQUFvQixJQUFyQjtXQUF2Qjs7QUFERjs7SUFEaUM7OzZCQUluQyxjQUFBLEdBQWdCLFNBQUMsU0FBRDtNQUNkLElBQUMsQ0FBQSxhQUFhLENBQUMsU0FBUyxDQUFDLEdBQXpCLENBQTZCLFNBQTdCO2FBQ0EsSUFBQyxDQUFBLFNBQUQsQ0FBZSxJQUFBLFVBQUEsQ0FBVyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQ3hCLEtBQUMsQ0FBQSxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQXpCLENBQWdDLFNBQWhDO1FBRHdCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFYLENBQWY7SUFGYzs7NkJBVWhCLFFBQUEsR0FBVSxTQUFBO2FBQ1IsOEJBQUEsSUFBcUI7SUFEYjs7NkJBR1YsUUFBQSxHQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsUUFBRCxDQUFBLENBQUg7ZUFDRSxnREFBb0IsQ0FBcEIsQ0FBQSxHQUF5QiwwREFBOEIsQ0FBOUIsRUFEM0I7T0FBQSxNQUFBO2VBR0UsS0FIRjs7SUFEUTs7NkJBTVYsUUFBQSxHQUFVLFNBQUMsTUFBRDtBQUNSLFVBQUE7TUFBQSxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsa0JBQVo7UUFDRSxJQUFBLEdBQU8sSUFBQyxDQUFBLEtBRFY7T0FBQSxNQUFBO1FBR0UsSUFBQSxHQUFPLFNBSFQ7OztZQUlPLENBQUEsSUFBQSxJQUFTOztNQUNoQixJQUFDLENBQUEsS0FBTSxDQUFBLElBQUEsQ0FBUCxHQUFlLENBQUMsSUFBQyxDQUFBLEtBQU0sQ0FBQSxJQUFBLENBQVAsR0FBZSxFQUFoQixDQUFBLEdBQXNCO01BQ3JDLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQWhCLENBQW9CLE1BQXBCO2FBQ0EsSUFBQyxDQUFBLFFBQVEsQ0FBQyxlQUFWLENBQTBCLFlBQTFCLEVBQXdDLElBQXhDO0lBUlE7OzZCQVVWLFVBQUEsR0FBWSxTQUFBO01BQ1YsSUFBQyxDQUFBLEtBQUQsR0FBUzthQUNULElBQUMsQ0FBQSxRQUFRLENBQUMsZUFBVixDQUEwQixZQUExQixFQUF3QyxLQUF4QztJQUZVOzs7Ozs7RUFJZCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQXpOakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7RGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuQmFzZSA9IHJlcXVpcmUgJy4vYmFzZSdcbnttb3ZlQ3Vyc29yTGVmdH0gPSByZXF1aXJlICcuL3V0aWxzJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xue1NlbGVjdCwgTW92ZVRvUmVsYXRpdmVMaW5lfSA9IHt9XG57T3BlcmF0aW9uQWJvcnRlZEVycm9yfSA9IHJlcXVpcmUgJy4vZXJyb3JzJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuXG4jIG9wcmF0aW9uIGxpZmUgaW4gb3BlcmF0aW9uU3RhY2tcbiMgMS4gcnVuXG4jICAgIGluc3RhbnRpYXRlZCBieSBuZXcuXG4jICAgIGNvbXBsaW1lbnQgaW1wbGljaXQgT3BlcmF0b3IuU2VsZWN0IG9wZXJhdG9yIGlmIG5lY2Vzc2FyeS5cbiMgICAgcHVzaCBvcGVyYXRpb24gdG8gc3RhY2suXG4jIDIuIHByb2Nlc3NcbiMgICAgcmVkdWNlIHN0YWNrIGJ5LCBwb3BwaW5nIHRvcCBvZiBzdGFjayB0aGVuIHNldCBpdCBhcyB0YXJnZXQgb2YgbmV3IHRvcC5cbiMgICAgY2hlY2sgaWYgcmVtYWluaW5nIHRvcCBvZiBzdGFjayBpcyBleGVjdXRhYmxlIGJ5IGNhbGxpbmcgaXNDb21wbGV0ZSgpXG4jICAgIGlmIGV4ZWN1dGFibGUsIHRoZW4gcG9wIHN0YWNrIHRoZW4gZXhlY3V0ZShwb3BwZWRPcGVyYXRpb24pXG4jICAgIGlmIG5vdCBleGVjdXRhYmxlLCBlbnRlciBcIm9wZXJhdG9yLXBlbmRpbmctbW9kZVwiXG5jbGFzcyBPcGVyYXRpb25TdGFja1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkgQHByb3RvdHlwZSwgJ21vZGUnLCBnZXQ6IC0+IEBtb2RlTWFuYWdlci5tb2RlXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBAcHJvdG90eXBlLCAnc3VibW9kZScsIGdldDogLT4gQG1vZGVNYW5hZ2VyLnN1Ym1vZGVcblxuICBjb25zdHJ1Y3RvcjogKEB2aW1TdGF0ZSkgLT5cbiAgICB7QGVkaXRvciwgQGVkaXRvckVsZW1lbnQsIEBtb2RlTWFuYWdlcn0gPSBAdmltU3RhdGVcblxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQHZpbVN0YXRlLm9uRGlkRGVzdHJveShAZGVzdHJveS5iaW5kKHRoaXMpKVxuXG4gICAgU2VsZWN0ID89IEJhc2UuZ2V0Q2xhc3MoJ1NlbGVjdCcpXG4gICAgTW92ZVRvUmVsYXRpdmVMaW5lID89IEJhc2UuZ2V0Q2xhc3MoJ01vdmVUb1JlbGF0aXZlTGluZScpXG5cbiAgICBAcmVzZXQoKVxuXG4gICMgUmV0dXJuIGhhbmRsZXJcbiAgc3Vic2NyaWJlOiAoaGFuZGxlcikgLT5cbiAgICBAb3BlcmF0aW9uU3Vic2NyaXB0aW9ucy5hZGQoaGFuZGxlcilcbiAgICBoYW5kbGVyICMgRE9OVCBSRU1PVkVcblxuICByZXNldDogLT5cbiAgICBAcmVzZXRDb3VudCgpXG4gICAgQHN0YWNrID0gW11cbiAgICBAcHJvY2Vzc2luZyA9IGZhbHNlXG5cbiAgICAjIHRoaXMgaGFzIHRvIGJlIEJFRk9SRSBAb3BlcmF0aW9uU3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAdmltU3RhdGUuZW1pdERpZFJlc2V0T3BlcmF0aW9uU3RhY2soKVxuXG4gICAgQG9wZXJhdGlvblN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEBvcGVyYXRpb25TdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBvcGVyYXRpb25TdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICB7QHN0YWNrLCBAb3BlcmF0aW9uU3Vic2NyaXB0aW9uc30gPSB7fVxuXG4gIHBlZWtUb3A6IC0+XG4gICAgQHN0YWNrW0BzdGFjay5sZW5ndGggLSAxXVxuXG4gIGlzRW1wdHk6IC0+XG4gICAgQHN0YWNrLmxlbmd0aCBpcyAwXG5cbiAgIyBNYWluXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBydW46IChrbGFzcywgcHJvcGVydGllcykgLT5cbiAgICB0cnlcbiAgICAgIHR5cGUgPSB0eXBlb2Yoa2xhc3MpXG4gICAgICBpZiB0eXBlIGlzICdvYmplY3QnICMgLiByZXBlYXQgY2FzZSB3ZSBjYW4gZXhlY3V0ZSBhcy1pdC1pcy5cbiAgICAgICAgb3BlcmF0aW9uID0ga2xhc3NcbiAgICAgIGVsc2VcbiAgICAgICAga2xhc3MgPSBCYXNlLmdldENsYXNzKGtsYXNzKSBpZiB0eXBlIGlzICdzdHJpbmcnXG4gICAgICAgICMgUmVwbGFjZSBvcGVyYXRvciB3aGVuIGlkZW50aWNhbCBvbmUgcmVwZWF0ZWQsIGUuZy4gYGRkYCwgYGNjYCwgYGdVZ1VgXG4gICAgICAgIGlmIEBwZWVrVG9wKCk/LmNvbnN0cnVjdG9yIGlzIGtsYXNzXG4gICAgICAgICAgb3BlcmF0aW9uID0gbmV3IE1vdmVUb1JlbGF0aXZlTGluZShAdmltU3RhdGUpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBvcGVyYXRpb24gPSBuZXcga2xhc3MoQHZpbVN0YXRlLCBwcm9wZXJ0aWVzKVxuXG4gICAgICAjIENvbXBsaW1lbnQgaW1wbGljaXQgU2VsZWN0IG9wZXJhdG9yXG4gICAgICBpZiBvcGVyYXRpb24uaXNUZXh0T2JqZWN0KCkgYW5kIEBtb2RlIGlzbnQgJ29wZXJhdG9yLXBlbmRpbmcnIG9yIG9wZXJhdGlvbi5pc01vdGlvbigpIGFuZCBAbW9kZSBpcyAndmlzdWFsJ1xuICAgICAgICBvcGVyYXRpb24gPSBuZXcgU2VsZWN0KEB2aW1TdGF0ZSkuc2V0VGFyZ2V0KG9wZXJhdGlvbilcblxuICAgICAgaWYgQGlzRW1wdHkoKSBvciAoQHBlZWtUb3AoKS5pc09wZXJhdG9yKCkgYW5kIG9wZXJhdGlvbi5pc1RhcmdldCgpKVxuICAgICAgICBAc3RhY2sucHVzaChvcGVyYXRpb24pXG4gICAgICAgIEBwcm9jZXNzKClcbiAgICAgIGVsc2VcbiAgICAgICAgQHZpbVN0YXRlLmVtaXREaWRGYWlsVG9TZXRUYXJnZXQoKSBpZiBAcGVla1RvcCgpLmlzT3BlcmF0b3IoKVxuICAgICAgICBAdmltU3RhdGUucmVzZXROb3JtYWxNb2RlKClcbiAgICBjYXRjaCBlcnJvclxuICAgICAgQGhhbmRsZUVycm9yKGVycm9yKVxuXG4gIHJ1blJlY29yZGVkOiAtPlxuICAgIGlmIG9wZXJhdGlvbiA9IEByZWNvcmRlZE9wZXJhdGlvblxuICAgICAgb3BlcmF0aW9uLnNldFJlcGVhdGVkKClcbiAgICAgIGlmIEBoYXNDb3VudCgpXG4gICAgICAgIGNvdW50ID0gQGdldENvdW50KClcbiAgICAgICAgb3BlcmF0aW9uLmNvdW50ID0gY291bnRcbiAgICAgICAgb3BlcmF0aW9uLnRhcmdldD8uY291bnQgPSBjb3VudCAjIFNvbWUgb3BlYXJ0b3IgaGF2ZSBubyB0YXJnZXQgbGlrZSBjdHJsLWEoaW5jcmVhc2UpLlxuXG4gICAgICAjIFtGSVhNRV0gRGVncmFkYXRpb24sIHRoaXMgYHRyYW5zYWN0YCBzaG91bGQgbm90IGJlIG5lY2Vzc2FyeVxuICAgICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgICBAcnVuKG9wZXJhdGlvbilcblxuICBydW5SZWNvcmRlZE1vdGlvbjogKGtleSwge3JldmVyc2V9PXt9KSAtPlxuICAgIHJldHVybiB1bmxlc3Mgb3BlcmF0aW9uID0gQHZpbVN0YXRlLmdsb2JhbFN0YXRlLmdldChrZXkpXG5cbiAgICBvcGVyYXRpb24gPSBvcGVyYXRpb24uY2xvbmUoQHZpbVN0YXRlKVxuICAgIG9wZXJhdGlvbi5zZXRSZXBlYXRlZCgpXG4gICAgb3BlcmF0aW9uLnJlc2V0Q291bnQoKVxuICAgIGlmIHJldmVyc2VcbiAgICAgIG9wZXJhdGlvbi5iYWNrd2FyZHMgPSBub3Qgb3BlcmF0aW9uLmJhY2t3YXJkc1xuICAgIEBydW4ob3BlcmF0aW9uKVxuXG4gIHJ1bkN1cnJlbnRGaW5kOiAob3B0aW9ucykgLT5cbiAgICBAcnVuUmVjb3JkZWRNb3Rpb24oJ2N1cnJlbnRGaW5kJywgb3B0aW9ucylcblxuICBydW5DdXJyZW50U2VhcmNoOiAob3B0aW9ucykgLT5cbiAgICBAcnVuUmVjb3JkZWRNb3Rpb24oJ2N1cnJlbnRTZWFyY2gnLCBvcHRpb25zKVxuXG4gIGhhbmRsZUVycm9yOiAoZXJyb3IpIC0+XG4gICAgQHZpbVN0YXRlLnJlc2V0KClcbiAgICB1bmxlc3MgZXJyb3IgaW5zdGFuY2VvZiBPcGVyYXRpb25BYm9ydGVkRXJyb3JcbiAgICAgIHRocm93IGVycm9yXG5cbiAgaXNQcm9jZXNzaW5nOiAtPlxuICAgIEBwcm9jZXNzaW5nXG5cbiAgcHJvY2VzczogLT5cbiAgICBAcHJvY2Vzc2luZyA9IHRydWVcbiAgICBpZiBAc3RhY2subGVuZ3RoIGlzIDJcbiAgICAgICMgW0ZJWE1FIGlkZWFsbHldXG4gICAgICAjIElmIHRhcmdldCBpcyBub3QgY29tcGxldGUsIHdlIHBvc3Rwb25lIGNvbXBzaW5nIHRhcmdldCB3aXRoIG9wZXJhdG9yIHRvIGtlZXAgc2l0dWF0aW9uIHNpbXBsZS5cbiAgICAgICMgV2UgY2FuIGFzc3VtZSwgd2hlbiB0YXJnZXQgaXMgc2V0IHRvIG9wZXJhdG9yIGl0J3MgY29tcGxldGUuXG4gICAgICByZXR1cm4gdW5sZXNzIEBwZWVrVG9wKCkuaXNDb21wbGV0ZSgpXG4gICAgICBvcGVyYXRpb24gPSBAc3RhY2sucG9wKClcbiAgICAgIEBwZWVrVG9wKCkuc2V0VGFyZ2V0KG9wZXJhdGlvbilcblxuICAgIHRvcCA9IEBwZWVrVG9wKClcbiAgICBpZiB0b3AuaXNDb21wbGV0ZSgpXG4gICAgICBAZXhlY3V0ZShAc3RhY2sucG9wKCkpXG4gICAgZWxzZVxuICAgICAgaWYgQG1vZGUgaXMgJ25vcm1hbCcgYW5kIHRvcC5pc09wZXJhdG9yKClcbiAgICAgICAgQG1vZGVNYW5hZ2VyLmFjdGl2YXRlKCdvcGVyYXRvci1wZW5kaW5nJylcblxuICAgICAgIyBUZW1wb3Jhcnkgc2V0IHdoaWxlIGNvbW1hbmQgaXMgcnVubmluZ1xuICAgICAgaWYgY29tbWFuZE5hbWUgPSB0b3AuY29uc3RydWN0b3IuZ2V0Q29tbWFuZE5hbWVXaXRob3V0UHJlZml4PygpXG4gICAgICAgIEBhZGRUb0NsYXNzTGlzdChjb21tYW5kTmFtZSArIFwiLXBlbmRpbmdcIilcblxuICBleGVjdXRlOiAob3BlcmF0aW9uKSAtPlxuICAgIEB2aW1TdGF0ZS51cGRhdGVQcmV2aW91c1NlbGVjdGlvbigpIGlmIEBtb2RlIGlzICd2aXN1YWwnXG4gICAgZXhlY3V0aW9uID0gb3BlcmF0aW9uLmV4ZWN1dGUoKVxuICAgIGlmIGV4ZWN1dGlvbiBpbnN0YW5jZW9mIFByb21pc2VcbiAgICAgIGV4ZWN1dGlvblxuICAgICAgICAudGhlbiA9PiBAZmluaXNoKG9wZXJhdGlvbilcbiAgICAgICAgLmNhdGNoID0+IEBoYW5kbGVFcnJvcigpXG4gICAgZWxzZVxuICAgICAgQGZpbmlzaChvcGVyYXRpb24pXG5cbiAgY2FuY2VsOiAtPlxuICAgIGlmIEBtb2RlIG5vdCBpbiBbJ3Zpc3VhbCcsICdpbnNlcnQnXVxuICAgICAgQHZpbVN0YXRlLnJlc2V0Tm9ybWFsTW9kZSgpXG4gICAgQGZpbmlzaCgpXG5cbiAgZmluaXNoOiAob3BlcmF0aW9uPW51bGwpIC0+XG4gICAgQHJlY29yZGVkT3BlcmF0aW9uID0gb3BlcmF0aW9uIGlmIG9wZXJhdGlvbj8uaXNSZWNvcmRhYmxlKClcbiAgICBAdmltU3RhdGUuZW1pdHRlci5lbWl0KCdkaWQtZmluaXNoLW9wZXJhdGlvbicpXG5cbiAgICBpZiBAbW9kZSBpcyAnbm9ybWFsJ1xuICAgICAgQGVuc3VyZUFsbFNlbGVjdGlvbnNBcmVFbXB0eShvcGVyYXRpb24pXG4gICAgICBAZW5zdXJlQWxsQ3Vyc29yc0FyZU5vdEF0RW5kT2ZMaW5lKClcbiAgICBlbHNlIGlmIEBtb2RlIGlzICd2aXN1YWwnXG4gICAgICBAbW9kZU1hbmFnZXIudXBkYXRlTmFycm93ZWRTdGF0ZSgpXG4gICAgICBAdmltU3RhdGUudXBkYXRlUHJldmlvdXNTZWxlY3Rpb24oKVxuICAgIEB2aW1TdGF0ZS51cGRhdGVDdXJzb3JzVmlzaWJpbGl0eSgpXG4gICAgQHZpbVN0YXRlLnJlc2V0KClcblxuICBlbnN1cmVBbGxTZWxlY3Rpb25zQXJlRW1wdHk6IChvcGVyYXRpb24pIC0+XG4gICAgdW5sZXNzIEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpLmlzRW1wdHkoKVxuICAgICAgaWYgc2V0dGluZ3MuZ2V0KCd0aHJvd0Vycm9yT25Ob25FbXB0eVNlbGVjdGlvbkluTm9ybWFsTW9kZScpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlbGVjdGlvbiBpcyBub3QgZW1wdHkgaW4gbm9ybWFsLW1vZGU6ICN7b3BlcmF0aW9uLnRvU3RyaW5nKCl9XCIpXG4gICAgICBlbHNlXG4gICAgICAgIEBlZGl0b3IuY2xlYXJTZWxlY3Rpb25zKClcblxuICBlbnN1cmVBbGxDdXJzb3JzQXJlTm90QXRFbmRPZkxpbmU6IC0+XG4gICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKSB3aGVuIGN1cnNvci5pc0F0RW5kT2ZMaW5lKClcbiAgICAgIG1vdmVDdXJzb3JMZWZ0KGN1cnNvciwge3ByZXNlcnZlR29hbENvbHVtbjogdHJ1ZX0pXG5cbiAgYWRkVG9DbGFzc0xpc3Q6IChjbGFzc05hbWUpIC0+XG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpXG4gICAgQHN1YnNjcmliZSBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpXG5cbiAgIyBDb3VudFxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBrZXlzdHJva2UgYDNkMndgIGRlbGV0ZSA2KDMqMikgd29yZHMuXG4gICMgIDJuZCBudW1iZXIoMiBpbiB0aGlzIGNhc2UpIGlzIGFsd2F5cyBlbnRlcmQgaW4gb3BlcmF0b3ItcGVuZGluZy1tb2RlLlxuICAjICBTbyBjb3VudCBoYXZlIHR3byB0aW1pbmcgdG8gYmUgZW50ZXJlZC4gdGhhdCdzIHdoeSBoZXJlIHdlIG1hbmFnZSBjb3VudGVyIGJ5IG1vZGUuXG4gIGhhc0NvdW50OiAtPlxuICAgIEBjb3VudFsnbm9ybWFsJ10/IG9yIEBjb3VudFsnb3BlcmF0b3ItcGVuZGluZyddP1xuXG4gIGdldENvdW50OiAtPlxuICAgIGlmIEBoYXNDb3VudCgpXG4gICAgICAoQGNvdW50Wydub3JtYWwnXSA/IDEpICogKEBjb3VudFsnb3BlcmF0b3ItcGVuZGluZyddID8gMSlcbiAgICBlbHNlXG4gICAgICBudWxsXG5cbiAgc2V0Q291bnQ6IChudW1iZXIpIC0+XG4gICAgaWYgQG1vZGUgaXMgJ29wZXJhdG9yLXBlbmRpbmcnXG4gICAgICBtb2RlID0gQG1vZGVcbiAgICBlbHNlXG4gICAgICBtb2RlID0gJ25vcm1hbCdcbiAgICBAY291bnRbbW9kZV0gPz0gMFxuICAgIEBjb3VudFttb2RlXSA9IChAY291bnRbbW9kZV0gKiAxMCkgKyBudW1iZXJcbiAgICBAdmltU3RhdGUuaG92ZXIuYWRkKG51bWJlcilcbiAgICBAdmltU3RhdGUudG9nZ2xlQ2xhc3NMaXN0KCd3aXRoLWNvdW50JywgdHJ1ZSlcblxuICByZXNldENvdW50OiAtPlxuICAgIEBjb3VudCA9IHt9XG4gICAgQHZpbVN0YXRlLnRvZ2dsZUNsYXNzTGlzdCgnd2l0aC1jb3VudCcsIGZhbHNlKVxuXG5tb2R1bGUuZXhwb3J0cyA9IE9wZXJhdGlvblN0YWNrXG4iXX0=
