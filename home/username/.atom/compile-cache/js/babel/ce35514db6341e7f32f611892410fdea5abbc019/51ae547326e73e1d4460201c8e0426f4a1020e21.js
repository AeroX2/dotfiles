Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _unicodeHelpers = require('./unicode-helpers');

'use babel';

var SuggestionList = (function () {
  function SuggestionList() {
    var _this = this;

    _classCallCheck(this, SuggestionList);

    this.wordPrefixRegex = null;
    this.cancel = this.cancel.bind(this);
    this.confirm = this.confirm.bind(this);
    this.confirmSelection = this.confirmSelection.bind(this);
    this.confirmSelectionIfNonDefault = this.confirmSelectionIfNonDefault.bind(this);
    this.show = this.show.bind(this);
    this.showAtBeginningOfPrefix = this.showAtBeginningOfPrefix.bind(this);
    this.showAtCursorPosition = this.showAtCursorPosition.bind(this);
    this.hide = this.hide.bind(this);
    this.destroyOverlay = this.destroyOverlay.bind(this);
    this.activeEditor = null;
    this.emitter = new _atom.Emitter();
    this.subscriptions = new _atom.CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-text-editor.autocomplete-active', {
      'autocomplete-plus:confirm': this.confirmSelection,
      'autocomplete-plus:confirmIfNonDefault': this.confirmSelectionIfNonDefault,
      'autocomplete-plus:cancel': this.cancel
    }));
    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableExtendedUnicodeSupport', function (enableExtendedUnicodeSupport) {
      if (enableExtendedUnicodeSupport) {
        _this.wordPrefixRegex = new RegExp('^[' + _unicodeHelpers.UnicodeLetters + '\\d_-]');
      } else {
        _this.wordPrefixRegex = /^[\w-]/;
      }
      return _this.wordPrefixRegex;
    }));
  }

  _createClass(SuggestionList, [{
    key: 'addBindings',
    value: function addBindings(editor) {
      var _this2 = this;

      if (this.bindings && this.bindings.dispose) {
        this.bindings.dispose();
      }
      this.bindings = new _atom.CompositeDisposable();

      var completionKey = atom.config.get('autocomplete-plus.confirmCompletion') || '';

      var keys = {};
      if (completionKey.indexOf('tab') > -1) {
        keys['tab'] = 'autocomplete-plus:confirm';
      }
      if (completionKey.indexOf('enter') > -1) {
        if (completionKey.indexOf('always') > -1) {
          keys['enter'] = 'autocomplete-plus:confirmIfNonDefault';
        } else {
          keys['enter'] = 'autocomplete-plus:confirm';
        }
      }

      this.bindings.add(atom.keymaps.add('atom-text-editor.autocomplete-active', { 'atom-text-editor.autocomplete-active': keys }));

      var useCoreMovementCommands = atom.config.get('autocomplete-plus.useCoreMovementCommands');
      var commandNamespace = useCoreMovementCommands ? 'core' : 'autocomplete-plus';

      var commands = {};
      commands[commandNamespace + ':move-up'] = function (event) {
        if (_this2.isActive() && _this2.items && _this2.items.length > 1) {
          _this2.selectPrevious();
          return event.stopImmediatePropagation();
        }
      };
      commands[commandNamespace + ':move-down'] = function (event) {
        if (_this2.isActive() && _this2.items && _this2.items.length > 1) {
          _this2.selectNext();
          return event.stopImmediatePropagation();
        }
      };
      commands[commandNamespace + ':page-up'] = function (event) {
        if (_this2.isActive() && _this2.items && _this2.items.length > 1) {
          _this2.selectPageUp();
          return event.stopImmediatePropagation();
        }
      };
      commands[commandNamespace + ':page-down'] = function (event) {
        if (_this2.isActive() && _this2.items && _this2.items.length > 1) {
          _this2.selectPageDown();
          return event.stopImmediatePropagation();
        }
      };
      commands[commandNamespace + ':move-to-top'] = function (event) {
        if (_this2.isActive() && _this2.items && _this2.items.length > 1) {
          _this2.selectTop();
          return event.stopImmediatePropagation();
        }
      };
      commands[commandNamespace + ':move-to-bottom'] = function (event) {
        if (_this2.isActive() && _this2.items && _this2.items.length > 1) {
          _this2.selectBottom();
          return event.stopImmediatePropagation();
        }
      };

      this.bindings.add(atom.commands.add(atom.views.getView(editor), commands));

      return this.bindings.add(atom.config.onDidChange('autocomplete-plus.useCoreMovementCommands', function () {
        return _this2.addBindings(editor);
      }));
    }

    /*
    Section: Event Triggers
    */

  }, {
    key: 'cancel',
    value: function cancel() {
      return this.emitter.emit('did-cancel');
    }
  }, {
    key: 'confirm',
    value: function confirm(match) {
      return this.emitter.emit('did-confirm', match);
    }
  }, {
    key: 'confirmSelection',
    value: function confirmSelection() {
      return this.emitter.emit('did-confirm-selection');
    }
  }, {
    key: 'confirmSelectionIfNonDefault',
    value: function confirmSelectionIfNonDefault(event) {
      return this.emitter.emit('did-confirm-selection-if-non-default', event);
    }
  }, {
    key: 'replace',
    value: function replace(match) {
      return this.emitter.emit('replace', match);
    }
  }, {
    key: 'selectNext',
    value: function selectNext() {
      return this.emitter.emit('did-select-next');
    }
  }, {
    key: 'selectPrevious',
    value: function selectPrevious() {
      return this.emitter.emit('did-select-previous');
    }
  }, {
    key: 'selectPageUp',
    value: function selectPageUp() {
      return this.emitter.emit('did-select-page-up');
    }
  }, {
    key: 'selectPageDown',
    value: function selectPageDown() {
      return this.emitter.emit('did-select-page-down');
    }
  }, {
    key: 'selectTop',
    value: function selectTop() {
      return this.emitter.emit('did-select-top');
    }
  }, {
    key: 'selectBottom',
    value: function selectBottom() {
      return this.emitter.emit('did-select-bottom');
    }

    /*
    Section: Events
    */

  }, {
    key: 'onDidConfirmSelection',
    value: function onDidConfirmSelection(fn) {
      return this.emitter.on('did-confirm-selection', fn);
    }
  }, {
    key: 'onDidconfirmSelectionIfNonDefault',
    value: function onDidconfirmSelectionIfNonDefault(fn) {
      return this.emitter.on('did-confirm-selection-if-non-default', fn);
    }
  }, {
    key: 'onReplace',
    value: function onReplace(fn) {
      return this.emitter.on('replace', fn);
    }
  }, {
    key: 'onDidConfirm',
    value: function onDidConfirm(fn) {
      return this.emitter.on('did-confirm', fn);
    }
  }, {
    key: 'onDidSelectNext',
    value: function onDidSelectNext(fn) {
      return this.emitter.on('did-select-next', fn);
    }
  }, {
    key: 'onDidSelectPrevious',
    value: function onDidSelectPrevious(fn) {
      return this.emitter.on('did-select-previous', fn);
    }
  }, {
    key: 'onDidSelectPageUp',
    value: function onDidSelectPageUp(fn) {
      return this.emitter.on('did-select-page-up', fn);
    }
  }, {
    key: 'onDidSelectPageDown',
    value: function onDidSelectPageDown(fn) {
      return this.emitter.on('did-select-page-down', fn);
    }
  }, {
    key: 'onDidSelectTop',
    value: function onDidSelectTop(fn) {
      return this.emitter.on('did-select-top', fn);
    }
  }, {
    key: 'onDidSelectBottom',
    value: function onDidSelectBottom(fn) {
      return this.emitter.on('did-select-bottom', fn);
    }
  }, {
    key: 'onDidCancel',
    value: function onDidCancel(fn) {
      return this.emitter.on('did-cancel', fn);
    }
  }, {
    key: 'onDidDispose',
    value: function onDidDispose(fn) {
      return this.emitter.on('did-dispose', fn);
    }
  }, {
    key: 'onDidChangeItems',
    value: function onDidChangeItems(fn) {
      return this.emitter.on('did-change-items', fn);
    }
  }, {
    key: 'isActive',
    value: function isActive() {
      return this.activeEditor != null;
    }
  }, {
    key: 'show',
    value: function show(editor, options) {
      if (atom.config.get('autocomplete-plus.suggestionListFollows') === 'Cursor') {
        return this.showAtCursorPosition(editor, options);
      } else {
        var prefix = options.prefix;

        var followRawPrefix = false;
        for (var i = 0; i < this.items.length; i++) {
          var item = this.items[i];
          if (item.replacementPrefix != null) {
            prefix = item.replacementPrefix.trim();
            followRawPrefix = true;
            break;
          }
        }
        return this.showAtBeginningOfPrefix(editor, prefix, followRawPrefix);
      }
    }
  }, {
    key: 'showAtBeginningOfPrefix',
    value: function showAtBeginningOfPrefix(editor, prefix) {
      var followRawPrefix = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      if (!editor) {
        return;
      }

      var bufferPosition = editor.getCursorBufferPosition();
      if (followRawPrefix || this.wordPrefixRegex.test(prefix)) {
        bufferPosition = bufferPosition.translate([0, -prefix.length]);
      }

      if (this.activeEditor === editor) {
        if (!bufferPosition.isEqual(this.displayBufferPosition)) {
          this.displayBufferPosition = bufferPosition;
          if (this.suggestionMarker) {
            this.suggestionMarker.setBufferRange([bufferPosition, bufferPosition]);
          }
        }
      } else {
        this.destroyOverlay();
        this.activeEditor = editor;
        this.displayBufferPosition = bufferPosition;
        var marker = this.suggestionMarker = editor.markBufferRange([bufferPosition, bufferPosition]);
        this.overlayDecoration = editor.decorateMarker(marker, { type: 'overlay', item: this, position: 'tail' });
        this.addBindings(editor);
      }
    }
  }, {
    key: 'showAtCursorPosition',
    value: function showAtCursorPosition(editor) {
      if (this.activeEditor === editor || editor == null) {
        return;
      }
      this.destroyOverlay();
      var marker = undefined;
      if (editor.getLastCursor()) {
        marker = editor.getLastCursor().getMarker();
      }
      if (marker) {
        this.activeEditor = editor;
        this.overlayDecoration = editor.decorateMarker(marker, { type: 'overlay', item: this });
        return this.addBindings(editor);
      }
    }
  }, {
    key: 'hide',
    value: function hide() {
      if (this.activeEditor === null) {
        return;
      }
      this.destroyOverlay();
      if (this.bindings && this.bindings.dispose) {
        this.bindings.dispose();
      }

      this.activeEditor = null;
      return this.activeEditor;
    }
  }, {
    key: 'destroyOverlay',
    value: function destroyOverlay() {
      if (this.suggestionMarker && this.suggestionMarker.destroy) {
        this.suggestionMarker.destroy();
      } else if (this.overlayDecoration && this.overlayDecoration.destroy) {
        this.overlayDecoration.destroy();
      }
      this.suggestionMarker = undefined;
      this.overlayDecoration = undefined;
      return this.overlayDecoration;
    }
  }, {
    key: 'changeItems',
    value: function changeItems(items) {
      this.items = items;
      return this.emitter.emit('did-change-items', this.items);
    }

    // Public: Clean up, stop listening to events
  }, {
    key: 'dispose',
    value: function dispose() {
      if (this.subscriptions) {
        this.subscriptions.dispose();
      }

      if (this.bindings && this.bindings.dispose) {
        this.bindings.dispose();
      }
      this.emitter.emit('did-dispose');
      return this.emitter.dispose();
    }
  }]);

  return SuggestionList;
})();

exports['default'] = SuggestionList;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvc3VnZ2VzdGlvbi1saXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O29CQUU2QyxNQUFNOzs4QkFDcEIsbUJBQW1COztBQUhsRCxXQUFXLENBQUE7O0lBS1UsY0FBYztBQUNyQixXQURPLGNBQWMsR0FDbEI7OzswQkFESSxjQUFjOztBQUUvQixRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtBQUMzQixRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ3BDLFFBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDdEMsUUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDeEQsUUFBSSxDQUFDLDRCQUE0QixHQUFHLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDaEYsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNoQyxRQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUN0RSxRQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNoRSxRQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ2hDLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDcEQsUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUE7QUFDeEIsUUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBYSxDQUFBO0FBQzVCLFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7QUFDOUMsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsc0NBQXNDLEVBQUU7QUFDL0UsaUNBQTJCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtBQUNsRCw2Q0FBdUMsRUFBRSxJQUFJLENBQUMsNEJBQTRCO0FBQzFFLGdDQUEwQixFQUFFLElBQUksQ0FBQyxNQUFNO0tBQ3hDLENBQUMsQ0FBQyxDQUFBO0FBQ0gsUUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0RBQWdELEVBQUUsVUFBQyw0QkFBNEIsRUFBSztBQUM3SCxVQUFJLDRCQUE0QixFQUFFO0FBQ2hDLGNBQUssZUFBZSxHQUFHLElBQUksTUFBTSxrREFBNkIsQ0FBQTtPQUMvRCxNQUFNO0FBQ0wsY0FBSyxlQUFlLEdBQUcsUUFBUSxDQUFBO09BQ2hDO0FBQ0QsYUFBTyxNQUFLLGVBQWUsQ0FBQTtLQUM1QixDQUFDLENBQUMsQ0FBQTtHQUNKOztlQTVCa0IsY0FBYzs7V0E4QnJCLHFCQUFDLE1BQU0sRUFBRTs7O0FBQ25CLFVBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTtBQUMxQyxZQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFBO09BQ3hCO0FBQ0QsVUFBSSxDQUFDLFFBQVEsR0FBRywrQkFBeUIsQ0FBQTs7QUFFekMsVUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMscUNBQXFDLENBQUMsSUFBSSxFQUFFLENBQUE7O0FBRWxGLFVBQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUNmLFVBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtBQUFFLFlBQUksQ0FBQyxLQUFLLENBQUMsR0FBRywyQkFBMkIsQ0FBQTtPQUFFO0FBQ3BGLFVBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtBQUN2QyxZQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7QUFDeEMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLHVDQUF1QyxDQUFBO1NBQ3hELE1BQU07QUFDTCxjQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsMkJBQTJCLENBQUE7U0FDNUM7T0FDRjs7QUFFRCxVQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FDaEMsc0NBQXNDLEVBQ3RDLEVBQUMsc0NBQXNDLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FDaEQsQ0FBQTs7QUFFRCxVQUFNLHVCQUF1QixHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLDJDQUEyQyxDQUFDLENBQUE7QUFDNUYsVUFBTSxnQkFBZ0IsR0FBRyx1QkFBdUIsR0FBRyxNQUFNLEdBQUcsbUJBQW1CLENBQUE7O0FBRS9FLFVBQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQTtBQUNuQixjQUFRLENBQUksZ0JBQWdCLGNBQVcsR0FBRyxVQUFDLEtBQUssRUFBSztBQUNuRCxZQUFJLE9BQUssUUFBUSxFQUFFLElBQUksT0FBSyxLQUFLLElBQUksT0FBSyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUMxRCxpQkFBSyxjQUFjLEVBQUUsQ0FBQTtBQUNyQixpQkFBTyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsQ0FBQTtTQUN4QztPQUNGLENBQUE7QUFDRCxjQUFRLENBQUksZ0JBQWdCLGdCQUFhLEdBQUcsVUFBQyxLQUFLLEVBQUs7QUFDckQsWUFBSSxPQUFLLFFBQVEsRUFBRSxJQUFJLE9BQUssS0FBSyxJQUFJLE9BQUssS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDMUQsaUJBQUssVUFBVSxFQUFFLENBQUE7QUFDakIsaUJBQU8sS0FBSyxDQUFDLHdCQUF3QixFQUFFLENBQUE7U0FDeEM7T0FDRixDQUFBO0FBQ0QsY0FBUSxDQUFJLGdCQUFnQixjQUFXLEdBQUcsVUFBQyxLQUFLLEVBQUs7QUFDbkQsWUFBSSxPQUFLLFFBQVEsRUFBRSxJQUFJLE9BQUssS0FBSyxJQUFJLE9BQUssS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDMUQsaUJBQUssWUFBWSxFQUFFLENBQUE7QUFDbkIsaUJBQU8sS0FBSyxDQUFDLHdCQUF3QixFQUFFLENBQUE7U0FDeEM7T0FDRixDQUFBO0FBQ0QsY0FBUSxDQUFJLGdCQUFnQixnQkFBYSxHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQ3JELFlBQUksT0FBSyxRQUFRLEVBQUUsSUFBSSxPQUFLLEtBQUssSUFBSSxPQUFLLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQzFELGlCQUFLLGNBQWMsRUFBRSxDQUFBO0FBQ3JCLGlCQUFPLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxDQUFBO1NBQ3hDO09BQ0YsQ0FBQTtBQUNELGNBQVEsQ0FBSSxnQkFBZ0Isa0JBQWUsR0FBRyxVQUFDLEtBQUssRUFBSztBQUN2RCxZQUFJLE9BQUssUUFBUSxFQUFFLElBQUksT0FBSyxLQUFLLElBQUksT0FBSyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUMxRCxpQkFBSyxTQUFTLEVBQUUsQ0FBQTtBQUNoQixpQkFBTyxLQUFLLENBQUMsd0JBQXdCLEVBQUUsQ0FBQTtTQUN4QztPQUNGLENBQUE7QUFDRCxjQUFRLENBQUksZ0JBQWdCLHFCQUFrQixHQUFHLFVBQUMsS0FBSyxFQUFLO0FBQzFELFlBQUksT0FBSyxRQUFRLEVBQUUsSUFBSSxPQUFLLEtBQUssSUFBSSxPQUFLLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQzFELGlCQUFLLFlBQVksRUFBRSxDQUFBO0FBQ25CLGlCQUFPLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxDQUFBO1NBQ3hDO09BQ0YsQ0FBQTs7QUFFRCxVQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FDakMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQ3RDLENBQUE7O0FBRUQsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsMkNBQTJDLEVBQUUsWUFBTTtBQUN6RSxlQUFPLE9BQUssV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFBO09BQ2hDLENBQ0EsQ0FBQyxDQUFBO0tBQ0w7Ozs7Ozs7O1dBTU0sa0JBQUc7QUFDUixhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO0tBQ3ZDOzs7V0FFTyxpQkFBQyxLQUFLLEVBQUU7QUFDZCxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQTtLQUMvQzs7O1dBRWdCLDRCQUFHO0FBQ2xCLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQTtLQUNsRDs7O1dBRTRCLHNDQUFDLEtBQUssRUFBRTtBQUNuQyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHNDQUFzQyxFQUFFLEtBQUssQ0FBQyxDQUFBO0tBQ3hFOzs7V0FFTSxpQkFBQyxLQUFLLEVBQUU7QUFDZCxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQTtLQUMxQzs7O1dBRVUsc0JBQUc7QUFDWixhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUE7S0FDNUM7OztXQUVjLDBCQUFHO0FBQ2hCLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQTtLQUNoRDs7O1dBRVksd0JBQUc7QUFDZCxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUE7S0FDL0M7OztXQUVjLDBCQUFHO0FBQ2hCLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtLQUNqRDs7O1dBRVMscUJBQUc7QUFDWCxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUE7S0FDM0M7OztXQUVZLHdCQUFHO0FBQ2QsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO0tBQzlDOzs7Ozs7OztXQU1xQiwrQkFBQyxFQUFFLEVBQUU7QUFDekIsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSxFQUFFLENBQUMsQ0FBQTtLQUNwRDs7O1dBRWlDLDJDQUFDLEVBQUUsRUFBRTtBQUNyQyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLHNDQUFzQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0tBQ25FOzs7V0FFUSxtQkFBQyxFQUFFLEVBQUU7QUFDZixhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQTtLQUNuQzs7O1dBRVksc0JBQUMsRUFBRSxFQUFFO0FBQ2hCLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0tBQzFDOzs7V0FFZSx5QkFBQyxFQUFFLEVBQUU7QUFDbkIsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsQ0FBQTtLQUM5Qzs7O1dBRW1CLDZCQUFDLEVBQUUsRUFBRTtBQUN2QixhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLEVBQUUsQ0FBQyxDQUFBO0tBQ2xEOzs7V0FFaUIsMkJBQUMsRUFBRSxFQUFFO0FBQ3JCLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLENBQUE7S0FDakQ7OztXQUVtQiw2QkFBQyxFQUFFLEVBQUU7QUFDdkIsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLENBQUMsQ0FBQTtLQUNuRDs7O1dBRWMsd0JBQUMsRUFBRSxFQUFFO0FBQ2xCLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUE7S0FDN0M7OztXQUVpQiwyQkFBQyxFQUFFLEVBQUU7QUFDckIsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLENBQUMsQ0FBQTtLQUNoRDs7O1dBRVcscUJBQUMsRUFBRSxFQUFFO0FBQ2YsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUE7S0FDekM7OztXQUVZLHNCQUFDLEVBQUUsRUFBRTtBQUNoQixhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxFQUFFLENBQUMsQ0FBQTtLQUMxQzs7O1dBRWdCLDBCQUFDLEVBQUUsRUFBRTtBQUNwQixhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGtCQUFrQixFQUFFLEVBQUUsQ0FBQyxDQUFBO0tBQy9DOzs7V0FFUSxvQkFBRztBQUNWLGFBQVEsSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUM7S0FDbkM7OztXQUVJLGNBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRTtBQUNyQixVQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLHlDQUF5QyxDQUFDLEtBQUssUUFBUSxFQUFFO0FBQzNFLGVBQU8sSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQTtPQUNsRCxNQUFNO1lBQ0MsTUFBTSxHQUFLLE9BQU8sQ0FBbEIsTUFBTTs7QUFDWixZQUFJLGVBQWUsR0FBRyxLQUFLLENBQUE7QUFDM0IsYUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzFDLGNBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7QUFDMUIsY0FBSSxJQUFJLENBQUMsaUJBQWlCLElBQUksSUFBSSxFQUFFO0FBQ2xDLGtCQUFNLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFBO0FBQ3RDLDJCQUFlLEdBQUcsSUFBSSxDQUFBO0FBQ3RCLGtCQUFLO1dBQ047U0FDRjtBQUNELGVBQU8sSUFBSSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsZUFBZSxDQUFDLENBQUE7T0FDckU7S0FDRjs7O1dBRXVCLGlDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQTJCO1VBQXpCLGVBQWUseURBQUcsS0FBSzs7QUFDOUQsVUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNYLGVBQU07T0FDUDs7QUFFRCxVQUFJLGNBQWMsR0FBRyxNQUFNLENBQUMsdUJBQXVCLEVBQUUsQ0FBQTtBQUNyRCxVQUFJLGVBQWUsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN4RCxzQkFBYyxHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtPQUMvRDs7QUFFRCxVQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssTUFBTSxFQUFFO0FBQ2hDLFlBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFO0FBQ3ZELGNBQUksQ0FBQyxxQkFBcUIsR0FBRyxjQUFjLENBQUE7QUFDM0MsY0FBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7QUFDekIsZ0JBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQTtXQUN2RTtTQUNGO09BQ0YsTUFBTTtBQUNMLFlBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQTtBQUNyQixZQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQTtBQUMxQixZQUFJLENBQUMscUJBQXFCLEdBQUcsY0FBYyxDQUFBO0FBQzNDLFlBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUE7QUFDL0YsWUFBSSxDQUFDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFBO0FBQ3ZHLFlBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUE7T0FDekI7S0FDRjs7O1dBRW9CLDhCQUFDLE1BQU0sRUFBRTtBQUM1QixVQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssTUFBTSxJQUFLLE1BQU0sSUFBSSxJQUFJLEFBQUMsRUFBRTtBQUFFLGVBQU07T0FBRTtBQUNoRSxVQUFJLENBQUMsY0FBYyxFQUFFLENBQUE7QUFDckIsVUFBSSxNQUFNLFlBQUEsQ0FBQTtBQUNWLFVBQUksTUFBTSxDQUFDLGFBQWEsRUFBRSxFQUFFO0FBQzFCLGNBQU0sR0FBRyxNQUFNLENBQUMsYUFBYSxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUE7T0FDNUM7QUFDRCxVQUFJLE1BQU0sRUFBRTtBQUNWLFlBQUksQ0FBQyxZQUFZLEdBQUcsTUFBTSxDQUFBO0FBQzFCLFlBQUksQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUE7QUFDckYsZUFBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFBO09BQ2hDO0tBQ0Y7OztXQUVJLGdCQUFHO0FBQ04sVUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksRUFBRTtBQUFFLGVBQU07T0FBRTtBQUMxQyxVQUFJLENBQUMsY0FBYyxFQUFFLENBQUE7QUFDckIsVUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO0FBQzFDLFlBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDeEI7O0FBRUQsVUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUE7QUFDeEIsYUFBTyxJQUFJLENBQUMsWUFBWSxDQUFBO0tBQ3pCOzs7V0FFYywwQkFBRztBQUNoQixVQUFJLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFO0FBQzFELFlBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtPQUNoQyxNQUFNLElBQUksSUFBSSxDQUFDLGlCQUFpQixJQUFJLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUU7QUFDbkUsWUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxDQUFBO09BQ2pDO0FBQ0QsVUFBSSxDQUFDLGdCQUFnQixHQUFHLFNBQVMsQ0FBQTtBQUNqQyxVQUFJLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFBO0FBQ2xDLGFBQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFBO0tBQzlCOzs7V0FFVyxxQkFBQyxLQUFLLEVBQUU7QUFDbEIsVUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7QUFDbEIsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7S0FDekQ7Ozs7O1dBR08sbUJBQUc7QUFDVCxVQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDdEIsWUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtPQUM3Qjs7QUFFRCxVQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7QUFDMUMsWUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtPQUN4QjtBQUNELFVBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFBO0FBQ2hDLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQTtLQUM5Qjs7O1NBdFRrQixjQUFjOzs7cUJBQWQsY0FBYyIsImZpbGUiOiIvaG9tZS9qYW1lcy9naXRodWIvYXV0b2NvbXBsZXRlLXBsdXMvbGliL3N1Z2dlc3Rpb24tbGlzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCB7IEVtaXR0ZXIsIENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHsgVW5pY29kZUxldHRlcnMgfSBmcm9tICcuL3VuaWNvZGUtaGVscGVycydcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3VnZ2VzdGlvbkxpc3Qge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy53b3JkUHJlZml4UmVnZXggPSBudWxsXG4gICAgdGhpcy5jYW5jZWwgPSB0aGlzLmNhbmNlbC5iaW5kKHRoaXMpXG4gICAgdGhpcy5jb25maXJtID0gdGhpcy5jb25maXJtLmJpbmQodGhpcylcbiAgICB0aGlzLmNvbmZpcm1TZWxlY3Rpb24gPSB0aGlzLmNvbmZpcm1TZWxlY3Rpb24uYmluZCh0aGlzKVxuICAgIHRoaXMuY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdCA9IHRoaXMuY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdC5iaW5kKHRoaXMpXG4gICAgdGhpcy5zaG93ID0gdGhpcy5zaG93LmJpbmQodGhpcylcbiAgICB0aGlzLnNob3dBdEJlZ2lubmluZ09mUHJlZml4ID0gdGhpcy5zaG93QXRCZWdpbm5pbmdPZlByZWZpeC5iaW5kKHRoaXMpXG4gICAgdGhpcy5zaG93QXRDdXJzb3JQb3NpdGlvbiA9IHRoaXMuc2hvd0F0Q3Vyc29yUG9zaXRpb24uYmluZCh0aGlzKVxuICAgIHRoaXMuaGlkZSA9IHRoaXMuaGlkZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5kZXN0cm95T3ZlcmxheSA9IHRoaXMuZGVzdHJveU92ZXJsYXkuYmluZCh0aGlzKVxuICAgIHRoaXMuYWN0aXZlRWRpdG9yID0gbnVsbFxuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvci5hdXRvY29tcGxldGUtYWN0aXZlJywge1xuICAgICAgJ2F1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm0nOiB0aGlzLmNvbmZpcm1TZWxlY3Rpb24sXG4gICAgICAnYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybUlmTm9uRGVmYXVsdCc6IHRoaXMuY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdCxcbiAgICAgICdhdXRvY29tcGxldGUtcGx1czpjYW5jZWwnOiB0aGlzLmNhbmNlbFxuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuZW5hYmxlRXh0ZW5kZWRVbmljb2RlU3VwcG9ydCcsIChlbmFibGVFeHRlbmRlZFVuaWNvZGVTdXBwb3J0KSA9PiB7XG4gICAgICBpZiAoZW5hYmxlRXh0ZW5kZWRVbmljb2RlU3VwcG9ydCkge1xuICAgICAgICB0aGlzLndvcmRQcmVmaXhSZWdleCA9IG5ldyBSZWdFeHAoYF5bJHtVbmljb2RlTGV0dGVyc31cXFxcZF8tXWApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLndvcmRQcmVmaXhSZWdleCA9IC9eW1xcdy1dL1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMud29yZFByZWZpeFJlZ2V4XG4gICAgfSkpXG4gIH1cblxuICBhZGRCaW5kaW5ncyAoZWRpdG9yKSB7XG4gICAgaWYgKHRoaXMuYmluZGluZ3MgJiYgdGhpcy5iaW5kaW5ncy5kaXNwb3NlKSB7XG4gICAgICB0aGlzLmJpbmRpbmdzLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLmJpbmRpbmdzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgY29uc3QgY29tcGxldGlvbktleSA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLXBsdXMuY29uZmlybUNvbXBsZXRpb24nKSB8fCAnJ1xuXG4gICAgY29uc3Qga2V5cyA9IHt9XG4gICAgaWYgKGNvbXBsZXRpb25LZXkuaW5kZXhPZigndGFiJykgPiAtMSkgeyBrZXlzWyd0YWInXSA9ICdhdXRvY29tcGxldGUtcGx1czpjb25maXJtJyB9XG4gICAgaWYgKGNvbXBsZXRpb25LZXkuaW5kZXhPZignZW50ZXInKSA+IC0xKSB7XG4gICAgICBpZiAoY29tcGxldGlvbktleS5pbmRleE9mKCdhbHdheXMnKSA+IC0xKSB7XG4gICAgICAgIGtleXNbJ2VudGVyJ10gPSAnYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybUlmTm9uRGVmYXVsdCdcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGtleXNbJ2VudGVyJ10gPSAnYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybSdcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmJpbmRpbmdzLmFkZChhdG9tLmtleW1hcHMuYWRkKFxuICAgICAgJ2F0b20tdGV4dC1lZGl0b3IuYXV0b2NvbXBsZXRlLWFjdGl2ZScsXG4gICAgICB7J2F0b20tdGV4dC1lZGl0b3IuYXV0b2NvbXBsZXRlLWFjdGl2ZSc6IGtleXN9KVxuICAgIClcblxuICAgIGNvbnN0IHVzZUNvcmVNb3ZlbWVudENvbW1hbmRzID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtcGx1cy51c2VDb3JlTW92ZW1lbnRDb21tYW5kcycpXG4gICAgY29uc3QgY29tbWFuZE5hbWVzcGFjZSA9IHVzZUNvcmVNb3ZlbWVudENvbW1hbmRzID8gJ2NvcmUnIDogJ2F1dG9jb21wbGV0ZS1wbHVzJ1xuXG4gICAgY29uc3QgY29tbWFuZHMgPSB7fVxuICAgIGNvbW1hbmRzW2Ake2NvbW1hbmROYW1lc3BhY2V9Om1vdmUtdXBgXSA9IChldmVudCkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNBY3RpdmUoKSAmJiB0aGlzLml0ZW1zICYmIHRoaXMuaXRlbXMubGVuZ3RoID4gMSkge1xuICAgICAgICB0aGlzLnNlbGVjdFByZXZpb3VzKClcbiAgICAgICAgcmV0dXJuIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICB9XG4gICAgfVxuICAgIGNvbW1hbmRzW2Ake2NvbW1hbmROYW1lc3BhY2V9Om1vdmUtZG93bmBdID0gKGV2ZW50KSA9PiB7XG4gICAgICBpZiAodGhpcy5pc0FjdGl2ZSgpICYmIHRoaXMuaXRlbXMgJiYgdGhpcy5pdGVtcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0TmV4dCgpXG4gICAgICAgIHJldHVybiBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgfVxuICAgIH1cbiAgICBjb21tYW5kc1tgJHtjb21tYW5kTmFtZXNwYWNlfTpwYWdlLXVwYF0gPSAoZXZlbnQpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzQWN0aXZlKCkgJiYgdGhpcy5pdGVtcyAmJiB0aGlzLml0ZW1zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RQYWdlVXAoKVxuICAgICAgICByZXR1cm4gZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgIH1cbiAgICB9XG4gICAgY29tbWFuZHNbYCR7Y29tbWFuZE5hbWVzcGFjZX06cGFnZS1kb3duYF0gPSAoZXZlbnQpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzQWN0aXZlKCkgJiYgdGhpcy5pdGVtcyAmJiB0aGlzLml0ZW1zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RQYWdlRG93bigpXG4gICAgICAgIHJldHVybiBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgfVxuICAgIH1cbiAgICBjb21tYW5kc1tgJHtjb21tYW5kTmFtZXNwYWNlfTptb3ZlLXRvLXRvcGBdID0gKGV2ZW50KSA9PiB7XG4gICAgICBpZiAodGhpcy5pc0FjdGl2ZSgpICYmIHRoaXMuaXRlbXMgJiYgdGhpcy5pdGVtcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0VG9wKClcbiAgICAgICAgcmV0dXJuIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICB9XG4gICAgfVxuICAgIGNvbW1hbmRzW2Ake2NvbW1hbmROYW1lc3BhY2V9Om1vdmUtdG8tYm90dG9tYF0gPSAoZXZlbnQpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzQWN0aXZlKCkgJiYgdGhpcy5pdGVtcyAmJiB0aGlzLml0ZW1zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RCb3R0b20oKVxuICAgICAgICByZXR1cm4gZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmJpbmRpbmdzLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcbiAgICAgIGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLCBjb21tYW5kcylcbiAgICApXG5cbiAgICByZXR1cm4gdGhpcy5iaW5kaW5ncy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vbkRpZENoYW5nZSgnYXV0b2NvbXBsZXRlLXBsdXMudXNlQ29yZU1vdmVtZW50Q29tbWFuZHMnLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZEJpbmRpbmdzKGVkaXRvcilcbiAgICAgIH1cbiAgICAgICkpXG4gIH1cblxuICAvKlxuICBTZWN0aW9uOiBFdmVudCBUcmlnZ2Vyc1xuICAqL1xuXG4gIGNhbmNlbCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY2FuY2VsJylcbiAgfVxuXG4gIGNvbmZpcm0gKG1hdGNoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY29uZmlybScsIG1hdGNoKVxuICB9XG5cbiAgY29uZmlybVNlbGVjdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY29uZmlybS1zZWxlY3Rpb24nKVxuICB9XG5cbiAgY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdCAoZXZlbnQpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1jb25maXJtLXNlbGVjdGlvbi1pZi1ub24tZGVmYXVsdCcsIGV2ZW50KVxuICB9XG5cbiAgcmVwbGFjZShtYXRjaCkge1xuXHQgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgncmVwbGFjZScsIG1hdGNoKVxuICB9XG5cbiAgc2VsZWN0TmV4dCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtc2VsZWN0LW5leHQnKVxuICB9XG5cbiAgc2VsZWN0UHJldmlvdXMgKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXNlbGVjdC1wcmV2aW91cycpXG4gIH1cblxuICBzZWxlY3RQYWdlVXAgKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXNlbGVjdC1wYWdlLXVwJylcbiAgfVxuXG4gIHNlbGVjdFBhZ2VEb3duICgpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1zZWxlY3QtcGFnZS1kb3duJylcbiAgfVxuXG4gIHNlbGVjdFRvcCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtc2VsZWN0LXRvcCcpXG4gIH1cblxuICBzZWxlY3RCb3R0b20gKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXNlbGVjdC1ib3R0b20nKVxuICB9XG5cbiAgLypcbiAgU2VjdGlvbjogRXZlbnRzXG4gICovXG5cbiAgb25EaWRDb25maXJtU2VsZWN0aW9uIChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jb25maXJtLXNlbGVjdGlvbicsIGZuKVxuICB9XG5cbiAgb25EaWRjb25maXJtU2VsZWN0aW9uSWZOb25EZWZhdWx0IChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jb25maXJtLXNlbGVjdGlvbi1pZi1ub24tZGVmYXVsdCcsIGZuKVxuICB9XG5cbiAgb25SZXBsYWNlKGZuKSB7XG5cdHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ3JlcGxhY2UnLCBmbilcbiAgfVxuXG4gIG9uRGlkQ29uZmlybSAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtY29uZmlybScsIGZuKVxuICB9XG5cbiAgb25EaWRTZWxlY3ROZXh0IChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1zZWxlY3QtbmV4dCcsIGZuKVxuICB9XG5cbiAgb25EaWRTZWxlY3RQcmV2aW91cyAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtc2VsZWN0LXByZXZpb3VzJywgZm4pXG4gIH1cblxuICBvbkRpZFNlbGVjdFBhZ2VVcCAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtc2VsZWN0LXBhZ2UtdXAnLCBmbilcbiAgfVxuXG4gIG9uRGlkU2VsZWN0UGFnZURvd24gKGZuKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLXNlbGVjdC1wYWdlLWRvd24nLCBmbilcbiAgfVxuXG4gIG9uRGlkU2VsZWN0VG9wIChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1zZWxlY3QtdG9wJywgZm4pXG4gIH1cblxuICBvbkRpZFNlbGVjdEJvdHRvbSAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtc2VsZWN0LWJvdHRvbScsIGZuKVxuICB9XG5cbiAgb25EaWRDYW5jZWwgKGZuKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLWNhbmNlbCcsIGZuKVxuICB9XG5cbiAgb25EaWREaXNwb3NlIChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1kaXNwb3NlJywgZm4pXG4gIH1cblxuICBvbkRpZENoYW5nZUl0ZW1zIChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jaGFuZ2UtaXRlbXMnLCBmbilcbiAgfVxuXG4gIGlzQWN0aXZlICgpIHtcbiAgICByZXR1cm4gKHRoaXMuYWN0aXZlRWRpdG9yICE9IG51bGwpXG4gIH1cblxuICBzaG93IChlZGl0b3IsIG9wdGlvbnMpIHtcbiAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtcGx1cy5zdWdnZXN0aW9uTGlzdEZvbGxvd3MnKSA9PT0gJ0N1cnNvcicpIHtcbiAgICAgIHJldHVybiB0aGlzLnNob3dBdEN1cnNvclBvc2l0aW9uKGVkaXRvciwgb3B0aW9ucylcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHsgcHJlZml4IH0gPSBvcHRpb25zXG4gICAgICBsZXQgZm9sbG93UmF3UHJlZml4ID0gZmFsc2VcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5pdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5pdGVtc1tpXVxuICAgICAgICBpZiAoaXRlbS5yZXBsYWNlbWVudFByZWZpeCAhPSBudWxsKSB7XG4gICAgICAgICAgcHJlZml4ID0gaXRlbS5yZXBsYWNlbWVudFByZWZpeC50cmltKClcbiAgICAgICAgICBmb2xsb3dSYXdQcmVmaXggPSB0cnVlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuc2hvd0F0QmVnaW5uaW5nT2ZQcmVmaXgoZWRpdG9yLCBwcmVmaXgsIGZvbGxvd1Jhd1ByZWZpeClcbiAgICB9XG4gIH1cblxuICBzaG93QXRCZWdpbm5pbmdPZlByZWZpeCAoZWRpdG9yLCBwcmVmaXgsIGZvbGxvd1Jhd1ByZWZpeCA9IGZhbHNlKSB7XG4gICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGxldCBidWZmZXJQb3NpdGlvbiA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgaWYgKGZvbGxvd1Jhd1ByZWZpeCB8fCB0aGlzLndvcmRQcmVmaXhSZWdleC50ZXN0KHByZWZpeCkpIHtcbiAgICAgIGJ1ZmZlclBvc2l0aW9uID0gYnVmZmVyUG9zaXRpb24udHJhbnNsYXRlKFswLCAtcHJlZml4Lmxlbmd0aF0pXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYWN0aXZlRWRpdG9yID09PSBlZGl0b3IpIHtcbiAgICAgIGlmICghYnVmZmVyUG9zaXRpb24uaXNFcXVhbCh0aGlzLmRpc3BsYXlCdWZmZXJQb3NpdGlvbikpIHtcbiAgICAgICAgdGhpcy5kaXNwbGF5QnVmZmVyUG9zaXRpb24gPSBidWZmZXJQb3NpdGlvblxuICAgICAgICBpZiAodGhpcy5zdWdnZXN0aW9uTWFya2VyKSB7XG4gICAgICAgICAgdGhpcy5zdWdnZXN0aW9uTWFya2VyLnNldEJ1ZmZlclJhbmdlKFtidWZmZXJQb3NpdGlvbiwgYnVmZmVyUG9zaXRpb25dKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKVxuICAgICAgdGhpcy5hY3RpdmVFZGl0b3IgPSBlZGl0b3JcbiAgICAgIHRoaXMuZGlzcGxheUJ1ZmZlclBvc2l0aW9uID0gYnVmZmVyUG9zaXRpb25cbiAgICAgIGNvbnN0IG1hcmtlciA9IHRoaXMuc3VnZ2VzdGlvbk1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UoW2J1ZmZlclBvc2l0aW9uLCBidWZmZXJQb3NpdGlvbl0pXG4gICAgICB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uID0gZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwge3R5cGU6ICdvdmVybGF5JywgaXRlbTogdGhpcywgcG9zaXRpb246ICd0YWlsJ30pXG4gICAgICB0aGlzLmFkZEJpbmRpbmdzKGVkaXRvcilcbiAgICB9XG4gIH1cblxuICBzaG93QXRDdXJzb3JQb3NpdGlvbiAoZWRpdG9yKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlRWRpdG9yID09PSBlZGl0b3IgfHwgKGVkaXRvciA9PSBudWxsKSkgeyByZXR1cm4gfVxuICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKVxuICAgIGxldCBtYXJrZXJcbiAgICBpZiAoZWRpdG9yLmdldExhc3RDdXJzb3IoKSkge1xuICAgICAgbWFya2VyID0gZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRNYXJrZXIoKVxuICAgIH1cbiAgICBpZiAobWFya2VyKSB7XG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IGVkaXRvclxuICAgICAgdGhpcy5vdmVybGF5RGVjb3JhdGlvbiA9IGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHt0eXBlOiAnb3ZlcmxheScsIGl0ZW06IHRoaXN9KVxuICAgICAgcmV0dXJuIHRoaXMuYWRkQmluZGluZ3MoZWRpdG9yKVxuICAgIH1cbiAgfVxuXG4gIGhpZGUgKCkge1xuICAgIGlmICh0aGlzLmFjdGl2ZUVkaXRvciA9PT0gbnVsbCkgeyByZXR1cm4gfVxuICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKVxuICAgIGlmICh0aGlzLmJpbmRpbmdzICYmIHRoaXMuYmluZGluZ3MuZGlzcG9zZSkge1xuICAgICAgdGhpcy5iaW5kaW5ncy5kaXNwb3NlKClcbiAgICB9XG5cbiAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IG51bGxcbiAgICByZXR1cm4gdGhpcy5hY3RpdmVFZGl0b3JcbiAgfVxuXG4gIGRlc3Ryb3lPdmVybGF5ICgpIHtcbiAgICBpZiAodGhpcy5zdWdnZXN0aW9uTWFya2VyICYmIHRoaXMuc3VnZ2VzdGlvbk1hcmtlci5kZXN0cm95KSB7XG4gICAgICB0aGlzLnN1Z2dlc3Rpb25NYXJrZXIuZGVzdHJveSgpXG4gICAgfSBlbHNlIGlmICh0aGlzLm92ZXJsYXlEZWNvcmF0aW9uICYmIHRoaXMub3ZlcmxheURlY29yYXRpb24uZGVzdHJveSkge1xuICAgICAgdGhpcy5vdmVybGF5RGVjb3JhdGlvbi5kZXN0cm95KClcbiAgICB9XG4gICAgdGhpcy5zdWdnZXN0aW9uTWFya2VyID0gdW5kZWZpbmVkXG4gICAgdGhpcy5vdmVybGF5RGVjb3JhdGlvbiA9IHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uXG4gIH1cblxuICBjaGFuZ2VJdGVtcyAoaXRlbXMpIHtcbiAgICB0aGlzLml0ZW1zID0gaXRlbXNcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1jaGFuZ2UtaXRlbXMnLCB0aGlzLml0ZW1zKVxuICB9XG5cbiAgLy8gUHVibGljOiBDbGVhbiB1cCwgc3RvcCBsaXN0ZW5pbmcgdG8gZXZlbnRzXG4gIGRpc3Bvc2UgKCkge1xuICAgIGlmICh0aGlzLnN1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICB9XG5cbiAgICBpZiAodGhpcy5iaW5kaW5ncyAmJiB0aGlzLmJpbmRpbmdzLmRpc3Bvc2UpIHtcbiAgICAgIHRoaXMuYmluZGluZ3MuZGlzcG9zZSgpXG4gICAgfVxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtZGlzcG9zZScpXG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5kaXNwb3NlKClcbiAgfVxufVxuIl19