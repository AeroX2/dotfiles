Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _atom = require('atom');

var _snippetParser = require('./snippet-parser');

var _snippetParser2 = _interopRequireDefault(_snippetParser);

var _typeHelpers = require('./type-helpers');

var _fuzzaldrinPlus = require('fuzzaldrin-plus');

var _fuzzaldrinPlus2 = _interopRequireDefault(_fuzzaldrinPlus);

var _marked = require('marked');

var _marked2 = _interopRequireDefault(_marked);

'use babel';

var ItemTemplate = '<span class="icon-container"></span>\n  <span class="left-label"></span>\n  <span class="word-container">\n    <span class="word"></span>\n  </span>\n  <span class="right-label"></span>';

var ListTemplate = '<div class="suggestion-list-scroller">\n    <ol class="list-group"></ol>\n  </div>\n  <div class="suggestion-description">\n    <span class="suggestion-description-content"></span>\n    <a class="suggestion-description-more-link" href="#">More..</a>\n  </div>';

var IconTemplate = '<i class="icon"></i>';

var DefaultSuggestionTypeIconHTML = {
  'snippet': '<i class="icon-move-right"></i>',
  'import': '<i class="icon-package"></i>',
  'require': '<i class="icon-package"></i>',
  'module': '<i class="icon-package"></i>',
  'package': '<i class="icon-package"></i>',
  'tag': '<i class="icon-code"></i>',
  'attribute': '<i class="icon-tag"></i>'
};

var SnippetStart = 1;
var SnippetEnd = 2;
var SnippetStartAndEnd = 3;

var SuggestionListElement = (function (_HTMLElement) {
  _inherits(SuggestionListElement, _HTMLElement);

  function SuggestionListElement() {
    _classCallCheck(this, SuggestionListElement);

    _get(Object.getPrototypeOf(SuggestionListElement.prototype), 'constructor', this).apply(this, arguments);
  }

  // https://github.com/component/escape-html/blob/master/index.js

  _createClass(SuggestionListElement, [{
    key: 'createdCallback',
    value: function createdCallback() {
      this.maxItems = 200;
      this.emptySnippetGroupRegex = /(\$\{\d+:\})|(\$\{\d+\})|(\$\d+)/ig;
      this.slashesInSnippetRegex = /\\\\/g;
      this.nodePool = null;
      this.subscriptions = new _atom.CompositeDisposable();
      this.classList.add('popover-list', 'select-list', 'autocomplete-suggestion-list');
      this.registerMouseHandling();
      this.snippetParser = new _snippetParser2['default']();
      this.nodePool = [];
    }
  }, {
    key: 'attachedCallback',
    value: function attachedCallback() {
      // TODO: Fix overlay decorator to in atom to apply class attribute correctly, then move this to overlay creation point.
      this.parentElement.classList.add('autocomplete-plus');
      this.addActiveClassToEditor();
      if (!this.ol) {
        this.renderList();
      }
      return this.itemsChanged();
    }
  }, {
    key: 'detachedCallback',
    value: function detachedCallback() {
      if (this.activeClassDisposable && this.activeClassDisposable.dispose) {
        this.activeClassDisposable.dispose();
      }
    }
  }, {
    key: 'initialize',
    value: function initialize(model) {
      var _this = this;

      this.model = model;
      if (this.model == null) {
        return;
      }
      this.subscriptions.add(this.model.onDidChangeItems(this.itemsChanged.bind(this)));
      this.subscriptions.add(this.model.onDidSelectNext(this.moveSelectionDown.bind(this)));
      this.subscriptions.add(this.model.onDidSelectPrevious(this.moveSelectionUp.bind(this)));
      this.subscriptions.add(this.model.onDidSelectPageUp(this.moveSelectionPageUp.bind(this)));
      this.subscriptions.add(this.model.onDidSelectPageDown(this.moveSelectionPageDown.bind(this)));
      this.subscriptions.add(this.model.onDidSelectTop(this.moveSelectionToTop.bind(this)));
      this.subscriptions.add(this.model.onDidSelectBottom(this.moveSelectionToBottom.bind(this)));
      this.subscriptions.add(this.model.onDidConfirmSelection(this.confirmSelection.bind(this)));
      this.subscriptions.add(this.model.onDidconfirmSelectionIfNonDefault(this.confirmSelectionIfNonDefault.bind(this)));
      this.subscriptions.add(this.model.onDidDispose(this.dispose.bind(this)));

      this.subscriptions.add(atom.config.observe('autocomplete-plus.suggestionListFollows', function (suggestionListFollows) {
        _this.suggestionListFollows = suggestionListFollows;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.maxVisibleSuggestions', function (maxVisibleSuggestions) {
        _this.maxVisibleSuggestions = maxVisibleSuggestions;
      }));
      this.subscriptions.add(atom.config.observe('autocomplete-plus.useAlternateScoring', function (useAlternateScoring) {
        _this.useAlternateScoring = useAlternateScoring;
      }));
      this.subscriptions.add(atom.keymaps.onDidFailToMatchBinding(function (keystrokes) {
        if (_this.selectedIndex === 0) _this.confirmSelection(keystrokes);
      }));

      return this;
    }

    // This should be unnecessary but the events we need to override
    // are handled at a level that can't be blocked by react synthetic
    // events because they are handled at the document
  }, {
    key: 'registerMouseHandling',
    value: function registerMouseHandling() {
      var _this2 = this;

      this.onmousewheel = function (event) {
        return event.stopPropagation();
      };
      this.onmousedown = function (event) {
        var item = _this2.findItem(event);
        if (item && item.dataset && item.dataset.index) {
          _this2.selectedIndex = item.dataset.index;
          event.stopPropagation();
        }
      };

      this.onmouseup = function (event) {
        var item = _this2.findItem(event);
        if (item && item.dataset && item.dataset.index) {
          event.stopPropagation();
          _this2.confirmSelection();
        }
      };
    }
  }, {
    key: 'findItem',
    value: function findItem(event) {
      var item = event.target;
      while (item.tagName !== 'LI' && item !== this) {
        item = item.parentNode;
      }
      if (item.tagName === 'LI') {
        return item;
      }
    }
  }, {
    key: 'updateDescription',
    value: function updateDescription(item) {
      if (!item) {
        if (this.model && this.model.items) {
          item = this.model.items[this.selectedIndex];
        }
      }
      if (!item) {
        return;
      }

      if (item.descriptionMarkdown && item.descriptionMarkdown.length > 0) {
        this.descriptionContainer.style.display = 'block';
        this.descriptionContent.innerHTML = _marked2['default'].parse(item.descriptionMarkdown, { sanitize: true });
        this.setDescriptionMoreLink(item);
      } else if (item.description && item.description.length > 0) {
        this.descriptionContainer.style.display = 'block';
        this.descriptionContent.textContent = item.description;
        this.setDescriptionMoreLink(item);
      } else {
        this.descriptionContainer.style.display = 'none';
      }
    }
  }, {
    key: 'setDescriptionMoreLink',
    value: function setDescriptionMoreLink(item) {
      if (item.descriptionMoreURL != null && item.descriptionMoreURL.length != null) {
        this.descriptionMoreLink.style.display = 'inline';
        this.descriptionMoreLink.setAttribute('href', item.descriptionMoreURL);
      } else {
        this.descriptionMoreLink.style.display = 'none';
        this.descriptionMoreLink.setAttribute('href', '#');
      }
    }
  }, {
    key: 'itemsChanged',
    value: function itemsChanged() {
      if (this.model && this.model.items && this.model.items.length) {
        return this.render();
      } else {
        return this.returnItemsToPool(0);
      }
    }
  }, {
    key: 'render',
    value: function render() {
      this.nonDefaultIndex = false;
      this.selectedIndex = 0;
      if (atom.views.pollAfterNextUpdate) {
        atom.views.pollAfterNextUpdate();
      }

      atom.views.updateDocument(this.renderItems.bind(this));
      return atom.views.readDocument(this.readUIPropsFromDOM.bind(this));
    }
  }, {
    key: 'addActiveClassToEditor',
    value: function addActiveClassToEditor() {
      var activeEditor = undefined;
      if (this.model) {
        activeEditor = this.model.activeEditor;
      }
      var editorElement = atom.views.getView(activeEditor);
      if (editorElement && editorElement.classList) {
        editorElement.classList.add('autocomplete-active');
      }

      this.activeClassDisposable = new _atom.Disposable(function () {
        if (editorElement && editorElement.classList) {
          editorElement.classList.remove('autocomplete-active');
        }
      });
    }
  }, {
    key: 'moveSelectionUp',
    value: function moveSelectionUp() {
      if (this.selectedIndex > 0) {
        return this.setSelectedIndex(this.selectedIndex - 1);
      } else {
        return this.setSelectedIndex(this.visibleItems().length - 1);
      }
    }
  }, {
    key: 'moveSelectionDown',
    value: function moveSelectionDown() {
      if (this.selectedIndex < this.visibleItems().length - 1) {
        return this.setSelectedIndex(this.selectedIndex + 1);
      } else {
        return this.setSelectedIndex(0);
      }
    }
  }, {
    key: 'moveSelectionPageUp',
    value: function moveSelectionPageUp() {
      var newIndex = Math.max(0, this.selectedIndex - this.maxVisibleSuggestions);
      if (this.selectedIndex !== newIndex) {
        return this.setSelectedIndex(newIndex);
      }
    }
  }, {
    key: 'moveSelectionPageDown',
    value: function moveSelectionPageDown() {
      var itemsLength = this.visibleItems().length;
      var newIndex = Math.min(itemsLength - 1, this.selectedIndex + this.maxVisibleSuggestions);
      if (this.selectedIndex !== newIndex) {
        return this.setSelectedIndex(newIndex);
      }
    }
  }, {
    key: 'moveSelectionToTop',
    value: function moveSelectionToTop() {
      var newIndex = 0;
      if (this.selectedIndex !== newIndex) {
        return this.setSelectedIndex(newIndex);
      }
    }
  }, {
    key: 'moveSelectionToBottom',
    value: function moveSelectionToBottom() {
      var newIndex = this.visibleItems().length - 1;
      if (this.selectedIndex !== newIndex) {
        return this.setSelectedIndex(newIndex);
      }
    }
  }, {
    key: 'setSelectedIndex',
    value: function setSelectedIndex(index) {
      this.nonDefaultIndex = true;
      this.selectedIndex = index;

      var editor = atom.workspace.getActiveTextEditor();
      editor.deleteToBeginningOfWord();
      editor.getLastCursor().moveToEndOfWord();
      this.model.replace(this.getSelectedItem());
      editor.getLastCursor().moveToBeginningOfWord();

      return atom.views.updateDocument(this.renderSelectedItem.bind(this));
    }
  }, {
    key: 'visibleItems',
    value: function visibleItems() {
      if (this.model && this.model.items) {
        return this.model.items.slice(0, this.maxItems);
      }
    }

    // Private: Get the currently selected item
    //
    // Returns the selected {Object}
  }, {
    key: 'getSelectedItem',
    value: function getSelectedItem() {
      if (this.model && this.model.items) {
        return this.model.items[this.selectedIndex];
      }
    }

    // Private: Confirms the currently selected item or cancels the list view
    // if no item has been selected
  }, {
    key: 'confirmSelection',
    value: function confirmSelection(keystroke) {
      if (!this.model.isActive()) {
        return;
      }
      var item = this.getSelectedItem();
      if (item != null) {
        return this.model.confirm(item, keystroke);
      } else {
        return this.model.cancel();
      }
    }

    // Private: Confirms the currently selected item only if it is not the default
    // item or cancels the view if none has been selected.
  }, {
    key: 'confirmSelectionIfNonDefault',
    value: function confirmSelectionIfNonDefault(event) {
      if (!this.model.isActive()) {
        return;
      }
      if (this.nonDefaultIndex) {
        return this.confirmSelection();
      } else {
        this.model.cancel();
        return event.abortKeyBinding();
      }
    }
  }, {
    key: 'renderList',
    value: function renderList() {
      this.innerHTML = ListTemplate;
      this.ol = this.querySelector('.list-group');
      this.scroller = this.querySelector('.suggestion-list-scroller');
      this.descriptionContainer = this.querySelector('.suggestion-description');
      this.descriptionContent = this.querySelector('.suggestion-description-content');
      this.descriptionMoreLink = this.querySelector('.suggestion-description-more-link');
    }
  }, {
    key: 'renderItems',
    value: function renderItems() {
      var left = undefined;
      this.style.width = null;
      var items = (left = this.visibleItems()) != null ? left : [];
      var longestDesc = 0;
      var longestDescIndex = null;
      for (var index = 0; index < items.length; index++) {
        var item = items[index];
        this.renderItem(item, index);
        var descLength = this.descriptionLength(item);
        if (descLength > longestDesc) {
          longestDesc = descLength;
          longestDescIndex = index;
        }
      }
      this.updateDescription(items[longestDescIndex]);
      return this.returnItemsToPool(items.length);
    }
  }, {
    key: 'returnItemsToPool',
    value: function returnItemsToPool(pivotIndex) {
      if (!this.ol) {
        return;
      }

      var li = this.ol.childNodes[pivotIndex];
      while (this.ol != null && li) {
        li.remove();
        this.nodePool.push(li);
        li = this.ol.childNodes[pivotIndex];
      }
    }
  }, {
    key: 'descriptionLength',
    value: function descriptionLength(item) {
      var count = 0;
      if (item.description != null) {
        count += item.description.length;
      }
      if (item.descriptionMoreURL != null) {
        count += 6;
      }
      return count;
    }
  }, {
    key: 'renderSelectedItem',
    value: function renderSelectedItem() {
      if (this.selectedLi && this.selectedLi.classList) {
        this.selectedLi.classList.remove('selected');
      }

      this.selectedLi = this.ol.childNodes[this.selectedIndex];
      if (this.selectedLi != null) {
        this.selectedLi.classList.add('selected');
        this.scrollSelectedItemIntoView();
        return this.updateDescription();
      }
    }

    // This is reading the DOM in the updateDOM cycle. If we dont, there is a flicker :/
  }, {
    key: 'scrollSelectedItemIntoView',
    value: function scrollSelectedItemIntoView() {
      var scrollTop = this.scroller.scrollTop;

      var selectedItemTop = this.selectedLi.offsetTop;
      if (selectedItemTop < scrollTop) {
        // scroll up
        this.scroller.scrollTop = selectedItemTop;
        return;
      }

      var itemHeight = this.uiProps.itemHeight;

      var scrollerHeight = this.maxVisibleSuggestions * itemHeight + this.uiProps.paddingHeight;
      if (selectedItemTop + itemHeight > scrollTop + scrollerHeight) {
        // scroll down
        this.scroller.scrollTop = selectedItemTop - scrollerHeight + itemHeight;
      }
    }
  }, {
    key: 'readUIPropsFromDOM',
    value: function readUIPropsFromDOM() {
      var wordContainer = undefined;
      if (this.selectedLi) {
        wordContainer = this.selectedLi.querySelector('.word-container');
      }

      if (!this.uiProps) {
        this.uiProps = {};
      }
      this.uiProps.width = this.offsetWidth + 1;
      this.uiProps.marginLeft = 0;
      if (wordContainer && wordContainer.offsetLeft) {
        this.uiProps.marginLeft = -wordContainer.offsetLeft;
      }
      if (!this.uiProps.itemHeight) {
        this.uiProps.itemHeight = this.selectedLi.offsetHeight;
      }
      if (!this.uiProps.paddingHeight) {
        this.uiProps.paddingHeight = parseInt(getComputedStyle(this)['padding-top']) + parseInt(getComputedStyle(this)['padding-bottom']);
        if (!this.uiProps.paddingHeight) {
          this.uiProps.paddingHeight = 0;
        }
      }

      // Update UI during this read, so that when polling the document the latest
      // changes can be picked up.
      return this.updateUIForChangedProps();
    }
  }, {
    key: 'updateUIForChangedProps',
    value: function updateUIForChangedProps() {
      this.scroller.style['max-height'] = this.maxVisibleSuggestions * this.uiProps.itemHeight + this.uiProps.paddingHeight + 'px';
      this.style.width = this.uiProps.width + 'px';
      if (this.suggestionListFollows === 'Word') {
        this.style['margin-left'] = this.uiProps.marginLeft + 'px';
      }
      return this.updateDescription();
    }

    // Splits the classes on spaces so as not to anger the DOM gods
  }, {
    key: 'addClassToElement',
    value: function addClassToElement(element, classNames) {
      if (!classNames) {
        return;
      }
      var classes = classNames.split(' ');
      if (classes) {
        for (var i = 0; i < classes.length; i++) {
          var className = classes[i];
          className = className.trim();
          if (className) {
            element.classList.add(className);
          }
        }
      }
    }
  }, {
    key: 'renderItem',
    value: function renderItem(_ref, index) {
      var iconHTML = _ref.iconHTML;
      var type = _ref.type;
      var snippet = _ref.snippet;
      var text = _ref.text;
      var displayText = _ref.displayText;
      var className = _ref.className;
      var replacementPrefix = _ref.replacementPrefix;
      var leftLabel = _ref.leftLabel;
      var leftLabelHTML = _ref.leftLabelHTML;
      var rightLabel = _ref.rightLabel;
      var rightLabelHTML = _ref.rightLabelHTML;

      var li = this.ol.childNodes[index];
      if (!li) {
        if (this.nodepool && this.nodePool.length > 0) {
          li = this.nodePool.pop();
        } else {
          li = document.createElement('li');
          li.innerHTML = ItemTemplate;
        }
        li.dataset.index = index;
        this.ol.appendChild(li);
      }

      li.className = '';
      if (index === this.selectedIndex) {
        li.classList.add('selected');
      }
      if (className) {
        this.addClassToElement(li, className);
      }
      if (index === this.selectedIndex) {
        this.selectedLi = li;
      }

      var typeIconContainer = li.querySelector('.icon-container');
      typeIconContainer.innerHTML = '';

      var sanitizedType = escapeHtml((0, _typeHelpers.isString)(type) ? type : '');
      var sanitizedIconHTML = (0, _typeHelpers.isString)(iconHTML) ? iconHTML : undefined;
      var defaultLetterIconHTML = sanitizedType ? '<span class="icon-letter">' + sanitizedType[0] + '</span>' : '';
      var defaultIconHTML = DefaultSuggestionTypeIconHTML[sanitizedType] != null ? DefaultSuggestionTypeIconHTML[sanitizedType] : defaultLetterIconHTML;
      if ((sanitizedIconHTML || defaultIconHTML) && iconHTML !== false) {
        typeIconContainer.innerHTML = IconTemplate;
        var typeIcon = typeIconContainer.childNodes[0];
        typeIcon.innerHTML = sanitizedIconHTML != null ? sanitizedIconHTML : defaultIconHTML;
        if (type) {
          this.addClassToElement(typeIcon, type);
        }
      }

      var wordSpan = li.querySelector('.word');
      wordSpan.innerHTML = this.getDisplayHTML(text, snippet, displayText, replacementPrefix);

      var leftLabelSpan = li.querySelector('.left-label');
      if (leftLabelHTML != null) {
        leftLabelSpan.innerHTML = leftLabelHTML;
      } else if (leftLabel != null) {
        leftLabelSpan.textContent = leftLabel;
      } else {
        leftLabelSpan.textContent = '';
      }

      var rightLabelSpan = li.querySelector('.right-label');
      if (rightLabelHTML != null) {
        rightLabelSpan.innerHTML = rightLabelHTML;
      } else if (rightLabel != null) {
        rightLabelSpan.textContent = rightLabel;
      } else {
        rightLabelSpan.textContent = '';
      }
    }
  }, {
    key: 'getDisplayHTML',
    value: function getDisplayHTML(text, snippet, displayText, replacementPrefix) {
      var replacementText = text;
      var snippetIndices = undefined;
      if (typeof displayText === 'string') {
        replacementText = displayText;
      } else if (typeof snippet === 'string') {
        replacementText = this.removeEmptySnippets(snippet);
        var snippets = this.snippetParser.findSnippets(replacementText);
        replacementText = this.removeSnippetsFromText(snippets, replacementText);
        snippetIndices = this.findSnippetIndices(snippets);
      }
      var characterMatchIndices = this.findCharacterMatchIndices(replacementText, replacementPrefix);

      var displayHTML = '';
      for (var index = 0; index < replacementText.length; index++) {
        if (snippetIndices && (snippetIndices[index] === SnippetStart || snippetIndices[index] === SnippetStartAndEnd)) {
          displayHTML += '<span class="snippet-completion">';
        }
        if (characterMatchIndices && characterMatchIndices[index]) {
          displayHTML += '<span class="character-match">' + escapeHtml(replacementText[index]) + '</span>';
        } else {
          displayHTML += escapeHtml(replacementText[index]);
        }
        if (snippetIndices && (snippetIndices[index] === SnippetEnd || snippetIndices[index] === SnippetStartAndEnd)) {
          displayHTML += '</span>';
        }
      }
      return displayHTML;
    }
  }, {
    key: 'removeEmptySnippets',
    value: function removeEmptySnippets(text) {
      if (!text || !text.length || text.indexOf('$') === -1) {
        return text;
      } // No snippets
      return text.replace(this.emptySnippetGroupRegex, ''); // Remove all occurrences of $0 or ${0} or ${0:}
    }

    // Will convert 'abc(${1:d}, ${2:e})f' => 'abc(d, e)f'
    //
    // * `snippets` {Array} from `SnippetParser.findSnippets`
    // * `text` {String} to remove snippets from
    //
    // Returns {String}
  }, {
    key: 'removeSnippetsFromText',
    value: function removeSnippetsFromText(snippets, text) {
      if (!text || !text.length || !snippets || !snippets.length) {
        return text;
      }
      var index = 0;
      var result = '';
      for (var _ref22 of snippets) {
        var snippetStart = _ref22.snippetStart;
        var snippetEnd = _ref22.snippetEnd;
        var body = _ref22.body;

        result += text.slice(index, snippetStart) + body;
        index = snippetEnd + 1;
      }
      if (index !== text.length) {
        result += text.slice(index, text.length);
      }
      result = result.replace(this.slashesInSnippetRegex, '\\');
      return result;
    }

    // Computes the indices of snippets in the resulting string from
    // `removeSnippetsFromText`.
    //
    // * `snippets` {Array} from `SnippetParser.findSnippets`
    //
    // e.g. A replacement of 'abc(${1:d})e' is replaced to 'abc(d)e' will result in
    //
    // `{4: SnippetStartAndEnd}`
    //
    // Returns {Object} of {index: SnippetStart|End|StartAndEnd}
  }, {
    key: 'findSnippetIndices',
    value: function findSnippetIndices(snippets) {
      if (!snippets) {
        return;
      }
      var indices = {};
      var offsetAccumulator = 0;
      for (var _ref32 of snippets) {
        var snippetStart = _ref32.snippetStart;
        var snippetEnd = _ref32.snippetEnd;
        var body = _ref32.body;

        var bodyLength = body.length;
        var snippetLength = snippetEnd - snippetStart + 1;
        var startIndex = snippetStart - offsetAccumulator;
        var endIndex = startIndex + bodyLength - 1;
        offsetAccumulator += snippetLength - bodyLength;

        if (startIndex === endIndex) {
          indices[startIndex] = SnippetStartAndEnd;
        } else {
          indices[startIndex] = SnippetStart;
          indices[endIndex] = SnippetEnd;
        }
      }

      return indices;
    }

    // Finds the indices of the chars in text that are matched by replacementPrefix
    //
    // e.g. text = 'abcde', replacementPrefix = 'acd' Will result in
    //
    // {0: true, 2: true, 3: true}
    //
    // Returns an {Object}
  }, {
    key: 'findCharacterMatchIndices',
    value: function findCharacterMatchIndices(text, replacementPrefix) {
      if (!text || !text.length || !replacementPrefix || !replacementPrefix.length) {
        return;
      }
      var matches = {};
      if (this.useAlternateScoring) {
        var matchIndices = _fuzzaldrinPlus2['default'].match(text, replacementPrefix);
        for (var i of matchIndices) {
          matches[i] = true;
        }
      } else {
        var wordIndex = 0;
        for (var i = 0; i < replacementPrefix.length; i++) {
          var ch = replacementPrefix[i];
          while (wordIndex < text.length && text[wordIndex].toLowerCase() !== ch.toLowerCase()) {
            wordIndex += 1;
          }
          if (wordIndex >= text.length) {
            break;
          }
          matches[wordIndex] = true;
          wordIndex += 1;
        }
      }
      return matches;
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.subscriptions.dispose();
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    }
  }]);

  return SuggestionListElement;
})(HTMLElement);

var escapeHtml = function escapeHtml(html) {
  return String(html).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

exports['default'] = SuggestionListElement = document.registerElement('autocomplete-suggestion-list', { prototype: SuggestionListElement.prototype });
// eslint-disable-line no-class-assign
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvc3VnZ2VzdGlvbi1saXN0LWVsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7b0JBRWdELE1BQU07OzZCQUM1QixrQkFBa0I7Ozs7MkJBQ25CLGdCQUFnQjs7OEJBQ2QsaUJBQWlCOzs7O3NCQUN6QixRQUFROzs7O0FBTjNCLFdBQVcsQ0FBQTs7QUFRWCxJQUFNLFlBQVksOExBS2tCLENBQUE7O0FBRXBDLElBQU0sWUFBWSx3UUFNVCxDQUFBOztBQUVULElBQU0sWUFBWSxHQUFHLHNCQUFzQixDQUFBOztBQUUzQyxJQUFNLDZCQUE2QixHQUFHO0FBQ3BDLFdBQVMsRUFBRSxpQ0FBaUM7QUFDNUMsVUFBUSxFQUFFLDhCQUE4QjtBQUN4QyxXQUFTLEVBQUUsOEJBQThCO0FBQ3pDLFVBQVEsRUFBRSw4QkFBOEI7QUFDeEMsV0FBUyxFQUFFLDhCQUE4QjtBQUN6QyxPQUFLLEVBQUUsMkJBQTJCO0FBQ2xDLGFBQVcsRUFBRSwwQkFBMEI7Q0FDeEMsQ0FBQTs7QUFFRCxJQUFNLFlBQVksR0FBRyxDQUFDLENBQUE7QUFDdEIsSUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFBO0FBQ3BCLElBQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFBOztJQUV0QixxQkFBcUI7WUFBckIscUJBQXFCOztXQUFyQixxQkFBcUI7MEJBQXJCLHFCQUFxQjs7K0JBQXJCLHFCQUFxQjs7Ozs7ZUFBckIscUJBQXFCOztXQUNULDJCQUFHO0FBQ2pCLFVBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFBO0FBQ25CLFVBQUksQ0FBQyxzQkFBc0IsR0FBRyxvQ0FBb0MsQ0FBQTtBQUNsRSxVQUFJLENBQUMscUJBQXFCLEdBQUcsT0FBTyxDQUFBO0FBQ3BDLFVBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLFVBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7QUFDOUMsVUFB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QUN6QixDQUFBOztxQkFFYyxxQkFBcUIsR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLDhCQUE4QixFQUFFLEVBQUMsU0FBUyxFQUFFLHFCQUFxQixDQUFDLFNBQVMsRUFBQyxDQUFDIiwiZmlsZSI6Ii9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvc3VnZ2VzdGlvbi1saXN0LWVsZW1lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5pbXBvcnQgeyBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBTbmlwcGV0UGFyc2VyIGZyb20gJy4vc25pcHBldC1wYXJzZXInXG5pbXBvcnQgeyBpc1N0cmluZyB9IGZyb20gJy4vdHlwZS1oZWxwZXJzJ1xuaW1wb3J0IGZ1enphbGRyaW5QbHVzIGZyb20gJ2Z1enphbGRyaW4tcGx1cydcbmltcG9ydCBtYXJrZWQgZnJvbSAnbWFya2VkJ1xuXG5jb25zdCBJdGVtVGVtcGxhdGUgPSBgPHNwYW4gY2xhc3M9XCJpY29uLWNvbnRhaW5lclwiPjwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJsZWZ0LWxhYmVsXCI+PC9zcGFuPlxuICA8c3BhbiBjbGFzcz1cIndvcmQtY29udGFpbmVyXCI+XG4gICAgPHNwYW4gY2xhc3M9XCJ3b3JkXCI+PC9zcGFuPlxuICA8L3NwYW4+XG4gIDxzcGFuIGNsYXNzPVwicmlnaHQtbGFiZWxcIj48L3NwYW4+YFxuXG5jb25zdCBMaXN0VGVtcGxhdGUgPSBgPGRpdiBjbGFzcz1cInN1Z2dlc3Rpb24tbGlzdC1zY3JvbGxlclwiPlxuICAgIDxvbCBjbGFzcz1cImxpc3QtZ3JvdXBcIj48L29sPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cInN1Z2dlc3Rpb24tZGVzY3JpcHRpb25cIj5cbiAgICA8c3BhbiBjbGFzcz1cInN1Z2dlc3Rpb24tZGVzY3JpcHRpb24tY29udGVudFwiPjwvc3Bhbj5cbiAgICA8YSBjbGFzcz1cInN1Z2dlc3Rpb24tZGVzY3JpcHRpb24tbW9yZS1saW5rXCIgaHJlZj1cIiNcIj5Nb3JlLi48L2E+XG4gIDwvZGl2PmBcblxuY29uc3QgSWNvblRlbXBsYXRlID0gJzxpIGNsYXNzPVwiaWNvblwiPjwvaT4nXG5cbmNvbnN0IERlZmF1bHRTdWdnZXN0aW9uVHlwZUljb25IVE1MID0ge1xuICAnc25pcHBldCc6ICc8aSBjbGFzcz1cImljb24tbW92ZS1yaWdodFwiPjwvaT4nLFxuICAnaW1wb3J0JzogJzxpIGNsYXNzPVwiaWNvbi1wYWNrYWdlXCI+PC9pPicsXG4gICdyZXF1aXJlJzogJzxpIGNsYXNzPVwiaWNvbi1wYWNrYWdlXCI+PC9pPicsXG4gICdtb2R1bGUnOiAnPGkgY2xhc3M9XCJpY29uLXBhY2thZ2VcIj48L2k+JyxcbiAgJ3BhY2thZ2UnOiAnPGkgY2xhc3M9XCJpY29uLXBhY2thZ2VcIj48L2k+JyxcbiAgJ3RhZyc6ICc8aSBjbGFzcz1cImljb24tY29kZVwiPjwvaT4nLFxuICAnYXR0cmlidXRlJzogJzxpIGNsYXNzPVwiaWNvbi10YWdcIj48L2k+J1xufVxuXG5jb25zdCBTbmlwcGV0U3RhcnQgPSAxXG5jb25zdCBTbmlwcGV0RW5kID0gMlxuY29uc3QgU25pcHBldFN0YXJ0QW5kRW5kID0gM1xuXG5jbGFzcyBTdWdnZXN0aW9uTGlzdEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIGNyZWF0ZWRDYWxsYmFjayAoKSB7XG4gICAgdGhpcy5tYXhJdGVtcyA9IDIwMFxuICAgIHRoaXMuZW1wdHlTbmlwcGV0R3JvdXBSZWdleCA9IC8oXFwkXFx7XFxkKzpcXH0pfChcXCRcXHtcXGQrXFx9KXwoXFwkXFxkKykvaWdcbiAgICB0aGlzLnNsYXNoZXNJblNuaXBwZXRSZWdleCA9IC9cXFxcXFxcXC9nXG4gICAgdGhpcy5ub2RlUG9vbCA9IG51bGxcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdwb3BvdmVyLWxpc3QnLCAnc2VsZWN0LWxpc3QnLCAnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24tbGlzdCcpXG4gICAgdGhpcy5yZWdpc3Rlck1vdXNlSGFuZGxpbmcoKVxuICAgIHRoaXMuc25pcHBldFBhcnNlciA9IG5ldyBTbmlwcGV0UGFyc2VyKClcbiAgICB0aGlzLm5vZGVQb29sID0gW11cbiAgfVxuXG4gIGF0dGFjaGVkQ2FsbGJhY2sgKCkge1xuICAgIC8vIFRPRE86IEZpeCBvdmVybGF5IGRlY29yYXRvciB0byBpbiBhdG9tIHRvIGFwcGx5IGNsYXNzIGF0dHJpYnV0ZSBjb3JyZWN0bHksIHRoZW4gbW92ZSB0aGlzIHRvIG92ZXJsYXkgY3JlYXRpb24gcG9pbnQuXG4gICAgdGhpcy5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2F1dG9jb21wbGV0ZS1wbHVzJylcbiAgICB0aGlzLmFkZEFjdGl2ZUNsYXNzVG9FZGl0b3IoKVxuICAgIGlmICghdGhpcy5vbCkgeyB0aGlzLnJlbmRlckxpc3QoKSB9XG4gICAgcmV0dXJuIHRoaXMuaXRlbXNDaGFuZ2VkKClcbiAgfVxuXG4gIGRldGFjaGVkQ2FsbGJhY2sgKCkge1xuICAgIGlmICh0aGlzLmFjdGl2ZUNsYXNzRGlzcG9zYWJsZSAmJiB0aGlzLmFjdGl2ZUNsYXNzRGlzcG9zYWJsZS5kaXNwb3NlKSB7XG4gICAgICB0aGlzLmFjdGl2ZUNsYXNzRGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICB9XG4gIH1cblxuICBpbml0aWFsaXplIChtb2RlbCkge1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbFxuICAgIGlmICh0aGlzLm1vZGVsID09IG51bGwpIHsgcmV0dXJuIH1cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRDaGFuZ2VJdGVtcyh0aGlzLml0ZW1zQ2hhbmdlZC5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3ROZXh0KHRoaXMubW92ZVNlbGVjdGlvbkRvd24uYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkU2VsZWN0UHJldmlvdXModGhpcy5tb3ZlU2VsZWN0aW9uVXAuYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkU2VsZWN0UGFnZVVwKHRoaXMubW92ZVNlbGVjdGlvblBhZ2VVcC5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3RQYWdlRG93bih0aGlzLm1vdmVTZWxlY3Rpb25QYWdlRG93bi5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3RUb3AodGhpcy5tb3ZlU2VsZWN0aW9uVG9Ub3AuYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkU2VsZWN0Qm90dG9tKHRoaXMubW92ZVNlbGVjdGlvblRvQm90dG9tLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZENvbmZpcm1TZWxlY3Rpb24odGhpcy5jb25maXJtU2VsZWN0aW9uLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZGNvbmZpcm1TZWxlY3Rpb25JZk5vbkRlZmF1bHQodGhpcy5jb25maXJtU2VsZWN0aW9uSWZOb25EZWZhdWx0LmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZERpc3Bvc2UodGhpcy5kaXNwb3NlLmJpbmQodGhpcykpKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5zdWdnZXN0aW9uTGlzdEZvbGxvd3MnLCBzdWdnZXN0aW9uTGlzdEZvbGxvd3MgPT4ge1xuICAgICAgdGhpcy5zdWdnZXN0aW9uTGlzdEZvbGxvd3MgPSBzdWdnZXN0aW9uTGlzdEZvbGxvd3NcbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLm1heFZpc2libGVTdWdnZXN0aW9ucycsIG1heFZpc2libGVTdWdnZXN0aW9ucyA9PiB7XG4gICAgICB0aGlzLm1heFZpc2libGVTdWdnZXN0aW9ucyA9IG1heFZpc2libGVTdWdnZXN0aW9uc1xuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMudXNlQWx0ZXJuYXRlU2NvcmluZycsIHVzZUFsdGVybmF0ZVNjb3JpbmcgPT4ge1xuICAgICAgdGhpcy51c2VBbHRlcm5hdGVTY29yaW5nID0gdXNlQWx0ZXJuYXRlU2NvcmluZ1xuICAgIH0pKVxuXHR0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20ua2V5bWFwcy5vbkRpZEZhaWxUb01hdGNoQmluZGluZyhrZXlzdHJva2VzID0+IHtcblx0XHRpZiAodGhpcy5zZWxlY3RlZEluZGV4ID09PSAwKVxuXHRcdFx0dGhpcy5jb25maXJtU2VsZWN0aW9uKGtleXN0cm9rZXMpXG5cdH0pKVxuXHRcdFx0XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8vIFRoaXMgc2hvdWxkIGJlIHVubmVjZXNzYXJ5IGJ1dCB0aGUgZXZlbnRzIHdlIG5lZWQgdG8gb3ZlcnJpZGVcbiAgLy8gYXJlIGhhbmRsZWQgYXQgYSBsZXZlbCB0aGF0IGNhbid0IGJlIGJsb2NrZWQgYnkgcmVhY3Qgc3ludGhldGljXG4gIC8vIGV2ZW50cyBiZWNhdXNlIHRoZXkgYXJlIGhhbmRsZWQgYXQgdGhlIGRvY3VtZW50XG4gIHJlZ2lzdGVyTW91c2VIYW5kbGluZyAoKSB7XG4gICAgdGhpcy5vbm1vdXNld2hlZWwgPSBldmVudCA9PiBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgIHRoaXMub25tb3VzZWRvd24gPSAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmZpbmRJdGVtKGV2ZW50KVxuICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5kYXRhc2V0ICYmIGl0ZW0uZGF0YXNldC5pbmRleCkge1xuICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBpdGVtLmRhdGFzZXQuaW5kZXhcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9ubW91c2V1cCA9IChldmVudCkgPT4ge1xuICAgICAgY29uc3QgaXRlbSA9IHRoaXMuZmluZEl0ZW0oZXZlbnQpXG4gICAgICBpZiAoaXRlbSAmJiBpdGVtLmRhdGFzZXQgJiYgaXRlbS5kYXRhc2V0LmluZGV4KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIHRoaXMuY29uZmlybVNlbGVjdGlvbigpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZmluZEl0ZW0gKGV2ZW50KSB7XG4gICAgbGV0IGl0ZW0gPSBldmVudC50YXJnZXRcbiAgICB3aGlsZSAoaXRlbS50YWdOYW1lICE9PSAnTEknICYmIGl0ZW0gIT09IHRoaXMpIHsgaXRlbSA9IGl0ZW0ucGFyZW50Tm9kZSB9XG4gICAgaWYgKGl0ZW0udGFnTmFtZSA9PT0gJ0xJJykgeyByZXR1cm4gaXRlbSB9XG4gIH1cblxuICB1cGRhdGVEZXNjcmlwdGlvbiAoaXRlbSkge1xuICAgIGlmICghaXRlbSkge1xuICAgICAgaWYgKHRoaXMubW9kZWwgJiYgdGhpcy5tb2RlbC5pdGVtcykge1xuICAgICAgICBpdGVtID0gdGhpcy5tb2RlbC5pdGVtc1t0aGlzLnNlbGVjdGVkSW5kZXhdXG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaXRlbSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKGl0ZW0uZGVzY3JpcHRpb25NYXJrZG93biAmJiBpdGVtLmRlc2NyaXB0aW9uTWFya2Rvd24ubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRlbnQuaW5uZXJIVE1MID0gbWFya2VkLnBhcnNlKGl0ZW0uZGVzY3JpcHRpb25NYXJrZG93biwge3Nhbml0aXplOiB0cnVlfSlcbiAgICAgIHRoaXMuc2V0RGVzY3JpcHRpb25Nb3JlTGluayhpdGVtKVxuICAgIH0gZWxzZSBpZiAoaXRlbS5kZXNjcmlwdGlvbiAmJiBpdGVtLmRlc2NyaXB0aW9uLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Db250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Db250ZW50LnRleHRDb250ZW50ID0gaXRlbS5kZXNjcmlwdGlvblxuICAgICAgdGhpcy5zZXREZXNjcmlwdGlvbk1vcmVMaW5rKGl0ZW0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Db250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgIH1cbiAgfVxuXG4gIHNldERlc2NyaXB0aW9uTW9yZUxpbmsgKGl0ZW0pIHtcbiAgICBpZiAoKGl0ZW0uZGVzY3JpcHRpb25Nb3JlVVJMICE9IG51bGwpICYmIChpdGVtLmRlc2NyaXB0aW9uTW9yZVVSTC5sZW5ndGggIT0gbnVsbCkpIHtcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Nb3JlTGluay5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZSdcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Nb3JlTGluay5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBpdGVtLmRlc2NyaXB0aW9uTW9yZVVSTClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbk1vcmVMaW5rLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Nb3JlTGluay5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCAnIycpXG4gICAgfVxuICB9XG5cbiAgaXRlbXNDaGFuZ2VkICgpIHtcbiAgICBpZiAodGhpcy5tb2RlbCAmJiB0aGlzLm1vZGVsLml0ZW1zICYmIHRoaXMubW9kZWwuaXRlbXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW5kZXIoKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXR1cm5JdGVtc1RvUG9vbCgwKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgdGhpcy5ub25EZWZhdWx0SW5kZXggPSBmYWxzZVxuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IDBcbiAgICBpZiAoYXRvbS52aWV3cy5wb2xsQWZ0ZXJOZXh0VXBkYXRlKSB7XG4gICAgICBhdG9tLnZpZXdzLnBvbGxBZnRlck5leHRVcGRhdGUoKVxuICAgIH1cblxuICAgIGF0b20udmlld3MudXBkYXRlRG9jdW1lbnQodGhpcy5yZW5kZXJJdGVtcy5iaW5kKHRoaXMpKVxuICAgIHJldHVybiBhdG9tLnZpZXdzLnJlYWREb2N1bWVudCh0aGlzLnJlYWRVSVByb3BzRnJvbURPTS5iaW5kKHRoaXMpKVxuICB9XG5cbiAgYWRkQWN0aXZlQ2xhc3NUb0VkaXRvciAoKSB7XG4gICAgbGV0IGFjdGl2ZUVkaXRvclxuICAgIGlmICh0aGlzLm1vZGVsKSB7XG4gICAgICBhY3RpdmVFZGl0b3IgPSB0aGlzLm1vZGVsLmFjdGl2ZUVkaXRvclxuICAgIH1cbiAgICBjb25zdCBlZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGFjdGl2ZUVkaXRvcilcbiAgICBpZiAoZWRpdG9yRWxlbWVudCAmJiBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdCkge1xuICAgICAgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdhdXRvY29tcGxldGUtYWN0aXZlJylcbiAgICB9XG5cbiAgICB0aGlzLmFjdGl2ZUNsYXNzRGlzcG9zYWJsZSA9IG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIGlmIChlZGl0b3JFbGVtZW50ICYmIGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0KSB7XG4gICAgICAgIGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnYXV0b2NvbXBsZXRlLWFjdGl2ZScpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25VcCAoKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRJbmRleCA+IDApIHtcbiAgICAgIHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgodGhpcy5zZWxlY3RlZEluZGV4IC0gMSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleCh0aGlzLnZpc2libGVJdGVtcygpLmxlbmd0aCAtIDEpXG4gICAgfVxuICB9XG5cbiAgbW92ZVNlbGVjdGlvbkRvd24gKCkge1xuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggPCAodGhpcy52aXNpYmxlSXRlbXMoKS5sZW5ndGggLSAxKSkge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleCh0aGlzLnNlbGVjdGVkSW5kZXggKyAxKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KDApXG4gICAgfVxuICB9XG5cbiAgbW92ZVNlbGVjdGlvblBhZ2VVcCAoKSB7XG4gICAgY29uc3QgbmV3SW5kZXggPSBNYXRoLm1heCgwLCB0aGlzLnNlbGVjdGVkSW5kZXggLSB0aGlzLm1heFZpc2libGVTdWdnZXN0aW9ucylcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ICE9PSBuZXdJbmRleCkgeyByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KG5ld0luZGV4KSB9XG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uUGFnZURvd24gKCkge1xuICAgIGNvbnN0IGl0ZW1zTGVuZ3RoID0gdGhpcy52aXNpYmxlSXRlbXMoKS5sZW5ndGhcbiAgICBjb25zdCBuZXdJbmRleCA9IE1hdGgubWluKGl0ZW1zTGVuZ3RoIC0gMSwgdGhpcy5zZWxlY3RlZEluZGV4ICsgdGhpcy5tYXhWaXNpYmxlU3VnZ2VzdGlvbnMpXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRJbmRleCAhPT0gbmV3SW5kZXgpIHsgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleChuZXdJbmRleCkgfVxuICB9XG5cbiAgbW92ZVNlbGVjdGlvblRvVG9wICgpIHtcbiAgICBjb25zdCBuZXdJbmRleCA9IDBcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ICE9PSBuZXdJbmRleCkgeyByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KG5ld0luZGV4KSB9XG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uVG9Cb3R0b20gKCkge1xuICAgIGNvbnN0IG5ld0luZGV4ID0gdGhpcy52aXNpYmxlSXRlbXMoKS5sZW5ndGggLSAxXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRJbmRleCAhPT0gbmV3SW5kZXgpIHsgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleChuZXdJbmRleCkgfVxuICB9XG5cbiAgc2V0U2VsZWN0ZWRJbmRleCAoaW5kZXgpIHtcbiAgICB0aGlzLm5vbkRlZmF1bHRJbmRleCA9IHRydWVcbiAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBpbmRleFxuXG5cdHZhciBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBlZGl0b3IuZGVsZXRlVG9CZWdpbm5pbmdPZldvcmQoKTtcblx0ZWRpdG9yLmdldExhc3RDdXJzb3IoKS5tb3ZlVG9FbmRPZldvcmQoKTtcblx0dGhpcy5tb2RlbC5yZXBsYWNlKHRoaXMuZ2V0U2VsZWN0ZWRJdGVtKCkpO1xuXHRlZGl0b3IuZ2V0TGFzdEN1cnNvcigpLm1vdmVUb0JlZ2lubmluZ09mV29yZCgpO1xuXG4gICAgcmV0dXJuIGF0b20udmlld3MudXBkYXRlRG9jdW1lbnQodGhpcy5yZW5kZXJTZWxlY3RlZEl0ZW0uYmluZCh0aGlzKSlcbiAgfVxuXG4gIHZpc2libGVJdGVtcyAoKSB7XG4gICAgaWYgKHRoaXMubW9kZWwgJiYgdGhpcy5tb2RlbC5pdGVtcykge1xuICAgICAgcmV0dXJuIHRoaXMubW9kZWwuaXRlbXMuc2xpY2UoMCwgdGhpcy5tYXhJdGVtcylcbiAgICB9XG4gIH1cblxuICAvLyBQcml2YXRlOiBHZXQgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBpdGVtXG4gIC8vXG4gIC8vIFJldHVybnMgdGhlIHNlbGVjdGVkIHtPYmplY3R9XG4gIGdldFNlbGVjdGVkSXRlbSAoKSB7XG4gICAgaWYgKHRoaXMubW9kZWwgJiYgdGhpcy5tb2RlbC5pdGVtcykge1xuICAgICAgcmV0dXJuIHRoaXMubW9kZWwuaXRlbXNbdGhpcy5zZWxlY3RlZEluZGV4XVxuICAgIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IENvbmZpcm1zIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaXRlbSBvciBjYW5jZWxzIHRoZSBsaXN0IHZpZXdcbiAgLy8gaWYgbm8gaXRlbSBoYXMgYmVlbiBzZWxlY3RlZFxuICBjb25maXJtU2VsZWN0aW9uIChrZXlzdHJva2UpIHtcbiAgICBpZiAoIXRoaXMubW9kZWwuaXNBY3RpdmUoKSkgeyByZXR1cm4gfVxuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmdldFNlbGVjdGVkSXRlbSgpXG4gICAgaWYgKGl0ZW0gIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMubW9kZWwuY29uZmlybShpdGVtLCBrZXlzdHJva2UpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLm1vZGVsLmNhbmNlbCgpXG4gICAgfVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogQ29uZmlybXMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBpdGVtIG9ubHkgaWYgaXQgaXMgbm90IHRoZSBkZWZhdWx0XG4gIC8vIGl0ZW0gb3IgY2FuY2VscyB0aGUgdmlldyBpZiBub25lIGhhcyBiZWVuIHNlbGVjdGVkLlxuICBjb25maXJtU2VsZWN0aW9uSWZOb25EZWZhdWx0IChldmVudCkge1xuICAgIGlmICghdGhpcy5tb2RlbC5pc0FjdGl2ZSgpKSB7IHJldHVybiB9XG4gICAgaWYgKHRoaXMubm9uRGVmYXVsdEluZGV4KSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25maXJtU2VsZWN0aW9uKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5tb2RlbC5jYW5jZWwoKVxuICAgICAgcmV0dXJuIGV2ZW50LmFib3J0S2V5QmluZGluZygpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyTGlzdCAoKSB7XG4gICAgdGhpcy5pbm5lckhUTUwgPSBMaXN0VGVtcGxhdGVcbiAgICB0aGlzLm9sID0gdGhpcy5xdWVyeVNlbGVjdG9yKCcubGlzdC1ncm91cCcpXG4gICAgdGhpcy5zY3JvbGxlciA9IHRoaXMucXVlcnlTZWxlY3RvcignLnN1Z2dlc3Rpb24tbGlzdC1zY3JvbGxlcicpXG4gICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRhaW5lciA9IHRoaXMucXVlcnlTZWxlY3RvcignLnN1Z2dlc3Rpb24tZGVzY3JpcHRpb24nKVxuICAgIHRoaXMuZGVzY3JpcHRpb25Db250ZW50ID0gdGhpcy5xdWVyeVNlbGVjdG9yKCcuc3VnZ2VzdGlvbi1kZXNjcmlwdGlvbi1jb250ZW50JylcbiAgICB0aGlzLmRlc2NyaXB0aW9uTW9yZUxpbmsgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5zdWdnZXN0aW9uLWRlc2NyaXB0aW9uLW1vcmUtbGluaycpXG4gIH1cblxuICByZW5kZXJJdGVtcyAoKSB7XG4gICAgbGV0IGxlZnRcbiAgICB0aGlzLnN0eWxlLndpZHRoID0gbnVsbFxuICAgIGNvbnN0IGl0ZW1zID0gKGxlZnQgPSB0aGlzLnZpc2libGVJdGVtcygpKSAhPSBudWxsID8gbGVmdCA6IFtdXG4gICAgbGV0IGxvbmdlc3REZXNjID0gMFxuICAgIGxldCBsb25nZXN0RGVzY0luZGV4ID0gbnVsbFxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBpdGVtcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSBpdGVtc1tpbmRleF1cbiAgICAgIHRoaXMucmVuZGVySXRlbShpdGVtLCBpbmRleClcbiAgICAgIGNvbnN0IGRlc2NMZW5ndGggPSB0aGlzLmRlc2NyaXB0aW9uTGVuZ3RoKGl0ZW0pXG4gICAgICBpZiAoZGVzY0xlbmd0aCA+IGxvbmdlc3REZXNjKSB7XG4gICAgICAgIGxvbmdlc3REZXNjID0gZGVzY0xlbmd0aFxuICAgICAgICBsb25nZXN0RGVzY0luZGV4ID0gaW5kZXhcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy51cGRhdGVEZXNjcmlwdGlvbihpdGVtc1tsb25nZXN0RGVzY0luZGV4XSlcbiAgICByZXR1cm4gdGhpcy5yZXR1cm5JdGVtc1RvUG9vbChpdGVtcy5sZW5ndGgpXG4gIH1cblxuICByZXR1cm5JdGVtc1RvUG9vbCAocGl2b3RJbmRleCkge1xuICAgIGlmICghdGhpcy5vbCkgeyByZXR1cm4gfVxuXG4gICAgbGV0IGxpID0gdGhpcy5vbC5jaGlsZE5vZGVzW3Bpdm90SW5kZXhdXG4gICAgd2hpbGUgKCh0aGlzLm9sICE9IG51bGwpICYmIGxpKSB7XG4gICAgICBsaS5yZW1vdmUoKVxuICAgICAgdGhpcy5ub2RlUG9vbC5wdXNoKGxpKVxuICAgICAgbGkgPSB0aGlzLm9sLmNoaWxkTm9kZXNbcGl2b3RJbmRleF1cbiAgICB9XG4gIH1cblxuICBkZXNjcmlwdGlvbkxlbmd0aCAoaXRlbSkge1xuICAgIGxldCBjb3VudCA9IDBcbiAgICBpZiAoaXRlbS5kZXNjcmlwdGlvbiAhPSBudWxsKSB7XG4gICAgICBjb3VudCArPSBpdGVtLmRlc2NyaXB0aW9uLmxlbmd0aFxuICAgIH1cbiAgICBpZiAoaXRlbS5kZXNjcmlwdGlvbk1vcmVVUkwgIT0gbnVsbCkge1xuICAgICAgY291bnQgKz0gNlxuICAgIH1cbiAgICByZXR1cm4gY291bnRcbiAgfVxuXG4gIHJlbmRlclNlbGVjdGVkSXRlbSAoKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRMaSAmJiB0aGlzLnNlbGVjdGVkTGkuY2xhc3NMaXN0KSB7XG4gICAgICB0aGlzLnNlbGVjdGVkTGkuY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKVxuICAgIH1cblxuICAgIHRoaXMuc2VsZWN0ZWRMaSA9IHRoaXMub2wuY2hpbGROb2Rlc1t0aGlzLnNlbGVjdGVkSW5kZXhdXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRMaSAhPSBudWxsKSB7XG4gICAgICB0aGlzLnNlbGVjdGVkTGkuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKVxuICAgICAgdGhpcy5zY3JvbGxTZWxlY3RlZEl0ZW1JbnRvVmlldygpXG4gICAgICByZXR1cm4gdGhpcy51cGRhdGVEZXNjcmlwdGlvbigpXG4gICAgfVxuICB9XG5cbiAgLy8gVGhpcyBpcyByZWFkaW5nIHRoZSBET00gaW4gdGhlIHVwZGF0ZURPTSBjeWNsZS4gSWYgd2UgZG9udCwgdGhlcmUgaXMgYSBmbGlja2VyIDovXG4gIHNjcm9sbFNlbGVjdGVkSXRlbUludG9WaWV3ICgpIHtcbiAgICBjb25zdCB7IHNjcm9sbFRvcCB9ID0gdGhpcy5zY3JvbGxlclxuICAgIGNvbnN0IHNlbGVjdGVkSXRlbVRvcCA9IHRoaXMuc2VsZWN0ZWRMaS5vZmZzZXRUb3BcbiAgICBpZiAoc2VsZWN0ZWRJdGVtVG9wIDwgc2Nyb2xsVG9wKSB7XG4gICAgICAvLyBzY3JvbGwgdXBcbiAgICAgIHRoaXMuc2Nyb2xsZXIuc2Nyb2xsVG9wID0gc2VsZWN0ZWRJdGVtVG9wXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB7IGl0ZW1IZWlnaHQgfSA9IHRoaXMudWlQcm9wc1xuICAgIGNvbnN0IHNjcm9sbGVySGVpZ2h0ID0gKHRoaXMubWF4VmlzaWJsZVN1Z2dlc3Rpb25zICogaXRlbUhlaWdodCkgKyB0aGlzLnVpUHJvcHMucGFkZGluZ0hlaWdodFxuICAgIGlmIChzZWxlY3RlZEl0ZW1Ub3AgKyBpdGVtSGVpZ2h0ID4gc2Nyb2xsVG9wICsgc2Nyb2xsZXJIZWlnaHQpIHtcbiAgICAgIC8vIHNjcm9sbCBkb3duXG4gICAgICB0aGlzLnNjcm9sbGVyLnNjcm9sbFRvcCA9IChzZWxlY3RlZEl0ZW1Ub3AgLSBzY3JvbGxlckhlaWdodCkgKyBpdGVtSGVpZ2h0XG4gICAgfVxuICB9XG5cbiAgcmVhZFVJUHJvcHNGcm9tRE9NICgpIHtcbiAgICBsZXQgd29yZENvbnRhaW5lclxuICAgIGlmICh0aGlzLnNlbGVjdGVkTGkpIHtcbiAgICAgIHdvcmRDb250YWluZXIgPSB0aGlzLnNlbGVjdGVkTGkucXVlcnlTZWxlY3RvcignLndvcmQtY29udGFpbmVyJylcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMudWlQcm9wcykgeyB0aGlzLnVpUHJvcHMgPSB7fSB9XG4gICAgdGhpcy51aVByb3BzLndpZHRoID0gdGhpcy5vZmZzZXRXaWR0aCArIDFcbiAgICB0aGlzLnVpUHJvcHMubWFyZ2luTGVmdCA9IDBcbiAgICBpZiAod29yZENvbnRhaW5lciAmJiB3b3JkQ29udGFpbmVyLm9mZnNldExlZnQpIHtcbiAgICAgIHRoaXMudWlQcm9wcy5tYXJnaW5MZWZ0ID0gLXdvcmRDb250YWluZXIub2Zmc2V0TGVmdFxuICAgIH1cbiAgICBpZiAoIXRoaXMudWlQcm9wcy5pdGVtSGVpZ2h0KSB7XG4gICAgICB0aGlzLnVpUHJvcHMuaXRlbUhlaWdodCA9IHRoaXMuc2VsZWN0ZWRMaS5vZmZzZXRIZWlnaHRcbiAgICB9XG4gICAgaWYgKCF0aGlzLnVpUHJvcHMucGFkZGluZ0hlaWdodCkge1xuICAgICAgdGhpcy51aVByb3BzLnBhZGRpbmdIZWlnaHQgPSBwYXJzZUludChnZXRDb21wdXRlZFN0eWxlKHRoaXMpWydwYWRkaW5nLXRvcCddKSArIHBhcnNlSW50KGdldENvbXB1dGVkU3R5bGUodGhpcylbJ3BhZGRpbmctYm90dG9tJ10pXG4gICAgICBpZiAoIXRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0KSB7XG4gICAgICAgIHRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0ID0gMFxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBVSSBkdXJpbmcgdGhpcyByZWFkLCBzbyB0aGF0IHdoZW4gcG9sbGluZyB0aGUgZG9jdW1lbnQgdGhlIGxhdGVzdFxuICAgIC8vIGNoYW5nZXMgY2FuIGJlIHBpY2tlZCB1cC5cbiAgICByZXR1cm4gdGhpcy51cGRhdGVVSUZvckNoYW5nZWRQcm9wcygpXG4gIH1cblxuICB1cGRhdGVVSUZvckNoYW5nZWRQcm9wcyAoKSB7XG4gICAgdGhpcy5zY3JvbGxlci5zdHlsZVsnbWF4LWhlaWdodCddID0gYCR7KHRoaXMubWF4VmlzaWJsZVN1Z2dlc3Rpb25zICogdGhpcy51aVByb3BzLml0ZW1IZWlnaHQpICsgdGhpcy51aVByb3BzLnBhZGRpbmdIZWlnaHR9cHhgXG4gICAgdGhpcy5zdHlsZS53aWR0aCA9IGAke3RoaXMudWlQcm9wcy53aWR0aH1weGBcbiAgICBpZiAodGhpcy5zdWdnZXN0aW9uTGlzdEZvbGxvd3MgPT09ICdXb3JkJykge1xuICAgICAgdGhpcy5zdHlsZVsnbWFyZ2luLWxlZnQnXSA9IGAke3RoaXMudWlQcm9wcy5tYXJnaW5MZWZ0fXB4YFxuICAgIH1cbiAgICByZXR1cm4gdGhpcy51cGRhdGVEZXNjcmlwdGlvbigpXG4gIH1cblxuICAvLyBTcGxpdHMgdGhlIGNsYXNzZXMgb24gc3BhY2VzIHNvIGFzIG5vdCB0byBhbmdlciB0aGUgRE9NIGdvZHNcbiAgYWRkQ2xhc3NUb0VsZW1lbnQgKGVsZW1lbnQsIGNsYXNzTmFtZXMpIHtcbiAgICBpZiAoIWNsYXNzTmFtZXMpIHsgcmV0dXJuIH1cbiAgICBjb25zdCBjbGFzc2VzID0gY2xhc3NOYW1lcy5zcGxpdCgnICcpXG4gICAgaWYgKGNsYXNzZXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xhc3Nlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgY2xhc3NOYW1lID0gY2xhc3Nlc1tpXVxuICAgICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUudHJpbSgpXG4gICAgICAgIGlmIChjbGFzc05hbWUpIHsgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSkgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlckl0ZW0gKHtpY29uSFRNTCwgdHlwZSwgc25pcHBldCwgdGV4dCwgZGlzcGxheVRleHQsIGNsYXNzTmFtZSwgcmVwbGFjZW1lbnRQcmVmaXgsIGxlZnRMYWJlbCwgbGVmdExhYmVsSFRNTCwgcmlnaHRMYWJlbCwgcmlnaHRMYWJlbEhUTUx9LCBpbmRleCkge1xuICAgIGxldCBsaSA9IHRoaXMub2wuY2hpbGROb2Rlc1tpbmRleF1cbiAgICBpZiAoIWxpKSB7XG4gICAgICBpZiAodGhpcy5ub2RlcG9vbCAmJiB0aGlzLm5vZGVQb29sLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGkgPSB0aGlzLm5vZGVQb29sLnBvcCgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJylcbiAgICAgICAgbGkuaW5uZXJIVE1MID0gSXRlbVRlbXBsYXRlXG4gICAgICB9XG4gICAgICBsaS5kYXRhc2V0LmluZGV4ID0gaW5kZXhcbiAgICAgIHRoaXMub2wuYXBwZW5kQ2hpbGQobGkpXG4gICAgfVxuXG4gICAgbGkuY2xhc3NOYW1lID0gJydcbiAgICBpZiAoaW5kZXggPT09IHRoaXMuc2VsZWN0ZWRJbmRleCkgeyBsaS5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpIH1cbiAgICBpZiAoY2xhc3NOYW1lKSB7IHRoaXMuYWRkQ2xhc3NUb0VsZW1lbnQobGksIGNsYXNzTmFtZSkgfVxuICAgIGlmIChpbmRleCA9PT0gdGhpcy5zZWxlY3RlZEluZGV4KSB7IHRoaXMuc2VsZWN0ZWRMaSA9IGxpIH1cblxuICAgIGNvbnN0IHR5cGVJY29uQ29udGFpbmVyID0gbGkucXVlcnlTZWxlY3RvcignLmljb24tY29udGFpbmVyJylcbiAgICB0eXBlSWNvbkNvbnRhaW5lci5pbm5lckhUTUwgPSAnJ1xuXG4gICAgY29uc3Qgc2FuaXRpemVkVHlwZSA9IGVzY2FwZUh0bWwoaXNTdHJpbmcodHlwZSkgPyB0eXBlIDogJycpXG4gICAgY29uc3Qgc2FuaXRpemVkSWNvbkhUTUwgPSBpc1N0cmluZyhpY29uSFRNTCkgPyBpY29uSFRNTCA6IHVuZGVmaW5lZFxuICAgIGNvbnN0IGRlZmF1bHRMZXR0ZXJJY29uSFRNTCA9IHNhbml0aXplZFR5cGUgPyBgPHNwYW4gY2xhc3M9XCJpY29uLWxldHRlclwiPiR7c2FuaXRpemVkVHlwZVswXX08L3NwYW4+YCA6ICcnXG4gICAgY29uc3QgZGVmYXVsdEljb25IVE1MID0gRGVmYXVsdFN1Z2dlc3Rpb25UeXBlSWNvbkhUTUxbc2FuaXRpemVkVHlwZV0gIT0gbnVsbCA/IERlZmF1bHRTdWdnZXN0aW9uVHlwZUljb25IVE1MW3Nhbml0aXplZFR5cGVdIDogZGVmYXVsdExldHRlckljb25IVE1MXG4gICAgaWYgKChzYW5pdGl6ZWRJY29uSFRNTCB8fCBkZWZhdWx0SWNvbkhUTUwpICYmIGljb25IVE1MICE9PSBmYWxzZSkge1xuICAgICAgdHlwZUljb25Db250YWluZXIuaW5uZXJIVE1MID0gSWNvblRlbXBsYXRlXG4gICAgICBjb25zdCB0eXBlSWNvbiA9IHR5cGVJY29uQ29udGFpbmVyLmNoaWxkTm9kZXNbMF1cbiAgICAgIHR5cGVJY29uLmlubmVySFRNTCA9IHNhbml0aXplZEljb25IVE1MICE9IG51bGwgPyBzYW5pdGl6ZWRJY29uSFRNTCA6IGRlZmF1bHRJY29uSFRNTFxuICAgICAgaWYgKHR5cGUpIHsgdGhpcy5hZGRDbGFzc1RvRWxlbWVudCh0eXBlSWNvbiwgdHlwZSkgfVxuICAgIH1cblxuICAgIGNvbnN0IHdvcmRTcGFuID0gbGkucXVlcnlTZWxlY3RvcignLndvcmQnKVxuICAgIHdvcmRTcGFuLmlubmVySFRNTCA9IHRoaXMuZ2V0RGlzcGxheUhUTUwodGV4dCwgc25pcHBldCwgZGlzcGxheVRleHQsIHJlcGxhY2VtZW50UHJlZml4KVxuXG4gICAgY29uc3QgbGVmdExhYmVsU3BhbiA9IGxpLnF1ZXJ5U2VsZWN0b3IoJy5sZWZ0LWxhYmVsJylcbiAgICBpZiAobGVmdExhYmVsSFRNTCAhPSBudWxsKSB7XG4gICAgICBsZWZ0TGFiZWxTcGFuLmlubmVySFRNTCA9IGxlZnRMYWJlbEhUTUxcbiAgICB9IGVsc2UgaWYgKGxlZnRMYWJlbCAhPSBudWxsKSB7XG4gICAgICBsZWZ0TGFiZWxTcGFuLnRleHRDb250ZW50ID0gbGVmdExhYmVsXG4gICAgfSBlbHNlIHtcbiAgICAgIGxlZnRMYWJlbFNwYW4udGV4dENvbnRlbnQgPSAnJ1xuICAgIH1cblxuICAgIGNvbnN0IHJpZ2h0TGFiZWxTcGFuID0gbGkucXVlcnlTZWxlY3RvcignLnJpZ2h0LWxhYmVsJylcbiAgICBpZiAocmlnaHRMYWJlbEhUTUwgIT0gbnVsbCkge1xuICAgICAgcmlnaHRMYWJlbFNwYW4uaW5uZXJIVE1MID0gcmlnaHRMYWJlbEhUTUxcbiAgICB9IGVsc2UgaWYgKHJpZ2h0TGFiZWwgIT0gbnVsbCkge1xuICAgICAgcmlnaHRMYWJlbFNwYW4udGV4dENvbnRlbnQgPSByaWdodExhYmVsXG4gICAgfSBlbHNlIHtcbiAgICAgIHJpZ2h0TGFiZWxTcGFuLnRleHRDb250ZW50ID0gJydcbiAgICB9XG4gIH1cblxuICBnZXREaXNwbGF5SFRNTCAodGV4dCwgc25pcHBldCwgZGlzcGxheVRleHQsIHJlcGxhY2VtZW50UHJlZml4KSB7XG4gICAgbGV0IHJlcGxhY2VtZW50VGV4dCA9IHRleHRcbiAgICBsZXQgc25pcHBldEluZGljZXNcbiAgICBpZiAodHlwZW9mIGRpc3BsYXlUZXh0ID09PSAnc3RyaW5nJykge1xuICAgICAgcmVwbGFjZW1lbnRUZXh0ID0gZGlzcGxheVRleHRcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzbmlwcGV0ID09PSAnc3RyaW5nJykge1xuICAgICAgcmVwbGFjZW1lbnRUZXh0ID0gdGhpcy5yZW1vdmVFbXB0eVNuaXBwZXRzKHNuaXBwZXQpXG4gICAgICBjb25zdCBzbmlwcGV0cyA9IHRoaXMuc25pcHBldFBhcnNlci5maW5kU25pcHBldHMocmVwbGFjZW1lbnRUZXh0KVxuICAgICAgcmVwbGFjZW1lbnRUZXh0ID0gdGhpcy5yZW1vdmVTbmlwcGV0c0Zyb21UZXh0KHNuaXBwZXRzLCByZXBsYWNlbWVudFRleHQpXG4gICAgICBzbmlwcGV0SW5kaWNlcyA9IHRoaXMuZmluZFNuaXBwZXRJbmRpY2VzKHNuaXBwZXRzKVxuICAgIH1cbiAgICBjb25zdCBjaGFyYWN0ZXJNYXRjaEluZGljZXMgPSB0aGlzLmZpbmRDaGFyYWN0ZXJNYXRjaEluZGljZXMocmVwbGFjZW1lbnRUZXh0LCByZXBsYWNlbWVudFByZWZpeClcblxuICAgIGxldCBkaXNwbGF5SFRNTCA9ICcnXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHJlcGxhY2VtZW50VGV4dC5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgIGlmIChzbmlwcGV0SW5kaWNlcyAmJiAoc25pcHBldEluZGljZXNbaW5kZXhdID09PSBTbmlwcGV0U3RhcnQgfHwgc25pcHBldEluZGljZXNbaW5kZXhdID09PSBTbmlwcGV0U3RhcnRBbmRFbmQpKSB7XG4gICAgICAgIGRpc3BsYXlIVE1MICs9ICc8c3BhbiBjbGFzcz1cInNuaXBwZXQtY29tcGxldGlvblwiPidcbiAgICAgIH1cbiAgICAgIGlmIChjaGFyYWN0ZXJNYXRjaEluZGljZXMgJiYgY2hhcmFjdGVyTWF0Y2hJbmRpY2VzW2luZGV4XSkge1xuICAgICAgICBkaXNwbGF5SFRNTCArPSBgPHNwYW4gY2xhc3M9XCJjaGFyYWN0ZXItbWF0Y2hcIj4ke2VzY2FwZUh0bWwocmVwbGFjZW1lbnRUZXh0W2luZGV4XSl9PC9zcGFuPmBcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRpc3BsYXlIVE1MICs9IGVzY2FwZUh0bWwocmVwbGFjZW1lbnRUZXh0W2luZGV4XSlcbiAgICAgIH1cbiAgICAgIGlmIChzbmlwcGV0SW5kaWNlcyAmJiAoc25pcHBldEluZGljZXNbaW5kZXhdID09PSBTbmlwcGV0RW5kIHx8IHNuaXBwZXRJbmRpY2VzW2luZGV4XSA9PT0gU25pcHBldFN0YXJ0QW5kRW5kKSkge1xuICAgICAgICBkaXNwbGF5SFRNTCArPSAnPC9zcGFuPidcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRpc3BsYXlIVE1MXG4gIH1cblxuICByZW1vdmVFbXB0eVNuaXBwZXRzICh0ZXh0KSB7XG4gICAgaWYgKCF0ZXh0IHx8ICF0ZXh0Lmxlbmd0aCB8fCB0ZXh0LmluZGV4T2YoJyQnKSA9PT0gLTEpIHsgcmV0dXJuIHRleHQgfSAvLyBObyBzbmlwcGV0c1xuICAgIHJldHVybiB0ZXh0LnJlcGxhY2UodGhpcy5lbXB0eVNuaXBwZXRHcm91cFJlZ2V4LCAnJykgLy8gUmVtb3ZlIGFsbCBvY2N1cnJlbmNlcyBvZiAkMCBvciAkezB9IG9yICR7MDp9XG4gIH1cblxuICAvLyBXaWxsIGNvbnZlcnQgJ2FiYygkezE6ZH0sICR7MjplfSlmJyA9PiAnYWJjKGQsIGUpZidcbiAgLy9cbiAgLy8gKiBgc25pcHBldHNgIHtBcnJheX0gZnJvbSBgU25pcHBldFBhcnNlci5maW5kU25pcHBldHNgXG4gIC8vICogYHRleHRgIHtTdHJpbmd9IHRvIHJlbW92ZSBzbmlwcGV0cyBmcm9tXG4gIC8vXG4gIC8vIFJldHVybnMge1N0cmluZ31cbiAgcmVtb3ZlU25pcHBldHNGcm9tVGV4dCAoc25pcHBldHMsIHRleHQpIHtcbiAgICBpZiAoIXRleHQgfHwgIXRleHQubGVuZ3RoIHx8ICFzbmlwcGV0cyB8fCAhc25pcHBldHMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGV4dFxuICAgIH1cbiAgICBsZXQgaW5kZXggPSAwXG4gICAgbGV0IHJlc3VsdCA9ICcnXG4gICAgZm9yIChjb25zdCB7c25pcHBldFN0YXJ0LCBzbmlwcGV0RW5kLCBib2R5fSBvZiBzbmlwcGV0cykge1xuICAgICAgcmVzdWx0ICs9IHRleHQuc2xpY2UoaW5kZXgsIHNuaXBwZXRTdGFydCkgKyBib2R5XG4gICAgICBpbmRleCA9IHNuaXBwZXRFbmQgKyAxXG4gICAgfVxuICAgIGlmIChpbmRleCAhPT0gdGV4dC5sZW5ndGgpIHtcbiAgICAgIHJlc3VsdCArPSB0ZXh0LnNsaWNlKGluZGV4LCB0ZXh0Lmxlbmd0aClcbiAgICB9XG4gICAgcmVzdWx0ID0gcmVzdWx0LnJlcGxhY2UodGhpcy5zbGFzaGVzSW5TbmlwcGV0UmVnZXgsICdcXFxcJylcbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cblxuICAvLyBDb21wdXRlcyB0aGUgaW5kaWNlcyBvZiBzbmlwcGV0cyBpbiB0aGUgcmVzdWx0aW5nIHN0cmluZyBmcm9tXG4gIC8vIGByZW1vdmVTbmlwcGV0c0Zyb21UZXh0YC5cbiAgLy9cbiAgLy8gKiBgc25pcHBldHNgIHtBcnJheX0gZnJvbSBgU25pcHBldFBhcnNlci5maW5kU25pcHBldHNgXG4gIC8vXG4gIC8vIGUuZy4gQSByZXBsYWNlbWVudCBvZiAnYWJjKCR7MTpkfSllJyBpcyByZXBsYWNlZCB0byAnYWJjKGQpZScgd2lsbCByZXN1bHQgaW5cbiAgLy9cbiAgLy8gYHs0OiBTbmlwcGV0U3RhcnRBbmRFbmR9YFxuICAvL1xuICAvLyBSZXR1cm5zIHtPYmplY3R9IG9mIHtpbmRleDogU25pcHBldFN0YXJ0fEVuZHxTdGFydEFuZEVuZH1cbiAgZmluZFNuaXBwZXRJbmRpY2VzIChzbmlwcGV0cykge1xuICAgIGlmICghc25pcHBldHMpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBpbmRpY2VzID0ge31cbiAgICBsZXQgb2Zmc2V0QWNjdW11bGF0b3IgPSAwXG4gICAgZm9yIChjb25zdCB7c25pcHBldFN0YXJ0LCBzbmlwcGV0RW5kLCBib2R5fSBvZiBzbmlwcGV0cykge1xuICAgICAgY29uc3QgYm9keUxlbmd0aCA9IGJvZHkubGVuZ3RoXG4gICAgICBjb25zdCBzbmlwcGV0TGVuZ3RoID0gKHNuaXBwZXRFbmQgLSBzbmlwcGV0U3RhcnQpICsgMVxuICAgICAgY29uc3Qgc3RhcnRJbmRleCA9IHNuaXBwZXRTdGFydCAtIG9mZnNldEFjY3VtdWxhdG9yXG4gICAgICBjb25zdCBlbmRJbmRleCA9IChzdGFydEluZGV4ICsgYm9keUxlbmd0aCkgLSAxXG4gICAgICBvZmZzZXRBY2N1bXVsYXRvciArPSBzbmlwcGV0TGVuZ3RoIC0gYm9keUxlbmd0aFxuXG4gICAgICBpZiAoc3RhcnRJbmRleCA9PT0gZW5kSW5kZXgpIHtcbiAgICAgICAgaW5kaWNlc1tzdGFydEluZGV4XSA9IFNuaXBwZXRTdGFydEFuZEVuZFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5kaWNlc1tzdGFydEluZGV4XSA9IFNuaXBwZXRTdGFydFxuICAgICAgICBpbmRpY2VzW2VuZEluZGV4XSA9IFNuaXBwZXRFbmRcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW5kaWNlc1xuICB9XG5cbiAgLy8gRmluZHMgdGhlIGluZGljZXMgb2YgdGhlIGNoYXJzIGluIHRleHQgdGhhdCBhcmUgbWF0Y2hlZCBieSByZXBsYWNlbWVudFByZWZpeFxuICAvL1xuICAvLyBlLmcuIHRleHQgPSAnYWJjZGUnLCByZXBsYWNlbWVudFByZWZpeCA9ICdhY2QnIFdpbGwgcmVzdWx0IGluXG4gIC8vXG4gIC8vIHswOiB0cnVlLCAyOiB0cnVlLCAzOiB0cnVlfVxuICAvL1xuICAvLyBSZXR1cm5zIGFuIHtPYmplY3R9XG4gIGZpbmRDaGFyYWN0ZXJNYXRjaEluZGljZXMgKHRleHQsIHJlcGxhY2VtZW50UHJlZml4KSB7XG4gICAgaWYgKCF0ZXh0IHx8ICF0ZXh0Lmxlbmd0aCB8fCAhcmVwbGFjZW1lbnRQcmVmaXggfHwgIXJlcGxhY2VtZW50UHJlZml4Lmxlbmd0aCkgeyByZXR1cm4gfVxuICAgIGNvbnN0IG1hdGNoZXMgPSB7fVxuICAgIGlmICh0aGlzLnVzZUFsdGVybmF0ZVNjb3JpbmcpIHtcbiAgICAgIGNvbnN0IG1hdGNoSW5kaWNlcyA9IGZ1enphbGRyaW5QbHVzLm1hdGNoKHRleHQsIHJlcGxhY2VtZW50UHJlZml4KVxuICAgICAgZm9yIChjb25zdCBpIG9mIG1hdGNoSW5kaWNlcykge1xuICAgICAgICBtYXRjaGVzW2ldID0gdHJ1ZVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgd29yZEluZGV4ID0gMFxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXBsYWNlbWVudFByZWZpeC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjaCA9IHJlcGxhY2VtZW50UHJlZml4W2ldXG4gICAgICAgIHdoaWxlICh3b3JkSW5kZXggPCB0ZXh0Lmxlbmd0aCAmJiB0ZXh0W3dvcmRJbmRleF0udG9Mb3dlckNhc2UoKSAhPT0gY2gudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgIHdvcmRJbmRleCArPSAxXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHdvcmRJbmRleCA+PSB0ZXh0Lmxlbmd0aCkgeyBicmVhayB9XG4gICAgICAgIG1hdGNoZXNbd29yZEluZGV4XSA9IHRydWVcbiAgICAgICAgd29yZEluZGV4ICs9IDFcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoZXNcbiAgfVxuXG4gIGRpc3Bvc2UgKCkge1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBpZiAodGhpcy5wYXJlbnROb2RlKSB7XG4gICAgICB0aGlzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcylcbiAgICB9XG4gIH1cbn1cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2NvbXBvbmVudC9lc2NhcGUtaHRtbC9ibG9iL21hc3Rlci9pbmRleC5qc1xuY29uc3QgZXNjYXBlSHRtbCA9IChodG1sKSA9PiB7XG4gIHJldHVybiBTdHJpbmcoaHRtbClcbiAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKVxuICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG59XG5cbmV4cG9ydCBkZWZhdWx0IFN1Z2dlc3Rpb25MaXN0RWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudCgnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24tbGlzdCcsIHtwcm90b3R5cGU6IFN1Z2dlc3Rpb25MaXN0RWxlbWVudC5wcm90b3R5cGV9KSAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNsYXNzLWFzc2lnblxuIl19