(function() {
  describe('validate', function() {
    var getLinter, validate;
    validate = require('../lib/validate');
    getLinter = require('./common').getLinter;
    describe('::linter', function() {
      it('throws error if grammarScopes is not an array', function() {
        return expect(function() {
          var linter;
          linter = getLinter();
          linter.grammarScopes = false;
          return validate.linter(linter);
        }).toThrow('grammarScopes is not an Array. Got: false');
      });
      it('throws if lint is missing', function() {
        return expect(function() {
          var linter;
          linter = getLinter();
          delete linter.lint;
          return validate.linter(linter);
        }).toThrow();
      });
      it('throws if lint is not a function', function() {
        return expect(function() {
          var linter;
          linter = getLinter();
          linter.lint = 'woah';
          return validate.linter(linter);
        }).toThrow();
      });
      it('works well with name attribute', function() {
        var linter;
        expect(function() {
          var linter;
          linter = getLinter();
          linter.name = 1;
          return validate.linter(linter);
        }).toThrow('Linter.name must be a string');
        linter = getLinter();
        linter.name = null;
        return validate.linter(linter);
      });
      it('works well with scope attribute', function() {
        var linter;
        expect(function() {
          var linter;
          linter = getLinter();
          linter.scope = null;
          return validate.linter(linter);
        }).toThrow('Linter.scope must be either `file` or `project`');
        expect(function() {
          var linter;
          linter = getLinter();
          linter.scope = 'a';
          return validate.linter(linter);
        }).toThrow('Linter.scope must be either `file` or `project`');
        linter = getLinter();
        linter.scope = 'Project';
        return validate.linter(linter);
      });
      return it('works overall', function() {
        validate.linter(getLinter());
        return expect(true).toBe(true);
      });
    });
    return describe('::messages', function() {
      it('throws if messages is not an array', function() {
        expect(function() {
          return validate.messages();
        }).toThrow('Expected messages to be array, provided: undefined');
        return expect(function() {
          return validate.messages(true);
        }).toThrow('Expected messages to be array, provided: boolean');
      });
      it('throws if type field is not present', function() {
        return expect(function() {
          return validate.messages([{}], {
            name: ''
          });
        }).toThrow();
      });
      it('throws if type field is invalid', function() {
        return expect(function() {
          return validate.messages([
            {
              type: 1
            }
          ], {
            name: ''
          });
        }).toThrow();
      });
      it("throws if there's no html/text field on message", function() {
        return expect(function() {
          return validate.messages([
            {
              type: 'Error'
            }
          ], {
            name: ''
          });
        }).toThrow();
      });
      it('throws if html/text is invalid', function() {
        expect(function() {
          return validate.messages([
            {
              type: 'Error',
              html: 1
            }
          ], {
            name: ''
          });
        }).toThrow();
        expect(function() {
          return validate.messages([
            {
              type: 'Error',
              text: 1
            }
          ], {
            name: ''
          });
        }).toThrow();
        expect(function() {
          return validate.messages([
            {
              type: 'Error',
              html: false
            }
          ], {
            name: ''
          });
        }).toThrow();
        expect(function() {
          return validate.messages([
            {
              type: 'Error',
              text: false
            }
          ], {
            name: ''
          });
        }).toThrow();
        expect(function() {
          return validate.messages([
            {
              type: 'Error',
              html: []
            }
          ], {
            name: ''
          });
        }).toThrow();
        return expect(function() {
          return validate.messages([
            {
              type: 'Error',
              text: []
            }
          ], {
            name: ''
          });
        }).toThrow();
      });
      it('throws if trace is invalid', function() {
        expect(function() {
          return validate.messages([
            {
              type: 'Error',
              html: 'a',
              trace: 1
            }
          ], {
            name: ''
          });
        }).toThrow();
        return validate.messages([
          {
            type: 'Error',
            html: 'a',
            trace: false
          }
        ], {
          name: ''
        });
      });
      it('throws if class is invalid', function() {
        expect(function() {
          return validate.messages([
            {
              type: 'Error',
              text: 'Well',
              "class": 1
            }
          ], {
            name: ''
          });
        }).toThrow();
        expect(function() {
          return validate.messages([
            {
              type: 'Error',
              text: 'Well',
              "class": []
            }
          ], {
            name: ''
          });
        }).toThrow();
        return validate.messages([
          {
            type: 'Error',
            text: 'Well',
            "class": 'error'
          }
        ], {
          name: ''
        });
      });
      it('throws if filePath is invalid', function() {
        expect(function() {
          return validate.messages([
            {
              type: 'Error',
              text: 'Well',
              "class": 'error',
              filePath: 1
            }
          ], {
            name: ''
          });
        }).toThrow();
        return validate.messages([
          {
            type: 'Error',
            text: 'Well',
            "class": 'error',
            filePath: '/'
          }
        ], {
          name: ''
        });
      });
      return it('throws if both text and html are provided', function() {
        expect(function() {
          return validate.messages([
            {
              type: 'Error',
              text: 'Well',
              html: 'a',
              "class": 'error',
              filePath: '/'
            }
          ], {
            name: ''
          });
        }).toThrow();
        validate.messages([
          {
            type: 'Error',
            text: 'Well',
            "class": 'error',
            filePath: '/'
          }
        ], {
          name: ''
        });
        validate.messages([
          {
            type: 'Error',
            html: 'Well',
            "class": 'error',
            filePath: '/'
          }
        ], {
          name: ''
        });
        return validate.messages([
          {
            type: 'Error',
            html: document.createElement('div'),
            "class": 'error',
            filePath: '/'
          }
        ], {
          name: ''
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvdmFsaWRhdGUtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxRQUFBLENBQVMsVUFBVCxFQUFxQixTQUFBO0FBQ25CLFFBQUE7SUFBQSxRQUFBLEdBQVcsT0FBQSxDQUFRLGlCQUFSO0lBQ1YsWUFBYSxPQUFBLENBQVEsVUFBUjtJQUNkLFFBQUEsQ0FBUyxVQUFULEVBQXFCLFNBQUE7TUFDbkIsRUFBQSxDQUFHLCtDQUFILEVBQW9ELFNBQUE7ZUFDbEQsTUFBQSxDQUFPLFNBQUE7QUFDTCxjQUFBO1VBQUEsTUFBQSxHQUFTLFNBQUEsQ0FBQTtVQUNULE1BQU0sQ0FBQyxhQUFQLEdBQXVCO2lCQUN2QixRQUFRLENBQUMsTUFBVCxDQUFnQixNQUFoQjtRQUhLLENBQVAsQ0FJQSxDQUFDLE9BSkQsQ0FJUywyQ0FKVDtNQURrRCxDQUFwRDtNQU1BLEVBQUEsQ0FBRywyQkFBSCxFQUFnQyxTQUFBO2VBQzlCLE1BQUEsQ0FBTyxTQUFBO0FBQ0wsY0FBQTtVQUFBLE1BQUEsR0FBUyxTQUFBLENBQUE7VUFDVCxPQUFPLE1BQU0sQ0FBQztpQkFDZCxRQUFRLENBQUMsTUFBVCxDQUFnQixNQUFoQjtRQUhLLENBQVAsQ0FJQSxDQUFDLE9BSkQsQ0FBQTtNQUQ4QixDQUFoQztNQU1BLEVBQUEsQ0FBRyxrQ0FBSCxFQUF1QyxTQUFBO2VBQ3JDLE1BQUEsQ0FBTyxTQUFBO0FBQ0wsY0FBQTtVQUFBLE1BQUEsR0FBUyxTQUFBLENBQUE7VUFDVCxNQUFNLENBQUMsSUFBUCxHQUFjO2lCQUNkLFFBQVEsQ0FBQyxNQUFULENBQWdCLE1BQWhCO1FBSEssQ0FBUCxDQUlBLENBQUMsT0FKRCxDQUFBO01BRHFDLENBQXZDO01BTUEsRUFBQSxDQUFHLGdDQUFILEVBQXFDLFNBQUE7QUFDbkMsWUFBQTtRQUFBLE1BQUEsQ0FBTyxTQUFB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Q0EsUUFBUSxDQUFDLFFBQVQsQ0FBa0I7VUFBQztZQUFDLElBQUEsRUFBTSxPQUFQO1lBQWdCLElBQUEsRUFBTSxNQUF0QjtZQUE4QixDQUFBLEtBQUEsQ0FBQSxFQUFPLE9BQXJDO1lBQThDLFFBQUEsRUFBVSxHQUF4RDtXQUFEO1NBQWxCLEVBQWtGO1VBQUMsSUFBQSxFQUFNLEVBQVA7U0FBbEY7ZUFDQSxRQUFRLENBQUMsUUFBVCxDQUFrQjtVQUFDO1lBQUMsSUFBQSxFQUFNLE9BQVA7WUFBZ0IsSUFBQSxFQUFNLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCLENBQXRCO1lBQXFELENBQUEsS0FBQSxDQUFBLEVBQU8sT0FBNUQ7WUFBcUUsUUFBQSxFQUFVLEdBQS9FO1dBQUQ7U0FBbEIsRUFBeUc7VUFBQyxJQUFBLEVBQU0sRUFBUDtTQUF6RztNQU44QyxDQUFoRDtJQXpEcUIsQ0FBdkI7RUFqRG1CLENBQXJCO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJkZXNjcmliZSAndmFsaWRhdGUnLCAtPlxuICB2YWxpZGF0ZSA9IHJlcXVpcmUoJy4uL2xpYi92YWxpZGF0ZScpXG4gIHtnZXRMaW50ZXJ9ID0gcmVxdWlyZSgnLi9jb21tb24nKVxuICBkZXNjcmliZSAnOjpsaW50ZXInLCAtPlxuICAgIGl0ICd0aHJvd3MgZXJyb3IgaWYgZ3JhbW1hclNjb3BlcyBpcyBub3QgYW4gYXJyYXknLCAtPlxuICAgICAgZXhwZWN0IC0+XG4gICAgICAgIGxpbnRlciA9IGdldExpbnRlcigpXG4gICAgICAgIGxpbnRlci5ncmFtbWFyU2NvcGVzID0gZmFsc2VcbiAgICAgICAgdmFsaWRhdGUubGludGVyKGxpbnRlcilcbiAgICAgIC50b1Rocm93KCdncmFtbWFyU2NvcGVzIGlzIG5vdCBhbiBBcnJheS4gR290OiBmYWxzZScpXG4gICAgaXQgJ3Rocm93cyBpZiBsaW50IGlzIG1pc3NpbmcnLCAtPlxuICAgICAgZXhwZWN0IC0+XG4gICAgICAgIGxpbnRlciA9IGdldExpbnRlcigpXG4gICAgICAgIGRlbGV0ZSBsaW50ZXIubGludFxuICAgICAgICB2YWxpZGF0ZS5saW50ZXIobGludGVyKVxuICAgICAgLnRvVGhyb3coKVxuICAgIGl0ICd0aHJvd3MgaWYgbGludCBpcyBub3QgYSBmdW5jdGlvbicsIC0+XG4gICAgICBleHBlY3QgLT5cbiAgICAgICAgbGludGVyID0gZ2V0TGludGVyKClcbiAgICAgICAgbGludGVyLmxpbnQgPSAnd29haCdcbiAgICAgICAgdmFsaWRhdGUubGludGVyKGxpbnRlcilcbiAgICAgIC50b1Rocm93KClcbiAgICBpdCAnd29ya3Mgd2VsbCB3aXRoIG5hbWUgYXR0cmlidXRlJywgLT5cbiAgICAgIGV4cGVjdCAtPlxuICAgICAgICBsaW50ZXIgPSBnZXRMaW50ZXIoKVxuICAgICAgICBsaW50ZXIubmFtZSA9IDFcbiAgICAgICAgdmFsaWRhdGUubGludGVyKGxpbnRlcilcbiAgICAgIC50b1Rocm93KCdMaW50ZXIubmFtZSBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICAgIGxpbnRlciA9IGdldExpbnRlcigpXG4gICAgICBsaW50ZXIubmFtZSA9IG51bGxcbiAgICAgIHZhbGlkYXRlLmxpbnRlcihsaW50ZXIpXG4gICAgaXQgJ3dvcmtzIHdlbGwgd2l0aCBzY29wZSBhdHRyaWJ1dGUnLCAtPlxuICAgICAgZXhwZWN0IC0+XG4gICAgICAgIGxpbnRlciA9IGdldExpbnRlcigpXG4gICAgICAgIGxpbnRlci5zY29wZSA9IG51bGxcbiAgICAgICAgdmFsaWRhdGUubGludGVyKGxpbnRlcilcbiAgICAgIC50b1Rocm93KCdMaW50ZXIuc2NvcGUgbXVzdCBiZSBlaXRoZXIgYGZpbGVgIG9yIGBwcm9qZWN0YCcpXG4gICAgICBleHBlY3QgLT5cbiAgICAgICAgbGludGVyID0gZ2V0TGludGVyKClcbiAgICAgICAgbGludGVyLnNjb3BlID0gJ2EnXG4gICAgICAgIHZhbGlkYXRlLmxpbnRlcihsaW50ZXIpXG4gICAgICAudG9UaHJvdygnTGludGVyLnNjb3BlIG11c3QgYmUgZWl0aGVyIGBmaWxlYCBvciBgcHJvamVjdGAnKVxuICAgICAgbGludGVyID0gZ2V0TGludGVyKClcbiAgICAgIGxpbnRlci5zY29wZSA9ICdQcm9qZWN0J1xuICAgICAgdmFsaWRhdGUubGludGVyKGxpbnRlcilcbiAgICBpdCAnd29ya3Mgb3ZlcmFsbCcsIC0+XG4gICAgICB2YWxpZGF0ZS5saW50ZXIoZ2V0TGludGVyKCkpXG4gICAgICBleHBlY3QodHJ1ZSkudG9CZSh0cnVlKVxuXG4gIGRlc2NyaWJlICc6Om1lc3NhZ2VzJywgLT5cbiAgICBpdCAndGhyb3dzIGlmIG1lc3NhZ2VzIGlzIG5vdCBhbiBhcnJheScsIC0+XG4gICAgICBleHBlY3QgLT5cbiAgICAgICAgdmFsaWRhdGUubWVzc2FnZXMoKVxuICAgICAgLnRvVGhyb3coJ0V4cGVjdGVkIG1lc3NhZ2VzIHRvIGJlIGFycmF5LCBwcm92aWRlZDogdW5kZWZpbmVkJylcbiAgICAgIGV4cGVjdCAtPlxuICAgICAgICB2YWxpZGF0ZS5tZXNzYWdlcyh0cnVlKVxuICAgICAgLnRvVGhyb3coJ0V4cGVjdGVkIG1lc3NhZ2VzIHRvIGJlIGFycmF5LCBwcm92aWRlZDogYm9vbGVhbicpXG4gICAgaXQgJ3Rocm93cyBpZiB0eXBlIGZpZWxkIGlzIG5vdCBwcmVzZW50JywgLT5cbiAgICAgIGV4cGVjdCAtPlxuICAgICAgICB2YWxpZGF0ZS5tZXNzYWdlcyhbe31dLCB7bmFtZTogJyd9KVxuICAgICAgLnRvVGhyb3coKVxuICAgIGl0ICd0aHJvd3MgaWYgdHlwZSBmaWVsZCBpcyBpbnZhbGlkJywgLT5cbiAgICAgIGV4cGVjdCAtPlxuICAgICAgICB2YWxpZGF0ZS5tZXNzYWdlcyhbe3R5cGU6IDF9XSwge25hbWU6ICcnfSlcbiAgICAgIC50b1Rocm93KClcbiAgICBpdCBcInRocm93cyBpZiB0aGVyZSdzIG5vIGh0bWwvdGV4dCBmaWVsZCBvbiBtZXNzYWdlXCIsIC0+XG4gICAgICBleHBlY3QgLT5cbiAgICAgICAgdmFsaWRhdGUubWVzc2FnZXMoW3t0eXBlOiAnRXJyb3InfV0sIHtuYW1lOiAnJ30pXG4gICAgICAudG9UaHJvdygpXG4gICAgaXQgJ3Rocm93cyBpZiBodG1sL3RleHQgaXMgaW52YWxpZCcsIC0+XG4gICAgICBleHBlY3QgLT5cbiAgICAgICAgdmFsaWRhdGUubWVzc2FnZXMoW3t0eXBlOiAnRXJyb3InLCBodG1sOiAxfV0sIHtuYW1lOiAnJ30pXG4gICAgICAudG9UaHJvdygpXG4gICAgICBleHBlY3QgLT5cbiAgICAgICAgdmFsaWRhdGUubWVzc2FnZXMoW3t0eXBlOiAnRXJyb3InLCB0ZXh0OiAxfV0sIHtuYW1lOiAnJ30pXG4gICAgICAudG9UaHJvdygpXG4gICAgICBleHBlY3QgLT5cbiAgICAgICAgdmFsaWRhdGUubWVzc2FnZXMoW3t0eXBlOiAnRXJyb3InLCBodG1sOiBmYWxzZX1dLCB7bmFtZTogJyd9KVxuICAgICAgLnRvVGhyb3coKVxuICAgICAgZXhwZWN0IC0+XG4gICAgICAgIHZhbGlkYXRlLm1lc3NhZ2VzKFt7dHlwZTogJ0Vycm9yJywgdGV4dDogZmFsc2V9XSwge25hbWU6ICcnfSlcbiAgICAgIC50b1Rocm93KClcbiAgICAgIGV4cGVjdCAtPlxuICAgICAgICB2YWxpZGF0ZS5tZXNzYWdlcyhbe3R5cGU6ICdFcnJvcicsIGh0bWw6IFtdfV0sIHtuYW1lOiAnJ30pXG4gICAgICAudG9UaHJvdygpXG4gICAgICBleHBlY3QgLT5cbiAgICAgICAgdmFsaWRhdGUubWVzc2FnZXMoW3t0eXBlOiAnRXJyb3InLCB0ZXh0OiBbXX1dLCB7bmFtZTogJyd9KVxuICAgICAgLnRvVGhyb3coKVxuICAgIGl0ICd0aHJvd3MgaWYgdHJhY2UgaXMgaW52YWxpZCcsIC0+XG4gICAgICBleHBlY3QgLT5cbiAgICAgICAgdmFsaWRhdGUubWVzc2FnZXMoW3t0eXBlOiAnRXJyb3InLCBodG1sOiAnYScsIHRyYWNlOiAxfV0sIHtuYW1lOiAnJ30pXG4gICAgICAudG9UaHJvdygpXG4gICAgICB2YWxpZGF0ZS5tZXNzYWdlcyhbe3R5cGU6ICdFcnJvcicsIGh0bWw6ICdhJywgdHJhY2U6IGZhbHNlfV0sIHtuYW1lOiAnJ30pXG4gICAgaXQgJ3Rocm93cyBpZiBjbGFzcyBpcyBpbnZhbGlkJywgLT5cbiAgICAgIGV4cGVjdCAtPlxuICAgICAgICB2YWxpZGF0ZS5tZXNzYWdlcyhbe3R5cGU6ICdFcnJvcicsIHRleHQ6ICdXZWxsJywgY2xhc3M6IDF9XSwge25hbWU6ICcnfSlcbiAgICAgIC50b1Rocm93KClcbiAgICAgIGV4cGVjdCAtPlxuICAgICAgICB2YWxpZGF0ZS5tZXNzYWdlcyhbe3R5cGU6ICdFcnJvcicsIHRleHQ6ICdXZWxsJywgY2xhc3M6IFtdfV0sIHtuYW1lOiAnJ30pXG4gICAgICAudG9UaHJvdygpXG4gICAgICB2YWxpZGF0ZS5tZXNzYWdlcyhbe3R5cGU6ICdFcnJvcicsIHRleHQ6ICdXZWxsJywgY2xhc3M6ICdlcnJvcid9XSwge25hbWU6ICcnfSlcbiAgICBpdCAndGhyb3dzIGlmIGZpbGVQYXRoIGlzIGludmFsaWQnLCAtPlxuICAgICAgZXhwZWN0IC0+XG4gICAgICAgIHZhbGlkYXRlLm1lc3NhZ2VzKFt7dHlwZTogJ0Vycm9yJywgdGV4dDogJ1dlbGwnLCBjbGFzczogJ2Vycm9yJywgZmlsZVBhdGg6IDF9XSwge25hbWU6ICcnfSlcbiAgICAgIC50b1Rocm93KClcbiAgICAgIHZhbGlkYXRlLm1lc3NhZ2VzKFt7dHlwZTogJ0Vycm9yJywgdGV4dDogJ1dlbGwnLCBjbGFzczogJ2Vycm9yJywgZmlsZVBhdGg6ICcvJ31dLCB7bmFtZTogJyd9KVxuICAgIGl0ICd0aHJvd3MgaWYgYm90aCB0ZXh0IGFuZCBodG1sIGFyZSBwcm92aWRlZCcsIC0+XG4gICAgICBleHBlY3QgLT5cbiAgICAgICAgdmFsaWRhdGUubWVzc2FnZXMoW3t0eXBlOiAnRXJyb3InLCB0ZXh0OiAnV2VsbCcsIGh0bWw6ICdhJywgY2xhc3M6ICdlcnJvcicsIGZpbGVQYXRoOiAnLyd9XSwge25hbWU6ICcnfSlcbiAgICAgIC50b1Rocm93KClcbiAgICAgIHZhbGlkYXRlLm1lc3NhZ2VzKFt7dHlwZTogJ0Vycm9yJywgdGV4dDogJ1dlbGwnLCBjbGFzczogJ2Vycm9yJywgZmlsZVBhdGg6ICcvJ31dLCB7bmFtZTogJyd9KVxuICAgICAgdmFsaWRhdGUubWVzc2FnZXMoW3t0eXBlOiAnRXJyb3InLCBodG1sOiAnV2VsbCcsIGNsYXNzOiAnZXJyb3InLCBmaWxlUGF0aDogJy8nfV0sIHtuYW1lOiAnJ30pXG4gICAgICB2YWxpZGF0ZS5tZXNzYWdlcyhbe3R5cGU6ICdFcnJvcicsIGh0bWw6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLCBjbGFzczogJ2Vycm9yJywgZmlsZVBhdGg6ICcvJ31dLCB7bmFtZTogJyd9KVxuIl19
