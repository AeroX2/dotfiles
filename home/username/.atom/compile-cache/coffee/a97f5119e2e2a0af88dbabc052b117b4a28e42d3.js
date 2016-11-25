(function() {
  describe('The Error Panel Visibility Configuration Option', function() {
    var configString;
    configString = 'linter.showErrorPanel';
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvY29uZmlnL3Nob3ctZXJyb3ItcGFuZWwtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxRQUFBLENBQVMsaURBQVQsRUFBNEQsU0FBQTtBQUUxRCxRQUFBO0lBQUEsWUFBQSxHQUFlO0lBRWYsVUFBQSxDQUFXLFNBQUE7YUFDVCxlQUFBLENBQWdCLFNBQUE7ZUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsUUFBOUI7TUFEYyxDQUFoQjtJQURTLENBQVg7V0FJQSxFQUFBLENBQUcsdUJBQUgsRUFBNEIsU0FBQTtBQUMxQixVQUFBO01BQUEsY0FBQSxHQUFpQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsWUFBaEI7YUFDakIsTUFBQSxDQUFPLGNBQVAsQ0FBc0IsQ0FBQyxJQUF2QixDQUE0QixJQUE1QjtJQUYwQixDQUE1QjtFQVIwRCxDQUE1RDtBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiZGVzY3JpYmUgJ1RoZSBFcnJvciBQYW5lbCBWaXNpYmlsaXR5IENvbmZpZ3VyYXRpb24gT3B0aW9uJywgLT5cblxuICBjb25maWdTdHJpbmcgPSAnbGludGVyLnNob3dFcnJvclBhbmVsJ1xuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsaW50ZXInKVxuXG4gIGl0ICdpcyBgdHJ1ZWAgYnkgZGVmYXVsdC4nLCAtPlxuICAgIHBhY2thZ2VTZXR0aW5nID0gYXRvbS5jb25maWcuZ2V0IGNvbmZpZ1N0cmluZ1xuICAgIGV4cGVjdChwYWNrYWdlU2V0dGluZykudG9CZSB0cnVlXG4iXX0=
