(function() {
  var CompositeDisposable, Emitter, SearchModel, getIndex, getVisibleBufferRange, highlightRange, ref, ref1, scanInRanges, settings, smartScrollToBufferPosition;

  ref = require('atom'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  ref1 = require('./utils'), highlightRange = ref1.highlightRange, scanInRanges = ref1.scanInRanges, getVisibleBufferRange = ref1.getVisibleBufferRange, smartScrollToBufferPosition = ref1.smartScrollToBufferPosition, getIndex = ref1.getIndex;

  settings = require('./settings');

  module.exports = SearchModel = (function() {
    SearchModel.prototype.relativeIndex = 0;

    SearchModel.prototype.onDidChangeCurrentMatch = function(fn) {
      return this.emitter.on('did-change-current-match', fn);
    };

    function SearchModel(vimState, options) {
      var ref2;
      this.vimState = vimState;
      this.options = options;
      this.emitter = new Emitter;
      ref2 = this.vimState, this.editor = ref2.editor, this.editorElement = ref2.editorElement;
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.editorElement.onDidChangeScrollTop(this.refreshMarkers.bind(this)));
      this.disposables.add(this.editorElement.onDidChangeScrollLeft(this.refreshMarkers.bind(this)));
      this.markerLayer = this.editor.addMarkerLayer();
      this.decoationByRange = {};
      this.onDidChangeCurrentMatch((function(_this) {
        return function() {
          var hoverOptions;
          _this.vimState.hoverSearchCounter.reset();
          if (_this.currentMatch == null) {
            if (settings.get('flashScreenOnSearchHasNoMatch')) {
              _this.vimState.flash(getVisibleBufferRange(_this.editor), {
                type: 'screen'
              });
              atom.beep();
            }
            return;
          }
          if (settings.get('showHoverSearchCounter')) {
            hoverOptions = {
              text: (_this.currentMatchIndex + 1) + "/" + _this.matches.length,
              classList: _this.classNamesForRange(_this.currentMatch)
            };
            if (!_this.options.incrementalSearch) {
              hoverOptions.timeout = settings.get('showHoverSearchCounterDuration');
            }
            _this.vimState.hoverSearchCounter.withTimeout(_this.currentMatch.start, hoverOptions);
          }
          _this.editor.unfoldBufferRow(_this.currentMatch.start.row);
          smartScrollToBufferPosition(_this.editor, _this.currentMatch.start);
          if (settings.get('flashOnSearch')) {
            return _this.vimState.flash(_this.currentMatch, {
              type: 'search'
            });
          }
        };
      })(this));
    }

    SearchModel.prototype.destroy = function() {
      this.markerLayer.destroy();
      this.disposables.dispose();
      return this.decoationByRange = null;
    };

    SearchModel.prototype.clearMarkers = function() {
      var i, len, marker, ref2;
      ref2 = this.markerLayer.getMarkers();
      for (i = 0, len = ref2.length; i < len; i++) {
        marker = ref2[i];
        marker.destroy();
      }
      return this.decoationByRange = {};
    };

    SearchModel.prototype.classNamesForRange = function(range) {
      var classNames;
      classNames = [];
      if (range === this.firstMatch) {
        classNames.push('first');
      } else if (range === this.lastMatch) {
        classNames.push('last');
      }
      if (range === this.currentMatch) {
        classNames.push('current');
      }
      return classNames;
    };

    SearchModel.prototype.refreshMarkers = function() {
      var i, len, range, ref2, results;
      this.clearMarkers();
      ref2 = this.getVisibleMatchRanges();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        range = ref2[i];
        results.push(this.decoationByRange[range.toString()] = this.decorateRange(range));
      }
      return results;
    };

    SearchModel.prototype.getVisibleMatchRanges = function() {
      var visibleMatchRanges, visibleRange;
      visibleRange = getVisibleBufferRange(this.editor);
      return visibleMatchRanges = this.matches.filter(function(range) {
        return range.intersectsWith(visibleRange);
      });
    };

    SearchModel.prototype.decorateRange = function(range) {
      var classNames, ref2;
      classNames = this.classNamesForRange(range);
      classNames = (ref2 = ['vim-mode-plus-search-match']).concat.apply(ref2, classNames);
      return this.editor.decorateMarker(this.markerLayer.markBufferRange(range), {
        type: 'highlight',
        "class": classNames.join(' ')
      });
    };

    SearchModel.prototype.search = function(fromPoint, pattern, relativeIndex) {
      var currentMatch, i, j, len, range, ref2, ref3, ref4;
      this.pattern = pattern;
      this.matches = [];
      this.editor.scan(this.pattern, (function(_this) {
        return function(arg) {
          var range;
          range = arg.range;
          return _this.matches.push(range);
        };
      })(this));
      ref2 = this.matches, this.firstMatch = ref2[0], this.lastMatch = ref2[ref2.length - 1];
      currentMatch = null;
      if (relativeIndex >= 0) {
        ref3 = this.matches;
        for (i = 0, len = ref3.length; i < len; i++) {
          range = ref3[i];
          if (!(range.start.isGreaterThan(fromPoint))) {
            continue;
          }
          currentMatch = range;
          break;
        }
        if (currentMatch == null) {
          currentMatch = this.firstMatch;
        }
        relativeIndex--;
      } else {
        ref4 = this.matches;
        for (j = ref4.length - 1; j >= 0; j += -1) {
          range = ref4[j];
          if (!(range.start.isLessThan(fromPoint))) {
            continue;
          }
          currentMatch = range;
          break;
        }
        if (currentMatch == null) {
          currentMatch = this.lastMatch;
        }
        relativeIndex++;
      }
      this.currentMatchIndex = this.matches.indexOf(currentMatch);
      this.updateCurrentMatch(relativeIndex);
      if (this.options.incrementalSearch) {
        this.refreshMarkers();
      }
      this.initialCurrentMatchIndex = this.currentMatchIndex;
      return this.currentMatch;
    };

    SearchModel.prototype.updateCurrentMatch = function(relativeIndex) {
      this.currentMatchIndex = getIndex(this.currentMatchIndex + relativeIndex, this.matches);
      this.currentMatch = this.matches[this.currentMatchIndex];
      return this.emitter.emit('did-change-current-match');
    };

    SearchModel.prototype.visit = function(relativeIndex) {
      var newClass, newDecoration, oldClass, oldDecoration;
      if (!this.matches.length) {
        return;
      }
      oldDecoration = this.decoationByRange[this.currentMatch.toString()];
      this.updateCurrentMatch(relativeIndex);
      newDecoration = this.decoationByRange[this.currentMatch.toString()];
      if (oldDecoration != null) {
        oldClass = oldDecoration.getProperties()["class"];
        oldClass = oldClass.replace(/\s+current(\s+)?$/, '$1');
        oldDecoration.setProperties({
          type: 'highlight',
          "class": oldClass
        });
      }
      if (newDecoration != null) {
        newClass = newDecoration.getProperties()["class"];
        newClass = newClass.replace(/\s+current(\s+)?$/, '$1');
        newClass += ' current';
        return newDecoration.setProperties({
          type: 'highlight',
          "class": newClass
        });
      }
    };

    SearchModel.prototype.getRelativeIndex = function() {
      return this.currentMatchIndex - this.initialCurrentMatchIndex;
    };

    return SearchModel;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvc2VhcmNoLW1vZGVsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBaUMsT0FBQSxDQUFRLE1BQVIsQ0FBakMsRUFBQyxxQkFBRCxFQUFVOztFQUNWLE9BTUksT0FBQSxDQUFRLFNBQVIsQ0FOSixFQUNFLG9DQURGLEVBRUUsZ0NBRkYsRUFHRSxrREFIRixFQUlFLDhEQUpGLEVBS0U7O0VBRUYsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUVYLE1BQU0sQ0FBQyxPQUFQLEdBQ007MEJBQ0osYUFBQSxHQUFlOzswQkFDZix1QkFBQSxHQUF5QixTQUFDLEVBQUQ7YUFBUSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSwwQkFBWixFQUF3QyxFQUF4QztJQUFSOztJQUVaLHFCQUFDLFFBQUQsRUFBWSxPQUFaO0FBQ1gsVUFBQTtNQURZLElBQUMsQ0FBQSxXQUFEO01BQVcsSUFBQyxDQUFBLFVBQUQ7TUFDdkIsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BRWYsT0FBNEIsSUFBQyxDQUFBLFFBQTdCLEVBQUMsSUFBQyxDQUFBLGNBQUEsTUFBRixFQUFVLElBQUMsQ0FBQSxxQkFBQTtNQUNYLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSTtNQUNuQixJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxvQkFBZixDQUFvQyxJQUFDLENBQUEsY0FBYyxDQUFDLElBQWhCLENBQXFCLElBQXJCLENBQXBDLENBQWpCO01BQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxhQUFhLENBQUMscUJBQWYsQ0FBcUMsSUFBQyxDQUFBLGNBQWMsQ0FBQyxJQUFoQixDQUFxQixJQUFyQixDQUFyQyxDQUFqQjtNQUNBLElB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QyxRQUFkLENBQUEsQ0FBQTtNQUNsQyxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsYUFBcEI7TUFDQSxhQUFBLEdBQWdCLElBQUMsQ0FBQSxnQkFBaUIsQ0FBQSxJQUFDLENBQUEsWUFBWSxDQUFDLFFBQWQsQ0FBQSxDQUFBO01BRWxDLElBQUcscUJBQUg7UUFDRSxRQUFBLEdBQVcsYUFBYSxDQUFDLGFBQWQsQ0FBQSxDQUE2QixFQUFDLEtBQUQ7UUFDeEMsUUFBQSxHQUFXLFFBQVEsQ0FBQyxPQUFULENBQWlCLG1CQUFqQixFQUFzQyxJQUF0QztRQUNYLGFBQWEsQ0FBQyxhQUFkLENBQTRCO1VBQUEsSUFBQSxFQUFNLFdBQU47VUFBbUIsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUExQjtTQUE1QixFQUhGOztNQUtBLElBQUcscUJBQUg7UUFDRSxRQUFBLEdBQVcsYUFBYSxDQUFDLGFBQWQsQ0FBQSxDQUE2QixFQUFDLEtBQUQ7UUFDeEMsUUFBQSxHQUFXLFFBQVEsQ0FBQyxPQUFULENBQWlCLG1CQUFqQixFQUFzQyxJQUF0QztRQUNYLFFBQUEsSUFBWTtlQUNaLGFBQWEsQ0FBQyxhQUFkLENBQTRCO1VBQUEsSUFBQSxFQUFNLFdBQU47VUFBbUIsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUExQjtTQUE1QixFQUpGOztJQVhLOzswQkFpQlAsZ0JBQUEsR0FBa0IsU0FBQTthQUNoQixJQUFDLENBQUEsaUJBQUQsR0FBcUIsSUFBQyxDQUFBO0lBRE47Ozs7O0FBM0lwQiIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG57XG4gIGhpZ2hsaWdodFJhbmdlXG4gIHNjYW5JblJhbmdlc1xuICBnZXRWaXNpYmxlQnVmZmVyUmFuZ2VcbiAgc21hcnRTY3JvbGxUb0J1ZmZlclBvc2l0aW9uXG4gIGdldEluZGV4XG59ID0gcmVxdWlyZSAnLi91dGlscydcbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgU2VhcmNoTW9kZWxcbiAgcmVsYXRpdmVJbmRleDogMFxuICBvbkRpZENoYW5nZUN1cnJlbnRNYXRjaDogKGZuKSAtPiBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZS1jdXJyZW50LW1hdGNoJywgZm5cblxuICBjb25zdHJ1Y3RvcjogKEB2aW1TdGF0ZSwgQG9wdGlvbnMpIC0+XG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXG4gICAge0BlZGl0b3IsIEBlZGl0b3JFbGVtZW50fSA9IEB2aW1TdGF0ZVxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGRpc3Bvc2FibGVzLmFkZChAZWRpdG9yRWxlbWVudC5vbkRpZENoYW5nZVNjcm9sbFRvcChAcmVmcmVzaE1hcmtlcnMuYmluZCh0aGlzKSkpXG4gICAgQGRpc3Bvc2FibGVzLmFkZChAZWRpdG9yRWxlbWVudC5vbkRpZENoYW5nZVNjcm9sbExlZnQoQHJlZnJlc2hNYXJrZXJzLmJpbmQodGhpcykpKVxuICAgIEBtYXJrZXJMYXllciA9IEBlZGl0b3IuYWRkTWFya2VyTGF5ZXIoKVxuICAgIEBkZWNvYXRpb25CeVJhbmdlID0ge31cblxuICAgIEBvbkRpZENoYW5nZUN1cnJlbnRNYXRjaCA9PlxuICAgICAgQHZpbVN0YXRlLmhvdmVyU2VhcmNoQ291bnRlci5yZXNldCgpXG4gICAgICB1bmxlc3MgQGN1cnJlbnRNYXRjaD9cbiAgICAgICAgaWYgc2V0dGluZ3MuZ2V0KCdmbGFzaFNjcmVlbk9uU2VhcmNoSGFzTm9NYXRjaCcpXG4gICAgICAgICAgQHZpbVN0YXRlLmZsYXNoKGdldFZpc2libGVCdWZmZXJSYW5nZShAZWRpdG9yKSwgdHlwZTogJ3NjcmVlbicpXG4gICAgICAgICAgYXRvbS5iZWVwKClcblxuICAgICAgICByZXR1cm5cblxuICAgICAgaWYgc2V0dGluZ3MuZ2V0KCdzaG93SG92ZXJTZWFyY2hDb3VudGVyJylcbiAgICAgICAgaG92ZXJPcHRpb25zID1cbiAgICAgICAgICB0ZXh0OiBcIiN7QGN1cnJlbnRNYXRjaEluZGV4ICsgMX0vI3tAbWF0Y2hlcy5sZW5ndGh9XCJcbiAgICAgICAgICBjbGFzc0xpc3Q6IEBjbGFzc05hbWVzRm9yUmFuZ2UoQGN1cnJlbnRNYXRjaClcblxuICAgICAgICB1bmxlc3MgQG9wdGlvbnMuaW5jcmVtZW50YWxTZWFyY2hcbiAgICAgICAgICBob3Zlck9wdGlvbnMudGltZW91dCA9IHNldHRpbmdzLmdldCgnc2hvd0hvdmVyU2VhcmNoQ291bnRlckR1cmF0aW9uJylcblxuICAgICAgICBAdmltU3RhdGUuaG92ZXJTZWFyY2hDb3VudGVyLndpdGhUaW1lb3V0KEBjdXJyZW50TWF0Y2guc3RhcnQsIGhvdmVyT3B0aW9ucylcblxuICAgICAgQGVkaXRvci51bmZvbGRCdWZmZXJSb3coQGN1cnJlbnRNYXRjaC5zdGFydC5yb3cpXG4gICAgICBzbWFydFNjcm9sbFRvQnVmZmVyUG9zaXRpb24oQGVkaXRvciwgQGN1cnJlbnRNYXRjaC5zdGFydClcblxuICAgICAgaWYgc2V0dGluZ3MuZ2V0KCdmbGFzaE9uU2VhcmNoJylcbiAgICAgICAgQHZpbVN0YXRlLmZsYXNoKEBjdXJyZW50TWF0Y2gsIHR5cGU6ICdzZWFyY2gnKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQG1hcmtlckxheWVyLmRlc3Ryb3koKVxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAZGVjb2F0aW9uQnlSYW5nZSA9IG51bGxcblxuICBjbGVhck1hcmtlcnM6IC0+XG4gICAgZm9yIG1hcmtlciBpbiBAbWFya2VyTGF5ZXIuZ2V0TWFya2VycygpXG4gICAgICBtYXJrZXIuZGVzdHJveSgpXG4gICAgQGRlY29hdGlvbkJ5UmFuZ2UgPSB7fVxuXG4gIGNsYXNzTmFtZXNGb3JSYW5nZTogKHJhbmdlKSAtPlxuICAgIGNsYXNzTmFtZXMgPSBbXVxuICAgIGlmIHJhbmdlIGlzIEBmaXJzdE1hdGNoXG4gICAgICBjbGFzc05hbWVzLnB1c2goJ2ZpcnN0JylcbiAgICBlbHNlIGlmIHJhbmdlIGlzIEBsYXN0TWF0Y2hcbiAgICAgIGNsYXNzTmFtZXMucHVzaCgnbGFzdCcpXG5cbiAgICBpZiByYW5nZSBpcyBAY3VycmVudE1hdGNoXG4gICAgICBjbGFzc05hbWVzLnB1c2goJ2N1cnJlbnQnKVxuXG4gICAgY2xhc3NOYW1lc1xuXG4gIHJlZnJlc2hNYXJrZXJzOiAtPlxuICAgIEBjbGVhck1hcmtlcnMoKVxuICAgIGZvciByYW5nZSBpbiBAZ2V0VmlzaWJsZU1hdGNoUmFuZ2VzKClcbiAgICAgIEBkZWNvYXRpb25CeVJhbmdlW3JhbmdlLnRvU3RyaW5nKCldID0gQGRlY29yYXRlUmFuZ2UocmFuZ2UpXG5cbiAgZ2V0VmlzaWJsZU1hdGNoUmFuZ2VzOiAtPlxuICAgIHZpc2libGVSYW5nZSA9IGdldFZpc2libGVCdWZmZXJSYW5nZShAZWRpdG9yKVxuICAgIHZpc2libGVNYXRjaFJhbmdlcyA9IEBtYXRjaGVzLmZpbHRlciAocmFuZ2UpIC0+XG4gICAgICByYW5nZS5pbnRlcnNlY3RzV2l0aCh2aXNpYmxlUmFuZ2UpXG5cbiAgZGVjb3JhdGVSYW5nZTogKHJhbmdlKSAtPlxuICAgIGNsYXNzTmFtZXMgPSBAY2xhc3NOYW1lc0ZvclJhbmdlKHJhbmdlKVxuICAgIGNsYXNzTmFtZXMgPSBbJ3ZpbS1tb2RlLXBsdXMtc2VhcmNoLW1hdGNoJ10uY29uY2F0KGNsYXNzTmFtZXMuLi4pXG4gICAgQGVkaXRvci5kZWNvcmF0ZU1hcmtlciBAbWFya2VyTGF5ZXIubWFya0J1ZmZlclJhbmdlKHJhbmdlKSxcbiAgICAgIHR5cGU6ICdoaWdobGlnaHQnXG4gICAgICBjbGFzczogY2xhc3NOYW1lcy5qb2luKCcgJylcblxuICBzZWFyY2g6IChmcm9tUG9pbnQsIEBwYXR0ZXJuLCByZWxhdGl2ZUluZGV4KSAtPlxuICAgIEBtYXRjaGVzID0gW11cbiAgICBAZWRpdG9yLnNjYW4gQHBhdHRlcm4sICh7cmFuZ2V9KSA9PlxuICAgICAgQG1hdGNoZXMucHVzaChyYW5nZSlcblxuICAgIFtAZmlyc3RNYXRjaCwgLi4uLCBAbGFzdE1hdGNoXSA9IEBtYXRjaGVzXG5cbiAgICBjdXJyZW50TWF0Y2ggPSBudWxsXG4gICAgaWYgcmVsYXRpdmVJbmRleCA+PSAwXG4gICAgICBmb3IgcmFuZ2UgaW4gQG1hdGNoZXMgd2hlbiByYW5nZS5zdGFydC5pc0dyZWF0ZXJUaGFuKGZyb21Qb2ludClcbiAgICAgICAgY3VycmVudE1hdGNoID0gcmFuZ2VcbiAgICAgICAgYnJlYWtcbiAgICAgIGN1cnJlbnRNYXRjaCA/PSBAZmlyc3RNYXRjaFxuICAgICAgcmVsYXRpdmVJbmRleC0tXG4gICAgZWxzZVxuICAgICAgZm9yIHJhbmdlIGluIEBtYXRjaGVzIGJ5IC0xIHdoZW4gcmFuZ2Uuc3RhcnQuaXNMZXNzVGhhbihmcm9tUG9pbnQpXG4gICAgICAgIGN1cnJlbnRNYXRjaCA9IHJhbmdlXG4gICAgICAgIGJyZWFrXG4gICAgICBjdXJyZW50TWF0Y2ggPz0gQGxhc3RNYXRjaFxuICAgICAgcmVsYXRpdmVJbmRleCsrXG5cbiAgICBAY3VycmVudE1hdGNoSW5kZXggPSBAbWF0Y2hlcy5pbmRleE9mKGN1cnJlbnRNYXRjaClcbiAgICBAdXBkYXRlQ3VycmVudE1hdGNoKHJlbGF0aXZlSW5kZXgpXG4gICAgaWYgQG9wdGlvbnMuaW5jcmVtZW50YWxTZWFyY2hcbiAgICAgIEByZWZyZXNoTWFya2VycygpXG4gICAgQGluaXRpYWxDdXJyZW50TWF0Y2hJbmRleCA9IEBjdXJyZW50TWF0Y2hJbmRleFxuICAgIEBjdXJyZW50TWF0Y2hcblxuICB1cGRhdGVDdXJyZW50TWF0Y2g6IChyZWxhdGl2ZUluZGV4KSAtPlxuICAgIEBjdXJyZW50TWF0Y2hJbmRleCA9IGdldEluZGV4KEBjdXJyZW50TWF0Y2hJbmRleCArIHJlbGF0aXZlSW5kZXgsIEBtYXRjaGVzKVxuICAgIEBjdXJyZW50TWF0Y2ggPSBAbWF0Y2hlc1tAY3VycmVudE1hdGNoSW5kZXhdXG4gICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWNoYW5nZS1jdXJyZW50LW1hdGNoJylcblxuICB2aXNpdDogKHJlbGF0aXZlSW5kZXgpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAbWF0Y2hlcy5sZW5ndGhcbiAgICBvbGREZWNvcmF0aW9uID0gQGRlY29hdGlvbkJ5UmFuZ2VbQGN1cnJlbnRNYXRjaC50b1N0cmluZygpXVxuICAgIEB1cGRhdGVDdXJyZW50TWF0Y2gocmVsYXRpdmVJbmRleClcbiAgICBuZXdEZWNvcmF0aW9uID0gQGRlY29hdGlvbkJ5UmFuZ2VbQGN1cnJlbnRNYXRjaC50b1N0cmluZygpXVxuXG4gICAgaWYgb2xkRGVjb3JhdGlvbj9cbiAgICAgIG9sZENsYXNzID0gb2xkRGVjb3JhdGlvbi5nZXRQcm9wZXJ0aWVzKCkuY2xhc3NcbiAgICAgIG9sZENsYXNzID0gb2xkQ2xhc3MucmVwbGFjZSgvXFxzK2N1cnJlbnQoXFxzKyk/JC8sICckMScpXG4gICAgICBvbGREZWNvcmF0aW9uLnNldFByb3BlcnRpZXModHlwZTogJ2hpZ2hsaWdodCcsIGNsYXNzOiBvbGRDbGFzcylcblxuICAgIGlmIG5ld0RlY29yYXRpb24/XG4gICAgICBuZXdDbGFzcyA9IG5ld0RlY29yYXRpb24uZ2V0UHJvcGVydGllcygpLmNsYXNzXG4gICAgICBuZXdDbGFzcyA9IG5ld0NsYXNzLnJlcGxhY2UoL1xccytjdXJyZW50KFxccyspPyQvLCAnJDEnKVxuICAgICAgbmV3Q2xhc3MgKz0gJyBjdXJyZW50J1xuICAgICAgbmV3RGVjb3JhdGlvbi5zZXRQcm9wZXJ0aWVzKHR5cGU6ICdoaWdobGlnaHQnLCBjbGFzczogbmV3Q2xhc3MpXG5cbiAgZ2V0UmVsYXRpdmVJbmRleDogLT5cbiAgICBAY3VycmVudE1hdGNoSW5kZXggLSBAaW5pdGlhbEN1cnJlbnRNYXRjaEluZGV4XG4iXX0=
