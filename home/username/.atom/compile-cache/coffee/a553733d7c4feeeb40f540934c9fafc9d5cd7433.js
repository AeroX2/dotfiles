(function() {
  var FlashManager, _, flashTypes,
    slice = [].slice;

  _ = require('underscore-plus');

  flashTypes = {
    operator: {
      allowMultiple: true,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash operator'
      }
    },
    search: {
      allowMultiple: false,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash search'
      }
    },
    screen: {
      allowMultiple: true,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash screen'
      }
    },
    added: {
      allowMultiple: true,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash added'
      }
    },
    removed: {
      allowMultiple: true,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash removed'
      }
    },
    'screen-line': {
      allowMultiple: false,
      decorationOptions: {
        type: 'line',
        "class": 'vim-mode-plus-flash-screen-line'
      }
    }
  };

  module.exports = FlashManager = (function() {
    function FlashManager(vimState) {
      this.vimState = vimState;
      this.editor = this.vimState.editor;
      this.markersByType = new Map;
      this.vimState.onDidDestroy(this.destroy.bind(this));
    }

    FlashManager.prototype.destroy = function() {
      this.markersByType.forEach(function(markers) {
        var i, len, marker, results;
        results = [];
        for (i = 0, len = markers.length; i < len; i++) {
          marker = markers[i];
          results.push(marker.destroy());
        }
        return results;
      });
      return this.markersByType.clear();
    };

    FlashManager.prototype.flash = function(ranges, options, rangeType) {
      var allowMultiple, decorationOptions, i, j, len, len1, marker, markers, range, ref, ref1, timeout, type;
      if (rangeType == null) {
        rangeType = 'buffer';
      }
      if (!_.isArray(ranges)) {
        ranges = [ranges];
      }
      if (!ranges.length) {
        return null;
      }
      type = options.type, timeout = options.timeout;
      if (timeout == null) {
        timeout = 1000;
      }
      ref = flashTypes[type], allowMultiple = ref.allowMultiple, decorationOptions = ref.decorationOptions;
      switch (rangeType) {
        case 'buffer':
          markers = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = ranges.length; i < len; i++) {
              range = ranges[i];
              results.push(this.editor.markBufferRange(range));
            }
            return results;
          }).call(this);
          break;
        case 'screen':
          markers = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = ranges.length; i < len; i++) {
              range = ranges[i];
              results.push(this.editor.markScreenRange(range));
            }
            return results;
          }).call(this);
      }
      if (!allowMultiple) {
        if (this.markersByType.has(type)) {
          ref1 = this.markersByType.get(type);
          for (i = 0, len = ref1.length; i < len; i++) {
            marker = ref1[i];
            marker.destroy();
          }
        }
        this.markersByType.set(type, markers);
      }
      for (j = 0, len1 = markers.length; j < len1; j++) {
        marker = markers[j];
        this.editor.decorateMarker(marker, decorationOptions);
      }
      return setTimeout(function() {
        var k, len2, results;
        results = [];
        for (k = 0, len2 = markers.length; k < len2; k++) {
          marker = markers[k];
          results.push(marker.destroy());
        }
        return results;
      }, timeout);
    };

    FlashManager.prototype.flashScreenRange = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.flash.apply(this, args.concat('screen'));
    };

    return FlashManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvZmxhc2gtbWFuYWdlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDJCQUFBO0lBQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFFSixVQUFBLEdBQ0U7SUFBQSxRQUFBLEVBQ0U7TUFBQSxhQUFBLEVBQWUsSUFBZjtNQUNBLGlCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sV0FBTjtRQUNBLENBQUEsS0FBQSxDQUFBLEVBQU8sOEJBRFA7T0FGRjtLQURGO0lBS0EsTUFBQSxFQUNFO01BQUEsYUFBQSxFQUFlLEtBQWY7TUFDQSxpQkFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFdBQU47UUFDQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLDRCQURQO09BRkY7S0FORjtJQVVBLE1BQUEsRUFDRTtNQUFBLGFBQUEsRUFBZSxJQUFmO01BQ0EsaUJBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxXQUFOO1FBQ0EsQ0FBQSxLQUFBLENBQUEsRUFBTyw0QkFEUDtPQUZGO0tBWEY7SUFlQSxLQUFBLEVBQ0U7TUFBQSxhQUFBLEVBQWUsSUFBZjtNQUNBLGlCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sV0FBTjtRQUNBLENBQUEsS0FBQSxDQUFBLEVBQU8sMkJBRFA7T0FGRjtLQWhCRjtJQW9CQSxPQUFBLEVBQ0U7TUFBQSxhQUFBLEVBQWUsSUFBZjtNQUNBLGlCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sV0FBTjtRQUNBLENBQUEsS0FBQSxDQUFBLEVBQU8sNkJBRFA7T0FGRjtLQXJCRjtJQXlCQSxhQUFBLEVBQ0U7TUFBQSxhQUFBLEVBQWUsS0FBZjtNQUNBLGlCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sTUFBTjtRQUNBLENBQUEsS0FBQSxDQUFBLEVBQU8saUNBRFA7T0FGRjtLQTFCRjs7O0VBK0JGLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxzQkFBQyxRQUFEO01BQUMsSUFBQyxDQUFBLFdBQUQ7TUFDWCxJQUFDLENBQUEsU0FBVSxJQUFDLENBQUEsU0FBWDtNQUNGLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxZQUFWLENBQXVCLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLElBQWQsQ0FBdkI7SUFIVzs7MkJBS2IsT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBdUIsU0FBQyxPQUFEO0FBQ3JCLFlBQUE7QUFBQTthQUFBLHlDQUFBOzt1QkFBQSxNQUFNLENBQUMsT0FBUCxDQUFBO0FBQUE7O01BRHFCLENBQXZCO2FBRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxLQUFmLENBQUE7SUFITzs7MkJBS1QsS0FBQSxHQUFPLFNBQUMsTUFBRCxFQUFTLE9BQVQsRUFBa0IsU0FBbEI7QUFDTCxVQUFBOztRQUR1QixZQUFVOztNQUNqQyxJQUFBLENBQXlCLENBQUMsQ0FBQyxPQUFGLENBQVUsTUFBVixDQUF6QjtRQUFBLE1BQUEsR0FBUyxDQUFDLE1BQUQsRUFBVDs7TUFDQSxJQUFBLENBQW1CLE1BQU0sQ0FBQyxNQUExQjtBQUFBLGVBQU8sS0FBUDs7TUFFQyxtQkFBRCxFQUFPOztRQUNQLFVBQVc7O01BRVgsTUFBcUMsVUFBVyxDQUFBLElBQUEsQ0FBaEQsRUFBQyxpQ0FBRCxFQUFnQjtBQUVoQixjQUFPLFNBQVA7QUFBQSxhQUNPLFFBRFA7VUFFSSxPQUFBOztBQUFXO2lCQUFBLHdDQUFBOzsyQkFBQSxJQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBd0IsS0FBeEI7QUFBQTs7O0FBRFI7QUFEUCxhQUdPLFFBSFA7VUFJSSxPQUFBOztBQUFXO2lCQUFBLHdDQUFBOzsyQkFBQSxJQUFDLENBQUEsTUFBTSxDQUFDLGVBQVIsQ0FBd0IsS0FBeEI7QUFBQTs7O0FBSmY7TUFNQSxJQUFBLENBQU8sYUFBUDtRQUNFLElBQUcsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQW5CLENBQUg7QUFDRTtBQUFBLGVBQUEsc0NBQUE7O1lBQUEsTUFBTSxDQUFDLE9BQVAsQ0FBQTtBQUFBLFdBREY7O1FBRUEsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQW5CLEVBQXlCLE9BQXpCLEVBSEY7O0FBS0EsV0FBQSwyQ0FBQTs7UUFBQSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBdUIsTUFBdkIsRUFBK0IsaUJBQS9CO0FBQUE7YUFFQSxVQUFBLENBQVcsU0FBQTtBQUNULFlBQUE7QUFBQTthQUFBLDJDQUFBOzt1QkFDRSxNQUFNLENBQUMsT0FBUCxDQUFBO0FBREY7O01BRFMsQ0FBWCxFQUdFLE9BSEY7SUF0Qks7OzJCQTJCUCxnQkFBQSxHQUFrQixTQUFBO0FBQ2hCLFVBQUE7TUFEaUI7YUFDakIsSUFBQyxDQUFBLEtBQUQsYUFBTyxJQUFJLENBQUMsTUFBTCxDQUFZLFFBQVosQ0FBUDtJQURnQjs7Ozs7QUF6RXBCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxuZmxhc2hUeXBlcyA9XG4gIG9wZXJhdG9yOlxuICAgIGFsbG93TXVsdGlwbGU6IHRydWVcbiAgICBkZWNvcmF0aW9uT3B0aW9uczpcbiAgICAgIHR5cGU6ICdoaWdobGlnaHQnXG4gICAgICBjbGFzczogJ3ZpbS1tb2RlLXBsdXMtZmxhc2ggb3BlcmF0b3InXG4gIHNlYXJjaDpcbiAgICBhbGxvd011bHRpcGxlOiBmYWxzZVxuICAgIGRlY29yYXRpb25PcHRpb25zOlxuICAgICAgdHlwZTogJ2hpZ2hsaWdodCdcbiAgICAgIGNsYXNzOiAndmltLW1vZGUtcGx1cy1mbGFzaCBzZWFyY2gnXG4gIHNjcmVlbjpcbiAgICBhbGxvd011bHRpcGxlOiB0cnVlXG4gICAgZGVjb3JhdGlvbk9wdGlvbnM6XG4gICAgICB0eXBlOiAnaGlnaGxpZ2h0J1xuICAgICAgY2xhc3M6ICd2aW0tbW9kZS1wbHVzLWZsYXNoIHNjcmVlbidcbiAgYWRkZWQ6XG4gICAgYWxsb3dNdWx0aXBsZTogdHJ1ZVxuICAgIGRlY29yYXRpb25PcHRpb25zOlxuICAgICAgdHlwZTogJ2hpZ2hsaWdodCdcbiAgICAgIGNsYXNzOiAndmltLW1vZGUtcGx1cy1mbGFzaCBhZGRlZCdcbiAgcmVtb3ZlZDpcbiAgICBhbGxvd011bHRpcGxlOiB0cnVlXG4gICAgZGVjb3JhdGlvbk9wdGlvbnM6XG4gICAgICB0eXBlOiAnaGlnaGxpZ2h0J1xuICAgICAgY2xhc3M6ICd2aW0tbW9kZS1wbHVzLWZsYXNoIHJlbW92ZWQnXG4gICdzY3JlZW4tbGluZSc6ICMgdW51c2VkLlxuICAgIGFsbG93TXVsdGlwbGU6IGZhbHNlXG4gICAgZGVjb3JhdGlvbk9wdGlvbnM6XG4gICAgICB0eXBlOiAnbGluZSdcbiAgICAgIGNsYXNzOiAndmltLW1vZGUtcGx1cy1mbGFzaC1zY3JlZW4tbGluZSdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgRmxhc2hNYW5hZ2VyXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yfSA9IEB2aW1TdGF0ZVxuICAgIEBtYXJrZXJzQnlUeXBlID0gbmV3IE1hcFxuICAgIEB2aW1TdGF0ZS5vbkRpZERlc3Ryb3koQGRlc3Ryb3kuYmluZCh0aGlzKSlcblxuICBkZXN0cm95OiAtPlxuICAgIEBtYXJrZXJzQnlUeXBlLmZvckVhY2ggKG1hcmtlcnMpIC0+XG4gICAgICBtYXJrZXIuZGVzdHJveSgpIGZvciBtYXJrZXIgaW4gbWFya2Vyc1xuICAgIEBtYXJrZXJzQnlUeXBlLmNsZWFyKClcblxuICBmbGFzaDogKHJhbmdlcywgb3B0aW9ucywgcmFuZ2VUeXBlPSdidWZmZXInKSAtPlxuICAgIHJhbmdlcyA9IFtyYW5nZXNdIHVubGVzcyBfLmlzQXJyYXkocmFuZ2VzKVxuICAgIHJldHVybiBudWxsIHVubGVzcyByYW5nZXMubGVuZ3RoXG5cbiAgICB7dHlwZSwgdGltZW91dH0gPSBvcHRpb25zXG4gICAgdGltZW91dCA/PSAxMDAwXG5cbiAgICB7YWxsb3dNdWx0aXBsZSwgZGVjb3JhdGlvbk9wdGlvbnN9ID0gZmxhc2hUeXBlc1t0eXBlXVxuXG4gICAgc3dpdGNoIHJhbmdlVHlwZVxuICAgICAgd2hlbiAnYnVmZmVyJ1xuICAgICAgICBtYXJrZXJzID0gKEBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlKSBmb3IgcmFuZ2UgaW4gcmFuZ2VzKVxuICAgICAgd2hlbiAnc2NyZWVuJ1xuICAgICAgICBtYXJrZXJzID0gKEBlZGl0b3IubWFya1NjcmVlblJhbmdlKHJhbmdlKSBmb3IgcmFuZ2UgaW4gcmFuZ2VzKVxuXG4gICAgdW5sZXNzIGFsbG93TXVsdGlwbGVcbiAgICAgIGlmIEBtYXJrZXJzQnlUeXBlLmhhcyh0eXBlKVxuICAgICAgICBtYXJrZXIuZGVzdHJveSgpIGZvciBtYXJrZXIgaW4gQG1hcmtlcnNCeVR5cGUuZ2V0KHR5cGUpXG4gICAgICBAbWFya2Vyc0J5VHlwZS5zZXQodHlwZSwgbWFya2VycylcblxuICAgIEBlZGl0b3IuZGVjb3JhdGVNYXJrZXIobWFya2VyLCBkZWNvcmF0aW9uT3B0aW9ucykgZm9yIG1hcmtlciBpbiBtYXJrZXJzXG5cbiAgICBzZXRUaW1lb3V0IC0+XG4gICAgICBmb3IgbWFya2VyIGluIG1hcmtlcnNcbiAgICAgICAgbWFya2VyLmRlc3Ryb3koKVxuICAgICwgdGltZW91dFxuXG4gIGZsYXNoU2NyZWVuUmFuZ2U6IChhcmdzLi4uKSAtPlxuICAgIEBmbGFzaChhcmdzLmNvbmNhdCgnc2NyZWVuJykuLi4pXG4iXX0=
