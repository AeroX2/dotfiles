(function() {
  var CompositeDisposable, Disposable, Emitter, SearchInput, ref, registerElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Emitter = ref.Emitter, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  registerElement = require('./utils').registerElement;

  SearchInput = (function(superClass) {
    extend(SearchInput, superClass);

    function SearchInput() {
      return SearchInput.__super__.constructor.apply(this, arguments);
    }

    SearchInput.prototype.literalModeDeactivator = null;

    SearchInput.prototype.onDidChange = function(fn) {
      return this.emitter.on('did-change', fn);
    };

    SearchInput.prototype.onDidConfirm = function(fn) {
      return this.emitter.on('did-confirm', fn);
    };

    SearchInput.prototype.onDidCancel = function(fn) {
      return this.emitter.on('did-cancel', fn);
    };

    SearchInput.prototype.onDidCommand = function(fn) {
      return this.emitter.on('did-command', fn);
    };

    SearchInput.prototype.createdCallback = function() {
      var editorContainer, optionsContainer, ref1;
      this.className = "vim-mode-plus-search-container";
      this.emitter = new Emitter;
      this.innerHTML = "<div class='options-container'>\n  <span class='inline-block-tight btn btn-primary'>.*</span>\n</div>\n<div class='editor-container'>\n  <atom-text-editor mini class='editor vim-mode-plus-search'></atom-text-editor>\n</div>";
      ref1 = this.getElementsByTagName('div'), optionsContainer = ref1[0], editorContainer = ref1[1];
      this.regexSearchStatus = optionsContainer.firstElementChild;
      this.editorElement = editorContainer.firstElementChild;
      this.editor = this.editorElement.getModel();
      this.editor.setMini(true);
      this.editor.onDidChange((function(_this) {
        return function() {
          if (_this.finished) {
            return;
          }
          return _this.emitter.emit('did-change', _this.editor.getText());
        };
      })(this));
      this.panel = atom.workspace.addBottomPanel({
        item: this,
        visible: false
      });
      return this;
    };

    SearchInput.prototype.destroy = function() {
      var ref1, ref2;
      this.disposables.dispose();
      this.editor.destroy();
      if ((ref1 = this.panel) != null) {
        ref1.destroy();
      }
      ref2 = {}, this.editor = ref2.editor, this.panel = ref2.panel, this.editorElement = ref2.editorElement, this.vimState = ref2.vimState;
      return this.remove();
    };

    SearchInput.prototype.handleEvents = function() {
      return atom.commands.add(this.editorElement, {
        'core:confirm': (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        'core:cancel': (function(_this) {
          return function() {
            return _this.cancel();
          };
        })(this),
        'blur': (function(_this) {
          return function() {
            if (!_this.finished) {
              return _this.cancel();
            }
          };
        })(this),
        'vim-mode-plus:input-cancel': (function(_this) {
          return function() {
            return _this.cancel();
          };
        })(this)
      });
    };

    SearchInput.prototype.focus = function(options) {
      var disposable;
      this.options = options != null ? options : {};
      this.finished = false;
      if (this.options.backwards) {
        this.editorElement.classList.add('backwards');
      }
      this.panel.show();
      this.editorElement.focus();
      this.commandSubscriptions = this.handleEvents();
      return disposable = atom.workspace.onDidChangeActivePaneItem((function(_this) {
        return function() {
          disposable.dispose();
          if (!_this.finished) {
            return _this.cancel();
          }
        };
      })(this));
    };

    SearchInput.prototype.unfocus = function() {
      var ref1, ref2, ref3;
      this.editorElement.classList.remove('backwards');
      this.regexSearchStatus.classList.add('btn-primary');
      if ((ref1 = this.literalModeDeactivator) != null) {
        ref1.dispose();
      }
      if ((ref2 = this.commandSubscriptions) != null) {
        ref2.dispose();
      }
      this.finished = true;
      atom.workspace.getActivePane().activate();
      this.editor.setText('');
      return (ref3 = this.panel) != null ? ref3.hide() : void 0;
    };

    SearchInput.prototype.updateOptionSettings = function(arg) {
      var useRegexp;
      useRegexp = (arg != null ? arg : {}).useRegexp;
      return this.regexSearchStatus.classList.toggle('btn-primary', useRegexp);
    };

    SearchInput.prototype.setCursorWord = function() {
      return this.editor.insertText(this.vimState.editor.getWordUnderCursor());
    };

    SearchInput.prototype.activateLiteralMode = function() {
      if (this.literalModeDeactivator != null) {
        return this.literalModeDeactivator.dispose();
      } else {
        this.literalModeDeactivator = new CompositeDisposable();
        this.editorElement.classList.add('literal-mode');
        return this.literalModeDeactivator.add(new Disposable((function(_this) {
          return function() {
            _this.editorElement.classList.remove('literal-mode');
            return _this.literalModeDeactivator = null;
          };
        })(this)));
      }
    };

    SearchInput.prototype.isVisible = function() {
      var ref1;
      return (ref1 = this.panel) != null ? ref1.isVisible() : void 0;
    };

    SearchInput.prototype.cancel = function() {
      this.emitter.emit('did-cancel');
      return this.unfocus();
    };

    SearchInput.prototype.confirm = function(landingPoint) {
      if (landingPoint == null) {
        landingPoint = null;
      }
      this.emitter.emit('did-confirm', {
        input: this.editor.getText(),
        landingPoint: landingPoint
      });
      return this.unfocus();
    };

    SearchInput.prototype.stopPropagation = function(oldCommands) {
      var fn, fn1, name, newCommands;
      newCommands = {};
      fn1 = function(fn) {
        var commandName;
        if (indexOf.call(name, ':') >= 0) {
          commandName = name;
        } else {
          commandName = "vim-mode-plus:" + name;
        }
        return newCommands[commandName] = function(event) {
          event.stopImmediatePropagation();
          return fn(event);
        };
      };
      for (name in oldCommands) {
        fn = oldCommands[name];
        fn1(fn);
      }
      return newCommands;
    };

    SearchInput.prototype.initialize = function(vimState) {
      this.vimState = vimState;
      this.vimState.onDidFailToSetTarget((function(_this) {
        return function() {
          return _this.cancel();
        };
      })(this));
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      this.registerCommands();
      return this;
    };

    SearchInput.prototype.registerCommands = function() {
      return atom.commands.add(this.editorElement, this.stopPropagation({
        "search-confirm": (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        "search-land-to-start": (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        "search-land-to-end": (function(_this) {
          return function() {
            return _this.confirm('end');
          };
        })(this),
        "search-cancel": (function(_this) {
          return function() {
            return _this.cancel();
          };
        })(this),
        "search-visit-next": (function(_this) {
          return function() {
            return _this.emitter.emit('did-command', {
              name: 'visit',
              direction: 'next'
            });
          };
        })(this),
        "search-visit-prev": (function(_this) {
          return function() {
            return _this.emitter.emit('did-command', {
              name: 'visit',
              direction: 'prev'
            });
          };
        })(this),
        "select-occurrence-from-search": (function(_this) {
          return function() {
            return _this.emitter.emit('did-command', {
              name: 'occurrence',
              operation: 'SelectOccurrence'
            });
          };
        })(this),
        "change-occurrence-from-search": (function(_this) {
          return function() {
            return _this.emitter.emit('did-command', {
              name: 'occurrence',
              operation: 'ChangeOccurrence'
            });
          };
        })(this),
        "add-occurrence-pattern-from-search": (function(_this) {
          return function() {
            return _this.emitter.emit('did-command', {
              name: 'occurrence'
            });
          };
        })(this),
        "project-find-from-search": (function(_this) {
          return function() {
            return _this.emitter.emit('did-command', {
              name: 'project-find'
            });
          };
        })(this),
        "search-insert-wild-pattern": (function(_this) {
          return function() {
            return _this.editor.insertText('.*?');
          };
        })(this),
        "search-activate-literal-mode": (function(_this) {
          return function() {
            return _this.activateLiteralMode();
          };
        })(this),
        "search-set-cursor-word": (function(_this) {
          return function() {
            return _this.setCursorWord();
          };
        })(this),
        'core:move-up': (function(_this) {
          return function() {
            return _this.editor.setText(_this.vimState.searchHistory.get('prev'));
          };
        })(this),
        'core:move-down': (function(_this) {
          return function() {
            return _this.editor.setText(_this.vimState.searchHistory.get('next'));
          };
        })(this)
      }));
    };

    return SearchInput;

  })(HTMLElement);

  module.exports = registerElement('vim-mode-plus-search-input', {
    prototype: SearchInput.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvc2VhcmNoLWlucHV0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMkVBQUE7SUFBQTs7OztFQUFBLE1BQTZDLE9BQUEsQ0FBUSxNQUFSLENBQTdDLEVBQUMscUJBQUQsRUFBVSwyQkFBVixFQUFzQjs7RUFDckIsa0JBQW1CLE9BQUEsQ0FBUSxTQUFSOztFQUVkOzs7Ozs7OzBCQUNKLHNCQUFBLEdBQXdCOzswQkFFeEIsV0FBQSxHQUFhLFNBQUMsRUFBRDthQUFRLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLFlBQVosRUFBMEIsRUFBMUI7SUFBUjs7MEJBQ2IsWUFBQSxHQUFjLFNBQUMsRUFBRDthQUFRLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLGFBQVosRUFBMkIsRUFBM0I7SUFBUjs7MEJBQ2QsV0FBQSxHQUFhLFNBQUMsRUFBRDthQUFRLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLFlBQVosRUFBMEIsRUFBMUI7SUFBUjs7MEJBQ2IsWUFBQSxHQUFjLFNBQUMsRUFBRDthQUFRLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLGFBQVosRUFBMkIsRUFBM0I7SUFBUjs7MEJBRWQsZUFBQSxHQUFpQixTQUFBO0FBQ2YsVUFBQTtNQUFBLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFFZixJQUFDLENBQUEsU0FBRCxHQUFhO01BUWIsT0FBc0MsSUFBQyxDQUFBLG9CQUFELENBQXNCLEtBQXRCLENBQXRDLEVBQUMsMEJBQUQsRUFBbUI7TUFDbkIsSUFBQyxDQUFBLGlCQUFELEdBQXFCLGdCQUFnQixDQUFDO01BQ3RDLElBQUMsQ0FBQSxhQUFELEdBQWlCLGVBQWUsQ0FBQztNQUNqQyxJQUFDLENBQUEsTUFBRCxH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QUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsbUJBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWRoQztRQWVBLHdCQUFBLEVBQTBCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLGFBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWYxQjtRQWdCQSxjQUFBLEVBQWdCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQWdCLEtBQUMsQ0FBQSxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQXhCLENBQTRCLE1BQTVCLENBQWhCO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBaEJoQjtRQWlCQSxnQkFBQSxFQUFrQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUixDQUFnQixLQUFDLENBQUEsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUF4QixDQUE0QixNQUE1QixDQUFoQjtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWpCbEI7T0FEZ0MsQ0FBbEM7SUFEZ0I7Ozs7S0ExSE07O0VBZ0oxQixNQUFNLENBQUMsT0FBUCxHQUFpQixlQUFBLENBQWdCLDRCQUFoQixFQUNmO0lBQUEsU0FBQSxFQUFXLFdBQVcsQ0FBQyxTQUF2QjtHQURlO0FBbkpqQiIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyLCBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG57cmVnaXN0ZXJFbGVtZW50fSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbmNsYXNzIFNlYXJjaElucHV0IGV4dGVuZHMgSFRNTEVsZW1lbnRcbiAgbGl0ZXJhbE1vZGVEZWFjdGl2YXRvcjogbnVsbFxuXG4gIG9uRGlkQ2hhbmdlOiAoZm4pIC0+IEBlbWl0dGVyLm9uICdkaWQtY2hhbmdlJywgZm5cbiAgb25EaWRDb25maXJtOiAoZm4pIC0+IEBlbWl0dGVyLm9uICdkaWQtY29uZmlybScsIGZuXG4gIG9uRGlkQ2FuY2VsOiAoZm4pIC0+IEBlbWl0dGVyLm9uICdkaWQtY2FuY2VsJywgZm5cbiAgb25EaWRDb21tYW5kOiAoZm4pIC0+IEBlbWl0dGVyLm9uICdkaWQtY29tbWFuZCcsIGZuXG5cbiAgY3JlYXRlZENhbGxiYWNrOiAtPlxuICAgIEBjbGFzc05hbWUgPSBcInZpbS1tb2RlLXBsdXMtc2VhcmNoLWNvbnRhaW5lclwiXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXG4gICAgQGlubmVySFRNTCA9IFwiXCJcIlxuICAgIDxkaXYgY2xhc3M9J29wdGlvbnMtY29udGFpbmVyJz5cbiAgICAgIDxzcGFuIGNsYXNzPSdpbmxpbmUtYmxvY2stdGlnaHQgYnRuIGJ0bi1wcmltYXJ5Jz4uKjwvc3Bhbj5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPSdlZGl0b3ItY29udGFpbmVyJz5cbiAgICAgIDxhdG9tLXRleHQtZWRpdG9yIG1pbmkgY2xhc3M9J2VkaXRvciB2aW0tbW9kZS1wbHVzLXNlYXJjaCc+PC9hdG9tLXRleHQtZWRpdG9yPlxuICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuICAgIFtvcHRpb25zQ29udGFpbmVyLCBlZGl0b3JDb250YWluZXJdID0gQGdldEVsZW1lbnRzQnlUYWdOYW1lKCdkaXYnKVxuICAgIEByZWdleFNlYXJjaFN0YXR1cyA9IG9wdGlvbnNDb250YWluZXIuZmlyc3RFbGVtZW50Q2hpbGRcbiAgICBAZWRpdG9yRWxlbWVudCA9IGVkaXRvckNvbnRhaW5lci5maXJzdEVsZW1lbnRDaGlsZFxuICAgIEBlZGl0b3IgPSBAZWRpdG9yRWxlbWVudC5nZXRNb2RlbCgpXG4gICAgQGVkaXRvci5zZXRNaW5pKHRydWUpXG5cbiAgICBAZWRpdG9yLm9uRGlkQ2hhbmdlID0+XG4gICAgICByZXR1cm4gaWYgQGZpbmlzaGVkXG4gICAgICBAZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlJywgQGVkaXRvci5nZXRUZXh0KCkpXG5cbiAgICBAcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRCb3R0b21QYW5lbChpdGVtOiB0aGlzLCB2aXNpYmxlOiBmYWxzZSlcbiAgICB0aGlzXG5cbiAgZGVzdHJveTogLT5cbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG4gICAgQGVkaXRvci5kZXN0cm95KClcbiAgICBAcGFuZWw/LmRlc3Ryb3koKVxuICAgIHtAZWRpdG9yLCBAcGFuZWwsIEBlZGl0b3JFbGVtZW50LCBAdmltU3RhdGV9ID0ge31cbiAgICBAcmVtb3ZlKClcblxuICBoYW5kbGVFdmVudHM6IC0+XG4gICAgYXRvbS5jb21tYW5kcy5hZGQgQGVkaXRvckVsZW1lbnQsXG4gICAgICAnY29yZTpjb25maXJtJzogPT4gQGNvbmZpcm0oKVxuICAgICAgJ2NvcmU6Y2FuY2VsJzogPT4gQGNhbmNlbCgpXG4gICAgICAnYmx1cic6ID0+IEBjYW5jZWwoKSB1bmxlc3MgQGZpbmlzaGVkXG4gICAgICAndmltLW1vZGUtcGx1czppbnB1dC1jYW5jZWwnOiA9PiBAY2FuY2VsKClcblxuICBmb2N1czogKEBvcHRpb25zPXt9KSAtPlxuICAgIEBmaW5pc2hlZCA9IGZhbHNlXG5cbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdiYWNrd2FyZHMnKSBpZiBAb3B0aW9ucy5iYWNrd2FyZHNcbiAgICBAcGFuZWwuc2hvdygpXG4gICAgQGVkaXRvckVsZW1lbnQuZm9jdXMoKVxuICAgIEBjb21tYW5kU3Vic2NyaXB0aW9ucyA9IEBoYW5kbGVFdmVudHMoKVxuXG4gICAgIyBDYW5jZWwgb24gdGFiIHN3aXRjaFxuICAgIGRpc3Bvc2FibGUgPSBhdG9tLndvcmtzcGFjZS5vbkRpZENoYW5nZUFjdGl2ZVBhbmVJdGVtID0+XG4gICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgICAgQGNhbmNlbCgpIHVubGVzcyBAZmluaXNoZWRcblxuICB1bmZvY3VzOiAtPlxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2JhY2t3YXJkcycpXG4gICAgQHJlZ2V4U2VhcmNoU3RhdHVzLmNsYXNzTGlzdC5hZGQgJ2J0bi1wcmltYXJ5J1xuICAgIEBsaXRlcmFsTW9kZURlYWN0aXZhdG9yPy5kaXNwb3NlKClcblxuICAgIEBjb21tYW5kU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQGZpbmlzaGVkID0gdHJ1ZVxuICAgIGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKS5hY3RpdmF0ZSgpXG4gICAgQGVkaXRvci5zZXRUZXh0ICcnXG4gICAgQHBhbmVsPy5oaWRlKClcblxuICB1cGRhdGVPcHRpb25TZXR0aW5nczogKHt1c2VSZWdleHB9PXt9KSAtPlxuICAgIEByZWdleFNlYXJjaFN0YXR1cy5jbGFzc0xpc3QudG9nZ2xlKCdidG4tcHJpbWFyeScsIHVzZVJlZ2V4cClcblxuICBzZXRDdXJzb3JXb3JkOiAtPlxuICAgIEBlZGl0b3IuaW5zZXJ0VGV4dChAdmltU3RhdGUuZWRpdG9yLmdldFdvcmRVbmRlckN1cnNvcigpKVxuXG4gIGFjdGl2YXRlTGl0ZXJhbE1vZGU6IC0+XG4gICAgaWYgQGxpdGVyYWxNb2RlRGVhY3RpdmF0b3I/XG4gICAgICBAbGl0ZXJhbE1vZGVEZWFjdGl2YXRvci5kaXNwb3NlKClcbiAgICBlbHNlXG4gICAgICBAbGl0ZXJhbE1vZGVEZWFjdGl2YXRvciA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2xpdGVyYWwtbW9kZScpXG5cbiAgICAgIEBsaXRlcmFsTW9kZURlYWN0aXZhdG9yLmFkZCBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdsaXRlcmFsLW1vZGUnKVxuICAgICAgICBAbGl0ZXJhbE1vZGVEZWFjdGl2YXRvciA9IG51bGxcblxuICBpc1Zpc2libGU6IC0+XG4gICAgQHBhbmVsPy5pc1Zpc2libGUoKVxuXG4gIGNhbmNlbDogLT5cbiAgICBAZW1pdHRlci5lbWl0KCdkaWQtY2FuY2VsJylcbiAgICBAdW5mb2N1cygpXG5cbiAgY29uZmlybTogKGxhbmRpbmdQb2ludD1udWxsKSAtPlxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1jb25maXJtJywge2lucHV0OiBAZWRpdG9yLmdldFRleHQoKSwgbGFuZGluZ1BvaW50fSlcbiAgICBAdW5mb2N1cygpXG5cbiAgc3RvcFByb3BhZ2F0aW9uOiAob2xkQ29tbWFuZHMpIC0+XG4gICAgbmV3Q29tbWFuZHMgPSB7fVxuICAgIGZvciBuYW1lLCBmbiBvZiBvbGRDb21tYW5kc1xuICAgICAgZG8gKGZuKSAtPlxuICAgICAgICBpZiAnOicgaW4gbmFtZVxuICAgICAgICAgIGNvbW1hbmROYW1lID0gbmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgY29tbWFuZE5hbWUgPSBcInZpbS1tb2RlLXBsdXM6I3tuYW1lfVwiXG4gICAgICAgIG5ld0NvbW1hbmRzW2NvbW1hbmROYW1lXSA9IChldmVudCkgLT5cbiAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgICAgIGZuKGV2ZW50KVxuICAgIG5ld0NvbW1hbmRzXG5cbiAgaW5pdGlhbGl6ZTogKEB2aW1TdGF0ZSkgLT5cbiAgICBAdmltU3RhdGUub25EaWRGYWlsVG9TZXRUYXJnZXQgPT5cbiAgICAgIEBjYW5jZWwoKVxuXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZGlzcG9zYWJsZXMuYWRkIEB2aW1TdGF0ZS5vbkRpZERlc3Ryb3koQGRlc3Ryb3kuYmluZCh0aGlzKSlcblxuICAgIEByZWdpc3RlckNvbW1hbmRzKClcbiAgICB0aGlzXG5cbiAgcmVnaXN0ZXJDb21tYW5kczogLT5cbiAgICBhdG9tLmNvbW1hbmRzLmFkZCBAZWRpdG9yRWxlbWVudCwgQHN0b3BQcm9wYWdhdGlvbihcbiAgICAgIFwic2VhcmNoLWNvbmZpcm1cIjogPT4gQGNvbmZpcm0oKVxuICAgICAgXCJzZWFyY2gtbGFuZC10by1zdGFydFwiOiA9PiBAY29uZmlybSgpXG4gICAgICBcInNlYXJjaC1sYW5kLXRvLWVuZFwiOiA9PiBAY29uZmlybSgnZW5kJylcbiAgICAgIFwic2VhcmNoLWNhbmNlbFwiOiA9PiBAY2FuY2VsKClcblxuICAgICAgXCJzZWFyY2gtdmlzaXQtbmV4dFwiOiA9PiBAZW1pdHRlci5lbWl0KCdkaWQtY29tbWFuZCcsIG5hbWU6ICd2aXNpdCcsIGRpcmVjdGlvbjogJ25leHQnKVxuICAgICAgXCJzZWFyY2gtdmlzaXQtcHJldlwiOiA9PiBAZW1pdHRlci5lbWl0KCdkaWQtY29tbWFuZCcsIG5hbWU6ICd2aXNpdCcsIGRpcmVjdGlvbjogJ3ByZXYnKVxuXG4gICAgICBcInNlbGVjdC1vY2N1cnJlbmNlLWZyb20tc2VhcmNoXCI6ID0+IEBlbWl0dGVyLmVtaXQoJ2RpZC1jb21tYW5kJywgbmFtZTogJ29jY3VycmVuY2UnLCBvcGVyYXRpb246ICdTZWxlY3RPY2N1cnJlbmNlJylcbiAgICAgIFwiY2hhbmdlLW9jY3VycmVuY2UtZnJvbS1zZWFyY2hcIjogPT4gQGVtaXR0ZXIuZW1pdCgnZGlkLWNvbW1hbmQnLCBuYW1lOiAnb2NjdXJyZW5jZScsIG9wZXJhdGlvbjogJ0NoYW5nZU9jY3VycmVuY2UnKVxuICAgICAgXCJhZGQtb2NjdXJyZW5jZS1wYXR0ZXJuLWZyb20tc2VhcmNoXCI6ID0+IEBlbWl0dGVyLmVtaXQoJ2RpZC1jb21tYW5kJywgbmFtZTogJ29jY3VycmVuY2UnKVxuICAgICAgXCJwcm9qZWN0LWZpbmQtZnJvbS1zZWFyY2hcIjogPT4gQGVtaXR0ZXIuZW1pdCgnZGlkLWNvbW1hbmQnLCBuYW1lOiAncHJvamVjdC1maW5kJylcblxuICAgICAgXCJzZWFyY2gtaW5zZXJ0LXdpbGQtcGF0dGVyblwiOiA9PiBAZWRpdG9yLmluc2VydFRleHQoJy4qPycpXG4gICAgICBcInNlYXJjaC1hY3RpdmF0ZS1saXRlcmFsLW1vZGVcIjogPT4gQGFjdGl2YXRlTGl0ZXJhbE1vZGUoKVxuICAgICAgXCJzZWFyY2gtc2V0LWN1cnNvci13b3JkXCI6ID0+IEBzZXRDdXJzb3JXb3JkKClcbiAgICAgICdjb3JlOm1vdmUtdXAnOiA9PiBAZWRpdG9yLnNldFRleHQgQHZpbVN0YXRlLnNlYXJjaEhpc3RvcnkuZ2V0KCdwcmV2JylcbiAgICAgICdjb3JlOm1vdmUtZG93bic6ID0+IEBlZGl0b3Iuc2V0VGV4dCBAdmltU3RhdGUuc2VhcmNoSGlzdG9yeS5nZXQoJ25leHQnKVxuICAgIClcblxubW9kdWxlLmV4cG9ydHMgPSByZWdpc3RlckVsZW1lbnQgJ3ZpbS1tb2RlLXBsdXMtc2VhcmNoLWlucHV0JyxcbiAgcHJvdG90eXBlOiBTZWFyY2hJbnB1dC5wcm90b3R5cGVcbiJdfQ==
