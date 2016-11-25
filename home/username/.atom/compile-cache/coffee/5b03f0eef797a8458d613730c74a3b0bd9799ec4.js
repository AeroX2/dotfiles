(function() {
  var EditorLinter, LinterRegistry, Validators;

  LinterRegistry = require('../lib/linter-registry');

  EditorLinter = require('../lib/editor-linter');

  Validators = require('../lib/validate');

  module.exports = {
    wait: function(timeout) {
      return new Promise(function(resolve) {
        return setTimeout(resolve, timeout);
      });
    },
    getLinter: function() {
      return {
        grammarScopes: ['*'],
        lintOnFly: false,
        scope: 'project',
        lint: function() {}
      };
    },
    getMessage: function(type, filePath, range) {
      var message;
      message = {
        type: type,
        text: 'Some Message',
        filePath: filePath,
        range: range
      };
      Validators.messages([message], {
        name: 'Some Linter'
      });
      return message;
    },
    getLinterRegistry: function() {
      var editorLinter, linter, linterRegistry;
      linterRegistry = new LinterRegistry;
      editorLinter = new EditorLinter(atom.workspace.getActiveTextEditor());
      linter = {
        grammarScopes: ['*'],
        lintOnFly: false,
        scope: 'project',
        lint: function() {
          return [
            {
              type: 'Error',
              text: 'Something'
            }
          ];
        }
      };
      linterRegistry.addLinter(linter);
      return {
        linterRegistry: linterRegistry,
        editorLinter: editorLinter,
        linter: linter
      };
    },
    trigger: function(el, name) {
      var event;
      event = document.createEvent('HTMLEvents');
      event.initEvent(name, true, false);
      return el.dispatchEvent(event);
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvY29tbW9uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsY0FBQSxHQUFpQixPQUFBLENBQVEsd0JBQVI7O0VBQ2pCLFlBQUEsR0FBZSxPQUFBLENBQVEsc0JBQVI7O0VBQ2YsVUFBQSxHQUFhLE9BQUEsQ0FBUSxpQkFBUjs7RUFFYixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsSUFBQSxFQUFNLFNBQUMsT0FBRDtBQUNKLGFBQVcsSUFBQSxPQUFBLENBQVEsU0FBQyxPQUFEO2VBQ2pCLFVBQUEsQ0FBVyxPQUFYLEVBQW9CLE9BQXBCO01BRGlCLENBQVI7SUFEUCxDQUFOO0lBR0EsU0FBQSxFQUFXLFNBQUE7QUFDVCxhQUFPO1FBQUMsYUFBQSxFQUFlLENBQUMsR0FBRCxDQUFoQjtRQUF1QixTQUFBLEVBQVcsS0FBbEM7UUFBeUMsS0FBQSxFQUFPLFNBQWhEO1FBQTJELElBQUEsRUFBTSxTQUFBLEdBQUEsQ0FBakU7O0lBREUsQ0FIWDtJQUtBLFVBQUEsRUFBWSxTQUFDLElBQUQsRUFBTyxRQUFQLEVBQWlCLEtBQWpCO0FBQ1YsVUFBQTtNQUFBLE9BQUEsR0FBVTtRQUFDLE1BQUEsSUFBRDtRQUFPLElBQUEsRUFBTSxjQUFiO1FBQTZCLFVBQUEsUUFBN0I7UUFBdUMsT0FBQSxLQUF2Qzs7TUFDVixVQUFVLENBQUMsUUFBWCxDQUFvQixDQUFDLE9BQUQsQ0FBcEIsRUFBK0I7UUFBQyxJQUFBLEVBQU0sYUFBUDtPQUEvQjtBQUNBLGFBQU87SUFIRyxDQUxaO0lBU0EsaUJBQUEsRUFBbUIsU0FBQTtBQUNqQixVQUFBO01BQUEsY0FBQSxHQUFpQixJQUFJO01BQ3JCLFlBQUEsR0FBbUIsSUFBQSxZQUFBLENBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQWI7TUFDbkIsTUFBQSxHQUFTO1FBQ1AsYUFBQSxFQUFlLENBQUMsR0FBRCxDQURSO1FBRVAsU0FBQSxFQUFXLEtBRko7UUFHUCxLQUFBLEVBQU8sU0FIQTtRQUlQLElBQUEsRUFBTSxTQUFBO0FBQUcsaUJBQU87WUFBQztjQUFDLElBQUEsRUFBTSxPQUFQO2NBQWdCLElBQUEsRUFBTSxXQUF0QjthQUFEOztRQUFWLENBSkM7O01BTVQsY0FBYyxDQUFDLFNBQWYsQ0FBeUIsTUFBekI7QUFDQSxhQUFPO1FBQUMsZ0JBQUEsY0FBRDtRQUFpQixjQUFBLFlBQWpCO1FBQStCLFFBQUEsTUFBL0I7O0lBVlUsQ0FUbkI7SUFvQkEsT0FBQSxFQUFTLFNBQUMsRUFBRCxFQUFLLElBQUw7QUFDUCxVQUFBO01BQUEsS0FBQSxHQUFRLFFBQVEsQ0FBQyxXQUFULENBQXFCLFlBQXJCO01BQ1IsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsSUFBaEIsRUFBc0IsSUFBdEIsRUFBNEIsS0FBNUI7YUFDQSxFQUFFLENBQUMsYUFBSCxDQUFpQixLQUFqQjtJQUhPLENBcEJUOztBQUxGIiwic291cmNlc0NvbnRlbnQiOlsiTGludGVyUmVnaXN0cnkgPSByZXF1aXJlKCcuLi9saWIvbGludGVyLXJlZ2lzdHJ5JylcbkVkaXRvckxpbnRlciA9IHJlcXVpcmUoJy4uL2xpYi9lZGl0b3ItbGludGVyJylcblZhbGlkYXRvcnMgPSByZXF1aXJlKCcuLi9saWIvdmFsaWRhdGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gIHdhaXQ6ICh0aW1lb3V0KSAtPlxuICAgIHJldHVybiBuZXcgUHJvbWlzZSAocmVzb2x2ZSkgLT5cbiAgICAgIHNldFRpbWVvdXQocmVzb2x2ZSwgdGltZW91dClcbiAgZ2V0TGludGVyOiAtPlxuICAgIHJldHVybiB7Z3JhbW1hclNjb3BlczogWycqJ10sIGxpbnRPbkZseTogZmFsc2UsIHNjb3BlOiAncHJvamVjdCcsIGxpbnQ6IC0+IH1cbiAgZ2V0TWVzc2FnZTogKHR5cGUsIGZpbGVQYXRoLCByYW5nZSkgLT5cbiAgICBtZXNzYWdlID0ge3R5cGUsIHRleHQ6ICdTb21lIE1lc3NhZ2UnLCBmaWxlUGF0aCwgcmFuZ2V9XG4gICAgVmFsaWRhdG9ycy5tZXNzYWdlcyhbbWVzc2FnZV0sIHtuYW1lOiAnU29tZSBMaW50ZXInfSlcbiAgICByZXR1cm4gbWVzc2FnZVxuICBnZXRMaW50ZXJSZWdpc3RyeTogLT5cbiAgICBsaW50ZXJSZWdpc3RyeSA9IG5ldyBMaW50ZXJSZWdpc3RyeVxuICAgIGVkaXRvckxpbnRlciA9IG5ldyBFZGl0b3JMaW50ZXIoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKVxuICAgIGxpbnRlciA9IHtcbiAgICAgIGdyYW1tYXJTY29wZXM6IFsnKiddXG4gICAgICBsaW50T25GbHk6IGZhbHNlXG4gICAgICBzY29wZTogJ3Byb2plY3QnXG4gICAgICBsaW50OiAtPiByZXR1cm4gW3t0eXBlOiAnRXJyb3InLCB0ZXh0OiAnU29tZXRoaW5nJ31dXG4gICAgfVxuICAgIGxpbnRlclJlZ2lzdHJ5LmFkZExpbnRlcihsaW50ZXIpXG4gICAgcmV0dXJuIHtsaW50ZXJSZWdpc3RyeSwgZWRpdG9yTGludGVyLCBsaW50ZXJ9XG4gIHRyaWdnZXI6IChlbCwgbmFtZSkgLT5cbiAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdIVE1MRXZlbnRzJylcbiAgICBldmVudC5pbml0RXZlbnQobmFtZSwgdHJ1ZSwgZmFsc2UpXG4gICAgZWwuZGlzcGF0Y2hFdmVudChldmVudClcbiJdfQ==
