(function() {
  describe('message-registry', function() {
    var EditorLinter, LinterRegistry, MessageRegistry, getLinterRegistry, getMessage, messageRegistry, objectSize, ref;
    messageRegistry = null;
    MessageRegistry = require('../lib/message-registry');
    EditorLinter = require('../lib/editor-linter');
    LinterRegistry = require('../lib/linter-registry');
    objectSize = function(obj) {
      var size, value;
      size = 0;
      for (value in obj) {
        size++;
      }
      return size;
    };
    ref = require('./common'), getLinterRegistry = ref.getLinterRegistry, getMessage = ref.getMessage;
    beforeEach(function() {
      return waitsForPromise(function() {
        atom.workspace.destroyActivePaneItem();
        return atom.workspace.open('test.txt').then(function() {
          if (messageRegistry != null) {
            messageRegistry.dispose();
          }
          return messageRegistry = new MessageRegistry();
        });
      });
    });
    describe('::set', function() {
      it('accepts info from LinterRegistry::lint', function() {
        var editorLinter, linterRegistry, ref1, wasUpdated;
        ref1 = getLinterRegistry(), linterRegistry = ref1.linterRegistry, editorLinter = ref1.editorLinter;
        wasUpdated = false;
        linterRegistry.onDidUpdateMessages(function(linterInfo) {
          wasUpdated = true;
          messageRegistry.set(linterInfo);
          return expect(messageRegistry.hasChanged).toBe(true);
        });
        return waitsForPromise(function() {
          return linterRegistry.lint({
            onChange: false,
            editorLinter: editorLinter
          }).then(function() {
            expect(wasUpdated).toBe(true);
            return linterRegistry.dispose();
          });
        });
      });
      return it('ignores deactivated linters', function() {
        var editorLinter, linter, linterRegistry, ref1;
        ref1 = getLinterRegistry(), linterRegistry = ref1.linterRegistry, editorLinter = ref1.editorLinter, linter = ref1.linter;
        messageRegistry.set({
          linter: linter,
          messages: [getMessage('Error'), getMessage('Warning')]
        });
        messageRegistry.updatePublic();
        expect(messageRegistry.publicMessages.length).toBe(2);
        linter.deactivated = true;
        messageRegistry.set({
          linter: linter,
          messages: [getMessage('Error')]
        });
        messageRegistry.updatePublic();
        expect(messageRegistry.publicMessages.length).toBe(2);
        linter.deactivated = false;
        messageRegistry.set({
          linter: linter,
          messages: [getMessage('Error')]
        });
        messageRegistry.updatePublic();
        return expect(messageRegistry.publicMessages.length).toBe(1);
      });
    });
    describe('::onDidUpdateMessages', function() {
      it('is triggered asyncly with results and provides a diff', function() {
        var editorLinter, linterRegistry, ref1, wasUpdated;
        wasUpdated = false;
        ref1 = getLinterRegistry(), linterRegistry = ref1.linterRegistry, editorLinter = ref1.editorLinter;
        linterRegistry.onDidUpdateMessages(function(linterInfo) {
          messageRegistry.set(linterInfo);
          expect(messageRegistry.hasChanged).toBe(true);
          return messageRegistry.updatePublic();
        });
        messageRegistry.onDidUpdateMessages(function(arg) {
          var added, messages, removed;
          added = arg.added, removed = arg.removed, messages = arg.messages;
          wasUpdated = true;
          expect(added.length).toBe(1);
          expect(removed.length).toBe(0);
          return expect(messages.length).toBe(1);
        });
        return waitsForPromise(function() {
          return linterRegistry.lint({
            onChange: false,
            editorLinter: editorLinter
          }).then(function() {
            expect(wasUpdated).toBe(true);
            return linterRegistry.dispose();
          });
        });
      });
      return it('provides the same objects when they dont change', function() {
        var disposable, editorLinter, linterRegistry, ref1, wasUpdated;
        wasUpdated = false;
        ref1 = getLinterRegistry(), linterRegistry = ref1.linterRegistry, editorLinter = ref1.editorLinter;
        linterRegistry.onDidUpdateMessages(function(linterInfo) {
          messageRegistry.set(linterInfo);
          return messageRegistry.updatePublic();
        });
        disposable = messageRegistry.onDidUpdateMessages(function(arg) {
          var added, obj;
          added = arg.added;
          expect(added.length).toBe(1);
          obj = added[0];
          disposable.dispose();
          return messageRegistry.onDidUpdateMessages(function(arg1) {
            var messages;
            messages = arg1.messages;
            wasUpdated = true;
            return expect(messages[0]).toBe(obj);
          });
        });
        return waitsForPromise(function() {
          return linterRegistry.lint({
            onChange: false,
            editorLinter: editorLinter
          }).then(function() {
            return linterRegistry.lint({
              onChange: false,
              editorLinter: editorLinter
            });
          }).then(function() {
            expect(wasUpdated).toBe(true);
            return linterRegistry.dispose();
          });
        });
      });
    });
    return describe('::deleteEditorMessages', function() {
      return it('removes messages for that editor', function() {
        var editor, editorLinter, linterRegistry, ref1, wasUpdated;
        wasUpdated = 0;
        ref1 = getLinterRegistry(), linterRegistry = ref1.linterRegistry, editorLinter = ref1.editorLinter;
        editor = editorLinter.editor;
        linterRegistry.onDidUpdateMessages(function(linterInfo) {
          messageRegistry.set(linterInfo);
          expect(messageRegistry.hasChanged).toBe(true);
          return messageRegistry.updatePublic();
        });
        messageRegistry.onDidUpdateMessages(function(arg) {
          var messages;
          messages = arg.messages;
          wasUpdated = 1;
          expect(objectSize(messages)).toBe(1);
          return messageRegistry.deleteEditorMessages(editor);
        });
        return waitsForPromise(function() {
          return linterRegistry.lint({
            onChange: false,
            editorLinter: editorLinter
          }).then(function() {
            expect(wasUpdated).toBe(1);
            return linterRegistry.dispose();
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvbWVzc2FnZS1yZWdpc3RyeS1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBLFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO0FBQzNCLFFBQUE7SUFBQSxlQUFBLEdBQWtCO0lBQ2xCLGVBQUEsR0FBa0IsT0FBQSxDQUFRLHlCQUFSO0lBQ2xCLFlBQUEsR0FBZSxPQUFBLENBQVEsc0JBQVI7SUFDZixjQUFBLEdBQWlCLE9BQUEsQ0FBUSx3QkFBUjtJQUNqQixVQUFBLEdBQWEsU0FBQyxHQUFEO0FBQ1gsVUFBQTtNQUFBLElBQUEsR0FBTztBQUNQLFdBQUEsWUFBQTtRQUFBLElBQUE7QUFBQTtBQUNBLGFBQU87SUFISTtJQUliLE1BQWtDLE9BQUEsQ0FBUSxVQUFSLENBQWxDLEVBQUMseUNBQUQsRUFBb0I7SUFFcEIsVUFBQSxDQUFXLFNBQUE7YUFDVCxlQUFBLENBQWdCLFNBQUE7UUFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFmLENBQUE7ZUFDQSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IsVUFBcEIsQ0FBK0IsQ0FBQyxJQUFoQyxDQUFxQyxTQUFBOztZQUNuQyxlQUFlLENBQUUsT0FBakIsQ0FBQTs7aUJBQ0EsZUFBQSxHQUFzQixJQUFBLGVBQUEsQ0FBQTtRQUZhLENBQXJDO01BRmMsQ0FBaEI7SUFEUyxDQUFYO0lBT0EsUUFBQSxDQUFTLE9BQVQsRUFBa0IsU0FBQTtNQUNoQixFQUFBLENBQUcsd0NBQUgsRUFBNkMsU0FBQTtBQUMzQyxZQUFBO1FBQUEsT0FBaUMsaUJBQUEsQ0FBQSxDQUFqQyxFQUFDLG9DQUFELEVBQWlCO1FBQ2pCLFVBQUEsR0FBYTtRQUNiLGNBQWMsQ0FBQyxtQkFBZixDQUFtQyxTQUFDLFVBQUQ7VUFDakMsVUFBQSxHQUFhO1VBQ2IsZUFBZSxDQUFDLEdBQWhC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QjtBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiZGVzY3JpYmUgJ21lc3NhZ2UtcmVnaXN0cnknLCAtPlxuICBtZXNzYWdlUmVnaXN0cnkgPSBudWxsXG4gIE1lc3NhZ2VSZWdpc3RyeSA9IHJlcXVpcmUoJy4uL2xpYi9tZXNzYWdlLXJlZ2lzdHJ5JylcbiAgRWRpdG9yTGludGVyID0gcmVxdWlyZSgnLi4vbGliL2VkaXRvci1saW50ZXInKVxuICBMaW50ZXJSZWdpc3RyeSA9IHJlcXVpcmUoJy4uL2xpYi9saW50ZXItcmVnaXN0cnknKVxuICBvYmplY3RTaXplID0gKG9iaikgLT5cbiAgICBzaXplID0gMFxuICAgIHNpemUrKyBmb3IgdmFsdWUgb2Ygb2JqXG4gICAgcmV0dXJuIHNpemVcbiAge2dldExpbnRlclJlZ2lzdHJ5LCBnZXRNZXNzYWdlfSA9IHJlcXVpcmUoJy4vY29tbW9uJylcblxuICBiZWZvcmVFYWNoIC0+XG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLndvcmtzcGFjZS5kZXN0cm95QWN0aXZlUGFuZUl0ZW0oKVxuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbigndGVzdC50eHQnKS50aGVuIC0+XG4gICAgICAgIG1lc3NhZ2VSZWdpc3RyeT8uZGlzcG9zZSgpXG4gICAgICAgIG1lc3NhZ2VSZWdpc3RyeSA9IG5ldyBNZXNzYWdlUmVnaXN0cnkoKVxuXG4gIGRlc2NyaWJlICc6OnNldCcsIC0+XG4gICAgaXQgJ2FjY2VwdHMgaW5mbyBmcm9tIExpbnRlclJlZ2lzdHJ5OjpsaW50JywgLT5cbiAgICAgIHtsaW50ZXJSZWdpc3RyeSwgZWRpdG9yTGludGVyfSA9IGdldExpbnRlclJlZ2lzdHJ5KClcbiAgICAgIHdhc1VwZGF0ZWQgPSBmYWxzZVxuICAgICAgbGludGVyUmVnaXN0cnkub25EaWRVcGRhdGVNZXNzYWdlcyAobGludGVySW5mbykgLT5cbiAgICAgICAgd2FzVXBkYXRlZCA9IHRydWVcbiAgICAgICAgbWVzc2FnZVJlZ2lzdHJ5LnNldChsaW50ZXJJbmZvKVxuICAgICAgICBleHBlY3QobWVzc2FnZVJlZ2lzdHJ5Lmhhc0NoYW5nZWQpLnRvQmUodHJ1ZSlcbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBsaW50ZXJSZWdpc3RyeS5saW50KHtvbkNoYW5nZTogZmFsc2UsIGVkaXRvckxpbnRlcn0pLnRoZW4gLT5cbiAgICAgICAgICBleHBlY3Qod2FzVXBkYXRlZCkudG9CZSh0cnVlKVxuICAgICAgICAgIGxpbnRlclJlZ2lzdHJ5LmRpc3Bvc2UoKVxuICAgIGl0ICdpZ25vcmVzIGRlYWN0aXZhdGVkIGxpbnRlcnMnLCAtPlxuICAgICAge2xpbnRlclJlZ2lzdHJ5LCBlZGl0b3JMaW50ZXIsIGxpbnRlcn0gPSBnZXRMaW50ZXJSZWdpc3RyeSgpXG4gICAgICBtZXNzYWdlUmVnaXN0cnkuc2V0KHtsaW50ZXIsIG1lc3NhZ2VzOiBbZ2V0TWVzc2FnZSgnRXJyb3InKSwgZ2V0TWVzc2FnZSgnV2FybmluZycpXX0pXG4gICAgICBtZXNzYWdlUmVnaXN0cnkudXBkYXRlUHVibGljKClcbiAgICAgIGV4cGVjdChtZXNzYWdlUmVnaXN0cnkucHVibGljTWVzc2FnZXMubGVuZ3RoKS50b0JlKDIpXG4gICAgICBsaW50ZXIuZGVhY3RpdmF0ZWQgPSB0cnVlXG4gICAgICBtZXNzYWdlUmVnaXN0cnkuc2V0KHtsaW50ZXIsIG1lc3NhZ2VzOiBbZ2V0TWVzc2FnZSgnRXJyb3InKV19KVxuICAgICAgbWVzc2FnZVJlZ2lzdHJ5LnVwZGF0ZVB1YmxpYygpXG4gICAgICBleHBlY3QobWVzc2FnZVJlZ2lzdHJ5LnB1YmxpY01lc3NhZ2VzLmxlbmd0aCkudG9CZSgyKVxuICAgICAgbGludGVyLmRlYWN0aXZhdGVkID0gZmFsc2VcbiAgICAgIG1lc3NhZ2VSZWdpc3RyeS5zZXQoe2xpbnRlciwgbWVzc2FnZXM6IFtnZXRNZXNzYWdlKCdFcnJvcicpXX0pXG4gICAgICBtZXNzYWdlUmVnaXN0cnkudXBkYXRlUHVibGljKClcbiAgICAgIGV4cGVjdChtZXNzYWdlUmVnaXN0cnkucHVibGljTWVzc2FnZXMubGVuZ3RoKS50b0JlKDEpXG5cbiAgZGVzY3JpYmUgJzo6b25EaWRVcGRhdGVNZXNzYWdlcycsIC0+XG4gICAgaXQgJ2lzIHRyaWdnZXJlZCBhc3luY2x5IHdpdGggcmVzdWx0cyBhbmQgcHJvdmlkZXMgYSBkaWZmJywgLT5cbiAgICAgIHdhc1VwZGF0ZWQgPSBmYWxzZVxuICAgICAge2xpbnRlclJlZ2lzdHJ5LCBlZGl0b3JMaW50ZXJ9ID0gZ2V0TGludGVyUmVnaXN0cnkoKVxuICAgICAgbGludGVyUmVnaXN0cnkub25EaWRVcGRhdGVNZXNzYWdlcyAobGludGVySW5mbykgLT5cbiAgICAgICAgbWVzc2FnZVJlZ2lzdHJ5LnNldChsaW50ZXJJbmZvKVxuICAgICAgICBleHBlY3QobWVzc2FnZVJlZ2lzdHJ5Lmhhc0NoYW5nZWQpLnRvQmUodHJ1ZSlcbiAgICAgICAgbWVzc2FnZVJlZ2lzdHJ5LnVwZGF0ZVB1YmxpYygpXG4gICAgICBtZXNzYWdlUmVnaXN0cnkub25EaWRVcGRhdGVNZXNzYWdlcyAoe2FkZGVkLCByZW1vdmVkLCBtZXNzYWdlc30pIC0+XG4gICAgICAgIHdhc1VwZGF0ZWQgPSB0cnVlXG4gICAgICAgIGV4cGVjdChhZGRlZC5sZW5ndGgpLnRvQmUoMSlcbiAgICAgICAgZXhwZWN0KHJlbW92ZWQubGVuZ3RoKS50b0JlKDApXG4gICAgICAgIGV4cGVjdChtZXNzYWdlcy5sZW5ndGgpLnRvQmUoMSlcbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBsaW50ZXJSZWdpc3RyeS5saW50KHtvbkNoYW5nZTogZmFsc2UsIGVkaXRvckxpbnRlcn0pLnRoZW4gLT5cbiAgICAgICAgICBleHBlY3Qod2FzVXBkYXRlZCkudG9CZSh0cnVlKVxuICAgICAgICAgIGxpbnRlclJlZ2lzdHJ5LmRpc3Bvc2UoKVxuICAgIGl0ICdwcm92aWRlcyB0aGUgc2FtZSBvYmplY3RzIHdoZW4gdGhleSBkb250IGNoYW5nZScsIC0+XG4gICAgICB3YXNVcGRhdGVkID0gZmFsc2VcbiAgICAgIHtsaW50ZXJSZWdpc3RyeSwgZWRpdG9yTGludGVyfSA9IGdldExpbnRlclJlZ2lzdHJ5KClcbiAgICAgIGxpbnRlclJlZ2lzdHJ5Lm9uRGlkVXBkYXRlTWVzc2FnZXMgKGxpbnRlckluZm8pIC0+XG4gICAgICAgIG1lc3NhZ2VSZWdpc3RyeS5zZXQobGludGVySW5mbylcbiAgICAgICAgbWVzc2FnZVJlZ2lzdHJ5LnVwZGF0ZVB1YmxpYygpXG4gICAgICBkaXNwb3NhYmxlID0gbWVzc2FnZVJlZ2lzdHJ5Lm9uRGlkVXBkYXRlTWVzc2FnZXMgKHthZGRlZH0pIC0+XG4gICAgICAgIGV4cGVjdChhZGRlZC5sZW5ndGgpLnRvQmUoMSlcbiAgICAgICAgb2JqID0gYWRkZWRbMF1cbiAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICAgICAgbWVzc2FnZVJlZ2lzdHJ5Lm9uRGlkVXBkYXRlTWVzc2FnZXMgKHttZXNzYWdlc30pIC0+XG4gICAgICAgICAgd2FzVXBkYXRlZCA9IHRydWVcbiAgICAgICAgICBleHBlY3QobWVzc2FnZXNbMF0pLnRvQmUob2JqKVxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIGxpbnRlclJlZ2lzdHJ5LmxpbnQoe29uQ2hhbmdlOiBmYWxzZSwgZWRpdG9yTGludGVyfSkudGhlbiggLT5cbiAgICAgICAgICByZXR1cm4gbGludGVyUmVnaXN0cnkubGludCh7b25DaGFuZ2U6IGZhbHNlLCBlZGl0b3JMaW50ZXJ9KVxuICAgICAgICApLnRoZW4gLT5cbiAgICAgICAgICBleHBlY3Qod2FzVXBkYXRlZCkudG9CZSh0cnVlKVxuICAgICAgICAgIGxpbnRlclJlZ2lzdHJ5LmRpc3Bvc2UoKVxuXG4gIGRlc2NyaWJlICc6OmRlbGV0ZUVkaXRvck1lc3NhZ2VzJywgLT5cbiAgICBpdCAncmVtb3ZlcyBtZXNzYWdlcyBmb3IgdGhhdCBlZGl0b3InLCAtPlxuICAgICAgd2FzVXBkYXRlZCA9IDBcbiAgICAgIHtsaW50ZXJSZWdpc3RyeSwgZWRpdG9yTGludGVyfSA9IGdldExpbnRlclJlZ2lzdHJ5KClcbiAgICAgIGVkaXRvciA9IGVkaXRvckxpbnRlci5lZGl0b3JcbiAgICAgIGxpbnRlclJlZ2lzdHJ5Lm9uRGlkVXBkYXRlTWVzc2FnZXMgKGxpbnRlckluZm8pIC0+XG4gICAgICAgIG1lc3NhZ2VSZWdpc3RyeS5zZXQobGludGVySW5mbylcbiAgICAgICAgZXhwZWN0KG1lc3NhZ2VSZWdpc3RyeS5oYXNDaGFuZ2VkKS50b0JlKHRydWUpXG4gICAgICAgIG1lc3NhZ2VSZWdpc3RyeS51cGRhdGVQdWJsaWMoKVxuICAgICAgbWVzc2FnZVJlZ2lzdHJ5Lm9uRGlkVXBkYXRlTWVzc2FnZXMgKHttZXNzYWdlc30pIC0+XG4gICAgICAgIHdhc1VwZGF0ZWQgPSAxXG4gICAgICAgIGV4cGVjdChvYmplY3RTaXplKG1lc3NhZ2VzKSkudG9CZSgxKVxuICAgICAgICBtZXNzYWdlUmVnaXN0cnkuZGVsZXRlRWRpdG9yTWVzc2FnZXMoZWRpdG9yKVxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIGxpbnRlclJlZ2lzdHJ5LmxpbnQoe29uQ2hhbmdlOiBmYWxzZSwgZWRpdG9yTGludGVyfSkudGhlbiAtPlxuICAgICAgICAgIGV4cGVjdCh3YXNVcGRhdGVkKS50b0JlKDEpXG4gICAgICAgICAgbGludGVyUmVnaXN0cnkuZGlzcG9zZSgpXG4iXX0=
