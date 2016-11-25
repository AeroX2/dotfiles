Object.defineProperty(exports, '__esModule', {
  value: true
});

var _atom = require('atom');

'use babel';

exports['default'] = {
  autocompleteManager: null,
  subscriptions: null,

  // Public: Creates AutocompleteManager instances for all active and future editors (soon, just a single AutocompleteManager)
  activate: function activate() {
    this.subscriptions = new _atom.CompositeDisposable();
    return this.requireAutocompleteManagerAsync();
  },

  // Public: Cleans everything up, removes all AutocompleteManager instances
  deactivate: function deactivate() {
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }
    this.subscriptions = null;
    this.autocompleteManager = null;
  },

  requireAutocompleteManagerAsync: function requireAutocompleteManagerAsync(callback) {
    var _this = this;

    if (this.autocompleteManager) {
      if (callback) {
        callback(this.autocompleteManager);
      }
    } else {
      setImmediate(function () {
        var a = _this.getAutocompleteManager();
        if (a && callback) {
          callback(a);
        }
      });
    }
  },

  getAutocompleteManager: function getAutocompleteManager() {
    if (!this.autocompleteManager) {
      var AutocompleteManager = require('./autocomplete-manager');
      this.autocompleteManager = new AutocompleteManager();
      this.subscriptions.add(this.autocompleteManager);
    }

    return this.autocompleteManager;
  },

  consumeSnippets: function consumeSnippets(snippetsManager) {
    return this.requireAutocompleteManagerAsync(function (autocompleteManager) {
      autocompleteManager.setSnippetsManager(snippetsManager);
    });
  },

  /*
  Section: Provider API
  */

  // 1.0.0 API
  // service - {provider: provider1}
  consumeProvider_1_0: function consumeProvider_1_0(service) {
    if (!service || !service.provider) {
      return;
    }
    // TODO API: Deprecate, tell them to upgrade to 3.0
    return this.consumeProvider([service.provider], '1.0.0');
  },

  // 1.1.0 API
  // service - {providers: [provider1, provider2, ...]}
  consumeProvider_1_1: function consumeProvider_1_1(service) {
    if (!service || !service.providers) {
      return;
    }
    // TODO API: Deprecate, tell them to upgrade to 3.0
    return this.consumeProvider(service.providers, '1.1.0');
  },

  // 2.0.0 API
  // providers - either a provider or a list of providers
  consumeProvider_2_0: function consumeProvider_2_0(providers) {
    // TODO API: Deprecate, tell them to upgrade to 3.0
    return this.consumeProvider(providers, '2.0.0');
  },

  // 3.0.0 API
  // providers - either a provider or a list of providers
  consumeProvider_3_0: function consumeProvider_3_0(providers) {
    return this.consumeProvider(providers, '3.0.0');
  },

  consumeProvider: function consumeProvider(providers) {
    var apiVersion = arguments.length <= 1 || arguments[1] === undefined ? '3.0.0' : arguments[1];

    if (!providers) {
      return;
    }
    if (providers && !Array.isArray(providers)) {
      providers = [providers];
    }
    if (!providers.length > 0) {
      return;
    }

    var registrations = new _atom.CompositeDisposable();
    this.requireAutocompleteManagerAsync(function (autocompleteManager) {
      for (var i = 0; i < providers.length; i++) {
        var provider = providers[i];
        registrations.add(autocompleteManager.providerManager.registerProvider(provider, apiVersion));
      }
    });
    return registrations;
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O29CQUVvQyxNQUFNOztBQUYxQyxXQUFXLENBQUE7O3FCQUlJO0FBQ2IscUJBQW1CLEVBQUUsSUFBSTtBQUN6QixlQUFhLEVBQUUsSUFBSTs7O0FBR25CLFVBQVEsRUFBQyxvQkFBRztBQUNWLFFBQUksQ0FBQyxhQUFhLEdBQUcsK0JBQXlCLENBQUE7QUFDOUMsV0FBTyxJQUFJLENBQUMsK0JBQStCLEVBQUUsQ0FBQTtHQUM5Qzs7O0FBR0QsWUFBVSxFQUFDLHNCQUFHO0FBQ1osUUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3RCLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUE7S0FDN0I7QUFDRCxRQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQTtBQUN6QixRQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFBO0dBQ2hDOztBQUVELGlDQUErQixFQUFDLHlDQUFDLFFBQVEsRUFBRTs7O0FBQ3pDLFFBQUksSUFBSSxDQUFDLG1CQUFtQixFQUFFO0FBQzVCLFVBQUksUUFBUSxFQUFFO0FBQ1osZ0JBQVEsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQTtPQUNuQztLQUNGLE1BQU07QUFDTCxrQkFBWSxDQUFDLFlBQU07QUFDakIsWUFBTSxDQUFDLEdBQUcsTUFBSyxzQkFBc0IsRUFBRSxDQUFBO0FBQ3ZDLFlBQUksQ0FBQyxJQUFJLFFBQVEsRUFBRTtBQUNqQixrQkFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQ1o7T0FDRixDQUFDLENBQUE7S0FDSDtHQUNGOztBQUVELHdCQUFzQixFQUFDLGtDQUFHO0FBQ3hCLFFBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUU7QUFDN0IsVUFBTSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQTtBQUM3RCxVQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFBO0FBQ3BELFVBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO0tBQ2pEOztBQUVELFdBQU8sSUFBSSxDQUFDLG1CQUFtQixDQUFBO0dBQ2hDOztBQUVELGlCQUFlLEVBQUMseUJBQUMsZUFBZSxFQUFFO0FBQ2hDLFdBQU8sSUFBSSxDQUFDLCtCQUErQixDQUFDLFVBQUMsbUJBQW1CLEVBQUs7QUFDbkUseUJBQW1CLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDLENBQUE7S0FDeEQsQ0FBQyxDQUFBO0dBQ0g7Ozs7Ozs7O0FBUUQscUJBQW1CLEVBQUMsNkJBQUMsT0FBTyxFQUFFO0FBQzVCLFFBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFO0FBQ2pDLGFBQU07S0FDUDs7QUFFRCxXQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUE7R0FDekQ7Ozs7QUFJRCxxQkFBbUIsRUFBQyw2QkFBQyxPQUFPLEVBQUU7QUFDNUIsUUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7QUFDbEMsYUFBTTtLQUNQOztBQUVELFdBQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0dBQ3hEOzs7O0FBSUQscUJBQW1CLEVBQUMsNkJBQUMsU0FBUyxFQUFFOztBQUU5QixXQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0dBQ2hEOzs7O0FBSUQscUJBQW1CLEVBQUMsNkJBQUMsU0FBUyxFQUFFO0FBQzlCLFdBQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUE7R0FDaEQ7O0FBRUQsaUJBQWUsRUFBQyx5QkFBQyxTQUFTLEVBQXdCO1FBQXRCLFVBQVUseURBQUcsT0FBTzs7QUFDOUMsUUFBSSxDQUFDLFNBQVMsRUFBRTtBQUNkLGFBQU07S0FDUDtBQUNELFFBQUksU0FBUyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUMxQyxlQUFTLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQTtLQUN4QjtBQUNELFFBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUN6QixhQUFNO0tBQ1A7O0FBRUQsUUFBTSxhQUFhLEdBQUcsK0JBQXlCLENBQUE7QUFDL0MsUUFBSSxDQUFDLCtCQUErQixDQUFDLFVBQUMsbUJBQW1CLEVBQUs7QUFDNUQsV0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDekMsWUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFBO0FBQzdCLHFCQUFhLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQTtPQUM5RjtLQUNGLENBQUMsQ0FBQTtBQUNGLFdBQU8sYUFBYSxDQUFBO0dBQ3JCO0NBQ0YiLCJmaWxlIjoiL2hvbWUvamFtZXMvZ2l0aHViL2F1dG9jb21wbGV0ZS1wbHVzL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgYXV0b2NvbXBsZXRlTWFuYWdlcjogbnVsbCxcbiAgc3Vic2NyaXB0aW9uczogbnVsbCxcblxuICAvLyBQdWJsaWM6IENyZWF0ZXMgQXV0b2NvbXBsZXRlTWFuYWdlciBpbnN0YW5jZXMgZm9yIGFsbCBhY3RpdmUgYW5kIGZ1dHVyZSBlZGl0b3JzIChzb29uLCBqdXN0IGEgc2luZ2xlIEF1dG9jb21wbGV0ZU1hbmFnZXIpXG4gIGFjdGl2YXRlICgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgcmV0dXJuIHRoaXMucmVxdWlyZUF1dG9jb21wbGV0ZU1hbmFnZXJBc3luYygpXG4gIH0sXG5cbiAgLy8gUHVibGljOiBDbGVhbnMgZXZlcnl0aGluZyB1cCwgcmVtb3ZlcyBhbGwgQXV0b2NvbXBsZXRlTWFuYWdlciBpbnN0YW5jZXNcbiAgZGVhY3RpdmF0ZSAoKSB7XG4gICAgaWYgKHRoaXMuc3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIH1cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgdGhpcy5hdXRvY29tcGxldGVNYW5hZ2VyID0gbnVsbFxuICB9LFxuXG4gIHJlcXVpcmVBdXRvY29tcGxldGVNYW5hZ2VyQXN5bmMgKGNhbGxiYWNrKSB7XG4gICAgaWYgKHRoaXMuYXV0b2NvbXBsZXRlTWFuYWdlcikge1xuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKHRoaXMuYXV0b2NvbXBsZXRlTWFuYWdlcilcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2V0SW1tZWRpYXRlKCgpID0+IHtcbiAgICAgICAgY29uc3QgYSA9IHRoaXMuZ2V0QXV0b2NvbXBsZXRlTWFuYWdlcigpXG4gICAgICAgIGlmIChhICYmIGNhbGxiYWNrKSB7XG4gICAgICAgICAgY2FsbGJhY2soYSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH0sXG5cbiAgZ2V0QXV0b2NvbXBsZXRlTWFuYWdlciAoKSB7XG4gICAgaWYgKCF0aGlzLmF1dG9jb21wbGV0ZU1hbmFnZXIpIHtcbiAgICAgIGNvbnN0IEF1dG9jb21wbGV0ZU1hbmFnZXIgPSByZXF1aXJlKCcuL2F1dG9jb21wbGV0ZS1tYW5hZ2VyJylcbiAgICAgIHRoaXMuYXV0b2NvbXBsZXRlTWFuYWdlciA9IG5ldyBBdXRvY29tcGxldGVNYW5hZ2VyKClcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5hdXRvY29tcGxldGVNYW5hZ2VyKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmF1dG9jb21wbGV0ZU1hbmFnZXJcbiAgfSxcblxuICBjb25zdW1lU25pcHBldHMgKHNuaXBwZXRzTWFuYWdlcikge1xuICAgIHJldHVybiB0aGlzLnJlcXVpcmVBdXRvY29tcGxldGVNYW5hZ2VyQXN5bmMoKGF1dG9jb21wbGV0ZU1hbmFnZXIpID0+IHtcbiAgICAgIGF1dG9jb21wbGV0ZU1hbmFnZXIuc2V0U25pcHBldHNNYW5hZ2VyKHNuaXBwZXRzTWFuYWdlcilcbiAgICB9KVxuICB9LFxuXG4gIC8qXG4gIFNlY3Rpb246IFByb3ZpZGVyIEFQSVxuICAqL1xuXG4gIC8vIDEuMC4wIEFQSVxuICAvLyBzZXJ2aWNlIC0ge3Byb3ZpZGVyOiBwcm92aWRlcjF9XG4gIGNvbnN1bWVQcm92aWRlcl8xXzAgKHNlcnZpY2UpIHtcbiAgICBpZiAoIXNlcnZpY2UgfHwgIXNlcnZpY2UucHJvdmlkZXIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICAvLyBUT0RPIEFQSTogRGVwcmVjYXRlLCB0ZWxsIHRoZW0gdG8gdXBncmFkZSB0byAzLjBcbiAgICByZXR1cm4gdGhpcy5jb25zdW1lUHJvdmlkZXIoW3NlcnZpY2UucHJvdmlkZXJdLCAnMS4wLjAnKVxuICB9LFxuXG4gIC8vIDEuMS4wIEFQSVxuICAvLyBzZXJ2aWNlIC0ge3Byb3ZpZGVyczogW3Byb3ZpZGVyMSwgcHJvdmlkZXIyLCAuLi5dfVxuICBjb25zdW1lUHJvdmlkZXJfMV8xIChzZXJ2aWNlKSB7XG4gICAgaWYgKCFzZXJ2aWNlIHx8ICFzZXJ2aWNlLnByb3ZpZGVycykge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIC8vIFRPRE8gQVBJOiBEZXByZWNhdGUsIHRlbGwgdGhlbSB0byB1cGdyYWRlIHRvIDMuMFxuICAgIHJldHVybiB0aGlzLmNvbnN1bWVQcm92aWRlcihzZXJ2aWNlLnByb3ZpZGVycywgJzEuMS4wJylcbiAgfSxcblxuICAvLyAyLjAuMCBBUElcbiAgLy8gcHJvdmlkZXJzIC0gZWl0aGVyIGEgcHJvdmlkZXIgb3IgYSBsaXN0IG9mIHByb3ZpZGVyc1xuICBjb25zdW1lUHJvdmlkZXJfMl8wIChwcm92aWRlcnMpIHtcbiAgICAvLyBUT0RPIEFQSTogRGVwcmVjYXRlLCB0ZWxsIHRoZW0gdG8gdXBncmFkZSB0byAzLjBcbiAgICByZXR1cm4gdGhpcy5jb25zdW1lUHJvdmlkZXIocHJvdmlkZXJzLCAnMi4wLjAnKVxuICB9LFxuXG4gIC8vIDMuMC4wIEFQSVxuICAvLyBwcm92aWRlcnMgLSBlaXRoZXIgYSBwcm92aWRlciBvciBhIGxpc3Qgb2YgcHJvdmlkZXJzXG4gIGNvbnN1bWVQcm92aWRlcl8zXzAgKHByb3ZpZGVycykge1xuICAgIHJldHVybiB0aGlzLmNvbnN1bWVQcm92aWRlcihwcm92aWRlcnMsICczLjAuMCcpXG4gIH0sXG5cbiAgY29uc3VtZVByb3ZpZGVyIChwcm92aWRlcnMsIGFwaVZlcnNpb24gPSAnMy4wLjAnKSB7XG4gICAgaWYgKCFwcm92aWRlcnMpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAocHJvdmlkZXJzICYmICFBcnJheS5pc0FycmF5KHByb3ZpZGVycykpIHtcbiAgICAgIHByb3ZpZGVycyA9IFtwcm92aWRlcnNdXG4gICAgfVxuICAgIGlmICghcHJvdmlkZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHJlZ2lzdHJhdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgdGhpcy5yZXF1aXJlQXV0b2NvbXBsZXRlTWFuYWdlckFzeW5jKChhdXRvY29tcGxldGVNYW5hZ2VyKSA9PiB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwcm92aWRlciA9IHByb3ZpZGVyc1tpXVxuICAgICAgICByZWdpc3RyYXRpb25zLmFkZChhdXRvY29tcGxldGVNYW5hZ2VyLnByb3ZpZGVyTWFuYWdlci5yZWdpc3RlclByb3ZpZGVyKHByb3ZpZGVyLCBhcGlWZXJzaW9uKSlcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiByZWdpc3RyYXRpb25zXG4gIH1cbn1cbiJdfQ==