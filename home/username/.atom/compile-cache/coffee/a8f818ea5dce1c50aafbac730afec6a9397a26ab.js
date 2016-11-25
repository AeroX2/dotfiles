(function() {
  var CompositeDisposable, Emitter, getEditorState, ref;

  ref = require('atom'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  getEditorState = null;

  module.exports = {
    activate: function() {
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      return this.subscriptions.add(atom.commands.add('atom-text-editor:not([mini])', {
        'vim-mode-plus-ex-mode:open': (function(_this) {
          return function() {
            return _this.toggle('normalCommands');
          };
        })(this),
        'vim-mode-plus-ex-mode:toggle-setting': (function(_this) {
          return function() {
            return _this.toggle('toggleCommands');
          };
        })(this)
      }));
    },
    toggle: function(commandKind) {
      var editor;
      editor = atom.workspace.getActiveTextEditor();
      return this.getEditorState(editor).then((function(_this) {
        return function(vimState) {
          return _this.getView().toggle(vimState, commandKind);
        };
      })(this));
    },
    getEditorState: function(editor) {
      if (getEditorState != null) {
        return Promise.resolve(getEditorState(editor));
      } else {
        return new Promise((function(_this) {
          return function(resolve) {
            return _this.onDidConsumeVim(function() {
              return resolve(getEditorState(editor));
            });
          };
        })(this));
      }
    },
    deactivate: function() {
      var ref1, ref2;
      this.subscriptions.dispose();
      if ((ref1 = this.view) != null) {
        if (typeof ref1.destroy === "function") {
          ref1.destroy();
        }
      }
      return ref2 = {}, this.subscriptions = ref2.subscriptions, this.view = ref2.view, ref2;
    },
    getView: function() {
      return this.view != null ? this.view : this.view = new (require('./view'));
    },
    onDidConsumeVim: function(fn) {
      return this.emitter.on('did-consume-vim', fn);
    },
    consumeVim: function(service) {
      getEditorState = service.getEditorState;
      return this.emitter.emit('did-consume-vim');
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy1leC1tb2RlL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBaUMsT0FBQSxDQUFRLE1BQVIsQ0FBakMsRUFBQyxxQkFBRCxFQUFVOztFQUNWLGNBQUEsR0FBaUI7O0VBRWpCLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTtNQUNSLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7YUFDckIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQiw4QkFBbEIsRUFDakI7UUFBQSw0QkFBQSxFQUE4QixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxNQUFELENBQVEsZ0JBQVI7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUI7UUFDQSxzQ0FBQSxFQUF3QyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxNQUFELENBQVEsZ0JBQVI7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FEeEM7T0FEaUIsQ0FBbkI7SUFIUSxDQUFWO0lBT0EsTUFBQSxFQUFRLFNBQUMsV0FBRDtBQUNOLFVBQUE7TUFBQSxNQUFBLEdBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBO2FBQ1QsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBdUIsQ0FBQyxJQUF4QixDQUE2QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsUUFBRDtpQkFDM0IsS0FBQyxDQUFBLE9BQUQsQ0FBQSxDQUFVLENBQUMsTUFBWCxDQUFrQixRQUFsQixFQUE0QixXQUE1QjtRQUQyQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0I7SUFGTSxDQVBSO0lBWUEsY0FBQSxFQUFnQixTQUFDLE1BQUQ7TUFDZCxJQUFHLHNCQUFIO2VBQ0UsT0FBTyxDQUFDLE9BQVIsQ0FBZ0IsY0FBQSxDQUFlLE1BQWYsQ0FBaEIsRUFERjtPQUFBLE1BQUE7ZUFHTSxJQUFBLE9BQUEsQ0FBUSxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLE9BQUQ7bUJBQ1YsS0FBQyxDQUFBLGVBQUQsQ0FBaUIsU0FBQTtxQkFDZixPQUFBLENBQVEsY0FBQSxDQUFlLE1BQWYsQ0FBUjtZQURlLENBQWpCO1VBRFU7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVIsRUFITjs7SUFEYyxDQVpoQjtJQW9CQSxVQUFBLEVBQVksU0FBQTtBQUNWLFVBQUE7TUFBQSxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTs7O2NBQ0ssQ0FBRTs7O2FBQ1AsT0FBMEIsRUFBMUIsRUFBQyxJQUFDLENBQUEscUJBQUEsYUFBRixFQUFpQixJQUFDLENBQUEsWUFBQSxJQUFsQixFQUFBO0lBSFUsQ0FwQlo7SUF5QkEsT0FBQSxFQUFTLFNBQUE7aUNBQ1AsSUFBQyxDQUFBLE9BQUQsSUFBQyxDQUFBLE9BQVEsSUFBSSxDQUFDLE9BQUEsQ0FBUSxRQUFSLENBQUQ7SUFETixDQXpCVDtJQTRCQSxlQUFBLEVBQWlCLFNBQUMsRUFBRDthQUNmLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLGlCQUFaLEVBQStCLEVBQS9CO0lBRGUsQ0E1QmpCO0lBK0JBLFVBQUEsRUFBWSxTQUFDLE9BQUQ7TUFDVCxpQkFBa0I7YUFDbkIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsaUJBQWQ7SUFGVSxDQS9CWjs7QUFKRiIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5nZXRFZGl0b3JTdGF0ZSA9IG51bGxcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcjpub3QoW21pbmldKScsXG4gICAgICAndmltLW1vZGUtcGx1cy1leC1tb2RlOm9wZW4nOiA9PiBAdG9nZ2xlKCdub3JtYWxDb21tYW5kcycpXG4gICAgICAndmltLW1vZGUtcGx1cy1leC1tb2RlOnRvZ2dsZS1zZXR0aW5nJzogPT4gQHRvZ2dsZSgndG9nZ2xlQ29tbWFuZHMnKVxuXG4gIHRvZ2dsZTogKGNvbW1hbmRLaW5kKSAtPlxuICAgIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIEBnZXRFZGl0b3JTdGF0ZShlZGl0b3IpLnRoZW4gKHZpbVN0YXRlKSA9PlxuICAgICAgQGdldFZpZXcoKS50b2dnbGUodmltU3RhdGUsIGNvbW1hbmRLaW5kKVxuXG4gIGdldEVkaXRvclN0YXRlOiAoZWRpdG9yKSAtPlxuICAgIGlmIGdldEVkaXRvclN0YXRlP1xuICAgICAgUHJvbWlzZS5yZXNvbHZlKGdldEVkaXRvclN0YXRlKGVkaXRvcikpXG4gICAgZWxzZVxuICAgICAgbmV3IFByb21pc2UgKHJlc29sdmUpID0+XG4gICAgICAgIEBvbkRpZENvbnN1bWVWaW0gLT5cbiAgICAgICAgICByZXNvbHZlKGdldEVkaXRvclN0YXRlKGVkaXRvcikpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICBAdmlldz8uZGVzdHJveT8oKVxuICAgIHtAc3Vic2NyaXB0aW9ucywgQHZpZXd9ID0ge31cblxuICBnZXRWaWV3OiAtPlxuICAgIEB2aWV3ID89IG5ldyAocmVxdWlyZSgnLi92aWV3JykpXG5cbiAgb25EaWRDb25zdW1lVmltOiAoZm4pIC0+XG4gICAgQGVtaXR0ZXIub24oJ2RpZC1jb25zdW1lLXZpbScsIGZuKVxuXG4gIGNvbnN1bWVWaW06IChzZXJ2aWNlKSAtPlxuICAgIHtnZXRFZGl0b3JTdGF0ZX0gPSBzZXJ2aWNlXG4gICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWNvbnN1bWUtdmltJylcbiJdfQ==
