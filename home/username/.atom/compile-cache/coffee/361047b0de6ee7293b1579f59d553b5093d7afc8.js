(function() {
  var TextData, dispatch, getVimState, ref, settings;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData;

  settings = require('../lib/settings');

  describe("Motion Scroll", function() {
    var editor, editorElement, ensure, i, keystroke, ref1, results, set, text, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    text = new TextData((function() {
      results = [];
      for (i = 0; i < 100; i++){ results.push(i); }
      return results;
    }).apply(this).join("\n"));
    beforeEach(function() {
      getVimState(function(state, _vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = _vim.set, ensure = _vim.ensure, keystroke = _vim.keystroke, _vim;
      });
      return runs(function() {
        jasmine.attachToDOM(editorElement);
        set({
          text: text.getRaw()
        });
        editorElement.setHeight(20 * 10);
        editorElement.style.lineHeight = "10px";
        atom.views.performDocumentPoll();
        editorElement.setScrollTop(40 * 10);
        return editor.setCursorBufferPosition([42, 0]);
      });
    });
    afterEach(function() {
      return vimState.resetNormalMode();
    });
    describe("the ctrl-u keybinding", function() {
      it("moves the screen down by half screen size and keeps cursor onscreen", function() {
        return ensure('ctrl-u', {
          scrollTop: 300,
          cursor: [32, 0]
        });
      });
      it("selects on visual mode", function() {
        set({
          cursor: [42, 1]
        });
        return ensure('v ctrl-u', {
          selectedText: text.getLines([32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42], {
            chomp: true
          })
        });
      });
      return it("selects on linewise mode", function() {
        return ensure('V ctrl-u', {
          selectedText: text.getLines([32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42])
        });
      });
    });
    describe("the ctrl-b keybinding", function() {
      it("moves screen up one page", function() {
        return ensure('ctrl-b', {
          scrollTop: 200,
          cursor: [22, 0]
        });
      });
      it("selects on visual mode", function() {
        set({
          cursor: [42, 1]
        });
        return ensure('v ctrl-b', {
          selectedText: text.getLines([22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42], {
            chomp: true
          })
        });
      });
      return it("selects on linewise mode", function() {
        return ensure('V ctrl-b', {
          selectedText: text.getLines([22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42])
        });
      });
    });
    describe("the ctrl-d keybinding", function() {
      it("moves the screen down by half screen size and keeps cursor onscreen", function() {
        return ensure('ctrl-d', {
          scrollTop: 500,
          cursor: [52, 0]
        });
      });
      it("selects on visual mode", function() {
        set({
          cursor: [42, 1]
        });
        return ensure('v ctrl-d', {
          selectedText: text.getLines([42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52], {
            chomp: true
          }).slice(1, -1)
        });
      });
      return it("selects on linewise mode", function() {
        return ensure('V ctrl-d', {
          selectedText: text.getLines([42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52])
        });
      });
    });
    return describe("the ctrl-f keybinding", function() {
      it("moves screen down one page", function() {
        return ensure('ctrl-f', {
          scrollTop: 600,
          cursor: [62, 0]
        });
      });
      it("selects on visual mode", function() {
        set({
          cursor: [42, 1]
        });
        return ensure('v ctrl-f', {
          selectedText: text.getLines([42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62], {
            chomp: true
          }).slice(1, -1)
        });
      });
      return it("selects on linewise mode", function() {
        return ensure('V ctrl-f', {
          selectedText: text.getLines([42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62])
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL21vdGlvbi1zY3JvbGwtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQW9DLE9BQUEsQ0FBUSxlQUFSLENBQXBDLEVBQUMsNkJBQUQsRUFBYyx1QkFBZCxFQUF3Qjs7RUFDeEIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7RUFFWCxRQUFBLENBQVMsZUFBVCxFQUEwQixTQUFBO0FBQ3hCLFFBQUE7SUFBQSxPQUE0RCxFQUE1RCxFQUFDLGFBQUQsRUFBTSxnQkFBTixFQUFjLG1CQUFkLEVBQXlCLGdCQUF6QixFQUFpQyx1QkFBakMsRUFBZ0Q7SUFDaEQsSUFBQSxHQUFXLElBQUEsUUFBQSxDQUFTOzs7O2tCQUFTLENBQUMsSUFBVixDQUFlLElBQWYsQ0FBVDtJQUVYLFVBQUEsQ0FBVyxTQUFBO01BQ1QsV0FBQSxDQUFZLFNBQUMsS0FBRCxFQUFRLElBQVI7UUFDVixRQUFBLEdBQVc7UUFDVix3QkFBRCxFQUFTO2VBQ1IsY0FBRCxFQUFNLG9CQUFOLEVBQWMsMEJBQWQsRUFBMkI7TUFIakIsQ0FBWjthQUtBLElBQUEsQ0FBSyxTQUFBO1FBQ0gsT0FBTyxDQUFDLFdBQVIsQ0FBb0IsYUFBcEI7UUFDQSxHQUFBLENBQUk7VUFBQSxJQUFBLEVBQU0sSUFBSSxDQUFDLE1BQUwsQ0FBQSxDQUFOO1NBQUo7UUFDQSxhQUFhLENBQUMsU0FBZCxDQUF3QixFQUFBLEdBQUssRUFBN0I7UUFDQSxhQUFhLENBQUMsS0FBSyxDQUFDLFVBQXBCLEdBQWlDO1FBQ2pDLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQVgsQ0FBQTtRQUNBLGFBQWEsQ0FBQyxZQUFkLENBQTJCLEVBQUEsR0FBSyxFQUFoQztlQUNBLE1BQU0sQ0FBQyx1QkFBUCxDQUErQixDQUFDLEVBQUQsRUFBSyxDQUFMLENB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QUQsRUFBSyxDQUFMLENBRFI7U0FERjtNQUQrQixDQUFqQztNQUtBLEVBQUEsQ0FBRyx3QkFBSCxFQUE2QixTQUFBO1FBQzNCLEdBQUEsQ0FBSTtVQUFBLE1BQUEsRUFBUSxDQUFDLEVBQUQsRUFBSyxDQUFMLENBQVI7U0FBSjtlQUNBLE1BQUEsQ0FBTyxVQUFQLEVBQ0U7VUFBQSxZQUFBLEVBQWMsSUFBSSxDQUFDLFFBQUwsQ0FBYyxvRkFBZCxFQUF3QjtZQUFBLEtBQUEsRUFBTyxJQUFQO1dBQXhCLENBQW9DLENBQUMsS0FBckMsQ0FBMkMsQ0FBM0MsRUFBOEMsQ0FBQyxDQUEvQyxDQUFkO1NBREY7TUFGMkIsQ0FBN0I7YUFLQSxFQUFBLENBQUcsMEJBQUgsRUFBK0IsU0FBQTtlQUM3QixNQUFBLENBQU8sVUFBUCxFQUNFO1VBQUEsWUFBQSxFQUFjLElBQUksQ0FBQyxRQUFMLENBQWMsb0ZBQWQsQ0FBZDtTQURGO01BRDZCLENBQS9CO0lBWGdDLENBQWxDO0VBbkV3QixDQUExQjtBQUhBIiwic291cmNlc0NvbnRlbnQiOlsie2dldFZpbVN0YXRlLCBkaXNwYXRjaCwgVGV4dERhdGF9ID0gcmVxdWlyZSAnLi9zcGVjLWhlbHBlcidcbnNldHRpbmdzID0gcmVxdWlyZSAnLi4vbGliL3NldHRpbmdzJ1xuXG5kZXNjcmliZSBcIk1vdGlvbiBTY3JvbGxcIiwgLT5cbiAgW3NldCwgZW5zdXJlLCBrZXlzdHJva2UsIGVkaXRvciwgZWRpdG9yRWxlbWVudCwgdmltU3RhdGVdID0gW11cbiAgdGV4dCA9IG5ldyBUZXh0RGF0YShbMC4uLjEwMF0uam9pbihcIlxcblwiKSlcblxuICBiZWZvcmVFYWNoIC0+XG4gICAgZ2V0VmltU3RhdGUgKHN0YXRlLCBfdmltKSAtPlxuICAgICAgdmltU3RhdGUgPSBzdGF0ZSAjIHRvIHJlZmVyIGFzIHZpbVN0YXRlIGxhdGVyLlxuICAgICAge2VkaXRvciwgZWRpdG9yRWxlbWVudH0gPSB2aW1TdGF0ZVxuICAgICAge3NldCwgZW5zdXJlLCBrZXlzdHJva2V9ID0gX3ZpbVxuXG4gICAgcnVucyAtPlxuICAgICAgamFzbWluZS5hdHRhY2hUb0RPTShlZGl0b3JFbGVtZW50KVxuICAgICAgc2V0IHRleHQ6IHRleHQuZ2V0UmF3KClcbiAgICAgIGVkaXRvckVsZW1lbnQuc2V0SGVpZ2h0KDIwICogMTApXG4gICAgICBlZGl0b3JFbGVtZW50LnN0eWxlLmxpbmVIZWlnaHQgPSBcIjEwcHhcIlxuICAgICAgYXRvbS52aWV3cy5wZXJmb3JtRG9jdW1lbnRQb2xsKClcbiAgICAgIGVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsVG9wKDQwICogMTApXG4gICAgICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oWzQyLCAwXSlcblxuICBhZnRlckVhY2ggLT5cbiAgICB2aW1TdGF0ZS5yZXNldE5vcm1hbE1vZGUoKVxuXG4gIGRlc2NyaWJlIFwidGhlIGN0cmwtdSBrZXliaW5kaW5nXCIsIC0+XG4gICAgaXQgXCJtb3ZlcyB0aGUgc2NyZWVuIGRvd24gYnkgaGFsZiBzY3JlZW4gc2l6ZSBhbmQga2VlcHMgY3Vyc29yIG9uc2NyZWVuXCIsIC0+XG4gICAgICBlbnN1cmUgJ2N0cmwtdScsXG4gICAgICAgIHNjcm9sbFRvcDogMzAwXG4gICAgICAgIGN1cnNvcjogWzMyLCAwXVxuXG4gICAgaXQgXCJzZWxlY3RzIG9uIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbNDIsIDFdXG4gICAgICBlbnN1cmUgJ3YgY3RybC11JyxcbiAgICAgICAgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFszMi4uNDJdLCBjaG9tcDogdHJ1ZSlcblxuICAgIGl0IFwic2VsZWN0cyBvbiBsaW5ld2lzZSBtb2RlXCIsIC0+XG4gICAgICBlbnN1cmUgJ1YgY3RybC11JyxcbiAgICAgICAgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFszMi4uNDJdKVxuXG4gIGRlc2NyaWJlIFwidGhlIGN0cmwtYiBrZXliaW5kaW5nXCIsIC0+XG4gICAgaXQgXCJtb3ZlcyBzY3JlZW4gdXAgb25lIHBhZ2VcIiwgLT5cbiAgICAgIGVuc3VyZSAnY3RybC1iJyxcbiAgICAgICAgc2Nyb2xsVG9wOiAyMDBcbiAgICAgICAgY3Vyc29yOiBbMjIsIDBdXG5cbiAgICBpdCBcInNlbGVjdHMgb24gdmlzdWFsIG1vZGVcIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFs0MiwgMV1cbiAgICAgIGVuc3VyZSAndiBjdHJsLWInLFxuICAgICAgICBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzIyLi40Ml0sIGNob21wOiB0cnVlKVxuXG4gICAgaXQgXCJzZWxlY3RzIG9uIGxpbmV3aXNlIG1vZGVcIiwgLT5cbiAgICAgIGVuc3VyZSAnViBjdHJsLWInLFxuICAgICAgICBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzIyLi40Ml0pXG5cbiAgZGVzY3JpYmUgXCJ0aGUgY3RybC1kIGtleWJpbmRpbmdcIiwgLT5cbiAgICBpdCBcIm1vdmVzIHRoZSBzY3JlZW4gZG93biBieSBoYWxmIHNjcmVlbiBzaXplIGFuZCBrZWVwcyBjdXJzb3Igb25zY3JlZW5cIiwgLT5cbiAgICAgIGVuc3VyZSAnY3RybC1kJyxcbiAgICAgICAgc2Nyb2xsVG9wOiA1MDBcbiAgICAgICAgY3Vyc29yOiBbNTIsIDBdXG5cbiAgICBpdCBcInNlbGVjdHMgb24gdmlzdWFsIG1vZGVcIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFs0MiwgMV1cbiAgICAgIGVuc3VyZSAndiBjdHJsLWQnLFxuICAgICAgICBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzQyLi41Ml0sIGNob21wOiB0cnVlKS5zbGljZSgxLCAtMSlcblxuICAgIGl0IFwic2VsZWN0cyBvbiBsaW5ld2lzZSBtb2RlXCIsIC0+XG4gICAgICBlbnN1cmUgJ1YgY3RybC1kJyxcbiAgICAgICAgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFs0Mi4uNTJdKVxuXG4gIGRlc2NyaWJlIFwidGhlIGN0cmwtZiBrZXliaW5kaW5nXCIsIC0+XG4gICAgaXQgXCJtb3ZlcyBzY3JlZW4gZG93biBvbmUgcGFnZVwiLCAtPlxuICAgICAgZW5zdXJlICdjdHJsLWYnLFxuICAgICAgICBzY3JvbGxUb3A6IDYwMFxuICAgICAgICBjdXJzb3I6IFs2MiwgMF1cblxuICAgIGl0IFwic2VsZWN0cyBvbiB2aXN1YWwgbW9kZVwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzQyLCAxXVxuICAgICAgZW5zdXJlICd2IGN0cmwtZicsXG4gICAgICAgIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbNDIuLjYyXSwgY2hvbXA6IHRydWUpLnNsaWNlKDEsIC0xKVxuXG4gICAgaXQgXCJzZWxlY3RzIG9uIGxpbmV3aXNlIG1vZGVcIiwgLT5cbiAgICAgIGVuc3VyZSAnViBjdHJsLWYnLFxuICAgICAgICBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzQyLi42Ml0pXG4iXX0=
