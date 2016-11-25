(function() {
  module.exports = {

    /*
    @name Activate Item
    @description
    Activate a given item from a uri (Select the file that was previously selected).
    
    @param {String} uri
     */
    activateItem: function(uri) {
      var pane;
      if (uri == null) {
        return;
      }
      pane = atom.workspace.paneForURI(uri);
      pane.activate();
      return pane.activateItemForURI(uri);
    },

    /*
    @name Add Horizontal Panes
    @description
    For a given pane, add a number of panes after it.
    
    @params {Object} pane Pane to start from
    @params {Number} number_of_panes
     */
    addHorizontalPanes: function(pane, number_of_panes) {
      var i, results;
      i = 0;
      results = [];
      while (i < number_of_panes) {
        pane.splitRight();
        results.push(i++);
      }
      return results;
    },

    /*
    @name Add Window Panes
    @description
    Add a window panes to the given workspace.
    
    @todo: pane.getNextPane() seems to be buggy
     */
    addWindowPanes: function() {
      var open_panes;
      open_panes = this.getCurrentPanes();
      open_panes[0].splitDown();
      open_panes[0].splitRight();
      open_panes = this.getCurrentPanes();
      return open_panes[2].splitRight();
    },

    /*
    @name Focus Pane
    @description
    Update the currently focused pane.
     */
    focusPane: function(target_pane) {
      var ref;
      return (ref = atom.workspace.getPanes()[target_pane - 1]) != null ? ref.focus() : void 0;
    },

    /*
    @name Format Layout
    @description
    Format the pane layout based on the number of columns provided. Then select
    the pane item that was previously active.
    
    @params {Number} columns
     */
    formatLayout: function(columns) {
      var active_item_uri, last_pane, new_pane_index, number_of_new_panes, number_of_panes, open_panes, ref;
      open_panes = this.getCurrentPanes();
      number_of_panes = open_panes.length;
      active_item_uri = (ref = atom.workspace.getActivePaneItem()) != null ? ref.getURI() : void 0;
      if (columns === 4 || columns === 5) {
        new_pane_index = 3;
        this.removeEmptyPanes(open_panes);
        if (columns === 5) {
          this.addWindowPanes();
        }
        if (columns === 4) {
          this.addHorizontalPanes(open_panes[0], 3);
        }
        this.moveOverflowPanesToPaneIndex(open_panes, new_pane_index);
      } else if (number_of_panes > columns) {
        new_pane_index = columns - 1;
        this.removeEmptyPanes(open_panes);
        this.addHorizontalPanes(open_panes[0], new_pane_index);
        this.moveOverflowPanesToPaneIndex(open_panes, new_pane_index);
      } else if (columns > number_of_panes) {
        number_of_new_panes = columns - number_of_panes;
        last_pane = open_panes[open_panes.length - 1];
        this.addHorizontalPanes(last_pane, number_of_new_panes);
      }
      return this.activateItem(active_item_uri);
    },

    /*
    @name Get Current Panes
    @description
    Return the current panes of the workspace.
    
    @returns {Array} panes
     */
    getCurrentPanes: function() {
      return atom.workspace.getPanes();
    },

    /*
    @name Move Pane
    @description
    Move a panes items from one location to another.
    
    @params {Object} current_pane
    @params {Object} target_pane
     */
    movePane: function(current_pane, target_pane) {
      var item, items, j, len;
      items = current_pane.getItems();
      if (items.length === 0) {
        return;
      }
      for (j = 0, len = items.length; j < len; j++) {
        item = items[j];
        current_pane.moveItemToPane(item, target_pane);
      }
      return current_pane.destroy();
    },
    moveOverflowPanesToPaneIndex: function(open_panes, pane_index) {
      var i, j, len, open_pane, panes, results;
      panes = this.getCurrentPanes();
      results = [];
      for (i = j = 0, len = open_panes.length; j < len; i = ++j) {
        open_pane = open_panes[i];
        if (i === 0) {
          continue;
        }
        if (i <= pane_index) {
          results.push(this.movePane(open_pane, panes[i]));
        } else {
          results.push(this.movePane(open_pane, panes[pane_index]));
        }
      }
      return results;
    },

    /*
    @name Remove Empty Panes
    @description
    Remove an pane that does not contain any items.
     */
    removeEmptyPanes: function(panes) {
      var i, j, len, pane, results;
      results = [];
      for (i = j = 0, len = panes.length; j < len; i = ++j) {
        pane = panes[i];
        if (i === 0) {
          continue;
        }
        if (pane.getItems().length === 0) {
          results.push(pane.destroy());
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvcGFuZS1sYXlvdXQtcGx1cy9saWIvcGFuZS1sYXlvdXQtZm9ybWF0dGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7O0FBQUE7Ozs7Ozs7SUFRQSxZQUFBLEVBQWMsU0FBQyxHQUFEO0FBQ1osVUFBQTtNQUFBLElBQWMsV0FBZDtBQUFBLGVBQUE7O01BRUEsSUFBQSxHQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBZixDQUEwQixHQUExQjtNQUVQLElBQUksQ0FBQyxRQUFMLENBQUE7YUFFQSxJQUFJLENBQUMsa0JBQUwsQ0FBd0IsR0FBeEI7SUFQWSxDQVJkOztBQWlCQTs7Ozs7Ozs7SUFTQSxrQkFBQSxFQUFvQixTQUFDLElBQUQsRUFBTyxlQUFQO0FBQ2xCLFVBQUE7TUFBQSxDQUFBLEdBQUk7QUFFSjthQUFNLENBQUEsR0FBSSxlQUFWO1FBQ0UsSUFBSSxDQUFDLFVBQUwsQ0FBQTtxQkFFQSxDQUFBO01BSEYsQ0FBQTs7SUFIa0IsQ0ExQnBCOztBQWtDQTs7Ozs7OztJQVFBLGNBQUEsRUFBZ0IsU0FBQTtBQUNkLFVBQUE7TUFBQSxVQUFBLEdBQWEsSUFBQyxDQUFBLGVBQUQsQ0FBQTtNQUViLFVBQVcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxTQUFkLENBQUE7TUFFQSxVQUFXLENBQUEsQ0FBQSxDQUFFLENBQUMsVUFBZCxDQUFBO01BRUEsVUFBQSxHQUFhLElBQUMsQ0FBQSxlQUFELENBQUE7YUFFYixVQUFXLENBQUEsQ0FBQSxDQUFFLENBQUMsVUFBZCxDQUFBO0lBVGMsQ0ExQ2hCOztBQXFEQTs7Ozs7SUFNQSxTQUFBLEVBQVcsU0FBQyxXQUFEO0FBQ1QsVUFBQTs2RUFBMEMsQ0FBRSxLQUE1QyxDQUFBO0lBRFMsQ0EzRFg7O0FBOERBOzs7Ozs7OztJQVNBLFlBQUEsRUFBYyxTQUFDLE9BQUQ7QUFDWixVQUFBO01BQUEsVUFBQSxHQUFhLElBQUMsQ0FBQSxlQUFELENBQUE7TUFFYixlQUFBLEdBQWtCLFVBQVUsQ0FBQztNQUc3QixlQUFBLDJEQUFvRCxDQUFFLE1BQXBDLENBQUE7TUFHbEIsSUFBRyxPQUFBLEtBQVksQ0FBWixJQUFBLE9BQUEsS0FBZSxDQUFsQjtRQUNFLGNBQUEsR0FBaUI7UUFFakIsSUFBQyxDQUFBLGdCQUFELENBQWtCLFVBQWxCO1FBRUEsSUFBcUIsT0FBQSxLQUFXLENBQWhDO1VBQUEsSUFBQyxDQUFBLGNBQUQsQ0FBQSxFQUFBOztRQUVBLElBQXdDLE9BQUEsS0FBVyxDQUFuRDtVQUFBLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixVQUFXLENBQUEsQ0FBQSxDQUEvQixFQUFtQyxDQUFuQyxFQUFBOztRQUVBLElBQUMsQ0FBQSw0QkFBRCxDQUE4QixVQUE5QixFQUEwQyxjQUExQyxFQVRGO09BQUEsTUFXSyxJQUFHLGVBQUEsR0FBa0IsT0FBckI7UUFDSCxjQUFBLEdBQWlCLE9BQUEsR0FBVTtRQUUzQixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsVUFBbEI7UUFFQSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsVUFBVyxDQUFBLENBQUEsQ0FBL0IsRUFBbUMsY0FBbkM7UUFFQSxJQUFDLENBQUEsNEJBQUQsQ0FBOEIsVUFBOUIsRUFBMEMsY0FBMUMsRUFQRztPQUFBLE1BU0EsSUFBRyxPQUFBLEdBQVUsZUFBYjtRQUNILG1CQUFBLEdBQXNCLE9BQUEsR0FBVTtRQUVoQyxTQUFBLEdBQVksVUFBVyxDQUFBLFVBQVUsQ0FBQyxNQUFYLEdBQW9CLENBQXBCO1FBRXZCLElBQUMsQ0FBQSxrQkFBRCxDQUFvQixTQUFwQixFQUErQixtQkFBL0IsRUFMRzs7YUFRTCxJQUFDLENBQUEsWUFBRCxDQUFjLGVBQWQ7SUFyQ1ksQ0F2RWQ7O0FBOEdBOzs7Ozs7O0lBUUEsZUFBQSxFQUFpQixTQUFBO0FBQ2YsYUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQWYsQ0FBQTtJQURRLENBdEhqQjs7QUF5SEE7Ozs7Ozs7O0lBU0EsUUFBQSxFQUFVLFNBQUMsWUFBRCxFQUFlLFdBQWY7QUFDUixVQUFBO01BQUEsS0FBQSxHQUFRLFlBQVksQ0FBQyxRQUFiLENBQUE7TUFFUixJQUFVLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQTFCO0FBQUEsZUFBQTs7QUFFQSxXQUFBLHVDQUFBOztRQUNFLFlBQVksQ0FBQyxjQUFiLENBQTRCLElBQTVCLEVBQWtDLFdBQWxDO0FBREY7YUFHQSxZQUFZLENBQUMsT0FBYixDQUFBO0lBUlEsQ0FsSVY7SUE0SUEsNEJBQUEsRUFBOEIsU0FBQyxVQUFELEVBQWEsVUFBYjtBQUM1QixVQUFBO01BQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxlQUFELENBQUE7QUFFUjtXQUFBLG9EQUFBOztRQUVFLElBQVksQ0FBQSxLQUFLLENBQWpCO0FBQUEsbUJBQUE7O1FBRUEsSUFBSSxDQUFBLElBQUssVUFBVDt1QkFDRSxJQUFDLENBQUEsUUFBRCxDQUFVLFNBQVYsRUFBcUIsS0FBTSxDQUFBLENBQUEsQ0FBM0IsR0FERjtTQUFBLE1BQUE7dUJBR0UsSUFBQyxDQUFBLFFBQUQsQ0FBVSxTQUFWLEVBQXFCLEtBQU0sQ0FBQSxVQUFBLENBQTNCLEdBSEY7O0FBSkY7O0lBSDRCLENBNUk5Qjs7QUF3SkE7Ozs7O0lBTUEsZ0JBQUEsRUFBa0IsU0FBQyxLQUFEO0FBQ2hCLFVBQUE7QUFBQTtXQUFBLCtDQUFBOztRQUNFLElBQVksQ0FBQSxLQUFLLENBQWpCO0FBQUEsbUJBQUE7O1FBRUEsSUFBa0IsSUFBSSxDQUFDLFFBQUwsQ0FBQSxDQUFlLENBQUMsTUFBaEIsS0FBMEIsQ0FBNUM7dUJBQUEsSUFBSSxDQUFDLE9BQUwsQ0FBQSxHQUFBO1NBQUEsTUFBQTsrQkFBQTs7QUFIRjs7SUFEZ0IsQ0E5SmxCOztBQURGIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuICAjIyNcbiAgQG5hbWUgQWN0aXZhdGUgSXRlbVxuICBAZGVzY3JpcHRpb25cbiAgQWN0aXZhdGUgYSBnaXZlbiBpdGVtIGZyb20gYSB1cmkgKFNlbGVjdCB0aGUgZmlsZSB0aGF0IHdhcyBwcmV2aW91c2x5IHNlbGVjdGVkKS5cblxuICBAcGFyYW0ge1N0cmluZ30gdXJpXG4gICMjI1xuXG4gIGFjdGl2YXRlSXRlbTogKHVyaSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIHVyaT9cblxuICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5wYW5lRm9yVVJJIHVyaVxuXG4gICAgcGFuZS5hY3RpdmF0ZSgpXG5cbiAgICBwYW5lLmFjdGl2YXRlSXRlbUZvclVSSSB1cmlcblxuICAjIyNcbiAgQG5hbWUgQWRkIEhvcml6b250YWwgUGFuZXNcbiAgQGRlc2NyaXB0aW9uXG4gIEZvciBhIGdpdmVuIHBhbmUsIGFkZCBhIG51bWJlciBvZiBwYW5lcyBhZnRlciBpdC5cblxuICBAcGFyYW1zIHtPYmplY3R9IHBhbmUgUGFuZSB0byBzdGFydCBmcm9tXG4gIEBwYXJhbXMge051bWJlcn0gbnVtYmVyX29mX3BhbmVzXG4gICMjI1xuXG4gIGFkZEhvcml6b250YWxQYW5lczogKHBhbmUsIG51bWJlcl9vZl9wYW5lcykgLT5cbiAgICBpID0gMFxuXG4gICAgd2hpbGUgaSA8IG51bWJlcl9vZl9wYW5lc1xuICAgICAgcGFuZS5zcGxpdFJpZ2h0KClcblxuICAgICAgaSsrXG5cbiAgIyMjXG4gIEBuYW1lIEFkZCBXaW5kb3cgUGFuZXNcbiAgQGRlc2NyaXB0aW9uXG4gIEFkZCBhIHdpbmRvdyBwYW5lcyB0byB0aGUgZ2l2ZW4gd29ya3NwYWNlLlxuXG4gIEB0b2RvOiBwYW5lLmdldE5leHRQYW5lKCkgc2VlbXMgdG8gYmUgYnVnZ3lcbiAgIyMjXG5cbiAgYWRkV2luZG93UGFuZXM6IC0+XG4gICAgb3Blbl9wYW5lcyA9IEBnZXRDdXJyZW50UGFuZXMoKVxuXG4gICAgb3Blbl9wYW5lc1swXS5zcGxpdERvd24oKVxuXG4gICAgb3Blbl9wYW5lc1swXS5zcGxpdFJpZ2h0KClcblxuICAgIG9wZW5fcGFuZXMgPSBAZ2V0Q3VycmVudFBhbmVzKClcblxuICAgIG9wZW5fcGFuZXNbMl0uc3BsaXRSaWdodCgpXG5cbiAgIyMjXG4gIEBuYW1lIEZvY3VzIFBhbmVcbiAgQGRlc2NyaXB0aW9uXG4gIFVwZGF0ZSB0aGUgY3VycmVudGx5IGZvY3VzZWQgcGFuZS5cbiAgIyMjXG5cbiAgZm9jdXNQYW5lOiAodGFyZ2V0X3BhbmUpIC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0UGFuZXMoKVt0YXJnZXRfcGFuZSAtIDFdPy5mb2N1cygpXG5cbiAgIyMjXG4gIEBuYW1lIEZvcm1hdCBMYXlvdXRcbiAgQGRlc2NyaXB0aW9uXG4gIEZvcm1hdCB0aGUgcGFuZSBsYXlvdXQgYmFzZWQgb24gdGhlIG51bWJlciBvZiBjb2x1bW5zIHByb3ZpZGVkLiBUaGVuIHNlbGVjdFxuICB0aGUgcGFuZSBpdGVtIHRoYXQgd2FzIHByZXZpb3VzbHkgYWN0aXZlLlxuXG4gIEBwYXJhbXMge051bWJlcn0gY29sdW1uc1xuICAjIyNcblxuICBmb3JtYXRMYXlvdXQ6IChjb2x1bW5zKSAtPlxuICAgIG9wZW5fcGFuZXMgPSBAZ2V0Q3VycmVudFBhbmVzKClcblxuICAgIG51bWJlcl9vZl9wYW5lcyA9IG9wZW5fcGFuZXMubGVuZ3RoXG5cbiAgICAjIGdldCBjdXJyZW50IGFjdGl2ZSBpdGVtXG4gICAgYWN0aXZlX2l0ZW1fdXJpID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZUl0ZW0oKT8uZ2V0VVJJKClcblxuICAgICMgVE9ETzogY29uc2lkZXIgcmVmYWN0b3JpbmcgdGhlc2UgbWV0aG9kc1xuICAgIGlmIGNvbHVtbnMgaW4gWzQsIDVdXG4gICAgICBuZXdfcGFuZV9pbmRleCA9IDNcblxuICAgICAgQHJlbW92ZUVtcHR5UGFuZXMob3Blbl9wYW5lcylcblxuICAgICAgQGFkZFdpbmRvd1BhbmVzKCkgaWYgY29sdW1ucyBpcyA1XG5cbiAgICAgIEBhZGRIb3Jpem9udGFsUGFuZXMgb3Blbl9wYW5lc1swXSwgMyBpZiBjb2x1bW5zIGlzIDRcblxuICAgICAgQG1vdmVPdmVyZmxvd1BhbmVzVG9QYW5lSW5kZXgob3Blbl9wYW5lcywgbmV3X3BhbmVfaW5kZXgpXG5cbiAgICBlbHNlIGlmIG51bWJlcl9vZl9wYW5lcyA+IGNvbHVtbnNcbiAgICAgIG5ld19wYW5lX2luZGV4ID0gY29sdW1ucyAtIDFcblxuICAgICAgQHJlbW92ZUVtcHR5UGFuZXMob3Blbl9wYW5lcylcblxuICAgICAgQGFkZEhvcml6b250YWxQYW5lcyBvcGVuX3BhbmVzWzBdLCBuZXdfcGFuZV9pbmRleFxuXG4gICAgICBAbW92ZU92ZXJmbG93UGFuZXNUb1BhbmVJbmRleChvcGVuX3BhbmVzLCBuZXdfcGFuZV9pbmRleClcblxuICAgIGVsc2UgaWYgY29sdW1ucyA+IG51bWJlcl9vZl9wYW5lc1xuICAgICAgbnVtYmVyX29mX25ld19wYW5lcyA9IGNvbHVtbnMgLSBudW1iZXJfb2ZfcGFuZXNcblxuICAgICAgbGFzdF9wYW5lID0gb3Blbl9wYW5lc1tvcGVuX3BhbmVzLmxlbmd0aCAtIDFdXG5cbiAgICAgIEBhZGRIb3Jpem9udGFsUGFuZXMgbGFzdF9wYW5lLCBudW1iZXJfb2ZfbmV3X3BhbmVzXG5cbiAgICAjIHNldCBhY3RpdmUgaXRlbSB3aXRoIHByZXZpb3VzbHkgYWN0aXZlIGl0ZW1cbiAgICBAYWN0aXZhdGVJdGVtIGFjdGl2ZV9pdGVtX3VyaVxuXG4gICMjI1xuICBAbmFtZSBHZXQgQ3VycmVudCBQYW5lc1xuICBAZGVzY3JpcHRpb25cbiAgUmV0dXJuIHRoZSBjdXJyZW50IHBhbmVzIG9mIHRoZSB3b3Jrc3BhY2UuXG5cbiAgQHJldHVybnMge0FycmF5fSBwYW5lc1xuICAjIyNcblxuICBnZXRDdXJyZW50UGFuZXM6IC0+XG4gICAgcmV0dXJuIGF0b20ud29ya3NwYWNlLmdldFBhbmVzKClcblxuICAjIyNcbiAgQG5hbWUgTW92ZSBQYW5lXG4gIEBkZXNjcmlwdGlvblxuICBNb3ZlIGEgcGFuZXMgaXRlbXMgZnJvbSBvbmUgbG9jYXRpb24gdG8gYW5vdGhlci5cblxuICBAcGFyYW1zIHtPYmplY3R9IGN1cnJlbnRfcGFuZVxuICBAcGFyYW1zIHtPYmplY3R9IHRhcmdldF9wYW5lXG4gICMjI1xuXG4gIG1vdmVQYW5lOiAoY3VycmVudF9wYW5lLCB0YXJnZXRfcGFuZSkgLT5cbiAgICBpdGVtcyA9IGN1cnJlbnRfcGFuZS5nZXRJdGVtcygpXG5cbiAgICByZXR1cm4gaWYgaXRlbXMubGVuZ3RoIGlzIDBcblxuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBjdXJyZW50X3BhbmUubW92ZUl0ZW1Ub1BhbmUgaXRlbSwgdGFyZ2V0X3BhbmVcblxuICAgIGN1cnJlbnRfcGFuZS5kZXN0cm95KCk7XG5cbiAgbW92ZU92ZXJmbG93UGFuZXNUb1BhbmVJbmRleDogKG9wZW5fcGFuZXMsIHBhbmVfaW5kZXgpIC0+XG4gICAgcGFuZXMgPSBAZ2V0Q3VycmVudFBhbmVzKClcblxuICAgIGZvciBvcGVuX3BhbmUsIGkgaW4gb3Blbl9wYW5lc1xuICAgICAgIyBhbHdheXMgc2tpcCBmaXJzdCBwYW5lIGNhdXNlIGl0IGlzIGltbXV0YWJsZVxuICAgICAgY29udGludWUgaWYgaSBpcyAwXG5cbiAgICAgIGlmIChpIDw9IHBhbmVfaW5kZXgpXG4gICAgICAgIEBtb3ZlUGFuZSBvcGVuX3BhbmUsIHBhbmVzW2ldXG4gICAgICBlbHNlXG4gICAgICAgIEBtb3ZlUGFuZSBvcGVuX3BhbmUsIHBhbmVzW3BhbmVfaW5kZXhdXG5cbiAgIyMjXG4gIEBuYW1lIFJlbW92ZSBFbXB0eSBQYW5lc1xuICBAZGVzY3JpcHRpb25cbiAgUmVtb3ZlIGFuIHBhbmUgdGhhdCBkb2VzIG5vdCBjb250YWluIGFueSBpdGVtcy5cbiAgIyMjXG5cbiAgcmVtb3ZlRW1wdHlQYW5lczogKHBhbmVzKSAtPlxuICAgIGZvciBwYW5lLCBpIGluIHBhbmVzXG4gICAgICBjb250aW51ZSBpZiBpIGlzIDBcblxuICAgICAgcGFuZS5kZXN0cm95KCkgaWYgcGFuZS5nZXRJdGVtcygpLmxlbmd0aCBpcyAwXG4iXX0=
