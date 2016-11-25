(function() {
  var BlockwiseSelection, CompositeDisposable, CursorStyleManager, Delegato, Disposable, Emitter, FlashManager, HighlightSearchManager, HoverElement, Input, MarkManager, ModeManager, MutationManager, OccurrenceManager, OperationStack, PersistentSelectionManager, Range, RegisterManager, SearchHistoryManager, SearchInputElement, VimState, _, debug, getVisibleEditors, haveSomeNonEmptySelection, highlightRanges, jQuery, matchScopes, packageScope, ref, ref1, semver, settings, swrap,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  semver = require('semver');

  Delegato = require('delegato');

  jQuery = require('atom-space-pen-views').jQuery;

  _ = require('underscore-plus');

  ref = require('atom'), Emitter = ref.Emitter, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable, Range = ref.Range;

  settings = require('./settings');

  HoverElement = require('./hover').HoverElement;

  Input = require('./input');

  SearchInputElement = require('./search-input');

  ref1 = require('./utils'), haveSomeNonEmptySelection = ref1.haveSomeNonEmptySelection, highlightRanges = ref1.highlightRanges, getVisibleEditors = ref1.getVisibleEditors, matchScopes = ref1.matchScopes, debug = ref1.debug;

  swrap = require('./selection-wrapper');

  OperationStack = require('./operation-stack');

  MarkManager = require('./mark-manager');

  ModeManager = require('./mode-manager');

  RegisterManager = require('./register-manager');

  SearchHistoryManager = require('./search-history-manager');

  CursorStyleManager = require('./cursor-style-manager');

  BlockwiseSelection = require('./blockwise-selection');

  OccurrenceManager = require('./occurrence-manager');

  HighlightSearchManager = require('./highlight-search-manager');

  MutationManager = require('./mutation-manager');

  PersistentSelectionManager = require('./persistent-selection-manager');

  FlashManager = require('./flash-manager');

  packageScope = 'vim-mode-plus';

  module.exports = VimState = (function() {
    Delegato.includeInto(VimState);

    VimState.prototype.destroyed = false;

    VimState.delegatesProperty('mode', 'submode', {
      toProperty: 'modeManager'
    });

    VimState.delegatesMethods('isMode', 'activate', {
      toProperty: 'modeManager'
    });

    VimState.delegatesMethods('flash', 'flashScreenRange', {
      toProperty: 'flashManager'
    });

    VimState.delegatesMethods('subscribe', 'getCount', 'setCount', 'hasCount', 'addToClassList', {
      toProperty: 'operationStack'
    });

    function VimState(editor, statusBarManager, globalState) {
      var refreshHighlightSearch;
      this.editor = editor;
      this.statusBarManager = statusBarManager;
      this.globalState = globalState;
      this.editorElement = this.editor.element;
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.modeManager = new ModeManager(this);
      this.mark = new MarkManager(this);
      this.register = new RegisterManager(this);
      this.hover = new HoverElement().initialize(this);
      this.hoverSearchCounter = new HoverElement().initialize(this);
      this.searchHistory = new SearchHistoryManager(this);
      this.highlightSearch = new HighlightSearchManager(this);
      this.persistentSelection = new PersistentSelectionManager(this);
      this.occurrenceManager = new OccurrenceManager(this);
      this.mutationManager = new MutationManager(this);
      this.flashManager = new FlashManager(this);
      this.input = new Input(this);
      this.searchInput = new SearchInputElement().initialize(this);
      this.operationStack = new OperationStack(this);
      this.cursorStyleManager = new CursorStyleManager(this);
      this.blockwiseSelections = [];
      this.previousSelection = {};
      this.observeSelection();
      refreshHighlightSearch = (function(_this) {
        return function() {
          return _this.highlightSearch.refresh();
        };
      })(this);
      this.subscriptions.add(this.editor.onDidStopChanging(refreshHighlightSearch));
      this.subscriptions.add(this.editor.observeSelections((function(_this) {
        return function(selection) {
          if (_this.operationStack.isProcessing()) {
            return;
          }
          if (!swrap(selection).hasProperties()) {
            swrap(selection).saveProperties();
            _this.updateCursorsVisibility();
            return _this.editorElement.component.updateSync();
          }
        };
      })(this)));
      this.editorElement.classList.add(packageScope);
      if (settings.get('startInInsertMode') || matchScopes(this.editorElement, settings.get('startInInsertModeScopes'))) {
        this.activate('insert');
      } else {
        this.activate('normal');
      }
    }

    VimState.prototype.isNewInput = function() {
      return this.input instanceof Input;
    };

    VimState.prototype.getBlockwiseSelections = function() {
      return this.blockwiseSelections;
    };

    VimState.prototype.getLastBlockwiseSelection = function() {
      return _.last(this.blockwiseSelections);
    };

    VimState.prototype.getBlockwiseSelectionsOrderedByBufferPosition = function() {
      return this.getBlockwiseSelections().sort(function(a, b) {
        return a.getStartSelection().compare(b.getStartSelection());
      });
    };

    VimState.prototype.clearBlockwiseSelections = function() {
      return this.blockwiseSelections = [];
    };

    VimState.prototype.selectBlockwise = function() {
      var i, len, ref2, selection;
      ref2 = this.editor.getSelections();
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        this.blockwiseSelections.push(new BlockwiseSelection(selection));
      }
      return this.updateSelectionProperties();
    };

    VimState.prototype.selectLinewise = function() {
      return swrap.expandOverLine(this.editor, {
        preserveGoalColumn: true
      });
    };

    VimState.prototype.updateSelectionProperties = function(options) {
      return swrap.updateSelectionProperties(this.editor, options);
    };

    VimState.prototype.toggleClassList = function(className, bool) {
      if (bool == null) {
        bool = void 0;
      }
      return this.editorElement.classList.toggle(className, bool);
    };

    VimState.prototype.swapClassName = function() {
      var classNames, oldMode, ref2;
      classNames = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      oldMode = this.mode;
      this.editorElement.classList.remove(oldMode + "-mode");
      this.editorElement.classList.remove('vim-mode-plus');
      (ref2 = this.editorElement.classList).add.apply(ref2, classNames);
      return new Disposable((function(_this) {
        return function() {
          var ref3;
          (ref3 = _this.editorElement.classList).remove.apply(ref3, classNames);
          if (_this.mode === oldMode) {
            _this.editorElement.classList.add(oldMode + "-mode");
          }
          _this.editorElement.classList.add('vim-mode-plus');
          return _this.editorElement.classList.add('is-focused');
        };
      })(this));
    };

    VimState.prototype.onDidChangeInput = function(fn) {
      return this.subscribe(this.input.onDidChange(fn));
    };

    VimState.prototype.onDidConfirmInput = function(fn) {
      return this.subscribe(this.input.onDidConfirm(fn));
    };

    VimState.prototype.onDidCancelInput = function(fn) {
      return this.subscribe(this.input.onDidCancel(fn));
    };

    VimState.prototype.onDidChangeSearch = function(fn) {
      return this.subscribe(this.searchInput.onDidChange(fn));
    };

    VimState.prototype.onDidConfirmSearch = function(fn) {
      return this.subscribe(this.searchInput.onDidConfirm(fn));
    };

    VimState.prototype.onDidCancelSearch = function(fn) {
      return this.subscribe(this.searchInput.onDidCancel(fn));
    };

    VimState.prototype.onDidCommandSearch = function(fn) {
      return this.subscribe(this.searchInput.onDidCommand(fn));
    };

    VimState.prototype.onDidSetTarget = function(fn) {
      return this.subscribe(this.emitter.on('did-set-target', fn));
    };

    VimState.prototype.onWillSelectTarget = function(fn) {
      return this.subscribe(this.emitter.on('will-select-target', fn));
    };

    VimState.prototype.onDidSelectTarget = function(fn) {
      return this.subscribe(this.emitter.on('did-select-target', fn));
    };

    VimState.prototype.preemptWillSelectTarget = function(fn) {
      return this.subscribe(this.emitter.preempt('will-select-target', fn));
    };

    VimState.prototype.preemptDidSelectTarget = function(fn) {
      return this.subscribe(this.emitter.preempt('did-select-target', fn));
    };

    VimState.prototype.onDidRestoreCursorPositions = function(fn) {
      return this.subscribe(this.emitter.on('did-restore-cursor-positions', fn));
    };

    VimState.prototype.onDidSetOperatorModifier = function(fn) {
      return this.subscribe(this.emitter.on('did-set-operator-modifier', fn));
    };

    VimState.prototype.emitDidSetOperatorModifier = function(options) {
      return this.emitter.emit('did-set-operator-modifier', options);
    };

    VimState.prototype.onDidFinishOperation = function(fn) {
      return this.subscribe(this.emitter.on('did-finish-operation', fn));
    };

    VimState.prototype.onDidResetOperationStack = function(fn) {
      return this.subscribe(this.emitter.on('did-reset-operation-stack', fn));
    };

    VimState.prototype.emitDidResetOperationStack = function() {
      return this.emitter.emit('did-reset-operation-stack');
    };

    VimState.prototype.onDidConfirmSelectList = function(fn) {
      return this.subscribe(this.emitter.on('did-confirm-select-list', fn));
    };

    VimState.prototype.onDidCancelSelectList = function(fn) {
      return this.subscribe(this.emitter.on('did-cancel-select-list', fn));
    };

    VimState.prototype.onWillActivateMode = function(fn) {
      return this.subscribe(this.modeManager.onWillActivateMode(fn));
    };

    VimState.prototype.onDidActivateMode = function(fn) {
      return this.subscribe(this.modeManager.onDidActivateMode(fn));
    };

    VimState.prototype.onWillDeactivateMode = function(fn) {
      return this.subscribe(this.modeManager.onWillDeactivateMode(fn));
    };

    VimState.prototype.preemptWillDeactivateMode = function(fn) {
      return this.subscribe(this.modeManager.preemptWillDeactivateMode(fn));
    };

    VimState.prototype.onDidDeactivateMode = function(fn) {
      return this.subscribe(this.modeManager.onDidDeactivateMode(fn));
    };

    VimState.prototype.onDidFailToSetTarget = function(fn) {
      return this.emitter.on('did-fail-to-set-target', fn);
    };

    VimState.prototype.emitDidFailToSetTarget = function() {
      return this.emitter.emit('did-fail-to-set-target');
    };

    VimState.prototype.onDidDestroy = function(fn) {
      return this.emitter.on('did-destroy', fn);
    };

    VimState.prototype.onDidSetMark = function(fn) {
      return this.emitter.on('did-set-mark', fn);
    };

    VimState.prototype.onDidSetInputChar = function(fn) {
      return this.emitter.on('did-set-input-char', fn);
    };

    VimState.prototype.emitDidSetInputChar = function(char) {
      return this.emitter.emit('did-set-input-char', char);
    };

    VimState.prototype.destroy = function() {
      var ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
      if (this.destroyed) {
        return;
      }
      this.destroyed = true;
      this.subscriptions.dispose();
      if (this.editor.isAlive()) {
        this.resetNormalMode();
        this.reset();
        if ((ref2 = this.editorElement.component) != null) {
          ref2.setInputEnabled(true);
        }
        this.editorElement.classList.remove(packageScope, 'normal-mode');
      }
      if ((ref3 = this.hover) != null) {
        if (typeof ref3.destroy === "function") {
          ref3.destroy();
        }
      }
      if ((ref4 = this.hoverSearchCounter) != null) {
        if (typeof ref4.destroy === "function") {
          ref4.destroy();
        }
      }
      if ((ref5 = this.searchHistory) != null) {
        if (typeof ref5.destroy === "function") {
          ref5.destroy();
        }
      }
      if ((ref6 = this.cursorStyleManager) != null) {
        if (typeof ref6.destroy === "function") {
          ref6.destroy();
        }
      }
      if ((ref7 = this.input) != null) {
        if (typeof ref7.destroy === "function") {
          ref7.destroy();
        }
      }
      if ((ref8 = this.search) != null) {
        if (typeof ref8.destroy === "function") {
          ref8.destroy();
        }
      }
      ((ref9 = this.register) != null ? ref9.destroy : void 0) != null;
      ref10 = {}, this.hover = ref10.hover, this.hoverSearchCounter = ref10.hoverSearchCounter, this.operationStack = ref10.operationStack, this.searchHistory = ref10.searchHistory, this.cursorStyleManager = ref10.cursorStyleManager, this.input = ref10.input, this.search = ref10.search, this.modeManager = ref10.modeManager, this.register = ref10.register, this.editor = ref10.editor, this.editorElement = ref10.editorElement, this.subscriptions = ref10.subscriptions, this.inputCharSubscriptions = ref10.inputCharSubscriptions, this.occurrenceManager = ref10.occurrenceManager, this.previousSelection = ref10.previousSelection, this.persistentSelection = ref10.persistentSelection;
      return this.emitter.emit('did-destroy');
    };

    VimState.prototype.isInterestingEvent = function(arg) {
      var target, type;
      target = arg.target, type = arg.type;
      if (this.mode === 'insert') {
        return false;
      } else {
        return (this.editor != null) && (target != null ? typeof target.closest === "function" ? target.closest('atom-text-editor') : void 0 : void 0) === this.editorElement && !this.isMode('visual', 'blockwise') && !type.startsWith('vim-mode-plus:');
      }
    };

    VimState.prototype.checkSelection = function(event) {
      var submode;
      if (this.operationStack.isProcessing()) {
        return;
      }
      if (!this.isInterestingEvent(event)) {
        return;
      }
      if (haveSomeNonEmptySelection(this.editor)) {
        submode = swrap.detectVisualModeSubmode(this.editor);
        if (this.isMode('visual', submode)) {
          return this.updateCursorsVisibility();
        } else {
          return this.activate('visual', submode);
        }
      } else {
        if (this.isMode('visual')) {
          return this.activate('normal');
        }
      }
    };

    VimState.prototype.saveProperties = function(event) {
      var i, len, ref2, results, selection;
      if (!this.isInterestingEvent(event)) {
        return;
      }
      ref2 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        results.push(swrap(selection).saveProperties());
      }
      return results;
    };

    VimState.prototype.observeSelection = function() {
      var checkSelection;
      checkSelection = this.checkSelection.bind(this);
      this.editorElement.addEventListener('mouseup', checkSelection);
      this.subscriptions.add(new Disposable((function(_this) {
        return function() {
          return _this.editorElement.removeEventListener('mouseup', checkSelection);
        };
      })(this)));
      return this.subscriptions.add(atom.commands.onDidDispatch(checkSelection));
    };

    VimState.prototype.resetNormalMode = function(arg) {
      var userInvocation;
      userInvocation = (arg != null ? arg : {}).userInvocation;
      if (userInvocation != null ? userInvocation : false) {
        if (this.editor.hasMultipleCursors()) {
          this.editor.clearSelections();
        } else if (this.hasPersistentSelections() && settings.get('clearPersistentSelectionOnResetNormalMode')) {
          this.clearPersistentSelections();
        } else if (this.occurrenceManager.hasPatterns()) {
          this.occurrenceManager.resetPatterns();
        }
        if (settings.get('clearHighlightSearchOnResetNormalMode')) {
          this.globalState.set('highlightSearchPattern', null);
        }
      } else {
        this.editor.clearSelections();
      }
      return this.activate('normal');
    };

    VimState.prototype.reset = function() {
      this.register.reset();
      this.searchHistory.reset();
      this.hover.reset();
      this.operationStack.reset();
      return this.mutationManager.reset();
    };

    VimState.prototype.isVisible = function() {
      var ref2;
      return ref2 = this.editor, indexOf.call(getVisibleEditors(), ref2) >= 0;
    };

    VimState.prototype.updateCursorsVisibility = function() {
      return this.cursorStyleManager.refresh();
    };

    VimState.prototype.updatePreviousSelection = function() {
      var head, properties, ref2, tail;
      if (this.isMode('visual', 'blockwise')) {
        properties = (ref2 = this.getLastBlockwiseSelection()) != null ? ref2.getCharacterwiseProperties() : void 0;
      } else {
        properties = swrap(this.editor.getLastSelection()).captureProperties();
      }
      if (properties == null) {
        return;
      }
      head = properties.head, tail = properties.tail;
      if (head.isGreaterThan(tail)) {
        this.mark.setRange('<', '>', [tail, head]);
      } else {
        this.mark.setRange('<', '>', [head, tail]);
      }
      return this.previousSelection = {
        properties: properties,
        submode: this.submode
      };
    };

    VimState.prototype.hasPersistentSelections = function() {
      return this.persistentSelection.hasMarkers();
    };

    VimState.prototype.getPersistentSelectionBuffferRanges = function() {
      return this.persistentSelection.getMarkerBufferRanges();
    };

    VimState.prototype.clearPersistentSelections = function() {
      return this.persistentSelection.clearMarkers();
    };

    VimState.prototype.scrollAnimationEffect = null;

    VimState.prototype.requestScrollAnimation = function(from, to, options) {
      return this.scrollAnimationEffect = jQuery(from).animate(to, options);
    };

    VimState.prototype.finishScrollAnimation = function() {
      var ref2;
      if ((ref2 = this.scrollAnimationEffect) != null) {
        ref2.finish();
      }
      return this.scrollAnimationEffect = null;
    };

    return VimState;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvdmltLXN0YXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMmRBQUE7SUFBQTs7O0VBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztFQUNULFFBQUEsR0FBVyxPQUFBLENBQVEsVUFBUjs7RUFDVixTQUFVLE9BQUEsQ0FBUSxzQkFBUjs7RUFFWCxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQW9ELE9BQUEsQ0FBUSxNQUFSLENBQXBELEVBQUMscUJBQUQsRUFBVSwyQkFBVixFQUFzQiw2Q0FBdEIsRUFBMkM7O0VBRTNDLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7RUFDVixlQUFnQixPQUFBLENBQVEsU0FBUjs7RUFDakIsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztFQUNSLGtCQUFBLEdBQXFCLE9BQUEsQ0FBUSxnQkFBUjs7RUFDckIsT0FPSSxPQUFBLENBQVEsU0FBUixDQVBKLEVBQ0UsMERBREYsRUFFRSxzQ0FGRixFQUdFLDBDQUhGLEVBSUUsOEJBSkYsRUFNRTs7RUFFRixLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQUVSLGNBQUEsR0FBaUIsT0FBQSxDQUFRLG1CQUFSOztFQUNqQixXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUNkLFdBQUEsR0FBYyxPQUFBLENBQVEsZ0JBQVI7O0VBQ2QsZUFBQSxHQUFrQixPQUFBLENBQVEsb0JBQVI7O0VBQ2xCLG9CQUFBLEdBQXVCLE9BQUEsQ0FBUSwwQkFBUjs7RUFDdkIsa0JBQUEsR0FBcUIsT0FBQSxDQUFRLHdCQUFSOztFQUNyQixrQkFBQSxHQUFxQixPQUFBLENBQVEsdUJBQVI7O0VBQ3JCLGlCQUFBLEdBQW9CLE9BQUEsQ0FBUSxzQkFBUjs7RUFDcEIsc0JBQUEsR0FBeUIsT0FBQSxDQUFRLDRC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Rjs7YUFJQSxJQUFDLENBQUEsaUJBQUQsR0FBcUI7UUFBQyxZQUFBLFVBQUQ7UUFBYyxTQUFELElBQUMsQ0FBQSxPQUFkOztJQWJFOzt1QkFpQnpCLHVCQUFBLEdBQXlCLFNBQUE7YUFDdkIsSUFBQyxDQUFBLG1CQUFtQixDQUFDLFVBQXJCLENBQUE7SUFEdUI7O3VCQUd6QixtQ0FBQSxHQUFxQyxTQUFBO2FBQ25DLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxxQkFBckIsQ0FBQTtJQURtQzs7dUJBR3JDLHlCQUFBLEdBQTJCLFNBQUE7YUFDekIsSUFBQyxDQUFBLG1CQUFtQixDQUFDLFlBQXJCLENBQUE7SUFEeUI7O3VCQUszQixxQkFBQSxHQUF1Qjs7dUJBQ3ZCLHNCQUFBLEdBQXdCLFNBQUMsSUFBRCxFQUFPLEVBQVAsRUFBVyxPQUFYO2FBQ3RCLElBQUMsQ0FBQSxxQkFBRCxHQUF5QixNQUFBLENBQU8sSUFBUCxDQUFZLENBQUMsT0FBYixDQUFxQixFQUFyQixFQUF5QixPQUF6QjtJQURIOzt1QkFHeEIscUJBQUEsR0FBdUIsU0FBQTtBQUNyQixVQUFBOztZQUFzQixDQUFFLE1BQXhCLENBQUE7O2FBQ0EsSUFBQyxDQUFBLHFCQUFELEdBQXlCO0lBRko7Ozs7O0FBcFV6QiIsInNvdXJjZXNDb250ZW50IjpbInNlbXZlciA9IHJlcXVpcmUgJ3NlbXZlcidcbkRlbGVnYXRvID0gcmVxdWlyZSAnZGVsZWdhdG8nXG57alF1ZXJ5fSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue0VtaXR0ZXIsIERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGUsIFJhbmdlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcbntIb3ZlckVsZW1lbnR9ID0gcmVxdWlyZSAnLi9ob3ZlcidcbklucHV0ID0gcmVxdWlyZSAnLi9pbnB1dCdcblNlYXJjaElucHV0RWxlbWVudCA9IHJlcXVpcmUgJy4vc2VhcmNoLWlucHV0J1xue1xuICBoYXZlU29tZU5vbkVtcHR5U2VsZWN0aW9uXG4gIGhpZ2hsaWdodFJhbmdlc1xuICBnZXRWaXNpYmxlRWRpdG9yc1xuICBtYXRjaFNjb3Blc1xuXG4gIGRlYnVnXG59ID0gcmVxdWlyZSAnLi91dGlscydcbnN3cmFwID0gcmVxdWlyZSAnLi9zZWxlY3Rpb24td3JhcHBlcidcblxuT3BlcmF0aW9uU3RhY2sgPSByZXF1aXJlICcuL29wZXJhdGlvbi1zdGFjaydcbk1hcmtNYW5hZ2VyID0gcmVxdWlyZSAnLi9tYXJrLW1hbmFnZXInXG5Nb2RlTWFuYWdlciA9IHJlcXVpcmUgJy4vbW9kZS1tYW5hZ2VyJ1xuUmVnaXN0ZXJNYW5hZ2VyID0gcmVxdWlyZSAnLi9yZWdpc3Rlci1tYW5hZ2VyJ1xuU2VhcmNoSGlzdG9yeU1hbmFnZXIgPSByZXF1aXJlICcuL3NlYXJjaC1oaXN0b3J5LW1hbmFnZXInXG5DdXJzb3JTdHlsZU1hbmFnZXIgPSByZXF1aXJlICcuL2N1cnNvci1zdHlsZS1tYW5hZ2VyJ1xuQmxvY2t3aXNlU2VsZWN0aW9uID0gcmVxdWlyZSAnLi9ibG9ja3dpc2Utc2VsZWN0aW9uJ1xuT2NjdXJyZW5jZU1hbmFnZXIgPSByZXF1aXJlICcuL29jY3VycmVuY2UtbWFuYWdlcidcbkhpZ2hsaWdodFNlYXJjaE1hbmFnZXIgPSByZXF1aXJlICcuL2hpZ2hsaWdodC1zZWFyY2gtbWFuYWdlcidcbk11dGF0aW9uTWFuYWdlciA9IHJlcXVpcmUgJy4vbXV0YXRpb24tbWFuYWdlcidcblBlcnNpc3RlbnRTZWxlY3Rpb25NYW5hZ2VyID0gcmVxdWlyZSAnLi9wZXJzaXN0ZW50LXNlbGVjdGlvbi1tYW5hZ2VyJ1xuRmxhc2hNYW5hZ2VyID0gcmVxdWlyZSAnLi9mbGFzaC1tYW5hZ2VyJ1xuXG5wYWNrYWdlU2NvcGUgPSAndmltLW1vZGUtcGx1cydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVmltU3RhdGVcbiAgRGVsZWdhdG8uaW5jbHVkZUludG8odGhpcylcbiAgZGVzdHJveWVkOiBmYWxzZVxuXG4gIEBkZWxlZ2F0ZXNQcm9wZXJ0eSgnbW9kZScsICdzdWJtb2RlJywgdG9Qcm9wZXJ0eTogJ21vZGVNYW5hZ2VyJylcbiAgQGRlbGVnYXRlc01ldGhvZHMoJ2lzTW9kZScsICdhY3RpdmF0ZScsIHRvUHJvcGVydHk6ICdtb2RlTWFuYWdlcicpXG4gIEBkZWxlZ2F0ZXNNZXRob2RzKCdmbGFzaCcsICdmbGFzaFNjcmVlblJhbmdlJywgdG9Qcm9wZXJ0eTogJ2ZsYXNoTWFuYWdlcicpXG4gIEBkZWxlZ2F0ZXNNZXRob2RzKCdzdWJzY3JpYmUnLCAnZ2V0Q291bnQnLCAnc2V0Q291bnQnLCAnaGFzQ291bnQnLCAnYWRkVG9DbGFzc0xpc3QnLCB0b1Byb3BlcnR5OiAnb3BlcmF0aW9uU3RhY2snKVxuXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvciwgQHN0YXR1c0Jhck1hbmFnZXIsIEBnbG9iYWxTdGF0ZSkgLT5cbiAgICBAZWRpdG9yRWxlbWVudCA9IEBlZGl0b3IuZWxlbWVudFxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQG1vZGVNYW5hZ2VyID0gbmV3IE1vZGVNYW5hZ2VyKHRoaXMpXG4gICAgQG1hcmsgPSBuZXcgTWFya01hbmFnZXIodGhpcylcbiAgICBAcmVnaXN0ZXIgPSBuZXcgUmVnaXN0ZXJNYW5hZ2VyKHRoaXMpXG4gICAgQGhvdmVyID0gbmV3IEhvdmVyRWxlbWVudCgpLmluaXRpYWxpemUodGhpcylcbiAgICBAaG92ZXJTZWFyY2hDb3VudGVyID0gbmV3IEhvdmVyRWxlbWVudCgpLmluaXRpYWxpemUodGhpcylcbiAgICBAc2VhcmNoSGlzdG9yeSA9IG5ldyBTZWFyY2hIaXN0b3J5TWFuYWdlcih0aGlzKVxuICAgIEBoaWdobGlnaHRTZWFyY2ggPSBuZXcgSGlnaGxpZ2h0U2VhcmNoTWFuYWdlcih0aGlzKVxuICAgIEBwZXJzaXN0ZW50U2VsZWN0aW9uID0gbmV3IFBlcnNpc3RlbnRTZWxlY3Rpb25NYW5hZ2VyKHRoaXMpXG4gICAgQG9jY3VycmVuY2VNYW5hZ2VyID0gbmV3IE9jY3VycmVuY2VNYW5hZ2VyKHRoaXMpXG4gICAgQG11dGF0aW9uTWFuYWdlciA9IG5ldyBNdXRhdGlvbk1hbmFnZXIodGhpcylcbiAgICBAZmxhc2hNYW5hZ2VyID0gbmV3IEZsYXNoTWFuYWdlcih0aGlzKVxuXG4gICAgQGlucHV0ID0gbmV3IElucHV0KHRoaXMpXG4gICAgQHNlYXJjaElucHV0ID0gbmV3IFNlYXJjaElucHV0RWxlbWVudCgpLmluaXRpYWxpemUodGhpcylcblxuICAgIEBvcGVyYXRpb25TdGFjayA9IG5ldyBPcGVyYXRpb25TdGFjayh0aGlzKVxuICAgIEBjdXJzb3JTdHlsZU1hbmFnZXIgPSBuZXcgQ3Vyc29yU3R5bGVNYW5hZ2VyKHRoaXMpXG4gICAgQGJsb2Nrd2lzZVNlbGVjdGlvbnMgPSBbXVxuICAgIEBwcmV2aW91c1NlbGVjdGlvbiA9IHt9XG4gICAgQG9ic2VydmVTZWxlY3Rpb24oKVxuXG4gICAgcmVmcmVzaEhpZ2hsaWdodFNlYXJjaCA9ID0+XG4gICAgICBAaGlnaGxpZ2h0U2VhcmNoLnJlZnJlc2goKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKHJlZnJlc2hIaWdobGlnaHRTZWFyY2gpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQGVkaXRvci5vYnNlcnZlU2VsZWN0aW9ucyAoc2VsZWN0aW9uKSA9PlxuICAgICAgcmV0dXJuIGlmIEBvcGVyYXRpb25TdGFjay5pc1Byb2Nlc3NpbmcoKVxuICAgICAgdW5sZXNzIHN3cmFwKHNlbGVjdGlvbikuaGFzUHJvcGVydGllcygpXG4gICAgICAgIHN3cmFwKHNlbGVjdGlvbikuc2F2ZVByb3BlcnRpZXMoKVxuICAgICAgICBAdXBkYXRlQ3Vyc29yc1Zpc2liaWxpdHkoKVxuICAgICAgICBAZWRpdG9yRWxlbWVudC5jb21wb25lbnQudXBkYXRlU3luYygpXG5cbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKHBhY2thZ2VTY29wZSlcbiAgICBpZiBzZXR0aW5ncy5nZXQoJ3N0YXJ0SW5JbnNlcnRNb2RlJykgb3IgbWF0Y2hTY29wZXMoQGVkaXRvckVsZW1lbnQsIHNldHRpbmdzLmdldCgnc3RhcnRJbkluc2VydE1vZGVTY29wZXMnKSlcbiAgICAgIEBhY3RpdmF0ZSgnaW5zZXJ0JylcbiAgICBlbHNlXG4gICAgICBAYWN0aXZhdGUoJ25vcm1hbCcpXG5cbiAgaXNOZXdJbnB1dDogLT5cbiAgICBAaW5wdXQgaW5zdGFuY2VvZiBJbnB1dFxuXG4gICMgQmxvY2t3aXNlU2VsZWN0aW9uc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZ2V0QmxvY2t3aXNlU2VsZWN0aW9uczogLT5cbiAgICBAYmxvY2t3aXNlU2VsZWN0aW9uc1xuXG4gIGdldExhc3RCbG9ja3dpc2VTZWxlY3Rpb246IC0+XG4gICAgXy5sYXN0KEBibG9ja3dpc2VTZWxlY3Rpb25zKVxuXG4gIGdldEJsb2Nrd2lzZVNlbGVjdGlvbnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBAZ2V0QmxvY2t3aXNlU2VsZWN0aW9ucygpLnNvcnQgKGEsIGIpIC0+XG4gICAgICBhLmdldFN0YXJ0U2VsZWN0aW9uKCkuY29tcGFyZShiLmdldFN0YXJ0U2VsZWN0aW9uKCkpXG5cbiAgY2xlYXJCbG9ja3dpc2VTZWxlY3Rpb25zOiAtPlxuICAgIEBibG9ja3dpc2VTZWxlY3Rpb25zID0gW11cblxuICBzZWxlY3RCbG9ja3dpc2U6IC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgQGJsb2Nrd2lzZVNlbGVjdGlvbnMucHVzaChuZXcgQmxvY2t3aXNlU2VsZWN0aW9uKHNlbGVjdGlvbikpXG4gICAgQHVwZGF0ZVNlbGVjdGlvblByb3BlcnRpZXMoKVxuXG4gICMgT3RoZXJcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNlbGVjdExpbmV3aXNlOiAtPlxuICAgIHN3cmFwLmV4cGFuZE92ZXJMaW5lKEBlZGl0b3IsIHByZXNlcnZlR29hbENvbHVtbjogdHJ1ZSlcblxuICB1cGRhdGVTZWxlY3Rpb25Qcm9wZXJ0aWVzOiAob3B0aW9ucykgLT5cbiAgICBzd3JhcC51cGRhdGVTZWxlY3Rpb25Qcm9wZXJ0aWVzKEBlZGl0b3IsIG9wdGlvbnMpXG5cbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRvZ2dsZUNsYXNzTGlzdDogKGNsYXNzTmFtZSwgYm9vbD11bmRlZmluZWQpIC0+XG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShjbGFzc05hbWUsIGJvb2wpXG5cbiAgIyBGSVhNRTogcmVtb3ZlIHRoaXMgZGVuZ2Vyb3VzIGFwcHJvYXJjaCBBU0FQIGFuZCByZXZlcnQgdG8gcmVhZC1pbnB1LXZpYS1taW5pLWVkaXRvclxuICBzd2FwQ2xhc3NOYW1lOiAoY2xhc3NOYW1lcy4uLikgLT5cbiAgICBvbGRNb2RlID0gQG1vZGVcbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKG9sZE1vZGUgKyBcIi1tb2RlXCIpXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgndmltLW1vZGUtcGx1cycpXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWVzLi4uKVxuXG4gICAgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lcy4uLilcbiAgICAgIGlmIEBtb2RlIGlzIG9sZE1vZGVcbiAgICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChvbGRNb2RlICsgXCItbW9kZVwiKVxuICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZCgndmltLW1vZGUtcGx1cycpXG4gICAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdpcy1mb2N1c2VkJylcblxuICAjIEFsbCBzdWJzY3JpcHRpb25zIGhlcmUgaXMgY2VsYXJlZCBvbiBlYWNoIG9wZXJhdGlvbiBmaW5pc2hlZC5cbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG9uRGlkQ2hhbmdlSW5wdXQ6IChmbikgLT4gQHN1YnNjcmliZSBAaW5wdXQub25EaWRDaGFuZ2UoZm4pXG4gIG9uRGlkQ29uZmlybUlucHV0OiAoZm4pIC0+IEBzdWJzY3JpYmUgQGlucHV0Lm9uRGlkQ29uZmlybShmbilcbiAgb25EaWRDYW5jZWxJbnB1dDogKGZuKSAtPiBAc3Vic2NyaWJlIEBpbnB1dC5vbkRpZENhbmNlbChmbilcblxuICBvbkRpZENoYW5nZVNlYXJjaDogKGZuKSAtPiBAc3Vic2NyaWJlIEBzZWFyY2hJbnB1dC5vbkRpZENoYW5nZShmbilcbiAgb25EaWRDb25maXJtU2VhcmNoOiAoZm4pIC0+IEBzdWJzY3JpYmUgQHNlYXJjaElucHV0Lm9uRGlkQ29uZmlybShmbilcbiAgb25EaWRDYW5jZWxTZWFyY2g6IChmbikgLT4gQHN1YnNjcmliZSBAc2VhcmNoSW5wdXQub25EaWRDYW5jZWwoZm4pXG4gIG9uRGlkQ29tbWFuZFNlYXJjaDogKGZuKSAtPiBAc3Vic2NyaWJlIEBzZWFyY2hJbnB1dC5vbkRpZENvbW1hbmQoZm4pXG5cbiAgIyBTZWxlY3QgYW5kIHRleHQgbXV0YXRpb24oQ2hhbmdlKVxuICBvbkRpZFNldFRhcmdldDogKGZuKSAtPiBAc3Vic2NyaWJlIEBlbWl0dGVyLm9uKCdkaWQtc2V0LXRhcmdldCcsIGZuKVxuICBvbldpbGxTZWxlY3RUYXJnZXQ6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignd2lsbC1zZWxlY3QtdGFyZ2V0JywgZm4pXG4gIG9uRGlkU2VsZWN0VGFyZ2V0OiAoZm4pIC0+IEBzdWJzY3JpYmUgQGVtaXR0ZXIub24oJ2RpZC1zZWxlY3QtdGFyZ2V0JywgZm4pXG4gIHByZWVtcHRXaWxsU2VsZWN0VGFyZ2V0OiAoZm4pIC0+IEBzdWJzY3JpYmUgQGVtaXR0ZXIucHJlZW1wdCgnd2lsbC1zZWxlY3QtdGFyZ2V0JywgZm4pXG4gIHByZWVtcHREaWRTZWxlY3RUYXJnZXQ6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5wcmVlbXB0KCdkaWQtc2VsZWN0LXRhcmdldCcsIGZuKVxuICBvbkRpZFJlc3RvcmVDdXJzb3JQb3NpdGlvbnM6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignZGlkLXJlc3RvcmUtY3Vyc29yLXBvc2l0aW9ucycsIGZuKVxuXG4gIG9uRGlkU2V0T3BlcmF0b3JNb2RpZmllcjogKGZuKSAtPiBAc3Vic2NyaWJlIEBlbWl0dGVyLm9uKCdkaWQtc2V0LW9wZXJhdG9yLW1vZGlmaWVyJywgZm4pXG4gIGVtaXREaWRTZXRPcGVyYXRvck1vZGlmaWVyOiAob3B0aW9ucykgLT4gQGVtaXR0ZXIuZW1pdCgnZGlkLXNldC1vcGVyYXRvci1tb2RpZmllcicsIG9wdGlvbnMpXG5cbiAgb25EaWRGaW5pc2hPcGVyYXRpb246IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignZGlkLWZpbmlzaC1vcGVyYXRpb24nLCBmbilcblxuICBvbkRpZFJlc2V0T3BlcmF0aW9uU3RhY2s6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignZGlkLXJlc2V0LW9wZXJhdGlvbi1zdGFjaycsIGZuKVxuICBlbWl0RGlkUmVzZXRPcGVyYXRpb25TdGFjazogLT4gQGVtaXR0ZXIuZW1pdCgnZGlkLXJlc2V0LW9wZXJhdGlvbi1zdGFjaycpXG5cbiAgIyBTZWxlY3QgbGlzdCB2aWV3XG4gIG9uRGlkQ29uZmlybVNlbGVjdExpc3Q6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignZGlkLWNvbmZpcm0tc2VsZWN0LWxpc3QnLCBmbilcbiAgb25EaWRDYW5jZWxTZWxlY3RMaXN0OiAoZm4pIC0+IEBzdWJzY3JpYmUgQGVtaXR0ZXIub24oJ2RpZC1jYW5jZWwtc2VsZWN0LWxpc3QnLCBmbilcblxuICAjIFByb3h5aW5nIG1vZGVNYW5nZXIncyBldmVudCBob29rIHdpdGggc2hvcnQtbGlmZSBzdWJzY3JpcHRpb24uXG4gIG9uV2lsbEFjdGl2YXRlTW9kZTogKGZuKSAtPiBAc3Vic2NyaWJlIEBtb2RlTWFuYWdlci5vbldpbGxBY3RpdmF0ZU1vZGUoZm4pXG4gIG9uRGlkQWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBzdWJzY3JpYmUgQG1vZGVNYW5hZ2VyLm9uRGlkQWN0aXZhdGVNb2RlKGZuKVxuICBvbldpbGxEZWFjdGl2YXRlTW9kZTogKGZuKSAtPiBAc3Vic2NyaWJlIEBtb2RlTWFuYWdlci5vbldpbGxEZWFjdGl2YXRlTW9kZShmbilcbiAgcHJlZW1wdFdpbGxEZWFjdGl2YXRlTW9kZTogKGZuKSAtPiBAc3Vic2NyaWJlIEBtb2RlTWFuYWdlci5wcmVlbXB0V2lsbERlYWN0aXZhdGVNb2RlKGZuKVxuICBvbkRpZERlYWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBzdWJzY3JpYmUgQG1vZGVNYW5hZ2VyLm9uRGlkRGVhY3RpdmF0ZU1vZGUoZm4pXG5cbiAgIyBFdmVudHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG9uRGlkRmFpbFRvU2V0VGFyZ2V0OiAoZm4pIC0+IEBlbWl0dGVyLm9uKCdkaWQtZmFpbC10by1zZXQtdGFyZ2V0JywgZm4pXG4gIGVtaXREaWRGYWlsVG9TZXRUYXJnZXQ6IC0+IEBlbWl0dGVyLmVtaXQoJ2RpZC1mYWlsLXRvLXNldC10YXJnZXQnKVxuXG4gIG9uRGlkRGVzdHJveTogKGZuKSAtPiBAZW1pdHRlci5vbignZGlkLWRlc3Ryb3knLCBmbilcblxuICAjICogYGZuYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuIG1hcmsgd2FzIHNldC5cbiAgIyAgICogYG5hbWVgIE5hbWUgb2YgbWFyayBzdWNoIGFzICdhJy5cbiAgIyAgICogYGJ1ZmZlclBvc2l0aW9uYDogYnVmZmVyUG9zaXRpb24gd2hlcmUgbWFyayB3YXMgc2V0LlxuICAjICAgKiBgZWRpdG9yYDogZWRpdG9yIHdoZXJlIG1hcmsgd2FzIHNldC5cbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICAjXG4gICMgIFVzYWdlOlxuICAjICAgb25EaWRTZXRNYXJrICh7bmFtZSwgYnVmZmVyUG9zaXRpb259KSAtPiBkbyBzb21ldGhpbmcuLlxuICBvbkRpZFNldE1hcms6IChmbikgLT4gQGVtaXR0ZXIub24oJ2RpZC1zZXQtbWFyaycsIGZuKVxuXG4gIG9uRGlkU2V0SW5wdXRDaGFyOiAoZm4pIC0+IEBlbWl0dGVyLm9uKCdkaWQtc2V0LWlucHV0LWNoYXInLCBmbilcbiAgZW1pdERpZFNldElucHV0Q2hhcjogKGNoYXIpIC0+IEBlbWl0dGVyLmVtaXQoJ2RpZC1zZXQtaW5wdXQtY2hhcicsIGNoYXIpXG5cbiAgZGVzdHJveTogLT5cbiAgICByZXR1cm4gaWYgQGRlc3Ryb3llZFxuICAgIEBkZXN0cm95ZWQgPSB0cnVlXG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cbiAgICBpZiBAZWRpdG9yLmlzQWxpdmUoKVxuICAgICAgQHJlc2V0Tm9ybWFsTW9kZSgpXG4gICAgICBAcmVzZXQoKVxuICAgICAgQGVkaXRvckVsZW1lbnQuY29tcG9uZW50Py5zZXRJbnB1dEVuYWJsZWQodHJ1ZSlcbiAgICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUocGFja2FnZVNjb3BlLCAnbm9ybWFsLW1vZGUnKVxuXG4gICAgQGhvdmVyPy5kZXN0cm95PygpXG4gICAgQGhvdmVyU2VhcmNoQ291bnRlcj8uZGVzdHJveT8oKVxuICAgIEBzZWFyY2hIaXN0b3J5Py5kZXN0cm95PygpXG4gICAgQGN1cnNvclN0eWxlTWFuYWdlcj8uZGVzdHJveT8oKVxuICAgIEBpbnB1dD8uZGVzdHJveT8oKVxuICAgIEBzZWFyY2g/LmRlc3Ryb3k/KClcbiAgICBAcmVnaXN0ZXI/LmRlc3Ryb3k/XG4gICAge1xuICAgICAgQGhvdmVyLCBAaG92ZXJTZWFyY2hDb3VudGVyLCBAb3BlcmF0aW9uU3RhY2ssXG4gICAgICBAc2VhcmNoSGlzdG9yeSwgQGN1cnNvclN0eWxlTWFuYWdlclxuICAgICAgQGlucHV0LCBAc2VhcmNoLCBAbW9kZU1hbmFnZXIsIEByZWdpc3RlclxuICAgICAgQGVkaXRvciwgQGVkaXRvckVsZW1lbnQsIEBzdWJzY3JpcHRpb25zLFxuICAgICAgQGlucHV0Q2hhclN1YnNjcmlwdGlvbnNcbiAgICAgIEBvY2N1cnJlbmNlTWFuYWdlclxuICAgICAgQHByZXZpb3VzU2VsZWN0aW9uXG4gICAgICBAcGVyc2lzdGVudFNlbGVjdGlvblxuICAgIH0gPSB7fVxuICAgIEBlbWl0dGVyLmVtaXQgJ2RpZC1kZXN0cm95J1xuXG4gIGlzSW50ZXJlc3RpbmdFdmVudDogKHt0YXJnZXQsIHR5cGV9KSAtPlxuICAgIGlmIEBtb2RlIGlzICdpbnNlcnQnXG4gICAgICBmYWxzZVxuICAgIGVsc2VcbiAgICAgIEBlZGl0b3I/IGFuZFxuICAgICAgICB0YXJnZXQ/LmNsb3Nlc3Q/KCdhdG9tLXRleHQtZWRpdG9yJykgaXMgQGVkaXRvckVsZW1lbnQgYW5kXG4gICAgICAgIG5vdCBAaXNNb2RlKCd2aXN1YWwnLCAnYmxvY2t3aXNlJykgYW5kXG4gICAgICAgIG5vdCB0eXBlLnN0YXJ0c1dpdGgoJ3ZpbS1tb2RlLXBsdXM6JylcblxuICBjaGVja1NlbGVjdGlvbjogKGV2ZW50KSAtPlxuICAgIHJldHVybiBpZiBAb3BlcmF0aW9uU3RhY2suaXNQcm9jZXNzaW5nKClcbiAgICByZXR1cm4gdW5sZXNzIEBpc0ludGVyZXN0aW5nRXZlbnQoZXZlbnQpXG5cbiAgICBpZiBoYXZlU29tZU5vbkVtcHR5U2VsZWN0aW9uKEBlZGl0b3IpXG4gICAgICBzdWJtb2RlID0gc3dyYXAuZGV0ZWN0VmlzdWFsTW9kZVN1Ym1vZGUoQGVkaXRvcilcbiAgICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsIHN1Ym1vZGUpXG4gICAgICAgIEB1cGRhdGVDdXJzb3JzVmlzaWJpbGl0eSgpXG4gICAgICBlbHNlXG4gICAgICAgIEBhY3RpdmF0ZSgndmlzdWFsJywgc3VibW9kZSlcbiAgICBlbHNlXG4gICAgICBAYWN0aXZhdGUoJ25vcm1hbCcpIGlmIEBpc01vZGUoJ3Zpc3VhbCcpXG5cbiAgc2F2ZVByb3BlcnRpZXM6IChldmVudCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBpc0ludGVyZXN0aW5nRXZlbnQoZXZlbnQpXG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgc3dyYXAoc2VsZWN0aW9uKS5zYXZlUHJvcGVydGllcygpXG5cbiAgb2JzZXJ2ZVNlbGVjdGlvbjogLT5cbiAgICBjaGVja1NlbGVjdGlvbiA9IEBjaGVja1NlbGVjdGlvbi5iaW5kKHRoaXMpXG4gICAgQGVkaXRvckVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGNoZWNrU2VsZWN0aW9uKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQGVkaXRvckVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGNoZWNrU2VsZWN0aW9uKVxuXG4gICAgIyBbRklYTUVdXG4gICAgIyBIb3ZlciBwb3NpdGlvbiBnZXQgd2lyZWQgd2hlbiBmb2N1cy1jaGFuZ2UgYmV0d2VlbiBtb3JlIHRoYW4gdHdvIHBhbmUuXG4gICAgIyBjb21tZW50aW5nIG91dCBpcyBmYXIgYmV0dGVyIHRoYW4gaW50cm9kdWNpbmcgQnVnZ3kgYmVoYXZpb3IuXG4gICAgIyBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaChzYXZlUHJvcGVydGllcylcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5vbkRpZERpc3BhdGNoKGNoZWNrU2VsZWN0aW9uKVxuXG4gIHJlc2V0Tm9ybWFsTW9kZTogKHt1c2VySW52b2NhdGlvbn09e30pIC0+XG4gICAgaWYgdXNlckludm9jYXRpb24gPyBmYWxzZVxuICAgICAgaWYgQGVkaXRvci5oYXNNdWx0aXBsZUN1cnNvcnMoKVxuICAgICAgICBAZWRpdG9yLmNsZWFyU2VsZWN0aW9ucygpXG4gICAgICBlbHNlIGlmIEBoYXNQZXJzaXN0ZW50U2VsZWN0aW9ucygpIGFuZCBzZXR0aW5ncy5nZXQoJ2NsZWFyUGVyc2lzdGVudFNlbGVjdGlvbk9uUmVzZXROb3JtYWxNb2RlJylcbiAgICAgICAgQGNsZWFyUGVyc2lzdGVudFNlbGVjdGlvbnMoKVxuICAgICAgZWxzZSBpZiBAb2NjdXJyZW5jZU1hbmFnZXIuaGFzUGF0dGVybnMoKVxuICAgICAgICBAb2NjdXJyZW5jZU1hbmFnZXIucmVzZXRQYXR0ZXJucygpXG5cbiAgICAgIGlmIHNldHRpbmdzLmdldCgnY2xlYXJIaWdobGlnaHRTZWFyY2hPblJlc2V0Tm9ybWFsTW9kZScpXG4gICAgICAgIEBnbG9iYWxTdGF0ZS5zZXQoJ2hpZ2hsaWdodFNlYXJjaFBhdHRlcm4nLCBudWxsKVxuICAgIGVsc2VcbiAgICAgIEBlZGl0b3IuY2xlYXJTZWxlY3Rpb25zKClcbiAgICBAYWN0aXZhdGUoJ25vcm1hbCcpXG5cbiAgcmVzZXQ6IC0+XG4gICAgQHJlZ2lzdGVyLnJlc2V0KClcbiAgICBAc2VhcmNoSGlzdG9yeS5yZXNldCgpXG4gICAgQGhvdmVyLnJlc2V0KClcbiAgICBAb3BlcmF0aW9uU3RhY2sucmVzZXQoKVxuICAgIEBtdXRhdGlvbk1hbmFnZXIucmVzZXQoKVxuXG4gIGlzVmlzaWJsZTogLT5cbiAgICBAZWRpdG9yIGluIGdldFZpc2libGVFZGl0b3JzKClcblxuICB1cGRhdGVDdXJzb3JzVmlzaWJpbGl0eTogLT5cbiAgICBAY3Vyc29yU3R5bGVNYW5hZ2VyLnJlZnJlc2goKVxuXG4gIHVwZGF0ZVByZXZpb3VzU2VsZWN0aW9uOiAtPlxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKVxuICAgICAgcHJvcGVydGllcyA9IEBnZXRMYXN0QmxvY2t3aXNlU2VsZWN0aW9uKCk/LmdldENoYXJhY3Rlcndpc2VQcm9wZXJ0aWVzKClcbiAgICBlbHNlXG4gICAgICBwcm9wZXJ0aWVzID0gc3dyYXAoQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkpLmNhcHR1cmVQcm9wZXJ0aWVzKClcblxuICAgIHJldHVybiB1bmxlc3MgcHJvcGVydGllcz9cblxuICAgIHtoZWFkLCB0YWlsfSA9IHByb3BlcnRpZXNcbiAgICBpZiBoZWFkLmlzR3JlYXRlclRoYW4odGFpbClcbiAgICAgIEBtYXJrLnNldFJhbmdlKCc8JywgJz4nLCBbdGFpbCwgaGVhZF0pXG4gICAgZWxzZVxuICAgICAgQG1hcmsuc2V0UmFuZ2UoJzwnLCAnPicsIFtoZWFkLCB0YWlsXSlcbiAgICBAcHJldmlvdXNTZWxlY3Rpb24gPSB7cHJvcGVydGllcywgQHN1Ym1vZGV9XG5cbiAgIyBQZXJzaXN0ZW50IHNlbGVjdGlvblxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaGFzUGVyc2lzdGVudFNlbGVjdGlvbnM6IC0+XG4gICAgQHBlcnNpc3RlbnRTZWxlY3Rpb24uaGFzTWFya2VycygpXG5cbiAgZ2V0UGVyc2lzdGVudFNlbGVjdGlvbkJ1ZmZmZXJSYW5nZXM6IC0+XG4gICAgQHBlcnNpc3RlbnRTZWxlY3Rpb24uZ2V0TWFya2VyQnVmZmVyUmFuZ2VzKClcblxuICBjbGVhclBlcnNpc3RlbnRTZWxlY3Rpb25zOiAtPlxuICAgIEBwZXJzaXN0ZW50U2VsZWN0aW9uLmNsZWFyTWFya2VycygpXG5cbiAgIyBBbmltYXRpb24gbWFuYWdlbWVudFxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2Nyb2xsQW5pbWF0aW9uRWZmZWN0OiBudWxsXG4gIHJlcXVlc3RTY3JvbGxBbmltYXRpb246IChmcm9tLCB0bywgb3B0aW9ucykgLT5cbiAgICBAc2Nyb2xsQW5pbWF0aW9uRWZmZWN0ID0galF1ZXJ5KGZyb20pLmFuaW1hdGUodG8sIG9wdGlvbnMpXG5cbiAgZmluaXNoU2Nyb2xsQW5pbWF0aW9uOiAtPlxuICAgIEBzY3JvbGxBbmltYXRpb25FZmZlY3Q/LmZpbmlzaCgpXG4gICAgQHNjcm9sbEFuaW1hdGlvbkVmZmVjdCA9IG51bGxcbiJdfQ==
