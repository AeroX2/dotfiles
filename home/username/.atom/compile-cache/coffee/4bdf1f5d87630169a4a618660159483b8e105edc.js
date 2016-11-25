(function() {
  describe('Linter Config', function() {
    var CP, FS, Helpers, getLinter, getMessage, linter, ref;
    linter = null;
    ref = require('./common'), getLinter = ref.getLinter, getMessage = ref.getMessage;
    CP = require('child_process');
    FS = require('fs');
    Helpers = require('../lib/helpers');
    beforeEach(function() {
      return waitsForPromise(function() {
        return atom.packages.activatePackage('linter').then(function() {
          return linter = atom.packages.getActivePackage('linter').mainModule.instance;
        });
      });
    });
    describe('ignoredMessageTypes', function() {
      return it('ignores certain types of messages', function() {
        var linterProvider;
        linterProvider = getLinter();
        expect(linter.messages.publicMessages.length).toBe(0);
        linter.messages.set({
          linter: linterProvider,
          messages: [getMessage('Error'), getMessage('Warning')]
        });
        linter.messages.updatePublic();
        expect(linter.messages.publicMessages.length).toBe(2);
        atom.config.set('linter.ignoredMessageTypes', ['Error']);
        linter.messages.set({
          linter: linterProvider,
          messages: [getMessage('Error'), getMessage('Warning')]
        });
        linter.messages.updatePublic();
        return expect(linter.messages.publicMessages.length).toBe(1);
      });
    });
    describe('statusIconScope', function() {
      return it('only shows messages of the current scope', function() {
        var linterProvider;
        linterProvider = getLinter();
        expect(linter.views.bottomContainer.status.count).toBe(0);
        linter.messages.set({
          linter: linterProvider,
          messages: [getMessage('Error', '/tmp/test.coffee')]
        });
        linter.messages.updatePublic();
        expect(linter.views.bottomContainer.status.count).toBe(1);
        atom.config.set('linter.statusIconScope', 'File');
        expect(linter.views.bottomContainer.status.count).toBe(0);
        atom.config.set('linter.statusIconScope', 'Project');
        return expect(linter.views.bottomContainer.status.count).toBe(1);
      });
    });
    describe('ignoreVCSIgnoredFiles', function() {
      return it('ignores the file if its ignored by the VCS', function() {
        var filePath, linterProvider;
        filePath = "/tmp/linter_test_file";
        FS.writeFileSync(filePath, "'use strict'\n");
        atom.config.set('linter.ignoreVCSIgnoredFiles', true);
        linterProvider = getLinter();
        spyOn(linterProvider, 'lint');
        spyOn(Helpers, 'isPathIgnored').andCallFake(function() {
          return true;
        });
        linter.addLinter(linterProvider);
        return waitsForPromise(function() {
          return atom.workspace.open(filePath).then(function() {
            linter.commands.lint();
            expect(linterProvider.lint).not.toHaveBeenCalled();
            atom.config.set('linter.ignoreVCSIgnoredFiles', false);
            linter.commands.lint();
            expect(linterProvider.lint).toHaveBeenCalled();
            return CP.execSync("rm -f " + filePath);
          });
        });
      });
    });
    return describe('ignoreMatchedFiles', function() {
      return it('ignores the file if it matches pattern', function() {
        var filePath, linterProvider;
        filePath = '/tmp/linter_spec_test.min.js';
        FS.writeFileSync(filePath, "'use strict'\n");
        atom.config.set('linter.ignoreMatchedFiles', '/**/*.min.{js,css}');
        linterProvider = getLinter();
        spyOn(linterProvider, 'lint');
        linter.addLinter(linterProvider);
        return waitsForPromise(function() {
          return atom.workspace.open(filePath).then(function() {
            linter.commands.lint();
            expect(linterProvider.lint).not.toHaveBeenCalled();
            atom.config.set('linter.ignoreMatchedFiles', '/**/*.min.css');
            linter.commands.lint();
            expect(linterProvider.lint).toHaveBeenCalled();
            return CP.execSync("rm -f " + filePath);
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvY29uZmlnLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUEsUUFBQSxDQUFTLGVBQVQsRUFBMEIsU0FBQTtBQUN4QixRQUFBO0lBQUEsTUFBQSxHQUFTO0lBQ1QsTUFBMEIsT0FBQSxDQUFRLFVBQVIsQ0FBMUIsRUFBQyx5QkFBRCxFQUFZO0lBQ1osRUFBQSxHQUFLLE9BQUEsQ0FBUSxlQUFSO0lBQ0wsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSO0lBQ0wsT0FBQSxHQUFVLE9BQUEsQ0FBUSxnQkFBUjtJQUNWLFVBQUEsQ0FBVyxTQUFBO2FBQ1QsZUFBQSxDQUFnQixTQUFBO2VBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFkLENBQThCLFFBQTlCLENBQXVDLENBQUMsSUFBeEMsQ0FBNkMsU0FBQTtpQkFDM0MsTUFBQSxHQUFTLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWQsQ0FBK0IsUUFBL0IsQ0FBd0MsQ0FBQyxVQUFVLENBQUM7UUFEbEIsQ0FBN0M7TUFEYyxDQUFoQjtJQURTLENBQVg7SUFLQSxRQUFBLENBQVMscUJBQVQsRUFBZ0MsU0FBQTthQUM5QixFQUFBLENBQUcsbUNBQUgsRUFBd0MsU0FBQTtBQUN0QyxZQUFBO1FBQUEsY0FBQSxHQUFpQixTQUFBLENBQUE7UUFDakIsTUFBQSxDQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQXRDLENBQTZDLENBQUMsSUFBOUMsQ0FBbUQsQ0FBbkQ7UUFDQSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQWhCLENBQW9CO1VBQUMsTUFBQSxFQUFRLGNBQVQ7VUFBeUIsUUFBQSxFQUFVLENBQUMsVUFBQSxDQUFXLE9BQVgsQ0FBRCxFQUFzQixVQUFBLENBQVcsU0FBWCxDQUF0QixDQUFuQztTQUFwQjtRQUNBLE1BQU0sQ0FBQyxRQUFRLENBQUMs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QSIsInNvdXJjZXNDb250ZW50IjpbImRlc2NyaWJlICdMaW50ZXIgQ29uZmlnJywgLT5cbiAgbGludGVyID0gbnVsbFxuICB7Z2V0TGludGVyLCBnZXRNZXNzYWdlfSA9IHJlcXVpcmUoJy4vY29tbW9uJylcbiAgQ1AgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJylcbiAgRlMgPSByZXF1aXJlKCdmcycpXG4gIEhlbHBlcnMgPSByZXF1aXJlKCcuLi9saWIvaGVscGVycycpXG4gIGJlZm9yZUVhY2ggLT5cbiAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsaW50ZXInKS50aGVuIC0+XG4gICAgICAgIGxpbnRlciA9IGF0b20ucGFja2FnZXMuZ2V0QWN0aXZlUGFja2FnZSgnbGludGVyJykubWFpbk1vZHVsZS5pbnN0YW5jZVxuXG4gIGRlc2NyaWJlICdpZ25vcmVkTWVzc2FnZVR5cGVzJywgLT5cbiAgICBpdCAnaWdub3JlcyBjZXJ0YWluIHR5cGVzIG9mIG1lc3NhZ2VzJywgLT5cbiAgICAgIGxpbnRlclByb3ZpZGVyID0gZ2V0TGludGVyKClcbiAgICAgIGV4cGVjdChsaW50ZXIubWVzc2FnZXMucHVibGljTWVzc2FnZXMubGVuZ3RoKS50b0JlKDApXG4gICAgICBsaW50ZXIubWVzc2FnZXMuc2V0KHtsaW50ZXI6IGxpbnRlclByb3ZpZGVyLCBtZXNzYWdlczogW2dldE1lc3NhZ2UoJ0Vycm9yJyksIGdldE1lc3NhZ2UoJ1dhcm5pbmcnKV19KVxuICAgICAgbGludGVyLm1lc3NhZ2VzLnVwZGF0ZVB1YmxpYygpXG4gICAgICBleHBlY3QobGludGVyLm1lc3NhZ2VzLnB1YmxpY01lc3NhZ2VzLmxlbmd0aCkudG9CZSgyKVxuICAgICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXIuaWdub3JlZE1lc3NhZ2VUeXBlcycsIFsnRXJyb3InXSlcbiAgICAgIGxpbnRlci5tZXNzYWdlcy5zZXQoe2xpbnRlcjogbGludGVyUHJvdmlkZXIsIG1lc3NhZ2VzOiBbZ2V0TWVzc2FnZSgnRXJyb3InKSwgZ2V0TWVzc2FnZSgnV2FybmluZycpXX0pXG4gICAgICBsaW50ZXIubWVzc2FnZXMudXBkYXRlUHVibGljKClcbiAgICAgIGV4cGVjdChsaW50ZXIubWVzc2FnZXMucHVibGljTWVzc2FnZXMubGVuZ3RoKS50b0JlKDEpXG5cbiAgZGVzY3JpYmUgJ3N0YXR1c0ljb25TY29wZScsIC0+XG4gICAgaXQgJ29ubHkgc2hvd3MgbWVzc2FnZXMgb2YgdGhlIGN1cnJlbnQgc2NvcGUnLCAtPlxuICAgICAgbGludGVyUHJvdmlkZXIgPSBnZXRMaW50ZXIoKVxuICAgICAgZXhwZWN0KGxpbnRlci52aWV3cy5ib3R0b21Db250YWluZXIuc3RhdHVzLmNvdW50KS50b0JlKDApXG4gICAgICBsaW50ZXIubWVzc2FnZXMuc2V0KHtsaW50ZXI6IGxpbnRlclByb3ZpZGVyLCBtZXNzYWdlczogW2dldE1lc3NhZ2UoJ0Vycm9yJywgJy90bXAvdGVzdC5jb2ZmZWUnKV19KVxuICAgICAgbGludGVyLm1lc3NhZ2VzLnVwZGF0ZVB1YmxpYygpXG4gICAgICBleHBlY3QobGludGVyLnZpZXdzLmJvdHRvbUNvbnRhaW5lci5zdGF0dXMuY291bnQpLnRvQmUoMSlcbiAgICAgIGF0b20uY29uZmlnLnNldCgnbGludGVyLnN0YXR1c0ljb25TY29wZScsICdGaWxlJylcbiAgICAgIGV4cGVjdChsaW50ZXIudmlld3MuYm90dG9tQ29udGFpbmVyLnN0YXR1cy5jb3VudCkudG9CZSgwKVxuICAgICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXIuc3RhdHVzSWNvblNjb3BlJywgJ1Byb2plY3QnKVxuICAgICAgZXhwZWN0KGxpbnRlci52aWV3cy5ib3R0b21Db250YWluZXIuc3RhdHVzLmNvdW50KS50b0JlKDEpXG4gIGRlc2NyaWJlICdpZ25vcmVWQ1NJZ25vcmVkRmlsZXMnLCAtPlxuICAgIGl0ICdpZ25vcmVzIHRoZSBmaWxlIGlmIGl0cyBpZ25vcmVkIGJ5IHRoZSBWQ1MnLCAtPlxuICAgICAgZmlsZVBhdGggPSBcIi90bXAvbGludGVyX3Rlc3RfZmlsZVwiXG4gICAgICBGUy53cml0ZUZpbGVTeW5jKGZpbGVQYXRoLCBcIid1c2Ugc3RyaWN0J1xcblwiKVxuXG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ2xpbnRlci5pZ25vcmVWQ1NJZ25vcmVkRmlsZXMnLCB0cnVlKVxuICAgICAgbGludGVyUHJvdmlkZXIgPSBnZXRMaW50ZXIoKVxuICAgICAgc3B5T24obGludGVyUHJvdmlkZXIsICdsaW50JylcbiAgICAgIHNweU9uKEhlbHBlcnMsICdpc1BhdGhJZ25vcmVkJykuYW5kQ2FsbEZha2UoIC0+IHRydWUpXG5cbiAgICAgIGxpbnRlci5hZGRMaW50ZXIobGludGVyUHJvdmlkZXIpXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGVQYXRoKS50aGVuIC0+XG4gICAgICAgICAgbGludGVyLmNvbW1hbmRzLmxpbnQoKVxuICAgICAgICAgIGV4cGVjdChsaW50ZXJQcm92aWRlci5saW50KS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXIuaWdub3JlVkNTSWdub3JlZEZpbGVzJywgZmFsc2UpXG4gICAgICAgICAgbGludGVyLmNvbW1hbmRzLmxpbnQoKVxuICAgICAgICAgIGV4cGVjdChsaW50ZXJQcm92aWRlci5saW50KS50b0hhdmVCZWVuQ2FsbGVkKClcbiAgICAgICAgICBDUC5leGVjU3luYyhcInJtIC1mICN7ZmlsZVBhdGh9XCIpXG5cbiAgZGVzY3JpYmUgJ2lnbm9yZU1hdGNoZWRGaWxlcycsIC0+XG4gICAgaXQgJ2lnbm9yZXMgdGhlIGZpbGUgaWYgaXQgbWF0Y2hlcyBwYXR0ZXJuJywgLT5cbiAgICAgIGZpbGVQYXRoID0gJy90bXAvbGludGVyX3NwZWNfdGVzdC5taW4uanMnXG4gICAgICBGUy53cml0ZUZpbGVTeW5jKGZpbGVQYXRoLCBcIid1c2Ugc3RyaWN0J1xcblwiKVxuXG4gICAgICBhdG9tLmNvbmZpZy5zZXQoJ2xpbnRlci5pZ25vcmVNYXRjaGVkRmlsZXMnLCAnLyoqLyoubWluLntqcyxjc3N9JylcbiAgICAgIGxpbnRlclByb3ZpZGVyID0gZ2V0TGludGVyKClcbiAgICAgIHNweU9uKGxpbnRlclByb3ZpZGVyLCAnbGludCcpXG5cbiAgICAgIGxpbnRlci5hZGRMaW50ZXIobGludGVyUHJvdmlkZXIpXG5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGVQYXRoKS50aGVuIC0+XG4gICAgICAgICAgbGludGVyLmNvbW1hbmRzLmxpbnQoKVxuICAgICAgICAgIGV4cGVjdChsaW50ZXJQcm92aWRlci5saW50KS5ub3QudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgICAgYXRvbS5jb25maWcuc2V0KCdsaW50ZXIuaWdub3JlTWF0Y2hlZEZpbGVzJywgJy8qKi8qLm1pbi5jc3MnKVxuICAgICAgICAgIGxpbnRlci5jb21tYW5kcy5saW50KClcbiAgICAgICAgICBleHBlY3QobGludGVyUHJvdmlkZXIubGludCkudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICAgICAgQ1AuZXhlY1N5bmMoXCJybSAtZiAje2ZpbGVQYXRofVwiKVxuIl19
