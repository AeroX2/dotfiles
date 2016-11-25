(function() {
  var $$$, TextEditorView, View, ref;

  ref = require('atom-space-pen-views'), $$$ = ref.$$$, View = ref.View, TextEditorView = ref.TextEditorView;

  module.exports = function() {
    return this.div({
      tabIndex: -1,
      "class": 'atomts-rename-view'
    }, (function(_this) {
      return function() {
        _this.div({
          "class": 'block'
        }, function() {
          return _this.div(function() {
            _this.span({
              outlet: 'title'
            }, function() {
              return 'Rename Variable';
            });
            return _this.span({
              "class": 'subtle-info-message'
            }, function() {
              _this.span('Close this panel with ');
              _this.span({
                "class": 'highlight'
              }, 'esc');
              _this.span(' key. And commit with the ');
              _this.span({
                "class": 'highlight'
              }, 'enter');
              return _this.span('key.');
            });
          });
        });
        _this.div({
          "class": 'find-container block'
        }, function() {
          return _this.div({
            "class": 'editor-container'
          }, function() {
            return _this.subview('newNameEditor', new TextEditorView({
              mini: true,
              placeholderText: 'new name'
            }));
          });
        });
        _this.div({
          outlet: 'fileCount'
        }, function() {});
        _this.br({});
        return _this.div({
          "class": 'highlight-error',
          style: 'display:none',
          outlet: 'validationMessage'
        });
      };
    })(this));
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvYXRvbS10eXBlc2NyaXB0L3ZpZXdzL3JlbmFtZVZpZXcuaHRtbC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQThCLE9BQUEsQ0FBUSxzQkFBUixDQUE5QixFQUFDLGFBQUQsRUFBTSxlQUFOLEVBQVk7O0VBRVosTUFBTSxDQUFDLE9BQVAsR0FDSSxTQUFBO1dBQ0ksSUFBQyxDQUFBLEdBQUQsQ0FBSztNQUFBLFFBQUEsRUFBVSxDQUFDLENBQVg7TUFBYyxDQUFBLEtBQUEsQ0FBQSxFQUFPLG9CQUFyQjtLQUFMLEVBQWdELENBQUEsU0FBQSxLQUFBO2FBQUEsU0FBQTtRQUM1QyxLQUFDLENBQUEsR0FBRCxDQUFLO1VBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxPQUFQO1NBQUwsRUFBcUIsU0FBQTtpQkFDakIsS0FBQyxDQUFBLEdBQUQsQ0FBSyxTQUFBO1lBQ0QsS0FBQyxDQUFBLElBQUQsQ0FBTTtjQUFDLE1BQUEsRUFBUSxPQUFUO2FBQU4sRUFBeUIsU0FBQTtxQkFBRztZQUFILENBQXpCO21CQUNBLEtBQUMsQ0FBQSxJQUFELENBQU07Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHFCQUFQO2FBQU4sRUFBb0MsU0FBQTtjQUNoQyxLQUFDLENBQUEsSUFBRCxDQUFNLHdCQUFOO2NBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTTtnQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLFdBQU47ZUFBTixFQUF5QixLQUF6QjtjQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sNEJBQU47Y0FDQSxLQUFDLENBQUEsSUFBRCxDQUFNO2dCQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sV0FBTjtlQUFOLEVBQXlCLE9BQXpCO3FCQUNBLEtBQUMsQ0FBQSxJQUFELENBQU0sTUFBTjtZQUxnQyxDQUFwQztVQUZDLENBQUw7UUFEaUIsQ0FBckI7UUFVQSxLQUFDLENBQUEsR0FBRCxDQUFLO1VBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxzQkFBUDtTQUFMLEVBQW9DLFNBQUE7aUJBQ2hDLEtBQUMsQ0FBQSxHQUFELENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGtCQUFQO1dBQUwsRUFBZ0MsU0FBQTttQkFDNUIsS0FBQyxDQUFBLE9BQUQsQ0FBUyxlQUFULEVBQThCLElBQUEsY0FBQSxDQUFlO2NBQUEsSUFBQSxFQUFNLElBQU47Y0FBWSxlQUFBLEVBQWlCLFVBQTdCO2FBQWYsQ0FBOUI7VUFENEIsQ0FBaEM7UUFEZ0MsQ0FBcEM7UUFJQSxLQUFDLENBQUEsR0FBRCxDQUFLO1VBQUMsTUFBQSxFQUFPLFdBQVI7U0FBTCxFQUEyQixTQUFBLEdBQUEsQ0FBM0I7UUFDQSxLQUFDLENBQUEsRUFBRCxDQUFJLEVBQUo7ZUFDQSxLQUFDLENBQUEsR0FBRCxDQUFLO1VBQUMsQ0FBQSxLQUFBLENBQUEsRUFBTyxpQkFBUjtVQUEyQixLQUFBLEVBQU0sY0FBakM7VUFBaUQsTUFBQSxFQUFPLG1CQUF4RDtTQUFMO01BakI0QztJQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBaEQ7RUFESjtBQUhKIiwic291cmNlc0NvbnRlbnQiOlsieyQkJCwgVmlldywgVGV4dEVkaXRvclZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgICAtPlxuICAgICAgICBAZGl2IHRhYkluZGV4OiAtMSwgY2xhc3M6ICdhdG9tdHMtcmVuYW1lLXZpZXcnLCA9PlxuICAgICAgICAgICAgQGRpdiBjbGFzczogJ2Jsb2NrJywgPT5cbiAgICAgICAgICAgICAgICBAZGl2ID0+XG4gICAgICAgICAgICAgICAgICAgIEBzcGFuIHtvdXRsZXQ6ICd0aXRsZSd9LCA9PiAnUmVuYW1lIFZhcmlhYmxlJ1xuICAgICAgICAgICAgICAgICAgICBAc3BhbiBjbGFzczogJ3N1YnRsZS1pbmZvLW1lc3NhZ2UnLCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQHNwYW4gJ0Nsb3NlIHRoaXMgcGFuZWwgd2l0aCAnXG4gICAgICAgICAgICAgICAgICAgICAgICBAc3BhbiBjbGFzczonaGlnaGxpZ2h0JywgJ2VzYydcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzcGFuICcga2V5LiBBbmQgY29tbWl0IHdpdGggdGhlICdcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzcGFuIGNsYXNzOidoaWdobGlnaHQnLCAnZW50ZXInXG4gICAgICAgICAgICAgICAgICAgICAgICBAc3BhbiAna2V5LidcblxuICAgICAgICAgICAgQGRpdiBjbGFzczogJ2ZpbmQtY29udGFpbmVyIGJsb2NrJywgPT5cbiAgICAgICAgICAgICAgICBAZGl2IGNsYXNzOiAnZWRpdG9yLWNvbnRhaW5lcicsID0+XG4gICAgICAgICAgICAgICAgICAgIEBzdWJ2aWV3ICduZXdOYW1lRWRpdG9yJywgbmV3IFRleHRFZGl0b3JWaWV3KG1pbmk6IHRydWUsIHBsYWNlaG9sZGVyVGV4dDogJ25ldyBuYW1lJylcblxuICAgICAgICAgICAgQGRpdiB7b3V0bGV0OidmaWxlQ291bnQnfSwgPT4gcmV0dXJuXG4gICAgICAgICAgICBAYnIge31cbiAgICAgICAgICAgIEBkaXYge2NsYXNzOiAnaGlnaGxpZ2h0LWVycm9yJywgc3R5bGU6J2Rpc3BsYXk6bm9uZScsIG91dGxldDondmFsaWRhdGlvbk1lc3NhZ2UnfSxcbiJdfQ==
