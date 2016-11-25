(function() {
  var REGISTERS, RegisterManager, settings,
    slice = [].slice;

  settings = require('./settings');

  REGISTERS = /(?:[a-zA-Z*+%_".])/;

  RegisterManager = (function() {
    function RegisterManager(vimState) {
      var ref;
      this.vimState = vimState;
      ref = this.vimState, this.editor = ref.editor, this.editorElement = ref.editorElement, this.globalState = ref.globalState;
      this.data = this.globalState.get('register');
      this.subscriptionBySelection = new Map;
      this.clipboardBySelection = new Map;
    }

    RegisterManager.prototype.reset = function() {
      this.name = null;
      return this.vimState.toggleClassList('with-register', this.hasName());
    };

    RegisterManager.prototype.destroy = function() {
      var ref;
      this.subscriptionBySelection.forEach(function(disposable) {
        return disposable.dispose();
      });
      this.subscriptionBySelection.clear();
      this.clipboardBySelection.clear();
      return ref = {}, this.subscriptionBySelection = ref.subscriptionBySelection, this.clipboardBySelection = ref.clipboardBySelection, ref;
    };

    RegisterManager.prototype.isValidName = function(name) {
      return REGISTERS.test(name);
    };

    RegisterManager.prototype.getText = function(name, selection) {
      var ref;
      return (ref = this.get(name, selection).text) != null ? ref : '';
    };

    RegisterManager.prototype.readClipboard = function(selection) {
      if (selection == null) {
        selection = null;
      }
      if ((selection != null ? selection.editor.hasMultipleCursors() : void 0) && this.clipboardBySelection.has(selection)) {
        return this.clipboardBySelection.get(selection);
      } else {
        return atom.clipboard.read();
      }
    };

    RegisterManager.prototype.writeClipboard = function(selection, text) {
      var disposable;
      if (selection == null) {
        selection = null;
      }
      if ((selection != null ? selection.editor.hasMultipleCursors() : void 0) && !this.clipboardBySelection.has(selection)) {
        disposable = selection.onDidDestroy((function(_this) {
          return function() {
            _this.subscriptionBySelection["delete"](selection);
            return _this.clipboardBySelection["delete"](selection);
          };
        })(this));
        this.subscriptionBySelection.set(selection, disposable);
      }
      if ((selection === null) || selection.isLastSelection()) {
        atom.clipboard.write(text);
      }
      if (selection != null) {
        return this.clipboardBySelection.set(selection, text);
      }
    };

    RegisterManager.prototype.get = function(name, selection) {
      var ref, ref1, text, type;
      if (name == null) {
        name = this.getName();
      }
      if (name === '"') {
        name = settings.get('defaultRegister');
      }
      switch (name) {
        case '*':
        case '+':
          text = this.readClipboard(selection);
          break;
        case '%':
          text = this.editor.getURI();
          break;
        case '_':
          text = '';
          break;
        default:
          ref1 = (ref = this.data[name.toLowerCase()]) != null ? ref : {}, text = ref1.text, type = ref1.type;
      }
      if (type == null) {
        type = this.getCopyType(text != null ? text : '');
      }
      return {
        text: text,
        type: type
      };
    };

    RegisterManager.prototype.set = function() {
      var args, name, ref, selection, value;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      ref = [], name = ref[0], value = ref[1];
      switch (args.length) {
        case 1:
          value = args[0];
          break;
        case 2:
          name = args[0], value = args[1];
      }
      if (name == null) {
        name = this.getName();
      }
      if (!this.isValidName(name)) {
        return;
      }
      if (name === '"') {
        name = settings.get('defaultRegister');
      }
      if (value.type == null) {
        value.type = this.getCopyType(value.text);
      }
      selection = value.selection;
      delete value.selection;
      switch (name) {
        case '*':
        case '+':
          return this.writeClipboard(selection, value.text);
        case '_':
        case '%':
          return null;
        default:
          if (/^[A-Z]$/.test(name)) {
            return this.append(name.toLowerCase(), value);
          } else {
            return this.data[name] = value;
          }
      }
    };

    RegisterManager.prototype.append = function(name, value) {
      var register;
      if (!(register = this.data[name])) {
        this.data[name] = value;
        return;
      }
      if ('linewise' === register.type || 'linewise' === value.type) {
        if (register.type !== 'linewise') {
          register.text += '\n';
          register.type = 'linewise';
        }
        if (value.type !== 'linewise') {
          value.text += '\n';
        }
      }
      return register.text += value.text;
    };

    RegisterManager.prototype.getName = function() {
      var ref;
      return (ref = this.name) != null ? ref : settings.get('defaultRegister');
    };

    RegisterManager.prototype.isDefaultName = function() {
      return this.getName() === settings.get('defaultRegister');
    };

    RegisterManager.prototype.hasName = function() {
      return this.name != null;
    };

    RegisterManager.prototype.setName = function(name) {
      if (name == null) {
        name = null;
      }
      if (name != null) {
        if (this.isValidName(name)) {
          return this.name = name;
        }
      } else {
        this.vimState.hover.add('"');
        this.vimState.onDidConfirmInput((function(_this) {
          return function(name1) {
            _this.name = name1;
            _this.vimState.toggleClassList('with-register', _this.hasName());
            return _this.vimState.hover.add(_this.name);
          };
        })(this));
        this.vimState.onDidCancelInput((function(_this) {
          return function() {
            return _this.vimState.hover.reset();
          };
        })(this));
        return this.vimState.input.focus(1);
      }
    };

    RegisterManager.prototype.getCopyType = function(text) {
      if (text.lastIndexOf("\n") === text.length - 1) {
        return 'linewise';
      } else if (text.lastIndexOf("\r") === text.length - 1) {
        return 'linewise';
      } else {
        return 'character';
      }
    };

    return RegisterManager;

  })();

  module.exports = RegisterManager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvcmVnaXN0ZXItbWFuYWdlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG9DQUFBO0lBQUE7O0VBQUEsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUVYLFNBQUEsR0FBWTs7RUFpQk47SUFDUyx5QkFBQyxRQUFEO0FBQ1gsVUFBQTtNQURZLElBQUMsQ0FBQSxXQUFEO01BQ1osTUFBMEMsSUFBQyxDQUFBLFFBQTNDLEVBQUMsSUFBQyxDQUFBLGFBQUEsTUFBRixFQUFVLElBQUMsQ0FBQSxvQkFBQSxhQUFYLEVBQTBCLElBQUMsQ0FBQSxrQkFBQTtNQUMzQixJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixVQUFqQjtNQUNSLElBQUMsQ0FBQSx1QkFBRCxHQUEyQixJQUFJO01BQy9CLElBQUMsQ0FBQSxvQkFBRCxHQUF3QixJQUFJO0lBSmpCOzs4QkFNYixLQUFBLEdBQU8sU0FBQTtNQUNMLElBQUMsQ0FBQSxJQUFELEdBQVE7YUFDUixJQUFDLENBQUEsUUFBUSxDQUFDLGVBQVYsQ0FBMEIsZUFBMUIsRUFBMkMsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUEzQztJQUZLOzs4QkFJUCxPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7TUFBQSxJQUFDLENBQUEsdUJBQXVCLENBQUMsT0FBekIsQ0FBaUMsU0FBQyxVQUFEO2VBQy9CLFVBQVUsQ0FBQyxPQUFYLENBQUE7TUFEK0IsQ0FBakM7TUFFQSxJQUFDLENBQUEsdUJBQXVCLENBQUMsS0FBekIsQ0FBQTtNQUNBLElBQUMsQ0FBQSxvQkFBb0IsQ0FBQyxLQUF0QixDQUFBO2FBQ0EsTUFBb0QsRUFBcEQsRUFBQyxJQUFDLENBQUEsOEJBQUEsdUJBQUYsRUFBMkIsSUFBQyxDQUFBLDJCQUFBLG9CQUE1QixF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SUFBakIsQ0FBQSxLQUEwQixJQUFJLENBQUMsTUFBTCxHQUFjLENBQTNDO2VBQ0UsV0FERjtPQUFBLE1BRUssSUFBRyxJQUFJLENBQUMsV0FBTCxDQUFpQixJQUFqQixDQUFBLEtBQTBCLElBQUksQ0FBQyxNQUFMLEdBQWMsQ0FBM0M7ZUFDSCxXQURHO09BQUEsTUFBQTtlQUlILFlBSkc7O0lBSE07Ozs7OztFQVNmLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBbkpqQiIsInNvdXJjZXNDb250ZW50IjpbInNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcblxuUkVHSVNURVJTID0gLy8vIChcbiAgPzogW2EtekEtWiorJV9cIi5dXG4pIC8vL1xuXG4jIFRPRE86IFZpbSBzdXBwb3J0IGZvbGxvd2luZyByZWdpc3RlcnMuXG4jIHg6IGNvbXBsZXRlLCAtOiBwYXJ0aWFsbHlcbiMgIFt4XSAxLiBUaGUgdW5uYW1lZCByZWdpc3RlciBcIlwiXG4jICBbIF0gMi4gMTAgbnVtYmVyZWQgcmVnaXN0ZXJzIFwiMCB0byBcIjlcbiMgIFsgXSAzLiBUaGUgc21hbGwgZGVsZXRlIHJlZ2lzdGVyIFwiLVxuIyAgW3hdIDQuIDI2IG5hbWVkIHJlZ2lzdGVycyBcImEgdG8gXCJ6IG9yIFwiQSB0byBcIlpcbiMgIFstXSA1LiB0aHJlZSByZWFkLW9ubHkgcmVnaXN0ZXJzIFwiOiwgXCIuLCBcIiVcbiMgIFsgXSA2LiBhbHRlcm5hdGUgYnVmZmVyIHJlZ2lzdGVyIFwiI1xuIyAgWyBdIDcuIHRoZSBleHByZXNzaW9uIHJlZ2lzdGVyIFwiPVxuIyAgWyBdIDguIFRoZSBzZWxlY3Rpb24gYW5kIGRyb3AgcmVnaXN0ZXJzIFwiKiwgXCIrIGFuZCBcIn5cbiMgIFt4XSA5LiBUaGUgYmxhY2sgaG9sZSByZWdpc3RlciBcIl9cbiMgIFsgXSAxMC4gTGFzdCBzZWFyY2ggcGF0dGVybiByZWdpc3RlciBcIi9cblxuY2xhc3MgUmVnaXN0ZXJNYW5hZ2VyXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yLCBAZWRpdG9yRWxlbWVudCwgQGdsb2JhbFN0YXRlfSA9IEB2aW1TdGF0ZVxuICAgIEBkYXRhID0gQGdsb2JhbFN0YXRlLmdldCgncmVnaXN0ZXInKVxuICAgIEBzdWJzY3JpcHRpb25CeVNlbGVjdGlvbiA9IG5ldyBNYXBcbiAgICBAY2xpcGJvYXJkQnlTZWxlY3Rpb24gPSBuZXcgTWFwXG5cbiAgcmVzZXQ6IC0+XG4gICAgQG5hbWUgPSBudWxsXG4gICAgQHZpbVN0YXRlLnRvZ2dsZUNsYXNzTGlzdCgnd2l0aC1yZWdpc3RlcicsIEBoYXNOYW1lKCkpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAc3Vic2NyaXB0aW9uQnlTZWxlY3Rpb24uZm9yRWFjaCAoZGlzcG9zYWJsZSkgLT5cbiAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgQHN1YnNjcmlwdGlvbkJ5U2VsZWN0aW9uLmNsZWFyKClcbiAgICBAY2xpcGJvYXJkQnlTZWxlY3Rpb24uY2xlYXIoKVxuICAgIHtAc3Vic2NyaXB0aW9uQnlTZWxlY3Rpb24sIEBjbGlwYm9hcmRCeVNlbGVjdGlvbn0gPSB7fVxuXG4gIGlzVmFsaWROYW1lOiAobmFtZSkgLT5cbiAgICBSRUdJU1RFUlMudGVzdChuYW1lKVxuXG4gIGdldFRleHQ6IChuYW1lLCBzZWxlY3Rpb24pIC0+XG4gICAgQGdldChuYW1lLCBzZWxlY3Rpb24pLnRleHQgPyAnJ1xuXG4gIHJlYWRDbGlwYm9hcmQ6IChzZWxlY3Rpb249bnVsbCkgLT5cbiAgICBpZiBzZWxlY3Rpb24/LmVkaXRvci5oYXNNdWx0aXBsZUN1cnNvcnMoKSBhbmQgQGNsaXBib2FyZEJ5U2VsZWN0aW9uLmhhcyhzZWxlY3Rpb24pXG4gICAgICBAY2xpcGJvYXJkQnlTZWxlY3Rpb24uZ2V0KHNlbGVjdGlvbilcbiAgICBlbHNlXG4gICAgICBhdG9tLmNsaXBib2FyZC5yZWFkKClcblxuICB3cml0ZUNsaXBib2FyZDogKHNlbGVjdGlvbj1udWxsLCB0ZXh0KSAtPlxuICAgIGlmIHNlbGVjdGlvbj8uZWRpdG9yLmhhc011bHRpcGxlQ3Vyc29ycygpIGFuZCBub3QgQGNsaXBib2FyZEJ5U2VsZWN0aW9uLmhhcyhzZWxlY3Rpb24pXG4gICAgICBkaXNwb3NhYmxlID0gc2VsZWN0aW9uLm9uRGlkRGVzdHJveSA9PlxuICAgICAgICBAc3Vic2NyaXB0aW9uQnlTZWxlY3Rpb24uZGVsZXRlKHNlbGVjdGlvbilcbiAgICAgICAgQGNsaXBib2FyZEJ5U2VsZWN0aW9uLmRlbGV0ZShzZWxlY3Rpb24pXG4gICAgICBAc3Vic2NyaXB0aW9uQnlTZWxlY3Rpb24uc2V0KHNlbGVjdGlvbiwgZGlzcG9zYWJsZSlcblxuICAgIGlmIChzZWxlY3Rpb24gaXMgbnVsbCkgb3Igc2VsZWN0aW9uLmlzTGFzdFNlbGVjdGlvbigpXG4gICAgICBhdG9tLmNsaXBib2FyZC53cml0ZSh0ZXh0KVxuICAgIEBjbGlwYm9hcmRCeVNlbGVjdGlvbi5zZXQoc2VsZWN0aW9uLCB0ZXh0KSBpZiBzZWxlY3Rpb24/XG5cbiAgZ2V0OiAobmFtZSwgc2VsZWN0aW9uKSAtPlxuICAgIG5hbWUgPz0gQGdldE5hbWUoKVxuICAgIG5hbWUgPSBzZXR0aW5ncy5nZXQoJ2RlZmF1bHRSZWdpc3RlcicpIGlmIG5hbWUgaXMgJ1wiJ1xuXG4gICAgc3dpdGNoIG5hbWVcbiAgICAgIHdoZW4gJyonLCAnKycgdGhlbiB0ZXh0ID0gQHJlYWRDbGlwYm9hcmQoc2VsZWN0aW9uKVxuICAgICAgd2hlbiAnJScgdGhlbiB0ZXh0ID0gQGVkaXRvci5nZXRVUkkoKVxuICAgICAgd2hlbiAnXycgdGhlbiB0ZXh0ID0gJycgIyBCbGFja2hvbGUgYWx3YXlzIHJldHVybnMgbm90aGluZ1xuICAgICAgZWxzZVxuICAgICAgICB7dGV4dCwgdHlwZX0gPSBAZGF0YVtuYW1lLnRvTG93ZXJDYXNlKCldID8ge31cbiAgICB0eXBlID89IEBnZXRDb3B5VHlwZSh0ZXh0ID8gJycpXG4gICAge3RleHQsIHR5cGV9XG5cbiAgIyBQcml2YXRlOiBTZXRzIHRoZSB2YWx1ZSBvZiBhIGdpdmVuIHJlZ2lzdGVyLlxuICAjXG4gICMgbmFtZSAgLSBUaGUgbmFtZSBvZiB0aGUgcmVnaXN0ZXIgdG8gZmV0Y2guXG4gICMgdmFsdWUgLSBUaGUgdmFsdWUgdG8gc2V0IHRoZSByZWdpc3RlciB0bywgd2l0aCBmb2xsb3dpbmcgcHJvcGVydGllcy5cbiAgIyAgdGV4dDogdGV4dCB0byBzYXZlIHRvIHJlZ2lzdGVyLlxuICAjICB0eXBlOiAob3B0aW9uYWwpIGlmIG9tbWl0ZWQgYXV0b21hdGljYWxseSBzZXQgZnJvbSB0ZXh0LlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBzZXQ6IChhcmdzLi4uKSAtPlxuICAgIFtuYW1lLCB2YWx1ZV0gPSBbXVxuICAgIHN3aXRjaCBhcmdzLmxlbmd0aFxuICAgICAgd2hlbiAxIHRoZW4gW3ZhbHVlXSA9IGFyZ3NcbiAgICAgIHdoZW4gMiB0aGVuIFtuYW1lLCB2YWx1ZV0gPSBhcmdzXG5cbiAgICBuYW1lID89IEBnZXROYW1lKClcbiAgICByZXR1cm4gdW5sZXNzIEBpc1ZhbGlkTmFtZShuYW1lKVxuICAgIG5hbWUgPSBzZXR0aW5ncy5nZXQoJ2RlZmF1bHRSZWdpc3RlcicpIGlmIG5hbWUgaXMgJ1wiJ1xuICAgIHZhbHVlLnR5cGUgPz0gQGdldENvcHlUeXBlKHZhbHVlLnRleHQpXG5cbiAgICBzZWxlY3Rpb24gPSB2YWx1ZS5zZWxlY3Rpb25cbiAgICBkZWxldGUgdmFsdWUuc2VsZWN0aW9uXG4gICAgc3dpdGNoIG5hbWVcbiAgICAgIHdoZW4gJyonLCAnKycgdGhlbiBAd3JpdGVDbGlwYm9hcmQoc2VsZWN0aW9uLCB2YWx1ZS50ZXh0KVxuICAgICAgd2hlbiAnXycsICclJyB0aGVuIG51bGxcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgL15bQS1aXSQvLnRlc3QobmFtZSlcbiAgICAgICAgICBAYXBwZW5kKG5hbWUudG9Mb3dlckNhc2UoKSwgdmFsdWUpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAZGF0YVtuYW1lXSA9IHZhbHVlXG5cbiAgIyBQcml2YXRlOiBhcHBlbmQgYSB2YWx1ZSBpbnRvIGEgZ2l2ZW4gcmVnaXN0ZXJcbiAgIyBsaWtlIHNldFJlZ2lzdGVyLCBidXQgYXBwZW5kcyB0aGUgdmFsdWVcbiAgYXBwZW5kOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgdW5sZXNzIHJlZ2lzdGVyID0gQGRhdGFbbmFtZV1cbiAgICAgIEBkYXRhW25hbWVdID0gdmFsdWVcbiAgICAgIHJldHVyblxuXG4gICAgaWYgJ2xpbmV3aXNlJyBpbiBbcmVnaXN0ZXIudHlwZSwgdmFsdWUudHlwZV1cbiAgICAgIGlmIHJlZ2lzdGVyLnR5cGUgaXNudCAnbGluZXdpc2UnXG4gICAgICAgIHJlZ2lzdGVyLnRleHQgKz0gJ1xcbidcbiAgICAgICAgcmVnaXN0ZXIudHlwZSA9ICdsaW5ld2lzZSdcbiAgICAgIGlmIHZhbHVlLnR5cGUgaXNudCAnbGluZXdpc2UnXG4gICAgICAgIHZhbHVlLnRleHQgKz0gJ1xcbidcbiAgICByZWdpc3Rlci50ZXh0ICs9IHZhbHVlLnRleHRcblxuICBnZXROYW1lOiAtPlxuICAgIEBuYW1lID8gc2V0dGluZ3MuZ2V0KCdkZWZhdWx0UmVnaXN0ZXInKVxuXG4gIGlzRGVmYXVsdE5hbWU6IC0+XG4gICAgQGdldE5hbWUoKSBpcyBzZXR0aW5ncy5nZXQoJ2RlZmF1bHRSZWdpc3RlcicpXG5cbiAgaGFzTmFtZTogLT5cbiAgICBAbmFtZT9cblxuICBzZXROYW1lOiAobmFtZT1udWxsKSAtPlxuICAgIGlmIG5hbWU/XG4gICAgICBAbmFtZSA9IG5hbWUgaWYgQGlzVmFsaWROYW1lKG5hbWUpXG4gICAgZWxzZVxuICAgICAgQHZpbVN0YXRlLmhvdmVyLmFkZCAnXCInXG4gICAgICBAdmltU3RhdGUub25EaWRDb25maXJtSW5wdXQgKEBuYW1lKSA9PlxuICAgICAgICBAdmltU3RhdGUudG9nZ2xlQ2xhc3NMaXN0KCd3aXRoLXJlZ2lzdGVyJywgQGhhc05hbWUoKSlcbiAgICAgICAgQHZpbVN0YXRlLmhvdmVyLmFkZChAbmFtZSlcbiAgICAgIEB2aW1TdGF0ZS5vbkRpZENhbmNlbElucHV0ID0+IEB2aW1TdGF0ZS5ob3Zlci5yZXNldCgpXG4gICAgICBAdmltU3RhdGUuaW5wdXQuZm9jdXMoMSlcblxuICBnZXRDb3B5VHlwZTogKHRleHQpIC0+XG4gICAgaWYgdGV4dC5sYXN0SW5kZXhPZihcIlxcblwiKSBpcyB0ZXh0Lmxlbmd0aCAtIDFcbiAgICAgICdsaW5ld2lzZSdcbiAgICBlbHNlIGlmIHRleHQubGFzdEluZGV4T2YoXCJcXHJcIikgaXMgdGV4dC5sZW5ndGggLSAxXG4gICAgICAnbGluZXdpc2UnXG4gICAgZWxzZVxuICAgICAgIyBbRklYTUVdIHNob3VsZCBjaGFyYWN0ZXJ3aXNlIG9yIGxpbmUgYW5kIGNoYXJhY3RlclxuICAgICAgJ2NoYXJhY3RlcidcblxubW9kdWxlLmV4cG9ydHMgPSBSZWdpc3Rlck1hbmFnZXJcbiJdfQ==
