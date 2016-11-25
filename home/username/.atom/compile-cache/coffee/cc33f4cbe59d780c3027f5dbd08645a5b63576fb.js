(function() {
  var Base, CompositeDisposable, Disposable, Emitter, ModeManager, Range, _, moveCursorLeft, ref, settings, swrap,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  ref = require('atom'), Emitter = ref.Emitter, Range = ref.Range, CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable;

  Base = require('./base');

  swrap = require('./selection-wrapper');

  moveCursorLeft = require('./utils').moveCursorLeft;

  settings = require('./settings');

  ModeManager = (function() {
    ModeManager.prototype.mode = 'insert';

    ModeManager.prototype.submode = null;

    ModeManager.prototype.replacedCharsBySelection = null;

    function ModeManager(vimState) {
      var ref1;
      this.vimState = vimState;
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement;
      this.mode = 'insert';
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
    }

    ModeManager.prototype.destroy = function() {
      return this.subscriptions.dispose();
    };

    ModeManager.prototype.isMode = function(mode, submodes) {
      var ref1;
      if (submodes != null) {
        return (this.mode === mode) && (ref1 = this.submode, indexOf.call([].concat(submodes), ref1) >= 0);
      } else {
        return this.mode === mode;
      }
    };

    ModeManager.prototype.onWillActivateMode = function(fn) {
      return this.emitter.on('will-activate-mode', fn);
    };

    ModeManager.prototype.onDidActivateMode = function(fn) {
      return this.emitter.on('did-activate-mode', fn);
    };

    ModeManager.prototype.onWillDeactivateMode = function(fn) {
      return this.emitter.on('will-deactivate-mode', fn);
    };

    ModeManager.prototype.preemptWillDeactivateMode = function(fn) {
      return this.emitter.preempt('will-deactivate-mode', fn);
    };

    ModeManager.prototype.onDidDeactivateMode = function(fn) {
      return this.emitter.on('did-deactivate-mode', fn);
    };

    ModeManager.prototype.activate = function(mode, submode) {
      var ref1, ref2;
      if (submode == null) {
        submode = null;
      }
      if ((mode === 'visual') && this.editor.isEmpty()) {
        return;
      }
      this.emitter.emit('will-activate-mode', {
        mode: mode,
        submode: submode
      });
      if ((mode === 'visual') && (submode === this.submode)) {
        ref1 = ['normal', null], mode = ref1[0], submode = ref1[1];
      }
      if (mode !== this.mode) {
        this.deactivate();
      }
      this.deactivator = (function() {
        switch (mode) {
          case 'normal':
            return this.activateNormalMode();
          case 'operator-pending':
            return this.activateOperatorPendingMode();
          case 'insert':
            return this.activateInsertMode(submode);
          case 'visual':
            return this.activateVisualMode(submode);
        }
      }).call(this);
      this.editorElement.classList.remove(this.mode + "-mode");
      this.editorElement.classList.remove(this.submode);
      ref2 = [mode, submode], this.mode = ref2[0], this.submode = ref2[1];
      this.editorElement.classList.add(this.mode + "-mode");
      if (this.submode != null) {
        this.editorElement.classList.add(this.submode);
      }
      if (this.mode === 'visual') {
        this.updateNarrowedState();
        this.vimState.updatePreviousSelection();
      }
      this.vimState.statusBarManager.update(this.mode, this.submode);
      this.vimState.updateCursorsVisibility();
      return this.emitter.emit('did-activate-mode', {
        mode: this.mode,
        submode: this.submode
      });
    };

    ModeManager.prototype.deactivate = function() {
      var ref1, ref2;
      if (!((ref1 = this.deactivator) != null ? ref1.disposed : void 0)) {
        this.emitter.emit('will-deactivate-mode', {
          mode: this.mode,
          submode: this.submode
        });
        if ((ref2 = this.deactivator) != null) {
          ref2.dispose();
        }
        return this.emitter.emit('did-deactivate-mode', {
          mode: this.mode,
          submode: this.submode
        });
      }
    };

    ModeManager.prototype.activateNormalMode = function() {
      var ref1;
      this.vimState.reset();
      if ((ref1 = this.editorElement.component) != null) {
        ref1.setInputEnabled(false);
      }
      return new Disposable;
    };

    ModeManager.prototype.activateOperatorPendingMode = function() {
      return new Disposable;
    };

    ModeManager.prototype.activateInsertMode = function(submode) {
      var replaceModeDeactivator;
      if (submode == null) {
        submode = null;
      }
      this.editorElement.component.setInputEnabled(true);
      if (submode === 'replace') {
        replaceModeDeactivator = this.activateReplaceMode();
      }
      return new Disposable((function(_this) {
        return function() {
          var cursor, i, len, needSpecialCareToPreventWrapLine, ref1, ref2, results;
          if (replaceModeDeactivator != null) {
            replaceModeDeactivator.dispose();
          }
          replaceModeDeactivator = null;
          if (settings.get('clearMultipleCursorsOnEscapeInsertMode')) {
            _this.editor.clearSelections();
          }
          needSpecialCareToPreventWrapLine = (ref1 = atom.config.get('editor.atomicSoftTabs')) != null ? ref1 : true;
          ref2 = _this.editor.getCursors();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            cursor = ref2[i];
            results.push(moveCursorLeft(cursor, {
              needSpecialCareToPreventWrapLine: needSpecialCareToPreventWrapLine
            }));
          }
          return results;
        };
      })(this));
    };

    ModeManager.prototype.activateReplaceMode = function() {
      var subs;
      this.replacedCharsBySelection = {};
      subs = new CompositeDisposable;
      subs.add(this.editor.onWillInsertText((function(_this) {
        return function(arg) {
          var cancel, text;
          text = arg.text, cancel = arg.cancel;
          cancel();
          return _this.editor.getSelections().forEach(function(selection) {
            var base, char, i, len, name, ref1, ref2, results;
            ref2 = (ref1 = text.split('')) != null ? ref1 : [];
            results = [];
            for (i = 0, len = ref2.length; i < len; i++) {
              char = ref2[i];
              if ((char !== "\n") && (!selection.cursor.isAtEndOfLine())) {
                selection.selectRight();
              }
              if ((base = _this.replacedCharsBySelection)[name = selection.id] == null) {
                base[name] = [];
              }
              results.push(_this.replacedCharsBySelection[selection.id].push(swrap(selection).replace(char)));
            }
            return results;
          });
        };
      })(this)));
      subs.add(new Disposable((function(_this) {
        return function() {
          return _this.replacedCharsBySelection = null;
        };
      })(this)));
      return subs;
    };

    ModeManager.prototype.getReplacedCharForSelection = function(selection) {
      var ref1;
      return (ref1 = this.replacedCharsBySelection[selection.id]) != null ? ref1.pop() : void 0;
    };

    ModeManager.prototype.activateVisualMode = function(submode) {
      var i, len, ref1, selection;
      if (this.submode != null) {
        this.normalizeSelections();
      }
      ref1 = this.editor.getSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if ((this.submode != null) || selection.isEmpty()) {
          swrap(selection).translateSelectionEndAndClip('forward');
        }
      }
      this.vimState.updateSelectionProperties();
      switch (submode) {
        case 'linewise':
          this.vimState.selectLinewise();
          break;
        case 'blockwise':
          this.vimState.selectBlockwise();
      }
      return new Disposable((function(_this) {
        return function() {
          var j, len1, ref2;
          _this.normalizeSelections();
          ref2 = _this.editor.getSelections();
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            selection = ref2[j];
            selection.clear({
              autoscroll: false
            });
          }
          return _this.updateNarrowedState(false);
        };
      })(this));
    };

    ModeManager.prototype.eachNonEmptySelection = function(fn) {
      var i, len, ref1, results, selection;
      ref1 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (!selection.isEmpty()) {
          results.push(fn(selection));
        }
      }
      return results;
    };

    ModeManager.prototype.normalizeSelections = function() {
      var bs, i, len, ref1;
      switch (this.submode) {
        case 'characterwise':
          this.eachNonEmptySelection(function(selection) {
            return swrap(selection).translateSelectionEndAndClip('backward');
          });
          break;
        case 'linewise':
          this.eachNonEmptySelection(function(selection) {
            return swrap(selection).restoreColumnFromProperties();
          });
          break;
        case 'blockwise':
          ref1 = this.vimState.getBlockwiseSelections();
          for (i = 0, len = ref1.length; i < len; i++) {
            bs = ref1[i];
            bs.restoreCharacterwise();
          }
          this.vimState.clearBlockwiseSelections();
          this.eachNonEmptySelection(function(selection) {
            return swrap(selection).translateSelectionEndAndClip('backward');
          });
      }
      return swrap.clearProperties(this.editor);
    };

    ModeManager.prototype.hasMultiLineSelection = function() {
      var ref1;
      if (this.isMode('visual', 'blockwise')) {
        return !((ref1 = this.vimState.getLastBlockwiseSelection()) != null ? ref1.isSingleRow() : void 0);
      } else {
        return !swrap(this.editor.getLastSelection()).isSingleRow();
      }
    };

    ModeManager.prototype.updateNarrowedState = function(value) {
      if (value == null) {
        value = null;
      }
      return this.editorElement.classList.toggle('is-narrowed', value != null ? value : this.hasMultiLineSelection());
    };

    ModeManager.prototype.isNarrowed = function() {
      return this.editorElement.classList.contains('is-narrowed');
    };

    return ModeManager;

  })();

  module.exports = ModeManager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvbW9kZS1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMkdBQUE7SUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQW9ELE9BQUEsQ0FBUSxNQUFSLENBQXBELEVBQUMscUJBQUQsRUFBVSxpQkFBVixFQUFpQiw2Q0FBakIsRUFBc0M7O0VBQ3RDLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDUCxLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQUNQLGlCQUFrQixPQUFBLENBQVEsU0FBUjs7RUFDbkIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUVMOzBCQUNKLElBQUEsR0FBTTs7MEJBQ04sT0FBQSxHQUFTOzswQkFDVCx3QkFBQSxHQUEwQjs7SUFFYixxQkFBQyxRQUFEO0FBQ1gsVUFBQTtNQURZLElBQUMsQ0FBQSxXQUFEO01BQ1osT0FBNEIsSUFBQyxDQUFBLFFBQTdCLEVBQUMsSUFBQyxDQUFBLGNBQUEsTUFBRixFQUFVLElBQUMsQ0FBQSxxQkFBQTtNQUNYLElBQUMsQ0FBQSxJQUFELEdBQVE7TUFDUixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFDZixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVYsQ0FBdUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsSUFBZCxDQUF2QixDQUFuQjtJQUxXOzswQkFPYixPQUFBLEdBQVMsU0FBQTthQUNQLElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBO0lBRE87OzBCQUdULE1BQUEsR0FBUSxTQUFDLElBQUQsRUFBTyxRQUFQO0FBQ04sVUFBQTtNQUFBLElBQUcsZ0JBQUg7ZUFDRSxDQUFDLElBQUMsQ0FBQSxJQUFELEtBQVMsSUFBVixDQUFBLElBQW9CLFFBQUMsSUFBQyxDQUFBLE9BQUQsRUFBQSxhQUFZLEVBQUUsQ0FBQyxNQUFILENBQVUsUUFBVixDQUFaLEVBQUEsSUFBQSxNQUFELEVBRHRCO09BQUEsTUFBQTtlQUdFLElBQUMsQ0FBQSxJQUFELEtBQVMsS0FIWDs7SUFETTs7MEJBUVIsa0JBQUEsR0FBb0IsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksb0JBQVosRUFBa0MsRUFBbEM7SUFBUjs7MEJBQ3BCLGlCQUFBLEdBQW1CLFNBQUMsRUFBRDthQUFRLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLG1CQUFaLEVBQWlDLEVBQWpDO0lBQVI7OzBCQUNuQixvQkFBQSxHQUFzQixTQUFDLEVBQUQ7YUFBUSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxzQkFBWixFQUFvQyxFQUFwQztJQUFSOzswQkFDdEIseUJBQUEsR0FBMkIsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUFULENBQWlCLHNCQUFqQixFQUF5QyxFQUF6QztJQUFSOzswQkFDM0IsbUJBQUEsR0FBcUIsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVkscUJBQVosRUFBbUMsRUFBbkM7SUFBUjs7MEJBS3JCLFFBQUEsR0FBVSxTQUFDLElBQUQsRUFBTyxPQUFQO0FBRVIsVUFBQTs7UUFGZSxVQUFROztNQUV2QixJQUFVLENBQUMsSUFBQSxLQUFRLFFBQVQsQ0FBQSxJQUF1QixJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBQSxDQUFqQztBQUFBLGVBQUE7O01BRUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsb0JBQWQsRUFBb0M7UUFBQyxNQUFBLElBQUQ7UUFBTyxTQUFBLE9BQVA7T0FBcEM7TUFFQSxJQUFHLENBQUMsSUFBQSxLQUFRLFFBQVQsQ0FBQSxJQUF1QixDQUFDLE9BQUEsS0FBVyxJQUFDLENBQUEsT0FBYixDQUExQjtRQUNFLE9BQWtCLENBQUMsUUFBRCxFQUFXLElBQVgsQ0FBbEIsRUFBQyxjQUFELEVBQU8sa0JBRFQ7O01BR0EsSUFBa0IsSUFBQSxLQUFVLElBQUMsQ0FBQSxJQUE3QjtRQUFBLElBQUMsQ0FBQSxVQUFELENBQUEsRUFBQTs7TUFFQSxJQUFDLENBQUEsV0FBRDtBQUFlLGdCQUFPLElBQVA7QUFBQSxlQUNSLFFBRFE7bUJBQ00sSUFBQyxDQUFBLGtCQUFELENBQUE7QUFETixlQUVSLGtCQUZRO21CQUVnQixJQUFDLENBQUEsMkJBQUQsQ0FBQTtBQUZoQixlQUdSLFFBSFE7bUJBR00sSUFBQyxDQUFBLGtCQUFELENBQW9CLE9BQXBCO0FBSE4sZUFJUixRQUpRO21CQUlNLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixPQUFwQjtBQUpOOztNQU1mLElBQUMsQ0FBQSxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQXpCLENBQW1DLElBQUMsQ0FBQSxJQUFGLEdBQU8sT0FBekM7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUF6QixDQUFnQyxJQUFDLENBQUEsT0FBakM7TUFFQSxPQUFvQixDQUFDLElBQUQsRUFBTyxPQUFQLENBQXBCLEVBQUMsSUFBQyxDQUFBLGNBQUYsRUFBUSxJQUFDLENBQUE7TUFFVCxJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUF6QixDQUFnQyxJQUFDLENBQUEsSUFBRixHQUFPLE9BQXRDO01BQ0EsSUFBMEMsb0JBQTFDO1FBQUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsR0FBekIsQ0FBNkIsSUFBQyxDQUFBLE9BQTlCLEVBQUE7O01BRUEsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQVo7UUFDRSxJQUFDLENBQUEsbUJBQUQsQ0FBQTtRQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsdUJBQVYsQ0FBQSxFQUZGOztNQUlBLElBQUMsQ0FBQSxRQUFRLENBQUMsZ0JBQWdCLENBQUMsTUFBM0IsQ0FBa0MsSUFBQyxDQUFBLElBQW5DLEVBQXlDLElBQUMsQ0FBQSxPQUExQztNQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsdUJBQVYsQ0FBQTthQUVBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLG1CQUFkLEVBQW1DO1FBQUUsTUFBRCxJQUFDLENBQUEsSUFBRjtRQUFTLFNBQUQsSUFBQyxDQUFBLE9BQVQ7T0FBbkM7SUFoQ1E7OzBCQWtDVixVQUFBLEdBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxJQUFBLDBDQUFtQixDQUFFLGtCQUFyQjtRQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLHNCQUFkLEVBQXNDO1VBQUUsTUFBRCxJQUFDLENBQUEsSUFBRjtVQUFTLFNBQUQsSUFBQyxDQUFBLE9BQVQ7U0FBdEM7O2NBQ1ksQ0FBRSxPQUFkLENBQUE7O2VBQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMscUJBQWQsRUFBcUM7VUFBRSxNQUFELElBQUMsQ0FBQSxJQUFGO1VBQVMsU0FBRCxJQUFDLENBQUEsT0FBVDtTQUFyQyxFQUhGOztJQURVOzswQkFRWixrQkFBQSxHQUFvQixTQUFBO0FBQ2xCLFVBQUE7TUFBQSxJQUFDLENBQUEsUUFBUSxDQUFDLEtBQVYsQ0FBQTs7WUFFd0IsQ0FBRSxlQUExQixDQUEwQyxLQUExQzs7YUFDQSxJQUFJO0lBSmM7OzBCQVFwQiwyQkFBQSxHQUE2QixTQUFBO2FBQzNCLElBQUk7SUFEdUI7OzBCQUs3QixrQkFBQSxHQUFvQixTQUFDLE9BQUQ7QUFDbEIsVUFBQTs7UUFEbUIsVUFBUTs7TUFDM0IsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsZUFBekIsQ0FBeUMsSUFBekM7TUFDQSxJQUFtRCxPQUFBLEtBQVcsU0FBOUQ7UUFBQSxzQkFBQSxHQUF5QixJQUFDLENBQUEsbUJBQUQsQ0FBQSxFQUF6Qjs7YUFFSSxJQUFBLFVBQUEsQ0FBVyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDYixjQUFBOztZQUFBLHNCQUFzQixDQUFFLE9BQXhCLENBQUE7O1VBQ0Esc0JBQUEsR0FBeUI7VUFFekIsSUFBRyxRQUFRLENBQUMsR0FBVCxDQUFhLHdDQUFiLENBQUg7WUFDRSxLQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBQSxFQURGOztVQUlBLGdDQUFBLHNFQUE4RTtBQUM5RTtBQUFBO2VBQUEsc0NBQUE7O3lCQUNFLGNBQUEsQ0FBZSxNQUFmLEVBQXVCO2NBQUMsa0NBQUEsZ0NBQUQ7YUFBdkI7QUFERjs7UUFUYTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWDtJQUpjOzswQkFnQnBCLG1CQUFBLEdBQXFCLFNBQUE7QUFDbkIsVUFBQTtNQUFBLElBQUMsQ0FBQSx3QkFBRCxHQUE0QjtNQUM1QixJQUFBLEdBQU8sSUFBSTtNQUNYLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUF5QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtBQUNoQyxjQUFBO1VBRGtDLGlCQUFNO1VBQ3hDLE1BQUEsQ0FBQTtpQkFDQSxLQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBQSxDQUF1QixDQUFDLE9BQXhCLENBQWdDLFNBQUMsU0FBRDtBQUM5QixnQkFBQTtBQUFBO0FBQUE7aUJBQUEsc0NBQUE7O2NBQ0UsSUFBRyxDQUFDLElBQUEsS0FBVSxJQUFYLENBQUEsSUFBcUIsQ0FBQyxDQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsYUFBakIsQ0FBQSxDQUFMLENBQXhCO2dCQUNFLFNBQVMsQ0FBQyxXQUFWLENBQUEsRUFERjs7OzZCQUUyQzs7MkJBQzNDLEtBQUMsQ0FBQSx3QkFBeUIsQ0FBQSxTQUFTLENBQUMsRUFBVixDQUFhLENBQUMsSUFBeEMsQ0FBNkMsS0FBQSxDQUFNLFNBQU4sQ0FBZ0IsQ0FBQyxPQUFqQixDQUF5QixJQUF6QixDQUE3QztBQUpGOztVQUQ4QixDQUFoQztRQUZnQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekIsQ0FBVDtNQVNBLElBQUksQ0FBQyxHQUFMLENBQWEsSUFBQSxVQUFBLENBQVcsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUN0QixLQUFDLENBQUEsd0JBQUQsR0FBNEI7UUFETjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWCxDQUFiO2FBRUE7SUFkbUI7OzBCQWdCckIsMkJBQUEsR0FBNkIsU0FBQyxTQUFEO0FBQzNCLFVBQUE7Z0ZBQXVDLENBQUUsR0FBekMsQ0FBQTtJQUQyQjs7MEJBTTdCLGtCQUFBLEdBQW9CLFNBQUMsT0FBRDtBQUNsQixVQUFBO01BQUEsSUFBMEIsb0JBQTFCO1FBQUEsSUFBQyxDQUFBLG1CQUFELENBQUEsRUFBQTs7QUFLQTtBQUFBLFdBQUEsc0NBQUE7O1lBQThDLHNCQUFBLElBQWEsU0FBUyxDQUFDLE9BQVYsQ0FBQTtVQUN6RCxLQUFBLENBQU0sU0FBTixDQUFnQixDQUFDLDRCQUFqQixDQUE4QyxTQUE5Qzs7QUFERjtNQUdBLElBQUMsQ0FBQSxRQUFRLENBQUMseUJBQVYsQ0FBQTtBQUVBLGNBQU8sT0FBUDtBQUFBLGFBQ08sVUFEUDtVQUVJLElBQUMsQ0FBQSxRQUFRLENBQUMsY0FBVixDQUFBO0FBREc7QUFEUCxhQUdPLFdBSFA7VUFJSSxJQUFDLENBQUEsUUFBUSxDQUFDLGVBQVYsQ0FBQTtBQUpKO2FBTUksSUFBQSxVQUFBLENBQVcsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQ2IsY0FBQTtVQUFBLEtBQUMsQ0FBQSxtQkFBRCxDQUFBO0FBQ0E7QUFBQSxlQUFBLHdDQUFBOztZQUFBLFNBQVMsQ0FBQyxLQUFWLENBQWdCO2NBQUEsVUFBQSxFQUFZLEtBQVo7YUFBaEI7QUFBQTtpQkFDQSxLQUFDLENBQUEsbUJBQUQsQ0FBcUIsS0FBckI7UUFIYTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBWDtJQWpCYzs7MEJBc0JwQixxQkFBQSxHQUF1QixTQUFDLEVBQUQ7QUFDckIsVUFBQTtBQUFBO0FBQUE7V0FBQSxzQ0FBQTs7WUFBOEMsQ0FBSSxTQUFTLENBQUMsT0FBVixDQUFBO3VCQUNoRCxFQUFBLENBQUcsU0FBSDs7QUFERjs7SUFEcUI7OzBCQUl2QixtQkFBQSxHQUFxQixTQUFBO0FBQ25CLFVBQUE7QUFBQSxjQUFPLElBQUMsQ0FBQSxPQUFSO0FBQUEsYUFDTyxlQURQO1VBRUksSUFBQyxDQUFBLHFCQUFELENBQXVCLFNBQUMsU0FBRDttQkFDckIsS0FBQSxDQUFNLFNBQU4sQ0FBZ0IsQ0FBQyw0QkFBakIsQ0FBOEMsVUFBOUM7VUFEcUIsQ0FBdkI7QUFERztBQURQLGFBSU8sVUFKUDtVQUtJLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixTQUFDLFNBQUQ7bUJBQ3JCLEtBQUEsQ0FBTSxTQUFOLENBQWdCLENBQUMsMkJBQWpCLENBQUE7VUFEcUIsQ0FBdkI7QUFERztBQUpQLGFBT08sV0FQUDtBQVFJO0FBQUEsZUFBQSxzQ0FBQTs7WUFDRSxFQUFFLENBQUMsb0JBQUgsQ0FBQTtBQURGO1VBRUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyx3QkFBVixDQUFBO1VBQ0EsSUFBQyxDQUFBLHFCQUFELENBQXVCLFNBQUMsU0FBRDttQkFDckIsS0FBQSxDQUFNLFNBQU4sQ0FBZ0IsQ0FBQyw0QkFBakIsQ0FBOEMsVUFBOUM7VUFEcUIsQ0FBdkI7QUFYSjthQWNBLEtBQUssQ0FBQyxlQUFOLENBQXNCLElBQUMsQ0FBQSxNQUF2QjtJQWZtQjs7MEJBbUJyQixxQkFBQSxHQUF1QixTQUFBO0FBQ3JCLFVBQUE7TUFBQSxJQUFHLElBQUMsQ0FBQSxNQUFELENBQVEsUUFBUixFQUFrQixXQUFsQixDQUFIO2VBRUUsbUVBQXlDLENBQUUsV0FBdkMsQ0FBQSxZQUZOO09BQUEsTUFBQTtlQUlFLENBQUksS0FBQSxDQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsZ0JBQVIsQ0FBQSxDQUFOLENBQWlDLENBQUMsV0FBbEMsQ0FBQSxFQUpOOztJQURxQjs7MEJBT3ZCLG1CQUFBLEdBQXFCLFNBQUMsS0FBRDs7UUFBQyxRQUFNOzthQUMxQixJQUFDLENBQUEsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUF6QixDQUFnQyxhQUFoQyxrQkFBK0MsUUFBUSxJQUFDLENBQUEscUJBQUQsQ0FBQSxDQUF2RDtJQURtQjs7MEJBR3JCLFVBQUEsR0FBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsUUFBekIsQ0FBa0MsYUFBbEM7SUFEVTs7Ozs7O0VBR2QsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUE5TGpCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntFbWl0dGVyLCBSYW5nZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuQmFzZSA9IHJlcXVpcmUgJy4vYmFzZSdcbnN3cmFwID0gcmVxdWlyZSAnLi9zZWxlY3Rpb24td3JhcHBlcidcbnttb3ZlQ3Vyc29yTGVmdH0gPSByZXF1aXJlICcuL3V0aWxzJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuXG5jbGFzcyBNb2RlTWFuYWdlclxuICBtb2RlOiAnaW5zZXJ0JyAjIE5hdGl2ZSBhdG9tIGlzIG5vdCBtb2RhbCBlZGl0b3IgYW5kIGl0cyBkZWZhdWx0IGlzICdpbnNlcnQnXG4gIHN1Ym1vZGU6IG51bGxcbiAgcmVwbGFjZWRDaGFyc0J5U2VsZWN0aW9uOiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUpIC0+XG4gICAge0BlZGl0b3IsIEBlZGl0b3JFbGVtZW50fSA9IEB2aW1TdGF0ZVxuICAgIEBtb2RlID0gJ2luc2VydCdcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAdmltU3RhdGUub25EaWREZXN0cm95KEBkZXN0cm95LmJpbmQodGhpcykpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICBpc01vZGU6IChtb2RlLCBzdWJtb2RlcykgLT5cbiAgICBpZiBzdWJtb2Rlcz9cbiAgICAgIChAbW9kZSBpcyBtb2RlKSBhbmQgKEBzdWJtb2RlIGluIFtdLmNvbmNhdChzdWJtb2RlcykpXG4gICAgZWxzZVxuICAgICAgQG1vZGUgaXMgbW9kZVxuXG4gICMgRXZlbnRcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG9uV2lsbEFjdGl2YXRlTW9kZTogKGZuKSAtPiBAZW1pdHRlci5vbignd2lsbC1hY3RpdmF0ZS1tb2RlJywgZm4pXG4gIG9uRGlkQWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBlbWl0dGVyLm9uKCdkaWQtYWN0aXZhdGUtbW9kZScsIGZuKVxuICBvbldpbGxEZWFjdGl2YXRlTW9kZTogKGZuKSAtPiBAZW1pdHRlci5vbignd2lsbC1kZWFjdGl2YXRlLW1vZGUnLCBmbilcbiAgcHJlZW1wdFdpbGxEZWFjdGl2YXRlTW9kZTogKGZuKSAtPiBAZW1pdHRlci5wcmVlbXB0KCd3aWxsLWRlYWN0aXZhdGUtbW9kZScsIGZuKVxuICBvbkRpZERlYWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBlbWl0dGVyLm9uKCdkaWQtZGVhY3RpdmF0ZS1tb2RlJywgZm4pXG5cbiAgIyBhY3RpdmF0ZTogUHVibGljXG4gICMgIFVzZSB0aGlzIG1ldGhvZCB0byBjaGFuZ2UgbW9kZSwgRE9OVCB1c2Ugb3RoZXIgZGlyZWN0IG1ldGhvZC5cbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFjdGl2YXRlOiAobW9kZSwgc3VibW9kZT1udWxsKSAtPlxuICAgICMgQXZvaWQgb2RkIHN0YXRlKD12aXN1YWwtbW9kZSBidXQgc2VsZWN0aW9uIGlzIGVtcHR5KVxuICAgIHJldHVybiBpZiAobW9kZSBpcyAndmlzdWFsJykgYW5kIEBlZGl0b3IuaXNFbXB0eSgpXG5cbiAgICBAZW1pdHRlci5lbWl0KCd3aWxsLWFjdGl2YXRlLW1vZGUnLCB7bW9kZSwgc3VibW9kZX0pXG5cbiAgICBpZiAobW9kZSBpcyAndmlzdWFsJykgYW5kIChzdWJtb2RlIGlzIEBzdWJtb2RlKVxuICAgICAgW21vZGUsIHN1Ym1vZGVdID0gWydub3JtYWwnLCBudWxsXVxuXG4gICAgQGRlYWN0aXZhdGUoKSBpZiAobW9kZSBpc250IEBtb2RlKVxuXG4gICAgQGRlYWN0aXZhdG9yID0gc3dpdGNoIG1vZGVcbiAgICAgIHdoZW4gJ25vcm1hbCcgdGhlbiBAYWN0aXZhdGVOb3JtYWxNb2RlKClcbiAgICAgIHdoZW4gJ29wZXJhdG9yLXBlbmRpbmcnIHRoZW4gQGFjdGl2YXRlT3BlcmF0b3JQZW5kaW5nTW9kZSgpXG4gICAgICB3aGVuICdpbnNlcnQnIHRoZW4gQGFjdGl2YXRlSW5zZXJ0TW9kZShzdWJtb2RlKVxuICAgICAgd2hlbiAndmlzdWFsJyB0aGVuIEBhY3RpdmF0ZVZpc3VhbE1vZGUoc3VibW9kZSlcblxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCIje0Btb2RlfS1tb2RlXCIpXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShAc3VibW9kZSlcblxuICAgIFtAbW9kZSwgQHN1Ym1vZGVdID0gW21vZGUsIHN1Ym1vZGVdXG5cbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiI3tAbW9kZX0tbW9kZVwiKVxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoQHN1Ym1vZGUpIGlmIEBzdWJtb2RlP1xuXG4gICAgaWYgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICAgIEB1cGRhdGVOYXJyb3dlZFN0YXRlKClcbiAgICAgIEB2aW1TdGF0ZS51cGRhdGVQcmV2aW91c1NlbGVjdGlvbigpXG5cbiAgICBAdmltU3RhdGUuc3RhdHVzQmFyTWFuYWdlci51cGRhdGUoQG1vZGUsIEBzdWJtb2RlKVxuICAgIEB2aW1TdGF0ZS51cGRhdGVDdXJzb3JzVmlzaWJpbGl0eSgpXG5cbiAgICBAZW1pdHRlci5lbWl0KCdkaWQtYWN0aXZhdGUtbW9kZScsIHtAbW9kZSwgQHN1Ym1vZGV9KVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgdW5sZXNzIEBkZWFjdGl2YXRvcj8uZGlzcG9zZWRcbiAgICAgIEBlbWl0dGVyLmVtaXQoJ3dpbGwtZGVhY3RpdmF0ZS1tb2RlJywge0Btb2RlLCBAc3VibW9kZX0pXG4gICAgICBAZGVhY3RpdmF0b3I/LmRpc3Bvc2UoKVxuICAgICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWRlYWN0aXZhdGUtbW9kZScsIHtAbW9kZSwgQHN1Ym1vZGV9KVxuXG4gICMgTm9ybWFsXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhY3RpdmF0ZU5vcm1hbE1vZGU6IC0+XG4gICAgQHZpbVN0YXRlLnJlc2V0KClcbiAgICAjIFtGSVhNRV0gQ29tcG9uZW50IGlzIG5vdCBuZWNlc3NhcnkgYXZhaWFibGUgc2VlICM5OC5cbiAgICBAZWRpdG9yRWxlbWVudC5jb21wb25lbnQ/LnNldElucHV0RW5hYmxlZChmYWxzZSlcbiAgICBuZXcgRGlzcG9zYWJsZVxuXG4gICMgT3BlcmF0b3IgUGVuZGluZ1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWN0aXZhdGVPcGVyYXRvclBlbmRpbmdNb2RlOiAtPlxuICAgIG5ldyBEaXNwb3NhYmxlXG5cbiAgIyBJbnNlcnRcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFjdGl2YXRlSW5zZXJ0TW9kZTogKHN1Ym1vZGU9bnVsbCkgLT5cbiAgICBAZWRpdG9yRWxlbWVudC5jb21wb25lbnQuc2V0SW5wdXRFbmFibGVkKHRydWUpXG4gICAgcmVwbGFjZU1vZGVEZWFjdGl2YXRvciA9IEBhY3RpdmF0ZVJlcGxhY2VNb2RlKCkgaWYgc3VibW9kZSBpcyAncmVwbGFjZSdcblxuICAgIG5ldyBEaXNwb3NhYmxlID0+XG4gICAgICByZXBsYWNlTW9kZURlYWN0aXZhdG9yPy5kaXNwb3NlKClcbiAgICAgIHJlcGxhY2VNb2RlRGVhY3RpdmF0b3IgPSBudWxsXG5cbiAgICAgIGlmIHNldHRpbmdzLmdldCgnY2xlYXJNdWx0aXBsZUN1cnNvcnNPbkVzY2FwZUluc2VydE1vZGUnKVxuICAgICAgICBAZWRpdG9yLmNsZWFyU2VsZWN0aW9ucygpXG5cbiAgICAgICMgV2hlbiBlc2NhcGUgZnJvbSBpbnNlcnQtbW9kZSwgY3Vyc29yIG1vdmUgTGVmdC5cbiAgICAgIG5lZWRTcGVjaWFsQ2FyZVRvUHJldmVudFdyYXBMaW5lID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3IuYXRvbWljU29mdFRhYnMnKSA/IHRydWVcbiAgICAgIGZvciBjdXJzb3IgaW4gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICAgICAgbW92ZUN1cnNvckxlZnQoY3Vyc29yLCB7bmVlZFNwZWNpYWxDYXJlVG9QcmV2ZW50V3JhcExpbmV9KVxuXG4gIGFjdGl2YXRlUmVwbGFjZU1vZGU6IC0+XG4gICAgQHJlcGxhY2VkQ2hhcnNCeVNlbGVjdGlvbiA9IHt9XG4gICAgc3VicyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgc3Vicy5hZGQgQGVkaXRvci5vbldpbGxJbnNlcnRUZXh0ICh7dGV4dCwgY2FuY2VsfSkgPT5cbiAgICAgIGNhbmNlbCgpXG4gICAgICBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5mb3JFYWNoIChzZWxlY3Rpb24pID0+XG4gICAgICAgIGZvciBjaGFyIGluIHRleHQuc3BsaXQoJycpID8gW11cbiAgICAgICAgICBpZiAoY2hhciBpc250IFwiXFxuXCIpIGFuZCAobm90IHNlbGVjdGlvbi5jdXJzb3IuaXNBdEVuZE9mTGluZSgpKVxuICAgICAgICAgICAgc2VsZWN0aW9uLnNlbGVjdFJpZ2h0KClcbiAgICAgICAgICBAcmVwbGFjZWRDaGFyc0J5U2VsZWN0aW9uW3NlbGVjdGlvbi5pZF0gPz0gW11cbiAgICAgICAgICBAcmVwbGFjZWRDaGFyc0J5U2VsZWN0aW9uW3NlbGVjdGlvbi5pZF0ucHVzaChzd3JhcChzZWxlY3Rpb24pLnJlcGxhY2UoY2hhcikpXG5cbiAgICBzdWJzLmFkZCBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQHJlcGxhY2VkQ2hhcnNCeVNlbGVjdGlvbiA9IG51bGxcbiAgICBzdWJzXG5cbiAgZ2V0UmVwbGFjZWRDaGFyRm9yU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIEByZXBsYWNlZENoYXJzQnlTZWxlY3Rpb25bc2VsZWN0aW9uLmlkXT8ucG9wKClcblxuICAjIFZpc3VhbFxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBBdCB0aGlzIHBvaW50IEBzdWJtb2RlIGlzIG5vdCB5ZXQgdXBkYXRlZCB0byBmaW5hbCBzdWJtb2RlLlxuICBhY3RpdmF0ZVZpc3VhbE1vZGU6IChzdWJtb2RlKSAtPlxuICAgIEBub3JtYWxpemVTZWxlY3Rpb25zKCkgaWYgQHN1Ym1vZGU/XG5cbiAgICAjIFdlIG9ubHkgc2VsZWN0LWZvcndhcmQgb25seSB3aGVuXG4gICAgIyAgLSAgc3VibW9kZSBzaGlmdChAc3VibW9kZT8gaXMgdHJ1ZSlcbiAgICAjICAtICBpbml0aWFsIGFjdGl2YXRpb24oQHN1Ym1vZGU/IGlzIGZhbHNlKSBhbmQgc2VsZWN0aW9uIHdhcyBlbXB0eS5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpIHdoZW4gQHN1Ym1vZGU/IG9yIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgIHN3cmFwKHNlbGVjdGlvbikudHJhbnNsYXRlU2VsZWN0aW9uRW5kQW5kQ2xpcCgnZm9yd2FyZCcpXG5cbiAgICBAdmltU3RhdGUudXBkYXRlU2VsZWN0aW9uUHJvcGVydGllcygpXG5cbiAgICBzd2l0Y2ggc3VibW9kZVxuICAgICAgd2hlbiAnbGluZXdpc2UnXG4gICAgICAgIEB2aW1TdGF0ZS5zZWxlY3RMaW5ld2lzZSgpXG4gICAgICB3aGVuICdibG9ja3dpc2UnXG4gICAgICAgIEB2aW1TdGF0ZS5zZWxlY3RCbG9ja3dpc2UoKVxuXG4gICAgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIEBub3JtYWxpemVTZWxlY3Rpb25zKClcbiAgICAgIHNlbGVjdGlvbi5jbGVhcihhdXRvc2Nyb2xsOiBmYWxzZSkgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgQHVwZGF0ZU5hcnJvd2VkU3RhdGUoZmFsc2UpXG5cbiAgZWFjaE5vbkVtcHR5U2VsZWN0aW9uOiAoZm4pIC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKSB3aGVuIG5vdCBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICBmbihzZWxlY3Rpb24pXG5cbiAgbm9ybWFsaXplU2VsZWN0aW9uczogLT5cbiAgICBzd2l0Y2ggQHN1Ym1vZGVcbiAgICAgIHdoZW4gJ2NoYXJhY3Rlcndpc2UnXG4gICAgICAgIEBlYWNoTm9uRW1wdHlTZWxlY3Rpb24gKHNlbGVjdGlvbikgLT5cbiAgICAgICAgICBzd3JhcChzZWxlY3Rpb24pLnRyYW5zbGF0ZVNlbGVjdGlvbkVuZEFuZENsaXAoJ2JhY2t3YXJkJylcbiAgICAgIHdoZW4gJ2xpbmV3aXNlJ1xuICAgICAgICBAZWFjaE5vbkVtcHR5U2VsZWN0aW9uIChzZWxlY3Rpb24pIC0+XG4gICAgICAgICAgc3dyYXAoc2VsZWN0aW9uKS5yZXN0b3JlQ29sdW1uRnJvbVByb3BlcnRpZXMoKVxuICAgICAgd2hlbiAnYmxvY2t3aXNlJ1xuICAgICAgICBmb3IgYnMgaW4gQHZpbVN0YXRlLmdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKVxuICAgICAgICAgIGJzLnJlc3RvcmVDaGFyYWN0ZXJ3aXNlKClcbiAgICAgICAgQHZpbVN0YXRlLmNsZWFyQmxvY2t3aXNlU2VsZWN0aW9ucygpXG4gICAgICAgIEBlYWNoTm9uRW1wdHlTZWxlY3Rpb24gKHNlbGVjdGlvbikgLT5cbiAgICAgICAgICBzd3JhcChzZWxlY3Rpb24pLnRyYW5zbGF0ZVNlbGVjdGlvbkVuZEFuZENsaXAoJ2JhY2t3YXJkJylcblxuICAgIHN3cmFwLmNsZWFyUHJvcGVydGllcyhAZWRpdG9yKVxuXG4gICMgTmFycm93IHRvIHNlbGVjdGlvblxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaGFzTXVsdGlMaW5lU2VsZWN0aW9uOiAtPlxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKVxuICAgICAgIyBbRklYTUVdIHdoeSBJIG5lZWQgbnVsbCBndWFyZCBoZXJlXG4gICAgICBub3QgQHZpbVN0YXRlLmdldExhc3RCbG9ja3dpc2VTZWxlY3Rpb24oKT8uaXNTaW5nbGVSb3coKVxuICAgIGVsc2VcbiAgICAgIG5vdCBzd3JhcChAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSkuaXNTaW5nbGVSb3coKVxuXG4gIHVwZGF0ZU5hcnJvd2VkU3RhdGU6ICh2YWx1ZT1udWxsKSAtPlxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLW5hcnJvd2VkJywgdmFsdWUgPyBAaGFzTXVsdGlMaW5lU2VsZWN0aW9uKCkpXG5cbiAgaXNOYXJyb3dlZDogLT5cbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2lzLW5hcnJvd2VkJylcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlTWFuYWdlclxuIl19
