(function() {
  var CompositeDisposable, Emitter, Input, ref;

  ref = require('atom'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  module.exports = Input = (function() {
    Input.prototype.onDidChange = function(fn) {
      return this.emitter.on('did-change', fn);
    };

    Input.prototype.onDidConfirm = function(fn) {
      return this.emitter.on('did-confirm', fn);
    };

    Input.prototype.onDidCancel = function(fn) {
      return this.emitter.on('did-cancel', fn);
    };

    function Input(vimState) {
      this.vimState = vimState;
      this.editorElement = this.vimState.editorElement;
      this.vimState.onDidFailToSetTarget((function(_this) {
        return function() {
          return _this.cancel();
        };
      })(this));
      this.emitter = new Emitter;
    }

    Input.prototype.destroy = function() {
      var ref1;
      return ref1 = {}, this.vimState = ref1.vimState, ref1;
    };

    Input.prototype.focus = function(charsMax) {
      var chars;
      if (charsMax == null) {
        charsMax = 1;
      }
      chars = [];
      this.disposables = new CompositeDisposable();
      this.disposables.add(this.vimState.swapClassName("vim-mode-plus-input-char-waiting", "is-focused"));
      this.disposables.add(this.vimState.onDidSetInputChar((function(_this) {
        return function(char) {
          var text;
          if (charsMax === 1) {
            return _this.confirm(char);
          } else {
            chars.push(char);
            text = chars.join('');
            _this.emitter.emit('did-change', text);
            if (chars.length >= charsMax) {
              return _this.confirm(text);
            }
          }
        };
      })(this)));
      return this.disposables.add(atom.commands.add(this.editorElement, {
        'core:cancel': (function(_this) {
          return function(event) {
            event.stopImmediatePropagation();
            return _this.cancel();
          };
        })(this),
        'core:confirm': (function(_this) {
          return function(event) {
            event.stopImmediatePropagation();
            return _this.confirm(chars.join(''));
          };
        })(this)
      }));
    };

    Input.prototype.confirm = function(char) {
      var ref1;
      if ((ref1 = this.disposables) != null) {
        ref1.dispose();
      }
      return this.emitter.emit('did-confirm', char);
    };

    Input.prototype.cancel = function() {
      var ref1;
      if ((ref1 = this.disposables) != null) {
        ref1.dispose();
      }
      return this.emitter.emit('did-cancel');
    };

    return Input;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvaW5wdXQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFpQyxPQUFBLENBQVEsTUFBUixDQUFqQyxFQUFDLHFCQUFELEVBQVU7O0VBRVYsTUFBTSxDQUFDLE9BQVAsR0FDTTtvQkFDSixXQUFBLEdBQWEsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksWUFBWixFQUEwQixFQUExQjtJQUFSOztvQkFDYixZQUFBLEdBQWMsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksYUFBWixFQUEyQixFQUEzQjtJQUFSOztvQkFDZCxXQUFBLEdBQWEsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksWUFBWixFQUEwQixFQUExQjtJQUFSOztJQUVBLGVBQUMsUUFBRDtNQUFDLElBQUMsQ0FBQSxXQUFEO01BQ1gsSUFBQyxDQUFBLGdCQUFpQixJQUFDLENBQUEsU0FBbEI7TUFDRixJQUFDLENBQUEsUUFBUSxDQUFDLG9CQUFWLENBQStCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDN0IsS0FBQyxDQUFBLE1BQUQsQ0FBQTtRQUQ2QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBL0I7TUFFQSxJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7SUFKSjs7b0JBTWIsT0FBQSxHQUFTLFNBQUE7QUFDUCxVQUFBO2FBQUEsT0FBYyxFQUFkLEVBQUMsSUFBQyxDQUFBLGdCQUFBLFFBQUYsRUFBQTtJQURPOztvQkFHVCxLQUFBLEdBQU8sU0FBQyxRQUFEO0FBQ0wsVUFBQTs7UUFETSxXQUFTOztNQUNmLEtBQUEsR0FBUTtNQUVSLElBQUMsQ0FBQSxXQUFELEdBQW1CLElBQUEsbUJBQUEsQ0FBQTtNQUNuQixJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxhQUFWLENBQXdCLGtDQUF4QixFQUE2RCxZQUE3RCxDQUFqQjtNQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsUUFBUSxDQUFDLGlCQUFWLENBQTRCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxJQUFEO0FBQzNDLGNBQUE7VUFBQSxJQUFHLFFBQUEsS0FBWSxDQUFmO21CQUNFLEtBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxFQURGO1dBQUEsTUFBQTtZQUdFLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWDtZQUNBLElBQUEsR0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLEVBQVg7WUFDUCxLQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxZQUFkLEVBQTRCLElBQTVCO1lBQ0EsSUFBRyxLQUFLLENBQUMsTUFBTixJQUFnQixRQUFuQjtxQkFDRSxLQUFDLENBQUEsT0FBRCxDQUFTLElBQVQsRUFERjthQU5GOztRQUQyQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBNUIsQ0FBakI7YUFVQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLElBQUMsQ0FBQSxhQUFuQixFQUNmO1FBQUEsYUFBQSxFQUFlLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsS0FBRDtZQUNiLEtBQUssQ0FBQyx3QkFBTixDQUFBO21CQUNBLEtBQUMsQ0FBQSxNQUFELENBQUE7VUFGYTtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBZjtRQUdBLGNBQUEsRUFBZ0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxLQUFEO1lBQ2QsS0FBSyxDQUFDLHdCQUFOLENBQUE7bUJBQ0EsS0FBQyxDQUFBLE9BQUQsQ0FBUyxLQUFLLENBQUMsSUFBTixDQUFXLEVBQVgsQ0FBVDtVQUZjO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUhoQjtPQURlLENBQWpCO0lBZks7O29CQXVCUCxPQUFBLEdBQVMsU0FBQyxJQUFEO0FBQ1AsVUFBQTs7WUFBWSxDQUFFLE9BQWQsQ0FBQTs7YUFDQSxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxhQUFkLEVBQTZCLElBQTdCO0lBRk87O29CQUlULE1BQUEsR0FBUSxTQUFBO0FBQ04sVUFBQTs7WUFBWSxDQUFFLE9BQWQsQ0FBQTs7YUFDQSxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxZQUFkO0lBRk07Ozs7O0FBNUNWIiwic291cmNlc0NvbnRlbnQiOlsie0VtaXR0ZXIsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgSW5wdXRcbiAgb25EaWRDaGFuZ2U6IChmbikgLT4gQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UnLCBmblxuICBvbkRpZENvbmZpcm06IChmbikgLT4gQGVtaXR0ZXIub24gJ2RpZC1jb25maXJtJywgZm5cbiAgb25EaWRDYW5jZWw6IChmbikgLT4gQGVtaXR0ZXIub24gJ2RpZC1jYW5jZWwnLCBmblxuXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yRWxlbWVudH0gPSBAdmltU3RhdGVcbiAgICBAdmltU3RhdGUub25EaWRGYWlsVG9TZXRUYXJnZXQgPT5cbiAgICAgIEBjYW5jZWwoKVxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcblxuICBkZXN0cm95OiAtPlxuICAgIHtAdmltU3RhdGV9ID0ge31cblxuICBmb2N1czogKGNoYXJzTWF4PTEpIC0+XG4gICAgY2hhcnMgPSBbXVxuXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHZpbVN0YXRlLnN3YXBDbGFzc05hbWUoXCJ2aW0tbW9kZS1wbHVzLWlucHV0LWNoYXItd2FpdGluZ1wiLCAgXCJpcy1mb2N1c2VkXCIpXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAdmltU3RhdGUub25EaWRTZXRJbnB1dENoYXIgKGNoYXIpID0+XG4gICAgICBpZiBjaGFyc01heCBpcyAxXG4gICAgICAgIEBjb25maXJtKGNoYXIpXG4gICAgICBlbHNlXG4gICAgICAgIGNoYXJzLnB1c2goY2hhcilcbiAgICAgICAgdGV4dCA9IGNoYXJzLmpvaW4oJycpXG4gICAgICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1jaGFuZ2UnLCB0ZXh0KVxuICAgICAgICBpZiBjaGFycy5sZW5ndGggPj0gY2hhcnNNYXhcbiAgICAgICAgICBAY29uZmlybSh0ZXh0KVxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCBAZWRpdG9yRWxlbWVudCxcbiAgICAgICdjb3JlOmNhbmNlbCc6IChldmVudCkgPT5cbiAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgQGNhbmNlbCgpXG4gICAgICAnY29yZTpjb25maXJtJzogKGV2ZW50KSA9PlxuICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgICBAY29uZmlybShjaGFycy5qb2luKCcnKSlcblxuICBjb25maXJtOiAoY2hhcikgLT5cbiAgICBAZGlzcG9zYWJsZXM/LmRpc3Bvc2UoKVxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1jb25maXJtJywgY2hhcilcblxuICBjYW5jZWw6IC0+XG4gICAgQGRpc3Bvc2FibGVzPy5kaXNwb3NlKClcbiAgICBAZW1pdHRlci5lbWl0KCdkaWQtY2FuY2VsJylcbiJdfQ==
