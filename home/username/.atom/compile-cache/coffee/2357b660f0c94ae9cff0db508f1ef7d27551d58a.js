(function() {
  describe('Linter Behavior', function() {
    var bottomContainer, getLinter, getMessage, linter, linterState, ref, trigger;
    linter = null;
    linterState = null;
    bottomContainer = null;
    ref = require('./common'), getLinter = ref.getLinter, trigger = ref.trigger;
    getMessage = function(type, filePath) {
      return {
        type: type,
        text: 'Some Message',
        filePath: filePath,
        range: [[0, 0], [1, 1]]
      };
    };
    beforeEach(function() {
      return waitsForPromise(function() {
        return atom.packages.activatePackage('linter').then(function() {
          linter = atom.packages.getActivePackage('linter').mainModule.instance;
          linterState = linter.state;
          return bottomContainer = linter.views.bottomContainer;
        });
      });
    });
    return describe('Bottom Tabs', function() {
      it('defaults to file tab', function() {
        return expect(linterState.scope).toBe('File');
      });
      it('changes tab on click', function() {
        trigger(bottomContainer.getTab('Project'), 'click');
        return expect(linterState.scope).toBe('Project');
      });
      it('toggles panel visibility on click', function() {
        var timesCalled;
        timesCalled = 0;
        bottomContainer.onShouldTogglePanel(function() {
          return ++timesCalled;
        });
        trigger(bottomContainer.getTab('Project'), 'click');
        expect(timesCalled).toBe(0);
        trigger(bottomContainer.getTab('Project'), 'click');
        return expect(timesCalled).toBe(1);
      });
      it('re-enables panel when another tab is clicked', function() {
        var timesCalled;
        timesCalled = 0;
        bottomContainer.onShouldTogglePanel(function() {
          return ++timesCalled;
        });
        trigger(bottomContainer.getTab('File'), 'click');
        expect(timesCalled).toBe(1);
        trigger(bottomContainer.getTab('Project'), 'click');
        return expect(timesCalled).toBe(1);
      });
      return it('updates count on pane change', function() {
        var messages, provider;
        provider = getLinter();
        expect(bottomContainer.getTab('File').count).toBe(0);
        messages = [getMessage('Error', __dirname + '/fixtures/file.txt')];
        linter.setMessages(provider, messages);
        linter.messages.updatePublic();
        return waitsForPromise(function() {
          return atom.workspace.open('file.txt').then(function() {
            expect(bottomContainer.getTab('File').count).toBe(1);
            expect(linter.views.bottomPanel.getVisibility()).toBe(true);
            return atom.workspace.open('/tmp/non-existing-file');
          }).then(function() {
            expect(bottomContainer.getTab('File').count).toBe(0);
            return expect(linter.views.bottomPanel.getVisibility()).toBe(false);
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvbGludGVyLWJlaGF2aW9yLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUEsUUFBQSxDQUFTLGlCQUFULEVBQTRCLFNBQUE7QUFDMUIsUUFBQTtJQUFBLE1BQUEsR0FBUztJQUNULFdBQUEsR0FBYztJQUNkLGVBQUEsR0FBa0I7SUFDbEIsTUFBdUIsT0FBQSxDQUFRLFVBQVIsQ0FBdkIsRUFBQyx5QkFBRCxFQUFZO0lBRVosVUFBQSxHQUFhLFNBQUMsSUFBRCxFQUFPLFFBQVA7QUFDWCxhQUFPO1FBQUMsTUFBQSxJQUFEO1FBQU8sSUFBQSxFQUFNLGNBQWI7UUFBNkIsVUFBQSxRQUE3QjtRQUF1QyxLQUFBLEVBQU8sQ0FBQyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQUQsRUFBUyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVQsQ0FBOUM7O0lBREk7SUFHYixVQUFBLENBQVcsU0FBQTthQUNULGVBQUEsQ0FBZ0IsU0FBQTtlQUNkLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZCxDQUE4QixRQUE5QixDQUF1QyxDQUFDLElBQXhDLENBQTZDLFNBQUE7VUFDM0MsTUFBQSxHQUFTLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWQsQ0FBK0IsUUFBL0IsQ0FBd0MsQ0FBQyxVQUFVLENBQUM7VUFDN0QsV0FBQSxHQUFjLE1BQU0sQ0FBQztpQkFDckIsZUFBQSxHQUFrQixNQUFNLENBQUMsS0FBSyxDQUFDO1FBSFksQ0FBN0M7TUFEYyxDQUFoQjtJQURTLENBQVg7V0FPQSxRQUFBLENBQVMsYUFBVCxFQUF3QixTQUFBO01BQ3RCLEVBQUEsQ0FBRyxzQkFBSCxFQUEyQixTQUFBO2VBQ3pCLE1BQUEsQ0FBTyxXQUFXLENBQUMsS0FBbkIsQ0FBeUIsQ0FBQyxJQUExQixDQUErQixNQUEvQjtNQUR5QixDQUEzQjtNQUdBLEVBQUEs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IG51bGxcbiAgbGludGVyU3RhdGUgPSBudWxsXG4gIGJvdHRvbUNvbnRhaW5lciA9IG51bGxcbiAge2dldExpbnRlciwgdHJpZ2dlcn0gPSByZXF1aXJlKCcuL2NvbW1vbicpXG5cbiAgZ2V0TWVzc2FnZSA9ICh0eXBlLCBmaWxlUGF0aCkgLT5cbiAgICByZXR1cm4ge3R5cGUsIHRleHQ6ICdTb21lIE1lc3NhZ2UnLCBmaWxlUGF0aCwgcmFuZ2U6IFtbMCwgMF0sIFsxLCAxXV19XG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xpbnRlcicpLnRoZW4gLT5cbiAgICAgICAgbGludGVyID0gYXRvbS5wYWNrYWdlcy5nZXRBY3RpdmVQYWNrYWdlKCdsaW50ZXInKS5tYWluTW9kdWxlLmluc3RhbmNlXG4gICAgICAgIGxpbnRlclN0YXRlID0gbGludGVyLnN0YXRlXG4gICAgICAgIGJvdHRvbUNvbnRhaW5lciA9IGxpbnRlci52aWV3cy5ib3R0b21Db250YWluZXJcblxuICBkZXNjcmliZSAnQm90dG9tIFRhYnMnLCAtPlxuICAgIGl0ICdkZWZhdWx0cyB0byBmaWxlIHRhYicsIC0+XG4gICAgICBleHBlY3QobGludGVyU3RhdGUuc2NvcGUpLnRvQmUoJ0ZpbGUnKVxuXG4gICAgaXQgJ2NoYW5nZXMgdGFiIG9uIGNsaWNrJywgLT5cbiAgICAgIHRyaWdnZXIoYm90dG9tQ29udGFpbmVyLmdldFRhYignUHJvamVjdCcpLCAnY2xpY2snKVxuICAgICAgZXhwZWN0KGxpbnRlclN0YXRlLnNjb3BlKS50b0JlKCdQcm9qZWN0JylcblxuICAgIGl0ICd0b2dnbGVzIHBhbmVsIHZpc2liaWxpdHkgb24gY2xpY2snLCAtPlxuICAgICAgIyBTZXQgdXAgZXJyb3JzLlxuICAgICAgdGltZXNDYWxsZWQgPSAwXG4gICAgICBib3R0b21Db250YWluZXIub25TaG91bGRUb2dnbGVQYW5lbCAtPiArK3RpbWVzQ2FsbGVkXG4gICAgICB0cmlnZ2VyKGJvdHRvbUNvbnRhaW5lci5nZXRUYWIoJ1Byb2plY3QnKSwgJ2NsaWNrJylcbiAgICAgIGV4cGVjdCh0aW1lc0NhbGxlZCkudG9CZSgwKVxuICAgICAgdHJpZ2dlcihib3R0b21Db250YWluZXIuZ2V0VGFiKCdQcm9qZWN0JyksICdjbGljaycpXG4gICAgICBleHBlY3QodGltZXNDYWxsZWQpLnRvQmUoMSlcblxuICAgIGl0ICdyZS1lbmFibGVzIHBhbmVsIHdoZW4gYW5vdGhlciB0YWIgaXMgY2xpY2tlZCcsIC0+XG4gICAgICAjIFNldCB1cCBlcnJvcnMuXG5cbiAgICAgIHRpbWVzQ2FsbGVkID0gMFxuICAgICAgYm90dG9tQ29udGFpbmVyLm9uU2hvdWxkVG9nZ2xlUGFuZWwgLT4gKyt0aW1lc0NhbGxlZFxuICAgICAgdHJpZ2dlcihib3R0b21Db250YWluZXIuZ2V0VGFiKCdGaWxlJyksICdjbGljaycpXG4gICAgICBleHBlY3QodGltZXNDYWxsZWQpLnRvQmUoMSlcbiAgICAgIHRyaWdnZXIoYm90dG9tQ29udGFpbmVyLmdldFRhYignUHJvamVjdCcpLCAnY2xpY2snKVxuICAgICAgZXhwZWN0KHRpbWVzQ2FsbGVkKS50b0JlKDEpXG5cbiAgICBpdCAndXBkYXRlcyBjb3VudCBvbiBwYW5lIGNoYW5nZScsIC0+XG4gICAgICBwcm92aWRlciA9IGdldExpbnRlcigpXG4gICAgICBleHBlY3QoYm90dG9tQ29udGFpbmVyLmdldFRhYignRmlsZScpLmNvdW50KS50b0JlKDApXG4gICAgICBtZXNzYWdlcyA9IFtnZXRNZXNzYWdlKCdFcnJvcicsIF9fZGlybmFtZSArICcvZml4dHVyZXMvZmlsZS50eHQnKV1cbiAgICAgIGxpbnRlci5zZXRNZXNzYWdlcyhwcm92aWRlciwgbWVzc2FnZXMpXG4gICAgICBsaW50ZXIubWVzc2FnZXMudXBkYXRlUHVibGljKClcbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCdmaWxlLnR4dCcpLnRoZW4gLT5cbiAgICAgICAgICBleHBlY3QoYm90dG9tQ29udGFpbmVyLmdldFRhYignRmlsZScpLmNvdW50KS50b0JlKDEpXG4gICAgICAgICAgZXhwZWN0KGxpbnRlci52aWV3cy5ib3R0b21QYW5lbC5nZXRWaXNpYmlsaXR5KCkpLnRvQmUodHJ1ZSlcbiAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKCcvdG1wL25vbi1leGlzdGluZy1maWxlJylcbiAgICAgICAgLnRoZW4gLT5cbiAgICAgICAgICBleHBlY3QoYm90dG9tQ29udGFpbmVyLmdldFRhYignRmlsZScpLmNvdW50KS50b0JlKDApXG4gICAgICAgICAgZXhwZWN0KGxpbnRlci52aWV3cy5ib3R0b21QYW5lbC5nZXRWaXNpYmlsaXR5KCkpLnRvQmUoZmFsc2UpXG4iXX0=
