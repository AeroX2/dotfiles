(function() {
  describe('editor-registry', function() {
    var EditorRegistry, editorRegistry;
    EditorRegistry = require('../lib/editor-registry');
    editorRegistry = null;
    beforeEach(function() {
      waitsForPromise(function() {
        atom.workspace.destroyActivePaneItem();
        return atom.workspace.open(__dirname + '/fixtures/file.txt');
      });
      if (editorRegistry != null) {
        editorRegistry.dispose();
      }
      return editorRegistry = new EditorRegistry;
    });
    describe('::create', function() {
      it('cries when invalid TextEditor was provided', function() {
        expect(function() {
          return editorRegistry.create();
        }).toThrow();
        return expect(function() {
          return editorRegistry.create(5);
        }).toThrow();
      });
      it("adds TextEditor to it's registry", function() {
        editorRegistry.create(atom.workspace.getActiveTextEditor());
        return expect(editorRegistry.editorLinters.size).toBe(1);
      });
      return it('automatically clears the TextEditor from registry when destroyed', function() {
        editorRegistry.create(atom.workspace.getActiveTextEditor());
        atom.workspace.destroyActivePaneItem();
        return expect(editorRegistry.editorLinters.size).toBe(0);
      });
    });
    describe('::has', function() {
      return it('returns the status of existence', function() {
        var editor;
        editor = atom.workspace.getActiveTextEditor();
        expect(editorRegistry.has(1)).toBe(false);
        expect(editorRegistry.has(false)).toBe(false);
        expect(editorRegistry.has([])).toBe(false);
        expect(editorRegistry.has(editor)).toBe(false);
        editorRegistry.create(editor);
        expect(editorRegistry.has(editor)).toBe(true);
        atom.workspace.destroyActivePaneItem();
        return expect(editorRegistry.has(editor)).toBe(false);
      });
    });
    describe('::forEach', function() {
      return it('calls the callback once per editorLinter', function() {
        var timesCalled;
        editorRegistry.create(atom.workspace.getActiveTextEditor());
        timesCalled = 0;
        editorRegistry.forEach(function() {
          return ++timesCalled;
        });
        editorRegistry.forEach(function() {
          return ++timesCalled;
        });
        return expect(timesCalled).toBe(2);
      });
    });
    describe('::ofTextEditor', function() {
      it('returns undefined when invalid key is provided', function() {
        expect(editorRegistry.ofTextEditor(null)).toBeUndefined();
        expect(editorRegistry.ofTextEditor(1)).toBeUndefined();
        expect(editorRegistry.ofTextEditor(5)).toBeUndefined();
        return expect(editorRegistry.ofTextEditor('asd')).toBeUndefined();
      });
      return it('returns editorLinter when valid key is provided', function() {
        var activeEditor;
        activeEditor = atom.workspace.getActiveTextEditor();
        expect(editorRegistry.ofTextEditor(activeEditor)).toBeUndefined();
        editorRegistry.create(activeEditor);
        return expect(editorRegistry.ofTextEditor(activeEditor)).toBeDefined();
      });
    });
    describe('::ofPath', function() {
      it('returns undefined when invalid key is provided', function() {
        expect(editorRegistry.ofPath(null)).toBeUndefined();
        expect(editorRegistry.ofPath(1)).toBeUndefined();
        expect(editorRegistry.ofPath(5)).toBeUndefined();
        return expect(editorRegistry.ofPath('asd')).toBeUndefined();
      });
      return it('returns editorLinter when valid key is provided', function() {
        var activeEditor, editorPath;
        activeEditor = atom.workspace.getActiveTextEditor();
        editorPath = activeEditor.getPath();
        expect(editorRegistry.ofPath(editorPath)).toBeUndefined();
        editorRegistry.create(activeEditor);
        return expect(editorRegistry.ofPath(editorPath)).toBeDefined();
      });
    });
    describe('::observe', function() {
      it('calls with the current editorLinters', function() {
        var timesCalled;
        timesCalled = 0;
        editorRegistry.create(atom.workspace.getActiveTextEditor());
        editorRegistry.observe(function() {
          return ++timesCalled;
        });
        return expect(timesCalled).toBe(1);
      });
      return it('calls in the future with new editorLinters', function() {
        var timesCalled;
        timesCalled = 0;
        editorRegistry.observe(function() {
          return ++timesCalled;
        });
        editorRegistry.create(atom.workspace.getActiveTextEditor());
        return waitsForPromise(function() {
          return atom.workspace.open('someNonExistingFile').then(function() {
            editorRegistry.create(atom.workspace.getActiveTextEditor());
            return expect(timesCalled).toBe(2);
          });
        });
      });
    });
    return describe('::ofActiveTextEditor', function() {
      it('returns undefined if active pane is not a text editor', function() {
        return expect(editorRegistry.ofActiveTextEditor()).toBeUndefined();
      });
      return it('returns editorLinter when active pane is a text editor', function() {
        editorRegistry.create(atom.workspace.getActiveTextEditor());
        return expect(editorRegistry.ofActiveTextEditor()).toBeDefined();
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvZWRpdG9yLXJlZ2lzdHJ5LXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUEsUUFBQSxDQUFTLGlCQUFULEVBQTRCLFNBQUE7QUFDMUIsUUFBQTtJQUFBLGNBQUEsR0FBaUIsT0FBQSxDQUFRLHdCQUFSO0lBQ2pCLGNBQUEsR0FBaUI7SUFDakIsVUFBQSxDQUFXLFNBQUE7TUFDVCxlQUFBLENBQWdCLFNBQUE7UUFDZCxJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFmLENBQUE7ZUFDQSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQWYsQ0FBb0IsU0FBQSxHQUFZLG9CQUFoQztNQUZjLENBQWhCOztRQUdBLGNBQWMsQ0FBRSxPQUFoQixDQUFBOzthQUNBLGNBQUEsR0FBaUIsSUFBSTtJQUxaLENBQVg7SUFPQSxRQUFBLENBQVMsVUFBVCxFQUFxQixTQUFBO01BQ25CLEVBQUEsQ0FBRyw0Q0FBSCxFQUFpRCxTQUFBO1FBQy9DLE1BQUEsQ0FBTyxTQUFBO2lCQUNMLGNBQWMsQ0FBQyxNQUFmLENBQUE7UUFESyxDQUFQLENBRUEsQ0FBQyxPQUZELENBQUE7ZUFHQSxNQUFBLENBQU8sU0FBQTtpQkFDTCxjQUFjLENBQUMsTUFBZixDQUFzQixDQUF0QjtRQURLLENBQVAsQ0FFQSxDQUFDLE9BRkQsQ0FBQTtNQUorQyxDQUFqRDtNQU9BLEVBQUEsQ0FBRyxrQ0FBSCxFQUF1QyxTQUFBO1FBQ3JDLGNBQWMsQ0FBQyxNQUFmLENBQXNCLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQSxDQUF0QjtlQUNBLE1BQUEsQ0FBTyxjQUFjLENBQUMsYUFBYSxDQUFDLElBQXBDLENBQXlDLENBQUMsSUFBMUMsQ0FBK0MsQ0FBL0M7TUFGcUMsQ0FBdkM7YUFHQSxFQUFBLENBQUcsa0VBQUgsRUFBdUUsU0FBQTtRQUNyRSxjQUFjLENB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QSxNQUFBLENBQU8sV0FBUCxDQUFtQixDQUFDLElBQXBCLENBQXlCLENBQXpCO01BSnlDLENBQTNDO2FBS0EsRUFBQSxDQUFHLDRDQUFILEVBQWlELFNBQUE7QUFDL0MsWUFBQTtRQUFBLFdBQUEsR0FBYztRQUNkLGNBQWMsQ0FBQyxPQUFmLENBQXVCLFNBQUE7aUJBQUcsRUFBRTtRQUFMLENBQXZCO1FBQ0EsY0FBYyxDQUFDLE1BQWYsQ0FBc0IsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQXRCO2VBQ0EsZUFBQSxDQUFnQixTQUFBO2lCQUNkLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixxQkFBcEIsQ0FBMEMsQ0FBQyxJQUEzQyxDQUFnRCxTQUFBO1lBQzlDLGNBQWMsQ0FBQyxNQUFmLENBQXNCLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQSxDQUF0QjttQkFDQSxNQUFBLENBQU8sV0FBUCxDQUFtQixDQUFDLElBQXBCLENBQXlCLENBQXpCO1VBRjhDLENBQWhEO1FBRGMsQ0FBaEI7TUFKK0MsQ0FBakQ7SUFOb0IsQ0FBdEI7V0FlQSxRQUFBLENBQVMsc0JBQVQsRUFBaUMsU0FBQTtNQUMvQixFQUFBLENBQUcsdURBQUgsRUFBNEQsU0FBQTtlQUMxRCxNQUFBLENBQU8sY0FBYyxDQUFDLGtCQUFmLENBQUEsQ0FBUCxDQUEyQyxDQUFDLGFBQTVDLENBQUE7TUFEMEQsQ0FBNUQ7YUFFQSxFQUFBLENBQUcsd0RBQUgsRUFBNkQsU0FBQTtRQUMzRCxjQUFjLENBQUMsTUFBZixDQUFzQixJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUEsQ0FBdEI7ZUFDQSxNQUFBLENBQU8sY0FBYyxDQUFDLGtCQUFmLENBQUEsQ0FBUCxDQUEyQyxDQUFDLFdBQTVDLENBQUE7TUFGMkQsQ0FBN0Q7SUFIK0IsQ0FBakM7RUF0RjBCLENBQTVCO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJkZXNjcmliZSAnZWRpdG9yLXJlZ2lzdHJ5JywgLT5cbiAgRWRpdG9yUmVnaXN0cnkgPSByZXF1aXJlKCcuLi9saWIvZWRpdG9yLXJlZ2lzdHJ5JylcbiAgZWRpdG9yUmVnaXN0cnkgPSBudWxsXG4gIGJlZm9yZUVhY2ggLT5cbiAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgIGF0b20ud29ya3NwYWNlLmRlc3Ryb3lBY3RpdmVQYW5lSXRlbSgpXG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKF9fZGlybmFtZSArICcvZml4dHVyZXMvZmlsZS50eHQnKVxuICAgIGVkaXRvclJlZ2lzdHJ5Py5kaXNwb3NlKClcbiAgICBlZGl0b3JSZWdpc3RyeSA9IG5ldyBFZGl0b3JSZWdpc3RyeVxuXG4gIGRlc2NyaWJlICc6OmNyZWF0ZScsIC0+XG4gICAgaXQgJ2NyaWVzIHdoZW4gaW52YWxpZCBUZXh0RWRpdG9yIHdhcyBwcm92aWRlZCcsIC0+XG4gICAgICBleHBlY3QgLT5cbiAgICAgICAgZWRpdG9yUmVnaXN0cnkuY3JlYXRlKClcbiAgICAgIC50b1Rocm93KClcbiAgICAgIGV4cGVjdCAtPlxuICAgICAgICBlZGl0b3JSZWdpc3RyeS5jcmVhdGUoNSlcbiAgICAgIC50b1Rocm93KClcbiAgICBpdCBcImFkZHMgVGV4dEVkaXRvciB0byBpdCdzIHJlZ2lzdHJ5XCIsIC0+XG4gICAgICBlZGl0b3JSZWdpc3RyeS5jcmVhdGUoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKVxuICAgICAgZXhwZWN0KGVkaXRvclJlZ2lzdHJ5LmVkaXRvckxpbnRlcnMuc2l6ZSkudG9CZSgxKVxuICAgIGl0ICdhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgVGV4dEVkaXRvciBmcm9tIHJlZ2lzdHJ5IHdoZW4gZGVzdHJveWVkJywgLT5cbiAgICAgIGVkaXRvclJlZ2lzdHJ5LmNyZWF0ZShhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkpXG4gICAgICBhdG9tLndvcmtzcGFjZS5kZXN0cm95QWN0aXZlUGFuZUl0ZW0oKVxuICAgICAgZXhwZWN0KGVkaXRvclJlZ2lzdHJ5LmVkaXRvckxpbnRlcnMuc2l6ZSkudG9CZSgwKVxuXG4gIGRlc2NyaWJlICc6OmhhcycsIC0+XG4gICAgaXQgJ3JldHVybnMgdGhlIHN0YXR1cyBvZiBleGlzdGVuY2UnLCAtPlxuICAgICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgICBleHBlY3QoZWRpdG9yUmVnaXN0cnkuaGFzKDEpKS50b0JlKGZhbHNlKVxuICAgICAgZXhwZWN0KGVkaXRvclJlZ2lzdHJ5LmhhcyhmYWxzZSkpLnRvQmUoZmFsc2UpXG4gICAgICBleHBlY3QoZWRpdG9yUmVnaXN0cnkuaGFzKFtdKSkudG9CZShmYWxzZSlcbiAgICAgIGV4cGVjdChlZGl0b3JSZWdpc3RyeS5oYXMoZWRpdG9yKSkudG9CZShmYWxzZSlcbiAgICAgIGVkaXRvclJlZ2lzdHJ5LmNyZWF0ZShlZGl0b3IpXG4gICAgICBleHBlY3QoZWRpdG9yUmVnaXN0cnkuaGFzKGVkaXRvcikpLnRvQmUodHJ1ZSlcbiAgICAgIGF0b20ud29ya3NwYWNlLmRlc3Ryb3lBY3RpdmVQYW5lSXRlbSgpXG4gICAgICBleHBlY3QoZWRpdG9yUmVnaXN0cnkuaGFzKGVkaXRvcikpLnRvQmUoZmFsc2UpXG5cbiAgZGVzY3JpYmUgJzo6Zm9yRWFjaCcsIC0+XG4gICAgaXQgJ2NhbGxzIHRoZSBjYWxsYmFjayBvbmNlIHBlciBlZGl0b3JMaW50ZXInLCAtPlxuICAgICAgZWRpdG9yUmVnaXN0cnkuY3JlYXRlKGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSlcbiAgICAgIHRpbWVzQ2FsbGVkID0gMFxuICAgICAgZWRpdG9yUmVnaXN0cnkuZm9yRWFjaCAtPiArK3RpbWVzQ2FsbGVkXG4gICAgICBlZGl0b3JSZWdpc3RyeS5mb3JFYWNoIC0+ICsrdGltZXNDYWxsZWRcbiAgICAgIGV4cGVjdCh0aW1lc0NhbGxlZCkudG9CZSgyKVxuXG4gIGRlc2NyaWJlICc6Om9mVGV4dEVkaXRvcicsIC0+XG4gICAgaXQgJ3JldHVybnMgdW5kZWZpbmVkIHdoZW4gaW52YWxpZCBrZXkgaXMgcHJvdmlkZWQnLCAtPlxuICAgICAgZXhwZWN0KGVkaXRvclJlZ2lzdHJ5Lm9mVGV4dEVkaXRvcihudWxsKSkudG9CZVVuZGVmaW5lZCgpXG4gICAgICBleHBlY3QoZWRpdG9yUmVnaXN0cnkub2ZUZXh0RWRpdG9yKDEpKS50b0JlVW5kZWZpbmVkKClcbiAgICAgIGV4cGVjdChlZGl0b3JSZWdpc3RyeS5vZlRleHRFZGl0b3IoNSkpLnRvQmVVbmRlZmluZWQoKVxuICAgICAgZXhwZWN0KGVkaXRvclJlZ2lzdHJ5Lm9mVGV4dEVkaXRvcignYXNkJykpLnRvQmVVbmRlZmluZWQoKVxuICAgIGl0ICdyZXR1cm5zIGVkaXRvckxpbnRlciB3aGVuIHZhbGlkIGtleSBpcyBwcm92aWRlZCcsIC0+XG4gICAgICBhY3RpdmVFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgIGV4cGVjdChlZGl0b3JSZWdpc3RyeS5vZlRleHRFZGl0b3IoYWN0aXZlRWRpdG9yKSkudG9CZVVuZGVmaW5lZCgpXG4gICAgICBlZGl0b3JSZWdpc3RyeS5jcmVhdGUoYWN0aXZlRWRpdG9yKVxuICAgICAgZXhwZWN0KGVkaXRvclJlZ2lzdHJ5Lm9mVGV4dEVkaXRvcihhY3RpdmVFZGl0b3IpKS50b0JlRGVmaW5lZCgpXG5cbiAgZGVzY3JpYmUgJzo6b2ZQYXRoJywgLT5cbiAgICBpdCAncmV0dXJucyB1bmRlZmluZWQgd2hlbiBpbnZhbGlkIGtleSBpcyBwcm92aWRlZCcsIC0+XG4gICAgICBleHBlY3QoZWRpdG9yUmVnaXN0cnkub2ZQYXRoKG51bGwpKS50b0JlVW5kZWZpbmVkKClcbiAgICAgIGV4cGVjdChlZGl0b3JSZWdpc3RyeS5vZlBhdGgoMSkpLnRvQmVVbmRlZmluZWQoKVxuICAgICAgZXhwZWN0KGVkaXRvclJlZ2lzdHJ5Lm9mUGF0aCg1KSkudG9CZVVuZGVmaW5lZCgpXG4gICAgICBleHBlY3QoZWRpdG9yUmVnaXN0cnkub2ZQYXRoKCdhc2QnKSkudG9CZVVuZGVmaW5lZCgpXG4gICAgaXQgJ3JldHVybnMgZWRpdG9yTGludGVyIHdoZW4gdmFsaWQga2V5IGlzIHByb3ZpZGVkJywgLT5cbiAgICAgIGFjdGl2ZUVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgICAgZWRpdG9yUGF0aCA9IGFjdGl2ZUVkaXRvci5nZXRQYXRoKClcbiAgICAgIGV4cGVjdChlZGl0b3JSZWdpc3RyeS5vZlBhdGgoZWRpdG9yUGF0aCkpLnRvQmVVbmRlZmluZWQoKVxuICAgICAgZWRpdG9yUmVnaXN0cnkuY3JlYXRlKGFjdGl2ZUVkaXRvcilcbiAgICAgIGV4cGVjdChlZGl0b3JSZWdpc3RyeS5vZlBhdGgoZWRpdG9yUGF0aCkpLnRvQmVEZWZpbmVkKClcblxuICBkZXNjcmliZSAnOjpvYnNlcnZlJywgLT5cbiAgICBpdCAnY2FsbHMgd2l0aCB0aGUgY3VycmVudCBlZGl0b3JMaW50ZXJzJywgLT5cbiAgICAgIHRpbWVzQ2FsbGVkID0gMFxuICAgICAgZWRpdG9yUmVnaXN0cnkuY3JlYXRlKGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSlcbiAgICAgIGVkaXRvclJlZ2lzdHJ5Lm9ic2VydmUgLT4gKyt0aW1lc0NhbGxlZFxuICAgICAgZXhwZWN0KHRpbWVzQ2FsbGVkKS50b0JlKDEpXG4gICAgaXQgJ2NhbGxzIGluIHRoZSBmdXR1cmUgd2l0aCBuZXcgZWRpdG9yTGludGVycycsIC0+XG4gICAgICB0aW1lc0NhbGxlZCA9IDBcbiAgICAgIGVkaXRvclJlZ2lzdHJ5Lm9ic2VydmUgLT4gKyt0aW1lc0NhbGxlZFxuICAgICAgZWRpdG9yUmVnaXN0cnkuY3JlYXRlKGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKSlcbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCdzb21lTm9uRXhpc3RpbmdGaWxlJykudGhlbiAtPlxuICAgICAgICAgIGVkaXRvclJlZ2lzdHJ5LmNyZWF0ZShhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkpXG4gICAgICAgICAgZXhwZWN0KHRpbWVzQ2FsbGVkKS50b0JlKDIpXG5cbiAgZGVzY3JpYmUgJzo6b2ZBY3RpdmVUZXh0RWRpdG9yJywgLT5cbiAgICBpdCAncmV0dXJucyB1bmRlZmluZWQgaWYgYWN0aXZlIHBhbmUgaXMgbm90IGEgdGV4dCBlZGl0b3InLCAtPlxuICAgICAgZXhwZWN0KGVkaXRvclJlZ2lzdHJ5Lm9mQWN0aXZlVGV4dEVkaXRvcigpKS50b0JlVW5kZWZpbmVkKClcbiAgICBpdCAncmV0dXJucyBlZGl0b3JMaW50ZXIgd2hlbiBhY3RpdmUgcGFuZSBpcyBhIHRleHQgZWRpdG9yJywgLT5cbiAgICAgIGVkaXRvclJlZ2lzdHJ5LmNyZWF0ZShhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkpXG4gICAgICBleHBlY3QoZWRpdG9yUmVnaXN0cnkub2ZBY3RpdmVUZXh0RWRpdG9yKCkpLnRvQmVEZWZpbmVkKClcbiJdfQ==
