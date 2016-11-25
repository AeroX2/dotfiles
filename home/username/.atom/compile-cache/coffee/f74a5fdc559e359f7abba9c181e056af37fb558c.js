(function() {
  describe('Bottom Status Element', function() {
    var BottomStatus, bottomStatus;
    BottomStatus = require('../../lib/ui/bottom-status');
    bottomStatus = null;
    beforeEach(function() {
      return bottomStatus = new BottomStatus;
    });
    return describe('::visibility', function() {
      it('adds and removes the hidden attribute', function() {
        expect(bottomStatus.hasAttribute('hidden')).toBe(false);
        bottomStatus.visibility = true;
        expect(bottomStatus.hasAttribute('hidden')).toBe(false);
        bottomStatus.visibility = false;
        expect(bottomStatus.hasAttribute('hidden')).toBe(true);
        bottomStatus.visibility = true;
        return expect(bottomStatus.hasAttribute('hidden')).toBe(false);
      });
      return it('reports the visibility when getter is invoked', function() {
        expect(bottomStatus.visibility).toBe(true);
        bottomStatus.visibility = true;
        expect(bottomStatus.visibility).toBe(true);
        bottomStatus.visibility = false;
        expect(bottomStatus.visibility).toBe(false);
        bottomStatus.visibility = true;
        return expect(bottomStatus.visibility).toBe(true);
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFtZXMvLmF0b20vcGFja2FnZXMvbGludGVyL3NwZWMvdWkvYm90dG9tLXN0YXR1cy1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBLFFBQUEsQ0FBUyx1QkFBVCxFQUFrQyxTQUFBO0FBQ2hDLFFBQUE7SUFBQSxZQUFBLEdBQWUsT0FBQSxDQUFRLDRCQUFSO0lBQ2YsWUFBQSxHQUFlO0lBRWYsVUFBQSxDQUFXLFNBQUE7YUFDVCxZQUFBLEdBQWUsSUFBSTtJQURWLENBQVg7V0FHQSxRQUFBLENBQVMsY0FBVCxFQUF5QixTQUFBO01BQ3ZCLEVBQUEsQ0FBRyx1Q0FBSCxFQUE0QyxTQUFBO1FBQzFDLE1BQUEsQ0FBTyxZQUFZLENBQUMsWUFBYixDQUEwQixRQUExQixDQUFQLENBQTJDLENBQUMsSUFBNUMsQ0FBaUQsS0FBakQ7UUFDQSxZQUFZLENBQUMsVUFBYixHQUEwQjtRQUMxQixNQUFBLENBQU8sWUFBWSxDQUFDLFlBQWIsQ0FBMEIsUUFBMUIsQ0FBUCxDQUEyQyxDQUFDLElBQTVDLENBQWlELEtBQWpEO1FBQ0EsWUFBWSxDQUFDLFVBQWIsR0FBMEI7UUFDMUIsTUFBQSxDQUFPLFlBQVksQ0FBQyxZQUFiLENBQTBCLFFBQTFCLENBQVAsQ0FBMkMsQ0FBQyxJQUE1QyxDQUFpRCxJQUFqRDtRQUNBLFlBQVksQ0FBQyxVQUFiLEdBQTBCO2VBQzFCLE1BQUEsQ0FBTyxZQUFZLENBQUMsWUFBYixDQUEwQixRQUExQixDQUFQLENBQTJDLENBQUMsSUFBNUMsQ0FBaUQsS0FBakQ7TUFQMEMsQ0FBNUM7YUFTQSxFQUFBLENBQUcsK0NBQUgsRUFBb0QsU0FBQTtRQUNsRCxNQUFBLENBQU8sWUFBWSxDQUFDLFVBQXBCLENBQStCLENBQUMsSUFBaEMsQ0FBcUMsSUFBckM7UUFDQSxZQUFZLENBQUMsVUFBYixHQUEwQjtRQUMxQixNQUFBLENBQU8sWUFBWSxDQUFDLFVBQXBCLENBQStCLENBQUMsSUFBaEMsQ0FBcUMsSUFBckM7UUFDQSxZQUFZLENBQUMsVUFBYixHQUEwQjtRQUMxQixNQUFBLENBQU8sWUFBWSxDQUFDLFVBQXBCLENBQStCLENBQUMsSUFBaEMsQ0FBcUMsS0FBckM7UUFDQSxZQUFZLENBQUMsVUFBYixHQUEwQjtlQUMxQixNQUFBLENBQU8sWUFBWSxDQUFDLFVBQXBCLENBQStCLENBQUMsSUFBaEMsQ0FBcUMsSUFBckM7TUFQa0QsQ0FBcEQ7SUFWdUIsQ0FBekI7RUFQZ0MsQ0FBbEM7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbImRlc2NyaWJlICdCb3R0b20gU3RhdHVzIEVsZW1lbnQnLCAtPlxuICBCb3R0b21TdGF0dXMgPSByZXF1aXJlKCcuLi8uLi9saWIvdWkvYm90dG9tLXN0YXR1cycpXG4gIGJvdHRvbVN0YXR1cyA9IG51bGxcblxuICBiZWZvcmVFYWNoIC0+XG4gICAgYm90dG9tU3RhdHVzID0gbmV3IEJvdHRvbVN0YXR1c1xuXG4gIGRlc2NyaWJlICc6OnZpc2liaWxpdHknLCAtPlxuICAgIGl0ICdhZGRzIGFuZCByZW1vdmVzIHRoZSBoaWRkZW4gYXR0cmlidXRlJywgLT5cbiAgICAgIGV4cGVjdChib3R0b21TdGF0dXMuaGFzQXR0cmlidXRlKCdoaWRkZW4nKSkudG9CZShmYWxzZSlcbiAgICAgIGJvdHRvbVN0YXR1cy52aXNpYmlsaXR5ID0gdHJ1ZVxuICAgICAgZXhwZWN0KGJvdHRvbVN0YXR1cy5oYXNBdHRyaWJ1dGUoJ2hpZGRlbicpKS50b0JlKGZhbHNlKVxuICAgICAgYm90dG9tU3RhdHVzLnZpc2liaWxpdHkgPSBmYWxzZVxuICAgICAgZXhwZWN0KGJvdHRvbVN0YXR1cy5oYXNBdHRyaWJ1dGUoJ2hpZGRlbicpKS50b0JlKHRydWUpXG4gICAgICBib3R0b21TdGF0dXMudmlzaWJpbGl0eSA9IHRydWVcbiAgICAgIGV4cGVjdChib3R0b21TdGF0dXMuaGFzQXR0cmlidXRlKCdoaWRkZW4nKSkudG9CZShmYWxzZSlcblxuICAgIGl0ICdyZXBvcnRzIHRoZSB2aXNpYmlsaXR5IHdoZW4gZ2V0dGVyIGlzIGludm9rZWQnLCAtPlxuICAgICAgZXhwZWN0KGJvdHRvbVN0YXR1cy52aXNpYmlsaXR5KS50b0JlKHRydWUpXG4gICAgICBib3R0b21TdGF0dXMudmlzaWJpbGl0eSA9IHRydWVcbiAgICAgIGV4cGVjdChib3R0b21TdGF0dXMudmlzaWJpbGl0eSkudG9CZSh0cnVlKVxuICAgICAgYm90dG9tU3RhdHVzLnZpc2liaWxpdHkgPSBmYWxzZVxuICAgICAgZXhwZWN0KGJvdHRvbVN0YXR1cy52aXNpYmlsaXR5KS50b0JlKGZhbHNlKVxuICAgICAgYm90dG9tU3RhdHVzLnZpc2liaWxpdHkgPSB0cnVlXG4gICAgICBleHBlY3QoYm90dG9tU3RhdHVzLnZpc2liaWxpdHkpLnRvQmUodHJ1ZSlcbiJdfQ==
