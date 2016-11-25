(function() {
  describe('BottomPanelMount', function() {
    var ref, statusBar, statusBarService, workspaceElement;
    ref = [], statusBar = ref[0], statusBarService = ref[1], workspaceElement = ref[2];
    beforeEach(function() {
      workspaceElement = atom.views.getView(atom.workspace);
      waitsForPromise(function() {
        return atom.packages.activatePackage('status-bar').then(function(pack) {
          statusBar = workspaceElement.querySelector('status-bar');
          return statusBarService = pack.mainModule.provideStatusBar();
        });
      });
      waitsForPromise(function() {
        return atom.packages.activatePackage('linter').then(function() {
          return atom.packages.getActivePackage('linter').mainModule.consumeStatusBar(statusBar);
        });
      });
      return waitsForPromise(function() {
        return atom.workspace.open();
      });
    });
    it('can mount to left status-bar', function() {
      var tile;
      tile = statusBar.getLeftTiles()[0];
      return expect(tile.item.localName).toBe('linter-bottom-container');
    });
    it('can mount to right status-bar', function() {
      var tile;
      atom.config.set('linter.statusIconPosition', 'Right');
      tile = statusBar.getRightTiles()[0];
      return expect(tile.item.localName).toBe('linter-bottom-container');
    });
    return it('defaults to visible', function() {
      var tile;
      tile = statusBar.getLeftTiles()[0];
      return expect(tile.item.visibility).toBe(true);
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvdWkvYm90dG9tLXBhbmVsLW1vdW50LXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUEsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7QUFDM0IsUUFBQTtJQUFBLE1BQWtELEVBQWxELEVBQUMsa0JBQUQsRUFBWSx5QkFBWixFQUE4QjtJQUM5QixVQUFBLENBQVcsU0FBQTtNQUNULGdCQUFBLEdBQW1CLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFJLENBQUMsU0FBeEI7TUFDbkIsZUFBQSxDQUFnQixTQUFBO2VBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFkLENBQThCLFlBQTlCLENBQTJDLENBQUMsSUFBNUMsQ0FBaUQsU0FBQyxJQUFEO1VBQy9DLFNBQUEsR0FBWSxnQkFBZ0IsQ0FBQyxhQUFqQixDQUErQixZQUEvQjtpQkFDWixnQkFBQSxHQUFtQixJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFoQixDQUFBO1FBRjRCLENBQWpEO01BRGMsQ0FBaEI7TUFJQSxlQUFBLENBQWdCLFNBQUE7ZUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsUUFBOUIsQ0FBdUMsQ0FBQyxJQUF4QyxDQUE2QyxTQUFBO2lCQUMzQyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFkLENBQStCLFFBQS9CLENBQXdDLENBQUMsVUFBVSxDQUFDLGdCQUFwRCxDQUFxRSxTQUFyRTtRQUQyQyxDQUE3QztNQURjLENBQWhCO2FBR0EsZUFBQSxDQUFnQixTQUFBO2VBQ2QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQUE7TUFEYyxDQUFoQjtJQVRTLENBQVg7SUFZQSxFQUFBLENBQUcsOEJBQUgsRUFBbUMsU0FBQTtBQUNqQyxVQUFBO01BQUEsSUFBQSxHQUFPLFNBQVMsQ0FBQyxZQUFWLENBQUEsQ0FBeUIsQ0FBQSxDQUFBO2FBQ2hDLE1BQUEsQ0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQWpCLENBQTJCLENBQUMsSUFBNUIsQ0FBaUMseUJBQWpDO0lBRmlDLENBQW5DO0lBSUEsRUFBQSxDQUFHLCtCQUFILEVBQW9DLFNBQUE7QUFDbEMsVUFBQTtNQUFBLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwyQkFBaEIsRUFBNkMsT0FBN0M7TUFDQSxJQUFBLEdBQU8sU0FBUyxDQUFDLGFBQVYsQ0FBQSxDQUEwQixDQUFBLENBQUE7YUFDakMsTUFBQSxDQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBakIsQ0FBMkIsQ0FBQyxJQUE1QixDQUFpQyx5QkFBakM7SUFIa0MsQ0FBcEM7V0FLQSxFQUFBLENBQUcscUJBQUgsRUFBMEIsU0FBQTtBQUN4QixVQUFBO01BQUEsSUFBQSxHQUFPLFNBQVMsQ0FBQyxZQUFWLENBQUEsQ0FBeUIsQ0FBQSxDQUFBO2FBQ2hDLE1BQUEsQ0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQWpCLENBQTRCLENBQUMsSUFBN0IsQ0FBa0MsSUFBbEM7SUFGd0IsQ0FBMUI7RUF2QjJCLENBQTdCO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJkZXNjcmliZSAnQm90dG9tUGFuZWxNb3VudCcsIC0+XG4gIFtzdGF0dXNCYXIsIHN0YXR1c0JhclNlcnZpY2UsIHdvcmtzcGFjZUVsZW1lbnRdID0gW11cbiAgYmVmb3JlRWFjaCAtPlxuICAgIHdvcmtzcGFjZUVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpXG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnc3RhdHVzLWJhcicpLnRoZW4gKHBhY2spIC0+XG4gICAgICAgIHN0YXR1c0JhciA9IHdvcmtzcGFjZUVsZW1lbnQucXVlcnlTZWxlY3Rvcignc3RhdHVzLWJhcicpXG4gICAgICAgIHN0YXR1c0JhclNlcnZpY2UgPSBwYWNrLm1haW5Nb2R1bGUucHJvdmlkZVN0YXR1c0JhcigpXG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbGludGVyJykudGhlbiAtPlxuICAgICAgICBhdG9tLnBhY2thZ2VzLmdldEFjdGl2ZVBhY2thZ2UoJ2xpbnRlcicpLm1haW5Nb2R1bGUuY29uc3VtZVN0YXR1c0JhcihzdGF0dXNCYXIpXG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKClcblxuICBpdCAnY2FuIG1vdW50IHRvIGxlZnQgc3RhdHVzLWJhcicsIC0+XG4gICAgdGlsZSA9IHN0YXR1c0Jhci5nZXRMZWZ0VGlsZXMoKVswXVxuICAgIGV4cGVjdCh0aWxlLml0ZW0ubG9jYWxOYW1lKS50b0JlKCdsaW50ZXItYm90dG9tLWNvbnRhaW5lcicpXG5cbiAgaXQgJ2NhbiBtb3VudCB0byByaWdodCBzdGF0dXMtYmFyJywgLT5cbiAgICBhdG9tLmNvbmZpZy5zZXQoJ2xpbnRlci5zdGF0dXNJY29uUG9zaXRpb24nLCAnUmlnaHQnKVxuICAgIHRpbGUgPSBzdGF0dXNCYXIuZ2V0UmlnaHRUaWxlcygpWzBdXG4gICAgZXhwZWN0KHRpbGUuaXRlbS5sb2NhbE5hbWUpLnRvQmUoJ2xpbnRlci1ib3R0b20tY29udGFpbmVyJylcblxuICBpdCAnZGVmYXVsdHMgdG8gdmlzaWJsZScsIC0+XG4gICAgdGlsZSA9IHN0YXR1c0Jhci5nZXRMZWZ0VGlsZXMoKVswXVxuICAgIGV4cGVjdCh0aWxlLml0ZW0udmlzaWJpbGl0eSkudG9CZSh0cnVlKVxuIl19
