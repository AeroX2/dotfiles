(function() {
  var AAngleBracket, AAngleBracketAllowForwarding, AAnyPair, AAnyPairAllowForwarding, AAnyQuote, ABackTick, AComment, ACurlyBracket, ACurlyBracketAllowForwarding, ACurrentLine, ACurrentSelectionAndAPersistentSelection, ADoubleQuote, AEdge, AEntire, AFold, AFunction, AFunctionOrInnerParagraph, AIndentation, ALatestChange, AParagraph, AParenthesis, AParenthesisAllowForwarding, APersistentSelection, ASingleQuote, ASmartWord, ASquareBracket, ASquareBracketAllowForwarding, ATag, AVisibleArea, AWholeWord, AWord, All, AngleBracket, AnyPair, AnyPairAllowForwarding, AnyQuote, BackTick, Base, Comment, CurlyBracket, CurrentLine, DoubleQuote, Edge, Empty, Entire, Fold, Function, Indentation, InnerAngleBracket, InnerAngleBracketAllowForwarding, InnerAnyPair, InnerAnyPairAllowForwarding, InnerAnyQuote, InnerBackTick, InnerComment, InnerCurlyBracket, InnerCurlyBracketAllowForwarding, InnerCurrentLine, InnerDoubleQuote, InnerEdge, InnerEntire, InnerFold, InnerFunction, InnerIndentation, InnerLatestChange, InnerParagraph, InnerParenthesis, InnerParenthesisAllowForwarding, InnerPersistentSelection, InnerSingleQuote, InnerSmartWord, InnerSquareBracket, InnerSquareBracketAllowForwarding, InnerTag, InnerVisibleArea, InnerWholeWord, InnerWord, LatestChange, Pair, Paragraph, Parenthesis, PersistentSelection, Point, PreviousSelection, Quote, Range, SearchMatchBackward, SearchMatchForward, SingleQuote, SmartWord, SquareBracket, Tag, TextObject, TextObjectFirstFound, UnionTextObject, VisibleArea, WholeWord, Word, _, countChar, getBufferRangeForRowRange, getBufferRows, getCodeFoldRowRangesContainesForRow, getEndPositionForPattern, getIndentLevelForBufferRow, getRangeByTranslatePointAndClip, getStartPositionForPattern, getTextToPoint, getValidVimBufferRow, getVisibleBufferRange, isIncludeFunctionScopeForRow, pointIsAtEndOfLine, ref, ref1, sortRanges, sortRangesByEndPosition, swrap, tagPattern, translatePointAndClip, trimRange,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Range = ref.Range, Point = ref.Point;

  _ = require('underscore-plus');

  Base = require('./base');

  swrap = require('./selection-wrapper');

  ref1 = require('./utils'), sortRanges = ref1.sortRanges, sortRangesByEndPosition = ref1.sortRangesByEndPosition, countChar = ref1.countChar, pointIsAtEndOfLine = ref1.pointIsAtEndOfLine, getTextToPoint = ref1.getTextToPoint, getIndentLevelForBufferRow = ref1.getIndentLevelForBufferRow, getCodeFoldRowRangesContainesForRow = ref1.getCodeFoldRowRangesContainesForRow, getBufferRangeForRowRange = ref1.getBufferRangeForRowRange, isIncludeFunctionScopeForRow = ref1.isIncludeFunctionScopeForRow, getStartPositionForPattern = ref1.getStartPositionForPattern, getEndPositionForPattern = ref1.getEndPositionForPattern, getVisibleBufferRange = ref1.getVisibleBufferRange, translatePointAndClip = ref1.translatePointAndClip, getRangeByTranslatePointAndClip = ref1.getRangeByTranslatePointAndClip, getBufferRows = ref1.getBufferRows, getValidVimBufferRow = ref1.getValidVimBufferRow, getStartPositionForPattern = ref1.getStartPositionForPattern, trimRange = ref1.trimRange;

  TextObject = (function(superClass) {
    extend(TextObject, superClass);

    TextObject.extend(false);

    TextObject.prototype.allowSubmodeChange = true;

    function TextObject() {
      this.constructor.prototype.inner = this.getName().startsWith('Inner');
      TextObject.__super__.constructor.apply(this, arguments);
      this.initialize();
    }

    TextObject.prototype.isInner = function() {
      return this.inner;
    };

    TextObject.prototype.isA = function() {
      return !this.isInner();
    };

    TextObject.prototype.isAllowSubmodeChange = function() {
      return this.allowSubmodeChange;
    };

    TextObject.prototype.isLinewise = function() {
      if (this.isAllowSubmodeChange()) {
        return swrap.detectVisualModeSubmode(this.editor) === 'linewise';
      } else {
        return this.isMode('visual', 'linewise');
      }
    };

    TextObject.prototype.stopSelection = function() {
      return this.canSelect = false;
    };

    TextObject.prototype.getNormalizedHeadBufferPosition = function(selection) {
      var head;
      head = selection.getHeadBufferPosition();
      if (this.isMode('visual') && !selection.isReversed()) {
        head = translatePointAndClip(this.editor, head, 'backward');
      }
      return head;
    };

    TextObject.prototype.getNormalizedHeadScreenPosition = function(selection) {
      var bufferPosition;
      bufferPosition = this.getNormalizedHeadBufferPosition(selection);
      return this.editor.screenPositionForBufferPosition(bufferPosition);
    };

    TextObject.prototype.select = function() {
      this.canSelect = true;
      this.countTimes((function(_this) {
        return function() {
          var j, len, ref2, results, selection;
          ref2 = _this.editor.getSelections();
          results = [];
          for (j = 0, len = ref2.length; j < len; j++) {
            selection = ref2[j];
            if (_this.canSelect) {
              results.push(_this.selectTextObject(selection));
            }
          }
          return results;
        };
      })(this));
      this.editor.mergeIntersectingSelections();
      if (this.isMode('visual')) {
        return this.updateSelectionProperties();
      }
    };

    TextObject.prototype.selectTextObject = function(selection) {
      var range;
      range = this.getRange(selection);
      return swrap(selection).setBufferRangeSafely(range);
    };

    TextObject.prototype.getRange = function() {};

    return TextObject;

  })(Base);

  Word = (function(superClass) {
    extend(Word, superClass);

    function Word() {
      return Word.__super__.constructor.apply(this, arguments);
    }

    Word.extend(false);

    Word.prototype.getRange = function(selection) {
      var kind, point, range, ref2;
      point = this.getNormalizedHeadBufferPosition(selection);
      ref2 = this.getWordBufferRangeAndKindAtBufferPosition(point, {
        wordRegex: this.wordRegex
      }), range = ref2.range, kind = ref2.kind;
      if (this.isA() && kind === 'word') {
        range = this.expandRangeToWhiteSpaces(range);
      }
      return range;
    };

    Word.prototype.expandRangeToWhiteSpaces = function(range) {
      var newEnd, newStart;
      if (newEnd = getEndPositionForPattern(this.editor, range.end, /\s+/, {
        containedOnly: true
      })) {
        return new Range(range.start, newEnd);
      }
      if (newStart = getStartPositionForPattern(this.editor, range.start, /\s+/, {
        containedOnly: true
      })) {
        if (newStart.column !== 0) {
          return new Range(newStart, range.end);
        }
      }
      return range;
    };

    return Word;

  })(TextObject);

  AWord = (function(superClass) {
    extend(AWord, superClass);

    function AWord() {
      return AWord.__super__.constructor.apply(this, arguments);
    }

    AWord.extend();

    return AWord;

  })(Word);

  InnerWord = (function(superClass) {
    extend(InnerWord, superClass);

    function InnerWord() {
      return InnerWord.__super__.constructor.apply(this, arguments);
    }

    InnerWord.extend();

    return InnerWord;

  })(Word);

  WholeWord = (function(superClass) {
    extend(WholeWord, superClass);

    function WholeWord() {
      return WholeWord.__super__.constructor.apply(this, arguments);
    }

    WholeWord.extend(false);

    WholeWord.prototype.wordRegex = /\S+/;

    return WholeWord;

  })(Word);

  AWholeWord = (function(superClass) {
    extend(AWholeWord, superClass);

    function AWholeWord() {
      return AWholeWord.__super__.constructor.apply(this, arguments);
    }

    AWholeWord.extend();

    return AWholeWord;

  })(WholeWord);

  InnerWholeWord = (function(superClass) {
    extend(InnerWholeWord, superClass);

    function InnerWholeWord() {
      return InnerWholeWord.__super__.constructor.apply(this, arguments);
    }

    InnerWholeWord.extend();

    return InnerWholeWord;

  })(WholeWord);

  SmartWord = (function(superClass) {
    extend(SmartWord, superClass);

    function SmartWord() {
      return SmartWord.__super__.constructor.apply(this, arguments);
    }

    SmartWord.extend(false);

    SmartWord.prototype.wordRegex = /[\w-]+/;

    return SmartWord;

  })(Word);

  ASmartWord = (function(superClass) {
    extend(ASmartWord, superClass);

    function ASmartWord() {
      return ASmartWord.__super__.constructor.apply(this, arguments);
    }

    ASmartWord.description = "A word that consists of alphanumeric chars(`/[A-Za-z0-9_]/`) and hyphen `-`";

    ASmartWord.extend();

    return ASmartWord;

  })(SmartWord);

  InnerSmartWord = (function(superClass) {
    extend(InnerSmartWord, superClass);

    function InnerSmartWord() {
      return InnerSmartWord.__super__.constructor.apply(this, arguments);
    }

    InnerSmartWord.description = "Currently No diff from `a-smart-word`";

    InnerSmartWord.extend();

    return InnerSmartWord;

  })(SmartWord);

  Pair = (function(superClass) {
    var backSlashPattern;

    extend(Pair, superClass);

    function Pair() {
      return Pair.__super__.constructor.apply(this, arguments);
    }

    Pair.extend(false);

    Pair.prototype.allowNextLine = false;

    Pair.prototype.allowSubmodeChange = false;

    Pair.prototype.adjustInnerRange = true;

    Pair.prototype.pair = null;

    Pair.prototype.getPattern = function() {
      var close, open, ref2;
      ref2 = this.pair, open = ref2[0], close = ref2[1];
      if (open === close) {
        return new RegExp("(" + (_.escapeRegExp(open)) + ")", 'g');
      } else {
        return new RegExp("(" + (_.escapeRegExp(open)) + ")|(" + (_.escapeRegExp(close)) + ")", 'g');
      }
    };

    Pair.prototype.getPairState = function(arg) {
      var match, matchText, range;
      matchText = arg.matchText, range = arg.range, match = arg.match;
      switch (match.length) {
        case 2:
          return this.pairStateInBufferRange(range, matchText);
        case 3:
          switch (false) {
            case !match[1]:
              return 'open';
            case !match[2]:
              return 'close';
          }
      }
    };

    backSlashPattern = _.escapeRegExp('\\');

    Pair.prototype.pairStateInBufferRange = function(range, char) {
      var bs, escapedChar, pattern, patterns, text;
      text = getTextToPoint(this.editor, range.end);
      escapedChar = _.escapeRegExp(char);
      bs = backSlashPattern;
      patterns = ["" + bs + bs + escapedChar, "[^" + bs + "]?" + escapedChar];
      pattern = new RegExp(patterns.join('|'));
      return ['close', 'open'][countChar(text, pattern) % 2];
    };

    Pair.prototype.isEscapedCharAtPoint = function(point) {
      var bs, found, pattern, scanRange;
      found = false;
      bs = backSlashPattern;
      pattern = new RegExp("[^" + bs + "]" + bs);
      scanRange = [[point.row, 0], point];
      this.editor.backwardsScanInBufferRange(pattern, scanRange, function(arg) {
        var matchText, range, stop;
        matchText = arg.matchText, range = arg.range, stop = arg.stop;
        if (range.end.isEqual(point)) {
          stop();
          return found = true;
        }
      });
      return found;
    };

    Pair.prototype.findPair = function(which, options, fn) {
      var from, pattern, scanFunc, scanRange;
      from = options.from, pattern = options.pattern, scanFunc = options.scanFunc, scanRange = options.scanRange;
      return this.editor[scanFunc](pattern, scanRange, (function(_this) {
        return function(event) {
          var matchText, range, stop;
          matchText = event.matchText, range = event.range, stop = event.stop;
          if (!(_this.allowNextLine || (from.row === range.start.row))) {
            return stop();
          }
          if (_this.isEscapedCharAtPoint(range.start)) {
            return;
          }
          return fn(event);
        };
      })(this));
    };

    Pair.prototype.findOpen = function(from, pattern) {
      var found, scanFunc, scanRange, stack;
      scanFunc = 'backwardsScanInBufferRange';
      scanRange = new Range([0, 0], from);
      stack = [];
      found = null;
      this.findPair('open', {
        from: from,
        pattern: pattern,
        scanFunc: scanFunc,
        scanRange: scanRange
      }, (function(_this) {
        return function(event) {
          var matchText, pairState, range, stop;
          matchText = event.matchText, range = event.range, stop = event.stop;
          pairState = _this.getPairState(event);
          if (pairState === 'close') {
            stack.push({
              pairState: pairState,
              matchText: matchText,
              range: range
            });
          } else {
            stack.pop();
            if (stack.length === 0) {
              found = range;
            }
          }
          if (found != null) {
            return stop();
          }
        };
      })(this));
      return found;
    };

    Pair.prototype.findClose = function(from, pattern) {
      var found, scanFunc, scanRange, stack;
      scanFunc = 'scanInBufferRange';
      scanRange = new Range(from, this.editor.buffer.getEndPosition());
      stack = [];
      found = null;
      this.findPair('close', {
        from: from,
        pattern: pattern,
        scanFunc: scanFunc,
        scanRange: scanRange
      }, (function(_this) {
        return function(event) {
          var entry, openStart, pairState, range, stop;
          range = event.range, stop = event.stop;
          pairState = _this.getPairState(event);
          if (pairState === 'open') {
            stack.push({
              pairState: pairState,
              range: range
            });
          } else {
            entry = stack.pop();
            if (stack.length === 0) {
              if ((openStart = entry != null ? entry.range.start : void 0)) {
                if (_this.allowForwarding) {
                  if (openStart.row > from.row) {
                    return;
                  }
                } else {
                  if (openStart.isGreaterThan(from)) {
                    return;
                  }
                }
              }
              found = range;
            }
          }
          if (found != null) {
            return stop();
          }
        };
      })(this));
      return found;
    };

    Pair.prototype.getPairInfo = function(from) {
      var aRange, closeRange, innerEnd, innerRange, innerStart, openRange, pairInfo, pattern, ref2, targetRange;
      pairInfo = null;
      pattern = this.getPattern();
      closeRange = this.findClose(from, pattern);
      if (closeRange != null) {
        openRange = this.findOpen(closeRange.end, pattern);
      }
      if (!((openRange != null) && (closeRange != null))) {
        return null;
      }
      aRange = new Range(openRange.start, closeRange.end);
      ref2 = [openRange.end, closeRange.start], innerStart = ref2[0], innerEnd = ref2[1];
      if (this.adjustInnerRange) {
        if (pointIsAtEndOfLine(this.editor, innerStart)) {
          innerStart = new Point(innerStart.row + 1, 0);
        }
        if (getTextToPoint(this.editor, innerEnd).match(/^\s*$/)) {
          innerEnd = new Point(innerEnd.row, 0);
        }
        if ((innerEnd.column === 0) && (innerStart.column !== 0)) {
          innerEnd = new Point(innerEnd.row - 1, 2e308);
        }
      }
      innerRange = new Range(innerStart, innerEnd);
      targetRange = this.isInner() ? innerRange : aRange;
      if (this.skipEmptyPair && innerRange.isEmpty()) {
        return this.getPairInfo(aRange.end);
      } else {
        return {
          openRange: openRange,
          closeRange: closeRange,
          aRange: aRange,
          innerRange: innerRange,
          targetRange: targetRange
        };
      }
    };

    Pair.prototype.getPointToSearchFrom = function(selection, searchFrom) {
      switch (searchFrom) {
        case 'head':
          return this.getNormalizedHeadBufferPosition(selection);
        case 'start':
          return swrap(selection).getBufferPositionFor('start');
      }
    };

    Pair.prototype.getRange = function(selection, options) {
      var allowForwarding, originalRange, pairInfo, searchFrom;
      if (options == null) {
        options = {};
      }
      allowForwarding = options.allowForwarding, searchFrom = options.searchFrom;
      if (searchFrom == null) {
        searchFrom = 'head';
      }
      if (allowForwarding != null) {
        this.allowForwarding = allowForwarding;
      }
      originalRange = selection.getBufferRange();
      pairInfo = this.getPairInfo(this.getPointToSearchFrom(selection, searchFrom));
      if (pairInfo != null ? pairInfo.targetRange.isEqual(originalRange) : void 0) {
        pairInfo = this.getPairInfo(pairInfo.aRange.end);
      }
      return pairInfo != null ? pairInfo.targetRange : void 0;
    };

    return Pair;

  })(TextObject);

  AnyPair = (function(superClass) {
    extend(AnyPair, superClass);

    function AnyPair() {
      return AnyPair.__super__.constructor.apply(this, arguments);
    }

    AnyPair.extend(false);

    AnyPair.prototype.allowForwarding = false;

    AnyPair.prototype.allowNextLine = null;

    AnyPair.prototype.skipEmptyPair = false;

    AnyPair.prototype.member = ['DoubleQuote', 'SingleQuote', 'BackTick', 'CurlyBracket', 'AngleBracket', 'Tag', 'SquareBracket', 'Parenthesis'];

    AnyPair.prototype.getRangeBy = function(klass, selection) {
      var options;
      options = {
        inner: this.inner,
        skipEmptyPair: this.skipEmptyPair
      };
      if (this.allowNextLine != null) {
        options.allowNextLine = this.allowNextLine;
      }
      return this["new"](klass, options).getRange(selection, {
        allowForwarding: this.allowForwarding,
        searchFrom: this.searchFrom
      });
    };

    AnyPair.prototype.getRanges = function(selection) {
      var j, klass, len, range, ref2, results;
      ref2 = this.member;
      results = [];
      for (j = 0, len = ref2.length; j < len; j++) {
        klass = ref2[j];
        if ((range = this.getRangeBy(klass, selection))) {
          results.push(range);
        }
      }
      return results;
    };

    AnyPair.prototype.getRange = function(selection) {
      var ranges;
      ranges = this.getRanges(selection);
      if (ranges.length) {
        return _.last(sortRanges(ranges));
      }
    };

    return AnyPair;

  })(Pair);

  AAnyPair = (function(superClass) {
    extend(AAnyPair, superClass);

    function AAnyPair() {
      return AAnyPair.__super__.constructor.apply(this, arguments);
    }

    AAnyPair.extend();

    return AAnyPair;

  })(AnyPair);

  InnerAnyPair = (function(superClass) {
    extend(InnerAnyPair, superClass);

    function InnerAnyPair() {
      return InnerAnyPair.__super__.constructor.apply(this, arguments);
    }

    InnerAnyPair.extend();

    return InnerAnyPair;

  })(AnyPair);

  AnyPairAllowForwarding = (function(superClass) {
    extend(AnyPairAllowForwarding, superClass);

    function AnyPairAllowForwarding() {
      return AnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AnyPairAllowForwarding.extend(false);

    AnyPairAllowForwarding.description = "Range surrounded by auto-detected paired chars from enclosed and forwarding area";

    AnyPairAllowForwarding.prototype.allowForwarding = true;

    AnyPairAllowForwarding.prototype.skipEmptyPair = false;

    AnyPairAllowForwarding.prototype.searchFrom = 'start';

    AnyPairAllowForwarding.prototype.getRange = function(selection) {
      var enclosingRange, enclosingRanges, forwardingRanges, from, ranges, ref2;
      ranges = this.getRanges(selection);
      from = selection.cursor.getBufferPosition();
      ref2 = _.partition(ranges, function(range) {
        return range.start.isGreaterThanOrEqual(from);
      }), forwardingRanges = ref2[0], enclosingRanges = ref2[1];
      enclosingRange = _.last(sortRanges(enclosingRanges));
      forwardingRanges = sortRanges(forwardingRanges);
      if (enclosingRange) {
        forwardingRanges = forwardingRanges.filter(function(range) {
          return enclosingRange.containsRange(range);
        });
      }
      return forwardingRanges[0] || enclosingRange;
    };

    return AnyPairAllowForwarding;

  })(AnyPair);

  AAnyPairAllowForwarding = (function(superClass) {
    extend(AAnyPairAllowForwarding, superClass);

    function AAnyPairAllowForwarding() {
      return AAnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AAnyPairAllowForwarding.extend();

    return AAnyPairAllowForwarding;

  })(AnyPairAllowForwarding);

  InnerAnyPairAllowForwarding = (function(superClass) {
    extend(InnerAnyPairAllowForwarding, superClass);

    function InnerAnyPairAllowForwarding() {
      return InnerAnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerAnyPairAllowForwarding.extend();

    return InnerAnyPairAllowForwarding;

  })(AnyPairAllowForwarding);

  AnyQuote = (function(superClass) {
    extend(AnyQuote, superClass);

    function AnyQuote() {
      return AnyQuote.__super__.constructor.apply(this, arguments);
    }

    AnyQuote.extend(false);

    AnyQuote.prototype.allowForwarding = true;

    AnyQuote.prototype.member = ['DoubleQuote', 'SingleQuote', 'BackTick'];

    AnyQuote.prototype.getRange = function(selection) {
      var ranges;
      ranges = this.getRanges(selection);
      if (ranges.length) {
        return _.first(_.sortBy(ranges, function(r) {
          return r.end.column;
        }));
      }
    };

    return AnyQuote;

  })(AnyPair);

  AAnyQuote = (function(superClass) {
    extend(AAnyQuote, superClass);

    function AAnyQuote() {
      return AAnyQuote.__super__.constructor.apply(this, arguments);
    }

    AAnyQuote.extend();

    return AAnyQuote;

  })(AnyQuote);

  InnerAnyQuote = (function(superClass) {
    extend(InnerAnyQuote, superClass);

    function InnerAnyQuote() {
      return InnerAnyQuote.__super__.constructor.apply(this, arguments);
    }

    InnerAnyQuote.extend();

    return InnerAnyQuote;

  })(AnyQuote);

  Quote = (function(superClass) {
    extend(Quote, superClass);

    function Quote() {
      return Quote.__super__.constructor.apply(this, arguments);
    }

    Quote.extend(false);

    Quote.prototype.allowForwarding = true;

    Quote.prototype.allowNextLine = false;

    return Quote;

  })(Pair);

  DoubleQuote = (function(superClass) {
    extend(DoubleQuote, superClass);

    function DoubleQuote() {
      return DoubleQuote.__super__.constructor.apply(this, arguments);
    }

    DoubleQuote.extend(false);

    DoubleQuote.prototype.pair = ['"', '"'];

    return DoubleQuote;

  })(Quote);

  ADoubleQuote = (function(superClass) {
    extend(ADoubleQuote, superClass);

    function ADoubleQuote() {
      return ADoubleQuote.__super__.constructor.apply(this, arguments);
    }

    ADoubleQuote.extend();

    return ADoubleQuote;

  })(DoubleQuote);

  InnerDoubleQuote = (function(superClass) {
    extend(InnerDoubleQuote, superClass);

    function InnerDoubleQuote() {
      return InnerDoubleQuote.__super__.constructor.apply(this, arguments);
    }

    InnerDoubleQuote.extend();

    return InnerDoubleQuote;

  })(DoubleQuote);

  SingleQuote = (function(superClass) {
    extend(SingleQuote, superClass);

    function SingleQuote() {
      return SingleQuote.__super__.constructor.apply(this, arguments);
    }

    SingleQuote.extend(false);

    SingleQuote.prototype.pair = ["'", "'"];

    return SingleQuote;

  })(Quote);

  ASingleQuote = (function(superClass) {
    extend(ASingleQuote, superClass);

    function ASingleQuote() {
      return ASingleQuote.__super__.constructor.apply(this, arguments);
    }

    ASingleQuote.extend();

    return ASingleQuote;

  })(SingleQuote);

  InnerSingleQuote = (function(superClass) {
    extend(InnerSingleQuote, superClass);

    function InnerSingleQuote() {
      return InnerSingleQuote.__super__.constructor.apply(this, arguments);
    }

    InnerSingleQuote.extend();

    return InnerSingleQuote;

  })(SingleQuote);

  BackTick = (function(superClass) {
    extend(BackTick, superClass);

    function BackTick() {
      return BackTick.__super__.constructor.apply(this, arguments);
    }

    BackTick.extend(false);

    BackTick.prototype.pair = ['`', '`'];

    return BackTick;

  })(Quote);

  ABackTick = (function(superClass) {
    extend(ABackTick, superClass);

    function ABackTick() {
      return ABackTick.__super__.constructor.apply(this, arguments);
    }

    ABackTick.extend();

    return ABackTick;

  })(BackTick);

  InnerBackTick = (function(superClass) {
    extend(InnerBackTick, superClass);

    function InnerBackTick() {
      return InnerBackTick.__super__.constructor.apply(this, arguments);
    }

    InnerBackTick.extend();

    return InnerBackTick;

  })(BackTick);

  CurlyBracket = (function(superClass) {
    extend(CurlyBracket, superClass);

    function CurlyBracket() {
      return CurlyBracket.__super__.constructor.apply(this, arguments);
    }

    CurlyBracket.extend(false);

    CurlyBracket.prototype.pair = ['{', '}'];

    CurlyBracket.prototype.allowNextLine = true;

    return CurlyBracket;

  })(Pair);

  ACurlyBracket = (function(superClass) {
    extend(ACurlyBracket, superClass);

    function ACurlyBracket() {
      return ACurlyBracket.__super__.constructor.apply(this, arguments);
    }

    ACurlyBracket.extend();

    return ACurlyBracket;

  })(CurlyBracket);

  InnerCurlyBracket = (function(superClass) {
    extend(InnerCurlyBracket, superClass);

    function InnerCurlyBracket() {
      return InnerCurlyBracket.__super__.constructor.apply(this, arguments);
    }

    InnerCurlyBracket.extend();

    return InnerCurlyBracket;

  })(CurlyBracket);

  ACurlyBracketAllowForwarding = (function(superClass) {
    extend(ACurlyBracketAllowForwarding, superClass);

    function ACurlyBracketAllowForwarding() {
      return ACurlyBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    ACurlyBracketAllowForwarding.extend();

    ACurlyBracketAllowForwarding.prototype.allowForwarding = true;

    return ACurlyBracketAllowForwarding;

  })(CurlyBracket);

  InnerCurlyBracketAllowForwarding = (function(superClass) {
    extend(InnerCurlyBracketAllowForwarding, superClass);

    function InnerCurlyBracketAllowForwarding() {
      return InnerCurlyBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerCurlyBracketAllowForwarding.extend();

    InnerCurlyBracketAllowForwarding.prototype.allowForwarding = true;

    return InnerCurlyBracketAllowForwarding;

  })(CurlyBracket);

  SquareBracket = (function(superClass) {
    extend(SquareBracket, superClass);

    function SquareBracket() {
      return SquareBracket.__super__.constructor.apply(this, arguments);
    }

    SquareBracket.extend(false);

    SquareBracket.prototype.pair = ['[', ']'];

    SquareBracket.prototype.allowNextLine = true;

    return SquareBracket;

  })(Pair);

  ASquareBracket = (function(superClass) {
    extend(ASquareBracket, superClass);

    function ASquareBracket() {
      return ASquareBracket.__super__.constructor.apply(this, arguments);
    }

    ASquareBracket.extend();

    return ASquareBracket;

  })(SquareBracket);

  InnerSquareBracket = (function(superClass) {
    extend(InnerSquareBracket, superClass);

    function InnerSquareBracket() {
      return InnerSquareBracket.__super__.constructor.apply(this, arguments);
    }

    InnerSquareBracket.extend();

    return InnerSquareBracket;

  })(SquareBracket);

  ASquareBracketAllowForwarding = (function(superClass) {
    extend(ASquareBracketAllowForwarding, superClass);

    function ASquareBracketAllowForwarding() {
      return ASquareBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    ASquareBracketAllowForwarding.extend();

    ASquareBracketAllowForwarding.prototype.allowForwarding = true;

    return ASquareBracketAllowForwarding;

  })(SquareBracket);

  InnerSquareBracketAllowForwarding = (function(superClass) {
    extend(InnerSquareBracketAllowForwarding, superClass);

    function InnerSquareBracketAllowForwarding() {
      return InnerSquareBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerSquareBracketAllowForwarding.extend();

    InnerSquareBracketAllowForwarding.prototype.allowForwarding = true;

    return InnerSquareBracketAllowForwarding;

  })(SquareBracket);

  Parenthesis = (function(superClass) {
    extend(Parenthesis, superClass);

    function Parenthesis() {
      return Parenthesis.__super__.constructor.apply(this, arguments);
    }

    Parenthesis.extend(false);

    Parenthesis.prototype.pair = ['(', ')'];

    Parenthesis.prototype.allowNextLine = true;

    return Parenthesis;

  })(Pair);

  AParenthesis = (function(superClass) {
    extend(AParenthesis, superClass);

    function AParenthesis() {
      return AParenthesis.__super__.constructor.apply(this, arguments);
    }

    AParenthesis.extend();

    return AParenthesis;

  })(Parenthesis);

  InnerParenthesis = (function(superClass) {
    extend(InnerParenthesis, superClass);

    function InnerParenthesis() {
      return InnerParenthesis.__super__.constructor.apply(this, arguments);
    }

    InnerParenthesis.extend();

    return InnerParenthesis;

  })(Parenthesis);

  AParenthesisAllowForwarding = (function(superClass) {
    extend(AParenthesisAllowForwarding, superClass);

    function AParenthesisAllowForwarding() {
      return AParenthesisAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AParenthesisAllowForwarding.extend();

    AParenthesisAllowForwarding.prototype.allowForwarding = true;

    return AParenthesisAllowForwarding;

  })(Parenthesis);

  InnerParenthesisAllowForwarding = (function(superClass) {
    extend(InnerParenthesisAllowForwarding, superClass);

    function InnerParenthesisAllowForwarding() {
      return InnerParenthesisAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerParenthesisAllowForwarding.extend();

    InnerParenthesisAllowForwarding.prototype.allowForwarding = true;

    return InnerParenthesisAllowForwarding;

  })(Parenthesis);

  AngleBracket = (function(superClass) {
    extend(AngleBracket, superClass);

    function AngleBracket() {
      return AngleBracket.__super__.constructor.apply(this, arguments);
    }

    AngleBracket.extend(false);

    AngleBracket.prototype.pair = ['<', '>'];

    return AngleBracket;

  })(Pair);

  AAngleBracket = (function(superClass) {
    extend(AAngleBracket, superClass);

    function AAngleBracket() {
      return AAngleBracket.__super__.constructor.apply(this, arguments);
    }

    AAngleBracket.extend();

    return AAngleBracket;

  })(AngleBracket);

  InnerAngleBracket = (function(superClass) {
    extend(InnerAngleBracket, superClass);

    function InnerAngleBracket() {
      return InnerAngleBracket.__super__.constructor.apply(this, arguments);
    }

    InnerAngleBracket.extend();

    return InnerAngleBracket;

  })(AngleBracket);

  AAngleBracketAllowForwarding = (function(superClass) {
    extend(AAngleBracketAllowForwarding, superClass);

    function AAngleBracketAllowForwarding() {
      return AAngleBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AAngleBracketAllowForwarding.extend();

    AAngleBracketAllowForwarding.prototype.allowForwarding = true;

    return AAngleBracketAllowForwarding;

  })(AngleBracket);

  InnerAngleBracketAllowForwarding = (function(superClass) {
    extend(InnerAngleBracketAllowForwarding, superClass);

    function InnerAngleBracketAllowForwarding() {
      return InnerAngleBracketAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    InnerAngleBracketAllowForwarding.extend();

    InnerAngleBracketAllowForwarding.prototype.allowForwarding = true;

    return InnerAngleBracketAllowForwarding;

  })(AngleBracket);

  tagPattern = /(<(\/?))([^\s>]+)[^>]*>/g;

  Tag = (function(superClass) {
    extend(Tag, superClass);

    function Tag() {
      return Tag.__super__.constructor.apply(this, arguments);
    }

    Tag.extend(false);

    Tag.prototype.allowNextLine = true;

    Tag.prototype.allowForwarding = true;

    Tag.prototype.adjustInnerRange = false;

    Tag.prototype.getPattern = function() {
      return tagPattern;
    };

    Tag.prototype.getPairState = function(arg) {
      var __, match, matchText, slash, tagName;
      match = arg.match, matchText = arg.matchText;
      __ = match[0], __ = match[1], slash = match[2], tagName = match[3];
      if (slash === '') {
        return ['open', tagName];
      } else {
        return ['close', tagName];
      }
    };

    Tag.prototype.getTagStartPoint = function(from) {
      var ref2, scanRange, tagRange;
      tagRange = null;
      scanRange = this.editor.bufferRangeForBufferRow(from.row);
      this.editor.scanInBufferRange(tagPattern, scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.containsPoint(from, true)) {
          tagRange = range;
          return stop();
        }
      });
      return (ref2 = tagRange != null ? tagRange.start : void 0) != null ? ref2 : from;
    };

    Tag.prototype.findTagState = function(stack, tagState) {
      var entry, i, j, ref2;
      if (stack.length === 0) {
        return null;
      }
      for (i = j = ref2 = stack.length - 1; ref2 <= 0 ? j <= 0 : j >= 0; i = ref2 <= 0 ? ++j : --j) {
        entry = stack[i];
        if (entry.tagState === tagState) {
          return entry;
        }
      }
      return null;
    };

    Tag.prototype.findOpen = function(from, pattern) {
      var found, scanFunc, scanRange, stack;
      scanFunc = 'backwardsScanInBufferRange';
      scanRange = new Range([0, 0], from);
      stack = [];
      found = null;
      this.findPair('open', {
        from: from,
        pattern: pattern,
        scanFunc: scanFunc,
        scanRange: scanRange
      }, (function(_this) {
        return function(event) {
          var entry, pairState, range, ref2, stop, tagName, tagState;
          range = event.range, stop = event.stop;
          ref2 = _this.getPairState(event), pairState = ref2[0], tagName = ref2[1];
          if (pairState === 'close') {
            tagState = pairState + tagName;
            stack.push({
              tagState: tagState,
              range: range
            });
          } else {
            if (entry = _this.findTagState(stack, "close" + tagName)) {
              stack = stack.slice(0, stack.indexOf(entry));
            }
            if (stack.length === 0) {
              found = range;
            }
          }
          if (found != null) {
            return stop();
          }
        };
      })(this));
      return found;
    };

    Tag.prototype.findClose = function(from, pattern) {
      var found, scanFunc, scanRange, stack;
      scanFunc = 'scanInBufferRange';
      from = this.getTagStartPoint(from);
      scanRange = new Range(from, this.editor.buffer.getEndPosition());
      stack = [];
      found = null;
      this.findPair('close', {
        from: from,
        pattern: pattern,
        scanFunc: scanFunc,
        scanRange: scanRange
      }, (function(_this) {
        return function(event) {
          var entry, openStart, pairState, range, ref2, stop, tagName, tagState;
          range = event.range, stop = event.stop;
          ref2 = _this.getPairState(event), pairState = ref2[0], tagName = ref2[1];
          if (pairState === 'open') {
            tagState = pairState + tagName;
            stack.push({
              tagState: tagState,
              range: range
            });
          } else {
            if (entry = _this.findTagState(stack, "open" + tagName)) {
              stack = stack.slice(0, stack.indexOf(entry));
            } else {
              stack = [];
            }
            if (stack.length === 0) {
              if ((openStart = entry != null ? entry.range.start : void 0)) {
                if (_this.allowForwarding) {
                  if (openStart.row > from.row) {
                    return;
                  }
                } else {
                  if (openStart.isGreaterThan(from)) {
                    return;
                  }
                }
              }
              found = range;
            }
          }
          if (found != null) {
            return stop();
          }
        };
      })(this));
      return found;
    };

    return Tag;

  })(Pair);

  ATag = (function(superClass) {
    extend(ATag, superClass);

    function ATag() {
      return ATag.__super__.constructor.apply(this, arguments);
    }

    ATag.extend();

    return ATag;

  })(Tag);

  InnerTag = (function(superClass) {
    extend(InnerTag, superClass);

    function InnerTag() {
      return InnerTag.__super__.constructor.apply(this, arguments);
    }

    InnerTag.extend();

    return InnerTag;

  })(Tag);

  Paragraph = (function(superClass) {
    extend(Paragraph, superClass);

    function Paragraph() {
      return Paragraph.__super__.constructor.apply(this, arguments);
    }

    Paragraph.extend(false);

    Paragraph.prototype.findRow = function(fromRow, direction, fn) {
      var foundRow, j, len, ref2, row;
      if (typeof fn.reset === "function") {
        fn.reset();
      }
      foundRow = fromRow;
      ref2 = getBufferRows(this.editor, {
        startRow: fromRow,
        direction: direction
      });
      for (j = 0, len = ref2.length; j < len; j++) {
        row = ref2[j];
        if (!fn(row, direction)) {
          break;
        }
        foundRow = row;
      }
      return foundRow;
    };

    Paragraph.prototype.findRowRangeBy = function(fromRow, fn) {
      var endRow, startRow;
      startRow = this.findRow(fromRow, 'previous', fn);
      endRow = this.findRow(fromRow, 'next', fn);
      return [startRow, endRow];
    };

    Paragraph.prototype.getPredictFunction = function(fromRow, selection) {
      var directionToExtend, flip, fromRowResult, predict;
      fromRowResult = this.editor.isBufferRowBlank(fromRow);
      if (this.isInner()) {
        predict = (function(_this) {
          return function(row, direction) {
            return _this.editor.isBufferRowBlank(row) === fromRowResult;
          };
        })(this);
      } else {
        if (selection.isReversed()) {
          directionToExtend = 'previous';
        } else {
          directionToExtend = 'next';
        }
        flip = false;
        predict = (function(_this) {
          return function(row, direction) {
            var result;
            result = _this.editor.isBufferRowBlank(row) === fromRowResult;
            if (flip) {
              return !result;
            } else {
              if ((!result) && (direction === directionToExtend)) {
                flip = true;
                return true;
              }
              return result;
            }
          };
        })(this);
        predict.reset = function() {
          return flip = false;
        };
      }
      return predict;
    };

    Paragraph.prototype.getRange = function(selection) {
      var fromRow, rowRange;
      fromRow = this.getNormalizedHeadBufferPosition(selection).row;
      if (this.isMode('visual', 'linewise')) {
        if (selection.isReversed()) {
          fromRow--;
        } else {
          fromRow++;
        }
        fromRow = getValidVimBufferRow(this.editor, fromRow);
      }
      rowRange = this.findRowRangeBy(fromRow, this.getPredictFunction(fromRow, selection));
      return selection.getBufferRange().union(getBufferRangeForRowRange(this.editor, rowRange));
    };

    return Paragraph;

  })(TextObject);

  AParagraph = (function(superClass) {
    extend(AParagraph, superClass);

    function AParagraph() {
      return AParagraph.__super__.constructor.apply(this, arguments);
    }

    AParagraph.extend();

    return AParagraph;

  })(Paragraph);

  InnerParagraph = (function(superClass) {
    extend(InnerParagraph, superClass);

    function InnerParagraph() {
      return InnerParagraph.__super__.constructor.apply(this, arguments);
    }

    InnerParagraph.extend();

    return InnerParagraph;

  })(Paragraph);

  Indentation = (function(superClass) {
    extend(Indentation, superClass);

    function Indentation() {
      return Indentation.__super__.constructor.apply(this, arguments);
    }

    Indentation.extend(false);

    Indentation.prototype.getRange = function(selection) {
      var baseIndentLevel, fromRow, predict, rowRange;
      fromRow = this.getNormalizedHeadBufferPosition(selection).row;
      baseIndentLevel = getIndentLevelForBufferRow(this.editor, fromRow);
      predict = (function(_this) {
        return function(row) {
          if (_this.editor.isBufferRowBlank(row)) {
            return _this.isA();
          } else {
            return getIndentLevelForBufferRow(_this.editor, row) >= baseIndentLevel;
          }
        };
      })(this);
      rowRange = this.findRowRangeBy(fromRow, predict);
      return getBufferRangeForRowRange(this.editor, rowRange);
    };

    return Indentation;

  })(Paragraph);

  AIndentation = (function(superClass) {
    extend(AIndentation, superClass);

    function AIndentation() {
      return AIndentation.__super__.constructor.apply(this, arguments);
    }

    AIndentation.extend();

    return AIndentation;

  })(Indentation);

  InnerIndentation = (function(superClass) {
    extend(InnerIndentation, superClass);

    function InnerIndentation() {
      return InnerIndentation.__super__.constructor.apply(this, arguments);
    }

    InnerIndentation.extend();

    return InnerIndentation;

  })(Indentation);

  Comment = (function(superClass) {
    extend(Comment, superClass);

    function Comment() {
      return Comment.__super__.constructor.apply(this, arguments);
    }

    Comment.extend(false);

    Comment.prototype.getRange = function(selection) {
      var row, rowRange;
      row = selection.getBufferRange().start.row;
      rowRange = this.editor.languageMode.rowRangeForCommentAtBufferRow(row);
      if (this.editor.isBufferRowCommented(row)) {
        if (rowRange == null) {
          rowRange = [row, row];
        }
      }
      if (rowRange) {
        return getBufferRangeForRowRange(selection.editor, rowRange);
      }
    };

    return Comment;

  })(TextObject);

  AComment = (function(superClass) {
    extend(AComment, superClass);

    function AComment() {
      return AComment.__super__.constructor.apply(this, arguments);
    }

    AComment.extend();

    return AComment;

  })(Comment);

  InnerComment = (function(superClass) {
    extend(InnerComment, superClass);

    function InnerComment() {
      return InnerComment.__super__.constructor.apply(this, arguments);
    }

    InnerComment.extend();

    return InnerComment;

  })(Comment);

  Fold = (function(superClass) {
    extend(Fold, superClass);

    function Fold() {
      return Fold.__super__.constructor.apply(this, arguments);
    }

    Fold.extend(false);

    Fold.prototype.adjustRowRange = function(arg) {
      var endRow, endRowIndentLevel, startRow, startRowIndentLevel;
      startRow = arg[0], endRow = arg[1];
      if (!this.isInner()) {
        return [startRow, endRow];
      }
      startRowIndentLevel = getIndentLevelForBufferRow(this.editor, startRow);
      endRowIndentLevel = getIndentLevelForBufferRow(this.editor, endRow);
      if (startRowIndentLevel === endRowIndentLevel) {
        endRow -= 1;
      }
      startRow += 1;
      return [startRow, endRow];
    };

    Fold.prototype.getFoldRowRangesContainsForRow = function(row) {
      var ref2;
      return (ref2 = getCodeFoldRowRangesContainesForRow(this.editor, row, {
        includeStartRow: false
      })) != null ? ref2.reverse() : void 0;
    };

    Fold.prototype.getRange = function(selection) {
      var range, rowRange, rowRanges, targetRange;
      range = selection.getBufferRange();
      rowRanges = this.getFoldRowRangesContainsForRow(range.start.row);
      if (!rowRanges.length) {
        return;
      }
      if ((rowRange = rowRanges.shift()) != null) {
        rowRange = this.adjustRowRange(rowRange);
        targetRange = getBufferRangeForRowRange(this.editor, rowRange);
        if (targetRange.isEqual(range) && rowRanges.length) {
          rowRange = this.adjustRowRange(rowRanges.shift());
        }
      }
      return getBufferRangeForRowRange(this.editor, rowRange);
    };

    return Fold;

  })(TextObject);

  AFold = (function(superClass) {
    extend(AFold, superClass);

    function AFold() {
      return AFold.__super__.constructor.apply(this, arguments);
    }

    AFold.extend();

    return AFold;

  })(Fold);

  InnerFold = (function(superClass) {
    extend(InnerFold, superClass);

    function InnerFold() {
      return InnerFold.__super__.constructor.apply(this, arguments);
    }

    InnerFold.extend();

    return InnerFold;

  })(Fold);

  Function = (function(superClass) {
    extend(Function, superClass);

    function Function() {
      return Function.__super__.constructor.apply(this, arguments);
    }

    Function.extend(false);

    Function.prototype.omittingClosingCharLanguages = ['go'];

    Function.prototype.initialize = function() {
      Function.__super__.initialize.apply(this, arguments);
      return this.language = this.editor.getGrammar().scopeName.replace(/^source\./, '');
    };

    Function.prototype.getFoldRowRangesContainsForRow = function(row) {
      var ref2, rowRanges;
      rowRanges = (ref2 = getCodeFoldRowRangesContainesForRow(this.editor, row)) != null ? ref2.reverse() : void 0;
      return rowRanges != null ? rowRanges.filter((function(_this) {
        return function(rowRange) {
          return isIncludeFunctionScopeForRow(_this.editor, rowRange[0]);
        };
      })(this)) : void 0;
    };

    Function.prototype.adjustRowRange = function(rowRange) {
      var endRow, ref2, ref3, startRow;
      ref2 = Function.__super__.adjustRowRange.apply(this, arguments), startRow = ref2[0], endRow = ref2[1];
      if (this.isA() && (ref3 = this.language, indexOf.call(this.omittingClosingCharLanguages, ref3) >= 0)) {
        endRow += 1;
      }
      return [startRow, endRow];
    };

    return Function;

  })(Fold);

  AFunction = (function(superClass) {
    extend(AFunction, superClass);

    function AFunction() {
      return AFunction.__super__.constructor.apply(this, arguments);
    }

    AFunction.extend();

    return AFunction;

  })(Function);

  InnerFunction = (function(superClass) {
    extend(InnerFunction, superClass);

    function InnerFunction() {
      return InnerFunction.__super__.constructor.apply(this, arguments);
    }

    InnerFunction.extend();

    return InnerFunction;

  })(Function);

  CurrentLine = (function(superClass) {
    extend(CurrentLine, superClass);

    function CurrentLine() {
      return CurrentLine.__super__.constructor.apply(this, arguments);
    }

    CurrentLine.extend(false);

    CurrentLine.prototype.getRange = function(selection) {
      var range, row;
      row = this.getNormalizedHeadBufferPosition(selection).row;
      range = this.editor.bufferRangeForBufferRow(row);
      if (this.isA()) {
        return range;
      } else {
        return trimRange(this.editor, range);
      }
    };

    return CurrentLine;

  })(TextObject);

  ACurrentLine = (function(superClass) {
    extend(ACurrentLine, superClass);

    function ACurrentLine() {
      return ACurrentLine.__super__.constructor.apply(this, arguments);
    }

    ACurrentLine.extend();

    return ACurrentLine;

  })(CurrentLine);

  InnerCurrentLine = (function(superClass) {
    extend(InnerCurrentLine, superClass);

    function InnerCurrentLine() {
      return InnerCurrentLine.__super__.constructor.apply(this, arguments);
    }

    InnerCurrentLine.extend();

    return InnerCurrentLine;

  })(CurrentLine);

  Entire = (function(superClass) {
    extend(Entire, superClass);

    function Entire() {
      return Entire.__super__.constructor.apply(this, arguments);
    }

    Entire.extend(false);

    Entire.prototype.getRange = function(selection) {
      this.stopSelection();
      return this.editor.buffer.getRange();
    };

    return Entire;

  })(TextObject);

  AEntire = (function(superClass) {
    extend(AEntire, superClass);

    function AEntire() {
      return AEntire.__super__.constructor.apply(this, arguments);
    }

    AEntire.extend();

    return AEntire;

  })(Entire);

  InnerEntire = (function(superClass) {
    extend(InnerEntire, superClass);

    function InnerEntire() {
      return InnerEntire.__super__.constructor.apply(this, arguments);
    }

    InnerEntire.extend();

    return InnerEntire;

  })(Entire);

  All = (function(superClass) {
    extend(All, superClass);

    function All() {
      return All.__super__.constructor.apply(this, arguments);
    }

    All.extend(false);

    return All;

  })(Entire);

  Empty = (function(superClass) {
    extend(Empty, superClass);

    function Empty() {
      return Empty.__super__.constructor.apply(this, arguments);
    }

    Empty.extend(false);

    return Empty;

  })(TextObject);

  LatestChange = (function(superClass) {
    extend(LatestChange, superClass);

    function LatestChange() {
      return LatestChange.__super__.constructor.apply(this, arguments);
    }

    LatestChange.extend(false);

    LatestChange.prototype.getRange = function() {
      this.stopSelection();
      return this.vimState.mark.getRange('[', ']');
    };

    return LatestChange;

  })(TextObject);

  ALatestChange = (function(superClass) {
    extend(ALatestChange, superClass);

    function ALatestChange() {
      return ALatestChange.__super__.constructor.apply(this, arguments);
    }

    ALatestChange.extend();

    return ALatestChange;

  })(LatestChange);

  InnerLatestChange = (function(superClass) {
    extend(InnerLatestChange, superClass);

    function InnerLatestChange() {
      return InnerLatestChange.__super__.constructor.apply(this, arguments);
    }

    InnerLatestChange.extend();

    return InnerLatestChange;

  })(LatestChange);

  SearchMatchForward = (function(superClass) {
    extend(SearchMatchForward, superClass);

    function SearchMatchForward() {
      return SearchMatchForward.__super__.constructor.apply(this, arguments);
    }

    SearchMatchForward.extend();

    SearchMatchForward.prototype.backward = false;

    SearchMatchForward.prototype.findMatch = function(fromPoint, pattern) {
      var found, scanRange;
      if (this.isMode('visual')) {
        fromPoint = translatePointAndClip(this.editor, fromPoint, "forward");
      }
      scanRange = [[fromPoint.row, 0], this.getVimEofBufferPosition()];
      found = null;
      this.editor.scanInBufferRange(pattern, scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.end.isGreaterThan(fromPoint)) {
          found = range;
          return stop();
        }
      });
      return {
        range: found,
        whichIsHead: 'end'
      };
    };

    SearchMatchForward.prototype.getRange = function(selection) {
      var fromPoint, pattern, range, ref2, whichIsHead;
      pattern = this.globalState.get('lastSearchPattern');
      if (pattern == null) {
        return;
      }
      fromPoint = selection.getHeadBufferPosition();
      ref2 = this.findMatch(fromPoint, pattern), range = ref2.range, whichIsHead = ref2.whichIsHead;
      if (range != null) {
        return this.unionRangeAndDetermineReversedState(selection, range, whichIsHead);
      }
    };

    SearchMatchForward.prototype.unionRangeAndDetermineReversedState = function(selection, found, whichIsHead) {
      var head, tail;
      if (selection.isEmpty()) {
        return found;
      } else {
        head = found[whichIsHead];
        tail = selection.getTailBufferPosition();
        if (this.backward) {
          if (tail.isLessThan(head)) {
            head = translatePointAndClip(this.editor, head, 'forward');
          }
        } else {
          if (head.isLessThan(tail)) {
            head = translatePointAndClip(this.editor, head, 'backward');
          }
        }
        this.reversed = head.isLessThan(tail);
        return new Range(tail, head).union(swrap(selection).getTailBufferRange());
      }
    };

    SearchMatchForward.prototype.selectTextObject = function(selection) {
      var range, ref2, reversed;
      if (!(range = this.getRange(selection))) {
        return;
      }
      reversed = (ref2 = this.reversed) != null ? ref2 : this.backward;
      swrap(selection).setBufferRange(range, {
        reversed: reversed
      });
      return selection.cursor.autoscroll();
    };

    return SearchMatchForward;

  })(TextObject);

  SearchMatchBackward = (function(superClass) {
    extend(SearchMatchBackward, superClass);

    function SearchMatchBackward() {
      return SearchMatchBackward.__super__.constructor.apply(this, arguments);
    }

    SearchMatchBackward.extend();

    SearchMatchBackward.prototype.backward = true;

    SearchMatchBackward.prototype.findMatch = function(fromPoint, pattern) {
      var found, scanRange;
      if (this.isMode('visual')) {
        fromPoint = translatePointAndClip(this.editor, fromPoint, "backward");
      }
      scanRange = [[fromPoint.row, 2e308], [0, 0]];
      found = null;
      this.editor.backwardsScanInBufferRange(pattern, scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.start.isLessThan(fromPoint)) {
          found = range;
          return stop();
        }
      });
      return {
        range: found,
        whichIsHead: 'start'
      };
    };

    return SearchMatchBackward;

  })(SearchMatchForward);

  PreviousSelection = (function(superClass) {
    extend(PreviousSelection, superClass);

    function PreviousSelection() {
      return PreviousSelection.__super__.constructor.apply(this, arguments);
    }

    PreviousSelection.extend();

    PreviousSelection.prototype.select = function() {
      var properties, ref2, selection;
      ref2 = this.vimState.previousSelection, properties = ref2.properties, this.submode = ref2.submode;
      if ((properties != null) && (this.submode != null)) {
        selection = this.editor.getLastSelection();
        return swrap(selection).selectByProperties(properties);
      }
    };

    return PreviousSelection;

  })(TextObject);

  PersistentSelection = (function(superClass) {
    extend(PersistentSelection, superClass);

    function PersistentSelection() {
      return PersistentSelection.__super__.constructor.apply(this, arguments);
    }

    PersistentSelection.extend(false);

    PersistentSelection.prototype.select = function() {
      var ranges;
      ranges = this.vimState.persistentSelection.getMarkerBufferRanges();
      if (ranges.length) {
        this.editor.setSelectedBufferRanges(ranges);
      }
      return this.vimState.clearPersistentSelections();
    };

    return PersistentSelection;

  })(TextObject);

  APersistentSelection = (function(superClass) {
    extend(APersistentSelection, superClass);

    function APersistentSelection() {
      return APersistentSelection.__super__.constructor.apply(this, arguments);
    }

    APersistentSelection.extend();

    return APersistentSelection;

  })(PersistentSelection);

  InnerPersistentSelection = (function(superClass) {
    extend(InnerPersistentSelection, superClass);

    function InnerPersistentSelection() {
      return InnerPersistentSelection.__super__.constructor.apply(this, arguments);
    }

    InnerPersistentSelection.extend();

    return InnerPersistentSelection;

  })(PersistentSelection);

  VisibleArea = (function(superClass) {
    extend(VisibleArea, superClass);

    function VisibleArea() {
      return VisibleArea.__super__.constructor.apply(this, arguments);
    }

    VisibleArea.extend(false);

    VisibleArea.prototype.getRange = function(selection) {
      this.stopSelection();
      return getVisibleBufferRange(this.editor).translate([+1, 0], [-3, 0]);
    };

    return VisibleArea;

  })(TextObject);

  AVisibleArea = (function(superClass) {
    extend(AVisibleArea, superClass);

    function AVisibleArea() {
      return AVisibleArea.__super__.constructor.apply(this, arguments);
    }

    AVisibleArea.extend();

    return AVisibleArea;

  })(VisibleArea);

  InnerVisibleArea = (function(superClass) {
    extend(InnerVisibleArea, superClass);

    function InnerVisibleArea() {
      return InnerVisibleArea.__super__.constructor.apply(this, arguments);
    }

    InnerVisibleArea.extend();

    return InnerVisibleArea;

  })(VisibleArea);

  Edge = (function(superClass) {
    extend(Edge, superClass);

    function Edge() {
      return Edge.__super__.constructor.apply(this, arguments);
    }

    Edge.extend(false);

    Edge.prototype.select = function() {
      this.success = null;
      Edge.__super__.select.apply(this, arguments);
      if (this.success) {
        return this.vimState.activate('visual', 'linewise');
      }
    };

    Edge.prototype.getRange = function(selection) {
      var endScreenPoint, fromPoint, moveDownToEdge, moveUpToEdge, range, screenRange, startScreenPoint;
      fromPoint = this.getNormalizedHeadScreenPosition(selection);
      moveUpToEdge = this["new"]('MoveUpToEdge');
      moveDownToEdge = this["new"]('MoveDownToEdge');
      if (!moveUpToEdge.isStoppablePoint(fromPoint)) {
        return;
      }
      startScreenPoint = endScreenPoint = null;
      if (moveUpToEdge.isEdge(fromPoint)) {
        startScreenPoint = endScreenPoint = fromPoint;
      }
      if (moveUpToEdge.isStoppablePoint(fromPoint.translate([-1, 0]))) {
        startScreenPoint = moveUpToEdge.getPoint(fromPoint);
      }
      if (moveDownToEdge.isStoppablePoint(fromPoint.translate([+1, 0]))) {
        endScreenPoint = moveDownToEdge.getPoint(fromPoint);
      }
      if ((startScreenPoint != null) && (endScreenPoint != null)) {
        if (this.success == null) {
          this.success = true;
        }
        screenRange = new Range(startScreenPoint, endScreenPoint);
        range = this.editor.bufferRangeForScreenRange(screenRange);
        return getRangeByTranslatePointAndClip(this.editor, range, 'end', 'forward');
      }
    };

    return Edge;

  })(TextObject);

  AEdge = (function(superClass) {
    extend(AEdge, superClass);

    function AEdge() {
      return AEdge.__super__.constructor.apply(this, arguments);
    }

    AEdge.extend();

    return AEdge;

  })(Edge);

  InnerEdge = (function(superClass) {
    extend(InnerEdge, superClass);

    function InnerEdge() {
      return InnerEdge.__super__.constructor.apply(this, arguments);
    }

    InnerEdge.extend();

    return InnerEdge;

  })(Edge);

  UnionTextObject = (function(superClass) {
    extend(UnionTextObject, superClass);

    function UnionTextObject() {
      return UnionTextObject.__super__.constructor.apply(this, arguments);
    }

    UnionTextObject.extend(false);

    UnionTextObject.prototype.member = [];

    UnionTextObject.prototype.getRange = function(selection) {
      var j, len, member, range, ref2, unionRange;
      unionRange = null;
      ref2 = this.member;
      for (j = 0, len = ref2.length; j < len; j++) {
        member = ref2[j];
        if (range = this["new"](member).getRange(selection)) {
          if (unionRange != null) {
            unionRange = unionRange.union(range);
          } else {
            unionRange = range;
          }
        }
      }
      return unionRange;
    };

    return UnionTextObject;

  })(TextObject);

  AFunctionOrInnerParagraph = (function(superClass) {
    extend(AFunctionOrInnerParagraph, superClass);

    function AFunctionOrInnerParagraph() {
      return AFunctionOrInnerParagraph.__super__.constructor.apply(this, arguments);
    }

    AFunctionOrInnerParagraph.extend();

    AFunctionOrInnerParagraph.prototype.member = ['AFunction', 'InnerParagraph'];

    return AFunctionOrInnerParagraph;

  })(UnionTextObject);

  ACurrentSelectionAndAPersistentSelection = (function(superClass) {
    extend(ACurrentSelectionAndAPersistentSelection, superClass);

    function ACurrentSelectionAndAPersistentSelection() {
      return ACurrentSelectionAndAPersistentSelection.__super__.constructor.apply(this, arguments);
    }

    ACurrentSelectionAndAPersistentSelection.extend();

    ACurrentSelectionAndAPersistentSelection.prototype.select = function() {
      var pesistentRanges, ranges, selectedRanges;
      pesistentRanges = this.vimState.getPersistentSelectionBuffferRanges();
      selectedRanges = this.editor.getSelectedBufferRanges();
      ranges = pesistentRanges.concat(selectedRanges);
      if (ranges.length) {
        this.editor.setSelectedBufferRanges(ranges);
      }
      this.vimState.clearPersistentSelections();
      return this.editor.mergeIntersectingSelections();
    };

    return ACurrentSelectionAndAPersistentSelection;

  })(TextObject);

  TextObjectFirstFound = (function(superClass) {
    extend(TextObjectFirstFound, superClass);

    function TextObjectFirstFound() {
      return TextObjectFirstFound.__super__.constructor.apply(this, arguments);
    }

    TextObjectFirstFound.extend(false);

    TextObjectFirstFound.prototype.member = [];

    TextObjectFirstFound.prototype.memberOptoins = {
      allowNextLine: false
    };

    TextObjectFirstFound.prototype.getRangeBy = function(klass, selection) {
      return this["new"](klass, this.memberOptoins).getRange(selection);
    };

    TextObjectFirstFound.prototype.getRanges = function(selection) {
      var j, klass, len, range, ref2, results;
      ref2 = this.member;
      results = [];
      for (j = 0, len = ref2.length; j < len; j++) {
        klass = ref2[j];
        if ((range = this.getRangeBy(klass, selection))) {
          results.push(range);
        }
      }
      return results;
    };

    TextObjectFirstFound.prototype.getRange = function(selection) {
      var j, len, member, range, ref2;
      ref2 = this.member;
      for (j = 0, len = ref2.length; j < len; j++) {
        member = ref2[j];
        if (range = this.getRangeBy(member, selection)) {
          return range;
        }
      }
    };

    return TextObjectFirstFound;

  })(TextObject);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvdGV4dC1vYmplY3QuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxxNERBQUE7SUFBQTs7OztFQUFBLE1BQWlCLE9BQUEsQ0FBUSxNQUFSLENBQWpCLEVBQUMsaUJBQUQsRUFBUTs7RUFDUixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQU9KLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDUCxLQUFBLEdBQVEsT0FBQSxDQUFRLHFCQUFSOztFQUNSLE9BaUJJLE9BQUEsQ0FBUSxTQUFSLENBakJKLEVBQ0UsNEJBREYsRUFDYyxzREFEZCxFQUN1QywwQkFEdkMsRUFDa0QsNENBRGxELEVBRUUsb0NBRkYsRUFHRSw0REFIRixFQUlFLDhFQUpGLEVBS0UsMERBTEYsRUFNRSxnRUFORixFQU9FLDREQVBGLEVBUUUsd0RBUkYsRUFTRSxrREFURixFQVVFLGtEQVZGLEVBV0Usc0VBWEYsRUFZRSxrQ0FaRixFQWFFLGdEQWJGLEVBZUUsNERBZkYsRUFnQkU7O0VBR0k7OztJQUNKLFVBQUMsQ0FBQSxNQUFELENBQVEsS0FBUjs7eUJBQ0Esa0JBQUEsR0FBb0I7O0lBQ1Asb0JBQUE7TUFDWCxJQUFDLENBQUEsV0FBVyxDQUFBLFNBQUUsQ0FBQSxLQUFkLEdBQXNCLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBVSxDQUFDLFVBQVgsQ0FBc0IsT0FBdEI7TUFDdEIsNkNBQUEsU0FBQTtNQUNBLElBQUMsQ0FBQSxVQUFELENBQUE7SUFIVzs7eUJBS2IsT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUE7SUFETTs7eUJBR1QsR0FBQSxHQUFLLFNBQUE7YUFDSCxDQUFJLElBQUMsQ0FBQSxPQUFELENBQUE7SUFERDs7eUJBR0wsb0JBQUEsR0FBc0IsU0FBQTthQUNwQixJQUFDLENBQUE7SUFEbUI7O3lC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Q0FBQyxLQUFBLEdBQVEsSUFBQyxDQUFBLFVBQUQsQ0FBWSxLQUFaLEVBQW1CLFNBQW5CLENBQVQ7dUJBQWhDOztBQUFBOztJQURROzttQ0FHWCxRQUFBLEdBQVUsU0FBQyxTQUFEO0FBQ1IsVUFBQTtBQUFBO0FBQUEsV0FBQSxzQ0FBQTs7WUFBMkIsS0FBQSxHQUFRLElBQUMsQ0FBQSxVQUFELENBQVksTUFBWixFQUFvQixTQUFwQjtBQUNqQyxpQkFBTzs7QUFEVDtJQURROzs7O0tBWHVCO0FBOTdCbkMiLCJzb3VyY2VzQ29udGVudCI6WyJ7UmFuZ2UsIFBvaW50fSA9IHJlcXVpcmUgJ2F0b20nXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG4jIFtUT0RPXSBOZWVkIG92ZXJoYXVsXG4jICAtIFsgXSBtdXN0IGhhdmUgZ2V0UmFuZ2Uoc2VsZWN0aW9uKSAtPlxuIyAgLSBbIF0gUmVtb3ZlIHNlbGVjdFRleHRPYmplY3Q/XG4jICAtIFsgXSBNYWtlIGV4cGFuZGFibGUgYnkgc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkudW5pb24oQGdldFJhbmdlKHNlbGVjdGlvbikpXG4jICAtIFsgXSBDb3VudCBzdXBwb3J0KHByaW9yaXR5IGxvdyk/XG5CYXNlID0gcmVxdWlyZSAnLi9iYXNlJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xue1xuICBzb3J0UmFuZ2VzLCBzb3J0UmFuZ2VzQnlFbmRQb3NpdGlvbiwgY291bnRDaGFyLCBwb2ludElzQXRFbmRPZkxpbmUsXG4gIGdldFRleHRUb1BvaW50XG4gIGdldEluZGVudExldmVsRm9yQnVmZmVyUm93XG4gIGdldENvZGVGb2xkUm93UmFuZ2VzQ29udGFpbmVzRm9yUm93XG4gIGdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2VcbiAgaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvd1xuICBnZXRTdGFydFBvc2l0aW9uRm9yUGF0dGVyblxuICBnZXRFbmRQb3NpdGlvbkZvclBhdHRlcm5cbiAgZ2V0VmlzaWJsZUJ1ZmZlclJhbmdlXG4gIHRyYW5zbGF0ZVBvaW50QW5kQ2xpcFxuICBnZXRSYW5nZUJ5VHJhbnNsYXRlUG9pbnRBbmRDbGlwXG4gIGdldEJ1ZmZlclJvd3NcbiAgZ2V0VmFsaWRWaW1CdWZmZXJSb3dcblxuICBnZXRTdGFydFBvc2l0aW9uRm9yUGF0dGVyblxuICB0cmltUmFuZ2Vcbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuXG5jbGFzcyBUZXh0T2JqZWN0IGV4dGVuZHMgQmFzZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBhbGxvd1N1Ym1vZGVDaGFuZ2U6IHRydWVcbiAgY29uc3RydWN0b3I6IC0+XG4gICAgQGNvbnN0cnVjdG9yOjppbm5lciA9IEBnZXROYW1lKCkuc3RhcnRzV2l0aCgnSW5uZXInKVxuICAgIHN1cGVyXG4gICAgQGluaXRpYWxpemUoKVxuXG4gIGlzSW5uZXI6IC0+XG4gICAgQGlubmVyXG5cbiAgaXNBOiAtPlxuICAgIG5vdCBAaXNJbm5lcigpXG5cbiAgaXNBbGxvd1N1Ym1vZGVDaGFuZ2U6IC0+XG4gICAgQGFsbG93U3VibW9kZUNoYW5nZVxuXG4gIGlzTGluZXdpc2U6IC0+XG4gICAgaWYgQGlzQWxsb3dTdWJtb2RlQ2hhbmdlKClcbiAgICAgIHN3cmFwLmRldGVjdFZpc3VhbE1vZGVTdWJtb2RlKEBlZGl0b3IpIGlzICdsaW5ld2lzZSdcbiAgICBlbHNlXG4gICAgICBAaXNNb2RlKCd2aXN1YWwnLCAnbGluZXdpc2UnKVxuXG4gIHN0b3BTZWxlY3Rpb246IC0+XG4gICAgQGNhblNlbGVjdCA9IGZhbHNlXG5cbiAgZ2V0Tm9ybWFsaXplZEhlYWRCdWZmZXJQb3NpdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBoZWFkID0gc2VsZWN0aW9uLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJykgYW5kIG5vdCBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG4gICAgICBoZWFkID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKEBlZGl0b3IsIGhlYWQsICdiYWNrd2FyZCcpXG4gICAgaGVhZFxuXG4gIGdldE5vcm1hbGl6ZWRIZWFkU2NyZWVuUG9zaXRpb246IChzZWxlY3Rpb24pIC0+XG4gICAgYnVmZmVyUG9zaXRpb24gPSBAZ2V0Tm9ybWFsaXplZEhlYWRCdWZmZXJQb3NpdGlvbihzZWxlY3Rpb24pXG4gICAgQGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKGJ1ZmZlclBvc2l0aW9uKVxuXG4gIHNlbGVjdDogLT5cbiAgICBAY2FuU2VsZWN0ID0gdHJ1ZVxuXG4gICAgQGNvdW50VGltZXMgPT5cbiAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKCkgd2hlbiBAY2FuU2VsZWN0XG4gICAgICAgIEBzZWxlY3RUZXh0T2JqZWN0KHNlbGVjdGlvbilcbiAgICBAZWRpdG9yLm1lcmdlSW50ZXJzZWN0aW5nU2VsZWN0aW9ucygpXG4gICAgQHVwZGF0ZVNlbGVjdGlvblByb3BlcnRpZXMoKSBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuXG4gIHNlbGVjdFRleHRPYmplY3Q6IChzZWxlY3Rpb24pIC0+XG4gICAgcmFuZ2UgPSBAZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICAgIHN3cmFwKHNlbGVjdGlvbikuc2V0QnVmZmVyUmFuZ2VTYWZlbHkocmFuZ2UpXG5cbiAgZ2V0UmFuZ2U6IC0+XG4gICAgIyBJIHdhbnQgdG9cbiAgICAjIHRocm93IG5ldyBFcnJvcigndGV4dC1vYmplY3QgbXVzdCByZXNwb25kIHRvIHJhbmdlIGJ5IGdldFJhbmdlKCkhJylcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBXb3JkIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIHBvaW50ID0gQGdldE5vcm1hbGl6ZWRIZWFkQnVmZmVyUG9zaXRpb24oc2VsZWN0aW9uKVxuICAgIHtyYW5nZSwga2luZH0gPSBAZ2V0V29yZEJ1ZmZlclJhbmdlQW5kS2luZEF0QnVmZmVyUG9zaXRpb24ocG9pbnQsIHtAd29yZFJlZ2V4fSlcbiAgICBpZiBAaXNBKCkgYW5kIGtpbmQgaXMgJ3dvcmQnXG4gICAgICByYW5nZSA9IEBleHBhbmRSYW5nZVRvV2hpdGVTcGFjZXMocmFuZ2UpXG4gICAgcmFuZ2VcblxuICBleHBhbmRSYW5nZVRvV2hpdGVTcGFjZXM6IChyYW5nZSkgLT5cbiAgICBpZiBuZXdFbmQgPSBnZXRFbmRQb3NpdGlvbkZvclBhdHRlcm4oQGVkaXRvciwgcmFuZ2UuZW5kLCAvXFxzKy8sIGNvbnRhaW5lZE9ubHk6IHRydWUpXG4gICAgICByZXR1cm4gbmV3IFJhbmdlKHJhbmdlLnN0YXJ0LCBuZXdFbmQpXG5cbiAgICBpZiBuZXdTdGFydCA9IGdldFN0YXJ0UG9zaXRpb25Gb3JQYXR0ZXJuKEBlZGl0b3IsIHJhbmdlLnN0YXJ0LCAvXFxzKy8sIGNvbnRhaW5lZE9ubHk6IHRydWUpXG4gICAgICAjIFRvIGNvbWZvcm0gd2l0aCBwdXJlIHZpbSwgZXhwYW5kIGFzIGxvbmcgYXMgaXQncyBub3QgaW5kZW50KHdoaXRlIHNwYWNlcyBzdGFydGluZyB3aXRoIGNvbHVtbiAwKS5cbiAgICAgIHJldHVybiBuZXcgUmFuZ2UobmV3U3RhcnQsIHJhbmdlLmVuZCkgdW5sZXNzIG5ld1N0YXJ0LmNvbHVtbiBpcyAwXG5cbiAgICByYW5nZSAjIHJldHVybiBvcmlnaW5hbCByYW5nZSBhcyBmYWxsYmFja1xuXG5jbGFzcyBBV29yZCBleHRlbmRzIFdvcmRcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyV29yZCBleHRlbmRzIFdvcmRcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgV2hvbGVXb3JkIGV4dGVuZHMgV29yZFxuICBAZXh0ZW5kKGZhbHNlKVxuICB3b3JkUmVnZXg6IC9cXFMrL1xuXG5jbGFzcyBBV2hvbGVXb3JkIGV4dGVuZHMgV2hvbGVXb3JkXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lcldob2xlV29yZCBleHRlbmRzIFdob2xlV29yZFxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIEp1c3QgaW5jbHVkZSBfLCAtXG5jbGFzcyBTbWFydFdvcmQgZXh0ZW5kcyBXb3JkXG4gIEBleHRlbmQoZmFsc2UpXG4gIHdvcmRSZWdleDogL1tcXHctXSsvXG5cbmNsYXNzIEFTbWFydFdvcmQgZXh0ZW5kcyBTbWFydFdvcmRcbiAgQGRlc2NyaXB0aW9uOiBcIkEgd29yZCB0aGF0IGNvbnNpc3RzIG9mIGFscGhhbnVtZXJpYyBjaGFycyhgL1tBLVphLXowLTlfXS9gKSBhbmQgaHlwaGVuIGAtYFwiXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lclNtYXJ0V29yZCBleHRlbmRzIFNtYXJ0V29yZFxuICBAZGVzY3JpcHRpb246IFwiQ3VycmVudGx5IE5vIGRpZmYgZnJvbSBgYS1zbWFydC13b3JkYFwiXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFBhaXIgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIGFsbG93TmV4dExpbmU6IGZhbHNlXG4gIGFsbG93U3VibW9kZUNoYW5nZTogZmFsc2VcbiAgYWRqdXN0SW5uZXJSYW5nZTogdHJ1ZVxuICBwYWlyOiBudWxsXG5cbiAgZ2V0UGF0dGVybjogLT5cbiAgICBbb3BlbiwgY2xvc2VdID0gQHBhaXJcbiAgICBpZiBvcGVuIGlzIGNsb3NlXG4gICAgICBuZXcgUmVnRXhwKFwiKCN7Xy5lc2NhcGVSZWdFeHAob3Blbil9KVwiLCAnZycpXG4gICAgZWxzZVxuICAgICAgbmV3IFJlZ0V4cChcIigje18uZXNjYXBlUmVnRXhwKG9wZW4pfSl8KCN7Xy5lc2NhcGVSZWdFeHAoY2xvc2UpfSlcIiwgJ2cnKVxuXG4gICMgUmV0dXJuICdvcGVuJyBvciAnY2xvc2UnXG4gIGdldFBhaXJTdGF0ZTogKHttYXRjaFRleHQsIHJhbmdlLCBtYXRjaH0pIC0+XG4gICAgc3dpdGNoIG1hdGNoLmxlbmd0aFxuICAgICAgd2hlbiAyXG4gICAgICAgIEBwYWlyU3RhdGVJbkJ1ZmZlclJhbmdlKHJhbmdlLCBtYXRjaFRleHQpXG4gICAgICB3aGVuIDNcbiAgICAgICAgc3dpdGNoXG4gICAgICAgICAgd2hlbiBtYXRjaFsxXSB0aGVuICdvcGVuJ1xuICAgICAgICAgIHdoZW4gbWF0Y2hbMl0gdGhlbiAnY2xvc2UnXG5cbiAgYmFja1NsYXNoUGF0dGVybiA9IF8uZXNjYXBlUmVnRXhwKCdcXFxcJylcbiAgcGFpclN0YXRlSW5CdWZmZXJSYW5nZTogKHJhbmdlLCBjaGFyKSAtPlxuICAgIHRleHQgPSBnZXRUZXh0VG9Qb2ludChAZWRpdG9yLCByYW5nZS5lbmQpXG4gICAgZXNjYXBlZENoYXIgPSBfLmVzY2FwZVJlZ0V4cChjaGFyKVxuICAgIGJzID0gYmFja1NsYXNoUGF0dGVyblxuICAgIHBhdHRlcm5zID0gW1xuICAgICAgXCIje2JzfSN7YnN9I3tlc2NhcGVkQ2hhcn1cIlxuICAgICAgXCJbXiN7YnN9XT8je2VzY2FwZWRDaGFyfVwiXG4gICAgXVxuICAgIHBhdHRlcm4gPSBuZXcgUmVnRXhwKHBhdHRlcm5zLmpvaW4oJ3wnKSlcbiAgICBbJ2Nsb3NlJywgJ29wZW4nXVsoY291bnRDaGFyKHRleHQsIHBhdHRlcm4pICUgMildXG5cbiAgIyBUYWtlIHN0YXJ0IHBvaW50IG9mIG1hdGNoZWQgcmFuZ2UuXG4gIGlzRXNjYXBlZENoYXJBdFBvaW50OiAocG9pbnQpIC0+XG4gICAgZm91bmQgPSBmYWxzZVxuXG4gICAgYnMgPSBiYWNrU2xhc2hQYXR0ZXJuXG4gICAgcGF0dGVybiA9IG5ldyBSZWdFeHAoXCJbXiN7YnN9XSN7YnN9XCIpXG4gICAgc2NhblJhbmdlID0gW1twb2ludC5yb3csIDBdLCBwb2ludF1cbiAgICBAZWRpdG9yLmJhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlIHBhdHRlcm4sIHNjYW5SYW5nZSwgKHttYXRjaFRleHQsIHJhbmdlLCBzdG9wfSkgLT5cbiAgICAgIGlmIHJhbmdlLmVuZC5pc0VxdWFsKHBvaW50KVxuICAgICAgICBzdG9wKClcbiAgICAgICAgZm91bmQgPSB0cnVlXG4gICAgZm91bmRcblxuICBmaW5kUGFpcjogKHdoaWNoLCBvcHRpb25zLCBmbikgLT5cbiAgICB7ZnJvbSwgcGF0dGVybiwgc2NhbkZ1bmMsIHNjYW5SYW5nZX0gPSBvcHRpb25zXG4gICAgQGVkaXRvcltzY2FuRnVuY10gcGF0dGVybiwgc2NhblJhbmdlLCAoZXZlbnQpID0+XG4gICAgICB7bWF0Y2hUZXh0LCByYW5nZSwgc3RvcH0gPSBldmVudFxuICAgICAgdW5sZXNzIEBhbGxvd05leHRMaW5lIG9yIChmcm9tLnJvdyBpcyByYW5nZS5zdGFydC5yb3cpXG4gICAgICAgIHJldHVybiBzdG9wKClcbiAgICAgIHJldHVybiBpZiBAaXNFc2NhcGVkQ2hhckF0UG9pbnQocmFuZ2Uuc3RhcnQpXG4gICAgICBmbihldmVudClcblxuICBmaW5kT3BlbjogKGZyb20sICBwYXR0ZXJuKSAtPlxuICAgIHNjYW5GdW5jID0gJ2JhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlJ1xuICAgIHNjYW5SYW5nZSA9IG5ldyBSYW5nZShbMCwgMF0sIGZyb20pXG4gICAgc3RhY2sgPSBbXVxuICAgIGZvdW5kID0gbnVsbFxuICAgIEBmaW5kUGFpciAnb3BlbicsIHtmcm9tLCBwYXR0ZXJuLCBzY2FuRnVuYywgc2NhblJhbmdlfSwgKGV2ZW50KSA9PlxuICAgICAge21hdGNoVGV4dCwgcmFuZ2UsIHN0b3B9ID0gZXZlbnRcbiAgICAgIHBhaXJTdGF0ZSA9IEBnZXRQYWlyU3RhdGUoZXZlbnQpXG4gICAgICBpZiBwYWlyU3RhdGUgaXMgJ2Nsb3NlJ1xuICAgICAgICBzdGFjay5wdXNoKHtwYWlyU3RhdGUsIG1hdGNoVGV4dCwgcmFuZ2V9KVxuICAgICAgZWxzZVxuICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICBpZiBzdGFjay5sZW5ndGggaXMgMFxuICAgICAgICAgIGZvdW5kID0gcmFuZ2VcbiAgICAgIHN0b3AoKSBpZiBmb3VuZD9cbiAgICBmb3VuZFxuXG4gIGZpbmRDbG9zZTogKGZyb20sICBwYXR0ZXJuKSAtPlxuICAgIHNjYW5GdW5jID0gJ3NjYW5JbkJ1ZmZlclJhbmdlJ1xuICAgIHNjYW5SYW5nZSA9IG5ldyBSYW5nZShmcm9tLCBAZWRpdG9yLmJ1ZmZlci5nZXRFbmRQb3NpdGlvbigpKVxuICAgIHN0YWNrID0gW11cbiAgICBmb3VuZCA9IG51bGxcbiAgICBAZmluZFBhaXIgJ2Nsb3NlJywge2Zyb20sIHBhdHRlcm4sIHNjYW5GdW5jLCBzY2FuUmFuZ2V9LCAoZXZlbnQpID0+XG4gICAgICB7cmFuZ2UsIHN0b3B9ID0gZXZlbnRcbiAgICAgIHBhaXJTdGF0ZSA9IEBnZXRQYWlyU3RhdGUoZXZlbnQpXG4gICAgICBpZiBwYWlyU3RhdGUgaXMgJ29wZW4nXG4gICAgICAgIHN0YWNrLnB1c2goe3BhaXJTdGF0ZSwgcmFuZ2V9KVxuICAgICAgZWxzZVxuICAgICAgICBlbnRyeSA9IHN0YWNrLnBvcCgpXG4gICAgICAgIGlmIHN0YWNrLmxlbmd0aCBpcyAwXG4gICAgICAgICAgaWYgKG9wZW5TdGFydCA9IGVudHJ5Py5yYW5nZS5zdGFydClcbiAgICAgICAgICAgIGlmIEBhbGxvd0ZvcndhcmRpbmdcbiAgICAgICAgICAgICAgcmV0dXJuIGlmIG9wZW5TdGFydC5yb3cgPiBmcm9tLnJvd1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICByZXR1cm4gaWYgb3BlblN0YXJ0LmlzR3JlYXRlclRoYW4oZnJvbSlcbiAgICAgICAgICBmb3VuZCA9IHJhbmdlXG4gICAgICBzdG9wKCkgaWYgZm91bmQ/XG4gICAgZm91bmRcblxuICBnZXRQYWlySW5mbzogKGZyb20pIC0+XG4gICAgcGFpckluZm8gPSBudWxsXG4gICAgcGF0dGVybiA9IEBnZXRQYXR0ZXJuKClcbiAgICBjbG9zZVJhbmdlID0gQGZpbmRDbG9zZSBmcm9tLCBwYXR0ZXJuXG4gICAgb3BlblJhbmdlID0gQGZpbmRPcGVuIGNsb3NlUmFuZ2UuZW5kLCBwYXR0ZXJuIGlmIGNsb3NlUmFuZ2U/XG5cbiAgICB1bmxlc3MgKG9wZW5SYW5nZT8gYW5kIGNsb3NlUmFuZ2U/KVxuICAgICAgcmV0dXJuIG51bGxcblxuICAgIGFSYW5nZSA9IG5ldyBSYW5nZShvcGVuUmFuZ2Uuc3RhcnQsIGNsb3NlUmFuZ2UuZW5kKVxuICAgIFtpbm5lclN0YXJ0LCBpbm5lckVuZF0gPSBbb3BlblJhbmdlLmVuZCwgY2xvc2VSYW5nZS5zdGFydF1cbiAgICBpZiBAYWRqdXN0SW5uZXJSYW5nZVxuICAgICAgIyBEaXJ0eSB3b3JrIHRvIGZlZWwgbmF0dXJhbCBmb3IgaHVtYW4sIHRvIGJlaGF2ZSBjb21wYXRpYmxlIHdpdGggcHVyZSBWaW0uXG4gICAgICAjIFdoZXJlIHRoaXMgYWRqdXN0bWVudCBhcHBlYXIgaXMgaW4gZm9sbG93aW5nIHNpdHVhdGlvbi5cbiAgICAgICMgb3AtMTogYGNpe2AgcmVwbGFjZSBvbmx5IDJuZCBsaW5lXG4gICAgICAjIG9wLTI6IGBkaXtgIGRlbGV0ZSBvbmx5IDJuZCBsaW5lLlxuICAgICAgIyB0ZXh0OlxuICAgICAgIyAge1xuICAgICAgIyAgICBhYWFcbiAgICAgICMgIH1cbiAgICAgIGlubmVyU3RhcnQgPSBuZXcgUG9pbnQoaW5uZXJTdGFydC5yb3cgKyAxLCAwKSBpZiBwb2ludElzQXRFbmRPZkxpbmUoQGVkaXRvciwgaW5uZXJTdGFydClcbiAgICAgIGlubmVyRW5kID0gbmV3IFBvaW50KGlubmVyRW5kLnJvdywgMCkgaWYgZ2V0VGV4dFRvUG9pbnQoQGVkaXRvciwgaW5uZXJFbmQpLm1hdGNoKC9eXFxzKiQvKVxuICAgICAgaWYgKGlubmVyRW5kLmNvbHVtbiBpcyAwKSBhbmQgKGlubmVyU3RhcnQuY29sdW1uIGlzbnQgMClcbiAgICAgICAgaW5uZXJFbmQgPSBuZXcgUG9pbnQoaW5uZXJFbmQucm93IC0gMSwgSW5maW5pdHkpXG5cbiAgICBpbm5lclJhbmdlID0gbmV3IFJhbmdlKGlubmVyU3RhcnQsIGlubmVyRW5kKVxuICAgIHRhcmdldFJhbmdlID0gaWYgQGlzSW5uZXIoKSB0aGVuIGlubmVyUmFuZ2UgZWxzZSBhUmFuZ2VcbiAgICBpZiBAc2tpcEVtcHR5UGFpciBhbmQgaW5uZXJSYW5nZS5pc0VtcHR5KClcbiAgICAgIEBnZXRQYWlySW5mbyhhUmFuZ2UuZW5kKVxuICAgIGVsc2VcbiAgICAgIHtvcGVuUmFuZ2UsIGNsb3NlUmFuZ2UsIGFSYW5nZSwgaW5uZXJSYW5nZSwgdGFyZ2V0UmFuZ2V9XG5cbiAgZ2V0UG9pbnRUb1NlYXJjaEZyb206IChzZWxlY3Rpb24sIHNlYXJjaEZyb20pIC0+XG4gICAgc3dpdGNoIHNlYXJjaEZyb21cbiAgICAgIHdoZW4gJ2hlYWQnIHRoZW4gQGdldE5vcm1hbGl6ZWRIZWFkQnVmZmVyUG9zaXRpb24oc2VsZWN0aW9uKVxuICAgICAgd2hlbiAnc3RhcnQnIHRoZW4gc3dyYXAoc2VsZWN0aW9uKS5nZXRCdWZmZXJQb3NpdGlvbkZvcignc3RhcnQnKVxuXG4gICMgQWxsb3cgb3ZlcnJpZGUgQGFsbG93Rm9yd2FyZGluZyBieSAybmQgYXJndW1lbnQuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uLCBvcHRpb25zPXt9KSAtPlxuICAgIHthbGxvd0ZvcndhcmRpbmcsIHNlYXJjaEZyb219ID0gb3B0aW9uc1xuICAgIHNlYXJjaEZyb20gPz0gJ2hlYWQnXG4gICAgQGFsbG93Rm9yd2FyZGluZyA9IGFsbG93Rm9yd2FyZGluZyBpZiBhbGxvd0ZvcndhcmRpbmc/XG4gICAgb3JpZ2luYWxSYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgcGFpckluZm8gPSBAZ2V0UGFpckluZm8oQGdldFBvaW50VG9TZWFyY2hGcm9tKHNlbGVjdGlvbiwgc2VhcmNoRnJvbSkpXG4gICAgIyBXaGVuIHJhbmdlIHdhcyBzYW1lLCB0cnkgdG8gZXhwYW5kIHJhbmdlXG4gICAgaWYgcGFpckluZm8/LnRhcmdldFJhbmdlLmlzRXF1YWwob3JpZ2luYWxSYW5nZSlcbiAgICAgIHBhaXJJbmZvID0gQGdldFBhaXJJbmZvKHBhaXJJbmZvLmFSYW5nZS5lbmQpXG4gICAgcGFpckluZm8/LnRhcmdldFJhbmdlXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQW55UGFpciBleHRlbmRzIFBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgYWxsb3dGb3J3YXJkaW5nOiBmYWxzZVxuICBhbGxvd05leHRMaW5lOiBudWxsXG4gIHNraXBFbXB0eVBhaXI6IGZhbHNlXG4gIG1lbWJlcjogW1xuICAgICdEb3VibGVRdW90ZScsICdTaW5nbGVRdW90ZScsICdCYWNrVGljaycsXG4gICAgJ0N1cmx5QnJhY2tldCcsICdBbmdsZUJyYWNrZXQnLCAnVGFnJywgJ1NxdWFyZUJyYWNrZXQnLCAnUGFyZW50aGVzaXMnXG4gIF1cblxuICBnZXRSYW5nZUJ5OiAoa2xhc3MsIHNlbGVjdGlvbikgLT5cbiAgICBvcHRpb25zID0ge0Bpbm5lciwgQHNraXBFbXB0eVBhaXJ9XG4gICAgb3B0aW9ucy5hbGxvd05leHRMaW5lID0gQGFsbG93TmV4dExpbmUgaWYgQGFsbG93TmV4dExpbmU/XG4gICAgQG5ldyhrbGFzcywgb3B0aW9ucykuZ2V0UmFuZ2Uoc2VsZWN0aW9uLCB7QGFsbG93Rm9yd2FyZGluZywgQHNlYXJjaEZyb219KVxuXG4gIGdldFJhbmdlczogKHNlbGVjdGlvbikgLT5cbiAgICAocmFuZ2UgZm9yIGtsYXNzIGluIEBtZW1iZXIgd2hlbiAocmFuZ2UgPSBAZ2V0UmFuZ2VCeShrbGFzcywgc2VsZWN0aW9uKSkpXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcmFuZ2VzID0gQGdldFJhbmdlcyhzZWxlY3Rpb24pXG4gICAgXy5sYXN0KHNvcnRSYW5nZXMocmFuZ2VzKSkgaWYgcmFuZ2VzLmxlbmd0aFxuXG5jbGFzcyBBQW55UGFpciBleHRlbmRzIEFueVBhaXJcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyQW55UGFpciBleHRlbmRzIEFueVBhaXJcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQW55UGFpckFsbG93Rm9yd2FyZGluZyBleHRlbmRzIEFueVBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlc2NyaXB0aW9uOiBcIlJhbmdlIHN1cnJvdW5kZWQgYnkgYXV0by1kZXRlY3RlZCBwYWlyZWQgY2hhcnMgZnJvbSBlbmNsb3NlZCBhbmQgZm9yd2FyZGluZyBhcmVhXCJcbiAgYWxsb3dGb3J3YXJkaW5nOiB0cnVlXG4gIHNraXBFbXB0eVBhaXI6IGZhbHNlXG4gIHNlYXJjaEZyb206ICdzdGFydCdcbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcmFuZ2VzID0gQGdldFJhbmdlcyhzZWxlY3Rpb24pXG4gICAgZnJvbSA9IHNlbGVjdGlvbi5jdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIFtmb3J3YXJkaW5nUmFuZ2VzLCBlbmNsb3NpbmdSYW5nZXNdID0gXy5wYXJ0aXRpb24gcmFuZ2VzLCAocmFuZ2UpIC0+XG4gICAgICByYW5nZS5zdGFydC5pc0dyZWF0ZXJUaGFuT3JFcXVhbChmcm9tKVxuICAgIGVuY2xvc2luZ1JhbmdlID0gXy5sYXN0KHNvcnRSYW5nZXMoZW5jbG9zaW5nUmFuZ2VzKSlcbiAgICBmb3J3YXJkaW5nUmFuZ2VzID0gc29ydFJhbmdlcyhmb3J3YXJkaW5nUmFuZ2VzKVxuXG4gICAgIyBXaGVuIGVuY2xvc2luZ1JhbmdlIGlzIGV4aXN0cyxcbiAgICAjIFdlIGRvbid0IGdvIGFjcm9zcyBlbmNsb3NpbmdSYW5nZS5lbmQuXG4gICAgIyBTbyBjaG9vc2UgZnJvbSByYW5nZXMgY29udGFpbmVkIGluIGVuY2xvc2luZ1JhbmdlLlxuICAgIGlmIGVuY2xvc2luZ1JhbmdlXG4gICAgICBmb3J3YXJkaW5nUmFuZ2VzID0gZm9yd2FyZGluZ1Jhbmdlcy5maWx0ZXIgKHJhbmdlKSAtPlxuICAgICAgICBlbmNsb3NpbmdSYW5nZS5jb250YWluc1JhbmdlKHJhbmdlKVxuXG4gICAgZm9yd2FyZGluZ1Jhbmdlc1swXSBvciBlbmNsb3NpbmdSYW5nZVxuXG5jbGFzcyBBQW55UGFpckFsbG93Rm9yd2FyZGluZyBleHRlbmRzIEFueVBhaXJBbGxvd0ZvcndhcmRpbmdcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyQW55UGFpckFsbG93Rm9yd2FyZGluZyBleHRlbmRzIEFueVBhaXJBbGxvd0ZvcndhcmRpbmdcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQW55UXVvdGUgZXh0ZW5kcyBBbnlQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuICBtZW1iZXI6IFsnRG91YmxlUXVvdGUnLCAnU2luZ2xlUXVvdGUnLCAnQmFja1RpY2snXVxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByYW5nZXMgPSBAZ2V0UmFuZ2VzKHNlbGVjdGlvbilcbiAgICAjIFBpY2sgcmFuZ2Ugd2hpY2ggZW5kLmNvbHVtIGlzIGxlZnRtb3N0KG1lYW4sIGNsb3NlZCBmaXJzdClcbiAgICBfLmZpcnN0KF8uc29ydEJ5KHJhbmdlcywgKHIpIC0+IHIuZW5kLmNvbHVtbikpIGlmIHJhbmdlcy5sZW5ndGhcblxuY2xhc3MgQUFueVF1b3RlIGV4dGVuZHMgQW55UXVvdGVcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyQW55UXVvdGUgZXh0ZW5kcyBBbnlRdW90ZVxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBRdW90ZSBleHRlbmRzIFBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgYWxsb3dGb3J3YXJkaW5nOiB0cnVlXG4gIGFsbG93TmV4dExpbmU6IGZhbHNlXG5cbmNsYXNzIERvdWJsZVF1b3RlIGV4dGVuZHMgUXVvdGVcbiAgQGV4dGVuZChmYWxzZSlcbiAgcGFpcjogWydcIicsICdcIiddXG5cbmNsYXNzIEFEb3VibGVRdW90ZSBleHRlbmRzIERvdWJsZVF1b3RlXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lckRvdWJsZVF1b3RlIGV4dGVuZHMgRG91YmxlUXVvdGVcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgU2luZ2xlUXVvdGUgZXh0ZW5kcyBRdW90ZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBwYWlyOiBbXCInXCIsIFwiJ1wiXVxuXG5jbGFzcyBBU2luZ2xlUXVvdGUgZXh0ZW5kcyBTaW5nbGVRdW90ZVxuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJTaW5nbGVRdW90ZSBleHRlbmRzIFNpbmdsZVF1b3RlXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEJhY2tUaWNrIGV4dGVuZHMgUXVvdGVcbiAgQGV4dGVuZChmYWxzZSlcbiAgcGFpcjogWydgJywgJ2AnXVxuXG5jbGFzcyBBQmFja1RpY2sgZXh0ZW5kcyBCYWNrVGlja1xuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJCYWNrVGljayBleHRlbmRzIEJhY2tUaWNrXG4gIEBleHRlbmQoKVxuXG4jIFBhaXIgZXhwYW5kcyBtdWx0aS1saW5lc1xuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBDdXJseUJyYWNrZXQgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIHBhaXI6IFsneycsICd9J11cbiAgYWxsb3dOZXh0TGluZTogdHJ1ZVxuXG5jbGFzcyBBQ3VybHlCcmFja2V0IGV4dGVuZHMgQ3VybHlCcmFja2V0XG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lckN1cmx5QnJhY2tldCBleHRlbmRzIEN1cmx5QnJhY2tldFxuICBAZXh0ZW5kKClcblxuY2xhc3MgQUN1cmx5QnJhY2tldEFsbG93Rm9yd2FyZGluZyBleHRlbmRzIEN1cmx5QnJhY2tldFxuICBAZXh0ZW5kKClcbiAgYWxsb3dGb3J3YXJkaW5nOiB0cnVlXG5cbmNsYXNzIElubmVyQ3VybHlCcmFja2V0QWxsb3dGb3J3YXJkaW5nIGV4dGVuZHMgQ3VybHlCcmFja2V0XG4gIEBleHRlbmQoKVxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTcXVhcmVCcmFja2V0IGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBwYWlyOiBbJ1snLCAnXSddXG4gIGFsbG93TmV4dExpbmU6IHRydWVcblxuY2xhc3MgQVNxdWFyZUJyYWNrZXQgZXh0ZW5kcyBTcXVhcmVCcmFja2V0XG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lclNxdWFyZUJyYWNrZXQgZXh0ZW5kcyBTcXVhcmVCcmFja2V0XG4gIEBleHRlbmQoKVxuXG5jbGFzcyBBU3F1YXJlQnJhY2tldEFsbG93Rm9yd2FyZGluZyBleHRlbmRzIFNxdWFyZUJyYWNrZXRcbiAgQGV4dGVuZCgpXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuXG5jbGFzcyBJbm5lclNxdWFyZUJyYWNrZXRBbGxvd0ZvcndhcmRpbmcgZXh0ZW5kcyBTcXVhcmVCcmFja2V0XG4gIEBleHRlbmQoKVxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBQYXJlbnRoZXNpcyBleHRlbmRzIFBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgcGFpcjogWycoJywgJyknXVxuICBhbGxvd05leHRMaW5lOiB0cnVlXG5cbmNsYXNzIEFQYXJlbnRoZXNpcyBleHRlbmRzIFBhcmVudGhlc2lzXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lclBhcmVudGhlc2lzIGV4dGVuZHMgUGFyZW50aGVzaXNcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIEFQYXJlbnRoZXNpc0FsbG93Rm9yd2FyZGluZyBleHRlbmRzIFBhcmVudGhlc2lzXG4gIEBleHRlbmQoKVxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcblxuY2xhc3MgSW5uZXJQYXJlbnRoZXNpc0FsbG93Rm9yd2FyZGluZyBleHRlbmRzIFBhcmVudGhlc2lzXG4gIEBleHRlbmQoKVxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBBbmdsZUJyYWNrZXQgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIHBhaXI6IFsnPCcsICc+J11cblxuY2xhc3MgQUFuZ2xlQnJhY2tldCBleHRlbmRzIEFuZ2xlQnJhY2tldFxuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJBbmdsZUJyYWNrZXQgZXh0ZW5kcyBBbmdsZUJyYWNrZXRcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIEFBbmdsZUJyYWNrZXRBbGxvd0ZvcndhcmRpbmcgZXh0ZW5kcyBBbmdsZUJyYWNrZXRcbiAgQGV4dGVuZCgpXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuXG5jbGFzcyBJbm5lckFuZ2xlQnJhY2tldEFsbG93Rm9yd2FyZGluZyBleHRlbmRzIEFuZ2xlQnJhY2tldFxuICBAZXh0ZW5kKClcbiAgYWxsb3dGb3J3YXJkaW5nOiB0cnVlXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxudGFnUGF0dGVybiA9IC8oPChcXC8/KSkoW15cXHM+XSspW14+XSo+L2dcbmNsYXNzIFRhZyBleHRlbmRzIFBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgYWxsb3dOZXh0TGluZTogdHJ1ZVxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcbiAgYWRqdXN0SW5uZXJSYW5nZTogZmFsc2VcbiAgZ2V0UGF0dGVybjogLT5cbiAgICB0YWdQYXR0ZXJuXG5cbiAgZ2V0UGFpclN0YXRlOiAoe21hdGNoLCBtYXRjaFRleHR9KSAtPlxuICAgIFtfXywgX18sIHNsYXNoLCB0YWdOYW1lXSA9IG1hdGNoXG4gICAgaWYgc2xhc2ggaXMgJydcbiAgICAgIFsnb3BlbicsIHRhZ05hbWVdXG4gICAgZWxzZVxuICAgICAgWydjbG9zZScsIHRhZ05hbWVdXG5cbiAgZ2V0VGFnU3RhcnRQb2ludDogKGZyb20pIC0+XG4gICAgdGFnUmFuZ2UgPSBudWxsXG4gICAgc2NhblJhbmdlID0gQGVkaXRvci5idWZmZXJSYW5nZUZvckJ1ZmZlclJvdyhmcm9tLnJvdylcbiAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIHRhZ1BhdHRlcm4sIHNjYW5SYW5nZSwgKHtyYW5nZSwgc3RvcH0pIC0+XG4gICAgICBpZiByYW5nZS5jb250YWluc1BvaW50KGZyb20sIHRydWUpXG4gICAgICAgIHRhZ1JhbmdlID0gcmFuZ2VcbiAgICAgICAgc3RvcCgpXG4gICAgdGFnUmFuZ2U/LnN0YXJ0ID8gZnJvbVxuXG4gIGZpbmRUYWdTdGF0ZTogKHN0YWNrLCB0YWdTdGF0ZSkgLT5cbiAgICByZXR1cm4gbnVsbCBpZiBzdGFjay5sZW5ndGggaXMgMFxuICAgIGZvciBpIGluIFsoc3RhY2subGVuZ3RoIC0gMSkuLjBdXG4gICAgICBlbnRyeSA9IHN0YWNrW2ldXG4gICAgICBpZiBlbnRyeS50YWdTdGF0ZSBpcyB0YWdTdGF0ZVxuICAgICAgICByZXR1cm4gZW50cnlcbiAgICBudWxsXG5cbiAgZmluZE9wZW46IChmcm9tLCAgcGF0dGVybikgLT5cbiAgICBzY2FuRnVuYyA9ICdiYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSdcbiAgICBzY2FuUmFuZ2UgPSBuZXcgUmFuZ2UoWzAsIDBdLCBmcm9tKVxuICAgIHN0YWNrID0gW11cbiAgICBmb3VuZCA9IG51bGxcbiAgICBAZmluZFBhaXIgJ29wZW4nLCB7ZnJvbSwgcGF0dGVybiwgc2NhbkZ1bmMsIHNjYW5SYW5nZX0sIChldmVudCkgPT5cbiAgICAgIHtyYW5nZSwgc3RvcH0gPSBldmVudFxuICAgICAgW3BhaXJTdGF0ZSwgdGFnTmFtZV0gPSBAZ2V0UGFpclN0YXRlKGV2ZW50KVxuICAgICAgaWYgcGFpclN0YXRlIGlzICdjbG9zZSdcbiAgICAgICAgdGFnU3RhdGUgPSBwYWlyU3RhdGUgKyB0YWdOYW1lXG4gICAgICAgIHN0YWNrLnB1c2goe3RhZ1N0YXRlLCByYW5nZX0pXG4gICAgICBlbHNlXG4gICAgICAgIGlmIGVudHJ5ID0gQGZpbmRUYWdTdGF0ZShzdGFjaywgXCJjbG9zZSN7dGFnTmFtZX1cIilcbiAgICAgICAgICBzdGFjayA9IHN0YWNrWzAuLi5zdGFjay5pbmRleE9mKGVudHJ5KV1cbiAgICAgICAgaWYgc3RhY2subGVuZ3RoIGlzIDBcbiAgICAgICAgICBmb3VuZCA9IHJhbmdlXG4gICAgICBzdG9wKCkgaWYgZm91bmQ/XG4gICAgZm91bmRcblxuICBmaW5kQ2xvc2U6IChmcm9tLCAgcGF0dGVybikgLT5cbiAgICBzY2FuRnVuYyA9ICdzY2FuSW5CdWZmZXJSYW5nZSdcbiAgICBmcm9tID0gQGdldFRhZ1N0YXJ0UG9pbnQoZnJvbSlcbiAgICBzY2FuUmFuZ2UgPSBuZXcgUmFuZ2UoZnJvbSwgQGVkaXRvci5idWZmZXIuZ2V0RW5kUG9zaXRpb24oKSlcbiAgICBzdGFjayA9IFtdXG4gICAgZm91bmQgPSBudWxsXG4gICAgQGZpbmRQYWlyICdjbG9zZScsIHtmcm9tLCBwYXR0ZXJuLCBzY2FuRnVuYywgc2NhblJhbmdlfSwgKGV2ZW50KSA9PlxuICAgICAge3JhbmdlLCBzdG9wfSA9IGV2ZW50XG4gICAgICBbcGFpclN0YXRlLCB0YWdOYW1lXSA9IEBnZXRQYWlyU3RhdGUoZXZlbnQpXG4gICAgICBpZiBwYWlyU3RhdGUgaXMgJ29wZW4nXG4gICAgICAgIHRhZ1N0YXRlID0gcGFpclN0YXRlICsgdGFnTmFtZVxuICAgICAgICBzdGFjay5wdXNoKHt0YWdTdGF0ZSwgcmFuZ2V9KVxuICAgICAgZWxzZVxuICAgICAgICBpZiBlbnRyeSA9IEBmaW5kVGFnU3RhdGUoc3RhY2ssIFwib3BlbiN7dGFnTmFtZX1cIilcbiAgICAgICAgICBzdGFjayA9IHN0YWNrWzAuLi5zdGFjay5pbmRleE9mKGVudHJ5KV1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICMgSSdtIHZlcnkgdG9yZWxhbnQgZm9yIG9ycGhhbiB0YWcgbGlrZSAnYnInLCAnaHInLCBvciB1bmNsb3NlZCB0YWcuXG4gICAgICAgICAgc3RhY2sgPSBbXVxuICAgICAgICBpZiBzdGFjay5sZW5ndGggaXMgMFxuICAgICAgICAgIGlmIChvcGVuU3RhcnQgPSBlbnRyeT8ucmFuZ2Uuc3RhcnQpXG4gICAgICAgICAgICBpZiBAYWxsb3dGb3J3YXJkaW5nXG4gICAgICAgICAgICAgIHJldHVybiBpZiBvcGVuU3RhcnQucm93ID4gZnJvbS5yb3dcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgcmV0dXJuIGlmIG9wZW5TdGFydC5pc0dyZWF0ZXJUaGFuKGZyb20pXG4gICAgICAgICAgZm91bmQgPSByYW5nZVxuICAgICAgc3RvcCgpIGlmIGZvdW5kP1xuICAgIGZvdW5kXG5cbmNsYXNzIEFUYWcgZXh0ZW5kcyBUYWdcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyVGFnIGV4dGVuZHMgVGFnXG4gIEBleHRlbmQoKVxuXG4jIFBhcmFncmFwaFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFBhcmFncmFwaCBpcyBkZWZpbmVkIGFzIGNvbnNlY3V0aXZlIChub24tKWJsYW5rLWxpbmUuXG5jbGFzcyBQYXJhZ3JhcGggZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG5cbiAgZmluZFJvdzogKGZyb21Sb3csIGRpcmVjdGlvbiwgZm4pIC0+XG4gICAgZm4ucmVzZXQ/KClcbiAgICBmb3VuZFJvdyA9IGZyb21Sb3dcbiAgICBmb3Igcm93IGluIGdldEJ1ZmZlclJvd3MoQGVkaXRvciwge3N0YXJ0Um93OiBmcm9tUm93LCBkaXJlY3Rpb259KVxuICAgICAgYnJlYWsgdW5sZXNzIGZuKHJvdywgZGlyZWN0aW9uKVxuICAgICAgZm91bmRSb3cgPSByb3dcblxuICAgIGZvdW5kUm93XG5cbiAgZmluZFJvd1JhbmdlQnk6IChmcm9tUm93LCBmbikgLT5cbiAgICBzdGFydFJvdyA9IEBmaW5kUm93KGZyb21Sb3csICdwcmV2aW91cycsIGZuKVxuICAgIGVuZFJvdyA9IEBmaW5kUm93KGZyb21Sb3csICduZXh0JywgZm4pXG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddXG5cbiAgZ2V0UHJlZGljdEZ1bmN0aW9uOiAoZnJvbVJvdywgc2VsZWN0aW9uKSAtPlxuICAgIGZyb21Sb3dSZXN1bHQgPSBAZWRpdG9yLmlzQnVmZmVyUm93QmxhbmsoZnJvbVJvdylcblxuICAgIGlmIEBpc0lubmVyKClcbiAgICAgIHByZWRpY3QgPSAocm93LCBkaXJlY3Rpb24pID0+XG4gICAgICAgIEBlZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpIGlzIGZyb21Sb3dSZXN1bHRcbiAgICBlbHNlXG4gICAgICBpZiBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG4gICAgICAgIGRpcmVjdGlvblRvRXh0ZW5kID0gJ3ByZXZpb3VzJ1xuICAgICAgZWxzZVxuICAgICAgICBkaXJlY3Rpb25Ub0V4dGVuZCA9ICduZXh0J1xuXG4gICAgICBmbGlwID0gZmFsc2VcbiAgICAgIHByZWRpY3QgPSAocm93LCBkaXJlY3Rpb24pID0+XG4gICAgICAgIHJlc3VsdCA9IEBlZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpIGlzIGZyb21Sb3dSZXN1bHRcbiAgICAgICAgaWYgZmxpcFxuICAgICAgICAgIG5vdCByZXN1bHRcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGlmIChub3QgcmVzdWx0KSBhbmQgKGRpcmVjdGlvbiBpcyBkaXJlY3Rpb25Ub0V4dGVuZClcbiAgICAgICAgICAgIGZsaXAgPSB0cnVlXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIHJlc3VsdFxuXG4gICAgICBwcmVkaWN0LnJlc2V0ID0gLT5cbiAgICAgICAgZmxpcCA9IGZhbHNlXG4gICAgcHJlZGljdFxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIGZyb21Sb3cgPSBAZ2V0Tm9ybWFsaXplZEhlYWRCdWZmZXJQb3NpdGlvbihzZWxlY3Rpb24pLnJvd1xuXG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJywgJ2xpbmV3aXNlJylcbiAgICAgIGlmIHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgICAgZnJvbVJvdy0tXG4gICAgICBlbHNlXG4gICAgICAgIGZyb21Sb3crK1xuICAgICAgZnJvbVJvdyA9IGdldFZhbGlkVmltQnVmZmVyUm93KEBlZGl0b3IsIGZyb21Sb3cpXG5cbiAgICByb3dSYW5nZSA9IEBmaW5kUm93UmFuZ2VCeShmcm9tUm93LCBAZ2V0UHJlZGljdEZ1bmN0aW9uKGZyb21Sb3csIHNlbGVjdGlvbikpXG4gICAgc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkudW5pb24oZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShAZWRpdG9yLCByb3dSYW5nZSkpXG5cbmNsYXNzIEFQYXJhZ3JhcGggZXh0ZW5kcyBQYXJhZ3JhcGhcbiAgQGV4dGVuZCgpXG5cbmNsYXNzIElubmVyUGFyYWdyYXBoIGV4dGVuZHMgUGFyYWdyYXBoXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEluZGVudGF0aW9uIGV4dGVuZHMgUGFyYWdyYXBoXG4gIEBleHRlbmQoZmFsc2UpXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgZnJvbVJvdyA9IEBnZXROb3JtYWxpemVkSGVhZEJ1ZmZlclBvc2l0aW9uKHNlbGVjdGlvbikucm93XG5cbiAgICBiYXNlSW5kZW50TGV2ZWwgPSBnZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvdyhAZWRpdG9yLCBmcm9tUm93KVxuICAgIHByZWRpY3QgPSAocm93KSA9PlxuICAgICAgaWYgQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdylcbiAgICAgICAgQGlzQSgpXG4gICAgICBlbHNlXG4gICAgICAgIGdldEluZGVudExldmVsRm9yQnVmZmVyUm93KEBlZGl0b3IsIHJvdykgPj0gYmFzZUluZGVudExldmVsXG5cbiAgICByb3dSYW5nZSA9IEBmaW5kUm93UmFuZ2VCeShmcm9tUm93LCBwcmVkaWN0KVxuICAgIGdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2UoQGVkaXRvciwgcm93UmFuZ2UpXG5cbmNsYXNzIEFJbmRlbnRhdGlvbiBleHRlbmRzIEluZGVudGF0aW9uXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lckluZGVudGF0aW9uIGV4dGVuZHMgSW5kZW50YXRpb25cbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQ29tbWVudCBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByb3cgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydC5yb3dcbiAgICByb3dSYW5nZSA9IEBlZGl0b3IubGFuZ3VhZ2VNb2RlLnJvd1JhbmdlRm9yQ29tbWVudEF0QnVmZmVyUm93KHJvdylcbiAgICByb3dSYW5nZSA/PSBbcm93LCByb3ddIGlmIEBlZGl0b3IuaXNCdWZmZXJSb3dDb21tZW50ZWQocm93KVxuXG4gICAgaWYgcm93UmFuZ2VcbiAgICAgIGdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2Uoc2VsZWN0aW9uLmVkaXRvciwgcm93UmFuZ2UpXG5cbmNsYXNzIEFDb21tZW50IGV4dGVuZHMgQ29tbWVudFxuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJDb21tZW50IGV4dGVuZHMgQ29tbWVudFxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBGb2xkIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuXG4gIGFkanVzdFJvd1JhbmdlOiAoW3N0YXJ0Um93LCBlbmRSb3ddKSAtPlxuICAgIHJldHVybiBbc3RhcnRSb3csIGVuZFJvd10gdW5sZXNzIEBpc0lubmVyKClcbiAgICBzdGFydFJvd0luZGVudExldmVsID0gZ2V0SW5kZW50TGV2ZWxGb3JCdWZmZXJSb3coQGVkaXRvciwgc3RhcnRSb3cpXG4gICAgZW5kUm93SW5kZW50TGV2ZWwgPSBnZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvdyhAZWRpdG9yLCBlbmRSb3cpXG4gICAgZW5kUm93IC09IDEgaWYgKHN0YXJ0Um93SW5kZW50TGV2ZWwgaXMgZW5kUm93SW5kZW50TGV2ZWwpXG4gICAgc3RhcnRSb3cgKz0gMVxuICAgIFtzdGFydFJvdywgZW5kUm93XVxuXG4gIGdldEZvbGRSb3dSYW5nZXNDb250YWluc0ZvclJvdzogKHJvdykgLT5cbiAgICBnZXRDb2RlRm9sZFJvd1Jhbmdlc0NvbnRhaW5lc0ZvclJvdyhAZWRpdG9yLCByb3csIGluY2x1ZGVTdGFydFJvdzogZmFsc2UpPy5yZXZlcnNlKClcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgcm93UmFuZ2VzID0gQGdldEZvbGRSb3dSYW5nZXNDb250YWluc0ZvclJvdyhyYW5nZS5zdGFydC5yb3cpXG4gICAgcmV0dXJuIHVubGVzcyByb3dSYW5nZXMubGVuZ3RoXG5cbiAgICBpZiAocm93UmFuZ2UgPSByb3dSYW5nZXMuc2hpZnQoKSk/XG4gICAgICByb3dSYW5nZSA9IEBhZGp1c3RSb3dSYW5nZShyb3dSYW5nZSlcbiAgICAgIHRhcmdldFJhbmdlID0gZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShAZWRpdG9yLCByb3dSYW5nZSlcbiAgICAgIGlmIHRhcmdldFJhbmdlLmlzRXF1YWwocmFuZ2UpIGFuZCByb3dSYW5nZXMubGVuZ3RoXG4gICAgICAgIHJvd1JhbmdlID0gQGFkanVzdFJvd1JhbmdlKHJvd1Jhbmdlcy5zaGlmdCgpKVxuXG4gICAgZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShAZWRpdG9yLCByb3dSYW5nZSlcblxuY2xhc3MgQUZvbGQgZXh0ZW5kcyBGb2xkXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lckZvbGQgZXh0ZW5kcyBGb2xkXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgTk9URTogRnVuY3Rpb24gcmFuZ2UgZGV0ZXJtaW5hdGlvbiBpcyBkZXBlbmRpbmcgb24gZm9sZC5cbmNsYXNzIEZ1bmN0aW9uIGV4dGVuZHMgRm9sZFxuICBAZXh0ZW5kKGZhbHNlKVxuXG4gICMgU29tZSBsYW5ndWFnZSBkb24ndCBpbmNsdWRlIGNsb3NpbmcgYH1gIGludG8gZm9sZC5cbiAgb21pdHRpbmdDbG9zaW5nQ2hhckxhbmd1YWdlczogWydnbyddXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIEBsYW5ndWFnZSA9IEBlZGl0b3IuZ2V0R3JhbW1hcigpLnNjb3BlTmFtZS5yZXBsYWNlKC9ec291cmNlXFwuLywgJycpXG5cbiAgZ2V0Rm9sZFJvd1Jhbmdlc0NvbnRhaW5zRm9yUm93OiAocm93KSAtPlxuICAgIHJvd1JhbmdlcyA9IGdldENvZGVGb2xkUm93UmFuZ2VzQ29udGFpbmVzRm9yUm93KEBlZGl0b3IsIHJvdyk/LnJldmVyc2UoKVxuICAgIHJvd1Jhbmdlcz8uZmlsdGVyIChyb3dSYW5nZSkgPT5cbiAgICAgIGlzSW5jbHVkZUZ1bmN0aW9uU2NvcGVGb3JSb3coQGVkaXRvciwgcm93UmFuZ2VbMF0pXG5cbiAgYWRqdXN0Um93UmFuZ2U6IChyb3dSYW5nZSkgLT5cbiAgICBbc3RhcnRSb3csIGVuZFJvd10gPSBzdXBlclxuICAgIGlmIEBpc0EoKSBhbmQgKEBsYW5ndWFnZSBpbiBAb21pdHRpbmdDbG9zaW5nQ2hhckxhbmd1YWdlcylcbiAgICAgIGVuZFJvdyArPSAxXG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddXG5cbmNsYXNzIEFGdW5jdGlvbiBleHRlbmRzIEZ1bmN0aW9uXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBJbm5lckZ1bmN0aW9uIGV4dGVuZHMgRnVuY3Rpb25cbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQ3VycmVudExpbmUgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIHJvdyA9IEBnZXROb3JtYWxpemVkSGVhZEJ1ZmZlclBvc2l0aW9uKHNlbGVjdGlvbikucm93XG4gICAgcmFuZ2UgPSBAZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHJvdylcbiAgICBpZiBAaXNBKClcbiAgICAgIHJhbmdlXG4gICAgZWxzZVxuICAgICAgdHJpbVJhbmdlKEBlZGl0b3IsIHJhbmdlKVxuXG5jbGFzcyBBQ3VycmVudExpbmUgZXh0ZW5kcyBDdXJyZW50TGluZVxuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJDdXJyZW50TGluZSBleHRlbmRzIEN1cnJlbnRMaW5lXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEVudGlyZSBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgQHN0b3BTZWxlY3Rpb24oKVxuICAgIEBlZGl0b3IuYnVmZmVyLmdldFJhbmdlKClcblxuY2xhc3MgQUVudGlyZSBleHRlbmRzIEVudGlyZVxuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJFbnRpcmUgZXh0ZW5kcyBFbnRpcmVcbiAgQGV4dGVuZCgpXG5cbiMgQWxpYXMgYXMgYWNjZXNzaWJsZSBuYW1lXG5jbGFzcyBBbGwgZXh0ZW5kcyBFbnRpcmVcbiAgQGV4dGVuZChmYWxzZSlcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBFbXB0eSBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBMYXRlc3RDaGFuZ2UgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIGdldFJhbmdlOiAtPlxuICAgIEBzdG9wU2VsZWN0aW9uKClcbiAgICBAdmltU3RhdGUubWFyay5nZXRSYW5nZSgnWycsICddJylcblxuY2xhc3MgQUxhdGVzdENoYW5nZSBleHRlbmRzIExhdGVzdENoYW5nZVxuICBAZXh0ZW5kKClcblxuIyBObyBkaWZmIGZyb20gQUxhdGVzdENoYW5nZVxuY2xhc3MgSW5uZXJMYXRlc3RDaGFuZ2UgZXh0ZW5kcyBMYXRlc3RDaGFuZ2VcbiAgQGV4dGVuZCgpXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgU2VhcmNoTWF0Y2hGb3J3YXJkIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKClcbiAgYmFja3dhcmQ6IGZhbHNlXG5cbiAgZmluZE1hdGNoOiAoZnJvbVBvaW50LCBwYXR0ZXJuKSAtPlxuICAgIGZyb21Qb2ludCA9IHRyYW5zbGF0ZVBvaW50QW5kQ2xpcChAZWRpdG9yLCBmcm9tUG9pbnQsIFwiZm9yd2FyZFwiKSBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgIHNjYW5SYW5nZSA9IFtbZnJvbVBvaW50LnJvdywgMF0sIEBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbigpXVxuICAgIGZvdW5kID0gbnVsbFxuICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgcGF0dGVybiwgc2NhblJhbmdlLCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgIGlmIHJhbmdlLmVuZC5pc0dyZWF0ZXJUaGFuKGZyb21Qb2ludClcbiAgICAgICAgZm91bmQgPSByYW5nZVxuICAgICAgICBzdG9wKClcbiAgICB7cmFuZ2U6IGZvdW5kLCB3aGljaElzSGVhZDogJ2VuZCd9XG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcGF0dGVybiA9IEBnbG9iYWxTdGF0ZS5nZXQoJ2xhc3RTZWFyY2hQYXR0ZXJuJylcbiAgICByZXR1cm4gdW5sZXNzIHBhdHRlcm4/XG5cbiAgICBmcm9tUG9pbnQgPSBzZWxlY3Rpb24uZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcbiAgICB7cmFuZ2UsIHdoaWNoSXNIZWFkfSA9IEBmaW5kTWF0Y2goZnJvbVBvaW50LCBwYXR0ZXJuKVxuICAgIGlmIHJhbmdlP1xuICAgICAgQHVuaW9uUmFuZ2VBbmREZXRlcm1pbmVSZXZlcnNlZFN0YXRlKHNlbGVjdGlvbiwgcmFuZ2UsIHdoaWNoSXNIZWFkKVxuXG4gIHVuaW9uUmFuZ2VBbmREZXRlcm1pbmVSZXZlcnNlZFN0YXRlOiAoc2VsZWN0aW9uLCBmb3VuZCwgd2hpY2hJc0hlYWQpIC0+XG4gICAgaWYgc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgZm91bmRcbiAgICBlbHNlXG4gICAgICBoZWFkID0gZm91bmRbd2hpY2hJc0hlYWRdXG4gICAgICB0YWlsID0gc2VsZWN0aW9uLmdldFRhaWxCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAgIGlmIEBiYWNrd2FyZFxuICAgICAgICBoZWFkID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKEBlZGl0b3IsIGhlYWQsICdmb3J3YXJkJykgaWYgdGFpbC5pc0xlc3NUaGFuKGhlYWQpXG4gICAgICBlbHNlXG4gICAgICAgIGhlYWQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAoQGVkaXRvciwgaGVhZCwgJ2JhY2t3YXJkJykgaWYgaGVhZC5pc0xlc3NUaGFuKHRhaWwpXG5cbiAgICAgIEByZXZlcnNlZCA9IGhlYWQuaXNMZXNzVGhhbih0YWlsKVxuICAgICAgbmV3IFJhbmdlKHRhaWwsIGhlYWQpLnVuaW9uKHN3cmFwKHNlbGVjdGlvbikuZ2V0VGFpbEJ1ZmZlclJhbmdlKCkpXG5cbiAgc2VsZWN0VGV4dE9iamVjdDogKHNlbGVjdGlvbikgLT5cbiAgICByZXR1cm4gdW5sZXNzIHJhbmdlID0gQGdldFJhbmdlKHNlbGVjdGlvbilcbiAgICByZXZlcnNlZCA9IEByZXZlcnNlZCA/IEBiYWNrd2FyZFxuICAgIHN3cmFwKHNlbGVjdGlvbikuc2V0QnVmZmVyUmFuZ2UocmFuZ2UsIHtyZXZlcnNlZH0pXG4gICAgc2VsZWN0aW9uLmN1cnNvci5hdXRvc2Nyb2xsKClcblxuY2xhc3MgU2VhcmNoTWF0Y2hCYWNrd2FyZCBleHRlbmRzIFNlYXJjaE1hdGNoRm9yd2FyZFxuICBAZXh0ZW5kKClcbiAgYmFja3dhcmQ6IHRydWVcblxuICBmaW5kTWF0Y2g6IChmcm9tUG9pbnQsIHBhdHRlcm4pIC0+XG4gICAgZnJvbVBvaW50ID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKEBlZGl0b3IsIGZyb21Qb2ludCwgXCJiYWNrd2FyZFwiKSBpZiBAaXNNb2RlKCd2aXN1YWwnKVxuICAgIHNjYW5SYW5nZSA9IFtbZnJvbVBvaW50LnJvdywgSW5maW5pdHldLCBbMCwgMF1dXG4gICAgZm91bmQgPSBudWxsXG4gICAgQGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSBwYXR0ZXJuLCBzY2FuUmFuZ2UsICh7cmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgaWYgcmFuZ2Uuc3RhcnQuaXNMZXNzVGhhbihmcm9tUG9pbnQpXG4gICAgICAgIGZvdW5kID0gcmFuZ2VcbiAgICAgICAgc3RvcCgpXG4gICAge3JhbmdlOiBmb3VuZCwgd2hpY2hJc0hlYWQ6ICdzdGFydCd9XG5cbiMgW0xpbWl0YXRpb246IHdvbid0IGZpeF06IFNlbGVjdGVkIHJhbmdlIGlzIG5vdCBzdWJtb2RlIGF3YXJlLiBhbHdheXMgY2hhcmFjdGVyd2lzZS5cbiMgU28gZXZlbiBpZiBvcmlnaW5hbCBzZWxlY3Rpb24gd2FzIHZMIG9yIHZCLCBzZWxlY3RlZCByYW5nZSBieSB0aGlzIHRleHQtb2JqZWN0XG4jIGlzIGFsd2F5cyB2QyByYW5nZS5cbmNsYXNzIFByZXZpb3VzU2VsZWN0aW9uIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKClcbiAgc2VsZWN0OiAtPlxuICAgIHtwcm9wZXJ0aWVzLCBAc3VibW9kZX0gPSBAdmltU3RhdGUucHJldmlvdXNTZWxlY3Rpb25cbiAgICBpZiBwcm9wZXJ0aWVzPyBhbmQgQHN1Ym1vZGU/XG4gICAgICBzZWxlY3Rpb24gPSBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKVxuICAgICAgc3dyYXAoc2VsZWN0aW9uKS5zZWxlY3RCeVByb3BlcnRpZXMocHJvcGVydGllcylcblxuY2xhc3MgUGVyc2lzdGVudFNlbGVjdGlvbiBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcblxuICBzZWxlY3Q6IC0+XG4gICAgcmFuZ2VzID0gQHZpbVN0YXRlLnBlcnNpc3RlbnRTZWxlY3Rpb24uZ2V0TWFya2VyQnVmZmVyUmFuZ2VzKClcbiAgICBpZiByYW5nZXMubGVuZ3RoXG4gICAgICBAZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKHJhbmdlcylcbiAgICBAdmltU3RhdGUuY2xlYXJQZXJzaXN0ZW50U2VsZWN0aW9ucygpXG5cbmNsYXNzIEFQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgUGVyc2lzdGVudFNlbGVjdGlvblxuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgUGVyc2lzdGVudFNlbGVjdGlvblxuICBAZXh0ZW5kKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBWaXNpYmxlQXJlYSBleHRlbmRzIFRleHRPYmplY3QgIyA4MjIgdG8gODYzXG4gIEBleHRlbmQoZmFsc2UpXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgQHN0b3BTZWxlY3Rpb24oKVxuICAgICMgW0JVRz9dIE5lZWQgdHJhbnNsYXRlIHRvIHNoaWxuayB0b3AgYW5kIGJvdHRvbSB0byBmaXQgYWN0dWFsIHJvdy5cbiAgICAjIFRoZSByZWFzb24gSSBuZWVkIC0yIGF0IGJvdHRvbSBpcyBiZWNhdXNlIG9mIHN0YXR1cyBiYXI/XG4gICAgZ2V0VmlzaWJsZUJ1ZmZlclJhbmdlKEBlZGl0b3IpLnRyYW5zbGF0ZShbKzEsIDBdLCBbLTMsIDBdKVxuXG5jbGFzcyBBVmlzaWJsZUFyZWEgZXh0ZW5kcyBWaXNpYmxlQXJlYVxuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJWaXNpYmxlQXJlYSBleHRlbmRzIFZpc2libGVBcmVhXG4gIEBleHRlbmQoKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgW0ZJWE1FXSB3aXNlIG1pc21hdGNoIHNjZWVuUG9zaXRpb24gdnMgYnVmZmVyUG9zaXRpb25cbmNsYXNzIEVkZ2UgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG5cbiAgc2VsZWN0OiAtPlxuICAgIEBzdWNjZXNzID0gbnVsbFxuXG4gICAgc3VwZXJcblxuICAgIEB2aW1TdGF0ZS5hY3RpdmF0ZSgndmlzdWFsJywgJ2xpbmV3aXNlJykgaWYgQHN1Y2Nlc3NcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBmcm9tUG9pbnQgPSBAZ2V0Tm9ybWFsaXplZEhlYWRTY3JlZW5Qb3NpdGlvbihzZWxlY3Rpb24pXG5cbiAgICBtb3ZlVXBUb0VkZ2UgPSBAbmV3KCdNb3ZlVXBUb0VkZ2UnKVxuICAgIG1vdmVEb3duVG9FZGdlID0gQG5ldygnTW92ZURvd25Ub0VkZ2UnKVxuICAgIHJldHVybiB1bmxlc3MgbW92ZVVwVG9FZGdlLmlzU3RvcHBhYmxlUG9pbnQoZnJvbVBvaW50KVxuXG4gICAgc3RhcnRTY3JlZW5Qb2ludCA9IGVuZFNjcmVlblBvaW50ID0gbnVsbFxuICAgIHN0YXJ0U2NyZWVuUG9pbnQgPSBlbmRTY3JlZW5Qb2ludCA9IGZyb21Qb2ludCBpZiBtb3ZlVXBUb0VkZ2UuaXNFZGdlKGZyb21Qb2ludClcblxuICAgIGlmIG1vdmVVcFRvRWRnZS5pc1N0b3BwYWJsZVBvaW50KGZyb21Qb2ludC50cmFuc2xhdGUoWy0xLCAwXSkpXG4gICAgICBzdGFydFNjcmVlblBvaW50ID0gbW92ZVVwVG9FZGdlLmdldFBvaW50KGZyb21Qb2ludClcblxuICAgIGlmIG1vdmVEb3duVG9FZGdlLmlzU3RvcHBhYmxlUG9pbnQoZnJvbVBvaW50LnRyYW5zbGF0ZShbKzEsIDBdKSlcbiAgICAgIGVuZFNjcmVlblBvaW50ID0gbW92ZURvd25Ub0VkZ2UuZ2V0UG9pbnQoZnJvbVBvaW50KVxuXG4gICAgaWYgc3RhcnRTY3JlZW5Qb2ludD8gYW5kIGVuZFNjcmVlblBvaW50P1xuICAgICAgQHN1Y2Nlc3MgPz0gdHJ1ZVxuICAgICAgc2NyZWVuUmFuZ2UgPSBuZXcgUmFuZ2Uoc3RhcnRTY3JlZW5Qb2ludCwgZW5kU2NyZWVuUG9pbnQpXG4gICAgICByYW5nZSA9IEBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JTY3JlZW5SYW5nZShzY3JlZW5SYW5nZSlcbiAgICAgIGdldFJhbmdlQnlUcmFuc2xhdGVQb2ludEFuZENsaXAoQGVkaXRvciwgcmFuZ2UsICdlbmQnLCAnZm9yd2FyZCcpXG5cbmNsYXNzIEFFZGdlIGV4dGVuZHMgRWRnZVxuICBAZXh0ZW5kKClcblxuY2xhc3MgSW5uZXJFZGdlIGV4dGVuZHMgRWRnZVxuICBAZXh0ZW5kKClcblxuIyBNZXRhIHRleHQgb2JqZWN0XG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFVuaW9uVGV4dE9iamVjdCBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgbWVtYmVyOiBbXVxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIHVuaW9uUmFuZ2UgPSBudWxsXG4gICAgZm9yIG1lbWJlciBpbiBAbWVtYmVyIHdoZW4gcmFuZ2UgPSBAbmV3KG1lbWJlcikuZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICAgICAgaWYgdW5pb25SYW5nZT9cbiAgICAgICAgdW5pb25SYW5nZSA9IHVuaW9uUmFuZ2UudW5pb24ocmFuZ2UpXG4gICAgICBlbHNlXG4gICAgICAgIHVuaW9uUmFuZ2UgPSByYW5nZVxuICAgIHVuaW9uUmFuZ2VcblxuY2xhc3MgQUZ1bmN0aW9uT3JJbm5lclBhcmFncmFwaCBleHRlbmRzIFVuaW9uVGV4dE9iamVjdFxuICBAZXh0ZW5kKClcbiAgbWVtYmVyOiBbJ0FGdW5jdGlvbicsICdJbm5lclBhcmFncmFwaCddXG5cbiMgRklYTUU6IG1ha2UgTW90aW9uLkN1cnJlbnRTZWxlY3Rpb24gdG8gVGV4dE9iamVjdCB0aGVuIHVzZSBjb25jYXRUZXh0T2JqZWN0XG5jbGFzcyBBQ3VycmVudFNlbGVjdGlvbkFuZEFQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKClcbiAgc2VsZWN0OiAtPlxuICAgIHBlc2lzdGVudFJhbmdlcyA9IEB2aW1TdGF0ZS5nZXRQZXJzaXN0ZW50U2VsZWN0aW9uQnVmZmZlclJhbmdlcygpXG4gICAgc2VsZWN0ZWRSYW5nZXMgPSBAZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKClcbiAgICByYW5nZXMgPSBwZXNpc3RlbnRSYW5nZXMuY29uY2F0KHNlbGVjdGVkUmFuZ2VzKVxuXG4gICAgaWYgcmFuZ2VzLmxlbmd0aFxuICAgICAgQGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlcyhyYW5nZXMpXG4gICAgQHZpbVN0YXRlLmNsZWFyUGVyc2lzdGVudFNlbGVjdGlvbnMoKVxuICAgIEBlZGl0b3IubWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zKClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIE5vdCB1c2VkIGN1cnJlbnRseVxuY2xhc3MgVGV4dE9iamVjdEZpcnN0Rm91bmQgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIG1lbWJlcjogW11cbiAgbWVtYmVyT3B0b2luczoge2FsbG93TmV4dExpbmU6IGZhbHNlfVxuXG4gIGdldFJhbmdlQnk6IChrbGFzcywgc2VsZWN0aW9uKSAtPlxuICAgIEBuZXcoa2xhc3MsIEBtZW1iZXJPcHRvaW5zKS5nZXRSYW5nZShzZWxlY3Rpb24pXG5cbiAgZ2V0UmFuZ2VzOiAoc2VsZWN0aW9uKSAtPlxuICAgIChyYW5nZSBmb3Iga2xhc3MgaW4gQG1lbWJlciB3aGVuIChyYW5nZSA9IEBnZXRSYW5nZUJ5KGtsYXNzLCBzZWxlY3Rpb24pKSlcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBmb3IgbWVtYmVyIGluIEBtZW1iZXIgd2hlbiByYW5nZSA9IEBnZXRSYW5nZUJ5KG1lbWJlciwgc2VsZWN0aW9uKVxuICAgICAgcmV0dXJuIHJhbmdlXG4iXX0=
