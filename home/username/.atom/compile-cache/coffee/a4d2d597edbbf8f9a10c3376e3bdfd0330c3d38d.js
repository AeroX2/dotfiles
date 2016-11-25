(function() {
  var CompositeDisposable, HighlightSearchManager, matchScopes, ref, scanEditor, settings;

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('./utils'), scanEditor = ref.scanEditor, matchScopes = ref.matchScopes;

  settings = require('./settings');

  module.exports = HighlightSearchManager = (function() {
    function HighlightSearchManager(vimState) {
      var options, ref1;
      this.vimState = vimState;
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement, this.globalState = ref1.globalState;
      this.disposables = new CompositeDisposable;
      this.markerLayer = this.editor.addMarkerLayer();
      options = {
        type: 'highlight',
        invalidate: 'inside',
        "class": 'vim-mode-plus-highlight-search'
      };
      this.decorationLayer = this.editor.decorateMarkerLayer(this.markerLayer, options);
      this.disposables.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      this.disposables = this.globalState.onDidChange((function(_this) {
        return function(arg) {
          var name, newValue;
          name = arg.name, newValue = arg.newValue;
          if (name === 'highlightSearchPattern') {
            if (newValue) {
              return _this.refresh();
            } else {
              return _this.clearMarkers();
            }
          }
        };
      })(this));
    }

    HighlightSearchManager.prototype.destroy = function() {
      this.decorationLayer.destroy();
      this.disposables.dispose();
      return this.markerLayer.destroy();
    };

    HighlightSearchManager.prototype.hasMarkers = function() {
      return this.markerLayer.getMarkerCount() > 0;
    };

    HighlightSearchManager.prototype.getMarkers = function() {
      return this.markerLayer.getMarkers();
    };

    HighlightSearchManager.prototype.clearMarkers = function() {
      var i, len, marker, ref1, results;
      ref1 = this.markerLayer.getMarkers();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        marker = ref1[i];
        results.push(marker.destroy());
      }
      return results;
    };

    HighlightSearchManager.prototype.refresh = function() {
      var i, len, pattern, range, ref1, results;
      this.clearMarkers();
      if (!settings.get('highlightSearch')) {
        return;
      }
      if (!this.vimState.isVisible()) {
        return;
      }
      if (!(pattern = this.globalState.get('highlightSearchPattern'))) {
        return;
      }
      if (matchScopes(this.editorElement, settings.get('highlightSearchExcludeScopes'))) {
        return;
      }
      ref1 = scanEditor(this.editor, pattern);
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        range = ref1[i];
        results.push(this.markerLayer.markBufferRange(range));
      }
      return results;
    };

    return HighlightSearchManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvaGlnaGxpZ2h0LXNlYXJjaC1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixNQUE0QixPQUFBLENBQVEsU0FBUixDQUE1QixFQUFDLDJCQUFELEVBQWE7O0VBQ2IsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUdYLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxnQ0FBQyxRQUFEO0FBQ1gsVUFBQTtNQURZLElBQUMsQ0FBQSxXQUFEO01BQ1osT0FBMEMsSUFBQyxDQUFBLFFBQTNDLEVBQUMsSUFBQyxDQUFBLGNBQUEsTUFBRixFQUFVLElBQUMsQ0FBQSxxQkFBQSxhQUFYLEVBQTBCLElBQUMsQ0FBQSxtQkFBQTtNQUMzQixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBQTtNQUVmLE9BQUEsR0FDRTtRQUFBLElBQUEsRUFBTSxXQUFOO1FBQ0EsVUFBQSxFQUFZLFFBRFo7UUFFQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGdDQUZQOztNQUdGLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxNQUFNLENBQUMsbUJBQVIsQ0FBNEIsSUFBQyxDQUFBLFdBQTdCLEVBQTBDLE9BQTFDO01BRW5CLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVYsQ0FBdUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsSUFBZCxDQUF2QixDQUFqQjtNQUlBLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQyxDQUFBLFdBQVcsQ0FBQyxXQUFiLENBQXlCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFEO0FBQ3RDLGNBQUE7VUFEd0MsaUJBQU07VUFDOUMsSUFBRyxJQUFBLEtBQVEsd0JBQVg7WUFDRSxJQUFHLFFBQUg7cUJBQ0UsS0FBQyxDQUFBLE9BQUQsQ0FBQSxFQURGO2FBQUEsTUFBQTtxQkFHRSxLQUFDLENBQUEsWUFBRCxDQUFBLEVBSEY7YUFERjs7UUFEc0M7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXpCO0lBZko7O3FDQXNCYixPQUFBLEdBQVMsU0FBQTtNQUNQLElBQUMsQ0FBQSxlQUFlLENBQUMsT0FBakIsQ0FBQTtNQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsT0FBYixDQUFBO2FBQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQUE7SUFITzs7cUNBT1QsVUFBQSxHQUFZLFNBQUE7YUFDVixJQUFDLENBQUEsV0FBVyxDQUFDLGNBQWIsQ0FBQSxDQUFBLEdBQWdDO0lBRHRCOztxQ0FHWixVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxXQUFXLENBQUMsVUFBYixDQUFBO0lBRFU7O3FDQUdaLFlBQUEsR0FBYyxTQUFBO0FBQ1osVUFBQTtBQUFBO0FBQUE7V0FBQSxzQ0FBQTs7cUJBQUEsTUFBTSxDQUFDLE9BQVAsQ0FBQTtBQUFBOztJQURZOztxQ0FHZCxPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7TUFBQSxJQUFDLENBQUEsWUFBRCxDQUFBO01BRUEsSUFBQSxDQUFjLFFBQVEsQ0FBQyxHQUFULENBQWEsaUJBQWIsQ0FBZDtBQUFBLGVBQUE7O01BQ0EsSUFBQSxDQUFjLElBQUMsQ0FBQSxRQUFRLENBQUMsU0FBVixDQUFBLENBQWQ7QUFBQSxlQUFBOztNQUNBLElBQUEsQ0FBYyxDQUFBLE9BQUEsR0FBVSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsd0JBQWpCLENBQVYsQ0FBZDtBQUFBLGVBQUE7O01BQ0EsSUFBVSxXQUFBLENBQVksSUFBQyxDQUFBLGFBQWIsRUFBNEIsUUFBUSxDQUFDLEdBQVQsQ0FBYSw4QkFBYixDQUE1QixDQUFWO0FBQUEsZUFBQTs7QUFFQTtBQUFBO1dBQUEsc0NBQUE7O3FCQUNFLElBQUMsQ0FBQSxXQUFXLENBQUMsZUFBYixDQUE2QixLQUE3QjtBQURGOztJQVJPOzs7OztBQTdDWCIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG57c2NhbkVkaXRvciwgbWF0Y2hTY29wZXN9ID0gcmVxdWlyZSAnLi91dGlscydcbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcblxuIyBHZW5lcmFsIHB1cnBvc2UgdXRpbGl0eSBjbGFzcyB0byBtYWtlIEF0b20ncyBtYXJrZXIgbWFuYWdlbWVudCBlYXNpZXIuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBIaWdobGlnaHRTZWFyY2hNYW5hZ2VyXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yLCBAZWRpdG9yRWxlbWVudCwgQGdsb2JhbFN0YXRlfSA9IEB2aW1TdGF0ZVxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQG1hcmtlckxheWVyID0gQGVkaXRvci5hZGRNYXJrZXJMYXllcigpXG5cbiAgICBvcHRpb25zID1cbiAgICAgIHR5cGU6ICdoaWdobGlnaHQnXG4gICAgICBpbnZhbGlkYXRlOiAnaW5zaWRlJ1xuICAgICAgY2xhc3M6ICd2aW0tbW9kZS1wbHVzLWhpZ2hsaWdodC1zZWFyY2gnXG4gICAgQGRlY29yYXRpb25MYXllciA9IEBlZGl0b3IuZGVjb3JhdGVNYXJrZXJMYXllcihAbWFya2VyTGF5ZXIsIG9wdGlvbnMpXG5cbiAgICBAZGlzcG9zYWJsZXMuYWRkIEB2aW1TdGF0ZS5vbkRpZERlc3Ryb3koQGRlc3Ryb3kuYmluZCh0aGlzKSlcblxuICAgICMgUmVmcmVzaCBoaWdobGlnaHQgYmFzZWQgb24gZ2xvYmFsU3RhdGUuaGlnaGxpZ2h0U2VhcmNoUGF0dGVybiBjaGFuZ2VzLlxuICAgICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEBkaXNwb3NhYmxlcyA9IEBnbG9iYWxTdGF0ZS5vbkRpZENoYW5nZSAoe25hbWUsIG5ld1ZhbHVlfSkgPT5cbiAgICAgIGlmIG5hbWUgaXMgJ2hpZ2hsaWdodFNlYXJjaFBhdHRlcm4nXG4gICAgICAgIGlmIG5ld1ZhbHVlXG4gICAgICAgICAgQHJlZnJlc2goKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgQGNsZWFyTWFya2VycygpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAZGVjb3JhdGlvbkxheWVyLmRlc3Ryb3koKVxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAbWFya2VyTGF5ZXIuZGVzdHJveSgpXG5cbiAgIyBNYXJrZXJzXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBoYXNNYXJrZXJzOiAtPlxuICAgIEBtYXJrZXJMYXllci5nZXRNYXJrZXJDb3VudCgpID4gMFxuXG4gIGdldE1hcmtlcnM6IC0+XG4gICAgQG1hcmtlckxheWVyLmdldE1hcmtlcnMoKVxuXG4gIGNsZWFyTWFya2VyczogLT5cbiAgICBtYXJrZXIuZGVzdHJveSgpIGZvciBtYXJrZXIgaW4gQG1hcmtlckxheWVyLmdldE1hcmtlcnMoKVxuXG4gIHJlZnJlc2g6IC0+XG4gICAgQGNsZWFyTWFya2VycygpXG5cbiAgICByZXR1cm4gdW5sZXNzIHNldHRpbmdzLmdldCgnaGlnaGxpZ2h0U2VhcmNoJylcbiAgICByZXR1cm4gdW5sZXNzIEB2aW1TdGF0ZS5pc1Zpc2libGUoKVxuICAgIHJldHVybiB1bmxlc3MgcGF0dGVybiA9IEBnbG9iYWxTdGF0ZS5nZXQoJ2hpZ2hsaWdodFNlYXJjaFBhdHRlcm4nKVxuICAgIHJldHVybiBpZiBtYXRjaFNjb3BlcyhAZWRpdG9yRWxlbWVudCwgc2V0dGluZ3MuZ2V0KCdoaWdobGlnaHRTZWFyY2hFeGNsdWRlU2NvcGVzJykpXG5cbiAgICBmb3IgcmFuZ2UgaW4gc2NhbkVkaXRvcihAZWRpdG9yLCBwYXR0ZXJuKVxuICAgICAgQG1hcmtlckxheWVyLm1hcmtCdWZmZXJSYW5nZShyYW5nZSlcbiJdfQ==
