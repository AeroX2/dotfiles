(function() {
  module.exports = {
    activate: function(state) {
      atom.commands.add("atom-workspace", {
        "move-panes:move-right": (function(_this) {
          return function() {
            return _this.moveRight();
          };
        })(this)
      });
      atom.commands.add("atom-workspace", "move-panes:move-left", (function(_this) {
        return function() {
          return _this.moveLeft();
        };
      })(this));
      atom.commands.add("atom-workspace", "move-panes:move-down", (function(_this) {
        return function() {
          return _this.moveDown();
        };
      })(this));
      atom.commands.add("atom-workspace", "move-panes:move-up", (function(_this) {
        return function() {
          return _this.moveUp();
        };
      })(this));
      atom.commands.add("atom-workspace", "move-panes:move-next", (function(_this) {
        return function() {
          return _this.moveNext();
        };
      })(this));
      return atom.commands.add("atom-workspace", "move-panes:move-previous", (function(_this) {
        return function() {
          return _this.movePrevious();
        };
      })(this));
    },
    moveRight: function() {
      return this.move('horizontal', +1);
    },
    moveLeft: function() {
      return this.move('horizontal', -1);
    },
    moveUp: function() {
      return this.move('vertical', -1);
    },
    moveDown: function() {
      return this.move('vertical', +1);
    },
    moveNext: function() {
      return this.moveOrder(this.nextMethod);
    },
    movePrevious: function() {
      return this.moveOrder(this.previousMethod);
    },
    nextMethod: 'activateNextPane',
    previousMethod: 'activatePreviousPane',
    active: function() {
      return atom.workspace.getActivePane();
    },
    moveOrder: function(method) {
      var source, target;
      source = this.active();
      atom.workspace[method]();
      target = this.active();
      return this.swapEditor(source, target);
    },
    move: function(orientation, delta) {
      var axis, child, pane, ref, target;
      pane = atom.workspace.getActivePane();
      ref = this.getAxis(pane, orientation), axis = ref[0], child = ref[1];
      if (axis != null) {
        target = this.getRelativePane(axis, child, delta);
      }
      if (target != null) {
        return this.swapEditor(pane, target);
      }
    },
    swapEditor: function(source, target) {
      var editor;
      editor = source.getActiveItem();
      source.removeItem(editor);
      target.addItem(editor);
      target.activateItem(editor);
      return target.activate();
    },
    getAxis: function(pane, orientation) {
      var axis, child;
      axis = pane.parent;
      child = pane;
      while (true) {
        if (axis.constructor.name !== 'PaneAxis') {
          return;
        }
        if (axis.orientation === orientation) {
          break;
        }
        child = axis;
        axis = axis.parent;
      }
      return [axis, child];
    },
    getRelativePane: function(axis, source, delta) {
      var position, target;
      position = axis.children.indexOf(source);
      target = position + delta;
      if (!(target < axis.children.length)) {
        return;
      }
      return axis.children[target].getPanes()[0];
    },
    deactivate: function() {},
    serialize: function() {}
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbW92ZS1wYW5lcy9saWIvbW92ZS1wYW5lcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUVFO0lBQUEsUUFBQSxFQUFVLFNBQUMsS0FBRDtNQUNSLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0M7UUFBQSx1QkFBQSxFQUF5QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxTQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekI7T0FBcEM7TUFDQSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLHNCQUFwQyxFQUE0RCxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLFFBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1RDtNQUNBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0Msc0JBQXBDLEVBQTRELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsUUFBRCxDQUFBO1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTVEO01BQ0EsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyxvQkFBcEMsRUFBMEQsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxNQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBMUQ7TUFDQSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLHNCQUFwQyxFQUE0RCxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFB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LEVBQWlCLFNBQUMsSUFBRCxFQUFPLE1BQVAsRUFBZSxLQUFmO0FBQ2YsVUFBQTtNQUFBLFFBQUEsR0FBVyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQWQsQ0FBc0IsTUFBdEI7TUFDWCxNQUFBLEdBQVMsUUFBQSxHQUFXO01BQ3BCLElBQUEsQ0FBQSxDQUFjLE1BQUEsR0FBUyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQXJDLENBQUE7QUFBQSxlQUFBOztBQUNBLGFBQU8sSUFBSSxDQUFDLFFBQVMsQ0FBQSxNQUFBLENBQU8sQ0FBQyxRQUF0QixDQUFBLENBQWlDLENBQUEsQ0FBQTtJQUp6QixDQW5EakI7SUF5REEsVUFBQSxFQUFZLFNBQUEsR0FBQSxDQXpEWjtJQTJEQSxTQUFBLEVBQVcsU0FBQSxHQUFBLENBM0RYOztBQUZGIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuXG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgYXRvbS5jb21tYW5kcy5hZGQgXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm1vdmUtcGFuZXM6bW92ZS1yaWdodFwiOiA9PiBAbW92ZVJpZ2h0KClcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCBcImF0b20td29ya3NwYWNlXCIsIFwibW92ZS1wYW5lczptb3ZlLWxlZnRcIiwgPT4gQG1vdmVMZWZ0KClcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCBcImF0b20td29ya3NwYWNlXCIsIFwibW92ZS1wYW5lczptb3ZlLWRvd25cIiwgPT4gQG1vdmVEb3duKClcbiAgICBhdG9tLmNvbW1hbmRzLmFkZCBcImF0b20td29ya3NwYWNlXCIsIFwibW92ZS1wYW5lczptb3ZlLXVwXCIsID0+IEBtb3ZlVXAoKVxuICAgIGF0b20uY29tbWFuZHMuYWRkIFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJtb3ZlLXBhbmVzOm1vdmUtbmV4dFwiLCA9PiBAbW92ZU5leHQoKVxuICAgIGF0b20uY29tbWFuZHMuYWRkIFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJtb3ZlLXBhbmVzOm1vdmUtcHJldmlvdXNcIiwgPT4gQG1vdmVQcmV2aW91cygpXG5cbiAgbW92ZVJpZ2h0OiAtPiBAbW92ZSAnaG9yaXpvbnRhbCcsICsxXG4gIG1vdmVMZWZ0OiAtPiBAbW92ZSAnaG9yaXpvbnRhbCcsIC0xXG4gIG1vdmVVcDogLT4gQG1vdmUgJ3ZlcnRpY2FsJywgLTFcbiAgbW92ZURvd246IC0+IEBtb3ZlICd2ZXJ0aWNhbCcsICsxXG4gIG1vdmVOZXh0OiAtPiBAbW92ZU9yZGVyIEBuZXh0TWV0aG9kXG4gIG1vdmVQcmV2aW91czogLT4gQG1vdmVPcmRlciBAcHJldmlvdXNNZXRob2RcblxuICBuZXh0TWV0aG9kOiAnYWN0aXZhdGVOZXh0UGFuZSdcbiAgcHJldmlvdXNNZXRob2Q6ICdhY3RpdmF0ZVByZXZpb3VzUGFuZSdcblxuICBhY3RpdmU6IC0+IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuXG4gIG1vdmVPcmRlcjogKG1ldGhvZCkgLT5cbiAgICBzb3VyY2UgPSBAYWN0aXZlKClcbiAgICBhdG9tLndvcmtzcGFjZVttZXRob2RdKClcbiAgICB0YXJnZXQgPSBAYWN0aXZlKClcbiAgICBAc3dhcEVkaXRvciBzb3VyY2UsIHRhcmdldFxuXG4gIG1vdmU6IChvcmllbnRhdGlvbiwgZGVsdGEpIC0+XG4gICAgcGFuZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuICAgIFtheGlzLGNoaWxkXSA9IEBnZXRBeGlzIHBhbmUsIG9yaWVudGF0aW9uXG4gICAgaWYgYXhpcz9cbiAgICAgIHRhcmdldCA9IEBnZXRSZWxhdGl2ZVBhbmUgYXhpcywgY2hpbGQsIGRlbHRhXG4gICAgaWYgdGFyZ2V0P1xuICAgICAgQHN3YXBFZGl0b3IgcGFuZSwgdGFyZ2V0XG5cbiAgc3dhcEVkaXRvcjogKHNvdXJjZSwgdGFyZ2V0KSAtPlxuICAgIGVkaXRvciA9IHNvdXJjZS5nZXRBY3RpdmVJdGVtKClcbiAgICBzb3VyY2UucmVtb3ZlSXRlbSBlZGl0b3JcbiAgICB0YXJnZXQuYWRkSXRlbSBlZGl0b3JcbiAgICB0YXJnZXQuYWN0aXZhdGVJdGVtIGVkaXRvclxuICAgIHRhcmdldC5hY3RpdmF0ZSgpXG5cbiAgZ2V0QXhpczogKHBhbmUsIG9yaWVudGF0aW9uKSAtPlxuICAgIGF4aXMgPSBwYW5lLnBhcmVudFxuICAgIGNoaWxkID0gcGFuZVxuICAgIHdoaWxlIHRydWVcbiAgICAgIHJldHVybiB1bmxlc3MgYXhpcy5jb25zdHJ1Y3Rvci5uYW1lID09ICdQYW5lQXhpcydcbiAgICAgIGJyZWFrIGlmIGF4aXMub3JpZW50YXRpb24gPT0gb3JpZW50YXRpb25cbiAgICAgIGNoaWxkID0gYXhpc1xuICAgICAgYXhpcyA9IGF4aXMucGFyZW50XG4gICAgcmV0dXJuIFtheGlzLGNoaWxkXVxuXG4gIGdldFJlbGF0aXZlUGFuZTogKGF4aXMsIHNvdXJjZSwgZGVsdGEpIC0+XG4gICAgcG9zaXRpb24gPSBheGlzLmNoaWxkcmVuLmluZGV4T2Ygc291cmNlXG4gICAgdGFyZ2V0ID0gcG9zaXRpb24gKyBkZWx0YVxuICAgIHJldHVybiB1bmxlc3MgdGFyZ2V0IDwgYXhpcy5jaGlsZHJlbi5sZW5ndGhcbiAgICByZXR1cm4gYXhpcy5jaGlsZHJlblt0YXJnZXRdLmdldFBhbmVzKClbMF1cblxuICBkZWFjdGl2YXRlOiAtPlxuXG4gIHNlcmlhbGl6ZTogLT5cbiJdfQ==
