Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _atom = require('atom');

var _typeHelpers = require('./type-helpers');

var _semver = require('semver');

var _semver2 = _interopRequireDefault(_semver);

var _selectorKit = require('selector-kit');

var _stable = require('stable');

var _stable2 = _interopRequireDefault(_stable);

var _scopeHelpers = require('./scope-helpers');

var _privateSymbols = require('./private-symbols');

// Deferred requires
'use babel';

var SymbolProvider = null;
var FuzzyProvider = null;
var grim = null;
var ProviderMetadata = null;

var ProviderManager = (function () {
  function ProviderManager() {
    var _this = this;

    _classCallCheck(this, ProviderManager);

    this.defaultProvider = null;
    this.defaultProviderRegistration = null;
    this.providers = null;
    this.store = null;
    this.subscriptions = null;
    this.globalBlacklist = null;
    this.applicableProviders = this.applicableProviders.bind(this);
    this.toggleDefaultProvider = this.toggleDefaultProvider.bind(this);
    this.setGlobalBlacklist = this.setGlobalBlacklist.bind(this);
    this.metadataForProvider = this.metadataForProvider.bind(this);
    this.apiVersionForProvider = this.apiVersionForProvider.bind(this);
    this.addProvider = this.addProvider.bind(this);
    this.removeProvider = this.removeProvider.bind(this);
    this.registerProvider = this.registerProvider.bind(this);
    this.subscriptions = new _atom.CompositeDisposable();
    this.globalBlacklist = new _atom.CompositeDisposable();
    this.subscriptions.add(this.globalBlacklist);
    this.providers = [];
    this.subscriptions.add(atom.config.observe('autocomplete-plus.enableBuiltinProvider', function (value) {
      return _this.toggleDefaultProvider(value);
    }));
    this.subscriptions.add(atom.config.observe('autocomplete-plus.scopeBlacklist', function (value) {
      return _this.setGlobalBlacklist(value);
    }));
  }

  _createClass(ProviderManager, [{
    key: 'dispose',
    value: function dispose() {
      this.toggleDefaultProvider(false);
      if (this.subscriptions && this.subscriptions.dispose) {
        this.subscriptions.dispose();
      }
      this.subscriptions = null;
      this.globalBlacklist = null;
      this.providers = null;
    }
  }, {
    key: 'applicableProviders',
    value: function applicableProviders(editor, scopeDescriptor) {
      var providers = this.filterProvidersByEditor(this.providers, editor);
      providers = this.filterProvidersByScopeDescriptor(providers, scopeDescriptor);
      providers = this.sortProviders(providers, scopeDescriptor);
      providers = this.filterProvidersByExcludeLowerPriority(providers);
      return this.removeMetadata(providers);
    }
  }, {
    key: 'filterProvidersByScopeDescriptor',
    value: function filterProvidersByScopeDescriptor(providers, scopeDescriptor) {
      var scopeChain = scopeChainForScopeDescriptor(scopeDescriptor);
      if (!scopeChain) {
        return [];
      }
      if (this.globalBlacklistSelectors != null && (0, _scopeHelpers.selectorsMatchScopeChain)(this.globalBlacklistSelectors, scopeChain)) {
        return [];
      }

      var matchingProviders = [];
      var disableDefaultProvider = false;
      var defaultProviderMetadata = null;
      for (var i = 0; i < providers.length; i++) {
        var providerMetadata = providers[i];
        var provider = providerMetadata.provider;

        if (provider === this.defaultProvider) {
          defaultProviderMetadata = providerMetadata;
        }
        if (providerMetadata.matchesScopeChain(scopeChain)) {
          matchingProviders.push(providerMetadata);
          if (providerMetadata.shouldDisableDefaultProvider(scopeChain)) {
            disableDefaultProvider = true;
          }
        }
      }

      if (disableDefaultProvider) {
        var index = matchingProviders.indexOf(defaultProviderMetadata);
        if (index > -1) {
          matchingProviders.splice(index, 1);
        }
      }
      return matchingProviders;
    }
  }, {
    key: 'sortProviders',
    value: function sortProviders(providers, scopeDescriptor) {
      var scopeChain = scopeChainForScopeDescriptor(scopeDescriptor);
      return (0, _stable2['default'])(providers, function (providerA, providerB) {
        var priorityA = providerA.provider.suggestionPriority != null ? providerA.provider.suggestionPriority : 1;
        var priorityB = providerB.provider.suggestionPriority != null ? providerB.provider.suggestionPriority : 1;
        var difference = priorityB - priorityA;
        if (difference === 0) {
          var specificityA = providerA.getSpecificity(scopeChain);
          var specificityB = providerB.getSpecificity(scopeChain);
          difference = specificityB - specificityA;
        }
        return difference;
      });
    }
  }, {
    key: 'filterProvidersByEditor',
    value: function filterProvidersByEditor(providers, editor) {
      return providers.filter(function (providerMetadata) {
        return providerMetadata.matchesEditor(editor);
      });
    }
  }, {
    key: 'filterProvidersByExcludeLowerPriority',
    value: function filterProvidersByExcludeLowerPriority(providers) {
      var lowestAllowedPriority = 0;
      for (var i = 0; i < providers.length; i++) {
        var providerMetadata = providers[i];
        var provider = providerMetadata.provider;

        if (provider.excludeLowerPriority) {
          lowestAllowedPriority = Math.max(lowestAllowedPriority, provider.inclusionPriority != null ? provider.inclusionPriority : 0);
        }
      }
      return providers.filter(function (providerMetadata) {
        return (providerMetadata.provider.inclusionPriority != null ? providerMetadata.provider.inclusionPriority : 0) >= lowestAllowedPriority;
      }).map(function (providerMetadata) {
        return providerMetadata;
      });
    }
  }, {
    key: 'removeMetadata',
    value: function removeMetadata(providers) {
      return providers.map(function (providerMetadata) {
        return providerMetadata.provider;
      });
    }
  }, {
    key: 'toggleDefaultProvider',
    value: function toggleDefaultProvider(enabled) {
      if (enabled == null) {
        return;
      }

      if (enabled) {
        if (this.defaultProvider != null || this.defaultProviderRegistration != null) {
          return;
        }
        if (atom.config.get('autocomplete-plus.defaultProvider') === 'Symbol') {
          if (typeof SymbolProvider === 'undefined' || SymbolProvider === null) {
            SymbolProvider = require('./symbol-provider');
          }
          this.defaultProvider = new SymbolProvider();
        } else {
          if (typeof FuzzyProvider === 'undefined' || FuzzyProvider === null) {
            FuzzyProvider = require('./fuzzy-provider');
          }
          this.defaultProvider = new FuzzyProvider();
        }
        this.defaultProviderRegistration = this.registerProvider(this.defaultProvider);
      } else {
        if (this.defaultProviderRegistration) {
          this.defaultProviderRegistration.dispose();
        }
        if (this.defaultProvider) {
          this.defaultProvider.dispose();
        }
        this.defaultProviderRegistration = null;
        this.defaultProvider = null;
      }
    }
  }, {
    key: 'setGlobalBlacklist',
    value: function setGlobalBlacklist(globalBlacklist) {
      this.globalBlacklistSelectors = null;
      if (globalBlacklist && globalBlacklist.length) {
        this.globalBlacklistSelectors = _selectorKit.Selector.create(globalBlacklist);
      }
    }
  }, {
    key: 'isValidProvider',
    value: function isValidProvider(provider, apiVersion) {
      // TODO API: Check based on the apiVersion
      if (_semver2['default'].satisfies(apiVersion, '>=2.0.0')) {
        return provider != null && (0, _typeHelpers.isFunction)(provider.getSuggestions) && ((0, _typeHelpers.isString)(provider.selector) && !!provider.selector.length || (0, _typeHelpers.isString)(provider.scopeSelector) && !!provider.scopeSelector.length);
      } else {
        return provider != null && (0, _typeHelpers.isFunction)(provider.requestHandler) && (0, _typeHelpers.isString)(provider.selector) && !!provider.selector.length;
      }
    }
  }, {
    key: 'metadataForProvider',
    value: function metadataForProvider(provider) {
      for (var i = 0; i < this.providers.length; i++) {
        var providerMetadata = this.providers[i];
        if (providerMetadata.provider === provider) {
          return providerMetadata;
        }
      }
      return null;
    }
  }, {
    key: 'apiVersionForProvider',
    value: function apiVersionForProvider(provider) {
      if (this.metadataForProvider(provider) && this.metadataForProvider(provider).apiVersion) {
        return this.metadataForProvider(provider).apiVersion;
      }
    }
  }, {
    key: 'isProviderRegistered',
    value: function isProviderRegistered(provider) {
      return this.metadataForProvider(provider) != null;
    }
  }, {
    key: 'addProvider',
    value: function addProvider(provider) {
      var apiVersion = arguments.length <= 1 || arguments[1] === undefined ? '3.0.0' : arguments[1];

      if (this.isProviderRegistered(provider)) {
        return;
      }
      if (typeof ProviderMetadata === 'undefined' || ProviderMetadata === null) {
        ProviderMetadata = require('./provider-metadata');
      }
      this.providers.push(new ProviderMetadata(provider, apiVersion));
      if (provider.dispose != null) {
        return this.subscriptions.add(provider);
      }
    }
  }, {
    key: 'removeProvider',
    value: function removeProvider(provider) {
      if (!this.providers) {
        return;
      }
      for (var i = 0; i < this.providers.length; i++) {
        var providerMetadata = this.providers[i];
        if (providerMetadata.provider === provider) {
          this.providers.splice(i, 1);
          break;
        }
      }
      if (provider.dispose != null) {
        if (this.subscriptions) {
          this.subscriptions.remove(provider);
        }
      }
    }
  }, {
    key: 'registerProvider',
    value: function registerProvider(provider) {
      var _this2 = this;

      var apiVersion = arguments.length <= 1 || arguments[1] === undefined ? '3.0.0' : arguments[1];

      if (provider == null) {
        return;
      }

      provider[_privateSymbols.API_VERSION] = apiVersion;

      var apiIs200 = _semver2['default'].satisfies(apiVersion, '>=2.0.0');
      var apiIs300 = _semver2['default'].satisfies(apiVersion, '>=3.0.0');

      if (apiIs200) {
        if (provider.id != null && provider !== this.defaultProvider) {
          if (typeof grim === 'undefined' || grim === null) {
            grim = require('grim');
          }
          grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\ncontains an `id` property.\nAn `id` attribute on your provider is no longer necessary.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
        }
        if (provider.requestHandler != null) {
          if (typeof grim === 'undefined' || grim === null) {
            grim = require('grim');
          }
          grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\ncontains a `requestHandler` property.\n`requestHandler` has been renamed to `getSuggestions`.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
        }
        if (provider.blacklist != null) {
          if (typeof grim === 'undefined' || grim === null) {
            grim = require('grim');
          }
          grim.deprecate('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\ncontains a `blacklist` property.\n`blacklist` has been renamed to `disableForScopeSelector`.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API');
        }
      }

      if (apiIs300) {
        if (provider.selector != null) {
          throw new Error('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nspecifies `selector` instead of the `scopeSelector` attribute.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API.');
        }

        if (provider.disableForSelector != null) {
          throw new Error('Autocomplete provider \'' + provider.constructor.name + '(' + provider.id + ')\'\nspecifies `disableForSelector` instead of the `disableForScopeSelector`\nattribute.\nSee https://github.com/atom/autocomplete-plus/wiki/Provider-API.');
        }
      }

      if (!this.isValidProvider(provider, apiVersion)) {
        console.warn('Provider ' + provider.constructor.name + ' is not valid', provider);
        return new _atom.Disposable();
      }

      if (this.isProviderRegistered(provider)) {
        return;
      }

      this.addProvider(provider, apiVersion);

      var disposable = new _atom.Disposable(function () {
        _this2.removeProvider(provider);
      });

      // When the provider is disposed, remove its registration
      var originalDispose = provider.dispose;
      if (originalDispose) {
        provider.dispose = function () {
          originalDispose.call(provider);
          disposable.dispose();
        };
      }

      return disposable;
    }
  }]);

  return ProviderManager;
})();

exports['default'] = ProviderManager;

var scopeChainForScopeDescriptor = function scopeChainForScopeDescriptor(scopeDescriptor) {
  // TODO: most of this is temp code to understand #308
  var type = typeof scopeDescriptor;
  var hasScopeChain = false;
  if (type === 'object' && scopeDescriptor && scopeDescriptor.getScopeChain) {
    hasScopeChain = true;
  }
  if (type === 'string') {
    return scopeDescriptor;
  } else if (type === 'object' && hasScopeChain) {
    var scopeChain = scopeDescriptor.getScopeChain();
    if (scopeChain != null && scopeChain.replace == null) {
      var json = JSON.stringify(scopeDescriptor);
      console.log(scopeDescriptor, json);
      throw new Error('01: ScopeChain is not correct type: ' + type + '; ' + json);
    }
    return scopeChain;
  } else {
    var json = JSON.stringify(scopeDescriptor);
    console.log(scopeDescriptor, json);
    throw new Error('02: ScopeChain is not correct type: ' + type + '; ' + json);
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2phbWVzL2dpdGh1Yi9hdXRvY29tcGxldGUtcGx1cy9saWIvcHJvdmlkZXItbWFuYWdlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O29CQUVnRCxNQUFNOzsyQkFDakIsZ0JBQWdCOztzQkFDbEMsUUFBUTs7OzsyQkFDRixjQUFjOztzQkFDaEIsUUFBUTs7Ozs0QkFFVSxpQkFBaUI7OzhCQUM5QixtQkFBbUI7OztBQVQvQyxXQUFXLENBQUE7O0FBWVgsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFBO0FBQ3pCLElBQUksYUFBYSxHQUFHLElBQUksQ0FBQTtBQUN4QixJQUFJLElBQUksR0FBRyxJQUFJLENBQUE7QUFDZixJQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQTs7SUFFTixlQUFlO0FBQ3RCLFdBRE8sZUFBZSxHQUNuQjs7OzBCQURJLGVBQWU7O0FBRWhDLFFBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFBO0FBQzNCLFFBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUE7QUFDdkMsUUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUE7QUFDckIsUUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7QUFDakIsUUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUE7QUFDekIsUUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUE7QUFDM0IsUUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDOUQsUUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDbEUsUUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDNUQsUUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FB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RTtBQUNyQixXQUFPLGVBQWUsQ0FBQTtHQUN2QixNQUFNLElBQUksSUFBSSxLQUFLLFFBQVEsSUFBSSxhQUFhLEVBQUU7QUFDN0MsUUFBTSxVQUFVLEdBQUcsZUFBZSxDQUFDLGFBQWEsRUFBRSxDQUFBO0FBQ2xELFFBQUksQUFBQyxVQUFVLElBQUksSUFBSSxJQUFNLFVBQVUsQ0FBQyxPQUFPLElBQUksSUFBSSxBQUFDLEVBQUU7QUFDeEQsVUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQTtBQUM1QyxhQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUNsQyxZQUFNLElBQUksS0FBSywwQ0FBd0MsSUFBSSxVQUFLLElBQUksQ0FBRyxDQUFBO0tBQ3hFO0FBQ0QsV0FBTyxVQUFVLENBQUE7R0FDbEIsTUFBTTtBQUNMLFFBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUE7QUFDNUMsV0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUE7QUFDbEMsVUFBTSxJQUFJLEtBQUssMENBQXdDLElBQUksVUFBSyxJQUFJLENBQUcsQ0FBQTtHQUN4RTtDQUNGLENBQUEiLCJmaWxlIjoiL2hvbWUvamFtZXMvZ2l0aHViL2F1dG9jb21wbGV0ZS1wbHVzL2xpYi9wcm92aWRlci1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCdcblxuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgeyBpc0Z1bmN0aW9uLCBpc1N0cmluZyB9IGZyb20gJy4vdHlwZS1oZWxwZXJzJ1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInXG5pbXBvcnQgeyBTZWxlY3RvciB9IGZyb20gJ3NlbGVjdG9yLWtpdCdcbmltcG9ydCBzdGFibGVTb3J0IGZyb20gJ3N0YWJsZSdcblxuaW1wb3J0IHsgc2VsZWN0b3JzTWF0Y2hTY29wZUNoYWluIH0gZnJvbSAnLi9zY29wZS1oZWxwZXJzJ1xuaW1wb3J0IHsgQVBJX1ZFUlNJT04gfSBmcm9tICcuL3ByaXZhdGUtc3ltYm9scydcblxuLy8gRGVmZXJyZWQgcmVxdWlyZXNcbmxldCBTeW1ib2xQcm92aWRlciA9IG51bGxcbmxldCBGdXp6eVByb3ZpZGVyID0gbnVsbFxubGV0IGdyaW0gPSBudWxsXG5sZXQgUHJvdmlkZXJNZXRhZGF0YSA9IG51bGxcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJvdmlkZXJNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMuZGVmYXVsdFByb3ZpZGVyID0gbnVsbFxuICAgIHRoaXMuZGVmYXVsdFByb3ZpZGVyUmVnaXN0cmF0aW9uID0gbnVsbFxuICAgIHRoaXMucHJvdmlkZXJzID0gbnVsbFxuICAgIHRoaXMuc3RvcmUgPSBudWxsXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbnVsbFxuICAgIHRoaXMuZ2xvYmFsQmxhY2tsaXN0ID0gbnVsbFxuICAgIHRoaXMuYXBwbGljYWJsZVByb3ZpZGVycyA9IHRoaXMuYXBwbGljYWJsZVByb3ZpZGVycy5iaW5kKHRoaXMpXG4gICAgdGhpcy50b2dnbGVEZWZhdWx0UHJvdmlkZXIgPSB0aGlzLnRvZ2dsZURlZmF1bHRQcm92aWRlci5iaW5kKHRoaXMpXG4gICAgdGhpcy5zZXRHbG9iYWxCbGFja2xpc3QgPSB0aGlzLnNldEdsb2JhbEJsYWNrbGlzdC5iaW5kKHRoaXMpXG4gICAgdGhpcy5tZXRhZGF0YUZvclByb3ZpZGVyID0gdGhpcy5tZXRhZGF0YUZvclByb3ZpZGVyLmJpbmQodGhpcylcbiAgICB0aGlzLmFwaVZlcnNpb25Gb3JQcm92aWRlciA9IHRoaXMuYXBpVmVyc2lvbkZvclByb3ZpZGVyLmJpbmQodGhpcylcbiAgICB0aGlzLmFkZFByb3ZpZGVyID0gdGhpcy5hZGRQcm92aWRlci5iaW5kKHRoaXMpXG4gICAgdGhpcy5yZW1vdmVQcm92aWRlciA9IHRoaXMucmVtb3ZlUHJvdmlkZXIuYmluZCh0aGlzKVxuICAgIHRoaXMucmVnaXN0ZXJQcm92aWRlciA9IHRoaXMucmVnaXN0ZXJQcm92aWRlci5iaW5kKHRoaXMpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIHRoaXMuZ2xvYmFsQmxhY2tsaXN0ID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5nbG9iYWxCbGFja2xpc3QpXG4gICAgdGhpcy5wcm92aWRlcnMgPSBbXVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnYXV0b2NvbXBsZXRlLXBsdXMuZW5hYmxlQnVpbHRpblByb3ZpZGVyJywgdmFsdWUgPT4gdGhpcy50b2dnbGVEZWZhdWx0UHJvdmlkZXIodmFsdWUpKSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2F1dG9jb21wbGV0ZS1wbHVzLnNjb3BlQmxhY2tsaXN0JywgdmFsdWUgPT4gdGhpcy5zZXRHbG9iYWxCbGFja2xpc3QodmFsdWUpKSlcbiAgfVxuXG4gIGRpc3Bvc2UgKCkge1xuICAgIHRoaXMudG9nZ2xlRGVmYXVsdFByb3ZpZGVyKGZhbHNlKVxuICAgIGlmICh0aGlzLnN1YnNjcmlwdGlvbnMgJiYgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UpIHtcbiAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICB9XG4gICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbnVsbFxuICAgIHRoaXMuZ2xvYmFsQmxhY2tsaXN0ID0gbnVsbFxuICAgIHRoaXMucHJvdmlkZXJzID0gbnVsbFxuICB9XG5cbiAgYXBwbGljYWJsZVByb3ZpZGVycyAoZWRpdG9yLCBzY29wZURlc2NyaXB0b3IpIHtcbiAgICBsZXQgcHJvdmlkZXJzID0gdGhpcy5maWx0ZXJQcm92aWRlcnNCeUVkaXRvcih0aGlzLnByb3ZpZGVycywgZWRpdG9yKVxuICAgIHByb3ZpZGVycyA9IHRoaXMuZmlsdGVyUHJvdmlkZXJzQnlTY29wZURlc2NyaXB0b3IocHJvdmlkZXJzLCBzY29wZURlc2NyaXB0b3IpXG4gICAgcHJvdmlkZXJzID0gdGhpcy5zb3J0UHJvdmlkZXJzKHByb3ZpZGVycywgc2NvcGVEZXNjcmlwdG9yKVxuICAgIHByb3ZpZGVycyA9IHRoaXMuZmlsdGVyUHJvdmlkZXJzQnlFeGNsdWRlTG93ZXJQcmlvcml0eShwcm92aWRlcnMpXG4gICAgcmV0dXJuIHRoaXMucmVtb3ZlTWV0YWRhdGEocHJvdmlkZXJzKVxuICB9XG5cbiAgZmlsdGVyUHJvdmlkZXJzQnlTY29wZURlc2NyaXB0b3IgKHByb3ZpZGVycywgc2NvcGVEZXNjcmlwdG9yKSB7XG4gICAgY29uc3Qgc2NvcGVDaGFpbiA9IHNjb3BlQ2hhaW5Gb3JTY29wZURlc2NyaXB0b3Ioc2NvcGVEZXNjcmlwdG9yKVxuICAgIGlmICghc2NvcGVDaGFpbikgeyByZXR1cm4gW10gfVxuICAgIGlmICgodGhpcy5nbG9iYWxCbGFja2xpc3RTZWxlY3RvcnMgIT0gbnVsbCkgJiYgc2VsZWN0b3JzTWF0Y2hTY29wZUNoYWluKHRoaXMuZ2xvYmFsQmxhY2tsaXN0U2VsZWN0b3JzLCBzY29wZUNoYWluKSkgeyByZXR1cm4gW10gfVxuXG4gICAgY29uc3QgbWF0Y2hpbmdQcm92aWRlcnMgPSBbXVxuICAgIGxldCBkaXNhYmxlRGVmYXVsdFByb3ZpZGVyID0gZmFsc2VcbiAgICBsZXQgZGVmYXVsdFByb3ZpZGVyTWV0YWRhdGEgPSBudWxsXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHByb3ZpZGVyTWV0YWRhdGEgPSBwcm92aWRlcnNbaV1cbiAgICAgIGNvbnN0IHtwcm92aWRlcn0gPSBwcm92aWRlck1ldGFkYXRhXG4gICAgICBpZiAocHJvdmlkZXIgPT09IHRoaXMuZGVmYXVsdFByb3ZpZGVyKSB7XG4gICAgICAgIGRlZmF1bHRQcm92aWRlck1ldGFkYXRhID0gcHJvdmlkZXJNZXRhZGF0YVxuICAgICAgfVxuICAgICAgaWYgKHByb3ZpZGVyTWV0YWRhdGEubWF0Y2hlc1Njb3BlQ2hhaW4oc2NvcGVDaGFpbikpIHtcbiAgICAgICAgbWF0Y2hpbmdQcm92aWRlcnMucHVzaChwcm92aWRlck1ldGFkYXRhKVxuICAgICAgICBpZiAocHJvdmlkZXJNZXRhZGF0YS5zaG91bGREaXNhYmxlRGVmYXVsdFByb3ZpZGVyKHNjb3BlQ2hhaW4pKSB7XG4gICAgICAgICAgZGlzYWJsZURlZmF1bHRQcm92aWRlciA9IHRydWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkaXNhYmxlRGVmYXVsdFByb3ZpZGVyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IG1hdGNoaW5nUHJvdmlkZXJzLmluZGV4T2YoZGVmYXVsdFByb3ZpZGVyTWV0YWRhdGEpXG4gICAgICBpZiAoaW5kZXggPiAtMSkgeyBtYXRjaGluZ1Byb3ZpZGVycy5zcGxpY2UoaW5kZXgsIDEpIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoaW5nUHJvdmlkZXJzXG4gIH1cblxuICBzb3J0UHJvdmlkZXJzIChwcm92aWRlcnMsIHNjb3BlRGVzY3JpcHRvcikge1xuICAgIGNvbnN0IHNjb3BlQ2hhaW4gPSBzY29wZUNoYWluRm9yU2NvcGVEZXNjcmlwdG9yKHNjb3BlRGVzY3JpcHRvcilcbiAgICByZXR1cm4gc3RhYmxlU29ydChwcm92aWRlcnMsIChwcm92aWRlckEsIHByb3ZpZGVyQikgPT4ge1xuICAgICAgY29uc3QgcHJpb3JpdHlBID0gcHJvdmlkZXJBLnByb3ZpZGVyLnN1Z2dlc3Rpb25Qcmlvcml0eSAhPSBudWxsID8gcHJvdmlkZXJBLnByb3ZpZGVyLnN1Z2dlc3Rpb25Qcmlvcml0eSA6IDFcbiAgICAgIGNvbnN0IHByaW9yaXR5QiA9IHByb3ZpZGVyQi5wcm92aWRlci5zdWdnZXN0aW9uUHJpb3JpdHkgIT0gbnVsbCA/IHByb3ZpZGVyQi5wcm92aWRlci5zdWdnZXN0aW9uUHJpb3JpdHkgOiAxXG4gICAgICBsZXQgZGlmZmVyZW5jZSA9IHByaW9yaXR5QiAtIHByaW9yaXR5QVxuICAgICAgaWYgKGRpZmZlcmVuY2UgPT09IDApIHtcbiAgICAgICAgY29uc3Qgc3BlY2lmaWNpdHlBID0gcHJvdmlkZXJBLmdldFNwZWNpZmljaXR5KHNjb3BlQ2hhaW4pXG4gICAgICAgIGNvbnN0IHNwZWNpZmljaXR5QiA9IHByb3ZpZGVyQi5nZXRTcGVjaWZpY2l0eShzY29wZUNoYWluKVxuICAgICAgICBkaWZmZXJlbmNlID0gc3BlY2lmaWNpdHlCIC0gc3BlY2lmaWNpdHlBXG4gICAgICB9XG4gICAgICByZXR1cm4gZGlmZmVyZW5jZVxuICAgIH1cbiAgICApXG4gIH1cblxuICBmaWx0ZXJQcm92aWRlcnNCeUVkaXRvciAocHJvdmlkZXJzLCBlZGl0b3IpIHtcbiAgICByZXR1cm4gcHJvdmlkZXJzLmZpbHRlcihwcm92aWRlck1ldGFkYXRhID0+IHByb3ZpZGVyTWV0YWRhdGEubWF0Y2hlc0VkaXRvcihlZGl0b3IpKVxuICB9XG5cbiAgZmlsdGVyUHJvdmlkZXJzQnlFeGNsdWRlTG93ZXJQcmlvcml0eSAocHJvdmlkZXJzKSB7XG4gICAgbGV0IGxvd2VzdEFsbG93ZWRQcmlvcml0eSA9IDBcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvdmlkZXJNZXRhZGF0YSA9IHByb3ZpZGVyc1tpXVxuICAgICAgY29uc3Qge3Byb3ZpZGVyfSA9IHByb3ZpZGVyTWV0YWRhdGFcbiAgICAgIGlmIChwcm92aWRlci5leGNsdWRlTG93ZXJQcmlvcml0eSkge1xuICAgICAgICBsb3dlc3RBbGxvd2VkUHJpb3JpdHkgPSBNYXRoLm1heChsb3dlc3RBbGxvd2VkUHJpb3JpdHksIHByb3ZpZGVyLmluY2x1c2lvblByaW9yaXR5ICE9IG51bGwgPyBwcm92aWRlci5pbmNsdXNpb25Qcmlvcml0eSA6IDApXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcm92aWRlcnMuZmlsdGVyKChwcm92aWRlck1ldGFkYXRhKSA9PiAocHJvdmlkZXJNZXRhZGF0YS5wcm92aWRlci5pbmNsdXNpb25Qcmlvcml0eSAhPSBudWxsID8gcHJvdmlkZXJNZXRhZGF0YS5wcm92aWRlci5pbmNsdXNpb25Qcmlvcml0eSA6IDApID49IGxvd2VzdEFsbG93ZWRQcmlvcml0eSkubWFwKChwcm92aWRlck1ldGFkYXRhKSA9PiBwcm92aWRlck1ldGFkYXRhKVxuICB9XG5cbiAgcmVtb3ZlTWV0YWRhdGEgKHByb3ZpZGVycykge1xuICAgIHJldHVybiBwcm92aWRlcnMubWFwKHByb3ZpZGVyTWV0YWRhdGEgPT4gcHJvdmlkZXJNZXRhZGF0YS5wcm92aWRlcilcbiAgfVxuXG4gIHRvZ2dsZURlZmF1bHRQcm92aWRlciAoZW5hYmxlZCkge1xuICAgIGlmIChlbmFibGVkID09IG51bGwpIHsgcmV0dXJuIH1cblxuICAgIGlmIChlbmFibGVkKSB7XG4gICAgICBpZiAoKHRoaXMuZGVmYXVsdFByb3ZpZGVyICE9IG51bGwpIHx8ICh0aGlzLmRlZmF1bHRQcm92aWRlclJlZ2lzdHJhdGlvbiAhPSBudWxsKSkgeyByZXR1cm4gfVxuICAgICAgaWYgKGF0b20uY29uZmlnLmdldCgnYXV0b2NvbXBsZXRlLXBsdXMuZGVmYXVsdFByb3ZpZGVyJykgPT09ICdTeW1ib2wnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgU3ltYm9sUHJvdmlkZXIgPT09ICd1bmRlZmluZWQnIHx8IFN5bWJvbFByb3ZpZGVyID09PSBudWxsKSB7IFN5bWJvbFByb3ZpZGVyID0gcmVxdWlyZSgnLi9zeW1ib2wtcHJvdmlkZXInKSB9XG4gICAgICAgIHRoaXMuZGVmYXVsdFByb3ZpZGVyID0gbmV3IFN5bWJvbFByb3ZpZGVyKClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgRnV6enlQcm92aWRlciA9PT0gJ3VuZGVmaW5lZCcgfHwgRnV6enlQcm92aWRlciA9PT0gbnVsbCkgeyBGdXp6eVByb3ZpZGVyID0gcmVxdWlyZSgnLi9mdXp6eS1wcm92aWRlcicpIH1cbiAgICAgICAgdGhpcy5kZWZhdWx0UHJvdmlkZXIgPSBuZXcgRnV6enlQcm92aWRlcigpXG4gICAgICB9XG4gICAgICB0aGlzLmRlZmF1bHRQcm92aWRlclJlZ2lzdHJhdGlvbiA9IHRoaXMucmVnaXN0ZXJQcm92aWRlcih0aGlzLmRlZmF1bHRQcm92aWRlcilcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMuZGVmYXVsdFByb3ZpZGVyUmVnaXN0cmF0aW9uKSB7XG4gICAgICAgIHRoaXMuZGVmYXVsdFByb3ZpZGVyUmVnaXN0cmF0aW9uLmRpc3Bvc2UoKVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZGVmYXVsdFByb3ZpZGVyKSB7XG4gICAgICAgIHRoaXMuZGVmYXVsdFByb3ZpZGVyLmRpc3Bvc2UoKVxuICAgICAgfVxuICAgICAgdGhpcy5kZWZhdWx0UHJvdmlkZXJSZWdpc3RyYXRpb24gPSBudWxsXG4gICAgICB0aGlzLmRlZmF1bHRQcm92aWRlciA9IG51bGxcbiAgICB9XG4gIH1cblxuICBzZXRHbG9iYWxCbGFja2xpc3QgKGdsb2JhbEJsYWNrbGlzdCkge1xuICAgIHRoaXMuZ2xvYmFsQmxhY2tsaXN0U2VsZWN0b3JzID0gbnVsbFxuICAgIGlmIChnbG9iYWxCbGFja2xpc3QgJiYgZ2xvYmFsQmxhY2tsaXN0Lmxlbmd0aCkge1xuICAgICAgdGhpcy5nbG9iYWxCbGFja2xpc3RTZWxlY3RvcnMgPSBTZWxlY3Rvci5jcmVhdGUoZ2xvYmFsQmxhY2tsaXN0KVxuICAgIH1cbiAgfVxuXG4gIGlzVmFsaWRQcm92aWRlciAocHJvdmlkZXIsIGFwaVZlcnNpb24pIHtcbiAgICAvLyBUT0RPIEFQSTogQ2hlY2sgYmFzZWQgb24gdGhlIGFwaVZlcnNpb25cbiAgICBpZiAoc2VtdmVyLnNhdGlzZmllcyhhcGlWZXJzaW9uLCAnPj0yLjAuMCcpKSB7XG4gICAgICByZXR1cm4gKHByb3ZpZGVyICE9IG51bGwpICYmXG4gICAgICBpc0Z1bmN0aW9uKHByb3ZpZGVyLmdldFN1Z2dlc3Rpb25zKSAmJlxuICAgICAgKChpc1N0cmluZyhwcm92aWRlci5zZWxlY3RvcikgJiYgISFwcm92aWRlci5zZWxlY3Rvci5sZW5ndGgpIHx8XG4gICAgICAgKGlzU3RyaW5nKHByb3ZpZGVyLnNjb3BlU2VsZWN0b3IpICYmICEhcHJvdmlkZXIuc2NvcGVTZWxlY3Rvci5sZW5ndGgpKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gKHByb3ZpZGVyICE9IG51bGwpICYmIGlzRnVuY3Rpb24ocHJvdmlkZXIucmVxdWVzdEhhbmRsZXIpICYmIGlzU3RyaW5nKHByb3ZpZGVyLnNlbGVjdG9yKSAmJiAhIXByb3ZpZGVyLnNlbGVjdG9yLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIG1ldGFkYXRhRm9yUHJvdmlkZXIgKHByb3ZpZGVyKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvdmlkZXJNZXRhZGF0YSA9IHRoaXMucHJvdmlkZXJzW2ldXG4gICAgICBpZiAocHJvdmlkZXJNZXRhZGF0YS5wcm92aWRlciA9PT0gcHJvdmlkZXIpIHsgcmV0dXJuIHByb3ZpZGVyTWV0YWRhdGEgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgYXBpVmVyc2lvbkZvclByb3ZpZGVyIChwcm92aWRlcikge1xuICAgIGlmICh0aGlzLm1ldGFkYXRhRm9yUHJvdmlkZXIocHJvdmlkZXIpICYmIHRoaXMubWV0YWRhdGFGb3JQcm92aWRlcihwcm92aWRlcikuYXBpVmVyc2lvbikge1xuICAgICAgcmV0dXJuIHRoaXMubWV0YWRhdGFGb3JQcm92aWRlcihwcm92aWRlcikuYXBpVmVyc2lvblxuICAgIH1cbiAgfVxuXG4gIGlzUHJvdmlkZXJSZWdpc3RlcmVkIChwcm92aWRlcikge1xuICAgIHJldHVybiAodGhpcy5tZXRhZGF0YUZvclByb3ZpZGVyKHByb3ZpZGVyKSAhPSBudWxsKVxuICB9XG5cbiAgYWRkUHJvdmlkZXIgKHByb3ZpZGVyLCBhcGlWZXJzaW9uID0gJzMuMC4wJykge1xuICAgIGlmICh0aGlzLmlzUHJvdmlkZXJSZWdpc3RlcmVkKHByb3ZpZGVyKSkgeyByZXR1cm4gfVxuICAgIGlmICh0eXBlb2YgUHJvdmlkZXJNZXRhZGF0YSA9PT0gJ3VuZGVmaW5lZCcgfHwgUHJvdmlkZXJNZXRhZGF0YSA9PT0gbnVsbCkgeyBQcm92aWRlck1ldGFkYXRhID0gcmVxdWlyZSgnLi9wcm92aWRlci1tZXRhZGF0YScpIH1cbiAgICB0aGlzLnByb3ZpZGVycy5wdXNoKG5ldyBQcm92aWRlck1ldGFkYXRhKHByb3ZpZGVyLCBhcGlWZXJzaW9uKSlcbiAgICBpZiAocHJvdmlkZXIuZGlzcG9zZSAhPSBudWxsKSB7IHJldHVybiB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHByb3ZpZGVyKSB9XG4gIH1cblxuICByZW1vdmVQcm92aWRlciAocHJvdmlkZXIpIHtcbiAgICBpZiAoIXRoaXMucHJvdmlkZXJzKSB7IHJldHVybiB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvdmlkZXJNZXRhZGF0YSA9IHRoaXMucHJvdmlkZXJzW2ldXG4gICAgICBpZiAocHJvdmlkZXJNZXRhZGF0YS5wcm92aWRlciA9PT0gcHJvdmlkZXIpIHtcbiAgICAgICAgdGhpcy5wcm92aWRlcnMuc3BsaWNlKGksIDEpXG4gICAgICAgIGJyZWFrXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwcm92aWRlci5kaXNwb3NlICE9IG51bGwpIHtcbiAgICAgIGlmICh0aGlzLnN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLnJlbW92ZShwcm92aWRlcilcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZWdpc3RlclByb3ZpZGVyIChwcm92aWRlciwgYXBpVmVyc2lvbiA9ICczLjAuMCcpIHtcbiAgICBpZiAocHJvdmlkZXIgPT0gbnVsbCkgeyByZXR1cm4gfVxuXG4gICAgcHJvdmlkZXJbQVBJX1ZFUlNJT05dID0gYXBpVmVyc2lvblxuXG4gICAgY29uc3QgYXBpSXMyMDAgPSBzZW12ZXIuc2F0aXNmaWVzKGFwaVZlcnNpb24sICc+PTIuMC4wJylcbiAgICBjb25zdCBhcGlJczMwMCA9IHNlbXZlci5zYXRpc2ZpZXMoYXBpVmVyc2lvbiwgJz49My4wLjAnKVxuXG4gICAgaWYgKGFwaUlzMjAwKSB7XG4gICAgICBpZiAoKHByb3ZpZGVyLmlkICE9IG51bGwpICYmIHByb3ZpZGVyICE9PSB0aGlzLmRlZmF1bHRQcm92aWRlcikge1xuICAgICAgICBpZiAodHlwZW9mIGdyaW0gPT09ICd1bmRlZmluZWQnIHx8IGdyaW0gPT09IG51bGwpIHsgZ3JpbSA9IHJlcXVpcmUoJ2dyaW0nKSB9XG4gICAgICAgIGdyaW0uZGVwcmVjYXRlKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xuY29udGFpbnMgYW4gXFxgaWRcXGAgcHJvcGVydHkuXG5BbiBcXGBpZFxcYCBhdHRyaWJ1dGUgb24geW91ciBwcm92aWRlciBpcyBubyBsb25nZXIgbmVjZXNzYXJ5LlxuU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1wbHVzL3dpa2kvUHJvdmlkZXItQVBJYFxuICAgICAgICApXG4gICAgICB9XG4gICAgICBpZiAocHJvdmlkZXIucmVxdWVzdEhhbmRsZXIgIT0gbnVsbCkge1xuICAgICAgICBpZiAodHlwZW9mIGdyaW0gPT09ICd1bmRlZmluZWQnIHx8IGdyaW0gPT09IG51bGwpIHsgZ3JpbSA9IHJlcXVpcmUoJ2dyaW0nKSB9XG4gICAgICAgIGdyaW0uZGVwcmVjYXRlKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xuY29udGFpbnMgYSBcXGByZXF1ZXN0SGFuZGxlclxcYCBwcm9wZXJ0eS5cblxcYHJlcXVlc3RIYW5kbGVyXFxgIGhhcyBiZWVuIHJlbmFtZWQgdG8gXFxgZ2V0U3VnZ2VzdGlvbnNcXGAuXG5TZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXV0b2NvbXBsZXRlLXBsdXMvd2lraS9Qcm92aWRlci1BUElgXG4gICAgICAgIClcbiAgICAgIH1cbiAgICAgIGlmIChwcm92aWRlci5ibGFja2xpc3QgIT0gbnVsbCkge1xuICAgICAgICBpZiAodHlwZW9mIGdyaW0gPT09ICd1bmRlZmluZWQnIHx8IGdyaW0gPT09IG51bGwpIHsgZ3JpbSA9IHJlcXVpcmUoJ2dyaW0nKSB9XG4gICAgICAgIGdyaW0uZGVwcmVjYXRlKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xuY29udGFpbnMgYSBcXGBibGFja2xpc3RcXGAgcHJvcGVydHkuXG5cXGBibGFja2xpc3RcXGAgaGFzIGJlZW4gcmVuYW1lZCB0byBcXGBkaXNhYmxlRm9yU2NvcGVTZWxlY3RvclxcYC5cblNlZSBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9hdXRvY29tcGxldGUtcGx1cy93aWtpL1Byb3ZpZGVyLUFQSWBcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChhcGlJczMwMCkge1xuICAgICAgaWYgKHByb3ZpZGVyLnNlbGVjdG9yICE9IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBdXRvY29tcGxldGUgcHJvdmlkZXIgJyR7cHJvdmlkZXIuY29uc3RydWN0b3IubmFtZX0oJHtwcm92aWRlci5pZH0pJ1xuc3BlY2lmaWVzIFxcYHNlbGVjdG9yXFxgIGluc3RlYWQgb2YgdGhlIFxcYHNjb3BlU2VsZWN0b3JcXGAgYXR0cmlidXRlLlxuU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F1dG9jb21wbGV0ZS1wbHVzL3dpa2kvUHJvdmlkZXItQVBJLmApXG4gICAgICB9XG5cbiAgICAgIGlmIChwcm92aWRlci5kaXNhYmxlRm9yU2VsZWN0b3IgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEF1dG9jb21wbGV0ZSBwcm92aWRlciAnJHtwcm92aWRlci5jb25zdHJ1Y3Rvci5uYW1lfSgke3Byb3ZpZGVyLmlkfSknXG5zcGVjaWZpZXMgXFxgZGlzYWJsZUZvclNlbGVjdG9yXFxgIGluc3RlYWQgb2YgdGhlIFxcYGRpc2FibGVGb3JTY29wZVNlbGVjdG9yXFxgXG5hdHRyaWJ1dGUuXG5TZWUgaHR0cHM6Ly9naXRodWIuY29tL2F0b20vYXV0b2NvbXBsZXRlLXBsdXMvd2lraS9Qcm92aWRlci1BUEkuYClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaXNWYWxpZFByb3ZpZGVyKHByb3ZpZGVyLCBhcGlWZXJzaW9uKSkge1xuICAgICAgY29uc29sZS53YXJuKGBQcm92aWRlciAke3Byb3ZpZGVyLmNvbnN0cnVjdG9yLm5hbWV9IGlzIG5vdCB2YWxpZGAsIHByb3ZpZGVyKVxuICAgICAgcmV0dXJuIG5ldyBEaXNwb3NhYmxlKClcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc1Byb3ZpZGVyUmVnaXN0ZXJlZChwcm92aWRlcikpIHsgcmV0dXJuIH1cblxuICAgIHRoaXMuYWRkUHJvdmlkZXIocHJvdmlkZXIsIGFwaVZlcnNpb24pXG5cbiAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IERpc3Bvc2FibGUoKCkgPT4ge1xuICAgICAgdGhpcy5yZW1vdmVQcm92aWRlcihwcm92aWRlcilcbiAgICB9KVxuXG4gICAgLy8gV2hlbiB0aGUgcHJvdmlkZXIgaXMgZGlzcG9zZWQsIHJlbW92ZSBpdHMgcmVnaXN0cmF0aW9uXG4gICAgY29uc3Qgb3JpZ2luYWxEaXNwb3NlID0gcHJvdmlkZXIuZGlzcG9zZVxuICAgIGlmIChvcmlnaW5hbERpc3Bvc2UpIHtcbiAgICAgIHByb3ZpZGVyLmRpc3Bvc2UgPSAoKSA9PiB7XG4gICAgICAgIG9yaWdpbmFsRGlzcG9zZS5jYWxsKHByb3ZpZGVyKVxuICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkaXNwb3NhYmxlXG4gIH1cbn1cblxuY29uc3Qgc2NvcGVDaGFpbkZvclNjb3BlRGVzY3JpcHRvciA9IChzY29wZURlc2NyaXB0b3IpID0+IHtcbiAgLy8gVE9ETzogbW9zdCBvZiB0aGlzIGlzIHRlbXAgY29kZSB0byB1bmRlcnN0YW5kICMzMDhcbiAgY29uc3QgdHlwZSA9IHR5cGVvZiBzY29wZURlc2NyaXB0b3JcbiAgbGV0IGhhc1Njb3BlQ2hhaW4gPSBmYWxzZVxuICBpZiAodHlwZSA9PT0gJ29iamVjdCcgJiYgc2NvcGVEZXNjcmlwdG9yICYmIHNjb3BlRGVzY3JpcHRvci5nZXRTY29wZUNoYWluKSB7XG4gICAgaGFzU2NvcGVDaGFpbiA9IHRydWVcbiAgfVxuICBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gc2NvcGVEZXNjcmlwdG9yXG4gIH0gZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcgJiYgaGFzU2NvcGVDaGFpbikge1xuICAgIGNvbnN0IHNjb3BlQ2hhaW4gPSBzY29wZURlc2NyaXB0b3IuZ2V0U2NvcGVDaGFpbigpXG4gICAgaWYgKChzY29wZUNoYWluICE9IG51bGwpICYmIChzY29wZUNoYWluLnJlcGxhY2UgPT0gbnVsbCkpIHtcbiAgICAgIGNvbnN0IGpzb24gPSBKU09OLnN0cmluZ2lmeShzY29wZURlc2NyaXB0b3IpXG4gICAgICBjb25zb2xlLmxvZyhzY29wZURlc2NyaXB0b3IsIGpzb24pXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYDAxOiBTY29wZUNoYWluIGlzIG5vdCBjb3JyZWN0IHR5cGU6ICR7dHlwZX07ICR7anNvbn1gKVxuICAgIH1cbiAgICByZXR1cm4gc2NvcGVDaGFpblxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGpzb24gPSBKU09OLnN0cmluZ2lmeShzY29wZURlc2NyaXB0b3IpXG4gICAgY29uc29sZS5sb2coc2NvcGVEZXNjcmlwdG9yLCBqc29uKVxuICAgIHRocm93IG5ldyBFcnJvcihgMDI6IFNjb3BlQ2hhaW4gaXMgbm90IGNvcnJlY3QgdHlwZTogJHt0eXBlfTsgJHtqc29ufWApXG4gIH1cbn1cbiJdfQ==