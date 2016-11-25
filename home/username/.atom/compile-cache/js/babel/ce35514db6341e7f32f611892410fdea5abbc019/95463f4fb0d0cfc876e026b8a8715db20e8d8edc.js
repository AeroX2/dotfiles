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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvc3VnZ2VzdGlvbi1saXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O29CQUU2QyxNQUFNOzs4QkFDcEIsbUJBQW1COztBQUhsRCxXQUFXLENBQUE7O0lBS1UsY0FBYztBQUNyQixXQURPLGNBQWMsR0FDbEI7OzswQkFESSxjQUFjOztBQUUvQixRQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtBQUMzQixRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ3BDLFFBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDdEMsUUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDeEQsUUFBSSxDQUFDLDRCQUE0QixHQUFHLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDaEYsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNoQyxRQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUN0RSxRQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNoRSxRQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ2hDLFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7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QUFDRCxVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUNoQyxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUE7S0FDOUI7OztTQTlTa0IsY0FBYzs7O3FCQUFkLGNBQWMiLCJmaWxlIjoiL2hvbWUvamFtZXMvZ2l0aHViL2F1dG9jb21wbGV0ZS1wbHVzL2xpYi9zdWdnZXN0aW9uLWxpc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5pbXBvcnQgeyBFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCB7IFVuaWNvZGVMZXR0ZXJzIH0gZnJvbSAnLi91bmljb2RlLWhlbHBlcnMnXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN1Z2dlc3Rpb25MaXN0IHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMud29yZFByZWZpeFJlZ2V4ID0gbnVsbFxuICAgIHRoaXMuY2FuY2VsID0gdGhpcy5jYW5jZWwuYmluZCh0aGlzKVxuICAgIHRoaXMuY29uZmlybSA9IHRoaXMuY29uZmlybS5iaW5kKHRoaXMpXG4gICAgdGhpcy5jb25maXJtU2VsZWN0aW9uID0gdGhpcy5jb25maXJtU2VsZWN0aW9uLmJpbmQodGhpcylcbiAgICB0aGlzLmNvbmZpcm1TZWxlY3Rpb25JZk5vbkRlZmF1bHQgPSB0aGlzLmNvbmZpcm1TZWxlY3Rpb25JZk5vbkRlZmF1bHQuYmluZCh0aGlzKVxuICAgIHRoaXMuc2hvdyA9IHRoaXMuc2hvdy5iaW5kKHRoaXMpXG4gICAgdGhpcy5zaG93QXRCZWdpbm5pbmdPZlByZWZpeCA9IHRoaXMuc2hvd0F0QmVnaW5uaW5nT2ZQcmVmaXguYmluZCh0aGlzKVxuICAgIHRoaXMuc2hvd0F0Q3Vyc29yUG9zaXRpb24gPSB0aGlzLnNob3dBdEN1cnNvclBvc2l0aW9uLmJpbmQodGhpcylcbiAgICB0aGlzLmhpZGUgPSB0aGlzLmhpZGUuYmluZCh0aGlzKVxuICAgIHRoaXMuZGVzdHJveU92ZXJsYXkgPSB0aGlzLmRlc3Ryb3lPdmVybGF5LmJpbmQodGhpcylcbiAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IG51bGxcbiAgICB0aGlzLmVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3IuYXV0b2NvbXBsZXRlLWFjdGl2ZScsIHtcbiAgICAgICdhdXRvY29tcGxldGUtcGx1czpjb25maXJtJzogdGhpcy5jb25maXJtU2VsZWN0aW9uLFxuICAgICAgJ2F1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm1JZk5vbkRlZmF1bHQnOiB0aGlzLmNvbmZpcm1TZWxlY3Rpb25JZk5vbkRlZmF1bHQsXG4gICAgICAnYXV0b2NvbXBsZXRlLXBsdXM6Y2FuY2VsJzogdGhpcy5jYW5jZWxcbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmVuYWJsZUV4dGVuZGVkVW5pY29kZVN1cHBvcnQnLCAoZW5hYmxlRXh0ZW5kZWRVbmljb2RlU3VwcG9ydCkgPT4ge1xuICAgICAgaWYgKGVuYWJsZUV4dGVuZGVkVW5pY29kZVN1cHBvcnQpIHtcbiAgICAgICAgdGhpcy53b3JkUHJlZml4UmVnZXggPSBuZXcgUmVnRXhwKGBeWyR7VW5pY29kZUxldHRlcnN9XFxcXGRfLV1gKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy53b3JkUHJlZml4UmVnZXggPSAvXltcXHctXS9cbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLndvcmRQcmVmaXhSZWdleFxuICAgIH0pKVxuICB9XG5cbiAgYWRkQmluZGluZ3MgKGVkaXRvcikge1xuICAgIGlmICh0aGlzLmJpbmRpbmdzICYmIHRoaXMuYmluZGluZ3MuZGlzcG9zZSkge1xuICAgICAgdGhpcy5iaW5kaW5ncy5kaXNwb3NlKClcbiAgICB9XG4gICAgdGhpcy5iaW5kaW5ncyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIGNvbnN0IGNvbXBsZXRpb25LZXkgPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1wbHVzLmNvbmZpcm1Db21wbGV0aW9uJykgfHwgJydcblxuICAgIGNvbnN0IGtleXMgPSB7fVxuICAgIGlmIChjb21wbGV0aW9uS2V5LmluZGV4T2YoJ3RhYicpID4gLTEpIHsga2V5c1sndGFiJ10gPSAnYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybScgfVxuICAgIGlmIChjb21wbGV0aW9uS2V5LmluZGV4T2YoJ2VudGVyJykgPiAtMSkge1xuICAgICAgaWYgKGNvbXBsZXRpb25LZXkuaW5kZXhPZignYWx3YXlzJykgPiAtMSkge1xuICAgICAgICBrZXlzWydlbnRlciddID0gJ2F1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm1JZk5vbkRlZmF1bHQnXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBrZXlzWydlbnRlciddID0gJ2F1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm0nXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5iaW5kaW5ncy5hZGQoYXRvbS5rZXltYXBzLmFkZChcbiAgICAgICdhdG9tLXRleHQtZWRpdG9yLmF1dG9jb21wbGV0ZS1hY3RpdmUnLFxuICAgICAgeydhdG9tLXRleHQtZWRpdG9yLmF1dG9jb21wbGV0ZS1hY3RpdmUnOiBrZXlzfSlcbiAgICApXG5cbiAgICBjb25zdCB1c2VDb3JlTW92ZW1lbnRDb21tYW5kcyA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLXBsdXMudXNlQ29yZU1vdmVtZW50Q29tbWFuZHMnKVxuICAgIGNvbnN0IGNvbW1hbmROYW1lc3BhY2UgPSB1c2VDb3JlTW92ZW1lbnRDb21tYW5kcyA/ICdjb3JlJyA6ICdhdXRvY29tcGxldGUtcGx1cydcblxuICAgIGNvbnN0IGNvbW1hbmRzID0ge31cbiAgICBjb21tYW5kc1tgJHtjb21tYW5kTmFtZXNwYWNlfTptb3ZlLXVwYF0gPSAoZXZlbnQpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzQWN0aXZlKCkgJiYgdGhpcy5pdGVtcyAmJiB0aGlzLml0ZW1zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RQcmV2aW91cygpXG4gICAgICAgIHJldHVybiBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgfVxuICAgIH1cbiAgICBjb21tYW5kc1tgJHtjb21tYW5kTmFtZXNwYWNlfTptb3ZlLWRvd25gXSA9IChldmVudCkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNBY3RpdmUoKSAmJiB0aGlzLml0ZW1zICYmIHRoaXMuaXRlbXMubGVuZ3RoID4gMSkge1xuICAgICAgICB0aGlzLnNlbGVjdE5leHQoKVxuICAgICAgICByZXR1cm4gZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgIH1cbiAgICB9XG4gICAgY29tbWFuZHNbYCR7Y29tbWFuZE5hbWVzcGFjZX06cGFnZS11cGBdID0gKGV2ZW50KSA9PiB7XG4gICAgICBpZiAodGhpcy5pc0FjdGl2ZSgpICYmIHRoaXMuaXRlbXMgJiYgdGhpcy5pdGVtcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0UGFnZVVwKClcbiAgICAgICAgcmV0dXJuIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICB9XG4gICAgfVxuICAgIGNvbW1hbmRzW2Ake2NvbW1hbmROYW1lc3BhY2V9OnBhZ2UtZG93bmBdID0gKGV2ZW50KSA9PiB7XG4gICAgICBpZiAodGhpcy5pc0FjdGl2ZSgpICYmIHRoaXMuaXRlbXMgJiYgdGhpcy5pdGVtcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0UGFnZURvd24oKVxuICAgICAgICByZXR1cm4gZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgIH1cbiAgICB9XG4gICAgY29tbWFuZHNbYCR7Y29tbWFuZE5hbWVzcGFjZX06bW92ZS10by10b3BgXSA9IChldmVudCkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNBY3RpdmUoKSAmJiB0aGlzLml0ZW1zICYmIHRoaXMuaXRlbXMubGVuZ3RoID4gMSkge1xuICAgICAgICB0aGlzLnNlbGVjdFRvcCgpXG4gICAgICAgIHJldHVybiBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgfVxuICAgIH1cbiAgICBjb21tYW5kc1tgJHtjb21tYW5kTmFtZXNwYWNlfTptb3ZlLXRvLWJvdHRvbWBdID0gKGV2ZW50KSA9PiB7XG4gICAgICBpZiAodGhpcy5pc0FjdGl2ZSgpICYmIHRoaXMuaXRlbXMgJiYgdGhpcy5pdGVtcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0Qm90dG9tKClcbiAgICAgICAgcmV0dXJuIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5iaW5kaW5ncy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXG4gICAgICBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSwgY29tbWFuZHMpXG4gICAgKVxuXG4gICAgcmV0dXJuIHRoaXMuYmluZGluZ3MuYWRkKFxuICAgICAgYXRvbS5jb25maWcub25EaWRDaGFuZ2UoJ2F1dG9jb21wbGV0ZS1wbHVzLnVzZUNvcmVNb3ZlbWVudENvbW1hbmRzJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRCaW5kaW5ncyhlZGl0b3IpXG4gICAgICB9XG4gICAgICApKVxuICB9XG5cbiAgLypcbiAgU2VjdGlvbjogRXZlbnQgVHJpZ2dlcnNcbiAgKi9cblxuICBjYW5jZWwgKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWNhbmNlbCcpXG4gIH1cblxuICBjb25maXJtIChtYXRjaCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWNvbmZpcm0nLCBtYXRjaClcbiAgfVxuXG4gIGNvbmZpcm1TZWxlY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLWNvbmZpcm0tc2VsZWN0aW9uJylcbiAgfVxuXG4gIGNvbmZpcm1TZWxlY3Rpb25JZk5vbkRlZmF1bHQgKGV2ZW50KSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY29uZmlybS1zZWxlY3Rpb24taWYtbm9uLWRlZmF1bHQnLCBldmVudClcbiAgfVxuXG4gIHNlbGVjdE5leHQgKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXNlbGVjdC1uZXh0JylcbiAgfVxuXG4gIHNlbGVjdFByZXZpb3VzICgpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1zZWxlY3QtcHJldmlvdXMnKVxuICB9XG5cbiAgc2VsZWN0UGFnZVVwICgpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1zZWxlY3QtcGFnZS11cCcpXG4gIH1cblxuICBzZWxlY3RQYWdlRG93biAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtc2VsZWN0LXBhZ2UtZG93bicpXG4gIH1cblxuICBzZWxlY3RUb3AgKCkge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIuZW1pdCgnZGlkLXNlbGVjdC10b3AnKVxuICB9XG5cbiAgc2VsZWN0Qm90dG9tICgpIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1zZWxlY3QtYm90dG9tJylcbiAgfVxuXG4gIC8qXG4gIFNlY3Rpb246IEV2ZW50c1xuICAqL1xuXG4gIG9uRGlkQ29uZmlybVNlbGVjdGlvbiAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtY29uZmlybS1zZWxlY3Rpb24nLCBmbilcbiAgfVxuXG4gIG9uRGlkY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdCAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtY29uZmlybS1zZWxlY3Rpb24taWYtbm9uLWRlZmF1bHQnLCBmbilcbiAgfVxuXG4gIG9uRGlkQ29uZmlybSAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtY29uZmlybScsIGZuKVxuICB9XG5cbiAgb25EaWRTZWxlY3ROZXh0IChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1zZWxlY3QtbmV4dCcsIGZuKVxuICB9XG5cbiAgb25EaWRTZWxlY3RQcmV2aW91cyAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtc2VsZWN0LXByZXZpb3VzJywgZm4pXG4gIH1cblxuICBvbkRpZFNlbGVjdFBhZ2VVcCAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtc2VsZWN0LXBhZ2UtdXAnLCBmbilcbiAgfVxuXG4gIG9uRGlkU2VsZWN0UGFnZURvd24gKGZuKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLXNlbGVjdC1wYWdlLWRvd24nLCBmbilcbiAgfVxuXG4gIG9uRGlkU2VsZWN0VG9wIChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1zZWxlY3QtdG9wJywgZm4pXG4gIH1cblxuICBvbkRpZFNlbGVjdEJvdHRvbSAoZm4pIHtcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLm9uKCdkaWQtc2VsZWN0LWJvdHRvbScsIGZuKVxuICB9XG5cbiAgb25EaWRDYW5jZWwgKGZuKSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLWNhbmNlbCcsIGZuKVxuICB9XG5cbiAgb25EaWREaXNwb3NlIChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1kaXNwb3NlJywgZm4pXG4gIH1cblxuICBvbkRpZENoYW5nZUl0ZW1zIChmbikge1xuICAgIHJldHVybiB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jaGFuZ2UtaXRlbXMnLCBmbilcbiAgfVxuXG4gIGlzQWN0aXZlICgpIHtcbiAgICByZXR1cm4gKHRoaXMuYWN0aXZlRWRpdG9yICE9IG51bGwpXG4gIH1cblxuICBzaG93IChlZGl0b3IsIG9wdGlvbnMpIHtcbiAgICBpZiAoYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtcGx1cy5zdWdnZXN0aW9uTGlzdEZvbGxvd3MnKSA9PT0gJ0N1cnNvcicpIHtcbiAgICAgIHJldHVybiB0aGlzLnNob3dBdEN1cnNvclBvc2l0aW9uKGVkaXRvciwgb3B0aW9ucylcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHsgcHJlZml4IH0gPSBvcHRpb25zXG4gICAgICBsZXQgZm9sbG93UmF3UHJlZml4ID0gZmFsc2VcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5pdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5pdGVtc1tpXVxuICAgICAgICBpZiAoaXRlbS5yZXBsYWNlbWVudFByZWZpeCAhPSBudWxsKSB7XG4gICAgICAgICAgcHJlZml4ID0gaXRlbS5yZXBsYWNlbWVudFByZWZpeC50cmltKClcbiAgICAgICAgICBmb2xsb3dSYXdQcmVmaXggPSB0cnVlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuc2hvd0F0QmVnaW5uaW5nT2ZQcmVmaXgoZWRpdG9yLCBwcmVmaXgsIGZvbGxvd1Jhd1ByZWZpeClcbiAgICB9XG4gIH1cblxuICBzaG93QXRCZWdpbm5pbmdPZlByZWZpeCAoZWRpdG9yLCBwcmVmaXgsIGZvbGxvd1Jhd1ByZWZpeCA9IGZhbHNlKSB7XG4gICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGxldCBidWZmZXJQb3NpdGlvbiA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgaWYgKGZvbGxvd1Jhd1ByZWZpeCB8fCB0aGlzLndvcmRQcmVmaXhSZWdleC50ZXN0KHByZWZpeCkpIHtcbiAgICAgIGJ1ZmZlclBvc2l0aW9uID0gYnVmZmVyUG9zaXRpb24udHJhbnNsYXRlKFswLCAtcHJlZml4Lmxlbmd0aF0pXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYWN0aXZlRWRpdG9yID09PSBlZGl0b3IpIHtcbiAgICAgIGlmICghYnVmZmVyUG9zaXRpb24uaXNFcXVhbCh0aGlzLmRpc3BsYXlCdWZmZXJQb3NpdGlvbikpIHtcbiAgICAgICAgdGhpcy5kaXNwbGF5QnVmZmVyUG9zaXRpb24gPSBidWZmZXJQb3NpdGlvblxuICAgICAgICBpZiAodGhpcy5zdWdnZXN0aW9uTWFya2VyKSB7XG4gICAgICAgICAgdGhpcy5zdWdnZXN0aW9uTWFya2VyLnNldEJ1ZmZlclJhbmdlKFtidWZmZXJQb3NpdGlvbiwgYnVmZmVyUG9zaXRpb25dKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKVxuICAgICAgdGhpcy5hY3RpdmVFZGl0b3IgPSBlZGl0b3JcbiAgICAgIHRoaXMuZGlzcGxheUJ1ZmZlclBvc2l0aW9uID0gYnVmZmVyUG9zaXRpb25cbiAgICAgIGNvbnN0IG1hcmtlciA9IHRoaXMuc3VnZ2VzdGlvbk1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UoW2J1ZmZlclBvc2l0aW9uLCBidWZmZXJQb3NpdGlvbl0pXG4gICAgICB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uID0gZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwge3R5cGU6ICdvdmVybGF5JywgaXRlbTogdGhpcywgcG9zaXRpb246ICd0YWlsJ30pXG4gICAgICB0aGlzLmFkZEJpbmRpbmdzKGVkaXRvcilcbiAgICB9XG4gIH1cblxuICBzaG93QXRDdXJzb3JQb3NpdGlvbiAoZWRpdG9yKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlRWRpdG9yID09PSBlZGl0b3IgfHwgKGVkaXRvciA9PSBudWxsKSkgeyByZXR1cm4gfVxuICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKVxuICAgIGxldCBtYXJrZXJcbiAgICBpZiAoZWRpdG9yLmdldExhc3RDdXJzb3IoKSkge1xuICAgICAgbWFya2VyID0gZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRNYXJrZXIoKVxuICAgIH1cbiAgICBpZiAobWFya2VyKSB7XG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IGVkaXRvclxuICAgICAgdGhpcy5vdmVybGF5RGVjb3JhdGlvbiA9IGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHt0eXBlOiAnb3ZlcmxheScsIGl0ZW06IHRoaXN9KVxuICAgICAgcmV0dXJuIHRoaXMuYWRkQmluZGluZ3MoZWRpdG9yKVxuICAgIH1cbiAgfVxuXG4gIGhpZGUgKCkge1xuICAgIGlmICh0aGlzLmFjdGl2ZUVkaXRvciA9PT0gbnVsbCkgeyByZXR1cm4gfVxuICAgIHRoaXMuZGVzdHJveU92ZXJsYXkoKVxuICAgIGlmICh0aGlzLmJpbmRpbmdzICYmIHRoaXMuYmluZGluZ3MuZGlzcG9zZSkge1xuICAgICAgdGhpcy5iaW5kaW5ncy5kaXNwb3NlKClcbiAgICB9XG5cbiAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IG51bGxcbiAgICByZXR1cm4gdGhpcy5hY3RpdmVFZGl0b3JcbiAgfVxuXG4gIGRlc3Ryb3lPdmVybGF5ICgpIHtcbiAgICBpZiAodGhpcy5zdWdnZXN0aW9uTWFya2VyICYmIHRoaXMuc3VnZ2VzdGlvbk1hcmtlci5kZXN0cm95KSB7XG4gICAgICB0aGlzLnN1Z2dlc3Rpb25NYXJrZXIuZGVzdHJveSgpXG4gICAgfSBlbHNlIGlmICh0aGlzLm92ZXJsYXlEZWNvcmF0aW9uICYmIHRoaXMub3ZlcmxheURlY29yYXRpb24uZGVzdHJveSkge1xuICAgICAgdGhpcy5vdmVybGF5RGVjb3JhdGlvbi5kZXN0cm95KClcbiAgICB9XG4gICAgdGhpcy5zdWdnZXN0aW9uTWFya2VyID0gdW5kZWZpbmVkXG4gICAgdGhpcy5vdmVybGF5RGVjb3JhdGlvbiA9IHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLm92ZXJsYXlEZWNvcmF0aW9uXG4gIH1cblxuICBjaGFuZ2VJdGVtcyAoaXRlbXMpIHtcbiAgICB0aGlzLml0ZW1zID0gaXRlbXNcbiAgICByZXR1cm4gdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1jaGFuZ2UtaXRlbXMnLCB0aGlzLml0ZW1zKVxuICB9XG5cbiAgLy8gUHVibGljOiBDbGVhbiB1cCwgc3RvcCBsaXN0ZW5pbmcgdG8gZXZlbnRzXG4gIGRpc3Bvc2UgKCkge1xuICAgIGlmICh0aGlzLnN1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICB9XG5cbiAgICBpZiAodGhpcy5iaW5kaW5ncyAmJiB0aGlzLmJpbmRpbmdzLmRpc3Bvc2UpIHtcbiAgICAgIHRoaXMuYmluZGluZ3MuZGlzcG9zZSgpXG4gICAgfVxuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtZGlzcG9zZScpXG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5kaXNwb3NlKClcbiAgfVxufVxuIl19