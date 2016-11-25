(function() {
  var CompositeDisposable, Emitter, Mutation, MutationManager, Point, ref, swrap;

  ref = require('atom'), Point = ref.Point, Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  swrap = require('./selection-wrapper');

  module.exports = MutationManager = (function() {
    function MutationManager(vimState) {
      this.vimState = vimState;
      this.editor = this.vimState.editor;
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      this.emitter = new Emitter;
      this.markerLayer = this.editor.addMarkerLayer();
      this.mutationsBySelection = new Map;
    }

    MutationManager.prototype.destroy = function() {
      var ref1;
      this.reset();
      return ref1 = {}, this.mutationsBySelection = ref1.mutationsBySelection, this.editor = ref1.editor, this.vimState = ref1.vimState, ref1;
    };

    MutationManager.prototype.init = function(options1) {
      this.options = options1;
      return this.reset();
    };

    MutationManager.prototype.reset = function() {
      var j, len, marker, ref1;
      ref1 = this.markerLayer.getMarkers();
      for (j = 0, len = ref1.length; j < len; j++) {
        marker = ref1[j];
        marker.destroy();
      }
      return this.mutationsBySelection.clear();
    };

    MutationManager.prototype.saveInitialPointForSelection = function(selection) {
      var point;
      if (this.vimState.isMode('visual')) {
        point = swrap(selection).getBufferPositionFor('head', {
          fromProperty: true,
          allowFallback: true
        });
      } else {
        if (!this.options.isSelect) {
          point = swrap(selection).getBufferPositionFor('head');
        }
      }
      if (this.options.useMarker) {
        point = this.markerLayer.markBufferPosition(point, {
          invalidate: 'never'
        });
      }
      return point;
    };

    MutationManager.prototype.getInitialPointForSelection = function(selection) {
      var ref1;
      return (ref1 = this.mutationsBySelection.get(selection)) != null ? ref1.initialPoint : void 0;
    };

    MutationManager.prototype.setCheckPoint = function(checkPoint) {
      var createdAt, initialPoint, j, len, mutation, options, ref1, results, selection;
      ref1 = this.editor.getSelections();
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        selection = ref1[j];
        if (!this.mutationsBySelection.has(selection)) {
          createdAt = checkPoint;
          initialPoint = this.saveInitialPointForSelection(selection);
          options = {
            selection: selection,
            initialPoint: initialPoint,
            createdAt: createdAt,
            markerLayer: this.markerLayer
          };
          this.mutationsBySelection.set(selection, new Mutation(options));
        }
        mutation = this.mutationsBySelection.get(selection);
        results.push(mutation.update(checkPoint));
      }
      return results;
    };

    MutationManager.prototype.getMutationForSelection = function(selection) {
      return this.mutationsBySelection.get(selection);
    };

    MutationManager.prototype.getMarkerBufferRanges = function() {
      var ranges;
      ranges = [];
      this.mutationsBySelection.forEach(function(mutation, selection) {
        var range, ref1;
        if (range = (ref1 = mutation.marker) != null ? ref1.getBufferRange() : void 0) {
          return ranges.push(range);
        }
      });
      return ranges;
    };

    MutationManager.prototype.restoreInitialPositions = function() {
      var j, len, point, ref1, results, selection;
      ref1 = this.editor.getSelections();
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        selection = ref1[j];
        if (point = this.getInitialPointForSelection(selection)) {
          results.push(selection.cursor.setBufferPosition(point));
        }
      }
      return results;
    };

    MutationManager.prototype.restoreCursorPositions = function(options) {
      var clipToMutationEnd, i, isBlockwise, j, k, len, len1, mutation, mutationEnd, point, points, ref1, ref2, ref3, results, results1, selection, stay, strict;
      stay = options.stay, strict = options.strict, clipToMutationEnd = options.clipToMutationEnd, isBlockwise = options.isBlockwise, mutationEnd = options.mutationEnd;
      if (isBlockwise) {
        points = [];
        this.mutationsBySelection.forEach(function(mutation, selection) {
          var ref1;
          return points.push((ref1 = mutation.checkPoint['will-select']) != null ? ref1.start : void 0);
        });
        points = points.sort(function(a, b) {
          return a.compare(b);
        });
        points = points.filter(function(point) {
          return point != null;
        });
        if (this.vimState.isMode('visual', 'blockwise')) {
          if (point = points[0]) {
            return (ref1 = this.vimState.getLastBlockwiseSelection()) != null ? ref1.setHeadBufferPosition(point) : void 0;
          }
        } else {
          if (point = points[0]) {
            return this.editor.setCursorBufferPosition(point);
          } else {
            ref2 = this.editor.getSelections();
            results = [];
            for (j = 0, len = ref2.length; j < len; j++) {
              selection = ref2[j];
              if (!selection.isLastSelection()) {
                results.push(selection.destroy());
              } else {
                results.push(void 0);
              }
            }
            return results;
          }
        }
      } else {
        ref3 = this.editor.getSelections();
        results1 = [];
        for (i = k = 0, len1 = ref3.length; k < len1; i = ++k) {
          selection = ref3[i];
          if (!(mutation = this.mutationsBySelection.get(selection))) {
            continue;
          }
          if (strict && mutation.createdAt !== 'will-select') {
            selection.destroy();
            continue;
          }
          if (point = mutation.getRestorePoint({
            stay: stay,
            clipToMutationEnd: clipToMutationEnd,
            mutationEnd: mutationEnd
          })) {
            results1.push(selection.cursor.setBufferPosition(point));
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      }
    };

    return MutationManager;

  })();

  Mutation = (function() {
    function Mutation(options) {
      this.selection = options.selection, this.initialPoint = options.initialPoint, this.createdAt = options.createdAt, this.markerLayer = options.markerLayer;
      this.checkPoint = {};
      this.marker = null;
    }

    Mutation.prototype.update = function(checkPoint) {
      var ref1;
      if (!this.selection.getBufferRange().isEmpty()) {
        if ((ref1 = this.marker) != null) {
          ref1.destroy();
        }
        this.marker = null;
      }
      if (this.marker == null) {
        this.marker = this.markerLayer.markBufferRange(this.selection.getBufferRange(), {
          invalidate: 'never'
        });
      }
      return this.checkPoint[checkPoint] = this.marker.getBufferRange();
    };

    Mutation.prototype.getMutationEnd = function() {
      var range;
      range = this.marker.getBufferRange();
      if (range.isEmpty()) {
        return range.end;
      } else {
        return range.end.translate([0, -1]);
      }
    };

    Mutation.prototype.getRestorePoint = function(options) {
      var clipToMutationEnd, mutationEnd, point, ref1, stay;
      if (options == null) {
        options = {};
      }
      stay = options.stay, clipToMutationEnd = options.clipToMutationEnd, mutationEnd = options.mutationEnd;
      if (stay) {
        if (this.initialPoint instanceof Point) {
          point = this.initialPoint;
        } else {
          point = this.initialPoint.getHeadBufferPosition();
        }
        if (clipToMutationEnd) {
          return Point.min(this.getMutationEnd(), point);
        } else {
          return point;
        }
      } else {
        if (mutationEnd) {
          return this.getMutationEnd();
        } else {
          return (ref1 = this.checkPoint['did-select']) != null ? ref1.start : void 0;
        }
      }
    };

    return Mutation;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvbXV0YXRpb24tbWFuYWdlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQXdDLE9BQUEsQ0FBUSxNQUFSLENBQXhDLEVBQUMsaUJBQUQsRUFBUSxxQkFBUixFQUFpQjs7RUFDakIsS0FBQSxHQUFRLE9BQUEsQ0FBUSxxQkFBUjs7RUFhUixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1MseUJBQUMsUUFBRDtNQUFDLElBQUMsQ0FBQSxXQUFEO01BQ1gsSUFBQyxDQUFBLFNBQVUsSUFBQyxDQUFBLFNBQVg7TUFFRixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUk7TUFDbkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxRQUFRLENBQUMsWUFBVixDQUF1QixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxJQUFkLENBQXZCLENBQWpCO01BQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BRWYsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBQTtNQUNmLElBQUMsQ0FBQSxvQkFBRCxHQUF3QixJQUFJO0lBUmpCOzs4QkFVYixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7TUFBQSxJQUFDLENBQUEsS0FBRCxDQUFBO2FBQ0EsT0FBOEMsRUFBOUMsRUFBQyxJQUFDLENBQUEsNEJBQUEsb0JBQUYsRUFBd0IsSUFBQyxDQUFBLGNBQUEsTUFBekIsRUFBaUMsSUFBQyxDQUFBLGdCQUFBLFFBQWxDLEVBQUE7SUFGTzs7OEJBSVQsSUFBQSxHQUFNLFNBQUMsUUFBRDtNQUFDLElBQUMsQ0FBQSxVQUFEO2FBQ0wsSUFBQyxDQUFBLEtBQUQsQ0FBQTtJQURJOzs4QkFHTixLQUFBLEdBQU8sU0FBQTtBQUNMLFVBQUE7QUFBQTtB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LEdBQVEsSUFBQyxDQUFBLGFBRFg7U0FBQSxNQUFBO1VBR0UsS0FBQSxHQUFRLElBQUMsQ0FBQSxZQUFZLENBQUMscUJBQWQsQ0FBQSxFQUhWOztRQUtBLElBQUcsaUJBQUg7aUJBQ0UsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFDLENBQUEsY0FBRCxDQUFBLENBQVYsRUFBNkIsS0FBN0IsRUFERjtTQUFBLE1BQUE7aUJBR0UsTUFIRjtTQU5GO09BQUEsTUFBQTtRQVdFLElBQUcsV0FBSDtpQkFDRSxJQUFDLENBQUEsY0FBRCxDQUFBLEVBREY7U0FBQSxNQUFBO3NFQUcyQixDQUFFLGVBSDdCO1NBWEY7O0lBRmU7Ozs7O0FBbEluQiIsInNvdXJjZXNDb250ZW50IjpbIntQb2ludCwgRW1pdHRlciwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuXG4jIGtlZXAgbXV0YXRpb24gc25hcHNob3QgbmVjZXNzYXJ5IGZvciBPcGVyYXRvciBwcm9jZXNzaW5nLlxuIyBtdXRhdGlvbiBzdG9yZWQgYnkgZWFjaCBTZWxlY3Rpb24gaGF2ZSBmb2xsb3dpbmcgZmllbGRcbiMgIG1hcmtlcjpcbiMgICAgbWFya2VyIHRvIHRyYWNrIG11dGF0aW9uLiBtYXJrZXIgaXMgY3JlYXRlZCB3aGVuIGBzZXRDaGVja1BvaW50YFxuIyAgY3JlYXRlZEF0OlxuIyAgICAnc3RyaW5nJyByZXByZXNlbnRpbmcgd2hlbiBtYXJrZXIgd2FzIGNyZWF0ZWQuXG4jICBjaGVja1BvaW50OiB7fVxuIyAgICBrZXkgaXMgWyd3aWxsLXNlbGVjdCcsICdkaWQtc2VsZWN0JywgJ3dpbGwtbXV0YXRlJywgJ2RpZC1tdXRhdGUnXVxuIyAgICBrZXkgaXMgY2hlY2twb2ludCwgdmFsdWUgaXMgYnVmZmVyUmFuZ2UgZm9yIG1hcmtlciBhdCB0aGF0IGNoZWNrcG9pbnRcbiMgIHNlbGVjdGlvbjpcbiMgICAgU2VsZWN0aW9uIGJlZWluZyB0cmFja2VkXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBNdXRhdGlvbk1hbmFnZXJcbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUpIC0+XG4gICAge0BlZGl0b3J9ID0gQHZpbVN0YXRlXG5cbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHZpbVN0YXRlLm9uRGlkRGVzdHJveShAZGVzdHJveS5iaW5kKHRoaXMpKVxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcblxuICAgIEBtYXJrZXJMYXllciA9IEBlZGl0b3IuYWRkTWFya2VyTGF5ZXIoKVxuICAgIEBtdXRhdGlvbnNCeVNlbGVjdGlvbiA9IG5ldyBNYXBcblxuICBkZXN0cm95OiAtPlxuICAgIEByZXNldCgpXG4gICAge0BtdXRhdGlvbnNCeVNlbGVjdGlvbiwgQGVkaXRvciwgQHZpbVN0YXRlfSA9IHt9XG5cbiAgaW5pdDogKEBvcHRpb25zKSAtPlxuICAgIEByZXNldCgpXG5cbiAgcmVzZXQ6IC0+XG4gICAgbWFya2VyLmRlc3Ryb3koKSBmb3IgbWFya2VyIGluIEBtYXJrZXJMYXllci5nZXRNYXJrZXJzKClcbiAgICBAbXV0YXRpb25zQnlTZWxlY3Rpb24uY2xlYXIoKVxuXG4gIHNhdmVJbml0aWFsUG9pbnRGb3JTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgaWYgQHZpbVN0YXRlLmlzTW9kZSgndmlzdWFsJylcbiAgICAgIHBvaW50ID0gc3dyYXAoc2VsZWN0aW9uKS5nZXRCdWZmZXJQb3NpdGlvbkZvcignaGVhZCcsIGZyb21Qcm9wZXJ0eTogdHJ1ZSwgYWxsb3dGYWxsYmFjazogdHJ1ZSlcbiAgICBlbHNlXG4gICAgICBwb2ludCA9IHN3cmFwKHNlbGVjdGlvbikuZ2V0QnVmZmVyUG9zaXRpb25Gb3IoJ2hlYWQnKSB1bmxlc3MgQG9wdGlvbnMuaXNTZWxlY3RcbiAgICBpZiBAb3B0aW9ucy51c2VNYXJrZXJcbiAgICAgIHBvaW50ID0gQG1hcmtlckxheWVyLm1hcmtCdWZmZXJQb3NpdGlvbihwb2ludCwgaW52YWxpZGF0ZTogJ25ldmVyJylcbiAgICBwb2ludFxuXG4gIGdldEluaXRpYWxQb2ludEZvclNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBAbXV0YXRpb25zQnlTZWxlY3Rpb24uZ2V0KHNlbGVjdGlvbik/LmluaXRpYWxQb2ludFxuXG4gIHNldENoZWNrUG9pbnQ6IChjaGVja1BvaW50KSAtPlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgIHVubGVzcyBAbXV0YXRpb25zQnlTZWxlY3Rpb24uaGFzKHNlbGVjdGlvbilcbiAgICAgICAgY3JlYXRlZEF0ID0gY2hlY2tQb2ludFxuICAgICAgICBpbml0aWFsUG9pbnQgPSBAc2F2ZUluaXRpYWxQb2ludEZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgICAgIG9wdGlvbnMgPSB7c2VsZWN0aW9uLCBpbml0aWFsUG9pbnQsIGNyZWF0ZWRBdCwgQG1hcmtlckxheWVyfVxuICAgICAgICBAbXV0YXRpb25zQnlTZWxlY3Rpb24uc2V0KHNlbGVjdGlvbiwgbmV3IE11dGF0aW9uKG9wdGlvbnMpKVxuICAgICAgbXV0YXRpb24gPSBAbXV0YXRpb25zQnlTZWxlY3Rpb24uZ2V0KHNlbGVjdGlvbilcbiAgICAgIG11dGF0aW9uLnVwZGF0ZShjaGVja1BvaW50KVxuXG4gIGdldE11dGF0aW9uRm9yU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBtdXRhdGlvbnNCeVNlbGVjdGlvbi5nZXQoc2VsZWN0aW9uKVxuXG4gIGdldE1hcmtlckJ1ZmZlclJhbmdlczogLT5cbiAgICByYW5nZXMgPSBbXVxuICAgIEBtdXRhdGlvbnNCeVNlbGVjdGlvbi5mb3JFYWNoIChtdXRhdGlvbiwgc2VsZWN0aW9uKSAtPlxuICAgICAgaWYgcmFuZ2UgPSBtdXRhdGlvbi5tYXJrZXI/LmdldEJ1ZmZlclJhbmdlKClcbiAgICAgICAgcmFuZ2VzLnB1c2gocmFuZ2UpXG4gICAgcmFuZ2VzXG5cbiAgcmVzdG9yZUluaXRpYWxQb3NpdGlvbnM6IC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKSB3aGVuIHBvaW50ID0gQGdldEluaXRpYWxQb2ludEZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgICBzZWxlY3Rpb24uY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gIHJlc3RvcmVDdXJzb3JQb3NpdGlvbnM6IChvcHRpb25zKSAtPlxuICAgIHtzdGF5LCBzdHJpY3QsIGNsaXBUb011dGF0aW9uRW5kLCBpc0Jsb2Nrd2lzZSwgbXV0YXRpb25FbmR9ID0gb3B0aW9uc1xuICAgIGlmIGlzQmxvY2t3aXNlXG4gICAgICAjIFtGSVhNRV0gd2h5IEkgbmVlZCB0aGlzIGRpcmVjdCBtYW51cGlsYXRpb24/XG4gICAgICAjIEJlY2F1c2UgdGhlcmUncyBidWcgdGhhdCBibG9ja3dpc2Ugc2VsZWNjdGlvbiBpcyBub3QgYWRkZXMgdG8gZWFjaFxuICAgICAgIyBic0luc3RhbmNlLnNlbGVjdGlvbi4gTmVlZCBpbnZlc3RpZ2F0aW9uLlxuICAgICAgcG9pbnRzID0gW11cbiAgICAgIEBtdXRhdGlvbnNCeVNlbGVjdGlvbi5mb3JFYWNoIChtdXRhdGlvbiwgc2VsZWN0aW9uKSAtPlxuICAgICAgICBwb2ludHMucHVzaChtdXRhdGlvbi5jaGVja1BvaW50Wyd3aWxsLXNlbGVjdCddPy5zdGFydClcbiAgICAgIHBvaW50cyA9IHBvaW50cy5zb3J0IChhLCBiKSAtPiBhLmNvbXBhcmUoYilcbiAgICAgIHBvaW50cyA9IHBvaW50cy5maWx0ZXIgKHBvaW50KSAtPiBwb2ludD9cbiAgICAgIGlmIEB2aW1TdGF0ZS5pc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKVxuICAgICAgICBpZiBwb2ludCA9IHBvaW50c1swXVxuICAgICAgICAgIEB2aW1TdGF0ZS5nZXRMYXN0QmxvY2t3aXNlU2VsZWN0aW9uKCk/LnNldEhlYWRCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgcG9pbnQgPSBwb2ludHNbMF1cbiAgICAgICAgICBAZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgc2VsZWN0aW9uLmRlc3Ryb3koKSB1bmxlc3Mgc2VsZWN0aW9uLmlzTGFzdFNlbGVjdGlvbigpXG4gICAgZWxzZVxuICAgICAgZm9yIHNlbGVjdGlvbiwgaSBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKSB3aGVuIG11dGF0aW9uID0gQG11dGF0aW9uc0J5U2VsZWN0aW9uLmdldChzZWxlY3Rpb24pXG4gICAgICAgIGlmIHN0cmljdCBhbmQgbXV0YXRpb24uY3JlYXRlZEF0IGlzbnQgJ3dpbGwtc2VsZWN0J1xuICAgICAgICAgIHNlbGVjdGlvbi5kZXN0cm95KClcbiAgICAgICAgICBjb250aW51ZVxuXG4gICAgICAgIGlmIHBvaW50ID0gbXV0YXRpb24uZ2V0UmVzdG9yZVBvaW50KHtzdGF5LCBjbGlwVG9NdXRhdGlvbkVuZCwgbXV0YXRpb25FbmR9KVxuICAgICAgICAgIHNlbGVjdGlvbi5jdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiMgbXV0YXRpb24gaW5mb3JtYXRpb24gaXMgY3JlYXRlZCBldmVuIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiMgU28gdGhhdCB3ZSBjYW4gZmlsdGVyIHNlbGVjdGlvbiBieSB3aGVuIGl0IHdhcyBjcmVhdGVkLlxuIyBlLmcuIHNvbWUgc2VsZWN0aW9uIGlzIGNyZWF0ZWQgYXQgJ3dpbGwtc2VsZWN0JyBjaGVja3BvaW50LCBvdGhlcnMgYXQgJ2RpZC1zZWxlY3QnXG4jIFRoaXMgaXMgaW1wb3J0YW50IHNpbmNlIHdoZW4gb2NjdXJyZW5jZSBtb2RpZmllciBpcyB1c2VkLCBzZWxlY3Rpb24gaXMgY3JlYXRlZCBhdCB0YXJnZXQuc2VsZWN0KClcbiMgSW4gdGhhdCBjYXNlIHNvbWUgc2VsZWN0aW9uIGhhdmUgY3JlYXRlZEF0ID0gYGRpZC1zZWxlY3RgLCBhbmQgb3RoZXJzIGlzIGNyZWF0ZWRBdCA9IGB3aWxsLXNlbGVjdGBcbmNsYXNzIE11dGF0aW9uXG4gIGNvbnN0cnVjdG9yOiAob3B0aW9ucykgLT5cbiAgICB7QHNlbGVjdGlvbiwgQGluaXRpYWxQb2ludCwgQGNyZWF0ZWRBdCwgQG1hcmtlckxheWVyfSA9IG9wdGlvbnNcbiAgICBAY2hlY2tQb2ludCA9IHt9XG4gICAgQG1hcmtlciA9IG51bGxcblxuICB1cGRhdGU6IChjaGVja1BvaW50KSAtPlxuICAgICMgQ3VycmVudCBub24tZW1wdHkgc2VsZWN0aW9uIGlzIHByaW9yaXRpemVkIG92ZXIgbWFya2VyJ3MgcmFuZ2UuXG4gICAgIyBXZSBpdmFsaWRhdGUgb2xkIG1hcmtlciB0byByZS10cmFjayBmcm9tIGN1cnJlbnQgc2VsZWN0aW9uLlxuICAgIHVubGVzcyBAc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkuaXNFbXB0eSgpXG4gICAgICBAbWFya2VyPy5kZXN0cm95KClcbiAgICAgIEBtYXJrZXIgPSBudWxsXG5cbiAgICBAbWFya2VyID89IEBtYXJrZXJMYXllci5tYXJrQnVmZmVyUmFuZ2UoQHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLCBpbnZhbGlkYXRlOiAnbmV2ZXInKVxuICAgIEBjaGVja1BvaW50W2NoZWNrUG9pbnRdID0gQG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpXG5cbiAgZ2V0TXV0YXRpb25FbmQ6IC0+XG4gICAgcmFuZ2UgPSBAbWFya2VyLmdldEJ1ZmZlclJhbmdlKClcbiAgICBpZiByYW5nZS5pc0VtcHR5KClcbiAgICAgIHJhbmdlLmVuZFxuICAgIGVsc2VcbiAgICAgIHJhbmdlLmVuZC50cmFuc2xhdGUoWzAsIC0xXSlcblxuICBnZXRSZXN0b3JlUG9pbnQ6IChvcHRpb25zPXt9KSAtPlxuICAgIHtzdGF5LCBjbGlwVG9NdXRhdGlvbkVuZCwgbXV0YXRpb25FbmR9ID0gb3B0aW9uc1xuICAgIGlmIHN0YXlcbiAgICAgIGlmIEBpbml0aWFsUG9pbnQgaW5zdGFuY2VvZiBQb2ludFxuICAgICAgICBwb2ludCA9IEBpbml0aWFsUG9pbnRcbiAgICAgIGVsc2VcbiAgICAgICAgcG9pbnQgPSBAaW5pdGlhbFBvaW50LmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAgIGlmIGNsaXBUb011dGF0aW9uRW5kXG4gICAgICAgIFBvaW50Lm1pbihAZ2V0TXV0YXRpb25FbmQoKSwgcG9pbnQpXG4gICAgICBlbHNlXG4gICAgICAgIHBvaW50XG4gICAgZWxzZVxuICAgICAgaWYgbXV0YXRpb25FbmRcbiAgICAgICAgQGdldE11dGF0aW9uRW5kKClcbiAgICAgIGVsc2VcbiAgICAgICAgQGNoZWNrUG9pbnRbJ2RpZC1zZWxlY3QnXT8uc3RhcnRcbiJdfQ==
