(function() {
  var Motion, Search, SearchBackwards, SearchBase, SearchCurrentWord, SearchCurrentWordBackwards, SearchModel, _, getCaseSensitivity, getNonWordCharactersForCursor, ref, saveEditorState, searchByProjectFind, settings,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  ref = require('./utils'), saveEditorState = ref.saveEditorState, getNonWordCharactersForCursor = ref.getNonWordCharactersForCursor, searchByProjectFind = ref.searchByProjectFind;

  SearchModel = require('./search-model');

  settings = require('./settings');

  Motion = require('./base').getClass('Motion');

  getCaseSensitivity = function(searchName) {
    if (settings.get("useSmartcaseFor" + searchName)) {
      return 'smartcase';
    } else if (settings.get("ignoreCaseFor" + searchName)) {
      return 'insensitive';
    } else {
      return 'sensitive';
    }
  };

  SearchBase = (function(superClass) {
    extend(SearchBase, superClass);

    function SearchBase() {
      return SearchBase.__super__.constructor.apply(this, arguments);
    }

    SearchBase.extend(false);

    SearchBase.prototype.jump = true;

    SearchBase.prototype.backwards = false;

    SearchBase.prototype.useRegexp = true;

    SearchBase.prototype.configScope = null;

    SearchBase.prototype.landingPoint = null;

    SearchBase.prototype.defaultLandingPoint = 'start';

    SearchBase.prototype.relativeIndex = null;

    SearchBase.prototype.isBackwards = function() {
      return this.backwards;
    };

    SearchBase.prototype.isIncrementalSearch = function() {
      return this["instanceof"]('Search') && !this.isRepeated() && settings.get('incrementalSearch');
    };

    SearchBase.prototype.initialize = function() {
      SearchBase.__super__.initialize.apply(this, arguments);
      return this.onDidFinishOperation((function(_this) {
        return function() {
          return _this.finish();
        };
      })(this));
    };

    SearchBase.prototype.getCount = function() {
      var count;
      count = SearchBase.__super__.getCount.apply(this, arguments);
      if (this.isBackwards()) {
        return -count;
      } else {
        return count;
      }
    };

    SearchBase.prototype.isCaseSensitive = function(term) {
      switch (getCaseSensitivity(this.configScope)) {
        case 'smartcase':
          return term.search('[A-Z]') !== -1;
        case 'insensitive':
          return false;
        case 'sensitive':
          return true;
      }
    };

    SearchBase.prototype.finish = function() {
      var ref1;
      if (this.isIncrementalSearch() && settings.get('showHoverSearchCounter')) {
        this.vimState.hoverSearchCounter.reset();
      }
      this.relativeIndex = null;
      if ((ref1 = this.searchModel) != null) {
        ref1.destroy();
      }
      return this.searchModel = null;
    };

    SearchBase.prototype.getLandingPoint = function() {
      return this.landingPoint != null ? this.landingPoint : this.landingPoint = this.defaultLandingPoint;
    };

    SearchBase.prototype.getPoint = function(cursor) {
      var point, range;
      if (this.searchModel != null) {
        this.relativeIndex = this.getCount() + this.searchModel.getRelativeIndex();
      } else {
        if (this.relativeIndex == null) {
          this.relativeIndex = this.getCount();
        }
      }
      if (range = this.search(cursor, this.input, this.relativeIndex)) {
        point = range[this.getLandingPoint()];
      }
      this.searchModel.destroy();
      this.searchModel = null;
      return point;
    };

    SearchBase.prototype.moveCursor = function(cursor) {
      var input, point;
      input = this.getInput();
      if (!input) {
        return;
      }
      if (point = this.getPoint(cursor)) {
        cursor.setBufferPosition(point, {
          autoscroll: false
        });
      }
      if (!this.isRepeated()) {
        this.globalState.set('currentSearch', this);
        this.vimState.searchHistory.save(input);
      }
      return this.globalState.set('lastSearchPattern', this.getPattern(input));
    };

    SearchBase.prototype.getSearchModel = function() {
      return this.searchModel != null ? this.searchModel : this.searchModel = new SearchModel(this.vimState, {
        incrementalSearch: this.isIncrementalSearch()
      });
    };

    SearchBase.prototype.search = function(cursor, input, relativeIndex) {
      var fromPoint, searchModel;
      searchModel = this.getSearchModel();
      if (input) {
        fromPoint = this.getBufferPositionForCursor(cursor);
        return searchModel.search(fromPoint, this.getPattern(input), relativeIndex);
      } else {
        this.vimState.hoverSearchCounter.reset();
        return searchModel.clearMarkers();
      }
    };

    return SearchBase;

  })(Motion);

  Search = (function(superClass) {
    extend(Search, superClass);

    function Search() {
      this.handleConfirmSearch = bind(this.handleConfirmSearch, this);
      return Search.__super__.constructor.apply(this, arguments);
    }

    Search.extend();

    Search.prototype.configScope = "Search";

    Search.prototype.requireInput = true;

    Search.prototype.initialize = function() {
      Search.__super__.initialize.apply(this, arguments);
      if (this.isComplete()) {
        return;
      }
      if (this.isIncrementalSearch()) {
        this.restoreEditorState = saveEditorState(this.editor);
        this.onDidCommandSearch(this.handleCommandEvent.bind(this));
      }
      this.onDidConfirmSearch(this.handleConfirmSearch.bind(this));
      this.onDidCancelSearch(this.handleCancelSearch.bind(this));
      this.onDidChangeSearch(this.handleChangeSearch.bind(this));
      return this.vimState.searchInput.focus({
        backwards: this.backwards
      });
    };

    Search.prototype.handleCommandEvent = function(commandEvent) {
      var direction, operation;
      if (!this.input) {
        return;
      }
      switch (commandEvent.name) {
        case 'visit':
          direction = commandEvent.direction;
          if (this.isBackwards() && settings.get('incrementalSearchVisitDirection') === 'relative') {
            direction = (function() {
              switch (direction) {
                case 'next':
                  return 'prev';
                case 'prev':
                  return 'next';
              }
            })();
          }
          switch (direction) {
            case 'next':
              return this.getSearchModel().visit(+1);
            case 'prev':
              return this.getSearchModel().visit(-1);
          }
          break;
        case 'occurrence':
          operation = commandEvent.operation;
          if (operation != null) {
            this.vimState.occurrenceManager.resetPatterns();
          }
          this.vimState.occurrenceManager.addPattern(this.getPattern(this.input));
          this.vimState.searchHistory.save(this.input);
          this.vimState.searchInput.cancel();
          if (operation != null) {
            return this.vimState.operationStack.run(operation);
          }
          break;
        case 'project-find':
          this.vimState.searchHistory.save(this.input);
          this.vimState.searchInput.cancel();
          return searchByProjectFind(this.editor, this.input);
      }
    };

    Search.prototype.handleCancelSearch = function() {
      if (!(this.isMode('visual') || this.isMode('insert'))) {
        this.vimState.resetNormalMode();
      }
      if (typeof this.restoreEditorState === "function") {
        this.restoreEditorState();
      }
      this.vimState.reset();
      return this.finish();
    };

    Search.prototype.isSearchRepeatCharacter = function(char) {
      var searchChar;
      if (this.isIncrementalSearch()) {
        return char === '';
      } else {
        searchChar = this.isBackwards() ? '?' : '/';
        return char === '' || char === searchChar;
      }
    };

    Search.prototype.handleConfirmSearch = function(arg) {
      this.input = arg.input, this.landingPoint = arg.landingPoint;
      if (this.isSearchRepeatCharacter(this.input)) {
        this.input = this.vimState.searchHistory.get('prev');
        if (!this.input) {
          atom.beep();
        }
      }
      return this.processOperation();
    };

    Search.prototype.handleChangeSearch = function(input1) {
      this.input = input1;
      if (this.input.startsWith(' ')) {
        this.input = this.input.replace(/^ /, '');
        this.useRegexp = false;
      }
      this.vimState.searchInput.updateOptionSettings({
        useRegexp: this.useRegexp
      });
      if (this.isIncrementalSearch()) {
        return this.search(this.editor.getLastCursor(), this.input, this.getCount());
      }
    };

    Search.prototype.getPattern = function(term) {
      var modifiers;
      modifiers = this.isCaseSensitive(term) ? 'g' : 'gi';
      if (term.indexOf('\\c') >= 0) {
        term = term.replace('\\c', '');
        if (indexOf.call(modifiers, 'i') < 0) {
          modifiers += 'i';
        }
      }
      if (this.useRegexp) {
        try {
          return new RegExp(term, modifiers);
        } catch (error) {
          null;
        }
      }
      return new RegExp(_.escapeRegExp(term), modifiers);
    };

    return Search;

  })(SearchBase);

  SearchBackwards = (function(superClass) {
    extend(SearchBackwards, superClass);

    function SearchBackwards() {
      return SearchBackwards.__super__.constructor.apply(this, arguments);
    }

    SearchBackwards.extend();

    SearchBackwards.prototype.backwards = true;

    return SearchBackwards;

  })(Search);

  SearchCurrentWord = (function(superClass) {
    extend(SearchCurrentWord, superClass);

    function SearchCurrentWord() {
      return SearchCurrentWord.__super__.constructor.apply(this, arguments);
    }

    SearchCurrentWord.extend();

    SearchCurrentWord.prototype.configScope = "SearchCurrentWord";

    SearchCurrentWord.prototype.getInput = function() {
      var wordRange;
      return this.input != null ? this.input : this.input = (wordRange = this.getCurrentWordBufferRange(), wordRange != null ? (this.editor.setCursorBufferPosition(wordRange.start), this.editor.getTextInBufferRange(wordRange)) : '');
    };

    SearchCurrentWord.prototype.getPattern = function(term) {
      var modifiers, pattern;
      modifiers = this.isCaseSensitive(term) ? 'g' : 'gi';
      pattern = _.escapeRegExp(term);
      if (/\W/.test(term)) {
        return new RegExp(pattern + "\\b", modifiers);
      } else {
        return new RegExp("\\b" + pattern + "\\b", modifiers);
      }
    };

    SearchCurrentWord.prototype.getCurrentWordBufferRange = function() {
      var cursor, found, nonWordCharacters, point, scanRange, wordRegex;
      cursor = this.editor.getLastCursor();
      point = cursor.getBufferPosition();
      nonWordCharacters = getNonWordCharactersForCursor(cursor);
      wordRegex = new RegExp("[^\\s" + (_.escapeRegExp(nonWordCharacters)) + "]+", 'g');
      found = null;
      scanRange = this.editor.bufferRangeForBufferRow(point.row);
      this.editor.scanInBufferRange(wordRegex, scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.end.isGreaterThan(point)) {
          found = range;
          return stop();
        }
      });
      return found;
    };

    return SearchCurrentWord;

  })(SearchBase);

  SearchCurrentWordBackwards = (function(superClass) {
    extend(SearchCurrentWordBackwards, superClass);

    function SearchCurrentWordBackwards() {
      return SearchCurrentWordBackwards.__super__.constructor.apply(this, arguments);
    }

    SearchCurrentWordBackwards.extend();

    SearchCurrentWordBackwards.prototype.backwards = true;

    return SearchCurrentWordBackwards;

  })(SearchCurrentWord);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvbW90aW9uLXNlYXJjaC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLGtOQUFBO0lBQUE7Ozs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFFSixNQUF3RSxPQUFBLENBQVEsU0FBUixDQUF4RSxFQUFDLHFDQUFELEVBQWtCLGlFQUFsQixFQUFpRDs7RUFDakQsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBQ1gsTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSLENBQWlCLENBQUMsUUFBbEIsQ0FBMkIsUUFBM0I7O0VBRVQsa0JBQUEsR0FBcUIsU0FBQyxVQUFEO0lBRW5CLElBQUcsUUFBUSxDQUFDLEdBQVQsQ0FBYSxpQkFBQSxHQUFrQixVQUEvQixDQUFIO2FBQ0UsWUFERjtLQUFBLE1BRUssSUFBRyxRQUFRLENBQUMsR0FBVCxDQUFhLGVBQUEsR0FBZ0IsVUFBN0IsQ0FBSDthQUNILGNBREc7S0FBQSxNQUFBO2FBR0gsWUFIRzs7RUFKYzs7RUFTZjs7Ozs7OztJQUNKLFVBQUMsQ0FBQSxNQUFELENBQVEsS0FBUjs7eUJBQ0EsSUFBQSxHQUFNOzt5QkFDTixTQUFBLEdBQVc7O3lCQUNYLFNBQUEsR0FBVzs7eUJBQ1gsV0FBQSxHQUFhOzt5QkFDYixZQUFBLEdBQWM7O3lCQUNkLG1CQUFBLEdBQXFCOzt5QkFDckIsYUFBQSxHQUFlOzt5QkFFZixXQUFBLEdBQWEsU0FBQTthQUNYLElBQUMsQ0FBQTtJQURVOzt5QkFHYixtQkFBQSxHQUFxQixTQUFBO2FBQ25CLElBQUMsRUFBQSxVQUFBLEVBQUQsQ0FBWSxRQUFaLENBQUEsSUFBMEIsQ0FBSSxJQUFDLENBQUEsVUFBRCxDQUFBLENBQTlCLElBQWdELFFBQVEsQ0FBQyxH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Q0FBQTtNQUNULEtBQUEsR0FBUSxNQUFNLENBQUMsaUJBQVAsQ0FBQTtNQUVSLGlCQUFBLEdBQW9CLDZCQUFBLENBQThCLE1BQTlCO01BQ3BCLFNBQUEsR0FBZ0IsSUFBQSxNQUFBLENBQU8sT0FBQSxHQUFPLENBQUMsQ0FBQyxDQUFDLFlBQUYsQ0FBZSxpQkFBZixDQUFELENBQVAsR0FBMEMsSUFBakQsRUFBc0QsR0FBdEQ7TUFFaEIsS0FBQSxHQUFRO01BQ1IsU0FBQSxHQUFZLElBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBZ0MsS0FBSyxDQUFDLEdBQXRDO01BQ1osSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUEwQixTQUExQixFQUFxQyxTQUFyQyxFQUFnRCxTQUFDLEdBQUQ7QUFDOUMsWUFBQTtRQURnRCxtQkFBTztRQUN2RCxJQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBVixDQUF3QixLQUF4QixDQUFIO1VBQ0UsS0FBQSxHQUFRO2lCQUNSLElBQUEsQ0FBQSxFQUZGOztNQUQ4QyxDQUFoRDthQUlBO0lBYnlCOzs7O0tBdEJHOztFQXFDMUI7Ozs7Ozs7SUFDSiwwQkFBQyxDQUFBLE1BQUQsQ0FBQTs7eUNBQ0EsU0FBQSxHQUFXOzs7O0tBRjRCO0FBNU96QyIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbntzYXZlRWRpdG9yU3RhdGUsIGdldE5vbldvcmRDaGFyYWN0ZXJzRm9yQ3Vyc29yLCBzZWFyY2hCeVByb2plY3RGaW5kfSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5TZWFyY2hNb2RlbCA9IHJlcXVpcmUgJy4vc2VhcmNoLW1vZGVsJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuTW90aW9uID0gcmVxdWlyZSgnLi9iYXNlJykuZ2V0Q2xhc3MoJ01vdGlvbicpXG5cbmdldENhc2VTZW5zaXRpdml0eSA9IChzZWFyY2hOYW1lKSAtPlxuICAjIFtUT0RPXSBkZXByZWNhdGUgb2xkIHNldHRpbmcgYW5kIGF1dG8tbWlncmF0ZSB0byBjYXNlU2Vuc2l0aXZpdHlGb3JYWFhcbiAgaWYgc2V0dGluZ3MuZ2V0KFwidXNlU21hcnRjYXNlRm9yI3tzZWFyY2hOYW1lfVwiKVxuICAgICdzbWFydGNhc2UnXG4gIGVsc2UgaWYgc2V0dGluZ3MuZ2V0KFwiaWdub3JlQ2FzZUZvciN7c2VhcmNoTmFtZX1cIilcbiAgICAnaW5zZW5zaXRpdmUnXG4gIGVsc2VcbiAgICAnc2Vuc2l0aXZlJ1xuXG5jbGFzcyBTZWFyY2hCYXNlIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoZmFsc2UpXG4gIGp1bXA6IHRydWVcbiAgYmFja3dhcmRzOiBmYWxzZVxuICB1c2VSZWdleHA6IHRydWVcbiAgY29uZmlnU2NvcGU6IG51bGxcbiAgbGFuZGluZ1BvaW50OiBudWxsICMgWydzdGFydCcgb3IgJ2VuZCddXG4gIGRlZmF1bHRMYW5kaW5nUG9pbnQ6ICdzdGFydCcgIyBbJ3N0YXJ0JyBvciAnZW5kJ11cbiAgcmVsYXRpdmVJbmRleDogbnVsbFxuXG4gIGlzQmFja3dhcmRzOiAtPlxuICAgIEBiYWNrd2FyZHNcblxuICBpc0luY3JlbWVudGFsU2VhcmNoOiAtPlxuICAgIEBpbnN0YW5jZW9mKCdTZWFyY2gnKSBhbmQgbm90IEBpc1JlcGVhdGVkKCkgYW5kIHNldHRpbmdzLmdldCgnaW5jcmVtZW50YWxTZWFyY2gnKVxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcbiAgICBAb25EaWRGaW5pc2hPcGVyYXRpb24gPT5cbiAgICAgIEBmaW5pc2goKVxuXG4gIGdldENvdW50OiAtPlxuICAgIGNvdW50ID0gc3VwZXJcbiAgICBpZiBAaXNCYWNrd2FyZHMoKVxuICAgICAgLWNvdW50XG4gICAgZWxzZVxuICAgICAgY291bnRcblxuICBpc0Nhc2VTZW5zaXRpdmU6ICh0ZXJtKSAtPlxuICAgIHN3aXRjaCBnZXRDYXNlU2Vuc2l0aXZpdHkoQGNvbmZpZ1Njb3BlKVxuICAgICAgd2hlbiAnc21hcnRjYXNlJyB0aGVuIHRlcm0uc2VhcmNoKCdbQS1aXScpIGlzbnQgLTFcbiAgICAgIHdoZW4gJ2luc2Vuc2l0aXZlJyB0aGVuIGZhbHNlXG4gICAgICB3aGVuICdzZW5zaXRpdmUnIHRoZW4gdHJ1ZVxuXG4gIGZpbmlzaDogLT5cbiAgICBpZiBAaXNJbmNyZW1lbnRhbFNlYXJjaCgpIGFuZCBzZXR0aW5ncy5nZXQoJ3Nob3dIb3ZlclNlYXJjaENvdW50ZXInKVxuICAgICAgQHZpbVN0YXRlLmhvdmVyU2VhcmNoQ291bnRlci5yZXNldCgpXG4gICAgQHJlbGF0aXZlSW5kZXggPSBudWxsXG4gICAgQHNlYXJjaE1vZGVsPy5kZXN0cm95KClcbiAgICBAc2VhcmNoTW9kZWwgPSBudWxsXG5cbiAgZ2V0TGFuZGluZ1BvaW50OiAtPlxuICAgIEBsYW5kaW5nUG9pbnQgPz0gQGRlZmF1bHRMYW5kaW5nUG9pbnRcblxuICBnZXRQb2ludDogKGN1cnNvcikgLT5cbiAgICBpZiBAc2VhcmNoTW9kZWw/XG4gICAgICBAcmVsYXRpdmVJbmRleCA9IEBnZXRDb3VudCgpICsgQHNlYXJjaE1vZGVsLmdldFJlbGF0aXZlSW5kZXgoKVxuICAgIGVsc2VcbiAgICAgIEByZWxhdGl2ZUluZGV4ID89IEBnZXRDb3VudCgpXG5cbiAgICBpZiByYW5nZSA9IEBzZWFyY2goY3Vyc29yLCBAaW5wdXQsIEByZWxhdGl2ZUluZGV4KVxuICAgICAgcG9pbnQgPSByYW5nZVtAZ2V0TGFuZGluZ1BvaW50KCldXG5cbiAgICBAc2VhcmNoTW9kZWwuZGVzdHJveSgpXG4gICAgQHNlYXJjaE1vZGVsID0gbnVsbFxuXG4gICAgcG9pbnRcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIGlucHV0ID0gQGdldElucHV0KClcbiAgICByZXR1cm4gdW5sZXNzIGlucHV0XG5cbiAgICBpZiBwb2ludCA9IEBnZXRQb2ludChjdXJzb3IpXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQsIGF1dG9zY3JvbGw6IGZhbHNlKVxuXG4gICAgdW5sZXNzIEBpc1JlcGVhdGVkKClcbiAgICAgIEBnbG9iYWxTdGF0ZS5zZXQoJ2N1cnJlbnRTZWFyY2gnLCB0aGlzKVxuICAgICAgQHZpbVN0YXRlLnNlYXJjaEhpc3Rvcnkuc2F2ZShpbnB1dClcblxuICAgIEBnbG9iYWxTdGF0ZS5zZXQoJ2xhc3RTZWFyY2hQYXR0ZXJuJywgQGdldFBhdHRlcm4oaW5wdXQpKVxuXG4gIGdldFNlYXJjaE1vZGVsOiAtPlxuICAgIEBzZWFyY2hNb2RlbCA/PSBuZXcgU2VhcmNoTW9kZWwoQHZpbVN0YXRlLCBpbmNyZW1lbnRhbFNlYXJjaDogQGlzSW5jcmVtZW50YWxTZWFyY2goKSlcblxuICBzZWFyY2g6IChjdXJzb3IsIGlucHV0LCByZWxhdGl2ZUluZGV4KSAtPlxuICAgIHNlYXJjaE1vZGVsID0gQGdldFNlYXJjaE1vZGVsKClcbiAgICBpZiBpbnB1dFxuICAgICAgZnJvbVBvaW50ID0gQGdldEJ1ZmZlclBvc2l0aW9uRm9yQ3Vyc29yKGN1cnNvcilcbiAgICAgIHNlYXJjaE1vZGVsLnNlYXJjaChmcm9tUG9pbnQsIEBnZXRQYXR0ZXJuKGlucHV0KSwgcmVsYXRpdmVJbmRleClcbiAgICBlbHNlXG4gICAgICBAdmltU3RhdGUuaG92ZXJTZWFyY2hDb3VudGVyLnJlc2V0KClcbiAgICAgIHNlYXJjaE1vZGVsLmNsZWFyTWFya2VycygpXG5cbiMgLywgP1xuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTZWFyY2ggZXh0ZW5kcyBTZWFyY2hCYXNlXG4gIEBleHRlbmQoKVxuICBjb25maWdTY29wZTogXCJTZWFyY2hcIlxuICByZXF1aXJlSW5wdXQ6IHRydWVcblxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgcmV0dXJuIGlmIEBpc0NvbXBsZXRlKCkgIyBXaGVuIHJlcGVhdGVkLCBubyBuZWVkIHRvIGdldCB1c2VyIGlucHV0XG5cbiAgICBpZiBAaXNJbmNyZW1lbnRhbFNlYXJjaCgpXG4gICAgICBAcmVzdG9yZUVkaXRvclN0YXRlID0gc2F2ZUVkaXRvclN0YXRlKEBlZGl0b3IpXG4gICAgICBAb25EaWRDb21tYW5kU2VhcmNoKEBoYW5kbGVDb21tYW5kRXZlbnQuYmluZCh0aGlzKSlcblxuICAgIEBvbkRpZENvbmZpcm1TZWFyY2goQGhhbmRsZUNvbmZpcm1TZWFyY2guYmluZCh0aGlzKSlcbiAgICBAb25EaWRDYW5jZWxTZWFyY2goQGhhbmRsZUNhbmNlbFNlYXJjaC5iaW5kKHRoaXMpKVxuICAgIEBvbkRpZENoYW5nZVNlYXJjaChAaGFuZGxlQ2hhbmdlU2VhcmNoLmJpbmQodGhpcykpXG5cbiAgICBAdmltU3RhdGUuc2VhcmNoSW5wdXQuZm9jdXMoe0BiYWNrd2FyZHN9KVxuXG4gIGhhbmRsZUNvbW1hbmRFdmVudDogKGNvbW1hbmRFdmVudCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBpbnB1dFxuICAgIHN3aXRjaCBjb21tYW5kRXZlbnQubmFtZVxuICAgICAgd2hlbiAndmlzaXQnXG4gICAgICAgIHtkaXJlY3Rpb259ID0gY29tbWFuZEV2ZW50XG4gICAgICAgIGlmIEBpc0JhY2t3YXJkcygpIGFuZCBzZXR0aW5ncy5nZXQoJ2luY3JlbWVudGFsU2VhcmNoVmlzaXREaXJlY3Rpb24nKSBpcyAncmVsYXRpdmUnXG4gICAgICAgICAgZGlyZWN0aW9uID0gc3dpdGNoIGRpcmVjdGlvblxuICAgICAgICAgICAgd2hlbiAnbmV4dCcgdGhlbiAncHJldidcbiAgICAgICAgICAgIHdoZW4gJ3ByZXYnIHRoZW4gJ25leHQnXG5cbiAgICAgICAgc3dpdGNoIGRpcmVjdGlvblxuICAgICAgICAgIHdoZW4gJ25leHQnIHRoZW4gQGdldFNlYXJjaE1vZGVsKCkudmlzaXQoKzEpXG4gICAgICAgICAgd2hlbiAncHJldicgdGhlbiBAZ2V0U2VhcmNoTW9kZWwoKS52aXNpdCgtMSlcblxuICAgICAgd2hlbiAnb2NjdXJyZW5jZSdcbiAgICAgICAge29wZXJhdGlvbn0gPSBjb21tYW5kRXZlbnRcbiAgICAgICAgQHZpbVN0YXRlLm9jY3VycmVuY2VNYW5hZ2VyLnJlc2V0UGF0dGVybnMoKSBpZiBvcGVyYXRpb24/XG5cbiAgICAgICAgQHZpbVN0YXRlLm9jY3VycmVuY2VNYW5hZ2VyLmFkZFBhdHRlcm4oQGdldFBhdHRlcm4oQGlucHV0KSlcbiAgICAgICAgQHZpbVN0YXRlLnNlYXJjaEhpc3Rvcnkuc2F2ZShAaW5wdXQpXG4gICAgICAgIEB2aW1TdGF0ZS5zZWFyY2hJbnB1dC5jYW5jZWwoKVxuXG4gICAgICAgIEB2aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5ydW4ob3BlcmF0aW9uKSBpZiBvcGVyYXRpb24/XG4gICAgICB3aGVuICdwcm9qZWN0LWZpbmQnXG4gICAgICAgIEB2aW1TdGF0ZS5zZWFyY2hIaXN0b3J5LnNhdmUoQGlucHV0KVxuICAgICAgICBAdmltU3RhdGUuc2VhcmNoSW5wdXQuY2FuY2VsKClcbiAgICAgICAgc2VhcmNoQnlQcm9qZWN0RmluZChAZWRpdG9yLCBAaW5wdXQpXG5cbiAgaGFuZGxlQ2FuY2VsU2VhcmNoOiAtPlxuICAgIEB2aW1TdGF0ZS5yZXNldE5vcm1hbE1vZGUoKSB1bmxlc3MgQGlzTW9kZSgndmlzdWFsJykgb3IgQGlzTW9kZSgnaW5zZXJ0JylcbiAgICBAcmVzdG9yZUVkaXRvclN0YXRlPygpXG4gICAgQHZpbVN0YXRlLnJlc2V0KClcbiAgICBAZmluaXNoKClcblxuICBpc1NlYXJjaFJlcGVhdENoYXJhY3RlcjogKGNoYXIpIC0+XG4gICAgaWYgQGlzSW5jcmVtZW50YWxTZWFyY2goKVxuICAgICAgY2hhciBpcyAnJ1xuICAgIGVsc2VcbiAgICAgIHNlYXJjaENoYXIgPSBpZiBAaXNCYWNrd2FyZHMoKSB0aGVuICc/JyBlbHNlICcvJ1xuICAgICAgY2hhciBpbiBbJycsIHNlYXJjaENoYXJdXG5cbiAgaGFuZGxlQ29uZmlybVNlYXJjaDogKHtAaW5wdXQsIEBsYW5kaW5nUG9pbnR9KSA9PlxuICAgIGlmIEBpc1NlYXJjaFJlcGVhdENoYXJhY3RlcihAaW5wdXQpXG4gICAgICBAaW5wdXQgPSBAdmltU3RhdGUuc2VhcmNoSGlzdG9yeS5nZXQoJ3ByZXYnKVxuICAgICAgYXRvbS5iZWVwKCkgdW5sZXNzIEBpbnB1dFxuICAgIEBwcm9jZXNzT3BlcmF0aW9uKClcblxuICBoYW5kbGVDaGFuZ2VTZWFyY2g6IChAaW5wdXQpIC0+XG4gICAgIyBJZiBpbnB1dCBzdGFydHMgd2l0aCBzcGFjZSwgcmVtb3ZlIGZpcnN0IHNwYWNlIGFuZCBkaXNhYmxlIHVzZVJlZ2V4cC5cbiAgICBpZiBAaW5wdXQuc3RhcnRzV2l0aCgnICcpXG4gICAgICBAaW5wdXQgPSBAaW5wdXQucmVwbGFjZSgvXiAvLCAnJylcbiAgICAgIEB1c2VSZWdleHAgPSBmYWxzZVxuICAgIEB2aW1TdGF0ZS5zZWFyY2hJbnB1dC51cGRhdGVPcHRpb25TZXR0aW5ncyh7QHVzZVJlZ2V4cH0pXG5cbiAgICBpZiBAaXNJbmNyZW1lbnRhbFNlYXJjaCgpXG4gICAgICBAc2VhcmNoKEBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpLCBAaW5wdXQsIEBnZXRDb3VudCgpKVxuXG4gIGdldFBhdHRlcm46ICh0ZXJtKSAtPlxuICAgIG1vZGlmaWVycyA9IGlmIEBpc0Nhc2VTZW5zaXRpdmUodGVybSkgdGhlbiAnZycgZWxzZSAnZ2knXG4gICAgIyBGSVhNRSB0aGlzIHByZXZlbnQgc2VhcmNoIFxcXFxjIGl0c2VsZi5cbiAgICAjIERPTlQgdGhpbmtsZXNzbHkgbWltaWMgcHVyZSBWaW0uIEluc3RlYWQsIHByb3ZpZGUgaWdub3JlY2FzZSBidXR0b24gYW5kIHNob3J0Y3V0LlxuICAgIGlmIHRlcm0uaW5kZXhPZignXFxcXGMnKSA+PSAwXG4gICAgICB0ZXJtID0gdGVybS5yZXBsYWNlKCdcXFxcYycsICcnKVxuICAgICAgbW9kaWZpZXJzICs9ICdpJyB1bmxlc3MgJ2knIGluIG1vZGlmaWVyc1xuXG4gICAgaWYgQHVzZVJlZ2V4cFxuICAgICAgdHJ5XG4gICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHRlcm0sIG1vZGlmaWVycylcbiAgICAgIGNhdGNoXG4gICAgICAgIG51bGxcblxuICAgIG5ldyBSZWdFeHAoXy5lc2NhcGVSZWdFeHAodGVybSksIG1vZGlmaWVycylcblxuY2xhc3MgU2VhcmNoQmFja3dhcmRzIGV4dGVuZHMgU2VhcmNoXG4gIEBleHRlbmQoKVxuICBiYWNrd2FyZHM6IHRydWVcblxuIyAqLCAjXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFNlYXJjaEN1cnJlbnRXb3JkIGV4dGVuZHMgU2VhcmNoQmFzZVxuICBAZXh0ZW5kKClcbiAgY29uZmlnU2NvcGU6IFwiU2VhcmNoQ3VycmVudFdvcmRcIlxuXG4gIGdldElucHV0OiAtPlxuICAgIEBpbnB1dCA/PSAoXG4gICAgICB3b3JkUmFuZ2UgPSBAZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZSgpXG4gICAgICBpZiB3b3JkUmFuZ2U/XG4gICAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24od29yZFJhbmdlLnN0YXJ0KVxuICAgICAgICBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHdvcmRSYW5nZSlcbiAgICAgIGVsc2VcbiAgICAgICAgJydcbiAgICApXG5cbiAgZ2V0UGF0dGVybjogKHRlcm0pIC0+XG4gICAgbW9kaWZpZXJzID0gaWYgQGlzQ2FzZVNlbnNpdGl2ZSh0ZXJtKSB0aGVuICdnJyBlbHNlICdnaSdcbiAgICBwYXR0ZXJuID0gXy5lc2NhcGVSZWdFeHAodGVybSlcbiAgICBpZiAvXFxXLy50ZXN0KHRlcm0pXG4gICAgICBuZXcgUmVnRXhwKFwiI3twYXR0ZXJufVxcXFxiXCIsIG1vZGlmaWVycylcbiAgICBlbHNlXG4gICAgICBuZXcgUmVnRXhwKFwiXFxcXGIje3BhdHRlcm59XFxcXGJcIiwgbW9kaWZpZXJzKVxuXG4gIGdldEN1cnJlbnRXb3JkQnVmZmVyUmFuZ2U6IC0+XG4gICAgY3Vyc29yID0gQGVkaXRvci5nZXRMYXN0Q3Vyc29yKClcbiAgICBwb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICBub25Xb3JkQ2hhcmFjdGVycyA9IGdldE5vbldvcmRDaGFyYWN0ZXJzRm9yQ3Vyc29yKGN1cnNvcilcbiAgICB3b3JkUmVnZXggPSBuZXcgUmVnRXhwKFwiW15cXFxccyN7Xy5lc2NhcGVSZWdFeHAobm9uV29yZENoYXJhY3RlcnMpfV0rXCIsICdnJylcblxuICAgIGZvdW5kID0gbnVsbFxuICAgIHNjYW5SYW5nZSA9IEBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3cocG9pbnQucm93KVxuICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2Ugd29yZFJlZ2V4LCBzY2FuUmFuZ2UsICh7cmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgaWYgcmFuZ2UuZW5kLmlzR3JlYXRlclRoYW4ocG9pbnQpXG4gICAgICAgIGZvdW5kID0gcmFuZ2VcbiAgICAgICAgc3RvcCgpXG4gICAgZm91bmRcblxuY2xhc3MgU2VhcmNoQ3VycmVudFdvcmRCYWNrd2FyZHMgZXh0ZW5kcyBTZWFyY2hDdXJyZW50V29yZFxuICBAZXh0ZW5kKClcbiAgYmFja3dhcmRzOiB0cnVlXG4iXX0=
