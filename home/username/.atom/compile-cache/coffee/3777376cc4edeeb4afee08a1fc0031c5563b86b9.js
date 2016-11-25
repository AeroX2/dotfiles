(function() {
  var $, $$, MAX_ITEMS, SelectListView, View, _, fuzzaldrin, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('atom-space-pen-views'), SelectListView = ref.SelectListView, $ = ref.$, $$ = ref.$$;

  fuzzaldrin = require('fuzzaldrin');

  MAX_ITEMS = 5;

  module.exports = View = (function(superClass) {
    extend(View, superClass);

    function View() {
      return View.__super__.constructor.apply(this, arguments);
    }

    View.prototype.initialInput = null;

    View.prototype.schedulePopulateList = function() {
      if (this.initialInput) {
        if (this.isOnDom()) {
          this.populateList();
        }
        return this.initialInput = false;
      } else {
        return View.__super__.schedulePopulateList.apply(this, arguments);
      }
    };

    View.prototype.initialize = function() {
      this.setMaxItems(MAX_ITEMS);
      this.commands = require('./commands');
      this.addClass('vim-mode-plus-ex-mode');
      return View.__super__.initialize.apply(this, arguments);
    };

    View.prototype.getFilterKey = function() {
      return 'displayName';
    };

    View.prototype.cancelled = function() {
      return this.hide();
    };

    View.prototype.toggle = function(vimState, commandKind) {
      var ref1, ref2;
      this.vimState = vimState;
      this.commandKind = commandKind;
      if ((ref1 = this.panel) != null ? ref1.isVisible() : void 0) {
        return this.cancel();
      } else {
        ref2 = this.vimState, this.editorElement = ref2.editorElement, this.editor = ref2.editor;
        return this.show();
      }
    };

    View.prototype.show = function() {
      this.initialInput = true;
      this.count = null;
      this.storeFocusedElement();
      if (this.panel == null) {
        this.panel = atom.workspace.addModalPanel({
          item: this
        });
      }
      this.panel.show();
      this.setItems(this.getItemsFor(this.commandKind));
      return this.focusFilterEditor();
    };

    View.prototype.getItemsFor = function(kind) {
      var commands, humanize;
      commands = _.keys(this.commands[kind]);
      humanize = function(name) {
        return _.humanizeEventName(_.dasherize(name));
      };
      switch (kind) {
        case 'normalCommands':
          return commands.map(function(name) {
            return {
              name: name,
              displayName: name
            };
          });
        case 'toggleCommands':
        case 'numberCommands':
          return commands.map(function(name) {
            return {
              name: name,
              displayName: humanize(name)
            };
          });
      }
    };

    View.prototype.executeCommand = function(kind, name) {
      var action;
      action = this.commands[kind][name];
      return action(this.vimState, this.count);
    };

    View.prototype.hide = function() {
      var ref1;
      return (ref1 = this.panel) != null ? ref1.hide() : void 0;
    };

    View.prototype.getCommandKindFromQuery = function(query) {
      if (query.match(/^!/)) {
        return 'toggleCommands';
      } else if (query.match(/(\d+)(%)?$/)) {
        return 'numberCommands';
      } else {
        return null;
      }
    };

    View.prototype.getEmptyMessage = function(itemCount, filteredItemCount) {
      var filterQuery, items, number, percent, query, ref1;
      query = this.getFilterQuery();
      if (!(this.commandKind = this.getCommandKindFromQuery(query))) {
        return;
      }
      items = this.getItemsFor(this.commandKind);
      switch (this.commandKind) {
        case 'toggleCommands':
          filterQuery = query.slice(1);
          items = fuzzaldrin.filter(items, filterQuery, {
            key: this.getFilterKey()
          });
          break;
        case 'numberCommands':
          ref1 = query.match(/(\d+)(%)?$/).slice(1, 3), number = ref1[0], percent = ref1[1];
          this.count = Number(number);
          items = items.filter(function(arg) {
            var name;
            name = arg.name;
            if (percent != null) {
              return name === 'moveToLineByPercent';
            } else {
              return name === 'moveToLine';
            }
          });
      }
      this.setError(null);
      this.setFallbackItems(items);
      return this.selectItemView(this.list.find('li:first'));
    };

    View.prototype.setFallbackItems = function(items) {
      var i, item, itemView, len, results;
      results = [];
      for (i = 0, len = items.length; i < len; i++) {
        item = items[i];
        itemView = $(this.viewForItem(item));
        itemView.data('select-list-item', item);
        results.push(this.list.append(itemView));
      }
      return results;
    };

    View.prototype.viewForItem = function(arg) {
      var displayName, filterQuery, matches;
      displayName = arg.displayName;
      filterQuery = this.getFilterQuery();
      if (filterQuery.startsWith('!')) {
        filterQuery = filterQuery.slice(1);
      }
      matches = fuzzaldrin.match(displayName, filterQuery);
      return $$(function() {
        var highlighter;
        highlighter = (function(_this) {
          return function(command, matches, offsetIndex) {
            var i, lastIndex, len, matchIndex, matchedChars, unmatched;
            lastIndex = 0;
            matchedChars = [];
            for (i = 0, len = matches.length; i < len; i++) {
              matchIndex = matches[i];
              matchIndex -= offsetIndex;
              if (matchIndex < 0) {
                continue;
              }
              unmatched = command.substring(lastIndex, matchIndex);
              if (unmatched) {
                if (matchedChars.length) {
                  _this.span(matchedChars.join(''), {
                    "class": 'character-match'
                  });
                }
                matchedChars = [];
                _this.text(unmatched);
              }
              matchedChars.push(command[matchIndex]);
              lastIndex = matchIndex + 1;
            }
            if (matchedChars.length) {
              _this.span(matchedChars.join(''), {
                "class": 'character-match'
              });
            }
            return _this.text(command.substring(lastIndex));
          };
        })(this);
        return this.li({
          "class": 'event',
          'data-event-name': name
        }, (function(_this) {
          return function() {
            return _this.span({
              title: displayName
            }, function() {
              return highlighter(displayName, matches, 0);
            });
          };
        })(this));
      });
    };

    View.prototype.confirmed = function(arg) {
      var name;
      name = arg.name;
      this.cancel();
      return this.executeCommand(this.commandKind, name);
    };

    return View;

  })(SelectListView);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy1leC1tb2RlL2xpYi92aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMERBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUEwQixPQUFBLENBQVEsc0JBQVIsQ0FBMUIsRUFBQyxtQ0FBRCxFQUFpQixTQUFqQixFQUFvQjs7RUFDcEIsVUFBQSxHQUFhLE9BQUEsQ0FBUSxZQUFSOztFQUViLFNBQUEsR0FBWTs7RUFDWixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O21CQUNKLFlBQUEsR0FBYzs7bUJBR2Qsb0JBQUEsR0FBc0IsU0FBQTtNQUNwQixJQUFHLElBQUMsQ0FBQSxZQUFKO1FBQ0UsSUFBbUIsSUFBQyxDQUFBLE9BQUQsQ0FBQSxDQUFuQjtVQUFBLElBQUMsQ0FBQSxZQUFELENBQUEsRUFBQTs7ZUFDQSxJQUFDLENBQUEsWUFBRCxHQUFnQixNQUZsQjtPQUFBLE1BQUE7ZUFJRSxnREFBQSxTQUFBLEVBSkY7O0lBRG9COzttQkFPdEIsVUFBQSxHQUFZLFNBQUE7TUFDVixJQUFDLENBQUEsV0FBRCxDQUFhLFNBQWI7TUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZLE9BQUEsQ0FBUSxZQUFSO01BQ1osSUFBQyxDQUFBLFFBQUQsQ0FBVSx1QkFBVjthQUNBLHNDQUFBLFNBQUE7SUFKVTs7bUJBTVosWUFBQSxHQUFjLFNBQUE7YUFDWjtJQURZOzttQkFHZCxTQUFBLEdBQVcsU0FBQTthQUNULElBQUMsQ0FBQSxJQUFELENBQUE7SUFEUzs7bUJBR1gsTUFBQSxHQUFRLFNBQUMsUUFBRCxFQUFZLFdBQVo7QUFDTixVQUFBO01BRE8sSUFBQyxDQUFBLFdBQUQ7TUFBVyxJQUFDLENBQUEsY0FBRDtNQUNsQixzQ0FBUyxDQUFFLFNBQVIsQ0FBQSxVQUFIO2VBQ0Us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LFNBQUMsR0FBRDtBQUNULFVBQUE7TUFEVyxPQUFEO01BQ1YsSUFBQyxDQUFBLE1BQUQsQ0FBQTthQUNBLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQUMsQ0FBQSxXQUFqQixFQUE4QixJQUE5QjtJQUZTOzs7O0tBM0hNO0FBTm5CIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntTZWxlY3RMaXN0VmlldywgJCwgJCR9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5mdXp6YWxkcmluID0gcmVxdWlyZSAnZnV6emFsZHJpbidcblxuTUFYX0lURU1TID0gNVxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVmlldyBleHRlbmRzIFNlbGVjdExpc3RWaWV3XG4gIGluaXRpYWxJbnB1dDogbnVsbFxuXG4gICMgRGlzYWJsZSB0aHJvdHRsaW5nIHBvcHVsYXRlTGlzdCBmb3IgaW5pdGlhbElucHV0XG4gIHNjaGVkdWxlUG9wdWxhdGVMaXN0OiAtPlxuICAgIGlmIEBpbml0aWFsSW5wdXRcbiAgICAgIEBwb3B1bGF0ZUxpc3QoKSBpZiBAaXNPbkRvbSgpXG4gICAgICBAaW5pdGlhbElucHV0ID0gZmFsc2VcbiAgICBlbHNlXG4gICAgICBzdXBlclxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgQHNldE1heEl0ZW1zKE1BWF9JVEVNUylcbiAgICBAY29tbWFuZHMgPSByZXF1aXJlICcuL2NvbW1hbmRzJ1xuICAgIEBhZGRDbGFzcygndmltLW1vZGUtcGx1cy1leC1tb2RlJylcbiAgICBzdXBlclxuXG4gIGdldEZpbHRlcktleTogLT5cbiAgICAnZGlzcGxheU5hbWUnXG5cbiAgY2FuY2VsbGVkOiAtPlxuICAgIEBoaWRlKClcblxuICB0b2dnbGU6IChAdmltU3RhdGUsIEBjb21tYW5kS2luZCkgLT5cbiAgICBpZiBAcGFuZWw/LmlzVmlzaWJsZSgpXG4gICAgICBAY2FuY2VsKClcbiAgICBlbHNlXG4gICAgICB7QGVkaXRvckVsZW1lbnQsIEBlZGl0b3J9ID0gQHZpbVN0YXRlXG4gICAgICBAc2hvdygpXG5cbiAgc2hvdzogLT5cbiAgICBAaW5pdGlhbElucHV0ID0gdHJ1ZVxuICAgIEBjb3VudCA9IG51bGxcbiAgICBAc3RvcmVGb2N1c2VkRWxlbWVudCgpXG4gICAgQHBhbmVsID89IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoe2l0ZW06IHRoaXN9KVxuICAgIEBwYW5lbC5zaG93KClcbiAgICBAc2V0SXRlbXMoQGdldEl0ZW1zRm9yKEBjb21tYW5kS2luZCkpXG4gICAgQGZvY3VzRmlsdGVyRWRpdG9yKClcblxuICBnZXRJdGVtc0ZvcjogKGtpbmQpIC0+XG4gICAgY29tbWFuZHMgPSBfLmtleXMoQGNvbW1hbmRzW2tpbmRdKVxuICAgIGh1bWFuaXplID0gKG5hbWUpIC0+IF8uaHVtYW5pemVFdmVudE5hbWUoXy5kYXNoZXJpemUobmFtZSkpXG4gICAgc3dpdGNoIGtpbmRcbiAgICAgIHdoZW4gJ25vcm1hbENvbW1hbmRzJ1xuICAgICAgICBjb21tYW5kcy5tYXAgKG5hbWUpIC0+IHtuYW1lLCBkaXNwbGF5TmFtZTogbmFtZX1cbiAgICAgIHdoZW4gJ3RvZ2dsZUNvbW1hbmRzJywgJ251bWJlckNvbW1hbmRzJ1xuICAgICAgICBjb21tYW5kcy5tYXAgKG5hbWUpIC0+IHtuYW1lLCBkaXNwbGF5TmFtZTogaHVtYW5pemUobmFtZSl9XG5cbiAgZXhlY3V0ZUNvbW1hbmQ6IChraW5kLCBuYW1lKSAtPlxuICAgIGFjdGlvbiA9IEBjb21tYW5kc1traW5kXVtuYW1lXVxuICAgIGFjdGlvbihAdmltU3RhdGUsIEBjb3VudClcblxuICBoaWRlOiAtPlxuICAgIEBwYW5lbD8uaGlkZSgpXG5cbiAgZ2V0Q29tbWFuZEtpbmRGcm9tUXVlcnk6IChxdWVyeSkgLT5cbiAgICBpZiBxdWVyeS5tYXRjaCgvXiEvKVxuICAgICAgJ3RvZ2dsZUNvbW1hbmRzJ1xuICAgIGVsc2UgaWYgcXVlcnkubWF0Y2goLyhcXGQrKSglKT8kLylcbiAgICAgICdudW1iZXJDb21tYW5kcydcbiAgICBlbHNlXG4gICAgICBudWxsXG5cbiAgIyBVc2UgYXMgY29tbWFuZCBtaXNzaW5nIGhvb2suXG4gIGdldEVtcHR5TWVzc2FnZTogKGl0ZW1Db3VudCwgZmlsdGVyZWRJdGVtQ291bnQpIC0+XG4gICAgcXVlcnkgPSBAZ2V0RmlsdGVyUXVlcnkoKVxuICAgIHJldHVybiB1bmxlc3MgQGNvbW1hbmRLaW5kID0gQGdldENvbW1hbmRLaW5kRnJvbVF1ZXJ5KHF1ZXJ5KVxuXG4gICAgaXRlbXMgPSBAZ2V0SXRlbXNGb3IoQGNvbW1hbmRLaW5kKVxuICAgIHN3aXRjaCBAY29tbWFuZEtpbmRcbiAgICAgIHdoZW4gJ3RvZ2dsZUNvbW1hbmRzJ1xuICAgICAgICBmaWx0ZXJRdWVyeSA9IHF1ZXJ5WzEuLi5dICMgdG8gdHJpbSBmaXJzdCAnISdcbiAgICAgICAgaXRlbXMgPSBmdXp6YWxkcmluLmZpbHRlcihpdGVtcywgZmlsdGVyUXVlcnksIGtleTogQGdldEZpbHRlcktleSgpKVxuICAgICAgd2hlbiAnbnVtYmVyQ29tbWFuZHMnXG4gICAgICAgIFtudW1iZXIsIHBlcmNlbnRdID0gcXVlcnkubWF0Y2goLyhcXGQrKSglKT8kLylbMS4uMl1cbiAgICAgICAgQGNvdW50ID0gTnVtYmVyKG51bWJlcilcbiAgICAgICAgaXRlbXMgPSBpdGVtcy5maWx0ZXIgKHtuYW1lfSkgLT5cbiAgICAgICAgICBpZiBwZXJjZW50P1xuICAgICAgICAgICAgbmFtZSBpcyAnbW92ZVRvTGluZUJ5UGVyY2VudCdcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBuYW1lIGlzICdtb3ZlVG9MaW5lJ1xuXG4gICAgQHNldEVycm9yKG51bGwpXG4gICAgQHNldEZhbGxiYWNrSXRlbXMoaXRlbXMpXG4gICAgQHNlbGVjdEl0ZW1WaWV3KEBsaXN0LmZpbmQoJ2xpOmZpcnN0JykpXG5cbiAgc2V0RmFsbGJhY2tJdGVtczogKGl0ZW1zKSAtPlxuICAgIGZvciBpdGVtIGluIGl0ZW1zXG4gICAgICBpdGVtVmlldyA9ICQoQHZpZXdGb3JJdGVtKGl0ZW0pKVxuICAgICAgaXRlbVZpZXcuZGF0YSgnc2VsZWN0LWxpc3QtaXRlbScsIGl0ZW0pXG4gICAgICBAbGlzdC5hcHBlbmQoaXRlbVZpZXcpXG5cbiAgdmlld0Zvckl0ZW06ICh7ZGlzcGxheU5hbWV9KSAtPlxuICAgICMgY29uc29sZS5sb2cgZGlzcGxheU5hbWVcbiAgICAjIFN0eWxlIG1hdGNoZWQgY2hhcmFjdGVycyBpbiBzZWFyY2ggcmVzdWx0c1xuICAgIGZpbHRlclF1ZXJ5ID0gQGdldEZpbHRlclF1ZXJ5KClcbiAgICBmaWx0ZXJRdWVyeSA9IGZpbHRlclF1ZXJ5WzEuLl0gaWYgZmlsdGVyUXVlcnkuc3RhcnRzV2l0aCgnIScpXG5cbiAgICBtYXRjaGVzID0gZnV6emFsZHJpbi5tYXRjaChkaXNwbGF5TmFtZSwgZmlsdGVyUXVlcnkpXG4gICAgIyBjb25zb2xlLmxvZyBtYXRjaGVzXG4gICAgJCQgLT5cbiAgICAgIGhpZ2hsaWdodGVyID0gKGNvbW1hbmQsIG1hdGNoZXMsIG9mZnNldEluZGV4KSA9PlxuICAgICAgICBsYXN0SW5kZXggPSAwXG4gICAgICAgIG1hdGNoZWRDaGFycyA9IFtdICMgQnVpbGQgdXAgYSBzZXQgb2YgbWF0Y2hlZCBjaGFycyB0byBiZSBtb3JlIHNlbWFudGljXG5cbiAgICAgICAgZm9yIG1hdGNoSW5kZXggaW4gbWF0Y2hlc1xuICAgICAgICAgIG1hdGNoSW5kZXggLT0gb2Zmc2V0SW5kZXhcbiAgICAgICAgICBjb250aW51ZSBpZiBtYXRjaEluZGV4IDwgMCAjIElmIG1hcmtpbmcgdXAgdGhlIGJhc2VuYW1lLCBvbWl0IGNvbW1hbmQgbWF0Y2hlc1xuICAgICAgICAgIHVubWF0Y2hlZCA9IGNvbW1hbmQuc3Vic3RyaW5nKGxhc3RJbmRleCwgbWF0Y2hJbmRleClcbiAgICAgICAgICBpZiB1bm1hdGNoZWRcbiAgICAgICAgICAgIEBzcGFuIG1hdGNoZWRDaGFycy5qb2luKCcnKSwgY2xhc3M6ICdjaGFyYWN0ZXItbWF0Y2gnIGlmIG1hdGNoZWRDaGFycy5sZW5ndGhcbiAgICAgICAgICAgIG1hdGNoZWRDaGFycyA9IFtdXG4gICAgICAgICAgICBAdGV4dCB1bm1hdGNoZWRcbiAgICAgICAgICBtYXRjaGVkQ2hhcnMucHVzaChjb21tYW5kW21hdGNoSW5kZXhdKVxuICAgICAgICAgIGxhc3RJbmRleCA9IG1hdGNoSW5kZXggKyAxXG5cbiAgICAgICAgQHNwYW4gbWF0Y2hlZENoYXJzLmpvaW4oJycpLCBjbGFzczogJ2NoYXJhY3Rlci1tYXRjaCcgaWYgbWF0Y2hlZENoYXJzLmxlbmd0aFxuICAgICAgICAjIFJlbWFpbmluZyBjaGFyYWN0ZXJzIGFyZSBwbGFpbiB0ZXh0XG4gICAgICAgIEB0ZXh0IGNvbW1hbmQuc3Vic3RyaW5nKGxhc3RJbmRleClcblxuICAgICAgQGxpIGNsYXNzOiAnZXZlbnQnLCAnZGF0YS1ldmVudC1uYW1lJzogbmFtZSwgPT5cbiAgICAgICAgQHNwYW4gdGl0bGU6IGRpc3BsYXlOYW1lLCAtPiBoaWdobGlnaHRlcihkaXNwbGF5TmFtZSwgbWF0Y2hlcywgMClcblxuICBjb25maXJtZWQ6ICh7bmFtZX0pIC0+XG4gICAgQGNhbmNlbCgpXG4gICAgQGV4ZWN1dGVDb21tYW5kKEBjb21tYW5kS2luZCwgbmFtZSlcbiJdfQ==
