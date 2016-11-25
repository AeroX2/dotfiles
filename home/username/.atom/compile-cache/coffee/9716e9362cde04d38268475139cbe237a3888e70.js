(function() {
  var Base, BufferedProcess, CompositeDisposable, DevEnvironment, Developer, Disposable, Emitter, _, debug, fs, generateIntrospectionReport, getAncestors, getEditorState, getKeyBindingForCommand, getParent, packageScope, path, ref, ref1, settings;

  _ = require('underscore-plus');

  path = require('path');

  fs = require('fs-plus');

  ref = require('atom'), Emitter = ref.Emitter, Disposable = ref.Disposable, BufferedProcess = ref.BufferedProcess, CompositeDisposable = ref.CompositeDisposable;

  Base = require('./base');

  generateIntrospectionReport = require('./introspection').generateIntrospectionReport;

  settings = require('./settings');

  ref1 = require('./utils'), debug = ref1.debug, getParent = ref1.getParent, getAncestors = ref1.getAncestors, getKeyBindingForCommand = ref1.getKeyBindingForCommand;

  packageScope = 'vim-mode-plus';

  getEditorState = null;

  Developer = (function() {
    var kinds, modifierKeyMap, selectorMap;

    function Developer() {}

    Developer.prototype.init = function(service) {
      var commands, fn, name, subscriptions;
      getEditorState = service.getEditorState;
      this.devEnvironmentByBuffer = new Map;
      this.reloadSubscriptionByBuffer = new Map;
      commands = {
        'toggle-debug': (function(_this) {
          return function() {
            return _this.toggleDebug();
          };
        })(this),
        'open-in-vim': (function(_this) {
          return function() {
            return _this.openInVim();
          };
        })(this),
        'generate-introspection-report': (function(_this) {
          return function() {
            return _this.generateIntrospectionReport();
          };
        })(this),
        'generate-command-summary-table': (function(_this) {
          return function() {
            return _this.generateCommandSummaryTable();
          };
        })(this),
        'toggle-dev-environment': (function(_this) {
          return function() {
            return _this.toggleDevEnvironment();
          };
        })(this),
        'clear-debug-output': (function(_this) {
          return function() {
            return _this.clearDebugOutput();
          };
        })(this),
        'reload-packages': (function(_this) {
          return function() {
            return _this.reloadPackages();
          };
        })(this),
        'toggle-reload-packages-on-save': (function(_this) {
          return function() {
            return _this.toggleReloadPackagesOnSave();
          };
        })(this)
      };
      subscriptions = new CompositeDisposable;
      for (name in commands) {
        fn = commands[name];
        subscriptions.add(this.addCommand(name, fn));
      }
      return subscriptions;
    };

    Developer.prototype.reloadPackages = function() {
      var i, len, pack, packName, packPath, packages, ref2, results;
      packages = (ref2 = settings.get('devReloadPackages')) != null ? ref2 : [];
      packages.push('vim-mode-plus');
      results = [];
      for (i = 0, len = packages.length; i < len; i++) {
        packName = packages[i];
        pack = atom.packages.getLoadedPackage(packName);
        if (pack != null) {
          console.log("deactivating " + packName);
          atom.packages.deactivatePackage(packName);
          atom.packages.unloadPackage(packName);
          packPath = pack.path;
          Object.keys(require.cache).filter(function(p) {
            return p.indexOf(packPath + path.sep) === 0;
          }).forEach(function(p) {
            return delete require.cache[p];
          });
          atom.packages.loadPackage(packName);
          results.push(atom.packages.activatePackage(packName));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Developer.prototype.toggleReloadPackagesOnSave = function() {
      var buffer, editor, fileName, subscription;
      if (!(editor = atom.workspace.getActiveTextEditor())) {
        return;
      }
      buffer = editor.getBuffer();
      fileName = path.basename(editor.getPath());
      if (subscription = this.reloadSubscriptionByBuffer.get(buffer)) {
        subscription.dispose();
        this.reloadSubscriptionByBuffer["delete"](buffer);
        return console.log("disposed reloadPackagesOnSave for " + fileName);
      } else {
        this.reloadSubscriptionByBuffer.set(buffer, buffer.onDidSave((function(_this) {
          return function() {
            console.clear();
            return _this.reloadPackages();
          };
        })(this)));
        return console.log("activated reloadPackagesOnSave for " + fileName);
      }
    };

    Developer.prototype.toggleDevEnvironment = function() {
      var buffer, editor, fileName;
      if (!(editor = atom.workspace.getActiveTextEditor())) {
        return;
      }
      buffer = editor.getBuffer();
      fileName = path.basename(editor.getPath());
      if (this.devEnvironmentByBuffer.has(buffer)) {
        this.devEnvironmentByBuffer.get(buffer).dispose();
        this.devEnvironmentByBuffer["delete"](buffer);
        return console.log("disposed dev env " + fileName);
      } else {
        this.devEnvironmentByBuffer.set(buffer, new DevEnvironment(editor));
        return console.log("activated dev env " + fileName);
      }
    };

    Developer.prototype.addCommand = function(name, fn) {
      return atom.commands.add('atom-text-editor', packageScope + ":" + name, fn);
    };

    Developer.prototype.clearDebugOutput = function(name, fn) {
      var filePath, options;
      filePath = fs.normalize(settings.get('debugOutputFilePath'));
      options = {
        searchAllPanes: true,
        activatePane: false
      };
      return atom.workspace.open(filePath, options).then(function(editor) {
        editor.setText('');
        return editor.save();
      });
    };

    Developer.prototype.toggleDebug = function() {
      settings.set('debug', !settings.get('debug'));
      return console.log(settings.scope + " debug:", settings.get('debug'));
    };

    modifierKeyMap = {
      "ctrl-cmd-": '\u2303\u2318',
      "cmd-": '\u2318',
      "ctrl-": '\u2303',
      alt: '\u2325',
      option: '\u2325',
      enter: '\u23ce',
      left: '\u2190',
      right: '\u2192',
      up: '\u2191',
      down: '\u2193',
      backspace: 'BS',
      space: 'SPC'
    };

    selectorMap = {
      "atom-text-editor.vim-mode-plus": '',
      ".normal-mode": 'n',
      ".insert-mode": 'i',
      ".replace": 'R',
      ".visual-mode": 'v',
      ".characterwise": 'C',
      ".blockwise": 'B',
      ".linewise": 'L',
      ".operator-pending-mode": 'o',
      ".with-count": '#',
      ".has-persistent-selection": '%'
    };

    Developer.prototype.getCommandSpecs = function() {
      var commandName, commands, compactKeystrokes, compactSelector, description, keymap, keymaps, kind, klass, name;
      compactSelector = function(selector) {
        var pattern;
        pattern = RegExp("(" + (_.keys(selectorMap).map(_.escapeRegExp).join('|')) + ")", "g");
        return selector.split(/,\s*/g).map(function(scope) {
          return scope.replace(/:not\((.*)\)/, '!$1').replace(pattern, function(s) {
            return selectorMap[s];
          });
        }).join(",");
      };
      compactKeystrokes = function(keystrokes) {
        var modifierKeyRegexp, specialChars, specialCharsRegexp;
        specialChars = '\\`*_{}[]()#+-.!';
        specialCharsRegexp = RegExp("" + (specialChars.split('').map(_.escapeRegExp).join('|')), "g");
        modifierKeyRegexp = RegExp("(" + (_.keys(modifierKeyMap).map(_.escapeRegExp).join('|')) + ")");
        return keystrokes.replace(modifierKeyRegexp, function(s) {
          return modifierKeyMap[s];
        }).replace(RegExp("(" + specialCharsRegexp + ")", "g"), "\\$1").replace(/\|/g, '&#124;').replace(/\s+/, '');
      };
      commands = (function() {
        var ref2, ref3, results;
        ref2 = Base.getRegistries();
        results = [];
        for (name in ref2) {
          klass = ref2[name];
          if (!(klass.isCommand())) {
            continue;
          }
          kind = getAncestors(klass).map(function(k) {
            return k.name;
          }).slice(-2, -1)[0];
          commandName = klass.getCommandName();
          description = (ref3 = klass.getDesctiption()) != null ? ref3.replace(/\n/g, '<br/>') : void 0;
          keymap = null;
          if (keymaps = getKeyBindingForCommand(commandName, {
            packageName: "vim-mode-plus"
          })) {
            keymap = keymaps.map(function(arg) {
              var keystrokes, selector;
              keystrokes = arg.keystrokes, selector = arg.selector;
              return "`" + (compactSelector(selector)) + "` <code>" + (compactKeystrokes(keystrokes)) + "</code>";
            }).join("<br/>");
          }
          results.push({
            name: name,
            commandName: commandName,
            kind: kind,
            description: description,
            keymap: keymap
          });
        }
        return results;
      })();
      return commands;
    };

    kinds = ["Operator", "Motion", "TextObject", "InsertMode", "MiscCommand", "Scroll"];

    Developer.prototype.generateSummaryTableForCommandSpecs = function(specs, arg) {
      var commandName, description, grouped, header, i, j, keymap, kind, len, len1, ref2, report, str;
      header = (arg != null ? arg : {}).header;
      grouped = _.groupBy(specs, 'kind');
      str = "";
      for (i = 0, len = kinds.length; i < len; i++) {
        kind = kinds[i];
        if (!(specs = grouped[kind])) {
          continue;
        }
        report = ["## " + kind, "", "| Keymap | Command | Description |", "|:-------|:--------|:------------|"];
        for (j = 0, len1 = specs.length; j < len1; j++) {
          ref2 = specs[j], keymap = ref2.keymap, commandName = ref2.commandName, description = ref2.description;
          commandName = commandName.replace(/vim-mode-plus:/, '');
          if (description == null) {
            description = "";
          }
          if (keymap == null) {
            keymap = "";
          }
          report.push("| " + keymap + " | `" + commandName + "` | " + description + " |");
        }
        str += report.join("\n") + "\n\n";
      }
      return atom.workspace.open().then(function(editor) {
        if (header != null) {
          editor.insertText(header + "\n");
        }
        return editor.insertText(str);
      });
    };

    Developer.prototype.generateCommandSummaryTable = function() {
      var header;
      header = "## Keymap selector abbreviations\n\nIn this document, following abbreviations are used for shortness.\n\n| Abbrev | Selector                     | Description                         |\n|:-------|:-----------------------------|:------------------------------------|\n| `!i`   | `:not(.insert-mode)`         | except insert-mode                  |\n| `i`    | `.insert-mode`               |                                     |\n| `o`    | `.operator-pending-mode`     |                                     |\n| `n`    | `.normal-mode`               |                                     |\n| `v`    | `.visual-mode`               |                                     |\n| `vB`   | `.visual-mode.blockwise`     |                                     |\n| `vL`   | `.visual-mode.linewise`      |                                     |\n| `vC`   | `.visual-mode.characterwise` |                                     |\n| `iR`   | `.insert-mode.replace`       |                                     |\n| `#`    | `.with-count`                | when count is specified             |\n| `%`    | `.has-persistent-selection` | when persistent-selection is exists |\n";
      return this.generateSummaryTableForCommandSpecs(this.getCommandSpecs(), {
        header: header
      });
    };

    Developer.prototype.openInVim = function() {
      var editor, row;
      editor = atom.workspace.getActiveTextEditor();
      row = editor.getCursorBufferPosition().row;
      return new BufferedProcess({
        command: "/Applications/MacVim.app/Contents/MacOS/mvim",
        args: [editor.getPath(), "+" + (row + 1)]
      });
    };

    Developer.prototype.generateIntrospectionReport = function() {
      return generateIntrospectionReport(_.values(Base.getRegistries()), {
        excludeProperties: ['run', 'getCommandNameWithoutPrefix', 'getClass', 'extend', 'getParent', 'getAncestors', 'isCommand', 'getRegistries', 'command', 'reset', 'getDesctiption', 'description', 'init', 'getCommandName', 'getCommandScope', 'registerCommand', 'delegatesProperties', 'subscriptions', 'commandPrefix', 'commandScope', 'delegatesMethods', 'delegatesProperty', 'delegatesMethod'],
        recursiveInspect: Base
      });
    };

    return Developer;

  })();

  DevEnvironment = (function() {
    function DevEnvironment(editor1) {
      var fileName;
      this.editor = editor1;
      this.editorElement = this.editor.element;
      this.emitter = new Emitter;
      fileName = path.basename(this.editor.getPath());
      this.disposable = this.editor.onDidSave((function(_this) {
        return function() {
          console.clear();
          Base.suppressWarning = true;
          _this.reload();
          Base.suppressWarning = false;
          Base.reset();
          _this.emitter.emit('did-reload');
          return console.log("reloaded " + fileName);
        };
      })(this));
    }

    DevEnvironment.prototype.dispose = function() {
      var ref2;
      return (ref2 = this.disposable) != null ? ref2.dispose() : void 0;
    };

    DevEnvironment.prototype.onDidReload = function(fn) {
      return this.emitter.on('did-reload', fn);
    };

    DevEnvironment.prototype.reload = function() {
      var originalRequire, packPath;
      packPath = atom.packages.resolvePackagePath('vim-mode-plus');
      originalRequire = global.require;
      global.require = function(libPath) {
        if (libPath.startsWith('./')) {
          return originalRequire(packPath + "/lib/" + libPath);
        } else {
          return originalRequire(libPath);
        }
      };
      atom.commands.dispatch(this.editorElement, 'run-in-atom:run-in-atom');
      return global.require = originalRequire;
    };

    return DevEnvironment;

  })();

  module.exports = Developer;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvZGV2ZWxvcGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLE1BQThELE9BQUEsQ0FBUSxNQUFSLENBQTlELEVBQUMscUJBQUQsRUFBVSwyQkFBVixFQUFzQixxQ0FBdEIsRUFBdUM7O0VBRXZDLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFDTiw4QkFBK0IsT0FBQSxDQUFRLGlCQUFSOztFQUNoQyxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBQ1gsT0FBNEQsT0FBQSxDQUFRLFNBQVIsQ0FBNUQsRUFBQyxrQkFBRCxFQUFRLDBCQUFSLEVBQW1CLGdDQUFuQixFQUFpQzs7RUFFakMsWUFBQSxHQUFlOztFQUNmLGNBQUEsR0FBaUI7O0VBRVg7QUFDSixRQUFBOzs7O3dCQUFBLElBQUEsR0FBTSxTQUFDLE9BQUQ7QUFDSixVQUFBO01BQUMsaUJBQWtCO01BQ25CLElBQUMsQ0FBQSxzQkFBRCxHQUEwQixJQUFJO01BQzlCLElBQUMsQ0FBQSwwQkFBRCxHQUE4QixJQUFJO01BRWxDLFFBQUEsR0FDRTtRQUFBLGNBQUEsRUFBZ0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsV0FBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhCO1FBQ0EsYUFBQSxFQUFlLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLFNBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQURmO1FBRUEsK0JBQUEsRUFBaUMsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsMkJBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUZqQztRQUdBLGdDQUFBLEVBQWtDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLDJCQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FIbEM7UUFJQSx3QkFBQSxFQUEwQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxvQkFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBSjFCO1FBS0Esb0JBQUEsRUFBc0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsZ0JBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUx0QjtRQU1BLGlCQUFBLEVBQW1CLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLGNBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQU5uQjtRQU9BLGdDQUFBLEVBQWtDLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLDBCQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FQbEM7O01BU0YsYUFBQSxHQUFnQixJQUFJO0FBQ3BCLFdBQUEsZ0JBQUE7O1FBQ0UsYUFBYSxDQUFDLEdBQWQsQ0FBa0IsSUFBQyxDQUFBLFVBQUQsQ0FBWSxJQUFaLEVBQWtCLEVBQWxCLENBQWxCO0FBREY7YUFFQTtJQWxCSTs7d0JBb0JOLGNBQUEsR0FBZ0IsU0FBQTtBQUNkLFVBQUE7TUFBQSxRQUFBLCtEQUErQztNQUMvQyxRQUFRLENBQUMsSUFBVCxDQUFjLGVBQWQ7QUFDQTtXQUFBLDBDQUFBOztRQUNFLElBQUEsR0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFkLENBQStCLFFBQS9CO1FBRVAsSUFBRyxZQUFIO1VBQ0UsT0FBTyxDQUFDLEdBQVIsQ0FBWSxlQUFBLEdBQWdCLFFBQTVCO1VBQ0EsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBZCxDQUFnQyxRQUFoQztVQUNBLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBZCxDQUE0QixRQUE1QjtVQUVBLFFBQUEsR0FBVyxJQUFJLENBQUM7VUFDaEIsTUFBTSxDQUFDLElBQVAsQ0FBWSxPQUFPLENBQUMsS0FBcEIsQ0FDRSxDQUFDLE1BREgsQ0FDVSxTQUFDLENBQUQ7bUJBQ04sQ0FBQyxDQUFDLE9BQUYsQ0FBVSxRQUFBLEdBQVcsSUFBSSxDQUFDLEdBQTFCLENBQUEsS0FBa0M7VUFENUIsQ0FEVixDQUdFLENBQUMsT0FISCxDQUdXLFNBQUMsQ0FBRDttQkFDUCxPQUFPLE9BQU8sQ0FBQyxLQUFNLENBQUEsQ0FBQTtVQURkLENBSFg7VUFNQSxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQWQsQ0FBMEIsUUFBMUI7dUJBQ0EsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFkLENBQThCLFFBQTlCLEdBYkY7U0FBQSxNQUFBOytCQUFBOztBQUhGOztJQUhjOzt3QkFxQmhCLDBCQUFBLEdBQTRCLFNBQUE7QUFDMUIsVUFBQTtNQUFBLElBQUEsQ0FBYyxDQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUEsQ0FBVCxDQUFkO0FBQUEsZUFBQTs7TUFDQSxNQUFBLEdBQVMsTUFBTSxDQUFDLFNBQVAsQ0FBQTtNQUNULFFBQUEsR0FBVyxJQUFJLENBQUMsUUFBTCxDQUFjLE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FBZDtNQUVYLElBQUcsWUFBQSxHQUFlLElBQUMsQ0FBQSwwQkFBMEIsQ0FBQyxHQUE1QixDQUFnQyxNQUFoQyxDQUFsQjtRQUNFLFlBQVksQ0FBQyxPQUFiLENBQUE7UUFDQSxJQUFDLENBQUEsMEJBQTBCLEVBQUMsTUFBRCxFQUEzQixDQUFtQyxNQUFuQztlQUNBLE9BQU8sQ0FBQyxHQUFSLENBQVksb0NBQUEsR0FBcUMsUUFBakQsRUFIRjtPQUFBLE1BQUE7UUFLRSxJQUFDLENBQUEsMEJBQTBCLENBQUMsR0FBNUIsQ0FBZ0MsTUFBaEMsRUFBd0MsTUFBTSxDQUFDLFNBQVAsQ0FBaUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTtZQUN2RCxPQUFPLENBQUMsS0FBUixDQUFBO21CQUNBLEtBQUMsQ0FBQSxjQUFELENBQUE7VUFGdUQ7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCLENBQXhDO2VBR0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxxQ0FBQSxHQUFzQyxRQUFsRCxFQVJGOztJQUwwQjs7d0JBZTVCLG9CQUFBLEdBQXNCLFNBQUE7QUFDcEIsVUFBQTtNQUFBLElBQUEsQ0FBYyxDQUFBLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUEsQ0FBVCxDQUFkO0FBQUEsZUFBQTs7TUFDQSxNQUFBLEdBQVMsTUFBTSxDQUFDLFNBQVAsQ0FBQTtNQUNULFFBQUEsR0FBVyxJQUFJLENBQUMsUUFBTCxDQUFjLE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FBZDtNQUVYLElBQUcsSUFBQyxDQUFBLHNCQUFzQixDQUFDLEdBQXhCLENBQTRCLE1BQTVCLENBQUg7UUFDRSxJQUFDLENBQUEsc0JBQXNCLENBQUMsR0FBeEIsQ0FBNEIsTUFBNUIsQ0FBbUMsQ0FBQyxPQUFwQyxDQUFBO1FBQ0EsSUFBQyxDQUFBLHNCQUFzQixFQUFDLE1BQUQsRUFBdkIsQ0FBK0IsTUFBL0I7ZUFDQSxPQUFPLENBQUMsR0FBUixDQUFZLG1CQUFBLEdBQW9CLFFBQWhDLEVBSEY7T0FBQSxNQUFBO1FBS0UsSUFBQyxDQUFBLHNCQUFzQixDQUFDLEdBQXhCLENBQTRCLE1BQTVCLEVBQXdDLElBQUEsY0FBQSxDQUFlLE1BQWYsQ0FBeEM7ZUFDQSxPQUFPLENBQUMsR0FBUixDQUFZLG9CQUFBLEdBQXFCLFFBQWpDLEVBTkY7O0lBTG9COzt3QkFhdEIsVUFBQSxHQUFZLFNBQUMsSUFBRCxFQUFPLEVBQVA7YUFDVixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0Isa0JBQWxCLEVBQXlDLFlBQUQsR0FBYyxHQUFkLEdBQWlCLElBQXpELEVBQWlFLEVBQWpFO0lBRFU7O3dCQUdaLGdCQUFBLEdBQWtCLFNBQUMsSUFBRCxFQUFPLEVBQVA7QUFDaEIsVUFBQTtNQUFBLFFBQUEsR0FBVyxFQUFFLENBQUMsU0FBSCxDQUFhLFFBQVEsQ0FBQyxHQUFULENBQWEscUJBQWIsQ0FBYjtNQUNYLE9BQUEsR0FBVTtRQUFDLGNBQUEsRUFBZ0IsSUFBakI7UUFBdUIsWUFBQSxFQUFjLEtBQXJDOzthQUNWLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFvQixRQUFwQixFQUE4QixPQUE5QixDQUFzQyxDQUFDLElBQXZDLENBQTRDLFNBQUMsTUFBRDtRQUMxQyxNQUFNLENBQUMsT0FBUCxDQUFlLEVBQWY7ZUFDQSxNQUFNLENBQUMsSUFBUCxDQUFBO01BRjBDLENBQTVDO0lBSGdCOzt3QkFPbEIsV0FBQSxHQUFhLFNBQUE7TUFDWCxRQUFRLENBQUMsR0FBVCxDQUFhLE9BQWIsRUFBc0IsQ0FBSSxRQUFRLENBQUMsR0FBVCxDQUFhLE9BQWIsQ0FBMUI7YUFDQSxPQUFPLENBQUMsR0FBUixDQUFlLFFBQVEsQ0FBQyxLQUFWLEdBQWdCLFNBQTlCLEVBQXdDLFFBQVEsQ0FBQyxHQUFULENBQWEsT0FBYixDQUF4QztJQUZXOztJQUtiLGNBQUEsR0FDRTtNQUFBLFdBQUEsRUFBYSxjQUFiO01BQ0EsTUFBQSxFQUFRLFFBRFI7TUFFQSxPQUFBLEVBQVMsUUFGVDtNQUdBLEdBQUEsRUFBSyxRQUhMO01BSUEsTUFBQSxFQUFRLFFBSlI7TUFLQSxLQUFBLEVBQU8sUUFMUDtNQU1BLElBQUEsRUFBTSxRQU5OO01BT0EsS0FBQSxFQUFPLFFBUFA7TUFRQSxFQUFBLEVBQUksUUFSSjtNQVNBLElBQUEsRUFBTSxRQVROO01BVUEsU0FBQSxFQUFXLElBVlg7TUFXQSxLQUFBLEVBQU8sS0FYUDs7O0lBYUYsV0FBQSxHQUNFO01BQUEsZ0NBQUEsRUFBa0MsRUFBbEM7TUFDQSxjQUFBLEVBQWdCLEdBRGhCO01BRUEsY0FBQSxFQUFnQixHQUZoQjtNQUdBLFVBQUEsRUFBWSxHQUhaO01BSUEsY0FBQSxFQUFnQixHQUpoQjtNQUtBLGdCQUFBLEVBQWtCLEdBTGxCO01BTUEsWUFBQSxFQUFjLEdBTmQ7TUFPQSxXQUFBLEVBQWEsR0FQYjtNQVFBLHdCQUFBLEVBQTBCLEdBUjFCO01BU0EsYUFBQSxFQUFlLEdBVGY7TUFVQSwyQkFBQSxFQUE2QixHQVY3Qjs7O3dCQVlGLGVBQUEsR0FBaUIsU0FBQTtBQUNmLFVBQUE7TUFBQSxlQUFBLEdBQWtCLFNBQUMsUUFBRDtBQUNoQixZQUFBO1FBQUEsT0FBQSxHQUFVLE1BQUEsQ0FBQSxHQUFBLEdBQUssQ0FBQyxDQUFDLENBQUMsSUFBRixDQUFPLFdBQVAsQ0FBbUIsQ0FBQyxHQUFwQixDQUF3QixDQUFDLENBQUMsWUFBMUIsQ0FBdUMsQ0FBQyxJQUF4QyxDQUE2QyxHQUE3QyxDQUFELENBQUwsR0FBd0QsR0FBeEQsRUFBNEQsR0FBNUQ7ZUFDVixRQUFRLENBQUMsS0FBVCxDQUFlLE9BQWYsQ0FBdUIsQ0FBQyxHQUF4QixDQUE0QixTQUFDLEtBQUQ7aUJBQzFCLEtBQ0UsQ0FBQyxPQURILENBQ1csY0FEWCxFQUMyQixLQUQzQixDQUVFLENBQUMsT0FGSCxDQUVXLE9BRlgsRUFFb0IsU0FBQyxDQUFEO21CQUFPLFdBQVksQ0FBQSxDQUFBO1VBQW5CLENBRnBCO1FBRDBCLENBQTVCLENBSUEsQ0FBQyxJQUpELENBSU0sR0FKTjtNQUZnQjtNQVFsQixpQkFBQSxHQUFvQixTQUFDLFVBQUQ7QUFDbEIsWUFBQTtRQUFBLFlBQUEsR0FBZTtRQUNmLGtCQUFBLEdBQXFCLE1BQUEsQ0FBQSxFQUFBLEdBQUksQ0FBQyxZQUFZLENBQUMsS0FBYixDQUFtQixFQUFuQixDQUFzQixDQUFDLEdBQXZCLENBQTJCLENBQUMsQ0FBQyxZQUE3QixDQUEwQyxDQUFDLElBQTNDLENBQWdELEdBQWhELENBQUQsQ0FBSixFQUE2RCxHQUE3RDtRQUNyQixpQkFBQSxHQUFvQixNQUFBLENBQUEsR0FBQSxHQUFLLENBQUMsQ0FBQyxDQUFDLElBQUYsQ0FBTyxjQUFQLENBQXNCLENBQUMsR0FBdkIsQ0FBMkIsQ0FBQyxDQUFDLFlBQTdCLENBQTBDLENBQUMsSUFBM0MsQ0FBZ0QsR0FBaEQsQ0FBRCxDQUFMLEdBQTJELEdBQTNEO2VBQ3BCLFVBRUUsQ0FBQyxPQUZILENBRVcsaUJBRlgsRUFFOEIsU0FBQyxDQUFEO2lCQUFPLGNBQWUsQ0FBQSxDQUFBO1FBQXRCLENBRjlCLENBR0UsQ0FBQyxPQUhILENBR1csTUFBQSxDQUFBLEdBQUEsR0FBTSxrQkFBTixHQUF5QixHQUF6QixFQUE2QixHQUE3QixDQUhYLEVBRzJDLE1BSDNDLENBSUUsQ0FBQyxPQUpILENBSVcsS0FKWCxFQUlrQixRQUpsQixDQUtFLENBQUMsT0FMSCxDQUtXLEtBTFgsRUFLa0IsRUFMbEI7TUFKa0I7TUFXcEIsUUFBQTs7QUFDRTtBQUFBO2FBQUEsWUFBQTs7Z0JBQTZDLEtBQUssQ0FBQyxTQUFOLENBQUE7OztVQUMzQyxJQUFBLEdBQU8sWUFBQSxDQUFhLEtBQWIsQ0FBbUIsQ0FBQyxHQUFwQixDQUF3QixTQUFDLENBQUQ7bUJBQU8sQ0FBQyxDQUFDO1VBQVQsQ0FBeEIsQ0FBdUMsY0FBUSxDQUFBLENBQUE7VUFDdEQsV0FBQSxHQUFjLEtBQUssQ0FBQyxjQUFOLENBQUE7VUFDZCxXQUFBLGlEQUFvQyxDQUFFLE9BQXhCLENBQWdDLEtBQWhDLEVBQXVDLE9BQXZDO1VBRWQsTUFBQSxHQUFTO1VBQ1QsSUFBRyxPQUFBLEdBQVUsdUJBQUEsQ0FBd0IsV0FBeEIsRUFBcUM7WUFBQSxXQUFBLEVBQWEsZUFBYjtXQUFyQyxDQUFiO1lBQ0UsTUFBQSxHQUFTLE9BQU8sQ0FBQyxHQUFSLENBQVksU0FBQyxHQUFEO0FBQ25CLGtCQUFBO2NBRHFCLDZCQUFZO3FCQUNqQyxHQUFBLEdBQUcsQ0FBQyxlQUFBLENBQWdCLFFBQWhCLENBQUQsQ0FBSCxHQUE4QixVQUE5QixHQUF1QyxDQUFDLGlCQUFBLENBQWtCLFVBQWxCLENBQUQsQ0FBdkMsR0FBc0U7WUFEbkQsQ0FBWixDQUVULENBQUMsSUFGUSxDQUVILE9BRkcsRUFEWDs7dUJBS0E7WUFBQyxNQUFBLElBQUQ7WUFBTyxhQUFBLFdBQVA7WUFBb0IsTUFBQSxJQUFwQjtZQUEwQixhQUFBLFdBQTFCO1lBQXVDLFFBQUEsTUFBdkM7O0FBWEY7OzthQWFGO0lBbENlOztJQW9DakIsS0FBQSxHQUFRLENBQUMsVUFBRCxFQUFhLFFBQWIsRUFBdUIsWUFBdkIsRUFBcUMsWUFBckMsRUFBbUQsYUFBbkQsRUFBa0UsUUFBbEU7O3dCQUNSLG1DQUFBLEdBQXFDLFNBQUMsS0FBRCxFQUFRLEdBQVI7QUFDbkMsVUFBQTtNQUQ0Qyx3QkFBRCxNQUFTO01BQ3BELE9BQUEsR0FBVSxDQUFDLENBQUMsT0FBRixDQUFVLEtBQVYsRUFBaUIsTUFBakI7TUFDVixHQUFBLEdBQU07QUFDTixXQUFBLHVDQUFBOztjQUF1QixLQUFBLEdBQVEsT0FBUSxDQUFBLElBQUE7OztRQUVyQyxNQUFBLEdBQVMsQ0FDUCxLQUFBLEdBQU0sSUFEQyxFQUVQLEVBRk8sRUFHUCxvQ0FITyxFQUlQLG9DQUpPO0FBTVQsYUFBQSx5Q0FBQTsyQkFBSyxzQkFBUSxnQ0FBYTtVQUN4QixXQUFBLEdBQWMsV0FBVyxDQUFDLE9BQVosQ0FBb0IsZ0JBQXBCLEVBQXNDLEVBQXRDOztZQUNkLGNBQWU7OztZQUNmLFNBQVU7O1VBQ1YsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFBLEdBQUssTUFBTCxHQUFZLE1BQVosR0FBa0IsV0FBbEIsR0FBOEIsTUFBOUIsR0FBb0MsV0FBcEMsR0FBZ0QsSUFBNUQ7QUFKRjtRQUtBLEdBQUEsSUFBTyxNQUFNLENBQUMsSUFBUCxDQUFZLElBQVosQ0FBQSxHQUFvQjtBQWI3QjthQWVBLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBZixDQUFBLENBQXFCLENBQUMsSUFBdEIsQ0FBMkIsU0FBQyxNQUFEO1FBQ3pCLElBQW9DLGNBQXBDO1VBQUEsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsTUFBQSxHQUFTLElBQTNCLEVBQUE7O2VBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsR0FBbEI7TUFGeUIsQ0FBM0I7SUFsQm1DOzt3QkFzQnJDLDJCQUFBLEdBQTZCLFNBQUE7QUFDM0IsVUFBQTtNQUFBLE1BQUEsR0FBUzthQW9CVCxJQUFDLENBQUEsbUNBQUQsQ0FBcUMsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQUFyQyxFQUF5RDtRQUFDLFFBQUEsTUFBRDtPQUF6RDtJQXJCMkI7O3dCQXVCN0IsU0FBQSxHQUFXLFNBQUE7QUFDVCxVQUFBO01BQUEsTUFBQSxHQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQTtNQUNSLE1BQU8sTUFBTSxDQUFDLHVCQUFQLENBQUE7YUFDSixJQUFBLGVBQUEsQ0FDRjtRQUFBLE9BQUEsRUFBUyw4Q0FBVDtRQUNBLElBQUEsRUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFQLENBQUEsQ0FBRCxFQUFtQixHQUFBLEdBQUcsQ0FBQyxHQUFBLEdBQUksQ0FBTCxDQUF0QixDQUROO09BREU7SUFISzs7d0JBT1gsMkJBQUEsR0FBNkIsU0FBQTthQUMzQiwyQkFBQSxDQUE0QixDQUFDLENBQUMsTUFBRixDQUFTLElBQUksQ0FBQyxhQUFMLENBQUEsQ0FBVCxDQUE1QixFQUNFO1FBQUEsaUJBQUEsRUFBbUIsQ0FDakIsS0FEaUIsRUFFakIsNkJBRmlCLEVBR2pCLFVBSGlCLEVBR0wsUUFISyxFQUdLLFdBSEwsRUFHa0IsY0FIbEIsRUFHa0MsV0FIbEMsRUFJakIsZUFKaUIsRUFJQSxTQUpBLEVBSVcsT0FKWCxFQUtqQixnQkFMaUIsRUFLQyxhQUxELEVBTWpCLE1BTmlCLEVBTVQsZ0JBTlMsRUFNUyxpQkFOVCxFQU00QixpQkFONUIsRUFPakIscUJBUGlCLEVBT00sZUFQTixFQU91QixlQVB2QixFQU93QyxjQVB4QyxFQVFqQixrQkFSaUIsRUFTakIsbUJBVGlCLEVBVWpCLGlCQVZpQixDQUFuQjtRQVlBLGdCQUFBLEVBQWtCLElBWmxCO09BREY7SUFEMkI7Ozs7OztFQWdCekI7SUFDUyx3QkFBQyxPQUFEO0FBQ1gsVUFBQTtNQURZLElBQUMsQ0FBQSxTQUFEO01BQ1osSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBQyxDQUFBLE1BQU0sQ0FBQztNQUN6QixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFDZixRQUFBLEdBQVcsSUFBSSxDQUFDLFFBQUwsQ0FBYyxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBQSxDQUFkO01BQ1gsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFDLENBQUEsTUFBTSxDQUFDLFNBQVIsQ0FBa0IsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQzlCLE9BQU8sQ0FBQyxLQUFSLENBQUE7VUFDQSxJQUFJLENBQUMsZUFBTCxHQUF1QjtVQUN2QixLQUFDLENBQUEsTUFBRCxDQUFBO1VBQ0EsSUFBSSxDQUFDLGVBQUwsR0FBdUI7VUFDdkIsSUFBSSxDQUFDLEtBQUwsQ0FBQTtVQUNBLEtBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLFlBQWQ7aUJBQ0EsT0FBTyxDQUFDLEdBQVIsQ0FBWSxXQUFBLEdBQVksUUFBeEI7UUFQOEI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWxCO0lBSkg7OzZCQWFiLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtvREFBVyxDQUFFLE9BQWIsQ0FBQTtJQURPOzs2QkFHVCxXQUFBLEdBQWEsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksWUFBWixFQUEwQixFQUExQjtJQUFSOzs2QkFFYixNQUFBLEdBQVEsU0FBQTtBQUNOLFVBQUE7TUFBQSxRQUFBLEdBQVcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBZCxDQUFpQyxlQUFqQztNQUNYLGVBQUEsR0FBa0IsTUFBTSxDQUFDO01BQ3pCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFNBQUMsT0FBRDtRQUNmLElBQUcsT0FBTyxDQUFDLFVBQVIsQ0FBbUIsSUFBbkIsQ0FBSDtpQkFDRSxlQUFBLENBQW1CLFFBQUQsR0FBVSxPQUFWLEdBQWlCLE9BQW5DLEVBREY7U0FBQSxNQUFBO2lCQUdFLGVBQUEsQ0FBZ0IsT0FBaEIsRUFIRjs7TUFEZTtNQU1qQixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQWQsQ0FBdUIsSUFBQyxDQUFBLGFBQXhCLEVBQXVDLHlCQUF2QzthQUNBLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0lBVlg7Ozs7OztFQVlWLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBclFqQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcbmZzID0gcmVxdWlyZSAnZnMtcGx1cydcbntFbWl0dGVyLCBEaXNwb3NhYmxlLCBCdWZmZXJlZFByb2Nlc3MsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxuQmFzZSA9IHJlcXVpcmUgJy4vYmFzZSdcbntnZW5lcmF0ZUludHJvc3BlY3Rpb25SZXBvcnR9ID0gcmVxdWlyZSAnLi9pbnRyb3NwZWN0aW9uJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xue2RlYnVnLCBnZXRQYXJlbnQsIGdldEFuY2VzdG9ycywgZ2V0S2V5QmluZGluZ0ZvckNvbW1hbmR9ID0gcmVxdWlyZSAnLi91dGlscydcblxucGFja2FnZVNjb3BlID0gJ3ZpbS1tb2RlLXBsdXMnXG5nZXRFZGl0b3JTdGF0ZSA9IG51bGxcblxuY2xhc3MgRGV2ZWxvcGVyXG4gIGluaXQ6IChzZXJ2aWNlKSAtPlxuICAgIHtnZXRFZGl0b3JTdGF0ZX0gPSBzZXJ2aWNlXG4gICAgQGRldkVudmlyb25tZW50QnlCdWZmZXIgPSBuZXcgTWFwXG4gICAgQHJlbG9hZFN1YnNjcmlwdGlvbkJ5QnVmZmVyID0gbmV3IE1hcFxuXG4gICAgY29tbWFuZHMgPVxuICAgICAgJ3RvZ2dsZS1kZWJ1Zyc6ID0+IEB0b2dnbGVEZWJ1ZygpXG4gICAgICAnb3Blbi1pbi12aW0nOiA9PiBAb3BlbkluVmltKClcbiAgICAgICdnZW5lcmF0ZS1pbnRyb3NwZWN0aW9uLXJlcG9ydCc6ID0+IEBnZW5lcmF0ZUludHJvc3BlY3Rpb25SZXBvcnQoKVxuICAgICAgJ2dlbmVyYXRlLWNvbW1hbmQtc3VtbWFyeS10YWJsZSc6ID0+IEBnZW5lcmF0ZUNvbW1hbmRTdW1tYXJ5VGFibGUoKVxuICAgICAgJ3RvZ2dsZS1kZXYtZW52aXJvbm1lbnQnOiA9PiBAdG9nZ2xlRGV2RW52aXJvbm1lbnQoKVxuICAgICAgJ2NsZWFyLWRlYnVnLW91dHB1dCc6ID0+IEBjbGVhckRlYnVnT3V0cHV0KClcbiAgICAgICdyZWxvYWQtcGFja2FnZXMnOiA9PiBAcmVsb2FkUGFja2FnZXMoKVxuICAgICAgJ3RvZ2dsZS1yZWxvYWQtcGFja2FnZXMtb24tc2F2ZSc6ID0+IEB0b2dnbGVSZWxvYWRQYWNrYWdlc09uU2F2ZSgpXG5cbiAgICBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBmb3IgbmFtZSwgZm4gb2YgY29tbWFuZHNcbiAgICAgIHN1YnNjcmlwdGlvbnMuYWRkIEBhZGRDb21tYW5kKG5hbWUsIGZuKVxuICAgIHN1YnNjcmlwdGlvbnNcblxuICByZWxvYWRQYWNrYWdlczogLT5cbiAgICBwYWNrYWdlcyA9IHNldHRpbmdzLmdldCgnZGV2UmVsb2FkUGFja2FnZXMnKSA/IFtdXG4gICAgcGFja2FnZXMucHVzaCgndmltLW1vZGUtcGx1cycpXG4gICAgZm9yIHBhY2tOYW1lIGluIHBhY2thZ2VzXG4gICAgICBwYWNrID0gYXRvbS5wYWNrYWdlcy5nZXRMb2FkZWRQYWNrYWdlKHBhY2tOYW1lKVxuXG4gICAgICBpZiBwYWNrP1xuICAgICAgICBjb25zb2xlLmxvZyBcImRlYWN0aXZhdGluZyAje3BhY2tOYW1lfVwiXG4gICAgICAgIGF0b20ucGFja2FnZXMuZGVhY3RpdmF0ZVBhY2thZ2UocGFja05hbWUpXG4gICAgICAgIGF0b20ucGFja2FnZXMudW5sb2FkUGFja2FnZShwYWNrTmFtZSlcblxuICAgICAgICBwYWNrUGF0aCA9IHBhY2sucGF0aFxuICAgICAgICBPYmplY3Qua2V5cyhyZXF1aXJlLmNhY2hlKVxuICAgICAgICAgIC5maWx0ZXIgKHApIC0+XG4gICAgICAgICAgICBwLmluZGV4T2YocGFja1BhdGggKyBwYXRoLnNlcCkgaXMgMFxuICAgICAgICAgIC5mb3JFYWNoIChwKSAtPlxuICAgICAgICAgICAgZGVsZXRlIHJlcXVpcmUuY2FjaGVbcF1cblxuICAgICAgICBhdG9tLnBhY2thZ2VzLmxvYWRQYWNrYWdlKHBhY2tOYW1lKVxuICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZShwYWNrTmFtZSlcblxuICB0b2dnbGVSZWxvYWRQYWNrYWdlc09uU2F2ZTogLT5cbiAgICByZXR1cm4gdW5sZXNzIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKVxuICAgIGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShlZGl0b3IuZ2V0UGF0aCgpKVxuXG4gICAgaWYgc3Vic2NyaXB0aW9uID0gQHJlbG9hZFN1YnNjcmlwdGlvbkJ5QnVmZmVyLmdldChidWZmZXIpXG4gICAgICBzdWJzY3JpcHRpb24uZGlzcG9zZSgpXG4gICAgICBAcmVsb2FkU3Vic2NyaXB0aW9uQnlCdWZmZXIuZGVsZXRlKGJ1ZmZlcilcbiAgICAgIGNvbnNvbGUubG9nIFwiZGlzcG9zZWQgcmVsb2FkUGFja2FnZXNPblNhdmUgZm9yICN7ZmlsZU5hbWV9XCJcbiAgICBlbHNlXG4gICAgICBAcmVsb2FkU3Vic2NyaXB0aW9uQnlCdWZmZXIuc2V0IGJ1ZmZlciwgYnVmZmVyLm9uRGlkU2F2ZSA9PlxuICAgICAgICBjb25zb2xlLmNsZWFyKClcbiAgICAgICAgQHJlbG9hZFBhY2thZ2VzKClcbiAgICAgIGNvbnNvbGUubG9nIFwiYWN0aXZhdGVkIHJlbG9hZFBhY2thZ2VzT25TYXZlIGZvciAje2ZpbGVOYW1lfVwiXG5cbiAgdG9nZ2xlRGV2RW52aXJvbm1lbnQ6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKClcbiAgICBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZWRpdG9yLmdldFBhdGgoKSlcblxuICAgIGlmIEBkZXZFbnZpcm9ubWVudEJ5QnVmZmVyLmhhcyhidWZmZXIpXG4gICAgICBAZGV2RW52aXJvbm1lbnRCeUJ1ZmZlci5nZXQoYnVmZmVyKS5kaXNwb3NlKClcbiAgICAgIEBkZXZFbnZpcm9ubWVudEJ5QnVmZmVyLmRlbGV0ZShidWZmZXIpXG4gICAgICBjb25zb2xlLmxvZyBcImRpc3Bvc2VkIGRldiBlbnYgI3tmaWxlTmFtZX1cIlxuICAgIGVsc2VcbiAgICAgIEBkZXZFbnZpcm9ubWVudEJ5QnVmZmVyLnNldChidWZmZXIsIG5ldyBEZXZFbnZpcm9ubWVudChlZGl0b3IpKVxuICAgICAgY29uc29sZS5sb2cgXCJhY3RpdmF0ZWQgZGV2IGVudiAje2ZpbGVOYW1lfVwiXG5cbiAgYWRkQ29tbWFuZDogKG5hbWUsIGZuKSAtPlxuICAgIGF0b20uY29tbWFuZHMuYWRkKCdhdG9tLXRleHQtZWRpdG9yJywgXCIje3BhY2thZ2VTY29wZX06I3tuYW1lfVwiLCBmbilcblxuICBjbGVhckRlYnVnT3V0cHV0OiAobmFtZSwgZm4pIC0+XG4gICAgZmlsZVBhdGggPSBmcy5ub3JtYWxpemUoc2V0dGluZ3MuZ2V0KCdkZWJ1Z091dHB1dEZpbGVQYXRoJykpXG4gICAgb3B0aW9ucyA9IHtzZWFyY2hBbGxQYW5lczogdHJ1ZSwgYWN0aXZhdGVQYW5lOiBmYWxzZX1cbiAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGVQYXRoLCBvcHRpb25zKS50aGVuIChlZGl0b3IpIC0+XG4gICAgICBlZGl0b3Iuc2V0VGV4dCgnJylcbiAgICAgIGVkaXRvci5zYXZlKClcblxuICB0b2dnbGVEZWJ1ZzogLT5cbiAgICBzZXR0aW5ncy5zZXQoJ2RlYnVnJywgbm90IHNldHRpbmdzLmdldCgnZGVidWcnKSlcbiAgICBjb25zb2xlLmxvZyBcIiN7c2V0dGluZ3Muc2NvcGV9IGRlYnVnOlwiLCBzZXR0aW5ncy5nZXQoJ2RlYnVnJylcblxuICAjIEJvcnJvd2VkIGZyb20gdW5kZXJzY29yZS1wbHVzXG4gIG1vZGlmaWVyS2V5TWFwID1cbiAgICBcImN0cmwtY21kLVwiOiAnXFx1MjMwM1xcdTIzMTgnXG4gICAgXCJjbWQtXCI6ICdcXHUyMzE4J1xuICAgIFwiY3RybC1cIjogJ1xcdTIzMDMnXG4gICAgYWx0OiAnXFx1MjMyNSdcbiAgICBvcHRpb246ICdcXHUyMzI1J1xuICAgIGVudGVyOiAnXFx1MjNjZSdcbiAgICBsZWZ0OiAnXFx1MjE5MCdcbiAgICByaWdodDogJ1xcdTIxOTInXG4gICAgdXA6ICdcXHUyMTkxJ1xuICAgIGRvd246ICdcXHUyMTkzJ1xuICAgIGJhY2tzcGFjZTogJ0JTJ1xuICAgIHNwYWNlOiAnU1BDJ1xuXG4gIHNlbGVjdG9yTWFwID1cbiAgICBcImF0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1c1wiOiAnJ1xuICAgIFwiLm5vcm1hbC1tb2RlXCI6ICduJ1xuICAgIFwiLmluc2VydC1tb2RlXCI6ICdpJ1xuICAgIFwiLnJlcGxhY2VcIjogJ1InXG4gICAgXCIudmlzdWFsLW1vZGVcIjogJ3YnXG4gICAgXCIuY2hhcmFjdGVyd2lzZVwiOiAnQydcbiAgICBcIi5ibG9ja3dpc2VcIjogJ0InXG4gICAgXCIubGluZXdpc2VcIjogJ0wnXG4gICAgXCIub3BlcmF0b3ItcGVuZGluZy1tb2RlXCI6ICdvJ1xuICAgIFwiLndpdGgtY291bnRcIjogJyMnXG4gICAgXCIuaGFzLXBlcnNpc3RlbnQtc2VsZWN0aW9uXCI6ICclJ1xuXG4gIGdldENvbW1hbmRTcGVjczogLT5cbiAgICBjb21wYWN0U2VsZWN0b3IgPSAoc2VsZWN0b3IpIC0+XG4gICAgICBwYXR0ZXJuID0gLy8vKCN7Xy5rZXlzKHNlbGVjdG9yTWFwKS5tYXAoXy5lc2NhcGVSZWdFeHApLmpvaW4oJ3wnKX0pLy8vZ1xuICAgICAgc2VsZWN0b3Iuc3BsaXQoLyxcXHMqL2cpLm1hcCAoc2NvcGUpIC0+XG4gICAgICAgIHNjb3BlXG4gICAgICAgICAgLnJlcGxhY2UoLzpub3RcXCgoLiopXFwpLywgJyEkMScpXG4gICAgICAgICAgLnJlcGxhY2UocGF0dGVybiwgKHMpIC0+IHNlbGVjdG9yTWFwW3NdKVxuICAgICAgLmpvaW4oXCIsXCIpXG5cbiAgICBjb21wYWN0S2V5c3Ryb2tlcyA9IChrZXlzdHJva2VzKSAtPlxuICAgICAgc3BlY2lhbENoYXJzID0gJ1xcXFxgKl97fVtdKCkjKy0uISdcbiAgICAgIHNwZWNpYWxDaGFyc1JlZ2V4cCA9IC8vLyN7c3BlY2lhbENoYXJzLnNwbGl0KCcnKS5tYXAoXy5lc2NhcGVSZWdFeHApLmpvaW4oJ3wnKX0vLy9nXG4gICAgICBtb2RpZmllcktleVJlZ2V4cCA9IC8vLygje18ua2V5cyhtb2RpZmllcktleU1hcCkubWFwKF8uZXNjYXBlUmVnRXhwKS5qb2luKCd8Jyl9KS8vL1xuICAgICAga2V5c3Ryb2tlc1xuICAgICAgICAjIC5yZXBsYWNlKC8oYHxfKS9nLCAnXFxcXCQxJylcbiAgICAgICAgLnJlcGxhY2UobW9kaWZpZXJLZXlSZWdleHAsIChzKSAtPiBtb2RpZmllcktleU1hcFtzXSlcbiAgICAgICAgLnJlcGxhY2UoLy8vKCN7c3BlY2lhbENoYXJzUmVnZXhwfSkvLy9nLCBcIlxcXFwkMVwiKVxuICAgICAgICAucmVwbGFjZSgvXFx8L2csICcmIzEyNDsnKVxuICAgICAgICAucmVwbGFjZSgvXFxzKy8sICcnKVxuXG4gICAgY29tbWFuZHMgPSAoXG4gICAgICBmb3IgbmFtZSwga2xhc3Mgb2YgQmFzZS5nZXRSZWdpc3RyaWVzKCkgd2hlbiBrbGFzcy5pc0NvbW1hbmQoKVxuICAgICAgICBraW5kID0gZ2V0QW5jZXN0b3JzKGtsYXNzKS5tYXAoKGspIC0+IGsubmFtZSlbLTIuLi0yXVswXVxuICAgICAgICBjb21tYW5kTmFtZSA9IGtsYXNzLmdldENvbW1hbmROYW1lKClcbiAgICAgICAgZGVzY3JpcHRpb24gPSBrbGFzcy5nZXREZXNjdGlwdGlvbigpPy5yZXBsYWNlKC9cXG4vZywgJzxici8+JylcblxuICAgICAgICBrZXltYXAgPSBudWxsXG4gICAgICAgIGlmIGtleW1hcHMgPSBnZXRLZXlCaW5kaW5nRm9yQ29tbWFuZChjb21tYW5kTmFtZSwgcGFja2FnZU5hbWU6IFwidmltLW1vZGUtcGx1c1wiKVxuICAgICAgICAgIGtleW1hcCA9IGtleW1hcHMubWFwICh7a2V5c3Ryb2tlcywgc2VsZWN0b3J9KSAtPlxuICAgICAgICAgICAgXCJgI3tjb21wYWN0U2VsZWN0b3Ioc2VsZWN0b3IpfWAgPGNvZGU+I3tjb21wYWN0S2V5c3Ryb2tlcyhrZXlzdHJva2VzKX08L2NvZGU+XCJcbiAgICAgICAgICAuam9pbihcIjxici8+XCIpXG5cbiAgICAgICAge25hbWUsIGNvbW1hbmROYW1lLCBraW5kLCBkZXNjcmlwdGlvbiwga2V5bWFwfVxuICAgIClcbiAgICBjb21tYW5kc1xuXG4gIGtpbmRzID0gW1wiT3BlcmF0b3JcIiwgXCJNb3Rpb25cIiwgXCJUZXh0T2JqZWN0XCIsIFwiSW5zZXJ0TW9kZVwiLCBcIk1pc2NDb21tYW5kXCIsIFwiU2Nyb2xsXCJdXG4gIGdlbmVyYXRlU3VtbWFyeVRhYmxlRm9yQ29tbWFuZFNwZWNzOiAoc3BlY3MsIHtoZWFkZXJ9PXt9KSAtPlxuICAgIGdyb3VwZWQgPSBfLmdyb3VwQnkoc3BlY3MsICdraW5kJylcbiAgICBzdHIgPSBcIlwiXG4gICAgZm9yIGtpbmQgaW4ga2luZHMgd2hlbiBzcGVjcyA9IGdyb3VwZWRba2luZF1cblxuICAgICAgcmVwb3J0ID0gW1xuICAgICAgICBcIiMjICN7a2luZH1cIlxuICAgICAgICBcIlwiXG4gICAgICAgIFwifCBLZXltYXAgfCBDb21tYW5kIHwgRGVzY3JpcHRpb24gfFwiXG4gICAgICAgIFwifDotLS0tLS0tfDotLS0tLS0tLXw6LS0tLS0tLS0tLS0tfFwiXG4gICAgICBdXG4gICAgICBmb3Ige2tleW1hcCwgY29tbWFuZE5hbWUsIGRlc2NyaXB0aW9ufSBpbiBzcGVjc1xuICAgICAgICBjb21tYW5kTmFtZSA9IGNvbW1hbmROYW1lLnJlcGxhY2UoL3ZpbS1tb2RlLXBsdXM6LywgJycpXG4gICAgICAgIGRlc2NyaXB0aW9uID89IFwiXCJcbiAgICAgICAga2V5bWFwID89IFwiXCJcbiAgICAgICAgcmVwb3J0LnB1c2ggXCJ8ICN7a2V5bWFwfSB8IGAje2NvbW1hbmROYW1lfWAgfCAje2Rlc2NyaXB0aW9ufSB8XCJcbiAgICAgIHN0ciArPSByZXBvcnQuam9pbihcIlxcblwiKSArIFwiXFxuXFxuXCJcblxuICAgIGF0b20ud29ya3NwYWNlLm9wZW4oKS50aGVuIChlZGl0b3IpIC0+XG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dChoZWFkZXIgKyBcIlxcblwiKSBpZiBoZWFkZXI/XG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dChzdHIpXG5cbiAgZ2VuZXJhdGVDb21tYW5kU3VtbWFyeVRhYmxlOiAtPlxuICAgIGhlYWRlciA9IFwiXCJcIlxuICAgICMjIEtleW1hcCBzZWxlY3RvciBhYmJyZXZpYXRpb25zXG5cbiAgICBJbiB0aGlzIGRvY3VtZW50LCBmb2xsb3dpbmcgYWJicmV2aWF0aW9ucyBhcmUgdXNlZCBmb3Igc2hvcnRuZXNzLlxuXG4gICAgfCBBYmJyZXYgfCBTZWxlY3RvciAgICAgICAgICAgICAgICAgICAgIHwgRGVzY3JpcHRpb24gICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgIHw6LS0tLS0tLXw6LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18Oi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXxcbiAgICB8IGAhaWAgICB8IGA6bm90KC5pbnNlcnQtbW9kZSlgICAgICAgICAgfCBleGNlcHQgaW5zZXJ0LW1vZGUgICAgICAgICAgICAgICAgICB8XG4gICAgfCBgaWAgICAgfCBgLmluc2VydC1tb2RlYCAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgIHwgYG9gICAgIHwgYC5vcGVyYXRvci1wZW5kaW5nLW1vZGVgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICB8IGBuYCAgICB8IGAubm9ybWFsLW1vZGVgICAgICAgICAgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgfCBgdmAgICAgfCBgLnZpc3VhbC1tb2RlYCAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgIHwgYHZCYCAgIHwgYC52aXN1YWwtbW9kZS5ibG9ja3dpc2VgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICB8IGB2TGAgICB8IGAudmlzdWFsLW1vZGUubGluZXdpc2VgICAgICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gICAgfCBgdkNgICAgfCBgLnZpc3VhbC1tb2RlLmNoYXJhY3Rlcndpc2VgIHwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfFxuICAgIHwgYGlSYCAgIHwgYC5pbnNlcnQtbW9kZS5yZXBsYWNlYCAgICAgICB8ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAgICB8IGAjYCAgICB8IGAud2l0aC1jb3VudGAgICAgICAgICAgICAgICAgfCB3aGVuIGNvdW50IGlzIHNwZWNpZmllZCAgICAgICAgICAgICB8XG4gICAgfCBgJWAgICAgfCBgLmhhcy1wZXJzaXN0ZW50LXNlbGVjdGlvbmAgfCB3aGVuIHBlcnNpc3RlbnQtc2VsZWN0aW9uIGlzIGV4aXN0cyB8XG5cbiAgICBcIlwiXCJcbiAgICBAZ2VuZXJhdGVTdW1tYXJ5VGFibGVGb3JDb21tYW5kU3BlY3MoQGdldENvbW1hbmRTcGVjcygpLCB7aGVhZGVyfSlcblxuICBvcGVuSW5WaW06IC0+XG4gICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAge3Jvd30gPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgIG5ldyBCdWZmZXJlZFByb2Nlc3NcbiAgICAgIGNvbW1hbmQ6IFwiL0FwcGxpY2F0aW9ucy9NYWNWaW0uYXBwL0NvbnRlbnRzL01hY09TL212aW1cIlxuICAgICAgYXJnczogW2VkaXRvci5nZXRQYXRoKCksIFwiKyN7cm93KzF9XCJdXG5cbiAgZ2VuZXJhdGVJbnRyb3NwZWN0aW9uUmVwb3J0OiAtPlxuICAgIGdlbmVyYXRlSW50cm9zcGVjdGlvblJlcG9ydCBfLnZhbHVlcyhCYXNlLmdldFJlZ2lzdHJpZXMoKSksXG4gICAgICBleGNsdWRlUHJvcGVydGllczogW1xuICAgICAgICAncnVuJ1xuICAgICAgICAnZ2V0Q29tbWFuZE5hbWVXaXRob3V0UHJlZml4J1xuICAgICAgICAnZ2V0Q2xhc3MnLCAnZXh0ZW5kJywgJ2dldFBhcmVudCcsICdnZXRBbmNlc3RvcnMnLCAnaXNDb21tYW5kJ1xuICAgICAgICAnZ2V0UmVnaXN0cmllcycsICdjb21tYW5kJywgJ3Jlc2V0J1xuICAgICAgICAnZ2V0RGVzY3RpcHRpb24nLCAnZGVzY3JpcHRpb24nXG4gICAgICAgICdpbml0JywgJ2dldENvbW1hbmROYW1lJywgJ2dldENvbW1hbmRTY29wZScsICdyZWdpc3RlckNvbW1hbmQnLFxuICAgICAgICAnZGVsZWdhdGVzUHJvcGVydGllcycsICdzdWJzY3JpcHRpb25zJywgJ2NvbW1hbmRQcmVmaXgnLCAnY29tbWFuZFNjb3BlJ1xuICAgICAgICAnZGVsZWdhdGVzTWV0aG9kcycsXG4gICAgICAgICdkZWxlZ2F0ZXNQcm9wZXJ0eScsXG4gICAgICAgICdkZWxlZ2F0ZXNNZXRob2QnLFxuICAgICAgXVxuICAgICAgcmVjdXJzaXZlSW5zcGVjdDogQmFzZVxuXG5jbGFzcyBEZXZFbnZpcm9ubWVudFxuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IpIC0+XG4gICAgQGVkaXRvckVsZW1lbnQgPSBAZWRpdG9yLmVsZW1lbnRcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKEBlZGl0b3IuZ2V0UGF0aCgpKVxuICAgIEBkaXNwb3NhYmxlID0gQGVkaXRvci5vbkRpZFNhdmUgPT5cbiAgICAgIGNvbnNvbGUuY2xlYXIoKVxuICAgICAgQmFzZS5zdXBwcmVzc1dhcm5pbmcgPSB0cnVlXG4gICAgICBAcmVsb2FkKClcbiAgICAgIEJhc2Uuc3VwcHJlc3NXYXJuaW5nID0gZmFsc2VcbiAgICAgIEJhc2UucmVzZXQoKVxuICAgICAgQGVtaXR0ZXIuZW1pdCAnZGlkLXJlbG9hZCdcbiAgICAgIGNvbnNvbGUubG9nIFwicmVsb2FkZWQgI3tmaWxlTmFtZX1cIlxuXG4gIGRpc3Bvc2U6IC0+XG4gICAgQGRpc3Bvc2FibGU/LmRpc3Bvc2UoKVxuXG4gIG9uRGlkUmVsb2FkOiAoZm4pIC0+IEBlbWl0dGVyLm9uKCdkaWQtcmVsb2FkJywgZm4pXG5cbiAgcmVsb2FkOiAtPlxuICAgIHBhY2tQYXRoID0gYXRvbS5wYWNrYWdlcy5yZXNvbHZlUGFja2FnZVBhdGgoJ3ZpbS1tb2RlLXBsdXMnKVxuICAgIG9yaWdpbmFsUmVxdWlyZSA9IGdsb2JhbC5yZXF1aXJlXG4gICAgZ2xvYmFsLnJlcXVpcmUgPSAobGliUGF0aCkgLT5cbiAgICAgIGlmIGxpYlBhdGguc3RhcnRzV2l0aCAnLi8nXG4gICAgICAgIG9yaWdpbmFsUmVxdWlyZSBcIiN7cGFja1BhdGh9L2xpYi8je2xpYlBhdGh9XCJcbiAgICAgIGVsc2VcbiAgICAgICAgb3JpZ2luYWxSZXF1aXJlIGxpYlBhdGhcblxuICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goQGVkaXRvckVsZW1lbnQsICdydW4taW4tYXRvbTpydW4taW4tYXRvbScpXG4gICAgZ2xvYmFsLnJlcXVpcmUgPSBvcmlnaW5hbFJlcXVpcmVcblxubW9kdWxlLmV4cG9ydHMgPSBEZXZlbG9wZXJcbiJdfQ==
