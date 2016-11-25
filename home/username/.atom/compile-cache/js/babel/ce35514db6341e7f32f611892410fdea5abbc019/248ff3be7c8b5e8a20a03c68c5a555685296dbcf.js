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
        //return this.hideSuggestionList()
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
    }
    // The delay is a workaround for the backspace case. The way atom implements
    // backspace is to select left 1 char, then delete. This results in a
    // cursorMoved event with textChanged == false. So we delay, and if the
    // bufferChanged handler decides to show suggestions, it will cancel the
    // hideSuggestionList request. If there is no bufferChanged event,
    // suggestionList will be hidden.
    //if (!textChanged && !this.shouldActivate) { return this.requestHideSuggestionList() }

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
      //if (this.compositionInProgress) { return this.hideSuggestionList() }

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
      //if (this.compositionInProgress) { return this.hideSuggestionList() }
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
        //this.hideSuggestionList()
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvYXV0b2NvbXBsZXRlLW1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztvQkFFdUQsTUFBTTs7b0JBQzVDLE1BQU07Ozs7c0JBQ0osUUFBUTs7OzswQkFDSixZQUFZOzs7OzhCQUNSLGlCQUFpQjs7OzsrQkFFaEIsb0JBQW9COzs7OzhCQUNyQixtQkFBbUI7Ozs7cUNBQ1osMkJBQTJCOzs7OzhCQUM5QixtQkFBbUI7OztBQVhsRCxXQUFXLENBQUE7O0FBY1gsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQTs7SUFFTSxtQkFBbUI7QUFDMUIsV0FETyxtQkFBbUIsR0FDdkI7OzswQkFESSxtQkFBbUI7O0FBRXBDLFFBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFBO0FBQzVCLFFBQUksQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUE7QUFDekMsUUFBSSxDQUFDLGtDQUFrQyxHQUFHLElBQUksQ0FBQTtBQUM5QyxRQUFJLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUN2RixRQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQTtBQUNsQixRQUFJLENBQUMscUJBQXFCLEdBQUcsS0FBSyxDQUFBO0FBQ2xDLFFBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFBO0FBQ3JCLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO0FBQ2xCLFFBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUE7QUFDL0IsUUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUE7QUFDdEIsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7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SSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxDQUFBO09BQ25DO0FBQ0QsVUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQTtBQUMvQixVQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7QUFDdEIsWUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtPQUM3QjtBQUNELFVBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFBO0FBQ3pCLFVBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFBO0FBQzFCLFVBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFBO0tBQzVCOzs7U0FodkJrQixtQkFBbUI7OztxQkFBbkIsbUJBQW1CIiwiZmlsZSI6Ii9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvYXV0b2NvbXBsZXRlLW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5pbXBvcnQgeyBSYW5nZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInXG5pbXBvcnQgZnV6emFsZHJpbiBmcm9tICdmdXp6YWxkcmluJ1xuaW1wb3J0IGZ1enphbGRyaW5QbHVzIGZyb20gJ2Z1enphbGRyaW4tcGx1cydcblxuaW1wb3J0IFByb3ZpZGVyTWFuYWdlciBmcm9tICcuL3Byb3ZpZGVyLW1hbmFnZXInXG5pbXBvcnQgU3VnZ2VzdGlvbkxpc3QgZnJvbSAnLi9zdWdnZXN0aW9uLWxpc3QnXG5pbXBvcnQgU3VnZ2VzdGlvbkxpc3RFbGVtZW50IGZyb20gJy4vc3VnZ2VzdGlvbi1saXN0LWVsZW1lbnQnXG5pbXBvcnQgeyBVbmljb2RlTGV0dGVycyB9IGZyb20gJy4vdW5pY29kZS1oZWxwZXJzJ1xuXG4vLyBEZWZlcnJlZCByZXF1aXJlc1xubGV0IG1pbmltYXRjaCA9IG51bGxcbmxldCBncmltID0gbnVsbFxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBdXRvY29tcGxldGVNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMuYXV0b3NhdmVFbmFibGVkID0gZmFsc2VcbiAgICB0aGlzLmJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlID0gdHJ1ZVxuICAgIHRoaXMuYXV0b0NvbmZpcm1TaW5nbGVTdWdnZXN0aW9uRW5hYmxlZCA9IHRydWVcbiAgICB0aGlzLmJyYWNrZXRNYXRjaGVyUGFpcnMgPSBbJygpJywgJ1tdJywgJ3t9JywgJ1wiXCInLCBcIicnXCIsICdgYCcsICfigJzigJ0nLCAn4oCY4oCZJywgJ8KrwrsnLCAn4oC54oC6J11cbiAgICB0aGlzLmJ1ZmZlciA9IG51bGxcbiAgICB0aGlzLmNvbXBvc2l0aW9uSW5Qcm9ncmVzcyA9IGZhbHNlXG4gICAgdGhpcy5kaXNwb3NlZCA9IGZhbHNlXG4gICAgdGhpcy5lZGl0b3IgPSBudWxsXG4gICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zID0gbnVsbFxuICAgIHRoaXMuZWRpdG9yVmlldyA9IG51bGxcbiAgICB0aGlzLnByb3ZpZGVyTWFuYWdlciA9IG51bGxcbiAgICB0aGlzLnJlYWR5ID0gZmFsc2VcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgdGhpcy5zdWdnZXN0aW9uRGVsYXkgPSA1MFxuICAgIHRoaXMuc3VnZ2VzdGlvbkxpc3QgPSBudWxsXG4gICAgdGhpcy5zdXBwcmVzc0ZvckNsYXNzZXMgPSBbXVxuICAgIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zID0gZmFsc2VcbiAgICB0aGlzLnByZWZpeFJlZ2V4ID0gbnVsbFxuICAgIHRoaXMud29yZFByZWZpeFJlZ2V4ID0gbnVsbFxuICAgIHRoaXMudXBkYXRlQ3VycmVudEVkaXRvciA9IHRoaXMudXBkYXRlQ3VycmVudEVkaXRvci5iaW5kKHRoaXMpXG4gICAgdGhpcy5oYW5kbGVDb21tYW5kcyA9IHRoaXMuaGFuZGxlQ29tbWFuZHMuYmluZCh0aGlzKVxuICAgIHRoaXMuZmluZFN1Z2dlc3Rpb25zID0gdGhpcy5maW5kU3VnZ2VzdGlvbnMuYmluZCh0aGlzKVxuICAgIHRoaXMuZ2V0U3VnZ2VzdGlvbnNGcm9tUHJvdmlkZXJzID0gdGhpcy5nZXRTdWdnZXN0aW9uc0Zyb21Qcm92aWRlcnMuYmluZCh0aGlzKVxuICAgIHRoaXMuZGlzcGxheVN1Z2dlc3Rpb25zID0gdGhpcy5kaXNwbGF5U3VnZ2VzdGlvbnMuYmluZCh0aGlzKVxuICAgIHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0ID0gdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QuYmluZCh0aGlzKVxuXG4gICAgdGhpcy50b2dnbGVBY3RpdmF0aW9uRm9yQnVmZmVyQ2hhbmdlID0gdGhpcy50b2dnbGVBY3RpdmF0aW9uRm9yQnVmZmVyQ2hhbmdlLmJpbmQodGhpcylcbiAgICB0aGlzLnNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZXMgPSB0aGlzLnNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZXMuYmluZCh0aGlzKVxuICAgIHRoaXMuc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlID0gdGhpcy5zaG93T3JIaWRlU3VnZ2VzdGlvbkxpc3RGb3JCdWZmZXJDaGFuZ2UuYmluZCh0aGlzKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLnByb3ZpZGVyTWFuYWdlciA9IG5ldyBQcm92aWRlck1hbmFnZXIoKVxuICAgIHRoaXMuc3VnZ2VzdGlvbkxpc3QgPSBuZXcgU3VnZ2VzdGlvbkxpc3QoKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5lbmFibGVFeHRlbmRlZFVuaWNvZGVTdXBwb3J0JywgZW5hYmxlRXh0ZW5kZWRVbmljb2RlU3VwcG9ydCA9PiB7XG4gICAgICBpZiAoZW5hYmxlRXh0ZW5kZWRVbmljb2RlU3VwcG9ydCkge1xuICAgICAgICB0aGlzLnByZWZpeFJlZ2V4ID0gbmV3IFJlZ0V4cChgKFsnXCJ+XFxgIUAjXFxcXCQlXiYqXFxcXChcXFxcKVxcXFx7XFxcXH1cXFxcW1xcXFxdPSssL1xcXFw/Pl0pPygoWyR7VW5pY29kZUxldHRlcnN9XFxcXGRfXStbJHtVbmljb2RlTGV0dGVyc31cXFxcZF8tXSopfChbLjo7W3soPCBdKykpJGApXG4gICAgICAgIHRoaXMud29yZFByZWZpeFJlZ2V4ID0gbmV3IFJlZ0V4cChgXlske1VuaWNvZGVMZXR0ZXJzfVxcXFxkX10rWyR7VW5pY29kZUxldHRlcnN9XFxcXGRfLV0qJGApXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnByZWZpeFJlZ2V4ID0gLyhcXGJ8WydcIn5gIUAjXFwkJV4mKlxcKFxcKVxce1xcfVxcW1xcXT1cXCssL1xcPz5dKSgoXFx3K1tcXHctXSopfChbLjo7W3soPCBdKykpJC9cbiAgICAgICAgdGhpcy53b3JkUHJlZml4UmVnZXggPSAvXlxcdytbXFx3LV0qJC9cbiAgICAgIH1cbiAgICB9XG4gICAgKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMucHJvdmlkZXJNYW5hZ2VyKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS52aWV3cy5hZGRWaWV3UHJvdmlkZXIoU3VnZ2VzdGlvbkxpc3QsIChtb2RlbCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBTdWdnZXN0aW9uTGlzdEVsZW1lbnQoKS5pbml0aWFsaXplKG1vZGVsKVxuICAgIH0pKVxuXG4gICAgdGhpcy5oYW5kbGVFdmVudHMoKVxuICAgIHRoaXMuaGFuZGxlQ29tbWFuZHMoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5zdWdnZXN0aW9uTGlzdCkgLy8gV2UncmUgYWRkaW5nIHRoaXMgbGFzdCBzbyBpdCBpcyBkaXNwb3NlZCBhZnRlciBldmVudHNcbiAgICB0aGlzLnJlYWR5ID0gdHJ1ZVxuICB9XG5cbiAgc2V0U25pcHBldHNNYW5hZ2VyIChzbmlwcGV0c01hbmFnZXIpIHtcbiAgICB0aGlzLnNuaXBwZXRzTWFuYWdlciA9IHNuaXBwZXRzTWFuYWdlclxuICB9XG5cbiAgdXBkYXRlQ3VycmVudEVkaXRvciAoY3VycmVudEVkaXRvcikge1xuICAgIGlmICgoY3VycmVudEVkaXRvciA9PSBudWxsKSB8fCBjdXJyZW50RWRpdG9yID09PSB0aGlzLmVkaXRvcikgeyByZXR1cm4gfVxuICAgIGlmICh0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICB9XG4gICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zID0gbnVsbFxuXG4gICAgLy8gU3RvcCB0cmFja2luZyBlZGl0b3IgKyBidWZmZXJcbiAgICB0aGlzLmVkaXRvciA9IG51bGxcbiAgICB0aGlzLmVkaXRvclZpZXcgPSBudWxsXG4gICAgdGhpcy5idWZmZXIgPSBudWxsXG4gICAgdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZSA9IG51bGxcblxuICAgIGlmICghdGhpcy5lZGl0b3JJc1ZhbGlkKGN1cnJlbnRFZGl0b3IpKSB7IHJldHVybiB9XG5cbiAgICAvLyBUcmFjayB0aGUgbmV3IGVkaXRvciwgZWRpdG9yVmlldywgYW5kIGJ1ZmZlclxuICAgIHRoaXMuZWRpdG9yID0gY3VycmVudEVkaXRvclxuICAgIHRoaXMuZWRpdG9yVmlldyA9IGF0b20udmlld3MuZ2V0Vmlldyh0aGlzLmVkaXRvcilcbiAgICB0aGlzLmJ1ZmZlciA9IHRoaXMuZWRpdG9yLmdldEJ1ZmZlcigpXG5cbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICAvLyBTdWJzY3JpYmUgdG8gYnVmZmVyIGV2ZW50czpcbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuYnVmZmVyLm9uRGlkU2F2ZSgoZSkgPT4geyB0aGlzLmJ1ZmZlclNhdmVkKGUpIH0pKVxuICAgIGlmICh0eXBlb2YgdGhpcy5idWZmZXIub25EaWRDaGFuZ2VUZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuYnVmZmVyLm9uRGlkQ2hhbmdlKHRoaXMudG9nZ2xlQWN0aXZhdGlvbkZvckJ1ZmZlckNoYW5nZSkpXG4gICAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuYnVmZmVyLm9uRGlkQ2hhbmdlVGV4dCh0aGlzLnNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZXMpKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPOiBSZW1vdmUgdGhpcyBhZnRlciBgVGV4dEJ1ZmZlci5wcm90b3R5cGUub25EaWRDaGFuZ2VUZXh0YCBsYW5kcyBvbiBBdG9tIHN0YWJsZS5cbiAgICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5idWZmZXIub25EaWRDaGFuZ2UodGhpcy5zaG93T3JIaWRlU3VnZ2VzdGlvbkxpc3RGb3JCdWZmZXJDaGFuZ2UpKVxuICAgIH1cblxuICAgIC8vIFdhdGNoIElNRSBFdmVudHMgVG8gQWxsb3cgSU1FIFRvIEZ1bmN0aW9uIFdpdGhvdXQgVGhlIFN1Z2dlc3Rpb24gTGlzdCBTaG93aW5nXG4gICAgY29uc3QgY29tcG9zaXRpb25TdGFydCA9ICgpID0+IHtcbiAgICAgIHRoaXMuY29tcG9zaXRpb25JblByb2dyZXNzID0gdHJ1ZVxuICAgIH1cbiAgICBjb25zdCBjb21wb3NpdGlvbkVuZCA9ICgpID0+IHtcbiAgICAgIHRoaXMuY29tcG9zaXRpb25JblByb2dyZXNzID0gZmFsc2VcbiAgICB9XG5cbiAgICB0aGlzLmVkaXRvclZpZXcuYWRkRXZlbnRMaXN0ZW5lcignY29tcG9zaXRpb25zdGFydCcsIGNvbXBvc2l0aW9uU3RhcnQpXG4gICAgdGhpcy5lZGl0b3JWaWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2NvbXBvc2l0aW9uZW5kJywgY29tcG9zaXRpb25FbmQpXG4gICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmFkZChuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBpZiAodGhpcy5lZGl0b3JWaWV3KSB7XG4gICAgICAgIHRoaXMuZWRpdG9yVmlldy5yZW1vdmVFdmVudExpc3RlbmVyKCdjb21wb3NpdGlvbnN0YXJ0JywgY29tcG9zaXRpb25TdGFydClcbiAgICAgICAgdGhpcy5lZGl0b3JWaWV3LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NvbXBvc2l0aW9uZW5kJywgY29tcG9zaXRpb25FbmQpXG4gICAgICB9XG4gICAgfSkpXG5cbiAgICAvLyBTdWJzY3JpYmUgdG8gZWRpdG9yIGV2ZW50czpcbiAgICAvLyBDbG9zZSB0aGUgb3ZlcmxheSB3aGVuIHRoZSBjdXJzb3IgbW92ZWQgd2l0aG91dCBjaGFuZ2luZyBhbnkgdGV4dFxuICAgIHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbigoZSkgPT4geyB0aGlzLmN1cnNvck1vdmVkKGUpIH0pKVxuICAgIHJldHVybiB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMuYWRkKHRoaXMuZWRpdG9yLm9uRGlkQ2hhbmdlUGF0aCgoKSA9PiB7XG4gICAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gbnVsbFxuICAgIH0pKVxuICB9XG5cbiAgZWRpdG9ySXNWYWxpZCAoZWRpdG9yKSB7XG4gICAgLy8gVE9ETzogcmVtb3ZlIGNvbmRpdGlvbmFsIHdoZW4gYGlzVGV4dEVkaXRvcmAgaXMgc2hpcHBlZC5cbiAgICBpZiAodHlwZW9mIGF0b20ud29ya3NwYWNlLmlzVGV4dEVkaXRvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIGF0b20ud29ya3NwYWNlLmlzVGV4dEVkaXRvcihlZGl0b3IpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChlZGl0b3IgPT0gbnVsbCkgeyByZXR1cm4gZmFsc2UgfVxuICAgICAgLy8gU2hvdWxkIHdlIGRpc3F1YWxpZnkgVGV4dEVkaXRvcnMgd2l0aCB0aGUgR3JhbW1hciB0ZXh0LnBsYWluLm51bGwtZ3JhbW1hcj9cbiAgICAgIHJldHVybiAoZWRpdG9yLmdldFRleHQgIT0gbnVsbClcbiAgICB9XG4gIH1cblxuICBoYW5kbGVFdmVudHMgKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS50ZXh0RWRpdG9ycy5vYnNlcnZlKChlZGl0b3IpID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKVxuICAgICAgaWYgKHZpZXcgPT09IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuY2xvc2VzdCgnYXRvbS10ZXh0LWVkaXRvcicpKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ3VycmVudEVkaXRvcihlZGl0b3IpXG4gICAgICB9XG4gICAgICB2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKGVsZW1lbnQpID0+IHtcbiAgICAgICAgdGhpcy51cGRhdGVDdXJyZW50RWRpdG9yKGVkaXRvcilcbiAgICAgIH0pXG4gICAgfSkpXG5cbiAgICAvLyBXYXRjaCBjb25maWcgdmFsdWVzXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvc2F2ZS5lbmFibGVkJywgKHZhbHVlKSA9PiB7IHRoaXMuYXV0b3NhdmVFbmFibGVkID0gdmFsdWUgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5iYWNrc3BhY2VUcmlnZ2Vyc0F1dG9jb21wbGV0ZScsICh2YWx1ZSkgPT4geyB0aGlzLmJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlID0gdmFsdWUgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5lbmFibGVBdXRvQWN0aXZhdGlvbicsICh2YWx1ZSkgPT4geyB0aGlzLmF1dG9BY3RpdmF0aW9uRW5hYmxlZCA9IHZhbHVlIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuZW5hYmxlQXV0b0NvbmZpcm1TaW5nbGVTdWdnZXN0aW9uJywgKHZhbHVlKSA9PiB7IHRoaXMuYXV0b0NvbmZpcm1TaW5nbGVTdWdnZXN0aW9uRW5hYmxlZCA9IHZhbHVlIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuY29uc3VtZVN1ZmZpeCcsICh2YWx1ZSkgPT4geyB0aGlzLmNvbnN1bWVTdWZmaXggPSB2YWx1ZSB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLnVzZUFsdGVybmF0ZVNjb3JpbmcnLCAodmFsdWUpID0+IHsgdGhpcy51c2VBbHRlcm5hdGVTY29yaW5nID0gdmFsdWUgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5maWxlQmxhY2tsaXN0JywgKHZhbHVlKSA9PiB7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy5maWxlQmxhY2tsaXN0ID0gdmFsdWUubWFwKChzKSA9PiB7IHJldHVybiBzLnRyaW0oKSB9KVxuICAgICAgfVxuICAgICAgdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZSA9IG51bGxcbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLnN1cHByZXNzQWN0aXZhdGlvbkZvckVkaXRvckNsYXNzZXMnLCB2YWx1ZSA9PiB7XG4gICAgICB0aGlzLnN1cHByZXNzRm9yQ2xhc3NlcyA9IFtdXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHNlbGVjdG9yID0gdmFsdWVbaV1cbiAgICAgICAgY29uc3QgY2xhc3NlcyA9IChzZWxlY3Rvci50cmltKCkuc3BsaXQoJy4nKS5maWx0ZXIoKGNsYXNzTmFtZSkgPT4gY2xhc3NOYW1lLnRyaW0oKSkubWFwKChjbGFzc05hbWUpID0+IGNsYXNzTmFtZS50cmltKCkpKVxuICAgICAgICBpZiAoY2xhc3Nlcy5sZW5ndGgpIHsgdGhpcy5zdXBwcmVzc0ZvckNsYXNzZXMucHVzaChjbGFzc2VzKSB9XG4gICAgICB9XG4gICAgfSkpXG5cbiAgICAvLyBIYW5kbGUgZXZlbnRzIGZyb20gc3VnZ2VzdGlvbiBsaXN0XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLnN1Z2dlc3Rpb25MaXN0Lm9uRGlkQ29uZmlybSgoZSkgPT4geyB0aGlzLmNvbmZpcm0oZSkgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLnN1Z2dlc3Rpb25MaXN0Lm9uRGlkQ2FuY2VsKHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KSlcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5zdWdnZXN0aW9uTGlzdC5vblJlcGxhY2UoKGUpID0+IHsgdGhpcy5yZXBsYWNlVGV4dFdpdGhNYXRjaChlKSB9KSlcbiAgfVxuXG4gIGhhbmRsZUNvbW1hbmRzICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZCgnYXRvbS10ZXh0LWVkaXRvcicsIHtcbiAgICAgICdhdXRvY29tcGxldGUtcGx1czphY3RpdmF0ZSc6IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLnNob3VsZERpc3BsYXlTdWdnZXN0aW9ucyA9IHRydWVcbiAgICAgICAgbGV0IGFjdGl2YXRlZE1hbnVhbGx5ID0gdHJ1ZVxuICAgICAgICBpZiAoZXZlbnQuZGV0YWlsICYmIGV2ZW50LmRldGFpbC5hY3RpdmF0ZWRNYW51YWxseSAhPT0gbnVsbCAmJiB0eXBlb2YgZXZlbnQuZGV0YWlsLmFjdGl2YXRlZE1hbnVhbGx5ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGFjdGl2YXRlZE1hbnVhbGx5ID0gZXZlbnQuZGV0YWlsLmFjdGl2YXRlZE1hbnVhbGx5XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maW5kU3VnZ2VzdGlvbnMoYWN0aXZhdGVkTWFudWFsbHkpXG4gICAgICB9XG4gICAgfSkpXG4gIH1cblxuICAvLyBQcml2YXRlOiBGaW5kcyBzdWdnZXN0aW9ucyBmb3IgdGhlIGN1cnJlbnQgcHJlZml4LCBzZXRzIHRoZSBsaXN0IGl0ZW1zLFxuICAvLyBwb3NpdGlvbnMgdGhlIG92ZXJsYXkgYW5kIHNob3dzIGl0XG4gIGZpbmRTdWdnZXN0aW9ucyAoYWN0aXZhdGVkTWFudWFsbHkpIHtcbiAgICBpZiAodGhpcy5kaXNwb3NlZCkgeyByZXR1cm4gfVxuICAgIGlmICgodGhpcy5wcm92aWRlck1hbmFnZXIgPT0gbnVsbCkgfHwgKHRoaXMuZWRpdG9yID09IG51bGwpIHx8ICh0aGlzLmJ1ZmZlciA9PSBudWxsKSkgeyByZXR1cm4gfVxuICAgIGlmICh0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZCgpKSB7IHJldHVybiB9XG4gICAgY29uc3QgY3Vyc29yID0gdGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpXG4gICAgaWYgKGN1cnNvciA9PSBudWxsKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCBidWZmZXJQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgY29uc3Qgc2NvcGVEZXNjcmlwdG9yID0gY3Vyc29yLmdldFNjb3BlRGVzY3JpcHRvcigpXG4gICAgY29uc3QgcHJlZml4ID0gdGhpcy5nZXRQcmVmaXgodGhpcy5lZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0U3VnZ2VzdGlvbnNGcm9tUHJvdmlkZXJzKHtlZGl0b3I6IHRoaXMuZWRpdG9yLCBidWZmZXJQb3NpdGlvbiwgc2NvcGVEZXNjcmlwdG9yLCBwcmVmaXgsIGFjdGl2YXRlZE1hbnVhbGx5fSlcbiAgfVxuXG4gIGdldFN1Z2dlc3Rpb25zRnJvbVByb3ZpZGVycyAob3B0aW9ucykge1xuICAgIGxldCBzdWdnZXN0aW9uc1Byb21pc2VcbiAgICBjb25zdCBwcm92aWRlcnMgPSB0aGlzLnByb3ZpZGVyTWFuYWdlci5hcHBsaWNhYmxlUHJvdmlkZXJzKG9wdGlvbnMuZWRpdG9yLCBvcHRpb25zLnNjb3BlRGVzY3JpcHRvcilcblxuICAgIGNvbnN0IHByb3ZpZGVyUHJvbWlzZXMgPSBbXVxuICAgIHByb3ZpZGVycy5mb3JFYWNoKHByb3ZpZGVyID0+IHtcbiAgICAgIGNvbnN0IGFwaVZlcnNpb24gPSB0aGlzLnByb3ZpZGVyTWFuYWdlci5hcGlWZXJzaW9uRm9yUHJvdmlkZXIocHJvdmlkZXIpXG4gICAgICBjb25zdCBhcGlJczIwID0gc2VtdmVyLnNhdGlzZmllcyhhcGlWZXJzaW9uLCAnPj0yLjAuMCcpXG5cbiAgICAgIC8vIFRPRE8gQVBJOiByZW1vdmUgdXBncmFkaW5nIHdoZW4gMS4wIHN1cHBvcnQgaXMgcmVtb3ZlZFxuICAgICAgbGV0IGdldFN1Z2dlc3Rpb25zXG4gICAgICBsZXQgdXBncmFkZWRPcHRpb25zXG4gICAgICBpZiAoYXBpSXMyMCkge1xuICAgICAgICBnZXRTdWdnZXN0aW9ucyA9IHByb3ZpZGVyLmdldFN1Z2dlc3Rpb25zLmJpbmQocHJvdmlkZXIpXG4gICAgICAgIHVwZ3JhZGVkT3B0aW9ucyA9IG9wdGlvbnNcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGdldFN1Z2dlc3Rpb25zID0gcHJvdmlkZXIucmVxdWVzdEhhbmRsZXIuYmluZChwcm92aWRlcilcbiAgICAgICAgdXBncmFkZWRPcHRpb25zID0ge1xuICAgICAgICAgIGVkaXRvcjogb3B0aW9ucy5lZGl0b3IsXG4gICAgICAgICAgcHJlZml4OiBvcHRpb25zLnByZWZpeCxcbiAgICAgICAgICBidWZmZXJQb3NpdGlvbjogb3B0aW9ucy5idWZmZXJQb3NpdGlvbixcbiAgICAgICAgICBwb3NpdGlvbjogb3B0aW9ucy5idWZmZXJQb3NpdGlvbixcbiAgICAgICAgICBzY29wZTogb3B0aW9ucy5zY29wZURlc2NyaXB0b3IsXG4gICAgICAgICAgc2NvcGVDaGFpbjogb3B0aW9ucy5zY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVDaGFpbigpLFxuICAgICAgICAgIGJ1ZmZlcjogb3B0aW9ucy5lZGl0b3IuZ2V0QnVmZmVyKCksXG4gICAgICAgICAgY3Vyc29yOiBvcHRpb25zLmVkaXRvci5nZXRMYXN0Q3Vyc29yKClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcHJvdmlkZXJQcm9taXNlcy5wdXNoKFByb21pc2UucmVzb2x2ZShnZXRTdWdnZXN0aW9ucyh1cGdyYWRlZE9wdGlvbnMpKS50aGVuKHByb3ZpZGVyU3VnZ2VzdGlvbnMgPT4ge1xuICAgICAgICBpZiAocHJvdmlkZXJTdWdnZXN0aW9ucyA9PSBudWxsKSB7IHJldHVybiB9XG5cbiAgICAgICAgLy8gVE9ETyBBUEk6IHJlbW92ZSB1cGdyYWRpbmcgd2hlbiAxLjAgc3VwcG9ydCBpcyByZW1vdmVkXG4gICAgICAgIGxldCBoYXNEZXByZWNhdGlvbnMgPSBmYWxzZVxuICAgICAgICBpZiAoYXBpSXMyMCAmJiBwcm92aWRlclN1Z2dlc3Rpb25zLmxlbmd0aCkge1xuICAgICAgICAgIGhhc0RlcHJlY2F0aW9ucyA9IHRoaXMuZGVwcmVjYXRlRm9yU3VnZ2VzdGlvbihwcm92aWRlciwgcHJvdmlkZXJTdWdnZXN0aW9uc1swXSlcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNEZXByZWNhdGlvbnMgfHwgIWFwaUlzMjApIHtcbiAgICAgICAgICBwcm92aWRlclN1Z2dlc3Rpb25zID0gcHJvdmlkZXJTdWdnZXN0aW9ucy5tYXAoKHN1Z2dlc3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1N1Z2dlc3Rpb24gPSB7XG4gICAgICAgICAgICAgIHRleHQ6IHN1Z2dlc3Rpb24udGV4dCAhPSBudWxsID8gc3VnZ2VzdGlvbi50ZXh0IDogc3VnZ2VzdGlvbi53b3JkLFxuICAgICAgICAgICAgICBzbmlwcGV0OiBzdWdnZXN0aW9uLnNuaXBwZXQsXG4gICAgICAgICAgICAgIHJlcGxhY2VtZW50UHJlZml4OiBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4ICE9IG51bGwgPyBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4IDogc3VnZ2VzdGlvbi5wcmVmaXgsXG4gICAgICAgICAgICAgIGNsYXNzTmFtZTogc3VnZ2VzdGlvbi5jbGFzc05hbWUsXG4gICAgICAgICAgICAgIHR5cGU6IHN1Z2dlc3Rpb24udHlwZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKChuZXdTdWdnZXN0aW9uLnJpZ2h0TGFiZWxIVE1MID09IG51bGwpICYmIHN1Z2dlc3Rpb24ucmVuZGVyTGFiZWxBc0h0bWwpIHsgbmV3U3VnZ2VzdGlvbi5yaWdodExhYmVsSFRNTCA9IHN1Z2dlc3Rpb24ubGFiZWwgfVxuICAgICAgICAgICAgaWYgKChuZXdTdWdnZXN0aW9uLnJpZ2h0TGFiZWwgPT0gbnVsbCkgJiYgIXN1Z2dlc3Rpb24ucmVuZGVyTGFiZWxBc0h0bWwpIHsgbmV3U3VnZ2VzdGlvbi5yaWdodExhYmVsID0gc3VnZ2VzdGlvbi5sYWJlbCB9XG4gICAgICAgICAgICByZXR1cm4gbmV3U3VnZ2VzdGlvblxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaGFzRW1wdHkgPSBmYWxzZSAvLyBPcHRpbWl6YXRpb246IG9ubHkgY3JlYXRlIGFub3RoZXIgYXJyYXkgd2hlbiB0aGVyZSBhcmUgZW1wdHkgaXRlbXNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlclN1Z2dlc3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgc3VnZ2VzdGlvbiA9IHByb3ZpZGVyU3VnZ2VzdGlvbnNbaV1cbiAgICAgICAgICBpZiAoIXN1Z2dlc3Rpb24uc25pcHBldCAmJiAhc3VnZ2VzdGlvbi50ZXh0KSB7IGhhc0VtcHR5ID0gdHJ1ZSB9XG4gICAgICAgICAgaWYgKHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXggPT0gbnVsbCkgeyBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4ID0gdGhpcy5nZXREZWZhdWx0UmVwbGFjZW1lbnRQcmVmaXgob3B0aW9ucy5wcmVmaXgpIH1cbiAgICAgICAgICBzdWdnZXN0aW9uLnByb3ZpZGVyID0gcHJvdmlkZXJcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNFbXB0eSkge1xuICAgICAgICAgIGNvbnN0IHJlcyA9IFtdXG4gICAgICAgICAgZm9yIChjb25zdCBzIG9mIHByb3ZpZGVyU3VnZ2VzdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChzLnNuaXBwZXQgfHwgcy50ZXh0KSB7XG4gICAgICAgICAgICAgIHJlcy5wdXNoKHMpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHByb3ZpZGVyU3VnZ2VzdGlvbnMgPSByZXNcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm92aWRlci5maWx0ZXJTdWdnZXN0aW9ucykge1xuICAgICAgICAgIHByb3ZpZGVyU3VnZ2VzdGlvbnMgPSB0aGlzLmZpbHRlclN1Z2dlc3Rpb25zKHByb3ZpZGVyU3VnZ2VzdGlvbnMsIG9wdGlvbnMpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb3ZpZGVyU3VnZ2VzdGlvbnNcbiAgICAgIH0pKVxuICAgIH0pXG5cbiAgICBpZiAoIXByb3ZpZGVyUHJvbWlzZXMgfHwgIXByb3ZpZGVyUHJvbWlzZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBzdWdnZXN0aW9uc1Byb21pc2UgPSBQcm9taXNlLmFsbChwcm92aWRlclByb21pc2VzKVxuICAgIHRoaXMuY3VycmVudFN1Z2dlc3Rpb25zUHJvbWlzZSA9IHN1Z2dlc3Rpb25zUHJvbWlzZVxuICAgIHJldHVybiB0aGlzLmN1cnJlbnRTdWdnZXN0aW9uc1Byb21pc2VcbiAgICAgIC50aGVuKHRoaXMubWVyZ2VTdWdnZXN0aW9uc0Zyb21Qcm92aWRlcnMpXG4gICAgICAudGhlbihzdWdnZXN0aW9ucyA9PiB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTdWdnZXN0aW9uc1Byb21pc2UgIT09IHN1Z2dlc3Rpb25zUHJvbWlzZSkgeyByZXR1cm4gfVxuICAgICAgICBpZiAob3B0aW9ucy5hY3RpdmF0ZWRNYW51YWxseSAmJiB0aGlzLnNob3VsZERpc3BsYXlTdWdnZXN0aW9ucyAmJiB0aGlzLmF1dG9Db25maXJtU2luZ2xlU3VnZ2VzdGlvbkVuYWJsZWQgJiYgc3VnZ2VzdGlvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgLy8gV2hlbiB0aGVyZSBpcyBvbmUgc3VnZ2VzdGlvbiBpbiBtYW51YWwgbW9kZSwganVzdCBjb25maXJtIGl0XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY29uZmlybShzdWdnZXN0aW9uc1swXSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5U3VnZ2VzdGlvbnMoc3VnZ2VzdGlvbnMsIG9wdGlvbnMpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApXG4gIH1cblxuICBmaWx0ZXJTdWdnZXN0aW9ucyAoc3VnZ2VzdGlvbnMsIHtwcmVmaXh9KSB7XG4gICAgY29uc3QgcmVzdWx0cyA9IFtdXG4gICAgY29uc3QgZnV6emFsZHJpblByb3ZpZGVyID0gdGhpcy51c2VBbHRlcm5hdGVTY29yaW5nID8gZnV6emFsZHJpblBsdXMgOiBmdXp6YWxkcmluXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWdnZXN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gc29ydFNjb3JlIG1vc3RseSBwcmVzZXJ2ZXMgaW4gdGhlIG9yaWdpbmFsIHNvcnRpbmcuIFRoZSBmdW5jdGlvbiBpc1xuICAgICAgLy8gY2hvc2VuIHN1Y2ggdGhhdCBzdWdnZXN0aW9ucyB3aXRoIGEgdmVyeSBoaWdoIG1hdGNoIHNjb3JlIGNhbiBicmVhayBvdXQuXG4gICAgICBsZXQgc2NvcmVcbiAgICAgIGNvbnN0IHN1Z2dlc3Rpb24gPSBzdWdnZXN0aW9uc1tpXVxuICAgICAgc3VnZ2VzdGlvbi5zb3J0U2NvcmUgPSBNYXRoLm1heCgoLWkgLyAxMCkgKyAzLCAwKSArIDFcbiAgICAgIHN1Z2dlc3Rpb24uc2NvcmUgPSBudWxsXG5cbiAgICAgIGNvbnN0IHRleHQgPSAoc3VnZ2VzdGlvbi5zbmlwcGV0IHx8IHN1Z2dlc3Rpb24udGV4dClcbiAgICAgIGNvbnN0IHN1Z2dlc3Rpb25QcmVmaXggPSBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4ICE9IG51bGwgPyBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4IDogcHJlZml4XG4gICAgICBjb25zdCBwcmVmaXhJc0VtcHR5ID0gIXN1Z2dlc3Rpb25QcmVmaXggfHwgc3VnZ2VzdGlvblByZWZpeCA9PT0gJyAnXG4gICAgICBjb25zdCBmaXJzdENoYXJJc01hdGNoID0gIXByZWZpeElzRW1wdHkgJiYgc3VnZ2VzdGlvblByZWZpeFswXS50b0xvd2VyQ2FzZSgpID09PSB0ZXh0WzBdLnRvTG93ZXJDYXNlKClcblxuICAgICAgaWYgKHByZWZpeElzRW1wdHkpIHtcbiAgICAgICAgcmVzdWx0cy5wdXNoKHN1Z2dlc3Rpb24pXG4gICAgICB9XG4gICAgICBpZiAoZmlyc3RDaGFySXNNYXRjaCAmJiAoc2NvcmUgPSBmdXp6YWxkcmluUHJvdmlkZXIuc2NvcmUodGV4dCwgc3VnZ2VzdGlvblByZWZpeCkpID4gMCkge1xuICAgICAgICBzdWdnZXN0aW9uLnNjb3JlID0gc2NvcmUgKiBzdWdnZXN0aW9uLnNvcnRTY29yZVxuICAgICAgICByZXN1bHRzLnB1c2goc3VnZ2VzdGlvbilcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXN1bHRzLnNvcnQodGhpcy5yZXZlcnNlU29ydE9uU2NvcmVDb21wYXJhdG9yKVxuICAgIHJldHVybiByZXN1bHRzXG4gIH1cblxuICByZXZlcnNlU29ydE9uU2NvcmVDb21wYXJhdG9yIChhLCBiKSB7XG4gICAgbGV0IGJzY29yZSA9IGIuc2NvcmVcbiAgICBpZiAoIWJzY29yZSkge1xuICAgICAgYnNjb3JlID0gYi5zb3J0U2NvcmVcbiAgICB9XG4gICAgbGV0IGFzY29yZSA9IGEuc2NvcmVcbiAgICBpZiAoIWFzY29yZSkge1xuICAgICAgYXNjb3JlID0gYi5zb3J0U2NvcmVcbiAgICB9XG4gICAgcmV0dXJuIGJzY29yZSAtIGFzY29yZVxuICB9XG5cbiAgLy8gcHJvdmlkZXJTdWdnZXN0aW9ucyAtIGFycmF5IG9mIGFycmF5cyBvZiBzdWdnZXN0aW9ucyBwcm92aWRlZCBieSBhbGwgY2FsbGVkIHByb3ZpZGVyc1xuICBtZXJnZVN1Z2dlc3Rpb25zRnJvbVByb3ZpZGVycyAocHJvdmlkZXJTdWdnZXN0aW9ucykge1xuICAgIHJldHVybiBwcm92aWRlclN1Z2dlc3Rpb25zLnJlZHVjZSgoc3VnZ2VzdGlvbnMsIHByb3ZpZGVyU3VnZ2VzdGlvbnMpID0+IHtcbiAgICAgIGlmIChwcm92aWRlclN1Z2dlc3Rpb25zICYmIHByb3ZpZGVyU3VnZ2VzdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgIHN1Z2dlc3Rpb25zID0gc3VnZ2VzdGlvbnMuY29uY2F0KHByb3ZpZGVyU3VnZ2VzdGlvbnMpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBzdWdnZXN0aW9uc1xuICAgIH0sIFtdKVxuICB9XG5cbiAgZGVwcmVjYXRlRm9yU3VnZ2VzdGlvbiAocHJvdmlkZXIsIHN1Z2dlc3Rpb24pIHtcbiAgICBsZXQgaGFzRGVwcmVjYXRpb25zID0gZmFsc2VcbiAgICBpZiAoc3VnZ2VzdGlvbi53b3JkICE9IG51bGwpIHtcbiAgICAgIGhhc0RlcHJlY2F0aW9ucyA9IHRydWVcbiAgICAgIGlmICh0eXBlb2YgZ3JpbSA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JpbSA9PT0gbnVsbCkgeyBncmltID0gcmVxdWlyZSgnZ3JpbScpIH1cbiAgICAgIGdyaW0uZGVwcmVjYXRlKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xucmV0dXJucyBzdWdnZXN0aW9ucyB3aXRoIGEgXFxgd29yZFxcYCBhdHRyaWJ1dGUuXG5UaGUgXFxgd29yZFxcYCBhdHRyaWJ1dGUgaXMgbm93IFxcYHRleHRcXGAuXG5TZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXV0b2NvbXBsZXRlLXBsdXMvd2lraS9Qcm92aWRlci1BUElgXG4gICAgICApXG4gICAgfVxuICAgIGlmIChzdWdnZXN0aW9uLnByZWZpeCAhPSBudWxsKSB7XG4gICAgICBoYXNEZXByZWNhdGlvbnMgPSB0cnVlXG4gICAgICBpZiAodHlwZW9mIGdyaW0gPT09ICd1bmRlZmluZWQnIHx8IGdyaW0gPT09IG51bGwpIHsgZ3JpbSA9IHJlcXVpcmUoJ2dyaW0nKSB9XG4gICAgICBncmltLmRlcHJlY2F0ZShgQXV0b2NvbXBsZXRlIHByb3ZpZGVyICcke3Byb3ZpZGVyLmNvbnN0cnVjdG9yLm5hbWV9KCR7cHJvdmlkZXIuaWR9KSdcbnJldHVybnMgc3VnZ2VzdGlvbnMgd2l0aCBhIFxcYHByZWZpeFxcYCBhdHRyaWJ1dGUuXG5UaGUgXFxgcHJlZml4XFxgIGF0dHJpYnV0ZSBpcyBub3cgXFxgcmVwbGFjZW1lbnRQcmVmaXhcXGAgYW5kIGlzIG9wdGlvbmFsLlxuU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1wbHVzL3dpa2kvUHJvdmlkZXItQVBJYFxuICAgICAgKVxuICAgIH1cbiAgICBpZiAoc3VnZ2VzdGlvbi5sYWJlbCAhPSBudWxsKSB7XG4gICAgICBoYXNEZXByZWNhdGlvbnMgPSB0cnVlXG4gICAgICBpZiAodHlwZW9mIGdyaW0gPT09ICd1bmRlZmluZWQnIHx8IGdyaW0gPT09IG51bGwpIHsgZ3JpbSA9IHJlcXVpcmUoJ2dyaW0nKSB9XG4gICAgICBncmltLmRlcHJlY2F0ZShgQXV0b2NvbXBsZXRlIHByb3ZpZGVyICcke3Byb3ZpZGVyLmNvbnN0cnVjdG9yLm5hbWV9KCR7cHJvdmlkZXIuaWR9KSdcbnJldHVybnMgc3VnZ2VzdGlvbnMgd2l0aCBhIFxcYGxhYmVsXFxgIGF0dHJpYnV0ZS5cblRoZSBcXGBsYWJlbFxcYCBhdHRyaWJ1dGUgaXMgbm93IFxcYHJpZ2h0TGFiZWxcXGAgb3IgXFxgcmlnaHRMYWJlbEhUTUxcXGAuXG5TZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXV0b2NvbXBsZXRlLXBsdXMvd2lraS9Qcm92aWRlci1BUElgXG4gICAgICApXG4gICAgfVxuICAgIGlmIChzdWdnZXN0aW9uLm9uV2lsbENvbmZpcm0gIT0gbnVsbCkge1xuICAgICAgaGFzRGVwcmVjYXRpb25zID0gdHJ1ZVxuICAgICAgaWYgKHR5cGVvZiBncmltID09PSAndW5kZWZpbmVkJyB8fCBncmltID09PSBudWxsKSB7IGdyaW0gPSByZXF1aXJlKCdncmltJykgfVxuICAgICAgZ3JpbS5kZXByZWNhdGUoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5yZXR1cm5zIHN1Z2dlc3Rpb25zIHdpdGggYSBcXGBvbldpbGxDb25maXJtXFxgIGNhbGxiYWNrLlxuVGhlIFxcYG9uV2lsbENvbmZpcm1cXGAgY2FsbGJhY2sgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZC5cblNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtcGx1cy93aWtpL1Byb3ZpZGVyLUFQSWBcbiAgICAgIClcbiAgICB9XG4gICAgaWYgKHN1Z2dlc3Rpb24ub25EaWRDb25maXJtICE9IG51bGwpIHtcbiAgICAgIGhhc0RlcHJlY2F0aW9ucyA9IHRydWVcbiAgICAgIGlmICh0eXBlb2YgZ3JpbSA9PT0gJ3VuZGVmaW5lZCcgfHwgZ3JpbSA9PT0gbnVsbCkgeyBncmltID0gcmVxdWlyZSgnZ3JpbScpIH1cbiAgICAgIGdyaW0uZGVwcmVjYXRlKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xucmV0dXJucyBzdWdnZXN0aW9ucyB3aXRoIGEgXFxgb25EaWRDb25maXJtXFxgIGNhbGxiYWNrLlxuVGhlIFxcYG9uRGlkQ29uZmlybVxcYCBjYWxsYmFjayBpcyBub3cgYSBcXGBvbkRpZEluc2VydFN1Z2dlc3Rpb25cXGAgY2FsbGJhY2sgb24gdGhlIHByb3ZpZGVyIGl0c2VsZi5cblNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtcGx1cy93aWtpL1Byb3ZpZGVyLUFQSWBcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGhhc0RlcHJlY2F0aW9uc1xuICB9XG5cbiAgZGlzcGxheVN1Z2dlc3Rpb25zIChzdWdnZXN0aW9ucywgb3B0aW9ucykge1xuICAgIHN1Z2dlc3Rpb25zID0gdGhpcy5nZXRVbmlxdWVTdWdnZXN0aW9ucyhzdWdnZXN0aW9ucylcblxuICAgIGlmICh0aGlzLnNob3VsZERpc3BsYXlTdWdnZXN0aW9ucyAmJiBzdWdnZXN0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0aGlzLnNob3dTdWdnZXN0aW9uTGlzdChzdWdnZXN0aW9ucywgb3B0aW9ucylcbiAgICB9IGVsc2Uge1xuICAgICAgLy9yZXR1cm4gdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKVxuICAgIH1cbiAgfVxuXG4gIGdldFVuaXF1ZVN1Z2dlc3Rpb25zIChzdWdnZXN0aW9ucykge1xuICAgIGNvbnN0IHNlZW4gPSB7fVxuICAgIGNvbnN0IHJlc3VsdCA9IFtdXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdWdnZXN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc3VnZ2VzdGlvbiA9IHN1Z2dlc3Rpb25zW2ldXG4gICAgICBjb25zdCB2YWwgPSBzdWdnZXN0aW9uLnRleHQgKyBzdWdnZXN0aW9uLnNuaXBwZXRcbiAgICAgIGlmICghc2Vlblt2YWxdKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHN1Z2dlc3Rpb24pXG4gICAgICAgIHNlZW5bdmFsXSA9IHRydWVcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgZ2V0UHJlZml4IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKSB7XG4gICAgY29uc3QgbGluZSA9IGVkaXRvci5nZXRUZXh0SW5SYW5nZShbW2J1ZmZlclBvc2l0aW9uLnJvdywgMF0sIGJ1ZmZlclBvc2l0aW9uXSlcbiAgICBjb25zdCBwcmVmaXggPSB0aGlzLnByZWZpeFJlZ2V4LmV4ZWMobGluZSlcbiAgICBpZiAoIXByZWZpeCB8fCAhcHJlZml4WzJdKSB7XG4gICAgICByZXR1cm4gJydcbiAgICB9XG4gICAgcmV0dXJuIHByZWZpeFsyXVxuICB9XG5cbiAgZ2V0RGVmYXVsdFJlcGxhY2VtZW50UHJlZml4IChwcmVmaXgpIHtcbiAgICBpZiAodGhpcy53b3JkUHJlZml4UmVnZXgudGVzdChwcmVmaXgpKSB7XG4gICAgICByZXR1cm4gcHJlZml4XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnJ1xuICAgIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IEdldHMgY2FsbGVkIHdoZW4gdGhlIHVzZXIgc3VjY2Vzc2Z1bGx5IGNvbmZtcm1zIGEgc3VnZ2VzdGlvblxuICAvL1xuICAvLyBtYXRjaCAtIEFuIHtPYmplY3R9IHJlcHJlc2VudGluZyB0aGUgY29uZmlybWVkIHN1Z2dlc3Rpb25cbiAgY29uZmlybSAoc3VnZ2VzdGlvbiwga2V5c3Ryb2tlKSB7XG4gICAgaWYgKCh0aGlzLmVkaXRvciA9PSBudWxsKSB8fCAoc3VnZ2VzdGlvbiA9PSBudWxsKSB8fCAhIXRoaXMuZGlzcG9zZWQpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IGFwaVZlcnNpb24gPSB0aGlzLnByb3ZpZGVyTWFuYWdlci5hcGlWZXJzaW9uRm9yUHJvdmlkZXIoc3VnZ2VzdGlvbi5wcm92aWRlcilcbiAgICBjb25zdCBhcGlJczIwID0gc2VtdmVyLnNhdGlzZmllcyhhcGlWZXJzaW9uLCAnPj0yLjAuMCcpXG4gICAgY29uc3QgdHJpZ2dlclBvc2l0aW9uID0gdGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIC8vIFRPRE8gQVBJOiBSZW1vdmUgYXMgdGhpcyBpcyBubyBsb25nZXIgdXNlZFxuICAgIGlmIChzdWdnZXN0aW9uLm9uV2lsbENvbmZpcm0pIHtcbiAgICAgIHN1Z2dlc3Rpb24ub25XaWxsQ29uZmlybSgpXG4gICAgfVxuXG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgIGlmIChzZWxlY3Rpb25zICYmIHNlbGVjdGlvbnMubGVuZ3RoKSB7XG4gICAgICBmb3IgKGNvbnN0IHMgb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICBpZiAocyAmJiBzLmNsZWFyKSB7XG4gICAgICAgICAgcy5jbGVhcigpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvL3RoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KClcblxuICAgIC8vdGhpcy5yZXBsYWNlVGV4dFdpdGhNYXRjaChzdWdnZXN0aW9uKVxuXG4gICAgLy8gVE9ETyBBUEk6IFJlbW92ZSB3aGVuIHdlIHJlbW92ZSB0aGUgMS4wIEFQSVxuICAgIGlmIChhcGlJczIwKSB7XG4gICAgICBpZiAoc3VnZ2VzdGlvbi5wcm92aWRlciAmJiBzdWdnZXN0aW9uLnByb3ZpZGVyLm9uRGlkSW5zZXJ0U3VnZ2VzdGlvbikge1xuICAgICAgICBzdWdnZXN0aW9uLnByb3ZpZGVyLm9uRGlkSW5zZXJ0U3VnZ2VzdGlvbih7ZWRpdG9yOiB0aGlzLmVkaXRvciwgc3VnZ2VzdGlvbiwgdHJpZ2dlclBvc2l0aW9ufSlcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN1Z2dlc3Rpb24ub25EaWRDb25maXJtKSB7XG4gICAgICAgIHN1Z2dlc3Rpb24ub25EaWRDb25maXJtKClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzaG93U3VnZ2VzdGlvbkxpc3QgKHN1Z2dlc3Rpb25zLCBvcHRpb25zKSB7XG4gICAgaWYgKHRoaXMuZGlzcG9zZWQpIHsgcmV0dXJuIH1cbiAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0LmNoYW5nZUl0ZW1zKHN1Z2dlc3Rpb25zKVxuICAgIHJldHVybiB0aGlzLnN1Z2dlc3Rpb25MaXN0LnNob3codGhpcy5lZGl0b3IsIG9wdGlvbnMpXG4gIH1cblxuICBoaWRlU3VnZ2VzdGlvbkxpc3QgKCkge1xuICAgIGlmICh0aGlzLmRpc3Bvc2VkKSB7IHJldHVybiB9XG4gICAgdGhpcy5zdWdnZXN0aW9uTGlzdC5jaGFuZ2VJdGVtcyhudWxsKVxuICAgIHRoaXMuc3VnZ2VzdGlvbkxpc3QuaGlkZSgpXG4gICAgdGhpcy5zaG91bGREaXNwbGF5U3VnZ2VzdGlvbnMgPSBmYWxzZVxuICB9XG5cbiAgcmVxdWVzdEhpZGVTdWdnZXN0aW9uTGlzdCAoY29tbWFuZCkge1xuICAgIHRoaXMuaGlkZVRpbWVvdXQgPSBzZXRUaW1lb3V0KHRoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0LCAwKVxuICAgIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zID0gZmFsc2VcbiAgfVxuXG4gIGNhbmNlbEhpZGVTdWdnZXN0aW9uTGlzdFJlcXVlc3QgKCkge1xuICAgIHJldHVybiBjbGVhclRpbWVvdXQodGhpcy5oaWRlVGltZW91dClcbiAgfVxuXG4gIC8vIFByaXZhdGU6IFJlcGxhY2VzIHRoZSBjdXJyZW50IHByZWZpeCB3aXRoIHRoZSBnaXZlbiBtYXRjaC5cbiAgLy9cbiAgLy8gbWF0Y2ggLSBUaGUgbWF0Y2ggdG8gcmVwbGFjZSB0aGUgY3VycmVudCBwcmVmaXggd2l0aFxuICByZXBsYWNlVGV4dFdpdGhNYXRjaCAoc3VnZ2VzdGlvbikge1xuICAgIGlmICh0aGlzLmVkaXRvciA9PSBudWxsKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCBjdXJzb3JzID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgaWYgKGN1cnNvcnMgPT0gbnVsbCkgeyByZXR1cm4gfVxuXG4gICAgcmV0dXJuIHRoaXMuZWRpdG9yLnRyYW5zYWN0KCgpID0+IHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY3Vyc29ycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBjdXJzb3JzW2ldXG4gICAgICAgIGNvbnN0IGVuZFBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgY29uc3QgYmVnaW5uaW5nUG9zaXRpb24gPSBbZW5kUG9zaXRpb24ucm93LCBlbmRQb3NpdGlvbi5jb2x1bW4gLSBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4Lmxlbmd0aF1cblxuICAgICAgICBpZiAodGhpcy5lZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW2JlZ2lubmluZ1Bvc2l0aW9uLCBlbmRQb3NpdGlvbl0pID09PSBzdWdnZXN0aW9uLnJlcGxhY2VtZW50UHJlZml4KSB7XG4gICAgICAgICAgY29uc3Qgc3VmZml4ID0gdGhpcy5jb25zdW1lU3VmZml4ID8gdGhpcy5nZXRTdWZmaXgodGhpcy5lZGl0b3IsIGVuZFBvc2l0aW9uLCBzdWdnZXN0aW9uKSA6ICcnXG4gICAgICAgICAgaWYgKHN1ZmZpeC5sZW5ndGgpIHsgY3Vyc29yLm1vdmVSaWdodChzdWZmaXgubGVuZ3RoKSB9XG4gICAgICAgICAgY3Vyc29yLnNlbGVjdGlvbi5zZWxlY3RMZWZ0KHN1Z2dlc3Rpb24ucmVwbGFjZW1lbnRQcmVmaXgubGVuZ3RoICsgc3VmZml4Lmxlbmd0aClcblxuICAgICAgICAgIGlmICgoc3VnZ2VzdGlvbi5zbmlwcGV0ICE9IG51bGwpICYmICh0aGlzLnNuaXBwZXRzTWFuYWdlciAhPSBudWxsKSkge1xuICAgICAgICAgICAgdGhpcy5zbmlwcGV0c01hbmFnZXIuaW5zZXJ0U25pcHBldChzdWdnZXN0aW9uLnNuaXBwZXQsIHRoaXMuZWRpdG9yLCBjdXJzb3IpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnNvci5zZWxlY3Rpb24uaW5zZXJ0VGV4dChzdWdnZXN0aW9uLnRleHQgIT0gbnVsbCA/IHN1Z2dlc3Rpb24udGV4dCA6IHN1Z2dlc3Rpb24uc25pcHBldCwge1xuICAgICAgICAgICAgICBhdXRvSW5kZW50TmV3bGluZTogdGhpcy5lZGl0b3Iuc2hvdWxkQXV0b0luZGVudCgpLFxuICAgICAgICAgICAgICBhdXRvRGVjcmVhc2VJbmRlbnQ6IHRoaXMuZWRpdG9yLnNob3VsZEF1dG9JbmRlbnQoKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgKVxuICB9XG5cbiAgZ2V0U3VmZml4IChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBzdWdnZXN0aW9uKSB7XG4gICAgLy8gVGhpcyBqdXN0IGNoZXdzIHRocm91Z2ggdGhlIHN1Z2dlc3Rpb24gYW5kIHRyaWVzIHRvIG1hdGNoIHRoZSBzdWdnZXN0aW9uXG4gICAgLy8gc3Vic3RyaW5nIHdpdGggdGhlIGxpbmVUZXh0IHN0YXJ0aW5nIGF0IHRoZSBjdXJzb3IuIFRoZXJlIGlzIHByb2JhYmx5IGFcbiAgICAvLyBtb3JlIGVmZmljaWVudCB3YXkgdG8gZG8gdGhpcy5cbiAgICBsZXQgc3VmZml4ID0gKHN1Z2dlc3Rpb24uc25pcHBldCAhPSBudWxsID8gc3VnZ2VzdGlvbi5zbmlwcGV0IDogc3VnZ2VzdGlvbi50ZXh0KVxuICAgIGNvbnN0IGVuZFBvc2l0aW9uID0gW2J1ZmZlclBvc2l0aW9uLnJvdywgYnVmZmVyUG9zaXRpb24uY29sdW1uICsgc3VmZml4Lmxlbmd0aF1cbiAgICBjb25zdCBlbmRPZkxpbmVUZXh0ID0gZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtidWZmZXJQb3NpdGlvbiwgZW5kUG9zaXRpb25dKVxuICAgIGNvbnN0IG5vbldvcmRDaGFyYWN0ZXJzID0gbmV3IFNldChhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5ub25Xb3JkQ2hhcmFjdGVycycpLnNwbGl0KCcnKSlcbiAgICB3aGlsZSAoc3VmZml4KSB7XG4gICAgICBpZiAoZW5kT2ZMaW5lVGV4dC5zdGFydHNXaXRoKHN1ZmZpeCkgJiYgIW5vbldvcmRDaGFyYWN0ZXJzLmhhcyhzdWZmaXhbMF0pKSB7IGJyZWFrIH1cbiAgICAgIHN1ZmZpeCA9IHN1ZmZpeC5zbGljZSgxKVxuICAgIH1cbiAgICByZXR1cm4gc3VmZml4XG4gIH1cblxuICAvLyBQcml2YXRlOiBDaGVja3Mgd2hldGhlciB0aGUgY3VycmVudCBmaWxlIGlzIGJsYWNrbGlzdGVkLlxuICAvL1xuICAvLyBSZXR1cm5zIHtCb29sZWFufSB0aGF0IGRlZmluZXMgd2hldGhlciB0aGUgY3VycmVudCBmaWxlIGlzIGJsYWNrbGlzdGVkXG4gIGlzQ3VycmVudEZpbGVCbGFja0xpc3RlZCAoKSB7XG4gICAgLy8gbWluaW1hdGNoIGlzIHNsb3cuIE5vdCBuZWNlc3NhcnkgdG8gZG8gdGhpcyBjb21wdXRhdGlvbiBvbiBldmVyeSByZXF1ZXN0IGZvciBzdWdnZXN0aW9uc1xuICAgIGxldCBsZWZ0XG4gICAgaWYgKHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgIT0gbnVsbCkgeyByZXR1cm4gdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZSB9XG5cbiAgICBpZiAoKHRoaXMuZmlsZUJsYWNrbGlzdCA9PSBudWxsKSB8fCB0aGlzLmZpbGVCbGFja2xpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gZmFsc2VcbiAgICAgIHJldHVybiB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlXG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBtaW5pbWF0Y2ggPT09ICd1bmRlZmluZWQnIHx8IG1pbmltYXRjaCA9PT0gbnVsbCkgeyBtaW5pbWF0Y2ggPSByZXF1aXJlKCdtaW5pbWF0Y2gnKSB9XG4gICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKChsZWZ0ID0gdGhpcy5idWZmZXIuZ2V0UGF0aCgpKSAhPSBudWxsID8gbGVmdCA6ICcnKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5maWxlQmxhY2tsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBibGFja2xpc3RHbG9iID0gdGhpcy5maWxlQmxhY2tsaXN0W2ldXG4gICAgICBpZiAobWluaW1hdGNoKGZpbGVOYW1lLCBibGFja2xpc3RHbG9iKSkge1xuICAgICAgICB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlID0gdHJ1ZVxuICAgICAgICByZXR1cm4gdGhpcy5pc0N1cnJlbnRGaWxlQmxhY2tMaXN0ZWRDYWNoZVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuaXNDdXJyZW50RmlsZUJsYWNrTGlzdGVkQ2FjaGUgPSBmYWxzZVxuICAgIHJldHVybiB0aGlzLmlzQ3VycmVudEZpbGVCbGFja0xpc3RlZENhY2hlXG4gIH1cblxuICAvLyBQcml2YXRlOiBHZXRzIGNhbGxlZCB3aGVuIHRoZSBjb250ZW50IGhhcyBiZWVuIG1vZGlmaWVkXG4gIHJlcXVlc3ROZXdTdWdnZXN0aW9ucyAoKSB7XG4gICAgbGV0IGRlbGF5ID0gYXRvbS5jb25maWcuZ2V0KCdhdXRvY29tcGxldGUtcGx1cy5hdXRvQWN0aXZhdGlvbkRlbGF5JylcbiAgICBjbGVhclRpbWVvdXQodGhpcy5kZWxheVRpbWVvdXQpXG4gICAgaWYgKHRoaXMuc3VnZ2VzdGlvbkxpc3QuaXNBY3RpdmUoKSkgeyBkZWxheSA9IHRoaXMuc3VnZ2VzdGlvbkRlbGF5IH1cbiAgICB0aGlzLmRlbGF5VGltZW91dCA9IHNldFRpbWVvdXQodGhpcy5maW5kU3VnZ2VzdGlvbnMsIGRlbGF5KVxuICAgIHRoaXMuc2hvdWxkRGlzcGxheVN1Z2dlc3Rpb25zID0gdHJ1ZVxuICB9XG5cbiAgY2FuY2VsTmV3U3VnZ2VzdGlvbnNSZXF1ZXN0ICgpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5kZWxheVRpbWVvdXQpXG4gICAgdGhpcy5zaG91bGREaXNwbGF5U3VnZ2VzdGlvbnMgPSBmYWxzZVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogR2V0cyBjYWxsZWQgd2hlbiB0aGUgY3Vyc29yIGhhcyBtb3ZlZC4gQ2FuY2VscyB0aGUgYXV0b2NvbXBsZXRpb24gaWZcbiAgLy8gdGhlIHRleHQgaGFzIG5vdCBiZWVuIGNoYW5nZWQuXG4gIC8vXG4gIC8vIGRhdGEgLSBBbiB7T2JqZWN0fSBjb250YWluaW5nIGluZm9ybWF0aW9uIG9uIHdoeSB0aGUgY3Vyc29yIGhhcyBiZWVuIG1vdmVkXG4gIGN1cnNvck1vdmVkICh7dGV4dENoYW5nZWR9KSB7XG4gICAgLy8gVGhlIGRlbGF5IGlzIGEgd29ya2Fyb3VuZCBmb3IgdGhlIGJhY2tzcGFjZSBjYXNlLiBUaGUgd2F5IGF0b20gaW1wbGVtZW50c1xuICAgIC8vIGJhY2tzcGFjZSBpcyB0byBzZWxlY3QgbGVmdCAxIGNoYXIsIHRoZW4gZGVsZXRlLiBUaGlzIHJlc3VsdHMgaW4gYVxuICAgIC8vIGN1cnNvck1vdmVkIGV2ZW50IHdpdGggdGV4dENoYW5nZWQgPT0gZmFsc2UuIFNvIHdlIGRlbGF5LCBhbmQgaWYgdGhlXG4gICAgLy8gYnVmZmVyQ2hhbmdlZCBoYW5kbGVyIGRlY2lkZXMgdG8gc2hvdyBzdWdnZXN0aW9ucywgaXQgd2lsbCBjYW5jZWwgdGhlXG4gICAgLy8gaGlkZVN1Z2dlc3Rpb25MaXN0IHJlcXVlc3QuIElmIHRoZXJlIGlzIG5vIGJ1ZmZlckNoYW5nZWQgZXZlbnQsXG4gICAgLy8gc3VnZ2VzdGlvbkxpc3Qgd2lsbCBiZSBoaWRkZW4uXG4gICAgLy9pZiAoIXRleHRDaGFuZ2VkICYmICF0aGlzLnNob3VsZEFjdGl2YXRlKSB7IHJldHVybiB0aGlzLnJlcXVlc3RIaWRlU3VnZ2VzdGlvbkxpc3QoKSB9XG4gIH1cblxuICAvLyBQcml2YXRlOiBHZXRzIGNhbGxlZCB3aGVuIHRoZSB1c2VyIHNhdmVzIHRoZSBkb2N1bWVudC4gQ2FuY2VscyB0aGVcbiAgLy8gYXV0b2NvbXBsZXRpb24uXG4gIGJ1ZmZlclNhdmVkICgpIHtcbiAgICBpZiAoIXRoaXMuYXV0b3NhdmVFbmFibGVkKSB7IHJldHVybiB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCgpIH1cbiAgfVxuXG4gIHRvZ2dsZUFjdGl2YXRpb25Gb3JCdWZmZXJDaGFuZ2UgKHtuZXdUZXh0LCBuZXdSYW5nZSwgb2xkVGV4dCwgb2xkUmFuZ2V9KSB7XG4gICAgaWYgKHRoaXMuZGlzcG9zZWQpIHsgcmV0dXJuIH1cbiAgICBpZiAodGhpcy5zaG91bGRBY3RpdmF0ZSkgeyByZXR1cm4gfVxuICAgIC8vaWYgKHRoaXMuY29tcG9zaXRpb25JblByb2dyZXNzKSB7IHJldHVybiB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCgpIH1cblxuICAgIGlmICh0aGlzLmF1dG9BY3RpdmF0aW9uRW5hYmxlZCB8fCB0aGlzLnN1Z2dlc3Rpb25MaXN0LmlzQWN0aXZlKCkpIHtcbiAgICAgIGlmIChuZXdUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gQWN0aXZhdGUgb24gc3BhY2UsIGEgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyLCBvciBhIGJyYWNrZXQtbWF0Y2hlciBwYWlyLlxuICAgICAgICBpZiAobmV3VGV4dCA9PT0gJyAnIHx8IG5ld1RleHQudHJpbSgpLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIHRoaXMuc2hvdWxkQWN0aXZhdGUgPSB0cnVlXG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV3VGV4dC5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IHBhaXIgb2YgdGhpcy5icmFja2V0TWF0Y2hlclBhaXJzKSB7XG4gICAgICAgICAgICBpZiAobmV3VGV4dCA9PT0gcGFpcikge1xuICAgICAgICAgICAgICB0aGlzLnNob3VsZEFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChvbGRUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gU3VnZ2VzdGlvbiBsaXN0IG11c3QgYmUgZWl0aGVyIGFjdGl2ZSBvciBiYWNrc3BhY2VUcmlnZ2Vyc0F1dG9jb21wbGV0ZSBtdXN0IGJlIHRydWUgZm9yIGFjdGl2YXRpb24gdG8gb2NjdXIuXG4gICAgICAgIC8vIEFjdGl2YXRlIG9uIHJlbW92YWwgb2YgYSBzcGFjZSwgYSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIsIG9yIGEgYnJhY2tldC1tYXRjaGVyIHBhaXIuXG4gICAgICAgIGlmICh0aGlzLmJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlIHx8IHRoaXMuc3VnZ2VzdGlvbkxpc3QuaXNBY3RpdmUoKSkge1xuICAgICAgICAgIGlmIChvbGRUZXh0Lmxlbmd0aCA+IDAgJiYgKHRoaXMuYmFja3NwYWNlVHJpZ2dlcnNBdXRvY29tcGxldGUgfHwgdGhpcy5zdWdnZXN0aW9uTGlzdC5pc0FjdGl2ZSgpKSkge1xuICAgICAgICAgICAgaWYgKG9sZFRleHQgPT09ICcgJyB8fCBvbGRUZXh0LnRyaW0oKS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG9sZFRleHQubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICAgIGZvciAoY29uc3QgcGFpciBvZiB0aGlzLmJyYWNrZXRNYXRjaGVyUGFpcnMpIHtcbiAgICAgICAgICAgICAgICBpZiAob2xkVGV4dCA9PT0gcGFpcikge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc2hvdWxkQWN0aXZhdGUgJiYgdGhpcy5zaG91bGRTdXBwcmVzc0FjdGl2YXRpb25Gb3JFZGl0b3JDbGFzc2VzKCkpIHtcbiAgICAgICAgdGhpcy5zaG91bGRBY3RpdmF0ZSA9IGZhbHNlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2hvd09ySGlkZVN1Z2dlc3Rpb25MaXN0Rm9yQnVmZmVyQ2hhbmdlcyAoe2NoYW5nZXN9KSB7XG4gICAgY29uc3QgbGFzdEN1cnNvclBvc2l0aW9uID0gdGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBjb25zdCBjaGFuZ2VPY2N1cnJlZE5lYXJMYXN0Q3Vyc29yID0gY2hhbmdlcy5zb21lKCh7c3RhcnQsIG5ld0V4dGVudH0pID0+IHtcbiAgICAgIGNvbnN0IG5ld1JhbmdlID0gbmV3IFJhbmdlKHN0YXJ0LCBzdGFydC50cmF2ZXJzZShuZXdFeHRlbnQpKVxuICAgICAgcmV0dXJuIG5ld1JhbmdlLmNvbnRhaW5zUG9pbnQobGFzdEN1cnNvclBvc2l0aW9uKVxuICAgIH0pXG5cbiAgICBpZiAodGhpcy5zaG91bGRBY3RpdmF0ZSAmJiBjaGFuZ2VPY2N1cnJlZE5lYXJMYXN0Q3Vyc29yKSB7XG4gICAgICB0aGlzLmNhbmNlbEhpZGVTdWdnZXN0aW9uTGlzdFJlcXVlc3QoKVxuICAgICAgdGhpcy5yZXF1ZXN0TmV3U3VnZ2VzdGlvbnMoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbmNlbE5ld1N1Z2dlc3Rpb25zUmVxdWVzdCgpXG4gICAgICAvL3RoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KClcbiAgICB9XG5cbiAgICB0aGlzLnNob3VsZEFjdGl2YXRlID0gZmFsc2VcbiAgfVxuXG4gIHNob3dPckhpZGVTdWdnZXN0aW9uTGlzdEZvckJ1ZmZlckNoYW5nZSAoe25ld1RleHQsIG5ld1JhbmdlLCBvbGRUZXh0LCBvbGRSYW5nZX0pIHtcbiAgICBpZiAodGhpcy5kaXNwb3NlZCkgeyByZXR1cm4gfVxuICAgIC8vaWYgKHRoaXMuY29tcG9zaXRpb25JblByb2dyZXNzKSB7IHJldHVybiB0aGlzLmhpZGVTdWdnZXN0aW9uTGlzdCgpIH1cbiAgICBsZXQgc2hvdWxkQWN0aXZhdGUgPSBmYWxzZVxuICAgIGNvbnN0IGN1cnNvclBvc2l0aW9ucyA9IHRoaXMuZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9ucygpXG5cbiAgICBpZiAodGhpcy5hdXRvQWN0aXZhdGlvbkVuYWJsZWQgfHwgdGhpcy5zdWdnZXN0aW9uTGlzdC5pc0FjdGl2ZSgpKSB7XG4gICAgICAvLyBBY3RpdmF0ZSBvbiBzcGFjZSwgYSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIsIG9yIGEgYnJhY2tldC1tYXRjaGVyIHBhaXIuXG4gICAgICBpZiAobmV3VGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmIChjdXJzb3JQb3NpdGlvbnMuc29tZSgocG9zaXRpb24pID0+IHsgcmV0dXJuIG5ld1JhbmdlLmNvbnRhaW5zUG9pbnQocG9zaXRpb24pIH0pKSB7XG4gICAgICAgICAgaWYgKG5ld1RleHQgPT09ICcgJyB8fCBuZXdUZXh0LnRyaW0oKS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHNob3VsZEFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobmV3VGV4dC5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcGFpciBvZiB0aGlzLmJyYWNrZXRNYXRjaGVyUGFpcnMpIHtcbiAgICAgICAgICAgICAgaWYgKG5ld1RleHQgPT09IHBhaXIpIHtcbiAgICAgICAgICAgICAgICBzaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgLy8gU3VnZ2VzdGlvbiBsaXN0IG11c3QgYmUgZWl0aGVyIGFjdGl2ZSBvciBiYWNrc3BhY2VUcmlnZ2Vyc0F1dG9jb21wbGV0ZSBtdXN0IGJlIHRydWUgZm9yIGFjdGl2YXRpb24gdG8gb2NjdXIuXG4gICAgICAvLyBBY3RpdmF0ZSBvbiByZW1vdmFsIG9mIGEgc3BhY2UsIGEgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyLCBvciBhIGJyYWNrZXQtbWF0Y2hlciBwYWlyLlxuICAgICAgfSBlbHNlIGlmIChvbGRUZXh0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaWYgKCh0aGlzLmJhY2tzcGFjZVRyaWdnZXJzQXV0b2NvbXBsZXRlIHx8IHRoaXMuc3VnZ2VzdGlvbkxpc3QuaXNBY3RpdmUoKSkgJiZcbiAgICAgICAgKGN1cnNvclBvc2l0aW9ucy5zb21lKChwb3NpdGlvbikgPT4geyByZXR1cm4gbmV3UmFuZ2UuY29udGFpbnNQb2ludChwb3NpdGlvbikgfSkpKSB7XG4gICAgICAgICAgaWYgKG9sZFRleHQgPT09ICcgJyB8fCBvbGRUZXh0LnRyaW0oKS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHNob3VsZEFjdGl2YXRlID0gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAob2xkVGV4dC5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgcGFpciBvZiB0aGlzLmJyYWNrZXRNYXRjaGVyUGFpcnMpIHtcbiAgICAgICAgICAgICAgaWYgKG9sZFRleHQgPT09IHBhaXIpIHtcbiAgICAgICAgICAgICAgICBzaG91bGRBY3RpdmF0ZSA9IHRydWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoc2hvdWxkQWN0aXZhdGUgJiYgdGhpcy5zaG91bGRTdXBwcmVzc0FjdGl2YXRpb25Gb3JFZGl0b3JDbGFzc2VzKCkpIHsgc2hvdWxkQWN0aXZhdGUgPSBmYWxzZSB9XG4gICAgfVxuXG4gICAgaWYgKHNob3VsZEFjdGl2YXRlKSB7XG4gICAgICB0aGlzLmNhbmNlbEhpZGVTdWdnZXN0aW9uTGlzdFJlcXVlc3QoKVxuICAgICAgdGhpcy5yZXF1ZXN0TmV3U3VnZ2VzdGlvbnMoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNhbmNlbE5ld1N1Z2dlc3Rpb25zUmVxdWVzdCgpXG4gICAgICAvL3RoaXMuaGlkZVN1Z2dlc3Rpb25MaXN0KClcbiAgICB9XG4gIH1cblxuICBzaG91bGRTdXBwcmVzc0FjdGl2YXRpb25Gb3JFZGl0b3JDbGFzc2VzICgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc3VwcHJlc3NGb3JDbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjbGFzc05hbWVzID0gdGhpcy5zdXBwcmVzc0ZvckNsYXNzZXNbaV1cbiAgICAgIGxldCBjb250YWluc0NvdW50ID0gMFxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjbGFzc05hbWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNsYXNzTmFtZXNbal1cbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yVmlldy5jbGFzc0xpc3QuY29udGFpbnMoY2xhc3NOYW1lKSkgeyBjb250YWluc0NvdW50ICs9IDEgfVxuICAgICAgfVxuICAgICAgaWYgKGNvbnRhaW5zQ291bnQgPT09IGNsYXNzTmFtZXMubGVuZ3RoKSB7IHJldHVybiB0cnVlIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyBQdWJsaWM6IENsZWFuIHVwLCBzdG9wIGxpc3RlbmluZyB0byBldmVudHNcbiAgZGlzcG9zZSAoKSB7XG4gICAgdGhpcy5oaWRlU3VnZ2VzdGlvbkxpc3QoKVxuICAgIHRoaXMuZGlzcG9zZWQgPSB0cnVlXG4gICAgdGhpcy5yZWFkeSA9IGZhbHNlXG4gICAgaWYgKHRoaXMuZWRpdG9yU3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5lZGl0b3JTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLmVkaXRvclN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgaWYgKHRoaXMuc3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgdGhpcy5zdWdnZXN0aW9uTGlzdCA9IG51bGxcbiAgICB0aGlzLnByb3ZpZGVyTWFuYWdlciA9IG51bGxcbiAgfVxufVxuIl19