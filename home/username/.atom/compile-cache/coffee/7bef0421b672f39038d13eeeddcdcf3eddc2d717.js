(function() {
  var StatusBarManager, _, createDiv, settings;

  _ = require('underscore-plus');

  settings = require('./settings');

  createDiv = function(arg) {
    var classList, div, id, ref;
    id = arg.id, classList = arg.classList;
    div = document.createElement('div');
    if (id != null) {
      div.id = id;
    }
    if (classList != null) {
      (ref = div.classList).add.apply(ref, classList);
    }
    return div;
  };

  module.exports = StatusBarManager = (function() {
    StatusBarManager.prototype.prefix = 'status-bar-vim-mode-plus';

    function StatusBarManager() {
      this.container = createDiv({
        id: this.prefix + "-container",
        classList: ['inline-block']
      });
      this.container.appendChild(this.element = createDiv({
        id: this.prefix
      }));
    }

    StatusBarManager.prototype.initialize = function(statusBar) {
      this.statusBar = statusBar;
    };

    StatusBarManager.prototype.update = function(mode, submode) {
      var modeString;
      this.element.className = this.prefix + "-" + mode;
      modeString = (function() {
        switch (settings.get('statusBarModeStringStyle')) {
          case 'short':
            return this.getShortModeString(mode, submode);
          case 'long':
            return this.getLongModeString(mode, submode);
        }
      }).call(this);
      return this.element.textContent = modeString;
    };

    StatusBarManager.prototype.getShortModeString = function(mode, submode) {
      return (mode[0] + (submode != null ? submode[0] : '')).toUpperCase();
    };

    StatusBarManager.prototype.getLongModeString = function(mode, submode) {
      var modeString;
      modeString = _.humanizeEventName(mode);
      if (submode != null) {
        modeString += " " + _.humanizeEventName(submode);
      }
      return modeString;
    };

    StatusBarManager.prototype.attach = function() {
      return this.tile = this.statusBar.addRightTile({
        item: this.container,
        priority: 20
      });
    };

    StatusBarManager.prototype.detach = function() {
      return this.tile.destroy();
    };

    return StatusBarManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvc3RhdHVzLWJhci1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRVgsU0FBQSxHQUFZLFNBQUMsR0FBRDtBQUNWLFFBQUE7SUFEWSxhQUFJO0lBQ2hCLEdBQUEsR0FBTSxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QjtJQUNOLElBQWUsVUFBZjtNQUFBLEdBQUcsQ0FBQyxFQUFKLEdBQVMsR0FBVDs7SUFDQSxJQUFtQyxpQkFBbkM7TUFBQSxPQUFBLEdBQUcsQ0FBQyxTQUFKLENBQWEsQ0FBQyxHQUFkLFlBQWtCLFNBQWxCLEVBQUE7O1dBQ0E7RUFKVTs7RUFNWixNQUFNLENBQUMsT0FBUCxHQUNNOytCQUNKLE1BQUEsR0FBUTs7SUFFSywwQkFBQTtNQUNYLElBQUMsQ0FBQSxTQUFELEdBQWEsU0FBQSxDQUFVO1FBQUEsRUFBQSxFQUFPLElBQUMsQ0FBQSxNQUFGLEdBQVMsWUFBZjtRQUE0QixTQUFBLEVBQVcsQ0FBQyxjQUFELENBQXZDO09BQVY7TUFDYixJQUFDLENBQUEsU0FBUyxDQUFDLFdBQVgsQ0FBdUIsSUFBQyxDQUFBLE9BQUQsR0FBVyxTQUFBLENBQVU7UUFBQSxFQUFBLEVBQUksSUFBQyxDQUFBLE1BQUw7T0FBVixDQUFsQztJQUZXOzsrQkFJYixVQUFBLEdBQVksU0FBQyxTQUFEO01BQUMsSUFBQyxDQUFBLFlBQUQ7SUFBRDs7K0JBRVosTUFBQSxHQUFRLFNBQUMsSUFBRCxFQUFPLE9BQVA7QUFDTixVQUFBO01BQUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFULEdBQXdCLElBQUMsQ0FBQSxNQUFGLEdBQVMsR0FBVCxHQUFZO01BQ25DLFVBQUE7QUFBYSxnQkFBTyxRQUFRLENBQUMsR0FBVCxDQUFhLDBCQUFiLENBQVA7QUFBQSxlQUNOLE9BRE07bUJBQ08sSUFBQyxDQUFBLGtCQUFELENBQW9CLElBQXBCLEVBQTBCLE9BQTFCO0FBRFAsZUFFTixNQUZNO21CQUVNLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFuQixFQUF5QixPQUF6QjtBQUZOOzthQUdiLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxHQUF1QjtJQUxqQjs7K0JBT1Isa0JBQUEsR0FBb0IsU0FBQyxJQUFELEVBQU8sT0FBUDthQUNsQixDQUFDLElBQUssQ0FBQSxDQUFBLENBQUwsR0FBVSxDQUFJLGVBQUgsR0FBaUIsT0FBUSxDQUFBLENBQUEsQ0FBekIsR0FBaUMsRUFBbEMsQ0FBWCxDQUFpRCxDQUFDLFdBQWxELENBQUE7SUFEa0I7OytCQUdwQixpQkFBQSxHQUFtQixTQUFDLElBQUQsRUFBTyxPQUFQO0FBQ2pCLFVBQUE7TUFBQSxVQUFBLEdBQWEsQ0FBQyxDQUFDLGlCQUFGLENBQW9CLElBQXBCO01BQ2IsSUFBb0QsZUFBcEQ7UUFBQSxVQUFBLElBQWMsR0FBQSxHQUFNLENBQUMsQ0FBQyxpQkFBRixDQUFvQixPQUFwQixFQUFwQjs7YUFDQTtJQUhpQjs7K0JBS25CLE1BQUEsR0FBUSxTQUFBO2FBQ04sSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFDLENBQUEsU0FBUyxDQUFDLFlBQVgsQ0FBd0I7UUFBQSxJQUFBLEVBQU0sSUFBQyxDQUFBLFNBQVA7UUFBa0IsUUFBQSxFQUFVLEVBQTVCO09BQXhCO0lBREY7OytCQUdSLE1BQUEsR0FBUSxTQUFBO2FBQ04sSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQUE7SUFETTs7Ozs7QUFyQ1YiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xuXG5jcmVhdGVEaXYgPSAoe2lkLCBjbGFzc0xpc3R9KSAtPlxuICBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBkaXYuaWQgPSBpZCBpZiBpZD9cbiAgZGl2LmNsYXNzTGlzdC5hZGQoY2xhc3NMaXN0Li4uKSBpZiBjbGFzc0xpc3Q/XG4gIGRpdlxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTdGF0dXNCYXJNYW5hZ2VyXG4gIHByZWZpeDogJ3N0YXR1cy1iYXItdmltLW1vZGUtcGx1cydcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBAY29udGFpbmVyID0gY3JlYXRlRGl2KGlkOiBcIiN7QHByZWZpeH0tY29udGFpbmVyXCIsIGNsYXNzTGlzdDogWydpbmxpbmUtYmxvY2snXSlcbiAgICBAY29udGFpbmVyLmFwcGVuZENoaWxkKEBlbGVtZW50ID0gY3JlYXRlRGl2KGlkOiBAcHJlZml4KSlcblxuICBpbml0aWFsaXplOiAoQHN0YXR1c0JhcikgLT5cblxuICB1cGRhdGU6IChtb2RlLCBzdWJtb2RlKSAtPlxuICAgIEBlbGVtZW50LmNsYXNzTmFtZSA9IFwiI3tAcHJlZml4fS0je21vZGV9XCJcbiAgICBtb2RlU3RyaW5nID0gc3dpdGNoIHNldHRpbmdzLmdldCgnc3RhdHVzQmFyTW9kZVN0cmluZ1N0eWxlJylcbiAgICAgIHdoZW4gJ3Nob3J0JyB0aGVuIEBnZXRTaG9ydE1vZGVTdHJpbmcobW9kZSwgc3VibW9kZSlcbiAgICAgIHdoZW4gJ2xvbmcnIHRoZW4gQGdldExvbmdNb2RlU3RyaW5nKG1vZGUsIHN1Ym1vZGUpXG4gICAgQGVsZW1lbnQudGV4dENvbnRlbnQgPSBtb2RlU3RyaW5nXG5cbiAgZ2V0U2hvcnRNb2RlU3RyaW5nOiAobW9kZSwgc3VibW9kZSkgLT5cbiAgICAobW9kZVswXSArIChpZiBzdWJtb2RlPyB0aGVuIHN1Ym1vZGVbMF0gZWxzZSAnJykpLnRvVXBwZXJDYXNlKClcblxuICBnZXRMb25nTW9kZVN0cmluZzogKG1vZGUsIHN1Ym1vZGUpIC0+XG4gICAgbW9kZVN0cmluZyA9IF8uaHVtYW5pemVFdmVudE5hbWUobW9kZSlcbiAgICBtb2RlU3RyaW5nICs9IFwiIFwiICsgXy5odW1hbml6ZUV2ZW50TmFtZShzdWJtb2RlKSBpZiBzdWJtb2RlP1xuICAgIG1vZGVTdHJpbmdcblxuICBhdHRhY2g6IC0+XG4gICAgQHRpbGUgPSBAc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZShpdGVtOiBAY29udGFpbmVyLCBwcmlvcml0eTogMjApXG5cbiAgZGV0YWNoOiAtPlxuICAgIEB0aWxlLmRlc3Ryb3koKVxuIl19
