(function() {
  describe('The Lint on the Fly Configuration Option', function() {
    var configString;
    configString = 'linter.lintOnFly';
    beforeEach(function() {
      return waitsForPromise(function() {
        return atom.packages.activatePackage('linter');
      });
    });
    return it('is `true` by default.', function() {
      var packageSetting;
      packageSetting = atom.config.get(configString);
      return expect(packageSetting).toBe(true);
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvY29uZmlnL2xpbnQtb24tZmx5LXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUEsUUFBQSxDQUFTLDBDQUFULEVBQXFELFNBQUE7QUFFbkQsUUFBQTtJQUFBLFlBQUEsR0FBZTtJQUVmLFVBQUEsQ0FBVyxTQUFBO2FBQ1QsZUFBQSxDQUFnQixTQUFBO2VBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFkLENBQThCLFFBQTlCO01BRGMsQ0FBaEI7SUFEUyxDQUFYO1dBSUEsRUFBQSxDQUFHLHVCQUFILEVBQTRCLFNBQUE7QUFDMUIsVUFBQTtNQUFBLGNBQUEsR0FBaUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLFlBQWhCO2FBQ2pCLE1BQUEsQ0FBTyxjQUFQLENBQXNCLENBQUMsSUFBdkIsQ0FBNEIsSUFBNUI7SUFGMEIsQ0FBNUI7RUFSbUQsQ0FBckQ7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbImRlc2NyaWJlICdUaGUgTGludCBvbiB0aGUgRmx5IENvbmZpZ3VyYXRpb24gT3B0aW9uJywgLT5cblxuICBjb25maWdTdHJpbmcgPSAnbGludGVyLmxpbnRPbkZseSdcblxuICBiZWZvcmVFYWNoIC0+XG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbGludGVyJylcblxuICBpdCAnaXMgYHRydWVgIGJ5IGRlZmF1bHQuJywgLT5cbiAgICBwYWNrYWdlU2V0dGluZyA9IGF0b20uY29uZmlnLmdldCBjb25maWdTdHJpbmdcbiAgICBleHBlY3QocGFja2FnZVNldHRpbmcpLnRvQmUgdHJ1ZVxuIl19
