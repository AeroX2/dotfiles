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
      this.selectedIndex = -1;
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

      this.model.replace(this.getSelectedItem());

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
        if (this.selectedLi) {
          this.uiProps.itemHeight = this.selectedLi.offsetHeight;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvc3VnZ2VzdGlvbi1saXN0LWVsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7b0JBRWdELE1BQU07OzZCQUM1QixrQkFBa0I7Ozs7MkJBQ25CLGdCQUFnQjs7OEJBQ2QsaUJBQWlCOzs7O3NCQUN6QixRQUFROzs7O0FBTjNCLFdBQVcsQ0FBQTs7QUFRWCxJQUFNLFlBQVksOExBS2tCLENBQUE7O0FBRXBDLElBQU0sWUFBWSx3UUFNVCxDQUFBOztBQUVULElBQU0sWUFBWSxHQUFHLHNCQUFzQixDQUFBOztBQUUzQyxJQUFNLDZCQUE2QixHQUFHO0FBQ3BDLFdBQVMsRUFBRSxpQ0FBaUM7QUFDNUMsVUFBUSxFQUFFLDhCQUE4QjtBQUN4QyxXQUFTLEVBQUUsOEJBQThCO0FBQ3pDLFVBQVEsRUFBRSw4QkFBOEI7QUFDeEMsV0FBUyxFQUFFLDhCQUE4QjtBQUN6QyxPQUFLLEVBQUUsMkJBQTJCO0FBQ2xDLGFBQVcsRUFBRSwwQkFBMEI7Q0FDeEMsQ0FBQTs7QUFFRCxJQUFNLFlBQVksR0FBRyxDQUFDLENBQUE7QUFDdEIsSUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFBO0FBQ3BCLElBQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFBOztJQUV0QixxQkFBcUI7WUFBckIscUJBQXFCOztXQUFyQixxQkFBcUI7MEJBQXJCLHFCQUFxQjs7K0JBQXJCLHFCQUFxQjs7Ozs7ZUFBckIscUJBQXFCOztXQUNULDJCQUFHO0FBQ2pCLFVBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFBO0FBQ25CLFVBQUksQ0FBQyxzQkFBc0IsR0FBRyxvQ0FBb0MsQ0FBQTtBQUNsRSxVQUFJLENBQUMscUJBQXFCLEdBQUcsT0FBTyxDQUFBO0FBQ3BDLFVBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLFVBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7QUFDOUMsVUFB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cGx1cy9saWIvc3VnZ2VzdGlvbi1saXN0LWVsZW1lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJ1xuXG5pbXBvcnQgeyBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSAnYXRvbSdcbmltcG9ydCBTbmlwcGV0UGFyc2VyIGZyb20gJy4vc25pcHBldC1wYXJzZXInXG5pbXBvcnQgeyBpc1N0cmluZyB9IGZyb20gJy4vdHlwZS1oZWxwZXJzJ1xuaW1wb3J0IGZ1enphbGRyaW5QbHVzIGZyb20gJ2Z1enphbGRyaW4tcGx1cydcbmltcG9ydCBtYXJrZWQgZnJvbSAnbWFya2VkJ1xuXG5jb25zdCBJdGVtVGVtcGxhdGUgPSBgPHNwYW4gY2xhc3M9XCJpY29uLWNvbnRhaW5lclwiPjwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJsZWZ0LWxhYmVsXCI+PC9zcGFuPlxuICA8c3BhbiBjbGFzcz1cIndvcmQtY29udGFpbmVyXCI+XG4gICAgPHNwYW4gY2xhc3M9XCJ3b3JkXCI+PC9zcGFuPlxuICA8L3NwYW4+XG4gIDxzcGFuIGNsYXNzPVwicmlnaHQtbGFiZWxcIj48L3NwYW4+YFxuXG5jb25zdCBMaXN0VGVtcGxhdGUgPSBgPGRpdiBjbGFzcz1cInN1Z2dlc3Rpb24tbGlzdC1zY3JvbGxlclwiPlxuICAgIDxvbCBjbGFzcz1cImxpc3QtZ3JvdXBcIj48L29sPlxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cInN1Z2dlc3Rpb24tZGVzY3JpcHRpb25cIj5cbiAgICA8c3BhbiBjbGFzcz1cInN1Z2dlc3Rpb24tZGVzY3JpcHRpb24tY29udGVudFwiPjwvc3Bhbj5cbiAgICA8YSBjbGFzcz1cInN1Z2dlc3Rpb24tZGVzY3JpcHRpb24tbW9yZS1saW5rXCIgaHJlZj1cIiNcIj5Nb3JlLi48L2E+XG4gIDwvZGl2PmBcblxuY29uc3QgSWNvblRlbXBsYXRlID0gJzxpIGNsYXNzPVwiaWNvblwiPjwvaT4nXG5cbmNvbnN0IERlZmF1bHRTdWdnZXN0aW9uVHlwZUljb25IVE1MID0ge1xuICAnc25pcHBldCc6ICc8aSBjbGFzcz1cImljb24tbW92ZS1yaWdodFwiPjwvaT4nLFxuICAnaW1wb3J0JzogJzxpIGNsYXNzPVwiaWNvbi1wYWNrYWdlXCI+PC9pPicsXG4gICdyZXF1aXJlJzogJzxpIGNsYXNzPVwiaWNvbi1wYWNrYWdlXCI+PC9pPicsXG4gICdtb2R1bGUnOiAnPGkgY2xhc3M9XCJpY29uLXBhY2thZ2VcIj48L2k+JyxcbiAgJ3BhY2thZ2UnOiAnPGkgY2xhc3M9XCJpY29uLXBhY2thZ2VcIj48L2k+JyxcbiAgJ3RhZyc6ICc8aSBjbGFzcz1cImljb24tY29kZVwiPjwvaT4nLFxuICAnYXR0cmlidXRlJzogJzxpIGNsYXNzPVwiaWNvbi10YWdcIj48L2k+J1xufVxuXG5jb25zdCBTbmlwcGV0U3RhcnQgPSAxXG5jb25zdCBTbmlwcGV0RW5kID0gMlxuY29uc3QgU25pcHBldFN0YXJ0QW5kRW5kID0gM1xuXG5jbGFzcyBTdWdnZXN0aW9uTGlzdEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIGNyZWF0ZWRDYWxsYmFjayAoKSB7XG4gICAgdGhpcy5tYXhJdGVtcyA9IDIwMFxuICAgIHRoaXMuZW1wdHlTbmlwcGV0R3JvdXBSZWdleCA9IC8oXFwkXFx7XFxkKzpcXH0pfChcXCRcXHtcXGQrXFx9KXwoXFwkXFxkKykvaWdcbiAgICB0aGlzLnNsYXNoZXNJblNuaXBwZXRSZWdleCA9IC9cXFxcXFxcXC9nXG4gICAgdGhpcy5ub2RlUG9vbCA9IG51bGxcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5jbGFzc0xpc3QuYWRkKCdwb3BvdmVyLWxpc3QnLCAnc2VsZWN0LWxpc3QnLCAnYXV0b2NvbXBsZXRlLXN1Z2dlc3Rpb24tbGlzdCcpXG4gICAgdGhpcy5yZWdpc3Rlck1vdXNlSGFuZGxpbmcoKVxuICAgIHRoaXMuc25pcHBldFBhcnNlciA9IG5ldyBTbmlwcGV0UGFyc2VyKClcbiAgICB0aGlzLm5vZGVQb29sID0gW11cbiAgfVxuXG4gIGF0dGFjaGVkQ2FsbGJhY2sgKCkge1xuICAgIC8vIFRPRE86IEZpeCBvdmVybGF5IGRlY29yYXRvciB0byBpbiBhdG9tIHRvIGFwcGx5IGNsYXNzIGF0dHJpYnV0ZSBjb3JyZWN0bHksIHRoZW4gbW92ZSB0aGlzIHRvIG92ZXJsYXkgY3JlYXRpb24gcG9pbnQuXG4gICAgdGhpcy5wYXJlbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2F1dG9jb21wbGV0ZS1wbHVzJylcbiAgICB0aGlzLmFkZEFjdGl2ZUNsYXNzVG9FZGl0b3IoKVxuICAgIGlmICghdGhpcy5vbCkgeyB0aGlzLnJlbmRlckxpc3QoKSB9XG4gICAgcmV0dXJuIHRoaXMuaXRlbXNDaGFuZ2VkKClcbiAgfVxuXG4gIGRldGFjaGVkQ2FsbGJhY2sgKCkge1xuICAgIGlmICh0aGlzLmFjdGl2ZUNsYXNzRGlzcG9zYWJsZSAmJiB0aGlzLmFjdGl2ZUNsYXNzRGlzcG9zYWJsZS5kaXNwb3NlKSB7XG4gICAgICB0aGlzLmFjdGl2ZUNsYXNzRGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICB9XG4gIH1cblxuICBpbml0aWFsaXplIChtb2RlbCkge1xuICAgIHRoaXMubW9kZWwgPSBtb2RlbFxuICAgIGlmICh0aGlzLm1vZGVsID09IG51bGwpIHsgcmV0dXJuIH1cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRDaGFuZ2VJdGVtcyh0aGlzLml0ZW1zQ2hhbmdlZC5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3ROZXh0KHRoaXMubW92ZVNlbGVjdGlvbkRvd24uYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkU2VsZWN0UHJldmlvdXModGhpcy5tb3ZlU2VsZWN0aW9uVXAuYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkU2VsZWN0UGFnZVVwKHRoaXMubW92ZVNlbGVjdGlvblBhZ2VVcC5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3RQYWdlRG93bih0aGlzLm1vdmVTZWxlY3Rpb25QYWdlRG93bi5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3RUb3AodGhpcy5tb3ZlU2VsZWN0aW9uVG9Ub3AuYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkU2VsZWN0Qm90dG9tKHRoaXMubW92ZVNlbGVjdGlvblRvQm90dG9tLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZENvbmZpcm1TZWxlY3Rpb24odGhpcy5jb25maXJtU2VsZWN0aW9uLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZGNvbmZpcm1TZWxlY3Rpb25JZk5vbkRlZmF1bHQodGhpcy5jb25maXJtU2VsZWN0aW9uSWZOb25EZWZhdWx0LmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZERpc3Bvc2UodGhpcy5kaXNwb3NlLmJpbmQodGhpcykpKVxuXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy5zdWdnZXN0aW9uTGlzdEZvbGxvd3MnLCBzdWdnZXN0aW9uTGlzdEZvbGxvd3MgPT4ge1xuICAgICAgdGhpcy5zdWdnZXN0aW9uTGlzdEZvbGxvd3MgPSBzdWdnZXN0aW9uTGlzdEZvbGxvd3NcbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLm1heFZpc2libGVTdWdnZXN0aW9ucycsIG1heFZpc2libGVTdWdnZXN0aW9ucyA9PiB7XG4gICAgICB0aGlzLm1heFZpc2libGVTdWdnZXN0aW9ucyA9IG1heFZpc2libGVTdWdnZXN0aW9uc1xuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMudXNlQWx0ZXJuYXRlU2NvcmluZycsIHVzZUFsdGVybmF0ZVNjb3JpbmcgPT4ge1xuICAgICAgdGhpcy51c2VBbHRlcm5hdGVTY29yaW5nID0gdXNlQWx0ZXJuYXRlU2NvcmluZ1xuICAgIH0pKVxuXHR0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20ua2V5bWFwcy5vbkRpZEZhaWxUb01hdGNoQmluZGluZyhrZXlzdHJva2VzID0+IHtcblx0XHRpZiAodGhpcy5zZWxlY3RlZEluZGV4ID09PSAwKVxuXHRcdFx0dGhpcy5jb25maXJtU2VsZWN0aW9uKGtleXN0cm9rZXMpXG5cdH0pKVxuXHRcdFx0XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8vIFRoaXMgc2hvdWxkIGJlIHVubmVjZXNzYXJ5IGJ1dCB0aGUgZXZlbnRzIHdlIG5lZWQgdG8gb3ZlcnJpZGVcbiAgLy8gYXJlIGhhbmRsZWQgYXQgYSBsZXZlbCB0aGF0IGNhbid0IGJlIGJsb2NrZWQgYnkgcmVhY3Qgc3ludGhldGljXG4gIC8vIGV2ZW50cyBiZWNhdXNlIHRoZXkgYXJlIGhhbmRsZWQgYXQgdGhlIGRvY3VtZW50XG4gIHJlZ2lzdGVyTW91c2VIYW5kbGluZyAoKSB7XG4gICAgdGhpcy5vbm1vdXNld2hlZWwgPSBldmVudCA9PiBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgIHRoaXMub25tb3VzZWRvd24gPSAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmZpbmRJdGVtKGV2ZW50KVxuICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5kYXRhc2V0ICYmIGl0ZW0uZGF0YXNldC5pbmRleCkge1xuICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSBpdGVtLmRhdGFzZXQuaW5kZXhcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLm9ubW91c2V1cCA9IChldmVudCkgPT4ge1xuICAgICAgY29uc3QgaXRlbSA9IHRoaXMuZmluZEl0ZW0oZXZlbnQpXG4gICAgICBpZiAoaXRlbSAmJiBpdGVtLmRhdGFzZXQgJiYgaXRlbS5kYXRhc2V0LmluZGV4KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgICAgIHRoaXMuY29uZmlybVNlbGVjdGlvbigpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZmluZEl0ZW0gKGV2ZW50KSB7XG4gICAgbGV0IGl0ZW0gPSBldmVudC50YXJnZXRcbiAgICB3aGlsZSAoaXRlbS50YWdOYW1lICE9PSAnTEknICYmIGl0ZW0gIT09IHRoaXMpIHsgaXRlbSA9IGl0ZW0ucGFyZW50Tm9kZSB9XG4gICAgaWYgKGl0ZW0udGFnTmFtZSA9PT0gJ0xJJykgeyByZXR1cm4gaXRlbSB9XG4gIH1cblxuICB1cGRhdGVEZXNjcmlwdGlvbiAoaXRlbSkge1xuICAgIGlmICghaXRlbSkge1xuICAgICAgaWYgKHRoaXMubW9kZWwgJiYgdGhpcy5tb2RlbC5pdGVtcykge1xuICAgICAgICBpdGVtID0gdGhpcy5tb2RlbC5pdGVtc1t0aGlzLnNlbGVjdGVkSW5kZXhdXG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaXRlbSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKGl0ZW0uZGVzY3JpcHRpb25NYXJrZG93biAmJiBpdGVtLmRlc2NyaXB0aW9uTWFya2Rvd24ubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRlbnQuaW5uZXJIVE1MID0gbWFya2VkLnBhcnNlKGl0ZW0uZGVzY3JpcHRpb25NYXJrZG93biwge3Nhbml0aXplOiB0cnVlfSlcbiAgICAgIHRoaXMuc2V0RGVzY3JpcHRpb25Nb3JlTGluayhpdGVtKVxuICAgIH0gZWxzZSBpZiAoaXRlbS5kZXNjcmlwdGlvbiAmJiBpdGVtLmRlc2NyaXB0aW9uLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Db250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Db250ZW50LnRleHRDb250ZW50ID0gaXRlbS5kZXNjcmlwdGlvblxuICAgICAgdGhpcy5zZXREZXNjcmlwdGlvbk1vcmVMaW5rKGl0ZW0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Db250YWluZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgIH1cbiAgfVxuXG4gIHNldERlc2NyaXB0aW9uTW9yZUxpbmsgKGl0ZW0pIHtcbiAgICBpZiAoKGl0ZW0uZGVzY3JpcHRpb25Nb3JlVVJMICE9IG51bGwpICYmIChpdGVtLmRlc2NyaXB0aW9uTW9yZVVSTC5sZW5ndGggIT0gbnVsbCkpIHtcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Nb3JlTGluay5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZSdcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Nb3JlTGluay5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBpdGVtLmRlc2NyaXB0aW9uTW9yZVVSTClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbk1vcmVMaW5rLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICAgIHRoaXMuZGVzY3JpcHRpb25Nb3JlTGluay5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCAnIycpXG4gICAgfVxuICB9XG5cbiAgaXRlbXNDaGFuZ2VkICgpIHtcbiAgICBpZiAodGhpcy5tb2RlbCAmJiB0aGlzLm1vZGVsLml0ZW1zICYmIHRoaXMubW9kZWwuaXRlbXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZW5kZXIoKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXR1cm5JdGVtc1RvUG9vbCgwKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgdGhpcy5ub25EZWZhdWx0SW5kZXggPSBmYWxzZVxuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IC0xXG4gICAgaWYgKGF0b20udmlld3MucG9sbEFmdGVyTmV4dFVwZGF0ZSkge1xuICAgICAgYXRvbS52aWV3cy5wb2xsQWZ0ZXJOZXh0VXBkYXRlKClcbiAgICB9XG5cbiAgICBhdG9tLnZpZXdzLnVwZGF0ZURvY3VtZW50KHRoaXMucmVuZGVySXRlbXMuYmluZCh0aGlzKSlcbiAgICByZXR1cm4gYXRvbS52aWV3cy5yZWFkRG9jdW1lbnQodGhpcy5yZWFkVUlQcm9wc0Zyb21ET00uYmluZCh0aGlzKSlcbiAgfVxuXG4gIGFkZEFjdGl2ZUNsYXNzVG9FZGl0b3IgKCkge1xuICAgIGxldCBhY3RpdmVFZGl0b3JcbiAgICBpZiAodGhpcy5tb2RlbCkge1xuICAgICAgYWN0aXZlRWRpdG9yID0gdGhpcy5tb2RlbC5hY3RpdmVFZGl0b3JcbiAgICB9XG4gICAgY29uc3QgZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhhY3RpdmVFZGl0b3IpXG4gICAgaWYgKGVkaXRvckVsZW1lbnQgJiYgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICAgIGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYXV0b2NvbXBsZXRlLWFjdGl2ZScpXG4gICAgfVxuXG4gICAgdGhpcy5hY3RpdmVDbGFzc0Rpc3Bvc2FibGUgPSBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICBpZiAoZWRpdG9yRWxlbWVudCAmJiBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdCkge1xuICAgICAgICBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2F1dG9jb21wbGV0ZS1hY3RpdmUnKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uVXAgKCkge1xuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggPiAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KHRoaXMuc2VsZWN0ZWRJbmRleCAtIDEpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgodGhpcy52aXNpYmxlSXRlbXMoKS5sZW5ndGggLSAxKVxuICAgIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25Eb3duICgpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4IDwgKHRoaXMudmlzaWJsZUl0ZW1zKCkubGVuZ3RoIC0gMSkpIHtcbiAgICAgIHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgodGhpcy5zZWxlY3RlZEluZGV4ICsgMSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleCgwKVxuICAgIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25QYWdlVXAgKCkge1xuICAgIGNvbnN0IG5ld0luZGV4ID0gTWF0aC5tYXgoMCwgdGhpcy5zZWxlY3RlZEluZGV4IC0gdGhpcy5tYXhWaXNpYmxlU3VnZ2VzdGlvbnMpXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRJbmRleCAhPT0gbmV3SW5kZXgpIHsgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleChuZXdJbmRleCkgfVxuICB9XG5cbiAgbW92ZVNlbGVjdGlvblBhZ2VEb3duICgpIHtcbiAgICBjb25zdCBpdGVtc0xlbmd0aCA9IHRoaXMudmlzaWJsZUl0ZW1zKCkubGVuZ3RoXG4gICAgY29uc3QgbmV3SW5kZXggPSBNYXRoLm1pbihpdGVtc0xlbmd0aCAtIDEsIHRoaXMuc2VsZWN0ZWRJbmRleCArIHRoaXMubWF4VmlzaWJsZVN1Z2dlc3Rpb25zKVxuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IG5ld0luZGV4KSB7IHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgobmV3SW5kZXgpIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25Ub1RvcCAoKSB7XG4gICAgY29uc3QgbmV3SW5kZXggPSAwXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRJbmRleCAhPT0gbmV3SW5kZXgpIHsgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleChuZXdJbmRleCkgfVxuICB9XG5cbiAgbW92ZVNlbGVjdGlvblRvQm90dG9tICgpIHtcbiAgICBjb25zdCBuZXdJbmRleCA9IHRoaXMudmlzaWJsZUl0ZW1zKCkubGVuZ3RoIC0gMVxuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IG5ld0luZGV4KSB7IHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgobmV3SW5kZXgpIH1cbiAgfVxuXG4gIHNldFNlbGVjdGVkSW5kZXggKGluZGV4KSB7XG4gICAgdGhpcy5ub25EZWZhdWx0SW5kZXggPSB0cnVlXG4gICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gaW5kZXhcblxuXHR0aGlzLm1vZGVsLnJlcGxhY2UodGhpcy5nZXRTZWxlY3RlZEl0ZW0oKSk7XG5cbiAgICByZXR1cm4gYXRvbS52aWV3cy51cGRhdGVEb2N1bWVudCh0aGlzLnJlbmRlclNlbGVjdGVkSXRlbS5iaW5kKHRoaXMpKVxuICB9XG5cbiAgdmlzaWJsZUl0ZW1zICgpIHtcbiAgICBpZiAodGhpcy5tb2RlbCAmJiB0aGlzLm1vZGVsLml0ZW1zKSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5pdGVtcy5zbGljZSgwLCB0aGlzLm1heEl0ZW1zKVxuICAgIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IEdldCB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW1cbiAgLy9cbiAgLy8gUmV0dXJucyB0aGUgc2VsZWN0ZWQge09iamVjdH1cbiAgZ2V0U2VsZWN0ZWRJdGVtICgpIHtcbiAgICBpZiAodGhpcy5tb2RlbCAmJiB0aGlzLm1vZGVsLml0ZW1zKSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5pdGVtc1t0aGlzLnNlbGVjdGVkSW5kZXhdXG4gICAgfVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogQ29uZmlybXMgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBpdGVtIG9yIGNhbmNlbHMgdGhlIGxpc3Qgdmlld1xuICAvLyBpZiBubyBpdGVtIGhhcyBiZWVuIHNlbGVjdGVkXG4gIGNvbmZpcm1TZWxlY3Rpb24gKGtleXN0cm9rZSkge1xuICAgIGlmICghdGhpcy5tb2RlbC5pc0FjdGl2ZSgpKSB7IHJldHVybiB9XG4gICAgY29uc3QgaXRlbSA9IHRoaXMuZ2V0U2VsZWN0ZWRJdGVtKClcbiAgICBpZiAoaXRlbSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5jb25maXJtKGl0ZW0sIGtleXN0cm9rZSlcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMubW9kZWwuY2FuY2VsKClcbiAgICB9XG4gIH1cblxuICAvLyBQcml2YXRlOiBDb25maXJtcyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW0gb25seSBpZiBpdCBpcyBub3QgdGhlIGRlZmF1bHRcbiAgLy8gaXRlbSBvciBjYW5jZWxzIHRoZSB2aWV3IGlmIG5vbmUgaGFzIGJlZW4gc2VsZWN0ZWQuXG4gIGNvbmZpcm1TZWxlY3Rpb25JZk5vbkRlZmF1bHQgKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLm1vZGVsLmlzQWN0aXZlKCkpIHsgcmV0dXJuIH1cbiAgICBpZiAodGhpcy5ub25EZWZhdWx0SW5kZXgpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbmZpcm1TZWxlY3Rpb24oKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm1vZGVsLmNhbmNlbCgpXG4gICAgICByZXR1cm4gZXZlbnQuYWJvcnRLZXlCaW5kaW5nKClcbiAgICB9XG4gIH1cblxuICByZW5kZXJMaXN0ICgpIHtcbiAgICB0aGlzLmlubmVySFRNTCA9IExpc3RUZW1wbGF0ZVxuICAgIHRoaXMub2wgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5saXN0LWdyb3VwJylcbiAgICB0aGlzLnNjcm9sbGVyID0gdGhpcy5xdWVyeVNlbGVjdG9yKCcuc3VnZ2VzdGlvbi1saXN0LXNjcm9sbGVyJylcbiAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGFpbmVyID0gdGhpcy5xdWVyeVNlbGVjdG9yKCcuc3VnZ2VzdGlvbi1kZXNjcmlwdGlvbicpXG4gICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRlbnQgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5zdWdnZXN0aW9uLWRlc2NyaXB0aW9uLWNvbnRlbnQnKVxuICAgIHRoaXMuZGVzY3JpcHRpb25Nb3JlTGluayA9IHRoaXMucXVlcnlTZWxlY3RvcignLnN1Z2dlc3Rpb24tZGVzY3JpcHRpb24tbW9yZS1saW5rJylcbiAgfVxuXG4gIHJlbmRlckl0ZW1zICgpIHtcbiAgICBsZXQgbGVmdFxuICAgIHRoaXMuc3R5bGUud2lkdGggPSBudWxsXG4gICAgY29uc3QgaXRlbXMgPSAobGVmdCA9IHRoaXMudmlzaWJsZUl0ZW1zKCkpICE9IG51bGwgPyBsZWZ0IDogW11cbiAgICBsZXQgbG9uZ2VzdERlc2MgPSAwXG4gICAgbGV0IGxvbmdlc3REZXNjSW5kZXggPSBudWxsXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGl0ZW1zLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY29uc3QgaXRlbSA9IGl0ZW1zW2luZGV4XVxuICAgICAgdGhpcy5yZW5kZXJJdGVtKGl0ZW0sIGluZGV4KVxuICAgICAgY29uc3QgZGVzY0xlbmd0aCA9IHRoaXMuZGVzY3JpcHRpb25MZW5ndGgoaXRlbSlcbiAgICAgIGlmIChkZXNjTGVuZ3RoID4gbG9uZ2VzdERlc2MpIHtcbiAgICAgICAgbG9uZ2VzdERlc2MgPSBkZXNjTGVuZ3RoXG4gICAgICAgIGxvbmdlc3REZXNjSW5kZXggPSBpbmRleFxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnVwZGF0ZURlc2NyaXB0aW9uKGl0ZW1zW2xvbmdlc3REZXNjSW5kZXhdKVxuICAgIHJldHVybiB0aGlzLnJldHVybkl0ZW1zVG9Qb29sKGl0ZW1zLmxlbmd0aClcbiAgfVxuXG4gIHJldHVybkl0ZW1zVG9Qb29sIChwaXZvdEluZGV4KSB7XG4gICAgaWYgKCF0aGlzLm9sKSB7IHJldHVybiB9XG5cbiAgICBsZXQgbGkgPSB0aGlzLm9sLmNoaWxkTm9kZXNbcGl2b3RJbmRleF1cbiAgICB3aGlsZSAoKHRoaXMub2wgIT0gbnVsbCkgJiYgbGkpIHtcbiAgICAgIGxpLnJlbW92ZSgpXG4gICAgICB0aGlzLm5vZGVQb29sLnB1c2gobGkpXG4gICAgICBsaSA9IHRoaXMub2wuY2hpbGROb2Rlc1twaXZvdEluZGV4XVxuICAgIH1cbiAgfVxuXG4gIGRlc2NyaXB0aW9uTGVuZ3RoIChpdGVtKSB7XG4gICAgbGV0IGNvdW50ID0gMFxuICAgIGlmIChpdGVtLmRlc2NyaXB0aW9uICE9IG51bGwpIHtcbiAgICAgIGNvdW50ICs9IGl0ZW0uZGVzY3JpcHRpb24ubGVuZ3RoXG4gICAgfVxuICAgIGlmIChpdGVtLmRlc2NyaXB0aW9uTW9yZVVSTCAhPSBudWxsKSB7XG4gICAgICBjb3VudCArPSA2XG4gICAgfVxuICAgIHJldHVybiBjb3VudFxuICB9XG5cbiAgcmVuZGVyU2VsZWN0ZWRJdGVtICgpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZExpICYmIHRoaXMuc2VsZWN0ZWRMaS5jbGFzc0xpc3QpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRMaS5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpXG4gICAgfVxuXG4gICAgdGhpcy5zZWxlY3RlZExpID0gdGhpcy5vbC5jaGlsZE5vZGVzW3RoaXMuc2VsZWN0ZWRJbmRleF1cbiAgICBpZiAodGhpcy5zZWxlY3RlZExpICE9IG51bGwpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWRMaS5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpXG4gICAgICB0aGlzLnNjcm9sbFNlbGVjdGVkSXRlbUludG9WaWV3KClcbiAgICAgIHJldHVybiB0aGlzLnVwZGF0ZURlc2NyaXB0aW9uKClcbiAgICB9XG4gIH1cblxuICAvLyBUaGlzIGlzIHJlYWRpbmcgdGhlIERPTSBpbiB0aGUgdXBkYXRlRE9NIGN5Y2xlLiBJZiB3ZSBkb250LCB0aGVyZSBpcyBhIGZsaWNrZXIgOi9cbiAgc2Nyb2xsU2VsZWN0ZWRJdGVtSW50b1ZpZXcgKCkge1xuICAgIGNvbnN0IHsgc2Nyb2xsVG9wIH0gPSB0aGlzLnNjcm9sbGVyXG4gICAgY29uc3Qgc2VsZWN0ZWRJdGVtVG9wID0gdGhpcy5zZWxlY3RlZExpLm9mZnNldFRvcFxuICAgIGlmIChzZWxlY3RlZEl0ZW1Ub3AgPCBzY3JvbGxUb3ApIHtcbiAgICAgIC8vIHNjcm9sbCB1cFxuICAgICAgdGhpcy5zY3JvbGxlci5zY3JvbGxUb3AgPSBzZWxlY3RlZEl0ZW1Ub3BcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgaXRlbUhlaWdodCB9ID0gdGhpcy51aVByb3BzXG4gICAgY29uc3Qgc2Nyb2xsZXJIZWlnaHQgPSAodGhpcy5tYXhWaXNpYmxlU3VnZ2VzdGlvbnMgKiBpdGVtSGVpZ2h0KSArIHRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0XG4gICAgaWYgKHNlbGVjdGVkSXRlbVRvcCArIGl0ZW1IZWlnaHQgPiBzY3JvbGxUb3AgKyBzY3JvbGxlckhlaWdodCkge1xuICAgICAgLy8gc2Nyb2xsIGRvd25cbiAgICAgIHRoaXMuc2Nyb2xsZXIuc2Nyb2xsVG9wID0gKHNlbGVjdGVkSXRlbVRvcCAtIHNjcm9sbGVySGVpZ2h0KSArIGl0ZW1IZWlnaHRcbiAgICB9XG4gIH1cblxuICByZWFkVUlQcm9wc0Zyb21ET00gKCkge1xuICAgIGxldCB3b3JkQ29udGFpbmVyXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRMaSkge1xuICAgICAgd29yZENvbnRhaW5lciA9IHRoaXMuc2VsZWN0ZWRMaS5xdWVyeVNlbGVjdG9yKCcud29yZC1jb250YWluZXInKVxuICAgIH1cblxuICAgIGlmICghdGhpcy51aVByb3BzKSB7IHRoaXMudWlQcm9wcyA9IHt9IH1cbiAgICB0aGlzLnVpUHJvcHMud2lkdGggPSB0aGlzLm9mZnNldFdpZHRoICsgMVxuICAgIHRoaXMudWlQcm9wcy5tYXJnaW5MZWZ0ID0gMFxuICAgIGlmICh3b3JkQ29udGFpbmVyICYmIHdvcmRDb250YWluZXIub2Zmc2V0TGVmdCkge1xuICAgICAgdGhpcy51aVByb3BzLm1hcmdpbkxlZnQgPSAtd29yZENvbnRhaW5lci5vZmZzZXRMZWZ0XG4gICAgfVxuICAgIGlmICghdGhpcy51aVByb3BzLml0ZW1IZWlnaHQpIHtcblx0ICBpZiAodGhpcy5zZWxlY3RlZExpKSB7XG5cdCAgICB0aGlzLnVpUHJvcHMuaXRlbUhlaWdodCA9IHRoaXMuc2VsZWN0ZWRMaS5vZmZzZXRIZWlnaHRcblx0ICB9XG4gICAgfVxuICAgIGlmICghdGhpcy51aVByb3BzLnBhZGRpbmdIZWlnaHQpIHtcbiAgICAgIHRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0ID0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzKVsncGFkZGluZy10b3AnXSkgKyBwYXJzZUludChnZXRDb21wdXRlZFN0eWxlKHRoaXMpWydwYWRkaW5nLWJvdHRvbSddKVxuICAgICAgaWYgKCF0aGlzLnVpUHJvcHMucGFkZGluZ0hlaWdodCkge1xuICAgICAgICB0aGlzLnVpUHJvcHMucGFkZGluZ0hlaWdodCA9IDBcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgVUkgZHVyaW5nIHRoaXMgcmVhZCwgc28gdGhhdCB3aGVuIHBvbGxpbmcgdGhlIGRvY3VtZW50IHRoZSBsYXRlc3RcbiAgICAvLyBjaGFuZ2VzIGNhbiBiZSBwaWNrZWQgdXAuXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlVUlGb3JDaGFuZ2VkUHJvcHMoKVxuICB9XG5cbiAgdXBkYXRlVUlGb3JDaGFuZ2VkUHJvcHMgKCkge1xuICAgIHRoaXMuc2Nyb2xsZXIuc3R5bGVbJ21heC1oZWlnaHQnXSA9IGAkeyh0aGlzLm1heFZpc2libGVTdWdnZXN0aW9ucyAqIHRoaXMudWlQcm9wcy5pdGVtSGVpZ2h0KSArIHRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0fXB4YFxuICAgIHRoaXMuc3R5bGUud2lkdGggPSBgJHt0aGlzLnVpUHJvcHMud2lkdGh9cHhgXG4gICAgaWYgKHRoaXMuc3VnZ2VzdGlvbkxpc3RGb2xsb3dzID09PSAnV29yZCcpIHtcbiAgICAgIHRoaXMuc3R5bGVbJ21hcmdpbi1sZWZ0J10gPSBgJHt0aGlzLnVpUHJvcHMubWFyZ2luTGVmdH1weGBcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlRGVzY3JpcHRpb24oKVxuICB9XG5cbiAgLy8gU3BsaXRzIHRoZSBjbGFzc2VzIG9uIHNwYWNlcyBzbyBhcyBub3QgdG8gYW5nZXIgdGhlIERPTSBnb2RzXG4gIGFkZENsYXNzVG9FbGVtZW50IChlbGVtZW50LCBjbGFzc05hbWVzKSB7XG4gICAgaWYgKCFjbGFzc05hbWVzKSB7IHJldHVybiB9XG4gICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXMuc3BsaXQoJyAnKVxuICAgIGlmIChjbGFzc2VzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IGNsYXNzTmFtZSA9IGNsYXNzZXNbaV1cbiAgICAgICAgY2xhc3NOYW1lID0gY2xhc3NOYW1lLnRyaW0oKVxuICAgICAgICBpZiAoY2xhc3NOYW1lKSB7IGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZW5kZXJJdGVtICh7aWNvbkhUTUwsIHR5cGUsIHNuaXBwZXQsIHRleHQsIGRpc3BsYXlUZXh0LCBjbGFzc05hbWUsIHJlcGxhY2VtZW50UHJlZml4LCBsZWZ0TGFiZWwsIGxlZnRMYWJlbEhUTUwsIHJpZ2h0TGFiZWwsIHJpZ2h0TGFiZWxIVE1MfSwgaW5kZXgpIHtcbiAgICBsZXQgbGkgPSB0aGlzLm9sLmNoaWxkTm9kZXNbaW5kZXhdXG4gICAgaWYgKCFsaSkge1xuICAgICAgaWYgKHRoaXMubm9kZXBvb2wgJiYgdGhpcy5ub2RlUG9vbC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpID0gdGhpcy5ub2RlUG9vbC5wb3AoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4gICAgICAgIGxpLmlubmVySFRNTCA9IEl0ZW1UZW1wbGF0ZVxuICAgICAgfVxuICAgICAgbGkuZGF0YXNldC5pbmRleCA9IGluZGV4XG4gICAgICB0aGlzLm9sLmFwcGVuZENoaWxkKGxpKVxuICAgIH1cblxuICAgIGxpLmNsYXNzTmFtZSA9ICcnXG4gICAgaWYgKGluZGV4ID09PSB0aGlzLnNlbGVjdGVkSW5kZXgpIHsgbGkuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKSB9XG4gICAgaWYgKGNsYXNzTmFtZSkgeyB0aGlzLmFkZENsYXNzVG9FbGVtZW50KGxpLCBjbGFzc05hbWUpIH1cbiAgICBpZiAoaW5kZXggPT09IHRoaXMuc2VsZWN0ZWRJbmRleCkgeyB0aGlzLnNlbGVjdGVkTGkgPSBsaSB9XG5cbiAgICBjb25zdCB0eXBlSWNvbkNvbnRhaW5lciA9IGxpLnF1ZXJ5U2VsZWN0b3IoJy5pY29uLWNvbnRhaW5lcicpXG4gICAgdHlwZUljb25Db250YWluZXIuaW5uZXJIVE1MID0gJydcblxuICAgIGNvbnN0IHNhbml0aXplZFR5cGUgPSBlc2NhcGVIdG1sKGlzU3RyaW5nKHR5cGUpID8gdHlwZSA6ICcnKVxuICAgIGNvbnN0IHNhbml0aXplZEljb25IVE1MID0gaXNTdHJpbmcoaWNvbkhUTUwpID8gaWNvbkhUTUwgOiB1bmRlZmluZWRcbiAgICBjb25zdCBkZWZhdWx0TGV0dGVySWNvbkhUTUwgPSBzYW5pdGl6ZWRUeXBlID8gYDxzcGFuIGNsYXNzPVwiaWNvbi1sZXR0ZXJcIj4ke3Nhbml0aXplZFR5cGVbMF19PC9zcGFuPmAgOiAnJ1xuICAgIGNvbnN0IGRlZmF1bHRJY29uSFRNTCA9IERlZmF1bHRTdWdnZXN0aW9uVHlwZUljb25IVE1MW3Nhbml0aXplZFR5cGVdICE9IG51bGwgPyBEZWZhdWx0U3VnZ2VzdGlvblR5cGVJY29uSFRNTFtzYW5pdGl6ZWRUeXBlXSA6IGRlZmF1bHRMZXR0ZXJJY29uSFRNTFxuICAgIGlmICgoc2FuaXRpemVkSWNvbkhUTUwgfHwgZGVmYXVsdEljb25IVE1MKSAmJiBpY29uSFRNTCAhPT0gZmFsc2UpIHtcbiAgICAgIHR5cGVJY29uQ29udGFpbmVyLmlubmVySFRNTCA9IEljb25UZW1wbGF0ZVxuICAgICAgY29uc3QgdHlwZUljb24gPSB0eXBlSWNvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzBdXG4gICAgICB0eXBlSWNvbi5pbm5lckhUTUwgPSBzYW5pdGl6ZWRJY29uSFRNTCAhPSBudWxsID8gc2FuaXRpemVkSWNvbkhUTUwgOiBkZWZhdWx0SWNvbkhUTUxcbiAgICAgIGlmICh0eXBlKSB7IHRoaXMuYWRkQ2xhc3NUb0VsZW1lbnQodHlwZUljb24sIHR5cGUpIH1cbiAgICB9XG5cbiAgICBjb25zdCB3b3JkU3BhbiA9IGxpLnF1ZXJ5U2VsZWN0b3IoJy53b3JkJylcbiAgICB3b3JkU3Bhbi5pbm5lckhUTUwgPSB0aGlzLmdldERpc3BsYXlIVE1MKHRleHQsIHNuaXBwZXQsIGRpc3BsYXlUZXh0LCByZXBsYWNlbWVudFByZWZpeClcblxuICAgIGNvbnN0IGxlZnRMYWJlbFNwYW4gPSBsaS5xdWVyeVNlbGVjdG9yKCcubGVmdC1sYWJlbCcpXG4gICAgaWYgKGxlZnRMYWJlbEhUTUwgIT0gbnVsbCkge1xuICAgICAgbGVmdExhYmVsU3Bhbi5pbm5lckhUTUwgPSBsZWZ0TGFiZWxIVE1MXG4gICAgfSBlbHNlIGlmIChsZWZ0TGFiZWwgIT0gbnVsbCkge1xuICAgICAgbGVmdExhYmVsU3Bhbi50ZXh0Q29udGVudCA9IGxlZnRMYWJlbFxuICAgIH0gZWxzZSB7XG4gICAgICBsZWZ0TGFiZWxTcGFuLnRleHRDb250ZW50ID0gJydcbiAgICB9XG5cbiAgICBjb25zdCByaWdodExhYmVsU3BhbiA9IGxpLnF1ZXJ5U2VsZWN0b3IoJy5yaWdodC1sYWJlbCcpXG4gICAgaWYgKHJpZ2h0TGFiZWxIVE1MICE9IG51bGwpIHtcbiAgICAgIHJpZ2h0TGFiZWxTcGFuLmlubmVySFRNTCA9IHJpZ2h0TGFiZWxIVE1MXG4gICAgfSBlbHNlIGlmIChyaWdodExhYmVsICE9IG51bGwpIHtcbiAgICAgIHJpZ2h0TGFiZWxTcGFuLnRleHRDb250ZW50ID0gcmlnaHRMYWJlbFxuICAgIH0gZWxzZSB7XG4gICAgICByaWdodExhYmVsU3Bhbi50ZXh0Q29udGVudCA9ICcnXG4gICAgfVxuICB9XG5cbiAgZ2V0RGlzcGxheUhUTUwgKHRleHQsIHNuaXBwZXQsIGRpc3BsYXlUZXh0LCByZXBsYWNlbWVudFByZWZpeCkge1xuICAgIGxldCByZXBsYWNlbWVudFRleHQgPSB0ZXh0XG4gICAgbGV0IHNuaXBwZXRJbmRpY2VzXG4gICAgaWYgKHR5cGVvZiBkaXNwbGF5VGV4dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJlcGxhY2VtZW50VGV4dCA9IGRpc3BsYXlUZXh0XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc25pcHBldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJlcGxhY2VtZW50VGV4dCA9IHRoaXMucmVtb3ZlRW1wdHlTbmlwcGV0cyhzbmlwcGV0KVxuICAgICAgY29uc3Qgc25pcHBldHMgPSB0aGlzLnNuaXBwZXRQYXJzZXIuZmluZFNuaXBwZXRzKHJlcGxhY2VtZW50VGV4dClcbiAgICAgIHJlcGxhY2VtZW50VGV4dCA9IHRoaXMucmVtb3ZlU25pcHBldHNGcm9tVGV4dChzbmlwcGV0cywgcmVwbGFjZW1lbnRUZXh0KVxuICAgICAgc25pcHBldEluZGljZXMgPSB0aGlzLmZpbmRTbmlwcGV0SW5kaWNlcyhzbmlwcGV0cylcbiAgICB9XG4gICAgY29uc3QgY2hhcmFjdGVyTWF0Y2hJbmRpY2VzID0gdGhpcy5maW5kQ2hhcmFjdGVyTWF0Y2hJbmRpY2VzKHJlcGxhY2VtZW50VGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpXG5cbiAgICBsZXQgZGlzcGxheUhUTUwgPSAnJ1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCByZXBsYWNlbWVudFRleHQubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBpZiAoc25pcHBldEluZGljZXMgJiYgKHNuaXBwZXRJbmRpY2VzW2luZGV4XSA9PT0gU25pcHBldFN0YXJ0IHx8IHNuaXBwZXRJbmRpY2VzW2luZGV4XSA9PT0gU25pcHBldFN0YXJ0QW5kRW5kKSkge1xuICAgICAgICBkaXNwbGF5SFRNTCArPSAnPHNwYW4gY2xhc3M9XCJzbmlwcGV0LWNvbXBsZXRpb25cIj4nXG4gICAgICB9XG4gICAgICBpZiAoY2hhcmFjdGVyTWF0Y2hJbmRpY2VzICYmIGNoYXJhY3Rlck1hdGNoSW5kaWNlc1tpbmRleF0pIHtcbiAgICAgICAgZGlzcGxheUhUTUwgKz0gYDxzcGFuIGNsYXNzPVwiY2hhcmFjdGVyLW1hdGNoXCI+JHtlc2NhcGVIdG1sKHJlcGxhY2VtZW50VGV4dFtpbmRleF0pfTwvc3Bhbj5gXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaXNwbGF5SFRNTCArPSBlc2NhcGVIdG1sKHJlcGxhY2VtZW50VGV4dFtpbmRleF0pXG4gICAgICB9XG4gICAgICBpZiAoc25pcHBldEluZGljZXMgJiYgKHNuaXBwZXRJbmRpY2VzW2luZGV4XSA9PT0gU25pcHBldEVuZCB8fCBzbmlwcGV0SW5kaWNlc1tpbmRleF0gPT09IFNuaXBwZXRTdGFydEFuZEVuZCkpIHtcbiAgICAgICAgZGlzcGxheUhUTUwgKz0gJzwvc3Bhbj4nXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkaXNwbGF5SFRNTFxuICB9XG5cbiAgcmVtb3ZlRW1wdHlTbmlwcGV0cyAodGV4dCkge1xuICAgIGlmICghdGV4dCB8fCAhdGV4dC5sZW5ndGggfHwgdGV4dC5pbmRleE9mKCckJykgPT09IC0xKSB7IHJldHVybiB0ZXh0IH0gLy8gTm8gc25pcHBldHNcbiAgICByZXR1cm4gdGV4dC5yZXBsYWNlKHRoaXMuZW1wdHlTbmlwcGV0R3JvdXBSZWdleCwgJycpIC8vIFJlbW92ZSBhbGwgb2NjdXJyZW5jZXMgb2YgJDAgb3IgJHswfSBvciAkezA6fVxuICB9XG5cbiAgLy8gV2lsbCBjb252ZXJ0ICdhYmMoJHsxOmR9LCAkezI6ZX0pZicgPT4gJ2FiYyhkLCBlKWYnXG4gIC8vXG4gIC8vICogYHNuaXBwZXRzYCB7QXJyYXl9IGZyb20gYFNuaXBwZXRQYXJzZXIuZmluZFNuaXBwZXRzYFxuICAvLyAqIGB0ZXh0YCB7U3RyaW5nfSB0byByZW1vdmUgc25pcHBldHMgZnJvbVxuICAvL1xuICAvLyBSZXR1cm5zIHtTdHJpbmd9XG4gIHJlbW92ZVNuaXBwZXRzRnJvbVRleHQgKHNuaXBwZXRzLCB0ZXh0KSB7XG4gICAgaWYgKCF0ZXh0IHx8ICF0ZXh0Lmxlbmd0aCB8fCAhc25pcHBldHMgfHwgIXNuaXBwZXRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRleHRcbiAgICB9XG4gICAgbGV0IGluZGV4ID0gMFxuICAgIGxldCByZXN1bHQgPSAnJ1xuICAgIGZvciAoY29uc3Qge3NuaXBwZXRTdGFydCwgc25pcHBldEVuZCwgYm9keX0gb2Ygc25pcHBldHMpIHtcbiAgICAgIHJlc3VsdCArPSB0ZXh0LnNsaWNlKGluZGV4LCBzbmlwcGV0U3RhcnQpICsgYm9keVxuICAgICAgaW5kZXggPSBzbmlwcGV0RW5kICsgMVxuICAgIH1cbiAgICBpZiAoaW5kZXggIT09IHRleHQubGVuZ3RoKSB7XG4gICAgICByZXN1bHQgKz0gdGV4dC5zbGljZShpbmRleCwgdGV4dC5sZW5ndGgpXG4gICAgfVxuICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKHRoaXMuc2xhc2hlc0luU25pcHBldFJlZ2V4LCAnXFxcXCcpXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLy8gQ29tcHV0ZXMgdGhlIGluZGljZXMgb2Ygc25pcHBldHMgaW4gdGhlIHJlc3VsdGluZyBzdHJpbmcgZnJvbVxuICAvLyBgcmVtb3ZlU25pcHBldHNGcm9tVGV4dGAuXG4gIC8vXG4gIC8vICogYHNuaXBwZXRzYCB7QXJyYXl9IGZyb20gYFNuaXBwZXRQYXJzZXIuZmluZFNuaXBwZXRzYFxuICAvL1xuICAvLyBlLmcuIEEgcmVwbGFjZW1lbnQgb2YgJ2FiYygkezE6ZH0pZScgaXMgcmVwbGFjZWQgdG8gJ2FiYyhkKWUnIHdpbGwgcmVzdWx0IGluXG4gIC8vXG4gIC8vIGB7NDogU25pcHBldFN0YXJ0QW5kRW5kfWBcbiAgLy9cbiAgLy8gUmV0dXJucyB7T2JqZWN0fSBvZiB7aW5kZXg6IFNuaXBwZXRTdGFydHxFbmR8U3RhcnRBbmRFbmR9XG4gIGZpbmRTbmlwcGV0SW5kaWNlcyAoc25pcHBldHMpIHtcbiAgICBpZiAoIXNuaXBwZXRzKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgaW5kaWNlcyA9IHt9XG4gICAgbGV0IG9mZnNldEFjY3VtdWxhdG9yID0gMFxuICAgIGZvciAoY29uc3Qge3NuaXBwZXRTdGFydCwgc25pcHBldEVuZCwgYm9keX0gb2Ygc25pcHBldHMpIHtcbiAgICAgIGNvbnN0IGJvZHlMZW5ndGggPSBib2R5Lmxlbmd0aFxuICAgICAgY29uc3Qgc25pcHBldExlbmd0aCA9IChzbmlwcGV0RW5kIC0gc25pcHBldFN0YXJ0KSArIDFcbiAgICAgIGNvbnN0IHN0YXJ0SW5kZXggPSBzbmlwcGV0U3RhcnQgLSBvZmZzZXRBY2N1bXVsYXRvclxuICAgICAgY29uc3QgZW5kSW5kZXggPSAoc3RhcnRJbmRleCArIGJvZHlMZW5ndGgpIC0gMVxuICAgICAgb2Zmc2V0QWNjdW11bGF0b3IgKz0gc25pcHBldExlbmd0aCAtIGJvZHlMZW5ndGhcblxuICAgICAgaWYgKHN0YXJ0SW5kZXggPT09IGVuZEluZGV4KSB7XG4gICAgICAgIGluZGljZXNbc3RhcnRJbmRleF0gPSBTbmlwcGV0U3RhcnRBbmRFbmRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGljZXNbc3RhcnRJbmRleF0gPSBTbmlwcGV0U3RhcnRcbiAgICAgICAgaW5kaWNlc1tlbmRJbmRleF0gPSBTbmlwcGV0RW5kXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGljZXNcbiAgfVxuXG4gIC8vIEZpbmRzIHRoZSBpbmRpY2VzIG9mIHRoZSBjaGFycyBpbiB0ZXh0IHRoYXQgYXJlIG1hdGNoZWQgYnkgcmVwbGFjZW1lbnRQcmVmaXhcbiAgLy9cbiAgLy8gZS5nLiB0ZXh0ID0gJ2FiY2RlJywgcmVwbGFjZW1lbnRQcmVmaXggPSAnYWNkJyBXaWxsIHJlc3VsdCBpblxuICAvL1xuICAvLyB7MDogdHJ1ZSwgMjogdHJ1ZSwgMzogdHJ1ZX1cbiAgLy9cbiAgLy8gUmV0dXJucyBhbiB7T2JqZWN0fVxuICBmaW5kQ2hhcmFjdGVyTWF0Y2hJbmRpY2VzICh0ZXh0LCByZXBsYWNlbWVudFByZWZpeCkge1xuICAgIGlmICghdGV4dCB8fCAhdGV4dC5sZW5ndGggfHwgIXJlcGxhY2VtZW50UHJlZml4IHx8ICFyZXBsYWNlbWVudFByZWZpeC5sZW5ndGgpIHsgcmV0dXJuIH1cbiAgICBjb25zdCBtYXRjaGVzID0ge31cbiAgICBpZiAodGhpcy51c2VBbHRlcm5hdGVTY29yaW5nKSB7XG4gICAgICBjb25zdCBtYXRjaEluZGljZXMgPSBmdXp6YWxkcmluUGx1cy5tYXRjaCh0ZXh0LCByZXBsYWNlbWVudFByZWZpeClcbiAgICAgIGZvciAoY29uc3QgaSBvZiBtYXRjaEluZGljZXMpIHtcbiAgICAgICAgbWF0Y2hlc1tpXSA9IHRydWVcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHdvcmRJbmRleCA9IDBcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVwbGFjZW1lbnRQcmVmaXgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2ggPSByZXBsYWNlbWVudFByZWZpeFtpXVxuICAgICAgICB3aGlsZSAod29yZEluZGV4IDwgdGV4dC5sZW5ndGggJiYgdGV4dFt3b3JkSW5kZXhdLnRvTG93ZXJDYXNlKCkgIT09IGNoLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICB3b3JkSW5kZXggKz0gMVxuICAgICAgICB9XG4gICAgICAgIGlmICh3b3JkSW5kZXggPj0gdGV4dC5sZW5ndGgpIHsgYnJlYWsgfVxuICAgICAgICBtYXRjaGVzW3dvcmRJbmRleF0gPSB0cnVlXG4gICAgICAgIHdvcmRJbmRleCArPSAxXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRjaGVzXG4gIH1cblxuICBkaXNwb3NlICgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xuICAgICAgdGhpcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMpXG4gICAgfVxuICB9XG59XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9jb21wb25lbnQvZXNjYXBlLWh0bWwvYmxvYi9tYXN0ZXIvaW5kZXguanNcbmNvbnN0IGVzY2FwZUh0bWwgPSAoaHRtbCkgPT4ge1xuICByZXR1cm4gU3RyaW5nKGh0bWwpXG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgLnJlcGxhY2UoLycvZywgJyYjMzk7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxufVxuXG5leHBvcnQgZGVmYXVsdCBTdWdnZXN0aW9uTGlzdEVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLWxpc3QnLCB7cHJvdG90eXBlOiBTdWdnZXN0aW9uTGlzdEVsZW1lbnQucHJvdG90eXBlfSkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jbGFzcy1hc3NpZ25cbiJdfQ==