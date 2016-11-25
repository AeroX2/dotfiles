Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _fuzzaldrin = require('fuzzaldrin');

var _fuzzaldrin2 = _interopRequireDefault(_fuzzaldrin);

var _fuzzaldrinPlus = require('fuzzaldrin-plus');

var _fuzzaldrinPlus2 = _interopRequireDefault(_fuzzaldrinPlus);

var _providerManager = require('./provider-manager');

var _providerManager2 = _interopRequireDefault(_providerManager);

var _suggestionList = require('./suggestion-list');

var _suggestionList2 = _interopRequireDefault(_suggestionList);

var _suggestionListElement = require('./suggestion-list-element');

var _suggestionListElement2 = _interopRequireDefault(_suggestionListElement);

var _unicodeHelpers = require('./unicode-helpers');

// Deferred requires
'use babel';

var minimatch = null;
var grim = null;

var AutocompleteManager = (function () {
  function AutocompleteManager() {
    var _this = this;

    _classCallCheck(this, AutocompleteManager);

    this.autosaveEnabled = false;
    this.backspaceTriggersAutocomplete = true;
    this.autoConfirmSingleSuggestionEnabled = true;
    this.bracketMatcherPairs = ['()', '[]', '{}', '""', "''", '``', '“”', '‘’', '«»', '‹›'];
    this.buffer = null;
    this.compositionInProgress = false;
    this.disposed = false;
    this.editor = null;
    this.editorSubscriptions = null;
    this.editorView = null;
    this.providerManager = null;
    this.ready = false;
    this.subscriptions = null;
    this.suggestionDelay = 50;
    this.suggestionList = null;
    this.suppressForClasses = [];
    this.shouldDisplaySuggestions = false;
    this.prefixRegex = null;
    this.wordPrefixRegex = null;
    this.updateCurrentEditor = this.updateCurrentEditor.bind(this);
    this.handleCommands = this.handleCommands.bind(this);
    this.findSuggestions = this.findSuggestions.bind(this);
    this.getSuggestionsFromProviders = this.getSuggestionsFromProviders.bind(this);
    this.displaySuggestions = this.displaySuggestions.bind(this);
    this.hideSuggestionList = this.hideSuggestionList.bind(this);

    this.toggleActivationForBufferChange = this.toggleActivationForBufferChange.bind(this);
    this.showOrHideSuggestionListForBufferChanges = this.showOrHideSuggestionListForBufferChanges.bind(this);
    this.showOrHideSuggestionListForBufferChange = this.showOrHideSuggestionListForBufferChange.bind(this);
    this.subscriptions = new _atom.CompositeDisposable();
    this.providerManager = new _providerManager2['default']();
    this.suggestionList = new _suggestionList2['default']();

    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableExtendedUnicodeSupport', function (enableExtendedUnicodeSupport) {
      if (enableExtendedUnicodeSupport) {
        _this.prefixRegex = new RegExp('([\'"~`!@#\\$%^&*\\(\\)\\{\\}\\[\\]=+,/\\?>])?(([' + _unicodeHelpers.UnicodeLetters + '\\d_]+[' + _unicodeHelpers.UnicodeLetters + '\\d_-]*)|([.:;[{(< ]+))$');
        _this.wordPrefixRegex = new RegExp('^[' + _unicodeHelpers.UnicodeLetters + '\\d_]+[' + _unicodeHelpers.UnicodeLetters + '\\d_-]*$');
      } else {
        _this.prefixRegex = /(\b|['"~`!@#\$%^&*\(\)\{\}\[\]=\+,/\?>])((\w+[\w-]*)|([.:;[{(< ]+))$/;
        _this.wordPrefixRegex = /^\w+[\w-]*$/;
      }
    }));
    this.subscriptions.add(this.providerManager);
    this.subscriptions.add(atom.views.addViewProvider(_suggestionList2['default'], function (model) {
      return new _suggestionListElement2['default']().initialize(model);
    }));

    this.handleEvents();
    this.handleCommands();
    this.subscriptions.add(this.suggestionList); // We're adding this last so it is disposed after events
    this.ready = true;
  }

  _createClass(AutocompleteManager, [{
    key: 'setSnippetsManager',
    value: function setSnippetsManager(snippetsManager) {
      this.snippetsManager = snippetsManager;
    }
  }, {
    key: 'updateCurrentEditor',
    value: function updateCurrentEditor(currentEditor) {
      var _this2 = this;

      if (currentEditor == null || currentEditor === this.editor) {
        return;
      }
      if (this.editorSubscriptions) {
        this.editorSubscriptions.dispose();
      }
      this.editorSubscriptions = null;

      // Stop tracking editor + buffer
      this.editor = null;
      this.editorView = null;
      this.buffer = null;
      this.isCurrentFileBlackListedCache = null;

      if (!this.editorIsValid(currentEditor)) {
        return;
      }

      // Track the new editor, editorView, and buffer
      this.editor = currentEditor;
      this.editorView = atom.views.getView(this.editor);
      this.buffer = this.editor.getBuffer();

      this.editorSubscriptions = new _atom.CompositeDisposable();

      // Subscribe to buffer events:
      this.editorSubscriptions.add(this.buffer.onDidSave(function (e) {
        _this2.bufferSaved(e);
      }));
      if (typeof this.buffer.onDidChangeText === 'function') {
        this.editorSubscriptions.add(this.buffer.onDidChange(this.toggleActivationForBufferChange));
        this.editorSubscriptions.add(this.buffer.onDidChangeText(this.showOrHideSuggestionListForBufferChanges));
      } else {
        // TODO: Remove this after `TextBuffer.prototype.onDidChangeText` lands on Atom stable.
        this.editorSubscriptions.add(this.buffer.onDidChange(this.showOrHideSuggestionListForBufferChange));
      }

      // Watch IME Events To Allow IME To Function Without The Suggestion List Showing
      var compositionStart = function compositionStart() {
        _this2.compositionInProgress = true;
      };
      var compositionEnd = function compositionEnd() {
        _this2.compositionInProgress = false;
      };

      this.editorView.addEventListener('compositionstart', compositionStart);
      this.editorView.addEventListener('compositionend', compositionEnd);
      this.editorSubscriptions.add(new _atom.Disposable(function () {
        if (_this2.editorView) {
          _this2.editorView.removeEventListener('compositionstart', compositionStart);
          _this2.editorView.removeEventListener('compositionend', compositionEnd);
        }
      }));

      // Subscribe to editor events:
      // Close the overlay when the cursor moved without changing any text
      this.editorSubscriptions.add(this.editor.onDidChangeCursorPosition(function (e) {
        _this2.cursorMoved(e);
      }));
      return this.editorSubscriptions.add(this.editor.onDidChangePath(function () {
        _this2.isCurrentFileBlackListedCache = null;
      }));
    }
  }, {
    key: 'editorIsValid',
    value: function editorIsValid(editor) {
      // TODO: remove conditional when `isTextEditor` is shipped.
      if (typeof atom.workspace.isTextEditor === 'function') {
        return atom.workspace.isTextEditor(editor);
      } else {
        if (editor == null) {
          return false;
        }
        // Should we disqualify TextEditors with the Grammar text.plain.null-grammar?
        return editor.getText != null;
      }
    }
  }, {
    key: 'handleEvents',
    value: function handleEvents() {
      var _this3 = this;

      this.subscriptions.add(atom.textEditors.observe(function (editor) {
        var view = atom.views.getView(editor);
        if (view === document.activeElement.closest('atom-text-editor')) {
          _this3.updateCurrentEditor(editor);
        }
        view.addEventListener('focus', function (element) {
          _this3.updateCurrentEditor(editor);
        });
      }));

      // Watch config values
      this.subscriptions.add(atom.config.observe('autosave.enabled', function (value) {
        _this3.autosaveEnabled = value;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.backspaceTriggersAutocomplete', function (value) {
        _this3.backspaceTriggersAutocomplete = value;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.enableAutoActivation', function (value) {
        _this3.autoActivationEnabled = value;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.enableAutoConfirmSingleSuggestion', function (value) {
        _this3.autoConfirmSingleSuggestionEnabled = value;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.consumeSuffix', function (value) {
        _this3.consumeSuffix = value;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.useAlternateScoring', function (value) {
        _this3.useAlternateScoring = value;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.fileBlacklist', function (value) {
        if (value) {
          _this3.fileBlacklist = value.map(function (s) {
            return s.trim();
          });
        }
        _this3.isCurrentFileBlackListedCache = null;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.suppressActivationForEditorClasses', function (value) {
        _this3.suppressForClasses = [];
        for (var i = 0; i < value.length; i++) {
          var selector = value[i];
          var classes = selector.trim().split('.').filter(function (className) {
            return className.trim();
          }).map(function (className) {
            return className.trim();
          });
          if (classes.length) {
            _this3.suppressForClasses.push(classes);
          }
        }
      }));

      // Handle events from suggestion list
      this.subscriptions.add(this.suggestionList.onDidConfirm(function (e) {
        _this3.confirm(e);
      }));
      this.subscriptions.add(this.suggestionList.onDidCancel(this.hideSuggestionList));
    }
  }, {
    key: 'handleCommands',
    value: function handleCommands() {
      var _this4 = this;

      return this.subscriptions.add(atom.commands.add('atom-text-editor', {
        'autocomplete-plus:activate': function autocompletePlusActivate(event) {
          _this4.shouldDisplaySuggestions = true;
          var activatedManually = true;
          if (event.detail && event.detail.activatedManually !== null && typeof event.detail.activatedManually !== 'undefined') {
            activatedManually = event.detail.activatedManually;
          }
          _this4.findSuggestions(activatedManually);
        }
      }));
    }

    // Private: Finds suggestions for the current prefix, sets the list items,
    // positions the overlay and shows it
  }, {
    key: 'findSuggestions',
    value: function findSuggestions(activatedManually) {
      if (this.disposed) {
        return;
      }
      if (this.providerManager == null || this.editor == null || this.buffer == null) {
        return;
      }
      if (this.isCurrentFileBlackListed()) {
        return;
      }
      var cursor = this.editor.getLastCursor();
      if (cursor == null) {
        return;
      }

      var bufferPosition = cursor.getBufferPosition();
      var scopeDescriptor = cursor.getScopeDescriptor();
      var prefix = this.getPrefix(this.editor, bufferPosition);

      return this.getSuggestionsFromProviders({ editor: this.editor, bufferPosition: bufferPosition, scopeDescriptor: scopeDescriptor, prefix: prefix, activatedManually: activatedManually });
    }
  }, {
    key: 'getSuggestionsFromProviders',
    value: function getSuggestionsFromProviders(options) {
      var _this5 = this;

      var suggestionsPromise = undefined;
      var providers = this.providerManager.applicableProviders(options.editor, options.scopeDescriptor);

      var providerPromises = [];
      providers.forEach(function (provider) {
        var apiVersion = _this5.providerManager.apiVersionForProvider(provider);
        var apiIs20 = _semver2['default'].satisfies(apiVersion, '>=2.0.0');

        // TODO API: remove upgrading when 1.0 support is removed
        var getSuggestions = undefined;
        var upgradedOptions = undefined;
        if (apiIs20) {
          getSuggestions = provider.getSuggestions.bind(provider);
          upgradedOptions = options;
        } else {
          getSuggestions = provider.requestHandler.bind(provider);
          upgradedOptions = {
            editor: options.editor,
            prefix: options.prefix,
            bufferPosition: options.bufferPosition,
            position: options.bufferPosition,
            scope: options.scopeDescriptor,
            scopeChain: options.scopeDescriptor.getScopeChain(),
            buffer: options.editor.getBuffer(),
            cursor: options.editor.getLastCursor()
          };
        }

        return providerPromises.push(Promise.resolve(getSuggestions(upgradedOptions)).then(function (providerSuggestions) {
          if (providerSuggestions == null) {
            return;
          }

          // TODO API: remove upgrading when 1.0 support is removed
          var hasDeprecations = false;
          if (apiIs20 && providerSuggestions.length) {
            hasDeprecations = _this5.deprecateForSuggestion(provider, providerSuggestions[0]);
          }

          if (hasDeprecations || !apiIs20) {
            providerSuggestions = providerSuggestions.map(function (suggestion) {
              var newSuggestion = {
                text: suggestion.text != null ? suggestion.text : suggestion.word,
                snippet: suggestion.snippet,
                replacementPrefix: suggestion.replacementPrefix != null ? suggestion.replacementPrefix : suggestion.prefix,
                className: suggestion.className,
                type: suggestion.type
              };
              if (newSuggestion.rightLabelHTML == null && suggestion.renderLabelAsHtml) {
                newSuggestion.rightLabelHTML = suggestion.label;
              }
              if (newSuggestion.rightLabel == null && !suggestion.renderLabelAsHtml) {
                newSuggestion.rightLabel = suggestion.label;
              }
              return newSuggestion;
            });
          }

          var hasEmpty = false; // Optimization: only create another array when there are empty items
          for (var i = 0; i < providerSuggestions.length; i++) {
            var suggestion = providerSuggestions[i];
            if (!suggestion.snippet && !suggestion.text) {
              hasEmpty = true;
            }
            if (suggestion.replacementPrefix == null) {
              suggestion.replacementPrefix = _this5.getDefaultReplacementPrefix(options.prefix);
            }
            suggestion.provider = provider;
          }

          if (hasEmpty) {
            var res = [];
            for (var s of providerSuggestions) {
              if (s.snippet || s.text) {
                res.push(s);
              }
            }
            providerSuggestions = res;
          }

          if (provider.filterSuggestions) {
            providerSuggestions = _this5.filterSuggestions(providerSuggestions, options);
          }
          return providerSuggestions;
        }));
      });

      if (!providerPromises || !providerPromises.length) {
        return;
      }

      suggestionsPromise = Promise.all(providerPromises);
      this.currentSuggestionsPromise = suggestionsPromise;
      return this.currentSuggestionsPromise.then(this.mergeSuggestionsFromProviders).then(function (suggestions) {
        if (_this5.currentSuggestionsPromise !== suggestionsPromise) {
          return;
        }
        if (options.activatedManually && _this5.shouldDisplaySuggestions && _this5.autoConfirmSingleSuggestionEnabled && suggestions.length === 1) {
          // When there is one suggestion in manual mode, just confirm it
          return _this5.confirm(suggestions[0]);
        } else {
          return _this5.displaySuggestions(suggestions, options);
        }
      });
    }
  }, {
    key: 'filterSuggestions',
    value: function filterSuggestions(suggestions, _ref) {
      var prefix = _ref.prefix;

      var results = [];
      var fuzzaldrinProvider = this.useAlternateScoring ? _fuzzaldrinPlus2['default'] : _fuzzaldrin2['default'];
      for (var i = 0; i < suggestions.length; i++) {
        // sortScore mostly preserves in the original sorting. The function is
        // chosen such that suggestions with a very high match score can break out.
        var score = undefined;
        var suggestion = suggestions[i];
        suggestion.sortScore = Math.max(-i / 10 + 3, 0) + 1;
        suggestion.score = null;

        var text = suggestion.snippet || suggestion.text;
        var suggestionPrefix = suggestion.replacementPrefix != null ? suggestion.replacementPrefix : prefix;
        var prefixIsEmpty = !suggestionPrefix || suggestionPrefix === ' ';
        var firstCharIsMatch = !prefixIsEmpty && suggestionPrefix[0].toLowerCase() === text[0].toLowerCase();

        if (prefixIsEmpty) {
          results.push(suggestion);
        }
        if (firstCharIsMatch && (score = fuzzaldrinProvider.score(text, suggestionPrefix)) > 0) {
          suggestion.score = score * suggestion.sortScore;
          results.push(suggestion);
        }
      }

      results.sort(this.reverseSortOnScoreComparator);
      return results;
    }
  }, {
    key: 'reverseSortOnScoreComparator',
    value: function reverseSortOnScoreComparator(a, b) {
      var bscore = b.score;
      if (!bscore) {
        bscore = b.sortScore;
      }
      var ascore = a.score;
      if (!ascore) {
        ascore = b.sortScore;
      }
      return bscore - ascore;
    }

    // providerSuggestions - array of arrays of suggestions provided by all called providers
  }, {
    key: 'mergeSuggestionsFromProviders',
    value: function mergeSuggestionsFromProviders(providerSuggestions) {
      return providerSuggestions.reduce(function (suggestions, providerSuggestions) {
        if (providerSuggestions && providerSuggestions.length) {
          suggestions = suggestions.concat(providerSuggestions);
        }

        return suggestions;
      }, []);
    }
  }, {
    key: 'deprecateForSuggestion',
    value: function deprecateForSuggestion(provider, suggestion) {
      var hasDeprecations = false;
      if (suggestion.word != null) {
        hasDeprecations = true;
        if (typeof grim === 'undefined' || grim === null) {
          grim = require('grim');
        }
        grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nreturns suggestions with a `word` attribute.\nThe `word` attribute is now `text`.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
      }
      if (suggestion.prefix != null) {
        hasDeprecations = true;
        if (typeof grim === 'undefined' || grim === null) {
          grim = require('grim');
        }
        grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nreturns suggestions with a `prefix` attribute.\nThe `prefix` attribute is now `replacementPrefix` and is optional.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
      }
      if (suggestion.label != null) {
        hasDeprecations = true;
        if (typeof grim === 'undefined' || grim === null) {
          grim = require('grim');
        }
        grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nreturns suggestions with a `label` attribute.\nThe `label` attribute is now `rightLabel` or `rightLabelHTML`.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
      }
      if (suggestion.onWillConfirm != null) {
        hasDeprecations = true;
        if (typeof grim === 'undefined' || grim === null) {
          grim = require('grim');
        }
        grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nreturns suggestions with a `onWillConfirm` callback.\nThe `onWillConfirm` callback is no longer supported.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
      }
      if (suggestion.onDidConfirm != null) {
        hasDeprecations = true;
        if (typeof grim === 'undefined' || grim === null) {
          grim = require('grim');
        }
        grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nreturns suggestions with a `onDidConfirm` callback.\nThe `onDidConfirm` callback is now a `onDidInsertSuggestion` callback on the provider itself.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
      }
      return hasDeprecations;
    }
  }, {
    key: 'displaySuggestions',
    value: function displaySuggestions(suggestions, options) {
      suggestions = this.getUniqueSuggestions(suggestions);

      if (this.shouldDisplaySuggestions && suggestions.length) {
        return this.showSuggestionList(suggestions, options);
      } else {
        return this.hideSuggestionList();
      }
    }
  }, {
    key: 'getUniqueSuggestions',
    value: function getUniqueSuggestions(suggestions) {
      var seen = {};
      var result = [];
      for (var i = 0; i < suggestions.length; i++) {
        var suggestion = suggestions[i];
        var val = suggestion.text + suggestion.snippet;
        if (!seen[val]) {
          result.push(suggestion);
          seen[val] = true;
        }
      }
      return result;
    }
  }, {
    key: 'getPrefix',
    value: function getPrefix(editor, bufferPosition) {
      var line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
      var prefix = this.prefixRegex.exec(line);
      if (!prefix || !prefix[2]) {
        return '';
      }
      return prefix[2];
    }
  }, {
    key: 'getDefaultReplacementPrefix',
    value: function getDefaultReplacementPrefix(prefix) {
      if (this.wordPrefixRegex.test(prefix)) {
        return prefix;
      } else {
        return '';
      }
    }

    // Private: Gets called when the user successfully confirms a suggestion
    //
    // match - An {Object} representing the confirmed suggestion
  }, {
    key: 'confirm',
    value: function confirm(suggestion, keystroke) {
      if (this.editor == null || suggestion == null || !!this.disposed) {
        return;
      }

      var apiVersion = this.providerManager.apiVersionForProvider(suggestion.provider);
      var apiIs20 = _semver2['default'].satisfies(apiVersion, '>=2.0.0');
      var triggerPosition = this.editor.getLastCursor().getBufferPosition();

      // TODO API: Remove as this is no longer used
      if (suggestion.onWillConfirm) {
        suggestion.onWillConfirm();
      }

      var selections = this.editor.getSelections();
      if (selections && selections.length) {
        for (var s of selections) {
          if (s && s.clear) {
            s.clear();
          }
        }
      }

      this.hideSuggestionList();

      //this.replaceTextWithMatch(suggestion)

      // TODO API: Remove when we remove the 1.0 API
      if (apiIs20) {
        if (suggestion.provider && suggestion.provider.onDidInsertSuggestion) {
          suggestion.provider.onDidInsertSuggestion({ editor: this.editor, suggestion: suggestion, triggerPosition: triggerPosition });
        }
      } else {
        if (suggestion.onDidConfirm) {
          suggestion.onDidConfirm();
        }
      }
    }
  }, {
    key: 'showSuggestionList',
    value: function showSuggestionList(suggestions, options) {
      if (this.disposed) {
        return;
      }
      this.suggestionList.changeItems(suggestions);
      return this.suggestionList.show(this.editor, options);
    }
  }, {
    key: 'hideSuggestionList',
    value: function hideSuggestionList() {
      if (this.disposed) {
        return;
      }
      this.suggestionList.changeItems(null);
      this.suggestionList.hide();
      this.shouldDisplaySuggestions = false;
    }
  }, {
    key: 'requestHideSuggestionList',
    value: function requestHideSuggestionList(command) {
      this.hideTimeout = setTimeout(this.hideSuggestionList, 0);
      this.shouldDisplaySuggestions = false;
    }
  }, {
    key: 'cancelHideSuggestionListRequest',
    value: function cancelHideSuggestionListRequest() {
      return clearTimeout(this.hideTimeout);
    }

    // Private: Replaces the current prefix with the given match.
    //
    // match - The match to replace the current prefix with
  }, {
    key: 'replaceTextWithMatch',
    value: function replaceTextWithMatch(suggestion) {
      var _this6 = this;

      if (this.editor == null) {
        return;
      }

      var cursors = this.editor.getCursors();
      if (cursors == null) {
        return;
      }

      return this.editor.transact(function () {
        for (var i = 0; i < cursors.length; i++) {
          var cursor = cursors[i];
          var endPosition = cursor.getBufferPosition();
          var beginningPosition = [endPosition.row, endPosition.column - suggestion.replacementPrefix.length];

          if (_this6.editor.getTextInBufferRange([beginningPosition, endPosition]) === suggestion.replacementPrefix) {
            var suffix = _this6.consumeSuffix ? _this6.getSuffix(_this6.editor, endPosition, suggestion) : '';
            if (suffix.length) {
              cursor.moveRight(suffix.length);
            }
            cursor.selection.selectLeft(suggestion.replacementPrefix.length + suffix.length);

            if (suggestion.snippet != null && _this6.snippetsManager != null) {
              _this6.snippetsManager.insertSnippet(suggestion.snippet, _this6.editor, cursor);
            } else {
              cursor.selection.insertText(suggestion.text != null ? suggestion.text : suggestion.snippet, {
                autoIndentNewline: _this6.editor.shouldAutoIndent(),
                autoDecreaseIndent: _this6.editor.shouldAutoIndent()
              });
            }
          }
        }
      });
    }
  }, {
    key: 'getSuffix',
    value: function getSuffix(editor, bufferPosition, suggestion) {
      // This just chews through the suggestion and tries to match the suggestion
      // substring with the lineText starting at the cursor. There is probably a
      // more efficient way to do this.
      var suffix = suggestion.snippet != null ? suggestion.snippet : suggestion.text;
      var endPosition = [bufferPosition.row, bufferPosition.column + suffix.length];
      var endOfLineText = editor.getTextInBufferRange([bufferPosition, endPosition]);
      var nonWordCharacters = new Set(atom.config.get('editor.nonWordCharacters').split(''));
      while (suffix) {
        if (endOfLineText.startsWith(suffix) && !nonWordCharacters.has(suffix[0])) {
          break;
        }
        suffix = suffix.slice(1);
      }
      return suffix;
    }

    // Private: Checks whether the current file is blacklisted.
    //
    // Returns {Boolean} that defines whether the current file is blacklisted
  }, {
    key: 'isCurrentFileBlackListed',
    value: function isCurrentFileBlackListed() {
      // minimatch is slow. Not necessary to do this computation on every request for suggestions
      var left = undefined;
      if (this.isCurrentFileBlackListedCache != null) {
        return this.isCurrentFileBlackListedCache;
      }

      if (this.fileBlacklist == null || this.fileBlacklist.length === 0) {
        this.isCurrentFileBlackListedCache = false;
        return this.isCurrentFileBlackListedCache;
      }

      if (typeof minimatch === 'undefined' || minimatch === null) {
        minimatch = require('minimatch');
      }
      var fileName = _path2['default'].basename((left = this.buffer.getPath()) != null ? left : '');
      for (var i = 0; i < this.fileBlacklist.length; i++) {
        var blacklistGlob = this.fileBlacklist[i];
        if (minimatch(fileName, blacklistGlob)) {
          this.isCurrentFileBlackListedCache = true;
          return this.isCurrentFileBlackListedCache;
        }
      }

      this.isCurrentFileBlackListedCache = false;
      return this.isCurrentFileBlackListedCache;
    }

    // Private: Gets called when the content has been modified
  }, {
    key: 'requestNewSuggestions',
    value: function requestNewSuggestions() {
      var delay = atom.config.get('autocomplete-plus.autoActivationDelay');
      clearTimeout(this.delayTimeout);
      if (this.suggestionList.isActive()) {
        delay = this.suggestionDelay;
      }
      this.delayTimeout = setTimeout(this.findSuggestions, delay);
      this.shouldDisplaySuggestions = true;
    }
  }, {
    key: 'cancelNewSuggestionsRequest',
    value: function cancelNewSuggestionsRequest() {
      clearTimeout(this.delayTimeout);
      this.shouldDisplaySuggestions = false;
    }

    // Private: Gets called when the cursor has moved. Cancels the autocompletion if
    // the text has not been changed.
    //
    // data - An {Object} containing information on why the cursor has been moved
  }, {
    key: 'cursorMoved',
    value: function cursorMoved(_ref2) {
      var textChanged = _ref2.textChanged;

      // The delay is a workaround for the backspace case. The way atom implements
      // backspace is to select left 1 char, then delete. This results in a
      // cursorMoved event with textChanged == false. So we delay, and if the
      // bufferChanged handler decides to show suggestions, it will cancel the
      // hideSuggestionList request. If there is no bufferChanged event,
      // suggestionList will be hidden.
      if (!textChanged && !this.shouldActivate) {
        return this.requestHideSuggestionList();
      }
    }

    // Private: Gets called when the user saves the document. Cancels the
    // autocompletion.
  }, {
    key: 'bufferSaved',
    value: function bufferSaved() {
      if (!this.autosaveEnabled) {
        return this.hideSuggestionList();
      }
    }
  }, {
    key: 'toggleActivationForBufferChange',
    value: function toggleActivationForBufferChange(_ref3) {
      var newText = _ref3.newText;
      var newRange = _ref3.newRange;
      var oldText = _ref3.oldText;
      var oldRange = _ref3.oldRange;

      if (this.disposed) {
        return;
      }
      if (this.shouldActivate) {
        return;
      }
      if (this.compositionInProgress) {
        return this.hideSuggestionList();
      }

      if (this.autoActivationEnabled || this.suggestionList.isActive()) {
        if (newText.length > 0) {
          // Activate on space, a non-whitespace character, or a bracket-matcher pair.
          if (newText === ' ' || newText.trim().length === 1) {
            this.shouldActivate = true;
          }

          if (newText.length === 2) {
            for (var pair of this.bracketMatcherPairs) {
              if (newText === pair) {
                this.shouldActivate = true;
              }
            }
          }
        } else if (oldText.length > 0) {
          // Suggestion list must be either active or backspaceTriggersAutocomplete must be true for activation to occur.
          // Activate on removal of a space, a non-whitespace character, or a bracket-matcher pair.
          if (this.backspaceTriggersAutocomplete || this.suggestionList.isActive()) {
            if (oldText.length > 0 && (this.backspaceTriggersAutocomplete || this.suggestionList.isActive())) {
              if (oldText === ' ' || oldText.trim().length === 1) {
                this.shouldActivate = true;
              }

              if (oldText.length === 2) {
                for (var pair of this.bracketMatcherPairs) {
                  if (oldText === pair) {
                    this.shouldActivate = true;
                  }
                }
              }
            }
          }
        }

        if (this.shouldActivate && this.shouldSuppressActivationForEditorClasses()) {
          this.shouldActivate = false;
        }
      }
    }
  }, {
    key: 'showOrHideSuggestionListForBufferChanges',
    value: function showOrHideSuggestionListForBufferChanges(_ref4) {
      var changes = _ref4.changes;

      var lastCursorPosition = this.editor.getLastCursor().getBufferPosition();
      var changeOccurredNearLastCursor = changes.some(function (_ref5) {
        var start = _ref5.start;
        var newExtent = _ref5.newExtent;

        var newRange = new _atom.Range(start, start.traverse(newExtent));
        return newRange.containsPoint(lastCursorPosition);
      });

      if (this.shouldActivate && changeOccurredNearLastCursor) {
        this.cancelHideSuggestionListRequest();
        this.requestNewSuggestions();
      } else {
        this.cancelNewSuggestionsRequest();
        this.hideSuggestionList();
      }

      this.shouldActivate = false;
    }
  }, {
    key: 'showOrHideSuggestionListForBufferChange',
    value: function showOrHideSuggestionListForBufferChange(_ref6) {
      var newText = _ref6.newText;
      var newRange = _ref6.newRange;
      var oldText = _ref6.oldText;
      var oldRange = _ref6.oldRange;

      if (this.disposed) {
        return;
      }
      if (this.compositionInProgress) {
        return this.hideSuggestionList();
      }
      var shouldActivate = false;
      var cursorPositions = this.editor.getCursorBufferPositions();

      if (this.autoActivationEnabled || this.suggestionList.isActive()) {
        // Activate on space, a non-whitespace character, or a bracket-matcher pair.
        if (newText.length > 0) {
          if (cursorPositions.some(function (position) {
            return newRange.containsPoint(position);
          })) {
            if (newText === ' ' || newText.trim().length === 1) {
              shouldActivate = true;
            }
            if (newText.length === 2) {
              for (var pair of this.bracketMatcherPairs) {
                if (newText === pair) {
                  shouldActivate = true;
                }
              }
            }
          }
          // Suggestion list must be either active or backspaceTriggersAutocomplete must be true for activation to occur.
          // Activate on removal of a space, a non-whitespace character, or a bracket-matcher pair.
        } else if (oldText.length > 0) {
            if ((this.backspaceTriggersAutocomplete || this.suggestionList.isActive()) && cursorPositions.some(function (position) {
              return newRange.containsPoint(position);
            })) {
              if (oldText === ' ' || oldText.trim().length === 1) {
                shouldActivate = true;
              }
              if (oldText.length === 2) {
                for (var pair of this.bracketMatcherPairs) {
                  if (oldText === pair) {
                    shouldActivate = true;
                  }
                }
              }
            }
          }

        if (shouldActivate && this.shouldSuppressActivationForEditorClasses()) {
          shouldActivate = false;
        }
      }

      if (shouldActivate) {
        this.cancelHideSuggestionListRequest();
        this.requestNewSuggestions();
      } else {
        this.cancelNewSuggestionsRequest();
        this.hideSuggestionList();
      }
    }
  }, {
    key: 'shouldSuppressActivationForEditorClasses',
    value: function shouldSuppressActivationForEditorClasses() {
      for (var i = 0; i < this.suppressForClasses.length; i++) {
        var classNames = this.suppressForClasses[i];
        var containsCount = 0;
        for (var j = 0; j < classNames.length; j++) {
          var className = classNames[j];
          if (this.editorView.classList.contains(className)) {
            containsCount += 1;
          }
        }
        if (containsCount === classNames.length) {
          return true;
        }
      }
      return false;
    }

    // Public: Clean up, stop listening to events
  }, {
    key: 'dispose',
    value: function dispose() {
      this.hideSuggestionList();
      this.disposed = true;
      this.ready = false;
      if (this.editorSubscriptions) {
        this.editorSubscriptions.dispose();
      }
      this.editorSubscriptions = null;
      if (this.subscriptions) {
        this.subscriptions.dispose();
      }
      this.subscriptions = null;
      this.suggestionList = null;
      this.providerManager = null;
    }
  }]);

  return AutocompleteManager;
})();

exports['default'] = AutocompleteManager;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvYXV0b2NvbXBsZXRlLW1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztvQkFFdUQsTUFBTTs7b0JBQzVDLE1BQU07Ozs7c0JBQ0osUUFBUTs7OzswQkFDSixZQUFZOzs7OzhCQUNSLGlCQUFpQjs7OzsrQkFFaEIsb0JBQW9COzs7OzhCQUNyQixtQkFBbUI7Ozs7cUNBQ1osMkJBQTJCOzs7OzhCQUM5QixtQkFBbUI7OztBQVhsRCxXQUFXLENBQUE7O0FBY1gsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQTs7SUFFTSxtQkFBbUI7QUFDMUIsV0FETyxtQkFBbUIsR0FDdkI7OzswQkFESSxtQkFBbUI7O0FBRXBDLFFBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFBO0FBQzVCLFFBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUE7QUFDekMsUUFBSSxDQUFDLGtDQUFrQyxHQUFHLElBQUksQ0FBQTtBQUM5QyxRQUFJLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUN2RixRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQTtBQUNsQixRQUFJLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFBO0FBQ2xDLFFBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFBO0FBQ3JCLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO0FBQ2xCLFFBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUE7QUFDL0IsUUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUE7QUFDdEIsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7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VUFBVSxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDM0IsdUJBQWUsR0FBRyxJQUFJLENBQUE7QUFDdEIsWUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtBQUFFLGNBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7U0FBRTtBQUM1RSxZQUFJLENBQUMsU0FBUyw4QkFBMkIsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLFNBQUksUUFBUSxDQUFDLEVBQUUsNkpBSWhGLENBQUE7T0FDRjtBQUNELFVBQUksVUFBVSxDQUFDLE1BQU0sSUFBSSxJQUFJLEVBQUU7QUFDN0IsdUJBQWUsR0FBRyxJQUFJLENBQUE7QUFDdEIsWUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtBQUFFLGNBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7U0FBRTtBQUM1RSxZQUFJLENBQUMsU0FBUyw4QkFBMkIsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLFNBQUksUUFBUSxDQUFDLEVBQUUsOExBSWhGLENBQUE7T0FDRjtBQUNELFVBQUksVUFBVSxDQUFDLEtBQUssSUFBSSxJQUFJLEVBQUU7QUFDNUIsdUJBQWUsR0FBRyxJQUFJLENBQUE7QUFDdEIsWUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtBQUFFLGNBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUE7U0FBRTtBQUM1RSxZQUFJLENBQUMsU0FBUyw4QkFBMkIsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLFNBQUksUUFBUSxDQUFDLEVBQUUseUxBSWhGLENBQUE7T0FDRjtBQUNELFVBQUksVUFBVSxDQUFDLGFBQWEsSUFBSSxJQUFJLEVBQUU7QUFDcEMsdUJBQWUsR0FBRyxJQUFJLENBQUE7QUFDdEIsWUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtBQUFFLGNBQUksR0FB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QyxNQUFNLEVBQUU7QUFBRSxpQkFBTyxJQUFJLENBQUE7U0FBRTtPQUN6RDtBQUNELGFBQU8sS0FBSyxDQUFBO0tBQ2I7Ozs7O1dBR08sbUJBQUc7QUFDVCxVQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtBQUN6QixVQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQTtBQUNwQixVQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtBQUNsQixVQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtBQUM1QixZQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDbkM7QUFDRCxVQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFBO0FBQy9CLFVBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUN0QixZQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO09BQzdCO0FBQ0QsVUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUE7QUFDekIsVUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUE7QUFDMUIsVUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7S0FDNUI7OztTQTl1QmtCLG1CQUFtQjs7O3FCQUFuQixtQkFBbUIiLCJmaWxlIjoiL2hvbWUvamFtZXMvZ2l0aHViL2F1dG9jb21wbGV0ZS1wbHVzL2xpYi9hdXRvY29tcGxldGUtbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCB7IFJhbmdlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcidcbmltcG9ydCBmdXp6YWxkcmluIGZyb20gJ2Z1enphbGRyaW4nXG5pbXBvcnQgZnV6emFsZHJpblBsdXMgZnJvbSAnZnV6emFsZHJpbi1wbHVzJ1xuXG5pbXBvcnQgUHJvdmlkZXJNYW5hZ2VyIGZyb20gJy4vcHJvdmlkZXItbWFuYWdlcidcbmltcG9ydCBTdWdnZXN0aW9uTGlzdCBmcm9tICcuL3N1Z2dlc3Rpb24tbGlzdCdcbmltcG9ydCBTdWdnZXN0aW9uTGlzdEVsZW1lbnQgZnJvbSAnLi9zdWdnZXN0aW9uLWxpc3QtZWxlbWVudCdcbmltcG9ydCB7IFVuaWNvZGVMZXR0ZXJzIH0gZnJvbSAnLi91bmljb2RlLWhlbHBlcnMnXG5cbi8vIERlZmVycmVkIHJlcXVpcmVzXG5sZXQgbWluaW1hdGNoID0gbnVsbFxubGV0IGdyaW0gPSBudWxsXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF1dG9jb21wbGV0ZU1hbmFnZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5hdXRvc2F2ZUVuYWJsZWQgPSBmYWxzZVxuICAgIHRoaXMuYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgPSB0cnVlXG4gICAgdGhpcy5hdXRvQ29uZmlybVNpbmdsZVN1Z2dlc3Rpb25FbmFibGVkID0gdHJ1ZVxuICAgIHRoaXMuYnJhY2tldE1hdGNoZXJQYWlycyA9IFsnKCknLCAnW10nLCAne30nLCAnXCJcIicsIFwiJydcIiwgJ2BgJywgJ+KAnOKAnScsICfigJjigJknLCAnwqvCuycsICfigLnigLonXVxuICAgIHRoaXMuYnVmZmVyID0gbnVsbFxuICAgIHRoaXMuY29tcG9zaXRpb25JblByb2dyZXNzID0gZmFsc2VcbiAgICB0aGlzLmRpc3Bvc2VkID0gZmFsc2VcbiAgICB0aGlzLmVkaXRvciA9IG51bGxcbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgdGhpcy5lZGl0b3JWaWV3ID0gbnVsbFxuICAgIHRoaXMucHJvdmlkZXJNYW5hZ2VyID0gbnVsbFxuICAgIHRoaXMucmVhZHkgPSBmYWxzZVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICB0aGlzLnN1Z2dlc3Rpb25EZWxheSA9IDUwXG4gICAgdGhpcy5zdWdnZXN0aW9uTGlzdCA9IG51bGxcbiAgICB0aGlzLnN1cHByZXNzRm9yQ2xhc3NlcyA9IFtdXG4gICAgdGhpcy5zaG91bGREaXNwbGF5U3VnZ2VzdGlvbnMgPSBmYWxzZVxuICAgIHRoaXMucHJlZml4UmVnZXggPSBudWxsXG4gICAgdGhpcy53b3JkUHJlZml4UmVnZXggPSBudWxsXG4gICAgdGhpcy51cGRhdGVDdXJyZW50RWRpdG9yID0gdGhpcy51cGRhdGVDdXJyZW50RWRpdG9yLmJpbmQodGhpcylcbiAgICB0aGlzLmhhbmRsZUNvbW1hbmRzID0gdGhpcy5oYW5kbGVDb21tYW5kcy5iaW5kKHRoaXMpXG4gICAgdGhpcy5maW5kU3VnZ2VzdGlvbnMgPSB0aGlzLmZpbmRTdWdnZXN0aW9ucy5iaW5kKHRoaXMpXG4gICAgdGhpcy5nZXRTdWdnZXN0aW9uc0Zyb21Qcm92aWRlcnMgPSB0aGlzLmdldFN1Z2dlc3Rpb25zRnJvbVByb3ZpZGVycy5iaW5kKHRoaXMpXG4gICAgdGhpcy5kaXNwbGF5U3VnZ2VzdGlvbnMgPSB0aGlzLmRpc3BsYXlTdWdnZXN0aW9ucy5iaW5kKHRoaXMpXG4gICAgdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QgPSB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdC5iaW5kKHRoaXMpXG5cbiAgICB0aGlzLnRvZ2dsZUFjdGl2YXRpb25Gb3JCdWZmZXJDaGFuZ2UgPSB0aGlzLnRvZ2dsZUFjdGl2YXRpb25Gb3JCdWZmZXJDaGFuZ2UuYmluZCh0aGlzKVxuICAgIHRoaXMuc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlcyA9IHRoaXMuc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlcy5iaW5kKHRoaXMpXG4gICAgdGhpcy5zaG93T3JIaWRlU3VnZ2VzdGlvbkxpc3RGb3JCdWZmZXJDaGFuZ2UgPSB0aGlzLnNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIHRoaXMucHJvdmlkZXJNYW5hZ2VyID0gbmV3IFByb3ZpZGVyTWFuYWdlcigpXG4gICAgdGhpcy5zdWdnZXN0aW9uTGlzdCA9IG5ldyBTdWdnZXN0aW9uTGlzdCgpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmVuYWJsZUV4dGVuZGVkVW5pY29kZVN1cHBvcnQnLCBlbmFibGVFeHRlbmRlZFVuaWNvZGVTdXBwb3J0ID0+IHtcbiAgICAgIGlmIChlbmFibGVFeHRlbmRlZFVuaWNvZGVTdXBwb3J0KSB7XG4gICAgICAgIHRoaXMucHJlZml4UmVnZXggPSBuZXcgUmVnRXhwKGAoWydcIn5cXGAhQCNcXFxcJCVeJipcXFxcKFxcXFwpXFxcXHtcXFxcfVxcXFxbXFxcXF09KywvXFxcXD8+XSk/KChbJHtVbmljb2RlTGV0dGVyc31cXFxcZF9dK1ske1VuaWNvZGVMZXR0ZXJzfVxcXFxkXy1dKil8KFsuOjtbeyg8IF0rKSkkYClcbiAgICAgICAgdGhpcy53b3JkUHJlZml4UmVnZXggPSBuZXcgUmVnRXhwKGBeWyR7VW5pY29kZUxldHRlcnN9XFxcXGRfXStbJHtVbmljb2RlTGV0dGVyc31cXFxcZF8tXSokYClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucHJlZml4UmVnZXggPSAvKFxcYnxbJ1wifmAhQCNcXCQlXiYqXFwoXFwpXFx7XFx9XFxbXFxdPVxcKywvXFw/Pl0pKChcXHcrW1xcdy1dKil8KFsuOjtbeyg8IF0rKSkkL1xuICAgICAgICB0aGlzLndvcmRQcmVmaXhSZWdleCA9IC9eXFx3K1tcXHctXSokL1xuICAgICAgfVxuICAgIH1cbiAgICApKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5wcm92aWRlck1hbmFnZXIpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLnZpZXdzLmFkZFZpZXdQcm92aWRlcihTdWdnZXN0aW9uTGlzdCwgKG1vZGVsKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFN1Z2dlc3Rpb25MaXN0RWxlbWVudCgpLmluaXRpYWxpemUobW9kZWwpXG4gICAgfSkpXG5cbiAgICB0aGlzLmhhbmRsZUV2ZW50cygpXG4gICAgdGhpcy5oYW5kbGVDb21tYW5kcygpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLnN1Z2dlc3Rpb25MaXN0KSAvLyBXZSdyZSBhZGRpbmcgdGhpcyBsYXN0IHNvIGl0IGlzIGRpc3Bvc2VkIGFmdGVyIGV2ZW50c1xuICAgIHRoaXMucmVhZHkgPSB0cnVlXG4gIH1cblxuICBzZXRTbmlwcGV0c01hbmFnZXIgKHNuaXBwZXRzTWFuYWdlcikge1xuICAgIHRoaXMuc25pcHBldHNNYW5hZ2VyID0gc25pcHBldHNNYW5hZ2VyXG4gIH1cblxuICB1cGRhdGVDdXJyZW50RWRpdG9yIChjdXJyZW50RWRpdG9yKSB7XG4gICAgaWYgKChjdXJyZW50RWRpdG9yID09IG51bGwpIHx8IGN1cnJlbnRFZGl0b3IgPT09IHRoaXMuZWRpdG9yKSB7IHJldHVybiB9XG4gICAgaWYgKHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMgPSBudWxsXG5cbiAgICAvLyBTdG9wIHRyYWNraW5nIGVkaXRvciArIGJ1ZmZlclxuICAgIHRoaXMuZWRpdG9yID0gbnVsbFxuICAgIHRoaXMuZWRpdG9yVmlldyA9IG51bGxcbiAgICB0aGlzLmJ1ZmZlciA9IG51bGxcbiAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gbnVsbFxuXG4gICAgaWYgKCF0aGlzLmVkaXRvcklzVmFsaWQoY3VycmVudEVkaXRvcikpIHsgcmV0dXJuIH1cblxuICAgIC8vIFRyYWNrIHRoZSBuZXcgZWRpdG9yLCBlZGl0b3JWaWV3LCBhbmQgYnVmZmVyXG4gICAgdGhpcy5lZGl0b3IgPSBjdXJyZW50RWRpdG9yXG4gICAgdGhpcy5lZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMuZWRpdG9yKVxuICAgIHRoaXMuYnVmZmVyID0gdGhpcy5lZGl0b3IuZ2V0QnVmZmVyKClcblxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIC8vIFN1YnNjcmliZSB0byBidWZmZXIgZXZlbnRzOlxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5idWZmZXIub25EaWRTYXZlKChlKSA9PiB7IHRoaXMuYnVmZmVyU2F2ZWQoZSkgfSkpXG4gICAgaWYgKHR5cGVvZiB0aGlzLmJ1ZmZlci5vbkRpZENoYW5nZVRleHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5idWZmZXIub25EaWRDaGFuZ2UodGhpcy50b2dnbGVBY3RpdmF0aW9uRm9yQnVmZmVyQ2hhbmdlKSlcbiAgICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5idWZmZXIub25EaWRDaGFuZ2VUZXh0KHRoaXMuc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlcykpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IFJlbW92ZSB0aGlzIGFmdGVyIGBUZXh0QnVmZmVyLnByb3RvdHlwZS5vbkRpZENoYW5nZVRleHRgIGxhbmRzIG9uIEF0b20gc3RhYmxlLlxuICAgICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmJ1ZmZlci5vbkRpZENoYW5nZSh0aGlzLnNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZSkpXG4gICAgfVxuXG4gICAgLy8gV2F0Y2ggSU1FIEV2ZW50cyBUbyBBbGxvdyBJTUUgVG8gRnVuY3Rpb24gV2l0aG91dCBUaGUgU3VnZ2VzdGlvbiBMaXN0IFNob3dpbmdcbiAgICBjb25zdCBjb21wb3NpdGlvblN0YXJ0ID0gKCkgPT4ge1xuICAgICAgdGhpcy5jb21wb3NpdGlvbkluUHJvZ3Jlc3MgPSB0cnVlXG4gICAgfVxuICAgIGNvbnN0IGNvbXBvc2l0aW9uRW5kID0gKCkgPT4ge1xuICAgICAgdGhpcy5jb21wb3NpdGlvbkluUHJvZ3Jlc3MgPSBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMuZWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdjb21wb3NpdGlvbnN0YXJ0JywgY29tcG9zaXRpb25TdGFydClcbiAgICB0aGlzLmVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcignY29tcG9zaXRpb25lbmQnLCBjb21wb3NpdGlvbkVuZClcbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmVkaXRvclZpZXcpIHtcbiAgICAgICAgdGhpcy5lZGl0b3JWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NvbXBvc2l0aW9uc3RhcnQnLCBjb21wb3NpdGlvblN0YXJ0KVxuICAgICAgICB0aGlzLmVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcignY29tcG9zaXRpb25lbmQnLCBjb21wb3NpdGlvbkVuZClcbiAgICAgIH1cbiAgICB9KSlcblxuICAgIC8vIFN1YnNjcmliZSB0byBlZGl0b3IgZXZlbnRzOlxuICAgIC8vIENsb3NlIHRoZSBvdmVybGF5IHdoZW4gdGhlIGN1cnNvciBtb3ZlZCB3aXRob3V0IGNoYW5naW5nIGFueSB0ZXh0XG4gICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKChlKSA9PiB7IHRoaXMuY3Vyc29yTW92ZWQoZSkgfSkpXG4gICAgcmV0dXJuIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lZGl0b3Iub25EaWRDaGFuZ2VQYXRoKCgpID0+IHtcbiAgICAgIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgPSBudWxsXG4gICAgfSkpXG4gIH1cblxuICBlZGl0b3JJc1ZhbGlkIChlZGl0b3IpIHtcbiAgICAvLyBUT0RPOiByZW1vdmUgY29uZGl0aW9uYWwgd2hlbiBgaXNUZXh0RWRpdG9yYCBpcyBzaGlwcGVkLlxuICAgIGlmICh0eXBlb2YgYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yKGVkaXRvcilcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVkaXRvciA9PSBudWxsKSB7IHJldHVybiBmYWxzZSB9XG4gICAgICAvLyBTaG91bGQgd2UgZGlzcXVhbGlmeSBUZXh0RWRpdG9ycyB3aXRoIHRoZSBHcmFtbWFyIHRleHQucGxhaW4ubnVsbC1ncmFtbWFyP1xuICAgICAgcmV0dXJuIChlZGl0b3IuZ2V0VGV4dCAhPSBudWxsKVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUV2ZW50cyAoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLnRleHRFZGl0b3JzLm9ic2VydmUoKGVkaXRvcikgPT4ge1xuICAgICAgY29uc3QgdmlldyA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpXG4gICAgICBpZiAodmlldyA9PT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5jbG9zZXN0KCdhdG9tLXRleHQtZWRpdG9yJykpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50RWRpdG9yKGVkaXRvcilcbiAgICAgIH1cbiAgICAgIHZpZXcuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCAoZWxlbWVudCkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZUN1cnJlbnRFZGl0b3IoZWRpdG9yKVxuICAgICAgfSlcbiAgICB9KSlcblxuICAgIC8vIFdhdGNoIGNvbmZpZyB2YWx1ZXNcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9zYXZlLmVuYWJsZWQnLCAodmFsdWUpID0+IHsgdGhpcy5hdXRvc2F2ZUVuYWJsZWQgPSB2YWx1ZSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlJywgKHZhbHVlKSA9PiB7IHRoaXMuYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgPSB2YWx1ZSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmVuYWJsZUF1dG9BY3RpdmF0aW9uJywgKHZhbHVlKSA9PiB7IHRoaXMuYXV0b0FjdGl2YXRpb25FbmFibGVkID0gdmFsdWUgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5lbmFibGVBdXRvQ29uZmlybVNpbmdsZVN1Z2dlc3Rpb24nLCAodmFsdWUpID0+IHsgdGhpcy5hdXRvQ29uZmlybVNpbmdsZVN1Z2dlc3Rpb25FbmFibGVkID0gdmFsdWUgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5jb25zdW1lU3VmZml4JywgKHZhbHVlKSA9PiB7IHRoaXMuY29uc3VtZVN1ZmZpeCA9IHZhbHVlIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMudXNlQWx0ZXJuYXRlU2NvcmluZycsICh2YWx1ZSkgPT4geyB0aGlzLnVzZUFsdGVybmF0ZVNjb3JpbmcgPSB2YWx1ZSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmZpbGVCbGFja2xpc3QnLCAodmFsdWUpID0+IHtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmZpbGVCbGFja2xpc3QgPSB2YWx1ZS5tYXAoKHMpID0+IHsgcmV0dXJuIHMudHJpbSgpIH0pXG4gICAgICB9XG4gICAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gbnVsbFxuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuc3VwcHJlc3NBY3RpdmF0aW9uRm9yRWRpdG9yQ2xhc3NlcycsIHZhbHVlID0+IHtcbiAgICAgIHRoaXMuc3VwcHJlc3NGb3JDbGFzc2VzID0gW11cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSB2YWx1ZVtpXVxuICAgICAgICBjb25zdCBjbGFzc2VzID0gKHNlbGVjdG9yLnRyaW0oKS5zcGxpdCgnLicpLmZpbHRlcigoY2xhc3NOYW1lKSA9PiBjbGFzc05hbWUudHJpbSgpKS5tYXAoKGNsYXNzTmFtZSkgPT4gY2xhc3NOYW1lLnRyaW0oKSkpXG4gICAgICAgIGlmIChjbGFzc2VzLmxlbmd0aCkgeyB0aGlzLnN1cHByZXNzRm9yQ2xhc3Nlcy5wdXNoKGNsYXNzZXMpIH1cbiAgICAgIH1cbiAgICB9KSlcblxuICAgIC8vIEhhbmRsZSBldmVudHMgZnJvbSBzdWdnZXN0aW9uIGxpc3RcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuc3VnZ2VzdGlvbkxpc3Qub25EaWRDb25maXJtKChlKSA9PiB7IHRoaXMuY29uZmlybShlKSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuc3VnZ2VzdGlvbkxpc3Qub25EaWRDYW5jZWwodGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QpKVxuICB9XG5cbiAgaGFuZGxlQ29tbWFuZHMgKCkge1xuICAgIHJldHVybiB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywge1xuICAgICAgJ2F1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlJzogKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zID0gdHJ1ZVxuICAgICAgICBsZXQgYWN0aXZhdGVkTWFudWFsbHkgPSB0cnVlXG4gICAgICAgIGlmIChldmVudC5kZXRhaWwgJiYgZXZlbnQuZGV0YWlsLmFjdGl2YXRlZE1hbnVhbGx5ICE9PSBudWxsICYmIHR5cGVvZiBldmVudC5kZXRhaWwuYWN0aXZhdGVkTWFudWFsbHkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgYWN0aXZhdGVkTWFudWFsbHkgPSBldmVudC5kZXRhaWwuYWN0aXZhdGVkTWFudWFsbHlcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpbmRTdWdnZXN0aW9ucyhhY3RpdmF0ZWRNYW51YWxseSlcbiAgICAgIH1cbiAgICB9KSlcbiAgfVxuXG4gIC8vIFByaXZhdGU6IEZpbmRzIHN1Z2dlc3Rpb25zIGZvciB0aGUgY3VycmVudCBwcmVmaXgsIHNldHMgdGhlIGxpc3QgaXRlbXMsXG4gIC8vIHBvc2l0aW9ucyB0aGUgb3ZlcmxheSBhbmQgc2hvd3MgaXRcbiAgZmluZFN1Z2dlc3Rpb25zIChhY3RpdmF0ZWRNYW51YWxseSkge1xuICAgIGlmICh0aGlzLmRpc3Bvc2VkKSB7IHJldHVybiB9XG4gICAgaWYgKCh0aGlzLnByb3ZpZGVyTWFuYWdlciA9PSBudWxsKSB8fCAodGhpcy5lZGl0b3IgPT0gbnVsbCkgfHwgKHRoaXMuYnVmZmVyID09IG51bGwpKSB7IHJldHVybiB9XG4gICAgaWYgKHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkKCkpIHsgcmV0dXJuIH1cbiAgICBjb25zdCBjdXJzb3IgPSB0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKClcbiAgICBpZiAoY3Vyc29yID09IG51bGwpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IGJ1ZmZlclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBjb25zdCBzY29wZURlc2NyaXB0b3IgPSBjdXJzb3IuZ2V0U2NvcGVEZXNjcmlwdG9yKClcbiAgICBjb25zdCBwcmVmaXggPSB0aGlzLmdldFByZWZpeCh0aGlzLmVkaXRvciwgYnVmZmVyUG9zaXRpb24pXG5cbiAgICByZXR1cm4gdGhpcy5nZXRTdWdnZXN0aW9uc0Zyb21Qcm92aWRlcnMoe2VkaXRvcjogdGhpcy5lZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBzY29wZURlc2NyaXB0b3IsIHByZWZpeCwgYWN0aXZhdGVkTWFudWFsbHl9KVxuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnNGcm9tUHJvdmlkZXJzIChvcHRpb25zKSB7XG4gICAgbGV0IHN1Z2dlc3Rpb25zUHJvbWlzZVxuICAgIGNvbnN0IHByb3ZpZGVycyA9IHRoaXMucHJvdmlkZXJNYW5hZ2VyLmFwcGxpY2FibGVQcm92aWRlcnMob3B0aW9ucy5lZGl0b3IsIG9wdGlvbnMuc2NvcGVEZXNjcmlwdG9yKVxuXG4gICAgY29uc3QgcHJvdmlkZXJQcm9taXNlcyA9IFtdXG4gICAgcHJvdmlkZXJzLmZvckVhY2gocHJvdmlkZXIgPT4ge1xuICAgICAgY29uc3QgYXBpVmVyc2lvbiA9IHRoaXMucHJvdmlkZXJNYW5hZ2VyLmFwaVZlcnNpb25Gb3JQcm92aWRlcihwcm92aWRlcilcbiAgICAgIGNvbnN0IGFwaUlzMjAgPSBzZW12ZXIuc2F0aXNmaWVzKGFwaVZlcnNpb24sICc+PTIuMC4wJylcblxuICAgICAgLy8gVE9ETyBBUEk6IHJlbW92ZSB1cGdyYWRpbmcgd2hlbiAxLjAgc3VwcG9ydCBpcyByZW1vdmVkXG4gICAgICBsZXQgZ2V0U3VnZ2VzdGlvbnNcbiAgICAgIGxldCB1cGdyYWRlZE9wdGlvbnNcbiAgICAgIGlmIChhcGlJczIwKSB7XG4gICAgICAgIGdldFN1Z2dlc3Rpb25zID0gcHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbnMuYmluZChwcm92aWRlcilcbiAgICAgICAgdXBncmFkZWRPcHRpb25zID0gb3B0aW9uc1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0U3VnZ2VzdGlvbnMgPSBwcm92aWRlci5yZXF1ZXN0SGFuZGxlci5iaW5kKHByb3ZpZGVyKVxuICAgICAgICB1cGdyYWRlZE9wdGlvbnMgPSB7XG4gICAgICAgICAgZWRpdG9yOiBvcHRpb25zLmVkaXRvcixcbiAgICAgICAgICBwcmVmaXg6IG9wdGlvbnMucHJlZml4LFxuICAgICAgICAgIGJ1ZmZlclBvc2l0aW9uOiBvcHRpb25zLmJ1ZmZlclBvc2l0aW9uLFxuICAgICAgICAgIHBvc2l0aW9uOiBvcHRpb25zLmJ1ZmZlclBvc2l0aW9uLFxuICAgICAgICAgIHNjb3BlOiBvcHRpb25zLnNjb3BlRGVzY3JpcHRvcixcbiAgICAgICAgICBzY29wZUNoYWluOiBvcHRpb25zLnNjb3BlRGVzY3JpcHRvci5nZXRTY29wZUNoYWluKCksXG4gICAgICAgICAgYnVmZmVyOiBvcHRpb25zLmVkaXRvci5nZXRCdWZmZXIoKSxcbiAgICAgICAgICBjdXJzb3I6IG9wdGlvbnMuZWRpdG9yLmdldExhc3RDdXJzb3IoKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcm92aWRlclByb21pc2VzLnB1c2goUHJvbWlzZS5yZXNvbHZlKGdldFN1Z2dlc3Rpb25zKHVwZ3JhZGVkT3B0aW9ucykpLnRoZW4ocHJvdmlkZXJTdWdnZXN0aW9ucyA9PiB7XG4gICAgICAgIGlmIChwcm92aWRlclN1Z2dlc3Rpb25zID09IG51bGwpIHsgcmV0dXJuIH1cblxuICAgICAgICAvLyBUT0RPIEFQSTogcmVtb3ZlIHVwZ3JhZGluZyB3aGVuIDEuMCBzdXBwb3J0IGlzIHJlbW92ZWRcbiAgICAgICAgbGV0IGhhc0RlcHJlY2F0aW9ucyA9IGZhbHNlXG4gICAgICAgIGlmIChhcGlJczIwICYmIHByb3ZpZGVyU3VnZ2VzdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgaGFzRGVwcmVjYXRpb25zID0gdGhpcy5kZXByZWNhdGVGb3JTdWdnZXN0aW9uKHByb3ZpZGVyLCBwcm92aWRlclN1Z2dlc3Rpb25zWzBdKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc0RlcHJlY2F0aW9ucyB8fCAhYXBpSXMyMCkge1xuICAgICAgICAgIHByb3ZpZGVyU3VnZ2VzdGlvbnMgPSBwcm92aWRlclN1Z2dlc3Rpb25zLm1hcCgoc3VnZ2VzdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV3U3VnZ2VzdGlvbiA9IHtcbiAgICAgICAgICAgICAgdGV4dDogc3VnZ2VzdGlvbi50ZXh0ICE9IG51bGwgPyBzdWdnZXN0aW9uLnRleHQgOiBzdWdnZXN0aW9uLndvcmQsXG4gICAgICAgICAgICAgIHNuaXBwZXQ6IHN1Z2dlc3Rpb24uc25pcHBldCxcbiAgICAgICAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXg6IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggIT0gbnVsbCA/IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggOiBzdWdnZXN0aW9uLnByZWZpeCxcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiBzdWdnZXN0aW9uLmNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgdHlwZTogc3VnZ2VzdGlvbi50eXBlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKG5ld1N1Z2dlc3Rpb24ucmlnaHRMYWJlbEhUTUwgPT0gbnVsbCkgJiYgc3VnZ2VzdGlvbi5yZW5kZXJMYWJlbEFzSHRtbCkgeyBuZXdTdWdnZXN0aW9uLnJpZ2h0TGFiZWxIVE1MID0gc3VnZ2VzdGlvbi5sYWJlbCB9XG4gICAgICAgICAgICBpZiAoKG5ld1N1Z2dlc3Rpb24ucmlnaHRMYWJlbCA9PSBudWxsKSAmJiAhc3VnZ2VzdGlvbi5yZW5kZXJMYWJlbEFzSHRtbCkgeyBuZXdTdWdnZXN0aW9uLnJpZ2h0TGFiZWwgPSBzdWdnZXN0aW9uLmxhYmVsIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdTdWdnZXN0aW9uXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBoYXNFbXB0eSA9IGZhbHNlIC8vIE9wdGltaXphdGlvbjogb25seSBjcmVhdGUgYW5vdGhlciBhcnJheSB3aGVuIHRoZXJlIGFyZSBlbXB0eSBpdGVtc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVyU3VnZ2VzdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBzdWdnZXN0aW9uID0gcHJvdmlkZXJTdWdnZXN0aW9uc1tpXVxuICAgICAgICAgIGlmICghc3VnZ2VzdGlvbi5zbmlwcGV0ICYmICFzdWdnZXN0aW9uLnRleHQpIHsgaGFzRW1wdHkgPSB0cnVlIH1cbiAgICAgICAgICBpZiAoc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeCA9PSBudWxsKSB7IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggPSB0aGlzLmdldERlZmF1bHRSZXBsYWNlbWVudFByZWZpeChvcHRpb25zLnByZWZpeCkgfVxuICAgICAgICAgIHN1Z2dlc3Rpb24ucHJvdmlkZXIgPSBwcm92aWRlclxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc0VtcHR5KSB7XG4gICAgICAgICAgY29uc3QgcmVzID0gW11cbiAgICAgICAgICBmb3IgKGNvbnN0IHMgb2YgcHJvdmlkZXJTdWdnZXN0aW9ucykge1xuICAgICAgICAgICAgaWYgKHMuc25pcHBldCB8fCBzLnRleHQpIHtcbiAgICAgICAgICAgICAgcmVzLnB1c2gocylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvdmlkZXJTdWdnZXN0aW9ucyA9IHJlc1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb3ZpZGVyLmZpbHRlclN1Z2dlc3Rpb25zKSB7XG4gICAgICAgICAgcHJvdmlkZXJTdWdnZXN0aW9ucyA9IHRoaXMuZmlsdGVyU3VnZ2VzdGlvbnMocHJvdmlkZXJTdWdnZXN0aW9ucywgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvdmlkZXJTdWdnZXN0aW9uc1xuICAgICAgfSkpXG4gICAgfSlcblxuICAgIGlmICghcHJvdmlkZXJQcm9taXNlcyB8fCAhcHJvdmlkZXJQcm9taXNlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHN1Z2dlc3Rpb25zUHJvbWlzZSA9IFByb21pc2UuYWxsKHByb3ZpZGVyUHJvbWlzZXMpXG4gICAgdGhpcy5jdXJyZW50U3VnZ2VzdGlvbnNQcm9taXNlID0gc3VnZ2VzdGlvbnNQcm9taXNlXG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFN1Z2dlc3Rpb25zUHJvbWlzZVxuICAgICAgLnRoZW4odGhpcy5tZXJnZVN1Z2dlc3Rpb25zRnJvbVByb3ZpZGVycylcbiAgICAgIC50aGVuKHN1Z2dlc3Rpb25zID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFN1Z2dlc3Rpb25zUHJvbWlzZSAhPT0gc3VnZ2VzdGlvbnNQcm9taXNlKSB7IHJldHVybiB9XG4gICAgICAgIGlmIChvcHRpb25zLmFjdGl2YXRlZE1hbnVhbGx5ICYmIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zICYmIHRoaXMuYXV0b0NvbmZpcm1TaW5nbGVTdWdnZXN0aW9uRW5hYmxlZCAmJiBzdWdnZXN0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAvLyBXaGVuIHRoZXJlIGlzIG9uZSBzdWdnZXN0aW9uIGluIG1hbnVhbCBtb2RlLCBqdXN0IGNvbmZpcm0gaXRcbiAgICAgICAgICByZXR1cm4gdGhpcy5jb25maXJtKHN1Z2dlc3Rpb25zWzBdKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlTdWdnZXN0aW9ucyhzdWdnZXN0aW9ucywgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIGZpbHRlclN1Z2dlc3Rpb25zIChzdWdnZXN0aW9ucywge3ByZWZpeH0pIHtcbiAgICBjb25zdCByZXN1bHRzID0gW11cbiAgICBjb25zdCBmdXp6YWxkcmluUHJvdmlkZXIgPSB0aGlzLnVzZUFsdGVybmF0ZVNjb3JpbmcgPyBmdXp6YWxkcmluUGx1cyA6IGZ1enphbGRyaW5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1Z2dlc3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBzb3J0U2NvcmUgbW9zdGx5IHByZXNlcnZlcyBpbiB0aGUgb3JpZ2luYWwgc29ydGluZy4gVGhlIGZ1bmN0aW9uIGlzXG4gICAgICAvLyBjaG9zZW4gc3VjaCB0aGF0IHN1Z2dlc3Rpb25zIHdpdGggYSB2ZXJ5IGhpZ2ggbWF0Y2ggc2NvcmUgY2FuIGJyZWFrIG91dC5cbiAgICAgIGxldCBzY29yZVxuICAgICAgY29uc3Qgc3VnZ2VzdGlvbiA9IHN1Z2dlc3Rpb25zW2ldXG4gICAgICBzdWdnZXN0aW9uLnNvcnRTY29yZSA9IE1hdGgubWF4KCgtaSAvIDEwKSArIDMsIDApICsgMVxuICAgICAgc3VnZ2VzdGlvbi5zY29yZSA9IG51bGxcblxuICAgICAgY29uc3QgdGV4dCA9IChzdWdnZXN0aW9uLnNuaXBwZXQgfHwgc3VnZ2VzdGlvbi50ZXh0KVxuICAgICAgY29uc3Qgc3VnZ2VzdGlvblByZWZpeCA9IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggIT0gbnVsbCA/IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggOiBwcmVmaXhcbiAgICAgIGNvbnN0IHByZWZpeElzRW1wdHkgPSAhc3VnZ2VzdGlvblByZWZpeCB8fCBzdWdnZXN0aW9uUHJlZml4ID09PSAnICdcbiAgICAgIGNvbnN0IGZpcnN0Q2hhcklzTWF0Y2ggPSAhcHJlZml4SXNFbXB0eSAmJiBzdWdnZXN0aW9uUHJlZml4WzBdLnRvTG93ZXJDYXNlKCkgPT09IHRleHRbMF0udG9Mb3dlckNhc2UoKVxuXG4gICAgICBpZiAocHJlZml4SXNFbXB0eSkge1xuICAgICAgICByZXN1bHRzLnB1c2goc3VnZ2VzdGlvbilcbiAgICAgIH1cbiAgICAgIGlmIChmaXJzdENoYXJJc01hdGNoICYmIChzY29yZSA9IGZ1enphbGRyaW5Qcm92aWRlci5zY29yZSh0ZXh0LCBzdWdnZXN0aW9uUHJlZml4KSkgPiAwKSB7XG4gICAgICAgIHN1Z2dlc3Rpb24uc2NvcmUgPSBzY29yZSAqIHN1Z2dlc3Rpb24uc29ydFNjb3JlXG4gICAgICAgIHJlc3VsdHMucHVzaChzdWdnZXN0aW9uKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJlc3VsdHMuc29ydCh0aGlzLnJldmVyc2VTb3J0T25TY29yZUNvbXBhcmF0b3IpXG4gICAgcmV0dXJuIHJlc3VsdHNcbiAgfVxuXG4gIHJldmVyc2VTb3J0T25TY29yZUNvbXBhcmF0b3IgKGEsIGIpIHtcbiAgICBsZXQgYnNjb3JlID0gYi5zY29yZVxuICAgIGlmICghYnNjb3JlKSB7XG4gICAgICBic2NvcmUgPSBiLnNvcnRTY29yZVxuICAgIH1cbiAgICBsZXQgYXNjb3JlID0gYS5zY29yZVxuICAgIGlmICghYXNjb3JlKSB7XG4gICAgICBhc2NvcmUgPSBiLnNvcnRTY29yZVxuICAgIH1cbiAgICByZXR1cm4gYnNjb3JlIC0gYXNjb3JlXG4gIH1cblxuICAvLyBwcm92aWRlclN1Z2dlc3Rpb25zIC0gYXJyYXkgb2YgYXJyYXlzIG9mIHN1Z2dlc3Rpb25zIHByb3ZpZGVkIGJ5IGFsbCBjYWxsZWQgcHJvdmlkZXJzXG4gIG1lcmdlU3VnZ2VzdGlvbnNGcm9tUHJvdmlkZXJzIChwcm92aWRlclN1Z2dlc3Rpb25zKSB7XG4gICAgcmV0dXJuIHByb3ZpZGVyU3VnZ2VzdGlvbnMucmVkdWNlKChzdWdnZXN0aW9ucywgcHJvdmlkZXJTdWdnZXN0aW9ucykgPT4ge1xuICAgICAgaWYgKHByb3ZpZGVyU3VnZ2VzdGlvbnMgJiYgcHJvdmlkZXJTdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgc3VnZ2VzdGlvbnMgPSBzdWdnZXN0aW9ucy5jb25jYXQocHJvdmlkZXJTdWdnZXN0aW9ucylcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN1Z2dlc3Rpb25zXG4gICAgfSwgW10pXG4gIH1cblxuICBkZXByZWNhdGVGb3JTdWdnZXN0aW9uIChwcm92aWRlciwgc3VnZ2VzdGlvbikge1xuICAgIGxldCBoYXNEZXByZWNhdGlvbnMgPSBmYWxzZVxuICAgIGlmIChzdWdnZXN0aW9uLndvcmQgIT0gbnVsbCkge1xuICAgICAgaGFzRGVwcmVjYXRpb25zID0gdHJ1ZVxuICAgICAgaWYgKHR5cGVvZiBncmltID09PSAndW5kZWZpbmVkJyB8fCBncmltID09PSBudWxsKSB7IGdyaW0gPSByZXF1aXJlKCdncmltJykgfVxuICAgICAgZ3JpbS5kZXByZWNhdGUoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5yZXR1cm5zIHN1Z2dlc3Rpb25zIHdpdGggYSBcXGB3b3JkXFxgIGF0dHJpYnV0ZS5cblRoZSBcXGB3b3JkXFxgIGF0dHJpYnV0ZSBpcyBub3cgXFxgdGV4dFxcYC5cblNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtcGx1cy93aWtpL1Byb3ZpZGVyLUFQSWBcbiAgICAgIClcbiAgICB9XG4gICAgaWYgKHN1Z2dlc3Rpb24ucHJlZml4ICE9IG51bGwpIHtcbiAgICAgIGhhc0RlcHJlY2F0aW9ucyA9IHRydWVcbiAgICAgIGlmICh0eXBlb2YgZ3JpbSA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JpbSA9PT0gbnVsbCkgeyBncmltID0gcmVxdWlyZSgnZ3JpbScpIH1cbiAgICAgIGdyaW0uZGVwcmVjYXRlKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xucmV0dXJucyBzdWdnZXN0aW9ucyB3aXRoIGEgXFxgcHJlZml4XFxgIGF0dHJpYnV0ZS5cblRoZSBcXGBwcmVmaXhcXGAgYXR0cmlidXRlIGlzIG5vdyBcXGByZXBsYWNlbWVudFByZWZpeFxcYCBhbmQgaXMgb3B0aW9uYWwuXG5TZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXV0b2NvbXBsZXRlLXBsdXMvd2lraS9Qcm92aWRlci1BUElgXG4gICAgICApXG4gICAgfVxuICAgIGlmIChzdWdnZXN0aW9uLmxhYmVsICE9IG51bGwpIHtcbiAgICAgIGhhc0RlcHJlY2F0aW9ucyA9IHRydWVcbiAgICAgIGlmICh0eXBlb2YgZ3JpbSA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JpbSA9PT0gbnVsbCkgeyBncmltID0gcmVxdWlyZSgnZ3JpbScpIH1cbiAgICAgIGdyaW0uZGVwcmVjYXRlKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xucmV0dXJucyBzdWdnZXN0aW9ucyB3aXRoIGEgXFxgbGFiZWxcXGAgYXR0cmlidXRlLlxuVGhlIFxcYGxhYmVsXFxgIGF0dHJpYnV0ZSBpcyBub3cgXFxgcmlnaHRMYWJlbFxcYCBvciBcXGByaWdodExhYmVsSFRNTFxcYC5cblNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtcGx1cy93aWtpL1Byb3ZpZGVyLUFQSWBcbiAgICAgIClcbiAgICB9XG4gICAgaWYgKHN1Z2dlc3Rpb24ub25XaWxsQ29uZmlybSAhPSBudWxsKSB7XG4gICAgICBoYXNEZXByZWNhdGlvbnMgPSB0cnVlXG4gICAgICBpZiAodHlwZW9mIGdyaW0gPT09ICd1bmRlZmluZWQnIHx8IGdyaW0gPT09IG51bGwpIHsgZ3JpbSA9IHJlcXVpcmUoJ2dyaW0nKSB9XG4gICAgICBncmltLmRlcHJlY2F0ZShgQXV0b2NvbXBsZXRlIHByb3ZpZGVyICcke3Byb3ZpZGVyLmNvbnN0cnVjdG9yLm5hbWV9KCR7cHJvdmlkZXIuaWR9KSdcbnJldHVybnMgc3VnZ2VzdGlvbnMgd2l0aCBhIFxcYG9uV2lsbENvbmZpcm1cXGAgY2FsbGJhY2suXG5UaGUgXFxgb25XaWxsQ29uZmlybVxcYCBjYWxsYmFjayBpcyBubyBsb25nZXIgc3VwcG9ydGVkLlxuU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1wbHVzL3dpa2kvUHJvdmlkZXItQVBJYFxuICAgICAgKVxuICAgIH1cbiAgICBpZiAoc3VnZ2VzdGlvbi5vbkRpZENvbmZpcm0gIT0gbnVsbCkge1xuICAgICAgaGFzRGVwcmVjYXRpb25zID0gdHJ1ZVxuICAgICAgaWYgKHR5cGVvZiBncmltID09PSAndW5kZWZpbmVkJyB8fCBncmltID09PSBudWxsKSB7IGdyaW0gPSByZXF1aXJlKCdncmltJykgfVxuICAgICAgZ3JpbS5kZXByZWNhdGUoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5yZXR1cm5zIHN1Z2dlc3Rpb25zIHdpdGggYSBcXGBvbkRpZENvbmZpcm1cXGAgY2FsbGJhY2suXG5UaGUgXFxgb25EaWRDb25maXJtXFxgIGNhbGxiYWNrIGlzIG5vdyBhIFxcYG9uRGlkSW5zZXJ0U3VnZ2VzdGlvblxcYCBjYWxsYmFjayBvbiB0aGUgcHJvdmlkZXIgaXRzZWxmLlxuU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1wbHVzL3dpa2kvUHJvdmlkZXItQVBJYFxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gaGFzRGVwcmVjYXRpb25zXG4gIH1cblxuICBkaXNwbGF5U3VnZ2VzdGlvbnMgKHN1Z2dlc3Rpb25zLCBvcHRpb25zKSB7XG4gICAgc3VnZ2VzdGlvbnMgPSB0aGlzLmdldFVuaXF1ZVN1Z2dlc3Rpb25zKHN1Z2dlc3Rpb25zKVxuXG4gICAgaWYgKHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zICYmIHN1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2hvd1N1Z2dlc3Rpb25MaXN0KHN1Z2dlc3Rpb25zLCBvcHRpb25zKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKVxuICAgIH1cbiAgfVxuXG4gIGdldFVuaXF1ZVN1Z2dlc3Rpb25zIChzdWdnZXN0aW9ucykge1xuICAgIGNvbnN0IHNlZW4gPSB7fVxuICAgIGNvbnN0IHJlc3VsdCA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWdnZXN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc3VnZ2VzdGlvbiA9IHN1Z2dlc3Rpb25zW2ldXG4gICAgICBjb25zdCB2YWwgPSBzdWdnZXN0aW9uLnRleHQgKyBzdWdnZXN0aW9uLnNuaXBwZXRcbiAgICAgIGlmICghc2Vlblt2YWxdKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHN1Z2dlc3Rpb24pXG4gICAgICAgIHNlZW5bdmFsXSA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgZ2V0UHJlZml4IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSB7XG4gICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcbiAgICBjb25zdCBwcmVmaXggPSB0aGlzLnByZWZpeFJlZ2V4LmV4ZWMobGluZSlcbiAgICBpZiAoIXByZWZpeCB8fCAhcHJlZml4WzJdKSB7XG4gICAgICByZXR1cm4gJydcbiAgICB9XG4gICAgcmV0dXJuIHByZWZpeFsyXVxuICB9XG5cbiAgZ2V0RGVmYXVsdFJlcGxhY2VtZW50UHJlZml4IChwcmVmaXgpIHtcbiAgICBpZiAodGhpcy53b3JkUHJlZml4UmVnZXgudGVzdChwcmVmaXgpKSB7XG4gICAgICByZXR1cm4gcHJlZml4XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnJ1xuICAgIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IEdldHMgY2FsbGVkIHdoZW4gdGhlIHVzZXIgc3VjY2Vzc2Z1bGx5IGNvbmZpcm1zIGEgc3VnZ2VzdGlvblxuICAvL1xuICAvLyBtYXRjaCAtIEFuIHtPYmplY3R9IHJlcHJlc2VudGluZyB0aGUgY29uZmlybWVkIHN1Z2dlc3Rpb25cbiAgY29uZmlybSAoc3VnZ2VzdGlvbiwga2V5c3Ryb2tlKSB7XG4gICAgaWYgKCh0aGlzLmVkaXRvciA9PSBudWxsKSB8fCAoc3VnZ2VzdGlvbiA9PSBudWxsKSB8fCAhIXRoaXMuZGlzcG9zZWQpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IGFwaVZlcnNpb24gPSB0aGlzLnByb3ZpZGVyTWFuYWdlci5hcGlWZXJzaW9uRm9yUHJvdmlkZXIoc3VnZ2VzdGlvbi5wcm92aWRlcilcbiAgICBjb25zdCBhcGlJczIwID0gc2VtdmVyLnNhdGlzZmllcyhhcGlWZXJzaW9uLCAnPj0yLjAuMCcpXG4gICAgY29uc3QgdHJpZ2dlclBvc2l0aW9uID0gdGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIC8vIFRPRE8gQVBJOiBSZW1vdmUgYXMgdGhpcyBpcyBubyBsb25nZXIgdXNlZFxuICAgIGlmIChzdWdnZXN0aW9uLm9uV2lsbENvbmZpcm0pIHtcbiAgICAgIHN1Z2dlc3Rpb24ub25XaWxsQ29uZmlybSgpXG4gICAgfVxuXG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgIGlmIChzZWxlY3Rpb25zICYmIHNlbGVjdGlvbnMubGVuZ3RoKSB7XG4gICAgICBmb3IgKGNvbnN0IHMgb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICBpZiAocyAmJiBzLmNsZWFyKSB7XG4gICAgICAgICAgcy5jbGVhcigpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCgpXG5cbiAgICAvL3RoaXMucmVwbGFjZVRleHRXaXRoTWF0Y2goc3VnZ2VzdGlvbilcblxuICAgIC8vIFRPRE8gQVBJOiBSZW1vdmUgd2hlbiB3ZSByZW1vdmUgdGhlIDEuMCBBUElcbiAgICBpZiAoYXBpSXMyMCkge1xuICAgICAgaWYgKHN1Z2dlc3Rpb24ucHJvdmlkZXIgJiYgc3VnZ2VzdGlvbi5wcm92aWRlci5vbkRpZEluc2VydFN1Z2dlc3Rpb24pIHtcbiAgICAgICAgc3VnZ2VzdGlvbi5wcm92aWRlci5vbkRpZEluc2VydFN1Z2dlc3Rpb24oe2VkaXRvcjogdGhpcy5lZGl0b3IsIHN1Z2dlc3Rpb24sIHRyaWdnZXJQb3NpdGlvbn0pXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdWdnZXN0aW9uLm9uRGlkQ29uZmlybSkge1xuICAgICAgICBzdWdnZXN0aW9uLm9uRGlkQ29uZmlybSgpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2hvd1N1Z2dlc3Rpb25MaXN0IChzdWdnZXN0aW9ucywgb3B0aW9ucykge1xuICAgIGlmICh0aGlzLmRpc3Bvc2VkKSB7IHJldHVybiB9XG4gICAgdGhpcy5zdWdnZXN0aW9uTGlzdC5jaGFuZ2VJdGVtcyhzdWdnZXN0aW9ucylcbiAgICByZXR1cm4gdGhpcy5zdWdnZXN0aW9uTGlzdC5zaG93KHRoaXMuZWRpdG9yLCBvcHRpb25zKVxuICB9XG5cbiAgaGlkZVN1Z2dlc3Rpb25MaXN0ICgpIHtcbiAgICBpZiAodGhpcy5kaXNwb3NlZCkgeyByZXR1cm4gfVxuICAgIHRoaXMuc3VnZ2VzdGlvbkxpc3QuY2hhbmdlSXRlbXMobnVsbClcbiAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0LmhpZGUoKVxuICAgIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zID0gZmFsc2VcbiAgfVxuXG4gIHJlcXVlc3RIaWRlU3VnZ2VzdGlvbkxpc3QgKGNvbW1hbmQpIHtcbiAgICB0aGlzLmhpZGVUaW1lb3V0ID0gc2V0VGltZW91dCh0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCwgMClcbiAgICB0aGlzLnNob3VsZERpc3BsYXlTdWdnZXN0aW9ucyA9IGZhbHNlXG4gIH1cblxuICBjYW5jZWxIaWRlU3VnZ2VzdGlvbkxpc3RSZXF1ZXN0ICgpIHtcbiAgICByZXR1cm4gY2xlYXJUaW1lb3V0KHRoaXMuaGlkZVRpbWVvdXQpXG4gIH1cblxuICAvLyBQcml2YXRlOiBSZXBsYWNlcyB0aGUgY3VycmVudCBwcmVmaXggd2l0aCB0aGUgZ2l2ZW4gbWF0Y2guXG4gIC8vXG4gIC8vIG1hdGNoIC0gVGhlIG1hdGNoIHRvIHJlcGxhY2UgdGhlIGN1cnJlbnQgcHJlZml4IHdpdGhcbiAgcmVwbGFjZVRleHRXaXRoTWF0Y2ggKHN1Z2dlc3Rpb24pIHtcbiAgICBpZiAodGhpcy5lZGl0b3IgPT0gbnVsbCkgeyByZXR1cm4gfVxuXG4gICAgY29uc3QgY3Vyc29ycyA9IHRoaXMuZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgIGlmIChjdXJzb3JzID09IG51bGwpIHsgcmV0dXJuIH1cblxuICAgIHJldHVybiB0aGlzLmVkaXRvci50cmFuc2FjdCgoKSA9PiB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGN1cnNvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY3Vyc29yID0gY3Vyc29yc1tpXVxuICAgICAgICBjb25zdCBlbmRQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICAgIGNvbnN0IGJlZ2lubmluZ1Bvc2l0aW9uID0gW2VuZFBvc2l0aW9uLnJvdywgZW5kUG9zaXRpb24uY29sdW1uIC0gc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeC5sZW5ndGhdXG5cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtiZWdpbm5pbmdQb3NpdGlvbiwgZW5kUG9zaXRpb25dKSA9PT0gc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeCkge1xuICAgICAgICAgIGNvbnN0IHN1ZmZpeCA9IHRoaXMuY29uc3VtZVN1ZmZpeCA/IHRoaXMuZ2V0U3VmZml4KHRoaXMuZWRpdG9yLCBlbmRQb3NpdGlvbiwgc3VnZ2VzdGlvbikgOiAnJ1xuICAgICAgICAgIGlmIChzdWZmaXgubGVuZ3RoKSB7IGN1cnNvci5tb3ZlUmlnaHQoc3VmZml4Lmxlbmd0aCkgfVxuICAgICAgICAgIGN1cnNvci5zZWxlY3Rpb24uc2VsZWN0TGVmdChzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4Lmxlbmd0aCArIHN1ZmZpeC5sZW5ndGgpXG5cbiAgICAgICAgICBpZiAoKHN1Z2dlc3Rpb24uc25pcHBldCAhPSBudWxsKSAmJiAodGhpcy5zbmlwcGV0c01hbmFnZXIgIT0gbnVsbCkpIHtcbiAgICAgICAgICAgIHRoaXMuc25pcHBldHNNYW5hZ2VyLmluc2VydFNuaXBwZXQoc3VnZ2VzdGlvbi5zbmlwcGV0LCB0aGlzLmVkaXRvciwgY3Vyc29yKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJzb3Iuc2VsZWN0aW9uLmluc2VydFRleHQoc3VnZ2VzdGlvbi50ZXh0ICE9IG51bGwgPyBzdWdnZXN0aW9uLnRleHQgOiBzdWdnZXN0aW9uLnNuaXBwZXQsIHtcbiAgICAgICAgICAgICAgYXV0b0luZGVudE5ld2xpbmU6IHRoaXMuZWRpdG9yLnNob3VsZEF1dG9JbmRlbnQoKSxcbiAgICAgICAgICAgICAgYXV0b0RlY3JlYXNlSW5kZW50OiB0aGlzLmVkaXRvci5zaG91bGRBdXRvSW5kZW50KClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIClcbiAgfVxuXG4gIGdldFN1ZmZpeCAoZWRpdG9yLCBidWZmZXJQb3NpdGlvbiwgc3VnZ2VzdGlvbikge1xuICAgIC8vIFRoaXMganVzdCBjaGV3cyB0aHJvdWdoIHRoZSBzdWdnZXN0aW9uIGFuZCB0cmllcyB0byBtYXRjaCB0aGUgc3VnZ2VzdGlvblxuICAgIC8vIHN1YnN0cmluZyB3aXRoIHRoZSBsaW5lVGV4dCBzdGFydGluZyBhdCB0aGUgY3Vyc29yLiBUaGVyZSBpcyBwcm9iYWJseSBhXG4gICAgLy8gbW9yZSBlZmZpY2llbnQgd2F5IHRvIGRvIHRoaXMuXG4gICAgbGV0IHN1ZmZpeCA9IChzdWdnZXN0aW9uLnNuaXBwZXQgIT0gbnVsbCA/IHN1Z2dlc3Rpb24uc25pcHBldCA6IHN1Z2dlc3Rpb24udGV4dClcbiAgICBjb25zdCBlbmRQb3NpdGlvbiA9IFtidWZmZXJQb3NpdGlvbi5yb3csIGJ1ZmZlclBvc2l0aW9uLmNvbHVtbiArIHN1ZmZpeC5sZW5ndGhdXG4gICAgY29uc3QgZW5kT2ZMaW5lVGV4dCA9IGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbYnVmZmVyUG9zaXRpb24sIGVuZFBvc2l0aW9uXSlcbiAgICBjb25zdCBub25Xb3JkQ2hhcmFjdGVycyA9IG5ldyBTZXQoYXRvbS5jb25maWcuZ2V0KCdlZGl0b3Iubm9uV29yZENoYXJhY3RlcnMnKS5zcGxpdCgnJykpXG4gICAgd2hpbGUgKHN1ZmZpeCkge1xuICAgICAgaWYgKGVuZE9mTGluZVRleHQuc3RhcnRzV2l0aChzdWZmaXgpICYmICFub25Xb3JkQ2hhcmFjdGVycy5oYXMoc3VmZml4WzBdKSkgeyBicmVhayB9XG4gICAgICBzdWZmaXggPSBzdWZmaXguc2xpY2UoMSlcbiAgICB9XG4gICAgcmV0dXJuIHN1ZmZpeFxuICB9XG5cbiAgLy8gUHJpdmF0ZTogQ2hlY2tzIHdoZXRoZXIgdGhlIGN1cnJlbnQgZmlsZSBpcyBibGFja2xpc3RlZC5cbiAgLy9cbiAgLy8gUmV0dXJucyB7Qm9vbGVhbn0gdGhhdCBkZWZpbmVzIHdoZXRoZXIgdGhlIGN1cnJlbnQgZmlsZSBpcyBibGFja2xpc3RlZFxuICBpc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWQgKCkge1xuICAgIC8vIG1pbmltYXRjaCBpcyBzbG93LiBOb3QgbmVjZXNzYXJ5IHRvIGRvIHRoaXMgY29tcHV0YXRpb24gb24gZXZlcnkgcmVxdWVzdCBmb3Igc3VnZ2VzdGlvbnNcbiAgICBsZXQgbGVmdFxuICAgIGlmICh0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlICE9IG51bGwpIHsgcmV0dXJuIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgfVxuXG4gICAgaWYgKCh0aGlzLmZpbGVCbGFja2xpc3QgPT0gbnVsbCkgfHwgdGhpcy5maWxlQmxhY2tsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZSA9IGZhbHNlXG4gICAgICByZXR1cm4gdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbWluaW1hdGNoID09PSAndW5kZWZpbmVkJyB8fCBtaW5pbWF0Y2ggPT09IG51bGwpIHsgbWluaW1hdGNoID0gcmVxdWlyZSgnbWluaW1hdGNoJykgfVxuICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZSgobGVmdCA9IHRoaXMuYnVmZmVyLmdldFBhdGgoKSkgIT0gbnVsbCA/IGxlZnQgOiAnJylcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmlsZUJsYWNrbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYmxhY2tsaXN0R2xvYiA9IHRoaXMuZmlsZUJsYWNrbGlzdFtpXVxuICAgICAgaWYgKG1pbmltYXRjaChmaWxlTmFtZSwgYmxhY2tsaXN0R2xvYikpIHtcbiAgICAgICAgdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZSA9IHRydWVcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGVcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gZmFsc2VcbiAgICByZXR1cm4gdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogR2V0cyBjYWxsZWQgd2hlbiB0aGUgY29udGVudCBoYXMgYmVlbiBtb2RpZmllZFxuICByZXF1ZXN0TmV3U3VnZ2VzdGlvbnMgKCkge1xuICAgIGxldCBkZWxheSA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLXBsdXMuYXV0b0FjdGl2YXRpb25EZWxheScpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuZGVsYXlUaW1lb3V0KVxuICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25MaXN0LmlzQWN0aXZlKCkpIHsgZGVsYXkgPSB0aGlzLnN1Z2dlc3Rpb25EZWxheSB9XG4gICAgdGhpcy5kZWxheVRpbWVvdXQgPSBzZXRUaW1lb3V0KHRoaXMuZmluZFN1Z2dlc3Rpb25zLCBkZWxheSlcbiAgICB0aGlzLnNob3VsZERpc3BsYXlTdWdnZXN0aW9ucyA9IHRydWVcbiAgfVxuXG4gIGNhbmNlbE5ld1N1Z2dlc3Rpb25zUmVxdWVzdCAoKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuZGVsYXlUaW1lb3V0KVxuICAgIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zID0gZmFsc2VcbiAgfVxuXG4gIC8vIFByaXZhdGU6IEdldHMgY2FsbGVkIHdoZW4gdGhlIGN1cnNvciBoYXMgbW92ZWQuIENhbmNlbHMgdGhlIGF1dG9jb21wbGV0aW9uIGlmXG4gIC8vIHRoZSB0ZXh0IGhhcyBub3QgYmVlbiBjaGFuZ2VkLlxuICAvL1xuICAvLyBkYXRhIC0gQW4ge09iamVjdH0gY29udGFpbmluZyBpbmZvcm1hdGlvbiBvbiB3aHkgdGhlIGN1cnNvciBoYXMgYmVlbiBtb3ZlZFxuICBjdXJzb3JNb3ZlZCAoe3RleHRDaGFuZ2VkfSkge1xuICAgIC8vIFRoZSBkZWxheSBpcyBhIHdvcmthcm91bmQgZm9yIHRoZSBiYWNrc3BhY2UgY2FzZS4gVGhlIHdheSBhdG9tIGltcGxlbWVudHNcbiAgICAvLyBiYWNrc3BhY2UgaXMgdG8gc2VsZWN0IGxlZnQgMSBjaGFyLCB0aGVuIGRlbGV0ZS4gVGhpcyByZXN1bHRzIGluIGFcbiAgICAvLyBjdXJzb3JNb3ZlZCBldmVudCB3aXRoIHRleHRDaGFuZ2VkID09IGZhbHNlLiBTbyB3ZSBkZWxheSwgYW5kIGlmIHRoZVxuICAgIC8vIGJ1ZmZlckNoYW5nZWQgaGFuZGxlciBkZWNpZGVzIHRvIHNob3cgc3VnZ2VzdGlvbnMsIGl0IHdpbGwgY2FuY2VsIHRoZVxuICAgIC8vIGhpZGVTdWdnZXN0aW9uTGlzdCByZXF1ZXN0LiBJZiB0aGVyZSBpcyBubyBidWZmZXJDaGFuZ2VkIGV2ZW50LFxuICAgIC8vIHN1Z2dlc3Rpb25MaXN0IHdpbGwgYmUgaGlkZGVuLlxuICAgIGlmICghdGV4dENoYW5nZWQgJiYgIXRoaXMuc2hvdWxkQWN0aXZhdGUpIHsgcmV0dXJuIHRoaXMucmVxdWVzdEhpZGVTdWdnZXN0aW9uTGlzdCgpIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IEdldHMgY2FsbGVkIHdoZW4gdGhlIHVzZXIgc2F2ZXMgdGhlIGRvY3VtZW50LiBDYW5jZWxzIHRoZVxuICAvLyBhdXRvY29tcGxldGlvbi5cbiAgYnVmZmVyU2F2ZWQgKCkge1xuICAgIGlmICghdGhpcy5hdXRvc2F2ZUVuYWJsZWQpIHsgcmV0dXJuIHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KCkgfVxuICB9XG5cbiAgdG9nZ2xlQWN0aXZhdGlvbkZvckJ1ZmZlckNoYW5nZSAoe25ld1RleHQsIG5ld1JhbmdlLCBvbGRUZXh0LCBvbGRSYW5nZX0pIHtcbiAgICBpZiAodGhpcy5kaXNwb3NlZCkgeyByZXR1cm4gfVxuICAgIGlmICh0aGlzLnNob3VsZEFjdGl2YXRlKSB7IHJldHVybiB9XG4gICAgaWYgKHRoaXMuY29tcG9zaXRpb25JblByb2dyZXNzKSB7IHJldHVybiB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCgpIH1cblxuICAgIGlmICh0aGlzLmF1dG9BY3RpdmF0aW9uRW5hYmxlZCB8fCB0aGlzLnN1Z2dlc3Rpb25MaXN0LmlzQWN0aXZlKCkpIHtcbiAgICAgIGlmIChuZXdUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gQWN0aXZhdGUgb24gc3BhY2UsIGEgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyLCBvciBhIGJyYWNrZXQtbWF0Y2hlciBwYWlyLlxuICAgICAgICBpZiAobmV3VGV4dCA9PT0gJyAnIHx8IG5ld1RleHQudHJpbSgpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIHRoaXMuc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV3VGV4dC5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgdGhpcy5icmFja2V0TWF0Y2hlclBhaXJzKSB7XG4gICAgICAgICAgICBpZiAobmV3VGV4dCA9PT0gcGFpcikge1xuICAgICAgICAgICAgICB0aGlzLnNob3VsZEFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChvbGRUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gU3VnZ2VzdGlvbiBsaXN0IG11c3QgYmUgZWl0aGVyIGFjdGl2ZSBvciBiYWNrc3BhY2VUcmlnZ2Vyc0F1dG9jb21wbGV0ZSBtdXN0IGJlIHRydWUgZm9yIGFjdGl2YXRpb24gdG8gb2NjdXIuXG4gICAgICAgIC8vIEFjdGl2YXRlIG9uIHJlbW92YWwgb2YgYSBzcGFjZSwgYSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIsIG9yIGEgYnJhY2tldC1tYXRjaGVyIHBhaXIuXG4gICAgICAgIGlmICh0aGlzLmJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlIHx8IHRoaXMuc3VnZ2VzdGlvbkxpc3QuaXNBY3RpdmUoKSkge1xuICAgICAgICAgIGlmIChvbGRUZXh0Lmxlbmd0aCA+IDAgJiYgKHRoaXMuYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgfHwgdGhpcy5zdWdnZXN0aW9uTGlzdC5pc0FjdGl2ZSgpKSkge1xuICAgICAgICAgICAgaWYgKG9sZFRleHQgPT09ICcgJyB8fCBvbGRUZXh0LnRyaW0oKS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9sZFRleHQubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAgIGZvciAoY29uc3QgcGFpciBvZiB0aGlzLmJyYWNrZXRNYXRjaGVyUGFpcnMpIHtcbiAgICAgICAgICAgICAgICBpZiAob2xkVGV4dCA9PT0gcGFpcikge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc2hvdWxkQWN0aXZhdGUgJiYgdGhpcy5zaG91bGRTdXBwcmVzc0FjdGl2YXRpb25Gb3JFZGl0b3JDbGFzc2VzKCkpIHtcbiAgICAgICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IGZhbHNlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlcyAoe2NoYW5nZXN9KSB7XG4gICAgY29uc3QgbGFzdEN1cnNvclBvc2l0aW9uID0gdGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBjb25zdCBjaGFuZ2VPY2N1cnJlZE5lYXJMYXN0Q3Vyc29yID0gY2hhbmdlcy5zb21lKCh7c3RhcnQsIG5ld0V4dGVudH0pID0+IHtcbiAgICAgIGNvbnN0IG5ld1JhbmdlID0gbmV3IFJhbmdlKHN0YXJ0LCBzdGFydC50cmF2ZXJzZShuZXdFeHRlbnQpKVxuICAgICAgcmV0dXJuIG5ld1JhbmdlLmNvbnRhaW5zUG9pbnQobGFzdEN1cnNvclBvc2l0aW9uKVxuICAgIH0pXG5cbiAgICBpZiAodGhpcy5zaG91bGRBY3RpdmF0ZSAmJiBjaGFuZ2VPY2N1cnJlZE5lYXJMYXN0Q3Vyc29yKSB7XG4gICAgICB0aGlzLmNhbmNlbEhpZGVTdWdnZXN0aW9uTGlzdFJlcXVlc3QoKVxuICAgICAgdGhpcy5yZXF1ZXN0TmV3U3VnZ2VzdGlvbnMoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbmNlbE5ld1N1Z2dlc3Rpb25zUmVxdWVzdCgpXG4gICAgICB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCgpXG4gICAgfVxuXG4gICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IGZhbHNlXG4gIH1cblxuICBzaG93T3JIaWRlU3VnZ2VzdGlvbkxpc3RGb3JCdWZmZXJDaGFuZ2UgKHtuZXdUZXh0LCBuZXdSYW5nZSwgb2xkVGV4dCwgb2xkUmFuZ2V9KSB7XG4gICAgaWYgKHRoaXMuZGlzcG9zZWQpIHsgcmV0dXJuIH1cbiAgICBpZiAodGhpcy5jb21wb3NpdGlvbkluUHJvZ3Jlc3MpIHsgcmV0dXJuIHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KCkgfVxuICAgIGxldCBzaG91bGRBY3RpdmF0ZSA9IGZhbHNlXG4gICAgY29uc3QgY3Vyc29yUG9zaXRpb25zID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zKClcblxuICAgIGlmICh0aGlzLmF1dG9BY3RpdmF0aW9uRW5hYmxlZCB8fCB0aGlzLnN1Z2dlc3Rpb25MaXN0LmlzQWN0aXZlKCkpIHtcbiAgICAgIC8vIEFjdGl2YXRlIG9uIHNwYWNlLCBhIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3Rlciwgb3IgYSBicmFja2V0LW1hdGNoZXIgcGFpci5cbiAgICAgIGlmIChuZXdUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaWYgKGN1cnNvclBvc2l0aW9ucy5zb21lKChwb3NpdGlvbikgPT4geyByZXR1cm4gbmV3UmFuZ2UuY29udGFpbnNQb2ludChwb3NpdGlvbikgfSkpIHtcbiAgICAgICAgICBpZiAobmV3VGV4dCA9PT0gJyAnIHx8IG5ld1RleHQudHJpbSgpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChuZXdUZXh0Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBwYWlyIG9mIHRoaXMuYnJhY2tldE1hdGNoZXJQYWlycykge1xuICAgICAgICAgICAgICBpZiAobmV3VGV4dCA9PT0gcGFpcikge1xuICAgICAgICAgICAgICAgIHNob3VsZEFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAvLyBTdWdnZXN0aW9uIGxpc3QgbXVzdCBiZSBlaXRoZXIgYWN0aXZlIG9yIGJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlIG11c3QgYmUgdHJ1ZSBmb3IgYWN0aXZhdGlvbiB0byBvY2N1ci5cbiAgICAgIC8vIEFjdGl2YXRlIG9uIHJlbW92YWwgb2YgYSBzcGFjZSwgYSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIsIG9yIGEgYnJhY2tldC1tYXRjaGVyIHBhaXIuXG4gICAgICB9IGVsc2UgaWYgKG9sZFRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAoKHRoaXMuYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgfHwgdGhpcy5zdWdnZXN0aW9uTGlzdC5pc0FjdGl2ZSgpKSAmJlxuICAgICAgICAoY3Vyc29yUG9zaXRpb25zLnNvbWUoKHBvc2l0aW9uKSA9PiB7IHJldHVybiBuZXdSYW5nZS5jb250YWluc1BvaW50KHBvc2l0aW9uKSB9KSkpIHtcbiAgICAgICAgICBpZiAob2xkVGV4dCA9PT0gJyAnIHx8IG9sZFRleHQudHJpbSgpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvbGRUZXh0Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBwYWlyIG9mIHRoaXMuYnJhY2tldE1hdGNoZXJQYWlycykge1xuICAgICAgICAgICAgICBpZiAob2xkVGV4dCA9PT0gcGFpcikge1xuICAgICAgICAgICAgICAgIHNob3VsZEFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzaG91bGRBY3RpdmF0ZSAmJiB0aGlzLnNob3VsZFN1cHByZXNzQWN0aXZhdGlvbkZvckVkaXRvckNsYXNzZXMoKSkgeyBzaG91bGRBY3RpdmF0ZSA9IGZhbHNlIH1cbiAgICB9XG5cbiAgICBpZiAoc2hvdWxkQWN0aXZhdGUpIHtcbiAgICAgIHRoaXMuY2FuY2VsSGlkZVN1Z2dlc3Rpb25MaXN0UmVxdWVzdCgpXG4gICAgICB0aGlzLnJlcXVlc3ROZXdTdWdnZXN0aW9ucygpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2FuY2VsTmV3U3VnZ2VzdGlvbnNSZXF1ZXN0KClcbiAgICAgIHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KClcbiAgICB9XG4gIH1cblxuICBzaG91bGRTdXBwcmVzc0FjdGl2YXRpb25Gb3JFZGl0b3JDbGFzc2VzICgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc3VwcHJlc3NGb3JDbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjbGFzc05hbWVzID0gdGhpcy5zdXBwcmVzc0ZvckNsYXNzZXNbaV1cbiAgICAgIGxldCBjb250YWluc0NvdW50ID0gMFxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjbGFzc05hbWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNsYXNzTmFtZXNbal1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVmlldy5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKSkgeyBjb250YWluc0NvdW50ICs9IDEgfVxuICAgICAgfVxuICAgICAgaWYgKGNvbnRhaW5zQ291bnQgPT09IGNsYXNzTmFtZXMubGVuZ3RoKSB7IHJldHVybiB0cnVlIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBQdWJsaWM6IENsZWFuIHVwLCBzdG9wIGxpc3RlbmluZyB0byBldmVudHNcbiAgZGlzcG9zZSAoKSB7XG4gICAgdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKVxuICAgIHRoaXMuZGlzcG9zZWQgPSB0cnVlXG4gICAgdGhpcy5yZWFkeSA9IGZhbHNlXG4gICAgaWYgKHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgaWYgKHRoaXMuc3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgdGhpcy5zdWdnZXN0aW9uTGlzdCA9IG51bGxcbiAgICB0aGlzLnByb3ZpZGVyTWFuYWdlciA9IG51bGxcbiAgfVxufVxuIl19