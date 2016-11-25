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

            //cursor.moveToEndOfWord()
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvYXV0b2NvbXBsZXRlLW1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztvQkFFdUQsTUFBTTs7b0JBQzVDLE1BQU07Ozs7c0JBQ0osUUFBUTs7OzswQkFDSixZQUFZOzs7OzhCQUNSLGlCQUFpQjs7OzsrQkFFaEIsb0JBQW9COzs7OzhCQUNyQixtQkFBbUI7Ozs7cUNBQ1osMkJBQTJCOzs7OzhCQUM5QixtQkFBbUI7OztBQVhsRCxXQUFXLENBQUE7O0FBY1gsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQTs7SUFFTSxtQkFBbUI7QUFDMUIsV0FETyxtQkFBbUIsR0FDdkI7OzswQkFESSxtQkFBbUI7O0FBRXBDLFFBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFBO0FBQzVCLFFBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUE7QUFDekMsUUFBSSxDQUFDLGtDQUFrQyxHQUFHLElBQUksQ0FBQTtBQUM5QyxRQUFJLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUN2RixRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQTtBQUNsQixRQUFJLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFBO0FBQ2xDLFFBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFBO0FBQ3JCLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO0FBQ2xCLFFBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUE7QUFDL0IsUUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUE7QUFDdEIsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7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UyxDQUFDLEVBQUU7QUFBRSx5QkFBYSxJQUFJLENBQUMsQ0FBQTtXQUFFO1NBQzFFO0FBQ0QsWUFBSSxhQUFhLEtBQUssVUFBVSxDQUFDLE1BQU0sRUFBRTtBQUFFLGlCQUFPLElBQUksQ0FBQTtTQUFFO09BQ3pEO0FBQ0QsYUFBTyxLQUFLLENBQUE7S0FDYjs7Ozs7V0FHTyxtQkFBRztBQUNULFVBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO0FBQ3pCLFVBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLFVBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO0FBQ2xCLFVBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO0FBQzVCLFlBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtPQUNuQztBQUNELFVBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUE7QUFDL0IsVUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3RCLFlBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7T0FDN0I7QUFDRCxVQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQTtBQUN6QixVQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQTtBQUMxQixVQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQTtLQUM1Qjs7O1NBbHZCa0IsbUJBQW1COzs7cUJBQW5CLG1CQUFtQiIsImZpbGUiOiIvaG9tZS9qYW1lcy9naXRodWIvYXV0b2NvbXBsZXRlLXBsdXMvbGliL2F1dG9jb21wbGV0ZS1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuaW1wb3J0IHsgUmFuZ2UsIENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJ1xuaW1wb3J0IGZ1enphbGRyaW4gZnJvbSAnZnV6emFsZHJpbidcbmltcG9ydCBmdXp6YWxkcmluUGx1cyBmcm9tICdmdXp6YWxkcmluLXBsdXMnXG5cbmltcG9ydCBQcm92aWRlck1hbmFnZXIgZnJvbSAnLi9wcm92aWRlci1tYW5hZ2VyJ1xuaW1wb3J0IFN1Z2dlc3Rpb25MaXN0IGZyb20gJy4vc3VnZ2VzdGlvbi1saXN0J1xuaW1wb3J0IFN1Z2dlc3Rpb25MaXN0RWxlbWVudCBmcm9tICcuL3N1Z2dlc3Rpb24tbGlzdC1lbGVtZW50J1xuaW1wb3J0IHsgVW5pY29kZUxldHRlcnMgfSBmcm9tICcuL3VuaWNvZGUtaGVscGVycydcblxuLy8gRGVmZXJyZWQgcmVxdWlyZXNcbmxldCBtaW5pbWF0Y2ggPSBudWxsXG5sZXQgZ3JpbSA9IG51bGxcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXV0b2NvbXBsZXRlTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmF1dG9zYXZlRW5hYmxlZCA9IGZhbHNlXG4gICAgdGhpcy5iYWNrc3BhY2VUcmlnZ2Vyc0F1dG9jb21wbGV0ZSA9IHRydWVcbiAgICB0aGlzLmF1dG9Db25maXJtU2luZ2xlU3VnZ2VzdGlvbkVuYWJsZWQgPSB0cnVlXG4gICAgdGhpcy5icmFja2V0TWF0Y2hlclBhaXJzID0gWycoKScsICdbXScsICd7fScsICdcIlwiJywgXCInJ1wiLCAnYGAnLCAn4oCc4oCdJywgJ+KAmOKAmScsICfCq8K7JywgJ+KAueKAuiddXG4gICAgdGhpcy5idWZmZXIgPSBudWxsXG4gICAgdGhpcy5jb21wb3NpdGlvbkluUHJvZ3Jlc3MgPSBmYWxzZVxuICAgIHRoaXMuZGlzcG9zZWQgPSBmYWxzZVxuICAgIHRoaXMuZWRpdG9yID0gbnVsbFxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICB0aGlzLmVkaXRvclZpZXcgPSBudWxsXG4gICAgdGhpcy5wcm92aWRlck1hbmFnZXIgPSBudWxsXG4gICAgdGhpcy5yZWFkeSA9IGZhbHNlXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbnVsbFxuICAgIHRoaXMuc3VnZ2VzdGlvbkRlbGF5ID0gNTBcbiAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0ID0gbnVsbFxuICAgIHRoaXMuc3VwcHJlc3NGb3JDbGFzc2VzID0gW11cbiAgICB0aGlzLnNob3VsZERpc3BsYXlTdWdnZXN0aW9ucyA9IGZhbHNlXG4gICAgdGhpcy5wcmVmaXhSZWdleCA9IG51bGxcbiAgICB0aGlzLndvcmRQcmVmaXhSZWdleCA9IG51bGxcbiAgICB0aGlzLnVwZGF0ZUN1cnJlbnRFZGl0b3IgPSB0aGlzLnVwZGF0ZUN1cnJlbnRFZGl0b3IuYmluZCh0aGlzKVxuICAgIHRoaXMuaGFuZGxlQ29tbWFuZHMgPSB0aGlzLmhhbmRsZUNvbW1hbmRzLmJpbmQodGhpcylcbiAgICB0aGlzLmZpbmRTdWdnZXN0aW9ucyA9IHRoaXMuZmluZFN1Z2dlc3Rpb25zLmJpbmQodGhpcylcbiAgICB0aGlzLmdldFN1Z2dlc3Rpb25zRnJvbVByb3ZpZGVycyA9IHRoaXMuZ2V0U3VnZ2VzdGlvbnNGcm9tUHJvdmlkZXJzLmJpbmQodGhpcylcbiAgICB0aGlzLmRpc3BsYXlTdWdnZXN0aW9ucyA9IHRoaXMuZGlzcGxheVN1Z2dlc3Rpb25zLmJpbmQodGhpcylcbiAgICB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCA9IHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0LmJpbmQodGhpcylcblxuICAgIHRoaXMudG9nZ2xlQWN0aXZhdGlvbkZvckJ1ZmZlckNoYW5nZSA9IHRoaXMudG9nZ2xlQWN0aXZhdGlvbkZvckJ1ZmZlckNoYW5nZS5iaW5kKHRoaXMpXG4gICAgdGhpcy5zaG93T3JIaWRlU3VnZ2VzdGlvbkxpc3RGb3JCdWZmZXJDaGFuZ2VzID0gdGhpcy5zaG93T3JIaWRlU3VnZ2VzdGlvbkxpc3RGb3JCdWZmZXJDaGFuZ2VzLmJpbmQodGhpcylcbiAgICB0aGlzLnNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZSA9IHRoaXMuc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlLmJpbmQodGhpcylcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5wcm92aWRlck1hbmFnZXIgPSBuZXcgUHJvdmlkZXJNYW5hZ2VyKClcbiAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0ID0gbmV3IFN1Z2dlc3Rpb25MaXN0KClcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuZW5hYmxlRXh0ZW5kZWRVbmljb2RlU3VwcG9ydCcsIGVuYWJsZUV4dGVuZGVkVW5pY29kZVN1cHBvcnQgPT4ge1xuICAgICAgaWYgKGVuYWJsZUV4dGVuZGVkVW5pY29kZVN1cHBvcnQpIHtcbiAgICAgICAgdGhpcy5wcmVmaXhSZWdleCA9IG5ldyBSZWdFeHAoYChbJ1wiflxcYCFAI1xcXFwkJV4mKlxcXFwoXFxcXClcXFxce1xcXFx9XFxcXFtcXFxcXT0rLC9cXFxcPz5dKT8oKFske1VuaWNvZGVMZXR0ZXJzfVxcXFxkX10rWyR7VW5pY29kZUxldHRlcnN9XFxcXGRfLV0qKXwoWy46O1t7KDwgXSspKSRgKVxuICAgICAgICB0aGlzLndvcmRQcmVmaXhSZWdleCA9IG5ldyBSZWdFeHAoYF5bJHtVbmljb2RlTGV0dGVyc31cXFxcZF9dK1ske1VuaWNvZGVMZXR0ZXJzfVxcXFxkXy1dKiRgKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5wcmVmaXhSZWdleCA9IC8oXFxifFsnXCJ+YCFAI1xcJCVeJipcXChcXClcXHtcXH1cXFtcXF09XFwrLC9cXD8+XSkoKFxcdytbXFx3LV0qKXwoWy46O1t7KDwgXSspKSQvXG4gICAgICAgIHRoaXMud29yZFByZWZpeFJlZ2V4ID0gL15cXHcrW1xcdy1dKiQvXG4gICAgICB9XG4gICAgfVxuICAgICkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLnByb3ZpZGVyTWFuYWdlcilcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20udmlld3MuYWRkVmlld1Byb3ZpZGVyKFN1Z2dlc3Rpb25MaXN0LCAobW9kZWwpID0+IHtcbiAgICAgIHJldHVybiBuZXcgU3VnZ2VzdGlvbkxpc3RFbGVtZW50KCkuaW5pdGlhbGl6ZShtb2RlbClcbiAgICB9KSlcblxuICAgIHRoaXMuaGFuZGxlRXZlbnRzKClcbiAgICB0aGlzLmhhbmRsZUNvbW1hbmRzKClcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuc3VnZ2VzdGlvbkxpc3QpIC8vIFdlJ3JlIGFkZGluZyB0aGlzIGxhc3Qgc28gaXQgaXMgZGlzcG9zZWQgYWZ0ZXIgZXZlbnRzXG4gICAgdGhpcy5yZWFkeSA9IHRydWVcbiAgfVxuXG4gIHNldFNuaXBwZXRzTWFuYWdlciAoc25pcHBldHNNYW5hZ2VyKSB7XG4gICAgdGhpcy5zbmlwcGV0c01hbmFnZXIgPSBzbmlwcGV0c01hbmFnZXJcbiAgfVxuXG4gIHVwZGF0ZUN1cnJlbnRFZGl0b3IgKGN1cnJlbnRFZGl0b3IpIHtcbiAgICBpZiAoKGN1cnJlbnRFZGl0b3IgPT0gbnVsbCkgfHwgY3VycmVudEVkaXRvciA9PT0gdGhpcy5lZGl0b3IpIHsgcmV0dXJuIH1cbiAgICBpZiAodGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgfVxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucyA9IG51bGxcblxuICAgIC8vIFN0b3AgdHJhY2tpbmcgZWRpdG9yICsgYnVmZmVyXG4gICAgdGhpcy5lZGl0b3IgPSBudWxsXG4gICAgdGhpcy5lZGl0b3JWaWV3ID0gbnVsbFxuICAgIHRoaXMuYnVmZmVyID0gbnVsbFxuICAgIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgPSBudWxsXG5cbiAgICBpZiAoIXRoaXMuZWRpdG9ySXNWYWxpZChjdXJyZW50RWRpdG9yKSkgeyByZXR1cm4gfVxuXG4gICAgLy8gVHJhY2sgdGhlIG5ldyBlZGl0b3IsIGVkaXRvclZpZXcsIGFuZCBidWZmZXJcbiAgICB0aGlzLmVkaXRvciA9IGN1cnJlbnRFZGl0b3JcbiAgICB0aGlzLmVkaXRvclZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcodGhpcy5lZGl0b3IpXG4gICAgdGhpcy5idWZmZXIgPSB0aGlzLmVkaXRvci5nZXRCdWZmZXIoKVxuXG4gICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG4gICAgLy8gU3Vic2NyaWJlIHRvIGJ1ZmZlciBldmVudHM6XG4gICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmJ1ZmZlci5vbkRpZFNhdmUoKGUpID0+IHsgdGhpcy5idWZmZXJTYXZlZChlKSB9KSlcbiAgICBpZiAodHlwZW9mIHRoaXMuYnVmZmVyLm9uRGlkQ2hhbmdlVGV4dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmJ1ZmZlci5vbkRpZENoYW5nZSh0aGlzLnRvZ2dsZUFjdGl2YXRpb25Gb3JCdWZmZXJDaGFuZ2UpKVxuICAgICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmJ1ZmZlci5vbkRpZENoYW5nZVRleHQodGhpcy5zaG93T3JIaWRlU3VnZ2VzdGlvbkxpc3RGb3JCdWZmZXJDaGFuZ2VzKSlcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETzogUmVtb3ZlIHRoaXMgYWZ0ZXIgYFRleHRCdWZmZXIucHJvdG90eXBlLm9uRGlkQ2hhbmdlVGV4dGAgbGFuZHMgb24gQXRvbSBzdGFibGUuXG4gICAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuYnVmZmVyLm9uRGlkQ2hhbmdlKHRoaXMuc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlKSlcbiAgICB9XG5cbiAgICAvLyBXYXRjaCBJTUUgRXZlbnRzIFRvIEFsbG93IElNRSBUbyBGdW5jdGlvbiBXaXRob3V0IFRoZSBTdWdnZXN0aW9uIExpc3QgU2hvd2luZ1xuICAgIGNvbnN0IGNvbXBvc2l0aW9uU3RhcnQgPSAoKSA9PiB7XG4gICAgICB0aGlzLmNvbXBvc2l0aW9uSW5Qcm9ncmVzcyA9IHRydWVcbiAgICB9XG4gICAgY29uc3QgY29tcG9zaXRpb25FbmQgPSAoKSA9PiB7XG4gICAgICB0aGlzLmNvbXBvc2l0aW9uSW5Qcm9ncmVzcyA9IGZhbHNlXG4gICAgfVxuXG4gICAgdGhpcy5lZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbXBvc2l0aW9uc3RhcnQnLCBjb21wb3NpdGlvblN0YXJ0KVxuICAgIHRoaXMuZWRpdG9yVmlldy5hZGRFdmVudExpc3RlbmVyKCdjb21wb3NpdGlvbmVuZCcsIGNvbXBvc2l0aW9uRW5kKVxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQobmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZWRpdG9yVmlldykge1xuICAgICAgICB0aGlzLmVkaXRvclZpZXcucmVtb3ZlRXZlbnRMaXN0ZW5lcignY29tcG9zaXRpb25zdGFydCcsIGNvbXBvc2l0aW9uU3RhcnQpXG4gICAgICAgIHRoaXMuZWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdjb21wb3NpdGlvbmVuZCcsIGNvbXBvc2l0aW9uRW5kKVxuICAgICAgfVxuICAgIH0pKVxuXG4gICAgLy8gU3Vic2NyaWJlIHRvIGVkaXRvciBldmVudHM6XG4gICAgLy8gQ2xvc2UgdGhlIG92ZXJsYXkgd2hlbiB0aGUgY3Vyc29yIG1vdmVkIHdpdGhvdXQgY2hhbmdpbmcgYW55IHRleHRcbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oKGUpID0+IHsgdGhpcy5jdXJzb3JNb3ZlZChlKSB9KSlcbiAgICByZXR1cm4gdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmFkZCh0aGlzLmVkaXRvci5vbkRpZENoYW5nZVBhdGgoKCkgPT4ge1xuICAgICAgdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZSA9IG51bGxcbiAgICB9KSlcbiAgfVxuXG4gIGVkaXRvcklzVmFsaWQgKGVkaXRvcikge1xuICAgIC8vIFRPRE86IHJlbW92ZSBjb25kaXRpb25hbCB3aGVuIGBpc1RleHRFZGl0b3JgIGlzIHNoaXBwZWQuXG4gICAgaWYgKHR5cGVvZiBhdG9tLndvcmtzcGFjZS5pc1RleHRFZGl0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBhdG9tLndvcmtzcGFjZS5pc1RleHRFZGl0b3IoZWRpdG9yKVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZWRpdG9yID09IG51bGwpIHsgcmV0dXJuIGZhbHNlIH1cbiAgICAgIC8vIFNob3VsZCB3ZSBkaXNxdWFsaWZ5IFRleHRFZGl0b3JzIHdpdGggdGhlIEdyYW1tYXIgdGV4dC5wbGFpbi5udWxsLWdyYW1tYXI/XG4gICAgICByZXR1cm4gKGVkaXRvci5nZXRUZXh0ICE9IG51bGwpXG4gICAgfVxuICB9XG5cbiAgaGFuZGxlRXZlbnRzICgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20udGV4dEVkaXRvcnMub2JzZXJ2ZSgoZWRpdG9yKSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcilcbiAgICAgIGlmICh2aWV3ID09PSBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmNsb3Nlc3QoJ2F0b20tdGV4dC1lZGl0b3InKSkge1xuICAgICAgICB0aGlzLnVwZGF0ZUN1cnJlbnRFZGl0b3IoZWRpdG9yKVxuICAgICAgfVxuICAgICAgdmlldy5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIChlbGVtZW50KSA9PiB7XG4gICAgICAgIHRoaXMudXBkYXRlQ3VycmVudEVkaXRvcihlZGl0b3IpXG4gICAgICB9KVxuICAgIH0pKVxuXG4gICAgLy8gV2F0Y2ggY29uZmlnIHZhbHVlc1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b3NhdmUuZW5hYmxlZCcsICh2YWx1ZSkgPT4geyB0aGlzLmF1dG9zYXZlRW5hYmxlZCA9IHZhbHVlIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUnLCAodmFsdWUpID0+IHsgdGhpcy5iYWNrc3BhY2VUcmlnZ2Vyc0F1dG9jb21wbGV0ZSA9IHZhbHVlIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuZW5hYmxlQXV0b0FjdGl2YXRpb24nLCAodmFsdWUpID0+IHsgdGhpcy5hdXRvQWN0aXZhdGlvbkVuYWJsZWQgPSB2YWx1ZSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmVuYWJsZUF1dG9Db25maXJtU2luZ2xlU3VnZ2VzdGlvbicsICh2YWx1ZSkgPT4geyB0aGlzLmF1dG9Db25maXJtU2luZ2xlU3VnZ2VzdGlvbkVuYWJsZWQgPSB2YWx1ZSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLmNvbnN1bWVTdWZmaXgnLCAodmFsdWUpID0+IHsgdGhpcy5jb25zdW1lU3VmZml4ID0gdmFsdWUgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy51c2VBbHRlcm5hdGVTY29yaW5nJywgKHZhbHVlKSA9PiB7IHRoaXMudXNlQWx0ZXJuYXRlU2NvcmluZyA9IHZhbHVlIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuZmlsZUJsYWNrbGlzdCcsICh2YWx1ZSkgPT4ge1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZmlsZUJsYWNrbGlzdCA9IHZhbHVlLm1hcCgocykgPT4geyByZXR1cm4gcy50cmltKCkgfSlcbiAgICAgIH1cbiAgICAgIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgPSBudWxsXG4gICAgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5zdXBwcmVzc0FjdGl2YXRpb25Gb3JFZGl0b3JDbGFzc2VzJywgdmFsdWUgPT4ge1xuICAgICAgdGhpcy5zdXBwcmVzc0ZvckNsYXNzZXMgPSBbXVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBzZWxlY3RvciA9IHZhbHVlW2ldXG4gICAgICAgIGNvbnN0IGNsYXNzZXMgPSAoc2VsZWN0b3IudHJpbSgpLnNwbGl0KCcuJykuZmlsdGVyKChjbGFzc05hbWUpID0+IGNsYXNzTmFtZS50cmltKCkpLm1hcCgoY2xhc3NOYW1lKSA9PiBjbGFzc05hbWUudHJpbSgpKSlcbiAgICAgICAgaWYgKGNsYXNzZXMubGVuZ3RoKSB7IHRoaXMuc3VwcHJlc3NGb3JDbGFzc2VzLnB1c2goY2xhc3NlcykgfVxuICAgICAgfVxuICAgIH0pKVxuXG4gICAgLy8gSGFuZGxlIGV2ZW50cyBmcm9tIHN1Z2dlc3Rpb24gbGlzdFxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5zdWdnZXN0aW9uTGlzdC5vbkRpZENvbmZpcm0oKGUpID0+IHsgdGhpcy5jb25maXJtKGUpIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5zdWdnZXN0aW9uTGlzdC5vbkRpZENhbmNlbCh0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCkpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuc3VnZ2VzdGlvbkxpc3Qub25SZXBsYWNlKChlKSA9PiB7IHRoaXMucmVwbGFjZVRleHRXaXRoTWF0Y2goZSkgfSkpXG4gIH1cblxuICBoYW5kbGVDb21tYW5kcyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5hZGQoJ2F0b20tdGV4dC1lZGl0b3InLCB7XG4gICAgICAnYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGUnOiAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5zaG91bGREaXNwbGF5U3VnZ2VzdGlvbnMgPSB0cnVlXG4gICAgICAgIGxldCBhY3RpdmF0ZWRNYW51YWxseSA9IHRydWVcbiAgICAgICAgaWYgKGV2ZW50LmRldGFpbCAmJiBldmVudC5kZXRhaWwuYWN0aXZhdGVkTWFudWFsbHkgIT09IG51bGwgJiYgdHlwZW9mIGV2ZW50LmRldGFpbC5hY3RpdmF0ZWRNYW51YWxseSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBhY3RpdmF0ZWRNYW51YWxseSA9IGV2ZW50LmRldGFpbC5hY3RpdmF0ZWRNYW51YWxseVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmluZFN1Z2dlc3Rpb25zKGFjdGl2YXRlZE1hbnVhbGx5KVxuICAgICAgfVxuICAgIH0pKVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogRmluZHMgc3VnZ2VzdGlvbnMgZm9yIHRoZSBjdXJyZW50IHByZWZpeCwgc2V0cyB0aGUgbGlzdCBpdGVtcyxcbiAgLy8gcG9zaXRpb25zIHRoZSBvdmVybGF5IGFuZCBzaG93cyBpdFxuICBmaW5kU3VnZ2VzdGlvbnMgKGFjdGl2YXRlZE1hbnVhbGx5KSB7XG4gICAgaWYgKHRoaXMuZGlzcG9zZWQpIHsgcmV0dXJuIH1cbiAgICBpZiAoKHRoaXMucHJvdmlkZXJNYW5hZ2VyID09IG51bGwpIHx8ICh0aGlzLmVkaXRvciA9PSBudWxsKSB8fCAodGhpcy5idWZmZXIgPT0gbnVsbCkpIHsgcmV0dXJuIH1cbiAgICBpZiAodGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWQoKSkgeyByZXR1cm4gfVxuICAgIGNvbnN0IGN1cnNvciA9IHRoaXMuZWRpdG9yLmdldExhc3RDdXJzb3IoKVxuICAgIGlmIChjdXJzb3IgPT0gbnVsbCkgeyByZXR1cm4gfVxuXG4gICAgY29uc3QgYnVmZmVyUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIGNvbnN0IHNjb3BlRGVzY3JpcHRvciA9IGN1cnNvci5nZXRTY29wZURlc2NyaXB0b3IoKVxuICAgIGNvbnN0IHByZWZpeCA9IHRoaXMuZ2V0UHJlZml4KHRoaXMuZWRpdG9yLCBidWZmZXJQb3NpdGlvbilcblxuICAgIHJldHVybiB0aGlzLmdldFN1Z2dlc3Rpb25zRnJvbVByb3ZpZGVycyh7ZWRpdG9yOiB0aGlzLmVkaXRvciwgYnVmZmVyUG9zaXRpb24sIHNjb3BlRGVzY3JpcHRvciwgcHJlZml4LCBhY3RpdmF0ZWRNYW51YWxseX0pXG4gIH1cblxuICBnZXRTdWdnZXN0aW9uc0Zyb21Qcm92aWRlcnMgKG9wdGlvbnMpIHtcbiAgICBsZXQgc3VnZ2VzdGlvbnNQcm9taXNlXG4gICAgY29uc3QgcHJvdmlkZXJzID0gdGhpcy5wcm92aWRlck1hbmFnZXIuYXBwbGljYWJsZVByb3ZpZGVycyhvcHRpb25zLmVkaXRvciwgb3B0aW9ucy5zY29wZURlc2NyaXB0b3IpXG5cbiAgICBjb25zdCBwcm92aWRlclByb21pc2VzID0gW11cbiAgICBwcm92aWRlcnMuZm9yRWFjaChwcm92aWRlciA9PiB7XG4gICAgICBjb25zdCBhcGlWZXJzaW9uID0gdGhpcy5wcm92aWRlck1hbmFnZXIuYXBpVmVyc2lvbkZvclByb3ZpZGVyKHByb3ZpZGVyKVxuICAgICAgY29uc3QgYXBpSXMyMCA9IHNlbXZlci5zYXRpc2ZpZXMoYXBpVmVyc2lvbiwgJz49Mi4wLjAnKVxuXG4gICAgICAvLyBUT0RPIEFQSTogcmVtb3ZlIHVwZ3JhZGluZyB3aGVuIDEuMCBzdXBwb3J0IGlzIHJlbW92ZWRcbiAgICAgIGxldCBnZXRTdWdnZXN0aW9uc1xuICAgICAgbGV0IHVwZ3JhZGVkT3B0aW9uc1xuICAgICAgaWYgKGFwaUlzMjApIHtcbiAgICAgICAgZ2V0U3VnZ2VzdGlvbnMgPSBwcm92aWRlci5nZXRTdWdnZXN0aW9ucy5iaW5kKHByb3ZpZGVyKVxuICAgICAgICB1cGdyYWRlZE9wdGlvbnMgPSBvcHRpb25zXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBnZXRTdWdnZXN0aW9ucyA9IHByb3ZpZGVyLnJlcXVlc3RIYW5kbGVyLmJpbmQocHJvdmlkZXIpXG4gICAgICAgIHVwZ3JhZGVkT3B0aW9ucyA9IHtcbiAgICAgICAgICBlZGl0b3I6IG9wdGlvbnMuZWRpdG9yLFxuICAgICAgICAgIHByZWZpeDogb3B0aW9ucy5wcmVmaXgsXG4gICAgICAgICAgYnVmZmVyUG9zaXRpb246IG9wdGlvbnMuYnVmZmVyUG9zaXRpb24sXG4gICAgICAgICAgcG9zaXRpb246IG9wdGlvbnMuYnVmZmVyUG9zaXRpb24sXG4gICAgICAgICAgc2NvcGU6IG9wdGlvbnMuc2NvcGVEZXNjcmlwdG9yLFxuICAgICAgICAgIHNjb3BlQ2hhaW46IG9wdGlvbnMuc2NvcGVEZXNjcmlwdG9yLmdldFNjb3BlQ2hhaW4oKSxcbiAgICAgICAgICBidWZmZXI6IG9wdGlvbnMuZWRpdG9yLmdldEJ1ZmZlcigpLFxuICAgICAgICAgIGN1cnNvcjogb3B0aW9ucy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByb3ZpZGVyUHJvbWlzZXMucHVzaChQcm9taXNlLnJlc29sdmUoZ2V0U3VnZ2VzdGlvbnModXBncmFkZWRPcHRpb25zKSkudGhlbihwcm92aWRlclN1Z2dlc3Rpb25zID0+IHtcbiAgICAgICAgaWYgKHByb3ZpZGVyU3VnZ2VzdGlvbnMgPT0gbnVsbCkgeyByZXR1cm4gfVxuXG4gICAgICAgIC8vIFRPRE8gQVBJOiByZW1vdmUgdXBncmFkaW5nIHdoZW4gMS4wIHN1cHBvcnQgaXMgcmVtb3ZlZFxuICAgICAgICBsZXQgaGFzRGVwcmVjYXRpb25zID0gZmFsc2VcbiAgICAgICAgaWYgKGFwaUlzMjAgJiYgcHJvdmlkZXJTdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICBoYXNEZXByZWNhdGlvbnMgPSB0aGlzLmRlcHJlY2F0ZUZvclN1Z2dlc3Rpb24ocHJvdmlkZXIsIHByb3ZpZGVyU3VnZ2VzdGlvbnNbMF0pXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaGFzRGVwcmVjYXRpb25zIHx8ICFhcGlJczIwKSB7XG4gICAgICAgICAgcHJvdmlkZXJTdWdnZXN0aW9ucyA9IHByb3ZpZGVyU3VnZ2VzdGlvbnMubWFwKChzdWdnZXN0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuZXdTdWdnZXN0aW9uID0ge1xuICAgICAgICAgICAgICB0ZXh0OiBzdWdnZXN0aW9uLnRleHQgIT0gbnVsbCA/IHN1Z2dlc3Rpb24udGV4dCA6IHN1Z2dlc3Rpb24ud29yZCxcbiAgICAgICAgICAgICAgc25pcHBldDogc3VnZ2VzdGlvbi5zbmlwcGV0LFxuICAgICAgICAgICAgICByZXBsYWNlbWVudFByZWZpeDogc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeCAhPSBudWxsID8gc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeCA6IHN1Z2dlc3Rpb24ucHJlZml4LFxuICAgICAgICAgICAgICBjbGFzc05hbWU6IHN1Z2dlc3Rpb24uY2xhc3NOYW1lLFxuICAgICAgICAgICAgICB0eXBlOiBzdWdnZXN0aW9uLnR5cGVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgobmV3U3VnZ2VzdGlvbi5yaWdodExhYmVsSFRNTCA9PSBudWxsKSAmJiBzdWdnZXN0aW9uLnJlbmRlckxhYmVsQXNIdG1sKSB7IG5ld1N1Z2dlc3Rpb24ucmlnaHRMYWJlbEhUTUwgPSBzdWdnZXN0aW9uLmxhYmVsIH1cbiAgICAgICAgICAgIGlmICgobmV3U3VnZ2VzdGlvbi5yaWdodExhYmVsID09IG51bGwpICYmICFzdWdnZXN0aW9uLnJlbmRlckxhYmVsQXNIdG1sKSB7IG5ld1N1Z2dlc3Rpb24ucmlnaHRMYWJlbCA9IHN1Z2dlc3Rpb24ubGFiZWwgfVxuICAgICAgICAgICAgcmV0dXJuIG5ld1N1Z2dlc3Rpb25cbiAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGhhc0VtcHR5ID0gZmFsc2UgLy8gT3B0aW1pemF0aW9uOiBvbmx5IGNyZWF0ZSBhbm90aGVyIGFycmF5IHdoZW4gdGhlcmUgYXJlIGVtcHR5IGl0ZW1zXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvdmlkZXJTdWdnZXN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHN1Z2dlc3Rpb24gPSBwcm92aWRlclN1Z2dlc3Rpb25zW2ldXG4gICAgICAgICAgaWYgKCFzdWdnZXN0aW9uLnNuaXBwZXQgJiYgIXN1Z2dlc3Rpb24udGV4dCkgeyBoYXNFbXB0eSA9IHRydWUgfVxuICAgICAgICAgIGlmIChzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4ID09IG51bGwpIHsgc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeCA9IHRoaXMuZ2V0RGVmYXVsdFJlcGxhY2VtZW50UHJlZml4KG9wdGlvbnMucHJlZml4KSB9XG4gICAgICAgICAgc3VnZ2VzdGlvbi5wcm92aWRlciA9IHByb3ZpZGVyXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaGFzRW1wdHkpIHtcbiAgICAgICAgICBjb25zdCByZXMgPSBbXVxuICAgICAgICAgIGZvciAoY29uc3QgcyBvZiBwcm92aWRlclN1Z2dlc3Rpb25zKSB7XG4gICAgICAgICAgICBpZiAocy5zbmlwcGV0IHx8IHMudGV4dCkge1xuICAgICAgICAgICAgICByZXMucHVzaChzKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBwcm92aWRlclN1Z2dlc3Rpb25zID0gcmVzXG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvdmlkZXIuZmlsdGVyU3VnZ2VzdGlvbnMpIHtcbiAgICAgICAgICBwcm92aWRlclN1Z2dlc3Rpb25zID0gdGhpcy5maWx0ZXJTdWdnZXN0aW9ucyhwcm92aWRlclN1Z2dlc3Rpb25zLCBvcHRpb25zKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm92aWRlclN1Z2dlc3Rpb25zXG4gICAgICB9KSlcbiAgICB9KVxuXG4gICAgaWYgKCFwcm92aWRlclByb21pc2VzIHx8ICFwcm92aWRlclByb21pc2VzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgc3VnZ2VzdGlvbnNQcm9taXNlID0gUHJvbWlzZS5hbGwocHJvdmlkZXJQcm9taXNlcylcbiAgICB0aGlzLmN1cnJlbnRTdWdnZXN0aW9uc1Byb21pc2UgPSBzdWdnZXN0aW9uc1Byb21pc2VcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50U3VnZ2VzdGlvbnNQcm9taXNlXG4gICAgICAudGhlbih0aGlzLm1lcmdlU3VnZ2VzdGlvbnNGcm9tUHJvdmlkZXJzKVxuICAgICAgLnRoZW4oc3VnZ2VzdGlvbnMgPT4ge1xuICAgICAgICBpZiAodGhpcy5jdXJyZW50U3VnZ2VzdGlvbnNQcm9taXNlICE9PSBzdWdnZXN0aW9uc1Byb21pc2UpIHsgcmV0dXJuIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuYWN0aXZhdGVkTWFudWFsbHkgJiYgdGhpcy5zaG91bGREaXNwbGF5U3VnZ2VzdGlvbnMgJiYgdGhpcy5hdXRvQ29uZmlybVNpbmdsZVN1Z2dlc3Rpb25FbmFibGVkICYmIHN1Z2dlc3Rpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIC8vIFdoZW4gdGhlcmUgaXMgb25lIHN1Z2dlc3Rpb24gaW4gbWFudWFsIG1vZGUsIGp1c3QgY29uZmlybSBpdFxuICAgICAgICAgIHJldHVybiB0aGlzLmNvbmZpcm0oc3VnZ2VzdGlvbnNbMF0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheVN1Z2dlc3Rpb25zKHN1Z2dlc3Rpb25zLCBvcHRpb25zKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKVxuICB9XG5cbiAgZmlsdGVyU3VnZ2VzdGlvbnMgKHN1Z2dlc3Rpb25zLCB7cHJlZml4fSkge1xuICAgIGNvbnN0IHJlc3VsdHMgPSBbXVxuICAgIGNvbnN0IGZ1enphbGRyaW5Qcm92aWRlciA9IHRoaXMudXNlQWx0ZXJuYXRlU2NvcmluZyA/IGZ1enphbGRyaW5QbHVzIDogZnV6emFsZHJpblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3VnZ2VzdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIC8vIHNvcnRTY29yZSBtb3N0bHkgcHJlc2VydmVzIGluIHRoZSBvcmlnaW5hbCBzb3J0aW5nLiBUaGUgZnVuY3Rpb24gaXNcbiAgICAgIC8vIGNob3NlbiBzdWNoIHRoYXQgc3VnZ2VzdGlvbnMgd2l0aCBhIHZlcnkgaGlnaCBtYXRjaCBzY29yZSBjYW4gYnJlYWsgb3V0LlxuICAgICAgbGV0IHNjb3JlXG4gICAgICBjb25zdCBzdWdnZXN0aW9uID0gc3VnZ2VzdGlvbnNbaV1cbiAgICAgIHN1Z2dlc3Rpb24uc29ydFNjb3JlID0gTWF0aC5tYXgoKC1pIC8gMTApICsgMywgMCkgKyAxXG4gICAgICBzdWdnZXN0aW9uLnNjb3JlID0gbnVsbFxuXG4gICAgICBjb25zdCB0ZXh0ID0gKHN1Z2dlc3Rpb24uc25pcHBldCB8fCBzdWdnZXN0aW9uLnRleHQpXG4gICAgICBjb25zdCBzdWdnZXN0aW9uUHJlZml4ID0gc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeCAhPSBudWxsID8gc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeCA6IHByZWZpeFxuICAgICAgY29uc3QgcHJlZml4SXNFbXB0eSA9ICFzdWdnZXN0aW9uUHJlZml4IHx8IHN1Z2dlc3Rpb25QcmVmaXggPT09ICcgJ1xuICAgICAgY29uc3QgZmlyc3RDaGFySXNNYXRjaCA9ICFwcmVmaXhJc0VtcHR5ICYmIHN1Z2dlc3Rpb25QcmVmaXhbMF0udG9Mb3dlckNhc2UoKSA9PT0gdGV4dFswXS50b0xvd2VyQ2FzZSgpXG5cbiAgICAgIGlmIChwcmVmaXhJc0VtcHR5KSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChzdWdnZXN0aW9uKVxuICAgICAgfVxuICAgICAgaWYgKGZpcnN0Q2hhcklzTWF0Y2ggJiYgKHNjb3JlID0gZnV6emFsZHJpblByb3ZpZGVyLnNjb3JlKHRleHQsIHN1Z2dlc3Rpb25QcmVmaXgpKSA+IDApIHtcbiAgICAgICAgc3VnZ2VzdGlvbi5zY29yZSA9IHNjb3JlICogc3VnZ2VzdGlvbi5zb3J0U2NvcmVcbiAgICAgICAgcmVzdWx0cy5wdXNoKHN1Z2dlc3Rpb24pXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVzdWx0cy5zb3J0KHRoaXMucmV2ZXJzZVNvcnRPblNjb3JlQ29tcGFyYXRvcilcbiAgICByZXR1cm4gcmVzdWx0c1xuICB9XG5cbiAgcmV2ZXJzZVNvcnRPblNjb3JlQ29tcGFyYXRvciAoYSwgYikge1xuICAgIGxldCBic2NvcmUgPSBiLnNjb3JlXG4gICAgaWYgKCFic2NvcmUpIHtcbiAgICAgIGJzY29yZSA9IGIuc29ydFNjb3JlXG4gICAgfVxuICAgIGxldCBhc2NvcmUgPSBhLnNjb3JlXG4gICAgaWYgKCFhc2NvcmUpIHtcbiAgICAgIGFzY29yZSA9IGIuc29ydFNjb3JlXG4gICAgfVxuICAgIHJldHVybiBic2NvcmUgLSBhc2NvcmVcbiAgfVxuXG4gIC8vIHByb3ZpZGVyU3VnZ2VzdGlvbnMgLSBhcnJheSBvZiBhcnJheXMgb2Ygc3VnZ2VzdGlvbnMgcHJvdmlkZWQgYnkgYWxsIGNhbGxlZCBwcm92aWRlcnNcbiAgbWVyZ2VTdWdnZXN0aW9uc0Zyb21Qcm92aWRlcnMgKHByb3ZpZGVyU3VnZ2VzdGlvbnMpIHtcbiAgICByZXR1cm4gcHJvdmlkZXJTdWdnZXN0aW9ucy5yZWR1Y2UoKHN1Z2dlc3Rpb25zLCBwcm92aWRlclN1Z2dlc3Rpb25zKSA9PiB7XG4gICAgICBpZiAocHJvdmlkZXJTdWdnZXN0aW9ucyAmJiBwcm92aWRlclN1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgICBzdWdnZXN0aW9ucyA9IHN1Z2dlc3Rpb25zLmNvbmNhdChwcm92aWRlclN1Z2dlc3Rpb25zKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gc3VnZ2VzdGlvbnNcbiAgICB9LCBbXSlcbiAgfVxuXG4gIGRlcHJlY2F0ZUZvclN1Z2dlc3Rpb24gKHByb3ZpZGVyLCBzdWdnZXN0aW9uKSB7XG4gICAgbGV0IGhhc0RlcHJlY2F0aW9ucyA9IGZhbHNlXG4gICAgaWYgKHN1Z2dlc3Rpb24ud29yZCAhPSBudWxsKSB7XG4gICAgICBoYXNEZXByZWNhdGlvbnMgPSB0cnVlXG4gICAgICBpZiAodHlwZW9mIGdyaW0gPT09ICd1bmRlZmluZWQnIHx8IGdyaW0gPT09IG51bGwpIHsgZ3JpbSA9IHJlcXVpcmUoJ2dyaW0nKSB9XG4gICAgICBncmltLmRlcHJlY2F0ZShgQXV0b2NvbXBsZXRlIHByb3ZpZGVyICcke3Byb3ZpZGVyLmNvbnN0cnVjdG9yLm5hbWV9KCR7cHJvdmlkZXIuaWR9KSdcbnJldHVybnMgc3VnZ2VzdGlvbnMgd2l0aCBhIFxcYHdvcmRcXGAgYXR0cmlidXRlLlxuVGhlIFxcYHdvcmRcXGAgYXR0cmlidXRlIGlzIG5vdyBcXGB0ZXh0XFxgLlxuU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1wbHVzL3dpa2kvUHJvdmlkZXItQVBJYFxuICAgICAgKVxuICAgIH1cbiAgICBpZiAoc3VnZ2VzdGlvbi5wcmVmaXggIT0gbnVsbCkge1xuICAgICAgaGFzRGVwcmVjYXRpb25zID0gdHJ1ZVxuICAgICAgaWYgKHR5cGVvZiBncmltID09PSAndW5kZWZpbmVkJyB8fCBncmltID09PSBudWxsKSB7IGdyaW0gPSByZXF1aXJlKCdncmltJykgfVxuICAgICAgZ3JpbS5kZXByZWNhdGUoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5yZXR1cm5zIHN1Z2dlc3Rpb25zIHdpdGggYSBcXGBwcmVmaXhcXGAgYXR0cmlidXRlLlxuVGhlIFxcYHByZWZpeFxcYCBhdHRyaWJ1dGUgaXMgbm93IFxcYHJlcGxhY2VtZW50UHJlZml4XFxgIGFuZCBpcyBvcHRpb25hbC5cblNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtcGx1cy93aWtpL1Byb3ZpZGVyLUFQSWBcbiAgICAgIClcbiAgICB9XG4gICAgaWYgKHN1Z2dlc3Rpb24ubGFiZWwgIT0gbnVsbCkge1xuICAgICAgaGFzRGVwcmVjYXRpb25zID0gdHJ1ZVxuICAgICAgaWYgKHR5cGVvZiBncmltID09PSAndW5kZWZpbmVkJyB8fCBncmltID09PSBudWxsKSB7IGdyaW0gPSByZXF1aXJlKCdncmltJykgfVxuICAgICAgZ3JpbS5kZXByZWNhdGUoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5yZXR1cm5zIHN1Z2dlc3Rpb25zIHdpdGggYSBcXGBsYWJlbFxcYCBhdHRyaWJ1dGUuXG5UaGUgXFxgbGFiZWxcXGAgYXR0cmlidXRlIGlzIG5vdyBcXGByaWdodExhYmVsXFxgIG9yIFxcYHJpZ2h0TGFiZWxIVE1MXFxgLlxuU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1wbHVzL3dpa2kvUHJvdmlkZXItQVBJYFxuICAgICAgKVxuICAgIH1cbiAgICBpZiAoc3VnZ2VzdGlvbi5vbldpbGxDb25maXJtICE9IG51bGwpIHtcbiAgICAgIGhhc0RlcHJlY2F0aW9ucyA9IHRydWVcbiAgICAgIGlmICh0eXBlb2YgZ3JpbSA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JpbSA9PT0gbnVsbCkgeyBncmltID0gcmVxdWlyZSgnZ3JpbScpIH1cbiAgICAgIGdyaW0uZGVwcmVjYXRlKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xucmV0dXJucyBzdWdnZXN0aW9ucyB3aXRoIGEgXFxgb25XaWxsQ29uZmlybVxcYCBjYWxsYmFjay5cblRoZSBcXGBvbldpbGxDb25maXJtXFxgIGNhbGxiYWNrIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQuXG5TZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXV0b2NvbXBsZXRlLXBsdXMvd2lraS9Qcm92aWRlci1BUElgXG4gICAgICApXG4gICAgfVxuICAgIGlmIChzdWdnZXN0aW9uLm9uRGlkQ29uZmlybSAhPSBudWxsKSB7XG4gICAgICBoYXNEZXByZWNhdGlvbnMgPSB0cnVlXG4gICAgICBpZiAodHlwZW9mIGdyaW0gPT09ICd1bmRlZmluZWQnIHx8IGdyaW0gPT09IG51bGwpIHsgZ3JpbSA9IHJlcXVpcmUoJ2dyaW0nKSB9XG4gICAgICBncmltLmRlcHJlY2F0ZShgQXV0b2NvbXBsZXRlIHByb3ZpZGVyICcke3Byb3ZpZGVyLmNvbnN0cnVjdG9yLm5hbWV9KCR7cHJvdmlkZXIuaWR9KSdcbnJldHVybnMgc3VnZ2VzdGlvbnMgd2l0aCBhIFxcYG9uRGlkQ29uZmlybVxcYCBjYWxsYmFjay5cblRoZSBcXGBvbkRpZENvbmZpcm1cXGAgY2FsbGJhY2sgaXMgbm93IGEgXFxgb25EaWRJbnNlcnRTdWdnZXN0aW9uXFxgIGNhbGxiYWNrIG9uIHRoZSBwcm92aWRlciBpdHNlbGYuXG5TZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXV0b2NvbXBsZXRlLXBsdXMvd2lraS9Qcm92aWRlci1BUElgXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBoYXNEZXByZWNhdGlvbnNcbiAgfVxuXG4gIGRpc3BsYXlTdWdnZXN0aW9ucyAoc3VnZ2VzdGlvbnMsIG9wdGlvbnMpIHtcbiAgICBzdWdnZXN0aW9ucyA9IHRoaXMuZ2V0VW5pcXVlU3VnZ2VzdGlvbnMoc3VnZ2VzdGlvbnMpXG5cbiAgICBpZiAodGhpcy5zaG91bGREaXNwbGF5U3VnZ2VzdGlvbnMgJiYgc3VnZ2VzdGlvbnMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5zaG93U3VnZ2VzdGlvbkxpc3Qoc3VnZ2VzdGlvbnMsIG9wdGlvbnMpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCgpXG4gICAgfVxuICB9XG5cbiAgZ2V0VW5pcXVlU3VnZ2VzdGlvbnMgKHN1Z2dlc3Rpb25zKSB7XG4gICAgY29uc3Qgc2VlbiA9IHt9XG4gICAgY29uc3QgcmVzdWx0ID0gW11cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1Z2dlc3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzdWdnZXN0aW9uID0gc3VnZ2VzdGlvbnNbaV1cbiAgICAgIGNvbnN0IHZhbCA9IHN1Z2dlc3Rpb24udGV4dCArIHN1Z2dlc3Rpb24uc25pcHBldFxuICAgICAgaWYgKCFzZWVuW3ZhbF0pIHtcbiAgICAgICAgcmVzdWx0LnB1c2goc3VnZ2VzdGlvbilcbiAgICAgICAgc2Vlblt2YWxdID0gdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICBnZXRQcmVmaXggKGVkaXRvciwgYnVmZmVyUG9zaXRpb24pIHtcbiAgICBjb25zdCBsaW5lID0gZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93LCAwXSwgYnVmZmVyUG9zaXRpb25dKVxuICAgIGNvbnN0IHByZWZpeCA9IHRoaXMucHJlZml4UmVnZXguZXhlYyhsaW5lKVxuICAgIGlmICghcHJlZml4IHx8ICFwcmVmaXhbMl0pIHtcbiAgICAgIHJldHVybiAnJ1xuICAgIH1cbiAgICByZXR1cm4gcHJlZml4WzJdXG4gIH1cblxuICBnZXREZWZhdWx0UmVwbGFjZW1lbnRQcmVmaXggKHByZWZpeCkge1xuICAgIGlmICh0aGlzLndvcmRQcmVmaXhSZWdleC50ZXN0KHByZWZpeCkpIHtcbiAgICAgIHJldHVybiBwcmVmaXhcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcnXG4gICAgfVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogR2V0cyBjYWxsZWQgd2hlbiB0aGUgdXNlciBzdWNjZXNzZnVsbHkgY29uZm1ybXMgYSBzdWdnZXN0aW9uXG4gIC8vXG4gIC8vIG1hdGNoIC0gQW4ge09iamVjdH0gcmVwcmVzZW50aW5nIHRoZSBjb25maXJtZWQgc3VnZ2VzdGlvblxuICBjb25maXJtIChzdWdnZXN0aW9uLCBrZXlzdHJva2UpIHtcbiAgICBpZiAoKHRoaXMuZWRpdG9yID09IG51bGwpIHx8IChzdWdnZXN0aW9uID09IG51bGwpIHx8ICEhdGhpcy5kaXNwb3NlZCkgeyByZXR1cm4gfVxuXG4gICAgY29uc3QgYXBpVmVyc2lvbiA9IHRoaXMucHJvdmlkZXJNYW5hZ2VyLmFwaVZlcnNpb25Gb3JQcm92aWRlcihzdWdnZXN0aW9uLnByb3ZpZGVyKVxuICAgIGNvbnN0IGFwaUlzMjAgPSBzZW12ZXIuc2F0aXNmaWVzKGFwaVZlcnNpb24sICc+PTIuMC4wJylcbiAgICBjb25zdCB0cmlnZ2VyUG9zaXRpb24gPSB0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKCkuZ2V0QnVmZmVyUG9zaXRpb24oKVxuXG4gICAgLy8gVE9ETyBBUEk6IFJlbW92ZSBhcyB0aGlzIGlzIG5vIGxvbmdlciB1c2VkXG4gICAgaWYgKHN1Z2dlc3Rpb24ub25XaWxsQ29uZmlybSkge1xuICAgICAgc3VnZ2VzdGlvbi5vbldpbGxDb25maXJtKClcbiAgICB9XG5cbiAgICBjb25zdCBzZWxlY3Rpb25zID0gdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgaWYgKHNlbGVjdGlvbnMgJiYgc2VsZWN0aW9ucy5sZW5ndGgpIHtcbiAgICAgIGZvciAoY29uc3QgcyBvZiBzZWxlY3Rpb25zKSB7XG4gICAgICAgIGlmIChzICYmIHMuY2xlYXIpIHtcbiAgICAgICAgICBzLmNsZWFyKClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKVxuXG4gICAgLy90aGlzLnJlcGxhY2VUZXh0V2l0aE1hdGNoKHN1Z2dlc3Rpb24pXG5cbiAgICAvLyBUT0RPIEFQSTogUmVtb3ZlIHdoZW4gd2UgcmVtb3ZlIHRoZSAxLjAgQVBJXG4gICAgaWYgKGFwaUlzMjApIHtcbiAgICAgIGlmIChzdWdnZXN0aW9uLnByb3ZpZGVyICYmIHN1Z2dlc3Rpb24ucHJvdmlkZXIub25EaWRJbnNlcnRTdWdnZXN0aW9uKSB7XG4gICAgICAgIHN1Z2dlc3Rpb24ucHJvdmlkZXIub25EaWRJbnNlcnRTdWdnZXN0aW9uKHtlZGl0b3I6IHRoaXMuZWRpdG9yLCBzdWdnZXN0aW9uLCB0cmlnZ2VyUG9zaXRpb259KVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3VnZ2VzdGlvbi5vbkRpZENvbmZpcm0pIHtcbiAgICAgICAgc3VnZ2VzdGlvbi5vbkRpZENvbmZpcm0oKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNob3dTdWdnZXN0aW9uTGlzdCAoc3VnZ2VzdGlvbnMsIG9wdGlvbnMpIHtcbiAgICBpZiAodGhpcy5kaXNwb3NlZCkgeyByZXR1cm4gfVxuICAgIHRoaXMuc3VnZ2VzdGlvbkxpc3QuY2hhbmdlSXRlbXMoc3VnZ2VzdGlvbnMpXG4gICAgcmV0dXJuIHRoaXMuc3VnZ2VzdGlvbkxpc3Quc2hvdyh0aGlzLmVkaXRvciwgb3B0aW9ucylcbiAgfVxuXG4gIGhpZGVTdWdnZXN0aW9uTGlzdCAoKSB7XG4gICAgaWYgKHRoaXMuZGlzcG9zZWQpIHsgcmV0dXJuIH1cbiAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0LmNoYW5nZUl0ZW1zKG51bGwpXG4gICAgdGhpcy5zdWdnZXN0aW9uTGlzdC5oaWRlKClcbiAgICB0aGlzLnNob3VsZERpc3BsYXlTdWdnZXN0aW9ucyA9IGZhbHNlXG4gIH1cblxuICByZXF1ZXN0SGlkZVN1Z2dlc3Rpb25MaXN0IChjb21tYW5kKSB7XG4gICAgdGhpcy5oaWRlVGltZW91dCA9IHNldFRpbWVvdXQodGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QsIDApXG4gICAgdGhpcy5zaG91bGREaXNwbGF5U3VnZ2VzdGlvbnMgPSBmYWxzZVxuICB9XG5cbiAgY2FuY2VsSGlkZVN1Z2dlc3Rpb25MaXN0UmVxdWVzdCAoKSB7XG4gICAgcmV0dXJuIGNsZWFyVGltZW91dCh0aGlzLmhpZGVUaW1lb3V0KVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogUmVwbGFjZXMgdGhlIGN1cnJlbnQgcHJlZml4IHdpdGggdGhlIGdpdmVuIG1hdGNoLlxuICAvL1xuICAvLyBtYXRjaCAtIFRoZSBtYXRjaCB0byByZXBsYWNlIHRoZSBjdXJyZW50IHByZWZpeCB3aXRoXG4gIHJlcGxhY2VUZXh0V2l0aE1hdGNoIChzdWdnZXN0aW9uKSB7XG4gICAgaWYgKHRoaXMuZWRpdG9yID09IG51bGwpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IGN1cnNvcnMgPSB0aGlzLmVkaXRvci5nZXRDdXJzb3JzKClcbiAgICBpZiAoY3Vyc29ycyA9PSBudWxsKSB7IHJldHVybiB9XG5cbiAgICByZXR1cm4gdGhpcy5lZGl0b3IudHJhbnNhY3QoKCkgPT4ge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXJzb3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGN1cnNvciA9IGN1cnNvcnNbaV1cbiAgICAgICAgY29uc3QgZW5kUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgICBjb25zdCBiZWdpbm5pbmdQb3NpdGlvbiA9IFtlbmRQb3NpdGlvbi5yb3csIGVuZFBvc2l0aW9uLmNvbHVtbiAtIHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXgubGVuZ3RoXVxuXG4gICAgICAgIGlmICh0aGlzLmVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbYmVnaW5uaW5nUG9zaXRpb24sIGVuZFBvc2l0aW9uXSkgPT09IHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXgpIHtcbiAgICAgICAgICBjb25zdCBzdWZmaXggPSB0aGlzLmNvbnN1bWVTdWZmaXggPyB0aGlzLmdldFN1ZmZpeCh0aGlzLmVkaXRvciwgZW5kUG9zaXRpb24sIHN1Z2dlc3Rpb24pIDogJydcbiAgICAgICAgICBpZiAoc3VmZml4Lmxlbmd0aCkgeyBjdXJzb3IubW92ZVJpZ2h0KHN1ZmZpeC5sZW5ndGgpIH1cbiAgICAgICAgICBjdXJzb3Iuc2VsZWN0aW9uLnNlbGVjdExlZnQoc3VnZ2VzdGlvbi5yZXBsYWNlbWVudFByZWZpeC5sZW5ndGggKyBzdWZmaXgubGVuZ3RoKVxuXG4gICAgICAgICAgaWYgKChzdWdnZXN0aW9uLnNuaXBwZXQgIT0gbnVsbCkgJiYgKHRoaXMuc25pcHBldHNNYW5hZ2VyICE9IG51bGwpKSB7XG4gICAgICAgICAgICB0aGlzLnNuaXBwZXRzTWFuYWdlci5pbnNlcnRTbmlwcGV0KHN1Z2dlc3Rpb24uc25pcHBldCwgdGhpcy5lZGl0b3IsIGN1cnNvcilcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3Vyc29yLnNlbGVjdGlvbi5pbnNlcnRUZXh0KHN1Z2dlc3Rpb24udGV4dCAhPSBudWxsID8gc3VnZ2VzdGlvbi50ZXh0IDogc3VnZ2VzdGlvbi5zbmlwcGV0LCB7XG4gICAgICAgICAgICAgIGF1dG9JbmRlbnROZXdsaW5lOiB0aGlzLmVkaXRvci5zaG91bGRBdXRvSW5kZW50KCksXG4gICAgICAgICAgICAgIGF1dG9EZWNyZWFzZUluZGVudDogdGhpcy5lZGl0b3Iuc2hvdWxkQXV0b0luZGVudCgpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cblxuXHRcdCAgLy9jdXJzb3IubW92ZVRvRW5kT2ZXb3JkKClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICApXG4gIH1cblxuICBnZXRTdWZmaXggKGVkaXRvciwgYnVmZmVyUG9zaXRpb24sIHN1Z2dlc3Rpb24pIHtcbiAgICAvLyBUaGlzIGp1c3QgY2hld3MgdGhyb3VnaCB0aGUgc3VnZ2VzdGlvbiBhbmQgdHJpZXMgdG8gbWF0Y2ggdGhlIHN1Z2dlc3Rpb25cbiAgICAvLyBzdWJzdHJpbmcgd2l0aCB0aGUgbGluZVRleHQgc3RhcnRpbmcgYXQgdGhlIGN1cnNvci4gVGhlcmUgaXMgcHJvYmFibHkgYVxuICAgIC8vIG1vcmUgZWZmaWNpZW50IHdheSB0byBkbyB0aGlzLlxuICAgIGxldCBzdWZmaXggPSAoc3VnZ2VzdGlvbi5zbmlwcGV0ICE9IG51bGwgPyBzdWdnZXN0aW9uLnNuaXBwZXQgOiBzdWdnZXN0aW9uLnRleHQpXG4gICAgY29uc3QgZW5kUG9zaXRpb24gPSBbYnVmZmVyUG9zaXRpb24ucm93LCBidWZmZXJQb3NpdGlvbi5jb2x1bW4gKyBzdWZmaXgubGVuZ3RoXVxuICAgIGNvbnN0IGVuZE9mTGluZVRleHQgPSBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW2J1ZmZlclBvc2l0aW9uLCBlbmRQb3NpdGlvbl0pXG4gICAgY29uc3Qgbm9uV29yZENoYXJhY3RlcnMgPSBuZXcgU2V0KGF0b20uY29uZmlnLmdldCgnZWRpdG9yLm5vbldvcmRDaGFyYWN0ZXJzJykuc3BsaXQoJycpKVxuICAgIHdoaWxlIChzdWZmaXgpIHtcbiAgICAgIGlmIChlbmRPZkxpbmVUZXh0LnN0YXJ0c1dpdGgoc3VmZml4KSAmJiAhbm9uV29yZENoYXJhY3RlcnMuaGFzKHN1ZmZpeFswXSkpIHsgYnJlYWsgfVxuICAgICAgc3VmZml4ID0gc3VmZml4LnNsaWNlKDEpXG4gICAgfVxuICAgIHJldHVybiBzdWZmaXhcbiAgfVxuXG4gIC8vIFByaXZhdGU6IENoZWNrcyB3aGV0aGVyIHRoZSBjdXJyZW50IGZpbGUgaXMgYmxhY2tsaXN0ZWQuXG4gIC8vXG4gIC8vIFJldHVybnMge0Jvb2xlYW59IHRoYXQgZGVmaW5lcyB3aGV0aGVyIHRoZSBjdXJyZW50IGZpbGUgaXMgYmxhY2tsaXN0ZWRcbiAgaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkICgpIHtcbiAgICAvLyBtaW5pbWF0Y2ggaXMgc2xvdy4gTm90IG5lY2Vzc2FyeSB0byBkbyB0aGlzIGNvbXB1dGF0aW9uIG9uIGV2ZXJ5IHJlcXVlc3QgZm9yIHN1Z2dlc3Rpb25zXG4gICAgbGV0IGxlZnRcbiAgICBpZiAodGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZSAhPSBudWxsKSB7IHJldHVybiB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlIH1cblxuICAgIGlmICgodGhpcy5maWxlQmxhY2tsaXN0ID09IG51bGwpIHx8IHRoaXMuZmlsZUJsYWNrbGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgPSBmYWxzZVxuICAgICAgcmV0dXJuIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGVcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1pbmltYXRjaCA9PT0gJ3VuZGVmaW5lZCcgfHwgbWluaW1hdGNoID09PSBudWxsKSB7IG1pbmltYXRjaCA9IHJlcXVpcmUoJ21pbmltYXRjaCcpIH1cbiAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoKGxlZnQgPSB0aGlzLmJ1ZmZlci5nZXRQYXRoKCkpICE9IG51bGwgPyBsZWZ0IDogJycpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmZpbGVCbGFja2xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGJsYWNrbGlzdEdsb2IgPSB0aGlzLmZpbGVCbGFja2xpc3RbaV1cbiAgICAgIGlmIChtaW5pbWF0Y2goZmlsZU5hbWUsIGJsYWNrbGlzdEdsb2IpKSB7XG4gICAgICAgIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgPSB0cnVlXG4gICAgICAgIHJldHVybiB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZSA9IGZhbHNlXG4gICAgcmV0dXJuIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGVcbiAgfVxuXG4gIC8vIFByaXZhdGU6IEdldHMgY2FsbGVkIHdoZW4gdGhlIGNvbnRlbnQgaGFzIGJlZW4gbW9kaWZpZWRcbiAgcmVxdWVzdE5ld1N1Z2dlc3Rpb25zICgpIHtcbiAgICBsZXQgZGVsYXkgPSBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1wbHVzLmF1dG9BY3RpdmF0aW9uRGVsYXknKVxuICAgIGNsZWFyVGltZW91dCh0aGlzLmRlbGF5VGltZW91dClcbiAgICBpZiAodGhpcy5zdWdnZXN0aW9uTGlzdC5pc0FjdGl2ZSgpKSB7IGRlbGF5ID0gdGhpcy5zdWdnZXN0aW9uRGVsYXkgfVxuICAgIHRoaXMuZGVsYXlUaW1lb3V0ID0gc2V0VGltZW91dCh0aGlzLmZpbmRTdWdnZXN0aW9ucywgZGVsYXkpXG4gICAgdGhpcy5zaG91bGREaXNwbGF5U3VnZ2VzdGlvbnMgPSB0cnVlXG4gIH1cblxuICBjYW5jZWxOZXdTdWdnZXN0aW9uc1JlcXVlc3QgKCkge1xuICAgIGNsZWFyVGltZW91dCh0aGlzLmRlbGF5VGltZW91dClcbiAgICB0aGlzLnNob3VsZERpc3BsYXlTdWdnZXN0aW9ucyA9IGZhbHNlXG4gIH1cblxuICAvLyBQcml2YXRlOiBHZXRzIGNhbGxlZCB3aGVuIHRoZSBjdXJzb3IgaGFzIG1vdmVkLiBDYW5jZWxzIHRoZSBhdXRvY29tcGxldGlvbiBpZlxuICAvLyB0aGUgdGV4dCBoYXMgbm90IGJlZW4gY2hhbmdlZC5cbiAgLy9cbiAgLy8gZGF0YSAtIEFuIHtPYmplY3R9IGNvbnRhaW5pbmcgaW5mb3JtYXRpb24gb24gd2h5IHRoZSBjdXJzb3IgaGFzIGJlZW4gbW92ZWRcbiAgY3Vyc29yTW92ZWQgKHt0ZXh0Q2hhbmdlZH0pIHtcbiAgICAvLyBUaGUgZGVsYXkgaXMgYSB3b3JrYXJvdW5kIGZvciB0aGUgYmFja3NwYWNlIGNhc2UuIFRoZSB3YXkgYXRvbSBpbXBsZW1lbnRzXG4gICAgLy8gYmFja3NwYWNlIGlzIHRvIHNlbGVjdCBsZWZ0IDEgY2hhciwgdGhlbiBkZWxldGUuIFRoaXMgcmVzdWx0cyBpbiBhXG4gICAgLy8gY3Vyc29yTW92ZWQgZXZlbnQgd2l0aCB0ZXh0Q2hhbmdlZCA9PSBmYWxzZS4gU28gd2UgZGVsYXksIGFuZCBpZiB0aGVcbiAgICAvLyBidWZmZXJDaGFuZ2VkIGhhbmRsZXIgZGVjaWRlcyB0byBzaG93IHN1Z2dlc3Rpb25zLCBpdCB3aWxsIGNhbmNlbCB0aGVcbiAgICAvLyBoaWRlU3VnZ2VzdGlvbkxpc3QgcmVxdWVzdC4gSWYgdGhlcmUgaXMgbm8gYnVmZmVyQ2hhbmdlZCBldmVudCxcbiAgICAvLyBzdWdnZXN0aW9uTGlzdCB3aWxsIGJlIGhpZGRlbi5cbiAgICBpZiAoIXRleHRDaGFuZ2VkICYmICF0aGlzLnNob3VsZEFjdGl2YXRlKSB7IHJldHVybiB0aGlzLnJlcXVlc3RIaWRlU3VnZ2VzdGlvbkxpc3QoKSB9XG4gIH1cblxuICAvLyBQcml2YXRlOiBHZXRzIGNhbGxlZCB3aGVuIHRoZSB1c2VyIHNhdmVzIHRoZSBkb2N1bWVudC4gQ2FuY2VscyB0aGVcbiAgLy8gYXV0b2NvbXBsZXRpb24uXG4gIGJ1ZmZlclNhdmVkICgpIHtcbiAgICBpZiAoIXRoaXMuYXV0b3NhdmVFbmFibGVkKSB7IHJldHVybiB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCgpIH1cbiAgfVxuXG4gIHRvZ2dsZUFjdGl2YXRpb25Gb3JCdWZmZXJDaGFuZ2UgKHtuZXdUZXh0LCBuZXdSYW5nZSwgb2xkVGV4dCwgb2xkUmFuZ2V9KSB7XG4gICAgaWYgKHRoaXMuZGlzcG9zZWQpIHsgcmV0dXJuIH1cbiAgICBpZiAodGhpcy5zaG91bGRBY3RpdmF0ZSkgeyByZXR1cm4gfVxuICAgIGlmICh0aGlzLmNvbXBvc2l0aW9uSW5Qcm9ncmVzcykgeyByZXR1cm4gdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKSB9XG5cbiAgICBpZiAodGhpcy5hdXRvQWN0aXZhdGlvbkVuYWJsZWQgfHwgdGhpcy5zdWdnZXN0aW9uTGlzdC5pc0FjdGl2ZSgpKSB7XG4gICAgICBpZiAobmV3VGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIEFjdGl2YXRlIG9uIHNwYWNlLCBhIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3Rlciwgb3IgYSBicmFja2V0LW1hdGNoZXIgcGFpci5cbiAgICAgICAgaWYgKG5ld1RleHQgPT09ICcgJyB8fCBuZXdUZXh0LnRyaW0oKS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICB0aGlzLnNob3VsZEFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5ld1RleHQubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBwYWlyIG9mIHRoaXMuYnJhY2tldE1hdGNoZXJQYWlycykge1xuICAgICAgICAgICAgaWYgKG5ld1RleHQgPT09IHBhaXIpIHtcbiAgICAgICAgICAgICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAob2xkVGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIFN1Z2dlc3Rpb24gbGlzdCBtdXN0IGJlIGVpdGhlciBhY3RpdmUgb3IgYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgbXVzdCBiZSB0cnVlIGZvciBhY3RpdmF0aW9uIHRvIG9jY3VyLlxuICAgICAgICAvLyBBY3RpdmF0ZSBvbiByZW1vdmFsIG9mIGEgc3BhY2UsIGEgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyLCBvciBhIGJyYWNrZXQtbWF0Y2hlciBwYWlyLlxuICAgICAgICBpZiAodGhpcy5iYWNrc3BhY2VUcmlnZ2Vyc0F1dG9jb21wbGV0ZSB8fCB0aGlzLnN1Z2dlc3Rpb25MaXN0LmlzQWN0aXZlKCkpIHtcbiAgICAgICAgICBpZiAob2xkVGV4dC5sZW5ndGggPiAwICYmICh0aGlzLmJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlIHx8IHRoaXMuc3VnZ2VzdGlvbkxpc3QuaXNBY3RpdmUoKSkpIHtcbiAgICAgICAgICAgIGlmIChvbGRUZXh0ID09PSAnICcgfHwgb2xkVGV4dC50cmltKCkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgIHRoaXMuc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChvbGRUZXh0Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgdGhpcy5icmFja2V0TWF0Y2hlclBhaXJzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9sZFRleHQgPT09IHBhaXIpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnNob3VsZEFjdGl2YXRlICYmIHRoaXMuc2hvdWxkU3VwcHJlc3NBY3RpdmF0aW9uRm9yRWRpdG9yQ2xhc3NlcygpKSB7XG4gICAgICAgIHRoaXMuc2hvdWxkQWN0aXZhdGUgPSBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZXMgKHtjaGFuZ2VzfSkge1xuICAgIGNvbnN0IGxhc3RDdXJzb3JQb3NpdGlvbiA9IHRoaXMuZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgY29uc3QgY2hhbmdlT2NjdXJyZWROZWFyTGFzdEN1cnNvciA9IGNoYW5nZXMuc29tZSgoe3N0YXJ0LCBuZXdFeHRlbnR9KSA9PiB7XG4gICAgICBjb25zdCBuZXdSYW5nZSA9IG5ldyBSYW5nZShzdGFydCwgc3RhcnQudHJhdmVyc2UobmV3RXh0ZW50KSlcbiAgICAgIHJldHVybiBuZXdSYW5nZS5jb250YWluc1BvaW50KGxhc3RDdXJzb3JQb3NpdGlvbilcbiAgICB9KVxuXG4gICAgaWYgKHRoaXMuc2hvdWxkQWN0aXZhdGUgJiYgY2hhbmdlT2NjdXJyZWROZWFyTGFzdEN1cnNvcikge1xuICAgICAgdGhpcy5jYW5jZWxIaWRlU3VnZ2VzdGlvbkxpc3RSZXF1ZXN0KClcbiAgICAgIHRoaXMucmVxdWVzdE5ld1N1Z2dlc3Rpb25zKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYW5jZWxOZXdTdWdnZXN0aW9uc1JlcXVlc3QoKVxuICAgICAgLy90aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCgpXG4gICAgfVxuXG4gICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IGZhbHNlXG4gIH1cblxuICBzaG93T3JIaWRlU3VnZ2VzdGlvbkxpc3RGb3JCdWZmZXJDaGFuZ2UgKHtuZXdUZXh0LCBuZXdSYW5nZSwgb2xkVGV4dCwgb2xkUmFuZ2V9KSB7XG4gICAgaWYgKHRoaXMuZGlzcG9zZWQpIHsgcmV0dXJuIH1cbiAgICBpZiAodGhpcy5jb21wb3NpdGlvbkluUHJvZ3Jlc3MpIHsgcmV0dXJuIHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KCkgfVxuICAgIGxldCBzaG91bGRBY3RpdmF0ZSA9IGZhbHNlXG4gICAgY29uc3QgY3Vyc29yUG9zaXRpb25zID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zKClcblxuICAgIGlmICh0aGlzLmF1dG9BY3RpdmF0aW9uRW5hYmxlZCB8fCB0aGlzLnN1Z2dlc3Rpb25MaXN0LmlzQWN0aXZlKCkpIHtcbiAgICAgIC8vIEFjdGl2YXRlIG9uIHNwYWNlLCBhIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3Rlciwgb3IgYSBicmFja2V0LW1hdGNoZXIgcGFpci5cbiAgICAgIGlmIChuZXdUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaWYgKGN1cnNvclBvc2l0aW9ucy5zb21lKChwb3NpdGlvbikgPT4geyByZXR1cm4gbmV3UmFuZ2UuY29udGFpbnNQb2ludChwb3NpdGlvbikgfSkpIHtcbiAgICAgICAgICBpZiAobmV3VGV4dCA9PT0gJyAnIHx8IG5ld1RleHQudHJpbSgpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChuZXdUZXh0Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBwYWlyIG9mIHRoaXMuYnJhY2tldE1hdGNoZXJQYWlycykge1xuICAgICAgICAgICAgICBpZiAobmV3VGV4dCA9PT0gcGFpcikge1xuICAgICAgICAgICAgICAgIHNob3VsZEFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAvLyBTdWdnZXN0aW9uIGxpc3QgbXVzdCBiZSBlaXRoZXIgYWN0aXZlIG9yIGJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlIG11c3QgYmUgdHJ1ZSBmb3IgYWN0aXZhdGlvbiB0byBvY2N1ci5cbiAgICAgIC8vIEFjdGl2YXRlIG9uIHJlbW92YWwgb2YgYSBzcGFjZSwgYSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIsIG9yIGEgYnJhY2tldC1tYXRjaGVyIHBhaXIuXG4gICAgICB9IGVsc2UgaWYgKG9sZFRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICBpZiAoKHRoaXMuYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgfHwgdGhpcy5zdWdnZXN0aW9uTGlzdC5pc0FjdGl2ZSgpKSAmJlxuICAgICAgICAoY3Vyc29yUG9zaXRpb25zLnNvbWUoKHBvc2l0aW9uKSA9PiB7IHJldHVybiBuZXdSYW5nZS5jb250YWluc1BvaW50KHBvc2l0aW9uKSB9KSkpIHtcbiAgICAgICAgICBpZiAob2xkVGV4dCA9PT0gJyAnIHx8IG9sZFRleHQudHJpbSgpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChvbGRUZXh0Lmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgZm9yIChjb25zdCBwYWlyIG9mIHRoaXMuYnJhY2tldE1hdGNoZXJQYWlycykge1xuICAgICAgICAgICAgICBpZiAob2xkVGV4dCA9PT0gcGFpcikge1xuICAgICAgICAgICAgICAgIHNob3VsZEFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChzaG91bGRBY3RpdmF0ZSAmJiB0aGlzLnNob3VsZFN1cHByZXNzQWN0aXZhdGlvbkZvckVkaXRvckNsYXNzZXMoKSkgeyBzaG91bGRBY3RpdmF0ZSA9IGZhbHNlIH1cbiAgICB9XG5cbiAgICBpZiAoc2hvdWxkQWN0aXZhdGUpIHtcbiAgICAgIHRoaXMuY2FuY2VsSGlkZVN1Z2dlc3Rpb25MaXN0UmVxdWVzdCgpXG4gICAgICB0aGlzLnJlcXVlc3ROZXdTdWdnZXN0aW9ucygpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2FuY2VsTmV3U3VnZ2VzdGlvbnNSZXF1ZXN0KClcbiAgICAgIHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KClcbiAgICB9XG4gIH1cblxuICBzaG91bGRTdXBwcmVzc0FjdGl2YXRpb25Gb3JFZGl0b3JDbGFzc2VzICgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc3VwcHJlc3NGb3JDbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjbGFzc05hbWVzID0gdGhpcy5zdXBwcmVzc0ZvckNsYXNzZXNbaV1cbiAgICAgIGxldCBjb250YWluc0NvdW50ID0gMFxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjbGFzc05hbWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNsYXNzTmFtZXNbal1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVmlldy5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKSkgeyBjb250YWluc0NvdW50ICs9IDEgfVxuICAgICAgfVxuICAgICAgaWYgKGNvbnRhaW5zQ291bnQgPT09IGNsYXNzTmFtZXMubGVuZ3RoKSB7IHJldHVybiB0cnVlIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBQdWJsaWM6IENsZWFuIHVwLCBzdG9wIGxpc3RlbmluZyB0byBldmVudHNcbiAgZGlzcG9zZSAoKSB7XG4gICAgdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKVxuICAgIHRoaXMuZGlzcG9zZWQgPSB0cnVlXG4gICAgdGhpcy5yZWFkeSA9IGZhbHNlXG4gICAgaWYgKHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgaWYgKHRoaXMuc3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgdGhpcy5zdWdnZXN0aW9uTGlzdCA9IG51bGxcbiAgICB0aGlzLnByb3ZpZGVyTWFuYWdlciA9IG51bGxcbiAgfVxufVxuIl19