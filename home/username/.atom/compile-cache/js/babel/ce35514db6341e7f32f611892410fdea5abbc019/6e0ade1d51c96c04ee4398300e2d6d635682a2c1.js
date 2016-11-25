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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvc3VnZ2VzdGlvbi1saXN0LWVsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7b0JBRWdELE1BQU07OzZCQUM1QixrQkFBa0I7Ozs7MkJBQ25CLGdCQUFnQjs7OEJBQ2QsaUJBQWlCOzs7O3NCQUN6QixRQUFROzs7O0FBTjNCLFdBQVcsQ0FBQTs7QUFRWCxJQUFNLFlBQVksOExBS2tCLENBQUE7O0FBRXBDLElBQU0sWUFBWSx3UUFNVCxDQUFBOztBQUVULElBQU0sWUFBWSxHQUFHLHNCQUFzQixDQUFBOztBQUUzQyxJQUFNLDZCQUE2QixHQUFHO0FBQ3BDLFdBQVMsRUFBRSxpQ0FBaUM7QUFDNUMsVUFBUSxFQUFFLDhCQUE4QjtBQUN4QyxXQUFTLEVBQUUsOEJBQThCO0FBQ3pDLFVBQVEsRUFBRSw4QkFBOEI7QUFDeEMsV0FBUyxFQUFFLDhCQUE4QjtBQUN6QyxPQUFLLEVBQUUsMkJBQTJCO0FBQ2xDLGFBQVcsRUFBRSwwQkFBMEI7Q0FDeEMsQ0FBQTs7QUFFRCxJQUFNLFlBQVksR0FBRyxDQUFDLENBQUE7QUFDdEIsSUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFBO0FBQ3BCLElBQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFBOztJQUV0QixxQkFBcUI7WUFBckIscUJBQXFCOztXQUFyQixxQkFBcUI7MEJBQXJCLHFCQUFxQjs7K0JBQXJCLHFCQUFxQjs7Ozs7ZUFBckIscUJBQXFCOztXQUNULDJCQUFHO0FBQ2pCLFVBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFBO0FBQ25CLFVBQUksQ0FBQyxzQkFBc0IsR0FBRyxvQ0FBb0MsQ0FBQTtBQUNsRSxVQUFJLENBQUMscUJBQXFCLEdBQUcsT0FBTyxDQUFBO0FBQ3BDLFVBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLFVBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7QUFDOUMsVUFB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QUMsOEJBQThCLEVBQUUsRUFBQyxTQUFTLEVBQUUscUJBQXFCLENBQUMsU0FBUyxFQUFDLENBQUMiLCJmaWxlIjoiL2hvbWUvamFtZXMvZ2l0aHViL2F1dG9jb21wbGV0ZS1wbHVzL2xpYi9zdWdnZXN0aW9uLWxpc3QtZWxlbWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCB7IERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IFNuaXBwZXRQYXJzZXIgZnJvbSAnLi9zbmlwcGV0LXBhcnNlcidcbmltcG9ydCB7IGlzU3RyaW5nIH0gZnJvbSAnLi90eXBlLWhlbHBlcnMnXG5pbXBvcnQgZnV6emFsZHJpblBsdXMgZnJvbSAnZnV6emFsZHJpbi1wbHVzJ1xuaW1wb3J0IG1hcmtlZCBmcm9tICdtYXJrZWQnXG5cbmNvbnN0IEl0ZW1UZW1wbGF0ZSA9IGA8c3BhbiBjbGFzcz1cImljb24tY29udGFpbmVyXCI+PC9zcGFuPlxuICA8c3BhbiBjbGFzcz1cImxlZnQtbGFiZWxcIj48L3NwYW4+XG4gIDxzcGFuIGNsYXNzPVwid29yZC1jb250YWluZXJcIj5cbiAgICA8c3BhbiBjbGFzcz1cIndvcmRcIj48L3NwYW4+XG4gIDwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJyaWdodC1sYWJlbFwiPjwvc3Bhbj5gXG5cbmNvbnN0IExpc3RUZW1wbGF0ZSA9IGA8ZGl2IGNsYXNzPVwic3VnZ2VzdGlvbi1saXN0LXNjcm9sbGVyXCI+XG4gICAgPG9sIGNsYXNzPVwibGlzdC1ncm91cFwiPjwvb2w+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwic3VnZ2VzdGlvbi1kZXNjcmlwdGlvblwiPlxuICAgIDxzcGFuIGNsYXNzPVwic3VnZ2VzdGlvbi1kZXNjcmlwdGlvbi1jb250ZW50XCI+PC9zcGFuPlxuICAgIDxhIGNsYXNzPVwic3VnZ2VzdGlvbi1kZXNjcmlwdGlvbi1tb3JlLWxpbmtcIiBocmVmPVwiI1wiPk1vcmUuLjwvYT5cbiAgPC9kaXY+YFxuXG5jb25zdCBJY29uVGVtcGxhdGUgPSAnPGkgY2xhc3M9XCJpY29uXCI+PC9pPidcblxuY29uc3QgRGVmYXVsdFN1Z2dlc3Rpb25UeXBlSWNvbkhUTUwgPSB7XG4gICdzbmlwcGV0JzogJzxpIGNsYXNzPVwiaWNvbi1tb3ZlLXJpZ2h0XCI+PC9pPicsXG4gICdpbXBvcnQnOiAnPGkgY2xhc3M9XCJpY29uLXBhY2thZ2VcIj48L2k+JyxcbiAgJ3JlcXVpcmUnOiAnPGkgY2xhc3M9XCJpY29uLXBhY2thZ2VcIj48L2k+JyxcbiAgJ21vZHVsZSc6ICc8aSBjbGFzcz1cImljb24tcGFja2FnZVwiPjwvaT4nLFxuICAncGFja2FnZSc6ICc8aSBjbGFzcz1cImljb24tcGFja2FnZVwiPjwvaT4nLFxuICAndGFnJzogJzxpIGNsYXNzPVwiaWNvbi1jb2RlXCI+PC9pPicsXG4gICdhdHRyaWJ1dGUnOiAnPGkgY2xhc3M9XCJpY29uLXRhZ1wiPjwvaT4nXG59XG5cbmNvbnN0IFNuaXBwZXRTdGFydCA9IDFcbmNvbnN0IFNuaXBwZXRFbmQgPSAyXG5jb25zdCBTbmlwcGV0U3RhcnRBbmRFbmQgPSAzXG5cbmNsYXNzIFN1Z2dlc3Rpb25MaXN0RWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgY3JlYXRlZENhbGxiYWNrICgpIHtcbiAgICB0aGlzLm1heEl0ZW1zID0gMjAwXG4gICAgdGhpcy5lbXB0eVNuaXBwZXRHcm91cFJlZ2V4ID0gLyhcXCRcXHtcXGQrOlxcfSl8KFxcJFxce1xcZCtcXH0pfChcXCRcXGQrKS9pZ1xuICAgIHRoaXMuc2xhc2hlc0luU25pcHBldFJlZ2V4ID0gL1xcXFxcXFxcL2dcbiAgICB0aGlzLm5vZGVQb29sID0gbnVsbFxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ3BvcG92ZXItbGlzdCcsICdzZWxlY3QtbGlzdCcsICdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbi1saXN0JylcbiAgICB0aGlzLnJlZ2lzdGVyTW91c2VIYW5kbGluZygpXG4gICAgdGhpcy5zbmlwcGV0UGFyc2VyID0gbmV3IFNuaXBwZXRQYXJzZXIoKVxuICAgIHRoaXMubm9kZVBvb2wgPSBbXVxuICB9XG5cbiAgYXR0YWNoZWRDYWxsYmFjayAoKSB7XG4gICAgLy8gVE9ETzogRml4IG92ZXJsYXkgZGVjb3JhdG9yIHRvIGluIGF0b20gdG8gYXBwbHkgY2xhc3MgYXR0cmlidXRlIGNvcnJlY3RseSwgdGhlbiBtb3ZlIHRoaXMgdG8gb3ZlcmxheSBjcmVhdGlvbiBwb2ludC5cbiAgICB0aGlzLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYXV0b2NvbXBsZXRlLXBsdXMnKVxuICAgIHRoaXMuYWRkQWN0aXZlQ2xhc3NUb0VkaXRvcigpXG4gICAgaWYgKCF0aGlzLm9sKSB7IHRoaXMucmVuZGVyTGlzdCgpIH1cbiAgICByZXR1cm4gdGhpcy5pdGVtc0NoYW5nZWQoKVxuICB9XG5cbiAgZGV0YWNoZWRDYWxsYmFjayAoKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlQ2xhc3NEaXNwb3NhYmxlICYmIHRoaXMuYWN0aXZlQ2xhc3NEaXNwb3NhYmxlLmRpc3Bvc2UpIHtcbiAgICAgIHRoaXMuYWN0aXZlQ2xhc3NEaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgIH1cbiAgfVxuXG4gIGluaXRpYWxpemUgKG1vZGVsKSB7XG4gICAgdGhpcy5tb2RlbCA9IG1vZGVsXG4gICAgaWYgKHRoaXMubW9kZWwgPT0gbnVsbCkgeyByZXR1cm4gfVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZENoYW5nZUl0ZW1zKHRoaXMuaXRlbXNDaGFuZ2VkLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZFNlbGVjdE5leHQodGhpcy5tb3ZlU2VsZWN0aW9uRG93bi5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3RQcmV2aW91cyh0aGlzLm1vdmVTZWxlY3Rpb25VcC5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3RQYWdlVXAodGhpcy5tb3ZlU2VsZWN0aW9uUGFnZVVwLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZFNlbGVjdFBhZ2VEb3duKHRoaXMubW92ZVNlbGVjdGlvblBhZ2VEb3duLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZFNlbGVjdFRvcCh0aGlzLm1vdmVTZWxlY3Rpb25Ub1RvcC5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3RCb3R0b20odGhpcy5tb3ZlU2VsZWN0aW9uVG9Cb3R0b20uYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkQ29uZmlybVNlbGVjdGlvbih0aGlzLmNvbmZpcm1TZWxlY3Rpb24uYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdCh0aGlzLmNvbmZpcm1TZWxlY3Rpb25JZk5vbkRlZmF1bHQuYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkRGlzcG9zZSh0aGlzLmRpc3Bvc2UuYmluZCh0aGlzKSkpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLnN1Z2dlc3Rpb25MaXN0Rm9sbG93cycsIHN1Z2dlc3Rpb25MaXN0Rm9sbG93cyA9PiB7XG4gICAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0Rm9sbG93cyA9IHN1Z2dlc3Rpb25MaXN0Rm9sbG93c1xuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMubWF4VmlzaWJsZVN1Z2dlc3Rpb25zJywgbWF4VmlzaWJsZVN1Z2dlc3Rpb25zID0+IHtcbiAgICAgIHRoaXMubWF4VmlzaWJsZVN1Z2dlc3Rpb25zID0gbWF4VmlzaWJsZVN1Z2dlc3Rpb25zXG4gICAgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy51c2VBbHRlcm5hdGVTY29yaW5nJywgdXNlQWx0ZXJuYXRlU2NvcmluZyA9PiB7XG4gICAgICB0aGlzLnVzZUFsdGVybmF0ZVNjb3JpbmcgPSB1c2VBbHRlcm5hdGVTY29yaW5nXG4gICAgfSkpXG5cdHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5rZXltYXBzLm9uRGlkRmFpbFRvTWF0Y2hCaW5kaW5nKGtleXN0cm9rZXMgPT4ge1xuXHRcdGlmICh0aGlzLnNlbGVjdGVkSW5kZXggPT09IDApXG5cdFx0XHR0aGlzLmNvbmZpcm1TZWxlY3Rpb24oa2V5c3Ryb2tlcylcblx0fSkpXG5cdFx0XHRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gVGhpcyBzaG91bGQgYmUgdW5uZWNlc3NhcnkgYnV0IHRoZSBldmVudHMgd2UgbmVlZCB0byBvdmVycmlkZVxuICAvLyBhcmUgaGFuZGxlZCBhdCBhIGxldmVsIHRoYXQgY2FuJ3QgYmUgYmxvY2tlZCBieSByZWFjdCBzeW50aGV0aWNcbiAgLy8gZXZlbnRzIGJlY2F1c2UgdGhleSBhcmUgaGFuZGxlZCBhdCB0aGUgZG9jdW1lbnRcbiAgcmVnaXN0ZXJNb3VzZUhhbmRsaW5nICgpIHtcbiAgICB0aGlzLm9ubW91c2V3aGVlbCA9IGV2ZW50ID0+IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgdGhpcy5vbm1vdXNlZG93biA9IChldmVudCkgPT4ge1xuICAgICAgY29uc3QgaXRlbSA9IHRoaXMuZmluZEl0ZW0oZXZlbnQpXG4gICAgICBpZiAoaXRlbSAmJiBpdGVtLmRhdGFzZXQgJiYgaXRlbS5kYXRhc2V0LmluZGV4KSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IGl0ZW0uZGF0YXNldC5pbmRleFxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMub25tb3VzZXVwID0gKGV2ZW50KSA9PiB7XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5maW5kSXRlbShldmVudClcbiAgICAgIGlmIChpdGVtICYmIGl0ZW0uZGF0YXNldCAmJiBpdGVtLmRhdGFzZXQuaW5kZXgpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgdGhpcy5jb25maXJtU2VsZWN0aW9uKClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmaW5kSXRlbSAoZXZlbnQpIHtcbiAgICBsZXQgaXRlbSA9IGV2ZW50LnRhcmdldFxuICAgIHdoaWxlIChpdGVtLnRhZ05hbWUgIT09ICdMSScgJiYgaXRlbSAhPT0gdGhpcykgeyBpdGVtID0gaXRlbS5wYXJlbnROb2RlIH1cbiAgICBpZiAoaXRlbS50YWdOYW1lID09PSAnTEknKSB7IHJldHVybiBpdGVtIH1cbiAgfVxuXG4gIHVwZGF0ZURlc2NyaXB0aW9uIChpdGVtKSB7XG4gICAgaWYgKCFpdGVtKSB7XG4gICAgICBpZiAodGhpcy5tb2RlbCAmJiB0aGlzLm1vZGVsLml0ZW1zKSB7XG4gICAgICAgIGl0ZW0gPSB0aGlzLm1vZGVsLml0ZW1zW3RoaXMuc2VsZWN0ZWRJbmRleF1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFpdGVtKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoaXRlbS5kZXNjcmlwdGlvbk1hcmtkb3duICYmIGl0ZW0uZGVzY3JpcHRpb25NYXJrZG93bi5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGVudC5pbm5lckhUTUwgPSBtYXJrZWQucGFyc2UoaXRlbS5kZXNjcmlwdGlvbk1hcmtkb3duLCB7c2FuaXRpemU6IHRydWV9KVxuICAgICAgdGhpcy5zZXREZXNjcmlwdGlvbk1vcmVMaW5rKGl0ZW0pXG4gICAgfSBlbHNlIGlmIChpdGVtLmRlc2NyaXB0aW9uICYmIGl0ZW0uZGVzY3JpcHRpb24ubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRlbnQudGV4dENvbnRlbnQgPSBpdGVtLmRlc2NyaXB0aW9uXG4gICAgICB0aGlzLnNldERlc2NyaXB0aW9uTW9yZUxpbmsoaXRlbSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgfVxuICB9XG5cbiAgc2V0RGVzY3JpcHRpb25Nb3JlTGluayAoaXRlbSkge1xuICAgIGlmICgoaXRlbS5kZXNjcmlwdGlvbk1vcmVVUkwgIT0gbnVsbCkgJiYgKGl0ZW0uZGVzY3JpcHRpb25Nb3JlVVJMLmxlbmd0aCAhPSBudWxsKSkge1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbk1vcmVMaW5rLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJ1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbk1vcmVMaW5rLnNldEF0dHJpYnV0ZSgnaHJlZicsIGl0ZW0uZGVzY3JpcHRpb25Nb3JlVVJMKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlc2NyaXB0aW9uTW9yZUxpbmsuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbk1vcmVMaW5rLnNldEF0dHJpYnV0ZSgnaHJlZicsICcjJylcbiAgICB9XG4gIH1cblxuICBpdGVtc0NoYW5nZWQgKCkge1xuICAgIGlmICh0aGlzLm1vZGVsICYmIHRoaXMubW9kZWwuaXRlbXMgJiYgdGhpcy5tb2RlbC5pdGVtcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlcigpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnJldHVybkl0ZW1zVG9Qb29sKDApXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICB0aGlzLm5vbkRlZmF1bHRJbmRleCA9IGZhbHNlXG4gICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gMFxuICAgIGlmIChhdG9tLnZpZXdzLnBvbGxBZnRlck5leHRVcGRhdGUpIHtcbiAgICAgIGF0b20udmlld3MucG9sbEFmdGVyTmV4dFVwZGF0ZSgpXG4gICAgfVxuXG4gICAgYXRvbS52aWV3cy51cGRhdGVEb2N1bWVudCh0aGlzLnJlbmRlckl0ZW1zLmJpbmQodGhpcykpXG4gICAgcmV0dXJuIGF0b20udmlld3MucmVhZERvY3VtZW50KHRoaXMucmVhZFVJUHJvcHNGcm9tRE9NLmJpbmQodGhpcykpXG4gIH1cblxuICBhZGRBY3RpdmVDbGFzc1RvRWRpdG9yICgpIHtcbiAgICBsZXQgYWN0aXZlRWRpdG9yXG4gICAgaWYgKHRoaXMubW9kZWwpIHtcbiAgICAgIGFjdGl2ZUVkaXRvciA9IHRoaXMubW9kZWwuYWN0aXZlRWRpdG9yXG4gICAgfVxuICAgIGNvbnN0IGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYWN0aXZlRWRpdG9yKVxuICAgIGlmIChlZGl0b3JFbGVtZW50ICYmIGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0KSB7XG4gICAgICBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2F1dG9jb21wbGV0ZS1hY3RpdmUnKVxuICAgIH1cblxuICAgIHRoaXMuYWN0aXZlQ2xhc3NEaXNwb3NhYmxlID0gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgaWYgKGVkaXRvckVsZW1lbnQgJiYgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICAgICAgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdhdXRvY29tcGxldGUtYWN0aXZlJylcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgbW92ZVNlbGVjdGlvblVwICgpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ID4gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleCh0aGlzLnNlbGVjdGVkSW5kZXggLSAxKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KHRoaXMudmlzaWJsZUl0ZW1zKCkubGVuZ3RoIC0gMSlcbiAgICB9XG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uRG93biAoKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRJbmRleCA8ICh0aGlzLnZpc2libGVJdGVtcygpLmxlbmd0aCAtIDEpKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KHRoaXMuc2VsZWN0ZWRJbmRleCArIDEpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgoMClcbiAgICB9XG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uUGFnZVVwICgpIHtcbiAgICBjb25zdCBuZXdJbmRleCA9IE1hdGgubWF4KDAsIHRoaXMuc2VsZWN0ZWRJbmRleCAtIHRoaXMubWF4VmlzaWJsZVN1Z2dlc3Rpb25zKVxuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IG5ld0luZGV4KSB7IHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgobmV3SW5kZXgpIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25QYWdlRG93biAoKSB7XG4gICAgY29uc3QgaXRlbXNMZW5ndGggPSB0aGlzLnZpc2libGVJdGVtcygpLmxlbmd0aFxuICAgIGNvbnN0IG5ld0luZGV4ID0gTWF0aC5taW4oaXRlbXNMZW5ndGggLSAxLCB0aGlzLnNlbGVjdGVkSW5kZXggKyB0aGlzLm1heFZpc2libGVTdWdnZXN0aW9ucylcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ICE9PSBuZXdJbmRleCkgeyByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KG5ld0luZGV4KSB9XG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uVG9Ub3AgKCkge1xuICAgIGNvbnN0IG5ld0luZGV4ID0gMFxuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IG5ld0luZGV4KSB7IHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgobmV3SW5kZXgpIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25Ub0JvdHRvbSAoKSB7XG4gICAgY29uc3QgbmV3SW5kZXggPSB0aGlzLnZpc2libGVJdGVtcygpLmxlbmd0aCAtIDFcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ICE9PSBuZXdJbmRleCkgeyByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KG5ld0luZGV4KSB9XG4gIH1cblxuICBzZXRTZWxlY3RlZEluZGV4IChpbmRleCkge1xuICAgIHRoaXMubm9uRGVmYXVsdEluZGV4ID0gdHJ1ZVxuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IGluZGV4XG5cblx0dmFyIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGVkaXRvci5kZWxldGVUb0JlZ2lubmluZ09mV29yZCgpO1xuXHR0aGlzLm1vZGVsLnJlcGxhY2UodGhpcy5nZXRTZWxlY3RlZEl0ZW0oKSk7XG5cdGVkaXRvci5nZXRMYXN0Q3Vyc29yKCkubW92ZVRvQmVnaW5uaW5nT2ZXb3JkKCk7XG5cbiAgICByZXR1cm4gYXRvbS52aWV3cy51cGRhdGVEb2N1bWVudCh0aGlzLnJlbmRlclNlbGVjdGVkSXRlbS5iaW5kKHRoaXMpKVxuICB9XG5cbiAgdmlzaWJsZUl0ZW1zICgpIHtcbiAgICBpZiAodGhpcy5tb2RlbCAmJiB0aGlzLm1vZGVsLml0ZW1zKSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5pdGVtcy5zbGljZSgwLCB0aGlzLm1heEl0ZW1zKVxuICAgIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IEdldCB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW1cbiAgLy9cbiAgLy8gUmV0dXJucyB0aGUgc2VsZWN0ZWQge09iamVjdH1cbiAgZ2V0U2VsZWN0ZWRJdGVtICgpIHtcbiAgICBpZiAodGhpcy5tb2RlbCAmJiB0aGlzLm1vZGVsLml0ZW1zKSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5pdGVtc1t0aGlzLnNlbGVjdGVkSW5kZXhdXG4gICAgfVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogQ29uZmlybXMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBpdGVtIG9yIGNhbmNlbHMgdGhlIGxpc3Qgdmlld1xuICAvLyBpZiBubyBpdGVtIGhhcyBiZWVuIHNlbGVjdGVkXG4gIGNvbmZpcm1TZWxlY3Rpb24gKGtleXN0cm9rZSkge1xuICAgIGlmICghdGhpcy5tb2RlbC5pc0FjdGl2ZSgpKSB7IHJldHVybiB9XG4gICAgY29uc3QgaXRlbSA9IHRoaXMuZ2V0U2VsZWN0ZWRJdGVtKClcbiAgICBpZiAoaXRlbSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5jb25maXJtKGl0ZW0sIGtleXN0cm9rZSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMubW9kZWwuY2FuY2VsKClcbiAgICB9XG4gIH1cblxuICAvLyBQcml2YXRlOiBDb25maXJtcyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW0gb25seSBpZiBpdCBpcyBub3QgdGhlIGRlZmF1bHRcbiAgLy8gaXRlbSBvciBjYW5jZWxzIHRoZSB2aWV3IGlmIG5vbmUgaGFzIGJlZW4gc2VsZWN0ZWQuXG4gIGNvbmZpcm1TZWxlY3Rpb25JZk5vbkRlZmF1bHQgKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLm1vZGVsLmlzQWN0aXZlKCkpIHsgcmV0dXJuIH1cbiAgICBpZiAodGhpcy5ub25EZWZhdWx0SW5kZXgpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpcm1TZWxlY3Rpb24oKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1vZGVsLmNhbmNlbCgpXG4gICAgICByZXR1cm4gZXZlbnQuYWJvcnRLZXlCaW5kaW5nKClcbiAgICB9XG4gIH1cblxuICByZW5kZXJMaXN0ICgpIHtcbiAgICB0aGlzLmlubmVySFRNTCA9IExpc3RUZW1wbGF0ZVxuICAgIHRoaXMub2wgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5saXN0LWdyb3VwJylcbiAgICB0aGlzLnNjcm9sbGVyID0gdGhpcy5xdWVyeVNlbGVjdG9yKCcuc3VnZ2VzdGlvbi1saXN0LXNjcm9sbGVyJylcbiAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGFpbmVyID0gdGhpcy5xdWVyeVNlbGVjdG9yKCcuc3VnZ2VzdGlvbi1kZXNjcmlwdGlvbicpXG4gICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRlbnQgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5zdWdnZXN0aW9uLWRlc2NyaXB0aW9uLWNvbnRlbnQnKVxuICAgIHRoaXMuZGVzY3JpcHRpb25Nb3JlTGluayA9IHRoaXMucXVlcnlTZWxlY3RvcignLnN1Z2dlc3Rpb24tZGVzY3JpcHRpb24tbW9yZS1saW5rJylcbiAgfVxuXG4gIHJlbmRlckl0ZW1zICgpIHtcbiAgICBsZXQgbGVmdFxuICAgIHRoaXMuc3R5bGUud2lkdGggPSBudWxsXG4gICAgY29uc3QgaXRlbXMgPSAobGVmdCA9IHRoaXMudmlzaWJsZUl0ZW1zKCkpICE9IG51bGwgPyBsZWZ0IDogW11cbiAgICBsZXQgbG9uZ2VzdERlc2MgPSAwXG4gICAgbGV0IGxvbmdlc3REZXNjSW5kZXggPSBudWxsXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGl0ZW1zLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY29uc3QgaXRlbSA9IGl0ZW1zW2luZGV4XVxuICAgICAgdGhpcy5yZW5kZXJJdGVtKGl0ZW0sIGluZGV4KVxuICAgICAgY29uc3QgZGVzY0xlbmd0aCA9IHRoaXMuZGVzY3JpcHRpb25MZW5ndGgoaXRlbSlcbiAgICAgIGlmIChkZXNjTGVuZ3RoID4gbG9uZ2VzdERlc2MpIHtcbiAgICAgICAgbG9uZ2VzdERlc2MgPSBkZXNjTGVuZ3RoXG4gICAgICAgIGxvbmdlc3REZXNjSW5kZXggPSBpbmRleFxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnVwZGF0ZURlc2NyaXB0aW9uKGl0ZW1zW2xvbmdlc3REZXNjSW5kZXhdKVxuICAgIHJldHVybiB0aGlzLnJldHVybkl0ZW1zVG9Qb29sKGl0ZW1zLmxlbmd0aClcbiAgfVxuXG4gIHJldHVybkl0ZW1zVG9Qb29sIChwaXZvdEluZGV4KSB7XG4gICAgaWYgKCF0aGlzLm9sKSB7IHJldHVybiB9XG5cbiAgICBsZXQgbGkgPSB0aGlzLm9sLmNoaWxkTm9kZXNbcGl2b3RJbmRleF1cbiAgICB3aGlsZSAoKHRoaXMub2wgIT0gbnVsbCkgJiYgbGkpIHtcbiAgICAgIGxpLnJlbW92ZSgpXG4gICAgICB0aGlzLm5vZGVQb29sLnB1c2gobGkpXG4gICAgICBsaSA9IHRoaXMub2wuY2hpbGROb2Rlc1twaXZvdEluZGV4XVxuICAgIH1cbiAgfVxuXG4gIGRlc2NyaXB0aW9uTGVuZ3RoIChpdGVtKSB7XG4gICAgbGV0IGNvdW50ID0gMFxuICAgIGlmIChpdGVtLmRlc2NyaXB0aW9uICE9IG51bGwpIHtcbiAgICAgIGNvdW50ICs9IGl0ZW0uZGVzY3JpcHRpb24ubGVuZ3RoXG4gICAgfVxuICAgIGlmIChpdGVtLmRlc2NyaXB0aW9uTW9yZVVSTCAhPSBudWxsKSB7XG4gICAgICBjb3VudCArPSA2XG4gICAgfVxuICAgIHJldHVybiBjb3VudFxuICB9XG5cbiAgcmVuZGVyU2VsZWN0ZWRJdGVtICgpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZExpICYmIHRoaXMuc2VsZWN0ZWRMaS5jbGFzc0xpc3QpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRMaS5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpXG4gICAgfVxuXG4gICAgdGhpcy5zZWxlY3RlZExpID0gdGhpcy5vbC5jaGlsZE5vZGVzW3RoaXMuc2VsZWN0ZWRJbmRleF1cbiAgICBpZiAodGhpcy5zZWxlY3RlZExpICE9IG51bGwpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRMaS5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpXG4gICAgICB0aGlzLnNjcm9sbFNlbGVjdGVkSXRlbUludG9WaWV3KClcbiAgICAgIHJldHVybiB0aGlzLnVwZGF0ZURlc2NyaXB0aW9uKClcbiAgICB9XG4gIH1cblxuICAvLyBUaGlzIGlzIHJlYWRpbmcgdGhlIERPTSBpbiB0aGUgdXBkYXRlRE9NIGN5Y2xlLiBJZiB3ZSBkb250LCB0aGVyZSBpcyBhIGZsaWNrZXIgOi9cbiAgc2Nyb2xsU2VsZWN0ZWRJdGVtSW50b1ZpZXcgKCkge1xuICAgIGNvbnN0IHsgc2Nyb2xsVG9wIH0gPSB0aGlzLnNjcm9sbGVyXG4gICAgY29uc3Qgc2VsZWN0ZWRJdGVtVG9wID0gdGhpcy5zZWxlY3RlZExpLm9mZnNldFRvcFxuICAgIGlmIChzZWxlY3RlZEl0ZW1Ub3AgPCBzY3JvbGxUb3ApIHtcbiAgICAgIC8vIHNjcm9sbCB1cFxuICAgICAgdGhpcy5zY3JvbGxlci5zY3JvbGxUb3AgPSBzZWxlY3RlZEl0ZW1Ub3BcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgaXRlbUhlaWdodCB9ID0gdGhpcy51aVByb3BzXG4gICAgY29uc3Qgc2Nyb2xsZXJIZWlnaHQgPSAodGhpcy5tYXhWaXNpYmxlU3VnZ2VzdGlvbnMgKiBpdGVtSGVpZ2h0KSArIHRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0XG4gICAgaWYgKHNlbGVjdGVkSXRlbVRvcCArIGl0ZW1IZWlnaHQgPiBzY3JvbGxUb3AgKyBzY3JvbGxlckhlaWdodCkge1xuICAgICAgLy8gc2Nyb2xsIGRvd25cbiAgICAgIHRoaXMuc2Nyb2xsZXIuc2Nyb2xsVG9wID0gKHNlbGVjdGVkSXRlbVRvcCAtIHNjcm9sbGVySGVpZ2h0KSArIGl0ZW1IZWlnaHRcbiAgICB9XG4gIH1cblxuICByZWFkVUlQcm9wc0Zyb21ET00gKCkge1xuICAgIGxldCB3b3JkQ29udGFpbmVyXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRMaSkge1xuICAgICAgd29yZENvbnRhaW5lciA9IHRoaXMuc2VsZWN0ZWRMaS5xdWVyeVNlbGVjdG9yKCcud29yZC1jb250YWluZXInKVxuICAgIH1cblxuICAgIGlmICghdGhpcy51aVByb3BzKSB7IHRoaXMudWlQcm9wcyA9IHt9IH1cbiAgICB0aGlzLnVpUHJvcHMud2lkdGggPSB0aGlzLm9mZnNldFdpZHRoICsgMVxuICAgIHRoaXMudWlQcm9wcy5tYXJnaW5MZWZ0ID0gMFxuICAgIGlmICh3b3JkQ29udGFpbmVyICYmIHdvcmRDb250YWluZXIub2Zmc2V0TGVmdCkge1xuICAgICAgdGhpcy51aVByb3BzLm1hcmdpbkxlZnQgPSAtd29yZENvbnRhaW5lci5vZmZzZXRMZWZ0XG4gICAgfVxuICAgIGlmICghdGhpcy51aVByb3BzLml0ZW1IZWlnaHQpIHtcbiAgICAgIHRoaXMudWlQcm9wcy5pdGVtSGVpZ2h0ID0gdGhpcy5zZWxlY3RlZExpLm9mZnNldEhlaWdodFxuICAgIH1cbiAgICBpZiAoIXRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0KSB7XG4gICAgICB0aGlzLnVpUHJvcHMucGFkZGluZ0hlaWdodCA9IHBhcnNlSW50KGdldENvbXB1dGVkU3R5bGUodGhpcylbJ3BhZGRpbmctdG9wJ10pICsgcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzKVsncGFkZGluZy1ib3R0b20nXSlcbiAgICAgIGlmICghdGhpcy51aVByb3BzLnBhZGRpbmdIZWlnaHQpIHtcbiAgICAgICAgdGhpcy51aVByb3BzLnBhZGRpbmdIZWlnaHQgPSAwXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIFVJIGR1cmluZyB0aGlzIHJlYWQsIHNvIHRoYXQgd2hlbiBwb2xsaW5nIHRoZSBkb2N1bWVudCB0aGUgbGF0ZXN0XG4gICAgLy8gY2hhbmdlcyBjYW4gYmUgcGlja2VkIHVwLlxuICAgIHJldHVybiB0aGlzLnVwZGF0ZVVJRm9yQ2hhbmdlZFByb3BzKClcbiAgfVxuXG4gIHVwZGF0ZVVJRm9yQ2hhbmdlZFByb3BzICgpIHtcbiAgICB0aGlzLnNjcm9sbGVyLnN0eWxlWydtYXgtaGVpZ2h0J10gPSBgJHsodGhpcy5tYXhWaXNpYmxlU3VnZ2VzdGlvbnMgKiB0aGlzLnVpUHJvcHMuaXRlbUhlaWdodCkgKyB0aGlzLnVpUHJvcHMucGFkZGluZ0hlaWdodH1weGBcbiAgICB0aGlzLnN0eWxlLndpZHRoID0gYCR7dGhpcy51aVByb3BzLndpZHRofXB4YFxuICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25MaXN0Rm9sbG93cyA9PT0gJ1dvcmQnKSB7XG4gICAgICB0aGlzLnN0eWxlWydtYXJnaW4tbGVmdCddID0gYCR7dGhpcy51aVByb3BzLm1hcmdpbkxlZnR9cHhgXG4gICAgfVxuICAgIHJldHVybiB0aGlzLnVwZGF0ZURlc2NyaXB0aW9uKClcbiAgfVxuXG4gIC8vIFNwbGl0cyB0aGUgY2xhc3NlcyBvbiBzcGFjZXMgc28gYXMgbm90IHRvIGFuZ2VyIHRoZSBET00gZ29kc1xuICBhZGRDbGFzc1RvRWxlbWVudCAoZWxlbWVudCwgY2xhc3NOYW1lcykge1xuICAgIGlmICghY2xhc3NOYW1lcykgeyByZXR1cm4gfVxuICAgIGNvbnN0IGNsYXNzZXMgPSBjbGFzc05hbWVzLnNwbGl0KCcgJylcbiAgICBpZiAoY2xhc3Nlcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBjbGFzc05hbWUgPSBjbGFzc2VzW2ldXG4gICAgICAgIGNsYXNzTmFtZSA9IGNsYXNzTmFtZS50cmltKClcbiAgICAgICAgaWYgKGNsYXNzTmFtZSkgeyBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKSB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVuZGVySXRlbSAoe2ljb25IVE1MLCB0eXBlLCBzbmlwcGV0LCB0ZXh0LCBkaXNwbGF5VGV4dCwgY2xhc3NOYW1lLCByZXBsYWNlbWVudFByZWZpeCwgbGVmdExhYmVsLCBsZWZ0TGFiZWxIVE1MLCByaWdodExhYmVsLCByaWdodExhYmVsSFRNTH0sIGluZGV4KSB7XG4gICAgbGV0IGxpID0gdGhpcy5vbC5jaGlsZE5vZGVzW2luZGV4XVxuICAgIGlmICghbGkpIHtcbiAgICAgIGlmICh0aGlzLm5vZGVwb29sICYmIHRoaXMubm9kZVBvb2wubGVuZ3RoID4gMCkge1xuICAgICAgICBsaSA9IHRoaXMubm9kZVBvb2wucG9wKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKVxuICAgICAgICBsaS5pbm5lckhUTUwgPSBJdGVtVGVtcGxhdGVcbiAgICAgIH1cbiAgICAgIGxpLmRhdGFzZXQuaW5kZXggPSBpbmRleFxuICAgICAgdGhpcy5vbC5hcHBlbmRDaGlsZChsaSlcbiAgICB9XG5cbiAgICBsaS5jbGFzc05hbWUgPSAnJ1xuICAgIGlmIChpbmRleCA9PT0gdGhpcy5zZWxlY3RlZEluZGV4KSB7IGxpLmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJykgfVxuICAgIGlmIChjbGFzc05hbWUpIHsgdGhpcy5hZGRDbGFzc1RvRWxlbWVudChsaSwgY2xhc3NOYW1lKSB9XG4gICAgaWYgKGluZGV4ID09PSB0aGlzLnNlbGVjdGVkSW5kZXgpIHsgdGhpcy5zZWxlY3RlZExpID0gbGkgfVxuXG4gICAgY29uc3QgdHlwZUljb25Db250YWluZXIgPSBsaS5xdWVyeVNlbGVjdG9yKCcuaWNvbi1jb250YWluZXInKVxuICAgIHR5cGVJY29uQ29udGFpbmVyLmlubmVySFRNTCA9ICcnXG5cbiAgICBjb25zdCBzYW5pdGl6ZWRUeXBlID0gZXNjYXBlSHRtbChpc1N0cmluZyh0eXBlKSA/IHR5cGUgOiAnJylcbiAgICBjb25zdCBzYW5pdGl6ZWRJY29uSFRNTCA9IGlzU3RyaW5nKGljb25IVE1MKSA/IGljb25IVE1MIDogdW5kZWZpbmVkXG4gICAgY29uc3QgZGVmYXVsdExldHRlckljb25IVE1MID0gc2FuaXRpemVkVHlwZSA/IGA8c3BhbiBjbGFzcz1cImljb24tbGV0dGVyXCI+JHtzYW5pdGl6ZWRUeXBlWzBdfTwvc3Bhbj5gIDogJydcbiAgICBjb25zdCBkZWZhdWx0SWNvbkhUTUwgPSBEZWZhdWx0U3VnZ2VzdGlvblR5cGVJY29uSFRNTFtzYW5pdGl6ZWRUeXBlXSAhPSBudWxsID8gRGVmYXVsdFN1Z2dlc3Rpb25UeXBlSWNvbkhUTUxbc2FuaXRpemVkVHlwZV0gOiBkZWZhdWx0TGV0dGVySWNvbkhUTUxcbiAgICBpZiAoKHNhbml0aXplZEljb25IVE1MIHx8IGRlZmF1bHRJY29uSFRNTCkgJiYgaWNvbkhUTUwgIT09IGZhbHNlKSB7XG4gICAgICB0eXBlSWNvbkNvbnRhaW5lci5pbm5lckhUTUwgPSBJY29uVGVtcGxhdGVcbiAgICAgIGNvbnN0IHR5cGVJY29uID0gdHlwZUljb25Db250YWluZXIuY2hpbGROb2Rlc1swXVxuICAgICAgdHlwZUljb24uaW5uZXJIVE1MID0gc2FuaXRpemVkSWNvbkhUTUwgIT0gbnVsbCA/IHNhbml0aXplZEljb25IVE1MIDogZGVmYXVsdEljb25IVE1MXG4gICAgICBpZiAodHlwZSkgeyB0aGlzLmFkZENsYXNzVG9FbGVtZW50KHR5cGVJY29uLCB0eXBlKSB9XG4gICAgfVxuXG4gICAgY29uc3Qgd29yZFNwYW4gPSBsaS5xdWVyeVNlbGVjdG9yKCcud29yZCcpXG4gICAgd29yZFNwYW4uaW5uZXJIVE1MID0gdGhpcy5nZXREaXNwbGF5SFRNTCh0ZXh0LCBzbmlwcGV0LCBkaXNwbGF5VGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpXG5cbiAgICBjb25zdCBsZWZ0TGFiZWxTcGFuID0gbGkucXVlcnlTZWxlY3RvcignLmxlZnQtbGFiZWwnKVxuICAgIGlmIChsZWZ0TGFiZWxIVE1MICE9IG51bGwpIHtcbiAgICAgIGxlZnRMYWJlbFNwYW4uaW5uZXJIVE1MID0gbGVmdExhYmVsSFRNTFxuICAgIH0gZWxzZSBpZiAobGVmdExhYmVsICE9IG51bGwpIHtcbiAgICAgIGxlZnRMYWJlbFNwYW4udGV4dENvbnRlbnQgPSBsZWZ0TGFiZWxcbiAgICB9IGVsc2Uge1xuICAgICAgbGVmdExhYmVsU3Bhbi50ZXh0Q29udGVudCA9ICcnXG4gICAgfVxuXG4gICAgY29uc3QgcmlnaHRMYWJlbFNwYW4gPSBsaS5xdWVyeVNlbGVjdG9yKCcucmlnaHQtbGFiZWwnKVxuICAgIGlmIChyaWdodExhYmVsSFRNTCAhPSBudWxsKSB7XG4gICAgICByaWdodExhYmVsU3Bhbi5pbm5lckhUTUwgPSByaWdodExhYmVsSFRNTFxuICAgIH0gZWxzZSBpZiAocmlnaHRMYWJlbCAhPSBudWxsKSB7XG4gICAgICByaWdodExhYmVsU3Bhbi50ZXh0Q29udGVudCA9IHJpZ2h0TGFiZWxcbiAgICB9IGVsc2Uge1xuICAgICAgcmlnaHRMYWJlbFNwYW4udGV4dENvbnRlbnQgPSAnJ1xuICAgIH1cbiAgfVxuXG4gIGdldERpc3BsYXlIVE1MICh0ZXh0LCBzbmlwcGV0LCBkaXNwbGF5VGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpIHtcbiAgICBsZXQgcmVwbGFjZW1lbnRUZXh0ID0gdGV4dFxuICAgIGxldCBzbmlwcGV0SW5kaWNlc1xuICAgIGlmICh0eXBlb2YgZGlzcGxheVRleHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXBsYWNlbWVudFRleHQgPSBkaXNwbGF5VGV4dFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNuaXBwZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXBsYWNlbWVudFRleHQgPSB0aGlzLnJlbW92ZUVtcHR5U25pcHBldHMoc25pcHBldClcbiAgICAgIGNvbnN0IHNuaXBwZXRzID0gdGhpcy5zbmlwcGV0UGFyc2VyLmZpbmRTbmlwcGV0cyhyZXBsYWNlbWVudFRleHQpXG4gICAgICByZXBsYWNlbWVudFRleHQgPSB0aGlzLnJlbW92ZVNuaXBwZXRzRnJvbVRleHQoc25pcHBldHMsIHJlcGxhY2VtZW50VGV4dClcbiAgICAgIHNuaXBwZXRJbmRpY2VzID0gdGhpcy5maW5kU25pcHBldEluZGljZXMoc25pcHBldHMpXG4gICAgfVxuICAgIGNvbnN0IGNoYXJhY3Rlck1hdGNoSW5kaWNlcyA9IHRoaXMuZmluZENoYXJhY3Rlck1hdGNoSW5kaWNlcyhyZXBsYWNlbWVudFRleHQsIHJlcGxhY2VtZW50UHJlZml4KVxuXG4gICAgbGV0IGRpc3BsYXlIVE1MID0gJydcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcmVwbGFjZW1lbnRUZXh0Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKHNuaXBwZXRJbmRpY2VzICYmIChzbmlwcGV0SW5kaWNlc1tpbmRleF0gPT09IFNuaXBwZXRTdGFydCB8fCBzbmlwcGV0SW5kaWNlc1tpbmRleF0gPT09IFNuaXBwZXRTdGFydEFuZEVuZCkpIHtcbiAgICAgICAgZGlzcGxheUhUTUwgKz0gJzxzcGFuIGNsYXNzPVwic25pcHBldC1jb21wbGV0aW9uXCI+J1xuICAgICAgfVxuICAgICAgaWYgKGNoYXJhY3Rlck1hdGNoSW5kaWNlcyAmJiBjaGFyYWN0ZXJNYXRjaEluZGljZXNbaW5kZXhdKSB7XG4gICAgICAgIGRpc3BsYXlIVE1MICs9IGA8c3BhbiBjbGFzcz1cImNoYXJhY3Rlci1tYXRjaFwiPiR7ZXNjYXBlSHRtbChyZXBsYWNlbWVudFRleHRbaW5kZXhdKX08L3NwYW4+YFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGlzcGxheUhUTUwgKz0gZXNjYXBlSHRtbChyZXBsYWNlbWVudFRleHRbaW5kZXhdKVxuICAgICAgfVxuICAgICAgaWYgKHNuaXBwZXRJbmRpY2VzICYmIChzbmlwcGV0SW5kaWNlc1tpbmRleF0gPT09IFNuaXBwZXRFbmQgfHwgc25pcHBldEluZGljZXNbaW5kZXhdID09PSBTbmlwcGV0U3RhcnRBbmRFbmQpKSB7XG4gICAgICAgIGRpc3BsYXlIVE1MICs9ICc8L3NwYW4+J1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGlzcGxheUhUTUxcbiAgfVxuXG4gIHJlbW92ZUVtcHR5U25pcHBldHMgKHRleHQpIHtcbiAgICBpZiAoIXRleHQgfHwgIXRleHQubGVuZ3RoIHx8IHRleHQuaW5kZXhPZignJCcpID09PSAtMSkgeyByZXR1cm4gdGV4dCB9IC8vIE5vIHNuaXBwZXRzXG4gICAgcmV0dXJuIHRleHQucmVwbGFjZSh0aGlzLmVtcHR5U25pcHBldEdyb3VwUmVnZXgsICcnKSAvLyBSZW1vdmUgYWxsIG9jY3VycmVuY2VzIG9mICQwIG9yICR7MH0gb3IgJHswOn1cbiAgfVxuXG4gIC8vIFdpbGwgY29udmVydCAnYWJjKCR7MTpkfSwgJHsyOmV9KWYnID0+ICdhYmMoZCwgZSlmJ1xuICAvL1xuICAvLyAqIGBzbmlwcGV0c2Age0FycmF5fSBmcm9tIGBTbmlwcGV0UGFyc2VyLmZpbmRTbmlwcGV0c2BcbiAgLy8gKiBgdGV4dGAge1N0cmluZ30gdG8gcmVtb3ZlIHNuaXBwZXRzIGZyb21cbiAgLy9cbiAgLy8gUmV0dXJucyB7U3RyaW5nfVxuICByZW1vdmVTbmlwcGV0c0Zyb21UZXh0IChzbmlwcGV0cywgdGV4dCkge1xuICAgIGlmICghdGV4dCB8fCAhdGV4dC5sZW5ndGggfHwgIXNuaXBwZXRzIHx8ICFzbmlwcGV0cy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0ZXh0XG4gICAgfVxuICAgIGxldCBpbmRleCA9IDBcbiAgICBsZXQgcmVzdWx0ID0gJydcbiAgICBmb3IgKGNvbnN0IHtzbmlwcGV0U3RhcnQsIHNuaXBwZXRFbmQsIGJvZHl9IG9mIHNuaXBwZXRzKSB7XG4gICAgICByZXN1bHQgKz0gdGV4dC5zbGljZShpbmRleCwgc25pcHBldFN0YXJ0KSArIGJvZHlcbiAgICAgIGluZGV4ID0gc25pcHBldEVuZCArIDFcbiAgICB9XG4gICAgaWYgKGluZGV4ICE9PSB0ZXh0Lmxlbmd0aCkge1xuICAgICAgcmVzdWx0ICs9IHRleHQuc2xpY2UoaW5kZXgsIHRleHQubGVuZ3RoKVxuICAgIH1cbiAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZSh0aGlzLnNsYXNoZXNJblNuaXBwZXRSZWdleCwgJ1xcXFwnKVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8vIENvbXB1dGVzIHRoZSBpbmRpY2VzIG9mIHNuaXBwZXRzIGluIHRoZSByZXN1bHRpbmcgc3RyaW5nIGZyb21cbiAgLy8gYHJlbW92ZVNuaXBwZXRzRnJvbVRleHRgLlxuICAvL1xuICAvLyAqIGBzbmlwcGV0c2Age0FycmF5fSBmcm9tIGBTbmlwcGV0UGFyc2VyLmZpbmRTbmlwcGV0c2BcbiAgLy9cbiAgLy8gZS5nLiBBIHJlcGxhY2VtZW50IG9mICdhYmMoJHsxOmR9KWUnIGlzIHJlcGxhY2VkIHRvICdhYmMoZCllJyB3aWxsIHJlc3VsdCBpblxuICAvL1xuICAvLyBgezQ6IFNuaXBwZXRTdGFydEFuZEVuZH1gXG4gIC8vXG4gIC8vIFJldHVybnMge09iamVjdH0gb2Yge2luZGV4OiBTbmlwcGV0U3RhcnR8RW5kfFN0YXJ0QW5kRW5kfVxuICBmaW5kU25pcHBldEluZGljZXMgKHNuaXBwZXRzKSB7XG4gICAgaWYgKCFzbmlwcGV0cykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGluZGljZXMgPSB7fVxuICAgIGxldCBvZmZzZXRBY2N1bXVsYXRvciA9IDBcbiAgICBmb3IgKGNvbnN0IHtzbmlwcGV0U3RhcnQsIHNuaXBwZXRFbmQsIGJvZHl9IG9mIHNuaXBwZXRzKSB7XG4gICAgICBjb25zdCBib2R5TGVuZ3RoID0gYm9keS5sZW5ndGhcbiAgICAgIGNvbnN0IHNuaXBwZXRMZW5ndGggPSAoc25pcHBldEVuZCAtIHNuaXBwZXRTdGFydCkgKyAxXG4gICAgICBjb25zdCBzdGFydEluZGV4ID0gc25pcHBldFN0YXJ0IC0gb2Zmc2V0QWNjdW11bGF0b3JcbiAgICAgIGNvbnN0IGVuZEluZGV4ID0gKHN0YXJ0SW5kZXggKyBib2R5TGVuZ3RoKSAtIDFcbiAgICAgIG9mZnNldEFjY3VtdWxhdG9yICs9IHNuaXBwZXRMZW5ndGggLSBib2R5TGVuZ3RoXG5cbiAgICAgIGlmIChzdGFydEluZGV4ID09PSBlbmRJbmRleCkge1xuICAgICAgICBpbmRpY2VzW3N0YXJ0SW5kZXhdID0gU25pcHBldFN0YXJ0QW5kRW5kXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmRpY2VzW3N0YXJ0SW5kZXhdID0gU25pcHBldFN0YXJ0XG4gICAgICAgIGluZGljZXNbZW5kSW5kZXhdID0gU25pcHBldEVuZFxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpbmRpY2VzXG4gIH1cblxuICAvLyBGaW5kcyB0aGUgaW5kaWNlcyBvZiB0aGUgY2hhcnMgaW4gdGV4dCB0aGF0IGFyZSBtYXRjaGVkIGJ5IHJlcGxhY2VtZW50UHJlZml4XG4gIC8vXG4gIC8vIGUuZy4gdGV4dCA9ICdhYmNkZScsIHJlcGxhY2VtZW50UHJlZml4ID0gJ2FjZCcgV2lsbCByZXN1bHQgaW5cbiAgLy9cbiAgLy8gezA6IHRydWUsIDI6IHRydWUsIDM6IHRydWV9XG4gIC8vXG4gIC8vIFJldHVybnMgYW4ge09iamVjdH1cbiAgZmluZENoYXJhY3Rlck1hdGNoSW5kaWNlcyAodGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpIHtcbiAgICBpZiAoIXRleHQgfHwgIXRleHQubGVuZ3RoIHx8ICFyZXBsYWNlbWVudFByZWZpeCB8fCAhcmVwbGFjZW1lbnRQcmVmaXgubGVuZ3RoKSB7IHJldHVybiB9XG4gICAgY29uc3QgbWF0Y2hlcyA9IHt9XG4gICAgaWYgKHRoaXMudXNlQWx0ZXJuYXRlU2NvcmluZykge1xuICAgICAgY29uc3QgbWF0Y2hJbmRpY2VzID0gZnV6emFsZHJpblBsdXMubWF0Y2godGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpXG4gICAgICBmb3IgKGNvbnN0IGkgb2YgbWF0Y2hJbmRpY2VzKSB7XG4gICAgICAgIG1hdGNoZXNbaV0gPSB0cnVlXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB3b3JkSW5kZXggPSAwXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlcGxhY2VtZW50UHJlZml4Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoID0gcmVwbGFjZW1lbnRQcmVmaXhbaV1cbiAgICAgICAgd2hpbGUgKHdvcmRJbmRleCA8IHRleHQubGVuZ3RoICYmIHRleHRbd29yZEluZGV4XS50b0xvd2VyQ2FzZSgpICE9PSBjaC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgd29yZEluZGV4ICs9IDFcbiAgICAgICAgfVxuICAgICAgICBpZiAod29yZEluZGV4ID49IHRleHQubGVuZ3RoKSB7IGJyZWFrIH1cbiAgICAgICAgbWF0Y2hlc1t3b3JkSW5kZXhdID0gdHJ1ZVxuICAgICAgICB3b3JkSW5kZXggKz0gMVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hlc1xuICB9XG5cbiAgZGlzcG9zZSAoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcbiAgICAgIHRoaXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzKVxuICAgIH1cbiAgfVxufVxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vY29tcG9uZW50L2VzY2FwZS1odG1sL2Jsb2IvbWFzdGVyL2luZGV4LmpzXG5jb25zdCBlc2NhcGVIdG1sID0gKGh0bWwpID0+IHtcbiAgcmV0dXJuIFN0cmluZyhodG1sKVxuICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7Jylcbn1cblxuZXhwb3J0IGRlZmF1bHQgU3VnZ2VzdGlvbkxpc3RFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbi1saXN0Jywge3Byb3RvdHlwZTogU3VnZ2VzdGlvbkxpc3RFbGVtZW50LnByb3RvdHlwZX0pIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY2xhc3MtYXNzaWduXG4iXX0=