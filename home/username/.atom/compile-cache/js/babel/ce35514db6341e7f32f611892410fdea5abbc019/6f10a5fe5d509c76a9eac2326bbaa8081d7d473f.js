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
      var cPos = editor.getCursorBufferPosition();
      this.model.replaceTextWithMatch(this.getSelectedItem());
      editor.setCursorBufferPosition(cPos);

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvc3VnZ2VzdGlvbi1saXN0LWVsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7b0JBRWdELE1BQU07OzZCQUM1QixrQkFBa0I7Ozs7MkJBQ25CLGdCQUFnQjs7OEJBQ2QsaUJBQWlCOzs7O3NCQUN6QixRQUFROzs7O0FBTjNCLFdBQVcsQ0FBQTs7QUFRWCxJQUFNLFlBQVksOExBS2tCLENBQUE7O0FBRXBDLElBQU0sWUFBWSx3UUFNVCxDQUFBOztBQUVULElBQU0sWUFBWSxHQUFHLHNCQUFzQixDQUFBOztBQUUzQyxJQUFNLDZCQUE2QixHQUFHO0FBQ3BDLFdBQVMsRUFBRSxpQ0FBaUM7QUFDNUMsVUFBUSxFQUFFLDhCQUE4QjtBQUN4QyxXQUFTLEVBQUUsOEJBQThCO0FBQ3pDLFVBQVEsRUFBRSw4QkFBOEI7QUFDeEMsV0FBUyxFQUFFLDhCQUE4QjtBQUN6QyxPQUFLLEVBQUUsMkJBQTJCO0FBQ2xDLGFBQVcsRUFBRSwwQkFBMEI7Q0FDeEMsQ0FBQTs7QUFFRCxJQUFNLFlBQVksR0FBRyxDQUFDLENBQUE7QUFDdEIsSUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFBO0FBQ3BCLElBQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFBOztJQUV0QixxQkFBcUI7WUFBckIscUJBQXFCOztXQUFyQixxQkFBcUI7MEJBQXJCLHFCQUFxQjs7K0JBQXJCLHFCQUFxQjs7Ozs7ZUFBckIscUJBQXFCOztXQUNULDJCQUFHO0FBQ2pCLFVBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFBO0FBQ25CLFVBQUksQ0FBQyxzQkFBc0IsR0FBRyxvQ0FBb0MsQ0FBQTtBQUNsRSxVQUFJLENBQUMscUJBQXFCLEdBQUcsT0FBTyxDQUFBO0FBQ3BDLFVBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFBO0FBQ3BCLFVBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7QUFDOUMsVUFB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Q0FBQyxlQUFlLENBQUMsOEJBQThCLEVBQUUsRUFBQyxTQUFTLEVBQUUscUJBQXFCLENBQUMsU0FBUyxFQUFDLENBQUMiLCJmaWxlIjoiL2hvbWUvamFtZXMvZ2l0aHViL2F1dG9jb21wbGV0ZS1wbHVzL2xpYi9zdWdnZXN0aW9uLWxpc3QtZWxlbWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnXG5cbmltcG9ydCB7IERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJ1xuaW1wb3J0IFNuaXBwZXRQYXJzZXIgZnJvbSAnLi9zbmlwcGV0LXBhcnNlcidcbmltcG9ydCB7IGlzU3RyaW5nIH0gZnJvbSAnLi90eXBlLWhlbHBlcnMnXG5pbXBvcnQgZnV6emFsZHJpblBsdXMgZnJvbSAnZnV6emFsZHJpbi1wbHVzJ1xuaW1wb3J0IG1hcmtlZCBmcm9tICdtYXJrZWQnXG5cbmNvbnN0IEl0ZW1UZW1wbGF0ZSA9IGA8c3BhbiBjbGFzcz1cImljb24tY29udGFpbmVyXCI+PC9zcGFuPlxuICA8c3BhbiBjbGFzcz1cImxlZnQtbGFiZWxcIj48L3NwYW4+XG4gIDxzcGFuIGNsYXNzPVwid29yZC1jb250YWluZXJcIj5cbiAgICA8c3BhbiBjbGFzcz1cIndvcmRcIj48L3NwYW4+XG4gIDwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJyaWdodC1sYWJlbFwiPjwvc3Bhbj5gXG5cbmNvbnN0IExpc3RUZW1wbGF0ZSA9IGA8ZGl2IGNsYXNzPVwic3VnZ2VzdGlvbi1saXN0LXNjcm9sbGVyXCI+XG4gICAgPG9sIGNsYXNzPVwibGlzdC1ncm91cFwiPjwvb2w+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwic3VnZ2VzdGlvbi1kZXNjcmlwdGlvblwiPlxuICAgIDxzcGFuIGNsYXNzPVwic3VnZ2VzdGlvbi1kZXNjcmlwdGlvbi1jb250ZW50XCI+PC9zcGFuPlxuICAgIDxhIGNsYXNzPVwic3VnZ2VzdGlvbi1kZXNjcmlwdGlvbi1tb3JlLWxpbmtcIiBocmVmPVwiI1wiPk1vcmUuLjwvYT5cbiAgPC9kaXY+YFxuXG5jb25zdCBJY29uVGVtcGxhdGUgPSAnPGkgY2xhc3M9XCJpY29uXCI+PC9pPidcblxuY29uc3QgRGVmYXVsdFN1Z2dlc3Rpb25UeXBlSWNvbkhUTUwgPSB7XG4gICdzbmlwcGV0JzogJzxpIGNsYXNzPVwiaWNvbi1tb3ZlLXJpZ2h0XCI+PC9pPicsXG4gICdpbXBvcnQnOiAnPGkgY2xhc3M9XCJpY29uLXBhY2thZ2VcIj48L2k+JyxcbiAgJ3JlcXVpcmUnOiAnPGkgY2xhc3M9XCJpY29uLXBhY2thZ2VcIj48L2k+JyxcbiAgJ21vZHVsZSc6ICc8aSBjbGFzcz1cImljb24tcGFja2FnZVwiPjwvaT4nLFxuICAncGFja2FnZSc6ICc8aSBjbGFzcz1cImljb24tcGFja2FnZVwiPjwvaT4nLFxuICAndGFnJzogJzxpIGNsYXNzPVwiaWNvbi1jb2RlXCI+PC9pPicsXG4gICdhdHRyaWJ1dGUnOiAnPGkgY2xhc3M9XCJpY29uLXRhZ1wiPjwvaT4nXG59XG5cbmNvbnN0IFNuaXBwZXRTdGFydCA9IDFcbmNvbnN0IFNuaXBwZXRFbmQgPSAyXG5jb25zdCBTbmlwcGV0U3RhcnRBbmRFbmQgPSAzXG5cbmNsYXNzIFN1Z2dlc3Rpb25MaXN0RWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgY3JlYXRlZENhbGxiYWNrICgpIHtcbiAgICB0aGlzLm1heEl0ZW1zID0gMjAwXG4gICAgdGhpcy5lbXB0eVNuaXBwZXRHcm91cFJlZ2V4ID0gLyhcXCRcXHtcXGQrOlxcfSl8KFxcJFxce1xcZCtcXH0pfChcXCRcXGQrKS9pZ1xuICAgIHRoaXMuc2xhc2hlc0luU25pcHBldFJlZ2V4ID0gL1xcXFxcXFxcL2dcbiAgICB0aGlzLm5vZGVQb29sID0gbnVsbFxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLmNsYXNzTGlzdC5hZGQoJ3BvcG92ZXItbGlzdCcsICdzZWxlY3QtbGlzdCcsICdhdXRvY29tcGxldGUtc3VnZ2VzdGlvbi1saXN0JylcbiAgICB0aGlzLnJlZ2lzdGVyTW91c2VIYW5kbGluZygpXG4gICAgdGhpcy5zbmlwcGV0UGFyc2VyID0gbmV3IFNuaXBwZXRQYXJzZXIoKVxuICAgIHRoaXMubm9kZVBvb2wgPSBbXVxuICB9XG5cbiAgYXR0YWNoZWRDYWxsYmFjayAoKSB7XG4gICAgLy8gVE9ETzogRml4IG92ZXJsYXkgZGVjb3JhdG9yIHRvIGluIGF0b20gdG8gYXBwbHkgY2xhc3MgYXR0cmlidXRlIGNvcnJlY3RseSwgdGhlbiBtb3ZlIHRoaXMgdG8gb3ZlcmxheSBjcmVhdGlvbiBwb2ludC5cbiAgICB0aGlzLnBhcmVudEVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnYXV0b2NvbXBsZXRlLXBsdXMnKVxuICAgIHRoaXMuYWRkQWN0aXZlQ2xhc3NUb0VkaXRvcigpXG4gICAgaWYgKCF0aGlzLm9sKSB7IHRoaXMucmVuZGVyTGlzdCgpIH1cbiAgICByZXR1cm4gdGhpcy5pdGVtc0NoYW5nZWQoKVxuICB9XG5cbiAgZGV0YWNoZWRDYWxsYmFjayAoKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlQ2xhc3NEaXNwb3NhYmxlICYmIHRoaXMuYWN0aXZlQ2xhc3NEaXNwb3NhYmxlLmRpc3Bvc2UpIHtcbiAgICAgIHRoaXMuYWN0aXZlQ2xhc3NEaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgIH1cbiAgfVxuXG4gIGluaXRpYWxpemUgKG1vZGVsKSB7XG4gICAgdGhpcy5tb2RlbCA9IG1vZGVsXG4gICAgaWYgKHRoaXMubW9kZWwgPT0gbnVsbCkgeyByZXR1cm4gfVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZENoYW5nZUl0ZW1zKHRoaXMuaXRlbXNDaGFuZ2VkLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZFNlbGVjdE5leHQodGhpcy5tb3ZlU2VsZWN0aW9uRG93bi5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3RQcmV2aW91cyh0aGlzLm1vdmVTZWxlY3Rpb25VcC5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3RQYWdlVXAodGhpcy5tb3ZlU2VsZWN0aW9uUGFnZVVwLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZFNlbGVjdFBhZ2VEb3duKHRoaXMubW92ZVNlbGVjdGlvblBhZ2VEb3duLmJpbmQodGhpcykpKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5tb2RlbC5vbkRpZFNlbGVjdFRvcCh0aGlzLm1vdmVTZWxlY3Rpb25Ub1RvcC5iaW5kKHRoaXMpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMubW9kZWwub25EaWRTZWxlY3RCb3R0b20odGhpcy5tb3ZlU2VsZWN0aW9uVG9Cb3R0b20uYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkQ29uZmlybVNlbGVjdGlvbih0aGlzLmNvbmZpcm1TZWxlY3Rpb24uYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdCh0aGlzLmNvbmZpcm1TZWxlY3Rpb25JZk5vbkRlZmF1bHQuYmluZCh0aGlzKSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0aGlzLm1vZGVsLm9uRGlkRGlzcG9zZSh0aGlzLmRpc3Bvc2UuYmluZCh0aGlzKSkpXG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLnN1Z2dlc3Rpb25MaXN0Rm9sbG93cycsIHN1Z2dlc3Rpb25MaXN0Rm9sbG93cyA9PiB7XG4gICAgICB0aGlzLnN1Z2dlc3Rpb25MaXN0Rm9sbG93cyA9IHN1Z2dlc3Rpb25MaXN0Rm9sbG93c1xuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMubWF4VmlzaWJsZVN1Z2dlc3Rpb25zJywgbWF4VmlzaWJsZVN1Z2dlc3Rpb25zID0+IHtcbiAgICAgIHRoaXMubWF4VmlzaWJsZVN1Z2dlc3Rpb25zID0gbWF4VmlzaWJsZVN1Z2dlc3Rpb25zXG4gICAgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdhdXRvY29tcGxldGUtcGx1cy51c2VBbHRlcm5hdGVTY29yaW5nJywgdXNlQWx0ZXJuYXRlU2NvcmluZyA9PiB7XG4gICAgICB0aGlzLnVzZUFsdGVybmF0ZVNjb3JpbmcgPSB1c2VBbHRlcm5hdGVTY29yaW5nXG4gICAgfSkpXG5cdHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5rZXltYXBzLm9uRGlkRmFpbFRvTWF0Y2hCaW5kaW5nKGtleXN0cm9rZXMgPT4ge1xuXHRcdGlmICh0aGlzLnNlbGVjdGVkSW5kZXggPT09IDApXG5cdFx0XHR0aGlzLmNvbmZpcm1TZWxlY3Rpb24oa2V5c3Ryb2tlcylcblx0fSkpXG5cdFx0XHRcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gVGhpcyBzaG91bGQgYmUgdW5uZWNlc3NhcnkgYnV0IHRoZSBldmVudHMgd2UgbmVlZCB0byBvdmVycmlkZVxuICAvLyBhcmUgaGFuZGxlZCBhdCBhIGxldmVsIHRoYXQgY2FuJ3QgYmUgYmxvY2tlZCBieSByZWFjdCBzeW50aGV0aWNcbiAgLy8gZXZlbnRzIGJlY2F1c2UgdGhleSBhcmUgaGFuZGxlZCBhdCB0aGUgZG9jdW1lbnRcbiAgcmVnaXN0ZXJNb3VzZUhhbmRsaW5nICgpIHtcbiAgICB0aGlzLm9ubW91c2V3aGVlbCA9IGV2ZW50ID0+IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgdGhpcy5vbm1vdXNlZG93biA9IChldmVudCkgPT4ge1xuICAgICAgY29uc3QgaXRlbSA9IHRoaXMuZmluZEl0ZW0oZXZlbnQpXG4gICAgICBpZiAoaXRlbSAmJiBpdGVtLmRhdGFzZXQgJiYgaXRlbS5kYXRhc2V0LmluZGV4KSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IGl0ZW0uZGF0YXNldC5pbmRleFxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMub25tb3VzZXVwID0gKGV2ZW50KSA9PiB7XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5maW5kSXRlbShldmVudClcbiAgICAgIGlmIChpdGVtICYmIGl0ZW0uZGF0YXNldCAmJiBpdGVtLmRhdGFzZXQuaW5kZXgpIHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgICAgdGhpcy5jb25maXJtU2VsZWN0aW9uKClcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmaW5kSXRlbSAoZXZlbnQpIHtcbiAgICBsZXQgaXRlbSA9IGV2ZW50LnRhcmdldFxuICAgIHdoaWxlIChpdGVtLnRhZ05hbWUgIT09ICdMSScgJiYgaXRlbSAhPT0gdGhpcykgeyBpdGVtID0gaXRlbS5wYXJlbnROb2RlIH1cbiAgICBpZiAoaXRlbS50YWdOYW1lID09PSAnTEknKSB7IHJldHVybiBpdGVtIH1cbiAgfVxuXG4gIHVwZGF0ZURlc2NyaXB0aW9uIChpdGVtKSB7XG4gICAgaWYgKCFpdGVtKSB7XG4gICAgICBpZiAodGhpcy5tb2RlbCAmJiB0aGlzLm1vZGVsLml0ZW1zKSB7XG4gICAgICAgIGl0ZW0gPSB0aGlzLm1vZGVsLml0ZW1zW3RoaXMuc2VsZWN0ZWRJbmRleF1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFpdGVtKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoaXRlbS5kZXNjcmlwdGlvbk1hcmtkb3duICYmIGl0ZW0uZGVzY3JpcHRpb25NYXJrZG93bi5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGFpbmVyLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG4gICAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGVudC5pbm5lckhUTUwgPSBtYXJrZWQucGFyc2UoaXRlbS5kZXNjcmlwdGlvbk1hcmtkb3duLCB7c2FuaXRpemU6IHRydWV9KVxuICAgICAgdGhpcy5zZXREZXNjcmlwdGlvbk1vcmVMaW5rKGl0ZW0pXG4gICAgfSBlbHNlIGlmIChpdGVtLmRlc2NyaXB0aW9uICYmIGl0ZW0uZGVzY3JpcHRpb24ubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJ1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRlbnQudGV4dENvbnRlbnQgPSBpdGVtLmRlc2NyaXB0aW9uXG4gICAgICB0aGlzLnNldERlc2NyaXB0aW9uTW9yZUxpbmsoaXRlbSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbkNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgfVxuICB9XG5cbiAgc2V0RGVzY3JpcHRpb25Nb3JlTGluayAoaXRlbSkge1xuICAgIGlmICgoaXRlbS5kZXNjcmlwdGlvbk1vcmVVUkwgIT0gbnVsbCkgJiYgKGl0ZW0uZGVzY3JpcHRpb25Nb3JlVVJMLmxlbmd0aCAhPSBudWxsKSkge1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbk1vcmVMaW5rLnN0eWxlLmRpc3BsYXkgPSAnaW5saW5lJ1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbk1vcmVMaW5rLnNldEF0dHJpYnV0ZSgnaHJlZicsIGl0ZW0uZGVzY3JpcHRpb25Nb3JlVVJMKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRlc2NyaXB0aW9uTW9yZUxpbmsuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuICAgICAgdGhpcy5kZXNjcmlwdGlvbk1vcmVMaW5rLnNldEF0dHJpYnV0ZSgnaHJlZicsICcjJylcbiAgICB9XG4gIH1cblxuICBpdGVtc0NoYW5nZWQgKCkge1xuICAgIGlmICh0aGlzLm1vZGVsICYmIHRoaXMubW9kZWwuaXRlbXMgJiYgdGhpcy5tb2RlbC5pdGVtcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbmRlcigpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnJldHVybkl0ZW1zVG9Qb29sKDApXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICB0aGlzLm5vbkRlZmF1bHRJbmRleCA9IGZhbHNlXG4gICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gMFxuICAgIGlmIChhdG9tLnZpZXdzLnBvbGxBZnRlck5leHRVcGRhdGUpIHtcbiAgICAgIGF0b20udmlld3MucG9sbEFmdGVyTmV4dFVwZGF0ZSgpXG4gICAgfVxuXG4gICAgYXRvbS52aWV3cy51cGRhdGVEb2N1bWVudCh0aGlzLnJlbmRlckl0ZW1zLmJpbmQodGhpcykpXG4gICAgcmV0dXJuIGF0b20udmlld3MucmVhZERvY3VtZW50KHRoaXMucmVhZFVJUHJvcHNGcm9tRE9NLmJpbmQodGhpcykpXG4gIH1cblxuICBhZGRBY3RpdmVDbGFzc1RvRWRpdG9yICgpIHtcbiAgICBsZXQgYWN0aXZlRWRpdG9yXG4gICAgaWYgKHRoaXMubW9kZWwpIHtcbiAgICAgIGFjdGl2ZUVkaXRvciA9IHRoaXMubW9kZWwuYWN0aXZlRWRpdG9yXG4gICAgfVxuICAgIGNvbnN0IGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYWN0aXZlRWRpdG9yKVxuICAgIGlmIChlZGl0b3JFbGVtZW50ICYmIGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0KSB7XG4gICAgICBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2F1dG9jb21wbGV0ZS1hY3RpdmUnKVxuICAgIH1cblxuICAgIHRoaXMuYWN0aXZlQ2xhc3NEaXNwb3NhYmxlID0gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgaWYgKGVkaXRvckVsZW1lbnQgJiYgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QpIHtcbiAgICAgICAgZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdhdXRvY29tcGxldGUtYWN0aXZlJylcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgbW92ZVNlbGVjdGlvblVwICgpIHtcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ID4gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2V0U2VsZWN0ZWRJbmRleCh0aGlzLnNlbGVjdGVkSW5kZXggLSAxKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KHRoaXMudmlzaWJsZUl0ZW1zKCkubGVuZ3RoIC0gMSlcbiAgICB9XG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uRG93biAoKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRJbmRleCA8ICh0aGlzLnZpc2libGVJdGVtcygpLmxlbmd0aCAtIDEpKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KHRoaXMuc2VsZWN0ZWRJbmRleCArIDEpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgoMClcbiAgICB9XG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uUGFnZVVwICgpIHtcbiAgICBjb25zdCBuZXdJbmRleCA9IE1hdGgubWF4KDAsIHRoaXMuc2VsZWN0ZWRJbmRleCAtIHRoaXMubWF4VmlzaWJsZVN1Z2dlc3Rpb25zKVxuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IG5ld0luZGV4KSB7IHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgobmV3SW5kZXgpIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25QYWdlRG93biAoKSB7XG4gICAgY29uc3QgaXRlbXNMZW5ndGggPSB0aGlzLnZpc2libGVJdGVtcygpLmxlbmd0aFxuICAgIGNvbnN0IG5ld0luZGV4ID0gTWF0aC5taW4oaXRlbXNMZW5ndGggLSAxLCB0aGlzLnNlbGVjdGVkSW5kZXggKyB0aGlzLm1heFZpc2libGVTdWdnZXN0aW9ucylcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ICE9PSBuZXdJbmRleCkgeyByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KG5ld0luZGV4KSB9XG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uVG9Ub3AgKCkge1xuICAgIGNvbnN0IG5ld0luZGV4ID0gMFxuICAgIGlmICh0aGlzLnNlbGVjdGVkSW5kZXggIT09IG5ld0luZGV4KSB7IHJldHVybiB0aGlzLnNldFNlbGVjdGVkSW5kZXgobmV3SW5kZXgpIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25Ub0JvdHRvbSAoKSB7XG4gICAgY29uc3QgbmV3SW5kZXggPSB0aGlzLnZpc2libGVJdGVtcygpLmxlbmd0aCAtIDFcbiAgICBpZiAodGhpcy5zZWxlY3RlZEluZGV4ICE9PSBuZXdJbmRleCkgeyByZXR1cm4gdGhpcy5zZXRTZWxlY3RlZEluZGV4KG5ld0luZGV4KSB9XG4gIH1cblxuICBzZXRTZWxlY3RlZEluZGV4IChpbmRleCkge1xuICAgIHRoaXMubm9uRGVmYXVsdEluZGV4ID0gdHJ1ZVxuICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IGluZGV4XG5cblx0dmFyIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuXHR2YXIgY1BvcyA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xuXHR0aGlzLm1vZGVsLnJlcGxhY2VUZXh0V2l0aE1hdGNoKHRoaXMuZ2V0U2VsZWN0ZWRJdGVtKCkpO1xuXHRlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oY1BvcylcblxuICAgIHJldHVybiBhdG9tLnZpZXdzLnVwZGF0ZURvY3VtZW50KHRoaXMucmVuZGVyU2VsZWN0ZWRJdGVtLmJpbmQodGhpcykpXG4gIH1cblxuICB2aXNpYmxlSXRlbXMgKCkge1xuICAgIGlmICh0aGlzLm1vZGVsICYmIHRoaXMubW9kZWwuaXRlbXMpIHtcbiAgICAgIHJldHVybiB0aGlzLm1vZGVsLml0ZW1zLnNsaWNlKDAsIHRoaXMubWF4SXRlbXMpXG4gICAgfVxuICB9XG5cbiAgLy8gUHJpdmF0ZTogR2V0IHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaXRlbVxuICAvL1xuICAvLyBSZXR1cm5zIHRoZSBzZWxlY3RlZCB7T2JqZWN0fVxuICBnZXRTZWxlY3RlZEl0ZW0gKCkge1xuICAgIGlmICh0aGlzLm1vZGVsICYmIHRoaXMubW9kZWwuaXRlbXMpIHtcbiAgICAgIHJldHVybiB0aGlzLm1vZGVsLml0ZW1zW3RoaXMuc2VsZWN0ZWRJbmRleF1cbiAgICB9XG4gIH1cblxuICAvLyBQcml2YXRlOiBDb25maXJtcyB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGl0ZW0gb3IgY2FuY2VscyB0aGUgbGlzdCB2aWV3XG4gIC8vIGlmIG5vIGl0ZW0gaGFzIGJlZW4gc2VsZWN0ZWRcbiAgY29uZmlybVNlbGVjdGlvbiAoa2V5c3Ryb2tlKSB7XG4gICAgaWYgKCF0aGlzLm1vZGVsLmlzQWN0aXZlKCkpIHsgcmV0dXJuIH1cbiAgICBjb25zdCBpdGVtID0gdGhpcy5nZXRTZWxlY3RlZEl0ZW0oKVxuICAgIGlmIChpdGVtICE9IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLm1vZGVsLmNvbmZpcm0oaXRlbSwga2V5c3Ryb2tlKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5tb2RlbC5jYW5jZWwoKVxuICAgIH1cbiAgfVxuXG4gIC8vIFByaXZhdGU6IENvbmZpcm1zIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaXRlbSBvbmx5IGlmIGl0IGlzIG5vdCB0aGUgZGVmYXVsdFxuICAvLyBpdGVtIG9yIGNhbmNlbHMgdGhlIHZpZXcgaWYgbm9uZSBoYXMgYmVlbiBzZWxlY3RlZC5cbiAgY29uZmlybVNlbGVjdGlvbklmTm9uRGVmYXVsdCAoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMubW9kZWwuaXNBY3RpdmUoKSkgeyByZXR1cm4gfVxuICAgIGlmICh0aGlzLm5vbkRlZmF1bHRJbmRleCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29uZmlybVNlbGVjdGlvbigpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubW9kZWwuY2FuY2VsKClcbiAgICAgIHJldHVybiBldmVudC5hYm9ydEtleUJpbmRpbmcoKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlckxpc3QgKCkge1xuICAgIHRoaXMuaW5uZXJIVE1MID0gTGlzdFRlbXBsYXRlXG4gICAgdGhpcy5vbCA9IHRoaXMucXVlcnlTZWxlY3RvcignLmxpc3QtZ3JvdXAnKVxuICAgIHRoaXMuc2Nyb2xsZXIgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5zdWdnZXN0aW9uLWxpc3Qtc2Nyb2xsZXInKVxuICAgIHRoaXMuZGVzY3JpcHRpb25Db250YWluZXIgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IoJy5zdWdnZXN0aW9uLWRlc2NyaXB0aW9uJylcbiAgICB0aGlzLmRlc2NyaXB0aW9uQ29udGVudCA9IHRoaXMucXVlcnlTZWxlY3RvcignLnN1Z2dlc3Rpb24tZGVzY3JpcHRpb24tY29udGVudCcpXG4gICAgdGhpcy5kZXNjcmlwdGlvbk1vcmVMaW5rID0gdGhpcy5xdWVyeVNlbGVjdG9yKCcuc3VnZ2VzdGlvbi1kZXNjcmlwdGlvbi1tb3JlLWxpbmsnKVxuICB9XG5cbiAgcmVuZGVySXRlbXMgKCkge1xuICAgIGxldCBsZWZ0XG4gICAgdGhpcy5zdHlsZS53aWR0aCA9IG51bGxcbiAgICBjb25zdCBpdGVtcyA9IChsZWZ0ID0gdGhpcy52aXNpYmxlSXRlbXMoKSkgIT0gbnVsbCA/IGxlZnQgOiBbXVxuICAgIGxldCBsb25nZXN0RGVzYyA9IDBcbiAgICBsZXQgbG9uZ2VzdERlc2NJbmRleCA9IG51bGxcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgaXRlbXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBjb25zdCBpdGVtID0gaXRlbXNbaW5kZXhdXG4gICAgICB0aGlzLnJlbmRlckl0ZW0oaXRlbSwgaW5kZXgpXG4gICAgICBjb25zdCBkZXNjTGVuZ3RoID0gdGhpcy5kZXNjcmlwdGlvbkxlbmd0aChpdGVtKVxuICAgICAgaWYgKGRlc2NMZW5ndGggPiBsb25nZXN0RGVzYykge1xuICAgICAgICBsb25nZXN0RGVzYyA9IGRlc2NMZW5ndGhcbiAgICAgICAgbG9uZ2VzdERlc2NJbmRleCA9IGluZGV4XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMudXBkYXRlRGVzY3JpcHRpb24oaXRlbXNbbG9uZ2VzdERlc2NJbmRleF0pXG4gICAgcmV0dXJuIHRoaXMucmV0dXJuSXRlbXNUb1Bvb2woaXRlbXMubGVuZ3RoKVxuICB9XG5cbiAgcmV0dXJuSXRlbXNUb1Bvb2wgKHBpdm90SW5kZXgpIHtcbiAgICBpZiAoIXRoaXMub2wpIHsgcmV0dXJuIH1cblxuICAgIGxldCBsaSA9IHRoaXMub2wuY2hpbGROb2Rlc1twaXZvdEluZGV4XVxuICAgIHdoaWxlICgodGhpcy5vbCAhPSBudWxsKSAmJiBsaSkge1xuICAgICAgbGkucmVtb3ZlKClcbiAgICAgIHRoaXMubm9kZVBvb2wucHVzaChsaSlcbiAgICAgIGxpID0gdGhpcy5vbC5jaGlsZE5vZGVzW3Bpdm90SW5kZXhdXG4gICAgfVxuICB9XG5cbiAgZGVzY3JpcHRpb25MZW5ndGggKGl0ZW0pIHtcbiAgICBsZXQgY291bnQgPSAwXG4gICAgaWYgKGl0ZW0uZGVzY3JpcHRpb24gIT0gbnVsbCkge1xuICAgICAgY291bnQgKz0gaXRlbS5kZXNjcmlwdGlvbi5sZW5ndGhcbiAgICB9XG4gICAgaWYgKGl0ZW0uZGVzY3JpcHRpb25Nb3JlVVJMICE9IG51bGwpIHtcbiAgICAgIGNvdW50ICs9IDZcbiAgICB9XG4gICAgcmV0dXJuIGNvdW50XG4gIH1cblxuICByZW5kZXJTZWxlY3RlZEl0ZW0gKCkge1xuICAgIGlmICh0aGlzLnNlbGVjdGVkTGkgJiYgdGhpcy5zZWxlY3RlZExpLmNsYXNzTGlzdCkge1xuICAgICAgdGhpcy5zZWxlY3RlZExpLmNsYXNzTGlzdC5yZW1vdmUoJ3NlbGVjdGVkJylcbiAgICB9XG5cbiAgICB0aGlzLnNlbGVjdGVkTGkgPSB0aGlzLm9sLmNoaWxkTm9kZXNbdGhpcy5zZWxlY3RlZEluZGV4XVxuICAgIGlmICh0aGlzLnNlbGVjdGVkTGkgIT0gbnVsbCkge1xuICAgICAgdGhpcy5zZWxlY3RlZExpLmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJylcbiAgICAgIHRoaXMuc2Nyb2xsU2VsZWN0ZWRJdGVtSW50b1ZpZXcoKVxuICAgICAgcmV0dXJuIHRoaXMudXBkYXRlRGVzY3JpcHRpb24oKVxuICAgIH1cbiAgfVxuXG4gIC8vIFRoaXMgaXMgcmVhZGluZyB0aGUgRE9NIGluIHRoZSB1cGRhdGVET00gY3ljbGUuIElmIHdlIGRvbnQsIHRoZXJlIGlzIGEgZmxpY2tlciA6L1xuICBzY3JvbGxTZWxlY3RlZEl0ZW1JbnRvVmlldyAoKSB7XG4gICAgY29uc3QgeyBzY3JvbGxUb3AgfSA9IHRoaXMuc2Nyb2xsZXJcbiAgICBjb25zdCBzZWxlY3RlZEl0ZW1Ub3AgPSB0aGlzLnNlbGVjdGVkTGkub2Zmc2V0VG9wXG4gICAgaWYgKHNlbGVjdGVkSXRlbVRvcCA8IHNjcm9sbFRvcCkge1xuICAgICAgLy8gc2Nyb2xsIHVwXG4gICAgICB0aGlzLnNjcm9sbGVyLnNjcm9sbFRvcCA9IHNlbGVjdGVkSXRlbVRvcFxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBpdGVtSGVpZ2h0IH0gPSB0aGlzLnVpUHJvcHNcbiAgICBjb25zdCBzY3JvbGxlckhlaWdodCA9ICh0aGlzLm1heFZpc2libGVTdWdnZXN0aW9ucyAqIGl0ZW1IZWlnaHQpICsgdGhpcy51aVByb3BzLnBhZGRpbmdIZWlnaHRcbiAgICBpZiAoc2VsZWN0ZWRJdGVtVG9wICsgaXRlbUhlaWdodCA+IHNjcm9sbFRvcCArIHNjcm9sbGVySGVpZ2h0KSB7XG4gICAgICAvLyBzY3JvbGwgZG93blxuICAgICAgdGhpcy5zY3JvbGxlci5zY3JvbGxUb3AgPSAoc2VsZWN0ZWRJdGVtVG9wIC0gc2Nyb2xsZXJIZWlnaHQpICsgaXRlbUhlaWdodFxuICAgIH1cbiAgfVxuXG4gIHJlYWRVSVByb3BzRnJvbURPTSAoKSB7XG4gICAgbGV0IHdvcmRDb250YWluZXJcbiAgICBpZiAodGhpcy5zZWxlY3RlZExpKSB7XG4gICAgICB3b3JkQ29udGFpbmVyID0gdGhpcy5zZWxlY3RlZExpLnF1ZXJ5U2VsZWN0b3IoJy53b3JkLWNvbnRhaW5lcicpXG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnVpUHJvcHMpIHsgdGhpcy51aVByb3BzID0ge30gfVxuICAgIHRoaXMudWlQcm9wcy53aWR0aCA9IHRoaXMub2Zmc2V0V2lkdGggKyAxXG4gICAgdGhpcy51aVByb3BzLm1hcmdpbkxlZnQgPSAwXG4gICAgaWYgKHdvcmRDb250YWluZXIgJiYgd29yZENvbnRhaW5lci5vZmZzZXRMZWZ0KSB7XG4gICAgICB0aGlzLnVpUHJvcHMubWFyZ2luTGVmdCA9IC13b3JkQ29udGFpbmVyLm9mZnNldExlZnRcbiAgICB9XG4gICAgaWYgKCF0aGlzLnVpUHJvcHMuaXRlbUhlaWdodCkge1xuICAgICAgdGhpcy51aVByb3BzLml0ZW1IZWlnaHQgPSB0aGlzLnNlbGVjdGVkTGkub2Zmc2V0SGVpZ2h0XG4gICAgfVxuICAgIGlmICghdGhpcy51aVByb3BzLnBhZGRpbmdIZWlnaHQpIHtcbiAgICAgIHRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0ID0gcGFyc2VJbnQoZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzKVsncGFkZGluZy10b3AnXSkgKyBwYXJzZUludChnZXRDb21wdXRlZFN0eWxlKHRoaXMpWydwYWRkaW5nLWJvdHRvbSddKVxuICAgICAgaWYgKCF0aGlzLnVpUHJvcHMucGFkZGluZ0hlaWdodCkge1xuICAgICAgICB0aGlzLnVpUHJvcHMucGFkZGluZ0hlaWdodCA9IDBcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBVcGRhdGUgVUkgZHVyaW5nIHRoaXMgcmVhZCwgc28gdGhhdCB3aGVuIHBvbGxpbmcgdGhlIGRvY3VtZW50IHRoZSBsYXRlc3RcbiAgICAvLyBjaGFuZ2VzIGNhbiBiZSBwaWNrZWQgdXAuXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlVUlGb3JDaGFuZ2VkUHJvcHMoKVxuICB9XG5cbiAgdXBkYXRlVUlGb3JDaGFuZ2VkUHJvcHMgKCkge1xuICAgIHRoaXMuc2Nyb2xsZXIuc3R5bGVbJ21heC1oZWlnaHQnXSA9IGAkeyh0aGlzLm1heFZpc2libGVTdWdnZXN0aW9ucyAqIHRoaXMudWlQcm9wcy5pdGVtSGVpZ2h0KSArIHRoaXMudWlQcm9wcy5wYWRkaW5nSGVpZ2h0fXB4YFxuICAgIHRoaXMuc3R5bGUud2lkdGggPSBgJHt0aGlzLnVpUHJvcHMud2lkdGh9cHhgXG4gICAgaWYgKHRoaXMuc3VnZ2VzdGlvbkxpc3RGb2xsb3dzID09PSAnV29yZCcpIHtcbiAgICAgIHRoaXMuc3R5bGVbJ21hcmdpbi1sZWZ0J10gPSBgJHt0aGlzLnVpUHJvcHMubWFyZ2luTGVmdH1weGBcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlRGVzY3JpcHRpb24oKVxuICB9XG5cbiAgLy8gU3BsaXRzIHRoZSBjbGFzc2VzIG9uIHNwYWNlcyBzbyBhcyBub3QgdG8gYW5nZXIgdGhlIERPTSBnb2RzXG4gIGFkZENsYXNzVG9FbGVtZW50IChlbGVtZW50LCBjbGFzc05hbWVzKSB7XG4gICAgaWYgKCFjbGFzc05hbWVzKSB7IHJldHVybiB9XG4gICAgY29uc3QgY2xhc3NlcyA9IGNsYXNzTmFtZXMuc3BsaXQoJyAnKVxuICAgIGlmIChjbGFzc2VzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IGNsYXNzTmFtZSA9IGNsYXNzZXNbaV1cbiAgICAgICAgY2xhc3NOYW1lID0gY2xhc3NOYW1lLnRyaW0oKVxuICAgICAgICBpZiAoY2xhc3NOYW1lKSB7IGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZW5kZXJJdGVtICh7aWNvbkhUTUwsIHR5cGUsIHNuaXBwZXQsIHRleHQsIGRpc3BsYXlUZXh0LCBjbGFzc05hbWUsIHJlcGxhY2VtZW50UHJlZml4LCBsZWZ0TGFiZWwsIGxlZnRMYWJlbEhUTUwsIHJpZ2h0TGFiZWwsIHJpZ2h0TGFiZWxIVE1MfSwgaW5kZXgpIHtcbiAgICBsZXQgbGkgPSB0aGlzLm9sLmNoaWxkTm9kZXNbaW5kZXhdXG4gICAgaWYgKCFsaSkge1xuICAgICAgaWYgKHRoaXMubm9kZXBvb2wgJiYgdGhpcy5ub2RlUG9vbC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpID0gdGhpcy5ub2RlUG9vbC5wb3AoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpXG4gICAgICAgIGxpLmlubmVySFRNTCA9IEl0ZW1UZW1wbGF0ZVxuICAgICAgfVxuICAgICAgbGkuZGF0YXNldC5pbmRleCA9IGluZGV4XG4gICAgICB0aGlzLm9sLmFwcGVuZENoaWxkKGxpKVxuICAgIH1cblxuICAgIGxpLmNsYXNzTmFtZSA9ICcnXG4gICAgaWYgKGluZGV4ID09PSB0aGlzLnNlbGVjdGVkSW5kZXgpIHsgbGkuY2xhc3NMaXN0LmFkZCgnc2VsZWN0ZWQnKSB9XG4gICAgaWYgKGNsYXNzTmFtZSkgeyB0aGlzLmFkZENsYXNzVG9FbGVtZW50KGxpLCBjbGFzc05hbWUpIH1cbiAgICBpZiAoaW5kZXggPT09IHRoaXMuc2VsZWN0ZWRJbmRleCkgeyB0aGlzLnNlbGVjdGVkTGkgPSBsaSB9XG5cbiAgICBjb25zdCB0eXBlSWNvbkNvbnRhaW5lciA9IGxpLnF1ZXJ5U2VsZWN0b3IoJy5pY29uLWNvbnRhaW5lcicpXG4gICAgdHlwZUljb25Db250YWluZXIuaW5uZXJIVE1MID0gJydcblxuICAgIGNvbnN0IHNhbml0aXplZFR5cGUgPSBlc2NhcGVIdG1sKGlzU3RyaW5nKHR5cGUpID8gdHlwZSA6ICcnKVxuICAgIGNvbnN0IHNhbml0aXplZEljb25IVE1MID0gaXNTdHJpbmcoaWNvbkhUTUwpID8gaWNvbkhUTUwgOiB1bmRlZmluZWRcbiAgICBjb25zdCBkZWZhdWx0TGV0dGVySWNvbkhUTUwgPSBzYW5pdGl6ZWRUeXBlID8gYDxzcGFuIGNsYXNzPVwiaWNvbi1sZXR0ZXJcIj4ke3Nhbml0aXplZFR5cGVbMF19PC9zcGFuPmAgOiAnJ1xuICAgIGNvbnN0IGRlZmF1bHRJY29uSFRNTCA9IERlZmF1bHRTdWdnZXN0aW9uVHlwZUljb25IVE1MW3Nhbml0aXplZFR5cGVdICE9IG51bGwgPyBEZWZhdWx0U3VnZ2VzdGlvblR5cGVJY29uSFRNTFtzYW5pdGl6ZWRUeXBlXSA6IGRlZmF1bHRMZXR0ZXJJY29uSFRNTFxuICAgIGlmICgoc2FuaXRpemVkSWNvbkhUTUwgfHwgZGVmYXVsdEljb25IVE1MKSAmJiBpY29uSFRNTCAhPT0gZmFsc2UpIHtcbiAgICAgIHR5cGVJY29uQ29udGFpbmVyLmlubmVySFRNTCA9IEljb25UZW1wbGF0ZVxuICAgICAgY29uc3QgdHlwZUljb24gPSB0eXBlSWNvbkNvbnRhaW5lci5jaGlsZE5vZGVzWzBdXG4gICAgICB0eXBlSWNvbi5pbm5lckhUTUwgPSBzYW5pdGl6ZWRJY29uSFRNTCAhPSBudWxsID8gc2FuaXRpemVkSWNvbkhUTUwgOiBkZWZhdWx0SWNvbkhUTUxcbiAgICAgIGlmICh0eXBlKSB7IHRoaXMuYWRkQ2xhc3NUb0VsZW1lbnQodHlwZUljb24sIHR5cGUpIH1cbiAgICB9XG5cbiAgICBjb25zdCB3b3JkU3BhbiA9IGxpLnF1ZXJ5U2VsZWN0b3IoJy53b3JkJylcbiAgICB3b3JkU3Bhbi5pbm5lckhUTUwgPSB0aGlzLmdldERpc3BsYXlIVE1MKHRleHQsIHNuaXBwZXQsIGRpc3BsYXlUZXh0LCByZXBsYWNlbWVudFByZWZpeClcblxuICAgIGNvbnN0IGxlZnRMYWJlbFNwYW4gPSBsaS5xdWVyeVNlbGVjdG9yKCcubGVmdC1sYWJlbCcpXG4gICAgaWYgKGxlZnRMYWJlbEhUTUwgIT0gbnVsbCkge1xuICAgICAgbGVmdExhYmVsU3Bhbi5pbm5lckhUTUwgPSBsZWZ0TGFiZWxIVE1MXG4gICAgfSBlbHNlIGlmIChsZWZ0TGFiZWwgIT0gbnVsbCkge1xuICAgICAgbGVmdExhYmVsU3Bhbi50ZXh0Q29udGVudCA9IGxlZnRMYWJlbFxuICAgIH0gZWxzZSB7XG4gICAgICBsZWZ0TGFiZWxTcGFuLnRleHRDb250ZW50ID0gJydcbiAgICB9XG5cbiAgICBjb25zdCByaWdodExhYmVsU3BhbiA9IGxpLnF1ZXJ5U2VsZWN0b3IoJy5yaWdodC1sYWJlbCcpXG4gICAgaWYgKHJpZ2h0TGFiZWxIVE1MICE9IG51bGwpIHtcbiAgICAgIHJpZ2h0TGFiZWxTcGFuLmlubmVySFRNTCA9IHJpZ2h0TGFiZWxIVE1MXG4gICAgfSBlbHNlIGlmIChyaWdodExhYmVsICE9IG51bGwpIHtcbiAgICAgIHJpZ2h0TGFiZWxTcGFuLnRleHRDb250ZW50ID0gcmlnaHRMYWJlbFxuICAgIH0gZWxzZSB7XG4gICAgICByaWdodExhYmVsU3Bhbi50ZXh0Q29udGVudCA9ICcnXG4gICAgfVxuICB9XG5cbiAgZ2V0RGlzcGxheUhUTUwgKHRleHQsIHNuaXBwZXQsIGRpc3BsYXlUZXh0LCByZXBsYWNlbWVudFByZWZpeCkge1xuICAgIGxldCByZXBsYWNlbWVudFRleHQgPSB0ZXh0XG4gICAgbGV0IHNuaXBwZXRJbmRpY2VzXG4gICAgaWYgKHR5cGVvZiBkaXNwbGF5VGV4dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJlcGxhY2VtZW50VGV4dCA9IGRpc3BsYXlUZXh0XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc25pcHBldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJlcGxhY2VtZW50VGV4dCA9IHRoaXMucmVtb3ZlRW1wdHlTbmlwcGV0cyhzbmlwcGV0KVxuICAgICAgY29uc3Qgc25pcHBldHMgPSB0aGlzLnNuaXBwZXRQYXJzZXIuZmluZFNuaXBwZXRzKHJlcGxhY2VtZW50VGV4dClcbiAgICAgIHJlcGxhY2VtZW50VGV4dCA9IHRoaXMucmVtb3ZlU25pcHBldHNGcm9tVGV4dChzbmlwcGV0cywgcmVwbGFjZW1lbnRUZXh0KVxuICAgICAgc25pcHBldEluZGljZXMgPSB0aGlzLmZpbmRTbmlwcGV0SW5kaWNlcyhzbmlwcGV0cylcbiAgICB9XG4gICAgY29uc3QgY2hhcmFjdGVyTWF0Y2hJbmRpY2VzID0gdGhpcy5maW5kQ2hhcmFjdGVyTWF0Y2hJbmRpY2VzKHJlcGxhY2VtZW50VGV4dCwgcmVwbGFjZW1lbnRQcmVmaXgpXG5cbiAgICBsZXQgZGlzcGxheUhUTUwgPSAnJ1xuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCByZXBsYWNlbWVudFRleHQubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICBpZiAoc25pcHBldEluZGljZXMgJiYgKHNuaXBwZXRJbmRpY2VzW2luZGV4XSA9PT0gU25pcHBldFN0YXJ0IHx8IHNuaXBwZXRJbmRpY2VzW2luZGV4XSA9PT0gU25pcHBldFN0YXJ0QW5kRW5kKSkge1xuICAgICAgICBkaXNwbGF5SFRNTCArPSAnPHNwYW4gY2xhc3M9XCJzbmlwcGV0LWNvbXBsZXRpb25cIj4nXG4gICAgICB9XG4gICAgICBpZiAoY2hhcmFjdGVyTWF0Y2hJbmRpY2VzICYmIGNoYXJhY3Rlck1hdGNoSW5kaWNlc1tpbmRleF0pIHtcbiAgICAgICAgZGlzcGxheUhUTUwgKz0gYDxzcGFuIGNsYXNzPVwiY2hhcmFjdGVyLW1hdGNoXCI+JHtlc2NhcGVIdG1sKHJlcGxhY2VtZW50VGV4dFtpbmRleF0pfTwvc3Bhbj5gXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaXNwbGF5SFRNTCArPSBlc2NhcGVIdG1sKHJlcGxhY2VtZW50VGV4dFtpbmRleF0pXG4gICAgICB9XG4gICAgICBpZiAoc25pcHBldEluZGljZXMgJiYgKHNuaXBwZXRJbmRpY2VzW2luZGV4XSA9PT0gU25pcHBldEVuZCB8fCBzbmlwcGV0SW5kaWNlc1tpbmRleF0gPT09IFNuaXBwZXRTdGFydEFuZEVuZCkpIHtcbiAgICAgICAgZGlzcGxheUhUTUwgKz0gJzwvc3Bhbj4nXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkaXNwbGF5SFRNTFxuICB9XG5cbiAgcmVtb3ZlRW1wdHlTbmlwcGV0cyAodGV4dCkge1xuICAgIGlmICghdGV4dCB8fCAhdGV4dC5sZW5ndGggfHwgdGV4dC5pbmRleE9mKCckJykgPT09IC0xKSB7IHJldHVybiB0ZXh0IH0gLy8gTm8gc25pcHBldHNcbiAgICByZXR1cm4gdGV4dC5yZXBsYWNlKHRoaXMuZW1wdHlTbmlwcGV0R3JvdXBSZWdleCwgJycpIC8vIFJlbW92ZSBhbGwgb2NjdXJyZW5jZXMgb2YgJDAgb3IgJHswfSBvciAkezA6fVxuICB9XG5cbiAgLy8gV2lsbCBjb252ZXJ0ICdhYmMoJHsxOmR9LCAkezI6ZX0pZicgPT4gJ2FiYyhkLCBlKWYnXG4gIC8vXG4gIC8vICogYHNuaXBwZXRzYCB7QXJyYXl9IGZyb20gYFNuaXBwZXRQYXJzZXIuZmluZFNuaXBwZXRzYFxuICAvLyAqIGB0ZXh0YCB7U3RyaW5nfSB0byByZW1vdmUgc25pcHBldHMgZnJvbVxuICAvL1xuICAvLyBSZXR1cm5zIHtTdHJpbmd9XG4gIHJlbW92ZVNuaXBwZXRzRnJvbVRleHQgKHNuaXBwZXRzLCB0ZXh0KSB7XG4gICAgaWYgKCF0ZXh0IHx8ICF0ZXh0Lmxlbmd0aCB8fCAhc25pcHBldHMgfHwgIXNuaXBwZXRzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIHRleHRcbiAgICB9XG4gICAgbGV0IGluZGV4ID0gMFxuICAgIGxldCByZXN1bHQgPSAnJ1xuICAgIGZvciAoY29uc3Qge3NuaXBwZXRTdGFydCwgc25pcHBldEVuZCwgYm9keX0gb2Ygc25pcHBldHMpIHtcbiAgICAgIHJlc3VsdCArPSB0ZXh0LnNsaWNlKGluZGV4LCBzbmlwcGV0U3RhcnQpICsgYm9keVxuICAgICAgaW5kZXggPSBzbmlwcGV0RW5kICsgMVxuICAgIH1cbiAgICBpZiAoaW5kZXggIT09IHRleHQubGVuZ3RoKSB7XG4gICAgICByZXN1bHQgKz0gdGV4dC5zbGljZShpbmRleCwgdGV4dC5sZW5ndGgpXG4gICAgfVxuICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKHRoaXMuc2xhc2hlc0luU25pcHBldFJlZ2V4LCAnXFxcXCcpXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG5cbiAgLy8gQ29tcHV0ZXMgdGhlIGluZGljZXMgb2Ygc25pcHBldHMgaW4gdGhlIHJlc3VsdGluZyBzdHJpbmcgZnJvbVxuICAvLyBgcmVtb3ZlU25pcHBldHNGcm9tVGV4dGAuXG4gIC8vXG4gIC8vICogYHNuaXBwZXRzYCB7QXJyYXl9IGZyb20gYFNuaXBwZXRQYXJzZXIuZmluZFNuaXBwZXRzYFxuICAvL1xuICAvLyBlLmcuIEEgcmVwbGFjZW1lbnQgb2YgJ2FiYygkezE6ZH0pZScgaXMgcmVwbGFjZWQgdG8gJ2FiYyhkKWUnIHdpbGwgcmVzdWx0IGluXG4gIC8vXG4gIC8vIGB7NDogU25pcHBldFN0YXJ0QW5kRW5kfWBcbiAgLy9cbiAgLy8gUmV0dXJucyB7T2JqZWN0fSBvZiB7aW5kZXg6IFNuaXBwZXRTdGFydHxFbmR8U3RhcnRBbmRFbmR9XG4gIGZpbmRTbmlwcGV0SW5kaWNlcyAoc25pcHBldHMpIHtcbiAgICBpZiAoIXNuaXBwZXRzKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgY29uc3QgaW5kaWNlcyA9IHt9XG4gICAgbGV0IG9mZnNldEFjY3VtdWxhdG9yID0gMFxuICAgIGZvciAoY29uc3Qge3NuaXBwZXRTdGFydCwgc25pcHBldEVuZCwgYm9keX0gb2Ygc25pcHBldHMpIHtcbiAgICAgIGNvbnN0IGJvZHlMZW5ndGggPSBib2R5Lmxlbmd0aFxuICAgICAgY29uc3Qgc25pcHBldExlbmd0aCA9IChzbmlwcGV0RW5kIC0gc25pcHBldFN0YXJ0KSArIDFcbiAgICAgIGNvbnN0IHN0YXJ0SW5kZXggPSBzbmlwcGV0U3RhcnQgLSBvZmZzZXRBY2N1bXVsYXRvclxuICAgICAgY29uc3QgZW5kSW5kZXggPSAoc3RhcnRJbmRleCArIGJvZHlMZW5ndGgpIC0gMVxuICAgICAgb2Zmc2V0QWNjdW11bGF0b3IgKz0gc25pcHBldExlbmd0aCAtIGJvZHlMZW5ndGhcblxuICAgICAgaWYgKHN0YXJ0SW5kZXggPT09IGVuZEluZGV4KSB7XG4gICAgICAgIGluZGljZXNbc3RhcnRJbmRleF0gPSBTbmlwcGV0U3RhcnRBbmRFbmRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGljZXNbc3RhcnRJbmRleF0gPSBTbmlwcGV0U3RhcnRcbiAgICAgICAgaW5kaWNlc1tlbmRJbmRleF0gPSBTbmlwcGV0RW5kXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGljZXNcbiAgfVxuXG4gIC8vIEZpbmRzIHRoZSBpbmRpY2VzIG9mIHRoZSBjaGFycyBpbiB0ZXh0IHRoYXQgYXJlIG1hdGNoZWQgYnkgcmVwbGFjZW1lbnRQcmVmaXhcbiAgLy9cbiAgLy8gZS5nLiB0ZXh0ID0gJ2FiY2RlJywgcmVwbGFjZW1lbnRQcmVmaXggPSAnYWNkJyBXaWxsIHJlc3VsdCBpblxuICAvL1xuICAvLyB7MDogdHJ1ZSwgMjogdHJ1ZSwgMzogdHJ1ZX1cbiAgLy9cbiAgLy8gUmV0dXJucyBhbiB7T2JqZWN0fVxuICBmaW5kQ2hhcmFjdGVyTWF0Y2hJbmRpY2VzICh0ZXh0LCByZXBsYWNlbWVudFByZWZpeCkge1xuICAgIGlmICghdGV4dCB8fCAhdGV4dC5sZW5ndGggfHwgIXJlcGxhY2VtZW50UHJlZml4IHx8ICFyZXBsYWNlbWVudFByZWZpeC5sZW5ndGgpIHsgcmV0dXJuIH1cbiAgICBjb25zdCBtYXRjaGVzID0ge31cbiAgICBpZiAodGhpcy51c2VBbHRlcm5hdGVTY29yaW5nKSB7XG4gICAgICBjb25zdCBtYXRjaEluZGljZXMgPSBmdXp6YWxkcmluUGx1cy5tYXRjaCh0ZXh0LCByZXBsYWNlbWVudFByZWZpeClcbiAgICAgIGZvciAoY29uc3QgaSBvZiBtYXRjaEluZGljZXMpIHtcbiAgICAgICAgbWF0Y2hlc1tpXSA9IHRydWVcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHdvcmRJbmRleCA9IDBcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVwbGFjZW1lbnRQcmVmaXgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2ggPSByZXBsYWNlbWVudFByZWZpeFtpXVxuICAgICAgICB3aGlsZSAod29yZEluZGV4IDwgdGV4dC5sZW5ndGggJiYgdGV4dFt3b3JkSW5kZXhdLnRvTG93ZXJDYXNlKCkgIT09IGNoLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICB3b3JkSW5kZXggKz0gMVxuICAgICAgICB9XG4gICAgICAgIGlmICh3b3JkSW5kZXggPj0gdGV4dC5sZW5ndGgpIHsgYnJlYWsgfVxuICAgICAgICBtYXRjaGVzW3dvcmRJbmRleF0gPSB0cnVlXG4gICAgICAgIHdvcmRJbmRleCArPSAxXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRjaGVzXG4gIH1cblxuICBkaXNwb3NlICgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgaWYgKHRoaXMucGFyZW50Tm9kZSkge1xuICAgICAgdGhpcy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMpXG4gICAgfVxuICB9XG59XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9jb21wb25lbnQvZXNjYXBlLWh0bWwvYmxvYi9tYXN0ZXIvaW5kZXguanNcbmNvbnN0IGVzY2FwZUh0bWwgPSAoaHRtbCkgPT4ge1xuICByZXR1cm4gU3RyaW5nKGh0bWwpXG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgLnJlcGxhY2UoLycvZywgJyYjMzk7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxufVxuXG5leHBvcnQgZGVmYXVsdCBTdWdnZXN0aW9uTGlzdEVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ2F1dG9jb21wbGV0ZS1zdWdnZXN0aW9uLWxpc3QnLCB7cHJvdG90eXBlOiBTdWdnZXN0aW9uTGlzdEVsZW1lbnQucHJvdG90eXBlfSkgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jbGFzcy1hc3NpZ25cbiJdfQ==