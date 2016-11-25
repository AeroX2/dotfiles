(function() {
  var TextData, dispatch, getVimState, ref;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData;

  describe("TextObject", function() {
    var editor, editorElement, ensure, getCheckFunctionFor, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    getCheckFunctionFor = function(textObject) {
      return function(initialPoint, keystroke, options) {
        set({
          cursor: initialPoint
        });
        return ensure(keystroke + " " + textObject, options);
      };
    };
    beforeEach(function() {
      return getVimState(function(state, vimEditor) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = vimEditor.set, ensure = vimEditor.ensure, keystroke = vimEditor.keystroke, vimEditor;
      });
    });
    afterEach(function() {
      return vimState.resetNormalMode();
    });
    describe("TextObject", function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.packages.activatePackage('language-coffee-script');
        });
        return getVimState('sample.coffee', function(state, vimEditor) {
          editor = state.editor, editorElement = state.editorElement;
          return set = vimEditor.set, ensure = vimEditor.ensure, keystroke = vimEditor.keystroke, vimEditor;
        });
      });
      afterEach(function() {
        return atom.packages.deactivatePackage('language-coffee-script');
      });
      return describe("when TextObject is excuted directly", function() {
        return it("select that TextObject", function() {
          set({
            cursor: [8, 7]
          });
          dispatch(editorElement, 'vim-mode-plus:inner-word');
          return ensure({
            selectedText: 'QuickSort'
          });
        });
      });
    });
    describe("Word", function() {
      describe("inner-word", function() {
        beforeEach(function() {
          return set({
            text: "12345 abcde ABCDE",
            cursor: [0, 9]
          });
        });
        it("applies operators inside the current word in operator-pending mode", function() {
          return ensure('d i w', {
            text: "12345  ABCDE",
            cursor: [0, 6],
            register: {
              '"': {
                text: 'abcde'
              }
            },
            mode: 'normal'
          });
        });
        it("selects inside the current word in visual mode", function() {
          return ensure('v i w', {
            selectedScreenRange: [[0, 6], [0, 11]]
          });
        });
        it("works with multiple cursors", function() {
          set({
            addCursor: [0, 1]
          });
          return ensure('v i w', {
            selectedBufferRange: [[[0, 6], [0, 11]], [[0, 0], [0, 5]]]
          });
        });
        describe("cursor is on next to NonWordCharacter", function() {
          beforeEach(function() {
            return set({
              text: "abc(def)",
              cursor: [0, 4]
            });
          });
          it("change inside word", function() {
            return ensure('c i w', {
              text: "abc()",
              mode: "insert"
            });
          });
          return it("delete inside word", function() {
            return ensure('d i w', {
              text: "abc()",
              mode: "normal"
            });
          });
        });
        return describe("cursor's next char is NonWordCharacter", function() {
          beforeEach(function() {
            return set({
              text: "abc(def)",
              cursor: [0, 6]
            });
          });
          it("change inside word", function() {
            return ensure('c i w', {
              text: "abc()",
              mode: "insert"
            });
          });
          return it("delete inside word", function() {
            return ensure('d i w', {
              text: "abc()",
              mode: "normal"
            });
          });
        });
      });
      return describe("a-word", function() {
        beforeEach(function() {
          return set({
            text: "12345 abcde ABCDE",
            cursor: [0, 9]
          });
        });
        it("select current-word and trailing white space", function() {
          return ensure('d a w', {
            text: "12345 ABCDE",
            cursor: [0, 6],
            register: {
              '"': {
                text: "abcde "
              }
            }
          });
        });
        it("select current-word and leading white space in case trailing white space wasn't there", function() {
          set({
            cursor: [0, 15]
          });
          return ensure('d a w', {
            text: "12345 abcde",
            cursor: [0, 10],
            register: {
              '"': {
                text: " ABCDE"
              }
            }
          });
        });
        it("selects from the start of the current word to the start of the next word in visual mode", function() {
          return ensure('v a w', {
            selectedScreenRange: [[0, 6], [0, 12]]
          });
        });
        it("doesn't span newlines", function() {
          set({
            text: "12345\nabcde ABCDE",
            cursor: [0, 3]
          });
          return ensure('v a w', {
            selectedBufferRange: [[0, 0], [0, 5]]
          });
        });
        return it("doesn't span special characters", function() {
          set({
            text: "1(345\nabcde ABCDE",
            cursor: [0, 3]
          });
          return ensure('v a w', {
            selectedBufferRange: [[0, 2], [0, 5]]
          });
        });
      });
    });
    describe("WholeWord", function() {
      describe("inner-whole-word", function() {
        beforeEach(function() {
          return set({
            text: "12(45 ab'de ABCDE",
            cursor: [0, 9]
          });
        });
        it("applies operators inside the current whole word in operator-pending mode", function() {
          return ensure('d i W', {
            text: "12(45  ABCDE",
            cursor: [0, 6],
            register: {
              '"': {
                text: "ab'de"
              }
            }
          });
        });
        return it("selects inside the current whole word in visual mode", function() {
          return ensure('v i W', {
            selectedScreenRange: [[0, 6], [0, 11]]
          });
        });
      });
      return describe("a-whole-word", function() {
        beforeEach(function() {
          return set({
            text: "12(45 ab'de ABCDE",
            cursor: [0, 9]
          });
        });
        it("select whole-word and trailing white space", function() {
          return ensure('d a W', {
            text: "12(45 ABCDE",
            cursor: [0, 6],
            register: {
              '"': {
                text: "ab'de "
              }
            },
            mode: 'normal'
          });
        });
        it("select whole-word and leading white space in case trailing white space wasn't there", function() {
          set({
            cursor: [0, 15]
          });
          return ensure('d a w', {
            text: "12(45 ab'de",
            cursor: [0, 10],
            register: {
              '"': {
                text: " ABCDE"
              }
            }
          });
        });
        it("selects from the start of the current whole word to the start of the next whole word in visual mode", function() {
          return ensure('v a W', {
            selectedScreenRange: [[0, 6], [0, 12]]
          });
        });
        return it("doesn't span newlines", function() {
          set({
            text: "12(45\nab'de ABCDE",
            cursor: [0, 4]
          });
          return ensure('v a W', {
            selectedBufferRange: [[0, 0], [0, 5]]
          });
        });
      });
    });
    describe("AnyPair", function() {
      var complexText, ref2, simpleText;
      ref2 = {}, simpleText = ref2.simpleText, complexText = ref2.complexText;
      beforeEach(function() {
        simpleText = ".... \"abc\" ....\n.... 'abc' ....\n.... `abc` ....\n.... {abc} ....\n.... <abc> ....\n.... [abc] ....\n.... (abc) ....";
        complexText = "[4s\n--{3s\n----\"2s(1s-1e)2e\"\n---3e}-4e\n]";
        return set({
          text: simpleText,
          cursor: [0, 7]
        });
      });
      describe("inner-any-pair", function() {
        it("applies operators any inner-pair and repeatable", function() {
          ensure('d i s', {
            text: ".... \"\" ....\n.... 'abc' ....\n.... `abc` ....\n.... {abc} ....\n.... <abc> ....\n.... [abc] ....\n.... (abc) ...."
          });
          return ensure('j . j . j . j . j . j . j .', {
            text: ".... \"\" ....\n.... '' ....\n.... `` ....\n.... {} ....\n.... <> ....\n.... [] ....\n.... () ...."
          });
        });
        return it("can expand selection", function() {
          set({
            text: complexText,
            cursor: [2, 8]
          });
          keystroke('v');
          ensure('i s', {
            selectedText: "1s-1e"
          });
          ensure('i s', {
            selectedText: "2s(1s-1e)2e"
          });
          ensure('i s', {
            selectedText: "3s\n----\"2s(1s-1e)2e\"\n---3e"
          });
          return ensure('i s', {
            selectedText: "4s\n--{3s\n----\"2s(1s-1e)2e\"\n---3e}-4e"
          });
        });
      });
      return describe("a-any-pair", function() {
        it("applies operators any a-pair and repeatable", function() {
          ensure('d a s', {
            text: "....  ....\n.... 'abc' ....\n.... `abc` ....\n.... {abc} ....\n.... <abc> ....\n.... [abc] ....\n.... (abc) ...."
          });
          return ensure('j . j . j . j . j . j . j .', {
            text: "....  ....\n....  ....\n....  ....\n....  ....\n....  ....\n....  ....\n....  ...."
          });
        });
        return it("can expand selection", function() {
          set({
            text: complexText,
            cursor: [2, 8]
          });
          keystroke('v');
          ensure('a s', {
            selectedText: "(1s-1e)"
          });
          ensure('a s', {
            selectedText: "\"2s(1s-1e)2e\""
          });
          ensure('a s', {
            selectedText: "{3s\n----\"2s(1s-1e)2e\"\n---3e}"
          });
          return ensure('a s', {
            selectedText: "[4s\n--{3s\n----\"2s(1s-1e)2e\"\n---3e}-4e\n]"
          });
        });
      });
    });
    describe("AnyQuote", function() {
      beforeEach(function() {
        return set({
          text: "--\"abc\" `def`  'efg'--",
          cursor: [0, 0]
        });
      });
      describe("inner-any-quote", function() {
        it("applies operators any inner-pair and repeatable", function() {
          ensure('d i q', {
            text: "--\"\" `def`  'efg'--"
          });
          ensure('.', {
            text: "--\"\" ``  'efg'--"
          });
          return ensure('.', {
            text: "--\"\" ``  ''--"
          });
        });
        return it("can select next quote", function() {
          keystroke('v');
          ensure('i q', {
            selectedText: 'abc'
          });
          ensure('i q', {
            selectedText: 'def'
          });
          return ensure('i q', {
            selectedText: 'efg'
          });
        });
      });
      return describe("a-any-quote", function() {
        it("applies operators any a-quote and repeatable", function() {
          ensure('d a q', {
            text: "-- `def`  'efg'--"
          });
          ensure('.', {
            text: "--   'efg'--"
          });
          ensure('.', {
            text: "--   --"
          });
          return ensure('.');
        });
        return it("can select next quote", function() {
          keystroke('v');
          ensure('a q', {
            selectedText: '"abc"'
          });
          ensure('a q', {
            selectedText: '`def`'
          });
          return ensure('a q', {
            selectedText: "'efg'"
          });
        });
      });
    });
    describe("DoubleQuote", function() {
      describe("inner-double-quote", function() {
        beforeEach(function() {
          return set({
            text: '" something in here and in "here" " and over here',
            cursor: [0, 9]
          });
        });
        it("applies operators inside the current string in operator-pending mode", function() {
          return ensure('d i "', {
            text: '""here" " and over here',
            cursor: [0, 1]
          });
        });
        it("skip non-string area and operate forwarding string whithin line", function() {
          set({
            cursor: [0, 29]
          });
          return ensure('d i "', {
            text: '" something in here and in "here"" and over here',
            cursor: [0, 33]
          });
        });
        it("makes no change if past the last string on a line", function() {
          set({
            cursor: [0, 39]
          });
          return ensure('d i "', {
            text: '" something in here and in "here" " and over here',
            cursor: [0, 39]
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor('i "');
          text = '-"+"-';
          textFinal = '-""-';
          selectedText = '+';
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
      return describe("a-double-quote", function() {
        var originalText;
        originalText = '" something in here and in "here" "';
        beforeEach(function() {
          return set({
            text: originalText,
            cursor: [0, 9]
          });
        });
        it("applies operators around the current double quotes in operator-pending mode", function() {
          return ensure('d a "', {
            text: 'here" "',
            cursor: [0, 0],
            mode: 'normal'
          });
        });
        it("skip non-string area and operate forwarding string whithin line", function() {
          set({
            cursor: [0, 29]
          });
          return ensure('d a "', {
            text: '" something in here and in "here',
            cursor: [0, 31],
            mode: 'normal'
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor('a "');
          text = '-"+"-';
          textFinal = '--';
          selectedText = '"+"';
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
    });
    describe("SingleQuote", function() {
      describe("inner-single-quote", function() {
        beforeEach(function() {
          return set({
            text: "' something in here and in 'here' ' and over here",
            cursor: [0, 9]
          });
        });
        describe("don't treat literal backslash(double backslash) as escape char", function() {
          beforeEach(function() {
            return set({
              text: "'some-key-here\\\\': 'here-is-the-val'"
            });
          });
          it("case-1", function() {
            set({
              cursor: [0, 2]
            });
            return ensure("d i '", {
              text: "'': 'here-is-the-val'",
              cursor: [0, 1]
            });
          });
          return it("case-2", function() {
            set({
              cursor: [0, 19]
            });
            return ensure("d i '", {
              text: "'some-key-here\\\\': ''",
              cursor: [0, 20]
            });
          });
        });
        describe("treat backslash(single backslash) as escape char", function() {
          beforeEach(function() {
            return set({
              text: "'some-key-here\\'': 'here-is-the-val'"
            });
          });
          it("case-1", function() {
            set({
              cursor: [0, 2]
            });
            return ensure("d i '", {
              text: "'': 'here-is-the-val'",
              cursor: [0, 1]
            });
          });
          return it("case-2", function() {
            set({
              cursor: [0, 17]
            });
            return ensure("d i '", {
              text: "'some-key-here\\'': ''",
              cursor: [0, 20]
            });
          });
        });
        it("applies operators inside the current string in operator-pending mode", function() {
          return ensure("d i '", {
            text: "''here' ' and over here",
            cursor: [0, 1]
          });
        });
        it("applies operators inside the next string in operator-pending mode (if not in a string)", function() {
          set({
            cursor: [0, 26]
          });
          return ensure("d i '", {
            text: "''here' ' and over here",
            cursor: [0, 1]
          });
        });
        it("makes no change if past the last string on a line", function() {
          set({
            cursor: [0, 39]
          });
          return ensure("d i '", {
            text: "' something in here and in 'here' ' and over here",
            cursor: [0, 39]
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor("i '");
          text = "-'+'-";
          textFinal = "-''-";
          selectedText = '+';
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
      return describe("a-single-quote", function() {
        var originalText;
        originalText = "' something in here and in 'here' '";
        beforeEach(function() {
          return set({
            text: originalText,
            cursor: [0, 9]
          });
        });
        it("applies operators around the current single quotes in operator-pending mode", function() {
          return ensure("d a '", {
            text: "here' '",
            cursor: [0, 0],
            mode: 'normal'
          });
        });
        it("applies operators inside the next string in operator-pending mode (if not in a string)", function() {
          set({
            cursor: [0, 29]
          });
          return ensure("d a '", {
            text: "' something in here and in 'here",
            cursor: [0, 31],
            mode: 'normal'
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor("a '");
          text = "-'+'-";
          textFinal = "--";
          selectedText = "'+'";
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
    });
    describe("BackTick", function() {
      var originalText;
      originalText = "this is `sample` text.";
      beforeEach(function() {
        return set({
          text: originalText,
          cursor: [0, 9]
        });
      });
      describe("inner-back-tick", function() {
        it("applies operators inner-area", function() {
          return ensure("d i `", {
            text: "this is `` text.",
            cursor: [0, 9]
          });
        });
        it("do nothing when pair range is not under cursor", function() {
          set({
            cursor: [0, 16]
          });
          return ensure("d i `", {
            text: originalText,
            cursor: [0, 16]
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor('i `');
          text = '-`+`-';
          textFinal = '-``-';
          selectedText = '+';
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
      return describe("a-back-tick", function() {
        it("applies operators inner-area", function() {
          return ensure("d a `", {
            text: "this is  text.",
            cursor: [0, 8]
          });
        });
        it("do nothing when pair range is not under cursor", function() {
          set({
            cursor: [0, 16]
          });
          return ensure("d a `", {
            text: originalText,
            cursor: [0, 16]
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor("a `");
          text = "-`+`-";
          textFinal = "--";
          selectedText = "`+`";
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
    });
    describe("CurlyBracket", function() {
      describe("inner-curly-bracket", function() {
        beforeEach(function() {
          return set({
            text: "{ something in here and in {here} }",
            cursor: [0, 9]
          });
        });
        it("applies operators to inner-area in operator-pending mode", function() {
          return ensure('d i {', {
            text: "{}",
            cursor: [0, 1]
          });
        });
        it("applies operators to inner-area in operator-pending mode (second test)", function() {
          set({
            cursor: [0, 29]
          });
          return ensure('d i {', {
            text: "{ something in here and in {} }",
            cursor: [0, 28]
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor('i {');
          text = '-{+}-';
          textFinal = '-{}-';
          selectedText = '+';
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
      return describe("a-curly-bracket", function() {
        beforeEach(function() {
          return set({
            text: "{ something in here and in {here} }",
            cursor: [0, 9]
          });
        });
        it("applies operators to a-area in operator-pending mode", function() {
          return ensure('d a {', {
            text: '',
            cursor: [0, 0],
            mode: 'normal'
          });
        });
        it("applies operators to a-area in operator-pending mode (second test)", function() {
          set({
            cursor: [0, 29]
          });
          return ensure('d a {', {
            text: "{ something in here and in  }",
            cursor: [0, 27],
            mode: 'normal'
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor("a {");
          text = "-{+}-";
          textFinal = "--";
          selectedText = "{+}";
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
    });
    describe("AngleBracket", function() {
      describe("inner-angle-bracket", function() {
        beforeEach(function() {
          return set({
            text: "< something in here and in <here> >",
            cursor: [0, 9]
          });
        });
        it("applies operators inside the current word in operator-pending mode", function() {
          return ensure('d i <', {
            text: "<>",
            cursor: [0, 1]
          });
        });
        it("applies operators inside the current word in operator-pending mode (second test)", function() {
          set({
            cursor: [0, 29]
          });
          return ensure('d i <', {
            text: "< something in here and in <> >",
            cursor: [0, 28]
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor('i <');
          text = '-<+>-';
          textFinal = '-<>-';
          selectedText = '+';
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
      return describe("a-angle-bracket", function() {
        beforeEach(function() {
          return set({
            text: "< something in here and in <here> >",
            cursor: [0, 9]
          });
        });
        it("applies operators around the current angle brackets in operator-pending mode", function() {
          return ensure('d a <', {
            text: '',
            cursor: [0, 0],
            mode: 'normal'
          });
        });
        it("applies operators around the current angle brackets in operator-pending mode (second test)", function() {
          set({
            cursor: [0, 29]
          });
          return ensure('d a <', {
            text: "< something in here and in  >",
            cursor: [0, 27],
            mode: 'normal'
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor("a <");
          text = "-<+>-";
          textFinal = "--";
          selectedText = "<+>";
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
    });
    describe("AllowForwarding family", function() {
      beforeEach(function() {
        atom.keymaps.add("test", {
          'atom-text-editor.vim-mode-plus.operator-pending-mode, atom-text-editor.vim-mode-plus.visual-mode': {
            'i }': 'vim-mode-plus:inner-curly-bracket-allow-forwarding',
            'i >': 'vim-mode-plus:inner-angle-bracket-allow-forwarding',
            'i ]': 'vim-mode-plus:inner-square-bracket-allow-forwarding',
            'i )': 'vim-mode-plus:inner-parenthesis-allow-forwarding',
            'a }': 'vim-mode-plus:a-curly-bracket-allow-forwarding',
            'a >': 'vim-mode-plus:a-angle-bracket-allow-forwarding',
            'a ]': 'vim-mode-plus:a-square-bracket-allow-forwarding',
            'a )': 'vim-mode-plus:a-parenthesis-allow-forwarding'
          }
        });
        return set({
          text: "__{000}__\n__<111>__\n__[222]__\n__(333)__"
        });
      });
      describe("inner", function() {
        return it("select forwarding range", function() {
          set({
            cursor: [0, 0]
          });
          ensure('escape v i }', {
            selectedText: "000"
          });
          set({
            cursor: [1, 0]
          });
          ensure('escape v i >', {
            selectedText: "111"
          });
          set({
            cursor: [2, 0]
          });
          ensure('escape v i ]', {
            selectedText: "222"
          });
          set({
            cursor: [3, 0]
          });
          return ensure('escape v i )', {
            selectedText: "333"
          });
        });
      });
      describe("a", function() {
        return it("select forwarding range", function() {
          set({
            cursor: [0, 0]
          });
          ensure('escape v a }', {
            selectedText: "{000}"
          });
          set({
            cursor: [1, 0]
          });
          ensure('escape v a >', {
            selectedText: "<111>"
          });
          set({
            cursor: [2, 0]
          });
          ensure('escape v a ]', {
            selectedText: "[222]"
          });
          set({
            cursor: [3, 0]
          });
          return ensure('escape v a )', {
            selectedText: "(333)"
          });
        });
      });
      return describe("multi line text", function() {
        var ref2, textOneA, textOneInner;
        ref2 = [], textOneInner = ref2[0], textOneA = ref2[1];
        beforeEach(function() {
          set({
            text: "000\n000{11\n111{22}\n111\n111}"
          });
          textOneInner = "11\n111{22}\n111\n111";
          return textOneA = "{11\n111{22}\n111\n111}";
        });
        describe("forwarding inner", function() {
          it("select forwarding range", function() {
            set({
              cursor: [1, 0]
            });
            return ensure("v i }", {
              selectedText: textOneInner
            });
          });
          it("select forwarding range", function() {
            set({
              cursor: [2, 0]
            });
            return ensure("v i }", {
              selectedText: "22"
            });
          });
          it("[case-1] no forwarding open pair, fail to find", function() {
            set({
              cursor: [0, 0]
            });
            return ensure("v i }", {
              selectedText: '0',
              cursor: [0, 1]
            });
          });
          it("[case-2] no forwarding open pair, select enclosed", function() {
            set({
              cursor: [1, 4]
            });
            return ensure("v i }", {
              selectedText: textOneInner
            });
          });
          it("[case-3] no forwarding open pair, select enclosed", function() {
            set({
              cursor: [3, 0]
            });
            return ensure("v i }", {
              selectedText: textOneInner
            });
          });
          return it("[case-3] no forwarding open pair, select enclosed", function() {
            set({
              cursor: [4, 0]
            });
            return ensure("v i }", {
              selectedText: textOneInner
            });
          });
        });
        return describe("forwarding a", function() {
          it("select forwarding range", function() {
            set({
              cursor: [1, 0]
            });
            return ensure("v a }", {
              selectedText: textOneA
            });
          });
          it("select forwarding range", function() {
            set({
              cursor: [2, 0]
            });
            return ensure("v a }", {
              selectedText: "{22}"
            });
          });
          it("[case-1] no forwarding open pair, fail to find", function() {
            set({
              cursor: [0, 0]
            });
            return ensure("v a }", {
              selectedText: '0',
              cursor: [0, 1]
            });
          });
          it("[case-2] no forwarding open pair, select enclosed", function() {
            set({
              cursor: [1, 4]
            });
            return ensure("v a }", {
              selectedText: textOneA
            });
          });
          it("[case-3] no forwarding open pair, select enclosed", function() {
            set({
              cursor: [3, 0]
            });
            return ensure("v a }", {
              selectedText: textOneA
            });
          });
          return it("[case-3] no forwarding open pair, select enclosed", function() {
            set({
              cursor: [4, 0]
            });
            return ensure("v a }", {
              selectedText: textOneA
            });
          });
        });
      });
    });
    describe("AnyPairAllowForwarding", function() {
      beforeEach(function() {
        atom.keymaps.add("text", {
          'atom-text-editor.vim-mode-plus.operator-pending-mode, atom-text-editor.vim-mode-plus.visual-mode': {
            ";": 'vim-mode-plus:inner-any-pair-allow-forwarding',
            ":": 'vim-mode-plus:a-any-pair-allow-forwarding'
          }
        });
        return set({
          text: "00\n00[11\n11\"222\"11{333}11(\n444()444\n)\n111]00{555}"
        });
      });
      describe("inner", function() {
        return it("select forwarding range within enclosed range(if exists)", function() {
          set({
            cursor: [2, 0]
          });
          keystroke('v');
          ensure(';', {
            selectedText: "222"
          });
          ensure(';', {
            selectedText: "333"
          });
          ensure(';', {
            selectedText: "444()444\n"
          });
          return ensure(';', {
            selectedText: "",
            selectedBufferRange: [[3, 4], [3, 4]]
          });
        });
      });
      return describe("a", function() {
        return it("select forwarding range within enclosed range(if exists)", function() {
          set({
            cursor: [2, 0]
          });
          keystroke('v');
          ensure(':', {
            selectedText: '"222"'
          });
          ensure(':', {
            selectedText: "{333}"
          });
          ensure(':', {
            selectedText: "(\n444()444\n)"
          });
          return ensure(':', {
            selectedText: "[11\n11\"222\"11{333}11(\n444()444\n)\n111]"
          });
        });
      });
    });
    describe("Tag", function() {
      var ensureSelectedText;
      ensureSelectedText = [][0];
      ensureSelectedText = function(start, keystroke, selectedText) {
        set({
          cursor: start
        });
        return ensure(keystroke, {
          selectedText: selectedText
        });
      };
      describe("inner-tag", function() {
        describe("pricisely select inner", function() {
          var check, deletedText, innerABC, selectedText, text;
          check = getCheckFunctionFor('i t');
          text = "<abc>  <title>TITLE</title> </abc>";
          deletedText = "<abc>  <title></title> </abc>";
          selectedText = "TITLE";
          innerABC = "  <title>TITLE</title> ";
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("[1] forwarding", function() {
            return check([0, 5], 'v', {
              selectedText: selectedText
            });
          });
          it("[2] openTag leftmost", function() {
            return check([0, 7], 'v', {
              selectedText: selectedText
            });
          });
          it("[3] openTag rightmost", function() {
            return check([0, 13], 'v', {
              selectedText: selectedText
            });
          });
          it("[4] Inner text", function() {
            return check([0, 16], 'v', {
              selectedText: selectedText
            });
          });
          it("[5] closeTag leftmost", function() {
            return check([0, 19], 'v', {
              selectedText: selectedText
            });
          });
          it("[6] closeTag rightmost", function() {
            return check([0, 26], 'v', {
              selectedText: selectedText
            });
          });
          it("[7] right of closeTag", function() {
            return check([0, 27], 'v', {
              selectedText: innerABC
            });
          });
          it("[8] forwarding", function() {
            return check([0, 5], 'd', {
              text: deletedText
            });
          });
          it("[9] openTag leftmost", function() {
            return check([0, 7], 'd', {
              text: deletedText
            });
          });
          it("[10] openTag rightmost", function() {
            return check([0, 13], 'd', {
              text: deletedText
            });
          });
          it("[11] Inner text", function() {
            return check([0, 16], 'd', {
              text: deletedText
            });
          });
          it("[12] closeTag leftmost", function() {
            return check([0, 19], 'd', {
              text: deletedText
            });
          });
          it("[13] closeTag rightmost", function() {
            return check([0, 26], 'd', {
              text: deletedText
            });
          });
          return it("[14] right of closeTag", function() {
            return check([0, 27], 'd', {
              text: "<abc></abc>"
            });
          });
        });
        return describe("expansion and deletion", function() {
          beforeEach(function() {
            var htmlLikeText;
            htmlLikeText = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n__<meta charset=\"UTF-8\" />\n__<title>Document</title>\n</head>\n<body>\n__<div>\n____<div>\n______<div>\n________<p><a>\n______</div>\n____</div>\n__</div>\n</body>\n</html>\n";
            return set({
              text: htmlLikeText
            });
          });
          it("can expand selection when repeated", function() {
            set({
              cursor: [9, 0]
            });
            ensure('v i t', {
              selectedText: "\n________<p><a>\n______"
            });
            ensure('i t', {
              selectedText: "\n______<div>\n________<p><a>\n______</div>\n____"
            });
            ensure('i t', {
              selectedText: "\n____<div>\n______<div>\n________<p><a>\n______</div>\n____</div>\n__"
            });
            ensure('i t', {
              selectedText: "\n__<div>\n____<div>\n______<div>\n________<p><a>\n______</div>\n____</div>\n__</div>\n"
            });
            return ensure('i t', {
              selectedText: "\n<head>\n__<meta charset=\"UTF-8\" />\n__<title>Document</title>\n</head>\n<body>\n__<div>\n____<div>\n______<div>\n________<p><a>\n______</div>\n____</div>\n__</div>\n</body>\n"
            });
          });
          return it('delete inner-tag and repatable', function() {
            set({
              cursor: [9, 0]
            });
            ensure("d i t", {
              text: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n__<meta charset=\"UTF-8\" />\n__<title>Document</title>\n</head>\n<body>\n__<div>\n____<div>\n______<div></div>\n____</div>\n__</div>\n</body>\n</html>\n"
            });
            ensure("3 .", {
              text: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n__<meta charset=\"UTF-8\" />\n__<title>Document</title>\n</head>\n<body></body>\n</html>\n"
            });
            return ensure(".", {
              text: "<!DOCTYPE html>\n<html lang=\"en\"></html>\n"
            });
          });
        });
      });
      return describe("a-tag", function() {
        return describe("pricisely select a", function() {
          var aABC, check, deletedText, selectedText, text;
          check = getCheckFunctionFor('a t');
          text = "<abc>  <title>TITLE</title> </abc>";
          deletedText = "<abc>   </abc>";
          selectedText = "<title>TITLE</title>";
          aABC = "<abc>  <title>TITLE</title> </abc>";
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("[1] forwarding", function() {
            return check([0, 5], 'v', {
              selectedText: selectedText
            });
          });
          it("[2] openTag leftmost", function() {
            return check([0, 7], 'v', {
              selectedText: selectedText
            });
          });
          it("[3] openTag rightmost", function() {
            return check([0, 13], 'v', {
              selectedText: selectedText
            });
          });
          it("[4] Inner text", function() {
            return check([0, 16], 'v', {
              selectedText: selectedText
            });
          });
          it("[5] closeTag leftmost", function() {
            return check([0, 19], 'v', {
              selectedText: selectedText
            });
          });
          it("[6] closeTag rightmost", function() {
            return check([0, 26], 'v', {
              selectedText: selectedText
            });
          });
          it("[7] right of closeTag", function() {
            return check([0, 27], 'v', {
              selectedText: aABC
            });
          });
          it("[8] forwarding", function() {
            return check([0, 5], 'd', {
              text: deletedText
            });
          });
          it("[9] openTag leftmost", function() {
            return check([0, 7], 'd', {
              text: deletedText
            });
          });
          it("[10] openTag rightmost", function() {
            return check([0, 13], 'd', {
              text: deletedText
            });
          });
          it("[11] Inner text", function() {
            return check([0, 16], 'd', {
              text: deletedText
            });
          });
          it("[12] closeTag leftmost", function() {
            return check([0, 19], 'd', {
              text: deletedText
            });
          });
          it("[13] closeTag rightmost", function() {
            return check([0, 26], 'd', {
              text: deletedText
            });
          });
          return it("[14] right of closeTag", function() {
            return check([0, 27], 'd', {
              text: ""
            });
          });
        });
      });
    });
    describe("SquareBracket", function() {
      describe("inner-square-bracket", function() {
        beforeEach(function() {
          return set({
            text: "[ something in here and in [here] ]",
            cursor: [0, 9]
          });
        });
        it("applies operators inside the current word in operator-pending mode", function() {
          return ensure('d i [', {
            text: "[]",
            cursor: [0, 1]
          });
        });
        return it("applies operators inside the current word in operator-pending mode (second test)", function() {
          set({
            cursor: [0, 29]
          });
          return ensure('d i [', {
            text: "[ something in here and in [] ]",
            cursor: [0, 28]
          });
        });
      });
      return describe("a-square-bracket", function() {
        beforeEach(function() {
          return set({
            text: "[ something in here and in [here] ]",
            cursor: [0, 9]
          });
        });
        it("applies operators around the current square brackets in operator-pending mode", function() {
          return ensure('d a [', {
            text: '',
            cursor: [0, 0],
            mode: 'normal'
          });
        });
        it("applies operators around the current square brackets in operator-pending mode (second test)", function() {
          set({
            cursor: [0, 29]
          });
          return ensure('d a [', {
            text: "[ something in here and in  ]",
            cursor: [0, 27],
            mode: 'normal'
          });
        });
        describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor('i [');
          text = '-[+]-';
          textFinal = '-[]-';
          selectedText = '+';
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor('a [');
          text = '-[+]-';
          textFinal = '--';
          selectedText = '[+]';
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
    });
    describe("Parenthesis", function() {
      describe("inner-parenthesis", function() {
        beforeEach(function() {
          return set({
            text: "( something in here and in (here) )",
            cursor: [0, 9]
          });
        });
        it("applies operators inside the current word in operator-pending mode", function() {
          return ensure('d i (', {
            text: "()",
            cursor: [0, 1]
          });
        });
        it("applies operators inside the current word in operator-pending mode (second test)", function() {
          set({
            cursor: [0, 29]
          });
          return ensure('d i (', {
            text: "( something in here and in () )",
            cursor: [0, 28]
          });
        });
        it("select inner () by skipping nesting pair", function() {
          set({
            text: 'expect(editor.getScrollTop())',
            cursor: [0, 7]
          });
          return ensure('v i (', {
            selectedText: 'editor.getScrollTop()'
          });
        });
        it("skip escaped pair case-1", function() {
          set({
            text: 'expect(editor.g\\(etScrollTp())',
            cursor: [0, 20]
          });
          return ensure('v i (', {
            selectedText: 'editor.g\\(etScrollTp()'
          });
        });
        it("dont skip literal backslash", function() {
          set({
            text: 'expect(editor.g\\\\(etScrollTp())',
            cursor: [0, 20]
          });
          return ensure('v i (', {
            selectedText: 'etScrollTp()'
          });
        });
        it("skip escaped pair case-2", function() {
          set({
            text: 'expect(editor.getSc\\)rollTp())',
            cursor: [0, 7]
          });
          return ensure('v i (', {
            selectedText: 'editor.getSc\\)rollTp()'
          });
        });
        it("skip escaped pair case-3", function() {
          set({
            text: 'expect(editor.ge\\(tSc\\)rollTp())',
            cursor: [0, 7]
          });
          return ensure('v i (', {
            selectedText: 'editor.ge\\(tSc\\)rollTp()'
          });
        });
        it("works with multiple cursors", function() {
          set({
            text: "( a b ) cde ( f g h ) ijk",
            cursor: [[0, 2], [0, 18]]
          });
          return ensure('v i (', {
            selectedBufferRange: [[[0, 1], [0, 6]], [[0, 13], [0, 20]]]
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor('i (');
          text = '-(+)-';
          textFinal = '-()-';
          selectedText = '+';
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 2]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
      return describe("a-parenthesis", function() {
        beforeEach(function() {
          return set({
            text: "( something in here and in (here) )",
            cursor: [0, 9]
          });
        });
        it("applies operators around the current parentheses in operator-pending mode", function() {
          return ensure('d a (', {
            text: '',
            cursor: [0, 0],
            mode: 'normal'
          });
        });
        it("applies operators around the current parentheses in operator-pending mode (second test)", function() {
          set({
            cursor: [0, 29]
          });
          return ensure('d a (', {
            text: "( something in here and in  )",
            cursor: [0, 27]
          });
        });
        return describe("cursor is on the pair char", function() {
          var check, close, open, selectedText, text, textFinal;
          check = getCheckFunctionFor('a (');
          text = '-(+)-';
          textFinal = '--';
          selectedText = '(+)';
          open = [0, 1];
          close = [0, 3];
          beforeEach(function() {
            return set({
              text: text
            });
          });
          it("case-1 normal", function() {
            return check(open, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-2 normal", function() {
            return check(close, 'd', {
              text: textFinal,
              cursor: [0, 1]
            });
          });
          it("case-3 visual", function() {
            return check(open, 'v', {
              selectedText: selectedText
            });
          });
          return it("case-4 visual", function() {
            return check(close, 'v', {
              selectedText: selectedText
            });
          });
        });
      });
    });
    describe("Paragraph", function() {
      var text;
      text = null;
      beforeEach(function() {
        text = new TextData("\n1: P-1\n\n3: P-2\n4: P-2\n\n\n7: P-3\n8: P-3\n9: P-3\n\n");
        return set({
          cursor: [1, 0],
          text: text.getRaw()
        });
      });
      describe("inner-paragraph", function() {
        it("select consequtive blank rows", function() {
          set({
            cursor: [0, 0]
          });
          ensure('v i p', {
            selectedText: text.getLines([0])
          });
          set({
            cursor: [2, 0]
          });
          ensure('v i p', {
            selectedText: text.getLines([2])
          });
          set({
            cursor: [5, 0]
          });
          return ensure('v i p', {
            selectedText: text.getLines([5, 6])
          });
        });
        it("select consequtive non-blank rows", function() {
          set({
            cursor: [1, 0]
          });
          ensure('v i p', {
            selectedText: text.getLines([1])
          });
          set({
            cursor: [3, 0]
          });
          ensure('v i p', {
            selectedText: text.getLines([3, 4])
          });
          set({
            cursor: [7, 0]
          });
          return ensure('v i p', {
            selectedText: text.getLines([7, 8, 9])
          });
        });
        return it("operate on inner paragraph", function() {
          set({
            cursor: [7, 0]
          });
          return ensure('y i p', {
            cursor: [7, 0],
            register: {
              '"': {
                text: text.getLines([7, 8, 9])
              }
            }
          });
        });
      });
      return describe("a-paragraph", function() {
        it("select two paragraph as one operation", function() {
          set({
            cursor: [0, 0]
          });
          ensure('v a p', {
            selectedText: text.getLines([0, 1])
          });
          set({
            cursor: [2, 0]
          });
          ensure('v a p', {
            selectedText: text.getLines([2, 3, 4])
          });
          set({
            cursor: [5, 0]
          });
          return ensure('v a p', {
            selectedText: text.getLines([5, 6, 7, 8, 9])
          });
        });
        it("select two paragraph as one operation", function() {
          set({
            cursor: [1, 0]
          });
          ensure('v a p', {
            selectedText: text.getLines([1, 2])
          });
          set({
            cursor: [3, 0]
          });
          ensure('v a p', {
            selectedText: text.getLines([3, 4, 5, 6])
          });
          set({
            cursor: [7, 0]
          });
          return ensure('v a p', {
            selectedText: text.getLines([7, 8, 9, 10])
          });
        });
        return it("operate on a paragraph", function() {
          set({
            cursor: [3, 0]
          });
          return ensure('y a p', {
            cursor: [3, 0],
            register: {
              '"': {
                text: text.getLines([3, 4, 5, 6])
              }
            }
          });
        });
      });
    });
    describe('Comment', function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.packages.activatePackage('language-coffee-script');
        });
        return runs(function() {
          return set({
            grammar: 'source.coffee',
            text: "###\nmultiline comment\n###\n\n# One line comment\n\n# Comment\n# border\nclass QuickSort"
          });
        });
      });
      afterEach(function() {
        return atom.packages.deactivatePackage('language-coffee-script');
      });
      return describe('inner-comment', function() {
        it('select inner comment block', function() {
          set({
            cursor: [0, 0]
          });
          return ensure('v i /', {
            selectedText: '###\nmultiline comment\n###\n',
            selectedBufferRange: [[0, 0], [3, 0]]
          });
        });
        it('select one line comment', function() {
          set({
            cursor: [4, 0]
          });
          return ensure('v i /', {
            selectedText: '# One line comment\n',
            selectedBufferRange: [[4, 0], [5, 0]]
          });
        });
        return it('not select non-comment line', function() {
          set({
            cursor: [6, 0]
          });
          return ensure('v i /', {
            selectedText: '# Comment\n# border\n',
            selectedBufferRange: [[6, 0], [8, 0]]
          });
        });
      });
    });
    describe('Indentation', function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.packages.activatePackage('language-coffee-script');
        });
        return getVimState('sample.coffee', function(vimState, vim) {
          editor = vimState.editor, editorElement = vimState.editorElement;
          return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
        });
      });
      afterEach(function() {
        return atom.packages.deactivatePackage('language-coffee-script');
      });
      describe('inner-indentation', function() {
        return it('select lines with deeper indent-level', function() {
          set({
            cursor: [12, 0]
          });
          return ensure('v i i', {
            selectedBufferRange: [[12, 0], [15, 0]]
          });
        });
      });
      return describe('a-indentation', function() {
        return it('wont stop on blank line when selecting indent', function() {
          set({
            cursor: [12, 0]
          });
          return ensure('v a i', {
            selectedBufferRange: [[10, 0], [27, 0]]
          });
        });
      });
    });
    describe('Fold', function() {
      var rangeForRows;
      rangeForRows = function(startRow, endRow) {
        return [[startRow, 0], [endRow + 1, 0]];
      };
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.packages.activatePackage('language-coffee-script');
        });
        return getVimState('sample.coffee', function(vimState, vim) {
          editor = vimState.editor, editorElement = vimState.editorElement;
          return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
        });
      });
      afterEach(function() {
        return atom.packages.deactivatePackage('language-coffee-script');
      });
      describe('inner-fold', function() {
        it("select inner range of fold", function() {
          set({
            cursor: [13, 0]
          });
          return ensure('v i z', {
            selectedBufferRange: rangeForRows(10, 25)
          });
        });
        it("select inner range of fold", function() {
          set({
            cursor: [19, 0]
          });
          return ensure('v i z', {
            selectedBufferRange: rangeForRows(19, 23)
          });
        });
        it("can expand selection", function() {
          set({
            cursor: [23, 0]
          });
          keystroke('v');
          ensure('i z', {
            selectedBufferRange: rangeForRows(23, 23)
          });
          ensure('i z', {
            selectedBufferRange: rangeForRows(19, 23)
          });
          ensure('i z', {
            selectedBufferRange: rangeForRows(10, 25)
          });
          return ensure('i z', {
            selectedBufferRange: rangeForRows(9, 28)
          });
        });
        describe("when startRow of selection is on fold startRow", function() {
          return it('select outer fold(skip)', function() {
            set({
              cursor: [20, 7]
            });
            return ensure('v i z', {
              selectedBufferRange: rangeForRows(19, 23)
            });
          });
        });
        describe("when endRow of selection exceeds fold endRow", function() {
          return it("doesn't matter, select fold based on startRow of selection", function() {
            set({
              cursor: [20, 0]
            });
            ensure('V G', {
              selectedBufferRange: rangeForRows(20, 30)
            });
            return ensure('i z', {
              selectedBufferRange: rangeForRows(19, 23)
            });
          });
        });
        return describe("when indent level of fold startRow and endRow is same", function() {
          beforeEach(function() {
            waitsForPromise(function() {
              return atom.packages.activatePackage('language-javascript');
            });
            return getVimState('sample.js', function(state, vimEditor) {
              editor = state.editor, editorElement = state.editorElement;
              return set = vimEditor.set, ensure = vimEditor.ensure, keystroke = vimEditor.keystroke, vimEditor;
            });
          });
          afterEach(function() {
            return atom.packages.deactivatePackage('language-javascript');
          });
          return it("doesn't select fold endRow", function() {
            set({
              cursor: [5, 0]
            });
            ensure('v i z', {
              selectedBufferRange: rangeForRows(5, 6)
            });
            return ensure('a z', {
              selectedBufferRange: rangeForRows(4, 7)
            });
          });
        });
      });
      return describe('a-fold', function() {
        it('select fold row range', function() {
          set({
            cursor: [13, 0]
          });
          return ensure('v a z', {
            selectedBufferRange: rangeForRows(9, 25)
          });
        });
        it('select fold row range', function() {
          set({
            cursor: [19, 0]
          });
          return ensure('v a z', {
            selectedBufferRange: rangeForRows(18, 23)
          });
        });
        it('can expand selection', function() {
          set({
            cursor: [23, 0]
          });
          keystroke('v');
          ensure('a z', {
            selectedBufferRange: rangeForRows(22, 23)
          });
          ensure('a z', {
            selectedBufferRange: rangeForRows(18, 23)
          });
          ensure('a z', {
            selectedBufferRange: rangeForRows(9, 25)
          });
          return ensure('a z', {
            selectedBufferRange: rangeForRows(8, 28)
          });
        });
        describe("when startRow of selection is on fold startRow", function() {
          return it('select outer fold(skip)', function() {
            set({
              cursor: [20, 7]
            });
            return ensure('v a z', {
              selectedBufferRange: rangeForRows(18, 23)
            });
          });
        });
        return describe("when endRow of selection exceeds fold endRow", function() {
          return it("doesn't matter, select fold based on startRow of selection", function() {
            set({
              cursor: [20, 0]
            });
            ensure('V G', {
              selectedBufferRange: rangeForRows(20, 30)
            });
            return ensure('a z', {
              selectedBufferRange: rangeForRows(18, 23)
            });
          });
        });
      });
    });
    describe('Function', function() {
      describe('coffee', function() {
        var pack, scope;
        pack = 'language-coffee-script';
        scope = 'source.coffee';
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.packages.activatePackage(pack);
          });
          set({
            text: "# Commment\n\nhello = ->\n  a = 1\n  b = 2\n  c = 3\n\n# Commment",
            cursor: [3, 0]
          });
          return runs(function() {
            var grammar;
            grammar = atom.grammars.grammarForScopeName(scope);
            return editor.setGrammar(grammar);
          });
        });
        afterEach(function() {
          return atom.packages.deactivatePackage(pack);
        });
        describe('inner-function for coffee', function() {
          return it('select except start row', function() {
            return ensure('v i f', {
              selectedBufferRange: [[3, 0], [6, 0]]
            });
          });
        });
        return describe('a-function for coffee', function() {
          return it('select function', function() {
            return ensure('v a f', {
              selectedBufferRange: [[2, 0], [6, 0]]
            });
          });
        });
      });
      describe('ruby', function() {
        var pack, scope;
        pack = 'language-ruby';
        scope = 'source.ruby';
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.packages.activatePackage(pack);
          });
          set({
            text: "# Commment\n\ndef hello\n  a = 1\n  b = 2\n  c = 3\nend\n\n# Commment",
            cursor: [3, 0]
          });
          return runs(function() {
            var grammar;
            grammar = atom.grammars.grammarForScopeName(scope);
            return editor.setGrammar(grammar);
          });
        });
        afterEach(function() {
          return atom.packages.deactivatePackage(pack);
        });
        describe('inner-function for ruby', function() {
          return it('select except start row', function() {
            return ensure('v i f', {
              selectedBufferRange: [[3, 0], [6, 0]]
            });
          });
        });
        return describe('a-function for ruby', function() {
          return it('select function', function() {
            return ensure('v a f', {
              selectedBufferRange: [[2, 0], [7, 0]]
            });
          });
        });
      });
      return describe('go', function() {
        var pack, scope;
        pack = 'language-go';
        scope = 'source.go';
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.packages.activatePackage(pack);
          });
          set({
            text: "// Commment\n\nfunc main() {\n  a := 1\n  b := 2\n  c := 3\n}\n\n// Commment",
            cursor: [3, 0]
          });
          return runs(function() {
            var grammar;
            grammar = atom.grammars.grammarForScopeName(scope);
            return editor.setGrammar(grammar);
          });
        });
        afterEach(function() {
          return atom.packages.deactivatePackage(pack);
        });
        describe('inner-function for go', function() {
          return it('select except start row', function() {
            return ensure('v i f', {
              selectedBufferRange: [[3, 0], [6, 0]]
            });
          });
        });
        return describe('a-function for go', function() {
          return it('select function', function() {
            return ensure('v a f', {
              selectedBufferRange: [[2, 0], [7, 0]]
            });
          });
        });
      });
    });
    describe('CurrentLine', function() {
      beforeEach(function() {
        return set({
          text: "This is\n  multi line\ntext"
        });
      });
      describe('inner-current-line', function() {
        it('select current line without including last newline', function() {
          set({
            cursor: [0, 0]
          });
          return ensure('v i l', {
            selectedText: 'This is'
          });
        });
        return it('also skip leading white space', function() {
          set({
            cursor: [1, 0]
          });
          return ensure('v i l', {
            selectedText: 'multi line'
          });
        });
      });
      return describe('a-current-line', function() {
        it('select current line without including last newline as like `vil`', function() {
          set({
            cursor: [0, 0]
          });
          return ensure('v a l', {
            selectedText: 'This is'
          });
        });
        return it('wont skip leading white space not like `vil`', function() {
          set({
            cursor: [1, 0]
          });
          return ensure('v a l', {
            selectedText: '  multi line'
          });
        });
      });
    });
    describe('Entire', function() {
      var text;
      text = "This is\n  multi line\ntext";
      beforeEach(function() {
        return set({
          text: text,
          cursor: [0, 0]
        });
      });
      describe('inner-entire', function() {
        return it('select entire buffer', function() {
          ensure('escape', {
            selectedText: ''
          });
          ensure('v i e', {
            selectedText: text
          });
          ensure('escape', {
            selectedText: ''
          });
          return ensure('j j v i e', {
            selectedText: text
          });
        });
      });
      return describe('a-entire', function() {
        return it('select entire buffer', function() {
          ensure('escape', {
            selectedText: ''
          });
          ensure('v a e', {
            selectedText: text
          });
          ensure('escape', {
            selectedText: ''
          });
          return ensure('j j v a e', {
            selectedText: text
          });
        });
      });
    });
    return describe('SearchMatchForward, SearchBackwards', function() {
      var text;
      text = "0 xxx\n1 abc xxx\n2   xxx yyy\n3 xxx abc\n4 abc\n";
      beforeEach(function() {
        set({
          text: text,
          cursor: [0, 0]
        });
        ensure([
          '/', {
            search: 'abc'
          }
        ], {
          cursor: [1, 2],
          mode: 'normal'
        });
        return expect(vimState.globalState.get('lastSearchPattern')).toEqual(/abc/g);
      });
      describe('gn from normal mode', function() {
        return it('select ranges matches to last search pattern and extend selection', function() {
          ensure('g n', {
            cursor: [1, 5],
            mode: ['visual', 'characterwise'],
            selectionIsReversed: false,
            selectedText: 'abc'
          });
          ensure('g n', {
            selectionIsReversed: false,
            mode: ['visual', 'characterwise'],
            selectedText: "abc xxx\n2   xxx yyy\n3 xxx abc"
          });
          ensure('g n', {
            selectionIsReversed: false,
            mode: ['visual', 'characterwise'],
            selectedText: "abc xxx\n2   xxx yyy\n3 xxx abc\n4 abc"
          });
          return ensure('g n', {
            selectionIsReversed: false,
            mode: ['visual', 'characterwise'],
            selectedText: "abc xxx\n2   xxx yyy\n3 xxx abc\n4 abc"
          });
        });
      });
      describe('gN from normal mode', function() {
        beforeEach(function() {
          return set({
            cursor: [4, 3]
          });
        });
        return it('select ranges matches to last search pattern and extend selection', function() {
          ensure('g N', {
            cursor: [4, 2],
            mode: ['visual', 'characterwise'],
            selectionIsReversed: true,
            selectedText: 'abc'
          });
          ensure('g N', {
            selectionIsReversed: true,
            mode: ['visual', 'characterwise'],
            selectedText: "abc\n4 abc"
          });
          ensure('g N', {
            selectionIsReversed: true,
            mode: ['visual', 'characterwise'],
            selectedText: "abc xxx\n2   xxx yyy\n3 xxx abc\n4 abc"
          });
          return ensure('g N', {
            selectionIsReversed: true,
            mode: ['visual', 'characterwise'],
            selectedText: "abc xxx\n2   xxx yyy\n3 xxx abc\n4 abc"
          });
        });
      });
      return describe('as operator target', function() {
        it('delete next occurrence of last search pattern', function() {
          ensure('d g n', {
            cursor: [1, 2],
            mode: 'normal',
            text: "0 xxx\n1  xxx\n2   xxx yyy\n3 xxx abc\n4 abc\n"
          });
          ensure('.', {
            cursor: [3, 5],
            mode: 'normal',
            text_: "0 xxx\n1  xxx\n2   xxx yyy\n3 xxx_\n4 abc\n"
          });
          return ensure('.', {
            cursor: [4, 1],
            mode: 'normal',
            text_: "0 xxx\n1  xxx\n2   xxx yyy\n3 xxx_\n4 \n"
          });
        });
        return it('change next occurrence of last search pattern', function() {
          ensure('c g n', {
            cursor: [1, 2],
            mode: 'insert',
            text: "0 xxx\n1  xxx\n2   xxx yyy\n3 xxx abc\n4 abc\n"
          });
          keystroke('escape');
          set({
            cursor: [4, 0]
          });
          return ensure('c g N', {
            cursor: [3, 6],
            mode: 'insert',
            text_: "0 xxx\n1  xxx\n2   xxx yyy\n3 xxx_\n4 abc\n"
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL3RleHQtb2JqZWN0LXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFvQyxPQUFBLENBQVEsZUFBUixDQUFwQyxFQUFDLDZCQUFELEVBQWMsdUJBQWQsRUFBd0I7O0VBRXhCLFFBQUEsQ0FBUyxZQUFULEVBQXVCLFNBQUE7QUFDckIsUUFBQTtJQUFBLE9BQTRELEVBQTVELEVBQUMsYUFBRCxFQUFNLGdCQUFOLEVBQWMsbUJBQWQsRUFBeUIsZ0JBQXpCLEVBQWlDLHVCQUFqQyxFQUFnRDtJQUVoRCxtQkFBQSxHQUFzQixTQUFDLFVBQUQ7YUFDcEIsU0FBQyxZQUFELEVBQWUsU0FBZixFQUEwQixPQUExQjtRQUNFLEdBQUEsQ0FBSTtVQUFBLE1BQUEsRUFBUSxZQUFSO1NBQUo7ZUFDQSxNQUFBLENBQVUsU0FBRCxHQUFXLEdBQVgsR0FBYyxVQUF2QixFQUFxQyxPQUFyQztNQUZGO0lBRG9CO0lBS3RCLFVBQUEsQ0FBVyxTQUFBO2FBQ1QsV0FBQSxDQUFZLFNBQUMsS0FBRCxFQUFRLFNBQVI7UUFDVixRQUFBLEdBQVc7UUFDVix3QkFBRCxFQUFTO2VBQ1IsbUJBQUQsRUFBTSx5QkFBTixFQUFjLCtCQUFkLEVBQTJCO01BSGpCLENBQVo7SUFEUyxDQUFYO0lBTUEsU0FBQSxDQUFVLFNBQUE7YUFDUixRQUFRLENBQUMsZUFBVCxDQUFBO0lBRFEsQ0FBVjtJQUdBLFFBQUEsQ0FBUyxZQUFULEVBQXVCLFNBQUE7TUFDckIsVUFBQSxDQUFXLFNBQUE7UUFDVCxlQUFBLENBQWdCLFNBQUE7aUJBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFkLENBQThCLHdCQUE5QjtRQURjLENBQWhCO2VBRUEsV0FBQSxDQUFZLGVBQVosRUFBNkIsU0FBQyxLQUFELEVBQVEsU0FBUjtVQUMxQixx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V0FBSjtpQkFDQSxNQUFBLENBQU8sT0FBUCxFQUNFO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtZQUNBLElBQUEsRUFBTSxRQUROO1lBRUEsS0FBQSxFQUFPLDZDQUZQO1dBREY7UUFia0QsQ0FBcEQ7TUFoQzZCLENBQS9CO0lBaEY4QyxDQUFoRDtFQS8xQ3FCLENBQXZCO0FBRkEiLCJzb3VyY2VzQ29udGVudCI6WyJ7Z2V0VmltU3RhdGUsIGRpc3BhdGNoLCBUZXh0RGF0YX0gPSByZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuXG5kZXNjcmliZSBcIlRleHRPYmplY3RcIiwgLT5cbiAgW3NldCwgZW5zdXJlLCBrZXlzdHJva2UsIGVkaXRvciwgZWRpdG9yRWxlbWVudCwgdmltU3RhdGVdID0gW11cblxuICBnZXRDaGVja0Z1bmN0aW9uRm9yID0gKHRleHRPYmplY3QpIC0+XG4gICAgKGluaXRpYWxQb2ludCwga2V5c3Ryb2tlLCBvcHRpb25zKSAtPlxuICAgICAgc2V0IGN1cnNvcjogaW5pdGlhbFBvaW50XG4gICAgICBlbnN1cmUgXCIje2tleXN0cm9rZX0gI3t0ZXh0T2JqZWN0fVwiLCBvcHRpb25zXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIGdldFZpbVN0YXRlIChzdGF0ZSwgdmltRWRpdG9yKSAtPlxuICAgICAgdmltU3RhdGUgPSBzdGF0ZVxuICAgICAge2VkaXRvciwgZWRpdG9yRWxlbWVudH0gPSB2aW1TdGF0ZVxuICAgICAge3NldCwgZW5zdXJlLCBrZXlzdHJva2V9ID0gdmltRWRpdG9yXG5cbiAgYWZ0ZXJFYWNoIC0+XG4gICAgdmltU3RhdGUucmVzZXROb3JtYWxNb2RlKClcblxuICBkZXNjcmliZSBcIlRleHRPYmplY3RcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWNvZmZlZS1zY3JpcHQnKVxuICAgICAgZ2V0VmltU3RhdGUgJ3NhbXBsZS5jb2ZmZWUnLCAoc3RhdGUsIHZpbUVkaXRvcikgLT5cbiAgICAgICAge2VkaXRvciwgZWRpdG9yRWxlbWVudH0gPSBzdGF0ZVxuICAgICAgICB7c2V0LCBlbnN1cmUsIGtleXN0cm9rZX0gPSB2aW1FZGl0b3JcbiAgICBhZnRlckVhY2ggLT5cbiAgICAgIGF0b20ucGFja2FnZXMuZGVhY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWNvZmZlZS1zY3JpcHQnKVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIFRleHRPYmplY3QgaXMgZXhjdXRlZCBkaXJlY3RseVwiLCAtPlxuICAgICAgaXQgXCJzZWxlY3QgdGhhdCBUZXh0T2JqZWN0XCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFs4LCA3XVxuICAgICAgICBkaXNwYXRjaChlZGl0b3JFbGVtZW50LCAndmltLW1vZGUtcGx1czppbm5lci13b3JkJylcbiAgICAgICAgZW5zdXJlIHNlbGVjdGVkVGV4dDogJ1F1aWNrU29ydCdcblxuICBkZXNjcmliZSBcIldvcmRcIiwgLT5cbiAgICBkZXNjcmliZSBcImlubmVyLXdvcmRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCIxMjM0NSBhYmNkZSBBQkNERVwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgOV1cblxuICAgICAgaXQgXCJhcHBsaWVzIG9wZXJhdG9ycyBpbnNpZGUgdGhlIGN1cnJlbnQgd29yZCBpbiBvcGVyYXRvci1wZW5kaW5nIG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlICdkIGkgdycsXG4gICAgICAgICAgdGV4dDogICAgIFwiMTIzNDUgIEFCQ0RFXCJcbiAgICAgICAgICBjdXJzb3I6ICAgWzAsIDZdXG4gICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICdhYmNkZSdcbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgICBpdCBcInNlbGVjdHMgaW5zaWRlIHRoZSBjdXJyZW50IHdvcmQgaW4gdmlzdWFsIG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlICd2IGkgdycsXG4gICAgICAgICAgc2VsZWN0ZWRTY3JlZW5SYW5nZTogW1swLCA2XSwgWzAsIDExXV1cblxuICAgICAgaXQgXCJ3b3JrcyB3aXRoIG11bHRpcGxlIGN1cnNvcnNcIiwgLT5cbiAgICAgICAgc2V0IGFkZEN1cnNvcjogWzAsIDFdXG4gICAgICAgIGVuc3VyZSAndiBpIHcnLFxuICAgICAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IFtcbiAgICAgICAgICAgIFtbMCwgNl0sIFswLCAxMV1dXG4gICAgICAgICAgICBbWzAsIDBdLCBbMCwgNV1dXG4gICAgICAgICAgXVxuXG4gICAgICBkZXNjcmliZSBcImN1cnNvciBpcyBvbiBuZXh0IHRvIE5vbldvcmRDaGFyYWN0ZXJcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJhYmMoZGVmKVwiXG4gICAgICAgICAgICBjdXJzb3I6IFswLCA0XVxuXG4gICAgICAgIGl0IFwiY2hhbmdlIGluc2lkZSB3b3JkXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdjIGkgdycsIHRleHQ6IFwiYWJjKClcIiwgbW9kZTogXCJpbnNlcnRcIlxuXG4gICAgICAgIGl0IFwiZGVsZXRlIGluc2lkZSB3b3JkXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdkIGkgdycsIHRleHQ6IFwiYWJjKClcIiwgbW9kZTogXCJub3JtYWxcIlxuXG4gICAgICBkZXNjcmliZSBcImN1cnNvcidzIG5leHQgY2hhciBpcyBOb25Xb3JkQ2hhcmFjdGVyXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiYWJjKGRlZilcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgNl1cblxuICAgICAgICBpdCBcImNoYW5nZSBpbnNpZGUgd29yZFwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnYyBpIHcnLCB0ZXh0OiBcImFiYygpXCIsIG1vZGU6IFwiaW5zZXJ0XCJcblxuICAgICAgICBpdCBcImRlbGV0ZSBpbnNpZGUgd29yZFwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnZCBpIHcnLCB0ZXh0OiBcImFiYygpXCIsIG1vZGU6IFwibm9ybWFsXCJcblxuICAgIGRlc2NyaWJlIFwiYS13b3JkXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIjEyMzQ1IGFiY2RlIEFCQ0RFXCIsIGN1cnNvcjogWzAsIDldXG5cbiAgICAgIGl0IFwic2VsZWN0IGN1cnJlbnQtd29yZCBhbmQgdHJhaWxpbmcgd2hpdGUgc3BhY2VcIiwgLT5cbiAgICAgICAgZW5zdXJlICdkIGEgdycsXG4gICAgICAgICAgdGV4dDogXCIxMjM0NSBBQkNERVwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgNl1cbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogXCJhYmNkZSBcIlxuXG4gICAgICBpdCBcInNlbGVjdCBjdXJyZW50LXdvcmQgYW5kIGxlYWRpbmcgd2hpdGUgc3BhY2UgaW4gY2FzZSB0cmFpbGluZyB3aGl0ZSBzcGFjZSB3YXNuJ3QgdGhlcmVcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDE1XVxuICAgICAgICBlbnN1cmUgJ2QgYSB3JyxcbiAgICAgICAgICB0ZXh0OiBcIjEyMzQ1IGFiY2RlXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAxMF1cbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIgQUJDREVcIlxuXG4gICAgICBpdCBcInNlbGVjdHMgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIGN1cnJlbnQgd29yZCB0byB0aGUgc3RhcnQgb2YgdGhlIG5leHQgd29yZCBpbiB2aXN1YWwgbW9kZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3YgYSB3Jywgc2VsZWN0ZWRTY3JlZW5SYW5nZTogW1swLCA2XSwgWzAsIDEyXV1cblxuICAgICAgaXQgXCJkb2Vzbid0IHNwYW4gbmV3bGluZXNcIiwgLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiMTIzNDVcXG5hYmNkZSBBQkNERVwiLCBjdXJzb3I6IFswLCAzXVxuICAgICAgICBlbnN1cmUgJ3YgYSB3Jywgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1swLCAwXSwgWzAsIDVdXVxuXG4gICAgICBpdCBcImRvZXNuJ3Qgc3BhbiBzcGVjaWFsIGNoYXJhY3RlcnNcIiwgLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiMSgzNDVcXG5hYmNkZSBBQkNERVwiLCBjdXJzb3I6IFswLCAzXVxuICAgICAgICBlbnN1cmUgJ3YgYSB3Jywgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1swLCAyXSwgWzAsIDVdXVxuXG4gIGRlc2NyaWJlIFwiV2hvbGVXb3JkXCIsIC0+XG4gICAgZGVzY3JpYmUgXCJpbm5lci13aG9sZS13b3JkXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIjEyKDQ1IGFiJ2RlIEFCQ0RFXCIsIGN1cnNvcjogWzAsIDldXG5cbiAgICAgIGl0IFwiYXBwbGllcyBvcGVyYXRvcnMgaW5zaWRlIHRoZSBjdXJyZW50IHdob2xlIHdvcmQgaW4gb3BlcmF0b3ItcGVuZGluZyBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnZCBpIFcnLCB0ZXh0OiBcIjEyKDQ1ICBBQkNERVwiLCBjdXJzb3I6IFswLCA2XSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiYWInZGVcIlxuXG4gICAgICBpdCBcInNlbGVjdHMgaW5zaWRlIHRoZSBjdXJyZW50IHdob2xlIHdvcmQgaW4gdmlzdWFsIG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlICd2IGkgVycsIHNlbGVjdGVkU2NyZWVuUmFuZ2U6IFtbMCwgNl0sIFswLCAxMV1dXG4gICAgZGVzY3JpYmUgXCJhLXdob2xlLXdvcmRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiMTIoNDUgYWInZGUgQUJDREVcIiwgY3Vyc29yOiBbMCwgOV1cblxuICAgICAgaXQgXCJzZWxlY3Qgd2hvbGUtd29yZCBhbmQgdHJhaWxpbmcgd2hpdGUgc3BhY2VcIiwgLT5cbiAgICAgICAgZW5zdXJlICdkIGEgVycsXG4gICAgICAgICAgdGV4dDogXCIxMig0NSBBQkNERVwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgNl1cbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogXCJhYidkZSBcIlxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgIGl0IFwic2VsZWN0IHdob2xlLXdvcmQgYW5kIGxlYWRpbmcgd2hpdGUgc3BhY2UgaW4gY2FzZSB0cmFpbGluZyB3aGl0ZSBzcGFjZSB3YXNuJ3QgdGhlcmVcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDE1XVxuICAgICAgICBlbnN1cmUgJ2QgYSB3JyxcbiAgICAgICAgICB0ZXh0OiBcIjEyKDQ1IGFiJ2RlXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAxMF1cbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIgQUJDREVcIlxuXG4gICAgICBpdCBcInNlbGVjdHMgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIGN1cnJlbnQgd2hvbGUgd29yZCB0byB0aGUgc3RhcnQgb2YgdGhlIG5leHQgd2hvbGUgd29yZCBpbiB2aXN1YWwgbW9kZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3YgYSBXJywgc2VsZWN0ZWRTY3JlZW5SYW5nZTogW1swLCA2XSwgWzAsIDEyXV1cblxuICAgICAgaXQgXCJkb2Vzbid0IHNwYW4gbmV3bGluZXNcIiwgLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiMTIoNDVcXG5hYidkZSBBQkNERVwiLCBjdXJzb3I6IFswLCA0XVxuICAgICAgICBlbnN1cmUgJ3YgYSBXJywgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1swLCAwXSwgWzAsIDVdXVxuXG4gIGRlc2NyaWJlIFwiQW55UGFpclwiLCAtPlxuICAgIHtzaW1wbGVUZXh0LCBjb21wbGV4VGV4dH0gPSB7fVxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNpbXBsZVRleHQgPSBcIlwiXCJcbiAgICAgICAgLi4uLiBcImFiY1wiIC4uLi5cbiAgICAgICAgLi4uLiAnYWJjJyAuLi4uXG4gICAgICAgIC4uLi4gYGFiY2AgLi4uLlxuICAgICAgICAuLi4uIHthYmN9IC4uLi5cbiAgICAgICAgLi4uLiA8YWJjPiAuLi4uXG4gICAgICAgIC4uLi4gW2FiY10gLi4uLlxuICAgICAgICAuLi4uIChhYmMpIC4uLi5cbiAgICAgICAgXCJcIlwiXG4gICAgICBjb21wbGV4VGV4dCA9IFwiXCJcIlxuICAgICAgICBbNHNcbiAgICAgICAgLS17M3NcbiAgICAgICAgLS0tLVwiMnMoMXMtMWUpMmVcIlxuICAgICAgICAtLS0zZX0tNGVcbiAgICAgICAgXVxuICAgICAgICBcIlwiXCJcbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBzaW1wbGVUZXh0XG4gICAgICAgIGN1cnNvcjogWzAsIDddXG4gICAgZGVzY3JpYmUgXCJpbm5lci1hbnktcGFpclwiLCAtPlxuICAgICAgaXQgXCJhcHBsaWVzIG9wZXJhdG9ycyBhbnkgaW5uZXItcGFpciBhbmQgcmVwZWF0YWJsZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2QgaSBzJyxcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIC4uLi4gXCJcIiAuLi4uXG4gICAgICAgICAgICAuLi4uICdhYmMnIC4uLi5cbiAgICAgICAgICAgIC4uLi4gYGFiY2AgLi4uLlxuICAgICAgICAgICAgLi4uLiB7YWJjfSAuLi4uXG4gICAgICAgICAgICAuLi4uIDxhYmM+IC4uLi5cbiAgICAgICAgICAgIC4uLi4gW2FiY10gLi4uLlxuICAgICAgICAgICAgLi4uLiAoYWJjKSAuLi4uXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZW5zdXJlICdqIC4gaiAuIGogLiBqIC4gaiAuIGogLiBqIC4nLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgLi4uLiBcIlwiIC4uLi5cbiAgICAgICAgICAgIC4uLi4gJycgLi4uLlxuICAgICAgICAgICAgLi4uLiBgYCAuLi4uXG4gICAgICAgICAgICAuLi4uIHt9IC4uLi5cbiAgICAgICAgICAgIC4uLi4gPD4gLi4uLlxuICAgICAgICAgICAgLi4uLiBbXSAuLi4uXG4gICAgICAgICAgICAuLi4uICgpIC4uLi5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgaXQgXCJjYW4gZXhwYW5kIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICBzZXQgdGV4dDogY29tcGxleFRleHQsIGN1cnNvcjogWzIsIDhdXG4gICAgICAgIGtleXN0cm9rZSAndidcbiAgICAgICAgZW5zdXJlICdpIHMnLCBzZWxlY3RlZFRleHQ6IFwiXCJcIjFzLTFlXCJcIlwiXG4gICAgICAgIGVuc3VyZSAnaSBzJywgc2VsZWN0ZWRUZXh0OiBcIlwiXCIycygxcy0xZSkyZVwiXCJcIlxuICAgICAgICBlbnN1cmUgJ2kgcycsIHNlbGVjdGVkVGV4dDogXCJcIlwiM3NcXG4tLS0tXCIycygxcy0xZSkyZVwiXFxuLS0tM2VcIlwiXCJcbiAgICAgICAgZW5zdXJlICdpIHMnLCBzZWxlY3RlZFRleHQ6IFwiXCJcIjRzXFxuLS17M3NcXG4tLS0tXCIycygxcy0xZSkyZVwiXFxuLS0tM2V9LTRlXCJcIlwiXG4gICAgZGVzY3JpYmUgXCJhLWFueS1wYWlyXCIsIC0+XG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIGFueSBhLXBhaXIgYW5kIHJlcGVhdGFibGVcIiwgLT5cbiAgICAgICAgZW5zdXJlICdkIGEgcycsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAuLi4uICAuLi4uXG4gICAgICAgICAgICAuLi4uICdhYmMnIC4uLi5cbiAgICAgICAgICAgIC4uLi4gYGFiY2AgLi4uLlxuICAgICAgICAgICAgLi4uLiB7YWJjfSAuLi4uXG4gICAgICAgICAgICAuLi4uIDxhYmM+IC4uLi5cbiAgICAgICAgICAgIC4uLi4gW2FiY10gLi4uLlxuICAgICAgICAgICAgLi4uLiAoYWJjKSAuLi4uXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZW5zdXJlICdqIC4gaiAuIGogLiBqIC4gaiAuIGogLiBqIC4nLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgLi4uLiAgLi4uLlxuICAgICAgICAgICAgLi4uLiAgLi4uLlxuICAgICAgICAgICAgLi4uLiAgLi4uLlxuICAgICAgICAgICAgLi4uLiAgLi4uLlxuICAgICAgICAgICAgLi4uLiAgLi4uLlxuICAgICAgICAgICAgLi4uLiAgLi4uLlxuICAgICAgICAgICAgLi4uLiAgLi4uLlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICBpdCBcImNhbiBleHBhbmQgc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIHNldCB0ZXh0OiBjb21wbGV4VGV4dCwgY3Vyc29yOiBbMiwgOF1cbiAgICAgICAga2V5c3Ryb2tlICd2J1xuICAgICAgICBlbnN1cmUgJ2EgcycsIHNlbGVjdGVkVGV4dDogXCJcIlwiKDFzLTFlKVwiXCJcIlxuICAgICAgICBlbnN1cmUgJ2EgcycsIHNlbGVjdGVkVGV4dDogXCJcIlwiXFxcIjJzKDFzLTFlKTJlXFxcIlwiXCJcIlxuICAgICAgICBlbnN1cmUgJ2EgcycsIHNlbGVjdGVkVGV4dDogXCJcIlwiezNzXFxuLS0tLVwiMnMoMXMtMWUpMmVcIlxcbi0tLTNlfVwiXCJcIlxuICAgICAgICBlbnN1cmUgJ2EgcycsIHNlbGVjdGVkVGV4dDogXCJcIlwiWzRzXFxuLS17M3NcXG4tLS0tXCIycygxcy0xZSkyZVwiXFxuLS0tM2V9LTRlXFxuXVwiXCJcIlxuXG4gIGRlc2NyaWJlIFwiQW55UXVvdGVcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgIC0tXCJhYmNcIiBgZGVmYCAgJ2VmZyctLVxuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICBkZXNjcmliZSBcImlubmVyLWFueS1xdW90ZVwiLCAtPlxuICAgICAgaXQgXCJhcHBsaWVzIG9wZXJhdG9ycyBhbnkgaW5uZXItcGFpciBhbmQgcmVwZWF0YWJsZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2QgaSBxJywgdGV4dDogXCJcIlwiLS1cIlwiIGBkZWZgICAnZWZnJy0tXCJcIlwiXG4gICAgICAgIGVuc3VyZSAnLicsIHRleHQ6IFwiXCJcIi0tXCJcIiBgYCAgJ2VmZyctLVwiXCJcIlxuICAgICAgICBlbnN1cmUgJy4nLCB0ZXh0OiBcIlwiXCItLVwiXCIgYGAgICcnLS1cIlwiXCJcbiAgICAgIGl0IFwiY2FuIHNlbGVjdCBuZXh0IHF1b3RlXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAndidcbiAgICAgICAgZW5zdXJlICdpIHEnLCBzZWxlY3RlZFRleHQ6ICdhYmMnXG4gICAgICAgIGVuc3VyZSAnaSBxJywgc2VsZWN0ZWRUZXh0OiAnZGVmJ1xuICAgICAgICBlbnN1cmUgJ2kgcScsIHNlbGVjdGVkVGV4dDogJ2VmZydcbiAgICBkZXNjcmliZSBcImEtYW55LXF1b3RlXCIsIC0+XG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIGFueSBhLXF1b3RlIGFuZCByZXBlYXRhYmxlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnZCBhIHEnLCB0ZXh0OiBcIlwiXCItLSBgZGVmYCAgJ2VmZyctLVwiXCJcIlxuICAgICAgICBlbnN1cmUgJy4nICAsIHRleHQ6IFwiXCJcIi0tICAgJ2VmZyctLVwiXCJcIlxuICAgICAgICBlbnN1cmUgJy4nICAsIHRleHQ6IFwiXCJcIi0tICAgLS1cIlwiXCJcbiAgICAgICAgZW5zdXJlICcuJ1xuICAgICAgaXQgXCJjYW4gc2VsZWN0IG5leHQgcXVvdGVcIiwgLT5cbiAgICAgICAga2V5c3Ryb2tlICd2J1xuICAgICAgICBlbnN1cmUgJ2EgcScsIHNlbGVjdGVkVGV4dDogJ1wiYWJjXCInXG4gICAgICAgIGVuc3VyZSAnYSBxJywgc2VsZWN0ZWRUZXh0OiAnYGRlZmAnXG4gICAgICAgIGVuc3VyZSAnYSBxJywgc2VsZWN0ZWRUZXh0OiBcIidlZmcnXCJcblxuICBkZXNjcmliZSBcIkRvdWJsZVF1b3RlXCIsIC0+XG4gICAgZGVzY3JpYmUgXCJpbm5lci1kb3VibGUtcXVvdGVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogJ1wiIHNvbWV0aGluZyBpbiBoZXJlIGFuZCBpbiBcImhlcmVcIiBcIiBhbmQgb3ZlciBoZXJlJ1xuICAgICAgICAgIGN1cnNvcjogWzAsIDldXG5cbiAgICAgIGl0IFwiYXBwbGllcyBvcGVyYXRvcnMgaW5zaWRlIHRoZSBjdXJyZW50IHN0cmluZyBpbiBvcGVyYXRvci1wZW5kaW5nIG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlICdkIGkgXCInLFxuICAgICAgICAgIHRleHQ6ICdcIlwiaGVyZVwiIFwiIGFuZCBvdmVyIGhlcmUnXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMV1cblxuICAgICAgaXQgXCJza2lwIG5vbi1zdHJpbmcgYXJlYSBhbmQgb3BlcmF0ZSBmb3J3YXJkaW5nIHN0cmluZyB3aGl0aGluIGxpbmVcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDI5XVxuICAgICAgICBlbnN1cmUgJ2QgaSBcIicsXG4gICAgICAgICAgdGV4dDogJ1wiIHNvbWV0aGluZyBpbiBoZXJlIGFuZCBpbiBcImhlcmVcIlwiIGFuZCBvdmVyIGhlcmUnXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMzNdXG5cbiAgICAgIGl0IFwibWFrZXMgbm8gY2hhbmdlIGlmIHBhc3QgdGhlIGxhc3Qgc3RyaW5nIG9uIGEgbGluZVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMzldXG4gICAgICAgIGVuc3VyZSAnZCBpIFwiJyxcbiAgICAgICAgICB0ZXh0OiAnXCIgc29tZXRoaW5nIGluIGhlcmUgYW5kIGluIFwiaGVyZVwiIFwiIGFuZCBvdmVyIGhlcmUnXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMzldXG4gICAgICBkZXNjcmliZSBcImN1cnNvciBpcyBvbiB0aGUgcGFpciBjaGFyXCIsIC0+XG4gICAgICAgIGNoZWNrID0gZ2V0Q2hlY2tGdW5jdGlvbkZvcignaSBcIicpXG4gICAgICAgIHRleHQgPSAnLVwiK1wiLSdcbiAgICAgICAgdGV4dEZpbmFsID0gJy1cIlwiLSdcbiAgICAgICAgc2VsZWN0ZWRUZXh0ID0gJysnXG4gICAgICAgIG9wZW4gPSBbMCwgMV1cbiAgICAgICAgY2xvc2UgPSBbMCwgM11cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCB7dGV4dH1cbiAgICAgICAgaXQgXCJjYXNlLTEgbm9ybWFsXCIsIC0+IGNoZWNrIG9wZW4sICdkJywgdGV4dDogdGV4dEZpbmFsLCBjdXJzb3I6IFswLCAyXVxuICAgICAgICBpdCBcImNhc2UtMiBub3JtYWxcIiwgLT4gY2hlY2sgY2xvc2UsICdkJywgdGV4dDogdGV4dEZpbmFsLCBjdXJzb3I6IFswLCAyXVxuICAgICAgICBpdCBcImNhc2UtMyB2aXN1YWxcIiwgLT4gY2hlY2sgb3BlbiwgJ3YnLCB7c2VsZWN0ZWRUZXh0fVxuICAgICAgICBpdCBcImNhc2UtNCB2aXN1YWxcIiwgLT4gY2hlY2sgY2xvc2UsICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgICBkZXNjcmliZSBcImEtZG91YmxlLXF1b3RlXCIsIC0+XG4gICAgICBvcmlnaW5hbFRleHQgPSAnXCIgc29tZXRoaW5nIGluIGhlcmUgYW5kIGluIFwiaGVyZVwiIFwiJ1xuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogb3JpZ2luYWxUZXh0LCBjdXJzb3I6IFswLCA5XVxuXG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIGFyb3VuZCB0aGUgY3VycmVudCBkb3VibGUgcXVvdGVzIGluIG9wZXJhdG9yLXBlbmRpbmcgbW9kZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2QgYSBcIicsXG4gICAgICAgICAgdGV4dDogJ2hlcmVcIiBcIidcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgICMgaXQgXCJbQ2hhbmdlZCBCZWhhdmlvcl0gd29udCBhcHBsaWVzIGlmIGl0cyBub3Qgd2l0aGluIHN0cmluZ1wiLCAtPlxuICAgICAgaXQgXCJza2lwIG5vbi1zdHJpbmcgYXJlYSBhbmQgb3BlcmF0ZSBmb3J3YXJkaW5nIHN0cmluZyB3aGl0aGluIGxpbmVcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDI5XVxuICAgICAgICBlbnN1cmUgJ2QgYSBcIicsXG4gICAgICAgICAgdGV4dDogJ1wiIHNvbWV0aGluZyBpbiBoZXJlIGFuZCBpbiBcImhlcmUnXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMzFdXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgIGRlc2NyaWJlIFwiY3Vyc29yIGlzIG9uIHRoZSBwYWlyIGNoYXJcIiwgLT5cbiAgICAgICAgY2hlY2sgPSBnZXRDaGVja0Z1bmN0aW9uRm9yKCdhIFwiJylcbiAgICAgICAgdGV4dCA9ICctXCIrXCItJ1xuICAgICAgICB0ZXh0RmluYWwgPSAnLS0nXG4gICAgICAgIHNlbGVjdGVkVGV4dCA9ICdcIitcIidcbiAgICAgICAgb3BlbiA9IFswLCAxXVxuICAgICAgICBjbG9zZSA9IFswLCAzXVxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHt0ZXh0fVxuICAgICAgICBpdCBcImNhc2UtMSBub3JtYWxcIiwgLT4gY2hlY2sgb3BlbiwgJ2QnLCB0ZXh0OiB0ZXh0RmluYWwsIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGl0IFwiY2FzZS0yIG5vcm1hbFwiLCAtPiBjaGVjayBjbG9zZSwgJ2QnLCB0ZXh0OiB0ZXh0RmluYWwsIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGl0IFwiY2FzZS0zIHZpc3VhbFwiLCAtPiBjaGVjayBvcGVuLCAndicsIHtzZWxlY3RlZFRleHR9XG4gICAgICAgIGl0IFwiY2FzZS00IHZpc3VhbFwiLCAtPiBjaGVjayBjbG9zZSwgJ3YnLCB7c2VsZWN0ZWRUZXh0fVxuICBkZXNjcmliZSBcIlNpbmdsZVF1b3RlXCIsIC0+XG4gICAgZGVzY3JpYmUgXCJpbm5lci1zaW5nbGUtcXVvdGVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCInIHNvbWV0aGluZyBpbiBoZXJlIGFuZCBpbiAnaGVyZScgJyBhbmQgb3ZlciBoZXJlXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCA5XVxuXG4gICAgICBkZXNjcmliZSBcImRvbid0IHRyZWF0IGxpdGVyYWwgYmFja3NsYXNoKGRvdWJsZSBiYWNrc2xhc2gpIGFzIGVzY2FwZSBjaGFyXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiJ3NvbWUta2V5LWhlcmVcXFxcXFxcXCc6ICdoZXJlLWlzLXRoZS12YWwnXCJcbiAgICAgICAgaXQgXCJjYXNlLTFcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgICBlbnN1cmUgXCJkIGkgJ1wiLFxuICAgICAgICAgICAgdGV4dDogXCInJzogJ2hlcmUtaXMtdGhlLXZhbCdcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMV1cblxuICAgICAgICBpdCBcImNhc2UtMlwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAxOV1cbiAgICAgICAgICBlbnN1cmUgXCJkIGkgJ1wiLFxuICAgICAgICAgICAgdGV4dDogXCInc29tZS1rZXktaGVyZVxcXFxcXFxcJzogJydcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMjBdXG5cbiAgICAgIGRlc2NyaWJlIFwidHJlYXQgYmFja3NsYXNoKHNpbmdsZSBiYWNrc2xhc2gpIGFzIGVzY2FwZSBjaGFyXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiJ3NvbWUta2V5LWhlcmVcXFxcJyc6ICdoZXJlLWlzLXRoZS12YWwnXCJcblxuICAgICAgICBpdCBcImNhc2UtMVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAyXVxuICAgICAgICAgIGVuc3VyZSBcImQgaSAnXCIsXG4gICAgICAgICAgICB0ZXh0OiBcIicnOiAnaGVyZS1pcy10aGUtdmFsJ1wiXG4gICAgICAgICAgICBjdXJzb3I6IFswLCAxXVxuICAgICAgICBpdCBcImNhc2UtMlwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAxN11cbiAgICAgICAgICBlbnN1cmUgXCJkIGkgJ1wiLFxuICAgICAgICAgICAgdGV4dDogXCInc29tZS1rZXktaGVyZVxcXFwnJzogJydcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMjBdXG5cbiAgICAgIGl0IFwiYXBwbGllcyBvcGVyYXRvcnMgaW5zaWRlIHRoZSBjdXJyZW50IHN0cmluZyBpbiBvcGVyYXRvci1wZW5kaW5nIG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlIFwiZCBpICdcIixcbiAgICAgICAgICB0ZXh0OiBcIicnaGVyZScgJyBhbmQgb3ZlciBoZXJlXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAxXVxuXG4gICAgICAjIFtOT1RFXVxuICAgICAgIyBJIGRvbid0IGxpa2Ugb3JpZ2luYWwgYmVoYXZpb3IsIHRoaXMgaXMgY291bnRlciBpbnR1aXRpdmUuXG4gICAgICAjIFNpbXBseSBzZWxlY3RpbmcgYXJlYSBiZXR3ZWVuIHF1b3RlIGlzIHRoYXQgbm9ybWFsIHVzZXIgZXhwZWN0cy5cbiAgICAgICMgaXQgXCJhcHBsaWVzIG9wZXJhdG9ycyBpbnNpZGUgdGhlIG5leHQgc3RyaW5nIGluIG9wZXJhdG9yLXBlbmRpbmcgbW9kZSAoaWYgbm90IGluIGEgc3RyaW5nKVwiLCAtPlxuICAgICAgIyA9PiBSZXZlcnRlZCB0byBvcmlnaW5hbCBiZWhhdmlvciwgYnV0IG5lZWQgY2FyZWZ1bCBjb25zaWRlcmF0aW9uIHdoYXQgaXMgYmVzdC5cblxuICAgICAgIyBpdCBcIltDaGFuZ2VkIGJlaGF2aW9yXSBhcHBsaWVzIG9wZXJhdG9ycyBpbnNpZGUgYXJlYSBiZXR3ZWVuIHF1b3RlXCIsIC0+XG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIGluc2lkZSB0aGUgbmV4dCBzdHJpbmcgaW4gb3BlcmF0b3ItcGVuZGluZyBtb2RlIChpZiBub3QgaW4gYSBzdHJpbmcpXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAyNl1cbiAgICAgICAgZW5zdXJlIFwiZCBpICdcIixcbiAgICAgICAgICB0ZXh0OiBcIicnaGVyZScgJyBhbmQgb3ZlciBoZXJlXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAxXVxuXG4gICAgICBpdCBcIm1ha2VzIG5vIGNoYW5nZSBpZiBwYXN0IHRoZSBsYXN0IHN0cmluZyBvbiBhIGxpbmVcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDM5XVxuICAgICAgICBlbnN1cmUgXCJkIGkgJ1wiLFxuICAgICAgICAgIHRleHQ6IFwiJyBzb21ldGhpbmcgaW4gaGVyZSBhbmQgaW4gJ2hlcmUnICcgYW5kIG92ZXIgaGVyZVwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMzldXG4gICAgICBkZXNjcmliZSBcImN1cnNvciBpcyBvbiB0aGUgcGFpciBjaGFyXCIsIC0+XG4gICAgICAgIGNoZWNrID0gZ2V0Q2hlY2tGdW5jdGlvbkZvcihcImkgJ1wiKVxuICAgICAgICB0ZXh0ID0gXCItJysnLVwiXG4gICAgICAgIHRleHRGaW5hbCA9IFwiLScnLVwiXG4gICAgICAgIHNlbGVjdGVkVGV4dCA9ICcrJ1xuICAgICAgICBvcGVuID0gWzAsIDFdXG4gICAgICAgIGNsb3NlID0gWzAsIDNdXG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXQge3RleHR9XG4gICAgICAgIGl0IFwiY2FzZS0xIG5vcm1hbFwiLCAtPiBjaGVjayBvcGVuLCAnZCcsIHRleHQ6IHRleHRGaW5hbCwgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgaXQgXCJjYXNlLTIgbm9ybWFsXCIsIC0+IGNoZWNrIGNsb3NlLCAnZCcsIHRleHQ6IHRleHRGaW5hbCwgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgaXQgXCJjYXNlLTMgdmlzdWFsXCIsIC0+IGNoZWNrIG9wZW4sICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgICAgICAgaXQgXCJjYXNlLTQgdmlzdWFsXCIsIC0+IGNoZWNrIGNsb3NlLCAndicsIHtzZWxlY3RlZFRleHR9XG4gICAgZGVzY3JpYmUgXCJhLXNpbmdsZS1xdW90ZVwiLCAtPlxuICAgICAgb3JpZ2luYWxUZXh0ID0gXCInIHNvbWV0aGluZyBpbiBoZXJlIGFuZCBpbiAnaGVyZScgJ1wiXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiBvcmlnaW5hbFRleHQsIGN1cnNvcjogWzAsIDldXG5cbiAgICAgIGl0IFwiYXBwbGllcyBvcGVyYXRvcnMgYXJvdW5kIHRoZSBjdXJyZW50IHNpbmdsZSBxdW90ZXMgaW4gb3BlcmF0b3ItcGVuZGluZyBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSBcImQgYSAnXCIsXG4gICAgICAgICAgdGV4dDogXCJoZXJlJyAnXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgIGl0IFwiYXBwbGllcyBvcGVyYXRvcnMgaW5zaWRlIHRoZSBuZXh0IHN0cmluZyBpbiBvcGVyYXRvci1wZW5kaW5nIG1vZGUgKGlmIG5vdCBpbiBhIHN0cmluZylcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDI5XVxuICAgICAgICBlbnN1cmUgXCJkIGEgJ1wiLFxuICAgICAgICAgIHRleHQ6IFwiJyBzb21ldGhpbmcgaW4gaGVyZSBhbmQgaW4gJ2hlcmVcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDMxXVxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICBkZXNjcmliZSBcImN1cnNvciBpcyBvbiB0aGUgcGFpciBjaGFyXCIsIC0+XG4gICAgICAgIGNoZWNrID0gZ2V0Q2hlY2tGdW5jdGlvbkZvcihcImEgJ1wiKVxuICAgICAgICB0ZXh0ID0gXCItJysnLVwiXG4gICAgICAgIHRleHRGaW5hbCA9IFwiLS1cIlxuICAgICAgICBzZWxlY3RlZFRleHQgPSBcIicrJ1wiXG4gICAgICAgIG9wZW4gPSBbMCwgMV1cbiAgICAgICAgY2xvc2UgPSBbMCwgM11cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCB7dGV4dH1cbiAgICAgICAgaXQgXCJjYXNlLTEgbm9ybWFsXCIsIC0+IGNoZWNrIG9wZW4sICdkJywgdGV4dDogdGV4dEZpbmFsLCBjdXJzb3I6IFswLCAxXVxuICAgICAgICBpdCBcImNhc2UtMiBub3JtYWxcIiwgLT4gY2hlY2sgY2xvc2UsICdkJywgdGV4dDogdGV4dEZpbmFsLCBjdXJzb3I6IFswLCAxXVxuICAgICAgICBpdCBcImNhc2UtMyB2aXN1YWxcIiwgLT4gY2hlY2sgb3BlbiwgJ3YnLCB7c2VsZWN0ZWRUZXh0fVxuICAgICAgICBpdCBcImNhc2UtNCB2aXN1YWxcIiwgLT4gY2hlY2sgY2xvc2UsICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgZGVzY3JpYmUgXCJCYWNrVGlja1wiLCAtPlxuICAgIG9yaWdpbmFsVGV4dCA9IFwidGhpcyBpcyBgc2FtcGxlYCB0ZXh0LlwiXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0IHRleHQ6IG9yaWdpbmFsVGV4dCwgY3Vyc29yOiBbMCwgOV1cblxuICAgIGRlc2NyaWJlIFwiaW5uZXItYmFjay10aWNrXCIsIC0+XG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIGlubmVyLWFyZWFcIiwgLT5cbiAgICAgICAgZW5zdXJlIFwiZCBpIGBcIiwgdGV4dDogXCJ0aGlzIGlzIGBgIHRleHQuXCIsIGN1cnNvcjogWzAsIDldXG5cbiAgICAgIGl0IFwiZG8gbm90aGluZyB3aGVuIHBhaXIgcmFuZ2UgaXMgbm90IHVuZGVyIGN1cnNvclwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMTZdXG4gICAgICAgIGVuc3VyZSBcImQgaSBgXCIsIHRleHQ6IG9yaWdpbmFsVGV4dCwgY3Vyc29yOiBbMCwgMTZdXG4gICAgICBkZXNjcmliZSBcImN1cnNvciBpcyBvbiB0aGUgcGFpciBjaGFyXCIsIC0+XG4gICAgICAgIGNoZWNrID0gZ2V0Q2hlY2tGdW5jdGlvbkZvcignaSBgJylcbiAgICAgICAgdGV4dCA9ICctYCtgLSdcbiAgICAgICAgdGV4dEZpbmFsID0gJy1gYC0nXG4gICAgICAgIHNlbGVjdGVkVGV4dCA9ICcrJ1xuICAgICAgICBvcGVuID0gWzAsIDFdXG4gICAgICAgIGNsb3NlID0gWzAsIDNdXG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXQge3RleHR9XG4gICAgICAgIGl0IFwiY2FzZS0xIG5vcm1hbFwiLCAtPiBjaGVjayBvcGVuLCAnZCcsIHRleHQ6IHRleHRGaW5hbCwgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgaXQgXCJjYXNlLTIgbm9ybWFsXCIsIC0+IGNoZWNrIGNsb3NlLCAnZCcsIHRleHQ6IHRleHRGaW5hbCwgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgaXQgXCJjYXNlLTMgdmlzdWFsXCIsIC0+IGNoZWNrIG9wZW4sICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgICAgICAgaXQgXCJjYXNlLTQgdmlzdWFsXCIsIC0+IGNoZWNrIGNsb3NlLCAndicsIHtzZWxlY3RlZFRleHR9XG4gICAgZGVzY3JpYmUgXCJhLWJhY2stdGlja1wiLCAtPlxuICAgICAgaXQgXCJhcHBsaWVzIG9wZXJhdG9ycyBpbm5lci1hcmVhXCIsIC0+XG4gICAgICAgIGVuc3VyZSBcImQgYSBgXCIsIHRleHQ6IFwidGhpcyBpcyAgdGV4dC5cIiwgY3Vyc29yOiBbMCwgOF1cblxuICAgICAgaXQgXCJkbyBub3RoaW5nIHdoZW4gcGFpciByYW5nZSBpcyBub3QgdW5kZXIgY3Vyc29yXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAxNl1cbiAgICAgICAgZW5zdXJlIFwiZCBhIGBcIiwgdGV4dDogb3JpZ2luYWxUZXh0LCBjdXJzb3I6IFswLCAxNl1cbiAgICAgIGRlc2NyaWJlIFwiY3Vyc29yIGlzIG9uIHRoZSBwYWlyIGNoYXJcIiwgLT5cbiAgICAgICAgY2hlY2sgPSBnZXRDaGVja0Z1bmN0aW9uRm9yKFwiYSBgXCIpXG4gICAgICAgIHRleHQgPSBcIi1gK2AtXCJcbiAgICAgICAgdGV4dEZpbmFsID0gXCItLVwiXG4gICAgICAgIHNlbGVjdGVkVGV4dCA9IFwiYCtgXCJcbiAgICAgICAgb3BlbiA9IFswLCAxXVxuICAgICAgICBjbG9zZSA9IFswLCAzXVxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHt0ZXh0fVxuICAgICAgICBpdCBcImNhc2UtMSBub3JtYWxcIiwgLT4gY2hlY2sgb3BlbiwgJ2QnLCB0ZXh0OiB0ZXh0RmluYWwsIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGl0IFwiY2FzZS0yIG5vcm1hbFwiLCAtPiBjaGVjayBjbG9zZSwgJ2QnLCB0ZXh0OiB0ZXh0RmluYWwsIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGl0IFwiY2FzZS0zIHZpc3VhbFwiLCAtPiBjaGVjayBvcGVuLCAndicsIHtzZWxlY3RlZFRleHR9XG4gICAgICAgIGl0IFwiY2FzZS00IHZpc3VhbFwiLCAtPiBjaGVjayBjbG9zZSwgJ3YnLCB7c2VsZWN0ZWRUZXh0fVxuICBkZXNjcmliZSBcIkN1cmx5QnJhY2tldFwiLCAtPlxuICAgIGRlc2NyaWJlIFwiaW5uZXItY3VybHktYnJhY2tldFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcInsgc29tZXRoaW5nIGluIGhlcmUgYW5kIGluIHtoZXJlfSB9XCJcbiAgICAgICAgICBjdXJzb3I6IFswLCA5XVxuXG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIHRvIGlubmVyLWFyZWEgaW4gb3BlcmF0b3ItcGVuZGluZyBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnZCBpIHsnLFxuICAgICAgICAgIHRleHQ6IFwie31cIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDFdXG5cbiAgICAgIGl0IFwiYXBwbGllcyBvcGVyYXRvcnMgdG8gaW5uZXItYXJlYSBpbiBvcGVyYXRvci1wZW5kaW5nIG1vZGUgKHNlY29uZCB0ZXN0KVwiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICBjdXJzb3I6IFswLCAyOV1cbiAgICAgICAgZW5zdXJlICdkIGkgeycsXG4gICAgICAgICAgdGV4dDogXCJ7IHNvbWV0aGluZyBpbiBoZXJlIGFuZCBpbiB7fSB9XCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAyOF1cblxuICAgICAgZGVzY3JpYmUgXCJjdXJzb3IgaXMgb24gdGhlIHBhaXIgY2hhclwiLCAtPlxuICAgICAgICBjaGVjayA9IGdldENoZWNrRnVuY3Rpb25Gb3IoJ2kgeycpXG4gICAgICAgIHRleHQgPSAnLXsrfS0nXG4gICAgICAgIHRleHRGaW5hbCA9ICcte30tJ1xuICAgICAgICBzZWxlY3RlZFRleHQgPSAnKydcbiAgICAgICAgb3BlbiA9IFswLCAxXVxuICAgICAgICBjbG9zZSA9IFswLCAzXVxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHt0ZXh0fVxuICAgICAgICBpdCBcImNhc2UtMSBub3JtYWxcIiwgLT4gY2hlY2sgb3BlbiwgJ2QnLCB0ZXh0OiB0ZXh0RmluYWwsIGN1cnNvcjogWzAsIDJdXG4gICAgICAgIGl0IFwiY2FzZS0yIG5vcm1hbFwiLCAtPiBjaGVjayBjbG9zZSwgJ2QnLCB0ZXh0OiB0ZXh0RmluYWwsIGN1cnNvcjogWzAsIDJdXG4gICAgICAgIGl0IFwiY2FzZS0zIHZpc3VhbFwiLCAtPiBjaGVjayBvcGVuLCAndicsIHtzZWxlY3RlZFRleHR9XG4gICAgICAgIGl0IFwiY2FzZS00IHZpc3VhbFwiLCAtPiBjaGVjayBjbG9zZSwgJ3YnLCB7c2VsZWN0ZWRUZXh0fVxuICAgIGRlc2NyaWJlIFwiYS1jdXJseS1icmFja2V0XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwieyBzb21ldGhpbmcgaW4gaGVyZSBhbmQgaW4ge2hlcmV9IH1cIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDldXG5cbiAgICAgIGl0IFwiYXBwbGllcyBvcGVyYXRvcnMgdG8gYS1hcmVhIGluIG9wZXJhdG9yLXBlbmRpbmcgbW9kZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2QgYSB7JyxcbiAgICAgICAgICB0ZXh0OiAnJ1xuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcblxuICAgICAgaXQgXCJhcHBsaWVzIG9wZXJhdG9ycyB0byBhLWFyZWEgaW4gb3BlcmF0b3ItcGVuZGluZyBtb2RlIChzZWNvbmQgdGVzdClcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDI5XVxuICAgICAgICBlbnN1cmUgJ2QgYSB7JyxcbiAgICAgICAgICB0ZXh0OiBcInsgc29tZXRoaW5nIGluIGhlcmUgYW5kIGluICB9XCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAyN11cbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgZGVzY3JpYmUgXCJjdXJzb3IgaXMgb24gdGhlIHBhaXIgY2hhclwiLCAtPlxuICAgICAgICBjaGVjayA9IGdldENoZWNrRnVuY3Rpb25Gb3IoXCJhIHtcIilcbiAgICAgICAgdGV4dCA9IFwiLXsrfS1cIlxuICAgICAgICB0ZXh0RmluYWwgPSBcIi0tXCJcbiAgICAgICAgc2VsZWN0ZWRUZXh0ID0gXCJ7K31cIlxuICAgICAgICBvcGVuID0gWzAsIDFdXG4gICAgICAgIGNsb3NlID0gWzAsIDNdXG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXQge3RleHR9XG4gICAgICAgIGl0IFwiY2FzZS0xIG5vcm1hbFwiLCAtPiBjaGVjayBvcGVuLCAnZCcsIHRleHQ6IHRleHRGaW5hbCwgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgaXQgXCJjYXNlLTIgbm9ybWFsXCIsIC0+IGNoZWNrIGNsb3NlLCAnZCcsIHRleHQ6IHRleHRGaW5hbCwgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgaXQgXCJjYXNlLTMgdmlzdWFsXCIsIC0+IGNoZWNrIG9wZW4sICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgICAgICAgaXQgXCJjYXNlLTQgdmlzdWFsXCIsIC0+IGNoZWNrIGNsb3NlLCAndicsIHtzZWxlY3RlZFRleHR9XG4gIGRlc2NyaWJlIFwiQW5nbGVCcmFja2V0XCIsIC0+XG4gICAgZGVzY3JpYmUgXCJpbm5lci1hbmdsZS1icmFja2V0XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiPCBzb21ldGhpbmcgaW4gaGVyZSBhbmQgaW4gPGhlcmU+ID5cIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDldXG5cbiAgICAgIGl0IFwiYXBwbGllcyBvcGVyYXRvcnMgaW5zaWRlIHRoZSBjdXJyZW50IHdvcmQgaW4gb3BlcmF0b3ItcGVuZGluZyBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnZCBpIDwnLFxuICAgICAgICAgIHRleHQ6IFwiPD5cIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDFdXG5cbiAgICAgIGl0IFwiYXBwbGllcyBvcGVyYXRvcnMgaW5zaWRlIHRoZSBjdXJyZW50IHdvcmQgaW4gb3BlcmF0b3ItcGVuZGluZyBtb2RlIChzZWNvbmQgdGVzdClcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDI5XVxuICAgICAgICBlbnN1cmUgJ2QgaSA8JyxcbiAgICAgICAgICB0ZXh0OiBcIjwgc29tZXRoaW5nIGluIGhlcmUgYW5kIGluIDw+ID5cIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDI4XVxuICAgICAgZGVzY3JpYmUgXCJjdXJzb3IgaXMgb24gdGhlIHBhaXIgY2hhclwiLCAtPlxuICAgICAgICBjaGVjayA9IGdldENoZWNrRnVuY3Rpb25Gb3IoJ2kgPCcpXG4gICAgICAgIHRleHQgPSAnLTwrPi0nXG4gICAgICAgIHRleHRGaW5hbCA9ICctPD4tJ1xuICAgICAgICBzZWxlY3RlZFRleHQgPSAnKydcbiAgICAgICAgb3BlbiA9IFswLCAxXVxuICAgICAgICBjbG9zZSA9IFswLCAzXVxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHt0ZXh0fVxuICAgICAgICBpdCBcImNhc2UtMSBub3JtYWxcIiwgLT4gY2hlY2sgb3BlbiwgJ2QnLCB0ZXh0OiB0ZXh0RmluYWwsIGN1cnNvcjogWzAsIDJdXG4gICAgICAgIGl0IFwiY2FzZS0yIG5vcm1hbFwiLCAtPiBjaGVjayBjbG9zZSwgJ2QnLCB0ZXh0OiB0ZXh0RmluYWwsIGN1cnNvcjogWzAsIDJdXG4gICAgICAgIGl0IFwiY2FzZS0zIHZpc3VhbFwiLCAtPiBjaGVjayBvcGVuLCAndicsIHtzZWxlY3RlZFRleHR9XG4gICAgICAgIGl0IFwiY2FzZS00IHZpc3VhbFwiLCAtPiBjaGVjayBjbG9zZSwgJ3YnLCB7c2VsZWN0ZWRUZXh0fVxuICAgIGRlc2NyaWJlIFwiYS1hbmdsZS1icmFja2V0XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiPCBzb21ldGhpbmcgaW4gaGVyZSBhbmQgaW4gPGhlcmU+ID5cIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDldXG5cbiAgICAgIGl0IFwiYXBwbGllcyBvcGVyYXRvcnMgYXJvdW5kIHRoZSBjdXJyZW50IGFuZ2xlIGJyYWNrZXRzIGluIG9wZXJhdG9yLXBlbmRpbmcgbW9kZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2QgYSA8JyxcbiAgICAgICAgICB0ZXh0OiAnJ1xuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcblxuICAgICAgaXQgXCJhcHBsaWVzIG9wZXJhdG9ycyBhcm91bmQgdGhlIGN1cnJlbnQgYW5nbGUgYnJhY2tldHMgaW4gb3BlcmF0b3ItcGVuZGluZyBtb2RlIChzZWNvbmQgdGVzdClcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDI5XVxuICAgICAgICBlbnN1cmUgJ2QgYSA8JyxcbiAgICAgICAgICB0ZXh0OiBcIjwgc29tZXRoaW5nIGluIGhlcmUgYW5kIGluICA+XCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAyN11cbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgZGVzY3JpYmUgXCJjdXJzb3IgaXMgb24gdGhlIHBhaXIgY2hhclwiLCAtPlxuICAgICAgICBjaGVjayA9IGdldENoZWNrRnVuY3Rpb25Gb3IoXCJhIDxcIilcbiAgICAgICAgdGV4dCA9IFwiLTwrPi1cIlxuICAgICAgICB0ZXh0RmluYWwgPSBcIi0tXCJcbiAgICAgICAgc2VsZWN0ZWRUZXh0ID0gXCI8Kz5cIlxuICAgICAgICBvcGVuID0gWzAsIDFdXG4gICAgICAgIGNsb3NlID0gWzAsIDNdXG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXQge3RleHR9XG4gICAgICAgIGl0IFwiY2FzZS0xIG5vcm1hbFwiLCAtPiBjaGVjayBvcGVuLCAnZCcsIHRleHQ6IHRleHRGaW5hbCwgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgaXQgXCJjYXNlLTIgbm9ybWFsXCIsIC0+IGNoZWNrIGNsb3NlLCAnZCcsIHRleHQ6IHRleHRGaW5hbCwgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgaXQgXCJjYXNlLTMgdmlzdWFsXCIsIC0+IGNoZWNrIG9wZW4sICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgICAgICAgaXQgXCJjYXNlLTQgdmlzdWFsXCIsIC0+IGNoZWNrIGNsb3NlLCAndicsIHtzZWxlY3RlZFRleHR9XG5cbiAgZGVzY3JpYmUgXCJBbGxvd0ZvcndhcmRpbmcgZmFtaWx5XCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgYXRvbS5rZXltYXBzLmFkZCBcInRlc3RcIixcbiAgICAgICAgJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1cy5vcGVyYXRvci1wZW5kaW5nLW1vZGUsIGF0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1cy52aXN1YWwtbW9kZSc6XG4gICAgICAgICAgJ2kgfSc6ICAndmltLW1vZGUtcGx1czppbm5lci1jdXJseS1icmFja2V0LWFsbG93LWZvcndhcmRpbmcnXG4gICAgICAgICAgJ2kgPic6ICAndmltLW1vZGUtcGx1czppbm5lci1hbmdsZS1icmFja2V0LWFsbG93LWZvcndhcmRpbmcnXG4gICAgICAgICAgJ2kgXSc6ICAndmltLW1vZGUtcGx1czppbm5lci1zcXVhcmUtYnJhY2tldC1hbGxvdy1mb3J3YXJkaW5nJ1xuICAgICAgICAgICdpICknOiAgJ3ZpbS1tb2RlLXBsdXM6aW5uZXItcGFyZW50aGVzaXMtYWxsb3ctZm9yd2FyZGluZydcblxuICAgICAgICAgICdhIH0nOiAgJ3ZpbS1tb2RlLXBsdXM6YS1jdXJseS1icmFja2V0LWFsbG93LWZvcndhcmRpbmcnXG4gICAgICAgICAgJ2EgPic6ICAndmltLW1vZGUtcGx1czphLWFuZ2xlLWJyYWNrZXQtYWxsb3ctZm9yd2FyZGluZydcbiAgICAgICAgICAnYSBdJzogICd2aW0tbW9kZS1wbHVzOmEtc3F1YXJlLWJyYWNrZXQtYWxsb3ctZm9yd2FyZGluZydcbiAgICAgICAgICAnYSApJzogICd2aW0tbW9kZS1wbHVzOmEtcGFyZW50aGVzaXMtYWxsb3ctZm9yd2FyZGluZydcblxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICBfX3swMDB9X19cbiAgICAgICAgX188MTExPl9fXG4gICAgICAgIF9fWzIyMl1fX1xuICAgICAgICBfXygzMzMpX19cbiAgICAgICAgXCJcIlwiXG4gICAgZGVzY3JpYmUgXCJpbm5lclwiLCAtPlxuICAgICAgaXQgXCJzZWxlY3QgZm9yd2FyZGluZyByYW5nZVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF07IGVuc3VyZSAnZXNjYXBlIHYgaSB9Jywgc2VsZWN0ZWRUZXh0OiBcIjAwMFwiXG4gICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXTsgZW5zdXJlICdlc2NhcGUgdiBpID4nLCBzZWxlY3RlZFRleHQ6IFwiMTExXCJcbiAgICAgICAgc2V0IGN1cnNvcjogWzIsIDBdOyBlbnN1cmUgJ2VzY2FwZSB2IGkgXScsIHNlbGVjdGVkVGV4dDogXCIyMjJcIlxuICAgICAgICBzZXQgY3Vyc29yOiBbMywgMF07IGVuc3VyZSAnZXNjYXBlIHYgaSApJywgc2VsZWN0ZWRUZXh0OiBcIjMzM1wiXG4gICAgZGVzY3JpYmUgXCJhXCIsIC0+XG4gICAgICBpdCBcInNlbGVjdCBmb3J3YXJkaW5nIHJhbmdlXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXTsgZW5zdXJlICdlc2NhcGUgdiBhIH0nLCBzZWxlY3RlZFRleHQ6IFwiezAwMH1cIlxuICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF07IGVuc3VyZSAnZXNjYXBlIHYgYSA+Jywgc2VsZWN0ZWRUZXh0OiBcIjwxMTE+XCJcbiAgICAgICAgc2V0IGN1cnNvcjogWzIsIDBdOyBlbnN1cmUgJ2VzY2FwZSB2IGEgXScsIHNlbGVjdGVkVGV4dDogXCJbMjIyXVwiXG4gICAgICAgIHNldCBjdXJzb3I6IFszLCAwXTsgZW5zdXJlICdlc2NhcGUgdiBhICknLCBzZWxlY3RlZFRleHQ6IFwiKDMzMylcIlxuICAgIGRlc2NyaWJlIFwibXVsdGkgbGluZSB0ZXh0XCIsIC0+XG4gICAgICBbdGV4dE9uZUlubmVyLCB0ZXh0T25lQV0gPSBbXVxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAwMDBcbiAgICAgICAgICAwMDB7MTFcbiAgICAgICAgICAxMTF7MjJ9XG4gICAgICAgICAgMTExXG4gICAgICAgICAgMTExfVxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB0ZXh0T25lSW5uZXIgPSBcIlwiXCJcbiAgICAgICAgICAxMVxuICAgICAgICAgIDExMXsyMn1cbiAgICAgICAgICAxMTFcbiAgICAgICAgICAxMTFcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgdGV4dE9uZUEgPSBcIlwiXCJcbiAgICAgICAgICB7MTFcbiAgICAgICAgICAxMTF7MjJ9XG4gICAgICAgICAgMTExXG4gICAgICAgICAgMTExfVxuICAgICAgICAgIFwiXCJcIlxuICAgICAgZGVzY3JpYmUgXCJmb3J3YXJkaW5nIGlubmVyXCIsIC0+XG4gICAgICAgIGl0IFwic2VsZWN0IGZvcndhcmRpbmcgcmFuZ2VcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF07IGVuc3VyZSBcInYgaSB9XCIsIHNlbGVjdGVkVGV4dDogdGV4dE9uZUlubmVyXG4gICAgICAgIGl0IFwic2VsZWN0IGZvcndhcmRpbmcgcmFuZ2VcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMF07IGVuc3VyZSBcInYgaSB9XCIsIHNlbGVjdGVkVGV4dDogXCIyMlwiXG4gICAgICAgIGl0IFwiW2Nhc2UtMV0gbm8gZm9yd2FyZGluZyBvcGVuIHBhaXIsIGZhaWwgdG8gZmluZFwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXTsgZW5zdXJlIFwidiBpIH1cIiwgc2VsZWN0ZWRUZXh0OiAnMCcsIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGl0IFwiW2Nhc2UtMl0gbm8gZm9yd2FyZGluZyBvcGVuIHBhaXIsIHNlbGVjdCBlbmNsb3NlZFwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCA0XTsgZW5zdXJlIFwidiBpIH1cIiwgc2VsZWN0ZWRUZXh0OiB0ZXh0T25lSW5uZXJcbiAgICAgICAgaXQgXCJbY2FzZS0zXSBubyBmb3J3YXJkaW5nIG9wZW4gcGFpciwgc2VsZWN0IGVuY2xvc2VkXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzMsIDBdOyBlbnN1cmUgXCJ2IGkgfVwiLCBzZWxlY3RlZFRleHQ6IHRleHRPbmVJbm5lclxuICAgICAgICBpdCBcIltjYXNlLTNdIG5vIGZvcndhcmRpbmcgb3BlbiBwYWlyLCBzZWxlY3QgZW5jbG9zZWRcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbNCwgMF07IGVuc3VyZSBcInYgaSB9XCIsIHNlbGVjdGVkVGV4dDogdGV4dE9uZUlubmVyXG4gICAgICBkZXNjcmliZSBcImZvcndhcmRpbmcgYVwiLCAtPlxuICAgICAgICBpdCBcInNlbGVjdCBmb3J3YXJkaW5nIHJhbmdlXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDBdOyBlbnN1cmUgXCJ2IGEgfVwiLCBzZWxlY3RlZFRleHQ6IHRleHRPbmVBXG4gICAgICAgIGl0IFwic2VsZWN0IGZvcndhcmRpbmcgcmFuZ2VcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMF07IGVuc3VyZSBcInYgYSB9XCIsIHNlbGVjdGVkVGV4dDogXCJ7MjJ9XCJcbiAgICAgICAgaXQgXCJbY2FzZS0xXSBubyBmb3J3YXJkaW5nIG9wZW4gcGFpciwgZmFpbCB0byBmaW5kXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdOyBlbnN1cmUgXCJ2IGEgfVwiLCBzZWxlY3RlZFRleHQ6ICcwJywgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgaXQgXCJbY2FzZS0yXSBubyBmb3J3YXJkaW5nIG9wZW4gcGFpciwgc2VsZWN0IGVuY2xvc2VkXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDRdOyBlbnN1cmUgXCJ2IGEgfVwiLCBzZWxlY3RlZFRleHQ6IHRleHRPbmVBXG4gICAgICAgIGl0IFwiW2Nhc2UtM10gbm8gZm9yd2FyZGluZyBvcGVuIHBhaXIsIHNlbGVjdCBlbmNsb3NlZFwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFszLCAwXTsgZW5zdXJlIFwidiBhIH1cIiwgc2VsZWN0ZWRUZXh0OiB0ZXh0T25lQVxuICAgICAgICBpdCBcIltjYXNlLTNdIG5vIGZvcndhcmRpbmcgb3BlbiBwYWlyLCBzZWxlY3QgZW5jbG9zZWRcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbNCwgMF07IGVuc3VyZSBcInYgYSB9XCIsIHNlbGVjdGVkVGV4dDogdGV4dE9uZUFcblxuICBkZXNjcmliZSBcIkFueVBhaXJBbGxvd0ZvcndhcmRpbmdcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBhdG9tLmtleW1hcHMuYWRkIFwidGV4dFwiLFxuICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzLm9wZXJhdG9yLXBlbmRpbmctbW9kZSwgYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzLnZpc3VhbC1tb2RlJzpcbiAgICAgICAgICBcIjtcIjogJ3ZpbS1tb2RlLXBsdXM6aW5uZXItYW55LXBhaXItYWxsb3ctZm9yd2FyZGluZydcbiAgICAgICAgICBcIjpcIjogJ3ZpbS1tb2RlLXBsdXM6YS1hbnktcGFpci1hbGxvdy1mb3J3YXJkaW5nJ1xuXG4gICAgICBzZXQgdGV4dDogXCJcIlwiXG4gICAgICAgIDAwXG4gICAgICAgIDAwWzExXG4gICAgICAgIDExXCIyMjJcIjExezMzM30xMShcbiAgICAgICAgNDQ0KCk0NDRcbiAgICAgICAgKVxuICAgICAgICAxMTFdMDB7NTU1fVxuICAgICAgICBcIlwiXCJcbiAgICBkZXNjcmliZSBcImlubmVyXCIsIC0+XG4gICAgICBpdCBcInNlbGVjdCBmb3J3YXJkaW5nIHJhbmdlIHdpdGhpbiBlbmNsb3NlZCByYW5nZShpZiBleGlzdHMpXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsyLCAwXVxuICAgICAgICBrZXlzdHJva2UgJ3YnXG4gICAgICAgIGVuc3VyZSAnOycsIHNlbGVjdGVkVGV4dDogXCIyMjJcIlxuICAgICAgICBlbnN1cmUgJzsnLCBzZWxlY3RlZFRleHQ6IFwiMzMzXCJcbiAgICAgICAgZW5zdXJlICc7Jywgc2VsZWN0ZWRUZXh0OiBcIjQ0NCgpNDQ0XFxuXCJcbiAgICAgICAgZW5zdXJlICc7Jywgc2VsZWN0ZWRUZXh0OiBcIlwiLCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbWzMsIDRdLCBbMywgNF1dXG4gICAgZGVzY3JpYmUgXCJhXCIsIC0+XG4gICAgICBpdCBcInNlbGVjdCBmb3J3YXJkaW5nIHJhbmdlIHdpdGhpbiBlbmNsb3NlZCByYW5nZShpZiBleGlzdHMpXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsyLCAwXVxuICAgICAgICBrZXlzdHJva2UgJ3YnXG4gICAgICAgIGVuc3VyZSAnOicsIHNlbGVjdGVkVGV4dDogJ1wiMjIyXCInXG4gICAgICAgIGVuc3VyZSAnOicsIHNlbGVjdGVkVGV4dDogXCJ7MzMzfVwiXG4gICAgICAgIGVuc3VyZSAnOicsIHNlbGVjdGVkVGV4dDogXCIoXFxuNDQ0KCk0NDRcXG4pXCJcbiAgICAgICAgZW5zdXJlICc6Jywgc2VsZWN0ZWRUZXh0OiBcIlwiXCJcbiAgICAgICAgWzExXG4gICAgICAgIDExXCIyMjJcIjExezMzM30xMShcbiAgICAgICAgNDQ0KCk0NDRcbiAgICAgICAgKVxuICAgICAgICAxMTFdXG4gICAgICAgIFwiXCJcIlxuXG4gIGRlc2NyaWJlIFwiVGFnXCIsIC0+XG4gICAgW2Vuc3VyZVNlbGVjdGVkVGV4dF0gPSBbXVxuICAgIGVuc3VyZVNlbGVjdGVkVGV4dCA9IChzdGFydCwga2V5c3Ryb2tlLCBzZWxlY3RlZFRleHQpIC0+XG4gICAgICBzZXQgY3Vyc29yOiBzdGFydFxuICAgICAgZW5zdXJlIGtleXN0cm9rZSwge3NlbGVjdGVkVGV4dH1cblxuICAgIGRlc2NyaWJlIFwiaW5uZXItdGFnXCIsIC0+XG4gICAgICBkZXNjcmliZSBcInByaWNpc2VseSBzZWxlY3QgaW5uZXJcIiwgLT5cbiAgICAgICAgY2hlY2sgPSBnZXRDaGVja0Z1bmN0aW9uRm9yKCdpIHQnKVxuICAgICAgICB0ZXh0ID0gXCI8YWJjPiAgPHRpdGxlPlRJVExFPC90aXRsZT4gPC9hYmM+XCJcbiAgICAgICAgZGVsZXRlZFRleHQgPSBcIjxhYmM+ICA8dGl0bGU+PC90aXRsZT4gPC9hYmM+XCJcbiAgICAgICAgc2VsZWN0ZWRUZXh0ID0gXCJUSVRMRVwiXG4gICAgICAgIGlubmVyQUJDID0gXCIgIDx0aXRsZT5USVRMRTwvdGl0bGU+IFwiXG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXQge3RleHR9XG4gICAgICAgICMgU2VsZWN0XG4gICAgICAgIGl0IFwiWzFdIGZvcndhcmRpbmdcIiwgLT4gY2hlY2sgWzAsIDVdLCAndicsIHtzZWxlY3RlZFRleHR9XG4gICAgICAgIGl0IFwiWzJdIG9wZW5UYWcgbGVmdG1vc3RcIiwgLT4gY2hlY2sgWzAsIDddLCAndicsIHtzZWxlY3RlZFRleHR9XG4gICAgICAgIGl0IFwiWzNdIG9wZW5UYWcgcmlnaHRtb3N0XCIsIC0+IGNoZWNrIFswLCAxM10sICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgICAgICAgaXQgXCJbNF0gSW5uZXIgdGV4dFwiLCAtPiBjaGVjayBbMCwgMTZdLCAndicsIHtzZWxlY3RlZFRleHR9XG4gICAgICAgIGl0IFwiWzVdIGNsb3NlVGFnIGxlZnRtb3N0XCIsIC0+IGNoZWNrIFswLCAxOV0sICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgICAgICAgaXQgXCJbNl0gY2xvc2VUYWcgcmlnaHRtb3N0XCIsIC0+IGNoZWNrIFswLCAyNl0sICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgICAgICAgaXQgXCJbN10gcmlnaHQgb2YgY2xvc2VUYWdcIiwgLT4gY2hlY2sgWzAsIDI3XSwgJ3YnLCB7c2VsZWN0ZWRUZXh0OiBpbm5lckFCQ31cblxuICAgICAgICAjIERlbGV0ZVxuICAgICAgICBpdCBcIls4XSBmb3J3YXJkaW5nXCIsIC0+IGNoZWNrIFswLCA1XSwgJ2QnLCB7dGV4dDogZGVsZXRlZFRleHR9XG4gICAgICAgIGl0IFwiWzldIG9wZW5UYWcgbGVmdG1vc3RcIiwgLT4gY2hlY2sgWzAsIDddLCAnZCcsIHt0ZXh0OiBkZWxldGVkVGV4dH1cbiAgICAgICAgaXQgXCJbMTBdIG9wZW5UYWcgcmlnaHRtb3N0XCIsIC0+IGNoZWNrIFswLCAxM10sICdkJywge3RleHQ6IGRlbGV0ZWRUZXh0fVxuICAgICAgICBpdCBcIlsxMV0gSW5uZXIgdGV4dFwiLCAtPiBjaGVjayBbMCwgMTZdLCAnZCcsIHt0ZXh0OiBkZWxldGVkVGV4dH1cbiAgICAgICAgaXQgXCJbMTJdIGNsb3NlVGFnIGxlZnRtb3N0XCIsIC0+IGNoZWNrIFswLCAxOV0sICdkJywge3RleHQ6IGRlbGV0ZWRUZXh0fVxuICAgICAgICBpdCBcIlsxM10gY2xvc2VUYWcgcmlnaHRtb3N0XCIsIC0+IGNoZWNrIFswLCAyNl0sICdkJywge3RleHQ6IGRlbGV0ZWRUZXh0fVxuICAgICAgICBpdCBcIlsxNF0gcmlnaHQgb2YgY2xvc2VUYWdcIiwgLT4gY2hlY2sgWzAsIDI3XSwgJ2QnLCB7dGV4dDogXCI8YWJjPjwvYWJjPlwifVxuXG4gICAgICBkZXNjcmliZSBcImV4cGFuc2lvbiBhbmQgZGVsZXRpb25cIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGh0bWxMaWtlVGV4dCA9IFwiXCJcIlxuICAgICAgICAgIDwhRE9DVFlQRSBodG1sPlxuICAgICAgICAgIDxodG1sIGxhbmc9XCJlblwiPlxuICAgICAgICAgIDxoZWFkPlxuICAgICAgICAgIF9fPG1ldGEgY2hhcnNldD1cIlVURi04XCIgLz5cbiAgICAgICAgICBfXzx0aXRsZT5Eb2N1bWVudDwvdGl0bGU+XG4gICAgICAgICAgPC9oZWFkPlxuICAgICAgICAgIDxib2R5PlxuICAgICAgICAgIF9fPGRpdj5cbiAgICAgICAgICBfX19fPGRpdj5cbiAgICAgICAgICBfX19fX188ZGl2PlxuICAgICAgICAgIF9fX19fX19fPHA+PGE+XG4gICAgICAgICAgX19fX19fPC9kaXY+XG4gICAgICAgICAgX19fXzwvZGl2PlxuICAgICAgICAgIF9fPC9kaXY+XG4gICAgICAgICAgPC9ib2R5PlxuICAgICAgICAgIDwvaHRtbD5cXG5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBzZXQgdGV4dDogaHRtbExpa2VUZXh0XG4gICAgICAgIGl0IFwiY2FuIGV4cGFuZCBzZWxlY3Rpb24gd2hlbiByZXBlYXRlZFwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFs5LCAwXVxuICAgICAgICAgIGVuc3VyZSAndiBpIHQnLCBzZWxlY3RlZFRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgXFxuX19fX19fX188cD48YT5cbiAgICAgICAgICAgIF9fX19fX1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgZW5zdXJlICdpIHQnLCBzZWxlY3RlZFRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgXFxuX19fX19fPGRpdj5cbiAgICAgICAgICAgIF9fX19fX19fPHA+PGE+XG4gICAgICAgICAgICBfX19fX188L2Rpdj5cbiAgICAgICAgICAgIF9fX19cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGVuc3VyZSAnaSB0Jywgc2VsZWN0ZWRUZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIFxcbl9fX188ZGl2PlxuICAgICAgICAgICAgX19fX19fPGRpdj5cbiAgICAgICAgICAgIF9fX19fX19fPHA+PGE+XG4gICAgICAgICAgICBfX19fX188L2Rpdj5cbiAgICAgICAgICAgIF9fX188L2Rpdj5cbiAgICAgICAgICAgIF9fXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBlbnN1cmUgJ2kgdCcsIHNlbGVjdGVkVGV4dDogXCJcIlwiXG4gICAgICAgICAgICBcXG5fXzxkaXY+XG4gICAgICAgICAgICBfX19fPGRpdj5cbiAgICAgICAgICAgIF9fX19fXzxkaXY+XG4gICAgICAgICAgICBfX19fX19fXzxwPjxhPlxuICAgICAgICAgICAgX19fX19fPC9kaXY+XG4gICAgICAgICAgICBfX19fPC9kaXY+XG4gICAgICAgICAgICBfXzwvZGl2PlxcblxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgZW5zdXJlICdpIHQnLCBzZWxlY3RlZFRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgXFxuPGhlYWQ+XG4gICAgICAgICAgICBfXzxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiIC8+XG4gICAgICAgICAgICBfXzx0aXRsZT5Eb2N1bWVudDwvdGl0bGU+XG4gICAgICAgICAgICA8L2hlYWQ+XG4gICAgICAgICAgICA8Ym9keT5cbiAgICAgICAgICAgIF9fPGRpdj5cbiAgICAgICAgICAgIF9fX188ZGl2PlxuICAgICAgICAgICAgX19fX19fPGRpdj5cbiAgICAgICAgICAgIF9fX19fX19fPHA+PGE+XG4gICAgICAgICAgICBfX19fX188L2Rpdj5cbiAgICAgICAgICAgIF9fX188L2Rpdj5cbiAgICAgICAgICAgIF9fPC9kaXY+XG4gICAgICAgICAgICA8L2JvZHk+XFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgaXQgJ2RlbGV0ZSBpbm5lci10YWcgYW5kIHJlcGF0YWJsZScsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzksIDBdXG4gICAgICAgICAgZW5zdXJlIFwiZCBpIHRcIiwgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICAgICAgICAgIDxodG1sIGxhbmc9XCJlblwiPlxuICAgICAgICAgICAgPGhlYWQ+XG4gICAgICAgICAgICBfXzxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiIC8+XG4gICAgICAgICAgICBfXzx0aXRsZT5Eb2N1bWVudDwvdGl0bGU+XG4gICAgICAgICAgICA8L2hlYWQ+XG4gICAgICAgICAgICA8Ym9keT5cbiAgICAgICAgICAgIF9fPGRpdj5cbiAgICAgICAgICAgIF9fX188ZGl2PlxuICAgICAgICAgICAgX19fX19fPGRpdj48L2Rpdj5cbiAgICAgICAgICAgIF9fX188L2Rpdj5cbiAgICAgICAgICAgIF9fPC9kaXY+XG4gICAgICAgICAgICA8L2JvZHk+XG4gICAgICAgICAgICA8L2h0bWw+XFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBlbnN1cmUgXCIzIC5cIiwgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICA8IURPQ1RZUEUgaHRtbD5cbiAgICAgICAgICAgIDxodG1sIGxhbmc9XCJlblwiPlxuICAgICAgICAgICAgPGhlYWQ+XG4gICAgICAgICAgICBfXzxtZXRhIGNoYXJzZXQ9XCJVVEYtOFwiIC8+XG4gICAgICAgICAgICBfXzx0aXRsZT5Eb2N1bWVudDwvdGl0bGU+XG4gICAgICAgICAgICA8L2hlYWQ+XG4gICAgICAgICAgICA8Ym9keT48L2JvZHk+XG4gICAgICAgICAgICA8L2h0bWw+XFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBlbnN1cmUgXCIuXCIsIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgPCFET0NUWVBFIGh0bWw+XG4gICAgICAgICAgICA8aHRtbCBsYW5nPVwiZW5cIj48L2h0bWw+XFxuXG4gICAgICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwiYS10YWdcIiwgLT5cbiAgICAgIGRlc2NyaWJlIFwicHJpY2lzZWx5IHNlbGVjdCBhXCIsIC0+XG4gICAgICAgIGNoZWNrID0gZ2V0Q2hlY2tGdW5jdGlvbkZvcignYSB0JylcbiAgICAgICAgdGV4dCA9IFwiPGFiYz4gIDx0aXRsZT5USVRMRTwvdGl0bGU+IDwvYWJjPlwiXG4gICAgICAgIGRlbGV0ZWRUZXh0ID0gXCI8YWJjPiAgIDwvYWJjPlwiXG4gICAgICAgIHNlbGVjdGVkVGV4dCA9IFwiPHRpdGxlPlRJVExFPC90aXRsZT5cIlxuICAgICAgICBhQUJDID0gXCI8YWJjPiAgPHRpdGxlPlRJVExFPC90aXRsZT4gPC9hYmM+XCJcbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCB7dGV4dH1cbiAgICAgICAgIyBTZWxlY3RcbiAgICAgICAgaXQgXCJbMV0gZm9yd2FyZGluZ1wiLCAtPiBjaGVjayBbMCwgNV0sICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgICAgICAgaXQgXCJbMl0gb3BlblRhZyBsZWZ0bW9zdFwiLCAtPiBjaGVjayBbMCwgN10sICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgICAgICAgaXQgXCJbM10gb3BlblRhZyByaWdodG1vc3RcIiwgLT4gY2hlY2sgWzAsIDEzXSwgJ3YnLCB7c2VsZWN0ZWRUZXh0fVxuICAgICAgICBpdCBcIls0XSBJbm5lciB0ZXh0XCIsIC0+IGNoZWNrIFswLCAxNl0sICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgICAgICAgaXQgXCJbNV0gY2xvc2VUYWcgbGVmdG1vc3RcIiwgLT4gY2hlY2sgWzAsIDE5XSwgJ3YnLCB7c2VsZWN0ZWRUZXh0fVxuICAgICAgICBpdCBcIls2XSBjbG9zZVRhZyByaWdodG1vc3RcIiwgLT4gY2hlY2sgWzAsIDI2XSwgJ3YnLCB7c2VsZWN0ZWRUZXh0fVxuICAgICAgICBpdCBcIls3XSByaWdodCBvZiBjbG9zZVRhZ1wiLCAtPiBjaGVjayBbMCwgMjddLCAndicsIHtzZWxlY3RlZFRleHQ6IGFBQkN9XG5cbiAgICAgICAgIyBEZWxldGVcbiAgICAgICAgaXQgXCJbOF0gZm9yd2FyZGluZ1wiLCAtPiBjaGVjayBbMCwgNV0sICdkJywge3RleHQ6IGRlbGV0ZWRUZXh0fVxuICAgICAgICBpdCBcIls5XSBvcGVuVGFnIGxlZnRtb3N0XCIsIC0+IGNoZWNrIFswLCA3XSwgJ2QnLCB7dGV4dDogZGVsZXRlZFRleHR9XG4gICAgICAgIGl0IFwiWzEwXSBvcGVuVGFnIHJpZ2h0bW9zdFwiLCAtPiBjaGVjayBbMCwgMTNdLCAnZCcsIHt0ZXh0OiBkZWxldGVkVGV4dH1cbiAgICAgICAgaXQgXCJbMTFdIElubmVyIHRleHRcIiwgLT4gY2hlY2sgWzAsIDE2XSwgJ2QnLCB7dGV4dDogZGVsZXRlZFRleHR9XG4gICAgICAgIGl0IFwiWzEyXSBjbG9zZVRhZyBsZWZ0bW9zdFwiLCAtPiBjaGVjayBbMCwgMTldLCAnZCcsIHt0ZXh0OiBkZWxldGVkVGV4dH1cbiAgICAgICAgaXQgXCJbMTNdIGNsb3NlVGFnIHJpZ2h0bW9zdFwiLCAtPiBjaGVjayBbMCwgMjZdLCAnZCcsIHt0ZXh0OiBkZWxldGVkVGV4dH1cbiAgICAgICAgaXQgXCJbMTRdIHJpZ2h0IG9mIGNsb3NlVGFnXCIsIC0+IGNoZWNrIFswLCAyN10sICdkJywge3RleHQ6IFwiXCJ9XG5cbiAgZGVzY3JpYmUgXCJTcXVhcmVCcmFja2V0XCIsIC0+XG4gICAgZGVzY3JpYmUgXCJpbm5lci1zcXVhcmUtYnJhY2tldFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlsgc29tZXRoaW5nIGluIGhlcmUgYW5kIGluIFtoZXJlXSBdXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCA5XVxuXG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIGluc2lkZSB0aGUgY3VycmVudCB3b3JkIGluIG9wZXJhdG9yLXBlbmRpbmcgbW9kZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2QgaSBbJyxcbiAgICAgICAgICB0ZXh0OiBcIltdXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAxXVxuXG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIGluc2lkZSB0aGUgY3VycmVudCB3b3JkIGluIG9wZXJhdG9yLXBlbmRpbmcgbW9kZSAoc2Vjb25kIHRlc3QpXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIGN1cnNvcjogWzAsIDI5XVxuICAgICAgICBlbnN1cmUgJ2QgaSBbJyxcbiAgICAgICAgICB0ZXh0OiBcIlsgc29tZXRoaW5nIGluIGhlcmUgYW5kIGluIFtdIF1cIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDI4XVxuICAgIGRlc2NyaWJlIFwiYS1zcXVhcmUtYnJhY2tldFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlsgc29tZXRoaW5nIGluIGhlcmUgYW5kIGluIFtoZXJlXSBdXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCA5XVxuXG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIGFyb3VuZCB0aGUgY3VycmVudCBzcXVhcmUgYnJhY2tldHMgaW4gb3BlcmF0b3ItcGVuZGluZyBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnZCBhIFsnLFxuICAgICAgICAgIHRleHQ6ICcnXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIGFyb3VuZCB0aGUgY3VycmVudCBzcXVhcmUgYnJhY2tldHMgaW4gb3BlcmF0b3ItcGVuZGluZyBtb2RlIChzZWNvbmQgdGVzdClcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDI5XVxuICAgICAgICBlbnN1cmUgJ2QgYSBbJyxcbiAgICAgICAgICB0ZXh0OiBcIlsgc29tZXRoaW5nIGluIGhlcmUgYW5kIGluICBdXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAyN11cbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgZGVzY3JpYmUgXCJjdXJzb3IgaXMgb24gdGhlIHBhaXIgY2hhclwiLCAtPlxuICAgICAgICBjaGVjayA9IGdldENoZWNrRnVuY3Rpb25Gb3IoJ2kgWycpXG4gICAgICAgIHRleHQgPSAnLVsrXS0nXG4gICAgICAgIHRleHRGaW5hbCA9ICctW10tJ1xuICAgICAgICBzZWxlY3RlZFRleHQgPSAnKydcbiAgICAgICAgb3BlbiA9IFswLCAxXVxuICAgICAgICBjbG9zZSA9IFswLCAzXVxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHt0ZXh0fVxuICAgICAgICBpdCBcImNhc2UtMSBub3JtYWxcIiwgLT4gY2hlY2sgb3BlbiwgJ2QnLCB0ZXh0OiB0ZXh0RmluYWwsIGN1cnNvcjogWzAsIDJdXG4gICAgICAgIGl0IFwiY2FzZS0yIG5vcm1hbFwiLCAtPiBjaGVjayBjbG9zZSwgJ2QnLCB0ZXh0OiB0ZXh0RmluYWwsIGN1cnNvcjogWzAsIDJdXG4gICAgICAgIGl0IFwiY2FzZS0zIHZpc3VhbFwiLCAtPiBjaGVjayBvcGVuLCAndicsIHtzZWxlY3RlZFRleHR9XG4gICAgICAgIGl0IFwiY2FzZS00IHZpc3VhbFwiLCAtPiBjaGVjayBjbG9zZSwgJ3YnLCB7c2VsZWN0ZWRUZXh0fVxuICAgICAgZGVzY3JpYmUgXCJjdXJzb3IgaXMgb24gdGhlIHBhaXIgY2hhclwiLCAtPlxuICAgICAgICBjaGVjayA9IGdldENoZWNrRnVuY3Rpb25Gb3IoJ2EgWycpXG4gICAgICAgIHRleHQgPSAnLVsrXS0nXG4gICAgICAgIHRleHRGaW5hbCA9ICctLSdcbiAgICAgICAgc2VsZWN0ZWRUZXh0ID0gJ1srXSdcbiAgICAgICAgb3BlbiA9IFswLCAxXVxuICAgICAgICBjbG9zZSA9IFswLCAzXVxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHt0ZXh0fVxuICAgICAgICBpdCBcImNhc2UtMSBub3JtYWxcIiwgLT4gY2hlY2sgb3BlbiwgJ2QnLCB0ZXh0OiB0ZXh0RmluYWwsIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGl0IFwiY2FzZS0yIG5vcm1hbFwiLCAtPiBjaGVjayBjbG9zZSwgJ2QnLCB0ZXh0OiB0ZXh0RmluYWwsIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGl0IFwiY2FzZS0zIHZpc3VhbFwiLCAtPiBjaGVjayBvcGVuLCAndicsIHtzZWxlY3RlZFRleHR9XG4gICAgICAgIGl0IFwiY2FzZS00IHZpc3VhbFwiLCAtPiBjaGVjayBjbG9zZSwgJ3YnLCB7c2VsZWN0ZWRUZXh0fVxuICBkZXNjcmliZSBcIlBhcmVudGhlc2lzXCIsIC0+XG4gICAgZGVzY3JpYmUgXCJpbm5lci1wYXJlbnRoZXNpc1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIiggc29tZXRoaW5nIGluIGhlcmUgYW5kIGluIChoZXJlKSApXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCA5XVxuXG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIGluc2lkZSB0aGUgY3VycmVudCB3b3JkIGluIG9wZXJhdG9yLXBlbmRpbmcgbW9kZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2QgaSAoJyxcbiAgICAgICAgICB0ZXh0OiBcIigpXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAxXVxuXG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIGluc2lkZSB0aGUgY3VycmVudCB3b3JkIGluIG9wZXJhdG9yLXBlbmRpbmcgbW9kZSAoc2Vjb25kIHRlc3QpXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAyOV1cbiAgICAgICAgZW5zdXJlICdkIGkgKCcsXG4gICAgICAgICAgdGV4dDogXCIoIHNvbWV0aGluZyBpbiBoZXJlIGFuZCBpbiAoKSApXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAyOF1cblxuICAgICAgaXQgXCJzZWxlY3QgaW5uZXIgKCkgYnkgc2tpcHBpbmcgbmVzdGluZyBwYWlyXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6ICdleHBlY3QoZWRpdG9yLmdldFNjcm9sbFRvcCgpKSdcbiAgICAgICAgICBjdXJzb3I6IFswLCA3XVxuICAgICAgICBlbnN1cmUgJ3YgaSAoJywgc2VsZWN0ZWRUZXh0OiAnZWRpdG9yLmdldFNjcm9sbFRvcCgpJ1xuXG4gICAgICBpdCBcInNraXAgZXNjYXBlZCBwYWlyIGNhc2UtMVwiLCAtPlxuICAgICAgICBzZXQgdGV4dDogJ2V4cGVjdChlZGl0b3IuZ1xcXFwoZXRTY3JvbGxUcCgpKScsIGN1cnNvcjogWzAsIDIwXVxuICAgICAgICBlbnN1cmUgJ3YgaSAoJywgc2VsZWN0ZWRUZXh0OiAnZWRpdG9yLmdcXFxcKGV0U2Nyb2xsVHAoKSdcblxuICAgICAgaXQgXCJkb250IHNraXAgbGl0ZXJhbCBiYWNrc2xhc2hcIiwgLT5cbiAgICAgICAgc2V0IHRleHQ6ICdleHBlY3QoZWRpdG9yLmdcXFxcXFxcXChldFNjcm9sbFRwKCkpJywgY3Vyc29yOiBbMCwgMjBdXG4gICAgICAgIGVuc3VyZSAndiBpICgnLCBzZWxlY3RlZFRleHQ6ICdldFNjcm9sbFRwKCknXG5cbiAgICAgIGl0IFwic2tpcCBlc2NhcGVkIHBhaXIgY2FzZS0yXCIsIC0+XG4gICAgICAgIHNldCB0ZXh0OiAnZXhwZWN0KGVkaXRvci5nZXRTY1xcXFwpcm9sbFRwKCkpJywgY3Vyc29yOiBbMCwgN11cbiAgICAgICAgZW5zdXJlICd2IGkgKCcsIHNlbGVjdGVkVGV4dDogJ2VkaXRvci5nZXRTY1xcXFwpcm9sbFRwKCknXG5cbiAgICAgIGl0IFwic2tpcCBlc2NhcGVkIHBhaXIgY2FzZS0zXCIsIC0+XG4gICAgICAgIHNldCB0ZXh0OiAnZXhwZWN0KGVkaXRvci5nZVxcXFwodFNjXFxcXClyb2xsVHAoKSknLCBjdXJzb3I6IFswLCA3XVxuICAgICAgICBlbnN1cmUgJ3YgaSAoJywgc2VsZWN0ZWRUZXh0OiAnZWRpdG9yLmdlXFxcXCh0U2NcXFxcKXJvbGxUcCgpJ1xuXG4gICAgICBpdCBcIndvcmtzIHdpdGggbXVsdGlwbGUgY3Vyc29yc1wiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIiggYSBiICkgY2RlICggZiBnIGggKSBpamtcIlxuICAgICAgICAgIGN1cnNvcjogW1swLCAyXSwgWzAsIDE4XV1cbiAgICAgICAgZW5zdXJlICd2IGkgKCcsXG4gICAgICAgICAgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1xuICAgICAgICAgICAgW1swLCAxXSwgIFswLCA2XV1cbiAgICAgICAgICAgIFtbMCwgMTNdLCBbMCwgMjBdXVxuICAgICAgICAgIF1cbiAgICAgIGRlc2NyaWJlIFwiY3Vyc29yIGlzIG9uIHRoZSBwYWlyIGNoYXJcIiwgLT5cbiAgICAgICAgY2hlY2sgPSBnZXRDaGVja0Z1bmN0aW9uRm9yKCdpICgnKVxuICAgICAgICB0ZXh0ID0gJy0oKyktJ1xuICAgICAgICB0ZXh0RmluYWwgPSAnLSgpLSdcbiAgICAgICAgc2VsZWN0ZWRUZXh0ID0gJysnXG4gICAgICAgIG9wZW4gPSBbMCwgMV1cbiAgICAgICAgY2xvc2UgPSBbMCwgM11cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCB7dGV4dH1cbiAgICAgICAgaXQgXCJjYXNlLTEgbm9ybWFsXCIsIC0+IGNoZWNrIG9wZW4sICdkJywgdGV4dDogdGV4dEZpbmFsLCBjdXJzb3I6IFswLCAyXVxuICAgICAgICBpdCBcImNhc2UtMiBub3JtYWxcIiwgLT4gY2hlY2sgY2xvc2UsICdkJywgdGV4dDogdGV4dEZpbmFsLCBjdXJzb3I6IFswLCAyXVxuICAgICAgICBpdCBcImNhc2UtMyB2aXN1YWxcIiwgLT4gY2hlY2sgb3BlbiwgJ3YnLCB7c2VsZWN0ZWRUZXh0fVxuICAgICAgICBpdCBcImNhc2UtNCB2aXN1YWxcIiwgLT4gY2hlY2sgY2xvc2UsICd2Jywge3NlbGVjdGVkVGV4dH1cblxuICAgIGRlc2NyaWJlIFwiYS1wYXJlbnRoZXNpc1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIiggc29tZXRoaW5nIGluIGhlcmUgYW5kIGluIChoZXJlKSApXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCA5XVxuXG4gICAgICBpdCBcImFwcGxpZXMgb3BlcmF0b3JzIGFyb3VuZCB0aGUgY3VycmVudCBwYXJlbnRoZXNlcyBpbiBvcGVyYXRvci1wZW5kaW5nIG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlICdkIGEgKCcsXG4gICAgICAgICAgdGV4dDogJydcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgIGl0IFwiYXBwbGllcyBvcGVyYXRvcnMgYXJvdW5kIHRoZSBjdXJyZW50IHBhcmVudGhlc2VzIGluIG9wZXJhdG9yLXBlbmRpbmcgbW9kZSAoc2Vjb25kIHRlc3QpXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAyOV1cbiAgICAgICAgZW5zdXJlICdkIGEgKCcsXG4gICAgICAgICAgdGV4dDogXCIoIHNvbWV0aGluZyBpbiBoZXJlIGFuZCBpbiAgKVwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMjddXG4gICAgICBkZXNjcmliZSBcImN1cnNvciBpcyBvbiB0aGUgcGFpciBjaGFyXCIsIC0+XG4gICAgICAgIGNoZWNrID0gZ2V0Q2hlY2tGdW5jdGlvbkZvcignYSAoJylcbiAgICAgICAgdGV4dCA9ICctKCspLSdcbiAgICAgICAgdGV4dEZpbmFsID0gJy0tJ1xuICAgICAgICBzZWxlY3RlZFRleHQgPSAnKCspJ1xuICAgICAgICBvcGVuID0gWzAsIDFdXG4gICAgICAgIGNsb3NlID0gWzAsIDNdXG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXQge3RleHR9XG4gICAgICAgIGl0IFwiY2FzZS0xIG5vcm1hbFwiLCAtPiBjaGVjayBvcGVuLCAnZCcsIHRleHQ6IHRleHRGaW5hbCwgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgaXQgXCJjYXNlLTIgbm9ybWFsXCIsIC0+IGNoZWNrIGNsb3NlLCAnZCcsIHRleHQ6IHRleHRGaW5hbCwgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgaXQgXCJjYXNlLTMgdmlzdWFsXCIsIC0+IGNoZWNrIG9wZW4sICd2Jywge3NlbGVjdGVkVGV4dH1cbiAgICAgICAgaXQgXCJjYXNlLTQgdmlzdWFsXCIsIC0+IGNoZWNrIGNsb3NlLCAndicsIHtzZWxlY3RlZFRleHR9XG5cbiAgZGVzY3JpYmUgXCJQYXJhZ3JhcGhcIiwgLT5cbiAgICB0ZXh0ID0gbnVsbFxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHRleHQgPSBuZXcgVGV4dERhdGEgXCJcIlwiXG5cbiAgICAgICAgMTogUC0xXG5cbiAgICAgICAgMzogUC0yXG4gICAgICAgIDQ6IFAtMlxuXG5cbiAgICAgICAgNzogUC0zXG4gICAgICAgIDg6IFAtM1xuICAgICAgICA5OiBQLTNcblxuXG4gICAgICAgIFwiXCJcIlxuICAgICAgc2V0XG4gICAgICAgIGN1cnNvcjogWzEsIDBdXG4gICAgICAgIHRleHQ6IHRleHQuZ2V0UmF3KClcblxuICAgIGRlc2NyaWJlIFwiaW5uZXItcGFyYWdyYXBoXCIsIC0+XG4gICAgICBpdCBcInNlbGVjdCBjb25zZXF1dGl2ZSBibGFuayByb3dzXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXTsgZW5zdXJlICd2IGkgcCcsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMF0pXG4gICAgICAgIHNldCBjdXJzb3I6IFsyLCAwXTsgZW5zdXJlICd2IGkgcCcsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMl0pXG4gICAgICAgIHNldCBjdXJzb3I6IFs1LCAwXTsgZW5zdXJlICd2IGkgcCcsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbNS4uNl0pXG4gICAgICBpdCBcInNlbGVjdCBjb25zZXF1dGl2ZSBub24tYmxhbmsgcm93c1wiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF07IGVuc3VyZSAndiBpIHAnLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzFdKVxuICAgICAgICBzZXQgY3Vyc29yOiBbMywgMF07IGVuc3VyZSAndiBpIHAnLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzMuLjRdKVxuICAgICAgICBzZXQgY3Vyc29yOiBbNywgMF07IGVuc3VyZSAndiBpIHAnLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzcuLjldKVxuICAgICAgaXQgXCJvcGVyYXRlIG9uIGlubmVyIHBhcmFncmFwaFwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbNywgMF1cbiAgICAgICAgZW5zdXJlICd5IGkgcCcsXG4gICAgICAgICAgY3Vyc29yOiBbNywgMF1cbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogdGV4dC5nZXRMaW5lcyhbNywgOCwgOV0pXG5cbiAgICBkZXNjcmliZSBcImEtcGFyYWdyYXBoXCIsIC0+XG4gICAgICBpdCBcInNlbGVjdCB0d28gcGFyYWdyYXBoIGFzIG9uZSBvcGVyYXRpb25cIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdOyBlbnN1cmUgJ3YgYSBwJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFswLCAxXSlcbiAgICAgICAgc2V0IGN1cnNvcjogWzIsIDBdOyBlbnN1cmUgJ3YgYSBwJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFsyLi40XSlcbiAgICAgICAgc2V0IGN1cnNvcjogWzUsIDBdOyBlbnN1cmUgJ3YgYSBwJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFs1Li45XSlcbiAgICAgIGl0IFwic2VsZWN0IHR3byBwYXJhZ3JhcGggYXMgb25lIG9wZXJhdGlvblwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF07IGVuc3VyZSAndiBhIHAnLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzEuLjJdKVxuICAgICAgICBzZXQgY3Vyc29yOiBbMywgMF07IGVuc3VyZSAndiBhIHAnLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzMuLjZdKVxuICAgICAgICBzZXQgY3Vyc29yOiBbNywgMF07IGVuc3VyZSAndiBhIHAnLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzcuLjEwXSlcbiAgICAgIGl0IFwib3BlcmF0ZSBvbiBhIHBhcmFncmFwaFwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMywgMF1cbiAgICAgICAgZW5zdXJlICd5IGEgcCcsXG4gICAgICAgICAgY3Vyc29yOiBbMywgMF1cbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogdGV4dC5nZXRMaW5lcyhbMy4uNl0pXG5cbiAgZGVzY3JpYmUgJ0NvbW1lbnQnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbGFuZ3VhZ2UtY29mZmVlLXNjcmlwdCcpXG4gICAgICBydW5zIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIGdyYW1tYXI6ICdzb3VyY2UuY29mZmVlJ1xuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICMjI1xuICAgICAgICAgIG11bHRpbGluZSBjb21tZW50XG4gICAgICAgICAgIyMjXG5cbiAgICAgICAgICAjIE9uZSBsaW5lIGNvbW1lbnRcblxuICAgICAgICAgICMgQ29tbWVudFxuICAgICAgICAgICMgYm9yZGVyXG4gICAgICAgICAgY2xhc3MgUXVpY2tTb3J0XG4gICAgICAgICAgXCJcIlwiXG4gICAgYWZ0ZXJFYWNoIC0+XG4gICAgICBhdG9tLnBhY2thZ2VzLmRlYWN0aXZhdGVQYWNrYWdlKCdsYW5ndWFnZS1jb2ZmZWUtc2NyaXB0JylcblxuICAgIGRlc2NyaWJlICdpbm5lci1jb21tZW50JywgLT5cbiAgICAgIGl0ICdzZWxlY3QgaW5uZXIgY29tbWVudCBibG9jaycsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ3YgaSAvJyxcbiAgICAgICAgICBzZWxlY3RlZFRleHQ6ICcjIyNcXG5tdWx0aWxpbmUgY29tbWVudFxcbiMjI1xcbidcbiAgICAgICAgICBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbWzAsIDBdLCBbMywgMF1dXG5cbiAgICAgIGl0ICdzZWxlY3Qgb25lIGxpbmUgY29tbWVudCcsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFs0LCAwXVxuICAgICAgICBlbnN1cmUgJ3YgaSAvJyxcbiAgICAgICAgICBzZWxlY3RlZFRleHQ6ICcjIE9uZSBsaW5lIGNvbW1lbnRcXG4nXG4gICAgICAgICAgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1s0LCAwXSwgWzUsIDBdXVxuXG4gICAgICBpdCAnbm90IHNlbGVjdCBub24tY29tbWVudCBsaW5lJywgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzYsIDBdXG4gICAgICAgIGVuc3VyZSAndiBpIC8nLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogJyMgQ29tbWVudFxcbiMgYm9yZGVyXFxuJ1xuICAgICAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IFtbNiwgMF0sIFs4LCAwXV1cblxuICBkZXNjcmliZSAnSW5kZW50YXRpb24nLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbGFuZ3VhZ2UtY29mZmVlLXNjcmlwdCcpXG4gICAgICBnZXRWaW1TdGF0ZSAnc2FtcGxlLmNvZmZlZScsICh2aW1TdGF0ZSwgdmltKSAtPlxuICAgICAgICB7ZWRpdG9yLCBlZGl0b3JFbGVtZW50fSA9IHZpbVN0YXRlXG4gICAgICAgIHtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlfSA9IHZpbVxuICAgIGFmdGVyRWFjaCAtPlxuICAgICAgYXRvbS5wYWNrYWdlcy5kZWFjdGl2YXRlUGFja2FnZSgnbGFuZ3VhZ2UtY29mZmVlLXNjcmlwdCcpXG5cbiAgICBkZXNjcmliZSAnaW5uZXItaW5kZW50YXRpb24nLCAtPlxuICAgICAgaXQgJ3NlbGVjdCBsaW5lcyB3aXRoIGRlZXBlciBpbmRlbnQtbGV2ZWwnLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMTIsIDBdXG4gICAgICAgIGVuc3VyZSAndiBpIGknLFxuICAgICAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IFtbMTIsIDBdLCBbMTUsIDBdXVxuICAgIGRlc2NyaWJlICdhLWluZGVudGF0aW9uJywgLT5cbiAgICAgIGl0ICd3b250IHN0b3Agb24gYmxhbmsgbGluZSB3aGVuIHNlbGVjdGluZyBpbmRlbnQnLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMTIsIDBdXG4gICAgICAgIGVuc3VyZSAndiBhIGknLFxuICAgICAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IFtbMTAsIDBdLCBbMjcsIDBdXVxuXG4gIGRlc2NyaWJlICdGb2xkJywgLT5cbiAgICByYW5nZUZvclJvd3MgPSAoc3RhcnRSb3csIGVuZFJvdykgLT5cbiAgICAgIFtbc3RhcnRSb3csIDBdLCBbZW5kUm93ICsgMSwgMF1dXG5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWNvZmZlZS1zY3JpcHQnKVxuICAgICAgZ2V0VmltU3RhdGUgJ3NhbXBsZS5jb2ZmZWUnLCAodmltU3RhdGUsIHZpbSkgLT5cbiAgICAgICAge2VkaXRvciwgZWRpdG9yRWxlbWVudH0gPSB2aW1TdGF0ZVxuICAgICAgICB7c2V0LCBlbnN1cmUsIGtleXN0cm9rZX0gPSB2aW1cbiAgICBhZnRlckVhY2ggLT5cbiAgICAgIGF0b20ucGFja2FnZXMuZGVhY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWNvZmZlZS1zY3JpcHQnKVxuXG4gICAgZGVzY3JpYmUgJ2lubmVyLWZvbGQnLCAtPlxuICAgICAgaXQgXCJzZWxlY3QgaW5uZXIgcmFuZ2Ugb2YgZm9sZFwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMTMsIDBdXG4gICAgICAgIGVuc3VyZSAndiBpIHonLCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiByYW5nZUZvclJvd3MoMTAsIDI1KVxuXG4gICAgICBpdCBcInNlbGVjdCBpbm5lciByYW5nZSBvZiBmb2xkXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsxOSwgMF1cbiAgICAgICAgZW5zdXJlICd2IGkgeicsIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IHJhbmdlRm9yUm93cygxOSwgMjMpXG5cbiAgICAgIGl0IFwiY2FuIGV4cGFuZCBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzIzLCAwXVxuICAgICAgICBrZXlzdHJva2UgJ3YnXG4gICAgICAgIGVuc3VyZSAnaSB6Jywgc2VsZWN0ZWRCdWZmZXJSYW5nZTogcmFuZ2VGb3JSb3dzKDIzLCAyMylcbiAgICAgICAgZW5zdXJlICdpIHonLCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiByYW5nZUZvclJvd3MoMTksIDIzKVxuICAgICAgICBlbnN1cmUgJ2kgeicsIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IHJhbmdlRm9yUm93cygxMCwgMjUpXG4gICAgICAgIGVuc3VyZSAnaSB6Jywgc2VsZWN0ZWRCdWZmZXJSYW5nZTogcmFuZ2VGb3JSb3dzKDksIDI4KVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gc3RhcnRSb3cgb2Ygc2VsZWN0aW9uIGlzIG9uIGZvbGQgc3RhcnRSb3dcIiwgLT5cbiAgICAgICAgaXQgJ3NlbGVjdCBvdXRlciBmb2xkKHNraXApJywgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMjAsIDddXG4gICAgICAgICAgZW5zdXJlICd2IGkgeicsIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IHJhbmdlRm9yUm93cygxOSwgMjMpXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBlbmRSb3cgb2Ygc2VsZWN0aW9uIGV4Y2VlZHMgZm9sZCBlbmRSb3dcIiwgLT5cbiAgICAgICAgaXQgXCJkb2Vzbid0IG1hdHRlciwgc2VsZWN0IGZvbGQgYmFzZWQgb24gc3RhcnRSb3cgb2Ygc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzIwLCAwXVxuICAgICAgICAgIGVuc3VyZSAnViBHJywgc2VsZWN0ZWRCdWZmZXJSYW5nZTogcmFuZ2VGb3JSb3dzKDIwLCAzMClcbiAgICAgICAgICBlbnN1cmUgJ2kgeicsIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IHJhbmdlRm9yUm93cygxOSwgMjMpXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBpbmRlbnQgbGV2ZWwgb2YgZm9sZCBzdGFydFJvdyBhbmQgZW5kUm93IGlzIHNhbWVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWphdmFzY3JpcHQnKVxuICAgICAgICAgIGdldFZpbVN0YXRlICdzYW1wbGUuanMnLCAoc3RhdGUsIHZpbUVkaXRvcikgLT5cbiAgICAgICAgICAgIHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9ID0gc3RhdGVcbiAgICAgICAgICAgIHtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlfSA9IHZpbUVkaXRvclxuICAgICAgICBhZnRlckVhY2ggLT5cbiAgICAgICAgICBhdG9tLnBhY2thZ2VzLmRlYWN0aXZhdGVQYWNrYWdlKCdsYW5ndWFnZS1qYXZhc2NyaXB0JylcblxuICAgICAgICBpdCBcImRvZXNuJ3Qgc2VsZWN0IGZvbGQgZW5kUm93XCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzUsIDBdXG4gICAgICAgICAgZW5zdXJlICd2IGkgeicsIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IHJhbmdlRm9yUm93cyg1LCA2KVxuICAgICAgICAgIGVuc3VyZSAnYSB6Jywgc2VsZWN0ZWRCdWZmZXJSYW5nZTogcmFuZ2VGb3JSb3dzKDQsIDcpXG5cbiAgICBkZXNjcmliZSAnYS1mb2xkJywgLT5cbiAgICAgIGl0ICdzZWxlY3QgZm9sZCByb3cgcmFuZ2UnLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMTMsIDBdXG4gICAgICAgIGVuc3VyZSAndiBhIHonLCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiByYW5nZUZvclJvd3MoOSwgMjUpXG5cbiAgICAgIGl0ICdzZWxlY3QgZm9sZCByb3cgcmFuZ2UnLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMTksIDBdXG4gICAgICAgIGVuc3VyZSAndiBhIHonLCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiByYW5nZUZvclJvd3MoMTgsIDIzKVxuXG4gICAgICBpdCAnY2FuIGV4cGFuZCBzZWxlY3Rpb24nLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMjMsIDBdXG4gICAgICAgIGtleXN0cm9rZSAndidcbiAgICAgICAgZW5zdXJlICdhIHonLCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiByYW5nZUZvclJvd3MoMjIsIDIzKVxuICAgICAgICBlbnN1cmUgJ2EgeicsIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IHJhbmdlRm9yUm93cygxOCwgMjMpXG4gICAgICAgIGVuc3VyZSAnYSB6Jywgc2VsZWN0ZWRCdWZmZXJSYW5nZTogcmFuZ2VGb3JSb3dzKDksIDI1KVxuICAgICAgICBlbnN1cmUgJ2EgeicsIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IHJhbmdlRm9yUm93cyg4LCAyOClcblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIHN0YXJ0Um93IG9mIHNlbGVjdGlvbiBpcyBvbiBmb2xkIHN0YXJ0Um93XCIsIC0+XG4gICAgICAgIGl0ICdzZWxlY3Qgb3V0ZXIgZm9sZChza2lwKScsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzIwLCA3XVxuICAgICAgICAgIGVuc3VyZSAndiBhIHonLCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiByYW5nZUZvclJvd3MoMTgsIDIzKVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gZW5kUm93IG9mIHNlbGVjdGlvbiBleGNlZWRzIGZvbGQgZW5kUm93XCIsIC0+XG4gICAgICAgIGl0IFwiZG9lc24ndCBtYXR0ZXIsIHNlbGVjdCBmb2xkIGJhc2VkIG9uIHN0YXJ0Um93IG9mIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsyMCwgMF1cbiAgICAgICAgICBlbnN1cmUgJ1YgRycsIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IHJhbmdlRm9yUm93cygyMCwgMzApXG4gICAgICAgICAgZW5zdXJlICdhIHonLCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiByYW5nZUZvclJvd3MoMTgsIDIzKVxuXG4gICMgQWx0aG91Z2ggZm9sbG93aW5nIHRlc3QgcGlja3Mgc3BlY2lmaWMgbGFuZ3VhZ2UsIG90aGVyIGxhbmdhdWFnZXMgYXJlIGFsc29lIHN1cHBvcnRlZC5cbiAgZGVzY3JpYmUgJ0Z1bmN0aW9uJywgLT5cbiAgICBkZXNjcmliZSAnY29mZmVlJywgLT5cbiAgICAgIHBhY2sgPSAnbGFuZ3VhZ2UtY29mZmVlLXNjcmlwdCdcbiAgICAgIHNjb3BlID0gJ3NvdXJjZS5jb2ZmZWUnXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKHBhY2spXG5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAjIENvbW1tZW50XG5cbiAgICAgICAgICAgIGhlbGxvID0gLT5cbiAgICAgICAgICAgICAgYSA9IDFcbiAgICAgICAgICAgICAgYiA9IDJcbiAgICAgICAgICAgICAgYyA9IDNcblxuICAgICAgICAgICAgIyBDb21tbWVudFxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMywgMF1cblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgZ3JhbW1hciA9IGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZShzY29wZSlcbiAgICAgICAgICBlZGl0b3Iuc2V0R3JhbW1hcihncmFtbWFyKVxuICAgICAgYWZ0ZXJFYWNoIC0+XG4gICAgICAgIGF0b20ucGFja2FnZXMuZGVhY3RpdmF0ZVBhY2thZ2UocGFjaylcblxuICAgICAgZGVzY3JpYmUgJ2lubmVyLWZ1bmN0aW9uIGZvciBjb2ZmZWUnLCAtPlxuICAgICAgICBpdCAnc2VsZWN0IGV4Y2VwdCBzdGFydCByb3cnLCAtPlxuICAgICAgICAgIGVuc3VyZSAndiBpIGYnLCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbWzMsIDBdLCBbNiwgMF1dXG5cbiAgICAgIGRlc2NyaWJlICdhLWZ1bmN0aW9uIGZvciBjb2ZmZWUnLCAtPlxuICAgICAgICBpdCAnc2VsZWN0IGZ1bmN0aW9uJywgLT5cbiAgICAgICAgICBlbnN1cmUgJ3YgYSBmJywgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1syLCAwXSwgWzYsIDBdXVxuXG4gICAgZGVzY3JpYmUgJ3J1YnknLCAtPlxuICAgICAgcGFjayA9ICdsYW5ndWFnZS1ydWJ5J1xuICAgICAgc2NvcGUgPSAnc291cmNlLnJ1YnknXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKHBhY2spXG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgIyBDb21tbWVudFxuXG4gICAgICAgICAgICBkZWYgaGVsbG9cbiAgICAgICAgICAgICAgYSA9IDFcbiAgICAgICAgICAgICAgYiA9IDJcbiAgICAgICAgICAgICAgYyA9IDNcbiAgICAgICAgICAgIGVuZFxuXG4gICAgICAgICAgICAjIENvbW1tZW50XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFszLCAwXVxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgZ3JhbW1hciA9IGF0b20uZ3JhbW1hcnMuZ3JhbW1hckZvclNjb3BlTmFtZShzY29wZSlcbiAgICAgICAgICBlZGl0b3Iuc2V0R3JhbW1hcihncmFtbWFyKVxuICAgICAgYWZ0ZXJFYWNoIC0+XG4gICAgICAgIGF0b20ucGFja2FnZXMuZGVhY3RpdmF0ZVBhY2thZ2UocGFjaylcblxuICAgICAgZGVzY3JpYmUgJ2lubmVyLWZ1bmN0aW9uIGZvciBydWJ5JywgLT5cbiAgICAgICAgaXQgJ3NlbGVjdCBleGNlcHQgc3RhcnQgcm93JywgLT5cbiAgICAgICAgICBlbnN1cmUgJ3YgaSBmJywgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1szLCAwXSwgWzYsIDBdXVxuICAgICAgZGVzY3JpYmUgJ2EtZnVuY3Rpb24gZm9yIHJ1YnknLCAtPlxuICAgICAgICBpdCAnc2VsZWN0IGZ1bmN0aW9uJywgLT5cbiAgICAgICAgICBlbnN1cmUgJ3YgYSBmJywgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1syLCAwXSwgWzcsIDBdXVxuXG4gICAgZGVzY3JpYmUgJ2dvJywgLT5cbiAgICAgIHBhY2sgPSAnbGFuZ3VhZ2UtZ28nXG4gICAgICBzY29wZSA9ICdzb3VyY2UuZ28nXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKHBhY2spXG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgLy8gQ29tbW1lbnRcblxuICAgICAgICAgICAgZnVuYyBtYWluKCkge1xuICAgICAgICAgICAgICBhIDo9IDFcbiAgICAgICAgICAgICAgYiA6PSAyXG4gICAgICAgICAgICAgIGMgOj0gM1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDb21tbWVudFxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMywgMF1cbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIGdyYW1tYXIgPSBhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoc2NvcGUpXG4gICAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIoZ3JhbW1hcilcbiAgICAgIGFmdGVyRWFjaCAtPlxuICAgICAgICBhdG9tLnBhY2thZ2VzLmRlYWN0aXZhdGVQYWNrYWdlKHBhY2spXG5cbiAgICAgIGRlc2NyaWJlICdpbm5lci1mdW5jdGlvbiBmb3IgZ28nLCAtPlxuICAgICAgICBpdCAnc2VsZWN0IGV4Y2VwdCBzdGFydCByb3cnLCAtPlxuICAgICAgICAgIGVuc3VyZSAndiBpIGYnLCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbWzMsIDBdLCBbNiwgMF1dXG5cbiAgICAgIGRlc2NyaWJlICdhLWZ1bmN0aW9uIGZvciBnbycsIC0+XG4gICAgICAgIGl0ICdzZWxlY3QgZnVuY3Rpb24nLCAtPlxuICAgICAgICAgIGVuc3VyZSAndiBhIGYnLCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbWzIsIDBdLCBbNywgMF1dXG5cbiAgZGVzY3JpYmUgJ0N1cnJlbnRMaW5lJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgVGhpcyBpc1xuICAgICAgICAgICAgbXVsdGkgbGluZVxuICAgICAgICAgIHRleHRcbiAgICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlICdpbm5lci1jdXJyZW50LWxpbmUnLCAtPlxuICAgICAgaXQgJ3NlbGVjdCBjdXJyZW50IGxpbmUgd2l0aG91dCBpbmNsdWRpbmcgbGFzdCBuZXdsaW5lJywgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAndiBpIGwnLCBzZWxlY3RlZFRleHQ6ICdUaGlzIGlzJ1xuICAgICAgaXQgJ2Fsc28gc2tpcCBsZWFkaW5nIHdoaXRlIHNwYWNlJywgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzEsIDBdXG4gICAgICAgIGVuc3VyZSAndiBpIGwnLCBzZWxlY3RlZFRleHQ6ICdtdWx0aSBsaW5lJ1xuICAgIGRlc2NyaWJlICdhLWN1cnJlbnQtbGluZScsIC0+XG4gICAgICBpdCAnc2VsZWN0IGN1cnJlbnQgbGluZSB3aXRob3V0IGluY2x1ZGluZyBsYXN0IG5ld2xpbmUgYXMgbGlrZSBgdmlsYCcsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ3YgYSBsJywgc2VsZWN0ZWRUZXh0OiAnVGhpcyBpcydcbiAgICAgIGl0ICd3b250IHNraXAgbGVhZGluZyB3aGl0ZSBzcGFjZSBub3QgbGlrZSBgdmlsYCcsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBlbnN1cmUgJ3YgYSBsJywgc2VsZWN0ZWRUZXh0OiAnICBtdWx0aSBsaW5lJ1xuXG4gIGRlc2NyaWJlICdFbnRpcmUnLCAtPlxuICAgIHRleHQgPSBcIlwiXCJcbiAgICAgIFRoaXMgaXNcbiAgICAgICAgbXVsdGkgbGluZVxuICAgICAgdGV4dFxuICAgICAgXCJcIlwiXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0IHRleHQ6IHRleHQsIGN1cnNvcjogWzAsIDBdXG4gICAgZGVzY3JpYmUgJ2lubmVyLWVudGlyZScsIC0+XG4gICAgICBpdCAnc2VsZWN0IGVudGlyZSBidWZmZXInLCAtPlxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIHNlbGVjdGVkVGV4dDogJydcbiAgICAgICAgZW5zdXJlICd2IGkgZScsIHNlbGVjdGVkVGV4dDogdGV4dFxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIHNlbGVjdGVkVGV4dDogJydcbiAgICAgICAgZW5zdXJlICdqIGogdiBpIGUnLCBzZWxlY3RlZFRleHQ6IHRleHRcbiAgICBkZXNjcmliZSAnYS1lbnRpcmUnLCAtPlxuICAgICAgaXQgJ3NlbGVjdCBlbnRpcmUgYnVmZmVyJywgLT5cbiAgICAgICAgZW5zdXJlICdlc2NhcGUnLCBzZWxlY3RlZFRleHQ6ICcnXG4gICAgICAgIGVuc3VyZSAndiBhIGUnLCBzZWxlY3RlZFRleHQ6IHRleHRcbiAgICAgICAgZW5zdXJlICdlc2NhcGUnLCBzZWxlY3RlZFRleHQ6ICcnXG4gICAgICAgIGVuc3VyZSAnaiBqIHYgYSBlJywgc2VsZWN0ZWRUZXh0OiB0ZXh0XG5cbiAgZGVzY3JpYmUgJ1NlYXJjaE1hdGNoRm9yd2FyZCwgU2VhcmNoQmFja3dhcmRzJywgLT5cbiAgICB0ZXh0ID0gXCJcIlwiXG4gICAgICAwIHh4eFxuICAgICAgMSBhYmMgeHh4XG4gICAgICAyICAgeHh4IHl5eVxuICAgICAgMyB4eHggYWJjXG4gICAgICA0IGFiY1xcblxuICAgICAgXCJcIlwiXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0IHRleHQ6IHRleHQsIGN1cnNvcjogWzAsIDBdXG4gICAgICBlbnN1cmUgWycvJywgc2VhcmNoOiAnYWJjJ10sIGN1cnNvcjogWzEsIDJdLCBtb2RlOiAnbm9ybWFsJ1xuICAgICAgZXhwZWN0KHZpbVN0YXRlLmdsb2JhbFN0YXRlLmdldCgnbGFzdFNlYXJjaFBhdHRlcm4nKSkudG9FcXVhbCAvYWJjL2dcblxuICAgIGRlc2NyaWJlICdnbiBmcm9tIG5vcm1hbCBtb2RlJywgLT5cbiAgICAgIGl0ICdzZWxlY3QgcmFuZ2VzIG1hdGNoZXMgdG8gbGFzdCBzZWFyY2ggcGF0dGVybiBhbmQgZXh0ZW5kIHNlbGVjdGlvbicsIC0+XG4gICAgICAgIGVuc3VyZSAnZyBuJyxcbiAgICAgICAgICBjdXJzb3I6IFsxLCA1XVxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgICAgIHNlbGVjdGlvbklzUmV2ZXJzZWQ6IGZhbHNlXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0OiAnYWJjJ1xuICAgICAgICBlbnN1cmUgJ2cgbicsXG4gICAgICAgICAgc2VsZWN0aW9uSXNSZXZlcnNlZDogZmFsc2VcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZFRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgYWJjIHh4eFxuICAgICAgICAgICAgMiAgIHh4eCB5eXlcbiAgICAgICAgICAgIDMgeHh4IGFiY1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIGVuc3VyZSAnZyBuJyxcbiAgICAgICAgICBzZWxlY3Rpb25Jc1JldmVyc2VkOiBmYWxzZVxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogXCJcIlwiXG4gICAgICAgICAgICBhYmMgeHh4XG4gICAgICAgICAgICAyICAgeHh4IHl5eVxuICAgICAgICAgICAgMyB4eHggYWJjXG4gICAgICAgICAgICA0IGFiY1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIGVuc3VyZSAnZyBuJywgIyBEbyBub3RoaW5nXG4gICAgICAgICAgc2VsZWN0aW9uSXNSZXZlcnNlZDogZmFsc2VcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZFRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgYWJjIHh4eFxuICAgICAgICAgICAgMiAgIHh4eCB5eXlcbiAgICAgICAgICAgIDMgeHh4IGFiY1xuICAgICAgICAgICAgNCBhYmNcbiAgICAgICAgICAgIFwiXCJcIlxuICAgIGRlc2NyaWJlICdnTiBmcm9tIG5vcm1hbCBtb2RlJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzQsIDNdXG4gICAgICBpdCAnc2VsZWN0IHJhbmdlcyBtYXRjaGVzIHRvIGxhc3Qgc2VhcmNoIHBhdHRlcm4gYW5kIGV4dGVuZCBzZWxlY3Rpb24nLCAtPlxuICAgICAgICBlbnN1cmUgJ2cgTicsXG4gICAgICAgICAgY3Vyc29yOiBbNCwgMl1cbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgICAgICBzZWxlY3Rpb25Jc1JldmVyc2VkOiB0cnVlXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0OiAnYWJjJ1xuICAgICAgICBlbnN1cmUgJ2cgTicsXG4gICAgICAgICAgc2VsZWN0aW9uSXNSZXZlcnNlZDogdHJ1ZVxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogXCJcIlwiXG4gICAgICAgICAgICBhYmNcbiAgICAgICAgICAgIDQgYWJjXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZW5zdXJlICdnIE4nLFxuICAgICAgICAgIHNlbGVjdGlvbklzUmV2ZXJzZWQ6IHRydWVcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZFRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgYWJjIHh4eFxuICAgICAgICAgICAgMiAgIHh4eCB5eXlcbiAgICAgICAgICAgIDMgeHh4IGFiY1xuICAgICAgICAgICAgNCBhYmNcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbnN1cmUgJ2cgTicsICMgRG8gbm90aGluZ1xuICAgICAgICAgIHNlbGVjdGlvbklzUmV2ZXJzZWQ6IHRydWVcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZFRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgYWJjIHh4eFxuICAgICAgICAgICAgMiAgIHh4eCB5eXlcbiAgICAgICAgICAgIDMgeHh4IGFiY1xuICAgICAgICAgICAgNCBhYmNcbiAgICAgICAgICAgIFwiXCJcIlxuICAgIGRlc2NyaWJlICdhcyBvcGVyYXRvciB0YXJnZXQnLCAtPlxuICAgICAgaXQgJ2RlbGV0ZSBuZXh0IG9jY3VycmVuY2Ugb2YgbGFzdCBzZWFyY2ggcGF0dGVybicsIC0+XG4gICAgICAgIGVuc3VyZSAnZCBnIG4nLFxuICAgICAgICAgIGN1cnNvcjogWzEsIDJdXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDAgeHh4XG4gICAgICAgICAgICAxICB4eHhcbiAgICAgICAgICAgIDIgICB4eHggeXl5XG4gICAgICAgICAgICAzIHh4eCBhYmNcbiAgICAgICAgICAgIDQgYWJjXFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZW5zdXJlICcuJyxcbiAgICAgICAgICBjdXJzb3I6IFszLCA1XVxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgdGV4dF86IFwiXCJcIlxuICAgICAgICAgICAgMCB4eHhcbiAgICAgICAgICAgIDEgIHh4eFxuICAgICAgICAgICAgMiAgIHh4eCB5eXlcbiAgICAgICAgICAgIDMgeHh4X1xuICAgICAgICAgICAgNCBhYmNcXG5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbnN1cmUgJy4nLFxuICAgICAgICAgIGN1cnNvcjogWzQsIDFdXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICB0ZXh0XzogXCJcIlwiXG4gICAgICAgICAgICAwIHh4eFxuICAgICAgICAgICAgMSAgeHh4XG4gICAgICAgICAgICAyICAgeHh4IHl5eVxuICAgICAgICAgICAgMyB4eHhfXG4gICAgICAgICAgICA0IFxcblxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICBpdCAnY2hhbmdlIG5leHQgb2NjdXJyZW5jZSBvZiBsYXN0IHNlYXJjaCBwYXR0ZXJuJywgLT5cbiAgICAgICAgZW5zdXJlICdjIGcgbicsXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgICBtb2RlOiAnaW5zZXJ0J1xuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMCB4eHhcbiAgICAgICAgICAgIDEgIHh4eFxuICAgICAgICAgICAgMiAgIHh4eCB5eXlcbiAgICAgICAgICAgIDMgeHh4IGFiY1xuICAgICAgICAgICAgNCBhYmNcXG5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBrZXlzdHJva2UgJ2VzY2FwZSdcbiAgICAgICAgc2V0IGN1cnNvcjogWzQsIDBdXG4gICAgICAgIGVuc3VyZSAnYyBnIE4nLFxuICAgICAgICAgIGN1cnNvcjogWzMsIDZdXG4gICAgICAgICAgbW9kZTogJ2luc2VydCdcbiAgICAgICAgICB0ZXh0XzogXCJcIlwiXG4gICAgICAgICAgICAwIHh4eFxuICAgICAgICAgICAgMSAgeHh4XG4gICAgICAgICAgICAyICAgeHh4IHl5eVxuICAgICAgICAgICAgMyB4eHhfXG4gICAgICAgICAgICA0IGFiY1xcblxuICAgICAgICAgICAgXCJcIlwiXG4iXX0=
