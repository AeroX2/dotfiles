(function() {
  describe('linter-registry', function() {
    var EditorLinter, LinterRegistry, getLinter, getMessage, linterRegistry, ref;
    LinterRegistry = require('../lib/linter-registry');
    EditorLinter = require('../lib/editor-linter');
    linterRegistry = null;
    ref = require('./common'), getLinter = ref.getLinter, getMessage = ref.getMessage;
    beforeEach(function() {
      waitsForPromise(function() {
        atom.workspace.destroyActivePaneItem();
        return atom.workspace.open('file.txt');
      });
      if (linterRegistry != null) {
        linterRegistry.dispose();
      }
      return linterRegistry = new LinterRegistry;
    });
    describe('::addLinter', function() {
      it('adds error notification if linter is invalid', function() {
        linterRegistry.addLinter({});
        return expect(atom.notifications.getNotifications().length).toBe(1);
      });
      it('pushes linter into registry when valid', function() {
        var linter;
        linter = getLinter();
        linterRegistry.addLinter(linter);
        return expect(linterRegistry.linters.size).toBe(1);
      });
      return it('set deactivated to false on linter', function() {
        var linter;
        linter = getLinter();
        linterRegistry.addLinter(linter);
        return expect(linter.deactivated).toBe(false);
      });
    });
    describe('::hasLinter', function() {
      it('returns true if present', function() {
        var linter;
        linter = getLinter();
        linterRegistry.addLinter(linter);
        return expect(linterRegistry.hasLinter(linter)).toBe(true);
      });
      return it('returns false if not', function() {
        var linter;
        linter = getLinter();
        return expect(linterRegistry.hasLinter(linter)).toBe(false);
      });
    });
    describe('::deleteLinter', function() {
      it('deletes the linter from registry', function() {
        var linter;
        linter = getLinter();
        linterRegistry.addLinter(linter);
        expect(linterRegistry.hasLinter(linter)).toBe(true);
        linterRegistry.deleteLinter(linter);
        return expect(linterRegistry.hasLinter(linter)).toBe(false);
      });
      return it('sets deactivated to true on linter', function() {
        var linter;
        linter = getLinter();
        linterRegistry.addLinter(linter);
        linterRegistry.deleteLinter(linter);
        return expect(linter.deactivated).toBe(true);
      });
    });
    describe('::lint', function() {
      it("doesn't lint if textEditor isn't active one", function() {
        var editorLinter, linter;
        editorLinter = new EditorLinter(atom.workspace.getActiveTextEditor());
        linter = {
          grammarScopes: ['*'],
          lintOnFly: false,
          modifiesBuffer: false,
          scope: 'file',
          lint: function() {}
        };
        linterRegistry.addLinter(linter);
        return waitsForPromise(function() {
          return atom.workspace.open('test2.txt').then(function() {
            return expect(linterRegistry.lint({
              onChange: false,
              editorLinter: editorLinter
            })).toBeUndefined();
          });
        });
      });
      it("doesn't lint if textEditor doesn't have a path", function() {
        var editorLinter, linter;
        editorLinter = new EditorLinter(atom.workspace.getActiveTextEditor());
        linter = {
          grammarScopes: ['*'],
          lintOnFly: false,
          scope: 'file',
          lint: function() {}
        };
        linterRegistry.addLinter(linter);
        return waitsForPromise(function() {
          return atom.workspace.open('someNonExistingFile.txt').then(function() {
            return expect(linterRegistry.lint({
              onChange: false,
              editorLinter: editorLinter
            })).toBeUndefined();
          });
        });
      });
      return it('disallows two co-current lints of same type', function() {
        var editorLinter, linter;
        editorLinter = new EditorLinter(atom.workspace.getActiveTextEditor());
        linter = {
          grammarScopes: ['*'],
          lintOnFly: false,
          scope: 'file',
          lint: function() {}
        };
        linterRegistry.addLinter(linter);
        expect(linterRegistry.lint({
          onChange: false,
          editorLinter: editorLinter
        })).toBeDefined();
        return expect(linterRegistry.lint({
          onChange: false,
          editorLinter: editorLinter
        })).toBeUndefined();
      });
    });
    return describe('::onDidUpdateMessages', function() {
      return it('is triggered whenever messages change', function() {
        var editorLinter, info, linter;
        editorLinter = new EditorLinter(atom.workspace.getActiveTextEditor());
        linter = {
          grammarScopes: ['*'],
          lintOnFly: false,
          scope: 'file',
          lint: function() {
            return [
              {
                type: 'Error',
                text: 'Something'
              }
            ];
          }
        };
        info = void 0;
        linterRegistry.addLinter(linter);
        linterRegistry.onDidUpdateMessages(function(linterInfo) {
          return info = linterInfo;
        });
        return waitsForPromise(function() {
          return linterRegistry.lint({
            onChange: false,
            editorLinter: editorLinter
          }).then(function() {
            expect(info).toBeDefined();
            return expect(info.messages.length).toBe(1);
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvbGludGVyLXJlZ2lzdHJ5LXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUEsUUFBQSxDQUFTLGlCQUFULEVBQTRCLFNBQUE7QUFDMUIsUUFBQTtJQUFBLGNBQUEsR0FBaUIsT0FBQSxDQUFRLHdCQUFSO0lBQ2pCLFlBQUEsR0FBZSxPQUFBLENBQVEsc0JBQVI7SUFDZixjQUFBLEdBQWlCO0lBQ2pCLE1BQTBCLE9BQUEsQ0FBUSxVQUFSLENBQTFCLEVBQUMseUJBQUQsRUFBWTtJQUVaLFVBQUEsQ0FBVyxTQUFBO01BQ1QsZUFBQSxDQUFnQixTQUFBO1FBQ2QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxxQkFBZixDQUFBO2VBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLFVBQXBCO01BRmMsQ0FBaEI7O1FBR0EsY0FBYyxDQUFFLE9BQWhCLENBQUE7O2FBQ0EsY0FBQSxHQUFpQixJQUFJO0lBTFosQ0FBWDtJQU9BLFFBQUEsQ0FBUyxhQUFULEVBQXdCLFNBQUE7TUFDdEIsRUFBQSxDQUFHLDhDQUFILEVBQW1ELFNBQUE7UUFDakQsY0FBYyxDQUFDLFNBQWYsQ0FBeUIsRUFBekI7ZUFDQSxNQUFBLENBQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBbkIsQ0FBQSxDQUFxQyxDQUFDLE1BQTdDLENBQW9ELENBQUMsSUFBckQsQ0FBMEQsQ0FBMUQ7TUFGaUQsQ0FBbkQ7TUFHQSxFQUFBLENBQUcsd0NBQUgsRUFBNkMsU0FBQTtBQUMzQyxZQUFBO1FBQUEsTUFBQSxHQUFTLFNBQUEsQ0FBQTtRQUNULGNBQWMsQ0FBQyxTQUFmLENBQXlCLE1BQXpCO2VBQ0EsTUFBQSxDQUFPLGNBQWMsQ0FBQyxPQUFPLENBQUMsSUFBOUIsQ0FBbUMsQ0FBQyxJQUFwQyxDQUF5QyxDQUF6QztNQUgyQyxDQUE3QzthQUlBLEVB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LEVBQTRDLFNBQUE7QUFDMUMsWUFBQTtRQUFBLFlBQUEsR0FBbUIsSUFBQSxZQUFBLENBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQWI7UUFDbkIsTUFBQSxHQUFTO1VBQ1AsYUFBQSxFQUFlLENBQUMsR0FBRCxDQURSO1VBRVAsU0FBQSxFQUFXLEtBRko7VUFHUCxLQUFBLEVBQU8sTUFIQTtVQUlQLElBQUEsRUFBTSxTQUFBO0FBQUcsbUJBQU87Y0FBQztnQkFBQyxJQUFBLEVBQU0sT0FBUDtnQkFBZ0IsSUFBQSxFQUFNLFdBQXRCO2VBQUQ7O1VBQVYsQ0FKQzs7UUFNVCxJQUFBLEdBQU87UUFDUCxjQUFjLENBQUMsU0FBZixDQUF5QixNQUF6QjtRQUNBLGNBQWMsQ0FBQyxtQkFBZixDQUFtQyxTQUFDLFVBQUQ7aUJBQ2pDLElBQUEsR0FBTztRQUQwQixDQUFuQztlQUVBLGVBQUEsQ0FBZ0IsU0FBQTtpQkFDZCxjQUFjLENBQUMsSUFBZixDQUFvQjtZQUFDLFFBQUEsRUFBVSxLQUFYO1lBQWtCLGNBQUEsWUFBbEI7V0FBcEIsQ0FBb0QsQ0FBQyxJQUFyRCxDQUEwRCxTQUFBO1lBQ3hELE1BQUEsQ0FBTyxJQUFQLENBQVksQ0FBQyxXQUFiLENBQUE7bUJBQ0EsTUFBQSxDQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBckIsQ0FBNEIsQ0FBQyxJQUE3QixDQUFrQyxDQUFsQztVQUZ3RCxDQUExRDtRQURjLENBQWhCO01BWjBDLENBQTVDO0lBRGdDLENBQWxDO0VBdEYwQixDQUE1QjtBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiZGVzY3JpYmUgJ2xpbnRlci1yZWdpc3RyeScsIC0+XG4gIExpbnRlclJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi4vbGliL2xpbnRlci1yZWdpc3RyeScpXG4gIEVkaXRvckxpbnRlciA9IHJlcXVpcmUoJy4uL2xpYi9lZGl0b3ItbGludGVyJylcbiAgbGludGVyUmVnaXN0cnkgPSBudWxsXG4gIHtnZXRMaW50ZXIsIGdldE1lc3NhZ2V9ID0gcmVxdWlyZSgnLi9jb21tb24nKVxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgIGF0b20ud29ya3NwYWNlLmRlc3Ryb3lBY3RpdmVQYW5lSXRlbSgpXG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCdmaWxlLnR4dCcpXG4gICAgbGludGVyUmVnaXN0cnk/LmRpc3Bvc2UoKVxuICAgIGxpbnRlclJlZ2lzdHJ5ID0gbmV3IExpbnRlclJlZ2lzdHJ5XG5cbiAgZGVzY3JpYmUgJzo6YWRkTGludGVyJywgLT5cbiAgICBpdCAnYWRkcyBlcnJvciBub3RpZmljYXRpb24gaWYgbGludGVyIGlzIGludmFsaWQnLCAtPlxuICAgICAgbGludGVyUmVnaXN0cnkuYWRkTGludGVyKHt9KVxuICAgICAgZXhwZWN0KGF0b20ubm90aWZpY2F0aW9ucy5nZXROb3RpZmljYXRpb25zKCkubGVuZ3RoKS50b0JlKDEpXG4gICAgaXQgJ3B1c2hlcyBsaW50ZXIgaW50byByZWdpc3RyeSB3aGVuIHZhbGlkJywgLT5cbiAgICAgIGxpbnRlciA9IGdldExpbnRlcigpXG4gICAgICBsaW50ZXJSZWdpc3RyeS5hZGRMaW50ZXIobGludGVyKVxuICAgICAgZXhwZWN0KGxpbnRlclJlZ2lzdHJ5LmxpbnRlcnMuc2l6ZSkudG9CZSgxKVxuICAgIGl0ICdzZXQgZGVhY3RpdmF0ZWQgdG8gZmFsc2Ugb24gbGludGVyJywgLT5cbiAgICAgIGxpbnRlciA9IGdldExpbnRlcigpXG4gICAgICBsaW50ZXJSZWdpc3RyeS5hZGRMaW50ZXIobGludGVyKVxuICAgICAgZXhwZWN0KGxpbnRlci5kZWFjdGl2YXRlZCkudG9CZShmYWxzZSlcblxuICBkZXNjcmliZSAnOjpoYXNMaW50ZXInLCAtPlxuICAgIGl0ICdyZXR1cm5zIHRydWUgaWYgcHJlc2VudCcsIC0+XG4gICAgICBsaW50ZXIgPSBnZXRMaW50ZXIoKVxuICAgICAgbGludGVyUmVnaXN0cnkuYWRkTGludGVyKGxpbnRlcilcbiAgICAgIGV4cGVjdChsaW50ZXJSZWdpc3RyeS5oYXNMaW50ZXIobGludGVyKSkudG9CZSh0cnVlKVxuICAgIGl0ICdyZXR1cm5zIGZhbHNlIGlmIG5vdCcsIC0+XG4gICAgICBsaW50ZXIgPSBnZXRMaW50ZXIoKVxuICAgICAgZXhwZWN0KGxpbnRlclJlZ2lzdHJ5Lmhhc0xpbnRlcihsaW50ZXIpKS50b0JlKGZhbHNlKVxuXG4gIGRlc2NyaWJlICc6OmRlbGV0ZUxpbnRlcicsIC0+XG4gICAgaXQgJ2RlbGV0ZXMgdGhlIGxpbnRlciBmcm9tIHJlZ2lzdHJ5JywgLT5cbiAgICAgIGxpbnRlciA9IGdldExpbnRlcigpXG4gICAgICBsaW50ZXJSZWdpc3RyeS5hZGRMaW50ZXIobGludGVyKVxuICAgICAgZXhwZWN0KGxpbnRlclJlZ2lzdHJ5Lmhhc0xpbnRlcihsaW50ZXIpKS50b0JlKHRydWUpXG4gICAgICBsaW50ZXJSZWdpc3RyeS5kZWxldGVMaW50ZXIobGludGVyKVxuICAgICAgZXhwZWN0KGxpbnRlclJlZ2lzdHJ5Lmhhc0xpbnRlcihsaW50ZXIpKS50b0JlKGZhbHNlKVxuICAgIGl0ICdzZXRzIGRlYWN0aXZhdGVkIHRvIHRydWUgb24gbGludGVyJywgLT5cbiAgICAgIGxpbnRlciA9IGdldExpbnRlcigpXG4gICAgICBsaW50ZXJSZWdpc3RyeS5hZGRMaW50ZXIobGludGVyKVxuICAgICAgbGludGVyUmVnaXN0cnkuZGVsZXRlTGludGVyKGxpbnRlcilcbiAgICAgIGV4cGVjdChsaW50ZXIuZGVhY3RpdmF0ZWQpLnRvQmUodHJ1ZSlcblxuICBkZXNjcmliZSAnOjpsaW50JywgLT5cbiAgICBpdCBcImRvZXNuJ3QgbGludCBpZiB0ZXh0RWRpdG9yIGlzbid0IGFjdGl2ZSBvbmVcIiwgLT5cbiAgICAgIGVkaXRvckxpbnRlciA9IG5ldyBFZGl0b3JMaW50ZXIoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKVxuICAgICAgbGludGVyID0ge1xuICAgICAgICBncmFtbWFyU2NvcGVzOiBbJyonXVxuICAgICAgICBsaW50T25GbHk6IGZhbHNlXG4gICAgICAgIG1vZGlmaWVzQnVmZmVyOiBmYWxzZVxuICAgICAgICBzY29wZTogJ2ZpbGUnXG4gICAgICAgIGxpbnQ6IC0+XG4gICAgICB9XG4gICAgICBsaW50ZXJSZWdpc3RyeS5hZGRMaW50ZXIobGludGVyKVxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oJ3Rlc3QyLnR4dCcpLnRoZW4gLT5cbiAgICAgICAgICBleHBlY3QobGludGVyUmVnaXN0cnkubGludCh7b25DaGFuZ2U6IGZhbHNlLCBlZGl0b3JMaW50ZXJ9KSkudG9CZVVuZGVmaW5lZCgpXG4gICAgaXQgXCJkb2Vzbid0IGxpbnQgaWYgdGV4dEVkaXRvciBkb2Vzbid0IGhhdmUgYSBwYXRoXCIsIC0+XG4gICAgICBlZGl0b3JMaW50ZXIgPSBuZXcgRWRpdG9yTGludGVyKGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSlcbiAgICAgIGxpbnRlciA9IHtcbiAgICAgICAgZ3JhbW1hclNjb3BlczogWycqJ11cbiAgICAgICAgbGludE9uRmx5OiBmYWxzZVxuICAgICAgICBzY29wZTogJ2ZpbGUnXG4gICAgICAgIGxpbnQ6IC0+XG4gICAgICB9XG4gICAgICBsaW50ZXJSZWdpc3RyeS5hZGRMaW50ZXIobGludGVyKVxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oJ3NvbWVOb25FeGlzdGluZ0ZpbGUudHh0JykudGhlbiAtPlxuICAgICAgICAgIGV4cGVjdChsaW50ZXJSZWdpc3RyeS5saW50KHtvbkNoYW5nZTogZmFsc2UsIGVkaXRvckxpbnRlcn0pKS50b0JlVW5kZWZpbmVkKClcbiAgICBpdCAnZGlzYWxsb3dzIHR3byBjby1jdXJyZW50IGxpbnRzIG9mIHNhbWUgdHlwZScsIC0+XG4gICAgICBlZGl0b3JMaW50ZXIgPSBuZXcgRWRpdG9yTGludGVyKGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSlcbiAgICAgIGxpbnRlciA9IHtcbiAgICAgICAgZ3JhbW1hclNjb3BlczogWycqJ11cbiAgICAgICAgbGludE9uRmx5OiBmYWxzZVxuICAgICAgICBzY29wZTogJ2ZpbGUnXG4gICAgICAgIGxpbnQ6IC0+XG4gICAgICB9XG4gICAgICBsaW50ZXJSZWdpc3RyeS5hZGRMaW50ZXIobGludGVyKVxuICAgICAgZXhwZWN0KGxpbnRlclJlZ2lzdHJ5LmxpbnQoe29uQ2hhbmdlOiBmYWxzZSwgZWRpdG9yTGludGVyfSkpLnRvQmVEZWZpbmVkKClcbiAgICAgIGV4cGVjdChsaW50ZXJSZWdpc3RyeS5saW50KHtvbkNoYW5nZTogZmFsc2UsIGVkaXRvckxpbnRlcn0pKS50b0JlVW5kZWZpbmVkKClcblxuICBkZXNjcmliZSAnOjpvbkRpZFVwZGF0ZU1lc3NhZ2VzJywgLT5cbiAgICBpdCAnaXMgdHJpZ2dlcmVkIHdoZW5ldmVyIG1lc3NhZ2VzIGNoYW5nZScsIC0+XG4gICAgICBlZGl0b3JMaW50ZXIgPSBuZXcgRWRpdG9yTGludGVyKGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSlcbiAgICAgIGxpbnRlciA9IHtcbiAgICAgICAgZ3JhbW1hclNjb3BlczogWycqJ11cbiAgICAgICAgbGludE9uRmx5OiBmYWxzZVxuICAgICAgICBzY29wZTogJ2ZpbGUnXG4gICAgICAgIGxpbnQ6IC0+IHJldHVybiBbe3R5cGU6ICdFcnJvcicsIHRleHQ6ICdTb21ldGhpbmcnfV1cbiAgICAgIH1cbiAgICAgIGluZm8gPSB1bmRlZmluZWRcbiAgICAgIGxpbnRlclJlZ2lzdHJ5LmFkZExpbnRlcihsaW50ZXIpXG4gICAgICBsaW50ZXJSZWdpc3RyeS5vbkRpZFVwZGF0ZU1lc3NhZ2VzIChsaW50ZXJJbmZvKSAtPlxuICAgICAgICBpbmZvID0gbGludGVySW5mb1xuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIGxpbnRlclJlZ2lzdHJ5LmxpbnQoe29uQ2hhbmdlOiBmYWxzZSwgZWRpdG9yTGludGVyfSkudGhlbiAtPlxuICAgICAgICAgIGV4cGVjdChpbmZvKS50b0JlRGVmaW5lZCgpXG4gICAgICAgICAgZXhwZWN0KGluZm8ubWVzc2FnZXMubGVuZ3RoKS50b0JlKDEpXG4iXX0=
