(function() {
  var TextData, dispatch, getView, getVimState, rawKeystroke, ref, settings, withMockPlatform;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData, getView = ref.getView, withMockPlatform = ref.withMockPlatform, rawKeystroke = ref.rawKeystroke;

  settings = require('../lib/settings');

  describe("Operator modifier", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      getVimState(function(state, vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
      });
      return runs(function() {
        return jasmine.attachToDOM(editorElement);
      });
    });
    afterEach(function() {
      return vimState.resetNormalMode();
    });
    return describe("operator-modifier to force wise", function() {
      beforeEach(function() {
        return set({
          text: "012345 789\nABCDEF EFG"
        });
      });
      describe("operator-modifier-characterwise", function() {
        describe("when target is linewise", function() {
          return it("operate characterwisely and exclusively", function() {
            set({
              cursor: [0, 1]
            });
            return ensure("d v j", {
              text: "0BCDEF EFG"
            });
          });
        });
        return describe("when target is characterwise", function() {
          it("operate inclusively for exclusive target", function() {
            set({
              cursor: [0, 9]
            });
            return ensure("d v b", {
              cursor: [0, 6],
              text_: "012345_\nABCDEF EFG"
            });
          });
          return it("operate exclusively for inclusive target", function() {
            set({
              cursor: [0, 0]
            });
            return ensure("d v e", {
              cursor: [0, 0],
              text: "5 789\nABCDEF EFG"
            });
          });
        });
      });
      return describe("operator-modifier-linewise", function() {
        return it("operate linewisely for characterwise target", function() {
          set({
            cursor: [0, 1]
          });
          return ensure([
            'd V /', {
              search: 'DEF'
            }
          ], {
            cursor: [0, 0],
            text: ""
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL29wZXJhdG9yLW1vZGlmaWVyLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUE2RSxPQUFBLENBQVEsZUFBUixDQUE3RSxFQUFDLDZCQUFELEVBQWMsdUJBQWQsRUFBd0IsdUJBQXhCLEVBQWtDLHFCQUFsQyxFQUEyQyx1Q0FBM0MsRUFBNkQ7O0VBQzdELFFBQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0VBRVgsUUFBQSxDQUFTLG1CQUFULEVBQThCLFNBQUE7QUFDNUIsUUFBQTtJQUFBLE9BQTRELEVBQTVELEVBQUMsYUFBRCxFQUFNLGdCQUFOLEVBQWMsbUJBQWQsRUFBeUIsZ0JBQXpCLEVBQWlDLHVCQUFqQyxFQUFnRDtJQUVoRCxVQUFBLENBQVcsU0FBQTtNQUNULFdBQUEsQ0FBWSxTQUFDLEtBQUQsRUFBUSxHQUFSO1FBQ1YsUUFBQSxHQUFXO1FBQ1Ysd0JBQUQsRUFBUztlQUNSLGFBQUQsRUFBTSxtQkFBTixFQUFjLHlCQUFkLEVBQTJCO01BSGpCLENBQVo7YUFLQSxJQUFBLENBQUssU0FBQTtlQUNILE9BQU8sQ0FBQyxXQUFSLENBQW9CLGFBQXBCO01BREcsQ0FBTDtJQU5TLENBQVg7SUFTQSxTQUFBLENBQVUsU0FBQTthQUNSLFFBQVEsQ0FBQyxlQUFULENBQUE7SUFEUSxDQUFWO1dBR0EsUUFBQSxDQUFTLGlDQUFULEVBQTRDLFNBQUE7TUFDMUMsVUFBQSxDQUFXLFNBQUE7ZUFDVCxHQUFBLENBQ0U7VUFBQSxJQUFBLEVBQU0sd0JBQU47U0FERjtNQURTLENBQVg7TUFNQSxRQUFBLENBQVMsaUNBQVQsRUFBNEMsU0FBQTtRQUMxQyxRQUFBLENBQVMseUJBQVQsRUFBb0MsU0FBQTtpQkFDbEMsRUFBQSxDQUFHLHlDQUFILEVBQThDLFNBQUE7WUFDNUMsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFKO21CQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQ0U7Y0FBQSxJQUFBLEVBQU0sWUFBTjthQURGO1VBRjRDLENBQTlDO1FBRGtDLENBQXBDO2VBT0EsUUFBQSxDQUFTLDhCQUFULEVBQXlDLFNBQUE7VUFDdkMsRUFBQSxDQUFHLDBDQUFILEVBQStDLFNBQUE7WUFDN0MsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFKO21CQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQ0U7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2NBQ0EsS0FBQSxFQUFPLHFCQURQO2FBREY7VUFGNkMsQ0FBL0M7aUJBUUEsRUFBQSxDQUFHLDBDQUFILEVBQStDLFNBQUE7WUFDN0MsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFKO21CQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQ0U7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2NBQ0EsSUFBQSxFQUFNLG1CQUROO2FBREY7VUFGNkMsQ0FBL0M7UUFUdUMsQ0FBekM7TUFSMEMsQ0FBNUM7YUF5QkEsUUFBQSxDQUFTLDRCQUFULEVBQXVDLFNBQUE7ZUFDckMsRUFBQSxDQUFHLDZDQUFILEVBQWtELFNBQUE7VUFDaEQsR0FBQSxDQUFJO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFKO2lCQUNBLE1BQUEsQ0FBTztZQUFDLE9BQUQsRUFBVTtjQUFBLE1BQUEsRUFBUSxLQUFSO2FBQVY7V0FBUCxFQUNFO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtZQUNBLElBQUEsRUFBTSxFQUROO1dBREY7UUFGZ0QsQ0FBbEQ7TUFEcUMsQ0FBdkM7SUFoQzBDLENBQTVDO0VBZjRCLENBQTlCO0FBSEEiLCJzb3VyY2VzQ29udGVudCI6WyJ7Z2V0VmltU3RhdGUsIGRpc3BhdGNoLCBUZXh0RGF0YSwgZ2V0Vmlldywgd2l0aE1vY2tQbGF0Zm9ybSwgcmF3S2V5c3Ryb2tlfSA9IHJlcXVpcmUgJy4vc3BlYy1oZWxwZXInXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4uL2xpYi9zZXR0aW5ncydcblxuZGVzY3JpYmUgXCJPcGVyYXRvciBtb2RpZmllclwiLCAtPlxuICBbc2V0LCBlbnN1cmUsIGtleXN0cm9rZSwgZWRpdG9yLCBlZGl0b3JFbGVtZW50LCB2aW1TdGF0ZV0gPSBbXVxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICBnZXRWaW1TdGF0ZSAoc3RhdGUsIHZpbSkgLT5cbiAgICAgIHZpbVN0YXRlID0gc3RhdGVcbiAgICAgIHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9ID0gdmltU3RhdGVcbiAgICAgIHtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlfSA9IHZpbVxuXG4gICAgcnVucyAtPlxuICAgICAgamFzbWluZS5hdHRhY2hUb0RPTShlZGl0b3JFbGVtZW50KVxuXG4gIGFmdGVyRWFjaCAtPlxuICAgIHZpbVN0YXRlLnJlc2V0Tm9ybWFsTW9kZSgpXG5cbiAgZGVzY3JpYmUgXCJvcGVyYXRvci1tb2RpZmllciB0byBmb3JjZSB3aXNlXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAwMTIzNDUgNzg5XG4gICAgICAgIEFCQ0RFRiBFRkdcbiAgICAgICAgXCJcIlwiXG4gICAgZGVzY3JpYmUgXCJvcGVyYXRvci1tb2RpZmllci1jaGFyYWN0ZXJ3aXNlXCIsIC0+XG4gICAgICBkZXNjcmliZSBcIndoZW4gdGFyZ2V0IGlzIGxpbmV3aXNlXCIsIC0+XG4gICAgICAgIGl0IFwib3BlcmF0ZSBjaGFyYWN0ZXJ3aXNlbHkgYW5kIGV4Y2x1c2l2ZWx5XCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDFdXG4gICAgICAgICAgZW5zdXJlIFwiZCB2IGpcIixcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMEJDREVGIEVGR1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICBkZXNjcmliZSBcIndoZW4gdGFyZ2V0IGlzIGNoYXJhY3Rlcndpc2VcIiwgLT5cbiAgICAgICAgaXQgXCJvcGVyYXRlIGluY2x1c2l2ZWx5IGZvciBleGNsdXNpdmUgdGFyZ2V0XCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDldXG4gICAgICAgICAgZW5zdXJlIFwiZCB2IGJcIixcbiAgICAgICAgICAgIGN1cnNvcjogWzAsIDZdXG4gICAgICAgICAgICB0ZXh0XzogXCJcIlwiXG4gICAgICAgICAgICAwMTIzNDVfXG4gICAgICAgICAgICBBQkNERUYgRUZHXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgaXQgXCJvcGVyYXRlIGV4Y2x1c2l2ZWx5IGZvciBpbmNsdXNpdmUgdGFyZ2V0XCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgZW5zdXJlIFwiZCB2IGVcIixcbiAgICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDUgNzg5XG4gICAgICAgICAgICBBQkNERUYgRUZHXG4gICAgICAgICAgICBcIlwiXCJcbiAgICBkZXNjcmliZSBcIm9wZXJhdG9yLW1vZGlmaWVyLWxpbmV3aXNlXCIsIC0+XG4gICAgICBpdCBcIm9wZXJhdGUgbGluZXdpc2VseSBmb3IgY2hhcmFjdGVyd2lzZSB0YXJnZXRcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGVuc3VyZSBbJ2QgViAvJywgc2VhcmNoOiAnREVGJ10sXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICB0ZXh0OiBcIlwiXG4iXX0=
