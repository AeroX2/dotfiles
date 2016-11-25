(function() {
  describe('Indie', function() {
    var Indie, Validate, indie;
    Validate = require('../lib/validate');
    Indie = require('../lib/indie');
    indie = null;
    beforeEach(function() {
      if (indie != null) {
        indie.dispose();
      }
      return indie = new Indie({});
    });
    describe('Validations', function() {
      return it('just cares about a name', function() {
        var linter;
        linter = {};
        Validate.linter(linter, true);
        expect(linter.name).toBe(null);
        linter.name = 'a';
        Validate.linter(linter, true);
        expect(linter.name).toBe('a');
        linter.name = 2;
        return expect(function() {
          return Validate.linter(linter, true);
        }).toThrow();
      });
    });
    describe('constructor', function() {
      return it('sets a scope for message registry to know', function() {
        return expect(indie.scope).toBe('project');
      });
    });
    describe('{set, delete}Messages', function() {
      return it('notifies the event listeners of the change', function() {
        var listener, messages;
        listener = jasmine.createSpy('indie.listener');
        messages = [{}];
        indie.onDidUpdateMessages(listener);
        indie.setMessages(messages);
        expect(listener).toHaveBeenCalled();
        expect(listener.calls.length).toBe(1);
        expect(listener).toHaveBeenCalledWith(messages);
        indie.deleteMessages();
        expect(listener.calls.length).toBe(2);
        expect(listener.mostRecentCall.args[0] instanceof Array);
        return expect(listener.mostRecentCall.args[0].length).toBe(0);
      });
    });
    return describe('dispose', function() {
      return it('triggers the onDidDestroy event', function() {
        var listener;
        listener = jasmine.createSpy('indie.destroy');
        indie.onDidDestroy(listener);
        indie.dispose();
        return expect(listener).toHaveBeenCalled();
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvaW5kaWUtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxRQUFBLENBQVMsT0FBVCxFQUFrQixTQUFBO0FBQ2hCLFFBQUE7SUFBQSxRQUFBLEdBQVcsT0FBQSxDQUFRLGlCQUFSO0lBQ1gsS0FBQSxHQUFRLE9BQUEsQ0FBUSxjQUFSO0lBQ1IsS0FBQSxHQUFRO0lBRVIsVUFBQSxDQUFXLFNBQUE7O1FBQ1QsS0FBSyxDQUFFLE9BQVAsQ0FBQTs7YUFDQSxLQUFBLEdBQVksSUFBQSxLQUFBLENBQU0sRUFBTjtJQUZILENBQVg7SUFJQSxRQUFBLENBQVMsYUFBVCxFQUF3QixTQUFBO2FBQ3RCLEVBQUEsQ0FBRyx5QkFBSCxFQUE4QixTQUFBO0FBQzVCLFlBQUE7UUFBQSxNQUFBLEdBQVM7UUFDVCxRQUFRLENBQUMsTUFBVCxDQUFnQixNQUFoQixFQUF3QixJQUF4QjtRQUNBLE1BQUEsQ0FBTyxNQUFNLENBQUMsSUFBZCxDQUFtQixDQUFDLElBQXBCLENBQXlCLElBQXpCO1FBQ0EsTUFBTSxDQUFDLElBQVAsR0FBYztRQUNkLFFBQVEsQ0FBQyxNQUFULENBQWdCLE1BQWhCLEVBQXdCLElBQXhCO1FBQ0EsTUFBQSxDQUFPLE1BQU0sQ0FBQyxJQUFkLENBQW1CLENBQUMsSUFBcEIsQ0FBeUIsR0FBekI7UUFDQSxNQUFNLENBQUMsSUFBUCxHQUFjO2VBQ2QsTUFBQSxDQUFPLFNBQUE7aUJBQ0wsUUFBUSxDQUFDLE1BQVQsQ0FBZ0IsTUFBaEIsRUFBd0IsSUFBeEI7UUFESyxDQUFQLENBRUEsQ0FBQyxPQUZELENBQUE7TUFSNEIsQ0FBOUI7SUFEc0IsQ0FBeEI7SUFhQSxRQUFBLENBQVMsYUFBVCxFQUF3QixTQUFBO2FBQ3RCLEVBQUEsQ0FBRywyQ0FBSCxFQUFnRCxTQUFBO2VBQzlDLE1BQUEsQ0FBTyxLQUFLLENBQUMsS0FBYixDQUFtQixDQUFDLElBQXBCLENBQXlCLFNBQXpCO01BRDhDLENBQWhEO0lBRHNCLENBQXhCO0lBSUEsUUFBQSxDQUFTLHVCQUFULEVBQWtDLFNBQUE7YUFDaEMsRUFBQSxDQUFHLDRDQUFILEVBQWlELFNBQUE7QUFDL0MsWUFBQTtRQUFBLFFBQUEsR0FBVyxPQUFPLENBQUMsU0FBUixDQUFrQixnQkFBbEI7UUFDWCxRQUFBLEdBQVcsQ0FBQyxFQUFEO1FBQ1gsS0FBSyxDQUFDLG1CQUFOLENBQTBCLFFBQTFCO1FBQ0EsS0FBSyxDQUFDLFdBQU4sQ0FBa0IsUUFBbEI7UUFDQSxNQUFBLENBQU8sUUFBUCxDQUFnQixDQUFDLGdCQUFqQixDQUFBO1FBQ0EsTUFBQSxDQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBdEIsQ0FBNkIsQ0FBQyxJQUE5QixDQUFtQyxDQUFuQztRQUNBLE1BQUEsQ0FBTyxRQUFQLENBQWdCLENBQUMsb0JBQWpCLENBQXNDLFFBQXRDO1FBQ0EsS0FBSyxDQUFDLGNBQU4sQ0FBQTtRQUNBLE1BQUEsQ0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQXRCLENBQTZCLENBQUMsSUFBOUIsQ0FBbUMsQ0FBbkM7UUFDQSxNQUFBLENBQU8sUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFLLENBQUEsQ0FBQSxDQUE3QixZQUEyQyxLQUFsRDtlQUNBLE1BQUEsQ0FBTyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUssQ0FBQSxDQUFBLENBQUUsQ0FBQyxNQUF2QyxDQUE4QyxDQUFDLElBQS9DLENBQW9ELENBQXBEO01BWCtDLENBQWpEO0lBRGdDLENBQWxDO1dBY0EsUUFBQSxDQUFTLFNBQVQsRUFBb0IsU0FBQTthQUNsQixFQUFBLENBQUcsaUNBQUgsRUFBc0MsU0FBQTtBQUNwQyxZQUFBO1FBQUEsUUFBQSxHQUFXLE9BQU8sQ0FBQyxTQUFSLENBQWtCLGVBQWxCO1FBQ1gsS0FBSyxDQUFDLFlBQU4sQ0FBbUIsUUFBbkI7UUFDQSxLQUFLLENBQUMsT0FBTixDQUFBO2VBQ0EsTUFBQSxDQUFPLFFBQVAsQ0FBZ0IsQ0FBQyxnQkFBakIsQ0FBQTtNQUpvQyxDQUF0QztJQURrQixDQUFwQjtFQXhDZ0IsQ0FBbEI7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbImRlc2NyaWJlICdJbmRpZScsIC0+XG4gIFZhbGlkYXRlID0gcmVxdWlyZSgnLi4vbGliL3ZhbGlkYXRlJylcbiAgSW5kaWUgPSByZXF1aXJlKCcuLi9saWIvaW5kaWUnKVxuICBpbmRpZSA9IG51bGxcblxuICBiZWZvcmVFYWNoIC0+XG4gICAgaW5kaWU/LmRpc3Bvc2UoKVxuICAgIGluZGllID0gbmV3IEluZGllKHt9KVxuXG4gIGRlc2NyaWJlICdWYWxpZGF0aW9ucycsIC0+XG4gICAgaXQgJ2p1c3QgY2FyZXMgYWJvdXQgYSBuYW1lJywgLT5cbiAgICAgIGxpbnRlciA9IHt9XG4gICAgICBWYWxpZGF0ZS5saW50ZXIobGludGVyLCB0cnVlKVxuICAgICAgZXhwZWN0KGxpbnRlci5uYW1lKS50b0JlKG51bGwpXG4gICAgICBsaW50ZXIubmFtZSA9ICdhJ1xuICAgICAgVmFsaWRhdGUubGludGVyKGxpbnRlciwgdHJ1ZSlcbiAgICAgIGV4cGVjdChsaW50ZXIubmFtZSkudG9CZSgnYScpXG4gICAgICBsaW50ZXIubmFtZSA9IDJcbiAgICAgIGV4cGVjdCAtPlxuICAgICAgICBWYWxpZGF0ZS5saW50ZXIobGludGVyLCB0cnVlKVxuICAgICAgLnRvVGhyb3coKVxuXG4gIGRlc2NyaWJlICdjb25zdHJ1Y3RvcicsIC0+XG4gICAgaXQgJ3NldHMgYSBzY29wZSBmb3IgbWVzc2FnZSByZWdpc3RyeSB0byBrbm93JywgLT5cbiAgICAgIGV4cGVjdChpbmRpZS5zY29wZSkudG9CZSgncHJvamVjdCcpXG5cbiAgZGVzY3JpYmUgJ3tzZXQsIGRlbGV0ZX1NZXNzYWdlcycsIC0+XG4gICAgaXQgJ25vdGlmaWVzIHRoZSBldmVudCBsaXN0ZW5lcnMgb2YgdGhlIGNoYW5nZScsIC0+XG4gICAgICBsaXN0ZW5lciA9IGphc21pbmUuY3JlYXRlU3B5KCdpbmRpZS5saXN0ZW5lcicpXG4gICAgICBtZXNzYWdlcyA9IFt7fV1cbiAgICAgIGluZGllLm9uRGlkVXBkYXRlTWVzc2FnZXMobGlzdGVuZXIpXG4gICAgICBpbmRpZS5zZXRNZXNzYWdlcyhtZXNzYWdlcylcbiAgICAgIGV4cGVjdChsaXN0ZW5lcikudG9IYXZlQmVlbkNhbGxlZCgpXG4gICAgICBleHBlY3QobGlzdGVuZXIuY2FsbHMubGVuZ3RoKS50b0JlKDEpXG4gICAgICBleHBlY3QobGlzdGVuZXIpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKG1lc3NhZ2VzKVxuICAgICAgaW5kaWUuZGVsZXRlTWVzc2FnZXMoKVxuICAgICAgZXhwZWN0KGxpc3RlbmVyLmNhbGxzLmxlbmd0aCkudG9CZSgyKVxuICAgICAgZXhwZWN0KGxpc3RlbmVyLm1vc3RSZWNlbnRDYWxsLmFyZ3NbMF0gaW5zdGFuY2VvZiBBcnJheSlcbiAgICAgIGV4cGVjdChsaXN0ZW5lci5tb3N0UmVjZW50Q2FsbC5hcmdzWzBdLmxlbmd0aCkudG9CZSgwKVxuXG4gIGRlc2NyaWJlICdkaXNwb3NlJywgLT5cbiAgICBpdCAndHJpZ2dlcnMgdGhlIG9uRGlkRGVzdHJveSBldmVudCcsIC0+XG4gICAgICBsaXN0ZW5lciA9IGphc21pbmUuY3JlYXRlU3B5KCdpbmRpZS5kZXN0cm95JylcbiAgICAgIGluZGllLm9uRGlkRGVzdHJveShsaXN0ZW5lcilcbiAgICAgIGluZGllLmRpc3Bvc2UoKVxuICAgICAgZXhwZWN0KGxpc3RlbmVyKS50b0hhdmVCZWVuQ2FsbGVkKClcbiJdfQ==
