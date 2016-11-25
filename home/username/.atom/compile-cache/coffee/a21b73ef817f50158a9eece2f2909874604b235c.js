(function() {
  var AutoIndent, Base, BufferedProcess, CamelCase, ChangeOrder, ChangeSurround, ChangeSurroundAnyPair, ChangeSurroundAnyPairAllowForwarding, CompactSpaces, ConvertToHardTab, ConvertToSoftTab, DashCase, DecodeUriComponent, DeleteSurround, DeleteSurroundAnyPair, DeleteSurroundAnyPairAllowForwarding, EncodeUriComponent, Indent, Join, JoinByInput, JoinByInputWithKeepingSpace, JoinWithKeepingSpace, LineEndingRegExp, LowerCase, MapSurround, Operator, Outdent, PascalCase, Range, Replace, ReplaceWithRegister, Reverse, SnakeCase, Sort, SplitByCharacter, SplitString, Surround, SurroundSmartWord, SurroundWord, SwapWithRegister, TitleCase, ToggleCase, ToggleCaseAndMoveRight, ToggleLineComments, TransformSmartWordBySelectList, TransformString, TransformStringByExternalCommand, TransformStringBySelectList, TransformWordBySelectList, TrimString, UpperCase, _, haveSomeNonEmptySelection, isSingleLine, ref, ref1, selectListItems, settings, swrap, transformerRegistry,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  LineEndingRegExp = /(?:\n|\r\n)$/;

  _ = require('underscore-plus');

  ref = require('atom'), BufferedProcess = ref.BufferedProcess, Range = ref.Range;

  ref1 = require('./utils'), haveSomeNonEmptySelection = ref1.haveSomeNonEmptySelection, isSingleLine = ref1.isSingleLine;

  swrap = require('./selection-wrapper');

  settings = require('./settings');

  Base = require('./base');

  Operator = Base.getClass('Operator');

  transformerRegistry = [];

  TransformString = (function(superClass) {
    extend(TransformString, superClass);

    function TransformString() {
      return TransformString.__super__.constructor.apply(this, arguments);
    }

    TransformString.extend(false);

    TransformString.prototype.trackChange = true;

    TransformString.prototype.stayOnLinewise = true;

    TransformString.prototype.autoIndent = false;

    TransformString.registerToSelectList = function() {
      return transformerRegistry.push(this);
    };

    TransformString.prototype.mutateSelection = function(selection, stopMutation) {
      var text;
      if (text = this.getNewText(selection.getText(), selection, stopMutation)) {
        return selection.insertText(text, {
          autoIndent: this.autoIndent
        });
      }
    };

    return TransformString;

  })(Operator);

  ToggleCase = (function(superClass) {
    extend(ToggleCase, superClass);

    function ToggleCase() {
      return ToggleCase.__super__.constructor.apply(this, arguments);
    }

    ToggleCase.extend();

    ToggleCase.registerToSelectList();

    ToggleCase.description = "`Hello World` -> `hELLO wORLD`";

    ToggleCase.prototype.displayName = 'Toggle ~';

    ToggleCase.prototype.hover = {
      icon: ':toggle-case:',
      emoji: ':clap:'
    };

    ToggleCase.prototype.toggleCase = function(char) {
      var charLower;
      charLower = char.toLowerCase();
      if (charLower === char) {
        return char.toUpperCase();
      } else {
        return charLower;
      }
    };

    ToggleCase.prototype.getNewText = function(text) {
      return text.replace(/./g, this.toggleCase.bind(this));
    };

    return ToggleCase;

  })(TransformString);

  ToggleCaseAndMoveRight = (function(superClass) {
    extend(ToggleCaseAndMoveRight, superClass);

    function ToggleCaseAndMoveRight() {
      return ToggleCaseAndMoveRight.__super__.constructor.apply(this, arguments);
    }

    ToggleCaseAndMoveRight.extend();

    ToggleCaseAndMoveRight.prototype.hover = null;

    ToggleCaseAndMoveRight.prototype.flashTarget = false;

    ToggleCaseAndMoveRight.prototype.restorePositions = false;

    ToggleCaseAndMoveRight.prototype.target = 'MoveRight';

    return ToggleCaseAndMoveRight;

  })(ToggleCase);

  UpperCase = (function(superClass) {
    extend(UpperCase, superClass);

    function UpperCase() {
      return UpperCase.__super__.constructor.apply(this, arguments);
    }

    UpperCase.extend();

    UpperCase.registerToSelectList();

    UpperCase.description = "`Hello World` -> `HELLO WORLD`";

    UpperCase.prototype.hover = {
      icon: ':upper-case:',
      emoji: ':point_up:'
    };

    UpperCase.prototype.displayName = 'Upper';

    UpperCase.prototype.getNewText = function(text) {
      return text.toUpperCase();
    };

    return UpperCase;

  })(TransformString);

  LowerCase = (function(superClass) {
    extend(LowerCase, superClass);

    function LowerCase() {
      return LowerCase.__super__.constructor.apply(this, arguments);
    }

    LowerCase.extend();

    LowerCase.registerToSelectList();

    LowerCase.description = "`Hello World` -> `hello world`";

    LowerCase.prototype.hover = {
      icon: ':lower-case:',
      emoji: ':point_down:'
    };

    LowerCase.prototype.displayName = 'Lower';

    LowerCase.prototype.getNewText = function(text) {
      return text.toLowerCase();
    };

    return LowerCase;

  })(TransformString);

  Replace = (function(superClass) {
    extend(Replace, superClass);

    function Replace() {
      return Replace.__super__.constructor.apply(this, arguments);
    }

    Replace.extend();

    Replace.prototype.input = null;

    Replace.prototype.hover = {
      icon: ':replace:',
      emoji: ':tractor:'
    };

    Replace.prototype.requireInput = true;

    Replace.prototype.initialize = function() {
      Replace.__super__.initialize.apply(this, arguments);
      if (this.isMode('normal')) {
        this.target = 'MoveRightBufferColumn';
      }
      return this.focusInput();
    };

    Replace.prototype.getInput = function() {
      return Replace.__super__.getInput.apply(this, arguments) || "\n";
    };

    Replace.prototype.mutateSelection = function(selection) {
      var input, text;
      if (this.target.is('MoveRightBufferColumn')) {
        if (selection.getText().length !== this.getCount()) {
          return;
        }
      }
      input = this.getInput();
      if (input === "\n") {
        this.restorePositions = false;
      }
      text = selection.getText().replace(/./g, input);
      return selection.insertText(text, {
        autoIndentNewline: true
      });
    };

    return Replace;

  })(TransformString);

  SplitByCharacter = (function(superClass) {
    extend(SplitByCharacter, superClass);

    function SplitByCharacter() {
      return SplitByCharacter.__super__.constructor.apply(this, arguments);
    }

    SplitByCharacter.extend();

    SplitByCharacter.registerToSelectList();

    SplitByCharacter.prototype.getNewText = function(text) {
      return text.split('').join(' ');
    };

    return SplitByCharacter;

  })(TransformString);

  CamelCase = (function(superClass) {
    extend(CamelCase, superClass);

    function CamelCase() {
      return CamelCase.__super__.constructor.apply(this, arguments);
    }

    CamelCase.extend();

    CamelCase.registerToSelectList();

    CamelCase.prototype.displayName = 'Camelize';

    CamelCase.description = "`hello-world` -> `helloWorld`";

    CamelCase.prototype.hover = {
      icon: ':camel-case:',
      emoji: ':camel:'
    };

    CamelCase.prototype.getNewText = function(text) {
      return _.camelize(text);
    };

    return CamelCase;

  })(TransformString);

  SnakeCase = (function(superClass) {
    extend(SnakeCase, superClass);

    function SnakeCase() {
      return SnakeCase.__super__.constructor.apply(this, arguments);
    }

    SnakeCase.extend();

    SnakeCase.registerToSelectList();

    SnakeCase.description = "`HelloWorld` -> `hello_world`";

    SnakeCase.prototype.displayName = 'Underscore _';

    SnakeCase.prototype.hover = {
      icon: ':snake-case:',
      emoji: ':snake:'
    };

    SnakeCase.prototype.getNewText = function(text) {
      return _.underscore(text);
    };

    return SnakeCase;

  })(TransformString);

  PascalCase = (function(superClass) {
    extend(PascalCase, superClass);

    function PascalCase() {
      return PascalCase.__super__.constructor.apply(this, arguments);
    }

    PascalCase.extend();

    PascalCase.registerToSelectList();

    PascalCase.description = "`hello_world` -> `HelloWorld`";

    PascalCase.prototype.displayName = 'Pascalize';

    PascalCase.prototype.hover = {
      icon: ':pascal-case:',
      emoji: ':triangular_ruler:'
    };

    PascalCase.prototype.getNewText = function(text) {
      return _.capitalize(_.camelize(text));
    };

    return PascalCase;

  })(TransformString);

  DashCase = (function(superClass) {
    extend(DashCase, superClass);

    function DashCase() {
      return DashCase.__super__.constructor.apply(this, arguments);
    }

    DashCase.extend();

    DashCase.registerToSelectList();

    DashCase.prototype.displayName = 'Dasherize -';

    DashCase.description = "HelloWorld -> hello-world";

    DashCase.prototype.hover = {
      icon: ':dash-case:',
      emoji: ':dash:'
    };

    DashCase.prototype.getNewText = function(text) {
      return _.dasherize(text);
    };

    return DashCase;

  })(TransformString);

  TitleCase = (function(superClass) {
    extend(TitleCase, superClass);

    function TitleCase() {
      return TitleCase.__super__.constructor.apply(this, arguments);
    }

    TitleCase.extend();

    TitleCase.registerToSelectList();

    TitleCase.description = "`HelloWorld` -> `Hello World`";

    TitleCase.prototype.displayName = 'Titlize';

    TitleCase.prototype.getNewText = function(text) {
      return _.humanizeEventName(_.dasherize(text));
    };

    return TitleCase;

  })(TransformString);

  EncodeUriComponent = (function(superClass) {
    extend(EncodeUriComponent, superClass);

    function EncodeUriComponent() {
      return EncodeUriComponent.__super__.constructor.apply(this, arguments);
    }

    EncodeUriComponent.extend();

    EncodeUriComponent.registerToSelectList();

    EncodeUriComponent.description = "`Hello World` -> `Hello%20World`";

    EncodeUriComponent.prototype.displayName = 'Encode URI Component %';

    EncodeUriComponent.prototype.hover = {
      icon: 'encodeURI',
      emoji: 'encodeURI'
    };

    EncodeUriComponent.prototype.getNewText = function(text) {
      return encodeURIComponent(text);
    };

    return EncodeUriComponent;

  })(TransformString);

  DecodeUriComponent = (function(superClass) {
    extend(DecodeUriComponent, superClass);

    function DecodeUriComponent() {
      return DecodeUriComponent.__super__.constructor.apply(this, arguments);
    }

    DecodeUriComponent.extend();

    DecodeUriComponent.registerToSelectList();

    DecodeUriComponent.description = "`Hello%20World` -> `Hello World`";

    DecodeUriComponent.prototype.displayName = 'Decode URI Component %%';

    DecodeUriComponent.prototype.hover = {
      icon: 'decodeURI',
      emoji: 'decodeURI'
    };

    DecodeUriComponent.prototype.getNewText = function(text) {
      return decodeURIComponent(text);
    };

    return DecodeUriComponent;

  })(TransformString);

  TrimString = (function(superClass) {
    extend(TrimString, superClass);

    function TrimString() {
      return TrimString.__super__.constructor.apply(this, arguments);
    }

    TrimString.extend();

    TrimString.registerToSelectList();

    TrimString.description = "` hello ` -> `hello`";

    TrimString.prototype.displayName = 'Trim string';

    TrimString.prototype.getNewText = function(text) {
      return text.trim();
    };

    return TrimString;

  })(TransformString);

  CompactSpaces = (function(superClass) {
    extend(CompactSpaces, superClass);

    function CompactSpaces() {
      return CompactSpaces.__super__.constructor.apply(this, arguments);
    }

    CompactSpaces.extend();

    CompactSpaces.registerToSelectList();

    CompactSpaces.description = "`  a    b    c` -> `a b c`";

    CompactSpaces.prototype.displayName = 'Compact space';

    CompactSpaces.prototype.getNewText = function(text) {
      if (text.match(/^[ ]+$/)) {
        return ' ';
      } else {
        return text.replace(/^(\s*)(.*?)(\s*)$/gm, function(m, leading, middle, trailing) {
          return leading + middle.split(/[ \t]+/).join(' ') + trailing;
        });
      }
    };

    return CompactSpaces;

  })(TransformString);

  ConvertToSoftTab = (function(superClass) {
    extend(ConvertToSoftTab, superClass);

    function ConvertToSoftTab() {
      return ConvertToSoftTab.__super__.constructor.apply(this, arguments);
    }

    ConvertToSoftTab.extend();

    ConvertToSoftTab.registerToSelectList();

    ConvertToSoftTab.prototype.displayName = 'Soft Tab';

    ConvertToSoftTab.prototype.wise = 'linewise';

    ConvertToSoftTab.prototype.mutateSelection = function(selection) {
      var scanRange;
      scanRange = selection.getBufferRange();
      return this.editor.scanInBufferRange(/\t/g, scanRange, (function(_this) {
        return function(arg) {
          var length, range, replace;
          range = arg.range, replace = arg.replace;
          length = _this.editor.screenRangeForBufferRange(range).getExtent().column;
          return replace(" ".repeat(length));
        };
      })(this));
    };

    return ConvertToSoftTab;

  })(TransformString);

  ConvertToHardTab = (function(superClass) {
    extend(ConvertToHardTab, superClass);

    function ConvertToHardTab() {
      return ConvertToHardTab.__super__.constructor.apply(this, arguments);
    }

    ConvertToHardTab.extend();

    ConvertToHardTab.registerToSelectList();

    ConvertToHardTab.prototype.displayName = 'Hard Tab';

    ConvertToHardTab.prototype.mutateSelection = function(selection) {
      var scanRange, tabLength;
      tabLength = this.editor.getTabLength();
      scanRange = selection.getBufferRange();
      return this.editor.scanInBufferRange(/[ \t]+/g, scanRange, (function(_this) {
        return function(arg) {
          var endColumn, newText, nextTabStop, range, ref2, ref3, remainder, replace, screenRange, startColumn;
          range = arg.range, replace = arg.replace;
          screenRange = _this.editor.screenRangeForBufferRange(range);
          (ref2 = screenRange.start, startColumn = ref2.column), (ref3 = screenRange.end, endColumn = ref3.column);
          newText = '';
          while (true) {
            remainder = modulo(startColumn, tabLength);
            nextTabStop = startColumn + (remainder === 0 ? tabLength : remainder);
            if (nextTabStop > endColumn) {
              newText += " ".repeat(endColumn - startColumn);
            } else {
              newText += "\t";
            }
            startColumn = nextTabStop;
            if (startColumn >= endColumn) {
              break;
            }
          }
          return replace(newText);
        };
      })(this));
    };

    return ConvertToHardTab;

  })(TransformString);

  TransformStringByExternalCommand = (function(superClass) {
    extend(TransformStringByExternalCommand, superClass);

    function TransformStringByExternalCommand() {
      return TransformStringByExternalCommand.__super__.constructor.apply(this, arguments);
    }

    TransformStringByExternalCommand.extend(false);

    TransformStringByExternalCommand.prototype.autoIndent = true;

    TransformStringByExternalCommand.prototype.command = '';

    TransformStringByExternalCommand.prototype.args = [];

    TransformStringByExternalCommand.prototype.stdoutBySelection = null;

    TransformStringByExternalCommand.prototype.execute = function() {
      if (this.selectTarget()) {
        return new Promise((function(_this) {
          return function(resolve) {
            return _this.collect(resolve);
          };
        })(this)).then((function(_this) {
          return function() {
            var i, len, ref2, selection, text;
            ref2 = _this.editor.getSelections();
            for (i = 0, len = ref2.length; i < len; i++) {
              selection = ref2[i];
              text = _this.getNewText(selection.getText(), selection);
              selection.insertText(text, {
                autoIndent: _this.autoIndent
              });
            }
            _this.restoreCursorPositionsIfNecessary();
            return _this.activateMode(_this.finalMode, _this.finalSubmode);
          };
        })(this));
      }
    };

    TransformStringByExternalCommand.prototype.collect = function(resolve) {
      var args, command, fn, i, len, processFinished, processRunning, ref2, ref3, ref4, selection;
      this.stdoutBySelection = new Map;
      processRunning = processFinished = 0;
      ref2 = this.editor.getSelections();
      fn = (function(_this) {
        return function(selection) {
          var exit, stdin, stdout;
          stdin = _this.getStdin(selection);
          stdout = function(output) {
            return _this.stdoutBySelection.set(selection, output);
          };
          exit = function(code) {
            processFinished++;
            if (processRunning === processFinished) {
              return resolve();
            }
          };
          return _this.runExternalCommand({
            command: command,
            args: args,
            stdout: stdout,
            exit: exit,
            stdin: stdin
          });
        };
      })(this);
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        ref4 = (ref3 = this.getCommand(selection)) != null ? ref3 : {}, command = ref4.command, args = ref4.args;
        if (!((command != null) && (args != null))) {
          return;
        }
        processRunning++;
        fn(selection);
      }
    };

    TransformStringByExternalCommand.prototype.runExternalCommand = function(options) {
      var bufferedProcess, stdin;
      stdin = options.stdin;
      delete options.stdin;
      bufferedProcess = new BufferedProcess(options);
      bufferedProcess.onWillThrowError((function(_this) {
        return function(arg) {
          var commandName, error, handle;
          error = arg.error, handle = arg.handle;
          if (error.code === 'ENOENT' && error.syscall.indexOf('spawn') === 0) {
            commandName = _this.constructor.getCommandName();
            console.log(commandName + ": Failed to spawn command " + error.path + ".");
            handle();
          }
          return _this.cancelOperation();
        };
      })(this));
      if (stdin) {
        bufferedProcess.process.stdin.write(stdin);
        return bufferedProcess.process.stdin.end();
      }
    };

    TransformStringByExternalCommand.prototype.getNewText = function(text, selection) {
      var ref2;
      return (ref2 = this.getStdout(selection)) != null ? ref2 : text;
    };

    TransformStringByExternalCommand.prototype.getCommand = function(selection) {
      return {
        command: this.command,
        args: this.args
      };
    };

    TransformStringByExternalCommand.prototype.getStdin = function(selection) {
      return selection.getText();
    };

    TransformStringByExternalCommand.prototype.getStdout = function(selection) {
      return this.stdoutBySelection.get(selection);
    };

    return TransformStringByExternalCommand;

  })(TransformString);

  selectListItems = null;

  TransformStringBySelectList = (function(superClass) {
    extend(TransformStringBySelectList, superClass);

    function TransformStringBySelectList() {
      return TransformStringBySelectList.__super__.constructor.apply(this, arguments);
    }

    TransformStringBySelectList.extend();

    TransformStringBySelectList.description = "Interactively choose string transformation operator from select-list";

    TransformStringBySelectList.prototype.requireInput = true;

    TransformStringBySelectList.prototype.getItems = function() {
      return selectListItems != null ? selectListItems : selectListItems = transformerRegistry.map(function(klass) {
        var displayName;
        if (klass.prototype.hasOwnProperty('displayName')) {
          displayName = klass.prototype.displayName;
        } else {
          displayName = _.humanizeEventName(_.dasherize(klass.name));
        }
        return {
          name: klass,
          displayName: displayName
        };
      });
    };

    TransformStringBySelectList.prototype.initialize = function() {
      TransformStringBySelectList.__super__.initialize.apply(this, arguments);
      this.vimState.onDidConfirmSelectList((function(_this) {
        return function(transformer) {
          var ref2, target;
          _this.vimState.reset();
          target = (ref2 = _this.target) != null ? ref2.constructor.name : void 0;
          return _this.vimState.operationStack.run(transformer.name, {
            target: target
          });
        };
      })(this));
      return this.focusSelectList({
        items: this.getItems()
      });
    };

    TransformStringBySelectList.prototype.execute = function() {
      throw new Error((this.getName()) + " should not be executed");
    };

    return TransformStringBySelectList;

  })(TransformString);

  TransformWordBySelectList = (function(superClass) {
    extend(TransformWordBySelectList, superClass);

    function TransformWordBySelectList() {
      return TransformWordBySelectList.__super__.constructor.apply(this, arguments);
    }

    TransformWordBySelectList.extend();

    TransformWordBySelectList.prototype.target = "InnerWord";

    return TransformWordBySelectList;

  })(TransformStringBySelectList);

  TransformSmartWordBySelectList = (function(superClass) {
    extend(TransformSmartWordBySelectList, superClass);

    function TransformSmartWordBySelectList() {
      return TransformSmartWordBySelectList.__super__.constructor.apply(this, arguments);
    }

    TransformSmartWordBySelectList.extend();

    TransformSmartWordBySelectList.description = "Transform InnerSmartWord by `transform-string-by-select-list`";

    TransformSmartWordBySelectList.prototype.target = "InnerSmartWord";

    return TransformSmartWordBySelectList;

  })(TransformStringBySelectList);

  ReplaceWithRegister = (function(superClass) {
    extend(ReplaceWithRegister, superClass);

    function ReplaceWithRegister() {
      return ReplaceWithRegister.__super__.constructor.apply(this, arguments);
    }

    ReplaceWithRegister.extend();

    ReplaceWithRegister.description = "Replace target with specified register value";

    ReplaceWithRegister.prototype.hover = {
      icon: ':replace-with-register:',
      emoji: ':pencil:'
    };

    ReplaceWithRegister.prototype.getNewText = function(text) {
      return this.vimState.register.getText();
    };

    return ReplaceWithRegister;

  })(TransformString);

  SwapWithRegister = (function(superClass) {
    extend(SwapWithRegister, superClass);

    function SwapWithRegister() {
      return SwapWithRegister.__super__.constructor.apply(this, arguments);
    }

    SwapWithRegister.extend();

    SwapWithRegister.description = "Swap register value with target";

    SwapWithRegister.prototype.getNewText = function(text, selection) {
      var newText;
      newText = this.vimState.register.getText();
      this.setTextToRegister(text, selection);
      return newText;
    };

    return SwapWithRegister;

  })(TransformString);

  Indent = (function(superClass) {
    extend(Indent, superClass);

    function Indent() {
      return Indent.__super__.constructor.apply(this, arguments);
    }

    Indent.extend();

    Indent.prototype.hover = {
      icon: ':indent:',
      emoji: ':point_right:'
    };

    Indent.prototype.stayOnLinewise = false;

    Indent.prototype.useMarkerForStay = true;

    Indent.prototype.clipToMutationEndOnStay = false;

    Indent.prototype.execute = function() {
      if (!this.needStay()) {
        this.onDidRestoreCursorPositions((function(_this) {
          return function() {
            return _this.editor.moveToFirstCharacterOfLine();
          };
        })(this));
      }
      return Indent.__super__.execute.apply(this, arguments);
    };

    Indent.prototype.mutateSelection = function(selection) {
      return selection.indentSelectedRows();
    };

    return Indent;

  })(TransformString);

  Outdent = (function(superClass) {
    extend(Outdent, superClass);

    function Outdent() {
      return Outdent.__super__.constructor.apply(this, arguments);
    }

    Outdent.extend();

    Outdent.prototype.hover = {
      icon: ':outdent:',
      emoji: ':point_left:'
    };

    Outdent.prototype.mutateSelection = function(selection) {
      return selection.outdentSelectedRows();
    };

    return Outdent;

  })(Indent);

  AutoIndent = (function(superClass) {
    extend(AutoIndent, superClass);

    function AutoIndent() {
      return AutoIndent.__super__.constructor.apply(this, arguments);
    }

    AutoIndent.extend();

    AutoIndent.prototype.hover = {
      icon: ':auto-indent:',
      emoji: ':open_hands:'
    };

    AutoIndent.prototype.mutateSelection = function(selection) {
      return selection.autoIndentSelectedRows();
    };

    return AutoIndent;

  })(Indent);

  ToggleLineComments = (function(superClass) {
    extend(ToggleLineComments, superClass);

    function ToggleLineComments() {
      return ToggleLineComments.__super__.constructor.apply(this, arguments);
    }

    ToggleLineComments.extend();

    ToggleLineComments.prototype.hover = {
      icon: ':toggle-line-comments:',
      emoji: ':mute:'
    };

    ToggleLineComments.prototype.useMarkerForStay = true;

    ToggleLineComments.prototype.mutateSelection = function(selection) {
      return selection.toggleLineComments();
    };

    return ToggleLineComments;

  })(TransformString);

  Surround = (function(superClass) {
    extend(Surround, superClass);

    function Surround() {
      return Surround.__super__.constructor.apply(this, arguments);
    }

    Surround.extend();

    Surround.description = "Surround target by specified character like `(`, `[`, `\"`";

    Surround.prototype.displayName = "Surround ()";

    Surround.prototype.hover = {
      icon: ':surround:',
      emoji: ':two_women_holding_hands:'
    };

    Surround.prototype.pairs = [['[', ']'], ['(', ')'], ['{', '}'], ['<', '>']];

    Surround.prototype.input = null;

    Surround.prototype.charsMax = 1;

    Surround.prototype.requireInput = true;

    Surround.prototype.autoIndent = false;

    Surround.prototype.initialize = function() {
      Surround.__super__.initialize.apply(this, arguments);
      if (!this.requireInput) {
        return;
      }
      if (this.requireTarget) {
        return this.onDidSetTarget((function(_this) {
          return function() {
            _this.onDidConfirmInput(function(input) {
              return _this.onConfirm(input);
            });
            _this.onDidChangeInput(function(input) {
              return _this.addHover(input);
            });
            _this.onDidCancelInput(function() {
              return _this.cancelOperation();
            });
            return _this.vimState.input.focus(_this.charsMax);
          };
        })(this));
      } else {
        this.onDidConfirmInput((function(_this) {
          return function(input) {
            return _this.onConfirm(input);
          };
        })(this));
        this.onDidChangeInput((function(_this) {
          return function(input) {
            return _this.addHover(input);
          };
        })(this));
        this.onDidCancelInput((function(_this) {
          return function() {
            return _this.cancelOperation();
          };
        })(this));
        return this.vimState.input.focus(this.charsMax);
      }
    };

    Surround.prototype.onConfirm = function(input1) {
      this.input = input1;
      return this.processOperation();
    };

    Surround.prototype.getPair = function(char) {
      var pair;
      pair = _.detect(this.pairs, function(pair) {
        return indexOf.call(pair, char) >= 0;
      });
      return pair != null ? pair : pair = [char, char];
    };

    Surround.prototype.surround = function(text, char, options) {
      var close, keepLayout, open, ref2, ref3;
      if (options == null) {
        options = {};
      }
      keepLayout = (ref2 = options.keepLayout) != null ? ref2 : false;
      ref3 = this.getPair(char), open = ref3[0], close = ref3[1];
      if ((!keepLayout) && LineEndingRegExp.test(text)) {
        this.autoIndent = true;
        open += "\n";
        close += "\n";
      }
      if (indexOf.call(settings.get('charactersToAddSpaceOnSurround'), char) >= 0 && isSingleLine(text)) {
        return open + ' ' + text + ' ' + close;
      } else {
        return open + text + close;
      }
    };

    Surround.prototype.getNewText = function(text) {
      return this.surround(text, this.input);
    };

    return Surround;

  })(TransformString);

  SurroundWord = (function(superClass) {
    extend(SurroundWord, superClass);

    function SurroundWord() {
      return SurroundWord.__super__.constructor.apply(this, arguments);
    }

    SurroundWord.extend();

    SurroundWord.description = "Surround **word**";

    SurroundWord.prototype.target = 'InnerWord';

    return SurroundWord;

  })(Surround);

  SurroundSmartWord = (function(superClass) {
    extend(SurroundSmartWord, superClass);

    function SurroundSmartWord() {
      return SurroundSmartWord.__super__.constructor.apply(this, arguments);
    }

    SurroundSmartWord.extend();

    SurroundSmartWord.description = "Surround **smart-word**";

    SurroundSmartWord.prototype.target = 'InnerSmartWord';

    return SurroundSmartWord;

  })(Surround);

  MapSurround = (function(superClass) {
    extend(MapSurround, superClass);

    function MapSurround() {
      return MapSurround.__super__.constructor.apply(this, arguments);
    }

    MapSurround.extend();

    MapSurround.description = "Surround each word(`/\w+/`) within target";

    MapSurround.prototype.occurrence = true;

    MapSurround.prototype.patternForOccurrence = /\w+/g;

    return MapSurround;

  })(Surround);

  DeleteSurround = (function(superClass) {
    extend(DeleteSurround, superClass);

    function DeleteSurround() {
      return DeleteSurround.__super__.constructor.apply(this, arguments);
    }

    DeleteSurround.extend();

    DeleteSurround.description = "Delete specified surround character like `(`, `[`, `\"`";

    DeleteSurround.prototype.pairChars = ['[]', '()', '{}'].join('');

    DeleteSurround.prototype.requireTarget = false;

    DeleteSurround.prototype.onConfirm = function(input1) {
      var ref2;
      this.input = input1;
      this.setTarget(this["new"]('Pair', {
        pair: this.getPair(this.input),
        inner: false,
        allowNextLine: (ref2 = this.input, indexOf.call(this.pairChars, ref2) >= 0)
      }));
      return this.processOperation();
    };

    DeleteSurround.prototype.getNewText = function(text) {
      var closeChar, openChar, ref2;
      ref2 = [text[0], _.last(text)], openChar = ref2[0], closeChar = ref2[1];
      text = text.slice(1, -1);
      if (isSingleLine(text)) {
        if (openChar !== closeChar) {
          text = text.trim();
        }
      }
      return text;
    };

    return DeleteSurround;

  })(Surround);

  DeleteSurroundAnyPair = (function(superClass) {
    extend(DeleteSurroundAnyPair, superClass);

    function DeleteSurroundAnyPair() {
      return DeleteSurroundAnyPair.__super__.constructor.apply(this, arguments);
    }

    DeleteSurroundAnyPair.extend();

    DeleteSurroundAnyPair.description = "Delete surround character by auto-detect paired char from cursor enclosed pair";

    DeleteSurroundAnyPair.prototype.requireInput = false;

    DeleteSurroundAnyPair.prototype.target = 'AAnyPair';

    return DeleteSurroundAnyPair;

  })(DeleteSurround);

  DeleteSurroundAnyPairAllowForwarding = (function(superClass) {
    extend(DeleteSurroundAnyPairAllowForwarding, superClass);

    function DeleteSurroundAnyPairAllowForwarding() {
      return DeleteSurroundAnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    DeleteSurroundAnyPairAllowForwarding.extend();

    DeleteSurroundAnyPairAllowForwarding.description = "Delete surround character by auto-detect paired char from cursor enclosed pair and forwarding pair within same line";

    DeleteSurroundAnyPairAllowForwarding.prototype.target = 'AAnyPairAllowForwarding';

    return DeleteSurroundAnyPairAllowForwarding;

  })(DeleteSurroundAnyPair);

  ChangeSurround = (function(superClass) {
    extend(ChangeSurround, superClass);

    function ChangeSurround() {
      return ChangeSurround.__super__.constructor.apply(this, arguments);
    }

    ChangeSurround.extend();

    ChangeSurround.description = "Change surround character, specify both from and to pair char";

    ChangeSurround.prototype.charsMax = 2;

    ChangeSurround.prototype.char = null;

    ChangeSurround.prototype.onConfirm = function(input) {
      var from, ref2;
      if (!input) {
        return;
      }
      ref2 = input.split(''), from = ref2[0], this.char = ref2[1];
      return ChangeSurround.__super__.onConfirm.call(this, from);
    };

    ChangeSurround.prototype.getNewText = function(text) {
      var innerText;
      innerText = ChangeSurround.__super__.getNewText.apply(this, arguments);
      return this.surround(innerText, this.char, {
        keepLayout: true
      });
    };

    return ChangeSurround;

  })(DeleteSurround);

  ChangeSurroundAnyPair = (function(superClass) {
    extend(ChangeSurroundAnyPair, superClass);

    function ChangeSurroundAnyPair() {
      return ChangeSurroundAnyPair.__super__.constructor.apply(this, arguments);
    }

    ChangeSurroundAnyPair.extend();

    ChangeSurroundAnyPair.description = "Change surround character, from char is auto-detected";

    ChangeSurroundAnyPair.prototype.charsMax = 1;

    ChangeSurroundAnyPair.prototype.target = "AAnyPair";

    ChangeSurroundAnyPair.prototype.highlightTargetRange = function(selection) {
      var marker, range;
      if (range = this.target.getRange(selection)) {
        marker = this.editor.markBufferRange(range);
        this.editor.decorateMarker(marker, {
          type: 'highlight',
          "class": 'vim-mode-plus-target-range'
        });
        return marker;
      } else {
        return null;
      }
    };

    ChangeSurroundAnyPair.prototype.initialize = function() {
      var marker;
      marker = null;
      this.onDidSetTarget((function(_this) {
        return function() {
          var char, textRange;
          if (marker = _this.highlightTargetRange(_this.editor.getLastSelection())) {
            textRange = Range.fromPointWithDelta(marker.getBufferRange().start, 0, 1);
            char = _this.editor.getTextInBufferRange(textRange);
            return _this.addHover(char, {}, _this.editor.getCursorBufferPosition());
          } else {
            _this.vimState.input.cancel();
            return _this.abort();
          }
        };
      })(this));
      this.onDidResetOperationStack(function() {
        return marker != null ? marker.destroy() : void 0;
      });
      return ChangeSurroundAnyPair.__super__.initialize.apply(this, arguments);
    };

    ChangeSurroundAnyPair.prototype.onConfirm = function(char1) {
      this.char = char1;
      this.input = this.char;
      return this.processOperation();
    };

    return ChangeSurroundAnyPair;

  })(ChangeSurround);

  ChangeSurroundAnyPairAllowForwarding = (function(superClass) {
    extend(ChangeSurroundAnyPairAllowForwarding, superClass);

    function ChangeSurroundAnyPairAllowForwarding() {
      return ChangeSurroundAnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    ChangeSurroundAnyPairAllowForwarding.extend();

    ChangeSurroundAnyPairAllowForwarding.description = "Change surround character, from char is auto-detected from enclosed and forwarding area";

    ChangeSurroundAnyPairAllowForwarding.prototype.target = "AAnyPairAllowForwarding";

    return ChangeSurroundAnyPairAllowForwarding;

  })(ChangeSurroundAnyPair);

  Join = (function(superClass) {
    extend(Join, superClass);

    function Join() {
      return Join.__super__.constructor.apply(this, arguments);
    }

    Join.extend();

    Join.prototype.target = "MoveToRelativeLine";

    Join.prototype.flashTarget = false;

    Join.prototype.restorePositions = false;

    Join.prototype.mutateSelection = function(selection) {
      var end, range;
      if (swrap(selection).isLinewise()) {
        range = selection.getBufferRange();
        selection.setBufferRange(range.translate([0, 0], [-1, 2e308]));
      }
      selection.joinLines();
      end = selection.getBufferRange().end;
      return selection.cursor.setBufferPosition(end.translate([0, -1]));
    };

    return Join;

  })(TransformString);

  JoinWithKeepingSpace = (function(superClass) {
    extend(JoinWithKeepingSpace, superClass);

    function JoinWithKeepingSpace() {
      return JoinWithKeepingSpace.__super__.constructor.apply(this, arguments);
    }

    JoinWithKeepingSpace.extend();

    JoinWithKeepingSpace.registerToSelectList();

    JoinWithKeepingSpace.prototype.input = '';

    JoinWithKeepingSpace.prototype.requireTarget = false;

    JoinWithKeepingSpace.prototype.trim = false;

    JoinWithKeepingSpace.prototype.initialize = function() {
      return this.setTarget(this["new"]("MoveToRelativeLineWithMinimum", {
        min: 1
      }));
    };

    JoinWithKeepingSpace.prototype.mutateSelection = function(selection) {
      var endRow, ref2, row, rows, startRow, text;
      ref2 = selection.getBufferRowRange(), startRow = ref2[0], endRow = ref2[1];
      swrap(selection).expandOverLine();
      rows = (function() {
        var i, ref3, ref4, results;
        results = [];
        for (row = i = ref3 = startRow, ref4 = endRow; ref3 <= ref4 ? i <= ref4 : i >= ref4; row = ref3 <= ref4 ? ++i : --i) {
          text = this.editor.lineTextForBufferRow(row);
          if (this.trim && row !== startRow) {
            results.push(text.trimLeft());
          } else {
            results.push(text);
          }
        }
        return results;
      }).call(this);
      return selection.insertText(this.join(rows) + "\n");
    };

    JoinWithKeepingSpace.prototype.join = function(rows) {
      return rows.join(this.input);
    };

    return JoinWithKeepingSpace;

  })(TransformString);

  JoinByInput = (function(superClass) {
    extend(JoinByInput, superClass);

    function JoinByInput() {
      return JoinByInput.__super__.constructor.apply(this, arguments);
    }

    JoinByInput.extend();

    JoinByInput.registerToSelectList();

    JoinByInput.description = "Transform multi-line to single-line by with specified separator character";

    JoinByInput.prototype.hover = {
      icon: ':join:',
      emoji: ':couple:'
    };

    JoinByInput.prototype.requireInput = true;

    JoinByInput.prototype.input = null;

    JoinByInput.prototype.trim = true;

    JoinByInput.prototype.initialize = function() {
      var charsMax;
      JoinByInput.__super__.initialize.apply(this, arguments);
      charsMax = 10;
      return this.focusInput(charsMax);
    };

    JoinByInput.prototype.join = function(rows) {
      return rows.join(" " + this.input + " ");
    };

    return JoinByInput;

  })(JoinWithKeepingSpace);

  JoinByInputWithKeepingSpace = (function(superClass) {
    extend(JoinByInputWithKeepingSpace, superClass);

    function JoinByInputWithKeepingSpace() {
      return JoinByInputWithKeepingSpace.__super__.constructor.apply(this, arguments);
    }

    JoinByInputWithKeepingSpace.description = "Join lines without padding space between each line";

    JoinByInputWithKeepingSpace.extend();

    JoinByInputWithKeepingSpace.registerToSelectList();

    JoinByInputWithKeepingSpace.prototype.trim = false;

    JoinByInputWithKeepingSpace.prototype.join = function(rows) {
      return rows.join(this.input);
    };

    return JoinByInputWithKeepingSpace;

  })(JoinByInput);

  SplitString = (function(superClass) {
    extend(SplitString, superClass);

    function SplitString() {
      return SplitString.__super__.constructor.apply(this, arguments);
    }

    SplitString.extend();

    SplitString.registerToSelectList();

    SplitString.description = "Split single-line into multi-line by splitting specified separator chars";

    SplitString.prototype.hover = {
      icon: ':split-string:',
      emoji: ':hocho:'
    };

    SplitString.prototype.requireInput = true;

    SplitString.prototype.input = null;

    SplitString.prototype.initialize = function() {
      var charsMax;
      SplitString.__super__.initialize.apply(this, arguments);
      if (!this.isMode('visual')) {
        this.setTarget(this["new"]("MoveToRelativeLine", {
          min: 1
        }));
      }
      charsMax = 10;
      return this.focusInput(charsMax);
    };

    SplitString.prototype.getNewText = function(text) {
      var regex;
      if (this.input === '') {
        this.input = "\\n";
      }
      regex = RegExp("" + (_.escapeRegExp(this.input)), "g");
      return text.split(regex).join("\n");
    };

    return SplitString;

  })(TransformString);

  ChangeOrder = (function(superClass) {
    extend(ChangeOrder, superClass);

    function ChangeOrder() {
      return ChangeOrder.__super__.constructor.apply(this, arguments);
    }

    ChangeOrder.extend(false);

    ChangeOrder.prototype.wise = 'linewise';

    ChangeOrder.prototype.mutateSelection = function(selection) {
      var newText, rows, textForRows;
      textForRows = swrap(selection).lineTextForBufferRows();
      rows = this.getNewRows(textForRows);
      newText = rows.join("\n") + "\n";
      return selection.insertText(newText);
    };

    return ChangeOrder;

  })(TransformString);

  Reverse = (function(superClass) {
    extend(Reverse, superClass);

    function Reverse() {
      return Reverse.__super__.constructor.apply(this, arguments);
    }

    Reverse.extend();

    Reverse.registerToSelectList();

    Reverse.description = "Reverse lines(e.g reverse selected three line)";

    Reverse.prototype.getNewRows = function(rows) {
      return rows.reverse();
    };

    return Reverse;

  })(ChangeOrder);

  Sort = (function(superClass) {
    extend(Sort, superClass);

    function Sort() {
      return Sort.__super__.constructor.apply(this, arguments);
    }

    Sort.extend();

    Sort.registerToSelectList();

    Sort.description = "Sort lines alphabetically";

    Sort.prototype.getNewRows = function(rows) {
      return rows.sort();
    };

    return Sort;

  })(ChangeOrder);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvb3BlcmF0b3ItdHJhbnNmb3JtLXN0cmluZy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDY3QkFBQTtJQUFBOzs7OztFQUFBLGdCQUFBLEdBQW1COztFQUNuQixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQTJCLE9BQUEsQ0FBUSxNQUFSLENBQTNCLEVBQUMscUNBQUQsRUFBa0I7O0VBRWxCLE9BR0ksT0FBQSxDQUFRLFNBQVIsQ0FISixFQUNFLDBEQURGLEVBRUU7O0VBRUYsS0FBQSxHQUFRLE9BQUEsQ0FBUSxxQkFBUjs7RUFDUixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBQ1gsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLFFBQUEsR0FBVyxJQUFJLENBQUMsUUFBTCxDQUFjLFVBQWQ7O0VBSVgsbUJBQUEsR0FBc0I7O0VBQ2hCOzs7Ozs7O0lBQ0osZUFBQyxDQUFBLE1BQUQsQ0FBUSxLQUFSOzs4QkFDQSxXQUFBLEdBQWE7OzhCQUNiLGNBQUEsR0FBZ0I7OzhCQUNoQixVQUFBLEdBQVk7O0lBRVosZUFBQyxDQUFBLG9CQUFELEdBQXVCLFNBQUE7YUFDckIsbUJBQW1CLENBQUMsSUFBcEIsQ0FBeUIsSUFBekI7SUFEcUI7OzhCQUd2QixlQUFBLEdBQWlCLFNBQUMsU0FBRCxFQUFZLFlBQVo7QUFDZixVQUFBO01BQUEsSUFBRyxJQUFBLEdBQU8sSUFBQyxDQUFBLFVBQUQsQ0FBWSxTQUFTLENBQUMsT0FBVixDQUFBLENBQVosRUFBaUMsU0FBakMsRUFBNEMsWUFBNUMsQ0FBVjtlQUNFLFNBQVMsQ0FBQyxVQUFWLENBQXFCLElBQXJCLEVBQTJCO1VBQUUsWUFBRCxJQUFDLENBQUEsVUFBRjtTQUEzQixFQURGOztJQURlOzs7O0tBVFc7O0VBYXhCOzs7Ozs7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QyxDQUFBLG9CQUFELENBQUE7O0lBQ0EsT0FBQyxDQUFBLFdBQUQsR0FBYzs7c0JBQ2QsVUFBQSxHQUFZLFNBQUMsSUFBRDthQUNWLElBQUksQ0FBQyxPQUFMLENBQUE7SUFEVTs7OztLQUpROztFQU9oQjs7Ozs7OztJQUNKLElBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0EsSUFBQyxDQUFBLG9CQUFELENBQUE7O0lBQ0EsSUFBQyxDQUFBLFdBQUQsR0FBYzs7bUJBQ2QsVUFBQSxHQUFZLFNBQUMsSUFBRDthQUNWLElBQUksQ0FBQyxJQUFMLENBQUE7SUFEVTs7OztLQUpLO0FBbG9CbkIiLCJzb3VyY2VzQ29udGVudCI6WyJMaW5lRW5kaW5nUmVnRXhwID0gLyg/OlxcbnxcXHJcXG4pJC9cbl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57QnVmZmVyZWRQcm9jZXNzLCBSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuXG57XG4gIGhhdmVTb21lTm9uRW1wdHlTZWxlY3Rpb25cbiAgaXNTaW5nbGVMaW5lXG59ID0gcmVxdWlyZSAnLi91dGlscydcbnN3cmFwID0gcmVxdWlyZSAnLi9zZWxlY3Rpb24td3JhcHBlcidcbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcbkJhc2UgPSByZXF1aXJlICcuL2Jhc2UnXG5PcGVyYXRvciA9IEJhc2UuZ2V0Q2xhc3MoJ09wZXJhdG9yJylcblxuIyBUcmFuc2Zvcm1TdHJpbmdcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbnRyYW5zZm9ybWVyUmVnaXN0cnkgPSBbXVxuY2xhc3MgVHJhbnNmb3JtU3RyaW5nIGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZChmYWxzZSlcbiAgdHJhY2tDaGFuZ2U6IHRydWVcbiAgc3RheU9uTGluZXdpc2U6IHRydWVcbiAgYXV0b0luZGVudDogZmFsc2VcblxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3Q6IC0+XG4gICAgdHJhbnNmb3JtZXJSZWdpc3RyeS5wdXNoKHRoaXMpXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uLCBzdG9wTXV0YXRpb24pIC0+XG4gICAgaWYgdGV4dCA9IEBnZXROZXdUZXh0KHNlbGVjdGlvbi5nZXRUZXh0KCksIHNlbGVjdGlvbiwgc3RvcE11dGF0aW9uKVxuICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQodGV4dCwge0BhdXRvSW5kZW50fSlcblxuY2xhc3MgVG9nZ2xlQ2FzZSBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgQHJlZ2lzdGVyVG9TZWxlY3RMaXN0KClcbiAgQGRlc2NyaXB0aW9uOiBcImBIZWxsbyBXb3JsZGAgLT4gYGhFTExPIHdPUkxEYFwiXG4gIGRpc3BsYXlOYW1lOiAnVG9nZ2xlIH4nXG4gIGhvdmVyOiBpY29uOiAnOnRvZ2dsZS1jYXNlOicsIGVtb2ppOiAnOmNsYXA6J1xuXG4gIHRvZ2dsZUNhc2U6IChjaGFyKSAtPlxuICAgIGNoYXJMb3dlciA9IGNoYXIudG9Mb3dlckNhc2UoKVxuICAgIGlmIGNoYXJMb3dlciBpcyBjaGFyXG4gICAgICBjaGFyLnRvVXBwZXJDYXNlKClcbiAgICBlbHNlXG4gICAgICBjaGFyTG93ZXJcblxuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICB0ZXh0LnJlcGxhY2UoLy4vZywgQHRvZ2dsZUNhc2UuYmluZCh0aGlzKSlcblxuY2xhc3MgVG9nZ2xlQ2FzZUFuZE1vdmVSaWdodCBleHRlbmRzIFRvZ2dsZUNhc2VcbiAgQGV4dGVuZCgpXG4gIGhvdmVyOiBudWxsXG4gIGZsYXNoVGFyZ2V0OiBmYWxzZVxuICByZXN0b3JlUG9zaXRpb25zOiBmYWxzZVxuICB0YXJnZXQ6ICdNb3ZlUmlnaHQnXG5cbmNsYXNzIFVwcGVyQ2FzZSBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgQHJlZ2lzdGVyVG9TZWxlY3RMaXN0KClcbiAgQGRlc2NyaXB0aW9uOiBcImBIZWxsbyBXb3JsZGAgLT4gYEhFTExPIFdPUkxEYFwiXG4gIGhvdmVyOiBpY29uOiAnOnVwcGVyLWNhc2U6JywgZW1vamk6ICc6cG9pbnRfdXA6J1xuICBkaXNwbGF5TmFtZTogJ1VwcGVyJ1xuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICB0ZXh0LnRvVXBwZXJDYXNlKClcblxuY2xhc3MgTG93ZXJDYXNlIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBAZGVzY3JpcHRpb246IFwiYEhlbGxvIFdvcmxkYCAtPiBgaGVsbG8gd29ybGRgXCJcbiAgaG92ZXI6IGljb246ICc6bG93ZXItY2FzZTonLCBlbW9qaTogJzpwb2ludF9kb3duOidcbiAgZGlzcGxheU5hbWU6ICdMb3dlcidcbiAgZ2V0TmV3VGV4dDogKHRleHQpIC0+XG4gICAgdGV4dC50b0xvd2VyQ2FzZSgpXG5cbiMgUmVwbGFjZVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBSZXBsYWNlIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBpbnB1dDogbnVsbFxuICBob3ZlcjogaWNvbjogJzpyZXBsYWNlOicsIGVtb2ppOiAnOnRyYWN0b3I6J1xuICByZXF1aXJlSW5wdXQ6IHRydWVcblxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgaWYgQGlzTW9kZSgnbm9ybWFsJylcbiAgICAgIEB0YXJnZXQgPSAnTW92ZVJpZ2h0QnVmZmVyQ29sdW1uJ1xuICAgIEBmb2N1c0lucHV0KClcblxuICBnZXRJbnB1dDogLT5cbiAgICBzdXBlciBvciBcIlxcblwiXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIGlmIEB0YXJnZXQuaXMoJ01vdmVSaWdodEJ1ZmZlckNvbHVtbicpXG4gICAgICByZXR1cm4gdW5sZXNzIHNlbGVjdGlvbi5nZXRUZXh0KCkubGVuZ3RoIGlzIEBnZXRDb3VudCgpXG5cbiAgICBpbnB1dCA9IEBnZXRJbnB1dCgpXG4gICAgQHJlc3RvcmVQb3NpdGlvbnMgPSBmYWxzZSBpZiBpbnB1dCBpcyBcIlxcblwiXG4gICAgdGV4dCA9IHNlbGVjdGlvbi5nZXRUZXh0KCkucmVwbGFjZSgvLi9nLCBpbnB1dClcbiAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0LCBhdXRvSW5kZW50TmV3bGluZTogdHJ1ZSlcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIERVUCBtZWFuaW5nIHdpdGggU3BsaXRTdHJpbmcgbmVlZCBjb25zb2xpZGF0ZS5cbmNsYXNzIFNwbGl0QnlDaGFyYWN0ZXIgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIHRleHQuc3BsaXQoJycpLmpvaW4oJyAnKVxuXG5jbGFzcyBDYW1lbENhc2UgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIGRpc3BsYXlOYW1lOiAnQ2FtZWxpemUnXG4gIEBkZXNjcmlwdGlvbjogXCJgaGVsbG8td29ybGRgIC0+IGBoZWxsb1dvcmxkYFwiXG4gIGhvdmVyOiBpY29uOiAnOmNhbWVsLWNhc2U6JywgZW1vamk6ICc6Y2FtZWw6J1xuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICBfLmNhbWVsaXplKHRleHQpXG5cbmNsYXNzIFNuYWtlQ2FzZSBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgQHJlZ2lzdGVyVG9TZWxlY3RMaXN0KClcbiAgQGRlc2NyaXB0aW9uOiBcImBIZWxsb1dvcmxkYCAtPiBgaGVsbG9fd29ybGRgXCJcbiAgZGlzcGxheU5hbWU6ICdVbmRlcnNjb3JlIF8nXG4gIGhvdmVyOiBpY29uOiAnOnNuYWtlLWNhc2U6JywgZW1vamk6ICc6c25ha2U6J1xuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICBfLnVuZGVyc2NvcmUodGV4dClcblxuY2xhc3MgUGFzY2FsQ2FzZSBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgQHJlZ2lzdGVyVG9TZWxlY3RMaXN0KClcbiAgQGRlc2NyaXB0aW9uOiBcImBoZWxsb193b3JsZGAgLT4gYEhlbGxvV29ybGRgXCJcbiAgZGlzcGxheU5hbWU6ICdQYXNjYWxpemUnXG4gIGhvdmVyOiBpY29uOiAnOnBhc2NhbC1jYXNlOicsIGVtb2ppOiAnOnRyaWFuZ3VsYXJfcnVsZXI6J1xuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICBfLmNhcGl0YWxpemUoXy5jYW1lbGl6ZSh0ZXh0KSlcblxuY2xhc3MgRGFzaENhc2UgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIGRpc3BsYXlOYW1lOiAnRGFzaGVyaXplIC0nXG4gIEBkZXNjcmlwdGlvbjogXCJIZWxsb1dvcmxkIC0+IGhlbGxvLXdvcmxkXCJcbiAgaG92ZXI6IGljb246ICc6ZGFzaC1jYXNlOicsIGVtb2ppOiAnOmRhc2g6J1xuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICBfLmRhc2hlcml6ZSh0ZXh0KVxuXG5jbGFzcyBUaXRsZUNhc2UgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIEBkZXNjcmlwdGlvbjogXCJgSGVsbG9Xb3JsZGAgLT4gYEhlbGxvIFdvcmxkYFwiXG4gIGRpc3BsYXlOYW1lOiAnVGl0bGl6ZSdcbiAgZ2V0TmV3VGV4dDogKHRleHQpIC0+XG4gICAgXy5odW1hbml6ZUV2ZW50TmFtZShfLmRhc2hlcml6ZSh0ZXh0KSlcblxuY2xhc3MgRW5jb2RlVXJpQ29tcG9uZW50IGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBAZGVzY3JpcHRpb246IFwiYEhlbGxvIFdvcmxkYCAtPiBgSGVsbG8lMjBXb3JsZGBcIlxuICBkaXNwbGF5TmFtZTogJ0VuY29kZSBVUkkgQ29tcG9uZW50ICUnXG4gIGhvdmVyOiBpY29uOiAnZW5jb2RlVVJJJywgZW1vamk6ICdlbmNvZGVVUkknXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIGVuY29kZVVSSUNvbXBvbmVudCh0ZXh0KVxuXG5jbGFzcyBEZWNvZGVVcmlDb21wb25lbnQgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIEBkZXNjcmlwdGlvbjogXCJgSGVsbG8lMjBXb3JsZGAgLT4gYEhlbGxvIFdvcmxkYFwiXG4gIGRpc3BsYXlOYW1lOiAnRGVjb2RlIFVSSSBDb21wb25lbnQgJSUnXG4gIGhvdmVyOiBpY29uOiAnZGVjb2RlVVJJJywgZW1vamk6ICdkZWNvZGVVUkknXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIGRlY29kZVVSSUNvbXBvbmVudCh0ZXh0KVxuXG5jbGFzcyBUcmltU3RyaW5nIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBAZGVzY3JpcHRpb246IFwiYCBoZWxsbyBgIC0+IGBoZWxsb2BcIlxuICBkaXNwbGF5TmFtZTogJ1RyaW0gc3RyaW5nJ1xuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICB0ZXh0LnRyaW0oKVxuXG5jbGFzcyBDb21wYWN0U3BhY2VzIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBAZGVzY3JpcHRpb246IFwiYCAgYSAgICBiICAgIGNgIC0+IGBhIGIgY2BcIlxuICBkaXNwbGF5TmFtZTogJ0NvbXBhY3Qgc3BhY2UnXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIGlmIHRleHQubWF0Y2goL15bIF0rJC8pXG4gICAgICAnICdcbiAgICBlbHNlXG4gICAgICAjIERvbid0IGNvbXBhY3QgZm9yIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlIHNwYWNlcy5cbiAgICAgIHRleHQucmVwbGFjZSAvXihcXHMqKSguKj8pKFxccyopJC9nbSwgKG0sIGxlYWRpbmcsIG1pZGRsZSwgdHJhaWxpbmcpIC0+XG4gICAgICAgIGxlYWRpbmcgKyBtaWRkbGUuc3BsaXQoL1sgXFx0XSsvKS5qb2luKCcgJykgKyB0cmFpbGluZ1xuXG5jbGFzcyBDb252ZXJ0VG9Tb2Z0VGFiIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBkaXNwbGF5TmFtZTogJ1NvZnQgVGFiJ1xuICB3aXNlOiAnbGluZXdpc2UnXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIHNjYW5SYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSAvXFx0L2csIHNjYW5SYW5nZSwgKHtyYW5nZSwgcmVwbGFjZX0pID0+XG4gICAgICAjIFJlcGxhY2UgXFx0IHRvIHNwYWNlcyB3aGljaCBsZW5ndGggaXMgdmFyeSBkZXBlbmRpbmcgb24gdGFiU3RvcCBhbmQgdGFiTGVuZ2h0XG4gICAgICAjIFNvIHdlIGRpcmVjdGx5IGNvbnN1bHQgaXQncyBzY3JlZW4gcmVwcmVzZW50aW5nIGxlbmd0aC5cbiAgICAgIGxlbmd0aCA9IEBlZGl0b3Iuc2NyZWVuUmFuZ2VGb3JCdWZmZXJSYW5nZShyYW5nZSkuZ2V0RXh0ZW50KCkuY29sdW1uXG4gICAgICByZXBsYWNlKFwiIFwiLnJlcGVhdChsZW5ndGgpKVxuXG5jbGFzcyBDb252ZXJ0VG9IYXJkVGFiIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBkaXNwbGF5TmFtZTogJ0hhcmQgVGFiJ1xuXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICB0YWJMZW5ndGggPSBAZWRpdG9yLmdldFRhYkxlbmd0aCgpXG4gICAgc2NhblJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIC9bIFxcdF0rL2csIHNjYW5SYW5nZSwgKHtyYW5nZSwgcmVwbGFjZX0pID0+XG4gICAgICBzY3JlZW5SYW5nZSA9IEBlZGl0b3Iuc2NyZWVuUmFuZ2VGb3JCdWZmZXJSYW5nZShyYW5nZSlcbiAgICAgIHtzdGFydDoge2NvbHVtbjogc3RhcnRDb2x1bW59LCBlbmQ6IHtjb2x1bW46IGVuZENvbHVtbn19ID0gc2NyZWVuUmFuZ2VcblxuICAgICAgIyBXZSBjYW4ndCBuYWl2ZWx5IHJlcGxhY2Ugc3BhY2VzIHRvIHRhYiwgd2UgaGF2ZSB0byBjb25zaWRlciB2YWxpZCB0YWJTdG9wIGNvbHVtblxuICAgICAgIyBJZiBuZXh0VGFiU3RvcCBjb2x1bW4gZXhjZWVkcyByZXBsYWNhYmxlIHJhbmdlLCB3ZSBwYWQgd2l0aCBzcGFjZXMuXG4gICAgICBuZXdUZXh0ID0gJydcbiAgICAgIGxvb3BcbiAgICAgICAgcmVtYWluZGVyID0gc3RhcnRDb2x1bW4gJSUgdGFiTGVuZ3RoXG4gICAgICAgIG5leHRUYWJTdG9wID0gc3RhcnRDb2x1bW4gKyAoaWYgcmVtYWluZGVyIGlzIDAgdGhlbiB0YWJMZW5ndGggZWxzZSByZW1haW5kZXIpXG4gICAgICAgIGlmIG5leHRUYWJTdG9wID4gZW5kQ29sdW1uXG4gICAgICAgICAgbmV3VGV4dCArPSBcIiBcIi5yZXBlYXQoZW5kQ29sdW1uIC0gc3RhcnRDb2x1bW4pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBuZXdUZXh0ICs9IFwiXFx0XCJcbiAgICAgICAgc3RhcnRDb2x1bW4gPSBuZXh0VGFiU3RvcFxuICAgICAgICBicmVhayBpZiBzdGFydENvbHVtbiA+PSBlbmRDb2x1bW5cblxuICAgICAgcmVwbGFjZShuZXdUZXh0KVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFRyYW5zZm9ybVN0cmluZ0J5RXh0ZXJuYWxDb21tYW5kIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoZmFsc2UpXG4gIGF1dG9JbmRlbnQ6IHRydWVcbiAgY29tbWFuZDogJycgIyBlLmcuIGNvbW1hbmQ6ICdzb3J0J1xuICBhcmdzOiBbXSAjIGUuZyBhcmdzOiBbJy1ybiddXG4gIHN0ZG91dEJ5U2VsZWN0aW9uOiBudWxsXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBpZiBAc2VsZWN0VGFyZ2V0KClcbiAgICAgIG5ldyBQcm9taXNlIChyZXNvbHZlKSA9PlxuICAgICAgICBAY29sbGVjdChyZXNvbHZlKVxuICAgICAgLnRoZW4gPT5cbiAgICAgICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgICAgIHRleHQgPSBAZ2V0TmV3VGV4dChzZWxlY3Rpb24uZ2V0VGV4dCgpLCBzZWxlY3Rpb24pXG4gICAgICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQodGV4dCwge0BhdXRvSW5kZW50fSlcbiAgICAgICAgQHJlc3RvcmVDdXJzb3JQb3NpdGlvbnNJZk5lY2Vzc2FyeSgpXG4gICAgICAgIEBhY3RpdmF0ZU1vZGUoQGZpbmFsTW9kZSwgQGZpbmFsU3VibW9kZSlcblxuICBjb2xsZWN0OiAocmVzb2x2ZSkgLT5cbiAgICBAc3Rkb3V0QnlTZWxlY3Rpb24gPSBuZXcgTWFwXG4gICAgcHJvY2Vzc1J1bm5pbmcgPSBwcm9jZXNzRmluaXNoZWQgPSAwXG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAge2NvbW1hbmQsIGFyZ3N9ID0gQGdldENvbW1hbmQoc2VsZWN0aW9uKSA/IHt9XG4gICAgICByZXR1cm4gdW5sZXNzIChjb21tYW5kPyBhbmQgYXJncz8pXG4gICAgICBwcm9jZXNzUnVubmluZysrXG4gICAgICBkbyAoc2VsZWN0aW9uKSA9PlxuICAgICAgICBzdGRpbiA9IEBnZXRTdGRpbihzZWxlY3Rpb24pXG4gICAgICAgIHN0ZG91dCA9IChvdXRwdXQpID0+XG4gICAgICAgICAgQHN0ZG91dEJ5U2VsZWN0aW9uLnNldChzZWxlY3Rpb24sIG91dHB1dClcbiAgICAgICAgZXhpdCA9IChjb2RlKSAtPlxuICAgICAgICAgIHByb2Nlc3NGaW5pc2hlZCsrXG4gICAgICAgICAgcmVzb2x2ZSgpIGlmIChwcm9jZXNzUnVubmluZyBpcyBwcm9jZXNzRmluaXNoZWQpXG4gICAgICAgIEBydW5FeHRlcm5hbENvbW1hbmQge2NvbW1hbmQsIGFyZ3MsIHN0ZG91dCwgZXhpdCwgc3RkaW59XG5cbiAgcnVuRXh0ZXJuYWxDb21tYW5kOiAob3B0aW9ucykgLT5cbiAgICBzdGRpbiA9IG9wdGlvbnMuc3RkaW5cbiAgICBkZWxldGUgb3B0aW9ucy5zdGRpblxuICAgIGJ1ZmZlcmVkUHJvY2VzcyA9IG5ldyBCdWZmZXJlZFByb2Nlc3Mob3B0aW9ucylcbiAgICBidWZmZXJlZFByb2Nlc3Mub25XaWxsVGhyb3dFcnJvciAoe2Vycm9yLCBoYW5kbGV9KSA9PlxuICAgICAgIyBTdXBwcmVzcyBjb21tYW5kIG5vdCBmb3VuZCBlcnJvciBpbnRlbnRpb25hbGx5LlxuICAgICAgaWYgZXJyb3IuY29kZSBpcyAnRU5PRU5UJyBhbmQgZXJyb3Iuc3lzY2FsbC5pbmRleE9mKCdzcGF3bicpIGlzIDBcbiAgICAgICAgY29tbWFuZE5hbWUgPSBAY29uc3RydWN0b3IuZ2V0Q29tbWFuZE5hbWUoKVxuICAgICAgICBjb25zb2xlLmxvZyBcIiN7Y29tbWFuZE5hbWV9OiBGYWlsZWQgdG8gc3Bhd24gY29tbWFuZCAje2Vycm9yLnBhdGh9LlwiXG4gICAgICAgIGhhbmRsZSgpXG4gICAgICBAY2FuY2VsT3BlcmF0aW9uKClcblxuICAgIGlmIHN0ZGluXG4gICAgICBidWZmZXJlZFByb2Nlc3MucHJvY2Vzcy5zdGRpbi53cml0ZShzdGRpbilcbiAgICAgIGJ1ZmZlcmVkUHJvY2Vzcy5wcm9jZXNzLnN0ZGluLmVuZCgpXG5cbiAgZ2V0TmV3VGV4dDogKHRleHQsIHNlbGVjdGlvbikgLT5cbiAgICBAZ2V0U3Rkb3V0KHNlbGVjdGlvbikgPyB0ZXh0XG5cbiAgIyBGb3IgZWFzaWx5IGV4dGVuZCBieSB2bXAgcGx1Z2luLlxuICBnZXRDb21tYW5kOiAoc2VsZWN0aW9uKSAtPiB7QGNvbW1hbmQsIEBhcmdzfVxuICBnZXRTdGRpbjogKHNlbGVjdGlvbikgLT4gc2VsZWN0aW9uLmdldFRleHQoKVxuICBnZXRTdGRvdXQ6IChzZWxlY3Rpb24pIC0+IEBzdGRvdXRCeVNlbGVjdGlvbi5nZXQoc2VsZWN0aW9uKVxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbnNlbGVjdExpc3RJdGVtcyA9IG51bGxcbmNsYXNzIFRyYW5zZm9ybVN0cmluZ0J5U2VsZWN0TGlzdCBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIkludGVyYWN0aXZlbHkgY2hvb3NlIHN0cmluZyB0cmFuc2Zvcm1hdGlvbiBvcGVyYXRvciBmcm9tIHNlbGVjdC1saXN0XCJcbiAgcmVxdWlyZUlucHV0OiB0cnVlXG5cbiAgZ2V0SXRlbXM6IC0+XG4gICAgc2VsZWN0TGlzdEl0ZW1zID89IHRyYW5zZm9ybWVyUmVnaXN0cnkubWFwIChrbGFzcykgLT5cbiAgICAgIGlmIGtsYXNzOjpoYXNPd25Qcm9wZXJ0eSgnZGlzcGxheU5hbWUnKVxuICAgICAgICBkaXNwbGF5TmFtZSA9IGtsYXNzOjpkaXNwbGF5TmFtZVxuICAgICAgZWxzZVxuICAgICAgICBkaXNwbGF5TmFtZSA9IF8uaHVtYW5pemVFdmVudE5hbWUoXy5kYXNoZXJpemUoa2xhc3MubmFtZSkpXG4gICAgICB7bmFtZToga2xhc3MsIGRpc3BsYXlOYW1lfVxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcblxuICAgIEB2aW1TdGF0ZS5vbkRpZENvbmZpcm1TZWxlY3RMaXN0ICh0cmFuc2Zvcm1lcikgPT5cbiAgICAgIEB2aW1TdGF0ZS5yZXNldCgpXG4gICAgICB0YXJnZXQgPSBAdGFyZ2V0Py5jb25zdHJ1Y3Rvci5uYW1lXG4gICAgICBAdmltU3RhdGUub3BlcmF0aW9uU3RhY2sucnVuKHRyYW5zZm9ybWVyLm5hbWUsIHt0YXJnZXR9KVxuICAgIEBmb2N1c1NlbGVjdExpc3Qoe2l0ZW1zOiBAZ2V0SXRlbXMoKX0pXG5cbiAgZXhlY3V0ZTogLT5cbiAgICAjIE5FVkVSIGJlIGV4ZWN1dGVkIHNpbmNlIG9wZXJhdGlvblN0YWNrIGlzIHJlcGxhY2VkIHdpdGggc2VsZWN0ZWQgdHJhbnNmb3JtZXJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCIje0BnZXROYW1lKCl9IHNob3VsZCBub3QgYmUgZXhlY3V0ZWRcIilcblxuY2xhc3MgVHJhbnNmb3JtV29yZEJ5U2VsZWN0TGlzdCBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ0J5U2VsZWN0TGlzdFxuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiBcIklubmVyV29yZFwiXG5cbmNsYXNzIFRyYW5zZm9ybVNtYXJ0V29yZEJ5U2VsZWN0TGlzdCBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ0J5U2VsZWN0TGlzdFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIlRyYW5zZm9ybSBJbm5lclNtYXJ0V29yZCBieSBgdHJhbnNmb3JtLXN0cmluZy1ieS1zZWxlY3QtbGlzdGBcIlxuICB0YXJnZXQ6IFwiSW5uZXJTbWFydFdvcmRcIlxuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFJlcGxhY2VXaXRoUmVnaXN0ZXIgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJSZXBsYWNlIHRhcmdldCB3aXRoIHNwZWNpZmllZCByZWdpc3RlciB2YWx1ZVwiXG4gIGhvdmVyOiBpY29uOiAnOnJlcGxhY2Utd2l0aC1yZWdpc3RlcjonLCBlbW9qaTogJzpwZW5jaWw6J1xuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICBAdmltU3RhdGUucmVnaXN0ZXIuZ2V0VGV4dCgpXG5cbiMgU2F2ZSB0ZXh0IHRvIHJlZ2lzdGVyIGJlZm9yZSByZXBsYWNlXG5jbGFzcyBTd2FwV2l0aFJlZ2lzdGVyIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiU3dhcCByZWdpc3RlciB2YWx1ZSB3aXRoIHRhcmdldFwiXG4gIGdldE5ld1RleHQ6ICh0ZXh0LCBzZWxlY3Rpb24pIC0+XG4gICAgbmV3VGV4dCA9IEB2aW1TdGF0ZS5yZWdpc3Rlci5nZXRUZXh0KClcbiAgICBAc2V0VGV4dFRvUmVnaXN0ZXIodGV4dCwgc2VsZWN0aW9uKVxuICAgIG5ld1RleHRcblxuIyBJbmRlbnQgPCBUcmFuc2Zvcm1TdHJpbmdcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgSW5kZW50IGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBob3ZlcjogaWNvbjogJzppbmRlbnQ6JywgZW1vamk6ICc6cG9pbnRfcmlnaHQ6J1xuICBzdGF5T25MaW5ld2lzZTogZmFsc2VcbiAgdXNlTWFya2VyRm9yU3RheTogdHJ1ZVxuICBjbGlwVG9NdXRhdGlvbkVuZE9uU3RheTogZmFsc2VcblxuICBleGVjdXRlOiAtPlxuICAgIHVubGVzcyBAbmVlZFN0YXkoKVxuICAgICAgQG9uRGlkUmVzdG9yZUN1cnNvclBvc2l0aW9ucyA9PlxuICAgICAgICBAZWRpdG9yLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKClcbiAgICBzdXBlclxuXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBzZWxlY3Rpb24uaW5kZW50U2VsZWN0ZWRSb3dzKClcblxuY2xhc3MgT3V0ZGVudCBleHRlbmRzIEluZGVudFxuICBAZXh0ZW5kKClcbiAgaG92ZXI6IGljb246ICc6b3V0ZGVudDonLCBlbW9qaTogJzpwb2ludF9sZWZ0OidcbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIHNlbGVjdGlvbi5vdXRkZW50U2VsZWN0ZWRSb3dzKClcblxuY2xhc3MgQXV0b0luZGVudCBleHRlbmRzIEluZGVudFxuICBAZXh0ZW5kKClcbiAgaG92ZXI6IGljb246ICc6YXV0by1pbmRlbnQ6JywgZW1vamk6ICc6b3Blbl9oYW5kczonXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBzZWxlY3Rpb24uYXV0b0luZGVudFNlbGVjdGVkUm93cygpXG5cbmNsYXNzIFRvZ2dsZUxpbmVDb21tZW50cyBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgaG92ZXI6IGljb246ICc6dG9nZ2xlLWxpbmUtY29tbWVudHM6JywgZW1vamk6ICc6bXV0ZTonXG4gIHVzZU1hcmtlckZvclN0YXk6IHRydWVcbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIHNlbGVjdGlvbi50b2dnbGVMaW5lQ29tbWVudHMoKVxuXG4jIFN1cnJvdW5kIDwgVHJhbnNmb3JtU3RyaW5nXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFN1cnJvdW5kIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiU3Vycm91bmQgdGFyZ2V0IGJ5IHNwZWNpZmllZCBjaGFyYWN0ZXIgbGlrZSBgKGAsIGBbYCwgYFxcXCJgXCJcbiAgZGlzcGxheU5hbWU6IFwiU3Vycm91bmQgKClcIlxuICBob3ZlcjogaWNvbjogJzpzdXJyb3VuZDonLCBlbW9qaTogJzp0d29fd29tZW5faG9sZGluZ19oYW5kczonXG4gIHBhaXJzOiBbXG4gICAgWydbJywgJ10nXVxuICAgIFsnKCcsICcpJ11cbiAgICBbJ3snLCAnfSddXG4gICAgWyc8JywgJz4nXVxuICBdXG4gIGlucHV0OiBudWxsXG4gIGNoYXJzTWF4OiAxXG4gIHJlcXVpcmVJbnB1dDogdHJ1ZVxuICBhdXRvSW5kZW50OiBmYWxzZVxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcblxuICAgIHJldHVybiB1bmxlc3MgQHJlcXVpcmVJbnB1dFxuICAgIGlmIEByZXF1aXJlVGFyZ2V0XG4gICAgICBAb25EaWRTZXRUYXJnZXQgPT5cbiAgICAgICAgQG9uRGlkQ29uZmlybUlucHV0IChpbnB1dCkgPT4gQG9uQ29uZmlybShpbnB1dClcbiAgICAgICAgQG9uRGlkQ2hhbmdlSW5wdXQgKGlucHV0KSA9PiBAYWRkSG92ZXIoaW5wdXQpXG4gICAgICAgIEBvbkRpZENhbmNlbElucHV0ID0+IEBjYW5jZWxPcGVyYXRpb24oKVxuICAgICAgICBAdmltU3RhdGUuaW5wdXQuZm9jdXMoQGNoYXJzTWF4KVxuICAgIGVsc2VcbiAgICAgIEBvbkRpZENvbmZpcm1JbnB1dCAoaW5wdXQpID0+IEBvbkNvbmZpcm0oaW5wdXQpXG4gICAgICBAb25EaWRDaGFuZ2VJbnB1dCAoaW5wdXQpID0+IEBhZGRIb3ZlcihpbnB1dClcbiAgICAgIEBvbkRpZENhbmNlbElucHV0ID0+IEBjYW5jZWxPcGVyYXRpb24oKVxuICAgICAgQHZpbVN0YXRlLmlucHV0LmZvY3VzKEBjaGFyc01heClcblxuICBvbkNvbmZpcm06IChAaW5wdXQpIC0+XG4gICAgQHByb2Nlc3NPcGVyYXRpb24oKVxuXG4gIGdldFBhaXI6IChjaGFyKSAtPlxuICAgIHBhaXIgPSBfLmRldGVjdChAcGFpcnMsIChwYWlyKSAtPiBjaGFyIGluIHBhaXIpXG4gICAgcGFpciA/PSBbY2hhciwgY2hhcl1cblxuICBzdXJyb3VuZDogKHRleHQsIGNoYXIsIG9wdGlvbnM9e30pIC0+XG4gICAga2VlcExheW91dCA9IG9wdGlvbnMua2VlcExheW91dCA/IGZhbHNlXG4gICAgW29wZW4sIGNsb3NlXSA9IEBnZXRQYWlyKGNoYXIpXG4gICAgaWYgKG5vdCBrZWVwTGF5b3V0KSBhbmQgTGluZUVuZGluZ1JlZ0V4cC50ZXN0KHRleHQpXG4gICAgICBAYXV0b0luZGVudCA9IHRydWUgIyBbRklYTUVdXG4gICAgICBvcGVuICs9IFwiXFxuXCJcbiAgICAgIGNsb3NlICs9IFwiXFxuXCJcblxuICAgIGlmIGNoYXIgaW4gc2V0dGluZ3MuZ2V0KCdjaGFyYWN0ZXJzVG9BZGRTcGFjZU9uU3Vycm91bmQnKSBhbmQgaXNTaW5nbGVMaW5lKHRleHQpXG4gICAgICBvcGVuICsgJyAnICsgdGV4dCArICcgJyArIGNsb3NlXG4gICAgZWxzZVxuICAgICAgb3BlbiArIHRleHQgKyBjbG9zZVxuXG4gIGdldE5ld1RleHQ6ICh0ZXh0KSAtPlxuICAgIEBzdXJyb3VuZCh0ZXh0LCBAaW5wdXQpXG5cbmNsYXNzIFN1cnJvdW5kV29yZCBleHRlbmRzIFN1cnJvdW5kXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiU3Vycm91bmQgKip3b3JkKipcIlxuICB0YXJnZXQ6ICdJbm5lcldvcmQnXG5cbmNsYXNzIFN1cnJvdW5kU21hcnRXb3JkIGV4dGVuZHMgU3Vycm91bmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJTdXJyb3VuZCAqKnNtYXJ0LXdvcmQqKlwiXG4gIHRhcmdldDogJ0lubmVyU21hcnRXb3JkJ1xuXG5jbGFzcyBNYXBTdXJyb3VuZCBleHRlbmRzIFN1cnJvdW5kXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiU3Vycm91bmQgZWFjaCB3b3JkKGAvXFx3Ky9gKSB3aXRoaW4gdGFyZ2V0XCJcbiAgb2NjdXJyZW5jZTogdHJ1ZVxuICBwYXR0ZXJuRm9yT2NjdXJyZW5jZTogL1xcdysvZ1xuXG5jbGFzcyBEZWxldGVTdXJyb3VuZCBleHRlbmRzIFN1cnJvdW5kXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiRGVsZXRlIHNwZWNpZmllZCBzdXJyb3VuZCBjaGFyYWN0ZXIgbGlrZSBgKGAsIGBbYCwgYFxcXCJgXCJcbiAgcGFpckNoYXJzOiBbJ1tdJywgJygpJywgJ3t9J10uam9pbignJylcbiAgcmVxdWlyZVRhcmdldDogZmFsc2VcblxuICBvbkNvbmZpcm06IChAaW5wdXQpIC0+XG4gICAgIyBGSVhNRTogZG9udCBtYW5hZ2UgYWxsb3dOZXh0TGluZSBpbmRlcGVuZGVudGx5LiBFYWNoIFBhaXIgdGV4dC1vYmplY3QgY2FuIGhhbmRsZSBieSB0aGVtc2VsdnMuXG4gICAgQHNldFRhcmdldCBAbmV3ICdQYWlyJyxcbiAgICAgIHBhaXI6IEBnZXRQYWlyKEBpbnB1dClcbiAgICAgIGlubmVyOiBmYWxzZVxuICAgICAgYWxsb3dOZXh0TGluZTogKEBpbnB1dCBpbiBAcGFpckNoYXJzKVxuICAgIEBwcm9jZXNzT3BlcmF0aW9uKClcblxuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICBbb3BlbkNoYXIsIGNsb3NlQ2hhcl0gPSBbdGV4dFswXSwgXy5sYXN0KHRleHQpXVxuICAgIHRleHQgPSB0ZXh0WzEuLi4tMV1cbiAgICBpZiBpc1NpbmdsZUxpbmUodGV4dClcbiAgICAgIHRleHQgPSB0ZXh0LnRyaW0oKSBpZiBvcGVuQ2hhciBpc250IGNsb3NlQ2hhclxuICAgIHRleHRcblxuY2xhc3MgRGVsZXRlU3Vycm91bmRBbnlQYWlyIGV4dGVuZHMgRGVsZXRlU3Vycm91bmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJEZWxldGUgc3Vycm91bmQgY2hhcmFjdGVyIGJ5IGF1dG8tZGV0ZWN0IHBhaXJlZCBjaGFyIGZyb20gY3Vyc29yIGVuY2xvc2VkIHBhaXJcIlxuICByZXF1aXJlSW5wdXQ6IGZhbHNlXG4gIHRhcmdldDogJ0FBbnlQYWlyJ1xuXG5jbGFzcyBEZWxldGVTdXJyb3VuZEFueVBhaXJBbGxvd0ZvcndhcmRpbmcgZXh0ZW5kcyBEZWxldGVTdXJyb3VuZEFueVBhaXJcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJEZWxldGUgc3Vycm91bmQgY2hhcmFjdGVyIGJ5IGF1dG8tZGV0ZWN0IHBhaXJlZCBjaGFyIGZyb20gY3Vyc29yIGVuY2xvc2VkIHBhaXIgYW5kIGZvcndhcmRpbmcgcGFpciB3aXRoaW4gc2FtZSBsaW5lXCJcbiAgdGFyZ2V0OiAnQUFueVBhaXJBbGxvd0ZvcndhcmRpbmcnXG5cbmNsYXNzIENoYW5nZVN1cnJvdW5kIGV4dGVuZHMgRGVsZXRlU3Vycm91bmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJDaGFuZ2Ugc3Vycm91bmQgY2hhcmFjdGVyLCBzcGVjaWZ5IGJvdGggZnJvbSBhbmQgdG8gcGFpciBjaGFyXCJcbiAgY2hhcnNNYXg6IDJcbiAgY2hhcjogbnVsbFxuXG4gIG9uQ29uZmlybTogKGlucHV0KSAtPlxuICAgIHJldHVybiB1bmxlc3MgaW5wdXRcbiAgICBbZnJvbSwgQGNoYXJdID0gaW5wdXQuc3BsaXQoJycpXG4gICAgc3VwZXIoZnJvbSlcblxuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICBpbm5lclRleHQgPSBzdXBlciAjIERlbGV0ZSBzdXJyb3VuZFxuICAgIEBzdXJyb3VuZChpbm5lclRleHQsIEBjaGFyLCBrZWVwTGF5b3V0OiB0cnVlKVxuXG5jbGFzcyBDaGFuZ2VTdXJyb3VuZEFueVBhaXIgZXh0ZW5kcyBDaGFuZ2VTdXJyb3VuZFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIkNoYW5nZSBzdXJyb3VuZCBjaGFyYWN0ZXIsIGZyb20gY2hhciBpcyBhdXRvLWRldGVjdGVkXCJcbiAgY2hhcnNNYXg6IDFcbiAgdGFyZ2V0OiBcIkFBbnlQYWlyXCJcblxuICBoaWdobGlnaHRUYXJnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBpZiByYW5nZSA9IEB0YXJnZXQuZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICAgICAgbWFya2VyID0gQGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgICBAZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgdHlwZTogJ2hpZ2hsaWdodCcsIGNsYXNzOiAndmltLW1vZGUtcGx1cy10YXJnZXQtcmFuZ2UnKVxuICAgICAgbWFya2VyXG4gICAgZWxzZVxuICAgICAgbnVsbFxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgbWFya2VyID0gbnVsbFxuICAgIEBvbkRpZFNldFRhcmdldCA9PlxuICAgICAgaWYgbWFya2VyID0gQGhpZ2hsaWdodFRhcmdldFJhbmdlKEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpKVxuICAgICAgICB0ZXh0UmFuZ2UgPSBSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEobWFya2VyLmdldEJ1ZmZlclJhbmdlKCkuc3RhcnQsIDAsIDEpXG4gICAgICAgIGNoYXIgPSBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHRleHRSYW5nZSlcbiAgICAgICAgQGFkZEhvdmVyKGNoYXIsIHt9LCBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICBlbHNlXG4gICAgICAgIEB2aW1TdGF0ZS5pbnB1dC5jYW5jZWwoKVxuICAgICAgICBAYWJvcnQoKVxuXG4gICAgQG9uRGlkUmVzZXRPcGVyYXRpb25TdGFjayAtPlxuICAgICAgbWFya2VyPy5kZXN0cm95KClcbiAgICBzdXBlclxuXG4gIG9uQ29uZmlybTogKEBjaGFyKSAtPlxuICAgIEBpbnB1dCA9IEBjaGFyXG4gICAgQHByb2Nlc3NPcGVyYXRpb24oKVxuXG5jbGFzcyBDaGFuZ2VTdXJyb3VuZEFueVBhaXJBbGxvd0ZvcndhcmRpbmcgZXh0ZW5kcyBDaGFuZ2VTdXJyb3VuZEFueVBhaXJcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJDaGFuZ2Ugc3Vycm91bmQgY2hhcmFjdGVyLCBmcm9tIGNoYXIgaXMgYXV0by1kZXRlY3RlZCBmcm9tIGVuY2xvc2VkIGFuZCBmb3J3YXJkaW5nIGFyZWFcIlxuICB0YXJnZXQ6IFwiQUFueVBhaXJBbGxvd0ZvcndhcmRpbmdcIlxuXG4jIEpvaW4gPCBUcmFuc2Zvcm1TdHJpbmdcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBGSVhNRVxuIyBDdXJyZW50bHkgbmF0aXZlIGVkaXRvci5qb2luTGluZXMoKSBpcyBiZXR0ZXIgZm9yIGN1cnNvciBwb3NpdGlvbiBzZXR0aW5nXG4jIFNvIEkgdXNlIG5hdGl2ZSBtZXRob2RzIGZvciBhIG1lYW53aGlsZS5cbmNsYXNzIEpvaW4gZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZCgpXG4gIHRhcmdldDogXCJNb3ZlVG9SZWxhdGl2ZUxpbmVcIlxuICBmbGFzaFRhcmdldDogZmFsc2VcbiAgcmVzdG9yZVBvc2l0aW9uczogZmFsc2VcblxuICBtdXRhdGVTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgaWYgc3dyYXAoc2VsZWN0aW9uKS5pc0xpbmV3aXNlKClcbiAgICAgIHJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShyYW5nZS50cmFuc2xhdGUoWzAsIDBdLCBbLTEsIEluZmluaXR5XSkpXG4gICAgc2VsZWN0aW9uLmpvaW5MaW5lcygpXG4gICAgZW5kID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkuZW5kXG4gICAgc2VsZWN0aW9uLmN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihlbmQudHJhbnNsYXRlKFswLCAtMV0pKVxuXG5jbGFzcyBKb2luV2l0aEtlZXBpbmdTcGFjZSBleHRlbmRzIFRyYW5zZm9ybVN0cmluZ1xuICBAZXh0ZW5kKClcbiAgQHJlZ2lzdGVyVG9TZWxlY3RMaXN0KClcbiAgaW5wdXQ6ICcnXG4gIHJlcXVpcmVUYXJnZXQ6IGZhbHNlXG4gIHRyaW06IGZhbHNlXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQHNldFRhcmdldCBAbmV3KFwiTW92ZVRvUmVsYXRpdmVMaW5lV2l0aE1pbmltdW1cIiwge21pbjogMX0pXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIFtzdGFydFJvdywgZW5kUm93XSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSb3dSYW5nZSgpXG4gICAgc3dyYXAoc2VsZWN0aW9uKS5leHBhbmRPdmVyTGluZSgpXG4gICAgcm93cyA9IGZvciByb3cgaW4gW3N0YXJ0Um93Li5lbmRSb3ddXG4gICAgICB0ZXh0ID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpXG4gICAgICBpZiBAdHJpbSBhbmQgcm93IGlzbnQgc3RhcnRSb3dcbiAgICAgICAgdGV4dC50cmltTGVmdCgpXG4gICAgICBlbHNlXG4gICAgICAgIHRleHRcbiAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCBAam9pbihyb3dzKSArIFwiXFxuXCJcblxuICBqb2luOiAocm93cykgLT5cbiAgICByb3dzLmpvaW4oQGlucHV0KVxuXG5jbGFzcyBKb2luQnlJbnB1dCBleHRlbmRzIEpvaW5XaXRoS2VlcGluZ1NwYWNlXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBAZGVzY3JpcHRpb246IFwiVHJhbnNmb3JtIG11bHRpLWxpbmUgdG8gc2luZ2xlLWxpbmUgYnkgd2l0aCBzcGVjaWZpZWQgc2VwYXJhdG9yIGNoYXJhY3RlclwiXG4gIGhvdmVyOiBpY29uOiAnOmpvaW46JywgZW1vamk6ICc6Y291cGxlOidcbiAgcmVxdWlyZUlucHV0OiB0cnVlXG4gIGlucHV0OiBudWxsXG4gIHRyaW06IHRydWVcbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIGNoYXJzTWF4ID0gMTBcbiAgICBAZm9jdXNJbnB1dChjaGFyc01heClcblxuICBqb2luOiAocm93cykgLT5cbiAgICByb3dzLmpvaW4oXCIgI3tAaW5wdXR9IFwiKVxuXG5jbGFzcyBKb2luQnlJbnB1dFdpdGhLZWVwaW5nU3BhY2UgZXh0ZW5kcyBKb2luQnlJbnB1dFxuICBAZGVzY3JpcHRpb246IFwiSm9pbiBsaW5lcyB3aXRob3V0IHBhZGRpbmcgc3BhY2UgYmV0d2VlbiBlYWNoIGxpbmVcIlxuICBAZXh0ZW5kKClcbiAgQHJlZ2lzdGVyVG9TZWxlY3RMaXN0KClcbiAgdHJpbTogZmFsc2VcbiAgam9pbjogKHJvd3MpIC0+XG4gICAgcm93cy5qb2luKEBpbnB1dClcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFN0cmluZyBzdWZmaXggaW4gbmFtZSBpcyB0byBhdm9pZCBjb25mdXNpb24gd2l0aCAnc3BsaXQnIHdpbmRvdy5cbmNsYXNzIFNwbGl0U3RyaW5nIGV4dGVuZHMgVHJhbnNmb3JtU3RyaW5nXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBAZGVzY3JpcHRpb246IFwiU3BsaXQgc2luZ2xlLWxpbmUgaW50byBtdWx0aS1saW5lIGJ5IHNwbGl0dGluZyBzcGVjaWZpZWQgc2VwYXJhdG9yIGNoYXJzXCJcbiAgaG92ZXI6IGljb246ICc6c3BsaXQtc3RyaW5nOicsIGVtb2ppOiAnOmhvY2hvOidcbiAgcmVxdWlyZUlucHV0OiB0cnVlXG4gIGlucHV0OiBudWxsXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIHVubGVzcyBAaXNNb2RlKCd2aXN1YWwnKVxuICAgICAgQHNldFRhcmdldCBAbmV3KFwiTW92ZVRvUmVsYXRpdmVMaW5lXCIsIHttaW46IDF9KVxuICAgIGNoYXJzTWF4ID0gMTBcbiAgICBAZm9jdXNJbnB1dChjaGFyc01heClcblxuICBnZXROZXdUZXh0OiAodGV4dCkgLT5cbiAgICBAaW5wdXQgPSBcIlxcXFxuXCIgaWYgQGlucHV0IGlzICcnXG4gICAgcmVnZXggPSAvLy8je18uZXNjYXBlUmVnRXhwKEBpbnB1dCl9Ly8vZ1xuICAgIHRleHQuc3BsaXQocmVnZXgpLmpvaW4oXCJcXG5cIilcblxuY2xhc3MgQ2hhbmdlT3JkZXIgZXh0ZW5kcyBUcmFuc2Zvcm1TdHJpbmdcbiAgQGV4dGVuZChmYWxzZSlcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICB0ZXh0Rm9yUm93cyA9IHN3cmFwKHNlbGVjdGlvbikubGluZVRleHRGb3JCdWZmZXJSb3dzKClcbiAgICByb3dzID0gQGdldE5ld1Jvd3ModGV4dEZvclJvd3MpXG4gICAgbmV3VGV4dCA9IHJvd3Muam9pbihcIlxcblwiKSArIFwiXFxuXCJcbiAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dChuZXdUZXh0KVxuXG5jbGFzcyBSZXZlcnNlIGV4dGVuZHMgQ2hhbmdlT3JkZXJcbiAgQGV4dGVuZCgpXG4gIEByZWdpc3RlclRvU2VsZWN0TGlzdCgpXG4gIEBkZXNjcmlwdGlvbjogXCJSZXZlcnNlIGxpbmVzKGUuZyByZXZlcnNlIHNlbGVjdGVkIHRocmVlIGxpbmUpXCJcbiAgZ2V0TmV3Um93czogKHJvd3MpIC0+XG4gICAgcm93cy5yZXZlcnNlKClcblxuY2xhc3MgU29ydCBleHRlbmRzIENoYW5nZU9yZGVyXG4gIEBleHRlbmQoKVxuICBAcmVnaXN0ZXJUb1NlbGVjdExpc3QoKVxuICBAZGVzY3JpcHRpb246IFwiU29ydCBsaW5lcyBhbHBoYWJldGljYWxseVwiXG4gIGdldE5ld1Jvd3M6IChyb3dzKSAtPlxuICAgIHJvd3Muc29ydCgpXG4iXX0=
