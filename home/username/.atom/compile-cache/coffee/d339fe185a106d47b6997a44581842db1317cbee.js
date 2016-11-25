(function() {
  var paneLayoutFormatter;

  paneLayoutFormatter = require('./pane-layout-formatter');

  module.exports = {
    activate: function() {
      return atom.commands.add('atom-workspace', {
        'pane-layout:column-1': (function(_this) {
          return function() {
            return _this.layout(1);
          };
        })(this),
        'pane-layout:column-2': (function(_this) {
          return function() {
            return _this.layout(2);
          };
        })(this),
        'pane-layout:column-3': (function(_this) {
          return function() {
            return _this.layout(3);
          };
        })(this),
        'pane-layout:column-4': (function(_this) {
          return function() {
            return _this.layout(4);
          };
        })(this),
        'pane-layout:square': (function(_this) {
          return function() {
            return _this.layout(5);
          };
        })(this),
        'pane-layout-focus:column-1': (function(_this) {
          return function() {
            return _this.focus(1);
          };
        })(this),
        'pane-layout-focus:column-2': (function(_this) {
          return function() {
            return _this.focus(2);
          };
        })(this),
        'pane-layout-focus:column-3': (function(_this) {
          return function() {
            return _this.focus(3);
          };
        })(this),
        'pane-layout-focus:column-4': (function(_this) {
          return function() {
            return _this.focus(4);
          };
        })(this)
      });
    },
    focus: function(column) {
      return paneLayoutFormatter.focusPane(column);
    },
    layout: function(columns) {
      return paneLayoutFormatter.formatLayout(columns);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvcGFuZS1sYXlvdXQtcGx1cy9saWIvcGFuZS1sYXlvdXQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxtQkFBQSxHQUFzQixPQUFBLENBQVEseUJBQVI7O0VBRXRCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTthQUNSLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFDRTtRQUFBLHNCQUFBLEVBQXdCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLE1BQUQsQ0FBUSxDQUFSO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXhCO1FBQ0Esc0JBQUEsRUFBd0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsTUFBRCxDQUFRLENBQVI7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FEeEI7UUFFQSxzQkFBQSxFQUF3QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxNQUFELENBQVEsQ0FBUjtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUZ4QjtRQUdBLHNCQUFBLEVBQXdCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLE1BQUQsQ0FBUSxDQUFSO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBSHhCO1FBSUEsb0JBQUEsRUFBc0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsTUFBRCxDQUFRLENBQVI7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FKdEI7UUFNQSw0QkFBQSxFQUE4QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxLQUFELENBQU8sQ0FBUDtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQU45QjtRQU9BLDRCQUFBLEVBQThCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLEtBQUQsQ0FBTyxDQUFQO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBUDlCO1FBUUEsNEJBQUEsRUFBOEIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsS0FBRCxDQUFPLENBQVA7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FSOUI7UUFTQSw0QkFBQSxFQUE4QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxLQUFELENBQU8sQ0FBUDtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQVQ5QjtPQURGO0lBRFEsQ0FBVjtJQWFBLEtBQUEsRUFBTyxTQUFDLE1BQUQ7YUFDTCxtQkFBbUIsQ0FBQyxTQUFwQixDQUE4QixNQUE5QjtJQURLLENBYlA7SUFnQkEsTUFBQSxFQUFRLFNBQUMsT0FBRDthQUNOLG1CQUFtQixDQUFDLFlBQXBCLENBQWlDLE9BQWpDO0lBRE0sQ0FoQlI7O0FBSEYiLCJzb3VyY2VzQ29udGVudCI6WyJwYW5lTGF5b3V0Rm9ybWF0dGVyID0gcmVxdWlyZSAnLi9wYW5lLWxheW91dC1mb3JtYXR0ZXInXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+XG4gICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJyxcbiAgICAgICdwYW5lLWxheW91dDpjb2x1bW4tMSc6ID0+IEBsYXlvdXQgMVxuICAgICAgJ3BhbmUtbGF5b3V0OmNvbHVtbi0yJzogPT4gQGxheW91dCAyXG4gICAgICAncGFuZS1sYXlvdXQ6Y29sdW1uLTMnOiA9PiBAbGF5b3V0IDNcbiAgICAgICdwYW5lLWxheW91dDpjb2x1bW4tNCc6ID0+IEBsYXlvdXQgNFxuICAgICAgJ3BhbmUtbGF5b3V0OnNxdWFyZSc6ID0+IEBsYXlvdXQgNVxuXG4gICAgICAncGFuZS1sYXlvdXQtZm9jdXM6Y29sdW1uLTEnOiA9PiBAZm9jdXMgMVxuICAgICAgJ3BhbmUtbGF5b3V0LWZvY3VzOmNvbHVtbi0yJzogPT4gQGZvY3VzIDJcbiAgICAgICdwYW5lLWxheW91dC1mb2N1czpjb2x1bW4tMyc6ID0+IEBmb2N1cyAzXG4gICAgICAncGFuZS1sYXlvdXQtZm9jdXM6Y29sdW1uLTQnOiA9PiBAZm9jdXMgNFxuXG4gIGZvY3VzOiAoY29sdW1uKSAtPlxuICAgIHBhbmVMYXlvdXRGb3JtYXR0ZXIuZm9jdXNQYW5lIGNvbHVtblxuXG4gIGxheW91dDogKGNvbHVtbnMpIC0+XG4gICAgcGFuZUxheW91dEZvcm1hdHRlci5mb3JtYXRMYXlvdXQgY29sdW1uc1xuIl19
