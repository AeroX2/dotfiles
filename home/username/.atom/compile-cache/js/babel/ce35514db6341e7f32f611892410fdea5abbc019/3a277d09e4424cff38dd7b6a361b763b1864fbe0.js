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
      //editor.deleteToBeginningOfWord();
      //editor.getLastCursor().moveToEndOfWord();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvc3VnZ2VzdGlvbi1saXN0LWVsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7b0JBRWdELE1BQU07OzZCQUM1QixrQkFBa0I7Ozs7MkJBQ25CLGdCQUFnQjs7OEJBQ2QsaUJBQWlCOzs7O3NCQUN6QixRQUFROzs7O0FBTjNCLFdBQVcsQ0FBQTs7QUFRWCxJQUFNLFlBQVksOExBS2tCLENBQUE7O0FBRXBDLElBQU0sWUFBWSx3UUFNVCxDQUFBOztBQUVULElBQU0sWUFBWSxHQUFHLHNCQUFzQixDQUFBOztBQUUzQyxJQUFNLDZCQUE2QixHQUFHO0FBQ3BDLFdBQVMsRUFBRSxpQ0FBaUM7QUFDNUMsVUFBUSxFQUFFLDhCQUE4QjtBQUN4QyxXQUFTLEVBQUUsOEJBQThCO0FBQ3pDLFVBQVEsRUFBRSw4QkFBOEI7QUFDeEMsV0FBUyxFQUFFLDhCQUE4QjtBQUN6QyxPQUFLLEVBQUUsMkJBQTJCO0FBQ2xDLGFBQVcsRUFBRSwwQkFBMEI7Q0FDeEMsQ0FBQTs7QUFFRCxJQUFNLFlBQVksR0FBRyxDQUFDLENBQUE7QUFDdEIsSUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFBO0FBQ3BCLElBQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFBOztJQUV0QixxQkFBcUI7WUFBckIscUJBQXFCOztXQUFyQixxQkFBcUI7MEJBQXJCLHFCQUFxQjs7K0JBQXJCLHFCQUFxQjs7Ozs7ZUFBckIscUJBQXFCOztXQUNULDJCQUFHO0FBQ2pCLFVBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFBO0FBQ25CLFVBQUksQ0FBQyxzQkFBc0IsR0FBRyxvQ0FBb0MsQ0FBQTtBQUNsRSxVQUFJLENBQUMscUJBQXFCLEdBQUcsT0FBTyxDQUFBO0FBQ3BDLFVBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLFVBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7QUFDOUMsVUFB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QkFBcUIsQ0FBQyxTQUFTLEVBQUMsQ0FBQyIsImZpbGUiOiIvaG9tZS9qYW1lcy9naXRodWIvYXV0b2NvbXBsZXRlLXBsdXMvbGliL3N1Z2dlc3Rpb24tbGlzdC1lbGVtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuaW1wb3J0IHsgRGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgU25pcHBldFBhcnNlciBmcm9tICcuL3NuaXBwZXQtcGFyc2VyJ1xuaW1wb3J0IHsgaXNTdHJpbmcgfSBmcm9tICcuL3R5cGUtaGVscGVycydcbmltcG9ydCBmdXp6YWxkcmluUGx1cyBmcm9tICdmdXp6YWxkcmluLXBsdXMnXG5pbXBvcnQgbWFya2VkIGZyb20gJ21hcmtlZCdcblxuY29uc3QgSXRlbVRlbXBsYXRlID0gYDxzcGFuIGNsYXNzPVwiaWNvbi1jb250YWluZXJcIj48L3NwYW4+XG4gIDxzcGFuIGNsYXNzPVwibGVmdC1sYWJlbFwiPjwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJ3b3JkLWNvbnRhaW5lclwiPlxuICAgIDxzcGFuIGNsYXNzPVwid29yZFwiPjwvc3Bhbj5cbiAgPC9zcGFuPlxuICA8c3BhbiBjbGFzcz1cInJpZ2h0LWxhYmVsXCI+PC9zcGFuPmBcblxuY29uc3QgTGlzdFRlbXBsYXRlID0gYDxkaXYgY2xhc3M9XCJzdWdnZXN0aW9uLWxpc3Qtc2Nyb2xsZXJcIj5cbiAgICA8b2wgY2xhc3M9XCJsaXN0LWdyb3VwXCI+PC9vbD5cbiAgPC9kaXY+XG4gIDxkaXYgY2xhc3M9XCJzdWdnZXN0aW9uLWRlc2NyaXB0aW9uXCI+XG4gICAgPHNwYW4gY2xhc3M9XCJzdWdnZXN0aW9uLWRlc2NyaXB0aW9uLWNvbnRlbnRcIj48L3NwYW4+XG4gICAgPGEgY2xhc3M9XCJzdWdnZXN0aW9uLWRlc2NyaXB0aW9uLW1vcmUtbGlua1wiIGhyZWY9XCIjXCI+TW9yZS4uPC9hPlxuICA8L2Rpdj5gXG5cbmNvbnN0IEljb25UZW1wbGF0ZSA9ICc8aSBjbGFzcz1cImljb25cIj48L2k+J1xuXG5jb25zdCBEZWZhdWx0U3VnZ2VzdGlvblR5cGVJY29uSFRNTCA9IHtcbiAgJ3NuaXBwZXQnOiAnPGkgY2xhc3M9XCJpY29uLW1vdmUtcmlnaHRcIj48L2k+JyxcbiAgJ2ltcG9ydCc6ICc8aSBjbGFzcz1cImljb24tcGFja2FnZVwiPjwvaT4nLFxuICAncmVxdWlyZSc6ICc8aSBjbGFzcz1cImljb24tcGFja2FnZVwiPjwvaT4nLFxuICAnbW9kdWxlJzogJzxpIGNsYXNzPVwiaWNvbi1wYWNrYWdlXCI+PC9pPicsXG4gICdwYWNrYWdlJzogJzxpIGNsYXNzPVwiaWNvbi1wYWNrYWdlXCI+PC9pPicsXG4gICd0YWcnOiAnPGkgY2xhc3M9XCJpY29uLWNvZGVcIj48L2k+JyxcbiAgJ2F0dHJpYnV0ZSc6ICc8aSBjbGFzcz1cImljb24tdGFnXCI+PC9pPidcbn1cblxuY29uc3QgU25pcHBldFN0YXJ0ID0gMVxuY29uc3QgU25pcHBldEVuZCA9IDJcbmNvbnN0IFNuaXBwZXRTdGFydEFuZEVuZCA9IDNcblxuY2xhc3MgU3VnZ2VzdGlvbkxpc3RFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBjcmVhdGVkQ2FsbGJhY2sgKCkge1xuICAgIHRoaXMubWF4SXRlbXMgPSAyMDBcbiAgICB0aGlzLmVtcHR5U25pcHBldEdyb3VwUmVnZXggPSAvKFxcJFxce1xcZCs6XFx9KXwoXFwkXFx7XFxkK1xcfSl8KFxcJFxcZCspL2lnXG4gICAgdGhpcy5zbGFzaGVzSW5TbmlwcGV0UmVnZXggPSAvXFxcXFxcXFwvZ1xuICAgIHRoaXMubm9kZVBvb2wgPSBudWxsXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIHRoaXMuY2xhc3NMaXN0LmFkZCgncG9wb3Zlci1saXN0JywgJ3NlbGVjdC1saXN0JywgJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLWxpc3QnKVxuICAgIHRoaXMucmVnaXN0ZXJNb3VzZUhhbmRsaW5nKClcbiAgICB0aGlzLnNuaXBwZXRQYXJzZXIgPSBuZXcgU25pcHBldFBhcnNlcigpXG4gICAgdGhpcy5ub2RlUG9vbCA9IFtdXG4gIH1cblxuICBhdHRhY2hlZENhbGxiYWNrICgpIHtcbiAgICAvLyBUT0RPOiBGaXggb3ZlcmxheSBkZWNvcmF0b3IgdG8gaW4gYXRvbSB0byBhcHBseSBjbGFzcyBhdHRyaWJ1dGUgY29ycmVjdGx5LCB0aGVuIG1vdmUgdGhpcyB0byBvdmVybGF5IGNyZWF0aW9uIHBvaW50LlxuICAgIHRoaXMucGFyZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdhdXRvY29tcGxldGUtcGx1cycpXG4gICAgdGhpcy5hZGRBY3RpdmVDbGFzc1RvRWRpdG9yKClcbiAgICBpZiAoIXRoaXMub2wpIHsgdGhpcy5yZW5kZXJMaXN0KCkgfVxuICAgIHJldHVybiB0aGlzLml0ZW1zQ2hhbmdlZCgpXG4gIH1cblxuICBkZXRhY2hlZENhbGxiYWNrICgpIHtcbiAgICBpZiAodGhpcy5hY3RpdmVDbGFzc0Rpc3Bvc2FibGUgJiYgdGhpcy5hY3RpdmVDbGFzc0Rpc3Bvc2FibGUuZGlzcG9zZSkge1xuICAgICAgdGhpcy5hY3RpdmVDbGFzc0Rpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgfVxuICB9XG5cbiAgaW5pdGlhbGl6ZSAobW9kZWwpIHtcbiAgICB0aGlzLm1vZGVsID0gbW9kZWxcbiAgICBpZiAodGhpcy5tb2RlbCA9PSBudWxsKSB7IHJldHVybiB9XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkQ2hhbmdlSXRlbXModGhpcy5pdGVtc0NoYW5nZWQuYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkU2VsZWN0TmV4dCh0aGlzLm1vdmVTZWxlY3Rpb25Eb3duLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZFNlbGVjdFByZXZpb3VzKHRoaXMubW92ZVNlbGVjdGlvblVwLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZFNlbGVjdFBhZ2VVcCh0aGlzLm1vdmVTZWxlY3Rpb25QYWdlVXAuYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkU2VsZWN0UGFnZURvd24odGhpcy5tb3ZlU2VsZWN0aW9uUGFnZURvd24uYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkU2VsZWN0VG9wKHRoaXMubW92ZVNlbGVjdGlvblRvVG9wLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZFNlbGVjdEJvdHRvbSh0aGlzLm1vdmVTZWxlY3Rpb25Ub0JvdHRvbS5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRDb25maXJtU2VsZWN0aW9uKHRoaXMuY29uZmlybVNlbGVjdGlvbi5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRjb25maXJtU2VsZWN0aW9uSWZOb25EZWZhdWx0KHRoaXMuY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdC5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWREaXNwb3NlKHRoaXMuZGlzcG9zZS5iaW5kKHRoaXMpKSlcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuc3VnZ2VzdGlvbkxpc3RGb2xsb3dzJywgc3VnZ2VzdGlvbkxpc3RGb2xsb3dzID0+IHtcbiAgICAgIHRoaXMuc3VnZ2VzdGlvbkxpc3RGb2xsb3dzID0gc3VnZ2VzdGlvbkxpc3RGb2xsb3dzXG4gICAgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5tYXhWaXNpYmxlU3VnZ2VzdGlvbnMnLCBtYXhWaXNpYmxlU3VnZ2VzdGlvbnMgPT4ge1xuICAgICAgdGhpcy5tYXhWaXNpYmxlU3VnZ2VzdGlvbnMgPSBtYXhWaXNpYmxlU3VnZ2VzdGlvbnNcbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLnVzZUFsdGVybmF0ZVNjb3JpbmcnLCB1c2VBbHRlcm5hdGVTY29yaW5nID0+IHtcbiAgICAgIHRoaXMudXNlQWx0ZXJuYXRlU2NvcmluZyA9IHVzZUFsdGVybmF0ZVNjb3JpbmdcbiAgICB9KSlcblx0dGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmtleW1hcHMub25EaWRGYWlsVG9NYXRjaEJpbmRpbmcoa2V5c3Ryb2tlcyA9PiB7XG5cdFx0aWYgKHRoaXMuc2VsZWN0ZWRJbmRleCA9PT0gMClcblx0XHRcdHRoaXMuY29uZmlybVNlbGVjdGlvbihrZXlzdHJva2VzKVxuXHR9KSlcblx0XHRcdFxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyBUaGlzIHNob3VsZCBiZSB1bm5lY2Vzc2FyeSBidXQgdGhlIGV2ZW50cyB3ZSBuZWVkIHRvIG92ZXJyaWRlXG4gIC8vIGFyZSBoYW5kbGVkIGF0IGEgbGV2ZWwgdGhhdCBjYW4ndCBiZSBibG9ja2VkIGJ5IHJlYWN0IHN5bnRoZXRpY1xuICAvLyBldmVudHMgYmVjYXVzZSB0aGV5IGFyZSBoYW5kbGVkIGF0IHRoZSBkb2N1bWVudFxuICByZWdpc3Rlck1vdXNlSGFuZGxpbmcgKCkge1xuICAgIHRoaXMub25tb3VzZXdoZWVsID0gZXZlbnQgPT4gZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICB0aGlzLm9ubW91c2Vkb3duID0gKGV2ZW50KSA9PiB7XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5maW5kSXRlbShldmVudClcbiAgICAgIGlmIChpdGVtICYmIGl0ZW0uZGF0YXNldCAmJiBpdGVtLmRhdGFzZXQuaW5kZXgpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gaXRlbS5kYXRhc2V0LmluZGV4XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vbm1vdXNldXAgPSAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmZpbmRJdGVtKGV2ZW50KVxuICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5kYXRhc2V0ICYmIGl0ZW0uZGF0YXNldC5pbmRleCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgICB0aGlzLmNvbmZpcm1TZWxlY3Rpb24oKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZpbmRJdGVtIChldmVudCkge1xuICAgIGxldCBpdGVtID0gZXZlbnQudGFyZ2V0XG4gICAgd2hpbGUgKGl0ZW0udGFnTmFtZSAhPT0gJ0xJJyAmJiBpdGVtICE9PSB0aGlzKSB7IGl0ZW0gPSBpdGVtLnBhcmVudE5vZGUgfVxuICAgIGlmIChpdGVtLnRhZ05hbWUgPT09ICdMSScpIHsgcmV0dXJuIGl0ZW0gfVxuICB9XG5cbiAgdXBkYXRlRGVzY3JpcHRpb24gKGl0ZW0pIHtcbiAgICBpZiAoIWl0ZW0pIHtcbiAgICAgIGlmICh0aGlzLm1vZGVsICYmIHRoaXMubW9kZWwuaXRlbXMpIHtcbiAgICAgICAgaXRlbSA9IHRoaXMubW9kZWwuaXRlbXNbdGhpcy5zZWxlY3RlZEluZGV4XVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWl0ZW0pIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChpdGVtLmRlc2NyaXB0aW9uTWFya2Rvd24gJiYgaXRlbS5kZXNjcmlwdGlvbk1hcmtkb3duLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Db250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Db250ZW50LmlubmVySFRNTCA9IG1hcmtlZC5wYXJzZShpdGVtLmRlc2NyaXB0aW9uTWFya2Rvd24sIHtzYW5pdGl6ZTogdHJ1ZX0pXG4gICAgICB0aGlzLnNldERlc2NyaXB0aW9uTW9yZUxpbmsoaXRlbSlcbiAgICB9IGVsc2UgaWYgKGl0ZW0uZGVzY3JpcHRpb24gJiYgaXRlbS5kZXNjcmlwdGlvbi5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGVudC50ZXh0Q29udGVudCA9IGl0ZW0uZGVzY3JpcHRpb25cbiAgICAgIHRoaXMuc2V0RGVzY3JpcHRpb25Nb3JlTGluayhpdGVtKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICB9XG4gIH1cblxuICBzZXREZXNjcmlwdGlvbk1vcmVMaW5rIChpdGVtKSB7XG4gICAgaWYgKChpdGVtLmRlc2NyaXB0aW9uTW9yZVVSTCAhPSBudWxsKSAmJiAoaXRlbS5kZXNjcmlwdGlvbk1vcmVVUkwubGVuZ3RoICE9IG51bGwpKSB7XG4gICAgICB0aGlzLmRlc2NyaXB0aW9uTW9yZUxpbmsuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUnXG4gICAgICB0aGlzLmRlc2NyaXB0aW9uTW9yZUxpbmsuc2V0QXR0cmlidXRlKCdocmVmJywgaXRlbS5kZXNjcmlwdGlvbk1vcmVVUkwpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Nb3JlTGluay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgICB0aGlzLmRlc2NyaXB0aW9uTW9yZUxpbmsuc2V0QXR0cmlidXRlKCdocmVmJywgJyMnKVxuICAgIH1cbiAgfVxuXG4gIGl0ZW1zQ2hhbmdlZCAoKSB7XG4gICAgaWYgKHRoaXMubW9kZWwgJiYgdGhpcy5tb2RlbC5pdGVtcyAmJiB0aGlzLm1vZGVsLml0ZW1zLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVuZGVyKClcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucmV0dXJuSXRlbXNUb1Bvb2woMClcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIHRoaXMubm9uRGVmYXVsdEluZGV4ID0gZmFsc2VcbiAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSAwXG4gICAgaWYgKGF0b20udmlld3MucG9sbEFmdGVyTmV4dFVwZGF0ZSkge1xuICAgICAgYXRvbS52aWV3cy5wb2xsQWZ0ZXJOZXh0VXBkYXRlKClcbiAgICB9XG5cbiAgICBhdG9tLnZpZXdzLnVwZGF0ZURvY3VtZW50KHRoaXMucmVuZGVySXRlbXMuYmluZCh0aGlzKSlcbiAgICByZXR1cm4gYXRvbS52aWV3cy5yZWFkRG9jdW1lbnQodGhpcy5yZWFkVUlQcm9wc0Zyb21ET00uYmluZCh0aGlzKSlcbiAgfVxuXG4gIGFkZEFjdGl2ZUNsYXNzVG9FZGl0b3IgKCkge1xuICAgIGxldCBhY3RpdmVFZGl0b3JcbiAgICBpZiAodGhpcy5tb2RlbCkge1xuICAgICAgYWN0aXZlRWRpdG9yID0gdGhpcy5tb2RlbC5hY3RpdmVFZGl0b3JcbiAgICB9XG4gICAgY29uc3QgZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhY3RpdmVFZGl0b3IpXG4gICAgaWYgKGVkaXRvckVsZW1lbnQgJiYgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICAgIGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYXV0b2NvbXBsZXRlLWFjdGl2ZScpXG4gICAgfVxuXG4gICAgdGhpcy5hY3RpdmVDbGFzc0Rpc3Bvc2FibGUgPSBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBpZiAoZWRpdG9yRWxlbWVudCAmJiBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdCkge1xuICAgICAgICBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2F1dG9jb21wbGV0ZS1hY3RpdmUnKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uVXAgKCkge1xuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggPiAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KHRoaXMuc2VsZWN0ZWRJbmRleCAtIDEpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgodGhpcy52aXNpYmxlSXRlbXMoKS5sZW5ndGggLSAxKVxuICAgIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25Eb3duICgpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4IDwgKHRoaXMudmlzaWJsZUl0ZW1zKCkubGVuZ3RoIC0gMSkpIHtcbiAgICAgIHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgodGhpcy5zZWxlY3RlZEluZGV4ICsgMSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleCgwKVxuICAgIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25QYWdlVXAgKCkge1xuICAgIGNvbnN0IG5ld0luZGV4ID0gTWF0aC5tYXgoMCwgdGhpcy5zZWxlY3RlZEluZGV4IC0gdGhpcy5tYXhWaXNpYmxlU3VnZ2VzdGlvbnMpXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRJbmRleCAhPT0gbmV3SW5kZXgpIHsgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleChuZXdJbmRleCkgfVxuICB9XG5cbiAgbW92ZVNlbGVjdGlvblBhZ2VEb3duICgpIHtcbiAgICBjb25zdCBpdGVtc0xlbmd0aCA9IHRoaXMudmlzaWJsZUl0ZW1zKCkubGVuZ3RoXG4gICAgY29uc3QgbmV3SW5kZXggPSBNYXRoLm1pbihpdGVtc0xlbmd0aCAtIDEsIHRoaXMuc2VsZWN0ZWRJbmRleCArIHRoaXMubWF4VmlzaWJsZVN1Z2dlc3Rpb25zKVxuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IG5ld0luZGV4KSB7IHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgobmV3SW5kZXgpIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25Ub1RvcCAoKSB7XG4gICAgY29uc3QgbmV3SW5kZXggPSAwXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRJbmRleCAhPT0gbmV3SW5kZXgpIHsgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleChuZXdJbmRleCkgfVxuICB9XG5cbiAgbW92ZVNlbGVjdGlvblRvQm90dG9tICgpIHtcbiAgICBjb25zdCBuZXdJbmRleCA9IHRoaXMudmlzaWJsZUl0ZW1zKCkubGVuZ3RoIC0gMVxuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IG5ld0luZGV4KSB7IHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgobmV3SW5kZXgpIH1cbiAgfVxuXG4gIHNldFNlbGVjdGVkSW5kZXggKGluZGV4KSB7XG4gICAgdGhpcy5ub25EZWZhdWx0SW5kZXggPSB0cnVlXG4gICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gaW5kZXhcblxuXHR2YXIgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgLy9lZGl0b3IuZGVsZXRlVG9CZWdpbm5pbmdPZldvcmQoKTtcblx0Ly9lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLm1vdmVUb0VuZE9mV29yZCgpO1xuXHR0aGlzLm1vZGVsLnJlcGxhY2UodGhpcy5nZXRTZWxlY3RlZEl0ZW0oKSk7XG5cdGVkaXRvci5nZXRMYXN0Q3Vyc29yKCkubW92ZVRvQmVnaW5uaW5nT2ZXb3JkKCk7XG5cbiAgICByZXR1cm4gYXRvbS52aWV3cy51cGRhdGVEb2N1bWVudCh0aGlzLnJlbmRlclNlbGVjdGVkSXRlbS5iaW5kKHRoaXMpKVxuICB9XG5cbiAgdmlzaWJsZUl0ZW1zICgpIHtcbiAgICBpZiAodGhpcy5tb2RlbCAmJiB0aGlzLm1vZGVsLml0ZW1zKSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5pdGVtcy5zbGljZSgwLCB0aGlzLm1heEl0ZW1zKVxuICAgIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IEdldCB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW1cbiAgLy9cbiAgLy8gUmV0dXJucyB0aGUgc2VsZWN0ZWQge09iamVjdH1cbiAgZ2V0U2VsZWN0ZWRJdGVtICgpIHtcbiAgICBpZiAodGhpcy5tb2RlbCAmJiB0aGlzLm1vZGVsLml0ZW1zKSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5pdGVtc1t0aGlzLnNlbGVjdGVkSW5kZXhdXG4gICAgfVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogQ29uZmlybXMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBpdGVtIG9yIGNhbmNlbHMgdGhlIGxpc3Qgdmlld1xuICAvLyBpZiBubyBpdGVtIGhhcyBiZWVuIHNlbGVjdGVkXG4gIGNvbmZpcm1TZWxlY3Rpb24gKGtleXN0cm9rZSkge1xuICAgIGlmICghdGhpcy5tb2RlbC5pc0FjdGl2ZSgpKSB7IHJldHVybiB9XG4gICAgY29uc3QgaXRlbSA9IHRoaXMuZ2V0U2VsZWN0ZWRJdGVtKClcbiAgICBpZiAoaXRlbSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5jb25maXJtKGl0ZW0sIGtleXN0cm9rZSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMubW9kZWwuY2FuY2VsKClcbiAgICB9XG4gIH1cblxuICAvLyBQcml2YXRlOiBDb25maXJtcyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW0gb25seSBpZiBpdCBpcyBub3QgdGhlIGRlZmF1bHRcbiAgLy8gaXRlbSBvciBjYW5jZWxzIHRoZSB2aWV3IGlmIG5vbmUgaGFzIGJlZW4gc2VsZWN0ZWQuXG4gIGNvbmZpcm1TZWxlY3Rpb25JZk5vbkRlZmF1bHQgKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLm1vZGVsLmlzQWN0aXZlKCkpIHsgcmV0dXJuIH1cbiAgICBpZiAodGhpcy5ub25EZWZhdWx0SW5kZXgpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpcm1TZWxlY3Rpb24oKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1vZGVsLmNhbmNlbCgpXG4gICAgICByZXR1cm4gZXZlbnQuYWJvcnRLZXlCaW5kaW5nKClcbiAgICB9XG4gIH1cblxuICByZW5kZXJMaXN0ICgpIHtcbiAgICB0aGlzLmlubmVySFRNTCA9IExpc3RUZW1wbGF0ZVxuICAgIHRoaXMub2wgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5saXN0LWdyb3VwJylcbiAgICB0aGlzLnNjcm9sbGVyID0gdGhpcy5xdWVyeVNlbGVjdG9yKCcuc3VnZ2VzdGlvbi1saXN0LXNjcm9sbGVyJylcbiAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGFpbmVyID0gdGhpcy5xdWVyeVNlbGVjdG9yKCcuc3VnZ2VzdGlvbi1kZXNjcmlwdGlvbicpXG4gICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRlbnQgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5zdWdnZXN0aW9uLWRlc2NyaXB0aW9uLWNvbnRlbnQnKVxuICAgIHRoaXMuZGVzY3JpcHRpb25Nb3JlTGluayA9IHRoaXMucXVlcnlTZWxlY3RvcignLnN1Z2dlc3Rpb24tZGVzY3JpcHRpb24tbW9yZS1saW5rJylcbiAgfVxuXG4gIHJlbmRlckl0ZW1zICgpIHtcbiAgICBsZXQgbGVmdFxuICAgIHRoaXMuc3R5bGUud2lkdGggPSBudWxsXG4gICAgY29uc3QgaXRlbXMgPSAobGVmdCA9IHRoaXMudmlzaWJsZUl0ZW1zKCkpICE9IG51bGwgPyBsZWZ0IDogW11cbiAgICBsZXQgbG9uZ2VzdERlc2MgPSAwXG4gICAgbGV0IGxvbmdlc3REZXNjSW5kZXggPSBudWxsXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGl0ZW1zLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY29uc3QgaXRlbSA9IGl0ZW1zW2luZGV4XVxuICAgICAgdGhpcy5yZW5kZXJJdGVtKGl0ZW0sIGluZGV4KVxuICAgICAgY29uc3QgZGVzY0xlbmd0aCA9IHRoaXMuZGVzY3JpcHRpb25MZW5ndGgoaXRlbSlcbiAgICAgIGlmIChkZXNjTGVuZ3RoID4gbG9uZ2VzdERlc2MpIHtcbiAgICAgICAgbG9uZ2VzdERlc2MgPSBkZXNjTGVuZ3RoXG4gICAgICAgIGxvbmdlc3REZXNjSW5kZXggPSBpbmRleFxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnVwZGF0ZURlc2NyaXB0aW9uKGl0ZW1zW2xvbmdlc3REZXNjSW5kZXhdKVxuICAgIHJldHVybiB0aGlzLnJldHVybkl0ZW1zVG9Qb29sKGl0ZW1zLmxlbmd0aClcbiAgfVxuXG4gIHJldHVybkl0ZW1zVG9Qb29sIChwaXZvdEluZGV4KSB7XG4gICAgaWYgKCF0aGlzLm9sKSB7IHJldHVybiB9XG5cbiAgICBsZXQgbGkgPSB0aGlzLm9sLmNoaWxkTm9kZXNbcGl2b3RJbmRleF1cbiAgICB3aGlsZSAoKHRoaXMub2wgIT0gbnVsbCkgJiYgbGkpIHtcbiAgICAgIGxpLnJlbW92ZSgpXG4gICAgICB0aGlzLm5vZGVQb29sLnB1c2gobGkpXG4gICAgICBsaSA9IHRoaXMub2wuY2hpbGROb2Rlc1twaXZvdEluZGV4XVxuICAgIH1cbiAgfVxuXG4gIGRlc2NyaXB0aW9uTGVuZ3RoIChpdGVtKSB7XG4gICAgbGV0IGNvdW50ID0gMFxuICAgIGlmIChpdGVtLmRlc2NyaXB0aW9uICE9IG51bGwpIHtcbiAgICAgIGNvdW50ICs9IGl0ZW0uZGVzY3JpcHRpb24ubGVuZ3RoXG4gICAgfVxuICAgIGlmIChpdGVtLmRlc2NyaXB0aW9uTW9yZVVSTCAhPSBudWxsKSB7XG4gICAgICBjb3VudCArPSA2XG4gICAgfVxuICAgIHJldHVybiBjb3VudFxuICB9XG5cbiAgcmVuZGVyU2VsZWN0ZWRJdGVtICgpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZExpICYmIHRoaXMuc2VsZWN0ZWRMaS5jbGFzc0xpc3QpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRMaS5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpXG4gICAgfVxuXG4gICAgdGhpcy5zZWxlY3RlZExpID0gdGhpcy5vbC5jaGlsZE5vZGVzW3RoaXMuc2VsZWN0ZWRJbmRleF1cbiAgICBpZiAodGhpcy5zZWxlY3RlZExpICE9IG51bGwpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRMaS5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpXG4gICAgICB0aGlzLnNjcm9sbFNlbGVjdGVkSXRlbUludG9WaWV3KClcbiAgICAgIHJldHVybiB0aGlzLnVwZGF0ZURlc2NyaXB0aW9uKClcbiAgICB9XG4gIH1cblxuICAvLyBUaGlzIGlzIHJlYWRpbmcgdGhlIERPTSBpbiB0aGUgdXBkYXRlRE9NIGN5Y2xlLiBJZiB3ZSBkb250LCB0aGVyZSBpcyBhIGZsaWNrZXIgOi9cbiAgc2Nyb2xsU2VsZWN0ZWRJdGVtSW50b1ZpZXcgKCkge1xuICAgIGNvbnN0IHsgc2Nyb2xsVG9wIH0gPSB0aGlzLnNjcm9sbGVyXG4gICAgY29uc3Qgc2VsZWN0ZWRJdGVtVG9wID0gdGhpcy5zZWxlY3RlZExpLm9mZnNldFRvcFxuICAgIGlmIChzZWxlY3RlZEl0ZW1Ub3AgPCBzY3JvbGxUb3ApIHtcbiAgICAgIC8vIHNjcm9sbCB1cFxuICAgICAgdGhpcy5zY3JvbGxlci5zY3JvbGxUb3AgPSBzZWxlY3RlZEl0ZW1Ub3BcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgaXRlbUhlaWdodCB9ID0gdGhpcy51aVByb3BzXG4gICAgY29uc3Qgc2Nyb2xsZXJIZWlnaHQgPSAodGhpcy5tYXhWaXNpYmxlU3VnZ2VzdGlvbnMgKiBpdGVtSGVpZ2h0KSArIHRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0XG4gICAgaWYgKHNlbGVjdGVkSXRlbVRvcCArIGl0ZW1IZWlnaHQgPiBzY3JvbGxUb3AgKyBzY3JvbGxlckhlaWdodCkge1xuICAgICAgLy8gc2Nyb2xsIGRvd25cbiAgICAgIHRoaXMuc2Nyb2xsZXIuc2Nyb2xsVG9wID0gKHNlbGVjdGVkSXRlbVRvcCAtIHNjcm9sbGVySGVpZ2h0KSArIGl0ZW1IZWlnaHRcbiAgICB9XG4gIH1cblxuICByZWFkVUlQcm9wc0Zyb21ET00gKCkge1xuICAgIGxldCB3b3JkQ29udGFpbmVyXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRMaSkge1xuICAgICAgd29yZENvbnRhaW5lciA9IHRoaXMuc2VsZWN0ZWRMaS5xdWVyeVNlbGVjdG9yKCcud29yZC1jb250YWluZXInKVxuICAgIH1cblxuICAgIGlmICghdGhpcy51aVByb3BzKSB7IHRoaXMudWlQcm9wcyA9IHt9IH1cbiAgICB0aGlzLnVpUHJvcHMud2lkdGggPSB0aGlzLm9mZnNldFdpZHRoICsgMVxuICAgIHRoaXMudWlQcm9wcy5tYXJnaW5MZWZ0ID0gMFxuICAgIGlmICh3b3JkQ29udGFpbmVyICYmIHdvcmRDb250YWluZXIub2Zmc2V0TGVmdCkge1xuICAgICAgdGhpcy51aVByb3BzLm1hcmdpbkxlZnQgPSAtd29yZENvbnRhaW5lci5vZmZzZXRMZWZ0XG4gICAgfVxuICAgIGlmICghdGhpcy51aVByb3BzLml0ZW1IZWlnaHQpIHtcbiAgICAgIHRoaXMudWlQcm9wcy5pdGVtSGVpZ2h0ID0gdGhpcy5zZWxlY3RlZExpLm9mZnNldEhlaWdodFxuICAgIH1cbiAgICBpZiAoIXRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0KSB7XG4gICAgICB0aGlzLnVpUHJvcHMucGFkZGluZ0hlaWdodCA9IHBhcnNlSW50KGdldENvbXB1dGVkU3R5bGUodGhpcylbJ3BhZGRpbmctdG9wJ10pICsgcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzKVsncGFkZGluZy1ib3R0b20nXSlcbiAgICAgIGlmICghdGhpcy51aVByb3BzLnBhZGRpbmdIZWlnaHQpIHtcbiAgICAgICAgdGhpcy51aVByb3BzLnBhZGRpbmdIZWlnaHQgPSAwXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIFVJIGR1cmluZyB0aGlzIHJlYWQsIHNvIHRoYXQgd2hlbiBwb2xsaW5nIHRoZSBkb2N1bWVudCB0aGUgbGF0ZXN0XG4gICAgLy8gY2hhbmdlcyBjYW4gYmUgcGlja2VkIHVwLlxuICAgIHJldHVybiB0aGlzLnVwZGF0ZVVJRm9yQ2hhbmdlZFByb3BzKClcbiAgfVxuXG4gIHVwZGF0ZVVJRm9yQ2hhbmdlZFByb3BzICgpIHtcbiAgICB0aGlzLnNjcm9sbGVyLnN0eWxlWydtYXgtaGVpZ2h0J10gPSBgJHsodGhpcy5tYXhWaXNpYmxlU3VnZ2VzdGlvbnMgKiB0aGlzLnVpUHJvcHMuaXRlbUhlaWdodCkgKyB0aGlzLnVpUHJvcHMucGFkZGluZ0hlaWdodH1weGBcbiAgICB0aGlzLnN0eWxlLndpZHRoID0gYCR7dGhpcy51aVByb3BzLndpZHRofXB4YFxuICAgIGlmICh0aGlzLnN1Z2dlc3Rpb25MaXN0Rm9sbG93cyA9PT0gJ1dvcmQnKSB7XG4gICAgICB0aGlzLnN0eWxlWydtYXJnaW4tbGVmdCddID0gYCR7dGhpcy51aVByb3BzLm1hcmdpbkxlZnR9cHhgXG4gICAgfVxuICAgIHJldHVybiB0aGlzLnVwZGF0ZURlc2NyaXB0aW9uKClcbiAgfVxuXG4gIC8vIFNwbGl0cyB0aGUgY2xhc3NlcyBvbiBzcGFjZXMgc28gYXMgbm90IHRvIGFuZ2VyIHRoZSBET00gZ29kc1xuICBhZGRDbGFzc1RvRWxlbWVudCAoZWxlbWVudCwgY2xhc3NOYW1lcykge1xuICAgIGlmICghY2xhc3NOYW1lcykgeyByZXR1cm4gfVxuICAgIGNvbnN0IGNsYXNzZXMgPSBjbGFzc05hbWVzLnNwbGl0KCcgJylcbiAgICBpZiAoY2xhc3Nlcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGFzc2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBjbGFzc05hbWUgPSBjbGFzc2VzW2ldXG4gICAgICAgIGNsYXNzTmFtZSA9IGNsYXNzTmFtZS50cmltKClcbiAgICAgICAgaWYgKGNsYXNzTmFtZSkgeyBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKSB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVuZGVySXRlbSAoe2ljb25IVE1MLCB0eXBlLCBzbmlwcGV0LCB0ZXh0LCBkaXNwbGF5VGV4dCwgY2xhc3NOYW1lLCByZXBsYWNlbWVudFByZWZpeCwgbGVmdExhYmVsLCBsZWZ0TGFiZWxIVE1MLCByaWdodExhYmVsLCByaWdodExhYmVsSFRNTH0sIGluZGV4KSB7XG4gICAgbGV0IGxpID0gdGhpcy5vbC5jaGlsZE5vZGVzW2luZGV4XVxuICAgIGlmICghbGkpIHtcbiAgICAgIGlmICh0aGlzLm5vZGVwb29sICYmIHRoaXMubm9kZVBvb2wubGVuZ3RoID4gMCkge1xuICAgICAgICBsaSA9IHRoaXMubm9kZVBvb2wucG9wKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKVxuICAgICAgICBsaS5pbm5lckhUTUwgPSBJdGVtVGVtcGxhdGVcbiAgICAgIH1cbiAgICAgIGxpLmRhdGFzZXQuaW5kZXggPSBpbmRleFxuICAgICAgdGhpcy5vbC5hcHBlbmRDaGlsZChsaSlcbiAgICB9XG5cbiAgICBsaS5jbGFzc05hbWUgPSAnJ1xuICAgIGlmIChpbmRleCA9PT0gdGhpcy5zZWxlY3RlZEluZGV4KSB7IGxpLmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJykgfVxuICAgIGlmIChjbGFzc05hbWUpIHsgdGhpcy5hZGRDbGFzc1RvRWxlbWVudChsaSwgY2xhc3NOYW1lKSB9XG4gICAgaWYgKGluZGV4ID09PSB0aGlzLnNlbGVjdGVkSW5kZXgpIHsgdGhpcy5zZWxlY3RlZExpID0gbGkgfVxuXG4gICAgY29uc3QgdHlwZUljb25Db250YWluZXIgPSBsaS5xdWVyeVNlbGVjdG9yKCcuaWNvbi1jb250YWluZXInKVxuICAgIHR5cGVJY29uQ29udGFpbmVyLmlubmVySFRNTCA9ICcnXG5cbiAgICBjb25zdCBzYW5pdGl6ZWRUeXBlID0gZXNjYXBlSHRtbChpc1N0cmluZyh0eXBlKSA/IHR5cGUgOiAnJylcbiAgICBjb25zdCBzYW5pdGl6ZWRJY29uSFRNTCA9IGlzU3RyaW5nKGljb25IVE1MKSA/IGljb25IVE1MIDogdW5kZWZpbmVkXG4gICAgY29uc3QgZGVmYXVsdExldHRlckljb25IVE1MID0gc2FuaXRpemVkVHlwZSA/IGA8c3BhbiBjbGFzcz1cImljb24tbGV0dGVyXCI+JHtzYW5pdGl6ZWRUeXBlWzBdfTwvc3Bhbj5gIDogJydcbiAgICBjb25zdCBkZWZhdWx0SWNvbkhUTUwgPSBEZWZhdWx0U3VnZ2VzdGlvblR5cGVJY29uSFRNTFtzYW5pdGl6ZWRUeXBlXSAhPSBudWxsID8gRGVmYXVsdFN1Z2dlc3Rpb25UeXBlSWNvbkhUTUxbc2FuaXRpemVkVHlwZV0gOiBkZWZhdWx0TGV0dGVySWNvbkhUTUxcbiAgICBpZiAoKHNhbml0aXplZEljb25IVE1MIHx8IGRlZmF1bHRJY29uSFRNTCkgJiYgaWNvbkhUTUwgIT09IGZhbHNlKSB7XG4gICAgICB0eXBlSWNvbkNvbnRhaW5lci5pbm5lckhUTUwgPSBJY29uVGVtcGxhdGVcbiAgICAgIGNvbnN0IHR5cGVJY29uID0gdHlwZUljb25Db250YWluZXIuY2hpbGROb2Rlc1swXVxuICAgICAgdHlwZUljb24uaW5uZXJIVE1MID0gc2FuaXRpemVkSWNvbkhUTUwgIT0gbnVsbCA/IHNhbml0aXplZEljb25IVE1MIDogZGVmYXVsdEljb25IVE1MXG4gICAgICBpZiAodHlwZSkgeyB0aGlzLmFkZENsYXNzVG9FbGVtZW50KHR5cGVJY29uLCB0eXBlKSB9XG4gICAgfVxuXG4gICAgY29uc3Qgd29yZFNwYW4gPSBsaS5xdWVyeVNlbGVjdG9yKCcud29yZCcpXG4gICAgd29yZFNwYW4uaW5uZXJIVE1MID0gdGhpcy5nZXREaXNwbGF5SFRNTCh0ZXh0LCBzbmlwcGV0LCBkaXNwbGF5VGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpXG5cbiAgICBjb25zdCBsZWZ0TGFiZWxTcGFuID0gbGkucXVlcnlTZWxlY3RvcignLmxlZnQtbGFiZWwnKVxuICAgIGlmIChsZWZ0TGFiZWxIVE1MICE9IG51bGwpIHtcbiAgICAgIGxlZnRMYWJlbFNwYW4uaW5uZXJIVE1MID0gbGVmdExhYmVsSFRNTFxuICAgIH0gZWxzZSBpZiAobGVmdExhYmVsICE9IG51bGwpIHtcbiAgICAgIGxlZnRMYWJlbFNwYW4udGV4dENvbnRlbnQgPSBsZWZ0TGFiZWxcbiAgICB9IGVsc2Uge1xuICAgICAgbGVmdExhYmVsU3Bhbi50ZXh0Q29udGVudCA9ICcnXG4gICAgfVxuXG4gICAgY29uc3QgcmlnaHRMYWJlbFNwYW4gPSBsaS5xdWVyeVNlbGVjdG9yKCcucmlnaHQtbGFiZWwnKVxuICAgIGlmIChyaWdodExhYmVsSFRNTCAhPSBudWxsKSB7XG4gICAgICByaWdodExhYmVsU3Bhbi5pbm5lckhUTUwgPSByaWdodExhYmVsSFRNTFxuICAgIH0gZWxzZSBpZiAocmlnaHRMYWJlbCAhPSBudWxsKSB7XG4gICAgICByaWdodExhYmVsU3Bhbi50ZXh0Q29udGVudCA9IHJpZ2h0TGFiZWxcbiAgICB9IGVsc2Uge1xuICAgICAgcmlnaHRMYWJlbFNwYW4udGV4dENvbnRlbnQgPSAnJ1xuICAgIH1cbiAgfVxuXG4gIGdldERpc3BsYXlIVE1MICh0ZXh0LCBzbmlwcGV0LCBkaXNwbGF5VGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpIHtcbiAgICBsZXQgcmVwbGFjZW1lbnRUZXh0ID0gdGV4dFxuICAgIGxldCBzbmlwcGV0SW5kaWNlc1xuICAgIGlmICh0eXBlb2YgZGlzcGxheVRleHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXBsYWNlbWVudFRleHQgPSBkaXNwbGF5VGV4dFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNuaXBwZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXBsYWNlbWVudFRleHQgPSB0aGlzLnJlbW92ZUVtcHR5U25pcHBldHMoc25pcHBldClcbiAgICAgIGNvbnN0IHNuaXBwZXRzID0gdGhpcy5zbmlwcGV0UGFyc2VyLmZpbmRTbmlwcGV0cyhyZXBsYWNlbWVudFRleHQpXG4gICAgICByZXBsYWNlbWVudFRleHQgPSB0aGlzLnJlbW92ZVNuaXBwZXRzRnJvbVRleHQoc25pcHBldHMsIHJlcGxhY2VtZW50VGV4dClcbiAgICAgIHNuaXBwZXRJbmRpY2VzID0gdGhpcy5maW5kU25pcHBldEluZGljZXMoc25pcHBldHMpXG4gICAgfVxuICAgIGNvbnN0IGNoYXJhY3Rlck1hdGNoSW5kaWNlcyA9IHRoaXMuZmluZENoYXJhY3Rlck1hdGNoSW5kaWNlcyhyZXBsYWNlbWVudFRleHQsIHJlcGxhY2VtZW50UHJlZml4KVxuXG4gICAgbGV0IGRpc3BsYXlIVE1MID0gJydcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcmVwbGFjZW1lbnRUZXh0Lmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgaWYgKHNuaXBwZXRJbmRpY2VzICYmIChzbmlwcGV0SW5kaWNlc1tpbmRleF0gPT09IFNuaXBwZXRTdGFydCB8fCBzbmlwcGV0SW5kaWNlc1tpbmRleF0gPT09IFNuaXBwZXRTdGFydEFuZEVuZCkpIHtcbiAgICAgICAgZGlzcGxheUhUTUwgKz0gJzxzcGFuIGNsYXNzPVwic25pcHBldC1jb21wbGV0aW9uXCI+J1xuICAgICAgfVxuICAgICAgaWYgKGNoYXJhY3Rlck1hdGNoSW5kaWNlcyAmJiBjaGFyYWN0ZXJNYXRjaEluZGljZXNbaW5kZXhdKSB7XG4gICAgICAgIGRpc3BsYXlIVE1MICs9IGA8c3BhbiBjbGFzcz1cImNoYXJhY3Rlci1tYXRjaFwiPiR7ZXNjYXBlSHRtbChyZXBsYWNlbWVudFRleHRbaW5kZXhdKX08L3NwYW4+YFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGlzcGxheUhUTUwgKz0gZXNjYXBlSHRtbChyZXBsYWNlbWVudFRleHRbaW5kZXhdKVxuICAgICAgfVxuICAgICAgaWYgKHNuaXBwZXRJbmRpY2VzICYmIChzbmlwcGV0SW5kaWNlc1tpbmRleF0gPT09IFNuaXBwZXRFbmQgfHwgc25pcHBldEluZGljZXNbaW5kZXhdID09PSBTbmlwcGV0U3RhcnRBbmRFbmQpKSB7XG4gICAgICAgIGRpc3BsYXlIVE1MICs9ICc8L3NwYW4+J1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGlzcGxheUhUTUxcbiAgfVxuXG4gIHJlbW92ZUVtcHR5U25pcHBldHMgKHRleHQpIHtcbiAgICBpZiAoIXRleHQgfHwgIXRleHQubGVuZ3RoIHx8IHRleHQuaW5kZXhPZignJCcpID09PSAtMSkgeyByZXR1cm4gdGV4dCB9IC8vIE5vIHNuaXBwZXRzXG4gICAgcmV0dXJuIHRleHQucmVwbGFjZSh0aGlzLmVtcHR5U25pcHBldEdyb3VwUmVnZXgsICcnKSAvLyBSZW1vdmUgYWxsIG9jY3VycmVuY2VzIG9mICQwIG9yICR7MH0gb3IgJHswOn1cbiAgfVxuXG4gIC8vIFdpbGwgY29udmVydCAnYWJjKCR7MTpkfSwgJHsyOmV9KWYnID0+ICdhYmMoZCwgZSlmJ1xuICAvL1xuICAvLyAqIGBzbmlwcGV0c2Age0FycmF5fSBmcm9tIGBTbmlwcGV0UGFyc2VyLmZpbmRTbmlwcGV0c2BcbiAgLy8gKiBgdGV4dGAge1N0cmluZ30gdG8gcmVtb3ZlIHNuaXBwZXRzIGZyb21cbiAgLy9cbiAgLy8gUmV0dXJucyB7U3RyaW5nfVxuICByZW1vdmVTbmlwcGV0c0Zyb21UZXh0IChzbmlwcGV0cywgdGV4dCkge1xuICAgIGlmICghdGV4dCB8fCAhdGV4dC5sZW5ndGggfHwgIXNuaXBwZXRzIHx8ICFzbmlwcGV0cy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0ZXh0XG4gICAgfVxuICAgIGxldCBpbmRleCA9IDBcbiAgICBsZXQgcmVzdWx0ID0gJydcbiAgICBmb3IgKGNvbnN0IHtzbmlwcGV0U3RhcnQsIHNuaXBwZXRFbmQsIGJvZHl9IG9mIHNuaXBwZXRzKSB7XG4gICAgICByZXN1bHQgKz0gdGV4dC5zbGljZShpbmRleCwgc25pcHBldFN0YXJ0KSArIGJvZHlcbiAgICAgIGluZGV4ID0gc25pcHBldEVuZCArIDFcbiAgICB9XG4gICAgaWYgKGluZGV4ICE9PSB0ZXh0Lmxlbmd0aCkge1xuICAgICAgcmVzdWx0ICs9IHRleHQuc2xpY2UoaW5kZXgsIHRleHQubGVuZ3RoKVxuICAgIH1cbiAgICByZXN1bHQgPSByZXN1bHQucmVwbGFjZSh0aGlzLnNsYXNoZXNJblNuaXBwZXRSZWdleCwgJ1xcXFwnKVxuICAgIHJldHVybiByZXN1bHRcbiAgfVxuXG4gIC8vIENvbXB1dGVzIHRoZSBpbmRpY2VzIG9mIHNuaXBwZXRzIGluIHRoZSByZXN1bHRpbmcgc3RyaW5nIGZyb21cbiAgLy8gYHJlbW92ZVNuaXBwZXRzRnJvbVRleHRgLlxuICAvL1xuICAvLyAqIGBzbmlwcGV0c2Age0FycmF5fSBmcm9tIGBTbmlwcGV0UGFyc2VyLmZpbmRTbmlwcGV0c2BcbiAgLy9cbiAgLy8gZS5nLiBBIHJlcGxhY2VtZW50IG9mICdhYmMoJHsxOmR9KWUnIGlzIHJlcGxhY2VkIHRvICdhYmMoZCllJyB3aWxsIHJlc3VsdCBpblxuICAvL1xuICAvLyBgezQ6IFNuaXBwZXRTdGFydEFuZEVuZH1gXG4gIC8vXG4gIC8vIFJldHVybnMge09iamVjdH0gb2Yge2luZGV4OiBTbmlwcGV0U3RhcnR8RW5kfFN0YXJ0QW5kRW5kfVxuICBmaW5kU25pcHBldEluZGljZXMgKHNuaXBwZXRzKSB7XG4gICAgaWYgKCFzbmlwcGV0cykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGNvbnN0IGluZGljZXMgPSB7fVxuICAgIGxldCBvZmZzZXRBY2N1bXVsYXRvciA9IDBcbiAgICBmb3IgKGNvbnN0IHtzbmlwcGV0U3RhcnQsIHNuaXBwZXRFbmQsIGJvZHl9IG9mIHNuaXBwZXRzKSB7XG4gICAgICBjb25zdCBib2R5TGVuZ3RoID0gYm9keS5sZW5ndGhcbiAgICAgIGNvbnN0IHNuaXBwZXRMZW5ndGggPSAoc25pcHBldEVuZCAtIHNuaXBwZXRTdGFydCkgKyAxXG4gICAgICBjb25zdCBzdGFydEluZGV4ID0gc25pcHBldFN0YXJ0IC0gb2Zmc2V0QWNjdW11bGF0b3JcbiAgICAgIGNvbnN0IGVuZEluZGV4ID0gKHN0YXJ0SW5kZXggKyBib2R5TGVuZ3RoKSAtIDFcbiAgICAgIG9mZnNldEFjY3VtdWxhdG9yICs9IHNuaXBwZXRMZW5ndGggLSBib2R5TGVuZ3RoXG5cbiAgICAgIGlmIChzdGFydEluZGV4ID09PSBlbmRJbmRleCkge1xuICAgICAgICBpbmRpY2VzW3N0YXJ0SW5kZXhdID0gU25pcHBldFN0YXJ0QW5kRW5kXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmRpY2VzW3N0YXJ0SW5kZXhdID0gU25pcHBldFN0YXJ0XG4gICAgICAgIGluZGljZXNbZW5kSW5kZXhdID0gU25pcHBldEVuZFxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBpbmRpY2VzXG4gIH1cblxuICAvLyBGaW5kcyB0aGUgaW5kaWNlcyBvZiB0aGUgY2hhcnMgaW4gdGV4dCB0aGF0IGFyZSBtYXRjaGVkIGJ5IHJlcGxhY2VtZW50UHJlZml4XG4gIC8vXG4gIC8vIGUuZy4gdGV4dCA9ICdhYmNkZScsIHJlcGxhY2VtZW50UHJlZml4ID0gJ2FjZCcgV2lsbCByZXN1bHQgaW5cbiAgLy9cbiAgLy8gezA6IHRydWUsIDI6IHRydWUsIDM6IHRydWV9XG4gIC8vXG4gIC8vIFJldHVybnMgYW4ge09iamVjdH1cbiAgZmluZENoYXJhY3Rlck1hdGNoSW5kaWNlcyAodGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpIHtcbiAgICBpZiAoIXRleHQgfHwgIXRleHQubGVuZ3RoIHx8ICFyZXBsYWNlbWVudFByZWZpeCB8fCAhcmVwbGFjZW1lbnRQcmVmaXgubGVuZ3RoKSB7IHJldHVybiB9XG4gICAgY29uc3QgbWF0Y2hlcyA9IHt9XG4gICAgaWYgKHRoaXMudXNlQWx0ZXJuYXRlU2NvcmluZykge1xuICAgICAgY29uc3QgbWF0Y2hJbmRpY2VzID0gZnV6emFsZHJpblBsdXMubWF0Y2godGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpXG4gICAgICBmb3IgKGNvbnN0IGkgb2YgbWF0Y2hJbmRpY2VzKSB7XG4gICAgICAgIG1hdGNoZXNbaV0gPSB0cnVlXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCB3b3JkSW5kZXggPSAwXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlcGxhY2VtZW50UHJlZml4Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNoID0gcmVwbGFjZW1lbnRQcmVmaXhbaV1cbiAgICAgICAgd2hpbGUgKHdvcmRJbmRleCA8IHRleHQubGVuZ3RoICYmIHRleHRbd29yZEluZGV4XS50b0xvd2VyQ2FzZSgpICE9PSBjaC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgd29yZEluZGV4ICs9IDFcbiAgICAgICAgfVxuICAgICAgICBpZiAod29yZEluZGV4ID49IHRleHQubGVuZ3RoKSB7IGJyZWFrIH1cbiAgICAgICAgbWF0Y2hlc1t3b3JkSW5kZXhdID0gdHJ1ZVxuICAgICAgICB3b3JkSW5kZXggKz0gMVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hlc1xuICB9XG5cbiAgZGlzcG9zZSAoKSB7XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIGlmICh0aGlzLnBhcmVudE5vZGUpIHtcbiAgICAgIHRoaXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzKVxuICAgIH1cbiAgfVxufVxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vY29tcG9uZW50L2VzY2FwZS1odG1sL2Jsb2IvbWFzdGVyL2luZGV4LmpzXG5jb25zdCBlc2NhcGVIdG1sID0gKGh0bWwpID0+IHtcbiAgcmV0dXJuIFN0cmluZyhodG1sKVxuICAgIC5yZXBsYWNlKC8mL2csICcmYW1wOycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7Jylcbn1cblxuZXhwb3J0IGRlZmF1bHQgU3VnZ2VzdGlvbkxpc3RFbGVtZW50ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KCdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbi1saXN0Jywge3Byb3RvdHlwZTogU3VnZ2VzdGlvbkxpc3RFbGVtZW50LnByb3RvdHlwZX0pIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY2xhc3MtYXNzaWduXG4iXX0=