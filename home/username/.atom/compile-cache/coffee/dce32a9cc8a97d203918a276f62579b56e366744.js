(function() {
  var paneMoveFormatter;

  paneMoveFormatter = require('./pane-move-formatter');

  module.exports = {
    activate: function() {
      return atom.commands.add('atom-text-editor', {
        'pane-move:down': (function(_this) {
          return function() {
            return _this.moveDown();
          };
        })(this),
        'pane-move:left': (function(_this) {
          return function() {
            return _this.moveLeft();
          };
        })(this),
        'pane-move:right': (function(_this) {
          return function() {
            return _this.moveRight();
          };
        })(this),
        'pane-move:up': (function(_this) {
          return function() {
            return _this.moveUp();
          };
        })(this),
        'pane-move-to:1': (function(_this) {
          return function() {
            return _this.moveTo(1);
          };
        })(this),
        'pane-move-to:2': (function(_this) {
          return function() {
            return _this.moveTo(2);
          };
        })(this),
        'pane-move-to:3': (function(_this) {
          return function() {
            return _this.moveTo(3);
          };
        })(this),
        'pane-move-to:4': (function(_this) {
          return function() {
            return _this.moveTo(4);
          };
        })(this)
      });
    },
    moveDown: function() {
      return paneMoveFormatter.move(+1);
    },
    moveLeft: function() {
      return paneMoveFormatter.move(-1);
    },
    moveRight: function() {
      return paneMoveFormatter.move(+1);
    },
    moveUp: function() {
      return paneMoveFormatter.move(-1);
    },
    moveTo: function(column) {
      return paneMoveFormatter.moveTo(column);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvcGFuZS1tb3ZlLXBsdXMvbGliL3BhbmUtbW92ZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLGlCQUFBLEdBQW9CLE9BQUEsQ0FBUSx1QkFBUjs7RUFFcEIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFBO2FBQ1IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGtCQUFsQixFQUNFO1FBQUEsZ0JBQUEsRUFBa0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsUUFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxCO1FBQ0EsZ0JBQUEsRUFBa0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsUUFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRGxCO1FBRUEsaUJBQUEsRUFBbUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsU0FBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRm5CO1FBR0EsY0FBQSxFQUFnQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxNQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FIaEI7UUFLQSxnQkFBQSxFQUFrQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxNQUFELENBQVEsQ0FBUjtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUxsQjtRQU1BLGdCQUFBLEVBQWtCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLE1BQUQsQ0FBUSxDQUFSO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBTmxCO1FBT0EsZ0JBQUEsRUFBa0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsTUFBRCxDQUFRLENBQVI7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FQbEI7UUFRQSxnQkFBQSxFQUFrQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxNQUFELENBQVEsQ0FBUjtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQVJsQjtPQURGO0lBRFEsQ0FBVjtJQVlBLFFBQUEsRUFBVyxTQUFBO2FBQUcsaUJBQWlCLENBQUMsSUFBbEIsQ0FBdUIsQ0FBQyxDQUF4QjtJQUFILENBWlg7SUFhQSxRQUFBLEVBQVcsU0FBQTthQUFHLGlCQUFpQixDQUFDLElBQWxCLENBQXVCLENBQUMsQ0FBeEI7SUFBSCxDQWJYO0lBY0EsU0FBQSxFQUFXLFNBQUE7YUFBRyxpQkFBaUIsQ0FBQyxJQUFsQixDQUF1QixDQUFDLENBQXhCO0lBQUgsQ0FkWDtJQWVBLE1BQUEsRUFBVyxTQUFBO2FBQUcsaUJBQWlCLENBQUMsSUFBbEIsQ0FBdUIsQ0FBQyxDQUF4QjtJQUFILENBZlg7SUFpQkEsTUFBQSxFQUFRLFNBQUMsTUFBRDthQUFZLGlCQUFpQixDQUFDLE1BQWxCLENBQXlCLE1BQXpCO0lBQVosQ0FqQlI7O0FBSEYiLCJzb3VyY2VzQ29udGVudCI6WyJwYW5lTW92ZUZvcm1hdHRlciA9IHJlcXVpcmUgJy4vcGFuZS1tb3ZlLWZvcm1hdHRlcidcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsXG4gICAgICAncGFuZS1tb3ZlOmRvd24nOiA9PiBAbW92ZURvd24oKVxuICAgICAgJ3BhbmUtbW92ZTpsZWZ0JzogPT4gQG1vdmVMZWZ0KClcbiAgICAgICdwYW5lLW1vdmU6cmlnaHQnOiA9PiBAbW92ZVJpZ2h0KClcbiAgICAgICdwYW5lLW1vdmU6dXAnOiA9PiBAbW92ZVVwKClcblxuICAgICAgJ3BhbmUtbW92ZS10bzoxJzogPT4gQG1vdmVUbyAxXG4gICAgICAncGFuZS1tb3ZlLXRvOjInOiA9PiBAbW92ZVRvIDJcbiAgICAgICdwYW5lLW1vdmUtdG86Myc6ID0+IEBtb3ZlVG8gM1xuICAgICAgJ3BhbmUtbW92ZS10bzo0JzogPT4gQG1vdmVUbyA0XG5cbiAgbW92ZURvd246ICAtPiBwYW5lTW92ZUZvcm1hdHRlci5tb3ZlICsxXG4gIG1vdmVMZWZ0OiAgLT4gcGFuZU1vdmVGb3JtYXR0ZXIubW92ZSAtMVxuICBtb3ZlUmlnaHQ6IC0+IHBhbmVNb3ZlRm9ybWF0dGVyLm1vdmUgKzFcbiAgbW92ZVVwOiAgICAtPiBwYW5lTW92ZUZvcm1hdHRlci5tb3ZlIC0xXG5cbiAgbW92ZVRvOiAoY29sdW1uKSAtPiBwYW5lTW92ZUZvcm1hdHRlci5tb3ZlVG8gY29sdW1uXG4iXX0=
