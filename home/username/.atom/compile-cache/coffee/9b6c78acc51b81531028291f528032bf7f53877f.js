(function() {
  describe('helpers', function() {
    var helpers;
    helpers = require('../lib/helpers');
    beforeEach(function() {
      return atom.notifications.clear();
    });
    describe('::error', function() {
      return it('adds an error notification', function() {
        helpers.error(new Error());
        return expect(atom.notifications.getNotifications().length).toBe(1);
      });
    });
    return describe('::shouldTriggerLinter', function() {
      var bufferModifying, lintOnFly, normalLinter;
      normalLinter = {
        grammarScopes: ['*'],
        scope: 'file',
        lintOnFly: false,
        lint: function() {}
      };
      lintOnFly = {
        grammarScopes: ['*'],
        scope: 'file',
        lintOnFly: true,
        lint: function() {}
      };
      bufferModifying = {
        grammarScopes: ['*'],
        scope: 'file',
        lintOnFly: false,
        lint: function() {}
      };
      it('accepts a wildcard grammarScope', function() {
        return expect(helpers.shouldTriggerLinter(normalLinter, false, ['*'])).toBe(true);
      });
      it('runs lintOnFly ones on both save and lintOnFly', function() {
        expect(helpers.shouldTriggerLinter(lintOnFly, false, ['*'])).toBe(true);
        return expect(helpers.shouldTriggerLinter(lintOnFly, true, ['*'])).toBe(true);
      });
      return it("doesn't run save ones on fly", function() {
        return expect(helpers.shouldTriggerLinter(normalLinter, true, ['*'])).toBe(false);
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvaGVscGVycy1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBLFFBQUEsQ0FBUyxTQUFULEVBQW9CLFNBQUE7QUFDbEIsUUFBQTtJQUFBLE9BQUEsR0FBVSxPQUFBLENBQVEsZ0JBQVI7SUFDVixVQUFBLENBQVcsU0FBQTthQUNULElBQUksQ0FBQyxhQUFhLENBQUMsS0FBbkIsQ0FBQTtJQURTLENBQVg7SUFHQSxRQUFBLENBQVMsU0FBVCxFQUFvQixTQUFBO2FBQ2xCLEVBQUEsQ0FBRyw0QkFBSCxFQUFpQyxTQUFBO1FBQy9CLE9BQU8sQ0FBQyxLQUFSLENBQWtCLElBQUEsS0FBQSxDQUFBLENBQWxCO2VBQ0EsTUFBQSxDQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQW5CLENBQUEsQ0FBcUMsQ0FBQyxNQUE3QyxDQUFvRCxDQUFDLElBQXJELENBQTBELENBQTFEO01BRitCLENBQWpDO0lBRGtCLENBQXBCO1dBS0EsUUFBQSxDQUFTLHVCQUFULEVBQWtDLFNBQUE7QUFDaEMsVUFBQTtNQUFBLFlBQUEsR0FDRTtRQUFBLGFBQUEsRUFBZSxDQUFDLEdBQUQsQ0FBZjtRQUNBLEtBQUEsRUFBTyxNQURQO1FBRUEsU0FBQSxFQUFXLEtBRlg7UUFHQSxJQUFBLEVBQU0sU0FBQSxHQUFBLENBSE47O01BSUYsU0FBQSxHQUNFO1FBQUEsYUFBQSxFQUFlLENBQUMsR0FBRCxDQUFmO1FBQ0EsS0FBQSxFQUFPLE1BRFA7UUFFQSxTQUFBLEVBQVcsSUFGWDtRQUdBLElBQUEsRUFBTSxTQUFBLEdBQUEsQ0FITjs7TUFJRixlQUFBLEdBQ0U7UUFBQSxhQUFBLEVBQWUsQ0FBQyxHQUFELENBQWY7UUFDQSxLQUFBLEVBQU8sTUFEUDtRQUVBLFNBQUEsRUFBVyxLQUZYO1FBR0EsSUFBQSxFQUFNLFNBQUEsR0FBQSxDQUhOOztNQUlGLEVBQUEsQ0FBRyxpQ0FBSCxFQUFzQyxTQUFBO2VBQ3BDLE1BQUEsQ0FBTyxPQUFPLENBQUMsbUJBQVIsQ0FBNEIsWUFBNUIsRUFBMEMsS0FBMUMsRUFBaUQsQ0FBQyxHQUFELENBQWpELENBQVAsQ0FBK0QsQ0FBQyxJQUFoRSxDQUFxRSxJQUFyRTtNQURvQyxDQUF0QztNQUVBLEVBQUEsQ0FBRyxnREFBSCxFQUFxRCxTQUFBO1FBQ25ELE1BQUEsQ0FBTyxPQUFPLENBQUMsbUJBQVIsQ0FBNEIsU0FBNUIsRUFBdUMsS0FBdkMsRUFBOEMsQ0FBQyxHQUFELENBQTlDLENBQVAsQ0FBNEQsQ0FBQyxJQUE3RCxDQUFrRSxJQUFsRTtlQUNBLE1BQUEsQ0FBTyxPQUFPLENBQUMsbUJBQVIsQ0FBNEIsU0FBNUIsRUFBdUMsSUFBdkMsRUFBNkMsQ0FBQyxHQUFELENBQTdDLENBQVAsQ0FBMkQsQ0FBQyxJQUE1RCxDQUFpRSxJQUFqRTtNQUZtRCxDQUFyRDthQUdBLEVBQUEsQ0FBRyw4QkFBSCxFQUFtQyxTQUFBO2VBQ2pDLE1BQUEsQ0FBTyxPQUFPLENBQUMsbUJBQVIsQ0FBNEIsWUFBNUIsRUFBMEMsSUFBMUMsRUFBZ0QsQ0FBQyxHQUFELENBQWhELENBQVAsQ0FBOEQsQ0FBQyxJQUEvRCxDQUFvRSxLQUFwRTtNQURpQyxDQUFuQztJQXJCZ0MsQ0FBbEM7RUFWa0IsQ0FBcEI7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbImRlc2NyaWJlICdoZWxwZXJzJywgLT5cbiAgaGVscGVycyA9IHJlcXVpcmUoJy4uL2xpYi9oZWxwZXJzJylcbiAgYmVmb3JlRWFjaCAtPlxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5jbGVhcigpXG5cbiAgZGVzY3JpYmUgJzo6ZXJyb3InLCAtPlxuICAgIGl0ICdhZGRzIGFuIGVycm9yIG5vdGlmaWNhdGlvbicsIC0+XG4gICAgICBoZWxwZXJzLmVycm9yKG5ldyBFcnJvcigpKVxuICAgICAgZXhwZWN0KGF0b20ubm90aWZpY2F0aW9ucy5nZXROb3RpZmljYXRpb25zKCkubGVuZ3RoKS50b0JlKDEpXG5cbiAgZGVzY3JpYmUgJzo6c2hvdWxkVHJpZ2dlckxpbnRlcicsIC0+XG4gICAgbm9ybWFsTGludGVyID1cbiAgICAgIGdyYW1tYXJTY29wZXM6IFsnKiddXG4gICAgICBzY29wZTogJ2ZpbGUnXG4gICAgICBsaW50T25GbHk6IGZhbHNlXG4gICAgICBsaW50OiAtPlxuICAgIGxpbnRPbkZseSA9XG4gICAgICBncmFtbWFyU2NvcGVzOiBbJyonXVxuICAgICAgc2NvcGU6ICdmaWxlJ1xuICAgICAgbGludE9uRmx5OiB0cnVlXG4gICAgICBsaW50OiAtPlxuICAgIGJ1ZmZlck1vZGlmeWluZyA9XG4gICAgICBncmFtbWFyU2NvcGVzOiBbJyonXVxuICAgICAgc2NvcGU6ICdmaWxlJ1xuICAgICAgbGludE9uRmx5OiBmYWxzZVxuICAgICAgbGludDogLT5cbiAgICBpdCAnYWNjZXB0cyBhIHdpbGRjYXJkIGdyYW1tYXJTY29wZScsIC0+XG4gICAgICBleHBlY3QoaGVscGVycy5zaG91bGRUcmlnZ2VyTGludGVyKG5vcm1hbExpbnRlciwgZmFsc2UsIFsnKiddKSkudG9CZSh0cnVlKVxuICAgIGl0ICdydW5zIGxpbnRPbkZseSBvbmVzIG9uIGJvdGggc2F2ZSBhbmQgbGludE9uRmx5JywgLT5cbiAgICAgIGV4cGVjdChoZWxwZXJzLnNob3VsZFRyaWdnZXJMaW50ZXIobGludE9uRmx5LCBmYWxzZSwgWycqJ10pKS50b0JlKHRydWUpXG4gICAgICBleHBlY3QoaGVscGVycy5zaG91bGRUcmlnZ2VyTGludGVyKGxpbnRPbkZseSwgdHJ1ZSwgWycqJ10pKS50b0JlKHRydWUpXG4gICAgaXQgXCJkb2Vzbid0IHJ1biBzYXZlIG9uZXMgb24gZmx5XCIsIC0+XG4gICAgICBleHBlY3QoaGVscGVycy5zaG91bGRUcmlnZ2VyTGludGVyKG5vcm1hbExpbnRlciwgdHJ1ZSwgWycqJ10pKS50b0JlKGZhbHNlKVxuIl19
