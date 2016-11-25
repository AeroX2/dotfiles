(function() {
  var Disposable, KeymapManager, Point, Range, TextData, VimEditor, _, buildKeydownEvent, buildKeydownEventFromKeystroke, buildTextInputEvent, dispatch, getView, getVimState, headFromProperty, inspect, isPoint, isRange, normalizeKeystrokes, rawKeystroke, ref, semver, settings, supportedModeClass, swrap, toArray, toArrayOfPoint, toArrayOfRange, withMockPlatform,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('underscore-plus');

  semver = require('semver');

  ref = require('atom'), Range = ref.Range, Point = ref.Point, Disposable = ref.Disposable;

  inspect = require('util').inspect;

  swrap = require('../lib/selection-wrapper');

  settings = require('../lib/settings');

  KeymapManager = atom.keymaps.constructor;

  normalizeKeystrokes = require(atom.config.resourcePath + "/node_modules/atom-keymap/lib/helpers").normalizeKeystrokes;

  supportedModeClass = ['normal-mode', 'visual-mode', 'insert-mode', 'replace', 'linewise', 'blockwise', 'characterwise'];

  getView = function(model) {
    return atom.views.getView(model);
  };

  dispatch = function(target, command) {
    return atom.commands.dispatch(target, command);
  };

  withMockPlatform = function(target, platform, fn) {
    var wrapper;
    wrapper = document.createElement('div');
    wrapper.className = platform;
    wrapper.appendChild(target);
    fn();
    return target.parentNode.removeChild(target);
  };

  buildKeydownEvent = function(key, options) {
    return KeymapManager.buildKeydownEvent(key, options);
  };

  headFromProperty = function(selection) {
    return swrap(selection).getBufferPositionFor('head', {
      fromProperty: true
    });
  };

  buildKeydownEventFromKeystroke = function(keystroke, target) {
    var i, key, len, modifier, options, part, parts;
    modifier = ['ctrl', 'alt', 'shift', 'cmd'];
    parts = keystroke === '-' ? ['-'] : keystroke.split('-');
    options = {
      target: target
    };
    key = null;
    for (i = 0, len = parts.length; i < len; i++) {
      part = parts[i];
      if (indexOf.call(modifier, part) >= 0) {
        options[part] = true;
      } else {
        key = part;
      }
    }
    if (semver.satisfies(atom.getVersion(), '< 1.12')) {
      if (key === 'space') {
        key = ' ';
      }
    }
    return buildKeydownEvent(key, options);
  };

  buildTextInputEvent = function(key) {
    var event, eventArgs;
    eventArgs = [true, true, window, key];
    event = document.createEvent('TextEvent');
    event.initTextEvent.apply(event, ["textInput"].concat(slice.call(eventArgs)));
    return event;
  };

  rawKeystroke = function(keystrokes, target) {
    var event, i, key, len, ref1, results;
    ref1 = normalizeKeystrokes(keystrokes).split(/\s+/);
    results = [];
    for (i = 0, len = ref1.length; i < len; i++) {
      key = ref1[i];
      event = buildKeydownEventFromKeystroke(key, target);
      results.push(atom.keymaps.handleKeyboardEvent(event));
    }
    return results;
  };

  isPoint = function(obj) {
    if (obj instanceof Point) {
      return true;
    } else {
      return obj.length === 2 && _.isNumber(obj[0]) && _.isNumber(obj[1]);
    }
  };

  isRange = function(obj) {
    if (obj instanceof Range) {
      return true;
    } else {
      return _.all([_.isArray(obj), obj.length === 2, isPoint(obj[0]), isPoint(obj[1])]);
    }
  };

  toArray = function(obj, cond) {
    if (cond == null) {
      cond = null;
    }
    if (_.isArray(cond != null ? cond : obj)) {
      return obj;
    } else {
      return [obj];
    }
  };

  toArrayOfPoint = function(obj) {
    if (_.isArray(obj) && isPoint(obj[0])) {
      return obj;
    } else {
      return [obj];
    }
  };

  toArrayOfRange = function(obj) {
    if (_.isArray(obj) && _.all(obj.map(function(e) {
      return isRange(e);
    }))) {
      return obj;
    } else {
      return [obj];
    }
  };

  getVimState = function() {
    var args, callback, editor, file, ref1;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    ref1 = [], editor = ref1[0], file = ref1[1], callback = ref1[2];
    switch (args.length) {
      case 1:
        callback = args[0];
        break;
      case 2:
        file = args[0], callback = args[1];
    }
    waitsForPromise(function() {
      return atom.packages.activatePackage('vim-mode-plus');
    });
    waitsForPromise(function() {
      if (file) {
        file = atom.project.resolvePath(file);
      }
      return atom.workspace.open(file).then(function(e) {
        return editor = e;
      });
    });
    return runs(function() {
      var main, vimState;
      main = atom.packages.getActivePackage('vim-mode-plus').mainModule;
      vimState = main.getEditorState(editor);
      return callback(vimState, new VimEditor(vimState));
    });
  };

  TextData = (function() {
    function TextData(rawData) {
      this.rawData = rawData;
      this.lines = this.rawData.split("\n");
    }

    TextData.prototype.getLines = function(lines, arg) {
      var chomp, line, text;
      chomp = (arg != null ? arg : {}).chomp;
      if (chomp == null) {
        chomp = false;
      }
      text = ((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = lines.length; i < len; i++) {
          line = lines[i];
          results.push(this.lines[line]);
        }
        return results;
      }).call(this)).join("\n");
      if (chomp) {
        return text;
      } else {
        return text + "\n";
      }
    };

    TextData.prototype.getRaw = function() {
      return this.rawData;
    };

    return TextData;

  })();

  VimEditor = (function() {
    var ensureOptionsOrdered, setOptionsOrdered;

    function VimEditor(vimState1) {
      var ref1;
      this.vimState = vimState1;
      this.keystroke = bind(this.keystroke, this);
      this.ensure = bind(this.ensure, this);
      this.set = bind(this.set, this);
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement;
    }

    VimEditor.prototype.validateOptions = function(options, validOptions, message) {
      var invalidOptions;
      invalidOptions = _.without.apply(_, [_.keys(options)].concat(slice.call(validOptions)));
      if (invalidOptions.length) {
        throw new Error(message + ": " + (inspect(invalidOptions)));
      }
    };

    setOptionsOrdered = ['text', 'text_', 'grammar', 'cursor', 'cursorBuffer', 'addCursor', 'addCursorBuffer', 'register', 'selectedBufferRange'];

    VimEditor.prototype.set = function(options) {
      var i, len, method, name, results;
      this.validateOptions(options, setOptionsOrdered, 'Invalid set options');
      results = [];
      for (i = 0, len = setOptionsOrdered.length; i < len; i++) {
        name = setOptionsOrdered[i];
        if (!(options[name] != null)) {
          continue;
        }
        method = 'set' + _.capitalize(_.camelize(name));
        results.push(this[method](options[name]));
      }
      return results;
    };

    VimEditor.prototype.setText = function(text) {
      return this.editor.setText(text);
    };

    VimEditor.prototype.setText_ = function(text) {
      return this.setText(text.replace(/_/g, ' '));
    };

    VimEditor.prototype.setGrammar = function(scope) {
      return this.editor.setGrammar(atom.grammars.grammarForScopeName(scope));
    };

    VimEditor.prototype.setCursor = function(points) {
      var i, len, point, results;
      points = toArrayOfPoint(points);
      this.editor.setCursorScreenPosition(points.shift());
      results = [];
      for (i = 0, len = points.length; i < len; i++) {
        point = points[i];
        results.push(this.editor.addCursorAtScreenPosition(point));
      }
      return results;
    };

    VimEditor.prototype.setCursorBuffer = function(points) {
      var i, len, point, results;
      points = toArrayOfPoint(points);
      this.editor.setCursorBufferPosition(points.shift());
      results = [];
      for (i = 0, len = points.length; i < len; i++) {
        point = points[i];
        results.push(this.editor.addCursorAtBufferPosition(point));
      }
      return results;
    };

    VimEditor.prototype.setAddCursor = function(points) {
      var i, len, point, ref1, results;
      ref1 = toArrayOfPoint(points);
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        point = ref1[i];
        results.push(this.editor.addCursorAtScreenPosition(point));
      }
      return results;
    };

    VimEditor.prototype.setAddCursorBuffer = function(points) {
      var i, len, point, ref1, results;
      ref1 = toArrayOfPoint(points);
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        point = ref1[i];
        results.push(this.editor.addCursorAtBufferPosition(point));
      }
      return results;
    };

    VimEditor.prototype.setRegister = function(register) {
      var name, results, value;
      results = [];
      for (name in register) {
        value = register[name];
        results.push(this.vimState.register.set(name, value));
      }
      return results;
    };

    VimEditor.prototype.setSelectedBufferRange = function(range) {
      return this.editor.setSelectedBufferRange(range);
    };

    ensureOptionsOrdered = ['text', 'text_', 'selectedText', 'selectedTextOrdered', "selectionIsNarrowed", 'cursor', 'cursorBuffer', 'numCursors', 'register', 'selectedScreenRange', 'selectedScreenRangeOrdered', 'selectedBufferRange', 'selectedBufferRangeOrdered', 'selectionIsReversed', 'persistentSelectionBufferRange', 'persistentSelectionCount', 'occurrenceCount', 'occurrenceText', 'characterwiseHead', 'scrollTop', 'mark', 'mode'];

    VimEditor.prototype.ensure = function() {
      var args, i, keystroke, len, method, name, options, results;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      switch (args.length) {
        case 1:
          options = args[0];
          break;
        case 2:
          keystroke = args[0], options = args[1];
      }
      this.validateOptions(options, ensureOptionsOrdered, 'Invalid ensure option');
      if (!_.isEmpty(keystroke)) {
        this.keystroke(keystroke);
      }
      results = [];
      for (i = 0, len = ensureOptionsOrdered.length; i < len; i++) {
        name = ensureOptionsOrdered[i];
        if (!(options[name] != null)) {
          continue;
        }
        method = 'ensure' + _.capitalize(_.camelize(name));
        results.push(this[method](options[name]));
      }
      return results;
    };

    VimEditor.prototype.ensureText = function(text) {
      return expect(this.editor.getText()).toEqual(text);
    };

    VimEditor.prototype.ensureText_ = function(text) {
      return this.ensureText(text.replace(/_/g, ' '));
    };

    VimEditor.prototype.ensureSelectedText = function(text, ordered) {
      var actual, s, selections;
      if (ordered == null) {
        ordered = false;
      }
      selections = ordered ? this.editor.getSelectionsOrderedByBufferPosition() : this.editor.getSelections();
      actual = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = selections.length; i < len; i++) {
          s = selections[i];
          results.push(s.getText());
        }
        return results;
      })();
      return expect(actual).toEqual(toArray(text));
    };

    VimEditor.prototype.ensureSelectionIsNarrowed = function(isNarrowed) {
      var actual;
      actual = this.vimState.modeManager.isNarrowed();
      return expect(actual).toEqual(isNarrowed);
    };

    VimEditor.prototype.ensureSelectedTextOrdered = function(text) {
      return this.ensureSelectedText(text, true);
    };

    VimEditor.prototype.ensureCursor = function(points) {
      var actual;
      actual = this.editor.getCursorScreenPositions();
      return expect(actual).toEqual(toArrayOfPoint(points));
    };

    VimEditor.prototype.ensureCursorBuffer = function(points) {
      var actual;
      actual = this.editor.getCursorBufferPositions();
      return expect(actual).toEqual(toArrayOfPoint(points));
    };

    VimEditor.prototype.ensureRegister = function(register) {
      var _value, ensure, name, property, reg, results, selection;
      results = [];
      for (name in register) {
        ensure = register[name];
        selection = ensure.selection;
        delete ensure.selection;
        reg = this.vimState.register.get(name, selection);
        results.push((function() {
          var results1;
          results1 = [];
          for (property in ensure) {
            _value = ensure[property];
            results1.push(expect(reg[property]).toEqual(_value));
          }
          return results1;
        })());
      }
      return results;
    };

    VimEditor.prototype.ensureNumCursors = function(number) {
      return expect(this.editor.getCursors()).toHaveLength(number);
    };

    VimEditor.prototype._ensureSelectedRangeBy = function(range, ordered, fn) {
      var actual, s, selections;
      if (ordered == null) {
        ordered = false;
      }
      selections = ordered ? this.editor.getSelectionsOrderedByBufferPosition() : this.editor.getSelections();
      actual = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = selections.length; i < len; i++) {
          s = selections[i];
          results.push(fn(s));
        }
        return results;
      })();
      return expect(actual).toEqual(toArrayOfRange(range));
    };

    VimEditor.prototype.ensureSelectedScreenRange = function(range, ordered) {
      if (ordered == null) {
        ordered = false;
      }
      return this._ensureSelectedRangeBy(range, ordered, function(s) {
        return s.getScreenRange();
      });
    };

    VimEditor.prototype.ensureSelectedScreenRangeOrdered = function(range) {
      return this.ensureSelectedScreenRange(range, true);
    };

    VimEditor.prototype.ensureSelectedBufferRange = function(range, ordered) {
      if (ordered == null) {
        ordered = false;
      }
      return this._ensureSelectedRangeBy(range, ordered, function(s) {
        return s.getBufferRange();
      });
    };

    VimEditor.prototype.ensureSelectedBufferRangeOrdered = function(range) {
      return this.ensureSelectedBufferRange(range, true);
    };

    VimEditor.prototype.ensureSelectionIsReversed = function(reversed) {
      var actual, i, len, ref1, results, selection;
      ref1 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        actual = selection.isReversed();
        results.push(expect(actual).toBe(reversed));
      }
      return results;
    };

    VimEditor.prototype.ensurePersistentSelectionBufferRange = function(range) {
      var actual;
      actual = this.vimState.persistentSelection.getMarkerBufferRanges();
      return expect(actual).toEqual(toArrayOfRange(range));
    };

    VimEditor.prototype.ensurePersistentSelectionCount = function(number) {
      var actual;
      actual = this.vimState.persistentSelection.getMarkerCount();
      return expect(actual).toBe(number);
    };

    VimEditor.prototype.ensureOccurrenceCount = function(number) {
      var actual;
      actual = this.vimState.occurrenceManager.getMarkerCount();
      return expect(actual).toBe(number);
    };

    VimEditor.prototype.ensureOccurrenceText = function(text) {
      var actual, markers, r, ranges;
      markers = this.vimState.occurrenceManager.getMarkers();
      ranges = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = markers.length; i < len; i++) {
          r = markers[i];
          results.push(r.getBufferRange());
        }
        return results;
      })();
      actual = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = ranges.length; i < len; i++) {
          r = ranges[i];
          results.push(this.editor.getTextInBufferRange(r));
        }
        return results;
      }).call(this);
      return expect(actual).toEqual(toArray(text));
    };

    VimEditor.prototype.ensureCharacterwiseHead = function(points) {
      var actual, s;
      actual = (function() {
        var i, len, ref1, results;
        ref1 = this.editor.getSelections();
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          s = ref1[i];
          results.push(headFromProperty(s));
        }
        return results;
      }).call(this);
      return expect(actual).toEqual(toArrayOfPoint(points));
    };

    VimEditor.prototype.ensureScrollTop = function(scrollTop) {
      var actual;
      actual = this.editorElement.getScrollTop();
      return expect(actual).toEqual(scrollTop);
    };

    VimEditor.prototype.ensureMark = function(mark) {
      var actual, name, point, results;
      results = [];
      for (name in mark) {
        point = mark[name];
        actual = this.vimState.mark.get(name);
        results.push(expect(actual).toEqual(point));
      }
      return results;
    };

    VimEditor.prototype.ensureMode = function(mode) {
      var i, j, len, len1, m, ref1, results, shouldNotContainClasses;
      mode = toArray(mode);
      expect((ref1 = this.vimState).isMode.apply(ref1, mode)).toBe(true);
      mode[0] = mode[0] + "-mode";
      mode = mode.filter(function(m) {
        return m;
      });
      expect(this.editorElement.classList.contains('vim-mode-plus')).toBe(true);
      for (i = 0, len = mode.length; i < len; i++) {
        m = mode[i];
        expect(this.editorElement.classList.contains(m)).toBe(true);
      }
      shouldNotContainClasses = _.difference(supportedModeClass, mode);
      results = [];
      for (j = 0, len1 = shouldNotContainClasses.length; j < len1; j++) {
        m = shouldNotContainClasses[j];
        results.push(expect(this.editorElement.classList.contains(m)).toBe(false));
      }
      return results;
    };

    VimEditor.prototype.keystroke = function(keys, options) {
      var _key, finished, i, k, len, ref1, results, target;
      if (options == null) {
        options = {};
      }
      if (options.waitsForFinish) {
        finished = false;
        this.vimState.onDidFinishOperation(function() {
          return finished = true;
        });
        delete options.waitsForFinish;
        this.keystroke(keys, options);
        waitsFor(function() {
          return finished;
        });
        return;
      }
      target = this.editorElement;
      ref1 = toArray(keys);
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        k = ref1[i];
        if (_.isString(k)) {
          results.push(rawKeystroke(k, target));
        } else {
          switch (false) {
            case k.input == null:
              results.push((function() {
                var j, len1, ref2, results1;
                ref2 = k.input.split('');
                results1 = [];
                for (j = 0, len1 = ref2.length; j < len1; j++) {
                  _key = ref2[j];
                  results1.push(rawKeystroke(_key, target));
                }
                return results1;
              })());
              break;
            case k.search == null:
              if (k.search) {
                this.vimState.searchInput.editor.insertText(k.search);
              }
              results.push(atom.commands.dispatch(this.vimState.searchInput.editorElement, 'core:confirm'));
              break;
            default:
              results.push(rawKeystroke(k, target));
          }
        }
      }
      return results;
    };

    return VimEditor;

  })();

  module.exports = {
    getVimState: getVimState,
    getView: getView,
    dispatch: dispatch,
    TextData: TextData,
    withMockPlatform: withMockPlatform,
    rawKeystroke: rawKeystroke
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL3NwZWMtaGVscGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsb1dBQUE7SUFBQTs7OztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztFQUNULE1BQTZCLE9BQUEsQ0FBUSxNQUFSLENBQTdCLEVBQUMsaUJBQUQsRUFBUSxpQkFBUixFQUFlOztFQUNkLFVBQVcsT0FBQSxDQUFRLE1BQVI7O0VBQ1osS0FBQSxHQUFRLE9BQUEsQ0FBUSwwQkFBUjs7RUFDUixRQUFBLEdBQVcsT0FBQSxDQUFRLGlCQUFSOztFQUVYLGFBQUEsR0FBZ0IsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7RUFDNUIsc0JBQXVCLE9BQUEsQ0FBUSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVosR0FBMkIsdUNBQW5DOztFQUV4QixrQkFBQSxHQUFxQixDQUNuQixhQURtQixFQUVuQixhQUZtQixFQUduQixhQUhtQixFQUluQixTQUptQixFQUtuQixVQUxtQixFQU1uQixXQU5tQixFQU9uQixlQVBtQjs7RUFZckIsT0FBQSxHQUFVLFNBQUMsS0FBRDtXQUNSLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixLQUFuQjtFQURROztFQUdWLFFBQUEsR0FBVyxTQUFDLE1BQUQsRUFBUyxPQUFUO1dBQ1QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLE1BQXZCLEVBQStCLE9BQS9CO0VBRFM7O0VBR1gsZ0JBQUEsR0FBbUIsU0FBQyxNQUFELEVBQVMsUUFBVCxFQUFtQixFQUFuQjtBQUNqQixRQUFBO0lBQUEsT0FBQSxHQUFVLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO0lBQ1YsT0FBTyxDQUFDLFNBQVIsR0FBb0I7SUFDcEIsT0FBTyxDQUFDLFdB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QUFDLENBQUMsTUFBMUMsRUFBQTs7MkJBQ0EsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLElBQUMsQ0FBQSxRQUFRLENBQUMsV0FBVyxDQUFDLGFBQTdDLEVBQTRELGNBQTVEO0FBRkc7QUFMUDsyQkFTSSxZQUFBLENBQWEsQ0FBYixFQUFnQixNQUFoQjtBQVRKLFdBSEY7O0FBREY7O0lBYlM7Ozs7OztFQTRCYixNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUFDLGFBQUEsV0FBRDtJQUFjLFNBQUEsT0FBZDtJQUF1QixVQUFBLFFBQXZCO0lBQWlDLFVBQUEsUUFBakM7SUFBMkMsa0JBQUEsZ0JBQTNDO0lBQTZELGNBQUEsWUFBN0Q7O0FBdlhqQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5zZW12ZXIgPSByZXF1aXJlICdzZW12ZXInXG57UmFuZ2UsIFBvaW50LCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG57aW5zcGVjdH0gPSByZXF1aXJlICd1dGlsJ1xuc3dyYXAgPSByZXF1aXJlICcuLi9saWIvc2VsZWN0aW9uLXdyYXBwZXInXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4uL2xpYi9zZXR0aW5ncydcblxuS2V5bWFwTWFuYWdlciA9IGF0b20ua2V5bWFwcy5jb25zdHJ1Y3Rvclxue25vcm1hbGl6ZUtleXN0cm9rZXN9ID0gcmVxdWlyZShhdG9tLmNvbmZpZy5yZXNvdXJjZVBhdGggKyBcIi9ub2RlX21vZHVsZXMvYXRvbS1rZXltYXAvbGliL2hlbHBlcnNcIilcblxuc3VwcG9ydGVkTW9kZUNsYXNzID0gW1xuICAnbm9ybWFsLW1vZGUnXG4gICd2aXN1YWwtbW9kZSdcbiAgJ2luc2VydC1tb2RlJ1xuICAncmVwbGFjZSdcbiAgJ2xpbmV3aXNlJ1xuICAnYmxvY2t3aXNlJ1xuICAnY2hhcmFjdGVyd2lzZSdcbl1cblxuIyBVdGlsc1xuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5nZXRWaWV3ID0gKG1vZGVsKSAtPlxuICBhdG9tLnZpZXdzLmdldFZpZXcobW9kZWwpXG5cbmRpc3BhdGNoID0gKHRhcmdldCwgY29tbWFuZCkgLT5cbiAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCh0YXJnZXQsIGNvbW1hbmQpXG5cbndpdGhNb2NrUGxhdGZvcm0gPSAodGFyZ2V0LCBwbGF0Zm9ybSwgZm4pIC0+XG4gIHdyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICB3cmFwcGVyLmNsYXNzTmFtZSA9IHBsYXRmb3JtXG4gIHdyYXBwZXIuYXBwZW5kQ2hpbGQodGFyZ2V0KVxuICBmbigpXG4gIHRhcmdldC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRhcmdldClcblxuYnVpbGRLZXlkb3duRXZlbnQgPSAoa2V5LCBvcHRpb25zKSAtPlxuICBLZXltYXBNYW5hZ2VyLmJ1aWxkS2V5ZG93bkV2ZW50KGtleSwgb3B0aW9ucylcblxuaGVhZEZyb21Qcm9wZXJ0eSA9IChzZWxlY3Rpb24pIC0+XG4gIHN3cmFwKHNlbGVjdGlvbikuZ2V0QnVmZmVyUG9zaXRpb25Gb3IoJ2hlYWQnLCBmcm9tUHJvcGVydHk6IHRydWUpXG5cbmJ1aWxkS2V5ZG93bkV2ZW50RnJvbUtleXN0cm9rZSA9IChrZXlzdHJva2UsIHRhcmdldCkgLT5cbiAgbW9kaWZpZXIgPSBbJ2N0cmwnLCAnYWx0JywgJ3NoaWZ0JywgJ2NtZCddXG4gIHBhcnRzID0gaWYga2V5c3Ryb2tlIGlzICctJ1xuICAgIFsnLSddXG4gIGVsc2VcbiAgICBrZXlzdHJva2Uuc3BsaXQoJy0nKVxuXG4gIG9wdGlvbnMgPSB7dGFyZ2V0fVxuICBrZXkgPSBudWxsXG4gIGZvciBwYXJ0IGluIHBhcnRzXG4gICAgaWYgcGFydCBpbiBtb2RpZmllclxuICAgICAgb3B0aW9uc1twYXJ0XSA9IHRydWVcbiAgICBlbHNlXG4gICAgICBrZXkgPSBwYXJ0XG5cbiAgaWYgc2VtdmVyLnNhdGlzZmllcyhhdG9tLmdldFZlcnNpb24oKSwgJzwgMS4xMicpXG4gICAga2V5ID0gJyAnIGlmIGtleSBpcyAnc3BhY2UnXG4gIGJ1aWxkS2V5ZG93bkV2ZW50KGtleSwgb3B0aW9ucylcblxuYnVpbGRUZXh0SW5wdXRFdmVudCA9IChrZXkpIC0+XG4gIGV2ZW50QXJncyA9IFtcbiAgICB0cnVlICMgYnViYmxlc1xuICAgIHRydWUgIyBjYW5jZWxhYmxlXG4gICAgd2luZG93ICMgdmlld1xuICAgIGtleSAgIyBrZXkgY2hhclxuICBdXG4gIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ1RleHRFdmVudCcpXG4gIGV2ZW50LmluaXRUZXh0RXZlbnQoXCJ0ZXh0SW5wdXRcIiwgZXZlbnRBcmdzLi4uKVxuICBldmVudFxuXG5yYXdLZXlzdHJva2UgPSAoa2V5c3Ryb2tlcywgdGFyZ2V0KSAtPlxuICBmb3Iga2V5IGluIG5vcm1hbGl6ZUtleXN0cm9rZXMoa2V5c3Ryb2tlcykuc3BsaXQoL1xccysvKVxuICAgIGV2ZW50ID0gYnVpbGRLZXlkb3duRXZlbnRGcm9tS2V5c3Ryb2tlKGtleSwgdGFyZ2V0KVxuICAgIGF0b20ua2V5bWFwcy5oYW5kbGVLZXlib2FyZEV2ZW50KGV2ZW50KVxuXG5pc1BvaW50ID0gKG9iaikgLT5cbiAgaWYgb2JqIGluc3RhbmNlb2YgUG9pbnRcbiAgICB0cnVlXG4gIGVsc2VcbiAgICBvYmoubGVuZ3RoIGlzIDIgYW5kIF8uaXNOdW1iZXIob2JqWzBdKSBhbmQgXy5pc051bWJlcihvYmpbMV0pXG5cbmlzUmFuZ2UgPSAob2JqKSAtPlxuICBpZiBvYmogaW5zdGFuY2VvZiBSYW5nZVxuICAgIHRydWVcbiAgZWxzZVxuICAgIF8uYWxsKFtcbiAgICAgIF8uaXNBcnJheShvYmopLFxuICAgICAgKG9iai5sZW5ndGggaXMgMiksXG4gICAgICBpc1BvaW50KG9ialswXSksXG4gICAgICBpc1BvaW50KG9ialsxXSlcbiAgICBdKVxuXG50b0FycmF5ID0gKG9iaiwgY29uZD1udWxsKSAtPlxuICBpZiBfLmlzQXJyYXkoY29uZCA/IG9iaikgdGhlbiBvYmogZWxzZSBbb2JqXVxuXG50b0FycmF5T2ZQb2ludCA9IChvYmopIC0+XG4gIGlmIF8uaXNBcnJheShvYmopIGFuZCBpc1BvaW50KG9ialswXSlcbiAgICBvYmpcbiAgZWxzZVxuICAgIFtvYmpdXG5cbnRvQXJyYXlPZlJhbmdlID0gKG9iaikgLT5cbiAgaWYgXy5pc0FycmF5KG9iaikgYW5kIF8uYWxsKG9iai5tYXAgKGUpIC0+IGlzUmFuZ2UoZSkpXG4gICAgb2JqXG4gIGVsc2VcbiAgICBbb2JqXVxuXG4jIE1haW5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuZ2V0VmltU3RhdGUgPSAoYXJncy4uLikgLT5cbiAgW2VkaXRvciwgZmlsZSwgY2FsbGJhY2tdID0gW11cbiAgc3dpdGNoIGFyZ3MubGVuZ3RoXG4gICAgd2hlbiAxIHRoZW4gW2NhbGxiYWNrXSA9IGFyZ3NcbiAgICB3aGVuIDIgdGhlbiBbZmlsZSwgY2FsbGJhY2tdID0gYXJnc1xuXG4gIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCd2aW0tbW9kZS1wbHVzJylcblxuICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICBmaWxlID0gYXRvbS5wcm9qZWN0LnJlc29sdmVQYXRoKGZpbGUpIGlmIGZpbGVcbiAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGUpLnRoZW4gKGUpIC0+IGVkaXRvciA9IGVcblxuICBydW5zIC0+XG4gICAgbWFpbiA9IGF0b20ucGFja2FnZXMuZ2V0QWN0aXZlUGFja2FnZSgndmltLW1vZGUtcGx1cycpLm1haW5Nb2R1bGVcbiAgICB2aW1TdGF0ZSA9IG1haW4uZ2V0RWRpdG9yU3RhdGUoZWRpdG9yKVxuICAgIGNhbGxiYWNrKHZpbVN0YXRlLCBuZXcgVmltRWRpdG9yKHZpbVN0YXRlKSlcblxuY2xhc3MgVGV4dERhdGFcbiAgY29uc3RydWN0b3I6IChAcmF3RGF0YSkgLT5cbiAgICBAbGluZXMgPSBAcmF3RGF0YS5zcGxpdChcIlxcblwiKVxuXG4gIGdldExpbmVzOiAobGluZXMsIHtjaG9tcH09e30pIC0+XG4gICAgY2hvbXAgPz0gZmFsc2VcbiAgICB0ZXh0ID0gKEBsaW5lc1tsaW5lXSBmb3IgbGluZSBpbiBsaW5lcykuam9pbihcIlxcblwiKVxuICAgIGlmIGNob21wXG4gICAgICB0ZXh0XG4gICAgZWxzZVxuICAgICAgdGV4dCArIFwiXFxuXCJcblxuICBnZXRSYXc6IC0+XG4gICAgQHJhd0RhdGFcblxuY2xhc3MgVmltRWRpdG9yXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yLCBAZWRpdG9yRWxlbWVudH0gPSBAdmltU3RhdGVcblxuICB2YWxpZGF0ZU9wdGlvbnM6IChvcHRpb25zLCB2YWxpZE9wdGlvbnMsIG1lc3NhZ2UpIC0+XG4gICAgaW52YWxpZE9wdGlvbnMgPSBfLndpdGhvdXQoXy5rZXlzKG9wdGlvbnMpLCB2YWxpZE9wdGlvbnMuLi4pXG4gICAgaWYgaW52YWxpZE9wdGlvbnMubGVuZ3RoXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCIje21lc3NhZ2V9OiAje2luc3BlY3QoaW52YWxpZE9wdGlvbnMpfVwiKVxuXG4gIHNldE9wdGlvbnNPcmRlcmVkID0gW1xuICAgICd0ZXh0JyxcbiAgICAndGV4dF8nLFxuICAgICdncmFtbWFyJyxcbiAgICAnY3Vyc29yJywgJ2N1cnNvckJ1ZmZlcicsXG4gICAgJ2FkZEN1cnNvcicsICdhZGRDdXJzb3JCdWZmZXInXG4gICAgJ3JlZ2lzdGVyJyxcbiAgICAnc2VsZWN0ZWRCdWZmZXJSYW5nZSdcbiAgXVxuXG4gICMgUHVibGljXG4gIHNldDogKG9wdGlvbnMpID0+XG4gICAgQHZhbGlkYXRlT3B0aW9ucyhvcHRpb25zLCBzZXRPcHRpb25zT3JkZXJlZCwgJ0ludmFsaWQgc2V0IG9wdGlvbnMnKVxuICAgIGZvciBuYW1lIGluIHNldE9wdGlvbnNPcmRlcmVkIHdoZW4gb3B0aW9uc1tuYW1lXT9cbiAgICAgIG1ldGhvZCA9ICdzZXQnICsgXy5jYXBpdGFsaXplKF8uY2FtZWxpemUobmFtZSkpXG4gICAgICB0aGlzW21ldGhvZF0ob3B0aW9uc1tuYW1lXSlcblxuICBzZXRUZXh0OiAodGV4dCkgLT5cbiAgICBAZWRpdG9yLnNldFRleHQodGV4dClcblxuICBzZXRUZXh0XzogKHRleHQpIC0+XG4gICAgQHNldFRleHQodGV4dC5yZXBsYWNlKC9fL2csICcgJykpXG5cbiAgc2V0R3JhbW1hcjogKHNjb3BlKSAtPlxuICAgIEBlZGl0b3Iuc2V0R3JhbW1hcihhdG9tLmdyYW1tYXJzLmdyYW1tYXJGb3JTY29wZU5hbWUoc2NvcGUpKVxuXG4gIHNldEN1cnNvcjogKHBvaW50cykgLT5cbiAgICBwb2ludHMgPSB0b0FycmF5T2ZQb2ludChwb2ludHMpXG4gICAgQGVkaXRvci5zZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbihwb2ludHMuc2hpZnQoKSlcbiAgICBmb3IgcG9pbnQgaW4gcG9pbnRzXG4gICAgICBAZWRpdG9yLmFkZEN1cnNvckF0U2NyZWVuUG9zaXRpb24ocG9pbnQpXG5cbiAgc2V0Q3Vyc29yQnVmZmVyOiAocG9pbnRzKSAtPlxuICAgIHBvaW50cyA9IHRvQXJyYXlPZlBvaW50KHBvaW50cylcbiAgICBAZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKHBvaW50cy5zaGlmdCgpKVxuICAgIGZvciBwb2ludCBpbiBwb2ludHNcbiAgICAgIEBlZGl0b3IuYWRkQ3Vyc29yQXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuICBzZXRBZGRDdXJzb3I6IChwb2ludHMpIC0+XG4gICAgZm9yIHBvaW50IGluIHRvQXJyYXlPZlBvaW50KHBvaW50cylcbiAgICAgIEBlZGl0b3IuYWRkQ3Vyc29yQXRTY3JlZW5Qb3NpdGlvbihwb2ludClcblxuICBzZXRBZGRDdXJzb3JCdWZmZXI6IChwb2ludHMpIC0+XG4gICAgZm9yIHBvaW50IGluIHRvQXJyYXlPZlBvaW50KHBvaW50cylcbiAgICAgIEBlZGl0b3IuYWRkQ3Vyc29yQXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuICBzZXRSZWdpc3RlcjogKHJlZ2lzdGVyKSAtPlxuICAgIGZvciBuYW1lLCB2YWx1ZSBvZiByZWdpc3RlclxuICAgICAgQHZpbVN0YXRlLnJlZ2lzdGVyLnNldChuYW1lLCB2YWx1ZSlcblxuICBzZXRTZWxlY3RlZEJ1ZmZlclJhbmdlOiAocmFuZ2UpIC0+XG4gICAgQGVkaXRvci5zZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKHJhbmdlKVxuXG4gIGVuc3VyZU9wdGlvbnNPcmRlcmVkID0gW1xuICAgICd0ZXh0JyxcbiAgICAndGV4dF8nLFxuICAgICdzZWxlY3RlZFRleHQnLCAnc2VsZWN0ZWRUZXh0T3JkZXJlZCcsIFwic2VsZWN0aW9uSXNOYXJyb3dlZFwiXG4gICAgJ2N1cnNvcicsICdjdXJzb3JCdWZmZXInLFxuICAgICdudW1DdXJzb3JzJ1xuICAgICdyZWdpc3RlcicsXG4gICAgJ3NlbGVjdGVkU2NyZWVuUmFuZ2UnLCAnc2VsZWN0ZWRTY3JlZW5SYW5nZU9yZGVyZWQnXG4gICAgJ3NlbGVjdGVkQnVmZmVyUmFuZ2UnLCAnc2VsZWN0ZWRCdWZmZXJSYW5nZU9yZGVyZWQnXG4gICAgJ3NlbGVjdGlvbklzUmV2ZXJzZWQnLFxuICAgICdwZXJzaXN0ZW50U2VsZWN0aW9uQnVmZmVyUmFuZ2UnLCAncGVyc2lzdGVudFNlbGVjdGlvbkNvdW50J1xuICAgICdvY2N1cnJlbmNlQ291bnQnLCAnb2NjdXJyZW5jZVRleHQnXG4gICAgJ2NoYXJhY3Rlcndpc2VIZWFkJ1xuICAgICdzY3JvbGxUb3AnLFxuICAgICdtYXJrJ1xuICAgICdtb2RlJyxcbiAgXVxuICAjIFB1YmxpY1xuICBlbnN1cmU6IChhcmdzLi4uKSA9PlxuICAgIHN3aXRjaCBhcmdzLmxlbmd0aFxuICAgICAgd2hlbiAxIHRoZW4gW29wdGlvbnNdID0gYXJnc1xuICAgICAgd2hlbiAyIHRoZW4gW2tleXN0cm9rZSwgb3B0aW9uc10gPSBhcmdzXG4gICAgQHZhbGlkYXRlT3B0aW9ucyhvcHRpb25zLCBlbnN1cmVPcHRpb25zT3JkZXJlZCwgJ0ludmFsaWQgZW5zdXJlIG9wdGlvbicpXG4gICAgIyBJbnB1dFxuICAgIHVubGVzcyBfLmlzRW1wdHkoa2V5c3Ryb2tlKVxuICAgICAgQGtleXN0cm9rZShrZXlzdHJva2UpXG5cbiAgICBmb3IgbmFtZSBpbiBlbnN1cmVPcHRpb25zT3JkZXJlZCB3aGVuIG9wdGlvbnNbbmFtZV0/XG4gICAgICBtZXRob2QgPSAnZW5zdXJlJyArIF8uY2FwaXRhbGl6ZShfLmNhbWVsaXplKG5hbWUpKVxuICAgICAgdGhpc1ttZXRob2RdKG9wdGlvbnNbbmFtZV0pXG5cbiAgZW5zdXJlVGV4dDogKHRleHQpIC0+IGV4cGVjdChAZWRpdG9yLmdldFRleHQoKSkudG9FcXVhbCh0ZXh0KVxuXG4gIGVuc3VyZVRleHRfOiAodGV4dCkgLT5cbiAgICBAZW5zdXJlVGV4dCh0ZXh0LnJlcGxhY2UoL18vZywgJyAnKSlcblxuICBlbnN1cmVTZWxlY3RlZFRleHQ6ICh0ZXh0LCBvcmRlcmVkPWZhbHNlKSAtPlxuICAgIHNlbGVjdGlvbnMgPSBpZiBvcmRlcmVkXG4gICAgICBAZWRpdG9yLmdldFNlbGVjdGlvbnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbigpXG4gICAgZWxzZVxuICAgICAgQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICBhY3R1YWwgPSAocy5nZXRUZXh0KCkgZm9yIHMgaW4gc2VsZWN0aW9ucylcbiAgICBleHBlY3QoYWN0dWFsKS50b0VxdWFsKHRvQXJyYXkodGV4dCkpXG5cbiAgZW5zdXJlU2VsZWN0aW9uSXNOYXJyb3dlZDogKGlzTmFycm93ZWQpIC0+XG4gICAgYWN0dWFsID0gQHZpbVN0YXRlLm1vZGVNYW5hZ2VyLmlzTmFycm93ZWQoKVxuICAgIGV4cGVjdChhY3R1YWwpLnRvRXF1YWwoaXNOYXJyb3dlZClcblxuICBlbnN1cmVTZWxlY3RlZFRleHRPcmRlcmVkOiAodGV4dCkgLT5cbiAgICBAZW5zdXJlU2VsZWN0ZWRUZXh0KHRleHQsIHRydWUpXG5cbiAgZW5zdXJlQ3Vyc29yOiAocG9pbnRzKSAtPlxuICAgIGFjdHVhbCA9IEBlZGl0b3IuZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb25zKClcbiAgICBleHBlY3QoYWN0dWFsKS50b0VxdWFsKHRvQXJyYXlPZlBvaW50KHBvaW50cykpXG5cbiAgZW5zdXJlQ3Vyc29yQnVmZmVyOiAocG9pbnRzKSAtPlxuICAgIGFjdHVhbCA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb25zKClcbiAgICBleHBlY3QoYWN0dWFsKS50b0VxdWFsKHRvQXJyYXlPZlBvaW50KHBvaW50cykpXG5cbiAgZW5zdXJlUmVnaXN0ZXI6IChyZWdpc3RlcikgLT5cbiAgICBmb3IgbmFtZSwgZW5zdXJlIG9mIHJlZ2lzdGVyXG4gICAgICB7c2VsZWN0aW9ufSA9IGVuc3VyZVxuICAgICAgZGVsZXRlIGVuc3VyZS5zZWxlY3Rpb25cbiAgICAgIHJlZyA9IEB2aW1TdGF0ZS5yZWdpc3Rlci5nZXQobmFtZSwgc2VsZWN0aW9uKVxuICAgICAgZm9yIHByb3BlcnR5LCBfdmFsdWUgb2YgZW5zdXJlXG4gICAgICAgIGV4cGVjdChyZWdbcHJvcGVydHldKS50b0VxdWFsKF92YWx1ZSlcblxuICBlbnN1cmVOdW1DdXJzb3JzOiAobnVtYmVyKSAtPlxuICAgIGV4cGVjdChAZWRpdG9yLmdldEN1cnNvcnMoKSkudG9IYXZlTGVuZ3RoIG51bWJlclxuXG4gIF9lbnN1cmVTZWxlY3RlZFJhbmdlQnk6IChyYW5nZSwgb3JkZXJlZD1mYWxzZSwgZm4pIC0+XG4gICAgc2VsZWN0aW9ucyA9IGlmIG9yZGVyZWRcbiAgICAgIEBlZGl0b3IuZ2V0U2VsZWN0aW9uc09yZGVyZWRCeUJ1ZmZlclBvc2l0aW9uKClcbiAgICBlbHNlXG4gICAgICBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgIGFjdHVhbCA9IChmbihzKSBmb3IgcyBpbiBzZWxlY3Rpb25zKVxuICAgIGV4cGVjdChhY3R1YWwpLnRvRXF1YWwodG9BcnJheU9mUmFuZ2UocmFuZ2UpKVxuXG4gIGVuc3VyZVNlbGVjdGVkU2NyZWVuUmFuZ2U6IChyYW5nZSwgb3JkZXJlZD1mYWxzZSkgLT5cbiAgICBAX2Vuc3VyZVNlbGVjdGVkUmFuZ2VCeSByYW5nZSwgb3JkZXJlZCwgKHMpIC0+IHMuZ2V0U2NyZWVuUmFuZ2UoKVxuXG4gIGVuc3VyZVNlbGVjdGVkU2NyZWVuUmFuZ2VPcmRlcmVkOiAocmFuZ2UpIC0+XG4gICAgQGVuc3VyZVNlbGVjdGVkU2NyZWVuUmFuZ2UocmFuZ2UsIHRydWUpXG5cbiAgZW5zdXJlU2VsZWN0ZWRCdWZmZXJSYW5nZTogKHJhbmdlLCBvcmRlcmVkPWZhbHNlKSAtPlxuICAgIEBfZW5zdXJlU2VsZWN0ZWRSYW5nZUJ5IHJhbmdlLCBvcmRlcmVkLCAocykgLT4gcy5nZXRCdWZmZXJSYW5nZSgpXG5cbiAgZW5zdXJlU2VsZWN0ZWRCdWZmZXJSYW5nZU9yZGVyZWQ6IChyYW5nZSkgLT5cbiAgICBAZW5zdXJlU2VsZWN0ZWRCdWZmZXJSYW5nZShyYW5nZSwgdHJ1ZSlcblxuICBlbnN1cmVTZWxlY3Rpb25Jc1JldmVyc2VkOiAocmV2ZXJzZWQpIC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgYWN0dWFsID0gc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuICAgICAgZXhwZWN0KGFjdHVhbCkudG9CZShyZXZlcnNlZClcblxuICBlbnN1cmVQZXJzaXN0ZW50U2VsZWN0aW9uQnVmZmVyUmFuZ2U6IChyYW5nZSkgLT5cbiAgICBhY3R1YWwgPSBAdmltU3RhdGUucGVyc2lzdGVudFNlbGVjdGlvbi5nZXRNYXJrZXJCdWZmZXJSYW5nZXMoKVxuICAgIGV4cGVjdChhY3R1YWwpLnRvRXF1YWwodG9BcnJheU9mUmFuZ2UocmFuZ2UpKVxuXG4gIGVuc3VyZVBlcnNpc3RlbnRTZWxlY3Rpb25Db3VudDogKG51bWJlcikgLT5cbiAgICBhY3R1YWwgPSBAdmltU3RhdGUucGVyc2lzdGVudFNlbGVjdGlvbi5nZXRNYXJrZXJDb3VudCgpXG4gICAgZXhwZWN0KGFjdHVhbCkudG9CZSBudW1iZXJcblxuICBlbnN1cmVPY2N1cnJlbmNlQ291bnQ6IChudW1iZXIpIC0+XG4gICAgYWN0dWFsID0gQHZpbVN0YXRlLm9jY3VycmVuY2VNYW5hZ2VyLmdldE1hcmtlckNvdW50KClcbiAgICBleHBlY3QoYWN0dWFsKS50b0JlIG51bWJlclxuXG4gIGVuc3VyZU9jY3VycmVuY2VUZXh0OiAodGV4dCkgLT5cbiAgICBtYXJrZXJzID0gQHZpbVN0YXRlLm9jY3VycmVuY2VNYW5hZ2VyLmdldE1hcmtlcnMoKVxuICAgIHJhbmdlcyA9IChyLmdldEJ1ZmZlclJhbmdlKCkgZm9yIHIgaW4gbWFya2VycylcbiAgICBhY3R1YWwgPSAoQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShyKSBmb3IgciBpbiByYW5nZXMpXG4gICAgZXhwZWN0KGFjdHVhbCkudG9FcXVhbCh0b0FycmF5KHRleHQpKVxuXG4gIGVuc3VyZUNoYXJhY3Rlcndpc2VIZWFkOiAocG9pbnRzKSAtPlxuICAgIGFjdHVhbCA9IChoZWFkRnJvbVByb3BlcnR5KHMpIGZvciBzIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpKVxuICAgIGV4cGVjdChhY3R1YWwpLnRvRXF1YWwodG9BcnJheU9mUG9pbnQocG9pbnRzKSlcblxuICBlbnN1cmVTY3JvbGxUb3A6IChzY3JvbGxUb3ApIC0+XG4gICAgYWN0dWFsID0gQGVkaXRvckVsZW1lbnQuZ2V0U2Nyb2xsVG9wKClcbiAgICBleHBlY3QoYWN0dWFsKS50b0VxdWFsIHNjcm9sbFRvcFxuXG4gIGVuc3VyZU1hcms6IChtYXJrKSAtPlxuICAgIGZvciBuYW1lLCBwb2ludCBvZiBtYXJrXG4gICAgICBhY3R1YWwgPSBAdmltU3RhdGUubWFyay5nZXQobmFtZSlcbiAgICAgIGV4cGVjdChhY3R1YWwpLnRvRXF1YWwocG9pbnQpXG5cbiAgZW5zdXJlTW9kZTogKG1vZGUpIC0+XG4gICAgbW9kZSA9IHRvQXJyYXkobW9kZSlcbiAgICBleHBlY3QoQHZpbVN0YXRlLmlzTW9kZShtb2RlLi4uKSkudG9CZSh0cnVlKVxuXG4gICAgbW9kZVswXSA9IFwiI3ttb2RlWzBdfS1tb2RlXCJcbiAgICBtb2RlID0gbW9kZS5maWx0ZXIoKG0pIC0+IG0pXG4gICAgZXhwZWN0KEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucygndmltLW1vZGUtcGx1cycpKS50b0JlKHRydWUpXG4gICAgZm9yIG0gaW4gbW9kZVxuICAgICAgZXhwZWN0KEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhtKSkudG9CZSh0cnVlKVxuICAgIHNob3VsZE5vdENvbnRhaW5DbGFzc2VzID0gXy5kaWZmZXJlbmNlKHN1cHBvcnRlZE1vZGVDbGFzcywgbW9kZSlcbiAgICBmb3IgbSBpbiBzaG91bGROb3RDb250YWluQ2xhc3Nlc1xuICAgICAgZXhwZWN0KEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhtKSkudG9CZShmYWxzZSlcblxuICAjIFB1YmxpY1xuICAjIG9wdGlvbnNcbiAgIyAtIHdhaXRzRm9yRmluaXNoXG4gIGtleXN0cm9rZTogKGtleXMsIG9wdGlvbnM9e30pID0+XG4gICAgaWYgb3B0aW9ucy53YWl0c0ZvckZpbmlzaFxuICAgICAgZmluaXNoZWQgPSBmYWxzZVxuICAgICAgQHZpbVN0YXRlLm9uRGlkRmluaXNoT3BlcmF0aW9uIC0+IGZpbmlzaGVkID0gdHJ1ZVxuICAgICAgZGVsZXRlIG9wdGlvbnMud2FpdHNGb3JGaW5pc2hcbiAgICAgIEBrZXlzdHJva2Uoa2V5cywgb3B0aW9ucylcbiAgICAgIHdhaXRzRm9yIC0+IGZpbmlzaGVkXG4gICAgICByZXR1cm5cblxuICAgICMga2V5cyBtdXN0IGJlIFN0cmluZyBvciBBcnJheVxuICAgICMgTm90IHN1cHBvcnQgT2JqZWN0IGZvciBrZXlzIHRvIGF2b2lkIGFtYmlndWl0eS5cbiAgICB0YXJnZXQgPSBAZWRpdG9yRWxlbWVudFxuXG4gICAgZm9yIGsgaW4gdG9BcnJheShrZXlzKVxuICAgICAgaWYgXy5pc1N0cmluZyhrKVxuICAgICAgICByYXdLZXlzdHJva2UoaywgdGFyZ2V0KVxuICAgICAgZWxzZVxuICAgICAgICBzd2l0Y2hcbiAgICAgICAgICB3aGVuIGsuaW5wdXQ/XG4gICAgICAgICAgICAjIFRPRE8gbm8gbG9uZ2VyIG5lZWQgdG8gdXNlIFtpbnB1dDogJ2NoYXInXSBzdHlsZS5cbiAgICAgICAgICAgICMgaWYgc2V0dGluZ3MuXG4gICAgICAgICAgICByYXdLZXlzdHJva2UoX2tleSwgdGFyZ2V0KSBmb3IgX2tleSBpbiBrLmlucHV0LnNwbGl0KCcnKVxuICAgICAgICAgIHdoZW4gay5zZWFyY2g/XG4gICAgICAgICAgICBAdmltU3RhdGUuc2VhcmNoSW5wdXQuZWRpdG9yLmluc2VydFRleHQoay5zZWFyY2gpIGlmIGsuc2VhcmNoXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKEB2aW1TdGF0ZS5zZWFyY2hJbnB1dC5lZGl0b3JFbGVtZW50LCAnY29yZTpjb25maXJtJylcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByYXdLZXlzdHJva2UoaywgdGFyZ2V0KVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtnZXRWaW1TdGF0ZSwgZ2V0VmlldywgZGlzcGF0Y2gsIFRleHREYXRhLCB3aXRoTW9ja1BsYXRmb3JtLCByYXdLZXlzdHJva2V9XG4iXX0=
