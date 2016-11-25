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

      this.subscriptions.add(this.suggestionList.onReplace(function (e) {
        _this3.replaceTextWithMatch(e);
      }));
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

    // Private: Gets called when the user successfully confmrms a suggestion
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

      //this.hideSuggestionList()

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

            cursor.moveToEndOfWord();
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
        //this.hideSuggestionList()
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvYXV0b2NvbXBsZXRlLW1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztvQkFFdUQsTUFBTTs7b0JBQzVDLE1BQU07Ozs7c0JBQ0osUUFBUTs7OzswQkFDSixZQUFZOzs7OzhCQUNSLGlCQUFpQjs7OzsrQkFFaEIsb0JBQW9COzs7OzhCQUNyQixtQkFBbUI7Ozs7cUNBQ1osMkJBQTJCOzs7OzhCQUM5QixtQkFBbUI7OztBQVhsRCxXQUFXLENBQUE7O0FBY1gsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQTs7SUFFTSxtQkFBbUI7QUFDMUIsV0FETyxtQkFBbUIsR0FDdkI7OzswQkFESSxtQkFBbUI7O0FBRXBDLFFBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFBO0FBQzVCLFFBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUE7QUFDekMsUUFBSSxDQUFDLGtDQUFrQyxHQUFHLElBQUksQ0FBQTtBQUM5QyxRQUFJLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUN2RixRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQTtBQUNsQixRQUFJLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFBO0FBQ2xDLFFBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFBO0FBQ3JCLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO0FBQ2xCLFFBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUE7QUFDL0IsUUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUE7QUFDdEIsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7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QVUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQUUseUJBQWEsSUFBSSxDQUFDLENBQUE7V0FBRTtTQUMxRTtBQUNELFlBQUksYUFBYSxLQUFLLFVBQVUsQ0FBQyxNQUFNLEVBQUU7QUFBRSxpQkFBTyxJQUFJLENBQUE7U0FBRTtPQUN6RDtBQUNELGFBQU8sS0FBSyxDQUFBO0tBQ2I7Ozs7O1dBR08sbUJBQUc7QUFDVCxVQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtBQUN6QixVQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQTtBQUNwQixVQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtBQUNsQixVQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtBQUM1QixZQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDbkM7QUFDRCxVQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFBO0FBQy9CLFVBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUN0QixZQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFBO09BQzdCO0FBQ0QsVUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUE7QUFDekIsVUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUE7QUFDMUIsVUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7S0FDNUI7OztTQWx2QmtCLG1CQUFtQjs7O3FCQUFuQixtQkFBbUIiLCJmaWxlIjoiL2hvbWUvamFtZXMvZ2l0aHViL2F1dG9jb21wbGV0ZS1wbHVzL2xpYi9hdXRvY29tcGxldGUtbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCB7IFJhbmdlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcidcbmltcG9ydCBmdXp6YWxkcmluIGZyb20gJ2Z1enphbGRyaW4nXG5pbXBvcnQgZnV6emFsZHJpblBsdXMgZnJvbSAnZnV6emFsZHJpbi1wbHVzJ1xuXG5pbXBvcnQgUHJvdmlkZXJNYW5hZ2VyIGZyb20gJy4vcHJvdmlkZXItbWFuYWdlcidcbmltcG9ydCBTdWdnZXN0aW9uTGlzdCBmcm9tICcuL3N1Z2dlc3Rpb24tbGlzdCdcbmltcG9ydCBTdWdnZXN0aW9uTGlzdEVsZW1lbnQgZnJvbSAnLi9zdWdnZXN0aW9uLWxpc3QtZWxlbWVudCdcbmltcG9ydCB7IFVuaWNvZGVMZXR0ZXJzIH0gZnJvbSAnLi91bmljb2RlLWhlbHBlcnMnXG5cbi8vIERlZmVycmVkIHJlcXVpcmVzXG5sZXQgbWluaW1hdGNoID0gbnVsbFxubGV0IGdyaW0gPSBudWxsXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF1dG9jb21wbGV0ZU1hbmFnZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5hdXRvc2F2ZUVuYWJsZWQgPSBmYWxzZVxuICAgIHRoaXMuYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgPSB0cnVlXG4gICAgdGhpcy5hdXRvQ29uZmlybVNpbmdsZVN1Z2dlc3Rpb25FbmFibGVkID0gdHJ1ZVxuICAgIHRoaXMuYnJhY2tldE1hdGNoZXJQYWlycyA9IFsnKCknLCAnW10nLCAne30nLCAnXCJcIicsIFwiJydcIiwgJ2BgJywgJ+KAnOKAnScsICfigJjigJknLCAnwqvCuycsICfigLnigLonXVxuICAgIHRoaXMuYnVmZmVyID0gbnVsbFxuICAgIHRoaXMuY29tcG9zaXRpb25JblByb2dyZXNzID0gZmFsc2VcbiAgICB0aGlzLmRpc3Bvc2VkID0gZmFsc2VcbiAgICB0aGlzLmVkaXRvciA9IG51bGxcbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgdGhpcy5lZGl0b3JWaWV3ID0gbnVsbFxuICAgIHRoaXMucHJvdmlkZXJNYW5hZ2VyID0gbnVsbFxuICAgIHRoaXMucmVhZHkgPSBmYWxzZVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICB0aGlzLnN1Z2dlc3Rpb25EZWxheSA9IDUwXG4gICAgdGhpcy5zdWdnZXN0aW9uTGlzdCA9IG51bGxcbiAgICB0aGlzLnN1cHByZXNzRm9yQ2xhc3NlcyA9IFtdXG4gICAgdGhpcy5zaG91bGREaXNwbGF5U3VnZ2VzdGlvbnMgPSBmYWxzZVxuICAgIHRoaXMucHJlZml4UmVnZXggPSBudWxsXG4gICAgdGhpcy53b3JkUHJlZml4UmVnZXggPSBudWxsXG4gICAgdGhpcy51cGRhdGVDdXJyZW50RWRpdG9yID0gdGhpcy51cGRhdGVDdXJyZW50RWRpdG9yLmJpbmQodGhpcylcbiAgICB0aGlzLmhhbmRsZUNvbW1hbmRzID0gdGhpcy5oYW5kbGVDb21tYW5kcy5iaW5kKHRoaXMpXG4gICAgdGhpcy5maW5kU3VnZ2VzdGlvbnMgPSB0aGlzLmZpbmRTdWdnZXN0aW9ucy5iaW5kKHRoaXMpXG4gICAgdGhpcy5nZXRTdWdnZXN0aW9uc0Zyb21Qcm92aWRlcnMgPSB0aGlzLmdldFN1Z2dlc3Rpb25zRnJvbVByb3ZpZGVycy5iaW5kKHRoaXMpXG4gICAgdGhpcy5kaXNwbGF5U3VnZ2VzdGlvbnMgPSB0aGlzLmRpc3BsYXlTdWdnZXN0aW9ucy5iaW5kKHRoaXMpXG4gICAgdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QgPSB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdC5iaW5kKHRoaXMpXG5cbiAgICB0aGlzLnRvZ2dsZUFjdGl2YXRpb25Gb3JCdWZmZXJDaGFuZ2UgPSB0aGlzLnRvZ2dsZUFjdGl2YXRpb25Gb3JCdWZmZXJDaGFuZ2UuYmluZCh0aGlzKVxuICAgIHRoaXMuc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlcyA9IHRoaXMuc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlcy5iaW5kKHRoaXMpXG4gICAgdGhpcy5zaG93T3JIaWRlU3VnZ2VzdGlvbkxpc3RGb3JCdWZmZXJDaGFuZ2UgPSB0aGlzLnNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIHRoaXMucHJvdmlkZXJNYW5hZ2VyID0gbmV3IFByb3ZpZGVyTWFuYWdlcigpXG4gICAgdGhpcy5zdWdnZXN0aW9uTGlzdCA9IG5ldyBTdWdnZXN0aW9uTGlzdCgpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmVuYWJsZUV4dGVuZGVkVW5pY29kZVN1cHBvcnQnLCBlbmFibGVFeHRlbmRlZFVuaWNvZGVTdXBwb3J0ID0+IHtcbiAgICAgIGlmIChlbmFibGVFeHRlbmRlZFVuaWNvZGVTdXBwb3J0KSB7XG4gICAgICAgIHRoaXMucHJlZml4UmVnZXggPSBuZXcgUmVnRXhwKGAoWydcIn5cXGAhQCNcXFxcJCVeJipcXFxcKFxcXFwpXFxcXHtcXFxcfVxcXFxbXFxcXF09KywvXFxcXD8+XSk/KChbJHtVbmljb2RlTGV0dGVyc31cXFxcZF9dK1ske1VuaWNvZGVMZXR0ZXJzfVxcXFxkXy1dKil8KFsuOjtbeyg8IF0rKSkkYClcbiAgICAgICAgdGhpcy53b3JkUHJlZml4UmVnZXggPSBuZXcgUmVnRXhwKGBeWyR7VW5pY29kZUxldHRlcnN9XFxcXGRfXStbJHtVbmljb2RlTGV0dGVyc31cXFxcZF8tXSokYClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucHJlZml4UmVnZXggPSAvKFxcYnxbJ1wifmAhQCNcXCQlXiYqXFwoXFwpXFx7XFx9XFxbXFxdPVxcKywvXFw/Pl0pKChcXHcrW1xcdy1dKil8KFsuOjtbeyg8IF0rKSkkL1xuICAgICAgICB0aGlzLndvcmRQcmVmaXhSZWdleCA9IC9eXFx3K1tcXHctXSokL1xuICAgICAgfVxuICAgIH1cbiAgICApKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5wcm92aWRlck1hbmFnZXIpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLnZpZXdzLmFkZFZpZXdQcm92aWRlcihTdWdnZXN0aW9uTGlzdCwgKG1vZGVsKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFN1Z2dlc3Rpb25MaXN0RWxlbWVudCgpLmluaXRpYWxpemUobW9kZWwpXG4gICAgfSkpXG5cbiAgICB0aGlzLmhhbmRsZUV2ZW50cygpXG4gICAgdGhpcy5oYW5kbGVDb21tYW5kcygpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLnN1Z2dlc3Rpb25MaXN0KSAvLyBXZSdyZSBhZGRpbmcgdGhpcyBsYXN0IHNvIGl0IGlzIGRpc3Bvc2VkIGFmdGVyIGV2ZW50c1xuICAgIHRoaXMucmVhZHkgPSB0cnVlXG4gIH1cblxuICBzZXRTbmlwcGV0c01hbmFnZXIgKHNuaXBwZXRzTWFuYWdlcikge1xuICAgIHRoaXMuc25pcHBldHNNYW5hZ2VyID0gc25pcHBldHNNYW5hZ2VyXG4gIH1cblxuICB1cGRhdGVDdXJyZW50RWRpdG9yIChjdXJyZW50RWRpdG9yKSB7XG4gICAgaWYgKChjdXJyZW50RWRpdG9yID09IG51bGwpIHx8IGN1cnJlbnRFZGl0b3IgPT09IHRoaXMuZWRpdG9yKSB7IHJldHVybiB9XG4gICAgaWYgKHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMgPSBudWxsXG5cbiAgICAvLyBTdG9wIHRyYWNraW5nIGVkaXRvciArIGJ1ZmZlclxuICAgIHRoaXMuZWRpdG9yID0gbnVsbFxuICAgIHRoaXMuZWRpdG9yVmlldyA9IG51bGxcbiAgICB0aGlzLmJ1ZmZlciA9IG51bGxcbiAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gbnVsbFxuXG4gICAgaWYgKCF0aGlzLmVkaXRvcklzVmFsaWQoY3VycmVudEVkaXRvcikpIHsgcmV0dXJuIH1cblxuICAgIC8vIFRyYWNrIHRoZSBuZXcgZWRpdG9yLCBlZGl0b3JWaWV3LCBhbmQgYnVmZmVyXG4gICAgdGhpcy5lZGl0b3IgPSBjdXJyZW50RWRpdG9yXG4gICAgdGhpcy5lZGl0b3JWaWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KHRoaXMuZWRpdG9yKVxuICAgIHRoaXMuYnVmZmVyID0gdGhpcy5lZGl0b3IuZ2V0QnVmZmVyKClcblxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuICAgIC8vIFN1YnNjcmliZSB0byBidWZmZXIgZXZlbnRzOlxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5idWZmZXIub25EaWRTYXZlKChlKSA9PiB7IHRoaXMuYnVmZmVyU2F2ZWQoZSkgfSkpXG4gICAgaWYgKHR5cGVvZiB0aGlzLmJ1ZmZlci5vbkRpZENoYW5nZVRleHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5idWZmZXIub25EaWRDaGFuZ2UodGhpcy50b2dnbGVBY3RpdmF0aW9uRm9yQnVmZmVyQ2hhbmdlKSlcbiAgICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5idWZmZXIub25EaWRDaGFuZ2VUZXh0KHRoaXMuc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlcykpXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFRPRE86IFJlbW92ZSB0aGlzIGFmdGVyIGBUZXh0QnVmZmVyLnByb3RvdHlwZS5vbkRpZENoYW5nZVRleHRgIGxhbmRzIG9uIEF0b20gc3RhYmxlLlxuICAgICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmJ1ZmZlci5vbkRpZENoYW5nZSh0aGlzLnNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZSkpXG4gICAgfVxuXG4gICAgLy8gV2F0Y2ggSU1FIEV2ZW50cyBUbyBBbGxvdyBJTUUgVG8gRnVuY3Rpb24gV2l0aG91dCBUaGUgU3VnZ2VzdGlvbiBMaXN0IFNob3dpbmdcbiAgICBjb25zdCBjb21wb3NpdGlvblN0YXJ0ID0gKCkgPT4ge1xuICAgICAgdGhpcy5jb21wb3NpdGlvbkluUHJvZ3Jlc3MgPSB0cnVlXG4gICAgfVxuICAgIGNvbnN0IGNvbXBvc2l0aW9uRW5kID0gKCkgPT4ge1xuICAgICAgdGhpcy5jb21wb3NpdGlvbkluUHJvZ3Jlc3MgPSBmYWxzZVxuICAgIH1cblxuICAgIHRoaXMuZWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdjb21wb3NpdGlvbnN0YXJ0JywgY29tcG9zaXRpb25TdGFydClcbiAgICB0aGlzLmVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcignY29tcG9zaXRpb25lbmQnLCBjb21wb3NpdGlvbkVuZClcbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmVkaXRvclZpZXcpIHtcbiAgICAgICAgdGhpcy5lZGl0b3JWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NvbXBvc2l0aW9uc3RhcnQnLCBjb21wb3NpdGlvblN0YXJ0KVxuICAgICAgICB0aGlzLmVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcignY29tcG9zaXRpb25lbmQnLCBjb21wb3NpdGlvbkVuZClcbiAgICAgIH1cbiAgICB9KSlcblxuICAgIC8vIFN1YnNjcmliZSB0byBlZGl0b3IgZXZlbnRzOlxuICAgIC8vIENsb3NlIHRoZSBvdmVybGF5IHdoZW4gdGhlIGN1cnNvciBtb3ZlZCB3aXRob3V0IGNoYW5naW5nIGFueSB0ZXh0XG4gICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKChlKSA9PiB7IHRoaXMuY3Vyc29yTW92ZWQoZSkgfSkpXG4gICAgcmV0dXJuIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lZGl0b3Iub25EaWRDaGFuZ2VQYXRoKCgpID0+IHtcbiAgICAgIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgPSBudWxsXG4gICAgfSkpXG4gIH1cblxuICBlZGl0b3JJc1ZhbGlkIChlZGl0b3IpIHtcbiAgICAvLyBUT0RPOiByZW1vdmUgY29uZGl0aW9uYWwgd2hlbiBgaXNUZXh0RWRpdG9yYCBpcyBzaGlwcGVkLlxuICAgIGlmICh0eXBlb2YgYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gYXRvbS53b3Jrc3BhY2UuaXNUZXh0RWRpdG9yKGVkaXRvcilcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGVkaXRvciA9PSBudWxsKSB7IHJldHVybiBmYWxzZSB9XG4gICAgICAvLyBTaG91bGQgd2UgZGlzcXVhbGlmeSBUZXh0RWRpdG9ycyB3aXRoIHRoZSBHcmFtbWFyIHRleHQucGxhaW4ubnVsbC1ncmFtbWFyP1xuICAgICAgcmV0dXJuIChlZGl0b3IuZ2V0VGV4dCAhPSBudWxsKVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUV2ZW50cyAoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLnRleHRFZGl0b3JzLm9ic2VydmUoKGVkaXRvcikgPT4ge1xuICAgICAgY29uc3QgdmlldyA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpXG4gICAgICBpZiAodmlldyA9PT0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5jbG9zZXN0KCdhdG9tLXRleHQtZWRpdG9yJykpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50RWRpdG9yKGVkaXRvcilcbiAgICAgIH1cbiAgICAgIHZpZXcuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCAoZWxlbWVudCkgPT4ge1xuICAgICAgICB0aGlzLnVwZGF0ZUN1cnJlbnRFZGl0b3IoZWRpdG9yKVxuICAgICAgfSlcbiAgICB9KSlcblxuICAgIC8vIFdhdGNoIGNvbmZpZyB2YWx1ZXNcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9zYXZlLmVuYWJsZWQnLCAodmFsdWUpID0+IHsgdGhpcy5hdXRvc2F2ZUVuYWJsZWQgPSB2YWx1ZSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlJywgKHZhbHVlKSA9PiB7IHRoaXMuYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgPSB2YWx1ZSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmVuYWJsZUF1dG9BY3RpdmF0aW9uJywgKHZhbHVlKSA9PiB7IHRoaXMuYXV0b0FjdGl2YXRpb25FbmFibGVkID0gdmFsdWUgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5lbmFibGVBdXRvQ29uZmlybVNpbmdsZVN1Z2dlc3Rpb24nLCAodmFsdWUpID0+IHsgdGhpcy5hdXRvQ29uZmlybVNpbmdsZVN1Z2dlc3Rpb25FbmFibGVkID0gdmFsdWUgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5jb25zdW1lU3VmZml4JywgKHZhbHVlKSA9PiB7IHRoaXMuY29uc3VtZVN1ZmZpeCA9IHZhbHVlIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMudXNlQWx0ZXJuYXRlU2NvcmluZycsICh2YWx1ZSkgPT4geyB0aGlzLnVzZUFsdGVybmF0ZVNjb3JpbmcgPSB2YWx1ZSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmZpbGVCbGFja2xpc3QnLCAodmFsdWUpID0+IHtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICB0aGlzLmZpbGVCbGFja2xpc3QgPSB2YWx1ZS5tYXAoKHMpID0+IHsgcmV0dXJuIHMudHJpbSgpIH0pXG4gICAgICB9XG4gICAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gbnVsbFxuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuc3VwcHJlc3NBY3RpdmF0aW9uRm9yRWRpdG9yQ2xhc3NlcycsIHZhbHVlID0+IHtcbiAgICAgIHRoaXMuc3VwcHJlc3NGb3JDbGFzc2VzID0gW11cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSB2YWx1ZVtpXVxuICAgICAgICBjb25zdCBjbGFzc2VzID0gKHNlbGVjdG9yLnRyaW0oKS5zcGxpdCgnLicpLmZpbHRlcigoY2xhc3NOYW1lKSA9PiBjbGFzc05hbWUudHJpbSgpKS5tYXAoKGNsYXNzTmFtZSkgPT4gY2xhc3NOYW1lLnRyaW0oKSkpXG4gICAgICAgIGlmIChjbGFzc2VzLmxlbmd0aCkgeyB0aGlzLnN1cHByZXNzRm9yQ2xhc3Nlcy5wdXNoKGNsYXNzZXMpIH1cbiAgICAgIH1cbiAgICB9KSlcblxuICAgIC8vIEhhbmRsZSBldmVudHMgZnJvbSBzdWdnZXN0aW9uIGxpc3RcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuc3VnZ2VzdGlvbkxpc3Qub25EaWRDb25maXJtKChlKSA9PiB7IHRoaXMuY29uZmlybShlKSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuc3VnZ2VzdGlvbkxpc3Qub25EaWRDYW5jZWwodGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QpKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLnN1Z2dlc3Rpb25MaXN0Lm9uUmVwbGFjZSgoZSkgPT4geyB0aGlzLnJlcGxhY2VUZXh0V2l0aE1hdGNoKGUpIH0pKVxuICB9XG5cbiAgaGFuZGxlQ29tbWFuZHMgKCkge1xuICAgIHJldHVybiB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywge1xuICAgICAgJ2F1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlJzogKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zID0gdHJ1ZVxuICAgICAgICBsZXQgYWN0aXZhdGVkTWFudWFsbHkgPSB0cnVlXG4gICAgICAgIGlmIChldmVudC5kZXRhaWwgJiYgZXZlbnQuZGV0YWlsLmFjdGl2YXRlZE1hbnVhbGx5ICE9PSBudWxsICYmIHR5cGVvZiBldmVudC5kZXRhaWwuYWN0aXZhdGVkTWFudWFsbHkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgYWN0aXZhdGVkTWFudWFsbHkgPSBldmVudC5kZXRhaWwuYWN0aXZhdGVkTWFudWFsbHlcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpbmRTdWdnZXN0aW9ucyhhY3RpdmF0ZWRNYW51YWxseSlcbiAgICAgIH1cbiAgICB9KSlcbiAgfVxuXG4gIC8vIFByaXZhdGU6IEZpbmRzIHN1Z2dlc3Rpb25zIGZvciB0aGUgY3VycmVudCBwcmVmaXgsIHNldHMgdGhlIGxpc3QgaXRlbXMsXG4gIC8vIHBvc2l0aW9ucyB0aGUgb3ZlcmxheSBhbmQgc2hvd3MgaXRcbiAgZmluZFN1Z2dlc3Rpb25zIChhY3RpdmF0ZWRNYW51YWxseSkge1xuICAgIGlmICh0aGlzLmRpc3Bvc2VkKSB7IHJldHVybiB9XG4gICAgaWYgKCh0aGlzLnByb3ZpZGVyTWFuYWdlciA9PSBudWxsKSB8fCAodGhpcy5lZGl0b3IgPT0gbnVsbCkgfHwgKHRoaXMuYnVmZmVyID09IG51bGwpKSB7IHJldHVybiB9XG4gICAgaWYgKHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkKCkpIHsgcmV0dXJuIH1cbiAgICBjb25zdCBjdXJzb3IgPSB0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKClcbiAgICBpZiAoY3Vyc29yID09IG51bGwpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IGJ1ZmZlclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBjb25zdCBzY29wZURlc2NyaXB0b3IgPSBjdXJzb3IuZ2V0U2NvcGVEZXNjcmlwdG9yKClcbiAgICBjb25zdCBwcmVmaXggPSB0aGlzLmdldFByZWZpeCh0aGlzLmVkaXRvciwgYnVmZmVyUG9zaXRpb24pXG5cbiAgICByZXR1cm4gdGhpcy5nZXRTdWdnZXN0aW9uc0Zyb21Qcm92aWRlcnMoe2VkaXRvcjogdGhpcy5lZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBzY29wZURlc2NyaXB0b3IsIHByZWZpeCwgYWN0aXZhdGVkTWFudWFsbHl9KVxuICB9XG5cbiAgZ2V0U3VnZ2VzdGlvbnNGcm9tUHJvdmlkZXJzIChvcHRpb25zKSB7XG4gICAgbGV0IHN1Z2dlc3Rpb25zUHJvbWlzZVxuICAgIGNvbnN0IHByb3ZpZGVycyA9IHRoaXMucHJvdmlkZXJNYW5hZ2VyLmFwcGxpY2FibGVQcm92aWRlcnMob3B0aW9ucy5lZGl0b3IsIG9wdGlvbnMuc2NvcGVEZXNjcmlwdG9yKVxuXG4gICAgY29uc3QgcHJvdmlkZXJQcm9taXNlcyA9IFtdXG4gICAgcHJvdmlkZXJzLmZvckVhY2gocHJvdmlkZXIgPT4ge1xuICAgICAgY29uc3QgYXBpVmVyc2lvbiA9IHRoaXMucHJvdmlkZXJNYW5hZ2VyLmFwaVZlcnNpb25Gb3JQcm92aWRlcihwcm92aWRlcilcbiAgICAgIGNvbnN0IGFwaUlzMjAgPSBzZW12ZXIuc2F0aXNmaWVzKGFwaVZlcnNpb24sICc+PTIuMC4wJylcblxuICAgICAgLy8gVE9ETyBBUEk6IHJlbW92ZSB1cGdyYWRpbmcgd2hlbiAxLjAgc3VwcG9ydCBpcyByZW1vdmVkXG4gICAgICBsZXQgZ2V0U3VnZ2VzdGlvbnNcbiAgICAgIGxldCB1cGdyYWRlZE9wdGlvbnNcbiAgICAgIGlmIChhcGlJczIwKSB7XG4gICAgICAgIGdldFN1Z2dlc3Rpb25zID0gcHJvdmlkZXIuZ2V0U3VnZ2VzdGlvbnMuYmluZChwcm92aWRlcilcbiAgICAgICAgdXBncmFkZWRPcHRpb25zID0gb3B0aW9uc1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2V0U3VnZ2VzdGlvbnMgPSBwcm92aWRlci5yZXF1ZXN0SGFuZGxlci5iaW5kKHByb3ZpZGVyKVxuICAgICAgICB1cGdyYWRlZE9wdGlvbnMgPSB7XG4gICAgICAgICAgZWRpdG9yOiBvcHRpb25zLmVkaXRvcixcbiAgICAgICAgICBwcmVmaXg6IG9wdGlvbnMucHJlZml4LFxuICAgICAgICAgIGJ1ZmZlclBvc2l0aW9uOiBvcHRpb25zLmJ1ZmZlclBvc2l0aW9uLFxuICAgICAgICAgIHBvc2l0aW9uOiBvcHRpb25zLmJ1ZmZlclBvc2l0aW9uLFxuICAgICAgICAgIHNjb3BlOiBvcHRpb25zLnNjb3BlRGVzY3JpcHRvcixcbiAgICAgICAgICBzY29wZUNoYWluOiBvcHRpb25zLnNjb3BlRGVzY3JpcHRvci5nZXRTY29wZUNoYWluKCksXG4gICAgICAgICAgYnVmZmVyOiBvcHRpb25zLmVkaXRvci5nZXRCdWZmZXIoKSxcbiAgICAgICAgICBjdXJzb3I6IG9wdGlvbnMuZWRpdG9yLmdldExhc3RDdXJzb3IoKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcm92aWRlclByb21pc2VzLnB1c2goUHJvbWlzZS5yZXNvbHZlKGdldFN1Z2dlc3Rpb25zKHVwZ3JhZGVkT3B0aW9ucykpLnRoZW4ocHJvdmlkZXJTdWdnZXN0aW9ucyA9PiB7XG4gICAgICAgIGlmIChwcm92aWRlclN1Z2dlc3Rpb25zID09IG51bGwpIHsgcmV0dXJuIH1cblxuICAgICAgICAvLyBUT0RPIEFQSTogcmVtb3ZlIHVwZ3JhZGluZyB3aGVuIDEuMCBzdXBwb3J0IGlzIHJlbW92ZWRcbiAgICAgICAgbGV0IGhhc0RlcHJlY2F0aW9ucyA9IGZhbHNlXG4gICAgICAgIGlmIChhcGlJczIwICYmIHByb3ZpZGVyU3VnZ2VzdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgaGFzRGVwcmVjYXRpb25zID0gdGhpcy5kZXByZWNhdGVGb3JTdWdnZXN0aW9uKHByb3ZpZGVyLCBwcm92aWRlclN1Z2dlc3Rpb25zWzBdKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc0RlcHJlY2F0aW9ucyB8fCAhYXBpSXMyMCkge1xuICAgICAgICAgIHByb3ZpZGVyU3VnZ2VzdGlvbnMgPSBwcm92aWRlclN1Z2dlc3Rpb25zLm1hcCgoc3VnZ2VzdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmV3U3VnZ2VzdGlvbiA9IHtcbiAgICAgICAgICAgICAgdGV4dDogc3VnZ2VzdGlvbi50ZXh0ICE9IG51bGwgPyBzdWdnZXN0aW9uLnRleHQgOiBzdWdnZXN0aW9uLndvcmQsXG4gICAgICAgICAgICAgIHNuaXBwZXQ6IHN1Z2dlc3Rpb24uc25pcHBldCxcbiAgICAgICAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXg6IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggIT0gbnVsbCA/IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggOiBzdWdnZXN0aW9uLnByZWZpeCxcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiBzdWdnZXN0aW9uLmNsYXNzTmFtZSxcbiAgICAgICAgICAgICAgdHlwZTogc3VnZ2VzdGlvbi50eXBlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKG5ld1N1Z2dlc3Rpb24ucmlnaHRMYWJlbEhUTUwgPT0gbnVsbCkgJiYgc3VnZ2VzdGlvbi5yZW5kZXJMYWJlbEFzSHRtbCkgeyBuZXdTdWdnZXN0aW9uLnJpZ2h0TGFiZWxIVE1MID0gc3VnZ2VzdGlvbi5sYWJlbCB9XG4gICAgICAgICAgICBpZiAoKG5ld1N1Z2dlc3Rpb24ucmlnaHRMYWJlbCA9PSBudWxsKSAmJiAhc3VnZ2VzdGlvbi5yZW5kZXJMYWJlbEFzSHRtbCkgeyBuZXdTdWdnZXN0aW9uLnJpZ2h0TGFiZWwgPSBzdWdnZXN0aW9uLmxhYmVsIH1cbiAgICAgICAgICAgIHJldHVybiBuZXdTdWdnZXN0aW9uXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBoYXNFbXB0eSA9IGZhbHNlIC8vIE9wdGltaXphdGlvbjogb25seSBjcmVhdGUgYW5vdGhlciBhcnJheSB3aGVuIHRoZXJlIGFyZSBlbXB0eSBpdGVtc1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVyU3VnZ2VzdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBzdWdnZXN0aW9uID0gcHJvdmlkZXJTdWdnZXN0aW9uc1tpXVxuICAgICAgICAgIGlmICghc3VnZ2VzdGlvbi5zbmlwcGV0ICYmICFzdWdnZXN0aW9uLnRleHQpIHsgaGFzRW1wdHkgPSB0cnVlIH1cbiAgICAgICAgICBpZiAoc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeCA9PSBudWxsKSB7IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggPSB0aGlzLmdldERlZmF1bHRSZXBsYWNlbWVudFByZWZpeChvcHRpb25zLnByZWZpeCkgfVxuICAgICAgICAgIHN1Z2dlc3Rpb24ucHJvdmlkZXIgPSBwcm92aWRlclxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGhhc0VtcHR5KSB7XG4gICAgICAgICAgY29uc3QgcmVzID0gW11cbiAgICAgICAgICBmb3IgKGNvbnN0IHMgb2YgcHJvdmlkZXJTdWdnZXN0aW9ucykge1xuICAgICAgICAgICAgaWYgKHMuc25pcHBldCB8fCBzLnRleHQpIHtcbiAgICAgICAgICAgICAgcmVzLnB1c2gocylcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcHJvdmlkZXJTdWdnZXN0aW9ucyA9IHJlc1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb3ZpZGVyLmZpbHRlclN1Z2dlc3Rpb25zKSB7XG4gICAgICAgICAgcHJvdmlkZXJTdWdnZXN0aW9ucyA9IHRoaXMuZmlsdGVyU3VnZ2VzdGlvbnMocHJvdmlkZXJTdWdnZXN0aW9ucywgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJvdmlkZXJTdWdnZXN0aW9uc1xuICAgICAgfSkpXG4gICAgfSlcblxuICAgIGlmICghcHJvdmlkZXJQcm9taXNlcyB8fCAhcHJvdmlkZXJQcm9taXNlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHN1Z2dlc3Rpb25zUHJvbWlzZSA9IFByb21pc2UuYWxsKHByb3ZpZGVyUHJvbWlzZXMpXG4gICAgdGhpcy5jdXJyZW50U3VnZ2VzdGlvbnNQcm9taXNlID0gc3VnZ2VzdGlvbnNQcm9taXNlXG4gICAgcmV0dXJuIHRoaXMuY3VycmVudFN1Z2dlc3Rpb25zUHJvbWlzZVxuICAgICAgLnRoZW4odGhpcy5tZXJnZVN1Z2dlc3Rpb25zRnJvbVByb3ZpZGVycylcbiAgICAgIC50aGVuKHN1Z2dlc3Rpb25zID0+IHtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFN1Z2dlc3Rpb25zUHJvbWlzZSAhPT0gc3VnZ2VzdGlvbnNQcm9taXNlKSB7IHJldHVybiB9XG4gICAgICAgIGlmIChvcHRpb25zLmFjdGl2YXRlZE1hbnVhbGx5ICYmIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zICYmIHRoaXMuYXV0b0NvbmZpcm1TaW5nbGVTdWdnZXN0aW9uRW5hYmxlZCAmJiBzdWdnZXN0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAvLyBXaGVuIHRoZXJlIGlzIG9uZSBzdWdnZXN0aW9uIGluIG1hbnVhbCBtb2RlLCBqdXN0IGNvbmZpcm0gaXRcbiAgICAgICAgICByZXR1cm4gdGhpcy5jb25maXJtKHN1Z2dlc3Rpb25zWzBdKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlTdWdnZXN0aW9ucyhzdWdnZXN0aW9ucywgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIGZpbHRlclN1Z2dlc3Rpb25zIChzdWdnZXN0aW9ucywge3ByZWZpeH0pIHtcbiAgICBjb25zdCByZXN1bHRzID0gW11cbiAgICBjb25zdCBmdXp6YWxkcmluUHJvdmlkZXIgPSB0aGlzLnVzZUFsdGVybmF0ZVNjb3JpbmcgPyBmdXp6YWxkcmluUGx1cyA6IGZ1enphbGRyaW5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1Z2dlc3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBzb3J0U2NvcmUgbW9zdGx5IHByZXNlcnZlcyBpbiB0aGUgb3JpZ2luYWwgc29ydGluZy4gVGhlIGZ1bmN0aW9uIGlzXG4gICAgICAvLyBjaG9zZW4gc3VjaCB0aGF0IHN1Z2dlc3Rpb25zIHdpdGggYSB2ZXJ5IGhpZ2ggbWF0Y2ggc2NvcmUgY2FuIGJyZWFrIG91dC5cbiAgICAgIGxldCBzY29yZVxuICAgICAgY29uc3Qgc3VnZ2VzdGlvbiA9IHN1Z2dlc3Rpb25zW2ldXG4gICAgICBzdWdnZXN0aW9uLnNvcnRTY29yZSA9IE1hdGgubWF4KCgtaSAvIDEwKSArIDMsIDApICsgMVxuICAgICAgc3VnZ2VzdGlvbi5zY29yZSA9IG51bGxcblxuICAgICAgY29uc3QgdGV4dCA9IChzdWdnZXN0aW9uLnNuaXBwZXQgfHwgc3VnZ2VzdGlvbi50ZXh0KVxuICAgICAgY29uc3Qgc3VnZ2VzdGlvblByZWZpeCA9IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggIT0gbnVsbCA/IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggOiBwcmVmaXhcbiAgICAgIGNvbnN0IHByZWZpeElzRW1wdHkgPSAhc3VnZ2VzdGlvblByZWZpeCB8fCBzdWdnZXN0aW9uUHJlZml4ID09PSAnICdcbiAgICAgIGNvbnN0IGZpcnN0Q2hhcklzTWF0Y2ggPSAhcHJlZml4SXNFbXB0eSAmJiBzdWdnZXN0aW9uUHJlZml4WzBdLnRvTG93ZXJDYXNlKCkgPT09IHRleHRbMF0udG9Mb3dlckNhc2UoKVxuXG4gICAgICBpZiAocHJlZml4SXNFbXB0eSkge1xuICAgICAgICByZXN1bHRzLnB1c2goc3VnZ2VzdGlvbilcbiAgICAgIH1cbiAgICAgIGlmIChmaXJzdENoYXJJc01hdGNoICYmIChzY29yZSA9IGZ1enphbGRyaW5Qcm92aWRlci5zY29yZSh0ZXh0LCBzdWdnZXN0aW9uUHJlZml4KSkgPiAwKSB7XG4gICAgICAgIHN1Z2dlc3Rpb24uc2NvcmUgPSBzY29yZSAqIHN1Z2dlc3Rpb24uc29ydFNjb3JlXG4gICAgICAgIHJlc3VsdHMucHVzaChzdWdnZXN0aW9uKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJlc3VsdHMuc29ydCh0aGlzLnJldmVyc2VTb3J0T25TY29yZUNvbXBhcmF0b3IpXG4gICAgcmV0dXJuIHJlc3VsdHNcbiAgfVxuXG4gIHJldmVyc2VTb3J0T25TY29yZUNvbXBhcmF0b3IgKGEsIGIpIHtcbiAgICBsZXQgYnNjb3JlID0gYi5zY29yZVxuICAgIGlmICghYnNjb3JlKSB7XG4gICAgICBic2NvcmUgPSBiLnNvcnRTY29yZVxuICAgIH1cbiAgICBsZXQgYXNjb3JlID0gYS5zY29yZVxuICAgIGlmICghYXNjb3JlKSB7XG4gICAgICBhc2NvcmUgPSBiLnNvcnRTY29yZVxuICAgIH1cbiAgICByZXR1cm4gYnNjb3JlIC0gYXNjb3JlXG4gIH1cblxuICAvLyBwcm92aWRlclN1Z2dlc3Rpb25zIC0gYXJyYXkgb2YgYXJyYXlzIG9mIHN1Z2dlc3Rpb25zIHByb3ZpZGVkIGJ5IGFsbCBjYWxsZWQgcHJvdmlkZXJzXG4gIG1lcmdlU3VnZ2VzdGlvbnNGcm9tUHJvdmlkZXJzIChwcm92aWRlclN1Z2dlc3Rpb25zKSB7XG4gICAgcmV0dXJuIHByb3ZpZGVyU3VnZ2VzdGlvbnMucmVkdWNlKChzdWdnZXN0aW9ucywgcHJvdmlkZXJTdWdnZXN0aW9ucykgPT4ge1xuICAgICAgaWYgKHByb3ZpZGVyU3VnZ2VzdGlvbnMgJiYgcHJvdmlkZXJTdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgc3VnZ2VzdGlvbnMgPSBzdWdnZXN0aW9ucy5jb25jYXQocHJvdmlkZXJTdWdnZXN0aW9ucylcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHN1Z2dlc3Rpb25zXG4gICAgfSwgW10pXG4gIH1cblxuICBkZXByZWNhdGVGb3JTdWdnZXN0aW9uIChwcm92aWRlciwgc3VnZ2VzdGlvbikge1xuICAgIGxldCBoYXNEZXByZWNhdGlvbnMgPSBmYWxzZVxuICAgIGlmIChzdWdnZXN0aW9uLndvcmQgIT0gbnVsbCkge1xuICAgICAgaGFzRGVwcmVjYXRpb25zID0gdHJ1ZVxuICAgICAgaWYgKHR5cGVvZiBncmltID09PSAndW5kZWZpbmVkJyB8fCBncmltID09PSBudWxsKSB7IGdyaW0gPSByZXF1aXJlKCdncmltJykgfVxuICAgICAgZ3JpbS5kZXByZWNhdGUoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5yZXR1cm5zIHN1Z2dlc3Rpb25zIHdpdGggYSBcXGB3b3JkXFxgIGF0dHJpYnV0ZS5cblRoZSBcXGB3b3JkXFxgIGF0dHJpYnV0ZSBpcyBub3cgXFxgdGV4dFxcYC5cblNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtcGx1cy93aWtpL1Byb3ZpZGVyLUFQSWBcbiAgICAgIClcbiAgICB9XG4gICAgaWYgKHN1Z2dlc3Rpb24ucHJlZml4ICE9IG51bGwpIHtcbiAgICAgIGhhc0RlcHJlY2F0aW9ucyA9IHRydWVcbiAgICAgIGlmICh0eXBlb2YgZ3JpbSA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JpbSA9PT0gbnVsbCkgeyBncmltID0gcmVxdWlyZSgnZ3JpbScpIH1cbiAgICAgIGdyaW0uZGVwcmVjYXRlKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xucmV0dXJucyBzdWdnZXN0aW9ucyB3aXRoIGEgXFxgcHJlZml4XFxgIGF0dHJpYnV0ZS5cblRoZSBcXGBwcmVmaXhcXGAgYXR0cmlidXRlIGlzIG5vdyBcXGByZXBsYWNlbWVudFByZWZpeFxcYCBhbmQgaXMgb3B0aW9uYWwuXG5TZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXV0b2NvbXBsZXRlLXBsdXMvd2lraS9Qcm92aWRlci1BUElgXG4gICAgICApXG4gICAgfVxuICAgIGlmIChzdWdnZXN0aW9uLmxhYmVsICE9IG51bGwpIHtcbiAgICAgIGhhc0RlcHJlY2F0aW9ucyA9IHRydWVcbiAgICAgIGlmICh0eXBlb2YgZ3JpbSA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JpbSA9PT0gbnVsbCkgeyBncmltID0gcmVxdWlyZSgnZ3JpbScpIH1cbiAgICAgIGdyaW0uZGVwcmVjYXRlKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xucmV0dXJucyBzdWdnZXN0aW9ucyB3aXRoIGEgXFxgbGFiZWxcXGAgYXR0cmlidXRlLlxuVGhlIFxcYGxhYmVsXFxgIGF0dHJpYnV0ZSBpcyBub3cgXFxgcmlnaHRMYWJlbFxcYCBvciBcXGByaWdodExhYmVsSFRNTFxcYC5cblNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtcGx1cy93aWtpL1Byb3ZpZGVyLUFQSWBcbiAgICAgIClcbiAgICB9XG4gICAgaWYgKHN1Z2dlc3Rpb24ub25XaWxsQ29uZmlybSAhPSBudWxsKSB7XG4gICAgICBoYXNEZXByZWNhdGlvbnMgPSB0cnVlXG4gICAgICBpZiAodHlwZW9mIGdyaW0gPT09ICd1bmRlZmluZWQnIHx8IGdyaW0gPT09IG51bGwpIHsgZ3JpbSA9IHJlcXVpcmUoJ2dyaW0nKSB9XG4gICAgICBncmltLmRlcHJlY2F0ZShgQXV0b2NvbXBsZXRlIHByb3ZpZGVyICcke3Byb3ZpZGVyLmNvbnN0cnVjdG9yLm5hbWV9KCR7cHJvdmlkZXIuaWR9KSdcbnJldHVybnMgc3VnZ2VzdGlvbnMgd2l0aCBhIFxcYG9uV2lsbENvbmZpcm1cXGAgY2FsbGJhY2suXG5UaGUgXFxgb25XaWxsQ29uZmlybVxcYCBjYWxsYmFjayBpcyBubyBsb25nZXIgc3VwcG9ydGVkLlxuU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1wbHVzL3dpa2kvUHJvdmlkZXItQVBJYFxuICAgICAgKVxuICAgIH1cbiAgICBpZiAoc3VnZ2VzdGlvbi5vbkRpZENvbmZpcm0gIT0gbnVsbCkge1xuICAgICAgaGFzRGVwcmVjYXRpb25zID0gdHJ1ZVxuICAgICAgaWYgKHR5cGVvZiBncmltID09PSAndW5kZWZpbmVkJyB8fCBncmltID09PSBudWxsKSB7IGdyaW0gPSByZXF1aXJlKCdncmltJykgfVxuICAgICAgZ3JpbS5kZXByZWNhdGUoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5yZXR1cm5zIHN1Z2dlc3Rpb25zIHdpdGggYSBcXGBvbkRpZENvbmZpcm1cXGAgY2FsbGJhY2suXG5UaGUgXFxgb25EaWRDb25maXJtXFxgIGNhbGxiYWNrIGlzIG5vdyBhIFxcYG9uRGlkSW5zZXJ0U3VnZ2VzdGlvblxcYCBjYWxsYmFjayBvbiB0aGUgcHJvdmlkZXIgaXRzZWxmLlxuU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1wbHVzL3dpa2kvUHJvdmlkZXItQVBJYFxuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gaGFzRGVwcmVjYXRpb25zXG4gIH1cblxuICBkaXNwbGF5U3VnZ2VzdGlvbnMgKHN1Z2dlc3Rpb25zLCBvcHRpb25zKSB7XG4gICAgc3VnZ2VzdGlvbnMgPSB0aGlzLmdldFVuaXF1ZVN1Z2dlc3Rpb25zKHN1Z2dlc3Rpb25zKVxuXG4gICAgaWYgKHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zICYmIHN1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2hvd1N1Z2dlc3Rpb25MaXN0KHN1Z2dlc3Rpb25zLCBvcHRpb25zKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKVxuICAgIH1cbiAgfVxuXG4gIGdldFVuaXF1ZVN1Z2dlc3Rpb25zIChzdWdnZXN0aW9ucykge1xuICAgIGNvbnN0IHNlZW4gPSB7fVxuICAgIGNvbnN0IHJlc3VsdCA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWdnZXN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc3VnZ2VzdGlvbiA9IHN1Z2dlc3Rpb25zW2ldXG4gICAgICBjb25zdCB2YWwgPSBzdWdnZXN0aW9uLnRleHQgKyBzdWdnZXN0aW9uLnNuaXBwZXRcbiAgICAgIGlmICghc2Vlblt2YWxdKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHN1Z2dlc3Rpb24pXG4gICAgICAgIHNlZW5bdmFsXSA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgZ2V0UHJlZml4IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSB7XG4gICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcbiAgICBjb25zdCBwcmVmaXggPSB0aGlzLnByZWZpeFJlZ2V4LmV4ZWMobGluZSlcbiAgICBpZiAoIXByZWZpeCB8fCAhcHJlZml4WzJdKSB7XG4gICAgICByZXR1cm4gJydcbiAgICB9XG4gICAgcmV0dXJuIHByZWZpeFsyXVxuICB9XG5cbiAgZ2V0RGVmYXVsdFJlcGxhY2VtZW50UHJlZml4IChwcmVmaXgpIHtcbiAgICBpZiAodGhpcy53b3JkUHJlZml4UmVnZXgudGVzdChwcmVmaXgpKSB7XG4gICAgICByZXR1cm4gcHJlZml4XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnJ1xuICAgIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IEdldHMgY2FsbGVkIHdoZW4gdGhlIHVzZXIgc3VjY2Vzc2Z1bGx5IGNvbmZtcm1zIGEgc3VnZ2VzdGlvblxuICAvL1xuICAvLyBtYXRjaCAtIEFuIHtPYmplY3R9IHJlcHJlc2VudGluZyB0aGUgY29uZmlybWVkIHN1Z2dlc3Rpb25cbiAgY29uZmlybSAoc3VnZ2VzdGlvbiwga2V5c3Ryb2tlKSB7XG4gICAgaWYgKCh0aGlzLmVkaXRvciA9PSBudWxsKSB8fCAoc3VnZ2VzdGlvbiA9PSBudWxsKSB8fCAhIXRoaXMuZGlzcG9zZWQpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IGFwaVZlcnNpb24gPSB0aGlzLnByb3ZpZGVyTWFuYWdlci5hcGlWZXJzaW9uRm9yUHJvdmlkZXIoc3VnZ2VzdGlvbi5wcm92aWRlcilcbiAgICBjb25zdCBhcGlJczIwID0gc2VtdmVyLnNhdGlzZmllcyhhcGlWZXJzaW9uLCAnPj0yLjAuMCcpXG4gICAgY29uc3QgdHJpZ2dlclBvc2l0aW9uID0gdGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIC8vIFRPRE8gQVBJOiBSZW1vdmUgYXMgdGhpcyBpcyBubyBsb25nZXIgdXNlZFxuICAgIGlmIChzdWdnZXN0aW9uLm9uV2lsbENvbmZpcm0pIHtcbiAgICAgIHN1Z2dlc3Rpb24ub25XaWxsQ29uZmlybSgpXG4gICAgfVxuXG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgIGlmIChzZWxlY3Rpb25zICYmIHNlbGVjdGlvbnMubGVuZ3RoKSB7XG4gICAgICBmb3IgKGNvbnN0IHMgb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICBpZiAocyAmJiBzLmNsZWFyKSB7XG4gICAgICAgICAgcy5jbGVhcigpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL3RoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KClcblxuICAgIC8vdGhpcy5yZXBsYWNlVGV4dFdpdGhNYXRjaChzdWdnZXN0aW9uKVxuXG4gICAgLy8gVE9ETyBBUEk6IFJlbW92ZSB3aGVuIHdlIHJlbW92ZSB0aGUgMS4wIEFQSVxuICAgIGlmIChhcGlJczIwKSB7XG4gICAgICBpZiAoc3VnZ2VzdGlvbi5wcm92aWRlciAmJiBzdWdnZXN0aW9uLnByb3ZpZGVyLm9uRGlkSW5zZXJ0U3VnZ2VzdGlvbikge1xuICAgICAgICBzdWdnZXN0aW9uLnByb3ZpZGVyLm9uRGlkSW5zZXJ0U3VnZ2VzdGlvbih7ZWRpdG9yOiB0aGlzLmVkaXRvciwgc3VnZ2VzdGlvbiwgdHJpZ2dlclBvc2l0aW9ufSlcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN1Z2dlc3Rpb24ub25EaWRDb25maXJtKSB7XG4gICAgICAgIHN1Z2dlc3Rpb24ub25EaWRDb25maXJtKClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzaG93U3VnZ2VzdGlvbkxpc3QgKHN1Z2dlc3Rpb25zLCBvcHRpb25zKSB7XG4gICAgaWYgKHRoaXMuZGlzcG9zZWQpIHsgcmV0dXJuIH1cbiAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0LmNoYW5nZUl0ZW1zKHN1Z2dlc3Rpb25zKVxuICAgIHJldHVybiB0aGlzLnN1Z2dlc3Rpb25MaXN0LnNob3codGhpcy5lZGl0b3IsIG9wdGlvbnMpXG4gIH1cblxuICBoaWRlU3VnZ2VzdGlvbkxpc3QgKCkge1xuICAgIGlmICh0aGlzLmRpc3Bvc2VkKSB7IHJldHVybiB9XG4gICAgdGhpcy5zdWdnZXN0aW9uTGlzdC5jaGFuZ2VJdGVtcyhudWxsKVxuICAgIHRoaXMuc3VnZ2VzdGlvbkxpc3QuaGlkZSgpXG4gICAgdGhpcy5zaG91bGREaXNwbGF5U3VnZ2VzdGlvbnMgPSBmYWxzZVxuICB9XG5cbiAgcmVxdWVzdEhpZGVTdWdnZXN0aW9uTGlzdCAoY29tbWFuZCkge1xuICAgIHRoaXMuaGlkZVRpbWVvdXQgPSBzZXRUaW1lb3V0KHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0LCAwKVxuICAgIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zID0gZmFsc2VcbiAgfVxuXG4gIGNhbmNlbEhpZGVTdWdnZXN0aW9uTGlzdFJlcXVlc3QgKCkge1xuICAgIHJldHVybiBjbGVhclRpbWVvdXQodGhpcy5oaWRlVGltZW91dClcbiAgfVxuXG4gIC8vIFByaXZhdGU6IFJlcGxhY2VzIHRoZSBjdXJyZW50IHByZWZpeCB3aXRoIHRoZSBnaXZlbiBtYXRjaC5cbiAgLy9cbiAgLy8gbWF0Y2ggLSBUaGUgbWF0Y2ggdG8gcmVwbGFjZSB0aGUgY3VycmVudCBwcmVmaXggd2l0aFxuICByZXBsYWNlVGV4dFdpdGhNYXRjaCAoc3VnZ2VzdGlvbikge1xuICAgIGlmICh0aGlzLmVkaXRvciA9PSBudWxsKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCBjdXJzb3JzID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgaWYgKGN1cnNvcnMgPT0gbnVsbCkgeyByZXR1cm4gfVxuXG4gICAgcmV0dXJuIHRoaXMuZWRpdG9yLnRyYW5zYWN0KCgpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY3Vyc29ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBjdXJzb3JzW2ldXG4gICAgICAgIGNvbnN0IGVuZFBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgY29uc3QgYmVnaW5uaW5nUG9zaXRpb24gPSBbZW5kUG9zaXRpb24ucm93LCBlbmRQb3NpdGlvbi5jb2x1bW4gLSBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4Lmxlbmd0aF1cblxuICAgICAgICBpZiAodGhpcy5lZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW2JlZ2lubmluZ1Bvc2l0aW9uLCBlbmRQb3NpdGlvbl0pID09PSBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4KSB7XG4gICAgICAgICAgY29uc3Qgc3VmZml4ID0gdGhpcy5jb25zdW1lU3VmZml4ID8gdGhpcy5nZXRTdWZmaXgodGhpcy5lZGl0b3IsIGVuZFBvc2l0aW9uLCBzdWdnZXN0aW9uKSA6ICcnXG4gICAgICAgICAgaWYgKHN1ZmZpeC5sZW5ndGgpIHsgY3Vyc29yLm1vdmVSaWdodChzdWZmaXgubGVuZ3RoKSB9XG4gICAgICAgICAgY3Vyc29yLnNlbGVjdGlvbi5zZWxlY3RMZWZ0KHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXgubGVuZ3RoICsgc3VmZml4Lmxlbmd0aClcblxuICAgICAgICAgIGlmICgoc3VnZ2VzdGlvbi5zbmlwcGV0ICE9IG51bGwpICYmICh0aGlzLnNuaXBwZXRzTWFuYWdlciAhPSBudWxsKSkge1xuICAgICAgICAgICAgdGhpcy5zbmlwcGV0c01hbmFnZXIuaW5zZXJ0U25pcHBldChzdWdnZXN0aW9uLnNuaXBwZXQsIHRoaXMuZWRpdG9yLCBjdXJzb3IpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnNvci5zZWxlY3Rpb24uaW5zZXJ0VGV4dChzdWdnZXN0aW9uLnRleHQgIT0gbnVsbCA/IHN1Z2dlc3Rpb24udGV4dCA6IHN1Z2dlc3Rpb24uc25pcHBldCwge1xuICAgICAgICAgICAgICBhdXRvSW5kZW50TmV3bGluZTogdGhpcy5lZGl0b3Iuc2hvdWxkQXV0b0luZGVudCgpLFxuICAgICAgICAgICAgICBhdXRvRGVjcmVhc2VJbmRlbnQ6IHRoaXMuZWRpdG9yLnNob3VsZEF1dG9JbmRlbnQoKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG5cblx0XHQgIGN1cnNvci5tb3ZlVG9FbmRPZldvcmQoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIClcbiAgfVxuXG4gIGdldFN1ZmZpeCAoZWRpdG9yLCBidWZmZXJQb3NpdGlvbiwgc3VnZ2VzdGlvbikge1xuICAgIC8vIFRoaXMganVzdCBjaGV3cyB0aHJvdWdoIHRoZSBzdWdnZXN0aW9uIGFuZCB0cmllcyB0byBtYXRjaCB0aGUgc3VnZ2VzdGlvblxuICAgIC8vIHN1YnN0cmluZyB3aXRoIHRoZSBsaW5lVGV4dCBzdGFydGluZyBhdCB0aGUgY3Vyc29yLiBUaGVyZSBpcyBwcm9iYWJseSBhXG4gICAgLy8gbW9yZSBlZmZpY2llbnQgd2F5IHRvIGRvIHRoaXMuXG4gICAgbGV0IHN1ZmZpeCA9IChzdWdnZXN0aW9uLnNuaXBwZXQgIT0gbnVsbCA/IHN1Z2dlc3Rpb24uc25pcHBldCA6IHN1Z2dlc3Rpb24udGV4dClcbiAgICBjb25zdCBlbmRQb3NpdGlvbiA9IFtidWZmZXJQb3NpdGlvbi5yb3csIGJ1ZmZlclBvc2l0aW9uLmNvbHVtbiArIHN1ZmZpeC5sZW5ndGhdXG4gICAgY29uc3QgZW5kT2ZMaW5lVGV4dCA9IGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbYnVmZmVyUG9zaXRpb24sIGVuZFBvc2l0aW9uXSlcbiAgICBjb25zdCBub25Xb3JkQ2hhcmFjdGVycyA9IG5ldyBTZXQoYXRvbS5jb25maWcuZ2V0KCdlZGl0b3Iubm9uV29yZENoYXJhY3RlcnMnKS5zcGxpdCgnJykpXG4gICAgd2hpbGUgKHN1ZmZpeCkge1xuICAgICAgaWYgKGVuZE9mTGluZVRleHQuc3RhcnRzV2l0aChzdWZmaXgpICYmICFub25Xb3JkQ2hhcmFjdGVycy5oYXMoc3VmZml4WzBdKSkgeyBicmVhayB9XG4gICAgICBzdWZmaXggPSBzdWZmaXguc2xpY2UoMSlcbiAgICB9XG4gICAgcmV0dXJuIHN1ZmZpeFxuICB9XG5cbiAgLy8gUHJpdmF0ZTogQ2hlY2tzIHdoZXRoZXIgdGhlIGN1cnJlbnQgZmlsZSBpcyBibGFja2xpc3RlZC5cbiAgLy9cbiAgLy8gUmV0dXJucyB7Qm9vbGVhbn0gdGhhdCBkZWZpbmVzIHdoZXRoZXIgdGhlIGN1cnJlbnQgZmlsZSBpcyBibGFja2xpc3RlZFxuICBpc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWQgKCkge1xuICAgIC8vIG1pbmltYXRjaCBpcyBzbG93LiBOb3QgbmVjZXNzYXJ5IHRvIGRvIHRoaXMgY29tcHV0YXRpb24gb24gZXZlcnkgcmVxdWVzdCBmb3Igc3VnZ2VzdGlvbnNcbiAgICBsZXQgbGVmdFxuICAgIGlmICh0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlICE9IG51bGwpIHsgcmV0dXJuIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgfVxuXG4gICAgaWYgKCh0aGlzLmZpbGVCbGFja2xpc3QgPT0gbnVsbCkgfHwgdGhpcy5maWxlQmxhY2tsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZSA9IGZhbHNlXG4gICAgICByZXR1cm4gdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbWluaW1hdGNoID09PSAndW5kZWZpbmVkJyB8fCBtaW5pbWF0Y2ggPT09IG51bGwpIHsgbWluaW1hdGNoID0gcmVxdWlyZSgnbWluaW1hdGNoJykgfVxuICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZSgobGVmdCA9IHRoaXMuYnVmZmVyLmdldFBhdGgoKSkgIT0gbnVsbCA/IGxlZnQgOiAnJylcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmlsZUJsYWNrbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYmxhY2tsaXN0R2xvYiA9IHRoaXMuZmlsZUJsYWNrbGlzdFtpXVxuICAgICAgaWYgKG1pbmltYXRjaChmaWxlTmFtZSwgYmxhY2tsaXN0R2xvYikpIHtcbiAgICAgICAgdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZSA9IHRydWVcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGVcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gZmFsc2VcbiAgICByZXR1cm4gdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogR2V0cyBjYWxsZWQgd2hlbiB0aGUgY29udGVudCBoYXMgYmVlbiBtb2RpZmllZFxuICByZXF1ZXN0TmV3U3VnZ2VzdGlvbnMgKCkge1xuICAgIGxldCBkZWxheSA9IGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLXBsdXMuYXV0b0FjdGl2YXRpb25EZWxheScpXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuZGVsYXlUaW1lb3V0KVxuICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25MaXN0LmlzQWN0aXZlKCkpIHsgZGVsYXkgPSB0aGlzLnN1Z2dlc3Rpb25EZWxheSB9XG4gICAgdGhpcy5kZWxheVRpbWVvdXQgPSBzZXRUaW1lb3V0KHRoaXMuZmluZFN1Z2dlc3Rpb25zLCBkZWxheSlcbiAgICB0aGlzLnNob3VsZERpc3BsYXlTdWdnZXN0aW9ucyA9IHRydWVcbiAgfVxuXG4gIGNhbmNlbE5ld1N1Z2dlc3Rpb25zUmVxdWVzdCAoKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuZGVsYXlUaW1lb3V0KVxuICAgIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zID0gZmFsc2VcbiAgfVxuXG4gIC8vIFByaXZhdGU6IEdldHMgY2FsbGVkIHdoZW4gdGhlIGN1cnNvciBoYXMgbW92ZWQuIENhbmNlbHMgdGhlIGF1dG9jb21wbGV0aW9uIGlmXG4gIC8vIHRoZSB0ZXh0IGhhcyBub3QgYmVlbiBjaGFuZ2VkLlxuICAvL1xuICAvLyBkYXRhIC0gQW4ge09iamVjdH0gY29udGFpbmluZyBpbmZvcm1hdGlvbiBvbiB3aHkgdGhlIGN1cnNvciBoYXMgYmVlbiBtb3ZlZFxuICBjdXJzb3JNb3ZlZCAoe3RleHRDaGFuZ2VkfSkge1xuICAgIC8vIFRoZSBkZWxheSBpcyBhIHdvcmthcm91bmQgZm9yIHRoZSBiYWNrc3BhY2UgY2FzZS4gVGhlIHdheSBhdG9tIGltcGxlbWVudHNcbiAgICAvLyBiYWNrc3BhY2UgaXMgdG8gc2VsZWN0IGxlZnQgMSBjaGFyLCB0aGVuIGRlbGV0ZS4gVGhpcyByZXN1bHRzIGluIGFcbiAgICAvLyBjdXJzb3JNb3ZlZCBldmVudCB3aXRoIHRleHRDaGFuZ2VkID09IGZhbHNlLiBTbyB3ZSBkZWxheSwgYW5kIGlmIHRoZVxuICAgIC8vIGJ1ZmZlckNoYW5nZWQgaGFuZGxlciBkZWNpZGVzIHRvIHNob3cgc3VnZ2VzdGlvbnMsIGl0IHdpbGwgY2FuY2VsIHRoZVxuICAgIC8vIGhpZGVTdWdnZXN0aW9uTGlzdCByZXF1ZXN0LiBJZiB0aGVyZSBpcyBubyBidWZmZXJDaGFuZ2VkIGV2ZW50LFxuICAgIC8vIHN1Z2dlc3Rpb25MaXN0IHdpbGwgYmUgaGlkZGVuLlxuICAgIGlmICghdGV4dENoYW5nZWQgJiYgIXRoaXMuc2hvdWxkQWN0aXZhdGUpIHsgcmV0dXJuIHRoaXMucmVxdWVzdEhpZGVTdWdnZXN0aW9uTGlzdCgpIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IEdldHMgY2FsbGVkIHdoZW4gdGhlIHVzZXIgc2F2ZXMgdGhlIGRvY3VtZW50LiBDYW5jZWxzIHRoZVxuICAvLyBhdXRvY29tcGxldGlvbi5cbiAgYnVmZmVyU2F2ZWQgKCkge1xuICAgIGlmICghdGhpcy5hdXRvc2F2ZUVuYWJsZWQpIHsgcmV0dXJuIHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KCkgfVxuICB9XG5cbiAgdG9nZ2xlQWN0aXZhdGlvbkZvckJ1ZmZlckNoYW5nZSAoe25ld1RleHQsIG5ld1JhbmdlLCBvbGRUZXh0LCBvbGRSYW5nZX0pIHtcbiAgICBpZiAodGhpcy5kaXNwb3NlZCkgeyByZXR1cm4gfVxuICAgIGlmICh0aGlzLnNob3VsZEFjdGl2YXRlKSB7IHJldHVybiB9XG4gICAgaWYgKHRoaXMuY29tcG9zaXRpb25JblByb2dyZXNzKSB7IHJldHVybiB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCgpIH1cblxuICAgIGlmICh0aGlzLmF1dG9BY3RpdmF0aW9uRW5hYmxlZCB8fCB0aGlzLnN1Z2dlc3Rpb25MaXN0LmlzQWN0aXZlKCkpIHtcbiAgICAgIGlmIChuZXdUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gQWN0aXZhdGUgb24gc3BhY2UsIGEgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyLCBvciBhIGJyYWNrZXQtbWF0Y2hlciBwYWlyLlxuICAgICAgICBpZiAobmV3VGV4dCA9PT0gJyAnIHx8IG5ld1RleHQudHJpbSgpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIHRoaXMuc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV3VGV4dC5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgdGhpcy5icmFja2V0TWF0Y2hlclBhaXJzKSB7XG4gICAgICAgICAgICBpZiAobmV3VGV4dCA9PT0gcGFpcikge1xuICAgICAgICAgICAgICB0aGlzLnNob3VsZEFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChvbGRUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gU3VnZ2VzdGlvbiBsaXN0IG11c3QgYmUgZWl0aGVyIGFjdGl2ZSBvciBiYWNrc3BhY2VUcmlnZ2Vyc0F1dG9jb21wbGV0ZSBtdXN0IGJlIHRydWUgZm9yIGFjdGl2YXRpb24gdG8gb2NjdXIuXG4gICAgICAgIC8vIEFjdGl2YXRlIG9uIHJlbW92YWwgb2YgYSBzcGFjZSwgYSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIsIG9yIGEgYnJhY2tldC1tYXRjaGVyIHBhaXIuXG4gICAgICAgIGlmICh0aGlzLmJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlIHx8IHRoaXMuc3VnZ2VzdGlvbkxpc3QuaXNBY3RpdmUoKSkge1xuICAgICAgICAgIGlmIChvbGRUZXh0Lmxlbmd0aCA+IDAgJiYgKHRoaXMuYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgfHwgdGhpcy5zdWdnZXN0aW9uTGlzdC5pc0FjdGl2ZSgpKSkge1xuICAgICAgICAgICAgaWYgKG9sZFRleHQgPT09ICcgJyB8fCBvbGRUZXh0LnRyaW0oKS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9sZFRleHQubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAgIGZvciAoY29uc3QgcGFpciBvZiB0aGlzLmJyYWNrZXRNYXRjaGVyUGFpcnMpIHtcbiAgICAgICAgICAgICAgICBpZiAob2xkVGV4dCA9PT0gcGFpcikge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc2hvdWxkQWN0aXZhdGUgJiYgdGhpcy5zaG91bGRTdXBwcmVzc0FjdGl2YXRpb25Gb3JFZGl0b3JDbGFzc2VzKCkpIHtcbiAgICAgICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IGZhbHNlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlcyAoe2NoYW5nZXN9KSB7XG4gICAgY29uc3QgbGFzdEN1cnNvclBvc2l0aW9uID0gdGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBjb25zdCBjaGFuZ2VPY2N1cnJlZE5lYXJMYXN0Q3Vyc29yID0gY2hhbmdlcy5zb21lKCh7c3RhcnQsIG5ld0V4dGVudH0pID0+IHtcbiAgICAgIGNvbnN0IG5ld1JhbmdlID0gbmV3IFJhbmdlKHN0YXJ0LCBzdGFydC50cmF2ZXJzZShuZXdFeHRlbnQpKVxuICAgICAgcmV0dXJuIG5ld1JhbmdlLmNvbnRhaW5zUG9pbnQobGFzdEN1cnNvclBvc2l0aW9uKVxuICAgIH0pXG5cbiAgICBpZiAodGhpcy5zaG91bGRBY3RpdmF0ZSAmJiBjaGFuZ2VPY2N1cnJlZE5lYXJMYXN0Q3Vyc29yKSB7XG4gICAgICB0aGlzLmNhbmNlbEhpZGVTdWdnZXN0aW9uTGlzdFJlcXVlc3QoKVxuICAgICAgdGhpcy5yZXF1ZXN0TmV3U3VnZ2VzdGlvbnMoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbmNlbE5ld1N1Z2dlc3Rpb25zUmVxdWVzdCgpXG4gICAgICAvL3RoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KClcbiAgICB9XG5cbiAgICB0aGlzLnNob3VsZEFjdGl2YXRlID0gZmFsc2VcbiAgfVxuXG4gIHNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZSAoe25ld1RleHQsIG5ld1JhbmdlLCBvbGRUZXh0LCBvbGRSYW5nZX0pIHtcbiAgICBpZiAodGhpcy5kaXNwb3NlZCkgeyByZXR1cm4gfVxuICAgIGlmICh0aGlzLmNvbXBvc2l0aW9uSW5Qcm9ncmVzcykgeyByZXR1cm4gdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKSB9XG4gICAgbGV0IHNob3VsZEFjdGl2YXRlID0gZmFsc2VcbiAgICBjb25zdCBjdXJzb3JQb3NpdGlvbnMgPSB0aGlzLmVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbnMoKVxuXG4gICAgaWYgKHRoaXMuYXV0b0FjdGl2YXRpb25FbmFibGVkIHx8IHRoaXMuc3VnZ2VzdGlvbkxpc3QuaXNBY3RpdmUoKSkge1xuICAgICAgLy8gQWN0aXZhdGUgb24gc3BhY2UsIGEgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyLCBvciBhIGJyYWNrZXQtbWF0Y2hlciBwYWlyLlxuICAgICAgaWYgKG5ld1RleHQubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAoY3Vyc29yUG9zaXRpb25zLnNvbWUoKHBvc2l0aW9uKSA9PiB7IHJldHVybiBuZXdSYW5nZS5jb250YWluc1BvaW50KHBvc2l0aW9uKSB9KSkge1xuICAgICAgICAgIGlmIChuZXdUZXh0ID09PSAnICcgfHwgbmV3VGV4dC50cmltKCkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5ld1RleHQubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgdGhpcy5icmFja2V0TWF0Y2hlclBhaXJzKSB7XG4gICAgICAgICAgICAgIGlmIChuZXdUZXh0ID09PSBwYWlyKSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIC8vIFN1Z2dlc3Rpb24gbGlzdCBtdXN0IGJlIGVpdGhlciBhY3RpdmUgb3IgYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgbXVzdCBiZSB0cnVlIGZvciBhY3RpdmF0aW9uIHRvIG9jY3VyLlxuICAgICAgLy8gQWN0aXZhdGUgb24gcmVtb3ZhbCBvZiBhIHNwYWNlLCBhIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3Rlciwgb3IgYSBicmFja2V0LW1hdGNoZXIgcGFpci5cbiAgICAgIH0gZWxzZSBpZiAob2xkVGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmICgodGhpcy5iYWNrc3BhY2VUcmlnZ2Vyc0F1dG9jb21wbGV0ZSB8fCB0aGlzLnN1Z2dlc3Rpb25MaXN0LmlzQWN0aXZlKCkpICYmXG4gICAgICAgIChjdXJzb3JQb3NpdGlvbnMuc29tZSgocG9zaXRpb24pID0+IHsgcmV0dXJuIG5ld1JhbmdlLmNvbnRhaW5zUG9pbnQocG9zaXRpb24pIH0pKSkge1xuICAgICAgICAgIGlmIChvbGRUZXh0ID09PSAnICcgfHwgb2xkVGV4dC50cmltKCkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBzaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG9sZFRleHQubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgdGhpcy5icmFja2V0TWF0Y2hlclBhaXJzKSB7XG4gICAgICAgICAgICAgIGlmIChvbGRUZXh0ID09PSBwYWlyKSB7XG4gICAgICAgICAgICAgICAgc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHNob3VsZEFjdGl2YXRlICYmIHRoaXMuc2hvdWxkU3VwcHJlc3NBY3RpdmF0aW9uRm9yRWRpdG9yQ2xhc3NlcygpKSB7IHNob3VsZEFjdGl2YXRlID0gZmFsc2UgfVxuICAgIH1cblxuICAgIGlmIChzaG91bGRBY3RpdmF0ZSkge1xuICAgICAgdGhpcy5jYW5jZWxIaWRlU3VnZ2VzdGlvbkxpc3RSZXF1ZXN0KClcbiAgICAgIHRoaXMucmVxdWVzdE5ld1N1Z2dlc3Rpb25zKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYW5jZWxOZXdTdWdnZXN0aW9uc1JlcXVlc3QoKVxuICAgICAgdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKVxuICAgIH1cbiAgfVxuXG4gIHNob3VsZFN1cHByZXNzQWN0aXZhdGlvbkZvckVkaXRvckNsYXNzZXMgKCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zdXBwcmVzc0ZvckNsYXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNsYXNzTmFtZXMgPSB0aGlzLnN1cHByZXNzRm9yQ2xhc3Nlc1tpXVxuICAgICAgbGV0IGNvbnRhaW5zQ291bnQgPSAwXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNsYXNzTmFtZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gY2xhc3NOYW1lc1tqXVxuICAgICAgICBpZiAodGhpcy5lZGl0b3JWaWV3LmNsYXNzTGlzdC5jb250YWlucyhjbGFzc05hbWUpKSB7IGNvbnRhaW5zQ291bnQgKz0gMSB9XG4gICAgICB9XG4gICAgICBpZiAoY29udGFpbnNDb3VudCA9PT0gY2xhc3NOYW1lcy5sZW5ndGgpIHsgcmV0dXJuIHRydWUgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ2xlYW4gdXAsIHN0b3AgbGlzdGVuaW5nIHRvIGV2ZW50c1xuICBkaXNwb3NlICgpIHtcbiAgICB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCgpXG4gICAgdGhpcy5kaXNwb3NlZCA9IHRydWVcbiAgICB0aGlzLnJlYWR5ID0gZmFsc2VcbiAgICBpZiAodGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgfVxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICBpZiAodGhpcy5zdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgfVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0ID0gbnVsbFxuICAgIHRoaXMucHJvdmlkZXJNYW5hZ2VyID0gbnVsbFxuICB9XG59XG4iXX0=