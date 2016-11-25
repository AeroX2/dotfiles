(function() {
  var CompositeDisposable, Emitter, OccurrenceManager, _, ref, ref1, scanEditor, shrinkRangeEndToBeforeNewLine;

  _ = require('underscore-plus');

  ref = require('atom'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  ref1 = require('./utils'), scanEditor = ref1.scanEditor, shrinkRangeEndToBeforeNewLine = ref1.shrinkRangeEndToBeforeNewLine;

  module.exports = OccurrenceManager = (function() {
    OccurrenceManager.prototype.patterns = null;

    function OccurrenceManager(vimState) {
      var options, ref2;
      this.vimState = vimState;
      ref2 = this.vimState, this.editor = ref2.editor, this.editorElement = ref2.editorElement;
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      this.emitter = new Emitter;
      this.patterns = [];
      this.markerLayer = this.editor.addMarkerLayer();
      options = {
        type: 'highlight',
        "class": 'vim-mode-plus-occurrence-match'
      };
      this.decorationLayer = this.editor.decorateMarkerLayer(this.markerLayer, options);
      this.onDidChangePatterns((function(_this) {
        return function(arg) {
          var i, j, len, len1, marker, newPattern, range, ref3, ref4, results1, results2;
          newPattern = arg.newPattern;
          if (newPattern) {
            ref3 = scanEditor(_this.editor, newPattern);
            results1 = [];
            for (i = 0, len = ref3.length; i < len; i++) {
              range = ref3[i];
              results1.push(_this.markerLayer.markBufferRange(range));
            }
            return results1;
          } else {
            ref4 = _this.markerLayer.getMarkers();
            results2 = [];
            for (j = 0, len1 = ref4.length; j < len1; j++) {
              marker = ref4[j];
              results2.push(marker.destroy());
            }
            return results2;
          }
        };
      })(this));
      this.markerLayer.onDidUpdate((function(_this) {
        return function() {
          return _this.editorElement.classList.toggle("has-occurrence", _this.hasMarkers());
        };
      })(this));
    }

    OccurrenceManager.prototype.onDidChangePatterns = function(fn) {
      return this.emitter.on('did-change-patterns', fn);
    };

    OccurrenceManager.prototype.destroy = function() {
      this.decorationLayer.destroy();
      this.disposables.dispose();
      return this.markerLayer.destroy();
    };

    OccurrenceManager.prototype.getMarkerRangesIntersectsWithRanges = function(ranges, exclusive) {
      if (exclusive == null) {
        exclusive = false;
      }
      return this.getMarkersIntersectsWithRanges(ranges, exclusive).map(function(marker) {
        return marker.getBufferRange();
      });
    };

    OccurrenceManager.prototype.hasPatterns = function() {
      return this.patterns.length > 0;
    };

    OccurrenceManager.prototype.resetPatterns = function() {
      this.patterns = [];
      return this.emitter.emit('did-change-patterns', {});
    };

    OccurrenceManager.prototype.addPattern = function(pattern) {
      if (pattern == null) {
        pattern = null;
      }
      this.patterns.push(pattern);
      return this.emitter.emit('did-change-patterns', {
        newPattern: pattern
      });
    };

    OccurrenceManager.prototype.buildPattern = function() {
      var source;
      source = this.patterns.map(function(pattern) {
        return pattern.source;
      }).join('|');
      return new RegExp(source, 'g');
    };

    OccurrenceManager.prototype.hasMarkers = function() {
      return this.markerLayer.getMarkerCount() > 0;
    };

    OccurrenceManager.prototype.getMarkers = function() {
      return this.markerLayer.getMarkers();
    };

    OccurrenceManager.prototype.getMarkerCount = function() {
      return this.markerLayer.getMarkerCount();
    };

    OccurrenceManager.prototype.getMarkersIntersectsWithRanges = function(ranges, exclusive) {
      var i, len, markers, range, results;
      if (exclusive == null) {
        exclusive = false;
      }
      ranges = ranges.map(function(range) {
        return shrinkRangeEndToBeforeNewLine(range);
      });
      results = [];
      for (i = 0, len = ranges.length; i < len; i++) {
        range = ranges[i];
        markers = this.markerLayer.findMarkers({
          intersectsBufferRange: range
        }).filter(function(marker) {
          return range.intersectsWith(marker.getBufferRange(), exclusive);
        });
        results.push.apply(results, markers);
      }
      return results;
    };

    OccurrenceManager.prototype.getMarkerAtPoint = function(point) {
      return this.markerLayer.findMarkers({
        containsBufferPosition: point
      })[0];
    };

    return OccurrenceManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvb2NjdXJyZW5jZS1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFpQyxPQUFBLENBQVEsTUFBUixDQUFqQyxFQUFDLHFCQUFELEVBQVU7O0VBRVYsT0FHSSxPQUFBLENBQVEsU0FBUixDQUhKLEVBQ0UsNEJBREYsRUFFRTs7RUFHRixNQUFNLENBQUMsT0FBUCxHQUNNO2dDQUNKLFFBQUEsR0FBVTs7SUFFRywyQkFBQyxRQUFEO0FBQ1gsVUFBQTtNQURZLElBQUMsQ0FBQSxXQUFEO01BQ1osT0FBNEIsSUFBQyxDQUFBLFFBQTdCLEVBQUMsSUFBQyxDQUFBLGNBQUEsTUFBRixFQUFVLElBQUMsQ0FBQSxxQkFBQTtNQUNYLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSTtNQUNuQixJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxZQUFWLENBQXVCLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLElBQWQsQ0FBdkIsQ0FBakI7TUFDQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFDZixJQUFDLENBQUEsUUFBRCxHQUFZO01BRVosSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBQTtNQUNmLE9BQUEsR0FBVTtRQUFDLElBQUEsRUFBTSxXQUFQO1FBQW9CLENBQUEsS0FBQSxDQUFBLEVBQU8sZ0NBQTNCOztNQUNWLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxNQUFNLENBQUMsbUJBQVIsQ0FBNEIsSUFBQyxDQUFBLFdBQTdCLEVBQTBDLE9BQTFDO01BS25CLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixDQUFBLFNBQUEs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QyxNQUF2RCxDQUE4RCxTQUFDLE1BQUQ7aUJBQ3RFLEtBQUssQ0FBQyxjQUFOLENBQXFCLE1BQU0sQ0FBQyxjQUFQLENBQUEsQ0FBckIsRUFBOEMsU0FBOUM7UUFEc0UsQ0FBOUQ7UUFFVixPQUFPLENBQUMsSUFBUixnQkFBYSxPQUFiO0FBSEY7YUFJQTtJQVo4Qjs7Z0NBY2hDLGdCQUFBLEdBQWtCLFNBQUMsS0FBRDthQUNoQixJQUFDLENBQUEsV0FBVyxDQUFDLFdBQWIsQ0FBeUI7UUFBQSxzQkFBQSxFQUF3QixLQUF4QjtPQUF6QixDQUF3RCxDQUFBLENBQUE7SUFEeEM7Ozs7O0FBakdwQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57RW1pdHRlciwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG57XG4gIHNjYW5FZGl0b3JcbiAgc2hyaW5rUmFuZ2VFbmRUb0JlZm9yZU5ld0xpbmVcbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBPY2N1cnJlbmNlTWFuYWdlclxuICBwYXR0ZXJuczogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yLCBAZWRpdG9yRWxlbWVudH0gPSBAdmltU3RhdGVcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHZpbVN0YXRlLm9uRGlkRGVzdHJveShAZGVzdHJveS5iaW5kKHRoaXMpKVxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAcGF0dGVybnMgPSBbXVxuXG4gICAgQG1hcmtlckxheWVyID0gQGVkaXRvci5hZGRNYXJrZXJMYXllcigpXG4gICAgb3B0aW9ucyA9IHt0eXBlOiAnaGlnaGxpZ2h0JywgY2xhc3M6ICd2aW0tbW9kZS1wbHVzLW9jY3VycmVuY2UtbWF0Y2gnfVxuICAgIEBkZWNvcmF0aW9uTGF5ZXIgPSBAZWRpdG9yLmRlY29yYXRlTWFya2VyTGF5ZXIoQG1hcmtlckxheWVyLCBvcHRpb25zKVxuXG4gICAgIyBAcGF0dGVybnMgaXMgc2luZ2xlIHNvdXJjZSBvZiB0cnV0aCAoU1NPVClcbiAgICAjIEFsbCBtYWtlciBjcmVhdGUvZGVzdHJveS9jc3MtdXBkYXRlIGlzIGRvbmUgYnkgcmVhY3RpbmcgQHBhdHRlcnMncyBjaGFuZ2UuXG4gICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQG9uRGlkQ2hhbmdlUGF0dGVybnMgKHtuZXdQYXR0ZXJufSkgPT5cbiAgICAgIGlmIG5ld1BhdHRlcm5cbiAgICAgICAgQG1hcmtlckxheWVyLm1hcmtCdWZmZXJSYW5nZShyYW5nZSkgZm9yIHJhbmdlIGluIHNjYW5FZGl0b3IoQGVkaXRvciwgbmV3UGF0dGVybilcbiAgICAgIGVsc2VcbiAgICAgICAgIyBXaGVuIHBhdHRlcm5zIHdlcmUgY2xlYXJlZCwgZGVzdHJveSBhbGwgbWFya2VyLlxuICAgICAgICBtYXJrZXIuZGVzdHJveSgpIGZvciBtYXJrZXIgaW4gQG1hcmtlckxheWVyLmdldE1hcmtlcnMoKVxuXG4gICAgIyBVcGRhdGUgY3NzIG9uIGV2ZXJ5IG1hcmtlciB1cGRhdGUuXG4gICAgQG1hcmtlckxheWVyLm9uRGlkVXBkYXRlID0+XG4gICAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFwiaGFzLW9jY3VycmVuY2VcIiwgQGhhc01hcmtlcnMoKSlcblxuICAjIENhbGxiYWNrIGdldCBwYXNzZWQgZm9sbG93aW5nIG9iamVjdFxuICAjIC0gbmV3UGF0dGVybjogY2FuIGJlIHVuZGVmaW5lZCBvbiByZXNldCBldmVudFxuICBvbkRpZENoYW5nZVBhdHRlcm5zOiAoZm4pIC0+XG4gICAgQGVtaXR0ZXIub24oJ2RpZC1jaGFuZ2UtcGF0dGVybnMnLCBmbilcblxuICBkZXN0cm95OiAtPlxuICAgIEBkZWNvcmF0aW9uTGF5ZXIuZGVzdHJveSgpXG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICAgIEBtYXJrZXJMYXllci5kZXN0cm95KClcblxuICBnZXRNYXJrZXJSYW5nZXNJbnRlcnNlY3RzV2l0aFJhbmdlczogKHJhbmdlcywgZXhjbHVzaXZlPWZhbHNlKSAtPlxuICAgIEBnZXRNYXJrZXJzSW50ZXJzZWN0c1dpdGhSYW5nZXMocmFuZ2VzLCBleGNsdXNpdmUpLm1hcCAobWFya2VyKSAtPlxuICAgICAgbWFya2VyLmdldEJ1ZmZlclJhbmdlKClcblxuICAjIFBhdHRlcm5zXG4gIGhhc1BhdHRlcm5zOiAtPlxuICAgIEBwYXR0ZXJucy5sZW5ndGggPiAwXG5cbiAgcmVzZXRQYXR0ZXJuczogLT5cbiAgICBAcGF0dGVybnMgPSBbXVxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1jaGFuZ2UtcGF0dGVybnMnLCB7fSlcblxuICBhZGRQYXR0ZXJuOiAocGF0dGVybj1udWxsKSAtPlxuICAgIEBwYXR0ZXJucy5wdXNoKHBhdHRlcm4pXG4gICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWNoYW5nZS1wYXR0ZXJucycsIHtuZXdQYXR0ZXJuOiBwYXR0ZXJufSlcblxuICAjIFJldHVybiByZWdleCByZXByZXNlbnRpbmcgZmluYWwgcGF0dGVybi5cbiAgIyBVc2VkIHRvIGNhY2hlIGZpbmFsIHBhdHRlcm4gdG8gZWFjaCBpbnN0YW5jZSBvZiBvcGVyYXRvciBzbyB0aGF0IHdlIGNhblxuICAjIHJlcGVhdCByZWNvcmRlZCBvcGVyYXRpb24gYnkgYC5gLlxuICAjIFBhdHRlcm4gY2FuIGJlIGFkZGVkIGludGVyYWN0aXZlbHkgb25lIGJ5IG9uZSwgYnV0IHdlIHNhdmUgaXQgYXMgdW5pb24gcGF0dGVybi5cbiAgYnVpbGRQYXR0ZXJuOiAtPlxuICAgIHNvdXJjZSA9IEBwYXR0ZXJucy5tYXAoKHBhdHRlcm4pIC0+IHBhdHRlcm4uc291cmNlKS5qb2luKCd8JylcbiAgICBuZXcgUmVnRXhwKHNvdXJjZSwgJ2cnKVxuXG4gICMgTWFya2Vyc1xuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaGFzTWFya2VyczogLT5cbiAgICBAbWFya2VyTGF5ZXIuZ2V0TWFya2VyQ291bnQoKSA+IDBcblxuICBnZXRNYXJrZXJzOiAtPlxuICAgIEBtYXJrZXJMYXllci5nZXRNYXJrZXJzKClcblxuICBnZXRNYXJrZXJDb3VudDogLT5cbiAgICBAbWFya2VyTGF5ZXIuZ2V0TWFya2VyQ291bnQoKVxuXG4gICMgUmV0dXJuIG9jY3VycmVuY2UgbWFya2VycyBpbnRlcnNlY3RpbmcgZ2l2ZW4gcmFuZ2VzXG4gIGdldE1hcmtlcnNJbnRlcnNlY3RzV2l0aFJhbmdlczogKHJhbmdlcywgZXhjbHVzaXZlPWZhbHNlKSAtPlxuICAgICMgZmluZG1hcmtlcnMoKSdzIGludGVyc2VjdHNCdWZmZXJSYW5nZSBwYXJhbSBoYXZlIG5vIGV4Y2x1c2l2ZSBjb3RudHJvbGxcbiAgICAjIFNvIEkgbmVlZCBleHRyYSBjaGVjayB0byBmaWx0ZXIgb3V0IHVud2FudGVkIG1hcmtlci5cbiAgICAjIEJ1dCBiYXNpY2FsbHkgSSBzaG91bGQgcHJlZmVyIGZpbmRNYXJrZXIgc2luY2UgSXQncyBmYXN0IHRoYW4gaXRlcmF0aW5nXG4gICAgIyB3aG9sZSBtYXJrZXJzIG1hbnVhbGx5LlxuICAgIHJhbmdlcyA9IHJhbmdlcy5tYXAgKHJhbmdlKSAtPiBzaHJpbmtSYW5nZUVuZFRvQmVmb3JlTmV3TGluZShyYW5nZSlcblxuICAgIHJlc3VsdHMgPSBbXVxuICAgIGZvciByYW5nZSBpbiByYW5nZXNcbiAgICAgIG1hcmtlcnMgPSBAbWFya2VyTGF5ZXIuZmluZE1hcmtlcnMoaW50ZXJzZWN0c0J1ZmZlclJhbmdlOiByYW5nZSkuZmlsdGVyIChtYXJrZXIpIC0+XG4gICAgICAgIHJhbmdlLmludGVyc2VjdHNXaXRoKG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpLCBleGNsdXNpdmUpXG4gICAgICByZXN1bHRzLnB1c2gobWFya2Vycy4uLilcbiAgICByZXN1bHRzXG5cbiAgZ2V0TWFya2VyQXRQb2ludDogKHBvaW50KSAtPlxuICAgIEBtYXJrZXJMYXllci5maW5kTWFya2Vycyhjb250YWluc0J1ZmZlclBvc2l0aW9uOiBwb2ludClbMF1cbiJdfQ==
