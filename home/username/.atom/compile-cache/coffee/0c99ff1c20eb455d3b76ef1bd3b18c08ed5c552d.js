(function() {
  var Emitter, GlobalState;

  Emitter = require('atom').Emitter;

  GlobalState = (function() {
    function GlobalState(state) {
      this.state = state;
      this.emitter = new Emitter;
      this.onDidChange((function(_this) {
        return function(arg) {
          var name, newValue;
          name = arg.name, newValue = arg.newValue;
          if (name === 'lastSearchPattern') {
            return _this.set('highlightSearchPattern', newValue);
          }
        };
      })(this));
    }

    GlobalState.prototype.get = function(name) {
      return this.state[name];
    };

    GlobalState.prototype.set = function(name, newValue) {
      var oldValue;
      oldValue = this.get(name);
      this.state[name] = newValue;
      return this.emitDidChange({
        name: name,
        oldValue: oldValue,
        newValue: newValue
      });
    };

    GlobalState.prototype.onDidChange = function(fn) {
      return this.emitter.on('did-change', fn);
    };

    GlobalState.prototype.emitDidChange = function(event) {
      return this.emitter.emit('did-change', event);
    };

    return GlobalState;

  })();

  module.exports = new GlobalState({
    searchHistory: [],
    currentSearch: null,
    lastSearchPattern: null,
    highlightSearchPattern: null,
    currentFind: null,
    register: {}
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvZ2xvYmFsLXN0YXRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsVUFBVyxPQUFBLENBQVEsTUFBUjs7RUFFTjtJQUNTLHFCQUFDLEtBQUQ7TUFBQyxJQUFDLENBQUEsUUFBRDtNQUNaLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUVmLElBQUMsQ0FBQSxXQUFELENBQWEsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFFWCxjQUFBO1VBRmEsaUJBQU07VUFFbkIsSUFBRyxJQUFBLEtBQVEsbUJBQVg7bUJBQ0UsS0FBQyxDQUFBLEdBQUQsQ0FBSyx3QkFBTCxFQUErQixRQUEvQixFQURGOztRQUZXO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFiO0lBSFc7OzBCQVFiLEdBQUEsR0FBSyxTQUFDLElBQUQ7YUFDSCxJQUFDLENBQUEsS0FBTSxDQUFBLElBQUE7SUFESjs7MEJBR0wsR0FBQSxHQUFLLFNBQUMsSUFBRCxFQUFPLFFBQVA7QUFDSCxVQUFBO01BQUEsUUFBQSxHQUFXLElBQUMsQ0FBQSxHQUFELENBQUssSUFBTDtNQUNYLElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBQSxDQUFQLEdBQWU7YUFDZixJQUFDLENBQUEsYUFBRCxDQUFlO1FBQUMsTUFBQSxJQUFEO1FBQU8sVUFBQSxRQUFQO1FBQWlCLFVBQUEsUUFBakI7T0FBZjtJQUhHOzswQkFLTCxXQUFBLEdBQWEsU0FBQyxFQUFEO2FBQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksWUFBWixFQUEwQixFQUExQjtJQURXOzswQkFHYixhQUFBLEdBQWUsU0FBQyxLQUFEO2FBQ2IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsWUFBZCxFQUE0QixLQUE1QjtJQURhOzs7Ozs7RUFHakIsTUFBTSxDQUFDLE9BQVAsR0FBcUIsSUFBQSxXQUFBLENBQ25CO0lBQUEsYUFBQSxFQUFlLEVBQWY7SUFDQSxhQUFBLEVBQWUsSUFEZjtJQUVBLGlCQUFBLEVBQW1CLElBRm5CO0lBR0Esc0JBQUEsRUFBd0IsSUFIeEI7SUFJQSxXQUFBLEVBQWEsSUFKYjtJQUtBLFFBQUEsRUFBVSxFQUxWO0dBRG1CO0FBekJyQiIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG5cbmNsYXNzIEdsb2JhbFN0YXRlXG4gIGNvbnN0cnVjdG9yOiAoQHN0YXRlKSAtPlxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcblxuICAgIEBvbkRpZENoYW5nZSAoe25hbWUsIG5ld1ZhbHVlfSkgPT5cbiAgICAgICMgYXV0byBzeW5jIHZhbHVlLCBidXQgaGlnaGxpZ2h0U2VhcmNoUGF0dGVybiBpcyBzb2xlbHkgY2xlYXJlZCB0byBjbGVhciBobHNlYXJjaC5cbiAgICAgIGlmIG5hbWUgaXMgJ2xhc3RTZWFyY2hQYXR0ZXJuJ1xuICAgICAgICBAc2V0KCdoaWdobGlnaHRTZWFyY2hQYXR0ZXJuJywgbmV3VmFsdWUpXG5cbiAgZ2V0OiAobmFtZSkgLT5cbiAgICBAc3RhdGVbbmFtZV1cblxuICBzZXQ6IChuYW1lLCBuZXdWYWx1ZSkgLT5cbiAgICBvbGRWYWx1ZSA9IEBnZXQobmFtZSlcbiAgICBAc3RhdGVbbmFtZV0gPSBuZXdWYWx1ZVxuICAgIEBlbWl0RGlkQ2hhbmdlKHtuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWV9KVxuXG4gIG9uRGlkQ2hhbmdlOiAoZm4pIC0+XG4gICAgQGVtaXR0ZXIub24oJ2RpZC1jaGFuZ2UnLCBmbilcblxuICBlbWl0RGlkQ2hhbmdlOiAoZXZlbnQpIC0+XG4gICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWNoYW5nZScsIGV2ZW50KVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBHbG9iYWxTdGF0ZVxuICBzZWFyY2hIaXN0b3J5OiBbXVxuICBjdXJyZW50U2VhcmNoOiBudWxsXG4gIGxhc3RTZWFyY2hQYXR0ZXJuOiBudWxsXG4gIGhpZ2hsaWdodFNlYXJjaFBhdHRlcm46IG51bGxcbiAgY3VycmVudEZpbmQ6IG51bGxcbiAgcmVnaXN0ZXI6IHt9XG4iXX0=
