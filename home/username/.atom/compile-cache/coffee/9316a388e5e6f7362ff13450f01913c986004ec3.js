(function() {
  var getView, getVimState, packageName, ref;

  ref = require('./spec-helper'), getVimState = ref.getVimState, getView = ref.getView;

  packageName = 'vim-mode-plus';

  describe("vim-mode-plus", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState, workspaceElement;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5], workspaceElement = ref1[6];
    beforeEach(function() {
      getVimState(function(_vimState, vim) {
        vimState = _vimState;
        editor = _vimState.editor, editorElement = _vimState.editorElement;
        return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
      });
      workspaceElement = getView(atom.workspace);
      return waitsForPromise(function() {
        return atom.packages.activatePackage('status-bar');
      });
    });
    afterEach(function() {
      if (!vimState.destroyed) {
        return vimState.resetNormalMode();
      }
    });
    describe(".activate", function() {
      it("puts the editor in normal-mode initially by default", function() {
        return ensure({
          mode: 'normal'
        });
      });
      return it("shows the current vim mode in the status bar", function() {
        var statusBarTile;
        statusBarTile = null;
        waitsFor(function() {
          return statusBarTile = workspaceElement.querySelector("#status-bar-vim-mode-plus");
        });
        return runs(function() {
          expect(statusBarTile.textContent).toBe("N");
          ensure('i', {
            mode: 'insert'
          });
          return expect(statusBarTile.textContent).toBe("I");
        });
      });
    });
    return describe(".deactivate", function() {
      it("removes the vim classes from the editor", function() {
        atom.packages.deactivatePackage(packageName);
        expect(editorElement.classList.contains("vim-mode-plus")).toBe(false);
        return expect(editorElement.classList.contains("normal-mode")).toBe(false);
      });
      return it("removes the vim commands from the editor element", function() {
        var vimCommands;
        vimCommands = function() {
          return atom.commands.findCommands({
            target: editorElement
          }).filter(function(cmd) {
            return cmd.name.startsWith("vim-mode-plus:");
          });
        };
        expect(vimCommands().length).toBeGreaterThan(0);
        atom.packages.deactivatePackage(packageName);
        return expect(vimCommands().length).toBe(0);
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL3ZpbS1tb2RlLXBsdXMtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQXlCLE9BQUEsQ0FBUSxlQUFSLENBQXpCLEVBQUMsNkJBQUQsRUFBYzs7RUFFZCxXQUFBLEdBQWM7O0VBQ2QsUUFBQSxDQUFTLGVBQVQsRUFBMEIsU0FBQTtBQUN4QixRQUFBO0lBQUEsT0FBOEUsRUFBOUUsRUFBQyxhQUFELEVBQU0sZ0JBQU4sRUFBYyxtQkFBZCxFQUF5QixnQkFBekIsRUFBaUMsdUJBQWpDLEVBQWdELGtCQUFoRCxFQUEwRDtJQUUxRCxVQUFBLENBQVcsU0FBQTtNQUNULFdBQUEsQ0FBWSxTQUFDLFNBQUQsRUFBWSxHQUFaO1FBQ1YsUUFBQSxHQUFXO1FBQ1YseUJBQUQsRUFBUztlQUNSLGFBQUQsRUFBTSxtQkFBTixFQUFjLHlCQUFkLEVBQTJCO01BSGpCLENBQVo7TUFLQSxnQkFBQSxHQUFtQixPQUFBLENBQVEsSUFBSSxDQUFDLFNBQWI7YUFFbkIsZUFBQSxDQUFnQixTQUFBO2VBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFkLENBQThCLFlBQTlCO01BRGMsQ0FBaEI7SUFSUyxDQUFYO0lBV0EsU0FBQSxDQUFVLFNBQUE7TUFDUixJQUFBLENBQWtDLFFBQVEsQ0FBQyxTQUEzQztlQUFBLFFBQVEsQ0FBQyxlQUFULENBQUEsRUFBQTs7SUFEUSxDQUFWO0lBR0EsUUFBQSxDQUFTLFdBQVQsRUFBc0IsU0FBQTtNQUNwQixFQUFBLENBQUcscURBQUgsRUFBMEQsU0FBQTtlQUN4RCxNQUFBLENBQU87VUFBQSxJQUFBLEVBQU0sUUFBTjtTQUFQO01BRHdELENBQTFEO2FBR0EsRUFBQSxDQUFHLDhDQUFILEVBQW1ELFNBQUE7QUFDakQsWUFBQTtRQUFBLGFBQUEsR0FBZ0I7UUFFaEIsUUFBQSxDQUFTLFNBQUE7aUJBQ1AsYUFBQSxHQUFnQixnQkFBZ0IsQ0FBQyxhQUFqQixDQUErQiwyQkFBL0I7UUFEVCxDQUFUO2VBR0EsSUFBQSxDQUFLLFNBQUE7VUFDSCxNQUFBLENBQU8sYUFBYSxDQUFDLFdBQXJCLENBQWlDLENBQUMsSUFBbEMsQ0FBdUMsR0FBdkM7VUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO1lBQUEsSUFBQSxFQUFNLFFBQU47V0FBWjtpQkFDQSxNQUFBLENBQU8sYUFBYSxDQUFDLFdBQXJCLENBQWlDLENBQUMsSUFBbEMsQ0FBdUMsR0FBdkM7UUFIRyxDQUFMO01BTmlELENBQW5EO0lBSm9CLENBQXRCO1dBZUEsUUFBQSxDQUFTLGFBQVQsRUFBd0IsU0FBQTtNQUN0QixFQUFBLENBQUcseUNBQUgsRUFBOEMsU0FBQTtRQUM1QyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFkLENBQWdDLFdBQWhDO1FBQ0EsTUFBQSxDQUFPLGFBQWEsQ0FBQyxTQUFTLENBQUMsUUFBeEIsQ0FBaUMsZUFBakMsQ0FBUCxDQUF5RCxDQUFDLElBQTFELENBQStELEtBQS9EO2VBQ0EsTUFBQSxDQUFPLGFBQWEsQ0FBQyxTQUFTLENBQUMsUUFBeEIsQ0FBaUMsYUFBakMsQ0FBUCxDQUF1RCxDQUFDLElBQXhELENBQTZELEtBQTdEO01BSDRDLENBQTlDO2FBS0EsRUFBQSxDQUFHLGtEQUFILEVBQXVELFNBQUE7QUFDckQsWUFBQTtRQUFBLFdBQUEsR0FBYyxTQUFBO2lCQUNaLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBZCxDQUEyQjtZQUFBLE1BQUEsRUFBUSxhQUFSO1dBQTNCLENBQWlELENBQUMsTUFBbEQsQ0FBeUQsU0FBQyxHQUFEO21CQUN2RCxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVQsQ0FBb0IsZ0JBQXBCO1VBRHVELENBQXpEO1FBRFk7UUFJZCxNQUFBLENBQU8sV0FBQSxDQUFBLENBQWEsQ0FBQyxNQUFyQixDQUE0QixDQUFDLGVBQTdCLENBQTZDLENBQTdDO1FBQ0EsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBZCxDQUFnQyxXQUFoQztlQUNBLE1BQUEsQ0FBTyxXQUFBLENBQUEsQ0FBYSxDQUFDLE1BQXJCLENBQTRCLENBQUMsSUFBN0IsQ0FBa0MsQ0FBbEM7TUFQcUQsQ0FBdkQ7SUFOc0IsQ0FBeEI7RUFoQ3dCLENBQTFCO0FBSEEiLCJzb3VyY2VzQ29udGVudCI6WyJ7Z2V0VmltU3RhdGUsIGdldFZpZXd9ID0gcmVxdWlyZSAnLi9zcGVjLWhlbHBlcidcblxucGFja2FnZU5hbWUgPSAndmltLW1vZGUtcGx1cydcbmRlc2NyaWJlIFwidmltLW1vZGUtcGx1c1wiLCAtPlxuICBbc2V0LCBlbnN1cmUsIGtleXN0cm9rZSwgZWRpdG9yLCBlZGl0b3JFbGVtZW50LCB2aW1TdGF0ZSwgd29ya3NwYWNlRWxlbWVudF0gPSBbXVxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICBnZXRWaW1TdGF0ZSAoX3ZpbVN0YXRlLCB2aW0pIC0+XG4gICAgICB2aW1TdGF0ZSA9IF92aW1TdGF0ZVxuICAgICAge2VkaXRvciwgZWRpdG9yRWxlbWVudH0gPSBfdmltU3RhdGVcbiAgICAgIHtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlfSA9IHZpbVxuXG4gICAgd29ya3NwYWNlRWxlbWVudCA9IGdldFZpZXcoYXRvbS53b3Jrc3BhY2UpXG5cbiAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdzdGF0dXMtYmFyJylcblxuICBhZnRlckVhY2ggLT5cbiAgICB2aW1TdGF0ZS5yZXNldE5vcm1hbE1vZGUoKSB1bmxlc3MgdmltU3RhdGUuZGVzdHJveWVkXG5cbiAgZGVzY3JpYmUgXCIuYWN0aXZhdGVcIiwgLT5cbiAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbiBub3JtYWwtbW9kZSBpbml0aWFsbHkgYnkgZGVmYXVsdFwiLCAtPlxuICAgICAgZW5zdXJlIG1vZGU6ICdub3JtYWwnXG5cbiAgICBpdCBcInNob3dzIHRoZSBjdXJyZW50IHZpbSBtb2RlIGluIHRoZSBzdGF0dXMgYmFyXCIsIC0+XG4gICAgICBzdGF0dXNCYXJUaWxlID0gbnVsbFxuXG4gICAgICB3YWl0c0ZvciAtPlxuICAgICAgICBzdGF0dXNCYXJUaWxlID0gd29ya3NwYWNlRWxlbWVudC5xdWVyeVNlbGVjdG9yKFwiI3N0YXR1cy1iYXItdmltLW1vZGUtcGx1c1wiKVxuXG4gICAgICBydW5zIC0+XG4gICAgICAgIGV4cGVjdChzdGF0dXNCYXJUaWxlLnRleHRDb250ZW50KS50b0JlKFwiTlwiKVxuICAgICAgICBlbnN1cmUgJ2knLCBtb2RlOiAnaW5zZXJ0J1xuICAgICAgICBleHBlY3Qoc3RhdHVzQmFyVGlsZS50ZXh0Q29udGVudCkudG9CZShcIklcIilcblxuICBkZXNjcmliZSBcIi5kZWFjdGl2YXRlXCIsIC0+XG4gICAgaXQgXCJyZW1vdmVzIHRoZSB2aW0gY2xhc3NlcyBmcm9tIHRoZSBlZGl0b3JcIiwgLT5cbiAgICAgIGF0b20ucGFja2FnZXMuZGVhY3RpdmF0ZVBhY2thZ2UocGFja2FnZU5hbWUpXG4gICAgICBleHBlY3QoZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJ2aW0tbW9kZS1wbHVzXCIpKS50b0JlKGZhbHNlKVxuICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibm9ybWFsLW1vZGVcIikpLnRvQmUoZmFsc2UpXG5cbiAgICBpdCBcInJlbW92ZXMgdGhlIHZpbSBjb21tYW5kcyBmcm9tIHRoZSBlZGl0b3IgZWxlbWVudFwiLCAtPlxuICAgICAgdmltQ29tbWFuZHMgPSAtPlxuICAgICAgICBhdG9tLmNvbW1hbmRzLmZpbmRDb21tYW5kcyh0YXJnZXQ6IGVkaXRvckVsZW1lbnQpLmZpbHRlciAoY21kKSAtPlxuICAgICAgICAgIGNtZC5uYW1lLnN0YXJ0c1dpdGgoXCJ2aW0tbW9kZS1wbHVzOlwiKVxuXG4gICAgICBleHBlY3QodmltQ29tbWFuZHMoKS5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKVxuICAgICAgYXRvbS5wYWNrYWdlcy5kZWFjdGl2YXRlUGFja2FnZShwYWNrYWdlTmFtZSlcbiAgICAgIGV4cGVjdCh2aW1Db21tYW5kcygpLmxlbmd0aCkudG9CZSgwKVxuIl19
