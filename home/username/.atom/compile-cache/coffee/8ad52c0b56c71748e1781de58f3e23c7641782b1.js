(function() {
  describe('Commands', function() {
    var getMessage, linter;
    linter = null;
    beforeEach(function() {
      return waitsForPromise(function() {
        return atom.packages.activatePackage('linter').then(function() {
          linter = atom.packages.getActivePackage('linter').mainModule.instance;
          return atom.workspace.open(__dirname + '/fixtures/file.txt');
        });
      });
    });
    getMessage = require('./common').getMessage;
    describe('linter:togglePanel', function() {
      return it('toggles the panel visibility', function() {
        var visibility;
        linter.views.bottomPanel.scope = 'Project';
        linter.getActiveEditorLinter().addMessage(getMessage('Error'));
        linter.views.render({
          added: [getMessage('Error')],
          removed: [],
          messages: []
        });
        visibility = linter.views.bottomPanel.getVisibility();
        expect(visibility).toBe(true);
        linter.commands.togglePanel();
        expect(linter.views.bottomPanel.getVisibility()).toBe(!visibility);
        linter.commands.togglePanel();
        return expect(linter.views.bottomPanel.getVisibility()).toBe(visibility);
      });
    });
    return describe('linter:toggle', function() {
      return it('relint when enabled', function() {
        return waitsForPromise(function() {
          return atom.workspace.open(__dirname + '/fixtures/file.txt').then(function() {
            spyOn(linter.commands, 'lint');
            linter.commands.toggleLinter();
            linter.commands.toggleLinter();
            return expect(linter.commands.lint).toHaveBeenCalled();
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvY29tbWFuZHMtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxRQUFBLENBQVMsVUFBVCxFQUFxQixTQUFBO0FBQ25CLFFBQUE7SUFBQSxNQUFBLEdBQVM7SUFFVCxVQUFBLENBQVcsU0FBQTthQUNULGVBQUEsQ0FBZ0IsU0FBQTtlQUNkLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4QixRQUE5QixDQUF1QyxDQUFDLElBQXhDLENBQTZDLFNBQUE7VUFDM0MsTUFBQSxHQUFTLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWQsQ0FBK0IsUUFBL0IsQ0FBd0MsQ0FBQyxVQUFVLENBQUM7aUJBQzdELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixTQUFBLEdBQVksb0JBQWhDO1FBRjJDLENBQTdDO01BRGMsQ0FBaEI7SUFEUyxDQUFYO0lBTUMsYUFBYyxPQUFBLENBQVEsVUFBUjtJQUVmLFFBQUEsQ0FBUyxvQkFBVCxFQUErQixTQUFBO2FBQzdCLEVBQUEsQ0FBRyw4QkFBSCxFQUFtQyxTQUFBO0FBRWpDLFlBQUE7UUFBQSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUF6QixHQUFpQztRQUNqQyxNQUFNLENBQUMscUJBQVAsQ0FBQSxDQUE4QixDQUFDLFVBQS9CLENBQTBDLFVBQUEsQ0FBVyxPQUFYLENBQTFDO1FBQ0EsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFiLENBQW9CO1VBQUMsS0FBQSxFQUFPLENBQUMsVUFBQSxDQUFXLE9BQVgsQ0FBRCxDQUFSO1VBQStCLE9BQUEsRUFBUyxFQUF4QztVQUE0QyxRQUFBLEVBQVUsRUFBdEQ7U0FBcEI7UUFFQSxVQUFBLEdBQWEsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsYUFBekIsQ0FBQTtRQUNiLE1BQUEsQ0FBTyxVQUFQLENBQWtCLENBQUMsSUFBbkIsQ0FBd0IsSUFBeEI7UUFDQSxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQWhCLENBQUE7UUFDQSxNQUFBLENBQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsYUFBekIsQ0FBQSxDQUFQLENBQWdELENBQUMsSUFBakQsQ0FBc0QsQ0FBSSxVQUExRDtRQUNBLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBaEIsQ0FBQTtlQUNBLE1BQUEsQ0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxhQUF6QixDQUFBLENBQVAsQ0FBZ0QsQ0FBQyxJQUFqRCxDQUFzRCxVQUF0RDtNQVhpQyxDQUFuQztJQUQ2QixDQUEvQjtXQWNBLFFBQUEsQ0FBUyxlQUFULEVBQTBCLFNBQUE7YUFDeEIsRUFBQSxDQUFHLHFCQUFILEVBQTBCLFNBQUE7ZUFDeEIsZUFBQSxDQUFnQixTQUFBO2lCQUNkLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixTQUFBLEdBQVksb0JBQWhDLENBQXFELENBQUMsSUFBdEQsQ0FBMkQsU0FBQTtZQUN6RCxLQUFBLENBQU0sTUFBTSxDQUFDLFFBQWIsRUFBdUIsTUFBdkI7WUFDQSxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQWhCLENBQUE7WUFDQSxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQWhCLENBQUE7bUJBQ0EsTUFBQSxDQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBdkIsQ0FBNEIsQ0FBQyxnQkFBN0IsQ0FBQTtVQUp5RCxDQUEzRDtRQURjLENBQWhCO01BRHdCLENBQTFCO0lBRHdCLENBQTFCO0VBekJtQixDQUFyQjtBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiZGVzY3JpYmUgJ0NvbW1hbmRzJywgLT5cbiAgbGludGVyID0gbnVsbFxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsaW50ZXInKS50aGVuIC0+XG4gICAgICAgIGxpbnRlciA9IGF0b20ucGFja2FnZXMuZ2V0QWN0aXZlUGFja2FnZSgnbGludGVyJykubWFpbk1vZHVsZS5pbnN0YW5jZVxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKF9fZGlybmFtZSArICcvZml4dHVyZXMvZmlsZS50eHQnKVxuXG4gIHtnZXRNZXNzYWdlfSA9IHJlcXVpcmUoJy4vY29tbW9uJylcblxuICBkZXNjcmliZSAnbGludGVyOnRvZ2dsZVBhbmVsJywgLT5cbiAgICBpdCAndG9nZ2xlcyB0aGUgcGFuZWwgdmlzaWJpbGl0eScsIC0+XG4gICAgICAjIFNldCB1cCB2aXNpYmlsaXR5LlxuICAgICAgbGludGVyLnZpZXdzLmJvdHRvbVBhbmVsLnNjb3BlID0gJ1Byb2plY3QnXG4gICAgICBsaW50ZXIuZ2V0QWN0aXZlRWRpdG9yTGludGVyKCkuYWRkTWVzc2FnZShnZXRNZXNzYWdlKCdFcnJvcicpKVxuICAgICAgbGludGVyLnZpZXdzLnJlbmRlcih7YWRkZWQ6IFtnZXRNZXNzYWdlKCdFcnJvcicpXSwgcmVtb3ZlZDogW10sIG1lc3NhZ2VzOiBbXX0pXG5cbiAgICAgIHZpc2liaWxpdHkgPSBsaW50ZXIudmlld3MuYm90dG9tUGFuZWwuZ2V0VmlzaWJpbGl0eSgpXG4gICAgICBleHBlY3QodmlzaWJpbGl0eSkudG9CZSh0cnVlKVxuICAgICAgbGludGVyLmNvbW1hbmRzLnRvZ2dsZVBhbmVsKClcbiAgICAgIGV4cGVjdChsaW50ZXIudmlld3MuYm90dG9tUGFuZWwuZ2V0VmlzaWJpbGl0eSgpKS50b0JlKG5vdCB2aXNpYmlsaXR5KVxuICAgICAgbGludGVyLmNvbW1hbmRzLnRvZ2dsZVBhbmVsKClcbiAgICAgIGV4cGVjdChsaW50ZXIudmlld3MuYm90dG9tUGFuZWwuZ2V0VmlzaWJpbGl0eSgpKS50b0JlKHZpc2liaWxpdHkpXG5cbiAgZGVzY3JpYmUgJ2xpbnRlcjp0b2dnbGUnLCAtPlxuICAgIGl0ICdyZWxpbnQgd2hlbiBlbmFibGVkJywgLT5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKF9fZGlybmFtZSArICcvZml4dHVyZXMvZmlsZS50eHQnKS50aGVuIC0+XG4gICAgICAgICAgc3B5T24obGludGVyLmNvbW1hbmRzLCAnbGludCcpXG4gICAgICAgICAgbGludGVyLmNvbW1hbmRzLnRvZ2dsZUxpbnRlcigpXG4gICAgICAgICAgbGludGVyLmNvbW1hbmRzLnRvZ2dsZUxpbnRlcigpXG4gICAgICAgICAgZXhwZWN0KGxpbnRlci5jb21tYW5kcy5saW50KS50b0hhdmVCZWVuQ2FsbGVkKClcbiJdfQ==
