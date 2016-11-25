(function() {
  describe('IndieRegistry', function() {
    var IndieRegistry, indieRegistry;
    IndieRegistry = require('../lib/indie-registry');
    indieRegistry = null;
    beforeEach(function() {
      if (indieRegistry != null) {
        indieRegistry.dispose();
      }
      return indieRegistry = new IndieRegistry();
    });
    describe('register', function() {
      return it('validates the args', function() {
        expect(function() {
          return indieRegistry.register({
            name: 2
          });
        }).toThrow();
        indieRegistry.register({});
        return indieRegistry.register({
          name: 'wow'
        });
      });
    });
    return describe('all of it', function() {
      return it('works', function() {
        var indie, listener, messages, observeListener;
        indie = indieRegistry.register({
          name: 'Wow'
        });
        expect(indieRegistry.has(indie)).toBe(false);
        expect(indieRegistry.has(0)).toBe(false);
        listener = jasmine.createSpy('linter.indie.messaging');
        observeListener = jasmine.createSpy('linter.indie.observe');
        messages = [{}];
        indieRegistry.onDidUpdateMessages(listener);
        indieRegistry.observe(observeListener);
        indie.setMessages(messages);
        expect(observeListener).toHaveBeenCalled();
        expect(observeListener).toHaveBeenCalledWith(indie);
        expect(listener).toHaveBeenCalled();
        expect(listener.mostRecentCall.args[0].linter.toBe(indie));
        expect(listener.mostRecentCall.args[0].messages.toBe(messages));
        indie.dispose();
        return expect(indieRegistry.has(indie)).toBe(false);
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvaW5kaWUtcmVnaXN0cnkuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUEsUUFBQSxDQUFTLGVBQVQsRUFBMEIsU0FBQTtBQUN4QixRQUFBO0lBQUEsYUFBQSxHQUFnQixPQUFBLENBQVEsdUJBQVI7SUFDaEIsYUFBQSxHQUFnQjtJQUVoQixVQUFBLENBQVcsU0FBQTs7UUFDVCxhQUFhLENBQUUsT0FBZixDQUFBOzthQUNBLGFBQUEsR0FBb0IsSUFBQSxhQUFBLENBQUE7SUFGWCxDQUFYO0lBSUEsUUFBQSxDQUFTLFVBQVQsRUFBcUIsU0FBQTthQUNuQixFQUFBLENBQUcsb0JBQUgsRUFBeUIsU0FBQTtRQUN2QixNQUFBLENBQU8sU0FBQTtpQkFDTCxhQUFhLENBQUMsUUFBZCxDQUF1QjtZQUFDLElBQUEsRUFBTSxDQUFQO1dBQXZCO1FBREssQ0FBUCxDQUVBLENBQUMsT0FGRCxDQUFBO1FBR0EsYUFBYSxDQUFDLFFBQWQsQ0FBdUIsRUFBdkI7ZUFDQSxhQUFhLENBQUMsUUFBZCxDQUF1QjtVQUFDLElBQUEsRUFBTSxLQUFQO1NBQXZCO01BTHVCLENBQXpCO0lBRG1CLENBQXJCO1dBUUEsUUFBQSxDQUFTLFdBQVQsRUFBc0IsU0FBQTthQUNwQixFQUFBLENBQUcsT0FBSCxFQUFZLFNBQUE7QUFDVixZQUFBO1FBQUEsS0FBQSxHQUFRLGFBQWEsQ0FBQyxRQUFkLENBQXVCO1VBQUMsSUFBQSxFQUFNLEtBQVA7U0FBdkI7UUFDUixNQUFBLENBQU8sYUFBYSxDQUFDLEdBQWQsQ0FBa0IsS0FBbEIsQ0FBUCxDQUFnQyxDQUFDLElBQWpDLENBQXNDLEtBQXRDO1FBQ0EsTUFBQSxDQUFPLGFBQWEsQ0FBQyxHQUFkLENBQWtCLENBQWxCLENBQVAsQ0FBNEIsQ0FBQyxJQUE3QixDQUFrQyxLQUFsQztRQUVBLFFBQUEsR0FBVyxPQUFPLENBQUMsU0FBUixDQUFrQix3QkFBbEI7UUFDWCxlQUFBLEdBQWtCLE9BQU8sQ0FBQyxTQUFSLENBQWtCLHNCQUFsQjtRQUNsQixRQUFBLEdBQVcsQ0FBQyxFQUFEO1FBQ1gsYUFBYSxDQUFDLG1CQUFkLENBQWtDLFFBQWxDO1FBQ0EsYUFBYSxDQUFDLE9BQWQsQ0FBc0IsZUFBdEI7UUFDQSxLQUFLLENBQUMsV0FBTixDQUFrQixRQUFsQjtRQUNBLE1BQUEsQ0FBTyxlQUFQLENBQXVCLENBQUMsZ0JBQXhCLENBQUE7UUFDQSxNQUFBLENBQU8sZUFBUCxDQUF1QixDQUFDLG9CQUF4QixDQUE2QyxLQUE3QztRQUNBLE1BQUEsQ0FBTyxRQUFQLENBQWdCLENBQUMsZ0JBQWpCLENBQUE7UUFDQSxNQUFBLENBQU8sUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUFFLENBQUMsTUFBTSxDQUFDLElBQXZDLENBQTRDLEtBQTVDLENBQVA7UUFDQSxNQUFBLENBQU8sUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUFFLENBQUMsUUFBUSxDQUFDLElBQXpDLENBQThDLFFBQTlDLENBQVA7UUFDQSxLQUFLLENBQUMsT0FBTixDQUFBO2VBQ0EsTUFBQSxDQUFPLGFBQWEsQ0FBQyxHQUFkLENBQWtCLEtBQWxCLENBQVAsQ0FBZ0MsQ0FBQyxJQUFqQyxDQUFzQyxLQUF0QztNQWpCVSxDQUFaO0lBRG9CLENBQXRCO0VBaEJ3QixDQUExQjtBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiZGVzY3JpYmUgJ0luZGllUmVnaXN0cnknLCAtPlxuICBJbmRpZVJlZ2lzdHJ5ID0gcmVxdWlyZSgnLi4vbGliL2luZGllLXJlZ2lzdHJ5JylcbiAgaW5kaWVSZWdpc3RyeSA9IG51bGxcblxuICBiZWZvcmVFYWNoIC0+XG4gICAgaW5kaWVSZWdpc3RyeT8uZGlzcG9zZSgpXG4gICAgaW5kaWVSZWdpc3RyeSA9IG5ldyBJbmRpZVJlZ2lzdHJ5KClcblxuICBkZXNjcmliZSAncmVnaXN0ZXInLCAtPlxuICAgIGl0ICd2YWxpZGF0ZXMgdGhlIGFyZ3MnLCAtPlxuICAgICAgZXhwZWN0IC0+XG4gICAgICAgIGluZGllUmVnaXN0cnkucmVnaXN0ZXIoe25hbWU6IDJ9KVxuICAgICAgLnRvVGhyb3coKVxuICAgICAgaW5kaWVSZWdpc3RyeS5yZWdpc3Rlcih7fSlcbiAgICAgIGluZGllUmVnaXN0cnkucmVnaXN0ZXIoe25hbWU6ICd3b3cnfSlcblxuICBkZXNjcmliZSAnYWxsIG9mIGl0JywgLT5cbiAgICBpdCAnd29ya3MnLCAtPlxuICAgICAgaW5kaWUgPSBpbmRpZVJlZ2lzdHJ5LnJlZ2lzdGVyKHtuYW1lOiAnV293J30pXG4gICAgICBleHBlY3QoaW5kaWVSZWdpc3RyeS5oYXMoaW5kaWUpKS50b0JlKGZhbHNlKVxuICAgICAgZXhwZWN0KGluZGllUmVnaXN0cnkuaGFzKDApKS50b0JlKGZhbHNlKVxuXG4gICAgICBsaXN0ZW5lciA9IGphc21pbmUuY3JlYXRlU3B5KCdsaW50ZXIuaW5kaWUubWVzc2FnaW5nJylcbiAgICAgIG9ic2VydmVMaXN0ZW5lciA9IGphc21pbmUuY3JlYXRlU3B5KCdsaW50ZXIuaW5kaWUub2JzZXJ2ZScpXG4gICAgICBtZXNzYWdlcyA9IFt7fV1cbiAgICAgIGluZGllUmVnaXN0cnkub25EaWRVcGRhdGVNZXNzYWdlcyhsaXN0ZW5lcilcbiAgICAgIGluZGllUmVnaXN0cnkub2JzZXJ2ZShvYnNlcnZlTGlzdGVuZXIpXG4gICAgICBpbmRpZS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcbiAgICAgIGV4cGVjdChvYnNlcnZlTGlzdGVuZXIpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgZXhwZWN0KG9ic2VydmVMaXN0ZW5lcikudG9IYXZlQmVlbkNhbGxlZFdpdGgoaW5kaWUpXG4gICAgICBleHBlY3QobGlzdGVuZXIpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuICAgICAgZXhwZWN0KGxpc3RlbmVyLm1vc3RSZWNlbnRDYWxsLmFyZ3NbMF0ubGludGVyLnRvQmUoaW5kaWUpKVxuICAgICAgZXhwZWN0KGxpc3RlbmVyLm1vc3RSZWNlbnRDYWxsLmFyZ3NbMF0ubWVzc2FnZXMudG9CZShtZXNzYWdlcykpXG4gICAgICBpbmRpZS5kaXNwb3NlKClcbiAgICAgIGV4cGVjdChpbmRpZVJlZ2lzdHJ5LmhhcyhpbmRpZSkpLnRvQmUoZmFsc2UpXG4iXX0=
