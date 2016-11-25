(function() {
  var TextData, dispatch, getView, getVimState, ref, settings;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData, getView = ref.getView;

  settings = require('../lib/settings');

  describe("Persistent Selection", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      getVimState(function(state, _vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = _vim.set, ensure = _vim.ensure, keystroke = _vim.keystroke, _vim;
      });
      return runs(function() {
        return jasmine.attachToDOM(editorElement);
      });
    });
    afterEach(function() {
      return vimState.resetNormalMode();
    });
    return describe("CreatePersistentSelection operator", function() {
      var ensurePersistentSelection, textForMarker;
      textForMarker = function(marker) {
        return editor.getTextInBufferRange(marker.getBufferRange());
      };
      ensurePersistentSelection = function(options) {
        var markers, text;
        markers = vimState.persistentSelection.getMarkers();
        if (options.length != null) {
          expect(markers).toHaveLength(options.length);
        }
        if (options.text != null) {
          text = markers.map(function(marker) {
            return textForMarker(marker);
          });
          expect(text).toEqual(options.text);
        }
        if (options.mode != null) {
          return ensure({
            mode: options.mode
          });
        }
      };
      beforeEach(function() {
        atom.keymaps.add("test", {
          'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
            'g m': 'vim-mode-plus:create-persistent-selection'
          }
        });
        set({
          text: "ooo xxx ooo\nxxx ooo xxx\n\nooo xxx ooo\nxxx ooo xxx\n\nooo xxx ooo\nxxx ooo xxx\n",
          cursor: [0, 0]
        });
        return expect(vimState.persistentSelection.hasMarkers()).toBe(false);
      });
      describe("basic behavior", function() {
        describe("create-persistent-selection", function() {
          return it("create-persistent-selection create range marker", function() {
            keystroke('g m i w');
            ensurePersistentSelection({
              length: 1,
              text: ['ooo']
            });
            keystroke('j .');
            return ensurePersistentSelection({
              length: 2,
              text: ['ooo', 'xxx']
            });
          });
        });
        return describe("[No behavior diff currently] inner-persistent-selection and a-persistent-selection", function() {
          return it("apply operator to across all persistent-selections", function() {
            keystroke('g m i w j . 2 j g m i p');
            ensurePersistentSelection({
              length: 3,
              text: ['ooo', 'xxx', "ooo xxx ooo\nxxx ooo xxx\n"]
            });
            return ensure('g U a r', {
              text: "OOO xxx ooo\nXXX ooo xxx\n\nOOO XXX OOO\nXXX OOO XXX\n\nooo xxx ooo\nxxx ooo xxx\n"
            });
          });
        });
      });
      describe("select-occurrence-in-a-persistent-selection", function() {
        var update;
        update = [][0];
        beforeEach(function() {
          return vimState.persistentSelection.markerLayer.onDidUpdate(update = jasmine.createSpy());
        });
        return it("select all instance of cursor word only within marked range", function() {
          runs(function() {
            var paragraphText;
            keystroke('g m i p } } j .');
            paragraphText = "ooo xxx ooo\nxxx ooo xxx\n";
            return ensurePersistentSelection({
              length: 2,
              text: [paragraphText, paragraphText]
            });
          });
          waitsFor(function() {
            return update.callCount === 1;
          });
          return runs(function() {
            ensure('g cmd-d', {
              selectedText: ['ooo', 'ooo', 'ooo', 'ooo', 'ooo', 'ooo']
            });
            keystroke('c');
            editor.insertText('!!!');
            return ensure({
              text: "!!! xxx !!!\nxxx !!! xxx\n\nooo xxx ooo\nxxx ooo xxx\n\n!!! xxx !!!\nxxx !!! xxx\n"
            });
          });
        });
      });
      describe("clearPersistentSelections command", function() {
        return it("clear persistentSelections", function() {
          keystroke('g m i w');
          ensurePersistentSelection({
            length: 1,
            text: ['ooo']
          });
          dispatch(editorElement, 'vim-mode-plus:clear-persistent-selection');
          return expect(vimState.persistentSelection.hasMarkers()).toBe(false);
        });
      });
      return describe("clearPersistentSelectionOnResetNormalMode", function() {
        describe("default setting", function() {
          return it("it won't clear persistentSelection", function() {
            keystroke('g m i w');
            ensurePersistentSelection({
              length: 1,
              text: ['ooo']
            });
            dispatch(editorElement, 'vim-mode-plus:reset-normal-mode');
            return ensurePersistentSelection({
              length: 1,
              text: ['ooo']
            });
          });
        });
        return describe("when enabled", function() {
          return it("it clear persistentSelection on reset-normal-mode", function() {
            settings.set('clearPersistentSelectionOnResetNormalMode', true);
            keystroke('g m i w');
            ensurePersistentSelection({
              length: 1,
              text: ['ooo']
            });
            dispatch(editorElement, 'vim-mode-plus:reset-normal-mode');
            return expect(vimState.persistentSelection.hasMarkers()).toBe(false);
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL3BlcnNpc3RlbnQtc2VsZWN0aW9uci1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBNkMsT0FBQSxDQUFRLGVBQVIsQ0FBN0MsRUFBQyw2QkFBRCxFQUFjLHVCQUFkLEVBQXdCLHVCQUF4QixFQUFrQzs7RUFDbEMsUUFBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7RUFFWCxRQUFBLENBQVMsc0JBQVQsRUFBaUMsU0FBQTtBQUMvQixRQUFBO0lBQUEsT0FBNEQsRUFBNUQsRUFBQyxhQUFELEVBQU0sZ0JBQU4sRUFBYyxtQkFBZCxFQUF5QixnQkFBekIsRUFBaUMsdUJBQWpDLEVBQWdEO0lBRWhELFVBQUEsQ0FBVyxTQUFBO01BQ1QsV0FBQSxDQUFZLFNBQUMsS0FBRCxFQUFRLElBQVI7UUFDVixRQUFBLEdBQVc7UUFDVix3QkFBRCxFQUFTO2VBQ1IsY0FBRCxFQUFNLG9CQUFOLEVBQWMsMEJBQWQsRUFBMkI7TUFIakIsQ0FBWjthQUlBLElBQUEsQ0FBSyxTQUFBO2VBQ0gsT0FBTyxDQUFDLFdBQVIsQ0FBb0IsYUFBcEI7TUFERyxDQUFMO0lBTFMsQ0FBWDtJQVFBLFNBQUEsQ0FBVSxTQUFBO2FBQ1IsUUFBUSxDQUFDLGVBQVQsQ0FBQTtJQURRLENBQVY7V0FHQSxRQUFBLENBQVMsb0NBQVQsRUFBK0MsU0FBQTtBQUM3QyxVQUFBO01BQUEsYUFBQSxHQUFnQixTQUFDLE1BQUQ7ZUFDZCxNQUFNLENBQUMsb0JBQVAsQ0FBNEIsTUFBTSxDQUFDLGNBQVAsQ0FBQSxDQUE1QjtNQURjO01BR2hCLHlCQUFBLEdBQTRCLFNBQUMsT0FBRDtBQUMxQixZQUFBO1FBQUEsT0FBQSxHQUFVLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxVQUE3QixDQUFBO1FBQ1YsSUFBRyxzQkFBSDtVQUNF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QUNBLFFBQUEsQ0FBUyxhQUFULEVBQXdCLGlDQUF4QjttQkFDQSxNQUFBLENBQU8sUUFBUSxDQUFDLG1CQUFtQixDQUFDLFVBQTdCLENBQUEsQ0FBUCxDQUFpRCxDQUFDLElBQWxELENBQXVELEtBQXZEO1VBTHNELENBQXhEO1FBRHVCLENBQXpCO01BUm9ELENBQXREO0lBN0Y2QyxDQUEvQztFQWQrQixDQUFqQztBQUhBIiwic291cmNlc0NvbnRlbnQiOlsie2dldFZpbVN0YXRlLCBkaXNwYXRjaCwgVGV4dERhdGEsIGdldFZpZXd9ID0gcmVxdWlyZSAnLi9zcGVjLWhlbHBlcidcbnNldHRpbmdzID0gcmVxdWlyZSAnLi4vbGliL3NldHRpbmdzJ1xuXG5kZXNjcmliZSBcIlBlcnNpc3RlbnQgU2VsZWN0aW9uXCIsIC0+XG4gIFtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlLCBlZGl0b3IsIGVkaXRvckVsZW1lbnQsIHZpbVN0YXRlXSA9IFtdXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIGdldFZpbVN0YXRlIChzdGF0ZSwgX3ZpbSkgLT5cbiAgICAgIHZpbVN0YXRlID0gc3RhdGVcbiAgICAgIHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9ID0gdmltU3RhdGVcbiAgICAgIHtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlfSA9IF92aW1cbiAgICBydW5zIC0+XG4gICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKGVkaXRvckVsZW1lbnQpXG5cbiAgYWZ0ZXJFYWNoIC0+XG4gICAgdmltU3RhdGUucmVzZXROb3JtYWxNb2RlKClcblxuICBkZXNjcmliZSBcIkNyZWF0ZVBlcnNpc3RlbnRTZWxlY3Rpb24gb3BlcmF0b3JcIiwgLT5cbiAgICB0ZXh0Rm9yTWFya2VyID0gKG1hcmtlcikgLT5cbiAgICAgIGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKSlcblxuICAgIGVuc3VyZVBlcnNpc3RlbnRTZWxlY3Rpb24gPSAob3B0aW9ucykgLT5cbiAgICAgIG1hcmtlcnMgPSB2aW1TdGF0ZS5wZXJzaXN0ZW50U2VsZWN0aW9uLmdldE1hcmtlcnMoKVxuICAgICAgaWYgb3B0aW9ucy5sZW5ndGg/XG4gICAgICAgIGV4cGVjdChtYXJrZXJzKS50b0hhdmVMZW5ndGgob3B0aW9ucy5sZW5ndGgpXG5cbiAgICAgIGlmIG9wdGlvbnMudGV4dD9cbiAgICAgICAgdGV4dCA9IG1hcmtlcnMubWFwIChtYXJrZXIpIC0+IHRleHRGb3JNYXJrZXIobWFya2VyKVxuICAgICAgICBleHBlY3QodGV4dCkudG9FcXVhbChvcHRpb25zLnRleHQpXG5cbiAgICAgIGlmIG9wdGlvbnMubW9kZT9cbiAgICAgICAgZW5zdXJlIHttb2RlOiBvcHRpb25zLm1vZGV9XG5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBhdG9tLmtleW1hcHMuYWRkIFwidGVzdFwiLFxuICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzOm5vdCguaW5zZXJ0LW1vZGUpJzpcbiAgICAgICAgICAnZyBtJzogJ3ZpbS1tb2RlLXBsdXM6Y3JlYXRlLXBlcnNpc3RlbnQtc2VsZWN0aW9uJ1xuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICBvb28geHh4IG9vb1xuICAgICAgICB4eHggb29vIHh4eFxuXG4gICAgICAgIG9vbyB4eHggb29vXG4gICAgICAgIHh4eCBvb28geHh4XG5cbiAgICAgICAgb29vIHh4eCBvb29cbiAgICAgICAgeHh4IG9vbyB4eHhcXG5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICBleHBlY3QodmltU3RhdGUucGVyc2lzdGVudFNlbGVjdGlvbi5oYXNNYXJrZXJzKCkpLnRvQmUoZmFsc2UpXG5cbiAgICBkZXNjcmliZSBcImJhc2ljIGJlaGF2aW9yXCIsIC0+XG4gICAgICBkZXNjcmliZSBcImNyZWF0ZS1wZXJzaXN0ZW50LXNlbGVjdGlvblwiLCAtPlxuICAgICAgICBpdCBcImNyZWF0ZS1wZXJzaXN0ZW50LXNlbGVjdGlvbiBjcmVhdGUgcmFuZ2UgbWFya2VyXCIsIC0+XG4gICAgICAgICAga2V5c3Ryb2tlKCdnIG0gaSB3JylcbiAgICAgICAgICBlbnN1cmVQZXJzaXN0ZW50U2VsZWN0aW9uIGxlbmd0aDogMSwgdGV4dDogWydvb28nXVxuICAgICAgICAgIGtleXN0cm9rZSgnaiAuJylcbiAgICAgICAgICBlbnN1cmVQZXJzaXN0ZW50U2VsZWN0aW9uIGxlbmd0aDogMiwgdGV4dDogWydvb28nLCAneHh4J11cbiAgICAgIGRlc2NyaWJlIFwiW05vIGJlaGF2aW9yIGRpZmYgY3VycmVudGx5XSBpbm5lci1wZXJzaXN0ZW50LXNlbGVjdGlvbiBhbmQgYS1wZXJzaXN0ZW50LXNlbGVjdGlvblwiLCAtPlxuICAgICAgICBpdCBcImFwcGx5IG9wZXJhdG9yIHRvIGFjcm9zcyBhbGwgcGVyc2lzdGVudC1zZWxlY3Rpb25zXCIsIC0+XG4gICAgICAgICAga2V5c3Ryb2tlKCdnIG0gaSB3IGogLiAyIGogZyBtIGkgcCcpICMgTWFyayAyIGlubmVyLXdvcmQgYW5kIDEgaW5uZXItcGFyYWdyYXBoXG4gICAgICAgICAgZW5zdXJlUGVyc2lzdGVudFNlbGVjdGlvbiBsZW5ndGg6IDMsIHRleHQ6IFsnb29vJywgJ3h4eCcsIFwib29vIHh4eCBvb29cXG54eHggb29vIHh4eFxcblwiXVxuICAgICAgICAgIGVuc3VyZSAnZyBVIGEgcicsXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIE9PTyB4eHggb29vXG4gICAgICAgICAgICBYWFggb29vIHh4eFxuXG4gICAgICAgICAgICBPT08gWFhYIE9PT1xuICAgICAgICAgICAgWFhYIE9PTyBYWFhcblxuICAgICAgICAgICAgb29vIHh4eCBvb29cbiAgICAgICAgICAgIHh4eCBvb28geHh4XFxuXG4gICAgICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwic2VsZWN0LW9jY3VycmVuY2UtaW4tYS1wZXJzaXN0ZW50LXNlbGVjdGlvblwiLCAtPlxuICAgICAgW3VwZGF0ZV0gPSBbXVxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICB2aW1TdGF0ZS5wZXJzaXN0ZW50U2VsZWN0aW9uLm1hcmtlckxheWVyLm9uRGlkVXBkYXRlKHVwZGF0ZSA9IGphc21pbmUuY3JlYXRlU3B5KCkpXG5cbiAgICAgIGl0IFwic2VsZWN0IGFsbCBpbnN0YW5jZSBvZiBjdXJzb3Igd29yZCBvbmx5IHdpdGhpbiBtYXJrZWQgcmFuZ2VcIiwgLT5cbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGtleXN0cm9rZSgnZyBtIGkgcCB9IH0gaiAuJykgIyBNYXJrIDIgaW5uZXItd29yZCBhbmQgMSBpbm5lci1wYXJhZ3JhcGhcbiAgICAgICAgICBwYXJhZ3JhcGhUZXh0ID0gXCJvb28geHh4IG9vb1xcbnh4eCBvb28geHh4XFxuXCJcbiAgICAgICAgICBlbnN1cmVQZXJzaXN0ZW50U2VsZWN0aW9uIGxlbmd0aDogMiwgdGV4dDogW3BhcmFncmFwaFRleHQsIHBhcmFncmFwaFRleHRdXG4gICAgICAgIHdhaXRzRm9yIC0+XG4gICAgICAgICAgdXBkYXRlLmNhbGxDb3VudCBpcyAxXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBlbnN1cmUgJ2cgY21kLWQnLFxuICAgICAgICAgICAgc2VsZWN0ZWRUZXh0OiBbJ29vbycsICdvb28nLCAnb29vJywgJ29vbycsICdvb28nLCAnb29vJyBdXG4gICAgICAgICAga2V5c3Ryb2tlICdjJ1xuICAgICAgICAgIGVkaXRvci5pbnNlcnRUZXh0ICchISEnXG4gICAgICAgICAgZW5zdXJlXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgICEhISB4eHggISEhXG4gICAgICAgICAgICB4eHggISEhIHh4eFxuXG4gICAgICAgICAgICBvb28geHh4IG9vb1xuICAgICAgICAgICAgeHh4IG9vbyB4eHhcblxuICAgICAgICAgICAgISEhIHh4eCAhISFcbiAgICAgICAgICAgIHh4eCAhISEgeHh4XFxuXG4gICAgICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwiY2xlYXJQZXJzaXN0ZW50U2VsZWN0aW9ucyBjb21tYW5kXCIsIC0+XG4gICAgICBpdCBcImNsZWFyIHBlcnNpc3RlbnRTZWxlY3Rpb25zXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSgnZyBtIGkgdycpXG4gICAgICAgIGVuc3VyZVBlcnNpc3RlbnRTZWxlY3Rpb24gbGVuZ3RoOiAxLCB0ZXh0OiBbJ29vbyddXG4gICAgICAgIGRpc3BhdGNoKGVkaXRvckVsZW1lbnQsICd2aW0tbW9kZS1wbHVzOmNsZWFyLXBlcnNpc3RlbnQtc2VsZWN0aW9uJylcbiAgICAgICAgZXhwZWN0KHZpbVN0YXRlLnBlcnNpc3RlbnRTZWxlY3Rpb24uaGFzTWFya2VycygpKS50b0JlKGZhbHNlKVxuXG4gICAgZGVzY3JpYmUgXCJjbGVhclBlcnNpc3RlbnRTZWxlY3Rpb25PblJlc2V0Tm9ybWFsTW9kZVwiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJkZWZhdWx0IHNldHRpbmdcIiwgLT5cbiAgICAgICAgaXQgXCJpdCB3b24ndCBjbGVhciBwZXJzaXN0ZW50U2VsZWN0aW9uXCIsIC0+XG4gICAgICAgICAga2V5c3Ryb2tlKCdnIG0gaSB3JylcbiAgICAgICAgICBlbnN1cmVQZXJzaXN0ZW50U2VsZWN0aW9uIGxlbmd0aDogMSwgdGV4dDogWydvb28nXVxuICAgICAgICAgIGRpc3BhdGNoKGVkaXRvckVsZW1lbnQsICd2aW0tbW9kZS1wbHVzOnJlc2V0LW5vcm1hbC1tb2RlJylcbiAgICAgICAgICBlbnN1cmVQZXJzaXN0ZW50U2VsZWN0aW9uIGxlbmd0aDogMSwgdGV4dDogWydvb28nXVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gZW5hYmxlZFwiLCAtPlxuICAgICAgICBpdCBcIml0IGNsZWFyIHBlcnNpc3RlbnRTZWxlY3Rpb24gb24gcmVzZXQtbm9ybWFsLW1vZGVcIiwgLT5cbiAgICAgICAgICBzZXR0aW5ncy5zZXQoJ2NsZWFyUGVyc2lzdGVudFNlbGVjdGlvbk9uUmVzZXROb3JtYWxNb2RlJywgdHJ1ZSlcbiAgICAgICAgICBrZXlzdHJva2UoJ2cgbSBpIHcnKVxuICAgICAgICAgIGVuc3VyZVBlcnNpc3RlbnRTZWxlY3Rpb24gbGVuZ3RoOiAxLCB0ZXh0OiBbJ29vbyddXG4gICAgICAgICAgZGlzcGF0Y2goZWRpdG9yRWxlbWVudCwgJ3ZpbS1tb2RlLXBsdXM6cmVzZXQtbm9ybWFsLW1vZGUnKVxuICAgICAgICAgIGV4cGVjdCh2aW1TdGF0ZS5wZXJzaXN0ZW50U2VsZWN0aW9uLmhhc01hcmtlcnMoKSkudG9CZShmYWxzZSlcbiJdfQ==
