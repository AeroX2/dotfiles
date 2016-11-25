(function() {
  var Settings, inferType;

  inferType = function(value) {
    switch (false) {
      case !Number.isInteger(value):
        return 'integer';
      case typeof value !== 'boolean':
        return 'boolean';
      case typeof value !== 'string':
        return 'string';
      case !Array.isArray(value):
        return 'array';
    }
  };

  Settings = (function() {
    function Settings(scope, config) {
      var i, j, k, key, len, len1, name, ref, ref1, value;
      this.scope = scope;
      this.config = config;
      ref = Object.keys(this.config);
      for (j = 0, len = ref.length; j < len; j++) {
        key = ref[j];
        if (typeof this.config[key] === 'boolean') {
          this.config[key] = {
            "default": this.config[key]
          };
        }
        if ((value = this.config[key]).type == null) {
          value.type = inferType(value["default"]);
        }
      }
      ref1 = Object.keys(this.config);
      for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
        name = ref1[i];
        this.config[name].order = i;
      }
    }

    Settings.prototype.get = function(param) {
      if (param === 'defaultRegister') {
        if (this.get('useClipboardAsDefaultRegister')) {
          return '*';
        } else {
          return '"';
        }
      } else {
        return atom.config.get(this.scope + "." + param);
      }
    };

    Settings.prototype.set = function(param, value) {
      return atom.config.set(this.scope + "." + param, value);
    };

    Settings.prototype.toggle = function(param) {
      return this.set(param, !this.get(param));
    };

    Settings.prototype.observe = function(param, fn) {
      return atom.config.observe(this.scope + "." + param, fn);
    };

    return Settings;

  })();

  module.exports = new Settings('vim-mode-plus', {
    setCursorToStartOfChangeOnUndoRedo: true,
    groupChangesWhenLeavingInsertMode: true,
    useClipboardAsDefaultRegister: false,
    startInInsertMode: false,
    startInInsertModeScopes: {
      "default": [],
      items: {
        type: 'string'
      },
      description: 'Start in insert-mode whan editorElement matches scope'
    },
    clearMultipleCursorsOnEscapeInsertMode: false,
    autoSelectPersistentSelectionOnOperate: true,
    wrapLeftRightMotion: false,
    numberRegex: {
      "default": '-?[0-9]+',
      description: 'Used to find number in ctrl-a/ctrl-x. To ignore "-"(minus) char in string like "identifier-1" use "(?:\\B-)?[0-9]+"'
    },
    clearHighlightSearchOnResetNormalMode: {
      "default": false,
      description: 'Clear highlightSearch on `escape` in normal-mode'
    },
    clearPersistentSelectionOnResetNormalMode: {
      "default": false,
      description: 'Clear persistentSelection on `escape` in normal-mode'
    },
    charactersToAddSpaceOnSurround: {
      "default": [],
      items: {
        type: 'string'
      },
      description: 'Comma separated list of character, which add additional space inside when surround.'
    },
    showCursorInVisualMode: true,
    ignoreCaseForSearch: {
      "default": false,
      description: 'For `/` and `?`'
    },
    useSmartcaseForSearch: {
      "default": false,
      description: 'For `/` and `?`. Override `ignoreCaseForSearch`'
    },
    ignoreCaseForSearchCurrentWord: {
      "default": false,
      description: 'For `*` and `#`.'
    },
    useSmartcaseForSearchCurrentWord: {
      "default": false,
      description: 'For `*` and `#`. Override `ignoreCaseForSearchCurrentWord`'
    },
    highlightSearch: false,
    highlightSearchExcludeScopes: {
      "default": [],
      items: {
        type: 'string'
      },
      description: 'Suppress highlightSearch when any of these classes are present in the editor'
    },
    incrementalSearch: false,
    incrementalSearchVisitDirection: {
      "default": 'absolute',
      "enum": ['absolute', 'relative'],
      description: "Whether 'visit-next'(tab) and 'visit-prev'(shift-tab) depends on search direction('/' or '?')"
    },
    stayOnTransformString: {
      "default": false,
      description: "Don't move cursor after TransformString e.g upper-case, surround"
    },
    stayOnYank: {
      "default": false,
      description: "Don't move cursor after yank"
    },
    stayOnDelete: {
      "default": false,
      description: "Don't move cursor after yank"
    },
    flashOnUndoRedo: true,
    flashOnOperate: true,
    flashOnOperateBlacklist: {
      "default": [],
      items: {
        type: 'string'
      },
      description: 'comma separated list of operator class name to disable flash e.g. "yank, auto-indent"'
    },
    flashOnSearch: true,
    flashScreenOnSearchHasNoMatch: true,
    showHoverOnOperate: false,
    showHoverOnOperateIcon: {
      "default": 'icon',
      "enum": ['none', 'icon', 'emoji']
    },
    showHoverSearchCounter: false,
    showHoverSearchCounterDuration: {
      "default": 700,
      description: "Duration(msec) for hover search counter"
    },
    hideTabBarOnMaximizePane: true,
    smoothScrollOnFullScrollMotion: {
      "default": false,
      description: "For `ctrl-f` and `ctrl-b`"
    },
    smoothScrollOnFullScrollMotionDuration: {
      "default": 500,
      description: "Smooth scroll duration in milliseconds for `ctrl-f` and `ctrl-b`"
    },
    smoothScrollOnHalfScrollMotion: {
      "default": false,
      description: "For `ctrl-d` and `ctrl-u`"
    },
    smoothScrollOnHalfScrollMotionDuration: {
      "default": 500,
      description: "Smooth scroll duration in milliseconds for `ctrl-d` and `ctrl-u`"
    },
    statusBarModeStringStyle: {
      "default": 'short',
      "enum": ['short', 'long']
    },
    throwErrorOnNonEmptySelectionInNormalMode: {
      "default": false,
      description: "[Dev use] Throw error when non-empty selection was remained in normal-mode at the timing of operation finished"
    }
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvc2V0dGluZ3MuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxTQUFBLEdBQVksU0FBQyxLQUFEO0FBQ1YsWUFBQSxLQUFBO0FBQUEsWUFDTyxNQUFNLENBQUMsU0FBUCxDQUFpQixLQUFqQixDQURQO2VBQ29DO0FBRHBDLFdBRU8sT0FBTyxLQUFQLEtBQWlCLFNBRnhCO2VBRXVDO0FBRnZDLFdBR08sT0FBTyxLQUFQLEtBQWlCLFFBSHhCO2VBR3NDO0FBSHRDLFlBSU8sS0FBSyxDQUFDLE9BQU4sQ0FBYyxLQUFkLENBSlA7ZUFJaUM7QUFKakM7RUFEVTs7RUFPTjtJQUNTLGtCQUFDLEtBQUQsRUFBUyxNQUFUO0FBSVgsVUFBQTtNQUpZLElBQUMsQ0FBQSxRQUFEO01BQVEsSUFBQyxDQUFBLFNBQUQ7QUFJcEI7QUFBQSxXQUFBLHFDQUFBOztRQUNFLElBQUcsT0FBTyxJQUFDLENBQUEsTUFBTyxDQUFBLEdBQUEsQ0FBZixLQUF3QixTQUEzQjtVQUNFLElBQUMsQ0FBQSxNQUFPLENBQUEsR0FBQSxDQUFSLEdBQWU7WUFBQyxDQUFBLE9BQUEsQ0FBQSxFQUFTLElBQUMsQ0FBQSxNQUFPLENBQUEsR0FBQSxDQUFsQjtZQURqQjs7UUFFQSxJQUFPLHVDQUFQO1VBQ0UsS0FBSyxDQUFDLElBQU4sR0FBYSxTQUFBLENBQVUsS0FBSyxFQUFDLE9BQUQsRUFBZixFQURmOztBQUhGO0FBT0E7QUFBQSxXQUFBLGdEQUFBOztRQUNFLElBQUMsQ0FBQSxNQUFPLENBQUEsSUFBQSxDQUFLLENBQUMsS0FBZCxHQUFzQjtBQUR4QjtJQVhXOzt1QkFjYixHQUFBLEdBQUssU0FBQyxLQUFEO01BQ0gsSUFBRyxLQUFBLEtBQVMsaUJBQVo7UUFDRSxJQUFHLElBQUMsQ0FBQSxHQUFELENBQUssK0JBQUwsQ0FB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QSxPQUFBLENBQUEsRUFBUyxHQUFUO01BQ0EsV0FBQSxFQUFhLGtFQURiO0tBbkZGO0lBcUZBLHdCQUFBLEVBQ0U7TUFBQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLE9BQVQ7TUFDQSxDQUFBLElBQUEsQ0FBQSxFQUFNLENBQUMsT0FBRCxFQUFVLE1BQVYsQ0FETjtLQXRGRjtJQXdGQSx5Q0FBQSxFQUNFO01BQUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxLQUFUO01BQ0EsV0FBQSxFQUFhLGdIQURiO0tBekZGO0dBRG1CO0FBckNyQiIsInNvdXJjZXNDb250ZW50IjpbImluZmVyVHlwZSA9ICh2YWx1ZSkgLT5cbiAgc3dpdGNoXG4gICAgd2hlbiBOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSB0aGVuICdpbnRlZ2VyJ1xuICAgIHdoZW4gdHlwZW9mKHZhbHVlKSBpcyAnYm9vbGVhbicgdGhlbiAnYm9vbGVhbidcbiAgICB3aGVuIHR5cGVvZih2YWx1ZSkgaXMgJ3N0cmluZycgdGhlbiAnc3RyaW5nJ1xuICAgIHdoZW4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgdGhlbiAnYXJyYXknXG5cbmNsYXNzIFNldHRpbmdzXG4gIGNvbnN0cnVjdG9yOiAoQHNjb3BlLCBAY29uZmlnKSAtPlxuICAgICMgQXV0b21hdGljYWxseSBpbmZlciBhbmQgaW5qZWN0IGB0eXBlYCBvZiBlYWNoIGNvbmZpZyBwYXJhbWV0ZXIuXG4gICAgIyBza2lwIGlmIHZhbHVlIHdoaWNoIGFsZWFkeSBoYXZlIGB0eXBlYCBmaWVsZC5cbiAgICAjIEFsc28gdHJhbnNsYXRlIGJhcmUgYGJvb2xlYW5gIHZhbHVlIHRvIHtkZWZhdWx0OiBgYm9vbGVhbmB9IG9iamVjdFxuICAgIGZvciBrZXkgaW4gT2JqZWN0LmtleXMoQGNvbmZpZylcbiAgICAgIGlmIHR5cGVvZihAY29uZmlnW2tleV0pIGlzICdib29sZWFuJ1xuICAgICAgICBAY29uZmlnW2tleV0gPSB7ZGVmYXVsdDogQGNvbmZpZ1trZXldfVxuICAgICAgdW5sZXNzICh2YWx1ZSA9IEBjb25maWdba2V5XSkudHlwZT9cbiAgICAgICAgdmFsdWUudHlwZSA9IGluZmVyVHlwZSh2YWx1ZS5kZWZhdWx0KVxuXG4gICAgIyBbQ0FVVElPTl0gaW5qZWN0aW5nIG9yZGVyIHByb3BldHkgdG8gc2V0IG9yZGVyIHNob3duIGF0IHNldHRpbmctdmlldyBNVVNULUNPTUUtTEFTVC5cbiAgICBmb3IgbmFtZSwgaSBpbiBPYmplY3Qua2V5cyhAY29uZmlnKVxuICAgICAgQGNvbmZpZ1tuYW1lXS5vcmRlciA9IGlcblxuICBnZXQ6IChwYXJhbSkgLT5cbiAgICBpZiBwYXJhbSBpcyAnZGVmYXVsdFJlZ2lzdGVyJ1xuICAgICAgaWYgQGdldCgndXNlQ2xpcGJvYXJkQXNEZWZhdWx0UmVnaXN0ZXInKSB0aGVuICcqJyBlbHNlICdcIidcbiAgICBlbHNlXG4gICAgICBhdG9tLmNvbmZpZy5nZXQgXCIje0BzY29wZX0uI3twYXJhbX1cIlxuXG4gIHNldDogKHBhcmFtLCB2YWx1ZSkgLT5cbiAgICBhdG9tLmNvbmZpZy5zZXQgXCIje0BzY29wZX0uI3twYXJhbX1cIiwgdmFsdWVcblxuICB0b2dnbGU6IChwYXJhbSkgLT5cbiAgICBAc2V0KHBhcmFtLCBub3QgQGdldChwYXJhbSkpXG5cbiAgb2JzZXJ2ZTogKHBhcmFtLCBmbikgLT5cbiAgICBhdG9tLmNvbmZpZy5vYnNlcnZlIFwiI3tAc2NvcGV9LiN7cGFyYW19XCIsIGZuXG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFNldHRpbmdzICd2aW0tbW9kZS1wbHVzJyxcbiAgc2V0Q3Vyc29yVG9TdGFydE9mQ2hhbmdlT25VbmRvUmVkbzogdHJ1ZVxuICBncm91cENoYW5nZXNXaGVuTGVhdmluZ0luc2VydE1vZGU6IHRydWVcbiAgdXNlQ2xpcGJvYXJkQXNEZWZhdWx0UmVnaXN0ZXI6IGZhbHNlXG4gIHN0YXJ0SW5JbnNlcnRNb2RlOiBmYWxzZVxuICBzdGFydEluSW5zZXJ0TW9kZVNjb3BlczpcbiAgICBkZWZhdWx0OiBbXVxuICAgIGl0ZW1zOiB0eXBlOiAnc3RyaW5nJ1xuICAgIGRlc2NyaXB0aW9uOiAnU3RhcnQgaW4gaW5zZXJ0LW1vZGUgd2hhbiBlZGl0b3JFbGVtZW50IG1hdGNoZXMgc2NvcGUnXG4gIGNsZWFyTXVsdGlwbGVDdXJzb3JzT25Fc2NhcGVJbnNlcnRNb2RlOiBmYWxzZVxuICBhdXRvU2VsZWN0UGVyc2lzdGVudFNlbGVjdGlvbk9uT3BlcmF0ZTogdHJ1ZVxuICB3cmFwTGVmdFJpZ2h0TW90aW9uOiBmYWxzZVxuICBudW1iZXJSZWdleDpcbiAgICBkZWZhdWx0OiAnLT9bMC05XSsnXG4gICAgZGVzY3JpcHRpb246ICdVc2VkIHRvIGZpbmQgbnVtYmVyIGluIGN0cmwtYS9jdHJsLXguIFRvIGlnbm9yZSBcIi1cIihtaW51cykgY2hhciBpbiBzdHJpbmcgbGlrZSBcImlkZW50aWZpZXItMVwiIHVzZSBcIig/OlxcXFxCLSk/WzAtOV0rXCInXG4gIGNsZWFySGlnaGxpZ2h0U2VhcmNoT25SZXNldE5vcm1hbE1vZGU6XG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBkZXNjcmlwdGlvbjogJ0NsZWFyIGhpZ2hsaWdodFNlYXJjaCBvbiBgZXNjYXBlYCBpbiBub3JtYWwtbW9kZSdcbiAgY2xlYXJQZXJzaXN0ZW50U2VsZWN0aW9uT25SZXNldE5vcm1hbE1vZGU6XG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBkZXNjcmlwdGlvbjogJ0NsZWFyIHBlcnNpc3RlbnRTZWxlY3Rpb24gb24gYGVzY2FwZWAgaW4gbm9ybWFsLW1vZGUnXG4gIGNoYXJhY3RlcnNUb0FkZFNwYWNlT25TdXJyb3VuZDpcbiAgICBkZWZhdWx0OiBbXVxuICAgIGl0ZW1zOiB0eXBlOiAnc3RyaW5nJ1xuICAgIGRlc2NyaXB0aW9uOiAnQ29tbWEgc2VwYXJhdGVkIGxpc3Qgb2YgY2hhcmFjdGVyLCB3aGljaCBhZGQgYWRkaXRpb25hbCBzcGFjZSBpbnNpZGUgd2hlbiBzdXJyb3VuZC4nXG4gIHNob3dDdXJzb3JJblZpc3VhbE1vZGU6IHRydWVcbiAgaWdub3JlQ2FzZUZvclNlYXJjaDpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICAgIGRlc2NyaXB0aW9uOiAnRm9yIGAvYCBhbmQgYD9gJ1xuICB1c2VTbWFydGNhc2VGb3JTZWFyY2g6XG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBkZXNjcmlwdGlvbjogJ0ZvciBgL2AgYW5kIGA/YC4gT3ZlcnJpZGUgYGlnbm9yZUNhc2VGb3JTZWFyY2hgJ1xuICBpZ25vcmVDYXNlRm9yU2VhcmNoQ3VycmVudFdvcmQ6XG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBkZXNjcmlwdGlvbjogJ0ZvciBgKmAgYW5kIGAjYC4nXG4gIHVzZVNtYXJ0Y2FzZUZvclNlYXJjaEN1cnJlbnRXb3JkOlxuICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgZGVzY3JpcHRpb246ICdGb3IgYCpgIGFuZCBgI2AuIE92ZXJyaWRlIGBpZ25vcmVDYXNlRm9yU2VhcmNoQ3VycmVudFdvcmRgJ1xuICBoaWdobGlnaHRTZWFyY2g6IGZhbHNlXG4gIGhpZ2hsaWdodFNlYXJjaEV4Y2x1ZGVTY29wZXM6XG4gICAgZGVmYXVsdDogW11cbiAgICBpdGVtczogdHlwZTogJ3N0cmluZydcbiAgICBkZXNjcmlwdGlvbjogJ1N1cHByZXNzIGhpZ2hsaWdodFNlYXJjaCB3aGVuIGFueSBvZiB0aGVzZSBjbGFzc2VzIGFyZSBwcmVzZW50IGluIHRoZSBlZGl0b3InXG4gIGluY3JlbWVudGFsU2VhcmNoOiBmYWxzZVxuICBpbmNyZW1lbnRhbFNlYXJjaFZpc2l0RGlyZWN0aW9uOlxuICAgIGRlZmF1bHQ6ICdhYnNvbHV0ZSdcbiAgICBlbnVtOiBbJ2Fic29sdXRlJywgJ3JlbGF0aXZlJ11cbiAgICBkZXNjcmlwdGlvbjogXCJXaGV0aGVyICd2aXNpdC1uZXh0Jyh0YWIpIGFuZCAndmlzaXQtcHJldicoc2hpZnQtdGFiKSBkZXBlbmRzIG9uIHNlYXJjaCBkaXJlY3Rpb24oJy8nIG9yICc/JylcIlxuICBzdGF5T25UcmFuc2Zvcm1TdHJpbmc6XG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBkZXNjcmlwdGlvbjogXCJEb24ndCBtb3ZlIGN1cnNvciBhZnRlciBUcmFuc2Zvcm1TdHJpbmcgZS5nIHVwcGVyLWNhc2UsIHN1cnJvdW5kXCJcbiAgc3RheU9uWWFuazpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICAgIGRlc2NyaXB0aW9uOiBcIkRvbid0IG1vdmUgY3Vyc29yIGFmdGVyIHlhbmtcIlxuICBzdGF5T25EZWxldGU6XG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBkZXNjcmlwdGlvbjogXCJEb24ndCBtb3ZlIGN1cnNvciBhZnRlciB5YW5rXCJcbiAgZmxhc2hPblVuZG9SZWRvOiB0cnVlXG4gIGZsYXNoT25PcGVyYXRlOiB0cnVlXG4gIGZsYXNoT25PcGVyYXRlQmxhY2tsaXN0OlxuICAgIGRlZmF1bHQ6IFtdXG4gICAgaXRlbXM6IHR5cGU6ICdzdHJpbmcnXG4gICAgZGVzY3JpcHRpb246ICdjb21tYSBzZXBhcmF0ZWQgbGlzdCBvZiBvcGVyYXRvciBjbGFzcyBuYW1lIHRvIGRpc2FibGUgZmxhc2ggZS5nLiBcInlhbmssIGF1dG8taW5kZW50XCInXG4gIGZsYXNoT25TZWFyY2g6IHRydWVcbiAgZmxhc2hTY3JlZW5PblNlYXJjaEhhc05vTWF0Y2g6IHRydWVcbiAgc2hvd0hvdmVyT25PcGVyYXRlOiBmYWxzZVxuICBzaG93SG92ZXJPbk9wZXJhdGVJY29uOlxuICAgIGRlZmF1bHQ6ICdpY29uJ1xuICAgIGVudW06IFsnbm9uZScsICdpY29uJywgJ2Vtb2ppJ11cbiAgc2hvd0hvdmVyU2VhcmNoQ291bnRlcjogZmFsc2VcbiAgc2hvd0hvdmVyU2VhcmNoQ291bnRlckR1cmF0aW9uOlxuICAgIGRlZmF1bHQ6IDcwMFxuICAgIGRlc2NyaXB0aW9uOiBcIkR1cmF0aW9uKG1zZWMpIGZvciBob3ZlciBzZWFyY2ggY291bnRlclwiXG4gIGhpZGVUYWJCYXJPbk1heGltaXplUGFuZTogdHJ1ZVxuICBzbW9vdGhTY3JvbGxPbkZ1bGxTY3JvbGxNb3Rpb246XG4gICAgZGVmYXVsdDogZmFsc2VcbiAgICBkZXNjcmlwdGlvbjogXCJGb3IgYGN0cmwtZmAgYW5kIGBjdHJsLWJgXCJcbiAgc21vb3RoU2Nyb2xsT25GdWxsU2Nyb2xsTW90aW9uRHVyYXRpb246XG4gICAgZGVmYXVsdDogNTAwXG4gICAgZGVzY3JpcHRpb246IFwiU21vb3RoIHNjcm9sbCBkdXJhdGlvbiBpbiBtaWxsaXNlY29uZHMgZm9yIGBjdHJsLWZgIGFuZCBgY3RybC1iYFwiXG4gIHNtb290aFNjcm9sbE9uSGFsZlNjcm9sbE1vdGlvbjpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICAgIGRlc2NyaXB0aW9uOiBcIkZvciBgY3RybC1kYCBhbmQgYGN0cmwtdWBcIlxuICBzbW9vdGhTY3JvbGxPbkhhbGZTY3JvbGxNb3Rpb25EdXJhdGlvbjpcbiAgICBkZWZhdWx0OiA1MDBcbiAgICBkZXNjcmlwdGlvbjogXCJTbW9vdGggc2Nyb2xsIGR1cmF0aW9uIGluIG1pbGxpc2Vjb25kcyBmb3IgYGN0cmwtZGAgYW5kIGBjdHJsLXVgXCJcbiAgc3RhdHVzQmFyTW9kZVN0cmluZ1N0eWxlOlxuICAgIGRlZmF1bHQ6ICdzaG9ydCdcbiAgICBlbnVtOiBbJ3Nob3J0JywgJ2xvbmcnXVxuICB0aHJvd0Vycm9yT25Ob25FbXB0eVNlbGVjdGlvbkluTm9ybWFsTW9kZTpcbiAgICBkZWZhdWx0OiBmYWxzZVxuICAgIGRlc2NyaXB0aW9uOiBcIltEZXYgdXNlXSBUaHJvdyBlcnJvciB3aGVuIG5vbi1lbXB0eSBzZWxlY3Rpb24gd2FzIHJlbWFpbmVkIGluIG5vcm1hbC1tb2RlIGF0IHRoZSB0aW1pbmcgb2Ygb3BlcmF0aW9uIGZpbmlzaGVkXCJcbiJdfQ==
