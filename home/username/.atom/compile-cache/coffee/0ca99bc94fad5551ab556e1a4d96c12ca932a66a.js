(function() {
  var getVimState;

  getVimState = require('./spec-helper').getVimState;

  describe("Scrolling", function() {
    var editor, editorElement, ensure, keystroke, ref, set, vimState;
    ref = [], set = ref[0], ensure = ref[1], keystroke = ref[2], editor = ref[3], editorElement = ref[4], vimState = ref[5];
    beforeEach(function() {
      return getVimState(function(state, vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke;
        return jasmine.attachToDOM(editorElement);
      });
    });
    afterEach(function() {
      return vimState.resetNormalMode();
    });
    describe("scrolling keybindings", function() {
      beforeEach(function() {
        editor.setLineHeightInPixels(10);
        editorElement.setHeight(50);
        atom.views.performDocumentPoll();
        set({
          cursor: [1, 2],
          text: "100\n200\n300\n400\n500\n600\n700\n800\n900\n1000"
        });
        return expect(editorElement.getVisibleRowRange()).toEqual([0, 4]);
      });
      return describe("the ctrl-e and ctrl-y keybindings", function() {
        return it("moves the screen up and down by one and keeps cursor onscreen", function() {
          ensure('ctrl-e', {
            cursor: [2, 2]
          });
          expect(editor.getFirstVisibleScreenRow()).toBe(1);
          expect(editor.getLastVisibleScreenRow()).toBe(6);
          ensure('2 ctrl-e', {
            cursor: [4, 2]
          });
          expect(editor.getFirstVisibleScreenRow()).toBe(3);
          expect(editor.getLastVisibleScreenRow()).toBe(8);
          ensure('2 ctrl-y', {
            cursor: [2, 2]
          });
          expect(editor.getFirstVisibleScreenRow()).toBe(1);
          return expect(editor.getLastVisibleScreenRow()).toBe(6);
        });
      });
    });
    describe("scroll cursor keybindings", function() {
      beforeEach(function() {
        var j, results;
        editor.setText((function() {
          results = [];
          for (j = 1; j <= 200; j++){ results.push(j); }
          return results;
        }).apply(this).join("\n"));
        editorElement.style.lineHeight = "20px";
        editorElement.component.sampleFontStyling();
        editorElement.setHeight(20 * 10);
        spyOn(editor, 'moveToFirstCharacterOfLine');
        spyOn(editorElement, 'setScrollTop');
        spyOn(editorElement, 'getFirstVisibleScreenRow').andReturn(90);
        spyOn(editorElement, 'getLastVisibleScreenRow').andReturn(110);
        return spyOn(editorElement, 'pixelPositionForScreenPosition').andReturn({
          top: 1000,
          left: 0
        });
      });
      describe("the z<CR> keybinding", function() {
        return it("moves the screen to position cursor at the top of the window and moves cursor to first non-blank in the line", function() {
          keystroke('z enter');
          expect(editorElement.setScrollTop).toHaveBeenCalledWith(960);
          return expect(editor.moveToFirstCharacterOfLine).toHaveBeenCalled();
        });
      });
      describe("the zt keybinding", function() {
        return it("moves the screen to position cursor at the top of the window and leave cursor in the same column", function() {
          keystroke('z t');
          expect(editorElement.setScrollTop).toHaveBeenCalledWith(960);
          return expect(editor.moveToFirstCharacterOfLine).not.toHaveBeenCalled();
        });
      });
      describe("the z. keybinding", function() {
        return it("moves the screen to position cursor at the center of the window and moves cursor to first non-blank in the line", function() {
          keystroke('z .');
          expect(editorElement.setScrollTop).toHaveBeenCalledWith(900);
          return expect(editor.moveToFirstCharacterOfLine).toHaveBeenCalled();
        });
      });
      describe("the zz keybinding", function() {
        return it("moves the screen to position cursor at the center of the window and leave cursor in the same column", function() {
          keystroke('z z');
          expect(editorElement.setScrollTop).toHaveBeenCalledWith(900);
          return expect(editor.moveToFirstCharacterOfLine).not.toHaveBeenCalled();
        });
      });
      describe("the z- keybinding", function() {
        return it("moves the screen to position cursor at the bottom of the window and moves cursor to first non-blank in the line", function() {
          keystroke('z -');
          expect(editorElement.setScrollTop).toHaveBeenCalledWith(860);
          return expect(editor.moveToFirstCharacterOfLine).toHaveBeenCalled();
        });
      });
      return describe("the zb keybinding", function() {
        return it("moves the screen to position cursor at the bottom of the window and leave cursor in the same column", function() {
          keystroke('z b');
          expect(editorElement.setScrollTop).toHaveBeenCalledWith(860);
          return expect(editor.moveToFirstCharacterOfLine).not.toHaveBeenCalled();
        });
      });
    });
    return describe("horizontal scroll cursor keybindings", function() {
      beforeEach(function() {
        var i, j, text;
        editorElement.setWidth(600);
        editorElement.setHeight(600);
        editorElement.style.lineHeight = "10px";
        editorElement.style.font = "16px monospace";
        atom.views.performDocumentPoll();
        text = "";
        for (i = j = 100; j <= 199; i = ++j) {
          text += i + " ";
        }
        editor.setText(text);
        return editor.setCursorBufferPosition([0, 0]);
      });
      describe("the zs keybinding", function() {
        var startPosition, zsPos;
        zsPos = function(pos) {
          editor.setCursorBufferPosition([0, pos]);
          keystroke('z s');
          return editorElement.getScrollLeft();
        };
        startPosition = 0/0;
        beforeEach(function() {
          return startPosition = editorElement.getScrollLeft();
        });
        xit("does nothing near the start of the line", function() {
          var pos1;
          pos1 = zsPos(1);
          return expect(pos1).toEqual(startPosition);
        });
        it("moves the cursor the nearest it can to the left edge of the editor", function() {
          var pos10, pos11;
          pos10 = zsPos(10);
          expect(pos10).toBeGreaterThan(startPosition);
          pos11 = zsPos(11);
          return expect(pos11 - pos10).toEqual(10);
        });
        it("does nothing near the end of the line", function() {
          var pos340, pos390, posEnd;
          posEnd = zsPos(399);
          expect(editor.getCursorBufferPosition()).toEqual([0, 399]);
          pos390 = zsPos(390);
          expect(pos390).toEqual(posEnd);
          expect(editor.getCursorBufferPosition()).toEqual([0, 390]);
          pos340 = zsPos(340);
          return expect(pos340).toEqual(posEnd);
        });
        return it("does nothing if all lines are short", function() {
          var pos1, pos10;
          editor.setText('short');
          startPosition = editorElement.getScrollLeft();
          pos1 = zsPos(1);
          expect(pos1).toEqual(startPosition);
          expect(editor.getCursorBufferPosition()).toEqual([0, 1]);
          pos10 = zsPos(10);
          expect(pos10).toEqual(startPosition);
          return expect(editor.getCursorBufferPosition()).toEqual([0, 4]);
        });
      });
      return describe("the ze keybinding", function() {
        var startPosition, zePos;
        zePos = function(pos) {
          editor.setCursorBufferPosition([0, pos]);
          keystroke('z e');
          return editorElement.getScrollLeft();
        };
        startPosition = 0/0;
        beforeEach(function() {
          return startPosition = editorElement.getScrollLeft();
        });
        it("does nothing near the start of the line", function() {
          var pos1, pos40;
          pos1 = zePos(1);
          expect(pos1).toEqual(startPosition);
          pos40 = zePos(40);
          return expect(pos40).toEqual(startPosition);
        });
        it("moves the cursor the nearest it can to the right edge of the editor", function() {
          var pos109, pos110;
          pos110 = zePos(110);
          expect(pos110).toBeGreaterThan(startPosition);
          pos109 = zePos(109);
          return expect(pos110 - pos109).toEqual(9);
        });
        it("does nothing when very near the end of the line", function() {
          var pos380, pos382, pos397, posEnd;
          posEnd = zePos(399);
          expect(editor.getCursorBufferPosition()).toEqual([0, 399]);
          pos397 = zePos(397);
          expect(pos397).toBeLessThan(posEnd);
          expect(editor.getCursorBufferPosition()).toEqual([0, 397]);
          pos380 = zePos(380);
          expect(pos380).toBeLessThan(posEnd);
          pos382 = zePos(382);
          return expect(pos382 - pos380).toEqual(19);
        });
        return it("does nothing if all lines are short", function() {
          var pos1, pos10;
          editor.setText('short');
          startPosition = editorElement.getScrollLeft();
          pos1 = zePos(1);
          expect(pos1).toEqual(startPosition);
          expect(editor.getCursorBufferPosition()).toEqual([0, 1]);
          pos10 = zePos(10);
          expect(pos10).toEqual(startPosition);
          return expect(editor.getCursorBufferPosition()).toEqual([0, 4]);
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL3Njcm9sbC1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsY0FBZSxPQUFBLENBQVEsZUFBUjs7RUFFaEIsUUFBQSxDQUFTLFdBQVQsRUFBc0IsU0FBQTtBQUNwQixRQUFBO0lBQUEsTUFBNEQsRUFBNUQsRUFBQyxZQUFELEVBQU0sZUFBTixFQUFjLGtCQUFkLEVBQXlCLGVBQXpCLEVBQWlDLHNCQUFqQyxFQUFnRDtJQUVoRCxVQUFBLENBQVcsU0FBQTthQUNULFdBQUEsQ0FBWSxTQUFDLEtBQUQsRUFBUSxHQUFSO1FBQ1YsUUFBQSxHQUFXO1FBQ1Ysd0JBQUQsRUFBUztRQUNSLGFBQUQsRUFBTSxtQkFBTixFQUFjO2VBQ2QsT0FBTyxDQUFDLFdBQVIsQ0FBb0IsYUFBcEI7TUFKVSxDQUFaO0lBRFMsQ0FBWDtJQU9BLFNBQUEsQ0FBVSxTQUFBO2FBQ1IsUUFBUSxDQUFDLGVBQVQsQ0FBQTtJQURRLENBQVY7SUFHQSxRQUFBLENBQVMsdUJBQVQsRUFBa0MsU0FBQTtNQUNoQyxVQUFBLENBQVcsU0FBQTtRQUNULE1BQU0sQ0FBQyxxQkFBUCxDQUE2QixFQUE3QjtRQUNBLGFBQWEsQ0FBQyxTQUFkLENBQXdCLEVBQXhCO1FBQ0EsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBWCxDQUFBO1FBQ0EsR0FBQSxDQUNFO1VBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtVQUNBLElBQUEsRUFBTSxtREFETjtTQURGO2VBY0EsTUFBQSxDQUFPLGFBQWEsQ0FBQyxrQkFBZCxDQUFBLENBQVAsQ0FBMEMsQ0FBQyxPQUEzQyxDQUFtRCxDQUFDLENBQUQsRUFBSSxDQUFKLENBQW5EO01BbEJTLENBQVg7YUFvQkEsUUFBQSxDQUFTLG1DQUFULEVBQThDLFNBQUE7ZUFDNUMs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ZGVzY3JpYmUgXCJTY3JvbGxpbmdcIiwgLT5cbiAgW3NldCwgZW5zdXJlLCBrZXlzdHJva2UsIGVkaXRvciwgZWRpdG9yRWxlbWVudCwgdmltU3RhdGVdID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgZ2V0VmltU3RhdGUgKHN0YXRlLCB2aW0pIC0+XG4gICAgICB2aW1TdGF0ZSA9IHN0YXRlXG4gICAgICB7ZWRpdG9yLCBlZGl0b3JFbGVtZW50fSA9IHZpbVN0YXRlXG4gICAgICB7c2V0LCBlbnN1cmUsIGtleXN0cm9rZX0gPSB2aW1cbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00oZWRpdG9yRWxlbWVudClcblxuICBhZnRlckVhY2ggLT5cbiAgICB2aW1TdGF0ZS5yZXNldE5vcm1hbE1vZGUoKVxuXG4gIGRlc2NyaWJlIFwic2Nyb2xsaW5nIGtleWJpbmRpbmdzXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgZWRpdG9yLnNldExpbmVIZWlnaHRJblBpeGVscygxMClcbiAgICAgIGVkaXRvckVsZW1lbnQuc2V0SGVpZ2h0KDUwKVxuICAgICAgYXRvbS52aWV3cy5wZXJmb3JtRG9jdW1lbnRQb2xsKClcbiAgICAgIHNldFxuICAgICAgICBjdXJzb3I6IFsxLCAyXVxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAxMDBcbiAgICAgICAgICAyMDBcbiAgICAgICAgICAzMDBcbiAgICAgICAgICA0MDBcbiAgICAgICAgICA1MDBcbiAgICAgICAgICA2MDBcbiAgICAgICAgICA3MDBcbiAgICAgICAgICA4MDBcbiAgICAgICAgICA5MDBcbiAgICAgICAgICAxMDAwXG4gICAgICAgIFwiXCJcIlxuICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQuZ2V0VmlzaWJsZVJvd1JhbmdlKCkpLnRvRXF1YWwgWzAsIDRdXG5cbiAgICBkZXNjcmliZSBcInRoZSBjdHJsLWUgYW5kIGN0cmwteSBrZXliaW5kaW5nc1wiLCAtPlxuICAgICAgaXQgXCJtb3ZlcyB0aGUgc2NyZWVuIHVwIGFuZCBkb3duIGJ5IG9uZSBhbmQga2VlcHMgY3Vyc29yIG9uc2NyZWVuXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnY3RybC1lJywgY3Vyc29yOiBbMiwgMl1cbiAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKSkudG9CZSAxXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKSkudG9CZSA2XG5cbiAgICAgICAgZW5zdXJlICcyIGN0cmwtZScsIGN1cnNvcjogWzQsIDJdXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KCkpLnRvQmUgM1xuICAgICAgICBleHBlY3QoZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCkpLnRvQmUgOFxuICAgICAgICBcbiAgICAgICAgZW5zdXJlICcyIGN0cmwteScsIGN1cnNvcjogWzIsIDJdXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KCkpLnRvQmUgMVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCkpLnRvQmUgNlxuXG4gIGRlc2NyaWJlIFwic2Nyb2xsIGN1cnNvciBrZXliaW5kaW5nc1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGVkaXRvci5zZXRUZXh0IFsxLi4yMDBdLmpvaW4oXCJcXG5cIilcbiAgICAgIGVkaXRvckVsZW1lbnQuc3R5bGUubGluZUhlaWdodCA9IFwiMjBweFwiXG4gICAgICBlZGl0b3JFbGVtZW50LmNvbXBvbmVudC5zYW1wbGVGb250U3R5bGluZygpXG4gICAgICBlZGl0b3JFbGVtZW50LnNldEhlaWdodCgyMCAqIDEwKVxuICAgICAgc3B5T24oZWRpdG9yLCAnbW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUnKVxuICAgICAgc3B5T24oZWRpdG9yRWxlbWVudCwgJ3NldFNjcm9sbFRvcCcpXG4gICAgICBzcHlPbihlZGl0b3JFbGVtZW50LCAnZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93JykuYW5kUmV0dXJuKDkwKVxuICAgICAgc3B5T24oZWRpdG9yRWxlbWVudCwgJ2dldExhc3RWaXNpYmxlU2NyZWVuUm93JykuYW5kUmV0dXJuKDExMClcbiAgICAgIHNweU9uKGVkaXRvckVsZW1lbnQsICdwaXhlbFBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24nKS5hbmRSZXR1cm4oe3RvcDogMTAwMCwgbGVmdDogMH0pXG5cbiAgICBkZXNjcmliZSBcInRoZSB6PENSPiBrZXliaW5kaW5nXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIHRoZSBzY3JlZW4gdG8gcG9zaXRpb24gY3Vyc29yIGF0IHRoZSB0b3Agb2YgdGhlIHdpbmRvdyBhbmQgbW92ZXMgY3Vyc29yIHRvIGZpcnN0IG5vbi1ibGFuayBpbiB0aGUgbGluZVwiLCAtPlxuICAgICAgICBrZXlzdHJva2UgJ3ogZW50ZXInXG4gICAgICAgIGV4cGVjdChlZGl0b3JFbGVtZW50LnNldFNjcm9sbFRvcCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoOTYwKVxuICAgICAgICBleHBlY3QoZWRpdG9yLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgIGRlc2NyaWJlIFwidGhlIHp0IGtleWJpbmRpbmdcIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIHNjcmVlbiB0byBwb3NpdGlvbiBjdXJzb3IgYXQgdGhlIHRvcCBvZiB0aGUgd2luZG93IGFuZCBsZWF2ZSBjdXJzb3IgaW4gdGhlIHNhbWUgY29sdW1uXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAneiB0J1xuICAgICAgICBleHBlY3QoZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxUb3ApLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDk2MClcbiAgICAgICAgZXhwZWN0KGVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gICAgZGVzY3JpYmUgXCJ0aGUgei4ga2V5YmluZGluZ1wiLCAtPlxuICAgICAgaXQgXCJtb3ZlcyB0aGUgc2NyZWVuIHRvIHBvc2l0aW9uIGN1cnNvciBhdCB0aGUgY2VudGVyIG9mIHRoZSB3aW5kb3cgYW5kIG1vdmVzIGN1cnNvciB0byBmaXJzdCBub24tYmxhbmsgaW4gdGhlIGxpbmVcIiwgLT5cbiAgICAgICAga2V5c3Ryb2tlICd6IC4nXG4gICAgICAgIGV4cGVjdChlZGl0b3JFbGVtZW50LnNldFNjcm9sbFRvcCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoOTAwKVxuICAgICAgICBleHBlY3QoZWRpdG9yLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgIGRlc2NyaWJlIFwidGhlIHp6IGtleWJpbmRpbmdcIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIHNjcmVlbiB0byBwb3NpdGlvbiBjdXJzb3IgYXQgdGhlIGNlbnRlciBvZiB0aGUgd2luZG93IGFuZCBsZWF2ZSBjdXJzb3IgaW4gdGhlIHNhbWUgY29sdW1uXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAneiB6J1xuICAgICAgICBleHBlY3QoZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxUb3ApLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDkwMClcbiAgICAgICAgZXhwZWN0KGVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gICAgZGVzY3JpYmUgXCJ0aGUgei0ga2V5YmluZGluZ1wiLCAtPlxuICAgICAgaXQgXCJtb3ZlcyB0aGUgc2NyZWVuIHRvIHBvc2l0aW9uIGN1cnNvciBhdCB0aGUgYm90dG9tIG9mIHRoZSB3aW5kb3cgYW5kIG1vdmVzIGN1cnNvciB0byBmaXJzdCBub24tYmxhbmsgaW4gdGhlIGxpbmVcIiwgLT5cbiAgICAgICAga2V5c3Ryb2tlICd6IC0nXG4gICAgICAgIGV4cGVjdChlZGl0b3JFbGVtZW50LnNldFNjcm9sbFRvcCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoODYwKVxuICAgICAgICBleHBlY3QoZWRpdG9yLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgIGRlc2NyaWJlIFwidGhlIHpiIGtleWJpbmRpbmdcIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIHNjcmVlbiB0byBwb3NpdGlvbiBjdXJzb3IgYXQgdGhlIGJvdHRvbSBvZiB0aGUgd2luZG93IGFuZCBsZWF2ZSBjdXJzb3IgaW4gdGhlIHNhbWUgY29sdW1uXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAneiBiJ1xuICAgICAgICBleHBlY3QoZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxUb3ApLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDg2MClcbiAgICAgICAgZXhwZWN0KGVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gIGRlc2NyaWJlIFwiaG9yaXpvbnRhbCBzY3JvbGwgY3Vyc29yIGtleWJpbmRpbmdzXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgZWRpdG9yRWxlbWVudC5zZXRXaWR0aCg2MDApXG4gICAgICBlZGl0b3JFbGVtZW50LnNldEhlaWdodCg2MDApXG4gICAgICBlZGl0b3JFbGVtZW50LnN0eWxlLmxpbmVIZWlnaHQgPSBcIjEwcHhcIlxuICAgICAgZWRpdG9yRWxlbWVudC5zdHlsZS5mb250ID0gXCIxNnB4IG1vbm9zcGFjZVwiXG4gICAgICBhdG9tLnZpZXdzLnBlcmZvcm1Eb2N1bWVudFBvbGwoKVxuICAgICAgdGV4dCA9IFwiXCJcbiAgICAgIGZvciBpIGluIFsxMDAuLjE5OV1cbiAgICAgICAgdGV4dCArPSBcIiN7aX0gXCJcbiAgICAgIGVkaXRvci5zZXRUZXh0KHRleHQpXG4gICAgICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oWzAsIDBdKVxuXG4gICAgZGVzY3JpYmUgXCJ0aGUgenMga2V5YmluZGluZ1wiLCAtPlxuICAgICAgenNQb3MgPSAocG9zKSAtPlxuICAgICAgICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oWzAsIHBvc10pXG4gICAgICAgIGtleXN0cm9rZSAneiBzJ1xuICAgICAgICBlZGl0b3JFbGVtZW50LmdldFNjcm9sbExlZnQoKVxuXG4gICAgICBzdGFydFBvc2l0aW9uID0gTmFOXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHN0YXJ0UG9zaXRpb24gPSBlZGl0b3JFbGVtZW50LmdldFNjcm9sbExlZnQoKVxuXG4gICAgICAjIEZJWE1FOiByZW1vdmUgaW4gZnV0dXJlXG4gICAgICB4aXQgXCJkb2VzIG5vdGhpbmcgbmVhciB0aGUgc3RhcnQgb2YgdGhlIGxpbmVcIiwgLT5cbiAgICAgICAgcG9zMSA9IHpzUG9zKDEpXG4gICAgICAgIGV4cGVjdChwb3MxKS50b0VxdWFsKHN0YXJ0UG9zaXRpb24pXG5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0aGUgbmVhcmVzdCBpdCBjYW4gdG8gdGhlIGxlZnQgZWRnZSBvZiB0aGUgZWRpdG9yXCIsIC0+XG4gICAgICAgIHBvczEwID0genNQb3MoMTApXG4gICAgICAgIGV4cGVjdChwb3MxMCkudG9CZUdyZWF0ZXJUaGFuKHN0YXJ0UG9zaXRpb24pXG5cbiAgICAgICAgcG9zMTEgPSB6c1BvcygxMSlcbiAgICAgICAgZXhwZWN0KHBvczExIC0gcG9zMTApLnRvRXF1YWwoMTApXG5cbiAgICAgIGl0IFwiZG9lcyBub3RoaW5nIG5lYXIgdGhlIGVuZCBvZiB0aGUgbGluZVwiLCAtPlxuICAgICAgICBwb3NFbmQgPSB6c1BvcygzOTkpXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSkudG9FcXVhbCBbMCwgMzk5XVxuXG4gICAgICAgIHBvczM5MCA9IHpzUG9zKDM5MClcbiAgICAgICAgZXhwZWN0KHBvczM5MCkudG9FcXVhbChwb3NFbmQpXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSkudG9FcXVhbCBbMCwgMzkwXVxuXG4gICAgICAgIHBvczM0MCA9IHpzUG9zKDM0MClcbiAgICAgICAgZXhwZWN0KHBvczM0MCkudG9FcXVhbChwb3NFbmQpXG5cbiAgICAgIGl0IFwiZG9lcyBub3RoaW5nIGlmIGFsbCBsaW5lcyBhcmUgc2hvcnRcIiwgLT5cbiAgICAgICAgZWRpdG9yLnNldFRleHQoJ3Nob3J0JylcbiAgICAgICAgc3RhcnRQb3NpdGlvbiA9IGVkaXRvckVsZW1lbnQuZ2V0U2Nyb2xsTGVmdCgpXG4gICAgICAgIHBvczEgPSB6c1BvcygxKVxuICAgICAgICBleHBlY3QocG9zMSkudG9FcXVhbChzdGFydFBvc2l0aW9uKVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpLnRvRXF1YWwgWzAsIDFdXG4gICAgICAgIHBvczEwID0genNQb3MoMTApXG4gICAgICAgIGV4cGVjdChwb3MxMCkudG9FcXVhbChzdGFydFBvc2l0aW9uKVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpLnRvRXF1YWwgWzAsIDRdXG5cbiAgICBkZXNjcmliZSBcInRoZSB6ZSBrZXliaW5kaW5nXCIsIC0+XG4gICAgICB6ZVBvcyA9IChwb3MpIC0+XG4gICAgICAgIGVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihbMCwgcG9zXSlcbiAgICAgICAga2V5c3Ryb2tlICd6IGUnXG4gICAgICAgIGVkaXRvckVsZW1lbnQuZ2V0U2Nyb2xsTGVmdCgpXG5cbiAgICAgIHN0YXJ0UG9zaXRpb24gPSBOYU5cblxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzdGFydFBvc2l0aW9uID0gZWRpdG9yRWxlbWVudC5nZXRTY3JvbGxMZWZ0KClcblxuICAgICAgaXQgXCJkb2VzIG5vdGhpbmcgbmVhciB0aGUgc3RhcnQgb2YgdGhlIGxpbmVcIiwgLT5cbiAgICAgICAgcG9zMSA9IHplUG9zKDEpXG4gICAgICAgIGV4cGVjdChwb3MxKS50b0VxdWFsKHN0YXJ0UG9zaXRpb24pXG5cbiAgICAgICAgcG9zNDAgPSB6ZVBvcyg0MClcbiAgICAgICAgZXhwZWN0KHBvczQwKS50b0VxdWFsKHN0YXJ0UG9zaXRpb24pXG5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0aGUgbmVhcmVzdCBpdCBjYW4gdG8gdGhlIHJpZ2h0IGVkZ2Ugb2YgdGhlIGVkaXRvclwiLCAtPlxuICAgICAgICBwb3MxMTAgPSB6ZVBvcygxMTApXG4gICAgICAgIGV4cGVjdChwb3MxMTApLnRvQmVHcmVhdGVyVGhhbihzdGFydFBvc2l0aW9uKVxuXG4gICAgICAgIHBvczEwOSA9IHplUG9zKDEwOSlcbiAgICAgICAgZXhwZWN0KHBvczExMCAtIHBvczEwOSkudG9FcXVhbCg5KVxuXG4gICAgICAjIEZJWE1FIGRlc2NyaXB0aW9uIGlzIG5vIGxvbmdlciBhcHByb3ByaWF0ZVxuICAgICAgaXQgXCJkb2VzIG5vdGhpbmcgd2hlbiB2ZXJ5IG5lYXIgdGhlIGVuZCBvZiB0aGUgbGluZVwiLCAtPlxuICAgICAgICBwb3NFbmQgPSB6ZVBvcygzOTkpXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSkudG9FcXVhbCBbMCwgMzk5XVxuXG4gICAgICAgIHBvczM5NyA9IHplUG9zKDM5NylcbiAgICAgICAgZXhwZWN0KHBvczM5NykudG9CZUxlc3NUaGFuKHBvc0VuZClcbiAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKS50b0VxdWFsIFswLCAzOTddXG5cbiAgICAgICAgcG9zMzgwID0gemVQb3MoMzgwKVxuICAgICAgICBleHBlY3QocG9zMzgwKS50b0JlTGVzc1RoYW4ocG9zRW5kKVxuXG4gICAgICAgIHBvczM4MiA9IHplUG9zKDM4MilcbiAgICAgICAgZXhwZWN0KHBvczM4MiAtIHBvczM4MCkudG9FcXVhbCgxOSlcblxuICAgICAgaXQgXCJkb2VzIG5vdGhpbmcgaWYgYWxsIGxpbmVzIGFyZSBzaG9ydFwiLCAtPlxuICAgICAgICBlZGl0b3Iuc2V0VGV4dCgnc2hvcnQnKVxuICAgICAgICBzdGFydFBvc2l0aW9uID0gZWRpdG9yRWxlbWVudC5nZXRTY3JvbGxMZWZ0KClcbiAgICAgICAgcG9zMSA9IHplUG9zKDEpXG4gICAgICAgIGV4cGVjdChwb3MxKS50b0VxdWFsKHN0YXJ0UG9zaXRpb24pXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSkudG9FcXVhbCBbMCwgMV1cbiAgICAgICAgcG9zMTAgPSB6ZVBvcygxMClcbiAgICAgICAgZXhwZWN0KHBvczEwKS50b0VxdWFsKHN0YXJ0UG9zaXRpb24pXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSkudG9FcXVhbCBbMCwgNF1cbiJdfQ==
